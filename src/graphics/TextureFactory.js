/* ============================================================================
   BLACKOUT OPS — Procedural PBR CanvasTexture & Animated Camo Generator
   Zero external image files required. Caches all textures & materials.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    function seededNoise(seed) {
        let s = seed | 0;
        return function () {
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    class TextureFactory {
        constructor() {
            this.textures = Object.create(null);
            this.materials = Object.create(null);
            this.heightMaps = Object.create(null);
            this.roughMaps = Object.create(null);
            this._waterUniforms = [];
            this.camoTextures = Object.create(null);
            this.darkMatterCanvas = null;
            this.darkMatterCtx = null;
            this.darkMatterTex = null;
            this.papCanvas = null;
            this.papCtx = null;
            this.papTex = null;
            this._animAccum = 0;
        }

        _makeCanvas(w, h) {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            return c;
        }

        _toTex(canvas, repeatX = 1, repeatY = 1, srgb = true) {
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(repeatX, repeatY);
            if (srgb && THREE.sRGBEncoding) {
                tex.encoding = THREE.sRGBEncoding;
            }
            const q = BO.Settings?.get?.('quality') || 'high';
            tex.anisotropy = q === 'low' ? 2 : (q === 'medium' ? 4 : 8);
            tex.needsUpdate = true;
            return tex;
        }

        /** Seamless 5-octave value-noise field in [0,1]. */
        _fbmField(W, H, rng) {
            const out = new Float32Array(W * H);
            let amp = 0.5, total = 0;
            for (let o = 0; o < 5; o++) {
                const P = 3 << o; // lattice period: 3, 6, 12, 24, 48 cells per tile
                const lat = new Float32Array(P * P);
                for (let k = 0; k < lat.length; k++) lat[k] = rng();
                for (let y = 0; y < H; y++) {
                    const fy = (y / H) * P, iy = Math.floor(fy), ty = fy - iy;
                    const sy = ty * ty * (3 - 2 * ty);
                    const y0 = (iy % P) * P, y1 = ((iy + 1) % P) * P;
                    for (let x = 0; x < W; x++) {
                        const fx = (x / W) * P, ix = Math.floor(fx), tx = fx - ix;
                        const sx = tx * tx * (3 - 2 * tx);
                        const x0 = ix % P, x1 = (ix + 1) % P;
                        const a = lat[y0 + x0] + (lat[y0 + x1] - lat[y0 + x0]) * sx;
                        const b = lat[y1 + x0] + (lat[y1 + x1] - lat[y1 + x0]) * sx;
                        out[y * W + x] += (a + (b - a) * sy) * amp;
                    }
                }
                total += amp;
                amp *= 0.5;
            }
            for (let k = 0; k < out.length; k++) out[k] /= total;
            return out;
        }

        /**
         * Tileable surface texture (concrete, asphalt, sand, sandbag, bunker stone…).
         * Albedo from 5-octave value noise; aggregate stamped as soft round stones and pits (no
         * square pixels); an authored heightfield (raised stones, sunken pits, recessed joints)
         * becomes the normal map, and a matching roughness map makes polished aggregate catch light.
         */
        _createNoiseTexture(key, w, h, baseHex, variance, speckColor, gridOpts) {
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(w, h);
            const ctx = c.getContext('2d');
            const rng = seededNoise(key.length * 1337 + baseHex.charCodeAt(1) * 97);

            const S = 2; // supersample: author at 2x for crisper close-up detail
            if (c.width !== w * S) { c.width = w * S; c.height = h * S; }
            const W = w * S, H = h * S;
            const field = this._fbmField(W, H, rng);
            const base = new THREE.Color(baseHex);
            const img = ctx.createImageData(W, H);
            const d = img.data;
            const v = variance / 255;
            const col = new Float32Array(W * H * 3);
            const height = new Float32Array(W * H);
            const rough = new Float32Array(W * H);
            const roughBase = ({ asphalt: 0.93, desert_sand: 0.96, sandbag: 0.95, bunker_stone: 0.91, concrete: 0.88 })[key] || 0.9;
            for (let i = 0; i < field.length; i++) {
                const grain = (rng() - 0.5);
                const n = (field[i] - 0.5) * 2 * v + grain * v * 0.35;
                col[i * 3] = base.r + n;
                col[i * 3 + 1] = base.g + n * 0.96;
                col[i * 3 + 2] = base.b + n * 0.9;
                height[i] = 0.5 + (field[i] - 0.5) * 0.45 + grain * 0.05;
                rough[i] = roughBase + (0.5 - field[i]) * 0.08;
            }

            // Aggregate: soft-edged round stones (light, raised) and pits (dark, sunken), wrapped for tiling.
            if (speckColor) {
                const m = /rgba?\(([^)]+)\)/.exec(speckColor);
                const parts = m ? m[1].split(',').map((x) => parseFloat(x)) : [128, 128, 128, 0.2];
                const sr = parts[0] / 255, sg = parts[1] / 255, sb = parts[2] / 255, sa = parts.length > 3 ? parts[3] : 1;
                const lumS = sr * 0.3 + sg * 0.59 + sb * 0.11, lumB = base.r * 0.3 + base.g * 0.59 + base.b * 0.11;
                const raised = lumS >= lumB; // lighter aggregate stands proud, darker reads as pits
                const count = Math.round(2600 * (w * h) / (256 * 256));
                for (let k = 0; k < count; k++) {
                    const cx = rng() * W, cy = rng() * H;
                    // Fine, irregular aggregate: mostly sub-centimetre grains, occasional larger chips.
                    const r = (0.32 + Math.pow(rng(), 2.8) * 1.25) * S;
                    const a = sa * (0.45 + rng() * 0.8);
                    const tone = 0.8 + rng() * 0.4;
                    const ang = rng() * Math.PI, ca = Math.cos(ang), sa2 = Math.sin(ang), stretch = 1 + rng() * 0.7;
                    const R = Math.ceil(r * stretch + 1);
                    for (let oy = -R; oy <= R; oy++) {
                        for (let ox = -R; ox <= R; ox++) {
                            const ux = (ox * ca + oy * sa2) / stretch, uy = -ox * sa2 + oy * ca;
                            const dist = Math.hypot(ux, uy);
                            if (dist > r + 1) continue;
                            const fall = dist < r - 0.5 ? 1 : Math.max(0, (r + 0.5 - dist)); // anti-aliased rim
                            const dome = Math.sqrt(Math.max(0, 1 - (dist * dist) / (r * r)));
                            const x = ((Math.floor(cx) + ox) % W + W) % W, y = ((Math.floor(cy) + oy) % H + H) % H;
                            const i = y * W + x, a2 = a * fall;
                            col[i * 3] += (sr * tone - col[i * 3]) * a2;
                            col[i * 3 + 1] += (sg * tone - col[i * 3 + 1]) * a2;
                            col[i * 3 + 2] += (sb * tone - col[i * 3 + 2]) * a2;
                            height[i] += (raised ? 0.2 : -0.22) * dome * fall * Math.min(1, a * 2.5);
                            rough[i] += (raised ? -0.06 : 0.03) * fall * Math.min(1, a * 2.5);
                        }
                    }
                }
            }

            // Expansion joints / mortar lines are recessed in the heightfield as well as painted.
            if (gridOpts) {
                const stepX = (gridOpts.stepX || 64) * S, stepY = (gridOpts.stepY || 64) * S;
                const half = Math.max(1, (gridOpts.lineWidth || 2) * S * 0.5);
                for (let y = 0; y < H; y++) {
                    const dy = Math.min(y % stepY, stepY - (y % stepY));
                    for (let x = 0; x < W; x++) {
                        const dx = Math.min(x % stepX, stepX - (x % stepX));
                        const dd = Math.min(dx, dy);
                        if (dd > half + 1.5) continue;
                        const k = dd <= half ? 1 : 1 - (dd - half) / 1.5;
                        const i = y * W + x;
                        height[i] -= 0.38 * k;
                        rough[i] += 0.05 * k;
                    }
                }
            }

            for (let i = 0, j = 0; i < height.length; i++, j += 4) {
                d[j] = Math.max(0, Math.min(255, col[i * 3] * 255));
                d[j + 1] = Math.max(0, Math.min(255, col[i * 3 + 1] * 255));
                d[j + 2] = Math.max(0, Math.min(255, col[i * 3 + 2] * 255));
                d[j + 3] = 255;
                rough[i] = Math.max(0.3, Math.min(1, rough[i]));
            }
            ctx.putImageData(img, 0, 0);

            if (gridOpts) {
                ctx.save();
                ctx.scale(S, S);
                ctx.strokeStyle = gridOpts.color;
                ctx.lineWidth = gridOpts.lineWidth || 2;
                const stepX = gridOpts.stepX || 64;
                const stepY = gridOpts.stepY || 64;
                for (let x = 0; x <= w; x += stepX) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
                for (let y = 0; y <= h; y += stepY) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
                ctx.restore();
            }

            this.heightMaps[key] = this._normalFromHeight(height, W, H, /sand/.test(key) ? 1.6 : 2.3);
            this.roughMaps[key] = this._roughnessTex(rough, W, H);
            const tex = this._toTex(c, 1, 1, true);
            this.textures[key] = tex;
            return tex;
        }

        /** Procedurally sculpted running-bond medieval ashlar masonry with authored heightfield + roughness maps. */
        _makeCastleStoneTexture(key, opts = {}) {
            if (this.textures[key]) return this.textures[key];
            const w = 256, h = 256;
            const c = this._makeCanvas(w, h);
            const ctx = c.getContext('2d');
            const img = ctx.createImageData(w, h);
            const data = img.data;
            const height = new Float32Array(w * h);
            const rough = new Float32Array(w * h);

            const rows = opts.rows || 8;
            const cols = opts.cols || 4;
            const baseRgb = opts.baseRgb || [88, 94, 106];
            const mortarRgb = opts.mortarRgb || [28, 30, 36];
            const mossTint = opts.mossTint || [48, 72, 42];
            const faceRough = opts.faceRough !== undefined ? opts.faceRough : 0.72;
            const rng = seededNoise(opts.seed || 7919);
            const fbm = this._fbmField(w, h, rng);

            const blockTones = new Float32Array(rows * cols);
            const blockMoss = new Float32Array(rows * cols);
            for (let i = 0; i < blockTones.length; i++) {
                blockTones[i] = (rng() - 0.5) * 32;
                blockMoss[i] = rng() > 0.72 ? 0.28 : 0.0;
            }

            const cellW = w / cols, cellH = h / rows;
            for (let y = 0; y < h; y++) {
                const row = Math.floor((y * rows) / h);
                const fy = (y * rows) / h - row;
                for (let x = 0; x < w; x++) {
                    const fxRaw = ((x * cols) / w + (row % 2) * 0.5) % cols;
                    const col = Math.floor(fxRaw);
                    const fx = fxRaw - col;
                    const dxEdge = Math.min(fx, 1 - fx) * cellW;
                    const dyEdge = Math.min(fy, 1 - fy) * cellH;
                    const edge = Math.min(dxEdge, dyEdge);
                    const grain = fbm[y * w + x];
                    const idx = y * w + x;
                    const k = idx * 4;

                    if (edge < 2.2) {
                        const mVar = (grain - 0.5) * 14;
                        data[k] = Math.max(0, Math.min(255, mortarRgb[0] + mVar));
                        data[k + 1] = Math.max(0, Math.min(255, mortarRgb[1] + mVar));
                        data[k + 2] = Math.max(0, Math.min(255, mortarRgb[2] + mVar));
                        data[k + 3] = 255;
                        height[idx] = 0.08 + grain * 0.06;
                        rough[idx] = 0.96;
                    } else {
                        const bIdx = (row % rows) * cols + (col % cols);
                        const bevelT = Math.min(1, (edge - 2.2) / 6.2);
                        const topBias = dyEdge < dxEdge ? (fy < 0.5 ? 1 : -1) : (fx < 0.5 ? 0.8 : -0.8);
                        const bevelLight = (1 - bevelT) * topBias * 24;
                        const chipNoise = (grain - 0.5) * 26;
                        const mossMix = blockMoss[bIdx] * Math.max(0, grain - 0.38) * 1.4;
                        const tone = blockTones[bIdx] + chipNoise + bevelLight;
                        const r = baseRgb[0] + tone, g = baseRgb[1] + tone, b = baseRgb[2] + tone;
                        data[k] = Math.max(0, Math.min(255, r * (1 - mossMix) + mossTint[0] * mossMix));
                        data[k + 1] = Math.max(0, Math.min(255, g * (1 - mossMix) + mossTint[1] * mossMix));
                        data[k + 2] = Math.max(0, Math.min(255, b * (1 - mossMix) + mossTint[2] * mossMix));
                        data[k + 3] = 255;
                        height[idx] = 0.42 + bevelT * 0.42 + grain * 0.16;
                        rough[idx] = Math.max(0.35, Math.min(0.95, faceRough + (1 - grain) * 0.14 - (1 - bevelT) * 0.05));
                    }
                }
            }
            ctx.putImageData(img, 0, 0);
            this.heightMaps[key] = this._normalFromHeight(height, w, h, 2.8);
            this.roughMaps[key] = this._roughnessTex(rough, w, h);
            const tex = this._toTex(c, 1, 1, true);
            this.textures[key] = tex;
            return tex;
        }

        /** Generate a LinearEncoding tangent-space normal map from an authored [0..1] heightfield. */
        _normalFromHeight(height, w, h, strength = 2.4) {
            const c = this._makeCanvas(w, h);
            const ctx = c.getContext('2d');
            const out = ctx.createImageData(w, h);
            const o = out.data;
            const at = (x, y) => height[((y + h) % h) * w + ((x + w) % w)];
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const tl = at(x - 1, y - 1), t = at(x, y - 1), tr = at(x + 1, y - 1);
                    const l = at(x - 1, y), r = at(x + 1, y);
                    const bl = at(x - 1, y + 1), b = at(x, y + 1), br = at(x + 1, y + 1);
                    const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
                    const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
                    let nx = -dx * strength, ny = dy * strength, nz = 1.0;
                    const len = Math.hypot(nx, ny, nz);
                    nx /= len; ny /= len; nz /= len;
                    const k = (y * w + x) * 4;
                    o[k] = Math.round((nx * 0.5 + 0.5) * 255);
                    o[k + 1] = Math.round((ny * 0.5 + 0.5) * 255);
                    o[k + 2] = Math.round((nz * 0.5 + 0.5) * 255);
                    o[k + 3] = 255;
                }
            }
            ctx.putImageData(out, 0, 0);
            const tex = this._toTex(c, 1, 1, false);
            if (THREE.LinearEncoding) tex.encoding = THREE.LinearEncoding;
            return tex;
        }

        /** Generate a LinearEncoding grayscale roughness CanvasTexture from a [0..1] Float32Array. */
        _roughnessTex(rough, w, h) {
            const c = this._makeCanvas(w, h);
            const ctx = c.getContext('2d');
            const out = ctx.createImageData(w, h);
            const o = out.data;
            for (let i = 0, j = 0; i < rough.length; i++, j += 4) {
                const v = Math.max(0, Math.min(255, Math.round(rough[i] * 255)));
                o[j] = v; o[j + 1] = v; o[j + 2] = v; o[j + 3] = 255;
            }
            ctx.putImageData(out, 0, 0);
            const tex = this._toTex(c, 1, 1, false);
            if (THREE.LinearEncoding) tex.encoding = THREE.LinearEncoding;
            return tex;
        }

        /** Animated GLSL water update called every frame by WorldBuilder. */
        updateWaterTime(elapsed) {
            for (let i = 0; i < this._waterUniforms.length; i++) {
                this._waterUniforms[i].value = elapsed;
            }
        }

        /** Neutral detail map multiplied over terrain vertex colours (grass, grit, pebbles). */
        getTerrainDetailTexture() {
            if (this.textures.__terrainDetail) return this.textures.__terrainDetail;
            const tex = this._createNoiseTexture('terrain_detail_v2', 256, 256, '#d9d9d9', 70, 'rgba(60,60,60,0.35)', null);
            const t = tex.clone ? tex : tex;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(1, 1);
            t.needsUpdate = true;
            this.textures.__terrainDetail = t;
            return t;
        }

        getWorldMaterial(matName, worldW = 4, worldH = 4) {
            const repX = Math.max(1, Math.round(worldW / 4));
            const repY = Math.max(1, Math.round(worldH / 4));
            const cacheKey = `${matName}_${repX}_${repY}`;
            if (this.materials[cacheKey]) return this.materials[cacheKey];

            let map;
            let roughness = 0.85;
            let metalness = 0.08;
            let emissive = 0x000000;
            let emissiveIntensity = 0;

            switch (matName) {
                case 'bunker_stone':
                    map = this._createNoiseTexture('bunker_stone', 256, 256, '#484c52', 42, 'rgba(20,22,25,0.28)', { color: 'rgba(15,17,20,0.42)', stepX: 64, stepY: 32, lineWidth: 2 });
                    roughness = 0.92;
                    break;
                case 'concrete':
                    map = this._createNoiseTexture('concrete', 256, 256, '#62676e', 36, 'rgba(255,255,255,0.08)', { color: 'rgba(30,32,36,0.25)', stepX: 128, stepY: 128, lineWidth: 2 });
                    roughness = 0.89;
                    break;
                case 'asphalt':
                    map = this._createNoiseTexture('asphalt', 256, 256, '#32363c', 32, 'rgba(180,185,195,0.12)', null);
                    roughness = 0.94;
                    break;
                case 'desert_sand':
                    map = this._createNoiseTexture('desert_sand', 256, 256, '#b89b6d', 36, 'rgba(130,98,60,0.22)', null);
                    roughness = 0.95;
                    break;
                case 'brick':
                    map = this._makeBrickTexture();
                    roughness = 0.92;
                    break;
                case 'wood_plank':
                    map = this._makeWoodTexture('wood_plank', '#765334', '#4d331d');
                    roughness = 0.86;
                    break;
                case 'wood_crate':
                    map = this._makeCrateTexture();
                    roughness = 0.84;
                    break;
                case 'sandbag':
                    map = this._createNoiseTexture('sandbag', 256, 256, '#8f7d60', 34, 'rgba(60,50,35,0.22)', { color: 'rgba(45,38,26,0.45)', stepX: 64, stepY: 32, lineWidth: 3 });
                    roughness = 0.95;
                    break;
                case 'diamond_plate':
                    map = this._makeDiamondPlateTexture();
                    roughness = 0.44;
                    metalness = 0.74;
                    break;
                case 'rusted_metal':
                    map = this._createNoiseTexture('rusted_metal', 256, 256, '#523b32', 55, 'rgba(145,75,35,0.34)', null);
                    roughness = 0.68;
                    metalness = 0.56;
                    break;
                case 'lab_panel':
                    map = this._makeLabPanelTexture();
                    roughness = 0.40;
                    metalness = 0.58;
                    break;
                case 'container_blue':
                    map = this._makeContainerTexture('container_blue', '#214e7d', '#143252');
                    roughness = 0.62;
                    metalness = 0.44;
                    break;
                case 'container_red':
                    map = this._makeContainerTexture('container_red', '#822828', '#521616');
                    roughness = 0.62;
                    metalness = 0.44;
                    break;
                case 'container_olive':
                    map = this._makeContainerTexture('container_olive', '#465637', '#2b3622');
                    roughness = 0.65;
                    metalness = 0.40;
                    break;
                case 'swamp_mud':
                    map = this._createNoiseTexture('swamp_mud', 256, 256, '#2d2a1f', 48, 'rgba(20,25,14,0.35)', null);
                    roughness = 0.94;
                    break;
                case 'swamp_water':
                    return this._makeAnimatedWaterMaterial(cacheKey, repX, repY);
                case 'theater_carpet':
                    map = this._makeTheaterCarpetTexture();
                    roughness = 0.92;
                    break;
                case 'velvet_red':
                    map = this._createNoiseTexture('velvet_red', 256, 256, '#7f1d1d', 24, 'rgba(40,6,6,0.28)', null);
                    roughness = 0.94;
                    break;
                case 'pentagon_marble':
                    map = this._makePentagonMarbleTexture();
                    roughness = 0.28;
                    metalness = 0.12;
                    break;
                case 'pentagon_panel':
                    map = this._makeWoodTexture('pentagon_panel', '#422818', '#26160b');
                    roughness = 0.68;
                    break;
                case 'soviet_concrete':
                    map = this._createNoiseTexture('soviet_concrete', 256, 256, '#5a5f58', 42, 'rgba(30,34,28,0.22)', { color: 'rgba(24,28,24,0.32)', stepX: 128, stepY: 64, lineWidth: 3 });
                    roughness = 0.90;
                    break;
                case 'green_siding':
                    map = this._makeSidingTexture('green_siding', '#3d634d', '#233b2d');
                    roughness = 0.92;
                    metalness = 0.02;
                    break;
                case 'yellow_siding':
                    map = this._makeSidingTexture('yellow_siding', '#bfa043', '#7d6624');
                    roughness = 0.92;
                    metalness = 0.02;
                    break;
                case 'nuketown_grass':
                    map = this._makeNuketownGrassTexture();
                    roughness = 0.95;
                    break;
                case 'bus_teal':
                    map = this._makeVehiclePaintTexture('bus_teal', '#2c7576', '#1c4d4e', '#d6d3c9');
                    roughness = 0.42;
                    metalness = 0.46;
                    break;
                case 'truck_yellow':
                    map = this._makeVehiclePaintTexture('truck_yellow', '#cca024', '#8e6b12', '#f1f5f9');
                    roughness = 0.46;
                    metalness = 0.42;
                    break;
                case 'ceiling_plaster':
                    map = this._createNoiseTexture('ceiling_plaster', 256, 256, '#3a3532', 26, 'rgba(18,16,15,0.22)', { color: 'rgba(20,18,16,0.42)', stepX: 128, stepY: 128, lineWidth: 3 });
                    roughness = 0.92;
                    break;
                case 'bamboo_fence':
                    map = this._createNoiseTexture('bamboo_fence', 256, 256, '#4d4329', 36, 'rgba(22,20,12,0.28)', { color: 'rgba(18,16,10,0.55)', stepX: 16, stepY: 256, lineWidth: 2 });
                    roughness = 0.90;
                    break;
                case 'privacy_fence':
                    map = this._makeWoodTexture('privacy_fence', '#7b5e3f', '#4d3720');
                    roughness = 0.90;
                    break;
                case 'dark_slate_roof':
                    map = this._makeRoofShingleTexture();
                    roughness = 0.92;
                    break;
                case 'airport_tile':
                    map = this._createNoiseTexture('airport_tile', 256, 256, '#c7cdd6', 22, 'rgba(70,80,95,0.12)', { color: 'rgba(90,100,115,0.28)', stepX: 64, stepY: 64, lineWidth: 2 });
                    roughness = 0.28;
                    metalness = 0.15;
                    break;
                case 'burger_red':
                    map = this._createNoiseTexture('burger_red', 256, 256, '#991b1b', 28, 'rgba(255,210,120,0.12)', { color: 'rgba(250,204,21,0.35)', stepX: 64, stepY: 32, lineWidth: 2 });
                    roughness = 0.55;
                    break;
                case 'plane_hull':
                    map = this._makeVehiclePaintTexture('plane_hull', '#dce3ec', '#94a3b8', '#475569');
                    roughness = 0.36;
                    metalness = 0.58;
                    break;
                case 'rust_steel':
                    map = this._createNoiseTexture('rust_steel', 256, 256, '#7c4529', 48, 'rgba(40,18,8,0.30)', { color: 'rgba(55,28,14,0.38)', stepX: 64, stepY: 64, lineWidth: 2 });
                    roughness = 0.72;
                    metalness = 0.52;
                    break;
                case 'castle_stone':
                    map = this._makeCastleStoneTexture('castle_stone', { rows: 8, cols: 4, baseRgb: [86, 93, 108], mortarRgb: [24, 26, 34], mossTint: [44, 68, 42], faceRough: 0.78, seed: 4109 });
                    roughness = 0.84;
                    break;
                case 'castle_battlement':
                    map = this._makeCastleStoneTexture('castle_battlement', { rows: 6, cols: 4, baseRgb: [112, 120, 134], mortarRgb: [32, 36, 44], mossTint: [54, 74, 50], faceRough: 0.70, seed: 6217 });
                    roughness = 0.78;
                    break;
                case 'wood_fort':
                    map = this._makeWoodTexture('wood_fort', '#5c3c22', '#3d2614');
                    roughness = 0.88;
                    break;
                default:
                    map = this._createNoiseTexture('concrete', 256, 256, '#5c6066', 36, null, null);
                    break;
            }

            const clonedMap = map.clone();
            clonedMap.repeat.set(repX, repY);
            clonedMap.needsUpdate = true;

            const roughSrc = this.roughMaps[matName];
            let clonedRough = null;
            if (roughSrc) {
                clonedRough = roughSrc.clone();
                clonedRough.repeat.set(repX, repY);
                clonedRough.needsUpdate = true;
            }

            const mat = new THREE.MeshStandardMaterial({
                map: clonedMap,
                roughness: clonedRough ? 1.0 : roughness,
                roughnessMap: clonedRough,
                metalness,
                emissive,
                emissiveIntensity
            });
            // Prefer authored heightfield normal map when present; fall back to softer Sobel on albedo.
            const nrm = this.heightMaps[matName] || this._normalFromMap(map, matName);
            if (nrm) {
                const n = nrm.clone();
                n.repeat.set(repX, repY);
                n.needsUpdate = true;
                mat.normalMap = n;
                const isSiding = /siding/.test(matName);
                const flat = /water|marble|glass|metal_clean/.test(matName);
                const k = flat ? 0.25 : (isSiding ? 0.42 : (this.heightMaps[matName] ? 0.72 : 0.58));
                mat.normalScale.set(k, k);
            }
            this._applyMacroVariation(mat, matName);
            this.materials[cacheKey] = mat;
            return mat;
        }

        _makeAnimatedWaterMaterial(cacheKey, repX, repY) {
            const map = this._createNoiseTexture('swamp_water', 256, 256, '#142a22', 24, 'rgba(72,125,92,0.14)', null);
            const clonedMap = map.clone();
            clonedMap.repeat.set(repX, repY);
            clonedMap.needsUpdate = true;
            const mat = new THREE.MeshStandardMaterial({
                map: clonedMap,
                color: 0x9ecbb8,
                roughness: 0.10,
                metalness: 0.22,
                transparent: true,
                opacity: 0.90
            });
            const uTime = { value: 0 };
            this._waterUniforms.push(uTime);
            mat.onBeforeCompile = (shader) => {
                shader.uniforms.uWaterTime = uTime;
                shader.vertexShader = shader.vertexShader
                    .replace('#include <common>', `#include <common>
varying vec3 vWPos;`)
                    .replace('#include <begin_vertex>', `#include <begin_vertex>
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
                shader.fragmentShader = shader.fragmentShader
                    .replace('#include <common>', `#include <common>
uniform float uWaterTime;
varying vec3 vWPos;
float wHash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float wNoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(wHash(i),wHash(i+vec2(1.,0.)),f.x),mix(wHash(i+vec2(0.,1.)),wHash(i+vec2(1.,1.)),f.x),f.y); }`)
                    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
    vec2 wp = vWPos.xz;
    float t = uWaterTime;
    float w1 = wNoise(wp * 0.85 + vec2(t * 0.35, t * 0.22));
    float w2 = wNoise(wp * 1.9 - vec2(t * 0.42, -t * 0.28));
    float w3 = sin(wp.x * 2.4 + t * 1.6) * cos(wp.y * 2.1 - t * 1.3) * 0.15;
    vec3 rippleN = normalize(vec3((w1 - 0.5) * 0.32 + (w2 - 0.5) * 0.22 + w3, 1.0, (w2 - 0.5) * 0.32 - (w1 - 0.5) * 0.22));
    normal = normalize(normal + vec3(rippleN.x, 0.0, rippleN.z) * 0.55);
}`)
                    .replace('#include <color_fragment>', `#include <color_fragment>
{
    float rippleTint = wNoise(vWPos.xz * 0.45 + uWaterTime * 0.18);
    diffuseColor.rgb *= mix(0.78, 1.18, rippleTint);
}`);
            };
            mat.customProgramCacheKey = () => 'boWater1';
            this.materials[cacheKey] = mat;
            return mat;
        }

        /** Sobel normal map from an albedo canvas's luminance (cached per source image). */
        _normalFromMap(map, name) {
            const img = map && map.image;
            if (!img || !img.getContext || !img.width) return null;
            this._normalCache = this._normalCache || new WeakMap();
            const hit = this._normalCache.get(img);
            if (hit) return hit;
            const w = img.width, h = img.height;
            let src;
            try { src = img.getContext('2d').getImageData(0, 0, w, h).data; } catch (e) { return null; }
            const lum = new Float32Array(w * h);
            for (let i = 0, j = 0; i < lum.length; i++, j += 4) lum[i] = (src[j] * 0.299 + src[j + 1] * 0.587 + src[j + 2] * 0.114) / 255;
            const c = this._makeCanvas(w, h);
            const ctx = c.getContext('2d');
            const out = ctx.createImageData(w, h);
            const o = out.data;
            const strength = /grass|dirt|sand|mud/.test(name || '') ? 1.5 : 1.85;
            const at = (x, y) => lum[((y + h) % h) * w + ((x + w) % w)];
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const tl = at(x - 1, y - 1), t = at(x, y - 1), tr = at(x + 1, y - 1);
                    const l = at(x - 1, y), r = at(x + 1, y);
                    const bl = at(x - 1, y + 1), b = at(x, y + 1), br = at(x + 1, y + 1);
                    const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
                    const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
                    let nx = -dx * strength, ny = dy * strength, nz = 1;
                    const len = Math.hypot(nx, ny, nz);
                    nx /= len; ny /= len; nz /= len;
                    const k = (y * w + x) * 4;
                    o[k] = (nx * 0.5 + 0.5) * 255;
                    o[k + 1] = (ny * 0.5 + 0.5) * 255;
                    o[k + 2] = (nz * 0.5 + 0.5) * 255;
                    o[k + 3] = 255;
                }
            }
            ctx.putImageData(out, 0, 0);
            const tex = this._toTex(c, 1, 1, false);
            if (THREE.LinearEncoding) tex.encoding = THREE.LinearEncoding;
            this._normalCache.set(img, tex);
            return tex;
        }

        /** World-space macro variation: breaks visible tiling on big surfaces (albedo + roughness). */
        _applyMacroVariation(mat, matName) {
            // World-space box projection: uniform texel density on every face regardless of the
            // mesh's proportions (thin slabs no longer stretch textures 15:1 into streaks).
            const worldUV = !/sign|poster|screen|logo|banner|label|decal/.test(matName || '');
            mat.onBeforeCompile = (shader) => {
                const SC = THREE.ShaderChunk;
                shader.vertexShader = shader.vertexShader
                    .replace('#include <common>', `#include <common>
varying vec3 vBoWorld;
varying vec3 vBoNormal;`)
                    .replace('#include <begin_vertex>', `#include <begin_vertex>
vBoWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
vBoNormal = normalize(mat3(modelMatrix) * objectNormal);`);
                let fs = shader.fragmentShader
                    .replace('#include <common>', `#include <common>
varying vec3 vBoWorld;
varying vec3 vBoNormal;
vec2 boUV;
float boHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float boNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(boHash(i), boHash(i + vec2(1.0, 0.0)), f.x), mix(boHash(i + vec2(0.0, 1.0)), boHash(i + vec2(1.0, 1.0)), f.x), f.y); }`);
                if (worldUV) {
                    fs = fs
                        .replace('#include <normalmap_pars_fragment>', SC.normalmap_pars_fragment.replace(/vUv/g, 'boUV'))
                        .replace('#include <normal_fragment_maps>', SC.normal_fragment_maps.replace(/vUv/g, 'boUV'))
                        .replace('#include <map_fragment>', SC.map_fragment.replace(/vUv/g, 'boUV'))
                        .replace('#include <roughnessmap_fragment>', SC.roughnessmap_fragment.replace(/vUv/g, 'boUV'))
                        .replace('void main() {', `void main() {
    vec3 boA = abs(vBoNormal);
    boUV = (boA.y > max(boA.x, boA.z) ? vBoWorld.xz : (boA.x > boA.z ? vec2(vBoWorld.z, vBoWorld.y) : vBoWorld.xy)) * 0.25;`);
                } else {
                    fs = fs.replace('void main() {', 'void main() {\n    boUV = vec2(0.0);');
                }
                fs = fs
                    .replace('#include <color_fragment>', `#include <color_fragment>
vec2 boP = vBoWorld.xz + vBoWorld.y * 0.37;
float boN = boNoise(boP * 0.06) * 0.6 + boNoise(boP * 0.21) * 0.3 + boNoise(boP * 0.9) * 0.1;
diffuseColor.rgb *= mix(0.84, 1.10, boN);`)
                    .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor * mix(0.90, 1.08, boN), 0.04, 1.0);`);
                shader.fragmentShader = fs;
            };
            mat.customProgramCacheKey = () => worldUV ? 'boMacroW3' : 'boMacro3';
        }

        _makeBrickTexture() {
            if (this.textures.brick) return this.textures.brick;
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            const rng = seededNoise(9911);
            const fbm = this._fbmField(S, S, seededNoise(9912));
            const height = new Float32Array(S * S);
            const rough = new Float32Array(S * S);

            // Base mortar fill
            ctx.fillStyle = '#8b8376';
            ctx.fillRect(0, 0, S, S);
            height.fill(0.18);
            rough.fill(0.96);

            const bw = 64, bh = 32, gap = 3;
            for (let row = 0; row < 16; row++) {
                const offset = (row % 2) * 32;
                for (let col = -1; col < 9; col++) {
                    const bx = col * bw + offset + gap;
                    const by = row * bh + gap;
                    const w = bw - gap * 2, h = bh - gap * 2;
                    const tone = (rng() - 0.5) * 28;
                    const r = Math.min(220, Math.max(85, Math.round(148 + tone)));
                    const g = Math.min(180, Math.max(60, Math.round(92 + tone * 0.72)));
                    const b = Math.min(150, Math.max(48, Math.round(70 + tone * 0.55)));
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(bx, by, w, h);
                    // Subtle top highlight & bottom kiln-char bevel
                    ctx.fillStyle = 'rgba(255,240,220,0.08)';
                    ctx.fillRect(bx, by, w, 3);
                    ctx.fillStyle = 'rgba(25,14,10,0.18)';
                    ctx.fillRect(bx, by + h - 3, w, 3);

                    for (let py = Math.max(0, by); py < Math.min(S, by + h); py++) {
                        for (let px = Math.max(0, bx); px < Math.min(S, bx + w); px++) {
                            const idx = py * S + px;
                            const edgeDist = Math.min(px - bx, bx + w - 1 - px, py - by, by + h - 1 - py);
                            const bevel = Math.min(1, edgeDist / 2.5);
                            height[idx] = 0.45 + bevel * 0.40 + (fbm[idx] - 0.5) * 0.14;
                            rough[idx] = 0.86 + (1 - bevel) * 0.08 + (fbm[idx] - 0.5) * 0.06;
                        }
                    }
                }
            }
            // Subtle micro-grime & weathering overlay
            const img = ctx.getImageData(0, 0, S, S);
            const d = img.data;
            for (let i = 0, j = 0; i < fbm.length; i++, j += 4) {
                const n = (fbm[i] - 0.5) * 34;
                d[j] = Math.max(0, Math.min(255, d[j] + n));
                d[j + 1] = Math.max(0, Math.min(255, d[j + 1] + n * 0.92));
                d[j + 2] = Math.max(0, Math.min(255, d[j + 2] + n * 0.85));
            }
            ctx.putImageData(img, 0, 0);

            this.heightMaps.brick = this._normalFromHeight(height, S, S, 2.2);
            this.roughMaps.brick = this._roughnessTex(rough, S, S);
            return (this.textures.brick = this._toTex(c, 1, 1, true));
        }

        _makeWoodTexture(key, c1, c2) {
            if (this.textures[key]) return this.textures[key];
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            const rng = seededNoise(4421 + key.length * 197);
            const fbm = this._fbmField(S, S, seededNoise(4423 + key.length * 71));
            const height = new Float32Array(S * S);
            const rough = new Float32Array(S * S);

            const col1 = new THREE.Color(c1);
            const col2 = new THREE.Color(c2);
            const img = ctx.createImageData(S, S);
            const d = img.data;

            const plankH = 64;
            for (let y = 0; y < S; y++) {
                const row = Math.floor(y / plankH);
                const py = y % plankH;
                const rowSeed = (row * 17 + 5) % 13;
                const seamY = py < 3 || py >= plankH - 2;
                const jointX = ((row * 193 + 96) % S);

                for (let x = 0; x < S; x++) {
                    const idx = y * S + x;
                    const seamX = Math.abs(x - jointX) < 2;
                    const seam = seamY || seamX;
                    // Continuous wood grain ring waves along X
                    const grainPhase = (y * 0.34 + fbm[idx] * 9.5 + Math.sin(x * 0.025 + rowSeed) * 3.8);
                    const ring = 0.5 + 0.5 * Math.sin(grainPhase);
                    const fineFiber = (fbm[(y * S + ((x * 3) % S))] - 0.5) * 0.25;
                    const plankTone = ((row % 3) - 1) * 0.06;

                    let mixT = seam ? 0.92 : (0.18 + ring * 0.35 + fineFiber + plankTone);
                    mixT = Math.max(0, Math.min(1, mixT));

                    const r = col1.r * (1 - mixT) + col2.r * mixT;
                    const g = col1.g * (1 - mixT) + col2.g * mixT;
                    const b = col1.b * (1 - mixT) + col2.b * mixT;
                    const j = idx * 4;
                    d[j] = Math.max(0, Math.min(255, Math.round(r * 255)));
                    d[j + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
                    d[j + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
                    d[j + 3] = 255;

                    height[idx] = seam ? 0.15 : (0.72 + ring * 0.16 + fineFiber * 0.12);
                    rough[idx] = seam ? 0.95 : (0.78 + ring * 0.12 + (fbm[idx] - 0.5) * 0.08);
                }
            }
            ctx.putImageData(img, 0, 0);

            // Subtle nail heads near plank joints
            ctx.fillStyle = 'rgba(22,18,16,0.72)';
            for (let row = 0; row < S / plankH; row++) {
                const jx = (row * 193 + 96) % S;
                const cy1 = row * plankH + 14;
                const cy2 = row * plankH + plankH - 14;
                for (const nx of [(jx + 12) % S, (jx - 12 + S) % S]) {
                    ctx.beginPath(); ctx.arc(nx, cy1, 2.2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(nx, cy2, 2.2, 0, Math.PI * 2); ctx.fill();
                }
            }

            this.heightMaps[key] = this._normalFromHeight(height, S, S, 1.85);
            this.roughMaps[key] = this._roughnessTex(rough, S, S);
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        _makeCrateTexture() {
            if (this.textures.wood_crate) return this.textures.wood_crate;
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            const fbm = this._fbmField(S, S, seededNoise(7731));
            const height = new Float32Array(S * S);
            const rough = new Float32Array(S * S);

            // Base slatted wood planks
            ctx.fillStyle = '#6d4f2e';
            ctx.fillRect(0, 0, S, S);
            for (let y = 0; y < S; y += 64) {
                ctx.fillStyle = y % 128 === 0 ? '#735331' : '#654829';
                ctx.fillRect(0, y, S, 62);
                ctx.fillStyle = '#332210';
                ctx.fillRect(0, y + 62, S, 2);
                for (let g = 0; g < 18; g++) {
                    ctx.fillStyle = g % 2 ? 'rgba(30,18,8,0.14)' : 'rgba(210,165,110,0.08)';
                    ctx.fillRect(0, y + ((g * 19) % 60), S, 2);
                }
            }

            // Outer frame & diagonal brace
            ctx.fillStyle = '#4e361c';
            ctx.fillRect(0, 0, S, 42);
            ctx.fillRect(0, S - 42, S, 42);
            ctx.fillRect(0, 0, 42, S);
            ctx.fillRect(S - 42, 0, 42, S);

            ctx.save();
            ctx.strokeStyle = '#4a3319';
            ctx.lineWidth = 34;
            ctx.beginPath();
            ctx.moveTo(28, 28); ctx.lineTo(S - 28, S - 28);
            ctx.stroke();
            ctx.restore();

            // Inner frame shadow bevel
            ctx.strokeStyle = 'rgba(18,10,4,0.65)';
            ctx.lineWidth = 6;
            ctx.strokeRect(42, 42, S - 84, S - 84);

            // Stamped dark steel corner brackets + rivets
            ctx.fillStyle = '#232830';
            for (const [cx, cy] of [[0, 0], [S - 52, 0], [0, S - 52], [S - 52, S - 52]]) {
                ctx.fillRect(cx, cy, 52, 52);
                ctx.fillStyle = '#475569';
                ctx.fillRect(cx + 8, cy + 8, 6, 6);
                ctx.fillRect(cx + 38, cy + 8, 6, 6);
                ctx.fillRect(cx + 8, cy + 38, 6, 6);
                ctx.fillStyle = '#232830';
            }

            // Faded military ammo stencil
            ctx.save();
            ctx.fillStyle = 'rgba(226, 212, 168, 0.42)';
            ctx.font = 'bold 26px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ORDNANCE • 7.62', S * 0.5, S * 0.30);
            ctx.font = 'bold 20px Consolas, monospace';
            ctx.fillText('LOT 44-B', S * 0.5, S * 0.74);
            ctx.restore();

            for (let y = 0; y < S; y++) {
                for (let x = 0; x < S; x++) {
                    const idx = y * S + x;
                    const inFrame = x < 42 || x >= S - 42 || y < 42 || y >= S - 42;
                    const onDiag = Math.abs(x - y) < 22;
                    height[idx] = (inFrame || onDiag ? 0.85 : 0.48) + (fbm[idx] - 0.5) * 0.14;
                    rough[idx] = (inFrame ? 0.82 : 0.88) + (fbm[idx] - 0.5) * 0.08;
                }
            }
            this.heightMaps.wood_crate = this._normalFromHeight(height, S, S, 2.0);
            this.roughMaps.wood_crate = this._roughnessTex(rough, S, S);
            return (this.textures.wood_crate = this._toTex(c, 1, 1, true));
        }

        _makeDiamondPlateTexture() {
            if (this.textures.diamond_plate) return this.textures.diamond_plate;
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            const height = new Float32Array(S * S);
            const rough = new Float32Array(S * S);
            height.fill(0.35);
            rough.fill(0.48);

            ctx.fillStyle = '#38404b';
            ctx.fillRect(0, 0, S, S);
            ctx.fillStyle = '#606b7b';
            for (let y = 16; y < S; y += 32) {
                for (let x = 16; x < S; x += 32) {
                    const alt = ((x + y) / 32) % 2 === 0;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(alt ? 0.785 : -0.785);
                    ctx.fillRect(-8, -3, 16, 6);
                    ctx.restore();
                    for (let dy = -6; dy <= 6; dy++) {
                        for (let dx = -6; dx <= 6; dx++) {
                            const px = (x + dx + S) % S, py = (y + dy + S) % S;
                            if (Math.abs(dx) + Math.abs(dy) < 7) {
                                height[py * S + px] = 0.88;
                                rough[py * S + px] = 0.28;
                            }
                        }
                    }
                }
            }
            ctx.strokeStyle = '#1e232b';
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, S - 4, S - 4);
            this.heightMaps.diamond_plate = this._normalFromHeight(height, S, S, 2.4);
            this.roughMaps.diamond_plate = this._roughnessTex(rough, S, S);
            return (this.textures.diamond_plate = this._toTex(c, 1, 1, true));
        }

        _makeLabPanelTexture() {
            if (this.textures.lab_panel) return this.textures.lab_panel;
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#242e3b';
            ctx.fillRect(0, 0, S, S);
            ctx.strokeStyle = '#121820';
            ctx.lineWidth = 6;
            ctx.strokeRect(6, 6, S - 12, S - 12);
            ctx.strokeRect(6, 256, S - 12, 250);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(32, 32, 72, 10);
            ctx.fillStyle = '#1d2734';
            ctx.fillRect(32, 286, S - 64, 180);
            return (this.textures.lab_panel = this._toTex(c, 1, 1, true));
        }

        _makeContainerTexture(key, mainHex, darkHex) {
            if (this.textures[key]) return this.textures[key];
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            const fbm = this._fbmField(S, S, seededNoise(key.length * 2999));
            const height = new Float32Array(S * S);
            const rough = new Float32Array(S * S);

            const colMain = new THREE.Color(mainHex);
            const colDark = new THREE.Color(darkHex);
            const img = ctx.createImageData(S, S);
            const d = img.data;

            const period = 32;
            for (let y = 0; y < S; y++) {
                const topRail = y < 18 || y >= S - 18;
                for (let x = 0; x < S; x++) {
                    const idx = y * S + x;
                    const u = (x % period) / period;
                    // Trapezoidal steel corrugation profile
                    let h = 0;
                    if (u < 0.25) h = u / 0.25;
                    else if (u < 0.55) h = 1.0;
                    else if (u < 0.80) h = 1.0 - (u - 0.55) / 0.25;
                    else h = 0.0;
                    if (topRail) h = 0.92;

                    const rustMask = fbm[idx] > 0.72 && (y < 70 || y > S - 70 || (fbm[(y * S + ((x + 128) % S))] > 0.64));
                    const grime = (fbm[idx] - 0.5) * 0.18;
                    let r = (colDark.r + (colMain.r - colDark.r) * (0.35 + h * 0.65)) + grime;
                    let g = (colDark.g + (colMain.g - colDark.g) * (0.35 + h * 0.65)) + grime;
                    let b = (colDark.b + (colMain.b - colDark.b) * (0.35 + h * 0.65)) + grime;
                    if (rustMask) { r = 0.36; g = 0.20; b = 0.12; }

                    const j = idx * 4;
                    d[j] = Math.max(0, Math.min(255, Math.round(r * 255)));
                    d[j + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
                    d[j + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
                    d[j + 3] = 255;

                    height[idx] = h * 0.85;
                    rough[idx] = rustMask ? 0.88 : (0.50 + (1 - h) * 0.14 + grime * 0.2);
                }
            }
            ctx.putImageData(img, 0, 0);
            this.heightMaps[key] = this._normalFromHeight(height, S, S, 2.2);
            this.roughMaps[key] = this._roughnessTex(rough, S, S);
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        _makeTheaterCarpetTexture() {
            if (this.textures.theater_carpet) return this.textures.theater_carpet;
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#5e141c';
            ctx.fillRect(0, 0, S, S);
            ctx.strokeStyle = '#ca9e3b';
            ctx.lineWidth = 4;
            for (let y = 0; y < S; y += 64) {
                for (let x = 0; x < S; x += 64) {
                    ctx.beginPath();
                    ctx.moveTo(x + 32, y + 6);
                    ctx.lineTo(x + 58, y + 32);
                    ctx.lineTo(x + 32, y + 58);
                    ctx.lineTo(x + 6, y + 32);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(202,158,59,0.22)';
                    ctx.fill();
                }
            }
            return (this.textures.theater_carpet = this._toTex(c, 1, 1, true));
        }

        _makePentagonMarbleTexture() {
            if (this.textures.pentagon_marble) return this.textures.pentagon_marble;
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            const rng = seededNoise(5551);
            ctx.fillStyle = '#cfd4dc';
            ctx.fillRect(0, 0, S, S);
            ctx.strokeStyle = 'rgba(100,116,139,0.32)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 28; i++) {
                ctx.beginPath();
                ctx.moveTo(rng() * S, rng() * S);
                ctx.bezierCurveTo(rng() * S, rng() * S, rng() * S, rng() * S, rng() * S, rng() * S);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(51,65,85,0.42)';
            ctx.lineWidth = 4;
            for (let g = 0; g <= S; g += 128) {
                ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, S); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(S, g); ctx.stroke();
            }
            return (this.textures.pentagon_marble = this._toTex(c, 1, 1, true));
        }

        /** Authentic 512x512 painted clapboard wood siding: sloped planks, crisp bottom lip shadow, fine horizontal wood grain, butt joints & matte roughness. */
        _makeSidingTexture(key, mainHex, lineHex) {
            if (this.textures[key]) return this.textures[key];
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            const rng = seededNoise(key.length * 6131 + mainHex.charCodeAt(1) * 149);
            const fbm = this._fbmField(S, S, rng);
            const height = new Float32Array(S * S);
            const rough = new Float32Array(S * S);

            const colMain = new THREE.Color(mainHex);
            const colShadow = new THREE.Color(lineHex);
            const img = ctx.createImageData(S, S);
            const d = img.data;

            const courses = 12;
            const courseH = S / courses;

            for (let y = 0; y < S; y++) {
                const courseIdx = Math.floor(y / courseH);
                const localY = y - courseIdx * courseH;
                const t = localY / courseH; // 0 = top tucked edge, 1 = projecting bottom lip
                const jointX = ((courseIdx * 173 + 64) % S);

                for (let x = 0; x < S; x++) {
                    const idx = y * S + x;
                    // Fine horizontal painted wood grain (high-frequency along Y, elongated along X)
                    const grainX = (x * 0.04 + courseIdx * 11.3);
                    const grainSample = fbm[(Math.floor(y * 1.4) % S) * S + (Math.floor(x * 0.25) % S)];
                    const brush = Math.sin(y * 1.35 + grainSample * 6.0) * 0.024 + (grainSample - 0.5) * 0.065;

                    // Crisp clapboard contact shadow right underneath the upper plank's bottom lip (top 3 px of each course)
                    const underShadow = localY < 3.5 ? (1.0 - localY / 3.5) * 0.62 : 0.0;
                    // Subtle chalky dust / sun-fade variation per plank
                    const plankTone = ((courseIdx * 7) % 5 - 2) * 0.015;
                    const buttJoint = Math.abs(x - jointX) < 1.5 ? 0.28 : 0.0;

                    // Subtle bottom-edge specular catch (very soft, non-plastic)
                    const lipLight = localY >= courseH - 2.0 ? 0.045 : 0.0;
                    const slopeShade = (1.0 - t) * 0.05; // top slightly recessed in shadow

                    const shade = Math.max(0.25, 1.0 - underShadow - buttJoint - slopeShade + plankTone + brush + lipLight);
                    const r = colMain.r * shade + colShadow.r * underShadow * 0.45;
                    const g = colMain.g * shade + colShadow.g * underShadow * 0.45;
                    const b = colMain.b * shade + colShadow.b * underShadow * 0.45;

                    const j = idx * 4;
                    d[j] = Math.max(0, Math.min(255, Math.round(r * 255)));
                    d[j + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
                    d[j + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
                    d[j + 3] = 255;

                    // Linear clapboard slope heightfield: crisp step at course boundary, flat-sloped plank face!
                    const jointDip = buttJoint > 0 ? -0.18 : 0.0;
                    height[idx] = Math.max(0, Math.min(1, 0.15 + t * 0.72 + brush * 0.5 + jointDip));
                    // Exterior matte painted wood: 0.85..0.96 roughness so it NEVER looks like plastic!
                    rough[idx] = Math.max(0.82, Math.min(0.98, 0.86 + (1.0 - t) * 0.05 + underShadow * 0.08 + (fbm[idx] - 0.5) * 0.06));
                }
            }
            ctx.putImageData(img, 0, 0);

            // Subtle countersunk nail heads along stud spacing (every 128px)
            ctx.fillStyle = 'rgba(18,22,20,0.22)';
            for (let row = 0; row < courses; row++) {
                const ny = Math.round((row + 0.72) * courseH);
                for (let nx = 32; nx < S; nx += 128) {
                    ctx.beginPath(); ctx.arc(nx + (row % 2) * 16, ny, 1.4, 0, Math.PI * 2); ctx.fill();
                }
            }

            this.heightMaps[key] = this._normalFromHeight(height, S, S, 1.55);
            this.roughMaps[key] = this._roughnessTex(rough, S, S);
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        _makeNuketownGrassTexture() {
            if (this.textures.nuketown_grass) return this.textures.nuketown_grass;
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            const rng = seededNoise(8812);
            const fbm = this._fbmField(S, S, rng);
            const height = new Float32Array(S * S);
            const rough = new Float32Array(S * S);
            const img = ctx.createImageData(S, S);
            const d = img.data;

            for (let y = 0; y < S; y++) {
                const stripe = Math.sin(y / S * Math.PI * 4) * 0.03;
                for (let x = 0; x < S; x++) {
                    const idx = y * S + x;
                    const n = fbm[idx];
                    const blade = (fbm[((y * 3) % S) * S + ((x * 3) % S)] - 0.5) * 0.16;
                    const dryPatch = Math.max(0, n - 0.62) * 0.45;
                    const r = 0.28 + blade * 0.5 + dryPatch * 0.35 + stripe;
                    const g = 0.36 + blade * 0.7 + dryPatch * 0.15 + stripe;
                    const b = 0.17 + blade * 0.3 + dryPatch * 0.10;
                    const j = idx * 4;
                    d[j] = Math.max(0, Math.min(255, Math.round(r * 255)));
                    d[j + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
                    d[j + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
                    d[j + 3] = 255;
                    height[idx] = 0.5 + blade * 1.4;
                    rough[idx] = 0.90 + n * 0.08;
                }
            }
            ctx.putImageData(img, 0, 0);
            this.heightMaps.nuketown_grass = this._normalFromHeight(height, S, S, 1.35);
            this.roughMaps.nuketown_grass = this._roughnessTex(rough, S, S);
            return (this.textures.nuketown_grass = this._toTex(c, 1, 1, true));
        }

        /** Painted sheet metal with riveted panel seams and subtle clearcoat wear for vehicles/aircraft. */
        _makeVehiclePaintTexture(key, mainHex, darkHex, trimHex) {
            if (this.textures[key]) return this.textures[key];
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            const fbm = this._fbmField(S, S, seededNoise(key.length * 4111));
            const height = new Float32Array(S * S);
            const rough = new Float32Array(S * S);

            ctx.fillStyle = mainHex;
            ctx.fillRect(0, 0, S, S);
            // Subtle painted steel mottling
            const img = ctx.getImageData(0, 0, S, S);
            const d = img.data;
            for (let i = 0, j = 0; i < fbm.length; i++, j += 4) {
                const n = (fbm[i] - 0.5) * 18;
                d[j] = Math.max(0, Math.min(255, d[j] + n));
                d[j + 1] = Math.max(0, Math.min(255, d[j + 1] + n));
                d[j + 2] = Math.max(0, Math.min(255, d[j + 2] + n));
                height[i] = 0.72 + (fbm[i] - 0.5) * 0.04;
                rough[i] = 0.36 + (fbm[i] - 0.5) * 0.16;
            }
            ctx.putImageData(img, 0, 0);

            // Clean riveted sheet-metal panel seams & horizontal rub rail
            ctx.strokeStyle = darkHex;
            ctx.lineWidth = 3;
            ctx.strokeRect(2, 2, S - 4, S - 4);
            ctx.beginPath(); ctx.moveTo(0, S * 0.5); ctx.lineTo(S, S * 0.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(S * 0.5, 0); ctx.lineTo(S * 0.5, S); ctx.stroke();

            ctx.fillStyle = trimHex;
            ctx.fillRect(0, S * 0.46, S, 10);

            ctx.fillStyle = darkHex;
            for (let p = 24; p < S; p += 48) {
                ctx.beginPath(); ctx.arc(p, 16, 2.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(p, S * 0.5 + 14, 2.2, 0, Math.PI * 2); ctx.fill();
            }

            // Carve panel seam lines into heightfield
            for (let x = 0; x < S; x++) {
                height[x] = 0.25;
                height[(S >> 1) * S + x] = 0.28;
            }
            for (let y = 0; y < S; y++) {
                height[y * S] = 0.25;
                height[y * S + (S >> 1)] = 0.28;
            }
            this.heightMaps[key] = this._normalFromHeight(height, S, S, 1.4);
            this.roughMaps[key] = this._roughnessTex(rough, S, S);
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        _makeRoofShingleTexture() {
            if (this.textures.dark_slate_roof) return this.textures.dark_slate_roof;
            const S = 512, c = this._makeCanvas(S, S);
            const ctx = c.getContext('2d');
            const rng = seededNoise(6619);
            const fbm = this._fbmField(S, S, rng);
            const height = new Float32Array(S * S);
            const rough = new Float32Array(S * S);

            ctx.fillStyle = '#252930';
            ctx.fillRect(0, 0, S, S);
            const rows = 16, rh = S / rows, sw = 64;
            for (let r = 0; r < rows; r++) {
                const ox = (r % 2) * 32;
                for (let col = -1; col < 9; col++) {
                    const sx = col * sw + ox;
                    const sy = r * rh;
                    const v = Math.round((rng() - 0.5) * 18);
                    ctx.fillStyle = `rgb(${38 + v},${42 + v},${49 + v})`;
                    ctx.fillRect(sx + 1, sy + 1, sw - 2, rh - 2);
                    ctx.fillStyle = 'rgba(10,12,16,0.55)';
                    ctx.fillRect(sx, sy, sw, 3);
                }
            }
            for (let y = 0; y < S; y++) {
                const ly = (y % rh) / rh;
                for (let x = 0; x < S; x++) {
                    const idx = y * S + x;
                    height[idx] = 0.2 + ly * 0.65 + (fbm[idx] - 0.5) * 0.15;
                    rough[idx] = 0.88 + (fbm[idx] - 0.5) * 0.08;
                }
            }
            this.heightMaps.dark_slate_roof = this._normalFromHeight(height, S, S, 1.6);
            this.roughMaps.dark_slate_roof = this._roughnessTex(rough, S, S);
            return (this.textures.dark_slate_roof = this._toTex(c, 1, 1, true));
        }

        getCamoMaterial(camoId, baseHex = 0x2a2f38, isPaP = false) {
            if (isPaP) {
                if (!this.papTex) {
                    this.papCanvas = this._makeCanvas(256, 256);
                    this.papCtx = this.papCanvas.getContext('2d');
                    this.papTex = this._toTex(this.papCanvas, 2, 2, true);
                    this._drawPaPFrame(0);
                }
                return new THREE.MeshStandardMaterial({
                    map: this.papTex,
                    emissive: 0x7c3aed,
                    emissiveMap: this.papTex,
                    emissiveIntensity: 0.75,
                    roughness: 0.25,
                    metalness: 0.85
                });
            }

            if (!camoId || camoId === 'default') {
                return new THREE.MeshStandardMaterial({
                    color: baseHex,
                    roughness: 0.42,
                    metalness: 0.78
                });
            }

            if (camoId === 'dark_matter') {
                if (!this.darkMatterTex) {
                    this.darkMatterCanvas = this._makeCanvas(256, 256);
                    this.darkMatterCtx = this.darkMatterCanvas.getContext('2d');
                    this.darkMatterTex = this._toTex(this.darkMatterCanvas, 2, 2, true);
                    this._drawDarkMatterFrame(0);
                }
                return new THREE.MeshStandardMaterial({
                    map: this.darkMatterTex,
                    emissive: 0x9333ea,
                    emissiveMap: this.darkMatterTex,
                    emissiveIntensity: 0.65,
                    roughness: 0.28,
                    metalness: 0.72
                });
            }

            if (camoId === 'gold') {
                return new THREE.MeshStandardMaterial({
                    color: 0xfacc15,
                    roughness: 0.20,
                    metalness: 0.94
                });
            }
            if (camoId === 'platinum') {
                return new THREE.MeshStandardMaterial({
                    color: 0xe2e8f0,
                    roughness: 0.22,
                    metalness: 0.92
                });
            }

            if (!this.camoTextures[camoId]) {
                const c = this._makeCanvas(256, 256);
                const ctx = c.getContext('2d');
                const rng = seededNoise(camoId.length * 7919);

                if (camoId === 'woodland') {
                    ctx.fillStyle = '#3f5a36';
                    ctx.fillRect(0, 0, 256, 256);
                    const cols = ['#24331d', '#5c482e', '#1a2215'];
                    for (let i = 0; i < 45; i++) {
                        ctx.fillStyle = cols[i % cols.length];
                        ctx.beginPath();
                        ctx.ellipse(rng() * 256, rng() * 256, 18 + rng() * 35, 8 + rng() * 14, rng() * 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (camoId === 'urban') {
                    ctx.fillStyle = '#64748b';
                    ctx.fillRect(0, 0, 256, 256);
                    const cols = ['#94a3b8', '#334155', '#e2e8f0', '#1e293b'];
                    for (let i = 0; i < 160; i++) {
                        ctx.fillStyle = cols[i % cols.length];
                        ctx.fillRect(Math.floor(rng() * 16) * 16, Math.floor(rng() * 16) * 16, 16 * (1 + Math.floor(rng() * 2)), 16);
                    }
                } else if (camoId === 'red_tiger' || camoId === 'blue_tiger') {
                    const bg = camoId === 'red_tiger' ? '#241818' : '#111827';
                    const stripe = camoId === 'red_tiger' ? '#dc2626' : '#2563eb';
                    const stripe2 = camoId === 'red_tiger' ? '#7f1d1d' : '#1e3a8a';
                    ctx.fillStyle = bg;
                    ctx.fillRect(0, 0, 256, 256);
                    for (let i = 0; i < 36; i++) {
                        ctx.strokeStyle = i % 2 === 0 ? stripe : stripe2;
                        ctx.lineWidth = 6 + rng() * 10;
                        ctx.beginPath();
                        const y = rng() * 256;
                        ctx.moveTo(0, y);
                        ctx.bezierCurveTo(85, y - 35 + rng() * 70, 170, y - 35 + rng() * 70, 256, y - 20 + rng() * 40);
                        ctx.stroke();
                    }
                } else if (camoId === 'arctic') {
                    ctx.fillStyle = '#e2e8f0';
                    ctx.fillRect(0, 0, 256, 256);
                    for (let i = 0; i < 40; i++) {
                        ctx.fillStyle = i % 2 === 0 ? '#94a3b8' : '#cbd5e1';
                        ctx.fillRect(rng() * 220, rng() * 220, 24 + rng() * 40, 14 + rng() * 20);
                    }
                } else if (camoId === 'carbon') {
                    ctx.fillStyle = '#18181b';
                    ctx.fillRect(0, 0, 256, 256);
                    for (let y = 0; y < 256; y += 8) {
                        for (let x = 0; x < 256; x += 8) {
                            ctx.fillStyle = ((x + y) / 8) % 2 === 0 ? '#27272a' : '#111113';
                            ctx.fillRect(x, y, 7, 7);
                        }
                    }
                }

                this.camoTextures[camoId] = this._toTex(c, 2, 2, true);
            }

            return new THREE.MeshStandardMaterial({
                map: this.camoTextures[camoId],
                roughness: 0.42,
                metalness: 0.65
            });
        }

        _drawDarkMatterFrame(t) {
            const ctx = this.darkMatterCtx;
            if (!ctx) return;
            const g = ctx.createLinearGradient(0, 0, 256, 256);
            g.addColorStop(0, '#120524');
            g.addColorStop(0.5, '#3b0764');
            g.addColorStop(1, '#090214');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 256, 256);

            for (let i = 0; i < 10; i++) {
                const x = (Math.sin(t * 0.9 + i * 1.1) * 0.4 + 0.5) * 256;
                const y = (Math.cos(t * 0.7 + i * 1.7) * 0.4 + 0.5) * 256;
                const rg = ctx.createRadialGradient(x, y, 2, x, y, 52);
                rg.addColorStop(0, i % 2 === 0 ? 'rgba(244,114,182,0.85)' : 'rgba(168,85,247,0.85)');
                rg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = rg;
                ctx.fillRect(0, 0, 256, 256);
            }
            this.darkMatterTex.needsUpdate = true;
        }

        _drawPaPFrame(t) {
            const ctx = this.papCtx;
            if (!ctx) return;
            ctx.fillStyle = '#1b1428';
            ctx.fillRect(0, 0, 256, 256);
            const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
            ctx.strokeStyle = `rgba(192,132,252,${0.45 + pulse * 0.45})`;
            ctx.lineWidth = 3;
            for (let i = 0; i < 256; i += 32) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo((i + 64) % 256, 128);
                ctx.lineTo(i, 256);
                ctx.stroke();
            }
            ctx.strokeStyle = `rgba(56,189,248,${0.4 + (1 - pulse) * 0.4})`;
            ctx.lineWidth = 2;
            for (let y = 16; y < 256; y += 32) {
                ctx.strokeRect(12, y, 232, 16);
            }
            this.papTex.needsUpdate = true;
        }

        updateAnimatedTextures(dt, elapsed) {
            this._animAccum += dt;
            if (this._animAccum < 0.05) return; // 20Hz canvas update is super smooth and cheap
            this._animAccum = 0;
            if (this.darkMatterCtx) this._drawDarkMatterFrame(elapsed);
            if (this.papCtx) this._drawPaPFrame(elapsed);
        }

        createChalkWallBuyTexture(weaponName, cost) {
            const c = this._makeCanvas(512, 256);
            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, 512, 256);

            // Soft arcane chalk halo behind drawing
            const glow = ctx.createRadialGradient(256, 128, 12, 256, 128, 220);
            glow.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
            glow.addColorStop(0.6, 'rgba(186, 230, 253, 0.08)');
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, 512, 256);

            // Double distressed chalk frame + corner crosshairs
            ctx.strokeStyle = 'rgba(224, 242, 254, 0.88)';
            ctx.lineWidth = 4;
            ctx.setLineDash([16, 6]);
            ctx.strokeRect(14, 14, 484, 228);
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.40)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 10]);
            ctx.strokeRect(22, 22, 468, 212);
            ctx.setLineDash([]);

            const upper = String(weaponName || '').toUpperCase();
            ctx.save();
            ctx.shadowColor = 'rgba(125, 211, 252, 0.75)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(224, 244, 255, 0.94)';
            ctx.strokeStyle = 'rgba(224, 244, 255, 0.94)';

            if (upper.includes('GRENADE')) {
                // Sculpted Pineapple Frag Grenade Chalk Mural
                ctx.beginPath();
                ctx.ellipse(256, 134, 34, 44, 0, 0, Math.PI * 2);
                ctx.lineWidth = 5;
                ctx.stroke();
                ctx.fillRect(240, 74, 32, 16);
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(270, 78); ctx.lineTo(304, 92); ctx.lineTo(298, 136);
                ctx.stroke();
                ctx.beginPath(); ctx.arc(230, 82, 11, 0, Math.PI * 2); ctx.stroke();
            } else if (upper.includes('ARMOR')) {
                // Tactical Ballistic Plate Vest + Chevron Chalk Mural
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(212, 82); ctx.lineTo(234, 72); ctx.lineTo(278, 72); ctx.lineTo(300, 82);
                ctx.lineTo(294, 162); ctx.lineTo(256, 178); ctx.lineTo(218, 162); ctx.closePath();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(232, 116); ctx.lineTo(256, 98); ctx.lineTo(280, 116);
                ctx.moveTo(232, 136); ctx.lineTo(256, 118); ctx.lineTo(280, 136);
                ctx.stroke();
            } else {
                // Detailed Rifle Chalk Silhouette w/ Optic, Barrel, Mag & Grip
                ctx.fillRect(114, 96, 200, 24);
                ctx.fillRect(314, 102, 108, 9);
                ctx.fillRect(422, 98, 16, 17);
                ctx.fillRect(166, 78, 64, 14);
                ctx.fillRect(184, 92, 10, 5);
                ctx.fillRect(220, 92, 10, 5);
                ctx.save(); ctx.translate(216, 120); ctx.rotate(0.22); ctx.fillRect(0, 0, 26, 48); ctx.restore();
                ctx.fillRect(138, 120, 20, 42);
                ctx.beginPath(); ctx.moveTo(56, 98); ctx.lineTo(114, 98); ctx.lineTo(114, 122); ctx.lineTo(56, 134); ctx.closePath(); ctx.fill();
            }
            ctx.restore();

            ctx.font = 'bold 34px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(125, 211, 252, 0.85)';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#e0f2fe';
            ctx.fillText(upper, 256, 56);

            ctx.shadowColor = 'rgba(250, 204, 21, 0.7)';
            ctx.font = 'bold 32px Consolas, monospace';
            ctx.fillStyle = '#fde047';
            ctx.fillText(cost + ' PTS', 256, 218);

            const tex = new THREE.CanvasTexture(c);
            if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        createPerkSignTexture(perkName, colorHex) {
            const c = this._makeCanvas(256, 128);
            const ctx = c.getContext('2d');
            const bgGrad = ctx.createRadialGradient(128, 64, 10, 128, 64, 136);
            bgGrad.addColorStop(0, '#182236');
            bgGrad.addColorStop(1, '#070a12');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 256, 128);

            // Art-Deco backlit neon inner aura
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = colorHex;
            ctx.fillRect(14, 14, 228, 100);
            ctx.restore();

            // Double Art-Deco bezel border + corner rivets
            ctx.strokeStyle = colorHex;
            ctx.lineWidth = 6;
            ctx.strokeRect(6, 6, 244, 116);
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 2;
            ctx.strokeRect(14, 14, 228, 100);
            ctx.fillStyle = '#e2e8f0';
            for (const [rx, ry] of [[20, 20], [236, 20], [20, 108], [236, 108]]) {
                ctx.beginPath(); ctx.arc(rx, ry, 3.2, 0, Math.PI * 2); ctx.fill();
            }

            // Glass highlight streak
            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(14, 14); ctx.lineTo(130, 14); ctx.lineTo(54, 114); ctx.lineTo(14, 114); ctx.closePath();
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.shadowColor = colorHex;
            ctx.shadowBlur = 14;
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 26px Bahnschrift, Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(perkName || '').toUpperCase(), 128, 64, 212);
            ctx.strokeStyle = colorHex;
            ctx.lineWidth = 1.2;
            ctx.strokeText(String(perkName || '').toUpperCase(), 128, 64, 212);
            ctx.restore();

            const tex = new THREE.CanvasTexture(c);
            if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        createPowerArrowTexture(dir = 'right') {
            const key = `power_arrow_subtle_${dir}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 128);
            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, 256, 128);

            // Barely-noticeable, faded hand-scrawled chalk/paint "power" + thin arrow
            ctx.font = '600 26px Consolas, Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(175, 68, 55, 0.34)';
            ctx.fillText('power', 128, 46);

            ctx.strokeStyle = 'rgba(175, 68, 55, 0.34)';
            ctx.fillStyle = 'rgba(175, 68, 55, 0.34)';
            ctx.lineWidth = 3;

            ctx.save();
            ctx.translate(128, 82);
            if (dir === 'left') ctx.scale(-1, 1);
            else if (dir === 'up') ctx.rotate(-Math.PI * 0.5);
            else if (dir === 'down') ctx.rotate(Math.PI * 0.5);

            ctx.beginPath();
            ctx.moveTo(-36, 0);
            ctx.lineTo(26, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(36, 0);
            ctx.lineTo(18, -9);
            ctx.lineTo(18, 9);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            const tex = new THREE.CanvasTexture(c);
            if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
            this.textures[key] = tex;
            return tex;
        }

        createWallWritingTexture(text, color = 'rgba(170, 24, 24, 0.85)', subText = '') {
            const key = `wall_write_${text}_${color}_${subText}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(512, 256);
            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, 512, 256);
            ctx.font = '900 84px Bahnschrift, Impact, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = color;
            ctx.fillText(text, 256, subText ? 105 : 128);
            if (subText) {
                ctx.font = 'bold 34px Consolas, monospace';
                ctx.fillText(subText, 256, 185);
            }
            const tex = new THREE.CanvasTexture(c);
            if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
            this.textures[key] = tex;
            return tex;
        }

        _drawNuketownSignCanvas(c, popCount) {
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#0c1f2c';
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 10;
            ctx.strokeRect(8, 8, c.width - 16, c.height - 16);

            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 26px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('WELCOME TO', c.width * 0.5, 44);

            ctx.fillStyle = '#f97316';
            ctx.font = '900 56px Bahnschrift, Impact, sans-serif';
            ctx.fillText('NUKETOWN', c.width * 0.5, 102);

            ctx.fillStyle = '#111827';
            ctx.fillRect(96, 128, c.width - 192, 92);
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 4;
            ctx.strokeRect(96, 128, c.width - 192, 92);

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 22px Consolas, monospace';
            ctx.fillText('POPULATION', c.width * 0.5, 156);

            ctx.fillStyle = '#ef4444';
            ctx.font = '900 46px Consolas, monospace';
            ctx.fillText(String(Math.max(0, Math.floor(popCount))).padStart(2, '0'), c.width * 0.5, 204);
        }

        createNuketownSignTexture(popCount = 99) {
            const c = this._makeCanvas(512, 256);
            this._drawNuketownSignCanvas(c, popCount);
            const tex = new THREE.CanvasTexture(c);
            if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        updateNuketownSignTexture(tex, popCount) {
            if (!tex || !tex.image) return;
            this._drawNuketownSignCanvas(tex.image, popCount);
            tex.needsUpdate = true;
        }

        /* ====================================================================
           PROCEDURAL TACTICAL WEAPON & ZOMBIE PBR TEXTURES (CACHED)
        ==================================================================== */
        createBumpTexture(kind = 'metal') {
            const key = `bump_${kind}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            const rng = seededNoise(kind.length * 4099 + kind.charCodeAt(0) * 131);
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, 256, 256);

            if (kind === 'metal') {
                for (let y = 0; y < 256; y += 2) {
                    const shade = 116 + Math.floor(Math.sin(y * 1.9) * 14 + rng() * 14);
                    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
                    ctx.fillRect(0, y, 256, 2);
                }
                ctx.strokeStyle = '#383838';
                ctx.lineWidth = 3;
                ctx.strokeRect(8, 8, 240, 240);
                for (let s = 0; s < 30; s++) {
                    const sx = rng() * 240 + 8;
                    const sy = rng() * 240 + 8;
                    ctx.strokeStyle = s % 2 ? '#b8b8b8' : '#4a4a4a';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + (rng() - 0.5) * 28, sy + (rng() - 0.5) * 12);
                    ctx.stroke();
                }
            } else if (kind === 'wood') {
                for (let y = 0; y < 256; y += 2) {
                    const wave = Math.sin(y * 0.14) * 12;
                    const shade = 105 + Math.floor(Math.sin(y * 0.35) * 24 + rng() * 14);
                    ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.bezierCurveTo(85, y + wave, 170, y - wave, 256, y);
                    ctx.stroke();
                }
            } else if (kind === 'polymer') {
                for (let y = 0; y < 256; y += 8) {
                    for (let x = 0; x < 256; x += 8) {
                        const ox = (y % 16 === 0) ? 0 : 4;
                        ctx.fillStyle = '#cfcfcf';
                        ctx.fillRect((x + ox) % 256, y, 3, 3);
                        ctx.fillStyle = '#3c3c3c';
                        ctx.fillRect((x + ox + 3) % 256, y + 3, 3, 3);
                    }
                }
            } else if (kind === 'perforated') {
                ctx.fillStyle = '#c8c8c8';
                ctx.fillRect(0, 0, 256, 256);
                ctx.fillStyle = '#181818';
                for (let row = 0; row < 8; row++) {
                    const ox = (row % 2) * 16;
                    for (let col = 0; col < 8; col++) {
                        ctx.beginPath();
                        ctx.arc(col * 32 + ox + 16, row * 32 + 16, 9, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            } else if (kind === 'cloth') {
                for (let y = 0; y < 256; y += 4) {
                    ctx.fillStyle = y % 8 === 0 ? '#a4a4a4' : '#585858';
                    ctx.fillRect(0, y, 256, 2);
                }
                for (let x = 0; x < 256; x += 4) {
                    ctx.fillStyle = 'rgba(40,40,40,0.45)';
                    ctx.fillRect(x, 0, 2, 256);
                }
                for (let i = 0; i < 18; i++) {
                    ctx.fillStyle = i % 2 ? '#b8b8b8' : '#3a3a3a';
                    ctx.fillRect(rng() * 230, rng() * 230, 8 + rng() * 22, 6 + rng() * 14);
                }
            } else {
                // 'skin': mottled pockmarks, veins, sinew ridges
                for (let i = 0; i < 90; i++) {
                    const r = 4 + rng() * 14;
                    const shade = i % 3 === 0 ? 70 : 165;
                    ctx.fillStyle = `rgba(${shade},${shade},${shade},0.35)`;
                    ctx.beginPath();
                    ctx.arc(rng() * 256, rng() * 256, r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.strokeStyle = '#3a3a3a';
                ctx.lineWidth = 2;
                for (let v = 0; v < 20; v++) {
                    const vx = rng() * 220 + 18;
                    const vy = rng() * 220 + 18;
                    ctx.beginPath();
                    ctx.moveTo(vx, vy);
                    ctx.lineTo(vx + (rng() - 0.5) * 32, vy + 24);
                    ctx.lineTo(vx + (rng() - 0.5) * 28, vy + 46);
                    ctx.stroke();
                }
            }

            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.textures[key] = tex;
            return tex;
        }

        createGunmetalTexture(baseHex = 0x262c36) {
            const key = `gunmetal_${baseHex}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            const col = new THREE.Color(baseHex);
            const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, 256, 256);

            // Fine horizontal brushed parkerized metal grain + specular oil sheen
            for (let y = 0; y < 256; y += 2) {
                const v = (Math.sin(y * 1.7) * 14 + ((y * 37) % 15) - 7);
                ctx.fillStyle = v > 0 ? `rgba(255,255,255,${(v * 0.0055).toFixed(3)})` : `rgba(0,0,0,${(-v * 0.007).toFixed(3)})`;
                ctx.fillRect(0, y, 256, 2);
            }
            // Machined receiver bevel seam + edge wear scratches
            ctx.strokeStyle = 'rgba(0,0,0,0.44)';
            ctx.lineWidth = 2;
            ctx.strokeRect(6, 6, 244, 244);
            ctx.strokeStyle = 'rgba(226,232,240,0.24)';
            ctx.lineWidth = 1;
            ctx.strokeRect(8, 8, 240, 240);
            ctx.fillStyle = 'rgba(0,0,0,0.20)';
            ctx.fillRect(0, 124, 256, 4);
            // Machined rivets & pin housings
            for (const [rx, ry] of [[22, 22], [234, 22], [22, 234], [234, 234], [128, 22], [128, 234]]) {
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.beginPath(); ctx.arc(rx, ry, 4.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.28)';
                ctx.beginPath(); ctx.arc(rx - 1, ry - 1, 2.2, 0, Math.PI * 2); ctx.fill();
            }
            // Battle-worn silver metallic edge scratches
            ctx.strokeStyle = 'rgba(226,232,240,0.20)';
            for (let s = 0; s < 32; s++) {
                const sx = (s * 73) % 240 + 8;
                const sy = (s * 41) % 240 + 8;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + ((s % 5) - 2) * 11, sy + ((s % 3) - 1) * 5);
                ctx.stroke();
            }
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        createWalnutWoodTexture(baseHex = 0x6e3f1d) {
            const key = `gun_walnut_${baseHex}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            const col = new THREE.Color(baseHex);
            const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
            const grad = ctx.createLinearGradient(0, 0, 256, 256);
            grad.addColorStop(0, `rgb(${Math.min(255, r + 18)},${Math.min(255, g + 12)},${Math.min(255, b + 8)})`);
            grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
            grad.addColorStop(1, `rgb(${Math.max(0, r - 28)},${Math.max(0, g - 20)},${Math.max(0, b - 14)})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 256, 256);
            for (let y = 0; y < 256; y += 3) {
                const wave = Math.sin(y * 0.13 + (baseHex & 7)) * 16;
                ctx.strokeStyle = y % 6 === 0 ? 'rgba(22,9,2,0.34)' : 'rgba(225,160,96,0.18)';
                ctx.lineWidth = y % 9 === 0 ? 2.6 : 1.5;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.bezierCurveTo(85, y + wave, 170, y - wave, 256, y);
                ctx.stroke();
            }
            // Wood knot
            ctx.strokeStyle = 'rgba(25,10,2,0.32)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(140, 118, 26, 10, 0.25, 0, Math.PI * 2);
            ctx.stroke();
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        createWoodFurnitureTexture() {
            return this.createWalnutWoodTexture(0x6e3f1d);
        }

        createBakeliteTexture(baseHex = 0x9b3b1e) {
            const key = `gun_bakelite_${baseHex}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            const col = new THREE.Color(baseHex);
            const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, 256, 256);
            // Marbled Soviet AG-4S resin swirls + molded grip ribs
            const rng = seededNoise(baseHex + 911);
            for (let i = 0; i < 42; i++) {
                ctx.fillStyle = i % 2 ? 'rgba(235,120,55,0.18)' : 'rgba(42,12,6,0.22)';
                ctx.beginPath();
                ctx.ellipse(rng() * 256, rng() * 256, 14 + rng() * 34, 4 + rng() * 10, rng() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            for (let y = 16; y < 256; y += 24) {
                ctx.fillStyle = 'rgba(0,0,0,0.28)';
                ctx.fillRect(0, y, 256, 4);
                ctx.fillStyle = 'rgba(255,190,140,0.12)';
                ctx.fillRect(0, y + 4, 256, 2);
            }
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        createBrushedSteelTexture(baseHex = 0xcbd5e1) {
            const key = `gun_brushed_${baseHex}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            const col = new THREE.Color(baseHex);
            const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
            const grad = ctx.createLinearGradient(0, 0, 256, 256);
            grad.addColorStop(0, `rgb(${Math.min(255, r + 24)},${Math.min(255, g + 24)},${Math.min(255, b + 24)})`);
            grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
            grad.addColorStop(1, `rgb(${Math.max(0, r - 35)},${Math.max(0, g - 35)},${Math.max(0, b - 35)})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 256, 256);
            for (let y = 0; y < 256; y += 2) {
                ctx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
                ctx.fillRect(0, y, 256, 1);
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.25)';
            ctx.lineWidth = 2;
            ctx.strokeRect(4, 4, 248, 248);
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        createCerakoteTexture(baseHex = 0x8c7a5b) {
            const key = `gun_cerakote_${baseHex}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            const col = new THREE.Color(baseHex);
            const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, 256, 256);
            const rng = seededNoise(baseHex + 313);
            for (let i = 0; i < 420; i++) {
                ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
                ctx.fillRect(rng() * 256, rng() * 256, 2, 2);
            }
            // CNC machined panel joints + Allen bolts
            ctx.strokeStyle = 'rgba(0,0,0,0.32)';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, 236, 236);
            ctx.beginPath(); ctx.moveTo(10, 128); ctx.lineTo(246, 128); ctx.stroke();
            for (const [bx, by] of [[24, 24], [232, 24], [24, 232], [232, 232]]) {
                ctx.fillStyle = 'rgba(15,18,24,0.65)';
                ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill();
            }
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        createPerforatedMetalTexture(baseHex = 0x22262e) {
            const key = `gun_perf_${baseHex}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            const col = new THREE.Color(baseHex);
            const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, 256, 256);
            for (let row = 0; row < 8; row++) {
                const ox = (row % 2) * 16;
                for (let colI = 0; colI < 8; colI++) {
                    const cx = colI * 32 + ox + 16;
                    const cy = row * 32 + 16;
                    ctx.fillStyle = '#07090d';
                    ctx.beginPath(); ctx.arc(cx, cy, 8.5, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = 'rgba(203,213,225,0.22)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(cx, cy, 9.2, 0.2, Math.PI * 1.1); ctx.stroke();
                }
            }
            return (this.textures[key] = this._toTex(c, 2, 1, true));
        }

        createBrassBeltTexture() {
            const key = 'gun_brass_belt';
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 128);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#181a1f';
            ctx.fillRect(0, 0, 256, 128);
            for (let x = 4; x < 256; x += 22) {
                // Brass cartridge casing
                const grad = ctx.createLinearGradient(x, 0, x + 16, 0);
                grad.addColorStop(0, '#926c15');
                grad.addColorStop(0.5, '#facc15');
                grad.addColorStop(1, '#854d0e');
                ctx.fillStyle = grad;
                ctx.fillRect(x, 30, 15, 84);
                // Copper bullet projectile tip
                ctx.fillStyle = '#b45309';
                ctx.beginPath();
                ctx.moveTo(x + 2, 30);
                ctx.lineTo(x + 7.5, 6);
                ctx.lineTo(x + 13, 30);
                ctx.closePath();
                ctx.fill();
                // Steel disintegrating belt link
                ctx.fillStyle = '#334155';
                ctx.fillRect(x - 3, 56, 21, 14);
                ctx.fillRect(x - 3, 86, 21, 10);
            }
            return (this.textures[key] = this._toTex(c, 2, 1, true));
        }

        createPolymerGripTexture() {
            const key = 'gun_polymer_stipple';
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(128, 128);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#141820';
            ctx.fillRect(0, 0, 128, 128);
            for (let y = 0; y < 128; y += 8) {
                for (let x = 0; x < 128; x += 8) {
                    const ox = (y % 16 === 0) ? 0 : 4;
                    ctx.fillStyle = 'rgba(255,255,255,0.09)';
                    ctx.fillRect((x + ox) % 128, y, 3, 3);
                    ctx.fillStyle = 'rgba(0,0,0,0.48)';
                    ctx.fillRect((x + ox + 2) % 128, y + 2, 3, 3);
                }
            }
            const tex = this._toTex(c, 3, 3, true);
            this.textures[key] = tex;
            return tex;
        }

        createZombieSkinTexture(skinHex = 0x5c7a56) {
            const key = `zskin_${skinHex}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(128, 128);
            const ctx = c.getContext('2d');
            const col = new THREE.Color(skinHex);
            const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, 128, 128);
            for (let i = 0; i < 48; i++) {
                const px = (i * 53) % 120 + 4;
                const py = (i * 31) % 120 + 4;
                const rad = 5 + (i % 9);
                ctx.fillStyle = i % 3 === 0 ? 'rgba(18,10,12,0.28)' : 'rgba(205,220,188,0.16)';
                ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
            }
            ctx.strokeStyle = 'rgba(38,12,24,0.52)';
            ctx.lineWidth = 1.6;
            for (let v = 0; v < 14; v++) {
                const vx = (v * 37) % 110 + 9;
                const vy = (v * 23) % 110 + 9;
                ctx.beginPath();
                ctx.moveTo(vx, vy);
                ctx.lineTo(vx + ((v % 3) - 1) * 14, vy + 12);
                ctx.lineTo(vx + ((v % 5) - 2) * 10, vy + 24);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(125,14,18,0.55)';
            for (let bl = 0; bl < 9; bl++) {
                ctx.beginPath();
                ctx.arc((bl * 43 + 17) % 114 + 7, (bl * 29 + 11) % 114 + 7, 3 + (bl % 4), 0, Math.PI * 2);
                ctx.fill();
            }
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        createMilitaryFatigueTexture(style = 'bdu', clothHex = 0x2c343f) {
            const key = `zmil_${style}_${clothHex}`;
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(128, 128);
            const ctx = c.getContext('2d');
            const col = new THREE.Color(clothHex);
            const r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, 128, 128);
            const rng = seededNoise(style.length * 1031 + clothHex);

            if (style === 'bdu') {
                const patches = ['rgba(28,36,20,0.45)', 'rgba(84,68,42,0.38)', 'rgba(14,16,12,0.42)'];
                for (let i = 0; i < 22; i++) {
                    ctx.fillStyle = patches[i % patches.length];
                    ctx.beginPath();
                    ctx.ellipse(rng() * 128, rng() * 128, 10 + rng() * 20, 6 + rng() * 12, rng() * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.strokeStyle = 'rgba(0,0,0,0.42)';
                ctx.lineWidth = 2;
                ctx.strokeRect(18, 22, 34, 38);
                ctx.strokeRect(76, 22, 34, 38);
            } else if (style === 'soviet') {
                for (let y = 0; y < 128; y += 3) {
                    ctx.fillStyle = y % 6 === 0 ? 'rgba(255,240,200,0.06)' : 'rgba(10,10,8,0.16)';
                    ctx.fillRect(0, y, 128, 2);
                }
                ctx.fillStyle = '#ca8a04';
                for (const by of [28, 60, 92]) {
                    ctx.beginPath(); ctx.arc(64, by, 3.5, 0, Math.PI * 2); ctx.fill();
                }
            } else if (style === 'hazmat') {
                ctx.fillStyle = 'rgba(250,204,21,0.22)';
                ctx.fillRect(0, 56, 128, 12);
                ctx.fillStyle = 'rgba(15,15,15,0.45)';
                ctx.fillRect(0, 68, 128, 4);
                for (let i = 0; i < 12; i++) {
                    ctx.fillStyle = 'rgba(74,222,128,0.26)';
                    ctx.beginPath(); ctx.arc(rng() * 128, rng() * 128, 4 + rng() * 8, 0, Math.PI * 2); ctx.fill();
                }
            } else if (style === 'swat') {
                for (let y = 0; y < 128; y += 8) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                    ctx.strokeRect(0, y, 128, 8);
                }
                for (let x = 0; x < 128; x += 8) {
                    ctx.fillStyle = 'rgba(0,0,0,0.16)';
                    ctx.fillRect(x, 0, 2, 128);
                }
            } else if (style === 'lab') {
                ctx.fillStyle = 'rgba(226,232,240,0.40)';
                ctx.fillRect(0, 0, 128, 128);
                ctx.fillStyle = 'rgba(136,19,24,0.58)';
                for (let i = 0; i < 10; i++) {
                    ctx.beginPath(); ctx.arc(rng() * 128, rng() * 128, 5 + rng() * 10, 0, Math.PI * 2); ctx.fill();
                }
            }

            // Common weave, fabric slashes & bloodstains
            for (let y = 0; y < 128; y += 4) {
                ctx.fillStyle = y % 8 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.14)';
                ctx.fillRect(0, y, 128, 1.5);
            }
            ctx.strokeStyle = 'rgba(10,10,12,0.55)';
            ctx.lineWidth = 2;
            for (let t = 0; t < 5; t++) {
                const tx = (t * 29 + 12) % 98;
                const ty = (t * 47 + 15) % 98;
                ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 18, ty + 6); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(105,14,18,0.48)';
            for (let d = 0; d < 6; d++) {
                ctx.beginPath();
                ctx.arc((d * 39 + 19) % 112 + 8, (d * 51 + 13) % 112 + 8, 4 + (d % 4), 0, Math.PI * 2);
                ctx.fill();
            }
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        createZombieClothTexture(clothHex = 0x2c343f) {
            return this.createMilitaryFatigueTexture('tattered', clothHex);
        }
    }

    BO.Textures = new TextureFactory();
})(window);
