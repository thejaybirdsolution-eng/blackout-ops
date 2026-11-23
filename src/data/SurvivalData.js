
/* Exclusion Zone terrain, points of interest and workshop inventory. */
(function (BO) {
    'use strict';

    const boxes = [];
    const box = (x, y, z, w, h, d, mat = 'soviet_concrete') => boxes.push({ x, y, z, w, h, d, mat });
    // A gap in the surface deck exposes the lower research trench.
    box(0, -0.6, 7.5, 112, 1.2, 73, 'swamp_mud');
    box(-34, -0.6, -32.5, 44, 1.2, 7, 'asphalt');
    box(34, -0.6, -32.5, 44, 1.2, 7, 'asphalt');
    box(-34, -0.6, -46, 44, 1.2, 20, 'asphalt');
    box(34, -0.6, -46, 44, 1.2, 20, 'asphalt');
    box(0, -5.6, -42.5, 24, 1.2, 27, 'soviet_concrete');
    box(0, -0.16, -36.5, 24, 0.32, 1.6, 'diamond_plate');
    box(0, -2.5, -56, 25, 5, 1);
    box(-12, -2.5, -42.5, 1, 5, 27);
    box(12, -2.5, -42.5, 1, 5, 27);
    box(0, 1, 44, 112, 2, 1);
    box(0, 1, -56, 112, 2, 1);
    for (const x of [-56, 56]) box(x, 1, -6, 1, 2, 100);
    for (const z of [3, 14, 25]) box(0, 0.012, z, 8, 0.025, 10.8, 'asphalt');

    function depot(x, z, mat, roof) {
        box(x, 1.65, z - 5, 13, 3.3, 0.5, mat);
        box(x - 6.5, 1.65, z, 0.5, 3.3, 10, mat);
        box(x + 6.5, 1.65, z, 0.5, 3.3, 10, mat);
        for (const side of [-1, 1]) box(x + side * 4.6, 1.65, z + 5, 3.8, 3.3, 0.5, mat);
        if (roof) box(x, 3.45, z, 13.5, 0.3, 10.5, 'diamond_plate');
        for (const side of [-1, 1]) box(x + side * 3.8, 0.55, z - 2.9, 2, 1.1, 1.0, 'wood_crate');
    }
    depot(-24, 9, 'concrete', true);
    depot(26, -5, 'soviet_concrete', true);
    depot(-26, -29, 'diamond_plate', false);
    box(20, 2, -28, 4, 4, 3, 'diamond_plate');
    box(26, 2, -28, 4, 4, 3, 'diamond_plate');
    box(32, 2, -28, 4, 4, 3, 'diamond_plate');
    for (const [x, z, w, d] of [
        [-8, 18, 2, 5], [9, 15, 2, 4], [-10, -13, 4, 1.5], [14, 0, 1.5, 3],
        [-40, -15, 3, 2], [31, 14, 5, 1], [41, -22, 1.5, 5], [-26, -37, 4, 1.5]
    ]) box(x, 0.48, z, w, 0.96, d, 'bunker_stone');

    const sites = [
        { id: 'shelter', name: 'Relay shelter', x: 0, y: 0, z: 33, label: 'Use workbench and rest', color: 0x78c8c1 },
        { id: 'hospital', name: 'Field hospital', x: -24, y: 0, z: 7, label: 'Salvage MRI coil and medical supplies', color: 0xdce6d4 },
        { id: 'dam', name: 'Dam control', x: 29, y: 0, z: -23, label: 'Open spillway', color: 0x79cfff },
        { id: 'depot', name: 'Freight siding', x: 26, y: 0, z: -4, label: 'Search the freight cache', color: 0xe6a66c },
        { id: 'train', name: 'Locomotive', x: 19, y: 0, z: -12, label: 'Restore and board the locomotive', color: 0xffc46e },
        { id: 'bunker', name: 'Infected research trench', x: 0, y: -5, z: -52, label: 'Recover the Aether core', color: 0xcdabed },
        { id: 'lookout', name: 'Evac ridge', x: -26, y: 0, z: -27, label: 'Call extraction', color: 0x78c8c1 },
        { id: 'squadmate', name: 'Rescue beacon', x: -39, y: 0, z: 4, label: 'Rescue Scout Vale', color: 0xa5d08c }
    ];
    const stashes = [
        [-11, 0, 17], [-36, 0, 15], [-14, 0, -13], [8, 0, -20], [35, 0, 11],
        [42, 0, -8], [-33, 0, -38], [15, 0, 20], [9, -5, -47], [-9, -5, -45]
    ];
    const structures = [
        { x: -24, y: 1.7, z: 10, w: 6.6, h: 3.4, d: 0.4, material: 'brick', rows: 3, cols: 6 },
        { x: 26, y: 1.7, z: -1.6, w: 6.2, h: 3.4, d: 0.4, material: 'wood', rows: 3, cols: 6 },
        { x: -26, y: 1.3, z: -23.6, w: 6.4, h: 2.6, d: 0.45, material: 'wood', rows: 2, cols: 5 },
        { x: 0, y: -3.75, z: -47, w: 5.3, h: 2.5, d: 0.35, material: 'brick', rows: 2, cols: 5 }
    ];
    const waypoints = [
        [0, 0, 31], [-18, 0, 17], [-30, 0, 17], [-42, 0, -3], [-27, 0, -20],
        [-23, 0, -24], [-15, 0, -35], [0, 0, -20], [0, 0, -33],
        [0, -4.95, -46], [0, -5, -52], [13, 0, -26], [25, 0, -20],
        [17, 0, 6], [30, 0, 6], [41, 0, -12], [41, 0, 12], [8, 0, 21]
    ].map(([x, y, z], i, list) => ({
        id: 'sv' + i, x, y, z,
        links: list.flatMap(([u, v, w], j) => j !== i && Math.hypot(x - u, y - v, z - w) < 24 ? ['sv' + j] : [])
    }));
    const map = {
        id: 'exclusion_zone', name: 'Exclusion Zone', mode: 'survival',
        playerSpawn: { x: 1, y: 0, z: 26, yaw: 0 },
        boxes, waypoints,
        ramps: [{ axis: 'z', x: 0, z1: -29, z2: -45, y1: 0, y2: -5, w: 7, mat: 'diamond_plate' }],
        atmosphere: {
            skyTop: 0x536779, skyBottom: 0x919885, fogColor: 0x8e978b, fogDensity: 0.012,
            hemiSky: 0xb1c2da, hemiGround: 0x536042, hemiIntensity: 1.12,
            sunColor: 0xffe2b6, sunIntensity: 1.35, sunPos: [-22, 34, 15]
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
    BO.SurvivalData = { map, sites, stashes, structures, recipes };
})(window.BO);
