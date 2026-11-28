# Blackout Ops — Open World RPG & Minigames Overhaul Plan

**Written:** Nov 28, 2026 · **Baseline:** `master` @ `b489572`
**Scope:** fix every Minigames defect and bring the 63 courses up to a shippable standard, then turn the Open World RPG into a full RPG with things to do in every region.

This plan comes from a measured audit, not guesswork:

- **Minigames:** all 63 courses were launched headless. An aim-bot played each one for its full duration (up to 90 s), recording score, stars, kills against targets spawned, accuracy, targets that were never visible, whether the course finished, falls, and every script error. A second probe walked the player outward in 8 directions for 12 s each to test map boundaries. A spawn screenshot of every course was reviewed for map and HUD design. Raw numbers are in **Appendix A**.
- **Open World RPG:** the live game was booted and every content table was counted, every system listed, and the quest, dialogue, dungeon, crafting and activity code read.

Bot numbers are evidence, not verdicts. Speed runs, puzzle cabinets and the Fun modes need movement or special inputs the bot does not perform. Every finding below is marked **Confirmed** (reproduced, or the cause found in code) or **Verify** (a probe flag to check first in Step A0.3).

---

## 0. How to execute this plan

1. **One branch per phase:** `overhaul/a1-mg-core`, `overhaul/a2-mg-courses`, and so on. Merge each into `master` only when its exit gate passes.
2. **Exit gate for every phase** (no exceptions):
   - `_qa_runner.html` 30/30, `_qa_hitboxes.html` 56/56, `_qa_owrpg.html` all passing.
   - Smoke 69/69 on both `index.html` and `index.bundled.html`, with zero page errors, console errors or 404s.
   - The new minigame suite (Step A0) is green for every course touched.
   - Per-mode profiler: no p95 frame regression above 10%, and GPU geometry and texture counts flat across 3 matches (the `BO.GPULedger` work must stay intact).
   - `python tools/stamp_versions.py`, then `python tools/bundle.py`, before committing.
3. **Docs in the same commit:** each phase adds its ADR to `DECISIONS.md`, a section to `HANDOFF.md`, and one player-facing entry to `src/data/UpdateLogData.js`.
4. **Order:** do Part A (Minigames) first, because it is fixing broken things that players hit today; Part B (Open World RPG) is mostly new content. Part B can start in parallel after Phase B0, because the two parts touch different files.

---

# PART A — MINIGAMES

## What is wrong (summary of the audit)

**Confirmed defects**

| # | Defect | Where | Evidence |
|---|---|---|---|
| A-1 | **Crash:** `st.damage is not a function`, thrown every time the laser sweeps a station | `src/minigames/FunGamesD.js:1198` (Kaiju) | Stations are core `Target`s, which have no `damage()` method; damage must go through `S.hitTarget(st, info)` |
| A-2 | **Crash:** `orbMat.setHex is not a function` | `src/minigames/FunGamesH.js:1024, 1219` (Dino Safari) | `orbMat` is a `MeshBasicMaterial`; it must be `orbMat.color.setHex(...)` |
| A-3 | Results screen shows **"TARGETS HIT 112 / 0"** | Bottle Juggler, Color Lock, Number Crunch, Switchyard, Starfall Shield, Fishing Hole, several speed runs and Fun modes | These courses create targets without `S.addTarget`, so `S.spawned` stays 0 while `S.kills` counts up (`MinigameCore._computeResult`) |
| A-4 | **Kills exceed targets spawned** (inflated stats, and possibly inflated scores) | Temple Run (72/68), Sweetheart Shore (54/48 from 50 hits), Orbital Breach (17/11) | Bonus or penalty targets are excluded from `spawned` in `addTarget` but still increment `kills` in `hitTarget` |
| A-5 | **HUD covers the gameplay** | 15 of 22 Fun modes, plus Final Fantasy, Master Zombie, 360 Trickshot and Contracts | Mode status and ability chips are laid out across the screen centre at crosshair height; the generic streak/accuracy stack collides with them; Combat Kitchen's order list covers the whole centre |
| A-6 | **Speed-run status chips overlap the ammo panel** | Outposts, Last 50, Chase, Sky Snipers, Ninja, Hydra Dragon, Freefall | Bottom chip rows are positioned without reserving the weapon panel's area |
| A-7 | **The "GO!" banner overlaps course titles and counters** | One Mag, Sweetheart Shore, Boss Rush, Last 50, Master Zombie, Bandit Town | The countdown overlay and the course banner share the same screen region |
| A-8 | **Course descriptions overflow under the title card** | Kaiju, Prophunt, Snowboarding, Angry Birds and others | The title card has no line clamp |
| A-9 | **The player can leave the play space** | Wild Hunt (90 m from the cabinet), Night Terrors (60 m), Mansion Raid (88 m out of the mansion) | Walk-out probe, Appendix A |
| A-10 | **The player falls off the map** | Castle Siege (walls, 2 directions), 360 Trickshot (3 directions; check which falls are intended) | Walk-out probe |
| A-11 | **Map design** | Range Day, Coaster, Skeet, Sweetheart Shore, Colosseum, Ghost Hunters, Paint Wars, Aim Lab, Ball Brawl | Each is a single flat slab (`map.boxes` holds one box) with scattered props: no backdrop, no lanes, no readable depth |
| A-12 | **Six arcade courses share one interior** | Bottle Juggler, Color Lock, Number Crunch, Switchyard, Starfall Shield, Safe Cracker | Same striped carnival tent; no identity per game |
| A-13 | **Clipped signage** | Switchyard ("TO BAI", "O PIT") | Canvas text wider than its sign texture |

**Verify first (probe flags, Step A0.3)**

- Courses that ended early: Heli Gunner (26 s of 60), Night Terrors (19 s of 60), Ghost Hunters (16 s of 165), Chess FPS (19 s of 165), Bumper Derby (7 s), Ball Brawl (4 s). Decide for each whether it is a legitimate fail condition or a bug.
- Scoring that ignores hits: Wild Hunt (0 points from 25 hits), Switchyard (0 from 131), Safe Cracker (0 from 184), Paint Wars (star thresholds are `[35…]`, a percentage: check that the coverage maths can reach them).
- Targets that are never visible from the player: Bandit Town (7), Prophunt (27), Toy War (10), Hydra Dragon (11 of 11), Pinball (15 of 15), Echo Panels (7 of 9), Contracts (4), Mansion Raid (9).
- Untimed courses that never finished within 90 s: Quickdraw, Speed-Run Gauntlet, Outposts, Sky Snipers, Ninja, Mario FPS, Final Fantasy, Inspection, Combat Kitchen, Pinball. Distinguish "needs a human route" from a soft-lock.
- Star thresholds a perfect player cannot reach (the aim-bot hit 118/118 on Beat Drop for 0★, and 100% hits on One Mag for 0★). Rhythm and timing bonuses may explain it; Step A2.4 measures the true ceiling.

---

## Phase A0 — Test harness in the repo (do this first)

The audit scripts currently live in a scratch folder. Make them permanent, so every later step has a pass/fail gate.

**A0.1 Create `tools/qa/`**
- `tools/qa/mg_audit.py`: the course player (aim-bot with ADS, trigger taps for semi-auto, and the deterministic `BO.App._simulate(1/30)` stepping used in the audit). Output: `tools/qa/out/mg_audit.json`, plus a markdown table.
- `tools/qa/mg_bounds.py`: the 8-direction walk-out test.
- `tools/qa/mg_sheet.py`: contact sheets of spawn screenshots, for design review.
- `tools/qa/ow_content.py`: the Open World content counter used for Part B's targets.
- `tools/qa/README.md`: how to run each script, and that it needs `python server.py --no-open --port 8791` running.
- Dependencies: Playwright and Chromium. Document the install (`pip install playwright` and `python -m playwright install chromium`) instead of pointing at a path outside the repo.

**A0.2 Add golden-path bots per course type.** Give each course def an optional `qaBot(S, lib, step)` hook, called by `mg_audit.py` every step, which drives the inputs a real player would use:
- Rail and target courses: aim and fire (the default).
- Rhythm (Beat Drop): fire when `|songT − beatTime| < window × 0.07` (PERFECT).
- Puzzle cabinets (Number Crunch, Echo Panels, Color Lock, Safe Cracker, Switchyard): read the solution from `S.data` and shoot the correct panel.
- Speed runs: follow `S.data.route` or the course's checkpoint list with the walk keys.
- Fun modes: each mode's own verbs (Kaiju stomp and claw, Kitchen cook and serve, and so on).

**A0.3 Triage every "Verify" flag** with the golden bots plus 2 minutes of hands-on play per course. Move each item into Confirmed (it gets a fix in A1/A2) or Not-a-bug (record why in `tools/qa/README.md`).

**A0.4 Per-course acceptance contract.** The audit fails a course unless all of these hold:
1. It starts with no page or console errors, and finishes on its results screen (timed courses) or on objective completion (untimed), with no soft-lock.
2. The spawn is on ground, not inside a collider, and faces the action (the first target is within ±35° of the initial view).
3. The player cannot leave the play space or fall out of the world unless falling is a mechanic, in which case it respawns and counts.
4. Every non-penalty target is visible from at least one reachable player position while it is alive.
5. The golden-path bot reaches at least 3★. A perfect bot, at most 4★ is reachable, and Platinum needs at least 90% of the measured ceiling.
6. Results stats are internally consistent: hits ≤ shots, kills ≤ targets, and accuracy ≤ 100%.
7. No HUD element overlaps the crosshair safe zone (the central 30% × 30%) or another HUD element (checked with `getBoundingClientRect` intersection tests).
8. p95 frame time ≤ 8 ms in the headless profiler; GPU memory flat after exiting.

**Exit gate:** `tools/qa/mg_audit.py` runs all 63 courses and prints a pass/fail table matching Appendix A's columns.

---

## Phase A1 — Framework fixes in `MinigameCore` (fix once, fix every course)

**A1.1 One target registry.**
- `Session.addTarget` stays the only way to create a scored target. Add `Session.registerTarget(obj, opts)` for courses that build custom entities (cabinets, puzzle panels, meteors, pests). It increments `spawned` or `bonusSpawned` and tags `userData.entity`.
- Split counters: `spawned`, `bonusSpawned`, `penaltySpawned`, `kills`, `bonusKills`, `penaltyHits`. `hitTarget` increments the counter that matches the target's kind, which fixes A-4.
- `_computeResult` shows "TARGETS HIT kills / spawned", and shows bonus targets as a separate stat only when `bonusSpawned > 0`. Courses with no countable targets set `def.resultTargets = false`, which hides the row (fixes A-3).
- Migrate every course listed in A-3 to `registerTarget` or `resultTargets: false`. Grep for `mgTarget = true` and for `hitPool.push` outside the core to find them all.

**A1.2 Damage API.** Add `Target.damage(amount, info)`, which routes through `ctx.hitTarget(this, Object.assign({ dmg: amount }, info))` so multi-HP targets work everywhere. Fix Kaiju (A-1) to use it. Grep every minigame file for `.damage(` and audit each call site.

**A1.3 Material colour API sweep.** Grep for `\b\w*Mat\.setHex\(` and `material\.setHex\(` across `src/minigames/`, and replace with `.color.setHex(...)` (fixes A-2). Add a check to `mg_audit.py` that fails on any `TypeError` in the loop.

**A1.4 Error isolation per course.** Wrap `def.update`, `def.onHit`, `def.onShot`, target `onTick`/`onKill` and every `S.animate` updater in a guarded call. The first error is logged with the course id; that one updater is disabled and the course keeps running. Events already have this; extend it to the rest.

**A1.5 HUD layout system (fixes A-5 to A-8).** Rebuild `#mg-hud` as named layout regions; courses never set absolute positions again:
- `top-left`: course card (title, then a one-line tagline clamped with an ellipsis; the full description in the hub only).
- `top-centre`: timer.
- `top-right`: score.
- `left-rail`: streak, accuracy and targets (collapsible; hidden on courses that set `hud.hideStats`).
- `bottom-centre-above-weapon`: course status chips (wrapping into at most two rows, with a max width that never enters the weapon panel's bounding box).
- `centre-overlay`: countdown and GO! only, shown for at most 0.9 s, never at the same time as a toast.
- `toast-lane`: one queue under the timer.
- **Crosshair safe zone:** a CSS variable box nothing may enter. `MinigameCore` measures it at runtime, and `mg_audit` asserts no overlap.

Move every Fun mode's ability bar from crosshair height to `bottom-centre-above-weapon`. Move Combat Kitchen's order list to a right-side ticket rail (cards slide in, and the max height is 45% of the viewport). Move Final Fantasy dialogue into a bottom dialogue box. Use the `BO.HUD.setText/setHtml/setStyle` gating from ADR-031 for every per-frame write.

**A1.6 Countdown and banner choreography.** The course banner animates in at t = 0 and out at t = 1.4 s; the countdown starts after it. "GO!" scales from 1.4 to 1.0 with opacity 1 → 0 over 0.7 s. Toasts are suppressed while either is on screen.

**A1.7 Play-space boundaries as data.** Add `def.map.bounds`: a polygon or AABB that `MinigameCore` turns into colliders, plus a soft edge (a vignette plus "RETURN TO THE COURSE" after 1 s outside, and a reset after 4 s). Add `def.map.killY`: falling below it respawns the player at the last safe point and applies the course's fall rule. Fixes A-9 and A-10.

**A1.8 Results integrity.** In `_computeResult`, clamp accuracy to [0, 100] and assert hits ≤ shots and kills ≤ spawned. Any violation is logged with the course id and fails `mg_audit`.

**A1.9 Spawn-facing check.** At start, if `def.firstLook` is set, ease the view to it over 0.3 s. Otherwise `mg_audit` computes the bearing to the first scheduled target and fails if it is more than 35° off.

**Exit gate:** A-1 to A-8 and A-13 closed for every course; `mg_audit` shows zero crashes and zero results-integrity failures.

---

## Phase A2 — Per-course fixes and calibration

Work category by category. For each course, in order: fix its Confirmed defects, run the golden bot, calibrate stars, play it by hand for 3 minutes, then re-run `mg_audit`. Append a "Course ledger" row to `tools/qa/README.md` (course, fixes, ceiling, new star thresholds).

**A2.1 Target & Action (16):** Range Day, Coaster, Temple Run, Skeet, Bandit Town, Drone Swarm, Sniper Ridge, Heli Gunner, Balloon Fest, Killhouse Blitz, Beat Drop, One Mag, Outlaw Pursuit, Mansion Raid, Sweetheart Shore, Whack-a-Mole.
- Bandit Town: move the 7 occluded spawn lanes so they are visible, or add a peek position the course moves the player to.
- Heli Gunner: confirm why it ends at 26 s (hull reaching 0, or the path ending). If it's the path, extend it to cover the duration; if it's hull damage, show a hull-critical warning and a "SHOT DOWN" result title.
- Sniper Ridge: add range markers (50/100/150/200 m flags) and wind flags if wind exists; make sure hold-breath (SHIFT) is explained in the tagline.
- Mansion Raid: close the exits (A1.7 bounds); move the statue off the first sightline; check that all 9 never-visible criminals are reachable by walking.
- Temple Run and Sweetheart Shore: re-check kill counting after A1.1.

**A2.2 Arcade Hall (18):** Quickdraw, Wild Hunt, Night Terrors, Ball Brawl, Aim Lab, Contracts, Bottle Juggler, Color Lock, Number Crunch, Echo Panels, Switchyard, Starfall Shield, Fishing Hole, Paint Wars, Safe Cracker, plus the remaining cabinets.
- Cabinet games (Wild Hunt, Night Terrors): lock the player to a cabinet stance (`rideState` with yaw and pitch limits facing the screen), and scale the play field up. The cabinet screen should fill at least 60% of the view at start, with a smooth dolly-in from the hall over 0.8 s.
- Wild Hunt, Switchyard, Safe Cracker scoring: confirm the scoring path with the golden bot. If hits really give 0 points, wire them to `S.award`.
- Contracts: let the dossier card collapse to a corner thumbnail after 2.5 s or on SPACE, so it never sits over the centre during play.
- Quickdraw: confirm the round flow ends (5 rounds, then results). It ran 94 s with no results in the probe.

**A2.3 Speed Runs (9):** Gauntlet, Outposts, Splitter, Last 50, Chase, Sky Snipers, Freefall, Ninja, Hydra Dragon.
- Every speed run gets `def.route` (an ordered checkpoint list) for the golden bot and a ghost line of the personal best (`MinigameDaily` PB ghost already exists; use it).
- Hydra Dragon: the probe found all 11 boss parts never visible from spawn. Verify the arena entry, and make the boss telegraph visible from the start.
- Ninja: add bounds (open in 5 directions).

**A2.4 Star calibration (all courses).** For each course, run the golden bot 5 times with different seeds and take the median as the "skilled ceiling". Set stars to Bronze 25%, Silver 50%, Gold 75% and Platinum 92% of that ceiling (rounded to clean numbers). For courses with hub variants (Beat Drop songs and modes), calibrate per variant through `starsFor(o)`.

**A2.5 Fun & Specials (22):** each needs (a) the HUD move from A1.5, (b) its own golden bot, and (c) its crash or flag resolved:
- Kaiju: A-1 fix. Dino Safari: A-2 fix.
- Ghost Hunters, Chess FPS, Bumper Derby: confirm their early endings.
- 360 Trickshot: decide which falls are intended (trickshot jumps count as "FALLS"); bound the rest.
- Castle Siege: add wall parapets, or bounds, on the 2 open edges.

**Exit gate:** every course passes the A0.4 contract.

---

## Phase A3 — Map and arena redesign

**A3.1 A map design standard** (write it into `docs/MINIGAME_MAP_STANDARD.md`). Every course map must have:
1. **Three depth bands:** a foreground frame (booth, cockpit, railing), a midground play space (where targets live), and a background skyline (a silhouette at more than 150 m), so distance is readable.
2. **Lanes:** targets appear in 3 to 5 named lanes or zones with distinct landmarks, so players learn the course.
3. **Contrast:** targets must stand out from their backdrop (minimum luminance contrast 3:1 against the area behind them). No target colour may be reused as a dominant scenery colour.
4. **A reason for every boundary:** walls, fences, cliffs, water or force fields. No invisible walls in open fields.
5. **A landmark** visible from spawn, and a lighting key (sun or neon) that points toward the action.
6. **Spawn framing:** the first 2 seconds show the play space and its first target.

**A3.2 Rebuild the flat-slab maps** (A-11) with `MapDetailBuilder` terraces, ramps and the Kenney and city kits. Use `placeGLBInstanced` for repeats, to keep draw calls in budget:
- Range Day: a tiered range with berms at 15/30/50 m, lane numbers on the berms, and a sand backstop.
- Coaster: theme-park midway under the track (stalls, Ferris wheel, lights) so the ride has context.
- Skeet: a trap house and high/low house, with readable throw origins (orange flags).
- Sweetheart Shore: a boardwalk, dunes, a pier and surf.
- Colosseum: a tiered seating bowl (instanced crowd sprites), a sand floor with a decal, and a gate tunnel.
- Ghost Hunters: mansion rooms with furniture instead of the flat pink floor.
- Paint Wars: a geometric arena with coloured coverage zones.
- Aim Lab: a clean sci-fi training room (grid walls, light panels) instead of the grey void.
- Ball Brawl: a proper platform model with rim lights and a readable ring-out edge; replace the 2 m `y = −400` slab with a real collision platform.

**A3.3 Give the six carnival-tent arcades their own identities** (A-12): Bottle Juggler as a saloon bar, Color Lock as a reactor room, Number Crunch as a game-show stage, Switchyard as a rail yard (fix its signs, A-13), Starfall Shield as a city rooftop at night, Safe Cracker as a bank vault. Whack-a-Mole's booth is the quality bar.

**A3.4 Performance budget per map:** at most 350 draw calls, 400k triangles, 30 unique materials and 2 shadow-casting lights. The headless profiler p95 must stay ≤ 8 ms.

**Exit gate:** contact sheets reviewed course by course against A3.1, and every map within the A3.4 budget.

---

## Phase A4 — Feel, flow and hub polish

1. **Hit feedback:** a per-target-type sound and particle burst (already in `MinigameFeel`; audit coverage per course), plus a crosshair hit-pulse, consistent in every course.
2. **Results screen:** star reveal animation, a PB delta, a "next star at N points" hint, and a one-click retry or next course.
3. **Onboarding:** a 3-step control card per course (shown on the first launch only), generated from `def.keys`.
4. **Hub:** category filters, stars and PB on every card, a "new" badge for courses never played, and the daily challenge pinned at the top.
5. **Accessibility:** colour-blind-safe target palettes (target vs penalty tells by shape as well as colour), and subtitles for voice lines.

**Exit gate:** a hands-on playthrough of 10 random courses with no UX issue found, and the A0.4 contract still green for all 63.

---

# PART B — OPEN WORLD RPG

## What it has today (measured)

| Area | Today | Problem |
|---|---|---|
| World | 1,280 m × 1,280 m, 12 regions, 54 points of interest, 12 fast-travel pylons, 12 landmarks | Large but thinly populated |
| NPCs | **13 named NPCs** in total, 13 dialogue trees, 197 dialogue choices, **8 attribute checks** | 12 regions share 13 people; almost no reactivity to your stats |
| Quests | 50 (10 main, 13 side, 5 contracts, 5 faction, 8 delves, 9 explore); triggers are only `kill`, `flag`, `item`, `count` | No talk, escort, deliver, defend, timed, stealth or puzzle objectives |
| Bounties | 16, all "kill N of X" | No variety |
| Dungeons | 12, but **11 are the identical 32 × 72 m box** (`buildDungeonGeometry` in `OWRPGWorldData.js:470`) with an archway, 6 pillars, 2 cover blocks and a boss dais, only retextured | No layouts, puzzles, traps, secrets or treasure rooms |
| Crafting | **None.** The workbench just opens the inventory (`OWRPGInteriors.js:242`); 21 resource nodes feed no recipes | The economy has no sink and gathering has no purpose |
| Items | 121 items (36 weapons, 7 helmets, 7 boots, 9 rigs, 8 relics, 10 tools, 7 consumables, 14 junk, 23 quest), 4 rarities with at most 2 affixes, 6 armour sets | No uniques, no upgrades, little build variety |
| Character | 5 attributes, 7 skills, 9 perk trees, 4 primer and 4 expansion abilities, 8 standing stones | Thin ability kit |
| Companions | 3 (Soren, Kael, Torque), combat auras and AI | No approval, no personal quests, no banter |
| Factions and vendors | 4 factions, 9 vendors | No services (inn, doctor, trainer) |
| Mounts | 4 | Nothing to do with them (no races) |
| Missing entirely | — | Fishing, cooking, hunting trophies, lockpicking as a game (it's a stat gate today), pickpocketing, player housing, item upgrades or enchanting, gambling and card games, arenas, races, treasure maps, achievements, rest/wait/sleep, a character creator, ambient NPC life |

**Targets for the end of Part B:** at least 60 named NPCs; 120+ quests using 12 objective types; 11 unique handcrafted dungeons; 80+ crafting recipes; 10 activities; player housing; 6 rarity tiers including uniques; 24 abilities; and 3 deep companions plus 2 new ones.

---

## Phase B0 — Content pipeline (foundation for everything else)

**B0.1 Data schemas and validation.** Extend `src/owrpg/OWRPGValidator.js` (it already backs `_qa_owrpg.html`) with schema checks for every new table: required fields, id references (giver NPC exists, item ids exist, markers resolve to a POI), and reachability (every quest marker is on walkable ground). It runs inside `_qa_owrpg.html`, so content mistakes fail QA.

**B0.2 Quest objective vocabulary.** Extend `OWRPGQuests.js` stage triggers from `kill/flag/item/count` to:
- `talk:<npc>`, `reach:<poi>[:radius]`, `collect:<item>:<n>` (counted from the inventory, not on pickup), `deliver:<item>:<npc>`
- `escort:<npcId>:<poi>` (an NPC follows; fail if it dies), `defend:<poi>:<seconds>` (waves from `OWRPGEvents`)
- `timed:<seconds>` (wraps any stage), `stealth:<poi>` (fails if detected; uses `OWRPGAI` detection)
- `craft:<recipe>`, `use:<interactId>`, `photo:<poi>` (look-at check), `choice:<dialogueNode>`

Each trigger needs a handler, a journal text template, a map-marker rule and a validator rule.

**B0.3 Journal and tracking UI.** In the Pip-Pad `quests` tab: a tracked quest pinned to the HUD with its stage text and distance, compass markers for the active stage, quest categories with filters, and a completed-quest log that records the branch you took.

**B0.4 World-state and consequence log.** One `state.chronicle[]` where every quest branch, faction shift and major kill is recorded. Dialogue, territory shifts and endings read it.

**Exit gate:** `_qa_owrpg.html` adds checks for every new trigger, with one test quest per trigger type.

---

## Phase B1 — Towns and people (biggest "nothing to do" fix)

**B1.1 A settlement in every region** (12; Freestead already exists). Each has: a gate or approach landmark, 4 to 8 buildings built from the city, building and castle kits, lighting at night, and one signature location (inn, chapel, market, dock, forge, observatory…).

**B1.2 NPC roster, from 13 to at least 60.** Per settlement: a leader, a vendor, a service NPC, a quest giver, and 2 or 3 townsfolk. Each NPC gets a dialogue tree with an introduction, rumours (pointing to POIs and side quests), a shop or service, and at least one attribute or skill check.

**B1.3 Services:**
- **Inn:** rest, wait and sleep (B5.9), rumours, and hiring the companion stationed there.
- **Doctor:** cure statuses and sell consumables.
- **Trainer:** buy skill XP at a credit cost, capped per level.
- **Smith:** repair (`OWRPGDurability`), upgrade (B3.4) and salvage.
- **Fence:** sell stolen items (B5.3).

**B1.4 Daily schedules and ambient life.** `OWRPGAct2Data.SCHEDULES` already labels dawn, day and night. Make NPCs walk between home, work and tavern along nav paths; add ambient barks (greetings, reactions to your faction rank, weather and recent quest outcomes from the chronicle); and add townsfolk crowds as instanced, LOD'd figures to keep the draw-call budget.

**B1.5 Reactivity.** Raise attribute and skill checks in dialogue from 8 to at least 60, using TCH, BRW and the other attributes, plus skills (arcana, foraging…). Faction rank changes prices, greetings and access. Major branches show up in later dialogue.

**Exit gate:** `ow_content.py` reports at least 60 NPCs, 12 settlements and at least 60 checks; the validator confirms every NPC has a reachable position and a tree.

---

## Phase B2 — Crafting, gathering and economy

**B2.1 A recipe system** (new `src/owrpg/OWRPGCrafting.js` and `src/data/OWRPGRecipesData.js`). Each recipe has inputs, an output, a station (workbench, campfire, alchemy table, forge), a skill requirement and XP. The workbench interaction opens a real **Crafting** Pip-Pad tab: categories, what you can craft now, missing materials highlighted, and a craft-all option.

**B2.2 Recipe categories (80+):** ammo (per calibre), consumables (medkits, elixirs, food buffs), weapon mods (scopes, barrels, magazines and stocks, which reuse the Gunsmith attachments), armour reinforcement, tools and repair kits, throwables, ability catalysts, and housing furniture (B4).

**B2.3 Gathering.** Raise resource nodes from 21 to about 120, spread by biome (ore, herbs, wood, salvage, crystals) and placed by `OWRPGGroundCover`'s chunk system with respawn timers. Add harvest animations, a sound per material, and skill-scaled yields (mining, foraging, arcana).

**B2.4 Economy balance.** Credit sources (quests, loot, selling) against sinks (crafting fees, upgrades, housing, training, fast travel). Build a spreadsheet model (`docs/OWRPG_ECONOMY.md`) and tune prices so that level 10 can afford one upgrade per 30 minutes of play.

**Exit gate:** at least 80 recipes, all valid in the validator; a golden-path test crafts one item from each station.

---

## Phase B3 — Loot depth and builds

**B3.1 Rarity tiers from 4 to 6:** add Uncommon (between Common and Rare) and **Unique**, a named item with a fixed special effect.
**B3.2 30 uniques**, one per boss and dungeon, plus world secrets. Each has a gameplay-changing effect (for example: ricochet bullets, kills spread Burn, reload on dodge).
**B3.3 Set bonuses.** The 6 existing `ARMOR_SETS` get 2-, 3- and 4-piece bonuses; add 4 new sets tied to the new dungeons.
**B3.4 Upgrades at the smith:** a tier 1–5 upgrade path per item (stats plus durability) using crafted materials, and affix rerolling for a fee (a credits and materials sink).
**B3.5 Affixes from 8 to about 30**, with up to 3 on Epic and 4 on Legendary. Keep the `PITY_GUARANTEE` logic.
**B3.6 Transmog** (appearance override) at the smith.

**Exit gate:** the loot table simulator (add it to the validator) shows each tier's drop rate within 5% of design.

---

## Phase B4 — Dungeons (replace the 11 identical boxes)

**B4.1 A modular room kit** (new `src/owrpg/OWRPGDungeonKit.js`): rooms (corridor, junction, hall, arena, vault, shrine and puzzle room), connectors and set dressing per theme (barrow, foundry, crypt, vampire, coven, mine, tomb, sea cave, ice keep, void, dragon vault). It shares materials and uses `placeGLBInstanced`.

**B4.2 A handcrafted layout per dungeon** (data in `OWRPGWorldData.DUNGEONS[i].layout`): 6 to 12 rooms, at least one branch, one secret room (a breakable wall, or a lever plus perception check), a mini-boss before the boss, and a loot vault after it. Replace `buildDungeonGeometry` with the kit builder. Keep the surface entrances, levels and boss ids, so existing quests and the `_qa_owrpg` dungeon-route checks keep working (update their route expectations to the new layouts).

**B4.3 Traps:** pressure plates (darts, fire jets), swinging blades, collapsing floors and poison gas. Each is visible to high-perception characters and can be disarmed (TCH), avoided or triggered on enemies.

**B4.4 Puzzles (at least 1 per dungeon):** lever sequences, symbol doors (the clue is in lore tomes), light-beam mirrors, weight plates and timed runs.

**B4.5 Boss arenas:** a unique arena per boss with phase mechanics (the existing boss ids are kept, and their attack sets extended).

**B4.6 Rewards:** a unique (B3.2) on first clear, a recipe scroll, and a lore page.

**Exit gate:** each dungeon passes a route-walk test (`_qa_owrpg`), has a secret and a puzzle verified by a scripted test, and fits the A3.4 performance budget.

---

## Phase B5 — Activities (things to do between quests)

Each activity gets its own small module under `src/owrpg/activities/`, a Pip-Pad tracker, achievements (B7.3) and a validator entry.

1. **Fishing:** cast and reel with a tension meter; fish species by biome, water body and time of day; a trophy log; cooked fish as buffs. Reuse the Fishing Hole minigame's catch logic.
2. **Hunting:** trackable animals (wolves exist; add deer, boar, bear and a snow cat), with pelts and trophies for crafting and housing.
3. **Lockpicking:** a real lock minigame (sweet-spot rotation, picks break), replacing the TCH 7 stat gate; TCH widens the sweet spot.
4. **Pickpocketing and theft:** a detection meter, stolen-item flags, a fence, and guard and bounty consequences per faction.
5. **Cards — "Dead Man's Draw":** an in-world card game at every inn, with NPC opponents and collectible cards from loot.
6. **Arena:** a fight pit in Rust Sprawl with tiered brackets, betting, and unique rewards.
7. **Mount races:** 4 race tracks across regions, a ghost of your best time, and mount upgrades.
8. **Treasure maps:** painted map fragments found as loot, pointing to dig sites (a landmark-matching hunt).
9. **Rest, wait and sleep:** at inns, beds and camps. Advances the time (existing `OWRPGWorldSim` time and weather), heals, and gives a "well-rested" XP buff.
10. **Camps:** a deployable campfire for cooking and resting in the wild, which also works as a respawn point.

Also: rotate the 16 bounties into **radiant contracts** (target type × region × modifier: elite, escort, timed, stealth) so the board always has fresh work.

**Exit gate:** every activity has a scripted smoke test in `_qa_owrpg.html` and at least one achievement.

---

## Phase B6 — Character and companions

1. **Character creator:** body type, face presets, hair, skin and scars, plus a background that grants a starting perk. It renders on the existing soldier rig.
2. **Abilities from 8 to 24:** 4 per attribute school, unlocked through the perk trees, each using the existing `STATUSES` and `REACTIONS` (chill, burn, shock, expose…) for combinations.
3. **Skills:** add Speech (prices and persuasion), Survival (fishing, hunting, camps) and Thievery (locks, pickpocketing) to the existing 7, each with a perk tree.
4. **Companions:** Soren, Kael and Torque get an approval meter (reacting to choices recorded in the chronicle), a 3-part personal quest each, camp banter, and a loyalty perk. Add 2 new companions with personal quests.

**Exit gate:** the validator checks every ability's data; each companion quest has a scripted completion test.

---

## Phase B7 — Quests, narrative and progression

1. **Quest count from 50 to 120+:** at least 4 side quests per region using the B0.2 objective types (at least 6 different types per region), 12 new faction quests (3 per faction), and the 11 dungeon quests reworked around the new layouts.
2. **Main story:** a clear Act I–VI throughline, with the existing `OWRPGAct2Data` acts kept and their beats tightened. Each act ends in a set piece. Ending slides read the chronicle (settlements, factions, companions).
3. **Achievements:** around 60, across exploration, combat, crafting, activities and story, with Pip-Pad badges. Tie them into the shared account level (`ProfileSystem`).
4. **Discovery and cartography:** the 156 hidden sites (`OWRPGDiscoveries`) get lore payoffs and map completion rewards per region.

**Exit gate:** `ow_content.py` reports at least 120 quests and at least 12 objective types in use; every quest is completable by a scripted run in `_qa_owrpg.html`.

---

## Phase B8 — Player housing

1. **Freestead home** (a quest unlocks it), plus 2 more homes bought later (coast cabin, mountain lodge).
2. **Features:** stash (it replaces the 2 world stashes), crafting stations, a weapon wall and armour mannequins (display items), a trophy wall (hunting, bosses), a garden (grow herbs for alchemy), and a bed that sets the respawn point.
3. **Furniture:** crafted (B2) or bought; placed with a grid or free-place mode reusing the Survival build system's placement code (`ZoneBuild`).

**Exit gate:** save, load and placement round-trip test in `_qa_owrpg.html`.

---

## Phase B9 — Polish, balance and performance

1. **Level curve:** 1 → cap over about 25 hours of content. Each region's level band is matched to the B7 quest XP and enemy scaling.
2. **Combat feel per enemy family:** hit reactions, telegraphs and death animations (the UAL presets from ADR-029 are already wired).
3. **Performance:** settlements and crowds stay within budget (Open World median frame cost and draw-call checks already exist in `_qa_owrpg`: keep them green at fewer than 200 calls). GPU memory stays flat across save, load and fast travel.
4. **Save compatibility:** bump `OWRPGSave` to a new version with a migration that gives existing characters the new systems (empty housing, starter recipes, recalculated rarities).

**Exit gate:** a full regression of every QA suite, a 2-hour hands-on playthrough (new character → Act II), and an update log entry.

---

## Suggested schedule (sequential, one developer)

| Order | Phase | Size |
|---|---|---|
| 1 | A0 harness | S |
| 2 | A1 framework fixes | M |
| 3 | A2 per-course fixes and calibration | L |
| 4 | A3 map redesign | L |
| 5 | A4 polish | M |
| 6 | B0 content pipeline | M |
| 7 | B1 towns and NPCs | XL |
| 8 | B2 crafting | L |
| 9 | B3 loot | M |
| 10 | B4 dungeons | XL |
| 11 | B5 activities | XL |
| 12 | B6 character and companions | L |
| 13 | B7 quests and narrative | XL |
| 14 | B8 housing | M |
| 15 | B9 polish | M |

Phases A0–A2 should happen first, because they fix things that are broken today. B0 unblocks all of Part B, and from there B1/B2/B4 can run in parallel on separate branches, because they touch separate files.

---

## Appendix A — Per-course audit (all 63 minigames)

How to read this table:
- **Bot probe:** an aim-bot with no movement, hip-firing, run once at seed 12345. Low accuracy on rail and sniper courses mostly comes from the bot, not the game.
- **Automated flags:** raw probe output; Step A0.3 triages each one.
- **Visual / map review:** from the spawn screenshots.

| # | Course | Cat | Bot probe (score · stars · kills/spawned · accuracy) | Automated flags | Visual / map review |
|---|---|---|---|---|---|
| 1 | `range_day` | target | 7815 pts · 1★ · 81/88 · acc 32% | — | Flat 140 m sand plane, a booth and a few crates; no backdrop depth or lane structure. |
| 2 | `coaster` | target | 4196 pts · 0★ · 23/72 · acc 4% | — | Rail over a flat 420 m grass plane; scenery sparse below the track. |
| 3 | `temple_run` | target | 9216 pts · 2★ · 72/68 · acc 26% | kills (72) exceed targets spawned (68) | — |
| 4 | `skeet` | target | 4100 pts · 2★ · 22/50 · acc 37% | — | Flat field, single house; throw origins not readable. |
| 5 | `bandit_town` | target | 360 pts · 0★ · 16/59 · acc 20% | 7 targets never visible from the player | Town facades occlude part of the spawn lanes (targets that are never visible). |
| 6 | `drone_swarm` | target | 9860 pts · 2★ · 55/70 · acc 20% | — | — |
| 7 | `sniper_ridge` | target | 849 pts · 0★ · 4/41 · acc 3% | 1 targets never visible from the player | Ridge reads as a single flat backdrop; distances not readable without range markers. |
| 8 | `heli_gunner` | target | 5950 pts · 1★ · 21/23 · acc 11% | ended at 26s of 60s (check fail rule); 3 targets never visible from the player | City blocks from above; hostages/targets small against roofs. |
| 9 | `balloon_fest` | target | 8450 pts · 1★ · 93/137 · acc 21% | 3 targets never visible from the player | — |
| 10 | `killhouse_blitz` | target | 9110 pts · 3★ · 56/64 · acc 24% | 2 targets never visible from the player | — |
| 11 | `beat_drop` | target | 7200 pts · 0★ · 118/118 · acc 50% | — | — |
| 12 | `one_mag` | target | 3200 pts · 0★ · 5/17 · acc 17% | ended at 17s of 31s (check fail rule) | Course title banner is overlapped by the GO! overlay. |
| 13 | `outlaw_pursuit` | target | 1320 pts · 0★ · 26/31 · acc 31% | — | — |
| 14 | `mansion_raid` | target | 550 pts · 0★ · 1/10 · acc 8% | 9 targets never visible from the player; did not finish in 90 s (untimed objective or soft-lock); can walk 88 m from spawn | Player can walk out of the mansion (88 m); statue blocks first sightline. |
| 15 | `sweetheart_shore` | target | 33676 pts · 4★ · 54/48 · acc 17% | kills (54) exceed targets spawned (48) | GO! overlaps title; shore is a flat plane. |
| 16 | `boss_rush` | boss | 0 pts · 0★ · 0/0 · acc 61% | 0 points from 74 hits | GO! overlaps the boss counter. |
| 17 | `whack_a_mole` | target | 15500 pts · 4★ · 83/92 · acc 81% | — | Strong booth design — use as the reference standard for arcade booths. |
| 18 | `quickdraw` | arcade | 41784 pts · 4★ · 0/16 · acc 31% | did not finish in 90 s (untimed objective or soft-lock) | — |
| 19 | `cab_wild_hunt` | arcade | 0 pts · 0★ · 15/61 · acc 6% | 0 points from 25 hits; can walk 90 m from spawn | Game is played on a small cabinet screen; player can wander 90 m away from the cabinet. |
| 20 | `cab_night_terrors` | arcade | 140 pts · 0★ · 1/12 · acc 2% | ended at 19s of 60s (check fail rule); can walk 60 m from spawn | Same cabinet framing problem; player can wander 60 m away. |
| 21 | `ball_brawl` | arcade | 0 pts · 0★ · 0/0 · acc — | — | Tiny washed-out platform; ground slab is a 2 m box at y=-400 (relies on ride state). |
| 22 | `aim_lab` | arcade | 3355 pts · 1★ · 2/3 · acc 80% | 1 targets never visible from the player | Grey void, no environment. |
| 23 | `contracts` | arcade | 0 pts · 0★ · 0/13 · acc 0% | 4 targets never visible from the player | Dossier card covers the centre of the screen at start. |
| 24 | `bottle_juggler` | arcade | 9675 pts · 2★ · 38/0 · acc 29% | results screen shows "38 / 0" targets; ended at 19s of 60s (check fail rule) | Shares the striped carnival tent interior. |
| 25 | `color_lock` | arcade | 13850 pts · 2★ · 112/0 · acc 84% | results screen shows "112 / 0" targets | Shares the striped carnival tent interior. |
| 26 | `number_crunch` | arcade | 60 pts · 0★ · 1/0 · acc 96% | results screen shows "1 / 0" targets; ended at 12s of 60s (check fail rule); 2 targets never visible from the player | Shares the striped carnival tent interior. |
| 27 | `echo_panels` | arcade | 0 pts · 0★ · 0/0 · acc 100% | ended at 11s of 120s (check fail rule); 7 targets never visible from the player | HUD sign overlaps the panel matrix. |
| 28 | `switchyard` | arcade | 0 pts · 0★ · 3/0 · acc 100% | results screen shows "3 / 0" targets; ended at 19s of 60s (check fail rule); 1 targets never visible from the player; 0 points from 131 hits | Shares the carnival tent; destination signs are clipped ("TO BAI", "O PIT"). |
| 29 | `starfall_shield` | arcade | 42605 pts · 4★ · 148/0 · acc 27% | results screen shows "148 / 0" targets; 6 targets never visible from the player | Shares the carnival tent. |
| 30 | `fishing_hole` | arcade | 1455 pts · 0★ · 11/0 · acc 60% | results screen shows "11 / 0" targets; 2 targets never visible from the player | — |
| 31 | `paint_wars` | arcade | 4630 pts · 0★ · 0/0 · acc 100% | — | Mostly empty white arena. |
| 32 | `safe_cracker` | arcade | 0 pts · 0★ · 0/0 · acc 100% | 0 points from 184 hits | Shares the carnival tent. |
| 33 | `sr_gauntlet` | speed | 0 pts · 0★ · 6/0 · acc 34% | results screen shows "6 / 0" targets; 34 targets never visible from the player; 0 points from 320 hits; did not finish in 90 s (untimed objective or soft-lock) | — |
| 34 | `sr_outposts` | speed | 0 pts · 0★ · 4/0 · acc 19% | results screen shows "4 / 0" targets; did not finish in 90 s (untimed objective or soft-lock); can walk 74 m from spawn | Bottom status chips overlap the ammo panel. |
| 35 | `sr_splitter` | speed | 0 pts · 0★ · 7/0 · acc 54% | results screen shows "7 / 0" targets; 5 targets never visible from the player; 0 points from 28 hits | — |
| 36 | `sr_last50` | speed | 0 pts · 0★ · 9/0 · acc 39% | results screen shows "9 / 0" targets; 5 targets never visible from the player; 0 points from 21 hits | GO! overlay and status chips overlap the ammo panel. |
| 37 | `sr_chase` | speed | 0 pts · 0★ · 0/0 · acc 0% | 1 targets never visible from the player | Bottom chips stack into the ammo panel. |
| 38 | `sr_skysnipers` | speed | 0 pts · 0★ · 2/0 · acc 10% | results screen shows "2 / 0" targets; 0 points from 8 hits; did not finish in 90 s (untimed objective or soft-lock) | Bottom chips overlap the ammo panel. |
| 39 | `sr_freefall` | speed | 0 pts · 4★ · 16/0 · acc 14% | results screen shows "16 / 0" targets; 3 targets never visible from the player; 0 points from 29 hits | Bottom chips overlap the weapon panel. |
| 40 | `sr_ninja` | speed | 0 pts · 0★ · 0/0 · acc — | did not finish in 90 s (untimed objective or soft-lock); can walk 85 m from spawn | Bottom chips overlap the ammo panel; open map without bounds in 5 directions. |
| 41 | `sr_hydra_dragon` | speed | 0 pts · 0★ · 0/0 · acc — | 11 targets never visible from the player | Boss HP bars overlap the ammo panel. |
| 42 | `fun_angry_birds` | fun | 0 pts · 0★ · 0/13 · acc — | — | Status bar sits across the top-centre of the play view. |
| 43 | `fun_master_zombie` | fun | 980 pts · 0★ · 0/5 · acc — | ended at 39s of 300s (check fail rule); can walk 90 m from spawn | Control/ability chips cover the centre; GO! overlaps. |
| 44 | `fun_snowboarding` | fun | 13109 pts · 4★ · 12/22 · acc — | — | — |
| 45 | `fun_360_trickshot` | fun | 0 pts · 0★ · 0/5 · acc — | 5 targets never visible from the player; did not finish in 90 s (untimed objective or soft-lock); falls off the map (dirs 0,45,315) | Instruction panel covers the left third; player can fall off in 3 directions. |
| 46 | `fun_mario_fps` | fun | 0 pts · 0★ · 0/0 · acc — | did not finish in 90 s (untimed objective or soft-lock); can walk 115 m from spawn | Status bar across the centre top. |
| 47 | `fun_final_fantasy` | fun | 0 pts · 0★ · 0/0 · acc — | did not finish in 90 s (untimed objective or soft-lock); can walk 109 m from spawn | Dialogue/quest text renders over the centre of the screen. |
| 48 | `fun_inspection` | fun | 0 pts · 0★ · 0/0 · acc — | did not finish in 90 s (untimed objective or soft-lock) | Tool chips cover the crosshair area. |
| 49 | `fun_prophunt` | fun | 3250 pts · 1★ · 5/0 · acc 86% | results screen shows "5 / 0" targets; 27 targets never visible from the player; did not finish in 90 s (untimed objective or soft-lock) | Ability bar sits at crosshair height. |
| 50 | `fun_kaiju` | fun | 14420 pts · 2★ · 20/0 · acc — | **CRASH:** `st.damage is not a function`; results screen shows "20 / 0" targets; 20 targets never visible from the player | Ability bar at crosshair height; description overflows under the title. |
| 51 | `fun_bumper_derby` | fun | 0 pts · 0★ · 0/0 · acc — | ended at 7s of 120s (check fail rule) | Ability bar at crosshair height. |
| 52 | `fun_combat_kitchen` | fun | 15070 pts · 4★ · 24/24 · acc 95% | did not finish in 90 s (untimed objective or soft-lock) | Order list covers the entire centre of the screen. |
| 53 | `fun_sky_pirate` | fun | 20055 pts · 4★ · 18/18 · acc 82% | ended at 42s of 180s (check fail rule) | Ability bar at crosshair height. |
| 54 | `fun_toy_war` | fun | 5080 pts · 1★ · 4/19 · acc 43% | ended at 45s of 150s (check fail rule); 10 targets never visible from the player | Ability bar at crosshair height. |
| 55 | `fun_chess_fps` | fun | 13055 pts · 4★ · 12/13 · acc 75% | ended at 19s of 165s (check fail rule); 1 targets never visible from the player | Ability bar + royal bar overlap the crosshair. |
| 56 | `fun_ghost_hunters` | fun | 0 pts · 0★ · 0/0 · acc — | ended at 16s of 165s (check fail rule) | Ability bar at crosshair height; flat pink floor. |
| 57 | `fun_colosseum` | fun | 17798 pts · 4★ · 17/20 · acc 66% | ended at 44s of 165s (check fail rule) | Ability bar at crosshair height; arena floor is a flat plane. |
| 58 | `fun_orbital_breach` | fun | 7458 pts · 2★ · 17/11 · acc 30% | kills (17) exceed targets spawned (11); ended at 30s of 180s (check fail rule) | Objective text overlaps itself across the centre. |
| 59 | `fun_abyssal_mech` | fun | 21082 pts · 4★ · 18/21 · acc 32% | ended at 49s of 170s (check fail rule); can walk 90 m from spawn | Ability bar at crosshair height. |
| 60 | `fun_dino_safari` | fun | 2280 pts · 0★ · 4/5 · acc 56% | **CRASH:** `orbMat.setHex is not a function`; 2 targets never visible from the player | Ability bar at crosshair height. |
| 61 | `fun_castle_siege` | fun | 4128 pts · 1★ · 6/25 · acc 33% | ended at 50s of 165s (check fail rule); falls off the map (dirs 0,45) | Ability bar at crosshair height; player falls off the wall in 2 directions. |
| 62 | `fun_hoverbike_highway` | fun | 24735 pts · 4★ · 19/19 · acc 34% | ended at 43s of 155s (check fail rule) | Ability bar at crosshair height. |
| 63 | `fun_pinball_arena` | fun | 39825 pts · 4★ · 0/10 · acc — | 15 targets never visible from the player; did not finish in 90 s (untimed objective or soft-lock) | Ability bar at crosshair height. |
