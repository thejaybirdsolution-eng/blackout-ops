/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Speed Runs (part 2)
     3. Getaway Chase — Open-windshield Interceptor, tire hitboxes, guardrails
     5. Sky Snipers   — Night Skyline, Pilot Seat Target, cover LOS & lead HUD
     7. Freefall      — Smooth thermal updrafts, 3D sunset peaks & chute canopy
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

    function ride(pos, eye = 1.6) { BO.Player.rideState = { kind: 'minigame', pos, roll: 0, pitch: 0, eye }; }

    function enemyShot(S, from, dmg, hitChance, coverMeshes) {
        const cam = BO.App.worldCamera.position;
        if (coverMeshes && coverMeshes.length) {
            const blk = SR.rayBlocked(from, cam, coverMeshes);
            if (blk) {
                BO.FX.spawnTracer(from, blk.point, 0xff6b3d, 0.03, 0.09);
                BO.FX.spawnParticles(blk.point, 6, 0xfde047, 4.5, 6, 0.25, 0.85);
                SFX.clack();
                return;
            }
        }
        const hit = Math.random() < hitChance;
        const to = cam.clone().add(hit ? V(0, -0.3, 0) : V((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 4));
        BO.FX.spawnTracer(from, to, 0xff6b3d, 0.03, 0.09);
        SFX.noise(0.1, 1200, 'bandpass', 0.8, 0.25);
        if (hit && BO.Player.alive) BO.Player.takeDamage(dmg, from, false);
    }

    function carMesh(body, roof) {
        const g = new THREE.Group();
        const b = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.78, 4.6), std(body, 0.3, 0.6)); b.position.y = 0.68; g.add(b);
        const c = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.58, 2.2), std(roof, 0.18, 0.5)); c.position.set(0, 1.36, -0.25); g.add(c);
        const glassM = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });
        const fGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 0.48), glassM);
        fGlass.position.set(0, 1.36, 0.86); fGlass.rotation.x = -0.25; g.add(fGlass);
        for (const sx of [-0.72, 0.72]) {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.06), basic(0xfef08a)); hl.position.set(sx, 0.72, 2.31);
            const tl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.06), basic(0xef4444)); tl.position.set(sx, 0.74, -2.31);
            g.add(hl, tl);
        }
        const tireM = std(0x111111, 0.85), rimM = std(0x94a3b8, 0.3, 0.8);
        const wheels = [];
        const wheelCoords = [[-1.08, 1.45], [1.08, 1.45], [-1.08, -1.45], [1.08, -1.45]];
        for (let wi = 0; wi < wheelCoords.length; wi++) {
            const [wx, wz] = wheelCoords[wi];
            const wg = new THREE.Group(); wg.position.set(wx, 0.42, wz);
            const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 14), tireM);
            w.rotation.z = Math.PI / 2; w.userData.tireIdx = wi;
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 8), rimM);
            rim.rotation.z = Math.PI / 2; rim.userData.tireIdx = wi;
            wg.add(w, rim); g.add(wg);
            wheels.push({ wg, w, rim, blown: false });
        }
        return { g, hit: [b, c], wheels, wheelHits: wheels.map((wh) => wh.w) };
    }

    function buildPlayerInterceptor() {
        const g = new THREE.Group();
        const whiteM = std(0xf8fafc, 0.28, 0.5), darkM = std(0x0f172a, 0.45, 0.6), dashM = std(0x1e293b, 0.7, 0.3);
        const hood = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.56, 1.85), whiteM); hood.position.set(0, 0.66, 1.38);
        const tub = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.52, 2.75), darkM); tub.position.set(0, 0.52, -0.92);
        const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.42, 1.05), whiteM); rearDeck.position.set(0, 0.88, -1.78);
        const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 1.9), whiteM); doorL.position.set(-0.99, 0.92, -0.25);
        const doorR = doorL.clone(); doorR.position.x = 0.99;
        // Thin A-pillars & open ultra-clear tinted windshield (zero roof box blocking camera!)
        const pilL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.75, 0.08), darkM);
        pilL.position.set(-0.92, 1.32, 0.48); pilL.rotation.x = 0.48;
        const pilR = pilL.clone(); pilR.position.x = 0.92;
        const header = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.08, 0.1), darkM);
        header.position.set(0, 1.66, 0.31);
        const windshield = new THREE.Mesh(
            new THREE.PlaneGeometry(1.80, 0.72),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })
        );
        windshield.position.set(0, 1.31, 0.49); windshield.rotation.x = -1.08;
        // Side Mirrors
        for (const sx of [-1.14, 1.14]) {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.08), darkM); arm.position.set(sx * 0.94, 1.12, 0.42);
            const mir = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.1), darkM); mir.position.set(sx, 1.15, 0.42);
            g.add(arm, mir);
        }
        // Visible Interior Dashboard + Glowing Digital Speedo + Steering Wheel
        const dash = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.28, 0.44), dashM); dash.position.set(0, 0.96, 0.56);
        const gauge = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.11), basic(0x22d3ee)); gauge.position.set(-0.45, 1.04, 0.33);
        const steerGrp = new THREE.Group(); steerGrp.position.set(-0.45, 1.04, 0.18); steerGrp.rotation.x = -0.45;
        const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 18), darkM);
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.02), std(0x64748b, 0.4, 0.7));
        steerGrp.add(wheelRim, spoke);
        // Rear Roof Rollbar + Flashing Hood & Rear LED Lightbars
        const rollbar = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.1, 0.14), darkM); rollbar.position.set(0, 1.68, -0.95);
        for (const sx of [-0.88, 0.88]) {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.82, 0.12), darkM); post.position.set(sx, 1.28, -0.95); g.add(post);
        }
        const lightL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.22), basic(0xef4444)); lightL.position.set(-0.32, 1.76, -0.95);
        const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.22), basic(0x3b82f6)); lightR.position.set(0.32, 1.76, -0.95);
        const hoodLedL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.12), basic(0xef4444)); hoodLedL.position.set(-0.36, 0.98, 0.88);
        const hoodLedR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.12), basic(0x3b82f6)); hoodLedR.position.set(0.36, 0.98, 0.88);
        for (const sx of [-0.72, 0.72]) {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.06), basic(0xfef08a)); hl.position.set(sx, 0.72, 2.31);
            g.add(hl);
        }
        const tireM = std(0x111111, 0.85), rimM = std(0x94a3b8, 0.3, 0.8);
        const wheels = [];
        for (const [wx, wz] of [[-1.08, 1.48], [1.08, 1.48], [-1.08, -1.48], [1.08, -1.48]]) {
            const wg = new THREE.Group(); wg.position.set(wx, 0.42, wz);
            const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 14), tireM); w.rotation.z = Math.PI / 2;
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 8), rimM); rim.rotation.z = Math.PI / 2;
            wg.add(w, rim); g.add(wg);
            wheels.push(wg);
        }
        g.add(hood, tub, rearDeck, doorL, doorR, pilL, pilR, header, windshield, dash, gauge, steerGrp, rollbar, lightL, lightR, hoodLedL, hoodLedR);
        return { g, steerGrp, lightL, lightR, hoodLedL, hoodLedR, wheels };
    }

    /* =====================================================================
       3. GETAWAY CHASE — Open-Windshield Interceptor, Tire Hitboxes & Guardrails
    ===================================================================== */
    const ROUTE_PTS = [
        V(0, 0, 0), V(0, 0, -260), V(18, 0, -520), V(26, 0, -820),
        V(-16, 0, -1120), V(-45, 0, -1420), V(0, 0, -1680)
    ];
    SR.define({
        id: 'sr_chase', order: 3, name: 'Getaway Chase', icon: '🚓', accent: '#3b82f6', music: 'hoverbike',
        tagline: 'Chase them down a busy City Street, onto the Highway, then Off-Road!',
        desc: 'Three getaway cars are tearing out of downtown! Drive an open-windshield Police Interceptor down a busy City Street, merge onto a Multi-Lane Highway, and pursue into Red-Rock Canyon. Shoot out getaway TIRES (-35% speed + spinout) or eliminate the crews!',
        heroLabel: 'SPEED RUN • 3-ACT LINEAR CHASE', stars: [150, 115, 88, 68], timeLimit: 320,
        standardWeapon: 'mp5', weaponLabel: 'MP5', weaponNote: 'Bottomless magazine',
        keys: [['W / S', 'Accelerate / brake'], ['A / D', 'Steer through traffic'], ['MOUSE', 'Aim out of the windshield'], ['LMB', 'Shoot tires & drivers']],
        blockKeys: ['KeyW', 'KeyA', 'KeyS', 'KeyD'],
        map: {
            atmosphere: { skyTop: 0x1e40af, skyBottom: 0xfde68a, fogColor: 0xe9d5a1, fogDensity: 0.0022, sunColor: 0xfff1c1, sunIntensity: 1.6, sunPos: [60, 80, -300], hemiSky: 0xfef3c7, hemiGround: 0x78350f, hemiIntensity: 0.88 },
            skybox: 'skybox-day.png',
            boxes: [B(0, -0.5, -840, 260, 1, 1900, 'grass')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 1900, 0x78350f, 0.002);
            const R = K.rail(ROUTE_PTS, false, 0.5);
            S.data.R = R;
            const pts = R.curve.getSpacedPoints(380);
            const posCity = [], posDirt = [];
            for (let i = 0; i < pts.length - 1; i++) {
                const a = pts[i], b = pts[i + 1], u = i / pts.length;
                const d = b.clone().sub(a).normalize(), n = V(-d.z, 0, d.x).multiplyScalar(u < 0.70 ? 6.8 : 6.4);
                const tgt = u < 0.70 ? posCity : posDirt;
                tgt.push(a.x + n.x, 0.03, a.z + n.z, a.x - n.x, 0.03, a.z - n.z, b.x + n.x, 0.03, b.z + n.z, a.x - n.x, 0.03, a.z - n.z, b.x - n.x, 0.03, b.z - n.z, b.x + n.x, 0.03, b.z + n.z);
            }
            const mkRoad = (arr, col) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); S.add(new THREE.Mesh(g, std(col, 0.9, 0, { side: THREE.DoubleSide }))); };
            mkRoad(posCity, 0x334155); mkRoad(posDirt, 0x92400e);

            // Dashed Center Lane Markings + Edge Guardrails (City & Highway)
            const dashGeo = new THREE.PlaneGeometry(0.32, 3.8);
            const dashMat = basic(0xfde047, { side: THREE.DoubleSide });
            const railMat = std(0x64748b, 0.45, 0.7);
            const railGeo = new THREE.BoxGeometry(0.28, 0.75, 5.2);
            const dashInst = new THREE.InstancedMesh(dashGeo, dashMat, 110);
            const railInst = new THREE.InstancedMesh(railGeo, railMat, 220);
            const dm = new THREE.Object3D();
            let dIdx = 0, rIdx = 0;
            for (let i = 0; i < 110; i++) {
                const u = 0.01 + (i / 110) * 0.68;
                const p = R.curve.getPointAt(u), t = R.curve.getTangentAt(u), n = V(-t.z, 0, t.x);
                const yaw = Math.atan2(t.x, t.z);
                dm.position.set(p.x, 0.045, p.z); dm.rotation.set(-Math.PI / 2, 0, -yaw); dm.updateMatrix();
                dashInst.setMatrixAt(dIdx++, dm.matrix);
                for (const s of [-1, 1]) {
                    dm.position.set(p.x + n.x * s * 7.0, 0.38, p.z + n.z * s * 7.0);
                    dm.rotation.set(0, yaw, 0); dm.updateMatrix();
                    railInst.setMatrixAt(rIdx++, dm.matrix);
                }
            }
            dashInst.instanceMatrix.needsUpdate = true;
            railInst.instanceMatrix.needsUpdate = true;
            S.add(dashInst, railInst);

            // ACT 1: Busy City Buildings & Streetlights (u = 0.02..0.34)
            const rnd = L.mulberry32(33);
            const subBldA = [], subBldB = [], indBld = [];
            for (let i = 0; i < 36; i++) {
                const u = 0.02 + (i / 36) * 0.32, p = R.curve.getPointAt(u), t = R.curve.getTangentAt(u), n = V(-t.z, 0, t.x);
                const yaw = Math.atan2(t.x, t.z);
                for (const s of [-1, 1]) {
                    const h = 14 + rnd() * 22;
                    const bp = p.clone().addScaledVector(n, s * 16);
                    if (i % 3 === 0) indBld.push({ pos: [bp.x, 0, bp.z], rot: yaw + (s > 0 ? Math.PI : 0), scale: [5.5, h * 0.45, 5.5] });
                    else if (i % 2 === 0) subBldA.push({ pos: [bp.x, 0, bp.z], rot: yaw + (s > 0 ? -Math.PI / 2 : Math.PI / 2), scale: [5.2, h * 0.4, 5.2] });
                    else subBldB.push({ pos: [bp.x, 0, bp.z], rot: yaw + (s > 0 ? -Math.PI / 2 : Math.PI / 2), scale: [5.2, h * 0.4, 5.2] });
                }
            }
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/city_suburban_kit/building-type-a.glb', subBldA);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/city_suburban_kit/building-type-c.glb', subBldB);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/city_industrial_kit/building-a.glb', indBld);

            // ACT 2: Highway Concrete Barriers, Green Gantries WITH Solid Support Pillars & Nitro Strips (u = 0.35..0.69)
            S.data.boosts = [];
            const pillarM = std(0x475569, 0.55, 0.5);
            for (let i = 0; i < 7; i++) {
                const u = 0.36 + i * 0.05, p = R.curve.getPointAt(u), t = R.curve.getTangentAt(u);
                const arch = new THREE.Group();
                const bar = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.65, 0.55), std(0x065f46, 0.4, 0.4)); bar.position.y = 5.6;
                const light = new THREE.Mesh(new THREE.BoxGeometry(11, 0.25, 0.25), basic(0x38bdf8)); light.position.y = 5.1;
                const pL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 5.8, 0.65), pillarM); pL.position.set(-7.3, 2.9, 0);
                const pR = pL.clone(); pR.position.x = 7.3;
                arch.add(bar, light, pL, pR); arch.position.copy(p); arch.lookAt(p.clone().add(t)); S.add(arch);
                const pad = new THREE.Mesh(new THREE.PlaneGeometry(5, 8), basic(0x0ea5e9));
                pad.rotation.x = -Math.PI / 2; pad.rotation.z = -Math.atan2(t.x, t.z); pad.position.copy(p).add(V(0, 0.06, 0));
                S.add(pad); S.data.boosts.push({ pos: p.clone(), cd: 0 });
            }
            const hwySg = A.sign('INTERSTATE HIGHWAY -> OFF-ROAD CANYON', 9, 1.4, { bg: '#064e3b', color: '#ffffff', borderColor: '#fde047', size: 0.46 });
            const hp = R.curve.getPointAt(0.35); hwySg.position.set(hp.x, 6.2, hp.z); S.add(hwySg);

            // ACT 3: Off-Road Red-Rock Canyon Cliffs (u = 0.70..0.99)
            const rockM = std(0xb45309, 0.92);
            for (let i = 0; i < 28; i++) {
                const u = 0.70 + (i / 28) * 0.29, p = R.curve.getPointAt(u), t = R.curve.getTangentAt(u), n = V(-t.z, 0, t.x);
                for (const s of [-1, 1]) {
                    const c = new THREE.Mesh(new THREE.DodecahedronGeometry(6 + rnd() * 5, 0), rockM);
                    c.position.copy(p).addScaledVector(n, s * 14).add(V(0, 4, 0)); S.add(c);
                }
            }
            const finP = R.curve.getPointAt(0.99);
            const finSg = A.sign('ROADBLOCK — END OF TRAIL', 10, 1.8, { bg: '#7f1d1d', color: '#fef08a', borderColor: '#ef4444', size: 0.48 });
            finSg.position.set(finP.x, 4.5, finP.z); S.add(finSg);
            const gPts = [];
            for (let gx = -4.2; gx <= 4.2; gx += 1.05) gPts.push(V(hp.x + gx, 5.4, hp.z), V(finP.x + gx, 5.5, finP.z));
            const gb = A.bulbs(gPts, [0x38bdf8, 0xfacc15, 0xef4444], 0.14); S.add(gb); A.animateBulbs(S, gb, 7, 'chase');

            // Moving Civilian Traffic
            S.data.traffic = [];
            for (let i = 0; i < 12; i++) {
                const tu = 0.04 + (i / 12) * 0.62;
                const lane = (i % 2 ? 3.2 : -3.2);
                const cm = carMesh([0x64748b, 0xfef08a, 0x0284c7, 0xdc2626][i % 4], 0x334155);
                cm.g.traverse((o) => { o.userData.noHit = true; });
                S.add(cm.g);
                S.data.traffic.push({ g: cm.g, wheels: cm.wheels, u: tu, lane, spd: 11 + (i % 3) * 3 });
            }

            // Player's Open-Windshield Police Interceptor
            const mine = buildPlayerInterceptor();
            const sirenLight = BO.Settings.getQualityPreset().pointLights ? new THREE.PointLight(0xef4444, 1.5, 22, 1.4) : null;
            if (sirenLight) { sirenLight.position.set(0, 2.2, -0.95); mine.g.add(sirenLight); }
            S.animate(() => {
                const on = Math.floor(performance.now() / 160) % 2;
                mine.lightL.material = basic(on ? 0xef4444 : 0x450a0a); mine.lightR.material = basic(on ? 0x1e3a8a : 0x38bdf8);
                mine.hoodLedL.material = basic(on ? 0xef4444 : 0x450a0a); mine.hoodLedR.material = basic(on ? 0x1e3a8a : 0x38bdf8);
                if (sirenLight) sirenLight.color.setHex(on ? 0xef4444 : 0x3b82f6);
            });
            mine.g.traverse((o) => { o.userData.noHit = true; }); S.add(mine.g);
            const start = R.curve.getPointAt(0.01), tan = R.curve.getTangentAt(0.01);
            S.data.car = { g: mine.g, rig: mine, pos: start.clone(), u: 0.01, heading: Math.atan2(tan.x, tan.z), speed: 0, wheelRot: 0 };

            // 3 Getaway Cars with Shootable Tire Hitboxes & 4 Crew Members!
            S.data.thieves = [0.06, 0.095, 0.13].map((u, i) => {
                const m = carMesh([0x111827, 0x7f1d1d, 0x14532d][i], 0x1e293b);
                const seatOffsets = [[-0.44, 0.85, 0.25], [0.44, 0.85, 0.25], [-0.44, 0.85, -0.75], [0.44, 0.85, -0.75]];
                const occupants = seatOffsets.map((pos, oi) => {
                    const occ = F.human({ shirt: oi === 0 ? 0xdc2626 : 0x1f2937, mask: 0x0a0a0a, eyes: 'angry' });
                    occ.root.scale.setScalar(0.76);
                    occ.root.position.set(pos[0], pos[1], pos[2]);
                    occ.hit.forEach((hm) => { hm.userData.occIdx = oi; });
                    m.g.add(occ.root);
                    return { fig: occ, hp: 6, alive: true, role: ['DRIVER', 'SHOTGUN', 'REAR-L', 'REAR-R'][oi] };
                });
                const allHits = m.hit.concat(m.wheelHits, ...occupants.map((o) => o.fig.hit));
                const tg = S.addTarget({ mesh: m.g, hitMeshes: allHits, pos: R.curve.getPointAt(u), life: 0, appear: 'none', inT: 0.01, death: 'tumble', deathColor: 0xf97316, bonus: true });
                tg.u = u; tg.hpLeft = 90; tg.maxHp = 90; tg.occupants = occupants; tg.occAlive = 4;
                tg.wheels = m.wheels; tg.tires = [2, 2, 2, 2]; tg.blownCount = 0; tg.speedMult = 1.0; tg.wobbleT = 0;
                tg.speed = 21 + i * 1.4; tg.fireT = 2 + i; tg.name = ['VAN DER ROOK', 'SLY MARGO', 'TWO-TONE TEX'][i];
                return tg;
            });
            S.data.downed = 0; S.data.act = 'CITY STREET'; S.data.sirenT = 0.2; S.data.sirenPhase = 0;
            ride(S.data.car.pos.clone(), 1.45);
        },
        progress: (S) => S.data.downed / 3,
        preUpdate(S, dt, lib, state) {
            const C = S.data.car, P = BO.Player, k = P.keys, R = S.data.R;
            const steer = state === 'running' && P.alive ? ((k.KeyA ? 1 : 0) - (k.KeyD ? 1 : 0)) : 0;
            if (state === 'running' && P.alive) {
                const fwd = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
                if (fwd > 0) C.speed = Math.min(34, C.speed + 14 * dt);
                else if (fwd < 0) C.speed = Math.max(-8, C.speed - 22 * dt);
                else C.speed *= Math.pow(0.6, dt);
                C.heading += steer * dt * 1.55 * clamp01(Math.abs(C.speed) / 8) * Math.sign(C.speed || 1);
                for (const bp of S.data.boosts || []) {
                    if (bp.cd > 0) bp.cd -= dt;
                    else if (C.pos.distanceTo(bp.pos) < 5.5) { bp.cd = 4; C.speed = Math.min(42, C.speed + 12); SFX.whoosh(0.26); MG.toast('HIGHWAY NITRO!', '#38bdf8'); }
                }
            } else C.speed *= Math.pow(0.2, dt);

            C.pos.x += Math.sin(C.heading) * C.speed * dt;
            C.pos.z += Math.cos(C.heading) * C.speed * dt;

            // Enforce Road Corridor Guardrail Collision along R.curve
            let bestU = C.u, bestD2 = Infinity;
            const uMin = Math.max(0.002, C.u - 0.04), uMax = Math.min(0.995, C.u + 0.04);
            for (let s = 0; s <= 24; s++) {
                const u = uMin + (s / 24) * (uMax - uMin);
                const pt = R.curve.getPointAt(u);
                const d2 = (C.pos.x - pt.x) ** 2 + (C.pos.z - pt.z) ** 2;
                if (d2 < bestD2) { bestD2 = d2; bestU = u; }
            }
            C.u = bestU;
            const roadPt = R.curve.getPointAt(C.u), roadTan = R.curve.getTangentAt(C.u);
            const roadN = V(-roadTan.z, 0, roadTan.x);
            const lat = (C.pos.x - roadPt.x) * roadN.x + (C.pos.z - roadPt.z) * roadN.z;
            const maxLat = C.u < 0.70 ? 6.1 : 6.9;
            if (Math.abs(lat) > maxLat) {
                const sign = Math.sign(lat);
                const excess = Math.abs(lat) - maxLat;
                C.pos.x -= roadN.x * sign * excess;
                C.pos.z -= roadN.z * sign * excess;
                const roadYaw = Math.atan2(roadTan.x, roadTan.z);
                const yawDiff = Math.atan2(Math.sin(C.heading - roadYaw), Math.cos(C.heading - roadYaw));
                C.heading -= yawDiff * Math.min(1, dt * 8 + 0.25);
                if (state === 'running' && Math.abs(C.speed) > 8) {
                    C.speed *= 0.85;
                    SFX.bonk();
                    BO.FX.spawnParticles(C.pos.clone().add(V(roadN.x * sign * 1.1, 0.5, roadN.z * sign * 1.1)), 5, 0xfacc15, 4, 5, 0.25, 0.8);
                }
            }
            C.pos.z = BO.Math.clamp(C.pos.z, -1690, 20);
            C.g.position.copy(C.pos); C.g.rotation.y = C.heading;
            S.data.act = C.u < 0.35 ? 'CITY STREET' : C.u < 0.70 ? 'HIGHWAY' : 'OFF-ROAD CANYON';

            // Animate interceptor steering wheel, front wheels & tire spin
            C.wheelRot += C.speed * dt * 2.4;
            if (C.rig) {
                C.rig.steerGrp.rotation.z = steer * 0.55;
                for (let wi = 0; wi < C.rig.wheels.length; wi++) {
                    const wh = C.rig.wheels[wi];
                    wh.rotation.y = wi < 2 ? steer * 0.32 : 0;
                    wh.children[0].rotation.x = C.wheelRot;
                    wh.children[1].rotation.x = C.wheelRot;
                }
            }
            if (state === 'running' && Math.abs(C.speed) > 10 && Math.random() < dt * 16) {
                const dustCol = C.u >= 0.70 ? 0xb45309 : 0x94a3b8;
                BO.FX.spawnParticles(C.pos.clone().add(V(-Math.sin(C.heading) * 2.1, 0.22, -Math.cos(C.heading) * 2.1)), 1, dustCol, 1.4, 1.2, 0.35, 1.0);
            }

            // Update civilian traffic
            for (const tf of S.data.traffic || []) {
                tf.u += tf.spd * dt / R.len; if (tf.u > 0.69) tf.u = 0.02;
                const p = R.curve.getPointAt(tf.u), tan = R.curve.getTangentAt(tf.u);
                tf.g.position.copy(p).add(V(-tan.z, 0, tan.x).multiplyScalar(tf.lane));
                tf.g.rotation.y = Math.atan2(tan.x, tan.z);
                for (const wh of tf.wheels || []) wh.w.rotation.x += tf.spd * dt * 2.2;
                if (state === 'running' && C.pos.distanceTo(tf.g.position) < 3.0) { C.speed = Math.min(C.speed, 10); SFX.bonk(); }
            }
            const seat = V(-0.45, 0, -0.2).applyAxisAngle(V(0, 1, 0), C.heading).add(C.pos);
            if (P.rideState) P.rideState.pos.copy(seat);
        },
        update(S, dt, lib, state) {
            const D = S.data, R = D.R, C = D.car;
            if (state !== 'running') return;
            D.sirenT -= dt;
            if (D.sirenT <= 0) {
                D.sirenT = 0.48;
                D.sirenPhase = 1 - D.sirenPhase;
                SFX.tone(D.sirenPhase ? 740 : 560, D.sirenPhase ? 790 : 520, 0.42, 'triangle', 0.045);
            }
            for (const t of D.thieves) {
                if (!t.alive) continue;
                const d = t.root.position.distanceTo(C.pos);
                const sp = t.speed * t.speedMult * (d > 110 ? 0.72 : d < 25 ? 1.15 : 1);
                t.u = Math.min(0.995, t.u + sp * dt / R.len);
                const p = R.curve.getPointAt(t.u), tan = R.curve.getTangentAt(t.u);
                const sway = Math.sin(S.t * 0.7 + t.speed) * 2.2 + (t.wobbleT > 0 ? Math.sin(S.t * 18) * 1.4 : 0);
                t.root.position.copy(p).add(V(-tan.z, 0, tan.x).multiplyScalar(sway));
                t.root.rotation.y = Math.atan2(tan.x, tan.z) + (t.wobbleT > 0 ? Math.sin(S.t * 16) * 0.24 : 0);
                if (t.wobbleT > 0) t.wobbleT -= dt;
                for (let wi = 0; wi < (t.wheels || []).length; wi++) {
                    const wh = t.wheels[wi];
                    if (!wh.blown) wh.w.rotation.x += sp * dt * 2.2;
                    else if (Math.random() < dt * 16) {
                        const wp = V(); wh.wg.getWorldPosition(wp);
                        BO.FX.spawnParticles(wp, 1, 0x374151, 1.8, 2.5, 0.45, 1.1);
                        if (Math.random() < 0.3) BO.FX.spawnParticles(wp, 1, 0xfacc15, 3.2, 6, 0.2, 0.6);
                    }
                }
                if (t.u >= 0.70 && Math.random() < dt * 12) {
                    BO.FX.spawnParticles(t.root.position.clone().add(V(0, 0.25, 0)), 1, 0xb45309, 1.5, 1.5, 0.35, 1.1);
                }
                t.fireT -= dt;
                if (t.fireT <= 0 && d < 45 && t.occAlive > 0) {
                    t.fireT = (2.0 + Math.random() * 1.4) * (4 / Math.max(1, t.occAlive));
                    enemyShot(S, t.root.position.clone().add(V(0, 1.6, 0)), 6, 0.35);
                }
                if (t.u >= 0.992) SR.fail(S, t.name + ' ESCAPED CANYON!');
            }
            if (D.downed >= 3) SR.done(S, 'ALL THIEVES STOPPED');
        },
        onHit(S, ent, info) {
            if (!ent.alive || ent.hpLeft === undefined) return false;
            S.hits++; SFX.thunk();
            const occIdx = info.mesh?.userData?.occIdx;
            if (occIdx !== undefined && ent.occupants && ent.occupants[occIdx]) {
                const occ = ent.occupants[occIdx];
                if (occ.alive) {
                    occ.hp -= info.hitbox === 'head' ? 3 : 1;
                    if (occ.hp <= 0) {
                        occ.alive = false; occ.fig.root.visible = false; ent.occAlive--;
                        BO.FX.spawnParticles(info.pt, 10, 0xef4444, 3, 2, 0.4, 0.9);
                        if (ent.occAlive <= 0) {
                            ent.kill(info); S.data.downed++; S.kills++;
                            BO.FX.spawnExplosion(ent.root.position.clone().add(V(0, 1, 0)), 4.5, 0xf97316); SFX.rumble(0.5);
                            SR.stageBurst(S, ent.root.position.clone(), ent.name + ' STOPPED', S.data.downed - 1, 3, 0x4ade80);
                            return true;
                        }
                        MG.popup(info.pt, `${occ.role} KO! (${ent.occAlive}/4 LEFT)`, '#4ade80');
                        return false;
                    }
                    MG.popup(info.pt, `${occ.role}: ${occ.hp} HP`, '#fde047');
                    return false;
                }
            }
            const tireIdx = info.mesh?.userData?.tireIdx;
            if (tireIdx !== undefined && ent.tires && ent.tires[tireIdx] > 0) {
                ent.tires[tireIdx]--;
                BO.FX.spawnParticles(info.pt, 8, 0xfacc15, 4.5, 5, 0.3, 0.8);
                if (ent.tires[tireIdx] <= 0) {
                    ent.blownCount++;
                    ent.wheels[tireIdx].blown = true;
                    ent.wheels[tireIdx].w.scale.set(0.75, 0.75, 0.75);
                    ent.wobbleT = 1.6;
                    ent.speedMult = ent.blownCount === 1 ? 0.65 : Math.max(0.42, ent.speedMult * 0.82);
                    SFX.shatter();
                    BO.FX.spawnParticles(info.pt, 18, 0xf97316, 6, 4, 0.5, 1.2);
                    MG.popup(info.pt, ent.blownCount === 1 ? 'TIRE BLOWN! -35% SPD' : 'TIRE SHREDDED!', '#fb923c', true);
                } else {
                    MG.popup(info.pt, 'TIRE HIT', '#fde047');
                }
                return false;
            }
            ent.hpLeft -= info.hitbox === 'head' ? 4 : 1;
            if (ent.hpLeft <= 0) {
                ent.kill(info); S.data.downed++; S.kills++;
                BO.FX.spawnExplosion(ent.root.position.clone().add(V(0, 1, 0)), 3, 0xf97316); SFX.rumble(0.5);
                SR.stageBurst(S, ent.root.position.clone(), ent.name + ' STOPPED', S.data.downed - 1, 3, 0x86efac);
                return true;
            }
            MG.popup(info.pt, 'CHASSIS ' + ent.hpLeft, '#cbd5e1'); return false;
        },
        scoreText(S) { return S.data.downed + ' / 3'; },
        hud(S) {
            const C = S.data.car;
            return SR.panel(SR.chip('ZONE', S.data.act) + SR.chip('SPEED', Math.round(Math.abs(C.speed) * 3.6) + ' KM/H') + S.data.thieves.map((t) => t.alive ? SR.chip(t.name, `${Math.round(t.root.position.distanceTo(C.pos))}m • CREW ${t.occAlive}/4`) : SR.chip(t.name, 'DOWN')).join(''), S);
        },
        stats: (S) => [['THIEVES DOWN', S.data.downed + ' / 3'], ['ZONE REACHED', S.data.act], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']]
    });

    /* =====================================================================
       5. SKY SNIPERS — Night Skyline, Pilot Seat Target, Cover LOS & Lead HUD
    ===================================================================== */
    const ROOF_Y = 60;
    function planeMesh(col) {
        const g = new THREE.Group(), metal = std(col, 0.35, 0.65), dark = std(0x1f2937, 0.4, 0.7);
        const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.36, 6.2, 12), metal); fus.rotation.x = Math.PI / 2; g.add(fus);
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.35, 12), metal); nose.rotation.x = Math.PI / 2; nose.position.z = 3.75; g.add(nose);
        // Swept Fighter Wings + Wingtip Navigation Strobes
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.11, 1.45), metal);
        wingL.position.set(-2.35, 0.0, 0.25); wingL.rotation.y = 0.42;
        const wingR = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.11, 1.45), metal);
        wingR.position.set(2.35, 0.0, 0.25); wingR.rotation.y = -0.42;
        const navL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), basic(0xef4444)); navL.position.set(-4.35, 0.08, -0.65); navL.userData.noHit = true;
        const navR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), basic(0x22c55e)); navR.position.set(4.35, 0.08, -0.65); navR.userData.noHit = true;
        const tipL = new THREE.Object3D(); tipL.position.set(-4.35, 0, -0.65);
        const tipR = new THREE.Object3D(); tipR.position.set(4.35, 0, -0.65);
        g.add(wingL, wingR, navL, navR, tipL, tipR);
        // Twin angled tail fins + horizontal stabilizers
        const tail = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 0.85), metal); tail.position.z = -2.75; g.add(tail);
        for (const s of [-1, 1]) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.15, 0.95), metal);
            fin.position.set(s * 0.55, 0.58, -2.75); fin.rotation.z = -s * 0.28; g.add(fin);
        }
        // Translucent Canopy + Dedicated Pilot Seat Hitboxes
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 8, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.32, roughness: 0.05 }));
        canopy.position.set(0, 0.36, 1.25); canopy.scale.set(1.05, 1.05, 1.85); canopy.userData.noHit = true; g.add(canopy);
        const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), std(0xf1c27d, 0.7));
        pilot.position.set(0, 0.64, 1.22); pilot.userData.hitbox = 'head'; g.add(pilot);
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 8, 0, TAU, 0, Math.PI / 2), std(0x3f3f46, 0.45));
        helmet.position.copy(pilot.position).add(V(0, 0.06, 0)); helmet.userData.hitbox = 'head'; g.add(helmet);
        // Spinning Blurred Propeller Disc + Blades + Afterburner Exhaust Flame
        const prop = new THREE.Group(); prop.position.z = 4.45;
        const propDisc = new THREE.Mesh(new THREE.CircleGeometry(1.18, 20), new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false }));
        const bladeA = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.14, 0.05), dark);
        const bladeB = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.25, 0.05), dark);
        prop.add(propDisc, bladeA, bladeB); prop.traverse((o) => { o.userData.noHit = true; }); g.add(prop);
        const burner = new THREE.Mesh(new THREE.ConeGeometry(0.36, 2.1, 10), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85 }));
        burner.rotation.x = -Math.PI / 2; burner.position.set(0, 0, -4.15); burner.userData.noHit = true; g.add(burner);
        g.traverse((o) => { if (o.isMesh && !o.userData.noHit) o.castShadow = true; });
        return { g, armorHits: [fus, wingL, wingR, tail, nose], pilotHits: [pilot, helmet], prop, burner, tipL, tipR };
    }

    SR.define({
        id: 'sr_skysnipers', order: 5, name: 'Sky Snipers', icon: '✈️', accent: '#64748b',
        tagline: 'Three planes. Three pilots. One night-skyline helipad.',
        desc: 'Stranded atop a 60m night-skyline helipad under sweeping searchlights! Take cover behind the AC unit and armored blast shields during strafing dives, track HUD lead pips, and snipe every pilot cleanly through the cockpit!',
        heroLabel: 'SPEED RUN • NIGHT ANTI-AIR SNIPING', stars: [120, 80, 55, 40], timeLimit: 300,
        standardWeapon: 'intervention', weaponLabel: 'INTERVENTION .408', weaponNote: 'Scoped bolt-action • bottomless',
        keys: [['RMB', 'Scope'], ['LMB', 'Fire'], ['WASD', 'Use rooftop cover']],
        map: {
            skybox: 'skybox-night.png',
            atmosphere: { skyTop: 0x020617, skyBottom: 0x1e293b, fogColor: 0x0f172a, fogDensity: 0.0028, sunColor: 0x93c5fd, sunIntensity: 0.85, sunPos: [40, 80, 30], hemiSky: 0x64748b, hemiGround: 0x1e293b, hemiIntensity: 0.85, moon: true },
            boxes: [B(0, -0.5, 0, 300, 1, 300, 'concrete'), B(0, ROOF_Y / 2, 0, 16, ROOF_Y, 16, 'concrete')],
            spawn: { x: 0, y: ROOF_Y, z: 4, yaw: 0 }
        },
        build(S) {
            const rail = std(0x9ca3af, 0.4, 0.7);
            for (const [x1, z1, x2, z2] of [[-8, -8, 8, -7.8], [-8, 7.8, 8, 8], [-8, -8, -7.8, 8], [7.8, -8, 8, 8]]) {
                const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x2 - x1), 1.1, Math.abs(z2 - z1)), rail);
                m.position.set((x1 + x2) / 2, ROOF_Y + 0.55, (z1 + z2) / 2); S.add(m); S.collider(x1, ROOF_Y, z1, x2, ROOF_Y + 3, z2);
            }
            const coverMeshes = [];
            const ac = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 1.6), std(0x6b7280, 0.5, 0.6)); ac.position.set(-4, ROOF_Y + 0.75, -4); S.add(ac); S.solid(ac); coverMeshes.push(ac);
            S.collider(-5.2, ROOF_Y, -4.8, -2.8, ROOF_Y + 1.5, -3.2);

            // Armored Rooftop Blast Shields for Strafing Cover!
            const shieldM = std(0x334155, 0.4, 0.75);
            for (const [sx, sz, ry] of [[4.2, -4.2, -0.7], [-4.2, 4.2, -0.7], [4.2, 4.2, 0.7]]) {
                const sh = S.box(sx, ROOF_Y + 0.85, sz, 2.8, 1.7, 0.38, shieldM, { solid: true });
                sh.rotation.y = ry;
                const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.14, 0.4), basic(0xfacc15));
                stripe.position.set(sx, ROOF_Y + 1.4, sz); stripe.rotation.y = ry; S.add(stripe);
                coverMeshes.push(sh);
            }
            S.data.coverMeshes = coverMeshes;

            const hRing = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.6, 28), basic(0xfacc15, { side: THREE.DoubleSide })); hRing.rotation.x = -Math.PI / 2; hRing.position.set(0, ROOF_Y + 0.03, 0); S.add(hRing);
            const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 3.8), basic(0xfacc15)); hBar1.position.set(-1.3, ROOF_Y + 0.03, 0);
            const hBar2 = hBar1.clone(); hBar2.position.x = 1.3;
            const hCross = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 0.5), basic(0xfacc15)); hCross.position.set(0, ROOF_Y + 0.03, 0);
            S.add(hBar1, hBar2, hCross);

            const searchlights = [];
            for (const [sx, sz] of [[-6.5, -6.5], [6.5, -6.5]]) {
                const beam = new THREE.Mesh(new THREE.ConeGeometry(4.2, 68, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
                beam.geometry.translate(0, 34, 0); beam.position.set(sx, ROOF_Y + 0.6, sz); S.add(beam); searchlights.push(beam);
            }
            S.animate(() => { const t = performance.now() * 0.001; searchlights[0].rotation.z = Math.sin(t * 0.9) * 0.45; searchlights[1].rotation.z = -Math.cos(t * 0.8) * 0.45; });
            const rnd = L.mulberry32(5);
            for (let i = 0; i < 34; i++) { const h = 15 + rnd() * 44; const b = A.building(12, h, 12, [0x475569, 0x64748b, 0x334155][i % 3], i, 0.65, true); const a = rnd() * TAU, r = 30 + rnd() * 110; b.position.set(Math.sin(a) * r, h / 2, Math.cos(a) * r); S.add(b); }

            // Register Pilot Seat as dedicated Target linked to Plane!
            S.data.planes = [0, 1, 2].map((i) => {
                const m = planeMesh([0x7f1d1d, 0x1e3a8a, 0x3f3f46][i]);
                const planeTg = S.addTarget({ mesh: m.g, hitMeshes: m.armorHits, pos: V(0, ROOF_Y + 25, -60), life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true });
                const pilotTg = S.addTarget({ mesh: new THREE.Group(), hitMeshes: m.pilotHits, pos: V(0, ROOF_Y + 25, -60), life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true });
                pilotTg.isPilotSeat = true; pilotTg.parentPlane = planeTg;
                Object.assign(planeTg, {
                    plane: true, body: m.g, prop: m.prop, burner: m.burner, tipL: m.tipL, tipR: m.tipR, pilotTg,
                    r: 50 + i * 14, w: (i % 2 ? -1 : 1) * (0.32 - i * 0.04), a: i * 2.1, alt: ROOF_Y + 12 + i * 6,
                    runT: 7 + i * 4, run: 0, fireT: 0, down: false, vy: 0, prevPos: V(0, ROOF_Y + 25, -60), vel: V(),
                    name: ['RED BARON', 'BLUE JAY', 'IRON KITE'][i]
                });
                return planeTg;
            });

            // Lightweight DOM overlay for HUD Lead Indicators
            const leadBox = document.createElement('div');
            leadBox.id = 'sr-lead-layer';
            leadBox.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:25;overflow:hidden;';
            document.body.appendChild(leadBox);
            S.data.leadBox = leadBox;
            S.data.downed = 0; S.data.armorHits = 0;
        },
        dispose(S) {
            if (S.data.leadBox && S.data.leadBox.parentNode) S.data.leadBox.parentNode.removeChild(S.data.leadBox);
        },
        progress: (S) => S.data.downed / 3,
        update(S, dt, lib, state) {
            const D = S.data, run = state === 'running', cam = BO.App.worldCamera;
            const leadHtml = [];
            const W = window.innerWidth, H = window.innerHeight;
            for (const p of D.planes) {
                p.prop.rotation.z += dt * 45;
                p.burner.scale.set(1 + Math.sin(S.t * 40 + p.a) * 0.16, 0.8 + Math.random() * 0.45, 1);
                if (p._armorPending && p._armorPending.shot === S.shots && !p.down) {
                    D.armorHits++;
                    MG.popup(p._armorPending.pt, 'ARMOURED — HIT THE PILOT', '#cbd5e1');
                    BO.FX.spawnParticles(p._armorPending.pt, 6, 0xfde68a, 3, 4, 0.3, 0.8);
                    SFX.bonk();
                }
                p._armorPending = null;

                if (p.down) {
                    p.vy -= 9 * dt; p.root.position.y += p.vy * dt; p.root.position.x += Math.sin(p.root.rotation.y) * 20 * dt; p.root.position.z += Math.cos(p.root.rotation.y) * 20 * dt; p.body.rotation.z += dt * 2;
                    if (Math.random() < 0.7) BO.FX.spawnParticles(p.root.position, 2, 0x1f2937, 2, -1, 0.8, 1.6);
                    if (p.root.position.y < 2 && !p.crashed) { p.crashed = true; BO.FX.spawnExplosion(p.root.position.clone(), 6, 0xf97316); SFX.rumble(0.4); p.remove(); }
                    continue;
                }
                if (run) {
                    p.runT -= dt; if (p.runT <= 0 && !p.run) { p.run = 5; p.runT = 11 + Math.random() * 4; MG.toast(p.name + ' IS STRAFING!', '#fca5a5'); }
                    const radius = p.run > 0 ? 22 : p.r, alt = p.run > 0 ? ROOF_Y + 8 : p.alt;
                    p.curR = (p.curR || p.r) + (radius - (p.curR || p.r)) * Math.min(1, dt * 0.9);
                    p.curAlt = (p.curAlt || p.alt) + (alt - (p.curAlt || p.alt)) * Math.min(1, dt * 0.9);
                    p.a += (26 / p.curR) * Math.sign(p.w) * dt;
                    const x = Math.cos(p.a) * p.curR, z = Math.sin(p.a) * p.curR;
                    const nx = Math.cos(p.a + Math.sign(p.w) * 0.05) * p.curR, nz = Math.sin(p.a + Math.sign(p.w) * 0.05) * p.curR;
                    p.prevPos.copy(p.root.position);
                    p.root.position.set(x, p.curAlt, z);
                    if (dt > 0.001) p.vel.copy(p.root.position).sub(p.prevPos).divideScalar(dt);
                    p.root.rotation.y = Math.atan2(nx - x, nz - z);
                    p.body.rotation.z = Math.sign(p.w) * (p.run > 0 ? 0.95 : 0.8);
                    // Wingtip Contrails
                    if (Math.random() < dt * 22) {
                        const tp = V();
                        (Math.random() < 0.5 ? p.tipL : p.tipR).getWorldPosition(tp);
                        BO.FX.spawnParticles(tp, 1, 0xe0f2fe, 0.5, -0.2, 0.6, 0.75);
                    }
                    if (p.run > 0) {
                        p.run -= dt; p.fireT -= dt;
                        if (p.fireT <= 0) { p.fireT = 0.42; enemyShot(S, p.root.position.clone(), 9, 0.42, D.coverMeshes); }
                    }
                }
                // Project HUD Lead Indicator
                if (cam) {
                    const cockpitPos = V();
                    p.pilotTg.hitMeshes[0].getWorldPosition(cockpitPos);
                    const proj = cockpitPos.clone().project(cam);
                    if (proj.z < 1) {
                        const sx = (proj.x * 0.5 + 0.5) * W, sy = (-proj.y * 0.5 + 0.5) * H;
                        const col = p.run > 0 ? '#f87171' : '#38bdf8';
                        leadHtml.push(`<div style="position:absolute;left:${sx.toFixed(0)}px;top:${sy.toFixed(0)}px;transform:translate(-50%,-50%);width:22px;height:22px;border:2px solid ${col};border-radius:50%;box-shadow:0 0 8px ${col};"><span style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);font:700 10px sans-serif;color:${col};white-space:nowrap;text-shadow:0 1px 3px #000">${p.name}</span></div>`);
                    }
                }
            }
            if (D.leadBox) D.leadBox.innerHTML = leadHtml.join('');
        },
        onHit(S, ent, info) {
            if (ent.isPilotSeat) {
                const plane = ent.parentPlane;
                if (!plane || plane.down) return false;
                plane._armorPending = null;
                plane.down = true; plane.hitMeshes = []; ent.hitMeshes = [];
                S.hits++; S.data.downed++; S.kills++; S.headshots++; S.bumpCombo();
                SR.stageBurst(S, info.pt, `PILOT DOWN — ${plane.name}`, S.data.downed - 1, 3, 0x38bdf8);
                if (S.data.downed >= 3) SR.done(S, 'SKIES CLEAR');
                return true;
            }
            if (!ent.plane || ent.down) return false;
            S.hits++;
            ent._armorPending = { shot: S.shots, pt: info.pt.clone() };
            return false;
        },
        scoreText(S) { return S.data.downed + ' / 3'; },
        hud(S) { return SR.panel(S.data.planes.map((p) => SR.chip(p.name, p.down ? 'DOWN' : p.run > 0 ? 'ATTACKING' : Math.round(p.root.position.distanceTo(BO.Player.pos)) + ' m', p.run > 0 && !p.down)).join(''), S); },
        stats: (S) => [['PILOTS', S.data.downed + ' / 3'], ['ARMOUR HITS', S.data.armorHits], ['SHOTS', S.shots]]
    });

    /* =====================================================================
       7. FREEFALL — Smooth Thermal Updrafts, 3D Sunset Peaks & Chute Canopy
    ===================================================================== */
    const START_ALT = 1000, FALL = 25, FOES = 14;
    const SUIT_COLS = [0xef4444, 0x06b6d4, 0xa855f7, 0xf97316, 0x22c55e, 0xf43f5e];
    SR.define({
        id: 'sr_freefall', order: 7, name: 'Freefall', icon: '🪂', accent: '#f97316',
        tagline: 'Colorful wingsuit aerial firefight! Ride thermal updraft rings & clear 14 rivals!',
        desc: 'Leap into a sunset-drenched mountain canyon at 1,000m surrounded by vibrant multi-panel wingsuit rivals! Dive through neon thermal rings for smooth updraft surges and drop all 14 rivals before hitting the patchwork valley floor!',
        heroLabel: 'SPEED RUN • VIBRANT WINGSUIT SKYDIVE', stars: [35, 30, 26, 22], timeLimit: 60,
        standardWeapon: 'vector_kriss', weaponLabel: 'VECTOR', weaponNote: 'Bottomless magazine',
        keys: [['WASD', 'Bank & Steer Dive'], ['MOUSE', 'Aim in 3D Sky'], ['LMB', 'Shoot Wingsuits']],
        blockKeys: ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyC', 'ControlLeft'],
        map: {
            atmosphere: { skyTop: 0x1e1b4b, skyBottom: 0xfb923c, fogColor: 0xfdba74, fogDensity: 0.0008, sunColor: 0xffedd5, sunIntensity: 1.9, sunPos: [60, 120, -100], hemiSky: 0xfed7aa, hemiGround: 0x365314, hemiIntensity: 0.95 },
            boxes: [B(0, -0.5, 0, 1000, 1, 1000, 'grass')],
            spawn: { x: 0, y: START_ALT, z: 0, yaw: 0 }
        },
        build(S) {
            const fields = L.canvasTex('ff-fields-v2', 512, 512, (g, w, h) => {
                const rnd = L.mulberry32(19);
                const pal = ['#22c55e', '#16a34a', '#eab308', '#f97316', '#84cc16', '#10b981'];
                for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = pal[Math.floor(rnd() * pal.length)]; g.fillRect(x * 64, y * 64, 64, 64); }
                g.fillStyle = '#06b6d4'; g.fillRect(210, 0, 48, h);
                g.strokeStyle = '#fef08a'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
            });
            fields.wrapS = fields.wrapT = THREE.RepeatWrapping; fields.repeat.set(6, 6);
            const ground = new THREE.Mesh(new THREE.CircleGeometry(520, 48), new THREE.MeshStandardMaterial({ map: fields, roughness: 0.9 }));
            ground.rotation.x = -Math.PI / 2; ground.position.y = 0.01; S.add(ground);

            // 3D Sunset Canyon Mountain Peaks surrounding the entire valley (zero flat square border!)
            const mtnRng = L.mulberry32(77);
            const mtnCols = [0x9a3412, 0xc2410c, 0x7c2d12, 0x581c87, 0xb45309];
            for (let i = 0; i < 36; i++) {
                const a = (i / 36) * TAU + (mtnRng() - 0.5) * 0.08;
                const r = 270 + mtnRng() * 140;
                const h = 110 + mtnRng() * 165;
                const w = 55 + mtnRng() * 48;
                const peak = new THREE.Mesh(new THREE.ConeGeometry(w, h, 5 + (i % 3)), std(mtnCols[i % mtnCols.length], 0.92));
                peak.position.set(Math.cos(a) * r, h * 0.44, Math.sin(a) * r);
                peak.rotation.y = mtnRng() * TAU;
                S.add(peak);
                if (i % 2 === 0) {
                    const ridge = new THREE.Mesh(new THREE.ConeGeometry(w * 0.85, h * 0.65, 6), std(0x4c1d95, 0.94));
                    ridge.position.set(Math.cos(a + 0.06) * (r + 80), h * 0.28, Math.sin(a + 0.06) * (r + 80));
                    S.add(ridge);
                }
            }

            // Sunset-tinted layered clouds + Neon Thermal Updraft Rings
            for (let k = 0; k < 7; k++) {
                const alt = 120 + k * 130;
                const cMat = new THREE.MeshBasicMaterial({ color: k % 2 ? 0xfed7aa : 0xffffff, transparent: true, opacity: 0.62, depthWrite: false });
                for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(9 + Math.random() * 8, 10, 6), cMat); c.scale.y = 0.35; const a = Math.random() * TAU, r = 18 + Math.random() * 75; c.position.set(Math.cos(a) * r, alt + (Math.random() - 0.5) * 18, Math.sin(a) * r); S.add(c); }
            }
            S.data.rings = [];
            for (let r = 0; r < 7; r++) {
                const ry = 180 + r * 115, rx = (r % 2 ? 1 : -1) * 15, rz = ((r % 3) - 1) * 14;
                const col = [0x22d3ee, 0xfacc15, 0xf472b6, 0x4ade80][r % 4];
                const ring = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.5, 8, 24), basic(col));
                ring.rotation.x = Math.PI / 2; ring.position.set(rx, ry, rz); S.add(ring);
                S.data.rings.push({ mesh: ring, pos: V(rx, ry, rz), hit: false, col });
            }

            const pos = V(0, START_ALT, 0);
            S.data.me = { pos, vx: 0, vy: -FALL, vz: 0, updraftT: 0, chute: false };
            ride(pos.clone(), 1.6); BO.Player.pitch = -0.6;

            // Parachute Canopy (hidden until victory!)
            const chuteGrp = new THREE.Group();
            const goreCols = [0xf97316, 0xfacc15, 0x22d3ee, 0xef4444];
            for (let g = 0; g < 8; g++) {
                const a0 = (g / 8) * TAU;
                const gore = new THREE.Mesh(
                    new THREE.SphereGeometry(3.4, 8, 6, a0, TAU / 8, 0, Math.PI * 0.42),
                    new THREE.MeshBasicMaterial({ color: goreCols[g % 4], side: THREE.DoubleSide })
                );
                chuteGrp.add(gore);
                const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 4.0, 4), basic(0xf8fafc));
                cord.position.set(Math.cos(a0) * 1.6, 0.6, Math.sin(a0) * 1.6);
                cord.rotation.set(-Math.sin(a0) * 0.35, 0, Math.cos(a0) * 0.35);
                chuteGrp.add(cord);
            }
            chuteGrp.visible = false; chuteGrp.scale.setScalar(0.1);
            S.add(chuteGrp); S.data.chuteMesh = chuteGrp; S.data.chuteAnim = 0;

            S.data.foes = [];
            for (let i = 0; i < FOES; i++) {
                const col = SUIT_COLS[i % SUIT_COLS.length];
                const accentCol = SUIT_COLS[(i + 2) % SUIT_COLS.length];
                const fig = F.human({ shirt: col, pants: 0x0f172a, hat: 'helmet', hatColor: 0xfacc15, eyes: 'angry', gun: 'rifle' });
                // Multi-panel wingsuit web wings + wingtip emitters + parachute pack
                const wingMain = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.92), basic(col)); wingMain.position.set(0, 1.05, 0);
                const wingAccent = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 0.48), basic(accentCol)); wingAccent.position.set(0, 1.06, -0.15);
                const legWeb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.85), basic(accentCol)); legWeb.position.set(0, 0.55, 0);
                const pack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.3), std(0xf8fafc, 0.5)); pack.position.set(0, 1.15, -0.25);
                const tipL = new THREE.Object3D(); tipL.position.set(-0.92, 1.05, -0.2);
                const tipR = new THREE.Object3D(); tipR.position.set(0.92, 1.05, -0.2);
                fig.root.add(wingMain, wingAccent, legWeb, pack, tipL, tipR);
                fig.parts.armL.rotation.z = -1.35; fig.parts.armR.rotation.z = 1.35;
                fig.root.rotation.order = 'YXZ';
                fig.root.rotation.x = -1.15;
                const a = i / FOES * TAU, r = 11 + (i % 4) * 6;
                const tg = S.addTarget({ mesh: fig.root, hitMeshes: fig.hit, pos: V(Math.cos(a) * r, START_ALT - 22 + (i % 5) * 11, Math.sin(a) * r), life: 0, appear: 'none', inT: 0.01, death: 'fall', deathColor: col, hp: 2, bonus: true });
                tg.root.rotation.order = 'YXZ';
                Object.assign(tg, { foe: true, col, tipL, tipR, rel: V(Math.cos(a) * r, -22 + (i % 5) * 11, Math.sin(a) * r), angle: a, rad: r, spinRate: (i % 2 ? 1 : -1) * (0.45 + (i % 3) * 0.12), strafeT: 4 + i * 0.7, rollT: 0, fireT: 2 + Math.random() * 2.5, hpLeft: 2, body: fig.root });
                S.data.foes.push(tg);
            }
            S.data.downed = 0;
        },
        progress: (S) => S.data.downed / FOES,
        preUpdate(S, dt, lib, state) {
            const me = S.data.me, P = BO.Player, k = P.keys;
            if (state === 'running') {
                const yaw = P.yaw, f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
                const ax = -Math.sin(yaw) * f + Math.cos(yaw) * s, az = -Math.cos(yaw) * f - Math.sin(yaw) * s;
                me.vx += (ax * 13 - me.vx) * Math.min(1, dt * 2.5); me.vz += (az * 13 - me.vz) * Math.min(1, dt * 2.5);
                me.pos.x = BO.Math.clamp(me.pos.x + me.vx * dt, -140, 140);
                me.pos.z = BO.Math.clamp(me.pos.z + me.vz * dt, -140, 140);
                let targetVy = me.chute ? -5 : -FALL;
                if (me.updraftT > 0) {
                    me.updraftT = Math.max(0, me.updraftT - dt);
                    const surge = Math.sin((me.updraftT / 1.65) * Math.PI);
                    targetVy = 34 * surge;
                    if (Math.random() < dt * 24) BO.FX.spawnParticles(me.pos.clone().add(V((Math.random() - 0.5) * 8, -4, (Math.random() - 0.5) * 8)), 1, 0xfde047, 1.5, 16, 0.5, 1.1);
                }
                me.vy = BO.Math.lerp(me.vy, targetVy, Math.min(1, dt * 6));
                me.pos.y = Math.max(1.0, me.pos.y + me.vy * dt);
                if (Math.random() < dt * 18) BO.FX.spawnParticles(me.pos.clone().add(V((Math.random() - 0.5) * 24, -18, (Math.random() - 0.5) * 24)), 1, 0xe0f2fe, 0.5, -28, 0.55, 0.65);
            } else if (state === 'finish' && me.chute) me.pos.y = Math.max(1.0, me.pos.y - 5 * dt);
            if (P.rideState) { P.rideState.pos.copy(me.pos); P.rideState.roll = ((k.KeyA ? 1 : 0) - (k.KeyD ? 1 : 0)) * 0.1 + Math.sin(S.t * 2.1) * 0.03; }
        },
        update(S, dt, lib, state) {
            const D = S.data, me = D.me, cam = BO.App.worldCamera;
            if (me.chute && D.chuteMesh) {
                D.chuteMesh.visible = true;
                D.chuteAnim = Math.min(1, D.chuteAnim + dt * 2.4);
                const ease = 1 - Math.pow(1 - D.chuteAnim, 3);
                D.chuteMesh.scale.setScalar(0.15 + ease * 0.85);
                D.chuteMesh.position.set(me.pos.x, me.pos.y + 4.4, me.pos.z);
            }
            if (cam && me.updraftT > 0) {
                const baseFov = BO.Settings.get('fov') || 90;
                const boostFov = baseFov + Math.sin((me.updraftT / 1.65) * Math.PI) * 12;
                cam.fov = BO.Math.lerp(cam.fov, boostFov, Math.min(1, dt * 12));
                cam.updateProjectionMatrix();
            }
            if (state !== 'running') return;
            for (const f of D.foes) {
                if (!f.alive) continue;
                f.angle += f.spinRate * dt;
                f.strafeT -= dt;
                if (f.strafeT <= 0) { f.strafeT = 5 + Math.random() * 3; f.rad = Math.max(8, Math.min(26, f.rad + (Math.random() < 0.5 ? -6 : 6))); }
                f.rel.x = BO.Math.lerp(f.rel.x, Math.cos(f.angle) * f.rad, dt * 2.5);
                f.rel.z = BO.Math.lerp(f.rel.z, Math.sin(f.angle) * f.rad, dt * 2.5);
                f.rel.y = BO.Math.lerp(f.rel.y, Math.sin(S.t * 1.4 + f.angle) * 18, dt * 1.6);
                f.root.position.set(me.pos.x + f.rel.x, Math.max(0.8, me.pos.y + f.rel.y), me.pos.z + f.rel.z);
                f.root.rotation.y = Math.atan2(me.pos.x - f.root.position.x, me.pos.z - f.root.position.z);
                if (f.rollT > 0) { f.rollT -= dt; f.body.rotation.z += dt * 14; }
                else f.body.rotation.z = Math.sin(S.t * 3 + f.angle) * 0.35;
                if (Math.random() < dt * 14) {
                    const tp = V();
                    (Math.random() < 0.5 ? f.tipL : f.tipR).getWorldPosition(tp);
                    BO.FX.spawnParticles(tp, 1, f.col, 0.8, -14, 0.4, 0.85);
                }
                f.fireT -= dt;
                if (f.fireT <= 0) { f.fireT = 2.4 + Math.random() * 2; enemyShot(S, f.root.position.clone().add(V(0, 0.4, 0)), 5, 0.3); }
            }
            for (const rg of D.rings || []) {
                rg.mesh.rotation.z += dt * 1.5;
                if (!rg.hit && me.pos.distanceTo(rg.pos) < 8.8) {
                    rg.hit = true; rg.mesh.visible = false;
                    me.updraftT = 1.65;
                    SFX.star(2); SFX.whoosh(0.42);
                    BO.FX.spawnParticles(me.pos, 22, rg.col, 7, 4, 0.55, 1.3);
                    MG.toast('THERMAL UPDRAFT SURGE!', '#38bdf8');
                }
            }
            const alt = me.pos.y;
            if (D.downed >= FOES && !me.chute) { me.chute = true; SFX.whoosh(0.45); SR.done(S, 'SKY CLEAR — CHUTE OPEN'); }
            else if (alt <= 1.01 && !me.chute) { BO.FX.spawnExplosion(me.pos.clone(), 3, 0xa16207); SR.fail(S, 'YOU HIT THE GROUND'); }
        },
        onHit(S, ent, info) {
            if (!ent.foe || !ent.alive) return false;
            S.hits++; ent.hpLeft -= info.hitbox === 'head' ? 2 : 1;
            if (ent.hpLeft > 0) { ent.rollT = 0.7; SFX.thunk(); return false; }
            ent.kill(info); S.data.downed++; S.kills++;
            if (info.hitbox === 'head') S.headshots++;
            S.bumpCombo(); SFX.ding(1.1);
            if (S.data.downed === 5 || S.data.downed === 10) {
                SR.stageBurst(S, info.pt, `${S.data.downed} / ${FOES} RIVALS`, S.data.downed === 5 ? 0 : 1, 3, 0xf97316);
            }
            return true;
        },
        scoreText(S) { return S.data.downed + ' / ' + FOES; },
        hud(S) {
            const alt = Math.round(S.data.me.pos.y);
            return SR.panel(
                SR.chip('ALTITUDE', alt + ' m', alt < 250 && !S.data.me.chute) +
                SR.chip('WINGSUITS LEFT', FOES - S.data.downed) +
                SR.chip('TIME TO GROUND', S.data.me.chute ? 'CHUTE' : (alt / FALL).toFixed(1) + 's', alt < 250 && !S.data.me.chute),
                S
            );
        },
        stats: (S) => [['ENEMIES', S.data.downed + ' / ' + FOES], ['ALTITUDE LEFT', Math.round(S.data.me.pos.y) + ' m'], ['HEADSHOTS', S.headshots]]
    });
})(window);
