/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Target Practice courses 14–15
     14. Mansion Raid   — clear a nine-room mansion, room by room; save the hostages
     15. Sweetheart Shore — a heart blaster on a sunny beach; friendly runners
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const { B, SFX, std, basic, clamp01, Ease, TAU, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    /* =====================================================================
       14. MANSION RAID
    ===================================================================== */
    const ROOM_X = [-12, 0, 12];
    const ROOM_Z = [-8, -20, -32];
    const WALL_H = 4;
    // doors in walls of constant z (x positions) and constant x (z positions)
    const DOORS_Z = { '-2': [0], '-14': [0, -12], '-26': [-12, 12], '-38': [] };
    const DOORS_X = { '-18': [], '-6': [-8, -32], '6': [-8, -20], '18': [] };
    const ROOMS = [
        { id: 'foyer', name: 'Foyer', c: [0, -8], floor: 'marble' },
        { id: 'living', name: 'Living Room', c: [-12, -8], floor: 'carpet_red' },
        { id: 'dining', name: 'Dining Room', c: [12, -8], floor: 'parquet' },
        { id: 'library', name: 'Library', c: [-12, -20], floor: 'carpet_green' },
        { id: 'hall', name: 'Grand Hall', c: [0, -20], floor: 'marble' },
        { id: 'kitchen', name: 'Kitchen', c: [12, -20], floor: 'tile' },
        { id: 'study', name: 'Study', c: [-12, -32], floor: 'parquet' },
        { id: 'gallery', name: 'Gallery', c: [0, -32], floor: 'marble' },
        { id: 'bedroom', name: 'Master Bedroom', c: [12, -32], floor: 'carpet_blue' }
    ];
    // encounters now come from BO.MansionScenarios (15 situations, one picked per run)

    function floorTex(kind) {
        return L.canvasTex('mansion-floor:' + kind, 256, 256, (g, w, h) => {
            if (kind === 'marble') {
                for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#e7e5e4' : '#1c1917'; g.fillRect(x * 64, y * 64, 64, 64); }
                g.strokeStyle = 'rgba(120,113,108,0.4)'; g.lineWidth = 1;
                for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(Math.random() * w, Math.random() * h); g.lineTo(Math.random() * w, Math.random() * h); g.stroke(); }
            } else if (kind === 'parquet') {
                g.fillStyle = '#7c4a1e'; g.fillRect(0, 0, w, h);
                for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
                    g.fillStyle = (x + y) % 2 ? '#8b5a2b' : '#6b3f17';
                    if ((x + y) % 2) g.fillRect(x * 32, y * 32, 32, 16); else g.fillRect(x * 32, y * 32, 16, 32);
                }
            } else if (kind === 'tile') {
                g.fillStyle = '#f8fafc'; g.fillRect(0, 0, w, h);
                g.strokeStyle = '#94a3b8'; g.lineWidth = 2;
                for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); }
            } else {
                const col = { carpet_red: ['#7f1d1d', '#991b1b', '#facc15'], carpet_green: ['#14532d', '#166534', '#d9f99d'], carpet_blue: ['#1e3a8a', '#1e40af', '#e0e7ff'] }[kind] || ['#444', '#555', '#999'];
                g.fillStyle = col[0]; g.fillRect(0, 0, w, h);
                g.fillStyle = col[1];
                for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(32 + i * 64, 32 + j * 64, 20, 0, TAU); g.fill(); }
                g.strokeStyle = col[2]; g.lineWidth = 2;
                for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.strokeRect(14 + i * 64, 14 + j * 64, 36, 36); }
            }
        });
    }

    function wallpaper() {
        const t = L.canvasTex('mansion-wallpaper', 128, 256, (g, w, h) => {
            g.fillStyle = '#e9dcc0'; g.fillRect(0, 0, w, h);
            g.fillStyle = 'rgba(146,113,64,0.22)';
            for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 10, h * 0.7);
            for (let y = 20; y < h * 0.66; y += 48) for (let x = 16; x < w; x += 32) { g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); }
            g.fillStyle = '#5b3a1e'; g.fillRect(0, h * 0.7, w, h * 0.3);
            g.fillStyle = '#3f2a14'; g.fillRect(0, h * 0.7, w, 6);
        });
        t.wrapS = THREE.RepeatWrapping;
        t.repeat.set(3, 1);
        return t;
    }

    function wallRun(S, axis, fixed, a1, a2, doors, mat, doorW = 2.4) {
        const gaps = doors.map((d) => [d - doorW / 2, d + doorW / 2]).sort((p, q) => p[0] - q[0]);
        let cur = a1;
        const seg = (s, e) => {
            if (e - s < 0.05) return;
            const mid = (s + e) / 2, len = e - s;
            if (axis === 'x') S.box(mid, WALL_H / 2, fixed, len, WALL_H, 0.3, mat, { solid: true, shadow: false });
            else S.box(fixed, WALL_H / 2, mid, 0.3, WALL_H, len, mat, { solid: true, shadow: false });
        };
        for (const [g1, g2] of gaps) {
            seg(cur, g1);
            const mid = (g1 + g2) / 2;
            if (axis === 'x') S.box(mid, 3.25, fixed, doorW, 1.5, 0.3, mat, { solid: true, shadow: false });
            else S.box(fixed, 3.25, mid, 0.3, 1.5, doorW, mat, { solid: true, shadow: false });
            const frame = std(0x3f2a14, 0.7);
            for (const e of [g1, g2]) {
                if (axis === 'x') S.box(e, 1.25, fixed, 0.12, 2.5, 0.36, frame, { collide: false, shadow: false });
                else S.box(fixed, 1.25, e, 0.36, 2.5, 0.12, frame, { collide: false, shadow: false });
            }
            cur = g2;
        }
        seg(cur, a2);
    }

    function furnish(S, room) {
        const [cx, cz] = room.c;
        const P = (x, z) => [cx + x, cz + z];
        const wood = std(0x5b3a1e, 0.7), dark = std(0x2b1a0c, 0.7), cloth = std(0x7f1d1d, 0.9), gold = std(0xd4a017, 0.3, 0.8), white = std(0xf5f5f4, 0.5);
        room.furn = [];
        const box = (x, y, z, w, h, d, m, o) => {
            const [X, Z] = P(x, z);
            if (!o || o.collide !== false) room.furn.push({ x, z, w, d });     // footprint for MansionScenarios slot picking
            return S.box(X, y, Z, w, h, d, m, Object.assign({ solid: true }, o || {}));
        };
        switch (room.id) {
            case 'foyer':
                box(0, 0.45, -2.4, 1.4, 0.9, 1.4, dark);
                box(0, 1.1, -2.4, 0.3, 0.4, 0.3, std(0x1e40af, 0.3, 0.2), { collide: false });
                for (const sx of [-4.8, 4.8]) box(sx, 2, -0.5, 0.6, 4, 0.6, white);
                break;
            case 'living':
                box(-3, 0.45, -0.4, 3.2, 0.9, 1.0, cloth);
                box(-3, 0.75, 0.15, 3.2, 0.6, 0.3, cloth);
                box(0, 0.25, -2.5, 1.6, 0.5, 0.9, wood);
                box(-5.6, 1.2, -3, 0.5, 2.4, 2.4, std(0x57534e, 0.9));
                box(-5.3, 0.6, -3, 0.2, 0.8, 1.2, basic(0xf97316), { collide: false, solid: false });
                box(4.5, 0.45, -1, 1.0, 0.9, 2.4, cloth);
                break;
            case 'dining':
                box(0, 0.4, -1.2, 5, 0.8, 1.6, wood);
                for (let i = -2; i <= 2; i++) for (const s of [-1, 1]) box(i, 0.5, -1.2 + s * 1.1, 0.45, 1.0, 0.45, dark);
                box(0, 0.5, -5.5, 3.5, 1.0, 0.6, dark);
                break;
            case 'library':
                for (const sx of [-5.6, 5.6]) for (const sz of [-4, -1, 2]) box(sx, 1.6, sz, 0.6, 3.2, 2.6, std(0x3f2a14, 0.8));
                box(0, 1.6, -5.6, 6, 3.2, 0.6, std(0x3f2a14, 0.8));
                box(-1, 0.45, 1, 1.0, 0.9, 1.0, std(0x14532d, 0.9));
                box(1.6, 0.45, 1.5, 1.0, 0.9, 1.0, std(0x14532d, 0.9));
                break;
            case 'hall':
                box(-2.8, 0.55, 2.5, 1.8, 1.1, 1.2, std(0x0a0a0a, 0.2, 0.3));
                for (const [x, z] of [[-4, -1], [4, -1], [-4, 3], [4, 3]]) box(x, 2, z, 0.7, 4, 0.7, white);
                box(4, 0.5, -3.2, 2.2, 1.0, 0.8, wood);
                break;
            case 'kitchen':
                box(0, 0.5, 0.6, 3.4, 1.0, 1.4, std(0xe7e5e4, 0.4));
                box(5.6, 0.5, -1, 0.8, 1.0, 9, std(0xd6d3d1, 0.4));
                box(0, 0.5, -5.6, 9, 1.0, 0.8, std(0xd6d3d1, 0.4));
                box(-5.4, 1.1, -5.2, 1.0, 2.2, 1.0, std(0xe5e7eb, 0.3, 0.6));
                break;
            case 'study':
                box(0, 0.45, -1.8, 2.6, 0.9, 1.2, wood);
                box(-5.6, 1.6, -2, 0.6, 3.2, 4, std(0x3f2a14, 0.8));
                box(5.2, 0.6, -5.2, 1.0, 1.2, 1.0, std(0x52525b, 0.4, 0.8));
                break;
            case 'gallery':
                for (const [x, z] of [[-2, -1], [2, -1], [0, 2]]) {
                    box(x, 0.55, z, 0.8, 1.1, 0.8, white);
                    box(x, 1.5, z, 0.4, 0.8, 0.4, std(0x9ca3af, 0.3, 0.6), { collide: false });
                }
                break;
            case 'bedroom':
                box(0, 0.35, -3.6, 2.6, 0.7, 3.0, std(0xf8fafc, 0.8));
                box(0, 0.9, -5.2, 2.8, 1.4, 0.3, dark);
                box(-5.4, 1.2, 1, 0.8, 2.4, 2.6, wood);
                for (const sx of [-1.8, 1.8]) box(sx, 0.3, -4.8, 0.6, 0.6, 0.6, wood);
                break;
            default: break;
        }
        // paintings on walls
        const frameCol = gold;
        const rnd = L.mulberry32(cx * 31 + cz * 7 + 99);
        for (let i = 0; i < 2; i++) {
            const art = L.canvasTex('painting:' + room.id + i, 96, 64, (g, w, h) => {
                const pal = ['#1e3a8a', '#b45309', '#166534', '#7f1d1d', '#a16207', '#0e7490'];
                g.fillStyle = pal[Math.floor(rnd() * 6)]; g.fillRect(0, 0, w, h);
                for (let k = 0; k < 6; k++) { g.fillStyle = pal[Math.floor(rnd() * 6)]; g.beginPath(); g.arc(rnd() * w, rnd() * h, 6 + rnd() * 18, 0, TAU); g.fill(); }
            });
            const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), new THREE.MeshStandardMaterial({ map: art, roughness: 0.8 }));
            const fr = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.2, 0.05), frameCol);
            const side = i ? 1 : -1;
            const g = new THREE.Group();
            g.add(fr, pm);
            pm.position.z = 0.03;
            g.position.set(cx + side * 5.8, 2.3, cz - 2.5 + i * 2);
            g.rotation.y = -side * Math.PI / 2;
            S.add(g);
        }
        // chandelier
        const ch = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 20), gold);
        ring.rotation.x = Math.PI / 2;
        ch.add(ring);
        for (let i = 0; i < 6; i++) {
            const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), basic(0xfff3c4));
            b.position.set(Math.cos(i / 6 * TAU) * 0.55, 0.08, Math.sin(i / 6 * TAU) * 0.55);
            ch.add(b);
        }
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), gold);
        chain.position.y = 0.3;
        ch.add(chain);
        ch.position.set(cx, WALL_H - 0.7, cz);
        S.add(ch);
        if (BO.Settings.getQualityPreset().pointLights) {
            const pl = new THREE.PointLight(0xffe6b0, 1.25, 15, 1.5);
            pl.position.set(cx, WALL_H - 0.9, cz);
            S.add(pl);
        }
    }

    function hasLOS(from, to) {
        const dir = to.clone().sub(from);
        const dist = dir.length();
        dir.normalize();
        const rc = new THREE.Raycaster(from, dir, 0.2, dist - 0.3);
        const hits = rc.intersectObjects(BO.World.worldMeshes, false);
        return hits.length === 0;
    }

    function crimFire(S, tg) {
        const P = BO.Player;
        const cam = BO.App.worldCamera;
        const gun = tg.fig.parts.gun;
        const from = new THREE.Vector3();
        if (gun) gun.getWorldPosition(from); else tg.root.getWorldPosition(from).add(V(0, 1.5, 0));
        const hit = Math.random() < (tg.boss ? 0.7 : 0.55);
        const to = cam.position.clone().add(hit ? V(0, -0.2, 0) : V((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2.4));
        BO.FX.spawnTracer(from, to, 0xff5533, 0.028, 0.08);
        BO.FX.spawnParticles(from, 5, 0xfbbf24, 3, 2, 0.12, 0.6);
        SFX.noise(0.12, 1100, 'bandpass', 0.8, 0.38);
        SFX.tone(150, 60, 0.12, 'triangle', 0.15);
        if (hit) {
            S.data.hp = Math.max(0, S.data.hp - (tg.boss ? 25 : 20));
            S.data.timesHit++;
            MG.flashScreen('rgba(220,38,38,0.35)');
            P.cameraShake = Math.max(P.cameraShake, 0.06);
            SFX.tone(90, 50, 0.2, 'sine', 0.3);
            if (S.data.hp <= 0) MG.finish('YOU WERE DOWNED', { color: '#f87171' });
        }
    }

    function addCriminal(S, room, lx, lz, mode, rng, opts = {}) {
        const [cx, cz] = room.c;
        const boss = mode === 'boss';
        const pick = (a) => a[Math.floor(rng() * a.length) % a.length];
        const fig = F.human(boss
            ? { skin: pick(F.SKINS), coat: 0x111111, shirt: 0xf5f5f4, tie: 0x7f1d1d, pants: 0x111111, hair: 0x1c1917, glasses: 'shades', gun: 'pistol', eyes: 'angry', scale: 1.05 }
            : { skin: pick(F.SKINS), shirt: pick([0x1f2937, 0x27272a, 0x3f3f46, 0x14532d]), pants: pick([0x111827, 0x1c1917]), mask: pick([0x0a0a0a, 0x1f2937, 0x3f3f46]), vest: rng() < 0.4 ? 0x3f4a2a : null, gun: mode === 'shield' ? 'pistol' : pick(['rifle', 'pistol']), eyes: 'angry' });
        const pos = V(cx + lx, 0, cz + lz);
        const face = A.yawTo(pos, V(cx, 0, cz + 6));
        const st = { mode, active: false, t: 0, react: lerp(1.0, 1.6, rng()) - (room.depth || 0) * 0.12, fire: 0, up: mode !== 'cover', cycle: rng() * 2 };
        F.pose(fig, mode === 'shield' ? 'shield' : 'idle');
        const tg = S.addTarget({
            mesh: fig.root, hitMeshes: fig.hit, pos, yaw: face, points: boss ? 600 : 250, hp: boss ? 3 : 1, life: 0,
            appear: 'none', inT: 0.01, death: 'knock', deathColor: 0x7f1d1d,
            onDamage: () => { SFX.thunk(); MG.toast('BOSS IS WEARING ARMOR', '#fca5a5'); },
            onTick: (t, dt) => {
                st.t += dt;
                if (st.mode === 'cover') {
                    if (!st.active) st.up = false;
                    else { st.cycle += dt; st.up = (st.cycle % 2.8) < 1.6; }
                    const want = st.up ? 0 : -0.78;
                    fig.body.position.y = lerp(fig.body.position.y, want, Math.min(1, dt * 10));
                }
                if (!st.active) { if (!fig.armsBusy) F.walk(fig, st.t * 0.8, 0.05); return; }
                const cam = BO.App.worldCamera.position;
                const want = Math.atan2(cam.x - t.root.position.x, cam.z - t.root.position.z);
                t.root.rotation.y += wrapA(want - t.root.rotation.y) * Math.min(1, dt * 6);
                if (st.t < st.react) return;
                if (st.mode !== 'shield') F.pose(fig, 'aim');
                if (!st.up) return;
                st.fire -= dt;
                if (st.fire <= 0 && MG.state === 'running') {
                    st.fire = boss ? 1.1 : 1.55;
                    const head = new THREE.Vector3();
                    fig.parts.head.getWorldPosition(head);
                    if (hasLOS(head, BO.App.worldCamera.position)) crimFire(S, t);
                    else st.fire = 0.4;
                }
            },
            onKill: () => {
                SFX.thunk();
                room.crimsLeft--;
                S.data.crimsLeft--;
                if (room.crimsLeft === 0) roomCleared(S, room);
            }
        });
        tg.fig = fig;
        tg.boss = boss;
        tg.activate = () => { if (!st.active) { st.active = true; st.t = 0; } };
        room.crims.push(tg);
        room.crimsLeft++;
        S.data.crimsLeft++;
        S.data.crimsTotal++;
        return tg;
    }

    function addHostage(S, room, x, z, yaw, rng) {
        const fig = F.human(F.randomCivilian(rng, { eyes: 'scared', mouth: 'o' }));
        F.pose(fig, 'handsUp');
        let tt = rng() * 5;
        const tg = S.addTarget({
            mesh: fig.root, hitMeshes: fig.hit, pos: V(x, 0, z), yaw, points: 0, penalty: 600, penaltyLabel: 'HOSTAGE!', life: 0,
            appear: 'none', inT: 0.01, death: 'knock', deathColor: 0xfca5a5,
            onTick: (t, dt) => { tt += dt; if (!t.saved) F.pose(fig, 'handsUp', tt); },
            onKill: () => { S.data.hostagesHit++; }
        });
        tg.fig = fig;
        room.hostages.push(tg);
        S.data.hostagesTotal++;
        return tg;
    }

    function roomCleared(S, room) {
        S.data.roomsCleared++;
        MG.toast(room.name.toUpperCase() + ' CLEAR', '#86efac');
        SFX.ding(1.1);
        for (const h of room.hostages) {
            if (!h.alive) continue;
            h.saved = true;
            F.pose(h.fig, 'idle');
            h.fig.parts.armR.rotation.z = 2.6;
            S.data.saved++;
            const p = h.root.position.clone().add(V(0, 2.1, 0));
            S.award(300, p, 'SAVED', '#86efac');
            h.hitMeshes = [];       // no longer shootable
        }
        if (S.data.crimsLeft <= 0) {
            const left = Math.max(0, MG.def.duration - S.t);
            const bonus = Math.round(left * 20 + S.data.hp * 10);
            S.award(bonus, BO.App.worldCamera.position.clone().add(V(0, 0, -3)), 'HOUSE CLEAR BONUS', '#fde68a');
            MG.finish('HOUSE CLEAR', { color: '#86efac' });
        }
    }

    MG.register({
        id: 'mansion_raid', cat: 'target', order: 14,
        name: 'Mansion Raid', icon: '🚔', accent: '#3b82f6',
        tagline: 'Room by room. Find the crew. Save the hostages.',
        desc: 'A crew has taken over a nine-room mansion, and every run is one of 15 different situations (a jewel heist, a dinner-party siege, a panic room, a wedding and more), so robbers and hostages are never where you expect. Walk in through the front door and clear it room by room: foyer, living room, dining room, library, grand hall, kitchen, study, gallery and the master bedroom. Criminals react when you enter, some hide behind furniture, and some hold a hostage as a shield. Do not shoot hostages. They shoot back, and you have 100 health.',
        hudSub: 'Clear every room • criminals = masks • hostages = hands up',
        heroLabel: 'TARGET PRACTICE • FREE ROAM • 3 MINUTES',
        duration: 180, stars: [3000, 5500, 8000, 10500], standardWeapon: 'mp5', forgivingMisses: true,
        map: {
            atmosphere: { skyTop: 0x020617, skyBottom: 0x1e293b, fogColor: 0x111827, fogDensity: 0.012, sunColor: 0xc7d2fe, sunIntensity: 0.25, sunPos: [20, 60, 30], hemiSky: 0xfff1d6, hemiGround: 0x3b2f2a, hemiIntensity: 1.05, moon: true },
            boxes: [B(0, -0.5, -18, 90, 1, 90, 'concrete')],
            spawn: { x: 0, y: 0, z: 6, yaw: 0 }
        },
        keys: [['WASD', 'Move room to room'], ['LMB', 'Shoot'], ['R', 'Retry from results']],
        build(S) {
            Object.assign(S.data, { hp: 100, timesHit: 0, crimsLeft: 0, crimsTotal: 0, hostagesTotal: 0, hostagesHit: 0, saved: 0, roomsCleared: 0 });
            K.groundPlane(S, 90, 0x1f3d1f, 0.002);
            const wm = new THREE.MeshStandardMaterial({ map: wallpaper(), roughness: 0.85 });
            const outer = std(0xd6cfc0, 0.9);
            // floors
            for (const room of ROOMS) {
                const tex = floorTex(room.floor).clone();
                tex.needsUpdate = true;
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(3, 3);
                tex.userData.mgOwned = true;
                const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ map: tex, roughness: room.floor === 'marble' ? 0.25 : 0.85 }));
                fl.rotation.x = -Math.PI / 2;
                fl.position.set(room.c[0], 0.012, room.c[1]);
                fl.receiveShadow = true;
                S.add(fl);
                S.solid(fl);
            }
            // walls
            for (const z of Object.keys(DOORS_Z)) wallRun(S, 'x', +z, -18, 18, DOORS_Z[z], +z === -2 || +z === -38 ? outer : wm);
            for (const x of Object.keys(DOORS_X)) wallRun(S, 'z', +x, -38, -2, DOORS_X[x].map((d) => d), Math.abs(+x) === 18 ? outer : wm);
            // ceiling + roof (no shadows, so the hemisphere light fills the rooms)
            const ceil = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), std(0xf5f0e6, 0.9));
            ceil.rotation.x = Math.PI / 2;
            ceil.position.set(0, WALL_H, -20);
            S.add(ceil);
            S.solid(ceil);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(27, 7, 4, 1), std(0x3f3f46, 0.8));
            roof.rotation.y = Math.PI / 4;
            roof.position.set(0, WALL_H + 3.5, -20);
            roof.scale.set(1, 1, 1);
            S.add(roof);
            // front porch
            for (const sx of [-3, 3]) S.box(sx, 2, 0.6, 0.5, 4, 0.5, std(0xf5f5f4, 0.5), { solid: true });
            const porch = new THREE.Mesh(new THREE.BoxGeometry(9, 0.2, 3), std(0x78716c, 0.9));
            porch.position.set(0, 0.1, -0.5);
            S.add(porch);
            const awn = new THREE.Mesh(new THREE.BoxGeometry(9, 0.25, 3.2), std(0xf5f5f4, 0.6));
            awn.position.set(0, 4.1, -0.4);
            S.add(awn);
            const sign = A.sign('POLICE — HOSTAGE SITUATION', 4.2, 0.5, { bg: '#1e3a8a', color: '#f8fafc', borderColor: '#93c5fd', size: 0.45 });
            sign.position.set(0, 3.5, 1.21);
            S.add(sign);
            // cop car with flashing lights outside
            const car = new THREE.Group();
            const cb = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4.4), std(0x111827, 0.4, 0.3));
            cb.position.y = 0.7;
            const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 2.2), std(0xf8fafc, 0.4));
            top.position.y = 1.5;
            const red = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.25), basic(0xef4444));
            red.position.set(-0.3, 1.88, 0);
            const blue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.25), basic(0x3b82f6));
            blue.position.set(0.3, 1.88, 0);
            car.add(cb, top, red, blue);
            car.position.set(-7, 0, 7);
            car.rotation.y = 0.4;
            S.add(car);
            S.collider(-8.6, 0, 4.6, -5.4, 2, 9.4);
            S.animate(() => {
                const on = Math.floor(performance.now() / 260) % 2;
                red.material = basic(on ? 0xef4444 : 0x450a0a);
                blue.material = basic(on ? 0x1e3a8a : 0x60a5fa);
            });
            for (let i = 0; i < 10; i++) {
                const hedge = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 1), std(0x14532d, 0.9));
                hedge.position.set((i < 5 ? -1 : 1) * (6 + (i % 5) * 3), 0.6, 0.8);
                S.add(hedge);
            }
            // rooms: furniture + encounters
            for (const room of ROOMS) {
                room.crims = [];
                room.hostages = [];
                room.crimsLeft = 0;
                room.depth = ROOM_Z.indexOf(room.c[1]);
                room.entered = false;
                furnish(S, room);
            }
            // one of fifteen situations, chosen at random each run
            const MS = BO.MansionScenarios;
            const sitIdx = MS.pick();
            const sit = MS.layoutAll(ROOMS)[sitIdx];
            S.data.situation = sit;
            const rng = L.mulberry32(911 + sitIdx * 131);
            for (const room of ROOMS) {
                for (const pl of sit.placements.filter((q) => q.room === room.id)) {
                    const e = [pl.type, pl.x, pl.z, pl.type];
                    const [type, lx, lz] = e;
                    if (type === 'host') {
                        const p = V(room.c[0] + lx, 0, room.c[1] + lz);
                        addHostage(S, room, p.x, p.z, A.yawTo(p, V(room.c[0], 0, room.c[1] + 6)), rng);
                    } else if (type === 'shield') {
                        const c = addCriminal(S, room, lx, lz, 'shield', rng);
                        const yaw = c.root.rotation.y;
                        const hx = c.root.position.x + Math.sin(yaw) * 0.5, hz = c.root.position.z + Math.cos(yaw) * 0.5;
                        const h = addHostage(S, room, hx, hz, yaw, rng);
                        c.shieldHost = h;
                    } else addCriminal(S, room, lx, lz, type === 'boss' ? 'boss' : e[3], rng);
                }
            }
            S.data.rooms = ROOMS;
            S.data.roomsToClear = ROOMS.filter((r) => r.crimsLeft > 0).length;
        },
        onGo(S) {
            const sit = S.data.situation;
            BO.Events.emit('hud:banner', { title: sit.name.toUpperCase(), sub: sit.brief, color: '#93c5fd' });
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            const p = BO.Player.pos;
            for (const room of S.data.rooms) {
                const [cx, cz] = room.c;
                const inside = Math.abs(p.x - cx) < 5.9 && Math.abs(p.z - cz) < 5.9;
                if (inside && !room.entered) {
                    room.entered = true;
                    if (room.crimsLeft > 0) MG.toast(room.name.toUpperCase(), '#93c5fd');
                    for (const c of room.crims) if (c.alive) c.activate();
                }
                // shields keep their hostage pinned in front
                for (const c of room.crims) {
                    if (!c.shieldHost || !c.alive || !c.shieldHost.alive) continue;
                    const yaw = c.root.rotation.y;
                    c.shieldHost.root.position.set(c.root.position.x + Math.sin(yaw) * 0.5, 0, c.root.position.z + Math.cos(yaw) * 0.5);
                    c.shieldHost.root.rotation.y = yaw;
                }
            }
        },
        hud(S) {
            const hp = S.data.hp;
            return `<div class="mgx-raid"><div class="mgx-hp"><small>HEALTH</small><div class="mgx-hp-bar"><i style="width:${hp}%;background:${hp > 50 ? '#22c55e' : hp > 25 ? '#f59e0b' : '#ef4444'}"></i></div><b>${hp}</b></div>
                <div class="mgx-chip">CRIMINALS LEFT <b>${S.data.crimsLeft}</b></div><div class="mgx-chip">ROOMS CLEAR <b>${S.data.roomsCleared} / ${S.data.roomsToClear}</b></div><div class="mgx-chip">${esc(S.data.situation.name.toUpperCase())}</div>${S.data.hostagesHit ? `<div class="mgx-chip mgx-bad">HOSTAGES HIT <b>${S.data.hostagesHit}</b></div>` : ''}</div>`;
        },
        result(S) {
            const stars = this.stars.filter((th) => S.score >= th).length;
            const clear = S.data.crimsLeft <= 0;
            return {
                score: S.score, stars,
                title: S.data.hp <= 0 ? 'OFFICER DOWN' : clear && !S.data.hostagesHit ? 'TEXTBOOK RAID' : clear ? 'HOUSE CLEARED' : 'TIME UP',
                stats: [
                    ['CRIMINALS', (S.data.crimsTotal - S.data.crimsLeft) + ' / ' + S.data.crimsTotal], ['HOSTAGES SAVED', S.data.saved + ' / ' + S.data.hostagesTotal],
                    ['HOSTAGES HIT', S.data.hostagesHit], ['HEALTH LEFT', S.data.hp], ['TIME', BO.Math.formatTime(S.t)], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—'],
                    ['SITUATION', S.data.situation.name.toUpperCase()]
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(150 + S.score * 0.05 + stars * 150)
            };
        }
    });

    /* =====================================================================
       15. SWEETHEART SHORE — the heart blaster (AAA Tropical Overhaul)
       High-detail sculpted anime beachgoers (BO.BeachArt) with bespoke
       swimwear, hair sheen, and real 2nd-order soft-tissue/hair/cloth
       spring-damper physics run up from a sunlit tropical shoreline.
    ===================================================================== */
    function spawnGirl(S, d, idx, x0, z0, speed, weave, ph0) {
        const BA = BO.BeachArt;
        const g = BA.buildGirl(d);
        const st = { ph: ph0, z: z0, x: x0, t: 0 };
        const pitch = 0.90 + (idx % 10) * 0.035;
        const tg = S.addTarget({
            mesh: g.root, hitMeshes: g.hit, pos: V(x0, 0, z0), yaw: 0, points: 150, life: 0,
            appear: 'scale', vanish: 'scale', inT: 0.3, outT: 0.35, death: 'none', deathColor: 0xff7ab8,
            onTick: (t, dt) => {
                st.t += dt;
                const running = MG.state === 'running';
                const spd = running ? speed : speed * 0.3;
                st.z += spd * dt;
                const dx = Math.cos(st.t * 1.3 + ph0) * weave;
                st.x += dx * dt;
                st.x = BO.Math.clamp(st.x, -15, 15);
                t.root.position.set(st.x, 0, st.z);
                t.root.rotation.y = Math.atan2(dx * 0.35, 1);
                st.ph += dt * (4.2 + spd * 1.25);
                BA.updateGirl(g, S, dt, st.ph, 1, spd, true);
                if (st.z > -2.4 && t.phase !== 'out') {
                    MG.popup(t.root.position.clone().add(V(0, 2, 0)), `${d.name} (${d.title}) ran past!`, '#f9a8d4');
                    t.retire();
                }
            },
            onKill: () => {
                const r = g.root;
                S.scene.attach(r);
                BA.reactGirl(S, g, d, pitch);
            }
        });
        tg.girl = d;
        return tg;
    }

    function beachBall() {
        const tex = L.canvasTex('beachball-hq', 256, 128, (g, w, h) => {
            const cols = ['#ef4444', '#ffffff', '#3b82f6', '#ffffff', '#facc15', '#ffffff'];
            for (let i = 0; i < 6; i++) { g.fillStyle = cols[i]; g.fillRect(i * w / 6, 0, w / 6 + 1, h); }
            g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 12); g.fillRect(0, h - 12, w, 12);
        });
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25, metalness: 0.05 }));
        m.castShadow = true;
        const grp = new THREE.Group();
        grp.add(m);
        return { mesh: grp, hitMeshes: [m], ball: m };
    }

    function surfboard(c1, c2) {
        const tex = L.canvasTex('surf:' + c1 + ':' + c2, 64, 256, (g, w, h) => {
            g.fillStyle = c1; g.fillRect(0, 0, w, h);
            g.fillStyle = c2; g.fillRect(w * 0.38, 0, w * 0.24, h);
            g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(w * 0.48, 0, w * 0.04, h);
        });
        const g = new THREE.Group();
        const board = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 2.25, 16), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.22, metalness: 0.08 }));
        board.scale.set(1, 1, 0.16);
        board.position.y = 1.05;
        board.castShadow = true;
        g.add(board);
        return g;
    }

    function beachLounger(stripeCol) {
        const g = new THREE.Group();
        const wood = std(0x9a6b3e, 0.78);
        const fabric = std(stripeCol, 0.65);
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 1.85), wood);
        base.position.set(0, 0.34, 0);
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 1.25), fabric);
        pad.position.set(0, 0.40, 0.28);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.65), fabric);
        back.position.set(0, 0.62, -0.58);
        back.rotation.x = 0.62;
        for (const [x, z] of [[-0.32, -0.78], [0.32, -0.78], [-0.32, 0.78], [0.32, 0.78]]) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.06), wood);
            leg.position.set(x, 0.17, z);
            g.add(leg);
        }
        g.add(base, pad, back);
        g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        return g;
    }

    MG.register({
        id: 'sweetheart_shore', cat: 'target', order: 15,
        name: 'Sweetheart Shore', icon: '💖', accent: '#f472b6',
        tagline: 'The heart blaster. Spread the love.',
        desc: 'A sunlit tropical paradise where your gun fires hearts. Ten uniquely sculpted anime beachgoers — each with bespoke swimwear, signature beach props, layered hair, and real spring-damper motion — run up from the turquoise shoreline. Tag each one with a heart before she reaches the boardwalk. Bouncing beach balls award bonus points.',
        hudSub: 'Tag every runner with a heart before she reaches you',
        duration: 60, stars: [4000, 8500, 13500, 19000], standardWeapon: 'five_seven', tracerColor: 0xff5fa8, forgivingMisses: true,
        map: {
            atmosphere: {
                skyTop: 0x0369a1, skyBottom: 0x7dd3fc, fogColor: 0xbae6fd, fogDensity: 0.0024,
                sunColor: 0xfff4d6, sunIntensity: 1.42, sunPos: [32, 44, 38],
                hemiSky: 0xbae6fd, hemiGround: 0xd4a36a, hemiIntensity: 0.52
            },
            boxes: [B(0, -0.5, -40, 220, 1, 220, 'desert_sand')],
            spawn: { x: 0, y: 0, z: 1.2, yaw: 0 }
        },
        build(S) {
            // Studio 3-point tropical lighting: 45° golden key sun (from map) + turquoise ocean back-rim + soft peach fill
            const oceanRim = new THREE.DirectionalLight(0x67e8f9, 0.62);
            oceanRim.position.set(-8, 16, -58);
            const peachFill = new THREE.DirectionalLight(0xffe4d6, 0.26);
            peachFill.position.set(-24, 12, 22);
            S.add(oceanRim, peachFill);

            // Rich warm golden beach sand (high contrast against light skin & bright swimwear)
            const sandTex = L.canvasTex('hq-beach-sand-v2', 256, 256, (g, w, h) => {
                g.fillStyle = '#d4ad72'; g.fillRect(0, 0, w, h);
                for (let y = 0; y < h; y += 6) {
                    g.strokeStyle = y % 12 === 0 ? 'rgba(245,222,179,0.28)' : 'rgba(154,112,56,0.22)';
                    g.lineWidth = 2;
                    g.beginPath();
                    for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + y * 0.1) * 2.5);
                    g.stroke();
                }
                for (let i = 0; i < 700; i++) {
                    g.fillStyle = i % 2 ? 'rgba(255,245,220,0.20)' : 'rgba(130,90,42,0.20)';
                    g.fillRect((i * 73) % w, (i * 41) % h, 2, 2);
                }
            });
            sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
            sandTex.repeat.set(28, 28);
            const sandMesh = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.88 }));
            sandMesh.rotation.x = -Math.PI / 2;
            sandMesh.position.y = 0.002;
            sandMesh.receiveShadow = true;
            S.add(sandMesh);

            // Glowing golden sun disc + soft halo over the tropical horizon
            const sunHaloTex = L.canvasTex('hq-sun-halo', 256, 256, (g, w, h) => {
                const rg = g.createRadialGradient(128, 128, 12, 128, 128, 124);
                rg.addColorStop(0, 'rgba(255, 253, 240, 1)');
                rg.addColorStop(0.22, 'rgba(254, 240, 138, 0.85)');
                rg.addColorStop(0.55, 'rgba(251, 191, 36, 0.24)');
                rg.addColorStop(1, 'rgba(251, 191, 36, 0)');
                g.fillStyle = rg; g.fillRect(0, 0, w, h);
            });
            const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunHaloTex, transparent: true, depthWrite: false, fog: false }));
            sunSpr.position.set(28, 36, -185);
            sunSpr.scale.set(44, 44, 1);
            S.add(sunSpr);

            // Layered turquoise-to-cobalt tropical ocean with multi-frequency rolling waves
            const seaTex = L.canvasTex('hq-tropical-sea', 128, 256, (g, w, h) => {
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0, '#0369a1');
                gr.addColorStop(0.45, '#0284c7');
                gr.addColorStop(0.82, '#06b6d4');
                gr.addColorStop(1, '#67e8f9');
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
            });
            const sea = new THREE.Mesh(
                new THREE.PlaneGeometry(360, 170, 72, 32),
                new THREE.MeshStandardMaterial({ map: seaTex, roughness: 0.14, metalness: 0.28, transparent: true, opacity: 0.94 })
            );
            sea.rotation.x = -Math.PI / 2;
            sea.position.set(0, 0.07, -146);
            S.add(sea);
            const base = sea.geometry.attributes.position.array.slice();

            // Dual animated whitewater surf foam lines + glossy wet shoreline sand
            const foamTex = L.canvasTex('hq-surf-foam', 256, 64, (g, w, h) => {
                g.clearRect(0, 0, w, h);
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0, 'rgba(255,255,255,0)');
                gr.addColorStop(0.45, 'rgba(255,255,255,0.88)');
                gr.addColorStop(0.7, 'rgba(224,242,254,0.65)');
                gr.addColorStop(1, 'rgba(255,255,255,0)');
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
                g.fillStyle = 'rgba(255,255,255,0.55)';
                for (let i = 0; i < 45; i++) { g.beginPath(); g.arc((i * 19) % w, 24 + Math.sin(i) * 10, 4 + (i % 5), 0, TAU); g.fill(); }
            });
            foamTex.wrapS = THREE.RepeatWrapping; foamTex.repeat.set(16, 1);
            const foam1 = new THREE.Mesh(new THREE.PlaneGeometry(340, 4.2), new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, opacity: 0.85, depthWrite: false }));
            foam1.rotation.x = -Math.PI / 2; foam1.position.set(0, 0.09, -62.2);
            const foam2 = new THREE.Mesh(new THREE.PlaneGeometry(340, 3.2), new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, opacity: 0.65, depthWrite: false }));
            foam2.rotation.x = -Math.PI / 2; foam2.position.set(0, 0.085, -65.5);
            const wet = new THREE.Mesh(new THREE.PlaneGeometry(340, 9.5), new THREE.MeshStandardMaterial({ color: 0xc9a875, roughness: 0.22, metalness: 0.12 }));
            wet.rotation.x = -Math.PI / 2; wet.position.set(0, 0.008, -59.5);
            S.add(foam1, foam2, wet);

            // Distant tropical islands & bobbing sailboats on the horizon
            const islands = [[-72, -162, 22, 11], [68, -170, 28, 14], [-18, -185, 16, 7]];
            for (const [ix, iz, ir, ih] of islands) {
                const isl = new THREE.Mesh(new THREE.ConeGeometry(ir, ih, 18), std(0x15803d, 0.9));
                isl.position.set(ix, ih * 0.42, iz);
                const beachRing = new THREE.Mesh(new THREE.CylinderGeometry(ir * 0.92, ir * 1.05, 1.1, 18), std(0xf3dfb0, 0.9));
                beachRing.position.set(ix, 0.4, iz);
                S.add(isl, beachRing);
            }
            const boats = [];
            for (const [bx, bz, col] of [[-32, -118, 0xf43f5e], [42, -132, 0xfacc15]]) {
                const bt = new THREE.Group();
                const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 4.2), std(0xf8fafc, 0.4));
                hull.position.y = 0.35;
                const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 4.5, 6), std(0x94a3b8, 0.4, 0.6));
                mast.position.y = 2.6;
                const sail = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.8, 3), std(col, 0.6));
                sail.position.set(0, 2.7, 0.35); sail.scale.set(0.12, 1, 1);
                bt.add(hull, mast, sail);
                bt.position.set(bx, 0.1, bz);
                bt.rotation.y = bx < 0 ? 0.5 : -0.6;
                S.add(bt);
                boats.push({ obj: bt, x0: bx, z0: bz });
            }

            let wt = 0;
            S.animate((dt) => {
                wt += dt;
                const arr = sea.geometry.attributes.position.array;
                for (let i = 0; i < arr.length; i += 3) {
                    arr[i + 2] = Math.sin(base[i] * 0.075 + wt * 1.45) * 0.36 + Math.cos(base[i + 1] * 0.11 + wt * 1.1) * 0.24;
                }
                sea.geometry.attributes.position.needsUpdate = true;
                foam1.position.z = -62.0 + Math.sin(wt * 0.85) * 1.5;
                foam1.material.opacity = 0.55 + Math.sin(wt * 0.85) * 0.32;
                foam2.position.z = -65.5 + Math.sin(wt * 0.85 - 1.4) * 1.4;
                foam2.material.opacity = 0.4 + Math.sin(wt * 0.85 - 1.4) * 0.25;
                for (let i = 0; i < boats.length; i++) {
                    boats[i].obj.position.y = 0.15 + Math.sin(wt * 1.3 + i * 2) * 0.18;
                    boats[i].obj.rotation.z = Math.sin(wt * 1.1 + i) * 0.06;
                }
            });

            // Upgraded Boardwalk Deck with weathered planks, rope rails & warm string fairy lights
            const plankTex = L.canvasTex('hq-boardwalk', 256, 256, (g, w, h) => {
                g.fillStyle = '#b48556'; g.fillRect(0, 0, w, h);
                for (let y = 0; y < h; y += 32) {
                    g.fillStyle = y % 64 === 0 ? '#a67649' : '#be9060';
                    g.fillRect(0, y, w, 30);
                    g.fillStyle = '#5c3c20'; g.fillRect(0, y + 30, w, 2);
                }
            });
            plankTex.wrapS = plankTex.wrapT = THREE.RepeatWrapping; plankTex.repeat.set(3, 2);
            const plank = new THREE.MeshStandardMaterial({ map: plankTex, roughness: 0.82 });
            const deck = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.22, 5.2), plank);
            deck.position.set(0, -0.09, 1.5);
            deck.receiveShadow = true;
            S.add(deck);
            for (const x of [-4.0, 4.0]) for (const z of [-0.95, 3.95]) {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, 0.18), plank);
                post.position.set(x, 0.48, z);
                post.castShadow = true;
                S.add(post);
            }
            const rail = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.09, 0.12), plank);
            rail.position.set(0, 0.88, -0.95);
            S.add(rail);
            // Surfboards flanking the boardwalk entrance
            const sb1 = surfboard('#f472b6', '#ffffff'); sb1.position.set(-4.65, 0, -0.5); sb1.rotation.set(0.12, 0.35, -0.15); S.add(sb1);
            const sb2 = surfboard('#06b6d4', '#fde047'); sb2.position.set(4.65, 0, -0.5); sb2.rotation.set(0.12, -0.35, 0.15); S.add(sb2);

            S.collider(-4.1, 0, -1.05, 4.1, 1.1, -0.85);
            S.collider(-4.2, 0, -1.05, -3.9, 3, 4.2);
            S.collider(3.9, 0, -1.05, 4.2, 3, 4.2);
            S.collider(-4.1, 0, 3.9, 4.1, 3, 4.2);
            const sign = A.sign('♥ SWEETHEART SHORE ♥', 3.8, 0.6, { bg: '#fdf2f8', color: '#db2777', borderColor: '#f472b6', size: 0.52 });
            sign.position.set(0, 2.55, 4.0);
            sign.rotation.y = Math.PI;
            S.add(sign);

            // Palms, umbrellas, loungers, towels, seashells, volleyball court, lifeguard tower
            const rnd = L.mulberry32(214);
            for (let i = 0; i < 22; i++) {
                const p = A.palm(1.1 + rnd() * 0.55);
                const side = i % 2 ? 1 : -1;
                p.position.set(side * (18.5 + rnd() * 15), 0, 5 - i * 3.1);
                p.rotation.y = rnd() * TAU;
                S.add(p);
            }
            const umbCols = ['#f43f5e', '#0ea5e9', '#facc15', '#10b981', '#ec4899'];
            for (let i = 0; i < 10; i++) {
                const c = umbCols[i % umbCols.length];
                const tex = L.canvasTex('umb:' + c, 128, 16, (g, w, h) => { for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#ffffff' : c; g.fillRect(k * 16, 0, 16, h); } });
                const umb = new THREE.Group();
                const top = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.65, 20, 1, true), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.65 }));
                top.position.y = 2.35; top.castShadow = true;
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 2.45, 8), std(0xe5e7eb, 0.35, 0.6));
                pole.position.y = 1.22;
                umb.add(top, pole);
                const side = i % 2 ? 1 : -1;
                umb.position.set(side * (17 + rnd() * 6), 0, -7 - i * 4.8);
                umb.rotation.z = (rnd() - 0.5) * 0.18;
                S.add(umb);
                if (i % 2 === 0) {
                    const ch = beachLounger(parseInt(c.slice(1), 16));
                    ch.position.set(umb.position.x - side * 1.1, 0, umb.position.z + 0.6);
                    ch.rotation.y = side * -0.45;
                    S.add(ch);
                } else {
                    const towel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.02, 1.85), std(parseInt(umbCols[(i + 2) % 5].slice(1), 16), 0.88));
                    towel.position.set(umb.position.x + side * 1.1, 0.012, umb.position.z + 0.5);
                    towel.rotation.y = rnd();
                    S.add(towel);
                }
            }

            // Scattered coral starfish & shells along the sand
            for (let i = 0; i < 24; i++) {
                const sx = (rnd() - 0.5) * 34;
                const sz = -6 - rnd() * 48;
                const sh = new THREE.Mesh(new THREE.OctahedronGeometry(0.08 + rnd() * 0.05, 0), std(i % 2 ? 0xfb7185 : 0xfef3c7, 0.5));
                sh.scale.set(1.2, 0.35, 1.2);
                sh.position.set(sx, 0.03, sz);
                sh.rotation.y = rnd() * TAU;
                S.add(sh);
            }

            // Volleyball net + court boundary lines
            const net = new THREE.Mesh(new THREE.PlaneGeometry(7, 1, 14, 2), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
            net.position.set(-22, 1.9, -30); net.rotation.y = Math.PI / 2;
            S.add(net);
            for (const z of [-26.5, -33.5]) { const np = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6), std(0xe5e7eb, 0.4)); np.position.set(-22, 1.25, z); S.add(np); }

            // Detailed Lifeguard Tower with ladder & red rescue buoy
            const tower = new THREE.Group();
            const tp = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.22, 2.5), std(0xf8fafc, 0.6)); tp.position.y = 2.6;
            const hut = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.55, 2.0), std(0xef4444, 0.55)); hut.position.y = 3.48;
            const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 2.04), std(0x0f172a, 0.2, 0.5)); win.position.y = 3.55;
            const roofT = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.72, 4), std(0xf8fafc, 0.6)); roofT.position.y = 4.62; roofT.rotation.y = Math.PI / 4;
            const buoy = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 18), std(0xf43f5e, 0.4)); buoy.position.set(-1.05, 3.1, 0); buoy.rotation.y = Math.PI / 2;
            tower.add(tp, hut, win, roofT, buoy);
            for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.16), std(0xf8fafc, 0.6)); l.position.set(x, 1.3, z); tower.add(l); }
            tower.position.set(24, 0, -22);
            S.add(tower);

            K.cloudLayer(S, 12, 70, 200);
            // Animated soaring seagulls
            for (let i = 0; i < 6; i++) {
                const gull = new THREE.Group();
                for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.18), std(0xf8fafc, 0.6)); w.position.x = s * 0.37; w.rotation.z = s * 0.3; gull.add(w); }
                S.add(gull);
                const r = 20 + i * 6, sp = 0.2 + i * 0.05, ph = i * 1.3;
                let tt = 0;
                S.animate((dt) => {
                    tt += dt;
                    gull.position.set(Math.cos(tt * sp + ph) * r, 14 + Math.sin(tt * 0.7 + i) * 2, -45 + Math.sin(tt * sp + ph) * r * 0.5);
                    gull.rotation.y = -(tt * sp + ph);
                    gull.children[0].rotation.z = -0.3 - Math.sin(tt * 8 + i) * 0.4;
                    gull.children[1].rotation.z = 0.3 + Math.sin(tt * 8 + i) * 0.4;
                });
            }
        },
        schedule(S) {
            const GIRLS = BO.BeachArt.GIRLS;
            let idx = 0;
            K.ramp(S, { from: 1.75, to: 0.6, start: 0.4, end: 55.5, jitter: 0.25 }, (at, k, rng) => {
                const d = GIRLS[idx % GIRLS.length];
                const i = idx++;
                const x0 = (rng() - 0.5) * 26;
                const z0 = -48 - rng() * 8;
                const speed = lerp(3.4, 6.4, k) * (0.9 + rng() * 0.25);
                const weave = (0.6 + rng() * 1.5) * (rng() < 0.5 ? -1 : 1);
                const ph0 = rng() * TAU;
                S.at(at, (S2) => spawnGirl(S2, d, i, x0, z0, speed, weave, ph0));
            });
            K.ramp(S, { from: 7, to: 3.5, start: 5, end: 54 }, (at, k, rng) => {
                const x0 = rng() < 0.5 ? -16 : 16;
                const z = -10 - rng() * 25;
                const sp = (2.5 + rng() * 2.5) * (x0 < 0 ? 1 : -1);
                const bh = 1.5 + rng() * 2;
                S.at(at, (S2) => {
                    const b = beachBall();
                    S2.addTarget(Object.assign(b, {
                        pos: V(x0, 0.42, z), points: 75, bonus: true, life: 32 / Math.abs(sp), appear: 'scale', death: 'pop', deathColor: 0xfacc15,
                        motion: (tg, t, out) => { out.set(sp * t, Math.abs(Math.sin(t * 2.6)) * bh, 0); b.ball.rotation.z -= sp * 0.02; },
                        onKill: () => { SFX.pop(); S2.data.balls = (S2.data.balls || 0) + 1; }
                    }));
                });
            });
        },
        gunSound() {
            SFX.tone(980, 1680, 0.09, 'sine', 0.12);
            SFX.tone(1960, 2400, 0.06, 'triangle', 0.03, 0.02);
            return true;
        },
        onShot(S) {
            const cam = BO.App && BO.App.worldCamera;
            if (!cam) return;
            const dir = new THREE.Vector3();
            cam.getWorldDirection(dir);
            const h = BO.BeachArt.heartSprite(0.24);
            h.position.copy(cam.position).addScaledVector(dir, 0.9).add(V(0, -0.12, 0));
            S.add(h);
            let t = 0;
            S.animate((dt) => {
                t += dt;
                h.position.addScaledVector(dir, 55 * dt);
                if (t > 0.9) { if (h.parent) h.parent.remove(h); return false; }
            });
        },
        onHit(S, ent, info) {
            if (!ent.mgTarget || !ent.alive) return false;
            if (ent.girl) {
                S.hits++;
                S.kills++;
                S.bumpCombo();
                const mult = S.comboMult;
                S.award(ent.points * mult, ent.root.position.clone().add(V(0, 2.1, 0)), ent.girl.name + ' ♥' + (mult > 1 ? ' x' + mult.toFixed(1).replace('.0', '') : ''), '#f9a8d4');
                SFX.ding(1.3);
                ent.kill(info);
                return true;
            }
            const r = S.hitTarget(ent, info);
            if (r && info.pt) BO.BeachArt.heartBurst(S, info.pt, 5);
            return r;
        },
        result(S) {
            const stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: stars >= 4 ? 'HEARTTHROB' : stars === 3 ? 'SWEETHEART' : stars === 2 ? 'CHARMER' : stars === 1 ? 'FRIENDLY' : 'SHY',
                stats: [
                    ['HEARTS LANDED', S.kills + ' / ' + S.spawned], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—'],
                    ['BEST STREAK', S.maxCombo], ['RAN PAST', S.expired], ['HEARTS FIRED', S.shots], ['BEACH BALLS', S.data.balls || 0]
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(120 + S.score * 0.06 + stars * 150)
            };
        }
    });
})(window);
