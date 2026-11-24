
(function (BO) {
    'use strict';

    const items = {
        scrap: ['Salvage', 'Components', 0.36],
        cloth: ['Cloth', 'Components', 0.16],
        fuel: ['Fuel', 'Components', 0.58],
        rations: ['Field rations', 'Consumables', 0.31],
        medkits: ['Trauma kits', 'Consumables', 0.42],
        coil: ['MRI coil', 'Components', 0.85],
        timber: ['Timber', 'Raw materials', 0.60],
        stone: ['Fieldstone', 'Raw materials', 0.55],
        iron: ['Iron ore', 'Raw materials', 0.72],
        coal: ['Coal', 'Raw materials', 0.38],
        copper: ['Copper ore', 'Raw materials', 0.55],
        quartz: ['Luminous quartz', 'Raw materials', 0.38],
        fiber: ['Plant fiber', 'Raw materials', 0.13],
        resin: ['Pine resin', 'Raw materials', 0.20],
        clay: ['Clay', 'Raw materials', 0.46],
        herbs: ['Bitterleaf', 'Raw materials', 0.10],
        planks: ['Sawn boards', 'Components', 0.42],
        cord: ['Braided cord', 'Components', 0.20],
        ingot: ['Iron bar', 'Components', 0.68],
        brick: ['Fired brick', 'Components', 0.48],
        wire: ['Copper wire', 'Components', 0.23],
        lens: ['Quartz lens', 'Components', 0.22],
        torch: ['Hand torch', 'Lighting', 0.40],
        lantern: ['Quartz lantern', 'Lighting', 0.82],
        bandage: ['Herbal dressing', 'Consumables', 0.15],
        tea: ['Bitterleaf tea', 'Consumables', 0.22],
        filter: ['Respirator filter', 'Consumables', 0.30],
        repair: ['Field repair kit', 'Consumables', 0.55],
        caveMap: ['Survey notes', 'Keys', 0.06],
        relic: ['Resonant core', 'Components', 0.65]
    };
    const packs = [
        { name: 'Field satchel', weight: 20, slots: 12 },
        { name: 'Trail pack', weight: 34, slots: 17 },
        { name: 'Expedition rucksack', weight: 51, slots: 23 },
        { name: 'Hauler frame', weight: 76, slots: 32 }
    ];
    const tools = {
        stoneAxe: { name: 'Stone hatchet', family: 'axe', level: 1, wear: 27, power: 1, cost: { timber: 2, stone: 2, cord: 1 }, station: 'hand' },
        ironAxe: { name: 'Iron felling axe', family: 'axe', level: 2, wear: 61, power: 2, cost: { planks: 2, ingot: 2, cord: 1 }, station: 'bench' },
        stonePick: { name: 'Stone pickaxe', family: 'pick', level: 1, wear: 28, power: 1, cost: { timber: 2, stone: 3, cord: 1 }, station: 'hand' },
        ironPick: { name: 'Iron pickaxe', family: 'pick', level: 2, wear: 65, power: 2, cost: { planks: 1, ingot: 3, cord: 1 }, station: 'bench' },
        miningDrill: { name: 'Salvage mining drill', family: 'pick', level: 3, wear: 88, power: 3, cost: { ingot: 3, wire: 3, lens: 1, fuel: 1 }, station: 'bench' },
        trenchSpade: { name: 'Trench shovel', family: 'shovel', level: 1, wear: 32, power: 1, cost: { timber: 2, scrap: 2, cord: 1 }, station: 'hand' },
        prospectSpade: { name: 'Prospector’s spade', family: 'shovel', level: 2, wear: 68, power: 2, cost: { planks: 1, ingot: 2, cord: 1 }, station: 'bench' },
        saw: { name: 'Bow saw', family: 'axe', level: 2, wear: 52, power: 3, cost: { ingot: 2, planks: 2, wire: 1 }, station: 'bench' }
    };
    const resources = {
        pine: { name: 'Pine timber', tool: 'axe', tier: 1, strokes: 3, gain: { timber: 4, resin: 1 }, color: 0x8d684a },
        hardwood: { name: 'Ridge hardwood', tool: 'axe', tier: 2, strokes: 4, gain: { timber: 7, resin: 2 }, color: 0xae8b60 },
        boulder: { name: 'Fractured boulder', tool: 'pick', tier: 1, strokes: 3, gain: { stone: 6 }, color: 0x94a4a0 },
        iron: { name: 'Iron vein', tool: 'pick', tier: 1, strokes: 4, gain: { iron: 4, stone: 2 }, color: 0xae785d },
        coal: { name: 'Coal seam', tool: 'pick', tier: 1, strokes: 3, gain: { coal: 4 }, color: 0x585967 },
        copper: { name: 'Copper vein', tool: 'pick', tier: 2, strokes: 3, gain: { copper: 5, stone: 1 }, color: 0x68a691 },
        quartz: { name: 'Luminous quartz', tool: 'pick', tier: 2, strokes: 4, gain: { quartz: 4 }, color: 0x9ed7ed },
        deep: { name: 'Resonant geode', tool: 'pick', tier: 3, strokes: 5, gain: { quartz: 5, relic: 1, iron: 2 }, color: 0xd1a8ec },
        clay: { name: 'Clay bank', tool: 'shovel', tier: 1, strokes: 2, gain: { clay: 5, fiber: 1 }, color: 0x9e765e },
        buried: { name: 'Buried salvage', tool: 'shovel', tier: 2, strokes: 3, gain: { scrap: 5, fuel: 1, coil: 1 }, color: 0xa7be83 },
        kindling: { name: 'Fallen branches', strokes: 1, gain: { timber: 2, resin: 1 }, color: 0x917553 },
        stones: { name: 'Loose stones', strokes: 1, gain: { stone: 3 }, color: 0x9fa69d },
        roots: { name: 'Fiber roots', strokes: 1, gain: { fiber: 3, herbs: 1 }, color: 0x85a56f },
        herbs: { name: 'Bitterleaf patch', strokes: 1, gain: { herbs: 3, fiber: 2 }, color: 0x81af6e }
    };
    const recipe = (id, name, station, cost, gain, desc, pack) => ({ id, name, station, cost, gain, desc, pack });
    const recipes = [
        recipe('braid', 'Braided cord', 'hand', { fiber: 3 }, { cord: 2 }, 'Bindings for early tools and building.'),
        recipe('splint', 'Hand torches', 'hand', { timber: 1, resin: 1, fiber: 1 }, { torch: 2 }, 'Portable light for ninety seconds per torch.'),
        recipe('dressing', 'Herbal dressings', 'hand', { cloth: 1, herbs: 2 }, { bandage: 2 }, 'Restore a small amount of health.'),
        recipe('fieldRepair', 'Field repair kit', 'hand', { scrap: 2, cord: 1 }, { repair: 1 }, 'Restores the equipped tool’s durability.'),
        recipe('sawBoards', 'Sawn boards', 'bench', { timber: 2 }, { planks: 3 }, 'Efficient building stock and handles.'),
        recipe('weaveCloth', 'Weave cloth', 'bench', { fiber: 4 }, { cloth: 1 }, 'Loom plant fiber into rough cloth for beds, dressings and packs.'),
        recipe('smelt', 'Smelt iron', 'kiln', { iron: 3, coal: 1 }, { ingot: 2 }, 'Forge parts for stronger tools.'),
        recipe('fireBricks', 'Fire bricks', 'kiln', { clay: 3, coal: 1 }, { brick: 3 }, 'Masonry for stronger walls and raised foundations.'),
        recipe('drawWire', 'Draw copper wire', 'bench', { copper: 2 }, { wire: 3 }, 'Conductive parts for the lamp and drill.'),
        recipe('cutLens', 'Cut a quartz lens', 'bench', { quartz: 2, stone: 1 }, { lens: 1 }, 'Clears the beam from a quartz lantern.'),
        recipe('makeLantern', 'Quartz lantern', 'bench', { lens: 1, wire: 1, ingot: 1 }, { lantern: 1 }, 'Reusable light. Each ignition consumes one fuel.'),
        recipe('brewTea', 'Bitterleaf tea', 'campfire', { herbs: 2 }, { tea: 1 }, 'Steadies composure and reduces radiation.'),
        recipe('charcoal', 'Make charcoal', 'campfire', { timber: 2 }, { coal: 1 }, 'Fuel an ore kiln without mining coal.'),
        recipe('makeFilter', 'Respirator filter', 'bench', { coal: 2, cloth: 2, resin: 1 }, { filter: 1 }, 'Reduces radiation buildup for two minutes.'),
        recipe('trailPack', 'Trail pack', 'bench', { cloth: 4, cord: 2, planks: 2 }, {}, '34 kg across 17 unique stacks.', 1),
        recipe('rucksack', 'Expedition rucksack', 'bench', { cloth: 6, cord: 3, ingot: 2 }, {}, '51 kg across 23 unique stacks.', 2),
        recipe('hauler', 'Hauler frame', 'bench', { planks: 6, ingot: 4, wire: 3, relic: 1 }, {}, '76 kg across 32 unique stacks.', 3)
    ];
    const buildings = [
        { id: 'chest', name: 'Storage chest', size: [1.16, 0.67, 0.74], cost: { planks: 3, cord: 1 }, color: 0x996a43, detail: 'Store 18 distinct stacks, up to 54 kg.' },
        { id: 'wallTorch', name: 'Standing torch', size: [0.29, 1.42, 0.27], cost: { torch: 1, timber: 1 }, color: 0xae7547, detail: 'Light your base and mark the way home.' },
        { id: 'kiln', name: 'Stone kiln', size: [1.24, 1.12, 1.2], cost: { stone: 6, clay: 3 }, color: 0x86786c, detail: 'Smelt ore and fire clay into building materials.' },
        { id: 'stoneWall', name: 'Masonry wall', size: [2.8, 2.6, 0.36], cost: { brick: 4, stone: 2 }, color: 0x918d82, detail: 'Heavy cover with much greater durability than timber.' },
        { id: 'stoneFloor', name: 'Stone foundation', size: [2.8, 0.24, 2.8], cost: { stone: 4, brick: 2 }, color: 0x8e9489, detail: 'A strong platform for a mountain shelter.' }
    ];
    BO.SurvivalFrontierData = { items, packs, tools, resources, recipes, buildings };
    BO.SurvivalCampaignData.build.push(...buildings);
})(window.BO);
