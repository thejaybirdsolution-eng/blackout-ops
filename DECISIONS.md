# Architectural Decision Records

Decisions that look odd out of context. Read before refactoring.

## ADR-001 — Open World RPG is a separate mode (`owrpg`), not an extension of Rogue Lite (`rpg`)
**Context:** Rogue Lite is single-room delves with unbanked loot; the open world needs persistent world state, factions and dialogue.
**Decision:** New mode key `owrpg`, its own modules under `src/owrpg/`, data under `src/data/OWRPG*.js`, state only in `BO.Save.data.owrpg`.
**Consequence:** The elemental combo idea is reused, but no Rogue Lite code paths are touched.

## ADR-002 — Zero-build IIFE modules
**Decision:** Every file is `(function (BO) { 'use strict'; ... })(window.BO);` loaded with `<script defer>`. No `import`/`export`.
**Consequence:** Works from `file://`, `server.py`, `play.bat` and GitHub Pages. Load order in `index.html` matters.

## ADR-003 — Deterministic dialogue checks
**Decision:** Checks compare attribute / reputation / item thresholds. No percentage rolls.
**Consequence:** Reloading never changes an outcome; locked options show what they need, which doubles as quest hinting.

## ADR-004 — Interiors are sealed spaces off-map (x, z > 700), not separate scenes
**Decision:** Interior geometry is part of the `meridian` box list at (900, 900); hatches teleport the player. `WorldBuilder.resolveHorizontal` already skips terrain clamping beyond the map edge + 200 m.
**Consequence:** One scene, one renderer path, POI streaming works unchanged (the interior is a POI by distance). Lighting switches by `OWRPGWorldData.isInterior()`.

## ADR-005 — Simulation tiers: per-frame / 10 Hz / 1 Hz
**Decision:** Movement, combat and engine AI run per frame; perception and status logic at 10 Hz (`OWRPGAI.tick10`); POI streaming, discovery, encounters and regen at 1 Hz (`OWRPGWorldSim.tick1`).
**Consequence:** Stealth math is frame-rate independent and cheap.

## ADR-006 — Engine AI only drives agents in combat
**Decision:** `BotAI.update` / `ZombieEntity.update` are only called for agents in `combat` (or neutral bots with a rival side nearby). Idle/suspicious/return behaviour is our own simple walker.
**Consequence:** `BotAI` acquires the player on sight at 42 m by itself; gating it is what makes stealth possible.

## ADR-007 — `BotAI.team` encodes the faction-war side, not hostility to the player
**Decision:** Side 0 = Militia/Aegis, side 1 = Raiders/Syndicate/Helix. Player hostility is passed per bot through `context.playerTeam`.
**Consequence:** Contested POIs fight on their own (Militia vs Syndicate at the Quarry) while both stay neutral to the player.

## ADR-008 — Heightfield resolution 2 m (plan said 1 m)
**Decision:** `res: 2` for the 640 m map (321² samples instead of 641²).
**Consequence:** World build ≈ 0.3 s, terrain memory ÷ 4. Walking stays smooth because `Terrain.height` interpolates with the mesh's triangle split.

## ADR-009 — Enemy HP tuned for 0.8–4.5 s trash TTK
**Decision:** Trash HP 90–240, bosses 2200–2400, validated by `OWRPGValidator._ttk` using a sustained-cadence carbine model.
**Consequence:** Raiders take 3–4 body shots or 2 headshots; boss fights lean on reactions and cover.

## ADR-010 — Distance culling for NPCs and props
**Decision:** Named NPCs hide beyond 110 m and props beyond 100 m; landmark struts are one `InstancedMesh`.
**Consequence:** ~160 draw calls in the open, ~180 in town (target 180).

## ADR-011 — Dev-only mode concatenation & lazy `BundleLoader`
**Decision:** Keep unbundled `index.html` as the canonical source of truth (ADR-002). Provide a Python stdlib script (`tools/bundle.py`) that emits concatenated IIFE bundles (`vendor`, `core`, `survival`, `rpg`, `owrpg`, `minigames`) into `dist/bundles/` plus `index.bundled.html`, using `BO.BundleLoader` capture-phase menu hooks and `startMatch` guards to lazy-load non-core modes via dynamic `<script>`.
**Consequence:** Initial boot shrinks from 212 script requests (2,223 KB gz) to 2 requests (859.7 KB gz) with zero runtime bundler dependencies and 100% compatibility with `file://` and GitHub Pages. `WorldCore.js` and `SpatialHash.js` remain in `core` because `WorldBuilder.js` and `OWRPGWorldData.js` depend on them outside Survival.

## ADR-012 — Graphics Quality Presets, Scene Shadow Budget & `PerfOverlay`
**Decision:** Define four explicit presets (`low`, `medium`, `high`, `ultra`) in `Settings.js` with first-launch GPU/memory heuristic detection (`detectQualityPreset`), enforce `maxShadowCasters` and `camera.far` via `BO.SceneCleanup.applySceneQualityBudgets`, and report true cumulative frame draw calls in `BO.PerfOverlay` using `renderer.info.autoReset = false` and explicit per-frame reset/sample around `World` + `Viewmodel` + `PostFX`.
**Consequence:** Prevents shadow-pass draw-call explosion on prop-heavy maps (`MP Nuketown` dropped from 3,120 to 1,336 draw calls on Medium) while keeping hardware-specific visual fidelity configurable.

## ADR-013 — Survival `SpatialHash` & Simulation Tier Throttling
**Decision:** Replace per-frame linear scans across Exclusion Zone's 1,000+ markers and entities with `BO.SpatialHash` (`12 m` cell), dirty-flagged `_targetsDirty` pooling in `SurvivalMode`, `48 m` `NodeBatch` cells, 2 Hz landmark scans, and 10 Hz subsystem ticks mirroring ADR-005.
**Consequence:** Eliminates GC churn and O(N) marker scan bottlenecks while maintaining full 60+ FPS responsiveness during open-world play and hordes.

## ADR-014 — Atomic `SaveSystem` v2 with Rotating Backups
**Decision:** Bump save schema to `version: 2` with explicit forward `MIGRATIONS` (`0 -> 1 -> 2`), stage writes through a temporary verification key (`_tmp`) before swapping primary storage, rotate 3 backup keys (`_bak0.._bak2`), auto-recover corrupt primary saves with a visible toast, detect quota/private-mode degradation, and enforce slice ownership via `assertSliceOwner`.
**Consequence:** Player progression survives interrupted writes or malformed edits cleanly, and users can export/import full JSON backups from Settings › Save.

## ADR-015 — Netcode Validation, Jitter Buffering & Resilience
**Decision:** Place packet schema/bounds checks, per-peer rate limiting, `JitterBuffer` (`80 ms` interp / `150 ms` extrap cap), `DeltaCodec`, `LagHistory`, and a deterministic `MockNetChannel` into `src/net/NetValidation.js` ahead of `NetworkManager.js`. Add a 10 s signaling timeout and 3-attempt exponential-backoff reconnect handler.
**Consequence:** Malformed or flooded packets cannot corrupt simulation state, remote avatars smooth over WebRTC jitter without per-frame vector allocations, and offline 2-peer regression tests run deterministically in `_qa_runner.html`.

## ADR-016 — Unified Automated QA Suite (`_qa_runner.html`)
**Decision:** Keep `_qa_runner.html` (general engine, Survival, Zombies, MP, TD, RPG, Minigames, save, net, dt-invariance, hitboxes) alongside `_qa_owrpg.html` (OWRPG world/quests/validator), preserving all user localStorage state across test runs.
**Consequence:** Both suites run end-to-end in Chromium against `index.html` and reach 100% pass (`24/24` and `120/120`) without mutating real saves.

## ADR-017 — Online Co-op Scope for 1.0 (`CoopExtensions.js`)
**Decision:** Support WebRTC P2P + `BroadcastChannel` co-op/multiplayer in 1.0 for **Zombies** (up to 8p), **Tower Defense** (up to 8p), **Multiplayer** (co-op vs bots & PvP), **Rogue Lite** (2–4p host-synced delves, floor/seed replication, gate voting & peer hit relay), and **Minigames** (Same-Room Versus live HUD leaderboard & room-seeded finish boards). Explicitly defer **Survival** and **Open World RPG** co-op post-1.0.
**Consequence:** All arcade & delve modes share instant room invites over `PeerJS`/`BroadcastChannel` cleanly within the zero-server budget, while large persistent chunk/NPC/quest-graph world sync in Survival & OWRPG stays out of 1.0 scope without destabilizing single-player saves.

## ADR-018 — Unified v3 Player Profile & Cross-Mode Event Bus (`ProfileSystem.js`)
**Decision:** Consolidate cross-mode identity (Account Level 1–100, Calling Cards, Emblems, Titles, Offline Seeded 3 Daily / 5 Weekly Challenges, Unified 70-Weapon Armory, and Last-Played Continue Banner) in a dedicated `BO.Save.data.profile` slice (`CURRENT_VERSION = 3`) guarded via `assertSliceOwner('profile', 'ProfileSystem')` and fed purely by event-bus listeners (`game:modeStart`, `match:ended`, `owrpg:quest`, `game:survivalEnding`, `game:minigameDaily`).
**Consequence:** Every mode advances account rank and cosmetic identity cleanly without writing directly into any other mode's private save slice.

## ADR-019 — Operation Blackout Capstone Architecture (`CampaignData.js` / `CampaignManager.js`)
**Decision:** Implement **Operation Blackout** as a 10-mission sequential cross-mode campaign driving the 7 existing game modes rather than building a bespoke single-use campaign engine, persisting campaign progress inside `BO.Save.data.profile.campaign`.
**Consequence:** New and returning players experience a structured 10-mission progression arc across Minigames, Multiplayer, Zombies, Tower Defense, Survival, Rogue Lite, and Open World RPG while reusing ~95% of tested gameplay systems.
