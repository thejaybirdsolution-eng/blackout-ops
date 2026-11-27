# HANDOFF — Open World RPG ("Operation Meridian", mode `owrpg`)

## Snapshot
- **Branch:** `core/feel-perf-stability` (cut from `polish/cosmetic-pass`). Check `git log -1 --oneline` for the current commit.
- **QA:** `_qa_owrpg.html` — **120 / 120 pass**. `_qa_runner.html` — **24 / 24 pass** (fixed `'bosses'` legend tab guard + aligned Survival 1.0 GM assertions + added mode leak, dt-invariance, minigame seed, hitbox, atomic save, and 2-peer netcode suites).
- **Validator:** `BO.OWRPGValidator.runAll()` — **0 errors**, **0 warnings**.
- **Perf (Chromium, 1280×720):** `_qa_owrpg.html` direct scene **160 draw calls** (`< 180` target), **3.5 ms** median frame cost; live `index.bundled.html` (`medium` quality w/ PostFX) settles at **150 FPS** (`6.7 ms avg / 7.1 ms p95`); save ≈ 5 KB.
- **Bundling & ADRs:** See `DECISIONS.md` (`ADR-011`–`ADR-016`) and `docs/CORE_PASS_REPORT.md`. Keep `WorldCore.js` & `SpatialHash.js` in `core` when updating `tools/bundle.py`.

## Load order (index.html)
1. `css/owrpg.css` after `css/vault-visuals.css`
2. `src/data/OWRPGStatsData.js, OWRPGFactionsData.js, OWRPGWorldData.js, OWRPGDialogueData.js, OWRPGQuestsData.js` after `RPGEncounters.js` (WorldData needs `BO.WorldCore` + `BO.MapsData`)
3. `src/owrpg/OWRPGSave, Character, Factions, Inventory, Quests, Dialogue, Combat, AI, WorldArt, WorldSim, Interiors, Validator` then `src/modes/OWRPGMode.js` after `SurvivalMode.js`
4. `src/ui/OWRPGUI.js, OWRPGPipPad.js` after `RPGUI.js`, before `main.js`

## Integration points in existing files
- `src/main.js` — start/stop/suspend, key routing (`OWRPGMode.handleKey` / `isSuppressed`), modal pause (`OWRPGUI.modalOpen`), update + HUD calls.
- `src/engine/PlayerController.js` — incoming damage, cheat-death, no auto-regen, speed multiplier (4 one-line hooks).
- `src/core/Settings.js` — `ow*` keybinds + "Open World RPG" controls group; `'owrpg'` added to `ALL_MODES`.
- `src/ui/MenuController.js` — `#btn-menu-owrpg` opens slot select. `src/ui/ModeGuide.js` — guide entry. `src/ui/ControlsPanel.js` — mode label.

## Module status
| File | Status | Public surface |
|---|---|---|
| data/OWRPGStatsData.js | DONE | ATTRS, xpToNext, PERK_TREES, STATUSES, REACTIONS, ABILITIES, ENEMIES, ITEMS, AFFIXES, LOOT, perkIndex() |
| data/OWRPGFactionsData.js | DONE | FACTIONS, TIERS, VENDORS |
| data/OWRPGWorldData.js | DONE (Haven Basin full; other regions have hubs/sites, no quests yet) | REGIONS, POIS, NPCS, INTERACTS, PYLONS, LANDMARKS, regionAt, isInterior, isWet; registers map `meridian` |
| data/OWRPGDialogueData.js | DONE (7 NPCs) | TREES |
| data/OWRPGQuestsData.js | DONE (6 quests) | QUESTS |
| owrpg/OWRPGSave.js | DONE | root, migrate, list, read, write, remove, byteSize |
| owrpg/OWRPGCharacter.js | DONE | derived, addXp, perkBlock, takePerk, respec, encumbrance |
| owrpg/OWRPGFactions.js | DONE | rep, tier, add, isHostile, isWary, canTrade, poiOwner |
| owrpg/OWRPGInventory.js | DONE | add, remove, equip, weaponStats, rollLoot (pity), buy, sell, salvage |
| owrpg/OWRPGQuests.js | DONE | start, setStage, complete, onEvent, markers, objective |
| owrpg/OWRPGDialogue.js | DONE | entry, view, choose, check, apply |
| owrpg/OWRPGCombat.js | DONE | onGunHit, damage, applyStatus, detonate, cast, aim |
| owrpg/OWRPGAI.js | DONE | spawn, tick10, update, noise, engage, agentsNear, awareness |
| owrpg/OWRPGWorldArt.js | DONE | populate, animate, setPylonActive |
| owrpg/OWRPGWorldSim.js | DONE | init, update, tick1, discover, spawnPoi, timeLabel |
| owrpg/OWRPGInteriors.js | DONE | build, nearest, interact, dropBag, enter, exit |
| owrpg/OWRPGValidator.js | DONE | runAll() |
| modes/OWRPGMode.js | DONE | start, stop, suspend, quickSave/Load, reward, giveXp, setFlag, travelTo |
| ui/OWRPGUI.js | DONE | openSlots, openCreator, openDialogue, openVendor, openStash, openTravel, showDeath, updateHud |
| ui/OWRPGPipPad.js | DONE | open(tab) — character, perks, inventory, abilities, quests, map, factions, system, dev (F8) |

## Working
Character creation (3 slots), Haven Basin vertical slice (Freestead Town with 4 NPCs and a stash, Pumphouse, Overpass, Relay, Convoy, Shale Cave, Culvert Sublevel interior), all five Dry Artery outcomes, 5 more quests, stealth/detection, faction AI and territory, theft detection, Primer/Detonator reactions, loot with pity, vendors, salvage, pylons, day/night, compass pins, save/load/migrate, F8 dev tools.

## Known gaps / next work
- Regions 2–6 have hubs, sites and enemies but no authored quests yet (plan Phase 5).
- Only 2 abilities per slot type beyond starters; no companions; no New Game+.
- Base HUD grenade/plate counters & `.gear-dock` are now hidden cleanly in `owrpg` (fixed in `HUDController.js`).
- Dish Ridge / Meridian Dome spawns are placeholders for Act II.

## Hard invariants
- No ES `import`/`export`. IIFE on `window.BO`.
- Never write `BO.Save.data` keys owned by other modes; everything lives in `BO.Save.data.owrpg`.
- No `new THREE.Vector3()` in hot per-frame loops where avoidable; use module scratch vectors.
- Keep files < 600 lines.

## Next concrete deliverable
Author the Rust Sprawl questline (2 Syndicate faction quests, 1 side quest) in `src/data/OWRPGQuestsData.js` + `OWRPGDialogueData.js`, using Mags Orrin and a new NPC at the Goliath Crane. Acceptance: validator 0 errors, `_qa_owrpg.html` all green, each quest has combat / tech-stealth / social resolutions.

## Bootstrap prompt for the next session
```text
Read HANDOFF.md and DECISIONS.md in C:\Users\PC\.gemini\antigravity\scratch\blackout-ops first.
Do not scan unrelated modes (Zombies, MP, TD, Minigames, Rogue Lite).
Inspect only the files listed under "Next concrete deliverable", do it, run _qa_owrpg.html + BO.OWRPGValidator.runAll(), and update HANDOFF.md before finishing.
```
