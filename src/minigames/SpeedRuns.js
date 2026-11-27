/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Speed Runs (part 1) + shared kit
     1. Gauntlet Sprint — run the neon course and drop every enemy
     2. Outpost Rescue  — rich military valley with roads, vehicles, tents & radars
     4. The Splitter    — Desert Eagle ONLY + Meteor Shower after 30 splits!
     6. Last 50         — 50 rounds, NO waves: 1-by-1 accelerating & shortening spawns!
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

    const SR = BO.SpeedRunKit = {
        fmtT,
        define(o) {
            const def = Object.assign({
                cat: 'speed', duration: 0, countdown: 3, lockWeapon: true, infiniteMag: true, forgivingMisses: true, customMusic: true,
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
                if (BO.MinigameAudio) BO.MinigameAudio.start(o.music || 'tactical');
                S.data.sr = { done: false, time: 0, why: '', progress: 0 };
                S.data.zs = []; S.data.zid = 1;
                if (userBuild) userBuild.call(this, S, lib);
            };
            def.update = function (S, dt, lib, state) {
                if (BO.MinigameAudio) BO.MinigameAudio.tick(dt, o.musicState ? o.musicState(S) : {});
                const sr = S.data.sr;
                if (state === 'running' && !sr.done && !sr.why) {
                    if (!BO.Player.alive) SR.fail(S, 'YOU DIED');
                    else if (o.timeLimit && S.t > o.timeLimit) SR.fail(S, 'TIME LIMIT');
                }
                if (userUpdate) userUpdate.call(this, S, dt, lib, state);
                sr.progress = Math.max(sr.progress, Math.min(1, o.progress ? o.progress(S) : 0));
            };
            def.result = function (S) {
                const sr = S.data.sr, t = sr.done ? sr.time : 0;
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
                if (BO.MinigameAudio) BO.MinigameAudio.stop();
                if (userDispose) userDispose.call(this, S, lib);
                for (const z of S.data.zs || []) z.destroy();
                S.data.zs = [];
            };
            if (!def.extraTargets) def.extraTargets = (S, pool) => { for (const z of S.data.zs) if (z.alive) for (const m of z.getHitboxMeshes()) pool.push(m); };
            MG.register(def);
            return def;
        },
        done(S, label) {
            const sr = S.data.sr; if (sr.done || sr.why) return;
            sr.done = true; sr.time = S.t; sr.progress = 1; SFX.fanfare();
            MG.finish(label || 'FINISHED!', { color: '#67e8f9', delay: 2.2 });
        },
        fail(S, why) {
            const sr = S.data.sr; if (sr.done || sr.why) return;
            sr.why = why; SFX.buzzer();
            MG.finish(why, { color: '#f87171', delay: 2.4 });
        },
        spawnZ(S, specId, x, z, o = {}) {
            const spec = BO.ZombiesData.get(specId);
            const ent = new BO.ZombieEntity({
                id: S.data.zid++, spec, round: o.round || 8, hp: o.hp || spec.hp, speed: o.speed || spec.speed,
                damage: o.damage || Math.round(spec.attack * 0.7), x, y: o.y || 0, z, splitCount: 0, hasGun: false, sizeMult: o.size
            });
            ent.srTag = o.tag; S.data.zs.push(ent); return ent;
        },
        updateZ(S, dt, cb, frozen) {
            const P = BO.Player;
            const callbacks = Object.assign({ allowProjectiles: false, onMeleePlayer: (z) => { if (P.alive) P.takeDamage(z.damage, z.pos, false, z); } }, cb || {});
            const zs = S.data.zs;
            for (let i = zs.length - 1; i >= 0; i--) {
                const z = zs[i];
                if (z.alive && (frozen || z.srHold)) z.stunTimer = Math.max(z.stunTimer, 0.05);
                const keep = z.update(dt, zs, callbacks);
                if (!keep) { z.destroy(); zs.splice(i, 1); }
            }
        },
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
        tagline: 'Run the neon killhouse. Blast barrels. Drop all 28.',
        desc: 'A 150-metre walled course split into six neon laser zones with speed pads and explosive fuel barrels. Each group wakes up as you approach. Drop all 28 enemies fast.',
        heroLabel: 'SPEED RUN • COURSE CLEAR', stars: [150, 110, 80, 60], timeLimit: 420,
        standardWeapon: 'm4a1', weaponLabel: 'M4A1', weaponNote: 'Bottomless magazine',
        keys: [['WASD', 'Run'], ['LMB', 'Shoot'], ['SHIFT', 'Sprint']],
        map: {
            atmosphere: { skyTop: 0x0f172a, skyBottom: 0xfcd34d, fogColor: 0xd6b88a, fogDensity: 0.006, sunColor: 0xfff1c1, sunIntensity: 1.6, sunPos: [30, 50, -40], hemiSky: 0xfde68a, hemiGround: 0x44403c, hemiIntensity: 0.85 },
            boxes: [B(0, -0.5, -75, 60, 1, 190, 'desert_sand')],
            spawn: { x: 0, y: 0, z: 2, yaw: 0 }
        },
        build(S) {
            const stone = A.pbrMat('cyberpunk/Commercial Neon/led-strip-wall-cladding-001.png', 24, 1.2, { roughness: 0.55, metalness: 0.3 });
            SR.wall(S, -12.5, 6, -12, -160, 4.5, stone);
            SR.wall(S, 12, 6, 12.5, -160, 4.5, stone);
            SR.wall(S, -12, -160, 12, -160.5, 4.5, stone);
            SR.wall(S, -12, 6, 12, 6.5, 4.5, stone);
            const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(24, 166), A.pbrMat('cyberpunk/Wet Urban Surfaces/rain-slick-concrete-001.png', 6, 38, { roughness: 0.35, metalness: 0.35 }));
            floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.set(0, 0.02, -77); S.add(floorGlow);
            const crate = A.pbrMat('cyberpunk/Hazard Markings Abstract/worn-safety-stripes-001.png', 2, 1, { roughness: 0.65, metalness: 0.2 });
            const coverTr = [];
            for (const [x, z, w, d] of [[-5, -14, 3, 1.2], [5, -34, 3, 1.2], [0, -56, 5, 1], [-6, -80, 1.2, 4], [6, -80, 1.2, 4], [0, -104, 6, 1], [-5, -128, 2, 2], [5, -132, 2, 2]]) {
                S.box(x, 0.6, z, w, 1.2, d, crate, { solid: true });
                coverTr.push({ pos: [x, 0, z], scale: [w * 0.45, 0.6, d * 0.45] });
            }
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/city_industrial_kit/shipping-container-b.glb', coverTr);
            S.data.boostPads = [];
            for (let i = 0; i < GAUNTLET.length; i++) {
                const g = GAUNTLET[i];
                const sign = A.sign('ZONE ' + (i + 1), 2.8, 0.65, { bg: '#0c4a6e', color: '#e0f2fe', borderColor: '#22d3ee', size: 0.5 });
                sign.position.set(-11.8, 2.8, g.z + 8); sign.rotation.y = Math.PI / 2; S.add(sign);
                const arch = new THREE.Mesh(new THREE.BoxGeometry(24, 0.28, 0.35), basic(0x22d3ee)); arch.position.set(0, 4.4, g.z + 8); S.add(arch);
                S.add(A.torch(S, V(-10.8, 0, g.z), 0x22d3ee, false)); S.add(A.torch(S, V(10.8, 0, g.z), 0x22d3ee, false));
                const pad = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), basic(0x06b6d4));
                pad.rotation.x = -Math.PI / 2; pad.position.set((i % 2 ? 1 : -1) * 3.5, 0.04, g.z + 10); S.add(pad);
                S.data.boostPads.push({ x: pad.position.x, z: pad.position.z, cd: 0 });
                for (const [id, x, dz] of g.foes) { const z = SR.spawnZ(S, id, x, g.z + dz, { tag: i }); z.srHold = true; }
            }
            for (const [bx, bz] of [[0, -25], [-4, -67], [4, -95], [0, -136]]) {
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 1.15, 12), std(0xdc2626, 0.4, 0.4)); bar.position.y = 0.58;
                const band = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.22, 12), basic(0xfacc15)); band.position.y = 0.65;
                const grp = new THREE.Group(); grp.add(bar, band);
                S.addTarget({
                    mesh: grp, hitMeshes: [bar], pos: V(bx, 0, bz), life: 0, appear: 'none', inT: 0.01, death: 'pop', deathColor: 0xf97316, bonus: true,
                    onKill: (tg) => {
                        BO.FX.spawnExplosion(tg.root.position.clone().add(V(0, 0.8, 0)), 7, 0xf97316); SFX.rumble(0.5);
                        for (const z of S.data.zs) if (z.alive && z.pos.distanceTo(tg.root.position) < 9.5) { z.srHold = false; if (z.takeDamage(260, 'torso', false, null, 'explosive')) { S.kills++; S.bumpCombo(); } }
                    }
                });
            }
            const fin = A.sign('FINISH', 5.5, 1.1, { bg: '#14532d', color: '#fde68a', borderColor: '#facc15', size: 0.6 });
            fin.position.set(0, 3.2, -159.6); S.add(fin);
            const gBulbs = [];
            for (let gx = -2.8; gx <= 2.8; gx += 0.7) gBulbs.push(V(gx, 2.55, -159.3), V(gx, 3.85, -159.3));
            for (const g of GAUNTLET) for (let lx = -9; lx <= 9; lx += 4.5) gBulbs.push(V(lx, 4.25, g.z + 8));
            const gb = A.bulbs(gBulbs, [0x22d3ee, 0xfacc15, 0xf8fafc], 0.11);
            S.add(gb); A.animateBulbs(S, gb, 7, 'chase');
            if (BO.Settings.getQualityPreset().pointLights) {
                const pl = new THREE.PointLight(0x22d3ee, 1.5, 28, 1.4); pl.position.set(0, 4.0, -8); S.add(pl);
            }
            S.data.total = S.data.zs.length; S.data._boostT = 0;
        },
        progress: (S) => 1 - SR.alive(S) / S.data.total,
        update(S, dt, lib, state) {
            const P = BO.Player;
            if (state === 'running') {
                if (S.data._boostT > 0) {
                    S.data._boostT -= dt;
                    const fwd = P.getMoveDirectionVectors().forward;
                    P.pos.x += fwd.x * 4.2 * dt; P.pos.z += fwd.z * 4.2 * dt;
                }
                for (const bp of S.data.boostPads || []) {
                    if (bp.cd > 0) bp.cd -= dt;
                    else if (Math.hypot(P.pos.x - bp.x, P.pos.z - bp.z) < 2.2) { bp.cd = 4.0; S.data._boostT = 2.0; SFX.whoosh(0.25); MG.toast('SPEED BOOST PAD!', '#22d3ee'); }
                }
            }
            for (const z of S.data.zs) if (z.srHold && Math.abs(z.pos.z - P.pos.z) < 26) { z.srHold = false; z.stunTimer = 0.4; }
            SR.updateZ(S, dt, null, state !== 'running');
            if (state === 'running' && SR.alive(S) === 0) SR.done(S, 'COURSE CLEAR');
        },
        onHit(S, ent, info) { return SR.hitZ(S, ent, info); },
        scoreText(S) { return (S.data.total - SR.alive(S)) + ' / ' + S.data.total; },
        hud(S) {
            let next = -1; for (let i = 0; i < GAUNTLET.length; i++) if (SR.alive(S, i) > 0) { next = i; break; }
            return SR.panel(SR.chip('ENEMIES LEFT', SR.alive(S)) + (next >= 0 ? SR.chip('ZONE', (next + 1) + ' / 6') : ''));
        },
        stats: (S) => [['ENEMIES', (S.data.total - SR.alive(S)) + ' / ' + S.data.total], ['HEADSHOTS', S.headshots], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']]
    });

    /* =====================================================================
       2. OUTPOST RESCUE — Rich Military Valley, Supply Roads, Wrecked Humvees, Tents & Radars
    ===================================================================== */
    const OUTPOSTS = [
        { name: 'ALPHA', x: 0, z: -55, horde: 10, types: ['shambler', 'sprinter'] },
        { name: 'BRAVO', x: 52, z: 28, horde: 14, types: ['shambler', 'hopper', 'one_arm_ripper'] },
        { name: 'CHARLIE', x: -52, z: 28, horde: 18, types: ['sprinter', 'one_arm_ripper', 'headless_charger', 'shambler'] }
    ];
    SR.define({
        id: 'sr_outposts', order: 2, name: 'Outpost Rescue', icon: '🛡️', accent: '#16a34a', music: 'range',
        tagline: 'Fight through a fortified valley! Save all 3 military outposts.',
        desc: 'Dirt supply roads link Alpha, Bravo & Charlie across a cratered military valley lined with wrecked convoys, radar towers, sandbag bunkers, ammo depots & perimeter pines. Triggering an outpost summons its horde—protect all three!',
        heroLabel: 'SPEED RUN • MILITARY VALLEY DEFENSE', stars: [240, 175, 130, 100], timeLimit: 480,
        standardWeapon: 'm249', weaponLabel: 'M249 SAW', weaponNote: 'Bottomless belt',
        keys: [['WASD', 'Move'], ['LMB', 'Shoot'], ['SHIFT', 'Sprint']],
        map: {
            atmosphere: { skyTop: 0x0c4a6e, skyBottom: 0xbbf7d0, fogColor: 0xa7c4a0, fogDensity: 0.005, sunColor: 0xfff7d6, sunIntensity: 1.5, sunPos: [-40, 60, 20], hemiSky: 0xd9f99d, hemiGround: 0x365314, hemiIntensity: 0.85 },
            skybox: 'skybox-morning.png',
            boxes: [B(0, -0.5, 0, 200, 1, 200, 'grass')],
            spawn: { x: 0, y: 0, z: 25, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 200, 0x3f6212, 0.002);
            const sand = std(0xc2a26b, 0.95), wood = std(0x78350f, 0.85), dirt = std(0x57534e, 0.98), rockM = std(0x475569, 0.9), steelM = std(0x334155, 0.5, 0.6);
            // Dirt Supply Roads linking Central Crossroads (0, 20) -> Alpha (0,-55), Bravo (52,28), Charlie (-52,28)
            const roadN = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 80), dirt); roadN.rotation.x = -Math.PI / 2; roadN.position.set(0, 0.02, -16); S.add(roadN);
            const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(110, 6.5), dirt); roadEW.rotation.x = -Math.PI / 2; roadEW.position.set(0, 0.02, 26); S.add(roadEW);
            const hubPad = new THREE.Mesh(new THREE.CircleGeometry(9, 24), std(0x374151, 0.9)); hubPad.rotation.x = -Math.PI / 2; hubPad.position.set(0, 0.03, 25); S.add(hubPad);
            const hubPts = [];
            for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; hubPts.push(V(Math.cos(a) * 8.8, 0.25, 25 + Math.sin(a) * 8.8)); }
            const hb = A.bulbs(hubPts, [0x4ade80, 0xfacc15], 0.14); S.add(hb); A.animateBulbs(S, hb, 5, 'chase');
            if (BO.Settings.getQualityPreset().pointLights) {
                const pl = new THREE.PointLight(0xffe0a3, 1.4, 34, 1.4); pl.position.set(0, 6, 25); S.add(pl);
            }

            // Wrecked military convoy vehicles + crates + roadside rocks along the valley!
            const addTruck = (x, z, yaw, col) => {
                const trk = new THREE.Group();
                const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.5, 2.2), std(col, 0.7, 0.3)); cab.position.set(0, 0.9, 1.4);
                const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 3.6), std(0x3f6212, 0.85)); bed.position.set(0, 0.8, -1.5);
                trk.add(cab, bed); trk.position.set(x, 0, z); trk.rotation.y = yaw; S.add(trk);
                S.collider(x - 1.6, 0, z - 2.4, x + 1.6, 2.0, z + 2.4);
            };
            addTruck(-5.5, -18, 0.35, 0x365314);
            addTruck(26, 21, -0.25, 0x78350f);
            addTruck(-28, 33, 0.4, 0x3f6212);

            const rnd = L.mulberry32(99);
            const forestTreeTr = [], forestRockTr = [];
            for (let i = 0; i < 48; i++) {
                const a = (i / 48) * TAU, r = 74 + rnd() * 20;
                const ts = (1.7 + rnd() * 0.9) * 1.9;
                forestTreeTr.push({ pos: [Math.cos(a) * r, 0, Math.sin(a) * r], rot: rnd() * 6, scale: ts });
                if (i % 2 === 0) forestRockTr.push({ pos: [Math.cos(a + 0.05) * (r - 6), 0, Math.sin(a + 0.05) * (r - 6)], rot: rnd() * 6, scale: 2.2 + rnd() * 2.0 });
            }
            for (let i = 0; i < 20; i++) {
                const x = (rnd() - 0.5) * 90, z = (rnd() - 0.5) * 80;
                if (Math.hypot(x, z - 25) < 10 || OUTPOSTS.some((o) => Math.hypot(x - o.x, z - o.z) < 11)) continue;
                forestRockTr.push({ pos: [x, 0, z], rot: rnd() * 6, scale: 1.4 + rnd() * 1.2 });
            }
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/mini_forest_kit/tree-high.glb', forestTreeTr);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/mini_forest_kit/rocks-high.glb', forestRockTr);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/mini_forest_kit/tent.glb', OUTPOSTS.map((o) => ({ pos: [o.x - 3.2, 0, o.z - 2.5], scale: 2.0 })));

            // Direction Signposts at central crossroads
            const dirSg = A.sign('← CHARLIE | ↑ ALPHA | BRAVO →', 6.4, 0.8, { bg: '#1e293b', color: '#fde047', borderColor: '#22c55e', size: 0.40 });
            dirSg.position.set(0, 2.6, 17); S.add(dirSg);

            S.data.radars = [];
            S.data.posts = OUTPOSTS.map((o) => {
                const g = new THREE.Group();
                const concreteBase = new THREE.Mesh(new THREE.CircleGeometry(7.2, 24), std(0x334155, 0.9));
                concreteBase.rotation.x = -Math.PI / 2; concreteBase.position.y = 0.025; g.add(concreteBase);
                for (let i = 0; i < 12; i++) {
                    const a = i / 12 * TAU; if (i === 9) continue;
                    const bag = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.05, 0.9), sand);
                    bag.position.set(Math.cos(a) * 5.2, 0.52, Math.sin(a) * 5.2); bag.rotation.y = -a + Math.PI / 2; g.add(bag);
                }
                const tower = new THREE.Mesh(new THREE.BoxGeometry(2.3, 5.6, 2.3), wood); tower.position.y = 2.8; g.add(tower);
                const cap = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.3, 4), std(0x451a03, 0.85)); cap.position.y = 6.2; cap.rotation.y = Math.PI / 4; g.add(cap);
                // Side camo medical/command bunker tent + crate stack + spinning radar dish
                const tent = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.9, 3.4), std(0x3f6212, 0.88)); tent.position.set(-3.2, 0.95, -2.5); g.add(tent);
                const dish = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.5, 10), steelM); dish.position.set(0, 7.6, 0); dish.rotation.x = 0.7; g.add(dish);
                S.data.radars.push(dish);
                const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })); flag.position.set(0.75, 7.4, 0); g.add(flag);
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), std(0xd4d4d8, 0.4, 0.7)); pole.position.y = 7.1; g.add(pole);
                const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.45, 24, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
                beacon.position.y = 14; g.add(beacon);
                const sign = A.sign('OUTPOST ' + o.name, 3, 0.6, { bg: '#14532d', color: '#f0fdf4', borderColor: '#22c55e', size: 0.45 }); sign.position.set(0, 3.8, 1.2); g.add(sign);
                g.position.set(o.x, 0, o.z); S.add(g);
                S.add(A.torch(S, V(o.x - 3.2, 0, o.z + 3.2), 0xf97316, false));
                S.add(A.torch(S, V(o.x + 3.2, 0, o.z + 3.2), 0xf97316, false));
                S.collider(o.x - 1.2, 0, o.z - 1.2, o.x + 1.2, 5.6, o.z + 1.2);
                return Object.assign({}, o, { g, flag, beacon, hp: 100, state: 'idle' });
            });
            S.animate((dt) => {
                const t = performance.now() * 0.004;
                for (const d of S.data.radars || []) d.rotation.y += dt * 2.2;
                for (const p of S.data.posts || []) {
                    p.flag.rotation.y = Math.sin(t + p.x) * 0.35;
                    if (p.beacon) {
                        p.beacon.rotation.y += dt * 1.4;
                        p.beacon.material.color.setHex(p.state === 'saved' ? 0x38bdf8 : p.state === 'attack' ? 0xef4444 : 0xfacc15);
                    }
                }
            });
        },
        progress: (S) => S.data.posts.reduce((a, p) => a + (p.state === 'saved' ? 1 : p.state === 'attack' ? 0.3 : 0), 0) / 3,
        update(S, dt, lib, state) {
            const P = BO.Player, D = S.data;
            if (state === 'running') {
                for (const p of D.posts) {
                    if (p.state === 'idle' && Math.hypot(P.pos.x - p.x, P.pos.z - p.z) < 9.5) {
                        p.state = 'attack'; MG.toast('OUTPOST ' + p.name + ' UNDER ATTACK!', '#fca5a5');
                        BO.Sound.playBossIntro && BO.Sound.playBossIntro();
                        for (let i = 0; i < p.horde; i++) {
                            const a = i / p.horde * TAU + Math.random() * 0.3, r = 32 + Math.random() * 12;
                            const z = SR.spawnZ(S, p.types[i % p.types.length], p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, { tag: p.name });
                            z.srPost = p;
                        }
                    } else if (p.state === 'attack' && SR.alive(S, p.name) === 0) {
                        p.state = 'saved'; p.flag.material.color.setHex(0x38bdf8); MG.toast('OUTPOST ' + p.name + ' SAVED!', '#86efac'); SFX.ding(1.1);
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
                    const p = z.srPost; if (!p || p.state !== 'attack') return;
                    p.hp = Math.max(0, p.hp - 0.55);
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
       4. THE SPLITTER — DESERT EAGLE ONLY + METEOR SHOWER AFTER 30 SPLITS
    ===================================================================== */
    const SPLITS = 30, SPLIT_HP = 230;
    SR.define({
        id: 'sr_splitter', order: 4, name: 'The Splitter', icon: '🧫', accent: '#14b8a6',
        tagline: 'Desert Eagle ONLY! After 30 splits, dodge falling sky meteors while finishing them!',
        desc: 'Armed strictly with a Desert Eagle .50 inside a containment bio-lab. Every kill splits the mutant in two—30 splits total (61 mutants). Once all 30 splits burn out, fiery meteors rain from the sky hurting ONLY YOU! Clear all mutants before the sky falls!',
        heroLabel: 'SPEED RUN • DEAGLE + METEOR FINALE', stars: [220, 170, 130, 100], timeLimit: 480,
        standardWeapon: 'deagle', weaponLabel: 'DESERT EAGLE .50', weaponNote: 'Desert Eagle only • Dodge meteors after 30 splits!',
        keys: [['WASD', 'Dodge Meteors & Mutants'], ['LMB', 'Deagle Shot']],
        map: {
            atmosphere: { skyTop: 0x042f2e, skyBottom: 0x134e4a, fogColor: 0x0f2f2c, fogDensity: 0.011, sunColor: 0x99f6e4, sunIntensity: 0.9, sunPos: [10, 50, 10], hemiSky: 0x5eead4, hemiGround: 0x042f2e, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, 0, 80, 1, 80, 'concrete')],
            spawn: { x: 0, y: 0, z: 18, yaw: 0 }
        },
        build(S) {
            const R = 26;
            const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.5, R + 0.5, 6.5, 48, 1, true), std(0x115e59, 0.8, 0.2, { side: THREE.BackSide }));
            wall.position.y = 3.25; S.add(wall); S.solid(wall);
            for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; S.collider(Math.cos(a) * (R + 2) - 2, 0, Math.sin(a) * (R + 2) - 2, Math.cos(a) * (R + 2) + 2, 6, Math.sin(a) * (R + 2) + 2); }
            const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.5, 48), std(0x0f3b38, 0.85)); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; S.add(floor);
            const ring = new THREE.Mesh(new THREE.RingGeometry(4.5, 5.1, 32), basic(0x14b8a6, { side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; S.add(ring);
            const vats = [];
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * TAU, vx = Math.cos(a) * (R - 2.2), vz = Math.sin(a) * (R - 2.2);
                const capMat = std(0x1f2937, 0.3, 0.8);
                const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 3.8, 14), new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: 0x0d9488, emissiveIntensity: 0.7, transparent: true, opacity: 0.55, roughness: 0.1 }));
                tank.position.set(vx, 2.3, vz);
                const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.6, 14), capMat); base.position.set(vx, 0.3, vz);
                const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.0, 0.5, 14), capMat); lid.position.set(vx, 4.4, vz);
                const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), basic(0x5eead4)); orb.position.set(vx, 2.0, vz);
                S.add(tank, base, lid, orb); vats.push({ orb, phase: i * 0.9 });
            }
            S.animate(() => {
                const t = performance.now() * 0.002;
                ring.scale.setScalar(0.92 + Math.sin(t * 2) * 0.10);
                for (const v of vats) v.orb.position.y = 2.3 + Math.sin(t * 1.4 + v.phase) * 1.1;
            });
            const sPts = [];
            for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; sPts.push(V(Math.cos(a) * R, 5.6, Math.sin(a) * R)); }
            const sb = A.bulbs(sPts, [0x2dd4bf, 0xf97316, 0xfde047], 0.15); S.add(sb); A.animateBulbs(S, sb, 6, 'chase');
            const sSign = A.sign('BIO-CONTAINMENT • 30 SPLITS', 7.5, 1.1, { bg: '#042f2e', color: '#99f6e4', borderColor: '#2dd4bf', size: 0.55 });
            sSign.position.set(0, 5.2, -R + 1.2); S.add(sSign);
            if (BO.Settings.getQualityPreset().pointLights) {
                const pl = new THREE.PointLight(0x2dd4bf, 1.6, 36, 1.3); pl.position.set(0, 8, 0); S.add(pl);
            }
            S.data.splits = 0; S.data.killed = 0; S.data.meteors = []; S.data.meteorT = 0.6;
            this._spawn(S, 0, -12);
        },
        _spawn(S, x, z) {
            const e = SR.spawnZ(S, 'mitosis_ghoul', x, z, { hp: SPLIT_HP, speed: 2.9, damage: 18 });
            e.stunTimer = 0.5; return e;
        },
        progress: (S) => S.data.killed / (1 + SPLITS * 2),
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            SR.updateZ(S, dt, null, state !== 'running');
            if (state === 'running' && D.splits >= SPLITS && SR.alive(S) > 0) {
                D.meteorT -= dt;
                if (D.meteorT <= 0) {
                    D.meteorT = 0.72;
                    const tx = BO.Math.clamp(P.pos.x + (Math.random() - 0.5) * 11, -22, 22);
                    const tz = BO.Math.clamp(P.pos.z + (Math.random() - 0.5) * 11, -22, 22);
                    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 3.2, 20), basic(0xef4444, { transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
                    ring.rotation.x = -Math.PI / 2; ring.position.set(tx, 0.06, tz); S.add(ring);
                    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), std(0xf97316, 0.3, 0.2, { emissive: 0xef4444, emissiveIntensity: 0.9 }));
                    rock.position.set(tx, 28, tz); S.add(rock);
                    D.meteors.push({ rock, ring, tx, tz, y: 28, spd: 21 });
                }
            }
            for (let i = D.meteors.length - 1; i >= 0; i--) {
                const m = D.meteors[i];
                m.y -= m.spd * dt;
                m.rock.position.y = m.y; m.rock.rotation.x += dt * 5; m.rock.rotation.z += dt * 4;
                if (m.y <= 0.6) {
                    const hitPos = V(m.tx, 0.5, m.tz);
                    BO.FX.spawnExplosion(hitPos, 3.5, 0xf97316); SFX.rumble(0.42);
                    // Hurts ONLY the player!
                    if (Math.hypot(P.pos.x - m.tx, P.pos.z - m.tz) <= 3.35) {
                        P.takeDamage(20, hitPos, true);
                        MG.flashScreen('rgba(239,68,68,0.35)');
                    }
                    S.scene.remove(m.rock); S.scene.remove(m.ring); D.meteors.splice(i, 1);
                }
            }
            if (state === 'running' && D.killed >= 1 + SPLITS * 2 && SR.alive(S) === 0) SR.done(S, 'MUTATION ERADICATED');
        },
        onHit(S, ent, info) {
            return SR.hitZ(S, ent, info, (z) => {
                const D = S.data; D.killed++;
                if (D.splits < SPLITS) {
                    D.splits++;
                    for (const s of [-1, 1]) {
                        const a = z.yaw + Math.PI / 2;
                        const px = BO.Math.clamp(z.pos.x + Math.cos(a) * s * 1.2, -24, 24), pz = BO.Math.clamp(z.pos.z + Math.sin(a) * s * 1.2, -24, 24);
                        this._spawn(S, px, pz);
                    }
                    BO.FX.spawnParticles(z.pos.clone().add(V(0, 1, 0)), 16, 0x5eead4, 4, 4, 0.5, 1.2); SFX.tone(300, 600, 0.2, 'sine', 0.12);
                    if (D.splits === SPLITS) { MG.toast('NO MORE SPLITS — INCOMING METEOR SHOWER!', '#f97316'); SFX.rumble(0.7); }
                }
            });
        },
        scoreText(S) { return S.data.killed + ' / ' + (1 + SPLITS * 2); },
        hud(S) { return SR.panel(SR.chip('SPLITS LEFT', SPLITS - S.data.splits, S.data.splits >= SPLITS) + SR.chip('ALIVE', SR.alive(S)) + SR.chip(S.data.splits >= SPLITS ? 'HAZARD' : 'KILLED', S.data.splits >= SPLITS ? '☄ METEORS!' : (S.data.killed + ' / ' + (1 + SPLITS * 2)), S.data.splits >= SPLITS)); },
        stats: (S) => [['KILLED', S.data.killed + ' / ' + (1 + SPLITS * 2)], ['SPLITS', S.data.splits + ' / ' + SPLITS], ['HEADSHOTS', S.headshots]]
    });

    /* =====================================================================
       6. LAST 50 — ONE BY ONE ESCALATING SPAWNS (Shortening Interval, Increasing Speed!)
    ===================================================================== */
    SR.define({
        id: 'sr_last50', order: 6, name: 'Last 50', icon: '🔫', accent: '#b91c1c', music: 'siege',
        musicState: (S) => ({ wardenAwake: S.data.spawned >= 20, wardenPhase2: S.data.spawned >= 38 }),
        tagline: '50 bullets. 50 zombies spawned ONE BY ONE—faster & quicker each time! Headshots only.',
        desc: 'A gothic moonlit graveyard, a single M1911 and exactly 50 rounds (no refills anywhere). NO waves: all 50 zombies emerge one by one, with shorter gaps between spawns AND faster sprint speed for every zombie spawned. Only a headshot kills!',
        heroLabel: 'SPEED RUN • ENDLESS ACCELERATION', stars: [200, 150, 115, 90], timeLimit: 420, fixedAmmo: true, infiniteMag: false,
        standardWeapon: 'm1911', weaponLabel: 'M1911', weaponNote: '50 rounds total • no refills',
        keys: [['WASD', 'Move'], ['LMB', 'Shoot (heads only)'], ['R', 'Reload']],
        map: {
            atmosphere: { skyTop: 0x090d16, skyBottom: 0x334155, fogColor: 0x1e293b, fogDensity: 0.028, sunColor: 0xcbd5e1, sunIntensity: 0.4, sunPos: [20, 40, -30], hemiSky: 0x94a3b8, hemiGround: 0x1c1917, hemiIntensity: 0.78, moon: true },
            boxes: [B(0, -0.5, 0, 90, 1, 90, 'grass')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 90, 0x1a2618, 0.002);
            const stone = std(0x6b7280, 0.9), cryptMat = std(0x374151, 0.88);
            for (const [x1, z1, x2, z2] of [[-24, -24, 24, -23.6], [-24, 23.6, 24, 24], [-24, -24, -23.6, 24], [23.6, -24, 24, 24]]) SR.wall(S, x1, z1, x2, z2, 1.8, std(0x27272a, 0.6, 0.6));
            for (const [ax, az] of [[0, -18], [0, 18]]) {
                const pL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.8, 1.1), cryptMat); pL.position.set(ax - 3.2, 2.4, az);
                const pR = pL.clone(); pR.position.x = ax + 3.2;
                const top = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.0, 1.3), cryptMat); top.position.set(ax, 5.0, az);
                S.add(pL, pR, top);
                S.add(A.torch(S, V(ax - 3.8, 0, az + 1.2), 0xf97316, true)); S.add(A.torch(S, V(ax + 3.8, 0, az + 1.2), 0xf97316, true));
                const cPts = []; for (let cx = -3.6; cx <= 3.6; cx += 0.9) cPts.push(V(ax + cx, 5.55, az));
                const cb = A.bulbs(cPts, [0xef4444, 0xf97316, 0xfde047], 0.11); S.add(cb); A.animateBulbs(S, cb, 5, 'twinkle');
            }
            const rnd = L.mulberry32(50);
            for (let i = 0; i < 32; i++) {
                const x = (rnd() - 0.5) * 40, z = (rnd() - 0.5) * 40;
                if (Math.hypot(x, z) < 6) continue;
                const t = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.35, 0.28), stone); t.position.set(x, 0.66, z); t.rotation.y = (rnd() - 0.5) * 0.4; S.add(t);
            }
            for (let i = 0; i < 6; i++) { const tr = A.tree(1.5, 0x1c1917); const a = (i / 6) * TAU; tr.position.set(Math.cos(a) * 21, 0, Math.sin(a) * 21); S.add(tr); }
            Object.assign(S.data, { spawnT: 0.8, spawned: 0, killed: 0, body: 0 });
        },
        start() {
            const w = BO.Player.activeWeapon;
            if (w) { w.mag = 8; w.reserve = 42; }
        },
        progress: (S) => S.data.killed / 50,
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (state === 'running') {
                if (D.spawned < 50) {
                    D.spawnT -= dt;
                    if (D.spawnT <= 0) {
                        const a = Math.random() * TAU, r = 20 + Math.random() * 2.5;
                        const spd = 1.65 + D.spawned * 0.088; // each zombie is faster than the previous one!
                        const specId = D.spawned >= 30 ? 'sprinter' : 'shambler';
                        SR.spawnZ(S, specId, Math.cos(a) * r, Math.sin(a) * r, { speed: spd, hp: 99999, damage: 14 });
                        D.spawned++;
                        // Shorten delay between each spawn every time!
                        D.spawnT = Math.max(0.28, 2.25 * Math.pow(0.954, D.spawned));
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
                S.data.body++; ent.stunTimer = Math.max(ent.stunTimer, 0.35);
                MG.popup(info.pt, 'HEADSHOTS ONLY', '#fca5a5'); SFX.thunk(); return false;
            }
            ent.takeDamage(1e7, 'head', true, null, 'bullet');
            S.headshots++; S.kills++; S.data.killed++; S.bumpCombo(); return true;
        },
        scoreText(S) { return S.data.killed + ' / 50'; },
        hud(S) {
            const w = BO.Player.activeWeapon, left = w ? w.mag + w.reserve : 0, need = 50 - S.data.killed;
            return SR.panel(SR.chip('ROUNDS', left, left < need) + SR.chip('ZOMBIES LEFT', need) + SR.chip('SPAWNED', S.data.spawned + ' / 50'));
        },
        stats: (S) => [['HEADSHOT KILLS', S.data.killed + ' / 50'], ['BODY SHOTS', S.data.body], ['ROUNDS FIRED', S.shots + ' / 50']]
    });
})(window);
