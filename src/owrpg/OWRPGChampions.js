/* ============================================================================
   BLACKOUT OPS — Open World RPG · Champions
   Any hostile spawn can roll as a Champion (Diablo / WoW-elite style): larger,
   tougher, wrapped in an affix aura, and carrying 1–3 affixes drawn from 12.
   With 70 base archetypes this multiplies the enemy roster into hundreds of
   distinct encounters. Altars of Trials (OWRPGDiscoveries) force Champions.

   Hooks (all optional-chained at the call sites):
     onSpawn(agent)            OWRPGAI.spawn      → roll + apply
     dealtMult(agent, P)       OWRPGCombat.modifyIncoming (damage to player)
     afterHitPlayer(agent, a)  OWRPGCombat.modifyIncoming (vampiric, frost)
     takenMult(agent)          OWRPGCombat.damage (shield / champion damage perks)
     afterDamaged(agent, dmg)  OWRPGCombat.damage (thorns, summons)
     onKilled(agent)           OWRPGAI.onKilled   (rewards, death novas)
============================================================================ */
(function (BO) {
    'use strict';

    const AFFIXES = {
        vampiric:     { name: 'Vampiric',     color: '#dc2626', desc: 'Heals for 35% of the damage it deals.' },
        molten:       { name: 'Molten',       color: '#f97316', desc: 'Hits burn for +20% damage and it erupts when slain.' },
        frozen:       { name: 'Frozen',       color: '#38bdf8', desc: 'Hits chill you (-25% speed) and it shatters into a frost nova when slain.' },
        shielded:     { name: 'Shielded',     color: '#a5b4fc', desc: 'Raises a barrier for 3 s out of every 8 s that blocks 65% of damage.' },
        swift:        { name: 'Swift',        color: '#a3e635', desc: '+45% movement speed.' },
        berserker:    { name: 'Berserker',    color: '#ef4444', desc: '+60% damage below half health.' },
        thorned:      { name: 'Thorned',      color: '#84cc16', desc: 'Reflects 10% of damage taken back at you.' },
        juggernaut:   { name: 'Juggernaut',   color: '#a8a29e', desc: '+80% health and noticeably larger.' },
        arcane:       { name: 'Arcane',       color: '#c084fc', desc: 'Hurls void bolts every few seconds.' },
        summoner:     { name: 'Summoner',     color: '#facc15', desc: 'Calls two of its kin at 60% and 30% health.' },
        regenerating: { name: 'Regenerating', color: '#4ade80', desc: 'Regenerates 2% of its health every second.' },
        warlord:      { name: 'Warlord',      color: '#fb7185', desc: 'Nearby allies deal +25% damage and the Champion takes 15% less.' }
    };
    const IDS = Object.keys(AFFIXES);
    const BASE_CHANCE = 0.06;
    const MAX_ALIVE = 3;
    const _v = new THREE.Vector3();

    const regionTier = (x, z) => {
        const r = BO.OWRPGWorldData.regionAt(x, z);
        return parseInt(String(r.lvl), 10) || 1;
    };

    const Champions = {
        id: 'champions',
        AFFIXES,
        list: [],

        get s() { return BO.OWRPGMode.state; },

        start() { this.list = []; },
        stop() { this.list = []; },

        /** Roll a fresh spawn. Event squads, bosses, friendlies and summoned kin never roll. */
        onSpawn(agent, opts) {
            if (!agent || agent.boss || !agent.hostile || (opts && (opts.noChampion || opts.summoned))) return;
            if (this.list.filter((a) => a.alive).length >= MAX_ALIVE) return;
            const tier = regionTier(agent.home.x, agent.home.z);
            const chance = BASE_CHANCE + Math.min(0.06, tier * 0.0015);
            if (Math.random() >= chance) return;
            this.make(agent, 1 + (Math.random() < 0.35 + tier * 0.006 ? 1 : 0) + (tier >= 30 && Math.random() < 0.25 ? 1 : 0));
        },

        /** Turn an agent into a Champion with `n` distinct affixes (or the given list). */
        make(agent, n = 2, forced) {
            if (!agent || agent.champ) return agent;
            const pool = IDS.slice();
            const affixes = forced ? forced.slice() : [];
            while (affixes.length < Math.min(3, n) && pool.length) {
                const id = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
                if (!affixes.includes(id)) affixes.push(id);
            }
            const ent = agent.ent;
            const hpMult = 2.4 * (affixes.includes('juggernaut') ? 1.8 : 1);
            ent.maxHp = Math.round(ent.maxHp * hpMult);
            ent.hp = ent.maxHp;
            agent.armor = (agent.armor || 0) + 15;
            if (affixes.includes('swift')) {
                if (agent.kind === 'bot') ent.speedScale = (ent.speedScale || 1) * 1.45;
                else ent.speed = (ent.speed || 2) * 1.45;
            }
            const scale = affixes.includes('juggernaut') ? 1.38 : 1.18;
            ent.parts.root.scale.multiplyScalar(scale);
            agent.champ = { affixes, cycle: Math.random() * 8, regenT: 0, boltT: 2 + Math.random() * 2, summons: 0, color: AFFIXES[affixes[0]].color };
            agent.lvl += 3;
            this._aura(agent);
            if (agent.bar) agent.bar.lastKey = '';
            this.list.push(agent);
            return agent;
        },

        _aura(agent) {
            const col = new THREE.Color(agent.champ.color);
            const group = new THREE.Group();
            const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 40), ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.06;
            const inner = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 6), ringMat);
            inner.rotation.x = -Math.PI / 2;
            inner.position.y = 0.07;
            const shieldMat = new THREE.MeshBasicMaterial({ color: 0xa5b4fc, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
            const shield = new THREE.Mesh(new THREE.SphereGeometry(1.1, 18, 12), shieldMat);
            shield.position.y = 1;
            shield.visible = false;
            group.add(ring, inner, shield);
            group.userData.noHit = true;
            group.traverse((o) => { o.userData.noHit = true; o.raycast = () => {}; });
            agent.ent.parts.root.add(group);
            agent.champ.aura = { group, ring, inner, shield };
        },

        has(agent, id) { return !!(agent && agent.champ && agent.champ.affixes.includes(id)); },

        shieldUp(agent) { return this.has(agent, 'shielded') && (agent.champ.cycle % 8) < 3; },

        label(agent) { return agent.champ ? agent.champ.affixes.map((id) => AFFIXES[id].name).join(' · ') : ''; },

        /* ------------------------------------------------ combat hooks */
        /** Multiplier on damage a Champion (or an ally inspired by a Warlord) deals to the player. */
        dealtMult(agent) {
            let m = 1;
            const fx = BO.OWRPGCharacter.perkFx(this.s);
            if (agent.champ) {
                m *= 1.25;
                if (this.has(agent, 'berserker') && agent.ent.hp < agent.ent.maxHp * 0.5) m *= 1.6;
                if (this.has(agent, 'molten')) m *= 1.2;
                m *= 1 - Math.min(0.75, fx.champDR || 0);
            }
            if (this.list.some((c) => c !== agent && c.alive && this.has(c, 'warlord') && c.ent.pos.distanceTo(agent.ent.pos) < 18)) m *= 1.25;
            return m;
        },

        afterHitPlayer(agent, dealt) {
            if (!agent.champ || dealt <= 0) return;
            if (this.has(agent, 'vampiric')) agent.ent.hp = Math.min(agent.ent.maxHp, agent.ent.hp + dealt * 0.35);
            if (this.has(agent, 'frozen')) BO.OWRPGMode.chillT = Math.max(BO.OWRPGMode.chillT || 0, 2.5);
            if (this.has(agent, 'molten')) BO.FX.spawnParticles(BO.Player.pos.clone().add(_v.set(0, 1, 0)), 6, 0xf97316, 3, 4, 0.3, 0.8);
        },

        /** Multiplier on damage the player deals to this agent. */
        takenMult(agent) {
            if (!agent.champ) return 1;
            const fx = BO.OWRPGCharacter.perkFx(this.s);
            let m = 1 + (fx.champDmg || 0);
            if (this.shieldUp(agent)) m *= 0.35;
            if (this.has(agent, 'warlord')) m *= 0.85;
            return m;
        },

        afterDamaged(agent, dmg) {
            if (!agent.champ || dmg <= 0) return;
            const P = BO.Player;
            // Thorns reflect 10% of the damage actually dealt (overkill excluded), capped at 6% of max HP per hit.
            if (this.has(agent, 'thorned') && P.alive) P.takeDamage(Math.max(1, Math.min(dmg * 0.1, P.maxHp * 0.06)), agent.ent.pos, false, null);
            if (this.has(agent, 'summoner') && agent.alive) {
                const frac = agent.ent.hp / agent.ent.maxHp;
                const want = frac < 0.3 ? 2 : frac < 0.6 ? 1 : 0;
                while (agent.champ.summons < want) { agent.champ.summons++; this._summon(agent); }
            }
        },

        _summon(agent) {
            for (let i = 0; i < 2; i++) {
                const ang = Math.random() * Math.PI * 2;
                const x = agent.ent.pos.x + Math.cos(ang) * 4, z = agent.ent.pos.z + Math.sin(ang) * 4;
                const kin = BO.OWRPGAI.spawn(agent.defId, x, z, { poiId: null, leash: 60, postR: 4, summoned: true, y: BO.OWRPGWorldData.isInterior(x, z) ? agent.ent.pos.y : null });
                if (kin) { kin.summoned = true; BO.OWRPGAI.engage(kin, false); }
            }
            BO.FX.spawnParticles(agent.ent.pos.clone().add(_v.set(0, 1.2, 0)), 18, 0xfacc15, 5, 6, 0.5, 1.2);
            BO.OWRPGMode.toast('The Champion calls for aid!', '#facc15');
        },

        /* ------------------------------------------------ frame */
        update(dt) {
            if (!this.list.length) return;
            const P = BO.Player;
            for (let i = this.list.length - 1; i >= 0; i--) {
                const a = this.list[i];
                if (!a.alive || !BO.OWRPGAI.agents.includes(a)) { this.list.splice(i, 1); continue; }
                const c = a.champ;
                c.cycle += dt;
                const au = c.aura;
                if (au && a.ent.parts.root.visible) {
                    au.ring.rotation.z += dt * 1.2;
                    au.inner.rotation.z -= dt * 2.4;
                    au.ring.material.opacity = 0.55 + Math.sin(c.cycle * 4) * 0.2;
                    au.shield.visible = this.shieldUp(a);
                }
                if (this.has(a, 'regenerating') && a.ent.hp < a.ent.maxHp) a.ent.hp = Math.min(a.ent.maxHp, a.ent.hp + a.ent.maxHp * 0.02 * dt);
                if (this.has(a, 'arcane') && a.state === 'combat' && a.hostile && P.alive) {
                    c.boltT -= dt;
                    const dist = a.ent.pos.distanceTo(P.pos);
                    if (c.boltT <= 0 && dist < 40 && BO.World.hasLineOfSight(a.ent.pos.x, a.ent.pos.y + 1.5, a.ent.pos.z, P.pos.x, P.pos.y + 1.3, P.pos.z)) {
                        c.boltT = 3.2 + Math.random() * 1.5;
                        this._bolt(a);
                    }
                }
            }
        },

        _bolt(a) {
            const P = BO.Player;
            const origin = new THREE.Vector3(a.ent.pos.x, a.ent.pos.y + 1.6 * a.ent.parts.root.scale.y, a.ent.pos.z);
            const dir = new THREE.Vector3(P.pos.x - origin.x, P.pos.y + 1.2 - origin.y, P.pos.z - origin.z).normalize();
            const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: 0xc084fc }));
            mesh.position.copy(origin);
            BO.World.scene.add(mesh);
            const dmg = Math.round(10 + a.lvl * 1.4);
            BO.OWRPGAI.projectiles.push({ mesh, pos: origin, vel: dir.multiplyScalar(17), dmg, life: 3, owner: a.ent, col: 0xc084fc });
        },

        /* ------------------------------------------------ death */
        onKilled(a, ctx) {
            if (!a.champ) return;
            const s = this.s, M = BO.OWRPGMode, P = BO.Player;
            const pos = a.ent.pos.clone();
            if (this.has(a, 'molten') || this.has(a, 'frozen')) {
                const frost = this.has(a, 'frozen');
                BO.FX.spawnParticles(pos.clone().add(_v.set(0, 1, 0)), 30, frost ? 0x7dd3fc : 0xf97316, 7, 8, 0.6, 1.4);
                if (P.alive && P.pos.distanceTo(pos) < 6) P.takeDamage(frost ? 18 : 28, pos, true, null);
                if (frost && P.pos.distanceTo(pos) < 6) M.chillT = Math.max(M.chillT || 0, 3);
            }
            if (ctx && ctx.byNpc) return;
            s.atlas.champions = (s.atlas.champions || 0) + 1;
            const fx = BO.OWRPGCharacter.perkFx(s);
            M.giveXp(a.def.xp * 2 * BO.OWRPGCharacter.killXpMult(s, a.lvl), 'Champion slain');
            BO.OWRPGCharacter.addSkillXp(s, 'slayer', 60 + a.lvl * 4);
            const rolls = 2 + (Math.random() < (fx.champLoot || 0) ? 1 : 0);
            M.dropLoot(pos, 'champion', rolls);
            M.setFlag('first_champion', true);
            M.setFlag('champions_slain', s.atlas.champions);
            BO.Events.emit('hud:toast', { text: 'Champion slain: ' + a.name + ' (' + this.label(a) + ')', color: a.champ.color });
        }
    };

    BO.OWRPGChampions = Champions;
    if (BO.OWRPGMode) BO.OWRPGMode.registerSystem(Champions);
})(window.BO);
