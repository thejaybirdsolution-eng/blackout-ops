/* ============================================================================
   BLACKOUT OPS — Open World RPG · Cartography
   Fog-of-war exploration, the HUD minimap, the hill-shaded world-map base
   layer and the Atlas (completion per region).

   - The Expanse is split into a 64 × 64 grid (20 m cells). Cells within the
     reveal radius of the player are charted and stored as a base64 bitset in
     s.atlas.explored, so a fully explored map costs 684 bytes of save data.
   - Charting a cell grants Pathfinding mastery XP; every whole percent of the
     map updates the numeric world flag `explored_pct` that quests count on.
   - The base map (hill-shading + contours + roads) is rendered once per
     session into an off-screen canvas shared by the minimap and Pip-Pad map.
============================================================================ */
(function (BO) {
    'use strict';

    const GRID = 64;
    const BASE_RES = 256;               // terrain samples per side for the shaded base map
    const BASE_PX = 768;                // off-screen base map size
    const REVEAL_R = 70;                // metres
    const MM_PX = 200;                  // minimap canvas size (CSS px)
    const ZOOMS = [95, 150, 230];       // minimap radius in metres
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const D = () => BO.OWRPGWorldData;

    const Carto = {
        id: 'cartography',
        GRID,
        bits: null,
        explored: 0,
        cellRegion: null,
        regionCells: {},
        regionExplored: {},
        base: null,
        fog: null,
        fogCtx: null,
        fogImg: null,
        fogDirty: true,
        mm: null,
        mmT: 0,
        revealT: 0,
        lastPct: 0,

        get s() { return BO.OWRPGMode.state; },

        /* ------------------------------------------------ lifecycle */
        start(s) {
            this._decode(s.atlas.explored);
            this._indexRegions();
            this._buildBase();
            this._buildFog();
            this.lastPct = this.percent();
            this._ensureMinimap();
            this.revealT = 0;
            this.mmT = 0;
        },

        stop() {
            if (this.mm) this.mm.root.classList.add('hidden');
        },

        update(dt) {
            const s = this.s;
            if (!s) return;
            this.revealT -= dt;
            if (this.revealT <= 0) { this.revealT = 0.25; this._revealAroundPlayer(); }
            this.mmT -= dt;
            if (this.mmT <= 0) { this.mmT = 1 / 15; this._drawMinimap(); }
        },

        handleKey(code, kb) {
            if (code !== kb.owMinimapZoom) return false;
            const f = this.s.worldFlags;
            if (f.minimapEnabled === false) { f.minimapEnabled = true; f.minimapZoom = 0; }
            else f.minimapZoom = ((f.minimapZoom || 0) + 1) % ZOOMS.length;
            BO.OWRPGMode.toast('Minimap range ' + this.range() + ' m', '#fbbf24');
            this._drawMinimap();
            return true;
        },

        /* ------------------------------------------------ grid */
        cellOf(x, z) {
            const B = D().BOUNDS;
            const cx = Math.floor((x - B.minX) / (B.maxX - B.minX) * GRID);
            const cz = Math.floor((z - B.minZ) / (B.maxZ - B.minZ) * GRID);
            if (cx < 0 || cz < 0 || cx >= GRID || cz >= GRID) return -1;
            return cz * GRID + cx;
        },

        cellCenter(i) {
            const B = D().BOUNDS, w = (B.maxX - B.minX) / GRID;
            return { x: B.minX + (i % GRID + 0.5) * w, z: B.minZ + (Math.floor(i / GRID) + 0.5) * w };
        },

        isExplored(x, z) { const i = this.cellOf(x, z); return i >= 0 && this._get(i); },
        _get(i) { return (this.bits[i >> 3] >> (i & 7)) & 1; },

        percent() { return Math.floor((this.explored / (GRID * GRID)) * 100); },

        regionPercent(id) { const n = this.regionCells[id] || 1; return Math.round(((this.regionExplored[id] || 0) / n) * 100); },

        range() {
            const f = this.s.worldFlags;
            return ZOOMS[f.minimapZoom || 0] + (BO.OWRPGCharacter.perkFx(this.s).minimapRange || 0);
        },

        revealRadius() { return REVEAL_R * (1 + (BO.OWRPGCharacter.perkFx(this.s).revealRadius || 0)); },

        /** Chart every cell within `r` metres of (x, z). Returns the number of newly charted cells. */
        reveal(x, z, r, silent) {
            const B = D().BOUNDS, w = (B.maxX - B.minX) / GRID;
            const c0 = Math.max(0, Math.floor((x - r - B.minX) / w)), c1 = Math.min(GRID - 1, Math.floor((x + r - B.minX) / w));
            const r0 = Math.max(0, Math.floor((z - r - B.minZ) / w)), r1 = Math.min(GRID - 1, Math.floor((z + r - B.minZ) / w));
            let fresh = 0;
            for (let cz = r0; cz <= r1; cz++) for (let cx = c0; cx <= c1; cx++) {
                const i = cz * GRID + cx;
                if (this._get(i)) continue;
                const px = B.minX + (cx + 0.5) * w, pz = B.minZ + (cz + 0.5) * w;
                if ((px - x) * (px - x) + (pz - z) * (pz - z) > r * r) continue;
                this.bits[i >> 3] |= 1 << (i & 7);
                this.explored++;
                const reg = this.cellRegion[i];
                this.regionExplored[reg] = (this.regionExplored[reg] || 0) + 1;
                this._fogPixel(i);
                fresh++;
            }
            if (!fresh) return 0;
            const s = this.s;
            s.atlas.explored = this._encode();
            if (!silent) BO.OWRPGCharacter.addSkillXp(s, 'exploration', fresh * 6);
            const pct = this.percent();
            if (pct !== this.lastPct) {
                this.lastPct = pct;
                BO.OWRPGMode.setFlag('explored_pct', pct);
                if (pct > 0 && pct % 10 === 0 && !silent) {
                    BO.OWRPGMode.giveXp(60 + pct * 4, 'Charted ' + pct + '% of the Expanse');
                    BO.Events.emit('hud:toast', { text: 'Atlas: ' + pct + '% of the Meridian Expanse charted', color: '#fbbf24' });
                }
            }
            return fresh;
        },

        _revealAroundPlayer() {
            const P = BO.Player;
            if (!P || D().isInterior(P.pos.x, P.pos.z)) return;
            this.reveal(P.pos.x, P.pos.z, this.revealRadius());
        },

        _decode(str) {
            this.bits = new Uint8Array(GRID * GRID / 8);
            this.explored = 0;
            if (str) {
                try {
                    const bin = atob(str);
                    for (let i = 0; i < Math.min(bin.length, this.bits.length); i++) this.bits[i] = bin.charCodeAt(i);
                } catch (e) { console.warn('[Cartography] bad explored bitset, starting fresh', e); }
            }
            for (let i = 0; i < GRID * GRID; i++) if (this._get(i)) this.explored++;
        },

        _encode() {
            let bin = '';
            for (let i = 0; i < this.bits.length; i++) bin += String.fromCharCode(this.bits[i]);
            return btoa(bin);
        },

        _indexRegions() {
            this.cellRegion = new Array(GRID * GRID);
            this.regionCells = {};
            this.regionExplored = {};
            for (let i = 0; i < GRID * GRID; i++) {
                const c = this.cellCenter(i);
                const id = D().regionAt(c.x, c.z).id;
                this.cellRegion[i] = id;
                this.regionCells[id] = (this.regionCells[id] || 0) + 1;
                if (this._get(i)) this.regionExplored[id] = (this.regionExplored[id] || 0) + 1;
            }
        },

        /* ------------------------------------------------ base map */
        /** Hill-shaded, contoured terrain with roads, cached for the session. */
        _buildBase() {
            if (this.base && this.base._seed === BO.World.mapData.id) return;
            const Dd = D(), B = Dd.BOUNDS, span = B.maxX - B.minX, step = span / BASE_RES;
            const H = new Float32Array((BASE_RES + 1) * (BASE_RES + 1));
            for (let j = 0; j <= BASE_RES; j++) for (let i = 0; i <= BASE_RES; i++) H[j * (BASE_RES + 1) + i] = BO.World.terrainHeight(B.minX + i * step, B.minZ + j * step);
            const small = document.createElement('canvas');
            small.width = small.height = BASE_RES;
            const g = small.getContext('2d');
            const img = g.createImageData(BASE_RES, BASE_RES);
            const lx = -0.6, lz = -0.55, ly = 0.58;            // light from the north-west
            for (let j = 0; j < BASE_RES; j++) for (let i = 0; i < BASE_RES; i++) {
                const h = H[j * (BASE_RES + 1) + i];
                const hx = H[j * (BASE_RES + 1) + i + 1] - h, hz = H[(j + 1) * (BASE_RES + 1) + i] - h;
                const nx = -hx, nz = -hz, ny = step;
                const nl = Math.hypot(nx, ny, nz);
                const shade = Math.max(0.35, Math.min(1.25, 0.55 + 0.75 * ((nx * lx + ny * ly + nz * lz) / nl)));
                const x = B.minX + (i + 0.5) * step, z = B.minZ + (j + 0.5) * step;
                const reg = Dd.regionAt(x, z);
                const wet = (h < Dd.WATER && Dd.isWet(x, z)) || (h < -11.6 && Math.hypot(x + 180, z + 60) < 22) || (h < -6.4 && Math.hypot(x - 180, z + 190) < 20);
                let r, gg, b;
                if (wet) { const d = Math.max(0, Math.min(1, (Dd.WATER - h) / 6)); r = 30 - d * 14; gg = 70 - d * 22; b = 82 - d * 10; }
                else {
                    const alt = Math.max(0.7, Math.min(1.25, 0.9 + h / 90));
                    r = reg.col[0] * 255 * shade * alt; gg = reg.col[1] * 255 * shade * alt; b = reg.col[2] * 255 * shade * alt;
                    // 8 m contour lines.
                    if (Math.floor(h / 8) !== Math.floor(H[j * (BASE_RES + 1) + i + 1] / 8) || Math.floor(h / 8) !== Math.floor(H[(j + 1) * (BASE_RES + 1) + i] / 8)) { r *= 0.8; gg *= 0.8; b *= 0.8; }
                }
                const o = (j * BASE_RES + i) * 4;
                img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
            }
            g.putImageData(img, 0, 0);
            const base = document.createElement('canvas');
            base.width = base.height = BASE_PX;
            const bg = base.getContext('2d');
            bg.imageSmoothingEnabled = true;
            bg.drawImage(small, 0, 0, BASE_PX, BASE_PX);
            const S = BASE_PX / span, X = (x) => (x - B.minX) * S, Z = (z) => (z - B.minZ) * S;
            bg.lineCap = 'round'; bg.lineJoin = 'round';
            for (const [w, col] of [[5, 'rgba(20,18,14,0.75)'], [2.2, 'rgba(214,196,160,0.85)']]) {
                bg.strokeStyle = col; bg.lineWidth = w;
                for (const r of Dd.ROADS || []) { bg.beginPath(); r.pts.forEach(([x, z], i) => (i ? bg.lineTo(X(x), Z(z)) : bg.moveTo(X(x), Z(z)))); bg.stroke(); }
            }
            const grad = bg.createRadialGradient(BASE_PX / 2, BASE_PX / 2, BASE_PX * 0.35, BASE_PX / 2, BASE_PX / 2, BASE_PX * 0.75);
            grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.35)');
            bg.fillStyle = grad; bg.fillRect(0, 0, BASE_PX, BASE_PX);
            base._seed = BO.World.mapData.id;
            this.base = base;
        },

        _buildFog() {
            const c = document.createElement('canvas');
            c.width = c.height = GRID;
            this.fog = c;
            this.fogCtx = c.getContext('2d');
            this.fogImg = this.fogCtx.createImageData(GRID, GRID);
            for (let i = 0; i < GRID * GRID; i++) {
                const o = i * 4;
                this.fogImg.data[o] = 9; this.fogImg.data[o + 1] = 13; this.fogImg.data[o + 2] = 20;
                this.fogImg.data[o + 3] = this._get(i) ? 0 : 236;
            }
            this.fogCtx.putImageData(this.fogImg, 0, 0);
            this.fogDirty = false;
        },

        _fogPixel(i) {
            if (!this.fogImg) return;
            this.fogImg.data[i * 4 + 3] = 0;
            this.fogDirty = true;
        },

        _flushFog() {
            if (!this.fogDirty || !this.fogCtx) return;
            this.fogCtx.putImageData(this.fogImg, 0, 0);
            this.fogDirty = false;
        },

        /** World-map overlay used by the Pip-Pad map tab (draw after POIs, before the player arrow). */
        drawWorldBase(g, size) {
            this._buildBase();
            g.imageSmoothingEnabled = true;
            g.drawImage(this.base, 0, 0, size, size);
        },

        drawWorldFog(g, size) {
            this._flushFog();
            g.save();
            g.imageSmoothingEnabled = true;
            g.filter = 'blur(' + (size / GRID * 0.6).toFixed(1) + 'px)';
            g.drawImage(this.fog, 0, 0, size, size);
            g.restore();
        },

        /* ------------------------------------------------ minimap */
        _ensureMinimap() {
            const UI = BO.OWRPGUI;
            UI.init();
            if (this.mm && document.body.contains(this.mm.root)) { this.mm.root.classList.remove('hidden'); return; }
            const root = document.createElement('div');
            root.id = 'ow-minimap';
            root.className = 'ow-minimap';
            root.innerHTML = '<canvas width="' + MM_PX * 2 + '" height="' + MM_PX * 2 + '" aria-label="Minimap"></canvas><div class="ow-mm-rim"></div><div class="ow-mm-cardinals"></div><div class="ow-mm-info"><b></b><span></span></div>';
            UI.hud.appendChild(root);
            this.mm = { root, cv: root.querySelector('canvas'), ctx: root.querySelector('canvas').getContext('2d'), card: root.querySelector('.ow-mm-cardinals'), info: root.querySelector('.ow-mm-info'), lastInfo: '' };
        },

        _drawMinimap() {
            const s = this.s, P = BO.Player, Dd = D();
            if (!this.mm || !s || !P) return;
            const show = s.worldFlags.minimapEnabled !== false && !BO.OWRPGUI.modalOpen;
            this.mm.root.classList.toggle('hidden', !show);
            if (!show) return;
            const g = this.mm.ctx, W = this.mm.cv.width, R = W / 2;
            const range = this.range(), k = R / range;
            const inside = Dd.isInterior(P.pos.x, P.pos.z);
            const northUp = !!s.worldFlags.minimapNorthUp;
            // Forward is (-sin yaw, -cos yaw) in map space; rotating the map by +yaw puts it straight up.
            const rot = northUp ? 0 : P.yaw;
            const cs = Math.cos(rot), sn = Math.sin(rot);
            const toScreen = (x, z) => { const dx = (x - P.pos.x) * k, dz = (z - P.pos.z) * k; return [R + dx * cs - dz * sn, R + dx * sn + dz * cs]; };
            g.save();
            g.clearRect(0, 0, W, W);
            g.beginPath(); g.arc(R, R, R - 2, 0, Math.PI * 2); g.clip();
            if (inside) {
                const grd = g.createRadialGradient(R, R, 10, R, R, R);
                grd.addColorStop(0, '#1c1917'); grd.addColorStop(1, '#0c0a09');
                g.fillStyle = grd; g.fillRect(0, 0, W, W);
                g.strokeStyle = 'rgba(148,163,184,0.12)'; g.lineWidth = 1;
                for (let r = range / 4; r < range; r += range / 4) { g.beginPath(); g.arc(R, R, r * k, 0, Math.PI * 2); g.stroke(); }
            } else {
                const B = Dd.BOUNDS, span = B.maxX - B.minX;
                this._flushFog();
                g.translate(R, R); g.rotate(rot); g.scale(k, k); g.translate(-P.pos.x, -P.pos.z);
                g.imageSmoothingEnabled = true;
                g.fillStyle = '#0b1118'; g.fillRect(P.pos.x - range * 1.5, P.pos.z - range * 1.5, range * 3, range * 3);
                g.drawImage(this.base, B.minX, B.minZ, span, span);
                g.globalAlpha = 0.96;
                g.drawImage(this.fog, B.minX, B.minZ, span, span);
                g.globalAlpha = 1;
                g.setTransform(1, 0, 0, 1, 0, 0);
            }
            const dot = (x, z, col, rad, glyph, ring) => {
                const [sx, sy] = toScreen(x, z);
                const dd = Math.hypot(sx - R, sy - R);
                let px = sx, py = sy;
                if (dd > R - 12) { if (!ring) return; px = R + (sx - R) / dd * (R - 12); py = R + (sy - R) / dd * (R - 12); }
                if (glyph) {
                    g.font = '900 ' + Math.round(rad * 2.6) + 'px Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
                    g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(glyph, px, py); g.fillStyle = col; g.fillText(glyph, px, py);
                } else {
                    g.beginPath(); g.arc(px, py, rad, 0, Math.PI * 2); g.fillStyle = col; g.fill();
                    g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.stroke();
                }
            };
            if (!inside) {
                for (const poi of Dd.POIS) {
                    if (poi.interior) continue;
                    const st = s.poiStates[poi.id];
                    if (!st || !st.discovered) continue;
                    dot(poi.x, poi.z, poi.safe ? '#f5a623' : st.clearedAt != null ? '#94a3b8' : '#f87171', poi.safe ? 8 : 6, poi.safe ? '◆' : null);
                }
                for (const dg of Dd.DUNGEONS) if (this.isExplored(dg.surf.x, dg.surf.z)) dot(dg.surf.x, dg.surf.z, '#67e8f9', 8, '∩');
                for (const py of Dd.PYLONS) if (s.pylons[py.id] || this.isExplored(py.x, py.z)) dot(py.x, py.z, s.pylons[py.id] ? '#22d3ee' : '#64748b', 5);
                if (BO.OWRPGDiscoveries) BO.OWRPGDiscoveries.drawOnMinimap(dot, P);
                for (const pin of s.pins) dot(pin[0], pin[1], '#f472b6', 8, '✚', true);
                const ev = BO.OWRPGEvents && BO.OWRPGEvents.activeEvent;
                if (ev) dot(ev.x, ev.z, ev.color || '#38bdf8', 9, '⚡', true);
            }
            for (const a of BO.OWRPGAI.agents) {
                if (!a.alive || !a.ent.parts.root.visible) continue;
                const d = Math.hypot(a.ent.pos.x - P.pos.x, a.ent.pos.z - P.pos.z);
                if (d > range) continue;
                if (a.hostile && (a.state === 'combat' || a.state === 'suspicious' || d < 30)) dot(a.ent.pos.x, a.ent.pos.z, a.champ ? '#e879f9' : a.boss ? '#fb7185' : '#ef4444', a.boss || a.champ ? 5 : 3.5);
                else if (!a.hostile && d < 60) dot(a.ent.pos.x, a.ent.pos.z, '#86efac', 3);
            }
            if (!inside && BO.OWRPGInteriors) for (const n of BO.OWRPGInteriors.npcs) dot(n.pos.x, n.pos.z, '#a7f3d0', 3.5);
            // Quest markers: tracked quests get an edge arrow when out of range.
            const tracked = BO.OWRPGUI.trackedQuests ? BO.OWRPGUI.trackedQuests() : [];
            for (const m of BO.OWRPGQuests.markers(s)) {
                const tgt = this.questTarget(m.poi);
                if (!tgt) continue;
                const on = tracked.includes(m.quest);
                dot(tgt.x, tgt.z, on ? '#a3e635' : 'rgba(163,230,53,0.55)', on ? 8 : 6, '◆', on);
            }
            // Player arrow.
            g.save(); g.translate(R, R); g.rotate(northUp ? -P.yaw : 0);
            g.beginPath(); g.moveTo(0, -11); g.lineTo(7.5, 8); g.lineTo(0, 4); g.lineTo(-7.5, 8); g.closePath();
            g.fillStyle = '#f8fafc'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#0f172a'; g.stroke();
            g.restore();
            g.restore();
            // Cardinals ride the rim.
            this.mm.card.innerHTML = [['N', 0], ['E', Math.PI / 2], ['S', Math.PI], ['W', -Math.PI / 2]].map(([n, off]) => {
                const ang = rot + off;
                const x = 50 + Math.sin(ang) * 46, y = 50 - Math.cos(ang) * 46;
                return '<i class="' + (n === 'N' ? 'ow-mm-n' : '') + '" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%">' + n + '</i>';
            }).join('');
            const reg = inside ? null : Dd.regionAt(P.pos.x, P.pos.z);
            const dungeon = inside ? Dd.DUNGEONS.find((d) => Math.hypot(P.pos.x - d.x, P.pos.z - d.z) < 130) : null;
            const info = inside ? (dungeon ? dungeon.name : 'Underground') + '|DELVING' : reg.name + '|' + this.regionPercent(reg.id) + '% charted · ' + range + ' m';
            if (info !== this.mm.lastInfo) {
                this.mm.lastInfo = info;
                const [a, b] = info.split('|');
                this.mm.info.innerHTML = '<b>' + esc(a) + '</b><span>' + esc(b) + '</span>';
            }
        },

        /** Surface position to point at for a quest marker POI (dungeon entrance for interiors). */
        questTarget(poiId) {
            const Dd = D();
            const poi = Dd.POIS.find((p) => p.id === poiId);
            if (!poi) return null;
            if (poi.interior) {
                const dg = Dd.DUNGEONS.find((d) => d.id === poi.id);
                return dg ? dg.surf : null;
            }
            return poi;
        },

        /* ------------------------------------------------ atlas tab */
        atlasHtml() {
            const s = this.s, Dd = D(), Disc = BO.OWRPGDiscoveries;
            const pct = this.percent();
            const discTotal = Disc ? Disc.sites.length : 0, discFound = Disc ? Disc.foundCount() : 0;
            const poiTotal = Dd.POIS.filter((p) => !p.interior).length;
            const poiFound = Dd.POIS.filter((p) => !p.interior && s.poiStates[p.id] && s.poiStates[p.id].discovered).length;
            const completion = Math.round((pct + (discTotal ? (discFound / discTotal) * 100 : 0) + (poiFound / Math.max(1, poiTotal)) * 100) / 3);
            const rank = [[90, 'Living Legend'], [70, 'Master Cartographer'], [50, 'Pathfinder'], [30, 'Surveyor'], [12, 'Scout'], [0, 'Greenhorn']].find(([t]) => completion >= t)[1];
            const rows = Dd.REGIONS.map((r) => {
                const rp = this.regionPercent(r.id);
                const sites = Disc ? Disc.sites.filter((d) => d.region === r.id) : [];
                const found = sites.filter((d) => s.atlas.found[d.id]).length;
                const pois = Dd.POIS.filter((p) => !p.interior && Dd.regionAt(p.x, p.z).id === r.id);
                const pf = pois.filter((p) => s.poiStates[p.id] && s.poiStates[p.id].discovered).length;
                const col = 'rgb(' + r.col.map((v) => Math.round(v * 255)).join(',') + ')';
                return '<div class="ow-atlas-row" style="--c:' + col + '"><div><b>' + esc(r.name) + '</b><small>Level ' + esc(r.lvl) + ' · ' + (r.faction ? esc(r.faction) : 'unclaimed') + '</small></div>' +
                    '<div class="ow-atlas-bars"><label>Charted <i style="--p:' + rp + '%"></i><em>' + rp + '%</em></label>' +
                    '<label>Sites <i style="--p:' + (sites.length ? Math.round(found / sites.length * 100) : 0) + '%"></i><em>' + found + '/' + sites.length + '</em></label>' +
                    '<label>Locations <i style="--p:' + (pois.length ? Math.round(pf / pois.length * 100) : 0) + '%"></i><em>' + pf + '/' + pois.length + '</em></label></div></div>';
            }).join('');
            const byType = Disc ? Disc.typeSummary() : [];
            const types = byType.map((t) => '<div class="ow-stat" style="--c:' + t.color + '"><small>' + t.icon + ' ' + esc(t.name) + '</small><b>' + t.found + ' / ' + t.total + '</b></div>').join('');
            return '<div class="ow-atlas-head"><div class="ow-atlas-ring" style="--p:' + completion + '"><b>' + completion + '%</b><small>COMPLETE</small></div>' +
                '<div><span class="ow-kicker">ATLAS OF THE MERIDIAN EXPANSE</span><h3>' + rank + '</h3><p class="ow-dim">' + pct + '% of the land charted · ' + poiFound + '/' + poiTotal + ' locations · ' + discFound + '/' + discTotal + ' hidden sites · ' + (s.atlas.champions || 0) + ' Champions slain</p>' +
                '<p class="ow-dim">Walk the land to lift the fog. Vistas chart a wide area at once. Every 10% charted pays out XP; Pathfinding mastery grows with every new cell.</p></div></div>' +
                '<div class="ow-sub">HIDDEN SITES</div><div class="ow-stats">' + types + '</div><div class="ow-sub">REGIONS</div><div class="ow-atlas">' + rows + '</div>';
        }
    };

    BO.OWRPGCartography = Carto;
    if (BO.OWRPGMode) BO.OWRPGMode.registerSystem(Carto);
})(window.BO);
