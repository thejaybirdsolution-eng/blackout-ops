/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Target Practice courses 1–5 + shared course kit
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const { B, SFX, std, basic, clamp01, Ease } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;

    /* ================================================================ kit */
    const K = BO.MGCourseKit = {
        /** Shooting booth around the spawn, facing -Z. */
        booth(S, o = {}) {
            const w = o.w || 3.4, hw = w / 2;
            const wood = std(o.wood || 0x7c5a35, 0.8);
            const dark = std(o.trim || 0x3f2a14, 0.85);
            // counter
            const counter = S.box(0, 0.52, -0.72, w + 0.4, 1.04, 0.5, wood);
            const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.06, 0.66), dark);
            top.position.set(0, 1.07, -0.72);
            top.castShadow = top.receiveShadow = true;
            S.add(top);
            counter.userData.keep = true;
            // side walls & back
            S.box(-hw - 0.1, 1.35, 0.4, 0.2, 2.7, 2.7, wood);
            S.box(hw + 0.1, 1.35, 0.4, 0.2, 2.7, 2.7, wood);
            S.box(0, 1.35, 1.8, w + 0.4, 2.7, 0.2, wood);
            // keep players from vaulting the counter
            S.collider(-hw, 1.04, -1.0, hw, 3.4, -0.95);
            if (o.roof !== false) {
                const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1.0, 0.12, 3.4), dark);
                roof.position.set(0, 2.78, 0.25);
                roof.castShadow = true;
                S.add(roof);
                if (o.awning) {
                    const stripes = L.canvasTex('awning:' + o.awning, 256, 32, (g, W, H) => {
                        for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f8fafc' : o.awning; g.fillRect(i * 32, 0, 32, H); }
                    });
                    const aw = new THREE.Mesh(new THREE.PlaneGeometry(w + 1.0, 0.32), new THREE.MeshStandardMaterial({ map: stripes, side: THREE.DoubleSide, roughness: 0.8 }));
                    aw.position.set(0, 2.68, -1.42);
                    aw.rotation.x = -0.35;
                    S.add(aw);
                }
            }
            // a few spent casings & a mat on the counter for flavour
            const mat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.01, 0.3), std(0x14532d, 0.95));
            mat.position.set(0.9, 1.105, -0.78);
            S.add(mat);
            for (let i = 0; i < 5; i++) {
                const c = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.025, 6), std(0xd4a017, 0.3, 0.9));
                c.rotation.z = Math.PI / 2;
                c.rotation.y = i * 1.3;
                c.position.set(-1.2 + i * 0.12, 1.11, -0.8 - (i % 2) * 0.06);
                S.add(c);
            }
        },

        groundPlane(S, size, color, y = 0.001, rough = 0.95) {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), std(color, rough));
            m.rotation.x = -Math.PI / 2;
            m.position.y = y;
            m.receiveShadow = true;
            S.add(m);
            S.solid(m);
            return m;
        },

        rail(points, closed = false, tension = 0.5) {
            const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', tension);
            curve.arcLengthDivisions = 2000;
            return { curve, len: curve.getLength(), closed };
        },

        /** Moves the rider along a rail; the player's view turns with the vehicle. */
        driveRail(S, R, dist, dt, o = {}) {
            const P = BO.Player;
            const rs = P.rideState;
            if (!rs) return null;
            const u = R.closed ? (((dist / R.len) % 1) + 1) % 1 : clamp01(dist / R.len);
            const p = R.curve.getPointAt(u);
            const tan = R.curve.getTangentAt(u);
            const heading = Math.atan2(-tan.x, -tan.z);
            if (S.data._railHead === undefined) {
                S.data._railHead = heading;
                P.yaw = heading + (o.yawOffset || 0);
                P.pitch = o.pitch0 || 0;
                S.data._railRate = 0;
            }
            const dh = BO.Math.angleDiff(S.data._railHead, heading);
            P.yaw += dh;
            S.data._railHead = heading;
            const rate = dt > 0 ? dh / dt : 0;
            S.data._railRate = lerp(S.data._railRate, rate, Math.min(1, dt * 5));
            rs.pos.set(p.x, p.y + (o.lift || 0), p.z);
            if (o.side) {
                // lateral offset (e.g. helicopter door)
                rs.pos.x += Math.cos(heading) * o.side;
                rs.pos.z += -Math.sin(heading) * o.side;
            }
            rs.roll = BO.Math.clamp(S.data._railRate * (o.bank ?? 0.12), -0.42, 0.42) + (o.rollAdd || 0);
            rs.pitch = Math.asin(BO.Math.clamp(tan.y, -1, 1)) * (o.pitchFollow ?? 0.55) + (o.pitchAdd || 0);
            if (o.eye !== undefined) rs.eye = o.eye;
            return { p, tan, u, heading };
        },

        /** Deterministic, accelerating spawn times. */
        ramp(S, o, fn) {
            const rng = S.rng;
            let t = o.start ?? 0.25;
            const end = o.end ?? (S.duration - 1.2);
            let i = 0;
            while (t < end) {
                const k = clamp01(t / S.duration);
                const at = t;
                fn(at, k, rng, i++);
                const gap = lerp(o.from, o.to, Math.pow(k, o.curve ?? 1));
                t += gap * (1 - (o.jitter ?? 0.25) + rng() * (o.jitter ?? 0.25) * 2);
            }
        },

        /** Lateral sine sweep motion. */
        sweep(amp, speed, phase = 0, axis = 'x') {
            return (tg, t, out) => {
                out.set(0, 0, 0);
                out[axis] = Math.sin(t * speed + phase) * amp;
            };
        },

        pick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; },

        distanceSign(S, text, x, z, y = 0.6) {
            const s = A.sign(text, 1.2, 0.5, { bg: '#1f2937', color: '#fde68a', borderColor: '#f5a623', size: 0.55 });
            s.position.set(x, y, z);
            S.add(s);
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, y, 0.06), std(0x3f3f46, 0.6, 0.5));
            post.position.set(x, y / 2, z - 0.02);
            S.add(post);
        },

        fence(S, x1, z1, x2, z2, color = 0x7c5a35) {
            const len = Math.hypot(x2 - x1, z2 - z1);
            const ang = Math.atan2(x2 - x1, z2 - z1);
            const posts = Math.max(2, Math.round(len / 2.5));
            const mat = std(color, 0.9);
            for (let i = 0; i <= posts; i++) {
                const t = i / posts;
                const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), mat);
                p.position.set(lerp(x1, x2, t), 0.55, lerp(z1, z2, t));
                S.add(p);
            }
            for (const y of [0.45, 0.9]) {
                const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, len), mat);
                r.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
                r.rotation.y = ang;
                S.add(r);
            }
        },

        cloudLayer(S, count, y, spread, color = 0xffffff, opacity = 0.8) {
            const rnd = L.mulberry32(count * 31 + y);
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity, flatShading: true });
            for (let i = 0; i < count; i++) {
                const grp = new THREE.Group();
                const n = 3 + Math.floor(rnd() * 4);
                for (let j = 0; j < n; j++) {
                    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(4 + rnd() * 5, 0), mat);
                    b.position.set(j * 5 - n * 2.5, rnd() * 2, rnd() * 4);
                    b.scale.y = 0.55;
                    grp.add(b);
                }
                const a = rnd() * Math.PI * 2, r = spread * (0.4 + rnd() * 0.6);
                grp.position.set(Math.cos(a) * r, y + rnd() * 20, Math.sin(a) * r);
                S.add(grp);
                const sp = 0.4 + rnd() * 0.8;
                S.animate((dt) => { grp.position.x += sp * dt; if (grp.position.x > spread) grp.position.x = -spread; });
            }
        }
    };

    /* ================================================================
       1. RANGE DAY — classic pop-up range, stand behind the table
    ================================================================ */
    MG.register({
        id: 'range_day', cat: 'target', order: 1,
        name: 'Range Day', icon: '🎯', accent: '#f59e0b',
        tagline: 'Pop-up steel & paper on a sunlit range',
        desc: 'The classic. Stand at the firing line while bullseyes flip up across seven lanes from 8 to 35 metres. Hit the gold for a bullseye bonus. Targets get smaller, faster and start sliding as the clock runs down.',
        hudSub: 'Hit the gold ring for a BULLSEYE bonus',
        duration: 60, stars: [4000, 8000, 13000, 19000], standardWeapon: 'm4a1', ringScoring: true,
        map: {
            atmosphere: { skyTop: 0x2563eb, skyBottom: 0xfed7aa, fogColor: 0xf3d9b8, fogDensity: 0.006, sunColor: 0xffe2b0, sunIntensity: 1.9, sunPos: [-40, 38, 30], hemiSky: 0xdbeafe, hemiGround: 0x6b5a3e, hemiIntensity: 0.8 },
            boxes: [B(0, -0.5, -20, 140, 1, 140, 'desert_sand')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            K.booth(S, { awning: '#b91c1c' });
            // lanes
            const laneMat = std(0xe5e7eb, 0.7);
            for (let i = -4; i <= 4; i++) {
                const line = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 40), laneMat);
                line.position.set(i * 2.6, 0.01, -21);
                S.add(line);
            }
            [10, 20, 30].forEach((d) => { K.distanceSign(S, d + 'M', -11.5, -d); K.distanceSign(S, d + 'M', 11.5, -d); });
            // berm + backstop
            const berm = new THREE.Mesh(new THREE.CylinderGeometry(60, 64, 6, 4, 1), std(0x8b6b45, 1));
            berm.scale.set(1, 1, 0.08);
            berm.rotation.y = Math.PI / 4;
            berm.position.set(0, 3, -46);
            S.add(berm);
            S.solid(berm);
            const back = new THREE.Mesh(new THREE.BoxGeometry(34, 5, 0.6), std(0x52525b, 0.6, 0.5));
            back.position.set(0, 2.5, -42);
            S.add(back);
            S.solid(back);
            for (let i = 0; i < 18; i++) {
                const t = A.tree(1.4 + (i % 3) * 0.3, i % 2 ? 0x166534 : 0x3f6212);
                const side = i % 2 ? 1 : -1;
                t.position.set(side * (19 + (i % 4) * 4), 0, -6 - i * 3);
                S.add(t);
            }
            // target rails across the range
            for (const z of [-12, -20, -28]) {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(26, 0.08, 0.08), std(0x71717a, 0.4, 0.8));
                rail.position.set(0, 0.06, z);
                S.add(rail);
            }
            K.cloudLayer(S, 10, 60, 160);
            const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 6), std(0xd4d4d8, 0.4, 0.8));
            flagPole.position.set(-8, 3, -3);
            S.add(flagPole);
            const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8, 8, 1), new THREE.MeshStandardMaterial({ color: 0xdc2626, side: THREE.DoubleSide }));
            flag.position.set(-7.3, 5.5, -3);
            S.add(flag);
            const base = flag.geometry.attributes.position.array.slice();
            S.animate(() => {
                const t = performance.now() * 0.004;
                const arr = flag.geometry.attributes.position.array;
                for (let i = 0; i < arr.length; i += 3) arr[i + 2] = base[i + 2] + Math.sin(t + base[i] * 3) * 0.12 * (base[i] + 0.7);
                flag.geometry.attributes.position.needsUpdate = true;
            });
        },
        schedule(S) {
            K.ramp(S, { from: 1.15, to: 0.42, start: 0.2 }, (at, k, rng) => {
                const lane = Math.floor(rng() * 7) - 3;
                const dist = 8 + rng() * (14 + k * 14);
                const radius = lerp(0.55, 0.32, k);
                const life = lerp(2.5, 1.0, k);
                const moving = rng() < k * 0.8;
                const amp = 1 + rng() * 2.2;
                const spd = lerp(1.2, 3.2, k) * (rng() < 0.5 ? 1 : -1);
                const ph = rng() * 6.28;
                const double = k > 0.45 && rng() < 0.35;
                const make = (offsetLane) => S.at(at, (S2) => {
                    const pos = V((lane + offsetLane) * 2.6, 0, -dist);
                    const t = A.bullseye(radius, 1.1 + (dist / 40) * 0.6);
                    S2.addTarget(Object.assign(t, { pos, points: 100, life, appear: 'flip', death: 'knock', motion: moving ? K.sweep(amp, spd, ph) : null, deathColor: 0xfafafa }));
                    SFX.clack();
                });
                make(0);
                if (double) make(lane > 0 ? -2 : 2);
            });
        }
    });

    /* ================================================================
       2. COASTER CHAOS — ride a roller coaster while targets pop up
    ================================================================ */
    const COASTER_PTS = (() => {
        const pts = [];
        const N = 30;
        for (let i = 0; i < N; i++) {
            const a = i / N * Math.PI * 2;
            const r = 92 + Math.sin(a * 3) * 26 + Math.cos(a * 2) * 10;
            const y = 5 + Math.max(0, Math.sin(a * 2 + 0.4)) * 15 + Math.sin(a * 5) * 3.2 + (i < 3 ? 6 : 0);
            pts.push(V(Math.cos(a) * r, Math.max(3.2, y), Math.sin(a) * r));
        }
        return pts;
    })();
    MG.register({
        id: 'coaster', cat: 'target', order: 2,
        name: 'Coaster Chaos', icon: '🎢', accent: '#ec4899',
        tagline: 'Hang on. Aim true. Scream later.',
        desc: 'Strap into the front car of the Thunderbolt coaster. Targets flip up beside the track, hang off the supports and float above the drops. Speed comes from gravity: slow on the crests, blistering in the dips, banking through every turn.',
        hudSub: 'Your view turns with the car — look ahead into the curves',
        duration: 60, stars: [4500, 9000, 15000, 22000], standardWeapon: 'mp7_navy', ringScoring: true, rail: true,
        map: {
            atmosphere: { skyTop: 0x0ea5e9, skyBottom: 0xe0f2fe, fogColor: 0xcde9f6, fogDensity: 0.004, sunColor: 0xfff7e6, sunIntensity: 1.8, sunPos: [60, 90, 40], hemiSky: 0xe0f2fe, hemiGround: 0x4d7c0f, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, 0, 420, 1, 420, 'nuketown_grass')],
            spawn: { x: COASTER_PTS[0].x, y: COASTER_PTS[0].y, z: COASTER_PTS[0].z, yaw: 0 }
        },
        build(S) {
            const R = K.rail(COASTER_PTS, true, 0.5);
            S.data.rail = R;
            S.data.dist = 0;
            S.data.speed = 6;
            // rails
            const samples = 900;
            const left = [], right = [];
            const frames = [];
            const up = V(0, 1, 0);
            for (let i = 0; i < samples; i++) {
                const u = i / samples;
                const p = R.curve.getPointAt(u);
                const t = R.curve.getTangentAt(u);
                const side = new THREE.Vector3().crossVectors(t, up).normalize();
                frames.push({ p, t, side });
                left.push(p.clone().addScaledVector(side, -0.62));
                right.push(p.clone().addScaledVector(side, 0.62));
            }
            const railMat = std(0xe11d48, 0.35, 0.7);
            for (const pts of [left, right]) {
                const c = new THREE.CatmullRomCurve3(pts, true);
                const tube = new THREE.Mesh(new THREE.TubeGeometry(c, 1600, 0.08, 6, true), railMat);
                tube.castShadow = true;
                S.add(tube);
            }
            const spine = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(frames.map((f) => f.p.clone().add(V(0, -0.35, 0))), true), 1600, 0.16, 6, true), std(0x9f1239, 0.4, 0.6));
            S.add(spine);
            // ties + supports (instanced)
            const tieCount = Math.floor(R.len / 1.3);
            const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.08, 0.16), std(0x3f3f46, 0.6, 0.5), tieCount);
            const dummy = new THREE.Object3D();
            for (let i = 0; i < tieCount; i++) {
                const u = i / tieCount;
                const p = R.curve.getPointAt(u);
                const t = R.curve.getTangentAt(u);
                dummy.position.copy(p).add(V(0, -0.1, 0));
                dummy.lookAt(p.clone().add(t));
                dummy.updateMatrix();
                ties.setMatrixAt(i, dummy.matrix);
            }
            S.add(ties);
            const supCount = Math.floor(R.len / 7);
            const supGeo = new THREE.CylinderGeometry(0.18, 0.26, 1, 6);
            supGeo.translate(0, 0.5, 0);
            const sups = new THREE.InstancedMesh(supGeo, std(0xf8fafc, 0.5, 0.6), supCount * 2);
            let si = 0;
            for (let i = 0; i < supCount; i++) {
                const u = i / supCount;
                const p = R.curve.getPointAt(u);
                const t = R.curve.getTangentAt(u);
                const side = new THREE.Vector3().crossVectors(t, up).normalize();
                for (const s of [-0.9, 0.9]) {
                    dummy.position.set(p.x + side.x * s, 0, p.z + side.z * s);
                    dummy.rotation.set(0, 0, 0);
                    dummy.scale.set(1, Math.max(0.5, p.y - 0.45), 1);
                    dummy.updateMatrix();
                    sups.setMatrixAt(si++, dummy.matrix);
                }
            }
            sups.count = si;
            S.add(sups);
            // the car
            const car = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 2.0), std(0xfacc15, 0.35, 0.3));
            body.position.y = 0.35;
            const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.5, 12, 1, false, 0, Math.PI), std(0xef4444, 0.35, 0.3));
            nose.rotation.z = Math.PI / 2;
            nose.position.set(0, 0.35, -1.0);
            const bar = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 6, 16, Math.PI), std(0xd4d4d8, 0.3, 0.9));
            bar.position.set(0, 0.85, -0.55);
            car.add(body, nose, bar);
            car.traverse((o) => { if (o.isMesh) o.castShadow = true; });
            S.add(car);
            S.data.car = car;
            // park scenery
            K.cloudLayer(S, 14, 70, 240);
            const wheel = new THREE.Group();
            const ring = new THREE.Mesh(new THREE.TorusGeometry(22, 0.5, 8, 48), std(0x38bdf8, 0.4, 0.6));
            wheel.add(ring);
            const gondolas = [];
            for (let i = 0; i < 16; i++) {
                const a = i / 16 * Math.PI * 2;
                const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.2, 22, 0.2), std(0xe2e8f0, 0.5, 0.7));
                spoke.position.set(Math.cos(a) * 11, Math.sin(a) * 11, 0);
                spoke.rotation.z = a - Math.PI / 2;
                wheel.add(spoke);
                const g = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2, 2), std([0xef4444, 0xfacc15, 0x22c55e, 0xa855f7][i % 4], 0.5));
                g.position.set(Math.cos(a) * 22, Math.sin(a) * 22 - 1.2, 0);
                wheel.add(g);
                gondolas.push(g);
            }
            wheel.position.set(0, 26, 0);
            S.add(wheel);
            const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 26, 6), std(0xe2e8f0, 0.5, 0.6));
            legs.position.set(0, 13, -1.5);
            S.add(legs);
            S.animate((dt) => {
                wheel.rotation.z += dt * 0.12;
                for (const g of gondolas) g.rotation.z = -wheel.rotation.z;
            });
            const tentCols = [0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e];
            for (let i = 0; i < 14; i++) {
                const a = i / 14 * Math.PI * 2 + 0.2;
                const r = 50 + (i % 3) * 8;
                const tent = new THREE.Mesh(new THREE.ConeGeometry(5, 6, 8), std(tentCols[i % 4], 0.7));
                tent.position.set(Math.cos(a) * r, 3, Math.sin(a) * r);
                S.add(tent);
            }
            for (let i = 0; i < 40; i++) {
                const a = i / 40 * Math.PI * 2;
                const r = 150 + (i % 5) * 9;
                const t = A.tree(2 + (i % 3) * 0.6);
                t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
                S.add(t);
            }
            // station at the start
            const st = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 14), std(0x78716c, 0.8));
            const p0 = R.curve.getPointAt(0);
            st.position.set(p0.x, p0.y - 0.9, p0.z);
            S.add(st);
            this.preUpdate(S, 0, L, 'countdown');
        },
        preUpdate(S, dt, lib, state) {
            const R = S.data.rail;
            if (!R) return;
            if (state === 'running' || state === 'finish' || state === 'results') {
                const p = R.curve.getPointAt(((S.data.dist / R.len) % 1 + 1) % 1);
                const target = Math.sqrt(Math.max(0, 2 * 9.8 * (26 - p.y))) * 0.92;
                const want = BO.Math.clamp(target, 9, 30) * (state === 'running' ? 1 : 0.6);
                S.data.speed = lerp(S.data.speed, want, Math.min(1, dt * 1.6));
                S.data.dist += S.data.speed * dt;
                S.data.clackT = (S.data.clackT || 0) - dt;
                if (S.data.speed < 12 && S.data.clackT <= 0) { SFX.clack(); S.data.clackT = 0.18; }
                S.data.windT = (S.data.windT || 0) - dt;
                if (S.data.windT <= 0 && S.data.speed > 18) { SFX.whoosh(0.08 + (S.data.speed - 18) * 0.01); S.data.windT = 0.32; }
                BO.Player.cameraShake = Math.max(BO.Player.cameraShake, (S.data.speed - 10) * 0.0009);
            }
            const r = K.driveRail(S, R, S.data.dist, dt, { lift: 0.55, bank: 0.32, pitchFollow: 0.5 });
            if (r && S.data.car) {
                const car = S.data.car;
                car.position.copy(r.p).add(V(0, -0.05, 0));
                car.lookAt(r.p.clone().sub(r.tan));
                car.rotateZ(BO.Player.rideState.roll * 0.6);
            }
            S.data.cur = r;
        },
        schedule(S) {
            K.ramp(S, { from: 1.1, to: 0.45, start: 0.6, end: 58.4 }, (at, k, rng) => {
                const ahead = 26 + rng() * 22;
                const side = (rng() < 0.5 ? -1 : 1) * (3.5 + rng() * 7);
                const rise = rng() * (2 + k * 7) - 1;
                const float = rng() < 0.3 + k * 0.4;
                const radius = lerp(0.62, 0.42, k);
                const life = lerp(2.9, 1.6, k);
                const spin = float && rng() < 0.5;
                S.at(at, (S2) => {
                    const R = S2.data.rail;
                    const u = ((((S2.data.dist + ahead) / R.len) % 1) + 1) % 1;
                    const p = R.curve.getPointAt(u);
                    const tan = R.curve.getTangentAt(u);
                    const sideV = new THREE.Vector3().crossVectors(tan, V(0, 1, 0)).normalize();
                    const pos = p.clone().addScaledVector(sideV, side);
                    pos.y = float ? p.y + 1 + rise : Math.max(0, p.y - 3 + rise);
                    const t = float ? A.bullseye(radius, 0, 'olympic') : A.bullseye(radius, 1.4);
                    if (float) t.mesh.children.slice(1).forEach((c) => (c.visible = false));
                    const look = R.curve.getPointAt(((((S2.data.dist + ahead * 0.35) / R.len) % 1) + 1) % 1);
                    S2.addTarget(Object.assign(t, {
                        pos, yaw: A.yawTo(pos, look), points: 120, life, appear: float ? 'spin' : 'flip', death: float ? 'tumble' : 'knock',
                        motion: spin ? (tg, tt, out) => { out.set(0, Math.sin(tt * 3) * 0.6, 0); } : null
                    }));
                });
            });
        }
    });

    /* ================================================================
       3. TEMPLE RUN — a boulder is chasing you; shoot while you sprint
    ================================================================ */
    const TEMPLE_PTS = (() => {
        const pts = [];
        for (let i = 0; i <= 26; i++) {
            const z = -i * 20;
            pts.push(V(Math.sin(i * 0.55) * 9 + Math.sin(i * 0.21) * 6, 0, z));
        }
        return pts;
    })();
    MG.register({
        id: 'temple_run', cat: 'target', order: 3,
        name: 'Boulder Run', icon: '🪨', accent: '#d97706',
        tagline: 'Run. Shoot. Do not look back… okay, look back once.',
        desc: 'You grabbed the idol. Now a three-metre boulder is thundering down the temple corridor behind you and it is gaining. Keep sprinting while golden discs slide out of the walls, swing from the ceiling and rise from the floor ahead.',
        hudSub: 'The boulder gets closer every second',
        duration: 60, stars: [4500, 9000, 15000, 22000], standardWeapon: 'vector_kriss', ringScoring: true, rail: true,
        map: {
            atmosphere: { skyTop: 0x1c1208, skyBottom: 0x3b2410, fogColor: 0x2a1a0b, fogDensity: 0.03, sunColor: 0xffb46b, sunIntensity: 0.55, sunPos: [10, 50, -40], hemiSky: 0xffc58a, hemiGround: 0x2a1a0b, hemiIntensity: 0.55 },
            boxes: [B(0, -0.5, -260, 120, 1, 600, 'bunker_stone')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            const R = K.rail(TEMPLE_PTS, false, 0.5);
            S.data.rail = R;
            S.data.dist = 4;
            S.data.speed = 0;
            const stone = L.canvasTex('templestone', 256, 256, (g, w, h) => {
                g.fillStyle = '#6b5a45'; g.fillRect(0, 0, w, h);
                const rnd = L.mulberry32(5);
                for (let y = 0; y < h; y += 32) {
                    for (let x = -((y / 32) % 2) * 32; x < w; x += 64) {
                        const s = 80 + rnd() * 40;
                        g.fillStyle = `rgb(${s + 20},${s + 5},${s - 20})`;
                        g.fillRect(x + 2, y + 2, 60, 28);
                    }
                }
                for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.15})`; g.fillRect(rnd() * w, rnd() * h, 3, 3); }
            });
            stone.wrapS = stone.wrapT = THREE.RepeatWrapping;
            const wallMat = new THREE.MeshStandardMaterial({ map: stone, roughness: 0.95 });
            const pillarMat = std(0x8a7558, 0.9);
            const gold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.25, emissive: 0x7c4a03, emissiveIntensity: 0.3 });
            const segLen = 4;
            const n = Math.floor(R.len / segLen);
            const wallGeo = new THREE.BoxGeometry(1, 7, segLen + 0.05);
            S.data.pillars = [];
            for (let i = 0; i < n; i++) {
                const u = (i + 0.5) / n;
                const p = R.curve.getPointAt(u);
                const t = R.curve.getTangentAt(u);
                const yaw = Math.atan2(t.x, t.z);
                const side = V(Math.cos(yaw), 0, -Math.sin(yaw));
                for (const s of [-1, 1]) {
                    const w = new THREE.Mesh(wallGeo, wallMat);
                    w.position.set(p.x + side.x * s * 4.1, 3.5, p.z + side.z * s * 4.1);
                    w.rotation.y = yaw;
                    w.receiveShadow = true;
                    S.add(w);
                    S.solid(w);
                }
                if (i % 2 === 0) {
                    const beam = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.8, 0.9), pillarMat);
                    beam.position.set(p.x, 6.6, p.z);
                    beam.rotation.y = yaw;
                    S.add(beam);
                    for (const s of [-1, 1]) {
                        const pil = new THREE.Group();
                        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 6.2, 8), pillarMat);
                        col.position.y = 3.1;
                        col.castShadow = true;
                        pil.add(col);
                        pil.position.set(p.x + side.x * s * 3.3, 0, p.z + side.z * s * 3.3);
                        S.add(pil);
                        S.data.pillars.push({ g: pil, s: u * R.len, fall: 0, dir: -s, yaw });
                    }
                }
                if (i % 4 === 1) {
                    for (const s of [-1, 1]) {
                        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 6), new THREE.MeshBasicMaterial({ color: 0xff9a3c }));
                        fl.position.set(p.x + side.x * s * 3.5, 3.4, p.z + side.z * s * 3.5);
                        S.add(fl);
                        S.animate(() => { fl.scale.y = 0.85 + Math.sin(performance.now() * 0.013 + i) * 0.15; });
                    }
                }
                if (i % 7 === 3) {
                    const glyph = A.sign('𓂀  𓆣  𓋹', 3, 0.7, { bg: '#3b2410', color: '#fbbf24', borderColor: '#78350f', size: 0.6 });
                    const s = i % 2 ? 1 : -1;
                    glyph.position.set(p.x + side.x * s * 3.58, 4.6, p.z + side.z * s * 3.58);
                    glyph.rotation.y = yaw - s * Math.PI / 2;
                    S.add(glyph);
                }
            }
            // ceiling
            const ceil = new THREE.Mesh(new THREE.PlaneGeometry(40, R.len + 40), std(0x2a1d10, 1));
            ceil.rotation.x = Math.PI / 2;
            ceil.position.set(0, 7.0, -R.len / 2);
            S.add(ceil);
            // the light we carry
            if (BO.Settings.getQualityPreset().pointLights) {
                const lamp = new THREE.PointLight(0xffa857, 2.2, 26, 1.6);
                S.add(lamp);
                S.data.lamp = lamp;
                const bl = new THREE.PointLight(0xff6a2a, 1.4, 14, 1.8);
                S.add(bl);
                S.data.boulderLight = bl;
            }
            // boulder
            const btex = L.canvasTex('boulder', 256, 256, (g, w, h) => {
                g.fillStyle = '#6b6258'; g.fillRect(0, 0, w, h);
                const rnd = L.mulberry32(9);
                for (let i = 0; i < 90; i++) {
                    g.fillStyle = `rgba(${40 + rnd() * 60},${36 + rnd() * 50},${30 + rnd() * 40},0.6)`;
                    g.beginPath(); g.arc(rnd() * w, rnd() * h, 4 + rnd() * 20, 0, Math.PI * 2); g.fill();
                }
                g.strokeStyle = 'rgba(20,16,12,0.7)'; g.lineWidth = 3;
                for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.stroke(); }
            });
            const boulder = new THREE.Mesh(new THREE.IcosahedronGeometry(2.7, 2), new THREE.MeshStandardMaterial({ map: btex, roughness: 1, flatShading: true }));
            boulder.castShadow = true;
            S.add(boulder);
            S.data.boulder = boulder;
            S.data.bDist = 11;
            // idol in hand? a golden idol on a pedestal at the start
            const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.1, 8), pillarMat);
            ped.position.set(TEMPLE_PTS[0].x, 0.55, 6);
            S.add(ped);
            const idol = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), gold);
            idol.position.set(TEMPLE_PTS[0].x, 1.4, 6);
            S.add(idol);
            S.animate((dt) => { idol.rotation.y += dt * 2; });
            this.preUpdate(S, 0, L, 'countdown');
        },
        preUpdate(S, dt, lib, state) {
            const R = S.data.rail;
            if (!R) return;
            const run = state === 'running' || state === 'finish' || state === 'results';
            if (run) {
                S.data.speed = lerp(S.data.speed, 7.2, Math.min(1, dt * 2.5));
                S.data.dist += S.data.speed * dt;
                S.data.runPhase = (S.data.runPhase || 0) + dt * S.data.speed * 1.45;
            }
            const ph = S.data.runPhase || 0;
            const bob = run ? Math.abs(Math.sin(ph)) : 0;
            const r = K.driveRail(S, R, S.data.dist, dt, {
                bank: 0.05, eye: 1.55 + bob * 0.09, pitchAdd: run ? Math.sin(ph * 2) * 0.008 : 0, rollAdd: run ? Math.sin(ph) * 0.018 : 0
            });
            if (run && Math.floor(ph / Math.PI) !== S.data._step) { S.data._step = Math.floor(ph / Math.PI); BO.Sound.playFootstep(true); }
            // boulder chase
            const k = S.k;
            const target = state === 'countdown' ? 13 : lerp(11, 4.6, Math.pow(k, 1.3)) + Math.sin(S.t * 1.7) * 0.5;
            S.data.bDist = lerp(S.data.bDist, target, Math.min(1, dt * 1.2));
            const bs = Math.max(0, S.data.dist - S.data.bDist);
            const bu = clamp01(bs / R.len);
            const bp = R.curve.getPointAt(bu);
            const bt = R.curve.getTangentAt(bu);
            const b = S.data.boulder;
            if (b) {
                const prev = b.userData.s ?? bs;
                const ds = bs - prev;
                b.userData.s = bs;
                b.position.set(bp.x, 2.7, bp.z);
                const axis = new THREE.Vector3().crossVectors(V(0, 1, 0), bt).normalize();
                b.rotateOnWorldAxis(axis, ds / 2.7);
                if (S.data.boulderLight) S.data.boulderLight.position.set(bp.x, 4.5, bp.z);
            }
            if (S.data.lamp && r) S.data.lamp.position.set(r.p.x, 3.6, r.p.z - 1);
            if (run) {
                const close = clamp01(1 - (S.data.bDist - 4) / 8);
                BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.006 + close * 0.02);
                S.data.rumbleT = (S.data.rumbleT || 0) - dt;
                if (S.data.rumbleT <= 0) { SFX.rumble(0.25 + close * 0.35); S.data.rumbleT = 0.42; }
                if (Math.random() < dt * (2 + close * 6)) BO.FX.spawnParticles(V(bp.x + (Math.random() - 0.5) * 4, 0.3, bp.z), 3, 0x8a7558, 3, 6, 0.6, 1.4);
                for (const pl of S.data.pillars) {
                    if (!pl.fall && bs > pl.s - 1.5) pl.fall = 0.001;
                    if (pl.fall > 0 && pl.fall < 1) {
                        pl.fall = Math.min(1, pl.fall + dt * 1.6);
                        pl.g.rotation.set(0, 0, 0);
                        pl.g.rotateOnWorldAxis(V(Math.sin(pl.yaw), 0, Math.cos(pl.yaw)), pl.dir * Ease.inCubic(pl.fall) * 1.35);
                        if (pl.fall >= 1) { SFX.thunk(); BO.FX.spawnParticles(pl.g.position.clone().add(V(0, 0.5, 0)), 12, 0x8a7558, 4, 8, 0.8, 1.8); }
                    }
                }
            }
        },
        schedule(S) {
            K.ramp(S, { from: 1.15, to: 0.48, start: 0.5, end: 58.6 }, (at, k, rng) => {
                const kind = rng() < 0.5 ? 'wall' : rng() < 0.55 ? 'ceiling' : 'floor';
                const ahead = 16 + rng() * 16;
                const side = rng() < 0.5 ? -1 : 1;
                const h = kind === 'ceiling' ? 3.2 + rng() * 1.6 : kind === 'wall' ? 1.2 + rng() * 2.6 : 0;
                const lat = kind === 'wall' ? side * 3.0 : (rng() - 0.5) * 3.2;
                const radius = lerp(0.55, 0.38, k);
                const life = lerp(2.5, 1.3, k);
                const swing = kind === 'ceiling' && rng() < 0.6;
                S.at(at, (S2) => {
                    const R = S2.data.rail;
                    const s = S2.data.dist + ahead;
                    if (s > R.len - 4) return;
                    const u = s / R.len;
                    const p = R.curve.getPointAt(u);
                    const tan = R.curve.getTangentAt(u);
                    const yaw = Math.atan2(tan.x, tan.z);
                    const sideV = V(Math.cos(yaw), 0, -Math.sin(yaw));
                    const pos = p.clone().addScaledVector(sideV, lat);
                    pos.y = kind === 'floor' ? 0 : h;
                    const t = kind === 'floor' ? A.bullseye(radius, 1.25, 'classic') : A.bullseye(radius, 0, 'classic');
                    if (kind !== 'floor') t.mesh.children.slice(1).forEach((c) => (c.visible = false));
                    const face = R.curve.getPointAt(clamp01((S2.data.dist + 2) / R.len));
                    S2.addTarget(Object.assign(t, {
                        pos, yaw: A.yawTo(pos, face), points: 120, life,
                        appear: kind === 'wall' ? 'slide' : kind === 'ceiling' ? 'drop' : 'rise', slideDir: -side, slideDist: 1.4, riseDepth: kind === 'floor' ? 1.6 : 2.2,
                        death: kind === 'floor' ? 'knock' : 'tumble',
                        motion: swing ? (tg, tt, out) => { out.set(Math.sin(tt * 2.6) * 1.1, Math.cos(tt * 5.2) * 0.12, 0); } : null
                    }));
                });
            });
        }
    });

    /* ================================================================
       4. SKEET STORM — chicken-shoot discs launched into the sky
    ================================================================ */
    MG.register({
        id: 'skeet', cat: 'target', order: 4,
        name: 'Skeet Storm', icon: '🥏', accent: '#f97316',
        tagline: 'Pull! Clay discs fired from the high and low houses',
        desc: 'Stand on the shooting pad while clay discs launch from the high house, the low house and the hidden trap in front of you. Singles become doubles, doubles become crossfire. Rare gold clays fly fast and pay big. Hit two within a second for a DOUBLE bonus.',
        hudSub: 'Lead your shots — discs arc and fall',
        duration: 60, stars: [2000, 4000, 6500, 9000], standardWeapon: 'm1014_cod4', forgivingMisses: false,
        map: {
            atmosphere: { skyTop: 0x1d4ed8, skyBottom: 0xbfdbfe, fogColor: 0xc7d9ee, fogDensity: 0.004, sunColor: 0xfffbeb, sunIntensity: 1.7, sunPos: [20, 70, 50], hemiSky: 0xdbeafe, hemiGround: 0x3f6212, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, -30, 240, 1, 240, 'nuketown_grass')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            K.booth(S, { roof: false, w: 3.6, wood: 0x9a7448 });
            const house = (x, h, col, label) => {
                const g = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, h, 3.2), std(col, 0.8));
                body.position.y = h / 2;
                body.castShadow = true;
                const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), std(0x7f1d1d, 0.8));
                roof.position.y = h + 0.7;
                roof.rotation.y = Math.PI / 4;
                const port = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), basic(0x0a0a0a));
                port.position.set(x < 0 ? 1.61 : -1.61, h - 0.8, 0);
                port.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
                const s = A.sign(label, 2.4, 0.5, { size: 0.5 });
                s.position.set(0, h - 0.3, 1.62);
                g.add(body, roof, port, s);
                g.position.set(x, 0, -13);
                S.add(g);
            };
            house(-12, 5.2, 0xe7e5e4, 'HIGH HOUSE');
            house(12, 1.8, 0xd6d3d1, 'LOW HOUSE');
            const trap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 2.4), std(0x57534e, 0.8));
            trap.position.set(0, 0.3, -22);
            S.add(trap);
            // shooting arc of pads
            for (let i = 0; i < 7; i++) {
                const a = Math.PI * (i / 6);
                const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16), std(0xa8a29e, 0.8));
                pad.position.set(Math.cos(a) * 12, 0.03, -13 + Math.sin(a) * -6);
                S.add(pad);
            }
            K.fence(S, -40, -60, 40, -60);
            for (let i = 0; i < 26; i++) {
                const t = A.tree(1.8 + (i % 4) * 0.4, i % 3 ? 0x166534 : 0x14532d);
                t.position.set(-60 + i * 4.8, 0, -66 - (i % 3) * 5);
                S.add(t);
            }
            for (let i = 0; i < 6; i++) {
                const hill = new THREE.Mesh(new THREE.SphereGeometry(40, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0x4d7c0f, 1));
                hill.scale.y = 0.35;
                hill.position.set(-120 + i * 50, -2, -130 - (i % 2) * 30);
                S.add(hill);
            }
            K.cloudLayer(S, 12, 70, 200);
            S.data.lastKill = -9;
        },
        schedule(S) {
            const launchers = {
                high: { p: V(-10.4, 4.6, -13), dir: 1 },
                low: { p: V(10.4, 1.2, -13), dir: -1 },
                trap: { p: V(0, 0.7, -22), dir: 0 }
            };
            const launch = (S2, from, speed, up, cross, golden) => {
                const L0 = launchers[from];
                const vel = from === 'trap'
                    ? V(cross * speed * 0.35, up, -speed * 0.85)
                    : V(L0.dir * speed, up, -speed * 0.28 + cross);
                const pos = L0.p.clone();
                const t = A.clay();
                if (golden) t.mesh.children[0].material = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.25, emissive: 0xa16207, emissiveIntensity: 0.5 });
                const g = 9.8 * 0.6;
                const tg = S2.addTarget(Object.assign(t, {
                    pos, points: golden ? 400 : 150, life: 0, appear: 'none', death: 'shatter', deathColor: golden ? 0xfacc15 : 0xf97316, inT: 0.01,
                    bonus: golden,
                    motion: (tg2, tt, out) => {
                        out.set(vel.x * tt, vel.y * tt - 0.5 * g * tt * tt, vel.z * tt);
                        tg2.pivot.rotation.y += 0.4;
                        tg2.pivot.rotation.x = 0.25;
                        if (pos.y + out.y < 0.05 && tt > 0.3) tg2.retire();
                    },
                    outT: 0.05,
                    onKill: () => {
                        SFX.shatter();
                        if (S2.t - S2.data.lastKill < 1.0) {
                            S2.award(100, tg.root.position.clone().add(V(0, 0.8, 0)), 'DOUBLE!', '#38bdf8');
                        }
                        S2.data.lastKill = S2.t;
                    }
                }));
                SFX.launch();
                return tg;
            };
            K.ramp(S, { from: 2.1, to: 0.85, start: 0.3, end: 57.8 }, (at, k, rng) => {
                const roll = rng();
                const from = roll < 0.42 ? 'high' : roll < 0.84 ? 'low' : 'trap';
                const speed = lerp(13, 21, k) + rng() * 2;
                const up = lerp(9, 12, rng());
                const cross = (rng() - 0.5) * 6;
                const golden = rng() < 0.06;
                S.at(at, (S2) => launch(S2, from, speed, up, cross, golden));
                if (k > 0.25 && rng() < k * 0.75) {
                    const other = from === 'high' ? 'low' : 'high';
                    const d = 0.05 + rng() * 0.4;
                    const sp2 = lerp(13, 20, k), up2 = lerp(9, 12, rng()), cr2 = (rng() - 0.5) * 6;
                    S.at(at + d, (S2) => launch(S2, other, sp2, up2, cr2, false));
                }
            });
        }
    });

    /* ================================================================
       5. BANDIT TOWN — western shooting gallery with civilians
    ================================================================ */
    MG.register({
        id: 'bandit_town', cat: 'target', order: 5,
        name: 'Bandit Town', icon: '🤠', accent: '#b45309',
        tagline: 'Outlaws in the windows. Townsfolk in the crossfire.',
        desc: 'High noon on Main Street. Cardboard outlaws burst from windows, doorways, rooftops and barrels. Draw fast: any outlaw left standing fires back and costs you points. Townsfolk wander into view too, and shooting one is a big penalty. Headshots pay 1.5x.',
        hudSub: "Outlaws shoot back if you're slow — spare the townsfolk",
        duration: 60, stars: [2500, 5000, 8000, 11000], standardWeapon: 'python_magnum',
        map: {
            atmosphere: { skyTop: 0x9a3412, skyBottom: 0xfcd34d, fogColor: 0xe7b97a, fogDensity: 0.008, sunColor: 0xffd59e, sunIntensity: 1.8, sunPos: [-30, 30, -50], hemiSky: 0xfde68a, hemiGround: 0x7c4a1e, hemiIntensity: 0.85 },
            boxes: [B(0, -0.5, -30, 200, 1, 200, 'desert_sand')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            K.booth(S, { awning: '#78350f', wood: 0x8b5a2b });
            const slots = [];
            const woodCols = [0x8b5a2b, 0xa16207, 0x7c2d12, 0x9a3412, 0x854d0e, 0x6b4423];
            const sideBuilding = (x, z, w, h, col, name, sideSign) => {
                const g = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(6, h, w), std(col, 0.9));
                body.position.y = h / 2;
                body.castShadow = body.receiveShadow = true;
                g.add(body);
                S.solid(body);
                const fx = -sideSign * 3.01;
                const facade = new THREE.Mesh(new THREE.BoxGeometry(0.2, h + 1.4, w), std(col, 0.85));
                facade.position.set(fx, (h + 1.4) / 2, 0);
                g.add(facade);
                S.solid(facade);
                const porch = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, w), std(0x5b3a1f, 0.9));
                porch.position.set(fx - sideSign * 1.1, 3.0, 0);
                g.add(porch);
                for (const pz of [-w / 2 + 0.3, w / 2 - 0.3]) {
                    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3, 0.14), std(0x5b3a1f, 0.9));
                    post.position.set(fx - sideSign * 2.1, 1.5, pz);
                    g.add(post);
                }
                const sign = A.sign(name, w * 0.8, 0.8, { bg: '#3f2a14', color: '#fde68a', borderColor: '#a16207', size: 0.5 });
                sign.position.set(fx - sideSign * 0.12, h + 0.6, 0);
                sign.rotation.y = -sideSign * Math.PI / 2;
                g.add(sign);
                g.position.set(x, 0, z);
                S.add(g);
                // windows (upper) + door (lower)
                const winX = x + fx - sideSign * 0.12;
                for (const wz of [-w / 4, w / 4]) {
                    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.3), basic(0x1c1008));
                    win.position.set(winX, 4.6, z + wz);
                    win.rotation.y = -sideSign * Math.PI / 2;
                    S.add(win);
                    // open shutters, flat against the wall either side of the window
                    for (const s of [-1, 1]) {
                        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.3, 0.05), std(0x14532d, 0.9));
                        leaf.position.set(winX - sideSign * 0.03, 4.6, z + wz + s * 0.92);
                        leaf.rotation.y = -sideSign * Math.PI / 2;
                        S.add(leaf);
                    }
                    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 1.4), std(0x3f2a14, 0.9));
                    sill.position.set(winX - sideSign * 0.06, 3.92, z + wz);
                    S.add(sill);
                    slots.push({ kind: 'window', pos: V(winX - sideSign * 0.15, 3.85, z + wz), yawSide: sideSign, scale: 0.62 });
                }
                const door = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), basic(0x120a04));
                door.position.set(winX, 1.2, z);
                door.rotation.y = -sideSign * Math.PI / 2;
                S.add(door);
                slots.push({ kind: 'door', pos: V(winX - sideSign * 0.2, 0, z), yawSide: sideSign, scale: 0.95 });
                slots.push({ kind: 'roof', pos: V(winX + sideSign * 0.6, h + 0.2, z + (w / 3)), yawSide: sideSign, scale: 0.7 });
            };
            const names = ['SALOON', 'BANK', 'SHERIFF', 'HOTEL', 'GENERAL', 'BARBER', 'POST', 'SMITHY'];
            for (let i = 0; i < 4; i++) {
                const z = -12 - i * 9.5;
                sideBuilding(-10, z, 8.6, 5.8 + (i % 2) * 1.6, woodCols[i], names[i], -1);
                sideBuilding(10, z, 8.6, 5.8 + ((i + 1) % 2) * 1.6, woodCols[i + 2], names[i + 4], 1);
            }
            // end-of-street saloon
            const end = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 6), std(0x7c2d12, 0.9));
            end.position.set(0, 4, -55);
            S.add(end);
            S.solid(end);
            const endSign = A.sign('BANDIT TOWN', 9, 1.4, { bg: '#3f2a14', color: '#fde68a', borderColor: '#f59e0b', size: 0.6 });
            endSign.position.set(0, 7.2, -51.9);
            S.add(endSign);
            for (const ex of [-5, 0, 5]) {
                const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), basic(0x1c1008));
                w.position.set(ex, 4.6, -51.98);
                S.add(w);
                slots.push({ kind: 'window', pos: V(ex, 3.9, -51.8), yawSide: 0, scale: 0.62 });
            }
            // cover props
            const barrel = (x, z) => {
                const b = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 12), std(0x6b4423, 0.85));
                b.position.set(x, 0.55, z);
                b.castShadow = true;
                S.add(b);
                S.solid(b);
                slots.push({ kind: 'barrel', pos: V(x, 0, z - 0.5), yawSide: 0, scale: 0.85 });
            };
            barrel(-4, -16); barrel(3.5, -24); barrel(-2.5, -33); barrel(4.5, -42);
            const wagon = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 1.8), std(0x854d0e, 0.9));
            wagon.position.set(-1, 1.1, -28);
            S.add(wagon);
            S.solid(wagon);
            for (const wx of [-2.2, 0.2]) for (const wz of [-0.95, 0.95]) {
                const wh = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 6, 16), std(0x3f2a14, 0.9));
                wh.position.set(wx, 0.55, -28 + wz);
                S.add(wh);
            }
            slots.push({ kind: 'wagon', pos: V(-1, 0.5, -28.95), yawSide: 0, scale: 0.85 });
            // desert dressing
            for (let i = 0; i < 16; i++) {
                const c = new THREE.Group();
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 3, 8), std(0x3f6212, 0.8));
                trunk.position.y = 1.5;
                c.add(trunk);
                for (const s of [-1, 1]) {
                    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.2, 8), std(0x3f6212, 0.8));
                    arm.position.set(s * 0.5, 1.8 + s * 0.3, 0);
                    c.add(arm);
                }
                c.position.set((i % 2 ? 1 : -1) * (20 + (i % 5) * 6), 0, -10 - i * 5);
                S.add(c);
            }
            const tower = new THREE.Group();
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 12), std(0x78350f, 0.9));
            tank.position.y = 9;
            tower.add(tank);
            for (const s of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 0.2), std(0x3f2a14, 0.9));
                leg.position.set(s[0] * 1.6, 4, s[1] * 1.6);
                tower.add(leg);
            }
            tower.position.set(22, 0, -48);
            S.add(tower);
            // tumbleweeds
            for (let i = 0; i < 3; i++) {
                const tw = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), new THREE.MeshStandardMaterial({ color: 0xa16207, wireframe: true }));
                S.add(tw);
                const off = i * 23;
                S.animate((dt) => {
                    const t = (performance.now() * 0.001 + off) % 30;
                    tw.position.set(-30 + t * 2.2, 0.45 + Math.abs(Math.sin(t * 3)) * 0.5, -20 - i * 12);
                    tw.rotation.z -= dt * 5;
                });
            }
            S.data.slots = slots;
            S.data.busy = new Set();
        },
        schedule(S) {
            const nSlots = 31;
            K.ramp(S, { from: 1.2, to: 0.5, start: 0.3 }, (at, k, rng) => {
                const si = Math.floor(rng() * nSlots);
                const civ = rng() < 0.17;
                const outlaw = rng() < 0.5;
                const life = lerp(2.3, 1.15, k);
                S.at(at, (S2) => {
                    const slots = S2.data.slots;
                    let idx = si % slots.length;
                    for (let n = 0; n < slots.length && S2.data.busy.has(idx); n++) idx = (idx + 1) % slots.length;
                    if (S2.data.busy.has(idx)) return;
                    const sl = slots[idx];
                    S2.data.busy.add(idx);
                    const type = civ ? 'civilian' : (outlaw ? 'outlaw' : 'bandit');
                    const t = A.silhouette(type, sl.scale);
                    const yaw = A.yawTo(sl.pos, V(0, 0, 0));
                    const appear = sl.kind === 'door' ? 'slide' : sl.kind === 'window' ? 'rise' : sl.kind === 'roof' ? 'flip' : 'rise';
                    if (sl.shutters) sl.shutters.forEach((sh) => { sh.open = 1; });
                    const free = () => {
                        S2.data.busy.delete(idx);
                        if (sl.shutters) sl.shutters.forEach((sh) => { sh.open = 0; });
                    };
                    S2.addTarget(Object.assign(t, {
                        pos: sl.pos.clone(), yaw, points: 120, penalty: civ ? 300 : 0, penaltyLabel: 'CIVILIAN!', life: civ ? life * 1.2 : life,
                        appear, slideDist: 1.1, slideDir: sl.yawSide || 1, riseDepth: 1.3 * sl.scale + 0.4, death: 'knock', deathColor: 0xc8a36a,
                        onKill: () => { SFX.thunk(); free(); },
                        onExpire: () => {
                            free();
                            if (!civ && S2.rt.state === 'running') {
                                S2.award(-60, sl.pos.clone().add(V(0, 1.5, 0)), 'BANG!', '#f87171');
                                BO.Sound.playGunshot('pistol', false, false, 0.6);
                                S2.rt.flashScreen('rgba(220,38,38,0.22)');
                                BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.03);
                            }
                        }
                    }));
                });
            });
        },
        update(S, dt) {
            for (const sl of S.data.slots || []) {
                if (!sl.shutters) continue;
                for (const sh of sl.shutters) {
                    sh.cur = lerp(sh.cur || 0, sh.open || 0, Math.min(1, dt * 10));
                    const base = -sl.yawSide * Math.PI / 2;
                    sh.g.rotation.y = base + sh.s * sh.cur * 1.9 * (sl.yawSide || 1);
                }
            }
        }
    });
})(window);
