
/* Exclusion Zone 20x Terrain (500m x 450m = 225,000 m²), Landmarks, Transit & Workshop Inventory. */
(function (BO) {
    'use strict';

    const boxes = [];
    const box = (x, y, z, w, h, d, mat = 'soviet_concrete') => boxes.push({ x, y, z, w, h, d, mat });

    // Surface deck (X: -250..250, Z: -240..210) with cutout for Research Trench (X: -30..30, Z: -240..-160) & entry ramp (X: -8..8, Z: -160..-120)
    box(0, -0.6, 45, 500, 1.2, 330, 'swamp_mud');
    box(-140, -0.6, -180, 220, 1.2, 120, 'asphalt');
    box(140, -0.6, -180, 220, 1.2, 120, 'asphalt');
    box(-19, -0.6, -140, 22, 1.2, 40, 'asphalt');
    box(19, -0.6, -140, 22, 1.2, 40, 'asphalt');

    // Subterranean Research Trench (60m x 85m at y = -8m)
    box(0, -8.6, -197.5, 60, 1.2, 85, 'soviet_concrete');
    box(0, -0.2, -159.5, 60, 0.35, 2.2, 'diamond_plate');
    box(0, -4, -240, 62, 8, 1.5);
    box(30, -4, -200, 1.5, 8, 80);
    box(-30, -4, -232.5, 1.5, 8, 15);
    box(-30, -4, -177.5, 1.5, 8, 35);
    box(-19, -4, -160, 22, 8, 1.5);
    box(19, -4, -160, 22, 8, 1.5);
    box(-8, -4, -140, 1, 8, 40);
    box(8, -4, -140, 1, 8, 40);

    // Valley perimeter walls (500m x 450m)
    box(0, 3, 210, 502, 6, 2, 'bunker_stone');
    box(0, 3, -240, 502, 6, 2, 'bunker_stone');
    box(-250, 3, -15, 2, 6, 452, 'bunker_stone');
    box(250, 3, -15, 2, 6, 452, 'bunker_stone');

    // Paved Highway Network & Derelict Airfield Runway
    box(0, 0.02, 15, 12, 0.04, 270, 'asphalt');
    box(12.5, 0.02, 26, 355, 0.04, 12, 'asphalt');
    box(182.5, 0.03, 176, 105, 0.06, 16, 'asphalt');

    function depot(x, z, mat, roof) {
        box(x, 1.75, z - 6, 15, 3.5, 0.6, mat);
        box(x - 7.5, 1.75, z, 0.6, 3.5, 12, mat);
        box(x + 7.5, 1.75, z, 0.6, 3.5, 12, mat);
        for (const side of [-1, 1]) box(x + side * 5.2, 1.75, z + 6, 4.6, 3.5, 0.6, mat);
        if (roof) box(x, 3.65, z, 15.6, 0.35, 12.6, 'diamond_plate');
        for (const side of [-1, 1]) box(x + side * 4.4, 0.6, z - 3.6, 2.2, 1.2, 1.1, 'wood_crate');
    }

    // Major Valley Facilities
    depot(-95, 38, 'concrete', true);          // Field Hospital
    depot(120, 5, 'soviet_concrete', true);    // Freight Siding Depot
    depot(-120, -125, 'diamond_plate', false); // Evac Ridge Bunker
    depot(175, 146, 'soviet_concrete', true);  // Derelict Airfield Hangar

    // Airfield 11m ATC Tower
    box(218, 5.5, 152, 9, 11, 9, 'concrete');
    box(218, 11.3, 152, 12, 0.6, 12, 'diamond_plate');

    // Radar Ridge 11m Plateau & Comms Pedestal
    box(95, 5.5, -185, 36, 11, 30, 'bunker_stone');
    box(102, 12.8, -191, 4, 3.6, 4, 'diamond_plate');

    // Spillway Dam Control Wall & Freight Warehouses
    box(126, 4, -85, 4, 8, 22, 'concrete');
    box(102, 2.2, -32, 6, 4.4, 4, 'diamond_plate');
    box(114, 2.2, -32, 6, 4.4, 4, 'diamond_plate');
    box(126, 2.2, -32, 6, 4.4, 4, 'diamond_plate');

    // Tactical cover rocks & ruins across all three risk rings
    for (const [x, z, w, d] of [
        [-24, 72, 3, 7], [28, 64, 3, 6], [-45, -42, 6, 2.2], [58, 12, 2.4, 5],
        [-148, -38, 5, 3], [148, 42, 7, 2], [176, -98, 2.5, 8], [-112, -165, 6, 2.5],
        [-170, 92, 4.5, 3], [65, -95, 5, 2.5], [142, 130, 5, 2.5], [-68, -90, 4, 4]
    ]) box(x, 0.55, z, w, 1.1, d, 'bunker_stone');

    const sites = [
        { id: 'shelter', name: 'Relay shelter', x: 0, y: 0, z: 130, label: 'Use workbench and rest', color: 0x78c8c1 },
        { id: 'hospital', name: 'Field hospital', x: -95, y: 0, z: 36, label: 'Salvage MRI coil and medical supplies', color: 0xdce6d4 },
        { id: 'dam', name: 'Dam control', x: 132, y: 0, z: -85, label: 'Open spillway', color: 0x79cfff },
        { id: 'depot', name: 'Freight siding', x: 120, y: 0, z: 5, label: 'Search the freight cache', color: 0xe6a66c },
        { id: 'train', name: 'Locomotive', x: 95, y: 0, z: -45, label: 'Restore and board the locomotive', color: 0xffc46e },
        { id: 'bunker', name: 'Infected research trench', x: 0, y: -8, z: -222, label: 'Recover the Aether core', color: 0xcdabed },
        { id: 'lookout', name: 'Evac ridge', x: -120, y: 0, z: -123, label: 'Call extraction', color: 0x78c8c1 },
        { id: 'squadmate', name: 'Rescue beacon', x: -162, y: 0, z: 22, label: 'Rescue Scout Vale', color: 0xa5d08c }
    ];

    const stashes = [
        [-42, 0, 74], [-145, 0, 62], [-58, 0, -52], [44, 0, -78], [145, 0, 44],
        [182, 0, -34], [-148, 0, -162], [68, 0, 82], [22, -8, -205], [-22, -8, -192],
        [175, 0, 146], [92, 11, -182], [-192, 14, 152], [198, 0, 88]
    ];

    const structures = [
        { x: -95, y: 1.8, z: 44, w: 7.4, h: 3.6, d: 0.45, material: 'brick', rows: 3, cols: 6 },
        { x: 120, y: 1.8, z: 11, w: 7.4, h: 3.6, d: 0.45, material: 'wood', rows: 3, cols: 6 },
        { x: -120, y: 1.5, z: -119, w: 7.2, h: 3.0, d: 0.45, material: 'wood', rows: 2, cols: 5 },
        { x: 0, y: -6.5, z: -206, w: 9.0, h: 3.0, d: 0.40, material: 'brick', rows: 2, cols: 6 },
        { x: 175, y: 1.8, z: 152, w: 7.4, h: 3.6, d: 0.45, material: 'brick', rows: 3, cols: 6 }
    ];

    const waypointGrid = [
        // Inner Ring (Relay, Pine, Freight)
        [0, 0, 120], [0, 0, 85], [0, 0, 42], [0, 0, 0], [0, 0, -58], [0, 0, -110],
        [-48, 0, 108], [-92, 0, 86], [-95, 0, 48], [-138, 0, 68], [-162, 0, 35], [-165, 0, -12],
        [52, 0, 110], [88, 0, 72], [116, 0, 26], [118, 0, -15], [80, 0, -45], [52, 0, -90],
        // Tier 2 Mid-Zone (Basin, Ridge, Airfield, Radar)
        [152, 0, -45], [185, 0, -85], [195, 0, -135], [155, 0, -145],
        [-115, 0, -52], [-120, 0, -112], [-95, 0, -135], [-60, 0, -122], [-35, 0, -135],
        [115, 0, 118], [158, 0, 138], [182, 0, 168], [218, 0, 168], [220, 0, 132],
        [-135, 0, 142], [-185, 14, 148], [-202, 14, 152],
        [82, 0, -142], [92, 11, -182], [108, 11, -182],
        // Tier 3 Outer Frontier & Underground (Frost, Cinder, Trench, Cavern)
        [-125, 0, -175], [-168, 0, -175], [-210, 0, -195], [-192, 0, -152],
        [135, 0, 75], [175, 0, 75], [215, 0, 52], [208, 0, 102],
        [0, -7.9, -172], [0, -8, -196], [0, -8, -220], [-24, -8, -208], [-48, -8, -210]
    ];
    const waypoints = waypointGrid.map(([x, y, z], i, list) => ({
        id: 'sv' + i, x, y, z,
        links: list.flatMap(([u, v, w], j) => j !== i && Math.hypot(x - u, y - v, z - w) < 78 ? ['sv' + j] : [])
    }));

    const worldBounds = { x0: -250, x1: 250, z0: -240, z1: 210, width: 500, depth: 450 };
    const trainRoute = [[95, -45], [185, -45], [185, -155], [-140, -155], [-140, 135], [95, 135]];
    const ziplines = [
        { from: [18, 16, 138], to: [-140, 0, 58], label: 'Relay Tower ↔ Pinebreak Woods' },
        { from: [-176, 14, 148], to: [-14, 0, 118], label: 'Slateback Ridge ↔ Relay Lowlands' },
        { from: [96, 11, -172], to: [116, 0, 12], label: 'Radar Ridge ↔ Freight Works' },
        { from: [215, 11.6, 148], to: [140, 0, 82], label: 'Airfield ATC ↔ Cinder Flats Gate' },
        { from: [-111, 0, -124], to: [-12, 0, -124], label: 'Evac Ridge ↔ Research Trench' },
        { from: [122, 0, -6], to: [134, 0, -82], label: 'Freight Works ↔ Spillway Dam' }
    ];
    const delugeBounds = { x0: 120, x1: 240, z0: -140, z1: -20 };

    function areaAt(x, y, z) {
        const areas = BO.SurvivalCampaignData.areas;
        if (y < -2.2) {
            return areas.find((zone) => zone.id === (x < -29 && z < -190 && z > -230 ? 'cavern' : 'trench'));
        }
        if (y > 8 && x < -160 && z > 120) {
            const ridge = areas.find((zone) => zone.id === 'ridge');
            if (ridge) return ridge;
        }
        if (y > 7 && x > 65 && x < 125 && z < -160) {
            const radar = areas.find((zone) => zone.id === 'radar');
            if (radar) return radar;
        }
        const bounded = areas.find((zone) => zone.bounds &&
            x >= zone.bounds[0] && x <= zone.bounds[1] && z >= zone.bounds[2] && z <= zone.bounds[3]);
        if (bounded) return bounded;
        return areas.filter((zone) => !zone.bounds && zone.y >= 0 && zone.id !== 'ridge' && zone.id !== 'radar')
            .reduce((best, zone) => Math.hypot(x - zone.x, z - zone.z) < Math.hypot(x - best.x, z - best.z) ? zone : best);
    }

    const map = {
        id: 'exclusion_zone', name: 'Exclusion Zone', mode: 'survival',
        playerSpawn: { x: 2, y: 0, z: 108, yaw: 0 },
        boxes, waypoints,
        ramps: [
            { axis: 'z', x: 0, z1: -120, z2: -165, y1: 0, y2: -8, w: 12, mat: 'diamond_plate' },
            { axis: 'x', z: 152, x1: 196, x2: 213.5, y1: 0, y2: 11.0, w: 3.4, mat: 'diamond_plate' },
            { axis: 'z', x: 82, z1: -146, z2: -170, y1: 0, y2: 11.0, w: 4.5, mat: 'bunker_stone' }
        ],
        atmosphere: {
            skyTop: 0x536779, skyBottom: 0x919885, fogColor: 0x8e978b, fogDensity: 0.0038,
            hemiSky: 0xb1c2da, hemiGround: 0x536042, hemiIntensity: 1.12,
            sunColor: 0xffe2b6, sunIntensity: 1.38, sunPos: [-85, 130, 60]
        }
    };

    const recipes = [
        { id: 'ammo', name: 'Field cartridges', cost: { scrap: 2 }, detail: 'Refill half a reserve of ammunition for both weapons.' },
        { id: 'medkit', name: 'Trauma kit', cost: { scrap: 1, cloth: 2 }, detail: 'Add a medkit to your pack.' },
        { id: 'cook', name: 'Hot meal and coffee', cost: { rations: 1 }, detail: 'Restore composure and improve reload speed for two minutes.' },
        { id: 'incendiary', name: 'Ember loads', cost: { scrap: 2, fuel: 1 }, detail: 'The next 12 firearm shots ignite fuel and timber on impact.' },
        { id: 'coilgun', name: 'Coil prototype', cost: { coil: 1, scrap: 5, fuel: 1 }, detail: 'Equip an experimental secondary with a high-damage shot and cooldown.' }
    ];

    BO.MapsData.MAPS[map.id] = map;
    BO.SurvivalWorld = { bounds: worldBounds, trainRoute, ziplines, delugeBounds, areaAt };
    BO.SurvivalData = { map, sites, stashes, structures, recipes };
})(window.BO);
