# HANDOFF — BLACKOUT OPS 1.0 Complete (`release/1.0-complete`)

## Phase A0 — Permanent QA Test Harness (`tools/qa/`, Nov 28, 2026)
- **Harness scripts (`tools/qa/`):**
  - `_common.py`: shared Playwright/Chromium launcher, `boot_game()` (`load` + module-ready check + bundle preloading), baseline loader/diffing, and single-frame WebGL renderer.
  - `mg_audit.py`: deterministic `1/30 s` stepped runner across all 63 minigames (uses `def.qaBot` if present, else LOS aim-bot with ADS + trigger taps) enforcing Plan A0.4 contract items 1, 2, 3, 4, 6, 8 (and 5 under `--check-stars`). Outputs `tools/qa/out/mg_audit.json` & `.md`. Baseline: `21/63` passing on single-seed run (`45` courses in `mg_baseline.json` across 3-seed stochastic union), `0` new failures.
  - `mg_bounds.py`: 8-direction `12 s` sprint walk-out probe on non-rail courses (`52/63` passing/skipped, `11` known escapes/falls). Outputs `tools/qa/out/mg_bounds.json` & `.md`.
  - `mg_hud.py`: inspects `#mg-hud` + `#hud-layer` bounding boxes at `2.0 s` for central `30% x 30%` crosshair safe-zone intersections and `> 4 px` overlaps (`29/63` passing, `34` known). Outputs `tools/qa/out/mg_hud.json` & `.md`.
  - `mg_sheet.py`: captures `1.4 s` spawn screenshots for all 63 courses into 4x4 labelled PNG contact sheets (`tools/qa/out/sheet_01.png`–`sheet_04.png`, gitignored).
  - `ow_content.py`: boots Open World (slot 2) and outputs `tools/qa/out/ow_content.json` & `.md` (baseline: `13` NPCs, `8` attr/skill checks, `50` quests, `5` trigger types, `1/12` unique dungeons, `21` resource nodes, `0` recipes/activities/achievements).
  - `run_all.py`: single gate running `_qa_runner.html` (`30/30`), `_qa_hitboxes.html` (`56/56`), `_qa_owrpg.html` (`143/143`), `69/69` smoke on both `index.html` and `index.bundled.html`, 3-match profiler + GPU flatness (`dGeo=0, dTex=0` across `mp`, `zombies`, `owrpg`, `minigame:range_day`), `mg_audit`, `mg_bounds`, `mg_hud`, and `ow_content` against `tools/qa/mg_baseline.json`.
- **Dev server fix (`server.py`):** raised `ReusableThreadingTCPServer.request_queue_size` from `5` to `256` so unbundled `index.html`'s ~190 parallel `<script defer>` requests never trigger `WSAECONNREFUSED` drops on Windows.
- **ADRs:** `DECISIONS.md` (`ADR-033`).

## Release Snapshot
- **Branch:** `master` (merged `release/1.0-complete` + `origin/master` flagship-2 `#174–#182`).
- **QA Suites:** `_qa_runner.html` (30 checks) + `_qa_owrpg.html` (OWRPG 143 checks including Cartography, 156 hidden sites, Champions & `OWRPGValidator`) + `_qa_hitboxes.html` (56 checks).
- **ADRs:** `DECISIONS.md` (`ADR-001` through `ADR-032`).
- **Merged `origin/master` Flagship-2 Systems:** `MeshProxy.js`, `OWRPGDiscoveryData.js`, `OWRPGCartography.js`, `OWRPGChampions.js`, `OWRPGDiscoveries.js`, `MinigameFeel.js`, `MinigameDaily.js`, and 259 committed `staged_assets/` files.

## GPU Ledger, HUD, Bot AI & Door Pass (Nov 28, 2026)
- **GPU ledger (ADR-030):** `BO.GPULedger` (`src/core/CoreStability.js`) stamps every uploaded geometry/texture with its match; `startMatch` / `exitToMenu` call `sweep()` after `disposeScene()`. Persistent roots are listed in `_collectKept()` — add any new long-lived scene there. Source fixes: `OWRPGInteriors.clear()` disposes, un-keyed `MeshProxy.attach` geometry is `ownedGeometry` (freed by `detach` and teardown), `disposeObject` disposes light shadow maps, `SoldierModel` canvas textures are `sharedAsset`, `BO.Assets.sharedTextures()` replaces the broken `isCachedTex`. Measured: geometry/texture counts are flat across repeated matches in all modes.
- **HUD (ADR-031):** per-frame HUD writes go through `BO.HUD.setText / setHtml / setStyle`. Never write `innerHTML`/`style` of a gated element directly from elsewhere; use the helpers (the hitmarker stays direct on purpose).
- **Bot AI (ADR-032):** 10 Hz staggered target scans; `World._anyRayHit` for occlusion queries. MP simulation 2.3 → 0.4 ms/frame.
- **Main loop:** `_loop` renders every frame; simulation lives in `_simulate(dt)` behind a try/catch, and `_reportFrameError` logs each distinct error once.
- **Zombies doors:** `World.openDoor` keeps the collider/LOS change instant and queues `openingDoors`; `updateAnimatedProps` plays a 0.16 s judder + 0.7 s eased shutter retract with a dust curtain, and `Sound.playDoorOpen(pos)` is the matching spatial clunk/rattle/seat.
- **Cache busting:** `python tools/stamp_versions.py` stamps every `index.html` script/stylesheet with `?v=<sha256[:8]>` (`--check` verifies); run it, then `python tools/bundle.py`, before committing.
- **GLTFLoader:** no longer warns for `KHR_texture_transform.texCoord: 0` (default UV set used by all Kenney kits).

## Performance, Mocap Animation & Spawn Audit (Nov 28, 2026)
- **Rig merge (ADR-028):** `BotAI` and procedural `ZombieEntity` keep `MeshProxy.attachArticulated` on while alive (136 → 54 draw calls per operator, ~65 → ~38 per zombie). Bots return to detail at death and re-merge in `spawnAt`; `destroy()` detaches. The hitbox audit treats `lodDetail` as visible body.
- **UAL presets (ADR-029):** `staged_assets/3d_models/monsters/humanoid-presets.glb` holds 12 Quaternius UAL clips (jog, sprint, scratch, jab, cross, overhead smash, cast, throw, head/chest hits, death with pelvis drop, dance). `HumanoidDriver._samplePresets` layers them; `ATTACK_CLIPS` holds each clip's measured strike time. `Rig.handlesDeath` is a live getter.
- **GPU leak:** `BO.SceneCleanup.disposeObject(root, { keep, detach })` frees a subtree; `PlayerController.rebuildViewmodel` (keeps the cached fist rig) and the main-menu/Gunsmith showcase use it. Geometry count is now flat across weapon swaps and repeated matches.
- **Shader hitches:** `BlackoutApp._precompileScene()` runs `renderer.compile` for the world and viewmodel into the PostFX targets at match start; `renderer.debug.checkShaderErrors` is only on with `?debug=`.
- **Settings:** `_ensureDefaults` runs once per settings object and `applyAccessibility` only writes the DOM when its signature changes (it used to restyle the root on every `Settings.get`).
- **Zombie spawns:** `_pickSpawnPoint`'s last resort no longer offsets the player spawn blindly (Kino trapped bosses/hounds behind the lobby wall); window-incapable enemies spawn on a barrier's interior side, then on unlocked-zone nav waypoints.
- **Headless audit tools** (outside the repo): every mode + all 63 minigames booted and played with zero script errors or 404s; `_qa_runner` 30/30, `_qa_hitboxes` 56/56, `_qa_owrpg` 143/143.

## Open World Ground Cover (Nov 28, 2026)
- `src/owrpg/OWRPGGroundCover.js` (`BO.OWRPGGroundCover`) is a registered Open World system: biome grass, wildflowers, ferns, reeds, heather, scrub, rocks and glowing crystals or embers, streamed in 16 m chunks within the preset radius. `stats` reports chunks, instances and draw calls. Palettes are in `BIOMES`, keyed by region id.
- Placement filters: `isInterior`, water, `roadInfo`, `railDist`, a collider spatial hash (`_blocked`) and settlement POI radii. The layer is hidden inside dungeon interiors.
- Dead trees in `OWRPGWorldArt.js` use a cloned, desaturating material plus per-tree instance tint (`DEAD_TINT`).
- Headless shots: `tools/js/ow_cover.js` (outside the repo) tours regions and prints cover stats.

## Enemy Rigs, Hitboxes & Graphics Pass (Nov 28, 2026)
- `src/graphics/Hitboxes.js` — hit surfaces = visible body (ADR-024). Entities call `BO.Hitboxes.prepare(ent, parts)` once and `collect(ent, out)` per frame; GLB bodies call `fromModel`. Skinned hit groups are re-skinned by `Hitboxes.refresh(ent)`, which `CombatSystem._castTargets` calls for enemies a ray reaches; any other raycaster against skinned enemies should call it first. Mark anything that must never take hits with `userData.noHit` (or `isWeapon` on a weapon root).
- `src/graphics/EnemyRig.js` — GLB animation drivers (ADR-025). Zombie archetype overlays mount through `EnemyRig.mountZombieOverlay`; Open World GLB enemies through `EnemyRig.mount`. `rig.attachWeapon(id)` puts a gun in a GLB hand.
- `src/graphics/SoldierModel.js` — jointed soldier (elbow/knee/ankle pivots), weapon on the torso, two-bone IK hands, `SoldierModel.animate(parts, state, dt)` (aim, recoil, reload, crouch, downed, sprint, pitch). `CharacterMesh.animateSoldier` is the entry point; `animateLimbs` forwards soldiers automatically.
- `src/graphics/SunShadow.js` + `CoreStability.applySceneQualityBudgets` — stable sun shadows and the reversible caster budget (ADR-026).
- `AssetLoader._cloneGLBScene` now copies `animations` onto clones (r149's `clone()` drops them), which is what lets clip-driven models animate at all.
- QA: `_qa_hitboxes.html` (56 checks: silhouette ray audit per enemy family in MP, Zombies, Rogue Lite, TD, Open World and online avatars, plus animation checks).
- **Performance, Animation & Hitbox Accuracy Completion:** Fixed `ZoneWorldPlus` NPC weapon/entity wiring and defender/broker/gated-NPC soldier animations, `SurvivalCampaign` Haven NPC & `GMEconomy` settler idle animations, `TowerDefenseMode` allied soldier & guard-dog bite animations, `OWRPGCombat` decoy animation/material reuse, explicit `dt` propagation to `animateLimbs`, allocation-free `_livingTargets()` / companion targeting loops, `Hitboxes.fromModel` multi-material proxy safety + `HitboxDebug` hidden-chain pruning, `ZoneWild` hitbox disposal, and `sharedAsset` protection in `CoreStability` / `ZoneWorldPlus`.

## 1.0 Feature Modules Added
- `src/data/OWRPGAct2Data.js` & `src/owrpg/OWRPGCompanions.js`: Multi-path Act II–VI questlines across Rust Sprawl, Mire Delta, Ash Quarry, Alpine Array, Meridian Core, and Dragonwilds; 3 Companions (`soren`, `kael`, `torque`) with passive auras & Soldier mesh AI; NPC dawn/day/night schedule labels; territory shifts; New Game+.
- `src/systems/ZoneFinale.js`: Emits `game:survivalEnding` + `survival:ending` into Profile & Operation Blackout progression.
- `src/systems/ModeDepth10.js`: Power-On clue + Zombies map records; TD synergies + next-wave previews; MP AAR 3-map Vote + presets; Survival phase alerts; RPG Floor-5 synergies + debrief insights; Minigames Daily Seeded Challenge + PB Ghost deltas.
- `src/core/ProfileSystem.js`, `src/ui/ProfileHubUI.js`, `css/profile-hub.css`, `src/core/SaveSystem.js` (`v3`): Shared Account Level 1–100, Calling Cards/Emblems/Titles, 3 Daily + 5 Weekly offline challenges, Unified 70-Weapon Armory, Continue Banner, per-mode progress badges, and QA-suppressed first-launch Range Day onboarding.
- `src/net/CoopExtensions.js` & `src/net/NetValidation.js` (`ADR-017`): Rogue Lite 2–4p host snapshots/door voting/hit relay + Minigames Same-Room Versus leaderboard.
- `src/data/CampaignData.js`, `src/systems/CampaignManager.js`, `src/ui/CampaignUI.js`: 10-mission **Operation Blackout** capstone story campaign spanning all 7 modes.
