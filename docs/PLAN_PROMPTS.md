# Prompts to carry out the Overhaul Plan

There are 28 prompts, plus a RESUME prompt and a VERIFY prompt. Run them **in order, one per session**, starting each in the `blackout-ops` folder. Paste the whole prompt (everything inside its box). Each one is self-contained: it tells the AI which files to read, what to build, how to test it, and when it is done.

**Before prompt 1:** commit `docs/PLAN_OWRPG_AND_MINIGAMES.md`, `docs/AI_STANDING_RULES.md` and this file to `master`, so every session can read them.

**After every prompt:** check the AI's final report. If any test failed or anything is listed as unfinished, run **VERIFY** (to check the work) or **RESUME** (to continue it) before moving on.

**If a session runs out of context mid-prompt,** run RESUME. Don't re-run the original prompt.

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
