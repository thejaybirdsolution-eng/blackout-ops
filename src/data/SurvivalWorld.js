/* ============================================================================
   BLACKOUT OPS — The Exclusion Zone (500 × 450 m)
   Ten regions in threat rings around the Lantern, a heightfield shaped by
   region (mountains, crater bowl, reservoir basin, plateau), a road network,
   skyline landmarks, a procedural building kit with enterable interiors,
   vegetation, resource deposits and container spawn points.
   Coordinates: +x east, +z south (north is up on the map at -z).
============================================================================ */
(function (BO) {
    'use strict';

    const W = BO.WorldCore;
    const N = W.noise;
    const BOUNDS = { minX: -250, maxX: 250, minZ: -225, maxZ: 225 };
    const WATER = -1.4;

    const REGIONS = [
        { id: 'crash', name: 'Crash Valley', x: -200, z: 178, r: 42, ring: 0, threat: 1, biome: 'meadow', color: 0x86945f },
        { id: 'relay', name: 'Relay Basin', x: -128, z: 112, r: 58, ring: 0, threat: 1, biome: 'meadow', color: 0x7f9a62 },
        { id: 'hollow', name: 'Hollow Town', x: -172, z: 12, r: 60, ring: 1, threat: 2, biome: 'town', color: 0x8b8a72 },
        { id: 'pine', name: 'Pinebreak Forest', x: -150, z: -125, r: 82, ring: 1, threat: 2, biome: 'forest', color: 0x55724a },
        { id: 'kessel', name: 'Kessel Freight Yards', x: -30, z: 168, r: 64, ring: 1, threat: 2, biome: 'industrial', color: 0x8f8573 },
        { id: 'spillway', name: 'Spillway Reservoir', x: 145, z: 45, r: 78, ring: 2, threat: 3, biome: 'wetland', color: 0x6f8d72 },
        { id: 'frost', name: 'Frostline Mountain', x: 75, z: -168, r: 82, ring: 2, threat: 3, biome: 'alpine', color: 0xb8c8cc },
        { id: 'cinder', name: 'Cinder Refinery', x: 168, z: 165, r: 64, ring: 2, threat: 3, biome: 'ash', color: 0x8a6f5e },
        { id: 'campus', name: 'Black Pine Research Campus', x: -12, z: -88, r: 48, ring: 3, threat: 4, biome: 'campus', color: 0x8c9393 },
        { id: 'crater', name: 'The Crater', x: 22, z: -14, r: 40, ring: 4, threat: 5, biome: 'crater', color: 0x6b5f7a }
    ];
    const LANTERN = { x: 22, z: -14 };

    /* --------------------------------------------------------------- helpers */
    function rng(seed) {
        let a = seed >>> 0;
        return () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const lerp = (a, b, t) => a + (b - a) * t;

    function inReservoir(x, z) {
        return x > 95 && Math.hypot((x - RESERVOIR.x) / RESERVOIR.rx, (z - RESERVOIR.z) / RESERVOIR.rz) < 1.5;
    }
    function regionAt(x, z) {
        let best = REGIONS[0], bd = Infinity;
        for (const r of REGIONS) {
            const d = Math.hypot(x - r.x, z - r.z) / r.r;
            if (d < bd) { bd = d; best = r; }
        }
        return best;
    }

    /* --------------------------------------------------------------- roads */
    const ROADS = [
        { w: 7, mat: 'asphalt', pts: [[-238, 190], [-200, 178], [-150, 128], [-128, 112], [-105, 140], [-60, 165], [-30, 168], [40, 172], [110, 168], [168, 165], [235, 150]] },
        { w: 7, mat: 'asphalt', pts: [[-128, 112], [-160, 62], [-172, 12], [-172, -40], [-150, -95], [-120, -150], [-60, -200]] },
        { w: 6, mat: 'asphalt', pts: [[-172, 12], [-110, 10], [-55, -20], [-25, -55], [-12, -64]] },
        { w: 5, mat: 'dirt', pts: [[-30, 168], [0, 120], [40, 80], [88, 48], [145, 45]] },
        { w: 5, mat: 'dirt', pts: [[145, 45], [180, 100], [168, 165]] },
        { w: 5, mat: 'dirt', pts: [[-12, -112], [20, -140], [60, -150], [75, -168]] },
        { w: 4, mat: 'dirt', pts: [[-200, 178], [-215, 120], [-205, 60], [-172, 12]] }
    ];
    const RAIL = [[-250, 150], [-120, 150], [-30, 152], [60, 150], [130, 140], [190, 120], [250, 110]];

    function segDist(px, pz, ax, az, bx, bz) {
        const dx = bx - ax, dz = bz - az;
        const L = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L));
        const cx = ax + dx * t, cz = az + dz * t;
        return [Math.hypot(px - cx, pz - cz), cx, cz];
    }
    function roadInfo(x, z) {
        let best = null;
        for (const road of ROADS) {
            for (let i = 0; i < road.pts.length - 1; i++) {
                const [d] = segDist(x, z, road.pts[i][0], road.pts[i][1], road.pts[i + 1][0], road.pts[i + 1][1]);
                if (d < road.w * 0.5 + 3 && (!best || d < best.d)) best = { d, road };
            }
        }
        return best;
    }
    function railDist(x, z) {
        let best = Infinity;
        for (let i = 0; i < RAIL.length - 1; i++) best = Math.min(best, segDist(x, z, RAIL[i][0], RAIL[i][1], RAIL[i + 1][0], RAIL[i + 1][1])[0]);
        return best;
    }

    /* --------------------------------------------------------------- raw terrain */
    const RESERVOIR = { x: 150, z: 42, rx: 52, rz: 38 };
    function rawHeight(x, z) {
        let h = N.fbm(x / 95, z / 95, 11, 4) * 4.5 + N.fbm(x / 23, z / 23, 29, 3) * 0.9;
        // Northern mountain range (Frostline) rising toward the north edge.
        const north = smooth(-92, -200, z);
        h += north * (N.ridged(x / 62, z / 62, 3, 5) * 48 + 10) * smooth(260, 120, Math.abs(x - 70) + 40);
        // Western forest hills.
        const pine = Math.max(0, 1 - Math.hypot(x + 150, z + 125) / 110);
        h += pine * (N.fbm(x / 40, z / 40, 5, 3) * 9 + 4);
        // Relay mast hill.
        h += 13 * Math.exp(-((x + 156) ** 2 + (z - 94) ** 2) / (2 * 15 * 15));
        // Ridge between Kessel and the Reservoir.
        h += 7 * Math.exp(-((x - 60) ** 2) / 900) * smooth(40, 120, z) * smooth(220, 130, z);
        // Crater bowl and rim.
        const dc = Math.hypot(x - LANTERN.x, z - LANTERN.z);
        if (dc < 60) {
            const bowl = dc < 36 ? -15 * (1 - (dc / 36) ** 2) : 0;
            const rim = 6 * Math.exp(-((dc - 40) ** 2) / 50);
            h = lerp(h, h * 0.3 + bowl + rim, smooth(60, 34, dc));
        }
        // Reservoir basin.
        const er = Math.hypot((x - RESERVOIR.x) / RESERVOIR.rx, (z - RESERVOIR.z) / RESERVOIR.rz);
        if (er < 1.45) h = lerp(h, -6.5 + er * er * 3.0, smooth(1.45, 0.75, er) * smooth(88, 98, x));
        // Natural map boundary: steep berms in the last metres.
        const edge = Math.min(x - BOUNDS.minX, BOUNDS.maxX - x, z - BOUNDS.minZ, BOUNDS.maxZ - z);
        h += smooth(14, 0, edge) * 16;
        return h;
    }

    /* --------------------------------------------------------------- POIs & building kit */
    const boxes = [];
    const ramps = [];
    const containers = [];
    const lights = [];
    const pads = [];
    const pois = [];
    const markers = [];
    const ladders = [];
    const deferred = [];

    function addPad(x, z, w, d, rot, extra = 2.5, h = null) {
        const odd = rot % 2 === 1;
        const pw = odd ? d : w, pd = odd ? w : d;
        const pad = { x, z, hw: pw / 2 + extra, hd: pd / 2 + extra, blend: 6, h: h ?? rawHeight(x, z) };
        pads.push(pad);
        return pad.h;
    }
    function tf(cx, cz, rot, lx, lz) {
        switch (rot & 3) {
            case 1: return [cx - lz, cz + lx];
            case 2: return [cx - lx, cz - lz];
            case 3: return [cx + lz, cz - lx];
            default: return [cx + lx, cz + lz];
        }
    }
    /** Local box → world box (rotations in 90° steps keep colliders axis-aligned). */
    function lbox(b, lx, ly, lz, w, h, d, mat, opts = {}) {
        const [x, z] = tf(b.x, b.z, b.rot, lx, lz);
        const odd = (b.rot & 1) === 1;
        boxes.push({ x, y: b.y + ly, z, w: odd ? d : w, h, d: odd ? w : d, mat, ...opts });
    }
    function lramp(b, lx, lz1, lz2, y1, y2, w, mat) {
        const [x1, z1] = tf(b.x, b.z, b.rot, lx, lz1);
        const [x2, z2] = tf(b.x, b.z, b.rot, lx, lz2);
        if (Math.abs(z1 - z2) > Math.abs(x1 - x2)) ramps.push({ axis: 'z', x: x1, z1, z2, y1: b.y + y1, y2: b.y + y2, w, mat });
        else ramps.push({ axis: 'x', z: z1, x1, x2, y1: b.y + y1, y2: b.y + y2, w, mat });
    }
    /** A climbable 18 m lattice radio tower: four legs, cross-bracing, two platforms, a ladder and a beacon. */
    function radioTower(id, name, x, z, region, baseY = null) {
        if (baseY === null) addPad(x, z, 6, 6, 0, 2.5);
        const y = baseY ?? rawFinal(x, z);
        const H = 18;
        for (const [lx, lz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) boxes.push({ x: x + lx, y: y + H / 2, z: z + lz, w: 0.22, h: H, d: 0.22, mat: 'rust_steel' });
        for (const by of [4.5, 9, 13.5]) {
            boxes.push({ x, y: y + by, z: z - 1.3, w: 2.6, h: 0.12, d: 0.12, mat: 'rust_steel', noCollide: true });
            boxes.push({ x, y: y + by, z: z + 1.3, w: 2.6, h: 0.12, d: 0.12, mat: 'rust_steel', noCollide: true });
        }
        boxes.push({ x, y: y + 9, z, w: 3, h: 0.16, d: 3, mat: 'diamond_plate' });
        boxes.push({ x, y: y + H, z, w: 3.4, h: 0.18, d: 3.4, mat: 'diamond_plate' });
        boxes.push({ x: x + 1.55, y: y + H / 2, z, w: 0.08, h: H, d: 0.5, mat: 'rust_steel', noCollide: true });
        boxes.push({ x: x - 1.2, y: y + H + 0.6, z: z + 1.2, w: 0.7, h: 1, d: 0.5, mat: 'concrete' });
        lights.push({ x, y: y + H + 2.2, z, color: 0xff3b30, beacon: true });
        ladders.push({ x: x + 1.4, z, y, top: y + H + 0.1, name: name });
        markers.push({ id, name, x: x - 0.6, y: y + H + 0.1, z, region, kind: 'tower' });
    }

    function lcont(b, lx, ly, lz, type, tier) {
        const [x, z] = tf(b.x, b.z, b.rot, lx, lz);
        containers.push({ x, y: b.y + ly, z, type, tier: tier ?? b.tier, poi: b.poi, region: b.region, rot: b.rot });
    }

    /**
     * One wall run along local X (at lz) or Z (at lx), with door and window openings.
     * openings: [{ at, w, kind: 'door'|'window' }] measured along the run from its start.
     */
    function wallRun(b, axis, fixed, start, len, y0, fh, mat, openings) {
        const t = 0.24;
        const segs = [];
        let cur = 0;
        const sorted = openings.slice().sort((a, c) => a.at - c.at);
        for (const o of sorted) {
            const a = Math.max(0, o.at - o.w / 2), e = Math.min(len, o.at + o.w / 2);
            if (a > cur) segs.push([cur, a, 0, fh]);
            if (o.kind === 'door') segs.push([a, e, 2.35, fh]);
            else { segs.push([a, e, 0, 0.95]); segs.push([a, e, 2.15, fh]); }
            cur = e;
        }
        if (cur < len) segs.push([cur, len, 0, fh]);
        for (const [s0, s1, h0, h1] of segs) {
            if (s1 - s0 < 0.05 || h1 - h0 < 0.05) continue;
            const mid = start + (s0 + s1) / 2, L = s1 - s0, H = h1 - h0;
            if (axis === 'x') lbox(b, mid, y0 + h0 + H / 2, fixed, L, H, t, mat);
            else lbox(b, fixed, y0 + h0 + H / 2, mid, t, H, L, mat);
        }
    }
    function windowsAlong(len, skip = []) {
        const out = [];
        const n = Math.max(0, Math.floor((len - 1.6) / 3.2));
        for (let i = 0; i < n; i++) {
            const at = (len / (n + 1)) * (i + 1);
            if (skip.some((s) => Math.abs(s - at) < 1.8)) continue;
            out.push({ at, w: 1.3, kind: 'window' });
        }
        return out;
    }

    /**
     * Enterable building. spec: { x, z, w, d, rot, floors, mat, roof, doors: ['s','n','e','w'], type, tier, region, poi, interior }
     * Local frame: x across width, z across depth; 's' wall faces +z.
     */
    function building(spec) {
        const rot = spec.rot || 0;
        const y = addPad(spec.x, spec.z, spec.w, spec.d, rot, spec.padExtra ?? 2.5, spec.padH ?? null);
        const b = { x: spec.x, z: spec.z, rot, y, tier: spec.tier || 1, poi: spec.poi || spec.type, region: spec.region };
        const { w, d } = spec;
        const floors = spec.floors || 1;
        const FH = 3.1;
        const mat = spec.mat || 'concrete';
        const doors = spec.doors || ['s'];
        lbox(b, 0, 0.08, 0, w, 0.16, d, spec.floorMat || 'ceiling_plaster');
        for (let f = 0; f < floors; f++) {
            const y0 = 0.16 + f * FH;
            const doorAt = (len) => len / 2 + (spec.doorOffset || 0);
            const run = (side) => {
                const along = side === 's' || side === 'n' ? w : d;
                const dOpen = f === 0 && doors.includes(side) ? [{ at: doorAt(along), w: 1.7, kind: 'door' }] : [];
                const wins = spec.blind ? [] : windowsAlong(along, dOpen.map((o) => o.at));
                return dOpen.concat(wins);
            };
            wallRun(b, 'x', d / 2, -w / 2, w, y0, FH, mat, run('s'));
            wallRun(b, 'x', -d / 2, -w / 2, w, y0, FH, mat, run('n'));
            wallRun(b, 'z', w / 2, -d / 2, d, y0, FH, mat, run('e'));
            wallRun(b, 'z', -w / 2, -d / 2, d, y0, FH, mat, run('w'));
            // Interior partition with a doorway for larger footprints.
            if (w >= 9 && spec.interior !== false) wallRun(b, 'z', 0, -d / 2, d, y0, FH, spec.innerMat || 'ceiling_plaster', [{ at: d * 0.7, w: 1.6, kind: 'door' }]);
            // Upper slab with a stairwell (ramp) against the west wall.
            if (f < floors - 1) {
                const hole = { x0: -w / 2 + 0.25, x1: -w / 2 + 2.05, z0: -d / 2 + 0.3, z1: -d / 2 + 4.9 };
                const sy = y0 + FH - 0.08;
                lbox(b, (hole.x1 + w / 2) / 2, sy, 0, w / 2 - hole.x1, 0.16, d, 'ceiling_plaster');
                lbox(b, (-w / 2 + hole.x1) / 2, sy, (hole.z1 + d / 2) / 2, hole.x1 + w / 2, 0.16, d / 2 - hole.z1, 'ceiling_plaster');
                lramp(b, (hole.x0 + hole.x1) / 2, hole.z1 - 0.1, hole.z0 + 0.15, y0, y0 + FH, 1.6, 'wood_plank');
            }
        }
        const top = 0.16 + floors * FH;
        lbox(b, 0, top + 0.1, 0, w + 0.4, 0.2, d + 0.4, spec.roof || 'dark_slate_roof');
        if (spec.parapet !== false) {
            lbox(b, 0, top + 0.5, d / 2 + 0.1, w + 0.4, 0.6, 0.2, mat);
            lbox(b, 0, top + 0.5, -d / 2 - 0.1, w + 0.4, 0.6, 0.2, mat);
            lbox(b, w / 2 + 0.1, top + 0.5, 0, 0.2, 0.6, d, mat);
            lbox(b, -w / 2 - 0.1, top + 0.5, 0, 0.2, 0.6, d, mat);
        }
        // Furniture and containers per room.
        const types = spec.loot || ['cabinet', 'wardrobe', 'desk'];
        const rr = rng(Math.floor(spec.x * 31 + spec.z * 17));
        for (let f = 0; f < floors; f++) {
            const y0 = 0.16 + f * FH;
            const rooms = w >= 9 && spec.interior !== false ? [[-w / 4, w / 2 - 1.2], [w / 4, w / 2 - 1.2]] : [[0, w - 1.6]];
            for (const [cx, rw] of rooms) {
                const n = 1 + Math.floor(rr() * 2);
                for (let i = 0; i < n; i++) {
                    const side = rr() < 0.5 ? -1 : 1;
                    const lx = cx + (rr() - 0.5) * (rw - 1);
                    const lz = side * (d / 2 - 0.65);
                    lcont(b, lx, y0, lz, types[Math.floor(rr() * types.length)]);
                }
                if (rr() < 0.7) lbox(b, cx + (rr() - 0.5) * 2, y0 + 0.4, (rr() - 0.5) * (d - 3), 1.4, 0.8, 0.8, 'wood_plank');
            }
        }
        pois.push({ id: spec.poi || spec.type, type: spec.type, x: spec.x, z: spec.z, w, d, rot, floors, region: spec.region, name: spec.name, tier: b.tier, y, top: y + top });
        return b;
    }

    /** Solid prop box on a pad (crates, containers, tanks). */
    function solid(x, z, w, h, d, mat, opts = {}) {
        deferred.push(() => {
            const y = opts.y ?? rawFinal(x, z);
            boxes.push({ x, y: y + h / 2 + (opts.lift || 0), z, w, h, d, mat, ...opts });
        });
    }

    function fenceLine(x0, z0, x1, z1, mat = 'privacy_fence', h = 1.8, gaps = []) {
        deferred.push(() => fenceNow(x0, z0, x1, z1, mat, h, gaps));
    }
    function fenceNow(x0, z0, x1, z1, mat, h, gaps) {
        const L = Math.hypot(x1 - x0, z1 - z0);
        const n = Math.max(1, Math.round(L / 4));
        for (let i = 0; i < n; i++) {
            const t0 = i / n, t1 = (i + 1) / n;
            if (gaps.some(([a, b]) => (t0 + t1) / 2 >= a && (t0 + t1) / 2 <= b)) continue;
            const mx = lerp(x0, x1, (t0 + t1) / 2), mz = lerp(z0, z1, (t0 + t1) / 2);
            const seg = L / n;
            const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
            boxes.push({ x: mx, y: rawFinal(mx, mz) + h / 2, z: mz, w: alongX ? seg : 0.15, h, d: alongX ? 0.15 : seg, mat, fence: true });
        }
    }

    /* --------------------------------------------------------------- final height (pads + roads) */
    function rawFinal(x, z) {
        let h = rawHeight(x, z);
        for (let i = 0; i < pads.length; i++) {
            const p = pads[i];
            const dx = Math.max(0, Math.abs(x - p.x) - p.hw), dz = Math.max(0, Math.abs(z - p.z) - p.hd);
            const d = Math.hypot(dx, dz);
            if (d < p.blend) h = lerp(h, p.h, smooth(p.blend, 0, d));
        }
        const road = roadInfo(x, z);
        if (road) {
            const target = rawHeight(x, z) * 0.35 + (N.fbm(x / 140, z / 140, 11, 2) * 4.5) * 0.65;
            const k = smooth(road.road.w * 0.5 + 3, road.road.w * 0.5, road.d);
            h = lerp(h, Math.min(h, target + 0.15), k * 0.55);
        }
        return h;
    }

    /* ================================================================ LAYOUT */
    // ---- Crash Valley: the helicopter wreck you wake up in, a farm and a field shed.
    (function crashValley() {
        const r = 'crash';
        const wy = addPad(-206, 184, 14, 10, 0, 4);
        boxes.push({ x: -206, y: wy + 1.2, z: 184, w: 9, h: 2.4, d: 3, mat: 'rusted_metal' });
        boxes.push({ x: -211.5, y: wy + 0.9, z: 184.6, w: 2.6, h: 1.4, d: 0.9, mat: 'rusted_metal' });
        boxes.push({ x: -200.5, y: wy + 0.6, z: 186, w: 7, h: 0.3, d: 0.5, mat: 'rust_steel', noCollide: true });
        containers.push({ x: -204, y: wy, z: 182.2, type: 'military_crate', tier: 1, poi: 'wreck', region: r, story: 'wreck' });
        markers.push({ id: 'wreck', name: 'Helicopter wreck', x: -206, y: wy, z: 184, region: r, kind: 'site' });
        building({ x: -176, z: 160, w: 10, d: 8, floors: 2, rot: 0, mat: 'yellow_siding', type: 'farmhouse', name: 'Kessler farmhouse', region: r, tier: 1, loot: ['fridge', 'cabinet', 'wardrobe', 'desk'] });
        building({ x: -160, z: 176, w: 12, d: 9, floors: 1, rot: 1, mat: 'wood_plank', roof: 'rusted_metal', type: 'barn', name: 'Old barn', region: r, interior: false, loot: ['toolbox', 'crate', 'fuel_drum'] });
        fenceLine(-190, 145, -150, 145, 'privacy_fence', 1.2, [[0.4, 0.55]]);
        fenceLine(-190, 145, -190, 190, 'privacy_fence', 1.2, [[0.45, 0.6]]);
    })();

    // ---- Relay Basin: ranger station (first safehouse), radio mast hill, Haven survivor camp, cabins.
    (function relayBasin() {
        const r = 'relay';
        const st = building({ x: -122, z: 128, w: 11, d: 8, floors: 1, rot: 0, mat: 'green_siding', type: 'ranger_station', name: 'Ranger station', region: r, tier: 1, loot: ['locker', 'med_cabinet', 'desk'], doors: ['s', 'e'] });
        markers.push({ id: 'safehouse_ranger', name: 'Ranger station', x: -122, y: st.y, z: 132.5, region: r, kind: 'safehouse' });
        // Radio mast: lattice legs, platforms and a beacon at the top.
        const my = addPad(-156, 94, 8, 8, 0, 3, rawHeight(-156, 94));
        for (const [lx, lz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) boxes.push({ x: -156 + lx, y: my + 15, z: 94 + lz, w: 0.25, h: 30, d: 0.25, mat: 'rust_steel' });
        for (const py of [10, 20, 29]) boxes.push({ x: -156, y: my + py, z: 94, w: 4, h: 0.2, d: 4, mat: 'diamond_plate' });
        boxes.push({ x: -152.6, y: my + 1.2, z: 96.4, w: 3, h: 2.4, d: 2.2, mat: 'concrete' });
        markers.push({ id: 'mast', name: 'Relay radio mast', x: -156, y: my, z: 94, region: r, kind: 'mast', top: my + 29.2 });
        lights.push({ x: -156, y: my + 31, z: 94, color: 0xff3b30, beacon: true });
        // Haven: a fenced survivor camp with tents and a cook fire.
        const hy = addPad(-100, 92, 26, 22, 0, 2);
        fenceLine(-113, 81, -87, 81, 'sandbag', 1.1, [[0.42, 0.58]]);
        fenceLine(-113, 103, -87, 103, 'sandbag', 1.1);
        fenceLine(-113, 81, -113, 103, 'sandbag', 1.1);
        fenceLine(-87, 81, -87, 103, 'sandbag', 1.1, [[0.4, 0.6]]);
        for (const [tx, tz] of [[-107, 88], [-107, 97], [-94, 97], [-99, 88]]) {
            boxes.push({ x: tx, y: hy + 0.9, z: tz, w: 3.2, h: 1.8, d: 3.6, mat: 'swamp_mud', tent: true });
        }
        markers.push({ id: 'haven', name: 'Haven survivor camp', x: -100, y: hy, z: 92, region: r, kind: 'settlement' });
        containers.push({ x: -96, y: hy, z: 86, type: 'crate', tier: 1, poi: 'haven', region: r });
        // Cabins in the treeline.
        building({ x: -92, z: 150, w: 6, d: 5, floors: 1, rot: 2, mat: 'wood_plank', type: 'cabin', name: 'Lakeside cabin', region: r, loot: ['wardrobe', 'cabinet'] });
        building({ x: -170, z: 128, w: 6, d: 5, floors: 1, rot: 1, mat: 'wood_plank', type: 'cabin', name: 'Hunter cabin', region: r, loot: ['locker', 'cabinet'] });
        markers.push({ id: 'well_relay', name: 'Relay well', x: -112, y: rawHeight(-112, 120), z: 120, region: r, kind: 'well' });
    })();

    // ---- Hollow Town: two streets, police, pharmacy, grocery, gas station, church, school, houses, water tower.
    (function hollowTown() {
        const r = 'hollow';
        const R = rng(4242);
        building({ x: -186, z: -6, w: 14, d: 10, floors: 2, rot: 1, mat: 'brick', type: 'police', name: 'Hollow police station', region: r, tier: 2, loot: ['gun_locker', 'locker', 'desk', 'evidence'], doors: ['s'] });
        building({ x: -156, z: 30, w: 9, d: 8, floors: 1, rot: 3, mat: 'concrete', type: 'pharmacy', name: 'Hollow pharmacy', region: r, tier: 2, loot: ['med_cabinet', 'med_cabinet', 'shelf'], doors: ['s'] });
        building({ x: -156, z: -6, w: 13, d: 10, floors: 1, rot: 3, mat: 'yellow_siding', type: 'grocery', name: 'Hollow grocery', region: r, tier: 1, loot: ['shelf', 'fridge', 'shelf'], doors: ['s'] });
        building({ x: -188, z: 46, w: 16, d: 10, floors: 2, rot: 1, mat: 'brick', type: 'school', name: 'Hollow school', region: r, tier: 1, loot: ['desk', 'locker', 'cabinet'], doors: ['s'] });
        // Church with a steeple (skyline landmark).
        const ch = building({ x: -140, z: 52, w: 8, d: 14, floors: 1, rot: 0, mat: 'castle_stone', roof: 'dark_slate_roof', type: 'church', name: 'Saint Ansel church', region: r, loot: ['cabinet', 'crate'], interior: false, doors: ['s'] });
        boxes.push({ x: -140, y: ch.y + 6.5, z: 44.5, w: 3, h: 13, d: 3, mat: 'castle_stone' });
        boxes.push({ x: -140, y: ch.y + 14.5, z: 44.5, w: 1.6, h: 3, d: 1.6, mat: 'dark_slate_roof', noCollide: true });
        // Gas station: canopy + kiosk.
        const gy = addPad(-150, -36, 16, 12, 0, 3);
        boxes.push({ x: -150, y: gy + 4.2, z: -36, w: 12, h: 0.35, d: 8, mat: 'diamond_plate', noCollide: true, navIgnore: true });
        for (const [px, pz] of [[-155, -39], [-145, -39], [-155, -33], [-145, -33]]) boxes.push({ x: px, y: gy + 2.1, z: pz, w: 0.3, h: 4.2, d: 0.3, mat: 'rust_steel' });
        for (const px of [-152, -148]) boxes.push({ x: px, y: gy + 0.75, z: -36, w: 0.8, h: 1.5, d: 0.6, mat: 'burger_red' });
        building({ x: -150, z: -48, w: 7, d: 5, floors: 1, rot: 0, mat: 'concrete', type: 'kiosk', name: 'Gas station kiosk', region: r, loot: ['shelf', 'fridge'] });
        containers.push({ x: -146, y: gy, z: -41, type: 'fuel_drum', tier: 1, poi: 'gas', region: r });
        // Water tower.
        const wy = addPad(-200, 22, 6, 6, 0, 2);
        for (const [lx, lz] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) boxes.push({ x: -200 + lx, y: wy + 7, z: 22 + lz, w: 0.3, h: 14, d: 0.3, mat: 'rust_steel' });
        boxes.push({ x: -200, y: wy + 16, z: 22, w: 6, h: 4, d: 6, mat: 'rust_steel' });
        // Houses along the streets.
        const lots = [
            [-198, -30, 1], [-198, 70, 1], [-140, 75, 3], [-140, -62, 3], [-198, -52, 1], [-125, 18, 0], [-125, 2, 2],
            [-212, 0, 1], [-160, 70, 0], [-120, -30, 3], [-212, 44, 1], [-182, -60, 0]
        ];
        for (const [hx, hz, rot] of lots) {
            const big = R() < 0.4;
            building({ x: hx, z: hz, w: big ? 9 : 7, d: big ? 8 : 6, floors: big ? 2 : 1, rot, mat: ['green_siding', 'yellow_siding', 'brick', 'wood_plank'][Math.floor(R() * 4)],
                type: 'house', name: 'House', region: r, tier: 1, loot: ['fridge', 'wardrobe', 'cabinet', 'desk'] });
        }
        // Abandoned cars on the streets.
        for (let i = 0; i < 8; i++) {
            const cx = -172 + (R() - 0.5) * 4, cz = -30 + i * 12 + R() * 4;
            solid(cx, cz, 1.9, 1.4, 4.2, ['bus_teal', 'truck_yellow', 'burger_red', 'rusted_metal'][i % 4]);
            if (i % 3 === 0) deferred.push(() => containers.push({ x: cx + 1.4, y: rawFinal(cx + 1.4, cz), z: cz, type: 'car_trunk', tier: 1, poi: 'street', region: r }));
        }
        markers.push({ id: 'hollow_nest_a', name: 'Infested school', x: -188, y: 0, z: 46, region: r, kind: 'nest' });
        markers.push({ id: 'hollow_nest_b', name: 'Infested church', x: -140, y: 0, z: 56, region: r, kind: 'nest' });
    })();

    // ---- Kessel Freight Yards: warehouses, container stacks, gantry crane, offices.
    (function kessel() {
        const r = 'kessel';
        const R = rng(777);
        for (const [x, z, rot] of [[-55, 188, 0], [-20, 192, 0], [15, 188, 0]]) {
            building({ x, z, w: 22, d: 13, floors: 1, rot, mat: 'rusted_metal', roof: 'rust_steel', type: 'warehouse', name: 'Freight warehouse', region: r, tier: 2,
                interior: false, blind: true, doors: ['n', 's'], loot: ['crate', 'toolbox', 'crate', 'military_crate'] });
        }
        building({ x: -60, z: 140, w: 10, d: 8, floors: 2, rot: 1, mat: 'concrete', type: 'office', name: 'Yard office', region: r, tier: 2, loot: ['desk', 'locker', 'cabinet'] });
        // Container stacks.
        const sy = addPad(-5, 140, 40, 18, 0, 3);
        for (let i = 0; i < 7; i++) {
            for (let row = 0; row < 2; row++) {
                const stack = 1 + Math.floor(R() * 3);
                for (let s = 0; s < stack; s++) {
                    boxes.push({ x: -22 + i * 6, y: sy + 1.3 + s * 2.6, z: 134 + row * 8, w: 2.5, h: 2.6, d: 6.1, mat: ['container_blue', 'container_red', 'container_olive'][(i + row + s) % 3] });
                }
                if (R() < 0.45) containers.push({ x: -22 + i * 6 + 1.6, y: sy, z: 134 + row * 8, type: 'crate', tier: 2, poi: 'stacks', region: r });
            }
        }
        // Gantry crane over the rail line (landmark).
        const gy = addPad(-30, 152, 30, 8, 0, 2);
        for (const lx of [-14, 14]) for (const lz of [-3.5, 3.5]) boxes.push({ x: -30 + lx, y: gy + 9, z: 152 + lz, w: 0.8, h: 18, d: 0.8, mat: 'truck_yellow' });
        boxes.push({ x: -30, y: gy + 18.4, z: 152, w: 30, h: 1, d: 8, mat: 'truck_yellow', navIgnore: true });
        markers.push({ id: 'kessel_crane', name: 'Kessel gantry crane', x: -30, y: gy, z: 152, region: r, kind: 'landmark' });
    })();

    // ---- Pinebreak Forest: lumber mill, hunting stands, ranger cabins.
    (function pinebreak() {
        const r = 'pine';
        building({ x: -125, z: -150, w: 18, d: 10, floors: 1, rot: 0, mat: 'wood_plank', roof: 'rusted_metal', type: 'mill', name: 'Pinebreak lumber mill', region: r, tier: 2, interior: false, doors: ['s', 'n'], loot: ['toolbox', 'crate', 'fuel_drum'] });
        const ly = rawFinal(-110, -140);
        for (let i = 0; i < 4; i++) boxes.push({ x: -108 + i * 1.1, y: ly + 0.5, z: -138, w: 1, h: 1, d: 5, mat: 'wood_crate' });
        for (const [x, z] of [[-175, -105], [-130, -90], [-190, -160], [-150, -185]]) {
            const y = rawHeight(x, z);
            for (const [lx, lz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) boxes.push({ x: x + lx, y: y + 2.6, z: z + lz, w: 0.18, h: 5.2, d: 0.18, mat: 'wood_plank' });
            boxes.push({ x, y: y + 5.2, z, w: 2.2, h: 0.15, d: 2.2, mat: 'wood_plank' });
            ladders.push({ x: x + 1.4, z, y, top: y + 5.3, name: 'Hunting stand' });
            containers.push({ x, y: y + 5.28, z, type: 'crate', tier: 2, poi: 'stand', region: r });
        }
        building({ x: -200, z: -95, w: 7, d: 6, floors: 1, rot: 1, mat: 'wood_plank', type: 'cabin', name: 'Ranger cabin', region: r, tier: 2, loot: ['locker', 'cabinet', 'med_cabinet'] });
        deferred.push(() => radioTower('pine_tower', 'Pinebreak radio tower', -95, -175, r));
        markers.push({ id: 'pine_nest', name: 'Stalker den', x: -170, y: 0, z: -150, region: r, kind: 'nest' });
    })();

    // ---- Spillway Reservoir: dam wall, turbine hall, pump house, boathouse.
    (function spillway() {
        const r = 'spillway';
        const crest = 4;
        for (let z = 8; z <= 76; z += 4) {
            const base = Math.min(rawHeight(94, z), 0) - 8;
            boxes.push({ x: 94, y: (crest + base) / 2, z, w: 6, h: crest - base, d: 4, mat: 'soviet_concrete' });
        }
        markers.push({ id: 'dam', name: 'Spillway dam', x: 94, y: crest, z: 42, region: r, kind: 'landmark' });
        building({ x: 76, z: 42, w: 16, d: 10, floors: 2, rot: 1, mat: 'soviet_concrete', type: 'turbine_hall', name: 'Turbine hall', region: r, tier: 3, loot: ['toolbox', 'crate', 'locker', 'electrical'] });
        building({ x: 150, z: 96, w: 8, d: 6, floors: 1, rot: 2, mat: 'wood_plank', type: 'boathouse', name: 'Boathouse', region: r, tier: 2, loot: ['toolbox', 'crate'] });
        building({ x: 200, z: 30, w: 7, d: 7, floors: 1, rot: 3, mat: 'concrete', type: 'pumphouse', name: 'Pump house', region: r, tier: 2, loot: ['electrical', 'toolbox'] });
        radioTower('dam_tower', 'Dam radio tower', 94, 72, r, crest);
    })();

    // ---- Frostline Mountain: quarry pit, mine head, alpine lodge, cable car pylons.
    (function frostline() {
        const r = 'frost';
        building({ x: 40, z: -150, w: 12, d: 9, floors: 2, rot: 0, mat: 'wood_plank', type: 'lodge', name: 'Frostline lodge', region: r, tier: 3, loot: ['wardrobe', 'fridge', 'cabinet', 'locker'] });
        building({ x: 105, z: -150, w: 10, d: 8, floors: 1, rot: 2, mat: 'rusted_metal', roof: 'rust_steel', type: 'minehead', name: 'Quarry mine head', region: r, tier: 3, loot: ['toolbox', 'crate', 'military_crate'] });
        for (let i = 0; i < 6; i++) {
            const x = 30 + i * 18, z = -120 - i * 14;
            const y = rawHeight(x, z);
            boxes.push({ x, y: y + 9, z, w: 0.9, h: 18, d: 0.9, mat: 'rust_steel' });
            boxes.push({ x, y: y + 18, z, w: 4, h: 0.6, d: 0.6, mat: 'rust_steel', noCollide: true });
        }
        deferred.push(() => radioTower('frost_tower', 'Summit radio tower', 80, -200, r));
    })();

    // ---- Cinder Refinery: tanks, cracking towers, flare stack, control room.
    (function cinder() {
        const r = 'cinder';
        const ry = addPad(168, 168, 60, 50, 0, 3);
        for (const [x, z] of [[148, 150], [160, 150], [148, 186], [160, 186]]) boxes.push({ x, y: ry + 4, z, w: 9, h: 8, d: 9, mat: 'rust_steel', tank: true });
        for (const [x, z] of [[182, 160], [186, 176]]) boxes.push({ x, y: ry + 11, z, w: 3.5, h: 22, d: 3.5, mat: 'rusted_metal' });
        boxes.push({ x: 196, y: ry + 15, z: 150, w: 1.4, h: 30, d: 1.4, mat: 'rust_steel' });
        lights.push({ x: 196, y: ry + 31, z: 150, color: 0xff7a1a, flare: true });
        building({ x: 175, z: 196, w: 10, d: 8, floors: 2, rot: 0, mat: 'concrete', type: 'control', name: 'Refinery control room', region: r, tier: 3, loot: ['electrical', 'locker', 'chem'] });
        for (let i = 0; i < 6; i++) containers.push({ x: 140 + i * 9, y: ry, z: 168, type: 'fuel_drum', tier: 3, poi: 'refinery', region: r });
        markers.push({ id: 'cinder_flare', name: 'Refinery flare stack', x: 196, y: ry, z: 150, region: r, kind: 'landmark' });
    })();

    // ---- Black Pine Research Campus: lab blocks, dome, perimeter wall, guard towers.
    (function campus() {
        const r = 'campus';
        const cy = addPad(-12, -88, 70, 56, 0, 4, 9);
        for (const [x, z, w, d] of [[-30, -100, 16, 12], [8, -100, 16, 12], [-12, -72, 22, 10]]) {
            const lab = building({ x, z, w, d, floors: 3, rot: 0, padH: 9, mat: 'lab_panel', roof: 'diamond_plate', type: 'lab', name: 'Research lab', region: r, tier: 4, loot: ['lab_cabinet', 'locker', 'electrical', 'chem'], doors: ['s', 'n'] });
            // The director's terminal on the top floor of the north-west lab holds the Lantern research.
            if (x === -30) containers.push({ x: x + 4, y: lab.y + 0.16 + 2 * 3.1, z, type: 'lab_cabinet', tier: 4, poi: 'lab', region: r, story: 'lab_data' });
        }
        fenceLine(-47, -116, 23, -116, 'soviet_concrete', 3);
        fenceLine(-47, -60, 23, -60, 'soviet_concrete', 3, [[0.42, 0.58]]);
        fenceLine(-47, -116, -47, -60, 'soviet_concrete', 3);
        fenceLine(23, -116, 23, -60, 'soviet_concrete', 3);
        markers.push({ id: 'campus_gate', name: 'Campus gate', x: -12, y: cy, z: -60, region: r, kind: 'gate' });
        markers.push({ id: 'campus_dome', name: 'Observation dome', x: 14, y: cy, z: -80, region: r, kind: 'landmark' });
    })();

    for (const fn of deferred) fn();
    for (const m of markers) if (!m.y) m.y = rawFinal(m.x, m.z);

    // ---- The Crater: the Lantern spire and debris.
    markers.push({ id: 'lantern', name: 'The Lantern', x: LANTERN.x, y: rawHeight(LANTERN.x, LANTERN.z), z: LANTERN.z, region: 'crater', kind: 'lantern' });

    /* --------------------------------------------------------------- deposits */
    const deposits = [];
    (function scatterDeposits() {
        const R = rng(9001);
        const table = {
            meadow: [['kindling', 5], ['stones', 5], ['roots', 4], ['herbs', 3], ['boulder', 2], ['clay', 1]],
            town: [['kindling', 2], ['stones', 3], ['roots', 2], ['herbs', 1], ['buried', 1]],
            forest: [['kindling', 6], ['roots', 4], ['herbs', 4], ['stones', 3], ['boulder', 2], ['coal', 1]],
            industrial: [['stones', 3], ['buried', 3], ['iron', 2], ['coal', 2], ['kindling', 1]],
            wetland: [['clay', 5], ['roots', 3], ['herbs', 3], ['copper', 2], ['buried', 2]],
            alpine: [['boulder', 5], ['iron', 4], ['coal', 3], ['quartz', 2], ['copper', 2], ['hardwood', 3]],
            ash: [['coal', 4], ['iron', 3], ['copper', 3], ['buried', 2], ['stones', 2]],
            campus: [['quartz', 2], ['buried', 2], ['copper', 1]],
            crater: [['quartz', 4], ['deep', 1]]
        };
        for (let x = BOUNDS.minX + 18; x < BOUNDS.maxX - 18; x += 11) {
            for (let z = BOUNDS.minZ + 18; z < BOUNDS.maxZ - 18; z += 11) {
                const px = x + (R() - 0.5) * 8, pz = z + (R() - 0.5) * 8;
                const reg = regionAt(px, pz);
                if (R() > 0.32) continue;
                const h = rawFinal(px, pz);
                if (inReservoir(px, pz) && h < WATER + 0.2) continue;
                if (pads.some((p) => Math.abs(px - p.x) < p.hw + 1 && Math.abs(pz - p.z) < p.hd + 1)) continue;
                if (roadInfo(px, pz)?.d < 5) continue;
                const list = table[reg.biome];
                const total = list.reduce((s, [, w]) => s + w, 0);
                let roll = R() * total, kind = list[0][0];
                for (const [k, w] of list) { roll -= w; if (roll <= 0) { kind = k; break; } }
                if (kind === 'deep' && deposits.some((d) => d.kind === 'deep')) continue;
                deposits.push({ kind, x: +px.toFixed(1), y: +h.toFixed(2), z: +pz.toFixed(1), region: reg.id });
            }
        }
        // The deep geode sits at the crater floor.
        if (!deposits.some((d) => d.kind === 'deep')) deposits.push({ kind: 'deep', x: LANTERN.x + 8, y: rawFinal(LANTERN.x + 8, LANTERN.z + 4), z: LANTERN.z + 4, region: 'crater' });
    })();

    /* --------------------------------------------------------------- vegetation */
    const trees = [];
    const rocks = [];
    (function scatterVegetation() {
        const R = rng(31337);
        const density = { meadow: 0.12, town: 0.05, forest: 0.62, industrial: 0.03, wetland: 0.2, alpine: 0.22, ash: 0.06, campus: 0.04, crater: 0.0 };
        for (let x = BOUNDS.minX + 10; x < BOUNDS.maxX - 10; x += 5.5) {
            for (let z = BOUNDS.minZ + 10; z < BOUNDS.maxZ - 10; z += 5.5) {
                const px = x + (R() - 0.5) * 4.4, pz = z + (R() - 0.5) * 4.4;
                const reg = regionAt(px, pz);
                const n = N.fbm(px / 40, pz / 40, 77, 3) * 0.5 + 0.5;
                const p = density[reg.biome] * (0.4 + n * 1.2);
                if (R() > p) { if (R() < 0.012) rocks.push({ x: px, z: pz, s: 0.6 + R() * 1.6 }); continue; }
                const h = rawFinal(px, pz);
                if ((inReservoir(px, pz) && h < WATER + 0.6) || h > 48) continue;
                if (pads.some((pd) => Math.abs(px - pd.x) < pd.hw + 2.5 && Math.abs(pz - pd.z) < pd.hd + 2.5)) continue;
                if (roadInfo(px, pz)?.d < 6 || railDist(px, pz) < 5) continue;
                if (Math.hypot(px - LANTERN.x, pz - LANTERN.z) < 48) continue;
                const type = reg.biome === 'ash' ? 'dead' : (reg.biome === 'meadow' || reg.biome === 'town' || reg.biome === 'wetland') && R() < 0.55 ? 'broad' : 'pine';
                trees.push({ x: +px.toFixed(2), z: +pz.toFixed(2), y: h, type, s: 0.75 + R() * 0.55, region: reg.id });
            }
        }
    })();

    /* --------------------------------------------------------------- colours */
    const BIOME_COL = {
        meadow: [0.47, 0.56, 0.31], town: [0.5, 0.52, 0.38], forest: [0.31, 0.4, 0.24], industrial: [0.5, 0.47, 0.4],
        wetland: [0.4, 0.5, 0.36], alpine: [0.52, 0.55, 0.5], ash: [0.42, 0.36, 0.32], campus: [0.48, 0.5, 0.45], crater: [0.36, 0.32, 0.4]
    };
    function colorAt(x, z, h, slope) {
        const reg = regionAt(x, z);
        let c = BIOME_COL[reg.biome].slice();
        // Blend with the second nearest region for soft borders.
        const n = N.fbm(x / 18, z / 18, 51, 3) * 0.08;
        c = c.map((v) => v + n);
        if (slope > 0.75) { const k = smooth(0.75, 1.3, slope); c = c.map((v, i) => lerp(v, [0.42, 0.41, 0.39][i], k)); }
        if (h > 26) { const k = smooth(26, 38, h); c = c.map((v, i) => lerp(v, [0.88, 0.9, 0.92][i], k)); }
        if (inReservoir(x, z) && h < WATER + 1.2) { const k = smooth(WATER + 1.2, WATER - 0.4, h); c = c.map((v, i) => lerp(v, [0.42, 0.38, 0.3][i], k)); }
        const road = roadInfo(x, z);
        if (road && road.d < road.road.w * 0.5) {
            const tint = road.road.mat === 'asphalt' ? [0.24, 0.25, 0.26] : [0.45, 0.38, 0.29];
            const k = smooth(road.road.w * 0.5, road.road.w * 0.5 - 1.2, road.d);
            c = c.map((v, i) => lerp(v, tint[i], k));
        }
        if (railDist(x, z) < 2.2) c = c.map((v, i) => lerp(v, [0.33, 0.3, 0.28][i], 0.7));
        const dc = Math.hypot(x - LANTERN.x, z - LANTERN.z);
        if (dc < 46) { const k = smooth(46, 20, dc); c = c.map((v, i) => lerp(v, [0.3, 0.26, 0.38][i], k)); }
        return c.map((v) => Math.max(0, Math.min(1, v)));
    }

    /* --------------------------------------------------------------- populate (runtime) */
    function populate(world, scene) {
        const props = { trees: [], rocks: [], waters: [], lantern: null, beacons: [], flares: [] };
        world.zone = props;
        const dummy = new THREE.Object3D();
        // Trees: instanced trunks and crowns per type.
        const defs = {
            pine: { trunk: new THREE.CylinderGeometry(0.16, 0.3, 4.2, 6), crown: new THREE.ConeGeometry(1.7, 5.2, 7), crownY: 4.6, tc: 0x5a4332, cc: 0x2f4a33 },
            broad: { trunk: new THREE.CylinderGeometry(0.2, 0.32, 3.4, 6), crown: new THREE.IcosahedronGeometry(2.1, 0), crownY: 4.2, tc: 0x5e4a38, cc: 0x4f6b3a },
            dead: { trunk: new THREE.CylinderGeometry(0.12, 0.26, 4.6, 5), crown: new THREE.BoxGeometry(2.2, 0.12, 0.12), crownY: 3.6, tc: 0x3a332e, cc: 0x3a332e }
        };
        for (const [type, d] of Object.entries(defs)) {
            const list = trees.filter((t) => t.type === type);
            if (!list.length) continue;
            const trunk = new THREE.InstancedMesh(d.trunk, new THREE.MeshStandardMaterial({ color: d.tc, roughness: 0.9 }), list.length);
            const crown = new THREE.InstancedMesh(d.crown, new THREE.MeshStandardMaterial({ color: d.cc, roughness: 0.85, flatShading: true }), list.length);
            const tint = new THREE.Color();
            list.forEach((t, i) => {
                const trunkH = d.trunk.parameters.height;
                dummy.position.set(t.x, t.y + trunkH * t.s / 2, t.z);
                dummy.rotation.set(0, (t.x * 13.1 + t.z) % 6.28, 0);
                dummy.scale.set(t.s, t.s, t.s);
                dummy.updateMatrix();
                trunk.setMatrixAt(i, dummy.matrix);
                dummy.position.set(t.x, t.y + d.crownY * t.s, t.z);
                dummy.updateMatrix();
                crown.setMatrixAt(i, dummy.matrix);
                tint.setHex(d.cc).offsetHSL(((t.x * 7 + t.z * 3) % 10) / 400, 0, ((t.z * 5) % 10) / 160 - 0.03);
                crown.setColorAt(i, tint);
                const col = { minX: t.x - 0.3 * t.s, maxX: t.x + 0.3 * t.s, minY: t.y, maxY: t.y + 5 * t.s, minZ: t.z - 0.3 * t.s, maxZ: t.z + 0.3 * t.s, active: true, tree: true };
                world.colliders.push(col);
                props.trees.push({ ...t, idx: i, trunk, crown, collider: col, alive: true, hp: 6 });
            });
            trunk.castShadow = crown.castShadow = true;
            trunk.receiveShadow = crown.receiveShadow = true;
            trunk.frustumCulled = crown.frustumCulled = false;
            if (crown.instanceColor) crown.instanceColor.needsUpdate = true;
            scene.add(trunk, crown);
        }
        // Rocks.
        if (rocks.length) {
            const rm = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x80837d, roughness: 0.95, flatShading: true }), rocks.length);
            rocks.forEach((r, i) => {
                const y = world.terrain.height(r.x, r.z);
                dummy.position.set(r.x, y + r.s * 0.3, r.z);
                dummy.rotation.set(r.x % 3, r.z % 3, 0);
                dummy.scale.set(r.s * 1.3, r.s * 0.7, r.s);
                dummy.updateMatrix();
                rm.setMatrixAt(i, dummy.matrix);
                if (r.s > 1.1) world.colliders.push({ minX: r.x - r.s, maxX: r.x + r.s, minY: y, maxY: y + r.s * 0.8, minZ: r.z - r.s * 0.8, maxZ: r.z + r.s * 0.8, active: true });
            });
            rm.castShadow = true;
            rm.receiveShadow = true;
            rm.frustumCulled = false;
            scene.add(rm);
        }
        // Reservoir water.
        const water = new THREE.Mesh(new THREE.PlaneGeometry(110, RESERVOIR.rz * 2.9, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x2f5c66, transparent: true, opacity: 0.78, roughness: 0.15, metalness: 0.35, depthWrite: false }));
        water.rotation.x = -Math.PI / 2;
        water.position.set(151, WATER, RESERVOIR.z);
        scene.add(water);
        props.waters.push(water);
        // The Lantern: a beam visible from anywhere (immune to fog), a pulsing core and light.
        const ly = world.terrain.height(LANTERN.x, LANTERN.z);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.32, fog: false, depthWrite: false, blending: THREE.AdditiveBlending });
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.6, 520, 16, 1, true), beamMat);
        beam.position.set(LANTERN.x, ly + 260, LANTERN.z);
        const halo = new THREE.Mesh(new THREE.CylinderGeometry(5, 9, 520, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.07, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
        halo.position.copy(beam.position);
        const spire = new THREE.Mesh(new THREE.OctahedronGeometry(3.2, 0), new THREE.MeshStandardMaterial({ color: 0x241c35, emissive: 0x6f4bff, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.6 }));
        spire.scale.set(1, 3.4, 1);
        spire.position.set(LANTERN.x, ly + 9, LANTERN.z);
        const glow = new THREE.PointLight(0x9a85ff, 2.4, 70, 1.6);
        glow.position.set(LANTERN.x, ly + 14, LANTERN.z);
        scene.add(beam, halo, spire, glow);
        world.colliders.push({ minX: LANTERN.x - 2.4, maxX: LANTERN.x + 2.4, minY: ly, maxY: ly + 20, minZ: LANTERN.z - 2.4, maxZ: LANTERN.z + 2.4, active: true });
        props.lantern = { beam, halo, spire, glow, baseY: ly };
        // Beacons and flares that pierce the fog.
        for (const l of lights) {
            const m = new THREE.Mesh(new THREE.SphereGeometry(l.flare ? 1.4 : 0.45, 10, 8), new THREE.MeshBasicMaterial({ color: l.color, fog: false }));
            m.position.set(l.x, l.y, l.z);
            scene.add(m);
            (l.flare ? props.flares : props.beacons).push(m);
            if (l.flare) {
                const pl = new THREE.PointLight(l.color, 2.2, 45, 1.8);
                pl.position.set(l.x, l.y, l.z);
                scene.add(pl);
            }
        }
        // Observation dome on the campus.
        const domeY = world.terrain.height(14, -80);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb8c4c8, roughness: 0.4, metalness: 0.5 }));
        dome.position.set(14, domeY, -80);
        scene.add(dome);
        world.worldMeshes.push(dome);
        world.colliders.push({ minX: 7, maxX: 21, minY: domeY, maxY: domeY + 7, minZ: -87, maxZ: -73, active: true });
        return props;
    }

    /** Called every frame by the Survival mode for world animation. */
    function animate(world, clock) {
        const z = world.zone;
        if (!z) return;
        if (z.lantern) {
            const pulse = 0.5 + Math.sin(clock * 0.9) * 0.5;
            z.lantern.beam.material.opacity = 0.24 + pulse * 0.14;
            z.lantern.glow.intensity = 1.8 + pulse * 1.4;
            z.lantern.spire.rotation.y = clock * 0.2;
            z.lantern.spire.material.emissiveIntensity = 0.7 + pulse * 0.5;
        }
        const blink = Math.sin(clock * 3) > 0.2;
        for (const b of z.beacons) b.visible = blink;
        for (const f of z.flares) f.scale.setScalar(0.85 + Math.random() * 0.35);
    }

    /* --------------------------------------------------------------- register map */
    const terrainDef = () => ({
        ...BOUNDS, res: 1, chunk: 64, waterLevel: WATER,
        isWater: (x, z, h) => inReservoir(x, z) && h < WATER - 1.1,
        height: (x, z) => rawFinal(x, z),
        // The renderer outputs sRGB, so vertex colours must be linear or they wash out.
        color: (x, z, h, s) => colorAt(x, z, h, s).map((v) => Math.pow(Math.max(0, v), 2.2)),
        carves: []
    });
    const map = {
        id: 'zone', name: 'The Exclusion Zone', mode: 'survival', large: true,
        playerSpawn: { x: -201, y: 0, z: 179, yaw: -0.9 },
        terrain: terrainDef,
        boxes, ramps, waypoints: [],
        populate,
        atmosphere: {
            skyTop: 0x4d6378, skyBottom: 0x9aa59a, fogColor: 0x8f9a90, fogDensity: 0.0065,
            hemiSky: 0xb7c8de, hemiGround: 0x4f5a3e, hemiIntensity: 1.05,
            sunColor: 0xffe1b3, sunIntensity: 1.45, sunPos: [-60, 90, 40]
        }
    };
    BO.MapsData.MAPS.zone = map;
    // Bots roam between points of interest.
    map.waypoints = pois.map((poi, i) => ({ id: 'zp' + i, x: poi.x, y: poi.y, z: poi.z + Math.max(poi.d, poi.w) / 2 + 3, links: [] }));

    /* --------------------------------------------------------------- data overrides (runtime) */
    const HAVEN_CONTACTS = [
        ['rowan', 'Quartermaster Rowan', -103, 90, 'Haven runs on what scavengers bring back. Trade me salvage and I keep you supplied.', ['ration', 'plates', 'ammo'], { rations: 1, bandage: 1 }, ['Supply run', 'containers', 25, 140]],
        ['mara', 'Medic Mara', -96, 97, 'Infection is what kills people out here. Bring me herbs and cloth and I patch you up.', ['aid', 'cloth'], { bandage: 2 }, ['Field clinic', 'healed', 120, 120]],
        ['reed', 'Mechanic Reed', -95, 88, 'Bikes, fuel, wire — I can get the road moving if you bring me parts.', ['bike', 'fuel'], null, ['Wired up', 'crafted_drawWire', 2, 130]],
        ['inez', 'Surveyor Inez', -107, 95, 'Every radio tower you repair lets us triangulate the Lantern. And you can travel between them.', [], { caveMap: 1 }, ['Cartographer', 'landmarks', 6, 180]],
        ['bell', 'Cook Bell', -101, 99, 'Hot food keeps you steady. Cook at any campfire — or here, at our stove.', ['ration'], { canned: 2 }, ['Hot supper', 'cooked', 2, 90]],
        ['suri', 'Armorer Suri', -92, 93, 'Guns rot in the rain. Keep them clean, keep your brass, and reload at a bench.', ['ammo', 'plates'], null, ['Range work', 'kills', 25, 200]]
    ];
    let applied = false;
    function applyOverrides() {
        const CD = BO.SurvivalCampaignData;
        const FD = BO.SurvivalFrontierData;
        CD.areas.length = 0;
        for (const r of REGIONS) CD.areas.push({ id: r.id, name: r.name, x: r.x, y: 0, z: r.z, color: r.color, level: 1, tier: r.ring + 1, threat: r.threat });
        CD.contacts.length = 0;
        for (const [id, name, x, z, hint, shop, gift, quest] of HAVEN_CONTACTS) CD.contacts.push({ id, name, area: 'relay', x, y: 0, z, hint, shop, gift, quest });
        if (CD.stock.ammo) CD.stock.ammo = { name: 'Ammunition pouch', cost: { scrap: 3 }, gain: { ammo9: 18 } };
        FD.deposits = deposits;
        const DD = BO.SurvivalDeepData;
        if (DD) { DD.shrines.length = 0; DD.talismanPickups.length = 0; DD.goldenSeeds.length = 0; }
        const SD = BO.SurvivalData;
        SD.sites.length = 0;
        for (const mk of markers) if (['site', 'safehouse', 'mast', 'settlement', 'landmark', 'gate', 'lantern'].includes(mk.kind)) {
            SD.sites.push({ id: mk.id, name: mk.name, x: mk.x, y: mk.y, z: mk.z, label: mk.name, color: 0x8fe3c8 });
        }
        SD.stashes.length = 0;
        SD.structures.length = 0;
        const legacy = SD.recipes.filter((r) => !['ammo', 'coilgun'].includes(r.id));
        SD.recipes.length = 0;
        SD.recipes.push(...legacy);
        const AD = BO.SurvivalActivitiesData;
        if (AD && !applied) {
            const y = (x, z) => rawFinal(x, z);
            const set = (arr, list) => { arr.length = 0; for (const e of list) arr.push({ ...e, y: e.y ?? y(e.x, e.z) }); };
            set(AD.plots, [
                { id: 'beans', name: 'Haven bean bed', x: -110, z: 99, color: 0x89b56f, grow: 72, loot: { rations: 3, cropSeeds: 2 } },
                { id: 'fiber', name: 'Haven fiber bed', x: -110, z: 94, color: 0xc9ac67, grow: 54, loot: { fiber: 6, cropSeeds: 2 } },
                { id: 'bitterleaf', name: 'Haven herb bed', x: -110, z: 89, color: 0x6fb290, grow: 60, loot: { herbs: 5, cropSeeds: 2 } }
            ]);
            set(AD.pumps, [
                { id: 'relay', name: 'Relay well', x: -112, z: 120 },
                { id: 'marsh', name: 'Reservoir intake', x: 118, z: 70 },
                { id: 'west', name: 'Hollow town pump', x: -164, z: 4 }
            ]);
            set(AD.shore, [
                { id: 'west', name: 'Reservoir west jetty', x: 104, z: 60, color: 0x789faf, loot: [{ scrap: 2, cord: 1 }, { rations: 1, fuel: 1 }, { timber: 3, cloth: 1 }] },
                { id: 'spillway', name: 'Boathouse slip', x: 146, z: 90, color: 0x91bdbe, loot: [{ copper: 3, scrap: 1 }, { clay: 4, fuel: 1 }, { iron: 2, quartz: 1 }] },
                { id: 'freight', name: 'North shore inlet', x: 160, z: 10, color: 0x98b1b2, loot: [{ iron: 2, cloth: 1 }, { wire: 2, battery: 1 }, { scrap: 3, ammo9: 8 }] }
            ]);
            set(AD.relays, markers.filter((mk) => mk.kind === 'tower').map((mk) => ({ id: mk.id, name: mk.name, x: mk.x, z: mk.z, y: mk.y })));
            set(AD.surveys, [
                { id: 'fork', name: 'Saint Ansel steeple', x: -140, z: 41, loot: { cord: 2, battery: 1 } },
                { id: 'spire', name: 'Kessel crane cab', x: -30, z: 146, loot: { wire: 2, ammo556: 10 } },
                { id: 'cistern', name: 'Dam control plate', x: 98, z: 30, loot: { fuel: 2, freshWater: 1 } },
                { id: 'echo', name: 'Flare stack gauge', x: 192, z: 154, loot: { powder: 2, filter: 1 } }
            ]);
            AD.routes.length = 0;
            AD.board = { x: -98, z: 84 };
            applied = true;
        }
    }

    BO.Zone = {
        applyOverrides, HAVEN: { x: -100, z: 92 },
        BOUNDS, REGIONS, ROADS, RAIL, WATER, LANTERN, RESERVOIR,
        regionAt, rawFinal, roadInfo, inReservoir, colorAt, pois, containers, markers, deposits, trees, rocks, ladders, lights, pads,
        map, animate
    };
})(window.BO);
