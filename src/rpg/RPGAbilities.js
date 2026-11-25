/* ============================================================================
   BLACKOUT OPS — RPG Class Abilities
   Primer (applies a status) · Detonator (consumes statuses → reactions) ·
   Ultimate (charges from damage dealt). Numbers come from BO.RPGData.CLASSES;
   talent ids are checked by name (see RPGData.TALENTS).
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const UP = new THREE.Vector3(0, 1, 0);
    const _v = new THREE.Vector3();

    const RPGAbilities = {
        lobs: [],
        get M() { return BO.RPGMode; },
        get P() { return BO.Player; },

        classDef() { return BO.RPGData.CLASSES[this.M.stats.classId]; },
        has(t) { return this.M.stats.talents.has(t); },

        /** Effective cooldown for a slot after talents and CDR. */
        cooldownFor(slot) {
            const def = this.classDef().abilities[slot];
            let cd = def.cd || 0;
            if (slot === 'primer') {
                if (this.has('long_breach')) cd -= 2;
                if (this.has('fuel_tank')) cd -= 3;
                if (this.has('quick_draw')) cd -= 2;
            }
            return Math.max(1.5, cd * this.M.stats.cdrMult);
        },

        aim() {
            const cam = this.M.camera || BO.App.worldCamera;
            const origin = cam.position.clone();
            const dir = new THREE.Vector3();
            cam.getWorldDirection(dir);
            const flat = new THREE.Vector3(dir.x, 0, dir.z);
            if (flat.lengthSq() < 1e-6) flat.set(-Math.sin(this.P.yaw), 0, -Math.cos(this.P.yaw));
            flat.normalize();
            return { origin, dir, flat };
        },

        cast(slot) {
            const M = this.M;
            if (!M.active || M.state === 'transition' || M.state === 'ended' || !this.P.alive) return false;
            const A = M.ability;
            if (A.silenced > 0) {
                BO.Events.emit('hud:toast', { text: `SILENCED — ${A.silenced.toFixed(1)} S`, color: '#a855f7' });
                return false;
            }
            if (slot === 'ultimate') {
                if (A.ultActive > 0) return false;
                if (A.ult < 1) {
                    BO.Events.emit('hud:toast', { text: `ULTIMATE ${Math.floor(A.ult * 100)}% — DEAL DAMAGE TO CHARGE IT`, color: '#94a3b8' });
                    return false;
                }
                return this.startUltimate(false);
            }
            const unstoppable = slot === 'primer' && A.ultActive > 0 && A.ultId === 'juggernaut' && this.has('unstoppable');
            if (A.cd[slot] > 0 && !unstoppable) {
                BO.Sound.playEmptyClick();
                return false;
            }
            const def = this.classDef().abilities[slot];
            const ok = this['_' + def.id] ? this['_' + def.id](def) : false;
            if (ok) {
                A.cd[slot] = unstoppable ? 0.35 : this.cooldownFor(slot);
                if (BO.RPGUI) BO.RPGUI.pulseAbility(slot);
            }
            return ok;
        },

        startUltimate(forced) {
            const M = this.M;
            const A = M.ability;
            const def = this.classDef().abilities.ultimate;
            if (!forced) A.ult = 0;
            A.ultId = def.id;
            BO.Sound.playUltimate && BO.Sound.playUltimate('gravity_spikes');
            if (BO.RPGUI) BO.RPGUI.pulseAbility('ultimate');
            if (def.id === 'juggernaut') {
                A.ultActive = this.has('unstoppable') ? 12 : def.duration;
                BO.FX.spawnParticles(this.P.pos.clone().add(UP), 30, 0xf472b6, 5, 0, 0.8, 1.6);
                BO.Events.emit('hud:toast', { text: 'JUGGERNAUT PROTOCOL', color: '#f472b6' });
            } else if (def.id === 'firestorm') {
                this._firestorm(def);
            } else if (def.id === 'storm_cell') {
                this._stormCell(def);
            }
            return true;
        },

        update(dt) {
            const M = this.M;
            const A = M.ability;
            for (const k of ['primer', 'detonator']) if (A.cd[k] > 0) A.cd[k] = Math.max(0, A.cd[k] - dt);
            if (A.silenced > 0) A.silenced = Math.max(0, A.silenced - dt);
            if (A.potionCd > 0) A.potionCd = Math.max(0, A.potionCd - dt);
            if (A.ultActive > 0) {
                A.ultActive -= dt;
                if (A.ultActive <= 0) {
                    A.ultActive = 0;
                    if (A.ultId === 'juggernaut' && this.has('earthsplitter')) this._slam(14, 90, 0.8, true);
                    A.ultId = null;
                }
            }
            this._tickDash(dt);
            this._tickStorm(dt);
            this._tickLobs(dt);
        },

        /* ---------------- Vanguard ---------------- */
        _breach_charge(def) {
            const { flat } = this.aim();
            const dist = def.range * (this.has('long_breach') ? 1.6 : 1);
            const dur = 0.24;
            this.M.ability.dash = { dir: flat.clone(), speed: dist / dur, t: dur, hit: new Set(), def };
            this.P.invulnTimer = Math.max(this.P.invulnTimer, dur + 0.05);
            this.P.cameraShake = Math.max(this.P.cameraShake, 0.03);
            BO.Sound.playSlide();
            BO.FX.spawnParticles(this.P.pos.clone().add(new THREE.Vector3(0, 0.6, 0)), 14, 0xf472b6, 3, 0, 0.4, 1.2);
            return true;
        },

        _tickDash(dt) {
            const M = this.M;
            const d = M.ability.dash;
            if (!d) return;
            const P = this.P;
            const stepT = Math.min(dt, d.t);
            d.t -= stepT;
            const before = P.pos.clone();
            P.pos.addScaledVector(d.dir, d.speed * stepT);
            BO.World.resolveHorizontal(P.pos, P.radius, P.standHeight, true);
            const perp = new THREE.Vector3(-d.dir.z, 0, d.dir.x);
            for (const z of M.enemies) {
                if (!M.isAlive(z) || d.hit.has(z)) continue;
                if (BO.Math.dist2D(z.pos.x, z.pos.z, P.pos.x, P.pos.z) > d.def.width + z.radius) continue;
                d.hit.add(z);
                const side = Math.sign((z.pos.x - P.pos.x) * perp.x + (z.pos.z - P.pos.z) * perp.z) || 1;
                z.vel.x += perp.x * side * 9 + d.dir.x * 4;
                z.vel.z += perp.z * side * 9 + d.dir.z * 4;
                const ids = ['expose'];
                if (this.has('thermite_plating')) ids.push('burn');
                if (this.has('frost_breaker')) ids.push('chill');
                M.dealDamage(z, d.def.damage, { source: 'ability', dir: d.dir });
                M.applyPrimer(z, ids);
                if (this.has('shoulder_check') && M.isAlive(z)) z.stunTimer = Math.max(z.stunTimer, 1.5);
                BO.Sound.playMelee();
            }
            if (Math.random() < 0.6) BO.FX.spawnParticles(before.add(new THREE.Vector3(0, 0.5, 0)), 3, 0xf472b6, 1.5, 0, 0.3, 1.0);
            if (d.t <= 0) M.ability.dash = null;
        },

        _concussion_slam(def) {
            const M = this.M;
            const radius = def.radius * (this.has('tectonic') ? 1.5 : 1);
            if (this.has('magnet_slam')) {
                for (const z of M.enemiesInRadius(this.P.pos, 10)) {
                    _v.set(this.P.pos.x - z.pos.x, 0, this.P.pos.z - z.pos.z);
                    const len = _v.length();
                    if (len > 0.5) { _v.multiplyScalar(1 / len); z.vel.x += _v.x * 11; z.vel.z += _v.z * 11; z.vel.y = 3; }
                }
                M.timers.push({ t: 0.3, fn: () => this._slam(radius, def.damage, def.stun, false) });
            } else {
                this._slam(radius, def.damage, def.stun, false);
            }
            if (this.has('aftershock')) M.timers.push({ t: 1.0 + (this.has('magnet_slam') ? 0.3 : 0), fn: () => this._slam(radius, def.damage * 0.6, 0.5, false) });
            return true;
        },

        _slam(radius, damage, stun, big) {
            const M = this.M;
            if (!M.active || !this.P.alive) return;
            const P = this.P;
            BO.FX.spawnExplosion(P.pos.clone().add(new THREE.Vector3(0, 0.2, 0)), radius * 0.75, big ? 0xfbbf24 : 0xf472b6);
            BO.Sound.playExplosion(big ? 1.0 : 0.7);
            P.cameraShake = Math.max(P.cameraShake, big ? 0.09 : 0.05);
            for (const z of M.enemiesInRadius(P.pos, radius)) {
                const dealt = M.dealDamage(z, damage, { source: 'ability' });
                M.detonate(z, dealt); // detonators fire even when the hit is lethal
                if (!M.isAlive(z)) continue;
                z.stunTimer = Math.max(z.stunTimer, stun);
                if (this.has('static_gauntlets')) M.applyStatus(z, 'shock');
            }
        },

        /* ---------------- Pyrotech ---------------- */
        _napalm_lob(def) {
            const M = this.M;
            const { origin, dir } = this.aim();
            const start = origin.clone().addScaledVector(dir, 0.8).add(new THREE.Vector3(0, -0.2, 0));
            const vel = dir.clone().multiplyScalar(17).add(new THREE.Vector3(0, 4.5, 0));
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
            mesh.position.copy(start);
            BO.World.scene.add(mesh);
            M.props.push({ mesh });
            this.lobs.push({ mesh, pos: start, vel, t: 3, def });
            BO.Sound.playGrenadeBounce();
            return true;
        },

        _tickLobs(dt) {
            for (let i = this.lobs.length - 1; i >= 0; i--) {
                const p = this.lobs[i];
                if (!p.mesh.parent) { this.lobs.splice(i, 1); continue; } // floor was cleared
                p.t -= dt;
                p.vel.y -= 20 * dt;
                const step = p.vel.clone().multiplyScalar(dt);
                const len = step.length();
                const wall = len > 0 ? BO.World.raycastWorld(p.pos, step.clone().normalize(), len + 0.1) : null;
                p.pos.add(step);
                p.mesh.position.copy(p.pos);
                if (Math.random() < 0.5) BO.FX.spawnParticles(p.pos.clone(), 1, 0xfb923c, 0.6, -1, 0.3, 0.8);
                const ground = BO.World.getGroundHeight(p.pos.x, p.pos.z, p.pos.y + 0.3);
                if (wall || p.pos.y <= ground || p.t <= 0) {
                    const at = wall ? wall.point.clone() : p.pos.clone();
                    at.y = BO.World.getGroundHeight(at.x, at.z, at.y + 0.5);
                    BO.World.scene.remove(p.mesh);
                    this.lobs.splice(i, 1);
                    this._napalmImpact(at, p.def);
                }
            }
        },

        _napalmImpact(at, def) {
            const M = this.M;
            const dur = this.has('sticky_napalm') ? 7 : def.duration;
            const spots = this.has('cluster_lob')
                ? [0, 1, 2].map((i) => new THREE.Vector3(at.x + Math.cos(i * 2.094) * 2.6, at.y, at.z + Math.sin(i * 2.094) * 2.6))
                : [at];
            const r = this.has('cluster_lob') ? def.radius * 0.75 : def.radius;
            BO.FX.spawnExplosion(at.clone().add(new THREE.Vector3(0, 0.3, 0)), 2.5, 0xf97316);
            BO.Sound.playExplosion(0.5);
            for (const s of spots) {
                const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }));
                mesh.rotation.x = -Math.PI / 2;
                mesh.position.set(s.x, s.y + 0.04, s.z);
                BO.World.scene.add(mesh);
                M.pools.push({ x: s.x, z: s.z, r, t: dur, tick: 0, damage: def.tick, mesh });
            }
        },

        _flashover(def) {
            const M = this.M;
            const { origin, flat } = this.aim();
            const range = def.range * (this.has('backdraft') ? 1.5 : 1);
            const cone = this.has('wide_angle') ? 0.17 : def.cone;
            const P = this.P;
            BO.FX.spawnConeShockwave(origin.clone().add(new THREE.Vector3(0, -0.3, 0)), flat);
            for (let i = 0; i < 24; i++) {
                const spread = (Math.random() - 0.5) * (1.2 - cone);
                const d = flat.clone().applyAxisAngle(UP, spread);
                BO.FX.spawnParticles(P.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(d, 1 + Math.random() * range * 0.8), 1, 0xfb923c, 2, -1, 0.45, 1.3);
            }
            BO.Sound.playExplosion(0.45);
            let hits = 0;
            for (const z of M.enemiesInRadius(P.pos, range)) {
                _v.set(z.pos.x - P.pos.x, 0, z.pos.z - P.pos.z);
                const len = _v.length();
                if (len > 0.6 && _v.multiplyScalar(1 / len).dot(flat) < cone) continue;
                if (!BO.World.hasLineOfSight(P.pos.x, P.pos.y + 1.2, P.pos.z, z.pos.x, z.pos.y + 1.0, z.pos.z)) continue;
                hits++;
                const dealt = M.dealDamage(z, def.damage, { source: 'ability', element: 'burn' });
                M.detonate(z, dealt);
                if (!M.isAlive(z)) continue;
                if (this.has('cryo_thermal')) M.applyStatus(z, 'chill');
                if (this.has('arc_flash')) M.applyStatus(z, 'shock');
            }
            if (this.has('heat_sink') && hits) M.ability.cd.primer = Math.max(0, M.ability.cd.primer - hits);
            return true;
        },

        _firestorm(def) {
            const M = this.M;
            const P = this.P;
            const radius = this.has('supernova') ? 20 : def.radius;
            BO.FX.spawnExplosion(P.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), radius * 0.6, 0xf97316);
            BO.Sound.playExplosion(1.0);
            for (const z of M.enemiesInRadius(P.pos, radius)) M.applyPrimer(z, ['burn']);
            if (this.has('phoenix')) M.heal(P.maxHp * 0.4);
            const blast = () => {
                if (!M.active) return;
                BO.FX.spawnExplosion(P.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), radius * 0.8, 0xfbbf24);
                BO.Sound.playExplosion(1.0);
                P.cameraShake = Math.max(P.cameraShake, 0.08);
                for (const z of M.enemiesInRadius(P.pos, radius)) {
                    const dealt = M.dealDamage(z, def.damage, { source: 'ability', element: 'burn' });
                    M.detonate(z, dealt);
                }
            };
            M.timers.push({ t: def.delay, fn: blast });
            if (this.has('inferno_core')) {
                M.timers.push({ t: def.delay + 1.3, fn: () => { for (const z of M.enemiesInRadius(P.pos, radius)) M.applyStatus(z, 'burn'); blast(); } });
            }
        },

        /* ---------------- Tempest ---------------- */
        _cryo_lance(def) {
            const M = this.M;
            const { origin, dir } = this.aim();
            const dirs = this.has('twin_lance') ? [dir.clone().applyAxisAngle(UP, 0.06), dir.clone().applyAxisAngle(UP, -0.06)] : [dir];
            const ids = ['chill'];
            if (this.has('thermal_shock')) ids.push('burn');
            if (this.has('exposing_cold')) ids.push('expose');
            let first = true;
            for (const d of dirs) {
                const wall = BO.World.raycastWorld(origin, d, def.range);
                const maxT = wall ? wall.distance : def.range;
                const end = origin.clone().addScaledVector(d, maxT);
                BO.FX.spawnTracer(origin.clone().add(new THREE.Vector3(0, -0.15, 0)), end, 0x7dd3fc, 0.07, 0.22);
                const hits = [];
                for (const z of M.enemies) {
                    if (!M.isAlive(z)) continue;
                    const c = z.pos.clone().add(new THREE.Vector3(0, z.height * 0.55, 0));
                    const t = c.clone().sub(origin).dot(d);
                    if (t < 0 || t > maxT) continue;
                    const closest = origin.clone().addScaledVector(d, t);
                    if (closest.distanceTo(c) <= Math.max(0.9, z.radius + 0.55)) hits.push({ z, t });
                }
                hits.sort((a, b) => a.t - b.t);
                for (const h of hits) {
                    M.dealDamage(h.z, def.damage, { source: 'ability', element: 'chill', dir: d });
                    M.applyPrimer(h.z, ids);
                    if (first && this.has('glacial_lance') && M.isAlive(h.z)) h.z.frozenTimer = Math.max(h.z.frozenTimer, 1.5);
                    first = false;
                }
            }
            BO.Sound.playGunshot('sniper', false, true, 0.8);
            return true;
        },

        _arc_lash(def) {
            const M = this.M;
            const { origin, dir } = this.aim();
            let best = null;
            let bestScore = Infinity;
            for (const z of M.enemies) {
                if (!M.isAlive(z)) continue;
                const c = z.pos.clone().add(new THREE.Vector3(0, z.height * 0.55, 0));
                const to = c.clone().sub(origin);
                const dist = to.length();
                if (dist > def.range) continue;
                const ang = Math.acos(BO.Math.clamp(to.normalize().dot(dir), -1, 1));
                if (ang > 0.3) continue;
                if (!BO.World.hasLineOfSight(origin.x, origin.y, origin.z, c.x, c.y, c.z)) continue;
                const score = ang * 30 + dist * 0.05;
                if (score < bestScore) { bestScore = score; best = z; }
            }
            if (!best) {
                BO.Events.emit('hud:toast', { text: 'ARC LASH — NO TARGET UNDER YOUR CROSSHAIR', color: '#94a3b8' });
                return false;
            }
            const mult = this.has('capacitor') ? 1.4 : 1;
            const chainCount = this.has('forked_lightning') ? 5 : def.chains;
            const from = origin.clone().add(new THREE.Vector3(0, -0.2, 0));
            BO.FX.spawnTracer(from, best.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfde047, 0.06, 0.2);
            const dealt = M.dealDamage(best, def.damage * mult, { source: 'ability', element: 'shock' });
            M.detonate(best, dealt);
            if (M.isAlive(best)) M.applyStatus(best, 'shock');
            const visited = new Set([best]);
            let prev = best;
            for (let i = 0; i < chainCount; i++) {
                const next = M.nearestEnemies(prev.pos, 8, 1, visited)[0];
                if (!next) break;
                visited.add(next);
                BO.FX.spawnTracer(prev.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), next.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfde047, 0.045, 0.18);
                M.dealDamage(next, def.chainDamage * mult, { source: 'ability', element: 'shock' });
                if (M.isAlive(next)) {
                    M.applyStatus(next, 'shock');
                    if (this.has('ground_arc')) M.applyStatus(next, 'chill');
                }
                prev = next;
            }
            BO.Sound.playTrapZap();
            return true;
        },

        _stormCell(def) {
            const M = this.M;
            const { origin, dir } = this.aim();
            const hit = BO.World.raycastWorld(origin, dir, 40);
            const at = hit ? hit.point.clone() : origin.clone().addScaledVector(dir, 20);
            at.y = BO.World.getGroundHeight(at.x, at.z, at.y + 1);
            const ring = new THREE.Mesh(new THREE.RingGeometry(def.radius - 0.25, def.radius, 48), new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(at.x, at.y + 0.05, at.z);
            BO.World.scene.add(ring);
            M.props.push({ mesh: ring });
            M.ability.storm = { pos: at, t: this.has('perfect_storm') ? 16 : def.duration, tick: 0, def, ring };
            M.ability.ultActive = M.ability.storm.t;
            BO.Events.emit('hud:toast', { text: 'STORM CELL', color: '#fde047' });
        },

        _tickStorm(dt) {
            const M = this.M;
            const s = M.ability.storm;
            if (!s) return;
            s.t -= dt;
            if (this.has('eye_of_the_storm')) { s.pos.x = this.P.pos.x; s.pos.z = this.P.pos.z; s.pos.y = this.P.pos.y; }
            s.ring.position.set(s.pos.x, s.pos.y + 0.05, s.pos.z);
            s.ring.material.opacity = 0.3 + Math.sin(M.elapsed * 6) * 0.15;
            s.tick -= dt;
            if (s.tick <= 0) {
                s.tick = s.def.interval;
                const inside = M.enemiesInRadius(s.pos, s.def.radius);
                if (inside.length) {
                    const z = inside[Math.floor(Math.random() * inside.length)];
                    const top = z.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 12, (Math.random() - 0.5) * 2));
                    BO.FX.spawnTracer(top, z.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 0xfde047, 0.08, 0.14);
                    BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 0.3, 0)), 8, 0xfde047, 3, 4, 0.3, 1.0);
                    const dealt = M.dealDamage(z, s.def.damage, { source: 'ability', element: 'shock' });
                    if (this.has('tempest_lord')) M.detonate(z, dealt);
                    if (M.isAlive(z)) M.applyStatus(z, 'shock');
                    BO.Sound.playTrapZap();
                }
            }
            if (s.t <= 0) {
                BO.World.scene.remove(s.ring);
                M.ability.storm = null;
            }
        }
    };

    BO.RPGAbilities = RPGAbilities;
})(window);
