/* ============================================================================
   BLACKOUT OPS — Zone Expansion Catalog (Survival World, Crafting, Building & Pickups)
   Adds:
   - 52 unique pickups, relics, alchemy potions, crops, bakery foods & gadgets
   - 5 new Tier 2–4 gathering tools (Shears, Diamond & Abyssal Axe/Pickaxe)
   - 8 new wild resource deposits scattered across Zone biomes
   - 26 new building structures (walkable stairs, interactive doors/gates,
     tiered & Quantum Ender-style chests, alchemy/arcane stations, watchtowers,
     hopper collectors, architectural walls/arches/catwalks & fortifications)
   - 72 new crafting, smelting, cooking, brewing & arcane recipes with fair
     multi-path progression so every item can be earned in multiple ways
============================================================================ */
(function (BO) {
    'use strict';

    const F = BO.SurvivalFrontierData;
    const CD = BO.SurvivalCampaignData;
    if (!F || !CD) return;

    /* ------------------------------------------------------------ 1. ITEMS */
    const NEW_ITEMS = {
        // Minerals, Mob Reagents & Barter Gems
        emerald_chip: ['Trader emerald', 'Components', 0.12],
        diamond_shard: ['Diamond crystal', 'Raw materials', 0.24],
        abyssal_alloy: ['Abyssal ingot', 'Components', 0.72],
        lapis_prism: ['Arcane lapis', 'Raw materials', 0.16],
        flux_dust: ['Redstone flux', 'Components', 0.08],
        slime_gel: ['Bio-slime gel', 'Raw materials', 0.14],
        cinder_rod: ['Blaze cinder rod', 'Components', 0.22],
        wraith_tear: ['Wraith tear', 'Components', 0.10],
        spider_silk: ['Arachnid silk', 'Raw materials', 0.08],
        xp_bottle: ["Bottle o' Skilling", 'Consumables', 0.18],

        // Signature Minecraft-Inspired Relics & Consumables
        phase_pearl: ['Phase ender-pearl', 'Consumables', 0.16],
        chorus_fruit: ['Chorus fruit', 'Food', 0.14],
        resurrection_idol: ['Totem of Undying', 'Equipment', 0.45],
        gilded_apple: ['Golden apple', 'Food', 0.22],
        enchanted_apple: ['Enchanted golden apple', 'Food', 0.26],
        milk_flask: ['Purifying milk flask', 'Consumables', 0.28],

        // Alchemy Potions & Draughts
        swiftness_draught: ['Swiftness potion', 'Consumables', 0.22],
        leaping_draught: ['Leaping potion', 'Consumables', 0.22],
        strength_draught: ['Strength potion', 'Consumables', 0.22],
        night_vision_draught: ['Night-sight potion', 'Consumables', 0.22],
        fire_ward_draught: ['Fire-ward potion', 'Consumables', 0.22],
        turtle_shell_brew: ['Iron-shell potion', 'Consumables', 0.25],
        phantom_draught: ['Shadow-veil potion', 'Consumables', 0.22],
        regen_draught: ['Regeneration potion', 'Consumables', 0.22],

        // Farming Crops, Produce & Bakery Meals
        wheat: ['Golden wheat', 'Raw materials', 0.08],
        flour: ['Milled flour', 'Components', 0.10],
        bread: ['Artisan bread', 'Food', 0.20],
        apple: ['Orchard apple', 'Food', 0.12],
        carrot: ['Wild carrot', 'Food', 0.10],
        golden_carrot: ['Golden carrot', 'Food', 0.16],
        potato: ['Field potato', 'Food', 0.12],
        baked_potato: ['Baked potato', 'Food', 0.14],
        pumpkin: ['Harvest pumpkin', 'Raw materials', 0.50],
        pumpkin_pie: ['Spiced pumpkin pie', 'Food', 0.30],
        sugar_reed: ['Sugar reed', 'Raw materials', 0.10],
        sugar: ['Refined sugar', 'Components', 0.08],
        cocoa_beans: ['Cocoa pods', 'Raw materials', 0.08],
        cookie_ration: ['Trail cookies', 'Food', 0.08],
        melon_slice: ['Juicy melon slice', 'Food', 0.12],
        glistering_melon: ['Glistering melon', 'Food', 0.18],
        rabbit_ragout: ['Root & rabbit ragout', 'Food', 0.42],
        cake_slice: ['Celebration cake', 'Food', 0.34],

        // Tactical Gadgets, Demolition & Endgame Gear
        grappling_hook: ['Grappling launcher', 'Equipment', 0.65],
        tnt_charge: ['Demolition TNT block', 'Equipment', 0.68],
        magnet_charm: ['Lodestone magnet', 'Equipment', 0.24],
        super_boss_beacon: ['Apex Titan Beacon', 'Equipment', 0.58],
        abyssal_armor: ['Abyssal trauma rig', 'Equipment', 3.20],
        fort_flare: ['Militia fort flare', 'Consumables', 0.22]
    };
    Object.assign(F.items, NEW_ITEMS);

    /* ------------------------------------------------------------ 2. TOOLS */
    Object.assign(F.tools, {
        shears: { name: 'Salvage shears', family: 'axe', level: 2, wear: 78, power: 2.5, cost: { ingot: 2, cord: 1 }, station: 'hand' },
        diamondAxe: { name: 'Diamond war-axe', family: 'axe', level: 3, wear: 145, power: 4.0, cost: { diamond_shard: 2, planks: 2, cord: 1 }, station: 'bench' },
        diamondPick: { name: 'Diamond pickaxe', family: 'pick', level: 3, wear: 160, power: 4.0, cost: { diamond_shard: 3, planks: 2, cord: 1 }, station: 'bench' },
        abyssalAxe: { name: 'Abyssal cleaver-axe', family: 'axe', level: 4, wear: 240, power: 5.6, cost: { abyssal_alloy: 1, diamond_shard: 1, ingot: 2 }, station: 'bench' },
        abyssalPick: { name: 'Abyssal world-pick', family: 'pick', level: 4, wear: 260, power: 5.6, cost: { abyssal_alloy: 1, diamond_shard: 2, ingot: 2 }, station: 'bench' }
    });

    /* ------------------------------------------------------------ 3. WILD DEPOSITS */
    Object.assign(F.resources, {
        emerald_vein: { name: 'Emerald seam', tool: 'pick', tier: 2, strokes: 4, gain: { emerald_chip: 2, stone: 1 }, color: 0x22c55e },
        diamond_seam: { name: 'Diamond kimberlite', tool: 'pick', tier: 2, strokes: 5, gain: { diamond_shard: 2, quartz: 1 }, color: 0x38bdf8 },
        lapis_outcrop: { name: 'Lapis lazuli vein', tool: 'pick', tier: 1, strokes: 3, gain: { lapis_prism: 3, stone: 1 }, color: 0x3b82f6 },
        flux_vein: { name: 'Redstone flux seam', tool: 'pick', tier: 1, strokes: 3, gain: { flux_dust: 4, copper: 1 }, color: 0xef4444 },
        wheat_patch: { name: 'Wild wheat stand', strokes: 1, gain: { wheat: 3, cropSeeds: 1 }, color: 0xeab308 },
        root_patch: { name: 'Wild root vegetables', strokes: 1, gain: { carrot: 2, potato: 2 }, color: 0xf97316 },
        melon_patch: { name: 'Gourd & melon vine', strokes: 1, gain: { melon_slice: 3, pumpkin: 1 }, color: 0x65a30d },
        reed_clump: { name: 'Waterside sugar reeds', strokes: 1, gain: { sugar_reed: 3, fiber: 1 }, color: 0x84cc16 }
    });

    // Deterministically scatter the new deposits across Exclusion Zone biomes
    (function scatterExpansionDeposits() {
        const Z = BO.Zone;
        if (!Z?.deposits) return;
        let s = 918273;
        const R = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
        const biomeTable = {
            meadow: [['wheat_patch', 4], ['root_patch', 3], ['reed_clump', 2], ['lapis_outcrop', 1]],
            town: [['wheat_patch', 2], ['root_patch', 2], ['flux_vein', 1]],
            forest: [['root_patch', 3], ['melon_patch', 3], ['lapis_outcrop', 2], ['emerald_vein', 1]],
            industrial: [['flux_vein', 4], ['lapis_outcrop', 1], ['emerald_vein', 1]],
            wetland: [['reed_clump', 5], ['melon_patch', 3], ['lapis_outcrop', 2], ['emerald_vein', 1]],
            alpine: [['emerald_vein', 3], ['diamond_seam', 3], ['lapis_outcrop', 2]],
            ash: [['flux_vein', 4], ['diamond_seam', 2], ['emerald_vein', 1]],
            campus: [['flux_vein', 3], ['diamond_seam', 2]],
            crater: [['diamond_seam', 4], ['emerald_vein', 3], ['flux_vein', 2]]
        };
        const B = Z.BOUNDS;
        for (let x = B.minX + 24; x < B.maxX - 24; x += 22) {
            for (let z = B.minZ + 24; z < B.maxZ - 24; z += 22) {
                if (R() > 0.34) continue;
                const px = x + (R() - 0.5) * 14;
                const pz = z + (R() - 0.5) * 14;
                const reg = Z.regionAt(px, pz);
                const list = biomeTable[reg.biome];
                if (!list) continue;
                const h = Z.rawFinal(px, pz);
                if (Z.inReservoir(px, pz) && h < Z.WATER + 0.2) continue;
                if (Z.roadInfo(px, pz)?.d < 5.5) continue;
                if (Z.pois.some((p) => Math.abs(px - p.x) < p.w / 2 + 3.5 && Math.abs(pz - p.z) < p.d / 2 + 3.5)) continue;
                const total = list.reduce((a, [, w]) => a + w, 0);
                let roll = R() * total;
                let kind = list[0][0];
                for (const [k, w] of list) {
                    roll -= w;
                    if (roll <= 0) { kind = k; break; }
                }
                Z.deposits.push({ kind, x: +px.toFixed(1), y: +h.toFixed(2), z: +pz.toFixed(1), region: reg.id });
            }
        }
    })();

    // Also add fair loot chances into ZoneLoot tables so scavenging yields new items too
    if (BO.ZoneLoot?.TABLES) {
        const T = BO.ZoneLoot.TABLES;
        if (T.civilian) T.civilian.push(['apple', 3], ['wheat', 3], ['carrot', 2], ['potato', 2], ['emerald_chip', 1]);
        if (T.medical) T.medical.push(['milk_flask', 2], ['regen_draught', 1], ['golden_carrot', 1]);
        if (T.industrial) T.industrial.push(['flux_dust', 3], ['spider_silk', 2], ['tnt_charge', 1]);
        if (T.military) T.military.push(['emerald_chip', 2], ['xp_bottle', 2], ['phase_pearl', 1], ['fort_flare', 1]);
        if (T.science) T.science.push(['lapis_prism', 3], ['wraith_tear', 2], ['diamond_shard', 2], ['phase_pearl', 2], ['xp_bottle', 2]);
    }

    /* ------------------------------------------------------------ 4. BUILDINGS (26 NEW) */
    const NEW_BUILDINGS = [
        // Walkable Stairs (snap to 2.8m grid, build 4 physical ascending steps!)
        { id: 'woodStairs', name: 'Timber stairs', size: [2.8, 2.8, 2.8], cost: { planks: 4, timber: 2 }, color: 0x9a6d43, detail: 'Walkable 2.8 m timber staircase connecting ground and upper floors smoothly.' },
        { id: 'stoneStairs', name: 'Masonry stairs', size: [2.8, 2.8, 2.8], cost: { brick: 4, stone: 4 }, color: 0x7e858c, detail: 'Reinforced stone staircase with high structural support and blast resistance.' },
        { id: 'obsidianStairs', name: 'Obsidian stairs', size: [2.8, 2.8, 2.8], cost: { obsidian: 3, ingot: 2 }, color: 0x35264c, detail: 'Blast-proof volcanic staircase capable of supporting heavy upper fortresses.' },

        // Interactive Hinged Doors & Gates ([E] swings open/closed!)
        { id: 'woodDoor', name: 'Hinged timber door', size: [2.8, 2.8, 0.34], cost: { planks: 4, cord: 1 }, color: 0x8b5e36, detail: 'Framed doorway with a hinged wooden door leaf. Press Interact [E] to swing open or shut.' },
        { id: 'ironDoor', name: 'Armoured vault door', size: [2.8, 2.8, 0.36], cost: { ingot: 4, scrap: 3 }, color: 0x67737e, detail: 'Heavy steel security door inside a reinforced frame. Press [E] to open or seal.' },
        { id: 'doubleGate', name: 'Fortress double gate', size: [2.8, 2.8, 0.40], cost: { planks: 5, ingot: 3 }, color: 0x5c4734, detail: 'Wide compound gate for vehicles and fort courtyards. Press [E] to swing both leaves.' },

        // Storage Chests & Quantum Ender Stash
        { id: 'supplyCrate', name: 'Reinforced supply crate', size: [1.32, 0.78, 0.88], cost: { planks: 4, ingot: 1 }, color: 0x7e6442, detail: 'Expanded storage crate: holds 24 distinct stacks up to 85 kg.' },
        { id: 'ironVault', name: 'Armoured iron locker', size: [1.38, 1.45, 0.82], cost: { ingot: 5, scrap: 4 }, color: 0x56636d, detail: 'High-capacity steel safe: holds 36 distinct stacks up to 150 kg.' },
        { id: 'quantumChest', name: 'Quantum ender-chest', size: [1.18, 0.86, 0.80], cost: { obsidian: 3, phase_pearl: 1, gold: 1 }, color: 0x2b1d42, detail: 'Shared dimensional stash (30 stacks / 120 kg): items placed inside are accessible from EVERY Quantum Chest across the Zone!' },

        // Crafting, Alchemy, Arcane & Utility Stations
        { id: 'alchemyStand', name: 'Alchemy brewing stand', size: [1.05, 1.25, 0.95], cost: { stone: 4, cinder_rod: 1, glass: 2 }, color: 0x7c5338, detail: 'Unlocks Alchemy recipes within 4 m: brew Swiftness, Leaping, Strength, Night-Sight, Fire-Ward, Iron-Shell & Regeneration potions.' },
        { id: 'arcaneTable', name: 'Arcane rune table', size: [1.22, 1.12, 1.22], cost: { obsidian: 2, lapis_prism: 3, diamond_shard: 1 }, color: 0x3b2358, detail: 'Unlocks Arcane synthesis recipes (Totem of Undying, Enchanted Apples, Bottles o\' Skilling) and boosts nearby crafting XP.' },
        { id: 'autoCollector', name: 'Hopper collector', size: [1.05, 0.92, 1.05], cost: { ingot: 3, flux_dust: 2, planks: 2 }, color: 0x4b5563, detail: 'Automated vacuum hopper: every few seconds pulls nearby 3D world pickups and loot bags within 10 m into your nearest storage chest!' },
        { id: 'wellPump', name: 'Deep-well hand pump', size: [1.15, 1.35, 1.15], cost: { stone: 6, ingot: 2, cord: 1 }, color: 0x64748b, detail: 'Draws clean filtered groundwater: press [E] every 25 s to collect 2 Fresh Water.' },
        { id: 'compostBin', name: 'Compost & seed bin', size: [1.10, 0.95, 1.10], cost: { planks: 4, fiber: 3 }, color: 0x6b533b, detail: 'Press [E] to convert spare plant fiber or berries into Bone Meal fertiliser and Crop Seeds.' },

        // Architecture, Watchtowers & Defensive Fortifications
        { id: 'halfWall', name: 'Timber half-wall', size: [2.8, 1.25, 0.34], cost: { planks: 2 }, color: 0x8f663f, detail: 'Chest-high firing parapet: blocks crawlers while letting you shoot over the top or vault across.' },
        { id: 'stoneHalfWall', name: 'Masonry parapet', size: [2.8, 1.30, 0.38], cost: { brick: 2, stone: 2 }, color: 0x788088, detail: 'Bullet-resistant stone battlement wall for rooftop sniper nests and fort walls.' },
        { id: 'windowWall', name: 'Windowed wall', size: [2.8, 2.8, 0.34], cost: { planks: 3, timber: 1 }, color: 0x8a613c, detail: 'Full-height structural wall with a central shooting embrasure for defending against hordes.' },
        { id: 'archway', name: 'Masonry archway', size: [2.8, 2.8, 0.38], cost: { brick: 3, stone: 2 }, color: 0x7b828a, detail: 'Load-bearing stone wall frame with an open walk-through arch.' },
        { id: 'catwalk', name: 'Steel grate catwalk', size: [2.8, 0.24, 1.4], cost: { ingot: 2, scrap: 3 }, color: 0x5c6873, detail: 'Lightweight overhead walkway that carries structural support further outward.' },
        { id: 'railing', name: 'Safety guard rail', size: [2.8, 1.05, 0.18], cost: { planks: 1, scrap: 1 }, color: 0x78634c, detail: 'Balcony and catwalk railing you can shoot over or vault smoothly across.' },
        { id: 'pillar', name: 'Support column', size: [0.55, 2.8, 0.55], cost: { stone: 3, timber: 2 }, color: 0x757b82, detail: 'Vertical load-bearing pillar that transfers 94% structural integrity straight up to upper floors.' },
        { id: 'watchtower', name: 'Sniper watchtower', size: [2.8, 4.2, 2.8], cost: { timber: 8, planks: 6, cord: 3 }, color: 0x835d3b, detail: '4.2 m elevated timber overwatch deck with guard rails and a built-in ladder ([E] to climb up/down).' },
        { id: 'sandbagWall', name: 'Sandbag bunker line', size: [2.6, 1.15, 0.72], cost: { sand: 3, cloth: 2 }, color: 0xb4a27b, detail: 'Heavy ballistic sandbag barricade that absorbs gunfire and slows charging infected.' },
        { id: 'barbedWire', name: 'Razor-wire entanglement', size: [2.6, 0.85, 0.95], cost: { wire: 2, scrap: 3 }, color: 0x77828c, detail: 'Snags and bleeds any hostile pushing through it while slowing their movement by 60%.' },
        { id: 'spikeWall', name: 'Iron-tipped log spikes', size: [2.6, 1.45, 0.85], cost: { timber: 5, ingot: 2 }, color: 0x7b5638, detail: 'Angled palisade stakes that deal heavy reflection damage whenever horde infected slam into them.' },
        { id: 'floodlight', name: 'Halogen floodlight', size: [0.55, 2.15, 0.55], cost: { ingot: 2, wire: 2, glass: 1 }, color: 0x94a3b8, detail: 'High-powered security lamp mast that illuminates a wide 22 m perimeter around your base.' }
    ];
    for (const b of NEW_BUILDINGS) {
        if (!CD.build.some((x) => x.id === b.id)) CD.build.push(b);
        if (!F.buildings.some((x) => x.id === b.id)) F.buildings.push(b);
    }

    /* ------------------------------------------------------------ 5. RECIPES (72 NEW) */
    const r = (id, name, station, cost, gain, desc, cat) => ({ id, name, station, cost, gain, desc, cat });
    const NEW_RECIPES = [
        // --- Hand Crafting (Accessible anywhere, zero softlocks) ---
        r('millFlour', 'Grind wheat flour', 'hand', { wheat: 2 }, { flour: 2 }, 'Crush wild or farmed wheat into baking flour by hand.', 'materials'),
        r('refineSugar', 'Refine reed sugar', 'hand', { sugar_reed: 2 }, { sugar: 3 }, 'Press sweet reeds into energizing crystal sugar.', 'materials'),
        r('spinSilk', 'Spin synthetic arachnid silk', 'hand', { fiber: 3, resin: 1 }, { spider_silk: 2 }, 'Alternative path to arachnid silk without hunting crawlers.', 'materials'),
        r('silkBandage', 'Silk trauma wrap', 'hand', { spider_silk: 2, herbs: 1 }, { bandage: 3 }, 'Weave sterile arachnid silk and bitterleaf into three dressings.', 'medical'),
        r('melonSeeds', 'Slice pumpkin seeds', 'hand', { pumpkin: 1 }, { cropSeeds: 3 }, 'Extract three plantable garden seeds from a harvest pumpkin.', 'materials'),
        r('wheatSeeds', 'Thresh wheat seeds', 'hand', { wheat: 1 }, { cropSeeds: 2 }, 'Save grain kernels for Homestead planters or Relay garden beds.', 'materials'),
        r('craftFortFlare', 'Militia distress flare', 'hand', { powder: 1, resin: 1, cloth: 1 }, { fort_flare: 1 }, 'Signal the nearest Survivor Fort or call friendly militia ammo support.', 'gear'),
        r('handTorchResin', 'Tallow-resin torches', 'hand', { timber: 1, fat: 1 }, { torch: 3 }, 'Use animal tallow in place of resin and fiber to bundle three torches.', 'lighting'),

        // --- Campfire & Cooking Station (Bakery, Farming & Gourmet Buffs) ---
        r('bakeBread', 'Bake artisan bread', 'campfire', { flour: 2 }, { bread: 2 }, 'Warm, crusted loaves (+32 food, +6 HP each).', 'food'),
        r('bakePotato', 'Roast jacket potatoes', 'campfire', { potato: 2 }, { baked_potato: 2 }, 'Hot campfire potatoes (+34 food, +8 HP, warming).', 'food'),
        r('bakeCookies', 'Bake trail cookies', 'campfire', { flour: 1, sugar: 1, cocoa_beans: 1 }, { cookie_ration: 4 }, 'Four crunchy morale cookies (+16 food, +12 composure, instant stamina).', 'food'),
        r('bakeCookiesHoney', 'Honey-oat trail cookies', 'campfire', { flour: 1, honey: 1 }, { cookie_ration: 3 }, 'Alternative cookie recipe using wild honeycomb instead of cocoa.', 'food'),
        r('cookPumpkinPie', 'Spiced pumpkin pie', 'cookstation', { pumpkin: 1, sugar: 1, egg: 1 }, { pumpkin_pie: 2 }, 'Two rich autumn pies (+46 food, +15 HP, +30 composure).', 'food'),
        r('cookRabbitRagout', 'Root & rabbit ragout', 'cookstation', { cooked_rabbit: 1, carrot: 1, potato: 1, mushroom: 1 }, { rabbit_ragout: 1 }, 'Hearty frontier stew (+68 food, +30 water, +28 HP, warmth).', 'food'),
        r('bakeCake', 'Celebration cake', 'cookstation', { flour: 2, sugar: 2, egg: 2, berries: 2 }, { cake_slice: 2 }, 'Two slices of morale-boosting cake (+75 food, +35 HP, +50 composure, sprint buff).', 'food'),
        r('craftGoldenCarrot', 'Gilded night-carrot', 'bench', { carrot: 2, gold: 1 }, { golden_carrot: 2 }, 'Gold-infused carrots (+48 food, +22 HP, night clarity).', 'food'),
        r('craftGlisteringMelon', 'Glistering melon', 'bench', { melon_slice: 2, gold: 1 }, { glistering_melon: 2 }, 'Restores +20 food, +25 water, and +40 instant HP.', 'food'),
        r('craftGildedApple', 'Golden apple', 'bench', { apple: 1, gold: 2 }, { gilded_apple: 1 }, 'Iconic golden fruit: +30 food, +50 HP, +50 armour, and 35 s rapid regeneration.', 'food'),
        r('craftMilkFlask', 'Purifying milk flask', 'campfire', { bottle: 1, herbs: 2, freshWater: 1 }, { milk_flask: 1 }, 'Herbal emulsion that purges bleeding, infection, fracture limp, and 35 radiation.', 'medical'),
        r('craftChorusFruit', 'Cultivate chorus fruit', 'bench', { berries: 2, aetherShard: 1 }, { chorus_fruit: 2 }, 'Resonance-infused fruit (+18 food & instant 8 m blink-step out of danger).', 'food'),

        // --- Stone Kiln (Smelting, Gem Synthesis & High-Tier Alloys — Fair Multi-Path!) ---
        r('kilnCharcoalBatch', 'Kiln charcoal batch', 'kiln', { timber: 5 }, { coal: 4 }, 'High-efficiency charcoal burn inside an enclosed kiln.', 'materials'),
        r('kilnEmeraldSynth', 'Crystallise trader emerald', 'kiln', { quartz: 3, gold: 1, copper: 2 }, { emerald_chip: 2 }, 'Synthesise two Trader Emeralds from local minerals when no seam is nearby.', 'materials'),
        r('kilnDiamondPress', 'High-pressure diamond crystal', 'kiln', { coal: 8, quartz: 3, obsidian: 1 }, { diamond_shard: 1 }, 'Compress carbon coal and volcanic obsidian into a pure Diamond Crystal.', 'materials'),
        r('kilnAbyssalAlloy', 'Forge Abyssal ingot', 'kiln', { obsidian: 3, gold: 2, diamond_shard: 1 }, { abyssal_alloy: 1 }, 'Smelt volcanic obsidian, gold, and diamond into an endgame Abyssal Ingot.', 'materials'),
        r('kilnCinderRod', 'Forge Blaze cinder rod', 'kiln', { sulfur: 2, ingot: 1, coal: 2 }, { cinder_rod: 1 }, 'Craft an incandescent Cinder Rod without travelling to Cinder Flats.', 'materials'),
        r('kilnFluxDust', 'Refine Redstone flux', 'kiln', { copper: 2, quartz: 1, coal: 1 }, { flux_dust: 4 }, 'Extract conductive redstone flux dust from copper and luminous quartz.', 'materials'),
        r('kilnSlimeGel', 'Render bio-slime gel', 'campfire', { resin: 2, fat: 1, freshWater: 1 }, { slime_gel: 2 }, 'Boil pine resin and tallow into elastic bio-slime gel.', 'materials'),
        r('kilnWraithTear', 'Distil wraith tear', 'kiln', { aetherShard: 1, quartz: 2, glass: 1 }, { wraith_tear: 1 }, 'Condense Aether resonance into a spectral Wraith Tear.', 'materials'),

        // --- Alchemy Brewing Stand (Potions! Also craftable with a slight surcharge or direct at Alchemy Stand) ---
        r('brewSwiftness', 'Brew Swiftness potion', 'alchemy', { bottle: 1, sugar: 2, flux_dust: 1 }, { swiftness_draught: 2 }, '+30% movement and sprint speed for 90 seconds.', 'potions'),
        r('brewLeaping', 'Brew Leaping potion', 'alchemy', { bottle: 1, slime_gel: 1, feather: 2 }, { leaping_draught: 2 }, '+45% jump height and complete fall/fracture immunity for 90 seconds.', 'potions'),
        r('brewStrength', 'Brew Strength potion', 'alchemy', { bottle: 1, cinder_rod: 1, powder: 1 }, { strength_draught: 2 }, '+35% firearm and melee damage for 75 seconds.', 'potions'),
        r('brewNightSight', 'Brew Night-sight potion', 'alchemy', { bottle: 1, golden_carrot: 1, quartz: 1 }, { night_vision_draught: 2 }, 'Illuminates the darkest nights & caverns and restores +35 composure for 120 seconds.', 'potions'),
        r('brewFireWard', 'Brew Fire-ward potion', 'alchemy', { bottle: 1, slime_gel: 1, cinder_rod: 1 }, { fire_ward_draught: 2 }, 'Grants fire immunity, +16°C warmth, and -30 radiation for 120 seconds.', 'potions'),
        r('brewIronShell', 'Brew Iron-shell potion', 'alchemy', { bottle: 1, ingot: 2, obsidian: 1 }, { turtle_shell_brew: 1 }, '+45% incoming damage resistance and +40 armour for 50 seconds.', 'potions'),
        r('brewShadowVeil', 'Brew Shadow-veil potion', 'alchemy', { bottle: 1, mushroom: 2, spider_silk: 1, coal: 1 }, { phantom_draught: 2 }, 'Cloaks your silhouette and footsteps (-70% enemy detection range) for 60 seconds.', 'potions'),
        r('brewRegen', 'Brew Regeneration potion', 'alchemy', { bottle: 1, wraith_tear: 1, honey: 1 }, { regen_draught: 2 }, 'Regenerates +4 HP/s for 40 seconds (160 HP total) and stops bleeding.', 'potions'),

        // Field Bench Fallback Tonics (so players can also brew single doses at a Workbench before building an Alchemy Stand!)
        r('benchSwiftness', 'Field Swiftness draught', 'bench', { freshWater: 1, sugar: 3, herbs: 1 }, { swiftness_draught: 1 }, 'Single-dose field speed brew craftable at any Workbench.', 'potions'),
        r('benchStrength', 'Field Strength draught', 'bench', { freshWater: 1, cinder_rod: 1, herbs: 2 }, { strength_draught: 1 }, 'Single-dose combat strength brew craftable at any Workbench.', 'potions'),
        r('benchNightSight', 'Field Night-sight draught', 'bench', { freshWater: 1, carrot: 2, quartz: 2 }, { night_vision_draught: 1 }, 'Single-dose night-vision brew craftable at any Workbench.', 'potions'),

        // --- Arcane Rune Table & Relic Synthesis ---
        r('arcaneXpBottle', "Bottle o' Skilling (×2)", 'arcane', { bottle: 2, lapis_prism: 2, quartz: 2 }, { xp_bottle: 2 }, 'Bottle pure Zone experience: smash to gain +160 XP & +30 Runes per bottle!', 'potions'),
        r('benchXpBottle', "Distil Bottle o' Skilling", 'bench', { bottle: 1, lapis_prism: 2, aetherShard: 1 }, { xp_bottle: 1 }, 'Workbench synthesis for a Bottle o\' Skilling (+160 XP & +30 Runes).', 'potions'),
        r('arcanePhasePearl', 'Attune Phase ender-pearl (×2)', 'arcane', { quartz: 2, lapis_prism: 1, wraith_tear: 1 }, { phase_pearl: 2 }, 'Throw/activate to teleport instantly up to 28 m to your crosshair aim!', 'gear'),
        r('benchPhasePearl', 'Craft Phase ender-pearl', 'bench', { aetherShard: 1, obsidian: 1, flux_dust: 2 }, { phase_pearl: 1 }, 'Workbench path to craft a teleporting Phase Ender-Pearl.', 'gear'),
        r('arcaneTotem', 'Forge Totem of Undying', 'arcane', { gold: 3, emerald_chip: 2, wraith_tear: 1 }, { resurrection_idol: 1 }, 'Carried relic that automatically saves you from fatal damage with HP, armour & a golden shockwave!', 'gear'),
        r('benchTotem', 'Assemble Totem of Undying', 'bench', { gold: 4, emerald_chip: 3, aetherShard: 2 }, { resurrection_idol: 1 }, 'Workbench path to forge a life-saving Totem of Undying.', 'gear'),
        r('arcaneEnchantedApple', 'Enchanted golden apple', 'arcane', { gilded_apple: 1, diamond_shard: 1, lapis_prism: 2, gold: 2 }, { enchanted_apple: 1 }, 'Supreme relic meal: full HP, +120 armour, 60 s regen, 30% damage resist & hazard immunity.', 'food'),

        // --- Workbench Gadgets, Ammunition, Kits & Endgame Gear ---
        r('craftGrapple', 'Grappling launcher', 'bench', { ingot: 3, spider_silk: 3, flux_dust: 2 }, { grappling_hook: 1 }, 'Reusable zip-hook! Activate on your hotbar to zip up to 28 m onto rooftops, cliffs, and towers.', 'gear'),
        r('craftTNT', 'Demolition TNT block (×2)', 'bench', { powder: 3, sand: 2, flux_dust: 1 }, { tnt_charge: 2 }, 'Deploys a primed 3D red TNT block that detonates in a massive 9 m explosion!', 'weapons'),
        r('craftMagnet', 'Lodestone magnet charm', 'bench', { ingot: 3, flux_dust: 3, quartz: 1 }, { magnet_charm: 1 }, 'Passively pulls world pickups from 9.8 m away, or activate to vacuum all loot within 16 m!', 'gear'),
        r('craftApexBeacon', 'Apex Titan Beacon', 'bench', { abyssal_alloy: 1, cinder_rod: 1, aetherShard: 2 }, { super_boss_beacon: 1 }, 'Summons one of the 5 Colossal Super Bosses for apex loot, Abyssal Ingots, and Legendary weapons!', 'weapons'),
        r('craftObsidianArmor', 'Obsidian plate rig', 'bench', { obsidian: 4, leather: 3, ingot: 3 }, { obsidian_armor: 1 }, 'Raises max armour to 180 and restores +140 armour.', 'gear'),
        r('craftAbyssalArmor', 'Abyssal trauma rig', 'bench', { abyssal_alloy: 2, obsidian_armor: 1, diamond_shard: 1 }, { abyssal_armor: 1 }, 'Raises max armour to 220, restores +200 armour, and grants fire & knockback resistance!', 'gear'),

        // Fair Multi-Path Ammunition, Electronics & Attachment Kits (no RNG lockouts!)
        r('mintAmmo9', 'Manufacture 9×19mm (×30)', 'bench', { ingot: 1, powder: 1, copper: 1 }, { ammo9: 30 }, 'Forge fresh 9mm rounds from raw ore and propellant without needing spent brass.', 'weapons'),
        r('mintAmmo556', 'Manufacture 5.56mm (×28)', 'bench', { ingot: 1, powder: 2, copper: 1 }, { ammo556: 28 }, 'Forge fresh 5.56mm rifle ammunition from iron, copper, and gunpowder.', 'weapons'),
        r('mintAmmo762', 'Manufacture 7.62mm (×22)', 'bench', { ingot: 2, powder: 2, copper: 1 }, { ammo762: 22 }, 'Forge heavy 7.62mm rifle & LMG cartridges from scratch.', 'weapons'),
        r('mintAmmo12', 'Manufacture 12-gauge (×16)', 'bench', { scrap: 2, powder: 2, copper: 1 }, { ammo12: 16 }, 'Pack 16 fresh buckshot shells from salvage, copper, and powder.', 'weapons'),
        r('craftBattery', 'Assemble high-drain battery', 'bench', { copper: 2, flux_dust: 2, ingot: 1 }, { battery: 2 }, 'Build two fresh batteries from copper and redstone flux.', 'materials'),
        r('craftCircuit', 'Etch circuit board', 'bench', { copper: 2, gold: 1, flux_dust: 2, quartz: 1 }, { circuit: 2 }, 'Etch precision printed circuits for turrets and electronics.', 'materials'),
        r('craftRadioParts', 'Assemble transceiver module', 'bench', { circuit: 1, wire: 2, battery: 1 }, { radioParts: 1 }, 'Build radio tower replacement parts at your workbench.', 'materials'),
        r('craftOpticKit', 'Precision optic kit', 'bench', { lens: 2, ingot: 1, gold: 1 }, { optic_kit: 1 }, 'Mount rifle scopes and sights at an Armory bench.', 'weapons'),
        r('craftSuppressorKit', 'Baffled suppressor kit', 'bench', { ingot: 2, cloth: 2, scrap: 2 }, { suppressor_kit: 1 }, 'Craft a firearm sound suppressor kit.', 'weapons'),
        r('craftMagKit', 'Extended magazine kit', 'bench', { ingot: 2, wire: 2, scrap: 2 }, { mag_kit: 1 }, 'Craft a high-capacity magazine upgrade kit.', 'weapons'),
        r('craftMedkitBench', 'Field trauma kit (×2)', 'bench', { bandage: 2, antibiotic: 1, cloth: 2 }, { medkits: 2 }, 'Pack two full-strength trauma kits from dressings and antibiotics.', 'medical'),
        r('craftSplintHand', 'Emergency field splint', 'hand', { timber: 2, cloth: 1, cord: 1 }, { splint: 1 }, 'Bind timber and cloth by hand to set a broken leg anywhere.', 'medical'),
        r('craftPainkillers', 'Herbal analgesic pills', 'campfire', { herbs: 3, honey: 1, sugar: 1 }, { painkillers: 2 }, 'Compound soothing painkillers at a campfire (+10 HP, +20 composure, 90 s limp relief).', 'medical'),
        r('craftKeycard', 'Clone campus keycard', 'arcane', { circuit: 2, gold: 1, aetherShard: 1, lapis_prism: 1 }, { keycard: 1 }, 'Arcane-electronic bypass: clone a Black Pine security keycard from high-tier components.', 'gear'),
        r('salvageToEmerald', 'Mint barter emerald', 'bench', { gold: 1, lapis_prism: 2, scrap: 4 }, { emerald_chip: 1 }, 'Mint a Trader Emerald from gold, lapis, and salvage.', 'materials')
    ];

    for (const rec of NEW_RECIPES) {
        if (!F.recipes.some((x) => x.id === rec.id)) F.recipes.push(rec);
    }

    /* ------------------------------------------------------------ 6. ITEM INFO & HOTBAR USABLES */
    const ITEM_DESCRIPTIONS = {
        emerald_chip: 'Cut green beryl prism prized by Roaming Black Market brokers and specialist contacts. Mine from emerald seams, synthesise in a kiln, earn from Fort Sieges, or barter salvage for it.',
        diamond_shard: 'Ultra-hard crystalline diamond. Forges Tier-3 Diamond tools, Arcane Rune Tables, Enchanted Apples, and Abyssal Ingots. Mined in alpine/crater seams, pressed in a kiln, or looted from Fort vaults.',
        abyssal_alloy: 'Netherite-grade obsidian-gold-diamond alloy. Forges Tier-4 Abyssal tools, Abyssal Trauma Rigs, and Apex Titan Beacons. Smelt in a kiln, earn from Super Bosses, or trade with Warlord Krag.',
        lapis_prism: 'Deep-blue arcane mineral used at Arcane Rune Tables to distil Bottles o\' Skilling, Phase Pearls, and Enchanted Apples.',
        flux_dust: 'Conductive redstone flux dust. Powers Hopper Collectors, Demolition TNT, Grappling Launchers, Lodestone Magnets, and Swiftness potions.',
        slime_gel: 'Elastic bio-gel harvested from bloaters/spitters or rendered from pine resin and tallow. Brews Leaping and Fire-Ward potions.',
        cinder_rod: 'Incandescent core from scorched infected or forged in a kiln from sulfur, iron, and coal. Powers Alchemy Brewing Stands and Strength potions.',
        wraith_tear: 'Luminous spectral essence dropped by wraiths/stalkers or distilled from Aether shards. Brews Regeneration potions and Totems of Undying.',
        spider_silk: 'High-tensile silk gathered from crawlers or spun from plant fiber and resin. Crafts Grappling Launchers, Silk Dressings, and Shadow-Veil potions.',
        xp_bottle: 'Bottle o\' Skilling: smash on use to absorb +160 Survival XP and +30 Runes immediately!',
        phase_pearl: 'Phase Ender-Pearl: activate to throw/blink instantly up to 28 m to your crosshair aim point with 0.9 s phase invulnerability!',
        chorus_fruit: 'Resonance-grown fruit: restores +18 food and teleports you 8 m away from immediate danger.',
        resurrection_idol: 'Totem of Undying: keep in your backpack! Automatically triggers on fatal damage to save your life with 65% HP, +60 armour, 4 s invulnerability, cured injuries, and a golden shockwave!',
        gilded_apple: 'Golden Apple: restores +30 food, +50 HP, +50 bonus armour, and grants 35 seconds of rapid health regeneration.',
        enchanted_apple: 'Enchanted Golden Apple: restores +45 food, 100% HP, +120 armour, 60 s regeneration, 30% damage resistance, and fire/radiation immunity!',
        milk_flask: 'Purifying Milk Flask: instantly cures bleeding, bio-infection, and fracture limping while purging -35 radiation (+25 water).',
        swiftness_draught: 'Alchemy Potion: +30% movement and sprint speed for 90 seconds.',
        leaping_draught: 'Alchemy Potion: +45% jump height and zero fall or fracture damage for 90 seconds.',
        strength_draught: 'Alchemy Potion: +35% melee and firearm damage for 75 seconds.',
        night_vision_draught: 'Alchemy Potion: bright night-vision clarity in darkness/caverns and +35 composure for 120 seconds.',
        fire_ward_draught: 'Alchemy Potion: complete fire immunity, +16°C body warmth, and -30 radiation for 120 seconds.',
        turtle_shell_brew: 'Alchemy Potion: +45% incoming damage resistance and +40 armour for 50 seconds.',
        phantom_draught: 'Alchemy Potion: cloaks footsteps and silhouette, cutting enemy detection range by 70% for 60 seconds.',
        regen_draught: 'Alchemy Potion: regenerates +4 HP per second for 40 seconds (160 HP total) and stops bleeding.',
        wheat: 'Sun-ripened golden wheat. Grind by hand into flour for bread, cookies, and cakes, or thresh into crop seeds.',
        flour: 'Milled wheat flour ready for baking bread, cookies, and celebration cakes at a campfire or cooking station.',
        bread: 'Warm artisan bread loaf (+32 food, +6 HP).',
        apple: 'Crisp orchard apple (+14 food, +8 water, +4 HP). Can be gilded with gold bars into a Golden Apple.',
        carrot: 'Crisp wild carrot (+12 food, +5 water). Infuse with gold for night-clarity Golden Carrots.',
        golden_carrot: 'Gold-infused carrot (+48 food, +22 HP, +25 composure, and 45 s night-vision boost).',
        potato: 'Earthy field potato (+8 food raw). Roast at a campfire into a hot Baked Potato (+34 food).',
        baked_potato: 'Fluffy campfire-roasted potato (+34 food, +8 HP, warms the core).',
        pumpkin: 'Heavy autumn pumpkin. Bake into Spiced Pumpkin Pie or slice by hand into 3 Crop Seeds.',
        pumpkin_pie: 'Warm spiced pumpkin pie (+46 food, +15 HP, +30 composure).',
        sugar_reed: 'Sweet waterside cane. Press by hand into Refined Sugar.',
        sugar: 'Refined crystal sugar used in baking and Swiftness potions.',
        cocoa_beans: 'Aromatic cocoa pods harvested from broadleaf trees; used to bake Trail Cookies.',
        cookie_ration: 'Crunchy chocolate trail cookies (+16 food, +12 composure, instant stamina refill).',
        melon_slice: 'Refreshing melon wedge (+14 food, +22 hydration).',
        glistering_melon: 'Gold-flecked melon (+20 food, +25 hydration, and instant +40 HP heal).',
        rabbit_ragout: 'Slow-simmered rabbit, carrot, potato & mushroom stew (+68 food, +30 water, +28 HP, lasting warmth).',
        cake_slice: 'Rich frosted cake (+75 food, +35 HP, +50 composure, and 45 s sprint surge).',
        grappling_hook: 'Reusable Grappling Launcher! Activate from hotbar/inventory to fire a 28 m zip-line and pull yourself onto rooftops, cliffs, or towers (2.5 s cooldown).',
        tnt_charge: 'Demolition TNT Block: throws/places a primed 3D red TNT charge that hisses for 2.2 s and detonates in a massive 9 m blast (650 damage, clears nests)!',
        magnet_charm: 'Lodestone Magnet: passively expands 3D pickup vacuum range to 9.8 m while carried, or activate to pull all nearby drops & loot bags within 16 m!',
        super_boss_beacon: 'Apex Titan Beacon: calls down one of the 5 Colossal Super Bosses in the Zone for an epic battle with guaranteed Abyssal, Diamond & Legendary rewards!',
        abyssal_armor: 'Endgame Abyssal Trauma Rig: permanently raises max armour to 220, restores +200 armour, and grants fire & knockback resistance!',
        fort_flare: 'Survivor Distress Flare: marks and initiates liberation at the nearest unclaimed Survivor Fort, or calls a friendly militia ammo drop!'
    };
    if (BO.SurvivalItemInfo) Object.assign(BO.SurvivalItemInfo, ITEM_DESCRIPTIONS);

    const USABLE_IDS = [
        'xp_bottle', 'phase_pearl', 'chorus_fruit', 'gilded_apple', 'enchanted_apple', 'milk_flask',
        'swiftness_draught', 'leaping_draught', 'strength_draught', 'night_vision_draught',
        'fire_ward_draught', 'turtle_shell_brew', 'phantom_draught', 'regen_draught',
        'bread', 'apple', 'carrot', 'golden_carrot', 'potato', 'baked_potato', 'pumpkin_pie',
        'cookie_ration', 'melon_slice', 'glistering_melon', 'rabbit_ragout', 'cake_slice',
        'grappling_hook', 'tnt_charge', 'magnet_charm', 'super_boss_beacon', 'abyssal_armor', 'fort_flare'
    ];
    if (BO.SurvivalHotbar?.usable) {
        for (const id of USABLE_IDS) BO.SurvivalHotbar.usable.add(id);
    }

    BO.ZoneExpansionData = {
        NEW_ITEMS,
        NEW_BUILDINGS,
        NEW_RECIPES,
        ITEM_DESCRIPTIONS,
        USABLE_IDS
    };
})(window.BO);
