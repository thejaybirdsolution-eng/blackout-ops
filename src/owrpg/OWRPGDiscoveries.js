/* ============================================================================
   BLACKOUT OPS — Open World RPG · Discoveries
   156 hidden sites scattered across the 12 regions: treasure caches, lore
   tomes, wayside shrines, skill shards, survey vistas, hidden stashes and
   Altars of Trials. Placement is derived from the terrain and a fixed seed,
   so every save sees the same world; only `s.atlas.found` is persisted.

   Sites stream in within 150 m (GLB model + fallback + a bobbing marker that
   disappears once found), show on the minimap, the world map and the Atlas,
   and feed the exploration questline through numeric world flags.
============================================================================ */
(function (BO) {
    'use strict';

    const STREAM_IN = 125, STREAM_OUT = 150, REACH = 2.9, TRIAL_RANGE = 110;
    const DD = () => BO.OWRPGDiscoveryData;
    const W = () => BO.OWRPGWorldData;
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function rng(seed) {
        let a = seed >>> 0;
        return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }

    const markerTex = {};
    function markerTexture(type) {
        if (markerTex[type]) return markerTex[type];
        const T = DD().TYPES[type];
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62);
        grad.addColorStop(0, T.color); grad.addColorStop(0.45, T.color + '88'); grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
        g.font = '900 64px Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.65)'; g.strokeText(T.icon, 64, 68);
        g.fillStyle = '#fff'; g.fillText(T.icon, 64, 68);
        const tex = new THREE.CanvasTexture(c);
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        markerTex[type] = tex;
        return tex;
    }

    const Disc = {
        id: 'discoveries',
        sites: [],
        live: new Map(),
        trial: null,
        streamT: 0,
        _seed: null,

        get s() { return BO.OWRPGMode.state; },

        /* ------------------------------------------------ lifecycle */
        start(s, scene) {
            this.scene = scene;
            this.generate(s.worldSeed || 884120);
            this.live = new Map();
            this.trial = null;
            this.streamT = 0;
        },

        stop() {
            for (const v of this.live.values()) v.group.removeFromParent();
            this.live.clear();
            this.trial = null;
        },

        /** Deterministic placement: same seed + terrain → same 156 sites. */
        generate(seed) {
            if (this._seed === seed && this.sites.length) return this.sites;
            const D = W(), B = D.BOUNDS, out = [];
            const blocked = [];
            for (const p of D.POIS) if (!p.interior) blocked.push([p.x, p.z, (p.r || 25) + 14]);
            for (const d of D.DUNGEONS) blocked.push([d.surf.x, d.surf.z, 22]);
            for (const py of D.PYLONS) blocked.push([py.x, py.z, 14]);
            for (const n of D.NPCS) blocked.push([n.x, n.z, 10]);
            for (const it of D.INTERACTS) if (!it.int) blocked.push([it.x, it.z, 6]);
            // `relax` 0 = strict; 1 = steeper ground and tighter clearances (fallback for rugged / marshy regions).
            const ok = (x, z, reg, gap, relax) => {
                if (x < B.minX + 24 || x > B.maxX - 24 || z < B.minZ + 24 || z > B.maxZ - 24) return false;
                if (D.regionAt(x, z).id !== reg) return false;
                const h = BO.World.terrainHeight(x, z);
                if (h < D.WATER + 0.4) return false;
                const slope = Math.abs(BO.World.terrainHeight(x + 2, z) - h) + Math.abs(BO.World.terrainHeight(x, z + 2) - h);
                if (slope > (relax ? 4.5 : 2.2)) return false;
                const pad = relax ? 0.55 : 1;
                for (const [bx, bz, br] of blocked) if ((x - bx) * (x - bx) + (z - bz) * (z - bz) < br * br * pad * pad) return false;
                for (const o of out) if ((x - o.x) * (x - o.x) + (z - o.z) * (z - o.z) < gap * gap) return false;
                return true;
            };
            const skills = Object.keys(BO.OWRPGStatsData.SKILLS);
            const generic = DD().LORE.filter((l) => !l.region);
            let genericIdx = 0, shardIdx = 0;
            D.REGIONS.forEach((reg, ri) => {
                const rand = rng(seed * 31 + ri * 7919);
                const tier = parseInt(String(reg.lvl), 10) || 1;
                for (const [type, count] of Object.entries(DD().PER_REGION)) {
                    for (let k = 0; k < count; k++) {
                        let best = null;
                        const tries = type === 'vista' ? 120 : 70;
                        for (let relax = 0; relax < 2 && !best; relax++) {
                            for (let t = 0; t < tries; t++) {
                                const ang = rand() * Math.PI * 2, rr = Math.sqrt(rand()) * reg.r * (relax ? 1 : 0.92);
                                const x = reg.x + Math.cos(ang) * rr, z = reg.z + Math.sin(ang) * rr;
                                if (!ok(x, z, reg.id, type === 'vista' ? 60 : relax ? 24 : 34, relax)) continue;
                                if (type !== 'vista') { best = { x, z }; break; }
                                const h = BO.World.terrainHeight(x, z);
                                if (!best || h > best.h) best = { x, z, h };
                            }
                        }
                        if (!best) continue;
                        const site = { id: 'ds_' + reg.id.slice(0, 6) + '_' + type + k, type, region: reg.id, tier, x: Math.round(best.x * 10) / 10, z: Math.round(best.z * 10) / 10, yaw: rand() * Math.PI * 2 };
                        if (type === 'tome') {
                            const own = DD().LORE.filter((l) => l.region === reg.id);
                            site.lore = own.length ? own[k % own.length].id : generic[genericIdx++ % generic.length].id;
                        }
                        if (type === 'shard') site.skill = skills[(ri + shardIdx++) % skills.length];
                        if (type === 'shrine') site.blessing = DD().BLESSINGS[(ri + k) % DD().BLESSINGS.length].id;
                        out.push(site);
                    }
                }
            });
            this.sites = out;
            this._seed = seed;
            return out;
        },

        /* ------------------------------------------------ queries */
        isFound(site) { return !!this.s.atlas.found[site.id]; },
        foundCount() { return this.sites.filter((x) => this.s.atlas.found[x.id]).length; },

        typeSummary() {
            const T = DD().TYPES;
            return Object.keys(T).map((type) => {
                const all = this.sites.filter((x) => x.type === type);
                return { type, name: T[type].name, icon: T[type].icon, color: T[type].color, total: all.length, found: all.filter((x) => this.s.atlas.found[x.id]).length };
            });
        },

        shrineReady(site) { return (this.s.atlas.shrineT[site.id] || 0) <= this.s.playtimeSec; },

        nearest() {
            const P = BO.Player;
            if (this.trial || W().isInterior(P.pos.x, P.pos.z)) return null;
            let best = null;
            for (const v of this.live.values()) {
                const site = v.site;
                const found = this.isFound(site);
                if (found && !(site.type === 'shrine' && this.shrineReady(site))) continue;
                const d = BO.Math.dist3D(P.pos.x, P.pos.y + 0.9, P.pos.z, site.x, v.y + 0.6, site.z);
                if (d < REACH && (!best || d < best.d)) best = { obj: site, d, text: DD().TYPES[site.type].prompt };
            }
            return best;
        },

        /* ------------------------------------------------ streaming & animation */
        update(dt) {
            const P = BO.Player;
            this.streamT -= dt;
            if (this.streamT <= 0) { this.streamT = 0.5; this._stream(P); }
            const t = this.s.playtimeSec;
            for (const v of this.live.values()) {
                if (v.marker && v.marker.visible) {
                    v.marker.position.y = v.markerY + Math.sin(t * 2.2 + v.phase) * 0.18;
                    v.marker.material.rotation = Math.sin(t * 0.8 + v.phase) * 0.15;
                }
                if (v.crystal) { v.crystal.rotation.y += dt * 1.4; v.crystal.position.y = 1.15 + Math.sin(t * 1.8 + v.phase) * 0.12; }
                if (v.ring) v.ring.rotation.z += dt * 0.6;
            }
            if (this.trial) this._updateTrial();
        },

        _stream(P) {
            const inside = W().isInterior(P.pos.x, P.pos.z);
            for (const site of this.sites) {
                const d = BO.Math.dist2D(P.pos.x, P.pos.z, site.x, site.z);
                const has = this.live.has(site.id);
                if (!inside && !has && d < STREAM_IN) this._spawnSite(site);
                else if (has && (inside || d > STREAM_OUT)) { this.live.get(site.id).group.removeFromParent(); this.live.delete(site.id); }
            }
            for (const v of this.live.values()) { v.dist = BO.Math.dist2D(P.pos.x, P.pos.z, v.site.x, v.site.z); this._refreshState(v); }
        },

        _spawnSite(site) {
            const T = DD().TYPES[site.type];
            const y = BO.World.terrainHeight(site.x, site.z);
            const group = new THREE.Group();
            group.position.set(site.x, y, site.z);
            group.rotation.y = site.yaw;
            const col = new THREE.Color(T.color);
            const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, metalness: 0.15 }, o || {}));
            const fallback = [];
            // Pedestals and fallbacks skip the shadow pass; the merged GLB model casts the site's shadow.
            const add = (geo, mat, x, yy, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, yy, z); m.castShadow = false; m.receiveShadow = true; m.userData.noHit = true; group.add(m); return m; };
            const v = { site, group, y, phase: Math.random() * 6 };
            switch (site.type) {
                case 'cache': fallback.push(add(new THREE.BoxGeometry(1.1, 0.7, 0.75), std(0x6b4f2e), 0, 0.35, 0), add(new THREE.BoxGeometry(1.14, 0.12, 0.79), std(0xb45309, { metalness: 0.6 }), 0, 0.72, 0)); break;
                case 'tome': {
                    fallback.push(add(new THREE.BoxGeometry(1.2, 0.85, 0.7), std(0x57534e), 0, 0.42, 0));
                    const book = add(new THREE.BoxGeometry(0.55, 0.08, 0.4), std(0x7f1d1d, { emissive: 0xe9c46a, emissiveIntensity: 0.25 }), 0, 0.99, 0);
                    book.rotation.x = -0.25;
                    break;
                }
                case 'shrine': fallback.push(add(new THREE.CylinderGeometry(0.45, 0.6, 1.8, 6), std(0x44403c), 0, 0.9, 0)); break;
                case 'shard': {
                    add(new THREE.CylinderGeometry(0.7, 0.9, 0.3, 7), std(0x334155), 0, 0.15, 0);
                    v.crystal = add(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.65, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.92 }), 0, 1.15, 0);
                    v.crystal.scale.y = 1.6;
                    break;
                }
                case 'vista': {
                    fallback.push(add(new THREE.CylinderGeometry(0.08, 0.1, 4.6, 6), std(0x78716c), 0, 2.3, 0));
                    add(new THREE.CylinderGeometry(1.4, 1.6, 0.25, 12), std(0x57534e), 0, 0.12, 0);
                    break;
                }
                case 'cairn': fallback.push(add(new THREE.DodecahedronGeometry(0.6, 0), std(0x78716c), 0, 0.45, 0), add(new THREE.DodecahedronGeometry(0.38, 0), std(0x57534e), 0.1, 1.05, 0)); break;
                case 'altar': {
                    fallback.push(add(new THREE.BoxGeometry(2, 1.1, 1.3), std(0x57534e), 0, 0.55, 0));
                    const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
                    v.ring = add(new THREE.RingGeometry(2.4, 2.65, 48), ringMat, 0, 0.05, 0);
                    v.ring.rotation.x = -Math.PI / 2;
                    v.ring.castShadow = false;
                    break;
                }
            }
            if (T.model && BO.Assets) {
                BO.Assets.placeGLB(group, T.model, {
                    fitSize: T.fit, uniform: true, hideFallback: fallback, guardScene: BO.World.scene, ownerSession: null,
                    // Static prop: bake the GLB into one mesh per material (usually a single draw call).
                    onLoad: (holder) => { if (BO.MeshProxy && holder.parent) BO.MeshProxy.set(BO.MeshProxy.attach(holder, 'disc:' + site.type), true); }
                });
            }
            const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTexture(site.type), transparent: true, depthWrite: false, fog: false }));
            marker.scale.set(0.9, 0.9, 1);
            v.markerY = site.type === 'vista' ? 5.6 : site.type === 'shrine' ? 3.1 : 2.2;
            marker.position.set(0, v.markerY, 0);
            marker.userData.noHit = true;
            marker.raycast = () => {};
            group.add(marker);
            v.marker = marker;
            group.traverse((o) => { o.userData.noHit = true; });
            this.scene.add(group);
            this.live.set(site.id, v);
            this._refreshState(v);
        },

        _refreshState(v) {
            const site = v.site, found = this.isFound(site);
            const ready = site.type === 'shrine' ? this.shrineReady(site) : !found;
            // Floating marker only inside 75 m (vistas: always) — beyond that the model and minimap guide you.
            if (v.marker) v.marker.visible = ready && (site.type === 'vista' || (v.dist == null ? true : v.dist < 75));
            if (v.crystal) v.crystal.visible = !found;
            if (v.ring) v.ring.visible = !found && !this.trial;
        },

        /* ------------------------------------------------ interaction */
        interact(t) {
            const site = t.obj, s = this.s, T = DD().TYPES[site.type];
            const M = BO.OWRPGMode, C = BO.OWRPGCharacter, I = BO.OWRPGInventory;
            const fx = C.perkFx(s);
            const first = !this.isFound(site);
            const xp = Math.round((T.xp + site.tier * 10) * (1 + (fx.discoveryXp || 0)));
            if (site.type !== 'altar') this._play(T);
            switch (site.type) {
                case 'cache': {
                    const loot = I.rollLoot(s, 'treasure', 2 + (Math.random() < (fx.cacheLuck || 0) ? 1 : 0) + (site.tier >= 20 ? 1 : 0));
                    // Every cache holds coin on top of its rolls, scaled by region tier.
                    loot.credits = Math.round((loot.credits + 15 + site.tier * 3) * (1 + site.tier * 0.04) * (1 + (fx.creditFind || 0)));
                    M.giveLootReport(loot, T.name);
                    break;
                }
                case 'tome': this._showLore(site); break;
                case 'shrine': {
                    const b = DD().BLESSINGS.find((x) => x.id === site.blessing) || DD().BLESSINGS[0];
                    const dur = DD().BLESSING_SEC * (1 + (fx.shrineDur || 0));
                    s.player.blessing = { id: b.id, name: b.name, color: b.color, until: s.playtimeSec + dur, fx: b.fx };
                    s.atlas.shrineT[site.id] = s.playtimeSec + (T.cooldown || 600);
                    M.applyDerived();
                    BO.Events.emit('hud:banner', { title: b.name.toUpperCase(), sub: b.desc + ' · ' + Math.round(dur / 60) + ' min', color: b.color });
                    break;
                }
                case 'shard': {
                    const sk = BO.OWRPGStatsData.SKILLS[site.skill];
                    const amt = 260 + site.tier * 22;
                    C.addSkillXp(s, site.skill, amt);
                    M.toast(sk.icon + ' ' + sk.name + ' +' + amt + ' Mastery XP', sk.color);
                    break;
                }
                case 'vista': {
                    const n = BO.OWRPGCartography ? BO.OWRPGCartography.reveal(site.x, site.z, T.revealR * (1 + (fx.revealRadius || 0) * 0.5)) : 0;
                    BO.Events.emit('hud:banner', { title: 'VISTA SYNCHRONISED', sub: W().regionAt(site.x, site.z).name + ' · ' + n + ' map cells charted', color: T.color });
                    break;
                }
                case 'cairn': {
                    const loot = I.rollLoot(s, Math.random() < 0.45 ? 'locked' : 'treasure', 1 + (site.tier >= 15 ? 1 : 0));
                    M.giveLootReport(loot, T.name);
                    break;
                }
                case 'altar': this._startTrial(site); return;
            }
            if (first) this._markFound(site, xp, T);
            else if (site.type === 'shrine') M.giveXp(Math.round(xp * 0.25), 'Shrine');
            const v = this.live.get(site.id);
            if (v) this._refreshState(v);
        },

        _play(T) { for (const clip of T.sound || []) BO.Assets?.playClip?.(clip, { volume: 0.5, rateJitter: 0.04 }); },

        _markFound(site, xp, T) {
            const s = this.s, M = BO.OWRPGMode, C = BO.OWRPGCharacter;
            s.atlas.found[site.id] = Math.round(s.playtimeSec);
            M.giveXp(xp, T.name);
            if (T.skill) C.addSkillXp(s, T.skill[0], T.skill[1]);
            C.addSkillXp(s, 'exploration', 45 + site.tier * 2);
            const n = this.sites.filter((x) => x.type === site.type && s.atlas.found[x.id]).length;
            M.setFlag('first_' + site.type, true);
            M.setFlag('found_' + site.type, n);
            M.setFlag('sites_found', this.foundCount());
            BO.FX.spawnParticles(new THREE.Vector3(site.x, BO.World.terrainHeight(site.x, site.z) + 1.4, site.z), 22, new THREE.Color(T.color).getHex(), 4, 5, 0.45, 1.3);
        },

        _showLore(site) {
            const L = DD().LORE.find((l) => l.id === site.lore) || DD().LORE[0];
            const read = DD().LORE.filter((l) => this.sites.some((x) => x.lore === l.id && this.s.atlas.found[x.id])).length + (this.isFound(site) ? 0 : 1);
            BO.OWRPGUI.open('lore', '<div class="ow-tome"><span class="ow-kicker">MERIDIAN ARCHIVES · ' + esc(W().regionAt(site.x, site.z).name.toUpperCase()) + '</span><h2>' + esc(L.title) + '</h2><p>' + esc(L.text) + '</p><small class="ow-dim">Tomes recovered: ' + read + ' / ' + this.sites.filter((x) => x.type === 'tome').length + '</small><div class="ow-row"><button class="ow-btn ow-primary" data-act="close">CLOSE</button></div></div>');
        },

        /* ------------------------------------------------ Altar of Trials */
        _startTrial(site) {
            const s = this.s, M = BO.OWRPGMode;
            if (this.isFound(site) && (s.atlas.shrineT[site.id] || 0) > s.playtimeSec) { M.toast('The altar is dormant. It will stir again in ' + Math.ceil(((s.atlas.shrineT[site.id] || 0) - s.playtimeSec) / 60) + ' min.', '#94a3b8'); return; }
            const pool = BO.OWRPGWorldSim.encounterPool ? BO.OWRPGWorldSim.encounterPool(site.region) : null;
            const group = pool && pool.length ? pool[Math.floor(Math.random() * pool.length)] : ['raider', 'raider'];
            const y = BO.World.terrainHeight(site.x, site.z);
            const spawn = (id, ang, dist) => BO.OWRPGAI.spawn(id, site.x + Math.cos(ang) * dist, site.z + Math.sin(ang) * dist, { poiId: null, leash: 90, postR: 5, noChampion: true });
            const champ = spawn(group[0], site.yaw, 9);
            if (!champ) return;
            champ.eventHostile = true; champ.hostile = true;
            BO.OWRPGChampions.make(champ, 2);
            const minions = [];
            for (let i = 1; i <= 2; i++) {
                const m = spawn(group[i % group.length], site.yaw + i * 2.1, 8);
                if (m) { m.eventHostile = true; m.hostile = true; minions.push(m); }
            }
            for (const a of [champ, ...minions]) BO.OWRPGAI.engage(a, false);
            this._play(DD().TYPES.altar);
            this.trial = { site, champ, minions, y };
            const v = this.live.get(site.id);
            if (v) this._refreshState(v);
            BO.Events.emit('hud:banner', { title: 'TRIAL OF CHAMPIONS', sub: 'Slay ' + champ.name + ' (' + BO.OWRPGChampions.label(champ) + ')', color: '#f43f5e' });
        },

        _updateTrial() {
            const tr = this.trial, P = BO.Player, s = this.s, M = BO.OWRPGMode;
            if (!P.alive || BO.Math.dist2D(P.pos.x, P.pos.z, tr.site.x, tr.site.z) > TRIAL_RANGE) {
                for (const a of [tr.champ, ...tr.minions]) if (a.alive && BO.OWRPGAI.agents.includes(a)) BO.OWRPGAI.despawn(a);
                this.trial = null;
                M.toast('The trial fades. The altar waits for a worthier challenger.', '#94a3b8');
                return;
            }
            if (tr.champ.alive) return;
            const T = DD().TYPES.altar;
            const fx = BO.OWRPGCharacter.perkFx(s);
            const xp = Math.round((T.xp + tr.site.tier * 14) * (1 + (fx.discoveryXp || 0)));
            s.atlas.trials = (s.atlas.trials || 0) + 1;
            s.atlas.shrineT[tr.site.id] = s.playtimeSec + 900;
            M.dropLoot(new THREE.Vector3(tr.site.x, tr.y + 1, tr.site.z), 'champion', 2);
            if (!this.isFound(tr.site)) this._markFound(tr.site, xp, T);
            else M.giveXp(Math.round(xp * 0.5), 'Trial');
            M.setFlag('trials_won', s.atlas.trials);
            BO.Events.emit('hud:banner', { title: 'TRIAL COMPLETE', sub: 'The altar yields its reward', color: '#f43f5e' });
            this.trial = null;
            const v = this.live.get(tr.site.id);
            if (v) this._refreshState(v);
        },

        /* ------------------------------------------------ map layers */
        drawOnMinimap(dot, P) {
            const C = BO.OWRPGCartography;
            const range = C ? C.range() : 120;
            const T = DD().TYPES;
            for (const site of this.sites) {
                if (Math.abs(site.x - P.pos.x) > range || Math.abs(site.z - P.pos.z) > range) continue;
                const found = this.isFound(site);
                const near = Math.hypot(site.x - P.pos.x, site.z - P.pos.z) < 40;
                if (found) dot(site.x, site.z, site.type === 'shrine' && this.shrineReady(site) ? T.shrine.color : 'rgba(203,213,225,0.55)', 5, T[site.type].icon);
                else if (near || site.type === 'vista') dot(site.x, site.z, T[site.type].color, near ? 6 : 5, near ? T[site.type].icon : '?');
            }
        },

        drawOnWorldMap(g, X, Z) {
            const T = DD().TYPES;
            g.textAlign = 'center'; g.textBaseline = 'middle';
            for (const site of this.sites) {
                const found = this.isFound(site);
                const charted = BO.OWRPGCartography && BO.OWRPGCartography.isExplored(site.x, site.z);
                if (!found && !(site.type === 'vista' && charted)) continue;
                g.font = '900 ' + (found ? 12 : 13) + 'px Segoe UI, sans-serif';
                g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.7)';
                g.strokeText(found ? T[site.type].icon : '?', X(site.x), Z(site.z));
                g.fillStyle = found ? T[site.type].color : '#e2e8f0';
                g.fillText(found ? T[site.type].icon : '?', X(site.x), Z(site.z));
            }
            g.textBaseline = 'alphabetic';
        },

        /** Developer helper: closest unfound site. */
        nearestUnfound(x, z) {
            let best = null, bd = Infinity;
            for (const site of this.sites) {
                if (this.isFound(site)) continue;
                const d = Math.hypot(site.x - x, site.z - z);
                if (d < bd) { bd = d; best = site; }
            }
            return best;
        }
    };

    BO.OWRPGDiscoveries = Disc;
    if (BO.OWRPGMode) BO.OWRPGMode.registerSystem(Disc);
})(window.BO);
