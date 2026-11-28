/* ============================================================================
   BLACKOUT OPS — Open World RPG · Combat (5-Element Pipeline, Passive Traits,
   Reactions, Abilities & Ultimates)
   No double hitmarker SFX: CombatSystem plays hitmarker on gun/melee;
   OWRPGCombat plays hitmarker only for ability/reaction hits.
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
        cd: { primer: 0, detonator: 0, gadget: 0, ultimate: 0 },
        primerCharges: 1,
        heal: null,
        decoy: null,
        barrierHp: 0,
        barrierT: 0,
        overdriveT: 0,
        hitCount: 0,

        reset() {
            this.cd = { primer: 0, detonator: 0, gadget: 0, ultimate: 0 };
            this.primerCharges = 0;
            this.heal = null;
            this.barrierHp = 0;
            this.barrierT = 0;
            this.overdriveT = 0;
            this.removeDecoy();
            this.hitCount = 0;
        },

        get s() { return BO.OWRPGMode.state; },
        diff() { return DIFF[this.s.difficulty] || DIFF.tactical; },

        /* ------------------------------------------------ incoming */
        modifyIncoming(amount, attackerPos, attackerEntity) {
            const s = this.s;
            if (!s) return amount;
            const d = BO.OWRPGCharacter.derived(s);
            let a = amount * this.diff().inc * (100 / (100 + d.armor));
            if (attackerEntity?.owAgent?.boss) a *= 1 - Math.min(0.8, d.fx.bossDR || 0);
            if (attackerEntity?.owAgent && BO.OWRPGChampions) a *= BO.OWRPGChampions.dealtMult(attackerEntity.owAgent);
            if (d.fx.crouchDR && BO.Player.crouching) a *= 1 - d.fx.crouchDR;
            if (BO.OWRPGMounts && BO.OWRPGMounts.mounted) a *= BO.OWRPGMounts.drMult();
            const attElem = attackerEntity && attackerEntity.owAgent && attackerEntity.owAgent.def && attackerEntity.owAgent.def.elem;
            if (attElem && d.elemRes && d.elemRes[attElem]) a *= (1 - d.elemRes[attElem]);

            // Kinetic Barrier absorption
            if (this.barrierHp > 0 && this.barrierT > 0) {
                const abs = Math.min(this.barrierHp, a);
                this.barrierHp -= abs;
                a -= abs;
                if (this.barrierHp <= 0) BO.OWRPGMode.toast('Kinetic Barrier depleted!', '#f97316');
            }

            // Degrade armor subtly on real hits
            if (a > 2 && BO.OWRPGDurability) {
                for (const slot of ['rig', 'helmet', 'boots']) {
                    const eq = BO.OWRPGInventory.equippedEntry(s, slot);
                    if (eq) BO.OWRPGDurability.degrade(s, eq, 0.22);
                }
            }
            if (attackerEntity?.owAgent?.champ) BO.OWRPGChampions.afterHitPlayer(attackerEntity.owAgent, a);
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
            const ctx = {
                source: melee ? 'melee' : 'gun',
                isHead, dist, entry, w,
                suppressed: !!(w && w.stats && w.stats.suppressed)
            };
            const killed = this.damage(agent, base, ctx);
            if (!killed && agent.alive) this._procs(agent, ctx);
            return killed;
        },

        damage(agent, base, ctx = {}) {
            const s = this.s;
            const d = BO.OWRPGCharacter.derived(s);
            const ws = ctx.entry ? BO.OWRPGInventory.weaponStats(ctx.entry) : { dmgMult: 1, pen: 0, critChance: 0, critAdd: 0, element: 'kinetic', elemDmg: 0, passiveTrait: null };
            const elem = ctx.element || (ctx.source === 'gun' || ctx.source === 'melee' ? (ws.element !== 'kinetic' ? ws.element : null) : null);
            const unaware = agent.state !== 'combat';

            let m = 1;
            if (ctx.source === 'gun' || ctx.source === 'melee') m *= 1 + (d.fx.allDmgMult || 0);
            if (agent.kind === 'beast') m *= 1 + (d.fx.beastDmg || 0);
            if (agent.kind === 'beast' || agent.boss) m *= 1 + (d.fx.monsterDmg || 0);
            if (agent.boss) m *= 1 + (d.fx.bossDmg || 0);
            if (agent.champ) m *= BO.OWRPGChampions.takenMult(agent);
            if (ctx.source === 'gun' && ctx.dist > 22) m *= 1 + (d.fx.rangeDmg22 || 0);
            if (ctx.source === 'ability' || ctx.source === 'reaction') m *= 1 + (d.fx.arcanaDmg || 0);
            if (ctx.source === 'gun') m *= ws.dmgMult;
            if (ctx.source === 'melee') m *= d.meleeMult * (ws.dmgMult || 1);
            if (this.overdriveT > 0) m *= 1.25;

            if (d.fx.heavyDmg && ctx.entry) {
                const cat = BO.WeaponsData.get(SD().ITEMS[ctx.entry.id].base).category;
                if (/Shotgun|LMG|Launcher/.test(cat)) m *= (1 + d.fx.heavyDmg);
            }

            let crit = false;
            if (ctx.isHead && (ctx.source === 'gun' || ctx.source === 'melee')) {
                m *= d.critMult + (ws.critAdd || 0) + (this.overdriveT > 0 ? 0.3 : 0);
                crit = true;
            } else if ((ctx.source === 'gun' || ctx.source === 'melee') && Math.random() < (ws.critChance || 0) + (d.fx.bonusCritChance || 0) + (this.overdriveT > 0 ? 0.25 : 0)) {
                m *= (1.45 + (ws.critAdd || 0) * 0.5);
                crit = true;
            }
            if (unaware && d.fx.deadeye && ctx.source === 'gun' && ctx.dist > d.fx.deadeye) {
                if (!crit) m *= d.critMult + (ws.critAdd || 0);
                crit = true;
                this.applyStatus(agent, 'chill');
            }
            let sneak = false;
            if (unaware && (ctx.source === 'melee' || ctx.suppressed)) { m *= d.stealthMult; sneak = true; }
            if (agent.st.expose) m *= SD().STATUSES.expose.mult;
            if (d.fx.execute && agent.ent.hp < agent.ent.maxHp * 0.35) m *= 1 + d.fx.execute;

            // Weapon Passive Traits (damage modifiers)
            const trait = (ctx.source === 'gun' || ctx.source === 'melee') ? ws.passiveTrait : null;
            if (trait === 'executioner' && agent.ent.hp < agent.ent.maxHp * 0.35) m *= 1.35;
            if (trait === 'venom_fang' && agent.st.venom) m *= 1.15;
            if (trait === 'frostbite' && agent.st.chill) m *= 1.20;
            if (trait === 'headhunter' && ctx.isHead) m *= 1.30;

            let pen = (ws.pen || 0) + ((ctx.source === 'gun' || ctx.source === 'melee') ? (d.fx.bonusPen || 0) : 0);
            if (trait === 'kinetic_slam' && crit) { pen += 18; agent.ent.stunTimer = Math.max(agent.ent.stunTimer || 0, 0.35); }
            if (d.fx.heavyPen && ctx.entry && /Shotgun|LMG/.test(BO.WeaponsData.get(SD().ITEMS[ctx.entry.id].base).category)) pen += d.fx.heavyPen;

            const shred = 1 - Math.min(0.45, (agent.shredStacks || 0) * 0.15);
            const armor = agent.armor * (agent.ruptureT > 0 ? 0.5 : 1) * shred;
            let rawDmg = base + ((ctx.source === 'gun' || ctx.source === 'melee') ? (ws.elemDmg || 0) : 0);
            let dmg = rawDmg * m * (100 / (100 + Math.max(0, armor - pen))) * this.diff().out;

            if (elem && agent.def.weak === elem) dmg *= 1.5;
            if (elem && agent.def.resist === elem) dmg *= 0.7;
            dmg = Math.max(1, dmg);

            const ent = agent.ent;
            const hpBefore = ent.hp;
            const killed = agent.kind === 'bot'
                ? ent.takeDamage(dmg, 'player')
                : ent.takeDamage(dmg, ctx.isHead ? 'head' : 'torso', crit, null, ctx.source === 'melee' ? 'melee' : 'bullet');
            if (agent.champ && ctx.source !== 'dot') BO.OWRPGChampions.afterDamaged(agent, Math.min(dmg, Math.max(0, hpBefore)));

            // Only play hitmarker here for ability/reaction (CombatSystem already plays it for gun/melee!)
            if (ctx.source === 'ability' || ctx.source === 'reaction') {
                BO.Sound.playHitmarker(crit, killed);
            }
            if (crit || killed) {
                BO.Juice?.shake?.(crit ? 0.095 : 0.05);
                if (ctx.source === 'melee' || crit) BO.Sound?.playGoreImpact?.(crit);
            }

            // Elemental impact particles
            if (elem && SD().STATUSES[elem] && ctx.source !== 'dot') {
                BO.FX.spawnParticles(ent.pos.clone().add(UP), 5, SD().STATUSES[elem].hex, 3.2, 4, 0.32, 0.9);
            }

            // Weapon passive on-hit / on-kill effects & durability wear
            if (ctx.source === 'gun' || ctx.source === 'melee') {
                if (ctx.entry && BO.OWRPGDurability) BO.OWRPGDurability.degrade(s, ctx.entry, ctx.source === 'melee' ? 0.3 : 0.16);
                if (trait === 'void_siphon' || this.overdriveT > 0) {
                    BO.OWRPGMode.heal(Math.max(1, Math.round(dmg * 0.04)) + (killed ? 6 : 0));
                }
                if (trait === 'armor_shredder') {
                    agent.shredStacks = Math.min(3, (agent.shredStacks || 0) + 1);
                }
                if (trait === 'bloodlust' && killed && (ctx.dist < 6 || ctx.source === 'melee')) {
                    BO.OWRPGMode.heal(12);
                }
                if (trait === 'headhunter' && killed && ctx.isHead) {
                    for (const k of ['primer', 'detonator', 'gadget']) this.cd[k] = Math.max(0, this.cd[k] * 0.75);
                }
                if (trait === 'scavenger' && killed) {
                    s.player.credits += 12;
                    const aw = BO.Player.activeWeapon;
                    if (aw && aw.stats.magSize > 1) aw.mag = Math.min(aw.stats.magSize, aw.mag + Math.max(1, Math.ceil(aw.stats.magSize * 0.1)));
                }
            }

            if (ctx.source !== 'dot') BO.OWRPGAI.onDamaged(agent, ctx);
            if (killed) BO.OWRPGAI.onKilled(agent, Object.assign({ sneak, crit }, ctx));
            BO.OWRPGUI && BO.OWRPGUI.floatDamage(agent, dmg, crit, elem || (sneak ? 'sneak' : null));
            return killed;
        },

        _procs(agent, ctx) {
            const s = this.s;
            const fx = BO.OWRPGCharacter.perkFx(s);
            const ws = ctx.entry ? BO.OWRPGInventory.weaponStats(ctx.entry) : {};
            const roll = (pct) => pct > 0 && Math.random() * 100 < pct;
            if (roll(ws.burnChance)) this.applyStatus(agent, 'burn');
            if (roll(ws.chillChance)) this.applyStatus(agent, 'chill');
            if (roll(ws.shockChance)) {
                this.applyStatus(agent, 'shock');
                if (ws.passiveTrait === 'overcharge') this.cd.ultimate = Math.max(0, (this.cd.ultimate || 0) - 3);
            }
            if (roll(ws.venomChance)) this.applyStatus(agent, 'venom');
            if (roll(ws.voidChance)) this.applyStatus(agent, 'void');

            this.hitCount++;
            if (ctx.source === 'gun') for (const [key, status] of [['nthBurn', 'burn'], ['nthChill', 'chill'], ['nthShock', 'shock'], ['nthVenom', 'venom'], ['nthVoid', 'void']]) {
                if (fx[key] && this.hitCount % fx[key] === 0) this.applyStatus(agent, status);
            }
            if (ws.passiveTrait === 'heat_sink' && this.hitCount % 4 === 0) {
                this.applyStatus(agent, 'burn');
                this.damage(agent, 18, { source: 'dot', element: 'burn' });
            }
            if (ws.passiveTrait === 'venom_fang' && Math.random() < 0.35) this.applyStatus(agent, 'venom');
            if (ws.passiveTrait === 'chain_arc' && Math.random() < 0.25) {
                const near = BO.OWRPGAI.agentsNear(agent.ent.pos, 7, true).find((o) => o !== agent);
                if (near) {
                    BO.FX.spawnTracer(agent.ent.pos.clone().add(UP), near.ent.pos.clone().add(UP), 0xfacc15, 0.04, 0.18);
                    this.applyStatus(near, 'shock');
                    this.damage(near, 18, { source: 'ability', element: 'shock' });
                }
            }
        },

        /* ------------------------------------------------ 5-element statuses */
        applyStatus(agent, id) {
            if (!agent.alive) return;
            const S = SD().STATUSES[id];
            if (!S) return;
            const d = BO.OWRPGCharacter.derived(this.s);
            const prev = agent.st[id];
            const stacks = id === 'venom' ? Math.min(S.maxStacks || 5, ((prev && prev.stacks) || 0) + 1) : 1;
            agent.st[id] = { t: S.dur * d.statusDur, tick: 1, stacks };
            if (id === 'shock') agent.ent.stunTimer = Math.max(agent.ent.stunTimer || 0, 0.45);
            if (id === 'venom') agent.healBlock = true;
            if (this.s.player.codex && this.s.player.codex.elements) {
                this.s.player.codex.elements[id] = (this.s.player.codex.elements[id] || 0) + 1;
            }
            BO.FX.spawnParticles(agent.ent.pos.clone().add(UP), 10, S.hex, 3, 2, 0.5, 1.1);
            BO.OWRPGAI.onDamaged(agent, { source: 'ability' });
        },

        tickStatuses(agent, dt) {
            const st = agent.st;
            if (agent.ruptureT > 0) agent.ruptureT -= dt;
            for (const id of Object.keys(st)) {
                const e = st[id];
                e.t -= dt;
                if ((id === 'burn' || id === 'venom') && e.t > 0) {
                    e.tick -= dt;
                    if (e.tick <= 0) {
                        e.tick = 1;
                        const pot = BO.OWRPGCharacter.derived(this.s).statusPotency;
                        const stacks = id === 'venom' ? (e.stacks || 1) : 1;
                        const dps = SD().STATUSES[id].dps * stacks;
                        this.damage(agent, dps * pot * (1 + agent.lvl * 0.15), { source: 'dot', element: id });
                        if (!agent.alive) return;
                    }
                }
                if (e.t <= 0) {
                    if (id === 'venom') agent.healBlock = false;
                    delete st[id];
                }
            }
            const chilled = !!st.chill;
            if (chilled !== !!agent._chilled) {
                agent._chilled = chilled;
                const k = chilled ? 1 - SD().STATUSES.chill.slow : 1 / (1 - SD().STATUSES.chill.slow);
                if (agent.kind === 'bot') agent.ent.speedScale *= k; else agent.ent.speed *= k;
            }
        },

        /** Consume every status on the target and fire 5-element reactions. */
        detonate(agent, detDmg) {
            if (!agent.alive) return 0;
            const s = this.s;
            const d = BO.OWRPGCharacter.derived(s);
            const fx = d.fx;
            const ids = Object.keys(agent.st);
            let fired = 0;
            for (const id of ids) {
                const R = SD().REACTIONS[id];
                const S = SD().STATUSES[id];
                const stObj = agent.st[id];
                const stacks = (stObj && stObj.stacks) || 1;
                delete agent.st[id];
                if (!R || !S) continue;
                fired++;
                const dmg = detDmg * R.mult * (1 + (fx.reactMult || 0)) * d.statusPotency * (id === 'venom' ? (1 + (stacks - 1) * 0.25) : 1);
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
                        o.ent.stunTimer = Math.max(o.ent.stunTimer || 0, 1.3);
                        this.damage(o, dmg * (o === agent ? 1 : 0.55), { source: 'reaction', element: 'shock' });
                    }
                } else if (id === 'venom') {
                    agent.healBlock = false;
                    for (const o of BO.OWRPGAI.agentsNear(agent.ent.pos, R.radius, true)) {
                        this.damage(o, dmg * (o === agent ? 1 : 0.65), { source: 'reaction', element: 'venom' });
                        if (o !== agent && o.alive) this.applyStatus(o, 'venom');
                    }
                } else if (id === 'void') {
                    const near = BO.OWRPGAI.agentsNear(agent.ent.pos, R.radius, true);
                    for (const o of near) {
                        if (o !== agent) {
                            const pull = agent.ent.pos.clone().sub(o.ent.pos).multiplyScalar(0.55);
                            o.ent.pos.add(pull);
                        }
                        this.damage(o, dmg * (o === agent ? 1 : 0.6), { source: 'reaction', element: 'void' });
                    }
                    BO.OWRPGMode.heal(Math.max(8, Math.round(dmg * 0.14)));
                } else if (id === 'expose') {
                    agent.ruptureT = 10;
                    this.damage(agent, dmg, { source: 'reaction', element: 'expose' });
                }

                if (fx.chain) {
                    for (const o of BO.OWRPGAI.agentsNear(agent.ent.pos, 8, true).filter((o) => o !== agent).slice(0, fx.chain)) this.applyStatus(o, id);
                }
                if (fx.refund) this.cd.primer = Math.max(0, this.cd.primer * (1 - fx.refund));
                s.stats.reactions++;
            BO.OWRPGCharacter.addSkillXp(s, 'arcana', 18);
                if (!agent.alive) break;
            }
            if (!fired) this.damage(agent, detDmg, { source: 'ability' });
            return fired;
        },

        /* ------------------------------------------------ abilities & ultimates */
        aim(maxDist) {
            const cam = BO.OWRPGMode.camera;
            _ray.setFromCamera(_center, cam);
            _ray.far = maxDist;
            const hits = BO.Combat._castTargets(_ray);
            const hit = hits.find((h) => h.object.userData.entity && h.object.userData.entity.owAgent && h.object.userData.entity.alive);
            const wh = BO.World.raycastWorld(_ray.ray.origin, _ray.ray.direction, maxDist);
            if (hit && (!wh || hit.distance < wh.distance)) return { agent: hit.object.userData.entity.owAgent, point: hit.point.clone(), dist: hit.distance };
            const point = wh ? wh.point.clone() : _ray.ray.origin.clone().addScaledVector(_ray.ray.direction, maxDist);
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
            const A = SD().ABILITIES[slot] && SD().ABILITIES[slot][id];
            if (!A) { BO.Events.emit('hud:toast', { text: `No ${slot} power equipped`, color: '#94a3b8' }); return; }
            if (BO.OWRPGCharacter.powerUnlocked && !BO.OWRPGCharacter.powerUnlocked(s, id)) {
                BO.Events.emit('hud:toast', { text: `${A.name} is locked`, color: '#f97316' });
                return;
            }
            const extraUse = slot === 'primer' && this.cd.primer > 0 && this.primerCharges > 0;
            if ((this.cd[slot] || 0) > 0 && !extraUse) {
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
                    for (const a of hits) { this.applyStatus(a, 'expose'); a.ent.stunTimer = Math.max(a.ent.stunTimer || 0, 1); this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: 'expose' }); }
                    BO.Sound.playMelee();
                } else {
                    const t = this.aim(A.range);
                    const stDef = SD().STATUSES[A.status];
                    BO.FX.spawnTracer(eye, t.point, stDef.hex, 0.05, 0.25);
                    if (A.radius) {
                        BO.FX.spawnExplosion(t.point, A.radius, stDef.hex);
                        for (const a of BO.OWRPGAI.agentsNear(t.point, A.radius, false)) {
                            this.applyStatus(a, A.status);
                            if (id === 'venom_spit_dart') this.applyStatus(a, 'venom');
                            this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: A.status });
                        }
                    } else if (t.agent) {
                        this.applyStatus(t.agent, A.status);
                        if (id === 'venom_spit_dart') this.applyStatus(t.agent, 'venom');
                        this.damage(t.agent, A.dmg * d.statusPotency, { source: 'ability', element: A.status });
                    } else ok = false;
                }
                if (extraUse) this.primerCharges--;
            } else if (slot === 'detonator') {
                const radius = (A.radius || 0) * (1 + (d.fx.detRadius || 0));
                if (id === 'concussion' || id === 'seismic_slam') {
                    BO.FX.spawnExplosion(P.pos.clone().add(UP), radius, id === 'seismic_slam' ? 0xf59e0b : 0xe2e8f0);
                    for (const a of BO.OWRPGAI.agentsNear(P.pos, radius, false)) this.detonate(a, A.dmg);
                } else if (id === 'void_implosion' || id === 'venom_rupture') {
                    const t = this.aim(A.range);
                    const col = id === 'void_implosion' ? 0xc084fc : 0x84cc16;
                    BO.FX.spawnTracer(eye, t.point, col, 0.07, 0.2);
                    BO.FX.spawnExplosion(t.point, radius, col);
                    const near = BO.OWRPGAI.agentsNear(t.point, radius, false);
                    if (near.length) {
                        for (const a of near) this.detonate(a, A.dmg);
                    } else ok = false;
                } else {
                    const t = this.aim(A.range);
                    BO.FX.spawnTracer(eye, t.point, 0xfacc15, 0.06, 0.18);
                    if (t.agent) this.detonate(t.agent, A.dmg); else ok = false;
                }
                if (d.fx.detHeal) M.heal(d.fx.detHeal);
            } else if (slot === 'gadget') {
                if (id === 'med_injector' || id === 'nanite_field') {
                    if (P.hp >= P.maxHp && id === 'med_injector') { BO.Events.emit('hud:toast', { text: 'Already at full health', color: '#94a3b8' }); return; }
                    const total = A.heal * (1 + (d.fx.medMult || 0));
                    this.heal = { left: total, rate: total / (id === 'nanite_field' ? 3 : 2) };
                    if (id === 'nanite_field') P.tacStamina = 1.0;
                } else if (id === 'decoy_holo') {
                    this.spawnDecoy(this.aim(25).point, A.dur);
                } else if (id === 'kinetic_barrier') {
                    this.barrierHp = A.shield || 55;
                    this.barrierT = A.dur || 10;
                    BO.FX.spawnParticles(P.pos.clone().add(UP), 14, 0x38bdf8, 3, 2, 0.5, 1.2);
                    M.toast(`Kinetic Barrier +${this.barrierHp}`, '#38bdf8');
                } else if (id === 'emp_pulse') {
                    BO.FX.spawnExplosion(P.pos.clone().add(UP), A.radius, 0xfacc15);
                    for (const a of BO.OWRPGAI.agentsNear(P.pos, A.radius, false)) {
                        a.ent.stunTimer = Math.max(a.ent.stunTimer || 0, 2.2);
                        this.applyStatus(a, 'shock');
                        this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: 'shock' });
                    }
                }
            } else if (slot === 'ultimate') {
                if (id === 'overdrive_protocol') {
                    this.overdriveT = A.dur || 10;
                    const aw = P.activeWeapon;
                    if (aw) aw.mag = aw.stats.magSize;
                    BO.FX.spawnParticles(P.pos.clone().add(UP), 24, 0xf59e0b, 5, 2, 0.6, 1.3);
                    BO.Events.emit('hud:banner', { title: 'OVERDRIVE PROTOCOL', sub: '10s surge: +25% dmg, +30% crit, lifesteal & speed', color: '#f5a623' });
                } else {
                    const t = this.aim(A.range || 40);
                    const pt = t.point;
                    const col = (SD().STATUSES[A.element] && SD().STATUSES[A.element].hex) || 0xf97316;
                    BO.FX.spawnTracer(pt.clone().add(new THREE.Vector3(0, 26, 0)), pt, col, 0.35, 0.4);
                    BO.FX.spawnExplosion(pt, A.radius || 8, col);
                    for (const a of BO.OWRPGAI.agentsNear(pt, A.radius || 8, false)) {
                        if (id === 'singularity_nova') {
                            a.ent.pos.lerp(pt, 0.55);
                            this.applyStatus(a, 'void');
                            this.detonate(a, A.dmg * 0.7);
                        } else if (id === 'plague_tempest') {
                            this.applyStatus(a, 'venom');
                            this.applyStatus(a, 'chill');
                            this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: 'venom' });
                        } else {
                            this.applyStatus(a, 'burn');
                            this.applyStatus(a, 'shock');
                            this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: 'burn' });
                        }
                    }
                    BO.Events.emit('hud:banner', { title: A.name.toUpperCase(), sub: 'Ultimate unleashed', color: SD().STATUSES[A.element]?.color || '#f5a623' });
                }
                BO.Sound.playExplosion?.(0.75);
            }

            if (!ok) { BO.Events.emit('hud:toast', { text: 'No target', color: '#94a3b8' }); this.cd[slot] = 1; return; }
            if (!extraUse) this.cd[slot] = A.cd * d.cdMult;
            BO.OWRPGAI.noise(P.pos, slot === 'gadget' ? 6 : 22);
        },

        _extraPrimer() { return BO.OWRPGCharacter.perkFx(this.s).primerCharges > 0; },

        spawnDecoy(point, dur) {
            this.removeDecoy();
            const parts = BO.CharacterMesh.buildSoldier(0, {});
            parts.root.position.copy(point);
            const mat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.45 });
            parts.root.traverse((o) => { if (o.isMesh) { o.material = mat; o.userData = {}; } });
            BO.World.scene.add(parts.root);
            this.decoy = { mesh: parts.root, parts, mat, pos: point.clone(), t: dur, phase: 0 };
            BO.OWRPGAI.noise(point, 30, true);
        },

        removeDecoy() {
            if (this.decoy && this.decoy.mesh) this.decoy.mesh.removeFromParent();
            if (this.decoy && this.decoy.mat) this.decoy.mat.dispose();
            this.decoy = null;
        },

        update(dt) {
            for (const k of Object.keys(this.cd)) if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - dt);
            const extra = this._extraPrimer() ? 1 : 0;
            if (this.cd.primer <= 0) this.primerCharges = extra;
            if (this.barrierT > 0) { this.barrierT -= dt; if (this.barrierT <= 0) this.barrierHp = 0; }
            if (this.overdriveT > 0) this.overdriveT = Math.max(0, this.overdriveT - dt);
            if (this.heal) {
                const P = BO.Player;
                const amt = Math.min(this.heal.left, this.heal.rate * dt);
                P.hp = Math.min(P.maxHp, P.hp + amt);
                this.heal.left -= amt;
                if (this.heal.left <= 0 || P.hp >= P.maxHp) this.heal = null;
            }
            if (this.decoy) {
                this.decoy.t -= dt;
                this.decoy.phase += dt;
                this.decoy.mesh.rotation.y += dt * 1.5;
                BO.CharacterMesh.animateSoldier(this.decoy.parts, { speed: 0, phase: this.decoy.phase, aim: 0.85 }, dt);
                if (this.decoy.t <= 0) this.removeDecoy();
            }
        }
    };

    BO.OWRPGCombat = Combat;
})(window.BO);
