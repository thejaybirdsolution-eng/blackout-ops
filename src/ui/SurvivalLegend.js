/* ============================================================================
   BLACKOUT OPS — Exclusion Zone Field Guide (Rebuilt for M1–M6)
   Searchable, categorised encyclopedia covering every rebuilt Survival system:
   The Lantern story (Acts 1–3), Senses & Stealth, Climate & Hazards, Snap
   Building & Horde Nights, Frontier Garrisons & Rail Handcar, The Warden
   Finale & Endings, The Archive (Zone Tiers 1–10, Seeds, Mastery, Kits,
   Stash, Blueprints, Chronicle), Positional Audio & Accessibility, plus
   live-generated tables for controls, items, tools, recipes, structures,
   regions, infected and modifiers.
============================================================================ */
(function (BO) {
    'use strict';

    const CATS = [
        ['start', 'Getting started', 'flare', 'The crash, Acts 1–3, the Lantern mystery, and how to survive day one.'],
        ['controls', 'Controls', 'fist', 'Every key and mouse action. Rebind any key from the pause menu.'],
        ['threat', 'Senses, hordes & events', 'fire', 'Sight/hearing/smell AI, noise ring, horde nights, PMC garrisons and weather.'],
        ['wild', 'Animals, hunting & cooking', 'bowl', 'Every animal, where it lives and what it drops; raw vs cooked food; campfires, fire camps and cooking stations; every meal.'],
        ['dungeons', 'Dungeons, bosses & arena', 'key', 'All nine dungeons and their puzzles, the twelve legendary bosses and what wakes them, and the Pit Master arena.'],
        ['quests', 'Quests', 'scroll', 'The quest log: chapters, how tracking works, every quest and its reward.'],
        ['thrill', 'Levels, loot & contracts', 'rune', 'Survivor levels and perk cards, weapon rarity and traits, champions, infested sites, contracts and caches.'],
        ['vitals', 'Vitals, injuries & climate', 'flask', 'Health, bleeding, fractures, hunger, water, cold, toxic ash and radiation.'],
        ['map', 'Zone regions', 'scroll', 'Every region of the 500 × 450 m Exclusion Zone: threat, climate and resources.'],
        ['building', 'Building & fortifications', 'build', 'Snap building, structural integrity, breaching, traps, turrets and power.'],
        ['crafting', 'Scavenging & crafting', 'wrench', 'Timed container searches, 4 ammo calibres, weapon condition, stations and recipes.'],
        ['items', 'Items & tools', 'chest', 'Every scavengeable item, consumable, component and gathering tool.'],
        ['bosses', 'Guardians & the Warden', 'rifle', 'Named region guardians, PMC garrisons, the 3-phase Warden fight and endings.'],
        ['archive', 'The Archive (meta)', 'rune', 'Zone Tiers 1–10, seeded worlds, Daily Expeditions, Mastery Tree, 8 Kits and Stash.'],
        ['enemies', 'Infected roster', 'blade', 'Every infected type. Hover a card for its full dossier and visual profile.'],
        ['travel', 'Travel & fast travel', 'gear', 'Climbable radio towers, rail handcar, trail bicycle, swimming and safehouses.'],
        ['rules', 'Modes, rules & a11y', 'tech', 'Operations, difficulties, modifiers, positional audio, subtitles and color-blind modes.'],
        ['help', 'Troubleshooting', 'unknown', 'Why you cannot build, craft, save, reload or enter the Crater — and how to fix it.']
    ];
    const CAT_LABEL = Object.fromEntries(CATS.map(([id, label]) => [id, label]));
    const STATION = { hand: 'By hand (anywhere)', bench: 'Workbench (safehouse or placed bench)', campfire: 'Campfire (or safehouse stove)', kiln: 'Stone kiln' };
    const STATION_SHORT = { hand: 'By hand', bench: 'Workbench', campfire: 'Campfire', kiln: 'Kiln' };

    const REGION_GUIDE = {
        crash: 'Threat 1 · Meadow. Your helicopter wreck and opening salvage. Stop the bleeding, search the fuselage, and move toward the ranger station.',
        relay: 'Threat 1 · Meadow. Haven\'s forward relay and starting safehouse. Workbench, stove, water pump, and the first climbable radio tower.',
        hollow: 'Threat 2 · Town. Abandoned hillside town packed with houses, medicine cabinets, and gun lockers. Watch for The Butcher of Hollow Town.',
        pine: 'Threat 2 · Forest. Dense western timberland with pine, resin, bitterleaf, and infected nests. Guarded by the Den Mother.',
        kessel: 'Threat 3 · Industrial. Rail yards and freight warehouses held by Sable Company PMC garrisons. Rich in 5.56/7.62 ammo, scrap, and the rail handcar.',
        spillway: 'Threat 3 · Wetland. Flooded reservoir and dam. Swim across channels, scavenge batteries and wire, and watch for the Spillway Bloat.',
        frost: 'Threat 4 · Alpine. High-altitude snow ridges and blizzards. Freezing temperatures require Insulated Thermals or fire. Guarded by Pale Maul.',
        cinder: 'Threat 4 · Ash. Scorched refinery with toxic ash air (bring respirator filters!), heavy fuel/powder stores, and the Cinder Regent.',
        campus: 'Threat 4 · Campus. Black Pine Research Campus. Requires a campus keycard from a named guardian or garrison. Holds the Project Lantern research data.',
        crater: 'Threat 5 · Crater. Heart of the Exclusion Zone. Extreme radiation, basalt monolith ring, the Lantern spire, and its guardian: The Warden.'
    };

    const VITALS = [
        ['Health & Death', 'plate', 'At 0 HP you wake up at your nearest safehouse or field bed 6 hours later. Everything you carried drops in a red recovery bag where you fell (except Iron Run, where death is permanent).',
            'Regenerates slowly while well-fed and hydrated with no bleeding.', ['Trauma kit (+55 HP, stops bleeding)', 'Herbal dressing (+27 HP, stops bleeding)', 'Quick-heal key (uses bandage/medkit)', 'Sleeping at a safehouse or bed']],
        ['Bleeding & Fractures', 'bandage', 'Heavy hits and infected claws can cause bleeding (2 HP/s) and attract nearby infected by smell (15 m). High falls cause a leg fracture that slows movement until splinted.',
            'Painkillers temporarily mask fracture limping and aim sway for 90 s.', ['Herbal dressing (stops bleeding)', 'Splint (cures fracture)', 'Antibiotic elixir (cures bleed & infection)', 'Painkillers (90 s relief)']],
        ['Food & Water', 'can', 'Hunger and hydration drain steadily over time. Hot regions (Cinder Refinery) accelerate thirst. Reaching 0 drains health every second.',
            'Canned food restores both hunger and a little water.', ['Canned food / Field ration', 'Hearty venison stew', 'Filtered water / Bitterleaf tea']],
        ['Climate & Cold', 'fire', 'Every region has a base temperature that drops with altitude, nightfall, snow and being wet. Below 2°C stamina drains; below -3°C you take hypothermia damage.',
            'Carry Insulated Thermals (+12°C) for Frostline Mountain, or stay near campfires.', ['Insulated thermals', 'Thermal spiced broth (+18°C)', 'Campfire / Kiln / Safehouse']],
        ['Toxic Ash & Radiation', 'mask', 'Cinder Refinery air and Ash Rain fill your lungs without a filter, causing loud coughing fits and damage. Radiation surges in the Research Campus, underground, Rad Fog, and the Crater.',
            'Geiger counter clicks speed up as radiation climbs. Above 75 rad you lose 2 HP/s.', ['Respirator filter (-82% rad & blocks ash)', 'Antibiotic elixir (-30 rad)', 'Bitterleaf tea (-19 rad)', 'Lantern Resonance mastery']],
        ['Composure & Noise', 'cup', 'Darkness drains composure; below 30 your aim sways. Meanwhile, sprinting, searching metal lockers, coughing and firing unsuppressed guns expand your HUD noise ring and draw infected.',
            'Crouching shrinks footstep noise to 2.5 m. Carrying a lit torch at night doubles infected sight range.', ['Hot meal / Field espresso', 'Crouch stealth', 'Suppressed firearms', 'Silent Footwork mastery']]
    ];

    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const norm = (v) => String(v ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

    function build() {
        const frontier = BO.SurvivalFrontierData;
        const rules = BO.SurvivalRules;
        const deep = BO.SurvivalDeepData || {};
        const meta = BO.SurvivalMeta || {};
        const info = BO.SurvivalItemInfo || {};
        const Ic = BO.SurvivalIcons;
        const kb = BO.Settings.getKeybinds();
        const key = (a) => BO.Settings.keyLabel(kb[a]);
        const name = (id) => frontier.items[id]?.[0] || frontier.tools[id]?.name || id;
        const amounts = (c) => Object.entries(typeof c === 'number' ? { scrap: c } : (c || {})).filter(([, n]) => n > 0).map(([id, n]) => n + ' ' + name(id)).join(', ');
        const out = [];
        const add = (e) => { out.push({ tags: [], facts: [], lists: [], ...e }); };
        const icon = (glyph, color) => Ic.named(glyph, color || '#9fe0c9', 26);

        /* ---------- Where everything comes from (computed from the live world and tables) ---------- */
        const Z = BO.Zone;
        const regionName = (id) => Z?.REGIONS.find((r) => r.id === id)?.name || id;
        const depositsByRegion = {};   // region -> kind -> count
        const kindRegions = {};        // kind -> region -> count
        for (const d of Z?.deposits || []) {
            const reg = d.region || Z.regionAt(d.x, d.z).id;
            ((depositsByRegion[reg] ||= {})[d.kind] = (depositsByRegion[reg][d.kind] || 0) + 1);
            ((kindRegions[d.kind] ||= {})[reg] = (kindRegions[d.kind][reg] || 0) + 1);
        }
        const containersByRegion = {};
        for (const c of Z?.containers || []) ((containersByRegion[c.region] ||= {})[c.type] = (containersByRegion[c.region][c.type] || 0) + 1);
        const topRegions = (obj, n = 3) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map(([r, c]) => regionName(r) + ' ×' + c).join(', ');
        const sources = {};
        const src = (id, line) => { (sources[id] ||= []).push(line); };
        for (const [kind, spec] of Object.entries(frontier.resources || {})) {
            const where = topRegions(kindRegions[kind]);
            for (const id of Object.keys(spec.gain || {})) {
                src(id, (spec.tool ? 'Break ' : 'Gather ') + spec.name.toLowerCase() + (spec.tool ? ' (' + ({ axe: 'axe', pick: 'pickaxe', shovel: 'shovel' }[spec.tool]) + ', tier ' + spec.tier + (spec.tier <= 1 ? ' or slow bare hands' : '') + ')' : ' by hand') + (where ? ' — most in ' + where : ''));
            }
        }
        src('timber', 'Fell any tree (pines and broadleafs everywhere; Pinebreak Forest is densest). Dead trees give less.');
        src('resin', 'Fell pine trees; also pine timber deposits.');
        src('fiber', 'Small pines sometimes drop plant fiber when felled.');
        const LT = BO.ZoneLoot?.TABLES || {};
        const LN = BO.ZoneLoot?.NAMES || {};
        const containerWhere = (type) => topRegions(Object.fromEntries(Object.entries(containersByRegion).map(([r, t]) => [r, t[type] || 0]).filter(([, n]) => n > 0)), 2);
        for (const [type, rows] of Object.entries(LT)) {
            const total = rows.reduce((s, r) => s + r[1], 0);
            for (const [id, w] of rows) {
                if (id === '__weapon') continue;
                const chance = w / total > 0.25 ? 'common' : w / total > 0.12 ? 'uncommon' : 'rare';
                const where = containerWhere(type);
                src(id, (LN[type] || type) + 's (' + chance + ')' + (where ? ' — e.g. ' + where : ''));
            }
        }
        for (const [reg, rows] of Object.entries(BO.ZoneFrontier?.REGION_LOOT || {})) for (const [id] of rows) if (id !== '__weapon') src(id, 'Bonus find in any container in ' + regionName(reg));
        for (const rec of frontier.recipes || []) for (const id of Object.keys(rec.gain || {})) src(id, 'Craft: ' + rec.name + ' (' + (STATION_SHORT[rec.station] || rec.station) + ') from ' + amounts(rec.cost));
        for (const [sid, st] of Object.entries(BO.SurvivalCampaignData?.stock || {})) for (const id of Object.keys(st.gain || {})) src(id, 'Trade at Haven: ' + st.name + ' for ' + amounts(st.cost));
        const dedupe = (list) => [...new Set(list)].slice(0, 8);

        /* ---------- 1. Getting started ---------- */
        add({ cat: 'start', title: 'The first five minutes', icon: icon('flare'),
            text: 'You wake inside a downed helicopter in Crash Valley, injured and bleeding, with six rounds in an M1911. During the opening safe period nothing hostile spawns — use it to bandage, search the wreck, and reach the Relay Ranger Station.',
            lists: [{ h: 'Immediate checklist', items: [
                'Press ' + key('survFlask') + ' or open Inventory (' + key('survInventory') + ') to stop the bleeding.',
                'Search nearby crates and luggage with ' + key('interact') + ' — container searches happen in real time and make noise.',
                'Follow the compass marker to the Ranger Station to establish your first safehouse (workbench + stove).',
                'Check the top-left objective bar and the Map (' + key('survMap') + ') to track Act 1–3 story steps.'
            ] }] });
        add({ cat: 'start', title: 'The Lantern spine (Acts 1–3)', icon: icon('beacon', '#c59bff'),
            text: 'The Exclusion Zone is centred on Project Lantern — a towering beam visible from anywhere in the valley. Three acts guide you from survival to the Crater:',
            lists: [{ h: 'Story progression', items: [
                'Act 1 · Signal: Survive the crash, secure the ranger station, climb a radio tower, and repair the relay.',
                'Act 2 · Cartography: Push into the frontier (Hollow Town, Pinebreak, Kessel, Spillway, Frostline, Cinder), defeat a named guardian for a Campus Keycard, and survive escalating horde nights.',
                'Act 3 · Breach: Enter Black Pine Research Campus, recover the Lantern research data, descend into the Crater, defeat The Warden, and decide the Lantern\'s fate.'
            ] }] });
        add({ cat: 'start', title: 'Real-time terminal & survival stakes', icon: icon('chest'),
            text: 'Opening your Field Terminal (Inventory, Crafting, Map, Journal) does NOT pause the Exclusion Zone — taking damage immediately closes it. Always check your surroundings before sorting gear or searching containers.',
            facts: [['Safe saving', 'Manual & autosaves require no enemies within 9 m'], ['Story saves', 'Ending choices, Warden kills, hordes & garrisons always save']] });

        /* ---------- 2. Controls ---------- */
        const controls = [
            ['Movement', 'W A S D', 'Sprint (' + key('sprint') + '), jump (' + key('jump') + '), crouch (' + key('crouch') + '). Sprinting is loud; crouching cuts footstep hearing to 2.5 m.'],
            ['Aim, fire & reload', 'Mouse · ' + key('reload'), 'Left-click fires or swings tools. Right-click aims. Press ' + key('reload') + ' to reload OR clear a weapon stoppage/jam.'],
            ['Interact & search', key('interact'), 'Search containers, climb radio tower ladders, mount the rail handcar, open doors, rest at beds, or touch the Lantern.'],
            ['Quick heal', key('survFlask'), 'Applies a bandage or trauma kit directly without opening Inventory.'],
            ['Field light', key('survLight'), 'Lights a torch (90 s) or reusable lantern (4 min). Warning: light makes you visible to infected from 46 m at night.'],
            ['Hotbar slots', '1 – 8', 'Equip weapons, tools, consumables or build pieces assigned in your Inventory.'],
            ['Snap build mode', key('survBuild'), 'Opens Build. Rotate pieces with R; integrity colours show blue (solid) → green → yellow → red (collapsing).'],
            ['Field Terminal tabs', key('survInventory') + ' · ' + key('survCraft') + ' · ' + key('survMap'), 'Inventory (' + key('survInventory') + '), Crafting (' + key('survCraft') + '), Map (' + key('survMap') + '), Skills (' + key('survSkills') + '), Journal (' + key('survJournal') + '), Guide (' + key('survLegend') + ').']
        ];
        for (const [t, k, d] of controls) add({ cat: 'controls', title: t, icon: icon('fist'), tags: [k], text: d });

        /* ---------- 3. Senses, hordes & events ---------- */
        add({ cat: 'threat', title: 'Infected senses (Sight, Hearing, Smell)', icon: icon('blade', '#f2b45a'),
            text: 'Infected do not magically know where you are. They patrol in Idle, investigate disturbances in Curious, and chase in Hunt before losing track after 18 s out of sight.',
            facts: [['Day sight', '32 m forward cone'], ['Night sight', '15 m (46 m if holding a light!)'], ['Hearing', 'Crouch 2.5 m · Walk 8 m · Sprint 17 m · Gunshots 70–150 m'], ['Smell', '15 m while actively bleeding']] });
        add({ cat: 'threat', title: 'Horde nights & structural breaching', icon: icon('fire', '#ff7b6b'),
            text: 'Every third night (every second with Brutal Nights), the Lantern surges at 20:00 and three waves converge on your base (or on you). Horde infected follow a shared flow field that targets the weakest wall in your perimeter and claws straight through it.',
            facts: [['Dusk warning', 'Radio alert at 16:30 on horde day'], ['Reward', 'XP + Archive Commendation on survival'], ['Seal ending', 'Permanently stops all future horde nights']] });
        add({ cat: 'threat', title: 'Sable Company PMC garrisons', icon: icon('rifle', '#9fd4ff'),
            text: 'Armed PMC patrols roam from Day 2, and full garrisons fortify industrial POIs (Kessel warehouses, turbine halls, offices, mineheads). Engaging a garrison triggers an alarm siren that draws nearby infected and calls reinforcements. Clearing a garrison drops a high-tier supply cache.',
            facts: [['Reoccupation', 'Cleared garrisons stay clear for 4 days'], ['Tactic', 'Use sirens against them — let infected flank the PMCs']] });
        add({ cat: 'threat', title: 'Dynamic & regional weather', icon: icon('mask', '#9fd4ff'),
            text: 'Weather rolls across the valley and shifts by biome: Overcast, Ash Rain (increases weapon jam chance and fills lungs without a filter), Rad Fog (thick fog + 1.4× radiation), wetlands rain (makes you wet and colder), and Frostline Blizzards.' });
        add({ cat: 'threat', title: 'World events', icon: icon('flare', '#ff7b6b'), tags: ['Every 5–9 min'],
            text: 'The Zone acts on its own. Active events show as HUD chips, a flag on the compass and a pulsing marker on the map.',
            lists: [{ h: 'Events', items: ['Supply airdrop: a plane drops a crate under red smoke — military loot and a weapon, but a PMC squad heads for it too. Gone after 7 minutes.', 'Infected migration: a herd of 12–22 walks a route across the Zone. Noise pulls members off the route.', 'Distress call: a survivor is pinned down at a building. Clear the infected near them within 6 minutes for supplies, and they mark an unread intel document on your map.', 'Lantern surge (day 2+): a 30-second warning, then 90 seconds of radiation outdoors. A roof or a filter protects you.'] }] });

        /* ---------- 3b. Levels, loot & contracts ---------- */
        const TH = BO.ZoneThrill;
        if (TH) {
            add({ cat: 'thrill', title: 'Survivor levels & perk cards', icon: icon('rune', '#ffd27a'), tags: ['Every expedition'],
                text: 'Everything you do earns XP: kills (+4 for headshots), kill streaks and multi-kills, containers, discoveries, securing sites, stashes, contracts and caches. Each level heals 25% and lets you choose one of three perk cards. Cards open on their own once no infected is hunting you, or press ' + key('survSkills') + ' to choose now. Press 1–3 to pick, R to reroll (you start with 1 reroll and earn more from contracts), Esc for later. Perks last for the whole expedition, deaths included.',
                facts: [['Card rarity', 'Common · Rare · Epic (Epic perks from level 3–5)'], ['Ranks', 'Most perks stack 2–3 times'], ['Where to see them', 'Journal → Survivor perks']],
                lists: ['Combat', 'Stealth', 'Survival', 'Scavenging', 'Building', 'Legend'].map((cat) => ({ h: cat, items: TH.PERKS.filter((p) => p.cat === cat).map((p) => p.name + ' (max ' + p.max + '): ' + p.desc(1)) })) });
            add({ cat: 'thrill', title: 'Weapon rarity & traits', icon: icon('rifle', '#b26bff'),
                text: 'Every found weapon rolls a rarity. Higher rarity means more damage and more traits. Weapons on the ground stand under a loot beam in their rarity colour, and their swap prompt lists the traits. Higher-threat regions, cleared-site stashes, champions, contracts and treasure caches roll better. The Gunsmith\'s Luck perk raises the odds.',
                facts: TH.RARITY.map((r) => [r.name, '+' + Math.round((r.dmg - 1) * 100) + '% damage · ' + r.perks + ' trait' + (r.perks === 1 ? '' : 's')]),
                lists: [{ h: 'Traits', items: Object.values(TH.WPERKS).map((t) => t.name + ': ' + t.desc + (t.kind === 'gun' ? ' (firearms only)' : '')) }, { h: 'Legendary weapons', items: ['Always three traits and a unique name, such as "Widowmaker" or "Quiet Mercy".'] }] });
            add({ cat: 'thrill', title: 'Champion infected', icon: icon('blade', '#ff8a3d'),
                text: 'Some infected are champions: tinted, ringed with light and named above their head. They are tougher (their health is capped by the day, so a pistol can still finish one), and they lead most infested sites. A champion always drops a bag of ammunition and supplies, usually a weapon of Rare or better, and sometimes coordinates to a treasure cache. Champions get more common with each day and in more dangerous regions.',
                lists: [{ h: 'Affixes', items: Object.values(TH.AFFIX).map((a) => a.name + ': ' + a.desc) }] });
        }
        add({ cat: 'thrill', title: 'Infested sites & securing the Zone', icon: icon('flare', '#8fe3c8'), tags: ['Red flag = infested', 'Green flag = secured'],
            text: 'Every building and dozens of outdoor sites (wrecked convoys, abandoned camps, military roadblocks, crash sites, hunters\' camps, supply caches, burned-out buses) are held by a pack of infected, usually led by a champion. A red flag flies over each. Kill the whole pack to secure the site: the flag turns green, its supply stash unlocks under a green beam, and roaming infected stop spawning within about 38 m. Stashes hold military supplies, sometimes a frag grenade, and always a weapon of Uncommon or better.',
            facts: [['Packs appear', 'Within about 105 m'], ['Reinfestation', 'From 3 days after securing, a 30% chance each dawn'], ['Progress', 'HUD chip "Zone held", map icons, compass ☠ pip for the nearest infested site']] });
        add({ cat: 'thrill', title: 'Haven contracts', icon: icon('scroll', '#ffd27a'), tags: ['3 on offer'],
            text: 'Quartermaster Rowan radios short contracts from Haven. Three are always on offer; finish one and a new one arrives within about 20 seconds. Each pays XP, ammunition for the gun you hold, a supply, and a weapon of guaranteed minimum rarity. Some also pay a perk reroll. Located contracts show on the compass (✪) and the map.',
            lists: [{ h: 'Contract types', items: ['Clear: secure a named infested site.', 'Bounty: hunt a named champion with 2–3 affixes somewhere inside a marked circle (expires after a day).', 'Headhunter: headshot kills.', 'Champion hunt: kill champions (+1 reroll).', 'Scavenger: search containers.', 'Kill streak: chain kills with no more than 8 s between them (+1 reroll).', 'Burn a nest (+1 reroll).'] }] });
        add({ cat: 'thrill', title: 'Treasure caches', icon: icon('chest', '#ffb43a'),
            text: 'Champions sometimes carry coordinates. A gold beam marks the cache 110–230 m away, and it shows in the contracts list, on the compass and on the map. When you get close, a guard pack led by a champion rises around it. Clear the guards and open it for a military supply roll, a medkit and an Epic weapon, with a 25% chance of Legendary. Up to two caches can be marked at once.' });
        add({ cat: 'thrill', title: 'Kill streaks & multi-kills', icon: icon('fire', '#ffd27a'),
            text: 'Kills within 2.6 s of each other are multi-kills (Double, Triple, Quad, Massacre). Kills with no more than 8 s between them build a streak: Killing Spree (5), Rampage (10), Unstoppable (15), Zone Reaper (25), Lantern\'s Wrath (40), Extinction Event (60). Each pays bonus XP. Ordinary infected also drop a few rounds for your gun now and then.' });

        /* ---------- 3c. Animals, hunting & cooking ---------- */
        const W = BO.ZoneWild;
        if (W) {
            const biomeNames = { meadow: 'meadows', forest: 'forests', town: 'towns', wetland: 'wetlands', alpine: 'mountains', ash: 'ash wastes' };
            for (const [k, s] of Object.entries(W.SPECIES)) {
                add({ cat: 'wild', title: s.name, icon: icon('blade', s.temper === 'flee' ? '#8fe3c8' : '#ff8a6b'), tags: [{ flee: 'Prey · flees', defend: 'Fights back when hurt', hunt: 'Predator · hunts at night', territorial: 'Territorial · attacks if close' }[s.temper]],
                    text: s.name + ' lives in ' + Object.keys(s.biomes).filter((b) => s.biomes[b] > 0).map((b) => biomeNames[b] || b).join(', ') + '. ' + (s.temper === 'flee' ? 'It runs from you and from loud noises — crouch to get close.' : s.temper === 'defend' ? 'It charges when hurt.' : s.temper === 'hunt' ? 'Wolves hunt in packs of 2–4, attack on sight at night and up close by day.' : 'Leave it alone or bring a big gun; it attacks anyone who comes within about 15 m.'),
                    facts: [['Health', String(s.hp)], ['Speed', s.speed + ' m/s'], ['XP', String(s.xp)], ['Damage', s.dmg ? String(s.dmg) : '—']],
                    lists: [{ h: 'Drops (a bag to collect)', items: Object.entries(s.drops).map(([id, [lo, hi]]) => name(id) + ' ×' + (lo === hi ? lo : lo + '–' + hi)) }] });
            }
            add({ cat: 'wild', title: 'Raw vs cooked food', icon: icon('bowl', '#ffd27a'), tags: ['Cooked = 3× raw'],
                text: 'Meat, eggs and mushrooms can be eaten raw, but restore little and carry a 30% chance of food poisoning (infection and thirst). Cook them at a campfire, fire camp, smokehouse or cooking station and they restore three times as much food and health, with no risk. Put food on the hotbar and use it like any item.',
                lists: [{ h: 'Every food (food / health)', items: Object.entries(W.FOOD).map(([id, f]) => name(id) + ': ' + f.f + ' / ' + (f.h || 0) + (f.w ? ' · +' + f.w + ' water' : '') + (f.regen ? ' · regenerates for ' + f.regen + ' s' : '') + (f.raw ? ' · raw' : '')) }] });
            add({ cat: 'wild', title: 'Cooking stations & fire camps', icon: icon('fire', '#ff8a6b'),
                text: 'Build them from the Build menu. A campfire cooks meat and brews tea. A fire camp is a bigger ringed fire: it cooks, warms and lights a wide area. A cooking station (stove, pot and grill) cooks everything a campfire can plus the big meals: hunter\'s stew, meat pie, omelette, mushroom soup, berry pie, honey-glazed ham, survivor\'s feast and the golden ration. A smokehouse counts as a campfire, and food eaten within 8 m of it restores 25% more. A tanning rack counts as a crafting table for leatherwork.',
                facts: [['Fire camp', '4 timber, 6 stone'], ['Cooking station', '6 stone, 1 iron bar, 2 bricks, 2 timber'], ['Smokehouse', '4 boards, 4 stone, 2 clay'], ['Tanning rack', '4 timber, 2 cord']] });
            add({ cat: 'wild', title: 'New resources', icon: icon('wrench', '#d9c48f'),
                text: 'Sand bars (shovel, wetlands) → glass and bottles. Flint gravel (by hand). Sulfur vents (pickaxe, ash wastes) → gunpowder. Gold veins (iron pickaxe, mountains) → gold bars for the golden ration, spyglass and engines. Salt crusts (pickaxe, wetlands) → jerky and leather. Berry bushes, mushroom rings and wild beehives (by hand) → food. Obsidian (drill, the Crater) → Obsidian blast walls, trauma rigs and weapon cores.' });
            add({ cat: 'wild', title: 'Fishing & baited lines', icon: icon('fish', '#7cc6e8'), tags: ['Reservoir & stations'],
                text: 'Craft a Weighted Salvage Line (1 scrap, 1 cord) to catch fresh reservoir trout and sunken salvage at marked waterside stations — or equip the line on your hotbar and cast directly into the Spillway Reservoir! Carrying Fishing Bait automatically spends 1 bait to cut bite time nearly in half and double your fish and salvage haul.' });
            add({ cat: 'wild', title: 'Taming beasts & Vanguard companions', icon: icon('paw', '#8fe3c8'), tags: ['Rank I–V', 'Orders'],
                text: 'Approach wild Grey Wolves, Wild Boars or Brown Bears with their favourite food in your pack and press ' + key('interact') + ' to feed and tame them — or recruit a Haven Vanguard scout at Haven (or by rescuing a survivor at a Distress Call). Press ' + key('survCompanion') + ' to cycle orders between Follow & Fight, Heel / Stealth, and Guard Post. Companions earn XP up to Rank V and never permanently die (revive with a bandage or wait 22 s).',
                lists: [{ h: 'Companions', items: [
                    'Zone Hound (Grey Wolf — feed bone or venison): fast tracker that pings nearby unsearched military/lab crates every 18 s.',
                    'Tusk Charger (Wild Boar — feed berries or mushrooms): knockdown ramming charge and +12 kg Pack Saddle carry capacity.',
                    'Apex War-Bear (Brown Bear — feed honey or fish): 580+ HP boss-tanking grizzly with cleaving paw swipes.',
                    'Haven Vanguard (Haven or Distress rescue): fires suppressed 5.56 bursts from 26 m without alerting the Zone.'
                ] }] });
            add({ cat: 'wild', title: 'Optical spyglass', icon: icon('spyglass', '#d9b56c'), tags: ['2.5×–10× zoom'],
                text: 'Use a Brass Spyglass (or hold RMB while holding it on the hotbar) to look through a variable-zoom rangefinding scope (scroll Mouse Wheel between 2.5× and 10×). Automatically marks unseen infested sites within 280 m and reads exact distance, POI tier, wildlife and enemy HP.' });
        }

        /* ---------- 3d. Dungeons, bosses & arena ---------- */
        const DG = BO.ZoneDungeons;
        if (DG) {
            add({ cat: 'dungeons', title: 'How dungeons work', icon: icon('blade', '#c8a2ff'), tags: ['9 dungeons'],
                text: 'Each dungeon has a stone doorway with two lamps beside a building in the world (shown on the map once you have been to that region). Step inside and you are sealed in. Each room\'s far door stays locked until you kill everything in the room and solve its puzzle. Notes on the walls hold the clues (codes, lever orders, valve settings). The last room has a chest and a portal home; a portal at the entrance takes you out at any time. You cannot save inside. Cleared dungeons stay cleared.' });
            for (const d of DG.DUNGEONS) {
                add({ cat: 'dungeons', title: d.name, icon: icon('blade', d.rooms.some((r) => r.boss) ? '#ff6b5b' : '#c8a2ff'), tags: [d.size, d.rooms.length + ' rooms'],
                    text: d.blurb + ' Entrance: beside the ' + d.near.replace(/_/g, ' ') + '.',
                    lists: [{ h: 'Rooms', items: d.rooms.map((r, i) => 'Room ' + (i + 1) + ': ' + [r.enemies ? r.enemies + '+ infected' : '', r.champ ? r.champ + ' champion' + (r.champ > 1 ? 's' : '') : '', r.puzzle ? r.puzzle.type + ' puzzle' : '', r.boss ? 'BOSS — ' + r.bossName : '', r.hazard ? 'fire jets' : '', r.dark ? 'no lights' : '', r.ore ? r.ore + ' ore deposits' : '', r.chest ? 'reward chest (tier ' + r.chest + ')' : ''].filter(Boolean).join(', ')) }] });
            }
            add({ cat: 'dungeons', title: 'Dungeon puzzles', icon: icon('tech', '#8fe3c8'),
                lists: [{ h: 'Types', items: ['Levers: pull the four symbol levers in the order written on a note. A wrong pull resets them and wakes something.', 'Braziers: light all four within 25 s of lighting the first.', 'Valves: read the gauge panel and turn each valve to its setting (1→2→3→4→1).', 'Fuses: find the fuses hidden around the rooms and refit the lift panel.', 'Keypad: find the code on a note, set the three dials and press ENTER. A wrong code sounds the alarm.', 'Timed vault: an alarm gives you 75 s to reach the vault before lockdown floods it with infected.', 'Dark maze: no lights. Bring a torch or a lantern.'] }] });
        }
        const LG = BO.ZoneLegends;
        if (LG) {
            add({ cat: 'dungeons', title: 'Legendary hunts', icon: icon('blade', '#ff6b5b'), tags: ['12 bosses'],
                text: 'Twelve legendary bosses only appear once you have met their condition. When one wakes, a banner warns you, and about 20 s later it arrives near you and hunts you down. Kill it for 400 XP, a bag of rare supplies and a Legendary weapon. If you escape it, it comes back later. Track progress in the Journal.',
                lists: [{ h: 'What wakes each one', items: LG.LEGENDS.map((L) => L.name + ': ' + L.how) }] });
            add({ cat: 'dungeons', title: 'Pit Masters & the arena', icon: icon('rifle', '#ffb43a'),
                text: 'Three Pit Masters (at Haven, by the Hollow Town pharmacy and by the Spillway boathouse) offer boss duels. Pick a boss and say yes, and you are taken to the arena. The fight starts after 3 s. Win and a portal home opens with a reward chest (an Epic or better weapon, gold and a perk reroll) and 90 s to loot before it closes. The ladder has ten bosses; each one unlocks the next. Step into the portal early to forfeit.' });
            add({ cat: 'enemies', title: 'The full roster by day', icon: icon('blade', '#f2b45a'),
                text: 'All 70 infected types roam the Zone. Day 1 has the 8 easiest; about 6 more join each day (more in dangerous regions) until everything is in play around day 11. Each region favours its own kinds. A toast at dawn names the newcomers. The "Full roster from day one" option skips the wait.' });
        }

        /* ---------- 3e. Quests ---------- */
        const QS = BO.ZoneQuests;
        if (QS) {
            const all = [...QS.CATALOG];
            add({ cat: 'quests', title: 'How the quest log works', icon: icon('scroll', '#c8a2ff'), tags: [all.length + '+ quests'],
                text: 'The quest log holds hundreds of different quests in eight chapters. Four are tracked at a time: they show on the right of the HUD, and quests with a place show on the compass and map. Choose which to track in the Journal (Track / Untrack); when one finishes the log picks the next easiest for you. Each quest completes once per expedition. Rewards grow with difficulty (★): XP and supplies, a weapon from ★★★, and a perk reroll from ★★★★.' });
            for (const [id, label] of QS.CHAPTERS) {
                add({ cat: 'quests', title: label + ' quests', icon: icon('scroll', '#c8a2ff'), lists: [{ h: label, items: all.filter((x) => x.cat === id).map((x) => x.title + ' (' + '★'.repeat(x.d) + '): ' + x.text) }] });
            }
            add({ cat: 'quests', title: 'Cull quests', icon: icon('blade', '#c8a2ff'), text: 'Seventeen more quests ask you to kill a number of one specific infected type, spread from the first shamblers to the last horrors that join the roster around day 11.' });
        }

        /* ---------- 3f. Vehicles & sandbox ---------- */
        for (const v of BO.SurvivalCampaignData.vehicles) {
            add({ cat: 'travel', title: v.name, icon: icon('gear', '#9fd4ff'), tags: [v.build ? 'Build-only' : 'Find it'],
                text: v.detail + (v.build ? ' Build it at a crafting table (Crafting → Vehicles).' : ' Parked beside the ' + String(v.found).replace(/_/g, ' ') + ' — walk up and claim it.') + ' Press ' + key('survRide') + ' to ride your fastest vehicle or get off.',
                facts: [['Road speed', '×' + v.speed], ['Off-road', '×' + v.offroad], ['Noise', v.noise >= 5 ? 'Very loud' : v.noise >= 3 ? 'Loud' : v.noise >= 1 ? 'Some' : 'Silent']].concat(v.build ? [['Cost', amounts(v.build)]] : []) });
        }
        add({ cat: 'rules', title: 'Sandbox & custom rules', icon: icon('tech', '#8fe3c8'),
            text: 'On the deploy screen, the modifier board has a Sandbox category of on/off switches that shape your own run. Hover any switch for its exact effect.',
            lists: [{ h: 'Switches', items: Object.entries(BO.SurvivalRules.modifiers).filter(([, m]) => m.group === 'sandbox').map(([, m]) => m.name + ': ' + m.description) }] });

        /* ---------- 4. Vitals & climate ---------- */
        for (const [t, g, d, note, fixes] of VITALS) {
            add({ cat: 'vitals', title: t, icon: icon(g, '#f2b45a'), text: d + (note ? ' ' + note : ''), lists: [{ h: 'Remedies & counters', items: fixes }] });
        }

        /* ---------- 5. Zone regions ---------- */
        const regions = BO.Zone?.REGIONS || [];
        for (const r of regions) {
            const threatTxt = ['', 'Tier 1 (Low)', 'Tier 2 (Moderate)', 'Tier 3 (High)', 'Tier 4 (Severe)', 'Tier 5 (Extreme)'][r.threat] || 'Tier ' + r.threat;
            add({ cat: 'map', title: r.name, icon: icon('scroll', r.threat >= 4 ? '#ef8a6b' : '#8fe3c8'),
                tags: [threatTxt, r.biome || ''], text: REGION_GUIDE[r.id] || 'Exclusion Zone sector.',
                facts: [['Threat', threatTxt], ['Biome', r.biome || 'Mixed']],
                lists: [
                    { h: 'Resource deposits', items: Object.entries(depositsByRegion[r.id] || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => (frontier.resources[k]?.name || k) + ' ×' + n + ' → ' + amounts(frontier.resources[k]?.gain)) },
                    { h: 'Regional finds', items: (BO.ZoneFrontier?.REGION_LOOT?.[r.id] || []).filter(([id]) => id !== '__weapon').map(([id]) => name(id)) },
                    { h: 'Points of interest', items: [...new Set((Z.pois || []).filter((p) => p.region === r.id && p.name).map((p) => p.name))].slice(0, 10) },
                    { h: 'Containers', items: Object.entries(containersByRegion[r.id] || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, n]) => (LN[t] || t) + ' ×' + n) }
                ].filter((l) => l.items.length) });
        }

        /* ---------- 6. Building & fortifications ---------- */
        add({ cat: 'building', title: 'Snap building & structural integrity', icon: icon('build', '#8fe3c8'),
            text: 'Structures snap to a 2.8 m modular grid. Grounded pieces have 100% support; building upward or outward reduces support (stone carries much farther than timber). If a supporting wall or foundation breaks, everything relying on it collapses.',
            facts: [['Timber wall HP', '220 HP (holds minutes of clawing)'], ['Stone wall HP', '560 HP (resists horde breaching)'], ['Fortification Savant', '+20% structure HP per Archive rank']] });
        for (const b of frontier.buildings || []) {
            add({ cat: 'building', title: b.name, icon: icon('build'), tags: [b.tech ? 'Tech unlock' : 'Starter'],
                text: b.detail || 'Base fortification or utility station.',
                facts: [['Cost', amounts(b.cost) || '—'], ...(b.tech ? [['Requires', deep.techTree?.find((t) => t.id === b.tech)?.name || b.tech]] : [])] });
        }

        /* ---------- 7. Scavenging & crafting ---------- */
        add({ cat: 'crafting', title: 'Gunsmith & Resonance Anvil', icon: icon('scope', '#8fe3c8'), tags: ['3D Attachments', 'Elemental Cores'],
            text: 'Build an Armory & Gunsmith Anvil (or click Gunsmith on any weapon in Inventory while standing near a workbench) to fit real 3D Optics, Suppressors, Foregrips, Extended/Drum Magazines, Stocks and Camos onto your firearms. On the Resonance Anvil tab, temper any weapon\'s rarity all the way up to Legendary, reroll weapon traits, and socket Obsidian Razor, Cryo Frost, Arc Volt or Solar Napalm cores!' });
        add({ cat: 'building', title: 'Homestead planters, rain barrels & waystones', icon: icon('build', '#8fe3c8'), tags: ['Self-sufficient base'],
            text: 'Build Homestead Crop Planters anywhere at your base (apply Bone Meal to surge growth +75% and harvest +50% yield), Rainwater Collectors that passively filter clean water (3× faster in rain), 1,400 HP Obsidian Blast Walls, and a Resonance Waystone to unlock direct Fast Travel and Respawn right at your homestead.' });
        add({ cat: 'crafting', title: 'Weapon condition, jams & 4 ammo calibres', icon: icon('wrench', '#f2b45a'),
            text: 'Firearms wear down as you shoot. Below 45% condition they can jam (press ' + key('reload') + ' to clear), especially in Ash Rain. Repair guns with Weapon Repair Kits. Ammunition is tracked in four pack calibres: 9mm, 5.56mm, 7.62mm, and 12-gauge shells, all hand-loadable from spent brass, powder and primers at a Workbench.',
            facts: [['Spent brass', '45% chance to recover brass per shot'], ['Deadeye Reflex', '-15% wear & jam risk per Archive rank']] });
        for (const [id, desc] of Object.entries(STATION)) add({ cat: 'crafting', title: 'Station: ' + STATION_SHORT[id], icon: icon('wrench'), text: desc });
        for (const rec of frontier.recipes || []) {
            add({ cat: 'crafting', title: rec.name, icon: icon('wrench'), tags: [STATION_SHORT[rec.station] || rec.station],
                text: rec.desc || '', facts: [['Ingredients', amounts(rec.cost)], ['Produces', amounts(rec.gain)]] });
        }

        /* ---------- 8. Items & tools ---------- */
        for (const [id, spec] of Object.entries(frontier.tools || {})) {
            add({ cat: 'items', title: spec.name, icon: icon(spec.family === 'axe' ? 'axe' : 'pick'), tags: ['Tool · Tier ' + spec.level],
                text: 'Power ' + spec.power + ' · Durability ' + spec.wear + '.', facts: [['Cost', amounts(spec.cost)], ['Station', STATION_SHORT[spec.station] || spec.station]] });
        }
        for (const [id, [label, cat, wt]] of Object.entries(frontier.items || {})) {
            const found = dedupe(sources[id] || []);
            add({ cat: 'items', title: label, icon: icon('chest'), tags: [cat, wt + ' kg'], text: info[id] || (cat + ' item used in survival crafting or scavenging.'), keywords: id,
                lists: found.length ? [{ h: 'Where to find it', items: found }] : [{ h: 'Where to find it', items: ['Not found in the Zone this version — earned from special rewards only.'] }] });
        }

        /* ---------- 9. Guardians & the Warden ---------- */
        add({ cat: 'bosses', title: 'The Warden (3-Phase Crater Finale)', icon: icon('beacon', '#d58bff'), tags: ['Final Boss', 'The Crater'],
            text: 'Touching the Lantern with the Black Pine research data wakes The Warden (~2,200 HP on Normal, scaled by difficulty and Zone Tier). If you die or flee more than 85 m from the core, the Warden withdraws and resets.',
            lists: [{ h: 'Phase breakdown', items: [
                'Phase 1 (100–66% HP): The Warden hunts you while summoning a brood pack every 20 s.',
                'Phase 2 (66–33% HP): The Lantern charges red for 3 s before firing a line-of-sight shockwave pulse (32 HP + 20 rad). Break line of sight behind the 7 basalt monoliths! Pulses also scorch exposed infected.',
                'Phase 3 (<33% HP): Pulses fire every 9 s (45 HP), Crater radiation climbs continuously, and close-range Warden slams knock you back.'
            ] }] });
        add({ cat: 'bosses', title: 'The Three Endings & World Consequences', icon: icon('rune', '#f2d07a'), tags: ['Story Finale'],
            text: 'Defeating The Warden leaves the Lantern unguarded. Your choice permanently alters the current Zone, unlocks the next Zone Tier, awards commendations, and lets you finish or keep exploring.',
            lists: [{ h: 'Choices', items: [
                'Seal It (+6 Comm.): Beam goes dark, -35% roaming infected everywhere, horde nights stop forever, unlocks Signal Ghost kit.',
                'Extract the Data (+4 Comm.): Zone stays active, banks two shares of your pack into the Archive Stash, unlocks Zone Archivist kit.',
                'Seize It (+5 Comm.): Beam turns gold, infected detection drops by 60%, unlocks Lantern Keeper kit.'
            ] }] });
        const guardians = [
            ['The Butcher of Hollow Town', 'Hollow Town', 'Heavy melee brute guarding the town clinic & lockers. Drops a Campus Keycard and SPAS-12.'],
            ['Den Mother', 'Pinebreak Forest', 'Fast apex stalker guarding the western forest nest. Drops a Campus Keycard and M40A3 rifle.'],
            ['Yard Colossus', 'Kessel Freight', 'Armored juggernaut near the freight yards. Drops a Campus Keycard, 7.62 ammo and M249 SAW.'],
            ['Spillway Bloat', 'Spillway Reservoir', 'Toxic bio-hazard guardian of the wetlands. Drops a Campus Keycard, antibiotics and filters.'],
            ['Pale Maul', 'Frostline Mountain', 'Alpine apex predator patrolling the snowy ridges. Drops Insulated Thermals, fuel and canned food.'],
            ['Cinder Regent', 'Cinder Refinery', 'Scorched refinery guardian. Drops respirator filters, powder and primers.']
        ];
        for (const [t, loc, d] of guardians) add({ cat: 'bosses', title: t, icon: icon('rifle', '#ef8a6b'), tags: [loc], text: d });

        /* ---------- 10. The Archive (meta) ---------- */
        add({ cat: 'archive', title: 'Zone Tiers 1–10', icon: icon('fire', '#f2b45a'),
            text: 'Clearing any ending at your highest unlocked Zone Tier unlocks the next tier, up to Tier 10 (Blackout Apex). Higher tiers scale infected HP, damage, roaming caps and radiation while multiplying loot yield, XP, and bonus commendations (+1 to +12).',
            facts: [['Tier 1', 'Quarantine Perimeter (1.0×)'], ['Tier 5', 'Black Pine Surge (1.7× HP, 1.45× loot, +4 Comm.)'], ['Tier 10', 'Blackout Apex (3.15× HP, 2.2× loot, 3× XP, +12 Comm.)']] });
        add({ cat: 'archive', title: 'Seeded Worlds & Daily Expedition', icon: icon('scroll', '#8fe3c8'),
            text: 'Enter or roll a World Seed in the Deploy Briefing to deterministically generate container loot rolls and rare drops — share a seed to replay the exact same Zone. Load the Daily Expedition for a curated daily seed and rule-set with +3 Bonus Commendations on your first daily clear.' });
        add({ cat: 'archive', title: 'Archive Mastery Tree & Free Respec', icon: icon('rune', '#f2d07a'),
            text: 'Spend Commendations across three permanent branches: Logistics & Fieldcraft (carry weight, search speed, travel, stash share), Combat & Endurance (HP, armor, weapon durability, healing), and Anomaly & Engineering (structure HP, stealth, radiation/pulse resistance, blueprint discounts). You can Respec at any time for a 100% refund.' });
        for (const [id, k] of Object.entries(meta.KITS || {})) {
            add({ cat: 'archive', title: 'Kit: ' + k.name, icon: icon('chest', '#9fd4ff'), tags: [k.unlock ? 'Unlock: ' + (k.unlockLabel || k.unlock) : 'Level ' + k.level], text: k.desc });
        }
        add({ cat: 'archive', title: 'Stash Packing, Blueprints & Chronicle', icon: icon('chest', '#8fe3c8'),
            text: 'Bankable supplies extracted at the end of runs are stored in your Archive Stash. Before deploying, click + / − in The Archive to pack stash items directly into your drop pack. Forged weapon schematics stay permanently unlocked in your Blueprint Vault, and every run is logged in the Expedition Chronicle.' });
        add({ cat: 'archive', title: 'Intel: the Project Lantern documents', icon: icon('scroll', '#f7e3a6'), tags: ['16 documents'],
            text: 'Sixteen logs, letters, reports and recordings are hidden in fixed containers across nine regions; together they tell what Black Pine built and how the valley fell. Unread documents glint faintly over their container. Once found they stay in the Archive forever — read them in the Journal or The Archive. Every fourth document pays a commendation, and rescued survivors mark one on your map.' });
        add({ cat: 'archive', title: 'Feats', icon: icon('rune', '#f2d07a'), tags: ['27 feats'],
            text: 'Long-term goals that pay commendations once: story beats, every ending, a deathless ending, an ending before day 5, ten days survived, horde and garrison milestones, a 40-piece fortress, a third storey, all regions, hand-loading, the handcar, airdrops, rescues and the intel dossier. Progress bars in The Archive show how close you are.' });

        /* ---------- 11. Enemies ---------- */
        const roster = BO.Zone.bestiary() || [];
        for (let i = 0; i < roster.length; i++) {
            const z = roster[i];
            add({ cat: 'enemies', title: z.name, enemy: z.id, tags: ['HP ' + z.hp, 'Speed ' + z.speed.toFixed(1)],
                text: z.desc || z.ability || 'Exclusion Zone infected.', keywords: z.id + ' enemy infected' });
        }

        /* ---------- 12. Travel ---------- */
        const travel = [
            ['Climbable Radio Towers', 'Approach a radio tower ladder and press ' + key('interact') + ' to climb. Repairing a relay tower reveals nearby map regions and unlocks it as a fast-travel destination on the Map tab.'],
            ['Freight Rail Handcar', 'Found on the northern rail line near Kessel Freight. Interact to mount and pump along the track for fast, loud cross-valley transit.'],
            ['Trail Bicycle', 'Unlocked via Pathfinder kit or career progression. Quiet, agile road travel that uses zero fuel.'],
            ['Swimming', 'Entering the Spillway Reservoir automatically switches to swimming so you cross water safely — but being wet drops your body temperature.']
        ];
        for (const [t, d] of travel) add({ cat: 'travel', title: t, icon: icon('gear'), text: d });

        /* ---------- 13. Modes, rules & accessibility ---------- */
        add({ cat: 'rules', title: 'Positional Audio, Subtitles & Color-Blind Modes', icon: icon('tech', '#8fe3c8'), tags: ['Accessibility'],
            text: 'Infected vocal cues are stereo-panned by direction and distance, radiation triggers a Geiger counter, and the Lantern pulse has a 3-second rising charge audio cue. Toggle Radio & Audio Subtitles, Color-Blind Filters (Protanopia, Deuteranopia, Tritanopia), and Reduced Shake in the Deploy Briefing or in-run Journal.' });
        for (const [id, m] of Object.entries(rules.modes || {})) add({ cat: 'rules', title: 'Operation: ' + m.name, icon: icon('tech'), text: m.description });
        for (const [id, m] of Object.entries(rules.modifiers || {})) add({ cat: 'rules', title: 'Modifier: ' + m.name, icon: '<span class="fg-emoji">' + esc(m.ico || '◆') + '</span>', tags: [m.tier || ''], text: m.description, keywords: id + ' modifier' });

        /* ---------- 14. Troubleshooting ---------- */
        const help = [
            ['Weapon jammed / won\'t fire', 'Worn firearms (<45% condition) can jam, especially in Ash Rain. Press ' + key('reload') + ' to clear the stoppage, and use a Weapon Repair Kit to restore condition. Also confirm you have the matching pack calibre (9mm, 5.56, 7.62, 12g).'],
            ['Can\'t enter Research Campus', 'You need a Campus Keycard dropped by any named region guardian (The Butcher, Den Mother, Yard Colossus, Spillway Bloat) or found in high-tier caches.'],
            ['Can\'t wake The Warden', 'First recover the Project Lantern research data from the Research Campus, then interact with the Lantern core in the Crater.'],
            ['Lantern pulse keeps killing me', 'When the Lantern glows red and emits a 3-second rising whine, immediately duck behind one of the 7 basalt monoliths so it blocks line of sight to the core.'],
            ['Can\'t save or rest', 'Manual saves and sleeping require no enemies within 9 m. Story milestones (hordes, garrisons, Warden kill, endings) always auto-save.'],
            ['Structures keep collapsing', 'Check the integrity colour in Build Mode. Grounded pieces are blue (100%); stone carries farther than timber. Add supporting walls or foundations underneath.']
        ];
        for (const [t, x] of help) add({ cat: 'help', title: t, icon: icon('unknown', '#f2b45a'), text: x });

        return out;
    }

    let cached = null, cachedKey = '';
    function entries() {
        const k = JSON.stringify(BO.Settings.getKeybinds());
        if (!cached || cachedKey !== k) {
            cachedKey = k;
            cached = build();
        }
        return cached;
    }

    function cardHtml(e) {
        const lists = e.lists.filter((l) => l.items && l.items.length).map((l) => `<div class="fg-list"><h5>${esc(l.h)}</h5><ul>${l.items.slice(0, 40).map((x) => `<li>${esc(x)}</li>`).join('')}${l.items.length > 40 ? `<li class="fg-more">…and ${l.items.length - 40} more</li>` : ''}</ul></div>`).join('');
        const facts = e.facts.length ? `<dl class="fg-facts">${e.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '';
        const portrait = e.enemy ? `<img class="fg-portrait" data-portrait="${esc(e.enemy)}" alt="">` : '';
        return `<article class="fg-card${e.enemy ? ' fg-enemy' : ''}"${e.enemy ? ` data-tip-enemy="${esc(e.enemy)}" data-tip="${esc(e.title)}"` : ''}>
            <header>${portrait || `<span class="fg-ico">${e.icon || ''}</span>`}<div><h4>${esc(e.title)}</h4>${e.tags.filter(Boolean).length ? `<span class="fg-tags">${e.tags.filter(Boolean).map((t) => `<i>${esc(t)}</i>`).join('')}</span>` : ''}</div></header>
            ${e.text ? `<p>${esc(e.text)}</p>` : ''}${facts}${lists}
        </article>`;
    }

    function renderResults(query = '', category = 'start') {
        const all = entries();
        const terms = norm(query).trim().split(/\s+/).filter(Boolean);
        if (terms.length) {
            const hits = all.filter((e) => {
                const hay = norm([e.title, e.text, e.keywords, e.tags.join(' '), CAT_LABEL[e.cat], ...e.facts.flat(), ...e.lists.flatMap((l) => l.items)].join(' '));
                return terms.every((t) => hay.includes(t));
            });
            if (!hits.length) return `<div class="fg-empty"><b>Nothing found for “${esc(query)}”.</b><p>Try searching for Warden, monolith, Zone Tier, seed, horde, handcar, thermals, or 5.56.</p></div>`;
            return `<p class="fg-count">${hits.length} result${hits.length === 1 ? '' : 's'} for “${esc(query)}”</p>` +
                CATS.map(([id, label]) => {
                    const items = hits.filter((e) => e.cat === id);
                    return items.length ? `<section class="fg-section"><h3>${esc(label)} <small>${items.length}</small></h3><div class="fg-grid">${items.map(cardHtml).join('')}</div></section>` : '';
                }).join('');
        }
        const cat = CATS.find(([id]) => id === category) || CATS[0];
        const items = all.filter((e) => e.cat === cat[0]);
        return `<div class="fg-intro"><h3>${esc(cat[1])}</h3><p>${esc(cat[3])}</p></div><div class="fg-grid">${items.map(cardHtml).join('')}</div>`;
    }

    function render(query = '', category = 'start') {
        if (category === 'all') category = 'start';
        const all = entries();
        const counts = Object.fromEntries(CATS.map(([id]) => [id, all.filter((e) => e.cat === id).length]));
        return `<div class="fg">
            <nav class="fg-rail sv-scroll" aria-label="Field guide sections">
                ${CATS.map(([id, label, glyph, intro]) => `<button class="fg-cat ${!query && id === category ? 'active' : ''}" data-act="legendCat" data-arg="${id}" data-tip-title="${esc(label)}" data-tip="${esc(intro)}">
                    ${BO.SurvivalIcons.named(glyph, 'currentColor', 16)}<span>${esc(label)}</span><em>${counts[id]}</em></button>`).join('')}
            </nav>
            <section class="fg-main">
                <label class="fg-search"><span>⌕</span><input id="survival-legend-search" type="search" title="Search every Field Guide entry: items, regions, enemies, systems and controls" value="${esc(query)}" placeholder="Search ${all.length} entries: Warden, Archive, seeds, regions, items, enemies…" autocomplete="off" spellcheck="false"></label>
                <div id="survival-legend-results" class="fg-results sv-scroll" data-scroll="guide">${renderResults(query, category)}</div>
            </section>
        </div>`;
    }

    let hydrateToken = 0;
    function hydrate(root) {
        if (!root || !BO.EnemyInfo) return;
        const token = ++hydrateToken;
        const imgs = [...root.querySelectorAll('img[data-portrait]:not([src])')];
        const step = () => {
            if (token !== hydrateToken) return;
            const t0 = performance.now();
            while (imgs.length && performance.now() - t0 < 12) {
                const img = imgs.shift();
                if (img.isConnected) img.src = BO.EnemyInfo.portrait(img.dataset.portrait) || '';
            }
            if (imgs.length) setTimeout(step, 16);
        };
        step();
    }

    BO.SurvivalLegend = { render, renderResults, hydrate, getEntries: entries, categories: CATS };
})(window.BO);
