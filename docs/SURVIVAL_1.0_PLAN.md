# Survival 1.0 Gold Master — Audit, Triage & Red-Team Plan

Scope: Survival Mode ("The Exclusion Zone"): 41 modules, ~21,800 lines (`src/modes/SurvivalMode.js`, `src/systems/Survival*.js`, `src/systems/Zone*.js`, `src/data/Survival*.js`, `src/data/Zone*.js`, `src/ui/Survival*.js`), plus the shared engine hooks they touch (`PlayerController`, `CombatSystem`, `ZombieEntity`, `BotAI`).

Status: **Steps 1–3 for approval. No code has been changed.**

---

## The core loop everything must feed

```
 PREPARE (base)  →  EXPEDITION (POIs, bosses)  →  HAUL HOME (risk)  →  INVEST (tech, base, settlers)  →  DEFEND (horde nights)
       ↑                                                                                                         │
       └────────────────────────── push deeper: outposts, vehicles, light claim ─────────────────────────────────┘
```

Every keep/add/cut decision below is tested against this loop and the three pillars (Logic & Cohesion · Architecture · Fun).

---

# STEP 1 — SYSTEM AUDIT

## 1.1 What already works (keep and build on)

| System | Where | Why it's good |
|---|---|---|
| Senses-based threat director (sight cones, hearing, smell from bleeding, idle→curious→hunt) | `ZoneDirector.js` | The right foundation for stealth and noise trade-offs. |
| Noise economy (gunshots, swimming, cough, explosions as noise events) | `SurvivalMode.beforeShot`, `ZoneDirector.noise` | Makes "is this fight worth the noise?" a real question. |
| Weapon condition, jams, misfires; calibre ammo pulled from the pack | `SurvivalMode.beforeShot/syncAmmo`, `ZoneLoot` | Good resource tension. |
| Horde nights with a flow field that masses at your weakest wall | `ZoneHorde.js` | Makes base layout matter. Best system in the mode. |
| Snap building with structural support and collapse | `ZoneBuild.js` | Solid; the engineering puzzle the brief asks for. |
| Infested sites that stop roaming spawns once secured (`isSafe`, 38 m) | `ZoneInfest.js` | Already territory control. The light-claim system will grow out of this hook. |
| Wildlife with temperament, hunting, cooking (raw vs cooked) | `ZoneWild.js` | Strong self-sufficiency base. |
| Companions/taming (wolf, boar, bear, ranger) | `ZoneCompanions.js` | Fits the brief's taming item. |
| Climate (temperature, wet, altitude), toxic ash, PMC garrisons that reoccupy | `ZoneFrontier.js` | Good environmental pressure. |
| The Warden finale (line-of-sight pulse, 3 phases) | `ZoneFinale.js` | The only true multi-phase boss. Template for the other six. |
| Seeded worlds, tiers, Archive meta-progression | `SurvivalCareer.js` | Good replayability wrapper. |

## 1.2 Weak links, exploits and dead zones (ranked by damage to the game)

**A1 — Death is a free full heal (exploit, critical).** `SurvivalMode.handleDeath` drops your pack, then respawns you with radiation capped at 20, bleeding/infection/fracture cleared, hunger raised to ≥35, 60% HP. Dying is the cheapest cure in the game. The body bag never despawns and can never be destroyed, so a corpse run carries no time pressure. Death costs you a walk.

**A2 — Two death pipelines.** `SurvivalDeepSystems` still contains the "cut" Soul Echo / runes death flow (`pendingRespawn`, `lostEcho`). `SurvivalMode.update` returns early whenever `deep.pendingRespawn` is set. `ZoneRules.js` says runes, Sites of Grace, flasks and talismans are cut, but the code still runs: `PlayerController.takeDamage` checks talismans and tonics. This dead code still runs and can cause bugs.

**A3 — Lazy difficulty scaling (explicitly forbidden).** `SurvivalRules.threat`: enemy `hpScale +7%/day` and `dmgScale +5%/day` (cap 1.45). Zone Tiers 1–10 multiply HP up to ×1.7 and damage up to ×1.55. Many of the 100 `sv_*` and 400 mode modifiers are flat HP/damage multipliers. Late game = bullet sponges.

**A4 — Pocket vehicles.** `SurvivalCampaign.ride(id)` puts you on any owned vehicle anywhere, instantly. Vehicles have no world presence, no fuel, no damage, no storage. `hasVehicle` also grants vehicles from **career level**, which erodes the zero-to-hero start on every new run. Entering and exiting is trivial, but vehicles carry no stakes and no logistics role.

**A5 — Weather on a fixed timer.** `updateEnvironment`: Overcast → Ash rain → Rad fog → Clearing on a fixed 300-second loop, unrelated to day, region or forecast. It's predictable, so nothing emerges from it. Weather doesn't affect AI senses.

**A6 — Light only hurts you.** Carrying light raises detection range. Placed light has no territorial function. The brief's "territory control via lighting" is missing.

**A7 — Bosses are reskins.** `ZoneLegends` has 12 "legendary" bosses built on ~5 specs (`boss_butcher` ×2, `boss_witch_queen` ×2…), unlocked by grind counters ("fell 35 trees"). They differ by HP, not mechanics. Pit Master arena duels, gauntlet "Zone Bosses" and frontier guardians form three more boss tracks. Only the Warden is a real fight.

**A8 — Six overlapping task trackers.** Story objectives, Quest log (8 chapters, 4 tracked), Haven contracts (3 active), field challenges, Archive feats, legendary criteria. The HUD, compass and map compete to show them all. The player never knows what matters.

**A9 — Five overlapping weapon-power systems.** Rarity + traits (`ZoneThrill`), Resonance Anvil tempering + elemental cores (`ZoneArmory`), Mk forging + "Minecraft infusions" (`SurvivalDeepSystems`), attachments (`ZoneArmory` gunsmith), run perk cards. They stack multiplicatively, which drives the bullet-sponge spiral in A3 from the player's side.

**A10 — Base power is fake.** `SurvivalDeepSystems` checks `hasGenerator = machines.some(...)` anywhere on the map. There are no wires, no capacity and no brownouts, so there's no engineering puzzle.

**A11 — Storage has no logistics.** There are chests (tiered, a "quantum" ender chest, a hopper), but no quick-stack, sort, shift-click, craft-from-nearby-storage or search. The quantum chest is a global teleport stash, which removes haul tension entirely.

**A12 — Travel undermines the haul.** Safehouse fast travel, 8 signposts, the Resonance Waystone ("respawn directly at your base") and the rail handcar. You can fast-travel home with a full pack, so the "made it back alive" moment never happens.

**A13 — Power creep at the top.** Obsidian armour (180 max armour, -25% radiation), Obsidian Wall (1,400 HP, blast-proof) and Legendary + elemental weapons. Late game horde nights become a formality.

**A14 — Economy is a side menu.** The Black Market broker sells for "Trader Emeralds", and gated specialists sit behind levels. It's disconnected from Haven, the story's survivor camp. There's no reroll loop, no settler protection, nothing to optimise.

**A15 — Self-sufficiency is shallow.** Crops grow on a fixed timer with no water or weather input. Food never spoils, so hoarding solves hunger forever and prep stops mattering after day 3.

**A16 — Workbench gate.** Crafting table costs `timber 4, stone 2, scrap 1`. Scrap only comes from looting, and you start with exactly 1 (a soft-lock if you spend or lose it). The brief requires a bench anywhere from easy materials.

**A17 — Swimming is a safe zone.** Deep water: "Infected cannot follow you into deep water." There's no stamina or drowning, so water is an infinite escape.

**A18 — HUD isn't contextual.** FOOD/H2O/RAD/TEMP/NOISE bars always show. The top chip row can hold 10+ chips. Status effects are text tags without timers. Diegetic cues are audio-only (Geiger, heartbeat), with no frost/blur/bleed vignettes. Building ghost costs aren't shown at the crosshair.

**A19 — Performance hot spots.**
- `refreshTargets()` rebuilds the full hitbox array (filter + flatMap) every frame.
- `updatePrompt()` scans every marker every frame, including thousands of tree/ore nodes.
- `explode()` and fire loops scan all structures.
- 20 subsystem `update()`s run every frame regardless of relevance.

**A20 — Sandbox cheats share career rewards.** God mode, infinite ammo, free crafting and the "Box of Wonders" sit in the same modifier list as balanced rules. Unless explicitly excluded, commendations and Archive progress can be farmed with them.

## 1.3 Pacing dead zones

- **Day 1, minutes 0–1:** a 60-second safe period with nothing urgent except bleeding. That's fine, but the "first campfire / first weapon" milestones get no celebration.
- **Days 4–8:** after the first base, nothing new threatens you except bigger numbers (A3). This is the main mid-game slump.
- **After the Warden:** the endings change the world but there's no endgame goal. The six other bosses and Zone Tiers should be the endgame.

---

# STEP 2 — TRIAGE, PHASE MAP & DESIGN PLAN

Phase key: **E** = Early (days 1–3), **M** = Mid (days 4–10), **L** = Late/Endgame (day 10+, tiers 2–10).

## 2.1 IMPROVE / EDIT

| # | System | Change | Phase | Pillar justification |
|---|---|---|---|---|
| I1 | Zero-to-hero start | Expedition start: no armour, 6 rounds, 70% HP, bleeding, **hunger 60 / hydration 55**, nightfall cold. Career no longer unlocks vehicles. First-time milestones (first fire, first bench, first firearm, first backpack, first base wall, first bed) each get a unique stinger, a banner and a Journal entry. | E | Every tiny upgrade feels monumental; meta-progression stops erasing the climb. |
| I2 | Workbench | **Field Workbench**: hand-craftable from 3 timber + 2 stone (both bare-hand gatherable), placeable on any walkable slope ≤25°, indoors or out. Tier 2 (Machinist) and Tier 3 (Fabricator) are bench upgrades that consume scrap/ingots/wire. Bench radius 4 m → 6 m. | E | Removes the soft-lock and lets you start a base anywhere. Higher tiers gate tech. |
| I3 | Horde nights | Composition reacts to your base: strong walls → **Sappers** (charge walls and explode); tall walls → **Climbers**; many lights → **Lightbreakers**; turrets → **Shielded Brutes** that soak turret fire. Radio forecast the evening before names the composition and direction. | M/L | Escalation through counter-play instead of HP. Prep becomes reading intel. |
| I4 | Threat director | Replace HP/damage day scaling with a **Behaviour Ladder**: day 2 flankers; day 3 Screamers (call nearby packs); day 4 blood-trackers (follow bleeding over long range); day 5 Swimmers (water is no longer safe); day 6 ambushers (wait in dark interiors); day 7 Lightbreakers; day 9 pack coordination (surround, cut retreat). Population cap still rises gently. Zone Tiers add ladder steps, champion affixes and scarcity (loot −%) instead of ×HP. | E→L | Removes the forbidden pattern; each day plays differently. |
| I5 | Weapon condition | Condition → durability loss on death (−10% on everything carried), repairs at bench lower max condition (already partly there), repair kits keep their role. | E/M | Death and fights cost gear, not just time. |
| I6 | Swimming | Swim stamina; at zero you take drowning damage. Noise as now. Swimmers from day 5. | E | Closes the infinite-escape exploit and keeps water useful as a short escape. |
| I7 | Companions | Max 1 active companion. Companions eat from base food stores while at base. They fight infected/wildlife and can be **sent to lure** (see A-Living ecosystem). | M | Keeps taming without letting it become an army. |
| I8 | Farming | Crops need water (rain barrel/purifier/rain) and light (sun or powered grow lamp). Blizzard frost wilts unprotected beds. Livestock pen: tamed goats/chickens/cattle produce milk, eggs or wool daily if fed. | M | Self-sufficiency feeds directly into the grid, weather and base systems. |
| I9 | Modular weapons | Attachments become trade-offs and are swappable at **any** bench tier 2+. Suppressor: noise radius −60%, damage −8%, +wear. Flashlight: reveals the Pinebreak Stalker and lights interiors, but raises your detection range. Scope: zoom, slower ADS. Extended mag: +capacity, slower reload. Armour plates: ceramic (light, breaks) vs steel (heavy, durable). | M | Loadouts tailored for night raids, stealth, hunting or heavy combat. |
| I10 | Contracts + Quests | Merge the quest catalog and Haven contracts into one **Journal**: Story track + up to 3 tracked tasks (hand-written quests become the contract pool, still complete once each) + Archive feats (career). Field challenges fold into feats. | All | One tracker instead of six. The HUD shows at most 1 story + 3 tasks. |
| I11 | Climate | Temperature now driven by weather fronts (see R3). Thermal clothing and shelters matter more. Fire spreads to dry grass in heatwaves. | E→L | Environmental pressure creates emergent moments. |
| I12 | Building UX | Ghost preview with green/red snap, rotation guide, exact cost and "have/need" next to the crosshair, and the support % shown live. | E | No silent systems. |

## 2.2 ADD

| # | Mechanic | Spec | Phase | Pillar justification |
|---|---|---|---|---|
| A-Haul | **Hot loot & the Haul** | Everything picked up from the world during an expedition is **Hot** (amber tile border) until deposited in storage inside your base claim. On returning home with Hot loot: "HAUL SECURED" screen with tally, total value, distance travelled, max threat reached, and an XP bonus = value × danger multiplier (capped). Hot loot cannot be fast-travelled. | E→L | Your relief-and-reward spike. Gives every return trip a purpose. |
| A-Corpse | **Corpse runs with consequence** | Death drops a body bag with all carried items (story items exempt). The bag **despawns after 2 in-game days** (timer on compass/map). Dying in lava, acid pools or deep water destroys or sinks the bag (warned with a red HUD flag while you stand in such terrain). Respawn: you choose bed, outpost or safehouse; time passes 6 h; you wake **Weakened** (max HP −25%, stamina regen −30%) until you eat a cooked meal or sleep in a bed. Radiation, hunger, infection and fractures **persist**. Iron Run = permadeath (existing). | E→L | High stakes without punishing too hard; deciding whether a fight is worth it. |
| A-Light | **Light Claim (territory via lighting)** | Placed light sources project a claim radius in which **roaming infected cannot spawn**: torch 6 m (burns 1 day, re-fuel with resin/cloth), lantern 10 m (fuel), floodlight 18 m (needs grid power). Overlapping claims union into territory, shown on the map as a soft green field and as a % of region held. Works underground and in dungeons after a room is cleared. Light still makes **you** visible at night (existing). Hordes ignore claims; Lightbreakers (day 7+) target lights first. | E→L | Claiming ground block by block with lighting. Light now has both upside and risk. |
| A-Grid | **Power grid** | Generators (fuel, loud), solar panels (day only, scaled by weather), wind turbine (alpine/storms), battery bank (storage), **pylons** link anything within 12 m into one network. Consumers: floodlight, turret, water purifier, electric fence, perimeter alarm, grow lamp, smelter, radio mast. Supply/demand computed only when the network changes. Brownout sheds load by player-set priority. Build-mode overlay shows wires, supply/demand/battery %, and unpowered items blink. | M/L | Wooden walls → engineered compound. |
| A-Defense | **Perimeter defence kit** | Spike strip, barbed wire (slow + bleed), electric fence (grid), tripwire alarm (siren + map ping), auto-turret (grid + ammo pulled from base storage, overheats, no XP or loot from turret kills), searchlight (grid; reveals and stuns Stalkers). | M/L | Chokepoint engineering for escalating hordes. Anti-AFK by design. |
| A-Store | **Storage & logistics** | Quick-stack to all base storage within 10 m (one key). Auto-sort (category/weight/value). Shift-click stack transfer. Scroll-wheel splitting. Craft directly from any storage inside the same base claim. Search bar and category filters in crafting/inventory. Labeled chests (auto-icon by majority content). **Field Satchel** (portable 6-slot box, shulker analog). **Stash Uplink** (late game, expensive): a powered terminal linking two of your bases' stashes. It can't transfer Hot loot and can't be used while Hunted. | M/L | Messy chests → organised storage hall, without reintroducing a teleport stash. |
| A-FOB | **Outposts** | Outpost Kit (bedroll + 6-slot stash + torch) placeable anywhere outside other claims; max 3. Respawn point and travel node. An outpost left **unlit at night** has a chance to be raided by PMC scavengers (stash looted, toast + map pin). Lit and fenced outposts are safe. | M | Push deeper without losing everything on the trek back. Outposts need upkeep. |
| A-Settlers | **Haven economy & settlers** | Haven reputation replaces Trader Emeralds. Earn it from contracts, deliveries (salvage runs) and defending Haven. Survivors rescued from distress calls can **settle at your base** if it has a bed, light and food: Gunsmith, Medic, Engineer, Quartermaster, Hunter. Each sells a rotating stock (refreshes daily). **Retrain** (reputation cost, rising) rerolls a settler's stock. That's how you farm a guaranteed high-tier attachment or blueprint. Settlers can be hurt in raids; downed settlers stop trading until healed. | M/L | The villager trading hall reworked for this game. Protecting people gives base defence meaning. |
| A-Bosses | **Seven optional final bosses** (spec in 2.5) | Each unlocks through exploration (not grind counters), uses unique mechanics, has an arena with anti-cheese rules, and drops a game-changing reward. | M/L | Optional skill checks; the endgame goal after the story. |
| A-Weather | **Weather fronts** (see R3) | Regional, forecastable weather that changes AI senses, temperature, crops, solar output and noise. | E→L | Emergent moments from systems colliding. |
| A-Eco | **Living ecosystem & lures** | Factions fight each other: infected vs PMC (exists), wolves/bears vs infected, PMC hunt wildlife. **Lures**: meat bait (draws predators), noisemaker/flare (draws infected), blood trail (drag a carcass). Lure predators or a herd into a PMC garrison and they clear it for you. Migrating herds path through garrisons. Companions can be sent to lure. | M | Weaponising the environment. Combat becomes a tactical choice, not just shooting. |
| A-Prep | **Pack-Out & food system** | Pack-Out screen at any bench: expedition checklist (days of food/water, meds, ammo per equipped weapon, weapon/armour condition, light fuel, weather forecast on route) with a readiness rating. **Spoilage**: raw meat 1 day, cooked 2 days, smoked/canned/dried never. Smokehouse and drying rack preserve. **Meal buffs** (one at a time): Hunter's Stew (stamina regen), Spiced Broth (cold resist), Coffee (sprint), Field Feast (max HP +10). Sleeping in a bed gives **Well-Rested** (XP +10%, faster regen, 1 day). | All | Prep that saves your life feels earned. Spoilage keeps food a live problem. |
| A-Lava | **Cinder hazards** | Cinder Flats gains lava fissures and ash vents. Lava destroys dropped items. Fireproof gear and the Cinder Leviathan reward change how you move there. | L | High-risk region for high-tier loot. |
| A-Feedback | **Game feel pass** | Item vacuum pickup (pop-pop-pop), chop/mine crunch with escalating pitch, XP chime, haul-secured fanfare, claim-expand shimmer, grid power-up hum, brownout clunk. | All | Satisfying repetition. |

## 2.3 REMOVE & REPLACE

| # | Old | New | Phase |
|---|---|---|---|
| R1 | Dual death pipelines (`SurvivalMode.handleDeath` + Deep Soul Echo/`pendingRespawn`) | One **DeathService** module implementing A-Corpse. | All |
| R2 | Pocket vehicles + career-level unlocks | **Physical vehicles** (see 2.4). | E→L |
| R3 | 300-second weather loop | **Weather fronts**: each region rolls a front every in-game half-day from a biome table (Clear, Overcast, Rain, Thunderstorm, Fog, Blizzard [alpine], Ash Storm [cinder], Heatwave [cinder/meadow], Rad Surge [event]). Fronts drift with the wind into neighbour regions. Radio at a base/Haven gives a 1-day forecast. Rain: hearing range −40%, wet → cold, barrels fill, crops grow. Fog: sight range −50% both ways. Blizzard: sight −60%, freezing, solar 0. Thunderstorm: lightning can ignite dry structures. Ash: lungs/filter. Heatwave: hydration ×2, fire spread. | All |
| R4 | Day HP/damage scaling + tier HP/damage multipliers + HP/damage modifiers | **Behaviour Ladder** (I4) + tier = ladder steps, affixes, scarcity. Enemy stats fixed per type. | All |
| R5 | 12 legendary reskins + Pit Master arena + gauntlet "Zone Bosses" + roaming frontier guardians | **7 unique final bosses** (2.5). Former legend specs return as **champions** (affixed elites) in infested sites and dungeons. | M/L |
| R6 | Black Market emeralds + gated specialist contacts | **Haven reputation & settlers** (A-Settlers). | M/L |
| R7 | Signposts + Resonance Waystone + safehouse teleport | **Travel network**: fast travel only between your own lit bases/outposts and secured safehouses. It costs food/water and passes time, and it's blocked while carrying Hot loot or while Hunted. Rail handcar stays as a physical vehicle on rails. | M |
| R8 | Global `hasGenerator` check | **Power grid** (A-Grid). | M/L |
| R9 | Five weapon-power systems | **Rarity (Common→Legendary, max 2 traits) + attachments + condition.** Rarity sets base damage (≤ +18% at Legendary) and trait slots. Anvil = reroll one trait at tier-3 bench for scrap + resonance crystal. | M/L |
| R10 | Run perk cards (roguelite) | **Survivor Skills**: run XP levels give 1 point into a 3-branch tree (Survival: hunger/cold/stealth · Combat: recoil/reload/melee · Engineering: build cost/grid/repair). Small, readable %, every node a choice. Career Mastery stays as the meta layer. | E→L |
| R11 | Always-on HUD | **Contextual HUD** (2.6). | All |
| R12 | Quantum ender chest (global teleport stash) | Stash Uplink (A-Store). | L |
| R13 | Obsidian wall 1,400 HP / Obsidian armour 180 | **Reinforced concrete** wall tier (650 HP, needs cement from the kiln) and **Composite armour** (ceramic/steel plate system from I9). | L |

## 2.4 Vehicles (R2 detail; covers "enter and exit easily")

- **Eight vehicle classes**, each with a distinct role: Bicycle (silent, no fuel) · Horse (tamed; eats; recall whistle within 150 m) · Dirt bike (fast, loud) · ATV (off-road, small rack) · Pickup (trunk 12 slots) · Cargo truck (trunk 30 slots, slow, very loud) · Boat (reservoir/wetland) · Glider (launch from height). The existing 20 models stay as **variants** within these classes (found in the world, slightly different stats and looks). No content is thrown away.
- **World objects.** A vehicle stays where you leave it, shows on map/compass, and has HP, fuel (motorised) and a trunk. Infected and PMC can damage it. Wrecked vehicles can be repaired at a bench kit on site.
- **Enter:** look at the vehicle within 3.5 m and press **Interact (E)**. The prompt shows the vehicle name, fuel and HP. The ride key also enters the nearest vehicle within 6 m.
- **Exit:** Interact or ride key, always available, including on slopes and at speed under 25 km/h. The exit point checks free space in this order: left, right, rear, front, roof. You are never stuck inside geometry, and if every side is blocked you exit on top.
- **Stakes:** engine noise feeds the director by class. Trunk contents are Hot. Ramming damages infected and the vehicle (capped). At low speed, grabbers can stagger the driver.
- **Acquisition:** claim parked wrecks (repair + fuel) or build at bench tier 2/3. Career level grants nothing.

## 2.5 The seven final bosses (A-Bosses / R5)

All optional. Each needs an **unlock clue** found through exploration: intel, a radio broadcast or a landmark. Each fight has telegraphed attacks, a weak point, a unique hazard, and **anti-cheese**: arena leash, regen + reset if the player is unreachable for 8 s, and no damage from outside the arena boundary.

| # | Boss | Region / arena | Unique mechanic | Counter-play | Reward (game-changing) |
|---|---|---|---|---|---|
| 1 | **The Warden** (existing, polished) | Crater / Lantern | Lantern pulse hits everything in line of sight; brood calls; knockback slams | Break LOS behind monoliths; manage adds | Story ending choice (seal / seize / extract) + Tier unlock |
| 2 | **The Hollow Mother** | Hollow Town church (hive) | Pulsing egg sacs on walls hatch brood every 15 s; she's invulnerable while ≥3 sacs live; acid pools | Fire burns sacs; acid destroys dropped gear (mind your bag) | **Hive Gland**: base claim radius +50% and roamers avoid your territory at night |
| 3 | **The Pinebreak Stalker** | Pinebreak Woods at night, fog | Invisible beyond 6 m unless lit; hunts by sound; drags you out of light into dark | Torches, flares, flashlight, searchlight; standing still and silent makes it reposition | **Night-sight monocle** (scope attachment): see in darkness without emitting light |
| 4 | **The Frostline Colossus** | Frostline Quarry, blizzard | Giant; cold aura drops body temperature by 15 °C; weak points glow only when heated; triggers rockslides | Thermal prep (broth, thermals, fire), molotovs/incendiary reveal weak points, use rockslide cover | **Thermal Rig**: immune to cold, +25% stamina in snow; unlocks wind turbines |
| 5 | **The Cinder Leviathan** | Cinder Flats lava field | Burrows under ash, erupts at your noise; lava pools appear where it surfaces; drops in lava destroy items | Noisemakers bait eruptions onto charges; fight on basalt islands; fireproof gear | **Fireproof Hauler Pack**: +10 slots, your bag survives lava/fire on death |
| 6 | **Commander Sable** | PMC fortress (Kessel freight yards) | Human tactician: squad cover, flanking, mortar strikes on your position, smoke, calls reinforcements via radio towers | Cut the radio towers first, keep moving against the mortars, use lures to bring infected onto his squad | **PMC Codebook**: PMC garrisons turn neutral, and once a day you can call an allied fire team |
| 7 | **The Drowned Choir** | Spillway Dam reservoir | Three singing resonators pull you toward deep water (movement drag); song masks all other audio; swimmers emerge | Localise resonators by stereo audio (subtitles/compass arcs for accessibility), destroy them, fight from the dam walkway | **Rebreather + Boat schematic**: unlimited swimming, the boat class unlocks |

## 2.6 HUD / UI plan (follows your UI brief)

- **Anchor zones:** vitals bottom-left · hotbar bottom-centre · compass, threat and alerts top-centre · objectives/Journal top-right (max 1 + 3) · status effects right of the vitals.
- **Contextual vitals:** FOOD/H2O/STAMINA/TEMP hide when comfortable and fade in below 40%, while changing, or when critical (pulse). HP and armour always show. RAD and TOX appear only when > 0 or in a radiation source.
- **Status effects:** one registry (icon, colour, timer ring, stacks) shared by HUD, inventory and tooltips: Bleeding, Infected, Fracture, Wet, Cold, Freezing, Hot, Weakened, Well-Rested, Meal buff, Encumbered, Hunted, Hidden, Hot Loot.
- **Diegetic layer:** frost creep on the screen edges (cold), heat shimmer (hot), red pulse vignette (bleeding), rain droplets (wet), desaturation + Geiger (radiation), heavy breathing (stamina), weapon crack overlay below 15% condition.
- **Radial wheel** (hold Q): quick-eat, quick-heal, quick-light, throwables. Works mid-combat; time slows ×0.5 only in solo.
- **Inventory:** single screen: backpack · equipped · quick-craft · nearby storage. Tiles show stack count, durability bar, rarity border and Hot border. Tooltips use fixed stat rows with green/red arrows against equipped gear. Drag/drop, shift-click, scroll-split, search, filters.
- **Legibility:** every HUD element gets a dark backdrop or outline. UI scale option (80–140%) in Settings.
- **Zero-latency:** terminal screens open with no fade, keeping the existing instant DOM swap.

## 2.7 CUT

| # | Cut | Why |
|---|---|---|
| C1 | All leftover Deep "cut systems" code: Soul Echo, runes, attributes, Sites of Grace, talismans, flasks, Aether meteors, mimics (`SurvivalDeepSystems`, `PlayerController.takeDamage` hooks, `SurvivalDeepData`) | Dead code that still runs; source of A2 bugs. |
| C2 | "Shrines, Runes & Flasks" modifier category and every `sv_*`/sandbox modifier that is only an HP/damage multiplier | Lazy scaling. Survival modifiers trimmed to ~40 curated rule-changers. |
| C3 | Weapon Mk forging, "Minecraft infusions", elemental cores | Replaced by R9. |
| C4 | Legendary grind counters ("fell 35 trees", "cook 12 meals") | Replaced by exploration clues. |
| C5 | Pit Master NPCs and arena duels | Replaced by the seven bosses' own arenas. |
| C6 | Field challenges as a separate tracker | Folded into feats. |
| C7 | Career-level vehicle grants; Waystone respawn-at-base teleport | Erode zero-to-hero and the haul. |
| C8 | Sandbox cheats earning career rewards | God mode, infinite ammo, free crafting, Box of Wonders and all-unlocks mark the run **Unranked** (no commendations, no Archive, no feats). They stay available. |

---

# STEP 3 — ADVERSARIAL QA (RED TEAM)

I played the plan as a min-maxer. Each break and its fix is now part of the plan.

| # | Break attempt | Result before fix | Fix (now in plan) |
|---|---|---|---|
| X1 | Die on purpose to cure radiation, infection, fracture, hunger | Free full heal | Conditions persist through death and you wake Weakened (A-Corpse). |
| X2 | Deposit and withdraw loot repeatedly to farm the Haul XP bonus | Infinite XP | Hot status only comes from world containers, kills, harvest and drops, and is cleared the first time it's deposited. The bonus counts each item once and is capped per expedition by the max threat reached. Withdrawn items are never Hot again. |
| X3 | Spam torches across the whole map so nothing ever spawns | Trivialised world | Claim lights only count within 30 m of a structure you own or inside a secured site. Torches burn out daily. Total claim area is capped by base tier (bench T1/T2/T3: 2,500/6,000/12,000 m²). Spawns are redirected, not deleted, so pressure moves to the edge of your territory. Hordes ignore claims; Lightbreakers punish over-extension. |
| X4 | Fast-travel home with a full pack | No haul tension | Blocked while carrying Hot loot or while Hunted. |
| X5 | Use an outpost stash as a remote safe | Haul bypass | Outpost stashes are 6 slots and raidable if unlit at night. Deposits there clear Hot status only if the outpost is lit and fenced. |
| X6 | Vehicle trunk as a mobile vault; drive away from everything | Invulnerable escape | Trunk loot is Hot. Vehicles take damage, burn fuel and make class-based noise. Grabbers stagger at low speed. A wrecked vehicle drops its trunk as a bag. |
| X7 | Reroll settler stock infinitely | Guaranteed best gear at once | Retrain costs reputation and doubles per reroll per settler per day (resets daily). Reputation comes only from contracts, deliveries and defending Haven. |
| X8 | AFK turret base farming horde kills | Free XP/loot | Turret kills give no XP or loot. Turrets use base ammo and grid power and overheat. Hordes adapt (Shielded Brutes). |
| X9 | Solar + batteries = infinite power, no fuel ever | Grid puzzle solved once | Solar output scales with daylight and weather (0 in blizzards/at night). Battery capacity is finite. Floodlights and turrets draw heavily at night. Generators remain necessary on long nights; wind is unlocked late via the Colossus. |
| X10 | Cheese bosses from rooftops, water or outside the arena | Free kills | Arena leash. Regen + reset if you're unreachable for 8 s. Damage only counts inside the arena. Colossus throws boulders at elevated targets; Leviathan erupts under you. |
| X11 | Craft from chests across the map | Logistics trivialised | Craft-from-storage only uses chests inside the **same base claim** as the bench. |
| X12 | Quick-stack while being chased | UI escape | Quick-stack, Stash Uplink and travel are disabled while Hunted. |
| X13 | Escape into deep water forever | Safe zone | Swim stamina + drowning; Swimmers from day 5 (I6). |
| X14 | Hoard 50 rations on day 3, never worry again | Hunger solved | Spoilage for fresh food; canned food is rare in loot tables; meal buffs require fresh cooking. |
| X15 | Stack rarity + traits + attachments into one-shot everything | Dominant meta | Rarity damage ≤ +18%, max 2 traits, attachments are trade-offs, condition wear stays. Enemy behaviour (flankers, ambushers, screamers) punishes static sniping. |
| X16 | Pure stealth crouch-headshot through the whole game | Dominant strategy | Blood-trackers, dog-like hearing in the rain-free night, Screamers, ambushers in dark interiors. Stealth stays strong but needs light and sound management. |
| X17 | Story soft-lock: keycards/data lost in a despawned body bag or lava | Unfinishable run | Story items never drop on death. |
| X18 | Soft-lock: no scrap for a bench | Stuck | Field Workbench is timber + stone only (I2). |
| X19 | Sandbox god mode to farm career rewards | Meta inflation | Unranked runs (C8). |
| X20 | Old saves load into new systems | Crashes / lost bases | Checkpoint v3 migration: emeralds → reputation (1:1); obsidian walls → reinforced concrete; pocket vehicles → parked beside your nearest bed; quantum chest contents → base stash; cut-system state dropped safely; quest progress → Journal. |
| X21 | Performance: light claim checks, grid solves, more AI behaviours | Frame drops | Claim lookup uses a 10 m spatial grid, read only on spawn attempts. Grid is re-solved only on build/destroy/day-night change. Target pool rebuilt only when a unit spawns/dies (dirty flag). Markers move to a spatial hash for prompts. Subsystems tick at 10 Hz unless active. |
| X22 | Weather + horde + boss all at once on day 1 | Unfair pile-up | Director **tension budget**: storms and events can't start during a horde or boss fight, and severe fronts aren't rolled in the first 2 days. |

---

## Step 4 build order (after your approval)

Each module is delivered complete, wired in, and tested in the browser before the next starts.

1. **Core loop**: DeathService (R1, A-Corpse), Hot loot & Haul (A-Haul), story-item safety, Weakened, cut dead Deep code (C1).
2. **Director**: Behaviour Ladder (I4/R4), tension budget, swimming (I6), performance fixes (X21).
3. **Light Claim** (A-Light) + map overlay.
4. **Base**: Field Workbench tiers (I2), Power grid (A-Grid), Perimeter defence (A-Defense), horde composition (I3), concrete tier (R13).
5. **Storage & logistics** (A-Store, R12) + inventory screen rework.
6. **Vehicles** (R2 / 2.4).
7. **Outposts & travel network** (A-FOB, R7).
8. **Haven economy & settlers** (A-Settlers, R6).
9. **Weather fronts** (R3) + ecosystem & lures (A-Eco) + Cinder hazards (A-Lava).
10. **Gear & prep**: weapon consolidation (R9, C3), attachments (I9), spoilage, meal buffs, Pack-Out (A-Prep), Survivor Skills (R10).
11. **Seven bosses** (A-Bosses).
12. **HUD/UX** (2.6), Journal merge (I10), game-feel pass, modifier trim (C2, C8), save migration (X20), Field Guide update.

---

# STEP 4 — IMPLEMENTATION STATUS (branch `survival-1.0`)

All new systems live in `src/gm/` behind one lifecycle (`GMCore.js`): modules start/stop with the run, save into the checkpoint (`gm` slice, version 3), and unwind their patches in reverse order. Styles: `css/gm.css`. New key binds: **U** Base screen, **Z** quick-stack (rebindable).

| Module | File | Delivered |
|---|---|---|
| Core | `GMCore.js` | Lifecycle, rate-limited updates, status registry, first-time milestones, stingers, spatial grid |
| Hot loot, Haul, death | `GMLoot.js` | A-Haul, A-Corpse, R1 (single death pipeline, respawn choice, Weakened, 48 h body bags, lava/water fates, insecure-storage ledger) |
| Threat | `GMThreat.js` | I4/R4 behaviour ladder (7 roles), A-Light light claim with fuel/anchors/tier caps, I6 swim stamina, A-Eco lures + predators vs infected, tension budget, Hunted/Hidden |
| Base | `GMBase.js` | I2 field workbench (3 timber + 2 stone) + T2/T3 upgrades, A-Grid power grid, A-Defense turrets/fence/alarm/searchlight/purifier/grow lamp, concrete wall, I3 adaptive horde + radio intel, A-FOB outposts + raids, R7 travel network |
| Storage | `GMStorage.js` | A-Store quick-stack, auto-sort, craft/build from base storage, field satchel, stash uplink, R12 quantum stash retired |
| Vehicles | `GMVehicles.js` | R2 physical vehicles: park, fuel, damage, trunks, enter/exit from any side, horse whistle, wrecks + repair, boat |
| Economy | `GMEconomy.js` | A-Settlers Haven reputation, 5 settler trades, retrain rerolls, upkeep, raids, Haven deliveries |
| Weather | `GMWeather.js` | R3 regional fronts + drift + forecast, senses/solar/wind effects, lightning fires, heatwaves, A-Lava fissures |
| Gear | `GMGear.js` | Spoilage, meal buffs, Well-rested, R9 rarity cap, Mk forging & infusions retired, suppressor trade-off, Pack-out grade, boss reward hooks, PMC fire team |
| Bosses | `GMBosses.js` | A-Bosses: six new optional bosses with unique mechanics, leash + anti-cheese, rewards; legendary hunts and Pit Masters retired |
| HUD | `GMHud.js`, `GMUI.js`, `GMGuide.js` | Contextual vitals (toggle in Controls), status strip with timers, diegetic frost/bleed/rain/heat/rad, context chips, map pins & claim circles, Base screen, Field Guide category, Unranked sandbox runs |

Also fixed: a pre-existing crash when loading any checkpoint that had built structures (`ZoneWorldPlus.decoratePlacedPiece`).

### Deliberately not done (or done differently) in this pass
- **Run perk cards kept** instead of the Survivor Skills tree (R10): they already give per-run choices; replacing them was risk without clear gain.
- **Black Market brokers and gated contacts kept** alongside Haven settlers (R6 partial).
- **20 vehicle models kept as-is** with per-kind class rules (fuel, trunk, armour) rather than merged into 8; a boat was added; there is no glider in the current roster.
- **Legacy Deep code** (runes, talismans, Soul Echo) is inert, not deleted (C1 partial). Legendary hunts / Pit Masters are disabled, not deleted.
- **Not built:** radial quick-wheel, Haven defence events, livestock pens and crop watering (I8), quest-log/contract merge (I10), build-ghost cost at the crosshair (I12), obsidian tier removal (R13), broad modifier trim beyond the rune/flask category (C2).
- Verified by scripted play in the browser (death/respawn, hauls, claims, power, storage, vehicles, all six bosses, save/resume, repeated runs, Zombies mode still starts). Not yet verified by a human playthrough.
