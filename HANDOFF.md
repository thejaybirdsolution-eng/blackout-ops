# HANDOFF — BLACKOUT OPS 1.0 Complete (`release/1.0-complete`)

## Release Snapshot
- **Branch:** `release/1.0-complete` (all sections merged via `--no-ff`: `1.0/complete-gaps`, `1.0/deepen-modes`, `1.0/profile-connect`, `1.0/online-coop`, `1.0/capstone-operation-blackout`, `1.0/ship-qa`).
- **QA Suites:** `_qa_runner.html` (**30/30 pass** covering engine, Survival, Zombies, MP, TD, RPG, Minigames, atomic `v3` saves, `MockNetChannel` Co-op/Versus, `ProfileSystem`, `ModeDepth10`, and `CampaignManager` Operation Blackout) + `_qa_owrpg.html` (**120/120 pass**, `BO.OWRPGValidator.runAll()` 0 errors / 0 warnings, `150` draw calls `< 180`, `2.4 ms` median).
- **ADRs:** `DECISIONS.md` (`ADR-001` through `ADR-019`).
- **Pre-existing dirty files:** All 48 pre-existing dirty user/upstream files + `staged_assets/` remain completely unmodified and unstaged.

## 1.0 Feature Modules Added
- `src/data/OWRPGAct2Data.js` & `src/owrpg/OWRPGCompanions.js`: Multi-path Act II–VI questlines across Rust Sprawl, Mire Delta, Ash Quarry, Alpine Array, Meridian Core, and Dragonwilds; 3 Companions (`soren`, `kael`, `torque`) with passive auras & Soldier mesh AI; NPC dawn/day/night schedule labels; territory shifts; New Game+.
- `src/systems/ZoneFinale.js`: Emits `game:survivalEnding` + `survival:ending` into Profile & Operation Blackout progression.
- `src/systems/ModeDepth10.js`: Power-On clue + Zombies map records; TD synergies + next-wave previews; MP AAR 3-map Vote + presets; Survival phase alerts; RPG Floor-5 synergies + debrief insights; Minigames Daily Seeded Challenge + PB Ghost deltas.
- `src/core/ProfileSystem.js`, `src/ui/ProfileHubUI.js`, `css/profile-hub.css`, `src/core/SaveSystem.js` (`v3`): Shared Account Level 1–100, Calling Cards/Emblems/Titles, 3 Daily + 5 Weekly offline challenges, Unified 70-Weapon Armory, Continue Banner, per-mode progress badges, and QA-suppressed first-launch Range Day onboarding.
- `src/net/CoopExtensions.js` & `src/net/NetValidation.js` (`ADR-017`): Rogue Lite 2–4p host snapshots/door voting/hit relay + Minigames Same-Room Versus leaderboard.
- `src/data/CampaignData.js`, `src/systems/CampaignManager.js`, `src/ui/CampaignUI.js`: 10-mission **Operation Blackout** capstone story campaign spanning all 7 modes.
