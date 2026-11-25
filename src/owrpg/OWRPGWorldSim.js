/* ============================================================================
   BLACKOUT OPS — Open World RPG · World Simulation
   Day/night clock (40 min cycle) driving sun, sky and fog; the sun and its
   shadow frustum follow the player. POI streaming rings: spawn at r+85 m,
   despawn past r+150 m, state persisted in s.poiStates. Discovery + region
   banners, area-cleared rewards, contested ownership, wilderness encounters
   every 25–40 s of travel, terrain LOD.
============================================================================ */
(function (BO) {
    'use strict';

    const DAY = 2400;
    const ACTIVE_MAX = 22;
    const RESPAWN_SEC = 900;
    const ENCOUNTERS = {
        haven_basin: [['raider', 'raider'], ['crawler', 'crawler', 'crawler'], ['raider', 'raider_marksman']],
        rust_sprawl: [['raider', 'raider', 'raider'], ['enforcer', 'enforcer'], ['stalker', 'crawler']],
        mire_delta: [['stalker', 'spitter'], ['crawler', 'crawler', 'stalker'], ['brute']],
        ash_quarry: [['stalker', 'stalker'], ['militia', 'militia'], ['enforcer', 'syn_gunner']],
        alpine_array: [['aegis', 'aegis'], ['stalker', 'stalker', 'spitter']],
        meridian_core: [['helix', 'helix'], ['brute', 'stalker'], ['helix', 'spitter']]
    };
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const _c1 = new THREE.Color(), _c2 = new THREE.Color();

    const Sim = {
        light: 1,
        poiAgents: {},
        region: null,
        encT: 30,
        encN: 0,

        get s() { return BO.OWRPGMode.state; },
        get D() { return BO.OWRPGWorldData; },

        init(scene) {
            this.poiAgents = {};
            this.region = null;
            this.encT = 30;
            this.scene = scene;
            this.hemi = scene.children.find((o) => o.isHemisphereLight);
            this.sun = scene.children.find((o) => o.isDirectionalLight);
            const atm = BO.World.mapData.atmosphere;
            this.base = { hemi: atm.hemiIntensity, sun: atm.sunIntensity, fog: new THREE.Color(atm.fogColor), sky: new THREE.Color(atm.skyBottom), fogD: atm.fogDensity };
            scene.background = new THREE.Color(atm.skyBottom);
            if (this.sun) {
                scene.add(this.sun.target);
                const cam = this.sun.shadow.camera;
                cam.left = -60; cam.right = 60; cam.top = 60; cam.bottom = -60; cam.far = 260;
                cam.updateProjectionMatrix();
            }
        },

        /** Hours/minutes string for the HUD (clock 0..2400 → 00:00..24:00). */
        timeLabel() {
            const h = (this.s.worldClock / DAY) * 24;
            const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
            return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
        },

        isNight() { return this.light < 0.35; },

        update(dt) {
            const s = this.s;
            s.worldClock = (s.worldClock + dt) % DAY;
            const P = BO.Player;
            const inside = this.D.isInterior(P.pos.x, P.pos.z);
            const t = s.worldClock / DAY;
            const sunH = Math.sin((t - 0.25) * Math.PI * 2);
            this.light = inside ? 0.3 : 0.12 + 0.88 * smooth(-0.18, 0.3, sunH);
            const k = this.light;
            if (this.hemi) this.hemi.intensity = this.base.hemi * (inside ? 0.45 : 0.22 + 0.78 * k);
            if (this.sun) {
                this.sun.intensity = inside ? 0 : this.base.sun * Math.max(0, smooth(-0.05, 0.3, sunH));
                const ang = t * Math.PI * 2;
                this.sun.position.set(P.pos.x - Math.cos(ang) * 80, P.pos.y + 40 + Math.max(10, sunH * 90), P.pos.z + 50);
                this.sun.target.position.set(P.pos.x, P.pos.y, P.pos.z);
            }
            const sc = BO.World.scene;
            if (sc && sc.fog) {
                const night = _c2.setHex(inside ? 0x0b0d10 : 0x141b26);
                sc.fog.color.copy(_c1.copy(this.base.fog).lerp(night, 1 - k));
                sc.fog.density = inside ? 0.06 : this.base.fogD * (1 + (1 - k) * 0.6);
                if (sc.background && sc.background.isColor) sc.background.copy(_c1.copy(this.base.sky).lerp(night, 1 - k));
            }
            if (BO.World.terrain && !inside) BO.World.terrain.updateLOD(P.pos.x, P.pos.z, 135);
        },

        /** 1 Hz: streaming, discovery, encounters. */
        tick1(dt) {
            const s = this.s;
            const P = BO.Player;
            const D = this.D;
            const inside = D.isInterior(P.pos.x, P.pos.z);
            // Region banner.
            if (!inside) {
                const reg = D.regionAt(P.pos.x, P.pos.z);
                if (reg !== this.region) {
                    if (this.region) BO.Events.emit('hud:banner', { title: reg.name.toUpperCase(), sub: `Threat level ${reg.lvl}`, color: '#f5a623' });
                    this.region = reg;
                }
            }
            for (const poi of D.POIS) {
                const d = BO.Math.dist2D(P.pos.x, P.pos.z, poi.x, poi.z);
                const st = s.poiStates[poi.id] || (s.poiStates[poi.id] = {});
                if (!st.discovered && d < poi.r) this.discover(poi);
                const spawned = this.poiAgents[poi.id];
                if (!spawned && d < poi.r + 85 && poi.spawns) this.spawnPoi(poi);
                else if (spawned && d > poi.r + 150) this.despawnPoi(poi);
            }
            this._encounters(dt, inside);
            // Despawn far wilderness agents.
            for (const a of BO.OWRPGAI.agents.slice()) {
                if (a.poiId && a.poiId.startsWith('enc_') && a.alive && BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, P.pos.x, P.pos.z) > 170) BO.OWRPGAI.despawn(a);
            }
        },

        discover(poi) {
            const s = this.s;
            const st = s.poiStates[poi.id];
            st.discovered = true;
            s.stats.discovered++;
            BO.Events.emit('hud:banner', { title: 'DISCOVERED', sub: poi.name, color: '#a3e635' });
            BO.OWRPGMode.giveXp(poi.kind === 'endgame' ? 150 : 40, null, true);
            BO.OWRPGQuests.onEvent(s, 'discover', poi.id);
            BO.OWRPGMode.checkpoint('Discovered ' + poi.name);
        },

        spawnPoi(poi) {
            const s = this.s;
            const st = s.poiStates[poi.id];
            const list = [];
            this.poiAgents[poi.id] = list;
            if (st.clearedAt != null && s.playtimeSec - st.clearedAt < RESPAWN_SEC && poi.kind !== 'contested') return;
            if (st.clearedAt != null && poi.interior) return;
            const owner = BO.OWRPGFactions.poiOwner(s, poi);
            for (const sp of poi.spawns) {
                if (BO.OWRPGAI.agents.length >= ACTIVE_MAX) break;
                const def = BO.OWRPGStatsData.ENEMIES[sp[0]];
                if (def.boss && s.worldFlags['killed_' + sp[0]]) continue;
                // Contested sites keep only the owner's side once someone has taken them.
                if (poi.kind === 'contested' && owner && BO.OWRPGFactionsData.FACTIONS[def.faction] && def.faction !== owner) continue;
                const x = poi.x + sp[1], z = poi.z + sp[2];
                const y = sp[3] != null ? (poi.interior ? 0 : BO.World.terrainHeight(poi.x, poi.z)) + sp[3] : (poi.interior ? 0 : null);
                const a = BO.OWRPGAI.spawn(sp[0], x, z, { poiId: poi.id, y, leash: poi.interior ? 80 : poi.r + 40, postR: def.boss ? 2 : (sp[3] != null ? 1.2 : 5) });
                if (a) list.push(a);
            }
            st.spawned = list.length;
        },

        despawnPoi(poi) {
            const list = this.poiAgents[poi.id] || [];
            if (list.some((a) => a.alive && a.state === 'combat')) return;
            for (const a of list) if (BO.OWRPGAI.agents.includes(a)) BO.OWRPGAI.despawn(a);
            delete this.poiAgents[poi.id];
        },

        onAgentKilled(a) {
            const s = this.s;
            const poi = this.D.POIS.find((p) => p.id === a.poiId);
            if (!poi) return;
            const list = this.poiAgents[poi.id] || [];
            const st = s.poiStates[poi.id] || (s.poiStates[poi.id] = {});
            if (a.boss) (st.deadUnique || (st.deadUnique = [])).push(a.defId);
            const hostileLeft = list.filter((o) => o.alive && o.hostile).length;
            if (poi.kind === 'contested') {
                const sides = new Set(list.filter((o) => o.alive).map((o) => o.faction));
                if (sides.size === 1) { const f = [...sides][0]; if (BO.OWRPGFactions.poiOwner(s, poi) !== f) { BO.OWRPGFactions.setPoiOwner(s, poi.id, f); BO.Events.emit('hud:banner', { title: 'TERRITORY SHIFT', sub: `${BO.OWRPGFactionsData.FACTIONS[f].name} hold ${poi.name}`, color: BO.OWRPGFactionsData.FACTIONS[f].color }); } }
            }
            if (hostileLeft === 0 && a.hostile && (st.clearedAt == null || s.playtimeSec - st.clearedAt > 60)) {
                st.clearedAt = s.playtimeSec;
                BO.Events.emit('hud:toast', { text: `${poi.name.toUpperCase()} CLEARED`, color: '#a3e635' });
                BO.OWRPGMode.giveXp(60, 'Area cleared', true);
            }
        },

        _encounters(dt, inside) {
            const s = this.s;
            const P = BO.Player;
            const D = this.D;
            if (inside) return;
            const nearPoi = D.POIS.some((p) => BO.Math.dist2D(P.pos.x, P.pos.z, p.x, p.z) < p.r + 25);
            const moving = Math.hypot(P.vel.x, P.vel.z) > 1.5;
            if (nearPoi || !moving) return;
            this.encT -= dt;
            if (this.encT > 0 || BO.OWRPGAI.agents.length > 14) return;
            this.encT = 25 + Math.random() * 15;
            const reg = D.regionAt(P.pos.x, P.pos.z);
            const group = BO.Math.pick(ENCOUNTERS[reg.id]);
            const heading = Math.atan2(P.vel.x, P.vel.z) + (Math.random() - 0.5) * 1.6;
            const dist = 60 + Math.random() * 20;
            const cx = BO.Math.clamp(P.pos.x + Math.sin(heading) * dist, D.BOUNDS.minX + 20, D.BOUNDS.maxX - 20);
            const cz = BO.Math.clamp(P.pos.z + Math.cos(heading) * dist, D.BOUNDS.minZ + 20, D.BOUNDS.maxZ - 20);
            if (BO.World.terrainHeight(cx, cz) < D.WATER + 0.2 || BO.Math.dist2D(cx, cz, D.TOWN.x, D.TOWN.z) < 60) return;
            const id = 'enc_' + (++this.encN);
            group.forEach((e, i) => BO.OWRPGAI.spawn(e, cx + (i % 2) * 3 - 1.5, cz + Math.floor(i / 2) * 3, { poiId: id, leash: 80, postR: 8 }));
            if (Math.random() < 0.5) BO.OWRPGMode.smokeHint(cx, cz);
        }
    };

    BO.OWRPGWorldSim = Sim;
})(window.BO);
