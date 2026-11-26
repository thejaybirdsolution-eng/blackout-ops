/* ============================================================================
   BLACKOUT OPS — Complete 4-Map Architectural Definitions
   2 COD Zombies Maps: Der Bunker, Station Omega
   2 Multiplayer Maps: Killhouse, Crash Site
   All boxes use center (x, y, z) and full dimensions (w, h, d).
   Floor top is at y = 0 unless elevated deck.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    // Helper for clean box authoring using min/max corners -> center & size
    function boxMM(x1, y1, z1, x2, y2, z2, mat, opts) {
        const x = (x1 + x2) * 0.5;
        const y = (y1 + y2) * 0.5;
        const z = (z1 + z2) * 0.5;
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);
        const d = Math.abs(z2 - z1);
        return Object.assign({ x, y, z, w, h, d, mat }, opts || {});
    }

    // Helper to create a wall with a door opening centered at doorCoord
    function wallWithOpeningX(z, yBottom, yTop, xStart, xEnd, openX1, openX2, openYTop, thickness, mat) {
        const hz = thickness * 0.5;
        const out = [];
        if (openX1 > xStart) out.push(boxMM(xStart, yBottom, z - hz, openX1, yTop, z + hz, mat));
        if (xEnd > openX2) out.push(boxMM(openX2, yBottom, z - hz, xEnd, yTop, z + hz, mat));
        if (yTop > openYTop) out.push(boxMM(openX1, openYTop, z - hz, openX2, yTop, z + hz, mat));
        return out;
    }

    function wallWithOpeningZ(x, yBottom, yTop, zStart, zEnd, openZ1, openZ2, openYTop, thickness, mat) {
        const hx = thickness * 0.5;
        const out = [];
        if (openZ1 > zStart) out.push(boxMM(x - hx, yBottom, zStart, x + hx, yTop, openZ1, mat));
        if (zEnd > openZ2) out.push(boxMM(x - hx, yBottom, openZ2, x + hx, yTop, zEnd, mat));
        if (yTop > openYTop) out.push(boxMM(x - hx, openYTop, openZ1, x + hx, yTop, openZ2, mat));
        return out;
    }

    // Build perimeter wall with a Zombie window gap at any floor elevation yBase
    function wallWithWindowXAt(z, yBase, x1, x2, winX1, winX2, wallH, thickness, mat) {
        const hz = thickness * 0.5;
        const list = [];
        const yTop = yBase + wallH;
        if (winX1 > x1) list.push(boxMM(x1, yBase, z - hz, winX1, yTop, z + hz, mat));
        if (x2 > winX2) list.push(boxMM(winX2, yBase, z - hz, x2, yTop, z + hz, mat));
        list.push(boxMM(winX1, yBase, z - hz, winX2, yBase + 1.05, z + hz, mat));      // sill
        if (yTop > yBase + 2.65) list.push(boxMM(winX1, yBase + 2.65, z - hz, winX2, yTop, z + hz, mat)); // lintel
        return list;
    }

    function wallWithWindowZAt(x, yBase, z1, z2, winZ1, winZ2, wallH, thickness, mat) {
        const hx = thickness * 0.5;
        const list = [];
        const yTop = yBase + wallH;
        if (winZ1 > z1) list.push(boxMM(x - hx, yBase, z1, x + hx, yTop, winZ1, mat));
        if (z2 > winZ2) list.push(boxMM(x - hx, yBase, winZ2, x + hx, yTop, z2, mat));
        list.push(boxMM(x - hx, yBase, winZ1, x + hx, yBase + 1.05, winZ2, mat));      // sill
        if (yTop > yBase + 2.65) list.push(boxMM(x - hx, yBase + 2.65, winZ1, x + hx, yTop, winZ2, mat)); // lintel
        return list;
    }

    function wallWithWindowX(z, x1, x2, winX1, winX2, wallH, thickness, mat) {
        return wallWithWindowXAt(z, 0, x1, x2, winX1, winX2, wallH, thickness, mat);
    }

    function wallWithWindowZ(x, z1, z2, winZ1, winZ2, wallH, thickness, mat) {
        return wallWithWindowZAt(x, 0, z1, z2, winZ1, winZ2, wallH, thickness, mat);
    }

    /* ========================================================================
       1. DER BUNKER (Zombies — Blood-Moon Ruined Concrete Bunker & Courtyard)
       Zones:
         'spawn'     : Guardhouse Spawn Room  (x: -10..10, z: 6..20)
         'courtyard' : Mud Trench & Courtyard (x: -18..18, z: -12..6)   [Door 750]
         'generator' : West Power Station     (x: -26..-10, z: -14..8)  [Door 1000]
         'lab'       : East Bio-Lab & Catwalk (x: 10..26, z: -14..8)    [Door 1250]
         'vault'     : North PaP Vault        (x: -12..12, z: -28..-12) [Door 1500 + Power]
    ======================================================================== */
    const derBunkerBoxes = [
        // Main ground floor slabs (top at y=0)
        boxMM(-30, -0.6, -32, 30, 0, 24, 'concrete'),
        // Outer perimeter boundary walls around playable exterior zombie alleys
        boxMM(-30, 0, 23.2, 30, 6.0, 24, 'bunker_stone'),
        boxMM(-30, 0, -32, 30, 6.0, -31.2, 'bunker_stone'),
        boxMM(-30, 0, -32, -29.2, 6.0, 24, 'bunker_stone'),
        boxMM(29.2, 0, -32, 30, 6.0, 24, 'bunker_stone'),

        // --- SPAWN GUARDHOUSE (x: -10..10, z: 6..20) ---
        // South wall w/ 2 zombie windows at x=-5..-2.6 and x=2.6..5
        ...wallWithWindowX(20, -10, 0, -5.2, -2.8, 4.4, 0.7, 'bunker_stone'),
        ...wallWithWindowX(20, 0, 10, 2.8, 5.2, 4.4, 0.7, 'bunker_stone'),
        // West wall of Spawn w/ side window or solid
        boxMM(-10.35, 0, 6, -9.65, 4.4, 20, 'bunker_stone'),
        // East wall of Spawn
        boxMM(9.65, 0, 6, 10.35, 4.4, 20, 'bunker_stone'),
        // North wall of Spawn at z=6 with Door 1 opening (-2.2..2.2)
        ...wallWithOpeningX(6, 0, 4.4, -10, 10, -2.2, 2.2, 3.1, 0.7, 'bunker_stone'),
        // Guardhouse ceiling & structural roof beams
        boxMM(-10.4, 4.4, 6.0, 10.4, 4.85, 20.4, 'ceiling_plaster'),
        // Guardhouse cover props
        boxMM(-7.2, 0, 11.2, -5.2, 1.15, 12.8, 'wood_crate'),
        boxMM(5.0, 0, 13.5, 7.2, 1.25, 15.0, 'rusted_metal'),
        boxMM(-1.2, 0, 15.2, 1.2, 1.05, 16.4, 'sandbag'),

        // --- COURTYARD (x: -10..10, z: -12..6) ---
        // Courtyard low cover walls, sandbags, crashed military jeep, watch platform
        boxMM(-5.5, 0, -2.8, -2.5, 1.15, -1.6, 'sandbag'),
        boxMM(2.6, 0, -3.8, 5.6, 1.15, -2.6, 'sandbag'),
        // Raised central bunker pillbox deck (y=1.35) with ramp from South
        boxMM(-3.0, 0, -7.8, 3.0, 1.35, -4.4, 'concrete'),
        // Pillbox waist-high parapet
        boxMM(-3.0, 1.35, -7.8, -1.2, 2.35, -7.4, 'bunker_stone'),
        boxMM(1.2, 1.35, -7.8, 3.0, 2.35, -7.4, 'bunker_stone'),
        // Crashed truck/jeep prop in courtyard
        boxMM(4.5, 0, 0.8, 8.2, 1.35, 3.0, 'rusted_metal'),
        boxMM(5.0, 1.35, 1.0, 6.8, 2.05, 2.8, 'rusted_metal'),

        // --- WEST GENERATOR ROOM (x: -25..-10, z: -12..10) ---
        // Partition wall at x=-10 with Door 2 opening z=-2.2..2.2
        ...wallWithOpeningZ(-10, 0, 4.6, -12, 10, -2.2, 2.2, 3.1, 0.7, 'bunker_stone'),
        // West wall of Generator w/ 2 zombie windows at z=-7..-4.6 and z=4.6..7
        ...wallWithWindowZ(-25, -12, 0, -7.2, -4.8, 4.6, 0.7, 'bunker_stone'),
        ...wallWithWindowZ(-25, 0, 10, 4.8, 7.2, 4.6, 0.7, 'bunker_stone'),
        boxMM(-25.35, 0, 9.65, -10, 4.6, 10.35, 'bunker_stone'),
        boxMM(-25.35, 0, -12.35, -10, 4.6, -11.65, 'bunker_stone'),
        boxMM(-25.4, 4.6, -12.4, -9.6, 5.05, 10.4, 'concrete'),
        // Heavy turbine generators inside
        boxMM(-20.5, 0, -3.5, -16.2, 2.1, 1.8, 'diamond_plate'),
        boxMM(-18.8, 0, 5.2, -16.8, 1.6, 7.2, 'rusted_metal'),

        // --- EAST BIO-LAB (x: 10..25, z: -12..10) ---
        // Partition wall at x=10 with Door 3 opening z=-2.2..2.2
        ...wallWithOpeningZ(10, 0, 4.6, -12, 10, -2.2, 2.2, 3.1, 0.7, 'bunker_stone'),
        // East wall of Lab w/ 2 zombie windows
        ...wallWithWindowZ(25, -12, 0, -7.2, -4.8, 4.6, 0.7, 'bunker_stone'),
        ...wallWithWindowZ(25, 0, 10, 4.8, 7.2, 4.6, 0.7, 'bunker_stone'),
        boxMM(10, 0, 9.65, 25.35, 4.6, 10.35, 'bunker_stone'),
        boxMM(10, 0, -12.35, 25.35, 4.6, -11.65, 'bunker_stone'),
        boxMM(9.6, 4.6, -12.4, 25.4, 5.05, 10.4, 'concrete'),
        // Lab equipment tables & containment pods
        boxMM(15.5, 0, -5.8, 19.2, 1.15, -4.2, 'lab_panel'),
        boxMM(15.5, 0, 3.2, 19.2, 1.15, 4.8, 'lab_panel'),
        boxMM(21.0, 0, -1.6, 22.8, 2.9, 0.2, 'diamond_plate'),

        // --- NORTH PACK-A-PUNCH VAULT (x: -10..10, z: -27..-12) ---
        // Wall at z=-12 separating Courtyard & Vault with Door 4 at x=-2.4..2.4
        ...wallWithOpeningX(-12, 0, 5.2, -10.35, 10.35, -2.4, 2.4, 3.3, 0.7, 'bunker_stone'),
        boxMM(-10.35, 0, -27.35, -9.65, 5.2, -12, 'bunker_stone'),
        boxMM(9.65, 0, -27.35, 10.35, 5.2, -12, 'bunker_stone'),
        boxMM(-10.35, 0, -27.35, 10.35, 5.2, -26.65, 'bunker_stone'),
        boxMM(-10.4, 5.2, -27.4, 10.4, 5.65, -11.6, 'concrete'),
        // Raised PaP altar dais (top y=0.75)
        boxMM(-3.8, 0, -25.4, 3.8, 0.75, -21.2, 'diamond_plate'),
        boxMM(-7.5, 0, -18.5, -5.8, 1.3, -16.8, 'wood_crate'),
        boxMM(5.8, 0, -18.5, 7.5, 1.3, -16.8, 'wood_crate')
    ];

    const DER_BUNKER = {
        id: 'der_bunker',
        name: 'DER BUNKER',
        mode: 'zombies',
        subtitle: 'Sector 04 Ruined Outpost • Blood Moon Night',
        description: 'Fortified Cold-War concrete bunker overrun by the undead. Open sectors, restore Generator Power, and forge Pack-a-Punch weapons in the North Vault.',
        atmosphere: {
            skyTop: 0x09040a,
            skyBottom: 0x290c14,
            fogColor: 0x16090e,
            fogDensity: 0.020,
            sunColor: 0xff6b5a,
            sunIntensity: 0.85,
            sunPos: [25, 38, -22],
            hemiSky: 0x4b2a3b,
            hemiGround: 0x141010,
            hemiIntensity: 0.55,
            moon: true
        },
        playerSpawn: { x: 0, y: 0, z: 12.5, yaw: 0 },
        ramps: [
            // Ramp up onto central courtyard pillbox from South (z=-1.6 -> -4.4)
            { x: 0, w: 2.6, z1: -1.8, z2: -4.4, y1: 0, y2: 1.35, axis: 'z', mat: 'concrete' },
            // Ramp up onto Pack-a-Punch dais from South (z=-19.8 -> -21.2)
            { x: 0, w: 3.4, z1: -19.6, z2: -21.2, y1: 0, y2: 0.75, axis: 'z', mat: 'diamond_plate' }
        ],
        boxes: derBunkerBoxes,
        lights: [
            { x: 0, y: 4.1, z: 12.5, color: 0xffb36b, intensity: 1.7, distance: 16, zone: 'spawn', alwaysOn: true },
            { x: -7.5, y: 1.4, z: 16.5, color: 0xff6b2b, intensity: 1.3, distance: 11, prop: 'fire_barrel', alwaysOn: true },
            { x: 0, y: 4.5, z: -2.0, color: 0xff9d5c, intensity: 1.5, distance: 20, zone: 'courtyard', alwaysOn: true },
            { x: -17.5, y: 4.2, z: -1.0, color: 0x38bdf8, intensity: 1.6, distance: 18, zone: 'generator', alwaysOn: false },
            { x: 17.5, y: 4.2, z: -1.0, color: 0x22c55e, intensity: 1.6, distance: 18, zone: 'lab', alwaysOn: false },
            { x: 0, y: 4.6, z: -21.5, color: 0xc084fc, intensity: 2.2, distance: 18, zone: 'vault', alwaysOn: false }
        ],
        zones: ['spawn', 'courtyard', 'generator', 'lab', 'vault'],
        doors: [
            { id: 'door_courtyard', fromZone: 'spawn', toZone: 'courtyard', cost: 750, requiresPower: false, x: 0, y: 1.55, z: 6.0, w: 4.3, h: 3.05, d: 0.55, label: 'COURTYARD GATE' },
            { id: 'door_generator', fromZone: 'courtyard', toZone: 'generator', cost: 1000, requiresPower: false, x: -10.0, y: 1.55, z: 0.0, w: 0.55, h: 3.05, d: 4.3, label: 'GENERATOR BUNKER' },
            { id: 'door_lab', fromZone: 'courtyard', toZone: 'lab', cost: 1250, requiresPower: false, x: 10.0, y: 1.55, z: 0.0, w: 0.55, h: 3.05, d: 4.3, label: 'BIO-LAB WING' },
            { id: 'door_vault', fromZone: 'courtyard', toZone: 'vault', cost: 1500, requiresPower: true, x: 0, y: 1.65, z: -12.0, w: 4.7, h: 3.25, d: 0.65, label: 'PACK-A-PUNCH VAULT' }
        ],
        windows: [
            { id: 'win_spawn_w', zone: 'spawn', x: -4.0, y: 0, z: 20.0, w: 2.3, axis: 'z', outside: [-4.0, 0, 22.0], inside: [-4.0, 0, 17.8], waypointId: 'wp_spawn_sw' },
            { id: 'win_spawn_e', zone: 'spawn', x: 4.0, y: 0, z: 20.0, w: 2.3, axis: 'z', outside: [4.0, 0, 22.0], inside: [4.0, 0, 17.8], waypointId: 'wp_spawn_se' },
            { id: 'win_gen_n', zone: 'generator', x: -25.0, y: 0, z: -6.0, w: 2.3, axis: 'x', outside: [-27.2, 0, -6.0], inside: [-22.6, 0, -6.0], waypointId: 'wp_gen_w' },
            { id: 'win_gen_s', zone: 'generator', x: -25.0, y: 0, z: 6.0, w: 2.3, axis: 'x', outside: [-27.2, 0, 6.0], inside: [-22.6, 0, 6.0], waypointId: 'wp_gen_sw' },
            { id: 'win_lab_n', zone: 'lab', x: 25.0, y: 0, z: -6.0, w: 2.3, axis: 'x', outside: [27.2, 0, -6.0], inside: [22.6, 0, -6.0], waypointId: 'wp_lab_e' },
            { id: 'win_lab_s', zone: 'lab', x: 25.0, y: 0, z: 6.0, w: 2.3, axis: 'x', outside: [27.2, 0, 6.0], inside: [22.6, 0, 6.0], waypointId: 'wp_lab_se' }
        ],
        groundSpawners: [
            { zone: 'spawn', x: -7.8, y: 0, z: 18.2, waypointId: 'wp_spawn_sw' },
            { zone: 'spawn', x: 7.8, y: 0, z: 18.2, waypointId: 'wp_spawn_se' },
            { zone: 'courtyard', x: -7.5, y: 0, z: -9.5, waypointId: 'wp_court_nw' },
            { zone: 'courtyard', x: 7.5, y: 0, z: -9.5, waypointId: 'wp_court_ne' },
            { zone: 'courtyard', x: -8.0, y: 0, z: 3.2, waypointId: 'wp_court_w' },
            { zone: 'courtyard', x: -7.8, y: 0, z: -5.5, waypointId: 'wp_court_w' },
            { zone: 'courtyard', x: 8.0, y: 0, z: -5.5, waypointId: 'wp_court_e' },
            { zone: 'courtyard', x: 0.0, y: 0, z: -10.2, waypointId: 'wp_court_n' },
            { zone: 'generator', x: -22.8, y: 0, z: -9.5, waypointId: 'wp_gen_w' },
            { zone: 'generator', x: -22.8, y: 0, z: 8.2, waypointId: 'wp_gen_sw' },
            { zone: 'generator', x: -13.5, y: 0, z: -8.5, waypointId: 'wp_gen_n' },
            { zone: 'generator', x: -13.5, y: 0, z: 7.5, waypointId: 'wp_gen_s' },
            { zone: 'lab', x: 22.8, y: 0, z: -9.5, waypointId: 'wp_lab_e' },
            { zone: 'lab', x: 22.8, y: 0, z: 8.2, waypointId: 'wp_lab_se' },
            { zone: 'lab', x: 13.5, y: 0, z: -8.5, waypointId: 'wp_lab_n' },
            { zone: 'lab', x: 13.5, y: 0, z: 7.5, waypointId: 'wp_lab_s' },
            { zone: 'vault', x: -7.5, y: 0, z: -24.5, waypointId: 'wp_vault_w' },
            { zone: 'vault', x: 7.5, y: 0, z: -24.5, waypointId: 'wp_vault_e' },
            { zone: 'vault', x: -7.5, y: 0, z: -14.5, waypointId: 'wp_vault_s' },
            { zone: 'vault', x: 7.5, y: 0, z: -14.5, waypointId: 'wp_vault_s' },
            { zone: 'vault', x: 0.0, y: 0, z: -16.5, waypointId: 'wp_vault_s' }
        ],
        perks: [
            { id: 'quick_revive', name: 'Quick Revive', cost: 500, x: -8.8, y: 0, z: 16.0, rotY: Math.PI * 0.5, color: '#38bdf8', desc: 'Solo Self-Revive + Faster Regen', requiresPower: false },
            { id: 'juggernog', name: 'Juggernog', cost: 2500, x: -12.0, y: 0, z: -9.8, rotY: 0, color: '#ef4444', desc: 'Max HP boosted to 250', requiresPower: true },
            { id: 'speed_cola', name: 'Speed Cola', cost: 3000, x: 12.2, y: 0, z: -9.8, rotY: 0, color: '#22c55e', desc: '2x Reload & Barrier Repair Speed', requiresPower: true },
            { id: 'double_tap', name: 'Double Tap 2.0', cost: 2000, x: -22.2, y: 0, z: 0.0, rotY: Math.PI * 0.5, color: '#f59e0b', desc: 'Double Bullet Output & +25% Fire Rate', requiresPower: true },
            { id: 'stamin_up', name: 'Stamin-Up', cost: 2000, x: 0.0, y: 0, z: -10.4, rotY: 0, color: '#eab308', desc: '+18% Sprint Speed & Unlimited Stamina', requiresPower: true },
            { id: 'deadshot', name: 'Deadshot Daiquiri', cost: 1500, x: 22.0, y: 0, z: 7.8, rotY: Math.PI, color: '#a855f7', desc: '+45% Headshot Damage & Tighter Hipfire', requiresPower: true }
        ],
        wallBuys: [
            { weaponId: 'r870', cost: 750, ammoCost: 375, x: 8.95, y: 1.55, z: 12.0, rotY: -Math.PI * 0.5 },
            { weaponId: 'mp5', cost: 1000, ammoCost: 500, x: -8.95, y: 1.55, z: 9.0, rotY: Math.PI * 0.5 },
            { weaponId: 'm4a1', cost: 1400, ammoCost: 700, x: -12.5, y: 1.55, z: 8.95, rotY: Math.PI },
            { weaponId: 'ak47', cost: 1600, ammoCost: 800, x: 12.5, y: 1.55, z: 8.95, rotY: Math.PI },
            { weaponId: 'intervention', cost: 2200, ammoCost: 1100, x: 23.95, y: 1.55, z: 0.0, rotY: -Math.PI * 0.5 },
            { weaponId: 'm249', cost: 2800, ammoCost: 1400, x: -8.95, y: 1.55, z: -15.5, rotY: Math.PI * 0.5 }
        ],
        armorWall: { x: 8.95, y: 1.55, z: -15.5, rotY: -Math.PI * 0.5, cost: 1500 },
        mysteryBoxPads: [
            { id: 'box_court', x: -7.6, y: 0, z: 2.8, rotY: Math.PI * 0.5, zone: 'courtyard' },
            { id: 'box_gen', x: -14.0, y: 0, z: -8.8, rotY: 0, zone: 'generator' },
            { id: 'box_lab', x: 14.0, y: 0, z: -8.8, rotY: 0, zone: 'lab' }
        ],
        powerSwitch: { x: -24.1, y: 1.4, z: 0.0, rotY: Math.PI * 0.5 },
        packAPunch: { x: 0.0, y: 0.75, z: -24.0, rotY: 0 },
        exfilPoint: { x: 0.0, y: 0, z: -5.5 },
        waypoints: [
            { id: 'wp_spawn_sw', x: -4.0, y: 0, z: 17.5, zone: 'spawn', links: ['wp_spawn_c', 'wp_spawn_w'] },
            { id: 'wp_spawn_se', x: 4.0, y: 0, z: 17.5, zone: 'spawn', links: ['wp_spawn_c', 'wp_spawn_e'] },
            { id: 'wp_spawn_w', x: -4.0, y: 0, z: 11.0, zone: 'spawn', links: ['wp_spawn_sw', 'wp_spawn_c', 'wp_spawn_door'] },
            { id: 'wp_spawn_e', x: 4.0, y: 0, z: 11.0, zone: 'spawn', links: ['wp_spawn_se', 'wp_spawn_c', 'wp_spawn_door'] },
            { id: 'wp_spawn_c', x: 0.0, y: 0, z: 12.5, zone: 'spawn', links: ['wp_spawn_sw', 'wp_spawn_se', 'wp_spawn_w', 'wp_spawn_e', 'wp_spawn_door'] },
            { id: 'wp_spawn_door', x: 0.0, y: 0, z: 7.5, zone: 'spawn', links: ['wp_spawn_c', 'wp_spawn_w', 'wp_spawn_e', 'wp_court_s'] },

            { id: 'wp_court_s', x: 0.0, y: 0, z: 4.0, zone: 'courtyard', links: ['wp_spawn_door', 'wp_court_c', 'wp_court_w', 'wp_court_e'] },
            { id: 'wp_court_c', x: 0.0, y: 0, z: 0.0, zone: 'courtyard', links: ['wp_court_s', 'wp_court_w', 'wp_court_e', 'wp_court_pillbox', 'wp_court_nw', 'wp_court_ne'] },
            { id: 'wp_court_w', x: -7.5, y: 0, z: 0.0, zone: 'courtyard', links: ['wp_court_s', 'wp_court_c', 'wp_court_nw', 'wp_gen_door'] },
            { id: 'wp_court_e', x: 7.5, y: 0, z: 0.0, zone: 'courtyard', links: ['wp_court_s', 'wp_court_c', 'wp_court_ne', 'wp_lab_door'] },
            { id: 'wp_court_pillbox', x: 0.0, y: 1.35, z: -5.5, zone: 'courtyard', links: ['wp_court_c'] },
            { id: 'wp_court_nw', x: -6.5, y: 0, z: -9.0, zone: 'courtyard', links: ['wp_court_w', 'wp_court_c', 'wp_court_n'] },
            { id: 'wp_court_ne', x: 6.5, y: 0, z: -9.0, zone: 'courtyard', links: ['wp_court_e', 'wp_court_c', 'wp_court_n'] },
            { id: 'wp_court_n', x: 0.0, y: 0, z: -10.2, zone: 'courtyard', links: ['wp_court_nw', 'wp_court_ne', 'wp_vault_s'] },

            { id: 'wp_gen_door', x: -12.0, y: 0, z: 0.0, zone: 'generator', links: ['wp_court_w', 'wp_gen_n', 'wp_gen_s', 'wp_gen_w', 'wp_gen_sw'] },
            { id: 'wp_gen_w', x: -22.5, y: 0, z: -6.0, zone: 'generator', links: ['wp_gen_door', 'wp_gen_n', 'wp_gen_sw'] },
            { id: 'wp_gen_sw', x: -22.5, y: 0, z: 6.0, zone: 'generator', links: ['wp_gen_door', 'wp_gen_s', 'wp_gen_w'] },
            { id: 'wp_gen_n', x: -14.5, y: 0, z: -7.5, zone: 'generator', links: ['wp_gen_door', 'wp_gen_w'] },
            { id: 'wp_gen_s', x: -14.5, y: 0, z: 6.5, zone: 'generator', links: ['wp_gen_door', 'wp_gen_sw'] },

            { id: 'wp_lab_door', x: 12.0, y: 0, z: 0.0, zone: 'lab', links: ['wp_court_e', 'wp_lab_n', 'wp_lab_s', 'wp_lab_e', 'wp_lab_se'] },
            { id: 'wp_lab_e', x: 22.5, y: 0, z: -6.0, zone: 'lab', links: ['wp_lab_door', 'wp_lab_n', 'wp_lab_se'] },
            { id: 'wp_lab_se', x: 22.5, y: 0, z: 6.0, zone: 'lab', links: ['wp_lab_door', 'wp_lab_s', 'wp_lab_e'] },
            { id: 'wp_lab_n', x: 14.5, y: 0, z: -7.5, zone: 'lab', links: ['wp_lab_door', 'wp_lab_e'] },
            { id: 'wp_lab_s', x: 14.5, y: 0, z: 6.5, zone: 'lab', links: ['wp_lab_door', 'wp_lab_se'] },

            { id: 'wp_vault_s', x: 0.0, y: 0, z: -14.5, zone: 'vault', links: ['wp_court_n', 'wp_vault_w', 'wp_vault_e', 'wp_vault_pap'] },
            { id: 'wp_vault_w', x: -6.0, y: 0, z: -22.0, zone: 'vault', links: ['wp_vault_s', 'wp_vault_pap'] },
            { id: 'wp_vault_e', x: 6.0, y: 0, z: -22.0, zone: 'vault', links: ['wp_vault_s', 'wp_vault_pap'] },
            { id: 'wp_vault_pap', x: 0.0, y: 0.75, z: -22.2, zone: 'vault', links: ['wp_vault_s', 'wp_vault_w', 'wp_vault_e'] }
        ]
    };

    /* ========================================================================
       2. STATION OMEGA (Zombies — Neon Subterranean Missile & Cryo Facility)
       Zones:
         'spawn'   : Entry Airlock       (x: -10..10, z: 10..22)
         'silo'    : Central Missile Bay (x: -14..14, z: -10..10) [Door 750]
         'cryo'    : West Cryo Lab       (x: -26..-14, z: -10..10) [Door 1000]
         'reactor' : East Reactor Core   (x: 14..26, z: -10..10)  [Door 1250]
         'control' : North Control Deck  (x: -12..12, z: -26..-10) [Door 1500 + Power]
    ======================================================================== */
    const stationOmegaBoxes = [
        boxMM(-30, -0.6, -32, 30, 0, 26, 'diamond_plate'),
        // Perimeter
        boxMM(-30, 0, 25.2, 30, 6.2, 26, 'lab_panel'),
        boxMM(-30, 0, -32, 30, 6.2, -31.2, 'lab_panel'),
        boxMM(-30, 0, -32, -29.2, 6.2, 26, 'lab_panel'),
        boxMM(29.2, 0, -32, 30, 6.2, 26, 'lab_panel'),

        // --- ENTRY AIRLOCK (x: -10..10, z: 10..22) ---
        ...wallWithWindowX(22, -10, 0, -5.2, -2.8, 4.4, 0.7, 'lab_panel'),
        ...wallWithWindowX(22, 0, 10, 2.8, 5.2, 4.4, 0.7, 'lab_panel'),
        boxMM(-10.35, 0, 10, -9.65, 4.4, 22, 'lab_panel'),
        boxMM(9.65, 0, 10, 10.35, 4.4, 22, 'lab_panel'),
        ...wallWithOpeningX(10, 0, 4.4, -10, 10, -2.2, 2.2, 3.1, 0.7, 'lab_panel'),
        boxMM(-10.4, 4.4, 10, 10.4, 4.85, 22.4, 'concrete'),
        boxMM(-7.0, 0, 14.5, -4.8, 1.1, 16.2, 'diamond_plate'),
        boxMM(4.8, 0, 14.5, 7.0, 1.1, 16.2, 'diamond_plate'),

        // --- CENTRAL MISSILE SILO (x: -14..14, z: -10..10) ---
        // Seal South corners between Airlock (x: -10..10) and Silo side wings (x: -14..14)
        boxMM(-14.35, 0, 9.65, -9.65, 4.8, 10.35, 'lab_panel'),
        boxMM(9.65, 0, 9.65, 14.35, 4.8, 10.35, 'lab_panel'),
        // Vaulted Silo ceiling framing around central ICBM shaft skylight (-3.5..3.5)
        boxMM(-14.4, 6.2, 3.5, 14.4, 6.6, 10.4, 'ceiling_plaster'),
        boxMM(-14.4, 6.2, -10.4, 14.4, 6.6, -3.5, 'ceiling_plaster'),
        boxMM(-14.4, 6.2, -3.5, -3.5, 6.6, 3.5, 'ceiling_plaster'),
        boxMM(3.5, 6.2, -3.5, 14.4, 6.6, 3.5, 'ceiling_plaster'),
        // Center ICBM Missile Core Pillar (x:-2..2, z:-2..2)
        boxMM(-2.1, 0, -2.1, 2.1, 6.2, 2.1, 'rusted_metal'),
        boxMM(-2.6, 0, -2.6, 2.6, 0.7, 2.6, 'diamond_plate'),
        // Tactical cover blocks around Silo
        boxMM(-8.2, 0, 3.5, -5.8, 1.25, 5.0, 'lab_panel'),
        boxMM(5.8, 0, 3.5, 8.2, 1.25, 5.0, 'lab_panel'),
        boxMM(-8.2, 0, -5.2, -5.8, 1.25, -3.7, 'lab_panel'),
        boxMM(5.8, 0, -5.2, 8.2, 1.25, -3.7, 'lab_panel'),
        // Partition walls to Cryo (x=-14) & Reactor (x=14)
        ...wallWithOpeningZ(-14, 0, 4.8, -10, 10, -2.2, 2.2, 3.1, 0.7, 'lab_panel'),
        ...wallWithOpeningZ(14, 0, 4.8, -10, 10, -2.2, 2.2, 3.1, 0.7, 'lab_panel'),

        // --- WEST CRYO LAB (x: -26..-14, z: -10..10) ---
        ...wallWithWindowZ(-26, -10, 0, -6.2, -3.8, 4.8, 0.7, 'lab_panel'),
        ...wallWithWindowZ(-26, 0, 10, 3.8, 6.2, 4.8, 0.7, 'lab_panel'),
        boxMM(-26.35, 0, 9.65, -14, 4.8, 10.35, 'lab_panel'),
        boxMM(-26.35, 0, -10.35, -14, 4.8, -9.65, 'lab_panel'),
        boxMM(-26.4, 4.8, -10.4, -13.6, 5.2, 10.4, 'concrete'),
        boxMM(-21.2, 0, -2.2, -18.8, 2.8, 2.2, 'lab_panel'),

        // --- EAST REACTOR CORE (x: 14..26, z: -10..10) ---
        ...wallWithWindowZ(26, -10, 0, -6.2, -3.8, 4.8, 0.7, 'lab_panel'),
        ...wallWithWindowZ(26, 0, 10, 3.8, 6.2, 4.8, 0.7, 'lab_panel'),
        boxMM(14, 0, 9.65, 26.35, 4.8, 10.35, 'lab_panel'),
        boxMM(14, 0, -10.35, 26.35, 4.8, -9.65, 'lab_panel'),
        boxMM(13.6, 4.8, -10.4, 26.4, 5.2, 10.4, 'concrete'),
        boxMM(18.8, 0, -2.2, 21.2, 3.2, 2.2, 'diamond_plate'),

        // --- NORTH CONTROL DECK (x: -12..12, z: -26..-10) ---
        ...wallWithOpeningX(-10, 0, 5.0, -14.35, 14.35, -2.4, 2.4, 3.3, 0.7, 'lab_panel'),
        boxMM(-12.35, 0, -26.35, -11.65, 5.0, -10, 'lab_panel'),
        boxMM(11.65, 0, -26.35, 12.35, 5.0, -10, 'lab_panel'),
        boxMM(-12.35, 0, -26.35, 12.35, 5.0, -25.65, 'lab_panel'),
        boxMM(-12.4, 5.0, -26.4, 12.4, 5.45, -9.6, 'concrete'),
        boxMM(-4.2, 0, -24.5, 4.2, 0.85, -20.0, 'lab_panel')
    ];

    const STATION_OMEGA = {
        id: 'station_omega',
        name: 'STATION OMEGA',
        mode: 'zombies',
        subtitle: 'Subterranean Missile Silo • Cryo Telemetry Complex',
        description: 'Classified ICBM silo beneath the permafrost. Loop the central missile shaft, link Power from the Reactor Core, and teleport across sectors.',
        atmosphere: {
            skyTop: 0x030b14,
            skyBottom: 0x0b2239,
            fogColor: 0x061423,
            fogDensity: 0.017,
            sunColor: 0x67e8f9,
            sunIntensity: 0.90,
            sunPos: [-20, 40, -15],
            hemiSky: 0x38bdf8,
            hemiGround: 0x0f172a,
            hemiIntensity: 0.65,
            moon: false
        },
        playerSpawn: { x: 0, y: 0, z: 16.0, yaw: 0 },
        ramps: [
            { x: 0, w: 3.6, z1: -18.2, z2: -20.0, y1: 0, y2: 0.85, axis: 'z', mat: 'diamond_plate' }
        ],
        boxes: stationOmegaBoxes,
        lights: [
            { x: 0, y: 4.1, z: 16.0, color: 0x7dd3fc, intensity: 1.7, distance: 16, zone: 'spawn', alwaysOn: true },
            { x: -6.5, y: 4.5, z: 0.0, color: 0xf59e0b, intensity: 1.6, distance: 18, zone: 'silo', alwaysOn: true },
            { x: 6.5, y: 4.5, z: 0.0, color: 0x38bdf8, intensity: 1.6, distance: 18, zone: 'silo', alwaysOn: true },
            { x: -20.0, y: 4.3, z: 0.0, color: 0x67e8f9, intensity: 1.9, distance: 18, zone: 'cryo', alwaysOn: false },
            { x: 20.0, y: 4.3, z: 0.0, color: 0xf43f5e, intensity: 1.9, distance: 18, zone: 'reactor', alwaysOn: false },
            { x: 0, y: 4.7, z: -20.0, color: 0xa855f7, intensity: 2.3, distance: 18, zone: 'control', alwaysOn: false }
        ],
        zones: ['spawn', 'silo', 'cryo', 'reactor', 'control'],
        doors: [
            { id: 'door_silo', fromZone: 'spawn', toZone: 'silo', cost: 750, requiresPower: false, x: 0, y: 1.55, z: 10.0, w: 4.3, h: 3.05, d: 0.55, label: 'MISSILE SILO AIRLOCK' },
            { id: 'door_cryo', fromZone: 'silo', toZone: 'cryo', cost: 1000, requiresPower: false, x: -14.0, y: 1.55, z: 0.0, w: 0.55, h: 3.05, d: 4.3, label: 'CRYO LABORATORY' },
            { id: 'door_reactor', fromZone: 'silo', toZone: 'reactor', cost: 1250, requiresPower: false, x: 14.0, y: 1.55, z: 0.0, w: 0.55, h: 3.05, d: 4.3, label: 'REACTOR CORE' },
            { id: 'door_control', fromZone: 'silo', toZone: 'control', cost: 1500, requiresPower: true, x: 0, y: 1.65, z: -10.0, w: 4.7, h: 3.25, d: 0.65, label: 'CONTROL DECK' }
        ],
        windows: [
            { id: 'w_air_w', zone: 'spawn', x: -4.0, y: 0, z: 22.0, w: 2.3, axis: 'z', outside: [-4.0, 0, 24.0], inside: [-4.0, 0, 19.6], waypointId: 'wp_o_air_w' },
            { id: 'w_air_e', zone: 'spawn', x: 4.0, y: 0, z: 22.0, w: 2.3, axis: 'z', outside: [4.0, 0, 24.0], inside: [4.0, 0, 19.6], waypointId: 'wp_o_air_e' },
            { id: 'w_cryo_n', zone: 'cryo', x: -26.0, y: 0, z: -5.0, w: 2.3, axis: 'x', outside: [-28.0, 0, -5.0], inside: [-23.4, 0, -5.0], waypointId: 'wp_o_cryo_nw' },
            { id: 'w_cryo_s', zone: 'cryo', x: -26.0, y: 0, z: 5.0, w: 2.3, axis: 'x', outside: [-28.0, 0, 5.0], inside: [-23.4, 0, 5.0], waypointId: 'wp_o_cryo_sw' },
            { id: 'w_reac_n', zone: 'reactor', x: 26.0, y: 0, z: -5.0, w: 2.3, axis: 'x', outside: [28.0, 0, -5.0], inside: [23.4, 0, -5.0], waypointId: 'wp_o_reac_ne' },
            { id: 'w_reac_s', zone: 'reactor', x: 26.0, y: 0, z: 5.0, w: 2.3, axis: 'x', outside: [28.0, 0, 5.0], inside: [23.4, 0, 5.0], waypointId: 'wp_o_reac_se' }
        ],
        groundSpawners: [
            { zone: 'spawn', x: -7.8, y: 0, z: 20.2, waypointId: 'wp_o_air_w' },
            { zone: 'spawn', x: 7.8, y: 0, z: 20.2, waypointId: 'wp_o_air_e' },
            { zone: 'silo', x: -11.5, y: 0, z: -8.0, waypointId: 'wp_o_silo_nw' },
            { zone: 'silo', x: 11.5, y: 0, z: -8.0, waypointId: 'wp_o_silo_ne' },
            { zone: 'silo', x: -11.5, y: 0, z: 7.5, waypointId: 'wp_o_silo_sw' },
            { zone: 'silo', x: 11.5, y: 0, z: 7.5, waypointId: 'wp_o_silo_se' },
            { zone: 'silo', x: -11.8, y: 0, z: 0.0, waypointId: 'wp_o_silo_w' },
            { zone: 'silo', x: 11.8, y: 0, z: 0.0, waypointId: 'wp_o_silo_e' },
            { zone: 'cryo', x: -23.5, y: 0, z: -8.0, waypointId: 'wp_o_cryo_nw' },
            { zone: 'cryo', x: -23.5, y: 0, z: 8.0, waypointId: 'wp_o_cryo_sw' },
            { zone: 'cryo', x: -16.5, y: 0, z: -6.5, waypointId: 'wp_o_cryo_n' },
            { zone: 'cryo', x: -16.5, y: 0, z: 6.5, waypointId: 'wp_o_cryo_s' },
            { zone: 'reactor', x: 23.5, y: 0, z: -8.0, waypointId: 'wp_o_reac_ne' },
            { zone: 'reactor', x: 23.5, y: 0, z: 8.0, waypointId: 'wp_o_reac_se' },
            { zone: 'reactor', x: 16.5, y: 0, z: -6.5, waypointId: 'wp_o_reac_n' },
            { zone: 'reactor', x: 16.5, y: 0, z: 6.5, waypointId: 'wp_o_reac_s' },
            { zone: 'control', x: -9.5, y: 0, z: -23.0, waypointId: 'wp_o_ctrl_w' },
            { zone: 'control', x: 9.5, y: 0, z: -23.0, waypointId: 'wp_o_ctrl_e' },
            { zone: 'control', x: -9.0, y: 0, z: -13.5, waypointId: 'wp_o_ctrl_s' },
            { zone: 'control', x: 9.0, y: 0, z: -13.5, waypointId: 'wp_o_ctrl_s' },
            { zone: 'control', x: 0.0, y: 0, z: -14.5, waypointId: 'wp_o_ctrl_s' }
        ],
        perks: [
            { id: 'quick_revive', name: 'Quick Revive', cost: 500, x: -8.8, y: 0, z: 18.0, rotY: Math.PI * 0.5, color: '#38bdf8', desc: 'Solo Self-Revive + Faster Regen', requiresPower: false },
            { id: 'juggernog', name: 'Juggernog', cost: 2500, x: -16.0, y: 0, z: -8.6, rotY: 0, color: '#ef4444', desc: 'Max HP boosted to 250', requiresPower: true },
            { id: 'speed_cola', name: 'Speed Cola', cost: 3000, x: 16.0, y: 0, z: -8.6, rotY: 0, color: '#22c55e', desc: '2x Reload & Barrier Repair Speed', requiresPower: true },
            { id: 'double_tap', name: 'Double Tap 2.0', cost: 2000, x: 16.0, y: 0, z: 8.6, rotY: Math.PI, color: '#f59e0b', desc: 'Double Bullet Output & +25% Fire Rate', requiresPower: true },
            { id: 'stamin_up', name: 'Stamin-Up', cost: 2000, x: -16.0, y: 0, z: 8.6, rotY: Math.PI, color: '#eab308', desc: '+18% Sprint Speed & Unlimited Stamina', requiresPower: true },
            { id: 'deadshot', name: 'Deadshot Daiquiri', cost: 1500, x: 10.6, y: 0, z: -15.0, rotY: -Math.PI * 0.5, color: '#a855f7', desc: '+45% Headshot Damage & Tighter Hipfire', requiresPower: true }
        ],
        wallBuys: [
            { weaponId: 'r870', cost: 750, ammoCost: 375, x: 9.0, y: 1.55, z: 15.0, rotY: -Math.PI * 0.5 },
            { weaponId: 'p90', cost: 1100, ammoCost: 550, x: -12.9, y: 1.55, z: 6.5, rotY: Math.PI * 0.5 },
            { weaponId: 'scarh', cost: 1550, ammoCost: 775, x: 12.9, y: 1.55, z: 6.5, rotY: -Math.PI * 0.5 },
            { weaponId: 'aa12', cost: 2400, ammoCost: 1200, x: -19.5, y: 1.55, z: -9.55, rotY: 0 },
            { weaponId: 'mk14', cost: 1900, ammoCost: 950, x: -10.9, y: 1.55, z: -15.0, rotY: Math.PI * 0.5 },
            { weaponId: 'rpd', cost: 2900, ammoCost: 1450, x: 7.5, y: 1.55, z: -24.9, rotY: 0 }
        ],
        armorWall: { x: -7.5, y: 1.55, z: -24.9, rotY: 0, cost: 1500 },
        mysteryBoxPads: [
            { id: 'obox_silo', x: 0.0, y: 0, z: 6.5, rotY: 0, zone: 'silo' },
            { id: 'obox_cryo', x: -23.6, y: 0, z: 0.0, rotY: Math.PI * 0.5, zone: 'cryo' },
            { id: 'obox_reac', x: 16.5, y: 0, z: 0.0, rotY: Math.PI * 0.5, zone: 'reactor' }
        ],
        powerSwitch: { x: 24.9, y: 1.4, z: 0.0, rotY: -Math.PI * 0.5 },
        packAPunch: { x: 0.0, y: 0.85, z: -23.0, rotY: 0 },
        teleporter: {
            padA: { x: 0.0, y: 0, z: 19.2, label: 'AIRLOCK TELEPORTER', destX: 0.0, destZ: -16.5, zoneRequired: 'control' },
            padB: { x: 0.0, y: 0, z: -16.5, label: 'RETURN TELEPORTER', destX: 0.0, destZ: 18.8, zoneRequired: 'spawn' },
            cost: 500
        },
        exfilPoint: { x: 0.0, y: 0, z: -6.5 },
        waypoints: [
            { id: 'wp_o_air_w', x: -4.0, y: 0, z: 19.5, zone: 'spawn', links: ['wp_o_air_c'] },
            { id: 'wp_o_air_e', x: 4.0, y: 0, z: 19.5, zone: 'spawn', links: ['wp_o_air_c'] },
            { id: 'wp_o_air_c', x: 0.0, y: 0, z: 15.0, zone: 'spawn', links: ['wp_o_air_w', 'wp_o_air_e', 'wp_o_air_door'] },
            { id: 'wp_o_air_door', x: 0.0, y: 0, z: 11.2, zone: 'spawn', links: ['wp_o_air_c', 'wp_o_silo_s'] },

            { id: 'wp_o_silo_s', x: 0.0, y: 0, z: 6.0, zone: 'silo', links: ['wp_o_air_door', 'wp_o_silo_sw', 'wp_o_silo_se'] },
            { id: 'wp_o_silo_sw', x: -5.5, y: 0, z: 1.0, zone: 'silo', links: ['wp_o_silo_s', 'wp_o_silo_nw', 'wp_o_silo_w'] },
            { id: 'wp_o_silo_se', x: 5.5, y: 0, z: 1.0, zone: 'silo', links: ['wp_o_silo_s', 'wp_o_silo_ne', 'wp_o_silo_e'] },
            { id: 'wp_o_silo_w', x: -11.8, y: 0, z: 0.0, zone: 'silo', links: ['wp_o_silo_sw', 'wp_o_silo_nw', 'wp_o_cryo_door'] },
            { id: 'wp_o_silo_e', x: 11.8, y: 0, z: 0.0, zone: 'silo', links: ['wp_o_silo_se', 'wp_o_silo_ne', 'wp_o_reac_door'] },
            { id: 'wp_o_silo_nw', x: -6.0, y: 0, z: -7.0, zone: 'silo', links: ['wp_o_silo_sw', 'wp_o_silo_w', 'wp_o_silo_n'] },
            { id: 'wp_o_silo_ne', x: 6.0, y: 0, z: -7.0, zone: 'silo', links: ['wp_o_silo_se', 'wp_o_silo_e', 'wp_o_silo_n'] },
            { id: 'wp_o_silo_n', x: 0.0, y: 0, z: -7.8, zone: 'silo', links: ['wp_o_silo_nw', 'wp_o_silo_ne', 'wp_o_ctrl_s'] },

            { id: 'wp_o_cryo_door', x: -16.0, y: 0, z: 0.0, zone: 'cryo', links: ['wp_o_silo_w', 'wp_o_cryo_n', 'wp_o_cryo_s'] },
            { id: 'wp_o_cryo_n', x: -18.0, y: 0, z: -6.0, zone: 'cryo', links: ['wp_o_cryo_door', 'wp_o_cryo_nw'] },
            { id: 'wp_o_cryo_s', x: -18.0, y: 0, z: 6.0, zone: 'cryo', links: ['wp_o_cryo_door', 'wp_o_cryo_sw'] },
            { id: 'wp_o_cryo_nw', x: -23.5, y: 0, z: -5.0, zone: 'cryo', links: ['wp_o_cryo_n', 'wp_o_cryo_sw'] },
            { id: 'wp_o_cryo_sw', x: -23.5, y: 0, z: 5.0, zone: 'cryo', links: ['wp_o_cryo_s', 'wp_o_cryo_nw'] },

            { id: 'wp_o_reac_door', x: 16.0, y: 0, z: 0.0, zone: 'reactor', links: ['wp_o_silo_e', 'wp_o_reac_n', 'wp_o_reac_s'] },
            { id: 'wp_o_reac_n', x: 18.0, y: 0, z: -6.0, zone: 'reactor', links: ['wp_o_reac_door', 'wp_o_reac_ne'] },
            { id: 'wp_o_reac_s', x: 18.0, y: 0, z: 6.0, zone: 'reactor', links: ['wp_o_reac_door', 'wp_o_reac_se'] },
            { id: 'wp_o_reac_ne', x: 23.5, y: 0, z: -5.0, zone: 'reactor', links: ['wp_o_reac_n', 'wp_o_reac_se'] },
            { id: 'wp_o_reac_se', x: 23.5, y: 0, z: 5.0, zone: 'reactor', links: ['wp_o_reac_s', 'wp_o_reac_ne'] },

            { id: 'wp_o_ctrl_s', x: 0.0, y: 0, z: -13.0, zone: 'control', links: ['wp_o_silo_n', 'wp_o_ctrl_w', 'wp_o_ctrl_e', 'wp_o_ctrl_pap'] },
            { id: 'wp_o_ctrl_w', x: -7.5, y: 0, z: -20.5, zone: 'control', links: ['wp_o_ctrl_s', 'wp_o_ctrl_pap'] },
            { id: 'wp_o_ctrl_e', x: 7.5, y: 0, z: -20.5, zone: 'control', links: ['wp_o_ctrl_s', 'wp_o_ctrl_pap'] },
            { id: 'wp_o_ctrl_pap', x: 0.0, y: 0.85, z: -21.0, zone: 'control', links: ['wp_o_ctrl_s', 'wp_o_ctrl_w', 'wp_o_ctrl_e'] }
        ]
    };

    /* ========================================================================
       3. KILLHOUSE (MP — Symmetrical 3-Lane CQB Training Warehouse)
       Arena: x: -24..24, z: -28..28
    ======================================================================== */
    const KILLHOUSE = {
        id: 'killhouse',
        name: 'KILLHOUSE',
        mode: 'mp',
        subtitle: 'SAS Close-Quarters Training Compound',
        description: 'Fast-paced 3-lane warehouse arena with shipping containers, flanking plywood breach rooms, and a central two-story watchtower.',
        atmosphere: {
            skyTop: 0x3b6388,
            skyBottom: 0x9bb7ce,
            fogColor: 0x869db2,
            fogDensity: 0.011,
            sunColor: 0xfff0d6,
            sunIntensity: 1.45,
            sunPos: [28, 45, 20],
            hemiSky: 0x9cc5e8,
            hemiGround: 0x3f3c37,
            hemiIntensity: 0.72,
            moon: false
        },
        boxes: [
            // Ground asphalt slab
            boxMM(-26, -0.6, -30, 26, 0, 30, 'asphalt'),
            // Perimeter corrugated warehouse walls
            boxMM(-26, 0, 29.2, 26, 6.5, 30, 'concrete'),
            boxMM(-26, 0, -30, 26, 6.5, -29.2, 'concrete'),
            boxMM(-26, 0, -30, -25.2, 6.5, 30, 'concrete'),
            boxMM(25.2, 0, -30, 26, 6.5, 30, 'concrete'),

            // Central 2-story Watchtower platform (top at y=2.6)
            boxMM(-3.2, 0, -3.2, 3.2, 2.6, 3.2, 'wood_plank'),
            // Watchtower corner pillars + railing parapets
            boxMM(-3.2, 2.6, -3.2, -2.8, 5.4, -2.8, 'rusted_metal'),
            boxMM(2.8, 2.6, -3.2, 3.2, 5.4, -2.8, 'rusted_metal'),
            boxMM(-3.2, 2.6, 2.8, -2.8, 5.4, 3.2, 'rusted_metal'),
            boxMM(2.8, 2.6, 2.8, 3.2, 5.4, 3.2, 'rusted_metal'),
            boxMM(-3.3, 5.4, -3.3, 3.3, 5.7, 3.3, 'diamond_plate'),
            boxMM(-3.2, 2.6, -3.2, -1.0, 3.65, -2.9, 'wood_plank'),
            boxMM(1.0, 2.6, 2.9, 3.2, 3.65, 3.2, 'wood_plank'),

            // Blue & Red Cargo Shipping Containers (West / East mid-lanes)
            boxMM(-12.5, 0, 5.5, -9.5, 2.9, 13.5, 'container_blue'),
            boxMM(9.5, 0, -13.5, 12.5, 2.9, -5.5, 'container_red'),
            boxMM(-12.5, 0, -13.5, -9.5, 2.9, -5.5, 'container_olive'),
            boxMM(9.5, 0, 5.5, 12.5, 2.9, 13.5, 'container_olive'),

            // West & East Side Breach House Rooms (w/ open doorways)
            ...wallWithOpeningZ(-18.5, 0, 3.4, -8, 8, -2.0, 2.0, 2.8, 0.45, 'wood_plank'),
            ...wallWithOpeningZ(18.5, 0, 3.4, -8, 8, -2.0, 2.0, 2.8, 0.45, 'wood_plank'),
            boxMM(-23.5, 0, -8.2, -18.5, 3.4, -7.8, 'wood_plank'),
            boxMM(-23.5, 0, 7.8, -18.5, 3.4, 8.2, 'wood_plank'),
            boxMM(18.5, 0, -8.2, 23.5, 3.4, -7.8, 'wood_plank'),
            boxMM(18.5, 0, 7.8, 23.5, 3.4, 8.2, 'wood_plank'),

            // Spawn Headglitches & Sandbag Cover (North & South)
            boxMM(-5.5, 0, 17.5, -2.0, 1.25, 19.0, 'sandbag'),
            boxMM(2.0, 0, 17.5, 5.5, 1.25, 19.0, 'sandbag'),
            boxMM(-5.5, 0, -19.0, -2.0, 1.25, -17.5, 'sandbag'),
            boxMM(2.0, 0, -19.0, 5.5, 1.25, -17.5, 'sandbag'),

            // Center lane crates & concrete barriers
            boxMM(-7.0, 0, -1.2, -5.5, 1.35, 1.2, 'wood_crate'),
            boxMM(5.5, 0, -1.2, 7.0, 1.35, 1.2, 'wood_crate'),
            boxMM(-2.2, 0, 11.2, 2.2, 1.25, 12.4, 'concrete'),
            boxMM(-2.2, 0, -12.4, 2.2, 1.25, -11.2, 'concrete')
        ],
        ramps: [
            // North & South ramps up onto Central Watchtower
            { x: 0, w: 2.2, z1: 7.4, z2: 3.2, y1: 0, y2: 2.6, axis: 'z', mat: 'wood_plank' },
            { x: 0, w: 2.2, z1: -7.4, z2: -3.2, y1: 0, y2: 2.6, axis: 'z', mat: 'wood_plank' }
        ],
        lights: [
            { x: 0, y: 5.1, z: 0, color: 0xffe4b5, intensity: 1.1, distance: 16, alwaysOn: true }
        ],
        team0Spawns: [
            { x: -7, y: 0, z: 24, yaw: 0 }, { x: 0, y: 0, z: 25, yaw: 0 }, { x: 7, y: 0, z: 24, yaw: 0 },
            { x: -16, y: 0, z: 23, yaw: -0.2 }, { x: 16, y: 0, z: 23, yaw: 0.2 }, { x: 0, y: 0, z: 21, yaw: 0 },
            { x: -22, y: 0, z: 24, yaw: -0.3 }, { x: 22, y: 0, z: 24, yaw: 0.3 },
            { x: -16, y: 0, z: 15, yaw: -0.2 }, { x: 16, y: 0, z: 15, yaw: 0.2 },
            { x: -6, y: 0, z: 15, yaw: 0 }, { x: 6, y: 0, z: 15, yaw: 0 },
            { x: -21, y: 0, z: 4, yaw: -0.8 }, { x: 21, y: 0, z: 4, yaw: 0.8 },
            { x: -16, y: 0, z: 7, yaw: 0 }, { x: 16, y: 0, z: 7, yaw: 0 },
            { x: -7.8, y: 0, z: 8, yaw: 0.3 }, { x: 7.8, y: 0, z: 8, yaw: -0.3 },
            { x: 0, y: 2.6, z: 1.5, yaw: 0 }
        ],
        team1Spawns: [
            { x: -7, y: 0, z: -24, yaw: Math.PI }, { x: 0, y: 0, z: -25, yaw: Math.PI }, { x: 7, y: 0, z: -24, yaw: Math.PI },
            { x: -16, y: 0, z: -23, yaw: Math.PI + 0.2 }, { x: 16, y: 0, z: -23, yaw: Math.PI - 0.2 }, { x: 0, y: 0, z: -21, yaw: Math.PI },
            { x: -22, y: 0, z: -24, yaw: Math.PI + 0.3 }, { x: 22, y: 0, z: -24, yaw: Math.PI - 0.3 },
            { x: -16, y: 0, z: -15, yaw: Math.PI + 0.2 }, { x: 16, y: 0, z: -15, yaw: Math.PI - 0.2 },
            { x: -6, y: 0, z: -15, yaw: Math.PI }, { x: 6, y: 0, z: -15, yaw: Math.PI },
            { x: -21, y: 0, z: -4, yaw: Math.PI + 0.8 }, { x: 21, y: 0, z: -4, yaw: Math.PI - 0.8 },
            { x: -16, y: 0, z: -7, yaw: Math.PI }, { x: 16, y: 0, z: -7, yaw: Math.PI },
            { x: -7.8, y: 0, z: -8, yaw: Math.PI - 0.3 }, { x: 7.8, y: 0, z: -8, yaw: Math.PI + 0.3 },
            { x: 0, y: 2.6, z: -1.5, yaw: Math.PI }
        ],
        domFlags: [
            { id: 'A', label: 'A', x: 0, y: 0, z: 18.5 },
            { id: 'B', label: 'B', x: 0, y: 2.6, z: 0.0 },
            { id: 'C', label: 'C', x: 0, y: 0, z: -18.5 }
        ],
        hardpoints: [
            { id: 'HP1', label: 'WATCHTOWER', x: 0, y: 2.6, z: 0, r: 4.5 },
            { id: 'HP2', label: 'WEST BREACH', x: -21.0, y: 0, z: 0, r: 4.5 },
            { id: 'HP3', label: 'EAST BREACH', x: 21.0, y: 0, z: 0, r: 4.5 },
            { id: 'HP4', label: 'SOUTH COURTYARD', x: 0, y: 0, z: 15.0, r: 4.5 }
        ],
        waypoints: [
            { id: 'k_s_c', x: 0, y: 0, z: 23, links: ['k_s_w', 'k_s_e', 'k_ms_c'] },
            { id: 'k_s_w', x: -15, y: 0, z: 22, links: ['k_s_c', 'k_wl_s'] },
            { id: 'k_s_e', x: 15, y: 0, z: 22, links: ['k_s_c', 'k_el_s'] },
            { id: 'k_ms_c', x: 0, y: 0, z: 14, links: ['k_s_c', 'k_tower_s', 'k_ml_sw', 'k_ml_se'] },
            { id: 'k_tower_s', x: 0, y: 0, z: 8.5, links: ['k_ms_c', 'k_tower_top', 'k_ml_sw', 'k_ml_se'] },
            { id: 'k_tower_top', x: 0, y: 2.6, z: 0, links: ['k_tower_s', 'k_tower_n'] },
            { id: 'k_tower_n', x: 0, y: 0, z: -8.5, links: ['k_mn_c', 'k_tower_top', 'k_ml_nw', 'k_ml_ne'] },
            { id: 'k_ml_sw', x: -5.5, y: 0, z: 6, links: ['k_ms_c', 'k_tower_s', 'k_ml_w', 'k_wl_s'] },
            { id: 'k_ml_se', x: 5.5, y: 0, z: 6, links: ['k_ms_c', 'k_tower_s', 'k_ml_e', 'k_el_s'] },
            { id: 'k_ml_w', x: -8.25, y: 0, z: 0, links: ['k_ml_sw', 'k_ml_nw', 'k_wl_c'] },
            { id: 'k_ml_e', x: 8.25, y: 0, z: 0, links: ['k_ml_se', 'k_ml_ne', 'k_el_c'] },
            { id: 'k_ml_nw', x: -5.5, y: 0, z: -6, links: ['k_mn_c', 'k_tower_n', 'k_ml_w', 'k_wl_n'] },
            { id: 'k_ml_ne', x: 5.5, y: 0, z: -6, links: ['k_mn_c', 'k_tower_n', 'k_ml_e', 'k_el_n'] },
            { id: 'k_wl_s', x: -16, y: 0, z: 12, links: ['k_s_w', 'k_ml_sw', 'k_wl_c'] },
            { id: 'k_wl_c', x: -16, y: 0, z: 0, links: ['k_wl_s', 'k_wl_n', 'k_ml_w', 'k_w_room'] },
            { id: 'k_w_room', x: -21, y: 0, z: 0, links: ['k_wl_c'] },
            { id: 'k_wl_n', x: -16, y: 0, z: -12, links: ['k_n_w', 'k_ml_nw', 'k_wl_c'] },
            { id: 'k_el_s', x: 16, y: 0, z: 12, links: ['k_s_e', 'k_ml_se', 'k_el_c'] },
            { id: 'k_el_c', x: 16, y: 0, z: 0, links: ['k_el_s', 'k_el_n', 'k_ml_e', 'k_e_room'] },
            { id: 'k_e_room', x: 21, y: 0, z: 0, links: ['k_el_c'] },
            { id: 'k_el_n', x: 16, y: 0, z: -12, links: ['k_n_e', 'k_ml_ne', 'k_el_c'] },
            { id: 'k_mn_c', x: 0, y: 0, z: -14, links: ['k_n_c', 'k_tower_n', 'k_ml_nw', 'k_ml_ne'] },
            { id: 'k_n_c', x: 0, y: 0, z: -23, links: ['k_n_w', 'k_n_e', 'k_mn_c'] },
            { id: 'k_n_w', x: -15, y: 0, z: -22, links: ['k_n_c', 'k_wl_n'] },
            { id: 'k_n_e', x: 15, y: 0, z: -22, links: ['k_n_c', 'k_el_n'] }
        ]
    };

    /* ========================================================================
       4. CRASH SITE (MP — Desert Urban Downed Blackhawk Combat Zone)
       Arena: x: -28..28, z: -32..32
    ======================================================================== */
    const CRASH_SITE = {
        id: 'crash_site',
        name: 'CRASH SITE',
        mode: 'mp',
        subtitle: 'Arid Urban Alleyways • Downed Blackhawk Wreckage',
        description: 'Iconic desert town centered around a downed helicopter fuselage, flanked by two-story sandstone sniper buildings and bazaar stalls.',
        atmosphere: {
            skyTop: 0x5682b4,
            skyBottom: 0xe6c89c,
            fogColor: 0xcfb188,
            fogDensity: 0.010,
            sunColor: 0xffe4ad,
            sunIntensity: 1.65,
            sunPos: [35, 50, -18],
            hemiSky: 0xbad6f5,
            hemiGround: 0x806343,
            hemiIntensity: 0.78,
            moon: false
        },
        boxes: [
            // Desert sand & road slab
            boxMM(-30, -0.6, -34, 30, 0, 34, 'desert_sand'),
            // Perimeter city walls
            boxMM(-30, 0, 33.2, 30, 7.0, 34, 'brick'),
            boxMM(-30, 0, -34, 30, 7.0, -33.2, 'brick'),
            boxMM(-30, 0, -34, -29.2, 7.0, 34, 'brick'),
            boxMM(29.2, 0, -34, 30, 7.0, 34, 'brick'),

            // Central Downed Blackhawk Helicopter Fuselage (tilted wreckage)
            boxMM(-2.4, 0, -5.2, 2.4, 1.9, 3.8, 'rusted_metal'),
            boxMM(-0.9, 0.8, 3.8, 0.9, 1.7, 9.2, 'rusted_metal'),     // tail boom
            boxMM(-5.8, 2.05, -2.0, 5.8, 2.2, -1.4, 'diamond_plate'),  // bent main rotor blade
            boxMM(-1.0, 2.05, -6.5, 1.0, 2.2, 3.5, 'diamond_plate'),

            // West 2-Story Overlook Building (x: -24..-14, z: -10..10)
            boxMM(-24, 0, -10, -14, 3.0, 10, 'brick'),
            // West 2nd-story balcony parapet overlooking Crash Site (with ramp entrance gap at x:-21..-17 on North side)
            boxMM(-14.6, 3.0, -10, -14.0, 4.15, -2.5, 'concrete'),
            boxMM(-14.6, 3.0, 2.5, -14.0, 4.15, 10, 'concrete'),
            boxMM(-24, 3.0, -10, -23.4, 6.2, 10, 'brick'),
            boxMM(-24, 3.0, -10, -21.0, 4.2, -9.4, 'brick'),
            boxMM(-17.0, 3.0, -10, -14.0, 4.2, -9.4, 'brick'),
            boxMM(-24, 3.0, 9.4, -14, 6.2, 10, 'brick'),

            // East Bazaar Two-Story Building (x: 14..24, z: -8..8) — South ramp open at z=8
            boxMM(14, 0, -8, 24, 3.0, 8, 'concrete'),
            boxMM(14.0, 3.0, -8, 14.6, 4.15, -2.0, 'brick'),
            boxMM(14.0, 3.0, 2.0, 14.6, 4.15, 8, 'brick'),
            boxMM(23.4, 3.0, -8, 24, 6.2, 8, 'concrete'),

            // Burned urban sedans & market stalls providing lane cover
            boxMM(-7.2, 0, 11.5, -4.6, 1.4, 15.8, 'rusted_metal'),
            boxMM(5.0, 0, -15.8, 7.6, 1.4, -11.5, 'rusted_metal'),
            boxMM(-7.8, 0, -14.5, -4.8, 1.5, -12.0, 'wood_crate'),
            boxMM(5.0, 0, 12.0, 8.0, 1.5, 14.5, 'wood_crate'),

            // South & North Shop Kiosks
            boxMM(-12.5, 0, 20.5, -7.5, 3.4, 24.5, 'brick'),
            boxMM(7.5, 0, -24.5, 12.5, 3.4, -20.5, 'brick'),
            boxMM(-3.5, 0, 19.5, 3.5, 1.25, 21.0, 'sandbag'),
            boxMM(-3.5, 0, -21.0, 3.5, 1.25, -19.5, 'sandbag')
        ],
        ramps: [
            // Ramp up onto West 2-Story Overlook from North side (z=-15 -> -10)
            { x: -19.0, w: 3.2, z1: -15.5, z2: -10.0, y1: 0, y2: 3.0, axis: 'z', mat: 'concrete' },
            // Ramp up onto East 2-Story Overlook from South side (z=13.5 -> 8)
            { x: 19.0, w: 3.2, z1: 13.5, z2: 8.0, y1: 0, y2: 3.0, axis: 'z', mat: 'concrete' }
        ],
        lights: [
            { x: 0, y: 1.5, z: 0, color: 0xff6b2b, intensity: 1.5, distance: 12, prop: 'fire_barrel', alwaysOn: true }
        ],
        team0Spawns: [
            { x: -8, y: 0, z: 28, yaw: 0 }, { x: 0, y: 0, z: 29, yaw: 0 }, { x: 8, y: 0, z: 28, yaw: 0 },
            { x: -19, y: 0, z: 26, yaw: -0.2 }, { x: 19, y: 0, z: 26, yaw: 0.2 }, { x: 0, y: 0, z: 25, yaw: 0 },
            { x: -25, y: 0, z: 24, yaw: -0.3 }, { x: 25, y: 0, z: 24, yaw: 0.3 },
            { x: -19, y: 0, z: 16, yaw: -0.2 }, { x: 19, y: 0, z: 16, yaw: 0.2 },
            { x: -26.5, y: 0, z: 8, yaw: -0.4 }, { x: 26.5, y: 0, z: 8, yaw: 0.4 },
            { x: -11, y: 0, z: 16, yaw: 0 }, { x: 11, y: 0, z: 16, yaw: 0 },
            { x: -26.5, y: 0, z: 0, yaw: -1.2 }, { x: 26.5, y: 0, z: 0, yaw: 1.2 },
            { x: 19, y: 3.0, z: 2, yaw: 1.2 }, { x: -10, y: 0, z: 6, yaw: 0 }, { x: 10, y: 0, z: 6, yaw: 0 }
        ],
        team1Spawns: [
            { x: -8, y: 0, z: -28, yaw: Math.PI }, { x: 0, y: 0, z: -29, yaw: Math.PI }, { x: 8, y: 0, z: -28, yaw: Math.PI },
            { x: -19, y: 0, z: -26, yaw: Math.PI + 0.2 }, { x: 19, y: 0, z: -26, yaw: Math.PI - 0.2 }, { x: 0, y: 0, z: -25, yaw: Math.PI },
            { x: -25, y: 0, z: -24, yaw: Math.PI + 0.3 }, { x: 25, y: 0, z: -24, yaw: Math.PI - 0.3 },
            { x: -19, y: 0, z: -17, yaw: Math.PI + 0.2 }, { x: 19, y: 0, z: -17, yaw: Math.PI - 0.2 },
            { x: -26.5, y: 0, z: -8, yaw: Math.PI + 0.4 }, { x: 26.5, y: 0, z: -8, yaw: Math.PI - 0.4 },
            { x: -11, y: 0, z: -16, yaw: Math.PI }, { x: 11, y: 0, z: -16, yaw: Math.PI },
            { x: -19, y: 3.0, z: -2, yaw: -1.2 }, { x: -10, y: 0, z: -6, yaw: Math.PI }, { x: 10, y: 0, z: -6, yaw: Math.PI },
            { x: -26.5, y: 0, z: -16, yaw: Math.PI + 0.3 }, { x: 26.5, y: 0, z: -16, yaw: Math.PI - 0.3 }
        ],
        domFlags: [
            { id: 'A', label: 'A', x: 0, y: 0, z: 23.5 },
            { id: 'B', label: 'B', x: -4.5, y: 0, z: -1.0 },
            { id: 'C', label: 'C', x: 0, y: 0, z: -23.5 }
        ],
        hardpoints: [
            { id: 'HP1', label: 'HELICOPTER CRASH', x: 4.5, y: 0, z: -1.0, r: 4.8 },
            { id: 'HP2', label: 'WEST OVERLOOK', x: -18.5, y: 3.0, z: 0, r: 4.5 },
            { id: 'HP3', label: 'EAST BAZAAR', x: 18.5, y: 3.0, z: 0, r: 4.5 },
            { id: 'HP4', label: 'NORTH ROAD', x: 0, y: 0, z: -17.0, r: 4.8 }
        ],
        waypoints: [
            { id: 'c_s_c', x: 0, y: 0, z: 26, links: ['c_s_w', 'c_s_e', 'c_ms_c'] },
            { id: 'c_s_w', x: -18, y: 0, z: 25, links: ['c_s_c', 'c_wl_s'] },
            { id: 'c_s_e', x: 19, y: 0, z: 25, links: ['c_s_c', 'c_el_s'] },
            { id: 'c_ms_c', x: 0, y: 0, z: 14, links: ['c_s_c', 'c_mid_w', 'c_mid_e'] },
            { id: 'c_mid_w', x: -7, y: 0, z: 0, links: ['c_ms_c', 'c_mn_c', 'c_wl_s', 'c_wl_n'] },
            { id: 'c_mid_e', x: 7, y: 0, z: 0, links: ['c_ms_c', 'c_mn_c', 'c_el_s', 'c_el_n'] },
            { id: 'c_wl_s', x: -19, y: 0, z: 16, links: ['c_s_w', 'c_mid_w', 'c_w_ally'] },
            { id: 'c_w_ally', x: -26.5, y: 0, z: 0, links: ['c_wl_s', 'c_wl_n'] },
            { id: 'c_wl_n', x: -19, y: 0, z: -17, links: ['c_n_w', 'c_mid_w', 'c_w_ally', 'c_w_top'] },
            { id: 'c_w_top', x: -19, y: 3.0, z: 0, links: ['c_wl_n'] },
            { id: 'c_el_s', x: 19, y: 0, z: 16, links: ['c_s_e', 'c_mid_e', 'c_e_ally', 'c_e_top'] },
            { id: 'c_e_ally', x: 26.5, y: 0, z: 0, links: ['c_el_s', 'c_el_n'] },
            { id: 'c_e_top', x: 19, y: 3.0, z: 0, links: ['c_el_s'] },
            { id: 'c_el_n', x: 19, y: 0, z: -17, links: ['c_n_e', 'c_mid_e', 'c_e_ally'] },
            { id: 'c_mn_c', x: 0, y: 0, z: -14, links: ['c_n_c', 'c_mid_w', 'c_mid_e'] },
            { id: 'c_n_c', x: 0, y: 0, z: -26, links: ['c_n_w', 'c_n_e', 'c_mn_c'] },
            { id: 'c_n_w', x: -18, y: 0, z: -25, links: ['c_n_c', 'c_wl_n'] },
            { id: 'c_n_e', x: 18, y: 0, z: -25, links: ['c_n_c', 'c_el_n'] }
        ]
    };

    /* ========================================================================
       5. NACHT DER UNTOTEN (COD WaW — 100% 1:1 Abandoned Airfield Bunker)
       1:1 Official Replica:
         - 3 Zones: 'spawn' (1F), 'help' (1F), 'upstairs' (2F w/ drop-down hole)
         - 10 Exact Barricaded Windows (5 Spawn, 3 Help, 2 Upstairs)
         - 3 Clearable Barriers: Blood "HELP" Door (1,000), Couch Stairs (1,000),
           Help Room Stairs (1,000)
         - Fixed Mystery Box in Help Room (never moves)
         - 2F Sniper Cabinet (1,500 Scoped M40A3), Frag Grenades (250), Kar98k (200),
           M1A1/Mk14 (600), Double-Barrel (1200), Thompson (1500), Model 1887 (1200),
           Trench Gun/R870 (1500), BAR/M60E4 (1800), Crashed Airfield Plane Wing
         - Canonical WaW Rules: 0 Power Switch, 0 Perks, 0 Pack-a-Punch
    ======================================================================== */
    const NACHT_DER_UNTOTEN = {
        id: 'nacht_der_untoten',
        name: 'NACHT DER UNTOTEN',
        mode: 'zombies',
        subtitle: 'COD World at War (100% 1:1 Official Replica) • Abandoned Airfield Bunker',
        description: '100% 1:1 Official WaW Layout: 5-Window Spawn Room with twin pillars, blood-painted "HELP" Door (1,000 PTS) to the fixed Mystery Box room, Couch Staircase Debris, 2nd Floor Overlook w/ Drop-Down Hole & Sniper Cabinet (1,500 PTS), and 10 windows!',
        atmosphere: {
            skyTop: 0x05070b, skyBottom: 0x121820, fogColor: 0x0d1218, fogDensity: 0.024,
            sunColor: 0x94a3b8, sunIntensity: 0.72, sunPos: [20, 35, 18],
            hemiSky: 0x475569, hemiGround: 0x090b0e, hemiIntensity: 0.62, moon: true
        },
        playerSpawn: { x: 0, y: 0, z: 10.0, yaw: 0 },
        ramps: [
            // Spawn Room Couch Staircase up to 2nd Floor (East side: x=6.8, z: 14.0 -> 5.5, y: 0 -> 3.4)
            { x: 6.8, w: 2.8, z1: 14.0, z2: 5.5, y1: 0, y2: 3.4, axis: 'z', mat: 'concrete' },
            // Help Room Staircase up to 2nd Floor (West side: x=-6.8, z: -14.0 -> -5.5, y: 0 -> 3.4)
            { x: -6.8, w: 2.8, z1: -14.0, z2: -5.5, y1: 0, y2: 3.4, axis: 'z', mat: 'concrete' }
        ],
        boxes: [
            // Exterior airfield floor & perimeter fog walls
            boxMM(-24, -0.6, -24, 24, 0, 24, 'asphalt'),
            boxMM(-24, 0, 23.3, 24, 7.6, 24, 'bunker_stone'),
            boxMM(-24, 0, -24, 24, 7.6, -23.3, 'bunker_stone'),
            boxMM(-24, 0, -24, -23.3, 7.6, 24, 'bunker_stone'),
            boxMM(23.3, 0, -24, 24, 7.6, 24, 'bunker_stone'),
            // Room 1: 1F Starting Room (x: -9..9, z: 0..16) — 5 Canonical Windows
            ...wallWithWindowX(16, -9, 0, -5.4, -3.0, 3.4, 0.7, 'bunker_stone'),
            ...wallWithWindowX(16, 0, 9, 1.8, 4.2, 3.4, 0.7, 'bunker_stone'),
            ...wallWithWindowZ(-9, 0, 8, 2.8, 5.2, 3.4, 0.7, 'bunker_stone'),
            ...wallWithWindowZ(-9, 8, 16, 10.8, 13.2, 3.4, 0.7, 'bunker_stone'),
            ...wallWithWindowZ(9, 0, 16, 1.0, 3.4, 3.4, 0.7, 'bunker_stone'),
            // Partition wall at z=0 with "HELP" Door opening (x: -1.8..1.8)
            ...wallWithOpeningX(0, 0, 3.4, -9, 9, -1.8, 1.8, 3.0, 0.7, 'bunker_stone'),
            // Twin square concrete support pillars & bunker cover in Spawn Room
            boxMM(-3.2, 0, 6.5, -2.1, 3.4, 7.6, 'concrete'),
            boxMM(2.1, 0, 6.5, 3.2, 3.4, 7.6, 'concrete'),
            boxMM(-7.2, 0, 12.0, -5.0, 1.05, 13.4, 'sandbag'),
            // Airtight Spawn Couch Stairwell Partition Walls (1F + 2F + Overhead Bulkhead Lintel)
            boxMM(5.05, 0, 5.5, 5.45, 3.4, 12.6, 'bunker_stone'),
            boxMM(5.05, 3.4, 5.5, 5.45, 4.6, 9.2, 'bunker_stone'),
            boxMM(5.05, 3.4, 9.2, 5.45, 6.8, 15.65, 'bunker_stone'),
            boxMM(5.45, 4.7, 8.7, 8.65, 6.8, 9.7, 'bunker_stone'),
            // Room 2: 1F "HELP" Room (x: -9..9, z: -16..0) — 3 Canonical Windows + Pillars + Stairwell Seal
            ...wallWithWindowX(-16, -9, 0, -4.4, -2.0, 3.4, 0.7, 'bunker_stone'),
            ...wallWithWindowX(-16, 0, 9, 2.8, 5.2, 3.4, 0.7, 'bunker_stone'),
            ...wallWithWindowZ(-9, -16, 0, -5.7, -3.3, 3.4, 0.7, 'bunker_stone'),
            boxMM(8.65, 0, -16, 9.35, 3.4, 0, 'bunker_stone'),
            boxMM(-2.5, 0, -8.5, -1.5, 3.4, -7.5, 'concrete'),
            boxMM(1.5, 0, -8.5, 2.5, 3.4, -7.5, 'concrete'),
            boxMM(3.6, 0, -12.8, 6.4, 1.05, -11.4, 'sandbag'),
            // Airtight Help Room Stairwell Partition Walls (1F + 2F + Overhead Bulkhead Lintel)
            boxMM(-5.45, 0, -12.6, -5.05, 3.4, -5.5, 'bunker_stone'),
            boxMM(-5.45, 3.4, -15.65, -5.05, 4.6, -5.5, 'bunker_stone'),
            boxMM(-8.65, 4.7, -9.7, -5.45, 6.8, -8.7, 'bunker_stone'),
            // Room 3: Upstairs 2F Floor Slabs (y: 3.2..3.4) w/ Stair Slots + Drop-Down Hole (-4.2..0.8, -4.5..-1.5)
            boxMM(-5.2, 3.2, -16.0, 9.0, 3.4, -4.5, 'concrete'),
            boxMM(-9.0, 3.2, 5.5, 5.2, 3.4, 16.0, 'concrete'),
            boxMM(-9.0, 3.2, -5.5, -4.2, 3.4, 5.5, 'concrete'),
            boxMM(0.8, 3.2, -4.5, 9.0, 3.4, 5.5, 'concrete'),
            boxMM(-4.2, 3.2, -1.5, 0.8, 3.4, 5.5, 'concrete'),
            // 2F Perimeter Walls w/ 2 Upstairs Windows (total = 10 Windows) & Ruined Airfield Roof
            ...wallWithWindowXAt(-16, 3.4, -9.35, 9.35, -4.4, -2.0, 3.4, 0.7, 'bunker_stone'),
            ...wallWithWindowXAt(16, 3.4, -9.35, 9.35, 1.8, 4.2, 3.4, 0.7, 'bunker_stone'),
            boxMM(-9.35, 3.4, -16.35, -8.65, 6.8, 16.35, 'bunker_stone'),
            boxMM(8.65, 3.4, -16.35, 9.35, 6.8, 16.35, 'bunker_stone'),
            // Iconic blown-out corner roof opening above Spawn/Help overlooking sky (covers Spawn safely)
            boxMM(-9.4, 6.8, -16.4, 9.4, 7.2, 16.4, 'ceiling_plaster')
        ],
        lights: [
            { x: 0, y: 3.0, z: 9.0, color: 0xffc278, intensity: 1.5, distance: 16, zone: 'spawn', alwaysOn: true },
            { x: 3.6, y: 1.2, z: 14.5, baseY: 0, color: 0xff6b2b, intensity: 1.2, distance: 10, prop: 'fire_barrel', alwaysOn: true },
            { x: 0, y: 3.0, z: -8.0, color: 0x93c5fd, intensity: 1.5, distance: 16, zone: 'help', alwaysOn: true },
            { x: 0, y: 6.3, z: -2.0, color: 0xfde047, intensity: 1.6, distance: 22, zone: 'upstairs', alwaysOn: true }
        ],
        zones: ['spawn', 'help', 'upstairs'],
        doors: [
            { id: 'nacht_help_door', fromZone: 'spawn', toZone: 'help', cost: 1000, requiresPower: false, x: 0, y: 1.5, z: 0.0, w: 3.5, h: 3.0, d: 0.55, label: '"HELP" DOOR' },
            { id: 'nacht_stairs_spawn', fromZone: 'spawn', toZone: 'upstairs', cost: 1000, requiresPower: false, x: 7.05, y: 2.5, z: 9.2, w: 3.3, h: 4.4, d: 1.0, style: 'couch_debris', label: 'COUCH STAIRCASE DEBRIS' },
            { id: 'nacht_stairs_help', fromZone: 'help', toZone: 'upstairs', cost: 1000, requiresPower: false, x: -7.05, y: 2.5, z: -9.2, w: 3.3, h: 4.4, d: 1.0, style: 'couch_debris', label: 'HELP ROOM STAIRS DEBRIS' }
        ],
        windows: [
            { id: 'n_w1', zone: 'spawn', x: -4.2, y: 0, z: 16.0, w: 2.3, axis: 'z', outside: [-4.2, 0, 18.2], inside: [-4.2, 0, 13.8], waypointId: 'n_sp_c' },
            { id: 'n_w2', zone: 'spawn', x: 3.0, y: 0, z: 16.0, w: 2.3, axis: 'z', outside: [3.0, 0, 18.2], inside: [3.0, 0, 13.8], waypointId: 'n_sp_c' },
            { id: 'n_w3', zone: 'spawn', x: -9.0, y: 0, z: 12.0, w: 2.3, axis: 'x', outside: [-11.2, 0, 12.0], inside: [-6.8, 0, 12.0], waypointId: 'n_sp_c' },
            { id: 'n_w4', zone: 'spawn', x: -9.0, y: 0, z: 4.0, w: 2.3, axis: 'x', outside: [-11.2, 0, 4.0], inside: [-6.8, 0, 4.0], waypointId: 'n_sp_c' },
            { id: 'n_w5', zone: 'spawn', x: 9.0, y: 0, z: 2.2, w: 2.3, axis: 'x', outside: [11.2, 0, 2.2], inside: [6.8, 0, 2.2], waypointId: 'n_sp_c' },
            { id: 'n_w6', zone: 'help', x: -9.0, y: 0, z: -4.5, w: 2.3, axis: 'x', outside: [-11.2, 0, -4.5], inside: [-6.8, 0, -4.5], waypointId: 'n_hlp_c' },
            { id: 'n_w7', zone: 'help', x: -3.2, y: 0, z: -16.0, w: 2.3, axis: 'z', outside: [-3.2, 0, -18.2], inside: [-3.2, 0, -13.8], waypointId: 'n_hlp_c' },
            { id: 'n_w8', zone: 'help', x: 4.0, y: 0, z: -16.0, w: 2.3, axis: 'z', outside: [4.0, 0, -18.2], inside: [4.0, 0, -13.8], waypointId: 'n_hlp_c' },
            { id: 'n_w9', zone: 'upstairs', x: -3.2, y: 3.4, z: -16.0, w: 2.3, axis: 'z', outside: [-3.2, 3.4, -18.0], inside: [-3.2, 3.4, -13.8], waypointId: 'n_up_n' },
            { id: 'n_w10', zone: 'upstairs', x: 3.0, y: 3.4, z: 16.0, w: 2.3, axis: 'z', outside: [3.0, 3.4, 18.0], inside: [3.0, 3.4, 13.8], waypointId: 'n_up_s' }
        ],
        groundSpawners: [
            { zone: 'help', x: -3.8, y: 0, z: -13.5, waypointId: 'n_hlp_c' },
            { zone: 'help', x: 6.2, y: 0, z: -14.0, waypointId: 'n_hlp_c' },
            { zone: 'help', x: -3.8, y: 0, z: -3.5, waypointId: 'n_hlp_d' },
            { zone: 'upstairs', x: -2.0, y: 3.4, z: -12.0, waypointId: 'n_up_n' },
            { zone: 'upstairs', x: 2.0, y: 3.4, z: 12.0, waypointId: 'n_up_s' },
            { zone: 'upstairs', x: -6.8, y: 3.4, z: 0.0, waypointId: 'n_up_n' },
            { zone: 'upstairs', x: 6.2, y: 3.4, z: -2.0, waypointId: 'n_up_s' },
            { zone: 'upstairs', x: -6.2, y: 3.4, z: 12.0, waypointId: 'n_up_s' }
        ],
        perks: [],
        wallBuys: [
            { weaponId: 'kar98k_irons', cost: 200, ammoCost: 100, x: -8.5, y: 1.5, z: 1.5, rotY: Math.PI * 0.5 },
            { weaponId: 'mk14', cost: 600, ammoCost: 300, x: 4.5, y: 1.5, z: 0.42, rotY: 0 },
            { weaponId: 'double_barrel', cost: 1200, ammoCost: 600, x: 0.0, y: 1.5, z: -15.5, rotY: 0 },
            { weaponId: 'thompson_m1', cost: 1500, ammoCost: 750, x: 8.5, y: 1.5, z: -3.2, rotY: -Math.PI * 0.5 },
            { weaponId: 'model_1887_mw2', cost: 1200, ammoCost: 600, x: -4.0, y: 4.9, z: 15.5, rotY: Math.PI },
            { weaponId: 'r870', cost: 1500, ammoCost: 750, x: 8.5, y: 4.9, z: 1.5, rotY: -Math.PI * 0.5 },
            { weaponId: 'm60e4_pig', cost: 1800, ammoCost: 900, x: 8.5, y: 4.9, z: -10.5, rotY: -Math.PI * 0.5 }
        ],
        sniperCabinets: [
            { id: 'nacht_sniper_cab', weaponId: 'm40a3_cod4', cost: 1500, x: 0.0, y: 4.55, z: -15.4, rotY: 0 }
        ],
        grenadeWalls: [
            { id: 'nacht_nades', cost: 250, x: 4.95, y: 4.9, z: 10.5, rotY: -Math.PI * 0.5 }
        ],
        armorWall: null,
        mysteryBoxPads: [
            // Fixed WaW Mystery Box against Help Room East wall — NEVER relocates!
            { id: 'nacht_box', x: 7.4, y: 0, z: -8.0, rotY: -Math.PI * 0.5, zone: 'help' }
        ],
        powerSwitch: null,
        powerSigns: [],
        wallWritings: [
            { text: 'HELP', color: 'rgba(175, 20, 20, 0.90)', x: -3.4, y: 1.75, z: 0.38, rotY: 0, w: 1.5, h: 0.75 },
            { text: 'SNIPER CABINET', color: 'rgba(226, 232, 240, 0.75)', x: 0.0, y: 5.9, z: -15.4, rotY: 0, w: 1.8, h: 0.55 }
        ],
        landmarks: [
            { kind: 'crash_plane_wing', x: -16.0, y: 1.2, z: -19.5 }
        ],
        packAPunch: null,
        exfilPoint: { x: 0, y: 0, z: 8.0 },
        waypoints: [
            { id: 'n_sp_c', x: 0, y: 0, z: 8.5, zone: 'spawn', links: ['n_sp_d', 'n_sp_st'] },
            { id: 'n_sp_d', x: 0, y: 0, z: 1.5, zone: 'spawn', links: ['n_sp_c', 'n_hlp_d'] },
            { id: 'n_sp_st', x: 6.8, y: 0, z: 13.0, zone: 'spawn', links: ['n_sp_c', 'n_up_s'] },
            { id: 'n_hlp_d', x: 0, y: 0, z: -1.5, zone: 'help', links: ['n_sp_d', 'n_hlp_c'] },
            { id: 'n_hlp_c', x: 0, y: 0, z: -8.5, zone: 'help', links: ['n_hlp_d', 'n_hlp_st'] },
            { id: 'n_hlp_st', x: -6.8, y: 0, z: -13.0, zone: 'help', links: ['n_hlp_c', 'n_up_n'] },
            { id: 'n_up_s', x: 4.5, y: 3.4, z: 5.5, zone: 'upstairs', links: ['n_sp_st', 'n_up_n'] },
            { id: 'n_up_n', x: -4.5, y: 3.4, z: -5.5, zone: 'upstairs', links: ['n_hlp_st', 'n_up_s'] }
        ]
    };

    /* ========================================================================
       6. SHI NO NUMA (COD WaW — 100% 1:1 Imperial Swamp of Death)
       1:1 Official Replica:
         - Spawn 2F Central Hut Loft under Hanging Paratrooper Peter McCain
           (Arisaka/Kar98k [200], Gewehr/Mk14 [600], 2 windows, 750 PTS stair gate)
         - 1F Central Hut: initial Mystery Box, Thompson [1200], Trench Gun/R870 [1500],
           Grenades [250], 2 windows, 4 Exterior Swamp Gates [1,000 PTS each]
         - Swamp Basin Slow Zones + Safe Wooden Boardwalk Bridges
         - 4 Outer Huts (Fishing Hut, Doctor's Quarters, Storage Hut, Comm Room), each
           with 750 PTS Hut Door, 3 Windows (total = 16 Windows!), 1,000 PTS Electro-Shock
           Trap, Mystery Box pad, and Randomized Perk-a-Cola shuffled every match!
         - Spinning Flogger Trap (750 PTS, crouch-safe), Zipline (1,500 PTS), &
           Comm Room Telephone ("The One" Easter Egg)
         - Canonical WaW Rules: 0 Power Switch, 0 Pack-a-Punch, 0 Power Signs
    ======================================================================== */
    const SHI_NO_NUMA = {
        id: 'shi_no_numa',
        name: 'SHI NO NUMA',
        mode: 'zombies',
        subtitle: 'COD World at War (100% 1:1 Official Replica) • Swamp of Death & 4 Outer Huts',
        description: '100% 1:1 Official WaW Layout: Spawn upstairs under Hanging Paratrooper Peter McCain, open stairs to 1F Mystery Box, wade or stay on wooden boardwalks across the mud to Fishing Hut (Flogger), Doctor\'s Quarters (Zipline), Storage Hut, and Comm Room (Telephone Easter Egg) with randomized Perks!',
        atmosphere: {
            skyTop: 0x09140e, skyBottom: 0x1b2e20, fogColor: 0x132217, fogDensity: 0.021,
            sunColor: 0xa3e635, sunIntensity: 0.85, sunPos: [-25, 35, 20],
            hemiSky: 0x4d7c0f, hemiGround: 0x0f170e, hemiIntensity: 0.66, moon: true
        },
        playerSpawn: { x: -1.5, y: 3.2, z: 2.5, yaw: 0 },
        slowZones: [
            { minX: -32, maxX: 32, minZ: -32, maxZ: 32, maxY: 0.12 }
        ],
        boardwalkSafeZones: [
            { minX: -7.5, maxX: 7.5, minZ: -7.5, maxZ: 7.5 },       // Central Hut
            { minX: -7.0, maxX: 7.0, minZ: -30.5, maxZ: -17.5 },   // Fishing Hut
            { minX: 17.5, maxX: 30.5, minZ: -7.0, maxZ: 7.0 },     // Doctor's Quarters
            { minX: -7.0, maxX: 7.0, minZ: 17.5, maxZ: 30.5 },     // Storage Hut
            { minX: -30.5, maxX: -17.5, minZ: -7.0, maxZ: 7.0 },   // Comm Room
            { minX: -2.6, maxX: 2.6, minZ: -18.5, maxZ: -6.5 },    // North boardwalk
            { minX: 6.5, maxX: 18.5, minZ: -2.6, maxZ: 2.6 },      // East boardwalk
            { minX: -2.6, maxX: 2.6, minZ: 6.5, maxZ: 18.5 },      // South boardwalk
            { minX: -18.5, maxX: -6.5, minZ: -2.6, maxZ: 2.6 }     // West boardwalk
        ],
        ramps: [
            // Central Hut staircase from 2F Spawn (y=3.2) down to 1F (y=0) along SE corner (no gate obstruction!)
            { x1: 5.8, x2: 2.0, z: 5.2, w: 2.4, y1: 3.2, y2: 0, axis: 'x', mat: 'wood_plank' }
        ],
        boxes: [
            // Swamp mud basin & water perimeter
            boxMM(-33, -0.6, -33, 33, 0, 33, 'swamp_mud'),
            boxMM(-33, -0.05, -33, 33, 0.02, 33, 'swamp_water'),
            boxMM(-33, 0, 32.2, 33, 6.5, 33, 'bunker_stone'),
            boxMM(-33, 0, -33, 33, 6.5, -32.2, 'bunker_stone'),
            boxMM(-33, 0, -33, -32.2, 6.5, 33, 'bunker_stone'),
            boxMM(32.2, 0, -33, 33, 6.5, 33, 'bunker_stone'),
            // Raised wooden boardwalk walkways connecting Central Hut <-> 4 Outer Huts
            boxMM(-7.2, 0, -7.2, 7.2, 0.14, 7.2, 'wood_plank'),
            boxMM(-2.1, 0, -18.2, 2.1, 0.14, -7.0, 'wood_plank'),
            boxMM(-2.1, 0, 7.0, 2.1, 0.14, 18.2, 'wood_plank'),
            boxMM(7.0, 0, -2.1, 18.2, 0.14, 2.1, 'wood_plank'),
            boxMM(-18.2, 0, -2.1, -7.0, 0.14, 2.1, 'wood_plank'),
            // Central Hut 2F Loft (y: 3.0..3.2) w/ SE Stairwell Cutout (x: 2.0..5.8, z: 4.0..7.0)
            boxMM(-7.0, 3.0, -7.0, 7.0, 3.2, 4.0, 'wood_plank'),
            boxMM(-7.0, 3.0, 4.0, 2.0, 3.2, 7.0, 'wood_plank'),
            boxMM(5.8, 3.0, 4.0, 7.0, 3.2, 7.0, 'wood_plank'),
            // Central Hut Airtight 1F & 2F Stairwell Walls + Bulkhead Header
            boxMM(2.0, 0, 3.65, 6.7, 3.2, 4.05, 'wood_plank'),
            boxMM(-0.2, 3.0, 3.65, 5.2, 6.4, 4.05, 'wood_plank'),
            boxMM(1.8, 3.0, 4.0, 2.15, 6.4, 6.7, 'wood_plank'),
            boxMM(3.65, 4.6, 4.0, 4.35, 6.4, 6.7, 'wood_plank'),
            // Central Hut Walls (1F: 4 exit gates + 2 windows on North segments; 2F: 2 upstairs windows)
            boxMM(-7.0, 0, -7.3, -5.5, 3.2, -6.7, 'wood_plank'),
            ...wallWithWindowXAt(-7, 0, -5.5, -1.9, -5.0, -3.0, 3.2, 0.6, 'wood_plank'),
            boxMM(-1.9, 3.0, -7.3, 1.9, 3.2, -6.7, 'wood_plank'),
            ...wallWithWindowXAt(-7, 0, 1.9, 5.5, 3.0, 5.0, 3.2, 0.6, 'wood_plank'),
            boxMM(5.5, 0, -7.3, 7.0, 3.2, -6.7, 'wood_plank'),
            boxMM(-7.3, 3.2, -7.3, 7.3, 6.4, -6.7, 'wood_plank'),
            ...wallWithOpeningX(7, 0, 3.2, -7, 7, -1.9, 1.9, 3.0, 0.6, 'wood_plank'),
            ...wallWithWindowXAt(7, 3.2, -7, 7, -4.5, -2.5, 3.2, 0.6, 'wood_plank'),
            ...wallWithOpeningZ(7, 0, 3.2, -7, 7, -1.9, 1.9, 3.0, 0.6, 'wood_plank'),
            boxMM(6.7, 3.2, -7, 7.3, 6.4, 7, 'wood_plank'),
            ...wallWithOpeningZ(-7, 0, 3.2, -7, 7, -1.9, 1.9, 3.0, 0.6, 'wood_plank'),
            ...wallWithWindowZAt(-7, 3.2, -7, 7, -4.5, -2.5, 3.2, 0.6, 'wood_plank'),
            boxMM(-7.3, 6.4, -7.3, 7.3, 6.8, 7.3, 'dark_slate_roof'),
            // 4 Airtight Bamboo-Walled Swamp Quadrants (prevent wading around paid swamp gates!)
            // North Swamp Arm (path_n): narrow dock neck (-2.1..2.1) -> clearing (-5.5..5.5) -> Fishing Hut
            boxMM(-2.7, 0, -10.8, -2.1, 4.5, -7.0, 'bamboo_fence'),
            boxMM(2.1, 0, -10.8, 2.7, 4.5, -7.0, 'bamboo_fence'),
            boxMM(-5.8, 0, -10.8, -2.1, 4.5, -10.2, 'bamboo_fence'),
            boxMM(2.1, 0, -10.8, 5.8, 4.5, -10.2, 'bamboo_fence'),
            boxMM(-5.8, 0, -18.0, -5.2, 4.5, -10.2, 'bamboo_fence'),
            boxMM(5.2, 0, -18.0, 5.8, 4.5, -10.2, 'bamboo_fence'),
            // East Swamp Arm (path_e): narrow dock neck (-2.1..2.1) -> clearing (-5.5..5.8) -> Doctor's Quarters & Zipline
            boxMM(7.0, 0, -2.7, 10.8, 4.5, -2.1, 'bamboo_fence'),
            boxMM(7.0, 0, 2.1, 10.8, 4.5, 2.7, 'bamboo_fence'),
            boxMM(10.2, 0, -5.8, 10.8, 4.5, -2.1, 'bamboo_fence'),
            boxMM(10.2, 0, 2.1, 10.8, 4.5, 6.1, 'bamboo_fence'),
            boxMM(10.2, 0, -5.8, 18.0, 4.5, -5.2, 'bamboo_fence'),
            boxMM(10.2, 0, 5.5, 18.0, 4.5, 6.1, 'bamboo_fence'),
            // South Swamp Arm (path_s): narrow dock neck (-2.1..2.1) -> clearing (-5.5..5.5) -> Storage Hut
            boxMM(-2.7, 0, 7.0, -2.1, 4.5, 10.8, 'bamboo_fence'),
            boxMM(2.1, 0, 7.0, 2.7, 4.5, 10.8, 'bamboo_fence'),
            boxMM(-5.8, 0, 10.2, -2.1, 4.5, 10.8, 'bamboo_fence'),
            boxMM(2.1, 0, 10.2, 5.8, 4.5, 10.8, 'bamboo_fence'),
            boxMM(-5.8, 0, 10.2, -5.2, 4.5, 18.0, 'bamboo_fence'),
            boxMM(5.2, 0, 10.2, 5.8, 4.5, 18.0, 'bamboo_fence'),
            // West Swamp Arm (path_w): narrow dock neck (-2.1..2.1) -> clearing (-5.5..5.5) -> Comm Room
            boxMM(-10.8, 0, -2.7, -7.0, 4.5, -2.1, 'bamboo_fence'),
            boxMM(-10.8, 0, 2.1, -7.0, 4.5, 2.7, 'bamboo_fence'),
            boxMM(-10.8, 0, -5.8, -10.2, 4.5, -2.1, 'bamboo_fence'),
            boxMM(-10.8, 0, 2.1, -10.2, 4.5, 5.8, 'bamboo_fence'),
            boxMM(-18.0, 0, -5.8, -10.2, 4.5, -5.2, 'bamboo_fence'),
            boxMM(-18.0, 0, 5.2, -10.2, 4.5, 5.8, 'bamboo_fence'),
            // Outer Hut 1 — North Fishing Hut (x: -6.5..6.5, z: -29.5..-18.0) w/ 3 Windows
            boxMM(-6.6, 0, -29.6, 6.6, 0.16, -18.0, 'wood_plank'),
            ...wallWithOpeningX(-18.0, 0, 4.0, -6.5, 6.5, -2.0, 2.0, 3.0, 0.6, 'wood_plank'),
            ...wallWithWindowX(-29.5, -6.5, 6.5, -1.2, 1.2, 4.0, 0.6, 'wood_plank'),
            ...wallWithWindowZ(-6.5, -29.5, -18.0, -24.8, -22.4, 4.0, 0.6, 'wood_plank'),
            ...wallWithWindowZ(6.5, -29.5, -18.0, -24.8, -22.4, 4.0, 0.6, 'wood_plank'),
            boxMM(-6.8, 4.0, -29.8, 6.8, 4.4, -17.8, 'dark_slate_roof'),
            // Outer Hut 2 — East Doctor's Quarters (x: 18.0..29.5, z: -6.5..6.5) w/ 3 Windows
            boxMM(18.0, 0, -6.6, 29.6, 0.16, 6.6, 'wood_plank'),
            ...wallWithOpeningZ(18.0, 0, 4.0, -6.5, 6.5, -2.0, 2.0, 3.0, 0.6, 'wood_plank'),
            ...wallWithWindowZ(29.5, -6.5, 6.5, -1.2, 1.2, 4.0, 0.6, 'wood_plank'),
            ...wallWithWindowX(-6.5, 18.0, 29.5, 22.4, 24.8, 4.0, 0.6, 'wood_plank'),
            ...wallWithWindowX(6.5, 18.0, 29.5, 22.4, 24.8, 4.0, 0.6, 'wood_plank'),
            boxMM(17.8, 4.0, -6.8, 29.8, 4.4, 6.8, 'dark_slate_roof'),
            // Outer Hut 3 — South Storage Hut (x: -6.5..6.5, z: 18.0..29.5) w/ 3 Windows
            boxMM(-6.6, 0, 18.0, 6.6, 0.16, 29.6, 'wood_plank'),
            ...wallWithOpeningX(18.0, 0, 4.0, -6.5, 6.5, -2.0, 2.0, 3.0, 0.6, 'wood_plank'),
            ...wallWithWindowX(29.5, -6.5, 6.5, -1.2, 1.2, 4.0, 0.6, 'wood_plank'),
            ...wallWithWindowZ(-6.5, 18.0, 29.5, 22.4, 24.8, 4.0, 0.6, 'wood_plank'),
            ...wallWithWindowZ(6.5, 18.0, 29.5, 22.4, 24.8, 4.0, 0.6, 'wood_plank'),
            boxMM(-6.8, 4.0, 17.8, 6.8, 4.4, 29.8, 'dark_slate_roof'),
            // Outer Hut 4 — West Comm Room (x: -29.5..-18.0, z: -6.5..6.5) w/ 3 Windows
            boxMM(-29.6, 0, -6.6, -18.0, 0.16, 6.6, 'wood_plank'),
            ...wallWithOpeningZ(-18.0, 0, 4.0, -6.5, 6.5, -2.0, 2.0, 3.0, 0.6, 'wood_plank'),
            ...wallWithWindowZ(-29.5, -6.5, 6.5, -1.2, 1.2, 4.0, 0.6, 'wood_plank'),
            ...wallWithWindowX(-6.5, -29.5, -18.0, -24.8, -22.4, 4.0, 0.6, 'wood_plank'),
            ...wallWithWindowX(6.5, -29.5, -18.0, -24.8, -22.4, 4.0, 0.6, 'wood_plank'),
            boxMM(-29.8, 4.0, -6.8, -17.8, 4.4, 6.8, 'dark_slate_roof'),
            // Comm Room Desk holding Telephone + Interior Hut Crates
            boxMM(-28.4, 0.16, 3.5, -26.8, 1.0, 5.5, 'wood_crate'),
            boxMM(2.8, 0.16, 20.5, 5.2, 1.25, 22.0, 'wood_crate'),
            boxMM(-5.2, 0.16, -21.5, -3.5, 1.0, -19.8, 'wood_crate'),
            boxMM(25.2, 0.16, -5.5, 27.6, 0.9, -4.0, 'sandbag')
        ],
        lights: [
            { x: 0, y: 5.9, z: 1, color: 0xffb36b, intensity: 1.7, distance: 16, zone: 'spawn', alwaysOn: true },
            { x: 0, y: 2.7, z: -2, color: 0xff9d5c, intensity: 1.5, distance: 16, zone: 'central_down', alwaysOn: true },
            { x: 0, y: 3.6, z: -24, color: 0x4ade80, intensity: 1.6, distance: 16, zone: 'fishing', alwaysOn: true },
            { x: 24, y: 3.6, z: 0, color: 0x38bdf8, intensity: 1.6, distance: 16, zone: 'doctors', alwaysOn: true },
            { x: 0, y: 3.6, z: 24, color: 0xf59e0b, intensity: 1.6, distance: 16, zone: 'storage', alwaysOn: true },
            { x: -24, y: 3.6, z: 0, color: 0xc084fc, intensity: 1.8, distance: 16, zone: 'comm', alwaysOn: true }
        ],
        zones: ['spawn', 'central_down', 'path_n', 'fishing', 'path_e', 'doctors', 'path_s', 'storage', 'path_w', 'comm'],
        doors: [
            { id: 'snn_stairs_gate', fromZone: 'spawn', toZone: 'central_down', cost: 750, requiresPower: false, x: 4.0, y: 2.4, z: 5.35, w: 0.7, h: 4.4, d: 2.75, style: 'couch_debris', label: 'DOWNSTAIRS HUT DEBRIS' },
            { id: 'snn_gate_n', fromZone: 'central_down', toZone: 'path_n', cost: 1000, requiresPower: false, x: 0, y: 1.5, z: -7.0, w: 3.7, h: 3.0, d: 0.55, label: 'SWAMP GATE: FISHING HUT' },
            { id: 'snn_gate_e', fromZone: 'central_down', toZone: 'path_e', cost: 1000, requiresPower: false, x: 7.0, y: 1.5, z: 0, w: 0.55, h: 3.0, d: 3.7, label: "SWAMP GATE: DOCTOR'S QUARTERS" },
            { id: 'snn_gate_s', fromZone: 'central_down', toZone: 'path_s', cost: 1000, requiresPower: false, x: 0, y: 1.5, z: 7.0, w: 3.7, h: 3.0, d: 0.55, label: 'SWAMP GATE: STORAGE HUT' },
            { id: 'snn_gate_w', fromZone: 'central_down', toZone: 'path_w', cost: 1000, requiresPower: false, x: -7.0, y: 1.5, z: 0, w: 0.55, h: 3.0, d: 3.7, label: 'SWAMP GATE: COMM ROOM' },
            { id: 'snn_hut_n', fromZone: 'path_n', toZone: 'fishing', cost: 750, requiresPower: false, x: 0, y: 1.5, z: -18.0, w: 3.8, h: 3.0, d: 0.55, label: 'FISHING HUT DOOR' },
            { id: 'snn_hut_e', fromZone: 'path_e', toZone: 'doctors', cost: 750, requiresPower: false, x: 18.0, y: 1.5, z: 0, w: 0.55, h: 3.0, d: 3.8, label: "DOCTOR'S QUARTERS DOOR" },
            { id: 'snn_hut_s', fromZone: 'path_s', toZone: 'storage', cost: 750, requiresPower: false, x: 0, y: 1.5, z: 18.0, w: 3.8, h: 3.0, d: 0.55, label: 'STORAGE HUT DOOR' },
            { id: 'snn_hut_w', fromZone: 'path_w', toZone: 'comm', cost: 750, requiresPower: false, x: -18.0, y: 1.5, z: 0, w: 0.55, h: 3.0, d: 3.8, label: 'COMM ROOM DOOR' }
        ],
        windows: [
            // Central 2F (2) + Central 1F (2)
            { id: 'snn_w_c1', zone: 'spawn', x: -3.5, y: 3.2, z: 7.0, w: 2.0, axis: 'z', outside: [-3.5, 3.2, 8.5], inside: [-3.5, 3.2, 5.2], waypointId: 'snn_up' },
            { id: 'snn_w_c2', zone: 'spawn', x: -7.0, y: 3.2, z: -3.5, w: 2.0, axis: 'x', outside: [-8.5, 3.2, -3.5], inside: [-5.2, 3.2, -3.5], waypointId: 'snn_up' },
            { id: 'snn_w_c3', zone: 'central_down', x: -4.0, y: 0, z: -7.0, w: 2.0, axis: 'z', outside: [-4.0, 0, -8.5], inside: [-4.0, 0, -5.0], waypointId: 'snn_c' },
            { id: 'snn_w_c4', zone: 'central_down', x: 4.0, y: 0, z: -7.0, w: 2.0, axis: 'z', outside: [4.0, 0, -8.5], inside: [4.0, 0, -5.0], waypointId: 'snn_c' },
            // Fishing Hut (3)
            { id: 'snn_w_n1', zone: 'fishing', x: 0, y: 0, z: -29.5, w: 2.3, axis: 'z', outside: [0, 0, -31.2], inside: [0, 0, -27.2], waypointId: 'snn_n' },
            { id: 'snn_w_n2', zone: 'fishing', x: -6.5, y: 0, z: -23.6, w: 2.3, axis: 'x', outside: [-8.5, 0, -23.6], inside: [-4.5, 0, -23.6], waypointId: 'snn_n' },
            { id: 'snn_w_n3', zone: 'fishing', x: 6.5, y: 0, z: -23.6, w: 2.3, axis: 'x', outside: [8.5, 0, -23.6], inside: [4.5, 0, -23.6], waypointId: 'snn_n' },
            // Doctor's Quarters (3)
            { id: 'snn_w_e1', zone: 'doctors', x: 29.5, y: 0, z: 0, w: 2.3, axis: 'x', outside: [31.2, 0, 0], inside: [27.2, 0, 0], waypointId: 'snn_e' },
            { id: 'snn_w_e2', zone: 'doctors', x: 23.6, y: 0, z: -6.5, w: 2.3, axis: 'z', outside: [23.6, 0, -8.5], inside: [23.6, 0, -4.5], waypointId: 'snn_e' },
            { id: 'snn_w_e3', zone: 'doctors', x: 23.6, y: 0, z: 6.5, w: 2.3, axis: 'z', outside: [23.6, 0, 8.5], inside: [23.6, 0, 4.5], waypointId: 'snn_e' },
            // Storage Hut (3)
            { id: 'snn_w_s1', zone: 'storage', x: 0, y: 0, z: 29.5, w: 2.3, axis: 'z', outside: [0, 0, 31.2], inside: [0, 0, 27.2], waypointId: 'snn_s' },
            { id: 'snn_w_s2', zone: 'storage', x: -6.5, y: 0, z: 23.6, w: 2.3, axis: 'x', outside: [-8.5, 0, 23.6], inside: [-4.5, 0, 23.6], waypointId: 'snn_s' },
            { id: 'snn_w_s3', zone: 'storage', x: 6.5, y: 0, z: 23.6, w: 2.3, axis: 'x', outside: [8.5, 0, 23.6], inside: [4.5, 0, 23.6], waypointId: 'snn_s' },
            // Comm Room (3)
            { id: 'snn_w_w1', zone: 'comm', x: -29.5, y: 0, z: 0, w: 2.3, axis: 'x', outside: [-31.2, 0, 0], inside: [-27.2, 0, 0], waypointId: 'snn_w' },
            { id: 'snn_w_w2', zone: 'comm', x: -23.6, y: 0, z: -6.5, w: 2.3, axis: 'z', outside: [-23.6, 0, -8.5], inside: [-23.6, 0, -4.5], waypointId: 'snn_w' },
            { id: 'snn_w_w3', zone: 'comm', x: -23.6, y: 0, z: 6.5, w: 2.3, axis: 'z', outside: [-23.6, 0, 8.5], inside: [-23.6, 0, 4.5], waypointId: 'snn_w' }
        ],
        groundSpawners: [
            { zone: 'central_down', x: 4.5, y: 0.14, z: -4.5, waypointId: 'snn_c' },
            { zone: 'path_n', x: -4.2, y: 0, z: -14.0, waypointId: 'snn_pn' },
            { zone: 'path_n', x: 4.2, y: 0, z: -14.5, waypointId: 'snn_pn' },
            { zone: 'path_e', x: 14.0, y: 0, z: -4.2, waypointId: 'snn_pe' },
            { zone: 'path_e', x: 14.5, y: 0, z: 4.2, waypointId: 'snn_pe' },
            { zone: 'path_s', x: 4.2, y: 0, z: 14.0, waypointId: 'snn_ps' },
            { zone: 'path_s', x: -4.2, y: 0, z: 14.5, waypointId: 'snn_ps' },
            { zone: 'path_w', x: -14.0, y: 0, z: 4.2, waypointId: 'snn_pw' },
            { zone: 'path_w', x: -14.5, y: 0, z: -4.2, waypointId: 'snn_pw' },
            { zone: 'fishing', x: -4.2, y: 0.16, z: -26.5, waypointId: 'snn_n' },
            { zone: 'fishing', x: 4.2, y: 0.16, z: -21.0, waypointId: 'snn_n' },
            { zone: 'doctors', x: 26.5, y: 0.16, z: -2.0, waypointId: 'snn_e' },
            { zone: 'doctors', x: 21.0, y: 0.16, z: 4.2, waypointId: 'snn_e' },
            { zone: 'storage', x: -4.2, y: 0.16, z: 21.0, waypointId: 'snn_s' },
            { zone: 'storage', x: 4.2, y: 0.16, z: 26.5, waypointId: 'snn_s' },
            { zone: 'comm', x: -21.0, y: 0.16, z: -4.2, waypointId: 'snn_w' },
            { zone: 'comm', x: -24.5, y: 0.16, z: 4.2, waypointId: 'snn_w' }
        ],
        randomizePerks: true,
        perkSlots: [
            { x: -4.8, y: 0.16, z: -27.5, rotY: 0, zoneLabel: 'Fishing Hut' },
            { x: 27.5, y: 0.16, z: -4.8, rotY: -Math.PI * 0.5, zoneLabel: "Doctor's Quarters" },
            { x: 4.8, y: 0.16, z: 27.5, rotY: Math.PI, zoneLabel: 'Storage Hut' },
            { x: -27.5, y: 0.16, z: -4.8, rotY: Math.PI * 0.5, zoneLabel: 'Comm Room' }
        ],
        perks: [],
        traps: [
            { id: 'snn_flogger', kind: 'flogger', label: 'THE FLOGGER (CROUCH TO SURVIVE)', cost: 750, requiresPower: false, x: 0, y: 0.14, z: -12.5, radius: 3.0, switchX: 2.3, switchZ: -11.5, switchRotY: -Math.PI * 0.5, duration: 25, cooldown: 30 },
            { id: 'snn_electro_n', kind: 'electro_shock', label: 'FISHING HUT ELECTRO-SHOCK TRAP', cost: 1000, requiresPower: false, x: 0, y: 0.14, z: -18.0, axis: 'z', radius: 2.5, switchX: 2.5, switchZ: -18.6, switchRotY: 0, duration: 20, cooldown: 35 },
            { id: 'snn_electro_e', kind: 'electro_shock', label: "DOCTOR'S ELECTRO-SHOCK TRAP", cost: 1000, requiresPower: false, x: 18.0, y: 0.14, z: 0, axis: 'x', radius: 2.5, switchX: 18.6, switchZ: 2.5, switchRotY: -Math.PI * 0.5, duration: 20, cooldown: 35 },
            { id: 'snn_electro_s', kind: 'electro_shock', label: 'STORAGE ELECTRO-SHOCK TRAP', cost: 1000, requiresPower: false, x: 0, y: 0.14, z: 18.0, axis: 'z', radius: 2.5, switchX: -2.5, switchZ: 18.6, switchRotY: Math.PI, duration: 20, cooldown: 35 },
            { id: 'snn_electro_w', kind: 'electro_shock', label: 'COMM ROOM ELECTRO-SHOCK TRAP', cost: 1000, requiresPower: false, x: -18.0, y: 0.14, z: 0, axis: 'x', radius: 2.5, switchX: -18.6, switchZ: -2.5, switchRotY: Math.PI * 0.5, duration: 20, cooldown: 35 },
            { id: 'snn_zipline', kind: 'zipline', label: "DOCTOR'S QUARTERS ZIPLINE → CENTRAL HUT", cost: 1500, requiresPower: false, x: 17.5, y: 0.14, z: 4.5, switchX: 17.5, switchZ: 4.5, switchRotY: Math.PI * 0.5, destX: 2.0, destY: 3.2, destZ: 1.5, destZone: 'spawn', cooldown: 25 }
        ],
        telephones: [
            { id: 'snn_phone', x: -27.6, y: 1.05, z: 4.5 }
        ],
        wallBuys: [
            { weaponId: 'kar98k_irons', cost: 200, ammoCost: 100, x: -6.4, y: 4.7, z: 3.5, rotY: Math.PI * 0.5 },
            { weaponId: 'mk14', cost: 600, ammoCost: 300, x: 1.2, y: 4.7, z: 6.4, rotY: Math.PI },
            { weaponId: 'thompson_m1', cost: 1200, ammoCost: 600, x: -4.2, y: 1.5, z: 6.55, rotY: Math.PI },
            { weaponId: 'r870', cost: 1500, ammoCost: 750, x: -6.55, y: 1.5, z: 3.8, rotY: Math.PI * 0.5 },
            { weaponId: 'mp5', cost: 1000, ammoCost: 500, x: 4.5, y: 1.5, z: -29.05, rotY: 0 },
            { weaponId: 'm60e4_pig', cost: 1800, ammoCost: 900, x: 24.0, y: 1.5, z: 6.05, rotY: Math.PI },
            { weaponId: 'ump45', cost: 1000, ammoCost: 500, x: -4.5, y: 1.5, z: 29.05, rotY: Math.PI },
            { weaponId: 'galil_ar', cost: 1200, ammoCost: 600, x: -24.0, y: 1.5, z: -6.05, rotY: 0 }
        ],
        grenadeWalls: [
            { id: 'snn_nades', cost: 250, x: -6.55, y: 1.5, z: -4.2, rotY: Math.PI * 0.5 }
        ],
        armorWall: null,
        mysteryBoxPads: [
            { id: 'snn_box_c', x: -4.5, y: 0.14, z: -4.5, rotY: Math.PI * 0.25, zone: 'central_down' },
            { id: 'snn_box_n', x: 4.8, y: 0.16, z: -27.0, rotY: -Math.PI * 0.5, zone: 'fishing' },
            { id: 'snn_box_e', x: 27.0, y: 0.16, z: 4.8, rotY: Math.PI, zone: 'doctors' },
            { id: 'snn_box_s', x: -4.8, y: 0.16, z: 27.0, rotY: Math.PI * 0.5, zone: 'storage' },
            { id: 'snn_box_w', x: -27.0, y: 0.16, z: 2.0, rotY: 0, zone: 'comm' }
        ],
        powerSwitch: null,
        powerSigns: [],
        landmarks: [
            { kind: 'hanging_paratrooper', x: -1.8, y: 4.9, z: 0.5 },
            { kind: 'flogger', x: 0, y: 2.8, z: -12.5 }
        ],
        packAPunch: null,
        exfilPoint: { x: 0, y: 0, z: -12.5 },
        waypoints: [
            { id: 'snn_up', x: 0, y: 3.2, z: 2.0, zone: 'spawn', links: ['snn_c'] },
            { id: 'snn_c', x: 0, y: 0.14, z: -2.0, zone: 'central_down', links: ['snn_up', 'snn_pn', 'snn_pe', 'snn_ps', 'snn_pw'] },
            { id: 'snn_pn', x: 0, y: 0.14, z: -12.5, zone: 'path_n', links: ['snn_c', 'snn_n'] },
            { id: 'snn_n', x: 0, y: 0.16, z: -23.5, zone: 'fishing', links: ['snn_pn'] },
            { id: 'snn_pe', x: 12.5, y: 0.14, z: 0, zone: 'path_e', links: ['snn_c', 'snn_e'] },
            { id: 'snn_e', x: 23.5, y: 0.16, z: 0, zone: 'doctors', links: ['snn_pe'] },
            { id: 'snn_ps', x: 0, y: 0.14, z: 12.5, zone: 'path_s', links: ['snn_c', 'snn_s'] },
            { id: 'snn_s', x: 0, y: 0.16, z: 23.5, zone: 'storage', links: ['snn_ps'] },
            { id: 'snn_pw', x: -12.5, y: 0.14, z: 0, zone: 'path_w', links: ['snn_c', 'snn_w'] },
            { id: 'snn_w', x: -23.5, y: 0.16, z: 0, zone: 'comm', links: ['snn_pw'] }
        ]
    };

    /* ========================================================================
       7. DER RIESE (COD WaW / BO1 — 100% 1:1 Group 935 Giant Facility)
       1:1 Official Replica:
         - Mainframe Courtyard ('spawn'): Central Mainframe Link Pad, Caged
           Pack-a-Punch w/ retracting steel shutter & 3 Red->Green Indicator Bulbs,
           Quick Revive [500], Kar98k [200], Gewehr/FAL [600], 4 Spawn Windows,
           Left Animal Testing Door [750], Right Garage Door [750], & Center
           Suspended Power Bridge that lowers automatically on Power!
         - West Animal Testing Wing ('animal'): Double-Barrel [1200], MP40/MP5 [1000],
           Electro-Shock Trap [1000], Speed Cola [3000], Teleporter Z-A, 1,250 PTS Gate
         - East Garage & Furnace ('garage'): Military Truck & glowing Furnace,
           Thompson [1200], Electro-Shock Trap [1000], M1014 [1500], Double Tap [2000],
           Teleporter Z-B, 1,250 PTS Gate
         - North Power Courtyard ('power_ct'): Power Switch, Bowie Knife [3000],
           FG42/Galil [1500], Juggernog Alley [2500], Elevated Steel Catwalk (y=2.5m),
           Teleporter Z-C, STG-44/AK-47 [1200], Electro-Shock Trap [1000]
         - 1:1 Teleporter Link Quest: Activate Power -> step on Z-A, Z-B, Z-C -> 30s
           sprint to Mainframe Pad -> All 3 open Pack-a-Punch!
    ======================================================================== */
    const DER_RIESE = {
        id: 'der_riese',
        name: 'DER RIESE',
        mode: 'zombies',
        subtitle: 'COD World at War / BO1 (100% 1:1 Official Replica) • Group 935 Weapon Factory',
        description: '100% 1:1 Official Der Riese Layout: Link all 3 Teleporters (Z-A, Z-B, Z-C) to the Mainframe within 30s to retract the Pack-a-Punch steel cage, lower the Suspended Bridge with Power, and hold out on the iconic Steel Catwalk!',
        atmosphere: {
            skyTop: 0x050912, skyBottom: 0x101c30, fogColor: 0x0b1322, fogDensity: 0.017,
            sunColor: 0x93c5fd, sunIntensity: 0.98, sunPos: [25, 42, -20],
            hemiSky: 0x3b82f6, hemiGround: 0x0f172a, hemiIntensity: 0.68, moon: true
        },
        playerSpawn: { x: 0, y: 0, z: 12.0, yaw: 0 },
        ramps: [
            // Iconic Der Riese Steel Catwalk Stairs in North Power Courtyard (y: 0 -> 2.5)
            { x: 9.0, w: 2.6, z1: -10.5, z2: -16.0, y1: 0, y2: 2.5, axis: 'z', mat: 'diamond_plate' }
        ],
        boxes: [
            boxMM(-28, -0.6, -28, 28, 0, 24, 'concrete'),
            boxMM(-28, 0, 23.2, 28, 6.5, 24, 'brick'),
            boxMM(-28, 0, -28, 28, 6.5, -27.2, 'brick'),
            boxMM(-28, 0, -28, -27.2, 6.5, 24, 'brick'),
            boxMM(27.2, 0, -28, 28, 6.5, 24, 'brick'),
            // Mainframe Courtyard (x: -10..10, z: 6..22) — 4 Windows + PaP Alcove
            ...wallWithWindowX(22, -10, -1.5, -6.5, -4.1, 4.8, 0.7, 'brick'),
            boxMM(-1.6, 0, 21.65, 1.6, 4.8, 22.35, 'brick'),
            ...wallWithWindowX(22, 1.5, 10, 4.1, 6.5, 4.8, 0.7, 'brick'),
            ...wallWithWindowZ(-10, 15.5, 22, 17.5, 19.9, 4.8, 0.7, 'brick'),
            ...wallWithWindowZ(10, 15.5, 22, 17.5, 19.9, 4.8, 0.7, 'brick'),
            ...wallWithOpeningZ(-10, 0, 4.8, 6, 15.5, 11.4, 15.2, 3.2, 0.7, 'brick'),
            ...wallWithOpeningZ(10, 0, 4.8, 6, 15.5, 11.4, 15.2, 3.2, 0.7, 'brick'),
            ...wallWithOpeningX(6, 0, 4.8, -10, 10, -2.3, 2.3, 3.2, 0.7, 'brick'),
            // PaP Alcove Side Framing + Roof at Spawn South Wall
            boxMM(-1.6, 0, 19.5, -1.3, 3.4, 22.0, 'brick'),
            boxMM(1.3, 0, 19.5, 1.6, 3.4, 22.0, 'brick'),
            boxMM(-1.6, 3.2, 19.5, 1.6, 3.5, 22.0, 'brick'),
            // Elevated Steel Catwalk in North Courtyard (x: 5.5..12.5, z: -26.5..-16.0, y: 2.5)
            boxMM(5.5, 2.3, -26.5, 12.5, 2.5, -16.0, 'diamond_plate'),
            boxMM(5.3, 2.5, -26.5, 5.5, 3.4, -16.0, 'rusted_metal'),
            boxMM(12.3, 2.5, -26.5, 12.5, 3.4, -16.0, 'rusted_metal'),
            // West Animal Testing Wing (x: -26..-10, z: -12..15.5, FULL ROOF)
            ...wallWithWindowZ(-26, -12, 0, -6.0, -3.6, 4.8, 0.7, 'brick'),
            ...wallWithWindowZ(-26, 0, 15.5, 4.0, 6.4, 4.8, 0.7, 'brick'),
            boxMM(-26.35, 0, 15.15, -10, 4.8, 15.85, 'brick'),
            boxMM(-10.35, 0, -12.35, -9.65, 4.8, 6.35, 'brick'),
            ...wallWithOpeningX(-12, 0, 4.8, -26, -10, -19.5, -15.5, 3.2, 0.7, 'brick'),
            boxMM(-26.4, 4.8, -12.4, -9.6, 5.2, 15.9, 'dark_slate_roof'),
            // East Automobile Garage & Glowing Furnace (x: 10..26, z: -12..15.5, FULL ROOF)
            ...wallWithWindowZ(26, -12, 0, -6.0, -3.6, 4.8, 0.7, 'brick'),
            ...wallWithWindowZ(26, 0, 15.5, 4.0, 6.4, 4.8, 0.7, 'brick'),
            boxMM(10, 0, 15.15, 26.35, 4.8, 15.85, 'brick'),
            boxMM(9.65, 0, -12.35, 10.35, 4.8, 6.35, 'brick'),
            ...wallWithOpeningX(-12, 0, 4.8, 10, 26, 15.5, 19.5, 3.2, 0.7, 'brick'),
            boxMM(9.6, 4.8, -12.4, 26.4, 5.2, 15.9, 'dark_slate_roof'),
            boxMM(17.5, 0, -2.0, 22.0, 2.1, 4.0, 'container_olive'), // Military Truck inside Garage
            // North Power Courtyard Outer Seal Walls (x: ±26, z: -27.2..-12) + Power Transformer Wall + Z-C Canopy
            boxMM(-26.35, 0, -27.2, -25.65, 5.2, -12, 'brick'),
            boxMM(25.65, 0, -27.2, 26.35, 5.2, -12, 'brick'),
            boxMM(-4.2, 0, -18.9, 4.2, 3.8, -18.1, 'bunker_stone'),
            boxMM(-3.2, 4.2, -27.2, 3.2, 4.6, -22.5, 'diamond_plate')
        ],
        lights: [
            { x: 0, y: 4.5, z: 15.0, color: 0x38bdf8, intensity: 1.8, distance: 18, zone: 'spawn', alwaysOn: true },
            { x: -18, y: 4.2, z: 4.0, color: 0xf59e0b, intensity: 1.6, distance: 18, zone: 'animal', alwaysOn: true },
            { x: 24, y: 1.4, z: 12.0, baseY: 0, color: 0xf97316, intensity: 1.6, distance: 11, prop: 'fire_barrel', alwaysOn: true },
            { x: 18, y: 4.2, z: 4.0, color: 0xf97316, intensity: 1.6, distance: 18, zone: 'garage', alwaysOn: true },
            { x: 0, y: 5.0, z: -18.0, color: 0xc084fc, intensity: 2.0, distance: 22, zone: 'power_ct', alwaysOn: false }
        ],
        zones: ['spawn', 'animal', 'garage', 'power_ct'],
        doors: [
            { id: 'dr_door_w', fromZone: 'spawn', toZone: 'animal', cost: 750, requiresPower: false, x: -10.0, y: 1.6, z: 13.3, w: 0.6, h: 3.1, d: 3.8, label: 'ANIMAL TESTING DOOR' },
            { id: 'dr_door_e', fromZone: 'spawn', toZone: 'garage', cost: 750, requiresPower: false, x: 10.0, y: 1.6, z: 13.3, w: 0.6, h: 3.1, d: 3.8, label: 'AUTOMOBILE GARAGE DOOR' },
            { id: 'dr_door_nw', fromZone: 'animal', toZone: 'power_ct', cost: 1250, requiresPower: false, x: -17.5, y: 1.6, z: -12.0, w: 3.9, h: 3.1, d: 0.6, label: 'TELEPORTER Z-A & POWER COURTYARD' },
            { id: 'dr_door_ne', fromZone: 'garage', toZone: 'power_ct', cost: 1250, requiresPower: false, x: 17.5, y: 1.6, z: -12.0, w: 3.9, h: 3.1, d: 0.6, label: 'TELEPORTER Z-B & POWER COURTYARD' }
        ],
        windows: [
            { id: 'dr_w1', zone: 'spawn', x: -5.3, y: 0, z: 22.0, w: 2.3, axis: 'z', outside: [-5.3, 0, 23.6], inside: [-5.3, 0, 19.8], waypointId: 'dr_sp' },
            { id: 'dr_w2', zone: 'spawn', x: 5.3, y: 0, z: 22.0, w: 2.3, axis: 'z', outside: [5.3, 0, 23.6], inside: [5.3, 0, 19.8], waypointId: 'dr_sp' },
            { id: 'dr_w3', zone: 'spawn', x: -10.0, y: 0, z: 18.7, w: 2.3, axis: 'x', outside: [-12.0, 0, 18.7], inside: [-8.0, 0, 18.7], waypointId: 'dr_sp' },
            { id: 'dr_w4', zone: 'spawn', x: 10.0, y: 0, z: 18.7, w: 2.3, axis: 'x', outside: [12.0, 0, 18.7], inside: [8.0, 0, 18.7], waypointId: 'dr_sp' },
            { id: 'dr_w5', zone: 'animal', x: -26.0, y: 0, z: 5.2, w: 2.3, axis: 'x', outside: [-27.6, 0, 5.2], inside: [-23.8, 0, 5.2], waypointId: 'dr_an' },
            { id: 'dr_w6', zone: 'animal', x: -26.0, y: 0, z: -4.8, w: 2.3, axis: 'x', outside: [-27.6, 0, -4.8], inside: [-23.8, 0, -4.8], waypointId: 'dr_an' },
            { id: 'dr_w7', zone: 'garage', x: 26.0, y: 0, z: 5.2, w: 2.3, axis: 'x', outside: [27.6, 0, 5.2], inside: [23.8, 0, 5.2], waypointId: 'dr_ga' },
            { id: 'dr_w8', zone: 'garage', x: 26.0, y: 0, z: -4.8, w: 2.3, axis: 'x', outside: [27.6, 0, -4.8], inside: [23.8, 0, -4.8], waypointId: 'dr_ga' }
        ],
        groundSpawners: [
            { zone: 'spawn', x: -7.5, y: 0, z: 10.5, waypointId: 'dr_sp' },
            { zone: 'spawn', x: 7.5, y: 0, z: 10.5, waypointId: 'dr_sp' },
            { zone: 'animal', x: -22.5, y: 0, z: 11.5, waypointId: 'dr_an' },
            { zone: 'animal', x: -15.0, y: 0, z: -8.5, waypointId: 'dr_an' },
            { zone: 'animal', x: -22.5, y: 0, z: -1.0, waypointId: 'dr_an' },
            { zone: 'garage', x: 22.5, y: 0, z: 11.5, waypointId: 'dr_ga' },
            { zone: 'garage', x: 14.5, y: 0, z: -8.5, waypointId: 'dr_ga' },
            { zone: 'garage', x: 13.5, y: 0, z: 6.5, waypointId: 'dr_ga' },
            { zone: 'power_ct', x: -10.0, y: 0, z: -23.0, waypointId: 'dr_pw' },
            { zone: 'power_ct', x: 1.0, y: 0, z: -22.0, waypointId: 'dr_pw' },
            { zone: 'power_ct', x: -20.5, y: 0, z: -22.0, waypointId: 'dr_pw' },
            { zone: 'power_ct', x: 20.5, y: 0, z: -22.0, waypointId: 'dr_pw' },
            { zone: 'power_ct', x: -12.0, y: 0, z: -15.5, waypointId: 'dr_pw' },
            { zone: 'power_ct', x: 9.0, y: 2.5, z: -24.0, waypointId: 'dr_cat' }
        ],
        perks: [
            { id: 'quick_revive', name: 'Quick Revive', cost: 500, x: -7.5, y: 0, z: 18.5, rotY: Math.PI * 0.5, color: '#38bdf8', desc: 'Solo Self-Revive', requiresPower: false },
            { id: 'speed_cola', name: 'Speed Cola', cost: 3000, x: -11.2, y: 0, z: -4.0, rotY: -Math.PI * 0.5, color: '#22c55e', desc: '2x Reload (Animal Courtyard)', requiresPower: true },
            { id: 'double_tap', name: 'Double Tap 2.0', cost: 2000, x: 11.2, y: 0, z: -4.0, rotY: Math.PI * 0.5, color: '#f59e0b', desc: 'Double Bullets (Furnace Hall)', requiresPower: true },
            { id: 'juggernog', name: 'Juggernog', cost: 2500, x: 8.6, y: 0, z: -8.5, rotY: -Math.PI * 0.5, color: '#ef4444', desc: '250 Max HP (Juggernog Alley)', requiresPower: true }
        ],
        traps: [
            { id: 'dr_electro_w', kind: 'electro_shock', label: 'ANIMAL WING ELECTRO-SHOCK', cost: 1000, requiresPower: true, x: -18.0, y: 0, z: 2.0, axis: 'z', radius: 2.8, switchX: -10.45, switchZ: 2.0, switchRotY: -Math.PI * 0.5, duration: 20, cooldown: 35 },
            { id: 'dr_electro_e', kind: 'electro_shock', label: 'GARAGE WING ELECTRO-SHOCK', cost: 1000, requiresPower: true, x: 18.0, y: 0, z: 10.0, axis: 'z', radius: 2.8, switchX: 10.45, switchZ: 10.0, switchRotY: Math.PI * 0.5, duration: 20, cooldown: 35 },
            { id: 'dr_electro_n', kind: 'electro_shock', label: 'COURTYARD ELECTRO-SHOCK', cost: 1000, requiresPower: true, x: 0.0, y: 0, z: -10.5, axis: 'z', radius: 2.8, switchX: -9.55, switchZ: -9.5, switchRotY: Math.PI * 0.5, duration: 20, cooldown: 35 }
        ],
        wallBuys: [
            { weaponId: 'kar98k_irons', cost: 200, ammoCost: 100, x: 9.55, y: 1.5, z: 8.8, rotY: -Math.PI * 0.5 },
            { weaponId: 'fal_osw', cost: 600, ammoCost: 300, x: -9.55, y: 1.5, z: 8.8, rotY: Math.PI * 0.5 },
            { weaponId: 'double_barrel', cost: 1200, ammoCost: 600, x: -16.0, y: 1.5, z: 15.05, rotY: Math.PI },
            { weaponId: 'mp5', cost: 1000, ammoCost: 500, x: -12.8, y: 1.5, z: -11.55, rotY: 0 },
            { weaponId: 'thompson_m1', cost: 1200, ammoCost: 600, x: 18.0, y: 1.5, z: 15.05, rotY: Math.PI },
            { weaponId: 'm1014_cod4', cost: 1500, ammoCost: 750, x: 25.55, y: 1.5, z: -8.8, rotY: -Math.PI * 0.5 },
            { weaponId: 'ak47', cost: 1200, ammoCost: 600, x: 8.5, y: 3.9, z: -26.85, rotY: 0 }, // STG-44 on Catwalk!
            { weaponId: 'galil_ar', cost: 1500, ammoCost: 750, x: -6.0, y: 1.5, z: -26.85, rotY: 0 },
            { weaponId: 'combat_knife', cost: 3000, ammoCost: 1500, x: 2.4, y: 1.5, z: -18.0, rotY: 0 }
        ],
        grenadeWalls: [
            { id: 'dr_nades', cost: 250, x: -22.5, y: 1.5, z: -11.55, rotY: 0 }
        ],
        armorWall: null,
        mysteryBoxPads: [
            { id: 'dr_box_pw', x: -5.5, y: 0, z: -16.0, rotY: 0, zone: 'power_ct' },
            { id: 'dr_box_an', x: -21.0, y: 0, z: 13.2, rotY: Math.PI * 0.5, zone: 'animal' },
            { id: 'dr_box_ga', x: 22.0, y: 0, z: 13.2, rotY: -Math.PI * 0.5, zone: 'garage' }
        ],
        powerSwitch: { x: -2.4, y: 1.4, z: -18.0, rotY: 0 },
        powerSigns: [
            { x: -14.2, y: 1.32, z: -11.58, rotY: 0, dir: 'right' }
        ],
        wallWritings: [
            { text: 'Z-A', sub: 'TELEPORTER A', color: 'rgba(56, 189, 248, 0.78)', x: -22.5, y: 2.3, z: -11.5, rotY: 0, w: 1.4, h: 0.7 },
            { text: 'Z-B', sub: 'TELEPORTER B', color: 'rgba(56, 189, 248, 0.78)', x: 22.5, y: 2.3, z: -11.5, rotY: 0, w: 1.4, h: 0.7 },
            { text: 'Z-C', sub: 'TELEPORTER C', color: 'rgba(192, 132, 252, 0.82)', x: 0.0, y: 2.3, z: -26.7, rotY: 0, w: 1.4, h: 0.7 }
        ],
        landmarks: [
            { kind: 'der_riese_pap_cage', x: 0.0, y: 1.4, z: 19.6 },
            { kind: 'der_riese_bridge', x: 0.0, y: 0.08, z: 5.9, w: 4.5, d: 3.2 }
        ],
        linkPads: [
            { kind: 'mainframe_pad', id: 'dr_mainframe', x: 0.0, y: 0, z: 15.0, color: 0x22c55e }
        ],
        packAPunch: {
            x: 0.0, y: 0, z: 20.6, rotY: 0,
            locked: true,
            lockReason: 'LINK ALL 3 TELEPORTERS (Z-A, Z-B, Z-C) TO OPEN PACK-A-PUNCH'
        },
        teleporters: [
            { id: 'dr_tp_a', mode: 'der_riese_link', tpCode: 'Z-A', label: 'TELEPORTER Z-A → MAINFRAME', cost: 250, x: -22.5, y: 0, z: -8.5, destX: 0, destY: 0, destZ: 15.0, zoneRequired: 'spawn', color: 0x38bdf8 },
            { id: 'dr_tp_b', mode: 'der_riese_link', tpCode: 'Z-B', label: 'TELEPORTER Z-B → MAINFRAME', cost: 250, x: 22.5, y: 0, z: -8.5, destX: 0, destY: 0, destZ: 15.0, zoneRequired: 'spawn', color: 0x38bdf8 },
            { id: 'dr_tp_c', mode: 'der_riese_link', tpCode: 'Z-C', label: 'TELEPORTER Z-C → MAINFRAME', cost: 250, x: 0.0, y: 0, z: -24.5, destX: 0, destY: 0, destZ: 15.0, zoneRequired: 'spawn', color: 0xa855f7 }
        ],
        exfilPoint: { x: 0, y: 0, z: -8.0 },
        waypoints: [
            { id: 'dr_sp', x: 0, y: 0, z: 14, zone: 'spawn', links: ['dr_an', 'dr_ga', 'dr_pw'] },
            { id: 'dr_an', x: -18, y: 0, z: 2, zone: 'animal', links: ['dr_sp', 'dr_pw'] },
            { id: 'dr_ga', x: 13.8, y: 0, z: 4, zone: 'garage', links: ['dr_sp', 'dr_pw'] },
            { id: 'dr_pw', x: 0, y: 0, z: -16, zone: 'power_ct', links: ['dr_sp', 'dr_an', 'dr_ga', 'dr_cat'] },
            { id: 'dr_cat', x: 9.0, y: 2.5, z: -20, zone: 'power_ct', links: ['dr_pw'] }
        ]
    };

    /* ========================================================================
       8. KINO DER TOTEN (COD BO1 — 100% 1:1 Berlin Theater of the Damned)
       1:1 Official Replica:
         - Theater Lobby ('spawn'): Crimson diamond carpet, Grand Split Staircase,
           Lobby Link Pad, Quick Revive [500], M14 [500], Olympia [500], 4 Windows,
           Upper Right Door [750], Lower Left Door [750], Auto-Opening Lobby Power Doors
         - Right Path ('foyer'): Upper Foyer (PM63/MAC-10 [1000]), MP40/Speed Cola Hall
           (MP40/MP5 [1000], Stakeout/R870 [1500], Speed Cola [3000], Electro Trap [1000]),
           Dressing Room partition (MP5K/UMP45 [1000], Box Pad) -> Stage [1250]
         - Left Path ('alley'): Lower Hall (Fire Trap [1000], MPL/UMP45 [1000]),
           Rainy Alley (Double Tap [2000], AK-74u [1200], Box Pad) -> Stage [1250]
         - Main Stage & Auditorium ('stage'): Seating rows, Juggernog [2500] & Bowie Knife [3000]
           in Auditorium Nook, Red Velvet Curtains (closed until Power!), Stage Power Switch,
           M16 [1200], Auto-Turret Trap [1000], Stage Teleporter
         - Elevated Projection Booth ('booth', y=3.8m): 30-second countdown, Pack-a-Punch,
           Frag Grenades [250], projection window overlooking Auditorium!
    ======================================================================== */
    const KINO_DER_TOTEN = {
        id: 'kino_der_toten',
        name: 'KINO DER TOTEN',
        mode: 'zombies',
        subtitle: 'COD Black Ops 1 (100% 1:1 Official Replica) • Berlin Theater of the Damned',
        description: '100% 1:1 Official BO1 Layout: Theater Lobby & Grand Staircase, Foyer & Dressing Room, Rainy Alley & Fire Trap, Main Stage with Red Velvet Curtains & Auto-Turret, and Link-to-Booth 30s Projection Room Pack-a-Punch!',
        atmosphere: {
            skyTop: 0x09060c, skyBottom: 0x1e1328, fogColor: 0x120c18, fogDensity: 0.017,
            sunColor: 0xfbbf24, sunIntensity: 0.95, sunPos: [15, 38, -20],
            hemiSky: 0x7e22ce, hemiGround: 0x140f1a, hemiIntensity: 0.65, moon: true
        },
        playerSpawn: { x: 0, y: 0, z: 16.5, yaw: 0 },
        ramps: [
            // Grand Lobby Right Staircase up to Upper Right Balcony Landing (z: 16.5 -> 12.0, y: 0 -> 1.6)
            { x: 5.6, w: 2.6, z1: 16.5, z2: 12.0, y1: 0, y2: 1.6, axis: 'z', mat: 'theater_carpet' },
            // East Upper Foyer Descent Ramp down to MP40/Speed Cola Hall (x: 15.2 -> 19.6, y: 1.6 -> 0)
            { x1: 15.2, x2: 19.6, z: 11.8, w: 3.2, y1: 1.6, y2: 0, axis: 'x', mat: 'theater_carpet' },
            // Auditorium Stage Front Steps (z: -14.8 -> -16.2, y: 0 -> 0.45)
            { x: 0, w: 8.0, z1: -14.8, z2: -16.2, y1: 0, y2: 0.45, axis: 'z', mat: 'wood_plank' }
        ],
        boxes: [
            boxMM(-28, -0.6, -30, 28, 0, 24, 'theater_carpet'),
            boxMM(-26, -0.58, -12, -10, 0.02, 2, 'asphalt'), // Rainy Outdoor Alleyway ground
            boxMM(-28, 0, 23.2, 28, 8.0, 24, 'brick'),
            boxMM(-28, 0, -30, 28, 8.0, -29.2, 'brick'),
            boxMM(-28, 0, -30, -27.2, 8.0, 24, 'brick'),
            boxMM(27.2, 0, -30, 28, 8.0, 24, 'brick'),
            // 1. Theater Lobby ('spawn', x: -10..10, z: 8..22, FULL CEILING)
            ...wallWithWindowX(22, -10, 0, -6.2, -3.8, 6.2, 0.7, 'brick'),
            ...wallWithWindowX(22, 0, 10, 3.8, 6.2, 6.2, 0.7, 'brick'),
            ...wallWithWindowZ(-10, 15.6, 22, 17.5, 19.9, 6.2, 0.7, 'brick'),
            ...wallWithWindowZ(10, 15.6, 22, 17.5, 19.9, 6.2, 0.7, 'brick'),
            ...wallWithOpeningZ(-10, 0, 6.2, 8, 15.6, 10.2, 13.8, 3.2, 0.7, 'brick'),
            boxMM(9.65, 0, 8, 10.35, 1.6, 15.6, 'brick'),
            ...wallWithOpeningZ(10, 1.6, 6.2, 8, 15.6, 8.6, 11.8, 4.7, 0.7, 'brick'),
            ...wallWithOpeningX(8, 0, 6.2, -10, 10, -2.4, 2.4, 3.2, 0.7, 'brick'),
            boxMM(-10.4, 6.2, 8.0, 10.4, 6.6, 22.4, 'ceiling_plaster'),
            // Lobby Upper Landing + Balcony Parapet + Marble Pillars
            boxMM(3.4, 1.4, 8.35, 9.65, 1.6, 12.0, 'theater_carpet'),
            boxMM(3.4, 1.6, 8.35, 3.7, 2.55, 12.0, 'wood_plank'),
            boxMM(-4.2, 0, 13.0, -3.5, 6.2, 13.7, 'concrete'),
            boxMM(-6.8, 0, 11.2, -4.4, 1.05, 12.2, 'wood_plank'),
            // 2. East Upper Foyer & MP40 Hall ('foyer', x: 10..26, z: 0..15.6, FULL CEILING)
            boxMM(10, 0, 15.25, 26.35, 6.2, 15.95, 'brick'),
            boxMM(9.65, 0, -12.35, 10.35, 6.2, 8.35, 'brick'), // CRITICAL SEAL blocking Auditorium bypass!
            ...wallWithWindowZ(26, 0, 15.6, 7.2, 9.6, 6.2, 0.7, 'brick'),
            boxMM(10.35, 1.4, 8.35, 15.2, 1.6, 15.25, 'theater_carpet'),
            boxMM(10.35, 1.6, 8.35, 15.2, 2.5, 8.65, 'wood_plank'),
            ...wallWithOpeningX(0, 0, 6.2, 10, 26, 15.5, 19.5, 3.2, 0.7, 'brick'),
            boxMM(10.0, 6.2, -0.4, 26.4, 6.6, 16.0, 'ceiling_plaster'),
            // 3. Dressing Room ('dressing', x: 10..26, z: -12..0, FULL CEILING)
            ...wallWithWindowZ(26, -12, 0, -6.7, -4.3, 6.2, 0.7, 'brick'),
            ...wallWithOpeningX(-12, 0, 6.2, 10, 26, 15.5, 19.5, 3.2, 0.7, 'brick'),
            boxMM(11.0, 0, -8.0, 12.2, 1.0, -3.0, 'wood_crate'),
            boxMM(10.0, 6.2, -12.4, 26.4, 6.6, 0.4, 'ceiling_plaster'),
            // 4. East Stage Wing Connector ('stage', x: 10..26, z: -22..-12, FULL CEILING)
            boxMM(10, 0, -22.35, 26.35, 6.2, -21.65, 'brick'),
            boxMM(25.65, 0, -22.35, 26.35, 6.2, -12, 'brick'),
            ...wallWithOpeningZ(10, 0, 7.6, -22, -12, -19.2, -12.5, 5.2, 0.7, 'brick'),
            boxMM(10.0, 6.2, -22.4, 26.4, 6.6, -11.6, 'ceiling_plaster'),
            // 5. West Lower Hall / Fire Trap Room ('lower_hall', x: -26..-10, z: 2..15.6, FULL CEILING)
            boxMM(-26.35, 0, 15.25, -10, 6.2, 15.95, 'brick'),
            boxMM(-10.35, 0, -12.35, -9.65, 6.2, 8.35, 'brick'), // CRITICAL SEAL blocking Auditorium bypass!
            ...wallWithWindowZ(-26, 2, 15.6, 7.6, 10.0, 6.2, 0.7, 'brick'),
            ...wallWithOpeningX(2, 0, 6.2, -26, -10, -19.5, -15.5, 3.2, 0.7, 'brick'),
            boxMM(-26.4, 6.2, 1.6, -10.0, 6.6, 16.0, 'ceiling_plaster'),
            // 6. Rainy Outdoor Back Alley ('alley', x: -26..-10, z: -12..2 — OPEN NIGHT SKY!)
            ...wallWithWindowZ(-26, -12, 2, -6.2, -3.8, 6.2, 0.7, 'brick'),
            ...wallWithOpeningX(-12, 0, 6.2, -26, -10, -19.5, -15.5, 3.2, 0.7, 'brick'),
            boxMM(-12.5, 0, -9.0, -10.5, 1.25, -5.0, 'container_olive'),
            // 7. West Stage Wing Connector ('stage', x: -26..-10, z: -22..-12, FULL CEILING)
            boxMM(-26.35, 0, -22.35, -10, 6.2, -21.65, 'brick'),
            boxMM(-26.35, 0, -22.35, -25.65, 6.2, -12, 'brick'),
            ...wallWithOpeningZ(-10, 0, 7.6, -22, -12, -19.2, -12.5, 5.2, 0.7, 'brick'),
            boxMM(-26.4, 6.2, -22.4, -10.0, 6.6, -11.6, 'ceiling_plaster'),
            // 8. Main Theater Auditorium & Stage ('stage', x: -10..10, z: -28..8, FULL GRAND CEILING)
            boxMM(-10.35, 0, -28.35, -9.65, 7.6, -22, 'brick'),
            boxMM(9.65, 0, -28.35, 10.35, 7.6, -22, 'brick'),
            ...wallWithWindowX(-28, -10, 0, -7.2, -4.8, 7.6, 0.7, 'brick'),
            ...wallWithWindowX(-28, 0, 10, 4.8, 7.2, 7.6, 0.7, 'brick'),
            boxMM(-10.4, 7.6, -28.4, 10.4, 8.0, 8.4, 'ceiling_plaster'),
            // Auditorium Crimson Velvet Seat Rows + Raised Stage Platform + Proscenium Arch
            boxMM(-7.0, 0, -2.0, -2.5, 0.9, -0.5, 'velvet_red'),
            boxMM(2.5, 0, -2.0, 7.0, 0.9, -0.5, 'velvet_red'),
            boxMM(-7.0, 0, -7.5, -2.5, 0.9, -6.0, 'velvet_red'),
            boxMM(2.5, 0, -7.5, 7.0, 0.9, -6.0, 'velvet_red'),
            boxMM(-10.0, 0, -28.0, 10.0, 0.45, -16.2, 'wood_plank'),
            boxMM(-10.0, 0.45, -20.85, -6.8, 7.6, -20.15, 'brick'),
            boxMM(6.8, 0.45, -20.85, 10.0, 7.6, -20.15, 'brick'),
            boxMM(-6.8, 5.4, -20.85, 6.8, 7.6, -20.15, 'brick'),
            // Elevated Enclosed Projection Booth overlooking Auditorium (x: -5.5..5.5, z: 1.5..7.5, y: 3.6..3.8)
            boxMM(-5.5, 3.6, 1.5, 5.5, 3.8, 7.5, 'concrete'),
            boxMM(-5.5, 3.8, 1.5, 5.5, 4.75, 1.85, 'lab_panel'), // Projection window ledge
            boxMM(-5.5, 5.55, 1.5, 5.5, 7.0, 1.85, 'lab_panel'), // Upper projection viewport header (eye-level 4.75..5.55 view!)
            boxMM(-1.9, 4.75, 1.5, -1.7, 5.55, 1.85, 'rusted_metal'),
            boxMM(1.7, 4.75, 1.5, 1.9, 5.55, 1.85, 'rusted_metal'),
            boxMM(-5.5, 3.8, 1.5, -5.1, 7.0, 7.5, 'brick'),
            boxMM(5.1, 3.8, 1.5, 5.5, 7.0, 7.5, 'brick'),
            boxMM(-5.5, 3.8, 7.1, 5.5, 7.0, 7.5, 'brick'),
            boxMM(-5.5, 7.0, 1.5, 5.5, 7.4, 7.5, 'ceiling_plaster')
        ],
        lights: [
            { x: 0, y: 5.9, z: 15.5, color: 0xfbbf24, intensity: 1.7, distance: 18, zone: 'spawn', alwaysOn: true },
            { x: 18, y: 5.9, z: 6.0, color: 0xf59e0b, intensity: 1.5, distance: 18, zone: 'foyer', alwaysOn: true },
            { x: 18, y: 5.9, z: -6.0, color: 0xf59e0b, intensity: 1.4, distance: 16, zone: 'dressing', alwaysOn: true },
            { x: -18, y: 5.9, z: 8.5, color: 0x38bdf8, intensity: 1.5, distance: 18, zone: 'lower_hall', alwaysOn: true },
            { x: -18, y: 5.0, z: -5.0, color: 0x38bdf8, intensity: 1.3, distance: 16, zone: 'alley', alwaysOn: true },
            { x: 0, y: 7.2, z: -18.0, color: 0xc084fc, intensity: 2.2, distance: 26, zone: 'stage', alwaysOn: false },
            { x: 0, y: 6.6, z: 4.5, color: 0xa855f7, intensity: 1.9, distance: 14, zone: 'booth', alwaysOn: true }
        ],
        zones: ['spawn', 'foyer', 'dressing', 'lower_hall', 'alley', 'stage', 'booth'],
        doors: [
            { id: 'kino_upper_r', fromZone: 'spawn', toZone: 'foyer', cost: 750, requiresPower: false, x: 10.0, y: 3.15, z: 10.2, w: 0.65, h: 3.1, d: 3.2, label: 'UPPER RIGHT FOYER DOOR' },
            { id: 'kino_lower_l', fromZone: 'spawn', toZone: 'lower_hall', cost: 750, requiresPower: false, x: -10.0, y: 1.6, z: 12.0, w: 0.6, h: 3.1, d: 3.55, label: 'LOWER LEFT ALLEY DOOR' },
            { id: 'kino_foyer_dress', fromZone: 'foyer', toZone: 'dressing', cost: 1000, requiresPower: false, x: 17.5, y: 1.6, z: 0.0, w: 3.9, h: 3.1, d: 0.6, label: 'MP40 HALL → DRESSING ROOM' },
            { id: 'kino_alley_mid', fromZone: 'lower_hall', toZone: 'alley', cost: 1000, requiresPower: false, x: -17.5, y: 1.6, z: 2.0, w: 3.9, h: 3.1, d: 0.6, label: 'LOWER HALL → RAINY ALLEY' },
            { id: 'kino_dress_stage', fromZone: 'dressing', toZone: 'stage', cost: 1250, requiresPower: false, x: 17.5, y: 1.6, z: -12.0, w: 3.9, h: 3.1, d: 0.6, label: 'DRESSING ROOM → STAGE' },
            { id: 'kino_alley_stage', fromZone: 'alley', toZone: 'stage', cost: 1250, requiresPower: false, x: -17.5, y: 1.6, z: -12.0, w: 3.9, h: 3.1, d: 0.6, label: 'ALLEY → STAGE' },
            { id: 'kino_curtain_door', fromZone: 'spawn', toZone: 'stage', cost: 0, requiresPower: true, autoOpenOnPower: true, x: 0, y: 1.6, z: 8.0, w: 4.75, h: 3.2, d: 0.65, label: 'LOBBY AUDITORIUM POWER DOORS' }
        ],
        windows: [
            { id: 'k_w1', zone: 'spawn', x: -5.0, y: 0, z: 22.0, w: 2.3, axis: 'z', outside: [-5.0, 0, 23.2], inside: [-5.0, 0, 19.8], waypointId: 'k_sp' },
            { id: 'k_w2', zone: 'spawn', x: 5.0, y: 0, z: 22.0, w: 2.3, axis: 'z', outside: [5.0, 0, 23.2], inside: [5.0, 0, 19.8], waypointId: 'k_sp' },
            { id: 'k_w3', zone: 'spawn', x: -10.0, y: 0, z: 18.7, w: 2.3, axis: 'x', outside: [-12.0, 0, 18.7], inside: [-8.0, 0, 18.7], waypointId: 'k_sp' },
            { id: 'k_w4', zone: 'spawn', x: 10.0, y: 0, z: 18.7, w: 2.3, axis: 'x', outside: [12.0, 0, 18.7], inside: [8.0, 0, 18.7], waypointId: 'k_sp' },
            { id: 'k_w5', zone: 'foyer', x: 26.0, y: 0, z: 8.4, w: 2.3, axis: 'x', outside: [27.0, 0, 8.4], inside: [23.8, 0, 8.4], waypointId: 'k_fo' },
            { id: 'k_w6', zone: 'dressing', x: 26.0, y: 0, z: -5.5, w: 2.3, axis: 'x', outside: [27.0, 0, -5.5], inside: [23.8, 0, -5.5], waypointId: 'k_dr' },
            { id: 'k_w7', zone: 'lower_hall', x: -26.0, y: 0, z: 8.8, w: 2.3, axis: 'x', outside: [-27.0, 0, 8.8], inside: [-23.8, 0, 8.8], waypointId: 'k_lh' },
            { id: 'k_w8', zone: 'alley', x: -26.0, y: 0, z: -5.0, w: 2.3, axis: 'x', outside: [-27.0, 0, -5.0], inside: [-23.8, 0, -5.0], waypointId: 'k_al' },
            { id: 'k_w9', zone: 'stage', requiresPower: true, x: -6.0, y: 0.45, z: -28.0, w: 2.3, axis: 'z', outside: [-6.0, 0, -29.0], inside: [-6.0, 0.45, -26.0], waypointId: 'k_st' },
            { id: 'k_w10', zone: 'stage', requiresPower: true, x: 6.0, y: 0.45, z: -28.0, w: 2.3, axis: 'z', outside: [6.0, 0, -29.0], inside: [6.0, 0.45, -26.0], waypointId: 'k_st' }
        ],
        groundSpawners: [
            { zone: 'foyer', x: 21.5, y: 0, z: 11.5, waypointId: 'k_fo' },
            { zone: 'foyer', x: 14.5, y: 0, z: 3.5, waypointId: 'k_fo' },
            { zone: 'dressing', x: 21.5, y: 0, z: -9.0, waypointId: 'k_dr' },
            { zone: 'dressing', x: 15.0, y: 0, z: -5.5, waypointId: 'k_dr' },
            { zone: 'lower_hall', x: -21.5, y: 0, z: 12.0, waypointId: 'k_lh' },
            { zone: 'lower_hall', x: -14.5, y: 0, z: 5.5, waypointId: 'k_lh' },
            { zone: 'alley', x: -21.5, y: 0, z: -9.0, waypointId: 'k_al' },
            { zone: 'alley', x: -16.5, y: 0, z: -2.5, waypointId: 'k_al' },
            { zone: 'stage', x: -18.0, y: 0, z: -17.0, waypointId: 'k_st_w' },
            { zone: 'stage', x: 18.0, y: 0, z: -17.0, waypointId: 'k_st_e' },
            { zone: 'stage', x: -8.2, y: 0, z: -4.0, waypointId: 'k_st' },
            { zone: 'stage', x: 8.2, y: 0, z: -4.0, waypointId: 'k_st' },
            { zone: 'stage', x: 0.0, y: 0.45, z: -23.5, waypointId: 'k_st' },
            { zone: 'stage', x: -6.5, y: 0.45, z: -24.5, waypointId: 'k_st' }
        ],
        perks: [
            { id: 'quick_revive', name: 'Quick Revive', cost: 500, x: -8.4, y: 0, z: 18.0, rotY: Math.PI * 0.5, color: '#38bdf8', desc: 'Solo Self-Revive (Lobby Bar)', requiresPower: false },
            { id: 'speed_cola', name: 'Speed Cola', cost: 3000, x: 24.2, y: 0, z: 13.5, rotY: -Math.PI * 0.5, color: '#22c55e', desc: '2x Reload (MP40 Foyer Hall)', requiresPower: true },
            { id: 'double_tap', name: 'Double Tap 2.0', cost: 2000, x: -24.2, y: 0, z: -8.5, rotY: Math.PI * 0.5, color: '#f59e0b', desc: 'Double Bullets (Rainy Alleyway)', requiresPower: true },
            { id: 'juggernog', name: 'Juggernog', cost: 2500, x: 8.6, y: 0, z: 4.5, rotY: -Math.PI * 0.5, color: '#ef4444', desc: '250 Max HP (Auditorium Alcove)', requiresPower: true }
        ],
        traps: [
            { id: 'kino_fire_trap', kind: 'fire_trap', label: 'LOWER HALL FIRE TRAP', cost: 1000, requiresPower: true, x: -17.5, y: 0, z: 2.0, axis: 'z', radius: 2.8, switchX: -10.45, switchZ: 3.8, switchRotY: -Math.PI * 0.5, duration: 20, cooldown: 35 },
            { id: 'kino_electro_foyer', kind: 'electro_shock', label: 'FOYER ELECTRO-SHOCK TRAP', cost: 1000, requiresPower: true, x: 17.5, y: 0, z: 0.0, axis: 'z', radius: 2.8, switchX: 10.45, switchZ: 2.2, switchRotY: Math.PI * 0.5, duration: 20, cooldown: 35 },
            { id: 'kino_stage_turret', kind: 'auto_turret', label: 'STAGE AUTO-TURRET TRAP', cost: 1000, requiresPower: true, x: -5.5, y: 0.45, z: -17.0, radius: 18.0, switchX: -7.2, switchZ: -20.05, switchRotY: 0, duration: 25, cooldown: 40 }
        ],
        wallBuys: [
            { weaponId: 'double_barrel', cost: 500, ammoCost: 250, x: -4.5, y: 1.5, z: 21.55, rotY: Math.PI },
            { weaponId: 'mk14', cost: 500, ammoCost: 250, x: 6.0, y: 3.1, z: 8.45, rotY: 0 },
            { weaponId: 'mac10_uzi', cost: 1000, ammoCost: 500, x: 13.0, y: 3.1, z: 15.15, rotY: Math.PI },
            { weaponId: 'mp5', cost: 1000, ammoCost: 500, x: 25.55, y: 1.5, z: 3.8, rotY: -Math.PI * 0.5 },
            { weaponId: 'r870', cost: 1500, ammoCost: 750, x: 25.55, y: 1.5, z: -9.2, rotY: -Math.PI * 0.5 },
            { weaponId: 'ump45', cost: 1000, ammoCost: 500, x: -14.5, y: 1.5, z: 15.15, rotY: Math.PI },
            { weaponId: 'aks74u', cost: 1200, ammoCost: 600, x: -25.55, y: 1.5, z: -9.2, rotY: Math.PI * 0.5 },
            { weaponId: 'm16a4', cost: 1200, ammoCost: 600, x: 8.5, y: 1.9, z: -27.55, rotY: 0 },
            { weaponId: 'combat_knife', cost: 3000, ammoCost: 1500, x: 6.0, y: 1.5, z: 7.55, rotY: Math.PI }
        ],
        grenadeWalls: [
            { id: 'kino_booth_nades', cost: 250, x: -3.5, y: 5.2, z: 6.95, rotY: 0 }
        ],
        armorWall: null,
        mysteryBoxPads: [
            { id: 'k_box_stage', x: 7.8, y: 0.45, z: -18.0, rotY: -Math.PI * 0.5, zone: 'stage' },
            { id: 'k_box_foyer', x: 21.0, y: 0, z: -6.0, rotY: -Math.PI * 0.5, zone: 'dressing' },
            { id: 'k_box_alley', x: -21.0, y: 0, z: 12.2, rotY: Math.PI, zone: 'lower_hall' }
        ],
        powerSwitch: { x: -8.4, y: 1.9, z: -20.05, rotY: 0 },
        powerSigns: [
            { x: 14.2, y: 1.32, z: -11.58, rotY: 0, dir: 'left' }
        ],
        wallWritings: [
            { text: 'KINO DER TOTEN', sub: 'PROJECTION BOOTH', color: 'rgba(251, 191, 36, 0.80)', x: 0, y: 4.1, z: 8.40, rotY: 0, w: 2.4, h: 0.85 }
        ],
        landmarks: [
            { kind: 'stage_curtains', x: 0, y: 0.45, z: -20.5 }
        ],
        linkPads: [
            { kind: 'kino_link_pad', id: 'kino_lobby_link', x: 0, y: 0, z: 17.5, color: 0x38bdf8 }
        ],
        packAPunch: { x: 0.0, y: 3.8, z: 6.2, rotY: 0 },
        teleporters: [
            { id: 'kino_stage_tp', mode: 'kino_stage', label: 'STAGE TELEPORTER → PROJECTION BOOTH', cost: 0, x: 0, y: 0.45, z: -24.5, destX: 0, destY: 3.8, destZ: 3.6, zoneRequired: 'booth', color: 0xa855f7 },
            { id: 'kino_booth_ret', mode: 'kino_booth_return', label: 'RETURN TELEPORTER → LOBBY', cost: 0, x: 3.6, y: 3.8, z: 4.5, destX: 0, destY: 0, destZ: 16.5, zoneRequired: 'spawn', color: 0x38bdf8, requiresPower: false }
        ],
        exfilPoint: { x: 0, y: 0, z: -4.0 },
        waypoints: [
            { id: 'k_sp', x: 0, y: 0, z: 15, zone: 'spawn', links: ['k_fo', 'k_lh', 'k_st'] },
            { id: 'k_fo', x: 18, y: 0, z: 6, zone: 'foyer', links: ['k_sp', 'k_dr'] },
            { id: 'k_dr', x: 18, y: 0, z: -6, zone: 'dressing', links: ['k_fo', 'k_st_e'] },
            { id: 'k_lh', x: -18, y: 0, z: 8, zone: 'lower_hall', links: ['k_sp', 'k_al'] },
            { id: 'k_al', x: -18, y: 0, z: -5, zone: 'alley', links: ['k_lh', 'k_st_w'] },
            { id: 'k_st', x: 0, y: 0.45, z: -18, zone: 'stage', links: ['k_sp', 'k_st_w', 'k_st_e', 'k_bo'] },
            { id: 'k_st_w', x: -18, y: 0, z: -17, zone: 'stage', links: ['k_al', 'k_st'] },
            { id: 'k_st_e', x: 18, y: 0, z: -17, zone: 'stage', links: ['k_dr', 'k_st'] },
            { id: 'k_bo', x: 0, y: 3.8, z: 4.5, zone: 'booth', links: ['k_st', 'k_sp'] }
        ]
    };

    /* ========================================================================
       9. "FIVE" (COD BO1 — 100% 1:1 The Pentagon: 3 True Vertical Floors!)
       1:1 Official Replica:
         - Floor 1 ('spawn', y = 12.0m): Presidential Briefing Room & Outer Hallway
           (Mahogany Table, Quick Revive [500], M14 [500], Olympia [500], 4 glass windows,
           Hallway Debris [750], Speed Cola [3000], MPL/UMP45 [1000], & Rideable
           Passenger Elevator [250 PTS] down to Floor 2!).
         - Floor 2 ('war_room', y = 6.0m / Catwalk y = 7.4m): Octagonal DEFCON War Room
           (Twin Catwalk Ramps, Situation Map Table, 4 Interactive Red DEFCON Switches,
           Juggernog [2500], Double Tap [2000], MP5K [1000], Stakeout [1500], M16 [1200],
           Cargo Gate [1000] -> Rideable Cargo Elevator [250 PTS] down to Floor 3, &
           Central War Room Teleporter into Sealed DEFCON 5 Panic Room Pack-a-Punch!).
         - Floor 3 ('labs', y = 0.0m): Underground Weapons Labs, Morgue, Pig Room,
           Bowie Knife [3000], AK-74u [1200], Electro-Shock Trap [1000], Main Power
           Switch, Basement Return Teleporter, & THE PENTAGON THIEF!
    ======================================================================== */
    const FIVE_PENTAGON = {
        id: 'five_pentagon',
        name: '"FIVE" (THE PENTAGON)',
        mode: 'zombies',
        subtitle: 'COD Black Ops 1 (100% 1:1 Official 3-Floor Replica) • The Pentagon',
        description: '100% 1:1 Official 3-Story BO1 Replica: Ride the working Passenger & Cargo Elevators between 1F Presidential Conference Room (y=12m), 2F DEFCON War Room Catwalk (y=6m), & 3F Basement Power Labs (y=0m) — flip all 4 DEFCON Switches for the Panic Room Pack-a-Punch & survive the Pentagon Thief!',
        atmosphere: {
            skyTop: 0x050b14, skyBottom: 0x0f1f36, fogColor: 0x07111f, fogDensity: 0.015,
            sunColor: 0xbae6fd, sunIntensity: 0.90, sunPos: [0, 48, 0],
            hemiSky: 0x38bdf8, hemiGround: 0x0f172a, hemiIntensity: 0.65, moon: false
        },
        playerSpawn: { x: 0, y: 12.0, z: 18.2, yaw: 0 },
        ramps: [
            // Floor 2 DEFCON War Room Left & Right Staircases (y: 7.4 -> 6.0)
            { x: -9.5, w: 2.2, z1: 6.5, z2: 1.0, y1: 7.4, y2: 6.0, axis: 'z', mat: 'diamond_plate' },
            { x: 9.5, w: 2.2, z1: 6.5, z2: 1.0, y1: 7.4, y2: 6.0, axis: 'z', mat: 'diamond_plate' }
        ],
        boxes: [
            // --- FLOOR 3 (y=0.0): Underground Labs, Morgue, Pig Room & Power Room ---
            boxMM(-24, -0.6, -28, 24, 0, 14, 'concrete'),
            boxMM(-24, 0, -28, 24, 5.4, -27.2, 'lab_panel'),
            boxMM(-24, 0, 13.2, 24, 5.4, 14, 'lab_panel'),
            ...wallWithWindowZ(-24, -28, 14, -18.2, -15.8, 5.4, 0.7, 'lab_panel'),
            ...wallWithWindowZ(24, -28, 14, -18.2, -15.8, 5.4, 0.7, 'lab_panel'),
            // Lab inner dividing blocks, Morgue tables & Pig Room chambers
            boxMM(-7.0, 0, -20.0, -3.5, 4.0, -14.5, 'lab_panel'),
            boxMM(3.5, 0, -20.0, 7.0, 4.0, -14.5, 'lab_panel'),
            boxMM(-19.5, 0, -24.0, -16.5, 1.0, -22.5, 'lab_panel'),
            boxMM(16.5, 0, -24.0, 19.5, 1.0, -22.5, 'lab_panel'),
            boxMM(-14.0, 0, -4.0, -11.5, 4.2, -1.5, 'lab_panel'),
            boxMM(11.5, 0, -4.0, 14.0, 4.2, -1.5, 'lab_panel'),

            // --- FLOOR 2 (y=6.0): DEFCON War Room Slab w/ Cargo Shaft Cutout (-13.8..-10.2, -12.2..-8.8) ---
            boxMM(-24, 5.65, -28, 24, 6.0, -12.2, 'lab_panel'),
            boxMM(-24, 5.65, -8.8, 24, 6.0, 14.0, 'lab_panel'),
            boxMM(-24, 5.65, -12.2, -13.8, 6.0, -8.8, 'lab_panel'),
            boxMM(-10.2, 5.65, -12.2, 24, 6.0, -8.8, 'lab_panel'),
            // Floor 2 Outer Perimeter Walls (y: 6.0..11.4) + 2 Windows + Panic Corridor
            boxMM(-18, 6.0, 11.4, 18, 11.4, 12.1, 'lab_panel'),
            ...wallWithOpeningX(-12.8, 6.0, 11.4, -18, 18, -1.9, 1.9, 9.2, 0.7, 'lab_panel'),
            boxMM(-2.2, 6.0, -15.0, -1.9, 11.4, -12.8, 'lab_panel'),
            boxMM(1.9, 6.0, -15.0, 2.2, 11.4, -12.8, 'lab_panel'),
            ...wallWithWindowZAt(-18, 6.0, -13.2, 12.0, -2.2, 0.2, 5.4, 0.7, 'lab_panel'),
            ...wallWithWindowZAt(18, 6.0, -13.2, 12.0, -2.2, 0.2, 5.4, 0.7, 'lab_panel'),
            // Floor 2 Full Pentagon Ceiling (y: 11.4..11.8) w/ Passenger Shaft Cutout (9.8..13.2, -3.2..0.2)
            boxMM(-18.4, 11.4, -25.2, 18.4, 11.8, -3.2, 'ceiling_plaster'),
            boxMM(-18.4, 11.4, 0.2, 18.4, 11.8, 12.2, 'ceiling_plaster'),
            boxMM(-18.4, 11.4, -3.2, 9.8, 11.8, 0.2, 'ceiling_plaster'),
            boxMM(13.2, 11.4, -3.2, 18.4, 11.8, 0.2, 'ceiling_plaster'),
            // War Room Upper Catwalk (flush to South Wall & Ramps) + Handrail + Central Map Table
            boxMM(-11.0, 7.15, 6.5, 11.0, 7.4, 11.4, 'diamond_plate'),
            boxMM(-8.2, 7.15, 5.2, 8.2, 7.4, 6.5, 'diamond_plate'),
            boxMM(-8.2, 7.4, 5.2, 8.2, 8.35, 5.45, 'rusted_metal'),
            boxMM(-3.2, 6.0, -3.2, 3.2, 7.15, 1.2, 'lab_panel'),
            // Cargo Elevator Shaft Walls (West, South, East — open North +Z toward War Room & Labs!)
            boxMM(-14.2, 0.0, -12.5, -13.8, 11.4, -8.8, 'diamond_plate'),
            boxMM(-10.2, 0.0, -12.5, -9.8, 11.4, -8.8, 'diamond_plate'),
            boxMM(-14.2, 0.0, -12.6, -9.8, 11.4, -12.2, 'diamond_plate'),
            // Sealed Panic Room behind War Room (x: -5.2..5.2, z: -24.5..-15.0, y: 6.0..11.4)
            boxMM(-5.2, 6.0, -24.8, 5.2, 11.4, -24.2, 'lab_panel'),
            boxMM(-5.5, 6.0, -24.8, -5.0, 11.4, -14.8, 'lab_panel'),
            boxMM(5.0, 6.0, -24.8, 5.5, 11.4, -14.8, 'lab_panel'),
            ...wallWithOpeningX(-15.0, 6.0, 11.4, -5.2, 5.2, -1.9, 1.9, 9.2, 0.6, 'lab_panel'),

            // --- FLOOR 1 (y=12.0): Presidential Briefing Room + Hallway w/ Passenger Shaft Cutout (9.8..13.2, -3.2..0.2) ---
            boxMM(-16, 11.65, 0.2, 16, 12.0, 22.0, 'pentagon_marble'),
            boxMM(-16, 11.65, -8.0, 16, 12.0, -3.2, 'pentagon_marble'),
            boxMM(-16, 11.65, -3.2, 9.8, 12.0, 0.2, 'pentagon_marble'),
            boxMM(13.2, 11.65, -3.2, 16, 12.0, 0.2, 'pentagon_marble'),
            // Briefing Room (x: -11..11, z: 8..22) — 4 Glass Windows + Partition Doorway + Mahogany Table & Chairs
            ...wallWithWindowXAt(22, 12.0, -11, 0, -5.5, -3.1, 4.6, 0.65, 'pentagon_panel'),
            ...wallWithWindowXAt(22, 12.0, 0, 11, 3.1, 5.5, 4.6, 0.65, 'pentagon_panel'),
            ...wallWithWindowZAt(-11, 12.0, 8, 22, 14.0, 16.4, 4.6, 0.65, 'pentagon_panel'),
            ...wallWithWindowZAt(11, 12.0, 8, 22, 14.0, 16.4, 4.6, 0.65, 'pentagon_panel'),
            ...wallWithOpeningX(8, 12.0, 16.6, -11, 11, -2.2, 2.2, 15.1, 0.65, 'pentagon_panel'),
            boxMM(-4.8, 12.0, 13.5, 4.8, 12.95, 16.5, 'wood_plank'), // Iconic Long Mahogany Conference Table
            boxMM(-4.0, 12.0, 12.6, -3.2, 12.75, 13.3, 'velvet_red'),
            boxMM(3.2, 12.0, 12.6, 4.0, 12.75, 13.3, 'velvet_red'),
            // Floor 1 Outer Penthouse Hallway Perimeter + 2 Hallway Windows + FULL PENTAGON CEILING (y=16.6)
            ...wallWithWindowZAt(-16, 12.0, -8, 8, -1.2, 1.2, 4.6, 0.65, 'pentagon_panel'),
            ...wallWithWindowXAt(-8, 12.0, -16, 16, -1.2, 1.2, 4.6, 0.65, 'pentagon_panel'),
            boxMM(15.35, 12.0, -8, 16.05, 16.6, 8, 'pentagon_panel'),
            boxMM(-16, 12.0, 7.65, -11, 16.6, 8.35, 'pentagon_panel'),
            boxMM(11, 12.0, 7.65, 16, 16.6, 8.35, 'pentagon_panel'),
            boxMM(-16.4, 16.6, -8.4, 16.4, 17.0, 22.4, 'ceiling_plaster'),
            // Passenger Elevator Shaft Walls (East, North, South — open West -X into Penthouse Hall & War Room!)
            boxMM(13.2, 6.0, -3.4, 13.6, 16.6, 0.4, 'diamond_plate'),
            boxMM(9.8, 6.0, -3.6, 13.6, 16.6, -3.2, 'diamond_plate'),
            boxMM(9.8, 6.0, 0.2, 13.6, 16.6, 0.6, 'diamond_plate')
        ],
        lights: [
            { x: 0, y: 16.1, z: 15.0, color: 0xfef08a, intensity: 1.8, distance: 20, zone: 'spawn', alwaysOn: true },
            { x: 0, y: 16.1, z: 2.0, color: 0xbae6fd, intensity: 1.5, distance: 18, zone: 'spawn', alwaysOn: true },
            { x: 0, y: 10.8, z: -1.0, color: 0xef4444, intensity: 1.9, distance: 22, zone: 'war_room', alwaysOn: true },
            { x: 0, y: 10.4, z: -20.0, color: 0xc084fc, intensity: 2.0, distance: 12, zone: 'war_room', alwaysOn: true },
            { x: 0, y: 4.8, z: -18.0, color: 0x38bdf8, intensity: 2.0, distance: 24, zone: 'labs', alwaysOn: false }
        ],
        zones: ['spawn', 'war_room', 'labs'],
        doors: [
            { id: 'five_brief_door', fromZone: 'spawn', toZone: 'spawn', cost: 750, requiresPower: false, x: 0, y: 13.55, z: 8.0, w: 4.3, h: 3.1, d: 0.6, label: 'BRIEFING HALLWAY DEBRIS' },
            { id: 'five_cargo_gate', fromZone: 'war_room', toZone: 'labs', cost: 1000, requiresPower: false, x: -12.0, y: 7.55, z: -8.8, w: 3.6, h: 3.1, d: 0.5, label: 'CARGO ELEVATOR GATE' }
        ],
        windows: [
            // Floor 1 Briefing & Hallway Windows (y=12)
            { id: 'f_w1', zone: 'spawn', x: -4.3, y: 12.0, z: 22.0, w: 2.3, axis: 'z', outside: [-4.3, 12.0, 23.2], inside: [-4.3, 12.0, 20.0], waypointId: 'fv_sp' },
            { id: 'f_w2', zone: 'spawn', x: 4.3, y: 12.0, z: 22.0, w: 2.3, axis: 'z', outside: [4.3, 12.0, 23.2], inside: [4.3, 12.0, 20.0], waypointId: 'fv_sp' },
            { id: 'f_w3', zone: 'spawn', x: -11.0, y: 12.0, z: 15.2, w: 2.3, axis: 'x', outside: [-12.2, 12.0, 15.2], inside: [-9.2, 12.0, 15.2], waypointId: 'fv_sp' },
            { id: 'f_w4', zone: 'spawn', x: 11.0, y: 12.0, z: 15.2, w: 2.3, axis: 'x', outside: [12.2, 12.0, 15.2], inside: [9.2, 12.0, 15.2], waypointId: 'fv_sp' },
            { id: 'f_w5', zone: 'spawn', x: -16.0, y: 12.0, z: 0.0, w: 2.3, axis: 'x', outside: [-17.2, 12.0, 0.0], inside: [-14.0, 12.0, 0.0], waypointId: 'fv_sp_h' },
            // Floor 2 War Room Windows (y=6)
            { id: 'f_w6', zone: 'war_room', x: -18.0, y: 6.0, z: -1.0, w: 2.3, axis: 'x', outside: [-19.4, 6.0, -1.0], inside: [-16.0, 6.0, -1.0], waypointId: 'fv_wr' },
            { id: 'f_w7', zone: 'war_room', x: 18.0, y: 6.0, z: -1.0, w: 2.3, axis: 'x', outside: [19.4, 6.0, -1.0], inside: [16.0, 6.0, -1.0], waypointId: 'fv_wr' },
            // Floor 3 Labs Windows (y=0)
            { id: 'f_w8', zone: 'labs', x: -24.0, y: 0, z: -17.0, w: 2.3, axis: 'x', outside: [-25.4, 0, -17.0], inside: [-21.8, 0, -17.0], waypointId: 'fv_lb' },
            { id: 'f_w9', zone: 'labs', x: 24.0, y: 0, z: -17.0, w: 2.3, axis: 'x', outside: [25.4, 0, -17.0], inside: [21.8, 0, -17.0], waypointId: 'fv_lb' }
        ],
        groundSpawners: [
            { zone: 'spawn', x: -12.0, y: 12.0, z: -5.0, waypointId: 'fv_sp_h' },
            { zone: 'spawn', x: 12.0, y: 12.0, z: 5.0, waypointId: 'fv_sp_h' },
            { zone: 'spawn', x: -12.0, y: 12.0, z: 5.0, waypointId: 'fv_sp_h' },
            { zone: 'spawn', x: 0.0, y: 12.0, z: -5.5, waypointId: 'fv_sp_h' },
            { zone: 'war_room', x: -13.0, y: 6.0, z: 6.0, waypointId: 'fv_wr' },
            { zone: 'war_room', x: 13.0, y: 6.0, z: 6.0, waypointId: 'fv_wr' },
            { zone: 'war_room', x: -14.5, y: 6.0, z: -7.5, waypointId: 'fv_wr' },
            { zone: 'war_room', x: 14.5, y: 6.0, z: -7.5, waypointId: 'fv_wr' },
            { zone: 'war_room', x: -6.5, y: 7.4, z: 9.0, waypointId: 'fv_wr' },
            { zone: 'war_room', x: 6.5, y: 7.4, z: 9.0, waypointId: 'fv_wr' },
            { zone: 'labs', x: -15.0, y: 0, z: -23.0, waypointId: 'fv_lb' },
            { zone: 'labs', x: 15.0, y: 0, z: -23.0, waypointId: 'fv_lb' },
            { zone: 'labs', x: -18.5, y: 0, z: -8.0, waypointId: 'fv_lb' },
            { zone: 'labs', x: 18.5, y: 0, z: -8.0, waypointId: 'fv_lb' },
            { zone: 'labs', x: 0.0, y: 0, z: -21.5, waypointId: 'fv_lb' },
            { zone: 'labs', x: 0.0, y: 0, z: 6.5, waypointId: 'fv_lb' }
        ],
        perks: [
            { id: 'quick_revive', name: 'Quick Revive', cost: 500, x: -9.5, y: 12.0, z: 19.0, rotY: Math.PI * 0.5, color: '#38bdf8', desc: 'Solo Self-Revive (Briefing Room)', requiresPower: false },
            { id: 'speed_cola', name: 'Speed Cola', cost: 3000, x: 5.5, y: 12.0, z: -6.8, rotY: 0, color: '#22c55e', desc: '2x Reload (Penthouse Hall)', requiresPower: true },
            { id: 'juggernog', name: 'Juggernog', cost: 2500, x: -15.5, y: 6.0, z: -11.0, rotY: 0, color: '#ef4444', desc: '250 Max HP (War Room Lower)', requiresPower: true },
            { id: 'double_tap', name: 'Double Tap 2.0', cost: 2000, x: 15.5, y: 6.0, z: -11.0, rotY: 0, color: '#f59e0b', desc: 'Double Bullets (War Room Lower)', requiresPower: true }
        ],
        elevators: [
            {
                id: 'five_pass_elev', label: 'PASSENGER ELEVATOR (1F ↔ 2F)', cost: 250,
                x: 11.5, z: -1.5, w: 3.1, d: 3.1, bottomY: 6.0, topY: 12.0,
                bottomZone: 'war_room', topZone: 'spawn', startAtBottom: false,
                callTop: { x: 8.8, z: -3.2 }, callBottom: { x: 8.8, z: -3.2 }
            },
            {
                id: 'five_cargo_elev', label: 'CARGO FREIGHT ELEVATOR (2F ↔ 3F)', cost: 250,
                x: -12.0, z: -10.5, w: 3.3, d: 3.3, bottomY: 0.0, topY: 6.0,
                bottomZone: 'labs', topZone: 'war_room', startAtBottom: false,
                callTop: { x: -9.0, z: -7.8 }, callBottom: { x: -9.0, z: -7.8 }
            }
        ],
        defconSwitches: [
            { id: 'five_def_1', x: -5.5, y: 8.8, z: 11.0, rotY: Math.PI },
            { id: 'five_def_2', x: 5.5, y: 8.8, z: 11.0, rotY: Math.PI },
            { id: 'five_def_3', x: -17.55, y: 7.4, z: 5.0, rotY: Math.PI * 0.5 },
            { id: 'five_def_4', x: 17.55, y: 7.4, z: 5.0, rotY: -Math.PI * 0.5 }
        ],
        traps: [
            { id: 'five_lab_electro', kind: 'electro_shock', label: 'LABS CORRIDOR ELECTRO-SHOCK', cost: 1000, requiresPower: true, x: 0.0, y: 0, z: -12.0, axis: 'z', radius: 2.8, switchX: 3.4, switchZ: -14.5, switchRotY: -Math.PI * 0.5, duration: 20, cooldown: 35 }
        ],
        wallBuys: [
            { weaponId: 'double_barrel', cost: 500, ammoCost: 250, x: -10.2, y: 13.5, z: 10.5, rotY: Math.PI * 0.5 },
            { weaponId: 'mk14', cost: 500, ammoCost: 250, x: 10.2, y: 13.5, z: 10.5, rotY: -Math.PI * 0.5 },
            { weaponId: 'ump45', cost: 1000, ammoCost: 500, x: -7.5, y: 13.5, z: -7.3, rotY: 0 },
            { weaponId: 'mp5', cost: 1000, ammoCost: 500, x: -17.3, y: 7.5, z: -6.5, rotY: Math.PI * 0.5 },
            { weaponId: 'r870', cost: 1500, ammoCost: 750, x: 17.3, y: 7.5, z: -6.5, rotY: -Math.PI * 0.5 },
            { weaponId: 'm16a4', cost: 1200, ammoCost: 600, x: 0.0, y: 8.8, z: 11.0, rotY: Math.PI },
            { weaponId: 'aks74u', cost: 1200, ammoCost: 600, x: -11.0, y: 1.5, z: -26.4, rotY: 0 },
            { weaponId: 'combat_knife', cost: 3000, ammoCost: 1500, x: 11.0, y: 1.5, z: -26.4, rotY: 0 }
        ],
        armorWall: null,
        mysteryBoxPads: [
            { id: 'fv_box_labs', x: -16.0, y: 0, z: -22.0, rotY: Math.PI * 0.5, zone: 'labs' },
            { id: 'fv_box_wr', x: 14.0, y: 6.0, z: 9.0, rotY: Math.PI, zone: 'war_room' }
        ],
        powerSwitch: { x: 0.0, y: 1.4, z: -26.6, rotY: 0 },
        powerSigns: [
            { x: -10.5, y: 1.32, z: -6.0, rotY: Math.PI * 0.5, dir: 'left' }
        ],
        wallWritings: [
            { text: 'DEFCON 1', sub: 'FLIP 4 WAR ROOM SWITCHES', color: 'rgba(239, 68, 68, 0.85)', x: 0, y: 9.2, z: -12.0, rotY: 0, w: 2.4, h: 0.9 },
            { text: 'PANIC ROOM', sub: 'DEFCON 5 PACK-A-PUNCH', color: 'rgba(56, 189, 248, 0.85)', x: 0, y: 9.2, z: -23.8, rotY: 0, w: 2.4, h: 0.9 }
        ],
        landmarks: [
            { kind: 'five_panic_door', x: 0, y: 7.6, z: -15.0, w: 3.8, h: 3.2, d: 0.45 }
        ],
        packAPunch: { x: 0.0, y: 6.0, z: -23.0, rotY: 0 },
        teleporters: [
            { id: 'five_wr_tp', mode: 'five_war_room', label: 'WAR ROOM TELEPORTER → LABS (OR PANIC ROOM AT DEFCON 5)', cost: 0, x: 0, y: 6.0, z: -5.5, destX: 0, destY: 0, destZ: -6.0, panicDestX: 0, panicDestY: 6.0, panicDestZ: -19.5, zoneRequired: 'labs', color: 0xa855f7 },
            { id: 'five_lab_tp', label: 'LABS TELEPORTER → WAR ROOM', cost: 0, x: 0, y: 0, z: -3.5, destX: 0, destY: 6.0, destZ: -2.0, zoneRequired: 'war_room', color: 0x38bdf8 },
            { id: 'five_panic_exit', mode: 'five_exit_panic', label: 'EXIT PANIC ROOM → WAR ROOM', cost: 0, x: 3.2, y: 6.0, z: -18.5, destX: 0, destY: 6.0, destZ: -2.0, zoneRequired: 'war_room', color: 0x22c55e, requiresPower: false }
        ],
        exfilPoint: { x: 0, y: 6.0, z: -2.0 },
        waypoints: [
            { id: 'fv_sp', x: 0, y: 12.0, z: 14, zone: 'spawn', links: ['fv_sp_h'] },
            { id: 'fv_sp_h', x: 0, y: 12.0, z: 2, zone: 'spawn', links: ['fv_sp', 'fv_wr'] },
            { id: 'fv_wr', x: 0, y: 6.0, z: -2, zone: 'war_room', links: ['fv_sp_h', 'fv_lb'] },
            { id: 'fv_lb', x: 0, y: 0, z: -16, zone: 'labs', links: ['fv_wr'] }
        ]
    };

    /* ========================================================================
       10. ASCENSION (COD BO1 — 100% 1:1 Soviet Baikonur Cosmodrome)
       1:1 Official Replica:
         - Begins in authentic SOVIET BLACK-AND-WHITE FILM MODE until Power is turned on!
         - Two-Level Centrifuge Room ('spawn'): Rotating 3D Centrifuge Arm hazard
           (CROUCH [C] to duck cleanly under!), Quick Revive [500], Olympia [500]
           downstairs, M14 [500] & Lunar Lander Return Pad upstairs, Upper Door [750]
           + Lower Door [750]!
         - Cosmodrome Courtyard ('cosmodrome'): West Stamin-Up Wing (Stamin-Up [2000],
           MP5K [1000], Electro Trap [1000], Lunar Lander Ф [250]), East Platform &
           Juggernog Stairwell Nook (Juggernog [2500], Double Tap [2000], AK-74u [1200],
           Lunar Lander Д [250]).
         - Telemetry Control Building ('power_bldg', y=2.6m): Main Power Switch (restores
           COLOR!), Rocket Launch Console (3 Lander Bulbs), Speed Cola [3000], Bowie Knife
           [3000], Galil [1500], Box Pad.
         - Soyuz Rocket Launch Bay ('rocket_pad'): Towering Multi-Stage 3D Soyuz Rocket,
           Lunar Lander Ч [250], M16 [1200], & Blast-Door Pack-a-Punch unlocked ONLY after
           riding all 3 Lunar Landers and hitting Launch Rocket! (Shoot the rising rocket
           mid-air for a secret Double Points explosion!)
    ======================================================================== */
    const ASCENSION = {
        id: 'ascension',
        name: 'ASCENSION',
        mode: 'zombies',
        subtitle: 'COD Black Ops 1 (100% 1:1 Official Replica) • Soviet Baikonur Cosmodrome',
        description: '100% 1:1 Official BO1 Replica: Begins in Soviet Black-and-White until Power restores Color! Duck under the Spinning Centrifuge Arm, ride all 3 Lunar Landers (Ф, Д, Ч), and Launch the Soyuz Rocket into the sky to open Pack-a-Punch!',
        bwUntilPower: true,
        atmosphere: {
            skyTop: 0x0c0e14, skyBottom: 0x222634, fogColor: 0x161922, fogDensity: 0.015,
            sunColor: 0xf97316, sunIntensity: 0.90, sunPos: [-30, 38, -25],
            hemiSky: 0x64748b, hemiGround: 0x111318, hemiIntensity: 0.60, moon: true
        },
        playerSpawn: { x: -4.5, y: 0, z: 18.0, yaw: 0 },
        ramps: [
            // Centrifuge inner ramp up to Upper Ring (y: 0 -> 2.2)
            { x: 7.0, w: 2.4, z1: 18.0, z2: 11.5, y1: 0, y2: 2.2, axis: 'z', mat: 'diamond_plate' },
            // Upper Centrifuge Exit ramp down to East PhD/Double Tap courtyard
            { x: 13.0, w: 3.0, z1: 10.5, z2: 3.0, y1: 2.2, y2: 0, axis: 'z', mat: 'soviet_concrete' },
            // Telemetry Control Building staircase to Power Switch deck (y: 0 -> 2.6)
            { x: -16.0, w: 3.2, z1: 3.0, z2: -5.0, y1: 0, y2: 2.6, axis: 'z', mat: 'soviet_concrete' }
        ],
        boxes: [
            boxMM(-30, -0.6, -30, 30, 0, 24, 'asphalt'),
            boxMM(-30, 0, 23.2, 30, 7.2, 24, 'soviet_concrete'),
            boxMM(-30, 0, -30, 30, 7.2, -29.2, 'soviet_concrete'),
            boxMM(-30, 0, -30, -29.2, 7.2, 24, 'soviet_concrete'),
            boxMM(29.2, 0, -30, 30, 7.2, 24, 'soviet_concrete'),
            // Centrifuge Spawn Room (x: -10..10, z: 8..22, FULL ROOF + Sealed 1F/2F Walls)
            boxMM(-0.9, 0, 14.1, 0.9, 4.2, 15.9, 'rusted_metal'),
            boxMM(-10, 2.0, 8.0, 10.0, 2.2, 11.5, 'diamond_plate'),
            boxMM(-9.65, 2.2, 11.25, 5.6, 3.1, 11.55, 'rusted_metal'),
            ...wallWithWindowX(22, -10, 0, -5.8, -3.4, 5.6, 0.7, 'soviet_concrete'),
            ...wallWithWindowX(22, 0, 10, 3.4, 5.8, 5.6, 0.7, 'soviet_concrete'),
            boxMM(-10.35, 0, 8, -9.65, 2.2, 22, 'soviet_concrete'), // FIX: seals West Spawn under a_w3!
            ...wallWithWindowZAt(-10, 2.2, 8, 22, 9.0, 11.4, 3.4, 0.7, 'soviet_concrete'),
            boxMM(9.65, 0, 8, 10.35, 2.2, 22, 'soviet_concrete'), // Seals East Lower Spawn under upper door!
            ...wallWithOpeningZ(10, 2.2, 5.6, 8, 22, 9.2, 12.2, 5.0, 0.7, 'soviet_concrete'),
            ...wallWithOpeningX(8, 0, 5.6, -10, 10, -2.4, 2.4, 3.2, 0.7, 'soviet_concrete'),
            boxMM(-10.4, 5.6, 7.6, 10.4, 6.0, 22.4, 'soviet_concrete'),
            // Upper Centrifuge Exit Landing outside asc_centrifuge_upper connecting to x=13 ramp
            boxMM(10.35, 2.0, 9.0, 14.8, 2.2, 12.6, 'soviet_concrete'),
            boxMM(14.6, 2.2, 9.0, 14.9, 3.1, 12.6, 'rusted_metal'),
            // West Telemetry Power Building & Stamin-Up Wing (x: -28..-12, z: -18..8, FULL ROOF)
            boxMM(-28, 2.4, -18, -12, 2.6, -5, 'soviet_concrete'),
            boxMM(-28.35, 0, 7.65, -12, 5.6, 8.35, 'soviet_concrete'), // Seals South Stamin-Up Wing!
            boxMM(-28.35, 0, -18.35, -12, 6.4, -17.65, 'soviet_concrete'), // Solid Telemetry North Wall!
            boxMM(-28.35, 0, -5, -27.65, 5.6, 8, 'soviet_concrete'),
            boxMM(-28.35, 0, -18, -27.65, 2.6, -5, 'soviet_concrete'),
            ...wallWithWindowZAt(-28, 2.6, -18, -5, -13.2, -10.8, 3.8, 0.7, 'soviet_concrete'),
            ...wallWithOpeningZ(-12, 0, 6.4, -18, 8, -2.0, 2.0, 3.3, 0.7, 'soviet_concrete'),
            boxMM(-28.4, 6.2, -18.4, -11.6, 6.6, -4.6, 'soviet_concrete'),
            // Cosmodrome Exterior Seal Walls + Juggernog Stairwell Nook + East Courtyard Windows
            boxMM(-12.35, 0, 7.65, -9.65, 5.6, 8.35, 'soviet_concrete'),
            boxMM(10, 0, 13.15, 28.35, 5.6, 13.85, 'soviet_concrete'),
            boxMM(27.65, 0, 8, 28.35, 5.6, 13.5, 'soviet_concrete'),
            boxMM(12, 0, -12.35, 28.35, 5.6, -11.65, 'soviet_concrete'),
            boxMM(6.5, 0, -11.65, 7.1, 4.2, -8.0, 'soviet_concrete'),
            ...wallWithWindowZ(28, -12, -2, -9.2, -6.8, 5.6, 0.7, 'soviet_concrete'),
            ...wallWithWindowZ(28, -2, 8, 1.2, 3.6, 5.6, 0.7, 'soviet_concrete'),
            // North Soyuz Rocket Pad & Launch Bay (x: -12..12, z: -29..-12, Open Sky for Liftoff!)
            boxMM(-12.35, 0, -29.35, -11.65, 6.2, -12, 'soviet_concrete'),
            boxMM(11.65, 0, -29.35, 12.35, 6.2, -12, 'soviet_concrete'),
            ...wallWithOpeningX(-12, 0, 6.2, -12, 12, -2.6, 2.6, 3.5, 0.7, 'soviet_concrete'),
            ...wallWithWindowX(-29, -12, 0, -7.5, -5.1, 6.2, 0.7, 'soviet_concrete'),
            ...wallWithWindowX(-29, 0, 12, 5.1, 7.5, 6.2, 0.7, 'soviet_concrete'),
            // 4 Launch Gantry Towers + PaP Alcove Framing & Roof
            boxMM(-5.65, 0, -25.25, -4.75, 14.0, -24.35, 'rusted_metal'),
            boxMM(4.75, 0, -25.25, 5.65, 14.0, -24.35, 'rusted_metal'),
            boxMM(-5.65, 0, -15.65, -4.75, 14.0, -14.75, 'rusted_metal'),
            boxMM(4.75, 0, -15.65, 5.65, 14.0, -14.75, 'rusted_metal'),
            boxMM(-2.3, 0, -29.0, -2.0, 3.8, -25.2, 'soviet_concrete'),
            boxMM(2.0, 0, -29.0, 2.3, 3.8, -25.2, 'soviet_concrete'),
            boxMM(-2.4, 3.6, -29.0, 2.4, 4.0, -25.0, 'diamond_plate')
        ],
        lights: [
            { x: 0, y: 5.2, z: 16.0, color: 0xf97316, intensity: 1.7, distance: 18, zone: 'spawn', alwaysOn: true },
            { x: 0, y: 5.5, z: -2.0, color: 0x94a3b8, intensity: 1.6, distance: 22, zone: 'cosmodrome', alwaysOn: true },
            { x: -19, y: 5.8, z: -11.0, color: 0x38bdf8, intensity: 1.9, distance: 18, zone: 'power_bldg', alwaysOn: false },
            { x: 0, y: 6.2, z: -24.0, color: 0xc084fc, intensity: 2.2, distance: 24, zone: 'rocket_pad', alwaysOn: false }
        ],
        zones: ['spawn', 'cosmodrome', 'power_bldg', 'rocket_pad'],
        doors: [
            { id: 'asc_centrifuge_lower', fromZone: 'spawn', toZone: 'cosmodrome', cost: 750, requiresPower: false, x: 0, y: 1.6, z: 8.0, w: 4.75, h: 3.15, d: 0.65, label: 'CENTRIFUGE LOWER GATE' },
            { id: 'asc_centrifuge_upper', fromZone: 'spawn', toZone: 'cosmodrome', cost: 750, requiresPower: false, x: 10.0, y: 3.6, z: 10.7, w: 0.65, h: 2.85, d: 3.1, label: 'CENTRIFUGE UPPER EXIT DOOR' },
            { id: 'asc_power_door', fromZone: 'cosmodrome', toZone: 'power_bldg', cost: 1250, requiresPower: false, x: -12.0, y: 1.65, z: 0.0, w: 0.65, h: 3.3, d: 4.0, label: 'TELEMETRY POWER BUILDING' },
            { id: 'asc_rocket_door', fromZone: 'cosmodrome', toZone: 'rocket_pad', cost: 1250, requiresPower: true, x: 0, y: 1.75, z: -12.0, w: 5.15, h: 3.5, d: 0.65, label: 'SOYUZ ROCKET LAUNCH BAY' }
        ],
        windows: [
            { id: 'a_w1', zone: 'spawn', x: -4.6, y: 0, z: 22.0, w: 2.3, axis: 'z', outside: [-4.6, 0, 23.0], inside: [-4.6, 0, 19.8], waypointId: 'as_sp' },
            { id: 'a_w2', zone: 'spawn', x: 4.6, y: 0, z: 22.0, w: 2.3, axis: 'z', outside: [4.6, 0, 23.0], inside: [4.6, 0, 19.8], waypointId: 'as_sp' },
            { id: 'a_w3', zone: 'spawn', x: -10.0, y: 2.2, z: 10.2, w: 2.3, axis: 'x', outside: [-12.0, 2.2, 10.2], inside: [-7.8, 2.2, 10.2], waypointId: 'as_sp' },
            { id: 'a_w4', zone: 'cosmodrome', x: 28.0, y: 0, z: -8.0, w: 2.3, axis: 'x', outside: [29.0, 0, -8.0], inside: [25.5, 0, -8.0], waypointId: 'as_co' },
            { id: 'a_w5', zone: 'cosmodrome', x: 28.0, y: 0, z: 2.4, w: 2.3, axis: 'x', outside: [29.0, 0, 2.4], inside: [25.5, 0, 2.4], waypointId: 'as_co' },
            { id: 'a_w6', zone: 'power_bldg', x: -28.0, y: 2.6, z: -12.0, w: 2.3, axis: 'x', outside: [-29.0, 2.6, -12.0], inside: [-25.5, 2.6, -12.0], waypointId: 'as_pw' },
            { id: 'a_w7', zone: 'rocket_pad', x: -6.3, y: 0, z: -29.0, w: 2.3, axis: 'z', outside: [-6.3, 0, -29.1], inside: [-6.3, 0, -26.5], waypointId: 'as_rk' },
            { id: 'a_w8', zone: 'rocket_pad', x: 6.3, y: 0, z: -29.0, w: 2.3, axis: 'z', outside: [6.3, 0, -29.1], inside: [6.3, 0, -26.5], waypointId: 'as_rk' }
        ],
        groundSpawners: [
            { zone: 'cosmodrome', x: 16.0, y: 0, z: 0.0, waypointId: 'as_co' },
            { zone: 'cosmodrome', x: 16.0, y: 0, z: -8.0, waypointId: 'as_co' },
            { zone: 'cosmodrome', x: -20.0, y: 0, z: 5.5, waypointId: 'as_co' },
            { zone: 'cosmodrome', x: -16.5, y: 0, z: -2.0, waypointId: 'as_co' },
            { zone: 'cosmodrome', x: 23.5, y: 0, z: 5.0, waypointId: 'as_co' },
            { zone: 'cosmodrome', x: 4.5, y: 0, z: -6.5, waypointId: 'as_co' },
            { zone: 'cosmodrome', x: -6.5, y: 0, z: 2.5, waypointId: 'as_co' },
            { zone: 'power_bldg', x: -20.0, y: 2.6, z: -14.0, waypointId: 'as_pw' },
            { zone: 'power_bldg', x: -24.0, y: 2.6, z: -8.5, waypointId: 'as_pw' },
            { zone: 'power_bldg', x: -15.5, y: 2.6, z: -11.5, waypointId: 'as_pw' },
            { zone: 'rocket_pad', x: -9.0, y: 0, z: -24.0, waypointId: 'as_rk' },
            { zone: 'rocket_pad', x: 9.0, y: 0, z: -24.0, waypointId: 'as_rk' },
            { zone: 'rocket_pad', x: 0.0, y: 0, z: -15.5, waypointId: 'as_rk' },
            { zone: 'rocket_pad', x: -9.5, y: 0, z: -16.0, waypointId: 'as_rk' },
            { zone: 'rocket_pad', x: 9.5, y: 0, z: -16.0, waypointId: 'as_rk' }
        ],
        perks: [
            { id: 'quick_revive', name: 'Quick Revive', cost: 500, x: -8.2, y: 0, z: 18.0, rotY: Math.PI * 0.5, color: '#38bdf8', desc: 'Solo Self-Revive (Centrifuge)', requiresPower: false },
            { id: 'stamin_up', name: 'Stamin-Up', cost: 2000, x: -24.5, y: 0, z: 5.5, rotY: Math.PI * 0.5, color: '#eab308', desc: '+18% Sprint Speed (Lander Ф Alley)', requiresPower: true },
            { id: 'double_tap', name: 'Double Tap 2.0', cost: 2000, x: 24.5, y: 0, z: -5.5, rotY: -Math.PI * 0.5, color: '#f59e0b', desc: 'Double Bullets (Lander Д Platform)', requiresPower: true },
            { id: 'juggernog', name: 'Juggernog', cost: 2500, x: 9.2, y: 0, z: -10.4, rotY: 0, color: '#ef4444', desc: '250 Max HP (Stairwell Nook)', requiresPower: true },
            { id: 'speed_cola', name: 'Speed Cola', cost: 3000, x: -25.0, y: 2.6, z: -15.5, rotY: 0, color: '#22c55e', desc: '2x Reload (Telemetry Control Room)', requiresPower: true }
        ],
        traps: [
            { id: 'asc_electro_w', kind: 'electro_shock', label: 'STAMIN-UP WING ELECTRO-SHOCK', cost: 1000, requiresPower: true, x: -16.0, y: 0, z: 5.0, axis: 'x', radius: 2.8, switchX: -12.45, switchZ: 5.0, switchRotY: -Math.PI * 0.5, duration: 20, cooldown: 35 }
        ],
        wallBuys: [
            { weaponId: 'double_barrel', cost: 500, ammoCost: 250, x: 9.55, y: 1.5, z: 18.0, rotY: -Math.PI * 0.5 },
            { weaponId: 'mk14', cost: 500, ammoCost: 250, x: -4.0, y: 3.6, z: 8.45, rotY: 0 },
            { weaponId: 'mp5', cost: 1000, ammoCost: 500, x: -18.0, y: 1.5, z: 7.55, rotY: Math.PI },
            { weaponId: 'aks74u', cost: 1200, ammoCost: 600, x: 18.0, y: 1.5, z: -11.55, rotY: 0 },
            { weaponId: 'galil_ar', cost: 1500, ammoCost: 750, x: -18.0, y: 4.1, z: -17.55, rotY: 0 },
            { weaponId: 'combat_knife', cost: 3000, ammoCost: 1500, x: -14.2, y: 4.1, z: -17.55, rotY: 0 },
            { weaponId: 'm16a4', cost: 1200, ammoCost: 600, x: 9.5, y: 1.5, z: -28.55, rotY: 0 }
        ],
        grenadeWalls: [
            { id: 'asc_nades', cost: 250, x: 27.55, y: 1.5, z: 6.2, rotY: -Math.PI * 0.5 }
        ],
        armorWall: null,
        mysteryBoxPads: [
            { id: 'as_box_pw', x: -16.0, y: 2.6, z: -15.5, rotY: 0, zone: 'power_bldg' },
            { id: 'as_box_co', x: 16.0, y: 0, z: -1.5, rotY: -Math.PI * 0.5, zone: 'cosmodrome' },
            { id: 'as_box_rk', x: -8.5, y: 0, z: -22.0, rotY: Math.PI * 0.5, zone: 'rocket_pad' }
        ],
        powerSwitch: { x: -21.0, y: 4.0, z: -17.55, rotY: 0 },
        powerSigns: [
            { x: -11.58, y: 1.32, z: 2.5, rotY: Math.PI * 0.5, dir: 'up' }
        ],
        rocketLaunchConsole: { x: -23.5, y: 4.0, z: -17.45, rotY: 0 },
        landmarks: [
            { kind: 'centrifuge_arm', x: 0, y: 1.38, z: 15.0 },
            { kind: 'soyuz_rocket', x: 0, y: 0, z: -20.0, papGate: { x: 0, y: 1.8, z: -25.2, w: 4.2, h: 3.6, d: 0.45 } }
        ],
        lunarLanders: [
            { code: 'Ф', label: 'LUNAR LANDER Ф (STAMIN-UP) → CENTRIFUGE', cost: 250, x: -21.0, y: 0, z: 2.5, destX: -2.0, destY: 2.2, destZ: 9.8, color: 0xf59e0b },
            { code: 'Д', label: 'LUNAR LANDER Д (COURTYARD) → CENTRIFUGE', cost: 250, x: 21.0, y: 0, z: -2.0, destX: -2.0, destY: 2.2, destZ: 9.8, color: 0x38bdf8 },
            { code: 'Ч', label: 'LUNAR LANDER Ч (ROCKET PAD) → CENTRIFUGE', cost: 250, x: 8.5, y: 0, z: -19.0, destX: -2.0, destY: 2.2, destZ: 9.8, color: 0xa855f7 }
        ],
        packAPunch: {
            x: 0.0, y: 0, z: -27.2, rotY: 0,
            locked: true,
            lockReason: 'RIDE ALL 3 LUNAR LANDERS & LAUNCH SOYUZ ROCKET TO OPEN PACK-A-PUNCH'
        },
        exfilPoint: { x: 6.0, y: 0, z: 0.0 },
        waypoints: [
            { id: 'as_sp', x: 0, y: 0, z: 14, zone: 'spawn', links: ['as_co'] },
            { id: 'as_co', x: 0, y: 0, z: 0, zone: 'cosmodrome', links: ['as_sp', 'as_pw', 'as_rk'] },
            { id: 'as_pw', x: -18, y: 2.6, z: -11, zone: 'power_bldg', links: ['as_co'] },
            { id: 'as_rk', x: 0, y: 0, z: -24, zone: 'rocket_pad', links: ['as_co'] }
        ]
    };

    /* ========================================================================
       11. NUKETOWN ZOMBIES (COD BO2 — 100% 1:1 Nevada Nuclear Test Cul-de-Sac)
       1:1 Official Replica:
         - NO Power Switch, NO Power Signs!
         - Live 1950s Electronic Population Sign (starts at 99, counts down every round!)
         - Perks (Quick Revive, Juggernog, Speed Cola, Double Tap 2.0) AND Pack-a-Punch
           LITERALLY FALL FROM THE SKY as burning meteor pods every few rounds across
           the 5 Crater Drop Pads (Spawn Cul-de-Sac at Rd 1 -> random Backyards/Sideyards)!
         - Cul-de-Sac ('spawn'): Walk-through 1950s Teal School Bus, Yellow Moving Truck
           with 3,000 PTS Rear Door unlocking ('truck_armory': AK-74u [1200], Bowie Knife
           [3000], Frag Grenades [250]), Horizon Atomic Mushroom Cloud, M14 [500], Olympia [500]
         - West 2-Story Green House ('green_house') & Fenced Backyard ('green_yard'):
           Front Door [750], 1F Living/Garage (MP5 [1000]), 2F Bedroom & Balcony (B23R [1000]),
           Backyard Gate [1000]
         - East 2-Story Yellow House ('yellow_house') & Fenced Backyard ('yellow_yard'):
           Front Door [750], 1F Living/Kitchen (R870 [1200]), 2F Bedroom & Balcony (M16 [1200]),
           Backyard Gate [1000], Fallout Shelter Hatch, Galil [1500]
    ======================================================================== */
    const NUKETOWN_ZOMBIES = {
        id: 'nuketown_zombies',
        name: 'NUKETOWN ZOMBIES',
        mode: 'zombies',
        subtitle: 'COD Black Ops 2 (100% 1:1 Official Replica) • Nevada Nuclear Test Cul-de-Sac',
        description: '100% 1:1 Official BO2 Layout: Walk-through Teal School Bus, 3,000 PTS Locked Moving Truck Armory, Live Population Countdown Sign, Horizon Mushroom Cloud, Both 2-Story Houses & Backyards — AND Perks & Pack-a-Punch Fall From the Sky Every Few Rounds!',
        atmosphere: {
            skyTop: 0x1a0b06, skyBottom: 0x451a08, fogColor: 0x291209, fogDensity: 0.015,
            sunColor: 0xfb923c, sunIntensity: 0.95, sunPos: [20, 35, -30],
            hemiSky: 0xf97316, hemiGround: 0x1c1412, hemiIntensity: 0.65, moon: true
        },
        playerSpawn: { x: 0, y: 0, z: 11.5, yaw: 0 },
        ramps: [
            // Walk-in ramp into back of Yellow Moving Truck Armory
            { x: 3.0, w: 2.2, z1: 8.2, z2: 5.2, y1: 0, y2: 0.6, axis: 'z', mat: 'diamond_plate' },
            // Green House Stairs to 2F Master Bedroom & Back Balcony
            { x: -17.5, w: 2.4, z1: 5.5, z2: -1.5, y1: 0, y2: 3.1, axis: 'z', mat: 'wood_plank' },
            // Yellow House Stairs to 2F Master Bedroom & Back Balcony
            { x: 17.5, w: 2.4, z1: 5.5, z2: -1.5, y1: 0, y2: 3.1, axis: 'z', mat: 'wood_plank' }
        ],
        boxes: [
            // Central Asphalt Cul-de-Sac Street + Backyard/Sideyard Grass Lawns
            boxMM(-10, -0.6, -28, 10, 0, 24, 'asphalt'),
            boxMM(-33, -0.6, -28, -10, 0, 24, 'nuketown_grass'),
            boxMM(10, -0.6, -28, 33, 0, 24, 'nuketown_grass'),
            boxMM(-33, 0, 23.2, 33, 6.5, 24, 'concrete'),
            boxMM(-33, 0, -28.0, 33, 6.5, -27.2, 'concrete'),
            boxMM(-33, 0, -28.0, -32.2, 6.5, 24, 'concrete'),
            boxMM(32.2, 0, -28.0, 33, 6.5, 24, 'concrete'),
            // Walk-In Yellow Moving Truck (Cab + 3,000 PTS Trailer Armory Deck at y=0.6)
            boxMM(1.6, 0, -6.5, 4.4, 2.5, -3.5, 'truck_yellow'),
            boxMM(1.6, 0, -3.5, 4.4, 0.6, 5.2, 'diamond_plate'),
            boxMM(1.6, 0.6, -3.5, 1.85, 3.0, 5.2, 'truck_yellow'),
            boxMM(4.15, 0.6, -3.5, 4.4, 3.0, 5.2, 'truck_yellow'),
            boxMM(1.6, 2.75, -3.5, 4.4, 3.0, 5.2, 'truck_yellow'),
            // Parked 1950s Sedan + Electronic Population Sign Post + Center Street Radiation Barricade
            boxMM(-7.5, 0, 14.5, -5.0, 1.35, 18.2, 'container_red'),
            boxMM(-2.4, 0, 20.5, 2.4, 3.6, 21.0, 'wood_plank'),
            boxMM(-10, 0, -10.35, 10, 3.8, -9.65, 'privacy_fence'), // SEALS street behind Bus & Truck!
            boxMM(-8.5, 0, -9.5, -5.2, 1.25, -8.5, 'sandbag'),
            boxMM(5.2, 0, -9.5, 8.5, 1.25, -8.5, 'sandbag'),
            // Front & Side Yard Privacy Fences Sealing House Exterior Alleys (x=±29.2, z=8 & z=-10)
            boxMM(-29.2, 0, 7.65, -23.0, 3.8, 8.35, 'privacy_fence'),
            boxMM(23.0, 0, 7.65, 29.2, 3.8, 8.35, 'privacy_fence'),
            boxMM(-29.2, 0, -10.35, -23.0, 3.8, -9.65, 'privacy_fence'),
            boxMM(23.0, 0, -10.35, 29.2, 3.8, -9.65, 'privacy_fence'),
            ...wallWithWindowZ(-29.2, 7.65, 23.2, 12.8, 15.2, 3.8, 0.7, 'privacy_fence'),
            ...wallWithWindowZ(29.2, 7.65, 23.2, 12.8, 15.2, 3.8, 0.7, 'privacy_fence'),
            // West 2-Story Green House (x: -23..-10, z: -10..8, FULL ROOF + Sealed 2F)
            ...wallWithOpeningZ(-10, 0, 6.2, -10, 8, -2.0, 2.0, 3.0, 0.6, 'green_siding'),
            ...wallWithOpeningX(-10, 0, 6.2, -23, -10, -18.5, -14.5, 3.0, 0.6, 'green_siding'),
            ...wallWithWindowZ(-23, -10, 8, -1.2, 1.2, 6.2, 0.6, 'green_siding'),
            boxMM(-23.3, 0, 7.7, -10, 6.2, 8.3, 'green_siding'),
            boxMM(-22.7, 2.9, -9.7, -10.3, 3.1, -1.5, 'wood_plank'),
            boxMM(-23.4, 6.2, -10.4, -9.6, 6.6, 8.4, 'dark_slate_roof'),
            boxMM(-21.2, 0, 2.5, -19.5, 1.0, 6.5, 'velvet_red'),
            boxMM(-13.5, 0, -9.0, -10.8, 1.0, -5.5, 'wood_crate'),
            // East 2-Story Yellow House (x: 10..23, z: -10..8, FULL ROOF + Sealed 2F)
            ...wallWithOpeningZ(10, 0, 6.2, -10, 8, -2.0, 2.0, 3.0, 0.6, 'yellow_siding'),
            ...wallWithOpeningX(-10, 0, 6.2, 10, 23, 14.5, 18.5, 3.0, 0.6, 'yellow_siding'),
            ...wallWithWindowZ(23, -10, 8, -1.2, 1.2, 6.2, 0.6, 'yellow_siding'),
            boxMM(10, 0, 7.7, 23.3, 6.2, 8.3, 'yellow_siding'),
            boxMM(10.3, 2.9, -9.7, 22.7, 3.1, -1.5, 'wood_plank'),
            boxMM(9.6, 6.2, -10.4, 23.4, 6.6, 8.4, 'dark_slate_roof'),
            boxMM(19.5, 0, 2.5, 21.2, 1.0, 6.5, 'velvet_red'),
            boxMM(10.8, 0, -9.0, 13.5, 1.0, -5.5, 'wood_crate'),
            // Separated Green/Yellow Backyard Enclosures (x=0 center fence, z=-25.2 North fence w/ windows, x=±29.2 side fences)
            boxMM(-0.3, 0, -25.5, 0.3, 3.8, -10.0, 'privacy_fence'),
            boxMM(-29.55, 0, -25.5, -28.85, 3.8, -9.65, 'privacy_fence'),
            boxMM(28.85, 0, -25.5, 29.55, 3.8, -9.65, 'privacy_fence'),
            ...wallWithWindowX(-25.2, -29.2, 0, -15.2, -12.8, 3.8, 0.6, 'privacy_fence'),
            ...wallWithWindowX(-25.2, 0, 29.2, 12.8, 15.2, 3.8, 0.6, 'privacy_fence'),
            boxMM(13.0, 0, -22.5, 16.5, 0.45, -19.5, 'rusted_metal') // Fallout Shelter Hatch
        ],
        lights: [
            { x: 0, y: 5.8, z: 3.0, color: 0xfb923c, intensity: 1.9, distance: 26, zone: 'spawn', alwaysOn: true },
            { x: -16, y: 5.8, z: -1.0, color: 0x4ade80, intensity: 1.6, distance: 18, zone: 'green_house', alwaysOn: true },
            { x: 16, y: 5.8, z: -1.0, color: 0xfacc15, intensity: 1.6, distance: 18, zone: 'yellow_house', alwaysOn: true },
            { x: 0, y: 4.5, z: -18.0, color: 0xf97316, intensity: 1.7, distance: 22, zone: 'green_yard', alwaysOn: true }
        ],
        zones: ['spawn', 'green_house', 'green_yard', 'yellow_house', 'yellow_yard', 'truck_armory'],
        doors: [
            { id: 'nt_green_door', fromZone: 'spawn', toZone: 'green_house', cost: 750, requiresPower: false, x: -10.0, y: 1.5, z: 0, w: 0.6, h: 3.0, d: 3.9, label: 'GREEN HOUSE FRONT DOOR' },
            { id: 'nt_yellow_door', fromZone: 'spawn', toZone: 'yellow_house', cost: 750, requiresPower: false, x: 10.0, y: 1.5, z: 0, w: 0.6, h: 3.0, d: 3.9, label: 'YELLOW HOUSE FRONT DOOR' },
            { id: 'nt_green_back', fromZone: 'green_house', toZone: 'green_yard', cost: 1000, requiresPower: false, x: -16.5, y: 1.5, z: -10.0, w: 3.9, h: 3.0, d: 0.6, label: 'GREEN HOUSE BACKYARD DOOR' },
            { id: 'nt_yellow_back', fromZone: 'yellow_house', toZone: 'yellow_yard', cost: 1000, requiresPower: false, x: 16.5, y: 1.5, z: -10.0, w: 3.9, h: 3.0, d: 0.6, label: 'YELLOW HOUSE BACKYARD DOOR' },
            { id: 'nt_truck_gate', fromZone: 'spawn', toZone: 'truck_armory', cost: 3000, requiresPower: false, x: 3.0, y: 1.7, z: 5.05, w: 2.3, h: 2.2, d: 0.45, label: 'MOVING TRUCK ARMORY GATE' }
        ],
        windows: [
            { id: 'nt_w1', zone: 'green_house', x: -23.0, y: 0, z: 0, w: 2.3, axis: 'x', outside: [-25.5, 0, 0], inside: [-20.5, 0, 0], waypointId: 'nt_gh' },
            { id: 'nt_w2', zone: 'yellow_house', x: 23.0, y: 0, z: 0, w: 2.3, axis: 'x', outside: [25.5, 0, 0], inside: [20.5, 0, 0], waypointId: 'nt_yh' },
            { id: 'nt_w3', zone: 'green_yard', x: -14.0, y: 0, z: -25.2, w: 2.3, axis: 'z', outside: [-14.0, 0, -26.6], inside: [-14.0, 0, -23.0], waypointId: 'nt_gy' },
            { id: 'nt_w4', zone: 'yellow_yard', x: 14.0, y: 0, z: -25.2, w: 2.3, axis: 'z', outside: [14.0, 0, -26.6], inside: [14.0, 0, -23.0], waypointId: 'nt_yy' },
            { id: 'nt_w5', zone: 'spawn', x: -29.2, y: 0, z: 14.0, w: 2.3, axis: 'x', outside: [-30.8, 0, 14.0], inside: [-26.5, 0, 14.0], waypointId: 'nt_sp' },
            { id: 'nt_w6', zone: 'spawn', x: 29.2, y: 0, z: 14.0, w: 2.3, axis: 'x', outside: [30.8, 0, 14.0], inside: [26.5, 0, 14.0], waypointId: 'nt_sp' }
        ],
        groundSpawners: [
            { zone: 'spawn', x: -6.5, y: 0, z: 17.0, waypointId: 'nt_sp' },
            { zone: 'spawn', x: 6.5, y: 0, z: 17.0, waypointId: 'nt_sp' },
            { zone: 'spawn', x: -18.0, y: 0, z: 16.5, waypointId: 'nt_sp' },
            { zone: 'spawn', x: 18.0, y: 0, z: 16.5, waypointId: 'nt_sp' },
            { zone: 'spawn', x: 0.0, y: 0, z: -7.2, waypointId: 'nt_sp' },
            { zone: 'green_house', x: -16.5, y: 0, z: 3.5, waypointId: 'nt_gh' },
            { zone: 'green_house', x: -16.5, y: 3.1, z: -5.5, waypointId: 'nt_gh' },
            { zone: 'yellow_house', x: 16.5, y: 0, z: 3.5, waypointId: 'nt_yh' },
            { zone: 'yellow_house', x: 16.5, y: 3.1, z: -5.5, waypointId: 'nt_yh' },
            { zone: 'green_yard', x: -17.0, y: 0, z: -22.0, waypointId: 'nt_gy' },
            { zone: 'green_yard', x: -8.5, y: 0, z: -16.5, waypointId: 'nt_gy' },
            { zone: 'green_yard', x: -24.5, y: 0, z: -16.5, waypointId: 'nt_gy' },
            { zone: 'yellow_yard', x: 17.0, y: 0, z: -22.0, waypointId: 'nt_yy' },
            { zone: 'yellow_yard', x: 8.5, y: 0, z: -16.5, waypointId: 'nt_yy' },
            { zone: 'yellow_yard', x: 24.5, y: 0, z: -16.5, waypointId: 'nt_yy' }
        ],
        perks: [], // Dynamic Sky-Drop Perks fall from the sky onto skyDropPads!
        skyDropPads: [
            { id: 'nt_pad_spawn', label: 'CUL-DE-SAC', x: -7.8, y: 0, z: 9.5, rotY: Math.PI * 0.5, isSpawn: true },
            { id: 'nt_pad_gy', label: 'GREEN BACKYARD', x: -19.5, y: 0, z: -22.0, rotY: 0 },
            { id: 'nt_pad_yy', label: 'YELLOW BACKYARD', x: 19.5, y: 0, z: -22.0, rotY: 0 },
            { id: 'nt_pad_side_g', label: 'GREEN SIDEYARD', x: -15.5, y: 0, z: 13.5, rotY: Math.PI },
            { id: 'nt_pad_side_y', label: 'YELLOW SIDEYARD', x: 15.5, y: 0, z: 13.5, rotY: Math.PI }
        ],
        wallBuys: [
            { weaponId: 'mk14', cost: 500, ammoCost: 250, x: -9.3, y: 1.5, z: 5.5, rotY: -Math.PI * 0.5 },
            { weaponId: 'double_barrel', cost: 500, ammoCost: 250, x: 9.3, y: 1.5, z: 5.5, rotY: Math.PI * 0.5 },
            { weaponId: 'aks74u', cost: 1200, ammoCost: 600, x: 3.0, y: 1.8, z: -3.2, rotY: 0 },
            { weaponId: 'combat_knife', cost: 3000, ammoCost: 1500, x: 2.0, y: 1.8, z: 1.5, rotY: Math.PI * 0.5 },
            { weaponId: 'mp5', cost: 1000, ammoCost: 500, x: -15.0, y: 1.5, z: 7.55, rotY: Math.PI },
            { weaponId: 'b23r_burst', cost: 1000, ammoCost: 500, x: -13.0, y: 4.5, z: -9.55, rotY: 0 },
            { weaponId: 'r870', cost: 1200, ammoCost: 600, x: 15.0, y: 1.5, z: 7.55, rotY: Math.PI },
            { weaponId: 'm16a4', cost: 1200, ammoCost: 600, x: 13.0, y: 4.5, z: -9.55, rotY: 0 },
            { weaponId: 'galil_ar', cost: 1500, ammoCost: 750, x: 19.5, y: 1.5, z: -24.75, rotY: 0 }
        ],
        grenadeWalls: [
            { id: 'nt_truck_nades', cost: 250, x: 4.0, y: 1.8, z: 1.5, rotY: -Math.PI * 0.5 }
        ],
        armorWall: null,
        mysteryBoxPads: [
            { id: 'nt_box_c', x: -6.5, y: 0, z: -7.6, rotY: 0, zone: 'spawn' },
            { id: 'nt_box_gy', x: -14.0, y: 0, z: -18.0, rotY: 0, zone: 'green_yard' },
            { id: 'nt_box_yy', x: 14.0, y: 0, z: -16.0, rotY: 0, zone: 'yellow_yard' }
        ],
        powerSwitch: null,
        powerSigns: [],
        landmarks: [
            { kind: 'nuketown_bus', x: -3.2, y: 0, z: 0 },
            { kind: 'nuketown_sign', x: 0, y: 2.3, z: 20.3, rotY: Math.PI, w: 4.4, h: 2.2 },
            { kind: 'nuketown_mushroom_cloud', x: 0, y: 0, z: -85 }
        ],
        packAPunch: null, // Dynamic Sky-Drop Pack-a-Punch lands from the sky!
        exfilPoint: { x: 0, y: 0, z: 11.5 },
        waypoints: [
            { id: 'nt_sp', x: 0, y: 0, z: 8, zone: 'spawn', links: ['nt_gh', 'nt_yh'] },
            { id: 'nt_gh', x: -16, y: 0, z: -2, zone: 'green_house', links: ['nt_sp', 'nt_gy'] },
            { id: 'nt_gy', x: -16, y: 0, z: -18, zone: 'green_yard', links: ['nt_gh'] },
            { id: 'nt_yh', x: 16, y: 0, z: -2, zone: 'yellow_house', links: ['nt_sp', 'nt_yy'] },
            { id: 'nt_yy', x: 16, y: 0, z: -18, zone: 'yellow_yard', links: ['nt_yh'] }
        ]
    };

    /* ========================================================================
       12. NUKETOWN (COD BO1 — 100% 1:1 Sunny 1950s Nevada Cul-de-Sac MP Map)
       Arena: x: -33..33, z: -28..24
    ======================================================================== */
    const MP_NUKETOWN = {
        id: 'mp_nuketown',
        name: 'NUKETOWN (BO1)',
        mode: 'mp',
        subtitle: 'COD Black Ops 1 • 1:1 1950s Nevada Atomic Test Town',
        description: 'Exact 1:1 Black Ops 1 Nuketown! Both two-story houses with garages & sniper balconies, walkthrough Teal School Bus, Yellow Moving Truck, Welcome Sign & Mannequins.',
        atmosphere: {
            skyTop: 0x2563eb, skyBottom: 0xbae6fd, fogColor: 0x93c5fd, fogDensity: 0.008,
            sunColor: 0xfff5d6, sunIntensity: 1.75, sunPos: [30, 52, 22],
            hemiSky: 0xbae6fd, hemiGround: 0x71715a, hemiIntensity: 0.85, moon: false
        },
        ramps: [
            { x: 3.0, w: 2.2, z1: 8.2, z2: 5.2, y1: 0, y2: 0.6, axis: 'z', mat: 'diamond_plate' },
            { x: -17.5, w: 2.4, z1: 5.5, z2: -1.5, y1: 0, y2: 3.1, axis: 'z', mat: 'wood_plank' },
            { x: 17.5, w: 2.4, z1: 5.5, z2: -1.5, y1: 0, y2: 3.1, axis: 'z', mat: 'wood_plank' }
        ],
        boxes: [
            boxMM(-10, -0.6, -28, 10, 0, 24, 'asphalt'),
            boxMM(-33, -0.6, -28, -10, 0, 24, 'nuketown_grass'),
            boxMM(10, -0.6, -28, 33, 0, 24, 'nuketown_grass'),
            boxMM(-33, 0, 23.2, 33, 6.2, 24, 'concrete'),
            boxMM(-33, 0, -28.0, 33, 6.2, -27.2, 'privacy_fence'),
            boxMM(-33, 0, -28.0, -32.2, 6.2, 24, 'privacy_fence'),
            boxMM(32.2, 0, -28.0, 33, 6.2, 24, 'privacy_fence'),
            // Open-Back Walkable Yellow Moving Truck + Blue Sedan
            boxMM(1.6, 0, -6.5, 4.4, 2.5, -3.5, 'truck_yellow'),
            boxMM(1.6, 0, -3.5, 4.4, 0.6, 5.2, 'diamond_plate'),
            boxMM(1.6, 0.6, -3.5, 1.85, 3.0, 5.2, 'truck_yellow'),
            boxMM(4.15, 0.6, -3.5, 4.4, 3.0, 5.2, 'truck_yellow'),
            boxMM(1.6, 2.75, -3.5, 4.4, 3.0, 5.2, 'truck_yellow'),
            boxMM(-7.5, 0, 14.5, -5.0, 1.35, 18.2, 'container_blue'),
            boxMM(-2.4, 0, 20.5, 2.4, 3.6, 21.0, 'wood_plank'),
            // Mid street sandbags & Jeep barrel cover
            boxMM(-8.5, 0, -9.5, -5.5, 1.2, -8.2, 'sandbag'),
            boxMM(5.5, 0, -9.5, 8.5, 1.2, -8.2, 'sandbag'),
            // Side Privacy Fences + Carport Garages (Walk-through flanking alleys x=±23..29!)
            boxMM(-29.2, 0, -25.0, -28.6, 3.6, 20.0, 'privacy_fence'),
            boxMM(28.6, 0, -25.0, 29.2, 3.6, 20.0, 'privacy_fence'),
            boxMM(-28.6, 3.1, -6.0, -23.0, 3.45, 5.0, 'green_siding'),
            boxMM(23.0, 3.1, -6.0, 28.6, 3.45, 5.0, 'yellow_siding'),
            // West 2-Story Green House (1F Open Doorways + 2F Bedroom Window & Back Balcony + Roof)
            ...wallWithOpeningZ(-10, 0, 3.1, -10, 8, -2.0, 2.0, 2.9, 0.55, 'green_siding'),
            ...wallWithWindowZAt(-10, 3.1, -10, 8, -6.5, -3.0, 3.1, 0.55, 'green_siding'),
            ...wallWithOpeningX(-10, 0, 6.2, -23, -10, -18.5, -14.5, 3.0, 0.55, 'green_siding'),
            boxMM(-23.3, 0, -10, -22.7, 6.2, 8, 'green_siding'),
            boxMM(-23.3, 0, 7.7, -10, 6.2, 8.3, 'green_siding'),
            boxMM(-22.7, 2.9, -9.7, -10.3, 3.1, -1.5, 'wood_plank'),
            boxMM(-23.4, 6.2, -10.4, -9.6, 6.6, 8.4, 'dark_slate_roof'),
            boxMM(-21.2, 0, 2.5, -19.5, 1.0, 6.5, 'velvet_red'),
            // East 2-Story Yellow House (1F Open Doorways + 2F Bedroom Window & Roof)
            ...wallWithOpeningZ(10, 0, 3.1, -10, 8, -2.0, 2.0, 2.9, 0.55, 'yellow_siding'),
            ...wallWithWindowZAt(10, 3.1, -10, 8, -6.5, -3.0, 3.1, 0.55, 'yellow_siding'),
            ...wallWithOpeningX(-10, 0, 6.2, 10, 23, 14.5, 18.5, 3.0, 0.55, 'yellow_siding'),
            boxMM(22.7, 0, -10, 23.3, 6.2, 8, 'yellow_siding'),
            boxMM(10, 0, 7.7, 23.3, 6.2, 8.3, 'yellow_siding'),
            boxMM(10.3, 2.9, -9.7, 22.7, 3.1, -1.5, 'wood_plank'),
            boxMM(9.6, 6.2, -10.4, 23.4, 6.6, 8.4, 'dark_slate_roof'),
            boxMM(19.5, 0, 2.5, 21.2, 1.0, 6.5, 'velvet_red'),
            // Backyard Fallout Shelter, Swing & Shrubs/Fences
            boxMM(-20.0, 0, -20.5, -15.5, 1.3, -18.5, 'wood_crate'),
            boxMM(15.5, 0, -20.5, 20.0, 1.3, -18.5, 'wood_crate'),
            boxMM(13.0, 0, -23.5, 16.5, 0.45, -21.0, 'rusted_metal'),
            boxMM(-0.3, 0, -26.5, 0.3, 2.4, -13.0, 'privacy_fence')
        ],
        lights: [
            { x: 0, y: 5.5, z: 2.0, color: 0xfff3d6, intensity: 1.0, distance: 26, alwaysOn: true }
        ],
        landmarks: [
            { kind: 'nuketown_bus', x: -3.2, y: 0, z: 0 },
            { kind: 'nuketown_sign_bo1', x: 0, y: 2.3, z: 20.3, rotY: Math.PI, w: 4.4, h: 2.2 },
            { kind: 'nuketown_mannequin', x: -7.5, y: 0, z: 8.5, rotY: 0.4, color: 0xf43f5e },
            { kind: 'nuketown_mannequin', x: 7.5, y: 0, z: 8.5, rotY: -0.4, color: 0x38bdf8 },
            { kind: 'nuketown_mannequin', x: -17.5, y: 0, z: -15.5, rotY: 0.2, color: 0xfacc15 },
            { kind: 'nuketown_mannequin', x: 17.5, y: 0, z: -15.5, rotY: -0.2, color: 0x4ade80 },
            { kind: 'nuketown_mannequin', x: -26.0, y: 0, z: 1.0, rotY: 1.2, color: 0xe2e8f0 },
            { kind: 'nuketown_mannequin', x: 26.0, y: 0, z: 1.0, rotY: -1.2, color: 0xc084fc }
        ],
        team0Spawns: [
            { x: -26, y: 0, z: 19, yaw: 0 }, { x: -20, y: 0, z: 18, yaw: 0 }, { x: -13, y: 0, z: 19, yaw: 0 },
            { x: -6, y: 0, z: 21, yaw: 0 }, { x: 0, y: 0, z: 18, yaw: 0 }, { x: 6, y: 0, z: 21, yaw: 0 },
            { x: 13, y: 0, z: 19, yaw: 0 }, { x: 20, y: 0, z: 18, yaw: 0 }, { x: 26, y: 0, z: 19, yaw: 0 },
            { x: -26, y: 0, z: 11, yaw: 0 }, { x: 26, y: 0, z: 11, yaw: 0 }, { x: -14, y: 0, z: 12, yaw: 0 },
            { x: 14, y: 0, z: 12, yaw: 0 }, { x: 0, y: 0, z: 11, yaw: 0 }, { x: -25, y: 0, z: 3, yaw: -0.6 },
            { x: 25, y: 0, z: 3, yaw: 0.6 }, { x: -16, y: 0, z: 2, yaw: 0 }, { x: 16, y: 0, z: 2, yaw: 0 },
            { x: -16, y: 3.1, z: -4, yaw: 0.4 }, { x: 16, y: 3.1, z: -4, yaw: -0.4 }
        ],
        team1Spawns: [
            { x: -25, y: 0, z: -24, yaw: Math.PI }, { x: -18, y: 0, z: -24, yaw: Math.PI }, { x: -10, y: 0, z: -24, yaw: Math.PI },
            { x: -4, y: 0, z: -23, yaw: Math.PI }, { x: 4, y: 0, z: -23, yaw: Math.PI }, { x: 10, y: 0, z: -24, yaw: Math.PI },
            { x: 18, y: 0, z: -24, yaw: Math.PI }, { x: 25, y: 0, z: -24, yaw: Math.PI }, { x: -25, y: 0, z: -15, yaw: Math.PI },
            { x: -12, y: 0, z: -15, yaw: Math.PI }, { x: 12, y: 0, z: -15, yaw: Math.PI }, { x: 25, y: 0, z: -15, yaw: Math.PI },
            { x: -5, y: 0, z: -14, yaw: Math.PI }, { x: 5, y: 0, z: -14, yaw: Math.PI }, { x: 25, y: 0, z: -5, yaw: Math.PI - 0.6 },
            { x: -25, y: 0, z: -5, yaw: Math.PI + 0.6 }, { x: -21, y: 0, z: -14, yaw: Math.PI }, { x: 21, y: 0, z: -14, yaw: Math.PI },
            { x: -26, y: 0, z: -8, yaw: Math.PI + 0.5 }, { x: 26, y: 0, z: -8, yaw: Math.PI - 0.5 }
        ],
        domFlags: [
            { id: 'A', label: 'A', x: -15.5, y: 0, z: -14.5 },
            { id: 'B', label: 'B', x: 0.0, y: 0, z: -2.0 },
            { id: 'C', label: 'C', x: 15.5, y: 0, z: -14.5 }
        ],
        hardpoints: [
            { id: 'HP1', label: 'CENTER STREET', x: 0.0, y: 0, z: -4.5, r: 4.5 },
            { id: 'HP2', label: 'GREEN GARAGE & HOUSE', x: -16.5, y: 0, z: -1.0, r: 4.5 },
            { id: 'HP3', label: 'YELLOW BACKYARD', x: 18.0, y: 0, z: -16.0, r: 4.5 },
            { id: 'HP4', label: 'CUL-DE-SAC', x: 0.0, y: 0, z: 14.0, r: 4.5 }
        ],
        waypoints: [
            { id: 'nt_sc', x: 0, y: 0, z: 15, links: ['nt_sw', 'nt_se', 'nt_bus_s', 'nt_trk'] },
            { id: 'nt_sw', x: -19, y: 0, z: 15, links: ['nt_sc', 'nt_gw_al'] },
            { id: 'nt_se', x: 19, y: 0, z: 15, links: ['nt_sc', 'nt_yw_al'] },
            { id: 'nt_gw_al', x: -26, y: 0, z: 0, links: ['nt_sw', 'nt_gy'] },
            { id: 'nt_yw_al', x: 26, y: 0, z: 0, links: ['nt_se', 'nt_yy'] },
            { id: 'nt_trk', x: 3.0, y: 0.6, z: 1, links: ['nt_sc'] },
            { id: 'nt_bus_s', x: -3.2, y: 0.28, z: 0, links: ['nt_sc', 'nt_mid'] },
            { id: 'nt_mid', x: 0, y: 0, z: -7, links: ['nt_bus_s', 'nt_nc', 'nt_gh_in', 'nt_yh_in'] },
            { id: 'nt_gh_in', x: -16, y: 0, z: -2, links: ['nt_mid', 'nt_gy', 'nt_gh_2f'] },
            { id: 'nt_gh_2f', x: -16, y: 3.1, z: -4, links: ['nt_gh_in'] },
            { id: 'nt_yh_in', x: 16, y: 0, z: -2, links: ['nt_mid', 'nt_yy', 'nt_yh_2f'] },
            { id: 'nt_yh_2f', x: 16, y: 3.1, z: -4, links: ['nt_yh_in'] },
            { id: 'nt_gy', x: -16, y: 0, z: -18, links: ['nt_gh_in', 'nt_gw_al', 'nt_nc'] },
            { id: 'nt_yy', x: 16, y: 0, z: -18, links: ['nt_yh_in', 'nt_yw_al', 'nt_nc'] },
            { id: 'nt_nc', x: 0, y: 0, z: -11.5, links: ['nt_mid', 'nt_gy', 'nt_yy'] }
        ]
    };

    /* ========================================================================
       13. SHIPMENT (COD4 — 100% 1:1 Overcast Dockyard Container Chaos MP Map)
       Arena: x: -20..20, z: -20..20
    ======================================================================== */
    const MP_SHIPMENT = {
        id: 'mp_shipment',
        name: 'SHIPMENT (COD4)',
        mode: 'mp',
        subtitle: 'COD4: Modern Warfare • 1:1 Close-Quarters Shipping Yard',
        description: 'Exact 1:1 CoD4 Shipment square! Walkthrough central `+` containers, stacked upper containers, corner pockets, dumpsters & oil barrels.',
        atmosphere: {
            skyTop: 0x334155, skyBottom: 0x64748b, fogColor: 0x526070, fogDensity: 0.014,
            sunColor: 0xdbeafe, sunIntensity: 1.25, sunPos: [-20, 42, 18],
            hemiSky: 0x94a3b8, hemiGround: 0x262930, hemiIntensity: 0.78, moon: false
        },
        boxes: [
            boxMM(-21, -0.6, -21, 21, 0, 21, 'asphalt'),
            boxMM(-21, 0, 20.2, 21, 5.8, 21, 'concrete'),
            boxMM(-21, 0, -21, 21, 5.8, -20.2, 'concrete'),
            boxMM(-21, 0, -21, -20.2, 5.8, 21, 'concrete'),
            boxMM(20.2, 0, -21, 21, 5.8, 21, 'concrete'),
            // NW Central Container (Closed Double-Stack Red)
            boxMM(-10.5, 0, -6.0, -3.0, 2.85, -3.0, 'container_red'),
            boxMM(-10.5, 2.85, -6.0, -3.0, 5.6, -3.0, 'container_olive'),
            // SW Central Container (Walk-Through Blue E-W!)
            boxMM(-10.5, 0, 2.9, -3.0, 2.85, 3.15, 'container_blue'),
            boxMM(-10.5, 0, 5.75, -3.0, 2.85, 6.0, 'container_blue'),
            boxMM(-10.5, 2.65, 2.9, -3.0, 2.9, 6.0, 'container_blue'),
            // NE Central Container (Walk-Through Olive E-W!)
            boxMM(3.0, 0, -6.0, 10.5, 2.85, -5.75, 'container_olive'),
            boxMM(3.0, 0, -3.15, 10.5, 2.85, -2.9, 'container_olive'),
            boxMM(3.0, 2.65, -6.0, 10.5, 2.9, -2.9, 'container_olive'),
            // SE Central Container (Closed Double-Stack Red)
            boxMM(3.0, 0, 3.0, 10.5, 2.85, 6.0, 'container_red'),
            boxMM(3.0, 2.85, 3.0, 10.5, 5.6, 6.0, 'container_blue'),
            // North & South Open Mid-Perimeter Crates
            boxMM(-4.0, 0, -16.8, 4.0, 2.85, -16.55, 'container_blue'),
            boxMM(-4.0, 0, -13.95, 4.0, 2.85, -13.7, 'container_blue'),
            boxMM(-4.0, 2.65, -16.8, 4.0, 2.9, -13.7, 'container_blue'),
            boxMM(-4.0, 0, 13.7, 4.0, 2.85, 13.95, 'container_red'),
            boxMM(-4.0, 0, 16.55, 4.0, 2.85, 16.8, 'container_red'),
            boxMM(-4.0, 2.65, 13.7, 4.0, 2.9, 16.8, 'container_red'),
            // 4 Outer Corner Container Pockets (Semi-open L pockets)
            boxMM(-16.8, 0, -16.8, -13.8, 2.85, -9.2, 'container_olive'),
            boxMM(13.8, 0, -16.8, 16.8, 2.85, -9.2, 'container_red'),
            boxMM(-16.8, 0, 9.2, -13.8, 2.85, 16.8, 'container_red'),
            boxMM(13.8, 0, 9.2, 16.8, 2.85, 16.8, 'container_olive'),
            // Mid-Edge Forklift, Dumpsters, Sandbags & Oil Barrels
            boxMM(-17.8, 0, -1.6, -15.4, 1.5, 1.6, 'rusted_metal'),
            boxMM(15.4, 0, -1.6, 17.8, 1.5, 1.6, 'rusted_metal'),
            boxMM(-11.2, 0, -12.0, -9.2, 1.25, -10.2, 'wood_crate'),
            boxMM(9.2, 0, 10.2, 11.2, 1.25, 12.0, 'wood_crate'),
            boxMM(-9.5, 0, 10.2, -7.8, 1.2, 11.8, 'sandbag'),
            boxMM(7.8, 0, -11.8, 9.5, 1.2, -10.2, 'sandbag')
        ],
        team0Spawns: [
            { x: -18.5, y: 0, z: 18.5, yaw: -0.7 }, { x: -10, y: 0, z: 18.5, yaw: 0 }, { x: 0, y: 0, z: 18.5, yaw: 0 },
            { x: 10, y: 0, z: 18.5, yaw: 0 }, { x: 18.5, y: 0, z: 18.5, yaw: 0.7 }, { x: -18.5, y: 0, z: 11, yaw: -0.8 },
            { x: 18.5, y: 0, z: 11, yaw: 0.8 }, { x: -6.8, y: 0, z: 15.2, yaw: -1.5 }, { x: 6.8, y: 0, z: 15.2, yaw: 1.5 },
            { x: -12, y: 0, z: 8, yaw: -0.4 }, { x: 12, y: 0, z: 8, yaw: 0.4 }, { x: -13.5, y: 0, z: 0, yaw: -1.5 },
            { x: -18.5, y: 0, z: 4.5, yaw: -1.5 }, { x: 18.5, y: 0, z: 4.5, yaw: 1.5 }
        ],
        team1Spawns: [
            { x: -18.5, y: 0, z: -18.5, yaw: Math.PI + 0.7 }, { x: -10, y: 0, z: -18.5, yaw: Math.PI }, { x: 0, y: 0, z: -18.5, yaw: Math.PI },
            { x: 10, y: 0, z: -18.5, yaw: Math.PI }, { x: 18.5, y: 0, z: -18.5, yaw: Math.PI - 0.7 }, { x: -18.5, y: 0, z: -11, yaw: Math.PI + 0.8 },
            { x: 18.5, y: 0, z: -11, yaw: Math.PI - 0.8 }, { x: -6.8, y: 0, z: -15.2, yaw: -1.5 }, { x: 6.8, y: 0, z: -15.2, yaw: 1.5 },
            { x: -12, y: 0, z: -8, yaw: Math.PI + 0.4 }, { x: 12, y: 0, z: -8, yaw: Math.PI - 0.4 }, { x: 13.5, y: 0, z: 0, yaw: 1.5 },
            { x: -18.5, y: 0, z: -4.5, yaw: -1.5 }, { x: 18.5, y: 0, z: -4.5, yaw: 1.5 }
        ],
        domFlags: [
            { id: 'A', label: 'A', x: -18.0, y: 0, z: 18.0 },
            { id: 'B', label: 'B', x: 0.0, y: 0, z: 0.0 },
            { id: 'C', label: 'C', x: 18.0, y: 0, z: -18.0 }
        ],
        hardpoints: [
            { id: 'HP1', label: 'CENTER CROSSROADS', x: 0, y: 0, z: 0, r: 3.8 },
            { id: 'HP2', label: 'SOUTH CRATE', x: 0, y: 0, z: 15.2, r: 3.6 },
            { id: 'HP3', label: 'NORTH CRATE', x: 0, y: 0, z: -15.2, r: 3.6 },
            { id: 'HP4', label: 'SW POCKET', x: -18.0, y: 0, z: 12.0, r: 3.6 }
        ],
        waypoints: [
            { id: 'sh_c', x: 0, y: 0, z: 0, links: ['sh_n', 'sh_s', 'sh_w', 'sh_e'] },
            { id: 'sh_n', x: 0, y: 0, z: -9, links: ['sh_c', 'sh_nw', 'sh_ne', 'sh_n_top'] },
            { id: 'sh_n_top', x: 0, y: 0, z: -18, links: ['sh_n', 'sh_nw', 'sh_ne'] },
            { id: 'sh_s', x: 0, y: 0, z: 9, links: ['sh_c', 'sh_sw', 'sh_se', 'sh_s_bot'] },
            { id: 'sh_s_bot', x: 0, y: 0, z: 18, links: ['sh_s', 'sh_sw', 'sh_se'] },
            { id: 'sh_w', x: -12.5, y: 0, z: 0, links: ['sh_c', 'sh_nw', 'sh_sw'] },
            { id: 'sh_e', x: 12.5, y: 0, z: 0, links: ['sh_c', 'sh_ne', 'sh_se'] },
            { id: 'sh_nw', x: -11, y: 0, z: -9, links: ['sh_n', 'sh_n_top', 'sh_w'] },
            { id: 'sh_ne', x: 11, y: 0, z: -9, links: ['sh_n', 'sh_n_top', 'sh_e'] },
            { id: 'sh_sw', x: -11, y: 0, z: 9, links: ['sh_s', 'sh_s_bot', 'sh_w'] },
            { id: 'sh_se', x: 11, y: 0, z: 9, links: ['sh_s', 'sh_s_bot', 'sh_e'] }
        ]
    };

    /* ========================================================================
       14. TERMINAL (MW2 — 100% 1:1 Zakhaev Intl Airport + Walk-Through 747 MP Map)
       Arena: x: -36..36, z: -32..32
    ======================================================================== */
    const MP_TERMINAL = {
        id: 'mp_terminal',
        name: 'TERMINAL (MW2)',
        mode: 'mp',
        subtitle: 'COD Modern Warfare 2 • 1:1 International Airport & 747 Jetliner',
        description: 'Exact 1:1 MW2 Terminal! Security Checkpoint, Bookstore, Burger Town Diner, Departure Lounge, enclosed Jetbridge, walkable 747 Airliner & Tarmac.',
        atmosphere: {
            skyTop: 0x3b82f6, skyBottom: 0xdbeafe, fogColor: 0xcbd5e1, fogDensity: 0.008,
            sunColor: 0xfff8e7, sunIntensity: 1.65, sunPos: [38, 52, -24],
            hemiSky: 0xdbeafe, hemiGround: 0x475569, hemiIntensity: 0.85, moon: false
        },
        ramps: [
            // Security Metal Detector Platform ramps
            { x: -17.0, w: 3.4, z1: 11.5, z2: 7.5, y1: 0, y2: 1.4, axis: 'z', mat: 'airport_tile' },
            { x: -17.0, w: 3.4, z1: -11.5, z2: -7.5, y1: 0, y2: 1.4, axis: 'z', mat: 'airport_tile' },
            // Gate Jetbridge Ramp up from Concourse to y=1.6
            { x1: -2.0, x2: 3.5, z: 0, w: 3.2, y1: 0, y2: 1.6, axis: 'x', mat: 'diamond_plate' },
            // 747 Rear Boarding Stairs down to Tarmac
            { x1: 22.0, x2: 28.0, z: 12.5, w: 2.6, y1: 1.6, y2: 0, axis: 'x', mat: 'diamond_plate' },
            // Maintenance Building Roof Ramp on East Tarmac
            { x: 29.0, w: 2.6, z1: -12.0, z2: -6.0, y1: 0, y2: 3.2, axis: 'z', mat: 'rusted_metal' }
        ],
        boxes: [
            // Floors: Airport Interior Terrazzo (West x:-36..3) + Concrete Tarmac (East x:3..36)
            boxMM(-36, -0.6, -32, 3, 0, 32, 'airport_tile'),
            boxMM(3, -0.6, -32, 36, 0, 32, 'concrete'),
            // Perimeter Airport & Tarmac Walls
            boxMM(-36, 0, 31.2, 36, 6.8, 32, 'concrete'),
            boxMM(-36, 0, -32, 36, 6.8, -31.2, 'concrete'),
            boxMM(-36, 0, -32, -35.2, 6.8, 32, 'concrete'),
            boxMM(35.2, 0, -32, 36, 6.8, 32, 'concrete'),
            // Full Indoor Airport Ceiling over West Concourse
            boxMM(-36, 6.2, -31.5, 3.2, 6.6, 31.5, 'ceiling_plaster'),
            // East Tarmac Partition Glass Wall separating Concourse & Tarmac (open at South Gate z:14..20, North Gate z:-24..-18, Jetbridge z:-2..2)
            boxMM(2.6, 0, -31.2, 3.2, 6.2, -24.0, 'lab_panel'),
            boxMM(2.6, 0, -18.0, 3.2, 6.2, -2.0, 'lab_panel'),
            boxMM(2.6, 0, 2.0, 3.2, 6.2, 14.0, 'lab_panel'),
            boxMM(2.6, 0, 20.0, 3.2, 6.2, 31.2, 'lab_panel'),
            // West Bookstore Wing (x:-35..-24, z:-26..-14) w/ doorway
            ...wallWithOpeningZ(-24, 0, 4.6, -26, -14, -22, -18, 3.0, 0.5, 'wood_plank'),
            boxMM(-35, 0, -14.25, -24, 4.6, -13.75, 'wood_plank'),
            boxMM(-35, 0, -26.25, -24, 4.6, -25.75, 'wood_plank'),
            // Raised Security Metal Detector Platform (x:-22..-12, z:-7.5..7.5, y=1.4) + Archways
            boxMM(-22, 0, -7.5, -12, 1.4, 7.5, 'airport_tile'),
            boxMM(-22, 1.4, -2.5, -21.2, 3.8, -1.8, 'diamond_plate'),
            boxMM(-22, 1.4, 1.8, -21.2, 3.8, 2.5, 'diamond_plate'),
            boxMM(-22, 3.6, -2.5, -21.2, 4.0, 2.5, 'diamond_plate'),
            // Central Ticket Counters & Departures Kiosks
            boxMM(-10, 0, -21, -7.5, 1.25, -15, 'wood_plank'),
            boxMM(-10, 0, -6, -7.5, 1.25, 2, 'wood_plank'),
            boxMM(-31, 0, 12, -26, 1.35, 22, 'diamond_plate'), // Baggage Carousel
            // South Burger Town Diner (x:-16..1, z:18..29.5) w/ counter & kitchen corridor
            boxMM(-16, 0, 18.0, -6.5, 3.8, 18.5, 'burger_red'),
            ...wallWithOpeningX(18.25, 0, 3.8, -6.5, 1.5, -4.5, -0.5, 3.0, 0.5, 'burger_red'),
            boxMM(-16, 0, 18.0, -15.5, 3.8, 29.5, 'burger_red'),
            boxMM(-14, 0, 22.5, -6, 1.15, 24.0, 'burger_red'), // Serving Counter
            // Enclosed Jetbridge Tunnel (x:3.2..14.0, z:-2.0..2.0, floor y=1.6)
            boxMM(3.2, 0, -2.0, 14.0, 1.6, 2.0, 'diamond_plate'),
            boxMM(3.2, 1.6, -2.2, 14.0, 4.2, -1.85, 'lab_panel'),
            boxMM(3.2, 1.6, 1.85, 14.0, 4.2, 2.2, 'lab_panel'),
            boxMM(3.2, 4.2, -2.2, 14.0, 4.5, 2.2, 'lab_panel'),
            // Walk-Through 747 Jetliner Cabin (x:14..22, z:-13..16, floor y=1.6, Roof + Nose!)
            boxMM(14.0, 0, -13.0, 22.0, 1.6, 16.0, 'plane_hull'),
            boxMM(14.0, 1.6, -13.0, 14.4, 4.4, -2.0, 'plane_hull'), // Left Fuselage w/ Jetbridge door z:-2..2
            boxMM(14.0, 1.6, 2.0, 14.4, 4.4, 16.0, 'plane_hull'),
            boxMM(21.6, 1.6, -13.0, 22.0, 4.4, 10.5, 'plane_hull'), // Right Fuselage w/ Rear Stairs door z:10.5..14.5
            boxMM(21.6, 1.6, 14.5, 22.0, 4.4, 16.0, 'plane_hull'),
            boxMM(14.0, 1.6, 15.6, 22.0, 4.4, 16.0, 'plane_hull'),
            boxMM(14.0, 1.6, -16.5, 22.0, 4.2, -13.0, 'plane_hull'), // Cockpit Nose
            boxMM(14.0, 4.4, -13.2, 22.0, 4.75, 16.0, 'plane_hull'), // Cabin Roof
            boxMM(16.0, 1.6, -7.0, 17.5, 2.6, 6.0, 'velvet_red'), // Row seats
            boxMM(18.8, 1.6, -7.0, 20.3, 2.6, 6.0, 'velvet_red'),
            // East Tarmac Fuel Truck, Crates & Climbable Maintenance Building
            boxMM(26.0, 0, -23.0, 30.0, 2.1, -17.0, 'container_red'),
            boxMM(25.0, 0, -6.0, 33.0, 3.2, 4.0, 'concrete'), // Tarmac Maintenance Roof Platform
            boxMM(25.0, 3.2, -6.0, 25.4, 4.25, 4.0, 'diamond_plate'),
            boxMM(24.0, 0, 21.0, 28.5, 1.5, 24.5, 'container_olive')
        ],
        landmarks: [
            { kind: 'terminal_plane_wings', x: 18.0, y: 1.6, z: 2.0 },
            { kind: 'terminal_burger_sign', x: -11.0, y: 4.5, z: 18.0, rotY: Math.PI, w: 5.5, h: 1.6 },
            { kind: 'terminal_departures', x: -8.5, y: 4.6, z: -26.0, rotY: 0, w: 6.4, h: 1.9 }
        ],
        team0Spawns: [
            { x: -31, y: 0, z: 26, yaw: 0 }, { x: -23, y: 0, z: 27, yaw: 0 }, { x: -12, y: 0, z: 27, yaw: 0 },
            { x: -2, y: 0, z: 26, yaw: 0 }, { x: -31, y: 0, z: 7, yaw: -0.5 }, { x: -24, y: 0, z: 7, yaw: 0 },
            { x: -9, y: 0, z: 12, yaw: -0.3 }, { x: -2, y: 0, z: 12, yaw: 0 }, { x: 8, y: 0, z: 26, yaw: -0.4 },
            { x: 18, y: 0, z: 26, yaw: 0 }, { x: 31, y: 0, z: 26, yaw: 0.4 }, { x: 8, y: 0, z: 16, yaw: 0 },
            { x: 31, y: 0, z: 12, yaw: 0.5 }, { x: -18, y: 0, z: 15, yaw: 0 }, { x: -29, y: 0, z: -2, yaw: -1.4 },
            { x: 12, y: 0, z: 8, yaw: 0 }
        ],
        team1Spawns: [
            { x: -31, y: 0, z: -28, yaw: Math.PI }, { x: -20, y: 0, z: -28, yaw: Math.PI }, { x: -10, y: 0, z: -28, yaw: Math.PI },
            { x: -2, y: 0, z: -26, yaw: Math.PI }, { x: 8, y: 0, z: -26, yaw: Math.PI }, { x: 19, y: 0, z: -26, yaw: Math.PI },
            { x: 31, y: 0, z: -27, yaw: Math.PI - 0.3 }, { x: 32, y: 0, z: -15, yaw: Math.PI - 0.5 }, { x: 8, y: 0, z: -16, yaw: Math.PI },
            { x: -19, y: 0, z: -18, yaw: Math.PI }, { x: -30, y: 0, z: -10, yaw: Math.PI + 0.5 }, { x: -12, y: 0, z: -11, yaw: Math.PI },
            { x: -2, y: 0, z: -10, yaw: Math.PI }, { x: 8, y: 0, z: -8, yaw: Math.PI - 0.4 }, { x: 24, y: 0, z: -9, yaw: Math.PI },
            { x: -28, y: 0, z: -20, yaw: Math.PI + 0.3 }
        ],
        domFlags: [
            { id: 'A', label: 'A', x: -27.0, y: 0, z: 24.0 },
            { id: 'B', label: 'B', x: -3.0, y: 0, z: -2.0 },
            { id: 'C', label: 'C', x: 18.0, y: 1.6, z: 0.0 }
        ],
        hardpoints: [
            { id: 'HP1', label: 'MAIN CONCOURSE', x: -4.0, y: 0, z: 0, r: 4.8 },
            { id: 'HP2', label: '747 AIRLINER CABIN', x: 18.0, y: 1.6, z: 1.0, r: 4.0 },
            { id: 'HP3', label: 'BURGER TOWN', x: -10.0, y: 0, z: 25.0, r: 4.5 },
            { id: 'HP4', label: 'BOOKSTORE LOBBY', x: -29.0, y: 0, z: -20.0, r: 4.5 }
        ],
        waypoints: [
            { id: 'tm_sw', x: -28, y: 0, z: 26, links: ['tm_sec_s', 'tm_bg'] },
            { id: 'tm_bt', x: -10, y: 0, z: 25, links: ['tm_hall_s'] },
            { id: 'tm_bg', x: -29, y: 0, z: 0, links: ['tm_sw', 'tm_bk'] },
            { id: 'tm_sec_s', x: -17, y: 0, z: 13, links: ['tm_sw', 'tm_sec_c', 'tm_hall_s'] },
            { id: 'tm_sec_c', x: -17, y: 1.4, z: 0, links: ['tm_sec_s', 'tm_sec_n'] },
            { id: 'tm_sec_n', x: -17, y: 0, z: -13, links: ['tm_sec_c', 'tm_bk', 'tm_hall_n'] },
            { id: 'tm_bk', x: -28, y: 0, z: -20, links: ['tm_bg', 'tm_sec_n', 'tm_nw'] },
            { id: 'tm_nw', x: -15, y: 0, z: -25, links: ['tm_bk', 'tm_hall_n'] },
            { id: 'tm_hall_s', x: -3, y: 0, z: 16, links: ['tm_bt', 'tm_sec_s', 'tm_hall_c', 'tm_tar_s'] },
            { id: 'tm_hall_c', x: -4, y: 0, z: 0, links: ['tm_hall_s', 'tm_hall_n', 'tm_jb'] },
            { id: 'tm_hall_n', x: -3, y: 0, z: -20, links: ['tm_hall_c', 'tm_nw', 'tm_sec_n', 'tm_tar_n'] },
            { id: 'tm_jb', x: 8, y: 1.6, z: 0, links: ['tm_hall_c', 'tm_plane'] },
            { id: 'tm_plane', x: 18, y: 1.6, z: 1, links: ['tm_jb', 'tm_plane_r'] },
            { id: 'tm_plane_r', x: 28, y: 0, z: 12, links: ['tm_plane', 'tm_tar_s', 'tm_roof_s'] },
            { id: 'tm_tar_s', x: 14, y: 0, z: 22, links: ['tm_hall_s', 'tm_plane_r'] },
            { id: 'tm_tar_n', x: 14, y: 0, z: -22, links: ['tm_hall_n', 'tm_roof_s'] },
            { id: 'tm_roof_s', x: 29, y: 0, z: -13, links: ['tm_tar_n', 'tm_plane_r', 'tm_roof_top'] },
            { id: 'tm_roof_top', x: 29, y: 3.2, z: -1, links: ['tm_roof_s'] }
        ]
    };

    /* ========================================================================
       15. RUST (MW2 — 100% 1:1 Desert Oil Yard & 3-Tier Oil Derrick Tower MP Map)
       Arena: x: -24..24, z: -24..24
    ======================================================================== */
    const MP_RUST = {
        id: 'mp_rust',
        name: 'RUST (MW2)',
        mode: 'mp',
        subtitle: 'COD Modern Warfare 2 • 1:1 Desert Oil Derrick Arena',
        description: 'Exact 1:1 MW2 Rust! Iconic 3-tier climbable center Oil Derrick Tower, walkthrough Steel Oil Pipe, Silo Tanks, Shipping Crate & Oil Shed.',
        atmosphere: {
            skyTop: 0x92400e, skyBottom: 0xfed7aa, fogColor: 0xd99b66, fogDensity: 0.015,
            sunColor: 0xffedd5, sunIntensity: 1.75, sunPos: [32, 48, 26],
            hemiSky: 0xfde68a, hemiGround: 0x78350f, hemiIntensity: 0.80, moon: false
        },
        ramps: [
            // Ramp Ground -> Tier 1 Tower Deck (West side x: -11.5 -> -5.5, z: 0, y: 0 -> 2.8)
            { x1: -11.5, x2: -5.5, z: 0, w: 2.6, y1: 0, y2: 2.8, axis: 'x', mat: 'rust_steel' },
            // Ramp Tier 1 -> Tier 2 Deck (North inner switchback x: 4.8 -> -2.6, z: -4.1, y: 2.8 -> 5.6)
            { x1: 4.8, x2: -2.6, z: -4.1, w: 1.8, y1: 2.8, y2: 5.6, axis: 'x', mat: 'rust_steel' },
            // Ramp Tier 2 -> Tier 3 Top Sniper Nest (South switchback x: -3.4 -> 1.8, z: 2.6, y: 5.6 -> 8.2)
            { x1: -3.4, x2: 1.8, z: 2.6, w: 1.8, y1: 5.6, y2: 8.2, axis: 'x', mat: 'rust_steel' }
        ],
        boxes: [
            boxMM(-24, -0.6, -24, 24, 0, 24, 'desert_sand'),
            boxMM(-24, 0, 23.2, 24, 5.4, 24, 'rust_steel'),
            boxMM(-24, 0, -24, 24, 5.4, -23.2, 'rust_steel'),
            boxMM(-24, 0, -24, -23.2, 5.4, 24, 'rust_steel'),
            boxMM(23.2, 0, -24, 24, 5.4, 24, 'rust_steel'),
            // Central 3-Tier Oil Derrick Tower Platforms + Support Columns
            boxMM(-5.8, 0, -5.8, -5.1, 8.2, -5.1, 'rust_steel'),
            boxMM(5.1, 0, -5.8, 5.8, 8.2, -5.1, 'rust_steel'),
            boxMM(-5.8, 0, 5.1, -5.1, 8.2, 5.8, 'rust_steel'),
            boxMM(5.1, 0, 5.1, 5.8, 8.2, 5.8, 'rust_steel'),
            boxMM(-5.6, 2.55, -5.6, 5.6, 2.8, 5.6, 'diamond_plate'),  // Tier 1 Deck
            boxMM(-4.0, 5.35, -4.0, 4.0, 5.6, 4.0, 'diamond_plate'),  // Tier 2 Deck
            boxMM(-2.4, 7.95, -2.4, 2.4, 8.2, 2.4, 'diamond_plate'),  // Tier 3 Top Sniper Nest
            boxMM(-2.4, 8.2, -2.4, 2.4, 9.05, -2.1, 'rust_steel'),    // Low top cover
            // West Walk-Through Steel Oil Pipe Tunnel (x:-16.5..-13.5, z:-6..10)
            boxMM(-16.5, 0, -6.0, -16.1, 2.25, 10.0, 'rust_steel'),
            boxMM(-13.9, 0, -6.0, -13.5, 2.25, 10.0, 'rust_steel'),
            boxMM(-16.5, 2.25, -6.0, -13.5, 2.55, 10.0, 'rust_steel'),
            // NW Corner Corrugated Oil Shed / Bunker (open doorway East & South)
            boxMM(-21.0, 0, -21.0, -14.0, 3.2, -20.5, 'rust_steel'),
            boxMM(-21.0, 0, -21.0, -20.5, 3.2, -13.5, 'rust_steel'),
            boxMM(-14.5, 0, -21.0, -14.0, 3.2, -17.0, 'rust_steel'),
            boxMM(-21.0, 3.2, -21.0, -14.0, 3.5, -13.5, 'rust_steel'),
            // NE Industrial Oil Storage Tanks
            boxMM(13.0, 0, -19.5, 19.5, 4.8, -13.0, 'rusted_metal'),
            boxMM(14.5, 0, -10.5, 19.0, 2.6, -6.5, 'rust_steel'),
            // SE Red Shipping Container + Concrete Oil Pipes
            boxMM(11.0, 0, 10.0, 18.5, 2.8, 13.2, 'container_red'),
            boxMM(9.5, 0, 16.5, 15.5, 1.3, 18.5, 'concrete'),
            // SW Corner Concrete Blockade & Barrels
            boxMM(-18.5, 0, 13.5, -12.5, 1.45, 16.0, 'concrete'),
            boxMM(-7.0, 0, 13.5, -3.5, 1.25, 15.0, 'sandbag'),
            boxMM(3.5, 0, -15.5, 7.5, 1.25, -13.5, 'sandbag'),
            boxMM(-2.5, 0, 16.5, 2.5, 1.35, 18.2, 'wood_crate')
        ],
        landmarks: [
            { kind: 'rust_derrick_spire', x: 0, y: 8.2, z: 0 }
        ],
        team0Spawns: [
            { x: -19, y: 0, z: 20, yaw: 0 }, { x: -10, y: 0, z: 20, yaw: 0 }, { x: 0, y: 0, z: 20, yaw: 0 },
            { x: 10, y: 0, z: 20, yaw: 0 }, { x: 19, y: 0, z: 20, yaw: 0.4 }, { x: -20, y: 0, z: 10, yaw: -0.6 },
            { x: 20, y: 0, z: 15, yaw: 0.5 }, { x: 20, y: 0, z: 6, yaw: 0.8 }, { x: -10, y: 0, z: 10, yaw: 0 },
            { x: 6, y: 0, z: 12, yaw: 0 }, { x: -19, y: 0, z: 3, yaw: -1.1 }, { x: 19, y: 0, z: 1, yaw: 1.2 },
            { x: -8, y: 0, z: 18, yaw: 0 }, { x: 8, y: 0, z: 15, yaw: 0 },
            { x: -15, y: 0, z: 2, yaw: 0 }, { x: -2, y: 2.8, z: 2, yaw: 0 }, { x: 15, y: 0, z: 7, yaw: 0.6 }
        ],
        team1Spawns: [
            { x: -19, y: 0, z: -20, yaw: Math.PI }, { x: -10, y: 0, z: -20, yaw: Math.PI }, { x: 0, y: 0, z: -20, yaw: Math.PI },
            { x: 10, y: 0, z: -20, yaw: Math.PI }, { x: 20, y: 0, z: -20, yaw: Math.PI - 0.5 }, { x: -20, y: 0, z: -10, yaw: Math.PI + 0.6 },
            { x: 21, y: 0, z: -12, yaw: Math.PI - 0.7 }, { x: 20, y: 0, z: -4, yaw: Math.PI - 0.9 }, { x: -10, y: 0, z: -10, yaw: Math.PI },
            { x: 8, y: 0, z: -11, yaw: Math.PI }, { x: -19, y: 0, z: -3, yaw: Math.PI + 1.0 }, { x: 18, y: 0, z: -2, yaw: Math.PI - 1.0 },
            { x: -16, y: 0, z: -16, yaw: Math.PI + 0.5 }, { x: 0, y: 0, z: -15, yaw: Math.PI },
            { x: -17, y: 0, z: -17, yaw: Math.PI + 0.6 }, { x: 2, y: 2.8, z: -2, yaw: Math.PI }, { x: 12, y: 0, z: -16, yaw: Math.PI }
        ],
        domFlags: [
            { id: 'A', label: 'A', x: -16.5, y: 0, z: 18.5 },
            { id: 'B', label: 'B', x: 0.0, y: 2.8, z: 0.0 },
            { id: 'C', label: 'C', x: 17.0, y: 0, z: -20.5 }
        ],
        hardpoints: [
            { id: 'HP1', label: 'TOWER BASE (UNDERNEATH)', x: 0, y: 0, z: 0, r: 4.5 },
            { id: 'HP2', label: 'PIPE TUNNEL', x: -15.0, y: 0, z: 2.0, r: 3.5 },
            { id: 'HP3', label: 'SE CRATE YARD', x: 14.0, y: 0, z: 6.0, r: 4.5 },
            { id: 'HP4', label: 'NORTH ROAD', x: 0, y: 0, z: -18.0, r: 4.5 }
        ],
        waypoints: [
            { id: 'rs_c', x: 0, y: 0, z: 0, links: ['rs_s', 'rs_n', 'rs_w', 'rs_e'] },
            { id: 'rs_s', x: 0, y: 0, z: 12, links: ['rs_c', 'rs_sw', 'rs_se'] },
            { id: 'rs_n', x: 0, y: 0, z: -12, links: ['rs_c', 'rs_nw', 'rs_ne'] },
            { id: 'rs_w', x: -12, y: 0, z: 0, links: ['rs_c', 'rs_sw', 'rs_nw', 'rs_t1'] },
            { id: 'rs_e', x: 12, y: 0, z: 0, links: ['rs_c', 'rs_se', 'rs_ne'] },
            { id: 'rs_sw', x: -16, y: 0, z: 18.0, links: ['rs_s', 'rs_w'] },
            { id: 'rs_se', x: 16, y: 0, z: 16, links: ['rs_s', 'rs_e'] },
            { id: 'rs_nw', x: -17, y: 0, z: -17, links: ['rs_n', 'rs_w'] },
            { id: 'rs_ne', x: 12, y: 0, z: -18, links: ['rs_n', 'rs_e'] },
            { id: 'rs_t1', x: -2, y: 2.8, z: 0, links: ['rs_w', 'rs_t2'] },
            { id: 'rs_t2', x: 0, y: 5.6, z: 0, links: ['rs_t1', 'rs_t3'] },
            { id: 'rs_t3', x: 0, y: 8.2, z: 0, links: ['rs_t2'] }
        ]
    };

    /* ========================================================================
       16-18. TOWER DEFENSE CASTLE MAPS (3 Setups — 3 Wall Layers x 250 HP + 100 HP Heart)
       - Player spawns ON TOP OF CASTLE overlooking zombies + walkable stairs!
       - Castle 1: Zombies ONLY from Front (North)
       - Castle 2: Zombies from Front + Left/Right Sides
       - Castle 3: Zombies from ALL 4 Directions (360°)
    ======================================================================== */
    const TD_CASTLE_1 = {
        id: 'td_castle_1',
        name: 'CASTLE 1 — FRONTAL CITADEL',
        mode: 'td',
        castleSetup: 'front',
        subtitle: '5x Grand Siege Corridor • Front Only • 3 See-Through Wall Layers (250 HP)',
        description: 'Defend the massive 140m canyon fortress! Zombies march a long distance strictly from the North approach through your 3 see-through barrier layers before climbing the Castle Stairs to the Heart.',
        atmosphere: {
            skyTop: 0x091124, skyBottom: 0x451a38, fogColor: 0x1a1026, fogDensity: 0.0018,
            sunColor: 0xfdba74, sunIntensity: 1.48, sunPos: [28, 65, -72],
            hemiSky: 0x7dd3fc, hemiGround: 0x1c1917, hemiIntensity: 0.80, moon: true
        },
        playerSpawn: { x: 0, y: 5.4, z: 11.2, yaw: 0 },
        castleHeart: { x: 0, y: 5.4, z: 20.6 },
        shopkeeperPos: { x: 14.2, y: 5.4, z: 21.6, rotY: Math.PI },
        turretPads: [
            { x: -5.5, y: 5.4, z: 7.5 },
            { x: 5.5, y: 5.4, z: 7.5 },
            { x: -10.0, y: 0, z: -26.0 },
            { x: 10.0, y: 0, z: -26.0 },
            { x: -10.0, y: 0, z: -72.0 },
            { x: 10.0, y: 0, z: -72.0 }
        ],
        defenseLayers: [
            { layer: 1, name: 'LAYER 1 — OUTER BASTION BARRIER', maxHp: 250, segments: [
                { x: 0, y: 0, z: -96.0, w: 48.0, h: 4.2, d: 1.0, mat: 'wood_fort' }
            ]},
            { layer: 2, name: 'LAYER 2 — INNER RAMPARTS BARRIER', maxHp: 250, segments: [
                { x: 0, y: 0, z: -52.0, w: 48.0, h: 4.2, d: 1.0, mat: 'castle_battlement' }
            ]},
            { layer: 3, name: 'LAYER 3 — FINAL STAIRCASE GATE', maxHp: 250, segments: [
                { x: 0, y: 0, z: -10.5, w: 48.0, h: 4.4, d: 1.0, mat: 'castle_stone' }
            ]}
        ],
        spawners: [
            { x: -19, y: 0, z: -138 }, { x: -12, y: 0, z: -140 }, { x: -5, y: 0, z: -141 },
            { x: 5, y: 0, z: -141 }, { x: 12, y: 0, z: -140 }, { x: 19, y: 0, z: -138 },
            { x: -20, y: 0, z: -126 }, { x: -10, y: 0, z: -128 }, { x: 0, y: 0, z: -130 },
            { x: 10, y: 0, z: -128 }, { x: 20, y: 0, z: -126 }, { x: 0, y: 0, z: -122 }
        ],
        stairTopPoint: { x: 0, y: 5.4, z: 8.6 },
        stairBottomPoint: { x: 0, y: 0, z: -5.0 },
        stairs: [
            { bot: { x: 0, y: 0, z: -5.0 }, top: { x: 0, y: 5.4, z: 8.6 }, axis: 'z', halfWidth: 3.1 }
        ],
        ramps: [
            // Wide gentle Castle Stairs (6.4m wide, 11.4m run, ZERO vertical top lip!) descending Keep (z=7.6, y=5.4) -> Ground (z=-3.8, y=0)
            { x: 0, w: 6.4, z1: 7.6, z2: -3.8, y1: 5.4, y2: 0, axis: 'z', mat: 'castle_battlement' }
        ],
        boxes: [
            boxMM(-24, -0.6, -145, 24, 0, 24, 'concrete'),
            // High Canyon Walls sealing West/East/South/North (5x longer 169m siege corridor!)
            boxMM(-25.5, 0, -145, -24.0, 10.0, 24, 'castle_stone'),
            boxMM(24.0, 0, -145, 25.5, 10.0, 24, 'castle_stone'),
            boxMM(-25.5, 0, 23.0, 25.5, 10.0, 24.5, 'castle_stone'),
            boxMM(-25.5, 0, -145.5, 25.5, 10.0, -144.0, 'castle_stone'),
            // Elevated Castle Keep Deck (y = 5.4) notched cleanly around the 6.4m stair opening (x:-3.2..3.2, z:6.2..7.6 open!)
            boxMM(-24.0, 0, 6.2, -3.2, 5.4, 23.0, 'castle_stone'),
            boxMM(3.2, 0, 6.2, 24.0, 5.4, 23.0, 'castle_stone'),
            boxMM(-3.2, 0, 7.6, 3.2, 5.4, 23.0, 'castle_stone'),
            // Low Battlement Crenellations overlooking Grand North Approach (open center stairs mouth!)
            boxMM(-23.5, 5.4, 6.2, -3.3, 6.45, 6.8, 'castle_battlement'),
            boxMM(3.3, 5.4, 6.2, 23.5, 6.45, 6.8, 'castle_battlement'),
            // Tactical battlefield cover along the 140m siege approach
            boxMM(-13.0, 0, -28.0, -8.0, 1.25, -26.8, 'sandbag'),
            boxMM(8.0, 0, -28.0, 13.0, 1.25, -26.8, 'sandbag'),
            boxMM(-14.0, 0, -72.0, -9.0, 1.35, -70.5, 'wood_crate'),
            boxMM(9.0, 0, -72.0, 14.0, 1.35, -70.5, 'wood_crate'),
            boxMM(-12.0, 0, -114.0, -7.0, 1.25, -112.5, 'sandbag'),
            boxMM(7.0, 0, -114.0, 12.0, 1.25, -112.5, 'sandbag')
        ],
        lights: [
            { x: 0, y: 8.5, z: 13.5, color: 0x38bdf8, intensity: 1.9, distance: 36, alwaysOn: true },
            { x: -14, y: 1.8, z: -28, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: 14, y: 1.8, z: -28, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: -14, y: 1.8, z: -72, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: 14, y: 1.8, z: -72, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: -14, y: 1.8, z: -114, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: 14, y: 1.8, z: -114, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true }
        ],
        landmarks: [
            { kind: 'castle_banner', x: -6.5, y: 7.4, z: 6.5, color: 0x1d4ed8 },
            { kind: 'castle_banner', x: 6.5, y: 7.4, z: 6.5, color: 0x1d4ed8 },
            { kind: 'castle_banner', x: -23.5, y: 7.4, z: -26, color: 0x1e40af },
            { kind: 'castle_banner', x: 23.5, y: 7.4, z: -26, color: 0x1e40af },
            { kind: 'castle_banner', x: -23.5, y: 7.4, z: -72, color: 0x1e40af },
            { kind: 'castle_banner', x: 23.5, y: 7.4, z: -72, color: 0x1e40af }
        ],
        waypoints: [
            { id: 'td1_top', x: 0, y: 5.4, z: 13, links: ['td1_mid_s'] },
            { id: 'td1_mid_s', x: 0, y: 2.7, z: 1.9, links: ['td1_top', 'td1_bot'] },
            { id: 'td1_bot', x: 0, y: 0, z: -5.0, links: ['td1_mid_s', 'td1_m1'] },
            { id: 'td1_m1', x: 0, y: 0, z: -45.0, links: ['td1_bot', 'td1_m2'] },
            { id: 'td1_m2', x: 0, y: 0, z: -90.0, links: ['td1_m1', 'td1_n'] },
            { id: 'td1_n', x: 0, y: 0, z: -130.0, links: ['td1_m2'] }
        ]
    };

    const TD_CASTLE_2 = {
        id: 'td_castle_2',
        name: 'CASTLE 2 — THREE-FRONT FORTRESS',
        mode: 'td',
        castleSetup: 'front_sides',
        subtitle: '5x Vast Three-Front Siege • Front, Left & Right • 3 See-Through Wall Layers',
        description: 'Massive 130m three-front battlefield! Zombies march from North, West, and East across 3 giant see-through U-barriers before storming the Castle Stairs.',
        atmosphere: {
            skyTop: 0x0a1328, skyBottom: 0x5c200a, fogColor: 0x261209, fogDensity: 0.0018,
            sunColor: 0xfb923c, sunIntensity: 1.52, sunPos: [-42, 66, -62],
            hemiSky: 0xfdba74, hemiGround: 0x1c1412, hemiIntensity: 0.78, moon: true
        },
        playerSpawn: { x: 0, y: 5.4, z: 11.2, yaw: 0 },
        castleHeart: { x: 0, y: 5.4, z: 20.8 },
        shopkeeperPos: { x: 9.2, y: 5.4, z: 21.6, rotY: Math.PI },
        turretPads: [
            { x: -5.5, y: 5.4, z: 7.5 }, { x: 5.5, y: 5.4, z: 7.5 },
            { x: -16.0, y: 0, z: -18.0 }, { x: 16.0, y: 0, z: -18.0 },
            { x: -32.0, y: 0, z: -32.0 }, { x: 32.0, y: 0, z: -32.0 }
        ],
        defenseLayers: [
            { layer: 1, name: 'LAYER 1 — OUTER U-BASTION BARRIER', maxHp: 250, segments: [
                { x: 0, y: 0, z: -88.0, w: 176.0, h: 4.2, d: 1.0, mat: 'wood_fort' },
                { x: -88.0, y: 0, z: -32.5, w: 1.0, h: 4.2, d: 111.0, mat: 'wood_fort' },
                { x: 88.0, y: 0, z: -32.5, w: 1.0, h: 4.2, d: 111.0, mat: 'wood_fort' }
            ]},
            { layer: 2, name: 'LAYER 2 — INNER KURTAIN BARRIER', maxHp: 250, segments: [
                { x: 0, y: 0, z: -46.0, w: 92.0, h: 4.2, d: 1.0, mat: 'castle_battlement' },
                { x: -46.0, y: 0, z: -11.5, w: 1.0, h: 4.2, d: 69.0, mat: 'castle_battlement' },
                { x: 46.0, y: 0, z: -11.5, w: 1.0, h: 4.2, d: 69.0, mat: 'castle_battlement' }
            ]},
            { layer: 3, name: 'LAYER 3 — FINAL STAIRCASE SEAL', maxHp: 250, segments: [
                { x: 0, y: 0, z: -10.5, w: 22.0, h: 4.4, d: 1.0, mat: 'castle_stone' },
                { x: -11.0, y: 0, z: -2.15, w: 1.0, h: 4.4, d: 16.7, mat: 'castle_stone' },
                { x: 11.0, y: 0, z: -2.15, w: 1.0, h: 4.4, d: 16.7, mat: 'castle_stone' }
            ]}
        ],
        spawners: [
            { x: -72, y: 0, z: -128 }, { x: -42, y: 0, z: -129 }, { x: -14, y: 0, z: -130 },
            { x: 14, y: 0, z: -130 }, { x: 42, y: 0, z: -129 }, { x: 72, y: 0, z: -128 },
            { x: -116, y: 0, z: -116 }, { x: 116, y: 0, z: -116 },
            { x: -128, y: 0, z: -76 }, { x: -129, y: 0, z: -48 }, { x: -128, y: 0, z: -22 },
            { x: -128, y: 0, z: 2 }, { x: -126, y: 0, z: 16 },
            { x: 128, y: 0, z: -76 }, { x: 129, y: 0, z: -48 }, { x: 128, y: 0, z: -22 },
            { x: 128, y: 0, z: 2 }, { x: 126, y: 0, z: 16 }
        ],
        stairTopPoint: { x: 0, y: 5.4, z: 8.6 },
        stairBottomPoint: { x: 0, y: 0, z: -5.0 },
        stairs: [
            { bot: { x: 0, y: 0, z: -5.0 }, top: { x: 0, y: 5.4, z: 8.6 }, axis: 'z', halfWidth: 3.1 }
        ],
        ramps: [
            { x: 0, w: 6.4, z1: 7.6, z2: -3.8, y1: 5.4, y2: 0, axis: 'z', mat: 'castle_battlement' }
        ],
        boxes: [
            boxMM(-135, -0.6, -135, 135, 0, 24, 'concrete'),
            // Outer battlefield perimeter enclosing 270x159m arena + sealing South back wall
            boxMM(-135, 0, 23.0, 135, 9.5, 24, 'castle_stone'),
            boxMM(-135, 0, -135, 135, 9.5, -134.0, 'castle_stone'),
            boxMM(-135, 0, -135, -134.0, 9.5, 24, 'castle_stone'),
            boxMM(134.0, 0, -135, 135, 9.5, 24, 'castle_stone'),
            // Elevated Castle Keep against South Wall notched cleanly around 6.4m stairs
            boxMM(-11.0, 0, 6.2, -3.2, 5.4, 23.0, 'castle_stone'),
            boxMM(3.2, 0, 6.2, 11.0, 5.4, 23.0, 'castle_stone'),
            boxMM(-3.2, 0, 7.6, 3.2, 5.4, 23.0, 'castle_stone'),
            boxMM(-11.0, 5.4, 6.2, -3.3, 6.45, 6.8, 'castle_battlement'),
            boxMM(3.3, 5.4, 6.2, 11.0, 6.45, 6.8, 'castle_battlement'),
            boxMM(-11.0, 5.4, 6.2, -10.4, 6.45, 10.4, 'castle_battlement'),
            boxMM(-11.0, 5.4, 17.6, -10.4, 6.45, 23.0, 'castle_battlement'),
            boxMM(10.4, 5.4, 6.2, 11.0, 6.45, 10.4, 'castle_battlement'),
            boxMM(10.4, 5.4, 17.6, 11.0, 6.45, 23.0, 'castle_battlement'),
            // Courtyard cover
            boxMM(-28, 0, -24, -24, 1.35, -21, 'wood_crate'),
            boxMM(24, 0, -24, 28, 1.35, -21, 'wood_crate'),
            boxMM(-68, 0, -64, -63, 1.35, -60, 'sandbag'),
            boxMM(63, 0, -64, 68, 1.35, -60, 'sandbag')
        ],
        lights: [
            { x: 0, y: 8.5, z: 13.0, color: 0x38bdf8, intensity: 1.9, distance: 36, alwaysOn: true },
            { x: -24, y: 1.8, z: -26, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: 24, y: 1.8, z: -26, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: -64, y: 1.8, z: -64, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: 64, y: 1.8, z: -64, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true }
        ],
        landmarks: [
            { kind: 'castle_banner', x: -7.5, y: 7.4, z: 6.5, color: 0xd97706 },
            { kind: 'castle_banner', x: 7.5, y: 7.4, z: 6.5, color: 0xd97706 },
            { kind: 'castle_banner', x: -10.5, y: 7.4, z: 14.0, color: 0xb45309 },
            { kind: 'castle_banner', x: 10.5, y: 7.4, z: 14.0, color: 0xb45309 }
        ],
        waypoints: [
            { id: 'td2_top', x: 0, y: 5.4, z: 13, links: ['td2_mid_s'] },
            { id: 'td2_mid_s', x: 0, y: 2.7, z: 1.9, links: ['td2_top', 'td2_bot'] },
            { id: 'td2_bot', x: 0, y: 0, z: -5.0, links: ['td2_mid_s', 'td2_n', 'td2_w', 'td2_e'] },
            { id: 'td2_n', x: 0, y: 0, z: -90.0, links: ['td2_bot'] },
            { id: 'td2_w', x: -90.0, y: 0, z: -10.0, links: ['td2_bot'] },
            { id: 'td2_e', x: 90.0, y: 0, z: -10.0, links: ['td2_bot'] }
        ]
    };

    const TD_CASTLE_3 = {
        id: 'td_castle_3',
        name: 'CASTLE 3 — 360° BASTION KEEP',
        mode: 'td',
        castleSetup: 'all',
        subtitle: '5x Vast 360° Siege • ALL 4 DIRECTIONS • 3 Concentric See-Through Rings',
        description: 'Massive 270x270m 360° fortress siege! Command the central skytower overlooking North, South, East, and West across 3 concentric see-through defense rings protecting both Castle Staircases and the Heart.',
        atmosphere: {
            skyTop: 0x160516, skyBottom: 0x4f0e26, fogColor: 0x200814, fogDensity: 0.0018,
            sunColor: 0xfca5a5, sunIntensity: 1.48, sunPos: [45, 70, -45],
            hemiSky: 0xf43f5e, hemiGround: 0x181416, hemiIntensity: 0.78, moon: true
        },
        playerSpawn: { x: -2.4, y: 5.4, z: 2.8, yaw: 0 },
        castleHeart: { x: 0, y: 5.4, z: 0.0 },
        shopkeeperPos: { x: 7.4, y: 5.4, z: 6.2, rotY: -Math.PI * 0.75 },
        turretPads: [
            { x: -8.2, y: 5.4, z: -3.6 }, { x: 8.2, y: 5.4, z: -3.6 },
            { x: -8.2, y: 5.4, z: 3.6 }, { x: 8.2, y: 5.4, z: 3.6 }
        ],
        defenseLayers: [
            { layer: 1, name: 'LAYER 1 — OUTER 360° BARRIER RING', maxHp: 250, segments: [
                { x: 0, y: 0, z: -88.0, w: 176.0, h: 4.2, d: 1.0, mat: 'wood_fort' },
                { x: 0, y: 0, z: 88.0, w: 176.0, h: 4.2, d: 1.0, mat: 'wood_fort' },
                { x: -88.0, y: 0, z: 0, w: 1.0, h: 4.2, d: 176.0, mat: 'wood_fort' },
                { x: 88.0, y: 0, z: 0, w: 1.0, h: 4.2, d: 176.0, mat: 'wood_fort' }
            ]},
            { layer: 2, name: 'LAYER 2 — INNER CITADEL BARRIER RING', maxHp: 250, segments: [
                { x: 0, y: 0, z: -48.0, w: 96.0, h: 4.2, d: 1.0, mat: 'castle_battlement' },
                { x: 0, y: 0, z: 48.0, w: 96.0, h: 4.2, d: 1.0, mat: 'castle_battlement' },
                { x: -48.0, y: 0, z: 0, w: 1.0, h: 4.2, d: 96.0, mat: 'castle_battlement' },
                { x: 48.0, y: 0, z: 0, w: 1.0, h: 4.2, d: 96.0, mat: 'castle_battlement' }
            ]},
            { layer: 3, name: 'LAYER 3 — STAIRCASE INNER SEAL', maxHp: 250, segments: [
                { x: 0, y: 0, z: -18.5, w: 37.0, h: 4.4, d: 1.0, mat: 'castle_stone' },
                { x: 0, y: 0, z: 18.5, w: 37.0, h: 4.4, d: 1.0, mat: 'castle_stone' },
                { x: -18.5, y: 0, z: 0, w: 1.0, h: 4.4, d: 37.0, mat: 'castle_stone' },
                { x: 18.5, y: 0, z: 0, w: 1.0, h: 4.4, d: 37.0, mat: 'castle_stone' }
            ]}
        ],
        spawners: [
            { x: -64, y: 0, z: -128 }, { x: -24, y: 0, z: -130 }, { x: 24, y: 0, z: -130 }, { x: 64, y: 0, z: -128 },
            { x: -64, y: 0, z: 128 }, { x: -24, y: 0, z: 130 }, { x: 24, y: 0, z: 130 }, { x: 64, y: 0, z: 128 },
            { x: -128, y: 0, z: -64 }, { x: -130, y: 0, z: -24 }, { x: -130, y: 0, z: 24 }, { x: -128, y: 0, z: 64 },
            { x: 128, y: 0, z: -64 }, { x: 130, y: 0, z: -24 }, { x: 130, y: 0, z: 24 }, { x: 128, y: 0, z: 64 },
            { x: -112, y: 0, z: -112 }, { x: 112, y: 0, z: -112 }, { x: -112, y: 0, z: 112 }, { x: 112, y: 0, z: 112 }
        ],
        stairTopPoint: { x: 0, y: 5.4, z: 6.4 },
        stairBottomPoint: { x: 0, y: 0, z: 17.6 },
        stairs: [
            { bot: { x: 0, y: 0, z: -17.6 }, top: { x: 0, y: 5.4, z: -6.4 }, axis: 'z', halfWidth: 2.6 },
            { bot: { x: 0, y: 0, z: 17.6 }, top: { x: 0, y: 5.4, z: 6.4 }, axis: 'z', halfWidth: 2.6 }
        ],
        ramps: [
            // Wide gentle North & South Castle Staircases (5.4m wide, 10.6m run, ZERO vertical top lip!)
            { x: 0, w: 5.4, z1: -6.7, z2: -17.3, y1: 5.4, y2: 0, axis: 'z', mat: 'castle_battlement' },
            { x: 0, w: 5.4, z1: 6.7, z2: 17.3, y1: 5.4, y2: 0, axis: 'z', mat: 'castle_battlement' }
        ],
        boxes: [
            boxMM(-135, -0.6, -135, 135, 0, 135, 'concrete'),
            boxMM(-135, 0, 134.0, 135, 9.5, 135, 'castle_stone'),
            boxMM(-135, 0, -135, 135, 9.5, -134.0, 'castle_stone'),
            boxMM(-135, 0, -135, -134.0, 9.5, 135, 'castle_stone'),
            boxMM(134.0, 0, -135, 135, 9.5, 135, 'castle_stone'),
            // Spacious Central Castle Keep Tower (x:-9.5..9.5, z:-8.0..8.0, y=5.4) notched around North & South stair landings!
            boxMM(-9.5, 0, -8.0, -2.7, 5.4, 8.0, 'castle_stone'),
            boxMM(2.7, 0, -8.0, 9.5, 5.4, 8.0, 'castle_stone'),
            boxMM(-2.7, 0, -6.7, 2.7, 5.4, 6.7, 'castle_stone'),
            boxMM(-9.5, 5.4, -8.0, -2.8, 6.45, -7.4, 'castle_battlement'),
            boxMM(2.8, 5.4, -8.0, 9.5, 6.45, -7.4, 'castle_battlement'),
            boxMM(-9.5, 5.4, 7.4, -2.8, 6.45, 8.0, 'castle_battlement'),
            boxMM(2.8, 5.4, 7.4, 9.5, 6.45, 8.0, 'castle_battlement'),
            boxMM(-9.5, 5.4, -8.0, -8.9, 6.45, -2.2, 'castle_battlement'),
            boxMM(-9.5, 5.4, 2.2, -8.9, 6.45, 8.0, 'castle_battlement'),
            boxMM(8.9, 5.4, -8.0, 9.5, 6.45, -2.2, 'castle_battlement'),
            boxMM(8.9, 5.4, 2.2, 9.5, 6.45, 8.0, 'castle_battlement')
        ],
        lights: [
            { x: 0, y: 8.5, z: 0, color: 0xf43f5e, intensity: 2.1, distance: 40, alwaysOn: true },
            { x: -32, y: 1.8, z: -32, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: 32, y: 1.8, z: 32, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: -32, y: 1.8, z: 32, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true },
            { x: 32, y: 1.8, z: -32, color: 0xff6b2b, intensity: 1.5, distance: 26, prop: 'fire_barrel', alwaysOn: true }
        ],
        landmarks: [
            { kind: 'castle_banner', x: -6.2, y: 7.4, z: -6.0, color: 0xdc2626 },
            { kind: 'castle_banner', x: 6.2, y: 7.4, z: -6.0, color: 0xdc2626 },
            { kind: 'castle_banner', x: -6.2, y: 7.4, z: 6.0, color: 0xdc2626 },
            { kind: 'castle_banner', x: 6.2, y: 7.4, z: 6.0, color: 0xdc2626 }
        ],
        waypoints: [
            { id: 'td3_top', x: 0, y: 5.4, z: 0, links: ['td3_n_mid', 'td3_s_mid'] },
            { id: 'td3_n_mid', x: 0, y: 2.7, z: -10.5, links: ['td3_top', 'td3_n_b'] },
            { id: 'td3_s_mid', x: 0, y: 2.7, z: 10.5, links: ['td3_top', 'td3_s_b'] },
            { id: 'td3_n_b', x: 0, y: 0, z: -16.5, links: ['td3_n_mid', 'td3_n_f', 'td3_nw', 'td3_ne'] },
            { id: 'td3_s_b', x: 0, y: 0, z: 16.5, links: ['td3_s_mid', 'td3_s_f', 'td3_sw', 'td3_se'] },
            { id: 'td3_nw', x: -16.5, y: 0, z: -16.5, links: ['td3_n_b', 'td3_w'] },
            { id: 'td3_ne', x: 16.5, y: 0, z: -16.5, links: ['td3_n_b', 'td3_e'] },
            { id: 'td3_sw', x: -16.5, y: 0, z: 16.5, links: ['td3_s_b', 'td3_w'] },
            { id: 'td3_se', x: 16.5, y: 0, z: 16.5, links: ['td3_s_b', 'td3_e'] },
            { id: 'td3_w', x: -90.0, y: 0, z: 0, links: ['td3_nw', 'td3_sw'] },
            { id: 'td3_e', x: 90.0, y: 0, z: 0, links: ['td3_ne', 'td3_se'] },
            { id: 'td3_n_f', x: 0, y: 0, z: -90.0, links: ['td3_n_b'] },
            { id: 'td3_s_f', x: 0, y: 0, z: 90.0, links: ['td3_s_b'] }
        ]
    };

    const MAPS = {
        der_bunker: DER_BUNKER,
        station_omega: STATION_OMEGA,
        nacht_der_untoten: NACHT_DER_UNTOTEN,
        shi_no_numa: SHI_NO_NUMA,
        der_riese: DER_RIESE,
        kino_der_toten: KINO_DER_TOTEN,
        five_pentagon: FIVE_PENTAGON,
        ascension: ASCENSION,
        nuketown_zombies: NUKETOWN_ZOMBIES,
        killhouse: KILLHOUSE,
        crash_site: CRASH_SITE,
        mp_nuketown: MP_NUKETOWN,
        mp_shipment: MP_SHIPMENT,
        mp_terminal: MP_TERMINAL,
        mp_rust: MP_RUST,
        td_castle_1: TD_CASTLE_1,
        td_castle_2: TD_CASTLE_2,
        td_castle_3: TD_CASTLE_3
    };

    BO.MapsData = {
        MAPS,
        get(id) {
            return MAPS[id] || DER_BUNKER;
        },
        listByMode(mode) {
            return Object.values(MAPS).filter((m) => m.mode === mode);
        }
    };
})(window);
