/* ============================================================================
   BLACKOUT OPS — Comprehensive Searchable Survival Legend
   Explains every control, safe-minute rule, mode, difficulty, modifier, preset,
   shrine, rune attribute, talisman, tech node, schematic, infusion, structure,
   activity, world event, status condition, item, recipe, biome, NPC & boss.
============================================================================ */
(function (BO) {
    'use strict';

    const categories = {
        start: 'Start here & grace timer',
        controls: 'Controls & keybinds',
        rules: 'Modes, difficulty & modifiers',
        combat: 'Bare hands, combat & bosses',
        shrines: 'Shrines, runes & talismans',
        tech: 'Tech tree, schematics & infusions',
        activities: 'Farming, fishing & world events',
        status: 'Vitals, temperature & stealth',
        building: 'Base building & automation',
        storage: 'Backpack, chests & supplies',
        tools: 'Resources & gathering tools',
        recipes: 'Crafting & perk tonics',
        map: 'Landmarks & biomes',
        contacts: 'Contacts, trades & quests',
        travel: 'Vehicles, train & fast travel',
        career: 'Career, XP & checkpoints',
        help: 'Troubleshooting'
    };

    const stations = {
        hand: 'Backpack handcraft [J]',
        bench: 'Relay workshop or Crafting Table',
        kiln: 'Stone kiln',
        campfire: 'Campfire'
    };
    const toolFamilies = { axe: 'axe', pick: 'pickaxe', shovel: 'shovel' };

    const areaNotes = {
        relay: 'Starting sanctuary with workshop, supply contacts, crop beds, basic resources, Relay Sanctuary Grace, and glider launch deck.',
        pine: 'Western woods rich in timber, fiber, bitterleaf herbs, Scout Vale rescue beacon, Pinebreak repeater, and Pinebreak Glade Grace.',
        freight: 'Eastern rail and warehouse yards with Freight Cache, Locomotive, Ammo/Vehicle merchants, and Freight Overpass Grace.',
        basin: 'Eastern wetland around the Dam spillway. Scavenge before flooding. Bridges and raised rail stay above water.',
        frost: 'Northwest quarry (Career Level 3). Talk to Kestrel to fight Pale Maul. Rich in hardwood, stone, quartz, and buried salvage.',
        cinder: 'Southeast dry flats (Career Level 5). Talk to Ember to fight Cinder Regent. Rich in coal, iron, copper, and quartz.',
        trench: 'Subterranean facility below the central north ramp. Guards the Aether Core & Apex Guardian. Bring light and rad gear.',
        ridge: 'Southwest switchback climb up Slateback Ridge with views, ore veins, Mason Holt, Cartographer Linn, and Summit Grace.',
        cavern: 'Follow the Research Trench west into Echo Cavern. Holds luminous quartz, the deep Resonant Geode, and Resonant Sentinel.'
    };

    const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
    const normalize = (value) => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
    const coords = ({ x, y, z }) => y ? `Map X ${x}, Z ${z}, elevation ${y}.` : `Map X ${x}, Z ${z}.`;
    const readKey = (code) => String(code || '').replace(/^(Key|Digit)/, '').replace(/(Left|Right)$/, ' $1');

    function formatter(frontier) {
        return (cost) => Object.entries(typeof cost === 'number' ? { scrap: cost } : (cost || {}))
            .filter(([, count]) => count > 0)
            .map(([id, count]) => `${count} ${frontier.items?.[id]?.[0] || id}`)
            .join(' + ');
    }

    function addControls(add) {
        const keys = BO.Settings?.getKeybinds?.() || {};
        const key = (id, fallback) => keys[id] ? readKey(keys[id]) : fallback;
        const move = [['forward', 'W'], ['left', 'A'], ['back', 'S'], ['right', 'D']].map(([id, fb]) => key(id, fb)).join('/');
        add('controls', `${move} · Move & Sprint`, `${key('sprint', 'Shift')} sprints. ${key('jump', 'Space')} jumps/mantles. ${key('crouch', 'C')} or Ctrl toggles crouch stealth (or slides while sprinting).`);
        add('controls', 'Alt · Dodge Roll (i-frames)', 'Perform a quick directional Dodge Roll in Survival mode with 0.34s invulnerability frames to evade lunges, acid, and boss slams (costs stamina).', 'dodge roll evade invulnerable alt');
        add('controls', '1 / 2 / 3 / Scroll · Weapon & Bare Hands', 'Press 1 for Primary weapon, 2 for Secondary, and 3 (or scroll past slot 2) for Bare Hands. No guns required to fight or gather.', 'bare hands slot 3 fists unarmed');
        add('controls', 'Mouse · Shoot / 3-Hit Punch / Guard & Parry', 'Left-Click fires or swings a 3-hit bare-hands combo (hold >0.45s and release for a Charged Haymaker). Right-Click aims firearms OR raises your Bare-Hands Guard (within 0.28s triggers a Perfect Parry!).', 'parry block guard combo haymaker');
        add('controls', 'X · Aether Flask Quick-Heal', 'Drink a charge from your rechargeable Aether Flask to restore 50+ HP and clear Bleeding. Refill at any Site of Grace or Homestead Beacon.', 'flask heal estus x');
        add('controls', `${key('interact', 'E')} · Interact`, 'Harvest deposits, open chests/doors, tend gardens, pump water, cast salvage lines, talk to NPCs, kindle Sites of Grace, and mine meteors.');
        add('controls', `${key('armory', 'J')} · Backpack & Talismans`, 'Manage inventory weight/stacks, eat food, drink perk tonics, equip tools & up to 3 Talismans, and handcraft basic items.');
        add('controls', `${key('fireMode', 'B')} · Build & Fortifications`, 'Open Field Construction (or detonate planted C4 first). Place walls, floors, roofs, doors, spike traps, turrets, generators, and beacons.');
        add('controls', 'K · Technology Tree & Attributes', 'Spend Tech Points across 4 tiers (zero creatures/pals — pure traps, turrets, automation & weapon schematics) and inspect Runes & Infusions.');
        add('controls', 'O · Goals, Challenges & Field Journal', 'Track your active Mode objective, claim 7 Field Challenges for bonus XP & supplies, and monitor Gardens, Repeaters, Surveys & World Events.');
        add('controls', 'L · Survival Legend', 'Open or close this complete Survival encyclopedia at any time. Simulation & timers pause cleanly while open.');
        add('controls', 'M / T / H · Map, Travel & Light', 'M opens the Exclusion Zone Field Map. T opens Vehicles & Fuel Fast-Travel. H toggles carried Torch or Quartz Lantern.');
        add('controls', `${key('reload', 'R')} / ${key('inspect', 'I')} / ${key('armor', '4')} / ${key('melee', 'V')}`, 'R reloads or clears weapon stoppages. I inspects magazine/reserve. 4 inserts spare armor plate. V executes melee / bare-hands punch.');
    }

    function addCoreSections(add, openingSeconds) {
        add('start', `Opening Grace Period (First ${openingSeconds}s — No Enemies)`, 'During the first 60 seconds (or 120s with Extended Safe Start), NO zombies, bosses, or hostile patrols spawn anywhere. Boss challenges, the Research Core, Blood Moons, and Evac Ridge stay sealed until the safe timer finishes. Opening Survival menus pauses the clock!', 'safe minute no enemies spawn grace timer');
        add('start', 'First 60 Seconds Checklist', '1) Press [3] to test Bare Hands or gather Fallen Branches, Loose Stones & Fiber Roots around Relay. 2) Braid Cord and craft a Stone Pickaxe & Hatchet in [J]. 3) Kindle Relay Sanctuary Grace (+1 Tech Point) right by the shelter. 4) Check [K] Tech Tree to unlock Perimeter Traps or Field Logistics. 5) Check [O] for your Mode Objective.');
        add('start', 'Complete Survival Loop', 'Explore 9 Zones -> Harvest & Mine -> Research 16 Tech Nodes -> Build Automated Base & Turrets -> Kindle Shrines & Level Attributes -> Craft Perk Tonics & Aether Infusions -> Beat Zone Bosses & Blood Moons -> Extract at Evac Ridge.');

        add('combat', 'Bare Hands Mastery: Combos, Guard & Perfect Parry', 'Equip slot [3]. Left-Click chains Jab (44 dmg) -> Cross (52 dmg) -> Heavy Uppercut (72 dmg + stagger). Holding Left-Click >0.45s unleashes a 96-dmg Charged Haymaker! Holding Right-Click blocks 68% frontal damage; raising Guard within 0.28s of impact triggers a PERFECT PARRY (0 dmg, stuns attacker 2.4s, +25% stamina, and opens a 2.8x damage Riposte counter!).', 'bare hands punch guard parry riposte combo haymaker');
        add('combat', 'Stealth Backstab & Dodge Roll', 'Crouch [C] when quiet to drop enemy detection radius sharply. Striking an unaware enemy from behind while crouched deals a 3.5x Stealth Takedown critical! Press Left Alt to Dodge Roll with 0.34s invulnerability frames.');
        add('combat', 'Boss Poise, Phase 2 Rage & Spoils', 'At <=50% HP, Zone Bosses erupt into Phase 2 Rage (+25% speed & damage). Defeating any boss drops a golden Boss Spoils pouch with Runes, Aether Shards, and bonus Weapon Schematics, plus +1 Tech Point.');
        add('combat', 'Apex Guardian, Pale Maul, Cinder Regent & Resonant Sentinel', 'Apex Guardian guards the Research Trench Aether Core. Challenge Pale Maul via Kestrel (Frostline) and Cinder Regent via Ember (Cinder Flats). Mining the deep geode in Echo Cavern awakens the Resonant Sentinel.');
        add('combat', 'Hostile Mimics & Commander Sable', 'Rad fog can hide Mimics mimicking distress radio calls. Commander Sable leads armed PMC squads and may retreat below 70 HP to return later with reinforced heavy guards.');

        add('shrines', 'Sites of Grace & Homestead Grace Beacons', '5 ancient Sites of Grace dot the map (and you can build a Homestead Grace Beacon at Tech Tier 3). Kindling a Shrine grants +1 Tech Point, +50 XP, refills HP & Aether Flask, clears Bleeding/Infection, and sets your Respawn Sanctuary.');
        add('shrines', 'Aether Flask & Golden Aether Seeds', 'Press [X] anytime for an instant burst heal (+50 HP + 5/Arcane) that stops Bleeding. Start with 3 charges; find 3 hidden Golden Aether Seeds (Pinebreak, Spillway, Echo Cavern) to expand up to 6 charges!');
        add('shrines', 'Lost Aether Echoes & Sanctuary Respawn', 'When you have a kindled Shrine or Field Bed (and Iron Expedition is off), falling drops a glowing golden Soul Echo holding your carried Runes and lets you respawn safely at Sanctuary to reclaim them.');

        add('activities', 'Crop Gardening (Relay Beds)', 'Collect starter seeds at the Relay Dispatch Board. Plant seeds in the 3 Relay beds, water them with Filtered Water from Hand Pumps, and harvest fresh Rations, Plant Fiber, and Bitterleaf Herbs. Rapid Hydroponics increases growth 2.5x.');
        add('activities', 'Water Pumps & Weighted Salvage Line Fishing', 'Use Hand Pumps (Relay, Spillway, Pinebreak) for Filtered Water (hydration & recipes). Craft a Weighted Salvage Line in [J] and cast at the 3 shoreline pools — watch the float dip, then press [E] within 3.5s to haul salvage, fuel, iron, copper, and quartz!');
        add('activities', 'Repeater Towers, Dispatch Routes & Weather Balloons', 'Power 3 Repeaters with Copper Wire + Fuel for faster Supply Drops & a relay reward. Accept Dispatch Routes at Relay Board to seal checkpoints for medkits, fuel & quartz. Watch for descending orange Weather Balloon crates across the map.');
        add('activities', 'Crimson Blood Moon Nights & Aether Meteor Falls', 'After the safe minute, every 2nd night (or every night with modifier/Blood Moon mode) turns the sky crimson for a 75s Blood Moon surge — survive it for +250 Runes, +2 Aether Shards & Salvage! Periodically, purple Aether Meteors crash on the surface with 3 Aether Shards and random Weapon Schematics.');

        add('status', 'Temperature, Hydration & Peak Condition', 'Frostline Quarry and nights drop ambient temperature; freezing drains stamina & HP unless near Campfire/Kiln/Torch/Shrine or warmed by Spiced Broth. Drink Filtered Water, Tea, or Stew to keep Hydration up. Keeping Hunger & Hydration >= 75% grants Peak Condition (+8% speed & passive HP regen).');
        add('status', 'Rested Comfort, Bleeding & Bio-Infection', 'Standing near warm campfires/shrines or sleeping in a Bed grants Rested Comfort (+18% stamina regen). Tough hits or Bio-Toxic modifier can inflict Bleeding or Infection — cure with Herbal Dressings, Antibiotic Elixir, or Aether Flask.');
        add('status', 'Weather, Radiation & Weapon Jamming', 'Rad fog reduces visibility; Ash rain can jam worn firearms (clear with R). Research Trench & Echo Cavern add radiation (slowed by Respirator Filter, Arcane rank, or Lead-Lined Charm).');

        add('building', 'Base Level (Lv 1-5), Repair & Dismantle', 'Building varied pieces raises your Homestead Base Level (1 to 5). Use the Build menu [B] to rotate orientation, repair damaged fortifications for 1 Salvage, or dismantle the nearest structure within 4m to reclaim materials.');
        add('help', 'Cannot build, craft, save, or extract?', 'Dismount vehicles and stand on level surface outside restricted enclosures. Roofs need a nearby wall. Tech-locked structures/schematics require unlocking their node in [K]. Check [O] to confirm your Mode objective and make sure the 60s safe minute has finished before challenging bosses or evacuating.');
    }

    function addDynamicData(add, rules, deep, frontier, campaign, base, cost) {
        const modCount = Object.keys(rules.modifiers || {}).length;
        const catCount = Array.isArray(rules.categories) ? rules.categories.length : Object.keys(rules.categories || {}).length;
        const findCat = (gid) => Array.isArray(rules.categories)
            ? rules.categories.find((c) => c.id === gid)
            : rules.categories?.[gid];
        add('rules', 'Briefing Presets, Modes & Rules', `Choose from ${Object.keys(rules.presets || {}).length} one-click Presets, ${Object.keys(rules.modes || {}).length} Game Modes, ${Object.keys(rules.difficulties || {}).length} Difficulties, and ${modCount} categorized Modifiers across ${catCount} categories before deploying.`);
        for (const [id, m] of Object.entries(rules.modes || {})) add('rules', `Mode: ${m.name}`, m.description, id);
        for (const [id, p] of Object.entries(rules.presets || {})) add('rules', `Preset: ${p.name}`, p.description, id);
        for (const [id, d] of Object.entries(rules.difficulties || {})) add('rules', `Difficulty: ${d.name}`, `${d.hp}x enemy HP, ${d.damage}x damage, ${d.rate}x encounter rate, cap ${d.enemyCap}.`, id);
        for (const [id, mod] of Object.entries(rules.modifiers || {})) {
            const catObj = findCat(mod.group);
            const catLabel = catObj?.name || mod.group || 'Rule';
            add('rules', `Modifier (${catLabel}): ${mod.name}`, mod.description, `${id} ${mod.group || ''} ${catLabel} ${mod.tier || ''} ${mod.exclusive ? 'special exclusive' : ''}`);
        }
        for (const [id, pool] of Object.entries(campaign.pools || {})) add('rules', `Pool: ${pool.name}`, pool.extra, id);

        for (const s of deep.shrines || []) add('shrines', s.name, `Site of Grace in ${s.area}. ${coords(s)} Kindle for +1 Tech Point, heal & set respawn.`, s.id);
        for (const [id, attr] of Object.entries(deep.attributes || {})) add('shrines', `Attribute: ${attr.name}`, `${attr.bonus}. Spend Aether Runes at any Shrine or in [K].`, id);
        for (const [id, tal] of Object.entries(deep.talismans || {})) add('shrines', `Talisman: ${tal.name}`, `${tal.effect} Found: ${tal.location}. Equip up to 3 in Backpack or Shrine.`, id);
        for (const seed of deep.goldenSeeds || []) add('shrines', seed.name, `Permanent +1 Aether Flask max charge (up to 6). ${coords(seed)}`, seed.id);

        for (const node of deep.techTree || []) {
            add('tech', `Tier ${node.tier} Tech: ${node.name}`, `Costs ${node.cost} Tech Point(s).${node.req ? ' Requires previous tier link.' : ''} ${node.desc}`, node.id);
        }
        for (const sch of deep.weaponSchematics || []) {
            add('tech', `Weapon Schematic: ${sch.name}`, `Forge at Workbench for ${cost(sch.cost)} once unlocked. Equips live 3D weapon directly.`, sch.id);
        }
        for (const [id, inf] of Object.entries(deep.infusions || {})) {
            add('tech', `Aether Infusion: ${inf.name}`, `${inf.desc} Apply up to 2 at an Aether Infusion Altar (2 Quartz + 1 Aether Shard + 120 Runes).`, id);
        }

        for (const [index, pack] of (frontier.packs || []).entries()) add('storage', pack.name, `Backpack tier ${index + 1}. Base capacity ${pack.weight} kg and ${pack.slots} stacks (scales with Endurance, Logistics Tech & Deep Pack modifier).`, 'bag capacity');
        for (const [id, [name, cat, kg]] of Object.entries(frontier.items || {})) add('storage', name, `${cat}. ${kg} kg per unit.`, id);
        for (const [id, t] of Object.entries(frontier.tools || {})) add('tools', t.name, `Tier ${t.level} ${toolFamilies[t.family] || t.family}. Power ${t.power}, durability ${t.wear}. Craft at ${stations[t.station] || t.station} for ${cost(t.cost)}.`, id);
        for (const [id, r] of Object.entries(frontier.resources || {})) {
            const req = r.tool ? `Requires tier ${r.tier} ${toolFamilies[r.tool]} or better.` : 'Gather by hand or bare-hands punch.';
            add('tools', r.name, `${req} Base strokes: ${r.strokes}. Yield: ${cost(r.gain)}.`, id);
        }
        for (const rec of frontier.recipes || []) add('recipes', rec.name, `${stations[rec.station] || rec.station}. Cost: ${cost(rec.cost)}. ${rec.desc}`, rec.id);
        for (const rec of base.recipes || []) add('recipes', rec.name, `${stations.bench}. Cost: ${cost(rec.cost)}. ${rec.detail}`, rec.id);

        for (const piece of campaign.build || []) add('building', piece.name, `Cost: ${cost(piece.cost)}.${piece.tech ? ' Requires Tech unlock.' : ''} ${piece.detail}`, piece.id);
        for (const area of campaign.areas || []) add('map', area.name, `${areaNotes[area.id] || ''} ${area.level > 1 ? `Unlocks at Career Lv ${area.level}.` : 'Open from Lv 1.'} ${coords(area)}`, area.id);
        for (const site of base.sites || []) add('map', site.name, `${site.label}. ${coords(site)}`, site.id);
        for (const ride of campaign.vehicles || []) add('travel', ride.name, `Unlocks at Career Lv ${ride.level} (or buy at contact). ${ride.detail}`, ride.id);
        for (const npc of campaign.contacts || []) {
            const q = npc.quest ? ` Contract “${npc.quest[0]}” (${npc.quest[2]} goal, +${npc.quest[3]} XP).` : '';
            add('contacts', npc.name, `${coords(npc)} ${npc.hint.trim()}${q}`, npc.id);
        }
        for (const [lv, rank] of campaign.ranks || []) add('career', `Rank Lv ${lv}: ${rank}`, `Career rank unlocked at Survival level ${lv}.`, 'rank level');

        // Include Enemy & Boss Field Reports right inside Legend!
        const allEnemies = [...(BO.ZombiesData?.ORDERED_PROGRESSION || []), ...(BO.ZombiesData?.ORDERED_BOSSES || [])];
        for (const spec of allEnemies) {
            const rep = BO.ZombiesData.describe ? BO.ZombiesData.describe(spec) : null;
            add('combat', `${spec.isBoss ? 'BOSS: ' : 'Hostile: '}${spec.name}`, rep ? `${rep.threatLabel} Threat. ${spec.simpleDesc} Tip: ${rep.tip}` : spec.simpleDesc, spec.id);
        }
    }

    function getEntries() {
        const frontier = BO.SurvivalFrontierData || {};
        const campaign = BO.SurvivalCampaignData || {};
        const base = BO.SurvivalData || {};
        const rules = BO.SurvivalRules || {};
        const deep = BO.SurvivalDeepData || {};
        const result = [];
        const add = (category, title, detail, keywords = '') => result.push({ category, title, detail, keywords });
        const cost = formatter(frontier);

        addControls(add);
        addCoreSections(add, rules.openingSeconds || 60);
        addDynamicData(add, rules, deep, frontier, campaign, base, cost);
        return result;
    }

    function renderResults(query = '', category = 'all') {
        const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
        const matches = getEntries().filter((entry) => {
            if (category !== 'all' && entry.category !== category) return false;
            const searchable = normalize(`${entry.title} ${entry.detail} ${entry.keywords} ${categories[entry.category] || ''}`);
            return terms.every((term) => searchable.includes(term));
        });

        if (!matches.length) return '<p role="status">No matching legend entries. Try another keyword or choose "All categories".</p>';

        const sections = Object.entries(categories).map(([id, label]) => {
            const items = matches.filter((entry) => entry.category === id);
            if (!items.length) return '';
            return `<section class="survival-legend-group" aria-labelledby="survival-legend-heading-${id}">
                <h3 id="survival-legend-heading-${id}">${label} (${items.length})</h3>
                <div class="expansion-shop-items">${items.map(({ title, detail }) => `<article class="select-card expansion-shop-card" style="--item-color:#a6ddd0">
                    <h4 class="card-head">${escape(title)}</h4><div class="card-sub">${escape(detail)}</div>
                </article>`).join('')}</div>
            </section>`;
        }).join('');
        return `<p class="survival-legend-count" role="status">Showing ${matches.length} ${matches.length === 1 ? 'entry' : 'entries'} across all Survival systems</p>${sections}`;
    }

    function render(query = '', category = 'all') {
        const options = [['all', 'All categories'], ...Object.entries(categories)];
        return `<div class="survival-lobby survival-legend-filters" role="search" aria-label="Survival legend">
            <label class="survival-option" for="survival-legend-search"><span>Search the complete Survival guide</span>
                <input id="survival-legend-search" type="search" value="${escape(query)}" placeholder="Search parry, turret, blood moon, shrine, raygun, 60s..." autocomplete="off" spellcheck="false" aria-controls="survival-legend-results">
            </label>
            <label class="survival-option" for="survival-legend-category"><span>Filter by category</span>
                <select id="survival-legend-category" aria-controls="survival-legend-results">${options.map(([id, label]) =>
                    `<option value="${id}"${id === category ? ' selected' : ''}>${label}</option>`).join('')}</select>
            </label>
        </div><div id="survival-legend-results">${renderResults(query, category)}</div>`;
    }

    BO.SurvivalLegend = { render, renderResults, getEntries };
})(window.BO);
