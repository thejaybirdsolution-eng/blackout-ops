/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Speed Runs (part 2)
     3. Getaway Chase — Linear 3-Act Chase: Busy City Street -> Highway -> Off-Road Canyon
     5. Sky Snipers   — Helipad tower + sweeping searchlights + 3 strafing pilots
     7. Freefall      — Colorful sunset wingsuit skydive + vibrant animated skydivers + wind streaks
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
       3. GETAWAY CHASE — LINEAR 3-ACT PURSUIT (CITY STREET -> HIGHWAY -> OFF-ROAD)
    ===================================================================== */
    const ROUTE_PTS = [
        V(0, 0, 0), V(0, 0, -260), V(18, 0, -520), V(26, 0, -820),
        V(-16, 0, -1120), V(-45, 0, -1420), V(0, 0, -1680)
    ];
    SR.define({
        id: 'sr_chase', order: 3, name: 'Getaway Chase', icon: '🚓', accent: '#3b82f6', music: 'hoverbike',
        tagline: 'Chase them down a busy City Street, onto the Highway, then Off-Road!',
        desc: 'Three getaway cars are tearing out of downtown! Give chase down a busy City Street with moving traffic, merge onto a Multi-Lane Highway with nitro strips, and follow them into a dusty Red-Rock Off-Road Canyon to stop all 3 before they escape the end of the trail!',
        heroLabel: 'SPEED RUN • 3-ACT LINEAR CHASE', stars: [150, 115, 88, 68], timeLimit: 320,
        standardWeapon: 'mp5', weaponLabel: 'MP5', weaponNote: 'Bottomless magazine',
        keys: [['W / S', 'Accelerate / brake'], ['A / D', 'Steer through traffic'], ['MOUSE', 'Aim out of the window'], ['LMB', 'Shoot tires & drivers']],
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
                const d = b.clone().sub(a).normalize(), n = V(-d.z, 0, d.x).multiplyScalar(u < 0.70 ? 6.8 : 6.0);
                const tgt = u < 0.70 ? posCity : posDirt;
                tgt.push(a.x + n.x, 0.03, a.z + n.z, a.x - n.x, 0.03, a.z - n.z, b.x + n.x, 0.03, b.z + n.z, a.x - n.x, 0.03, a.z - n.z, b.x - n.x, 0.03, b.z - n.z, b.x + n.x, 0.03, b.z + n.z);
            }
            const mkRoad = (arr, col) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); S.add(new THREE.Mesh(g, std(col, 0.9, 0, { side: THREE.DoubleSide }))); };
            mkRoad(posCity, 0x334155); mkRoad(posDirt, 0x92400e);

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
            // ACT 2: Highway Concrete Barriers, Green Gantries & Nitro Strips (u = 0.35..0.69)
            S.data.boosts = [];
            for (let i = 0; i < 7; i++) {
                const u = 0.36 + i * 0.05, p = R.curve.getPointAt(u), t = R.curve.getTangentAt(u);
                const arch = new THREE.Group();
                const bar = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 0.5), std(0x065f46, 0.4, 0.4)); bar.position.y = 5.6;
                const light = new THREE.Mesh(new THREE.BoxGeometry(11, 0.25, 0.25), basic(0x38bdf8)); light.position.y = 5.1;
                arch.add(bar, light); arch.position.copy(p); arch.lookAt(p.clone().add(t)); S.add(arch);
                const pad = new THREE.Mesh(new THREE.PlaneGeometry(5, 8), basic(0x0ea5e9));
                pad.rotation.x = -Math.PI / 2; pad.rotation.z = -Math.atan2(t.x, t.z); pad.position.copy(p).add(V(0, 0.06, 0));
                S.add(pad); S.data.boosts.push({ pos: p.clone(), cd: 0 });
            }
            const hwySg = A.sign('INTERSTATE HIGHWAY -> OFF-ROAD CANYON', 9, 1.4, { bg: '#064e3b', color: '#ffffff', borderColor: '#fde047', size: 0.46 });
            const hp = R.curve.getPointAt(0.35); hwySg.position.set(hp.x, 6.2, hp.z); S.add(hwySg);

            // ACT 3: Off-Road Red-Rock Canyon Cliffs & Scrub Pines (u = 0.70..0.99)
            const rockM = std(0xb45309, 0.92);
            for (let i = 0; i < 28; i++) {
                const u = 0.70 + (i / 28) * 0.29, p = R.curve.getPointAt(u), t = R.curve.getTangentAt(u), n = V(-t.z, 0, t.x);
                for (const s of [-1, 1]) {
                    const c = new THREE.Mesh(new THREE.DodecahedronGeometry(6 + rnd() * 5, 0), rockM);
                    c.position.copy(p).addScaledVector(n, s * 15).add(V(0, 4, 0)); S.add(c);
                }
            }
            const finP = R.curve.getPointAt(0.99);
            const finSg = A.sign('ROADBLOCK — END OF TRAIL', 10, 1.8, { bg: '#7f1d1d', color: '#fef08a', borderColor: '#ef4444', size: 0.48 });
            finSg.position.set(finP.x, 4.5, finP.z); S.add(finSg);
            const gPts = [];
            for (let gx = -4.2; gx <= 4.2; gx += 1.05) gPts.push(V(hp.x + gx, 5.4, hp.z), V(finP.x + gx, 5.5, finP.z));
            const gb = A.bulbs(gPts, [0x38bdf8, 0xfacc15, 0xef4444], 0.14); S.add(gb); A.animateBulbs(S, gb, 7, 'chase');

            // Moving Civilian Traffic along Street & Highway!
            S.data.traffic = [];
            for (let i = 0; i < 12; i++) {
                const tu = 0.04 + (i / 12) * 0.62;
                const lane = (i % 2 ? 3.2 : -3.2);
                const cm = carMesh([0x64748b, 0xfef08a, 0x0284c7, 0xdc2626][i % 4], 0x334155);
                cm.g.traverse((o) => { o.userData.noHit = true; });
                S.add(cm.g);
                S.data.traffic.push({ g: cm.g, u: tu, lane, spd: 11 + (i % 3) * 3 });
            }

            // Player's Police Interceptor
            const mine = carMesh(0xf8fafc, 0x0f172a);
            const lightL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.32), basic(0xef4444)); lightL.position.set(-0.32, 1.76, -0.3);
            const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.32), basic(0x3b82f6)); lightR.position.set(0.32, 1.76, -0.3);
            mine.g.add(lightL, lightR);
            const sirenLight = BO.Settings.getQualityPreset().pointLights ? new THREE.PointLight(0xef4444, 1.5, 22, 1.4) : null;
            if (sirenLight) { sirenLight.position.set(0, 2.2, -0.3); mine.g.add(sirenLight); }
            S.animate(() => {
                const on = Math.floor(performance.now() / 160) % 2;
                lightL.material = basic(on ? 0xef4444 : 0x450a0a); lightR.material = basic(on ? 0x1e3a8a : 0x38bdf8);
                if (sirenLight) sirenLight.color.setHex(on ? 0xef4444 : 0x3b82f6);
            });
            mine.g.traverse((o) => { o.userData.noHit = true; }); S.add(mine.g);
            const start = R.curve.getPointAt(0.01), tan = R.curve.getTangentAt(0.01);
            S.data.car = { g: mine.g, pos: start.clone(), heading: Math.atan2(tan.x, tan.z), speed: 0 };

            S.data.thieves = [0.06, 0.095, 0.13].map((u, i) => {
                const m = carMesh([0x111827, 0x7f1d1d, 0x14532d][i], 0x1e293b);
                // 4 separate bandits inside every getaway car, each with their own separate HP!
                const seatOffsets = [[-0.44, 0.85, 0.25], [0.44, 0.85, 0.25], [-0.44, 0.85, -0.75], [0.44, 0.85, -0.75]];
                const occupants = seatOffsets.map((pos, oi) => {
                    const occ = F.human({ shirt: oi === 0 ? 0xdc2626 : 0x1f2937, mask: 0x0a0a0a, eyes: 'angry' });
                    occ.root.scale.setScalar(0.76);
                    occ.root.position.set(pos[0], pos[1], pos[2]);
                    occ.hit.forEach((hm) => { hm.userData.occIdx = oi; });
                    m.g.add(occ.root);
                    return { fig: occ, hp: 6, alive: true, role: ['DRIVER', 'SHOTGUN', 'REAR-L', 'REAR-R'][oi] };
                });
                const allHits = m.hit.concat(...occupants.map((o) => o.fig.hit));
                const tg = S.addTarget({ mesh: m.g, hitMeshes: allHits, pos: R.curve.getPointAt(u), life: 0, appear: 'none', inT: 0.01, death: 'tumble', deathColor: 0xf97316, bonus: true });
                tg.u = u; tg.hpLeft = 90; tg.maxHp = 90; tg.occupants = occupants; tg.occAlive = 4;
                tg.speed = 21 + i * 1.4; tg.fireT = 2 + i; tg.name = ['VAN DER ROOK', 'SLY MARGO', 'TWO-TONE TEX'][i];
                return tg;
            });
            S.data.downed = 0; S.data.act = 'CITY STREET';
            ride(S.data.car.pos.clone(), 1.45);
        },
        progress: (S) => S.data.downed / 3,
        preUpdate(S, dt, lib, state) {
            const C = S.data.car, P = BO.Player, k = P.keys, R = S.data.R;
            if (state === 'running' && P.alive) {
                const fwd = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
                if (fwd > 0) C.speed = Math.min(34, C.speed + 14 * dt);
                else if (fwd < 0) C.speed = Math.max(-8, C.speed - 22 * dt);
                else C.speed *= Math.pow(0.6, dt);
                const steer = (k.KeyA ? 1 : 0) - (k.KeyD ? 1 : 0);
                C.heading += steer * dt * 1.5 * clamp01(Math.abs(C.speed) / 8) * Math.sign(C.speed || 1);
                for (const bp of S.data.boosts || []) {
                    if (bp.cd > 0) bp.cd -= dt;
                    else if (C.pos.distanceTo(bp.pos) < 5.5) { bp.cd = 4; C.speed = Math.min(42, C.speed + 12); SFX.whoosh(0.26); MG.toast('HIGHWAY NITRO!', '#38bdf8'); }
                }
            } else C.speed *= Math.pow(0.2, dt);
            C.pos.x += Math.sin(C.heading) * C.speed * dt;
            C.pos.z += Math.cos(C.heading) * C.speed * dt;
            C.pos.x = BO.Math.clamp(C.pos.x, -110, 110); C.pos.z = BO.Math.clamp(C.pos.z, -1690, 20);
            C.g.position.copy(C.pos); C.g.rotation.y = C.heading;
            S.data.act = C.pos.z > -560 ? 'CITY STREET' : C.pos.z > -1180 ? 'HIGHWAY' : 'OFF-ROAD CANYON';
            // Update civilian traffic + bump penalty
            for (const tf of S.data.traffic || []) {
                tf.u += tf.spd * dt / R.len; if (tf.u > 0.69) tf.u = 0.02;
                const p = R.curve.getPointAt(tf.u), tan = R.curve.getTangentAt(tf.u);
                tf.g.position.copy(p).add(V(-tan.z, 0, tan.x).multiplyScalar(tf.lane));
                tf.g.rotation.y = Math.atan2(tan.x, tan.z);
                if (state === 'running' && C.pos.distanceTo(tf.g.position) < 3.0) { C.speed = Math.min(C.speed, 10); SFX.bonk(); }
            }
            const seat = V(-0.45, 0, -0.2).applyAxisAngle(V(0, 1, 0), C.heading).add(C.pos);
            if (P.rideState) P.rideState.pos.copy(seat);
        },
        update(S, dt, lib, state) {
            const D = S.data, R = D.R, C = D.car;
            if (state !== 'running') return;
            for (const t of D.thieves) {
                if (!t.alive) continue;
                const d = t.root.position.distanceTo(C.pos);
                const sp = t.speed * (d > 110 ? 0.72 : d < 25 ? 1.15 : 1);
                t.u = Math.min(0.995, t.u + sp * dt / R.len);
                const p = R.curve.getPointAt(t.u), tan = R.curve.getTangentAt(t.u);
                t.root.position.copy(p).add(V(-tan.z, 0, tan.x).multiplyScalar(Math.sin(S.t * 0.7 + t.speed) * 2.2));
                t.root.rotation.y = Math.atan2(tan.x, tan.z);
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
                            MG.toast(ent.name + ' CREW WIPED OUT — CAR DESTROYED!', '#4ade80');
                            return true;
                        }
                        MG.popup(info.pt, `${occ.role} KO! (${ent.occAlive}/4 LEFT)`, '#4ade80');
                        return false;
                    }
                    MG.popup(info.pt, `${occ.role}: ${occ.hp} HP`, '#fde047');
                    return false;
                }
            }
            ent.hpLeft -= info.hitbox === 'head' ? 4 : 1;
            if (ent.hpLeft <= 0) {
                ent.kill(info); S.data.downed++; S.kills++;
                BO.FX.spawnExplosion(ent.root.position.clone().add(V(0, 1, 0)), 3, 0xf97316); SFX.rumble(0.5);
                MG.toast(ent.name + ' STOPPED • ' + (3 - S.data.downed) + ' LEFT', '#86efac'); return true;
            }
            MG.popup(info.pt, 'CHASSIS ' + ent.hpLeft, '#cbd5e1'); return false;
        },
        scoreText(S) { return S.data.downed + ' / 3'; },
        hud(S) {
            const C = S.data.car;
            return SR.panel(SR.chip('ZONE', S.data.act) + SR.chip('SPEED', Math.round(Math.abs(C.speed) * 3.6) + ' KM/H') + S.data.thieves.map((t) => t.alive ? SR.chip(t.name, `${Math.round(t.root.position.distanceTo(C.pos))}m • CREW ${t.occAlive}/4`) : SR.chip(t.name, 'DOWN')).join(''));
        },
        stats: (S) => [['THIEVES DOWN', S.data.downed + ' / 3'], ['ZONE REACHED', S.data.act], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']]
    });

    /* =====================================================================
       5. SKY SNIPERS
    ===================================================================== */
    const ROOF_Y = 60;
    function planeMesh(col) {
        const g = new THREE.Group(), metal = std(col, 0.35, 0.6);
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
        tagline: 'Three planes. Three pilots. One skyscraper helipad.',
        desc: 'Stranded atop a 60m helipad under sweeping searchlights while three fighters dive on strafing runs. Snipe every pilot cleanly through the cockpit canopy!',
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
                m.position.set((x1 + x2) / 2, ROOF_Y + 0.55, (z1 + z2) / 2); S.add(m); S.collider(x1, ROOF_Y, z1, x2, ROOF_Y + 3, z2);
            }
            const ac = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.6), std(0x6b7280, 0.5, 0.6)); ac.position.set(-4, ROOF_Y + 0.7, -4); S.add(ac); S.solid(ac);
            S.collider(-5.2, ROOF_Y, -4.8, -2.8, ROOF_Y + 1.4, -3.2);
            const hRing = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.6, 28), basic(0xfacc15, { side: THREE.DoubleSide })); hRing.rotation.x = -Math.PI / 2; hRing.position.set(0, ROOF_Y + 0.03, 0); S.add(hRing);
            const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 3.8), basic(0xfacc15)); hBar1.position.set(-1.3, ROOF_Y + 0.03, 0);
            const hBar2 = hBar1.clone(); hBar2.position.x = 1.3;
            const hCross = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 0.5), basic(0xfacc15)); hCross.position.set(0, ROOF_Y + 0.03, 0);
            S.add(hBar1, hBar2, hCross);
            const searchlights = [];
            for (const [sx, sz] of [[-6.5, -6.5], [6.5, -6.5]]) {
                const beam = new THREE.Mesh(new THREE.ConeGeometry(3.5, 55, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
                beam.geometry.translate(0, 27.5, 0); beam.position.set(sx, ROOF_Y + 0.6, sz); S.add(beam); searchlights.push(beam);
            }
            S.animate(() => { const t = performance.now() * 0.001; searchlights[0].rotation.z = Math.sin(t * 0.9) * 0.45; searchlights[1].rotation.z = -Math.cos(t * 0.8) * 0.45; });
            const rnd = L.mulberry32(5);
            for (let i = 0; i < 34; i++) { const h = 15 + rnd() * 44; const b = A.building(12, h, 12, [0x475569, 0x64748b, 0x334155][i % 3], i, 0.55, true); const a = rnd() * TAU, r = 30 + rnd() * 110; b.position.set(Math.sin(a) * r, h / 2, Math.cos(a) * r); S.add(b); }
            S.data.planes = [0, 1, 2].map((i) => {
                const m = planeMesh([0x7f1d1d, 0x1e3a8a, 0x3f3f46][i]);
                const tg = S.addTarget({ mesh: m.g, hitMeshes: m.hit, pos: V(0, ROOF_Y + 25, -60), life: 0, appear: 'none', inT: 0.01, death: 'none', bonus: true });
                Object.assign(tg, { plane: true, body: m.g, prop: m.prop, r: 50 + i * 14, w: (i % 2 ? -1 : 1) * (0.32 - i * 0.04), a: i * 2.1, alt: ROOF_Y + 12 + i * 6, runT: 7 + i * 4, run: 0, fireT: 0, down: false, vy: 0, name: ['RED BARON', 'BLUE JAY', 'IRON KITE'][i] });
                return tg;
            });
            S.data.downed = 0; S.data.armorHits = 0;
        },
        progress: (S) => S.data.downed / 3,
        update(S, dt, lib, state) {
            const D = S.data, run = state === 'running';
            for (const p of D.planes) {
                p.prop.rotation.z += dt * 40;
                if (p.down) {
                    p.vy -= 9 * dt; p.root.position.y += p.vy * dt; p.root.position.x += Math.sin(p.root.rotation.y) * 20 * dt; p.root.position.z += Math.cos(p.root.rotation.y) * 20 * dt; p.body.rotation.z += dt * 2;
                    if (Math.random() < 0.7) BO.FX.spawnParticles(p.root.position, 2, 0x1f2937, 2, -1, 0.8, 1.6);
                    if (p.root.position.y < 2 && !p.crashed) { p.crashed = true; BO.FX.spawnExplosion(p.root.position.clone(), 6, 0xf97316); SFX.rumble(0.4); p.remove(); }
                    continue;
                }
                if (!run) continue;
                p.runT -= dt; if (p.runT <= 0 && !p.run) { p.run = 5; p.runT = 11 + Math.random() * 4; MG.toast(p.name + ' IS STRAFING!', '#fca5a5'); }
                const radius = p.run > 0 ? 22 : p.r, alt = p.run > 0 ? ROOF_Y + 8 : p.alt;
                p.curR = (p.curR || p.r) + (radius - (p.curR || p.r)) * Math.min(1, dt * 0.9);
                p.curAlt = (p.curAlt || p.alt) + (alt - (p.curAlt || p.alt)) * Math.min(1, dt * 0.9);
                p.a += (26 / p.curR) * Math.sign(p.w) * dt;
                const x = Math.cos(p.a) * p.curR, z = Math.sin(p.a) * p.curR;
                const nx = Math.cos(p.a + Math.sign(p.w) * 0.05) * p.curR, nz = Math.sin(p.a + Math.sign(p.w) * 0.05) * p.curR;
                p.root.position.set(x, p.curAlt, z); p.root.rotation.y = Math.atan2(nx - x, nz - z);
                p.body.rotation.z = Math.sign(p.w) * (p.run > 0 ? 0.95 : 0.8);
                if (p.run > 0) { p.run -= dt; p.fireT -= dt; if (p.fireT <= 0) { p.fireT = 0.4; enemyShot(S, p.root.position.clone(), 9, 0.4); } }
            }
        },
        onHit(S, ent, info) {
            if (!ent.plane || ent.down) return false;
            S.hits++;
            if (info.hitbox !== 'head') { S.data.armorHits++; MG.popup(info.pt, 'ARMOURED — HIT THE PILOT', '#cbd5e1'); BO.FX.spawnParticles(info.pt, 6, 0xfde68a, 3, 4, 0.3, 0.8); SFX.bonk(); return false; }
            ent.down = true; ent.hitMeshes = []; S.data.downed++; S.kills++; S.headshots++;
            MG.toast('PILOT DOWN — ' + ent.name, '#86efac'); SFX.ding(1.2);
            if (S.data.downed >= 3) SR.done(S, 'SKIES CLEAR');
            return true;
        },
        scoreText(S) { return S.data.downed + ' / 3'; },
        hud(S) { return SR.panel(S.data.planes.map((p) => SR.chip(p.name, p.down ? 'DOWN' : p.run > 0 ? 'ATTACKING' : Math.round(p.root.position.distanceTo(BO.Player.pos)) + ' m', p.run > 0 && !p.down)).join('')); },
        stats: (S) => [['PILOTS', S.data.downed + ' / 3'], ['ARMOUR HITS', S.data.armorHits], ['SHOTS', S.shots]]
    });

    /* =====================================================================
       7. FREEFALL — VIBRANT SUNSET WINGSUIT SKYDIVE + SMART BANKING AI
    ===================================================================== */
    const START_ALT = 1000, FALL = 25, FOES = 14;
    const SUIT_COLS = [0xef4444, 0x06b6d4, 0xa855f7, 0xf97316, 0x22c55e, 0xf43f5e];
    SR.define({
        id: 'sr_freefall', order: 7, name: 'Freefall', icon: '🪂', accent: '#f97316',
        tagline: 'Colorful wingsuit aerial firefight! Dive through speed rings & clear 14 ace jumpers!',
        desc: 'Leap into a sunset-drenched canyon sky at 1,000m surrounded by vibrant wingsuit rivals firing tracers and weaving in formation! Dive through neon altitude rings for +45m chute lift and drop all 14 rivals before hitting the colorful patchwork valley below!',
        heroLabel: 'SPEED RUN • VIBRANT WINGSUIT SKYDIVE', stars: [35, 30, 26, 22], timeLimit: 60,
        standardWeapon: 'vector_kriss', weaponLabel: 'VECTOR', weaponNote: 'Bottomless magazine',
        keys: [['WASD', 'Bank & Steer Dive'], ['MOUSE', 'Aim in 3D Sky'], ['LMB', 'Shoot Wingsuits']],
        blockKeys: ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyC', 'ControlLeft'],
        map: {
            atmosphere: { skyTop: 0x1e1b4b, skyBottom: 0xfb923c, fogColor: 0xfdba74, fogDensity: 0.001, sunColor: 0xffedd5, sunIntensity: 1.9, sunPos: [60, 120, -100], hemiSky: 0xfed7aa, hemiGround: 0x365314, hemiIntensity: 0.95 },
            boxes: [B(0, -0.5, 0, 650, 1, 650, 'grass')],
            spawn: { x: 0, y: START_ALT, z: 0, yaw: 0 }
        },
        build(S) {
            // Vivid patchwork valley + shimmering turquoise river winding far below
            const fields = L.canvasTex('ff-fields-v2', 512, 512, (g, w, h) => {
                const rnd = L.mulberry32(19);
                const pal = ['#22c55e', '#16a34a', '#eab308', '#f97316', '#84cc16', '#10b981'];
                for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = pal[Math.floor(rnd() * pal.length)]; g.fillRect(x * 64, y * 64, 64, 64); }
                g.fillStyle = '#06b6d4'; g.fillRect(210, 0, 48, h);
                g.strokeStyle = '#fef08a'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
            });
            fields.wrapS = fields.wrapT = THREE.RepeatWrapping; fields.repeat.set(4, 4);
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(650, 650), new THREE.MeshStandardMaterial({ map: fields, roughness: 0.9 }));
            ground.rotation.x = -Math.PI / 2; ground.position.y = 0.01; S.add(ground);

            // Sunset-tinted layered clouds + vibrant Neon Speed Rings
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
            S.data.me = { pos, vx: 0, vz: 0, chute: false };
            ride(pos.clone(), 1.6); BO.Player.pitch = -0.6;
            S.data.foes = [];
            for (let i = 0; i < FOES; i++) {
                const col = SUIT_COLS[i % SUIT_COLS.length];
                const fig = F.human({ shirt: col, pants: 0x0f172a, hat: 'helmet', hatColor: 0xfacc15, eyes: 'angry', gun: 'rifle' });
                // Wingsuit web wings + Parachute backpack
                const wing = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.05, 0.9), basic(col)); wing.position.set(0, 1.05, 0);
                const pack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.3), std(0xf8fafc, 0.5)); pack.position.set(0, 1.15, -0.25);
                fig.root.add(wing, pack);
                fig.parts.armL.rotation.z = -1.35; fig.parts.armR.rotation.z = 1.35;
                fig.root.rotation.x = -1.15;
                const a = i / FOES * TAU, r = 11 + (i % 4) * 6;
                const tg = S.addTarget({ mesh: fig.root, hitMeshes: fig.hit, pos: V(Math.cos(a) * r, START_ALT - 22 + (i % 5) * 11, Math.sin(a) * r), life: 0, appear: 'none', inT: 0.01, death: 'fall', deathColor: col, hp: 2, bonus: true });
                Object.assign(tg, { foe: true, col, rel: V(Math.cos(a) * r, -22 + (i % 5) * 11, Math.sin(a) * r), angle: a, rad: r, spinRate: (i % 2 ? 1 : -1) * (0.45 + (i % 3) * 0.12), strafeT: 4 + i * 0.7, rollT: 0, fireT: 2 + Math.random() * 2.5, hpLeft: 2, body: fig.root });
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
                me.vx += (ax * 12 - me.vx) * Math.min(1, dt * 2.4); me.vz += (az * 12 - me.vz) * Math.min(1, dt * 2.4);
                me.pos.x = BO.Math.clamp(me.pos.x + me.vx * dt, -120, 120);
                me.pos.z = BO.Math.clamp(me.pos.z + me.vz * dt, -120, 120);
                me.pos.y = Math.max(1.0, me.pos.y - (me.chute ? 5 : FALL) * dt);
                // Upward wind streaks rushing past camera!
                if (Math.random() < dt * 18) BO.FX.spawnParticles(me.pos.clone().add(V((Math.random() - 0.5) * 24, -18, (Math.random() - 0.5) * 24)), 1, 0xe0f2fe, 0.5, -28, 0.55, 0.65);
            } else if (state === 'finish' && me.chute) me.pos.y = Math.max(1.0, me.pos.y - 5 * dt);
            if (P.rideState) { P.rideState.pos.copy(me.pos); P.rideState.roll = ((k.KeyA ? 1 : 0) - (k.KeyD ? 1 : 0)) * 0.1 + Math.sin(S.t * 2.1) * 0.03; }
        },
        update(S, dt, lib, state) {
            const D = S.data, me = D.me;
            if (state !== 'running') return;
            for (const f of D.foes) {
                if (!f.alive) continue;
                // Coordinated aerial orbit + periodic dive strafes + barrel roll evasion when hit!
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
                if (Math.random() < dt * 8) BO.FX.spawnParticles(f.root.position.clone().add(V(0, 1.5, 0)), 1, f.col, 0.8, -14, 0.35, 0.8);
                f.fireT -= dt;
                if (f.fireT <= 0) { f.fireT = 2.4 + Math.random() * 2; enemyShot(S, f.root.position.clone().add(V(0, 0.4, 0)), 5, 0.3); }
            }
            for (const rg of D.rings || []) {
                rg.mesh.rotation.z += dt * 1.5;
                if (!rg.hit && me.pos.distanceTo(rg.pos) < 8.8) {
                    rg.hit = true; rg.mesh.visible = false; me.pos.y += 45; SFX.star(2);
                    BO.FX.spawnParticles(me.pos, 16, rg.col, 6, 0, 0.45, 1.2);
                    MG.toast('AERIAL SPEED RING! +45m ALTITUDE', '#38bdf8');
                }
            }
            const alt = me.pos.y;
            if (D.downed >= FOES && !me.chute) { me.chute = true; SR.done(S, 'SKY CLEAR — CHUTE OPEN'); }
            else if (alt <= 1.01 && !me.chute) { BO.FX.spawnExplosion(me.pos.clone(), 3, 0xa16207); SR.fail(S, 'YOU HIT THE GROUND'); }
        },
        onHit(S, ent, info) {
            if (!ent.foe || !ent.alive) return false;
            S.hits++; ent.hpLeft -= info.hitbox === 'head' ? 2 : 1;
            if (ent.hpLeft > 0) { ent.rollT = 0.7; SFX.thunk(); return false; }
            ent.kill(info); S.data.downed++; S.kills++;
            if (info.hitbox === 'head') S.headshots++;
            S.bumpCombo(); SFX.ding(1.1); return true;
        },
        scoreText(S) { return S.data.downed + ' / ' + FOES; },
        hud(S) {
            const alt = Math.round(S.data.me.pos.y);
            return SR.panel(SR.chip('ALTITUDE', alt + ' m', alt < 250 && !S.data.me.chute) + SR.chip('WINGSUITS LEFT', FOES - S.data.downed) + SR.chip('TIME TO GROUND', S.data.me.chute ? 'CHUTE' : (alt / FALL).toFixed(1) + 's', alt < 250 && !S.data.me.chute));
        },
        stats: (S) => [['ENEMIES', S.data.downed + ' / ' + FOES], ['ALTITUDE LEFT', Math.round(S.data.me.pos.y) + ' m'], ['HEADSHOTS', S.headshots]]
    });
})(window);
