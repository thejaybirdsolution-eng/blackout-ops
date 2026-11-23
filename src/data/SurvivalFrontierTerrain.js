
(function (BO) {
    'use strict';

    const map = BO.SurvivalData.map;
    const box = (x, y, z, w, h, d, mat) => map.boxes.push({ x, y, z, w, h, d, mat });
    // A walkable switchback reaches the ridge and the existing trench connects to a roofed cavern.
    box(-49.5, 2.8, 38, 10.2, 5.6, 9.6, 'bunker_stone');
    box(-51.5, 3.6, 32.8, 6.4, 7.2, 2.6, 'bunker_stone');
    box(-48, 0.95, 30.4, 8.8, 1.9, 3.2, 'bunker_stone');
    box(-52.5, 5.98, 40.5, 3.7, 0.75, 3, 'bunker_stone');
    box(-44, 0.75, 41.4, 3.2, 1.5, 3.4, 'bunker_stone');
    map.ramps.push({ axis: 'x', z: 37.6, x1: -33, x2: -44.4, y1: 0, y2: 5.6, w: 3.6, mat: 'bunker_stone' });
    map.ramps.push({ axis: 'z', x: -49, z1: 36, z2: 33.8, y1: 5.6, y2: 7.2, w: 2.2, mat: 'bunker_stone' });

    box(-7.9, -1.57, -48, 6.5, 0.54, 10, 'bunker_stone');
    box(-10.6, -3.72, -48, 0.8, 2.56, 9.6, 'bunker_stone');
    box(-6.05, -3.86, -44, 0.83, 2.28, 2.9, 'bunker_stone');
    box(-7.68, -3.75, -52.9, 4.8, 2.5, 0.6, 'bunker_stone');
    box(-4.7, -4.58, -50.2, 1.15, 0.84, 1.45, 'bunker_stone');
    box(-8.9, -4.64, -46.4, 1.45, 0.72, 1.2, 'bunker_stone');
    // Secondary surface rock piles supply cover and landmark silhouettes.
    box(46, 0.90, 14, 4.2, 1.8, 2.9, 'bunker_stone');
    box(-47, 0.55, -13, 3.2, 1.1, 4.4, 'bunker_stone');
    box(17, 0.42, -18, 2.8, 0.84, 1.8, 'bunker_stone');

    const campaign = BO.SurvivalCampaignData;
    campaign.areas.push(
        { id: 'ridge', name: 'Slateback Ridge', x: -47.9, y: 5.6, z: 36.1, color: 0xa9aca7, level: 1 },
        { id: 'cavern', name: 'Echo Cavern', x: -8.3, y: -5, z: -48, color: 0x9184bd, level: 1 }
    );
    const additions = [
        ['groveKeeper','Grove Keeper Fen','pine',-39,0,19,'Gather branches, loose stones and fiber by hand. Use an axe for whole trees.',[],{cord:1},['Timber tally','harvest_pine',2,105]],
        ['mason','Mason Holt','ridge',-47,5.6,38.6,'Build a stone kiln for iron bars and masonry. Bring the finished stock to your own shelter.', ['salvage'],{clay:2},['Set in stone','crafted_fireBricks',1,155]],
        ['vale','Cartographer Linn','ridge',-49.2,5.6,40.7,'A trail climbs here from the lowlands. The research trench below the railway leads into Echo Cavern.', [],{caveMap:1},['Echo survey','visitedCavern',1,145]],
        ['spark','Lamplighter Sparks','freight',21,0,5,'Braided cord and resin make hand torches. Use a quartz lantern for longer cave runs.', ['fuel'],{torch:1},['Bright metal','crafted_makeLantern',1,200]],
        ['ore','Miner Oda','trench',-4.1,-5,-46,'Start with coal and iron. Copper and quartz need iron tools. Save your drill for the deepest geode.', ['aid'],null,['Vein survey','oreHarvests',4,180]],
        ['echo','Echo Archivist','cavern',-8.5,-5,-51.3,'The resonant core is locked in the deepest geode. Bring it to a workbench for the hauler frame.', [],null,['The deep seam','harvest_deep',1,260]]
    ].map(([id, name, area, x, y, z, hint, shop, gift, quest]) => ({ id, name, area, x, y, z, hint, shop, gift, quest }));
    campaign.contacts.push(...additions);

    const deposits = [];
    const put = (kind, x, y, z) => deposits.push({ kind, x, y, z });
    const patches = {
        kindling: [[-3,0,30],[9,0,30],[-13,0,20],[-41,0,30],[44,0,13]],
        stones: [[4,0,28],[-6,0,31],[8,0,17],[-36,0,33],[38,0,10]],
        roots: [[5,0,32],[-8,0,27],[12,0,26],[-35,0,26],[35,0,9],[-42,0,10]],
        herbs: [[-15,0,14],[-34,0,13],[-40,0,7],[36,0,11],[48,0,-2]],
        pine: [[-17,0,23],[-37,0,20],[-44,0,24],[-39,0,11],[-38,0,-5],[43,0,7],[45,0,38]],
        hardwood: [[-45.7,5.6,41],[-52.5,5.6,36.5],[-45,0,-46],[44,0,34]],
        boulder: [[14,0,24],[-36,0,30],[-49,5.6,37.2],[-44,0,-41],[41,0,13],[38,0,-14]],
        iron: [[-34,0,40],[-46.5,5.6,36],[25,0,7],[-7.1,-5,-49],[40,0,33],[-49.3,7.2,32.9],[39,0,-33],[12,0,-31]],
        coal: [[-38,0,40],[-52,5.6,39],[-27,0,-19],[-6.3,-5,-46],[47,0,25]],
        copper: [[-47.8,5.6,41],[-10, -5,-45.3],[46,0,-27],[47,0,30]],
        quartz: [[-52,7.2,32.7],[-7.8,-5,-50.8],[-42,0,-47],[45,0,36]],
        clay: [[15,0,16],[43,0,1],[-18,0,6],[38,0,-21]],
        buried: [[-30,0,31],[-46,5.6,39],[28,0,-11],[-40,0,-43]],
        deep: [[-9.1,-5,-49.6]]
    };
    for (const [kind, points] of Object.entries(patches)) for (const point of points) put(kind, ...point);
    BO.SurvivalFrontierData.deposits = deposits;
})(window.BO);
