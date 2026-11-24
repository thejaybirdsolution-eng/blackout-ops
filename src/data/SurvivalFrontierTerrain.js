
(function (BO) {
    'use strict';

    const map = BO.SurvivalData.map;
    const box = (x, y, z, w, h, d, mat) => map.boxes.push({ x, y, z, w, h, d, mat });

    // Slateback Ridge (14m plateau with 20m summit crag and wide drivable switchback ramp)
    box(-195, 7, 150, 44, 14, 36, 'bunker_stone');
    box(-208, 17, 162, 16, 6, 16, 'bunker_stone');
    box(-172, 2.5, 134, 14, 5, 10, 'bunker_stone');
    box(-218, 14.7, 168, 4.5, 1.4, 4.5, 'bunker_stone');
    map.ramps.push({ axis: 'x', z: 142, x1: -140, x2: -173, y1: 0, y2: 14, w: 5.0, mat: 'bunker_stone' });
    map.ramps.push({ axis: 'z', x: -206, z1: 145, z2: 154, y1: 14, y2: 20, w: 3.6, mat: 'bunker_stone' });

    // Echo Cavern (-8m underground west wing connected to Research Trench)
    box(-51, -8.6, -210, 44, 1.2, 32, 'soviet_concrete');
    box(-51, -2.0, -210, 44, 1.4, 32, 'bunker_stone');
    box(-72, -5, -210, 1.5, 6, 32, 'bunker_stone');
    box(-51, -5, -225, 42, 6, 1.5, 'bunker_stone');
    box(-51, -5, -195, 42, 6, 1.5, 'bunker_stone');
    box(-44, -6.5, -203, 2.2, 3.0, 2.4, 'bunker_stone');
    box(-58, -6.4, -217, 2.6, 3.2, 2.2, 'bunker_stone');

    // Vista ridges & canyon landmarks
    box(204, 2.4, 34, 10, 4.8, 7, 'bunker_stone');
    box(-188, 1.8, -58, 9, 3.6, 12, 'bunker_stone');
    box(66, 1.5, -72, 8, 3.0, 6, 'bunker_stone');

    const campaign = BO.SurvivalCampaignData;
    campaign.areas.push(
        { id: 'ridge', name: 'Slateback Ridge', x: -195, y: 14, z: 150, color: 0xa9aca7, level: 1, tier: 2 },
        { id: 'cavern', name: 'Echo Cavern', x: -52, y: -8, z: -210, color: 0x9184bd, level: 1, tier: 3 }
    );

    const additions = [
        ['groveKeeper','Grove Keeper Fen','pine',-142,0,66,'Gather fallen branches, loose stones, and fiber by hand. Craft axes for pine and hardwood.',[],{cord:1},['Timber tally','harvest_pine',2,105]],
        ['mason','Mason Holt','ridge',-188,14,154,'Smelt iron and fire masonry bricks in a stone kiln for Tier 2 fortifications.', ['salvage'],{clay:2},['Set in stone','crafted_fireBricks',1,155]],
        ['vale','Cartographer Linn','ridge',-204,14,148,'From Slateback Ridge you can glide across the whole valley or take the zipline down. Echo Cavern lies west off the Trench.', [],{caveMap:1},['Echo survey','visitedCavern',1,145]],
        ['spark','Lamplighter Sparks','freight',112,0,18,'Light a quartz lantern before venturing deep into Echo Cavern or permanent blackout nights.', ['fuel'],{torch:1},['Bright metal','crafted_makeLantern',1,200]],
        ['ore','Miner Oda','trench',-18,-8,-182,'Iron and coal are plentiful, while copper and quartz demand iron tools. Save a mining drill for Echo Cavern.', ['aid'],null,['Vein survey','oreHarvests',4,180]],
        ['echo','Echo Archivist','cavern',-54,-8,-216,'The Resonant Core sleeps inside the deep geode—defeat the Resonant Sentinel to claim it.', [],null,['The deep seam','harvest_deep',1,260]]
    ].map(([id, name, area, x, y, z, hint, shop, gift, quest]) => ({ id, name, area, x, y, z, hint, shop, gift, quest }));
    campaign.contacts.push(...additions);

    const deposits = [];
    const put = (kind, x, y, z) => deposits.push({ kind, x, y, z });
    const patches = {
        kindling: [[-10,0,115],[14,0,118],[-44,0,86],[-148,0,98],[144,0,46],[106,0,34],[-130,0,28]],
        stones: [[12,0,104],[-18,0,112],[28,0,76],[-132,0,95],[138,0,36],[-72,0,44]],
        roots: [[16,0,118],[-24,0,102],[34,0,94],[-135,0,78],[130,0,24],[-162,0,38],[162,0,118]],
        herbs: [[-56,0,58],[-128,0,48],[-158,0,24],[136,0,38],[192,0,-12],[168,0,124],[-88,0,82]],
        pine: [[-64,0,82],[-134,0,66],[-168,0,78],[-152,0,36],[-148,0,-22],[146,0,18],[156,0,130],[-112,0,112]],
        hardwood: [[-182,14,160],[-202,14,142],[-172,0,-188],[192,0,96],[86,11,-176],[-195,0,-168]],
        boulder: [[42,0,92],[-128,0,114],[-192,14,158],[-176,0,-154],[152,0,48],[142,0,-58],[178,0,136]],
        iron: [[-116,0,126],[-185,14,140],[118,0,28],[-18,-8,-202],[178,0,88],[-206,20,160],[162,0,-118],[58,0,-118],[98,11,-192],[188,0,142]],
        coal: [[-132,0,124],[-210,14,156],[-112,0,-72],[-14,-8,-188],[204,0,76],[104,11,-174],[-178,0,-196]],
        copper: [[-194,14,162],[-26,-8,-192],[196,0,-102],[204,0,64],[164,0,164],[88,11,-194],[-186,0,-148]],
        quartz: [[-212,20,158],[-42,-8,-214],[-176,0,-198],[192,0,104],[-58,-8,-204],[-214,0,-164],[214,0,48]],
        clay: [[58,0,68],[172,0,-18],[-78,0,18],[168,0,-92],[196,0,-68]],
        buried: [[-105,0,106],[-188,14,160],[134,0,-38],[-162,0,-168],[196,0,162],[92,11,-188],[212,0,84]],
        deep: [[-62,-8,-212]]
    };
    for (const [kind, points] of Object.entries(patches)) for (const point of points) put(kind, ...point);
    BO.SurvivalFrontierData.deposits = deposits;
})(window.BO);
