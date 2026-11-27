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

    function wallRun(S, axis, fixed, a1, a2, doors, mat, doorW = 2.8) {
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
                // Split north bookcase so the library -> study doorway (-12, -26) stays wide open (>= 2.8m)
                box(-4.2, 1.6, -5.6, 2.8, 3.2, 0.6, std(0x3f2a14, 0.8));
                box(4.2, 1.6, -5.6, 2.8, 3.2, 0.6, std(0x3f2a14, 0.8));
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
                // Split north counter so the kitchen -> bedroom doorway (+12, -26) stays wide open (>= 2.8m)
                box(-3.6, 0.5, -5.6, 3.2, 1.0, 0.8, std(0xd6d3d1, 0.4));
                box(3.6, 0.5, -5.6, 3.2, 1.0, 0.8, std(0xd6d3d1, 0.4));
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
        // crystal chandelier
        const ch = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 20), gold);
        ring.rotation.x = Math.PI / 2;
        ch.add(ring);
        const crystalMat = new THREE.MeshPhysicalMaterial({ color: 0xfffbeb, emissive: 0xfde68a, emissiveIntensity: 0.75, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.9 });
        for (let i = 0; i < 8; i++) {
            const a = i / 8 * TAU;
            const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), basic(0xfff3c4));
            b.position.set(Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55);
            const drop = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), crystalMat);
            drop.scale.set(0.7, 1.5, 0.7);
            drop.position.set(Math.cos(a) * 0.48, -0.14, Math.sin(a) * 0.48);
            ch.add(b, drop);
        }
        const centerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), crystalMat);
        centerGem.scale.set(0.8, 1.6, 0.8); centerGem.position.y = -0.22;
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), gold);
        chain.position.y = 0.3;
        ch.add(centerGem, chain);
        ch.position.set(cx, WALL_H - 0.7, cz);
        S.add(ch);
        if (BO.Settings.getQualityPreset().pointLights) {
            const pl = new THREE.PointLight(0xffe6b0, 1.4, 16, 1.4);
            pl.position.set(cx, WALL_H - 0.9, cz);
            S.add(pl);
        }
    }

    function hasLOS(from, to) {
        const dir = to.clone().sub(from);
        const dist = dir.length();
        if (dist < 0.12) return true;
        dir.normalize();
        const meshes = BO.World.worldMeshes;
        const rcF = new THREE.Raycaster(from, dir, 0.04, dist - 0.04);
        if (rcF.intersectObjects(meshes, false).length > 0) return false;
        const rcB = new THREE.Raycaster(to, dir.clone().negate(), 0.04, dist - 0.04);
        if (rcB.intersectObjects(meshes, false).length > 0) return false;
        return true;
    }

    function resolveRoomPos(room, x, z, radius = 0.48) {
        const [cx, cz] = room.c;
        let px = BO.Math.clamp(x, cx - 5.2, cx + 5.2);
        let pz = BO.Math.clamp(z, cz - 5.2, cz + 5.2);
        for (const f of room.furn || []) {
            const fx = cx + f.x, fz = cz + f.z;
            const hx = f.w * 0.5 + radius, hz = f.d * 0.5 + radius;
            const dx = px - fx, dz = pz - fz;
            if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
                const ox = hx - Math.abs(dx), oz = hz - Math.abs(dz);
                if (ox < oz) px += (dx >= 0 ? ox : -ox);
                else pz += (dz >= 0 ? oz : -oz);
            }
        }
        px = BO.Math.clamp(px, cx - 5.2, cx + 5.2);
        pz = BO.Math.clamp(pz, cz - 5.2, cz + 5.2);
        return [px, pz];
    }

    function pushDamageArc(fromPos) {
        const P = BO.Player;
        if (!P || !P.damageArcs) return;
        const dx = fromPos.x - P.pos.x, dz = fromPos.z - P.pos.z;
        const worldAngle = Math.atan2(dx, dz);
        P.damageArcs.push({ angle: BO.Math.wrapAngle(worldAngle - P.yaw + Math.PI), timer: 1.25 });
    }

    function spawnMuzzleBurst(S, pos, isBoss) {
        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(isBoss ? 0.18 : 0.13, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.95 })
        );
        flash.position.copy(pos);
        S.scene.add(flash);
        let pl = null;
        if (BO.Settings.getQualityPreset().pointLights) {
            pl = new THREE.PointLight(0xfbbf24, 3.2, 7.5, 1.8);
            pl.position.copy(pos);
            S.scene.add(pl);
        }
        let ft = 0;
        S.animate((dt) => {
            ft += dt;
            const k = Math.max(0, 1 - ft / 0.09);
            flash.scale.setScalar(0.6 + (1 - k) * 0.9);
            flash.material.opacity = k;
            if (pl) pl.intensity = 3.2 * k;
            if (ft >= 0.09) {
                if (flash.parent) flash.parent.remove(flash);
                if (pl && pl.parent) pl.parent.remove(pl);
                return false;
            }
        });
    }

    function crimFire(S, tg, gunPos) {
        const P = BO.Player;
        const cam = BO.App.worldCamera;
        const from = gunPos ? gunPos.clone() : new THREE.Vector3();
        if (!gunPos) {
            const gun = tg.fig.parts.gun;
            if (gun) gun.getWorldPosition(from); else tg.root.getWorldPosition(from).add(V(0, 1.5, 0));
        }
        const hit = Math.random() < (tg.boss ? 0.7 : 0.55);
        const to = cam.position.clone().add(hit ? V(0, -0.2, 0) : V((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2.4));
        spawnMuzzleBurst(S, from, tg.boss);
        BO.FX.spawnTracer(from, to, tg.boss ? 0xff2244 : 0xff6633, tg.boss ? 0.068 : 0.052, 0.20);
        BO.FX.spawnParticles(from, 6, 0xfbbf24, 3.5, 2, 0.14, 0.7);
        SFX.noise(0.12, 1100, 'bandpass', 0.8, 0.38);
        SFX.tone(150, 60, 0.12, 'triangle', 0.15);
        pushDamageArc(from);
        if (hit) {
            S.data.hp = Math.max(0, S.data.hp - (tg.boss ? 25 : 20));
            S.data.timesHit++;
            MG.flashScreen('rgba(220,38,38,0.38)');
            P.cameraShake = Math.max(P.cameraShake, 0.065);
            SFX.tone(90, 50, 0.2, 'sine', 0.3);
            if (S.data.hp <= 0) MG.finish('YOU WERE DOWNED', { color: '#f87171' });
        }
    }

    function applyCrouchPose(fig, crouchAmt) {
        const c = clamp01(crouchAmt);
        // Never sink underground! Keep body.position.y >= -0.12 and bend knees + lean torso instead.
        fig.body.position.y = -0.12 * c;
        fig.parts.legL.rotation.x = -0.44 * c;
        fig.parts.legR.rotation.x = 0.40 * c;
        fig.parts.chest.rotation.x = 0.24 * c;
    }

    function addCriminal(S, room, lx, lz, mode, rng) {
        const [cx, cz] = room.c;
        const boss = mode === 'boss';
        const BEHAVIORS = ['hiding', 'running', 'knife_rush', 'fleeing', 'prone', 'knee_slide'];
        const effMode = boss ? 'boss' : (mode === 'stand' ? BEHAVIORS[Math.floor(rng() * BEHAVIORS.length)] : mode);
        const pick = (a) => a[Math.floor(rng() * a.length) % a.length];
        const fig = F.human(boss
            ? { skin: pick(F.SKINS), coat: 0x111111, shirt: 0xf5f5f4, tie: 0x7f1d1d, pants: 0x111111, hair: 0x1c1917, glasses: 'shades', gun: 'pistol', eyes: 'angry', scale: 1.05 }
            : { skin: pick(F.SKINS), shirt: pick([0x1f2937, 0x27272a, 0x3f3f46, 0x14532d]), pants: pick([0x111827, 0x1c1917]), mask: pick([0x0a0a0a, 0x1f2937, 0x3f3f46]), vest: rng() < 0.4 ? 0x3f4a2a : null, gun: effMode === 'knife_rush' ? null : (effMode === 'shield' ? 'pistol' : pick(['rifle', 'pistol'])), eyes: 'angry' });
        if (effMode === 'knife_rush') {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.08), std(0xe2e8f0, 0.2, 0.9));
            blade.position.set(0, -0.72, 0.14);
            blade.rotation.x = Math.PI * 0.45;
            fig.parts.armR.add(blade);
        }
        // Offset shield criminal laterally (+0.34m) so head & gun peek legitimately past the hostage!
        if (effMode === 'shield') {
            fig.body.position.x = 0.34;
        }
        // Stun star ring shown when flashbanged
        const stunRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 16), basic(0xfacc15));
        stunRing.rotation.x = Math.PI / 2; stunRing.position.set(effMode === 'shield' ? 0.34 : 0, 2.02, 0);
        stunRing.visible = false; stunRing.userData.noHit = true;
        fig.root.add(stunRing);

        // Boss laser-glint telegraph beam
        let bossLaser = null;
        if (boss) {
            const lGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 6);
            lGeo.translate(0, 0.5, 0); lGeo.rotateX(Math.PI / 2);
            bossLaser = new THREE.Mesh(lGeo, new THREE.MeshBasicMaterial({ color: 0xff1133, transparent: true, opacity: 0.78 }));
            bossLaser.visible = false; bossLaser.userData.noHit = true;
            S.scene.add(bossLaser);
        }

        const [rx0, rz0] = resolveRoomPos(room, cx + lx, cz + lz, 0.5);
        const pos = V(rx0, 0, rz0);
        const face = A.yawTo(pos, V(cx, 0, cz + 6));
        const st = {
            mode: effMode, active: false, t: 0, react: lerp(0.8, 1.4, rng()) - (room.depth || 0) * 0.1,
            fire: 0, up: effMode !== 'cover', cycle: rng() * 2, orbitDir: rng() < 0.5 ? 1 : -1,
            crouch: effMode === 'cover' ? 1 : 0, stunTimer: 0, bossTele: 0
        };
        F.pose(fig, effMode === 'shield' ? 'shield' : 'idle');
        if (effMode === 'cover') applyCrouchPose(fig, 1);

        const tg = S.addTarget({
            mesh: fig.root, hitMeshes: fig.hit, pos, yaw: face, points: boss ? 600 : 250, hp: boss ? 3 : 1, life: 0,
            appear: 'none', inT: 0.01, death: 'knock', deathColor: 0x7f1d1d,
            onDamage: () => { SFX.thunk(); MG.toast('BOSS IS WEARING ARMOR', '#fca5a5'); },
            onTick: (t, dt) => {
                st.t += dt;
                if (st.stunTimer > 0) {
                    st.stunTimer -= dt;
                    stunRing.visible = true;
                    stunRing.rotation.z += dt * 7;
                    if (bossLaser) bossLaser.visible = false;
                    st.bossTele = 0;
                    applyCrouchPose(fig, 0.4);
                    F.pose(fig, 'handsUp', st.t * 2.5);
                    return;
                }
                stunRing.visible = false;

                if (st.mode === 'cover') {
                    if (!st.active) st.up = false;
                    else { st.cycle += dt; st.up = (st.cycle % 2.8) < 1.65; }
                    st.crouch = lerp(st.crouch, st.up ? 0 : 1, Math.min(1, dt * 10));
                    applyCrouchPose(fig, st.crouch);
                }
                if (!st.active) { if (!fig.armsBusy) F.walk(fig, st.t * 0.8, 0.05); return; }

                const cam = BO.App.worldCamera.position;
                const want = Math.atan2(cam.x - t.root.position.x, cam.z - t.root.position.z);
                if (st.mode === 'shield') {
                    const diff = wrapA(want - t.root.rotation.y);
                    const maxStep = 1.05 * dt;
                    t.root.rotation.y += BO.Math.clamp(diff, -maxStep, maxStep);
                } else {
                    t.root.rotation.y += wrapA(want - t.root.rotation.y) * Math.min(1, dt * 6);
                }

                const headPos = new THREE.Vector3();
                fig.parts.head.getWorldPosition(headPos);
                const gunPos = new THREE.Vector3();
                if (fig.parts.gun) fig.parts.gun.getWorldPosition(gunPos); else gunPos.copy(headPos);

                if (st.mode === 'running' || st.mode === 'knife_rush' || st.mode === 'fleeing' || st.mode === 'prone' || st.mode === 'knee_slide') {
                    const dx = cam.x - t.root.position.x, dz = cam.z - t.root.position.z;
                    const dist = Math.max(0.2, Math.hypot(dx, dz));
                    if (st.mode === 'knife_rush') {
                        const clearKnife = hasLOS(headPos, cam);
                        if (clearKnife) {
                            t.root.position.x += (dx / dist) * 3.1 * dt;
                            t.root.position.z += (dz / dist) * 3.1 * dt;
                            F.walk(fig, st.t * 11, 1, true);
                        } else {
                            t.root.position.x += st.orbitDir * (-dz / dist) * 1.4 * dt;
                            t.root.position.z += st.orbitDir * (dx / dist) * 1.4 * dt;
                            F.walk(fig, st.t * 5, 0.5, false);
                        }
                        F.pose(fig, 'aimOne', st.t);
                        if (dist < 2.2 && st.fire <= 0 && clearKnife && MG.state === 'running') {
                            st.fire = 1.1;
                            pushDamageArc(t.root.position);
                            S.data.hp = Math.max(0, S.data.hp - 18);
                            S.data.timesHit++;
                            MG.flashScreen('rgba(220,38,38,0.42)');
                            BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.06);
                            SFX.noise(0.10, 1800, 'bandpass', 1.0, 0.35);
                            if (S.data.hp <= 0) MG.finish('YOU WERE DOWNED', { color: '#f87171' });
                        }
                    } else if (st.mode === 'fleeing') {
                        t.root.position.x -= (dx / dist) * 2.7 * dt;
                        t.root.position.z -= (dz / dist) * 2.7 * dt;
                        F.walk(fig, st.t * 9, 1, true);
                    } else if (st.mode === 'prone') {
                        // Grounded tactical low-crouch / kneeling strafe-lean (head stays >= 1.1m, zero floor clipping!)
                        applyCrouchPose(fig, 0.92);
                        fig.body.rotation.x = 0.14;
                        fig.body.rotation.z = Math.sin(st.t * 1.6) * 0.12;
                        t.root.position.x += Math.cos(st.t * 1.1) * 1.2 * dt;
                        t.root.position.z += Math.sin(st.t * 1.1) * 1.2 * dt;
                    } else if (st.mode === 'knee_slide') {
                        const sliding = (st.t % 2.6) < 0.9;
                        st.crouch = lerp(st.crouch, sliding ? 1.0 : 0.0, Math.min(1, dt * 12));
                        applyCrouchPose(fig, st.crouch);
                        fig.body.rotation.x = lerp(fig.body.rotation.x, sliding ? -0.18 : 0, Math.min(1, dt * 12));
                        const sp = sliding ? 4.2 : 2.1;
                        t.root.position.x += st.orbitDir * (-dz / dist) * sp * dt;
                        t.root.position.z += st.orbitDir * (dx / dist) * sp * dt;
                        if (!sliding) F.walk(fig, st.t * 8, 1, true);
                    } else {
                        t.root.position.x += st.orbitDir * (-dz / dist) * 2.6 * dt;
                        t.root.position.z += st.orbitDir * (dx / dist) * 2.6 * dt;
                        F.walk(fig, st.t * 9, 1, true);
                    }
                    const [nx, nz] = resolveRoomPos(room, t.root.position.x, t.root.position.z, 0.48);
                    t.root.position.x = nx;
                    t.root.position.z = nz;
                } else if (st.mode === 'hiding') {
                    const dist = Math.hypot(cam.x - t.root.position.x, cam.z - t.root.position.z);
                    st.up = dist < 7.5 || (st.t % 3.2) > 1.6;
                    st.crouch = lerp(st.crouch, st.up ? 0 : 1, Math.min(1, dt * 10));
                    applyCrouchPose(fig, st.crouch);
                }

                if (st.t < st.react) return;
                if (st.mode !== 'shield' && st.mode !== 'knife_rush') F.pose(fig, 'aim', st.t);
                if (!st.up || st.mode === 'knife_rush') {
                    if (bossLaser) bossLaser.visible = false;
                    return;
                }

                // Boss directional laser-glint telegraph before shooting
                if (boss && bossLaser && st.bossTele > 0) {
                    st.bossTele -= dt;
                    if (hasLOS(headPos, cam) && hasLOS(gunPos, cam)) {
                        bossLaser.visible = true;
                        bossLaser.position.copy(gunPos);
                        bossLaser.lookAt(cam);
                        bossLaser.scale.set(1, 1, gunPos.distanceTo(cam));
                        bossLaser.material.opacity = st.bossTele < 0.18 ? 0.95 : 0.55;
                        if (st.bossTele <= 0 && MG.state === 'running') {
                            bossLaser.visible = false;
                            st.fire = 1.15;
                            crimFire(S, t, gunPos);
                        }
                    } else {
                        bossLaser.visible = false;
                        st.bossTele = 0;
                        st.fire = 0.35;
                    }
                    return;
                }

                st.fire -= dt;
                if (st.fire <= 0 && MG.state === 'running') {
                    if (hasLOS(headPos, cam) && hasLOS(gunPos, cam)) {
                        if (boss && bossLaser) {
                            st.bossTele = 0.45;
                            SFX.tone(1600, 2100, 0.08, 'sine', 0.07);
                        } else {
                            st.fire = 1.65;
                            crimFire(S, t, gunPos);
                        }
                    } else {
                        st.fire = 0.35;
                    }
                }
            },
            onKill: () => {
                if (bossLaser && bossLaser.parent) bossLaser.parent.remove(bossLaser);
                SFX.thunk();
                if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('overhaul/combat/MW2Hitmarker.mp3', { volume: 0.34, rateJitter: 0.06 });
                room.crimsLeft--;
                S.data.crimsLeft--;
                if (room.crimsLeft === 0) roomCleared(S, room);
            }
        });
        tg.fig = fig;
        tg.boss = boss;
        tg.stun = (dur) => { st.stunTimer = Math.max(st.stunTimer, dur); };
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
        const [rx, rz] = resolveRoomPos(room, x, z, 0.45);
        let tt = rng() * 5;
        const tg = S.addTarget({
            mesh: fig.root, hitMeshes: fig.hit, pos: V(rx, 0, rz), yaw, points: 0, penalty: 600, penaltyLabel: 'HOSTAGE!', life: 0,
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
        if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('overhaul/stingers/chime_positive.wav', { volume: 0.4, rateJitter: 0.05 });
        for (const h of room.hostages) {
            if (!h.alive) continue;
            h.saved = true;
            F.pose(h.fig, 'idle');
            h.fig.parts.armR.rotation.z = 2.6;
            S.data.saved++;
            const p = h.root.position.clone().add(V(0, 2.1, 0));
            S.award(300, p, 'SAVED', '#86efac');
            h.hitMeshes = [];
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
        desc: 'A crew has taken over a nine-room mansion, and every run is one of 15 different situations. Walk in through the front door and clear it room by room. Use [Q] Flashbang Breach (3 charges) to stun every criminal in a room without hurting hostages.',
        hudSub: 'Clear every room • [Q] Flashbang Breach • Criminals = masks • Hostages = hands up',
        heroLabel: 'TARGET PRACTICE • FREE ROAM • 3 MINUTES',
        duration: 180, stars: [3000, 5500, 8000, 10500], standardWeapon: 'mp5', forgivingMisses: true, customMusic: true,
        map: {
            atmosphere: { skyTop: 0x020617, skyBottom: 0x1e293b, fogColor: 0x111827, fogDensity: 0.012, sunColor: 0xc7d2fe, sunIntensity: 0.25, sunPos: [20, 60, 30], hemiSky: 0xfff1d6, hemiGround: 0x3b2f2a, hemiIntensity: 1.05, moon: true },
            skybox: 'skybox-night.png',
            boxes: [B(0, -0.5, -18, 90, 1, 90, 'concrete')],
            spawn: { x: 0, y: 0, z: 6, yaw: 0 }
        },
        keys: [['WASD', 'Move room to room'], ['LMB', 'Shoot'], ['Q', 'Flashbang Breach (3)'], ['R', 'Retry from results']],
        build(S) {
            if (BO.MinigameAudio) BO.MinigameAudio.start('contracts');
            Object.assign(S.data, { hp: 100, timesHit: 0, crimsLeft: 0, crimsTotal: 0, hostagesTotal: 0, hostagesHit: 0, saved: 0, roomsCleared: 0, flashes: 3 });
            K.groundPlane(S, 90, 0x1f3d1f, 0.002);
            const wallPbr = L.pbrMat('fantasy_painterly/Plaster Stucco/aged-limewash-001.png', 3, 1, { map: wallpaper(), roughness: 0.78, metalness: 0.04 });
            const outer = A.pbrMat('fantasy_painterly/Stone Masonry Ruins/ancient-courtyard-001.png', 4, 2, { color: 0xded7c8, roughness: 0.88 });
            const pbrFloorExtras = {
                marble: 'cyberpunk/Luxury Penthouses/white-synthetic-stone-slab-001.png',
                parquet: 'fantasy_painterly/Wood Bark Boards/light-pine-boards-001.png',
                tile: 'cyberpunk/Luxury Penthouses/high-gloss-black-tile-001.png'
            };
            // PBR hardwood/marble/carpet floors
            for (const room of ROOMS) {
                const tex = floorTex(room.floor).clone();
                tex.needsUpdate = true;
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(3, 3);
                tex.userData.mgOwned = true;
                const flMat = new THREE.MeshStandardMaterial({
                    map: tex,
                    bumpMap: pbrFloorExtras[room.floor] ? L.loadTex(pbrFloorExtras[room.floor], 3, 3) : tex,
                    bumpScale: 0.015,
                    roughness: room.floor === 'marble' ? 0.18 : room.floor === 'tile' ? 0.25 : room.floor === 'parquet' ? 0.42 : 0.86,
                    metalness: room.floor === 'marble' ? 0.12 : 0.04
                });
                const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), flMat);
                fl.rotation.x = -Math.PI / 2;
                fl.position.set(room.c[0], 0.012, room.c[1]);
                fl.receiveShadow = true;
                S.add(fl);
                S.solid(fl);
            }
            // walls
            for (const z of Object.keys(DOORS_Z)) wallRun(S, 'x', +z, -18, 18, DOORS_Z[z], +z === -2 || +z === -38 ? outer : wallPbr);
            for (const x of Object.keys(DOORS_X)) wallRun(S, 'z', +x, -38, -2, DOORS_X[x].map((d) => d), Math.abs(+x) === 18 ? outer : wallPbr);
            // ceiling + roof (no shadows, so the hemisphere light fills the rooms)
            const ceil = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), std(0xf5f0e6, 0.9));
            ceil.rotation.x = Math.PI / 2;
            ceil.position.set(0, WALL_H, -20);
            S.add(ceil);
            S.solid(ceil);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(27, 7, 4, 1), A.pbrMat('fantasy_painterly/Roofing Thatch/blue-slate-roof-001.png', 6, 4, { roughness: 0.78 }));
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
            const pPts = [];
            for (let lx = -4; lx <= 4; lx += 0.8) pPts.push(V(lx, 4.02, 1.22));
            const pBulbs = A.bulbs(pPts, [0xef4444, 0x3b82f6, 0xf8fafc], 0.07);
            S.add(pBulbs); A.animateBulbs(S, pBulbs, 6, 'chase');
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
            const cLight = BO.Settings.getQualityPreset().pointLights ? new THREE.PointLight(0xef4444, 1.6, 20, 1.4) : null;
            if (cLight) { cLight.position.set(-7, 2.5, 7); S.add(cLight); }
            S.collider(-8.6, 0, 4.6, -5.4, 2, 9.4);
            S.animate(() => {
                const on = Math.floor(performance.now() / 260) % 2;
                red.material = basic(on ? 0xef4444 : 0x450a0a);
                blue.material = basic(on ? 0x1e3a8a : 0x60a5fa);
                if (cLight) cLight.color.setHex(on ? 0xef4444 : 0x3b82f6);
            });
            for (let i = 0; i < 10; i++) {
                const hedge = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 1), std(0x14532d, 0.9));
                hedge.position.set((i < 5 ? -1 : 1) * (6 + (i % 5) * 3), 0.6, 0.8);
                S.add(hedge);
            }
            // 3D Mansion Estate Surroundings, SWAT Staging Gear & Interior Luxury Sculptures
            if (BO.Assets && BO.Assets.applySkybox) BO.Assets.applySkybox(S.scene, 'skybox-night.png');
            if (BO.Assets && BO.Assets.placeGLB) {
                BO.Assets.placeGLBInstanced(S.scene, 'pixel_fantasy/pixel-fantasy-standalone-lion-statue.glb', [
                    { pos: [-4.2, 0, 1.4], rot: 0, scale: 1.55 },
                    { pos: [4.2, 0, 1.4], rot: 0, scale: 1.55 }
                ]);
                BO.Assets.placeGLB(S.scene, 'mini_arena_kit/weapon-rack.glb', { pos: [-4.8, 0, 7.2], rot: 0.5, scale: 1.5 });
                BO.Assets.placeGLB(S.scene, 'blaster_kit/crate-wide.glb', { pos: [-9.4, 0, 6.4], rot: 0.35, scale: 1.6 });
                BO.Assets.placeGLBInstanced(S.scene, 'city_suburban_kit/building-type-l.glb', [
                    { pos: [-32, 0, -14], rot: Math.PI / 2, scale: 4.5 },
                    { pos: [32, 0, -14], rot: -Math.PI / 2, scale: 4.5 }
                ]);
                BO.Assets.placeGLBInstanced(S.scene, 'city_suburban_kit/tree-large.glb', [
                    { pos: [-22, 0, 6], scale: 2.8 }, { pos: [22, 0, 6], scale: 2.8 },
                    { pos: [-24, 0, -28], scale: 3.0 }, { pos: [24, 0, -28], scale: 3.0 }
                ]);
                BO.Assets.placeGLBInstanced(S.scene, 'building_kit/barricade-window-a.glb', [
                    { pos: [-12, 2.1, -1.82], scale: 1.15 }, { pos: [12, 2.1, -1.82], scale: 1.15 }
                ]);
                // Non-colliding interior luxury props on existing pedestals/tables
                BO.Assets.placeGLB(S.scene, 'mini_arena_kit/statue.glb', { pos: [-2, 1.1, -33], scale: 1.1 });
                BO.Assets.placeGLB(S.scene, 'mini_arena_kit/trophy.glb', { pos: [2, 1.1, -33], scale: 1.05 });
                BO.Assets.placeGLB(S.scene, 'mini_dungeon_kit/chest.glb', { pos: [12, 1.0, -13.5], rot: Math.PI, scale: 0.95 });
                BO.Assets.placeGLB(S.scene, 'graveyard_kit/candle-multiple.glb', { pos: [12, 0.82, -9.2], scale: 1.15 });
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
        onKey(S, code) {
            if (code === 'KeyQ' && MG.state === 'running') {
                if (S.data.flashes <= 0) {
                    SFX.buzzer();
                    MG.toast('NO FLASHBANGS LEFT', '#fca5a5');
                    return true;
                }
                S.data.flashes--;
                const P = BO.Player;
                const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
                const fPos = V(
                    BO.Math.clamp(P.pos.x + fwd.x * 3.4, -17.2, 17.2),
                    1.2,
                    BO.Math.clamp(P.pos.z + fwd.z * 3.4, -37.2, -2.5)
                );
                MG.flashScreen('rgba(255,255,255,0.62)');
                BO.FX.spawnParticles(fPos, 24, 0xffffff, 6.5, 4, 0.35, 1.3);
                SFX.noise(0.18, 1800, 'bandpass', 0.65, 0.45);
                SFX.tone(3100, 2600, 0.55, 'sine', 0.08);
                if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('sfx/Impact Sounds (Kenney)/Audio/impactGlass_heavy_002.ogg', { volume: 0.42, rateJitter: 0.06 });
                if (BO.Settings.getQualityPreset().pointLights) {
                    const fLight = new THREE.PointLight(0xffffff, 7.5, 18, 1.4);
                    fLight.position.copy(fPos);
                    S.scene.add(fLight);
                    let ft = 0;
                    S.animate((dt) => {
                        ft += dt;
                        fLight.intensity = Math.max(0, 7.5 * (1 - ft / 0.45));
                        if (ft >= 0.45) { if (fLight.parent) fLight.parent.remove(fLight); return false; }
                    });
                }
                let stunned = 0;
                for (const room of S.data.rooms || []) {
                    const [cx, cz] = room.c;
                    const playerInRoom = Math.abs(P.pos.x - cx) < 6.4 && Math.abs(P.pos.z - cz) < 6.4;
                    const bangInRoom = Math.abs(fPos.x - cx) < 6.2 && Math.abs(fPos.z - cz) < 6.2;
                    if (!playerInRoom && !bangInRoom) continue;
                    if (!room.entered) {
                        room.entered = true;
                        for (const c of room.crims) if (c.alive) c.activate();
                    }
                    for (const c of room.crims) {
                        if (!c.alive) continue;
                        if (c.root.position.distanceTo(fPos) < 11.5) {
                            c.stun(4.5);
                            stunned++;
                        }
                    }
                }
                if (stunned > 0) {
                    S.award(stunned * 75, fPos, `FLASHBANG STUN ×${stunned}!`, '#fde047');
                    MG.toast(`FLASHBANGED ${stunned} SUSPECT${stunned > 1 ? 'S' : ''}!`, '#fde047');
                } else {
                    MG.toast('FLASHBANG DETONATED', '#e2e8f0');
                }
                return true;
            }
            return false;
        },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); },
        update(S, dt, lib, state) {
            if (BO.MinigameAudio) BO.MinigameAudio.tick(dt, { urgent: S.data.crimsLeft > 0 && S.data.rooms.some((r) => r.entered && r.crimsLeft > 0) });
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
                // shields keep their hostage pinned in front while criminal peeks laterally (+0.34m)
                for (const c of room.crims) {
                    if (!c.shieldHost || !c.alive || !c.shieldHost.alive) continue;
                    const yaw = c.root.rotation.y;
                    const [hx, hz] = resolveRoomPos(room, c.root.position.x + Math.sin(yaw) * 0.52, c.root.position.z + Math.cos(yaw) * 0.52, 0.38);
                    c.shieldHost.root.position.set(hx, 0, hz);
                    c.shieldHost.root.rotation.y = yaw;
                }
            }
        },
        hud(S) {
            const hp = S.data.hp;
            const p = BO.Player.pos;
            const gridIds = ['study', 'gallery', 'bedroom', 'library', 'hall', 'kitchen', 'living', 'foyer', 'dining'];
            const byId = {};
            for (const r of S.data.rooms || []) byId[r.id] = r;
            const radarCells = gridIds.map((id) => {
                const r = byId[id];
                if (!r) return '<span></span>';
                const here = Math.abs(p.x - r.c[0]) < 6.0 && Math.abs(p.z - r.c[1]) < 6.0;
                const clear = r.crimsLeft === 0;
                const bg = clear ? 'rgba(34,197,94,0.45)' : r.entered ? 'rgba(239,68,68,0.68)' : 'rgba(51,65,85,0.65)';
                const bd = here ? '#fde047' : clear ? '#4ade80' : r.entered ? '#f87171' : 'rgba(148,163,184,0.35)';
                return `<span style="width:12px;height:12px;border-radius:2px;background:${bg};border:1.5px solid ${bd};display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:900">${here ? '•' : (r.entered && r.crimsLeft > 0 ? r.crimsLeft : '')}</span>`;
            }).join('');
            return `<div class="mgx-raid">
                <div class="mgx-hp"><small>HEALTH</small><div class="mgx-hp-bar"><i style="width:${hp}%;background:${hp > 50 ? '#22c55e' : hp > 25 ? '#f59e0b' : '#ef4444'}"></i></div><b>${hp}</b></div>
                <div class="mgx-chip">CRIMINALS <b>${S.data.crimsLeft}</b></div>
                <div class="mgx-chip">ROOMS <b>${S.data.roomsCleared} / ${S.data.roomsToClear}</b></div>
                <div class="mgx-chip ${S.data.flashes > 0 ? 'mgx-hot' : ''}">[Q] FLASH <b>${S.data.flashes}</b></div>
                <div class="mgx-chip" title="Tactical Room Radar" style="padding:3px 6px"><div style="display:grid;grid-template-columns:repeat(3,12px);gap:2px">${radarCells}</div></div>
                ${S.data.hostagesHit ? `<div class="mgx-chip mgx-bad">HOSTAGES HIT <b>${S.data.hostagesHit}</b></div>` : ''}
            </div>`;
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
    function spawnSurfSplash(S, x, z) {
        for (let i = 0; i < 10; i++) {
            const drop = new THREE.Mesh(
                new THREE.SphereGeometry(0.09 + Math.random() * 0.08, 6, 5),
                new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffffff : 0xa5f3fc, transparent: true, opacity: 0.9 })
            );
            drop.position.set(x + (Math.random() - 0.5) * 0.8, 0.12, z + (Math.random() - 0.5) * 0.6);
            S.scene.add(drop);
            const vx = (Math.random() - 0.5) * 2.8, vy = 2.4 + Math.random() * 2.4, vz = 0.8 + Math.random() * 1.6;
            let lt = 0;
            S.animate((dt) => {
                lt += dt;
                drop.position.x += vx * dt;
                drop.position.y += (vy - 9.8 * lt) * dt;
                drop.position.z += vz * dt;
                drop.material.opacity = Math.max(0, 0.9 * (1 - lt / 0.65));
                if (lt >= 0.65 || drop.position.y < 0.02) {
                    if (drop.parent) drop.parent.remove(drop);
                    return false;
                }
            });
        }
    }

    function knockOffCoverUp(S, ent, pt) {
        const gRef = ent.gRef;
        if (!gRef || gRef.armorRemoved) return;
        gRef.armorRemoved = true;
        ent.dazzled = true;
        const armor = gRef.parts.topArmor;
        const meta = gRef.parts.topArmorMeta;
        const wp = new THREE.Vector3(), wq = new THREE.Quaternion(), ws = new THREE.Vector3();
        if (armor) {
            armor.getWorldPosition(wp);
            armor.getWorldQuaternion(wq);
            armor.getWorldScale(ws);
            armor.visible = false;
        } else {
            wp.copy(ent.root.position).add(V(0, 1.25, 0));
            ws.set(1, 1, 1);
        }
        // Spawn billowing static cover-up cloth + silk confetti + golden sparkles!
        if (meta && meta.geo && meta.mat) {
            const flyCloth = new THREE.Mesh(meta.geo, meta.mat);
            flyCloth.position.copy(wp); flyCloth.quaternion.copy(wq); flyCloth.scale.copy(ws);
            flyCloth.userData.noHit = true;
            S.scene.add(flyCloth);
            const cam = BO.App && BO.App.worldCamera;
            const away = wp.clone().sub(cam ? cam.position : V(0, 1.5, 2));
            away.y = 0; if (away.lengthSq() < 0.01) away.set(0, 0, -1); away.normalize();
            const vel = away.multiplyScalar(5.4 + Math.random() * 2.0).add(V((Math.random() - 0.5) * 3.2, 5.6 + Math.random() * 1.8, 0));
            const spin = V((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10);
            let lt = 0, bounces = 0;
            S.animate((dt) => {
                lt += dt;
                vel.y -= 14 * dt;
                flyCloth.position.addScaledVector(vel, dt);
                flyCloth.rotation.x += spin.x * dt;
                flyCloth.rotation.y += spin.y * dt;
                flyCloth.rotation.z += spin.z * dt;
                flyCloth.scale.x = ws.x * (1 + Math.sin(lt * 16) * 0.12);
                if (flyCloth.position.y <= 0.12) {
                    flyCloth.position.y = 0.12;
                    if (bounces < 2) { vel.y = Math.abs(vel.y) * 0.34; vel.x *= 0.5; vel.z *= 0.5; spin.multiplyScalar(0.45); bounces++; }
                    else { vel.set(0, 0, 0); spin.set(0, 0, 0); }
                }
                if (lt > 3.5) { if (flyCloth.parent) flyCloth.parent.remove(flyCloth); return false; }
            });
        }
        // Pink-gold dazzled aura ring around her feet
        const aura = new THREE.Mesh(
            new THREE.TorusGeometry(0.45, 0.035, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.85 })
        );
        aura.rotation.x = Math.PI / 2; aura.position.y = 0.06; aura.userData.noHit = true;
        ent.root.add(aura);
        let at = 0;
        S.animate((dt) => {
            at += dt;
            if (!ent.alive) { if (aura.parent) aura.parent.remove(aura); return false; }
            aura.rotation.z += dt * 4;
            const sc = 1 + Math.sin(at * 8) * 0.14;
            aura.scale.set(sc, sc, 1);
        });
        // Billowing cloth confetti ribbons & golden sparkles
        for (let ci = 0; ci < 12; ci++) {
            const conf = new THREE.Mesh(
                new THREE.PlaneGeometry(0.14, 0.08),
                new THREE.MeshBasicMaterial({ color: ci % 2 ? 0xfde047 : 0xf472b6, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
            );
            conf.position.copy(wp).add(V(0, 1.15, 0));
            S.scene.add(conf);
            const cv = V((Math.random() - 0.5) * 4.5, 2.2 + Math.random() * 2.8, (Math.random() - 0.5) * 4.5);
            let ct = 0;
            S.animate((dt) => {
                ct += dt;
                conf.position.addScaledVector(cv, dt);
                cv.y -= 5.2 * dt;
                cv.multiplyScalar(1 - dt * 1.4);
                conf.rotation.x += dt * 9; conf.rotation.y += dt * 7;
                conf.material.opacity = Math.max(0, 1 - ct / 1.4);
                if (ct >= 1.4) { if (conf.parent) conf.parent.remove(conf); return false; }
            });
        }
        BO.FX.spawnParticles(pt || wp.clone().add(V(0, 1.1, 0)), 22, 0xfde047, 5.5, 5, 0.55, 1.2);
    }

    function spawnGirl(S, d, idx, x0, z0, speed, weave, ph0) {
        const BA = BO.BeachArt;
        const g = BA.buildGirl(d);
        const st = { ph: ph0, z: z0, x: x0, t: 0 };
        const pitch = 0.90 + (idx % 10) * 0.035;
        if (z0 < -51) spawnSurfSplash(S, x0, Math.max(z0, -56));
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
        tg.gRef = g;
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
        desc: 'A sunlit tropical paradise where your gun fires hearts. Ten uniquely sculpted PS5-grade anime beachgoers with couture cover-ups run up from the Gerstner-wave surf. Knock off cover-ups with [2] Deagle for 2.5x Dazzled Bonus, unleash [RMB] Heart Shockwave, and build combo for 2x Heart Fever Overdrive!',
        hudSub: '[1] Heart Blaster • [2] Deagle (2.5x Dazzled) • [RMB] Heart Shockwave',
        duration: 60, stars: [4500, 9500, 15500, 22000], standardWeapon: 'five_seven', secondaryWeapon: 'deagle',
        weaponLabel: 'FIVE-SEVEN (HEARTS) • [2] DEAGLE (2.5x DAZZLED)', tracerColor: 0xff5fa8, forgivingMisses: true, customMusic: true,
        keys: [['LMB', 'Fire Hearts / Deagle'], ['RMB', 'Heart Shockwave'], ['1 / 2', 'Switch Blaster / Deagle']],
        map: {
            atmosphere: {
                skyTop: 0x0369a1, skyBottom: 0x7dd3fc, fogColor: 0xbae6fd, fogDensity: 0.0022,
                sunColor: 0xfff4d6, sunIntensity: 1.45, sunPos: [32, 44, 38],
                hemiSky: 0xbae6fd, hemiGround: 0xd4a36a, hemiIntensity: 0.56
            },
            skybox: 'skybox-day.png',
            boxes: [B(0, -0.5, -40, 220, 1, 220, 'desert_sand')],
            spawn: { x: 0, y: 0, z: 1.2, yaw: 0 }
        },
        build(S) {
            if (BO.MinigameAudio) {
                BO.MinigameAudio.start('pinball');
                S.animate((dt) => BO.MinigameAudio.tick(dt));
            }
            if (BO.Assets && BO.Assets.applySkybox) BO.Assets.applySkybox(S.scene, 'skybox-day.png');
            if (BO.Assets && BO.Assets.placeGLB) {
                BO.Assets.placeGLBInstanced(S.scene, 'pixel_fantasy/pixel-fantasy-canvas-market-stall.glb', [
                    { pos: [-19.5, 0, -4.5], rot: Math.PI / 2 - 0.25, scale: 1.85 },
                    { pos: [19.5, 0, -4.5], rot: -Math.PI / 2 + 0.25, scale: 1.85 }
                ]);
                BO.Assets.placeGLBInstanced(S.scene, 'city_suburban_kit/building-type-s.glb', [
                    { pos: [-34, 0, -18], rot: Math.PI / 2, scale: 4.4 },
                    { pos: [34, 0, -18], rot: -Math.PI / 2, scale: 4.4 }
                ]);
                BO.Assets.placeGLB(S.scene, 'pixel_fantasy/pixel-fantasy-treasure-chest.glb', { pos: [-3.2, 0.02, 2.8], rot: 0.4, scale: 1.15 });
                BO.Assets.placeGLB(S.scene, 'pixel_fantasy/pixel-fantasy-wooden-barrel.glb', { pos: [3.3, 0.02, 2.8], scale: 1.2 });
                BO.Assets.placeGLB(S.scene, 'blaster_kit/blaster-b.glb', { pos: [-3.2, 0.92, -0.92], rot: [0, 0.35, Math.PI / 2], fitSize: [0.55, 0.25, 0.18] });
            }
            Object.assign(S.data, { feverCharge: 0, feverTimer: 0, shockCD: 0, _prevAds: false, dazzledCount: 0 });

            // Glowing boardwalk string lanterns + warm flickering tiki torches
            const tikiPts = [];
            for (let tx = -12; tx <= 12; tx += 1.6) tikiPts.push(V(tx, 3.2, -2.2));
            const tb = A.bulbs(tikiPts, [0xfde047, 0xf472b6, 0x38bdf8, 0xfb923c], 0.10);
            S.add(tb); A.animateBulbs(S, tb, 5, 'chase');
            for (const [tx, tz] of [[-5.4, -1.6], [5.4, -1.6], [-8.8, -6.5], [8.8, -6.5]]) {
                S.add(A.torch(S, V(tx, 0, tz), 0xfb923c, true));
            }

            // Studio 3-point tropical beauty lighting
            const frontBeautyKey = new THREE.DirectionalLight(0xfff5e0, 0.32);
            frontBeautyKey.position.set(16, 22, 36);
            const oceanRim = new THREE.DirectionalLight(0x67e8f9, 0.62);
            oceanRim.position.set(-8, 16, -58);
            const peachFill = new THREE.DirectionalLight(0xffd8c8, 0.26);
            peachFill.position.set(-24, 10, 22);
            S.add(frontBeautyKey, oceanRim, peachFill);

            // Rich warm golden beach sand
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

            // Custom GLSL Gerstner-Wave Water Shader (Schlick Fresnel, depth gradient, foam crests, sun glitter path)
            const waterUniforms = {
                uTime: { value: 0 },
                uSunDir: { value: new THREE.Vector3(0.22, 0.26, -0.94).normalize() },
                uShallow: { value: new THREE.Color(0x67e8f9) },
                uMid: { value: new THREE.Color(0x06b6d4) },
                uDeep: { value: new THREE.Color(0x0369a1) },
                uSkyTop: { value: new THREE.Color(0x38bdf8) },
                uSkyHorizon: { value: new THREE.Color(0xfef3c7) }
            };
            const seaMat = new THREE.ShaderMaterial({
                uniforms: waterUniforms,
                transparent: true,
                vertexShader: `
                    uniform float uTime;
                    varying vec3 vWorldPos;
                    varying vec3 vWorldNormal;
                    varying float vCrest;
                    varying float vShore;
                    vec3 gerstner(vec2 pos, vec2 dir, float steep, float wl, float spd, inout vec3 tangent, inout vec3 binormal) {
                        float k = 6.2831853 / wl;
                        float c = sqrt(9.8 / k) * spd;
                        vec2 d = normalize(dir);
                        float f = k * (dot(d, pos) - c * uTime);
                        float a = steep / k;
                        tangent += vec3(-d.x * d.x * (steep * sin(f)), d.x * (steep * cos(f)), -d.x * d.y * (steep * sin(f)));
                        binormal += vec3(-d.x * d.y * (steep * sin(f)), d.y * (steep * cos(f)), -d.y * d.y * (steep * sin(f)));
                        return vec3(d.x * (a * cos(f)), a * sin(f), d.y * (a * cos(f)));
                    }
                    void main() {
                        vec4 wp = modelMatrix * vec4(position, 1.0);
                        vec3 t = vec3(1.0, 0.0, 0.0);
                        vec3 b = vec3(0.0, 0.0, 1.0);
                        vec3 disp = vec3(0.0);
                        disp += gerstner(wp.xz, vec2(0.18, 0.98), 0.18, 16.0, 1.15, t, b);
                        disp += gerstner(wp.xz, vec2(-0.36, 0.93), 0.14, 10.5, 1.35, t, b);
                        disp += gerstner(wp.xz, vec2(0.55, 0.83), 0.10, 6.2, 1.55, t, b);
                        disp += gerstner(wp.xz, vec2(-0.72, 0.69), 0.07, 3.8, 1.80, t, b);
                        wp.xyz += disp;
                        vWorldPos = wp.xyz;
                        vWorldNormal = normalize(cross(b, t));
                        vCrest = clamp(disp.y * 1.4, 0.0, 1.0);
                        vShore = clamp((-wp.z - 61.0) / 85.0, 0.0, 1.0);
                        gl_Position = projectionMatrix * viewMatrix * wp;
                    }
                `,
                fragmentShader: `
                    uniform float uTime;
                    uniform vec3 uSunDir;
                    uniform vec3 uShallow;
                    uniform vec3 uMid;
                    uniform vec3 uDeep;
                    uniform vec3 uSkyTop;
                    uniform vec3 uSkyHorizon;
                    varying vec3 vWorldPos;
                    varying vec3 vWorldNormal;
                    varying float vCrest;
                    varying float vShore;
                    void main() {
                        vec3 N = normalize(vWorldNormal);
                        vec3 V = normalize(cameraPosition - vWorldPos);
                        float ndv = clamp(dot(N, V), 0.0, 1.0);
                        float fresnel = 0.02 + 0.98 * pow(1.0 - ndv, 4.5);
                        vec3 waterCol = mix(uShallow, uMid, smoothstep(0.0, 0.35, vShore));
                        waterCol = mix(waterCol, uDeep, smoothstep(0.35, 0.95, vShore));
                        vec3 R = reflect(-V, N);
                        vec3 skyRefl = mix(uSkyHorizon, uSkyTop, clamp(R.y * 1.6, 0.0, 1.0));
                        vec3 col = mix(waterCol, skyRefl, fresnel * 0.78);
                        float spec = pow(max(dot(R, uSunDir), 0.0), 180.0);
                        float shimmer = pow(max(dot(R, uSunDir), 0.0), 22.0) * 0.24;
                        col += vec3(1.0, 0.94, 0.76) * (spec * 1.85 + shimmer);
                        float shoreFoam = (1.0 - smoothstep(0.0, 0.085, vShore)) * (0.65 + 0.35 * sin(vWorldPos.x * 0.45 + uTime * 3.2));
                        float crestFoam = smoothstep(0.54, 0.92, vCrest) * 0.65;
                        float foam = clamp(shoreFoam + crestFoam, 0.0, 1.0);
                        col = mix(col, vec3(0.96, 0.99, 1.0), foam * 0.85);
                        float alpha = mix(0.76, 0.97, smoothstep(0.0, 0.14, vShore) + foam * 0.25);
                        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
                    }
                `
            });
            const sea = new THREE.Mesh(new THREE.PlaneGeometry(360, 175, 110, 64), seaMat);
            sea.rotation.x = -Math.PI / 2;
            sea.position.set(0, 0.12, -148.5);
            S.add(sea);

            const wet = new THREE.Mesh(new THREE.PlaneGeometry(340, 10.5), new THREE.MeshStandardMaterial({ color: 0xc49e68, roughness: 0.16, metalness: 0.16 }));
            wet.rotation.x = -Math.PI / 2; wet.position.set(0, 0.008, -59.5);
            S.add(wet);

            // Sculpted Volcanic Tropical Islands with sandy coves & twin-hull Luxury Catamarans
            const islands = [[-74, -162, 24, 15], [70, -172, 30, 18], [-16, -190, 18, 10]];
            for (const [ix, iz, ir, ih] of islands) {
                const islGeo = new THREE.ConeGeometry(ir, ih, 24, 5);
                const ip = islGeo.attributes.position;
                for (let k = 0; k < ip.count; k++) {
                    const px = ip.getX(k), py = ip.getY(k), pz = ip.getZ(k);
                    const ang = Math.atan2(pz, px);
                    const ridge = 1 + Math.sin(ang * 3 + ix) * 0.22 + Math.cos(ang * 5) * 0.10;
                    ip.setX(k, px * ridge); ip.setZ(k, pz * ridge);
                    if (py > ih * 0.35) ip.setY(k, py * 0.86); // volcanic caldera plateau
                }
                islGeo.computeVertexNormals();
                const isl = new THREE.Mesh(islGeo, std(0x166534, 0.88));
                isl.position.set(ix, ih * 0.42, iz);
                const beachRing = new THREE.Mesh(new THREE.CylinderGeometry(ir * 0.95, ir * 1.12, 1.3, 22), std(0xf3dfb0, 0.9));
                beachRing.position.set(ix, 0.45, iz);
                S.add(isl, beachRing);
            }
            const boats = [];
            for (const [bx, bz, col] of [[-34, -118, 0xf43f5e], [44, -132, 0xfacc15]]) {
                const bt = new THREE.Group();
                const hullMat = std(0xf8fafc, 0.3, 0.15);
                for (const hx of [-0.75, 0.75]) {
                    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 5.2), hullMat);
                    hull.position.set(hx, 0.32, 0);
                    bt.add(hull);
                }
                const deckBridge = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.28, 3.0), std(0xe2e8f0, 0.4));
                deckBridge.position.set(0, 0.64, -0.2);
                const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.8), std(0x0f172a, 0.15, 0.8));
                cabin.position.set(0, 0.98, -0.2);
                const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 5.4, 8), std(0x94a3b8, 0.35, 0.7));
                mast.position.y = 3.2;
                const mainSail = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.6, 3), std(col, 0.55));
                mainSail.position.set(0, 3.2, 0.55); mainSail.scale.set(0.10, 1, 1);
                const jibSail = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.6, 3), std(0xffffff, 0.55));
                jibSail.position.set(0, 2.7, -0.95); jibSail.scale.set(0.08, 1, 1);
                bt.add(deckBridge, cabin, mast, mainSail, jibSail);
                bt.position.set(bx, 0.1, bz);
                bt.rotation.y = bx < 0 ? 0.52 : -0.62;
                S.add(bt);
                boats.push({ obj: bt, x0: bx, z0: bz });
            }

            const palms = [];
            const umbrellas = [];
            let buoyMesh = null;
            let wt = 0;
            S.animate((dt) => {
                wt += dt;
                waterUniforms.uTime.value = wt;
                for (let i = 0; i < boats.length; i++) {
                    boats[i].obj.position.y = 0.18 + Math.sin(wt * 1.35 + i * 2) * 0.22;
                    boats[i].obj.rotation.z = Math.sin(wt * 1.15 + i) * 0.065;
                }
                const sunSc = 44 + Math.sin(wt * 0.8) * 1.8;
                sunSpr.scale.set(sunSc, sunSc, 1);
                for (let pi = 0; pi < palms.length; pi++) {
                    const fronds = palms[pi].userData.fronds;
                    if (!fronds) continue;
                    for (let fi = 0; fi < fronds.length; fi++) {
                        const fr = fronds[fi];
                        fr.rotation.z = fr.userData.baseZ + Math.sin(wt * 1.9 + pi * 0.7 + fi * 0.55) * 0.065;
                        fr.rotation.x = Math.cos(wt * 1.4 + pi + fi * 0.4) * 0.035;
                    }
                }
                for (let ui = 0; ui < umbrellas.length; ui++) {
                    const u = umbrellas[ui];
                    u.obj.rotation.z = u.baseZ + Math.sin(wt * 1.6 + ui * 1.1) * 0.028;
                }
                if (buoyMesh) buoyMesh.rotation.z = Math.sin(wt * 2.1) * 0.09;
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
                palms.push(p);
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
                umbrellas.push({ obj: umb, baseZ: umb.rotation.z });
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
            buoyMesh = buoy;
            tower.add(tp, hut, win, roofT, buoy);
            for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.16), std(0xf8fafc, 0.6)); l.position.set(x, 1.3, z); tower.add(l); }
            tower.position.set(24, 0, -22);
            S.add(tower);

            K.cloudLayer(S, 12, 70, 200);
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
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            if (S.data.feverTimer > 0) {
                S.data.feverTimer = Math.max(0, S.data.feverTimer - dt);
                if (S.data.feverTimer === 0) MG.toast('HEART FEVER ENDED', '#f9a8d4');
            }
            if (S.data.shockCD > 0) S.data.shockCD = Math.max(0, S.data.shockCD - dt);
            const P = BO.Player;
            if (P) {
                const pressedRmb = P.adsHeld && !S.data._prevAds;
                S.data._prevAds = !!P.adsHeld;
                if (pressedRmb && S.data.shockCD <= 0) {
                    S.data.shockCD = 10.0;
                    const origin = P.pos.clone().add(V(0, 0.35, -1.2));
                    const wave = new THREE.Mesh(
                        new THREE.TorusGeometry(1, 0.08, 10, 40),
                        new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.92 })
                    );
                    wave.rotation.x = Math.PI / 2;
                    wave.position.copy(origin);
                    S.scene.add(wave);
                    SFX.whoosh(0.32); SFX.ding(1.65);
                    BO.BeachArt.heartBurst(S, origin.clone().add(V(0, 1.0, -2.0)), 14);
                    MG.flashScreen('rgba(244,114,182,0.28)');
                    let wt = 0;
                    S.animate((dt2) => {
                        wt += dt2;
                        const rad = 0.8 + wt * 28;
                        wave.scale.set(rad, rad, 1);
                        wave.material.opacity = Math.max(0, 0.92 * (1 - wt / 0.85));
                        if (wt >= 0.85) { if (wave.parent) wave.parent.remove(wave); return false; }
                    });
                    let affected = 0;
                    for (const tg of S.targets) {
                        if (!tg.alive || !tg.girl) continue;
                        if (tg.root.position.distanceTo(origin) < 26) {
                            if (tg.gRef && !tg.gRef.armorRemoved) {
                                knockOffCoverUp(S, tg, tg.root.position.clone().add(V(0, 1.2, 0)));
                                S.data.dazzledCount++;
                                affected++;
                            } else {
                                affected++;
                                S.kills++;
                                S.bumpCombo();
                                const fMult = S.data.feverTimer > 0 ? 2 : 1;
                                const dMult = tg.dazzled ? 2.5 : 1;
                                S.award(tg.points * S.comboMult * fMult * dMult, tg.root.position.clone().add(V(0, 2.1, 0)), 'SHOCKWAVE ♥', '#f472b6');
                                tg.kill({ pt: tg.root.position.clone().add(V(0, 1.2, 0)) });
                            }
                        }
                    }
                    if (affected > 0) MG.toast(`HEART SHOCKWAVE! ${affected} DAZZLED!`, '#fde047');
                }
            }
        },
        schedule(S) {
            const GIRLS = BO.BeachArt.GIRLS;
            let idx = 0;
            K.ramp(S, { from: 1.75, to: 0.6, start: 0.4, end: 55.5, jitter: 0.25 }, (at, k, rng) => {
                const d = GIRLS[idx % GIRLS.length];
                const i = idx++;
                const x0 = (rng() - 0.5) * 26;
                const z0 = -50 - rng() * 8;
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
                        onKill: () => {
                            SFX.pop();
                            S2.data.balls = (S2.data.balls || 0) + 1;
                            if (S2.data.feverTimer <= 0) S2.data.feverCharge = Math.min(100, (S2.data.feverCharge || 0) + 8);
                        }
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
            const h = BO.BeachArt.heartSprite(S.data.feverTimer > 0 ? 0.34 : 0.24);
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
            const addFever = (amt) => {
                if (S.data.feverTimer > 0) return;
                S.data.feverCharge = Math.min(100, (S.data.feverCharge || 0) + amt);
                if (S.data.feverCharge >= 100) {
                    S.data.feverCharge = 0;
                    S.data.feverTimer = 8.0;
                    SFX.fanfare();
                    MG.flashScreen('rgba(244,114,182,0.34)');
                    MG.toast('HEART FEVER OVERDRIVE! 2× SCORE!', '#fde047');
                }
            };
            if (ent.girl) {
                S.hits++;
                const feverMult = S.data.feverTimer > 0 ? 2 : 1;
                if (BO.Player && BO.Player.activeSlot === 1 && ent.gRef && !ent.gRef.armorRemoved) {
                    knockOffCoverUp(S, ent, info.pt);
                    S.data.dazzledCount++;
                    S.bumpCombo();
                    addFever(15);
                    S.award(120 * 2.5 * S.comboMult * feverMult, ent.root.position.clone().add(V(0, 1.9, 0)), '2.5× DAZZLED BONUS!', '#fde047');
                    SFX.pop(); SFX.ding(1.5);
                    if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('overhaul/stingers/chime_positive.wav', { volume: 0.42, rateJitter: 0.06 });
                    return true;
                }
                S.kills++;
                S.bumpCombo();
                addFever(16);
                const mult = S.comboMult * feverMult * (ent.dazzled ? 2.5 : 1);
                const tagLbl = ent.girl.name + ' ♥' + (ent.dazzled ? ' 2.5× DAZZLED!' : '') + (feverMult > 1 ? ' FEVER!' : (S.comboMult > 1 ? ' x' + S.comboMult.toFixed(1).replace('.0', '') : ''));
                S.award(ent.points * mult, ent.root.position.clone().add(V(0, 2.1, 0)), tagLbl, ent.dazzled ? '#fde047' : '#f9a8d4');
                SFX.ding(1.3);
                if (BO.Assets && BO.Assets.playClip) BO.Assets.playClip('overhaul/env/coin_collect.wav', { volume: 0.34, rateJitter: 0.07 });
                ent.kill(info);
                return true;
            }
            const r = S.hitTarget(ent, info);
            if (r && info.pt) BO.BeachArt.heartBurst(S, info.pt, 5);
            return r;
        },
        hud(S) {
            const feverOn = S.data.feverTimer > 0;
            const pct = feverOn ? Math.round((S.data.feverTimer / 8.0) * 100) : Math.round(S.data.feverCharge || 0);
            const cd = Math.ceil(S.data.shockCD || 0);
            return `<div class="mgx-raid">
                <div class="mgx-hp" style="border-color:${feverOn ? '#fde047' : 'rgba(244,114,182,0.5)'}">
                    <small>${feverOn ? 'HEART FEVER 2×' : 'FEVER'}</small>
                    <div class="mgx-hp-bar"><i style="width:${pct}%;background:${feverOn ? 'linear-gradient(90deg,#fde047,#f472b6)' : '#f472b6'}"></i></div>
                    <b>${feverOn ? S.data.feverTimer.toFixed(1) + 's' : pct + '%'}</b>
                </div>
                <div class="mgx-chip ${cd === 0 ? 'mgx-hot' : ''}">[RMB] SHOCKWAVE <b>${cd === 0 ? 'READY' : cd + 's'}</b></div>
                <div class="mgx-chip">DAZZLED <b>${S.data.dazzledCount || 0}</b></div>
            </div>`;
        },
        result(S) {
            const stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: stars >= 4 ? 'HEARTTHROB' : stars === 3 ? 'SWEETHEART' : stars === 2 ? 'CHARMER' : stars === 1 ? 'FRIENDLY' : 'SHY',
                stats: [
                    ['HEARTS LANDED', S.kills + ' / ' + S.spawned], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—'],
                    ['BEST STREAK', S.maxCombo], ['DAZZLED (2.5x)', S.data.dazzledCount || 0], ['RAN PAST', S.expired], ['BEACH BALLS', S.data.balls || 0]
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(120 + S.score * 0.06 + stars * 150)
            };
        },
        dispose() { if (BO.MinigameAudio) BO.MinigameAudio.stop(); }
    });
})(window);
