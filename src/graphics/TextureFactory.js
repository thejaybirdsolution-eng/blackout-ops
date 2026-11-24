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
            tex.anisotropy = 4;
            tex.needsUpdate = true;
            return tex;
        }

        _createNoiseTexture(key, w, h, baseHex, variance, speckColor, gridOpts) {
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(w, h);
            const ctx = c.getContext('2d');
            const rng = seededNoise(key.length * 1337 + baseHex.charCodeAt(1) * 97);

            ctx.fillStyle = baseHex;
            ctx.fillRect(0, 0, w, h);

            // Subtle mottled blotches
            for (let i = 0; i < 650; i++) {
                const x = rng() * w;
                const y = rng() * h;
                const r = 2 + rng() * 14;
                const shade = Math.floor((rng() - 0.5) * variance);
                ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade / 255})` : `rgba(0,0,0,${-shade / 255})`;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }

            if (speckColor) {
                ctx.fillStyle = speckColor;
                for (let i = 0; i < 900; i++) {
                    ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2);
                }
            }

            if (gridOpts) {
                ctx.strokeStyle = gridOpts.color;
                ctx.lineWidth = gridOpts.lineWidth || 2;
                const stepX = gridOpts.stepX || 64;
                const stepY = gridOpts.stepY || 64;
                for (let x = 0; x <= w; x += stepX) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.stroke();
                }
                for (let y = 0; y <= h; y += stepY) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                    ctx.stroke();
                }
            }

            const tex = this._toTex(c, 1, 1, true);
            this.textures[key] = tex;
            return tex;
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
                    map = this._createNoiseTexture('bunker_stone', 256, 256, '#43464b', 42, 'rgba(20,22,25,0.28)', { color: 'rgba(15,17,20,0.38)', stepX: 64, stepY: 32, lineWidth: 2 });
                    roughness = 0.92;
                    break;
                case 'concrete':
                    map = this._createNoiseTexture('concrete', 256, 256, '#5c6066', 36, 'rgba(255,255,255,0.08)', { color: 'rgba(30,32,36,0.25)', stepX: 128, stepY: 128, lineWidth: 2 });
                    roughness = 0.88;
                    break;
                case 'asphalt':
                    map = this._createNoiseTexture('asphalt', 256, 256, '#30343a', 32, 'rgba(180,185,195,0.12)', null);
                    roughness = 0.94;
                    break;
                case 'desert_sand':
                    map = this._createNoiseTexture('desert_sand', 256, 256, '#b89b6d', 36, 'rgba(130,98,60,0.22)', null);
                    roughness = 0.95;
                    break;
                case 'brick':
                    map = this._makeBrickTexture();
                    roughness = 0.90;
                    break;
                case 'wood_plank':
                    map = this._makeWoodTexture('wood_plank', '#745334', '#523820');
                    roughness = 0.82;
                    break;
                case 'wood_crate':
                    map = this._makeCrateTexture();
                    roughness = 0.80;
                    break;
                case 'sandbag':
                    map = this._createNoiseTexture('sandbag', 128, 128, '#8d7b5d', 34, 'rgba(60,50,35,0.2)', { color: 'rgba(45,38,26,0.45)', stepX: 64, stepY: 32, lineWidth: 3 });
                    roughness = 0.95;
                    break;
                case 'diamond_plate':
                    map = this._makeDiamondPlateTexture();
                    roughness = 0.42;
                    metalness = 0.72;
                    break;
                case 'rusted_metal':
                    map = this._createNoiseTexture('rusted_metal', 256, 256, '#4c3830', 55, 'rgba(145,75,35,0.32)', null);
                    roughness = 0.65;
                    metalness = 0.55;
                    break;
                case 'lab_panel':
                    map = this._makeLabPanelTexture();
                    roughness = 0.38;
                    metalness = 0.58;
                    break;
                case 'container_blue':
                    map = this._makeContainerTexture('container_blue', '#1e4a7a', '#143356');
                    roughness = 0.55;
                    metalness = 0.45;
                    break;
                case 'container_red':
                    map = this._makeContainerTexture('container_red', '#7f2424', '#561515');
                    roughness = 0.55;
                    metalness = 0.45;
                    break;
                case 'container_olive':
                    map = this._makeContainerTexture('container_olive', '#435334', '#2d3923');
                    roughness = 0.60;
                    metalness = 0.40;
                    break;
                case 'swamp_mud':
                    map = this._createNoiseTexture('swamp_mud', 256, 256, '#2d2a1f', 48, 'rgba(20,25,14,0.35)', null);
                    roughness = 0.94;
                    break;
                case 'swamp_water':
                    map = this._createNoiseTexture('swamp_water', 256, 256, '#17281e', 28, 'rgba(60,110,75,0.16)', null);
                    roughness = 0.22;
                    metalness = 0.15;
                    break;
                case 'theater_carpet':
                    map = this._makeTheaterCarpetTexture();
                    roughness = 0.90;
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
                    map = this._makeWoodTexture('pentagon_panel', '#3c2415', '#24140b');
                    roughness = 0.65;
                    break;
                case 'soviet_concrete':
                    map = this._createNoiseTexture('soviet_concrete', 256, 256, '#5a5f58', 42, 'rgba(30,34,28,0.22)', { color: 'rgba(24,28,24,0.32)', stepX: 128, stepY: 64, lineWidth: 3 });
                    roughness = 0.90;
                    break;
                case 'green_siding':
                    map = this._makeSidingTexture('green_siding', '#3b6e52', '#264b36');
                    roughness = 0.78;
                    break;
                case 'yellow_siding':
                    map = this._makeSidingTexture('yellow_siding', '#c8a93e', '#947a25');
                    roughness = 0.78;
                    break;
                case 'nuketown_grass':
                    map = this._createNoiseTexture('nuketown_grass', 256, 256, '#526334', 44, 'rgba(95,78,42,0.26)', null);
                    roughness = 0.95;
                    break;
                case 'bus_teal':
                    map = this._makeSidingTexture('bus_teal', '#2c7a7b', '#1b4f50');
                    roughness = 0.45;
                    metalness = 0.38;
                    break;
                case 'truck_yellow':
                    map = this._makeSidingTexture('truck_yellow', '#d4a017', '#9c740c');
                    roughness = 0.48;
                    metalness = 0.35;
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
                    map = this._createNoiseTexture('privacy_fence', 256, 256, '#7b5e3f', 32, 'rgba(42,28,16,0.22)', { color: 'rgba(35,24,14,0.48)', stepX: 24, stepY: 128, lineWidth: 2 });
                    roughness = 0.86;
                    break;
                case 'dark_slate_roof':
                    map = this._createNoiseTexture('dark_slate_roof', 256, 256, '#272b33', 28, 'rgba(12,14,18,0.25)', { color: 'rgba(15,17,22,0.45)', stepX: 64, stepY: 32, lineWidth: 2 });
                    roughness = 0.88;
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
                    map = this._createNoiseTexture('plane_hull', 256, 256, '#e2e8f0', 18, 'rgba(100,116,139,0.14)', { color: 'rgba(100,116,139,0.30)', stepX: 64, stepY: 128, lineWidth: 2 });
                    roughness = 0.34;
                    metalness = 0.55;
                    break;
                case 'rust_steel':
                    map = this._createNoiseTexture('rust_steel', 256, 256, '#7c4529', 48, 'rgba(40,18,8,0.30)', { color: 'rgba(55,28,14,0.38)', stepX: 64, stepY: 64, lineWidth: 2 });
                    roughness = 0.72;
                    metalness = 0.52;
                    break;
                case 'castle_stone':
                    map = this._createNoiseTexture('castle_stone', 256, 256, '#575d68', 38, 'rgba(24,26,32,0.26)', { color: 'rgba(20,22,28,0.45)', stepX: 64, stepY: 32, lineWidth: 3 });
                    roughness = 0.92;
                    break;
                case 'castle_battlement':
                    map = this._createNoiseTexture('castle_battlement', 256, 256, '#717885', 30, 'rgba(28,30,36,0.20)', { color: 'rgba(25,28,34,0.38)', stepX: 64, stepY: 48, lineWidth: 2 });
                    roughness = 0.88;
                    break;
                case 'wood_fort':
                    map = this._makeWoodTexture('wood_fort', '#5c3c22', '#3d2614');
                    roughness = 0.85;
                    break;
                default:
                    map = this._createNoiseTexture('concrete', 256, 256, '#5c6066', 36, null, null);
                    break;
            }

            const clonedMap = map.clone();
            clonedMap.repeat.set(repX, repY);
            clonedMap.needsUpdate = true;

            const mat = new THREE.MeshStandardMaterial({
                map: clonedMap,
                roughness,
                metalness,
                emissive,
                emissiveIntensity
            });
            this.materials[cacheKey] = mat;
            return mat;
        }

        _makeBrickTexture() {
            if (this.textures.brick) return this.textures.brick;
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            const rng = seededNoise(9911);
            ctx.fillStyle = '#9a846b';
            ctx.fillRect(0, 0, 256, 256);
            const bw = 64, bh = 32;
            for (let row = 0; row < 8; row++) {
                const offset = (row % 2) * 32;
                for (let col = -1; col < 5; col++) {
                    const shade = Math.floor(rng() * 35);
                    ctx.fillStyle = `rgb(${155 + shade}, ${112 + shade}, ${84 + Math.floor(shade * 0.7)})`;
                    ctx.fillRect(col * bw + offset + 2, row * bh + 2, bw - 4, bh - 4);
                }
            }
            return (this.textures.brick = this._toTex(c, 1, 1, true));
        }

        _makeWoodTexture(key, c1, c2) {
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            const rng = seededNoise(4421);
            ctx.fillStyle = c1;
            ctx.fillRect(0, 0, 256, 256);
            for (let y = 0; y < 256; y += 32) {
                ctx.fillStyle = c2;
                ctx.fillRect(0, y, 256, 2);
                for (let g = 0; g < 14; g++) {
                    ctx.fillStyle = `rgba(30,18,10,${0.08 + rng() * 0.14})`;
                    ctx.fillRect(0, y + rng() * 30, 256, 1 + rng() * 2);
                }
            }
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        _makeCrateTexture() {
            if (this.textures.wood_crate) return this.textures.wood_crate;
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#6f5130';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#3b2914';
            ctx.lineWidth = 18;
            ctx.strokeRect(9, 9, 238, 238);
            ctx.beginPath();
            ctx.moveTo(18, 18); ctx.lineTo(238, 238);
            ctx.moveTo(238, 18); ctx.lineTo(18, 238);
            ctx.lineWidth = 14;
            ctx.stroke();
            return (this.textures.wood_crate = this._toTex(c, 1, 1, true));
        }

        _makeDiamondPlateTexture() {
            if (this.textures.diamond_plate) return this.textures.diamond_plate;
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#3a414c';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#5a6474';
            for (let y = 8; y < 256; y += 24) {
                for (let x = 8; x < 256; x += 24) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(((x + y) / 24) % 2 === 0 ? 0.78 : -0.78);
                    ctx.fillRect(-5, -2, 10, 4);
                    ctx.restore();
                }
            }
            ctx.strokeStyle = '#20252c';
            ctx.lineWidth = 3;
            ctx.strokeRect(1, 1, 254, 254);
            return (this.textures.diamond_plate = this._toTex(c, 1, 1, true));
        }

        _makeLabPanelTexture() {
            if (this.textures.lab_panel) return this.textures.lab_panel;
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#242e3b';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#121820';
            ctx.lineWidth = 4;
            ctx.strokeRect(4, 4, 248, 248);
            ctx.strokeRect(4, 128, 248, 124);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(20, 20, 40, 6);
            ctx.fillStyle = '#1d2734';
            ctx.fillRect(20, 146, 216, 86);
            return (this.textures.lab_panel = this._toTex(c, 1, 1, true));
        }

        _makeContainerTexture(key, mainHex, darkHex) {
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            ctx.fillStyle = mainHex;
            ctx.fillRect(0, 0, 256, 256);
            for (let x = 0; x < 256; x += 16) {
                ctx.fillStyle = darkHex;
                ctx.fillRect(x, 0, 7, 256);
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(x + 7, 0, 3, 256);
            }
            ctx.fillStyle = darkHex;
            ctx.fillRect(0, 0, 256, 10);
            ctx.fillRect(0, 246, 256, 10);
            return (this.textures[key] = this._toTex(c, 1, 1, true));
        }

        _makeTheaterCarpetTexture() {
            if (this.textures.theater_carpet) return this.textures.theater_carpet;
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#5e141c';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#ca9e3b';
            ctx.lineWidth = 3;
            for (let y = 0; y < 256; y += 64) {
                for (let x = 0; x < 256; x += 64) {
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
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            const rng = seededNoise(5551);
            ctx.fillStyle = '#cfd4dc';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = 'rgba(100,116,139,0.32)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 18; i++) {
                ctx.beginPath();
                ctx.moveTo(rng() * 256, rng() * 256);
                ctx.bezierCurveTo(rng() * 256, rng() * 256, rng() * 256, rng() * 256, rng() * 256, rng() * 256);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(51,65,85,0.42)';
            ctx.lineWidth = 3;
            for (let g = 0; g <= 256; g += 128) {
                ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, 256); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(256, g); ctx.stroke();
            }
            return (this.textures.pentagon_marble = this._toTex(c, 1, 1, true));
        }

        _makeSidingTexture(key, mainHex, lineHex) {
            if (this.textures[key]) return this.textures[key];
            const c = this._makeCanvas(256, 256);
            const ctx = c.getContext('2d');
            ctx.fillStyle = mainHex;
            ctx.fillRect(0, 0, 256, 256);
            for (let y = 0; y < 256; y += 24) {
                ctx.fillStyle = lineHex;
                ctx.fillRect(0, y, 256, 4);
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(0, y + 4, 256, 2);
            }
            return (this.textures[key] = this._toTex(c, 1, 1, true));
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

            // Chalk border & glowing rifle silhouette
            ctx.strokeStyle = 'rgba(226, 238, 255, 0.85)';
            ctx.lineWidth = 5;
            ctx.setLineDash([14, 7]);
            ctx.strokeRect(14, 14, 484, 228);
            ctx.setLineDash([]);

            ctx.fillStyle = 'rgba(220, 240, 255, 0.90)';
            ctx.fillRect(96, 86, 220, 26); // receiver silhouette
            ctx.fillRect(316, 94, 110, 10); // barrel
            ctx.fillRect(190, 112, 26, 48); // mag
            ctx.fillRect(130, 112, 20, 42); // grip
            ctx.fillRect(56, 92, 46, 28); // stock

            ctx.font = 'bold 34px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#e0f2fe';
            ctx.fillText(weaponName.toUpperCase(), 256, 56);

            ctx.font = 'bold 32px Consolas, monospace';
            ctx.fillStyle = '#fde047';
            ctx.fillText(cost + ' PTS', 256, 214);

            const tex = new THREE.CanvasTexture(c);
            if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        createPerkSignTexture(perkName, colorHex) {
            const c = this._makeCanvas(256, 128);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#090d14';
            ctx.fillRect(0, 0, 256, 128);
            ctx.strokeStyle = colorHex;
            ctx.lineWidth = 8;
            ctx.strokeRect(6, 6, 244, 116);
            ctx.fillStyle = colorHex;
            ctx.font = 'bold 28px Bahnschrift, Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(perkName.toUpperCase(), 128, 64);
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
