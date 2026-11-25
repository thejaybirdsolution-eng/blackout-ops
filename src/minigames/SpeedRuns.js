/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Speed Runs (part 1) + shared kit
     1. Gauntlet Sprint — run the course and defeat every enemy
     2. Outpost Rescue  — reach each outpost, wipe out its horde before it falls
     4. The Splitter    — one zombie, splits into two exact copies, 30 splits
     6. Last 50         — one handgun, 50 bullets, 50 zombies, headshots only
   Speed runs are timed: the clock counts up and your record is your fastest
   completed time (stars = par times). Failing gives a DNF with progress %.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const { B, SFX, std, basic, TAU, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    const fmtT = (sec) => {
        const m = Math.floor(sec / 60), s = sec - m * 60;
        return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
    };

    /* -------------------------------------------------------------- kit */
    const SR = BO.SpeedRunKit = {
        fmtT,
        /** Wraps a speed-run definition with the shared timing / record rules. */
        define(o) {
            const def = Object.assign({
                cat: 'speed', duration: 0, countdown: 3, lockWeapon: true, infiniteMag: true, forgivingMisses: true,
                matchRules: { noHealthRegen: false }, noArmor: false,
                starLabel: (th) => '≤ ' + fmtT(th),
                formatBest(b) { const e = b.extra || {}; return e.done ? fmtT(e.time) : 'DNF • ' + Math.round((e.progress || 0) * 100) + '%'; },
                betterThan(res, prev) {
                    if (!prev) return true;
                    const a = res.saveExtra, b = prev.extra || {};
                    if (a.done && !b.done) return true;
                    if (!a.done) return !b.done && a.progress > (b.progress || 0);
                    return a.time < b.time;
                }
            }, o);
            const userBuild = o.build, userUpdate = o.update, userResult = o.stats, userDispose = o.dispose;
            def.build = function (S, lib) {
                S.data.sr = { done: false, time: 0, why: '', progress: 0 };
                S.data.zs = [];
                S.data.zid = 1;
                if (userBuild) userBuild.call(this, S, lib);
            };
            def.update = function (S, dt, lib, state) {
                const sr = S.data.sr;
                if (state === 'running' && !sr.done && !sr.why) {
                    if (!BO.Player.alive) SR.fail(S, 'YOU DIED');
                    else if (o.timeLimit && S.t > o.timeLimit) SR.fail(S, 'TIME LIMIT');
                }
                if (userUpdate) userUpdate.call(this, S, dt, lib, state);
                sr.progress = Math.max(sr.progress, Math.min(1, o.progress ? o.progress(S) : 0));
            };
            def.result = function (S) {
                const sr = S.data.sr;
                const t = sr.done ? sr.time : 0;
                const stars = sr.done ? this.stars.filter((th) => t <= th).length : 0;
                return {
                    score: sr.done ? Math.round(t * 100) : 0, stars,
                    title: sr.done ? (stars >= 4 ? 'RECORD PACE' : stars === 3 ? 'GOLD TIME' : stars === 2 ? 'SILVER TIME' : stars === 1 ? 'BRONZE TIME' : 'FINISHED') : 'DNF — ' + (sr.why || 'FAILED'),
                    scoreLabel: sr.done ? 'TIME' : 'DID NOT FINISH',
                    formatScore: (v) => (sr.done ? fmtT(v / 100) : Math.round(sr.progress * 100) + '%'),
                    stats: [['RESULT', sr.done ? 'COMPLETE' : sr.why || 'FAILED'], ['PROGRESS', Math.round(sr.progress * 100) + '%']].concat(userResult ? userResult(S) : []),
                    noGraph: true,
                    saveExtra: { done: sr.done, time: Math.round(t * 100) / 100, progress: Math.round(sr.progress * 100) / 100 },
                    xp: Math.round(150 + sr.progress * 250 + stars * 150)
                };
            };
            def.dispose = function (S, lib) {
                if (userDispose) userDispose.call(this, S, lib);
                for (const z of S.data.zs || []) z.destroy();
                S.data.zs = [];
            };
            if (!def.extraTargets) def.extraTargets = (S, pool) => { for (const z of S.data.zs) if (z.alive) for (const m of z.getHitboxMeshes()) pool.push(m); };
            MG.register(def);
            return def;
        },
        done(S, label) {
            const sr = S.data.sr;
            if (sr.done || sr.why) return;
            sr.done = true; sr.time = S.t; sr.progress = 1;
            SFX.fanfare();
            MG.finish(label || 'FINISHED!', { color: '#67e8f9', delay: 2.2 });
        },
        fail(S, why) {
            const sr = S.data.sr;
            if (sr.done || sr.why) return;
            sr.why = why;
            SFX.buzzer();
            MG.finish(why, { color: '#f87171', delay: 2.4 });
        },
        spawnZ(S, specId, x, z, o = {}) {
            const spec = BO.ZombiesData.get(specId);
            const ent = new BO.ZombieEntity({
                id: S.data.zid++, spec, round: o.round || 8, hp: o.hp || spec.hp, speed: o.speed || spec.speed,
                damage: o.damage || Math.round(spec.attack * 0.7), x, y: o.y || 0, z, splitCount: 0, hasGun: false, sizeMult: o.size
            });
            ent.srTag = o.tag;
            S.data.zs.push(ent);
            return ent;
        },
        /** Updates every zombie. cb may add getTarget / onAttackCustomTarget; hold = frozen until woken. */
        updateZ(S, dt, cb, frozen) {
            const P = BO.Player;
            const callbacks = Object.assign({ allowProjectiles: false, onMeleePlayer: (z) => { if (P.alive) P.takeDamage(z.damage, z.pos, false, z); } }, cb || {});
            const zs = S.data.zs;
            for (let i = zs.length - 1; i >= 0; i--) {
                const z = zs[i];
                if (z.alive && (frozen || z.srHold)) { z.stunTimer = Math.max(z.stunTimer, 0.05); }
                const keep = z.update(dt, zs, callbacks);
                if (!keep) { z.destroy(); zs.splice(i, 1); }
            }
        },
        /** Standard bullet damage on a speed-run zombie. Returns true when it died. */
        hitZ(S, z, info, onDeath) {
            if (!z || !z.alive || !z.takeDamage) return false;
            if (z.srHold) z.srHold = false;
            const killed = z.takeDamage(info.dmg, info.hitbox, info.hitbox === 'head', null, 'bullet');
            S.hits++;
            if (info.hitbox === 'head') S.headshots++;
            if (killed) { S.kills++; S.bumpCombo(); if (onDeath) onDeath(z); }
            return killed;
        },
        alive: (S, tag) => S.data.zs.filter((z) => z.alive && (tag === undefined || z.srTag === tag)).length,
        chip: (label, val, bad) => `<div class="sr-chip ${bad ? 'bad' : ''}">${esc(label)}<b>${val}</b></div>`,
        panel: (html) => `<div class="sr-panel">${html}</div>`,
        wall(S, x1, z1, x2, z2, h = 3, mat) {
            const w = Math.abs(x2 - x1) || 0.6, d = Math.abs(z2 - z1) || 0.6;
            return S.box((x1 + x2) / 2, h / 2, (z1 + z2) / 2, w, h, d, mat || std(0x57534e, 0.9), { solid: true });
        }
    };

    /* =====================================================================
       1. GAUNTLET SPRINT
    ===================================================================== */
    const GAUNTLET = [
        { z: -22, foes: [['shambler', -4, 0], ['shambler', 4, -2], ['shambler', 0, -5]] },
        { z: -44, foes: [['sprinter', -6, 0], ['sprinter', 6, 0], ['shambler', 0, -3], ['hopper', 2, -6]] },
        { z: -68, foes: [['one_arm_ripper', -3, 0], ['one_arm_ripper', 3, 0], ['sprinter', -7, -5], ['sprinter', 7, -5], ['shambler', 0, -7]] },
        { z: -92, foes: [['hopper', -5, 0], ['hopper', 5, 0], ['headless_charger', 0, -4], ['sprinter', -2, -8], ['sprinter', 2, -8]] },
        { z: -116, foes: [['bloater', 0, 0], ['shambler', -6, -3], ['shambler', 6, -3], ['one_arm_ripper', -3, -7], ['one_arm_ripper', 3, -7]] },
        { z: -142, foes: [['club_goliath', 0, -4], ['sprinter', -6, 0], ['sprinter', 6, 0], ['hopper', -4, -9], ['hopper', 4, -9], ['headless_charger', 0, 2]] }
    ];
    SR.define({
        id: 'sr_gauntlet', order: 1, name: 'Gauntlet Sprint', icon: '🏃', accent: '#22d3ee',
        tagline: 'Run the course. Drop everything on it.',
        desc: 'A 150-metre walled course split into six kill zones. Each group wakes up when you get close. Defeat all 28 enemies as fast as you can. Health regenerates, but they hit hard, so keep moving.',
        heroLabel: 'SPEED RUN • COURSE CLEAR', stars: [150, 110, 80, 60], timeLimit: 420,
        standardWeapon: 'm4a1', weaponLabel: 'M4A1', weaponNote: 'Bottomless magazine',
        keys: [['WASD', 'Run'], ['LMB', 'Shoot'], ['SHIFT', 'Sprint']],
        map: {
            atmosphere: { skyTop: 0x1e3a8a, skyBottom: 0xfcd34d, fogColor: 0xd6b88a, fogDensity: 0.007, sunColor: 0xfff1c1, sunIntensity: 1.6, sunPos: [30, 50, -40], hemiSky: 0xfde68a, hemiGround: 0x44403c, hemiIntensity: 0.8 },
            boxes: [B(0, -0.5, -75, 60, 1, 190, 'desert_sand')],
            spawn: { x: 0, y: 0, z: 2, yaw: 0 }
        },
        build(S) {
            const stone = std(0x78716c, 0.9);
            SR.wall(S, -12.5, 6, -12, -160, 4, stone);
            SR.wall(S, 12, 6, 12.5, -160, 4, stone);
            SR.wall(S, -12, -160, 12, -160.5, 4, stone);
            SR.wall(S, -12, 6, 12, 6.5, 4, stone);
            const crate = std(0x92400e, 0.8);
            for (const [x, z, w, d] of [[-5, -14, 3, 1.2], [5, -34, 3, 1.2], [0, -56, 5, 1], [-6, -80, 1.2, 4], [6, -80, 1.2, 4], [0, -104, 6, 1], [-5, -128, 2, 2], [5, -132, 2, 2]]) S.box(x, 0.6, z, w, 1.2, d, crate, { solid: true });
            for (let i = 0; i < GAUNTLET.length; i++) {
                const g = GAUNTLET[i];
                const sign = A.sign('ZONE ' + (i + 1), 2.6, 0.6, { bg: '#0c4a6e', color: '#e0f2fe', borderColor: '#22d3ee', size: 0.5 });
                sign.position.set(-11.8, 2.6, g.z + 8); sign.rotation.y = Math.PI / 2;
                S.add(sign);
                for (const [id, x, dz] of g.foes) { const z = SR.spawnZ(S, id, x, g.z + dz, { tag: i }); z.srHold = true; }
            }
            const fin = A.sign('FINISH', 5, 1, { bg: '#14532d', color: '#fde68a', borderColor: '#facc15', size: 0.6 });
            fin.position.set(0, 3.2, -159.6); S.add(fin);
            S.data.total = S.data.zs.length;
            S.data.zone = 0;
        },
        progress: (S) => 1 - SR.alive(S) / S.data.total,
        update(S, dt, lib, state) {
            const P = BO.Player;
            for (const z of S.data.zs) if (z.srHold && Math.abs(z.pos.z - P.pos.z) < 26) { z.srHold = false; z.stunTimer = 0.4; }
            SR.updateZ(S, dt, null, state !== 'running');
            if (state === 'running' && SR.alive(S) === 0) SR.done(S, 'COURSE CLEAR');
        },
        onHit(S, ent, info) { return SR.hitZ(S, ent, info); },
        scoreText(S) { return (S.data.total - SR.alive(S)) + ' / ' + S.data.total; },
        hud(S) {
            let next = -1;
            for (let i = 0; i < GAUNTLET.length; i++) if (SR.alive(S, i) > 0) { next = i; break; }
            return SR.panel(SR.chip('ENEMIES LEFT', SR.alive(S)) + (next >= 0 ? SR.chip('ZONE', (next + 1) + ' / 6') : ''));
        },
        stats: (S) => [['ENEMIES', (S.data.total - SR.alive(S)) + ' / ' + S.data.total], ['HEADSHOTS', S.headshots], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']]
    });

    /* =====================================================================
       2. OUTPOST RESCUE
    ===================================================================== */
    const OUTPOSTS = [
        { name: 'ALPHA', x: 0, z: -55, horde: 10, types: ['shambler', 'sprinter'] },
        { name: 'BRAVO', x: 52, z: 28, horde: 14, types: ['shambler', 'hopper', 'one_arm_ripper'] },
        { name: 'CHARLIE', x: -52, z: 28, horde: 18, types: ['sprinter', 'one_arm_ripper', 'headless_charger', 'shambler'] }
    ];
    SR.define({
        id: 'sr_outposts', order: 2, name: 'Outpost Rescue', icon: '🛡️', accent: '#16a34a',
        tagline: 'Three outposts. Three hordes. Save them all.',
        desc: 'Three outposts stand on an open plain. Walking up to an outpost sounds its alarm and a horde charges in to tear it down. Kill every attacker before its health hits zero. Save all three outposts to finish. You choose the route; starting two hordes at once is allowed, and very risky.',
        heroLabel: 'SPEED RUN • DEFEND', stars: [240, 175, 130, 100], timeLimit: 480,
        standardWeapon: 'm249', weaponLabel: 'M249 SAW', weaponNote: 'Bottomless belt',
        keys: [['WASD', 'Move'], ['LMB', 'Shoot'], ['SHIFT', 'Sprint']],
        map: {
            atmosphere: { skyTop: 0x0c4a6e, skyBottom: 0xbbf7d0, fogColor: 0xa7c4a0, fogDensity: 0.006, sunColor: 0xfff7d6, sunIntensity: 1.5, sunPos: [-40, 60, 20], hemiSky: 0xd9f99d, hemiGround: 0x365314, hemiIntensity: 0.85 },
            boxes: [B(0, -0.5, 0, 180, 1, 180, 'grass')],
            spawn: { x: 0, y: 0, z: 25, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 180, 0x4d7c0f, 0.002);
            const sand = std(0xc2a26b, 0.95), wood = std(0x78350f, 0.85);
            S.data.posts = OUTPOSTS.map((o) => {
                const g = new THREE.Group();
                for (let i = 0; i < 10; i++) {
                    const a = i / 10 * TAU;
                    if (i === 7) continue;                       // gap facing the player route
                    const bag = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 0.9), sand);
                    bag.position.set(Math.cos(a) * 4.5, 0.5, Math.sin(a) * 4.5); bag.rotation.y = -a + Math.PI / 2;
                    g.add(bag);
                }
                const tower = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 2), wood); tower.position.y = 2.5; g.add(tower);
                const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })); flag.position.set(0.7, 5.8, 0); g.add(flag);
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 6), std(0xd4d4d8, 0.4, 0.7)); pole.position.y = 5.5; g.add(pole);
                const sign = A.sign('OUTPOST ' + o.name, 3, 0.6, { bg: '#14532d', color: '#f0fdf4', borderColor: '#22c55e', size: 0.45 }); sign.position.set(0, 3.4, 1.05); g.add(sign);
                g.position.set(o.x, 0, o.z);
                S.add(g);
                S.collider(o.x - 1, 0, o.z - 1, o.x + 1, 5, o.z + 1);
                return Object.assign({}, o, { g, flag, hp: 100, state: 'idle' });
            });
        },
        progress: (S) => S.data.posts.reduce((a, p) => a + (p.state === 'saved' ? 1 : p.state === 'attack' ? 0.3 : 0), 0) / 3,
        update(S, dt, lib, state) {
            const P = BO.Player, D = S.data;
            if (state === 'running') {
                for (const p of D.posts) {
                    if (p.state === 'idle' && Math.hypot(P.pos.x - p.x, P.pos.z - p.z) < 9) {
                        p.state = 'attack';
                        MG.toast('OUTPOST ' + p.name + ' UNDER ATTACK!', '#fca5a5');
                        BO.Sound.playBossIntro && BO.Sound.playBossIntro();
                        for (let i = 0; i < p.horde; i++) {
                            const a = i / p.horde * TAU + Math.random() * 0.3, r = 32 + Math.random() * 12;
                            const z = SR.spawnZ(S, p.types[i % p.types.length], p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, { tag: p.name });
                            z.srPost = p;
                        }
                    } else if (p.state === 'attack' && SR.alive(S, p.name) === 0) {
                        p.state = 'saved';
                        p.flag.material.color.setHex(0x38bdf8);
                        MG.toast('OUTPOST ' + p.name + ' SAVED', '#86efac');
                        SFX.ding(1.1);
                        S.award(1000, V(p.x, 6, p.z), 'SAVED', '#86efac');
                    }
                }
                if (D.posts.every((p) => p.state === 'saved')) SR.done(S, 'ALL OUTPOSTS SAVED');
            }
            SR.updateZ(S, dt, {
                getTarget: (z) => {
                    const p = z.srPost;
                    if (!p || p.state !== 'attack' || Math.hypot(P.pos.x - z.pos.x, P.pos.z - z.pos.z) < 4) return null;
                    return { x: p.x, y: 0, z: p.z, attackRange: 5.6 };
                },
                onAttackCustomTarget: (z) => {
                    const p = z.srPost;
                    if (!p || p.state !== 'attack') return;
                    p.hp = Math.max(0, p.hp - 0.55);          // ~0.45 hp/s per attacker: a full horde levels it in ~12 s
                    if (p.hp <= 0) SR.fail(S, 'OUTPOST ' + p.name + ' DESTROYED');
                }
            }, state !== 'running');
        },
        onHit(S, ent, info) { return SR.hitZ(S, ent, info); },
        scoreText(S) { return S.data.posts.filter((p) => p.state === 'saved').length + ' / 3'; },
        hud(S) {
            return SR.panel(S.data.posts.map((p) => `<div class="sr-chip ${p.state === 'attack' && p.hp < 40 ? 'bad' : ''}">${p.name} ${p.state === 'saved' ? '<b>SAVED</b>' : p.state === 'idle' ? '<b>WAITING</b>' : `<span class="sr-bar"><i style="width:${p.hp}%;background:${p.hp > 50 ? '#22c55e' : p.hp > 25 ? '#f59e0b' : '#ef4444'}"></i></span><b>${SR.alive(S, p.name)} LEFT</b>`}</div>`).join(''));
        },
        stats: (S) => [['OUTPOSTS SAVED', S.data.posts.filter((p) => p.state === 'saved').length + ' / 3'], ['KILLS', S.kills], ['WEAKEST OUTPOST', Math.round(Math.min(...S.data.posts.map((p) => p.hp))) + '%']]
    });

    /* =====================================================================
       4. THE SPLITTER
    ===================================================================== */
    const SPLITS = 30, SPLIT_HP = 230;
    SR.define({
        id: 'sr_splitter', order: 4, name: 'The Splitter', icon: '🧫', accent: '#14b8a6',
        tagline: 'Kill one, get two. Thirty times.',
        desc: 'One mutant in an empty arena. Every time one dies it splits into two exact copies of the original: same size, same health, same speed. After 30 splits the mutation burns out and the copies stop dividing. Kill all 61 of them.',
        heroLabel: 'SPEED RUN • EXTERMINATE', stars: [210, 160, 125, 100], timeLimit: 480,
        standardWeapon: 'm4a1', weaponLabel: 'M4A1', weaponNote: 'Bottomless magazine',
        keys: [['WASD', 'Move'], ['LMB', 'Shoot (headshots split them faster)']],
        map: {
            atmosphere: { skyTop: 0x042f2e, skyBottom: 0x134e4a, fogColor: 0x0f2f2c, fogDensity: 0.012, sunColor: 0x99f6e4, sunIntensity: 0.9, sunPos: [10, 50, 10], hemiSky: 0x5eead4, hemiGround: 0x042f2e, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, 0, 80, 1, 80, 'concrete')],
            spawn: { x: 0, y: 0, z: 18, yaw: 0 }
        },
        build(S) {
            const R = 26;
            const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.5, R + 0.5, 5, 48, 1, true), std(0x115e59, 0.8, 0.2, { side: THREE.BackSide }));
            wall.position.y = 2.5; S.add(wall); S.solid(wall);
            for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; S.collider(Math.cos(a) * (R + 2) - 2, 0, Math.sin(a) * (R + 2) - 2, Math.cos(a) * (R + 2) + 2, 6, Math.sin(a) * (R + 2) + 2); }
            const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.5, 48), std(0x134e4a, 0.9)); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; S.add(floor);
            S.data.splits = 0;
            S.data.killed = 0;
            this._spawn(S, 0, -12);
        },
        _spawn(S, x, z) {
            const e = SR.spawnZ(S, 'mitosis_ghoul', x, z, { hp: SPLIT_HP, speed: 2.9, damage: 18 });
            e.stunTimer = 0.5;
            return e;
        },
        progress: (S) => S.data.killed / (1 + SPLITS * 2),
        update(S, dt, lib, state) {
            SR.updateZ(S, dt, null, state !== 'running');
            if (state === 'running' && S.data.killed >= 1 + SPLITS * 2 && SR.alive(S) === 0) SR.done(S, 'MUTATION ERADICATED');
        },
        onHit(S, ent, info) {
            return SR.hitZ(S, ent, info, (z) => {
                const D = S.data;
                D.killed++;
                if (D.splits < SPLITS) {
                    D.splits++;
                    for (const s of [-1, 1]) {
                        const a = z.yaw + Math.PI / 2;
                        const px = BO.Math.clamp(z.pos.x + Math.cos(a) * s * 1.2, -24, 24), pz = BO.Math.clamp(z.pos.z + Math.sin(a) * s * 1.2, -24, 24);
                        this._spawn(S, px, pz);
                    }
                    BO.FX.spawnParticles(z.pos.clone().add(V(0, 1, 0)), 16, 0x5eead4, 4, 4, 0.5, 1.2);
                    SFX.tone(300, 600, 0.2, 'sine', 0.12);
                    if (D.splits === SPLITS) MG.toast('THE MUTATION BURNS OUT — NO MORE SPLITS', '#5eead4');
                }
            });
        },
        scoreText(S) { return S.data.killed + ' / ' + (1 + SPLITS * 2); },
        hud(S) { return SR.panel(SR.chip('SPLITS LEFT', SPLITS - S.data.splits) + SR.chip('ALIVE', SR.alive(S)) + SR.chip('KILLED', S.data.killed + ' / ' + (1 + SPLITS * 2))); },
        stats: (S) => [['KILLED', S.data.killed + ' / ' + (1 + SPLITS * 2)], ['SPLITS', S.data.splits + ' / ' + SPLITS], ['HEADSHOTS', S.headshots]]
    });

    /* =====================================================================
       6. LAST 50
    ===================================================================== */
    const WAVES = [5, 8, 10, 12, 15];
    SR.define({
        id: 'sr_last50', order: 6, name: 'Last 50', icon: '🔫', accent: '#b91c1c',
        tagline: '50 bullets. 50 zombies. Headshots only.',
        desc: 'A fenced graveyard, a single M1911 and exactly 50 rounds: one magazine of 8 and 42 in reserve, with no refills anywhere. Fifty zombies come in five waves, and only a headshot kills; body shots barely slow them. Every miss makes the maths worse.',
        heroLabel: 'SPEED RUN • PRECISION', stars: [200, 150, 115, 90], timeLimit: 420, fixedAmmo: true, infiniteMag: false,
        standardWeapon: 'm1911', weaponLabel: 'M1911', weaponNote: '50 rounds total • no refills',
        keys: [['WASD', 'Move'], ['LMB', 'Shoot (heads only)'], ['R', 'Reload']],
        map: {
            atmosphere: { skyTop: 0x0f172a, skyBottom: 0x334155, fogColor: 0x1e293b, fogDensity: 0.03, sunColor: 0xcbd5e1, sunIntensity: 0.35, sunPos: [20, 40, -30], hemiSky: 0x94a3b8, hemiGround: 0x1c1917, hemiIntensity: 0.75, moon: true },
            boxes: [B(0, -0.5, 0, 90, 1, 90, 'grass')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 90, 0x1f2a1a, 0.002);
            const stone = std(0x6b7280, 0.9);
            for (const [x1, z1, x2, z2] of [[-24, -24, 24, -23.6], [-24, 23.6, 24, 24], [-24, -24, -23.6, 24], [23.6, -24, 24, 24]]) SR.wall(S, x1, z1, x2, z2, 1.6, std(0x27272a, 0.6, 0.6));
            const rnd = L.mulberry32(50);
            for (let i = 0; i < 26; i++) {
                const x = (rnd() - 0.5) * 40, z = (rnd() - 0.5) * 40;
                if (Math.hypot(x, z) < 6) continue;
                const t = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.25), stone); t.position.set(x, 0.55, z); t.rotation.y = (rnd() - 0.5) * 0.4; S.add(t);
            }
            for (let i = 0; i < 4; i++) { const tr = A.tree(1.4, 0x1c1917); tr.position.set(i < 2 ? -20 : 20, 0, i % 2 ? -20 : 20); S.add(tr); }
            Object.assign(S.data, { wave: 0, waveT: 1.5, spawned: 0, killed: 0, body: 0 });
        },
        start() {
            const w = BO.Player.activeWeapon;
            if (w) { w.mag = 8; w.reserve = 42; }
        },
        progress: (S) => S.data.killed / 50,
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (state === 'running') {
                if (D.wave < WAVES.length && SR.alive(S) === 0) {
                    D.waveT -= dt;
                    if (D.waveT <= 0) {
                        const n = WAVES[D.wave];
                        for (let i = 0; i < n; i++) {
                            const a = i / n * TAU + D.wave, r = 19 + Math.random() * 3;
                            SR.spawnZ(S, i % 3 === 2 ? 'sprinter' : 'shambler', Math.cos(a) * r, Math.sin(a) * r, { speed: i % 3 === 2 ? 2.8 : 1.9, hp: 99999, damage: 14 });
                        }
                        D.spawned += n;
                        D.wave++;
                        D.waveT = 2;
                        MG.toast('WAVE ' + D.wave + ' • ' + n + ' ZOMBIES', '#fca5a5');
                    }
                }
                if (D.killed >= 50) SR.done(S, 'ALL 50 DOWN');
                const w = P.activeWeapon;
                if (w && w.mag <= 0 && w.reserve <= 0 && !MG.pendingShot && SR.alive(S) + (50 - D.spawned) > 0) SR.fail(S, 'OUT OF AMMO');
            }
            SR.updateZ(S, dt, null, state !== 'running');
        },
        onHit(S, ent, info) {
            if (!ent || !ent.alive || !ent.takeDamage) return false;
            S.hits++;
            if (info.hitbox !== 'head') {
                S.data.body++;
                ent.stunTimer = Math.max(ent.stunTimer, 0.35);
                MG.popup(info.pt, 'HEADSHOTS ONLY', '#fca5a5');
                SFX.thunk();
                return false;
            }
            ent.takeDamage(1e7, 'head', true, null, 'bullet');
            S.headshots++; S.kills++; S.data.killed++;
            S.bumpCombo();
            return true;
        },
        scoreText(S) { return S.data.killed + ' / 50'; },
        hud(S) {
            const w = BO.Player.activeWeapon, left = w ? w.mag + w.reserve : 0;
            const need = 50 - S.data.killed;
            return SR.panel(SR.chip('ROUNDS', left, left < need) + SR.chip('ZOMBIES LEFT', need) + SR.chip('WAVE', S.data.wave + ' / 5'));
        },
        stats: (S) => [['HEADSHOT KILLS', S.data.killed + ' / 50'], ['BODY SHOTS', S.data.body], ['ROUNDS FIRED', S.shots + ' / 50']]
    });
})(window);
