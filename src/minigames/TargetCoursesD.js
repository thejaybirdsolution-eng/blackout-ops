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
    const { B, SFX, std, basic, clamp01, Ease, TAU } = L;
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
    // encounters: [type, localX, localZ, extra]; local -Z = deeper into the house
    const ENCOUNTERS = {
        foyer: [['crim', 3, -3.5, 'stand'], ['host', -3, -3]],
        living: [['crim', -3, -1.5, 'cover'], ['shield', 2.5, -4]],
        dining: [['crim', 0, -2.4, 'cover'], ['host', -3.5, 2], ['crim', 4.4, 3.5, 'stand']],
        library: [['crim', -2, -4, 'stand'], ['host', 2.5, -1]],
        hall: [['crim', -4, -4, 'stand'], ['crim', 4, -4.5, 'cover'], ['host', 0, -3]],
        kitchen: [['crim', 0, -0.4, 'cover'], ['host', 3.5, -4]],
        study: [['shield', 0, -3.5]],
        gallery: [['crim', -4, -2, 'stand'], ['crim', 4, -4, 'stand']],
        bedroom: [['boss', 0, -4], ['host', -3.5, -2]]
    };

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
        const box = (x, y, z, w, h, d, m, o) => { const [X, Z] = P(x, z); return S.box(X, y, Z, w, h, d, m, Object.assign({ solid: true }, o || {})); };
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
        desc: 'A crew has taken over a nine-room mansion. Walk in through the front door and clear it room by room: foyer, living room, dining room, library, grand hall, kitchen, study, gallery and the master bedroom. Criminals react when you enter, some hide behind furniture, and some hold a hostage as a shield. Do not shoot hostages. They shoot back, and you have 100 health.',
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
            const rng = L.mulberry32(911);
            for (const room of ROOMS) {
                room.crims = [];
                room.hostages = [];
                room.crimsLeft = 0;
                room.depth = ROOM_Z.indexOf(room.c[1]);
                room.entered = false;
                furnish(S, room);
                for (const e of ENCOUNTERS[room.id]) {
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
                <div class="mgx-chip">CRIMINALS LEFT <b>${S.data.crimsLeft}</b></div><div class="mgx-chip">ROOMS CLEAR <b>${S.data.roomsCleared} / 9</b></div>${S.data.hostagesHit ? `<div class="mgx-chip mgx-bad">HOSTAGES HIT <b>${S.data.hostagesHit}</b></div>` : ''}</div>`;
        },
        result(S) {
            const stars = this.stars.filter((th) => S.score >= th).length;
            const clear = S.data.crimsLeft <= 0;
            return {
                score: S.score, stars,
                title: S.data.hp <= 0 ? 'OFFICER DOWN' : clear && !S.data.hostagesHit ? 'TEXTBOOK RAID' : clear ? 'HOUSE CLEARED' : 'TIME UP',
                stats: [
                    ['CRIMINALS', (S.data.crimsTotal - S.data.crimsLeft) + ' / ' + S.data.crimsTotal], ['HOSTAGES SAVED', S.data.saved + ' / ' + S.data.hostagesTotal],
                    ['HOSTAGES HIT', S.data.hostagesHit], ['HEALTH LEFT', S.data.hp], ['TIME', BO.Math.formatTime(S.t)], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—']
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(150 + S.score * 0.05 + stars * 150)
            };
        }
    });

    /* =====================================================================
       15. SWEETHEART SHORE — the heart blaster
       Stylised anime-style beachgoers run up to say hi. Tag each with a heart
       before she reaches the boardwalk; she lights up, giggles and waves.
    ===================================================================== */
    const GIRLS = [
        { name: 'Mika', skin: 0xffe0c4, hair: 0xf472b6, style: 'twintails', eyes: '#a855f7', suit: 'frill', c1: 0xffffff, c2: 0xf472b6, acc: 'bow', accC: 0xec4899 },
        { name: 'Rin', skin: 0xf5d0b0, hair: 0x1e293b, style: 'ponytail', eyes: '#0ea5e9', suit: 'sport', c1: 0x0ea5e9, c2: 0xffffff, acc: 'visor', accC: 0xffffff },
        { name: 'Hana', skin: 0xe8b48a, hair: 0x7c2d12, style: 'long', eyes: '#16a34a', suit: 'sarong', c1: 0xf97316, c2: 0xfde047, acc: 'flower', accC: 0xef4444 },
        { name: 'Yuki', skin: 0xfff1e6, hair: 0xe0f2fe, style: 'bob', eyes: '#3b82f6', suit: 'onepiece', c1: 0x1d4ed8, c2: 0xffffff, acc: 'shades', accC: 0x111827 },
        { name: 'Sora', skin: 0xc68642, hair: 0xfacc15, style: 'bun', eyes: '#d97706', suit: 'sport', c1: 0x22c55e, c2: 0x064e3b, acc: 'scrunchie', accC: 0x22c55e },
        { name: 'Aiko', skin: 0xffdbac, hair: 0x991b1b, style: 'braid', eyes: '#dc2626', suit: 'frill', c1: 0xfef08a, c2: 0xf59e0b, acc: 'hat', accC: 0xfef3c7 },
        { name: 'Nami', skin: 0x8d5524, hair: 0x0f172a, style: 'long', eyes: '#f59e0b', suit: 'onepiece', c1: 0xdb2777, c2: 0xfbcfe8, acc: 'flower', accC: 0xfde047 },
        { name: 'Kiko', skin: 0xf1c27d, hair: 0xa78bfa, style: 'twintails', eyes: '#14b8a6', suit: 'sarong', c1: 0x14b8a6, c2: 0xccfbf1, acc: 'bow', accC: 0x7c3aed }
    ];

    function animeFace(eyeCol, happy) {
        return L.canvasTex('anime-face:' + eyeCol + ':' + (happy ? 1 : 0), 128, 128, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            // blush
            g.fillStyle = happy ? 'rgba(251,113,133,0.55)' : 'rgba(251,113,133,0.32)';
            for (const x of [30, 98]) { g.beginPath(); g.ellipse(x, 84, 13, 6, 0, 0, TAU); g.fill(); }
            g.lineCap = 'round';
            if (happy) {
                // ^ ^ eyes
                g.strokeStyle = '#1f1135'; g.lineWidth = 6;
                for (const x of [40, 88]) { g.beginPath(); g.moveTo(x - 13, 66); g.quadraticCurveTo(x, 46, x + 13, 66); g.stroke(); }
                // open smile
                g.fillStyle = '#7f1d3a';
                g.beginPath(); g.moveTo(52, 92); g.quadraticCurveTo(64, 112, 76, 92); g.closePath(); g.fill();
                g.fillStyle = '#fb7185'; g.beginPath(); g.ellipse(64, 101, 6, 3.5, 0, 0, TAU); g.fill();
            } else {
                for (const x of [40, 88]) {
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(x, 62, 13, 17, 0, 0, TAU); g.fill();
                    const gr = g.createLinearGradient(0, 48, 0, 78);
                    gr.addColorStop(0, '#1f1135'); gr.addColorStop(0.45, eyeCol); gr.addColorStop(1, '#ffffff');
                    g.fillStyle = gr;
                    g.beginPath(); g.ellipse(x, 64, 10, 14, 0, 0, TAU); g.fill();
                    g.fillStyle = '#1f1135';
                    g.beginPath(); g.ellipse(x, 64, 4.5, 7, 0, 0, TAU); g.fill();
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.arc(x - 4, 57, 4, 0, TAU); g.fill();
                    g.beginPath(); g.arc(x + 4, 70, 2, 0, TAU); g.fill();
                    // lashes
                    g.strokeStyle = '#1f1135'; g.lineWidth = 5;
                    g.beginPath(); g.ellipse(x, 62, 14, 18, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
                    g.lineWidth = 3;
                    g.beginPath(); g.moveTo(x + (x < 64 ? -12 : 12), 52); g.lineTo(x + (x < 64 ? -18 : 18), 47); g.stroke();
                }
                // brows
                g.strokeStyle = '#3b2314'; g.lineWidth = 2.5;
                for (const x of [40, 88]) { g.beginPath(); g.moveTo(x - 10, 36); g.quadraticCurveTo(x, 31, x + 10, 36); g.stroke(); }
                // small smile
                g.strokeStyle = '#7f1d3a'; g.lineWidth = 3;
                g.beginPath(); g.moveTo(57, 95); g.quadraticCurveTo(64, 101, 71, 95); g.stroke();
            }
        });
    }

    function heartTex() {
        return L.canvasTex('heart-sprite', 64, 64, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            const draw = (fill) => {
                g.beginPath();
                g.moveTo(32, 56);
                g.bezierCurveTo(4, 36, 4, 10, 20, 10);
                g.bezierCurveTo(28, 10, 32, 16, 32, 20);
                g.bezierCurveTo(32, 16, 36, 10, 44, 10);
                g.bezierCurveTo(60, 10, 60, 36, 32, 56);
                g.closePath();
                g.fillStyle = fill; g.fill();
            };
            g.shadowColor = '#ff3d9a'; g.shadowBlur = 8;
            draw('#ff4fa3');
            g.shadowBlur = 0;
            g.fillStyle = 'rgba(255,255,255,0.75)';
            g.beginPath(); g.ellipse(22, 20, 5, 3.5, -0.6, 0, TAU); g.fill();
        });
    }
    let heartMat = null;
    function heartSprite(scale) {
        if (!heartMat) heartMat = new THREE.SpriteMaterial({ map: heartTex(), transparent: true, depthWrite: false });
        const s = new THREE.Sprite(heartMat);
        s.scale.setScalar(scale);
        return s;
    }

    function capsule(r, len, mat, segs = 8) {
        return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, segs), mat);
    }

    /** Builds a stylised anime beachgoer. Faces +Z, feet at y=0, ~1.66m tall. */
    function beachGirl(d) {
        const mats = [];
        const M = (hex, rough = 0.6, extra = {}) => { const m = new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: rough, emissive: 0x000000 }, extra)); mats.push(m); return m; };
        const skin = M(d.skin, 0.55), hair = M(d.hair, 0.45), s1 = M(d.c1, 0.5), s2 = M(d.c2, 0.5), acc = M(d.accC, 0.45);
        const sandal = M(d.c2, 0.6);
        const root = new THREE.Group();
        const body = new THREE.Group();
        root.add(body);
        const P = { sway: [] };
        const hips = new THREE.Group();
        hips.position.y = 0.86;
        body.add(hips);
        P.hips = hips;
        const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), d.suit === 'sport' || d.suit === 'sarong' ? s2 : s1);
        pelvis.scale.set(1, 0.72, 0.78);
        hips.add(pelvis);
        for (const s of [-1, 1]) {
            const thigh = new THREE.Group();
            thigh.position.set(s * 0.08, -0.03, 0);
            const tm = capsule(0.066, 0.3, skin);
            tm.position.y = -0.2;
            const knee = new THREE.Group();
            knee.position.y = -0.41;
            const sm = capsule(0.054, 0.32, skin);
            sm.position.y = -0.2;
            const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.17), sandal);
            foot.position.set(0, -0.4, 0.04);
            knee.add(sm, foot);
            thigh.add(tm, knee);
            hips.add(thigh);
            P[s < 0 ? 'thighL' : 'thighR'] = thigh;
            P[s < 0 ? 'kneeL' : 'kneeR'] = knee;
        }
        const chest = new THREE.Group();
        hips.add(chest);
        P.chest = chest;
        const waist = capsule(0.098, 0.16, d.suit === 'onepiece' || d.suit === 'frill' ? s1 : skin);
        waist.position.y = 0.15;
        waist.scale.z = 0.82;
        const upper = capsule(0.118, 0.12, s1);
        upper.position.y = 0.33;
        upper.scale.set(1.05, 1, 0.8);
        chest.add(waist, upper);
        if (d.suit === 'sport') {
            const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.014, 6, 24), s2);
            stripe.rotation.x = Math.PI / 2;
            stripe.position.y = 0.27;
            stripe.scale.set(1.05, 0.8, 1);
            chest.add(stripe);
        } else if (d.suit === 'onepiece') {
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.016, 6, 24), s2);
            band.rotation.x = Math.PI / 2;
            band.position.y = 0.12;
            band.scale.set(1, 0.82, 1);
            chest.add(band);
        } else if (d.suit === 'frill') {
            const ruffle = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.022, 6, 28), s2);
            ruffle.rotation.x = Math.PI / 2;
            ruffle.position.y = 0.4;
            ruffle.scale.set(1.05, 0.82, 1);
            chest.add(ruffle);
            const skirtG = new THREE.Group();
            const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.23, 0.17, 20, 1, true), M(d.c2, 0.6, { side: THREE.DoubleSide }));
            skirt.position.y = -0.08;
            skirtG.add(skirt);
            hips.add(skirtG);
            P.sway.push({ obj: skirtG, kind: 'skirt' });
        }
        if (d.suit === 'sarong') {
            const tex = L.canvasTex('sarong:' + d.c1, 64, 64, (g, w, h) => {
                g.fillStyle = '#' + d.c2.toString(16).padStart(6, '0'); g.fillRect(0, 0, w, h);
                g.fillStyle = '#' + d.c1.toString(16).padStart(6, '0');
                for (let i = 0; i < 6; i++) { g.beginPath(); g.arc((i * 23) % w, (i * 37) % h, 7, 0, TAU); g.fill(); }
            });
            const sarG = new THREE.Group();
            const sar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.24, 0.42, 20, 1, true, -0.4, Math.PI * 1.55), M(0xffffff, 0.7, { map: tex, side: THREE.DoubleSide }));
            sar.position.y = -0.18;
            sarG.add(sar);
            hips.add(sarG);
            P.sway.push({ obj: sarG, kind: 'sarong' });
        }
        // arms
        for (const s of [-1, 1]) {
            const sh = new THREE.Group();
            sh.position.set(s * 0.155, 0.42, 0);
            const um = capsule(0.04, 0.2, skin);
            um.position.y = -0.13;
            const el = new THREE.Group();
            el.position.y = -0.27;
            const fm = capsule(0.035, 0.18, skin);
            fm.position.y = -0.11;
            const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), skin);
            hand.position.y = -0.25;
            el.add(fm, hand);
            sh.add(um, el);
            chest.add(sh);
            P[s < 0 ? 'shL' : 'shR'] = sh;
            P[s < 0 ? 'elL' : 'elR'] = el;
        }
        if (d.acc === 'scrunchie') {
            const sc = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.016, 6, 14), acc);
            sc.rotation.x = Math.PI / 2;
            sc.position.y = -0.2;
            P.elL.add(sc);
        }
        // neck + head
        const neck = capsule(0.038, 0.06, skin);
        neck.position.y = 0.5;
        chest.add(neck);
        const head = new THREE.Group();
        head.position.y = 0.6;
        chest.add(head);
        P.head = head;
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 18), skin);
        skull.scale.set(1, 1.04, 0.96);
        skull.position.y = 0.1;
        head.add(skull);
        const faceMat = new THREE.MeshBasicMaterial({ map: animeFace(d.eyes, false), transparent: true, depthWrite: false });
        const face = new THREE.Mesh(new THREE.SphereGeometry(0.1515, 24, 16, Math.PI / 2 - 0.72, 1.44, Math.PI / 2 - 0.5, 1.0), faceMat);
        face.scale.copy(skull.scale);
        face.position.y = 0.1;
        face.userData.noHit = true;
        head.add(face);
        P.faceMat = faceMat;
        P.eyes = d.eyes;
        // hair
        const cap = new THREE.Mesh(new THREE.SphereGeometry(d.style === 'bob' ? 0.168 : 0.16, 24, 14, 0, TAU, 0, Math.PI * (d.style === 'bob' ? 0.66 : 0.56)), hair);
        cap.position.set(0, 0.11, -0.012);
        cap.rotation.x = -0.32;
        if (d.style === 'bob') cap.scale.set(1.06, 1.05, 1.04);
        head.add(cap);
        for (let i = 0; i < 5; i++) {
            const bang = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 5), hair);
            bang.position.set(-0.09 + i * 0.045, 0.19, 0.125);
            bang.rotation.set(Math.PI + 0.35, 0, (i - 2) * 0.12);
            head.add(bang);
        }
        for (const s of [-1, 1]) {
            const lock = capsule(0.028, d.style === 'bob' ? 0.12 : 0.16, hair);
            lock.position.set(s * 0.14, 0.04, 0.05);
            head.add(lock);
        }
        const hangHair = (x, y, z, r, len, n, kind, mirror) => {
            const pivot = new THREE.Group();
            pivot.position.set(x, y, z);
            let parent = pivot;
            for (let i = 0; i < n; i++) {
                const seg = new THREE.Group();
                const m = capsule(r * (1 - i * 0.18), len / n, hair);
                m.position.y = -len / n / 2;
                seg.add(m);
                parent.add(seg);
                if (i > 0) seg.position.y = -len / n;
                P.sway.push({ obj: seg, kind, i, mirror });
                parent = seg;
            }
            head.add(pivot);
            return pivot;
        };
        if (d.style === 'twintails') {
            for (const s of [-1, 1]) {
                hangHair(s * 0.13, 0.17, -0.05, 0.05, 0.42, 3, 'tail', s);
                const tie = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), acc);
                tie.position.set(s * 0.13, 0.17, -0.05);
                head.add(tie);
            }
        } else if (d.style === 'ponytail') {
            hangHair(0, 0.2, -0.14, 0.055, 0.45, 3, 'tail', 0);
        } else if (d.style === 'long') {
            const p = hangHair(0, 0.12, -0.11, 0.08, 0.5, 2, 'long', 0);
            p.scale.set(1.9, 1, 0.55);
        } else if (d.style === 'bun') {
            const bun = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), hair);
            bun.position.set(0, 0.25, -0.08);
            head.add(bun);
            hangHair(0, 0.2, -0.13, 0.03, 0.16, 2, 'tail', 0);
        } else if (d.style === 'braid') {
            hangHair(0.11, 0.02, 0.02, 0.04, 0.36, 4, 'braid', 1);
        }
        // accessories
        if (d.acc === 'bow') {
            const bow = new THREE.Group();
            for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.09, 4), acc); w.rotation.z = s * Math.PI / 2; w.position.x = s * 0.045; bow.add(w); }
            bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), acc));
            bow.position.set(0.1, 0.23, 0.02);
            bow.rotation.z = -0.4;
            head.add(bow);
        } else if (d.acc === 'flower') {
            const fl = new THREE.Group();
            for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), acc); p.position.set(Math.cos(i / 5 * TAU) * 0.028, Math.sin(i / 5 * TAU) * 0.028, 0); fl.add(p); }
            fl.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M(0xfde047, 0.5)));
            fl.position.set(0.14, 0.15, 0.04);
            fl.rotation.y = 1.2;
            head.add(fl);
        } else if (d.acc === 'visor') {
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.158, 0.012, 6, 28), acc);
            band.rotation.x = Math.PI / 2 - 0.25;
            band.position.y = 0.17;
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 16, 1, false, -0.8, 1.6), M(0x0ea5e9, 0.4, { transparent: true, opacity: 0.8 }));
            brim.position.set(0, 0.19, 0.13);
            brim.rotation.x = 0.15;
            head.add(band, brim);
        } else if (d.acc === 'shades') {
            for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.04, 0.015), acc); l.position.set(s * 0.05, 0.27, 0.06); l.rotation.x = -0.6; head.add(l); }
        } else if (d.acc === 'hat') {
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.012, 24), acc);
            brim.position.y = 0.24;
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.1, 18), acc);
            crown.position.y = 0.29;
            const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.161, 0.161, 0.03, 18), M(0xf43f5e, 0.5));
            ribbon.position.y = 0.255;
            head.add(brim, crown, ribbon);
            P.sway.push({ obj: brim, kind: 'brim' });
        }
        const hit = [];
        root.traverse((m) => { if (m.isMesh && !m.userData.noHit) { m.castShadow = true; m.userData.hitbox = 'torso'; hit.push(m); } });
        return { root, body, parts: P, hit, mats };
    }

    function runPose(g, ph, amt, speed) {
        const P = g.parts;
        const s = Math.sin(ph);
        P.thighL.rotation.x = s * 0.8 * amt;
        P.thighR.rotation.x = -s * 0.8 * amt;
        P.kneeL.rotation.x = (0.25 + Math.max(0, -Math.sin(ph - 0.6)) * 1.15) * amt;
        P.kneeR.rotation.x = (0.25 + Math.max(0, Math.sin(ph - 0.6)) * 1.15) * amt;
        P.shL.rotation.set(-s * 0.7 * amt, 0, -0.22);
        P.shR.rotation.set(s * 0.7 * amt, 0, 0.22);
        P.elL.rotation.set(-1.25 * amt, 0, 0);
        P.elR.rotation.set(-1.25 * amt, 0, 0);
        P.hips.position.y = 0.86 + Math.abs(Math.cos(ph)) * 0.05 * amt;
        P.hips.rotation.y = s * 0.08 * amt;
        P.chest.rotation.set(0.1 * amt, -s * 0.18 * amt, 0);
        P.head.rotation.set(-0.08 * amt, s * 0.1 * amt, 0);
        swayHair(g, ph, amt, speed);
    }

    function swayHair(g, ph, amt, speed) {
        for (const sw of g.parts.sway) {
            const o = sw.obj;
            if (sw.kind === 'tail' || sw.kind === 'braid') {
                const back = sw.i === 0 ? 0.25 + speed * 0.05 : 0.12;
                o.rotation.x = back * amt + Math.sin(ph * 2 - 0.7 - (sw.i || 0) * 0.6) * 0.14 * amt;
                o.rotation.z = Math.sin(ph - 0.5 - (sw.i || 0) * 0.5) * 0.16 * (sw.mirror || 1);
            } else if (sw.kind === 'long') {
                o.rotation.x = (0.15 + speed * 0.03) * amt + Math.sin(ph * 2 - 0.8 - (sw.i || 0) * 0.5) * 0.08;
            } else if (sw.kind === 'skirt' || sw.kind === 'sarong') {
                o.rotation.x = Math.sin(ph * 2) * 0.07 * amt;
                o.rotation.z = Math.sin(ph) * 0.05 * amt;
                o.scale.set(1 + Math.sin(ph * 2) * 0.03 * amt, 1, 1);
            } else if (sw.kind === 'brim') {
                o.rotation.x = Math.sin(ph * 2) * 0.05 * amt;
            }
        }
    }

    function giggleSound(pitch) {
        for (let i = 0; i < 5; i++) {
            const f = (820 + (i % 2) * 140 - i * 30) * pitch;
            SFX.tone(f, f * 1.08, 0.08, 'sine', 0.07, i * 0.085);
            SFX.tone(f * 2, f * 2.1, 0.05, 'triangle', 0.02, i * 0.085);
        }
    }

    function heartBurst(S, pos, n = 7) {
        for (let i = 0; i < n; i++) {
            const h = heartSprite(0.16 + Math.random() * 0.12);
            h.position.copy(pos);
            S.add(h);
            const v = V((Math.random() - 0.5) * 1.6, 1.2 + Math.random() * 1.4, (Math.random() - 0.5) * 1.6);
            let t = 0;
            S.animate((dt) => {
                t += dt;
                h.position.addScaledVector(v, dt);
                v.multiplyScalar(1 - dt * 1.2);
                h.scale.setScalar(Math.max(0.001, h.scale.x * (t > 0.9 ? 0.9 : 1.0)));
                if (t > 1.4) { if (h.parent) h.parent.remove(h); return false; }
            });
        }
    }

    function spawnGirl(S, d, idx, x0, z0, speed, weave, ph0) {
        const g = beachGirl(d);
        const st = { ph: ph0, z: z0, x: x0, t: 0 };
        const pitch = 0.92 + (idx % 8) * 0.04;
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
                runPose(g, st.ph, 1, spd);
                if (st.z > -2.4 && t.phase !== 'out') {
                    MG.popup(t.root.position.clone().add(V(0, 2, 0)), d.name + ' ran past!', '#f9a8d4');
                    t.retire();
                }
            },
            onKill: (t) => {
                // move the model out of the target so the reaction can play
                const r = g.root;
                S.scene.attach(r);
                girlReaction(S, g, d, pitch, st.ph);
            }
        });
        tg.girl = d;
        return tg;
    }

    function girlReaction(S, g, d, pitch, ph) {
        const P = g.parts;
        const r = g.root;
        P.faceMat.map = animeFace(d.eyes, true);
        P.faceMat.needsUpdate = true;
        for (const m of g.mats) { m.emissive.setHex(0xff5fa8); m.emissiveIntensity = 0.0; }
        giggleSound(pitch);
        const headPos = new THREE.Vector3();
        P.head.getWorldPosition(headPos);
        heartBurst(S, headPos.add(V(0, 0.2, 0)), 8);
        const y0 = r.position.y;
        const side = r.position.x >= 0 ? 1 : -1;
        let t = 0, hearts = 0;
        S.animate((dt) => {
            t += dt;
            const glow = t < 0.25 ? t / 0.25 : Math.max(0, 1 - (t - 0.25) / 2.2);
            for (const m of g.mats) m.emissiveIntensity = 0.55 * glow + Math.max(0, Math.sin(t * 14)) * 0.12 * glow;
            if (t < 1.7) {
                // happy hop, hands to cheeks, giggling wiggle
                const hop = t < 0.55 ? Math.sin(t / 0.55 * Math.PI) * 0.32 : Math.abs(Math.sin(t * 9)) * 0.03;
                r.position.y = y0 + hop;
                P.thighL.rotation.x = lerp(P.thighL.rotation.x, t < 0.55 ? -0.3 : 0, 0.2);
                P.thighR.rotation.x = lerp(P.thighR.rotation.x, t < 0.55 ? 0.15 : 0, 0.2);
                P.kneeL.rotation.x = lerp(P.kneeL.rotation.x, t < 0.55 ? 0.9 : 0.05, 0.2);
                P.kneeR.rotation.x = lerp(P.kneeR.rotation.x, 0.05, 0.2);
                P.shL.rotation.set(-2.2, 0, 0.55);
                P.shR.rotation.set(-2.2, 0, -0.55);
                P.elL.rotation.set(-1.5, 0, 0);
                P.elR.rotation.set(-1.5, 0, 0);
                P.chest.rotation.set(-0.05, Math.sin(t * 22) * 0.07, Math.sin(t * 15) * 0.05);
                P.head.rotation.set(0.05, 0, 0.22 + Math.sin(t * 11) * 0.06);
                P.hips.position.y = 0.86;
                swayHair(g, t * 10, 0.6, 0);
                if (t > 0.5 && hearts < 3 && t > 0.5 + hearts * 0.35) {
                    hearts++;
                    const hp = new THREE.Vector3();
                    P.head.getWorldPosition(hp);
                    heartBurst(S, hp.add(V(0, 0.35, 0)), 2);
                }
            } else if (t < 3.4) {
                // wave goodbye and skip off to the side
                const k = t - 1.7;
                r.rotation.y = lerp(r.rotation.y, side * 1.3, Math.min(1, dt * 4));
                r.position.x += side * dt * 2.6 * Math.min(1, k * 2);
                r.position.y = y0 + Math.abs(Math.sin(k * 7)) * 0.12;
                runPose(g, k * 7, 0.55, 1);
                P.shR.rotation.set(0, 0, 2.7 + Math.sin(k * 14) * 0.3);
                P.elR.rotation.set(-0.3, 0, 0);
                P.head.rotation.set(0, -side * 0.8, 0.15);
                if (k > 1.2) r.scale.setScalar(Math.max(0.001, 1 - (k - 1.2) / 0.5));
            } else {
                if (r.parent) r.parent.remove(r);
                return false;
            }
        });
    }

    function beachBall() {
        const tex = L.canvasTex('beachball', 128, 64, (g, w, h) => {
            const cols = ['#ef4444', '#ffffff', '#3b82f6', '#ffffff', '#facc15', '#ffffff'];
            for (let i = 0; i < 6; i++) { g.fillStyle = cols[i]; g.fillRect(i * w / 6, 0, w / 6 + 1, h); }
        });
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 12), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }));
        m.castShadow = true;
        const grp = new THREE.Group();
        grp.add(m);
        return { mesh: grp, hitMeshes: [m], ball: m };
    }

    MG.register({
        id: 'sweetheart_shore', cat: 'target', order: 15,
        name: 'Sweetheart Shore', icon: '💖', accent: '#f472b6',
        tagline: 'The heart blaster. Spread the love.',
        desc: 'A sunny beach day, and your gun fires hearts. Eight friendly beachgoers, each with her own look, run up from the shoreline to say hi. Tag each one with a heart before she reaches the boardwalk. She lights up, giggles, waves and skips off. Bouncing beach balls are bonus points.',
        hudSub: 'Tag every runner with a heart before she reaches you',
        duration: 60, stars: [4000, 8500, 13500, 19000], standardWeapon: 'five_seven', tracerColor: 0xff5fa8, forgivingMisses: true,
        map: {
            atmosphere: { skyTop: 0x0284c7, skyBottom: 0xbae6fd, fogColor: 0xdbeafe, fogDensity: 0.004, sunColor: 0xfff7e0, sunIntensity: 2.0, sunPos: [30, 70, 40], hemiSky: 0xe0f2fe, hemiGround: 0xfde68a, hemiIntensity: 1.0 },
            boxes: [B(0, -0.5, -40, 200, 1, 200, 'desert_sand')],
            spawn: { x: 0, y: 0, z: 1.2, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 200, 0xf3dfb0, 0.002, 1);
            // ocean with rolling waves
            const sea = new THREE.Mesh(new THREE.PlaneGeometry(320, 160, 64, 24), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.92, flatShading: true }));
            sea.rotation.x = -Math.PI / 2;
            sea.position.set(0, 0.06, -142);
            S.add(sea);
            const base = sea.geometry.attributes.position.array.slice();
            const foam = new THREE.Mesh(new THREE.PlaneGeometry(320, 3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
            foam.rotation.x = -Math.PI / 2;
            foam.position.set(0, 0.08, -62.5);
            S.add(foam);
            const wet = new THREE.Mesh(new THREE.PlaneGeometry(320, 8), std(0xd6b98a, 0.5));
            wet.rotation.x = -Math.PI / 2;
            wet.position.set(0, 0.005, -60);
            S.add(wet);
            let wt = 0;
            S.animate((dt) => {
                wt += dt;
                const arr = sea.geometry.attributes.position.array;
                for (let i = 0; i < arr.length; i += 3) arr[i + 2] = Math.sin(base[i] * 0.08 + wt * 1.4) * 0.35 + Math.cos(base[i + 1] * 0.12 + wt) * 0.25;
                sea.geometry.attributes.position.needsUpdate = true;
                foam.position.z = -62.5 + Math.sin(wt * 0.8) * 1.2;
                foam.material.opacity = 0.5 + Math.sin(wt * 0.8) * 0.25;
            });
            // boardwalk deck the player stands on
            const plank = std(0xb08154, 0.85);
            const deck = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 5), plank);
            deck.position.set(0, -0.08, 1.5);
            deck.receiveShadow = true;
            S.add(deck);
            for (const x of [-3.9, 3.9]) for (const z of [-0.9, 3.9]) {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.16), plank);
                post.position.set(x, 0.55, z);
                S.add(post);
            }
            const rail = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.12), plank);
            rail.position.set(0, 1.05, -0.9);
            S.add(rail);
            S.collider(-4, 0, -1.0, 4, 1.1, -0.8);
            S.collider(-4.1, 0, -1.0, -3.8, 3, 4.2);
            S.collider(3.8, 0, -1.0, 4.1, 3, 4.2);
            S.collider(-4, 0, 3.9, 4, 3, 4.2);
            const sign = A.sign('♥ SWEETHEART SHORE ♥', 3.6, 0.55, { bg: '#fdf2f8', color: '#db2777', borderColor: '#f472b6', size: 0.5 });
            sign.position.set(0, 2.4, 4.0);
            sign.rotation.y = Math.PI;
            S.add(sign);
            // palms, umbrellas, towels, a volleyball net, lifeguard tower
            const rnd = L.mulberry32(214);
            for (let i = 0; i < 18; i++) {
                const p = A.palm(1.1 + rnd() * 0.5);
                const side = i % 2 ? 1 : -1;
                p.position.set(side * (19 + rnd() * 14), 0, 4 - i * 3.5);
                p.rotation.y = rnd() * TAU;
                S.add(p);
            }
            const umbCols = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#f472b6'];
            for (let i = 0; i < 9; i++) {
                const c = umbCols[i % umbCols.length];
                const tex = L.canvasTex('umb:' + c, 128, 16, (g, w, h) => { for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#ffffff' : c; g.fillRect(k * 16, 0, 16, h); } });
                const umb = new THREE.Group();
                const top = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 16, 1, true), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.7 }));
                top.position.y = 2.3;
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), std(0xe5e7eb, 0.4, 0.6));
                pole.position.y = 1.2;
                umb.add(top, pole);
                const side = i % 2 ? 1 : -1;
                umb.position.set(side * (17 + rnd() * 6), 0, -8 - i * 5);
                umb.rotation.z = (rnd() - 0.5) * 0.2;
                S.add(umb);
                const towel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 1.8), std(parseInt(umbCols[(i + 2) % 5].slice(1), 16), 0.9));
                towel.position.set(umb.position.x + side * 1.2, 0.012, umb.position.z + 0.5);
                towel.rotation.y = rnd();
                S.add(towel);
            }
            const net = new THREE.Mesh(new THREE.PlaneGeometry(7, 1, 14, 2), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
            net.position.set(-22, 1.9, -30);
            net.rotation.y = Math.PI / 2;
            S.add(net);
            for (const z of [-26.5, -33.5]) { const np = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6), std(0xe5e7eb, 0.4)); np.position.set(-22, 1.25, z); S.add(np); }
            const tower = new THREE.Group();
            const tp = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 2.4), std(0xf8fafc, 0.6));
            tp.position.y = 2.6;
            const hut = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 2), std(0xef4444, 0.6));
            hut.position.y = 3.45;
            const roofT = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.7, 4), std(0xf8fafc, 0.6));
            roofT.position.y = 4.55;
            roofT.rotation.y = Math.PI / 4;
            tower.add(tp, hut, roofT);
            for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.6, 0.15), std(0xf8fafc, 0.6)); l.position.set(x, 1.3, z); tower.add(l); }
            tower.position.set(24, 0, -22);
            S.add(tower);
            K.cloudLayer(S, 12, 70, 200);
            // seagulls
            for (let i = 0; i < 5; i++) {
                const gull = new THREE.Group();
                for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.18), std(0xf8fafc, 0.6)); w.position.x = s * 0.35; w.rotation.z = s * 0.3; gull.add(w); }
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
            let idx = 0;
            K.ramp(S, { from: 1.75, to: 0.6, start: 0.4, end: 55.5, jitter: 0.25 }, (at, k, rng) => {
                const d = GIRLS[idx % GIRLS.length];
                const i = idx++;
                const x0 = (rng() - 0.5) * 28;
                const z0 = -50 - rng() * 8;
                const speed = lerp(3.4, 6.6, k) * (0.9 + rng() * 0.25);
                const weave = (0.6 + rng() * 1.6) * (rng() < 0.5 ? -1 : 1);
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
                        pos: V(x0, 0.4, z), points: 75, bonus: true, life: 32 / Math.abs(sp), appear: 'scale', death: 'pop', deathColor: 0xfacc15,
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
            const h = heartSprite(0.22);
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
            if (r && info.pt) heartBurst(S, info.pt, 4);
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
