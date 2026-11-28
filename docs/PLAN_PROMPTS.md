# Prompts to carry out the Overhaul Plan

There are 28 phase prompts plus 17 supporting prompts and templates: RESUME, VERIFY, setup (S1–S2), after-phase checks (H1–H4), cross-cutting work (X1–X7), the launch checklist (L1), and a bug report template (BR). Run the phase prompts **in order, one per session**, starting each in the `blackout-ops` folder. Paste the whole prompt (everything inside its box). Each one is self-contained: it tells the AI which files to read, what to build, how to test it, and when it is done.

**Before prompt 1:** run **S1** and **S2** (setup and repo hygiene).

**After every phase prompt:** read the AI's final report, then run **H1** (live-site check). If any test failed or anything is listed as unfinished, run **VERIFY** (to check the work) or **RESUME** (to continue it) before moving on.

**If a session runs out of context mid-prompt,** run RESUME. Don't re-run the original prompt.

## Full run order

| When | Prompts |
|---|---|
| Once, first | S1 Setup check → S2 Repo hygiene |
| Part A | 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → X6 Balance playtest (minigames) → X5 Asset sourcing (minigame maps) → 11 → 12 → 13 → 14 |
| End of Part A | H3 Health check → X1 Online co-op check → X3 Game Guide update → X4 Controls audit |
| Part B | 15 → X2 Save check → X5 Asset sourcing (towns, dungeons) → 16 → 17 → 18 → 19 → 20 → X2 Save check → H3 Health check → 21 → 22 → 23 → 24 → X1 Online co-op check → 25 → X2 Save check → 26 → 27 → H3 Health check → 28 |
| End of Part B | X3 Game Guide update → X4 Controls audit → X6 Balance playtest (Open World) → X7 Performance pass → L1 Launch checklist |
| After every phase | H1 Live-site check |
| Any time | H2 Hotfix · H4 Split a phase that's too big · RESUME · VERIFY · BR Bug report template |

Supporting prompts are at the end of this file.

---

## RESUME (use whenever a session stopped partway)

```
Read docs/AI_STANDING_RULES.md, then docs/PROGRESS.md, then the plan section it names in docs/PLAN_OWRPG_AND_MINIGAMES.md. Check out the phase branch named in PROGRESS.md and review its commits since master (git log master..HEAD, git diff master...HEAD) so you know exactly what is already done. Do not redo finished work. Continue from the first unchecked item in PROGRESS.md and finish the whole phase to its exit gate, following every testing and finishing rule in AI_STANDING_RULES.md. Update PROGRESS.md as you go, and delete it when the phase is merged to master.
```

## VERIFY (use after any phase whose report you doubt)

```
Read docs/AI_STANDING_RULES.md and the plan section for phase <PHASE ID> in docs/PLAN_OWRPG_AND_MINIGAMES.md. Act as a strict reviewer of the work merged for that phase (find its merge commit on master with git log --merges). For every step and every exit-gate item in that section, check whether it was really done: read the code, run every QA suite and the tools/qa audits, and take headless screenshots of the affected screens and courses. List each step as DONE / PARTIAL / MISSING, with evidence (file:line, test output, screenshot). Then fix every PARTIAL and MISSING item and every bug you found, re-run all tests, and finish with the standard docs, merge and push from AI_STANDING_RULES.md. Report what was missing and what you fixed.
```

---

# PART A — MINIGAMES

## Prompt 1 — Phase A0.1–A0.2: build the minigame test harness

```
Read docs/AI_STANDING_RULES.md in full, then docs/PLAN_OWRPG_AND_MINIGAMES.md (the whole of Part A, especially Phase A0 and Appendix A), HANDOFF.md, and src/minigames/MinigameCore.js end to end.

Branch: overhaul/a0-harness.

Goal: create a permanent automated test harness for all 63 minigames in tools/qa/, so every later phase has a pass/fail gate.

Build:
1. tools/qa/mg_audit.py: launches each course (BO.App.startMatch({mode:'minigame', mgId, seed, mgOptions:{skipCountdown:true}})), stops the real loop (BO.App._loop = () => {}), and steps BO.App._simulate(1/30) deterministically for the course duration (cap 180 s, or until results). Default bot: aim at the nearest visible non-penalty target in BO.Combat.targetPool (line of sight via BO.World.hasLineOfSight), hold ADS when the course allows it, and tap the trigger (BO.Combat.handleFireInput(false,false), then (true,true)) so semi-auto and pump weapons fire. If the course def has a qaBot(S, lib, step) hook, call it every step instead.
   Record per course: score; stars; result title; shots; shot hits; kills; spawned (plus bonus/penalty counts once they exist); expired; targets ever seen versus seen in line of sight; never-visible targets; final state; sim seconds; minimum Y; spawn position and ground height; colliders containing the spawn; errors (page errors, console errors, and any exception from _simulate).
   Write tools/qa/out/mg_audit.json and tools/qa/out/mg_audit.md (a table like Appendix A). Options: --only id1,id2; --seeds N; --port.
2. tools/qa/mg_bounds.py: for every course without a ride or rail, walk (sprint plus W) for 12 s in 8 directions from spawn. Report max distance, falls below spawn − 3 m, and directions that exceed the course's play-space radius.
3. tools/qa/mg_sheet.py: screenshots each course 1.4 s after start, and builds labelled 4×4 contact sheets in tools/qa/out/.
4. tools/qa/mg_hud.py: for each course 2 s after start, collects the getBoundingClientRect of every visible element inside #mg-hud and #hud-layer. Fail if any element intersects the crosshair safe zone (central 30% × 30% of the viewport) or overlaps another HUD element by more than 4 px (allow-list intended stacks).
5. tools/qa/ow_content.py: boots Open World (slot 2) and prints counts of every OWRPG data table, NPCs, quests by kind, quest trigger types in use, dungeons with a unique layout, recipes, activities and achievements. Part B uses it as its scoreboard.
6. tools/qa/run_all.py: runs mg_audit, mg_bounds, mg_hud and ow_content plus the three _qa_*.html pages and the smoke test, and prints one PASS/FAIL summary. Exit code 1 on any failure.
7. tools/qa/README.md: setup (pip install playwright; python -m playwright install chromium), how to start the server, every script's options, and how to read the outputs.
8. Implement the acceptance contract from plan section A0.4 inside mg_audit.py as explicit checks with clear failure messages (items 1, 2, 3, 4, 6, 8 now; items 5 and 7 activate once qaBot hooks and mg_hud exist). Add a "known failures" baseline file (tools/qa/mg_baseline.json) recording today's failures, so the harness can report NEW versus KNOWN failures. Later phases must shrink this baseline to empty.

Rules: this prompt must not change game code. The qaBot hook is looked up and called by the harness's own injected JavaScript (if def.qaBot exists); Prompt 2 adds the hooks to the course defs. Run the full harness on all 63 courses and commit the generated baseline and the outputs' .md summary (not the screenshots).

Exit gate: python tools/qa/run_all.py runs end to end, all existing QA passes, and the baseline lists every current failure. Finish with docs (HANDOFF section, an ADR "QA harness in tools/qa"; no update-log entry needed for tooling), merge to master, push, and report.
```

## Prompt 2 — Phase A0.2–A0.3: golden-path bots and triage of every flagged course

```
Read docs/AI_STANDING_RULES.md, then plan sections A0.2, A0.3 and Appendix A in docs/PLAN_OWRPG_AND_MINIGAMES.md, then tools/qa/README.md.

Branch: overhaul/a0-triage.

Goal: give every course a golden-path bot, then sort every "Verify" flag in the plan into Confirmed-bug or Not-a-bug.

1. Add an optional def.qaBot(S, lib, ctx) hook to every course def that the default aim-bot cannot play properly. ctx gives the bot P, camera, step, dt and helpers aimAt(vec), fire(), move(forward, strafe, sprint), jump() and interact(key).
   - Rhythm (beat_drop): fire inside the PERFECT window of the next note.
   - Puzzle and arcade logic (number_crunch, echo_panels, color_lock, safe_cracker, switchyard, paint_wars, quickdraw, contracts, fishing_hole, bottle_juggler, starfall_shield): read the solution from S.data and act on it.
   - Speed runs (all 9): follow the course route or checkpoints with move()/jump().
   - Every Fun mode (22): use its own verbs (abilities on their keys, objectives in order).
   - Rail courses: aim with a one-frame lead for the rail motion.
   Keep hooks small, readable and next to each course def. They are QA-only and must never run in normal play (only when window.__qaBot is set).
2. Run tools/qa/mg_audit.py --seeds 3 on all courses with the bots.
3. Triage every item in the plan's "Verify first" list and every automated flag in Appendix A: early endings (heli_gunner, cab_night_terrors, fun_ghost_hunters, fun_chess_fps, fun_bumper_derby, ball_brawl), zero-score-from-hits (cab_wild_hunt, switchyard, safe_cracker, paint_wars), never-visible targets (bandit_town, fun_prophunt, fun_toy_war, sr_hydra_dragon, fun_pinball_arena, echo_panels, contracts, mansion_raid), untimed courses that never finished, and unreachable star thresholds. For each: reproduce it, read the code path, and decide. Also play each flagged course in a headless browser in real time, with screenshots, to confirm.
4. Write the verdicts into a new "Triage ledger" table in tools/qa/README.md: course | flag | verdict | cause (file:line) | fix phase (A1 / A2.x / A3).
5. Do not fix game bugs in this prompt unless the fix is a one-line obvious error found during triage. List everything else for Prompts 3–8.

Exit gate: every course has a bot that completes it (or a documented reason it cannot), and every flag has a verdict. Update mg_baseline.json. Finish with docs, merge, push, and a report that includes the full triage ledger.
```

## Prompt 3 — Phase A1.1–A1.4 and A1.8: core framework fixes (targets, damage, colours, error isolation, results)

```
Read docs/AI_STANDING_RULES.md, then plan Phase A1 (sections A1.1, A1.2, A1.3, A1.4, A1.8) and the triage ledger in tools/qa/README.md. Read src/minigames/MinigameCore.js fully, and grep every file in src/minigames/ for addTarget, mgTarget, hitPool, .damage(, setHex(, S.kills, S.spawned and onHit.

Branch: overhaul/a1-core.

Implement exactly what the plan specifies:
1. A1.1 one target registry: Session.registerTarget for custom entities; split counters (spawned, bonusSpawned, penaltySpawned, kills, bonusKills, penaltyHits); hitTarget increments the matching counter; _computeResult shows correct "TARGETS HIT" and hides the row when def.resultTargets === false. Migrate EVERY course that creates scored targets outside addTarget (Bottle Juggler, Color Lock, Number Crunch, Switchyard, Starfall Shield, Fishing Hole, the speed runs and Fun modes the audit flagged, and any others the grep finds). Fix kills > spawned on Temple Run, Sweetheart Shore and Orbital Breach.
2. A1.2 Target.damage(amount, info) routed through ctx.hitTarget. Fix Kaiju (src/minigames/FunGamesD.js:1198) and audit every .damage( call site.
3. A1.3 replace every material.setHex misuse with .color.setHex. Fix Dino Safari (src/minigames/FunGamesH.js:1024 and 1219) and grep for the same pattern everywhere.
4. A1.4 guarded calls around def.update, def.onHit, def.onShot, target onTick/onKill/onDamage/onExpire and S.animate updaters: log the first error with the course id, disable only the failing updater, and keep the course running.
5. A1.8 results integrity: clamp accuracy; assert hits ≤ shots and kills ≤ spawned; report violations to the console with the course id. Make mg_audit fail on them.
6. Fix every Confirmed bug in the triage ledger marked "A1" (core-level causes).

Test: the full tools/qa/run_all.py. Zero crashes across 63 courses; zero results-integrity violations; no course regressed versus the baseline (shrink mg_baseline.json accordingly). Play Kaiju, Dino Safari and 3 migrated arcade courses headless with screenshots of their results screens.

Finish: ADR "Minigame target registry and guarded course callbacks", HANDOFF, update-log entry, plan ticks, merge, push, report.
```

## Prompt 4 — Phase A1.5–A1.7 and A1.9: HUD layout system, countdown choreography, boundaries, spawn facing

```
Read docs/AI_STANDING_RULES.md, then plan sections A1.5, A1.6, A1.7 and A1.9. Read the minigame HUD code (MinigameCore._buildHud, _updateHud, _showCountdown, toast, popup), css/ used by #mg-hud, and every course that injects its own HUD chips (grep for 'mg-chip', 'mg-hud', 'insertAdjacentHTML', 'mgh-', and each course's hud builder in FunGames*.js, SpeedRuns*.js, ArcadeHall*.js, TargetCourses*.js).

Branch: overhaul/a1-hud-bounds.

1. Build the HUD layout system exactly as A1.5 describes: named regions (top-left course card with a one-line clamped tagline, top-centre timer, top-right score, left-rail stats with hud.hideStats, bottom-centre-above-weapon chip rows that wrap to at most 2 rows and never enter the weapon panel, centre-overlay countdown only, a toast lane), plus a crosshair safe zone as a CSS variable. Expose one API, lib.hud.chip(id, html, opts) / lib.hud.removeChip(id), and migrate EVERY course's custom HUD to it. Remove all absolute positioning from course code. Combat Kitchen's orders become a right-side ticket rail (cards slide in, max height 45% of the viewport); Final Fantasy dialogue becomes a bottom dialogue box; Contracts' dossier collapses to a corner card after 2.5 s or on SPACE.
2. A1.6 choreography: the banner animates in at t=0 and out at 1.4 s; then the countdown; GO! scales 1.4→1.0 and fades over 0.7 s; toasts are queued while those are visible. Use eased CSS transitions (transform/opacity only).
3. A1.7 def.map.bounds (AABB or polygon) turned into colliders, plus a soft edge (vignette and "RETURN TO THE COURSE" after 1 s, reset after 4 s), and def.map.killY with respawn at the last safe point. Add bounds to every course the walk-out probe flagged: cab_wild_hunt, cab_night_terrors, mansion_raid, sr_outposts, sr_ninja, fun_abyssal_mech, fun_castle_siege, and fun_360_trickshot (keep intended trick falls, but they must respawn and count). For the open-map Fun modes (mario_fps, final_fantasy, master_zombie), add bounds at the authored map edges.
4. A1.9 def.firstLook plus the spawn-facing check in mg_audit.
5. Use the BO.HUD-style gated writes (setText/setHtml/setStyle) for all per-frame HUD updates.

Test: tools/qa/mg_hud.py must pass on all 63 (no safe-zone or overlap violations), and mg_bounds.py must show no unintended escapes or falls. Build new contact sheets with mg_sheet.py and look at every one: titles readable, no overlaps, chips above the weapon panel. Run the full run_all.py.

Finish: ADR "Minigame HUD regions and play-space bounds", HANDOFF, update-log entry, plan ticks, merge, push, report with before/after contact sheets saved in tools/qa/out/.
```

## Prompt 5 — Phase A2.1: fix and polish the 16 Target & Action courses

```
Read docs/AI_STANDING_RULES.md, plan section A2.1, the triage ledger, and Appendix A rows for: range_day, coaster, temple_run, skeet, bandit_town, drone_swarm, sniper_ridge, heli_gunner, balloon_fest, killhouse_blitz, beat_drop, one_mag, outlaw_pursuit, mansion_raid, sweetheart_shore, whack_a_mole. Read each course's full def in src/minigames/TargetCourses*.js and WhackAMole.js.

Branch: overhaul/a2-target.

For each course, in order:
1. Fix every Confirmed defect from the triage ledger and the plan's A2.1 notes:
   - Bandit Town: make the 7 occluded lanes visible.
   - Heli Gunner: fix the 26-second ending (extend the path, or add a hull warning plus a SHOT DOWN result).
   - Sniper Ridge: range markers at 50/100/150/200 m, wind flags, and a hold-breath hint.
   - Mansion Raid: bounds; move the statue off the first sightline; make all criminals reachable.
   - Temple Run and Sweetheart Shore: correct counters.
2. Run its golden bot through mg_audit --only <id> --seeds 5 and fix anything that fails the A0.4 contract.
3. Play it in a headless browser in real time for its full duration with screenshots every 10 s. Fix anything that looks wrong: target readability, feedback, pacing (no dead time longer than 3 s), difficulty ramp across the duration.
4. Record a "Course ledger" row in tools/qa/README.md: fixes made, golden-bot median score, the problems you found.

Do not recalibrate stars yet (Prompt 10 does that) unless a threshold is mathematically unreachable.

Exit gate: all 16 pass the A0.4 contract (except star item 5) and are removed from mg_baseline.json. Full run_all.py green. Finish with docs, update-log entry ("Target & Action courses fixed"), plan ticks, merge, push, report.
```

## Prompt 6 — Phase A2.2: fix and polish the Arcade Hall courses

```
Read docs/AI_STANDING_RULES.md, plan section A2.2, the triage ledger, and Appendix A rows for every 'arcade' course (quickdraw, cab_wild_hunt, cab_night_terrors, ball_brawl, aim_lab, contracts, bottle_juggler, color_lock, number_crunch, echo_panels, switchyard, starfall_shield, fishing_hole, paint_wars, safe_cracker, and any other arcade id in BO.Minigames.defs). Read their defs in src/minigames/ArcadeHall*.js and related files.

Branch: overhaul/a2-arcade.

1. Cabinet games (cab_wild_hunt, cab_night_terrors): lock the player into a cabinet stance (rideState with yaw/pitch limits facing the screen), and make the game area fill at least 60% of the view, with a 0.8 s eased dolly-in from the hall at start and a dolly-out at results.
2. Scoring: make sure every successful action awards points through S.award with a popup. Fix the zero-score-from-hits cases confirmed in triage (Wild Hunt, Switchyard, Safe Cracker) and make sure Paint Wars' coverage thresholds are reachable.
3. Quickdraw: guarantee the round flow ends in results (5 rounds, plus a tie-break).
4. Ball Brawl: a real collision platform replacing the 2 m slab at y=-400; ring-out detection with a clear "KNOCKED OUT" beat; the early ending explained or fixed.
5. Echo Panels, Number Crunch, Color Lock: clear feedback for right and wrong answers (sound, colour flash, shake on wrong) and a visible "next" preview where the design calls for it.
6. Then follow the same per-course loop as Prompt 5: golden bot with 5 seeds, real-time headless play with screenshots, fix what looks wrong, record a Course ledger row.

Exit gate: every arcade course passes the A0.4 contract (except star item 5) and is out of the baseline. Full run_all.py green. Finish with docs, update-log entry, plan ticks, merge, push, report.
```

## Prompt 7 — Phase A2.3: fix and polish the 9 Speed Runs

```
Read docs/AI_STANDING_RULES.md, plan section A2.3, the triage ledger, and Appendix A rows for sr_gauntlet, sr_outposts, sr_splitter, sr_last50, sr_chase, sr_skysnipers, sr_freefall, sr_ninja, sr_hydra_dragon. Read src/minigames/SpeedRuns*.js and src/minigames/MinigameDaily.js (personal-best ghost).

Branch: overhaul/a2-speed.

1. Give every speed run def.route (an ordered checkpoint list with positions and radii), drawn in-world as subtle markers. The golden bot follows the route.
2. Show the personal-best ghost line and split times at each checkpoint (green when ahead, red when behind) using the MinigameDaily PB data.
3. Hydra Dragon: make the arena entry and boss visible from the start; give each head a telegraph; fix the never-visible boss parts.
4. Ninja: bounds (it was open in 5 directions). Outposts: bounds.
5. Make sure every run has a clear start, a finish line, and a results screen with time, splits and PB delta. No run may soft-lock: add a 10-minute cap that ends with a DNF result.
6. Per-course loop as in Prompt 5 (golden bot ×5 seeds, real-time headless play with screenshots, Course ledger row).

Exit gate: all 9 pass the A0.4 contract (except star item 5) and are out of the baseline. Full run_all.py green. Finish with docs, update-log entry, plan ticks, merge, push, report.
```

## Prompt 8 — Phase A2.5 (part 1): Fun & Specials, first 11 courses

```
Read docs/AI_STANDING_RULES.md, plan section A2.5, the triage ledger, and Appendix A rows for: fun_angry_birds, fun_master_zombie, fun_snowboarding, fun_360_trickshot, fun_mario_fps, fun_final_fantasy, fun_inspection, fun_prophunt, fun_kaiju, fun_bumper_derby, fun_combat_kitchen. Read each def fully (SkybreakSling.js, FunGames*.js and the others).

Branch: overhaul/a2-fun-1.

For each course:
1. Confirm the A1 fixes landed (Kaiju damage; HUD moved to the regions from Prompt 4).
2. Fix every Confirmed defect from triage: Bumper Derby's early ending; 360 Trickshot's intended versus unintended falls; Prophunt's never-visible mimics (make sure each can be found); Mario FPS, Final Fantasy and Inspection must finish when their objectives complete.
3. Make the course's core loop work exactly as its tagline and description promise. If any promised mechanic is missing or broken, implement it fully.
4. Per-course loop: golden bot ×5 seeds through mg_audit, a real-time headless playthrough with screenshots every 15 s, fix visual and UX problems, record a Course ledger row.

Exit gate: all 11 pass the A0.4 contract (except star item 5) and are out of the baseline. Full run_all.py green. Finish with docs, update-log entry, plan ticks, merge, push, report.
```

## Prompt 9 — Phase A2.5 (part 2): Fun & Specials, remaining 11 courses

```
Read docs/AI_STANDING_RULES.md, plan section A2.5, the triage ledger, and Appendix A rows for: fun_sky_pirate, fun_toy_war, fun_chess_fps, fun_ghost_hunters, fun_colosseum, fun_orbital_breach, fun_abyssal_mech, fun_dino_safari, fun_castle_siege, fun_hoverbike_highway, fun_pinball_arena.

Branch: overhaul/a2-fun-2.

Same per-course procedure as Prompt 8. Specific items:
- Dino Safari: the colour fix is confirmed working.
- Ghost Hunters and Chess FPS: early endings resolved.
- Toy War: 10 never-visible enemies made reachable.
- Orbital Breach: kill counting fixed.
- Castle Siege: parapets or bounds on the open wall edges.
- Pinball: the 15 never-visible targets made reachable; the run must end.
- Abyssal Mech: bounds.

Exit gate: all 11 pass the A0.4 contract (except star item 5); mg_baseline.json now contains no Fun courses. Full run_all.py green. Finish with docs, update-log entry, plan ticks, merge, push, report.
```

## Prompt 10 — Phase A2.4: star calibration for all 63 courses

```
Read docs/AI_STANDING_RULES.md and plan section A2.4. Read MinigameCore.starsOf / starsFor and every course's stars / starsFor definition.

Branch: overhaul/a2-stars.

1. Extend tools/qa/mg_audit.py with --calibrate: run each course's golden bot over 5 seeds (and every hub variant for courses with hubOptions, such as Beat Drop's songs × modes), and record the median score as the skilled ceiling.
2. Set thresholds to Bronze 25%, Silver 50%, Gold 75% and Platinum 92% of the ceiling, rounded to clean numbers (nearest 50, 100 or 500 depending on scale). For time-based speed runs, invert (faster = more stars) with the same percentages applied to time. Courses whose results use a custom def.result keep their own metric, but get the same calibration.
3. Write thresholds into each def (stars, or starsFor for variants). Add a generated table to tools/qa/README.md: course | ceiling | B/S/G/P.
4. Turn on acceptance item 5 in mg_audit: the golden bot must reach at least 3★, and Platinum must not be above the ceiling.
5. Personal bests: existing saved bests stay valid; star counts are recomputed from the new thresholds on load (migrate in the minigame save key, if stars are stored).

Exit gate: all 63 pass the full A0.4 contract, and mg_baseline.json is EMPTY. Full run_all.py green. Finish with docs, update-log entry ("Star ratings rebalanced"), plan ticks, merge, push, report.
```

## Prompt 11 — Phase A3.1–A3.2 (part 1): map design standard and the first rebuilt maps

```
Read docs/AI_STANDING_RULES.md, plan sections A3.1, A3.2 and A3.4. Look at the contact sheets in tools/qa/out/ and at WhackAMole.js (the quality reference). Read src/graphics/MapDetailBuilder.js, BO.Assets.placeGLB / placeGLBInstanced, and the asset kits under staged_assets/3d_models/ and C:\Users\PC\Desktop\game assets\1 - 3D Models & Kits.

Branch: overhaul/a3-maps-1.

1. Write docs/MINIGAME_MAP_STANDARD.md from plan section A3.1 (three depth bands, lanes, 3:1 target contrast, a reason for every boundary, a landmark and lighting key, spawn framing), with a checklist per map and the A3.4 budget (≤350 draw calls, ≤400k triangles, ≤30 unique materials, ≤2 shadow-casting lights).
2. Add tools/qa/mg_mapcheck.py: for each course, report draw calls, triangles, unique materials, shadow lights and the target-versus-background luminance contrast (sampled from a screenshot around each target's screen position). Fail courses over budget or under 3:1 contrast.
3. Rebuild these maps fully to the standard, as described in A3.2: Range Day (tiered range, berms at 15/30/50 m, lane numbers, backstop), Coaster (theme-park midway under the track), Skeet (trap house, high/low houses, readable throw flags), Sweetheart Shore (boardwalk, dunes, pier, surf), Colosseum (tiered seating with instanced crowd, sand floor decal, gate tunnel). Keep all gameplay positions (targets, spawn, rail) unless the standard requires a change; re-run each course's golden bot afterwards to confirm its score is unchanged within ±10%.
4. Review each rebuilt map at spawn and at 3 points of the course, from headless screenshots, against the checklist. Iterate until every item passes.

Exit gate: the 5 maps pass mg_mapcheck and the checklist; all 63 courses still pass mg_audit; full run_all.py green. Finish with docs (ADR "Minigame map standard"), update-log entry, plan ticks, merge, push, report with before/after screenshots.
```

## Prompt 12 — Phase A3.2 (part 2): rebuild the remaining flat maps

```
Read docs/AI_STANDING_RULES.md, docs/MINIGAME_MAP_STANDARD.md, and plan section A3.2.

Branch: overhaul/a3-maps-2.

Rebuild to the standard:
- Ghost Hunters: furnished mansion rooms instead of the flat pink floor.
- Paint Wars: a geometric arena with coloured coverage zones.
- Aim Lab: a sci-fi training room with grid walls and light panels.
- Ball Brawl: a proper platform model, rim lights, a readable ring-out edge.

Then run mg_mapcheck on ALL 63 courses, and rebuild or adjust every other course that fails the budget, the contrast check or the checklist. Use the same verification as Prompt 11: golden-bot score within ±10%, headless screenshots at spawn plus 3 points, checklist review.

Exit gate: all 63 courses pass mg_mapcheck and mg_audit; full run_all.py green. Finish with docs, update-log entry, plan ticks, merge, push, report.
```

## Prompt 13 — Phase A3.3: unique identities for the six carnival-tent arcades

```
Read docs/AI_STANDING_RULES.md, docs/MINIGAME_MAP_STANDARD.md and plan section A3.3.

Branch: overhaul/a3-arcade-identity.

Replace the shared striped carnival tent with a unique, fully built environment for each course, keeping gameplay positions:
- Bottle Juggler: a western saloon bar.
- Color Lock: a reactor control room.
- Number Crunch: a TV game-show stage with audience lighting.
- Switchyard: a rail yard (and fix the clipped "TO BAI"/"O PIT" signs by sizing canvas text to fit its sign: measure the text and shrink the font).
- Starfall Shield: a city rooftop at night with a skyline.
- Safe Cracker: a bank vault.

Each gets its own lighting, ambient audio bed (via MinigameAudio), and themed target and feedback colours that pass the 3:1 contrast rule. Share materials and instance props to stay within budget.

Verify with mg_mapcheck, mg_audit (golden-bot scores within ±10%), mg_hud, and headless screenshots reviewed against the checklist.

Exit gate: all six pass, all 63 still pass; full run_all.py green. Finish with docs, update-log entry, plan ticks, merge, push, report with screenshots.
```

## Prompt 14 — Phase A4: feel, results, onboarding, hub and accessibility

```
Read docs/AI_STANDING_RULES.md and plan Phase A4. Read src/minigames/MinigameFeel.js, MinigameCore._showResults/_animateResults, src/minigames/MinigameHub.js and MinigameThumbs.js.

Branch: overhaul/a4-polish.

1. Hit feedback: audit every course for a per-target-type sound and particle burst, plus a crosshair hit-pulse. Fill every gap through MinigameFeel so it is consistent everywhere.
2. Results screen: animated star reveal (staggered, eased), PB delta, "next star at N points", one-click Retry and Next Course, keyboard shortcuts (R / N / Esc).
3. Onboarding: a 3-step control card generated from def.keys, shown on the first launch of each course only (persist in the save), with a "don't show again" option.
4. Hub: category filters, stars and PB on every card, a "NEW" badge for unplayed courses, the daily challenge pinned at the top, keyboard and gamepad navigation, and hover and focus states.
5. Accessibility: a colour-blind-safe palette option (targets versus penalties distinguished by shape as well as colour), subtitles for voice lines, and a reduced-motion option that shortens the A1.6 animations.

Verify: mg_hud and mg_audit on all 63, headless screenshots of the hub, a results screen, an onboarding card, and colour-blind mode. Then play 10 random courses in real time headless and report any UX issue found and fixed.

Exit gate: everything above working; full run_all.py green. Finish with docs, update-log entry ("Minigames overhaul complete"), plan ticks for all of Part A, merge, push, report.
```

---

# PART B — OPEN WORLD RPG

## Prompt 15 — Phase B0: content pipeline (validator, 12 objective types, journal, chronicle)

```
Read docs/AI_STANDING_RULES.md, plan Part B (the summary table and Phase B0). Read every file in src/owrpg/ (start with OWRPGQuests.js, OWRPGValidator.js, OWRPGSave.js, OWRPGMode.js), src/data/OWRPGQuestsData.js, src/data/OWRPGAct2Data.js, src/ui/OWRPGPipPad.js, src/ui/OWRPGUI.js and _qa_owrpg.html.

Branch: overhaul/b0-pipeline.

1. B0.1: extend OWRPGValidator with schema and reference checks for every OWRPG data table, now and for the tables later phases add (NPCs, recipes, dungeons, activities, achievements). Check that ids resolve, givers exist, markers resolve to POIs, and markers sit on walkable ground. Wire it into _qa_owrpg.html.
2. B0.2: add the 12 new stage triggers exactly as listed in plan B0.2 (talk, reach, collect, deliver, escort, defend, timed, stealth, craft, use, photo, choice), each with a handler, a journal text template, a map-marker rule and a validator rule. Escort needs a following NPC with failure on death. Defend uses OWRPGEvents waves. Stealth uses OWRPGAI detection. Timed wraps any stage.
3. Write one small, real, playable test quest per trigger type in a new region-appropriate location (these become real side content, not test junk: give them proper names, givers, text and rewards). Add a _qa_owrpg check that completes each one with a scripted run.
4. B0.3 journal: a Pip-Pad Quests tab with categories and filters, a tracked quest pinned to the HUD (stage text plus distance), compass markers for the active stage, and a completed log showing the branch taken.
5. B0.4 the chronicle: state.chronicle[] recording quest branches, faction shifts and major kills, saved and migrated in OWRPGSave (bump the version; old saves get an empty chronicle reconstructed from completed quests).
6. Update tools/qa/ow_content.py to report trigger types in use.

Exit gate: _qa_owrpg all green including the new checks; 12 test quests completable; old saves load. Full run_all.py green. Finish with docs (ADR "OWRPG content pipeline and objective vocabulary"), update-log entry, plan ticks, merge, push, report.
```

## Prompt 16 — Phase B1 (part 1): settlements and NPCs, regions 1–6

```
Read docs/AI_STANDING_RULES.md and plan Phase B1. Read src/data/OWRPGWorldData.js (REGIONS, POIS, NPCS, INTERACTS), OWRPGInteriors.js, OWRPGWorldArt.js, src/data/OWRPGDialogueData.js, OWRPGDialogue.js, OWRPGFactionsData.js (VENDORS), and OWRPGAct2Data.SCHEDULES.

Branch: overhaul/b1-towns-1.

For regions haven_basin (expand Freestead), whispering_woods, rust_sprawl, barrow_moor, mire_delta and ash_quarry:
1. B1.1: build a settlement in each: an approach landmark, 4–8 buildings from the city, building and castle kits (instanced), night lighting, and one signature location. Place it at a sensible POI with nav coverage; make sure ground cover and colliders respect it.
2. B1.2: add NPCs per settlement (a leader, a vendor, a service NPC, a quest giver and 2–3 townsfolk), each with a full dialogue tree: introduction, rumours that point to real POIs and quests, shop or service, and at least one attribute or skill check with a real outcome. Use the existing soldier rig and SoldierModel animation, with unique outfits and colours per NPC.
3. Vendors: a stock list per settlement in OWRPGFactionsData.VENDORS, themed to the region.
4. Validator: every NPC has a reachable position, a tree and valid references.

Verify: _qa_owrpg green; ow_content shows the new NPC count; headless screenshots of each settlement by day and night; a dialogue walkthrough with each new NPC captured in screenshots; profiler (Open World draw calls under 200 near settlements, p95 within budget).

Exit gate: as above, plus full run_all.py green. Finish with docs, update-log entry, plan ticks (mark B1 part 1), merge, push, report.
```

## Prompt 17 — Phase B1 (part 2): settlements and NPCs, regions 7–12

```
Read docs/AI_STANDING_RULES.md, plan Phase B1, and HANDOFF.md's section from Prompt 16 (reuse its builders and conventions exactly).

Branch: overhaul/b1-towns-2.

Do the same as Prompt 16 for sunscorched_badlands, sunken_coast, alpine_array, frostfang_peaks, meridian_core and obsidian_dragonwilds. After this prompt, ow_content.py must report at least 60 named NPCs and 12 settlements.

Same verification and exit gate as Prompt 16. Finish with docs, update-log entry, plan ticks, merge, push, report.
```

## Prompt 18 — Phase B1 (part 3): services, schedules, ambient life and reactivity

```
Read docs/AI_STANDING_RULES.md, plan sections B1.3, B1.4 and B1.5, and the HANDOFF sections from Prompts 16–17.

Branch: overhaul/b1-life.

1. B1.3 services:
   - Inn: rest, wait and sleep, implemented fully here as a shared OWRPGRest module that plan B5.9 reuses; advances OWRPGWorldSim time and weather, heals, and gives a well-rested XP buff.
   - Doctor: cure statuses, sell consumables.
   - Trainer: buy skill XP with a per-level cap.
   - Smith: repair through OWRPGDurability (upgrade and salvage arrive in B3).
   - Fence: wire it now; stolen goods arrive in B5.
   Each gets a polished Pip-Pad-style UI panel.
2. B1.4 schedules: NPCs walk home → work → tavern on nav paths by time of day; ambient barks reacting to faction rank, weather and recent chronicle entries; townsfolk crowds as instanced, LOD'd figures within the draw-call budget.
3. B1.5 reactivity: raise dialogue attribute and skill checks to at least 60 across all NPCs (each with a meaningful result); faction rank changes prices, greetings and access; major chronicle branches change later dialogue.

Verify: _qa_owrpg checks for each service and for a schedule move at 3 times of day; ow_content reports at least 60 checks; profiler within budget; headless screenshots of each service UI and of a busy settlement.

Exit gate: full run_all.py green. Finish with docs, update-log entry, plan ticks (B1 complete), merge, push, report.
```

## Prompt 19 — Phase B2: crafting, gathering and economy

```
Read docs/AI_STANDING_RULES.md and plan Phase B2. Read OWRPGInventory.js, OWRPGInteriors.js (workbench, resource_node), OWRPGStatsData.js (ITEMS, SKILLS), OWRPGExpansionData.js, OWRPGGroundCover.js (chunk streaming), and the Gunsmith attachments data.

Branch: overhaul/b2-crafting.

1. B2.1: new src/owrpg/OWRPGCrafting.js and src/data/OWRPGRecipesData.js (recipes with inputs, output, station, skill requirement and XP), plus a real Crafting Pip-Pad tab: categories, craftable-now filter, missing materials highlighted, craft ×N, and animated feedback. Stations: workbench, campfire, alchemy table, forge. Each station interaction opens its filtered list.
2. B2.2: at least 80 recipes across ammo, consumables, weapon mods (reuse the Gunsmith attachments), armour reinforcement, tools and repair kits, throwables, ability catalysts, and housing furniture (needed by B8).
3. B2.3: raise resource nodes from 21 to about 120, placed by biome through the ground-cover chunk system with respawn timers, harvest animations, per-material sounds and skill-scaled yields.
4. B2.4: write docs/OWRPG_ECONOMY.md (sources against sinks) and tune prices so level 10 can afford one upgrade per 30 minutes of play.
5. Validator rules for every recipe; save migration for any new inventory fields.

Verify: _qa_owrpg crafts one item at each station; ow_content reports at least 80 recipes and about 120 nodes; screenshots of the crafting UI and of harvesting; profiler within budget.

Exit gate: full run_all.py green. Finish with docs (ADR "OWRPG crafting"), update-log entry, plan ticks, merge, push, report.
```

## Prompt 20 — Phase B3: loot depth (rarities, uniques, sets, upgrades, affixes, transmog)

```
Read docs/AI_STANDING_RULES.md and plan Phase B3. Read OWRPGStatsData.js (RARITY, AFFIXES, LOOT, PITY_GUARANTEE, MANUFACTURERS), OWRPGExpansionData.js (ARMOR_SETS, NEW_GUNS, NEW_ARMOR), OWRPGCharacter.js, OWRPGInventory.js and OWRPGGunStats.

Branch: overhaul/b3-loot.

Implement B3.1–B3.6 fully:
- Uncommon and Unique tiers, with colours and UI everywhere rarity shows.
- 30 uniques with gameplay-changing effects, each actually implemented in combat code. Assign them to bosses, dungeons and world secrets.
- 2/3/4-piece set bonuses for the 6 existing sets, plus 4 new sets.
- A tier 1–5 upgrade path at the smith, using crafted materials.
- Affix rerolling for a fee.
- Affixes from 8 to about 30, with up to 3 on Epic and 4 on Legendary.
- Transmog at the smith.
- Keep PITY_GUARANTEE.

Add a loot-table simulator to the validator: 100k rolls per table, and each tier's rate must be within 5% of design. Save migration for existing items (recompute rarity fields; keep owned items).

Verify: _qa_owrpg simulator green; a scripted test that equips a full set and checks bonuses, and that triggers 5 unique effects; screenshots of tooltips and the smith UI.

Exit gate: full run_all.py green. Finish with docs, update-log entry, plan ticks, merge, push, report.
```

## Prompt 21 — Phase B4 (part 1): dungeon room kit and the first 5 handcrafted dungeons

```
Read docs/AI_STANDING_RULES.md and plan Phase B4. Read src/data/OWRPGWorldData.js (DUNGEONS, buildDungeonGeometry at about line 470), OWRPGInteriors.js (enter/exit), OWRPGAI.js, OWRPGCombat.js, the _qa_owrpg.html dungeon-route checks, and the dungeon and castle kits in staged_assets.

Branch: overhaul/b4-dungeons-1.

1. B4.1: new src/owrpg/OWRPGDungeonKit.js: modular rooms (corridor, junction, hall, arena, vault, shrine, puzzle room), connectors and themed set dressing, built from data, with instancing and shared materials, plus colliders, nav and lighting per room.
2. B4.3 traps (pressure plates with darts and fire jets, swinging blades, collapsing floors, poison gas): visible to high perception, disarmable with TCH, and triggerable on enemies.
3. B4.4 a puzzle framework: lever sequences, symbol doors with clues in lore tomes, light-beam mirrors, weight plates and timed runs.
4. B4.2, B4.5 and B4.6 for these 5 dungeons: dng_whisper_barrow, dng_foundry_depths, dng_sunken_crypt, dng_vampire_vault, dng_coven_cavern. Each gets a handcrafted layout of 6–12 rooms (layout data in DUNGEONS[i].layout), at least one branch, a secret room, a mini-boss, a unique boss arena with phase mechanics (keep the boss ids), a loot vault, at least one puzzle, traps, and first-clear rewards (a unique from B3, a recipe scroll, a lore page).
5. Replace buildDungeonGeometry for these 5 with the kit builder; keep surface entrances, levels and ids; update the _qa_owrpg route expectations.

Verify: a scripted route-walk plus puzzle-solve plus secret-find test per dungeon in _qa_owrpg; profiler within budget inside each; headless screenshots of every room type and each boss arena.

Exit gate: full run_all.py green. Finish with docs (ADR "Dungeon kit"), update-log entry, plan ticks, merge, push, report.
```

## Prompt 22 — Phase B4 (part 2): the remaining 6 dungeons

```
Read docs/AI_STANDING_RULES.md, plan Phase B4, and the HANDOFF section from Prompt 21 (reuse OWRPGDungeonKit and its conventions exactly).

Branch: overhaul/b4-dungeons-2.

Do the same as Prompt 21 step 4 for: dng_dwarven_mine, dng_sand_tomb, and the remaining dungeons in DUNGEONS after them (sea cave, ice keep, void, dragon vault, and so on: every entry still using buildDungeonGeometry). When done, delete buildDungeonGeometry and any dead code it leaves behind. The Culvert Sublevel keeps its existing bespoke layout, but must gain a secret and a puzzle.

Same verification and exit gate as Prompt 21; ow_content must report 12 unique dungeon layouts. Finish with docs, update-log entry, plan ticks (B4 complete), merge, push, report.
```

## Prompt 23 — Phase B5 (part 1): fishing, hunting, lockpicking, pickpocketing and theft, card game

```
Read docs/AI_STANDING_RULES.md and plan Phase B5. Read the Fishing Hole minigame (catch logic), OWRPGInteriors.js (current lockpick gate at about line 248), OWRPGAI.js (detection), OWRPGFactions.js, and the B1 fence and inn code.

Branch: overhaul/b5-activities-1.

Create src/owrpg/activities/ and implement, each fully playable with its own Pip-Pad tracker:
1. Fishing: cast and reel with a tension meter; species by biome, water body and time; a trophy log; cooking recipes (hook into B2).
2. Hunting: deer, boar, bear and snow cat with natural AI (flee and charge); pelts and trophies for crafting and housing.
3. Lockpicking: a real sweet-spot rotation minigame with breakable picks; TCH widens the sweet spot. It replaces the stat gate everywhere locks exist.
4. Pickpocketing and theft: a detection meter, stolen-item flags, the fence, guard reactions and a faction bounty.
5. "Dead Man's Draw": a card game at every inn, with NPC opponents, collectible cards from loot, and a rules screen.

Add achievements hooks (B7.3 will list them; record events now), validator entries and a scripted smoke test per activity in _qa_owrpg.

Verify: tests green; screenshots of each activity's UI mid-play; profiler within budget.

Exit gate: full run_all.py green. Finish with docs, update-log entry, plan ticks, merge, push, report.
```

## Prompt 24 — Phase B5 (part 2): arena, mount races, treasure maps, rest/camps, radiant contracts

```
Read docs/AI_STANDING_RULES.md, plan Phase B5, and the HANDOFF section from Prompt 23.

Branch: overhaul/b5-activities-2.

Implement fully:
6. Arena: a Rust Sprawl fight pit with tiered brackets, betting, crowd and unique rewards.
7. Mount races: 4 tracks across regions (checkpoint gates), a personal-best ghost, and mount upgrades.
8. Treasure maps: painted map fragments as loot (generated canvas images of real landmarks), dig sites, and rewards.
9. Rest, wait and sleep everywhere through OWRPGRest from Prompt 18 (beds, inns, camps).
10. Camps: a deployable campfire for cooking, resting and respawning.

Also: turn the 16 bounties into radiant contracts (target type × region × modifier: elite, escort, timed or stealth, using the B0.2 triggers) that refresh on a timer.

Same verification and exit gate style as Prompt 23. Finish with docs, update-log entry, plan ticks (B5 complete), merge, push, report.
```

## Prompt 25 — Phase B6: character creator, 24 abilities, new skills, companions

```
Read docs/AI_STANDING_RULES.md and plan Phase B6. Read OWRPGCharacter.js, OWRPGStatsData.js (ATTRS, SKILLS, PERK_TREES, ABILITIES, STATUSES, REACTIONS), OWRPGExpansionData.js (EXPANSION_ABILITIES), OWRPGCompanions.js, OWRPGAct2Data.COMPANIONS, OWRPGUI.js (new-character flow) and src/graphics/SoldierModel.js.

Branch: overhaul/b6-character.

1. Character creator: body type, face presets, hair, skin, scars and a background that grants a starting perk. A live 3D preview on the soldier rig, an animated UI, saved in the character state with a migration for existing characters.
2. Abilities from 8 to 24: 4 per attribute school, unlocked through the perk trees, using the existing STATUSES and REACTIONS for combinations, each with VFX, SFX, cooldown UI and AI reactions.
3. Skills: Speech (prices and persuasion checks), Survival (fishing, hunting, camps) and Thievery (locks, pickpocketing), each with a perk tree wired into the B1/B5 systems.
4. Companions: approval meters reacting to chronicle events; a 3-part personal quest each for Soren, Kael and Torque (using B0.2 triggers); camp banter lines; loyalty perks; and 2 new companions with personal quests and recruitment.

Verify: validator data checks; scripted tests for creating a character, casting every ability, and completing each companion quest; screenshots of the creator, the ability UI and a companion conversation.

Exit gate: full run_all.py green. Finish with docs, update-log entry, plan ticks, merge, push, report.
```

## Prompt 26 — Phase B7 (part 1): side and faction quests for regions 1–6, plus achievements

```
Read docs/AI_STANDING_RULES.md and plan Phase B7. Read OWRPGQuestsData.js, OWRPGAct2Data.js, OWRPGDialogueData.js, the B0 trigger handlers, the B1 NPCs for these regions, and src/core/ProfileSystem.js.

Branch: overhaul/b7-quests-1.

1. Regions haven_basin, whispering_woods, rust_sprawl, barrow_moor, mire_delta and ash_quarry: write at least 6 new side quests per region, using at least 6 different trigger types per region. Each has multiple solutions where it makes sense, chronicle consequences, givers from the B1 NPCs, real dialogue and rewards from B2/B3. Add 6 faction quests (the first half of plan B7.1's 12).
2. Rework the 5 dungeon quests in these regions around the B4 layouts (puzzles, secrets, mini-bosses).
3. B7.3 achievements: about 60 across exploration, combat, crafting, activities and story; Pip-Pad badges; hooked into the shared ProfileSystem account level; using the events recorded since B5.

Every quest gets a scripted completion test in _qa_owrpg.

Exit gate: ow_content shows the new quest count and trigger usage; full run_all.py green. Finish with docs, update-log entry, plan ticks, merge, push, report.
```

## Prompt 27 — Phase B7 (part 2): quests for regions 7–12, main story pass, endings, discoveries

```
Read docs/AI_STANDING_RULES.md, plan Phase B7, and the HANDOFF section from Prompt 26.

Branch: overhaul/b7-quests-2.

1. The same as Prompt 26 step 1 for sunscorched_badlands, sunken_coast, alpine_array, frostfang_peaks, meridian_core and obsidian_dragonwilds, plus the remaining 6 faction quests and the remaining dungeon quest reworks.
2. Main story (B7.2): tighten Acts I–VI into a clear throughline with a set piece at the end of each act. Ending slides read the chronicle (settlements, factions, companions).
3. B7.4: lore payoffs and per-region map-completion rewards for the 156 hidden sites.

ow_content must report at least 120 quests and at least 12 trigger types in use; every quest is completable by a scripted run.

Exit gate: full run_all.py green. Finish with docs, update-log entry, plan ticks (B7 complete), merge, push, report.
```

## Prompt 28 — Phases B8 and B9: player housing, then final balance, performance and release

```
Read docs/AI_STANDING_RULES.md and plan Phases B8 and B9. Read the Survival build placement code (src/systems/ZoneBuild*), OWRPGSave.js, the B2 furniture recipes, the B5 trophies, and all OWRPG performance checks in _qa_owrpg.html.

Branch: overhaul/b8-b9-housing-release.

Part 1, housing (B8):
- A Freestead home unlocked by a quest, plus a coast cabin and a mountain lodge to buy.
- Stash (replacing the world stashes, with item migration), crafting stations, a weapon wall and armour mannequins, a trophy wall, a garden that grows herbs on world time, and a bed as the respawn point.
- Furniture placement (grid and free) reusing the ZoneBuild placement code.
- A save, load and placement round-trip test.

Part 2, release (B9):
- B9.1 level curve over about 25 hours: match region bands to quest XP and enemy scaling (write the curve into docs/OWRPG_ECONOMY.md).
- B9.2 audit every enemy family for hit reactions, telegraphs and death animations; fill the gaps.
- B9.3 performance: Open World under 200 draw calls and median frame cost within the _qa_owrpg budget in every settlement and dungeon; GPU memory flat across save, load and fast travel (verify with the GPULedger).
- B9.4 OWRPGSave version bump and migration that gives existing characters every new system.
- A final full regression of every suite and tools/qa script, plus a 2-hour-equivalent scripted playthrough (new character → Act II) in _qa_owrpg.

Exit gate: everything green. Finish with docs (HANDOFF summary of the whole overhaul), update-log entry ("Open World RPG overhaul complete"), tick every remaining plan step, merge, push, confirm the GitHub Pages deploy, and give a final report listing every phase with its merge commit.
```

---

# SUPPORTING PROMPTS

## S1 — Setup check (run once, before Prompt 1)

```
Read docs/AI_STANDING_RULES.md, docs/PLAN_OWRPG_AND_MINIGAMES.md and HANDOFF.md.

Goal: confirm this machine and repo are ready for the overhaul, and record a baseline. Change no game code.

1. Run git status, git log -5 and git fetch; confirm master equals origin/master. Report anything uncommitted (do not commit the user's draft docs, the revert_staged_assets scripts, or unreferenced staged_assets files).
2. Confirm Python 3 works; install Playwright if missing (pip install playwright, then python -m playwright install chromium); confirm the gh CLI is authenticated (gh auth status).
3. Start python server.py --no-open --port 8791 in the background.
4. Run _qa_runner.html, _qa_hitboxes.html and _qa_owrpg.html headless, plus the smoke test on index.html and index.bundled.html (every mode plus all 63 minigames).
5. Run python tools/stamp_versions.py --check.
6. Write docs/BASELINE.md with: today's date, the master commit, every QA result with numbers, the smoke result, per-mode median and p95 frame time and draw calls, and GPU geometry/texture counts after 3 matches per mode.
7. Commit docs/BASELINE.md to master and push.

Report: the environment status, the baseline numbers, and anything that is not ready (with the fix).
```

## S2 — Repo hygiene (run once, before Prompt 1)

```
Read docs/AI_STANDING_RULES.md.

Branch: overhaul/s2-hygiene.

Goal: stop the 2.9 GB of unreferenced files in staged_assets/ (and other local-only files) from cluttering git status and risking an accidental commit, without deleting anything.

1. There is no .gitignore. Create one that ignores staged_assets/** EXCEPT the files the game actually references. Build the allow-list by scanning src/, css/, index.html and dist/ for every staged_assets path, including paths built at runtime by the BO.Assets helpers (read src/graphics/AssetLoader.js to see how paths are composed, e.g. a 'monsters/' prefix). Every already-tracked file must stay tracked (git ls-files staged_assets). Use negation rules (!path) for referenced files, or ignore whole folders where nothing inside is referenced.
2. Also ignore: tools/qa/out/ screenshots and json (keep .md summaries), __pycache__/, *.pyc, .claude/settings.local.json, the user's local docs/POLISH_PROMPT.md, docs/PROMPT_2_CORE_FEEL_PERF_STABILITY.md and docs/PROMPT_3_COMPLETE_AND_CONNECT.md, and revert_staged_assets.* (do not delete them).
3. Add tools/check_assets.py: list every asset path referenced in code that is missing from disk or ignored by git (a referenced asset must never be ignored), and exit 1 on any. Add it to AI_STANDING_RULES.md's testing list, and to tools/qa/run_all.py if that exists.
4. Verify:
   - git status shows no staged_assets noise;
   - check_assets.py passes;
   - the smoke tests pass on index.html and index.bundled.html with zero 404s;
   - after the push, GitHub Pages still serves the referenced assets (curl 10 random referenced asset URLs on the live site and expect 200).

Finish: a HANDOFF note, merge, push, and report the counts (ignored files, allow-listed files).
```

## H1 — Live-site check (run after every phase is merged)

```
Read docs/AI_STANDING_RULES.md. Change no code unless a check fails.

1. Run git log -1 on master; confirm origin/master matches.
2. gh api repos/thejaybirdsolution-eng/blackout-ops/pages/builds/latest: wait until it reports status "built" for that commit (poll every 10 s for up to 5 minutes).
3. Open https://thejaybirdsolution-eng.github.io/blackout-ops/?qa=1 headless (Playwright) and confirm:
   - the ?v= stamps in the live index.html match the repo;
   - the newest update-log entry id is shown in the menu's patch notes;
   - there are zero page errors, console errors and 404s;
   - starting and exiting one match per mode, plus 3 random minigames, works with no errors.
4. Take a screenshot of the main menu and one in-game screenshot per mode; save them to tools/qa/out/live/.

If anything fails, find the cause (missing file, unstamped version, untracked asset, bundle out of date), fix it on a hotfix branch, merge, push, and repeat this check.

Report: the deployed commit, every check's result, and any fixes made.
```

## H2 — Hotfix (when you find a bug while playing)

Replace the bracketed parts with your bug before pasting (use the BR template at the end).

```
Read docs/AI_STANDING_RULES.md and HANDOFF.md.

Bug report:
- Where: [mode / course / region / menu]
- What I did: [steps]
- What happened: [actual result, error text if any]
- What should happen: [expected result]
- How often: [always / sometimes / once]

Branch: hotfix/<short-name>.

1. Reproduce it headless (Playwright) or with a scripted test before changing anything; capture the error or a screenshot.
2. Find the root cause (file:line), and grep for the same mistake anywhere else in the codebase. Fix every occurrence.
3. Add a regression check (in _qa_runner.html, _qa_owrpg.html or tools/qa/) that fails without the fix and passes with it.
4. Run every test in AI_STANDING_RULES.md.
5. If docs/PROGRESS.md exists (a phase is mid-flight), do not touch that phase branch: hotfix master only.

Finish: an update-log entry ("Fixed: …"), merge, push, run the H1 live-site check, and report the cause, the fix and the regression test.
```

## H3 — Health check (after every 3–4 phases)

```
Read docs/AI_STANDING_RULES.md, docs/BASELINE.md, HANDOFF.md, and docs/PLAN_OWRPG_AND_MINIGAMES.md (to see which phases are done).

Branch: overhaul/health-<date>.

Goal: catch slow drift: regressions, dead code, inconsistent patterns, performance creep.

1. Run everything: tools/qa/run_all.py (or every suite individually), the smoke tests on both entry points, and tools/check_assets.py.
2. Compare performance with docs/BASELINE.md: per-mode median and p95 frame time, draw calls, triangles, and GPU memory across 3 matches. For any metric more than 10% worse than baseline, find the cause and fix it.
3. Review everything merged since the last health check for code cohesion (git log, and git diff <last-health-tag>..master):
   - dead code, and unused functions or files;
   - duplicated helpers that should be shared;
   - inconsistent patterns: HUD writes not using BO.HUD.set*, per-frame allocations, new scenes missing from GPULedger._collectKept;
   - leftover debug logs, TODOs and placeholders.
   Fix each one.
4. Save compatibility: in a temporary git worktree at docs/BASELINE.md's commit, play briefly headless and export a save from every mode that saves. Load those saves on current master and confirm they work.
5. Update docs/BASELINE.md with the new numbers (keep a history table), and tag the commit health-<date>.

Finish: a HANDOFF note, merge, push, run H1, and report every problem found and fixed.
```

## H4 — Split a phase that's too big

Replace the bracketed part before pasting.

```
Read docs/AI_STANDING_RULES.md, docs/PLAN_OWRPG_AND_MINIGAMES.md and docs/PLAN_PROMPTS.md.

Phase prompt [NUMBER] keeps running out of context. Do not write game code.

1. Read every file that prompt touches, and estimate the work per step.
2. Split it into 2–4 smaller prompts that each fit one session. Each new prompt must:
   - keep the exact structure of the existing prompts (read list, branch name, numbered steps, verification, exit gate, finish line);
   - not overlap with the others;
   - leave master shippable when merged on its own.
3. Put them into docs/PLAN_PROMPTS.md in place of the original (numbered like 21a, 21b, …), and update the run-order table.
4. Commit to master and push.

Report the new prompts.
```

## X1 — Online co-op compatibility check (end of Part A, and after Prompt 24)

```
Read docs/AI_STANDING_RULES.md, HANDOFF.md, and src/net/NetworkManager.js, src/net/CoopExtensions.js and src/net/NetValidation.js in full (ADR-017).

Branch: overhaul/net-check.

Goal: make sure the overhaul did not break online play, and that new content behaves sensibly online.

1. Open two headless browser pages on the local server and connect them through the game's own invite/room flow (or an existing loopback test path, if there is one). Run host and client through one Zombies match, one Tower Defense match, one Rogue Lite run, and Minigames Same-Room Versus on 3 courses.
2. Check that:
   - both sides see the same match state;
   - hits and kills register on both;
   - neither side has page errors;
   - NetValidation rejects malformed packets;
   - leaving and rejoining works.
3. For every system the overhaul added that touches shared state (the minigame HUD, bounds and counters; later, any online parts of Open World), confirm the host is authoritative and clients cannot desync or crash. Fix any breakage.
4. Add an automated two-page co-op smoke test to tools/qa/ and to run_all.py.

Finish: a HANDOFF note, an update-log entry if anything player-visible changed, merge, push, run H1, and report.
```

## X2 — Save compatibility check (after Prompts 15, 20 and 25)

```
Read docs/AI_STANDING_RULES.md, src/core/SaveSystem.js, src/owrpg/OWRPGSave.js, and the HANDOFF sections for the phases merged since the last X2.

Branch: overhaul/save-check.

1. Create real saves on the commit before the newest save-format change: check it out in a temporary git worktree and serve it on another port. Play headless long enough to create an Open World character with quests, inventory, equipment, a companion and faction rep, plus Rogue Lite, Survival and Profile progress. Export each save.
2. Load every one on current master. Confirm nothing is lost: items, quest stages, flags, rep, companions, levels, cosmetics, minigame personal bests and stars. Confirm new systems start up sensibly (for example, the chronicle reconstructed from completed quests, starter recipes, recalculated rarities).
3. Test a corrupted save and a save from a much older version: the game must not crash, must explain the problem, and must keep a backup.
4. Add these saves to tools/qa/fixtures/, and an automated migration test to run_all.py.

Fix any data loss or crash. Finish: a HANDOFF note, merge, push, run H1, and report.
```

## X3 — Game Guide, mode cards and tutorials update (end of Part A, end of Part B)

```
Read docs/AI_STANDING_RULES.md, src/ui/ModeGuide.js, the main-menu mode cards in src/ui/MenuController.js, src/minigames/MinigameHub.js, and the HANDOFF sections for every phase merged since the last X3.

Branch: overhaul/guide-update.

1. Update the in-game Game Guide (ModeGuide) so every new mechanic, control, activity, system and course change is documented accurately, and nothing still describes removed or changed behaviour.
2. Update the main-menu mode cards and hub descriptions. Counts (courses, regions, NPCs, quests, dungeons) must match the real data: compute them from the data, don't hard-code numbers.
3. First-time tutorial prompts: every new system (crafting, journal, activities, housing, …) gets a short contextual hint the first time it becomes relevant, shown once (saved), and switchable off in Settings.
4. Spell-check and tone-check all new player-facing text.

Verify with headless screenshots of every guide page and card. Finish: HANDOFF, an update-log entry, merge, push, run H1, and report.
```

## X4 — Controls, gamepad and settings audit (end of Part A, end of Part B)

```
Read docs/AI_STANDING_RULES.md, src/core/Settings.js (DEFAULT_KEYBINDS and the controls list with its per-mode ctx), src/ui/ControlsPanel.js, and the gamepad input module.

Branch: overhaul/controls-audit.

1. List every key the overhaul added (grep new code for e.code, handleKey and keybind checks). Each must be a rebindable action in Settings with a label, a tip and the right mode context. No hard-coded keys.
2. Find key conflicts within each mode context and resolve them.
3. Gamepad: every new action is reachable on a controller, and every new UI (crafting, journal, lockpicking, card game, housing, minigame results) is navigable with the D-pad or stick plus A/B.
4. Settings: every new option (accessibility, colour-blind palette, reduced motion, tutorial hints) is in the Settings UI and persists.
5. Add an automated check that every action used in code exists in DEFAULT_KEYBINDS, and that no mode context has duplicate bindings.

Finish: HANDOFF, an update-log entry, merge, push, run H1, and report.
```

## X5 — Asset sourcing pass (before Prompt 11, and before Prompts 16 and 21)

```
Read docs/AI_STANDING_RULES.md, C:\Users\PC\Desktop\game assets\README.md, and the plan phases this pass prepares for (A3 minigame maps, or B1 towns and B4 dungeons).

Branch: overhaul/assets-<topic>.

Goal: pick and prepare the exact assets the next phases will use, so the building sessions don't spend their context searching.

1. Inventory the relevant kits in C:\Users\PC\Desktop\game assets and staged_assets/ (models, textures, audio): name, path, format, polycount and texture size for models, and licence.
2. For each map, settlement or dungeon theme in the coming phases, choose a coherent set of assets: one art style per location, never mixing low-poly and realistic in one scene.
3. Convert or optimise where needed: GLB only, textures at most 1024² except hero assets, merge tiny meshes, strip unused animations. Copy the chosen files into staged_assets/ with clear folder names.
4. Write docs/ASSET_MANIFEST_<topic>.md: theme, asset list, intended use, licence and file size.
5. Make sure every copied file will be referenced (the next phase uses the manifest), and update the .gitignore allow-list from S2 as files become referenced.

Do not build scenes in this prompt. Finish: commit the manifest and assets, merge, push, and report the manifest.
```

## X6 — Balance playtest (after Prompt 10 for minigames; after Prompt 28 for Open World)

```
Read docs/AI_STANDING_RULES.md and HANDOFF.md.

Branch: overhaul/balance-<part>.

Minigames version:
1. For every course, run the golden bot at three skill levels over 5 seeds each: perfect; human-like (150 ms reaction plus aim error); and novice (300 ms plus larger aim error).
2. A novice should reach 1★ on most courses, human-like play 2–3★, and Platinum should need near-flawless play.
3. Flag courses with no difficulty ramp, dead time over 3 s, or score cliffs, and fix them (timings, target life, spawn density, thresholds).

Open World version:
1. Run a fresh character through the first 3 regions on a scripted route.
2. Track: XP and level against the quest level bands; credits against prices; time to kill and time to die per enemy family at band level; loot rarity rates; and crafting affordability.
3. Compare with docs/OWRPG_ECONOMY.md and fix every outlier.

Write the results tables into docs/BALANCE.md. Finish: HANDOFF, an update-log entry, merge, push, run H1, and report.
```

## X7 — Performance pass (end of Part B)

```
Read docs/AI_STANDING_RULES.md, docs/BASELINE.md, and DECISIONS.md ADR-026, ADR-028, ADR-030, ADR-031 and ADR-032.

Branch: overhaul/perf-pass.

1. Profile every mode, every minigame, every Open World settlement and dungeon, and the menus. Record median and p95 frame time, draw calls, triangles, shader programs, GPU geometries and textures, and JS heap growth over 5 minutes.
2. For the 10 worst cases, profile at method level (wrap hot functions, as the earlier audits did), then fix the root causes: allocations, redundant raycasts, uncached queries, oversized meshes or textures, missing instancing, too many lights or shadow casters.
3. Revisit static world batching: render-only merged meshes per material, for truly static props only. Never doors, interactables, destructibles, or anything a raycast depends on, unless the raycast list keeps the originals. Implement it only where it is safe, behind a quality setting.
4. Low-end check: with the Low quality preset at 1366×768, the median frame time must stay within budget.
5. Update docs/BASELINE.md.

Finish: an ADR for any new technique, HANDOFF, an update-log entry, merge, push, run H1, and report with before/after tables.
```

## L1 — Launch checklist (the very last prompt)

```
Read docs/AI_STANDING_RULES.md, docs/PLAN_OWRPG_AND_MINIGAMES.md (every step must be marked ✅), docs/BASELINE.md and HANDOFF.md.

Branch: release/overhaul-complete.

1. Confirm every plan step is marked ✅ with a commit hash. Run VERIFY-style checks on any step without one.
2. Full regression: run_all.py, the smoke tests on both entry points, check_assets.py, the co-op smoke, the save migration tests, stamp_versions --check, and a fresh tools/bundle.py.
3. A scripted, headless fresh-player pass: first launch → onboarding → each mode for 5 minutes → minigame hub → 5 courses → Open World new character → first settlement → first quest → craft → first dungeon. Zero errors, and no UI overlap (an mg_hud-style check on every screen visited).
4. README.md: update the feature list and counts to match the game.
5. HANDOFF.md: rewrite the top as a concise summary of the finished overhaul (systems, where they live, how to extend them).
6. Update log: a "major" entry summarising the whole overhaul.
7. Merge to master, push, run H1, and tag the release (git tag overhaul-1.0, then push the tag).

Report: the final numbers against docs/BASELINE.md, every suite's result, and the tag.
```

## BR — Bug report template (fill this in and paste it into H2)

```
Where: (mode / course / region / menu)
What I did: (step by step)
What happened: (include any red error text, or a screenshot path)
What should happen:
How often: (always / sometimes / once)
Browser and quality preset: (e.g. Chrome, High)
```
