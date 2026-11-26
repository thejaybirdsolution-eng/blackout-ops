/* ============================================================================
   BLACKOUT OPS — Official Update Log Data (79 Updates, Nov 22–25, 2026)
   ============================================================================ */
(function (global) {
    'use strict';
    const BO = global.BO = global.BO || {};

    BO.UpdateLogData = {
        project: 'Blackout Ops',
        repo: 'https://github.com/thejaybirdsolution-eng/blackout-ops',
        liveUrl: 'https://thejaybirdsolution-eng.github.io/blackout-ops/',
        period: 'Nov 22 – Nov 25, 2026 (ET)',
        totalCount: 84,
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
                "hash": "b3ach01",
                "date": "Nov 25, 2026",
                "fullDate": "November 25, 2026",
                "time": "8:05 PM ET",
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
        }
]
    };
})(window);
