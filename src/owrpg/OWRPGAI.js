/* ============================================================================
   BLACKOUT OPS — Open World RPG · Agents, Stealth, Faction Uniforms & 3D Bars
   - 4-faction + raider uniform color tinting on BotAI soldiers
   - Floating 3D world-space enemy health / level / 5-element status bars
   - Codex kill tracking & repeatable Bounty progress hooks
============================================================================ */
(function (BO) {
    'use strict';

    const SD = () => BO.OWRPGStatsData;
    const UP = new THREE.Vector3(0, 1.2, 0);
    const SIDE = { militia: 0, aegis: 0, raiders: 1, syndicate: 1, helix: 1, brood: 2 };
    const CONE_COS = Math.cos((110 / 2) * Math.PI / 180);
    const AGENT_DETAIL_DIST = 28;   // metres: beyond this agents render as a merged proxy (MeshProxy)

    // Distinct uniform tint palettes per faction (applied to BotAI meshes)
    const FACTION_PALETTE = {
        militia: { tint: 0xd99b43, accent: 0xf5a623 },
        syndicate: { tint: 0xb9423a, accent: 0xef4444 },
        aegis: { tint: 0x4b87b8, accent: 0x38bdf8 },
        helix: { tint: 0x8f5cb8, accent: 0xc084fc },
        raiders: { tint: 0x7c5840, accent: 0xf97316 }
    };

    const ELEM_ICON = { burn: '🔥', chill: '❄', shock: '⚡', venom: '☠', void: '✦', expose: '◈' };

    function styleFactionBot(ent, faction, isBoss) {
        const pal = FACTION_PALETTE[faction];
        if (!pal || !ent || !ent.parts || !ent.parts.root) return;
        const cloned = new Map();
        ent.parts.root.traverse((o) => {
            if (!o.isMesh || !o.material) return;
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            const next = mats.map((m) => {
                if (cloned.has(m)) return cloned.get(m);
                const c = m.clone();
                if (c.isMeshStandardMaterial && c.color) {
                    c.color.lerp(new THREE.Color(pal.tint), 0.35);
                } else if (c.isMeshBasicMaterial && c.color) {
                    c.color.setHex(pal.accent);
                }
                cloned.set(m, c);
                return c;
            });
            o.material = Array.isArray(o.material) ? next : next[0];
        });
        if (isBoss) ent.parts.root.scale.setScalar(1.28);
    }

    function makeBarSprite() {
        const cv = document.createElement('canvas');
        cv.width = 256;
        cv.height = 56;
        const tex = new THREE.CanvasTexture(cv);
        const mat = new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true });
        const sp = new THREE.Sprite(mat);
        sp.scale.set(1.9, 0.42, 1);
        sp.visible = false;
        return { sprite: sp, canvas: cv, ctx: cv.getContext('2d'), tex, lastKey: '' };
    }

    function updateBarSprite(a) {
        const b = a.bar;
        if (!b) return;
        const stKeys = Object.keys(a.st);
        const hpInt = Math.ceil(a.ent.hp);
        const key = `${hpInt}|${a.state}|${a.hostile ? 1 : 0}|${stKeys.map((k) => k + (a.st[k].stacks || 1)).join(',')}`;
        if (b.lastKey === key) return;
        b.lastKey = key;

        const g = b.ctx;
        g.clearRect(0, 0, 256, 56);
        const pct = Math.max(0, Math.min(1, a.ent.hp / Math.max(1, a.ent.maxHp)));
        const facCol = (BO.OWRPGFactionsData.FACTIONS[a.faction]?.color) || (a.hostile ? '#ef4444' : '#4ade80');

        g.font = 'bold 18px "Segoe UI", sans-serif';
        g.textAlign = 'center';
        g.fillStyle = 'rgba(0,0,0,0.75)';
        g.fillText(`LV ${a.lvl} ${a.name.slice(0, 18)}`, 129, 20);
        g.fillStyle = a.boss ? '#fde047' : '#f8fafc';
        g.fillText(`LV ${a.lvl} ${a.name.slice(0, 18)}`, 128, 19);

        // HP Bar
        g.fillStyle = 'rgba(10,12,14,0.85)';
        g.fillRect(28, 25, 200, 12);
        g.fillStyle = a.hostile ? (a.boss ? '#f59e0b' : '#ef4444') : facCol;
        g.fillRect(30, 27, Math.round(196 * pct), 8);
        g.strokeStyle = 'rgba(255,255,255,0.28)';
        g.lineWidth = 1;
        g.strokeRect(28, 25, 200, 12);

        // Status icons
        if (stKeys.length) {
            g.font = 'bold 16px "Segoe UI", sans-serif';
            const badges = stKeys.map((k) => (ELEM_ICON[k] || '*') + (k === 'venom' && a.st[k].stacks > 1 ? a.st[k].stacks : '')).join(' ');
            g.fillStyle = '#fde68a';
            g.fillText(badges, 128, 52);
        }
        b.tex.needsUpdate = true;
    }

    const AI = {
        agents: [],
        projectiles: [],
        nextId: 1,
        warnT: {},

        get s() { return BO.OWRPGMode.state; },

        clear() {
            for (const a of this.agents.slice()) this.despawn(a);
            for (const p of this.projectiles) p.mesh.removeFromParent();
            this.agents = [];
            this.projectiles = [];
            this.warnT = {};
        },

        spawn(defId, x, z, opts = {}) {
            const def = SD().ENEMIES[defId];
            if (!def) return null;
            const y = opts.y != null ? opts.y : BO.World.getGroundHeight(x, z, BO.World.terrainHeight(x, z) + 1.5);
            const id = this.nextId++;
            let ent;
            if (def.kind === 'bot') {
                const diff = def.lvl >= 12 ? 'veteran' : def.lvl >= 7 ? 'hardened' : def.lvl >= 4 ? 'regular' : 'recruit';
                ent = new BO.BotAI({ id: 10000 + id, name: def.name, team: SIDE[def.faction] ?? 1, x, y, z, weaponId: def.weapon, maxHp: def.hp, difficulty: diff, speedScale: 0.85, respawnDelay: 1e9 });
                ent.post = { x, y, z, r: opts.postR || 6 };
                ent.yaw = Math.random() * Math.PI * 2;
                styleFactionBot(ent, def.faction, !!def.boss);
            } else {
                const base = BO.ZombiesData.get(def.body);
                const spec = Object.assign({}, base, {
                    name: def.name, hp: def.hp, speed: def.speed, attack: def.dmg, defense: 0,
                    resistances: { bullet: 1, explosive: 1, fire: 1, headshot: 1, melee: 1 },
                    attackType: def.ranged ? (base.attackType === 'melee' ? 'acid_spit' : base.attackType) : 'melee',
                    isBoss: !!def.boss, isSuperBoss: false, isMagical: false, splitCount: 0, jumpChance: 0
                });
                ent = new BO.ZombieEntity({ id: 10000 + id, spec, round: def.lvl, hp: def.hp, speed: def.speed, damage: def.dmg, x, y, z, sizeMult: def.boss ? 1.5 : 1, windowInteractive: null });
                ent.yaw = Math.random() * Math.PI * 2;
            }
            const bar = makeBarSprite();
            bar.sprite.position.set(0, def.boss ? 2.85 : 2.15, 0);
            ent.parts.root.add(bar.sprite);

            const agent = {
                id, defId, def, ent, kind: def.kind, faction: def.faction, name: def.name, boss: !!def.boss,
                poiId: opts.poiId || null, home: { x, y, z }, leash: opts.leash || 55,
                armor: def.armor, lvl: def.lvl, st: {}, ruptureT: 0, shredStacks: 0, alive: true,
                state: 'idle', detect: 0, investigate: null, lostT: 0, idlePhase: Math.random() * 10, wanderT: 0, goal: null,
                hostile: BO.OWRPGFactions.isHostile(this.s, def.faction),
                bar
            };
            ent.owAgent = agent;
            this.agents.push(agent);
            if (!def.glb && BO.MeshProxy) {
                // Far LOD shared by every agent of the same rig type (see MeshProxy.js).
                const key = def.kind === 'bot' ? 'ow-bot:' + def.faction + ':' + !!def.boss + ':' + def.weapon : 'ow-beast:' + def.body + ':' + !!def.boss;
                agent.lod = BO.MeshProxy.attach(ent.parts.root, key);
            }
            if (def.glb && BO.Assets) {
                const root = ent.parts.root;
                const fallback = root.children.filter(child => child !== bar.sprite);
                agent.visual = BO.Assets.placeGLB(root, def.glb, {
                    fitSize: [100, (def.glbScale || 1.8) / root.scale.y, 100], uniform: true,
                    guardScene: BO.World.scene, ownerSession: null,
                    onLoad: (holder, model) => {
                        if (!agent.alive || !this.agents.includes(agent)) { holder.removeFromParent(); return; }
                        for (const child of fallback) child.visible = false;
                        bar.sprite.position.y = (def.glbScale || 1.8) / root.scale.y + 0.35;
                        if (model.animations?.length) {
                            agent.mixer = new THREE.AnimationMixer(model);
                            agent.clips = model.animations;
                            agent.actions = {};
                        }
                    }
                });
            }
            return agent;
        },

        despawn(agent) {
            if (agent.lod) { BO.MeshProxy.detach(agent.lod); agent.lod = null; }
            if (agent.mixer) { agent.mixer.stopAllAction(); agent.mixer.uncacheRoot(agent.mixer.getRoot()); }
            if (agent.bar) { agent.bar.tex.dispose(); agent.bar.sprite.material.dispose(); }
            agent.ent.destroy();
            const i = this.agents.indexOf(agent);
            if (i >= 0) this.agents.splice(i, 1);
        },

        agentsNear(pos, r, onlyHostile) {
            const out = [];
            for (const a of this.agents) {
                if (!a.alive || (onlyHostile && !a.hostile && a.state !== 'combat')) continue;
                if (BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, pos.x, pos.z) <= r) out.push(a);
            }
            return out;
        },

        anyHostileInCombat() { return this.agents.some((a) => a.alive && a.state === 'combat' && a.hostile); },

        activeBoss() {
            const P = BO.Player;
            let best = null, bd = 65;
            for (const a of this.agents) {
                if (!a.alive || !a.boss) continue;
                const d = BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, P.pos.x, P.pos.z);
                if (a.state === 'combat' || d < bd) { bd = d; best = a; }
            }
            return best;
        },

        awareness() {
            let best = 0, combat = false;
            for (const a of this.agents) {
                if (!a.alive || !a.hostile) continue;
                if (a.state === 'combat') combat = true;
                best = Math.max(best, a.detect);
            }
            return combat ? 1.01 : Math.min(1, best);
        },

        noise(pos, radius, decoy = false) {
            for (const a of this.agents) {
                if (!a.alive || !a.hostile || a.state === 'combat') continue;
                const d = BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, pos.x, pos.z);
                if (d > radius) continue;
                a.investigate = { x: pos.x, z: pos.z, t: 10 };
                a.detect = Math.max(a.detect, decoy ? 0.5 : (d < radius * 0.4 ? 1 : 0.6));
                if (a.detect >= 1) this.engage(a); else a.state = 'suspicious';
            }
        },

        engage(a, spread = true) {
            if (!a.alive || a.state === 'combat') return;
            a.state = 'combat';
            a.detect = 1;
            a.lostT = 0;
            if (a.kind === 'bot') BO.Sound.playUIClick?.();
            if (spread) {
                for (const o of this.agents) {
                    if (o !== a && o.alive && o.hostile && o.state !== 'combat' && (o.poiId === a.poiId || BO.Math.dist2D(o.ent.pos.x, o.ent.pos.z, a.ent.pos.x, a.ent.pos.z) < 22)) this.engage(o, false);
                }
            }
        },

        onDamaged(a, ctx) {
            if (!a.alive) return;
            if (!a.hostile && BO.OWRPGFactionsData.FACTIONS[a.faction] && ctx.source !== 'reaction') {
                BO.OWRPGMode.setFlag('provoked_' + a.faction, true);
                BO.OWRPGMode.changeRep(a.faction, -40);
                BO.Events.emit('hud:toast', { text: `${BO.OWRPGFactionsData.FACTIONS[a.faction].short.toUpperCase()} TURNED HOSTILE`, color: '#ef4444' });
                this.refreshHostility();
            }
            if (a.hostile) this.engage(a);
        },

        onKilled(a, ctx = {}) {
            if (!a.alive) return;
            a.alive = false;
            if (a.bar) a.bar.sprite.visible = false;
            const M = BO.OWRPGMode;
            const s = this.s;
            if (a._chilled) a._chilled = false;
            if (!ctx.byNpc) {
                const xp = a.def.xp * BO.OWRPGCharacter.killXpMult(s, a.lvl) * (1 + (BO.OWRPGCharacter.perkFx(s).killXpBonus || 0)) * (ctx.sneak ? 1.5 : 1);
                M.giveXp(xp, ctx.sneak ? 'Sneak kill' : null);
                s.stats.kills++;
                if (ctx.source === 'gun' || ctx.source === 'melee') BO.OWRPGCharacter.addSkillXp(s, 'combat', Math.max(8, a.lvl * 3));
                if (a.kind === 'beast' || a.boss) BO.OWRPGCharacter.addSkillXp(s, 'slayer', a.boss ? 100 : Math.max(10, a.lvl * 3));
                if (BO.OWRPGWorldData.isInterior(a.ent.pos.x, a.ent.pos.z)) BO.OWRPGCharacter.addSkillXp(s, 'delving', a.boss ? 120 : 12);
                if (s.player.codex && s.player.codex.enemies) {
                    s.player.codex.enemies[a.defId] = (s.player.codex.enemies[a.defId] || 0) + 1;
                }
                if (s.player.bounties && s.player.bounties.active) {
                    const B = BO.OWRPGExpansionData?.BOUNTIES?.find((b) => b.id === s.player.bounties.active);
                    if (B && B.target === a.defId) {
                        s.player.bounties.progress = (s.player.bounties.progress || 0) + 1;
                        if (s.player.bounties.progress >= B.count) {
                            M.giveXp(B.xp, 'Bounty');
                            s.player.credits += Math.round(B.credits * (1 + (BO.OWRPGCharacter.perkFx(s).bountyMult || 0)));
                            for (const [f, v] of Object.entries(B.rep || {})) M.changeRep(f, v);
                            s.player.bounties.completed = (s.player.bounties.completed || 0) + 1;
                            s.player.bounties.active = null;
                            s.player.bounties.progress = 0;
                            BO.Sound?.playQuestFanfare?.();
                            BO.Events.emit('hud:banner', { title: 'BOUNTY COMPLETE', sub: `${B.title} · +${B.xp} XP · +${B.credits} cr`, color: '#fbbf24' });
                        } else {
                            M.toast(`Bounty: ${s.player.bounties.progress}/${B.count} ${a.name}`, '#fbbf24');
                        }
                    }
                }
                if (ctx.sneak) {
                    s.stats.sneakKills++;
                    const fx = BO.OWRPGCharacter.perkFx(s);
                    if (fx.camoOnKill) M.camoT = Math.max(M.camoT, fx.camoOnKill);
                }
                const fx = BO.OWRPGCharacter.perkFx(s);
                if (fx.killHeal) M.heal(fx.killHeal);
                if (BO.OWRPGFactionsData.FACTIONS[a.faction]) BO.OWRPGFactions.onFactionKill(s, a.faction);
            }
            M.setFlag('killed_' + a.defId, true);
            BO.OWRPGQuests.onEvent(s, 'kill', a.defId);
            if (a.poiId) BO.OWRPGWorldSim.onAgentKilled(a);
            M.dropLoot(a.ent.pos, a.def.loot, a.boss ? 4 : 1);
        },

        refreshHostility() {
            const s = this.s;
            for (const a of this.agents) {
                const h = a.eventHostile || BO.OWRPGFactions.isHostile(s, a.faction);
                if (h === a.hostile) continue;
                a.hostile = h;
                if (!h && a.state === 'combat') { a.state = 'idle'; a.detect = 0; }
            }
        },

        /* ------------------------------------------------ 10 Hz perception */
        tick10(dt) {
            const s = this.s;
            const P = BO.Player;
            const M = BO.OWRPGMode;
            const d = BO.OWRPGCharacter.derived(s);
            const enc = BO.OWRPGCharacter.encumbrance(s);
            const light = BO.OWRPGWorldSim.light;
            const speed = Math.hypot(P.vel.x, P.vel.z);
            const stepR = (P.sprinting || P.tacSprinting ? 14 : speed > 1 ? 7 : 0) * (P.crouching ? 0.35 : 1) * d.noiseMult * enc.noise;
            const camo = M.camoT > 0;
            const wary = {};
            for (const a of this.agents) {
                if (!a.alive) continue;
                const dist = BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, P.pos.x, P.pos.z);
                if (!a.hostile) {
                    if (BO.OWRPGFactions.isWary(s, a.faction) && dist < 12) wary[a.faction] = true;
                    continue;
                }
                if (a.state === 'combat') {
                    const los = dist < 45 && BO.World.hasLineOfSight(a.ent.pos.x, a.ent.pos.y + 1.5, a.ent.pos.z, P.pos.x, P.pos.y + 1.4, P.pos.z);
                    a.lostT = los && !camo ? 0 : a.lostT + dt * (d.fx.vanish ? 2 : 1);
                    if (a.lostT > 12 && dist > 25) { a.state = 'suspicious'; a.detect = 0.6; a.investigate = { x: P.pos.x, z: P.pos.z, t: 12 }; }
                    const fromHome = BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, a.home.x, a.home.z);
                    if (fromHome > a.leash && BO.Math.dist2D(P.pos.x, P.pos.z, a.home.x, a.home.z) > a.leash + 15) { a.state = 'return'; a.detect = 0; }
                    continue;
                }
                if (a.state === 'return') continue;
                let gain = 0;
                const sight = (a.kind === 'bot' ? 40 : 26) * (0.6 + 0.4 * light);
                if (!camo && dist < sight) {
                    const fx = Math.sin(a.ent.yaw), fz = Math.cos(a.ent.yaw);
                    const dx = (P.pos.x - a.ent.pos.x) / Math.max(0.1, dist), dz = (P.pos.z - a.ent.pos.z) / Math.max(0.1, dist);
                    const inCone = dist < 4 || fx * dx + fz * dz > CONE_COS || (a.state === 'suspicious' && dist < sight * 0.6);
                    const periph = !inCone && dist < 12 ? 0.3 : 0;
                    if ((inCone || periph) && BO.World.hasLineOfSight(a.ent.pos.x, a.ent.pos.y + 1.5, a.ent.pos.z, P.pos.x, P.pos.y + (P.crouching ? 0.9 : 1.4), P.pos.z)) {
                        gain += (0.15 + 2.0 * Math.pow(1 - dist / sight, 1.5)) * (inCone ? 1 : periph) * (P.crouching ? 0.45 : 1) * (P.sprinting ? 1.3 : 1) * (1 - d.detectSlow);
                    }
                }
                if (stepR > 0 && dist < stepR) {
                    gain += 0.5 * (1 - dist / stepR);
                    a.investigate = { x: P.pos.x, z: P.pos.z, t: 6 };
                }
                if (gain > 0) a.detect = Math.min(1, a.detect + gain * dt);
                else a.detect = Math.max(0, a.detect - dt * 0.12 * (d.fx.vanish ? 2 : 1));
                if (a.detect >= 1) this.engage(a);
                else if (a.detect > 0.35) { a.state = 'suspicious'; if (!a.investigate) a.investigate = { x: P.pos.x, z: P.pos.z, t: 6 }; }
                else if (a.state === 'suspicious' && a.detect < 0.1) a.state = 'idle';
            }
            for (const f of Object.keys(BO.OWRPGFactionsData.FACTIONS)) {
                if (wary[f]) {
                    if (!this.warnT[f]) BO.Events.emit('hud:toast', { text: `${BO.OWRPGFactionsData.FACTIONS[f].short}: "Back off. Last warning."`, color: '#f97316' });
                    this.warnT[f] = (this.warnT[f] || 0) + dt;
                    if (this.warnT[f] > 4) { M.setFlag('provoked_' + f, true); this.refreshHostility(); }
                } else this.warnT[f] = 0;
            }
        },

        /* ------------------------------------------------ per-frame */
        update(dt) {
            const P = BO.Player;
            const decoy = BO.OWRPGCombat.decoy;
            const ents = [];
            const bots = [];
            for (const a of this.agents) { if (a.alive) ents.push(a.ent); if (a.kind === 'bot' && a.alive) bots.push(a.ent); }
            const beastCb = {
                allowProjectiles: true,
                getTarget: (z) => (decoy && z.owAgent && z.pos.distanceTo(decoy.pos) < 25) ? { x: decoy.pos.x, y: decoy.pos.y, z: decoy.pos.z, attackRange: 1.4 } : null,
                onAttackCustomTarget: () => {},
                onMeleePlayer: (z) => { P.takeDamage(z.damage, z.pos, false, z); BO.Sound.playZombieGroan(z.soundProfile, 0.9); },
                onRangedAttack: (z, tx, ty, tz) => this._spit(z, tx, ty, tz)
            };
            const hitMeshes = [];
            for (let i = this.agents.length - 1; i >= 0; i--) {
                const a = this.agents[i];
                const ent = a.ent;
                if (a.alive && !ent.alive) this.onKilled(a, { byNpc: true });
                if (a.alive) BO.OWRPGCombat.tickStatuses(a, dt);
                if (!a.alive) {
                    if (a.lod) BO.MeshProxy.set(a.lod, false);
                    if (a.kind === 'beast') { if (!ent.update(dt, ents, beastCb)) { this.despawn(a); } }
                    else { a.deadT = (a.deadT || 0) + dt; if (a.deadT > 0.2) this.despawn(a); }
                    continue;
                }
                const dist = BO.Math.dist2D(ent.pos.x, ent.pos.z, P.pos.x, P.pos.z);
                if (a.lod) BO.MeshProxy.set(a.lod, dist > AGENT_DETAIL_DIST);

                // Floating 3D world-space bar visibility
                if (a.bar) {
                    const showBar = ent.parts.root.visible && dist < 34 && (a.state === 'combat' || ent.hp < ent.maxHp || a.boss || Object.keys(a.st).length > 0);
                    a.bar.sprite.visible = showBar;
                    if (showBar) updateBarSprite(a);
                }

                const engaged = a.state === 'combat' && a.hostile;
                const rivalNear = a.kind === 'bot' && !engaged && bots.some((b) => b !== ent && b.team !== ent.team && b.pos.distanceTo(ent.pos) < 40);
                if (a.kind === 'bot' && (engaged || rivalNear)) {
                    if (engaged && decoy && ent.pos.distanceTo(decoy.pos) < 25) this._walk(a, decoy.pos.x, decoy.pos.z, 3.2, dt);
                    else {
                        ent.update(dt, {
                            playerAlive: P.alive && BO.OWRPGMode.camoT <= 0, playerPos: P.pos, playerTeam: engaged ? (ent.team === 0 ? 1 : 0) : ent.team, bots,
                            modeType: 'owrpg', objectivePos: null,
                            onBotShootPlayer: (bot, dmg) => P.takeDamage(dmg * 0.78, bot.pos, false, bot),
                            onBotKillBot: (killer, victim) => { if (victim.owAgent) this.onKilled(victim.owAgent, { byNpc: true }); }
                        });
                    }
                } else if (a.kind === 'beast' && engaged) {
                    if (!ent.update(dt, ents, beastCb)) { this.despawn(a); continue; }
                } else if (a.state === 'return') {
                    if (this._walk(a, a.home.x, a.home.z, 3.4, dt) < 2) { a.state = 'idle'; ent.hp = ent.maxHp; a.st = {}; a.shredStacks = 0; }
                } else if (a.state === 'suspicious' && a.investigate) {
                    a.investigate.t -= dt;
                    if (this._walk(a, a.investigate.x, a.investigate.z, 2.2, dt) < 1.5 || a.investigate.t <= 0) { a.investigate = null; a.detect *= 0.6; }
                } else this._idle(a, dt);
                if (a.visual && dist < 130) {
                    const speed = a.lastVisualPos ? ent.pos.distanceTo(a.lastVisualPos) / Math.max(0.001, dt) : 0;
                    a.lastVisualPos = ent.pos.clone();
                    if (a.mixer) {
                        const desired = speed > 0.2 ? /walk|run/i : engaged && dist < 3 ? /attack|punch|bite/i : /idle/i;
                        const clip = a.clips.find(c => desired.test(c.name)) || a.clips[0];
                        if (clip && a.clip !== clip.name) {
                            const next = a.actions[clip.name] || (a.actions[clip.name] = a.mixer.clipAction(clip));
                            if (a.action) a.action.fadeOut(0.18);
                            next.reset().fadeIn(0.18).play(); a.action = next; a.clip = clip.name;
                        }
                        a.mixer.update(dt);
                    } else {
                        a.visual.position.y = speed > 0.2 ? Math.abs(Math.sin((a.idlePhase += dt * 8))) * 0.06 : Math.sin((a.idlePhase += dt * 1.6)) * 0.015;
                        a.visual.rotation.z = speed > 0.2 ? Math.sin(a.idlePhase) * 0.035 : 0;
                    }
                }
                if (dist < 130 && ent.parts.root.visible) {
                    const meshes = ent.getHitboxMeshes();
                    for (let m = 0; m < meshes.length; m++) hitMeshes.push(meshes[m]);
                }
            }
            BO.Combat.setTargetPool(hitMeshes);
            this._updateProjectiles(dt);
        },

        _walk(a, x, z, speed, dt) {
            const ent = a.ent;
            const dx = x - ent.pos.x, dz = z - ent.pos.z;
            const d = Math.hypot(dx, dz);
            if (d > 0.3) {
                const sp = speed * (a._chilled ? 0.55 : 1);
                ent.pos.x += (dx / d) * sp * dt;
                ent.pos.z += (dz / d) * sp * dt;
                ent.yaw += BO.Math.angleDiff(ent.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 6);
                BO.World.resolveHorizontal(ent.pos, ent.radius || 0.4, ent.height || 1.75, false);
            }
            ent.pos.y = BO.World.getGroundHeight(ent.pos.x, ent.pos.z, ent.pos.y + 0.4);
            a.idlePhase += dt * (d > 0.3 ? speed * 2.2 : 1);
            ent.parts.root.position.copy(ent.pos);
            ent.parts.root.rotation.y = ent.yaw;
            BO.CharacterMesh.animateLimbs(ent.parts, d > 0.3 ? speed : 0, a.idlePhase, 0, 0);
            return d;
        },

        _idle(a, dt) {
            a.wanderT -= dt;
            if (a.kind === 'bot') {
                if (!a.goal || a.wanderT <= 0) {
                    a.watching = !a.watching && Math.random() < 0.65;
                    if (a.watching) { a.lookYaw = a.ent.yaw; a.wanderT = 3 + Math.random() * 4; }
                    else {
                        const r = Math.random() * (a.ent.post ? a.ent.post.r : 5), ang = Math.random() * Math.PI * 2;
                        a.goal = { x: a.home.x + Math.cos(ang) * r, z: a.home.z + Math.sin(ang) * r };
                        a.wanderT = 4 + Math.random() * 4;
                    }
                }
                if (a.watching) {
                    a.idlePhase += dt;
                    const ent = a.ent;
                    ent.yaw = a.lookYaw + Math.sin(a.idlePhase * 0.5) * 0.9;
                    ent.parts.root.rotation.y = ent.yaw;
                    BO.CharacterMesh.animateLimbs(ent.parts, 0, a.idlePhase * 1.4, 0, 0);
                } else this._walk(a, a.goal.x, a.goal.z, 1.3, dt);
            } else {
                a.idlePhase += dt;
                const ent = a.ent;
                ent.yaw += Math.sin(a.idlePhase * 0.4) * dt * 0.4;
                ent.parts.root.position.copy(ent.pos);
                ent.parts.root.rotation.y = ent.yaw;
                BO.CharacterMesh.animateLimbs(ent.parts, 0, a.idlePhase * 1.5, 0, 0);
            }
        },

        _spit(z, tx, ty, tz) {
            const origin = new THREE.Vector3(z.pos.x, z.pos.y + 1.4, z.pos.z);
            const dir = new THREE.Vector3(tx - origin.x, ty - origin.y, tz - origin.z).normalize();
            const elem = z.owAgent && z.owAgent.def && z.owAgent.def.elem;
            const col = elem === 'void' ? 0xc084fc : (elem === 'chill' ? 0x38bdf8 : 0x84cc16);
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: col }));
            mesh.position.copy(origin);
            BO.World.scene.add(mesh);
            this.projectiles.push({ mesh, pos: origin, vel: dir.multiplyScalar(15), dmg: Math.round(z.damage * 0.85), life: 3, owner: z, col });
        },

        _updateProjectiles(dt) {
            const P = BO.Player;
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                p.life -= dt;
                const step = p.vel.clone().multiplyScalar(dt);
                const wall = BO.World.raycastWorld(p.pos, step.clone().normalize(), step.length() + 0.1);
                p.pos.add(step);
                p.mesh.position.copy(p.pos);
                const hit = P.alive && BO.Math.dist3D(p.pos.x, p.pos.y, p.pos.z, P.pos.x, P.pos.y + 1.1, P.pos.z) < 0.8;
                if (hit) P.takeDamage(p.dmg, p.owner.pos, false, p.owner);
                if (hit || wall || p.life <= 0) {
                    BO.FX.spawnParticles(p.pos, 6, p.col || 0x84cc16, 3, 6, 0.35, 1);
                    p.mesh.removeFromParent();
                    this.projectiles.splice(i, 1);
                }
            }
        },

        _upVec: UP
    };

    BO.OWRPGAI = AI;
})(window.BO);
