# Minigame HUD Safe-Zone & Overlap Audit (`mg_hud.py`)

- **Courses checked:** 63
- **Passing:** 29/63
- **NEW failures vs baseline:** 0
- **KNOWN failures (in baseline):** 34

| # | Course | Cat | Safe-Zone Hits | Overlaps | Status |
|---|---|---|---|---|---|
| 1 | `range_day` | target | — | — | PASS |
| 2 | `coaster` | target | — | — | PASS |
| 3 | `temple_run` | target | — | — | PASS |
| 4 | `skeet` | target | — | — | PASS |
| 5 | `bandit_town` | target | — | — | PASS |
| 6 | `drone_swarm` | target | — | — | PASS |
| 7 | `sniper_ridge` | target | — | — | PASS |
| 8 | `heli_gunner` | target | — | — | PASS |
| 9 | `balloon_fest` | target | — | — | PASS |
| 10 | `killhouse_blitz` | target | — | — | PASS |
| 11 | `beat_drop` | target | — | — | PASS |
| 12 | `one_mag` | target | — | — | PASS |
| 13 | `outlaw_pursuit` | target | — | — | PASS |
| 14 | `mansion_raid` | target | — | — | PASS |
| 15 | `sweetheart_shore` | target | — | — | PASS |
| 16 | `whack_a_mole` | target | — | — | PASS |
| 17 | `quickdraw` | arcade | — | — | PASS |
| 18 | `cab_wild_hunt` | arcade | — | — | PASS |
| 19 | `cab_night_terrors` | arcade | — | — | PASS |
| 20 | `ball_brawl` | arcade | — | div.mgx-cd-fill×b, div.mgx-cd-fill×small, div.mgx-cd-fill×b | FAIL |
| 21 | `aim_lab` | arcade | — | — | PASS |
| 22 | `contracts` | arcade | div.mgx-dossier.big, small, h3 | — | FAIL |
| 23 | `bottle_juggler` | arcade | div.mgx-chip, b, div.mgx-chip | — | FAIL |
| 24 | `color_lock` | arcade | div.mgx-chip, b, div.mgx-chip | — | FAIL |
| 25 | `number_crunch` | arcade | div.mgx-chip, b, div.mgx-chip | — | FAIL |
| 26 | `echo_panels` | arcade | div.mgx-chip, b, div.mgx-chip | — | FAIL |
| 27 | `switchyard` | arcade | div.mgx-chip, b, div.mgx-chip | — | FAIL |
| 28 | `starfall_shield` | arcade | div.sr-chip, span.sr-bar, i | — | FAIL |
| 29 | `fishing_hole` | arcade | div.mgx-chip, b, div.mgx-chip | — | FAIL |
| 30 | `paint_wars` | arcade | div.sr-chip, b, div.sr-chip | — | FAIL |
| 31 | `safe_cracker` | arcade | div.mgx-chip, b, div.mgx-chip | — | FAIL |
| 32 | `sr_gauntlet` | speed | div.sr-chip, b, div.sr-chip | — | FAIL |
| 33 | `sr_outposts` | speed | div.sr-chip, b, div.sr-chip | — | FAIL |
| 34 | `sr_chase` | speed | div.sr-chip, b, div.sr-chip | — | FAIL |
| 35 | `sr_splitter` | speed | div.sr-chip, b, div.sr-chip | — | FAIL |
| 36 | `sr_skysnipers` | speed | div.sr-chip, b, div.sr-chip | — | FAIL |
| 37 | `sr_last50` | speed | div.sr-chip, b, div.sr-chip | — | FAIL |
| 38 | `sr_freefall` | speed | div.sr-chip, b, div.sr-chip | — | FAIL |
| 39 | `sr_ninja` | speed | div.sr-chip, b, div.sr-chip | — | FAIL |
| 40 | `sr_hydra_dragon` | speed | div.sr-chip, b, div.sr-chip | — | FAIL |
| 41 | `fun_angry_birds` | fun | — | — | PASS |
| 42 | `fun_master_zombie` | fun | — | — | PASS |
| 43 | `fun_snowboarding` | fun | — | — | PASS |
| 44 | `fun_360_trickshot` | fun | — | circle×circle | FAIL |
| 45 | `fun_mario_fps` | fun | — | — | PASS |
| 46 | `fun_final_fantasy` | fun | — | — | PASS |
| 47 | `fun_inspection` | fun | — | — | PASS |
| 48 | `fun_prophunt` | fun | — | div.mg-course×div.fun-panel, div.mg-course×div.mgx-chip, div.mg-course×div.mgx-chip | FAIL |
| 49 | `fun_kaiju` | fun | — | div.mg-course×div.fun-panel, div.mg-course×div.mgx-chip, div.mg-course×div.mgx-chip | FAIL |
| 50 | `fun_bumper_derby` | fun | — | — | PASS |
| 51 | `fun_combat_kitchen` | fun | div.fun-panel, div.mgx-chip, b | — | FAIL |
| 52 | `fun_sky_pirate` | fun | — | div.mg-course×div.fun-panel, div.mg-course×div.mgx-chip, div.mg-course×div.mgx-chip | FAIL |
| 53 | `fun_toy_war` | fun | — | — | PASS |
| 54 | `fun_chess_fps` | fun | — | — | PASS |
| 55 | `fun_ghost_hunters` | fun | — | div.mg-course×div.fun-panel, div.mg-course×div.mgx-chip, div.mg-course×div.mgx-chip | FAIL |
| 56 | `fun_colosseum` | fun | — | div.mg-course×div.fun-panel, div.mg-course×div.mgx-chip, div.mg-course×div.mgx-chip | FAIL |
| 57 | `fun_orbital_breach` | fun | div, div, div | div.mg-course×div, div.mg-course×div, small×div | FAIL |
| 58 | `fun_abyssal_mech` | fun | — | div.mg-course×div.fun-panel, div.mg-course×div.mgx-chip, div.mg-course×div.mgx-chip | FAIL |
| 59 | `fun_dino_safari` | fun | — | div.mg-course×div.fun-panel, div.mg-course×div.mgx-chip, div.mg-course×div.mgx-chip | FAIL |
| 60 | `fun_castle_siege` | fun | — | div.mg-course×div.fun-panel, div.mg-course×div.mgx-chip, div.mg-course×div.mgx-chip | FAIL |
| 61 | `fun_hoverbike_highway` | fun | — | div.mg-course×div.fun-panel, div.mg-course×div.mgx-chip, div.mg-course×div.mgx-chip | FAIL |
| 62 | `fun_pinball_arena` | fun | — | div.mg-course×div.fun-panel, div.mg-course×div.mgx-chip, small×div.fun-panel | FAIL |
| 63 | `boss_rush` | boss | — | div.br-boss×div#hud-banner, div.br-boss×div.banner-title, span×div#hud-banner | FAIL |
