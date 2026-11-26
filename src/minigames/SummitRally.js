/* ============================================================================
   SUMMIT RALLY — AAA Alpine Boardercross & SSX-Style Trick Circuit
   Winding 1.84 km resort descent with Timber Chalet Start/Finish Village,
   cheering spectator stands, Crystal Ice Cavern, overhead Gondola Cableway,
   Copper Grind Rails + Transfer Lines, Gold Big-Air Kickers, Neon Speed Pads,
   Named Aerial Tricks (Indy/Method/Backflip/Frontflip/Uber Trick), Slipstream
   Drafting, Avalanche Setpiece, 172 BPM DnB Synthwave Music & Board DSP Audio!
============================================================================ */
(function (BO) {
    'use strict';
    const { group, part, box, drum, rod, ring, sign, std, basic, alpineChalet } = BO.CourseScenery;
    const { SFX, mulberry32 } = BO.MinigameLib;
    const MA = () => BO.MinigameAudio;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const LENGTH = 1840, HALF = 10.5;
    const SECTORS = ['Summit Chalet', 'Pine Chute', 'Crystal Cavern', 'Avalanche Ridge', 'Copper Stadium'];
    const clamp = THREE.MathUtils.clamp;

    function center(s) { return 28 * Math.sin(s / 83) + 17 * Math.sin(s / 43); }
    function slope(s) { return 278 - s * 0.128 + 4.0 * Math.sin(s / 60) + 1.8 * Math.sin(s / 29); }
    function slopeGrade(s) { return -0.128 + (4.0 / 60) * Math.cos(s / 60) + (1.8 / 29) * Math.cos(s / 29); }
    function heading(s) { return -Math.atan((28 / 83) * Math.cos(s / 83) + (17 / 43) * Math.cos(s / 43)); }
    function point(s, x = 0, h = 0) {
        const a = heading(s);
        return V(center(s) + Math.cos(a) * x, slope(s) + h + 0.004 * x * x, -s - Math.sin(a) * x);
    }

    function rider(parent, jacket, helmet, boardHex = jacket) {
        const root = group(parent), pivot = group(root, 0, 0.18, 0);
        const dark = std(0x1f2937, 0.72), coat = std(jacket, 0.65), trim = std(helmet, 0.42);
        const board = part(pivot, new THREE.CapsuleGeometry(0.33, 1.12, 4, 12), std(boardHex, 0.32, 0.28), 0, 0, 0);
        board.rotation.x = Math.PI / 2; board.scale.z = 0.15;
        const body = group(pivot, 0, 0, 0); body.rotation.y = 0.77;
        for (const side of [-1, 1]) {
            rod(body, V(side * 0.14, 0.83, 0), V(side * 0.24, 0.46, -0.15), 0.12, dark);
            rod(body, V(side * 0.24, 0.46, -0.15), V(side * 0.25, 0.17, 0.1), 0.097, trim);
            box(body, side * 0.25, 0.12, 0.06, 0.22, 0.19, 0.36, dark);
        }
        const torso = group(body, 0, 0.79, 0);
        const parka = part(torso, new THREE.CapsuleGeometry(0.255, 0.34, 4, 10), coat, 0, 0.26, -0.045);
        parka.scale.z = 0.81; box(torso, 0, 0.34, 0.175, 0.31, 0.43, 0.13, trim);
        part(torso, new THREE.SphereGeometry(0.205, 12, 8), trim, 0, 0.85, -0.12);
        const visor = part(torso, new THREE.SphereGeometry(0.188, 12, 8), std(0x0ea5e9, 0.14, 0.82), 0, 0.84, -0.18);
        visor.scale.set(1.06, 0.53, 0.84);
        const arms = [-1, 1].map((side) => {
            const arm = group(torso, side * 0.24, 0.51, 0);
            rod(arm, V(0, 0, 0), V(side * 0.28, -0.14, 0.06), 0.086, coat);
            rod(arm, V(side * 0.28, -0.14, 0.06), V(side * 0.41, -0.21, -0.11), 0.065, dark);
            return arm;
        });
        return { root, pivot, board, body, torso, arms };
    }

    function terrain(S) {
        const groundColors = [0x3b586e, 0x89aec0, 0xe8f5f9, 0xc3dde6, 0xeef8fa, 0xb8d4e0, 0x4f7187];
        const vertices = [], colors = [], uvs = [], indices = [], xs = [-40, -19, -HALF, -5.2, 0, 5.2, HALF, 19, 40];
        for (let s = -36, row = 0; s <= LENGTH + 60; s += 4, row++) {
            for (let j = 0; j < xs.length; j++) {
                const x = xs[j], side = Math.abs(x) > HALF;
                const p = point(s, x, side ? (Math.abs(x) - HALF) * (0.38 + 0.22 * Math.sin(s / 17 + j)) : 0);
                vertices.push(p.x, p.y, p.z);
                uvs.push(x * 0.12, s * 0.12);
                const c = new THREE.Color(groundColors[[0, 1, 2, 3, 4, 3, 2, 5, 6][j]]);
                c.multiplyScalar(0.95 + 0.045 * Math.sin(s / 7 + j * 0.4));
                colors.push(c.r, c.g, c.b);
                if (row && j) {
                    const a = row * xs.length + j;
                    indices.push(a - 1 - xs.length, a - xs.length, a, a - 1 - xs.length, a, a - 1);
                }
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices); geo.computeVertexNormals();
        const detailTex = BO.Textures && BO.Textures.getTerrainDetailTexture ? BO.Textures.getTerrainDetailTexture() : null;
        const slopeMat = new THREE.MeshStandardMaterial({
            vertexColors: true, map: detailTex, roughness: 0.78, metalness: 0.06, side: THREE.DoubleSide
        });
        const slopeMesh = part(S.scene, geo, slopeMat, 0, 0, 0);
        slopeMesh.castShadow = false;

        // Alpine Chalets at Start Summit & Finish Stadium Village
        alpineChalet(S.scene, point(-8, -17, 1.5).x, point(-8, -17, 1.5).y, point(-8, -17, 1.5).z, heading(0) + 0.4, 1.25);
        alpineChalet(S.scene, point(-8, 17, 1.5).x, point(-8, 17, 1.5).y, point(-8, 17, 1.5).z, heading(0) - 0.4, 1.15);
        const finL = point(LENGTH + 16, -16, 0.5), finR = point(LENGTH + 16, 16, 0.5);
        alpineChalet(S.scene, finL.x, finL.y, finL.z, heading(LENGTH) + 0.35, 1.35);
        alpineChalet(S.scene, finR.x, finR.y, finR.z, heading(LENGTH) - 0.35, 1.35);

        // Orange Alpine B-Netting Course Boundary Poles on sharp turns
        const netMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.72, side: THREE.DoubleSide });
        const poleMat = std(0x1e293b, 0.5, 0.7);
        for (let s = 20; s < LENGTH; s += 26) {
            for (const side of [-1, 1]) {
                const a = point(s, side * (HALF + 0.5), 0), b = point(s + 14, side * (HALF + 0.5), 0);
                rod(S.scene, a, V(a.x, a.y + 1.35, a.z), 0.045, poleMat);
                const mid = a.clone().lerp(b, 0.5);
                const banner = new THREE.Mesh(new THREE.PlaneGeometry(a.distanceTo(b), 0.75), netMat);
                banner.position.set(mid.x, mid.y + 0.72, mid.z);
                banner.rotation.y = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2;
                S.scene.add(banner);
            }
        }

        // Instanced Snow-Laden Pines & Distant Alpine Peaks
        const rnd = mulberry32(1840), dummy = new THREE.Object3D();
        function scatter(g, mat, count, place) {
            const batch = new THREE.InstancedMesh(g, mat, count);
            for (let i = 0; i < count; i++) { place(dummy, i); dummy.updateMatrix(); batch.setMatrixAt(i, dummy.matrix); }
            S.add(batch);
        }
        const stems = [], cones = [], caps = [];
        for (let i = 0; i < 420; i++) {
            const s = rnd() * (LENGTH + 90) - 24, x = (i % 2 ? 1 : -1) * (15.5 + rnd() * 22), h = 3.2 + rnd() * 7.5;
            const p = point(s, x, (Math.abs(x) - HALF) * 0.38);
            stems.push([p, h]);
            for (let tier = 0; tier < 3; tier++) { cones.push([p, h, tier]); caps.push([p, h, tier]); }
        }
        scatter(new THREE.CylinderGeometry(0.12, 0.2, 1, 6), std(0x544338, 0.9), stems.length, (o, i) => {
            const [p, h] = stems[i]; o.position.copy(p); o.position.y += h * 0.27; o.scale.set(1, h * 0.55, 1);
        });
        function foliage(o, arr, i, snow) {
            const [p, h, t] = arr[i], r = h * (0.26 - 0.053 * t), height = h * (0.56 - 0.08 * t);
            o.position.copy(p); o.position.y += h * (0.36 + t * 0.21) + (snow ? height * 0.15 : 0);
            o.scale.set(r * (snow ? 0.74 : 1), height * (snow ? 0.73 : 1), r * (snow ? 0.74 : 1));
            o.rotation.y = i * 0.37;
        }
        scatter(new THREE.ConeGeometry(1, 1, 7), std(0x1f5250, 0.94), cones.length, (o, i) => foliage(o, cones, i, false));
        scatter(new THREE.ConeGeometry(1, 1, 7), std(0xe2f3f7, 0.88), caps.length, (o, i) => foliage(o, caps, i, true));
        scatter(new THREE.ConeGeometry(1, 1, 6), std(0x6d8ea1, 0.88), 120, (o, i) => {
            const s = (i / 120) * LENGTH, r = 18 + rnd() * 30, h = 28 + rnd() * 68;
            o.position.copy(point(s, (i % 2 ? 1 : -1) * (56 + r)));
            o.position.y += h * 0.32; o.scale.set(r, h, r * 1.2); o.rotation.y = rnd() * 4;
        });
    }

    function arch(S, s, title, accent = '#f4c997') {
        const g = group(S.scene); g.position.copy(point(s)); g.rotation.y = heading(s);
        const frame = std(0x273e4c, 0.48, 0.62), beam = std(0xd97706, 0.45, 0.4);
        for (const side of [-1, 1]) {
            for (const dz of [-0.55, 0.55]) rod(g, V(side * 9.8, 0, dz), V(side * 9.8, 5.4, dz), 0.15, frame);
            for (let y = 0; y < 4.8; y++) rod(g, V(side * 9.8, y, -0.55), V(side * 9.8, y + 1, 0.55), 0.06, beam);
        }
        box(g, 0, 5.45, 0, 20.2, 0.55, 1.35, frame);
        sign(g, title, 0, 5.55, 0.8, 9.2, 1.2, accent, '#0d1b26');
    }

    function raceFeatures(S, r) {
        const steel = std(0x364e5b, 0.44, 0.68), copper = std(0xe59852, 0.3, 0.62), ice = std(0x67e8f9, 0.2, 0.45);
        const gold = std(0xfacc15, 0.28, 0.52), glow = basic(0xffd98e), boostM = basic(0x38bdf8);
        for (let i = 0; i < SECTORS.length; i++) arch(S, 14 + i * 365, SECTORS[i].toUpperCase(), i === 2 ? '#67e8f9' : '#fde68a');
        arch(S, LENGTH, 'COPPER FINISH LINE', '#4ade80');

        for (let i = 0; i < 22; i++) {
            const s = 48 + i * 79, x = (i % 2 ? 1 : -1) * (3.6 + 1.2 * Math.sin(i)), end = s + 24;
            const g = group(S.scene);
            rod(g, point(s, x, 0.78), point(end, x, 0.78), 0.14, copper);
            for (const at of [s + 1, s + 12, end - 1]) rod(g, point(at, x, 0), point(at, x, 0.8), 0.09, steel);
            const start = group(g); start.position.copy(point(s - 2, x, 0.18)); start.rotation.y = heading(s);
            box(start, 0, 0, 0, 2.35, 0.24, 3.9, ice).rotation.x = 0.19;
            r.rails.push({ s, end, x, transfer: false });

            // Every 4th rail has a parallel high-line transfer rail for RAIL TRANSFER x2 combos!
            if (i % 4 === 2) {
                const tx = clamp(x + (x > 0 ? -3.4 : 3.4), -6.5, 6.5), ts = end + 4, tend = ts + 20;
                rod(g, point(ts, tx, 1.35), point(tend, tx, 1.35), 0.14, gold);
                for (const at of [ts + 1, tend - 1]) rod(g, point(at, tx, 0), point(at, tx, 1.35), 0.09, steel);
                r.rails.push({ s: ts, end: tend, x: tx, transfer: true });
            }

            // Reachable Slalom Gate
            const gateS = s + 46, lane = clamp(x * 0.25 + (i % 2 ? -2.8 : 2.8), -6.2, 6.2);
            const flag = group(S.scene); flag.position.copy(point(gateS, lane)); flag.rotation.y = heading(gateS);
            for (const side of [-1, 1]) {
                drum(flag, side * 2.4, 1.3, 0, 0.055, 0.08, 2.6, copper);
                box(flag, side * 2.85, 2.15, 0, 0.9, 0.6, 0.06, i % 2 ? ice : copper);
            }
            r.gates.push({ s: gateS, x: lane });

            // Neon Snow Speed Pad every 2nd section
            if (i % 2 === 0) {
                const padS = s + 33, px = clamp(lane * 0.7, -5.5, 5.5);
                const pad = group(S.scene); pad.position.copy(point(padS, px, 0.06)); pad.rotation.y = heading(padS);
                for (let c = 0; c < 3; c++) box(pad, 0, 0.02, -c * 1.1, 2.8, 0.04, 0.55, boostM);
                r.pads.push({ s: padS, x: px });
            }

            // Gold Big-Air Kicker Ramp vs Boulder Cluster
            if (i % 2 === 1) {
                const rampS = s + 64, rx = clamp(-lane * 0.55, -5.2, 5.2);
                const kicker = group(S.scene); kicker.position.copy(point(rampS, rx, 0.38)); kicker.rotation.y = heading(rampS);
                box(kicker, 0, 0, 0, 4.0, 0.78, 4.4, gold).rotation.x = 0.24;
                for (const side of [-1, 1]) box(kicker, side * 1.92, 0.24, 0, 0.14, 0.12, 4.2, glow).rotation.x = 0.24;
                r.ramps.push({ s: rampS, x: rx });
            } else {
                const hazardS = s + 64, hx = Math.sin(i * 2.3) * 5.2;
                const rocks = group(S.scene); rocks.position.copy(point(hazardS, hx)); rocks.rotation.y = heading(hazardS);
                for (let j = 0; j < 3; j++) {
                    const rock = part(rocks, new THREE.DodecahedronGeometry(0.85 + j * 0.14), steel, (j - 1) * 0.75, 0.35, Math.sin(j));
                    rock.scale.y = 0.72; rock.rotation.y = j;
                }
                r.rocks.push({ s: hazardS, x: hx });
            }
        }

        // Overhead Gondola Cableway
        const cabins = [];
        for (let s = 70; s < LENGTH; s += 160) {
            const a = point(s, 15.5, 11.5), b = point(s + 130, 17.5, 12.5);
            rod(S.scene, point(s, 15.5), a, 0.22, steel); rod(S.scene, a, b, 0.05, steel);
            const car = group(S.scene); box(car, 0, -1.55, 0, 1.9, 1.75, 2.35, copper);
            box(car, 0, -1.24, 0, 1.96, 0.78, 2.41, basic(0xfde68a));
            rod(car, V(0, 0, 0), V(0, -0.75, 0), 0.06, steel);
            cabins.push({ car, a, b, phase: s / 160 });
        }
        r.cabins = cabins;

        // Crystal Ice Cavern Tunnel (s = 780..1010) with glowing ice arches & hanging stalactites
        for (let s = 785; s < 1005; s += 11) {
            const frame = group(S.scene); frame.position.copy(point(s)); frame.rotation.y = heading(s);
            for (const k of [-1, 1]) rod(frame, V(k * 11.5, -0.3, 0), V(k * 6.2, 8.2, 0), 0.68, ice, 0.42);
            rod(frame, V(-6.2, 8.2, 0), V(6.2, 8.2, 0), 0.52, ice);
            if (s % 22 === 15) {
                for (const sx of [-3.5, 0, 3.5]) {
                    const st = part(frame, new THREE.ConeGeometry(0.32, 1.8, 5), basic(0xa5f3fc), sx, 7.1, 0);
                    st.rotation.x = Math.PI;
                }
            }
        }
    }

    function build(S) {
        const r = S.data.rally = {
            s: 0, x: 0, vx: 0, y: 0, vy: 0, speed: 15, focus: 45, boost: 0, rail: null, lastRailEnd: -99, railMeters: 0,
            rails: [], gates: [], rocks: [], ramps: [], pads: [],
            gateIndex: 0, rockIndex: 0, rampIndex: 0, padIndex: 0,
            clears: 0, rank: 4, combo: 0, stunts: 0, drafting: 0,
            grab: 0, airSpin: 0, airFlip: 0, uber: false, trickName: '',
            heading: heading(0), chase: true, stun: 0, split: 0, splitTime: 0, lastSplit: 0, finished: false, sprayT: 0, avWarned: false
        };
        terrain(S); raceFeatures(S, r);
        S.spawned = r.gates.length;
        r.player = rider(S.scene, 0xee7459, 0xfde68a, 0xf43f5e);
        r.rivals = [
            { col: 0x06b6d4, name: 'VEX' },
            { col: 0xfacc15, name: 'KORA' },
            { col: 0xa855f7, name: 'NYX' }
        ].map((cfg, i) => ({ fig: rider(S.scene, cfg.col, 0xf8fafc, cfg.col), s: 5 + i * 3.5, x: i * 3 - 3, index: i, finished: false }));

        S.scene.background = new THREE.Color(0x8bc2dc);
        S.scene.fog = new THREE.FogExp2(0xa6cde0, 0.0046);
        BO.Player.rideState = { kind: 'minigame', pos: point(0), eye: 2, roll: 0, pitch: 0 };
        BO.Player.yaw = r.heading; BO.Player.pitch = -0.15;
        pose(r.player, 0, 0, 0, 0, 0, 0, 0, false);
        r.rivals.forEach((v) => pose(v.fig, v.s, v.x, 0, 0, 0, 0, 0, false));
        if (MA()) MA().start('snow');
    }

    function pose(fig, s, x, h, lean, spin, flip, grab, uber) {
        fig.root.position.copy(point(s, x, h));
        fig.root.rotation.y = heading(s) + spin;
        fig.pivot.rotation.z = lean;
        fig.pivot.rotation.x = flip;
        fig.torso.rotation.x = -0.15 - grab * 0.65;
        fig.arms.forEach((arm, i) => { arm.rotation.z = (i ? 1 : -1) * (uber ? 1.45 : grab * 0.95 + lean * 0.6); });
        if (fig.board) fig.board.position.y = uber ? -0.55 : 0;
    }

    function key(S, code) {
        const r = S.data.rally;
        if (code === 'KeyC') { r.chase = !r.chase; SFX.clack(); return true; }
        if (code === 'Space') {
            if (r.rail || r.y <= 0.04) {
                if (r.rail) r.lastRailEnd = r.s;
                r.rail = null; r.vy = 9.0; r.y = Math.max(r.y, 0.05); SFX.boing();
            }
            return true;
        }
        if (code === 'KeyQ') {
            if (r.y > 0.45 && !r.uber && r.focus >= 45) {
                r.uber = true; r.focus -= 45; r.vy = Math.max(r.vy, 4.5);
                r.trickName = 'SUPERMAN UBER!';
                SFX.star(3);
                BO.FX.spawnParticles(point(r.s, r.x, r.y + 1), 18, 0xfde047, 5, 2, 0.45, 1.0);
                BO.Minigames.toast('★ UBER TRICK: SUPERMAN BOARD-DETACH! ★', '#fde047');
            }
            return true;
        }
        if (code === 'KeyF') {
            if (r.focus >= 35 && r.boost <= 0) {
                r.focus -= 35; r.boost = 2.8; SFX.whoosh(0.38);
                BO.Minigames.toast('ALPINE NITRO BOOST!', '#38bdf8');
            } else if (r.focus < 35) {
                BO.Minigames.toast('Need 35% Boost (' + Math.floor(r.focus) + '%) • grind rails or land tricks!', '#cbd5e1');
            }
            return true;
        }
        return false;
    }

    function tick(S, dt, state) {
        const r = S.data.rally, p = BO.Player, k = p.keys;
        if (state === 'running' && !r.finished) {
            if (MA()) MA().tick(dt, { boost: r.boost > 0 || r.uber });
            const before = r.s, steer = Number(!!k.KeyD) - Number(!!k.KeyA), pitchIn = Number(!!k.KeyW) - Number(!!k.KeyS);
            r.stun = Math.max(0, r.stun - dt); r.boost = Math.max(0, r.boost - dt);

            // Slipstream Drafting behind rivals
            let inDraft = false;
            for (const v of r.rivals) {
                if (v.s > r.s + 2 && v.s < r.s + 18 && Math.abs(v.x - r.x) < 2.2) { inDraft = true; break; }
            }
            if (inDraft) {
                r.drafting = Math.min(2.0, r.drafting + dt);
                r.focus = Math.min(100, r.focus + dt * 12);
            } else r.drafting = Math.max(0, r.drafting - dt * 1.5);

            const draftBonus = r.drafting > 0.6 ? 5.2 : 0;
            const target = (k.KeyS ? 15.5 : k.KeyW ? 30.5 : 23.8) + (r.boost > 0 ? 9.8 : 0) + draftBonus - (r.stun > 0 ? 10 : 0);
            r.speed = BO.Math.damp(r.speed, target, 0.9, dt);
            r.s = Math.min(LENGTH, r.s + r.speed * dt);
            r.vx = BO.Math.damp(r.vx, steer * (k.KeyW ? 9.8 : 14.5), 6.4, dt);

            // Sector 4 Avalanche Setpiece!
            if (r.s > 1280 && !r.avWarned) {
                r.avWarned = true;
                SFX.rumble(0.95);
                BO.Minigames.toast('⚠ AVALANCHE ON THE RIDGE — FULL TUCK [W] + BOOST [F]!', '#fde047');
            }
            if (r.s > 1280 && r.s < 1560 && Math.random() < dt * 12) {
                BO.FX.spawnParticles(point(r.s + 18 + Math.random() * 14, (Math.random() < 0.5 ? -1 : 1) * (11 + Math.random() * 5), 2 + Math.random() * 3), 3, 0xe0f2fe, 5, 2, 0.65, 1.4);
            }

            if (r.rail) {
                r.x = BO.Math.damp(r.x, r.rail.x, 12, dt); r.y = r.rail.transfer ? 1.38 : 0.82; r.vy = 0;
                r.railMeters += r.s - before; r.focus = Math.min(100, r.focus + dt * 24);
                r.sprayT -= dt;
                if (r.sprayT <= 0) { r.sprayT = 0.045; BO.FX.spawnParticles(point(r.s, r.x, r.y - 0.05), 3, 0xffcf87, 3.5, 2, 0.24, 0.65); }
                if (r.s >= r.rail.end) {
                    r.lastRailEnd = r.s;
                    const wasTransfer = r.rail.transfer;
                    r.rail = null; r.vy = 5.5;
                    S.bumpCombo();
                    S.award(Math.round((wasTransfer ? 720 : 400) * S.comboMult), point(r.s, r.x, 2.0), wasTransfer ? 'HIGH-LINE TRANSFER!' : 'COPPER GRIND!', '#ffcf87');
                    SFX.ding(wasTransfer ? 1.5 : 1.3);
                }
            } else {
                r.x = clamp(r.x + r.vx * dt, -HALF, HALF);
                if (r.y > 0 || r.vy > 0) {
                    r.y = Math.max(0, r.y + r.vy * dt - 9.2 * dt * dt); r.vy -= 18.4 * dt;
                    if (k.KeyE || r.uber) {
                        r.grab += dt;
                        r.airSpin += steer * dt * 7.2;
                        r.airFlip += pitchIn * dt * 6.5;
                        const deg = Math.round((Math.abs(r.airSpin) * 180) / Math.PI);
                        const flips = Math.floor(Math.abs(r.airFlip) / 4.2);
                        r.trickName = r.uber ? 'SUPERMAN UBER' : flips > 0 ? (r.airFlip > 0 ? 'FRONTFLIP' : 'BACKFLIP') + (deg >= 270 ? ' CORK ' + deg + '°' : '') : deg >= 540 ? 'RODEO ' + deg + '°' : deg >= 270 ? 'METHOD ' + deg + '°' : 'INDY GRAB';
                    }
                    if (!r.y) {
                        const clean = (r.grab > 0.12 && !k.KeyE) || r.uber;
                        if (clean) {
                            r.stunts++;
                            const spinPts = Math.round(Math.abs(r.airSpin) * 85);
                            const flipPts = Math.round(Math.abs(r.airFlip) * 120);
                            const base = (r.uber ? 900 : 280) + spinPts + flipPts;
                            r.focus = Math.min(100, r.focus + (r.uber ? 40 : 22));
                            if (r.uber) r.boost = Math.max(r.boost, 3.2);
                            S.bumpCombo();
                            S.award(Math.round(base * S.comboMult), point(r.s, r.x, 2.0), (r.trickName || 'CLEAN GRAB') + '!', '#fde68a');
                            SFX.star(r.uber ? 3 : 2);
                        } else if (r.grab > 0.14 && k.KeyE) {
                            r.stun = 1.05; r.combo = 0; S.breakCombo('LATE RELEASE');
                            BO.Minigames.toast('Release [E] before landing!', '#ffc997');
                        }
                        r.airSpin = 0; r.airFlip = 0; r.grab = 0; r.uber = false; r.trickName = ''; r.vy = 0;
                    }
                } else {
                    r.sprayT -= dt;
                    if (r.sprayT <= 0 && (Math.abs(r.vx) > 2.0 || r.boost > 0)) {
                        r.sprayT = 0.045;
                        BO.FX.spawnParticles(point(r.s, r.x, 0.12), 2, r.boost > 0 ? 0x38bdf8 : 0xffffff, 2.6, 1.2, 0.30, 0.75);
                    }
                }
                const rail = r.rails.find((v) => before < v.s + 1.4 && r.s >= v.s - 2.4 && Math.abs(r.x - v.x) < 1.45 && r.y < (v.transfer ? 2.1 : 1.55));
                if (rail) {
                    const isTransfer = rail.transfer && (r.s - r.lastRailEnd) < 14;
                    r.rail = rail; r.y = rail.transfer ? 1.38 : 0.82; r.vy = 0; SFX.clack();
                    if (isTransfer) BO.Minigames.toast('RAIL TRANSFER x2!', '#fde047');
                }
            }

            // Neon Speed Boost Pads
            const pad = r.pads[r.padIndex];
            if (pad && r.s >= pad.s) {
                r.padIndex++;
                if (Math.abs(r.x - pad.x) < 2.2 && r.y < 0.6) {
                    r.speed = Math.min(42, r.speed + 7.5); r.focus = Math.min(100, r.focus + 18);
                    S.award(160, point(pad.s, pad.x, 1.4), 'TURBO STRIP!', '#38bdf8');
                    SFX.whoosh(0.28);
                }
            }

            // Gold Big-Air Kicker Ramps
            const ramp = r.ramps[r.rampIndex];
            if (ramp && r.s >= ramp.s) {
                r.rampIndex++;
                if (Math.abs(r.x - ramp.x) <= 2.3 && r.y < 1.25) {
                    r.rail = null; r.vy = 12.6; r.y = Math.max(r.y, 0.45);
                    r.focus = Math.min(100, r.focus + 14);
                    S.award(240, point(ramp.s, ramp.x, 2.0), 'BIG AIR! [E] TRICK / [Q] UBER', '#fde047');
                    SFX.boing();
                }
            }

            // Slalom Gates
            const gate = r.gates[r.gateIndex];
            if (gate && r.s >= gate.s) {
                r.gateIndex++;
                if (Math.abs(r.x - gate.x) <= 2.55) {
                    r.clears++; r.combo++; S.kills++; S.bumpCombo();
                    r.focus = Math.min(100, r.focus + 16);
                    S.award(200 + 45 * Math.min(6, r.combo), point(gate.s, gate.x, 2.0), 'GATE x' + r.combo, '#8ce8db');
                    SFX.ding(1.15 + Math.min(5, r.combo) * 0.05);
                } else { r.combo = 0; S.breakCombo('MISSED GATE'); }
            }

            // Rocks
            const rock = r.rocks[r.rockIndex];
            if (rock && r.s >= rock.s) {
                r.rockIndex++;
                if (Math.abs(r.x - rock.x) < 1.85 && r.y < 0.82) {
                    r.speed *= 0.66; r.stun = 1.2; r.combo = 0; S.breakCombo('ROCK IMPACT');
                    BO.Minigames.flashScreen('rgba(196,224,232,.25)'); SFX.bonk();
                }
            }

            for (const v of r.rivals) {
                if (v.finished) continue;
                const v0 = 22.0 + v.index * 1.38 + 1.9 * Math.cos(v.s / 71 + v.index);
                v.s = Math.min(LENGTH, v.s + v0 * dt); v.finished = v.s === LENGTH;
                v.x = 5.6 * Math.sin(v.s / 32 + v.index * 1.8);
                const hurdle = r.rocks.find((o) => Math.abs(v.s - o.s) < 8 && Math.abs(v.x - o.x) < 2.5);
                pose(v.fig, v.s, v.x, hurdle ? 1.25 * Math.sin((Math.PI * (v.s - hurdle.s + 8)) / 16) : 0, 0.19 * Math.cos(v.s / 32 + v.index), 0, 0, 0.1, false);
            }

            r.rank = 1 + r.rivals.filter((v) => v.s > r.s || v.finished).length;
            if (Math.floor(r.s / 365) > r.split && r.split < 4) {
                r.split++; r.lastSplit = S.t - r.splitTime; r.splitTime = S.t;
                BO.Minigames.toast(SECTORS[r.split] + ' • split ' + r.lastSplit.toFixed(1) + ' s', '#dff4ff');
                SFX.crowd(0.22);
            }
            if (r.s >= LENGTH) {
                r.finished = true;
                if (MA()) MA().stopBoardLoops();
                SFX.crowd(0.35); SFX.fanfare();
                const placeBonus = 1600 + (4 - r.rank) * 950 + Math.round(r.railMeters * 5);
                S.award(placeBonus, point(LENGTH, r.x, 2.2), 'FINISH P' + r.rank + '!', '#fde68a');
                BO.Minigames.finish('SUMMIT RALLY • PLACE ' + r.rank + '/4', { color: '#8fdedc' });
            }
            if (MA()) MA().updateBoardAudio(r.speed, r.vx / 12, r.y <= 0.04, !!r.rail, r.boost > 0);
        }

        const angle = heading(r.s);
        p.yaw += angle - r.heading;
        const yawOff = clamp(BO.Math.angleDiff(angle, p.yaw), -0.52, 0.52);
        p.yaw = angle + BO.Math.damp(yawOff, -r.vx * 0.012, 3.2, dt);
        const targetPitch = Math.atan(slopeGrade(r.s)) - (r.chase ? 0.09 : 0.02);
        p.pitch = BO.Math.damp(clamp(p.pitch, -0.55, 0.30), targetPitch, 4.0, dt);
        r.heading = angle;

        const lean = -r.vx * 0.025;
        pose(r.player, r.s, r.x, r.y, lean, r.airSpin, r.airFlip, (k.KeyE || r.uber) && r.y > 0 ? 1 : 0, r.uber);
        r.player.root.visible = r.chase;
        const eye = p.rideState;
        if (eye) {
            eye.pos.copy(point(r.s - (r.chase ? 4.7 : 0), r.x, r.y + (r.chase ? 1.72 : 0)));
            eye.eye = r.chase ? 1.05 : 1.48;
            eye.roll = lean * 0.26;
            eye.pitch = -0.02 + (r.boost > 0 ? -0.028 : 0);
        }
        for (const car of r.cabins) car.car.position.lerpVectors(car.a, car.b, (S.t * 0.055 + car.phase) % 1);
    }

    function hud(S) {
        const r = S.data.rally;
        const label = r.uber ? '★ SUPERMAN UBER ★' : r.rail ? 'COPPER GRIND' : r.grab > 0 ? (r.trickName || 'AIR GRAB') + ' (RELEASE E!)' : r.boost > 0 ? 'ALPINE NITRO' : r.drafting > 0.6 ? 'SLIPSTREAM DRAFT' : r.stun > 0 ? 'RECOVERING' : SECTORS[r.split];
        return `<div class="course-console rally-console"><strong>${label}</strong><span>PLACE <b>${r.rank}/4</b></span><span>SPEED <b>${Math.round(r.speed * 3.6)} km/h</b></span><span>BOOST <b>${Math.floor(r.focus)}%</b> ${r.focus >= 45 && r.y > 0.4 ? '<i>[Q UBER]</i>' : r.focus >= 35 ? '<i>[F]</i>' : ''}</span><span>GATES <b>${r.clears}/${r.gates.length}</b></span><span><b>${Math.round(r.s)} / ${LENGTH} m</b></span></div>`;
    }

    function result(S) {
        const r = S.data.rally, stars = S.rt.starsOf(S.def, S.opts).filter((v) => S.score >= v).length;
        return {
            score: S.score, stars, xp: 120 + stars * 150 + Math.round(S.score * 0.06),
            title: 'SUMMIT RALLY • PLACE ' + r.rank + '/4',
            stats: [['TIME', S.t.toFixed(2) + ' s'], ['GATES CLEARED', r.clears + '/' + r.gates.length], ['GRIND DISTANCE', Math.round(r.railMeters) + ' m'], ['CLEAN TRICKS', r.stunts]]
        };
    }

    function dispose() { if (MA()) MA().stop(); }

    BO.SummitRally = { build, key, tick, hud, result, dispose, length: LENGTH };
})(window.BO);
