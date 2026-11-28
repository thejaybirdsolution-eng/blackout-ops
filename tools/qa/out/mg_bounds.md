# Minigame Play-Space Bounds (`mg_bounds.py`)

- **Courses probed:** 63
- **Passing / Skipped (rail/ride):** 52/63
- **NEW failures vs baseline:** 0
- **KNOWN failures (in baseline):** 11

| # | Course | Cat | Mode | Max Dist | Radius | Min Y | Fall Dirs | Escape Dirs | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `range_day` | target | walk | 1.81 m | 55 m | 0 | — | — | PASS |
| 2 | `coaster` | target | rail | 0 m | 55 m | 7 | — | — | SKIP |
| 3 | `temple_run` | target | rail | 0 m | 55 m | 0 | — | — | SKIP |
| 4 | `skeet` | target | walk | 1.88 m | 55 m | 0 | — | — | PASS |
| 5 | `bandit_town` | target | walk | 1.81 m | 55 m | 0 | — | — | PASS |
| 6 | `drone_swarm` | target | walk | 20.53 m | 55 m | 0 | — | — | PASS |
| 7 | `sniper_ridge` | target | walk | 2.01 m | 55 m | 0 | — | — | PASS |
| 8 | `heli_gunner` | target | rail | 0 m | 55 m | 27 | — | — | SKIP |
| 9 | `balloon_fest` | target | walk | 1.81 m | 55 m | 0 | — | — | PASS |
| 10 | `killhouse_blitz` | target | rail | 0 m | 55 m | 0 | — | — | SKIP |
| 11 | `beat_drop` | target | walk | 2.17 m | 55 m | 0 | — | — | PASS |
| 12 | `one_mag` | target | walk | 1.28 m | 55 m | 0 | — | — | PASS |
| 13 | `outlaw_pursuit` | target | rail | 0 m | 55 m | 0 | — | — | SKIP |
| 14 | `mansion_raid` | target | walk | 87.38 m | 55 m | 0 | — | 45,135,180,225,270,315 | escaped(dirs=[45, 135, 180, 225, 270, 315],maxDist=87.38m>55m) |
| 15 | `sweetheart_shore` | target | walk | 4.16 m | 55 m | 0 | — | — | PASS |
| 16 | `whack_a_mole` | target | walk | 1.64 m | 55 m | 0 | — | — | PASS |
| 17 | `quickdraw` | arcade | rideState | 0 m | 55 m | 0 | — | — | SKIP |
| 18 | `cab_wild_hunt` | arcade | walk | 89.63 m | 55 m | 0 | — | 45 | escaped(dirs=[45],maxDist=89.63m>55m) |
| 19 | `cab_night_terrors` | arcade | walk | 63.29 m | 55 m | 0 | — | 45 | escaped(dirs=[45],maxDist=63.29m>55m) |
| 20 | `ball_brawl` | arcade | rideState | 0 m | 55 m | 0 | — | — | SKIP |
| 21 | `aim_lab` | arcade | rideState | 0 m | 55 m | 0 | — | — | SKIP |
| 22 | `contracts` | arcade | rideState | 0 m | 55 m | 12 | — | — | SKIP |
| 23 | `bottle_juggler` | arcade | walk | 3.29 m | 55 m | 0 | — | — | PASS |
| 24 | `color_lock` | arcade | walk | 3.69 m | 55 m | 0 | — | — | PASS |
| 25 | `number_crunch` | arcade | walk | 3.69 m | 55 m | 0 | — | — | PASS |
| 26 | `echo_panels` | arcade | walk | 3.69 m | 55 m | 0 | — | — | PASS |
| 27 | `switchyard` | arcade | walk | 3.29 m | 55 m | 0 | — | — | PASS |
| 28 | `starfall_shield` | arcade | walk | 3.29 m | 55 m | 0 | — | — | PASS |
| 29 | `fishing_hole` | arcade | walk | 3.69 m | 55 m | 0 | — | — | PASS |
| 30 | `paint_wars` | arcade | walk | 3.69 m | 55 m | 0 | — | — | PASS |
| 31 | `safe_cracker` | arcade | walk | 3.69 m | 55 m | 0 | — | — | PASS |
| 32 | `sr_gauntlet` | speed | walk | 56.88 m | 55 m | 0 | — | 0 | escaped(dirs=[0],maxDist=56.88m>55m) |
| 33 | `sr_outposts` | speed | walk | 73.66 m | 55 m | 0 | — | 0,45 | escaped(dirs=[0, 45],maxDist=73.66m>55m) |
| 34 | `sr_chase` | speed | rideState | 0 m | 55 m | 0 | — | — | SKIP |
| 35 | `sr_splitter` | speed | walk | 39.41 m | 55 m | 0 | — | — | PASS |
| 36 | `sr_skysnipers` | speed | walk | 13.56 m | 25 m | 60 | — | — | PASS |
| 37 | `sr_last50` | speed | walk | 32.78 m | 55 m | 0 | — | — | PASS |
| 38 | `sr_freefall` | speed | rideState | 0 m | 55 m | 1000 | — | — | SKIP |
| 39 | `sr_ninja` | speed | walk | 84.69 m | 55 m | 0 | — | 0,45,90 | escaped(dirs=[0, 45, 90],maxDist=84.69m>55m) |
| 40 | `sr_hydra_dragon` | speed | walk | 33.48 m | 55 m | 0 | — | — | PASS |
| 41 | `fun_angry_birds` | fun | walk | 4.96 m | 55 m | 0.3 | — | — | PASS |
| 42 | `fun_master_zombie` | fun | walk | 89.93 m | 55 m | 0 | — | 45,90,135,180,225,270,315 | escaped(dirs=[45, 90, 135, 180, 225, 270, 315],maxDist=89.93m>55m) |
| 43 | `fun_snowboarding` | fun | rideState | 0 m | 55 m | 0 | — | — | SKIP |
| 44 | `fun_360_trickshot` | fun | walk | 23.68 m | 85 m | 0.77 | 0,45,315 | — | fell(dirs=[0, 45, 315],minY=0.77) |
| 45 | `fun_mario_fps` | fun | walk | 52.11 m | 55 m | 0 | — | — | PASS |
| 46 | `fun_final_fantasy` | fun | walk | 109.06 m | 55 m | 0 | — | 0,45,135,180,225,315 | escaped(dirs=[0, 45, 135, 180, 225, 315],maxDist=109.06m>55m) |
| 47 | `fun_inspection` | fun | walk | 35.9 m | 55 m | 0 | — | — | PASS |
| 48 | `fun_prophunt` | fun | walk | 42.07 m | 55 m | 0 | — | — | PASS |
| 49 | `fun_kaiju` | fun | rideState | 0 m | 55 m | 14 | — | — | SKIP |
| 50 | `fun_bumper_derby` | fun | rideState | 0 m | 55 m | 0 | — | — | SKIP |
| 51 | `fun_combat_kitchen` | fun | walk | 16.53 m | 25 m | 0 | — | — | PASS |
| 52 | `fun_sky_pirate` | fun | walk | 19.01 m | 25 m | 0 | — | — | PASS |
| 53 | `fun_toy_war` | fun | walk | 52.26 m | 54 m | 0 | — | — | PASS |
| 54 | `fun_chess_fps` | fun | walk | 39.23 m | 40.9 m | 0 | — | — | PASS |
| 55 | `fun_ghost_hunters` | fun | walk | 38.58 m | 40.3 m | 0 | — | — | PASS |
| 56 | `fun_colosseum` | fun | walk | 39.48 m | 55 m | 0 | — | — | PASS |
| 57 | `fun_orbital_breach` | fun | rideState | 0 m | 40 m | 0.25 | — | — | SKIP |
| 58 | `fun_abyssal_mech` | fun | walk | 89.02 m | 56.9 m | 0 | — | 0 | escaped(dirs=[0],maxDist=89.02m>56.9m) |
| 59 | `fun_dino_safari` | fun | walk | 50.11 m | 51.8 m | 0 | — | — | PASS |
| 60 | `fun_castle_siege` | fun | walk | 17.08 m | 73.1 m | 2.37 | 0,45 | — | fell(dirs=[0, 45],minY=2.37) |
| 61 | `fun_hoverbike_highway` | fun | walk | 12.41 m | 55 m | 0 | — | — | PASS |
| 62 | `fun_pinball_arena` | fun | walk | 54.74 m | 61.9 m | 0 | — | — | PASS |
| 63 | `boss_rush` | boss | walk | 50.58 m | 55 m | 0 | — | — | PASS |
