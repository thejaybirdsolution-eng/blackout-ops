/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Boss Rush signature attacks
   ----------------------------------------------------------------------------
   Every boss in the rush has FIVE attacks that no other boss has. An attack is
   a short script of steps built from sixteen primitives (fan, ring, spiral,
   rain, shock, charge, leap, beam, homing, summon, pool, pull, nova, wall,
   mines, orbit) with its own name, colours and numbers.

   Tier 1..5 = strength. Stronger attacks hit harder and have LONGER cooldowns:
     cooldown = 3.5 + tier * 2.4 s  (5.9 s … 15.5 s)
     damage   = boss damage × TIER_DMG[tier] × step factor

   BO.BossAttacks.Runner drives one boss: cooldowns, telegraphs, projectiles,
   ground hazards, scripted charges / leaps, summons. Boss Rush owns it.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const L = BO.MinigameLib;
    const { SFX, basic } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const TIER_DMG = [0, 0.22, 0.32, 0.42, 0.56, 0.75];
    const cooldownOf = (tier) => 3.5 + tier * 2.4;

    // shorthand step builders: { p: primitive, at: delay s, ...params }
    const A = (name, tier, steps) => ({ name, tier, steps: Array.isArray(steps) ? steps : [steps] });

    /* -------------------------------------------------------------- roster */
    const ATTACKS = {
        boss_butcher: [
            A('Cleaver Toss', 1, { p: 'fan', n: 3, spread: 0.22, speed: 18, size: 0.5, color: 0x9ca3af }),
            A('Offal Splatter', 2, { p: 'pool', n: 3, at0: 'player', scatter: 4, r: 2.4, dur: 6, dps: 0.35, color: 0x7f1d1d }),
            A('Meat Hook', 3, [{ p: 'pull', dur: 1.3, force: 15, color: 0xb91c1c }, { p: 'nova', at: 1.3, r: 6, delay: 0.3, color: 0xdc2626 }]),
            A('Chopping Block', 4, { p: 'leap', r: 7.5, hang: 1.0, color: 0x78350f }),
            A('Slaughterhouse Frenzy', 5, [{ p: 'charge', speed: 24, dur: 0.9 }, { p: 'charge', at: 1.2, speed: 24, dur: 0.9 }, { p: 'charge', at: 2.4, speed: 26, dur: 1.0 }])
        ],
        boss_cerberus: [
            A('Triple Bite Flare', 1, [{ p: 'fan', n: 3, spread: 0.3, speed: 22, size: 0.4, color: 0xf97316 }, { p: 'fan', at: 0.4, n: 3, spread: 0.3, speed: 22, size: 0.4, color: 0xfb923c }]),
            A('Hellfire Carpet', 2, { p: 'pool', n: 5, at0: 'line', r: 1.8, dur: 5, dps: 0.4, color: 0xea580c }),
            A('Brimstone Rain', 3, { p: 'rain', n: 7, scatter: 8, r: 2.6, delay: 1.2, color: 0xf59e0b }),
            A('Inferno Ring', 4, { p: 'shock', waves: 2, gap: 0.8, speed: 13, color: 0xf97316 }),
            A('Three-Headed Pyre', 5, { p: 'spiral', arms: 3, rate: 8, dur: 3.2, speed: 14, spin: 1.6, color: 0xef4444 })
        ],
        super_titan_colossus: [
            A('Boulder Lob', 1, { p: 'fan', n: 1, speed: 19, size: 1.3, grav: 9, color: 0x78716c, splash: 3.5 }),
            A('Tectonic Stomp', 2, { p: 'shock', waves: 3, gap: 0.55, speed: 11, color: 0xa8a29e }),
            A('Pillar Crush', 3, { p: 'rain', n: 4, follow: true, seq: 0.45, r: 3.6, delay: 1.3, color: 0x57534e }),
            A('Avalanche', 4, { p: 'wall', speed: 11, gapW: 5, color: 0x9ca3af }),
            A('World Breaker', 5, { p: 'nova', r: 16, delay: 2.3, color: 0xfde68a, los: true })
        ],
        boss_witch_queen: [
            A('Hex Bolts', 1, { p: 'homing', n: 3, speed: 9, turn: 2.2, life: 4.5, size: 0.35, color: 0xa855f7 }),
            A('Cauldron Bubbles', 2, { p: 'pool', n: 4, at0: 'scatter', scatter: 10, r: 2.8, dur: 7, dps: 0.3, color: 0x4ade80 }),
            A('Coven Summons', 3, { p: 'summon', n: 3, type: 'hopper' }),
            A('Crow Swarm', 4, { p: 'ring', n: 22, waves: 2, waveGap: 0.5, speed: 12, size: 0.3, color: 0x1f2937 }),
            A('Moon Curse', 5, { p: 'beam', sweep: 0.9, dur: 3.4, delay: 1.0, width: 1.6, color: 0xc084fc })
        ],
        boss_plague: [
            A('Miasma Puff', 1, { p: 'fan', n: 5, spread: 0.12, speed: 10, size: 0.55, color: 0x84cc16 }),
            A('Plague Mines', 2, { p: 'mines', n: 6, delay: 2.2, r: 3, color: 0x65a30d }),
            A('Infected Horde', 3, { p: 'summon', n: 4, type: 'shambler' }),
            A('Pestilence Cloud', 4, { p: 'pool', n: 1, at0: 'follow', r: 4.5, dur: 7, dps: 0.45, color: 0xa3e635 }),
            A('Black Death Nova', 5, [{ p: 'nova', r: 13, delay: 1.8, color: 0x3f6212 }, { p: 'pool', at: 2.1, n: 6, at0: 'ringBoss', r: 2.2, dur: 6, dps: 0.4, color: 0x365314 }])
        ],
        super_seraph_harbinger: [
            A('Halo Disc', 1, { p: 'orbit', n: 4, r0: 3, r1: 22, dur: 3.5, size: 0.6, color: 0xfde047 }),
            A('Judgement Pillars', 2, { p: 'rain', n: 5, follow: true, seq: 0.35, r: 2.2, delay: 0.9, color: 0xfef9c3 }),
            A('Wing Gale', 3, [{ p: 'pull', dur: 1.2, force: -18, color: 0xe0f2fe }, { p: 'fan', at: 1.2, n: 7, spread: 0.14, speed: 24, size: 0.3, color: 0xfacc15 }]),
            A('Radiant Lance', 4, { p: 'beam', count: 3, fanAng: 0.35, dur: 0.5, delay: 1.1, width: 2.0, color: 0xfacc15 }),
            A('Rapture Spiral', 5, { p: 'spiral', arms: 6, rate: 5, dur: 3.5, speed: 12, spin: 1.1, color: 0xfde68a })
        ],
        boss_colossus: [
            A('Rivet Burst', 1, { p: 'fan', n: 7, spread: 0.09, speed: 30, size: 0.18, color: 0xd4d4d8 }),
            A('Hydraulic Slam', 2, { p: 'shock', waves: 1, speed: 20, width: 2.6, color: 0x60a5fa }),
            A('Magnet Pull', 3, [{ p: 'pull', dur: 2.0, force: 11, color: 0x3b82f6 }, { p: 'mines', at: 0.2, n: 4, ringR: 4, delay: 2.0, r: 2.8, color: 0x1d4ed8 }]),
            A('Rocket Barrage', 4, { p: 'rain', n: 9, scatter: 10, r: 2.8, delay: 1.6, color: 0xf87171 }),
            A('Overdrive Ram', 5, [{ p: 'charge', speed: 30, dur: 1.4 }, { p: 'shock', at: 1.4, waves: 1, speed: 16, color: 0x93c5fd }])
        ],
        boss_manbearpig: [
            A('Snout Spit', 1, { p: 'fan', n: 2, spread: 0.2, speed: 16, size: 0.45, grav: 6, color: 0x92400e, splash: 2.2 }),
            A('Bear Hug Lunge', 2, { p: 'leap', r: 4.5, hang: 0.55, color: 0x713f12 }),
            A('Pig Stampede', 3, { p: 'summon', n: 5, type: 'sprinter' }),
            A('Mange Spores', 4, { p: 'ring', n: 16, waves: 3, waveGap: 0.6, speed: 7, size: 0.45, color: 0xd97706 }),
            A('Excelsior Roar', 5, [{ p: 'pull', dur: 1.5, force: 13, color: 0xfbbf24 }, { p: 'nova', at: 1.5, r: 9, delay: 0.2, color: 0xb45309 }])
        ],
        boss_lycan_king: [
            A('Claw Wave', 1, { p: 'fan', n: 3, spread: 0.35, speed: 20, size: 0.7, flat: true, color: 0xe5e7eb }),
            A('Moonlit Pounce', 2, [{ p: 'leap', r: 5, hang: 0.6, color: 0x94a3b8 }, { p: 'leap', at: 1.1, r: 5, hang: 0.6, color: 0x94a3b8 }]),
            A('Pack Call', 3, { p: 'summon', n: 4, type: 'hellhound' }),
            A('Howl Shock', 4, { p: 'shock', waves: 4, gap: 0.4, speed: 15, color: 0xcbd5e1 }),
            A('Blood Moon Frenzy', 5, [0, 0.8, 1.6, 2.4].map((t) => ({ p: 'charge', at: t, speed: 27, dur: 0.6, zig: true })))
        ],
        super_hydra_behemoth: [
            A('Venom Volley', 1, { p: 'fan', n: 5, spread: 0.18, speed: 17, size: 0.4, grav: 5, color: 0x22c55e, splash: 2 }),
            A('Tidal Sweep', 2, { p: 'wall', speed: 9, gapW: 6, color: 0x0ea5e9 }),
            A('Seven-Fang Spiral', 3, { p: 'spiral', arms: 7, rate: 4, dur: 2.0, speed: 13, spin: -1.4, color: 0x16a34a }),
            A('Abyssal Geysers', 4, { p: 'rain', n: 7, follow: true, seq: 0.3, r: 2.4, delay: 1.0, color: 0x38bdf8 }),
            A('Maelstrom', 5, [{ p: 'pull', dur: 3.0, force: 9, color: 0x0284c7 }, { p: 'ring', at: 0.5, n: 18, waves: 4, waveGap: 0.6, speed: 9, size: 0.35, color: 0x7dd3fc }])
        ],
        boss_ogre_emperor: [
            A('Royal Mace Toss', 1, { p: 'homing', n: 1, speed: 8, turn: 1.4, life: 5, size: 1.0, color: 0xca8a04 }),
            A('Throne Quake', 2, { p: 'shock', waves: 2, gap: 1.0, speed: 8, width: 3.2, color: 0x854d0e }),
            A('Tribute Collectors', 3, { p: 'summon', n: 3, type: 'one_arm_ripper' }),
            A('Boulder Juggle', 4, { p: 'rain', n: 5, scatter: 6, r: 4.2, delay: 1.5, color: 0xa16207 }),
            A("Emperor's Decree", 5, [{ p: 'leap', r: 8, hang: 1.2, color: 0xeab308 }, { p: 'nova', at: 1.3, r: 17, delay: 1.6, color: 0xfacc15, los: true }])
        ],
        boss_hydra_matron: [
            A('Acid Lash', 1, { p: 'beam', count: 1, dur: 0.35, delay: 0.7, width: 1.4, len: 18, color: 0x84cc16 }),
            A('Brood Eggs', 2, { p: 'mines', n: 5, delay: 2.6, r: 2.6, pool: true, color: 0xbef264 }),
            A('Twin Head Barrage', 3, [{ p: 'fan', n: 6, spread: 0.1, speed: 19, size: 0.32, color: 0x4d7c0f, offset: -0.25 }, { p: 'fan', at: 0.35, n: 6, spread: 0.1, speed: 19, size: 0.32, color: 0x65a30d, offset: 0.25 }]),
            A('Corrosion Lake', 4, { p: 'pool', n: 1, at0: 'boss', r: 7, dur: 6, dps: 0.35, color: 0x3f6212 }),
            A("Matriarch's Wrath", 5, [{ p: 'spiral', arms: 4, rate: 7, dur: 2.6, speed: 13, spin: 2, color: 0x22c55e }, { p: 'ring', at: 2.6, n: 24, speed: 11, size: 0.35, color: 0xa3e635 }])
        ],
        super_dreadnought_mech: [
            A('Gatling Sweep', 1, [0, 0.25, 0.5].map((t) => ({ p: 'fan', at: t, n: 9, spread: 0.06, speed: 34, size: 0.15, color: 0xfde047 }))),
            A('Cluster Missiles', 2, { p: 'homing', n: 6, speed: 15, turn: 3.2, life: 2.6, size: 0.3, color: 0xf87171 }),
            A('Orbital Laser', 3, { p: 'rain', n: 3, follow: true, seq: 0.6, r: 2.2, delay: 0.9, color: 0xef4444 }),
            A('Minefield Drop', 4, { p: 'mines', n: 10, delay: 2.4, r: 2.6, color: 0xdc2626 }),
            A('Nuclear Core Purge', 5, { p: 'nova', r: 22, delay: 3.0, color: 0x84cc16, los: true })
        ],
        boss_nyx: [
            A('Shadow Daggers', 1, { p: 'fan', n: 4, spread: 0.16, speed: 26, size: 0.25, color: 0x312e81 }),
            A('Umbral Rift', 2, { p: 'pool', n: 3, at0: 'player', scatter: 3, r: 2.4, dur: 6, dps: 0.4, color: 0x4c1d95 }),
            A('Eclipse Orbit', 3, { p: 'orbit', n: 6, r0: 2, r1: 16, dur: 4.2, size: 0.5, color: 0x6d28d9 }),
            A('Night Terrors', 4, { p: 'summon', n: 4, type: 'shadow_stalker' }),
            A('Void Collapse', 5, [{ p: 'pull', dur: 2.2, force: 12, color: 0x1e1b4b }, { p: 'nova', at: 2.2, r: 8, delay: 0.25, color: 0x7c3aed }])
        ],
        super_void_sovereign: [
            A('Eclipse Shards', 1, [{ p: 'ring', n: 12, speed: 13, size: 0.3, color: 0xe879f9 }, { p: 'ring', at: 0.45, n: 12, speed: 13, size: 0.3, rot: 0.26, color: 0xc026d3 }]),
            A('Singularity', 2, { p: 'homing', n: 2, speed: 6, turn: 1.2, life: 7, size: 0.9, color: 0x0f0a1f }),
            A('Star Fall', 3, { p: 'rain', n: 11, scatter: 13, r: 2.6, delay: 1.5, color: 0xf0abfc }),
            A('Event Horizon Beam', 4, { p: 'beam', count: 2, opposite: true, sweep: 0.75, dur: 3.6, delay: 1.0, width: 1.8, color: 0xa21caf }),
            A("Sovereign's End", 5, [{ p: 'spiral', arms: 8, rate: 4, dur: 3.0, speed: 11, spin: 0.9, color: 0xd946ef }, { p: 'nova', at: 3.0, r: 11, delay: 1.0, color: 0x701a75 }])
        ]
    };

    const geoCache = new Map();
    const sphere = (r) => { const k = Math.round(r * 100); if (!geoCache.has(k)) geoCache.set(k, new THREE.SphereGeometry(r, 10, 8)); return geoCache.get(k); };

    /* -------------------------------------------------------------- runner */
    class Runner {
        constructor(S, boss, arenaR) {
            this.S = S;
            this.boss = boss;
            this.arenaR = arenaR;
            this.list = (ATTACKS[boss.spec.id] || ATTACKS.boss_butcher).map((a, i) => ({ def: a, cd: 2.5 + i * 1.6 }));
            this.gap = 2.2;              // seconds before the first attack
            this.tasks = [];             // pending steps { t, step, atk }
            this.proj = [];
            this.haz = [];               // ground hazards / telegraphs
            this.move = null;            // scripted charge / leap
            this.pullV = V(0, 0, 0);
            this.label = '';
            this.labelT = 0;
            this.used = {};
        }

        get busy() { return this.tasks.length > 0 || !!this.move; }

        dmg(f) { return Math.max(4, this.boss.damage * TIER_DMG[this._tier || 1] * (f || 1)); }

        hitPlayer(amount, pos, explosive) {
            const P = BO.Player;
            if (!P.alive) return;
            P.takeDamage(Math.round(amount), pos || this.boss.pos, !!explosive, this.boss);
        }

        eye() { const b = this.boss; return V(b.pos.x, b.pos.y + b.height * 0.62, b.pos.z); }
        playerC() { const p = BO.Player.pos; return V(p.x, p.y + 1.1, p.z); }

        update(dt, fighting) {
            const b = this.boss;
            if (this.labelT > 0) this.labelT -= dt;
            if (fighting && b.alive) {
                for (const a of this.list) a.cd -= dt;
                this.gap -= dt;
                if (this.gap <= 0 && !this.busy) {
                    const ready = this.list.filter((a) => a.cd <= 0);
                    if (ready.length) {
                        ready.sort((x, y) => y.def.tier - x.def.tier);     // strongest ready attack first
                        this.start(ready[0]);
                    }
                }
            }
            // pending steps
            for (let i = this.tasks.length - 1; i >= 0; i--) {
                const tk = this.tasks[i];
                tk.t -= dt;
                if (tk.t <= 0) {
                    this.tasks.splice(i, 1);
                    if (b.alive && fighting) { this._tier = tk.tier; this.exec(tk.step); }
                }
            }
            this._updateMove(dt);
            this._updateProj(dt);
            this._updateHaz(dt);
            // pull / push applied to the player
            const P = BO.Player;
            if (this.pullV.lengthSq() > 0 && P.alive) {
                P.pos.x += this.pullV.x * dt; P.pos.z += this.pullV.z * dt;
                BO.World.resolveHorizontal(P.pos, 0.4, 1.8, true);
            }
            this.pullV.set(0, 0, 0);
        }

        start(a) {
            const d = a.def;
            a.cd = cooldownOf(d.tier) * (0.9 + Math.random() * 0.2);
            this.gap = 1.4;
            this.label = d.name.toUpperCase();
            this.labelT = 1.6;
            this.used[d.name] = (this.used[d.name] || 0) + 1;
            for (const st of d.steps) this.tasks.push({ t: st.at || 0, step: st, tier: d.tier });
            SFX.tone(220 - d.tier * 25, 110, 0.35, 'sawtooth', 0.08);
            BO.Sound.playZombieGroan && BO.Sound.playZombieGroan(this.boss.soundProfile, 0.9);
            this.boss.attackSwing = 1;
        }

        exec(st) {
            const fn = this['p_' + st.p];
            if (fn) fn.call(this, st);
        }

        /* ---------------- projectiles */
        shoot(origin, dir, st, extra) {
            const size = st.size || 0.35;
            const mesh = new THREE.Mesh(sphere(size), basic(st.color || 0xffffff));
            if (st.flat) mesh.scale.set(2.2, 0.35, 1);
            mesh.position.copy(origin);
            this.S.add(mesh);
            this.proj.push(Object.assign({ mesh, pos: origin.clone(), vel: dir.clone().multiplyScalar(st.speed || 15), size, dmg: this.dmg(st.n > 4 ? 0.45 : 0.75), grav: st.grav || 0, life: st.life || 5, color: st.color, splash: st.splash || 0, tier: this._tier }, extra || {}));
        }
        p_fan(st) {
            const o = this.eye();
            const tgt = this.playerC();
            if (st.grav) { const flat = Math.hypot(tgt.x - o.x, tgt.z - o.z); tgt.y += flat / (st.speed || 15) * st.grav * 0.5 * flat / (st.speed || 15) * 0.9; }
            const base = tgt.sub(o).normalize();
            const n = st.n || 1;
            for (let i = 0; i < n; i++) {
                const a = (i - (n - 1) / 2) * (st.spread || 0) + (st.offset || 0);
                this.shoot(o, base.clone().applyAxisAngle(V(0, 1, 0), a), st);
            }
        }
        p_ring(st) {
            const waves = st.waves || 1;
            for (let w = 0; w < waves; w++) {
                const fire = () => {
                    const o = this.eye(); o.y = this.boss.pos.y + 1.2;
                    for (let i = 0; i < st.n; i++) {
                        const a = i / st.n * Math.PI * 2 + (st.rot || 0) + w * 0.13;
                        this.shoot(o, V(Math.sin(a), 0, Math.cos(a)), st);
                    }
                };
                if (w === 0) fire(); else this.tasks.push({ t: w * (st.waveGap || 0.5), step: { p: '_fn', fn: fire }, tier: this._tier });
            }
        }
        p__fn(st) { st.fn(); }
        p_spiral(st) {
            const total = Math.round(st.dur * st.rate);
            for (let k = 0; k < total; k++) {
                this.tasks.push({ t: k / st.rate, tier: this._tier, step: { p: '_fn', fn: () => {
                    const o = this.eye(); o.y = this.boss.pos.y + 1.4;
                    for (let a = 0; a < st.arms; a++) {
                        const ang = k * 0.28 * (st.spin || 1) + a / st.arms * Math.PI * 2;
                        this.shoot(o, V(Math.sin(ang), 0, Math.cos(ang)), Object.assign({}, st, { size: 0.32, n: 6 }));
                    }
                } } });
            }
        }
        p_homing(st) {
            const o = this.eye();
            for (let i = 0; i < st.n; i++) {
                const a = (i - (st.n - 1) / 2) * 0.6;
                const dir = this.playerC().sub(o).normalize().applyAxisAngle(V(0, 1, 0), a);
                dir.y += 0.35;
                this.shoot(o, dir.normalize(), st, { homing: st.turn, life: st.life, dmg: this.dmg(st.n > 2 ? 0.45 : 0.8) });
            }
        }
        p_orbit(st) {
            for (let i = 0; i < st.n; i++) {
                const mesh = new THREE.Mesh(sphere(st.size), basic(st.color));
                this.S.add(mesh);
                this.haz.push({ kind: 'orbit', mesh, t: 0, dur: st.dur, a0: i / st.n * Math.PI * 2, st, dmg: this.dmg(0.6), hitCd: 0 });
            }
        }
        _updateProj(dt) {
            const P = BO.Player;
            const pc = this.playerC();
            for (let i = this.proj.length - 1; i >= 0; i--) {
                const p = this.proj[i];
                p.life -= dt;
                if (p.homing && P.alive) {
                    const want = pc.clone().sub(p.pos).normalize().multiplyScalar(p.vel.length());
                    p.vel.lerp(want, Math.min(1, p.homing * dt));
                }
                if (p.grav) p.vel.y -= p.grav * dt;
                const step = p.vel.clone().multiplyScalar(dt);
                const len = step.length();
                const wall = len > 0 ? BO.World.raycastWorld(p.pos, step.clone().divideScalar(len), len + p.size) : null;
                p.pos.add(step);
                p.mesh.position.copy(p.pos);
                const hit = P.alive && p.pos.distanceTo(pc) < p.size + 0.55;
                const ground = p.pos.y < 0.1;
                if (hit) this.hitPlayer(p.dmg, p.pos, false);
                if (hit || wall || ground || p.life <= 0 || Math.hypot(p.pos.x, p.pos.z) > this.arenaR + 2) {
                    if (p.splash && !hit) this._splash(p.pos, p.splash, p.dmg * 0.7, p.color);
                    BO.FX.spawnParticles(p.pos, 6, p.color || 0xffffff, 3, 5, 0.3, 1);
                    this.S.scene.remove(p.mesh);
                    this.proj.splice(i, 1);
                }
            }
        }
        _splash(pos, r, dmg, color) {
            BO.FX.spawnExplosion(pos.clone(), r, color || 0xffffff);
            const P = BO.Player;
            if (P.alive && Math.hypot(P.pos.x - pos.x, P.pos.z - pos.z) < r && P.pos.y < pos.y + r) this.hitPlayer(dmg, pos, true);
        }

        /* ---------------- ground hazards */
        decal(x, z, r, color, opacity) {
            const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.92, r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacity ?? 0.85, side: THREE.DoubleSide, depthWrite: false }));
            m.rotation.x = -Math.PI / 2;
            m.position.set(x, 0.06, z);
            const fill = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false }));
            fill.rotation.x = -Math.PI / 2;
            fill.position.set(x, 0.05, z);
            this.S.add(m); this.S.add(fill);
            return [m, fill];
        }
        clampIn(x, z, pad = 2) { const r = Math.hypot(x, z), R = this.arenaR - pad; return r > R ? [x / r * R, z / r * R] : [x, z]; }
        p_rain(st) {
            const P = BO.Player;
            for (let i = 0; i < st.n; i++) {
                const make = () => {
                    let x = P.pos.x, z = P.pos.z;
                    if (!st.follow) { x += (Math.random() - 0.5) * 2 * (st.scatter || 6); z += (Math.random() - 0.5) * 2 * (st.scatter || 6); if (i === 0) { x = P.pos.x; z = P.pos.z; } }
                    [x, z] = this.clampIn(x, z);
                    this.haz.push({ kind: 'rain', x, z, r: st.r, t: 0, delay: st.delay, color: st.color, meshes: this.decal(x, z, st.r, st.color), dmg: this.dmg(0.9) });
                };
                if (st.follow && i > 0) this.tasks.push({ t: i * (st.seq || 0.4), tier: this._tier, step: { p: '_fn', fn: make } });
                else make();
            }
        }
        p_mines(st) {
            const P = BO.Player;
            for (let i = 0; i < st.n; i++) {
                let x, z;
                if (st.ringR) { const a = i / st.n * Math.PI * 2; x = this.boss.pos.x + Math.sin(a) * st.ringR; z = this.boss.pos.z + Math.cos(a) * st.ringR; }
                else { const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 14; x = P.pos.x * 0.4 + Math.sin(a) * r; z = P.pos.z * 0.4 + Math.cos(a) * r; }
                [x, z] = this.clampIn(x, z);
                const mesh = new THREE.Mesh(sphere(0.35), basic(st.color));
                mesh.position.set(x, 0.35, z);
                this.S.add(mesh);
                this.haz.push({ kind: 'mine', x, z, r: st.r, t: 0, delay: st.delay + i * 0.08, color: st.color, mesh, meshes: this.decal(x, z, st.r, st.color, 0.4), dmg: this.dmg(0.8), pool: st.pool });
            }
        }
        p_pool(st) {
            const P = BO.Player, b = this.boss;
            const spots = [];
            for (let i = 0; i < st.n; i++) {
                let x, z;
                if (st.at0 === 'line') { const k = (i + 1) / (st.n + 1); x = b.pos.x + (P.pos.x - b.pos.x) * k * 1.3; z = b.pos.z + (P.pos.z - b.pos.z) * k * 1.3; }
                else if (st.at0 === 'boss') { x = b.pos.x; z = b.pos.z; }
                else if (st.at0 === 'ringBoss') { const a = i / st.n * Math.PI * 2; x = b.pos.x + Math.sin(a) * 9; z = b.pos.z + Math.cos(a) * 9; }
                else if (st.at0 === 'scatter') { x = (Math.random() - 0.5) * 2 * st.scatter; z = (Math.random() - 0.5) * 2 * st.scatter; }
                else { x = P.pos.x + (i ? (Math.random() - 0.5) * 2 * (st.scatter || 3) : 0); z = P.pos.z + (i ? (Math.random() - 0.5) * 2 * (st.scatter || 3) : 0); }
                [x, z] = this.clampIn(x, z);
                spots.push([x, z]);
            }
            for (const [x, z] of spots) this.haz.push({ kind: 'pool', x, z, r: st.r, t: 0, dur: st.dur, follow: st.at0 === 'follow', color: st.color, meshes: this.decal(x, z, st.r, st.color, 0.6), dps: this.boss.damage * st.dps * TIER_DMG[this._tier] * 1.6 });
        }
        p_shock(st) {
            for (let w = 0; w < (st.waves || 1); w++) {
                this.tasks.push({ t: w * (st.gap || 0.6), tier: this._tier, step: { p: '_fn', fn: () => {
                    const b = this.boss;
                    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.18, 6, 48), basic(st.color));
                    m.rotation.x = Math.PI / 2;
                    m.position.set(b.pos.x, 0.25, b.pos.z);
                    this.S.add(m);
                    this.haz.push({ kind: 'shock', x: b.pos.x, z: b.pos.z, r: b.radius, speed: st.speed, width: st.width || 1.4, mesh: m, hit: false, dmg: this.dmg(0.7) });
                    BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.05);
                    SFX.rumble(0.3);
                } } });
            }
        }
        p_nova(st) {
            const b = this.boss;
            this.haz.push({ kind: 'nova', x: b.pos.x, z: b.pos.z, r: st.r, t: 0, delay: st.delay, los: st.los, color: st.color, meshes: this.decal(b.pos.x, b.pos.z, st.r, st.color, 0.9), dmg: this.dmg(1.1) });
        }
        p_pull(st) { this.haz.push({ kind: 'pull', t: 0, dur: st.dur, force: st.force, color: st.color }); }
        p_wall(st) {
            const P = BO.Player, b = this.boss;
            const dir = V(P.pos.x - b.pos.x, 0, P.pos.z - b.pos.z).normalize();
            const side = V(-dir.z, 0, dir.x);
            const gapAt = (Math.random() - 0.5) * 16;
            const meshes = [];
            for (let s = -this.arenaR; s <= this.arenaR; s += 1.6) {
                if (Math.abs(s - gapAt) < st.gapW / 2) continue;
                const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 1.0), basic(st.color));
                meshes.push({ m, s });
                this.S.add(m);
            }
            this.haz.push({ kind: 'wall', origin: V(-dir.x * this.arenaR, 0, -dir.z * this.arenaR), dir, side, d: 0, speed: st.speed, gapAt, gapW: st.gapW, meshes, hit: false, dmg: this.dmg(0.9) });
        }
        p_beam(st) {
            const b = this.boss, P = BO.Player;
            const base = Math.atan2(P.pos.x - b.pos.x, P.pos.z - b.pos.z);
            const n = st.count || 1;
            for (let i = 0; i < n; i++) {
                const ang = st.opposite ? base + i * Math.PI : base + (i - (n - 1) / 2) * (st.fanAng || 0);
                const len = st.len || this.arenaR * 2;
                const m = new THREE.Mesh(new THREE.BoxGeometry(st.width, 0.15, len), new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.25, depthWrite: false }));
                m.geometry.translate(0, 0, len / 2);
                m.position.set(b.pos.x, 0.12, b.pos.z);
                m.rotation.y = ang;
                this.S.add(m);
                this.haz.push({ kind: 'beam', mesh: m, ang, len, width: st.width, t: 0, delay: st.delay, dur: st.dur, sweep: (st.sweep || 0) * (i % 2 ? -1 : 1) * (Math.random() < 0.5 ? 1 : -1), color: st.color, dps: this.dmg(1.0) * 2.2, hitCd: 0 });
            }
        }
        p_summon(st) {
            const D = this.S.data;
            const spec = (BO.ZombiesData.ZOMBIE_TYPES || []).find((z) => z.id === st.type) || BO.ZombiesData.ZOMBIE_TYPES[0];
            const alive = (D.zombies || []).filter((z) => z.alive && z.mgMinion).length;
            for (let i = 0; i < Math.min(st.n, 8 - alive); i++) {
                const a = Math.random() * Math.PI * 2;
                const [x, z] = this.clampIn(this.boss.pos.x + Math.sin(a) * (this.boss.radius + 2.5), this.boss.pos.z + Math.cos(a) * (this.boss.radius + 2.5));
                const ent = new BO.ZombieEntity({ id: D.nextId++, spec, round: 12, hp: Math.round(spec.hp * 1.2), speed: spec.speed, damage: Math.round(spec.attack * 0.5), x, y: 0, z, splitCount: 0, hasGun: false });
                ent.mgMinion = true;
                D.zombies.push(ent);
                BO.FX.spawnParticles(V(x, 1, z), 14, 0x111827, 4, 3, 0.5, 1.2);
            }
        }

        /* ---------------- scripted movement */
        p_charge(st) {
            const b = this.boss, P = BO.Player;
            const dir = V(P.pos.x - b.pos.x, 0, P.pos.z - b.pos.z).normalize();
            if (st.zig) dir.applyAxisAngle(V(0, 1, 0), (Math.random() - 0.5) * 0.7);
            this.move = { kind: 'charge', dir, speed: st.speed, t: 0, dur: st.dur, hit: false, dmg: this.dmg(1.0) };
            SFX.whoosh(0.3);
        }
        p_leap(st) {
            const b = this.boss, P = BO.Player;
            const [tx, tz] = this.clampIn(P.pos.x, P.pos.z, b.radius + 1);
            this.move = { kind: 'leap', from: b.pos.clone(), to: V(tx, 0, tz), t: 0, dur: st.hang || 0.9, r: st.r, color: st.color, dmg: this.dmg(1.0), meshes: this.decal(tx, tz, st.r, st.color || 0xffffff) };
        }
        _updateMove(dt) {
            const mv = this.move, b = this.boss;
            b.mgScripted = !!mv && b.alive;
            if (!mv) return;
            if (!b.alive) { this._endMove(); return; }
            mv.t += dt;
            const P = BO.Player;
            if (mv.kind === 'charge') {
                b.pos.addScaledVector(mv.dir, mv.speed * dt);
                const r = Math.hypot(b.pos.x, b.pos.z), R = this.arenaR - b.radius - 0.5;
                if (r > R) { b.pos.x *= R / r; b.pos.z *= R / r; mv.t = mv.dur; }
                b.yaw = Math.atan2(mv.dir.x, mv.dir.z);
                if (!mv.hit && P.alive && Math.hypot(P.pos.x - b.pos.x, P.pos.z - b.pos.z) < b.radius + 0.9) {
                    mv.hit = true;
                    this.hitPlayer(mv.dmg, b.pos, false);
                    P.vel && P.vel.addScaledVector(mv.dir, 9);
                }
                if (Math.random() < 0.5) BO.FX.spawnParticles(b.pos.clone().add(V(0, 0.4, 0)), 2, 0xa8a29e, 3, 4, 0.3, 1.2);
            } else {
                const k = Math.min(1, mv.t / mv.dur);
                b.pos.lerpVectors(mv.from, mv.to, k);
                b.pos.y = Math.sin(k * Math.PI) * Math.max(6, b.height * 0.8);
                if (k >= 1) {
                    b.pos.y = 0;
                    BO.FX.spawnExplosion(mv.to.clone(), mv.r * 0.7, mv.color || 0xd6d3d1);
                    P.cameraShake = Math.max(P.cameraShake, 0.1);
                    SFX.rumble(0.5);
                    if (P.alive && Math.hypot(P.pos.x - mv.to.x, P.pos.z - mv.to.z) < mv.r && P.pos.y < 2.2) this.hitPlayer(mv.dmg, mv.to, true);
                    mv.t = mv.dur + 1;
                }
            }
            b.parts.root.position.copy(b.pos);
            b.parts.root.rotation.y = b.yaw;
            if (mv.t >= mv.dur) this._endMove();
        }
        _endMove() {
            const mv = this.move;
            if (mv && mv.meshes) for (const m of mv.meshes) this.S.scene.remove(m);
            this.boss.pos.y = 0;
            this.move = null;
            this.boss.mgScripted = false;
        }

        _updateHaz(dt) {
            const P = BO.Player;
            const b = this.boss;
            for (let i = this.haz.length - 1; i >= 0; i--) {
                const h = this.haz[i];
                h.t = (h.t || 0) + dt;
                let done = false;
                const pd = (x, z) => Math.hypot(P.pos.x - x, P.pos.z - z);
                if (h.kind === 'rain' || h.kind === 'mine') {
                    const k = Math.min(1, h.t / h.delay);
                    h.meshes[1].material.opacity = 0.12 + k * 0.4;
                    if (h.mesh) h.mesh.scale.setScalar(1 + Math.sin(h.t * (6 + k * 20)) * 0.15);
                    if (h.t >= h.delay) {
                        BO.FX.spawnExplosion(V(h.x, 0.3, h.z), h.r * 0.8, h.color);
                        if (P.alive && pd(h.x, h.z) < h.r && P.pos.y < 3) this.hitPlayer(h.dmg, V(h.x, 0, h.z), true);
                        if (h.pool) this.haz.push({ kind: 'pool', x: h.x, z: h.z, r: h.r * 0.8, t: 0, dur: 4, color: h.color, meshes: this.decal(h.x, h.z, h.r * 0.8, h.color, 0.6), dps: h.dmg * 0.5 });
                        done = true;
                    }
                } else if (h.kind === 'pool') {
                    if (h.follow) { h.x += (P.pos.x - h.x) * Math.min(1, dt * 0.6); h.z += (P.pos.z - h.z) * Math.min(1, dt * 0.6); for (const m of h.meshes) m.position.set(h.x, m.position.y, h.z); }
                    if (P.alive && pd(h.x, h.z) < h.r && P.pos.y < 1.2) { h.acc = (h.acc || 0) + h.dps * dt; if (h.acc >= 4) { this.hitPlayer(h.acc, V(h.x, 0, h.z), false); h.acc = 0; } }
                    if (h.t > h.dur - 0.6) for (const m of h.meshes) m.material.opacity *= 0.9;
                    done = h.t >= h.dur;
                } else if (h.kind === 'shock') {
                    h.r += h.speed * dt;
                    h.mesh.scale.setScalar(h.r);
                    const d = pd(h.x, h.z);
                    if (!h.hit && P.alive && Math.abs(d - h.r) < h.width && P.pos.y < 0.9) { h.hit = true; this.hitPlayer(h.dmg, V(h.x, 0, h.z), false); }
                    done = h.r > this.arenaR + 2;
                } else if (h.kind === 'nova') {
                    const k = Math.min(1, h.t / h.delay);
                    h.meshes[1].material.opacity = 0.1 + k * 0.45;
                    h.meshes[1].scale.setScalar(Math.max(0.01, k));
                    if (h.t >= h.delay) {
                        BO.FX.spawnExplosion(V(h.x, 1, h.z), Math.min(10, h.r * 0.6), h.color);
                        P.cameraShake = Math.max(P.cameraShake, 0.12);
                        // los novas can be blocked by hiding behind a pillar
                        const safe = h.los && !BO.World.hasLineOfSight(h.x, 1.5, h.z, P.pos.x, P.pos.y + 1.2, P.pos.z);
                        if (P.alive && pd(h.x, h.z) < h.r && !safe) this.hitPlayer(h.dmg, V(h.x, 0, h.z), true);
                        done = true;
                    }
                } else if (h.kind === 'pull') {
                    const dx = b.pos.x - P.pos.x, dz = b.pos.z - P.pos.z, d = Math.max(0.1, Math.hypot(dx, dz));
                    if (d > b.radius + 1.2 || h.force < 0) this.pullV.set(dx / d * h.force, 0, dz / d * h.force);
                    if (Math.random() < 0.6) BO.FX.spawnParticles(P.pos.clone().add(V(0, 1, 0)), 1, h.color, 2, 0, 0.4, 1);
                    done = h.t >= h.dur;
                } else if (h.kind === 'wall') {
                    h.d += h.speed * dt;
                    const c = h.origin.clone().addScaledVector(h.dir, h.d);
                    for (const q of h.meshes) q.m.position.set(c.x + h.side.x * q.s, 1.1, c.z + h.side.z * q.s);
                    const rel = V(P.pos.x - c.x, 0, P.pos.z - c.z);
                    const along = rel.dot(h.dir), across = rel.dot(h.side);
                    if (!h.hit && P.alive && Math.abs(along) < 0.9 && Math.abs(across - h.gapAt) > h.gapW / 2 && P.pos.y < 2.2) { h.hit = true; this.hitPlayer(h.dmg, c, false); }
                    if (h.d > this.arenaR * 2) { for (const q of h.meshes) this.S.scene.remove(q.m); h.meshes = []; done = true; }
                } else if (h.kind === 'beam') {
                    h.mesh.position.set(b.pos.x, 0.12, b.pos.z);
                    const live = h.t >= h.delay;
                    if (live) { h.ang += h.sweep * dt; h.mesh.rotation.y = h.ang; h.mesh.scale.set(1, live ? 14 : 1, 1); h.mesh.material.opacity = 0.75; }
                    h.hitCd -= dt;
                    if (live && P.alive && h.hitCd <= 0) {
                        const rel = V(P.pos.x - b.pos.x, 0, P.pos.z - b.pos.z);
                        const fwd = V(Math.sin(h.ang), 0, Math.cos(h.ang));
                        const along = rel.dot(fwd), across = Math.abs(rel.x * fwd.z - rel.z * fwd.x);
                        if (along > 0 && along < h.len && across < h.width / 2 + 0.4) { this.hitPlayer(h.dps * 0.25, b.pos, false); h.hitCd = 0.25; }
                    }
                    done = h.t >= h.delay + h.dur;
                } else if (h.kind === 'orbit') {
                    const k = Math.min(1, h.t / h.dur);
                    const r = h.st.r0 + (h.st.r1 - h.st.r0) * k;
                    const a = h.a0 + h.t * 2.4;
                    h.mesh.position.set(b.pos.x + Math.sin(a) * r, 1.3, b.pos.z + Math.cos(a) * r);
                    h.hitCd -= dt;
                    if (P.alive && h.hitCd <= 0 && h.mesh.position.distanceTo(this.playerC()) < h.st.size + 0.6) { this.hitPlayer(h.dmg, h.mesh.position, false); h.hitCd = 0.8; }
                    done = h.t >= h.dur;
                }
                if (done) this._killHaz(i);
            }
        }
        _killHaz(i) {
            const h = this.haz[i];
            for (const m of h.meshes || []) this.S.scene.remove(m.m || m);
            if (h.mesh) this.S.scene.remove(h.mesh);
            this.haz.splice(i, 1);
        }

        dispose() {
            for (const p of this.proj) this.S.scene.remove(p.mesh);
            this.proj = [];
            while (this.haz.length) this._killHaz(this.haz.length - 1);
            this.tasks = [];
            if (this.move) this._endMove();
        }
    }

    BO.BossAttacks = { ATTACKS, Runner, cooldownOf, TIER_DMG };
})(window);
