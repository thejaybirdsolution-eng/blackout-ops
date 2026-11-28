/* ============================================================================
   BLACKOUT OPS — Official Update Log Data
   ============================================================================ */
(function (global) {
    'use strict';
    const BO = global.BO = global.BO || {};

    BO.UpdateLogData = {
        project: 'Blackout Ops',
        repo: 'https://github.com/thejaybirdsolution-eng/blackout-ops',
        liveUrl: 'https://thejaybirdsolution-eng.github.io/blackout-ops/',
        period: 'Nov 22 – Nov 28, 2026 (ET)',
        tagMeta: {
            survival:  { label: 'Survival',       color: '#34d399' },
            minigames: { label: 'Minigames',      color: '#f472b6' },
            rogue:     { label: 'Rogue Lite',     color: '#c084fc' },
            owrpg:     { label: 'Open World RPG', color: '#fbbf24' },
            zombies:   { label: 'Zombies',        color: '#f87171' },
            td:        { label: 'Tower Defense',  color: '#4ade80' },
            mp:        { label: 'Multiplayer',    color: '#38bdf8' },
            engine:    { label: 'Engine & UI',    color: '#94a3b8' },
            merge:     { label: 'Release Merge',  color: '#fde047' }
        },
        updates: [
        {
                "id": 1,
                "hash": "84f696b",
                "date": "Nov 22, 2026",
                "fullDate": "November 22, 2026",
                "time": "11:27 AM ET",
                "dayKey": "2026-11-22",
                "title": "Initial Offline Release & Core Modes",
                "major": true,
                "tags": [
                        "td",
                        "zombies",
                        "mp",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I published the first playable, fully offline version of Blackout Ops, a 3D first-person shooter built with Three.js. The launch included three modes: round-based Zombies (Der Bunker and Station Omega, with perks, wall buys, the Mystery Box, Pack-a-Punch, and late-round helicopter exfil), Tower Defense (Castle Keep sieges), and offline multiplayer against computer-controlled opponents on maps such as Killhouse and Crash Site (Team Deathmatch, Free-For-All, Domination, Hardpoint, and Gun Game). Create-a-Class, an interactive 3D gunsmith, rank/prestige progression, a local save system, sound, and a simple launcher (play.bat / server.py) all shipped with this first build."
                        }
                ]
        },
        {
                "id": 2,
                "hash": "0149036",
                "date": "Nov 22, 2026",
                "fullDate": "November 22, 2026",
                "time": "11:55 AM ET",
                "dayKey": "2026-11-22",
                "title": "Peer-to-Peer Online Multiplayer & Static Hosting",
                "major": false,
                "tags": [
                        "td",
                        "zombies",
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added peer-to-peer online multiplayer and co-op lobbies across Zombies, Tower Defense, and Multiplayer, and set the project up to publish as a static site (including a Pages-friendly configuration)."
                        }
                ]
        },
        {
                "id": 3,
                "hash": "edba588",
                "date": "Nov 22, 2026",
                "fullDate": "November 22, 2026",
                "time": "12:05 PM ET",
                "dayKey": "2026-11-22",
                "title": "Online Squad Lobby, Co-Op Revives & Network Manager",
                "major": true,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I finished the online squad lobby. All three modes now sync over peer-to-peer connections, co-op revives work in-game, and invite links let friends join a session. I also replaced the first networking draft with a full Network Manager."
                        }
                ]
        },
        {
                "id": 4,
                "hash": "ce93c8c",
                "date": "Nov 22, 2026",
                "fullDate": "November 22, 2026",
                "time": "11:28 PM ET",
                "dayKey": "2026-11-22",
                "title": "Major Tower Defense Expansion",
                "major": true,
                "tags": [
                        "td",
                        "zombies",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Major Tower Defense expansion: new modes, 16 modifiers, two sniper towers, 20 rotating deployables, 14 perks (up to 8 at once), Pack-a-Punch, an attachment station, and 60-second direction hints for incoming waves."
                        }
                ]
        },
        {
                "id": 5,
                "hash": "b367cb6",
                "date": "Nov 22, 2026",
                "fullDate": "November 22, 2026",
                "time": "11:59 PM ET",
                "dayKey": "2026-11-22",
                "title": "50 New Enemies, 34 Modifiers & Sniper Tower Tiers",
                "major": false,
                "tags": [
                        "td",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added 50 new enemies with a progressive 50/25/15/10 spawn pool, grew the modifier list to 34, and put a live enemy and boss tracker on the HUD. Sniper towers now have six tiers, including an arrow gun and a turret. I also added a custom class station, a 1x–20x variable scope, and 15 late-level attachments."
                        }
                ]
        },
        {
                "id": 6,
                "hash": "74e8820",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "12:51 AM ET",
                "dayKey": "2026-11-23",
                "title": "Tower Defense Layout, Scope & Custom Class Fixes",
                "major": false,
                "tags": [
                        "td"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Tower Defense bug-fix pass. I moved the War Gong, Custom Class Armory, and Castle 3 spawn so they no longer sit in the spawn sightline, and fixed the Attachment Workbench, custom-class slot indexing, the 1x–20x scope mesh and field of view, Tower Turret reuse, a case-sensitivity issue on Sniper Heaven, and a duplicate boss bar."
                        }
                ]
        },
        {
                "id": 7,
                "hash": "4d93b00",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "1:04 AM ET",
                "dayKey": "2026-11-23",
                "title": "Sky Clipping Fix & HUD Enemy Tracker Tightening",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I fixed a giant dark circular clipping artifact on the sky by pushing the camera far plane from 450 to 1200, and tightened spacing on the HUD enemy tracker."
                        }
                ]
        },
        {
                "id": 8,
                "hash": "4efe488",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "1:11 AM ET",
                "dayKey": "2026-11-23",
                "title": "Infinite-Depth Sky Gradient & Cache Busting",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I removed the 3D sphere sky dome entirely and switched to an infinite-depth background gradient, then added script cache-busters so the dark clipping circle could not come back from a stale browser cache."
                        }
                ]
        },
        {
                "id": 9,
                "hash": "18e88f7",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "1:23 AM ET",
                "dayKey": "2026-11-23",
                "title": "Castle Keep Redesign, Wunderfizz & Six-Floor Sky-Lift",
                "major": false,
                "tags": [
                        "td",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I redesigned the Castle Keep layout — Armory Plaza, the Shop & Perks Emporium, a Wunderfizz kiosk for all 14 perks, a royal carpet, and torch braziers — and made every sniper-tower level and the side balconies reachable by open bridges, ramps, and a six-floor sky-lift."
                        }
                ]
        },
        {
                "id": 10,
                "hash": "4958252",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "1:30 AM ET",
                "dayKey": "2026-11-23",
                "title": "Tower Defense Startup Crash Fix",
                "major": false,
                "tags": [
                        "td"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I fixed a crash that killed Tower Defense immediately on startup inside the fire-flames animation loop."
                        }
                ]
        },
        {
                "id": 11,
                "hash": "d8e74d2",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "1:38 AM ET",
                "dayKey": "2026-11-23",
                "title": "Anti-Stuck Pathfinding, 3D Hover Preview & Blackout OS v3.0",
                "major": false,
                "tags": [
                        "td",
                        "zombies",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added anti-stuck pathfinding so enemies no longer freeze in place, a live 3D hover preview of zombies in the Enemy Pool, and five new modifiers (half health, quarter health, 99999 melee, no projectiles, and no projectiles until round 20). Zombies gained supplies, barricades, and the Sniper Tower Ball. I also rebuilt the menus and windows as Blackout OS v3.0 with a full CSS overhaul."
                        }
                ]
        },
        {
                "id": 12,
                "hash": "6c971b6",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "1:39 AM ET",
                "dayKey": "2026-11-23",
                "title": "Sniper Tower Ball Audio Fix",
                "major": false,
                "tags": [
                        "td",
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I fixed the Sniper Tower Ball throw so it plays the correct interface click sound."
                        }
                ]
        },
        {
                "id": 13,
                "hash": "567274a",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "1:49 AM ET",
                "dayKey": "2026-11-23",
                "title": "Multi-Boss Health Bars, Master Perk Machine & UI Polish",
                "major": false,
                "tags": [
                        "td",
                        "zombies",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Boss health bars now sit side by side when several bosses are up. Boss spawns scale at 2% plus 0.5% per round after round 10. Custom matches in Tower Defense and Zombies now accept fully numeric settings. I consolidated perks into a single upgraded Master Perk Machine, and polished the 3D gun, zombie, and perk designs along with the menus."
                        }
                ]
        },
        {
                "id": 14,
                "hash": "9ea75c1",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "1:05 PM ET",
                "dayKey": "2026-11-23",
                "title": "Weapon Mesh Builder Startup Syntax Fix",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I fixed a syntax error (a duplicate trigGuard constant in the weapon mesh builder) that prevented all three modes from launching."
                        }
                ]
        },
        {
                "id": 15,
                "hash": "c6f0cc9",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "1:25 PM ET",
                "dayKey": "2026-11-23",
                "title": "Classic CoD PBR Visual & Zombie Anatomy Overhaul",
                "major": true,
                "tags": [
                        "zombies",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Visual overhaul inspired by classic Call of Duty look: procedural PBR textures with parkerized gunmetal, oiled wood grain, and stippled polymer; extra weapon furniture such as gas tubes, bipods, and a tactical watch; and zombies with veined, decayed skin, tattered fatigues, recessed eye sockets, and teeth. The 3D hover preview now matches the in-world models."
                        }
                ]
        },
        {
                "id": 16,
                "hash": "2907275",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "1:46 PM ET",
                "dayKey": "2026-11-23",
                "title": "Castle Keep Declutter & Weapon Detail Pass",
                "major": false,
                "tags": [
                        "td",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I decluttered the Castle Keep shop layout, rebuilt zombie and boss anatomy, and added more weapon detail — magwells, vents, stock risers, and magazine ribs."
                        }
                ]
        },
        {
                "id": 17,
                "hash": "b350180",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "2:17 PM ET",
                "dayKey": "2026-11-23",
                "title": "Shared Modifier Engine (94 Modifiers) & Lobby Flow",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I introduced a shared modifier engine powering 94 modifiers, 20 starting weapon protocols, detailed enemy field reports, a step-by-step lobby flow, and a new Create-a-Class and main-menu layout."
                        }
                ]
        },
        {
                "id": 18,
                "hash": "fc9c96e",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "3:27 PM ET",
                "dayKey": "2026-11-23",
                "title": "Expansion Shop, Perks & Superpowers Expansion",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I expanded custom matches, perks, and superpowers, and added an expansion shop with its own data and interface."
                        }
                ]
        },
        {
                "id": 19,
                "hash": "8b944bf",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "3:40 PM ET",
                "dayKey": "2026-11-23",
                "title": "Armory & Undead Visual Profiles",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I gave the armory and the undead original visual profiles, including a new arsenal-detail pass on the 3D models."
                        }
                ]
        },
        {
                "id": 20,
                "hash": "8bc5954",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "4:06 PM ET",
                "dayKey": "2026-11-23",
                "title": "Exclusion Zone Solo Survival Mode Launch",
                "major": true,
                "tags": [
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added Exclusion Zone, a new solo Survival mode, with its own data, gameplay mode, interface, and styling."
                        }
                ]
        },
        {
                "id": 21,
                "hash": "03d1e99",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "4:23 PM ET",
                "dayKey": "2026-11-23",
                "title": "Persistent Exclusion Zone Campaign & Career",
                "major": false,
                "tags": [
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I expanded Survival into a persistent Exclusion Zone campaign, with campaign data, career progression, and a dedicated campaign system."
                        }
                ]
        },
        {
                "id": 22,
                "hash": "7c023e2",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "4:47 PM ET",
                "dayKey": "2026-11-23",
                "title": "Survival Backpacks, Mining, Crafting & Frontier Terrain",
                "major": false,
                "tags": [
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Survival gained backpacks, mining, crafting, and frontier terrain, backed by new pack, frontier-data, and terrain systems."
                        }
                ]
        },
        {
                "id": 23,
                "hash": "9627db8",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "5:45 PM ET",
                "dayKey": "2026-11-23",
                "title": "88-Weapon & Enemy Overhaul + Survival Expansion",
                "major": false,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I overhauled all 88 weapons and enemies and built a large Survival expansion: deeper world data and rules, activities, objectives, and a Survival legend/bestiary interface, plus a fresh pass on combat, player control, and 3D arsenal visuals."
                        }
                ]
        },
        {
                "id": 24,
                "hash": "b799614",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "6:25 PM ET",
                "dayKey": "2026-11-23",
                "title": "Modifier Command Deck (400 Modifiers) & Cheat Fixes",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I fixed every cheat toggle, added 400 unique categorized mode modifiers, and redesigned the Modifier Command Deck interface."
                        }
                ]
        },
        {
                "id": 25,
                "hash": "b29fe27",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "9:07 PM ET",
                "dayKey": "2026-11-23",
                "title": "Survival Interface, 10-Slot Hotbar & Threat Director",
                "major": true,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "A full Survival interface and systems overhaul:"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "A guided eight-step deployment screen with a live summary, threat forecast, and hover tips on every option.",
                                        "A unified tabbed field terminal covering inventory, crafting, build, map, skills, journal, and the guide, plus redesigned contact, chest, shrine, and respawn panels.",
                                        "A 10-slot hotbar (keys 1–0 and the mouse wheel) for weapons, tools, and items, with held viewmodels and swing animations. Bare hands can slowly break tier-1 deposits, trees, and timber.",
                                        "A day-by-day threat director: weaker enemies on day one, with the roster and roaming cap growing each day; patrols from day two; Commander Sable from day three.",
                                        "A Controls & Keybinds panel in the pause menu and settings, with every Survival key rebindable and conflicts swapped automatically."
                                ]
                        },
                        {
                                "type": "p",
                                "text": "I also fixed a beacon crash, spawns inside locked biomes, overly harsh hunger and water drain, timber walls that cost salvage, unenforced tech recipes, a first-night Blood Moon, a hidden ammo count, and NPC interact priority."
                        }
                ]
        },
        {
                "id": 26,
                "hash": "f9d08da",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "9:35 PM ET",
                "dayKey": "2026-11-23",
                "title": "Redesigned Modifier Boards, Enemy Dossiers & Field Guide",
                "major": false,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I redesigned the modifier board for every mode: compact toggle tiles, a category rail, a tier filter, curated packs, and an active loadout, with descriptions moved to hover tips and a unique color theme per mode. I added enemy dossier tooltips that show a portrait from the real model plus health, speed, attack, armor, size, look, movement, attacks, traits, weaknesses, and tips. Survival pool tips now list which infected each pool brings and the day each one joins. I also rewrote the Field Guide into 18 sections and more than 550 entries drawn from live game data, including where to find every resource and item and what each one is used for, on both the deploy screen and in-game."
                        }
                ]
        },
        {
                "id": 27,
                "hash": "07ce24d",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "10:42 PM ET",
                "dayKey": "2026-11-23",
                "title": "Survival Roster Matching, Tooltips & UI Contrast Polish",
                "major": false,
                "tags": [
                        "survival",
                        "td",
                        "mp",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Polish pass on the Survival overhaul. I fixed enemy-pool and biome keyword matching so the Infected surge, Aether mutants, PMC occupation, and all biome rosters actually activate, and I blocked empty rosters. I added tactical tips for splitters, shield bearers, teleporters, and leapers, and clamped tall tooltips inside the viewport. Multiplayer and Tower Defense modifier boards now match their lobby colors, with dark scrollbars and preserved scroll position. I also added boss-row dossier tips in the Legend, dynamic enemy and boss counts in the Legend and Barracks, updated lobby subtitles and Sandbox Director tips, and cleaned up Field Guide grammar, forging and Mk-upgrade notes, pool cards, and category-icon contrast."
                        }
                ]
        },
        {
                "id": 28,
                "hash": "5692a1d",
                "date": "Nov 23, 2026",
                "fullDate": "November 23, 2026",
                "time": "11:14 PM ET",
                "dayKey": "2026-11-23",
                "title": "20x Exclusion Zone Rebuild & Transit Network",
                "major": false,
                "tags": [
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I rebuilt Survival Mode around a much larger Exclusion Zone (about 20 times the earlier space), a transit network, and persistent meta-progression across the campaign data, world, and interface."
                        }
                ]
        },
        {
                "id": 29,
                "hash": "698f77f",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "12:24 AM ET",
                "dayKey": "2026-11-24",
                "title": "Zone Engine & Act 1-3 Story Campaign",
                "major": true,
                "tags": [
                        "rogue",
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I laid down a new Zone engine and the Act 1–3 story."
                        },
                        {
                                "type": "p",
                                "text": "The world is now a 500 × 450 m heightfield with ten regions, roads, rail, a reservoir and dam, thousands of trees, buildings with interiors, and climbable radio towers. Loot covers calibre ammunition, weapon condition and jams, brass and hand-loading, timed container searches, and story caches. A director handles noise-driven infected senses, out-of-sight spawning by region threat and tension, simplified enemy processing at long range, PMC patrols, and named guardians."
                        },
                        {
                                "type": "p",
                                "text": "The story runs Act 1 (wreck, ranger station, mast, Haven), Act 2 (three towers plus nests and keycards), and Act 3 (gate, lab data, the Lantern), with three endings recorded on the career profile. Safehouses, a body bag on death, fall fractures, surface swimming, tree felling with regrowth, and real-time menus all landed here. I rebuilt the field map and compass, added a noise meter and jam/fracture status, and grounded the Zone by dropping runes, shrines, and Aether drops. I also added distance culling and tied the camera far plane to fog for performance."
                        }
                ]
        },
        {
                "id": 30,
                "hash": "853ab10",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "12:47 AM ET",
                "dayKey": "2026-11-24",
                "title": "Snap-to-Grid Structural Building & Horde Nights",
                "major": false,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Building is now a snap-to-grid system with structural integrity: a ghost follows your aim and locks to a 2.8 m modular grid, unsupported pieces cannot be placed, and destroying a support can collapse a cascade of pieces (and furniture on them). Pieces have textured materials and per-type health, and can be repaired or dismantled, with a 160-piece cap."
                        },
                        {
                                "type": "p",
                                "text": "Horde nights arrive every third night (every second with Brutal Nights): a dusk warning, then three waves from one bearing aimed at your base or at you. Infected path through player structures at a cost and tear down whatever they get stuck against. The HUD shows a forecast and wave counter, saving is blocked mid-horde, and surviving pays XP and a commendation."
                        }
                ]
        },
        {
                "id": 31,
                "hash": "dd0d8f7",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "1:03 AM ET",
                "dayKey": "2026-11-24",
                "title": "Regional Climate, Biomes, PMC Garrisons & Handcar",
                "major": false,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Frontier systems for the Zone: regional climate with altitude, night, snow, blizzard, rain, and wetness; craftable insulated thermals; and frostbite below -10 C. Local weather is per biome, including toxic ash at Cinder that causes coughing and damage unless you wear a filter. I added four more named guardians with unique spoils, regional loot bonuses, and PMC garrisons that hold a post, raise an alarm, call reinforcements, and can be reoccupied. A rendered freight line and a pump handcar (about 47 km/h, loud enough to run down infected) complete the pass, along with new HUD statuses and Field Guide entries."
                        }
                ]
        },
        {
                "id": 32,
                "hash": "145b818",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "1:10 AM ET",
                "dayKey": "2026-11-24",
                "title": "The Warden Finale & Three Persistent Endings",
                "major": true,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I built the Warden finale at the heart of the Zone. Touching the Lantern with the research data raises the Warden (2,200 HP on Normal) across three phases: brood waves, line-of-sight pulses, then faster pulses with radiation and knockback. A crater arena of basalt monoliths gives pulse cover. The three endings now change the world and can be continued — seal, extract, or seize — with effects that persist through saves. I also added story-critical forced saves, a boss HUD with pulse warnings, and a Field Guide entry, and stopped the Warden from roaming as a guardian."
                        }
                ]
        },
        {
                "id": 33,
                "hash": "ebe46dd",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "2:05 AM ET",
                "dayKey": "2026-11-24",
                "title": "Zone Tiers 1-10, Daily Runs, Mastery Tree & Positional Audio",
                "major": false,
                "tags": [
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I completed the Archive and polish pass for the Zone: tiers 1–10, seed and daily runs, a Mastery Tree, eight kits, positional audio, accessibility options, and a rebuilt Field Guide. Career progression, settings, and sound all grew to support this."
                        }
                ]
        },
        {
                "id": 34,
                "hash": "a5ec5a4",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "9:19 AM ET",
                "dayKey": "2026-11-24",
                "title": "Project Lantern Archive (16 Intel Docs) & 25 Feats",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added the Archive proper: sixteen Project Lantern intel documents (flight logs, police reports, letters, research memos, board minutes) pinned to fixed containers across nine regions, with a glint over unread ones. Recovered intel lives on the career profile, and every fourth find pays a commendation. It can be read in the pre-deploy Archive and in the in-run Journal. I also added 25 feats, checked live during a run and across the career, each paying a commendation once. I fixed a HUD crash caused by calling the loot search-progress getter as a function every frame while a search was in progress."
                        }
                ]
        },
        {
                "id": 35,
                "hash": "8b08d9e",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "9:23 AM ET",
                "dayKey": "2026-11-24",
                "title": "Dynamic World Events (Airdrops, Migrations, Surges)",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added dynamic world events, scheduled every 5–9 minutes after the safe period (at most two at once, and none during hordes or the finale):"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Supply airdrops: a cargo-plane flyover, a crate on a parachute with red smoke, military loot, and a converging PMC squad.",
                                        "Infected migrations: a herd of 12–22 follows a route past the player.",
                                        "Distress calls: an allied survivor pinned at a building; clear the area within six minutes for supplies and a pin to the nearest unread intel.",
                                        "Lantern surges (day 2+): 30 seconds of warning, then 90 seconds of outdoor radiation and violet fog; roofs and filters protect you."
                                ]
                        },
                        {
                                "type": "p",
                                "text": "Active events show HUD chips, compass pips, and pulsing map markers."
                        }
                ]
        },
        {
                "id": 36,
                "hash": "b3b8c20",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "9:44 AM ET",
                "dayKey": "2026-11-24",
                "title": "Zone Grounding Audit, 12-Type Bestiary & Operations",
                "major": false,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Audit and cleanup pass to ground the Zone in what actually works. Survival now draws from a 12-type grounded infected bestiary instead of the 70-type arcade roster. Eight of ten operations were silently running the Lantern story with old-map goals; Homestead, Survey Circuit, Salvage Run, PMC Bounty, Last Stand, Nightly Hordes, and Guardian Gauntlet now have live Zone goals, progress lines, and compass targets. I removed 23 modifiers for cut systems, implemented Nightly Hordes, a hidden-compass trial, and On Foot Only, and dropped Blood Moons and Aether meteors that collided with horde nights. The relay beacon is a player-built forward safehouse. I restored the vehicle list (which had broken the Pathfinder kit), removed skates and the glider, put \"where to find it\" back into the Field Guide, and fixed inventory filters, tooltips, and stale names."
                        }
                ]
        },
        {
                "id": 37,
                "hash": "04594a2",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "12:02 PM ET",
                "dayKey": "2026-11-24",
                "title": "Infested Sites, Weapon Rarity, Perks & Contracts",
                "major": true,
                "tags": [
                        "rogue",
                        "minigames",
                        "survival",
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Fun pass to fill out a Zone that felt empty. Every building, plus about 30 placed outdoor encounters (convoys, camps, roadblocks, crash sites), is now an infested site under a red flag, usually champion-led. Clearing one secures it — green flag, an unlocked stash with a guaranteed weapon roll, XP, and no nearby roaming spawns — and sites can reinfest after three days. Runs now have levels and perk cards (3 of 37 stacking perks, offered only out of combat). Weapons have Common-to-Legendary rarity with 15 traits, colored loot beams, and named legendaries. Champion infected carry affixes, nameplates, and better drops. Haven contracts offer three rotating goals, named bounties, and treasure caches. I also added kill streaks, XP ticks, an ammo trickle, a dawn weapon reward after horde nights, new feats, and Field Guide coverage."
                        }
                ]
        },
        {
                "id": 38,
                "hash": "2ffa6d1",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "12:43 PM ET",
                "dayKey": "2026-11-24",
                "title": "Wild Zone Expansion: Hunting, Dungeons & 183 Quests",
                "major": true,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Wild Zone expansion: eight animal species to hunt; a fire camp, cooking station, tanning rack, and smokehouse with around 45 new recipes; a 70-type roster that unlocks by day; 12 criteria-gated legendary bosses; Pit Master NPCs and a boss arena; nine dungeons with puzzles, hazards, chests, and bosses; 183 unique quests with a quest log; 20 vehicles (five of them build-only); 45 sandbox switches including a master map and the Box of Wonders; and a Survival Journal on the main menu."
                        }
                ]
        },
        {
                "id": 39,
                "hash": "1240361",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "1:44 PM ET",
                "dayKey": "2026-11-24",
                "title": "Companions, 3D Gunsmith, Obsidian Tier & Fishing",
                "major": false,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I expanded the Wild Zone and the armory: companions, a 3D gunsmith, an obsidian gear tier, fishing, a spyglass, radar, and improved dungeon physics."
                        }
                ]
        },
        {
                "id": 40,
                "hash": "1e8177a",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "3:18 PM ET",
                "dayKey": "2026-11-24",
                "title": "Zone World Plus: Forts, Signposts & Black Market",
                "major": false,
                "tags": [
                        "survival",
                        "td",
                        "zombies",
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "A large Zone world expansion. I added Zone expansion data and a new world layer covering fast-travel signposts, survivor forts with siege defense and patrolling defenders, a roaming black market and gated NPCs, world pickups, consumables and gadgets, and storage chests. The same pass updated Zombies, Tower Defense, Multiplayer, and Survival, along with menus, modifiers, audio, arsenal visuals, and HUD work across the board."
                        }
                ]
        },
        {
                "id": 41,
                "hash": "d3f14e2",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "4:28 PM ET",
                "dayKey": "2026-11-24",
                "title": "Survival 1.0: Power Grid, Physical Vehicles & 6 Bosses",
                "major": true,
                "tags": [
                        "rogue",
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Survival 1.0. I introduced a new gameplay layer with one lifecycle and checkpoint slice: hot loot and a haul bonus; a single death pipeline with respawn choice, 48-hour body bags, lava and water fates, and a Weakened state; a behaviour ladder instead of raw day/tier health and damage inflation; light-claim territory; swim stamina; lures; and predators versus infected. You can set up a field workbench anywhere and upgrade it, run a power grid with turrets, fences, and alarms, and use outposts and a travel network. Inventory gained quick-stack, auto-sort, craft-from-base-storage, a satchel, and stash uplink. Vehicles are now physical (park, fuel, damage, trunks, exit from any side). Haven reputation and settler traders, regional weather fronts and lava, spoilage, meal buffs, rest, a rarity cap, and a pack-out checklist all landed here, plus six new optional bosses with unique mechanics alongside the Warden. I also fixed a crash when loading a checkpoint that already had built structures."
                        }
                ]
        },
        {
                "id": 42,
                "hash": "6fa5f41",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "4:46 PM ET",
                "dayKey": "2026-11-24",
                "title": "Survival Gold Audit & Hardening Plan",
                "major": false,
                "tags": [
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I wrote a Survival Gold audit, triage, and hardening plan laying out what to tighten next."
                        }
                ]
        },
        {
                "id": 43,
                "hash": "2b473b4",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "4:48 PM ET",
                "dayKey": "2026-11-24",
                "title": "Batched Resource Deposits (1,687 -> 234 Draw Calls)",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Performance: resource deposits in each world cell are now batched into a single draw call. Draw calls at spawn dropped from 1,687 to 234. Deposits within 14 meters stay as live meshes so per-node effects and hit tests still work."
                        }
                ]
        },
        {
                "id": 44,
                "hash": "7b98a69",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "4:53 PM ET",
                "dayKey": "2026-11-24",
                "title": "Tactile Gathering, Deposit Silhouettes & Pickup Feed",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I made gathering readable and tactile: larger, distinct deposit silhouettes (cairns, crossed sticks, fiber tufts, flowering bitterleaf, raised dig mounds), a look-at outline and floating label with tool, yield, and a damage bar, plus ore glint, strike shake, crack tint, and a rising-pitch material crunch. Broken deposits burst items that magnet to the player, and a pickup feed replaces the old \"Found\" toast. Small deposits regrow in one day with a sprout stage; veins take three. Small deposits give half yield inside your own light claim."
                        }
                ]
        },
        {
                "id": 45,
                "hash": "d1dfcf1",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "4:59 PM ET",
                "dayKey": "2026-11-24",
                "title": "First Night Loop, Room Detection & Safe Rooms",
                "major": false,
                "tags": [
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "First Night. The game now detects rooms (a door is shelter; a burning light plus a bed makes a Safe Room with no roaming spawns). Sleeping skips to dawn only in a Safe Room; elsewhere there is a 35% ambush chance, and you cannot sleep on horde nights. Day-one daylight lasts about 12 real minutes, with sunset warnings every evening. A seven-step First Night tracker points you at the nearest resource; finishing it on night one grants the Trail pack. I also added a weave-cloth bench recipe so beds no longer depend on lucky loot."
                        }
                ]
        },
        {
                "id": 46,
                "hash": "9210e61",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "5:04 PM ET",
                "dayKey": "2026-11-24",
                "title": "Smart Recipe Discovery, Categorized Build Menu & Next Up",
                "major": false,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Recipes now reveal when you first hold an ingredient (blueprints need every ingredient), announced with a chime. First Night essentials stay visible. The crafting list is grouped into Craftable Now, One Ingredient Away, Missing, Station, Locked, and Owned, with live search. The build menu is split into Shelter, Workshop, Light & Fire, Storage, Farm & Water, Defence, and Power, and the build ghost shows have/need per ingredient. After the First Night, a Next Up line points at the most useful thing you are closest to making. I also fixed bleeding or hunger damage kicking you out of menus."
                        }
                ]
        },
        {
                "id": 47,
                "hash": "8d9e7aa",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "5:10 PM ET",
                "dayKey": "2026-11-24",
                "title": "Field Catalogue (110 Entries), Light Pillars & Set Bonuses",
                "major": false,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added the Field Catalogue: 110 entries in seven sets (Earth, Flora, Wildlife, Salvage, Kitchen, Places, Legends) drawn from live game data, with discovery cards, rarity chimes, and XP. Completing sets grants bonuses such as extra ore, plant, meat, or salvage yield, stronger meal buffs, and more XP. Diamond, emerald, and geode deposits, and rare-or- better weapon drops within 40 meters, get light pillars; rare pickups play a sting and a brief slow-motion beat in solo."
                        }
                ]
        },
        {
                "id": 48,
                "hash": "2c2d247",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "5:12 PM ET",
                "dayKey": "2026-11-24",
                "title": "Station Consolidation & Redundant Content Retirement",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I retired redundant stations. The arcane table, alchemy stand, infuser, and cooking station are gone; their recipes move to the campfire and the workbench. The quantum chest, waystone, obsidian wall, and obsidian stairs left the build menu (pieces already built in saved runs still work). I also removed three modifiers that only inflated enemy health or damage. The station bar now shows only hand, workbench, campfire, and kiln."
                        }
                ]
        },
        {
                "id": 49,
                "hash": "a7d935c",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "5:15 PM ET",
                "dayKey": "2026-11-24",
                "title": "Base Life: Auto-Watering Crops & 8-Slice Quick Wheel",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Base life: dry crop beds water themselves from a rain barrel within 6 meters, or from rain. A base status chip reports lights out, crops ready, beds needing water, and a dry generator. I added a quick wheel — tap the quick-heal key to heal, hold for an eight-slice wheel (eat, heal, drink, torch, campfire, quick-stack, repair, throw). Contracts and quests are capped at three rows, with a pointer into the Journal."
                        }
                ]
        },
        {
                "id": 50,
                "hash": "bb1f391",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "5:19 PM ET",
                "dayKey": "2026-11-24",
                "title": "Field Guide Coverage & Checkpoint Door Crash Fix",
                "major": false,
                "tags": [
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added Field Guide entries for the First Night, Safe Rooms, gathering, recipes and Next Up, the Field Catalogue, the quick wheel, and retired content. I also fixed a crash when resuming a checkpoint that already had built doors, which had been throwing in the world layer and would have deleted the restored door groups on start."
                        }
                ]
        },
        {
                "id": 51,
                "hash": "7f570b0",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "9:16 PM ET",
                "dayKey": "2026-11-24",
                "title": "Three-Slot Plate Vest Armor System",
                "major": true,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "A three-slot plate vest replaces the single armour number. Plates come in leather, bone & hide, ceramic (shatters), steel (dents, a small speed penalty, repairable), and composite (cracks, repairable); the front plate decides how much of each hit is absorbed. New kiln and bench recipes craft the higher-tier plates. The obsidian trauma rig is retired (existing ones become two composite plates). The HUD shows each plate's health in its own color, the Base screen can repair or remove plates, and death wears every plate by 25%."
                        }
                ]
        },
        {
                "id": 52,
                "hash": "0416056",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-24",
                "title": "Hot-Loot Indicators & Weapon/Plate Comparison Cards",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Inventory tiles now show a hot-loot ring and a rarity edge. Weapon lists show a rarity border, condition percent, and a condition bar. Standing over a dropped weapon brings up a comparison card (damage, fire rate, damage per second, magazine, reload, and condition) with green and red arrows against the weapon in hand. Plate items compare against the weakest plate in the vest."
                        }
                ]
        },
        {
                "id": 53,
                "hash": "446b6a3",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "9:20 PM ET",
                "dayKey": "2026-11-24",
                "title": "Interface Scale Slider (80%-140%)",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added an interface scale slider (80–140%) under Controls > Display for the HUD, trackers, and overlays, with the field terminal capped at 115% so it still fits. I also recorded Phase 1 progress notes."
                        }
                ]
        },
        {
                "id": 54,
                "hash": "e36407b",
                "date": "Nov 24, 2026",
                "fullDate": "November 24, 2026",
                "time": "11:55 PM ET",
                "dayKey": "2026-11-24",
                "title": "Survivor Skills Tree (3 Branches) & Unified Quick-Move",
                "major": true,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I replaced random perk cards with a Survivor Skills tree: three branches of eight nodes, one point per level, with rows opening at 2, 5, and 8 points spent. New effects include Cold Blooded, Frugal Builder, Field Mechanic, and Grid Tech. Every container now shares one quick-move rule: shift-click moves the stack, right-click moves half, and Shift+scroll moves one."
                        }
                ]
        },
        {
                "id": 55,
                "hash": "3debbf0",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "12:26 AM ET",
                "dayKey": "2026-11-25",
                "title": "Room Types, Livestock Pens & Menu Escape/Layout Fixes",
                "major": false,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added room types and livestock (a chicken coop and goat pen with hatching, feeding, daily produce, neglect, and a tend panel). I rewrote four stale research nodes so their effects actually work, and Tech Points now also come from every third secured site and each completed Catalogue set. Menu fixes: colored buttons were invisible because of an over-broad style rule, Escape now closes windows and backs out of screens, the modifier board uses the full column, the Field Terminal fits from 1024–1920 px, and the HUD no longer draws over menus. Retired Mk upgrade recipes are hidden. Resuming a save now keeps outposts, floodlights, concrete walls, electric fences, stash uplinks, and pens."
                        }
                ]
        },
        {
                "id": 56,
                "hash": "715f0f0",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "12:53 AM ET",
                "dayKey": "2026-11-25",
                "title": "Survival Dev Mode (F8) & Preset Save Fix",
                "major": false,
                "tags": [
                        "survival",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Modifier presets were silently saving nothing in every mode; I fixed that and added an on-screen confirm. I added Survival Dev Mode: a toggle on the deployment screen and an F8 panel with invulnerability, flight, noclip, time/weather/horde control, any item or weapon, free build, unlocks, live rule toggles, spawning, teleport, mission control, an inspector, and debug info. I also polished tabbed windows, toggles, sliders, and small-screen layout, and made quitting Survival save when it is safe (and ask when it is not). The map vehicle list no longer reads \"Level Infinity\"."
                        }
                ]
        },
        {
                "id": 57,
                "hash": "fa023d8",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "1:22 AM ET",
                "dayKey": "2026-11-25",
                "title": "Shared Zombie Customizer Across Survival, Zombies & TD",
                "major": false,
                "tags": [
                        "survival",
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added a shared Zombie Customizer for Survival, Zombies, and Tower Defense. You can edit stats, choose a start round or day, set category and per-zombie spawn chances, and save setups."
                        }
                ]
        },
        {
                "id": 58,
                "hash": "1e69592",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "1:29 AM ET",
                "dayKey": "2026-11-25",
                "title": "Main Menu Mode Status Badges",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added subtle status badges to the mode cards on the main menu."
                        }
                ]
        },
        {
                "id": 59,
                "hash": "d8c6109",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "2:42 AM ET",
                "dayKey": "2026-11-25",
                "title": "Minigames Mode: Target Practice, Boss Rush & Whack-a-Mole",
                "major": true,
                "tags": [
                        "minigames",
                        "survival",
                        "zombies",
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added Minigames, a new solo mode from the main menu, with its own hub, in-game HUD, results card, stars, and personal bests."
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Target Practice: ten scripted 60-second courses (Range Day, Coaster Chaos, Boulder Run, Skeet Storm, Bandit Town, Drone Swarm, Sniper Ridge, Heli Gunner, Balloon Festival, and Killhouse Blitz). Each course uses a fixed seed so it plays the same every run; rail courses move the player automatically.",
                                        "Boss Rush: every boss in a Colosseum, bottomless magazines, no regen, 30-second rests, and three max heals for the whole run, with three modes and three difficulties.",
                                        "Whack-a-Mole: Classic, Frenzy, and Mayhem carnival booths."
                                ]
                        },
                        {
                                "type": "p",
                                "text": "I also added Enemy Lab, a per-enemy stat, start-round/day, and spawn- chance editor for Zombies and Survival, plus a test-runner page."
                        }
                ]
        },
        {
                "id": 60,
                "hash": "44395b6",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "2:45 AM ET",
                "dayKey": "2026-11-25",
                "title": "Merged Parallel Branch & Unified Zombie Customizer",
                "major": false,
                "tags": [
                        "merge",
                        "minigames",
                        "survival",
                        "td"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I merged a parallel line of work back into the live game. Master already had the shared Zombie Customizer covering the same ground as Enemy Lab (stats, start round or day, spawn chances, and saved setups) and hooked into Zombies, Tower Defense, and Survival. I resolved every spawn conflict in favor of the Zombie Customizer and removed Enemy Lab's buttons and files so there is a single enemy editor. Minigames were unaffected."
                        }
                ]
        },
        {
                "id": 61,
                "hash": "3d27cb5",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "6:19 AM ET",
                "dayKey": "2026-11-25",
                "title": "Rogue Lite Mode Launch: The Haven & Blackout Vaults",
                "major": true,
                "tags": [
                        "rogue"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I started a new Rogue Lite mode: The Haven as a hub (delve, loadout, talents, stash, merchant, forge, upgrades, and roster), operatives with abilities, floor-by-floor delves into the Blackout Vaults, an arena layer, a persistent profile, and a full mode interface and data set."
                        }
                ]
        },
        {
                "id": 62,
                "hash": "3aea982",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "6:25 AM ET",
                "dayKey": "2026-11-25",
                "title": "Rogue Lite Added to Live Home Screen (6 Modes)",
                "major": false,
                "tags": [
                        "rogue",
                        "minigames",
                        "survival",
                        "td"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I brought Rogue Lite onto the live home screen so all six game modes sit together: Zombies, Tower Defense, Multiplayer, Survival, Minigames, and Rogue Lite."
                        }
                ]
        },
        {
                "id": 63,
                "hash": "b38917c",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "6:45 AM ET",
                "dayKey": "2026-11-25",
                "title": "Deep-Vault Hazard Rooms, Haven Contracts & Vault Racks",
                "major": false,
                "tags": [
                        "rogue",
                        "minigames",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I expanded Rogue Lite with deep-vault content and Haven contracts. Hazard rooms (Pressure Vents, Surge Circuit, Null Fracture, and others) can pay a bonus vault chest when cleared. Contracts such as Vault Sweep, Salvage Survey, Pressure Test, Deep Patrol, and Faultline Survey are scoped to a single delve and pay gold and scrap only if you extract. The Haven gained a Contracts tab, a Field Guide tab, and Vault Racks stash upgrades, and the in-delve HUD tracks contract progress."
                        }
                ]
        },
        {
                "id": 64,
                "hash": "a75a9fe",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "7:15 AM ET",
                "dayKey": "2026-11-25",
                "title": "Rogue Lite Progression Overhaul & Unified Game Guide",
                "major": false,
                "tags": [
                        "rogue",
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I overhauled Rogue Lite progression and unlocks, added Mystery room events and new vault artwork and encounter data, and introduced a shared game guide, folding the older Survival journal and legend pages into that guide."
                        }
                ]
        },
        {
                "id": 65,
                "hash": "e35c8e4",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "7:28 AM ET",
                "dayKey": "2026-11-25",
                "title": "Eight Special Rogue Lite Door Types & Keystones",
                "major": false,
                "tags": [
                        "rogue"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added eight door types to Rogue Lite. Each gate now rolls a door type on top of its room: Vault, Gilded (gold toll for double gold), Blood (costs HP for more XP), Fractured (tougher enemies, bigger payout), Veiled (hidden room), Hourglass (seals 25 seconds after a clear), Clover (refills potions), and Reliquary (costs scrap, holds a treasure chest). At least one door per floor is always free and never seals, and guardian floors stay plain. Special doors get a colored keystone above the arch so they read from a distance. Door types carry over in suspended runs, and older saves still load. I also added a Door Types section to the Game Guide and updated the Rogue Lite card on the home screen."
                        }
                ]
        },
        {
                "id": 66,
                "hash": "3ed2dec",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "8:33 AM ET",
                "dayKey": "2026-11-25",
                "title": "5 New Target Courses & 6-Game Arcade Hall",
                "major": true,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I expanded Minigames with five new Target Practice courses and a new Arcade Hall with six minigames. The new courses include Beat Drop (rhythm shooting), One Mag (a one-magazine trial), a horseback chase, a mansion raid, and a beach party course, bringing Target Practice to fifteen scripted courses. The Arcade Hall adds Pistol Quickdraw duels, two in-world arcade cabinets (Wild Hunt and Night Terrors), Ball Brawl (a hamster-ball brawler), Aim Diagnostics (an aim-testing lab with drills), and Contracts (six timed assassination targets hidden in crowds). I also added shared minigame figures, new styling, and small combat and controller hooks to support them."
                        }
                ]
        },
        {
                "id": 67,
                "hash": "53048f5",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "8:51 AM ET",
                "dayKey": "2026-11-25",
                "title": "Sweetheart Shore Beach Overhaul & Spring Physics",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I overhauled the Sweetheart Shore beach level with new sculpted character art and spring-based physics for more natural movement, and reworked the course itself."
                        }
                ]
        },
        {
                "id": 68,
                "hash": "5d6ea95",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "9:07 AM ET",
                "dayKey": "2026-11-25",
                "title": "3D Character Sculptor, Shaders & Soft-Body Physics",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I rebuilt the Sweetheart Shore characters with a new adjustable 3D character sculptor, upgraded material shaders, and a connected soft-body physics system for smoother, more lifelike animation."
                        }
                ]
        },
        {
                "id": 69,
                "hash": "51f7bfd",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "9:19 AM ET",
                "dayKey": "2026-11-25",
                "title": "Image-Based Lighting, Proportions & Hairstyles",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I upgraded the Sweetheart Shore characters again with image-based lighting, more realistic body proportions, better-fitted swimwear, and new hairstyles."
                        }
                ]
        },
        {
                "id": 70,
                "hash": "ebbd7db",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "12:58 PM ET",
                "dayKey": "2026-11-25",
                "title": "Sweetheart Shore Art & Gameplay Tweaks",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I refined the Sweetheart Shore art further and made a few gameplay tweaks to the beach course."
                        }
                ]
        },
        {
                "id": 71,
                "hash": "1ce6c2a",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "12:58 PM ET",
                "dayKey": "2026-11-25",
                "title": "Open World RPG (Operation Meridian) Launch",
                "major": true,
                "tags": [
                        "owrpg",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added a brand-new solo mode, Open World RPG (Operation Meridian). It features a 640 m open world with six regions and skyline landmarks, four rival factions, character builds with attributes and perks, dialogue with skill checks, and branching quests (The Dry Artery alone has five possible outcomes, plus five more quests). It also includes stealth and enemy awareness, explosive chain reactions, loot, vendors and a stash, fast-travel pylons, a day/night cycle, and three save slots. I hooked it into the main menu, settings, controls, and the Game Guide, built a test suite for it (29 of 29 passing), and wrote design and spec documents."
                        }
                ]
        },
        {
                "id": 72,
                "hash": "4e9d611",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "12:59 PM ET",
                "dayKey": "2026-11-25",
                "title": "Open World RPG Merged to Live Master Build",
                "major": false,
                "tags": [
                        "merge",
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I merged the Open World RPG (Operation Meridian) feature branch into the live master build, so the new mode is now available on the site."
                        }
                ]
        },
        {
                "id": 73,
                "hash": "5f37e04",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "1:18 PM ET",
                "dayKey": "2026-11-25",
                "title": "Minigames Polish: Beat Drop, Contracts & Per-Option PBs",
                "major": false,
                "tags": [
                        "minigames",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I made a round of Minigames improvements. Personal bests are now saved separately for each course option and each weapon, and the hub shows both records. Beat Drop got ten new songs (difficulty 1 to 10) and Easy, Medium, Hard, and Hell modes for all eleven songs, and each bullet now breaks only one disc. In Contracts you can now practice any single contract, bullets no longer pass through targets, the mark no longer gets stuck at the fountain, and the escape route is reachable. Mansion Raid now has fifteen different situations, with one picked at random each run. One Mag now allows your class weapon, locked to 30 rounds."
                        }
                ]
        },
        {
                "id": 74,
                "hash": "f6a2fec",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "1:22 PM ET",
                "dayKey": "2026-11-25",
                "title": "Giant Boss Rush (5x Scale & 75 Signature Attacks)",
                "major": true,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I upgraded Boss Rush so every boss is five times its size and has five unique signature attacks, for 75 named attacks in total. Attack cooldowns and damage scale with each boss tier, melee stomps are sized for the giants, and there is now an on-screen warning and a move list."
                        }
                ]
        },
        {
                "id": 75,
                "hash": "427343b",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "1:29 PM ET",
                "dayKey": "2026-11-25",
                "title": "Nine New Arcade Hall Games",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added nine new games to the Arcade Hall: Bottle Juggler, Color Lock, Number Crunch, Echo Panels, Switchyard, Starfall Shield, Fishing Hole, Paint Wars, and Safe Cracker."
                        }
                ]
        },
        {
                "id": 76,
                "hash": "93663c5",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "1:40 PM ET",
                "dayKey": "2026-11-25",
                "title": "Speed Runs Category (7 Timed Runs)",
                "major": true,
                "tags": [
                        "minigames",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added Speed Runs, a new minigame category with seven timed runs: Gauntlet Sprint, Outpost Rescue, Getaway Chase, The Splitter, Sky Snipers, Last 50, and Freefall. I also fixed a bug where moving targets lost their tilt and spin, and sorted minigame categories in a set order."
                        }
                ]
        },
        {
                "id": 77,
                "hash": "0a6dfce",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "1:44 PM ET",
                "dayKey": "2026-11-25",
                "title": "Minigames Hub Option Pickers & Menu Refresh",
                "major": false,
                "tags": [
                        "minigames",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I updated the Minigames hub so course option pickers appear next to the weapon choice, and refreshed the menu text."
                        }
                ]
        },
        {
                "id": 78,
                "hash": "90c8f7c",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "1:44 PM ET",
                "dayKey": "2026-11-25",
                "title": "Minigames Overhaul Merged to Live Master Build",
                "major": false,
                "tags": [
                        "merge",
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I merged the Minigames overhaul branch into the live master build, bringing the new Beat Drop songs and modes, Contracts fixes, Mansion Raid situations, the giant Boss Rush, nine Arcade Hall games, and Speed Runs to the site."
                        }
                ]
        },
        {
                "id": 79,
                "hash": "2184fbd",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "1:57 PM ET",
                "dayKey": "2026-11-25",
                "title": "Full-Auto / Single-Fire Toggle Across All Modes",
                "major": true,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added the option to switch every automatic gun between full-auto and single fire in all modes, with a setting for it and a fire-mode indicator on the HUD."
                        }
                ]
        },
        {
                "id": 80,
                "hash": "5e061b2",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "2:23 PM ET",
                "dayKey": "2026-11-25",
                "title": "Home Screen Patch Notes & Full Update Log Modal",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added a live Patch Notes preview card on the main menu alongside a searchable, filterable Update Log modal covering the entire development timeline."
                        }
                ]
        },
        {
                "id": 81,
                "hash": "5d95c3f",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "5:39 PM ET",
                "dayKey": "2026-11-25",
                "title": "AAA Visual Overhaul: HDR Pipeline, Shader Sky & IBL",
                "major": true,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Major graphics and UI overhaul introducing an HDR post-processing pipeline, procedural shader sky with image-based lighting (IBL), rebuilt PBR textures, and a redesigned menu and HUD."
                        }
                ]
        },
        {
                "id": 82,
                "hash": "77e6de8",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "7:35 PM ET",
                "dayKey": "2026-11-25",
                "title": "Visual Pass 2: Bevels, AO, Sun Shafts & Ornamented UI",
                "major": true,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Second visual pass adding global mesh bevels, ambient occlusion, volumetric sun shafts, eye adaptation, atmospheric dust, contact shadows, and ornamented UI framing."
                        }
                ]
        },
        {
                "id": 83,
                "hash": "65458cb",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "7:45 PM ET",
                "dayKey": "2026-11-25",
                "title": "Visual Pass 3: Operator Model, Creature Shading & ADS DoF",
                "major": true,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Third visual pass introducing a new 3D operator model, upgraded creature shading, ADS depth of field, tactile hit-stop feedback, and unified UI styling across every screen."
                        }
                ]
        },
        {
                "id": 84,
                "hash": "b3790b1",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "8:10 PM ET",
                "dayKey": "2026-11-25",
                "title": "Sweetheart Shore: 100% Complete AAA Character Design & 10 Roster Archetypes",
                "major": true,
                "tags": [
                        "minigames",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I completed the design of the beach minigame enemies (Sweetheart Shore) into ten fully designed, beautiful anime beachgoers with bespoke 3D props (tropical coconut drinks, flamingo floaties, water blasters, woven beach totes, volleyballs, popsicles, rescue cans), unique personality-driven jog kinematics (cute bounce, athletic dash, model strut, playful skip, romantic frolic), multi-tier jewel anime eye shaders with catchlights and glossy 3D cornea lenses, Soft-Engine subsurface skin scattering, and celebratory voice popups and heart bursts."
                        }
                ]
        },
        {
                "id": 85,
                "hash": "7da385f",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "2:05 PM ET",
                "dayKey": "2026-11-26",
                "title": "Minigame Expansion & Visual Refresh",
                "major": true,
                "tags": [
                        "minigames",
                        "engine",
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "The Minigames hub now has 63 challenges across five categories. The release adds 22 Fun & Specials modes, two Speed Runs and guides with objectives, controls and tips."
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Try snowboarding, toyshop prop hunt, orbital breach, hoverbike racing and 3D pinball in Fun & Specials.",
                                        "Take on Ninja Stealth and Three-Headed Dragon, or replay the reworked Getaway Chase and Deagle Meteor Splitter.",
                                        "Find Whack-a-Mole under Target & Action and watch a first-person Beat Drop example without affecting personal records.",
                                        "Explore refreshed map props and materials, reworked zombie and Sweetheart Shore models, and smoother first-person sprint, slide and reload animations."
                                ]
                        }
                ]
        },
        {
                "id": 86,
                "hash": "tour86a",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "2:48 PM ET",
                "dayKey": "2026-11-26",
                "title": "Flagship Fun Overhaul: Bastion Warden, Summit Rally, Flight Circuit & Prism Foundry",
                "major": true,
                "tags": [
                        "minigames",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Completed the flagship overhaul across Master Zombie, Snowboarding, 360 Trick Shot, Mario FPS and Skybreak Sling—upgrading 3D map architecture with PBR textures, adding deep gameplay systems, and introducing a dedicated multi-track Web Audio music & DSP sound engine (MinigameAudio.js)."
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Master Zombie: textured Bastion Omega citadel with wrecked Humvees, searchlight cones, automated sentry turrets, explosive fuel barrels, 3-stage Bio-Evolution (Biomass orbs, Triple Acid Pools, Predator Pounce [C]), Infected Soldier conversion, 2-Phase Warden boss, and dark industrial bio-horror music.",
                                        "Snowboarding (Summit Rally + Alpine Endurance): Peak 9 Resort with alpine chalets, Crystal Ice Cavern, orange B-netting, high-line rail transfers, neon speed pads, gold big-air kickers, Indy/Method/Flip/Superman Uber [Q] tricks, slipstream drafting, avalanche finale, 172 BPM DnB synthwave soundtrack, and dynamic snow-carve & copper rail-grind DSP audio.",
                                        "360 Trick Shot (Flight Circuit): 5 detailed industrial towers, corrugated shipping container yard, 3 Pneumatic Bounce Pads for 720°/1080° double-bounce chains, Steel Ricochet Gongs, Explosive Propane Barrels, UAV bonus drone, mid-air Nac-Swap [F] & Barrel Roll [Q] style moves, and slow-mo lowpass bass-drop chase replays.",
                                        "Mario FPS (Prism Foundry + Classic Worlds): Prism Foundry adds Clockwork Sentinel drones, rotating laser sweepers, 8 aerial Prism cells, a rotating Governor seal rotor & reactive Cyan/Amber synthwave; Classic Worlds 1-1 to 1-4 add 4-channel chiptune music, kickable Koopa shells, Castle Thwomps, Starman invincibility & flagpole height bonuses."
                                ]
                        }
                ]
        },
        {
                "id": 87,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Main menu soundtrack",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "An original dark industrial score plays on the title screen and in the menus."
                        }
                ]
        },
        {
                "id": 88,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Music mute button",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Mute or restore the soundtrack independently using the music button in the main menu. The setting is saved."
                        }
                ]
        },
        {
                "id": 89,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Sound effects mute button",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Turn menu and game sound effects off or on without changing the music setting."
                        }
                ]
        },
        {
                "id": 90,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Main menu mode grid",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Game modes are arranged in a compact grid for direct access from the main menu."
                        }
                ]
        },
        {
                "id": 91,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Multiplayer records in Barracks",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Barracks tracks kills, deaths, headshots, objectives completed, matches played, and your highest kill count in one match."
                        }
                ]
        },
        {
                "id": 92,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Multiplayer multi-kill announcements",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Double Kill, Triple Kill and higher multi-kill announcements are reserved for Multiplayer."
                        }
                ]
        },
        {
                "id": 93,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Modifier visibility",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Hide modifiers from normal browsing and restore them from the Hidden view."
                        }
                ]
        },
        {
                "id": 94,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Custom modifiers",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Build and name your own modifier by choosing when it triggers and what effect it applies."
                        }
                ]
        },
        {
                "id": 95,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "104 modifier combinations",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "The modifier catalog adds 104 named trigger-and-effect combinations using shared gameplay mechanics."
                        }
                ]
        },
        {
                "id": 96,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Expanded match rules",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Multiplayer match setup adds independent options for customizing how a match plays."
                        }
                ]
        },
        {
                "id": 97,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Classic weapon catalog expansion",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "The catalog now has 77 distinct entries, with additions from the CoD4, World at War, Modern Warfare 2 and Black Ops eras."
                        }
                ]
        },
        {
                "id": 98,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Create a Class equipment expansion",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Additional attachments, perks, lethal and tactical equipment, and killstreak rewards are available in Create a Class."
                        }
                ]
        },
        {
                "id": 99,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Filter weapons by game",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Use the Game menu alongside weapon class and search to find weapons by their source title."
                        }
                ]
        },
        {
                "id": 100,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Multiplayer bot model overhaul",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Bots have updated uniforms, gear, and silhouettes in Multiplayer."
                        }
                ]
        },
        {
                "id": 101,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Multiplayer bot animation overhaul",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Bot movement and combat poses have been updated for more readable reactions."
                        }
                ]
        },
        {
                "id": 102,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Rare flying ragdoll",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Multiplayer bot deaths have a 1-in-100 chance to launch the body with a cartoon whistle that fades with distance."
                        }
                ]
        },
        {
                "id": 103,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Infection",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "A bot-supported match mode turns eliminated survivors into infected and tracks the remaining survivors."
                        }
                ]
        },
        {
                "id": 104,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Search and Destroy",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "A bot-supported round mode puts opposing teams on bomb offense and defense."
                        }
                ]
        },
        {
                "id": 105,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Four Teams",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Four teams of four compete in the new four-sided match variant."
                        }
                ]
        },
        {
                "id": 106,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Hardcore Team Deathmatch",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Hardcore rules change the pace and damage tolerance of Team Deathmatch."
                        }
                ]
        },
        {
                "id": 107,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Hardcore Free-for-All",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Every player is on their own under the Hardcore ruleset."
                        }
                ]
        },
        {
                "id": 108,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "King of the Hill Bounty",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "In this bot-supported Free-for-All variant, the bounty holder has double health and never needs to reload. The bounty passes to their killer, and the longest total hold wins."
                        }
                ]
        },
        {
                "id": 109,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Early Zombies window entries",
                "major": false,
                "tags": [
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Early regular Zombies spawns use window approaches where the map provides them, with other entry points opening in later rounds."
                        }
                ]
        },
        {
                "id": 110,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Single-perk Zombies machines",
                "major": false,
                "tags": [
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Each Zombies machine sells one perk. Tower Defense keeps the combined vending machine."
                        }
                ]
        },
        {
                "id": 111,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Full zombie previews",
                "major": false,
                "tags": [
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "The Zombies preview frames the whole model, including tall and wide enemy types."
                        }
                ]
        },
        {
                "id": 112,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Twenty zombie movement styles",
                "major": false,
                "tags": [
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Twenty new movement styles give enemies different approaches."
                        }
                ]
        },
        {
                "id": 113,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Twenty zombie attack types",
                "major": false,
                "tags": [
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Twenty new attacks give enemies different ways to threaten players."
                        }
                ]
        },
        {
                "id": 114,
                "hash": "cbd7891",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:38 PM ET",
                "dayKey": "2026-11-26",
                "title": "Multiple attacks per zombie",
                "major": false,
                "tags": [
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Some zombies can choose from up to three attacks. Each has its own cooldown, and the zombie performs one attack at a time."
                        }
                ]
        },
        {
                "id": 115,
                "hash": "8722e54",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:46 PM ET",
                "dayKey": "2026-11-26",
                "title": "Pinned weapon filters",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Weapon classes, source game, and search stay available while you scroll the weapon list."
                        }
                ]
        },
        {
                "id": 116,
                "hash": "54ee1e9",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "7:47 PM ET",
                "dayKey": "2026-11-26",
                "title": "Weapon filters on short screens",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "The Create a Class weapon picker gives results more room while keeping controls accessible on short screens."
                        }
                ]
        },
        {
                "id": 117,
                "hash": "2087c4a",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "8:13 PM ET",
                "dayKey": "2026-11-26",
                "title": "Modifiers workspace",
                "major": true,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Browse, Active, Presets, and Create have separate views with clear descriptions and quick access to search, visibility, and category filters."
                        }
                ]
        },
        {
                "id": 118,
                "hash": "2087c4a",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "8:13 PM ET",
                "dayKey": "2026-11-26",
                "title": "Create a Class weapon studio",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "A brighter background and dedicated lighting make dark weapon finishes visible. Rotate and zoom the model with the pointer or keyboard."
                        }
                ]
        },
        {
                "id": 119,
                "hash": "2087c4a",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "8:13 PM ET",
                "dayKey": "2026-11-26",
                "title": "Clear iron sights and optics",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "First-person sight lines have been aligned and checked across 1,344 firearm and optic configurations."
                        }
                ]
        },
        {
                "id": 120,
                "hash": "2087c4a",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "8:13 PM ET",
                "dayKey": "2026-11-26",
                "title": "Multiplayer ragdoll physics",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Weapon hits carry momentum into bot ragdolls, which tumble, bounce off geometry, and settle with damped limb motion."
                        }
                ]
        },
        {
                "id": 121,
                "hash": "2087c4a",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "8:13 PM ET",
                "dayKey": "2026-11-26",
                "title": "Always Launch Ragdolls cheat",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Settings → Cheats offers Always Launch Ragdolls. It sends every Multiplayer bot death flying with the cartoon whistle."
                        }
                ]
        },
        {
                "id": 122,
                "hash": "2087c4a",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "8:13 PM ET",
                "dayKey": "2026-11-26",
                "title": "Sliding selection highlight",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "The highlight moves continuously between choices in supported lobby, Modifiers, and Create a Class controls, with an immediate change when reduced motion is enabled."
                        }
                ]
        },
        {
                "id": 123,
                "hash": "2087c4a",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "8:13 PM ET",
                "dayKey": "2026-11-26",
                "title": "Zombies perk machine routes",
                "major": false,
                "tags": [
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Four expansion perk machines occupy fixed, map-specific locations on each of nine Zombies maps. Explore different rooms, routes, and floors to find them."
                        }
                ]
        },
        {
                "id": 124,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Shared global 3D asset & audio pipeline",
                "major": true,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added a shared asset loader (BO.Assets) supporting cached GLB models, GPU-instanced placement, seamless 1024px PBR textures, panoramic skyboxes, and streamed Web Audio clips across every game mode."
                        }
                ]
        },
        {
                "id": 125,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Minigame announcer voiceovers",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Wired spoken announcer voice lines into minigame 3-2-1 countdowns, GO starts, new high scores, mission completions, and game over screens."
                        }
                ]
        },
        {
                "id": 126,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Genre-matched minigame music tracks",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added genre-matched looping music tracks for Pistol Quickdraw (banjo Western), Paint Wars (electronic backbeat), and boss encounters in Three-Headed Dragon and Kaiju vs. Mecha Metropolis."
                        }
                ]
        },
        {
                "id": 127,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Starfall Shield 3D city valley overhaul",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Upgraded Starfall Shield with a space skybox panorama and replaced the valley city blocks with 3D industrial buildings, water towers, and storage tanks."
                        }
                ]
        },
        {
                "id": 128,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Paint Wars & Safe Cracker visual props",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added daytime and night skybox panoramas plus shipping containers in Paint Wars and treasure chests, gold coins, and vault machinery in Safe Cracker."
                        }
                ]
        },
        {
                "id": 129,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Quickdraw, Dragon & Kaiju 3D scenery upgrades",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Updated Pistol Quickdraw with a high-noon morning skybox and boardwalk props, Three-Headed Dragon with an alien skybox and caldera bastion towers, and Kaiju Metropolis with harbor smokestacks and water towers."
                        }
                ]
        },
        {
                "id": 130,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Operation Meridian 3D forests, boulders & skybox",
                "major": false,
                "tags": [
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Replaced Open World RPG cone/icosahedron vegetation with GPU-instanced 3D pine trees, broadleaf trees, dead trunks, and rock outcrops alongside field tents, industrial tanks, and a morning skybox."
                        }
                ]
        },
        {
                "id": 131,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Open World RPG Pip-Pad hardware icons",
                "major": false,
                "tags": [
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Equipped all eight Pip-Pad wrist terminal navigation tabs with military, sci-fi, and dieselpunk hardware icons."
                        }
                ]
        },
        {
                "id": 132,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Tower Defense 3D castle fortifications & skyboxes",
                "major": false,
                "tags": [
                        "td"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Fortified Tower Defense keep structures with panoramic skyboxes, 3D stone corner towers, spires, and bastion banners framing the Castle Heart."
                        }
                ]
        },
        {
                "id": 133,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Tower Defense 3D blaster turret assemblies",
                "major": false,
                "tags": [
                        "td"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Mounted detailed 3D blaster assemblies onto Sniper Nests, Attack Drones, Combat Mechs, Flame Turrets, Cryo Projectors, Tesla Coils, Laser Beacons, and EMP Towers."
                        }
                ]
        },
        {
                "id": 134,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Tower Defense shop card icons",
                "major": false,
                "tags": [
                        "td"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added military, sci-fi, and dieselpunk equipment icons to rolled weapons, rotating deployables, and castle defense cards in the Tower Defense intermission shop."
                        }
                ]
        },
        {
                "id": 135,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Survival base building PBR textures & 3D doors",
                "major": false,
                "tags": [
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Upgraded player-built floors, walls, slate roofs, stone masonry, and diamond-plate doors with seamless 1024px PBR materials and 3D castle door meshes."
                        }
                ]
        },
        {
                "id": 136,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Survival Field Terminal status & brand icons",
                "major": false,
                "tags": [
                        "survival"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Updated the Survival Field Terminal header and weapon condition, campus keycard, and fracture status chips with military UI icons."
                        }
                ]
        },
        {
                "id": 137,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Rogue Lite 3D dungeon columns, barrels & banners",
                "major": false,
                "tags": [
                        "rogue"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Furnished procedural Rogue Lite rooms with GPU-instanced stone columns, corner barrels, and wall banners with safe shared-geometry floor teardown."
                        }
                ]
        },
        {
                "id": 138,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Rogue Lite Haven hub fantasy icons",
                "major": false,
                "tags": [
                        "rogue"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added fantasy RPG equipment, skill, forge, and crest icons across Haven navigation tabs and the Gold/Scrap wallet header."
                        }
                ]
        },
        {
                "id": 139,
                "hash": "8bdadf5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "9:18 PM ET",
                "dayKey": "2026-11-26",
                "title": "Zombies graveyard scenery, MP skylines & Gunsmith icons",
                "major": false,
                "tags": [
                        "zombies",
                        "mp",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added night skyboxes with outer graveyard crypts, fences, and headstones in Zombies, panoramic day/night skyboxes with industrial skylines in Multiplayer, and military icons to Gunsmith attachment tabs."
                        }
                ]
        },
        {
                "id": 140,
                "hash": "v2.5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:08 PM ET",
                "dayKey": "2026-11-26",
                "title": "Crossfading music & randomized SFX engine",
                "major": true,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Upgraded BO.Assets and SoundEngine with smooth music track crossfading, environmental ambient loops, pitch and volume randomization on footsteps, clicks, and hitmarkers, plus dedicated stinger and impact cue helpers."
                        }
                ]
        },
        {
                "id": 141,
                "hash": "v2.5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:08 PM ET",
                "dayKey": "2026-11-26",
                "title": "Spring UI transitions & screen-flash juice",
                "major": false,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added spring-eased modal entrances, tactile hover and press animations, staggered card deal kinetics, countdown pop curves, and a screen-shake/flash Juice controller (respecting Reduced Motion)."
                        }
                ]
        },
        {
                "id": 142,
                "hash": "v2.5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:08 PM ET",
                "dayKey": "2026-11-26",
                "title": "Multiplayer tactical score, ping & match stingers",
                "major": false,
                "tags": [
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Wired high-energy tactical background music during matches, tactical ping chimes and scaled kill camera shake on eliminations, and victory/defeat stingers on match completion."
                        }
                ]
        },
        {
                "id": 143,
                "hash": "v2.5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:08 PM ET",
                "dayKey": "2026-11-26",
                "title": "Zombies horror stingers, gore impacts & boss flashes",
                "major": false,
                "tags": [
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added crimson flashes and heavy screen shake on Boss rounds, horror laugh stingers on every fifth round, and randomized gore impact SFX with kinetic shake on headshots, melee kills, and boss kills."
                        }
                ]
        },
        {
                "id": 144,
                "hash": "v2.5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:08 PM ET",
                "dayKey": "2026-11-26",
                "title": "Tower Defense deployable range rings, bounce & siege music",
                "major": false,
                "tags": [
                        "td"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added sweeping orchestral siege music, wave-start horns with camera shake, glowing tactical range rings and elastic spawn-bounce animations on deployables, plus placement and income chimes."
                        }
                ]
        },
        {
                "id": 145,
                "hash": "v2.5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:08 PM ET",
                "dayKey": "2026-11-26",
                "title": "Open World RPG dynamic combat music, wind & dialogue polish",
                "major": false,
                "tags": [
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added ambient wind across the Meridian Expanse with smooth music crossfading between calm exploration and active combat, staggered dialogue choice animations with book-open cues, level-up/quest fanfares, and vendor/stash trade audio."
                        }
                ]
        },
        {
                "id": 146,
                "hash": "v2.5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:08 PM ET",
                "dayKey": "2026-11-26",
                "title": "Minigames victory stingers, hit shake & hover SFX",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added pop-eased countdown animations, bullseye and headshot micro-shake, victory stingers on multi-star finishes, and tactile hover chimes across results menus."
                        }
                ]
        },
        {
                "id": 147,
                "hash": "v2.5",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:08 PM ET",
                "dayKey": "2026-11-26",
                "title": "Rogue Lite card deal fanfare, boss score & screen flash",
                "major": false,
                "tags": [
                        "rogue"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added staggered card-deal animations and card fan/draw SFX on Boon selection, smooth crossfading into high-intensity Boss floor music, and dramatic boss intro screams with crimson flashes and camera shake."
                        }
                ]
        },
        {
                "id": 148,
                "hash": "v2.6",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:22 PM ET",
                "dayKey": "2026-11-26",
                "title": "Real Weapon, Wonder Weapon & Melee SFX Across Full Arsenal",
                "major": false,
                "tags": [
                        "engine",
                        "zombies",
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added cleaned single-shot gunshot SFX for all 134 Create-a-Class and Classic firearms, short punchy sci-fi and explosive audio for all 22 Wonder Weapons and launchers, and dedicated melee/ballistic weapon SFX routed through the combat compressor."
                        }
                ]
        },
        {
                "id": 149,
                "hash": "v2.7",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:45 PM ET",
                "dayKey": "2026-11-26",
                "title": "Barrett M82 .50 Cal 3D Model & Skinned GLB Pipeline",
                "major": true,
                "tags": [
                        "engine",
                        "zombies",
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Replaced the procedural Barrett .50cal with a detailed PBR 3D Barrett M82 GLB model complete with NightForce optic, bipod, and heavy muzzle brake. Upgraded AssetLoader with SkinnedMesh-safe skeleton rebinding and accurate skinned bounding-box framing so rigged weapon models render cleanly in Create a Class, the Main Menu showcase, and in-game first-person viewmodels."
                        }
                ]
        },
        {
                "id": 150,
                "hash": "v2.7",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:50 PM ET",
                "dayKey": "2026-11-26",
                "title": "CheyTac M200 Intervention & Beretta M9 3D Weapon Models",
                "major": true,
                "tags": [
                        "engine",
                        "zombies",
                        "mp"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added custom 3D GLB weapon models for the CheyTac M200 Intervention (MW2) sniper rifle and the Beretta M9 sidearm, fully normalized for first-person combat, Create-a-Class inspection, and camo / Pack-a-Punch finishes. Updated the M9 display name to Beretta M9 so it is easier to find when searching in Create a Class."
                        }
                ]
        },
        {
                "id": 151,
                "hash": "v2.7",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "10:58 PM ET",
                "dayKey": "2026-11-26",
                "title": "Removed Post-Kill Camera Screenshake",
                "major": false,
                "tags": [
                        "engine",
                        "mp",
                        "zombies",
                        "td"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Removed the camera screenshake impulse triggered after kills and headshot kills in Juice.js for steadier target tracking and cleaner follow-up shots across all combat modes, while keeping hitmarkers and kill-confirm spark bursts intact."
                        }
                ]
        },
        {
                "id": 152,
                "hash": "v2.7",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "11:08 PM ET",
                "dayKey": "2026-11-26",
                "title": "Intervention MW2 Two-Tone Paint, UV Camo Support & Beretta M9 ADS Fix",
                "major": false,
                "tags": [
                        "engine",
                        "mp",
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Restored color and PBR material detail to the 3D CheyTac M200 Intervention with a two-tone MW2 tactical tan-slate chassis, matte black scope, barrel, bipod, grip, and magazine, plus automatic box-projected UVs so every Create-a-Class camo and Pack-a-Punch texture wraps cleanly. Also aligned the Beretta M9 ADS sight height and eye relief so you aim straight through the rear iron-sight notch."
                        }
                ]
        },
        {
                "id": 153,
                "hash": "v2.7",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "11:15 PM ET",
                "dayKey": "2026-11-26",
                "title": "Intervention World-Space Tan/Black Paint & Beretta M9 Grip/Tritium Sights",
                "major": false,
                "tags": [
                        "engine",
                        "mp",
                        "zombies"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Fixed the CheyTac M200 Intervention vertex painting and UV projection to use world-space coordinates instead of raw Blender mesh coordinates, delivering crisp MW2 Desert Tan / FDE and matte black two-tone colors with zero grid artifacts. Seated the Beretta M9 properly into the operator's hands right below the slide/beavertail and added glowing 3-dot green tritium iron sights aligned for clean ADS."
                        }
                ]
        },
        {
                "id": 154,
                "hash": "v2.8",
                "date": "Nov 26, 2026",
                "fullDate": "November 26, 2026",
                "time": "11:22 PM ET",
                "dayKey": "2026-11-26",
                "title": "Redesigned Tactical First-Person Hands, 3D Monsters & Arena Props",
                "major": true,
                "tags": [
                        "engine",
                        "mp",
                        "zombies",
                        "owrpg",
                        "rogue"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Rebuilt first-person operator hands and forearms with tapered sleeves, matte black tactical combat gloves, properly aligned wrist cuffs, a slim low-profile watch, and a clean two-handed thumbs-forward pistol ADS grip. Integrated sculpted 3D GLB dungeon monsters (Imp & Puglin) for fiend, spitter, stalker, and brute archetypes across Zombies, Open World RPG, Rogue Lite, and Tower Defense, added Mini Arena 3D weapon racks, banners, statues, columns, and trophies across Multiplayer and Open World RPG, and restored the missing industrial building colormap texture."
                        }
                ]
        },
        {
                "id": 155,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:15 AM ET",
                "dayKey": "2026-11-27",
                "title": "Open World RPG: Meridian Overhaul — Gun RPG Stats, Elements, Armor Sets, Durability & Mounts",
                "major": true,
                "tags": [
                        "owrpg",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Massive expansion to Operation Meridian: added dedicated RPG-only weapon stats for every firearm in the game (damage multipliers, crit chance/mult, armor penetration, passive traits, and 5 elemental damage types — Kinetic, Burn, Chill, Shock, Venom, Void) without altering standard shooter modes. Added 27 unlockable named weapons, multi-slot armor pieces (Helmets, Rigs, Boots, Relics) forming 4 set-bonus armor sets, equipment durability with field repair kits and a Pip-Pad Repair Workbench, 10 durable field tools [G], 4 unlockable Ultimate abilities [U], 4 summonable mounts [T] (Scout Bike, Hoverbike, Armored ATV, War Strider), 8 dynamic world events, a regional bounty board, a claimable Codex, new quests, and full Pip-Pad & HUD integration."
                        }
                ]
        },
        {
                "id": 156,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:18 AM ET",
                "dayKey": "2026-11-27",
                "title": "Rogue Lite: Isaac-Style Relics, Orbitals, Charged Actives, Pills, Tarot Cards & Transformations",
                "major": true,
                "tags": [
                        "rogue",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Expanded Rogue Lite delves with 40 passive tear/shot-modifying artifacts (multishot, homing, wall-bouncing, Brimstone blood beams, chain lightning, explosive shots, split shots), 3D orbiting/following familiars, 13 room-charged active items [G], 10 seeded Mystery Pills and 12 Tarot Cards [T], placeable bombs [B], Tinted Rocks, Golden Reliquaries, Treasure/Shop/Devil/Angel pedestals, and 5 three-piece character transformations."
                        }
                ]
        },
        {
                "id": 157,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:20 AM ET",
                "dayKey": "2026-11-27",
                "title": "Minigames Hub: 3-2-1 Countdown Toggle & Sandbox Mode Launcher",
                "major": false,
                "tags": [
                        "minigames",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added a persistent '3-2-1 COUNTDOWN: ON / OFF' toggle button in the Minigames Hub so players can skip the opening countdown and deploy instantaneously, alongside direct Sandbox launcher support for practice courses."
                        }
                ]
        },
        {
                "id": 158,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:22 AM ET",
                "dayKey": "2026-11-27",
                "title": "360 Trickshot: 5 Arena Maps (Separate High Scores) & Full Sandbox Editor",
                "major": true,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Expanded 360 Trickshot into 5 distinct arenas (Skyhigh Neon Stadium, Scrapyard Launchpad, Obsidian Spire, Volcanic Foundry, Orbital Ring) each tracking its own separate personal bests. Added a full no-timer Trickshot Sandbox mode where players can reset position/dummies, toggle/customize enemy movement & patterns, relocate dummies, edit the 0.5s mid-air shot timer, toggle the 360-degree spin requirement, and practice freely with high scores disabled."
                        }
                ]
        },
        {
                "id": 159,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:24 AM ET",
                "dayKey": "2026-11-27",
                "title": "Master Zombie: Fort Wall Line-of-Sight Fix, Patrol/Jump AI & Upgraded Player Evolution",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Fixed a major issue in Master Zombie where human fort defenders could shoot through solid fortification walls; defenders now obey strict line-of-sight checks, continuously patrol the ramparts, and jump once every 20 seconds. Upgraded first-person evolved Zombie claws/arms, necrotic bolt & acid volley visuals, and fortress courtyard environmental detail."
                        }
                ]
        },
        {
                "id": 160,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:26 AM ET",
                "dayKey": "2026-11-27",
                "title": "Final Fantasy RPG: Clear Quest Compass, Objective Tracker & Visual Overhaul",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added a clear step-by-step Quest Objective Tracker, bearing compass arrow, and live overworld minimap markers pointing directly toward shrines, crystal objectives, and boss encounters in Final Fantasy RPG, plus upgraded spell effects and battlefield animations."
                        }
                ]
        },
        {
                "id": 161,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:28 AM ET",
                "dayKey": "2026-11-27",
                "title": "Bunker Inspection: 2.8x Magnifying Glass Tool, Micro-Symptoms & Layered Survivor Overhaul",
                "major": true,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Equipped Bunker Inspection officers with a bespoke secondary Optical Magnifying Glass [2] featuring a custom brass/glass 3D viewmodel and 2.8x optical zoom [RMB] lens reticle. Added 6 subtle hard-to-notice infection tells (micro-dilated iris ring, jawline spider-veins, cyanotic fingertips, fever sweat, nostril micro-bleed, and forged CLR:X-00 pass serials) alongside upgraded layered coats, accessories, and idle animations for survivors."
                        }
                ]
        },
        {
                "id": 162,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:30 AM ET",
                "dayKey": "2026-11-27",
                "title": "Midnight Toyshop Prop Hunt: 5-Kill Rainbow Disco Party Mode, Club Music & Toy Train",
                "major": true,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Upgraded Midnight Toyshop Prop Hunt with a live miniature Toy Train circling the carousel, interactive Jack-in-the-Box surprises, a mimic proximity radar, and the new 5-Kill Rainbow Disco Party Mode: busting your 5th mimic dims shop lighting, drops a spinning mirror disco ball with 8 sweeping rainbow spotlight cones and confetti, triggers 2x Party Fever scoring, makes mimics groove to the beat, and crossfades into happy club party music."
                        }
                ]
        },
        {
                "id": 163,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:32 AM ET",
                "dayKey": "2026-11-27",
                "title": "Kaiju vs. Mecha Metropolis: Launch Crash Fix, Plasma Meteor & Power Substation Overhaul",
                "major": true,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Fixed the asset-helper crash preventing Kaiju vs. Mecha Metropolis from starting. Upgraded 1st-person articulated Obsidian Kaiju claws with plasma-reactive dorsal spines, layered dual-core Atomic Plasma Breath, added a hurled Plasma Meteor ability [E] and 3 destructible Power-Grid Substations (+100 HP & instant Overdrive), and enhanced skyscraper demolition and the Mecha-Titan Mk-IX showdown."
                        }
                ]
        },
        {
                "id": 164,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:34 AM ET",
                "dayKey": "2026-11-27",
                "title": "Orbital Breach (Zero Gravity): Clear EVA Mission Loop & Zero-G Visual Overhaul",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Rebuilt Orbital Breach with unmistakable step-by-step zero-gravity EVA mission objectives (sabotage solar arrays, seal hull breaches, push toward the command core), visual thruster/tether guidance rings, smoother 6-DOF microgravity drift controls, and upgraded orbiting space-station modules."
                        }
                ]
        },
        {
                "id": 165,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:36 AM ET",
                "dayKey": "2026-11-27",
                "title": "Abyssal Mech Trench: Bioluminescent Ocean Floor & Deep-Sea Combat Overhaul",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Overhauled Abyssal Mech Trench with glowing hydrothermal vents, rising bubble columns, drifting bioluminescent jellyfish, upgraded mech cockpit floodlights, sharper sonar pulse feedback, and tuned deep-sea Leviathan encounters."
                        }
                ]
        },
        {
                "id": 166,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:38 AM ET",
                "dayKey": "2026-11-27",
                "title": "Jurassic Dino Safari: Lush Paddock Overhaul, Upgraded Raptors & T-Rex Stampede",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Upgraded Jurassic Dino Safari with denser electrified perimeter paddocks, misty amber floodlights, articulated multi-joint Raptor & Triceratops meshes, smoother dart-stun & stampede pacing, and an intensified Apex T-Rex finale."
                        }
                ]
        },
        {
                "id": 167,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:40 AM ET",
                "dayKey": "2026-11-27",
                "title": "Cyberpunk Hoverbike Highway: Neon Arches, Boost Gates, Jump Ramps & EMP Overhaul",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Enhanced Cyberpunk Hoverbike Neon Highway with overhead streaming neon arches, plasma underglow trails, green Boost Gates (cooldown reset + hull repair), Neon Jump Ramps for vaulting Red Laser Barriers, EMP Shockwaves [F], [RMB] Thermal Katana support, and upgraded Valkyrie Gunship action."
                        }
                ]
        },
        {
                "id": 168,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:42 AM ET",
                "dayKey": "2026-11-27",
                "title": "Pinball Wizard 3D: Fixed M-A-G-I-C Targets, Manual Plunger, Player Flippers [Q/E] & Clear Goals",
                "major": true,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Fixed the M-A-G-I-C drop targets destroying on the first shot so all five letters light cleanly and guide arrows lead straight to Multiball Jackpot Fever (2x score + Golden Bonus Balls). Removed the instant auto-fling trap so players start safely in the plunger lane and fire a Skill Shot with [SPACE], added manual Left/Right Flippers [Q/E], Orbit Spinners, Table Nudge [F], and an unmistakable 3-step objective HUD."
                        }
                ]
        },
        {
                "id": 169,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:44 AM ET",
                "dayKey": "2026-11-27",
                "title": "Heli Gunner: Fixed Sunken Buildings & Gunship Orbit Overhaul",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Fixed all sunken cityscape buildings in Heli Gunner so structures sit flush on terrain, upgraded rooftop & convoy target visibility, and enhanced chopper gunship optics, tracers, and explosive chain feedback."
                        }
                ]
        },
        {
                "id": 170,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:46 AM ET",
                "dayKey": "2026-11-27",
                "title": "Mansion Raid: Fixed Invisible Bandits, Unblocked Doorways & Tactical Raid Overhaul",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Fixed invisible/occluded bandits shooting the player and cleared doorway collision geometry across Mansion Raid rooms. Added directional incoming damage arcs, tactical flashbang breaches, richer mansion interior dressings, and crisp scenario telegraphs."
                        }
                ]
        },
        {
                "id": 171,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:48 AM ET",
                "dayKey": "2026-11-27",
                "title": "Sweetheart Shore: AAA-Grade Character Fidelity, Gerstner Ocean & Fever Overhaul",
                "major": true,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Significantly upgraded character anatomy, expressive facial features, stylized swimwear, hair physics, and dynamic beach animations in BeachAnatomy and BeachArt alongside rolling Gerstner ocean waves, sunburst lighting, and Fever Mode shockwave combos."
                        }
                ]
        },
        {
                "id": 172,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:50 AM ET",
                "dayKey": "2026-11-27",
                "title": "Speed Runs Overhaul: Upgraded All 8 Timed Courses",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Delivered a full visual, animation, and gameplay polish pass across Gauntlet Sprint, Outpost Rescue, Getaway Chase, The Splitter, Sky Snipers, Last 50, Freefall, and Ninja Stealth with richer scenery props, kinetic speed trails, and tighter checkpoint & hazard responsiveness."
                        }
                ]
        },
        {
                "id": 173,
                "hash": "v3.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "12:52 AM ET",
                "dayKey": "2026-11-27",
                "title": "Three-Headed Dragon: Complete Boss Redesign — Tri-Head Hydra Necks, Breath & Arena",
                "major": true,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Heavily redesigned the Three-Headed Dragon encounter with distinct sculpted Ignis (Fire), Glacius (Frost), and Voltaris (Lightning) dragon heads atop articulated snaking necks, armored obsidian torso & beating bat-wings, elemental breath beams, destructible weakpoint crests, and an atmospheric volcanic citadel speed-run arena."
                        }
                ]
        },
        {
                "id": 174,
                "hash": "v3.1",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "2:18 AM ET",
                "dayKey": "2026-11-27",
                "title": "Operation Meridian Doubles in Size: 12 Regions, 12 Dungeons & a Real Grind",
                "major": true,
                "tags": [
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I finished and shipped the Open World RPG expansion that was left half-done: the Meridian Expanse is now 1280 × 1280 m (twice as wide), split into twelve regions from Haven Basin and the Whispering Pinewoods out to the Frostfang Peaks and the Obsidian Dragonwilds, with twelve dungeons, 70 enemy archetypes and 31 authored quests."
                        },
                        {
                                "type": "p",
                                "text": "Every new operative starts at level 1 and the XP curve is deliberately steep (600 XP for level 2, almost 40,000 for level 11, 800,000 for the last level), so you grind the way you would in RuneScape or WoW. Enemies now respawn ten minutes after they die, the moment you leave an area, and whenever you quit and reload, bosses included."
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Six level-by-doing Mastery skills (Arms, Slayer, Dungeoneering, Foraging, Artisan Mining, Runecraft) up to level 99",
                                        "Eight Skyrim-style Standing Stones and ore, herb, timber and rune nodes that regrow every ten minutes",
                                        "18 regional world events with hold, wave and hunt objectives",
                                        "Compass toggle and a Dev Tools button in the pause menu, plus a v3 save migration that keeps old characters"
                                ]
                        }
                ]
        },
        {
                "id": 175,
                "hash": "v3.1",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "2:31 AM ET",
                "dayKey": "2026-11-27",
                "title": "Cartography: Fog-of-War Minimap, Hill-Shaded World Map & the Atlas",
                "major": true,
                "tags": [
                        "owrpg",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I added a full mapping system. A rotating minimap now sits in the top-left corner and shows hill-shaded terrain, roads, settlements, hostile sites, dungeons, transit pylons, your tracked quest markers (with an arrow on the rim when they are out of range), world events, pins, enemies that are hunting you and nearby friendly NPCs. Press N to cycle its range between 95, 150 and 230 m, or switch it to north-up."
                        },
                        {
                                "type": "p",
                                "text": "The land starts under fog of war and clears as you walk it. The world map draws a new contoured, hill-shaded base layer under that fog with the charted percentage of every region, and the new Atlas tab tracks overall completion, your cartographer rank and per-region progress. Every 10% of the map you chart pays out XP, and a new Pathfinding mastery skill grows with every cell. I also fixed the map's player arrow, which had been pointing backwards."
                        }
                ]
        },
        {
                "id": 176,
                "hash": "v3.1",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "2:44 AM ET",
                "dayKey": "2026-11-27",
                "title": "156 Hidden Sites: Caches, Lore Tomes, Shrines, Skill Shards, Vistas, Stashes & Altars",
                "major": true,
                "tags": [
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "There is now something to find around every hill. 156 hidden sites are scattered across the twelve regions, built with props from the asset library and each with its own sound: 48 treasure caches, 24 lore tomes, 12 wayside shrines, 24 skill shards, 12 survey vistas, 24 hidden stashes and 12 Altars of Trials."
                        },
                        {
                                "type": "p",
                                "text": "Lore tomes open a reader with 24 new entries about what broke the Meridian. Shrines grant one of eight five-minute blessings and can be used again every ten minutes. Skill shards pour Mastery XP into a craft, vistas chart a huge area of the map at once, and stashes have good odds of rare gear. Altars summon a Champion of the region with two of its retinue; win the trial to claim its reward."
                        }
                ]
        },
        {
                "id": 177,
                "hash": "v3.1",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "2:52 AM ET",
                "dayKey": "2026-11-27",
                "title": "Champions: 12 Affixes, Auras and Champion-Led World Events",
                "major": false,
                "tags": [
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Any hostile spawn can now roll as a Champion: bigger, tougher, wrapped in a coloured aura and carrying one to three affixes. With 70 base enemies that turns the roster into hundreds of distinct fights. Champions show their affixes on their health bar, drop Champion's Sigils and better loot, and count toward a new questline."
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Affixes: Vampiric, Molten, Frozen, Shielded, Swift, Berserker, Thorned, Juggernaut, Arcane, Summoner, Regenerating and Warlord",
                                        "Molten and Frozen Champions erupt when they die; Frozen hits slow you; Summoners call reinforcements at 60% and 30% health",
                                        "Three new world events (21 total): Champion Incursion, Relic Storm and the two-wave Champion Warband"
                                ]
                        }
                ]
        },
        {
                "id": 178,
                "hash": "v3.1",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "3:00 AM ET",
                "dayKey": "2026-11-27",
                "title": "Quest Tracker, Nine Exploration Quests and Two New Perk Trees",
                "major": false,
                "tags": [
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "You can now track up to three quests at once. They stack on the HUD with live distances, appear as bearings on the compass and as markers on the minimap, and the quest log is grouped into Main Story, Faction, Side, Contracts, Dungeon Delves and Exploration."
                        },
                        {
                                "type": "p",
                                "text": "Nine new self-starting exploration quests (40 in total) begin the first time you chart land, open a cache, read a tome, pray at a shrine, sync a vista, absorb a shard, search a stash, win a trial or kill a Champion. Two new perk trees bring the total to nine trees and 108 perks: Pathfinder (reveal radius, discovery XP, shrine duration, treasure luck) and Huntsman (Champion damage and resistance, bonus Champion loot, execute and elemental rounds)."
                        }
                ]
        },
        {
                "id": 179,
                "hash": "v3.1",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "3:04 AM ET",
                "dayKey": "2026-11-27",
                "title": "Navigation Options When You Create a Character, More Dev Tools",
                "major": false,
                "tags": [
                        "owrpg",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "The character creator now lets you start with the compass and the minimap switched on or off, and you can change either one later from the pause menu or from the Pip-Pad's System tab. The developer menu (pause menu button or F8) gained buttons to reveal the whole map, teleport to the nearest hidden site, spawn a three-affix Champion, add five levels to every Mastery skill, grant a shrine blessing and fully heal."
                        },
                        {
                                "type": "p",
                                "text": "The HUD vitals line in the Open World RPG no longer shows armour plates and tactical charges, which that mode never used; it now shows your med-injectors and your armour rating."
                        }
                ]
        },
        {
                "id": 180,
                "hash": "v3.1",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "3:08 AM ET",
                "dayKey": "2026-11-27",
                "title": "Performance: Merged-Mesh LOD, Fog-Aware Culling and Lighter Assets",
                "major": false,
                "tags": [
                        "engine",
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Freestead was drawing about 1,760 objects per frame because every soldier model is built from roughly 135 parts. NPCs and enemies now swap to a single merged mesh per material when they are more than a few metres away, which brings the town down to under 400 draw calls. Terrain chunks and static buildings that sit completely inside the fog are no longer drawn, and the culling updates immediately after fast travel."
                        },
                        {
                                "type": "p",
                                "text": "I also committed the 259 staged assets the game was already asking for or now uses (models, textures, voice lines and kit colour maps; the live site was getting 404s for some of them), compressed the large textures from 64 MB to 19 MB without lowering their resolution, added the missing kit colour maps, and repaired the Mode Guide. The Open World RPG QA suite now runs 143 checks and passes all of them, and a new whole-game QA runner boots every mode and all 63 minigames with zero errors. It caught two real bugs that are now fixed: Rogue Lite crashed if you started it before picking a class, and Thorned Champions could reflect enough overkill damage to kill you outright."
                        }
                ]
        },
        {
                "id": 181,
                "hash": "v3.1",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "3:12 AM ET",
                "dayKey": "2026-11-27",
                "title": "Minigames: Asset Pass Shipped, Plus Sampled Impacts and an Announcer for All 63 Games",
                "major": true,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "I shipped the minigame asset overhaul that was waiting in the working copy: 3D props, skyboxes, PBR textures, music and sound effects from the asset library across the Fun & Specials modes, the Target & Action courses, the Speed Runs, the Arcade Hall, Whack-a-Mole and Boss Rush, including the Grand Citadel Colosseum and its Gladiator Blessing Shrines."
                        },
                        {
                                "type": "p",
                                "text": "On top of that, a new shared feel layer upgrades every one of the 63 minigames at once. Targets now make a recorded impact that matches what they are made of: steel plates ring, glass shatters, wood thunks, clay and balloons pop, and bullseyes toll a bell. An announcer calls out 10, 25 and 50-hit combos, a combo breaker, \"hurry up\" in the last ten seconds of a timed course and \"time over\" at the buzzer, announces every Boss Rush round and the final round, and calls a flawless victory on a perfect-accuracy platinum run."
                        }
                ]
        },
        {
                "id": 182,
                "hash": "v3.1",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "3:15 AM ET",
                "dayKey": "2026-11-27",
                "title": "Daily Featured Challenges, Streaks and Arcade Rank",
                "major": false,
                "tags": [
                        "minigames"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "The minigame hub now features three courses every day, one from Target & Action, one from Speed Runs or the Arcade Hall and a platinum challenge, each with a star goal and bonus XP. Every player gets the same three on the same day. Clear all three to start a streak that adds 10% bonus XP per day, up to double. Your total stars across all 63 games also give you an Arcade Rank, from Rookie to Arcade Legend, shown under your star total with how many stars the next rank needs."
                        }
                ]
        },
        {
                "id": 183,
                "hash": "v3.2",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "04:45 AM ET",
                "dayKey": "2026-11-27",
                "title": "Cosmetic Polish Pass: Unified AAA Theme, 3D Hitboxes, Animations & Audio",
                "major": true,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Completed a full cosmetic, animation, hitbox, sound, and accessibility polish pass across all front-end screens, modes, and the minigames hub:"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Visual Consistency & AAA Tokens: Consolidated all palette, typography, spacing, radius, and z-index tokens into a single :root, removed redundant CSS overrides, restored the Main Menu PLAY WITH FRIENDS Invite label & full tag text, unblocked invisible Minigames titles, fixed 720p Lobby Deploy button overlap, and enabled --ui-scale corner HUD scaling.",
                                        "Hitboxes & Wireframe Debugger: Added ?debug=hitboxes and a Dev Panel wireframe toggle (head/torso/limb/shield color coding), tagged outer Soldier helmets and Riot Shield viewports, stopped bullet penetration through shields and dead entities, added full-slot hotbar drag-and-drop snap-back, and removed noisy hover prompt side effects.",
                                        "Animations & Feel: Added UIPolish modal focus traps, sliding tab highlights, smooth tooltip hover delays, keyed killfeed transitions, stacked HUD toasts, distinct headshot/kill hitmarkers, points tickers, smoothstep viewmodel ADS/swap blends, empty-mag bolt lock, zone-specific enemy hit reactions, and surface-colored bullet impacts.",
                                        "Audio & Accessibility: Added a dedicated uiGain mixer bus, wired UI/Hitmarker/Zombie volume sliders and tab-hidden muting, added Web Audio procedural synth fallbacks across every SFX cue, tuned crouch and floor-surface footsteps, added delegated throttled UI hover/click/back/toggle/slider audio, and enabled full arrow-key tablist navigation with Reduced Motion support."
                                ]
                        }
                ]
        },
        {
                "id": 184,
                "hash": "v3.3",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "06:00 AM ET",
                "dayKey": "2026-11-27",
                "title": "Core Feel, Performance & Stability Pass: Bundler, Gamepad, Netcode & Atomic Saves",
                "major": true,
                "tags": [
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Completed a comprehensive core performance, game feel, networking, persistence, and automated regression pass across all BLACKOUT OPS modes:"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Performance & Lazy Bundler: Added Graphics Quality Presets (Low/Medium/High/Ultra with first-launch detection), live FPS / frame-time p95 / draw-call PerfOverlay, SpatialHash marker grids and 10 Hz subsystem throttling in Survival, shadow-caster budget culling, zero-alloc hot-path vectors, SceneCleanup teardown, and a dev-only mode bundler (tools/bundle.py + BundleLoader) trimming initial load to 2 bundles.",
                                        "Game Feel & Gamepad: Added full W3C Gamepad support (deadzones, quadratic look, opt-in ADS slowdown), tightened MP spawn-trap avoidance and Zombies barricade unsticking, fixed Survival woodDoor physical colliders, and hid unused Plate/Gear HUD widgets in Open World RPG.",
                                        "Netcode & Atomic Saves: Added inbound packet validation, per-peer rate limiting, 80 ms JitterBuffer smoothing, DeltaCodec, 10 s signaling timeout, exponential-backoff reconnects, SaveSystem migrations with atomic _tmp writes + 3 rotating backups + auto corruption recovery, and Settings > Save .JSON export/import."
                                ]
                        }
                ]
        },
        {
                "id": 185,
                "hash": "v1.0.0",
                "date": "Nov 27, 2026",
                "fullDate": "November 27, 2026",
                "time": "06:25 AM ET",
                "dayKey": "2026-11-27",
                "title": "1.0 Complete Release: Operation Blackout, OWRPG Acts II–VI, Unified Profile & Co-op Expansion",
                "major": true,
                "tags": [
                        "merge",
                        "owrpg",
                        "rogue",
                        "survival",
                        "zombies",
                        "td",
                        "mp",
                        "minigames",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Completed the full 1.0 release pass uniting all seven modes under one shared Operative Profile alongside the Meridian Flagship 2 systems (Cartography, 156 hidden sites, Champions, MeshProxy LOD, MinigameFeel, and MinigameDaily):"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Open World RPG Acts II–VI, Companions & New Game+: Authored 10 multi-path main & side quests across Rust Sprawl, Mire Delta, Ash Quarry, Alpine Array, Meridian Core, and Dragonwilds (combat, tech/stealth, and social paths with deterministic checks and territory shifts), plus 3 recruitable squad Companions (Vanguard Soren, Ghost Kael, Tinker Torque), NPC day/night routines, and New Game+.",
                                        "Mode Depth 1.0: Added Zombies power-on clarity, per-map leaderboards, and co-op roles; Tower Defense active turret/defender synergies and wave previews; Multiplayer post-match 3-map voting and rule presets; Survival dawn/dusk phase alerts; Rogue Lite Floor-5 synergy banners and instructive run-end debriefs; and Minigames Daily Seeded Challenge plus Personal-Best Ghost deltas.",
                                        "Unified Profile & 165-Weapon Armory: Migrated saves cleanly to v3 with shared Account Levels (1–100), Calling Cards, Emblems, Titles, Offline Seeded Daily (3) & Weekly (5) Challenges, Unified Weapon Armory modal, Main Menu Continue Banner, per-mode progress tags, and first-launch Range Day warmup.",
                                        "Online Co-op & Operation Blackout Capstone: Documented ADR-021 and added Rogue Lite 2–4p delve sync + Minigames Same-Room Versus leaderboards alongside Operation Blackout, a 10-mission story campaign spanning all 7 game modes."
                                ]
                        }
                ]
        },

        {
                "id": 186,
                "hash": "d89524b",
                "date": "Nov 28, 2026",
                "fullDate": "November 28, 2026",
                "time": "05:05 AM ET",
                "dayKey": "2026-11-28",
                "title": "Enemy Hitboxes Rebuilt: If You See It, You Can Hit It",
                "major": true,
                "tags": [
                        "mp",
                        "zombies",
                        "owrpg",
                        "rogue",
                        "td",
                        "engine"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Every enemy in Multiplayer, Zombies, Rogue Lite, Tower Defense and the Open World now takes hits exactly where its model is drawn:"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Helmets, hands, boots, hips, plate carriers and pouches are hit surfaces. Before, shots on a helmet's crown, a hand or a boot passed straight through.",
                                        "Zones follow the body: anything on the head (including the helmet) is a headshot, arms and legs are limb hits, everything else is torso.",
                                        "Hidden parts no longer catch bullets, and held weapons, magic auras, orbiting crystals and ground shadows never block or absorb a shot.",
                                        "Monster models (Imp, Puglin, skeletons, orcs, vampires, ghosts, archers, templars) are hit on their own mesh. Before, an invisible old zombie body underneath took the hits, so shooting a Puglin's head or an Imp's arm often did nothing.",
                                        "Combat skips the precise test for enemies a shot can't reach, so the larger hit surfaces cost nothing."
                                ]
                        }
                ]
        },
        {
                "id": 187,
                "hash": "d89524b",
                "date": "Nov 28, 2026",
                "fullDate": "November 28, 2026",
                "time": "05:10 AM ET",
                "dayKey": "2026-11-28",
                "title": "Sculpted Monsters Come Alive: Imp & Puglin Animation",
                "major": false,
                "tags": [
                        "zombies",
                        "rogue",
                        "td",
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Sprinters, spitters, fiends, bloaters, goliaths, berserkers and golems wearing the Imp and Puglin models no longer slide around in a T-pose:"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Relaxed stance with arms down, then walk and run cycles with knee bend, hip sway, arm swing and forward lean that scale with speed.",
                                        "Attacks: single-claw swipes alternate sides, brutes sometimes swing two-handed, spitters and casters thrust forward when they fire.",
                                        "Hit reactions depend on where you hit (head snaps back, limb hits twist the body), plus stun wobble, dance-bomb dancing and a limp death fall.",
                                        "Headshot kills remove the monster's head, big-head mode scales it, and Tower Defense gun zombies hold their rifle in the monster's hand."
                                ]
                        }
                ]
        },
        {
                "id": 188,
                "hash": "d89524b",
                "date": "Nov 28, 2026",
                "fullDate": "November 28, 2026",
                "time": "05:15 AM ET",
                "dayKey": "2026-11-28",
                "title": "Soldier Rig 2.0: Real Rifle Handling for Bots & Online Players",
                "major": false,
                "tags": [
                        "mp",
                        "owrpg",
                        "survival",
                        "td"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Soldiers used the zombie animation: arms out front, rifle pointing at the sky, and every shot flung both arms upward. Rebuilt from the joints up:"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Elbow, knee and ankle joints, with the weapon carried on the torso and both hands placed on the grip and handguard by inverse kinematics.",
                                        "Shouldered aim stays level whatever the body is doing; low ready when idle, port arms when sprinting, pistols two-handed, LMGs from the hip, knives in hand.",
                                        "Small recoil kick, reload with the support hand going to the magazine, flinch by hit zone, and pitch toward the target.",
                                        "Real crouch (online players no longer sink their torso into their legs), downed pose, and boots that stay on the ground.",
                                        "Killed bots drop their weapon instead of it floating with the body."
                                ]
                        }
                ]
        },
        {
                "id": 189,
                "hash": "d89524b",
                "date": "Nov 28, 2026",
                "fullDate": "November 28, 2026",
                "time": "05:20 AM ET",
                "dayKey": "2026-11-28",
                "title": "Open World Creatures: Clip Animation, Death Clips & Corpses",
                "major": false,
                "tags": [
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Kenney-kit enemies in the Open World now use the animations their models ship with. The asset loader had been dropping them from every copy:"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Idle, walk and sprint, with playback speed tied to movement so feet don't skate.",
                                        "Melee attacks play on the upper body while the legs keep moving; armed archers and templars aim and fire their weapons.",
                                        "Death clips for GLB creatures and bots, and procedural bandits and raiders now ragdoll into a corpse instead of vanishing.",
                                        "Monster bodies get the same translucent skin shading as the sculpted zombies."
                                ]
                        }
                ]
        },
        {
                "id": 190,
                "hash": "d89524b",
                "date": "Nov 28, 2026",
                "fullDate": "November 28, 2026",
                "time": "05:25 AM ET",
                "dayKey": "2026-11-28",
                "title": "Zombie Animation Fixes: Deaths, Dancing, Stuns & Gun Zombies",
                "major": false,
                "tags": [
                        "zombies",
                        "td",
                        "rogue"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Several zombie animations pointed at body parts that don't exist or used the wrong frame of reference:"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Deaths: knees buckle first, then the body topples along its own facing (it used to roll sideways depending on compass direction) with limp arms. Hounds roll onto their side.",
                                        "Dance-bomb victims now actually wave their arms, bounce and sway.",
                                        "Stunned zombies sway dazed instead of freezing mid-stride. Frozen still means frozen.",
                                        "Tower Defense gun zombies finally carry their gun, and it stays aimed where they face."
                                ]
                        }
                ]
        },
        {
                "id": 191,
                "hash": "3e29511",
                "date": "Nov 28, 2026",
                "fullDate": "November 28, 2026",
                "time": "05:40 AM ET",
                "dayKey": "2026-11-28",
                "title": "Graphics: Shadows Restored Everywhere, Stable Sun Shadows, Sharper Textures",
                "major": true,
                "tags": [
                        "engine",
                        "survival",
                        "owrpg",
                        "mp",
                        "zombies",
                        "td",
                        "rogue"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "A graphics pass across every mode, led by a fix for shadows that had quietly disappeared:"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Restored world shadows: the 1.0 performance budget let only 1–3 objects in the whole world cast a shadow. Trees, buildings, walls and props cast again, within a real per-preset budget (Medium 450, High 1,600, Ultra 4,000 objects, largest first). Raising the preset now brings shadows back mid-session.",
                                        "Stable sun shadows: small maps get a tight shadow frame; Survival and the Open World get one that follows you and leans toward where you look, so shadows exist wherever you go (Survival used to have none outside the middle of the map).",
                                        "Shadow edges are snapped to the shadow map grid, so they no longer crawl and shimmer as you walk or turn.",
                                        "Sharper textures at grazing angles: anisotropic filtering now follows the graphics preset (up to 16× on Ultra) instead of a fixed 4×."
                                ]
                        }
                ]
        },
        {
                "id": 192,
                "hash": "qa-suite",
                "date": "Nov 28, 2026",
                "fullDate": "November 28, 2026",
                "time": "05:50 AM ET",
                "dayKey": "2026-11-28",
                "title": "New QA Suite: Enemy Hitbox & Animation Audit",
                "major": false,
                "tags": [
                        "engine",
                        "mp",
                        "zombies",
                        "rogue",
                        "td",
                        "owrpg"
                ],
                "blocks": [
                        {
                                "type": "p",
                                "text": "Added _qa_hitboxes.html, 44 automated checks that prove the hitbox and animation work in every mode:"
                        },
                        {
                                "type": "ul",
                                "items": [
                                        "Fires a grid of rays at each enemy from the front and side and compares the visible body to the hitboxes: 0% miss and 0% ghost on soldiers, zombies and online avatars, and every one of the 70 zombie archetypes and the first six bosses within limits.",
                                        "Checks soldiers keep both hands on the weapon and the barrel on target when aiming, walking, crouched and firing, with boots on the ground.",
                                        "Checks rigged monsters are out of their T-pose, swing their legs and wind up attacks, and that their hitboxes ride the bones.",
                                        "Checks clip-driven creatures walk, attack and play death clips, bots leave corpses, gun zombies aim forward, and the combat broad-phase agrees with brute force on every test ray."
                                ]
                        }
                ]
        }
]
    };
})(window);
