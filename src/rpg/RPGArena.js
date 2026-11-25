/* ============================================================================
   BLACKOUT OPS — RPG Arena Generator
   Builds one procedural arena per delve floor as a regular map object (boxes,
   ramps, lights, waypoints) so BO.World.build() can construct it like any
   other map. Registered as BO.MapsData.MAPS.rpg_arena before each build.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MAP_ID = 'rpg_arena';

    // Small deterministic PRNG so a suspended floor rebuilds identically on resume.
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function box(x1, y1, z1, x2, y2, z2, mat) {
        return {
            x: (x1 + x2) * 0.5, y: (y1 + y2) * 0.5, z: (z1 + z2) * 0.5,
            w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), d: Math.abs(z2 - z1), mat
        };
    }

    // 2D segment vs expanded AABB (slab test).
    function segHitsBox(ax, az, bx, bz, b, pad) {
        const minX = b.x - b.w * 0.5 - pad, maxX = b.x + b.w * 0.5 + pad;
        const minZ = b.z - b.d * 0.5 - pad, maxZ = b.z + b.d * 0.5 + pad;
        let t0 = 0, t1 = 1;
        const dx = bx - ax, dz = bz - az;
        const clip = (p, q) => {
            if (Math.abs(p) < 1e-9) return q >= 0;
            const r = q / p;
            if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
            return true;
        };
        return clip(-dx, ax - minX) && clip(dx, maxX - ax) && clip(-dz, az - minZ) && clip(dz, maxZ - az) && t0 <= t1;
    }

    function insideBox(x, z, b, pad) {
        return x >= b.x - b.w * 0.5 - pad && x <= b.x + b.w * 0.5 + pad && z >= b.z - b.d * 0.5 - pad && z <= b.z + b.d * 0.5 + pad;
    }

    const SIZES = {
        combat: [40, 44], elite: [40, 44], treasure: [36, 40], ambush: [42, 44],
        boss: [48, 52], rest: [24, 26], shrine: [26, 28],
        vents: [38, 46], surge: [46, 40], fracture: [46, 48], speedrun: [37, 41], hunt: [49, 35],
        crossfire: [56, 35], shop: [29, 27], puzzle: [27, 32], sanctuary: [25, 28], defend: [45, 49],
        miniboss: [41, 37], mimic: [35, 39], darkroom: [43, 48], storm: [52, 44]
    };

    BO.RPGArena = {
        MAP_ID,

        /**
         * @param {object} o { floor, roomType, seed, gateCount }
         * @returns {{ mapId, map, layout }}
         */
        generate(o) {
            const D = BO.RPGData;
            const rng = mulberry32((o.seed || 1) * 7919 + o.floor * 104729);
            const rr = (a, b) => a + rng() * (b - a);
            const biome = D.biomeForFloor(o.floor);
            const type = o.roomType || 'combat';
            const room = D.ROOMS[type] || D.ROOMS.combat;
            const hazard = room.hazard;
            const [baseWidth, baseLength] = SIZES[type] || (room.quiet ? [26, 30] : SIZES.combat);
            // Alternate odd and even widths so consecutive floors cannot share a footprint.
            const W = Math.round((baseWidth + rr(-4, 4)) / 2) * 2 + o.floor % 2;
            const L = Math.round((baseLength + rr(-5, 6)) * 2) / 2;
            const encounter = BO.RPGEncounters[(o.floor + (o.seed || 0) % 31) % BO.RPGEncounters.length];
            const styleIndex = (o.floor + Math.floor((o.seed || 0) / 53)) % 8;
            const style = ['Cloister', 'Spine', 'Terraces', 'Foundry', 'Split Court', 'Arcade', 'Switchback', 'Causeway'][styleIndex];
            const hw = W * 0.5, hl = L * 0.5;
            const wallH = 7.2 + (styleIndex % 3) * 1.05;
            const boxes = [];
            const ramps = [];
            const obstacles = []; // solid cover used for spacing & waypoint tests

            // Floor slab + perimeter walls.
            boxes.push(box(-hw - 1, -1, -hl - 1, hw + 1, 0, hl + 1, biome.floorMat));
            boxes.push(box(-hw - 1, 0, -hl - 1, hw + 1, wallH, -hl, biome.wallMat));
            boxes.push(box(-hw - 1, 0, hl, hw + 1, wallH, hl + 1, biome.wallMat));
            boxes.push(box(-hw - 1, 0, -hl, -hw, wallH, hl, biome.wallMat));
            boxes.push(box(hw, 0, -hl, hw + 1, wallH, hl, biome.wallMat));
            // Trim band along the walls for depth.
            boxes.push(box(-hw, 0, -hl, hw, 0.35, -hl + 0.4, biome.coverMat));
            boxes.push(box(-hw, 0, hl - 0.4, hw, 0.35, hl, biome.coverMat));

            const spawn = { x: 0, y: 0, z: hl - 3.2, yaw: 0 };
            const gateCount = Math.max(1, Math.min(3, o.gateCount || 2));
            const gateZ = -hl + 0.9;
            const gates = [];
            const spread = Math.min(11, W / (gateCount + 1));
            for (let i = 0; i < gateCount; i++) {
                const gx = (i - (gateCount - 1) * 0.5) * spread;
                gates.push({ x: gx, z: gateZ, standZ: gateZ + 1.9 });
                // Gate frame: two pillars and a lintel (portal surface is added by RPGMode).
                boxes.push(box(gx - 2.0, 0, gateZ - 0.45, gx - 1.45, 4.6, gateZ + 0.45, biome.coverMat));
                boxes.push(box(gx + 1.45, 0, gateZ - 0.45, gx + 2.0, 4.6, gateZ + 0.45, biome.coverMat));
                boxes.push(box(gx - 2.0, 4.6, gateZ - 0.45, gx + 2.0, 5.2, gateZ + 0.45, biome.coverMat));
            }

            const center = { x: 0, z: -2 };
            const keepClear = (x, z, pad = 0) => {
                if (z > spawn.z - 6.5) return false;                 // spawn pocket
                if (z < gateZ + 5.5) return false;                   // gate apron
                if (Math.hypot(x - center.x, z - center.z) < (type === 'defend' ? 7.2 : 4.2) + pad && type !== 'combat' && type !== 'ambush') return false; // feature spot
                return true;
            };
            const tryPlace = (w, d, h, mat, tries = 18) => {
                for (let t = 0; t < tries; t++) {
                    const x = rr(-hw + 3 + w * 0.5, hw - 3 - w * 0.5);
                    const z = rr(-hl + 3 + d * 0.5, hl - 3 - d * 0.5);
                    if (!keepClear(x, z, Math.max(w, d) / 2)) continue;
                    const cand = { x, z, w, d };
                    if (obstacles.some((b) => insideBox(x, z, b, Math.max(w, d) * 0.5 + 2.6))) continue;
                    const b = box(x - w * 0.5, 0, z - d * 0.5, x + w * 0.5, h, z + d * 0.5, mat);
                    boxes.push(b);
                    obstacles.push(b);
                    return cand;
                }
                return null;
            };

            // Each floor has a different landmark arrangement plus seed-placed tactical cover.
            const isBig = !room.quiet && type !== 'boss';
            if (isBig) {
                const landmarks = [
                    [[-0.40,-0.35],[0.40,-0.35],[-0.40,0.22],[0.40,0.22]],
                    [[0,-0.52],[0,0.05],[0,0.47]],
                    [[-0.64,-0.30],[0.55,-0.05],[-0.55,0.38]],
                    [[-0.63,-0.47],[0.55,-0.47],[0,0.25]],
                    [[-0.73,-0.15],[-0.25,-0.15],[0.25,0.19],[0.73,0.19]],
                    [[-0.66,-0.29],[0.66,-0.29],[-0.66,0.31],[0.66,0.31]],
                    [[-0.55,-0.42],[0.50,-0.15],[-0.40,0.24],[0.55,0.39]],
                    [[-0.28,-0.44],[0.28,-0.44],[-0.28,0.44],[0.28,0.44]]
                ][styleIndex];
                for (const [px, pz] of landmarks) {
                    const x = px * hw, z = pz * hl;
                    if (!keepClear(x, z, 1) || Math.hypot(x - center.x, z - center.z) < (type === 'defend' ? 6 : 3)) continue;
                    const w = styleIndex === 2 || styleIndex === 4 ? 3.1 : 0.95;
                    const height = (styleIndex === 2 ? 1.05 : 3.4 + styleIndex % 3) + rr(0, 0.5);
                    const b = box(x - w, 0, z - 0.9, x + w, height, z + 0.9, biome.wallMat);
                    boxes.push(b, box(x - w - 0.14, height, z - 1.04, x + w + 0.14, height + 0.22, z + 1.04, biome.coverMat));
                    obstacles.push(b);
                }
                const pillars = 2 + Math.floor(rng() * 3);
                for (let i = 0; i < pillars; i++) tryPlace(1.5, 1.5, wallH - 0.5, biome.wallMat);
                const lows = 3 + Math.floor(rng() * 3);
                for (let i = 0; i < lows; i++) {
                    if (rng() < 0.5) tryPlace(rr(3.5, 5.5), 0.8, 1.15, biome.coverMat);
                    else tryPlace(0.8, rr(3.5, 5.5), 1.15, biome.coverMat);
                }
                const crates = 3 + Math.floor(rng() * 4);
                for (let i = 0; i < crates; i++) {
                    const c = tryPlace(1.7, 1.7, 1.7, biome.crateMat);
                    if (c && rng() < 0.35) boxes.push(box(c.x - 0.7, 1.7, c.z - 0.7, c.x + 0.7, 3.1, c.z + 0.7, biome.crateMat));
                }
            } else if (type === 'boss') {
                const spread = 0.46 + styleIndex * 0.025;
                for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                    const px = sx * hw * spread, pz = sz * hl * (0.28 + rr(0.02, 0.22));
                    const b = box(px - 1, 0, pz - 1, px + 1, wallH - 0.5, pz + 1, biome.wallMat);
                    boxes.push(b);
                    obstacles.push(b);
                }
            }

            // Hidden cache: a ledge in a side corner reachable by a ramp (exploration reward).
            let cache = null;
            if (isBig && type !== 'ambush' && rng() < 0.55) {
                const side = rng() < 0.5 ? -1 : 1;
                const px = side * (hw - 3.2);
                const pz = rr(-hl + 9, -2);
                const platH = 2.6;
                const plat = box(px - 2.2, 0, pz - 2.2, px + 2.2, platH, pz + 2.2, biome.coverMat);
                if (!obstacles.some((b) => insideBox(px, pz, b, 4) || segHitsBox(px, pz + 2.2, px, pz + 8.2, b, 1.5))) {
                    boxes.push(plat);
                    obstacles.push(plat);
                    ramps.push({ x: px, w: 2.4, z1: pz + 7.6, z2: pz + 2.2, y1: 0, y2: platH, axis: 'z', mat: biome.coverMat });
                    cache = { x: px, y: platH, z: pz - 0.6 };
                }
            }

            // Open points for enemy camps (sorted far → near the spawn).
            const camps = [];
            for (let t = 0; t < 160 && camps.length < 10; t++) {
                const x = rr(-hw + 3.5, hw - 3.5);
                const z = rr(-hl + 4, hl - 12);
                if (Math.hypot(x - spawn.x, z - spawn.z) < 13) continue;
                if (obstacles.some((b) => insideBox(x, z, b, 2.2))) continue;
                if (ramps.some((r) => Math.abs(x - r.x) < r.w && z > Math.min(r.z1, r.z2) - 1 && z < Math.max(r.z1, r.z2) + 1)) continue;
                if (camps.some((c) => Math.hypot(c.x - x, c.z - z) < 6.5)) continue;
                camps.push({ x, z });
            }
            camps.sort((a, b) => Math.hypot(b.x - spawn.x, b.z - spawn.z) - Math.hypot(a.x - spawn.x, a.z - spawn.z));

            // Free spots for ambush waves (along the side walls, away from the player).
            const ambushSpots = [];
            for (let i = 0; i < 6; i++) {
                const side = i % 2 === 0 ? -1 : 1;
                ambushSpots.push({ x: side * (hw - 2), z: -hl + 5 + i * ((L - 18) / 6) });
            }

            // Waypoint grid (used by enemy pathing when line of sight is blocked).
            const waypoints = [];
            const step = 4.5;
            const grid = new Map();
            for (let x = -hw + 2; x <= hw - 2 + 0.01; x += step) {
                for (let z = -hl + 2; z <= hl - 2 + 0.01; z += step) {
                    if (obstacles.some((b) => insideBox(x, z, b, 0.9))) continue;
                    const id = `w${Math.round(x * 10)}_${Math.round(z * 10)}`;
                    const wp = { id, x, y: 0, z, links: [] };
                    waypoints.push(wp);
                    grid.set(`${Math.round((x + hw) / step)}_${Math.round((z + hl) / step)}`, wp);
                }
            }
            for (const [key, wp] of grid) {
                const [gi, gj] = key.split('_').map(Number);
                for (let di = -1; di <= 1; di++) {
                    for (let dj = -1; dj <= 1; dj++) {
                        if (!di && !dj) continue;
                        const nb = grid.get(`${gi + di}_${gj + dj}`);
                        if (!nb) continue;
                        if (obstacles.some((b) => segHitsBox(wp.x, wp.z, nb.x, nb.z, b, 0.5))) continue;
                        wp.links.push(nb.id);
                    }
                }
            }

            const hazards = [];
            if (hazard) {
                // Use open pathing points and leave space to escape each ring.
                const spots = waypoints.filter(({ x, z }) => keepClear(x, z, hazard.radius - 2) &&
                    Math.abs(x) < hw - hazard.radius && Math.abs(z) < hl - hazard.radius &&
                    !obstacles.some((b) => insideBox(x, z, b, hazard.radius * 0.65)) &&
                    !ramps.some((r) => Math.abs(x - r.x) < r.w / 2 + hazard.radius &&
                        z > Math.min(r.z1, r.z2) - hazard.radius && z < Math.max(r.z1, r.z2) + hazard.radius));
                while (hazards.length < hazard.count && spots.length) {
                    const [spot] = spots.splice(Math.floor(rng() * spots.length), 1);
                    if (hazards.some((h) => Math.hypot(h.x - spot.x, h.z - spot.z) < hazard.radius * 2 + 1)) continue;
                    hazards.push({ x: spot.x, z: spot.z, phase: hazards.length / hazard.count });
                }
            }

            // Lights: biome-tinted lamps plus fire barrels in the corners.
            const lights = [];
            const lampRows = room.quiet ? [[0, 0]] : [[-hw * 0.5, -hl * 0.45], [hw * 0.5, -hl * 0.45], [-hw * 0.5, hl * 0.35], [hw * 0.5, hl * 0.35], [0, 0]];
            for (const [i, [lx, lz]] of lampRows.entries()) {
                lights.push({ x: lx, y: wallH - 1.2, z: lz, color: i % 2 ? 0xffcf8b : biome.light,
                    intensity: type === 'darkroom' ? 0.42 : 1.85, distance: type === 'darkroom' ? 13 : 28, alwaysOn: true });
            }
            for (const [fx, fz] of [[-hw + 1.6, -hl + 1.6], [hw - 1.6, -hl + 1.6], [-hw + 1.6, hl - 1.6], [hw - 1.6, hl - 1.6]]) {
                lights.push({ x: fx, y: 1.4, z: fz, color: 0xff7a2f, intensity: 1.2, distance: 12, prop: 'fire_barrel', alwaysOn: true });
            }

            const floorLabel = 'B-' + String(o.floor).padStart(2, '0');
            const map = {
                id: MAP_ID,
                name: `${biome.name.toUpperCase()} • FLOOR ${o.floor}`,
                mode: 'rpg',
                subtitle: biome.name + ' · ' + style,
                description: 'Procedural RPG delve floor.',
                atmosphere: { moon: false, ...biome.atmosphere, ...(type === 'darkroom' ? { sunIntensity: 0.24, hemiIntensity: 0.38 } : {}) },
                playerSpawn: spawn,
                ramps,
                boxes,
                lights,
                zones: ['spawn'],
                waypoints,
                wallWritings: [
                    { text: floorLabel, sub: biome.name.toUpperCase(), x: 0, y: 6.2, z: -hl + 0.06, rotY: 0, w: 4.4, h: 2.2, color: biome.accent }
                ]
            };
            BO.MapsData.MAPS[MAP_ID] = map;

            return {
                mapId: MAP_ID,
                map,
                layout: { W, L, hw, hl, wallH, spawn, gates, camps, ambushSpots, cache, center, biome, type, hazards, encounter, style }
            };
        }
    };
})(window);
