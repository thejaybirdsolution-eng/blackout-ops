/* ============================================================================
   BLACKOUT OPS — Wild Zone data: animals, food, new resources, recipes,
   cooking stations and twenty vehicles.
   Loaded after SurvivalWorld / ZoneRules / ZoneLoot so it can extend the
   shared item, resource, recipe, build and vehicle tables in place.
============================================================================ */
(function (BO) {
    'use strict';
    const F = BO.SurvivalFrontierData;
    const CD = BO.SurvivalCampaignData;

    /* ------------------------------------------------------------ items */
    Object.assign(F.items, {
        // Raw game (eat raw at your own risk) and its cooked counterpart (3× the value).
        raw_venison: ['Raw venison', 'Food', 0.4], cooked_venison: ['Roast venison', 'Food', 0.35],
        raw_pork: ['Raw boar meat', 'Food', 0.45], cooked_pork: ['Grilled boar chop', 'Food', 0.4],
        raw_rabbit: ['Raw rabbit', 'Food', 0.25], cooked_rabbit: ['Roast rabbit', 'Food', 0.22],
        raw_fowl: ['Raw pheasant', 'Food', 0.25], cooked_fowl: ['Roast pheasant', 'Food', 0.22],
        raw_mutton: ['Raw goat meat', 'Food', 0.4], cooked_mutton: ['Goat kebab', 'Food', 0.35],
        raw_bear: ['Raw bear meat', 'Food', 0.6], cooked_bear: ['Bear steak', 'Food', 0.55],
        raw_wolf: ['Tough wolf meat', 'Food', 0.4], cooked_wolf: ['Braised wolf', 'Food', 0.35],
        raw_beef: ['Raw beef', 'Food', 0.5], cooked_beef: ['Seared beef', 'Food', 0.45],
        raw_fish: ['Raw trout', 'Food', 0.3], cooked_fish: ['Grilled trout', 'Food', 0.28],
        egg: ['Wild egg', 'Food', 0.06], fried_egg: ['Fried egg', 'Food', 0.06],
        mushroom: ['Field mushroom', 'Food', 0.05], roast_mushroom: ['Roast mushrooms', 'Food', 0.05],
        berries: ['Wild berries', 'Food', 0.04], honey: ['Wild honey', 'Food', 0.2],
        jerky: ['Salted jerky', 'Food', 0.12],
        // Cooking-station meals.
        hunter_stew: ['Hunter\'s stew', 'Food', 0.6], meat_pie: ['Meat pie', 'Food', 0.4], omelette: ['Mushroom omelette', 'Food', 0.25],
        mushroom_soup: ['Mushroom soup', 'Food', 0.4], berry_pie: ['Berry pie', 'Food', 0.35], honey_ham: ['Honey-glazed ham', 'Food', 0.5],
        survivor_feast: ['Survivor\'s feast', 'Food', 1.0], golden_ration: ['Golden ration', 'Food', 0.2],
        // Animal and wild materials.
        hide: ['Raw hide', 'Raw materials', 0.5], leather: ['Leather', 'Components', 0.35], feather: ['Feather', 'Raw materials', 0.01],
        bone: ['Bone', 'Raw materials', 0.15], bonemeal: ['Bone meal', 'Components', 0.1], fat: ['Animal fat', 'Raw materials', 0.2],
        wool: ['Goat wool', 'Raw materials', 0.15], antler: ['Antler', 'Raw materials', 0.3],
        sand: ['Sand', 'Raw materials', 0.5], glass: ['Glass pane', 'Components', 0.3], bottle: ['Glass bottle', 'Components', 0.15],
        flint: ['Flint', 'Raw materials', 0.12], sulfur: ['Sulfur', 'Raw materials', 0.25], salt: ['Rock salt', 'Raw materials', 0.15],
        gold_ore: ['Gold ore', 'Raw materials', 0.7], gold: ['Gold bar', 'Components', 0.6], obsidian: ['Obsidian', 'Raw materials', 0.8],
        // Crafted gear.
        candle: ['Tallow candle', 'Lighting', 0.1], leather_armor: ['Leather armour', 'Equipment', 2.5], hide_armor: ['Bone & hide armour', 'Equipment', 3.2],
        frag_grenade: ['Frag grenade', 'Equipment', 0.4], molotov: ['Molotov cocktail', 'Equipment', 0.6], spyglass: ['Spyglass', 'Equipment', 0.5],
        bedroll: ['Bedroll', 'Equipment', 1.2], fishing_bait: ['Fishing bait', 'Components', 0.05], fireworks: ['Signal fireworks', 'Equipment', 0.4],
        scrap_wheel: ['Scrap wheel', 'Components', 1.2], engine_parts: ['Engine parts', 'Components', 2.0]
    });

    /* ------------------------------------------------------------ new resources */
    Object.assign(F.resources, {
        sandpit: { name: 'Sand bar', tool: 'shovel', tier: 1, strokes: 2, gain: { sand: 5 }, color: 0xd9c48f },
        flintbed: { name: 'Flint gravel', strokes: 1, gain: { flint: 2, stone: 1 }, color: 0x5d6168 },
        sulfur: { name: 'Sulfur vent', tool: 'pick', tier: 1, strokes: 3, gain: { sulfur: 4 }, color: 0xd9cf3c },
        gold: { name: 'Gold vein', tool: 'pick', tier: 2, strokes: 5, gain: { gold_ore: 3, stone: 1 }, color: 0xe2b23a },
        saltcrust: { name: 'Salt crust', tool: 'pick', tier: 1, strokes: 2, gain: { salt: 4 }, color: 0xe9e6dc },
        berrybush: { name: 'Berry bush', strokes: 1, gain: { berries: 4, fiber: 1 }, color: 0x9b3a5a },
        mushrooms: { name: 'Mushroom ring', strokes: 1, gain: { mushroom: 3 }, color: 0xc9a27a },
        beehive: { name: 'Wild beehive', strokes: 2, gain: { honey: 2, fat: 0 }, color: 0xd9a03a },
        obsidian: { name: 'Obsidian shard field', tool: 'pick', tier: 3, strokes: 6, gain: { obsidian: 3 }, color: 0x2c2238 }
    });
    for (const r of Object.values(F.resources)) for (const k of Object.keys(r.gain)) if (!r.gain[k]) delete r.gain[k];
    // Scatter the new deposits deterministically across their biomes.
    (function scatter() {
        const Z = BO.Zone;
        if (!Z?.deposits) return;
        let s = 424242;
        const R = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
        const table = {
            meadow: [['berrybush', 4], ['mushrooms', 2], ['flintbed', 2], ['beehive', 1]],
            town: [['flintbed', 1], ['berrybush', 1]],
            forest: [['mushrooms', 4], ['berrybush', 3], ['beehive', 2], ['flintbed', 1]],
            industrial: [['sulfur', 1], ['flintbed', 2], ['sandpit', 1]],
            wetland: [['sandpit', 5], ['saltcrust', 3], ['mushrooms', 2], ['berrybush', 1]],
            alpine: [['gold', 3], ['flintbed', 2], ['saltcrust', 1]],
            ash: [['sulfur', 5], ['gold', 1], ['flintbed', 1]],
            campus: [['flintbed', 1]],
            crater: [['obsidian', 4], ['gold', 1]]
        };
        const B = Z.BOUNDS;
        for (let x = B.minX + 20; x < B.maxX - 20; x += 17) {
            for (let z = B.minZ + 20; z < B.maxZ - 20; z += 17) {
                if (R() > 0.3) continue;
                const px = x + (R() - 0.5) * 12, pz = z + (R() - 0.5) * 12;
                const reg = Z.regionAt(px, pz);
                const list = table[reg.biome];
                if (!list) continue;
                const h = Z.rawFinal(px, pz);
                if (Z.inReservoir(px, pz) && h < Z.WATER + 0.2) continue;
                if (Z.roadInfo(px, pz)?.d < 5) continue;
                if (Z.pois.some((p) => Math.abs(px - p.x) < p.w / 2 + 3 && Math.abs(pz - p.z) < p.d / 2 + 3)) continue;
                const total = list.reduce((a, [, w]) => a + w, 0);
                let roll = R() * total, kind = list[0][0];
                for (const [k, w] of list) { roll -= w; if (roll <= 0) { kind = k; break; } }
                Z.deposits.push({ kind, x: +px.toFixed(1), y: +h.toFixed(2), z: +pz.toFixed(1), region: reg.id });
            }
        }
    })();

    /* ------------------------------------------------------------ recipes */
    const r = (id, name, station, cost, gain, desc) => ({ id, name, station, cost, gain, desc });
    const cookPairs = [['venison', 'Roast venison'], ['pork', 'Grill a boar chop'], ['rabbit', 'Roast rabbit'], ['fowl', 'Roast pheasant'], ['mutton', 'Goat kebab'],
        ['bear', 'Sear a bear steak'], ['wolf', 'Braise wolf meat'], ['beef', 'Sear beef'], ['fish', 'Grill trout']];
    F.recipes.push(
        ...cookPairs.map(([k, n]) => r('cook_' + k, n, 'campfire', { ['raw_' + k]: 1 }, { ['cooked_' + k]: 1 }, 'Cooked meat restores three times as much as raw — and will not make you sick.')),
        r('cook_egg', 'Fry an egg', 'campfire', { egg: 1 }, { fried_egg: 1 }, 'Three times the nourishment of a raw egg.'),
        r('cook_mushroom', 'Roast mushrooms', 'campfire', { mushroom: 2 }, { roast_mushroom: 2 }, 'Safe, warm and three times as filling.'),
        r('jerky', 'Salt jerky', 'campfire', { salt: 1, raw_venison: 1 }, { jerky: 3 }, 'Light, long-lasting trail food.'),
        r('jerkyPork', 'Salt boar jerky', 'campfire', { salt: 1, raw_pork: 1 }, { jerky: 3 }, 'Light, long-lasting trail food.'),
        r('candle', 'Tallow candles', 'campfire', { fat: 1, cord: 1 }, { candle: 2 }, 'A small, steady light. Works like a torch for longer.'),
        r('stew', 'Hunter\'s stew', 'cookstation', { cooked_venison: 1, mushroom: 2, herbs: 1 }, { hunter_stew: 1 }, 'Huge meal: food, water, health and warmth.'),
        r('meatPie', 'Meat pie', 'cookstation', { cooked_pork: 1, berries: 2, fat: 1 }, { meat_pie: 2 }, 'Two filling pies.'),
        r('omelette', 'Mushroom omelette', 'cookstation', { egg: 2, mushroom: 1 }, { omelette: 1 }, 'Restores health and stamina.'),
        r('soup', 'Mushroom soup', 'cookstation', { mushroom: 3, freshWater: 1 }, { mushroom_soup: 1 }, 'Warming and hydrating.'),
        r('berryPie', 'Berry pie', 'cookstation', { berries: 4, honey: 1, egg: 1 }, { berry_pie: 1 }, 'Sweet, filling, restores composure.'),
        r('honeyHam', 'Honey-glazed ham', 'cookstation', { cooked_pork: 2, honey: 1 }, { honey_ham: 1 }, 'Big heal over time.'),
        r('feast', 'Survivor\'s feast', 'cookstation', { cooked_beef: 1, cooked_fowl: 1, cooked_fish: 1, berries: 2, honey: 1 }, { survivor_feast: 1 }, 'Fills you completely and grants a long regeneration buff.'),
        r('goldenRation', 'Golden ration', 'cookstation', { gold: 1, berries: 3, honey: 1 }, { golden_ration: 1 }, 'Instantly heals 60 and regenerates health for 30 s.'),
        r('batchRoast', 'Batch roast (venison ×3)', 'cookstation', { raw_venison: 3 }, { cooked_venison: 4 }, 'The cooking station roasts three for the price of… well, you get a fourth free.'),
        r('glass', 'Glass panes', 'kiln', { sand: 3, coal: 1 }, { glass: 2 }, 'For bottles, lenses and spyglasses.'),
        r('bottle', 'Glass bottles', 'kiln', { glass: 1 }, { bottle: 2 }, 'Hold water, fuel or fire.'),
        r('smeltGold', 'Smelt gold', 'kiln', { gold_ore: 3, coal: 1 }, { gold: 1 }, 'Precious and very useful at the cooking station.'),
        r('tan', 'Tan leather', 'bench', { hide: 2, salt: 1 }, { leather: 2 }, 'Cured leather for armour and packs.'),
        r('leatherArmor', 'Leather armour', 'bench', { leather: 5, cord: 2 }, { leather_armor: 1 }, 'Wear it to gain 60 armour.'),
        r('boneArmor', 'Bone & hide armour', 'bench', { hide: 3, bone: 6, cord: 2 }, { hide_armor: 1 }, 'Wear it to gain 100 armour.'),
        r('bonemeal', 'Grind bone meal', 'hand', { bone: 2 }, { bonemeal: 3 }, 'Fertiliser: makes planted crops grow faster.'),
        r('gunpowder', 'Mix gunpowder', 'bench', { sulfur: 1, coal: 1, salt: 1 }, { powder: 3 }, 'Propellant for hand-loaded ammunition and grenades.'),
        r('grenade', 'Frag grenade', 'bench', { powder: 2, scrap: 2, ingot: 1 }, { frag_grenade: 1 }, 'Use it to add a frag grenade to your lethal slot.'),
        r('molotov', 'Molotov cocktail', 'hand', { bottle: 1, fuel: 1, cloth: 1 }, { molotov: 1 }, 'Use it to add a fire grenade (counts as a lethal). Burns nests.'),
        r('spyglass', 'Spyglass', 'bench', { glass: 2, gold: 1, ingot: 1 }, { spyglass: 1 }, 'Use it to reveal every infested site and animal herd within 250 m.'),
        r('bedroll', 'Bedroll', 'hand', { wool: 3, hide: 1, cord: 1 }, { bedroll: 1 }, 'Use it outdoors to rest until morning (if no infected are near).'),
        r('bait', 'Fishing bait', 'hand', { bone: 1, fat: 1 }, { fishing_bait: 3 }, 'Doubles your fishing catches.'),
        r('fireworks', 'Signal fireworks', 'bench', { powder: 2, cloth: 1, feather: 2 }, { fireworks: 1 }, 'Use to call a supply airdrop — every infected for 200 m hears it.'),
        r('flintTools', 'Flint scrapers', 'hand', { flint: 2, timber: 1 }, { scrap: 2 }, 'Knapped flint makes serviceable salvage.'),
        r('featherCord', 'Fletched cord', 'hand', { feather: 4, fiber: 2 }, { cord: 3 }, 'Quick cord from feathers and fibre.'),
        r('woolCloth', 'Spin wool cloth', 'hand', { wool: 2 }, { cloth: 2 }, 'Warm cloth from goat wool.'),
        r('antlerTool', 'Antler handles', 'hand', { antler: 1 }, { cord: 2, bone: 2 }, 'Antler splits into handles and bone.'),
        r('scrapWheel', 'Scrap wheel', 'bench', { scrap: 4, ingot: 1, cord: 1 }, { scrap_wheel: 1 }, 'A wheel for building vehicles.'),
        r('engineParts', 'Engine parts', 'bench', { ingot: 3, wire: 2, fuel: 1, gold: 1 }, { engine_parts: 1 }, 'The heart of every powered vehicle you build.')
    );

    /* ------------------------------------------------------------ buildings */
    CD.build.push(
        { id: 'firepit', name: 'Fire camp', size: [1.6, 0.4, 1.6], cost: { timber: 4, stone: 6 }, color: 0x6e6258, detail: 'A big ringed fire: cook, keep warm in a 6 m radius, light up the night and rest safely beside it.' },
        { id: 'cookstation', name: 'Cooking station', size: [1.3, 0.95, 0.8], cost: { stone: 6, ingot: 1, brick: 2, timber: 2 }, color: 0x5d5752, detail: 'Stove, pot and grill. Cooks everything a campfire can, plus hearty stews, pies, feasts and golden rations.' },
        { id: 'tanrack', name: 'Tanning rack', size: [1.4, 1.6, 0.3], cost: { timber: 4, cord: 2 }, color: 0x8a6c4a, detail: 'Counts as a crafting table for leatherwork (tanning, armour).' },
        { id: 'smoker', name: 'Smokehouse', size: [1.2, 1.9, 1.2], cost: { planks: 4, stone: 4, clay: 2 }, color: 0x6a5240, detail: 'Counts as a campfire. Food eaten within 8 m restores 25% more.' }
    );

    /* ------------------------------------------------------------ vehicles (20 total) */
    // kind picks the model; found: where it is parked; build: crafting cost (bench), only obtainable by building.
    CD.vehicles.length = 0;
    CD.vehicles.push(
        { id: 'bike', name: 'Trail bicycle', kind: 'bike', speed: 2.1, offroad: 1.6, color: 0x82c39d, noise: 0, found: 'barn', detail: 'Silent and quick on roads.' },
        { id: 'mount', name: 'Pack horse', kind: 'horse', speed: 1.85, offroad: 2.1, color: 0x9c745a, noise: 0.5, found: 'ranger_station', detail: 'Dominates rough terrain, marsh and slopes.' },
        { id: 'rover', name: 'Salvage rover', kind: 'car', speed: 2.9, offroad: 2.3, color: 0x8394a4, noise: 5, found: 'office', detail: 'Fast, rugged and loud.' },
        { id: 'dirtbike', name: 'Dirt bike', kind: 'moto', speed: 3.0, offroad: 2.6, color: 0xd25a2a, noise: 4, found: 'warehouse', detail: 'The fastest thing on two wheels off-road. Very loud.' },
        { id: 'quad', name: 'Quad bike', kind: 'quad', speed: 2.6, offroad: 2.5, color: 0x5e7a3a, noise: 3.5, found: 'mill', detail: 'Sure-footed on forest tracks.' },
        { id: 'pickup', name: 'Rusty pickup', kind: 'truck', speed: 2.7, offroad: 1.9, color: 0x9a5a3a, noise: 4.5, found: 'grocery', detail: 'Roomy and reliable on roads.' },
        { id: 'jeep', name: 'Military jeep', kind: 'car', speed: 3.0, offroad: 2.5, color: 0x4f5b3a, noise: 4.5, found: 'police', detail: 'Built for this. Fast everywhere.' },
        { id: 'snowmobile', name: 'Snowmobile', kind: 'sled', speed: 2.4, offroad: 3.1, color: 0x2f6fbf, noise: 3.5, found: 'lodge', detail: 'Unstoppable on slopes and snow.' },
        { id: 'tractor', name: 'Farm tractor', kind: 'tractor', speed: 1.7, offroad: 2.2, color: 0x3d8a3a, noise: 3, found: 'farmhouse', detail: 'Slow but goes anywhere.' },
        { id: 'golfcart', name: 'Groundskeeper cart', kind: 'cart', speed: 2.0, offroad: 1.5, color: 0xe8e4d8, noise: 0.5, found: 'lab', detail: 'Quiet electric cart from the campus.' },
        { id: 'moped', name: 'Delivery moped', kind: 'moto', speed: 2.4, offroad: 1.4, color: 0xd8c43a, noise: 2, found: 'pharmacy', detail: 'Zippy in town.' },
        { id: 'policebike', name: 'Police motorcycle', kind: 'moto', speed: 3.3, offroad: 1.8, color: 0x2a3a5a, noise: 4.5, found: 'school', detail: 'The fastest road vehicle you can find.' },
        { id: 'firetruck', name: 'Fire engine', kind: 'truck', speed: 2.2, offroad: 1.6, color: 0xc0302a, noise: 6, found: 'church', detail: 'Huge, loud, unstoppable on roads.' },
        { id: 'apc', name: 'Sable APC', kind: 'apc', speed: 2.6, offroad: 2.6, color: 0x3a4232, noise: 7, found: 'turbine_hall', detail: 'Armoured Sable transport. Everything for 150 m hears it.' },
        { id: 'mule', name: 'Haven mule', kind: 'horse', speed: 1.6, offroad: 2.3, color: 0x7a6a5a, noise: 0.3, found: 'boathouse', detail: 'Patient and quiet; great on mountain paths.' },
        // Build-only.
        { id: 'gokart', name: 'Scrap go-kart', kind: 'kart', speed: 2.8, offroad: 1.7, color: 0xe0a02a, noise: 3, build: { scrap_wheel: 4, planks: 4, engine_parts: 1, fuel: 2 }, detail: 'Hand-built racer. Fast and fun.' },
        { id: 'monowheel', name: 'Scrap monowheel', kind: 'mono', speed: 3.2, offroad: 1.9, color: 0x8a8f96, noise: 3.5, build: { scrap_wheel: 1, ingot: 6, engine_parts: 1, wire: 3 }, detail: 'One giant wheel, one terrifying ride.' },
        { id: 'warrig', name: 'Armoured war rig', kind: 'apc', speed: 2.7, offroad: 2.8, color: 0x6a4a32, noise: 7, build: { scrap_wheel: 6, ingot: 10, engine_parts: 2, brick: 6, fuel: 4 }, detail: 'Welded scrap fortress on wheels.' },
        { id: 'hoverboard', name: 'Resonance hoverboard', kind: 'board', speed: 3.4, offroad: 3.0, color: 0x8fe3c8, noise: 0, build: { relic: 1, quartz: 6, gold: 2, wire: 4 }, detail: 'Floats on Lantern resonance. Silent and very fast.' },
        { id: 'sledge', name: 'Hide sledge', kind: 'sledge', speed: 1.9, offroad: 2.7, color: 0x9a7a5a, noise: 0.5, build: { hide: 4, planks: 6, bone: 4, cord: 3 }, detail: 'A dog-less sledge that glides over snow and mud.' }
    );
    for (const v of CD.vehicles) v.level = Infinity; // claimed in the world or built, never handed out by career level
    for (const v of CD.vehicles.filter((v) => v.build)) {
        F.recipes.push({ id: 'veh_' + v.id, name: 'Build: ' + v.name, station: 'bench', cost: v.build, gain: {}, desc: v.detail + ' Build-only vehicle.', vehicle: v.id });
    }

    const CAT = (re, cat) => { for (const rc of F.recipes) if (re.test(rc.id) && !rc.cat) rc.cat = cat; };
    CAT(/^(cook_|jerky|stew|meatPie|omelette|soup|berryPie|honeyHam|feast|goldenRation|batchRoast)/, 'food');
    CAT(/^veh_/, 'vehicles');
    CAT(/^(grenade|molotov|fireworks)$/, 'weapons');
    CAT(/^(leatherArmor|boneArmor|spyglass|bedroll|bait|scrapWheel|engineParts)$/, 'gear');
    CAT(/^candle$/, 'lighting');

    /* ------------------------------------------------------------ hotbar + guide sources */
    const USABLE = BO.SurvivalHotbar?.usable;
    const FOOD_IDS = Object.keys(F.items).filter((k) => F.items[k][1] === 'Food');
    if (USABLE) for (const id of [...FOOD_IDS, 'candle', 'leather_armor', 'hide_armor', 'frag_grenade', 'molotov', 'spyglass', 'bedroll', 'fireworks']) USABLE.add(id);
    BO.ZoneWildData = { FOOD_IDS };
})(window.BO);
