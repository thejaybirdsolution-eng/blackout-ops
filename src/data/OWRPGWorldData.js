/* ============================================================================
   BLACKOUT OPS — Open World RPG · The Meridian Expanse 2.0 (1280 x 1280 m)
   - Twice the linear span (4x surface area: [-640, 640] x [-640, 640])
   - 12 Distinct Biomes & Frontier Territories (Levels 1–50)
   - 12 Skyline Landmarks, 12 Transit Pylons, 5 Frontier Settlements/Outposts
   - 12 Multi-Room Sealed Underground Dungeons (at x >= 1600, z >= 1600)
   - 8 Skyrim-style Standing Stones, 32 Harvestable Resource Nodes & Lore Tomes
============================================================================ */
(function (BO) {
    'use strict';

    const W = BO.WorldCore;
    const N = W.noise;
    const BOUNDS = { minX: -640, maxX: 640, minZ: -640, maxZ: 640 };
    const WATER = -0.6;

    const REGIONS = [
        { id: 'haven_basin',          name: 'Haven Basin',          x: -190, z: 190,  r: 145, lvl: '1–5',   faction: 'militia',   col: [0.42, 0.52, 0.30] },
        { id: 'whispering_woods',     name: 'Whispering Pinewoods', x: -450, z: 390,  r: 175, lvl: '3–9',   faction: 'militia',   col: [0.24, 0.42, 0.25] },
        { id: 'rust_sprawl',          name: 'Rust Sprawl',          x: 60,   z: 210,  r: 145, lvl: '6–12',  faction: 'syndicate', col: [0.46, 0.41, 0.35] },
        { id: 'barrow_moor',          name: 'Barrow-Moor Graveyard',x: -460, z: -20,  r: 175, lvl: '10–17', faction: null,        col: [0.29, 0.28, 0.34] },
        { id: 'mire_delta',           name: 'Mire Delta',           x: 225,  z: 30,   r: 145, lvl: '11–18', faction: null,        col: [0.26, 0.37, 0.26] },
        { id: 'ash_quarry',           name: 'Ash Quarry',           x: -180, z: -60,  r: 135, lvl: '13–20', faction: 'contested', col: [0.49, 0.44, 0.40] },
        { id: 'sunscorched_badlands', name: 'Sunscorched Badlands', x: 420,  z: 420,  r: 185, lvl: '17–26', faction: 'syndicate', col: [0.64, 0.48, 0.29] },
        { id: 'sunken_coast',         name: 'Sunken Ruin Coast',    x: 490,  z: -60,  r: 175, lvl: '22–30', faction: null,        col: [0.34, 0.46, 0.44] },
        { id: 'alpine_array',         name: 'Alpine Array',         x: -60,  z: -230, r: 145, lvl: '24–33', faction: 'aegis',     col: [0.60, 0.65, 0.67] },
        { id: 'frostfang_peaks',      name: 'Frostfang Peaks',      x: -440, z: -430, r: 190, lvl: '30–40', faction: 'aegis',     col: [0.76, 0.82, 0.88] },
        { id: 'meridian_core',        name: 'Meridian Core',        x: 180,  z: -190, r: 135, lvl: '34–44', faction: 'helix',     col: [0.34, 0.27, 0.40] },
        { id: 'obsidian_dragonwilds', name: 'Obsidian Dragonwilds', x: 450,  z: -450, r: 190, lvl: '40–50', faction: 'helix',     col: [0.22, 0.17, 0.21] }
    ];

    const CORE = { x: 180, z: -190 };
    const QUARRY = { x: -180, z: -60 };
    const DRAGON_CRATER = { x: 470, z: -470 };

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
        // Central Basin & Sprawl arteries
        { w: 7, mat: 'asphalt', pts: [[-560, 410], [-420, 360], [-300, 200], [-230, 196], [-190, 214], [-140, 200], [-60, 196], [40, 214], [140, 210], [280, 310], [390, 400]] },
        { w: 6, mat: 'asphalt', pts: [[-190, 166], [-170, 110], [-160, 40], [-150, -40], [-120, -110], [-70, -140], [-60, -230], [-220, -320], [-420, -410]] },
        // Outer Frontier Highways & Ancient Trails
        { w: 5, mat: 'dirt', pts: [[-70, -140], [20, -130], [110, -120], [150, -140], [310, -280], [430, -420]] },
        { w: 5, mat: 'dirt', pts: [[140, 210], [210, 110], [210, 40], [170, -40], [150, -120]] },
        { w: 5, mat: 'dirt', pts: [[210, 40], [350, 10], [470, -50], [450, -260], [430, -420]] },
        { w: 5, mat: 'dirt', pts: [[-230, 196], [-330, 100], [-430, 10], [-460, -60], [-440, -260], [-420, -410]] },
        { w: 4, mat: 'dirt', pts: [[-190, 214], [-200, 262], [-260, 272], [-420, 360]] },
        { w: 4, mat: 'dirt', pts: [[390, 400], [465, 455], [530, 320], [470, -50]] }
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
    const RAIL = [[-320, 245], [-40, 236], [40, 232], [120, 228], [260, 260], [410, 360]];
    function railDist(x, z) {
        let b = Infinity;
        for (let i = 0; i < RAIL.length - 1; i++) b = Math.min(b, segDist(x, z, RAIL[i][0], RAIL[i][1], RAIL[i + 1][0], RAIL[i + 1][1]));
        return b;
    }

    function rawHeight(x, z) {
        let h = N.fbm(x / 140, z / 140, 7, 4) * 6.2 + N.fbm(x / 32, z / 32, 19, 3) * 1.2 + 2.4;
        // Haven Basin terraces
        const hv = smooth(150, 65, Math.hypot(x + 190, z - 190));
        if (hv > 0) { const t = Math.max(1.4, 4.5 + N.fbm(x / 60, z / 60, 3, 3) * 5); h = lerp(h, Math.floor(t / 2.4) * 2.4 + (t % 2.4) * 0.35, hv * 0.85); }
        // Whispering Pinewoods rolling hills
        const ww = smooth(210, 80, Math.hypot(x + 450, z - 390));
        if (ww > 0) h += ww * (4.5 + N.fbm(x / 55, z / 55, 29, 3) * 6.5);
        // Rust Sprawl rail grade
        const rs = smooth(150, 70, Math.hypot(x - 60, z - 210));
        h = lerp(h, 2.2 + N.fbm(x / 40, z / 40, 9, 2) * 0.8, rs * 0.8);
        h -= 2.4 * smooth(6, 2, railDist(x, z)) * rs;
        // Barrow-Moor misty barrow hills
        const bm = smooth(195, 75, Math.hypot(x + 460, z + 20));
        if (bm > 0) h = lerp(h, 3.2 + N.ridged(x / 48, z / 48, 37, 3) * 5.2, bm * 0.75);
        // Mire Delta wetlands
        const md = smooth(140, 60, Math.hypot(x - 215, z - 25));
        h = lerp(h, -0.7 + N.fbm(x / 26, z / 26, 41, 3) * 2.2, md);
        // Sunken Coast shoals & cliffs
        const sc = smooth(185, 70, Math.hypot(x - 490, z + 60));
        if (sc > 0) h = lerp(h, 1.8 + N.fbm(x / 38, z / 38, 61, 3) * 4.5, sc * 0.8);
        // Sunscorched Badlands mesas
        const sb = smooth(210, 85, Math.hypot(x - 420, z - 420));
        if (sb > 0) {
            const mesa = 5.5 + N.ridged(x / 65, z / 65, 73, 3) * 14;
            h = lerp(h, Math.floor(mesa / 3.5) * 3.5 + (mesa % 3.5) * 0.28, sb * 0.85);
        }
        // Ash Quarry stepped pit
        const dq = Math.hypot(x - QUARRY.x, z - QUARRY.z);
        if (dq < 90) {
            const depth = dq < 62 ? -15 * (1 - (dq / 62) ** 2) : 0;
            const stepped = Math.round(depth / 3) * 3 + (depth % 3) * 0.25;
            const rim = 5 * Math.exp(-((dq - 68) ** 2) / 60);
            h = lerp(h, 2.2 + stepped + rim, smooth(90, 60, dq));
        }
        // Alpine Array & Frostfang Peaks mountains
        const north = smooth(-130, -320, z) * smooth(580, 140, Math.abs(x + 220));
        h += north * (N.ridged(x / 85, z / 85, 5, 4) * 28 + 18);
        const ff = smooth(220, 80, Math.hypot(x + 440, z + 430));
        if (ff > 0) h += ff * (14 + N.ridged(x / 72, z / 72, 83, 4) * 20);
        // Meridian Core blast crater
        const dc = Math.hypot(x - CORE.x, z - CORE.z);
        if (dc < 95) {
            const bowl = dc < 44 ? -11 * (1 - (dc / 44) ** 2) : 0;
            const rim = 16 * Math.exp(-((dc - 54) ** 2) / 90);
            h = lerp(h, 3 + bowl + rim, smooth(95, 60, dc));
        }
        // Obsidian Dragonwilds volcanic caldera
        const dd = Math.hypot(x - DRAGON_CRATER.x, z - DRAGON_CRATER.z);
        if (dd < 155) {
            const ridge = 12 * Math.exp(-((dd - 88) ** 2) / 260) + N.ridged(x / 52, z / 52, 97, 3) * 9;
            h = lerp(h, 6.5 + ridge, smooth(155, 70, dd));
        }
        const edge = Math.min(x - BOUNDS.minX, BOUNDS.maxX - x, z - BOUNDS.minZ, BOUNDS.maxZ - z);
        h += smooth(24, 0, edge) * 26;
        return h;
    }

    const boxes = [];
    const pads = [];
    function addPad(x, z, w, d, blend = 10, minH = 1.2) {
        const pad = { x, z, hw: w / 2, hd: d / 2, blend, h: Math.max(minH, rawHeight(x, z)) };
        pads.push(pad);
        return pad.h;
    }
    function rawFinal(x, z) {
        let h = rawHeight(x, z);
        const road = roadInfo(x, z);
        if (road) {
            const target = 2.2 + N.fbm(x / 160, z / 160, 11, 2) * 3;
            const k = smooth(road.road.w * 0.5 + 3, road.road.w * 0.5, road.d);
            if (h > -0.2) h = lerp(h, Math.max(target, h * 0.6), k * 0.6);
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

    function watchtower(x, z, y, mat = 'castle_stone', h = 8.5) {
        B(x, y + h / 2, z, 5.2, h, 5.2, mat);
        B(x, y + h + 0.3, z, 6.4, 0.6, 6.4, mat);
    }

    /* ================================================================ CORE & ORIGINAL POIS */
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
        building(TOWN.x - 12, TOWN.z - 14, 12, 9, y, 'brick', 's', 4.2);
        building(TOWN.x + 12, TOWN.z - 12, 10, 8, y, 'green_siding', 's');
        building(TOWN.x - 12, TOWN.z + 12, 10, 8, y, 'yellow_siding', 'n');
        building(TOWN.x + 13, TOWN.z + 12, 9, 7, y, 'wood_plank', 'n');
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
    B(CONVOY.x - 6, convoyY + 1.3, CONVOY.z, 8, 2.6, 3, 'container_olive');
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
    const qcampY = addPad(QCAMP.x, QCAMP.z, 22, 18);
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
    addPad(NEST.x, NEST.z, 28, 28, 8, 0.4);

    const BARGE = { x: 136, z: 54 };
    const bargeY = addPad(BARGE.x, BARGE.z, 18, 12, 6, 0.8);
    B(BARGE.x, bargeY + 1.1, BARGE.z, 12, 2.2, 4.5, 'container_blue');
    B(BARGE.x + 4, bargeY + 0.6, BARGE.z - 4, 3, 1.2, 2, 'rusted_metal');

    const BUNKER = { x: -135, z: -205 };
    const bunkerY = addPad(BUNKER.x, BUNKER.z, 20, 16, 6);
    building(BUNKER.x, BUNKER.z, 8, 7, bunkerY, 'soviet_concrete', 's', 3.5);
    B(BUNKER.x + 6, bunkerY + 0.6, BUNKER.z + 5, 4, 1.2, 0.8, 'sandbag');

    const RIFT = { x: 230, z: -145 };
    const riftY = addPad(RIFT.x, RIFT.z, 16, 16, 6);
    B(RIFT.x, riftY + 1.2, RIFT.z, 2.4, 2.4, 2.4, 'pentagon_marble');

    /* ================================================================ NEW 1280m FRONTIER SETTLEMENTS, FORTS & RUINS */
    // 1. Whispering Pinewoods: Ranger's Watch Lodge (Safe Settlement) + Poacher Palisade + Root-Barrow Entrance
    const LODGE = { x: -420, z: 360 };
    const lodgeY = addPad(LODGE.x, LODGE.z, 42, 36, 12);
    building(LODGE.x - 8, LODGE.z - 6, 11, 8, lodgeY, 'wood_plank', 's', 3.8);
    building(LODGE.x + 9, LODGE.z - 5, 8, 7, lodgeY, 'wood_fort', 's', 3.4);
    watchtower(LODGE.x - 16, LODGE.z + 12, lodgeY, 'wood_fort', 7.5);

    const POACHER_CAMP = { x: -520, z: 310 };
    const poachY = addPad(POACHER_CAMP.x, POACHER_CAMP.z, 28, 24, 8);
    building(POACHER_CAMP.x, POACHER_CAMP.z - 5, 9, 7, poachY, 'wood_fort', 's', 3.2);
    B(POACHER_CAMP.x - 8, poachY + 0.6, POACHER_CAMP.z + 6, 4, 1.2, 0.8, 'sandbag');

    const WOLF_DEN = { x: -355, z: 455 };
    const wolfY = addPad(WOLF_DEN.x, WOLF_DEN.z, 24, 22, 8);
    B(WOLF_DEN.x, wolfY + 2.2, WOLF_DEN.z - 6, 8, 4.4, 5, 'bunker_stone');

    const BARROW_ENT = { x: -475, z: 445 };
    const barrowEntY = addPad(BARROW_ENT.x, BARROW_ENT.z, 26, 24, 8);
    B(BARROW_ENT.x - 5, barrowEntY + 2.5, BARROW_ENT.z - 4, 3, 5, 6, 'castle_stone');
    B(BARROW_ENT.x + 5, barrowEntY + 2.5, BARROW_ENT.z - 4, 3, 5, 6, 'castle_stone');
    B(BARROW_ENT.x, barrowEntY + 5.3, BARROW_ENT.z - 4, 13, 0.8, 6, 'castle_stone');

    // 2. Barrow-Moor Graveyard: Grimhollow Chapel (Outpost) + Crypt of Marrow + Crimson Manor + Gallow's Mound
    const CHAPEL = { x: -425, z: 15 };
    const chapelY = addPad(CHAPEL.x, CHAPEL.z, 36, 32, 10);
    building(CHAPEL.x, CHAPEL.z - 6, 12, 9, chapelY, 'castle_stone', 's', 4.6);

    const CRYPT_MOOR = { x: -475, z: -75 };
    const cryptY = addPad(CRYPT_MOOR.x, CRYPT_MOOR.z, 32, 28, 10);
    building(CRYPT_MOOR.x, CRYPT_MOOR.z - 5, 10, 8, cryptY, 'castle_stone', 's', 4.0);
    watchtower(CRYPT_MOOR.x - 11, CRYPT_MOOR.z - 8, cryptY, 'castle_stone', 7);

    const VAMP_MANOR = { x: -535, z: 95 };
    const vampY = addPad(VAMP_MANOR.x, VAMP_MANOR.z, 38, 34, 10);
    building(VAMP_MANOR.x, VAMP_MANOR.z - 6, 14, 10, vampY, 'brick', 's', 5.0);
    watchtower(VAMP_MANOR.x - 10, VAMP_MANOR.z - 8, vampY, 'castle_stone', 9);
    watchtower(VAMP_MANOR.x + 10, VAMP_MANOR.z - 8, vampY, 'castle_stone', 9);

    const GALLOWS = { x: -345, z: -65 };
    addPad(GALLOWS.x, GALLOWS.z, 26, 24, 8);

    // 3. Rust Sprawl & Mire Delta Outer Sites: Foundry Depths Yard + Coven Bog
    const FOUNDRY_YARD = { x: 135, z: 265 };
    const foundryY = addPad(FOUNDRY_YARD.x, FOUNDRY_YARD.z, 34, 28, 10);
    building(FOUNDRY_YARD.x, FOUNDRY_YARD.z - 5, 12, 8, foundryY, 'rusted_metal', 's', 4.2);
    B(FOUNDRY_YARD.x + 10, foundryY + 1.3, FOUNDRY_YARD.z + 5, 6, 2.6, 2.8, 'container_red');

    const COVEN_BOG = { x: 325, z: 85 };
    const covenY = addPad(COVEN_BOG.x, COVEN_BOG.z, 28, 26, 8, 1.0);
    building(COVEN_BOG.x, COVEN_BOG.z - 4, 8, 7, covenY, 'wood_plank', 's', 3.4);

    // 4. Ash Quarry Outer: Deep-Vein Minehead
    const MINEHEAD = { x: -255, z: -115 };
    const mineY = addPad(MINEHEAD.x, MINEHEAD.z, 28, 24, 8);
    building(MINEHEAD.x, MINEHEAD.z - 5, 9, 7, mineY, 'soviet_concrete', 's', 3.8);

    // 5. Sunscorched Badlands: Dustwind Oasis (Outpost) + Redrock Outlaw Mesa + Sunfang Pyramid Ruins + Scorpion Canyon
    const OASIS = { x: 385, z: 395 };
    const oasisY = addPad(OASIS.x, OASIS.z, 40, 36, 12);
    building(OASIS.x - 8, OASIS.z - 6, 10, 8, oasisY, 'yellow_siding', 's', 3.6);
    building(OASIS.x + 9, OASIS.z - 6, 9, 7, oasisY, 'wood_plank', 's', 3.4);

    const REDROCK_MESA = { x: 300, z: 485 };
    const mesaY = addPad(REDROCK_MESA.x, REDROCK_MESA.z, 34, 28, 10);
    building(REDROCK_MESA.x, REDROCK_MESA.z - 5, 11, 8, mesaY, 'rusted_metal', 's', 3.8);
    B(REDROCK_MESA.x - 9, mesaY + 0.6, REDROCK_MESA.z + 6, 5, 1.2, 0.8, 'sandbag');

    const SUNFANG_RUINS = { x: 485, z: 470 };
    const sunfangY = addPad(SUNFANG_RUINS.x, SUNFANG_RUINS.z, 38, 36, 10);
    for (let i = 0; i < 4; i++) {
        const s = 18 - i * 3.6;
        B(SUNFANG_RUINS.x, sunfangY + 0.9 + i * 1.8, SUNFANG_RUINS.z - 6, s, 1.8, s, 'pentagon_marble');
    }

    const SCORPION_CANYON = { x: 495, z: 295 };
    addPad(SCORPION_CANYON.x, SCORPION_CANYON.z, 30, 28, 8);

    // 6. Sunken Ruin Coast: Drowned Lighthouse + Shipwreck Shoals + Abyssal Sanctum Gate
    const LIGHTHOUSE = { x: 470, z: -45 };
    const lightY = addPad(LIGHTHOUSE.x, LIGHTHOUSE.z, 32, 30, 10, 1.8);
    watchtower(LIGHTHOUSE.x, LIGHTHOUSE.z - 6, lightY, 'castle_stone', 18);

    const SHIPWRECK = { x: 535, z: 75 };
    const wreckY = addPad(SHIPWRECK.x, SHIPWRECK.z, 30, 24, 8, 1.0);
    B(SHIPWRECK.x, wreckY + 1.4, SHIPWRECK.z - 3, 14, 2.8, 5, 'wood_fort');

    const DROWNED_GATE = { x: 525, z: -135 };
    const drownedY = addPad(DROWNED_GATE.x, DROWNED_GATE.z, 28, 26, 8, 1.5);
    for (const dx of [-5, 5]) B(DROWNED_GATE.x + dx, drownedY + 3, DROWNED_GATE.z - 4, 2, 6, 2, 'castle_stone');
    B(DROWNED_GATE.x, drownedY + 6.4, DROWNED_GATE.z - 4, 12, 1, 2.4, 'castle_stone');

    // 7. Alpine Outer & Frostfang Peaks: Black-Site Sublevel Hatch + Frostspire Castle Keep + Glacier Pass
    const BLACKLAB_TOP = { x: -165, z: -285 };
    const blackY = addPad(BLACKLAB_TOP.x, BLACKLAB_TOP.z, 28, 24, 8);
    building(BLACKLAB_TOP.x, BLACKLAB_TOP.z - 5, 10, 7, blackY, 'lab_panel', 's', 3.8);

    const FROSTSPIRE = { x: -455, z: -445 };
    const frostY = addPad(FROSTSPIRE.x, FROSTSPIRE.z, 48, 44, 12);
    building(FROSTSPIRE.x, FROSTSPIRE.z - 8, 16, 12, frostY, 'castle_stone', 's', 5.6);
    watchtower(FROSTSPIRE.x - 14, FROSTSPIRE.z - 10, frostY, 'castle_stone', 12);
    watchtower(FROSTSPIRE.x + 14, FROSTSPIRE.z - 10, frostY, 'castle_stone', 12);
    watchtower(FROSTSPIRE.x - 14, FROSTSPIRE.z + 12, frostY, 'castle_stone', 9);
    watchtower(FROSTSPIRE.x + 14, FROSTSPIRE.z + 12, frostY, 'castle_stone', 9);

    const GLACIER_PASS = { x: -330, z: -380 };
    addPad(GLACIER_PASS.x, GLACIER_PASS.z, 30, 28, 8);

    // 8. Obsidian Dragonwilds: Dragonbone Outpost (Safe Camp) + Wyvern Roost + Obsidian Dragon Vault
    const DRAGON_CAMP = { x: 355, z: -345 };
    const dcampY = addPad(DRAGON_CAMP.x, DRAGON_CAMP.z, 36, 32, 10);
    building(DRAGON_CAMP.x, DRAGON_CAMP.z - 6, 11, 8, dcampY, 'castle_stone', 's', 4.0);

    const WYVERN_ROOST = { x: 430, z: -395 };
    const roostY = addPad(WYVERN_ROOST.x, WYVERN_ROOST.z, 34, 30, 10);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; B(WYVERN_ROOST.x + Math.cos(a) * 9, roostY + 3.2, WYVERN_ROOST.z + Math.sin(a) * 9, 1.4, 6.4, 1.4, 'bunker_stone'); }

    const DRAGON_VAULT_TOP = { x: 485, z: -485 };
    const dvTopY = addPad(DRAGON_VAULT_TOP.x, DRAGON_VAULT_TOP.z, 40, 36, 10);
    watchtower(DRAGON_VAULT_TOP.x - 10, DRAGON_VAULT_TOP.z - 6, dvTopY, 'bunker_stone', 11);
    watchtower(DRAGON_VAULT_TOP.x + 10, DRAGON_VAULT_TOP.z - 6, dvTopY, 'bunker_stone', 11);
    B(DRAGON_VAULT_TOP.x, dvTopY + 7.5, DRAGON_VAULT_TOP.z - 6, 22, 1.6, 4, 'bunker_stone');

    /* ================================================================ 12 SEALED UNDERGROUND DUNGEONS (x >= 1600, z >= 1600) */
    const INT = { x: 1600, z: 1600 };
    // 1. Original Culvert Sublevel at (1600, 1600) — exact layout preserved for quest & QA parity!
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

    // Parametric Multi-Chamber Sealed Dungeon Builder for Dungeons 2..12
    const DUNGEONS = [
        { id: 'culvert_sublevel', name: 'Culvert Sublevel', region: 'haven_basin', lvl: '3–6', x: INT.x, z: INT.z, surf: { x: PUMP.x - 8, z: PUMP.z + 5 } },
        { id: 'dng_whisper_barrow', name: 'Whispering Root-Barrow', region: 'whispering_woods', lvl: '5–9', x: 1900, z: 1600, wallMat: 'castle_stone', floorMat: 'bunker_stone', surf: { x: BARROW_ENT.x, z: BARROW_ENT.z + 3 },
            enemies: ['orc_reaver', 'timber_wolf', 'orc_reaver', 'puglin_scamp'], boss: 'boss_thornback_orc', grant: null },
        { id: 'dng_foundry_depths', name: 'Ironclad Foundry Depths', region: 'rust_sprawl', lvl: '8–12', x: 2200, z: 1600, wallMat: 'rust_steel', floorMat: 'diamond_plate', surf: { x: FOUNDRY_YARD.x, z: FOUNDRY_YARD.z + 4 },
            enemies: ['enforcer', 'syn_gunner', 'syn_arc_tech', 'quarry_sapper'], boss: 'boss_foundry_kragg', grant: 'w_mg42_scrap' },
        { id: 'dng_sunken_crypt', name: 'Sunken Crypt of Marrow', region: 'barrow_moor', lvl: '11–16', x: 2500, z: 1600, wallMat: 'castle_stone', floorMat: 'bunker_stone', surf: { x: CRYPT_MOOR.x, z: CRYPT_MOOR.z + 4 },
            enemies: ['skeleton_warrior', 'grave_zombie', 'barrow_ghost', 'crypt_keeper'], boss: 'boss_lich_malgath', grant: 'barrow_seal' },
        { id: 'dng_vampire_vault', name: 'Crimson Sanctum Vaults', region: 'barrow_moor', lvl: '14–19', x: 1600, z: 1900, wallMat: 'brick', floorMat: 'pentagon_marble', surf: { x: VAMP_MANOR.x, z: VAMP_MANOR.z + 6 },
            enemies: ['skeleton_warrior', 'crypt_keeper', 'blood_vampire', 'blood_vampire'], boss: 'boss_lord_vespera', grant: 'relic_lich_phylactery' },
        { id: 'dng_coven_cavern', name: 'Mire Witch Coven Cavern', region: 'mire_delta', lvl: '15–20', x: 1900, z: 1900, wallMat: 'bunker_stone', floorMat: 'bunker_stone', surf: { x: COVEN_BOG.x, z: COVEN_BOG.z + 5 },
            enemies: ['mire_witch', 'brood_blight_hound', 'spitter', 'brood_frost_wraith'], boss: 'boss_coven_morwen', grant: 'elixir_wisdom' },
        { id: 'dng_dwarven_mine', name: 'Deep-Vein Quarry Mines', region: 'ash_quarry', lvl: '18–24', x: 2200, z: 1900, wallMat: 'bunker_stone', floorMat: 'concrete', surf: { x: MINEHEAD.x, z: MINEHEAD.z + 4 },
            enemies: ['brood_pyro_fiend', 'quarry_sapper', 'brood_iron_goliath', 'imp_firestarter'], boss: 'boss_molten_ignis', grant: 'mithril_ore' },
        { id: 'dng_sand_tomb', name: "Sunfang Pharaoh's Tomb", region: 'sunscorched_badlands', lvl: '21–27', x: 2500, z: 1900, wallMat: 'pentagon_marble', floorMat: 'pentagon_panel', surf: { x: SUNFANG_RUINS.x, z: SUNFANG_RUINS.z + 8 },
            enemies: ['skeleton_warrior', 'dune_scorpion', 'sunfang_guardian', 'sunfang_guardian'], boss: 'boss_pharaoh_kharim', grant: 'sunfang_idol' },
        { id: 'dng_drowned_sanctum', name: 'Abyssal Tide Sanctum', region: 'sunken_coast', lvl: '25–31', x: 1600, z: 2200, wallMat: 'castle_stone', floorMat: 'bunker_stone', surf: { x: DROWNED_GATE.x, z: DROWNED_GATE.z + 2 },
            enemies: ['drowned_corsair', 'abyssal_siren', 'drowned_corsair', 'brood_frost_wraith'], boss: 'boss_tide_nereus', grant: 'w_an94_cryo' },
        { id: 'dng_aegis_blacklab', name: 'Aegis Black-Site Sublevel 9', region: 'alpine_array', lvl: '28–35', x: 1900, z: 2200, wallMat: 'lab_panel', floorMat: 'diamond_plate', surf: { x: BLACKLAB_TOP.x, z: BLACKLAB_TOP.z + 4 },
            enemies: ['aegis', 'aegis_heavy', 'aegis_cryo', 'brood_iron_goliath'], boss: 'boss_omega_zero', grant: 'w_minigun_titan' },
        { id: 'dng_frostspire_keep', name: 'Frostspire Citadel Undercroft', region: 'frostfang_peaks', lvl: '33–41', x: 2200, z: 2200, wallMat: 'castle_stone', floorMat: 'pentagon_marble', surf: { x: FROSTSPIRE.x, z: FROSTSPIRE.z + 5 },
            enemies: ['frost_knight', 'glacier_troll', 'frost_wyrmling', 'frost_knight'], boss: 'boss_frost_valdris', grant: 'frostspire_crown' },
        { id: 'dng_dragon_vault', name: 'Obsidian Dragonwild Vault', region: 'obsidian_dragonwilds', lvl: '42–50', x: 2500, z: 2200, wallMat: 'bunker_stone', floorMat: 'pentagon_marble', surf: { x: DRAGON_VAULT_TOP.x, z: DRAGON_VAULT_TOP.z + 4 },
            enemies: ['obsidian_cultist', 'ashen_drake', 'dragonwild_juggernaut', 'ashen_drake'], boss: 'boss_dragon_vaelgor', grant: 'vaelgor_fang' }
    ];

    function buildDungeonGeometry(d) {
        const x = d.x, z = d.z, H = 5.4, Wd = 32, Ln = 72;
        B(x, -0.2, z + 30, Wd, 0.4, Ln, d.floorMat);
        B(x, H + 0.2, z + 30, Wd, 0.4, Ln, d.wallMat);
        B(x - Wd / 2, H / 2, z + 30, 0.8, H, Ln, d.wallMat);
        B(x + Wd / 2, H / 2, z + 30, 0.8, H, Ln, d.wallMat);
        B(x, H / 2, z - 6, Wd, H, 0.8, d.wallMat);
        B(x, H / 2, z + 66, Wd, H, 0.8, d.wallMat);
        // Chamber 1 divider with wide archway
        B(x - 10, H / 2, z + 14, 12, H, 0.8, d.wallMat);
        B(x + 10, H / 2, z + 14, 12, H, 0.8, d.wallMat);
        // Chamber 2 pillars & tactical cover
        for (const dz of [24, 36, 48]) {
            B(x - 9, H / 2, z + dz, 1.6, H, 1.6, d.wallMat);
            B(x + 9, H / 2, z + dz, 1.6, H, 1.6, d.wallMat);
        }
        B(x - 5, 0.7, z + 28, 3.2, 1.4, 1.2, d.wallMat);
        B(x + 5, 0.7, z + 40, 3.2, 1.4, 1.2, d.wallMat);
        // Boss dais at back of sanctum
        B(x, 0.25, z + 58, 12, 0.5, 10, d.floorMat);
    }
    for (let i = 1; i < DUNGEONS.length; i++) buildDungeonGeometry(DUNGEONS[i]);

    /* ================================================================ ALL 60 POIS (48 Surface + 12 Sealed Dungeons) */
    const POIS = [
        // Original 19 POIs (exact IDs preserved)
        { id: 'freestead', name: 'Freestead Town', region: 'haven_basin', x: TOWN.x, z: TOWN.z, r: 34, safe: true, kind: 'settlement' },
        { id: 'pump_three', name: 'Culvert Pumphouse', region: 'haven_basin', x: PUMP.x, z: PUMP.z, r: 18, kind: 'site',
            spawns: [['crawler', -8, 10], ['crawler', 9, 12], ['raider', 13, -8], ['puglin_scamp', -11, -7]] },
        { id: 'overpass', name: 'Raider Overpass', region: 'haven_basin', x: OVER.x, z: OVER.z, r: 26, kind: 'camp',
            spawns: [['raider', -10, 5], ['raider', 11, -5], ['raider_pyro', 15, 6], ['raider_marksman', 0, -2, 5.8], ['raider_boss', 2, 10]] },
        { id: 'relay', name: 'Abandoned Relay', region: 'haven_basin', x: RELAY.x, z: RELAY.z, r: 16, kind: 'site',
            spawns: [['crawler', 8, -8], ['brood_venom_mite', -8, 8], ['puglin_scamp', 0, -9]] },
        { id: 'convoy', name: 'Crashed Convoy', region: 'haven_basin', x: CONVOY.x, z: CONVOY.z, r: 18, kind: 'site',
            spawns: [['crawler', -4, 9], ['stalker', 10, -7], ['brood_venom_mite', 12, 5]] },
        { id: 'shale_cave', name: 'Shale Cave', region: 'haven_basin', x: CAVE.x, z: CAVE.z, r: 18, kind: 'nest',
            spawns: [['crawler', 0, 10], ['crawler', 4, 11], ['stalker', -4, 10], ['spitter', 0, 13]] },
        { id: 'rail_yard', name: 'Ironclad Rail Yard', region: 'rust_sprawl', x: YARD.x, z: YARD.z, r: 30, kind: 'hub', faction: 'syndicate',
            spawns: [['enforcer', 8, -6], ['enforcer', -14, 10], ['syn_gunner', 15, -2], ['syn_arc_tech', 4, -14]] },
        { id: 'quarry_camp', name: 'Quarry Dig Camp', region: 'ash_quarry', x: QCAMP.x, z: QCAMP.z, r: 22, kind: 'contested',
            spawns: [['militia', -8, 8], ['militia_scout', -10, -5], ['enforcer', 10, 7], ['syn_gunner', 12, -7]] },
        { id: 'quarry_pit', name: 'Excavator Pit', region: 'ash_quarry', x: QUARRY.x, z: QUARRY.z, r: 34, kind: 'site',
            spawns: [['brood_pyro_fiend', 14, 0], ['brute', -10, 12], ['spitter', 8, -14], ['boss_quarry_colossus', 18, 16]] },
        { id: 'checkpoint', name: 'Aegis Checkpoint K-4', region: 'alpine_array', x: CHECK.x, z: CHECK.z, r: 20, kind: 'hub', faction: 'aegis',
            spawns: [['aegis', 10, -4], ['aegis_heavy', 10, 4]] },
        { id: 'dish_ridge', name: 'Deep-Space Dish Ridge', region: 'alpine_array', x: -60, z: -238, r: 34, kind: 'site',
            spawns: [['aegis', 0, 10], ['aegis_cryo', 14, -6], ['stalker', -14, 2], ['boss_alpine_warden', -18, 14]] },
        { id: 'helix_shrine', name: 'Helix Bloom Shrine', region: 'meridian_core', x: SHRINE.x, z: SHRINE.z, r: 16, kind: 'hub', faction: 'helix',
            spawns: [['helix', 9, 8], ['helix_zealot', -9, -8]] },
        { id: 'mire_nest', name: 'Cooling Stack Nest', region: 'mire_delta', x: NEST.x, z: NEST.z, r: 28, kind: 'nest',
            spawns: [['brood_blight_hound', 0, 12], ['spitter', 10, -8], ['brood_frost_wraith', -12, 2], ['boss_mire_hydra', -8, 14]] },
        { id: 'goliath', name: 'Goliath Crane', region: 'rust_sprawl', x: 90, z: 232, r: 18, kind: 'site',
            spawns: [['raider_bruiser', 0, 10], ['raider_pyro', 10, -4], ['syn_sniper', -8, 8]] },
        { id: 'sunken_barge', name: 'Sunken Cargo Barge', region: 'mire_delta', x: BARGE.x, z: BARGE.z, r: 18, kind: 'site',
            spawns: [['brood_blight_hound', -8, 8], ['brood_frost_wraith', 9, -7], ['spitter', 8, 8]] },
        { id: 'bunker_delta', name: 'Bunker Delta', region: 'alpine_array', x: BUNKER.x, z: BUNKER.z, r: 20, kind: 'site',
            spawns: [['aegis_heavy', 9, 9], ['aegis_cryo', -9, 8], ['brood_iron_goliath', 11, -8]] },
        { id: 'crater_rift', name: 'Crater Anomaly Rift', region: 'meridian_core', x: RIFT.x, z: RIFT.z, r: 20, kind: 'site',
            spawns: [['helix_voidweaver', 8, 8], ['helix_zealot', -9, 6], ['brood_void_stalker', 0, -11]] },
        { id: 'meridian_dome', name: 'Meridian Containment Dome', region: 'meridian_core', x: CORE.x, z: CORE.z, r: 42, kind: 'endgame',
            spawns: [['helix_voidweaver', 24, 0], ['brood_iron_goliath', -20, 14], ['helix', 0, -26], ['boss_meridian_sovereign', 16, 20]] },
        { id: 'culvert_sublevel', name: 'Culvert Sublevel', region: 'haven_basin', x: INT.x, z: INT.z + 22, r: 30, kind: 'interior', interior: true,
            spawns: [['crawler', -6, 0], ['crawler', 6, 4], ['stalker', 0, 10], ['spitter', -8, 16], ['matriarch', 0, 22]] },

        // --- NEW OUTER FRONTIER SURFACE POIS ---
        { id: 'whisper_lodge', name: "Ranger's Watch Lodge", region: 'whispering_woods', x: LODGE.x, z: LODGE.z, r: 28, safe: true, kind: 'settlement' },
        { id: 'poacher_palisade', name: 'Poacher Palisade', region: 'whispering_woods', x: POACHER_CAMP.x, z: POACHER_CAMP.z, r: 24, kind: 'camp',
            spawns: [['forest_poacher', -9, 8], ['forest_poacher', 9, 8], ['raider_bruiser', 0, 11], ['timber_wolf', -11, -4]] },
        { id: 'wolf_den', name: 'Dire Wolf Den', region: 'whispering_woods', x: WOLF_DEN.x, z: WOLF_DEN.z, r: 22, kind: 'nest',
            spawns: [['timber_wolf', -7, 7], ['timber_wolf', 7, 7], ['timber_wolf', 0, 11], ['orc_reaver', -8, -2]] },
        { id: 'barrow_gate', name: 'Root-Barrow Mound', region: 'whispering_woods', x: BARROW_ENT.x, z: BARROW_ENT.z, r: 22, kind: 'site',
            spawns: [['orc_reaver', -9, 8], ['orc_reaver', 9, 8], ['puglin_scamp', 0, 12]] },

        { id: 'grimhollow_chapel', name: 'Grimhollow Sanctuary', region: 'barrow_moor', x: CHAPEL.x, z: CHAPEL.z, r: 26, safe: true, kind: 'settlement' },
        { id: 'marrow_crypt_yard', name: 'Marrow Boneyard', region: 'barrow_moor', x: CRYPT_MOOR.x, z: CRYPT_MOOR.z, r: 26, kind: 'site',
            spawns: [['skeleton_warrior', -9, 9], ['skeleton_warrior', 9, 9], ['grave_zombie', -10, 2], ['barrow_ghost', 10, 2]] },
        { id: 'vampire_manor', name: 'Crimson Manor Courtyard', region: 'barrow_moor', x: VAMP_MANOR.x, z: VAMP_MANOR.z, r: 28, kind: 'camp',
            spawns: [['blood_vampire', -10, 10], ['crypt_keeper', 10, 10], ['skeleton_warrior', 0, 13]] },
        { id: 'gallows_cross', name: "Gallow's Crossroads", region: 'barrow_moor', x: GALLOWS.x, z: GALLOWS.z, r: 22, kind: 'site',
            spawns: [['grave_zombie', -7, 6], ['barrow_ghost', 7, 6], ['skeleton_warrior', 0, -7]] },

        { id: 'foundry_yard', name: 'Smuggler Foundry Yard', region: 'rust_sprawl', x: FOUNDRY_YARD.x, z: FOUNDRY_YARD.z, r: 26, kind: 'camp',
            spawns: [['enforcer', -10, 9], ['syn_gunner', 10, 9], ['syn_arc_tech', 0, 12], ['imp_firestarter', -11, -3]] },
        { id: 'coven_hut', name: 'Witch Coven Bog', region: 'mire_delta', x: COVEN_BOG.x, z: COVEN_BOG.z, r: 24, kind: 'nest',
            spawns: [['mire_witch', -8, 9], ['mire_witch', 8, 9], ['brood_blight_hound', 0, 12]] },
        { id: 'quarry_minehead', name: 'Deep-Vein Minehead', region: 'ash_quarry', x: MINEHEAD.x, z: MINEHEAD.z, r: 24, kind: 'site',
            spawns: [['quarry_sapper', -9, 8], ['brood_pyro_fiend', 9, 8], ['imp_firestarter', 0, 11]] },

        { id: 'dustwind_oasis', name: 'Dustwind Caravan Oasis', region: 'sunscorched_badlands', x: OASIS.x, z: OASIS.z, r: 28, safe: true, kind: 'settlement' },
        { id: 'redrock_mesa', name: 'Redrock Outlaw Mesa', region: 'sunscorched_badlands', x: REDROCK_MESA.x, z: REDROCK_MESA.z, r: 26, kind: 'camp',
            spawns: [['badlands_outlaw', -10, 9], ['badlands_outlaw', 10, 9], ['badlands_sharpshooter', 0, 12]] },
        { id: 'sunfang_ruins', name: 'Sunfang Pyramid Plaza', region: 'sunscorched_badlands', x: SUNFANG_RUINS.x, z: SUNFANG_RUINS.z, r: 30, kind: 'site',
            spawns: [['sunfang_guardian', -11, 11], ['sunfang_guardian', 11, 11], ['dune_scorpion', 0, 14]] },
        { id: 'scorpion_canyon', name: 'Scorpion Gulch', region: 'sunscorched_badlands', x: SCORPION_CANYON.x, z: SCORPION_CANYON.z, r: 24, kind: 'nest',
            spawns: [['dune_scorpion', -8, 6], ['dune_scorpion', 8, 6], ['dune_scorpion', 0, -8]] },

        { id: 'drowned_lighthouse', name: 'Drowned Lighthouse', region: 'sunken_coast', x: LIGHTHOUSE.x, z: LIGHTHOUSE.z, r: 26, kind: 'site',
            spawns: [['drowned_corsair', -9, 9], ['abyssal_siren', 9, 9], ['drowned_corsair', 0, 12]] },
        { id: 'shipwreck_shoals', name: 'Galleon Shipwreck Shoals', region: 'sunken_coast', x: SHIPWRECK.x, z: SHIPWRECK.z, r: 24, kind: 'site',
            spawns: [['drowned_corsair', -8, 8], ['drowned_corsair', 8, 8], ['abyssal_siren', 0, 10]] },
        { id: 'abyssal_gate', name: 'Tide-Sanctum Arch', region: 'sunken_coast', x: DROWNED_GATE.x, z: DROWNED_GATE.z, r: 24, kind: 'site',
            spawns: [['abyssal_siren', -9, 7], ['abyssal_siren', 9, 7], ['drowned_corsair', 0, 10]] },

        { id: 'blacklab_surface', name: 'Aegis Black-Site Perimeter', region: 'alpine_array', x: BLACKLAB_TOP.x, z: BLACKLAB_TOP.z, r: 24, kind: 'camp',
            spawns: [['aegis_heavy', -9, 8], ['aegis_cryo', 9, 8], ['aegis', 0, 11]] },
        { id: 'frostspire_courtyard', name: 'Frostspire Castle Keep', region: 'frostfang_peaks', x: FROSTSPIRE.x, z: FROSTSPIRE.z, r: 34, kind: 'camp',
            spawns: [['frost_knight', -10, 9], ['frost_knight', 10, 9], ['glacier_troll', 0, 15], ['frost_wyrmling', -12, 3]] },
        { id: 'glacier_pass', name: 'Frozen Wyrm Pass', region: 'frostfang_peaks', x: GLACIER_PASS.x, z: GLACIER_PASS.z, r: 26, kind: 'nest',
            spawns: [['glacier_troll', -8, 6], ['frost_wyrmling', 8, 6], ['frost_wyrmling', 0, -8]] },

        { id: 'dragonbone_outpost', name: 'Dragonbone Expedition Camp', region: 'obsidian_dragonwilds', x: DRAGON_CAMP.x, z: DRAGON_CAMP.z, r: 26, safe: true, kind: 'settlement' },
        { id: 'wyvern_roost', name: 'Ashen Wyvern Roost', region: 'obsidian_dragonwilds', x: WYVERN_ROOST.x, z: WYVERN_ROOST.z, r: 30, kind: 'nest',
            spawns: [['ashen_drake', -11, 0], ['ashen_drake', 11, 0], ['obsidian_cultist', 0, 12], ['dragonwild_juggernaut', 0, -12]] },
        { id: 'dragon_citadel_gate', name: 'Obsidian Vault Threshold', region: 'obsidian_dragonwilds', x: DRAGON_VAULT_TOP.x, z: DRAGON_VAULT_TOP.z, r: 34, kind: 'endgame',
            spawns: [['dragonwild_juggernaut', -10, 10], ['ashen_drake', 10, 10], ['helix_archon', 0, 14], ['boss_abyssal_archon', 0, -15]] }
    ];

    // Append Dungeons 2..12 as interior POIs
    for (let i = 1; i < DUNGEONS.length; i++) {
        const d = DUNGEONS[i];
        POIS.push({
            id: d.id, name: d.name, region: d.region, x: d.x, z: d.z + 30, r: 38, kind: 'interior', interior: true,
            spawns: [
                [d.enemies[0], -6, -10],
                [d.enemies[1], 6, -6],
                [d.enemies[2], -7, 6],
                [d.enemies[3], 7, 10],
                [d.boss, 0, 26]
            ]
        });
    }

    const NPCS = [
        { id: 'kessler', name: 'Warden Kessler', faction: 'militia', x: TOWN.x - 12, z: TOWN.z - 15, indoor: true, yaw: 0, dialogue: 'kessler' },
        { id: 'dottie', name: 'Dottie Vail', faction: 'militia', x: TOWN.x + 12, z: TOWN.z - 13, indoor: true, yaw: 0, dialogue: 'dottie', vendor: 'freestead_store' },
        { id: 'ines', name: 'Medic Ines', faction: 'militia', x: TOWN.x - 12, z: TOWN.z + 13, indoor: true, yaw: Math.PI, dialogue: 'ines' },
        { id: 'sola', name: 'Engineer Sola', faction: 'militia', x: TOWN.x + 13, z: TOWN.z + 13, indoor: true, yaw: Math.PI, dialogue: 'sola' },
        { id: 'torin', name: 'Quartermaster Torin', faction: 'militia', x: TOWN.x + 6, z: TOWN.z + 6, yaw: -Math.PI * 0.75, dialogue: 'torin', vendor: 'torin_bench' },
        { id: 'mags', name: 'Mags Orrin', faction: 'syndicate', x: YARD.x - 10, z: YARD.z - 8, indoor: true, yaw: Math.PI / 2, dialogue: 'mags', vendor: 'syndicate_fence' },
        { id: 'vance', name: 'Lt. Imre Vance', faction: 'aegis', x: CHECK.x - 6, z: CHECK.z, indoor: true, yaw: Math.PI / 2, dialogue: 'vance', vendor: 'aegis_quarter' },
        { id: 'lyra', name: 'Dr. Lyra Chen', faction: 'aegis', x: QCAMP.x + 6, z: QCAMP.z - 6, yaw: Math.PI * 0.5, dialogue: 'lyra', vendor: 'lyra_field' },
        { id: 'calla', name: 'Sister Calla', faction: 'helix', x: SHRINE.x, z: SHRINE.z, yaw: 0, dialogue: 'calla', vendor: 'helix_exchange' },
        // 4 New Outer Frontier Settlement NPCs
        { id: 'halvar', name: 'Captain Halvar', faction: 'militia', x: LODGE.x - 8, z: LODGE.z - 6, indoor: true, yaw: 0, dialogue: 'halvar', vendor: 'halvar_lodge' },
        { id: 'orlok', name: 'Grave-Warden Orlok', faction: 'helix', x: CHAPEL.x, z: CHAPEL.z + 4, yaw: 0, dialogue: 'orlok', vendor: 'orlok_apothecary' },
        { id: 'zahra', name: 'Caravan Master Zahra', faction: 'syndicate', x: OASIS.x - 8, z: OASIS.z - 6, indoor: true, yaw: 0, dialogue: 'zahra', vendor: 'zahra_bazaar' },
        { id: 'eryndor', name: 'Scholar Eryndor', faction: 'aegis', x: DRAGON_CAMP.x, z: DRAGON_CAMP.z + 5, yaw: 0, dialogue: 'eryndor' }
    ];

    const INTERACTS = [
        { id: 'c_town_stash', kind: 'stash', name: 'Personal Stash', x: TOWN.x - 22, z: TOWN.z + 4 },
        { id: 'w_town_bench', kind: 'workbench', name: 'Field Repair Bench', x: TOWN.x + 8, z: TOWN.z + 4 },
        { id: 'b_town_bounties', kind: 'bounty_board', name: 'Freestead Notice Board', x: TOWN.x - 4, z: TOWN.z - 4 },
        { id: 'c_pump_office', kind: 'container', name: 'Foreman Locker', x: PUMP.x + 2.5, z: PUMP.z - 2.5, indoor: true, loot: 'cache', grant: 'pressure_schematic' },
        { id: 't_junction', kind: 'terminal', name: 'Surface Junction', x: PUMP.x + 8, z: PUMP.z + 5.6 },
        { id: 'h_culvert', kind: 'hatch', name: 'Sublevel Hatch', x: PUMP.x - 8, z: PUMP.z + 5, dngId: 'culvert_sublevel', dngName: 'Culvert Sublevel', to: { x: INT.x, y: 0.1, z: INT.z - 3, yaw: Math.PI } },
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
        { id: 'c_crater_rift', kind: 'container', name: 'Helix Cipher Chest', x: RIFT.x + 4, z: RIFT.z - 4, loot: 'locked', grant: 'helix_cipher' },

        // Settlement Notice Boards, Workbenches & Stashes across Frontier Outposts
        { id: 'b_lodge_board', kind: 'bounty_board', name: 'Pinewoods Notice Board', x: LODGE.x + 2, z: LODGE.z + 4 },
        { id: 'w_lodge_bench', kind: 'workbench', name: 'Ranger Repair Anvil', x: LODGE.x - 2, z: LODGE.z + 4 },
        { id: 'b_chapel_board', kind: 'bounty_board', name: 'Grimhollow Contract Board', x: CHAPEL.x - 6, z: CHAPEL.z + 6 },
        { id: 'b_oasis_board', kind: 'bounty_board', name: 'Dustwind Bounty Board', x: OASIS.x + 2, z: OASIS.z + 5 },
        { id: 'w_oasis_bench', kind: 'workbench', name: 'Caravan Tinker Bench', x: OASIS.x - 3, z: OASIS.z + 5 },
        { id: 'c_oasis_stash', kind: 'stash', name: 'Caravan Vault Stash', x: OASIS.x + 8, z: OASIS.z + 5 },
        { id: 'w_dragon_bench', kind: 'workbench', name: 'Dragonbone Field Forge', x: DRAGON_CAMP.x + 6, z: DRAGON_CAMP.z + 4 }
    ];

    // Add Entrances, Exits & Boss Hoard Chests for Dungeons 2..12
    for (let i = 1; i < DUNGEONS.length; i++) {
        const d = DUNGEONS[i];
        INTERACTS.push(
            { id: 'h_' + d.id, kind: 'dungeon_gate', name: d.name + ' Entrance', dngId: d.id, dngName: d.name, dngLvl: d.lvl, x: d.surf.x, z: d.surf.z, to: { x: d.x, y: 0.15, z: d.z - 2, yaw: 0 } },
            { id: 'x_' + d.id, kind: 'exit', name: 'Exit ' + d.name, x: d.x, z: d.z - 4.5, int: true, to: { x: d.surf.x, z: d.surf.z + 4.5, yaw: 0 } },
            { id: 'c_' + d.id + '_hoard', kind: 'container', name: d.name + ' Hoard Chest', x: d.x, z: d.z + 62, int: true, loot: 'locked', grant: d.grant || undefined },
            { id: 'c_' + d.id + '_side', kind: 'container', name: 'Reliquary Coffer', x: d.x - 11, z: d.z + 32, int: true, loot: 'cache' }
        );
    }

    // 8 Skyrim-Style Standing Stones (each placed on a safe dry pad)
    const STONES_LAYOUT = [
        ['stone_lover',    "The Pilgrim's Stone",  -235, 235],
        ['stone_warrior',  'The Warrior Stone',    -390, 330],
        ['stone_shadow',   'The Shadow Stone',     -410, -45],
        ['stone_steed',    'The Steed Stone',       95,  175],
        ['stone_mage',     'The Ritual Mage Stone', 255, -25],
        ['stone_slayer',   'The Monster Stone',     355, 365],
        ['stone_atronach', 'The Bastion Stone',    -395, -395],
        ['stone_dragon',   'The Dragonwild Stone',  395, -395]
    ];
    for (const [sid, sname, sx, sz] of STONES_LAYOUT) {
        addPad(sx, sz, 10, 10, 6);
        INTERACTS.push({ id: sid, kind: 'standing_stone', stoneId: sid, name: sname, x: sx, z: sz });
    }

    // 24 Harvestable RuneScape / Dragonwilds Resource Nodes & Ancient Lore Tomes
    const RESOURCE_SPOTS = [
        ['n_iron_1', 'resource_node', 'Iron Ore Vein', -155, 175, 'iron_ore', 'mining'],
        ['n_iron_2', 'resource_node', 'Iron Ore Vein', -220, 145, 'iron_ore', 'mining'],
        ['n_iron_3', 'resource_node', 'Iron Ore Vein', -130, -25, 'iron_ore', 'mining'],
        ['n_wood_1', 'resource_node', 'Ancient Elderwood', -400, 395, 'elderwood_log', 'foraging'],
        ['n_wood_2', 'resource_node', 'Ancient Elderwood', -460, 345, 'elderwood_log', 'foraging'],
        ['n_wood_3', 'resource_node', 'Ancient Elderwood', -330, 310, 'elderwood_log', 'foraging'],
        ['n_herb_1', 'resource_node', 'Luminous Mirebloom', 195, 65, 'mirebloom_herb', 'foraging'],
        ['n_herb_2', 'resource_node', 'Luminous Mirebloom', 265, 55, 'mirebloom_herb', 'foraging'],
        ['n_herb_3', 'resource_node', 'Luminous Mirebloom', -240, 235, 'mirebloom_herb', 'foraging'],
        ['n_bone_1', 'resource_node', 'Ossuary Bone Pile', -445, -40, 'cursed_bone', 'foraging'],
        ['n_bone_2', 'resource_node', 'Ossuary Bone Pile', -495, 35, 'cursed_bone', 'foraging'],
        ['n_mith_1', 'resource_node', 'Mithril Ore Seam', -215, -90, 'mithril_ore', 'mining'],
        ['n_mith_2', 'resource_node', 'Mithril Ore Seam', -95, -195, 'mithril_ore', 'mining'],
        ['n_mith_3', 'resource_node', 'Mithril Ore Seam', -380, -350, 'mithril_ore', 'mining'],
        ['n_sun_1',  'resource_node', 'Crimson Sunleaf', 350, 430, 'sunleaf_herb', 'foraging'],
        ['n_sun_2',  'resource_node', 'Crimson Sunleaf', 435, 365, 'sunleaf_herb', 'foraging'],
        ['n_rune_1', 'resource_node', 'Runic Ley-Crystal', 165, -145, 'runic_shard', 'arcana'],
        ['n_rune_2', 'resource_node', 'Runic Ley-Crystal', 455, -95, 'runic_shard', 'arcana'],
        ['n_rune_3', 'resource_node', 'Runic Ley-Crystal', -420, -470, 'runic_shard', 'arcana'],
        ['n_star_1', 'resource_node', 'Star-Metal Meteorite', 405, -425, 'starmetal_ore', 'mining'],
        ['n_star_2', 'resource_node', 'Star-Metal Meteorite', 455, -430, 'starmetal_ore', 'mining'],
        ['l_tome_1', 'lore_tome', 'Chronicle I: Fall of Haven', TOWN.x + 2, TOWN.z - 2],
        ['l_tome_2', 'lore_tome', 'Chronicle II: Grimhollow Pact', CHAPEL.x + 5, CHAPEL.z + 5],
        ['l_tome_3', 'lore_tome', 'Chronicle III: The Dragonwilds', DRAGON_CAMP.x - 5, DRAGON_CAMP.z + 4]
    ];
    for (const [nid, nkind, nname, nx, nz, yieldId, skillId] of RESOURCE_SPOTS) {
        addPad(nx, nz, 5, 5, 4, 1.0);
        INTERACTS.push({ id: nid, kind: nkind, name: nname, x: nx, z: nz, yieldItem: yieldId, skill: skillId });
    }

    /* ================================================================ 12 TRANSIT PYLONS (1 per Region) */
    const PYLONS = [
        { id: 'py_freestead',  name: 'Freestead Pylon',       x: TOWN.x + 22,       z: TOWN.z + 22,       region: 'haven_basin', start: true },
        { id: 'py_relay',      name: 'Relay Ridge Pylon',     x: RELAY.x + 10,      z: RELAY.z - 8,       region: 'haven_basin' },
        { id: 'py_whisper',    name: 'Whispering Lodge Pylon',x: LODGE.x + 16,      z: LODGE.z + 12,      region: 'whispering_woods' },
        { id: 'py_yard',       name: 'Rail Yard Pylon',       x: YARD.x + 22,       z: YARD.z - 14,       region: 'rust_sprawl' },
        { id: 'py_grimhollow', name: 'Grimhollow Pylon',      x: CHAPEL.x + 14,     z: CHAPEL.z + 10,     region: 'barrow_moor' },
        { id: 'py_mire',       name: 'Mire Causeway Pylon',   x: 186,               z: 54,                region: 'mire_delta' },
        { id: 'py_quarry',     name: 'Quarry Pylon',          x: QCAMP.x + 12,      z: QCAMP.z - 10,      region: 'ash_quarry' },
        { id: 'py_oasis',      name: 'Dustwind Oasis Pylon',  x: OASIS.x + 16,      z: OASIS.z + 12,      region: 'sunscorched_badlands' },
        { id: 'py_coast',      name: 'Lighthouse Pylon',      x: LIGHTHOUSE.x - 14, z: LIGHTHOUSE.z + 10, region: 'sunken_coast' },
        { id: 'py_check',      name: 'Checkpoint K-4 Pylon',  x: CHECK.x + 14,      z: CHECK.z + 10,      region: 'alpine_array' },
        { id: 'py_frostspire', name: 'Frostspire Pylon',      x: FROSTSPIRE.x + 22, z: FROSTSPIRE.z + 18, region: 'frostfang_peaks' },
        { id: 'py_dragonwild', name: 'Dragonbone Pylon',      x: DRAGON_CAMP.x - 14,z: DRAGON_CAMP.z + 10,region: 'obsidian_dragonwilds' }
    ];
    for (const p of PYLONS) addPad(p.x, p.z, 6, 6, 5, 1.0);

    const LANDMARKS = [
        { id: 'mast_alpha',    name: 'Watchtower Mast Alpha',     x: -160, z: 160,  h: 42, color: 0xf5a623 },
        { id: 'goliath',       name: 'Goliath Straddle Crane',    x: 90,   z: 232,  h: 38, color: 0xfacc15 },
        { id: 'cooling_stack', name: 'Sunken Cooling Stack',      x: 228,  z: 4,    h: 45, color: 0x4ade80 },
        { id: 'excavator',     name: 'Bucket-Wheel Excavator',    x: QUARRY.x - 4, z: QUARRY.z - 6, h: 36, color: 0xf97316 },
        { id: 'dishes',        name: 'Deep-Space Dish Array',     x: -60,  z: -250, h: 32, color: 0xe2e8f0 },
        { id: 'obelisk',       name: 'Meridian Containment Dome', x: CORE.x, z: CORE.z, h: 58, color: 0xa855f7 },
        // 6 New Outer Frontier Skyline Landmarks
        { id: 'elder_tree',    name: 'Great Elderwood Spire',     x: -485, z: 390,  h: 46, color: 0x22c55e },
        { id: 'barrow_spire',  name: 'Grimhollow Necro-Spire',    x: -495, z: -30,  h: 44, color: 0xc084fc },
        { id: 'sun_pyramid',   name: 'Sunfang Solar Obelisk',     x: 485,  z: 464,  h: 42, color: 0xfbbf24 },
        { id: 'coast_beacon',  name: 'Abyssal Sea-Beacon',        x: 470,  z: -51,  h: 40, color: 0x38bdf8 },
        { id: 'frost_citadel', name: 'Frostspire High Keep',      x: -455, z: -453, h: 50, color: 0x93c5fd },
        { id: 'dragon_monolith',name: 'Dragonwild Obsidian Spire',x: 485,  z: -491, h: 64, color: 0xef4444 }
    ];
    for (const l of LANDMARKS) if (l.id !== 'obelisk' && l.id !== 'excavator') addPad(l.x, l.z, 12, 12, 6);

    function isWet(x, z) { return Math.hypot(x - 215, z - 25) < 135 || Math.hypot(x - 510, z + 55) < 120; }
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
        if (h > 24) { const k = smooth(24, 38, h); c = c.map((v, i) => lerp(v, [0.92, 0.95, 0.98][i], k)); }
        if (h < WATER + 0.8 && isWet(x, z)) { const k = smooth(WATER + 0.8, WATER - 0.3, h); c = c.map((v, i) => lerp(v, [0.20, 0.28, 0.24][i], k)); }
        const road = roadInfo(x, z);
        if (road && road.d < road.road.w * 0.5) {
            const tint = road.road.mat === 'asphalt' ? [0.24, 0.25, 0.26] : [0.45, 0.38, 0.29];
            c = c.map((v, i) => lerp(v, tint[i], smooth(road.road.w * 0.5, road.road.w * 0.5 - 1.2, road.d)));
        }
        if (railDist(x, z) < 2) c = c.map((v, i) => lerp(v, [0.3, 0.27, 0.25][i], 0.75));
        const dc = Math.hypot(x - CORE.x, z - CORE.z);
        if (dc < 50) c = c.map((v, i) => lerp(v, [0.2, 0.16, 0.26][i], smooth(50, 20, dc)));
        const dd = Math.hypot(x - DRAGON_CRATER.x, z - DRAGON_CRATER.z);
        if (dd < 90) c = c.map((v, i) => lerp(v, [0.16, 0.10, 0.12][i], smooth(90, 25, dd)));
        return c.map((v) => Math.max(0, Math.min(1, v)));
    }

    const terrainDef = () => ({
        ...BOUNDS, res: 2, chunk: 160, batchChunk: 160, navCell: 4, waterLevel: WATER,
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
            skyTop: 0x3f5874, skyBottom: 0xa4a998, fogColor: 0x9a9f92, fogDensity: 0.0034,
            hemiSky: 0xbfd0e2, hemiGround: 0x4a4f3a, hemiIntensity: 1.05,
            sunColor: 0xffe2b8, sunIntensity: 1.5, sunPos: [-70, 95, 50]
        }
    };
    BO.MapsData.MAPS.meridian = map;

    BO.OWRPGWorldData = {
        BOUNDS, WATER, REGIONS, ROADS, RAIL, POIS, NPCS, INTERACTS, PYLONS, LANDMARKS, DUNGEONS, INTERIOR: INT,
        TOWN, regionAt, rawFinal, heightAt: rawFinal, isWet, segDist, roadInfo, railDist,
        isInterior(x, z) { return x > 1350 && z > 1350; }
    };
})(window.BO);
