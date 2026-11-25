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
        duration: 60, stars: [4000, 8500, 14000, 20000], standardWeapon: 'g36c_tac',
        map: {
            atmosphere: { skyTop: 0x020617, skyBottom: 0x1e1b4b, fogColor: 0x0b1026, fogDensity: 0.006, sunColor: 0x93c5fd, sunIntensity: 0.55, sunPos: [-20, 50, 30], hemiSky: 0x6366f1, hemiGround: 0x0f172a, hemiIntensity: 0.65, moon: true },
            boxes: [B(0, -0.5, 0, 26, 1, 26, 'concrete')],
            spawn: { x: 0, y: 0, z: 4, yaw: 0 }
        },
        build(S) {
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
            // helipad
            const pad = new THREE.Mesh(new THREE.CircleGeometry(5, 40), new THREE.MeshStandardMaterial({ map: L.canvasTex('helipad', 256, 256, (g, w) => {
                g.fillStyle = '#334155'; g.fillRect(0, 0, w, w);
                g.strokeStyle = '#facc15'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke();
                g.fillStyle = '#f8fafc'; g.font = '900 150px Bahnschrift, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', 128, 136);
            }), roughness: 0.8 }));
            pad.rotation.x = -Math.PI / 2;
            pad.position.set(0, 0.01, 2);
            S.add(pad);
            // rooftop clutter (cover + flavour)
            const ac = std(0x9ca3af, 0.5, 0.6);
            S.box(-9, 0.8, 8, 2.4, 1.6, 2.4, ac);
            S.box(9, 0.8, -8, 2.4, 1.6, 3.2, ac);
            S.box(9.5, 1.6, 9, 3, 3.2, 3, std(0x52525b, 0.8));
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
        duration: 60, stars: [3000, 6500, 10500, 14000], standardWeapon: 'dragunov_svd', ringScoring: true,
        map: {
            atmosphere: { skyTop: 0x0c4a6e, skyBottom: 0xe0f2fe, fogColor: 0xc5dcea, fogDensity: 0.0022, sunColor: 0xfff1d6, sunIntensity: 1.9, sunPos: [80, 60, -40], hemiSky: 0xe0f2fe, hemiGround: 0x3f6212, hemiIntensity: 0.85 },
            boxes: [B(0, -0.5, 1, 12, 1, 10, 'wood_plank')],
            spawn: { x: 0, y: 0, z: 1.5, yaw: 0 }
        },
        build(S) {
            K.booth(S, { roof: true, wood: 0x6b4423 });
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
            for (let i = 0; i < 70; i++) {
                const t = A.tree(2 + rnd() * 1.5, rnd() < 0.5 ? 0x14532d : 0x166534);
                t.position.set((rnd() - 0.5) * 420, -23, -40 - rnd() * 260);
                S.add(t);
            }
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
                        onKill: () => { S2.data.busy.delete(idx); setTimeout(() => SFX.ding(0.9 + (200 - sp.d) / 400), sp.d / 340 * 1000); },
                        onExpire: () => S2.data.busy.delete(idx)
                    }));
                });
            });
        }
    });

    /* ================================================================
       8. HELI GUNNER — orbit a city block from a helicopter door
    ================================================================ */
    const HELI_PTS = (() => {
        const pts = [];
        for (let i = 0; i < 24; i++) {
            const a = -i / 24 * Math.PI * 2;
            const r = 50 + Math.sin(i / 24 * Math.PI * 4) * 6;
            pts.push(V(Math.cos(a) * r, 27 + Math.sin(i / 24 * Math.PI * 6) * 3, Math.sin(a) * r));
        }
        return pts;
    })();
    MG.register({
        id: 'heli_gunner', cat: 'target', order: 8,
        name: 'Heli Gunner', icon: '🚁', accent: '#a3e635',
        tagline: 'Door seat, open sky, rooftops full of trouble',
        desc: 'Ride in the open door of a Black Hawk circling a downtown block. Hostiles pop up on the rooftops; hostages and civilians do too. The helicopter climbs and dips as it orbits, so read the roofline and lead your shots.',
        hudSub: 'Hostiles on rooftops — hostages are a heavy penalty',
        duration: 60, stars: [3000, 6500, 10500, 15000], standardWeapon: 'm249', rail: true,
        map: {
            atmosphere: { skyTop: 0x1e3a8a, skyBottom: 0xfdba74, fogColor: 0xd8b494, fogDensity: 0.004, sunColor: 0xffc58a, sunIntensity: 1.6, sunPos: [-60, 40, 80], hemiSky: 0xfed7aa, hemiGround: 0x334155, hemiIntensity: 0.8 },
            boxes: [B(0, -0.5, 0, 400, 1, 400, 'asphalt')],
            spawn: { x: HELI_PTS[0].x, y: HELI_PTS[0].y, z: HELI_PTS[0].z, yaw: 0 }
        },
        build(S) {
            const R = K.rail(HELI_PTS, true, 0.5);
            S.data.rail = R;
            S.data.dist = 0;
            // city block
            const roofs = [];
            const rnd = L.mulberry32(88);
            const cols = [0x64748b, 0x78716c, 0x475569, 0x7c2d12, 0x334155, 0x57534e];
            for (let gx = -3; gx <= 3; gx++) {
                for (let gz = -3; gz <= 3; gz++) {
                    const cx = gx * 11 + (rnd() - 0.5) * 2, cz = gz * 11 + (rnd() - 0.5) * 2;
                    if (Math.hypot(cx, cz) > 38) continue;
                    const w = 6 + rnd() * 3, d = 6 + rnd() * 3;
                    const h = 6 + rnd() * 18 + (Math.hypot(cx, cz) < 15 ? 6 : 0);
                    const b = A.building(w, h, d, cols[Math.floor(rnd() * cols.length)], gx * 7 + gz, 0.35);
                    b.position.set(cx, 0, cz);
                    S.add(b);
                    S.solid(b);
                    const lip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.5, d + 0.3), std(0x1f2937, 0.8));
                    lip.position.set(cx, h + 0.25, cz);
                    S.add(lip);
                    if (rnd() < 0.4) {
                        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.8, 10), std(0x9ca3af, 0.6, 0.5));
                        tank.position.set(cx + w * 0.25, h + 1.2, cz - d * 0.2);
                        S.add(tank);
                    }
                    roofs.push({ x: cx, z: cz, w, d, h });
                }
            }
            S.data.roofs = roofs;
            // outer city ring for skyline
            for (let i = 0; i < 70; i++) {
                const a = rnd() * Math.PI * 2, r = 90 + rnd() * 120, h = 15 + rnd() * 50, w = 10 + rnd() * 10;
                const b = A.building(w, h, w, cols[i % cols.length], 100 + i, 0.3);
                b.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
                S.add(b);
            }
            // roads
            for (let i = -3; i <= 3; i++) {
                for (const rot of [0, Math.PI / 2]) {
                    const road = new THREE.Mesh(new THREE.PlaneGeometry(3, 90), std(0x1f2937, 0.95));
                    road.rotation.set(-Math.PI / 2, 0, rot);
                    road.position.set(rot ? 0 : i * 11 + 5.5, 0.02, rot ? i * 11 + 5.5 : 0);
                    S.add(road);
                }
            }
            // helicopter interior that rides with us
            const heli = new THREE.Group();
            const floor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 3.4), std(0x1f2937, 0.7, 0.4));
            floor.position.set(-0.6, -0.04, 0);
            heli.add(floor);
            const hull = std(0x3f4b3a, 0.6, 0.4);
            for (const z of [-1.6, 1.6]) {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.0, 0.14), hull);
                post.position.set(0.55, 1.0, z);
                heli.add(post);
            }
            const roofP = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 3.6), hull);
            roofP.position.set(-0.5, 2.05, 0);
            heli.add(roofP);
            const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6), std(0x18181b, 0.5, 0.7));
            skid.rotation.x = Math.PI / 2;
            skid.position.set(0.9, -0.6, 0);
            heli.add(skid);
            const rotor = new THREE.Group();
            for (let i = 0; i < 4; i++) {
                const blade = new THREE.Mesh(new THREE.BoxGeometry(7, 0.04, 0.3), std(0x111827, 0.6, 0.4));
                blade.rotation.y = i * Math.PI / 4;
                rotor.add(blade);
            }
            rotor.position.set(-0.6, 2.6, 0);
            heli.add(rotor);
            heli.traverse((o) => { if (o.isMesh) o.castShadow = true; });
            S.add(heli);
            S.data.heli = heli;
            S.data.rotor = rotor;
            K.cloudLayer(S, 12, 80, 220, 0xfff7ed, 0.7);
        },
        preUpdate(S, dt, lib, state) {
            const R = S.data.rail;
            if (!R) return;
            if (state !== 'countdown') S.data.dist += 15 * dt;
            const r = K.driveRail(S, R, S.data.dist, dt, { bank: 0.18, pitchFollow: 0.2, eye: 1.25 });
            if (!r) return;
            if (!S.data.aimed) {
                S.data.aimed = true;
                BO.Player.yaw = Math.atan2(r.p.x, r.p.z); // face the city centre
                BO.Player.pitch = -0.32;
            }
            const heli = S.data.heli;
            // The open door (local +X) faces the city centre: pick whichever side of travel it lies on.
            const h = r.heading;
            const rightX = Math.cos(h), rightZ = -Math.sin(h);
            const side = (rightX * -r.p.x + rightZ * -r.p.z) >= 0 ? 0 : Math.PI;
            heli.position.copy(BO.Player.rideState.pos);
            heli.rotation.set(0, h + side, 0);
            heli.rotateX(-(BO.Player.rideState.roll || 0) * 0.5);
            S.data.rotor.rotation.y += dt * 28;
            S.data.thwop = (S.data.thwop || 0) - dt;
            if (S.data.thwop <= 0) { SFX.noise(0.09, 160, 'lowpass', 0.8, 0.18); S.data.thwop = 0.11; }
            BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.004);
        },
        schedule(S) {
            K.ramp(S, { from: 1.15, to: 0.5, start: 0.4 }, (at, k, rng) => {
                const pickR = rng();
                const civ = rng() < 0.15;
                const life = lerp(2.8, 1.5, k);
                const lateral = (rng() - 0.5) * 0.8;
                S.at(at, (S2) => {
                    const R = S2.data.rail;
                    const hp = R.curve.getPointAt((((S2.data.dist + 20) / R.len) % 1 + 1) % 1);
                    const toHeli = Math.atan2(hp.x, hp.z);
                    const cands = S2.data.roofs.filter((rf) => {
                        const a = Math.atan2(rf.x, rf.z);
                        return Math.abs(BO.Math.angleDiff(a, toHeli)) < 1.0 || Math.hypot(rf.x, rf.z) < 10;
                    });
                    if (!cands.length) return;
                    const rf = cands[Math.floor(pickR * cands.length) % cands.length];
                    const dir = V(hp.x - rf.x, 0, hp.z - rf.z).normalize();
                    const pos = V(rf.x + dir.x * (rf.w / 2 - 0.6) + dir.z * lateral * rf.w, rf.h + 0.5, rf.z + dir.z * (rf.d / 2 - 0.6) - dir.x * lateral * rf.d);
                    const t = A.silhouette(civ ? 'hostage' : 'hostile', 1.25);
                    S2.addTarget(Object.assign(t, {
                        pos, faceCamera: true, points: 150, penalty: civ ? 300 : 0, penaltyLabel: 'HOSTAGE!', life: civ ? life * 1.3 : life,
                        appear: 'rise', riseDepth: 2.4, death: 'tumble', deathColor: 0x57534e
                    }));
                });
            });
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
        duration: 60, stars: [4500, 9000, 15000, 22000], standardWeapon: 'famas_f1',
        map: {
            atmosphere: { skyTop: 0x312e81, skyBottom: 0xfb923c, fogColor: 0xc38a73, fogDensity: 0.006, sunColor: 0xffb070, sunIntensity: 1.3, sunPos: [-50, 14, -80], hemiSky: 0xfda4af, hemiGround: 0x365314, hemiIntensity: 0.8 },
            boxes: [B(0, -0.5, -25, 200, 1, 200, 'nuketown_grass')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            K.booth(S, { awning: '#db2777', wood: 0xf5f5f4, trim: 0xbe185d });
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
        update(S, dt, lib, state) {
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
        duration: 60, stars: [2500, 5000, 8500, 12000], standardWeapon: 'mp5', rail: true,
        map: {
            atmosphere: { skyTop: 0x0a0a0a, skyBottom: 0x1c1917, fogColor: 0x141210, fogDensity: 0.035, sunColor: 0xfef3c7, sunIntensity: 0.35, sunPos: [10, 60, 10], hemiSky: 0xfef3c7, hemiGround: 0x292524, hemiIntensity: 0.6 },
            boxes: [B(0, -0.5, -140, 160, 1, 340, 'concrete')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
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
            const wallMat = new THREE.MeshStandardMaterial({ map: ply, roughness: 0.9 });
            const seg = 2.4;
            const n = Math.floor(R.len / seg);
            const doors = [];
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
                }
                if (i % 9 === 4) {
                    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.1), std(0x78552b, 0.9));
                    const cs = i % 2 ? 1 : -1;
                    crate.position.set(p.x + side.x * cs * 1.6, 0.5, p.z + side.z * cs * 1.6);
                    crate.rotation.y = yaw + 0.2;
                    S.add(crate);
                    S.solid(crate);
                }
            }
            S.data.doors = doors;
            if (BO.Settings.getQualityPreset().pointLights) {
                const lamp = new THREE.PointLight(0xfff7d6, 1.8, 18, 1.6);
                S.add(lamp);
                S.data.lamp = lamp;
            }
            const sign = A.sign('KILLHOUSE • LIVE FIRE', 4, 0.6, { bg: '#7f1d1d', color: '#fef2f2', borderColor: '#fca5a5', size: 0.5 });
            sign.position.set(0, 2.7, -6);
            S.add(sign);
        },
        preUpdate(S, dt, lib, state) {
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
