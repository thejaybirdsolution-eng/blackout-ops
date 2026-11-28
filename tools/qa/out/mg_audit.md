# Minigame Audit (`mg_audit.py`)

- **Courses run:** 63
- **Seeds per course:** 1
- **Passing:** 21/63
- **NEW failures vs baseline:** 0
- **KNOWN failures (in baseline):** 42
- **FIXED since baseline:** 9

| # | Course | Cat | Probe (score · stars · kills/spawned · acc) | Never-Vis | Final | p95 (ms) | Contract Flags |
|---|---|---|---|---|---|---|---|
| 1 | `range_day` | target | 12250 pts · 2★ · 94/88 · acc 65% | 0 | results (61.83s) | 1.80 | A0.4.6_kills_gt_spawned(94/88) |
| 2 | `coaster` | target | 13854 pts · 2★ · 78/72 · acc 44% | 0 | results (61.83s) | 0.40 | A0.4.2_first_target_bearing(162.45deg>35); A0.4.6_kills_gt_spawned(78/72) |
| 3 | `temple_run` | target | 10950 pts · 2★ · 74/68 · acc 56% | 0 | results (61.83s) | 0.60 | A0.4.6_kills_gt_spawned(74/68) |
| 4 | `skeet` | target | 4450 pts · 2★ · 25/50 · acc 36% | 0 | results (61.83s) | 0.40 | PASS |
| 5 | `bandit_town` | target | 3920 pts · 1★ · 41/59 · acc 59% | 7 | results (61.83s) | 0.60 | A0.4.4_never_visible(7/62) |
| 6 | `drone_swarm` | target | 12830 pts · 2★ · 74/70 · acc 55% | 0 | results (61.83s) | 0.60 | A0.4.6_kills_gt_spawned(74/70) |
| 7 | `sniper_ridge` | target | 15944 pts · 4★ · 39/41 · acc 46% | 1 | results (61.83s) | 0.40 | A0.4.2_spawn_in_collider(1); A0.4.4_never_visible(1/41) |
| 8 | `heli_gunner` | target | 13305 pts · 3★ · 48/48 · acc 22% | 5 | results (49.57s) | 0.90 | A0.4.2_first_target_bearing(121.49deg>35); A0.4.4_never_visible(5/60) |
| 9 | `balloon_fest` | target | 18450 pts · 3★ · 139/137 · acc 56% | 0 | results (61.83s) | 0.40 | A0.4.6_kills_gt_spawned(139/137) |
| 10 | `killhouse_blitz` | target | 9325 pts · 3★ · 62/64 · acc 65% | 1 | results (61.83s) | 0.50 | A0.4.4_never_visible(1/66) |
| 11 | `beat_drop` | target | 5740 pts · 0★ · 118/118 · acc 94% | 0 | results (62.83s) | 0.50 | PASS |
| 12 | `one_mag` | target | 22250 pts · 1★ · 19/19 · acc 63% | 0 | results (20.6s) | 0.80 | PASS |
| 13 | `outlaw_pursuit` | target | 0 pts · 0★ · 1/31 · acc 1% | 3 | results (61.83s) | 1.10 | A0.4.2_first_target_bearing(107.51deg>35); A0.4.4_never_visible(3/37); A0.4.6_zero_score_from_hits(1hits) |
| 14 | `mansion_raid` | target | 250 pts · 0★ · 1/12 · acc 2% | 11 | running (180s) | 0.30 | A0.4.1_no_results(state=running,t=180s); A0.4.4_never_visible(11/12) |
| 15 | `sweetheart_shore` | target | 75 pts · 0★ · 1/48 · acc 0% | 0 | results (61.83s) | 1.60 | PASS |
| 16 | `whack_a_mole` | target | 18050 pts · 4★ · 91/92 · acc 82% | 0 | results (61.83s) | 1.80 | PASS |
| 17 | `quickdraw` | arcade | 0 pts · 0★ · 0/2 · acc 0% | 0 | running (90s) | 0.60 | A0.4.1_no_results(state=running,t=90s) |
| 18 | `cab_wild_hunt` | arcade | 403 pts · 0★ · 13/61 · acc 4% | 0 | results (61.83s) | 4.30 | PASS |
| 19 | `cab_night_terrors` | arcade | 126 pts · 0★ · 1/12 · acc 1% | 0 | results (20.5s) | 4.20 | PASS |
| 20 | `ball_brawl` | arcade | 200 pts · 0★ · 0/0 · acc — | 0 | results (6.43s) | 0.50 | PASS |
| 21 | `aim_lab` | arcade | 3745 pts · 1★ · 2/3 · acc 98% | 0 | results (61.83s) | 1.70 | A0.4.2_first_target_bearing(151.57deg>35) |
| 22 | `contracts` | arcade | 0 pts · 0★ · 0/13 · acc 20% | 0 | results (12.7s) | 1.50 | A0.4.6_zero_score_from_hits(1hits) |
| 23 | `bottle_juggler` | arcade | 365685 pts · 4★ · 446/0 · acc 100% | 0 | results (61.83s) | 0.80 | A0.4.6_kills_gt_spawned(446/0) |
| 24 | `color_lock` | arcade | 23810 pts · 0★ · 120/0 · acc 81% | 0 | running (68s) | 0.70 | A0.4.1_no_results(state=running,t=68s); A0.4.6_kills_gt_spawned(120/0) |
| 25 | `number_crunch` | arcade | 0 pts · 0★ · 0/0 · acc 100% | 0 | results (10.63s) | 2.00 | A0.4.6_zero_score_from_hits(26hits) |
| 26 | `echo_panels` | arcade | 150 pts · 0★ · 0/0 · acc 100% | 0 | results (12.7s) | 0.50 | PASS |
| 27 | `switchyard` | arcade | 1630 pts · 0★ · 10/0 · acc 100% | 0 | results (31.43s) | 0.50 | A0.4.6_kills_gt_spawned(10/0) |
| 28 | `starfall_shield` | arcade | 91010 pts · 4★ · 233/0 · acc 95% | 0 | results (61.83s) | 0.40 | A0.4.6_kills_gt_spawned(233/0) |
| 29 | `fishing_hole` | arcade | 9912 pts · 3★ · 27/0 · acc 100% | 0 | results (61.83s) | 0.80 | A0.4.6_kills_gt_spawned(27/0) |
| 30 | `paint_wars` | arcade | 5350 pts · 0★ · 0/0 · acc 100% | 0 | results (61.83s) | 0.40 | PASS |
| 31 | `safe_cracker` | arcade | 0 pts · 0★ · 0/0 · acc 100% | 0 | results (76.83s) | 1.00 | A0.4.6_zero_score_from_hits(210hits) |
| 32 | `sr_gauntlet` | speed | 0 pts · 0★ · 3/0 · acc 69% | 22 | running (90s) | 0.70 | A0.4.1_no_results(state=running,t=90s); A0.4.4_never_visible(22/42); A0.4.6_kills_gt_spawned(3/0); A0.4.6_zero_score_from_hits(11hits) |
| 33 | `sr_outposts` | speed | 0 pts · 0★ · 4/0 · acc 80% | 0 | running (90s) | 0.20 | A0.4.1_no_results(state=running,t=90s); A0.4.6_kills_gt_spawned(4/0); A0.4.6_zero_score_from_hits(4hits) |
| 34 | `sr_chase` | speed | 0 pts · 0★ · 0/0 · acc 0% | 0 | results (87.43s) | 0.30 | PASS |
| 35 | `sr_splitter` | speed | 0 pts · 0★ · 13/0 · acc 82% | 10 | results (28.53s) | 0.60 | A0.4.4_never_visible(10/27); A0.4.6_kills_gt_spawned(13/0); A0.4.6_zero_score_from_hits(46hits) |
| 36 | `sr_skysnipers` | speed | 0 pts · 0★ · 4/0 · acc 99% | 0 | running (90s) | 0.40 | A0.4.1_no_results(state=running,t=90s); A0.4.6_kills_gt_spawned(4/0); A0.4.6_zero_score_from_hits(77hits) |
| 37 | `sr_last50` | speed | 0 pts · 0★ · 4/0 · acc 98% | 0 | results (20.93s) | 1.50 | A0.4.2_first_target_bearing(144.99deg>35); A0.4.6_kills_gt_spawned(4/0); A0.4.6_zero_score_from_hits(53hits) |
| 38 | `sr_freefall` | speed | 843 pts · 4★ · 16/0 · acc 22% | 0 | results (10.63s) | 2.10 | A0.4.6_kills_gt_spawned(16/0) |
| 39 | `sr_ninja` | speed | 0 pts · 0★ · 0/0 · acc — | 0 | results (15.1s) | 0.50 | PASS |
| 40 | `sr_hydra_dragon` | speed | 0 pts · 0★ · 0/0 · acc — | 11 | results (86.93s) | 0.60 | A0.4.4_never_visible(11/11) |
| 41 | `fun_angry_birds` | fun | 0 pts · 0★ · 0/13 · acc — | 0 | results (91.83s) | 0.30 | PASS |
| 42 | `fun_master_zombie` | fun | 980 pts · 0★ · 0/5 · acc — | 2 | results (39.23s) | 0.70 | A0.4.4_never_visible(2/4) |
| 43 | `fun_snowboarding` | fun | 13109 pts · 4★ · 12/22 · acc — | 0 | results (80.73s) | 0.50 | PASS |
| 44 | `fun_360_trickshot` | fun | 0 pts · 0★ · 0/5 · acc — | 1 | results (121.83s) | 0.30 | A0.4.4_never_visible(1/6) |
| 45 | `fun_mario_fps` | fun | 0 pts · 0★ · 0/0 · acc — | 0 | running (90s) | 0.20 | A0.4.1_no_results(state=running,t=90s) |
| 46 | `fun_final_fantasy` | fun | 0 pts · 0★ · 0/0 · acc — | 0 | running (90s) | 0.40 | A0.4.1_no_results(state=running,t=90s) |
| 47 | `fun_inspection` | fun | 0 pts · 0★ · 0/0 · acc — | 0 | running (180s) | 0.20 | A0.4.1_no_results(state=running,t=180s) |
| 48 | `fun_prophunt` | fun | 6750 pts · 2★ · 6/0 · acc 98% | 4 | results (166.83s) | 0.70 | A0.4.4_never_visible(4/48); A0.4.6_kills_gt_spawned(6/0) |
| 49 | `fun_kaiju` | fun | 7445 pts · 0★ · 14/0 · acc — | 0 | running (180s) | 0.40 | A0.4.1_errors(1): _simulate: st.damage is not a function; A0.4.1_no_results(state=running,t=180s); A0.4.6_kills_gt_spawned(14/0) |
| 50 | `fun_bumper_derby` | fun | 2360 pts · 1★ · 2/0 · acc — | 0 | results (21.63s) | 1.00 | A0.4.6_kills_gt_spawned(2/0) |
| 51 | `fun_combat_kitchen` | fun | 5940 pts · 2★ · 13/17 · acc 49% | 0 | results (70.27s) | 0.60 | A0.4.2_first_target_bearing(70.87deg>35) |
| 52 | `fun_sky_pirate` | fun | 1060 pts · 0★ · 4/10 · acc 48% | 0 | results (24s) | 0.60 | PASS |
| 53 | `fun_toy_war` | fun | 4850 pts · 1★ · 3/18 · acc 75% | 5 | results (45.3s) | 0.70 | A0.4.4_never_visible(5/12) |
| 54 | `fun_chess_fps` | fun | 12105 pts · 3★ · 12/12 · acc 93% | 0 | results (16.27s) | 0.70 | PASS |
| 55 | `fun_ghost_hunters` | fun | 0 pts · 0★ · 0/0 · acc — | 0 | results (18.17s) | 0.40 | PASS |
| 56 | `fun_colosseum` | fun | 10795 pts · 3★ · 18/25 · acc 33% | 0 | results (56.77s) | 0.70 | A0.4.2_first_target_bearing(38.66deg>35) |
| 57 | `fun_orbital_breach` | fun | 9523 pts · 2★ · 17/11 · acc 75% | 0 | results (31.23s) | 0.40 | A0.4.6_kills_gt_spawned(17/11) |
| 58 | `fun_abyssal_mech` | fun | 19606 pts · 4★ · 17/20 · acc 33% | 0 | results (47.63s) | 0.50 | PASS |
| 59 | `fun_dino_safari` | fun | 5285 pts · 1★ · 9/15 · acc 21% | 0 | results (37.63s) | 1.10 | A0.4.1_errors(2): handleFireInput: orbMat.setHex is not a function |
| 60 | `fun_castle_siege` | fun | 80 pts · 0★ · 0/11 · acc 5% | 0 | results (31.03s) | 0.90 | PASS |
| 61 | `fun_hoverbike_highway` | fun | 3830 pts · 1★ · 8/9 · acc 8% | 0 | results (23s) | 4.80 | PASS |
| 62 | `fun_pinball_arena` | fun | 47100 pts · 4★ · 0/10 · acc 0% | 7 | results (113.6s) | 0.50 | A0.4.4_never_visible(7/15) |
| 63 | `boss_rush` | boss | 1000 pts · 0★ · 0/0 · acc 100% | 0 | results (56.77s) | 0.80 | PASS |
