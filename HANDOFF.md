# HANDOFF — BLACKOUT OPS 1.0 Complete (`release/1.0-complete`)

## Release Snapshot
- **Branch:** `master` (merged `release/1.0-complete` + `origin/master` flagship-2 `#174–#182`).
- **QA Suites:** `_qa_runner.html` (30 checks) + `_qa_owrpg.html` (OWRPG 143 checks including Cartography, 156 hidden sites, Champions & `OWRPGValidator`).
- **ADRs:** `DECISIONS.md` (`ADR-001` through `ADR-023`).
- **Merged `origin/master` Flagship-2 Systems:** `MeshProxy.js`, `OWRPGDiscoveryData.js`, `OWRPGCartography.js`, `OWRPGChampions.js`, `OWRPGDiscoveries.js`, `MinigameFeel.js`, `MinigameDaily.js`, and 259 committed `staged_assets/` files.

## 1.0 Feature Modules Added
- `src/data/OWRPGAct2Data.js` & `src/owrpg/OWRPGCompanions.js`: Multi-path Act II–VI questlines across Rust Sprawl, Mire Delta, Ash Quarry, Alpine Array, Meridian Core, and Dragonwilds; 3 Companions (`soren`, `kael`, `torque`) with passive auras & Soldier mesh AI; NPC dawn/day/night schedule labels; territory shifts; New Game+.
- `src/systems/ZoneFinale.js`: Emits `game:survivalEnding` + `survival:ending` into Profile & Operation Blackout progression.
- `src/systems/ModeDepth10.js`: Power-On clue + Zombies map records; TD synergies + next-wave previews; MP AAR 3-map Vote + presets; Survival phase alerts; RPG Floor-5 synergies + debrief insights; Minigames Daily Seeded Challenge + PB Ghost deltas.
- `src/core/ProfileSystem.js`, `src/ui/ProfileHubUI.js`, `css/profile-hub.css`, `src/core/SaveSystem.js` (`v3`): Shared Account Level 1–100, Calling Cards/Emblems/Titles, 3 Daily + 5 Weekly offline challenges, Unified 70-Weapon Armory, Continue Banner, per-mode progress badges, and QA-suppressed first-launch Range Day onboarding.
- `src/net/CoopExtensions.js` & `src/net/NetValidation.js` (`ADR-017`): Rogue Lite 2–4p host snapshots/door voting/hit relay + Minigames Same-Room Versus leaderboard.
- `src/data/CampaignData.js`, `src/systems/CampaignManager.js`, `src/ui/CampaignUI.js`: 10-mission **Operation Blackout** capstone story campaign spanning all 7 modes.
