# BLACKOUT OPS — Prompt 2: Core Feel, Performance & Stability Pass Report

**Branch:** `core/feel-perf-stability` (cut from `polish/cosmetic-pass`)
**Date:** Nov 27, 2026
**Test Environment:** Windows · Chromium WebView (`1280×720`) · NVIDIA GeForce RTX 5060 Ti (ANGLE D3D11) · `python server.py --no-open --port 8765`

---

## 1. Before / After Telemetry & Performance Metrics

### Cold Load & Asset Footprint
| Metric | Before (Unbundled `index.html`) | After (Bundled `index.bundled.html` + `BundleLoader`) | Delta |
|---|---:|---:|---:|
| Initial Boot HTTP Script Requests | 209–212 `<script defer>` tags | **2 requests** (`vendor.bundle.js` + `core.bundle.js`) | **-99% requests** |
| Initial Boot JS Payload (raw / gzip) | ~8,954 KB raw / ~2,223.3 KB gz total | **3,785.1 KB raw / 859.7 KB gz** initial | **-61.3% initial gz** |
| Lazy Mode Bundles (`tools/bundle.py`) | Loaded eagerly on every boot | `rpg` (110.6 KB gz), `owrpg` (137.2 KB gz), `survival` (503.7 KB gz), `minigames` (612.1 KB gz) | Loaded on demand |
| Static `assets/` Footprint | 11 files, 818.9 KB | 11 files, 818.9 KB | Verified |

### Per-Mode Settled Frame Performance (`medium` Quality Preset, Full Pipeline w/ PostFX & Shadows)
Note: Baseline settled FPS was sampled on `index.html` at 1280×720; After telemetry was sampled on `index.bundled.html` at Medium quality with `PerfOverlay` active (cumulative `World + Viewmodel + PostFX` draw calls and `P95` frame times enabled after shadow-caster budget enforcement).

| Mode / Scene | Baseline FPS | After FPS | After AVG (ms) | After P95 (ms) | Cumulative DRAW (Before Cap -> After Cap) | GEO / TEX / HEAP |
|---|---:|---:|---:|---:|---:|---|
| Main Menu Showcase | — | **150 FPS** | 6.7 ms | 7.1 ms | 65 | 58g / 19t / 62 MB |
| Survival (`exclusion_zone`) | 106–122 FPS | **121 FPS** | 8.3 ms | 14.0 ms | 1,220 -> **1,152** | 848g / 94t / 131 MB |
| Zombies (`der_bunker`) | 180 FPS | **143 FPS** | 7.0 ms | 7.6 ms | **504** | 565g / 111t / 90 MB |
| Tower Defense (`td_castle_1`) | 162–180 FPS | **148 FPS** | 6.7 ms | 7.1 ms | **383** | 580g / 109t / 61 MB |
| Multiplayer (`mp_nuketown` TDM) | 115–120 FPS | **138 FPS** | 7.2 ms | 13.6 ms | 3,120 -> **1,336** (-57%) | 515g / 113t / 86 MB |
| Rogue Lite (`rpg` Floor 1) | 180 FPS | **150 FPS** | 6.7 ms | 7.1 ms | **627** | 782g / 157t / 63 MB |
| Open World RPG (`meridian`, Slot 1) | 160–180 (scene) | **150 FPS** | 6.7 ms | 7.1 ms | 1,725 -> **1,197** (-31%) | 563g / 145t / 141 MB |

> In `_qa_owrpg.html` (direct world scene render pass per ADR-010): **160 draw calls** (`< 180` target) and **3.5 ms** median frame cost (`2.2–3.5 ms` across runs).

---

## 2. QA & Verification Suite Results

| Suite | Baseline | Final | Details |
|---|---:|---:|---|
| `_qa_runner.html` | 3/4 PASSED (halted on `'bosses'`) | **24/24 PASSED** | 0 console errors; localStorage cleanly restored |
| `_qa_owrpg.html` | 120/120 PASSED (`171 calls`, `3.9 ms`) | **120/120 PASSED** | Validator **0 errors** (0 warnings), **160 calls**, **3.5 ms** |
| `index.bundled.html` | N/A | **Clean Boot (0 errors)** | Verified lazy HTTP 200 loading of `minigames.bundle.js` & `survival.bundle.js` |

New automated regression suites added to `_qa_runner.html`:
- Mode smoke & GPU cleanup cycle across Zombies / MP / TD / RPG / Minigame (`x2` full passes, 0 errors).
- Frame-rate `dt`-invariance test across `30 / 60 / 144 / 240 Hz` (`dv = 0.000000`).
- Minigame seeded determinism (`BO.MinigameHelpers.createRng(1337)` & `MinigameCore` `opts.seed = 9001`).
- Soldier (`11` hit parts / `1.80m`) & Zombie (`10` hit parts / `1.79m`) hitbox integrity regression.
- `SaveSystem` v1 → v2 migration, atomic `_tmp` + 3 rotating backup files, and corruption auto-recovery (`QA-V1`).
- 2-Peer `MockNetChannel` simulation (`150 ms` latency + `2%` packet loss): `77` delivered, `2` malformed rejected, `JitterBuffer` converged to `x = 15.08`, `DeltaCodec` round-trip verified.

---

## 3. Gameplay & Engine Tuning Log (`old -> new`)

| System & File | Old Value | New Value | Reason |
|---|---|---|---|
| `src/systems/NodeBatch.js` | `CELL = 24` m, fixed visibility radius | `CELL = 48` m + preset `nodeViewRadius` | Cuts chunk churn & distant node overdraw in Exclusion Zone |
| `src/modes/SurvivalMode.js` | Per-frame full marker/target scans & full subsystem ticks | `SpatialHash(12)` + dirty `_targetsDirty` pool + 10 Hz subsystem / 2 Hz landmark scan | Eliminates per-frame O(N) scans across 1,000+ markers & entities |
| `src/graphics/TextureFactory.js` | Unclamped anisotropic filtering (`4`–`16`) | Preset-clamped anisotropy (`low: 2`, `medium: 4`, `high/ultra: 8`) | Reduces GPU sampler bandwidth on mid/low hardware |
| `src/core/CoreStability.js` | All scene boxes/props cast shadows regardless of preset | `applySceneQualityBudgets()` disables `castShadow` on small meshes (`r < 1.35 m`) and beyond `maxShadowCasters` | Cuts MP draw calls by 57% (3,120 → 1,336) & OWRPG by 31% (1,725 → 1,197) |
| `src/modes/MultiplayerMode.js` | `_pickBestSpawn` LOS penalty `-28`, no `< 14 m` trap penalty | LOS penalty `-55` + `-45` penalty when `minEnemyDist < 14 m` | Prevents spawn traps while keeping fallback spawns finite |
| `src/entities/ZombieEntity.js` | Stuck nudge threshold `1.8 s`, `moved < 0.30 m` | Stuck threshold `1.35 s`, `moved < 0.28 m` + zero-alloc `crowd_edge` count | Unsticks zombies from barricades/doorframes faster without jitter |
| `src/core/Settings.js` | Fixed legacy quality tiers | 4 explicit presets (`low`/`medium`/`high`/`ultra`) + first-launch `detectQualityPreset()` + `showPerfOverlay` + `gamepadAimAssist` | Gives consistent defaults across integrated and discrete GPUs |

---

## 4. Bugs Fixed & Architectural Improvements

1. **Retired `'bosses'` Mode Guide Crash (`CoreStability.js`)**: Wrapped `BO.Menus.renderLegend` so invalid/retired `legendTab` keys safely fall back to the first registered `ModeGuide` tab (`_qa_runner.html` unblocked cleanly).
2. **Survival `woodDoor` / `ironDoor` / `doubleGate` Missing Collider (`SurvivalCampaign.js:355`)**: Placed hinged doors previously lacked `piece.part.collider`, so opening/closing did not toggle physical collision (`colAct=false` fixed).
3. **OWRPG Unused HUD Plates & Gear Dock (`HUDController.js`)**: Removed `• PLATES [4]` text in `owrpg`/`rpg`/no-armor minigames and force-hid `.gear-dock` (`display: none` + `.hidden`) in `owrpg`/`rpg`.
4. **Minigame Seed Forwarding (`MinigameCore.js:665`)**: Forwarded top-level `opts.seed` into session initialization alongside `MinigameHelpers.createRng`.
5. **PerfOverlay Cumulative Frame Reporting (`main.js` + `PerfOverlay.js`)**: Switched `renderer.info.autoReset = false` with explicit per-frame reset & end-of-frame sampling so `DRAW` and `TRIS` reflect World + Viewmodel + PostFX passes instead of only the final fullscreen quad.
6. **Zero-Alloc Hot Paths (`PlayerController.js`, `CombatSystem.js`, `SurvivalMode.js`, `FXSystem.js`, `NetworkManager.js`)**: Hoisted module scratch vectors (`_tmpMoveInput`, `_tmpForward`, `_tmpRight`, `_tmpAimRay`, `_tmpTargetPos`, `_tmpHeadPos`, etc.) and pooled target/alive arrays to eliminate per-frame GC churn.
7. **Mode Teardown & Input Reset (`SurvivalMode`, `ZombiesMode`, `TowerDefenseMode`, `MultiplayerMode`, `RPGMode`, `MinigameCore`, `main.js`)**: Hardened `stop()` scene/geometry/texture disposal (`BO.SceneCleanup.disposeScene`), stopped dangling music/timers/prompts, cleared input/gamepad state on `blur` & `visibilitychange`, and reset reload timers cleanly on weapon swap or death.
8. **Gamepad Support (`src/engine/GamepadInput.js`)**: Added W3C standard controller polling with `0.15` radial deadzones, quadratic right-stick look curve, and opt-in ADS aim-assist slowdown (OFF by default).
9. **Netcode Hardening (`src/net/NetValidation.js` + `src/net/NetworkManager.js`)**: Added schema/bounds packet validation, per-peer rate limiting, `JitterBuffer` interpolation, `DeltaCodec`, `LagHistory`, 10 s signaling timeout, exponential-backoff reconnect retries (`3x`), and RTT/quality metrics.
10. **Atomic SaveSystem v2 (`src/core/SaveSystem.js` + `src/ui/UIPolish.js`)**: Added v0/v1 → v2 migrations, `_tmp` atomic write-and-swap, 3 rotating `_bak0.._bak2` backups, automatic corruption recovery notice, quota/private-mode in-memory fallback warning, slice ownership assertions, and Settings › Save `.json` export/import UI.
11. **Dev-Only Mode Bundler (`tools/bundle.py` + `src/core/BundleLoader.js`)**: Emits `dist/bundles/*.bundle.js`, `manifest.json`, and `index.bundled.html` keeping ADR-002 IIFE semantics intact while cutting initial HTTP script requests from 212 to 2 (`859.7 KB gz`) and lazy-loading `survival`, `rpg`, `owrpg`, and `minigames` on demand.
