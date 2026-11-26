/* ============================================================================
   BLACKOUT OPS — MINIGAMES: FUN SECTION (Part 1: 1–3)
     1. Angry Birds   — contained slingshot deck launching Angry Birds at fortresses
     2. Master Zombie — siege a detailed multi-zone Human Fortress (strict LOS, sniper tower, kiting AI)
     3. Snowboarding  — 5-minute mountain run with unavoidable -> tight-avoid obstacles + Zombie Chasers
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

    /* =====================================================================
       1. ANGRY BIRDS FPS — Contained Slingshot Deck + Piggy Fortresses
    ===================================================================== */
    const BIRD_KINDS = [
        { name: 'RED', col: 0xef4444, belly: 0xfef3c7, r: 0.36, spd: 34, rad: 3.1, blast: 0, msg: 'RED STRIKE!' },
        { name: 'CHUCK (TURBO)', col: 0xfacc15, belly: 0xfef9c3, r: 0.34, spd: 50, rad: 2.9, blast: 0, msg: 'TURBO CHUCK!' },
        { name: 'BOMB (TNT)', col: 0x18181b, belly: 0x6b7280, r: 0.43, spd: 29, rad: 6.4, blast: 1, msg: 'BOOM!' }
    ];

    function buildBirdMesh(col, bellyCol, r, enemy, isKing = false) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), std(col, 0.42));
        const belly = new THREE.Mesh(new THREE.SphereGeometry(r * 0.72, 10, 8), std(bellyCol, 0.5));
        belly.position.set(0, -r * 0.25, r * 0.25);
        g.add(body, belly);
        for (const s of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(r * 0.23, 8, 6), basic(0xffffff));
            eye.position.set(s * r * 0.34, r * 0.18, r * 0.78);
            const pup = new THREE.Mesh(new THREE.SphereGeometry(r * 0.11, 6, 6), basic(0x09090b));
            pup.position.set(s * r * 0.34, r * 0.18, r * 0.94);
            const brow = new THREE.Mesh(new THREE.BoxGeometry(r * 0.36, r * 0.08, r * 0.08), basic(enemy ? 0x166534 : 0x18181b));
            brow.position.set(s * r * 0.34, r * 0.40, r * 0.88);
            brow.rotation.z = s * (enemy ? -0.25 : 0.32);
            g.add(eye, pup, brow);
            if (enemy) {
                const ear = new THREE.Mesh(new THREE.SphereGeometry(r * 0.18, 8, 6), std(col, 0.5));
                ear.position.set(s * r * 0.72, r * 0.65, 0);
                g.add(ear);
            }
        }
        if (enemy) {
            const snout = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.32, r * 0.36, r * 0.26, 12), std(0x86efac, 0.5));
            snout.rotation.x = Math.PI / 2; snout.position.set(0, -r * 0.02, r * 0.96);
            g.add(snout);
            if (isKing) {
                const crown = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.32, r * 0.42, 8), std(0xfacc15, 0.25, 0.7));
                crown.position.set(0, r * 1.15, 0);
                g.add(crown);
            }
        } else {
            const beak = new THREE.Mesh(new THREE.ConeGeometry(r * 0.26, r * 0.5, 8), std(0xf97316, 0.4));
            beak.rotation.x = Math.PI / 2; beak.position.set(0, -r * 0.04, r * 0.95);
            const crest = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.12, r * 0.28, 4, 8), std(col, 0.5));
            crest.position.set(0, r * 0.98, 0);
            g.add(beak, crest);
        }
        return { g, body };
    }

    MG.register({
        id: 'fun_angry_birds', cat: 'fun', order: 1, name: 'Angry Birds FPS', icon: '🐦', accent: '#ef4444', badge: 'SLINGSHOT',
        tagline: 'Fenced Slingshot Deck! Fire Red, Chuck & Bomb Birds to smash fortresses!',
        desc: 'Take command inside the timber Slingshot Perch overlooking four pig-bird fortresses! Switch manually with [1-3] or auto-cycle between Red, Turbo Chuck, and Explosive Bomb birds, aim carefully from inside your firing bay, and topple wood, stone, and ice towers!',
        heroLabel: 'FUN • SLINGSHOT DESTRUCTION', duration: 90, stars: [2200, 4800, 8000, 12000],
        standardWeapon: 'm1911', lockWeapon: true, blockFire: true, weaponLabel: 'ANGRY BIRD SLINGSHOT', weaponNote: 'LMB fire • [1] Red • [2] Chuck • [3] Bomb',
        keys: [['LMB', 'Launch Bird'], ['1 / 2 / 3', 'Pick Bird Type'], ['WASD', 'Move on Firing Deck']],
        map: {
            atmosphere: { skyTop: 0x0284c7, skyBottom: 0xbae6fd, fogColor: 0xbae6fd, fogDensity: 0.0028, sunColor: 0xfff7e6, sunIntensity: 1.7, sunPos: [40, 70, 30], hemiSky: 0xe0f2fe, hemiGround: 0x3f6212, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, -20, 180, 1, 180, 'nuketown_grass')],
            spawn: { x: 0, y: 0.35, z: 4.5, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 180, 0x4d7c0f, 0.002);
            K.cloudLayer(S, 10, 32, 160);
            const rnd = L.mulberry32(710);
            for (let i = 0; i < 36; i++) {
                const tr = A.tree(1.4 + rnd() * 0.8, i % 3 ? 0x166534 : 0x15803d);
                const side = i % 2 ? 1 : -1;
                tr.position.set(side * (21 + rnd() * 24), 0, 8 - i * 2.2);
                S.add(tr);
            }
            for (const [hx, hz, hr] of [[-28, -58, 18], [26, -64, 22], [0, -72, 26]]) {
                const hill = new THREE.Mesh(new THREE.SphereGeometry(hr, 18, 10), std(0x3f6212, 0.95));
                hill.scale.y = 0.35; hill.position.set(hx, 0, hz); S.add(hill);
            }

            // CONTAINED SLINGSHOT FIRING DECK (player stays strictly inside [-4.8..4.8, 2.0..6.8])
            const woodDeckM = std(0x78350f, 0.85), trimM = std(0x451a03, 0.8), slingshotM = std(0x92400e, 0.72);
            const deck = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.6, 5.8), woodDeckM);
            deck.position.set(0, 0.05, 4.5); deck.receiveShadow = true; S.add(deck);
            const rug = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 4.4), std(0x7f1d1d, 0.9));
            rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.36, 4.5); S.add(rug);
            for (const [x1, z1, x2, z2, h] of [[-5.1, 1.6, 5.1, 1.85, 0.95], [-5.1, 7.1, 5.1, 7.35, 1.35], [-5.2, 1.6, -4.95, 7.35, 1.35], [4.95, 1.6, 5.2, 7.35, 1.35]]) {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x2 - x1), h, Math.abs(z2 - z1)), trimM);
                rail.position.set((x1 + x2) / 2, 0.35 + h / 2, (z1 + z2) / 2); S.add(rail);
                S.collider(x1, 0, z1, x2, 4, z2);
            }
            // Twin Giant Slingshot Y-Forks at deck front corners + Overhead Chasing Marquee
            for (const s of [-1, 1]) {
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 3.8, 10), slingshotM);
                post.position.set(s * 4.5, 2.1, 1.8);
                const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.5, 8), slingshotM);
                fork.position.set(s * 4.9, 4.2, 1.8); fork.rotation.z = -s * 0.45;
                const band = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6), std(0x1f2937, 0.6));
                band.rotation.z = Math.PI / 2; band.position.set(s * 3.1, 3.8, 1.8);
                S.add(post, fork, band);
            }
            const sign = A.sign('ANGRY BIRDS SLINGSHOT', 7.2, 1.05, { bg: '#450a0a', color: '#fde047', borderColor: '#facc15', size: 0.55, glow: '#f97316' });
            sign.position.set(0, 4.95, 1.75); S.add(sign);
            const mbPts = [];
            for (let i = 0; i <= 22; i++) { const x = -3.7 + (i / 22) * 7.4; mbPts.push(V(x, 5.55, 1.82), V(x, 4.35, 1.82)); }
            const bulbs = A.bulbs(mbPts, [0xfacc15, 0xef4444, 0xffffff], 0.06);
            S.add(bulbs); A.animateBulbs(S, bulbs, 8, 'chase');

            // Decorative reserve bird perch crate on left of deck
            for (let b = 0; b < 3; b++) {
                const disp = buildBirdMesh(BIRD_KINDS[b].col, BIRD_KINDS[b].belly, 0.26, false);
                disp.g.position.set(-4.1 + b * 0.75, 1.38, 2.1); S.add(disp.g);
            }

            const woodM = std(0x92400e, 0.8), stoneM = std(0x64748b, 0.85), glassM = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.58, roughness: 0.1 });
            S.data.blocks = [];
            S.data.foes = [];
            S.data.projectiles = [];
            S.data.birdIdx = 0;
            S.data.fireCd = 0;

            const addBlock = (x, y, z, w, h, d, kind) => {
                const mat = kind === 'stone' ? stoneM : kind === 'glass' ? glassM : woodM;
                const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
                m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
                S.add(m);
                S.data.blocks.push({ mesh: m, w, h, d, hp: kind === 'stone' ? 3 : kind === 'wood' ? 2 : 1, vy: 0, vx: 0, vz: 0, falling: false, floorY: y });
            };
            const addEnemyBird = (x, y, z, pts = 350, king = false) => {
                const bm = buildBirdMesh(0x4ade80, 0xbef264, king ? 0.58 : 0.45, true, king);
                bm.g.position.set(x, y, z);
                S.add(bm.g);
                S.data.foes.push({ mesh: bm.g, basePos: V(x, y, z), vx: 0, vy: 0, vz: 0, fallen: false, dead: false, pts, bobPh: Math.random() * 6 });
            };

            const forts = [
                { cx: -11, cz: -19, rows: 2, label: 'PIG OUTPOST' },
                { cx: 0, cz: -26, rows: 3, label: 'CENTRAL TOWER' },
                { cx: 11, cz: -20, rows: 2, label: 'EAST KEEP' },
                { cx: 0, cz: -40, rows: 4, label: 'KING PIG CITADEL' }
            ];
            for (const f of forts) {
                const plat = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.6, 4.8), std(0x44403c, 0.9));
                plat.position.set(f.cx, 0.3, f.cz); S.add(plat);
                const fSign = A.sign(f.label, 4.6, 0.65, { bg: '#14532d', color: '#bef264', borderColor: '#4ade80', size: 0.45 });
                fSign.position.set(f.cx, 0.45, f.cz + 2.45); S.add(fSign);
                for (let r = 0; r < f.rows; r++) {
                    const py = 1.65 + r * 2.2;
                    addBlock(f.cx - 2.1, py, f.cz, 0.55, 2.0, 2.6, r === 0 ? 'stone' : 'wood');
                    addBlock(f.cx + 2.1, py, f.cz, 0.55, 2.0, 2.6, r === 0 ? 'stone' : 'wood');
                    addBlock(f.cx, py + 1.15, f.cz, 5.2, 0.36, 2.8, r % 2 ? 'glass' : 'wood');
                    addEnemyBird(f.cx + (r % 2 ? -0.8 : 0.8), py - 0.5, f.cz, 350 + r * 120, false);
                }
                addEnemyBird(f.cx, 1.05 + f.rows * 2.2 + 0.55, f.cz, 750, f.rows >= 4);
            }
            S.data.totalFoes = S.data.foes.length;
            S.data.knocked = 0;
        },
        onKey(S, code) {
            if (MG.state !== 'running') return false;
            if (code === 'Digit1') { S.data.birdIdx = 0; SFX.clack(); return true; }
            if (code === 'Digit2') { S.data.birdIdx = 1; SFX.clack(); return true; }
            if (code === 'Digit3') { S.data.birdIdx = 2; SFX.clack(); return true; }
            return false;
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            // Strictly contain player inside the Slingshot Deck!
            P.pos.x = BO.Math.clamp(P.pos.x, -4.45, 4.45);
            P.pos.z = BO.Math.clamp(P.pos.z, 2.15, 6.75);
            if (P.pos.y < 0.35) P.pos.y = 0.35;

            if (D.fireCd > 0) D.fireCd -= dt;
            if (state !== 'running') return;

            if (P.triggerHeld && !D._latch && D.fireCd <= 0) {
                D._latch = true; D.fireCd = 0.28;
                const kind = BIRD_KINDS[D.birdIdx % BIRD_KINDS.length];
                D.birdIdx++;
                const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
                const bm = buildBirdMesh(kind.col, kind.belly, kind.r, false);
                bm.g.position.copy(cam.position).addScaledVector(dir, 1.0); S.add(bm.g);
                D.projectiles.push({ mesh: bm.g, vel: dir.multiplyScalar(kind.spd).add(V(0, 2.4, 0)), kind, life: 4.5 });
                SFX.launch(); SFX.tone(540, 880, 0.14, 'triangle', 0.14);
                S.shots++;
            } else if (!P.triggerHeld) D._latch = false;

            const detonate = (pos, rad, blast, col) => {
                BO.FX.spawnParticles(pos, blast ? 28 : 14, col, 6, 4, 0.65, 1.4);
                if (blast) { BO.FX.spawnExplosion(pos, rad, 0xf97316); SFX.rumble(0.55); P.cameraShake = Math.max(P.cameraShake, 0.045); }
                else SFX.bonk();
                for (const b of D.blocks) {
                    const d = b.mesh.position.distanceTo(pos);
                    if (d < rad) {
                        const out = b.mesh.position.clone().sub(pos).normalize();
                        b.vx += out.x * (6.5 + (rad - d) * 2.5);
                        b.vy += 4.5 + (rad - d) * 1.4;
                        b.vz += out.z * (6.5 + (rad - d) * 2.5);
                        b.falling = true; b.hp -= blast ? 3 : 1;
                    }
                }
                for (const f of D.foes) {
                    if (f.dead) continue;
                    if (f.mesh.position.distanceTo(pos) < rad + 0.7) {
                        const out = f.mesh.position.clone().sub(pos).normalize();
                        f.vx += out.x * 9; f.vy += 7; f.vz += out.z * 9; f.fallen = true;
                        S.shotHits++; S.hits++;
                    }
                }
            };

            for (let i = D.projectiles.length - 1; i >= 0; i--) {
                const pr = D.projectiles[i];
                pr.life -= dt; pr.vel.y -= 14.5 * dt;
                pr.mesh.position.addScaledVector(pr.vel, dt);
                pr.mesh.rotation.x += dt * 7;
                if (Math.random() < 0.45) BO.FX.spawnParticles(pr.mesh.position, 1, pr.kind.col, 1, 0.5, 0.25, 0.6);
                let hit = pr.mesh.position.y <= 0.35;
                if (!hit) for (const b of D.blocks) { const p = b.mesh.position; if (Math.abs(pr.mesh.position.x - p.x) < b.w * 0.5 + 0.4 && Math.abs(pr.mesh.position.y - p.y) < b.h * 0.5 + 0.4 && Math.abs(pr.mesh.position.z - p.z) < b.d * 0.5 + 0.4) { hit = true; break; } }
                if (!hit) for (const f of D.foes) { if (!f.dead && pr.mesh.position.distanceTo(f.mesh.position) < 0.9) { hit = true; break; } }
                if (hit || pr.life <= 0) {
                    detonate(pr.mesh.position.clone(), pr.kind.rad, pr.kind.blast, pr.kind.col);
                    S.scene.remove(pr.mesh); D.projectiles.splice(i, 1);
                }
            }
            for (let i = D.blocks.length - 1; i >= 0; i--) {
                const b = D.blocks[i];
                if (!b.falling) continue;
                b.vy -= 18 * dt;
                b.mesh.position.x += b.vx * dt; b.mesh.position.y += b.vy * dt; b.mesh.position.z += b.vz * dt;
                b.mesh.rotation.x += b.vz * dt * 0.6; b.mesh.rotation.z -= b.vx * dt * 0.6;
                if (b.hp <= 0 || b.mesh.position.y < -1) {
                    S.award(40, b.mesh.position.clone(), null); S.scene.remove(b.mesh); D.blocks.splice(i, 1);
                } else if (b.mesh.position.y < b.h * 0.5) {
                    b.mesh.position.y = b.h * 0.5; b.vy = 0; b.vx *= 0.6; b.vz *= 0.6;
                }
            }
            for (const f of D.foes) {
                if (f.dead) continue;
                if (!f.fallen) {
                    f.mesh.position.y = f.basePos.y + Math.abs(Math.sin(S.t * 3 + f.bobPh)) * 0.08;
                    if (f.basePos.y > 1.2) {
                        const hasSup = D.blocks.some((b) => Math.abs(b.mesh.position.x - f.mesh.position.x) < 2.8 && Math.abs(b.mesh.position.z - f.mesh.position.z) < 2.5 && b.mesh.position.y < f.mesh.position.y);
                        if (!hasSup) f.fallen = true;
                    }
                }
                if (f.fallen) {
                    f.vy -= 18 * dt;
                    f.mesh.position.x += f.vx * dt; f.mesh.position.y += f.vy * dt; f.mesh.position.z += f.vz * dt;
                    f.mesh.rotation.z += dt * 7;
                    if (f.mesh.position.y <= 0.7 || Math.hypot(f.mesh.position.x - f.basePos.x, f.mesh.position.z - f.basePos.z) > 2.2) {
                        f.dead = true; D.knocked++; S.kills++; S.bumpCombo();
                        S.award(f.pts * S.comboMult, f.mesh.position.clone().add(V(0, 1.2, 0)), 'PIG DOWN!', '#4ade80');
                        BO.FX.spawnParticles(f.mesh.position, 18, 0x4ade80, 4.5, 3, 0.55, 1.2);
                        SFX.pop(); S.scene.remove(f.mesh);
                    }
                }
            }
            if (D.knocked >= D.totalFoes) MG.finish('ALL ENEMY PIGS TOPPLED!', { color: '#86efac' });
        },
        hud(S) {
            const nxt = BIRD_KINDS[S.data.birdIdx % BIRD_KINDS.length];
            return `<div class="fun-panel"><div class="mgx-chip">SLINGSHOT BIRD <b style="color:#${nxt.col.toString(16).padStart(6, '0')}">${nxt.name}</b></div><div class="mgx-chip">PIGS LEFT <b>${S.data.totalFoes - S.data.knocked} / ${S.data.totalFoes}</b></div></div>`;
        }
    });

    /* =====================================================================
       2. MASTER ZOMBIE — Multi-Zone Bastion Fortress + Strict LOS + Player-Like AI
    ===================================================================== */
    const HUMAN_SPECS = [
        { name: 'SGT. VANCE (HEAVY)', hp: 3120, coat: 0x1e293b, hat: 'helmet', gun: 'rifle', rof: 0.22, magMax: 60, dmg: 16, y: 0, role: 'heavy', wps: [[-3.5, -14], [3.5, -14], [0, -18], [-6, -24]] },
        { name: 'AGENT KESTREL (TOWER SNIPER)', hp: 2160, coat: 0x064e3b, hat: 'cap', gun: 'rifle', rof: 1.25, magMax: 10, dmg: 44, y: 4.3, role: 'sniper', wps: [[10.5, -24], [13.5, -24], [12, -26.5]] },
        { name: 'BREACHER COLE (SHOTGUN)', hp: 2640, coat: 0x7f1d1d, hat: 'beanie', gun: 'rifle', rof: 0.85, magMax: 12, dmg: 30, y: 0, role: 'shotgun', wps: [[-12, -17], [-10, -25], [-4, -27], [-13, -29]] },
        { name: 'MEDIC REED (SUPPORT)', hp: 2320, coat: 0xf8fafc, hat: 'cap', gun: 'pistol', rof: 0.48, magMax: 24, dmg: 18, y: 0, medic: true, role: 'medic', wps: [[2, -26], [-2, -29], [5, -28], [0, -22]] }
    ];

    const LOS_RAY = new THREE.Raycaster();
    function hasLOS(from, to, losMeshes) {
        const dir = to.clone().sub(from);
        const dist = dir.length();
        if (dist < 0.4) return true;
        dir.divideScalar(dist);
        LOS_RAY.set(from, dir);
        LOS_RAY.near = 0.25;
        LOS_RAY.far = Math.max(0.3, dist - 0.35);
        return LOS_RAY.intersectObjects(losMeshes, false).length === 0;
    }

    MG.register({
        id: 'fun_master_zombie', cat: 'fun', order: 2, name: 'Master Zombie', icon: '👑', accent: '#22c55e', badge: 'SIEGE',
        tagline: 'Siege a Fortress! 4x HP, 2x DMG Defenders with Full Loadouts & Grenades. Doubled Cooldowns!',
        desc: 'You are the Master Zombie attacking a heavily fortified Human Bastion! All 4 defenders have 4x HP, 2x damage, and full custom loadouts (LMG + Frags, Sniper + Concussion, Shotgun Spread + Incendiary, Medic + Smoke). All player cooldowns are doubled and special moves start on cooldown!',
        heroLabel: 'FUN • FORTRESS SIEGE COMMANDER', duration: 300, stars: [2500, 6000, 10500, 16000],
        standardWeapon: 'm1911', lockWeapon: true, blockFire: true, hideViewmodel: true, weaponNote: 'Master Zombie Horde Abilities (Specials start on cooldown!)',
        keys: [['LMB', 'Acid Shot (2s)'], ['RMB / V', 'Claw Swipe (1.1s)'], ['1', '5 Zombies (30s)'], ['2', 'Uncommon (30s)'], ['3', '+50% Speed (80s)'], ['4 / Q', 'Epic Boss Ult']],
        guide: {
            objective: 'Eliminate all 4 elite Human Bastion defenders inside Fortress Omega while managing doubled cooldown timers.',
            tips: [
                'Special abilities [1], [2], [3], and Ult [4/Q] start ON COOLDOWN at match start—open with Acid [LMB] and Claws [RMB/V] from cover!',
                'Defenders obey strict wall Line-of-Sight: use wrecked cars, perimeter walls, and bunkers to avoid Kestrel the Tower Sniper.',
                'Focus down Medic Reed first inside the northwest Med Bay so he stops healing the 4x-HP squad.'
            ]
        },
        map: {
            atmosphere: { skyTop: 0x090d16, skyBottom: 0x2e1065, fogColor: 0x1e1b4b, fogDensity: 0.0085, sunColor: 0xc084fc, sunIntensity: 1.05, sunPos: [20, 45, 20], hemiSky: 0x6b21a8, hemiGround: 0x1c1917, hemiIntensity: 0.9 },
            boxes: [B(0, -0.5, -10, 110, 1, 110, 'concrete')],
            spawn: { x: 0, y: 0, z: 18, yaw: 0 }
        },
        build(S) {
            K.groundPlane(S, 110, 0x1e293b, 0.002);
            const wallM = std(0x475569, 0.85), darkWallM = std(0x334155, 0.88), woodM = std(0x78350f, 0.82), sandM = std(0xc2a26b, 0.95), metalM = std(0x1f2937, 0.5, 0.7);
            const losMeshes = [];
            const addOpaque = (x, y, z, w, h, d, m) => {
                const bx = S.box(x, y, z, w, h, d, m, { solid: true });
                losMeshes.push(bx);
                return bx;
            };

            const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 34), std(0x0f172a, 0.95));
            road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, 8); S.add(road);
            for (const [vx, vz, col] of [[-5.5, 7, 0x7f1d1d], [6.2, 2, 0x1e3a8a], [-8, -2, 0x3f6212]]) {
                addOpaque(vx, 0.8, vz, 2.4, 1.6, 4.4, std(col, 0.7, 0.35));
            }
            for (const [tx, tz] of [[-13, 12], [13, 12], [-15, 0], [15, 0], [-14, -36], [14, -36]]) S.add(A.torch(S, V(tx, 0, tz), 0xf97316, false));

            addOpaque(-11.5, 1.9, -10, 13, 3.8, 1.2, wallM);
            addOpaque(11.5, 1.9, -10, 13, 3.8, 1.2, wallM);
            addOpaque(-18, 1.9, -14.5, 1.2, 3.8, 9, wallM);
            addOpaque(-18, 1.9, -30.5, 1.2, 3.8, 13, wallM);
            addOpaque(18, 1.9, -14.5, 1.2, 3.8, 9, wallM);
            addOpaque(18, 1.9, -30.5, 1.2, 3.8, 13, wallM);
            addOpaque(0, 1.9, -37, 37, 3.8, 1.2, wallM);

            for (const [cx, cz] of [[-18, -10], [18, -10], [-18, -37], [18, -37]]) {
                addOpaque(cx, 2.5, cz, 3.2, 5.0, 3.2, darkWallM);
            }
            const sign = A.sign('BASTION OMEGA — SURVIVOR FORT', 8.5, 1.1, { bg: '#0f172a', color: '#fde047', borderColor: '#ef4444', size: 0.42 });
            sign.position.set(0, 4.6, -9.8); S.add(sign);

            addOpaque(0, 0.75, -15, 4.4, 1.5, 1.1, sandM);
            addOpaque(-9, 1.1, -21, 3.8, 2.2, 1.6, woodM);
            addOpaque(0, 0.9, -25, 3.0, 1.8, 3.0, metalM);
            addOpaque(-11.5, 1.4, -31.5, 5.5, 2.8, 4.5, std(0xe2e8f0, 0.85));
            const medSign = A.sign('MED BAY +', 3.2, 0.6, { bg: '#991b1b', color: '#ffffff', borderColor: '#ffffff', size: 0.45 });
            medSign.position.set(-11.5, 3.1, -29.2); S.add(medSign);

            for (const [px, pz] of [[9.5, -22.5], [14.5, -22.5], [9.5, -27.5], [14.5, -27.5]]) {
                addOpaque(px, 2.1, pz, 0.65, 4.2, 0.65, metalM);
            }
            addOpaque(12, 4.1, -25, 6.2, 0.45, 6.2, woodM);
            const twRoof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.8, 4), std(0x334155, 0.8));
            twRoof.rotation.y = Math.PI / 4; twRoof.position.set(12, 7.6, -25); S.add(twRoof);
            addOpaque(12, 4.85, -22.05, 6.0, 1.0, 0.35, sandM);
            const twSign = A.sign('SNIPER WATCHTOWER', 4.6, 0.6, { bg: '#064e3b', color: '#a7f3d0', borderColor: '#10b981', size: 0.42 });
            twSign.position.set(12, 6.5, -22.0); S.add(twSign);

            S.data.losMeshes = losMeshes;
            S.data.humans = HUMAN_SPECS.map((hs, i) => {
                const fig = F.human({ shirt: hs.coat, pants: 0x111827, hat: hs.hat, hatColor: hs.coat, gun: hs.gun, eyes: 'angry' });
                // Extra loaded gear props (backpack + tactical shoulder pads)
                const pack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.18), std(0x1e293b, 0.7));
                pack.position.set(0, 1.15, -0.22); fig.root.add(pack);
                const startWp = hs.wps[0];
                const tg = S.addTarget({ mesh: fig.root, hitMeshes: [], pos: V(startWp[0], hs.y, startWp[1]), life: 0, appear: 'none', inT: 0.01, death: 'knock', deathColor: 0xef4444, bonus: true });
                return Object.assign(tg, { spec: hs, fig, hp: hs.hp, maxHp: hs.hp, mag: hs.magMax, reloadT: 0, fireCd: 0.8 + i * 0.3, healCd: 5.0, nadeCd: 6.0 + i * 2.0, smokeDropped: false, wpIdx: 0, walkPh: i * 1.4, strafeSign: i % 2 ? 1 : -1 });
            });
            S.data.allies = [];
            S.data.acid = [];
            S.data.nades = [];
            S.data.zid = 1;
            // All special moves start ON COOLDOWN, and all cooldown timers are DOUBLED!
            Object.assign(S.data, { cdAcid: 2.0, cdMelee: 1.1, cd5: 30, cdUnc: 30, cdSpd: 80, spdActive: 0, ult: 0, autoComT: 10, autoUncT: 25, humansLeft: 4 });
            BO.Player.maxHp = 320; BO.Player.hp = 320;
        },
        _spawnAlly(S, kindId, x, z, isBoss = false) {
            const spec = BO.ZombiesData.get(kindId);
            const ent = new BO.ZombieEntity({ id: S.data.zid++, spec, round: 10, hp: isBoss ? 1800 : spec.hp * 1.5, speed: spec.speed * 1.25, damage: isBoss ? 70 : Math.max(26, spec.attack), x, y: 0, z, splitCount: 0, hasGun: false, sizeMult: isBoss ? 1.35 : 1.0 });
            ent.allyTeam = true; S.data.allies.push(ent); return ent;
        },
        _summon5(S) {
            if (S.data.cd5 > 0) return false;
            S.data.cd5 = 30; const P = BO.Player;
            for (let i = 0; i < 5; i++) this._spawnAlly(S, 'shambler', P.pos.x + (i - 2) * 1.2, P.pos.z - 2.0);
            MG.toast('HORDE: 5 ZOMBIES SPAWNED!', '#4ade80'); SFX.crowd(0.25); return true;
        },
        _summonUncommon(S) {
            if (S.data.cdUnc > 0) return false;
            S.data.cdUnc = 30;
            const pool = ['sprinter', 'hopper', 'one_arm_ripper', 'bloater', 'headless_charger'];
            const pick = pool[Math.floor(Math.random() * pool.length)];
            this._spawnAlly(S, pick, BO.Player.pos.x, BO.Player.pos.z - 2.2);
            MG.toast('UNCOMMON: ' + pick.replace(/_/g, ' ').toUpperCase(), '#38bdf8'); SFX.ding(1.1); return true;
        },
        _speedBoost(S) {
            if (S.data.cdSpd > 0) return false;
            S.data.cdSpd = 80; S.data.spdActive = 10;
            MG.toast('+50% SPEED FRENZY (10s)!', '#facc15'); SFX.whoosh(0.28); return true;
        },
        _summonBoss(S) {
            if (S.data.ult < 100) { MG.toast('ULT NOT READY (' + Math.floor(S.data.ult) + '%)', '#cbd5e1'); return false; }
            S.data.ult = 0;
            this._spawnAlly(S, 'club_goliath', BO.Player.pos.x, BO.Player.pos.z - 2.6, true);
            MG.toast('EPIC BOSS SUMMONED!', '#c084fc'); SFX.rumble(0.7); return true;
        },
        onKey(S, code) {
            if (MG.state !== 'running') return false;
            if (code === 'Digit1') return this._summon5(S);
            if (code === 'Digit2') return this._summonUncommon(S);
            if (code === 'Digit3') return this._speedBoost(S);
            if (code === 'Digit4' || code === 'KeyQ') return this._summonBoss(S);
            if (code === 'KeyV') return this._clawMelee(S);
            return false;
        },
        _clawMelee(S) {
            if (S.data.cdMelee > 0) return false;
            S.data.cdMelee = 1.1;
            const P = BO.Player, fwd = P.getMoveDirectionVectors().forward;
            BO.FX.spawnParticles(P.pos.clone().addScaledVector(fwd, 2.2).add(V(0, 1.2, 0)), 14, 0x4ade80, 5, 2, 0.35, 1.0);
            SFX.thunk();
            for (const h of S.data.humans) {
                if (h.alive && h.root.position.distanceTo(P.pos) <= 4.6) this._damageHuman(S, h, 105, 'CLAW SLASH!');
            }
            return true;
        },
        _damageHuman(S, h, dmg, tag) {
            if (!h.alive) return;
            h.hp -= dmg;
            S.data.ult = Math.min(100, S.data.ult + 10);
            S.award(Math.round(dmg * 1.5), h.root.position.clone().add(V(0, 1.8, 0)), tag || null, '#86efac');
            if (h.hp <= 0) {
                h.kill({ pt: h.root.position.clone().add(V(0, 1.2, 0)) });
                S.data.humansLeft--; S.kills++; S.data.ult = Math.min(100, S.data.ult + 28);
                MG.toast(`${h.spec.name} ELIMINATED!`, '#86efac');
                if (S.data.humansLeft <= 0) MG.finish('FORTRESS OVERRUN!', { color: '#4ade80' });
            }
        },
        update(S, dt, lib, state) {
            const D = S.data, P = BO.Player;
            if (state !== 'running') return;
            D.cdAcid = Math.max(0, D.cdAcid - dt); D.cdMelee = Math.max(0, D.cdMelee - dt);
            D.cd5 = Math.max(0, D.cd5 - dt); D.cdUnc = Math.max(0, D.cdUnc - dt); D.cdSpd = Math.max(0, D.cdSpd - dt);
            if (!P.alive) { MG.finish('MASTER ZOMBIE DEFEATED', { color: '#f87171' }); return; }

            if (D.spdActive > 0) {
                D.spdActive -= dt;
                if (Math.hypot(P.vel.x, P.vel.z) > 0.5) { P.pos.x += P.vel.x * 0.5 * dt; P.pos.z += P.vel.z * 0.5 * dt; }
            }
            D.ult = Math.min(100, D.ult + dt * 1.6);
            D.autoComT -= dt;
            if (D.autoComT <= 0) { D.autoComT = 10; this._spawnAlly(S, 'shambler', (Math.random() - 0.5) * 8, 12); MG.toast('AUTO HORDE: +1 ZOMBIE', '#86efac'); }
            D.autoUncT -= dt;
            if (D.autoUncT <= 0) { D.autoUncT = 25; this._spawnAlly(S, Math.random() < 0.5 ? 'sprinter' : 'hopper', (Math.random() - 0.5) * 8, 12); MG.toast('AUTO HORDE: +1 UNCOMMON', '#38bdf8'); }

            if (P.triggerHeld && !D._lmb && D.cdAcid <= 0) {
                D._lmb = true; D.cdAcid = 2.0;
                const cam = BO.App.worldCamera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
                const m = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), basic(0x4ade80));
                m.position.copy(cam.position).addScaledVector(dir, 0.9); S.add(m);
                D.acid.push({ mesh: m, prev: m.position.clone(), vel: dir.multiplyScalar(28).add(V(0, 1.5, 0)), life: 3.0 });
                SFX.pop();
            } else if (!P.triggerHeld) D._lmb = false;
            if (P.adsHeld && !D._rmb) { D._rmb = true; this._clawMelee(S); } else if (!P.adsHeld) D._rmb = false;

            for (let i = D.acid.length - 1; i >= 0; i--) {
                const ac = D.acid[i];
                ac.prev.copy(ac.mesh.position);
                ac.life -= dt; ac.vel.y -= 9.8 * dt;
                ac.mesh.position.addScaledVector(ac.vel, dt);
                let hit = ac.mesh.position.y <= 0.15 || !hasLOS(ac.prev, ac.mesh.position, D.losMeshes);
                if (!hit) for (const h of D.humans) if (h.alive && h.root.position.clone().add(V(0, 1.1, 0)).distanceTo(ac.mesh.position) < 1.25) { hit = true; break; }
                if (hit || ac.life <= 0) {
                    BO.FX.spawnExplosion(ac.mesh.position.clone(), 3.2, 0x4ade80);
                    SFX.pop();
                    for (const h of D.humans) if (h.alive && h.root.position.distanceTo(ac.mesh.position) < 3.6) this._damageHuman(S, h, 75, 'ACID BURN!');
                    S.scene.remove(ac.mesh); D.acid.splice(i, 1);
                }
            }

            // Defender Grenades & Tactical Explosives
            for (let i = D.nades.length - 1; i >= 0; i--) {
                const nd = D.nades[i]; nd.life -= dt; nd.vel.y -= 14 * dt; nd.mesh.position.addScaledVector(nd.vel, dt);
                if (nd.mesh.position.y <= 0.15) { nd.mesh.position.y = 0.15; nd.vel.y *= -0.35; nd.vel.x *= 0.6; nd.vel.z *= 0.6; }
                if (nd.life <= 0) {
                    const ep = nd.mesh.position.clone();
                    BO.FX.spawnExplosion(ep, 4.2, nd.col); SFX.rumble(0.45);
                    if (P.pos.distanceTo(ep) < 4.5) P.takeDamage(nd.dmg, ep, false);
                    for (const al of D.allies) if (al.alive && al.pos.distanceTo(ep) < 4.5) al.takeDamage(nd.dmg * 2, 'torso', false, null, 'blast');
                    S.scene.remove(nd.mesh); D.nades.splice(i, 1);
                }
            }

            for (const h of D.humans) {
                if (!h.alive) continue;
                if (h.spec.medic) {
                    h.healCd -= dt;
                    if (h.healCd <= 0) {
                        h.healCd = 5.0;
                        for (const o of D.humans) if (o.alive && o.hp < o.maxHp) {
                            o.hp = Math.min(o.maxHp, o.hp + 140);
                            BO.FX.spawnTracer(h.root.position.clone().add(V(0, 1.3, 0)), o.root.position.clone().add(V(0, 1.3, 0)), 0x4ade80, 0.05, 0.16);
                        }
                    }
                    if (!h.smokeDropped && h.hp < h.maxHp * 0.5) {
                        h.smokeDropped = true;
                        BO.FX.spawnParticles(h.root.position.clone().add(V(0, 1.2, 0)), 22, 0xe2e8f0, 4, 1, 1.2, 1.8);
                    }
                }
                const eye = h.root.position.clone().add(V(0, 1.45, 0));
                let visibleTgt = null, visibleEnt = null, bestD = 38;
                const pEye = P.pos.clone().add(V(0, 1.2, 0));
                const pd = eye.distanceTo(pEye);
                if (pd < bestD && hasLOS(eye, pEye, D.losMeshes)) { bestD = pd; visibleTgt = pEye; visibleEnt = null; }
                for (const al of D.allies) {
                    if (!al.alive) continue;
                    const aEye = al.pos.clone().add(V(0, 1.1, 0));
                    const ad = eye.distanceTo(aEye);
                    if (ad < bestD && hasLOS(eye, aEye, D.losMeshes)) { bestD = ad; visibleTgt = aEye; visibleEnt = al; }
                }

                let moving = false;
                if (h.spec.y < 1) {
                    if (visibleTgt && bestD < 6.5) {
                        const away = h.root.position.clone().sub(visibleTgt); away.y = 0; away.normalize();
                        const lat = V(-away.z * h.strafeSign, 0, away.x * h.strafeSign).multiplyScalar(0.5);
                        const step = away.add(lat).normalize().multiplyScalar(3.6 * dt);
                        h.root.position.x = BO.Math.clamp(h.root.position.x + step.x, -16, 16);
                        h.root.position.z = BO.Math.clamp(h.root.position.z + step.z, -35, -12);
                        moving = true;
                    } else {
                        const wp = h.spec.wps[h.wpIdx];
                        const dx = wp[0] - h.root.position.x, dz = wp[1] - h.root.position.z;
                        const wd = Math.hypot(dx, dz);
                        if (wd > 0.5) {
                            h.root.position.x += (dx / wd) * 2.5 * dt;
                            h.root.position.z += (dz / wd) * 2.5 * dt;
                            moving = true;
                            if (!visibleTgt) h.root.rotation.y = Math.atan2(dx, dz);
                        } else { h.wpIdx = (h.wpIdx + 1) % h.spec.wps.length; }
                    }
                } else {
                    const wp = h.spec.wps[h.wpIdx];
                    const dx = wp[0] - h.root.position.x, dz = wp[1] - h.root.position.z, wd = Math.hypot(dx, dz);
                    if (wd > 0.35) { h.root.position.x += (dx / wd) * 1.9 * dt; h.root.position.z += (dz / wd) * 1.9 * dt; moving = true; }
                    else h.wpIdx = (h.wpIdx + 1) % h.spec.wps.length;
                }

                if (moving) { h.walkPh += dt * 8; F.walk(h.fig, h.walkPh, 1, !!visibleTgt); }
                if (visibleTgt) {
                    h.root.rotation.y = Math.atan2(visibleTgt.x - h.root.position.x, visibleTgt.z - h.root.position.z);
                    F.pose(h.fig, 'aim');
                    // Fully loaded tactical grenades / equipment from custom loadouts!
                    h.nadeCd -= dt;
                    if (h.nadeCd <= 0 && h.spec.role !== 'medic' && bestD < 28) {
                        h.nadeCd = h.spec.role === 'heavy' ? 9.0 : h.spec.role === 'shotgun' ? 10.0 : 11.5;
                        const ndCol = h.spec.role === 'shotgun' ? 0xf97316 : h.spec.role === 'sniper' ? 0x38bdf8 : 0xef4444;
                        const nm = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), basic(ndCol));
                        nm.position.copy(eye); S.add(nm);
                        const arc = visibleTgt.clone().sub(eye).multiplyScalar(0.85).add(V(0, 6.2, 0));
                        D.nades.push({ mesh: nm, vel: arc, life: 1.5, dmg: h.spec.role === 'heavy' ? 28 : 20, col: ndCol });
                    }
                    if (h.reloadT > 0) { h.reloadT -= dt; if (h.reloadT <= 0) h.mag = h.spec.magMax; }
                    else {
                        h.fireCd -= dt;
                        if (h.fireCd <= 0) {
                            h.fireCd = (h.spec.role === 'sniper' && bestD < 8) ? 0.35 : h.spec.rof;
                            h.mag--; if (h.mag <= 0) h.reloadT = 1.8;
                            if (h.spec.role === 'shotgun') {
                                for (let p = 0; p < 4; p++) {
                                    const sp = visibleTgt.clone().add(V((Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.4));
                                    BO.FX.spawnTracer(eye, sp, 0xfb923c, 0.025, 0.08);
                                }
                            } else {
                                BO.FX.spawnTracer(eye, visibleTgt, h.spec.role === 'sniper' ? 0x38bdf8 : 0xfacc15, h.spec.role === 'sniper' ? 0.05 : 0.03, 0.09);
                            }
                            SFX.noise(0.07, 1200, 'bandpass', 1, 0.16);
                            if (!visibleEnt) P.takeDamage(h.spec.dmg, h.root.position, false);
                            else visibleEnt.takeDamage(h.spec.dmg * 1.4, 'torso', false, null, 'bullet');
                        }
                    }
                }
            }

            for (let i = D.allies.length - 1; i >= 0; i--) {
                const z = D.allies[i];
                let nearest = null, nd = Infinity;
                for (const h of D.humans) {
                    if (!h.alive) continue;
                    const d = z.pos.distanceTo(h.root.position);
                    if (d < nd) { nd = d; nearest = h; }
                }
                const keep = z.update(dt, D.allies, {
                    allowProjectiles: false,
                    getTarget: () => nearest ? { x: nearest.root.position.x, y: 0, z: nearest.root.position.z, attackRange: 2.3 } : null,
                    onAttackCustomTarget: (zz) => { if (nearest && nearest.alive) this._damageHuman(S, nearest, Math.max(14, zz.damage * 0.6)); },
                    onMeleePlayer: () => {}
                });
                if (!keep) { z.destroy(); D.allies.splice(i, 1); }
            }
        },
        dispose(S) { for (const z of S.data.allies || []) z.destroy(); S.data.allies = []; },
        hud(S) {
            const D = S.data;
            const sk = (k, lbl, cd, readyTxt) => `<div class="fun-sk ${cd <= 0 ? 'ready' : ''}"><b>[${k}] ${lbl}</b><small>${cd <= 0 ? readyTxt : cd.toFixed(1) + 's'}</small></div>`;
            return `<div class="fun-panel"><div class="mgx-chip">FORTRESS DEFENDERS <b>${D.humansLeft} / 4</b></div><div class="mgx-chip">HORDE ALIVE <b>${D.allies.filter((a) => a.alive).length}</b></div><div class="mgx-chip">NEXT AUTO <b>${Math.ceil(D.autoComT)}s</b></div></div>
                <div class="fun-skills">
                    ${sk('LMB', 'ACID (2s)', D.cdAcid, 'READY')}
                    ${sk('RMB/V', 'CLAWS (1.1s)', D.cdMelee, 'READY')}
                    ${sk('1', '5 ZOMBIES', D.cd5, 'SPAWN (30s)')}
                    ${sk('2', 'UNCOMMON', D.cdUnc, 'SPAWN (30s)')}
                    ${sk('3', '+50% SPD', D.cdSpd, D.spdActive > 0 ? 'ACTIVE!' : 'BOOST (80s)')}
                    <div class="fun-sk ${D.ult >= 100 ? 'ready' : ''}"><b>[4/Q] EPIC BOSS</b><small>${D.ult >= 100 ? 'SUMMON!' : Math.floor(D.ult) + '%'}</small></div>
                </div>`;
        }
    });

    /* =====================================================================
       3. SNOWBOARDING — 5-Minute Mountain Run + Random Traps + Zombie Chasers
    ===================================================================== */
    const SNOW_LEN = 7400; // ~5 minutes at 16..33 m/s
    MG.register({
        id: 'fun_snowboarding', cat: 'fun', order: 3, name: 'Snowboarding', icon: '🏂', accent: '#38bdf8', badge: '5 MIN',
        tagline: '5-minute alpine descent! Unavoidable walls + random Rolling Boulders, Falling Icicles, Geysers & Ramps!',
        desc: 'Carve a 5-minute alpine run! Main traps, overhead beams, and ice walls force Jump ([SPACE]), Slide ([C/CTRL]), and Shoot ([LMB]), while RANDOM traps spawn along the slope between them: rolling snowballs, dropping icicles, frost geysers, slalom hazard gates, and jump ramps!',
        heroLabel: 'FUN • 5-MINUTE ALPINE ENDURANCE', duration: 0, stars: [4500, 10000, 16500, 24000],
        standardWeapon: 'mp7_navy', lockWeapon: true, infiniteMag: true, weaponLabel: 'MP7 + ALPINE BOARD', weaponNote: 'A/D steer • SPACE jump • C/CTRL slide • LMB blast ice & zombies',
        keys: [['A / D', 'Carve left / right'], ['SPACE', 'Jump traps'], ['C / CTRL', 'Slide under beams'], ['LMB', 'Shoot ice walls & zombies']],
        guide: {
            objective: 'Reach the 7,400m Alpine Finish Line alive across a 5-minute mountain descent.',
            tips: [
                'Red floor chevrons = JUMP [SPACE] over spike traps; Yellow = SLIDE [C] under timber beams; Blue = SHOOT ice walls.',
                'Watch between main obstacles for RANDOM TRAPS: carve around lateral Rolling Snowballs, Falling Icicles (cyan rings), and Frost Geysers!',
                'Hit glowing Gold Ramps to launch high over upcoming hazards and earn +350 style points.'
            ]
        },
        blockKeys: ['KeyW', 'KeyS', 'Space', 'KeyC', 'ControlLeft'],
        map: {
            atmosphere: { skyTop: 0x0369a1, skyBottom: 0xe0f2fe, fogColor: 0xbae6fd, fogDensity: 0.0042, sunColor: 0xffffff, sunIntensity: 1.8, sunPos: [40, 80, -100], hemiSky: 0xe0f2fe, hemiGround: 0x64748b, hemiIntensity: 0.95 },
            boxes: [B(0, -0.5, -SNOW_LEN * 0.5, 180, 1, SNOW_LEN + 240, 'concrete')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        build(S) {
            const slopeM = std(0xf1f5f9, 0.85), cliffM = std(0x475569, 0.9);
            const snowPlane = new THREE.Mesh(new THREE.PlaneGeometry(34, SNOW_LEN + 160), slopeM);
            snowPlane.rotation.x = -Math.PI / 2; snowPlane.position.set(0, 0.02, -SNOW_LEN * 0.5); S.add(snowPlane);
            for (const s of [-1, 1]) {
                const cliff = new THREE.Mesh(new THREE.BoxGeometry(10, 14, SNOW_LEN + 160), cliffM);
                cliff.position.set(s * 16.5, 6.5, -SNOW_LEN * 0.5); S.add(cliff);
            }
            const rnd = L.mulberry32(8801);
            for (let z = -30; z > -SNOW_LEN; z -= 65) {
                const tr = A.tree(1.8 + rnd() * 0.9, 0x0f766e);
                tr.position.set((rnd() < 0.5 ? -1 : 1) * (12.2 + rnd() * 2), 0, z); S.add(tr);
            }
            const zones = ['ZONE 1: GLACIAL SUMMIT', 'ZONE 2: PINE CANYON', 'ZONE 3: AVALANCHE GORGE', 'ZONE 4: NEON ICE TUNNEL', 'ZONE 5: ZOMBIE CHASE FINALE'];
            zones.forEach((lbl, zi) => {
                const zz = -zi * (SNOW_LEN * 0.2) - 25;
                const sg = A.sign(lbl, 12, 1.8, { bg: '#0c4a6e', color: '#fde047', borderColor: '#38bdf8', size: 0.44 });
                sg.position.set(0, 5.2, zz); S.add(sg);
            });

            const board = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 1.45), std(0xf43f5e, 0.35, 0.2));
            S.add(board);

            S.data.obstacles = []; S.data.extraTraps = []; S.data.riders = []; S.data.projs = [];
            const trapM = std(0x18181b, 0.4, 0.8), beamM = std(0x78350f, 0.85), iceM = new THREE.MeshStandardMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.84, roughness: 0.12 });
            const spikeMat = basic(0xef4444), warnMat = basic(0xfacc15), snowBallM = std(0xe2e8f0, 0.7), rampM = std(0xfacc15, 0.3, 0.5);

            for (let z = -70, stepIdx = 0; z > -SNOW_LEN + 90; z -= 54, stepIdx++) {
                const pct = -z / SNOW_LEN;
                const lateAvoidable = pct >= 0.72;
                const kind = stepIdx % 3;
                const sideGap = (stepIdx % 2 === 0) ? 1 : -1;
                const obsW = lateAvoidable ? 19.2 : 23.0;
                const obsX = lateAvoidable ? sideGap * -1.7 : 0;

                const chv = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.1), basic(kind === 0 ? 0xef4444 : kind === 1 ? 0xfacc15 : 0x38bdf8));
                chv.rotation.x = -Math.PI / 2; chv.position.set(0, 0.05, z + 16); S.add(chv);

                if (kind === 0) {
                    const g = new THREE.Group();
                    const plate = new THREE.Mesh(new THREE.BoxGeometry(obsW, 0.18, 1.35), trapM); plate.position.y = 0.09; g.add(plate);
                    const count = Math.floor(obsW / 1.5);
                    for (let k = -count / 2; k <= count / 2; k++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.78, 5), spikeMat); sp.position.set(k * 1.5, 0.48, 0); g.add(sp); }
                    g.position.set(obsX, 0, z); S.add(g);
                    S.data.obstacles.push({ kind: 'trap', mesh: g, x: obsX, z, w: obsW, hit: false });
                } else if (kind === 1) {
                    const g = new THREE.Group();
                    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, obsW, 10), beamM); bar.rotation.z = Math.PI / 2; bar.position.y = 1.48;
                    const warn = new THREE.Mesh(new THREE.BoxGeometry(obsW - 0.6, 0.22, 0.78), warnMat); warn.position.y = 1.48;
                    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.4, 0.4), beamM); p1.position.set(-obsW * 0.48, 1.2, 0);
                    const p2 = p1.clone(); p2.position.x = obsW * 0.48;
                    g.add(bar, warn, p1, p2); g.position.set(obsX, 0, z); S.add(g);
                    S.data.obstacles.push({ kind: 'beam', mesh: g, x: obsX, z, w: obsW, hit: false });
                } else {
                    const panels = lateAvoidable ? [-5.5 * sideGap, 1.8 * sideGap] : [-7.5, 0, 7.5];
                    for (const px of panels) {
                        const wall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.6, 0.9), iceM);
                        const tg = S.addTarget({ mesh: wall, pos: V(px, 1.3, z), life: 0, appear: 'none', inT: 0.01, death: 'shatter', deathColor: 0x67e8f9, points: 250, bonus: true });
                        S.data.obstacles.push({ kind: 'ice', mesh: tg.root, tg, x: px, z, w: 7.2, hit: false });
                    }
                }

                // RANDOM EXTRA TRAPS between main obstacles!
                const randZ = z - 24 - Math.random() * 6;
                const randX = (Math.random() - 0.5) * 14;
                const tRoll = Math.random();
                if (tRoll < 0.28) {
                    // Rolling Giant Snowball crossing the slope
                    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), snowBallM);
                    ball.position.set(randX, 1.15, randZ); S.add(ball);
                    S.data.extraTraps.push({ type: 'boulder', mesh: ball, x: randX, z: randZ, vx: (Math.random() < 0.5 ? -1 : 1) * (4.2 + Math.random() * 3.5), rad: 1.35, hit: false });
                } else if (tRoll < 0.54) {
                    // Dropping Icicle Spire with cyan warning circle on snow
                    const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.4, 18), basic(0x38bdf8, { side: THREE.DoubleSide }));
                    ring.rotation.x = -Math.PI / 2; ring.position.set(randX, 0.06, randZ); S.add(ring);
                    const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.85, 3.6, 6), iceM);
                    icicle.rotation.x = Math.PI; icicle.position.set(randX, 9.5, randZ); S.add(icicle);
                    S.data.extraTraps.push({ type: 'icicle', mesh: icicle, ring, x: randX, z: randZ, y: 9.5, falling: false, rad: 1.45, hit: false });
                } else if (tRoll < 0.78) {
                    // Frost Steam Geyser Vent
                    const vent = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, 0.2, 14), trapM);
                    vent.position.set(randX, 0.1, randZ); S.add(vent);
                    const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.0, 3.2, 10), basic(0xbae6fd, { transparent: true, opacity: 0.72 }));
                    plume.position.set(randX, 1.7, randZ); S.add(plume);
                    S.data.extraTraps.push({ type: 'geyser', mesh: plume, vent, x: randX, z: randZ, ph: Math.random() * 6, rad: 1.5, hit: false });
                } else if (tRoll < 0.90) {
                    // Neon Laser Slalom Gate
                    const gate = new THREE.Group();
                    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.0, 8), spikeMat); pL.position.set(-2.2, 1.5, 0);
                    const pR = pL.clone(); pR.position.x = 2.2;
                    const las = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 0.18), spikeMat); las.position.y = 1.2;
                    gate.add(pL, pR, las); gate.position.set(randX, 0, randZ); S.add(gate);
                    S.data.extraTraps.push({ type: 'slalom', mesh: gate, x: randX, z: randZ, w: 4.5, hit: false });
                } else {
                    // Gold Alpine Launch Ramp!
                    const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.8, 3.2), rampM);
                    ramp.rotation.x = 0.25; ramp.position.set(randX, 0.35, randZ); S.add(ramp);
                    S.data.extraTraps.push({ type: 'ramp', mesh: ramp, x: randX, z: randZ, w: 3.6, hit: false });
                }
            }
            const finish = A.sign('ALPINE FINISH LINE!', 14, 2.6, { bg: '#0c4a6e', color: '#fde68a', borderColor: '#38bdf8', size: 0.56 });
            finish.position.set(0, 4.2, -SNOW_LEN); S.add(finish);

            S.data.sb = { x: 0, z: 0, y: 0, vy: 0, speed: 16, slideT: 0, hp: 150, chasersSpawned: false, board };
            BO.Player.rideState = { kind: 'minigame', pos: V(0, 0, 0), roll: 0, pitch: 0, eye: 1.62 };
        },
        progress: (S) => clamp01(-S.data.sb.z / SNOW_LEN),
        onKey(S, code) {
            const sb = S.data.sb;
            if (MG.state !== 'running') return false;
            if (code === 'Space' && sb.y <= 0.04) { sb.vy = 11.2; sb.slideT = 0; SFX.boing(); return true; }
            if (code === 'KeyC' || code === 'ControlLeft') { sb.slideT = 0.95; SFX.whoosh(0.18); return true; }
            return false;
        },
        preUpdate(S, dt, lib, state) {
            const sb = S.data.sb, P = BO.Player, k = P.keys;
            if (state === 'running') {
                sb.speed = Math.min(33, sb.speed + dt * 0.062);
                sb.z -= sb.speed * dt;
                const steer = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
                sb.x = BO.Math.clamp(sb.x + steer * 13 * dt, -10.8, 10.8);
                if (sb.y > 0 || sb.vy > 0) { sb.vy -= 25 * dt; sb.y = Math.max(0, sb.y + sb.vy * dt); }
                if (sb.slideT > 0) sb.slideT -= dt;
                S.award(Math.round(dt * 42));
                if (Math.random() < dt * 16) BO.FX.spawnParticles(V(sb.x, 0.1, sb.z), 1, 0xffffff, 2, 1, 0.3, 0.7);
            }
            const eyeH = sb.slideT > 0 ? 0.68 : 1.62;
            if (P.rideState) {
                P.rideState.pos.set(sb.x, sb.y, sb.z);
                P.rideState.eye = eyeH;
                P.rideState.roll = ((k.KeyD ? -1 : 0) + (k.KeyA ? 1 : 0)) * 0.14;
            }
            sb.board.position.set(sb.x, sb.y + 0.04, sb.z - 0.55);
            sb.board.rotation.y = ((k.KeyA ? 1 : 0) - (k.KeyD ? 1 : 0)) * 0.25;
        },
        update(S, dt, lib, state) {
            const D = S.data, sb = D.sb;
            if (state !== 'running') return;

            for (const o of D.obstacles) {
                if (o.hit || Math.abs(sb.z - o.z) > 1.2) continue;
                if (o.kind === 'ice' && o.tg && !o.tg.alive) { o.hit = true; continue; }
                if (Math.abs(sb.x - o.x) < o.w * 0.5 + 0.28) {
                    const dodged = (o.kind === 'trap' && sb.y > 0.62) || (o.kind === 'beam' && sb.slideT > 0);
                    if (!dodged) {
                        o.hit = true;
                        sb.hp = Math.max(0, sb.hp - 25);
                        sb.speed = Math.max(15, sb.speed - 4);
                        SFX.bonk(); MG.flashScreen('rgba(220,38,38,0.35)');
                        MG.toast(o.kind === 'trap' ? 'TRAP HIT! JUMP [SPACE]' : o.kind === 'beam' ? 'BEAM HIT! SLIDE [C]' : 'ICE CRASH! SHOOT IT!', '#f87171');
                        if (sb.hp <= 0) { MG.finish('WIPEOUT ON THE MOUNTAIN!', { color: '#f87171' }); return; }
                    }
                }
            }

            // Random extra traps update & collisions
            for (const et of D.extraTraps) {
                if (et.z > sb.z + 18 || et.z < sb.z - 120) continue;
                if (et.type === 'boulder') {
                    et.x += et.vx * dt;
                    if (Math.abs(et.x) > 10.2) et.vx *= -1;
                    et.mesh.position.x = et.x;
                    et.mesh.rotation.z -= et.vx * dt * 0.9;
                    if (!et.hit && Math.abs(sb.z - et.z) < 1.25 && Math.abs(sb.x - et.x) < et.rad && sb.y < 1.35) {
                        et.hit = true; sb.hp = Math.max(0, sb.hp - 20); SFX.bonk(); MG.flashScreen('rgba(239,68,68,0.3)');
                        MG.toast('SMASHED BY ROLLING SNOWBALL!', '#fca5a5');
                        if (sb.hp <= 0) { MG.finish('WIPEOUT ON THE MOUNTAIN!', { color: '#f87171' }); return; }
                    }
                } else if (et.type === 'icicle') {
                    if (!et.falling && et.z > sb.z - 42) et.falling = true;
                    if (et.falling && et.y > 1.8) { et.y = Math.max(1.8, et.y - 16 * dt); et.mesh.position.y = et.y; }
                    if (!et.hit && Math.abs(sb.z - et.z) < 1.15 && Math.abs(sb.x - et.x) < et.rad && sb.y < 2.2) {
                        et.hit = true; sb.hp = Math.max(0, sb.hp - 18); SFX.shatter(); MG.flashScreen('rgba(56,189,248,0.35)');
                        MG.toast('FALLING ICICLE HIT!', '#93c5fd');
                        if (sb.hp <= 0) { MG.finish('WIPEOUT ON THE MOUNTAIN!', { color: '#f87171' }); return; }
                    }
                } else if (et.type === 'geyser') {
                    const active = Math.sin(S.t * 2.8 + et.ph) > -0.1;
                    et.mesh.visible = active;
                    if (active && !et.hit && Math.abs(sb.z - et.z) < 1.3 && Math.abs(sb.x - et.x) < et.rad && sb.y < 2.4) {
                        et.hit = true; sb.hp = Math.max(0, sb.hp - 15); sb.vy = Math.max(sb.vy, 9.0); SFX.whoosh(0.3);
                        MG.toast('FROST GEYSER BLAST!', '#bae6fd');
                        if (sb.hp <= 0) { MG.finish('WIPEOUT ON THE MOUNTAIN!', { color: '#f87171' }); return; }
                    }
                } else if (et.type === 'slalom') {
                    if (!et.hit && Math.abs(sb.z - et.z) < 1.0 && Math.abs(sb.x - et.x) < et.w * 0.5 && sb.y < 1.3 && sb.slideT <= 0) {
                        et.hit = true; sb.hp = Math.max(0, sb.hp - 18); SFX.buzzer();
                        MG.toast('SLALOM GATE HIT! CARVE AROUND OR SLIDE!', '#fca5a5');
                        if (sb.hp <= 0) { MG.finish('WIPEOUT ON THE MOUNTAIN!', { color: '#f87171' }); return; }
                    }
                } else if (et.type === 'ramp') {
                    if (!et.hit && Math.abs(sb.z - et.z) < 1.6 && Math.abs(sb.x - et.x) < et.w * 0.5) {
                        et.hit = true; sb.vy = 14.5; sb.y = Math.max(sb.y, 0.2); S.award(350, V(sb.x, sb.y + 2, sb.z), 'BIG AIR! +350', '#fde047'); SFX.star(2);
                    }
                }
            }

            if (-sb.z >= SNOW_LEN * 0.72 && !sb.chasersSpawned) {
                sb.chasersSpawned = true;
                MG.toast('ZOMBIE SNOWBOARDERS CATCHING UP — HOLD ON!', '#fca5a5');
                for (let i = 0; i < 5; i++) {
                    const zm = F.human({ skin: 0x65a30d, shirt: 0x3f6212, pants: 0x1e293b, mask: 0x18181b, eyes: 'angry' });
                    const bd = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 1.5), basic(0x4ade80)); zm.root.add(bd);
                    const tg = S.addTarget({ mesh: zm.root, hitMeshes: zm.hit, pos: V((i - 2) * 4.0, 0, sb.z + 24), life: 0, appear: 'none', inT: 0.01, death: 'tumble', deathColor: 0x4ade80, points: 500, hp: 2, bonus: true });
                    tg.offX = (i - 2) * 3.8; tg.offZ = 15 + i * 3; tg.fireT = 2.0 + i * 0.5;
                    D.riders.push(tg);
                }
            }
            for (const rd of D.riders) {
                if (!rd.alive) continue;
                rd.offZ = Math.max(7.0, rd.offZ - dt * 1.9);
                rd.root.position.set(BO.Math.clamp(rd.offX + Math.sin(S.t * 2 + rd.offZ) * 3.2, -10.5, 10.5), 0.1, sb.z + rd.offZ);
                rd.root.rotation.y = Math.PI;
                rd.fireT -= dt;
                if (rd.fireT <= 0) {
                    rd.fireT = 2.2;
                    const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), basic(0x4ade80));
                    pMesh.position.copy(rd.root.position).add(V(0, 1.3, -0.5)); S.add(pMesh);
                    const vel = V(sb.x, sb.y + 1.0, sb.z - 4).sub(pMesh.position).normalize().multiplyScalar(sb.speed + 16);
                    D.projs.push({ mesh: pMesh, vel, life: 2.5 }); SFX.pop();
                }
            }
            for (let i = D.projs.length - 1; i >= 0; i--) {
                const pr = D.projs[i];
                pr.life -= dt; pr.mesh.position.addScaledVector(pr.vel, dt);
                if (pr.mesh.position.distanceTo(V(sb.x, sb.y + 1.1, sb.z)) < 1.1) {
                    sb.hp = Math.max(0, sb.hp - 15); MG.flashScreen('rgba(74,222,128,0.35)');
                    S.scene.remove(pr.mesh); D.projs.splice(i, 1);
                    if (sb.hp <= 0) { MG.finish('SHOT DOWN BY ZOMBIE RIDERS', { color: '#f87171' }); return; }
                    continue;
                }
                if (pr.life <= 0) { S.scene.remove(pr.mesh); D.projs.splice(i, 1); }
            }
            if (-sb.z >= SNOW_LEN) { S.award(3000 + sb.hp * 20); MG.finish('5-MINUTE MOUNTAIN CONQUERED!', { color: '#38bdf8' }); }
        },
        hud(S) {
            const sb = S.data.sb, pct = Math.round(clamp01(-sb.z / SNOW_LEN) * 100);
            const modeLbl = pct >= 72 ? 'CHICANE GAPS + ZOMBIES' : 'UNAVOIDABLE WALLS + TRAPS';
            return `<div class="fun-panel"><div class="mgx-chip">SPEED <b>${Math.round(sb.speed * 3.2)} KM/H</b></div><div class="mgx-chip">SLOPE <b>${pct}%</b></div><div class="mgx-chip ${sb.hp < 45 ? 'mgx-bad' : ''}">HP <b>${sb.hp}</b></div><div class="mgx-chip">${modeLbl}</div></div>`;
        }
    });
})(window);
