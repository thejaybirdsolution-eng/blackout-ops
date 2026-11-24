/* ============================================================================
   BLACKOUT OPS — Large-world engine core
   · TrackedArray: arrays that report push/splice so spatial indexes stay fresh
   · SpatialGrid: uniform 2D hash for colliders and meshes (O(1) local queries)
   · Terrain: 1 m heightfield with chunked LOD meshes, bilinear height, slope,
     analytic normals, ray marching and carve volumes for underground spaces
   · NavGrid: 2 m walkability grid with binary-heap A*, line-of-sight path
     smoothing, dynamic rebuilds when structures appear or vanish, and
     Dijkstra flow fields for hordes
   · BoxBatcher: merges static boxes into one mesh per material per chunk
============================================================================ */
(function (BO) {
    'use strict';

    /* ------------------------------------------------------------------ arrays */
    class TrackedArray extends Array {
        static get [Symbol.species]() { return Array; }
        push(...items) {
            const n = super.push(...items);
            if (this.onAdd) for (const it of items) this.onAdd(it);
            return n;
        }
        splice(...args) {
            const removed = super.splice(...args);
            if (this.onRemove) for (const it of removed) this.onRemove(it);
            if (this.onAdd && args.length > 2) for (const it of args.slice(2)) this.onAdd(it);
            return removed;
        }
    }

    /* ------------------------------------------------------------------ grid */
    class SpatialGrid {
        constructor(cell = 8) {
            this.cell = cell;
            this.map = new Map();
            this.stamp = 1;
        }
        key(ix, iz) { return ix * 73856093 ^ iz * 19349663; }
        cellsFor(minX, minZ, maxX, maxZ, fn) {
            const c = this.cell;
            const x0 = Math.floor(minX / c), x1 = Math.floor(maxX / c);
            const z0 = Math.floor(minZ / c), z1 = Math.floor(maxZ / c);
            for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) fn(this.key(ix, iz));
        }
        insert(item, minX, minZ, maxX, maxZ) {
            item._gridBounds = [minX, minZ, maxX, maxZ];
            this.cellsFor(minX, minZ, maxX, maxZ, (k) => {
                let list = this.map.get(k);
                if (!list) this.map.set(k, list = []);
                list.push(item);
            });
        }
        remove(item) {
            const b = item._gridBounds;
            if (!b) return;
            this.cellsFor(b[0], b[1], b[2], b[3], (k) => {
                const list = this.map.get(k);
                if (!list) return;
                const i = list.indexOf(item);
                if (i >= 0) list.splice(i, 1);
            });
            item._gridBounds = null;
        }
        /** Calls fn once per item overlapping the rectangle. Return true from fn to stop. */
        query(minX, minZ, maxX, maxZ, fn) {
            const s = ++this.stamp;
            const c = this.cell;
            const x0 = Math.floor(minX / c), x1 = Math.floor(maxX / c);
            const z0 = Math.floor(minZ / c), z1 = Math.floor(maxZ / c);
            for (let ix = x0; ix <= x1; ix++) {
                for (let iz = z0; iz <= z1; iz++) {
                    const list = this.map.get(this.key(ix, iz));
                    if (!list) continue;
                    for (let i = 0; i < list.length; i++) {
                        const it = list[i];
                        if (it._gridStamp === s) continue;
                        it._gridStamp = s;
                        if (fn(it)) return;
                    }
                }
            }
        }
        /** Items in the cells a 2D segment passes through (DDA). */
        queryRay(ox, oz, dx, dz, dist, fn) {
            const s = ++this.stamp;
            const c = this.cell;
            let ix = Math.floor(ox / c), iz = Math.floor(oz / c);
            const stepX = dx > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
            const tDeltaX = dx !== 0 ? Math.abs(c / dx) : Infinity;
            const tDeltaZ = dz !== 0 ? Math.abs(c / dz) : Infinity;
            let tMaxX = dx !== 0 ? ((dx > 0 ? (ix + 1) * c - ox : ox - ix * c) / Math.abs(dx)) : Infinity;
            let tMaxZ = dz !== 0 ? ((dz > 0 ? (iz + 1) * c - oz : oz - iz * c) / Math.abs(dz)) : Infinity;
            let t = 0;
            let guard = 0;
            while (t <= dist && guard++ < 512) {
                const list = this.map.get(this.key(ix, iz));
                if (list) {
                    for (let i = 0; i < list.length; i++) {
                        const it = list[i];
                        if (it._gridStamp === s) continue;
                        it._gridStamp = s;
                        if (fn(it)) return;
                    }
                }
                if (tMaxX < tMaxZ) { t = tMaxX; tMaxX += tDeltaX; ix += stepX; }
                else { t = tMaxZ; tMaxZ += tDeltaZ; iz += stepZ; }
            }
        }
    }

    /* ------------------------------------------------------------------ noise */
    function hash2(x, z, seed) {
        let h = (x * 374761393 + z * 668265263 + seed * 2246822519) | 0;
        h = (h ^ (h >>> 13)) * 1274126177 | 0;
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    }
    function valueNoise(x, z, seed) {
        const x0 = Math.floor(x), z0 = Math.floor(z);
        const fx = x - x0, fz = z - z0;
        const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
        const a = hash2(x0, z0, seed), b = hash2(x0 + 1, z0, seed);
        const c = hash2(x0, z0 + 1, seed), d = hash2(x0 + 1, z0 + 1, seed);
        return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sz;
    }
    function fbm(x, z, seed, octaves = 4) {
        let amp = 1, freq = 1, sum = 0, norm = 0;
        for (let i = 0; i < octaves; i++) {
            sum += (valueNoise(x * freq, z * freq, seed + i * 17) * 2 - 1) * amp;
            norm += amp;
            amp *= 0.5;
            freq *= 2.03;
        }
        return sum / norm;
    }
    function ridged(x, z, seed, octaves = 4) {
        let amp = 1, freq = 1, sum = 0, norm = 0;
        for (let i = 0; i < octaves; i++) {
            const n = 1 - Math.abs(valueNoise(x * freq, z * freq, seed + i * 31) * 2 - 1);
            sum += n * n * amp;
            norm += amp;
            amp *= 0.5;
            freq *= 2.1;
        }
        return sum / norm;
    }

    /* ------------------------------------------------------------------ terrain */
    class Terrain {
        /**
         * def: { minX, maxX, minZ, maxZ, res, chunk, height(x,z), color(x,z,h,slope) -> [r,g,b], waterLevel }
         */
        constructor(def) {
            this.def = def;
            this.minX = def.minX; this.maxX = def.maxX;
            this.minZ = def.minZ; this.maxZ = def.maxZ;
            this.res = def.res || 1;
            this.nx = Math.round((this.maxX - this.minX) / this.res) + 1;
            this.nz = Math.round((this.maxZ - this.minZ) / this.res) + 1;
            this.h = new Float32Array(this.nx * this.nz);
            this.carves = [];
            this.chunks = [];
            for (let iz = 0; iz < this.nz; iz++) {
                const z = this.minZ + iz * this.res;
                for (let ix = 0; ix < this.nx; ix++) {
                    this.h[iz * this.nx + ix] = def.height(this.minX + ix * this.res, z);
                }
            }
        }

        inside(x, z) { return x >= this.minX && x <= this.maxX && z >= this.minZ && z <= this.maxZ; }

        sample(ix, iz) {
            ix = ix < 0 ? 0 : ix >= this.nx ? this.nx - 1 : ix;
            iz = iz < 0 ? 0 : iz >= this.nz ? this.nz - 1 : iz;
            return this.h[iz * this.nx + ix];
        }

        height(x, z) {
            const gx = (x - this.minX) / this.res;
            const gz = (z - this.minZ) / this.res;
            const ix = Math.floor(gx), iz = Math.floor(gz);
            const fx = gx - ix, fz = gz - iz;
            const a = this.sample(ix, iz), b = this.sample(ix + 1, iz);
            const c = this.sample(ix, iz + 1), d = this.sample(ix + 1, iz + 1);
            // Match the triangle split used by the mesh so feet sit exactly on the surface.
            if (fx + fz <= 1) return a + (b - a) * fx + (c - a) * fz;
            return d + (c - d) * (1 - fx) + (b - d) * (1 - fz);
        }

        gradient(x, z) {
            const e = this.res;
            return [(this.height(x + e, z) - this.height(x - e, z)) / (2 * e), (this.height(x, z + e) - this.height(x, z - e)) / (2 * e)];
        }

        slope(x, z) {
            const [gx, gz] = this.gradient(x, z);
            return Math.hypot(gx, gz);
        }

        normal(x, z) {
            const [gx, gz] = this.gradient(x, z);
            return new THREE.Vector3(-gx, 1, -gz).normalize();
        }

        /** Underground volumes where the surface does not collide (tunnels, cellars, mine shafts). */
        addCarve(minX, minY, minZ, maxX, maxY, maxZ) { this.carves.push({ minX, minY, minZ, maxX, maxY, maxZ }); }

        carved(x, y, z) {
            for (let i = 0; i < this.carves.length; i++) {
                const c = this.carves[i];
                if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ && y >= c.minY && y <= c.maxY) return true;
            }
            return false;
        }

        /** Ray-march the heightfield. Returns { point, distance, normal } or null. */
        ray(origin, dir, maxDist) {
            let step = 0.75;
            let prevT = 0;
            let prevAbove = origin.y - this.height(origin.x, origin.z);
            if (prevAbove < 0 && !this.carved(origin.x, origin.y, origin.z)) prevAbove = 0.01;
            for (let t = step; t <= maxDist; t += step) {
                const x = origin.x + dir.x * t, y = origin.y + dir.y * t, z = origin.z + dir.z * t;
                if (!this.inside(x, z)) return null;
                const above = y - this.height(x, z);
                if (above < 0 && !this.carved(x, y, z)) {
                    let lo = prevT, hi = t;
                    for (let i = 0; i < 8; i++) {
                        const mid = (lo + hi) * 0.5;
                        const my = origin.y + dir.y * mid;
                        if (my - this.height(origin.x + dir.x * mid, origin.z + dir.z * mid) < 0) hi = mid; else lo = mid;
                    }
                    const p = new THREE.Vector3(origin.x + dir.x * hi, origin.y + dir.y * hi, origin.z + dir.z * hi);
                    return { point: p, distance: hi, normal: this.normal(p.x, p.z) };
                }
                prevT = t;
                prevAbove = above;
                if (t > 30) step = 1.5;
            }
            return null;
        }

        /** Builds two LOD meshes per chunk. Returns the chunk list. */
        buildMeshes(scene, material) {
            const size = this.def.chunk || 64;
            for (let cz = this.minZ; cz < this.maxZ; cz += size) {
                for (let cx = this.minX; cx < this.maxX; cx += size) {
                    const w = Math.min(size, this.maxX - cx), d = Math.min(size, this.maxZ - cz);
                    const near = this._chunkMesh(cx, cz, w, d, this.res, material);
                    const far = this._chunkMesh(cx, cz, w, d, Math.max(this.res * 4, 4), material);
                    near.receiveShadow = true;
                    far.receiveShadow = true;
                    far.visible = false;
                    near.userData.terrain = true;
                    far.userData.terrain = true;
                    scene.add(near, far);
                    this.chunks.push({ x: cx + w / 2, z: cz + d / 2, near, far });
                }
            }
            return this.chunks;
        }

        _chunkMesh(x0, z0, w, d, step, material) {
            const sx = Math.round(w / step), sz = Math.round(d / step);
            const verts = (sx + 1) * (sz + 1);
            const pos = new Float32Array(verts * 3);
            const nor = new Float32Array(verts * 3);
            const col = new Float32Array(verts * 3);
            const uv = new Float32Array(verts * 2);
            let p = 0, q = 0;
            for (let iz = 0; iz <= sz; iz++) {
                for (let ix = 0; ix <= sx; ix++) {
                    const x = x0 + Math.min(w, ix * step), z = z0 + Math.min(d, iz * step);
                    const h = this.height(x, z);
                    const n = this.normal(x, z);
                    const s = Math.hypot(n.x, n.z) / Math.max(0.05, n.y);
                    const c = this.def.color(x, z, h, s);
                    pos[p] = x; pos[p + 1] = h; pos[p + 2] = z;
                    nor[p] = n.x; nor[p + 1] = n.y; nor[p + 2] = n.z;
                    col[p] = c[0]; col[p + 1] = c[1]; col[p + 2] = c[2];
                    uv[q] = x / 7; uv[q + 1] = z / 7;
                    p += 3; q += 2;
                }
            }
            const idx = new (verts > 65535 ? Uint32Array : Uint16Array)(sx * sz * 6);
            let k = 0;
            for (let iz = 0; iz < sz; iz++) {
                for (let ix = 0; ix < sx; ix++) {
                    const a = iz * (sx + 1) + ix, b = a + 1, c = a + (sx + 1), dd = c + 1;
                    idx[k++] = a; idx[k++] = c; idx[k++] = b;
                    idx[k++] = b; idx[k++] = c; idx[k++] = dd;
                }
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
            g.setAttribute('color', new THREE.BufferAttribute(col, 3));
            g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
            g.setIndex(new THREE.BufferAttribute(idx, 1));
            g.computeBoundingSphere();
            g.computeBoundingBox();
            return new THREE.Mesh(g, material);
        }

        /** Swap chunk LODs around the viewer. */
        updateLOD(px, pz, nearDist = 130) {
            const nd2 = nearDist * nearDist;
            for (const c of this.chunks) {
                const dx = c.x - px, dz = c.z - pz;
                const near = dx * dx + dz * dz < nd2;
                c.near.visible = near;
                c.far.visible = !near;
            }
        }

        dispose() {
            for (const c of this.chunks) {
                c.near.removeFromParent(); c.far.removeFromParent();
                c.near.geometry.dispose(); c.far.geometry.dispose();
            }
            this.chunks = [];
        }
    }

    /* ------------------------------------------------------------------ nav */
    class MinHeap {
        constructor() { this.k = []; this.v = []; }
        get size() { return this.k.length; }
        push(key, val) {
            const k = this.k, v = this.v;
            let i = k.length;
            k.push(key); v.push(val);
            while (i > 0) {
                const p = (i - 1) >> 1;
                if (v[p] <= val) break;
                k[i] = k[p]; v[i] = v[p];
                i = p;
            }
            k[i] = key; v[i] = val;
        }
        pop() {
            const k = this.k, v = this.v;
            const top = k[0];
            const lk = k.pop(), lv = v.pop();
            if (k.length) {
                let i = 0;
                const n = k.length;
                while (true) {
                    let c = i * 2 + 1;
                    if (c >= n) break;
                    if (c + 1 < n && v[c + 1] < v[c]) c++;
                    if (v[c] >= lv) break;
                    k[i] = k[c]; v[i] = v[c];
                    i = c;
                }
                k[i] = lk; v[i] = lv;
            }
            return top;
        }
    }

    class NavGrid {
        /** world: the WorldBuilder (for colliders); terrain: Terrain */
        constructor(world, terrain, cell = 2) {
            this.world = world;
            this.terrain = terrain;
            this.cell = cell;
            this.minX = terrain.minX; this.minZ = terrain.minZ;
            this.nx = Math.floor((terrain.maxX - terrain.minX) / cell);
            this.nz = Math.floor((terrain.maxZ - terrain.minZ) / cell);
            this.n = this.nx * this.nz;
            this.walk = new Uint8Array(this.n);   // 0 blocked, 1 walkable
            this.soft = new Uint8Array(this.n);   // 1 = blocked only by breakable player structures
            this.y = new Float32Array(this.n);
            this.g = new Float32Array(this.n);
            this.parent = new Int32Array(this.n);
            this.seen = new Uint32Array(this.n);
            this.closed = new Uint32Array(this.n);
            this.gen = 1;
            this.cache = new Map();
            this.flows = new Map();
            this.version = 1;
        }

        idx(x, z) {
            const ix = Math.floor((x - this.minX) / this.cell), iz = Math.floor((z - this.minZ) / this.cell);
            if (ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz) return -1;
            return iz * this.nx + ix;
        }
        cx(i) { return this.minX + ((i % this.nx) + 0.5) * this.cell; }
        cz(i) { return this.minZ + (Math.floor(i / this.nx) + 0.5) * this.cell; }

        rebuild() {
            for (let i = 0; i < this.n; i++) this._evalCell(i);
            this.version++;
            this.cache.clear();
            this.flows.clear();
        }

        /** Re-evaluate cells inside a box (after building/destroying). */
        rebuildArea(minX, minZ, maxX, maxZ) {
            const c = this.cell;
            const x0 = Math.max(0, Math.floor((minX - this.minX) / c) - 1), x1 = Math.min(this.nx - 1, Math.floor((maxX - this.minX) / c) + 1);
            const z0 = Math.max(0, Math.floor((minZ - this.minZ) / c) - 1), z1 = Math.min(this.nz - 1, Math.floor((maxZ - this.minZ) / c) + 1);
            for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) this._evalCell(iz * this.nx + ix);
            this.version++;
            this.cache.clear();
            this.flows.clear();
        }

        _evalCell(i) {
            const x = this.cx(i), z = this.cz(i);
            const t = this.terrain;
            const h = t.height(x, z);
            const floor = this.world.getGroundHeight(x, z, h + 0.6);
            this.y[i] = floor;
            const water = t.def.isWater ? t.def.isWater(x, z, floor) : (t.def.waterLevel != null && floor < t.def.waterLevel - 1.1);
            this.soft[i] = 0;
            if (water || t.slope(x, z) > 1.05) { this.walk[i] = 0; return; }
            let hard = false, soft = false;
            const r = this.cell * 0.22;
            // Ground under player floors counts from the terrain so a raised foundation reads as a soft obstacle.
            this.world.queryColliders(x - r, z - r, x + r, z + r, (col) => {
                if (!col.active || col.navIgnore) return false;
                if (col.maxY > floor + 0.5 && col.minY < floor + 1.7) {
                    if (col.structure) soft = true; else { hard = true; return true; }
                }
                return false;
            });
            this.walk[i] = hard || soft ? 0 : 1;
            this.soft[i] = !hard && soft ? 1 : 0;
        }

        nearestWalkable(i, maxRing = 6) {
            if (i < 0) return -1;
            if (this.walk[i]) return i;
            const ix0 = i % this.nx, iz0 = Math.floor(i / this.nx);
            for (let r = 1; r <= maxRing; r++) {
                for (let dz = -r; dz <= r; dz++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
                        const ix = ix0 + dx, iz = iz0 + dz;
                        if (ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz) continue;
                        const j = iz * this.nx + ix;
                        if (this.walk[j]) return j;
                    }
                }
            }
            return -1;
        }

        _passable(a, b) {
            if (!this.walk[b]) return false;
            return Math.abs(this.y[a] - this.y[b]) < 1.2;
        }

        /** Grid line-of-walk between two cells (Bresenham). */
        clearLine(a, b) {
            let x0 = a % this.nx, z0 = Math.floor(a / this.nx);
            const x1 = b % this.nx, z1 = Math.floor(b / this.nx);
            const dx = Math.abs(x1 - x0), dz = Math.abs(z1 - z0);
            const sx = x0 < x1 ? 1 : -1, sz = z0 < z1 ? 1 : -1;
            let err = dx - dz;
            let prev = a;
            let guard = 0;
            while (guard++ < 400) {
                const cur = z0 * this.nx + x0;
                if (!this._passable(prev, cur)) return false;
                prev = cur;
                if (x0 === x1 && z0 === z1) return true;
                const e2 = err * 2;
                if (e2 > -dz) { err -= dz; x0 += sx; }
                if (e2 < dx) { err += dx; z0 += sz; }
            }
            return false;
        }

        findPath(sx, sz, gx, gz, maxExpand = 7000) {
            let s = this.nearestWalkable(this.idx(sx, sz));
            let g = this.nearestWalkable(this.idx(gx, gz));
            if (s < 0 || g < 0) return null;
            const key = s + ':' + g;
            const hit = this.cache.get(key);
            if (hit && hit.v === this.version && performance.now() - hit.t < 700) return hit.path.map((p) => ({ ...p }));
            if (s === g) return [{ x: gx, y: this.y[g], z: gz }];
            const gen = ++this.gen;
            const nx = this.nx;
            const gxI = g % nx, gzI = Math.floor(g / nx);
            const heur = (i) => {
                const dx = Math.abs((i % nx) - gxI), dz = Math.abs(Math.floor(i / nx) - gzI);
                return (dx + dz + (1.4142 - 2) * Math.min(dx, dz));
            };
            const heap = new MinHeap();
            this.g[s] = 0; this.seen[s] = gen; this.parent[s] = -1;
            heap.push(s, heur(s));
            let best = s, bestH = heur(s);
            let expanded = 0;
            const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
            while (heap.size && expanded < maxExpand) {
                const cur = heap.pop();
                if (this.closed[cur] === gen) continue;
                this.closed[cur] = gen;
                expanded++;
                if (cur === g) { best = g; break; }
                const h = heur(cur);
                if (h < bestH) { bestH = h; best = cur; }
                const cx = cur % nx, cz = Math.floor(cur / nx);
                for (const [dx, dz, cost] of dirs) {
                    const x = cx + dx, z = cz + dz;
                    if (x < 0 || z < 0 || x >= nx || z >= this.nz) continue;
                    const nb = z * nx + x;
                    if (this.closed[nb] === gen || !this._passable(cur, nb)) continue;
                    if (dx && dz && (!this.walk[cz * nx + x] || !this.walk[z * nx + cx])) continue;
                    const ng = this.g[cur] + cost + Math.abs(this.y[nb] - this.y[cur]) * 0.6;
                    if (this.seen[nb] !== gen || ng < this.g[nb]) {
                        this.seen[nb] = gen;
                        this.g[nb] = ng;
                        this.parent[nb] = cur;
                        heap.push(nb, ng + heur(nb));
                    }
                }
            }
            // Walk back from the goal (or the closest reachable cell), then string-pull.
            const raw = [];
            for (let c = best, guard = 0; c !== -1 && guard < 5000; c = this.parent[c], guard++) raw.push(c);
            raw.reverse();
            const smooth = [];
            let anchor = 0;
            for (let i = 2; i < raw.length; i++) {
                if (!this.clearLine(raw[anchor], raw[i])) {
                    smooth.push(raw[i - 1]);
                    anchor = i - 1;
                }
            }
            if (raw.length > 1) smooth.push(raw[raw.length - 1]);
            const path = smooth.map((c) => ({ x: this.cx(c), y: this.y[c], z: this.cz(c) }));
            if (best === g) path.push({ x: gx, y: this.y[g], z: gz });
            this.cache.set(key, { path, v: this.version, t: performance.now() });
            if (this.cache.size > 400) this.cache.delete(this.cache.keys().next().value);
            return path.map((p) => ({ ...p }));
        }

        /** Dijkstra flow field toward (tx,tz) within `radius` metres; shared by every horde member. */
        flowTo(tx, tz, radius = 90, breach = false) {
            // A breaching field may start inside an enclosed base and pass through player structures at a cost.
            let target = this.idx(tx, tz);
            if (!(breach && target >= 0 && (this.walk[target] || this.soft[target]))) target = this.nearestWalkable(target);
            if (target < 0) return null;
            const key = target + (breach ? ':b' : '');
            const cached = this.flows.get(key);
            if (cached && cached.v === this.version && performance.now() - cached.t < 900) return cached;
            const dist = new Float32Array(this.n).fill(Infinity);
            const heap = new MinHeap();
            const nx = this.nx;
            const r = Math.ceil(radius / this.cell);
            const tX = target % nx, tZ = Math.floor(target / nx);
            dist[target] = 0;
            heap.push(target, 0);
            while (heap.size) {
                const cur = heap.pop();
                const cx = cur % nx, cz = Math.floor(cur / nx);
                const dCur = dist[cur];
                for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
                    if (!dx && !dz) continue;
                    const x = cx + dx, z = cz + dz;
                    if (x < 0 || z < 0 || x >= nx || z >= this.nz || Math.abs(x - tX) > r || Math.abs(z - tZ) > r) continue;
                    const nb = z * nx + x;
                    const softHop = breach && this.soft[nb] && Math.abs(this.y[cur] - this.y[nb]) < 1.6;
                    if (!softHop && !this._passable(cur, nb)) continue;
                    const okC = (j) => this.walk[j] || (breach && this.soft[j]);
                    if (dx && dz && (!okC(cz * nx + x) || !okC(z * nx + cx))) continue;
                    const nd = dCur + (dx && dz ? 1.4142 : 1) + (softHop ? 9 : 0);
                    if (nd < dist[nb]) { dist[nb] = nd; heap.push(nb, nd); }
                }
            }
            const field = { dist, target, v: this.version, t: performance.now() };
            this.flows.set(key, field);
            if (this.flows.size > 6) this.flows.delete(this.flows.keys().next().value);
            return field;
        }

        /** Next waypoint downhill on a flow field (a few cells ahead). */
        flowStep(field, x, z, lookahead = 3) {
            let i = this.idx(x, z);
            if (i < 0 || !field || !isFinite(field.dist[i])) return null;
            const nx = this.nx;
            for (let s = 0; s < lookahead; s++) {
                const cx = i % nx, cz = Math.floor(i / nx);
                let best = i, bd = field.dist[i];
                for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
                    const xx = cx + dx, zz = cz + dz;
                    if (xx < 0 || zz < 0 || xx >= nx || zz >= this.nz) continue;
                    const j = zz * nx + xx;
                    if (field.dist[j] < bd) { bd = field.dist[j]; best = j; }
                }
                if (best === i) break;
                i = best;
            }
            return { x: this.cx(i), y: this.y[i], z: this.cz(i) };
        }
    }

    /* ------------------------------------------------------------------ batching */
    /** Accumulates axis-aligned boxes per material key and emits merged meshes. */
    class BoxBatcher {
        constructor() { this.groups = new Map(); }
        add(matKey, x, y, z, w, h, d, uvScale = 4) {
            let g = this.groups.get(matKey);
            if (!g) this.groups.set(matKey, g = { pos: [], nor: [], uv: [], idx: [], uvScale });
            const hx = w / 2, hy = h / 2, hz = d / 2;
            const faces = [
                [[1, 0, 0], [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], 'zy'],
                [[-1, 0, 0], [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], 'zy'],
                [[0, 1, 0], [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], 'xz'],
                [[0, -1, 0], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], 'xz'],
                [[0, 0, 1], [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], 'xy'],
                [[0, 0, -1], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], 'xy']
            ];
            const s = g.uvScale;
            for (const [n, corners, plane] of faces) {
                const base = g.pos.length / 3;
                for (const [cx, cy, cz] of corners) {
                    const wx = x + cx, wy = y + cy, wz = z + cz;
                    g.pos.push(wx, wy, wz);
                    g.nor.push(n[0], n[1], n[2]);
                    if (plane === 'xz') g.uv.push(wx / s, wz / s);
                    else if (plane === 'zy') g.uv.push(wz / s, wy / s);
                    else g.uv.push(wx / s, wy / s);
                }
                g.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
            }
        }
        /** materialFor(key) -> THREE.Material. Returns the created meshes. */
        build(scene, materialFor) {
            const meshes = [];
            for (const [key, g] of this.groups) {
                if (!g.idx.length) continue;
                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3));
                geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.nor, 3));
                geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uv, 2));
                geo.setIndex(g.pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(g.idx, 1) : new THREE.Uint16BufferAttribute(g.idx, 1));
                geo.computeBoundingSphere();
                geo.computeBoundingBox();
                const mesh = new THREE.Mesh(geo, materialFor(key));
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.userData.batch = key;
                scene.add(mesh);
                meshes.push(mesh);
            }
            this.groups.clear();
            return meshes;
        }
    }

    BO.WorldCore = { TrackedArray, SpatialGrid, Terrain, NavGrid, BoxBatcher, MinHeap, noise: { hash2, valueNoise, fbm, ridged } };
})(window.BO);
