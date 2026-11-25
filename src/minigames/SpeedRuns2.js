/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Speed Runs (part 2)
     3. Getaway Chase — drive after three thieves and shoot them off the road
     5. Sky Snipers   — stranded on a rooftop; snipe the pilot of each plane
     7. Freefall      — skydiving firefight; clear the sky before you land
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const SR = BO.SpeedRunKit;
    const { B, SFX, std, basic, TAU, clamp01 } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    function ride(pos, eye = 1.6) { BO.Player.rideState = { kind: 'minigame', pos, roll: 0, pitch: 0, eye }; }

    function enemyShot(S, from, dmg, hitChance) {
        const cam = BO.App.worldCamera.position;
        const hit = Math.random() < hitChance;
        const to = cam.clone().add(hit ? V(0, -0.3, 0) : V((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 4));
        BO.FX.spawnTracer(from, to, 0xff6b3d, 0.03, 0.09);
        SFX.noise(0.1, 1200, 'bandpass', 0.8, 0.25);
        if (hit && BO.Player.alive) BO.Player.takeDamage(dmg, from, false);
    }

    function carMesh(body, roof) {
        const g = new THREE.Group();
        const b = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 4.6), std(body, 0.3, 0.6)); b.position.y = 0.7; g.add(b);
        const c = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 2.2), std(roof, 0.15, 0.5)); c.position.set(0, 1.4, -0.3); g.add(c);
        for (const [x, z] of [[-1.05, 1.5], [1.05, 1.5], [-1.05, -1.5], [1.05, -1.5]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), std(0x111111, 0.8)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.4, z); g.add(w); }
        return { g, hit: [b, c] };
    }

    /* =====================================================================
       3. GETAWAY CHASE
    ===================================================================== */
    const LOOP = [];
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; LOOP.push(V(Math.sin(a) * 130 + Math.sin(a * 3) * 18, 0, Math.cos(a) * 85 + Math.cos(a * 2) * 12)); }
    SR.define({
        id: 'sr_chase', order: 3, name: 'Getaway Chase', icon: '🚓', accent: '#3b82f6',
        tagline: 'They robbed you. Run them off the road.',
        desc: 'Three thieves just robbed you and are speeding away in getaway cars around the ring road. Jump in your car and give chase: W/S to drive, A/D to steer, and your mouse is free to aim and shoot out of the window. Each getaway car takes several hits. If any thief gets too far ahead for too long, they escape.',
        heroLabel: 'SPEED RUN • VEHICLE CHASE', stars: [150, 110, 85, 65], timeLimit: 300,
        standardWeapon: 'mp5', weaponLabel: 'MP5', weaponNote: 'Bottomless magazine',
        keys: [['W / S', 'Accelerate / brake'], ['A / D', 'Steer'], ['MOUSE', 'Aim out of the window'], ['LMB', 'Shoot']],
        blockKeys: ['KeyW', 'KeyA', 'KeyS', 'KeyD'],
        map: {
            atmosphere: { skyTop: 0x1e40af, skyBottom: 0xfde68a, fogColor: 0xe9d5a1, fogDensity: 0.0035, sunColor: 0xfff1c1, sunIntensity: 1.6, sunPos: [60, 60, 40], hemiSky: 0xfef3c7, hemiGround: 0x4d7c0f, hemiIntensity: 0.85 },
            boxes: [B(0, -0.5, 0, 420, 1, 420, 'grass')],
            spawn: { x: 0, y: 0, z: 85, yaw: -Math.PI / 2 }
        },
        build(S) {
            K.groundPlane(S, 420, 0x3f6212, 0.002);
            const R = K.rail(LOOP, true, 0.5);
            S.data.R = R;
            // road ribbon along the loop
            const pts = R.curve.getSpacedPoints(400);
            const pos = [];
            for (let i = 0; i < pts.length - 1; i++) {
                const a = pts[i], b = pts[i + 1];
                const d = b.clone().sub(a).normalize();
                const n = V(-d.z, 0, d.x).multiplyScalar(5);
                pos.push(a.x + n.x, 0.03, a.z + n.z, a.x - n.x, 0.03, a.z - n.z, b.x + n.x, 0.03, b.z + n.z, a.x - n.x, 0.03, a.z - n.z, b.x - n.x, 0.03, b.z - n.z, b.x + n.x, 0.03, b.z + n.z);
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            geo.computeVertexNormals();
            S.add(new THREE.Mesh(geo, std(0x374151, 0.9, 0, { side: THREE.DoubleSide })));
            const rnd = L.mulberry32(33);
            for (let i = 0; i < 40; i++) { const t = A.tree(1.2 + rnd()); const a = rnd() * TAU, r = 30 + rnd() * 30; t.position.set(Math.sin(a) * r, 0, Math.cos(a) * r * 0.6); S.add(t); }
            for (let i = 0; i < 16; i++) { const b = A.building(10, 8 + rnd() * 14, 10, [0xd6d3d1, 0xfca5a5, 0xbfdbfe][i % 3], i, 0.3, false); const a = i / 16 * TAU; b.position.set(Math.sin(a) * 185, 6, Math.cos(a) * 125); S.add(b); }
            // the player's car (camera sits in the driver seat)
            const mine = carMesh(0xf8fafc, 0x0f172a);
            const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.3), basic(0x3b82f6)); lightbar.position.set(0, 1.76, -0.3); mine.g.add(lightbar);
            mine.g.traverse((o) => { o.userData.noHit = true; });
            S.add(mine.g);
            const start = R.curve.getPointAt(0), tan = R.curve.getTangentAt(0);
            S.data.car = { g: mine.g, pos: start.clone(), heading: Math.atan2(tan.x, tan.z), speed: 0 };
            // three thieves spread out ahead on the loop
            S.data.thieves = [0.08, 0.13, 0.18].map((u, i) => {
                const m = carMesh([0x111827, 0x7f1d1d, 0x14532d][i], 0x1e293b);
                const driver = F.human({ shirt: 0x111111, mask: 0x0a0a0a, eyes: 'angry' });
                driver.root.scale.setScalar(0.8); driver.root.position.set(0.45, 0.8, -0.3);
                m.g.add(driver.root);
                const tg = S.addTarget({ mesh: m.g, hitMeshes: m.hit.concat(driver.hit), pos: R.curve.getPointAt(u), life: 0, appear: 'none', inT: 0.01, death: 'tumble', deathColor: 0xf97316, bonus: true });
                tg.u = u; tg.hpLeft = 18; tg.speed = 21 + i * 1.5; tg.fireT = 2 + i; tg.far = 0; tg.name = ['VAN DER ROOK', 'SLY MARGO', 'TWO-TONE TEX'][i];
                return tg;
            });
            S.data.downed = 0;
            ride(S.data.car.pos.clone().add(V(0, 0, 0)), 1.45);
        },
        progress: (S) => S.data.downed / 3,
        preUpdate(S, dt, lib, state) {
            const C = S.data.car, P = BO.Player, k = P.keys;
            if (state === 'running' && P.alive) {
                const fwd = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
                if (fwd > 0) C.speed = Math.min(31, C.speed + 13 * dt);
                else if (fwd < 0) C.speed = Math.max(-8, C.speed - 22 * dt);
                else C.speed *= Math.pow(0.6, dt);
                const steer = (k.KeyA ? 1 : 0) - (k.KeyD ? 1 : 0);
                C.heading += steer * dt * 1.5 * clamp01(Math.abs(C.speed) / 8) * Math.sign(C.speed || 1);
            } else C.speed *= Math.pow(0.2, dt);
            C.pos.x += Math.sin(C.heading) * C.speed * dt;
            C.pos.z += Math.cos(C.heading) * C.speed * dt;
            C.pos.x = BO.Math.clamp(C.pos.x, -200, 200); C.pos.z = BO.Math.clamp(C.pos.z, -200, 200);
            C.g.position.copy(C.pos); C.g.rotation.y = C.heading;
            // driver seat: left side of the car, behind the windscreen
            const seat = V(-0.45, 0, -0.2).applyAxisAngle(V(0, 1, 0), C.heading).add(C.pos);
            if (P.rideState) P.rideState.pos.copy(seat);
        },
        update(S, dt, lib, state) {
            const D = S.data, R = D.R, C = D.car;
            if (state !== 'running') return;
            for (const t of D.thieves) {
                if (!t.alive) continue;
                const d = t.root.position.distanceTo(C.pos);
                // rubber band: ease off when far ahead, push when close
                const sp = t.speed * (d > 120 ? 0.8 : d < 25 ? 1.12 : 1);
                t.u = (t.u + sp * dt / R.len) % 1;
                const p = R.curve.getPointAt(t.u), tan = R.curve.getTangentAt(t.u);
                t.root.position.copy(p).add(V(-tan.z, 0, tan.x).multiplyScalar(Math.sin(S.t * 0.7 + t.speed) * 2));
                t.root.rotation.y = Math.atan2(tan.x, tan.z);
                t.fireT -= dt;
                if (t.fireT <= 0 && d < 45) { t.fireT = 2.2 + Math.random() * 1.5; enemyShot(S, t.root.position.clone().add(V(0, 1.6, 0)), 6, 0.35); }
                t.far = d > 170 ? t.far + dt : 0;
                if (t.far > 6) SR.fail(S, t.name + ' GOT AWAY');
            }
            if (D.downed >= 3) SR.done(S, 'ALL THIEVES STOPPED');
        },
        onHit(S, ent, info) {
            if (!ent.alive || ent.hpLeft === undefined) return false;
            S.hits++;
            ent.hpLeft -= info.hitbox === 'head' ? 4 : 1;
            SFX.thunk();
            if (ent.hpLeft <= 0) {
                ent.kill(info);
                S.data.downed++; S.kills++;
                BO.FX.spawnExplosion(ent.root.position.clone().add(V(0, 1, 0)), 3, 0xf97316);
                SFX.rumble(0.5);
                MG.toast(ent.name + ' IS DOWN • ' + (3 - S.data.downed) + ' LEFT', '#86efac');
                return true;
            }
            MG.popup(info.pt, info.hitbox === 'head' ? 'DRIVER HIT!' : String(ent.hpLeft), '#fde68a');
            return false;
        },
        scoreText(S) { return S.data.downed + ' / 3'; },
        hud(S) {
            const C = S.data.car;
            return SR.panel(SR.chip('SPEED', Math.round(Math.abs(C.speed) * 3.6) + ' KM/H') + S.data.thieves.map((t) => t.alive ? SR.chip(t.name, Math.round(t.root.position.distanceTo(C.pos)) + ' m', t.far > 0) : SR.chip(t.name, 'DOWN')).join(''));
        },
        stats: (S) => [['THIEVES DOWN', S.data.downed + ' / 3'], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']]
    });

    /* =====================================================================
       5. SKY SNIPERS
    ===================================================================== */
    const ROOF_Y = 60;
    function planeMesh(col) {
        const g = new THREE.Group();
        const metal = std(col, 0.35, 0.6);
        const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 6, 12), metal); fus.rotation.x = Math.PI / 2; g.add(fus);
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 12), metal); nose.rotation.x = Math.PI / 2; nose.position.z = 3.6; g.add(nose);
        const wing = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, 1.4), metal); wing.position.z = 0.6; g.add(wing);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.8), metal); tail.position.z = -2.7; g.add(tail);
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.9), metal); fin.position.set(0, 0.6, -2.7); g.add(fin);
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.35, roughness: 0.05 }));
        canopy.position.set(0, 0.35, 1.2); canopy.scale.set(1, 1, 1.8); canopy.userData.noHit = true; g.add(canopy);
        const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), std(0xf1c27d, 0.7)); pilot.position.set(0, 0.62, 1.15); pilot.userData.hitbox = 'head'; g.add(pilot);
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8, 0, TAU, 0, Math.PI / 2), std(0x3f3f46, 0.5)); helmet.position.copy(pilot.position).add(V(0, 0.05, 0)); helmet.userData.hitbox = 'head'; g.add(helmet);
        const prop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.05), std(0x111111, 0.5)); prop.position.z = 4.25; prop.userData.noHit = true; g.add(prop);
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        return { g, hit: [pilot, helmet, fus, wing, tail, fin, nose], prop };
    }
    SR.define({
        id: 'sr_skysnipers', order: 5, name: 'Sky Snipers', icon: '✈️', accent: '#64748b',
        tagline: 'Three planes. Three pilots. One rooftop.',
        desc: 'You are stranded on top of a 60-metre tower while three attack planes circle and make strafing runs at you. Their armour shrugs off rifle rounds: only a shot through the canopy into the pilot brings a plane down. Snipe all three pilots. Planes dive closer on their attack runs, which is your best chance and their best chance.',
        heroLabel: 'SPEED RUN • ANTI-AIR SNIPING', stars: [120, 80, 55, 40], timeLimit: 300,
        standardWeapon: 'intervention', weaponLabel: 'INTERVENTION .408', weaponNote: 'Scoped bolt-action • bottomless',
        keys: [['RMB', 'Scope'], ['LMB', 'Fire'], ['WASD', 'Move around the roof']],
        map: {
            atmosphere: { skyTop: 0x0c4a6e, skyBottom: 0xe0f2fe, fogColor: 0xbfdbfe, fogDensity: 0.003, sunColor: 0xffffff, sunIntensity: 1.7, sunPos: [40, 80, 30], hemiSky: 0xe0f2fe, hemiGround: 0x334155, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, 0, 300, 1, 300, 'concrete'), B(0, ROOF_Y / 2, 0, 16, ROOF_Y, 16, 'concrete')],
            spawn: { x: 0, y: ROOF_Y, z: 4, yaw: 0 }
        },
        build(S) {
            const rail = std(0x9ca3af, 0.4, 0.7);
            for (const [x1, z1, x2, z2] of [[-8, -8, 8, -7.8], [-8, 7.8, 8, 8], [-8, -8, -7.8, 8], [7.8, -8, 8, 8]]) {
                const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x2 - x1), 1.1, Math.abs(z2 - z1)), rail);
                m.position.set((x1 + x2) / 2, ROOF_Y + 0.55, (z1 + z2) / 2); S.add(m);
                S.collider(x1, ROOF_Y, z1, x2, ROOF_Y + 3, z2);
            }
            const ac = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.6), std(0x6b7280, 0.5, 0.6)); ac.position.set(-4, ROOF_Y + 0.7, -4); S.add(ac); S.solid(ac);
            S.collider(-5.2, ROOF_Y, -4.8, -2.8, ROOF_Y + 1.4, -3.2);
            const rnd = L.mulberry32(5);
            for (let i = 0; i < 30; i++) { const h = 15 + rnd() * 40; const b = A.building(12, h, 12, [0x475569, 0x64748b, 0x334155][i % 3], i, 0.4, false); const a = rnd() * TAU, r = 30 + rnd() * 110; b.position.set(Math.sin(a) * r, h / 2, Math.cos(a) * r); S.add(b); }
            S.data.planes = [0, 1, 2].map((i) => {
                const m = planeMesh([0x7f1d1d, 0x1e3a8a, 0x3f3f46][i]);
                const tg = S.addTarget({ mesh: m.g, hitMeshes: m.hit, pos: V(0, ROOF_Y + 25, -60), life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true });
                Object.assign(tg, { plane: true, body: m.g, prop: m.prop, r: 50 + i * 14, w: (i % 2 ? -1 : 1) * (0.32 - i * 0.04), a: i * 2.1, alt: ROOF_Y + 12 + i * 6, runT: 7 + i * 4, run: 0, fireT: 0, down: false, vy: 0, name: ['RED BARON', 'BLUE JAY', 'IRON KITE'][i] });
                return tg;
            });
            S.data.downed = 0;
            S.data.armorHits = 0;
        },
        progress: (S) => S.data.downed / 3,
        update(S, dt, lib, state) {
            const D = S.data;
            const run = state === 'running';
            for (const p of D.planes) {
                p.prop.rotation.z += dt * 40;
                if (p.down) {
                    p.vy -= 9 * dt;
                    p.root.position.y += p.vy * dt;
                    p.root.position.x += Math.sin(p.root.rotation.y) * 20 * dt;
                    p.root.position.z += Math.cos(p.root.rotation.y) * 20 * dt;
                    p.body.rotation.z += dt * 2;
                    if (Math.random() < 0.7) BO.FX.spawnParticles(p.root.position, 2, 0x1f2937, 2, -1, 0.8, 1.6);
                    if (p.root.position.y < 2 && !p.crashed) { p.crashed = true; BO.FX.spawnExplosion(p.root.position.clone(), 6, 0xf97316); SFX.rumble(0.4); p.remove(); }
                    continue;
                }
                if (!run) continue;
                p.runT -= dt;
                if (p.runT <= 0 && !p.run) { p.run = 5; p.runT = 11 + Math.random() * 4; MG.toast(p.name + ' IS STRAFING!', '#fca5a5'); }
                const radius = p.run > 0 ? 22 : p.r, alt = p.run > 0 ? ROOF_Y + 8 : p.alt;
                p.curR = (p.curR || p.r) + (radius - (p.curR || p.r)) * Math.min(1, dt * 0.9);
                p.curAlt = (p.curAlt || p.alt) + (alt - (p.curAlt || p.alt)) * Math.min(1, dt * 0.9);
                const spd = 26;
                p.a += (spd / p.curR) * Math.sign(p.w) * dt;
                const x = Math.cos(p.a) * p.curR, z = Math.sin(p.a) * p.curR;
                const nx = Math.cos(p.a + Math.sign(p.w) * 0.05) * p.curR, nz = Math.sin(p.a + Math.sign(p.w) * 0.05) * p.curR;
                p.root.position.set(x, p.curAlt, z);
                p.root.rotation.y = Math.atan2(nx - x, nz - z);
                p.body.rotation.z = Math.sign(p.w) * (p.run > 0 ? 0.95 : 0.8);       // hard bank: the canopy tilts towards the tower
                if (p.run > 0) {
                    p.run -= dt;
                    p.fireT -= dt;
                    if (p.fireT <= 0) { p.fireT = 0.4; enemyShot(S, p.root.position.clone(), 9, 0.4); }
                }
            }
        },
        onHit(S, ent, info) {
            if (!ent.plane || ent.down) return false;
            S.hits++;
            if (info.hitbox !== 'head') {
                S.data.armorHits++;
                MG.popup(info.pt, 'ARMOURED — HIT THE PILOT', '#cbd5e1');
                BO.FX.spawnParticles(info.pt, 6, 0xfde68a, 3, 4, 0.3, 0.8);
                SFX.bonk();
                return false;
            }
            ent.down = true;
            ent.hitMeshes = [];
            S.data.downed++; S.kills++; S.headshots++;
            S.data.lastDown = S.t;
            MG.toast('PILOT DOWN — ' + ent.name + ' • ' + (3 - S.data.downed) + ' LEFT', '#86efac');
            SFX.ding(1.2);
            if (S.data.downed >= 3) SR.done(S, 'SKIES CLEAR');
            return true;
        },
        scoreText(S) { return S.data.downed + ' / 3'; },
        hud(S) { return SR.panel(S.data.planes.map((p) => SR.chip(p.name, p.down ? 'DOWN' : p.run > 0 ? 'ATTACKING' : Math.round(p.root.position.distanceTo(BO.Player.pos)) + ' m', p.run > 0 && !p.down)).join('')); },
        stats: (S) => [['PILOTS', S.data.downed + ' / 3'], ['ARMOUR HITS', S.data.armorHits], ['SHOTS', S.shots]]
    });

    /* =====================================================================
       7. FREEFALL
    ===================================================================== */
    const START_ALT = 1000, FALL = 26, FOES = 14;
    SR.define({
        id: 'sr_freefall', order: 7, name: 'Freefall', icon: '🪂', accent: '#f97316',
        tagline: 'Clear the sky before you hit the ground.',
        desc: 'You jump at 1,000 metres with 14 enemy skydivers falling alongside you, drifting above and below and shooting back. Steer with WASD, aim anywhere and take them all out before you reach the ground. Your parachute opens only once the sky is clear. Run out of altitude and it is over.',
        heroLabel: 'SPEED RUN • SKYDIVE', stars: [34, 29, 25, 21], timeLimit: 60,
        standardWeapon: 'vector_kriss', weaponLabel: 'VECTOR', weaponNote: 'Bottomless magazine',
        keys: [['WASD', 'Steer the dive'], ['MOUSE', 'Aim in any direction'], ['LMB', 'Shoot']],
        blockKeys: ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyC', 'ControlLeft'],
        map: {
            atmosphere: { skyTop: 0x1d4ed8, skyBottom: 0xdbeafe, fogColor: 0xc7d8f0, fogDensity: 0.0012, sunColor: 0xffffff, sunIntensity: 1.8, sunPos: [50, 100, 30], hemiSky: 0xe0f2fe, hemiGround: 0x365314, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, 0, 600, 1, 600, 'grass')],
            spawn: { x: 0, y: START_ALT, z: 0, yaw: 0 }
        },
        build(S) {
            const fields = L.canvasTex('ff-fields', 512, 512, (g, w, h) => {
                const rnd = L.mulberry32(9);
                for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = ['#4d7c0f', '#65a30d', '#a16207', '#3f6212', '#ca8a04'][Math.floor(rnd() * 5)]; g.fillRect(x * 64, y * 64, 64, 64); }
                g.strokeStyle = '#78716c'; g.lineWidth = 4; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
            });
            fields.wrapS = fields.wrapT = THREE.RepeatWrapping; fields.repeat.set(4, 4);
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ map: fields, roughness: 1 }));
            ground.rotation.x = -Math.PI / 2; ground.position.y = 0.01; S.add(ground);
            // cloud banks at fixed altitudes for a sense of speed
            const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
            for (let k = 0; k < 6; k++) {
                const alt = 150 + k * 140;
                for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(8 + Math.random() * 8, 10, 6), cloudMat); c.scale.y = 0.35; const a = Math.random() * TAU, r = 15 + Math.random() * 70; c.position.set(Math.cos(a) * r, alt + (Math.random() - 0.5) * 20, Math.sin(a) * r); S.add(c); }
            }
            const pos = V(0, START_ALT, 0);
            S.data.me = { pos, vx: 0, vz: 0, chute: false };
            ride(pos.clone(), 1.6);
            BO.Player.pitch = -0.7;
            S.data.foes = [];
            for (let i = 0; i < FOES; i++) {
                const fig = F.human({ shirt: [0x7f1d1d, 0x1f2937, 0x14532d][i % 3], pants: 0x111827, mask: 0x0a0a0a, eyes: 'angry', gun: 'rifle' });
                fig.parts.armL.rotation.z = -1.3; fig.parts.armR.rotation.z = 1.3;
                fig.root.rotation.x = -1.2;
                const a = i / FOES * TAU, r = 10 + (i % 4) * 7;
                const tg = S.addTarget({ mesh: fig.root, hitMeshes: fig.hit, pos: V(Math.cos(a) * r, START_ALT - 25 + (i % 5) * 12, Math.sin(a) * r), life: 0, appear: 'none', inT: 0.01, death: 'fall', deathColor: 0x7f1d1d, hp: 2, bonus: true });
                Object.assign(tg, { foe: true, rel: V(Math.cos(a) * r, -25 + (i % 5) * 12, Math.sin(a) * r), vy: (Math.random() - 0.5) * 6, wander: Math.random() * TAU, fireT: 2 + Math.random() * 3, hpLeft: 2 });
                S.data.foes.push(tg);
            }
            S.data.downed = 0;
        },
        progress: (S) => S.data.downed / FOES,
        preUpdate(S, dt, lib, state) {
            const me = S.data.me, P = BO.Player, k = P.keys;
            if (state === 'running') {
                const yaw = P.yaw;
                const f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
                const ax = -Math.sin(yaw) * f + Math.cos(yaw) * s, az = -Math.cos(yaw) * f - Math.sin(yaw) * s;
                me.vx += (ax * 10 - me.vx) * Math.min(1, dt * 2); me.vz += (az * 10 - me.vz) * Math.min(1, dt * 2);
                me.pos.x = BO.Math.clamp(me.pos.x + me.vx * dt, -120, 120);
                me.pos.z = BO.Math.clamp(me.pos.z + me.vz * dt, -120, 120);
                me.pos.y = Math.max(1.0, me.pos.y - (me.chute ? 5 : FALL) * dt);
            } else if (state === 'finish' && me.chute) me.pos.y = Math.max(1.0, me.pos.y - 5 * dt);
            if (P.rideState) { P.rideState.pos.copy(me.pos); P.rideState.roll = Math.sin(S.t * 1.7) * 0.03; }
        },
        update(S, dt, lib, state) {
            const D = S.data, me = D.me;
            if (state !== 'running') return;
            for (const f of D.foes) {
                if (!f.alive) continue;
                f.wander += dt * 0.6;
                f.rel.x += Math.cos(f.wander) * 2 * dt; f.rel.z += Math.sin(f.wander * 1.3) * 2 * dt;
                f.rel.y += f.vy * dt;
                if (f.rel.y > 45 || f.rel.y < -45) f.vy = -Math.sign(f.rel.y) * Math.abs(f.vy || 2);
                const h = Math.hypot(f.rel.x, f.rel.z);
                if (h > 40) { f.rel.x *= 40 / h; f.rel.z *= 40 / h; }
                f.root.position.set(me.pos.x + f.rel.x, Math.max(0.5, me.pos.y + f.rel.y), me.pos.z + f.rel.z);
                f.root.rotation.y = Math.atan2(me.pos.x - f.root.position.x, me.pos.z - f.root.position.z);
                f.fireT -= dt;
                if (f.fireT <= 0) { f.fireT = 2.5 + Math.random() * 2; enemyShot(S, f.root.position.clone().add(V(0, 0.4, 0)), 5, 0.3); }
            }
            const alt = me.pos.y;
            if (D.downed >= FOES && !me.chute) {
                me.chute = true;
                SR.done(S, 'SKY CLEAR — CHUTE OPEN');
            } else if (alt <= 1.01 && !me.chute) {
                BO.FX.spawnExplosion(me.pos.clone(), 3, 0xa16207);
                SR.fail(S, 'YOU HIT THE GROUND');
            }
        },
        onHit(S, ent, info) {
            if (!ent.foe || !ent.alive) return false;
            S.hits++;
            ent.hpLeft -= info.hitbox === 'head' ? 2 : 1;
            if (ent.hpLeft > 0) { SFX.thunk(); return false; }
            ent.kill(info);
            S.data.downed++; S.kills++;
            if (info.hitbox === 'head') S.headshots++;
            S.bumpCombo();
            SFX.ding(1.1);
            return true;
        },
        scoreText(S) { return S.data.downed + ' / ' + FOES; },
        hud(S) {
            const alt = Math.round(S.data.me.pos.y);
            return SR.panel(SR.chip('ALTITUDE', alt + ' m', alt < 250 && !S.data.me.chute) + SR.chip('ENEMIES LEFT', FOES - S.data.downed) + SR.chip('TIME TO GROUND', S.data.me.chute ? 'CHUTE' : (alt / FALL).toFixed(1) + 's', alt < 250 && !S.data.me.chute));
        },
        stats: (S) => [['ENEMIES', S.data.downed + ' / ' + FOES], ['ALTITUDE LEFT', Math.round(S.data.me.pos.y) + ' m'], ['HEADSHOTS', S.headshots]]
    });
})(window);
