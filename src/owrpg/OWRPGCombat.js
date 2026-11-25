/* ============================================================================
   BLACKOUT OPS — Open World RPG · Combat (damage pipeline, statuses, abilities)
   Dmg = (Base · M_stat · M_crit · M_stealth · M_expose)
         · 100 / (100 + max(0, Armor − Pen)) · (1 − R_elem)
   Primers apply Burn/Chill/Shock/Expose; Detonators consume every status on a
   target and trigger its reaction (Combust/Shatter/Overload/Rupture).
============================================================================ */
(function (BO) {
    'use strict';

    const SD = () => BO.OWRPGStatsData;
    const UP = new THREE.Vector3(0, 1.2, 0);
    const _ray = new THREE.Raycaster();
    const _v = new THREE.Vector3();
    const _center = new THREE.Vector2(0, 0);
    const DIFF = { story: { out: 1.3, inc: 0.6 }, tactical: { out: 1, inc: 1 }, blackout: { out: 0.85, inc: 1.35 } };

    const Combat = {
        cd: { primer: 0, detonator: 0, gadget: 0 },
        primerCharges: 1,
        heal: null,     // { left, rate }
        decoy: null,    // { mesh, pos, t }
        hitCount: 0,

        reset() {
            this.cd = { primer: 0, detonator: 0, gadget: 0 };
            this.primerCharges = 0;
            this.heal = null;
            this.removeDecoy();
            this.hitCount = 0;
        },

        get s() { return BO.OWRPGMode.state; },
        diff() { return DIFF[this.s.difficulty] || DIFF.tactical; },

        /* ------------------------------------------------ incoming */
        modifyIncoming(amount) {
            const s = this.s;
            if (!s) return amount;
            const d = BO.OWRPGCharacter.derived(s);
            let a = amount * this.diff().inc * (100 / (100 + d.armor));
            if (d.fx.crouchDR && BO.Player.crouching) a *= 1 - d.fx.crouchDR;
            BO.OWRPGMode.onPlayerHurt();
            return a;
        },

        /* ------------------------------------------------ outgoing */
        /** CombatSystem.onHitEnemy hook. Returns true on kill. */
        onGunHit(ent, dmg, hitbox, dist, w) {
            const agent = ent && ent.owAgent;
            if (!agent || !agent.alive) return false;
            const melee = !!(w && w.stats && w.stats.kind === 'melee');
            const isHead = hitbox === 'head';
            const base = isHead && w && w.stats.headMult ? dmg / w.stats.headMult : dmg;
            const entry = BO.OWRPGMode.activeWeaponEntry();
            const ctx = { source: melee ? 'melee' : 'gun', isHead, dist, entry, suppressed: !!(w && w.stats && w.stats.suppressed) };
            const killed = this.damage(agent, base, ctx);
            if (!killed && agent.alive) this._procs(agent, ctx);
            return killed;
        },

        damage(agent, base, ctx = {}) {
            const s = this.s;
            const d = BO.OWRPGCharacter.derived(s);
            const ws = ctx.entry ? BO.OWRPGInventory.weaponStats(ctx.entry) : { dmgMult: 1, pen: 0, critAdd: 0 };
            const unaware = agent.state !== 'combat';
            let m = 1;
            if (ctx.source === 'gun') m *= ws.dmgMult;
            if (ctx.source === 'melee') m *= d.meleeMult * 1.0;
            let crit = false;
            if (ctx.isHead && (ctx.source === 'gun' || ctx.source === 'melee')) { m *= d.critMult + ws.critAdd; crit = true; }
            if (unaware && d.fx.deadeye && ctx.source === 'gun' && ctx.dist > d.fx.deadeye) {
                if (!crit) m *= d.critMult + ws.critAdd;
                crit = true;
                this.applyStatus(agent, 'chill');
            }
            let sneak = false;
            if (unaware && (ctx.source === 'melee' || ctx.suppressed)) { m *= d.stealthMult; sneak = true; }
            if (agent.st.expose) m *= SD().STATUSES.expose.mult;
            if (d.fx.execute && agent.ent.hp < agent.ent.maxHp * 0.25) m *= 1 + d.fx.execute;
            let pen = ws.pen || 0;
            if (d.fx.heavyPen && ctx.entry && /Shotgun|LMG/.test(BO.WeaponsData.get(SD().ITEMS[ctx.entry.id].base).category)) pen += d.fx.heavyPen;
            const armor = agent.armor * (agent.ruptureT > 0 ? 0.5 : 1);
            let dmg = base * m * (100 / (100 + Math.max(0, armor - pen))) * this.diff().out;
            if (ctx.element && agent.def.weak === ctx.element) dmg *= 1.5;
            dmg = Math.max(1, dmg);
            const ent = agent.ent;
            const killed = agent.kind === 'bot' ? ent.takeDamage(dmg, 'player') : ent.takeDamage(dmg, ctx.isHead ? 'head' : 'torso', crit, null, ctx.source === 'melee' ? 'melee' : 'bullet');
            if (ctx.source === 'gun' || ctx.source === 'melee') BO.Sound.playHitmarker(crit, killed);
            if (ctx.source !== 'dot') BO.OWRPGAI.onDamaged(agent, ctx);
            if (killed) BO.OWRPGAI.onKilled(agent, Object.assign({ sneak, crit }, ctx));
            BO.OWRPGUI && BO.OWRPGUI.floatDamage(agent, dmg, crit, ctx.element || (sneak ? 'sneak' : null));
            return killed;
        },

        _procs(agent, ctx) {
            const s = this.s;
            const fx = BO.OWRPGCharacter.perkFx(s);
            const ws = ctx.entry ? BO.OWRPGInventory.weaponStats(ctx.entry) : {};
            const roll = (pct) => pct > 0 && Math.random() * 100 < pct;
            if (roll(ws.burnChance)) this.applyStatus(agent, 'burn');
            if (roll(ws.chillChance)) this.applyStatus(agent, 'chill');
            if (roll(ws.shockChance)) this.applyStatus(agent, 'shock');
            this.hitCount++;
            if (fx.nthBurn && this.hitCount % fx.nthBurn === 0) this.applyStatus(agent, 'burn');
        },

        /* ------------------------------------------------ statuses */
        applyStatus(agent, id) {
            if (!agent.alive) return;
            const S = SD().STATUSES[id];
            const d = BO.OWRPGCharacter.derived(this.s);
            agent.st[id] = { t: S.dur * d.statusDur, tick: 1 };
            if (id === 'shock') agent.ent.stunTimer = Math.max(agent.ent.stunTimer || 0, 0.35);
            BO.FX.spawnParticles(agent.ent.pos.clone().add(UP), 10, S.hex, 3, 2, 0.5, 1.1);
            BO.OWRPGAI.onDamaged(agent, { source: 'ability' });
        },

        tickStatuses(agent, dt) {
            const st = agent.st;
            if (agent.ruptureT > 0) agent.ruptureT -= dt;
            for (const id of Object.keys(st)) {
                const e = st[id];
                e.t -= dt;
                if (id === 'burn' && e.t > 0) {
                    e.tick -= dt;
                    if (e.tick <= 0) {
                        e.tick = 1;
                        const pot = BO.OWRPGCharacter.derived(this.s).statusPotency;
                        this.damage(agent, SD().STATUSES.burn.dps * pot * (1 + agent.lvl * 0.15), { source: 'dot', element: 'burn' });
                        if (!agent.alive) return;
                    }
                }
                if (e.t <= 0) delete st[id];
            }
            // Chill slows (bots via speedScale, beasts via speed).
            const chilled = !!st.chill;
            if (chilled !== !!agent._chilled) {
                agent._chilled = chilled;
                const k = chilled ? 1 - SD().STATUSES.chill.slow : 1 / (1 - SD().STATUSES.chill.slow);
                if (agent.kind === 'bot') agent.ent.speedScale *= k; else agent.ent.speed *= k;
            }
        },

        /** Consume every status on the target and fire reactions. */
        detonate(agent, detDmg) {
            if (!agent.alive) return 0;
            const s = this.s;
            const fx = BO.OWRPGCharacter.perkFx(s);
            const ids = Object.keys(agent.st);
            let fired = 0;
            for (const id of ids) {
                const R = SD().REACTIONS[id];
                const S = SD().STATUSES[id];
                delete agent.st[id];
                fired++;
                const dmg = detDmg * R.mult * (1 + (fx.reactMult || 0)) * BO.OWRPGCharacter.derived(s).statusPotency;
                const p = agent.ent.pos.clone().add(UP);
                BO.FX.spawnExplosion(p, Math.max(2.5, R.radius || 2.5), S.hex);
                BO.Events.emit('hud:toast', { text: R.name + '!', color: S.color });
                if (id === 'burn') {
                    for (const o of BO.OWRPGAI.agentsNear(agent.ent.pos, R.radius, true)) this.damage(o, dmg * (o === agent ? 1 : 0.6), { source: 'reaction', element: 'burn' });
                } else if (id === 'chill') {
                    this.damage(agent, dmg, { source: 'reaction', element: 'chill' });
                } else if (id === 'shock') {
                    const near = BO.OWRPGAI.agentsNear(agent.ent.pos, R.radius, true).slice(0, 4 + (fx.shockArc || 0));
                    for (const o of near) {
                        BO.FX.spawnTracer(p, o.ent.pos.clone().add(UP), S.hex, 0.04, 0.2);
                        o.ent.stunTimer = Math.max(o.ent.stunTimer || 0, 1.2);
                        this.damage(o, dmg * (o === agent ? 1 : 0.5), { source: 'reaction', element: 'shock' });
                    }
                } else if (id === 'expose') {
                    agent.ruptureT = 10;
                    this.damage(agent, dmg, { source: 'reaction', element: 'expose' });
                }
                if (fx.chain) {
                    for (const o of BO.OWRPGAI.agentsNear(agent.ent.pos, 8, true).filter((o) => o !== agent).slice(0, fx.chain)) this.applyStatus(o, id);
                }
                if (fx.refund) this.cd.primer = Math.max(0, this.cd.primer * (1 - fx.refund));
                s.stats.reactions++;
                if (!agent.alive) break;
            }
            if (!fired) this.damage(agent, detDmg, { source: 'ability' });
            return fired;
        },

        /* ------------------------------------------------ abilities */
        /** What the crosshair points at: { agent, point, dist }. */
        aim(maxDist) {
            const cam = BO.OWRPGMode.camera;
            _ray.setFromCamera(_center, cam);
            _ray.far = maxDist;
            const hits = _ray.intersectObjects(BO.Combat.targetPool || [], false);
            const hit = hits.find((h) => h.object.userData.entity && h.object.userData.entity.owAgent && h.object.userData.entity.alive);
            const wh = BO.World.raycastWorld(_ray.ray.origin, _ray.ray.direction, maxDist);
            if (hit && (!wh || hit.distance < wh.distance)) return { agent: hit.object.userData.entity.owAgent, point: hit.point.clone(), dist: hit.distance };
            const point = wh ? wh.point.clone() : _ray.ray.origin.clone().addScaledVector(_ray.ray.direction, maxDist);
            // Soft-aim: nearest hostile within a small cone.
            let best = null, bd = 0.97;
            const fwd = _ray.ray.direction;
            for (const a of BO.OWRPGAI.agents) {
                if (!a.alive || !a.ent.parts.root.visible) continue;
                _v.copy(a.ent.pos).add(UP).sub(_ray.ray.origin);
                const dist = _v.length();
                if (dist > maxDist) continue;
                const dot = _v.normalize().dot(fwd);
                if (dot > bd) { bd = dot; best = { agent: a, point: a.ent.pos.clone().add(UP), dist }; }
            }
            return best || { agent: null, point, dist: wh ? wh.distance : maxDist };
        },

        cast(slot) {
            const M = BO.OWRPGMode;
            const s = this.s;
            const id = s.player.abilities[slot];
            const A = SD().ABILITIES[slot][id];
            if (!A) return;
            const extraUse = slot === 'primer' && this.cd.primer > 0 && this.primerCharges > 0;
            if (this.cd[slot] > 0 && !extraUse) {
                BO.Events.emit('hud:toast', { text: `${A.name} recharging (${Math.ceil(this.cd[slot])} s)`, color: '#94a3b8' });
                return;
            }
            const d = BO.OWRPGCharacter.derived(s);
            const P = BO.Player;
            const eye = P.pos.clone().add(new THREE.Vector3(0, 1.55, 0));
            let ok = true;
            if (slot === 'primer') {
                if (id === 'breach_bash') {
                    const f = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
                    P.vel.x += f.x * 14; P.vel.z += f.z * 14;
                    const hits = BO.OWRPGAI.agentsNear(P.pos.clone().addScaledVector(f, 2.2), 3.2, false);
                    for (const a of hits) { this.applyStatus(a, 'expose'); a.ent.stunTimer = Math.max(a.ent.stunTimer || 0, 1); this.damage(a, A.dmg * d.statusPotency, { source: 'ability' }); }
                    BO.Sound.playMelee();
                } else {
                    const t = this.aim(A.range);
                    BO.FX.spawnTracer(eye, t.point, SD().STATUSES[A.status].hex, 0.05, 0.25);
                    if (A.radius) {
                        BO.FX.spawnExplosion(t.point, A.radius, SD().STATUSES[A.status].hex);
                        for (const a of BO.OWRPGAI.agentsNear(t.point, A.radius, false)) { this.applyStatus(a, A.status); this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: A.status }); }
                    } else if (t.agent) {
                        this.applyStatus(t.agent, A.status);
                        this.damage(t.agent, A.dmg * d.statusPotency, { source: 'ability', element: A.status });
                    } else ok = false;
                }
                if (extraUse) this.primerCharges--;
            } else if (slot === 'detonator') {
                const radius = (A.radius || 0) * (1 + (d.fx.detRadius || 0));
                if (id === 'concussion') {
                    BO.FX.spawnExplosion(P.pos.clone().add(UP), radius, 0xe2e8f0);
                    for (const a of BO.OWRPGAI.agentsNear(P.pos, radius, false)) this.detonate(a, A.dmg);
                } else {
                    const t = this.aim(A.range);
                    BO.FX.spawnTracer(eye, t.point, 0xfacc15, 0.06, 0.18);
                    if (t.agent) this.detonate(t.agent, A.dmg); else ok = false;
                }
                if (d.fx.detHeal) M.heal(d.fx.detHeal);
            } else if (slot === 'gadget') {
                if (id === 'med_injector') {
                    if (P.hp >= P.maxHp) { BO.Events.emit('hud:toast', { text: 'Already at full health', color: '#94a3b8' }); return; }
                    this.heal = { left: A.heal * (1 + (d.fx.medMult || 0)), rate: A.heal * (1 + (d.fx.medMult || 0)) / 2 };
                } else if (id === 'decoy_holo') {
                    this.spawnDecoy(this.aim(25).point, A.dur);
                }
            }
            if (!ok) { BO.Events.emit('hud:toast', { text: 'No target', color: '#94a3b8' }); this.cd[slot] = 1; return; }
            if (!extraUse) this.cd[slot] = A.cd * d.cdMult;
            BO.OWRPGAI.noise(P.pos, slot === 'gadget' ? 6 : 18);
        },

        _extraPrimer() { return BO.OWRPGCharacter.perkFx(this.s).primerCharges > 0; },

        spawnDecoy(point, dur) {
            this.removeDecoy();
            const parts = BO.CharacterMesh.buildSoldier(0, {});
            parts.root.position.copy(point);
            parts.root.traverse((o) => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.45 }); o.userData = {}; } });
            BO.World.scene.add(parts.root);
            this.decoy = { mesh: parts.root, pos: point.clone(), t: dur };
            BO.OWRPGAI.noise(point, 30, true);
        },

        removeDecoy() {
            if (this.decoy && this.decoy.mesh) this.decoy.mesh.removeFromParent();
            this.decoy = null;
        },

        update(dt) {
            for (const k of Object.keys(this.cd)) if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - dt);
            const extra = this._extraPrimer() ? 1 : 0;
            if (this.cd.primer <= 0) this.primerCharges = extra;
            if (this.heal) {
                const P = BO.Player;
                const amt = Math.min(this.heal.left, this.heal.rate * dt);
                P.hp = Math.min(P.maxHp, P.hp + amt);
                this.heal.left -= amt;
                if (this.heal.left <= 0 || P.hp >= P.maxHp) this.heal = null;
            }
            if (this.decoy) {
                this.decoy.t -= dt;
                this.decoy.mesh.rotation.y += dt * 1.5;
                if (this.decoy.t <= 0) this.removeDecoy();
            }
        }
    };

    BO.OWRPGCombat = Combat;
})(window.BO);
