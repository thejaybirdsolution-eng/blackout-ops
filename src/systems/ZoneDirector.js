/* ============================================================================
   BLACKOUT OPS — Zone threat director
   · Senses: sight cones (shorter at night, much longer if you carry a light),
     hearing (footsteps by gait, gunshots and loud actions as noise events),
     smell (bleeding). States: idle → curious → hunting → back to curious.
   · Population: per-region threat × day/night cap, spawning out of sight on
     walkable ground, near nests where present, with a tension breather when
     you are hurt or low on ammo. Far, unaware infected despawn.
   · PMC scavengers patrol between points of interest from day 2.
   · Level of detail: far AI ticks less often and hides beyond the fog.
============================================================================ */
(function (BO) {
    'use strict';

    const REGION_FACTOR = [0, 0.7, 1.0, 1.35, 1.7, 2.1];

    class ZoneDirector {
        start(mode) {
            this.mode = mode;
            this.noises = [];
            this.nextSpawn = 0;
            this.nextPatrol = 0;
            this.senseClock = 0;
            this.frame = 0;
            this.tension = 0.5;
            this.lastHit = -99;
            this.detected = 0;
        }

        stop() { this.mode = null; }

        /** Something loud happened: every infected within `radius` may investigate. */
        noise(x, z, radius, kind = 'noise') {
            const m = this.mode;
            if (!m) return;
            this.noises.push({ x, z, radius, kind, t: m.clock });
            if (this.noises.length > 24) this.noises.shift();
            m.noiseRing = Math.max(m.noiseRing || 0, Math.min(1, radius / 120));
            for (const zb of m.zombies) {
                if (!zb.alive) continue;
                const d = Math.hypot(zb.pos.x - x, zb.pos.z - z);
                if (d > radius) continue;
                const s = this.sense(zb);
                if (s.state === 'hunt') continue;
                s.state = 'curious';
                s.x = x + (Math.random() - 0.5) * 6;
                s.z = z + (Math.random() - 0.5) * 6;
                s.until = m.clock + 22;
            }
        }

        sense(zb) {
            if (!zb.zs) zb.zs = { state: 'idle', home: { x: zb.pos.x, z: zb.pos.z }, x: zb.pos.x, z: zb.pos.z, until: 0, seen: -99, wander: 0 };
            return zb.zs;
        }

        /** Perception ranges for the player right now. */
        perception() {
            const m = this.mode;
            const c = m.campaign;
            const p = BO.Player;
            const night = c.isNight || c.has('blackout');
            const lit = c.pack.lightUntil > m.clock;
            const stealth = c.deep?.stealthFactor ?? 1;
            const speed = Math.hypot(p.vel.x, p.vel.z);
            let sight = night ? (lit ? 46 : 15) : 32;
            sight *= Math.min(1.25, stealth / 0.85);
            const fm = BO.ZoneFinale?.detectMult ?? 1;
            const ghostMult = Math.max(0.55, 1 - (BO.SurvivalCareer?.masteryRank?.('ghost') || 0) * 0.12);
            const kitStealth = (c.day === 1 && BO.SurvivalCareer?.profile?.kit === 'keeper') ? 0.72 : (BO.SurvivalCareer?.profile?.kit === 'signal_ghost' ? 0.82 : 1);
            sight *= fm * kitStealth;
            const T = BO.ZoneThrill;
            const wpStealth = BO.ZoneWorldPlus?.stealthMult?.() ?? 1;
            if (T?.active) sight *= T.sightMult();
            sight *= wpStealth;
            const hear = (p.crouching ? 2.5 : speed > 5.2 ? 17 : speed > 1 ? 8 : 3) * fm * ghostMult * kitStealth * wpStealth * (T?.active ? T.hearMult() : 1);
            const smell = (c.deep?.bleeding || 0) > 0 ? 15 : 0;
            return { sight, hear, smell, night };
        }

        updateSenses() {
            const m = this.mode;
            const p = BO.Player;
            const per = this.perception();
            const eyeY = p.pos.y + 1.4;
            let hunting = 0;
            for (const zb of m.zombies) {
                if (!zb.alive) continue;
                const s = this.sense(zb);
                const dx = p.pos.x - zb.pos.x, dz = p.pos.z - zb.pos.z;
                const d = Math.hypot(dx, dz);
                let detect = false;
                if (zb.bossLabel && d < 42) detect = true;
                else if (d < 2.6 || d < per.hear || d < per.smell) detect = true;
                else if (d < per.sight * (s.state === 'hunt' ? 1.6 : 1)) {
                    const fwdX = Math.sin(zb.yaw || 0), fwdZ = Math.cos(zb.yaw || 0);
                    const dot = (fwdX * dx + fwdZ * dz) / (d || 1);
                    if ((s.state === 'hunt' || dot > 0.45) && BO.World.hasLineOfSight(zb.pos.x, zb.pos.y + 1.5, zb.pos.z, p.pos.x, eyeY, p.pos.z)) detect = true;
                }
                if (detect && p.alive) {
                    if (s.state !== 'hunt' && zb.spec?.attackType !== 'suicide_blast') {
                        const label = zb.bossLabel ? zb.bossLabel + ' roar' : (zb.spec?.name || 'Infected') + ' alerted';
                        if (BO.Sound?.playSpatialInfected) BO.Sound.playSpatialInfected(zb.spec?.soundProfile || 'groan_mid', zb.pos, label);
                        else BO.Sound?.playZombieGroan?.(zb.spec?.soundProfile || 'groan_mid', 0.55);
                    }
                    s.state = 'hunt';
                    s.seen = m.clock;
                } else if (s.state === 'hunt' && m.clock - s.seen > 18) {
                    s.state = 'curious';
                    s.x = p.pos.x; s.z = p.pos.z;
                    s.until = m.clock + 14;
                } else if (s.state === 'curious' && m.clock > s.until) {
                    s.state = 'idle';
                    s.home = { x: zb.pos.x, z: zb.pos.z };
                }
                zb.powerMoveScale = s.state === 'hunt' ? 1 : s.state === 'curious' ? 0.62 : 0.3;
                if (s.state === 'hunt') hunting++;
            }
            this.detected = hunting;
        }

        /** ZombieEntity target hook: null = chase the player; otherwise a point to walk to. */
        getTarget(zb) {
            const s = this.sense(zb);
            if (s.state === 'hunt') return null;
            const m = this.mode;
            if (s.state === 'curious') return { x: s.x, y: zb.pos.y, z: s.z, attackRange: -1, forceDirect: false };
            if (m.clock > s.wander) {
                s.wander = m.clock + 6 + Math.random() * 6;
                const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 9;
                s.x = s.home.x + Math.cos(a) * r;
                s.z = s.home.z + Math.sin(a) * r;
            }
            return { x: s.x, y: zb.pos.y, z: s.z, attackRange: -1, forceDirect: true };
        }

        onPlayerHurt() { this.lastHit = this.mode.clock; }

        /** 0 = desperate (fewer spawns), 1 = comfortable (more pressure). */
        updateTension() {
            const m = this.mode;
            const p = BO.Player;
            const hpF = p.hp / p.maxHp;
            const w = p.activeWeapon;
            const cal = w ? BO.ZoneLoot.caliberOf(w) : null;
            const ammoF = cal ? Math.min(1, ((m.points[cal] || 0) + (w.mag || 0)) / Math.max(1, w.stats.magSize * 3)) : 0.6;
            const recent = m.clock - this.lastHit < 20 ? 0.25 : 0;
            const target = BO.Math.clamp(hpF * 0.6 + ammoF * 0.4 - recent, 0, 1);
            this.tension = BO.Math.lerp(this.tension, target, 0.05);
        }

        regionThreat(x, z) { return BO.Zone.regionAt(x, z).threat; }

        spawnPoint(minD = 36, maxD = 105) {
            const p = BO.Player.pos;
            const nav = BO.World.nav;
            const nests = BO.Zone.markers.filter((mk) => mk.kind === 'nest' && !this.mode.campaign.metrics['nest_' + mk.id] && Math.hypot(mk.x - p.x, mk.z - p.z) < 135 && Math.hypot(mk.x - p.x, mk.z - p.z) > 24);
            const pois = (BO.Zone.pois || []).filter((poi) => poi.type !== 'haven' && Math.hypot(poi.x - p.x, poi.z - p.z) < 125 && Math.hypot(poi.x - p.x, poi.z - p.z) > 28);
            const roads = BO.Zone.roads || [];
            for (let tries = 0; tries < 20; tries++) {
                let x, z;
                const roll = Math.random();
                if (nests.length && roll < 0.34) {
                    const n = nests[Math.floor(Math.random() * nests.length)];
                    x = n.x + (Math.random() - 0.5) * 16; z = n.z + (Math.random() - 0.5) * 16;
                } else if (pois.length && roll < 0.62) {
                    const poi = pois[Math.floor(Math.random() * pois.length)];
                    const ang = Math.random() * Math.PI * 2;
                    const rad = Math.max(poi.w || 10, poi.d || 10) * 0.55 + 4 + Math.random() * 10;
                    x = poi.x + Math.cos(ang) * rad; z = poi.z + Math.sin(ang) * rad;
                } else if (roads.length && roll < 0.78) {
                    const rd = roads[Math.floor(Math.random() * roads.length)];
                    const pt = rd.pts[Math.floor(Math.random() * rd.pts.length)];
                    x = pt[0] + (Math.random() - 0.5) * 14; z = pt[1] + (Math.random() - 0.5) * 14;
                } else {
                    const a = Math.random() * Math.PI * 2, r = minD + Math.random() * (maxD - minD);
                    x = p.x + Math.cos(a) * r; z = p.z + Math.sin(a) * r;
                }
                const i = nav?.idx(x, z) ?? -1;
                if (i < 0 || !nav.walk[i]) continue;
                const y = nav.y[i];
                const dp = Math.hypot(x - p.x, z - p.z);
                if (dp < 24 || dp > maxD + 22) continue;
                if (BO.ZoneInfest?.isSafe(x, z)) continue; // secured ground stays quiet
                if (BO.ZoneWorldPlus?.isInsideUnlockedFort?.(x, z)) continue;
                if (BO.World.hasLineOfSight(p.x, p.y + 1.6, p.z, x, y + 1.4, z) && dp < 76) continue;
                return { x, y, z };
            }
            return null;
        }

        nearbyCount(radius = 135) {
            const p = BO.Player.pos;
            return this.mode.zombies.filter((zb) => zb.alive && !zb.bossLabel && !zb.infest && !zb.contract && !zb.dungeon && !zb.arena && Math.hypot(zb.pos.x - p.x, zb.pos.z - p.z) < radius).length;
        }

        cap() {
            const m = this.mode;
            const t = m.threat || m.updateThreat();
            const p = BO.Player.pos;
            const rf = REGION_FACTOR[this.regionThreat(p.x, p.z)] || 1;
            const breather = this.tension < 0.35 ? 0.55 : this.tension > 0.8 ? 1.15 : 1;
            const tierCap = m.tierSpec?.cap || 1;
            return Math.max(1, Math.round(t.cap * rf * breather * tierCap * (BO.ZoneFinale?.spawnMult ?? 1)));
        }

        update(dt) {
            const m = this.mode;
            if (!m) return;
            this.frame++;
            m.noiseRing = Math.max(0, (m.noiseRing || 0) - dt * 0.9);
            this.senseClock -= dt;
            if (this.senseClock <= 0) {
                this.senseClock = 0.2;
                this.updateSenses();
                this.updateTension();
            }
            if (!m.hostilesReleased) return;
            const p = BO.Player.pos;
            // Despawn far, unaware infected so the population follows the player.
            for (const zb of m.zombies) {
                if (!zb.alive || zb.bossLabel || zb.horde || zb.herd || zb.distress || zb.infest || zb.contract || zb.dungeon || zb.legend || zb.arena || zb.zs?.state === 'hunt') continue;
                if (Math.hypot(zb.pos.x - p.x, zb.pos.z - p.z) > 155) {
                    zb.alive = false;
                    zb.despawned = true;
                    zb.deathTimer = 0;
                    if (zb.parts?.root) zb.parts.root.visible = false;
                }
            }
            const t = m.threat;
            if (m.clock >= this.nextSpawn && !m.campaign.has('noRoamers')) {
                const c = m.campaign;
                const rate = m.difficultyRules.rate * (c.options.pool === 'horde' ? 1.3 : 1) * (c.isNight ? (c.has('brutalNights') ? 2 : 1.3) : 1);
                this.nextSpawn = m.clock + Math.max(3, (t.interval * 0.55) / rate);
                const cap = this.cap();
                let n = this.nearbyCount();
                let spawned = 0;
                // Roamers come in small groups, and about a third are already drifting your way.
                const pt = n < cap ? this.spawnPoint(38, 100) : null;
                if (pt) {
                    const region = BO.Zone.regionAt(pt.x, pt.z);
                    c.selectedEnemies = c.getPool(region.id);
                    const group = Math.min(cap - n, 1 + Math.floor(Math.random() * 3));
                    const drift = Math.random() < 0.35;
                    const nav = BO.World.nav;
                    for (let g = 0; g < group; g++) {
                        let x = pt.x + (Math.random() - 0.5) * 6, z = pt.z + (Math.random() - 0.5) * 6;
                        const j = nav?.idx(x, z) ?? -1;
                        if (j < 0 || !nav.walk[j]) { x = pt.x; z = pt.z; }
                        const zb = m.spawnInfected(x, BO.World.getGroundHeight(x, z, pt.y + 2), z);
                        if (!zb) break;
                        if (drift) { const s = this.sense(zb); s.state = 'curious'; s.x = p.x + (Math.random() - 0.5) * 20; s.z = p.z + (Math.random() - 0.5) * 20; s.until = m.clock + 30; }
                        n++;
                        spawned++;
                    }
                }
            }
            this.updatePatrols();
            this.updateGuardians();
        }

        /** Region guardians: a named heavy infected holds each nest and the Crater. They wake when you come close. */
        updateGuardians() {
            const m = this.mode;
            if ((this.frame % 30) !== 0) return;
            const p = BO.Player.pos;
            const c = m.campaign;
            for (const g of BO.ZoneBosses.GUARDIANS) {
                if ((c.metrics['boss_' + g.type] || 0) > 0) continue;
                if (g.minDay && c.day < g.minDay) continue;
                const mk = m.markers.find((x) => x.id === g.at) || BO.Zone.markers.find((x) => x.id === g.at);
                if (!mk) continue;
                const live = m.zombies.find((z) => z.alive && z.survivalType === g.type);
                const d = Math.hypot(mk.x - p.x, mk.z - p.z);
                if (live) {
                    if (d > 170) { live.alive = false; live.despawned = true; live.deathTimer = 0; if (live.parts?.root) live.parts.root.visible = false; }
                    continue;
                }
                if (d > 70 || d < 22) continue;
                const a = Math.random() * Math.PI * 2;
                const x = mk.x + Math.cos(a) * 5, z = mk.z + Math.sin(a) * 5;
                const zb = m.spawnInfected(x, BO.World.getGroundHeight(x, z, mk.y + 20), z, g.type, null, true);
                if (zb) {
                    zb.zs = { state: 'idle', seen: 0, home: { x: mk.x, z: mk.z }, x: mk.x, z: mk.z, until: 0, wander: 0 };
                    m.toast('Something large is moving near the ' + mk.name.toLowerCase() + '.');
                }
            }
        }

        updatePatrols() {
            const m = this.mode;
            const c = m.campaign;
            if (!m.threat?.patrols || c.has('noPatrols') || m.clock < this.nextPatrol) return;
            this.nextPatrol = m.clock + 40;
            const alive = m.bots.filter((b) => b.alive && b.team === 1).length;
            const want = Math.min(8, c.day * 2);
            if (alive >= want) return;
            const p = BO.Player.pos;
            const spots = BO.Zone.pois.filter((poi) => (poi.tier || 1) >= 2 && Math.hypot(poi.x - p.x, poi.z - p.z) > 75 && Math.hypot(poi.x - p.x, poi.z - p.z) < 190);
            if (!spots.length) return;
            const s = spots[Math.floor(Math.random() * spots.length)];
            const squad = Math.min(3, want - alive);
            const weapons = c.day >= 5 ? ['ak47', 'm4a1', 'mp5'] : ['mp5', 'm1911', 'r870'];
            for (let i = 0; i < squad; i++) {
                const x = s.x + 6 + i * 1.8, z = s.z + 6;
                const bot = m.spawnBot(x, BO.World.getGroundHeight(x, z, 60), z, weapons[i % weapons.length], 90 + c.day * 6);
                if (bot) bot.post = { x: s.x, y: s.y || 0, z: s.z, r: 24 };
            }
        }

        /** AI level of detail: returns false when this entity should skip its tick this frame. */
        lodTick(unit, dt) {
            const p = BO.Player.pos;
            const d = Math.hypot(unit.pos.x - p.x, unit.pos.z - p.z);
            if (unit.parts?.root) unit.parts.root.visible = d < 175;
            if (d < 90 || unit.zs?.state === 'hunt') { unit._lodAcc = 0; return dt; }
            unit._lodAcc = (unit._lodAcc || 0) + dt;
            if ((this.frame + (unit.id || 0)) % 3 !== 0) return 0;
            const acc = Math.min(0.15, unit._lodAcc);
            unit._lodAcc = 0;
            return acc;
        }
    }

    BO.ZoneDirector = new ZoneDirector();

    /* Named heavy infected. Each guards a nest or landmark and carries a campus keycard (the Warden excepted). */
    const BOSSES = {
        butcher: { label: 'The Butcher of Hollow Town', spec: 'boss_butcher', hp: 760 },
        stalker: { label: 'Den Mother', spec: 'boss_lycan_king', hp: 820 },
        colossus: { label: 'Yard Colossus', spec: 'boss_colossus', hp: 980 },
        plague: { label: 'Spillway Bloat', spec: 'boss_plague', hp: 880 },
        warden: { label: 'The Warden', spec: 'boss_nyx', hp: 1600 },
        // Legacy contact challenge bosses keep working.
        frostBoss: { label: 'Pale Maul', spec: 'boss_ogre_emperor', hp: 720 },
        cinderBoss: { label: 'Cinder Regent', spec: 'boss_cerberus', hp: 980 },
        apex: { label: 'Apex Guardian', spec: 'boss_butcher', hp: 580 },
        siegeBoss: { label: 'Ridge Breaker', spec: 'boss_colossus', hp: 690 },
        geodeBoss: { label: 'Resonant Sentinel', spec: 'boss_hydra_matron', hp: 820 }
    };
    BO.ZoneBosses = {
        BOSSES,
        GUARDIANS: [
            { type: 'butcher', at: 'hollow_nest_a', minDay: 2 },
            { type: 'stalker', at: 'pine_nest', minDay: 2 }
            // The Warden is raised by the finale (ZoneFinale), not as a roaming guardian.
        ],
        isBoss(type) { return !!BOSSES[type]; },
        spec(type) { const b = BOSSES[type]; return BO.ZombiesData.get(b.spec) || BO.ZombiesData.ORDERED_BOSSES?.[0]; },
        hp(type) { return BOSSES[type]?.hp || 600; },
        label(type) { return BOSSES[type]?.label || 'Boss'; }
    };
})(window.BO);
