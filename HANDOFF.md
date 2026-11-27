# HANDOFF — Blackout Ops (Open World RPG "Operation Meridian" + Minigames)

## Snapshot
- **Branch:** `feature/owrpg-minigames-flagship-2` (from `master` @ `c6de59e`). `git log --oneline master..` lists the work.
- **QA:** `_qa_owrpg.html` — 143 / 143. `_qa_runner.html` (whole-game smoke: every mode + all 63 minigames) — 15 / 15.
- **Validator:** `BO.OWRPGValidator.runAll()` — 0 errors, 0 warnings (also checks every hidden-site counter quest is reachable).
- **Perf (headless SwiftShader, 1400×900):** OWRPG frame-budget spot 170 draw calls (target 180); Freestead spawn ~390 (was ~1,760).

## Load order (index.html, additions this pass)
1. `src/graphics/MeshProxy.js` after `CharacterShading.js`.
2. `src/data/OWRPGDiscoveryData.js` after `OWRPGQuestsData.js`.
3. `src/owrpg/OWRPGCartography.js`, `OWRPGChampions.js`, `OWRPGDiscoveries.js` **after** `src/modes/OWRPGMode.js` (they self-register with `OWRPGMode.registerSystem` at load).
4. `src/minigames/MinigameFeel.js`, `MinigameDaily.js` after `MinigameCore.js`.

## OWRPG system registry (new)
`BO.OWRPGMode.registerSystem(sys)` — a system may implement `start(state, scene)`, `stop()`, `update(dt)`, `tick1()`,
`handleKey(code, kb, e) → bool`, `nearest() → { obj, d, text }` and `interact(t)`. Hooks run inside try/catch.
New world features should register here instead of adding lines to `OWRPGMode`.

## Module status
| File | Status | Public surface |
|---|---|---|
| graphics/MeshProxy.js | DONE | attach(root, key), set(lod, far), detach(lod) — merged-per-material far LOD, shared buffers by key |
| owrpg/OWRPGCartography.js | DONE | reveal(x,z,r), isExplored, percent, regionPercent, range, questTarget, drawWorldBase/Fog, atlasHtml; HUD minimap |
| owrpg/OWRPGDiscoveries.js | DONE | generate(seed), sites, isFound, foundCount, typeSummary, nearestUnfound, drawOnMinimap/WorldMap |
| data/OWRPGDiscoveryData.js | DONE | PER_REGION, TYPES (7), BLESSINGS (8), BLESSING_SEC, LORE (24) |
| owrpg/OWRPGChampions.js | DONE | AFFIXES (12), make(agent, n, forced), onSpawn, dealtMult, takenMult, afterDamaged, afterHitPlayer, onKilled, label |
| minigames/MinigameFeel.js | DONE | onKill, onCombo, onComboBreak, onTick, onFinish, onResults, onBossRound, onBossDown, materialOf |
| minigames/MinigameDaily.js | DONE | picks(dateKey), onResults(def,res), rank(got,max), navHtml(...) |
| owrpg/* (previous modules) | DONE | see git history of this file for the original table |

## Save data
- OWRPG schema **v4**: `slot.atlas = { explored (base64 64×64 bitset), found {siteId: playtime}, shrineT {}, champions, trials }`,
  `player.blessing`, `worldFlags.{minimapEnabled, minimapNorthUp, minimapZoom, trackedQuests[]}`. `fill()` backfills old saves.
- Minigames: `BO.Save.data.minigames.daily = { date, done, streak, lastFull }`.

## Numeric world flags written by the new systems (quest counters use `count:<flag>:<n>`)
`explored_pct`, `found_<type>` and `first_<type>` for cache/tome/shrine/shard/vista/cairn/altar, `sites_found`,
`champions_slain`, `first_champion`, `trials_won`.

## Hard invariants
- No ES `import`/`export`. IIFE on `window.BO`.
- Never write `BO.Save.data` keys owned by other modes; OWRPG state lives in `BO.Save.data.owrpg`.
- No `new THREE.Vector3()` in hot per-frame loops where avoidable; use module scratch vectors.
- Keep files < 600 lines (MenuController/WorldBuilder/SurvivalUI and some minigame files predate this rule).
- Assets: only commit files the code references (the local `staged_assets` mirror is ~3 GB). Compress PNG textures with
  palette quantisation (quality 90) before committing.

## Known gaps / next work
- Regions 2–12 still rely on the original quest set plus the self-starting exploration quests; more authored faction quests per region would deepen them.
- Some minigame course files keep module-level geometry caches (~1,100 geometries resident after 40 back-to-back runs); textures are now released.
- Heaviest minigames by draw calls: `sr_gauntlet` (~1,700), `mansion_raid`, `fun_snowboarding`, `fun_prophunt`, `heli_gunner` (~1,000–1,250). A static-merge pass per course would help.
- Not tested on a real 60 Hz GPU outside headless SwiftShader.

## Bootstrap prompt for the next session
```text
Read HANDOFF.md and DECISIONS.md first. Run _qa_owrpg.html and _qa_runner.html (python server.py, then open them).
New open-world features: register a system with BO.OWRPGMode.registerSystem. Keep the validator at 0 errors.
Update src/data/UpdateLogData.js with one entry per shipped feature before committing.
```
