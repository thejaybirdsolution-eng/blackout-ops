# Survival Gold — Audit, Triage & Red-Team Plan

Branch: `survival-gold` (cut from `survival-1.0`). Status: **Steps 1–3 for approval. No game code changed yet.**

Player complaint, verbatim: *"Nothing to do, nothing to collect, nothing to build. Unlike Minecraft, where it is easy to find stuff to do and easy to get set up and ready for night time."*

---

# STEP 1 — SYSTEM AUDIT

## 1.0 The headline finding

**The game doesn't lack content. The player can't see it, can't find their way through it, and doesn't feel it.**

Measured in a live local run (`survival-1.0` build, seed default, Crash Valley spawn):

| Metric | Value |
|---|---|
| Harvestable / lootable world markers | **1,026** (≈45 within 60 m of spawn) |
| Craft recipes | **191** across **7** station types |
| Buildable pieces | **70** |
| Item types | ~60 resources/components + tools, weapons, food |
| Survival code | ~22,000 lines in modes/systems, plus 5,300 lines in `src/gm/` |
| Frame rate at spawn | **20 FPS** |
| Day length (default) | 360 s, start 08:00, so **dusk arrives about 3 minutes in** |

Minecraft has *less* than this at hour one. What it gets right is that **everything collectible is big and readable, every action gives instant tactile feedback, and the next goal is obvious** (wood → table → pick → stone → shelter before dark). Blackout Ops fails all three.

### Branch reality (critical)

| Branch | What it has | Live? |
|---|---|---|
| `main` | Gathering, mining, crafting, base building | **Yes, this is what you're playing** |
| `survival-overhaul` | +16 commits: Zone expansion, ZoneWorldPlus, wildlife, dungeons, companions | No |
| `survival-1.0` | Hot loot, corpse runs, light claim, behaviour ladder, power grid, vehicles, settlers, weather fronts, 7 bosses | No |

`main` → `survival-1.0` is **+30,286 / −2,767 lines across 88 files**, all unmerged. Most of the brief you pasted (inventory loss, light claim, power grids, outposts, vehicles, settlers, bosses, quick-stack) **already exists in code but has never reached the live site**. Shipping it is step zero. But shipping it alone won't fix "boring", because it adds systems on top of a first hour that's already unreadable.

## 1.1 Root causes of "nothing to do" (ranked)

**B1 — Collectibles are invisible.** Small deposits (`stones`, `kindling`, `roots`, `herbs`) are 4 meshes of 0.15–0.35 m, grey/brown on grass, with **no collider, no outline, no label** (`marker.label = ''`, `SurvivalPack.js:138`). The interact prompt only appears inside 2.7 m *and* a 0.55 facing cone. At spawn they read as gravel specks (confirmed by screenshot). The world looks empty even though 45 nodes are within reach.

**B2 — No visible goal ladder.** The opening objective is story ("search the helicopter wreck"). Nothing tells you that *fiber → cord → stone hatchet → bench* is the spine of the game. 191 recipes sit in a `J` terminal grid, most of them showing as unaffordable. There's no "you're one ingredient away" signal and no recipe reveal on pickup. A Minecraft player always knows the next upgrade. Here you're left guessing.

**B3 — Night has no shape.** Dusk arrives about 3 minutes into a run. There's no sunset warning, no "ready for night?" checklist, and no reliable safety condition the player can build toward. `sleepUntilDawn` only checks "no enemies near" (`SurvivalCampaign.js:368`), not shelter. The brief's best feeling, building a hut and lighting it before the first night, has no rules behind it, so the player can't reach it on purpose.

**B4 — Gathering has no tactile reward.** A strike gives a particle puff and a counter going up in a menu. There are no crack stages on the node, no item pops that fly to you, no escalating pitch on combos, and no "+3 Fieldstone" pickup feed by the hotbar. Repetitive gathering is only relaxing when it *feels* good, and right now it doesn't.

**B5 — Things you make mostly stay in menus.** Many of the 191 recipes produce intermediate stock (`planks`, `cord`, `wire`, `lens`) with no visible use until three crafts later. The build menu lists all 70 pieces at once, including late-game and leftover items (`arcaneTable`, `alchemyStand`, `infuser`, `quantumChest`, `obsidianWall`, `waystone`) that `survival-1.0` itself retired or meant to retire. The player can't tell what's worth building.

**B6 — Nothing to collect *for*.** There's no collection log, no first-discovery reward, and no rare-find moment. Diamond kimberlite, emerald seams and luminous quartz exist, but finding one feels the same as finding a pebble. In Minecraft, finding your first diamond is a story.

**B7 — 20 FPS.** Fun dies below 40 FPS. Known hot spots (also flagged in the 1.0 audit, A19): `refreshTargets()` rebuilds hitboxes every frame; `updatePrompt()` scans all 1,026 markers every frame; the small-deposit `swing()` loop iterates every resource; 20+ subsystem `update()`s run every frame.

**B8 — HUD noise drowns signal.** At spawn the screen shows a region banner, safe-period card, objective text, four context chips, a narrative subtitle, a bleeding tag, the hotbar and the vitals all at once, but **nothing points at the resources around you**.

**B9 — Too many parallel systems compete for attention.** Six task trackers and five weapon-power systems (1.0 audit A8/A9). Three station types the player meets only late (`alchemy`, `arcane`, `cookstation`) duplicate campfire and bench roles. More systems ≠ more to do. Right now they mean more to ignore.

## 1.2 Exploits and friction carried over from `survival-1.0`

Fixed on the 1.0 branch (verify on merge): death as a free heal, the dual death pipeline, pocket vehicles, the fixed weather loop, the scrap-gated workbench soft-lock, swimming as a safe zone, and lazy HP/damage day scaling.

Still open (listed under "not built" in the 1.0 plan): radial quick-wheel, build-ghost cost at the crosshair, crop watering/livestock, quest/contract merge, obsidian tier removal, modifier trim, and Survivor Skills. Legacy Deep code is inert but still loaded.

## 1.3 Pacing dead zones

| Window | Problem |
|---|---|
| 0–3 min | Bleeding, a story objective and a dusk you don't know is coming. No "first wins". |
| 3–10 min (night 1) | No defined safe state. You either wander in the dark or stand still. |
| Days 2–4 | Bench and tools done; the next tier (kiln → iron) isn't signposted. |
| Days 5+ | Covered by the 1.0 systems (behaviour ladder, hordes, bosses), which is why those systems need to ship. |

---

# STEP 2 — TRIAGE, PHASE MAP & DESIGN PLAN

Phase key: **E** Early (0–30 min / days 1–3) · **M** Mid (days 4–10) · **L** Late (day 10+, bosses, tiers).

The guiding call: **the first 30 minutes get most of the effort.** Every 1.0 system downstream already exists; it pays off only if the player gets hooked in hour one.

## 2.1 IMPROVE / EDIT

| # | System | Change | Phase | Why (Logic · Architecture · Fun) |
|---|---|---|---|---|
| I1 | **Resource readability** | Small deposits ×2.2 scale with distinct silhouettes (stones = cairn pile, kindling = crossed sticks, fiber = tall tufted grass, herbs = broadleaf with white flowers). Ore veins get a subtle emissive glint that pulses when within 12 m. **Look-at highlight**: the targeted node gets a rim outline (back-face inflated mesh, no post-processing) and a floating label at 6 m ("Loose stones · bare hands · +3 Fieldstone"). Prompt range 2.7 m → 3.2 m, facing cone 0.55 → 0.4. | E | Fixes B1 directly. The outline is a cheap mesh swap, not a shader pass, so the FPS budget holds. |
| I2 | **Gathering game feel** | Every strike: crack decal stage (3 stages tied to `hp/strokes`), node shake, pitch rising +1 semitone per consecutive hit (resets after 1.5 s). On break: items **burst out as physical drops** that magnet to the player within 3 m (pop-pop-pop pickup sound, staggered 60 ms). Pickup feed beside the hotbar: "+3 Fieldstone" stacking within 2 s windows, with an item icon. | E | Fixes B4. Uses existing `BO.FX`/`BO.Sound`; drops are pooled meshes, max 24 live. |
| I3 | **Node respawn, visible** | Small deposits regrow after 1 in-game day *where they were*, with a sprout stage visible beforehand. Veins/boulders don't respawn (finite = exploration pressure). | E/M | Gives the area around your base a renewable "garden". Finite ore pushes expeditions (feeds the 1.0 haul loop). |
| I4 | **Build menu** | Progressive reveal: a piece appears only once you've **held at least one of each ingredient** (or its tier is reached). Pieces are grouped into 5 tabs: Shelter · Light & Fire · Storage · Defence · Power. Ghost preview shows cost with have/need next to the crosshair and green/red snap. Retired pieces are hidden (see C-list). | E→L | Fixes B5. Builds on the existing `ZoneBuild` ghost. |
| I5 | **Crafting terminal** | Recipes reveal on first pickup of any ingredient ("New recipe: Braided cord" toast + book chime). Three default sorts: *Craftable now* (top), *Almost* (missing 1 ingredient, shows which one), *Locked*. Search box plus category filters. Craft-from-nearby-storage (exists in 1.0) shown with a chest glyph on the cost. | E→L | Fixes B2's "191 recipes" wall. |
| I6 | **Sleep** | Sleeping requires a bed **inside a Shelter** (see A2). Sleeping skips to 06:00, but **not on horde nights** (forecast warns). Sleeping outside a shelter is allowed on a bedroll but has a 35% chance of an interrupted ambush. | E | Gives night a goal: build the shelter, then sleep through. Horde nights stay a fight. |
| I7 | **Day 1 timing** | Day 1 only: daylight phase stretched so dusk arrives at **≈12 real minutes**. Days 2+ use the chosen day length. Dusk warning at 17:00 (banner + sky tint + audio cue), "Night in 60 s" at 19:00. | E | Minecraft's first day is about 10 minutes. Three minutes is too short to set up. |
| I8 | **Starting objective** | The opening objective chain becomes the **First Night** track (A1), and the story wreck search becomes step 2. Bleeding at spawn stays, but the starting bandage is pre-bound to the hotbar with a pulse hint. | E | First wins in the first 60 s. |
| I9 | **HUD at spawn** | Region banner → 2 s then out. The safe-period card merges into the First Night tracker. Context chips are hidden until relevant. The 1.0 contextual vitals become the default. The center of the screen stays clear. | E | Fixes B8. |
| I10 | **Performance** | Spatial hash (12 m cells) for markers and resources; prompt and swing query only the 9 nearby cells. Hitbox target list gets a dirty flag (rebuilt on spawn/death). Off-screen node meshes are merged into one `InstancedMesh` per resource kind. Subsystems tick at 10 Hz unless active. Target: **≥50 FPS** at spawn on the same machine. | All | Fixes B7. Instancing 1,000 small nodes is the single biggest draw-call win. |
| I11 | **Ship `survival-1.0` systems** | Merge `survival-overhaul` → `survival-1.0` → `survival-gold`, then QA-verify each 1.0 module in the browser before any new code builds on it. | All | Most of the pasted brief already exists in code. It just isn't live. |

## 2.2 ADD

| # | Mechanic | Spec | Phase | Why |
|---|---|---|---|---|
| A1 | **First Night track** | A 7-step onboarding checklist (top-right tracker, one step visible at a time, ticked with a stinger): **1** Gather 5 timber & 5 stone (bare hands) → **2** Braid cord → **3** Craft stone hatchet → **4** Place a Field Workbench → **5** Build a shelter (4 walls + roof + door) → **6** Light it (torch or campfire inside) → **7** Place a bed and sleep. Each step reveals the recipe it needs and pins the nearest matching node on the compass. Completing all 7 before day-1 dusk grants **"Made it through"** (milestone, +XP, a free Trail pack). Skippable; hidden on later runs once completed. | E | This is Minecraft's natural opening, turned into an explicit checklist. Directly answers "easy to get set up for night". |
| A2 | **Shelter detection** | When a door/wall/roof is placed or removed, run a flood fill on the build grid from the bed/campfire cell. A cell is **Enclosed** if it's bounded by walls/doors on 4 sides and roofed. Enclosed + lit = **Safe Room**: no roaming spawns inside, +warmth, rain-proof, sleep allowed, and a map icon. Cached per structure graph; re-solved only on build changes. HUD: a house glyph turns green when you stand in one. | E | Gives the night a rule the player can satisfy. It also extends the 1.0 light claim: a Safe Room is the smallest claim. |
| A3 | **Field Catalogue (collection log)** | A new `Catalogue` tab: every resource, item, creature, POI, rare find and boss (≈140 entries) starts as a silhouette. **First discovery**: chime + card slide-in + XP (common 5 · uncommon 15 · rare 40 · legendary 120). Set bonuses: complete *Ores* → +10% mining speed; *Wildlife* → tracking pings; *Flora* → +1 herb yield; *Salvage* → +5% loot quality. Completion % shown on the pause screen. Persists in the run (and to career as "Archive"). | E→L | Fixes B6, giving the player things to collect. Set bonuses are small, so it doesn't become a meta. |
| A4 | **Rare-find moments** | Diamond, emerald, gold, resonant geode, legendary weapon drops and boss loot: a light pillar visible at 40 m (colour by rarity), a unique sting, a slow-motion pop at 0.6× for 250 ms (solo only), and a Catalogue card. Rare veins are placed **near danger** (cave depths, infested sites, Cinder Flats). | E→L | Turns "first diamond" into a memorable moment, and ties reward to risk (feeds the 1.0 haul). |
| A5 | **"Next Up" hint** | Small ghost line under the tracker after A1 finishes: the single highest-value craft or build you're closest to ("Next: Stone kiln — need 3 clay (Clay bank, 40 m NE)"). Chosen by a fixed priority ladder (tools → shelter upgrades → kiln → iron tools → pack upgrades → power), skipping anything owned. Toggle in Settings. | E/M | Keeps the "what now?" answer one glance away after onboarding, without adding a new tracker (it reuses the Journal slot). |
| A6 | **Radial quick-wheel** (from 1.0's unbuilt list) | Hold `Q`: 8 slices (eat best food, bandage, drink, torch, campfire kit, throwable, repair, bedroll). Solo time ×0.5 while open. | E→L | Eat/heal mid-fight without menus. |
| A7 | **Build ghost cost** (from 1.0's unbuilt list) | Folded into I4. | E | No silent systems. |
| A8 | **Farming & water** (from 1.0's unbuilt list, I8) | Planters need water (rain barrel within 6 m or rain); crops have 3 visible growth stages; harvest yields seeds back (self-sustaining). Chickens/goats tameable with grain into a fenced pen; eggs/milk daily if fed. | M | Base self-sufficiency. It gives a reason to come home. |
| A9 | **Base upkeep loop** | Small, readable daily chores create base purpose: torches burn out (exists in 1.0), crops need water, animals need feed, the generator needs fuel. A single "Base status" chip appears when something needs you ("2 torches out · pen hungry"). | M | Makes the safe haven a living place and pulls you home between expeditions. |

## 2.3 REMOVE & REPLACE

| # | Old | New | Phase |
|---|---|---|---|
| R1 | Story-first opening objective | First Night track (A1); story continues after it | E |
| R2 | Flat 191-recipe grid | Reveal + Craftable/Almost/Locked sort (I5) | E→L |
| R3 | Flat 70-piece build list | Tabbed progressive build menu (I4) | E→L |
| R4 | Sleep = "no enemies near" | Sleep = bed in a Safe Room (I6/A2) | E |
| R5 | Tiny invisible gather nodes | Readable nodes + highlight + physical drops (I1/I2) | E |
| R6 | Per-frame full scans | Spatial hash + instancing + dirty flags (I10) | All |
| R7 | Six task trackers | One Journal: First Night/Story track + up to 3 tasks + Next Up line (1.0's I10 merge, now built) | All |

## 2.4 CUT

| # | Cut | Why |
|---|---|---|
| C1 | `arcaneTable`, `alchemyStand`, `infuser` stations and their recipes, plus `arcane`/`alchemy` station types | Fantasy leftovers from the cut Deep systems; they duplicate the bench and campfire. Recipes worth keeping (e.g. potions → medicine) move to the campfire/bench. |
| C2 | `quantumChest`, `waystone` builds | Retired by 1.0 (teleport stash / teleport home). Hide from the build menu and convert on load. |
| C3 | `obsidianWall`, `obsidianStairs`, obsidian armour | Power creep (1.0 R13). Replaced by reinforced concrete; converted on load. |
| C4 | Legacy Deep code (Soul Echo, runes, talismans, flasks) | Inert since 1.0. **Delete** it now, along with its `PlayerController.takeDamage` hooks. |
| C5 | HP/damage-only `sv_*` modifiers | Lazy scaling (1.0 C2). Trim to curated rule-changers; sandbox ones mark the run Unranked. |
| C6 | `cookstation` as a separate station | Folded into the campfire (tier 2 campfire = cooking pot upgrade). One station, one place to cook. |

Net effect: **−3 station types, −8 build pieces visible, about −30 recipes visible** before the player sees anything new. Fewer, clearer options with stronger feedback.

## 2.5 Phase map at a glance

| Stage | Player fantasy | Systems carrying it |
|---|---|---|
| **Early** (0–30 min) | "I'm naked, it's getting dark, I need a roof." | First Night track, readable nodes, tactile gathering, Safe Room, stretched day 1, Catalogue first finds |
| **Mid** (days 4–10) | "My base is home; I raid POIs and haul loot back." | 1.0 hot loot + haul, light claim, kiln/iron tier, farming & upkeep, outposts, vehicles, settlers, behaviour ladder |
| **Late** (day 10+) | "I'm ready to hunt the seven." | 1.0 bosses, power grid, adaptive hordes, rare-find set bonuses, Zone Tiers |

---

# STEP 3 — ADVERSARIAL QA (RED TEAM)

| # | Break attempt | Result before fix | Fix (now in plan) |
|---|---|---|---|
| Q1 | Farm small-deposit respawns next to the base forever | Infinite stone/timber with no exploration | Respawn takes 1 in-game day, and only small deposits respawn (low-value inputs). Ore/boulders are finite. Yields drop 50% inside a light claim ("over-harvested soil") so gathering still pulls you outward. |
| Q2 | 1×1 "shelter" box built around yourself in the open field every night | Trivial safety | Safe Room requires a **door**, a **light source** and a **bed** inside. Hordes still target structures (1.0 horde flow field), so a cheap box is safe from roamers but not from horde nights. Sappers/climbers punish thin shells. |
| Q3 | Build a Safe Room inside a POI or infested site to suppress its spawns | Cheese clearing | Safe Room suppression only covers the enclosed cells, not a radius. Infested-site spawns are governed by `ZoneInfest`, not roaming spawns, so they're unaffected. |
| Q4 | Sleep through every night forever | Night pressure gone | Horde nights (every 3rd + blood moons) block sleep. Interrupted-sleep ambush chance outside a Safe Room. Sleeping costs hunger/thirst (exists) and fuel for any running generator. |
| Q5 | Catalogue XP farming (drop and re-pick items) | Infinite XP | Discovery fires once per entry per run, keyed by item ID on first entry into the pack from the world. Picking up your own dropped items never counts. |
| Q6 | Catalogue set bonuses become a mandatory meta | Dominant strategy | Bonuses capped at +10%, each set has one bonus, and none affect combat damage. |
| Q7 | Rare-veins near danger → camp the safe edge and snipe | Risk bypass | Rare veins sit inside interiors/caves (LOS-blocked), and mining is loud (noise feeds the director). |
| Q8 | First Night reward (free Trail pack) exploited by restarting runs | Free gear | Reward granted once per run, and the pack is only an early convenience (craftable by mid day 2 anyway). |
| Q9 | Progressive reveal hides a recipe needed for a story step | Soft-lock | Story and First Night steps force-reveal their recipe. Every hidden recipe has at least one ingredient obtainable within the starting region (asserted by a load-time data check that logs failures). |
| Q10 | Magnet pickup steals items mid-fight, so you're encumbered at a bad moment | Frustration | The magnet respects weight. Overflow drops stay on the ground with a "Pack full" flag, and the magnet pauses while Hunted. |
| Q11 | Instancing breaks per-node hit detection | Regression | The instanced mesh stays a render proxy; hit tests use the spatial hash and per-node bounds, not raycasts on the instance. The near-player LOD (≤20 m) swaps back to real meshes for outline and crack decals. |
| Q12 | Merging three branches regresses Zombies/MP/TD modes | Broken live game | Merge order with a smoke test per mode (start match → 30 s run → exit) after each merge. The `_qa_runner.html` suite gets extended. |
| Q13 | Old saves contain retired pieces (arcane table, quantum chest, obsidian) | Crash/lost items | Checkpoint migration v4: retired builds refund 100% materials into the nearest storage, obsidian → concrete, cookstation → campfire T2. |
| Q14 | Day 1 stretch breaks the hour→day math that other systems assume | Spawn/hunger desync | The stretch is implemented as a day-1 multiplier inside `SurvivalCampaign.hour` only. Systems keyed to `hour` stay correct; systems keyed to raw `clock` (hunger) keep their real-time rates, which is the intent. |
| Q15 | Shelter flood fill on large bases → frame spike | Perf | Solved only on place/remove events, capped at 4,000 cells, and amortized across frames if needed. |
| Q16 | HUD declutter hides critical info | Missed danger | HP/armour and threat/Hunted state never hide. Vitals fade in at <40% or when changing. Critical states pulse. |

---

## Step 4 build order (after your approval)

Each module ships complete, wired in and browser-tested (FPS, a scripted playthrough of the first night, save/load) before the next one starts.

1. **Merge & stabilise** — merge `survival-overhaul` + `survival-1.0` into `survival-gold`; smoke-test all four modes; fix regressions. (I11, Q12)
2. **Performance** — spatial hash, instanced nodes, dirty targets, 10 Hz ticks. Measure before/after. (I10)
3. **Readable, tactile gathering** — node redesign, look-at outline + label, crack stages, physical drops + magnet, pickup feed, respawn. (I1–I3, Q1, Q10, Q11)
4. **First Night** — Safe Room detection, sleep rules, day-1 stretch + dusk warnings, First Night track, starting HUD declutter. (A1, A2, I6–I9, Q2–Q4, Q14)
5. **Crafting & build UX** — progressive reveal, Craftable/Almost/Locked, search, tabbed build menu, ghost costs, Next Up hint. (I4, I5, A5, A7, Q9)
6. **Catalogue & rare finds** — log, first-discovery cards, set bonuses, light pillars. (A3, A4, Q5–Q7)
7. **Cuts & migration** — remove retired stations/pieces/Deep code, merge cookstation, modifier trim, save migration v4. (C1–C6, Q13)
8. **Base life** — farming & water, livestock, base upkeep chip, radial wheel. (A6, A8, A9)
9. **Journal merge** — one tracker. (R7)
10. **Final QA** — a full scripted run, days 1–5 plus one boss; the Field Guide updated; the plan doc marked with what shipped.

---

# STEP 4 — IMPLEMENTATION STATUS (branch `survival-gold`)

| # | Module | Files | Status |
|---|---|---|---|
| 1 | Merge & stabilise | — | `survival-overhaul` and `survival-1.0` were already linear ancestors; no merge needed. All four modes smoke-tested clean. |
| 2 | Performance | `src/systems/NodeBatch.js`, `SurvivalPack.js` | Deposits batched into one mesh per 24 m cell; nodes within 14 m stay live. Same camera, same spawn: 2,670 → 546 and 2,426 → 688 draw calls looking across the map. Game logic was already cheap (~0.4 ms/frame). |
| 3 | Readable, tactile gathering | `src/gm/GMGather.js`, `SurvivalPack.js` | Distinct larger silhouettes, look-at outline + label, ore glint, shake/crack tint/rising-pitch crunch, burst-and-magnet drops, pickup feed, sprout regrowth (small 1 day, veins 3 days), half yield inside your own claim. |
| 4 | First Night | `src/gm/GMNight.js` | Ray-tested rooms → Shelter → Safe Room (no spawns inside), night sleep only in a Safe Room (35% ambush elsewhere, none on horde nights), ~12-minute day one, sunset warnings, 7-step tracker with Trail-pack reward, Weave cloth recipe. |
| 5 | Crafting & build UX | `src/gm/GMRecipes.js`, `SurvivalUI.js`, `ZoneBuild.js` | Recipe/blueprint discovery with chime, grouped list (Craftable now / One ingredient away / …), live search, 7 build tabs, have/need at the ghost, Next Up line (Settings toggle). Fixed: bleeding no longer closes menus. |
| 6 | Catalogue & rare finds | `src/gm/GMCatalogue.js` | 110 entries in 7 sets from live data, discovery cards + XP, set bonuses, Catalogue tab (`.`), light pillars (diamond/emerald/geode/rare+ weapons, max 3), rare-pickup sting + 250 ms slow-mo (solo). |
| 7 | Cuts | `src/gm/GMRetire.js` | Arcane/alchemy/infuser/cooking stations retired (recipes moved to campfire/bench); quantum chest, waystone, obsidian walls/stairs removed from the build menu; three enemy-stat-only modifiers removed. |
| 8 | Base life | `src/gm/GMBaseLife.js` | Auto-watering from rain barrels and rain, Base status chip, hold-X quick wheel (8 slices), contracts+quests capped at 3 rows. |
| 9 | Final QA | `src/gm/GMGuide.js`, `ZoneWorldPlus.js` | Field Guide entries for every new system. Scripted First Night using the real harvest/craft/build paths, save → resume round trip, Survival ↔ Zombies switching, all modes clean. **Fixed: resuming a save with built doors crashed (and would have deleted restored doors).** |

### Deliberate deviations from the plan
- **Legacy Deep code not deleted (C4).** `SurvivalDeepSystems` also runs hydration, bleeding, the tech tree and modifier effects; deleting it would break the game. The cut parts stay inert.
- **Obsidian armour kept (part of C3).** Nothing replaces it yet; only the 1,400 HP obsidian walls and stairs are cut.
- **Retired pieces are not refunded on load (Q13).** They keep working in old saves, so no player loses anything; they just can't be built again.
- **Ore is not finite (I3).** Veins refill over three in-game days instead, to avoid an iron soft-lock on a 470 m map.
- **Drops are visual (I2).** Items are granted on break (so weight, Hot loot and quests stay exact) and fly to you as a visual burst.
- **Livestock pens (A8) not built.** Farming already existed (stages, watering, seeds back); this pass added auto-watering. Pens need new animal AI and are left for a follow-up.
- **Catalogue has 110 entries, not ~140**: built only from content that exists in the game.

### Not verified
- No human playthrough yet. Everything above was verified by scripted play in a browser, not by hand with mouse and keyboard.
- Published: `survival-gold` was pushed to GitHub `master` on 2026-11-24 (commit 446b6a3), so the live site runs Survival Gold plus Phase 1 items 1.2, 1.4–1.6. Items 1.3 and 1.7 are on `survival-gold` only until the next push.

---

# ROADMAP PHASE 1 — PROGRESS (branch `survival-gold`)

| # | Item | Status |
|---|---|---|
| 1.1 | Livestock pens | Not started (proposed as its own task) |
| 1.2 | Composite armour | **Done** — `src/gm/GMArmor.js`: 3-slot plate vest (leather, bone & hide, ceramic, steel, composite), front plate sets absorption, HUD bars per plate, Base-screen repair/remove, death wear 25%, obsidian rig retired and converted, abyssal rig fills the vest |
| 1.3 | Survivor Skills tree | **Done** — `src/gm/GMSkills.js`: replaces the random perk cards. 3 branches × 8 nodes (Survival: hunger, cold, stealth · Combat: recoil, reload, melee · Engineering: build cost, power, repair), 50 ranks, 1 point per level, spent any time in the Skills tab (K). Rows 2/3/4 of a branch open at 2/5/8 points spent in it. Nodes write the existing perk ranks, so saved runs keep cards they picked (listed as "Kept from perk cards"). New effects: Cold Blooded (cold feels +4 °C per rank, capped at 18 °C), Frugal Builder (−15% per material per rank, rounded, min 1; build menu, ghost and Next Up show the reduced cost), Field Mechanic (+35% from gun and tool repair kits per rank), Grid Tech (+20% power from generators, solar and wind per rank). Fixed in passing: GMGear and GMCatalogue left a stray `ZoneThrill.xp` copy behind after a run, and the skills wrapper now stacks with their XP bonuses instead of skipping them |
| 1.4 | Tooltip comparison | **Done** — `src/gm/GMCompare.js`: weapon-pickup card with fixed stat rows and ▲/▼ vs the held weapon; plate comparison in the item panel |
| 1.5 | UI scale | **Done** — Controls · Display slider 80–140%, applied to HUD, trackers, overlays and (capped at 115%) the terminal |
| 1.6 | Item tiles | **Done** — Hot-loot ring, rarity edge, weapon condition bar and rarity border |
| 1.7 | Shift-click / scroll-split audit | **Done** — one rule set in every container (chest, field satchel, vehicle trunk, stash uplink): shift-click (or click, in the satchel/trunk/uplink) moves the stack, right-click moves half, Shift+scroll moves one per notch (throttled for trackpads; plain scrolling still scrolls the list), double-click still moves one in chests. Shared handler `SurvivalUI.moveFromTile` reads `data-mv-*` on each tile |
| 1.8 | Delete dead Deep code | Not started |

Repository housekeeping: the seven `Blackout Ops - … backup` folders were moved to the Recycle Bin (every version is in this repo's history). Local branches are now `master` (tracks GitHub; the live site serves it) and `survival-gold` (this work, a fast-forward of `master`).
