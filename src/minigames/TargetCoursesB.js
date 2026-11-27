/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Target Practice courses 6–10
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const { B, SFX, std, basic, clamp01, Ease } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;

    /* ================================================================
       6. DRONE SWARM — night rooftop, weaving quadcopters
    ================================================================ */
    MG.register({
        id: 'drone_swarm', cat: 'target', order: 6,
        name: 'Drone Swarm', icon: '🛸', accent: '#22d3ee',
        tagline: 'A rooftop at midnight. The sky is buzzing.',
        desc: 'Hold a skyscraper rooftop while quadcopters weave, strafe and dive out of the neon skyline. Scouts are quick, speeders are quicker, and armoured drones take three hits. Late in the run they start arriving from behind, so keep moving.',
        hudSub: 'Armoured drones take 3 hits — watch your six late game',
        duration: 60, stars: [4000, 8500, 14000, 20000], standardWeapon: 'g36c_tac', customMusic: true,
        map: {
            atmosphere: { skyTop: 0x020617, skyBottom: 0x1e1b4b, fogColor: 0x0b1026, fogDensity: 0.006, sunColor: 0x93c5fd, sunIntensity: 0.55, sunPos: [-20, 50, 30], hemiSky: 0x6366f1, hemiGround: 0x0f172a, hemiIntensity: 0.65, moon: true },
            skybox: 'skybox-night.png',
            boxes: [B(0, -0.5, 0, 26, 1, 26, 'concrete')],
            spawn: { x: 0, y: 0, z: 4, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('tactical');
            // parapet
            const par = std(0x3f3f46, 0.8);
            S.box(0, 0.55, -13, 26, 1.1, 0.4, par);
            S.box(0, 0.55, 13, 26, 1.1, 0.4, par);
            S.box(-13, 0.55, 0, 0.4, 1.1, 26, par);
            S.box(13, 0.55, 0, 0.4, 1.1, 26, par);
            S.collider(-13, 1.1, -13.2, 13, 4, -12.8);
            S.collider(-13, 1.1, 12.8, 13, 4, 13.2);
            S.collider(-13.2, 1.1, -13, -12.8, 4, 13);
            S.collider(12.8, 1.1, -13, 13.2, 4, 13);
            // chasing cyan/magenta neon parapet bulbs
            const pPts = [];
            for (let i = -12; i <= 12; i += 2) pPts.push(V(i, 1.18, -13), V(13, 1.18, i), V(-i, 1.18, 13), V(-13, 1.18, -i));
            const pBulbs = A.bulbs(pPts, [0x22d3ee, 0xf472b6, 0x38bdf8], 0.09);
            S.add(pBulbs); A.animateBulbs(S, pBulbs, 6, 'chase');
            // helipad + pulsing neon torus
            const pad = new THREE.Mesh(new THREE.CircleGeometry(5, 40), new THREE.MeshStandardMaterial({ map: L.canvasTex('helipad', 256, 256, (g, w) => {
                g.fillStyle = '#334155'; g.fillRect(0, 0, w, w);
                g.strokeStyle = '#facc15'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke();
                g.fillStyle = '#f8fafc'; g.font = '900 150px Bahnschrift, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', 128, 136);
            }), roughness: 0.8 }));
            pad.rotation.x = -Math.PI / 2;
            pad.position.set(0, 0.01, 2);
            S.add(pad);
            const hRing = new THREE.Mesh(new THREE.TorusGeometry(5.1, 0.08, 8, 40), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 }));
            hRing.rotation.x = Math.PI / 2; hRing.position.set(0, 0.04, 2); S.add(hRing);
            S.animate(() => { hRing.material.opacity = 0.35 + Math.sin(performance.now() * 0.005) * 0.25; });
            if (BO.Settings.getQualityPreset().pointLights) {
                const pl = new THREE.PointLight(0x38bdf8, 1.8, 28, 1.4); pl.position.set(0, 5, 2); S.add(pl);
            }
            // rooftop clutter (cover + industrial kit props)
            const ac = std(0x9ca3af, 0.5, 0.6);
            const ac1 = S.box(-9, 0.8, 8, 2.4, 1.6, 2.4, ac);
            const ac2 = S.box(9, 0.8, -8, 2.4, 1.6, 3.2, ac);
            const wtBox = S.box(9.5, 1.6, 9, 3, 3.2, 3, std(0x52525b, 0.8));
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/city_industrial_kit/detail-tank-large.glb', [
                { pos: [-9, 0, 8] }, { pos: [9, 0, -8] }
            ], { fitSize: [2.4, 1.8, 2.4], hideFallback: [ac1, ac2] });
            L.placeGLB(S.scene, 'staged_assets/3d_models/city_industrial_kit/water-tower.glb', {
                pos: [9.5, 0, 9], fitSize: [3.2, 4.2, 3.2], hideFallback: wtBox
            });
            const rSign = A.sign('ROOFTOP DEFENSE • WATCH SIX', 2.8, 0.55, { bg: '#090d26', color: '#67e8f9', borderColor: '#22d3ee', size: 0.45 });
            rSign.position.set(9.5, 3.55, 7.45); S.add(rSign);
            const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 10, 6), std(0xd4d4d8, 0.4, 0.8));
            antenna.position.set(-10, 5, -10);
            S.add(antenna);
            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), basic(0xef4444));
            beacon.position.set(-10, 10.1, -10);
            S.add(beacon);
            S.animate(() => { beacon.visible = Math.sin(performance.now() * 0.005) > 0; });
            // the city far below
            const rnd = L.mulberry32(404);
            for (let i = 0; i < 140; i++) {
                const a = rnd() * Math.PI * 2;
                const r = 45 + rnd() * 200;
                const h = 30 + rnd() * 95;
                const w = 8 + rnd() * 14;
                const b = A.building(w, h, w * (0.7 + rnd() * 0.6), [0x1e293b, 0x0f172a, 0x172554, 0x312e81][i % 4], i, 0.25 + rnd() * 0.35, true);
                b.position.set(Math.cos(a) * r, -95 + h / 2, Math.sin(a) * r);
                S.add(b);
                if (rnd() < 0.3) {
                    const lt = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), basic(0xef4444));
                    lt.position.set(b.position.x, -95 + h + 0.6, b.position.z);
                    S.add(lt);
                }
            }
            const street = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), std(0x0b1020, 1));
            street.rotation.x = -Math.PI / 2;
            street.position.y = -95;
            S.add(street);
            // search lights
            for (let i = 0; i < 3; i++) {
                const cone = new THREE.Mesh(new THREE.ConeGeometry(9, 140, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xbfdbfe, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }));
                cone.geometry.translate(0, -70, 0);
                const holder = new THREE.Group();
                holder.position.set(-90 + i * 90, -90, -120);
                holder.add(cone);
                S.add(holder);
                const ph = i * 2.1;
                S.animate(() => {
                    const t = performance.now() * 0.0004 + ph;
                    holder.rotation.set(Math.PI + Math.sin(t) * 0.35, 0, Math.cos(t * 1.3) * 0.4);
                });
            }
            K.cloudLayer(S, 8, 40, 200, 0x312e81, 0.35);
        },
        update(S, dt) { if (BO.MinigameAudio) BO.MinigameAudio.tick(dt); },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        schedule(S) {
            K.ramp(S, { from: 1.25, to: 0.5, start: 0.3 }, (at, k, rng) => {
                const roll = rng();
                const variant = k > 0.3 && roll < 0.18 ? 'armored' : roll < 0.45 ? 'speeder' : 'scout';
                const behind = k > 0.55 && rng() < 0.35;
                const ang = (behind ? Math.PI : 0) + (rng() - 0.5) * lerp(1.6, 2.6, k);
                const dist = 14 + rng() * 18;
                const h = 3 + rng() * 10;
                const pattern = BO.MinigameLib.clamp01(rng()) < 0.45 ? 'orbit' : rng() < 0.6 ? 'strafe' : 'dive';
                const spd = (variant === 'speeder' ? 1.7 : variant === 'armored' ? 0.7 : 1.0) * lerp(1, 1.7, k);
                const life = lerp(3.4, 2.2, k) * (variant === 'armored' ? 1.5 : 1);
                const w1 = 0.8 + rng() * 0.8, w2 = 1.1 + rng() * 1.2, ph = rng() * 6.28;
                const ampX = 3 + rng() * 5, ampY = 1 + rng() * 2.5;
                const dirS = rng() < 0.5 ? -1 : 1;
                S.at(at, (S2) => {
                    const c = V(Math.sin(ang) * -dist, h, Math.cos(ang) * -dist);
                    const t = A.drone(variant);
                    const rotors = t.rotors;
                    let motion;
                    if (pattern === 'orbit') {
                        motion = (tg, tt, out) => out.set(Math.sin(tt * w1 * spd + ph) * ampX, Math.sin(tt * w2 * spd) * ampY, Math.cos(tt * w1 * spd + ph) * ampX * 0.4);
                    } else if (pattern === 'strafe') {
                        motion = (tg, tt, out) => { const x = (tt / life - 0.5) * 2 * (10 + 6 * spd) * dirS; out.set(Math.cos(ang) * x, Math.sin(tt * 3) * 0.4, Math.sin(ang) * x); };
                    } else {
                        motion = (tg, tt, out) => { const p = tt / life; out.set(Math.sin(p * Math.PI * 2) * 4 * dirS, -Math.sin(p * Math.PI) * (h - 1.5), Math.sin(p * Math.PI) * dist * 0.35 * (ang > 1.6 ? -1 : 1)); };
                    }
                    S2.addTarget(Object.assign(t, {
                        pos: c, points: variant === 'armored' ? 300 : variant === 'speeder' ? 200 : 120, hp: variant === 'armored' ? 3 : 1, life,
                        appear: 'scale', inT: 0.35, death: 'fall', deathColor: 0x22d3ee, motion,
                        onTick: (tg, dt) => {
                            for (const r of rotors) r.rotation.y += dt * 60;
                            tg.pivot.rotation.z = Math.sin(tg.age * 2) * 0.15;
                            if (!tg.faceSet) { tg.root.rotation.y = A.yawTo(tg.root.position, V(0, 1.6, 0)); }
                        },
                        onDamage: (tg) => { BO.FX.spawnParticles(tg.root.position.clone(), 6, 0xfbbf24, 4, 6, 0.3, 0.8); },
                        onKill: (tg) => { SFX.pop(); BO.FX.spawnExplosion(tg.root.position.clone(), 1.2, 0xf97316); BO.Sound.playExplosion(0.25); }
                    }));
                    SFX.tone(1200, 1500, 0.12, 'sine', 0.05);
                });
            });
        }
    });

    /* ================================================================
       7. SNIPER RIDGE — long-range steel across a mountain valley
    ================================================================ */
    const RIDGE_SPOTS = (() => {
        const rnd = L.mulberry32(717);
        const out = [];
        for (let i = 0; i < 34; i++) {
            const a = (rnd() - 0.5) * 1.7;
            const d = 45 + rnd() * 155;
            const hill = 2 + rnd() * 10;
            out.push({ x: Math.sin(a) * d, z: -Math.cos(a) * d, d, hill, y: -22 + hill });
        }
        return out;
    })();
    MG.register({
        id: 'sniper_ridge', cat: 'target', order: 7,
        name: 'Sniper Ridge', icon: '🔭', accent: '#84cc16',
        tagline: 'Steel at 200 metres. Listen for the ding.',
        desc: 'A clifftop hide above a mountain valley. Steel gongs drop and rise across the slopes from 45 to 200 metres, and distance adds to every hit. The ring arrives late because sound travels. Later plates slide along rails and stay up for less time.',
        hudSub: 'Farther plates are worth more — hold breath with SHIFT',
        duration: 60, stars: [3000, 6500, 10500, 14000], standardWeapon: 'dragunov_svd', ringScoring: true, customMusic: true,
        map: {
            atmosphere: { skyTop: 0x0c4a6e, skyBottom: 0xe0f2fe, fogColor: 0xc5dcea, fogDensity: 0.0022, sunColor: 0xfff1d6, sunIntensity: 1.9, sunPos: [80, 60, -40], hemiSky: 0xe0f2fe, hemiGround: 0x3f6212, hemiIntensity: 0.85 },
            skybox: 'skybox-day.png',
            boxes: [B(0, -0.5, 1, 12, 1, 10, 'wood_plank')],
            spawn: { x: 0, y: 0, z: 1.5, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('contracts');
            K.booth(S, { roof: true, wood: 0x6b4423 });
            const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.32, 12), std(0x1f2937, 0.4, 0.7));
            scope.rotation.x = Math.PI / 2; scope.position.set(0.65, 1.2, -0.72); S.add(scope);
            const rPts = [];
            for (let x = -1.6; x <= 1.6; x += 0.8) rPts.push(V(x, 2.68, -1.48));
            const rBulbs = A.bulbs(rPts, [0xfde68a, 0xa3e635], 0.06);
            S.add(rBulbs); A.animateBulbs(S, rBulbs, 3, 'twinkle');
            if (BO.Settings.getQualityPreset().pointLights) {
                const lp = new THREE.PointLight(0xffe0a3, 1.4, 16, 1.6); lp.position.set(0, 2.4, -0.4); S.add(lp);
            }
            S.collider(-6, 0, -4, 6, 4, -3.6);
            // cliff
            const cliff = new THREE.Mesh(new THREE.CylinderGeometry(14, 24, 30, 9), std(0x57534e, 1, 0, { flatShading: true }));
            cliff.position.set(0, -15.5, 4);
            S.add(cliff);
            // valley floor
            const valley = new THREE.Mesh(new THREE.PlaneGeometry(900, 900, 60, 60), std(0x4d7c0f, 1, 0, { flatShading: true }));
            const pos = valley.geometry.attributes.position;
            const rnd = L.mulberry32(9);
            for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 0.03) * 3 + Math.cos(pos.getY(i) * 0.025) * 3 + rnd() * 1.5);
            valley.geometry.computeVertexNormals();
            valley.rotation.x = -Math.PI / 2;
            valley.position.y = -24;
            valley.receiveShadow = true;
            S.add(valley);
            S.solid(valley);
            // mounds under each target spot
            for (const sp of RIDGE_SPOTS) {
                const m = new THREE.Mesh(new THREE.ConeGeometry(5 + sp.hill * 0.6, sp.hill + 2, 7), std(0x65a30d, 1, 0, { flatShading: true }));
                m.position.set(sp.x, -24 + (sp.hill + 2) / 2, sp.z);
                m.receiveShadow = true;
                S.add(m);
                S.solid(m);
                const frame = new THREE.Group();
                const fm = std(0x44403c, 0.8, 0.3);
                for (const s of [-1, 1]) {
                    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.12), fm);
                    leg.position.set(s * 1.0, 1.4, 0);
                    leg.rotation.z = s * 0.12;
                    frame.add(leg);
                }
                const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), fm);
                top.position.y = 2.75;
                frame.add(top);
                frame.position.set(sp.x, sp.y, sp.z);
                frame.rotation.y = A.yawTo(frame.position, V(0, 0, 0));
                S.add(frame);
                const dsign = A.sign(Math.round(sp.d) + 'm', 1.4, 0.5, { bg: '#1c1917', color: '#a3e635', borderColor: '#4d7c0f', size: 0.6 });
                dsign.position.set(sp.x, sp.y + 3.3, sp.z);
                dsign.rotation.y = frame.rotation.y;
                dsign.scale.setScalar(1 + sp.d / 120);
                S.add(dsign);
            }
            // mountains
            for (let i = 0; i < 12; i++) {
                const mtn = new THREE.Mesh(new THREE.ConeGeometry(60 + (i % 3) * 25, 90 + (i % 4) * 30, 7), std(i % 2 ? 0x57534e : 0x44403c, 1, 0, { flatShading: true }));
                mtn.position.set(-330 + i * 60, 10, -330 - (i % 3) * 40);
                S.add(mtn);
                const cap = new THREE.Mesh(new THREE.ConeGeometry(18 + (i % 3) * 6, 26, 7), std(0xf8fafc, 0.8, 0, { flatShading: true }));
                cap.position.set(mtn.position.x, mtn.position.y + (90 + (i % 4) * 30) / 2 - 10, mtn.position.z);
                S.add(cap);
            }
            const valleyTreeTr = [];
            const valleyRockTr = [];
            for (let i = 0; i < 70; i++) {
                const vx = (rnd() - 0.5) * 420, vz = -40 - rnd() * 260, vs = 2 + rnd() * 1.5;
                valleyTreeTr.push({ pos: [vx, -23, vz], rot: rnd() * Math.PI * 2, scale: vs * 1.8 });
                if (i % 3 === 0) valleyRockTr.push({ pos: [vx + 4, -23, vz - 3], rot: rnd() * 6, scale: vs * 1.4 });
            }
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/mini_forest_kit/tree-high.glb', valleyTreeTr);
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/mini_forest_kit/rocks-high.glb', valleyRockTr);
            // wind flags
            for (const [x, z] of [[-30, -80], [25, -140], [-10, -190]]) {
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 6), std(0xe5e7eb, 0.5));
                pole.position.set(x, -19, z);
                S.add(pole);
                const flag = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.4, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xf97316, side: THREE.DoubleSide }));
                flag.rotation.z = Math.PI / 2;
                flag.position.set(x + 1.2, -16.5, z);
                S.add(flag);
                S.animate(() => { flag.rotation.x = Math.sin(performance.now() * 0.006 + x) * 0.25; });
            }
            K.cloudLayer(S, 16, 70, 300);
            // sandbags & spotting scope
            for (const x of [-1.45, -1.05, 1.05, 1.45]) {
                const sb = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.22, 4, 8), std(0x8b7d5b, 1));
                sb.rotation.x = Math.PI / 2;
                sb.position.set(x, 1.2, -0.75);
                S.add(sb);
            }
            S.data.busy = new Set();
        },
        update(S, dt) { if (BO.MinigameAudio) BO.MinigameAudio.tick(dt, { urgent: S.k > 0.65 }); },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        schedule(S) {
            K.ramp(S, { from: 1.9, to: 0.95, start: 0.3, end: 58 }, (at, k, rng) => {
                const si = Math.floor(rng() * RIDGE_SPOTS.length);
                const life = lerp(4.2, 2.3, k);
                const moving = rng() < k * 0.6;
                const ph = rng() * 6.28;
                const style = rng() < 0.5 ? 'drop' : 'rise';
                S.at(at, (S2) => {
                    let idx = si;
                    for (let n = 0; n < RIDGE_SPOTS.length && S2.data.busy.has(idx); n++) idx = (idx + 1) % RIDGE_SPOTS.length;
                    if (S2.data.busy.has(idx)) return;
                    S2.data.busy.add(idx);
                    const sp = RIDGE_SPOTS[idx];
                    const radius = 0.45 + sp.d * 0.006;
                    const t = A.steelPlate(radius, 0xe5e7eb);
                    const pos = V(sp.x, sp.y + 1.55, sp.z);
                    const yaw = A.yawTo(pos, V(0, 0, 0));
                    S2.addTarget(Object.assign(t, {
                        pos, yaw, points: 150 + Math.round(sp.d * 1.5), life, appear: style, riseDepth: 2.2, death: 'spin', deathColor: 0xfde68a,
                        motion: moving ? (tg, tt, out) => { const s = Math.sin(tt * 1.4 + ph) * 1.0; out.set(Math.cos(yaw) * s, 0, -Math.sin(yaw) * s); } : null,
                        onKill: () => {
                            S2.data.busy.delete(idx);
                            setTimeout(() => {
                                SFX.ding(0.9 + (200 - sp.d) / 400);
                                if (BO.MinigameAudio) BO.MinigameAudio.steelPing(0.85 + (200 - sp.d) / 360);
                            }, sp.d / 340 * 1000);
                        },
                        onExpire: () => S2.data.busy.delete(idx)
                    }));
                });
            });
        }
    });

    /* ================================================================
       8. HELI GUNNER — orbit a city block from a Black Hawk gunship door
    ================================================================ */
    const HELI_PTS = (() => {
        const pts = [];
        for (let i = 0; i < 24; i++) {
            const a = -i / 24 * Math.PI * 2;
            const r = 49 + Math.sin(i / 24 * Math.PI * 4) * 5.5;
            pts.push(V(Math.cos(a) * r, 27 + Math.sin(i / 24 * Math.PI * 6) * 3.5, Math.sin(a) * r));
        }
        return pts;
    })();

    function heliSunsetSkyboxTex() {
        return L.canvasTex('heli-sunset-skybox-v1', 1024, 512, (g, w, h) => {
            const sky = g.createLinearGradient(0, 0, 0, h);
            sky.addColorStop(0.00, '#0f172a');
            sky.addColorStop(0.24, '#312e81');
            sky.addColorStop(0.42, '#9d174d');
            sky.addColorStop(0.50, '#f97316');
            sky.addColorStop(0.54, '#fde047');
            sky.addColorStop(0.62, '#1e293b');
            sky.addColorStop(1.00, '#090d16');
            g.fillStyle = sky; g.fillRect(0, 0, w, h);
            const sun = g.createRadialGradient(w * 0.28, h * 0.48, 6, w * 0.28, h * 0.48, 120);
            sun.addColorStop(0, 'rgba(255,252,220,1)');
            sun.addColorStop(0.22, 'rgba(253,224,71,0.82)');
            sun.addColorStop(0.55, 'rgba(249,115,22,0.35)');
            sun.addColorStop(1, 'rgba(249,115,22,0)');
            g.fillStyle = sun; g.fillRect(0, 0, w, h);
            g.fillStyle = 'rgba(254,215,170,0.12)';
            for (let i = 0; i < 18; i++) {
                g.beginPath();
                g.ellipse(((i * 97) % w), h * (0.28 + (i % 5) * 0.045), 60 + (i % 4) * 32, 8 + (i % 3) * 4, 0, 0, Math.PI * 2);
                g.fill();
            }
        });
    }

    function heliThermalOverlay(on) {
        let el = document.getElementById('mg-heli-flir');
        if (on) {
            if (!el) {
                el = document.createElement('div');
                el.id = 'mg-heli-flir';
                el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:18;'
                    + 'background:radial-gradient(circle at 50% 50%, rgba(16,185,129,0.06) 42%, rgba(2,24,18,0.68) 100%),'
                    + 'repeating-linear-gradient(0deg, rgba(52,211,153,0.05) 0px, rgba(52,211,153,0.05) 1px, transparent 1px, transparent 3px);'
                    + 'mix-blend-mode:screen;box-shadow:inset 0 0 90px rgba(6,78,59,0.85);';
                const tag = document.createElement('div');
                tag.textContent = 'FLIR THERMAL • WHOT [Q]';
                tag.style.cssText = 'position:absolute;top:76px;left:50%;transform:translateX(-50%);padding:3px 10px;'
                    + 'border:1px solid rgba(52,211,153,0.65);background:rgba(2,44,34,0.72);color:#6ee7b7;'
                    + 'font:800 11px monospace;letter-spacing:2px;border-radius:4px;';
                el.appendChild(tag);
                document.body.appendChild(el);
            }
            el.style.display = 'block';
        } else if (el) {
            el.style.display = 'none';
        }
    }

    function applyHeliThermalTargets(S, on) {
        if (!S || !S.targets) return;
        for (const tg of S.targets) {
            if (!tg.alive || !tg.fig) continue;
            const col = tg.penalty ? 0x38bdf8 : (tg.isRocketeer ? 0xff2222 : 0xff6a00);
            const inten = on ? (tg.penalty ? 0.85 : 1.15) : 0;
            tg.root.traverse((o) => {
                if (!o.isMesh || !o.material || o.userData.noThermal) return;
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                for (const m of mats) {
                    if (!m.emissive) continue;
                    if (on) {
                        if (m.userData._origEm === undefined) m.userData._origEm = m.emissive.getHex();
                        if (m.userData._origEmI === undefined) m.userData._origEmI = m.emissiveIntensity || 0;
                        m.emissive.setHex(col);
                        m.emissiveIntensity = inten;
                    } else if (m.userData._origEm !== undefined) {
                        m.emissive.setHex(m.userData._origEm);
                        m.emissiveIntensity = m.userData._origEmI;
                    }
                }
            });
        }
    }

    MG.register({
        id: 'heli_gunner', cat: 'target', order: 8,
        name: 'Heli Gunner', icon: '🚁', accent: '#a3e635',
        tagline: 'Door seat, sunset skyline, rooftops full of trouble',
        desc: 'Ride in the open door of a Black Hawk circling a downtown block at sunset. Animated rooftop hostiles, RPG Rocketeers with laser telegraphs, explosive fuel barrels, and hostages appear across the skyline. Toggle FLIR Thermal Sight with [Q] and intercept Rocketeers before they fire.',
        hudSub: '[Q] Thermal FLIR • Shoot RPG Rocketeers & Red Barrels • Spare Hostages',
        duration: 60, stars: [3500, 7500, 12000, 17500], standardWeapon: 'm249', rail: true, customMusic: true,
        keys: [['MOUSE', 'Aim M134 / M249'], ['LMB', 'Fire'], ['Q', 'Toggle Thermal Sight']],
        map: {
            atmosphere: { skyTop: 0x1e1b4b, skyBottom: 0xf97316, fogColor: 0x7c3e45, fogDensity: 0.0036, sunColor: 0xffb36b, sunIntensity: 1.75, sunPos: [-65, 34, 75], hemiSky: 0xfdba74, hemiGround: 0x1e293b, hemiIntensity: 0.85 },
            boxes: [B(0, -0.5, 0, 420, 1, 420, 'asphalt')],
            spawn: { x: HELI_PTS[0].x, y: HELI_PTS[0].y, z: HELI_PTS[0].z, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('tactical');
            // Apply rich sunset equirectangular skybox (guaranteed crisp golden-dusk horizon)
            const skyTex = heliSunsetSkyboxTex();
            skyTex.mapping = THREE.EquirectangularReflectionMapping;
            S.scene.background = skyTex;

            const R = K.rail(HELI_PTS, true, 0.5);
            S.data.rail = R;
            S.data.dist = 0;
            S.data.hull = 100;
            S.data.thermal = false;
            S.data.rpgLocks = 0;
            S.data.radars = [];
            S.data.barrels = [];
            S.data.cars = [];
            S.data.baseFog = S.scene.fog ? S.scene.fog.color.getHex() : 0x7c3e45;
            S.data.baseFogD = S.scene.fog ? S.scene.fog.density : 0.0036;

            // PBR concrete & glass skyscraper material set
            const facadePaths = [
                'cyberpunk/Brutalist Exteriors/tower-facade-panels-001.png',
                'cyberpunk/Brutalist Concrete/smog-grey-facade-concrete-001.png',
                'cyberpunk/Brutalist Concrete/water-stained-tower-concrete-001.png',
                'cyberpunk/Brutalist Exteriors/rain-streaked-exterior-wall-001.png',
                'cyberpunk/Commercial Neon/black-glass-shopfront-tile-001.png'
            ];
            const roofSlabMat = L.pbrMat('cyberpunk/Brutalist Concrete/sunlit-civic-concrete-slab-001.png', 2, 2, { color: 0x64748b, roughness: 0.84, metalness: 0.1 });
            const parapetMat = std(0x1f2937, 0.78, 0.2);
            const glassAccentMat = new THREE.MeshStandardMaterial({ color: 0xfdba74, emissive: 0xf97316, emissiveIntensity: 0.32, roughness: 0.15, metalness: 0.85 });

            // City block buildings — CRITICAL: y = h / 2 so every roof sits cleanly at y = h!
            const roofs = [];
            const rnd = L.mulberry32(88);
            const cols = [0x94a3b8, 0x78716c, 0x64748b, 0x9a5b4a, 0x475569, 0x71717a];
            const acInst = [];
            const tankInst = [];
            const chimInst = [];

            for (let gx = -3; gx <= 3; gx++) {
                for (let gz = -3; gz <= 3; gz++) {
                    const cx = gx * 11 + (rnd() - 0.5) * 1.6, cz = gz * 11 + (rnd() - 0.5) * 1.6;
                    if (Math.hypot(cx, cz) > 38) continue;
                    const isCenter = gx === 0 && gz === 0;
                    const w = isCenter ? 8.8 : 6.2 + rnd() * 2.6;
                    const d = isCenter ? 8.8 : 6.2 + rnd() * 2.6;
                    const h = isCenter ? 24 : (7 + rnd() * 16 + (Math.hypot(cx, cz) < 16 ? 5 : 0));
                    const fPath = facadePaths[Math.abs(gx * 3 + gz) % facadePaths.length];
                    const wallTex = L.loadTex(fPath, Math.max(1, Math.round(w / 5)), Math.max(1, Math.round(h / 8)));
                    const winTex = A.windowsTex(Math.abs(gx * 7 + gz) % 6, 0.45, '#fde68a', '#1e293b').clone();
                    winTex.needsUpdate = true; winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping;
                    winTex.userData.mgOwned = true;
                    winTex.repeat.set(Math.max(1, Math.round(w / 5)), Math.max(1, Math.round(h / 10)));
                    const pbrSide = new THREE.MeshStandardMaterial({
                        map: wallTex, color: cols[Math.floor(rnd() * cols.length)],
                        roughness: fPath.includes('black-glass') ? 0.18 : 0.65,
                        metalness: fPath.includes('black-glass') ? 0.72 : 0.18,
                        emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.35
                    });
                    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [pbrSide, pbrSide, roofSlabMat, roofSlabMat, pbrSide, pbrSide]);
                    b.position.set(cx, h / 2, cz);
                    b.castShadow = b.receiveShadow = true;
                    S.add(b);
                    S.solid(b);

                    // Parapet rim around roof edge
                    const lip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.34, 0.42, d + 0.34), parapetMat);
                    lip.position.set(cx, h + 0.21, cz);
                    S.add(lip);

                    // Center tower helipad + radar dish; other roofs get AC/water-tanks/chimneys
                    if (isCenter) {
                        const hPad = new THREE.Mesh(new THREE.CircleGeometry(3.5, 32), new THREE.MeshStandardMaterial({
                            map: L.canvasTex('heli-center-pad', 256, 256, (g, pw) => {
                                g.fillStyle = '#334155'; g.fillRect(0, 0, pw, pw);
                                g.strokeStyle = '#facc15'; g.lineWidth = 12; g.beginPath(); g.arc(128, 128, 108, 0, Math.PI * 2); g.stroke();
                                g.fillStyle = '#f8fafc'; g.font = '900 140px Bahnschrift, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', 128, 134);
                            }), roughness: 0.72
                        }));
                        hPad.rotation.x = -Math.PI / 2; hPad.position.set(cx, h + 0.44, cz);
                        S.add(hPad);
                        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), basic(0xf97316));
                        beacon.position.set(cx + w * 0.42, h + 0.6, cz + d * 0.42);
                        S.add(beacon);
                        S.animate(() => { beacon.visible = Math.sin(performance.now() * 0.006) > 0; });
                    } else {
                        if (rnd() < 0.55) {
                            const ac = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 1.1), std(0x94a3b8, 0.5, 0.5));
                            ac.position.set(cx - w * 0.22, h + 0.43, cz + d * 0.18);
                            S.add(ac);
                            const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 10), std(0x1f2937, 0.5));
                            fan.position.set(cx - w * 0.22, h + 0.88, cz + d * 0.18);
                            S.add(fan);
                        }
                        if (rnd() < 0.38) {
                            tankInst.push({ pos: [cx + w * 0.24, h, cz - d * 0.22], rotY: rnd() * Math.PI });
                        } else if (rnd() < 0.35) {
                            chimInst.push({ pos: [cx - w * 0.24, h, cz - d * 0.24], rotY: 0 });
                        } else if (rnd() < 0.28) {
                            acInst.push({ pos: [cx + w * 0.22, h, cz + d * 0.22], rotY: rnd() * Math.PI });
                        }
                        if (rnd() < 0.22) {
                            // Rotating rooftop radar dish
                            const radBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.1, 8), std(0x475569, 0.5, 0.7));
                            radBase.position.set(cx, h + 0.55, cz);
                            const dishPivot = new THREE.Group();
                            dishPivot.position.set(cx, h + 1.15, cz);
                            const dish = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.45, 14, 1, true), std(0xe2e8f0, 0.35, 0.6));
                            dish.rotation.x = Math.PI * 0.35;
                            dishPivot.add(dish);
                            S.add(radBase, dishPivot);
                            S.data.radars.push(dishPivot);
                        }
                    }

                    // Sunset reflection band near crown
                    const crown = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.45, d + 0.06), glassAccentMat);
                    crown.position.set(cx, h - 0.6, cz);
                    S.add(crown);

                    roofs.push({ x: cx, z: cz, w, d, h });
                }
            }
            S.data.roofs = roofs;

            if (tankInst.length) L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/city_industrial_kit/detail-tank-large.glb', tankInst, { fitSize: [1.8, 1.5, 1.8] });
            if (acInst.length) L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/city_industrial_kit/detail-tank.glb', acInst, { fitSize: [1.4, 1.2, 1.4] });
            if (chimInst.length) L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/city_industrial_kit/chimney-small.glb', chimInst, { fitSize: [1.0, 2.0, 1.0] });
            if (roofs.length > 2) {
                const wtRf = roofs[Math.floor(roofs.length * 0.35)];
                L.placeGLB(S.scene, 'staged_assets/3d_models/city_industrial_kit/water-tower.glb', { pos: [wtRf.x - wtRf.w * 0.2, wtRf.h, wtRf.z + wtRf.d * 0.2], fitSize: [2.4, 3.2, 2.4] });
            }

            // Outer city ring skyline — fixed at y = h / 2 so towers sit grounded on the asphalt!
            for (let i = 0; i < 74; i++) {
                const a = rnd() * Math.PI * 2, r = 88 + rnd() * 125, h = 18 + rnd() * 54, w = 10 + rnd() * 10;
                const b = A.building(w, h, w * (0.8 + rnd() * 0.4), cols[i % cols.length], 100 + i, 0.42, true);
                b.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
                S.add(b);
            }

            // Street grid with lane markings, streetlights & moving neon car traffic below
            const laneTex = L.canvasTex('heli-street-lane', 64, 256, (g, w, h) => {
                g.fillStyle = '#18181b'; g.fillRect(0, 0, w, h);
                g.fillStyle = '#3f3f46'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
                g.fillStyle = '#facc15';
                for (let y = 8; y < h; y += 36) g.fillRect(w * 0.47, y, w * 0.06, 20);
            });
            laneTex.wrapS = laneTex.wrapT = THREE.RepeatWrapping;
            laneTex.repeat.set(1, 14);
            const roadMat = new THREE.MeshStandardMaterial({ map: laneTex, roughness: 0.86 });
            const lampMat = basic(0xfde68a);
            const poleMat = std(0x27272a, 0.5, 0.7);
            for (let i = -3; i <= 3; i++) {
                for (const rot of [0, Math.PI / 2]) {
                    const road = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 110), roadMat);
                    road.rotation.set(-Math.PI / 2, 0, rot);
                    road.position.set(rot ? 0 : i * 11 + 5.5, 0.03, rot ? i * 11 + 5.5 : 0);
                    S.add(road);
                }
                if (Math.abs(i) <= 2) {
                    const lx = i * 11 + 3.6, lz = i * 11 + 3.6;
                    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 6), poleMat);
                    pole.position.set(lx, 1.8, lz);
                    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), lampMat);
                    bulb.position.set(lx, 3.65, lz);
                    S.add(pole, bulb);
                }
            }
            // Moving neon cars along avenues
            const carBodyMat = std(0x0f172a, 0.3, 0.7);
            const headM = basic(0x67e8f9), tailM = basic(0xf43f5e);
            for (let ci = 0; ci < 12; ci++) {
                const car = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 2.2), carBodyMat);
                body.position.y = 0.35;
                const hl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.1), headM); hl.position.set(0, 0.36, 1.12);
                const tl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.1), tailM); tl.position.set(0, 0.36, -1.12);
                car.add(body, hl, tl);
                const axis = ci % 2 === 0 ? 'z' : 'x';
                const lane = (-2 + (ci % 5)) * 11 + 5.5;
                const dir = (ci % 4 < 2) ? 1 : -1;
                if (axis === 'x') car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
                else car.rotation.y = dir > 0 ? 0 : Math.PI;
                S.add(car);
                S.data.cars.push({ obj: car, axis, lane: lane + dir * 0.7, dir, pos: -50 + ci * 9, spd: 11 + (ci % 4) * 3.5 });
            }

            // Place explosive red barrels on prominent rooftops
            for (let ri = 0; ri < roofs.length; ri++) {
                if (ri % 3 !== 1) continue;
                const rf = roofs[ri];
                const bx = rf.x + (rnd() - 0.5) * (rf.w * 0.35);
                const bz = rf.z + (rnd() - 0.5) * (rf.d * 0.35);
                const bGroup = new THREE.Group();
                const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.15, 14), std(0xdc2626, 0.42, 0.35));
                cyl.position.y = 0.58;
                const band = new THREE.Mesh(new THREE.CylinderGeometry(0.435, 0.435, 0.22, 14), std(0xfacc15, 0.5));
                band.position.y = 0.62;
                const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.04, 14), std(0x1f2937, 0.6));
                topCap.position.y = 1.16;
                bGroup.add(cyl, band, topCap);
                const bPos = V(bx, rf.h + 0.42, bz);
                S.addTarget({
                    mesh: bGroup, hitMeshes: [cyl, band], pos: bPos, points: 250, bonus: true, life: 0,
                    appear: 'none', inT: 0.01, death: 'burst', deathColor: 0xf97316,
                    onKill: (tg) => {
                        const center = tg.root.position.clone();
                        BO.FX.spawnExplosion(center, 4.5, 0xf97316);
                        BO.Sound.playExplosion(0.5);
                        BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.045);
                        for (const other of S.targets) {
                            if (!other.alive || other === tg || other.penalty || !other.fig) continue;
                            if (other.root.position.distanceTo(center) < 6.8) {
                                S.award(other.isRocketeer ? 350 : 200, other.root.position.clone().add(V(0, 2.0, 0)), 'BARREL BLAST!', '#fb923c');
                                other.kill({ pt: other.root.position.clone().add(V(0, 1.0, 0)) });
                            }
                        }
                    }
                });
            }

            // =================================================================
            // Rich Contoured Black Hawk Gunship Interior
            // =================================================================
            const heli = new THREE.Group();
            const odHull = std(0x3b4734, 0.58, 0.35);
            const odDark = std(0x232a1f, 0.68, 0.45);
            const deckMat = L.pbrMat('cyberpunk/Industrial Maintenance/diamond-plate-walkway-001.png', 2, 3, { color: 0x334155, roughness: 0.6, metalness: 0.55 });
            const metalDark = std(0x18181b, 0.35, 0.8);

            // Riveted deck + armored lower sponson + ribbed door bulkhead posts
            const floor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 4.2), deckMat);
            floor.position.set(-0.65, -0.06, -0.2);
            const portWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.05, 4.1), odHull);
            portWall.position.set(-1.92, 1.0, -0.2);
            const bulkhead = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 0.18), odDark);
            bulkhead.position.set(-0.7, 1.0, -0.85);
            heli.add(floor, portWall, bulkhead);
            for (const z of [-2.1, -0.85, 1.35]) {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.1, 0.20), odHull);
                post.position.set(0.58, 1.02, z);
                heli.add(post);
            }
            // Contoured overhead fuselage & cabin roof
            const roofP = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.18, 4.4), odHull);
            roofP.position.set(-0.6, 2.10, -0.2);
            const noseCanopy = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 1.7, 12, 1, false, -Math.PI * 0.45, Math.PI * 0.9), odDark);
            noseCanopy.rotation.z = Math.PI / 2; noseCanopy.rotation.y = Math.PI / 2;
            noseCanopy.position.set(-0.65, 0.95, -2.55);
            const cockpitGlass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 0.06), new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1, transparent: true, opacity: 0.42 }));
            cockpitGlass.position.set(-0.65, 1.55, -2.35); cockpitGlass.rotation.x = 0.45;
            heli.add(roofP, noseCanopy, cockpitGlass);

            // Animated Pilot & Co-Pilot Helmets in front cockpit seats
            const pilots = [];
            const helmetMat = std(0x3f4b3a, 0.4, 0.35);
            const visorMat = std(0x090d16, 0.08, 0.9);
            const suitMat = std(0x2c3627, 0.8);
            for (const px of [-1.15, -0.15]) {
                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.95, 0.45), odDark);
                seat.position.set(px, 0.72, -1.55);
                const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.65, 10), suitMat);
                torso.position.set(px, 0.92, -1.72);
                const helm = new THREE.Group();
                helm.position.set(px, 1.44, -1.72);
                const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), helmetMat);
                const visor = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 10, -0.8, 1.6, 0.8, 1.0), visorMat);
                visor.position.set(0, 0.01, -0.02);
                const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6), metalDark);
                mic.position.set(0.11, -0.06, -0.12); mic.rotation.x = Math.PI / 2;
                helm.add(dome, visor, mic);
                heli.add(seat, torso, helm);
                pilots.push(helm);
            }

            // Glowing avionics dash + overhead console
            const dashTex = L.canvasTex('heli-avionics', 256, 64, (g, w, h) => {
                g.fillStyle = '#090d16'; g.fillRect(0, 0, w, h);
                for (let x = 14; x < w - 14; x += 48) {
                    g.strokeStyle = '#22c55e'; g.lineWidth = 2; g.strokeRect(x, 10, 36, 44);
                    g.fillStyle = '#14532d'; g.fillRect(x + 3, 13, 30, 38);
                    g.fillStyle = '#4ade80'; g.fillRect(x + 6, 26, 24, 3);
                }
            });
            const dash = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.34, 0.45), new THREE.MeshStandardMaterial({ map: dashTex, emissive: 0x22c55e, emissiveMap: dashTex, emissiveIntensity: 0.7 }));
            dash.position.set(-0.65, 1.06, -2.18);
            heli.add(dash);

            // Heavy tubular landing skids
            const skidMain = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 4.2, 8), metalDark);
            skidMain.rotation.x = Math.PI / 2; skidMain.position.set(0.95, -0.58, -0.2);
            heli.add(skidMain);
            for (const sz of [-1.2, 0.9]) {
                const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6), metalDark);
                strut.position.set(0.75, -0.32, sz); strut.rotation.z = -0.55;
                heli.add(strut);
            }

            // Articulated door-mounted M134 Minigun cradle & tracer ammo chute
            const gunCradle = new THREE.Group();
            gunCradle.position.set(0.62, 0.92, 0.35);
            const pintle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.65, 8), metalDark);
            pintle.position.y = -0.32;
            const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.46), metalDark);
            const barrelGroup = new THREE.Group();
            barrelGroup.position.set(0.18, 0.02, 0);
            for (let bi = 0; bi < 6; bi++) {
                const ba = bi / 6 * Math.PI * 2;
                const brl = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.92, 6), std(0x3f3f46, 0.3, 0.85));
                brl.rotation.z = Math.PI / 2;
                brl.position.set(0.46, Math.sin(ba) * 0.055, Math.cos(ba) * 0.055);
                barrelGroup.add(brl);
            }
            const barrelClamp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), metalDark);
            barrelClamp.rotation.z = Math.PI / 2; barrelClamp.position.x = 0.76;
            barrelGroup.add(barrelClamp);
            const ammoChute = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.16), std(0xd4a017, 0.35, 0.8));
            ammoChute.position.set(-0.08, -0.24, 0.18); ammoChute.rotation.x = 0.35;
            gunCradle.add(pintle, receiver, barrelGroup, ammoChute);
            heli.add(gunCradle);

            // Overhead spinning rotor + translucent motion-blur rotor disc
            const rotor = new THREE.Group();
            rotor.position.set(-0.65, 2.52, -0.35);
            for (let i = 0; i < 4; i++) {
                const blade = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.045, 0.32), std(0x111827, 0.5, 0.45));
                blade.rotation.y = i * Math.PI / 2;
                rotor.add(blade);
            }
            const blurTex = L.canvasTex('heli-rotor-blur', 256, 256, (g, w, h) => {
                g.clearRect(0, 0, w, h);
                const rg = g.createRadialGradient(128, 128, 12, 128, 128, 126);
                rg.addColorStop(0, 'rgba(30,41,59,0.5)');
                rg.addColorStop(0.55, 'rgba(15,23,42,0.28)');
                rg.addColorStop(0.92, 'rgba(250,204,21,0.16)');
                rg.addColorStop(1, 'rgba(15,23,42,0)');
                g.fillStyle = rg; g.fillRect(0, 0, w, h);
            });
            const blurDisc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32), new THREE.MeshBasicMaterial({ map: blurTex, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }));
            blurDisc.rotation.x = -Math.PI / 2;
            rotor.add(blurDisc);
            heli.add(rotor);

            if (BO.Settings.getQualityPreset().pointLights) {
                const cLight = new THREE.PointLight(0xf97316, 1.4, 9, 1.5); cLight.position.set(-0.4, 1.85, -0.3); heli.add(cLight);
            }
            heli.traverse((o) => { if (o.isMesh && o !== blurDisc) o.castShadow = true; });
            S.add(heli);
            S.data.heli = heli;
            S.data.rotor = rotor;
            S.data.pilots = pilots;
            S.data.gunCradle = gunCradle;
            S.data.barrelGroup = barrelGroup;
            K.cloudLayer(S, 14, 78, 230, 0xfed7aa, 0.68);
        },
        onKey(S, code) {
            if (code === 'KeyQ' && MG.state === 'running') {
                S.data.thermal = !S.data.thermal;
                heliThermalOverlay(S.data.thermal);
                applyHeliThermalTargets(S, S.data.thermal);
                if (S.scene && S.scene.fog) {
                    S.scene.fog.color.setHex(S.data.thermal ? 0x042f2e : S.data.baseFog);
                    S.scene.fog.density = S.data.thermal ? 0.0022 : S.data.baseFogD;
                }
                SFX.tone(S.data.thermal ? 1400 : 880, S.data.thermal ? 2100 : 520, 0.12, 'sine', 0.14);
                MG.toast(S.data.thermal ? 'THERMAL FLIR ONLINE' : 'OPTICS NORMAL', S.data.thermal ? '#34d399' : '#cbd5e1');
                return true;
            }
            return false;
        },
        dispose(S) {
            heliThermalOverlay(false);
            if (BO.MinigameAudio) BO.MinigameAudio.stop();
        },
        preUpdate(S, dt, lib, state) {
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const R = S.data.rail;
            if (!R) return;
            if (state !== 'countdown') S.data.dist += 15 * dt;
            const r = K.driveRail(S, R, S.data.dist, dt, { bank: 0.24, pitchFollow: 0.28, eye: 1.25 });
            if (!r) return;
            if (!S.data.aimed) {
                S.data.aimed = true;
                BO.Player.yaw = Math.atan2(r.p.x, r.p.z);
                BO.Player.pitch = -0.32;
            }
            const heli = S.data.heli;
            const h = r.heading;
            const rightX = Math.cos(h), rightZ = -Math.sin(h);
            const side = (rightX * -r.p.x + rightZ * -r.p.z) >= 0 ? 0 : Math.PI;
            heli.position.copy(BO.Player.rideState.pos);
            heli.rotation.set(0, h + side, 0);
            heli.rotateX(-(BO.Player.rideState.roll || 0) * 0.55);
            S.data.rotor.rotation.y += dt * 36;

            // Animate pilot helmets scanning + M134 door gun tracking/spinning
            const now = performance.now() * 0.001;
            if (S.data.pilots) {
                S.data.pilots.forEach((p, idx) => { p.rotation.y = Math.sin(now * 0.9 + idx * 1.7) * 0.22; p.rotation.x = Math.sin(now * 1.5 + idx) * 0.06; });
            }
            if (S.data.gunCradle) {
                S.data.gunCradle.rotation.z = BO.Math.clamp(BO.Player.pitch * 0.7, -0.55, 0.35);
                if (BO.Player.mouseDragging) S.data.barrelGroup.rotation.x += dt * 42;
            }

            // Animate rooftop radars & city car traffic
            for (const rad of S.data.radars) rad.rotation.y += dt * 1.6;
            for (const c of S.data.cars) {
                c.pos += c.dir * c.spd * dt;
                if (c.pos > 55) c.pos = -55;
                if (c.pos < -55) c.pos = 55;
                if (c.axis === 'z') c.obj.position.set(c.lane, 0.04, c.pos);
                else c.obj.position.set(c.pos, 0.04, c.lane);
            }

            // Continuous twin-blade rotor chop audio
            S.data.thwop = (S.data.thwop || 0) - dt;
            if (S.data.thwop <= 0) {
                SFX.noise(0.085, 145, 'lowpass', 0.85, 0.19);
                SFX.tone(68, 52, 0.08, 'triangle', 0.08);
                S.data.thwop = 0.105;
            }
            BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.0045);
        },
        schedule(S) {
            K.ramp(S, { from: 1.15, to: 0.46, start: 0.35 }, (at, k, rng) => {
                const pickR = rng();
                const rollType = rng();
                const civ = rollType < 0.14;
                const rocketeer = !civ && k > 0.18 && rollType > 0.76;
                const life = lerp(3.1, 1.8, k) * (rocketeer ? 1.25 : 1);
                const lateral = (rng() - 0.5) * 0.72;
                S.at(at, (S2) => {
                    const F = BO.MGFigures;
                    const R = S2.data.rail;
                    const hp = R.curve.getPointAt((((S2.data.dist + 18) / R.len) % 1 + 1) % 1);
                    const toHeli = Math.atan2(hp.x, hp.z);
                    const cands = S2.data.roofs.filter((rf) => {
                        const a = Math.atan2(rf.x, rf.z);
                        return Math.abs(BO.Math.angleDiff(a, toHeli)) < 1.05 || Math.hypot(rf.x, rf.z) < 12;
                    });
                    if (!cands.length) return;
                    const rf = cands[Math.floor(pickR * cands.length) % cands.length];
                    const dir = V(hp.x - rf.x, 0, hp.z - rf.z).normalize();
                    const pos = V(
                        rf.x + dir.x * (rf.w / 2 - 0.75) + dir.z * lateral * rf.w,
                        rf.h + 0.42,
                        rf.z + dir.z * (rf.d / 2 - 0.75) - dir.x * lateral * rf.d
                    );
                    const fig = F.human(civ
                        ? F.randomCivilian(rng, { shirt: 0x38bdf8, eyes: 'scared', mouth: 'o' })
                        : rocketeer
                            ? { skin: F.SKINS[Math.floor(rng() * F.SKINS.length)], shirt: 0x7f1d1d, pants: 0x18181b, bandana: 0xef4444, vest: 0x27272a, gun: 'rifle', eyes: 'angry', scale: 1.08 }
                            : { skin: F.SKINS[Math.floor(rng() * F.SKINS.length)], shirt: 0x1f2937, pants: 0x111827, mask: 0x0a0a0a, vest: 0x3f4a2a, gun: 'rifle', eyes: 'angry' });
                    F.pose(fig, civ ? 'handsUp' : 'aim');

                    // Clear visual indicators: Hostage halo OR RPG Rocketeer laser sight
                    let laser = null;
                    if (civ) {
                        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 18), basic(0x38bdf8));
                        halo.rotation.x = Math.PI / 2; halo.position.y = 2.08; halo.userData.noHit = true; halo.userData.noThermal = true;
                        fig.root.add(halo);
                    } else if (rocketeer) {
                        const rpgTube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 1.05, 8), std(0x365314, 0.6));
                        rpgTube.rotation.x = Math.PI / 2; rpgTube.position.set(0.18, -0.58, 0.25); rpgTube.userData.noHit = true;
                        fig.parts.armR.add(rpgTube);
                        const lGeo = new THREE.CylinderGeometry(0.028, 0.028, 1, 6);
                        lGeo.translate(0, 0.5, 0); lGeo.rotateX(Math.PI / 2);
                        laser = new THREE.Mesh(lGeo, new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.72 }));
                        laser.userData.noHit = true; laser.userData.noThermal = true;
                        S2.scene.add(laser);
                        S2.data.rpgLocks++;
                        SFX.tone(1100, 1480, 0.09, 'sawtooth', 0.08);
                    }

                    const st = { t: rng() * 2, lockT: 0, fired: false };
                    const tg = S2.addTarget({
                        mesh: fig.root, hitMeshes: fig.hit, pos, faceCamera: true,
                        points: rocketeer ? 400 : 180, penalty: civ ? 350 : 0, penaltyLabel: 'HOSTAGE!',
                        life: civ ? life * 1.25 : life,
                        appear: 'rise', riseDepth: 1.8, death: 'tumble', deathColor: civ ? 0x38bdf8 : 0xef4444,
                        onTick: (t, dt) => {
                            st.t += dt;
                            F.pose(fig, civ ? 'handsUp' : 'aim', st.t);
                            if (laser && t.alive) {
                                st.lockT += dt;
                                const muzzle = t.root.position.clone().add(V(0, 1.55, 0));
                                const chop = BO.Player.rideState ? BO.Player.rideState.pos.clone().add(V(0, 0.8, 0)) : BO.App.worldCamera.position;
                                const dLen = muzzle.distanceTo(chop);
                                laser.position.copy(muzzle);
                                laser.lookAt(chop);
                                laser.scale.set(1 + Math.sin(st.t * 24) * 0.35, 1 + Math.sin(st.t * 24) * 0.35, dLen);
                                laser.material.opacity = st.lockT > 1.7 ? (Math.sin(st.t * 38) > 0 ? 0.95 : 0.25) : 0.65;
                                if (st.lockT >= 2.4 && !st.fired && MG.state === 'running') {
                                    st.fired = true;
                                    BO.FX.spawnTracer(muzzle, chop, 0xf97316, 0.16, 0.32);
                                    BO.FX.spawnExplosion(chop.clone().add(V(0, -0.3, 0)), 1.8, 0xf97316);
                                    SFX.rumble(0.42);
                                    MG.flashScreen('rgba(239,68,68,0.45)');
                                    BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.11);
                                    S2.data.hull = Math.max(0, S2.data.hull - 25);
                                    if (S2.data.hull <= 0) MG.finish('BLACK HAWK DOWN', { color: '#f87171' });
                                    t.retire();
                                }
                            }
                        },
                        onKill: (t) => {
                            if (laser && laser.parent) laser.parent.remove(laser);
                            if (rocketeer) {
                                S2.data.rpgLocks = Math.max(0, S2.data.rpgLocks - 1);
                                S2.award(150, t.root.position.clone().add(V(0, 2.2, 0)), 'RPG INTERCEPT!', '#fde047');
                            }
                            SFX.thunk();
                        },
                        onExpire: () => {
                            if (laser && laser.parent) laser.parent.remove(laser);
                            if (rocketeer) S2.data.rpgLocks = Math.max(0, S2.data.rpgLocks - 1);
                        }
                    });
                    tg.fig = fig;
                    tg.isRocketeer = rocketeer;
                    if (S2.data.thermal) applyHeliThermalTargets(S2, true);
                });
            });
        },
        hud(S) {
            const hull = S.data.hull ?? 100;
            const alt = BO.Player && BO.Player.rideState ? Math.round(BO.Player.rideState.pos.y * 3.28) : 90;
            return `<div class="mgx-raid">
                <div class="mgx-hp"><small>CHOPPER HULL</small><div class="mgx-hp-bar"><i style="width:${hull}%;background:${hull > 50 ? '#22c55e' : hull > 25 ? '#f59e0b' : '#ef4444'}"></i></div><b>${hull}%</b></div>
                <div class="mgx-chip">ALT <b>${alt} FT</b></div>
                <div class="mgx-chip ${S.data.thermal ? 'mgx-hot' : ''}">[Q] FLIR <b>${S.data.thermal ? 'ON' : 'OFF'}</b></div>
                ${S.data.rpgLocks > 0 ? `<div class="mgx-chip mgx-bad">⚠ RPG LOCK <b>${S.data.rpgLocks}</b></div>` : ''}
            </div>`;
        }
    });

    /* ================================================================
       9. BALLOON FESTIVAL — pop rising balloons, avoid the bombs
    ================================================================ */
    const BASKETS = [[-9, -14], [-3, -18], [4, -15], [10, -20], [-12, -26], [-1, -28], [7, -30], [14, -27], [-6, -36], [3, -38]];
    MG.register({
        id: 'balloon_fest', cat: 'target', order: 9,
        name: 'Balloon Festival', icon: '🎈', accent: '#f472b6',
        tagline: 'Pop the colours. Spare the skulls.',
        desc: 'Dusk at the county fair. Balloons drift up from launch baskets across the field, swaying in the breeze, in bunches and then in whole bouquets. Gold balloons pay 5x. Black skull balloons are rigged, so leave them alone. The finale ends in fireworks.',
        hudSub: 'Gold = big bonus • Skull balloons = penalty',
        duration: 60, stars: [4500, 9000, 15000, 22000], standardWeapon: 'famas_f1', customMusic: true,
        map: {
            atmosphere: { skyTop: 0x312e81, skyBottom: 0xfb923c, fogColor: 0xc38a73, fogDensity: 0.006, sunColor: 0xffb070, sunIntensity: 1.3, sunPos: [-50, 14, -80], hemiSky: 0xfda4af, hemiGround: 0x365314, hemiIntensity: 0.8 },
            boxes: [B(0, -0.5, -25, 200, 1, 200, 'nuketown_grass')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('pinball');
            K.booth(S, { awning: '#db2777', wood: 0xf5f5f4, trim: 0xbe185d });
            const arch = A.sign('BALLOON FESTIVAL', 7.2, 1.15, { bg: '#4c0519', color: '#fde68a', borderColor: '#f472b6', size: 0.62 });
            arch.position.set(0, 6.2, -10.2); S.add(arch);
            const archPts = [];
            for (let lx = -3.8; lx <= 3.8; lx += 0.76) archPts.push(V(lx, 6.9, -10.1), V(lx, 5.5, -10.1));
            const archBulbs = A.bulbs(archPts, [0xfde047, 0xf472b6, 0x60a5fa], 0.06);
            S.add(archBulbs); A.animateBulbs(S, archBulbs, 7, 'chase');
            if (BO.Settings.getQualityPreset().pointLights) {
                const pl = new THREE.PointLight(0xffd7a8, 1.6, 26, 1.4); pl.position.set(0, 4.5, -4); S.add(pl);
            }
            const basketMat = std(0x92400e, 0.9);
            for (const [x, z] of BASKETS) {
                const b = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 0.7, 12), basketMat);
                b.position.set(x, 0.35, z);
                b.castShadow = true;
                S.add(b);
                const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 6, 16), std(0x78350f, 0.9));
                rim.rotation.x = Math.PI / 2;
                rim.position.set(x, 0.7, z);
                S.add(rim);
                const deco = A.balloon(['red', 'blue', 'yellow', 'green', 'purple', 'pink'][Math.abs(x + z) % 6]);
                deco.mesh.scale.setScalar(0.6);
                deco.mesh.position.set(x + 0.4, 0.4, z);
                S.add(deco.mesh);
            }
            // tents + string lights
            const tentCols = [0xdc2626, 0x2563eb, 0xf59e0b, 0x16a34a, 0x9333ea];
            for (let i = 0; i < 10; i++) {
                const x = -40 + i * 9;
                const tent = new THREE.Group();
                const body = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 3, 10), std(0xf8fafc, 0.8));
                body.position.y = 1.5;
                const top = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.6, 10), std(tentCols[i % 5], 0.7));
                top.position.y = 4.3;
                tent.add(body, top);
                tent.position.set(x, 0, -52 - (i % 2) * 6);
                S.add(tent);
            }
            const lights = A.bulbs([
                ...A.sagPoints(V(-18, 6, -10), V(18, 6, -10), 30, 0.8),
                ...A.sagPoints(V(-18, 7, -24), V(18, 7, -24), 30, 1.0),
                ...A.sagPoints(V(-18, 6, -10), V(-18, 7, -40), 20, 0.6),
                ...A.sagPoints(V(18, 6, -10), V(18, 7, -40), 20, 0.6)
            ], [0xfde047, 0xf472b6, 0x60a5fa, 0x4ade80, 0xfb923c]);
            S.add(lights);
            A.animateBulbs(S, lights, 4, 'chase');
            for (const [x, z] of [[-18, -10], [18, -10], [-18, -24], [18, -24], [-18, -40], [18, -40]]) {
                const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7, 6), std(0x3f3f46, 0.6, 0.5));
                p.position.set(x, 3.5, z);
                S.add(p);
            }
            // hot-air balloons in the sky
            for (let i = 0; i < 5; i++) {
                const hab = new THREE.Group();
                const env = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshStandardMaterial({ map: L.canvasTex('hab' + i, 128, 64, (g, w, h) => {
                    const cs = [['#ef4444', '#facc15'], ['#3b82f6', '#f8fafc'], ['#22c55e', '#fb923c'], ['#a855f7', '#f472b6'], ['#f97316', '#1e3a8a']][i];
                    for (let k = 0; k < 8; k++) { g.fillStyle = cs[k % 2]; g.fillRect(k * 16, 0, 16, h); }
                }), roughness: 0.6 }));
                env.scale.y = 1.2;
                const bask = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), std(0x78350f, 0.9));
                bask.position.y = -8.4;
                hab.add(env, bask);
                hab.position.set(-80 + i * 40, 35 + (i % 3) * 12, -140 - (i % 2) * 40);
                S.add(hab);
                const sp = 0.6 + i * 0.15;
                S.animate((dt) => { hab.position.x += sp * dt; hab.position.y += Math.sin(performance.now() * 0.0005 + i) * 0.01; if (hab.position.x > 140) hab.position.x = -140; });
            }
            // ferris wheel silhouette
            const fw = new THREE.Mesh(new THREE.TorusGeometry(14, 0.4, 6, 40), std(0xfef3c7, 0.5, 0.3, { emissive: 0xf59e0b, emissiveIntensity: 0.5 }));
            fw.position.set(40, 17, -80);
            S.add(fw);
            S.animate((dt) => { fw.rotation.z += dt * 0.1; });
            S.data.fireworks = 0;
        },
        schedule(S) {
            const kinds = ['red', 'blue', 'green', 'yellow', 'purple', 'pink'];
            const spawnBalloon = (S2, bi, kind, rise, sway, ph, delayLift) => {
                const [bx, bz] = BASKETS[bi];
                const t = A.balloon(kind);
                const top = 15;
                const life = top / rise;
                const isBomb = kind === 'bomb', isGold = kind === 'gold';
                S2.addTarget(Object.assign(t, {
                    pos: V(bx + (Math.sin(ph) * 0.3), 0.5, bz), points: isGold ? 500 : 100, penalty: isBomb ? 250 : 0, penaltyLabel: 'BOOM!', bonus: isGold,
                    life, inT: 0.3, appear: 'scale', outT: 0.25, vanish: 'scale', death: isBomb ? 'burst' : 'pop',
                    deathColor: { red: 0xef4444, blue: 0x3b82f6, green: 0x22c55e, yellow: 0xfacc15, purple: 0xa855f7, pink: 0xec4899, gold: 0xfbbf24, bomb: 0x111111 }[kind],
                    motion: (tg, tt, out) => {
                        const lift = Math.max(0, tt - delayLift);
                        out.set(Math.sin(tt * 1.3 + ph) * sway * Math.min(1, lift), lift * rise, Math.cos(tt * 0.9 + ph) * sway * 0.4);
                        tg.pivot.rotation.z = Math.sin(tt * 1.3 + ph) * 0.12;
                    },
                    onKill: () => { if (isBomb) BO.Sound.playExplosion(0.4); else SFX.pop(); }
                }));
            };
            K.ramp(S, { from: 0.85, to: 0.32, start: 0.2 }, (at, k, rng) => {
                const bi = Math.floor(rng() * BASKETS.length);
                const roll = rng();
                const kind = roll < 0.06 ? 'gold' : (k > 0.12 && roll < 0.2) ? 'bomb' : kinds[Math.floor(rng() * kinds.length)];
                const rise = lerp(1.7, 3.4, k) * (kind === 'gold' ? 1.6 : 1) * (0.85 + rng() * 0.3);
                const sway = 0.4 + rng() * 0.8;
                const ph = rng() * 6.28;
                S.at(at, (S2) => spawnBalloon(S2, bi, kind, rise, sway, ph, 0.2));
                // bouquets
                if (k > 0.3 && rng() < 0.18) {
                    const n = 4 + Math.floor(rng() * 3);
                    const bi2 = Math.floor(rng() * BASKETS.length);
                    for (let j = 0; j < n; j++) {
                        const kd = rng() < 0.15 ? 'bomb' : kinds[Math.floor(rng() * kinds.length)];
                        const ph2 = rng() * 6.28, rs2 = lerp(1.8, 3.0, k);
                        S.at(at + j * 0.08, (S2) => spawnBalloon(S2, bi2, kd, rs2, 0.9, ph2, 0.1 + j * 0.05));
                    }
                }
            });
        },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        update(S, dt, lib, state) {
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            if (state !== 'running' || S.k < 0.75) return;
            S.data.fwT = (S.data.fwT || 0) - dt;
            if (S.data.fwT <= 0) {
                S.data.fwT = 0.35 + Math.random() * 0.6;
                const p = V((Math.random() - 0.5) * 80, 30 + Math.random() * 20, -70 - Math.random() * 40);
                const c = [0xf472b6, 0xfacc15, 0x60a5fa, 0x4ade80, 0xf97316, 0xffffff][Math.floor(Math.random() * 6)];
                BO.FX.spawnParticles(p, 40, c, 14, 2.5, 1.3, 2.4);
                setTimeout(() => SFX.noise(0.4, 400, 'lowpass', 0.7, 0.2), 300);
            }
        }
    });

    /* ================================================================
       10. KILLHOUSE BLITZ — on-rails CQB walkthrough with hostages
    ================================================================ */
    const KH_PTS = [V(0, 0, 0), V(0, 0, -28), V(0.5, 0, -50), V(12, 0, -60), V(28, 0, -62), V(32, 0, -78), V(32, 0, -104), V(26, 0, -120), V(8, 0, -126), V(-8, 0, -130), V(-12, 0, -150), V(-12, 0, -180), V(-6, 0, -200), V(-6, 0, -240), V(-6, 0, -280)];
    MG.register({
        id: 'killhouse_blitz', cat: 'target', order: 10,
        name: 'Killhouse Blitz', icon: '🏚️', accent: '#ef4444',
        tagline: 'Clear every room. Save every hostage.',
        desc: 'The final exam. You walk at a steady pace through a plywood killhouse. Hostiles snap out of doorways, rise from behind crates and drop from the rafters. Hostages appear without warning. Headshots pay 1.5x, and every hostage you hit costs 400. Clear it clean.',
        hudSub: 'Hostiles = red outline • Hostages = yellow outline',
        duration: 60, stars: [2500, 5000, 8500, 12000], standardWeapon: 'mp5', rail: true, customMusic: true,
        map: {
            atmosphere: { skyTop: 0x0a0a0a, skyBottom: 0x1c1917, fogColor: 0x141210, fogDensity: 0.035, sunColor: 0xfef3c7, sunIntensity: 0.35, sunPos: [10, 60, 10], hemiSky: 0xfef3c7, hemiGround: 0x292524, hemiIntensity: 0.6 },
            boxes: [B(0, -0.5, -140, 160, 1, 340, 'concrete')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('tactical');
            const R = K.rail(KH_PTS, false, 0.35);
            S.data.rail = R;
            S.data.dist = 1;
            const ply = L.canvasTex('plywood', 256, 256, (g, w, h) => {
                g.fillStyle = '#b08d57'; g.fillRect(0, 0, w, h);
                const rnd = L.mulberry32(3);
                for (let i = 0; i < 60; i++) {
                    g.strokeStyle = `rgba(110,74,34,${0.1 + rnd() * 0.25})`;
                    g.lineWidth = 1 + rnd() * 3;
                    g.beginPath();
                    const y = rnd() * h;
                    g.moveTo(0, y);
                    g.bezierCurveTo(w * 0.3, y + rnd() * 20 - 10, w * 0.6, y + rnd() * 20 - 10, w, y + rnd() * 10 - 5);
                    g.stroke();
                }
                g.fillStyle = 'rgba(30,20,10,0.6)';
                for (let i = 0; i < 5; i++) g.fillRect(rnd() * w, rnd() * h, 4, 4);
                g.strokeStyle = 'rgba(60,40,20,0.8)'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
            });
            ply.wrapS = ply.wrapT = THREE.RepeatWrapping;
            const wallMat = A.pbrMat('cyberpunk/Brutalist Concrete/bare-megablock-concrete-001.png', 1, 1, { color: 0xd6cfc2, roughness: 0.85 });
            const seg = 2.4;
            const n = Math.floor(R.len / seg);
            const doors = [];
            const strobePts = [];
            const khCrateTr = [];
            const khTankTr = [];
            const wallGeo = new THREE.BoxGeometry(0.2, 3.2, seg + 0.02);
            for (let i = 0; i < n; i++) {
                const u = (i + 0.5) / n;
                const p = R.curve.getPointAt(u);
                const t = R.curve.getTangentAt(u);
                const yaw = Math.atan2(t.x, t.z);
                const side = V(Math.cos(yaw), 0, -Math.sin(yaw));
                for (const s of [-1, 1]) {
                    const isDoor = i > 3 && (i % 6 === (s > 0 ? 2 : 5));
                    if (isDoor) {
                        doors.push({ s: u * R.len, side: s, p: p.clone().addScaledVector(side, s * 2.6), yaw });
                        const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, seg), wallMat);
                        lintel.position.set(p.x + side.x * s * 2.6, 2.8, p.z + side.z * s * 2.6);
                        lintel.rotation.y = yaw;
                        S.add(lintel);
                        const dark = new THREE.Mesh(new THREE.PlaneGeometry(seg, 2.4), basic(0x050403));
                        dark.position.set(p.x + side.x * s * 3.6, 1.2, p.z + side.z * s * 3.6);
                        dark.rotation.y = yaw + Math.PI / 2 * s;
                        S.add(dark);
                        continue;
                    }
                    const w = new THREE.Mesh(wallGeo, wallMat);
                    w.position.set(p.x + side.x * s * 2.6, 1.6, p.z + side.z * s * 2.6);
                    w.rotation.y = yaw;
                    w.receiveShadow = true;
                    S.add(w);
                    S.solid(w);
                }
                if (i % 3 === 0) {
                    const light = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 1.6), basic(0xfefce8));
                    light.position.set(p.x, 3.15, p.z);
                    light.rotation.y = yaw;
                    S.add(light);
                    const beam = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.2, 0.2), std(0x292524, 0.8));
                    beam.position.set(p.x, 3.3, p.z);
                    beam.rotation.y = yaw;
                    S.add(beam);
                    if (i % 6 === 0) strobePts.push(V(p.x, 3.1, p.z));
                }
                if (i % 9 === 4) {
                    const cs = i % 2 ? 1 : -1;
                    const cx = p.x + side.x * cs * 1.6, cz = p.z + side.z * cs * 1.6;
                    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.1), std(0x78552b, 0.9));
                    crate.position.set(cx, 0.5, cz);
                    crate.rotation.y = yaw + 0.2;
                    S.add(crate);
                    S.solid(crate);
                    khCrateTr.push({ pos: [cx, 0, cz], rot: yaw + 0.2, scale: 1.35 });
                    if (i % 18 === 4) khTankTr.push({ pos: [p.x - side.x * cs * 1.8, 0, p.z - side.z * cs * 1.8], rot: yaw, scale: 1.1 });
                }
            }
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/blaster_kit/crate-wide.glb', khCrateTr, { solidSession: S });
            L.placeGLBInstanced(S.scene, 'staged_assets/3d_models/city_industrial_kit/detail-tank.glb', khTankTr);
            S.data.doors = doors;
            if (BO.Settings.getQualityPreset().pointLights) {
                const lamp = new THREE.PointLight(0xfff7d6, 1.8, 18, 1.6);
                S.add(lamp);
                S.data.lamp = lamp;
            }
            const sign = A.sign('KILLHOUSE • LIVE FIRE', 4, 0.6, { bg: '#7f1d1d', color: '#fef2f2', borderColor: '#fca5a5', size: 0.5 });
            sign.position.set(0, 2.7, -6);
            S.add(sign);
            if (strobePts.length) {
                const strobes = A.bulbs(strobePts, [0xef4444, 0xf59e0b, 0xfef08a], 0.08);
                S.add(strobes); A.animateBulbs(S, strobes, 5, 'chase');
            }
            const hazTex = L.canvasTex('kh-haz', 128, 32, (g, w, h) => {
                g.fillStyle = '#18181b'; g.fillRect(0, 0, w, h);
                g.fillStyle = '#facc15';
                for (let x = -32; x < w + 32; x += 24) {
                    g.beginPath(); g.moveTo(x, h); g.lineTo(x + 12, h); g.lineTo(x + 22, 0); g.lineTo(x + 10, 0); g.closePath(); g.fill();
                }
            });
            const startStrip = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.6), new THREE.MeshBasicMaterial({ map: hazTex }));
            startStrip.rotation.x = -Math.PI / 2; startStrip.position.set(0, 0.015, -5.2); S.add(startStrip);
        },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        preUpdate(S, dt, lib, state) {
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt);
            const R = S.data.rail;
            if (!R) return;
            const run = state === 'running' || state === 'finish' || state === 'results';
            if (run) {
                S.data.speed = lerp(S.data.speed || 0, 4.4, Math.min(1, dt * 2));
                S.data.dist = Math.min(R.len - 2, S.data.dist + S.data.speed * dt);
                S.data.ph = (S.data.ph || 0) + dt * S.data.speed * 1.6;
            }
            const ph = S.data.ph || 0;
            const r = K.driveRail(S, R, S.data.dist, dt, { bank: 0.03, eye: 1.6 + Math.abs(Math.sin(ph)) * 0.04, pitchFollow: 0 });
            if (run && Math.floor(ph / Math.PI) !== S.data._step) { S.data._step = Math.floor(ph / Math.PI); BO.Sound.playFootstep(false); }
            if (r && S.data.lamp) S.data.lamp.position.set(r.p.x, 2.8, r.p.z);
        },
        schedule(S) {
            K.ramp(S, { from: 1.1, to: 0.5, start: 0.6, end: 58.5 }, (at, k, rng) => {
                const kind = rng() < 0.55 ? 'door' : rng() < 0.6 ? 'crate' : 'drop';
                const hostage = rng() < 0.18;
                const life = lerp(2.2, 1.15, k);
                const ahead = 8 + rng() * 9;
                const lat = (rng() - 0.5) * 2.6;
                S.at(at, (S2) => {
                    const R = S2.data.rail;
                    const s0 = S2.data.dist + ahead;
                    if (s0 > R.len - 3) return;
                    let pos, appear, slideDir = 1;
                    const face = R.curve.getPointAt(clamp01((S2.data.dist + 1) / R.len));
                    if (kind === 'door') {
                        const d = S2.data.doors.find((dd) => dd.s > s0 - 2 && dd.s < s0 + 12 && !dd.busy);
                        if (d) {
                            d.busy = true;
                            setTimeout(() => { d.busy = false; }, life * 1000 + 600);
                            pos = d.p.clone().add(V(0, 0, 0));
                            appear = 'slide';
                            slideDir = d.side;
                        }
                    }
                    if (!pos) {
                        const u = s0 / R.len;
                        const p = R.curve.getPointAt(u);
                        const tan = R.curve.getTangentAt(u);
                        const yaw = Math.atan2(tan.x, tan.z);
                        pos = p.clone().addScaledVector(V(Math.cos(yaw), 0, -Math.sin(yaw)), lat);
                        appear = kind === 'drop' ? 'drop' : 'rise';
                    }
                    const t = A.silhouette(hostage ? 'hostage' : 'hostile', 0.95);
                    S2.addTarget(Object.assign(t, {
                        pos, yaw: A.yawTo(pos, face), points: 130, penalty: hostage ? 400 : 0, penaltyLabel: 'HOSTAGE!', life: hostage ? life * 1.3 : life,
                        appear, slideDir, slideDist: 1.4, riseDepth: kind === 'drop' ? 2.6 : 1.9, death: 'knock', deathColor: 0xb08d57,
                        onKill: () => SFX.thunk()
                    }));
                });
            });
        }
    });
})(window);
