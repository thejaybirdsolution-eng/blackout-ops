/* ============================================================================
   BLACKOUT OPS — Open World Ground Cover
   Living ground layer streamed around the player: grass tufts, wildflowers,
   ferns, reeds, heather, dry scrub, rocks, frost, crystals and embers, chosen
   per region so every biome reads differently underfoot.

   • Deterministic 16 m chunks inside a preset radius (Medium 40 m, High 60 m,
     Ultra 84 m; off on Low), generated nearest-first inside a 2.5 ms frame
     budget so travel never hitches.
   • Kept off roads, rails, water, buildings, settlements and steep slopes; reeds
     gather at the waterline instead.
   • One InstancedMesh per plant type (≤7 draw calls for the whole layer);
     buffers are re-packed only when the set of chunks changes.
   • GPU wind (two-frequency gusts), plants that bend away from the player as
     you walk through them, distance shrink-fade (no popping), base ambient
     darkening, and self-lit crystals and embers in the Meridian Core and the
     Dragonwilds. Receives shadows; casts none.
============================================================================ */
(function (BO) {
    'use strict';

    const CHUNK = 16;
    const RADIUS = { low: 0, medium: 40, high: 60, ultra: 84 };
    const DENSITY = { low: 0, medium: 0.55, high: 1.0, ultra: 1.35 };
    const CAP = { tuft: 42000, flower: 5000, fern: 5000, reed: 5000, rock: 3000, scrub: 3000, crystal: 2000 };

    // Per-region palette and mix. rates are per tuft candidate.
    const BIOMES = {
        haven_basin:          { d: 1.0,  grass: [0x6f8f3a, 0x8fae4a, 0x7c9a3f], flowers: [0xf5d547, 0xffffff, 0xb48cf2, 0xf28cb1], flower: 0.08, rock: 0.012, rockCol: 0x8a8c84 },
        whispering_woods:     { d: 0.95, grass: [0x3f6a35, 0x5c7f3e, 0x4a7339], flowers: [0xffffff, 0xe8e070], flower: 0.025, fern: 0.13, rock: 0.012, rockCol: 0x6f746c },
        rust_sprawl:          { d: 0.38, grass: [0x8a8a4a, 0x6f6a3c, 0x7a7444], rock: 0.035, rockCol: 0x6b5a4c, scrub: 0.02, scrubCol: 0x6d6a3a },
        barrow_moor:          { d: 0.8,  grass: [0x6d6a52, 0x5b5546, 0x75705a], heather: 0.22, heatherCols: [0x8a5a9c, 0x6f4a86, 0x9b6aa6], rock: 0.02, rockCol: 0x6e6c74 },
        mire_delta:           { d: 0.95, grass: [0x4f6a36, 0x627a3c, 0x56703a], flowers: [0xf0f0d0], flower: 0.02, reed: 0.3, rock: 0.006, rockCol: 0x5d6457 },
        ash_quarry:           { d: 0.28, grass: [0x7a7468, 0x67625a], rock: 0.07, rockCol: 0x6e6862 },
        sunscorched_badlands: { d: 0.4,  grass: [0xc9a95a, 0xb38f45, 0xd2b468], scrub: 0.05, scrubCol: 0x7d7a3a, rock: 0.035, rockCol: 0xa86f45 },
        sunken_coast:         { d: 0.6,  grass: [0xb7b98a, 0x9ea777, 0xc4c497], reed: 0.12, rock: 0.025, rockCol: 0x8f9893 },
        alpine_array:         { d: 0.75, grass: [0x6d8a5a, 0x839d6b], flowers: [0xffffff, 0x9fc6ff, 0xfff1a8], flower: 0.05, rock: 0.03, rockCol: 0x9aa0a6 },
        frostfang_peaks:      { d: 0.5,  grass: [0xdfe8ee, 0xc7d4dc, 0xb9c8d2], rock: 0.03, rockCol: 0xb7c3cc, crystal: 0.008, crystalCols: [0xbfe9ff, 0x9fd8ff] },
        meridian_core:        { d: 0.5,  grass: [0x4d3f5c, 0x5e4b70], crystal: 0.035, crystalCols: [0xb57cff, 0x7c9cff, 0xe07cff], rock: 0.02, rockCol: 0x3f3a48 },
        obsidian_dragonwilds: { d: 0.42, grass: [0x3a2724, 0x4a2a22, 0x2e211e], crystal: 0.03, crystalCols: [0xff6a2a, 0xffa13a], rock: 0.045, rockCol: 0x241c1e }
    };

    /* ------------------------------------------------------------ geometry */
    // aH: 0 at the root, 1 at the tip (drives wind, push and base darkening). aP: 0 blade, 0.5 stem, 1 head.
    function bladeGeo(blades, h, w, lean, opts = {}) {
        const pos = [], nrm = [], aH = [], aP = [], idx = [];
        let v = 0;
        for (let b = 0; b < blades; b++) {
            const ang = (b / blades) * Math.PI + (opts.twist || 0) * b;
            const ca = Math.cos(ang), sa = Math.sin(ang);
            const hh = h * (opts.vary ? 0.75 + 0.5 * ((b * 37) % 7) / 7 : 1);
            const lx = lean * sa, lz = -lean * ca;
            pos.push(-w * ca, 0, -w * sa, w * ca, 0, w * sa,
                -w * 0.45 * ca + lx * 0.5, hh * 0.55, -w * 0.45 * sa + lz * 0.5, w * 0.45 * ca + lx * 0.5, hh * 0.55, w * 0.45 * sa + lz * 0.5,
                lx, hh, lz);
            aH.push(0, 0, 0.55, 0.55, 1);
            for (let k = 0; k < 5; k++) { nrm.push(0, 1, 0); aP.push(opts.head ? 0.5 : 0); }
            idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2, v + 2, v + 3, v + 4);
            v += 5;
        }
        if (opts.head) {
            // Small octahedron head at the top of a central stem.
            const hy = opts.head.y, hr = opts.head.r;
            const verts = [[0, hy + hr, 0], [hr, hy, 0], [0, hy, hr], [-hr, hy, 0], [0, hy, -hr], [0, hy - hr * 0.7, 0]];
            const tris = [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]];
            const base = v;
            for (const p of verts) { pos.push(p[0], p[1], p[2]); nrm.push(0, 1, 0); aH.push(1); aP.push(1); }
            for (const t of tris) idx.push(base + t[0], base + t[1], base + t[2]);
            v += verts.length;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
        g.setAttribute('aH', new THREE.Float32BufferAttribute(aH, 1));
        g.setAttribute('aP', new THREE.Float32BufferAttribute(aP, 1));
        g.setIndex(idx);
        return g;
    }

    function solidGeo(kind) {
        let g;
        if (kind === 'rock') { g = new THREE.DodecahedronGeometry(0.28, 0); g.scale(1.25, 0.62, 1); g.translate(0, 0.07, 0); }
        else if (kind === 'scrub') { g = new THREE.IcosahedronGeometry(0.32, 0); g.scale(1.2, 0.7, 1.2); g.translate(0, 0.16, 0); }
        else { g = new THREE.OctahedronGeometry(0.12, 0); g.scale(0.7, 2.8, 0.7); g.translate(0, 0.3, 0); }
        g = g.toNonIndexed();
        const n = g.attributes.position.count;
        g.setAttribute('aH', new THREE.Float32BufferAttribute(new Float32Array(n).fill(0), 1));
        g.setAttribute('aP', new THREE.Float32BufferAttribute(new Float32Array(n).fill(0), 1));
        g.computeVertexNormals();
        return g;
    }

    /* ------------------------------------------------------------ materials */
    function plantMaterial(U) {
        const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
        m.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, U);
            shader.vertexShader = shader.vertexShader
                .replace('#include <common>', `#include <common>
uniform float uTime; uniform vec3 uPlayer; uniform vec3 uCam; uniform float uFar; uniform float uWind;
attribute float aH; attribute float aP;
varying float vH; varying float vP;`)
                .replace('#include <begin_vertex>', `#include <begin_vertex>
vH = aH; vP = aP;
#ifdef USE_INSTANCING
    vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    float dc = distance(ip.xz, uCam.xz);
    transformed *= 1.0 - smoothstep(uFar * 0.7, uFar, dc);
#endif`)
                .replace('#include <project_vertex>', `
vec4 mvPosition = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
    mvPosition = instanceMatrix * mvPosition;
    float gust = sin(uTime * 1.6 + mvPosition.x * 0.27 + mvPosition.z * 0.19) * 0.65 + sin(uTime * 3.3 + mvPosition.x * 0.83 - mvPosition.z * 0.41) * 0.22 + 0.3;
    float k = aH * aH * uWind;
    mvPosition.x += gust * 0.11 * k;
    mvPosition.z += gust * 0.05 * k;
    vec2 dp = mvPosition.xz - uPlayer.xz;
    float dd = length(dp);
    float push = (1.0 - smoothstep(0.25, 1.35, dd)) * aH * step(abs(mvPosition.y - uPlayer.y), 2.2);
    mvPosition.xz += (dd > 1e-3 ? dp / dd : vec2(0.0)) * push * 0.42;
    mvPosition.y -= push * 0.14;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`);
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>
varying float vH; varying float vP;`)
                .replace('#include <color_fragment>', `#include <color_fragment>
// aP: 0 = blade (instance colour), 0.5 = stem under a head (green), 1 = flower/reed head (instance colour).
float stem = 1.0 - step(0.2, abs(vP - 0.5));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.22, 0.34, 0.15), stem);
diffuseColor.rgb *= mix(0.6, 1.18, vH);`);
        };
        m.customProgramCacheKey = () => 'boOwCover1';
        return m;
    }

    function glowMaterial(U) {
        const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1, flatShading: true });
        m.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, U);
            shader.vertexShader = shader.vertexShader
                .replace('#include <common>', `#include <common>
uniform vec3 uCam; uniform float uFar;`)
                .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
    vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    transformed *= 1.0 - smoothstep(uFar * 0.7, uFar, distance(ip.xz, uCam.xz));
#endif`);
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>
uniform float uTime;`)
                .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += diffuseColor.rgb * (0.85 + 0.25 * sin(uTime * 2.3 + vViewPosition.x * 3.0));`);
        };
        m.customProgramCacheKey = () => 'boOwGlow1';
        return m;
    }

    function solidMaterial(U) {
        const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, flatShading: true });
        m.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, U);
            shader.vertexShader = shader.vertexShader
                .replace('#include <common>', `#include <common>
uniform vec3 uCam; uniform float uFar;`)
                .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
    vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    transformed *= 1.0 - smoothstep(uFar * 0.7, uFar, distance(ip.xz, uCam.xz));
#endif`);
        };
        m.customProgramCacheKey = () => 'boOwSolid1';
        return m;
    }

    /* ------------------------------------------------------------ helpers */
    function hash2(x, z) {
        let h = (x * 374761393 + z * 668265263) | 0;
        h = (h ^ (h >>> 13)) * 1274126177 | 0;
        return (h ^ (h >>> 16)) >>> 0;
    }
    function rngFrom(seed) {
        let s = seed || 1;
        return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }

    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
    const TYPES = ['tuft', 'flower', 'fern', 'reed', 'rock', 'scrub', 'crystal'];
    const LINEAR = !!(THREE.sRGBEncoding && THREE.Color.prototype.convertSRGBToLinear);

    const Cover = {
        id: 'groundCover',
        active: false,
        meshes: {},
        chunks: new Map(),
        wanted: new Set(),
        queue: [],
        dirty: false,
        U: null,
        stats: { chunks: 0, instances: 0, drawCalls: 0 },

        start(s, scene) {
            this.stop();
            const q = (BO.Settings && BO.Settings.get('quality')) || 'high';
            this.radius = RADIUS[q] ?? 60;
            this.density = DENSITY[q] ?? 1;
            if (!this.radius || !scene || !BO.World.terrain) return;
            this.scene = scene;
            this.D = BO.OWRPGWorldData;
            this.U = { uTime: { value: 0 }, uPlayer: { value: new THREE.Vector3() }, uCam: { value: new THREE.Vector3() }, uFar: { value: this.radius }, uWind: { value: 1 } };
            const plant = plantMaterial(this.U), solid = solidMaterial(this.U), glow = glowMaterial(this.U);
            const geos = {
                tuft: bladeGeo(5, 0.4, 0.065, 0.09, { vary: true, twist: 0.35 }),
                flower: bladeGeo(2, 0.26, 0.03, 0.03, { head: { y: 0.34, r: 0.045 } }),
                fern: bladeGeo(6, 0.55, 0.09, 0.32, { vary: true }),
                reed: bladeGeo(3, 1.25, 0.025, 0.08, { vary: true, head: { y: 1.1, r: 0.05 } }),
                rock: solidGeo('rock'), scrub: solidGeo('scrub'), crystal: solidGeo('crystal')
            };
            const capScale = Math.max(0.6, this.density) * (this.radius / 60) * (this.radius / 60);
            for (const t of TYPES) {
                const cap = Math.ceil(CAP[t] * capScale);
                const mat = t === 'rock' || t === 'scrub' ? solid : t === 'crystal' ? glow : plant;
                const im = new THREE.InstancedMesh(geos[t], mat, cap);
                im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                im.setColorAt(0, _c.set(0xffffff));
                im.instanceColor.setUsage(THREE.DynamicDrawUsage);
                im.count = 0;
                im.frustumCulled = false; // instances span the whole radius
                im.castShadow = false;
                im.receiveShadow = true;
                im.name = 'ow-cover-' + t;
                im.userData.noHit = true;
                im.userData.cap = cap;
                im.renderOrder = -1;
                scene.add(im);
                this.meshes[t] = im;
            }
            this._buildBlockers();
            this.active = true;
            this.lastKey = null;
        },

        stop() {
            for (const t in this.meshes) {
                const im = this.meshes[t];
                if (im.parent) im.parent.remove(im);
                im.geometry.dispose();
                im.dispose && im.dispose();
            }
            const mats = new Set(Object.values(this.meshes).map((m) => m.material));
            mats.forEach((m) => m.dispose());
            this.meshes = {};
            this.chunks.clear();
            this.wanted.clear();
            this.queue.length = 0;
            this.active = false;
            this.scene = this.U = this.blockGrid = null;
            this.stats.chunks = this.stats.instances = this.stats.drawCalls = 0;
        },

        // Spatial hash of solid world colliders (buildings, walls, props, big rocks) so plants never poke through floors.
        _buildBlockers() {
            const grid = new Map();
            const cell = 8;
            for (const c of BO.World.colliders || []) {
                if (!c || c.tree || c.active === false) continue;
                if ((c.maxY - c.minY) < 0.25 || (c.maxX - c.minX) > 120 || (c.maxZ - c.minZ) > 120) continue;
                const x0 = Math.floor(c.minX / cell), x1 = Math.floor(c.maxX / cell), z0 = Math.floor(c.minZ / cell), z1 = Math.floor(c.maxZ / cell);
                for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
                    const k = x * 100003 + z;
                    let l = grid.get(k);
                    if (!l) { l = []; grid.set(k, l); }
                    l.push(c);
                }
            }
            this.blockGrid = grid;
            this.blockCell = cell;
            const settle = (this.D.POIS || []).filter((p) => p.safe || p.kind === 'settlement');
            this.settlements = settle.map((p) => ({ x: p.x, z: p.z, r: p.r * 0.95 }));
        },

        _blocked(x, z, y) {
            const cell = this.blockCell;
            const l = this.blockGrid.get(Math.floor(x / cell) * 100003 + Math.floor(z / cell));
            if (l) for (let i = 0; i < l.length; i++) {
                const c = l[i];
                if (x > c.minX - 0.35 && x < c.maxX + 0.35 && z > c.minZ - 0.35 && z < c.maxZ + 0.35 && y < c.maxY + 0.2 && y > c.minY - 2) return true;
            }
            for (const s of this.settlements) if (Math.hypot(x - s.x, z - s.z) < s.r) return true;
            return false;
        },

        _genChunk(cx, cz) {
            const D = this.D, T = BO.World.terrain;
            const rnd = rngFrom(hash2(cx, cz) ^ 0x9e3779b9);
            const out = {};
            for (const t of TYPES) out[t] = { m: [], c: [] };
            const add = (type, x, y, z, rotY, sx, sy, sz, tiltX, tiltZ, col) => {
                _e.set(tiltX, rotY, tiltZ);
                _q.setFromEuler(_e);
                _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
                const o = out[type];
                for (let i = 0; i < 16; i++) o.m.push(_m.elements[i]);
                _c.setHex(col);
                if (LINEAR) _c.convertSRGBToLinear(); // renderer outputs sRGB: palette hexes are authored in sRGB
                o.c.push(_c.r, _c.g, _c.b);
            };
            const x0 = cx * CHUNK, z0 = cz * CHUNK;
            const regCenter = D.regionAt(x0 + CHUNK / 2, z0 + CHUNK / 2);
            const bio0 = BIOMES[regCenter.id] || BIOMES.haven_basin;
            const n = Math.round(CHUNK * CHUNK * 1.8 * bio0.d * this.density);
            const water = D.WATER;
            for (let i = 0; i < n; i++) {
                const x = x0 + rnd() * CHUNK, z = z0 + rnd() * CHUNK;
                if (D.isInterior(x, z)) continue;
                const reg = i % 6 === 0 ? D.regionAt(x, z) : regCenter; // re-sample often enough to blend at borders
                const bio = BIOMES[reg.id] || BIOMES.haven_basin;
                if (rnd() > bio.d / bio0.d + 0.05) continue;
                const y = T.height(x, z);
                const nearWater = y < water + 0.7;
                if (y < water + 0.1 && !(bio.reed && y > water - 0.35)) continue;
                const slope = T.slope ? T.slope(x, z) : 0;
                if (slope > 0.85) continue;
                const road = D.roadInfo(x, z);
                if (road && road.d < road.road.w * 0.5 + 0.9) continue;
                if (D.railDist(x, z) < 2.8) continue;
                if (this._blocked(x, z, y)) continue;
                // Gentle tilt toward the slope so tufts sit on hillsides instead of standing plumb.
                let tx = 0, tz = 0;
                if (slope > 0.08) {
                    const hx = T.height(x + 0.6, z) - T.height(x - 0.6, z), hz = T.height(x, z + 0.6) - T.height(x, z - 0.6);
                    tx = Math.atan2(hz, 1.2) * 0.6; tz = -Math.atan2(hx, 1.2) * 0.6;
                }
                const rot = rnd() * Math.PI * 2;
                const roll = rnd();
                const gcol = bio.grass[Math.floor(rnd() * bio.grass.length)];
                if (bio.reed && nearWater && roll < bio.reed) {
                    const s = 0.8 + rnd() * 0.6;
                    add('reed', x, y - 0.05, z, rot, s, s * (0.8 + rnd() * 0.5), s, tx, tz, 0x4a3324);
                    continue;
                }
                let acc = 0;
                if (bio.flower && roll < (acc += bio.flower)) {
                    const s = 0.8 + rnd() * 0.5;
                    add('flower', x, y, z, rot, s, s, s, tx, tz, bio.flowers[Math.floor(rnd() * bio.flowers.length)]);
                    continue;
                }
                if (bio.fern && roll < (acc += bio.fern)) {
                    const s = 0.7 + rnd() * 0.7;
                    add('fern', x, y, z, rot, s, s * 0.9, s, tx, tz, gcol);
                    continue;
                }
                if (bio.rock && roll < (acc += bio.rock)) {
                    const s = 0.5 + Math.pow(rnd(), 2) * 1.6;
                    add('rock', x, y - 0.03 * s, z, rot, s, s * (0.7 + rnd() * 0.6), s * (0.8 + rnd() * 0.4), rnd() * 0.3, rnd() * 0.3, bio.rockCol);
                    continue;
                }
                if (bio.scrub && roll < (acc += bio.scrub)) {
                    const s = 0.7 + rnd() * 0.9;
                    add('scrub', x, y, z, rot, s, s * (0.7 + rnd() * 0.5), s, 0, 0, bio.scrubCol);
                    continue;
                }
                if (bio.crystal && roll < (acc += bio.crystal)) {
                    const s = 0.6 + rnd() * 1.4;
                    add('crystal', x, y - 0.05, z, rot, s, s * (0.8 + rnd() * 0.8), s, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5, bio.crystalCols[Math.floor(rnd() * bio.crystalCols.length)]);
                    continue;
                }
                if (bio.heather && roll < (acc += bio.heather)) {
                    const s = 0.75 + rnd() * 0.4;
                    add('tuft', x, y, z, rot, s * 1.3, s * 0.62, s * 1.3, tx, tz, bio.heatherCols[Math.floor(rnd() * bio.heatherCols.length)]);
                    continue;
                }
                const s = 0.75 + rnd() * 0.7;
                add('tuft', x, y, z, rot, s, s * (0.75 + rnd() * 0.55), s, tx, tz, gcol);
            }
            const chunk = { key: cx + ',' + cz, cx, cz, types: {} };
            for (const t of TYPES) chunk.types[t] = { m: new Float32Array(out[t].m), c: new Float32Array(out[t].c) };
            return chunk;
        },

        _repack() {
            let total = 0;
            for (const t of TYPES) {
                const im = this.meshes[t];
                if (!im) continue;
                const cap = im.userData.cap;
                const M = im.instanceMatrix.array, C = im.instanceColor.array;
                let n = 0;
                for (const key of this.wanted) {
                    const ch = this.chunks.get(key);
                    if (!ch) continue;
                    const tt = ch.types[t];
                    const cnt = tt.m.length / 16;
                    if (!cnt) continue;
                    const take = Math.min(cnt, cap - n);
                    if (take <= 0) break;
                    M.set(take === cnt ? tt.m : tt.m.subarray(0, take * 16), n * 16);
                    C.set(take === cnt ? tt.c : tt.c.subarray(0, take * 3), n * 3);
                    n += take;
                }
                im.count = n;
                if (n) {
                    // r149 resets count after upload. Only the populated prefix changed.
                    im.instanceMatrix.updateRange.count = n * 16;
                    im.instanceColor.updateRange.count = n * 3;
                    im.instanceMatrix.needsUpdate = im.instanceColor.needsUpdate = true;
                }
                im.visible = n > 0;
                total += n;
            }
            this.stats.instances = total;
            this.stats.chunks = this.wanted.size;
            this.stats.drawCalls = TYPES.filter((t) => this.meshes[t] && this.meshes[t].visible).length;
            this.dirty = false;
        },

        update(dt) {
            if (!this.active) return;
            const P = BO.Player, cam = BO.App && BO.App.worldCamera;
            const U = this.U;
            U.uTime.value += dt;
            U.uPlayer.value.copy(P.pos);
            if (cam) U.uCam.value.copy(cam.position);
            const inside = this.D.isInterior(P.pos.x, P.pos.z);
            for (const t in this.meshes) this.meshes[t].visible = !inside && this.meshes[t].count > 0;
            if (inside) return;
            // Weather sways harder in storms (OWRPGWorldArt sets world weather).
            const w = BO.World.weather;
            U.uWind.value = w && /storm|rain|snow|ash/.test(String(w.kind || w)) ? 1.8 : 1.0;
            const pcx = Math.floor(P.pos.x / CHUNK), pcz = Math.floor(P.pos.z / CHUNK);
            const key = pcx + ',' + pcz;
            if (key !== this.lastKey) {
                this.lastKey = key;
                const R = this.radius, rc = Math.ceil(R / CHUNK) + 1;
                const want = [];
                for (let dz = -rc; dz <= rc; dz++) for (let dx = -rc; dx <= rc; dx++) {
                    const cx = pcx + dx, cz = pcz + dz;
                    const ccx = (cx + 0.5) * CHUNK, ccz = (cz + 0.5) * CHUNK;
                    const d = Math.hypot(ccx - P.pos.x, ccz - P.pos.z);
                    if (d - CHUNK * 0.71 > R) continue;
                    want.push({ k: cx + ',' + cz, cx, cz, d });
                }
                want.sort((a, b) => a.d - b.d);
                this.wanted = new Set(want.map((w2) => w2.k));
                this.queue = want.filter((w2) => !this.chunks.has(w2.k));
                // Forget far chunks (keep a ring for quick turnarounds).
                if (this.chunks.size > this.wanted.size + 80) {
                    for (const [k, ch] of this.chunks) {
                        if (this.wanted.has(k)) continue;
                        if (Math.hypot((ch.cx + 0.5) * CHUNK - P.pos.x, (ch.cz + 0.5) * CHUNK - P.pos.z) > R + CHUNK * 6) this.chunks.delete(k);
                    }
                }
                this.dirty = true;
            }
            // Generate nearest-first inside a ~2.5 ms frame budget (always at least one chunk).
            const t0 = performance.now();
            for (let i = 0; this.queue.length && (i === 0 || performance.now() - t0 < 2.5); i++) {
                const q = this.queue.shift();
                if (!this.wanted.has(q.k) || this.chunks.has(q.k)) continue;
                this.chunks.set(q.k, this._genChunk(q.cx, q.cz));
                this.dirty = true;
            }
            if (this.dirty) this._repack();
        }
    };

    BO.OWRPGGroundCover = Cover;
    if (BO.OWRPGMode) BO.OWRPGMode.registerSystem(Cover);
})(window.BO);
