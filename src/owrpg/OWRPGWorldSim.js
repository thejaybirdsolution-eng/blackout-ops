/* ============================================================================
   BLACKOUT OPS — Open World RPG · World Simulation
   Preserves the panoramic skybox texture on scene.background (tinting fog
   and lights cleanly across day/night/interiors). Drives POI streaming,
   expanded regional encounters, dynamic World Events, and weather motes.
============================================================================ */
(function (BO) {
    'use strict';

    const DAY = 2400;
    const ACTIVE_MAX = 24;
    const RESPAWN_SEC = 600;
    const ENCOUNTERS = {
        haven_basin: [['raider', 'raider'], ['crawler', 'brood_venom_mite', 'crawler'], ['raider', 'raider_marksman'], ['raider_pyro', 'raider']],
        rust_sprawl: [['raider', 'raider_bruiser'], ['enforcer', 'syn_arc_tech'], ['stalker', 'brood_venom_mite'], ['syn_sniper', 'enforcer']],
        mire_delta: [['stalker', 'spitter'], ['brood_blight_hound', 'brood_venom_mite'], ['brood_frost_wraith', 'spitter'], ['brute']],
        ash_quarry: [['brood_pyro_fiend', 'stalker'], ['militia', 'militia_scout'], ['enforcer', 'syn_gunner'], ['brood_iron_goliath']],
        alpine_array: [['aegis', 'aegis_cryo'], ['aegis_heavy', 'aegis'], ['brood_frost_wraith', 'stalker']],
        whispering_woods: [['timber_wolf', 'timber_wolf'], ['forest_poacher', 'orc_reaver'], ['puglin_scamp', 'treasure_puglin']],
        barrow_moor: [['skeleton_warrior', 'grave_zombie'], ['barrow_ghost', 'crypt_keeper'], ['blood_vampire', 'grave_zombie']],
        sunscorched_badlands: [['dune_scorpion', 'sunfang_guardian'], ['sunfang_guardian', 'imp_firestarter']],
        sunken_coast: [['drowned_corsair', 'abyssal_siren'], ['drowned_corsair', 'brood_frost_wraith']],
        frostfang_peaks: [['frost_knight', 'glacier_troll'], ['frost_wyrmling', 'frost_knight']],
        obsidian_dragonwilds: [['obsidian_cultist', 'ashen_drake'], ['dragonwild_juggernaut', 'ashen_drake']],
        meridian_core: [['helix', 'helix_voidweaver'], ['helix_zealot', 'brood_void_stalker'], ['brood_iron_goliath', 'helix']]
    };
    const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const _c1 = new THREE.Color(), _c2 = new THREE.Color();

    const Sim = {
        light: 1,
        poiAgents: {},
        region: null,
        encT: 30,
        encN: 0,
        hasSkybox: false,

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
            // Preserve panoramic skybox texture if applied; only set flat color as fallback!
            this.hasSkybox = !!(scene.background && scene.background.isTexture);
            if (!this.hasSkybox) scene.background = new THREE.Color(atm.skyBottom);
            if (this.sun) {
                scene.add(this.sun.target);
                const cam = this.sun.shadow.camera;
                cam.left = -60; cam.right = 60; cam.top = 60; cam.bottom = -60; cam.far = 260;
                cam.updateProjectionMatrix();
            }
        },

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

        tick1(dt) {
            const s = this.s;
            const P = BO.Player;
            const D = this.D;
            const inside = D.isInterior(P.pos.x, P.pos.z);
            if (!inside) {
                const reg = D.regionAt(P.pos.x, P.pos.z);
                if (reg !== this.region) {
                    if (this.region) BO.Events.emit('hud:banner', { title: reg.name.toUpperCase(), sub: `Threat level ${reg.lvl}`, color: '#f5a623' });
                    this.region = reg;
                    BO.OWRPGWorldArt.setRegionWeather?.(BO.World, reg.id);
                }
            }
            // Unload distant areas before filling nearby areas, including teleport destinations.
            for (const poi of D.POIS) if (this.poiAgents[poi.id] && BO.Math.dist2D(P.pos.x, P.pos.z, poi.x, poi.z) > poi.r + 150) this.despawnPoi(poi);
            for (const poi of D.POIS.slice().sort((a, b) => Math.hypot(P.pos.x-a.x, P.pos.z-a.z) - Math.hypot(P.pos.x-b.x, P.pos.z-b.z))) {
                const d = BO.Math.dist2D(P.pos.x, P.pos.z, poi.x, poi.z);
                const st = s.poiStates[poi.id] || (s.poiStates[poi.id] = {});
                if (!st.discovered && d < poi.r) this.discover(poi);
                if (d < poi.r + 85 && poi.spawns) this.spawnPoi(poi);
            }
            this._encounters(dt, inside);
            if (BO.OWRPGEvents) BO.OWRPGEvents.tick(dt);
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
            const list = this.poiAgents[poi.id] || (this.poiAgents[poi.id] = []);
            const owner = BO.OWRPGFactions.poiOwner(s, poi);
            for (let index = 0; index < poi.spawns.length; index++) {
                const sp = poi.spawns[index];
                const previous = list.find(a => a.spawnIndex === index);
                if (previous && (previous.alive || s.playtimeSec < previous.respawnAt)) continue;
                if (BO.OWRPGAI.agents.filter(a => a.alive).length >= ACTIVE_MAX) break;
                const def = BO.OWRPGStatsData.ENEMIES[sp[0]];
                if (!def) continue;
                if (poi.kind === 'contested' && owner && BO.OWRPGFactionsData.FACTIONS[def.faction] && def.faction !== owner) continue;
                if (previous) {
                    if (BO.OWRPGAI.agents.includes(previous)) BO.OWRPGAI.despawn(previous);
                    list.splice(list.indexOf(previous), 1);
                }
                const x = poi.x + sp[1], z = poi.z + sp[2];
                const y = sp[3] != null ? (poi.interior ? 0 : BO.World.terrainHeight(poi.x, poi.z)) + sp[3] : (poi.interior ? 0 : null);
                const a = BO.OWRPGAI.spawn(sp[0], x, z, { poiId: poi.id, y, leash: poi.interior ? 80 : poi.r + 40, postR: def.boss ? 2 : (sp[3] != null ? 1.2 : 5) });
                if (a) { a.spawnIndex = index; list.push(a); }
            }
            st.spawned = list.length;
        },

        despawnPoi(poi) {
            const list = this.poiAgents[poi.id] || [];
            for (const a of list) if (BO.OWRPGAI.agents.includes(a)) BO.OWRPGAI.despawn(a);
            delete this.poiAgents[poi.id];
        },

        onAgentKilled(a) {
            const s = this.s;
            const poi = this.D.POIS.find((p) => p.id === a.poiId);
            if (!poi) return;
            a.respawnAt = s.playtimeSec + RESPAWN_SEC;
            const list = this.poiAgents[poi.id] || [];
            const st = s.poiStates[poi.id] || (s.poiStates[poi.id] = {});
            if (a.boss) st.deadUnique = [...new Set([...(st.deadUnique || []), a.defId])];
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
            const P = BO.Player;
            const D = this.D;
            if (inside) return;
            const nearPoi = D.POIS.some((p) => BO.Math.dist2D(P.pos.x, P.pos.z, p.x, p.z) < p.r + 25);
            const moving = Math.hypot(P.vel.x, P.vel.z) > 1.5;
            if (nearPoi || !moving) return;
            this.encT -= dt;
            if (this.encT > 0 || BO.OWRPGAI.agents.filter(a => a.alive).length > 14) return;
            this.encT = 25 + Math.random() * 15;
            const reg = D.regionAt(P.pos.x, P.pos.z);
            const group = BO.Math.pick(ENCOUNTERS[reg.id] || ENCOUNTERS.haven_basin);
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
