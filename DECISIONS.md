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

## ADR-011 — Far LOD by merging rigs, not by simpler models
**Context:** Soldier rigs are ~135 meshes; a town of 13 NPCs cost ~1,760 draw calls.
**Decision:** `MeshProxy` bakes a rig into one mesh per material (cached by key) and swaps it in beyond 7 m (NPCs) / 28 m (agents). Detail meshes stay in the scene, hidden, so hit detection is untouched.
**Consequence:** No new art needed; any Group-based rig or static GLB prop can use it (Discoveries bakes its GLBs permanently).

## ADR-012 — Fog-aware culling instead of a far plane
**Decision:** Terrain chunks, merged box batches, loose static meshes and pylons beyond the distance where exp² fog leaves < 1% visible (`2.15 / density`) are hidden; recomputed every second or immediately after a > 24 m move.
**Consequence:** The horizon looks identical (it was already fog); the cull list is snapshotted at world build so FX meshes are never captured.

## ADR-013 — Hidden sites are generated, not authored
**Decision:** `OWRPGDiscoveries.generate(seed)` places 156 sites from terrain rules (region, slope, water, clearance) with a seeded RNG and a relaxed second pass. Only `atlas.found` is saved.
**Consequence:** Every save sees the same world; the validator re-runs generation and fails if a counter quest asks for more sites than exist.

## ADR-014 — Minigame upgrades go through shared layers
**Decision:** Cross-cutting improvements (sampled impacts, announcer, daily featured, GPU release) live in `MinigameFeel` / `MinigameDaily` / `MinigameCore` hooks rather than in 63 course files.
**Consequence:** One change upgrades every course; courses opt out or override with `def.feel`.

## ADR-015 — Dev-only mode concatenation & lazy `BundleLoader`
**Decision:** Keep unbundled `index.html` as the canonical source of truth (ADR-002). Provide a Python stdlib script (`tools/bundle.py`) that emits concatenated IIFE bundles (`vendor`, `core`, `survival`, `rpg`, `owrpg`, `minigames`) into `dist/bundles/` plus `index.bundled.html`, using `BO.BundleLoader` capture-phase menu hooks and `startMatch` guards to lazy-load non-core modes via dynamic `<script>`.
**Consequence:** Initial boot shrinks from 220+ script requests to 2 requests with zero runtime bundler dependencies and 100% compatibility with `file://` and GitHub Pages. `WorldCore.js` and `SpatialHash.js` remain in `core` because `WorldBuilder.js` and `OWRPGWorldData.js` depend on them outside Survival.

## ADR-016 — Graphics Quality Presets, Scene Shadow Budget & `PerfOverlay`
**Decision:** Define four explicit presets (`low`, `medium`, `high`, `ultra`) in `Settings.js` with first-launch GPU/memory heuristic detection (`detectQualityPreset`), enforce `maxShadowCasters` and `camera.far` via `BO.SceneCleanup.applySceneQualityBudgets`, and report true cumulative frame draw calls in `BO.PerfOverlay` using `renderer.info.autoReset = false` and explicit per-frame reset/sample around `World` + `Viewmodel` + `PostFX`.
**Consequence:** Prevents shadow-pass draw-call explosion on prop-heavy maps (`MP Nuketown` dropped from 3,120 to 1,336 draw calls on Medium) while keeping hardware-specific visual fidelity configurable.

## ADR-017 — Survival `SpatialHash` & Simulation Tier Throttling
**Decision:** Replace per-frame linear scans across Exclusion Zone's 1,000+ markers and entities with `BO.SpatialHash` (`12 m` cell), dirty-flagged `_targetsDirty` pooling in `SurvivalMode`, `48 m` `NodeBatch` cells, 2 Hz landmark scans, and 10 Hz subsystem ticks mirroring ADR-005.
**Consequence:** Eliminates GC churn and O(N) marker scan bottlenecks while maintaining full 60+ FPS responsiveness during open-world play and hordes.

## ADR-018 — Atomic `SaveSystem` v3 with Rotating Backups
**Decision:** Bump save schema to `version: 3` with explicit forward `MIGRATIONS` (`0 -> 1 -> 2 -> 3`), stage writes through a temporary verification key (`_tmp`) before swapping primary storage, rotate 3 backup keys (`_bak0.._bak2`), auto-recover corrupt primary saves with a visible toast, detect quota/private-mode degradation, and enforce slice ownership via `assertSliceOwner`.
**Consequence:** Player progression survives interrupted writes or malformed edits cleanly, and users can export/import full JSON backups from Settings › Save.

## ADR-019 — Netcode Validation, Jitter Buffering & Resilience
**Decision:** Place packet schema/bounds checks, per-peer rate limiting, `JitterBuffer` (`80 ms` interp / `150 ms` extrap cap), `DeltaCodec`, `LagHistory`, and a deterministic `MockNetChannel` into `src/net/NetValidation.js` ahead of `NetworkManager.js`. Add a 10 s signaling timeout and 3-attempt exponential-backoff reconnect handler.
**Consequence:** Malformed or flooded packets cannot corrupt simulation state, remote avatars smooth over WebRTC jitter without per-frame vector allocations, and offline 2-peer regression tests run deterministically in `_qa_runner.html`.

## ADR-020 — Unified Automated QA Suites (`_qa_runner.html` & `_qa_owrpg.html`)
**Decision:** Maintain `_qa_runner.html` (`30/30` general engine, Survival, Zombies, MP, TD, RPG, Minigames, save, net, ProfileSystem, ModeDepth10, and Operation Blackout checks) alongside `_qa_owrpg.html` (OWRPG world/quests/cartography/discoveries/champions/validator), preserving all user localStorage state across test runs.
**Consequence:** Both suites run end-to-end in Chromium against `index.html` cleanly without mutating real saves.

## ADR-021 — Online Co-op Scope for 1.0 (`CoopExtensions.js`)
**Decision:** Support WebRTC P2P + `BroadcastChannel` co-op/multiplayer in 1.0 for **Zombies** (up to 8p), **Tower Defense** (up to 8p), **Multiplayer** (co-op vs bots & PvP), **Rogue Lite** (2–4p host-synced delves, floor/seed replication, gate voting & peer hit relay), and **Minigames** (Same-Room Versus live HUD leaderboard & room-seeded finish boards). Explicitly defer **Survival** and **Open World RPG** co-op post-1.0.
**Consequence:** All arcade & delve modes share instant room invites over `PeerJS`/`BroadcastChannel` cleanly within the zero-server budget, while large persistent chunk/NPC/quest-graph world sync in Survival & OWRPG stays out of 1.0 scope without destabilizing single-player saves.

## ADR-022 — Unified v3 Player Profile & Cross-Mode Event Bus (`ProfileSystem.js`)
**Decision:** Consolidate cross-mode identity (Account Level 1–100, Calling Cards, Emblems, Titles, Offline Seeded 3 Daily / 5 Weekly Challenges, Unified Weapon Armory, and Last-Played Continue Banner) in a dedicated `BO.Save.data.profile` slice (`CURRENT_VERSION = 3`) guarded via `assertSliceOwner('profile', 'ProfileSystem')` and fed purely by event-bus listeners (`game:modeStart`, `match:ended`, `owrpg:quest`, `game:survivalEnding`, `game:minigameDaily`).
**Consequence:** Every mode advances account rank and cosmetic identity cleanly without writing directly into any other mode's private save slice.

## ADR-023 — Operation Blackout Capstone Architecture (`CampaignData.js` / `CampaignManager.js`)
**Decision:** Implement **Operation Blackout** as a 10-mission sequential cross-mode campaign driving the 7 existing game modes rather than building a bespoke single-use campaign engine, persisting campaign progress inside `BO.Save.data.profile.campaign`.
**Consequence:** New and returning players experience a structured 10-mission progression arc across Minigames, Multiplayer, Zombies, Tower Defense, Survival, Rogue Lite, and Open World RPG while reusing ~95% of tested gameplay systems.

## ADR-024 — Hit Surfaces Are What You See (`Hitboxes.js`)
**Decision:** One module owns enemy hit volumes for every mode. Procedural rigs (soldiers, zombies, hounds, online avatars) tag every visible body mesh as a hit surface, zoned by the rig part it hangs from (head group → head, arm/leg chains → limb, everything else → torso); held weapons, auras, halos, contact shadows and additive/translucent effects never count. Hidden parts never count (Three.js r149's raycaster ignores visibility, so `collect()` walks the parent chain), except MeshProxy far-LOD detail, which is flagged `lodDetail`. GLB bodies use their rigid parts directly; skinned meshes get per-bone hit groups (dominant skin weight, fingers/toes folded into hand/foot) over a per-instance CPU-skinned copy of their vertices, re-skinned from the live skeleton only when a ray reaches the entity (≤ once per frame). `CombatSystem._castTargets()` adds an entity bounding-sphere broad-phase so the larger surface counts cost nothing.
**Consequence:** A shot that visibly lands registers, a shot through empty space doesn't, and the audit page `_qa_hitboxes.html` can prove it per enemy with a ray grid (limits: ≤2% miss / ≤2% ghost on procedural and skinned rigs; measured 0.0% worst-case miss).

## ADR-025 — GLB Enemy Animation Through Pluggable Drivers (`EnemyRig.js`)
**Decision:** Every GLB enemy body is driven by a `Rig` holding one of three drivers chosen from the asset: `ClipDriver` (Kenney kits: named clips, legs and upper body split so attacks and aiming overlay locomotion, playback rate tied to ground speed, death clip), `HumanoidDriver` (skinned UE-mannequin skeletons with no clips, e.g. Imp and Puglin: relaxed rest pose derived from the bind T-pose, then character-space bone deltas for walk/run, attacks, flinch by zone, stun, dance and death) and `BobDriver` (rigid props). `CharacterMesh.animateLimbs` forwards to `parts.glbRig`, so every mode's existing animation call sites drive GLB bodies without changes.
**Consequence:** Open World, Zombies, Rogue Lite and Tower Defense share one animation path for imported models; adding a model with clips or a standard skeleton needs no new code.

## ADR-026 — Shadow-Caster Budget and Stable Sun Shadows (`CoreStability.js`, `SunShadow.js`)
**Decision:** `maxShadowCasters` stays the per-preset count of shadow-casting lights; the mesh budget is a separate `shadowCasterBudget` (Medium 450 / High 1600 / Ultra 4000, largest first, above `shadowCasterMinRadius`) that remembers each mesh's authored flag so it is reversible. The sun's shadow box frames small maps once and follows the camera on large worlds, biased toward the view direction and snapped to whole shadow texels in light space.
**Consequence:** Restores world shadows that the 1.0 budget (which capped *meshes* at the light count, 1–3) had removed, gives Survival and the Open World shadows everywhere the player goes, and stops shadow edges crawling while moving.

## ADR-027 — Open World Ground Cover (`OWRPGGroundCover.js`)
**Decision:** Ground cover is a registered Open World system that streams deterministic 16 m chunks around the player (Medium 40 m / High 60 m / Ultra 84 m; off on Low) into one global `InstancedMesh` per plant type, re-packed only when the chunk set changes. Palettes come from `REGIONS`; placement rejects roads, rails, water, slopes, solid colliders (spatial hash) and settlement radii. Wind, player push-through and edge shrink-fade run in the vertex shader; palette hexes are converted to linear because the renderer outputs sRGB. Chunk generation is time-budgeted at 2.5 ms per frame.
**Consequence:** Every biome reads differently underfoot for at most seven extra draw calls and no shadow-pass cost. Dead trees (`graveyard_kit/trunk.glb`) get their own desaturating material with per-region instance tints, since a multiplied tint alone kept the atlas orange.
