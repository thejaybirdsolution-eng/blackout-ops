/* ============================================================================
   BLACKOUT OPS — Survival Field Guide
   A searchable, categorised reference for every Survival element: controls,
   rules, threat escalation, vitals, every resource (where it is and what it
   yields), every item (where to get it and what it is used for), tools,
   stations, recipes, structures, biomes, landmarks, contacts, enemies,
   bosses, progression, activities, travel and troubleshooting.
   Entries are generated from the live game data, so they never go stale.
============================================================================ */
(function (BO) {
    'use strict';

    const CATS = [
        ['start', 'Getting started', 'flare', 'The first minutes, the core loop and how the zone escalates.'],
        ['controls', 'Controls', 'fist', 'Every key and mouse action. All keys can be rebound from the pause menu.'],
        ['threat', 'Days, threat & events', 'fire', 'How enemies scale by day and night, weather, Blood Moons and world events.'],
        ['vitals', 'Vitals & status', 'flask', 'Health, food, water, temperature, radiation and status effects — what drains them and what fixes them.'],
        ['resources', 'Resources & gathering', 'pick', 'Every deposit in the zone: what tool it needs, what it yields and exactly where to find it.'],
        ['items', 'Items', 'chest', 'Every item: what it does, where to get it and what it is used for.'],
        ['tools', 'Tools', 'axe', 'Gathering tools: tiers, power, durability and what each can break.'],
        ['crafting', 'Crafting & stations', 'wrench', 'Crafting stations and every recipe, with ingredients and results.'],
        ['building', 'Building & base', 'build', 'Every structure you can place, what it costs and what it does.'],
        ['map', 'Biomes & landmarks', 'scroll', 'Every area and landmark: what is there and why to go.'],
        ['contacts', 'Contacts & trades', 'leaf', 'Every contact: where they are, what they trade, gifts and contracts.'],
        ['enemies', 'Enemies', 'blade', 'Every infected type. Hover a card for its full dossier and look.'],
        ['bosses', 'Bosses & rivals', 'rifle', 'Zone bosses and PMC rivals: where they appear and how to beat them.'],
        ['progression', 'Progression', 'rune', 'Sites of Grace, attributes, talismans, tech, infusions, schematics and career.'],
        ['activities', 'Activities', 'seed', 'Gardening, water, fishing, repeaters, surveys, dispatch routes and caches.'],
        ['travel', 'Travel', 'gear', 'Vehicles, the locomotive, gliders and fast travel.'],
        ['rules', 'Modes & rules', 'tech', 'Operations, difficulties, presets, enemy pools and every modifier.'],
        ['help', 'Troubleshooting', 'unknown', 'Why you cannot build, craft, save, travel or extract — and the fix.']
    ];
    const CAT_LABEL = Object.fromEntries(CATS.map(([id, label]) => [id, label]));
    const STATION = { hand: 'By hand (anywhere)', bench: 'Workbench (Relay shelter or a crafting table)', campfire: 'Campfire (or the Relay shelter stove)', kiln: 'Stone kiln' };
    const STATION_SHORT = { hand: 'By hand', bench: 'Workbench', campfire: 'Campfire', kiln: 'Kiln' };
    const TOOL_NAME = { axe: 'axe', pick: 'pickaxe', shovel: 'shovel' };
    const AREA_NOTES = {
        relay: 'Tier 1 starting sanctuary. Workshop shelter (workbench and stove), key contacts, garden beds, a water filter, timber, stones, fiber, the Relay Sanctuary Grace and the 16 m Glider Launch Tower.',
        pine: 'Tier 1 western woods across the central highway. Pine trees, fiber roots, bitterleaf, the Scout Vale rescue beacon, a repeater, the Pinebreak cistern fishing spot, tactical ziplines and the Pinebreak Glade Grace.',
        freight: 'Tier 1 eastern rail yards on the 1,100 m Grand Rail Loop. The freight cache, the locomotive, ammunition and vehicle traders, a repeater and the Freight Overpass Grace.',
        basin: 'Tier 2 eastern wetland around the dam. Clay, copper and buried salvage. Opening the dam floods a 120 × 120 m basin for good — scavenge first.',
        airfield: 'Tier 2 southeastern Derelict Airfield. Long concrete runway, hangar ruins, an 11 m ATC watchtower, supply drop zone, fuel/salvage caches, and iron/copper deposits.',
        frost: 'Tier 3 locked northwest quarry (survival level 3 or breach gate early). Hardwood, boulders, quartz, buried salvage and the Pale Maul boss (challenge it via Kestrel). Freezing at night.',
        cinder: 'Tier 3 locked southeast flats (survival level 5 or breach gate early). Coal, iron, copper and quartz, and the Cinder Regent boss (challenge it via Ember). Hot: you drink faster.',
        radar: 'Tier 2 northeast Radar Ridge plateau (11 m elevation). Satellite arrays, quartz, deep crystal veins, Site of Grace and high-value salvage.',
        trench: 'Tier 3 research facility below the 60 × 85 m central ramp. Ore veins, the Apex Guardian and the Aether core. Radiation builds up down here — bring a filter and light.',
        ridge: 'Tier 2 Slateback Ridge: a switchback climb up to a 14 m plateau and 20 m summit with rich ore, hardwood, the Mason and Cartographer contacts, a survey cairn and the Summit Grace.',
        cavern: 'Tier 3 Echo Cavern, deep west of the research trench. Dark and irradiated, with luminous quartz, copper and the deep Resonant Geode guarded by the Resonant Sentinel.'
    };
    const SITE_INFO = {
        shelter: 'Your base of operations. Works as a workbench and a campfire stove; resting restores composure, and your extracted Safe-House Stash can be withdrawn at Relay.',
        hospital: 'Search it once for 3 salvage, 1 MRI coil, 2 cloth and 1 trauma kit. The MRI coil powers the coil prototype weapon.',
        dam: 'Open the spillway to flood the 120 × 120 m freight basin permanently. Anything standing in the basin is crushed. Needed for the Spillway Test contract.',
        depot: 'Search it once for 4 salvage, 2 fuel, a ration, an extra lethal and an MP5 carbine with 60 rounds.',
        train: 'Restore it for 5 salvage and 2 fuel, then ride the 1,100 m Grand Rail Loop around the Exclusion Zone at 22 m/s. Interact again to step off.',
        bunker: 'The Aether core lies at the bottom of the research trench. Defeat the Apex Guardian first (Core Expedition).',
        lookout: 'Evac Ridge. Call extraction here once your objective is complete, then hold the position until the timer ends.',
        squadmate: 'Rescue Scout Vale, who then fights alongside you in the western sector.'
    };
    const VITALS = [
        ['Health', 'plate', 'Your life. At 0 you fall: with a kindled Site of Grace or a field bed you can respawn (losing carried runes at a recoverable echo); otherwise the expedition ends.',
            'Regenerates 1.2/s while food and water are both 75% or higher (and you are not bleeding).', ['Trauma kit (+55)', 'Herbal dressing (+27, stops bleeding)', 'Aether Flask (+50, refills at Grace)', 'Hearty stew (+25)', 'Aether stim (+45)', 'Sleeping at a Grace or bed (full)']],
        ['Food', 'can', 'Drains about 0.11% per second (about 15 minutes from full). At 0 you lose 1 health per second.',
            'Fast Metabolism doubles the drain.', ['Field ration (+35)', 'Hearty stew (+65)', 'Hot meal at a campfire/shelter (+55)']],
        ['Water', 'bottle', 'Drains about 0.09% per second (faster above 31°C, e.g. Cinder Flats). At 0 you lose 1 health per second.',
            'Hand pumps refill your bottles for free.', ['Filtered water (+50)', 'Bitterleaf tea (+25)', 'Hearty stew (+35)', 'Field espresso (+20)', 'Thermal broth (+20)']],
        ['Temperature', 'fire', 'Follows the area and time of day: about 21°C on the lowlands, 10°C underground, -4°C in Frostline Quarry, 36°C in Cinder Flats, 9°C colder at night (19°C with Sub-zero Nights). Below 2°C you lose stamina; below -3°C you lose health.',
            'Standing within 5.5 m of a campfire, kiln, torch, beacon or kindled Grace adds 15°C.', ['Thermal spiced broth (+18°C)', 'Hearty stew (+10°C)', 'Lead-Lined Zone Charm (halves cold drain)']],
        ['Radiation', 'mask', 'Builds up underground (trench and cavern) and in flood water, and falls slowly on the surface. Above 75 it costs 2 health per second.',
            'A respirator filter cuts buildup by 82% for two minutes. Arcane ranks and the Lead-Lined Charm reduce it.', ['Respirator filter', 'Bitterleaf tea (-19)', 'Antibiotic elixir (-30)']],
        ['Composure', 'cup', 'Falls in darkness. Under 30 your aim sways.',
            'A hot meal keeps it full for two minutes; resting restores it.', ['Hot meal', 'Bitterleaf tea (+36)', 'Field espresso (+25)', 'Resting at the shelter or a bed']],
        ['Bleeding', 'bandage', 'Costs 2 health per second until it wears off. Caused by some infected hits (Bio-Toxic Hits modifier).',
            'Stops on its own after a few seconds.', ['Herbal dressing', 'Antibiotic elixir', 'Aether Flask']],
        ['Infection', 'vial', 'Builds with bio-toxic hits. At 70 or more it costs 2 health per second.',
            'The flask removes 35 per drink.', ['Antibiotic elixir (cures)', 'Aether Flask (-35)', 'Resting at a Grace (cures)']],
        ['Stamina', 'flare', 'Spent on sprinting, dodge rolls and guarding. Recovers when you stop.',
            'Endurance ranks, the Turtle Emblem talisman and Rested Comfort speed it up.', ['Field espresso', 'Aether stim', 'Stamin-Up elixir']],
        ['Armor', 'plate', 'Absorbs damage before health. Insert spare plates with your armor plate key.',
            'Armor plates are traded by Rowan, Suri and Kestrel.', ['Armor plate (trade)', 'Armored Insertion modifier']]
    ];

    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const norm = (v) => String(v ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
    const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
    const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;

    function areaAt(x, y, z) {
        if (BO.Zone?.regionAt) return BO.Zone.regionAt(x, z);
        if (BO.SurvivalWorld?.areaAt) return BO.SurvivalWorld.areaAt(x, y, z) || BO.SurvivalCampaignData.areas[0];
        const areas = BO.SurvivalCampaignData.areas;
        return areas.find((zone) => zone.id === 'relay') || areas[0];
    }

    function build() {
        const frontier = BO.SurvivalFrontierData;
        const campaign = BO.SurvivalCampaignData;
        const base = BO.SurvivalData;
        const rules = BO.SurvivalRules;
        const deep = BO.SurvivalDeepData || {};
        const acts = BO.SurvivalActivitiesData || {};
        const info = BO.SurvivalItemInfo || {};
        const Ic = BO.SurvivalIcons;
        const kb = BO.Settings.getKeybinds();
        const key = (a) => BO.Settings.keyLabel(kb[a]);
        const name = (id) => frontier.items[id]?.[0] || frontier.tools[id]?.name || id;
        const amounts = (c) => Object.entries(typeof c === 'number' ? { scrap: c } : (c || {})).filter(([, n]) => n > 0).map(([id, n]) => n + ' ' + name(id)).join(', ');
        const out = [];
        const add = (e) => { out.push({ tags: [], facts: [], lists: [], ...e }); };
        const icon = (glyph, color) => Ic.named(glyph, color || '#9fe0c9', 26);

        /* ---------- derived lookups ---------- */
        const deposits = frontier.deposits || [];
        const depositAreas = {};
        for (const d of deposits) {
            const a = areaAt(d.x, d.y, d.z);
            (depositAreas[d.kind] ||= {});
            depositAreas[d.kind][a.name] = (depositAreas[d.kind][a.name] || 0) + 1;
        }
        const areaList = (kind) => Object.entries(depositAreas[kind] || {}).sort((a, b) => b[1] - a[1]).map(([n, c]) => n + ' ×' + c);
        const contactArea = (npc) => campaign.areas.find((a) => a.id === npc.area)?.name || npc.area;
        const allRecipes = [
            ...frontier.recipes.map((r) => ({ ...r, kind: 'frontier' })),
            ...base.recipes.map((r) => ({ ...r, kind: 'legacy', station: r.id === 'cook' ? 'campfire' : 'bench', desc: r.detail, gain: r.id === 'medkit' ? { medkits: 1 } : {} }))
        ];
        const sources = {};
        const uses = {};
        const src = (id, text) => { if (!id) return; (sources[id] ||= new Set()).add(text); };
        const use = (id, text) => { if (!id) return; (uses[id] ||= new Set()).add(text); };
        for (const [kind, r] of Object.entries(frontier.resources)) {
            const req = r.tool ? (r.tier <= 1 ? ' (best with ' + an(TOOL_NAME[r.tool]) + '; bare hands work slowly)' : ' (needs a tier ' + r.tier + ' ' + TOOL_NAME[r.tool] + ')') : ' (by hand)';
            const where = areaList(kind);
            for (const id of Object.keys(r.gain)) src(id, 'Gather ' + r.name + req + (where.length ? ' — ' + where.join(', ') : ''));
        }
        for (const r of allRecipes) {
            for (const id of Object.keys(r.gain || {})) src(id, 'Craft: ' + r.name + ' (' + STATION_SHORT[r.station] + ')');
            for (const [id, n] of Object.entries(r.cost || {})) use(id, r.name + ' (' + n + ', ' + STATION_SHORT[r.station] + ')');
        }
        for (const [tid, t] of Object.entries(frontier.tools)) for (const [id, n] of Object.entries(t.cost)) use(id, t.name + ' (' + n + ')');
        for (const b of campaign.build) for (const [id, n] of Object.entries(typeof b.cost === 'number' ? { scrap: b.cost } : b.cost)) use(id, 'Build ' + b.name + ' (' + n + ')');
        for (const npc of campaign.contacts) {
            for (const sid of npc.shop || []) {
                const st = campaign.stock[sid];
                if (!st) continue;
                for (const id of Object.keys(st.gain || {})) src(id, 'Trade with ' + npc.name + ' (' + contactArea(npc) + ') for ' + amounts(st.cost));
                for (const [id, n] of Object.entries(st.cost)) use(id, 'Trade currency: ' + st.name + ' from ' + npc.name + ' (' + n + ')');
            }
            for (const id of Object.keys(npc.gift || {})) src(id, 'Free gift from ' + npc.name + ' (' + contactArea(npc) + ')');
        }
        const lootSrc = (items, text) => { for (const id of Object.keys(items || {})) src(id, text); };
        lootSrc({ scrap: 3, coil: 1, cloth: 2, medkits: 1 }, 'Field hospital search (once)');
        lootSrc({ scrap: 4, fuel: 2, rations: 1 }, 'Freight siding cache (once)');
        lootSrc({ scrap: 1, cloth: 1, fuel: 1, rations: 1 }, 'Salvage caches — 14 marked crates around the zone (once each)');
        for (const sh of acts.shore || []) for (const l of sh.loot) lootSrc(l, 'Fishing haul at ' + sh.name + ' (weighted salvage line)');
        for (const pl of acts.plots || []) lootSrc(pl.loot, 'Harvest the ' + pl.name + ' (Relay garden)');
        for (const sv of acts.surveys || []) lootSrc(sv.loot, 'Survey landmark: ' + sv.name);
        for (const rt of acts.routes || []) lootSrc(rt.reward, 'Dispatch route reward: ' + rt.name);
        lootSrc({ wire: 3, fuel: 2, medkits: 2 }, 'Reward for powering all three repeaters');
        lootSrc({ scrap: 3, medkits: 1, fuel: 1, cloth: 2 }, 'Weather balloon supply drops (4 landing sites)');
        lootSrc({ cropSeeds: 3, freshWater: 2 }, 'Starter crops from the Relay dispatch board');
        lootSrc({ freshWater: 1 }, 'Hand pumps (Relay, Spillway, Pinebreak, Airfield) — free, refill over time');
        lootSrc({ freshWater: 1 }, 'Hydro-collector you build');
        lootSrc({ ingot: 1, scrap: 1 }, 'Auto-smelter you build');
        lootSrc({ aetherShard: 3, quartz: 3, iron: 2 }, 'Aether meteors (purple beacon on the map)');
        lootSrc({ aetherShard: 2, scrap: 4, medkits: 1 }, 'Boss spoils pouch and surviving a Blood Moon');
        lootSrc({ scrap: 1, cloth: 1, herbs: 1, fiber: 1 }, 'Random drops from defeated enemies');
        lootSrc({ scrap: 1 }, 'Every third kill');
        lootSrc({ timber: 3, resin: 1 }, 'Felling the tall perimeter trees (bag drops where they fall)');
        lootSrc({ scrap: 2, timber: 1 }, 'Dismantling your own structures');
        use('fuel', 'Fast travel between discovered areas (1 each)');
        use('fuel', 'Lighting a quartz lantern (1 each)');
        use('fuel', 'Restoring the locomotive (2)');
        use('scrap', 'Restoring the locomotive (5)');
        use('scrap', 'Repairing all your structures (1)');
        use('wire', 'Powering a repeater tower (1, with 1 fuel)');
        use('fuel', 'Powering a repeater tower (1, with 1 wire)');
        use('freshWater', 'Watering garden beds');
        use('cropSeeds', 'Planting garden beds');
        use('quartz', 'Aether infusions (2 each)');
        use('aetherShard', 'Aether infusions (1 each)');
        use('relic', 'Hauler frame pack');
        use('coil', 'Coil prototype weapon');
        use('salvageLine', 'Fishing at the three waterside stations');
        for (const sch of deep.weaponSchematics || []) {
            for (const [id, n] of Object.entries(sch.cost || {})) use(id, 'Forge ' + sch.name + ' (' + n + ', Workbench)');
        }
        use('ingot', 'Weapon Mk II (2) / Mk III (3) upgrade at Workbench');
        use('scrap', 'Weapon Mk II upgrade (3, Workbench)');
        use('aetherShard', 'Weapon Mk III upgrade (1, Workbench)');
        use('wire', 'Weapon Mk III upgrade (2, Workbench)');
        use('torch', 'Press ' + key('survLight') + ' to burn for 90 s of portable light');
        use('lantern', 'Press ' + key('survLight') + ' to illuminate for 4 min (consumes 1 fuel)');
        use('caveMap', 'Reference notes pointing from Research Trench into Echo Cavern');

        /* ---------- getting started ---------- */
        const safe = rules.openingSeconds || 60;
        add({ cat: 'start', title: 'Your first minute', icon: icon('flare'), text: 'Nothing hostile spawns for the first ' + safe + ' seconds (120 with Extended Safe Start), and every Survival screen pauses the game.',
            lists: [{ h: 'Do this', items: ['Pick up fallen branches, loose stones and fiber roots around the Relay (interact or punch them).',
                'Open Crafting (' + key('survCraft') + '): braid cord, then make a stone hatchet and a stone pickaxe. They go straight onto your hotbar.',
                'Kindle the Relay Sanctuary Grace beside the shelter for a free Tech Point and a respawn point.',
                'Spend the Tech Point in Skills (' + key('survSkills') + ').',
                'Check your objective in the Journal (' + key('survJournal') + ').'] }] });
        add({ cat: 'start', title: 'The core loop', icon: icon('build'), text: 'Gather → craft better tools → reach better deposits → build a base and stations → research tech and level attributes → beat bosses → complete your operation and extract at Evac Ridge.' });
        add({ cat: 'start', title: '20× Exclusion Zone & Risk Tiers', icon: icon('scroll'), tags: ['500 × 450 m', '11 biomes'], text: 'The Exclusion Zone spans 500 × 450 m (225,000 m²) across 11 interconnected biomes divided into 3 risk-reward tiers. Deep biomes grant higher XP and Aether rune yields alongside richer deposits and tougher enemies.',
            facts: [['Tier 1 (Safe Belt)', 'Relay, Pinebreak, Freight (1.0× rewards)'], ['Tier 2 (Frontier)', 'Basin, Airfield, Radar Ridge, Slateback (1.35×)'], ['Tier 3 (Hotzone)', 'Frostline, Cinder, Trench, Echo Cavern (1.75×)']] });
        add({ cat: 'start', title: 'Bare hands vs. tools', icon: icon('fist'), text: 'Bare hands break branches, stones, fiber, tier-1 trees and rocks, timber walls and even standing trees — at a quarter of a stone tool\'s speed. Tier-2 deposits (copper, quartz, hardwood, buried salvage) need the right tool. Hold a tool on the hotbar and click (or hold) to swing it.',
            facts: [['Hand power', '0.25 per hit'], ['Stone tool', '1 per hit (4× faster)'], ['Iron tool', '2 per hit'], ['Drill / Aether', '3–4 per hit']] });
        add({ cat: 'start', title: 'The hotbar', icon: icon('chest'), text: 'Ten slots for weapons, tools and usable items. Number keys select a slot and the mouse wheel cycles through all ten. An empty slot is bare hands. New tools and supplies are added automatically; drag things around in the Inventory, or select an item and press a number key.' });
        add({ cat: 'start', title: 'Saving & dying', icon: icon('beacon'), text: 'Save from the Journal or by sleeping, whenever no enemy is within 9 m (autosave does this every 45 s if enabled). Falling with a kindled Grace or a field bed lets you respawn there; your carried runes drop at a Lost Aether Echo you can reclaim. Iron Expedition disables saving and respawning.' });

        /* ---------- controls ---------- */
        const ctl = (title, k, text) => add({ cat: 'controls', title, icon: icon('fist'), tags: [k], text });
        ctl('Rebind any key', 'PAUSE', 'Pause and choose Controls & Keybinds (or Settings › Controls). Conflicting keys swap automatically, and ESC always pauses.');
        ctl('Move & sprint', [key('forward'), key('left'), key('back'), key('right')].join('/'), key('sprint') + ' sprints, ' + key('jump') + ' jumps and mantles, ' + key('crouch') + ' crouches (quiet, harder to detect) or slides while sprinting.');
        ctl('Dodge roll', key('survDodge'), 'A quick roll in your movement direction with 0.34 s of invulnerability. Costs stamina.');
        ctl('Hotbar', key('hotbar1') + '–' + key('hotbar10'), 'Select a hotbar slot. The mouse wheel cycles all ten.');
        ctl('Fire / punch / swing / use', 'LMB', 'Fires a weapon, punches with bare hands (hold and release for a heavy haymaker), swings a held tool (hold to keep swinging) or uses a held consumable.');
        ctl('Aim / guard & parry', 'RMB', 'Aims a firearm. With bare hands it raises a guard that blocks 68% of frontal damage; raise it within 0.28 s of a hit for a Perfect Parry (stuns the attacker and opens a 2.8× riposte).');
        ctl('Interact / gather', key('interact'), 'Gather (with your best tool, or slowly by hand), talk, open, kindle, pump, plant, cast and mine.');
        ctl('Inventory', key('survInventory'), 'Backpack, hotbar, equipment, tools and talismans.');
        ctl('Crafting', key('survCraft'), 'All recipes. Station recipes unlock within 4 m of the station.');
        ctl('Build', key('survBuild'), 'Place structures in front of you (detonates C4 first if you have charges out).');
        ctl('Map & travel', key('survMap') + ' / ' + key('survTravel'), 'Field map, fast travel and vehicles.');
        ctl('Skills', key('survSkills'), 'Tech tree, attributes and infusions.');
        ctl('Journal', key('survJournal'), 'Objective, challenges, contracts, activities, saving and career.');
        ctl('Field guide', key('survLegend'), 'This guide.');
        ctl('Aether Flask', key('survFlask'), 'Heal 50+ and stop bleeding. Refill at a Grace or by sleeping.');
        ctl('Light', key('survLight'), 'Light or put out a torch (90 s) or lantern (4 min, 1 fuel).');
        ctl('Reload / inspect / plate / melee', [key('reload'), key('inspect'), key('survPlate'), key('melee')].join(' / '), 'Reload or clear a jam · read your magazine · insert an armor plate · quick punch or tool swing.');

        /* ---------- threat ---------- */
        const diffStd = rules.difficulties.standard;
        const rosterN = BO.ZombiesData.ORDERED_PROGRESSION.length;
        const rows = [1, 2, 3, 4, 5, 6, 7].map((d) => { const t = rules.threat(d, false, { encounterRate: 1 }, diffStd, rosterN); const n = rules.threat(d, true, { encounterRate: 1 }, diffStd, rosterN); return 'Day ' + d + ': ' + t.cap + ' roaming (' + n.cap + ' at night) from the ' + t.poolSize + ' weakest types'; });
        add({ cat: 'threat', title: 'Escalating days', icon: icon('fire', '#f2b45a'), text: 'A new day starts at midnight. Day 1 is quiet: only the 4 weakest infected roam, about 3 at once. Each day unlocks stronger infected, makes them a little tougher (+7% health and +5% damage per day) and raises how many may roam. Difficulty scales the final cap; Encounter Rate scales every day.', lists: [{ h: 'Standard difficulty', items: rows }] });
        add({ cat: 'threat', title: 'Night', icon: icon('fire', '#7cc4f0'), text: 'Night runs 19:00–06:00. It allows about 35% more roamers, unlocks two extra enemy types, gets darker (composure drains) and colder (9°C, or 19°C with Sub-zero Nights). Relentless Nights doubles night spawning.' });
        add({ cat: 'threat', title: 'PMC scavengers & Commander Sable', icon: icon('rifle', '#f2b45a'), text: 'Two armed PMC scavengers move into Freight Works on day 2. Commander Sable (225 HP, rifle) arrives on day 3 — or at once in Rival Bounty. Below 70 HP Sable retreats and returns 52 s later with a machine gun and an escort. With the PMC Occupation pool, more patrols join each day (up to 8). No Roaming PMC Patrols disables them.' });
        add({ cat: 'threat', title: 'Weather', icon: icon('drop', '#9fd4ff'), text: 'With dynamic weather on, a 3-minute cycle rolls through: Overcast → Ash rain → Radiation fog → Clearing.', lists: [{ h: 'Effects', items: ['Ash rain: worn firearms (80+ shots) may jam — press reload to clear.', 'Radiation fog: thick fog, more radiation in contaminated areas, and from day 3 Mimics may call out on the radio pretending to be survivors.', 'Clearing / Overcast: no special effects.'] }] });
        add({ cat: 'threat', title: 'Crimson Blood Moon', icon: icon('fire', '#ef6b6b'), text: 'Every third night (nights 3, 6, 9…) — or every night in Blood Moon Defense or with the Crimson Blood Moons modifier — the sky turns red for 75 s and infected surge in every 11 s. Survive it for 250 runes, 2 Aether shards, 4 salvage and a trauma kit.' });
        add({ cat: 'threat', title: 'Aether meteors', icon: icon('crystal', '#c79bff'), text: 'After about 3 minutes, and every ~3 minutes after one is mined, a meteor crashes at one of eight surface craters across the valley (shown on the map). Mine it for 3 Aether shards, 3 quartz, 2 iron, 160 runes and a permanent weapon blueprint.' });
        add({ cat: 'threat', title: 'Weather balloon drops', icon: icon('flare', '#ffb36b'), text: 'Supply caches drift down at one of four landing sites (including the Derelict Airfield runway) every few minutes (sooner with repeaters powered or an orbital flare). Each holds 3 salvage, a trauma kit, fuel and 2 cloth, and expires if you wait too long.' });
        add({ cat: 'threat', title: 'Noise & stealth', icon: icon('fist'), text: 'Gunfire, mining drills, explosions and vehicles make noise, which draws extra roamers. Crouching while quiet makes you hard to spot; crouched hits on an unaware enemy from behind deal a 3.5× stealth takedown. A suppressor keeps gunfire quiet.' });

        /* ---------- vitals ---------- */
        for (const [title, glyph, text, note, remedies] of VITALS) {
            add({ cat: 'vitals', title, icon: icon(glyph), text, facts: [['Note', note]], lists: [{ h: 'What helps', items: remedies }] });
        }
        add({ cat: 'vitals', title: 'Peak condition & Rested Comfort', icon: icon('beacon'), text: 'Keeping food and water at 75%+ gives +8% speed and slow health regeneration. Standing near a fire or Grace, eating stew or sleeping grants Rested Comfort (+18% stamina recovery).' });

        /* ---------- resources ---------- */
        for (const [kind, r] of Object.entries(frontier.resources)) {
            const tierTool = r.tool ? 'Tier ' + r.tier + ' ' + TOOL_NAME[r.tool] : 'None';
            const hand = !r.tool ? '1 hit' : r.tier <= 1 ? Math.ceil(r.strokes / 0.25) + ' punches (slow)' : 'Not possible';
            const toolHits = r.tool ? Object.values(frontier.tools).filter((t) => t.family === r.tool && t.level >= r.tier).sort((a, b) => a.level - b.level).map((t) => t.name + ': ' + plural(Math.ceil(r.strokes / t.power), 'hit')) : [];
            const locs = deposits.filter((d) => d.kind === kind);
            add({ cat: 'resources', title: r.name, icon: Ic.svg(r.tool === 'axe' ? 'log' : r.tool === 'pick' ? 'ore' : r.tool === 'shovel' ? 'clay' : kind === 'herbs' || kind === 'roots' ? 'leaf' : kind === 'stones' ? 'stone' : 'log', '#' + r.color.toString(16).padStart(6, '0'), 26),
                tags: [r.tool ? TOOL_NAME[r.tool] : 'by hand', plural(locs.length, 'spot')],
                text: (r.tool ? (r.tier <= 1 ? 'Best broken with ' + an(TOOL_NAME[r.tool]) + '. Bare hands also work, four times slower.' : 'Needs a tier ' + r.tier + ' ' + TOOL_NAME[r.tool] + ' or better — bare hands cannot break it.') : 'Pick it up by hand: press interact or punch it.') +
                    ' Depleted deposits regrow after ' + (r.tool ? '8 minutes' : 'about 3 minutes') + ' (only while you are more than 10 m away).' + (kind === 'deep' ? ' Striking it awakens the Resonant Sentinel boss; defeat it to mine the core.' : ''),
                facts: [['Yields', amounts(r.gain)], ['Tool', tierTool], ['By hand', hand]],
                lists: [{ h: 'Where to find it', items: areaList(kind).length ? areaList(kind) : ['Nowhere on the surface'] }, ...(toolHits.length ? [{ h: 'Hits needed', items: toolHits }] : [])],
                keywords: kind + ' where find location ' + Object.keys(r.gain).map(name).join(' ') });
        }
        add({ cat: 'resources', title: 'Tall perimeter trees', icon: icon('log', '#7fb07a'), text: 'The tall pines along the east and west edges of the map can be felled with an axe (or slowly by hand). They drop 3 timber and 1 resin where they land — and crush anything they fall on.' });
        add({ cat: 'resources', title: 'Destructible walls', icon: icon('wall'), text: 'Timber walls (70 HP) and masonry (170 HP) around the depots and trench can be broken with tools, explosives, fire or fists. Bullets do only 37% damage to masonry. Breaking the watchtower supports collapses the deck onto anything below.' });

        /* ---------- items ---------- */
        const usable = BO.SurvivalHotbar ? BO.SurvivalHotbar.usable : new Set();
        for (const [id, [nm, cat, kg]] of Object.entries(frontier.items)) {
            const s = [...(sources[id] || [])];
            const u = [...(uses[id] || [])];
            add({ cat: 'items', title: nm, icon: Ic.item(id, 26), tags: [cat, kg + ' kg', ...(usable.has(id) ? ['usable'] : [])],
                text: (info[id] || cat + '.') + (usable.has(id) ? ' Can be held on the hotbar and used with the fire button.' : ''),
                lists: [{ h: 'Where to get it', items: s.length ? s : ['Not obtainable in the field'] }, { h: 'Used for', items: u.length ? u : (usable.has(id) ? ['Consumed when used'] : ['—']) }],
                keywords: id + ' ' + cat });
        }

        /* ---------- tools ---------- */
        for (const [id, t] of Object.entries(frontier.tools)) {
            const works = Object.values(frontier.resources).filter((r) => r.tool === t.family && r.tier <= t.level).map((r) => r.name);
            add({ cat: 'tools', title: t.name, icon: Ic.tool(id, 26), tags: ['Tier ' + t.level, t.family],
                text: 'A tier ' + t.level + ' ' + TOOL_NAME[t.family] + '. Each gathering hit removes ' + t.power + ' (bare hands: 0.25) and costs 1 durability. Hitting an enemy with it deals ' + ({ axe: 58, pick: 52, shovel: 40 }[t.family] + (t.level - 1) * 14) + ' damage.',
                facts: [['Durability', t.wear], ['Power', t.power + ' (' + Math.round(t.power / 0.25) + '× hands)'], ['Station', STATION_SHORT[t.station]], ['Cost', amounts(t.cost)]],
                lists: [{ h: 'Can break', items: works }] });
        }
        add({ cat: 'tools', title: 'Repairing tools', icon: icon('wrench'), text: 'A field repair kit (2 salvage + 1 cord, by hand) restores 24 durability to your held or equipped tool. A tool at 0 durability still works as a weak bare-hand-speed swing until repaired or replaced. Long-Lasting Tools and the Unbreaking infusion slow wear.' });

        /* ---------- crafting ---------- */
        for (const st of ['hand', 'bench', 'campfire', 'kiln']) {
            const list = allRecipes.filter((r) => r.station === st).map((r) => r.name)
                .concat(Object.values(frontier.tools).filter((t) => t.station === st).map((t) => t.name));
            const how = { hand: 'Always available from the Crafting screen.', bench: 'The Relay shelter works as a workbench. Build your own crafting table (4 timber, 2 stone, 1 salvage). Also hosts weapon forging and Mk upgrades.',
                campfire: 'Build a campfire (2 timber, 3 stone). The Relay shelter stove also counts. Fires warm you too.', kiln: 'Build a stone kiln (6 stone, 3 clay).' }[st];
            add({ cat: 'crafting', title: 'Station: ' + STATION_SHORT[st], icon: icon({ hand: 'fist', bench: 'bench', campfire: 'fire', kiln: 'kiln' }[st]), text: how + ' Stand within 4 m of it to unlock its recipes.', lists: [{ h: list.length + ' recipes', items: list }] });
        }
        const techName = (tid) => deep.techTree?.find((n) => n.id === tid)?.name || tid;
        for (const r of allRecipes) {
            add({ cat: 'crafting', title: r.name, icon: Object.keys(r.gain || {})[0] ? Ic.item(Object.keys(r.gain)[0], 26) : icon('wrench'), tags: [STATION_SHORT[r.station], ...(r.tech ? ['Tech'] : [])],
                text: (r.desc || '') + (r.tech ? ' Requires the “' + techName(r.tech) + '” research.' : '') + (r.pack ? ' Upgrades your backpack (craft them in order).' : ''),
                facts: [['Ingredients', amounts(r.cost)], ['Makes', amounts(r.gain) || (r.pack ? frontier.packs[r.pack].name : 'Effect')], ['Station', STATION[r.station]]] });
        }
        for (const sch of deep.weaponSchematics || []) {
            add({ cat: 'crafting', title: 'Forge: ' + sch.name, icon: icon('rifle', '#f8d17a'), tags: ['Workbench', 'Weapon'], text: 'Forges this weapon at a workbench and equips it. Unlock via the “' + techName(sch.tech) + '” research, or find its schematic in boss spoils, rare enemy drops or meteors.', facts: [['Cost', amounts(sch.cost)], ['Ammo', sch.ammo > 1 ? sch.ammo + ' rounds' : 'Melee']] });
        }
        add({ cat: 'crafting', title: 'Weapon Mk II / III upgrades', icon: icon('rifle', '#fde68a'), tags: ['Workbench', 'Tech'], text: 'After researching the Weapon Mk II / III Bench, upgrade a firearm at a workbench: more damage, a bigger magazine and faster reloads.', facts: [['Mk II', '2 iron bars, 3 salvage'], ['Mk III', '3 iron bars, 1 Aether shard, 2 copper wire']] });
        for (const [i, p] of frontier.packs.entries()) add({ cat: 'crafting', title: 'Backpack: ' + p.name, icon: icon('chest'), tags: ['Tier ' + (i + 1)], text: i === 0 ? 'Your starting pack.' : 'Crafted at a workbench after the previous tier.', facts: [['Carry weight', p.weight + ' kg'], ['Unique stacks', p.slots]] });

        /* ---------- building ---------- */
        for (const b of campaign.build) {
            add({ cat: 'building', title: b.name, icon: Ic.build(b.id, 26), tags: [b.tech ? 'Tech: ' + techName(b.tech) : 'No research'], text: b.detail,
                facts: [['Cost', amounts(b.cost)], ['Size', b.size.map((v) => v.toFixed(1)).join(' × ') + ' m'], ...(b.tech ? [['Research', techName(b.tech)]] : [])] });
        }
        add({ cat: 'building', title: 'Build mode & snapping', icon: icon('build'),
            text: 'Choose a piece in the Build tab and press Build: a preview follows your aim. Structural pieces snap to a 2.8 m grid — foundations to the world grid on the ground, floors beside floors, walls onto floor edges or on top of other walls, upper floors and roofs onto wall tops. Furniture goes on the ground or on any floor.',
            lists: [{ h: 'Controls', items: ['Left mouse: place (stay in build mode to keep placing)', 'R: rotate furniture and free-standing walls', 'Right mouse, ' + key('survBuild') + ' or Esc: leave build mode'] }],
            facts: [['Range', '8 m'], ['Structure limit', '160 per expedition'], ['Not allowed', 'Threat 4+ regions, deep water, the Zone edge']] });
        add({ cat: 'building', title: 'Structural integrity', icon: icon('wall'),
            text: 'Every structural piece has support from 0–100%. Anything touching the ground is 100%. Each level up and each cell outward loses support, so tall towers and long overhangs need stone or extra walls underneath. Below 10% a piece cannot be placed — and if a supporting piece is destroyed, everything relying on it collapses along with any furniture on it.',
            facts: [['Timber', '−12% per level up, −30% per cell out'], ['Masonry & doors', '−6% per level up, −20% per cell out'], ['Colours in build mode', 'blue solid · green good · yellow weak · red failing']] });
        add({ cat: 'building', title: 'Horde nights', icon: icon('beacon', '#ff7b6b'),
            text: 'Every third night (every second with Brutal Nights) the Lantern pulses and a horde comes: three waves from one side of the compass, about 50 seconds apart. If you are within 75 m of your base they go for the base; otherwise they hunt you. They follow the cheapest route through your walls and tear through the weakest point, so a closed ring of masonry with a firing position beats a single strong wall.',
            lists: [{ h: 'Survive it', items: ['Watch the HUD forecast and the HORDE TONIGHT warning at dusk.', 'Build in masonry and close every gap — they mass wherever a wall is weakest.', 'Stand on an upper floor and shoot down; heavies and named infected wreck walls fastest.', 'Repair between waves from the Build tab (1 timber or brick per piece).', 'It ends when every wave is dead or at dawn: +XP and a commendation.'] }],
            facts: [['Timber wall', '220 HP'], ['Masonry wall', '560 HP'], ['Reinforced door', '420 HP']] });
        add({ cat: 'map', title: 'Climate & cold', icon: icon('fire', '#9fd4ff'),
            text: 'Every region has its own temperature. It drops about 4°C for every 10 m you climb, at night, in snow and blizzards, and when you are wet from swimming or rain. Below 2°C you lose stamina; below −3°C you take damage; below −10°C frostbite doubles it. Fires and torches warm you and dry you out quickly.',
            facts: [['Coldest', 'Frostline summit at night in a blizzard (−25°C or worse)'], ['Hottest', 'Cinder Refinery (31°C, drains water faster)'], ['Insulated thermals', '+12°C while carried (bench: 5 cloth, 3 fiber, 2 cord). Found in Frostline.']] });
        add({ cat: 'map', title: 'Toxic ash', icon: icon('mask', '#c9a27e'),
            text: 'The air around the Cinder Refinery — and ash rain anywhere when you are outside — fills your lungs. Past 40% toxicity you cough, which is loud enough to bring infected; past 70% you take damage. A filter (respirator) blocks it for two minutes and clears your lungs faster.',
            facts: [['Filters', 'Chemical stores, lab cabinets, Cinder loot, Cinder Regent'], ['Recovers', 'In clean air, faster with a filter']] });
        add({ cat: 'map', title: 'PMC garrisons', icon: icon('rifle', '#f2b45a'),
            text: 'From day 2, private military operators hold the freight warehouses, the yard office, the refinery control room, the turbine hall and the mine head. Shooting them raises an alarm: their siren is heard 170 m away and draws infected (let them fight each other), and three reinforcements arrive 30 seconds later. Clearing a garrison drops their supply cache and a weapon. They come back four days later.',
            facts: [['Garrison size', '3–4 plus one per three days'], ['Rewards', 'Ammo, a weapon, repair kits, regional gear']] });
        add({ cat: 'map', title: 'Freight handcar', icon: icon('gear', '#d6be8c'),
            text: 'A pump handcar waits at the Kessel platform on the northern freight line, which runs from Crash Valley past Kessel to the Cinder Refinery. Interact to board, hold W or S to pump (direction follows where you face), interact again to step off. It reaches about 45 km/h and runs down infected on the line, but everything nearby hears it.' });
        add({ cat: 'map', title: 'The Warden & the Lantern', icon: icon('beacon', '#d58bff'),
            text: 'With the campus research data in hand, touch the Lantern to wake its Warden (about 2,200 HP on Normal). Phase 1: it fights while its brood arrives every 20 seconds. Phase 2 (below 66%): the Lantern glows red for 3 seconds, then pulses — anything in its line of sight takes heavy damage and radiation, so get behind one of the basalt monoliths ringing the core. Phase 3 (below 33%): pulses every 9 seconds, radiation climbs and the Warden's slams throw you back. Leave the Crater (85 m) or die and it withdraws and recovers.',
            lists: [{ h: 'Endings', items: ['Seal it: the beam goes dark, 35% fewer roaming infected, no more horde nights. +6 commendations.', 'Extract the data: the world stays as it is; two shares of your pack go to the Archive stash. +4 commendations.', 'Seize it: the beam turns gold and infected notice you 60% less; unlocks the Lantern Keeper kit. +5 commendations.'] }],
            facts: [['After the ending', 'Finish the expedition, or keep exploring the changed Zone and finish later from the Journal']] });
        add({ cat: 'map', title: 'Regional guardians', icon: icon('beacon', '#d58bff'),
            text: 'Named heavy infected hold key sites and wake when you come within 70 m: the Butcher (Hollow Town school, day 2), the Den Mother (Pinebreak den, day 2), the Yard Colossus (Kessel crane, day 3), the Spillway Bloat (the dam, day 3), the Pale Maul (Frostline mine head, day 4), the Cinder Regent (flare stack, day 4) and the Warden at the Lantern. Each carries a campus keycard and unique spoils.' });
        add({ cat: 'building', title: 'Base level, repair & dismantle', icon: icon('wall'), text: 'Every three different structure types raise your base level (max 5). Repair damaged pieces within 14 m for 1 timber (timber pieces) or 1 brick (masonry) each, or dismantle your nearest piece within 4 m for a partial refund.' });

        /* ---------- map ---------- */
        for (const a of campaign.areas) {
            const here = (kind) => deposits.filter((d) => d.kind === kind && areaAt(d.x, d.y, d.z).id === a.id).length;
            const res = Object.entries(frontier.resources).map(([k, r]) => [r.name, here(k)]).filter(([, n]) => n).map(([n, c]) => n + ' ×' + c);
            const people = campaign.contacts.filter((n) => n.area === a.id).map((n) => n.name);
            const graces = (deep.shrines || []).filter((s) => s.area === a.id).map((s) => s.name);
            const breachNote = a.breachCost ? ' Or breach the gate early with ' + amounts(a.breachCost) + '.' : '';
            add({ cat: 'map', title: a.name, icon: Ic.svg('scroll', '#' + a.color.toString(16).padStart(6, '0'), 26), tags: ['Tier ' + (a.tier || 1), a.level > 1 ? 'Level ' + a.level : 'Open'],
                text: (AREA_NOTES[a.id] || '') + (a.level > 1 ? ' Its gate opens at survival level ' + a.level + '.' + breachNote : ''),
                lists: [{ h: 'Resources', items: res.length ? res : ['None'] }, { h: 'Contacts', items: people.length ? people : ['None'] }, ...(graces.length ? [{ h: 'Site of Grace', items: graces }] : [])],
                keywords: 'area biome zone tier' + (a.tier || 1) + ' ' + a.id });
        }
        for (const s of base.sites) add({ cat: 'map', title: s.name, icon: Ic.svg('build', '#' + s.color.toString(16).padStart(6, '0'), 26), tags: [areaAt(s.x, s.y, s.z).name], text: SITE_INFO[s.id] || s.label });

        /* ---------- contacts ---------- */
        for (const npc of campaign.contacts) {
            const trades = (npc.shop || []).map((sid) => campaign.stock[sid]).filter(Boolean).map((st) => st.name + ' — costs ' + amounts(st.cost) + (st.gain ? ' → ' + amounts(st.gain) : st.ammo ? ' → ' + st.ammo + ' rounds per weapon' : st.plates ? ' → 1 armor plate' : st.vehicle ? ' → vehicle' : ''));
            const lists = [];
            if (trades.length) lists.push({ h: 'Trades', items: trades });
            const extra = [];
            if (npc.gift) extra.push('Free gift on first visit: ' + amounts(npc.gift));
            if (npc.quest) extra.push('Contract “' + npc.quest[0] + '”: reach ' + npc.quest[2] + ' ' + npc.quest[1].replace(/_/g, ' ') + ' → ' + npc.quest[3] + ' XP, 2 salvage and a trauma kit');
            if (npc.special === 'helper') extra.push('Can be recruited to fight beside you');
            else if (npc.special) extra.push('Can summon the area boss for you to fight');
            if (extra.length) lists.push({ h: 'Also', items: extra });
            add({ cat: 'contacts', title: npc.name, icon: icon('leaf', '#8eea9d'), tags: [contactArea(npc)], text: '“' + npc.hint.trim() + '”', lists });
        }

        /* ---------- enemies ---------- */
        BO.ZombiesData.ORDERED_PROGRESSION.forEach((z, i) => {
            let day = 1;
            for (let d = 1; d < 40; d++) if (rules.threat(d, false, { encounterRate: 1 }, diffStd, rosterN).poolSize > i) { day = d; break; }
            const d = BO.ZombiesData.describe(z);
            add({ cat: 'enemies', title: z.name, enemy: z.id, icon: '', tags: ['Day ' + day, '★'.repeat(d.threat)],
                text: z.simpleDesc + ' ' + d.tip, facts: [['Health', z.hp], ['Speed', BO.EnemyInfo ? BO.EnemyInfo.speedLabel(z.speed) + ' (' + z.speed + ')' : z.speed], ['Attack', z.attack]],
                keywords: z.id + ' ' + z.rarity + ' ' + z.movementHabit + ' ' + z.attackType });
        });

        /* ---------- bosses ---------- */
        const bosses = [
            ['Apex Guardian', 'At the bottom of the research trench from the moment hostiles release (Core Expedition). Guards the Aether core.', '580'],
            ['Pale Maul', 'Challenge it by talking to Quarry Ward Kestrel in Frostline Quarry (survival level 3).', '720'],
            ['Cinder Regent', 'Challenge it by talking to Kiln Keeper Ember in Cinder Flats (survival level 5).', '980'],
            ['Resonant Sentinel', 'Wakes when you strike the deep Resonant Geode in Echo Cavern. Defeat it to mine the core (needed for the Hauler frame).', '820'],
            ['Ridge Breaker', 'Leads the final wave of a Ridge Siege at Evac Ridge.', '690']
        ];
        for (const [nm, where, hp] of bosses) add({ cat: 'bosses', title: nm, icon: icon('blade', '#f87171'), tags: ['Zone boss'], text: where + ' At half health it enrages (+25% speed and damage). Defeating any boss drops a spoils pouch (2 Aether shards, 4 salvage, a trauma kit, 120 runes, often a schematic) and grants a Tech Point.', facts: [['Base health', hp + ' × difficulty'], ['Hit damage', '32 × difficulty']] });
        add({ cat: 'bosses', title: 'Commander Sable', icon: icon('rifle', '#f2b45a'), tags: ['PMC rival'], text: 'Rival PMC commander with a rifle (225 HP). Arrives on day 3 (immediately in Rival Bounty). Retreats under 70 HP and returns 52 s later with a machine gun (290 HP) and an escort. Killing him is worth 150 XP.' });
        add({ cat: 'bosses', title: 'Mimics', icon: icon('crystal', '#c79bff'), tags: ['From day 3'], text: 'During radiation fog, a fast spectral infected may broadcast fake survivor calls (“Extraction here.”). Don\'t follow strange radio messages.' });

        /* ---------- progression ---------- */
        for (const s of deep.shrines || []) add({ cat: 'progression', title: s.name, icon: icon('beacon', '#fde047'), tags: [areaAt(s.x, s.y, s.z).name, 'Site of Grace'], text: 'Kindle it for +1 Tech Point and 50 XP (first time). Resting here restores health, refills your flask, cures bleeding and infection, sets your respawn point and lets you level attributes, sleep and warp between kindled Graces.' });
        for (const [id, a] of Object.entries(deep.attributes || {})) add({ cat: 'progression', title: 'Attribute: ' + a.name, icon: icon('rune', a.color), tags: ['Runes'], text: a.bonus + '. Raise attributes with Aether Runes at a Site of Grace or in Skills; each rank costs more than the last.' });
        for (const [id, t] of Object.entries(deep.talismans || {})) add({ cat: 'progression', title: 'Talisman: ' + t.name, icon: icon('beacon', t.color), tags: ['Talisman'], text: t.effect + ' Equip up to three in the Inventory or at a Grace.', facts: [['Found', t.location]] });
        for (const seed of deep.goldenSeeds || []) add({ cat: 'progression', title: seed.name, icon: icon('seed', '#fde047'), tags: [areaAt(seed.x, seed.y, seed.z).name], text: 'Permanently adds one Aether Flask charge (up to 6).' });
        for (const node of deep.techTree || []) add({ cat: 'progression', title: 'Tech: ' + node.name, icon: icon('tech', '#9fd4ff'), tags: ['Tier ' + node.tier, node.cost + ' TP'], text: node.desc + (node.req ? ' Requires “' + techName(node.req) + '”.' : ''), keywords: 'tech research' });
        for (const [id, inf] of Object.entries(deep.infusions || {})) add({ cat: 'progression', title: 'Infusion: ' + inf.name, icon: icon('crystal', '#c79bff'), tags: ['Altar'], text: inf.desc + ' Apply at an Aether infusion altar for 2 quartz, 1 Aether shard and 120 runes (two active at once).' });
        add({ cat: 'progression', title: 'Runes & Tech Points', icon: icon('rune', '#f2d07a'), text: 'Runes drop from every kill (28 infected, 55 PMC, 320 bosses) and from Blood Moons and meteors, boosted by Tier 2 (1.35×) and Tier 3 (1.75×) biome multipliers. Tech Points come from levelling up, kindling Graces and beating bosses.' });
        add({ cat: 'progression', title: 'Blueprints, Commendations & Mastery', icon: icon('tech', '#f2b45a'), tags: ['Persistent'], text: 'Weapon blueprints unlocked in-run persist permanently across all future expeditions. Earn Commendations from levelling up, defeating bosses, surviving Blood Moons and extracting — then spend them in the Career & Kits screen on 5 permanent Mastery perks (Logistics, Conditioning, Scavenger, Armorer, Navigator).' });
        add({ cat: 'progression', title: 'Deployment Kits & Safe-House Stash', icon: icon('chest', '#9fe0c9'), tags: ['Persistent'], text: 'Pick one of 5 Deployment Kits (Standard, Pathfinder, Sapper, Alchemist, Vanguard) in the Deployment screen to customize your starting load. Extracting safely at Evac Ridge banks salvage and meds into your Safe-House Stash, withdrawable at Relay Sanctuary in future runs.' });
        add({ cat: 'progression', title: 'Survival career', icon: icon('flare'), text: 'XP from discoveries, crafting, building, kills, contracts and challenges raises your survival level across expeditions (scaled by biome Tier). Level 2 unlocks the bicycle, 3 the pack horse and Frostline Quarry, 4 the glider, 5 Cinder Flats, 6 the rover.', lists: [{ h: 'Ranks', items: campaign.ranks.map(([lv, r]) => 'Level ' + lv + ': ' + r) }] });

        /* ---------- activities ---------- */
        for (const p of acts.plots || []) add({ cat: 'activities', title: p.name, icon: icon('seed'), tags: ['Garden'], text: 'Plant crop seeds, water with filtered water, wait about ' + p.grow + ' s, then harvest.', facts: [['Harvest', amounts(p.loot)]] });
        for (const p of acts.pumps || []) add({ cat: 'activities', title: p.name, icon: icon('bottle'), tags: [areaAt(p.x, p.y, p.z).name], text: 'Draw a free bottle of filtered water. It refills after a short wait. Leave a little pack room.' });
        for (const sh of acts.shore || []) add({ cat: 'activities', title: 'Fishing: ' + sh.name, icon: icon('hook'), tags: [areaAt(sh.x, sh.y, sh.z).name], text: 'Cast a weighted salvage line (2 materials, by hand), wait for the float to dip, then interact within 3.5 s.', lists: [{ h: 'Possible hauls', items: sh.loot.map(amounts) }] });
        for (const r of acts.relays || []) add({ cat: 'activities', title: r.name, icon: icon('generator'), tags: [areaAt(r.x, r.y, r.z).name], text: 'Power it with 1 copper wire and 1 fuel. All three powered: faster supply drops plus 3 wire, 2 fuel and 2 trauma kits.' });
        for (const sv of acts.surveys || []) add({ cat: 'activities', title: 'Survey: ' + sv.name, icon: icon('scroll'), tags: [areaAt(sv.x, sv.y, sv.z).name], text: 'Record this landmark for a one-time reward.', facts: [['Reward', amounts(sv.loot)]] });
        for (const rt of acts.routes || []) add({ cat: 'activities', title: 'Dispatch: ' + rt.name, icon: icon('flare'), tags: ['Relay board'], text: 'Accept at the Relay dispatch board, then visit: ' + rt.labels.join(' → ') + '.', facts: [['Reward', amounts(rt.reward)]] });
        add({ cat: 'activities', title: 'Salvage caches', icon: icon('chest', '#9caa83'), text: 'Fourteen marked crates around the zone (including Derelict Airfield, Radar Ridge and Research Trench). Each can be searched once for salvage, cloth, fuel or rations.' });

        /* ---------- travel ---------- */
        for (const v of campaign.vehicles) add({ cat: 'travel', title: v.name, icon: icon(v.id === 'glider' ? 'flare' : 'gear'), tags: ['Level ' + v.level], text: v.detail + ' Equip it from the map screen; unlocks at survival level ' + v.level + ' or by trading.', facts: [['On the road', '×' + v.speed + ' speed'], ['Off-road', '×' + v.offroad + ' speed']] });
        add({ cat: 'travel', title: 'Tactical Ziplines & 16 m Tower', icon: icon('flare', '#7ee8fa'), tags: ['28 m/s'], text: 'Six bidirectional ziplines span key canyons, highways and elevated ridges across the 500 × 450 m zone — interact at either anchor post to zip at 28 m/s. Climb the 16 m Glider Launch Tower east of Relay Sanctuary for sweeping valley flights.' });
        add({ cat: 'travel', title: 'Grand Rail Loop Locomotive', icon: icon('gear', '#ffc46e'), text: 'Restore the locomotive at the freight yard (5 salvage, 2 fuel) and ride the 1,100 m Grand Rail Loop around the Exclusion Zone at 22 m/s. Interact to step off.' });
        add({ cat: 'travel', title: 'Fast travel & Waypoints', icon: icon('scroll'), text: 'From the 20× tactical map, scroll to zoom, drag to pan, and click anywhere to drop a distance waypoint. Fast-travel to any discovered surface biome for 1 fuel (free with Navigator Mastery Rank 2 or modifiers). Sites of Grace warp for free.' });

        /* ---------- rules ---------- */
        for (const [id, m] of Object.entries(rules.modes)) add({ cat: 'rules', title: 'Operation: ' + m.name, icon: icon('flare'), text: m.description });
        for (const [id, d] of Object.entries(rules.difficulties)) add({ cat: 'rules', title: 'Difficulty: ' + d.name, icon: icon('fire', '#f2b45a'), facts: [['Enemy health', '×' + d.hp], ['Damage taken', '×' + d.damage], ['Spawn speed', '×' + d.rate], ['Max roaming', d.enemyCap]] });
        for (const [id, p] of Object.entries(rules.presets)) add({ cat: 'rules', title: 'Preset: ' + p.name, icon: icon('chest'), text: p.description });
        for (const [id, p] of Object.entries(campaign.pools)) {
            const kw = p.keywords ? new RegExp(p.keywords, 'i') : null;
            const list = kw ? BO.ZombiesData.ORDERED_PROGRESSION.filter((z) => kw.test(z.id)) : BO.ZombiesData.ORDERED_PROGRESSION;
            const dayOf = (z) => {
                const idx = BO.ZombiesData.ORDERED_PROGRESSION.indexOf(z);
                for (let d = 1; d < 40; d++) if (rules.threat(d, false, { encounterRate: 1 }, diffStd, rosterN).poolSize > idx) return d;
                return 40;
            };
            const items = kw
                ? list.map((z) => z.name + ' (day ' + dayOf(z) + ')')
                : ['All ' + list.length + ' enabled infected (weakest on day 1, scaling up each day)', 'Standard PMC patrols from day 2 and Commander Sable on day 3'];
            const facts = [];
            if (id === 'horde') facts.push(['Spawn rate', '+30% faster']);
            if (id === 'patrols') facts.push(['PMC patrols', 'Extra patrols from day 2 (up to 8)']);
            add({ cat: 'rules', title: 'Enemy pool: ' + p.name, icon: icon('blade'), text: p.extra, facts, lists: [{ h: 'Enemies in this pool', items }] });
        }
        for (const [id, m] of Object.entries(rules.modifiers)) add({ cat: 'rules', title: 'Modifier: ' + m.name, icon: '<span class="fg-emoji">' + esc(m.ico || '◆') + '</span>', tags: [m.tier || ''], text: m.description, keywords: id + ' modifier' });

        /* ---------- help ---------- */
        const help = [
            ['Can\'t build', 'Stand on open ground (not riding, not evacuating), outside the locked biomes, with the placement spot clear of walls and away from contacts and mission sites. Roofs need a wall within 3 m. Locked pieces need their research.'],
            ['Can\'t craft a recipe', 'Check the crafting screen: it tells you if you are missing materials, need to stand within 4 m of a station, need research, or lack pack room for the result.'],
            ['Can\'t gather something', 'Tier-2 deposits need a tier-2 tool. The deep geode needs the Resonant Sentinel defeated. Depleted deposits regrow after a few minutes while you are away.'],
            ['Can\'t save, sleep or fast travel', 'No enemy may be within 9 m, and you cannot be riding, evacuating, mid-siege or on an Iron expedition.'],
            ['Can\'t extract', 'Complete your operation first (see the Journal), then interact at Evac Ridge and hold the position until the timer finishes.'],
            ['Pack full', 'Weight and unique stacks are both limited. Drop or store items in a chest, or craft a bigger backpack at a workbench. Overflow drops in a bag you can pick up later.'],
            ['Weapon won\'t fire', 'It may be jammed (ash rain, worn gun): press reload. Or it is out of ammo: craft field cartridges at a workbench or trade for an ammunition pouch.']
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
            if (!hits.length) return `<div class="fg-empty"><b>Nothing found for “${esc(query)}”.</b><p>Try a resource, item, enemy, place or system name — e.g. copper, water, Blood Moon, kiln, Kestrel.</p></div>`;
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
                <label class="fg-search"><span>⌕</span><input id="survival-legend-search" type="search" value="${esc(query)}" placeholder="Search ${all.length} entries: resources, items, enemies, places, systems…" autocomplete="off" spellcheck="false"></label>
                <div id="survival-legend-results" class="fg-results sv-scroll" data-scroll="guide">${renderResults(query, category)}</div>
            </section>
        </div>`;
    }

    /** Fills enemy portraits a few at a time so long lists never stall the UI. */
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
