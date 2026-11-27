# BLACKOUT OPS — 1.0 Complete Edition

A zero-build, offline- and online-capable 3D First-Person Shooter suite powered by **Three.js r149**, procedural PBR canvas textures, procedural Web Audio synthesis, and WebRTC PeerJS / `BroadcastChannel` co-op across **seven connected modes** and **70 weapons**.

- **Play Online**: [https://thejaybirdsolution-eng.github.io/blackout-ops/](https://thejaybirdsolution-eng.github.io/blackout-ops/)
- **Architecture**: Strict IIFE modules on `window.BO`, `<script defer>` (no bundler required at runtime, works via `file://`, `play.bat`, `python server.py`, or GitHub Pages — see `DECISIONS.md`).

---

## Operation Blackout (10-Mission Capstone Campaign)
Select **OPERATION BLACKOUT** at the top of the Main Menu to play a connected 10-mission story arc led by **Director Reyes** and **Vanguard Soren** across all 7 game modes—from *Live-Fire Qualification* and *Killhouse Breach* through *Der Bunker*, *Castle Hold*, *Exclusion Zone Sweep*, *Deep Vault Delve*, *Rust Sprawl*, *Station Omega*, *Terminal Intercept*, and *Operation Blackout Zero* inside Meridian Core.

## Unified Player Profile & Armory (`v3` Save)
- **Account Progression (Lv 1–100)**: Shared XP earned across all 7 modes with 12 Calling Cards, 12 Emblems, 12 Titles, and cross-mode cosmetic unlocks.
- **Daily & Weekly Challenges**: 3 Daily + 5 Weekly offline deterministically seeded objectives claimable directly from the Main Menu.
- **Unified 70-Weapon Armory & Create-a-Class**: Filterable overview of all 50 Firearms, 10 Melee, and 10 Wonder/Magic weapons alongside 10 custom classes and interactive 3D Gunsmith.
- **Continue Banner & Mode Progress Badges**: One-click **CONTINUE →** from the Main Menu tracking your active operation and per-mode records.

## All 7 Game Modes
1. **Zombies (Solo & 2–8p Co-op)**: 9 maps, 70 unique zombies, 15 bosses/Super Bosses, clear Power-On objectives, Perk-a-Colas, Mystery Box, 3-Tier Pack-a-Punch, per-map round records, and Helicopter Exfil.
2. **Multiplayer (Bots, Co-op & PvP)**: 11 formats across 6 arenas (`Killhouse`, `Crash Site`, `Nuketown`, `Shipment`, `Terminal`, `Rust`), custom presets, 15s MW2 Winner Killcam, and post-match **3-Map Vote**.
3. **Exclusion Zone Survival**: 500×450 m open-world survival with shelter construction, farming, livestock, stations, Field Catalogue, Boss hunts, dawn/dusk phase alerts, and 3 Lantern endings.
4. **Rogue Lite — Blackout Vaults (Solo & 2–4p Co-op)**: 15 operatives (12 unlockable), 288 Haven Collection cosmetics, 14 Mystery encounters, Deep Vaults (Floors 26–50+), Floor-5 synergy banners, and instructive run-end debriefs.
5. **Open World RPG — Operation Meridian**: 1280×1280 m frontier across 12 biomes & 12 dungeons, Cartography fog-of-war minimap/Atlas, 156 hidden sites, 12-affix Champions, multi-path **Act I–VI Questlines**, 3 recruitable combat **Companions** (`Vanguard Soren`, `Ghost Kael`, `Tinker Torque`), 4 rideable mounts, 5-element combo combat, `MeshProxy` rig LOD, dynamic NPC schedules, faction territory shifts, and **New Game+**.
6. **Tower Defense — Castle Siege (Solo & 2–8p Co-op)**: 3 Castle keeps, 3 shoot-through wall tiers, 20 rotating deployables, active **Synergy** combos, and next-wave archetype previews.
7. **Minigames Hub (Solo & Same-Room Versus)**: 63 courses across Fun & Specials (22), Target & Action (16), Speed Runs (9), Arcade Hall (15), and Boss Rush, plus `MinigameFeel` sampled impacts/announcer, **Daily Seeded Courses & Featured Streaks**, and **Personal-Best Ghost deltas**.

## Quick Start & Automated QA
- **Local Play**: Double-click `play.bat` or run `python server.py` (dev fast bundle build: `python tools/bundle.py` -> `index.bundled.html`).
- **QA Suites**: Open `_qa_runner.html` (`30/30` target checks across core, modes, saves, netcode, profile & Operation Blackout) and `_qa_owrpg.html` (`120/120` checks & `BO.OWRPGValidator.runAll()`).
