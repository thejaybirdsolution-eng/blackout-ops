/* ============================================================================
   BLACKOUT OPS — Open World RPG · The Meridian Expanse (640 x 640 m)
   Six regions around a vitrified blast crater, road network, six skyline
   landmarks, Freestead Town, POIs with new enemies & 4 regional World Bosses,
   transit pylons, and sealed Culvert Sublevel interior.
============================================================================ */
(function (BO) {
    'use strict';

    const W = BO.WorldCore;
    const N = W.noise;
    const BOUNDS = { minX: -320, maxX: 320, minZ: -320, maxZ: 320 };
    const WATER = -0.6;

    const REGIONS = [
        { id: 'haven_basin', name: 'Haven Basin', x: -190, z: 190, r: 120, lvl: '1–5', faction: 'militia', col: [0.42, 0.5, 0.3] },
        { id: 'rust_sprawl', name: 'Rust Sprawl', x: 40, z: 200, r: 110, lvl: '5–9', faction: 'syndicate', col: [0.46, 0.42, 0.36] },
        { id: 'mire_delta', name: 'Mire Delta', x: 210, z: 20, r: 110, lvl: '7–12', faction: null, col: [0.27, 0.36, 0.27] },
        { id: 'ash_quarry', name: 'Ash Quarry', x: -180, z: -60, r: 100, lvl: '9–13', faction: 'contested', col: [0.5, 0.46, 0.42] },
        { id: 'alpine_array', name: 'Alpine Array', x: -60, z: -220, r: 110, lvl: '12–17', faction: 'aegis', col: [0.62, 0.66, 0.66] },
        { id: 'meridian_core', name: 'Meridian Core', x: 180, z: -190, r: 100, lvl: '16–20', faction: 'helix', col: [0.33, 0.28, 0.38] }
    ];
    const CORE = { x: 180, z: -190 };
    const QUARRY = { x: -180, z: -60 };

    const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const lerp = (a, b, t) => a + (b - a) * t;

    function regionAt(x, z) {
        let best = REGIONS[0], bd = Infinity;
        for (const r of REGIONS) {
            const d = Math.hypot(x - r.x, z - r.z) / r.r;
            if (d < bd) { bd = d; best = r; }
        }
        return best;
    }

    const ROADS = [
        { w: 7, mat: 'asphalt', pts: [[-300, 200], [-230, 196], [-190, 214], [-140, 200], [-60, 196], [40, 214], [120, 200], [200, 120], [210, 40]] },
        { w: 6, mat: 'asphalt', pts: [[-190, 166], [-170, 110], [-160, 40], [-150, -40], [-120, -110], [-70, -140]] },
        { w: 5, mat: 'dirt', pts: [[-70, -140], [20, -130], [110, -120], [150, -140]] },
        { w: 5, mat: 'dirt', pts: [[210, 40], [170, -40], [150, -120]] },
        { w: 4, mat: 'dirt', pts: [[-190, 214], [-200, 262], [-260, 272]] },
        { w: 4, mat: 'dirt', pts: [[-230, 196], [-255, 130]] },
        { w: 4, mat: 'dirt', pts: [[-140, 200], [-118, 150], [-148, 108]] }
    ];
    function segDist(px, pz, ax, az, bx, bz) {
        const dx = bx - ax, dz = bz - az;
        const L = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L));
        return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
    }
    function roadInfo(x, z) {
        let best = null;
        for (const road of ROADS) {
            for (let i = 0; i < road.pts.length - 1; i++) {
                const d = segDist(x, z, road.pts[i][0], road.pts[i][1], road.pts[i + 1][0], road.pts[i + 1][1]);
                if (d < road.w * 0.5 + 3 && (!best || d < best.d)) best = { d, road };
            }
        }
        return best;
    }
    const RAIL = [[-40, 236], [40, 232], [120, 228], [200, 200]];
    function railDist(x, z) {
        let b = Infinity;
        for (let i = 0; i < RAIL.length - 1; i++) b = Math.min(b, segDist(x, z, RAIL[i][0], RAIL[i][1], RAIL[i + 1][0], RAIL[i + 1][1]));
        return b;
    }

    function rawHeight(x, z) {
        let h = N.fbm(x / 110, z / 110, 7, 4) * 5 + N.fbm(x / 28, z / 28, 19, 3) * 1.1 + 2;
        const hv = smooth(130, 60, Math.hypot(x + 190, z - 190));
        if (hv > 0) { const t = Math.max(1.2, 4.5 + N.fbm(x / 60, z / 60, 3, 3) * 5); h = lerp(h, Math.floor(t / 2.4) * 2.4 + (t % 2.4) * 0.35, hv * 0.85); }
        const rs = smooth(120, 70, Math.hypot(x - 40, z - 200));
        h = lerp(h, 2 + N.fbm(x / 40, z / 40, 9, 2) * 0.8, rs * 0.8);
        h -= 2.6 * smooth(6, 2, railDist(x, z)) * rs;
        const md = smooth(130, 60, Math.hypot(x - 210, z - 20));
        h = lerp(h, -0.9 + N.fbm(x / 26, z / 26, 41, 3) * 2.2, md);
        const dq = Math.hypot(x - QUARRY.x, z - QUARRY.z);
        if (dq < 85) {
            const depth = dq < 62 ? -16 * (1 - (dq / 62) ** 2) : 0;
            const stepped = Math.round(depth / 3) * 3 + (depth % 3) * 0.25;
            const rim = 5 * Math.exp(-((dq - 68) ** 2) / 60);
            h = lerp(h, 2 + stepped + rim, smooth(85, 60, dq));
        }
        const north = smooth(-130, -270, z) * smooth(300, 120, Math.abs(x + 60));
        h += north * (N.ridged(x / 70, z / 70, 5, 4) * 26 + 22);
        const dc = Math.hypot(x - CORE.x, z - CORE.z);
        if (dc < 90) {
            const bowl = dc < 44 ? -12 * (1 - (dc / 44) ** 2) : 0;
            const rim = 16 * Math.exp(-((dc - 54) ** 2) / 90);
            h = lerp(h, 3 + bowl + rim, smooth(90, 60, dc));
        }
        const edge = Math.min(x - BOUNDS.minX, BOUNDS.maxX - x, z - BOUNDS.minZ, BOUNDS.maxZ - z);
        h += smooth(16, 0, edge) * 22;
        return h;
    }

    const boxes = [];
    const pads = [];
    function addPad(x, z, w, d, blend = 8) {
        const pad = { x, z, hw: w / 2, hd: d / 2, blend, h: rawHeight(x, z) };
        pads.push(pad);
        return pad.h;
    }
    function rawFinal(x, z) {
        let h = rawHeight(x, z);
        const road = roadInfo(x, z);
        if (road) {
            const target = 2 + N.fbm(x / 140, z / 140, 11, 2) * 3;
            const k = smooth(road.road.w * 0.5 + 3, road.road.w * 0.5, road.d);
            if (h > -0.2) h = lerp(h, Math.max(target, h * 0.55), k * 0.6);
        }
        for (let i = 0; i < pads.length; i++) {
            const p = pads[i];
            const dx = Math.max(0, Math.abs(x - p.x) - p.hw), dz = Math.max(0, Math.abs(z - p.z) - p.hd);
            const d = Math.hypot(dx, dz);
            if (d < p.blend) h = lerp(h, p.h, smooth(p.blend, 0, d));
        }
        return h;
    }
    const B = (x, y, z, w, h, d, mat, opts) => boxes.push(Object.assign({ x, y, z, w, h, d, mat }, opts || {}));

    function building(x, z, w, d, y, mat, door = 's', h = 3.4, roof = 'dark_slate_roof') {
        const t = 0.3, dw = 1.8, dh = 2.5;
        B(x, y + 0.1, z, w, 0.2, d, 'wood_plank');
        B(x, y + h + 0.12, z, w + 0.6, 0.24, d + 0.6, roof);
        const wall = (side) => {
            const alongX = side === 'n' || side === 's';
            const len = alongX ? w : d;
            const cx = side === 'e' ? x + w / 2 : side === 'w' ? x - w / 2 : x;
            const cz = side === 'n' ? z - d / 2 : side === 's' ? z + d / 2 : z;
            if (side !== door) {
                if (alongX) B(cx, y + h / 2, cz, len, h, t, mat); else B(cx, y + h / 2, cz, t, h, len, mat);
                return;
            }
            const seg = (len - dw) / 2;
            const off = dw / 2 + seg / 2;
            if (alongX) {
                B(cx - off, y + h / 2, cz, seg, h, t, mat); B(cx + off, y + h / 2, cz, seg, h, t, mat);
                B(cx, y + dh + (h - dh) / 2, cz, dw, h - dh, t, mat);
            } else {
                B(cx, y + h / 2, cz - off, t, h, seg, mat); B(cx, y + h / 2, cz + off, t, h, seg, mat);
                B(cx, y + dh + (h - dh) / 2, cz, t, h - dh, dw, mat);
            }
        };
        ['n', 's', 'e', 'w'].forEach(wall);
    }

    /* ================================================================ LAYOUT */
    const TOWN = { x: -190, z: 190 };
    const townY = addPad(TOWN.x, TOWN.z, 66, 56, 12);
    (function town() {
        const y = townY, hw = 33, hd = 28, wh = 3.2;
        const seg = (x1, z1, x2, z2) => {
            const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
            if (x1 === x2) B(cx, y + wh / 2, cz, 0.6, wh, Math.abs(z2 - z1), 'wood_fort');
            else B(cx, y + wh / 2, cz, Math.abs(x2 - x1), wh, 0.6, 'wood_fort');
        };
        const X0 = TOWN.x - hw, X1 = TOWN.x + hw, Z0 = TOWN.z - hd, Z1 = TOWN.z + hd;
        seg(X0, Z0, TOWN.x - 4, Z0); seg(TOWN.x + 4, Z0, X1, Z0);
        seg(X0, Z1, TOWN.x - 4, Z1); seg(TOWN.x + 4, Z1, X1, Z1);
        seg(X0, Z0, X0, Z1);
        seg(X1, Z0, X1, TOWN.z - 4); seg(X1, TOWN.z + 4, X1, Z1);
        building(TOWN.x - 12, TOWN.z - 14, 12, 9, y, 'brick', 's', 4.2);          // Militia HQ (Kessler)
        building(TOWN.x + 12, TOWN.z - 12, 10, 8, y, 'green_siding', 's');        // Dottie's Supply
        building(TOWN.x - 12, TOWN.z + 12, 10, 8, y, 'yellow_siding', 'n');       // Clinic
        building(TOWN.x + 13, TOWN.z + 12, 9, 7, y, 'wood_plank', 'n');           // Workshop (Sola & Torin)
        B(TOWN.x, y + 0.5, TOWN.z, 2.4, 1.0, 2.4, 'castle_stone');
        B(TOWN.x + 24, y + 0.6, TOWN.z - 2, 1.2, 1.2, 1.2, 'wood_crate');
        B(TOWN.x + 25.4, y + 0.6, TOWN.z - 1.6, 1.2, 1.2, 1.2, 'wood_crate');
        for (const [lx, lz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) B(TOWN.x - 25 + lx, y + 4, TOWN.z - 20 + lz, 0.25, 8, 0.25, 'rust_steel');
        B(TOWN.x - 25, y + 9.5, TOWN.z - 20, 4, 3, 4, 'wood_plank');
    })();

    const PUMP = { x: -118, z: 150 };
    const pumpY = addPad(PUMP.x, PUMP.z, 24, 18);
    building(PUMP.x, PUMP.z, 10, 8, pumpY, 'soviet_concrete', 'w', 4.0);
    B(PUMP.x + 8, pumpY + 0.8, PUMP.z + 4, 3, 1.6, 2, 'rusted_metal');
    B(PUMP.x + 3.5, pumpY + 1.2, PUMP.z - 6, 6, 2.4, 0.8, 'rust_steel');
    B(PUMP.x - 8, pumpY + 0.25, PUMP.z + 5, 3, 0.5, 3, 'diamond_plate');

    const OVER = { x: -112, z: 252 };
    const overY = addPad(OVER.x, OVER.z, 40, 22);
    for (const dx of [-14, 0, 14]) B(OVER.x + dx, overY + 2.5, OVER.z, 2, 5, 2, 'concrete');
    B(OVER.x, overY + 5.4, OVER.z, 40, 0.8, 9, 'concrete');
    B(OVER.x - 6, overY + 0.6, OVER.z + 7, 6, 1.2, 0.8, 'sandbag');
    B(OVER.x + 7, overY + 0.6, OVER.z - 7, 6, 1.2, 0.8, 'sandbag');
    B(OVER.x + 4, overY + 1.1, OVER.z + 6, 4.5, 2.2, 2, 'container_red');
    const ramps = [{ axis: 'x', z: OVER.z, x1: OVER.x + 34, x2: OVER.x + 20, y1: overY, y2: overY + 5.8, w: 4, mat: 'concrete' }];

    const RELAY = { x: -258, z: 122 };
    const relayY = addPad(RELAY.x, RELAY.z, 18, 16);
    building(RELAY.x + 5, RELAY.z + 2, 6, 5, relayY, 'concrete', 'w');
    for (const [lx, lz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) B(RELAY.x - 4 + lx, relayY + 9, RELAY.z + lz, 0.22, 18, 0.22, 'rust_steel');
    B(RELAY.x - 4, relayY + 18.1, RELAY.z, 3, 0.2, 3, 'diamond_plate');

    const CONVOY = { x: -150, z: 104 };
    const convoyY = addPad(CONVOY.x, CONVOY.z, 26, 16);
    B(CONVOY.x - 6, convoyY + 1.3, CONVOY.z, 8, 2.6, 3, 'container_olive', { rotY: 0 });
    B(CONVOY.x + 5, convoyY + 1.0, CONVOY.z + 2, 6, 2.0, 2.6, 'truck_yellow');
    B(CONVOY.x + 1, convoyY + 0.5, CONVOY.z - 5, 3, 1.0, 2, 'rusted_metal');

    const CAVE = { x: -268, z: 268 };
    const caveY = addPad(CAVE.x, CAVE.z, 20, 18, 6);
    B(CAVE.x - 7, caveY + 3, CAVE.z, 4, 6, 10, 'bunker_stone');
    B(CAVE.x + 7, caveY + 3, CAVE.z, 4, 6, 10, 'bunker_stone');
    B(CAVE.x, caveY + 6.5, CAVE.z, 18, 1.2, 12, 'bunker_stone');
    B(CAVE.x, caveY + 3, CAVE.z - 6.5, 18, 6, 1.2, 'bunker_stone');

    const YARD = { x: 40, z: 196 };
    const yardY = addPad(YARD.x, YARD.z, 50, 36);
    building(YARD.x - 10, YARD.z - 8, 10, 8, yardY, 'rusted_metal', 'e', 3.6);
    for (let i = 0; i < 5; i++) B(YARD.x + 4 + i * 3.2, yardY + 1.3, YARD.z + 8, 2.6, 2.6, 6, i % 2 ? 'container_blue' : 'container_red');
    B(YARD.x + 12, yardY + 3.9, YARD.z + 8, 2.6, 2.6, 6, 'container_olive');
    B(YARD.x - 25, yardY + 1.5, YARD.z, 0.4, 3, 36, 'privacy_fence');

    const QCAMP = { x: -150, z: -40 };
    const qcampY = addPad(QCAMP.x, QCAMP.z, 20, 16);
    building(QCAMP.x, QCAMP.z, 8, 6, qcampY, 'rusted_metal', 'e');
    B(QCAMP.x - 7, qcampY + 0.6, QCAMP.z + 5, 5, 1.2, 0.8, 'sandbag');

    const CHECK = { x: -72, z: -140 };
    const checkY = addPad(CHECK.x, CHECK.z, 26, 18);
    building(CHECK.x - 6, CHECK.z, 9, 7, checkY, 'lab_panel', 'e', 3.6);
    B(CHECK.x + 6, checkY + 1, CHECK.z - 7, 0.6, 2, 6, 'concrete');
    B(CHECK.x + 6, checkY + 1, CHECK.z + 7, 0.6, 2, 6, 'concrete');
    B(CHECK.x + 6, checkY + 3.2, CHECK.z, 0.3, 0.3, 8, 'diamond_plate', { noCollide: true });

    const SHRINE = { x: 140, z: -122 };
    const shrineY = addPad(SHRINE.x, SHRINE.z, 18, 18);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; B(SHRINE.x + Math.cos(a) * 6, shrineY + 2, SHRINE.z + Math.sin(a) * 6, 0.8, 4, 0.8, 'pentagon_marble'); }
    B(SHRINE.x, shrineY + 0.3, SHRINE.z, 4, 0.6, 4, 'pentagon_panel');

    const NEST = { x: 214, z: 26 };

    // New Expansion POIs (flat pads well inside bounds and above water)
    const BARGE = { x: 136, z: 54 };
    const bargeY = addPad(BARGE.x, BARGE.z, 18, 12, 6);
    B(BARGE.x, bargeY + 1.1, BARGE.z, 12, 2.2, 4.5, 'container_blue');
    B(BARGE.x + 4, bargeY + 0.6, BARGE.z - 4, 3, 1.2, 2, 'rusted_metal');

    const BUNKER = { x: -135, z: -205 };
    const bunkerY = addPad(BUNKER.x, BUNKER.z, 20, 16, 6);
    building(BUNKER.x, BUNKER.z, 8, 7, bunkerY, 'soviet_concrete', 's', 3.5);
    B(BUNKER.x + 6, bunkerY + 0.6, BUNKER.z + 5, 4, 1.2, 0.8, 'sandbag');

    const RIFT = { x: 230, z: -145 };
    const riftY = addPad(RIFT.x, RIFT.z, 16, 16, 6);
    B(RIFT.x, riftY + 1.2, RIFT.z, 2.4, 2.4, 2.4, 'pentagon_marble');

    // Sealed Culvert Sublevel interior (off-map).
    const INT = { x: 900, z: 900 };
    (function culvert() {
        const x = INT.x, z = INT.z, H = 4.2;
        B(x, -0.2, z + 22, 26, 0.4, 56, 'bunker_stone');
        B(x, H + 0.2, z + 22, 26, 0.4, 56, 'bunker_stone');
        B(x - 13, H / 2, z + 22, 0.6, H, 56, 'bunker_stone');
        B(x + 13, H / 2, z + 22, 0.6, H, 56, 'bunker_stone');
        B(x, H / 2, z - 6, 26, H, 0.6, 'bunker_stone');
        B(x, H / 2, z + 50, 26, H, 0.6, 'bunker_stone');
        B(x - 7, H / 2, z + 10, 11, H, 0.6, 'soviet_concrete');
        B(x + 8, H / 2, z + 10, 9, H, 0.6, 'soviet_concrete');
        B(x - 3, H / 2, z + 2, 0.6, H, 16, 'soviet_concrete');
        B(x + 6, H / 2, z + 20, 0.6, H, 10, 'rust_steel');
        B(x - 6, 0.6, z + 28, 4, 1.2, 1.2, 'rusted_metal');
        B(x + 5, 0.6, z + 36, 1.2, 1.2, 4, 'rusted_metal');
        B(x - 2, 0.9, z + 42, 6, 1.8, 0.8, 'rust_steel');
        B(x, 0.02, z + 32, 18, 0.04, 20, 'swamp_water', { noCollide: true });
    })();

    const POIS = [
        { id: 'freestead', name: 'Freestead Town', region: 'haven_basin', x: TOWN.x, z: TOWN.z, r: 34, safe: true, kind: 'settlement' },
        { id: 'pump_three', name: 'Culvert Pumphouse', region: 'haven_basin', x: PUMP.x, z: PUMP.z, r: 18, kind: 'site',
            spawns: [['crawler', -6, 10], ['crawler', 8, 12], ['raider', 12, -8]] },
        { id: 'overpass', name: 'Raider Overpass', region: 'haven_basin', x: OVER.x, z: OVER.z, r: 26, kind: 'camp',
            spawns: [['raider', -10, 5], ['raider', 8, -5], ['raider_pyro', 14, 6], ['raider_marksman', 0, -2, 5.8], ['raider_boss', 2, 5]] },
        { id: 'relay', name: 'Abandoned Relay', region: 'haven_basin', x: RELAY.x, z: RELAY.z, r: 16, kind: 'site', spawns: [['crawler', 6, -6], ['brood_venom_mite', -6, 7]] },
        { id: 'convoy', name: 'Crashed Convoy', region: 'haven_basin', x: CONVOY.x, z: CONVOY.z, r: 18, kind: 'site', spawns: [['crawler', -4, 8], ['stalker', 9, -6], ['brood_venom_mite', 12, 4]] },
        { id: 'shale_cave', name: 'Shale Cave', region: 'haven_basin', x: CAVE.x, z: CAVE.z, r: 18, kind: 'nest', spawns: [['crawler', 0, 0], ['crawler', 3, 3], ['stalker', -3, 2], ['spitter', 0, -3]] },
        { id: 'rail_yard', name: 'Ironclad Rail Yard', region: 'rust_sprawl', x: YARD.x, z: YARD.z, r: 30, kind: 'hub', faction: 'syndicate',
            spawns: [['enforcer', 8, -6], ['enforcer', -14, 10], ['syn_gunner', 14, 0], ['syn_arc_tech', 4, -12]] },
        { id: 'quarry_camp', name: 'Quarry Dig Camp', region: 'ash_quarry', x: QCAMP.x, z: QCAMP.z, r: 22, kind: 'contested',
            spawns: [['militia', -6, 6], ['militia_scout', -8, -4], ['enforcer', 10, 6], ['syn_gunner', 12, -6]] },
        { id: 'quarry_pit', name: 'Excavator Pit', region: 'ash_quarry', x: QUARRY.x, z: QUARRY.z, r: 32, kind: 'site',
            spawns: [['brood_pyro_fiend', 12, 0], ['brute', -8, 10], ['spitter', 6, -12], ['boss_quarry_colossus', 16, 14]] },
        { id: 'checkpoint', name: 'Aegis Checkpoint K-4', region: 'alpine_array', x: CHECK.x, z: CHECK.z, r: 20, kind: 'hub', faction: 'aegis',
            spawns: [['aegis', 8, -4], ['aegis_heavy', 8, 4]] },
        { id: 'dish_ridge', name: 'Deep-Space Dish Ridge', region: 'alpine_array', x: -60, z: -238, r: 34, kind: 'site',
            spawns: [['aegis', 0, 8], ['aegis_cryo', 12, -6], ['stalker', -12, 0], ['boss_alpine_warden', -16, 12]] },
        { id: 'helix_shrine', name: 'Helix Bloom Shrine', region: 'meridian_core', x: SHRINE.x, z: SHRINE.z, r: 16, kind: 'hub', faction: 'helix',
            spawns: [['helix', 8, 6], ['helix_zealot', -8, -6]] },
        { id: 'mire_nest', name: 'Cooling Stack Nest', region: 'mire_delta', x: NEST.x, z: NEST.z, r: 28, kind: 'nest',
            spawns: [['brood_blight_hound', 0, 12], ['spitter', 8, -6], ['brood_frost_wraith', -12, 0], ['boss_mire_hydra', -8, 12]] },
        { id: 'goliath', name: 'Goliath Crane', region: 'rust_sprawl', x: 90, z: 232, r: 18, kind: 'site',
            spawns: [['raider_bruiser', 0, 8], ['raider_pyro', 8, -2], ['syn_sniper', -6, 0]] },
        { id: 'sunken_barge', name: 'Sunken Cargo Barge', region: 'mire_delta', x: BARGE.x, z: BARGE.z, r: 18, kind: 'site',
            spawns: [['brood_blight_hound', -6, 8], ['brood_frost_wraith', 8, -6], ['spitter', 6, 8]] },
        { id: 'bunker_delta', name: 'Bunker Delta', region: 'alpine_array', x: BUNKER.x, z: BUNKER.z, r: 20, kind: 'site',
            spawns: [['aegis_heavy', 6, 8], ['aegis_cryo', -8, 6], ['brood_iron_goliath', 10, -8]] },
        { id: 'crater_rift', name: 'Crater Anomaly Rift', region: 'meridian_core', x: RIFT.x, z: RIFT.z, r: 20, kind: 'site',
            spawns: [['helix_voidweaver', 6, 6], ['helix_zealot', -8, 4], ['brood_void_stalker', 0, -10]] },
        { id: 'meridian_dome', name: 'Meridian Containment Dome', region: 'meridian_core', x: CORE.x, z: CORE.z, r: 42, kind: 'endgame',
            spawns: [['helix_voidweaver', 22, 0], ['brood_iron_goliath', -18, 12], ['helix', 0, -24], ['boss_meridian_sovereign', 14, 18]] },
        { id: 'culvert_sublevel', name: 'Culvert Sublevel', region: 'haven_basin', x: INT.x, z: INT.z + 22, r: 30, kind: 'interior', interior: true,
            spawns: [['crawler', -6, 0], ['crawler', 6, 4], ['stalker', 0, 10], ['spitter', -8, 16], ['matriarch', 0, 22]] }
    ];

    const NPCS = [
        { id: 'kessler', name: 'Warden Kessler', faction: 'militia', x: TOWN.x - 12, z: TOWN.z - 15, indoor: true, yaw: 0, dialogue: 'kessler' },
        { id: 'dottie', name: 'Dottie Vail', faction: 'militia', x: TOWN.x + 12, z: TOWN.z - 13, indoor: true, yaw: 0, dialogue: 'dottie', vendor: 'freestead_store' },
        { id: 'ines', name: 'Medic Ines', faction: 'militia', x: TOWN.x - 12, z: TOWN.z + 13, indoor: true, yaw: Math.PI, dialogue: 'ines' },
        { id: 'sola', name: 'Engineer Sola', faction: 'militia', x: TOWN.x + 13, z: TOWN.z + 13, indoor: true, yaw: Math.PI, dialogue: 'sola' },
        { id: 'torin', name: 'Quartermaster Torin', faction: 'militia', x: TOWN.x + 6, z: TOWN.z + 6, yaw: -Math.PI * 0.75, dialogue: 'torin', vendor: 'torin_bench' },
        { id: 'mags', name: 'Mags Orrin', faction: 'syndicate', x: YARD.x - 10, z: YARD.z - 8, indoor: true, yaw: Math.PI / 2, dialogue: 'mags', vendor: 'syndicate_fence' },
        { id: 'vance', name: 'Lt. Imre Vance', faction: 'aegis', x: CHECK.x - 6, z: CHECK.z, indoor: true, yaw: Math.PI / 2, dialogue: 'vance', vendor: 'aegis_quarter' },
        { id: 'lyra', name: 'Dr. Lyra Chen', faction: 'aegis', x: QCAMP.x + 6, z: QCAMP.z - 6, yaw: Math.PI * 0.5, dialogue: 'lyra', vendor: 'lyra_field' },
        { id: 'calla', name: 'Sister Calla', faction: 'helix', x: SHRINE.x, z: SHRINE.z, yaw: 0, dialogue: 'calla', vendor: 'helix_exchange' }
    ];

    const INTERACTS = [
        { id: 'c_town_stash', kind: 'stash', name: 'Personal Stash', x: TOWN.x - 22, z: TOWN.z + 4 },
        { id: 'w_town_bench', kind: 'workbench', name: 'Field Repair Bench', x: TOWN.x + 8, z: TOWN.z + 4 },
        { id: 'b_town_bounties', kind: 'bounty_board', name: 'Freestead Bounty Board', x: TOWN.x - 4, z: TOWN.z - 4 },
        { id: 'c_pump_office', kind: 'container', name: 'Foreman Locker', x: PUMP.x + 2.5, z: PUMP.z - 2.5, indoor: true, loot: 'cache', grant: 'pressure_schematic' },
        { id: 't_junction', kind: 'terminal', name: 'Surface Junction', x: PUMP.x + 8, z: PUMP.z + 5.6 },
        { id: 'h_culvert', kind: 'hatch', name: 'Sublevel Hatch', x: PUMP.x - 8, z: PUMP.z + 5, to: { x: INT.x, y: 0.1, z: INT.z - 3, yaw: Math.PI } },
        { id: 'x_culvert', kind: 'exit', name: 'Ladder to Surface', x: INT.x, z: INT.z - 4.5, int: true, to: { x: PUMP.x - 8, z: PUMP.z + 8.5, yaw: 0 } },
        { id: 'v_bypass', kind: 'valve', name: 'Bypass Valve', x: INT.x + 9.5, z: INT.z + 20, int: true },
        { id: 'c_culvert_cache', kind: 'container', name: 'Flooded Crate', x: INT.x - 10, z: INT.z + 44, int: true, loot: 'locked' },
        { id: 'c_overpass_box', kind: 'container', name: "Vasko's Strongbox", x: OVER.x + 2, z: OVER.z + 2.4, loot: 'locked', locked: true, y: overY + 5.85, grant: 'vasko_crest' },
        { id: 'c_convoy', kind: 'container', name: 'Aegis Cargo Case', x: CONVOY.x - 1, z: CONVOY.z - 2, loot: 'cache', grant: 'convoy_manifest', grant2: 'relay_fuse' },
        { id: 'm_relay', kind: 'mast', name: 'Relay Mast Panel', x: RELAY.x - 2.4, z: RELAY.z },
        { id: 'c_relay', kind: 'container', name: 'Tool Chest', x: RELAY.x + 5, z: RELAY.z + 3, indoor: true, loot: 'cache' },
        { id: 'c_mags_safe', kind: 'container', name: "Mags' Safe", x: YARD.x - 13.5, z: YARD.z - 10.5, indoor: true, loot: 'locked', locked: true, grant: 'syndicate_ledger', owner: 'syndicate' },
        { id: 's_sac_1', kind: 'sac', name: 'Brood Egg Sac', x: CAVE.x - 3, z: CAVE.z - 3 },
        { id: 's_sac_2', kind: 'sac', name: 'Brood Egg Sac', x: CAVE.x + 3.5, z: CAVE.z - 2 },
        { id: 's_sac_3', kind: 'sac', name: 'Brood Egg Sac', x: CAVE.x, z: CAVE.z + 3 },
        { id: 'c_quarry', kind: 'container', name: 'Survey Crate', x: QUARRY.x + 4, z: QUARRY.z + 3, loot: 'cache', grant: 'quarry_core_sample' },
        { id: 'c_dish', kind: 'container', name: 'Aegis Footlocker', x: -56, z: -236, loot: 'locked', locked: true },
        { id: 'c_nest', kind: 'container', name: 'Half-Sunk Cache', x: NEST.x - 4, z: NEST.z + 6, loot: 'locked', grant: 'mire_toxin_sample' },
        { id: 'c_barge', kind: 'container', name: 'Barge Manifest Locker', x: BARGE.x - 4, z: BARGE.z + 4, loot: 'locked' },
        { id: 'c_bunker_delta', kind: 'container', name: 'Bunker Telemetry Vault', x: BUNKER.x, z: BUNKER.z, indoor: true, loot: 'locked', locked: true, grant: 'aegis_blackbox' },
        { id: 'c_crater_rift', kind: 'container', name: 'Helix Cipher Chest', x: RIFT.x + 4, z: RIFT.z - 4, loot: 'locked', grant: 'helix_cipher' }
    ];

    const PYLONS = [
        { id: 'py_freestead', name: 'Freestead Pylon', x: TOWN.x + 22, z: TOWN.z + 22, region: 'haven_basin', start: true },
        { id: 'py_relay', name: 'Relay Pylon', x: RELAY.x + 10, z: RELAY.z - 8, region: 'haven_basin' },
        { id: 'py_yard', name: 'Rail Yard Pylon', x: YARD.x + 22, z: YARD.z - 14, region: 'rust_sprawl' },
        { id: 'py_quarry', name: 'Quarry Pylon', x: QCAMP.x + 12, z: QCAMP.z - 10, region: 'ash_quarry' },
        { id: 'py_check', name: 'Checkpoint Pylon', x: CHECK.x + 14, z: CHECK.z + 10, region: 'alpine_array' },
        { id: 'py_mire', name: 'Mire Pylon', x: 186, z: 54, region: 'mire_delta' }
    ];
    for (const p of PYLONS) addPad(p.x, p.z, 5, 5, 4);

    const LANDMARKS = [
        { id: 'mast_alpha', name: 'Watchtower Mast Alpha', x: -160, z: 160, h: 42, color: 0xf5a623 },
        { id: 'goliath', name: 'Goliath Straddle Crane', x: 90, z: 232, h: 38, color: 0xfacc15 },
        { id: 'cooling_stack', name: 'Sunken Cooling Stack', x: 228, z: 4, h: 45, color: 0x4ade80 },
        { id: 'excavator', name: 'Bucket-Wheel Excavator', x: QUARRY.x - 4, z: QUARRY.z - 6, h: 36, color: 0xf97316 },
        { id: 'dishes', name: 'Deep-Space Dish Array', x: -60, z: -250, h: 32, color: 0xe2e8f0 },
        { id: 'obelisk', name: 'Meridian Containment Dome', x: CORE.x, z: CORE.z, h: 58, color: 0xa855f7 }
    ];
    for (const l of LANDMARKS) if (l.id !== 'obelisk' && l.id !== 'excavator') addPad(l.x, l.z, 12, 12, 6);

    function isWet(x, z) { return Math.hypot(x - 210, z - 20) < 125; }
    function colorAt(x, z, h, slope) {
        let c = [0, 0, 0], wsum = 0;
        for (const r of REGIONS) {
            const w = 1 / Math.pow(Math.max(0.05, Math.hypot(x - r.x, z - r.z) / r.r), 6);
            c[0] += r.col[0] * w; c[1] += r.col[1] * w; c[2] += r.col[2] * w; wsum += w;
        }
        c = c.map((v) => v / wsum);
        const n = N.fbm(x / 18, z / 18, 51, 3) * 0.07;
        c = c.map((v) => v + n);
        if (slope > 0.8) { const k = smooth(0.8, 1.4, slope); c = c.map((v, i) => lerp(v, [0.4, 0.39, 0.37][i], k)); }
        if (h > 24) { const k = smooth(24, 36, h); c = c.map((v, i) => lerp(v, [0.9, 0.92, 0.94][i], k)); }
        if (h < WATER + 0.8 && isWet(x, z)) { const k = smooth(WATER + 0.8, WATER - 0.3, h); c = c.map((v, i) => lerp(v, [0.22, 0.26, 0.2][i], k)); }
        const road = roadInfo(x, z);
        if (road && road.d < road.road.w * 0.5) {
            const tint = road.road.mat === 'asphalt' ? [0.24, 0.25, 0.26] : [0.45, 0.38, 0.29];
            c = c.map((v, i) => lerp(v, tint[i], smooth(road.road.w * 0.5, road.road.w * 0.5 - 1.2, road.d)));
        }
        if (railDist(x, z) < 2) c = c.map((v, i) => lerp(v, [0.3, 0.27, 0.25][i], 0.75));
        const dc = Math.hypot(x - CORE.x, z - CORE.z);
        if (dc < 50) c = c.map((v, i) => lerp(v, [0.2, 0.16, 0.26][i], smooth(50, 20, dc)));
        return c.map((v) => Math.max(0, Math.min(1, v)));
    }

    const terrainDef = () => ({
        ...BOUNDS, res: 2, chunk: 64, waterLevel: WATER,
        height: (x, z) => rawFinal(x, z),
        color: (x, z, h, s) => colorAt(x, z, h, s).map((v) => Math.pow(Math.max(0, v), 2.2)),
        carves: []
    });

    const map = {
        id: 'meridian', name: 'The Meridian Expanse', mode: 'owrpg', large: true,
        playerSpawn: { x: TOWN.x + 20, y: 0, z: TOWN.z + 20, yaw: Math.PI * 0.25 },
        terrain: terrainDef,
        boxes, ramps, waypoints: [],
        populate: (world, scene) => BO.OWRPGWorldArt && BO.OWRPGWorldArt.populate(world, scene),
        atmosphere: {
            skyTop: 0x3f5874, skyBottom: 0xa4a998, fogColor: 0x9a9f92, fogDensity: 0.0042,
            hemiSky: 0xbfd0e2, hemiGround: 0x4a4f3a, hemiIntensity: 1.05,
            sunColor: 0xffe2b8, sunIntensity: 1.5, sunPos: [-70, 95, 50]
        }
    };
    BO.MapsData.MAPS.meridian = map;

    BO.OWRPGWorldData = {
        BOUNDS, WATER, REGIONS, ROADS, RAIL, POIS, NPCS, INTERACTS, PYLONS, LANDMARKS, INTERIOR: INT,
        TOWN, regionAt, rawFinal, heightAt: rawFinal, isWet, segDist, roadInfo, railDist,
        isInterior(x, z) { return x > 700 && z > 700; }
    };
})(window.BO);
