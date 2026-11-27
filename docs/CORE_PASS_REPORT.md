# BLACKOUT OPS — Core Feel, Performance & Stability Pass Report

**Branch:** `core/feel-perf-stability` (from `polish/cosmetic-pass`)  
**Hardware / Environment:** `1280×720` · ANGLE (NVIDIA GeForce RTX 5060 Ti Direct3D11) · `server.py` (`127.0.0.1:8765`)

---

## 1. Baseline vs. Final Measurements

### Static & Load Footprint
| Metric | Baseline | Final | Notes |
|---|---|---|---|
| `index.html` `<script>` tags | 205 | TBD | Dev path preserves all unbundled `<script defer>` tags; `index.bundled.html` splits into core + lazy mode bundles |
| Total `src/*.js` uncompressed | 8,138.4 KB | TBD | |
| Total `css/*.css` uncompressed | 433.5 KB | TBD | |
| Total `assets/` size | 11 files · 818.9 KB | TBD | |
| Core menu bundle requests | 205 | TBD | Measured via `tools/bundle.py` & `BundleLoader.js` |

### Runtime Mode Benchmarks (Baseline Recorded `2026-11-27`)
| Mode / Suite | Map / Context | Baseline Result / FPS | Baseline Draw Calls / Frame Time | Final Result / FPS | Final Draw Calls / p95 |
|---|---|---|---|---|---|
| `_qa_runner.html` | Core + Regression Suite | `3 / 4 PASSED` (`'bosses'` legend tab TypeError) | — | TBD | — |
| `_qa_owrpg.html` | Open World RPG Suite | `120 / 120 PASSED`, `Validator: 0 errors` | `171 calls`, `3.9 ms` median | TBD | TBD |
| **Zombies** | Der Bunker (`1280×720`) | `180 FPS` settled | Measured via `PerfOverlay` post-step 2 | TBD | TBD |
| **Survival** | Crash Valley (`1280×720`) | `106–122 FPS` settled (lowest FPS mode) | 1,026 markers, `NodeBatch` 24m cells | TBD | TBD |
| **Tower Defense** | Castle 1 (`1280×720`) | `162–180 FPS` settled | — | TBD | TBD |
| **Multiplayer** | TDM · Nuketown BO1 (`1280×720`) | `115–120 FPS` settled | — | TBD | TBD |
| **Rogue Lite** | Floor 1 (`1280×720`) | `180 FPS` settled | — | TBD | TBD |

---

## 2. Gameplay Tuning Changes (`old → new`)

*(Populated cleanly as feel & stability fixes are committed.)*

---

## 3. Bug Sweep & Stability Fixes

*(Populated cleanly as catches, edge cases, netcode, save, and QA fixes are verified.)*
