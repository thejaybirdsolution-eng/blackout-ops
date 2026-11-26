/* ============================================================================
   BLACKOUT OPS — MINIGAMES: FUN & SPECIALS FLAGSHIP BATCH 2A (Modes 13–15)
     13. Toy-Soldier Bedroom War — Shrunk to 5cm inside a giant sun-drenched
         90s Bedroom! Giant oak desk, stacked textbooks, LEGO brick fortresses,
         gumball machine, wind-up Tin Bomb-Bots, Tan Paratroopers, Green Allied
         Squad [Q], and an Attack Toy Biplane Boss!
     14. Grandmaster Battle-Chess FPS — Giant illuminated Marble & Obsidian
         Chess Cathedral! Command sculpted White Pieces [E] on the board,
         trigger Real-Time Arena Duels when pieces collide, snipe Black Royal
         Pieces (Rooks, Bishops, Knights, Queen), and shatter the Black King!
     15. Ectoplasm Ghost-Hunter Mansion — Haunted Victorian Grand Ballroom with
         first-person 3D Proton Wand & PKE Meter, floating candelabra & haunted
         suits of armor, [LMB] Proton Stream wrangling, [G/E] Floor Ghost Trap
         capture beam, and LORD VOLTAIRE Phantom Organist Boss!
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const { B, SFX, std, basic, TAU, clamp01, esc } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;

    function tone(f0, f1, dur = 0.14, type = 'sine', vol = 0.09, delay = 0) {
        if (!BO.Sound || !BO.Sound.ctx) return;
        const ctx = BO.Sound.ctx, t0 = ctx.currentTime + delay;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(Math.max(30, f0), t0);
        if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + dur + 0.02);
    }

    function labelSprite(text, color, wScale = 2.5) {
        const tex = L.canvasTex('funF-lbl:' + text + ':' + color, 256, 64, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            g.font = '900 28px Bahnschrift, Impact, sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,0.84)';
            g.strokeText(text, w / 2, h / 2, 240);
            g.fillStyle = color; g.fillText(text, w / 2, h / 2, 240);
        });
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        s.scale.set(wScale, 0.58, 1);
        return s;
    }

    /* =====================================================================
       13. TOY-SOLDIER BEDROOM WAR
       5cm Army Men Scale inside a Giant Kids' Bedroom!
    ===================================================================== */
    function bedroomRugTex() {
        return L.canvasTex('toy-bedroom-rug-v1', 512, 512, (g, w, h) => {
            g.fillStyle = '#15803d'; g.fillRect(0, 0, w, h);
            // Classic kids' city-road playmat rug!
            g.fillStyle = '#334155';
            g.fillRect(72, 72, w - 144, 56);
            g.fillRect(72, h - 128, w - 144, 56);
            g.fillRect(72, 72, 56, h - 144);
            g.fillRect(w - 128, 72, 56, h - 144);
            g.fillRect(w / 2 - 28, 72, 56, h - 144);
            g.strokeStyle = '#fde047'; g.lineWidth = 4; g.setLineDash([14, 12]);
            g.strokeRect(100, 100, w - 200, h - 200);
            g.beginPath(); g.moveTo(w / 2, 100); g.lineTo(w / 2, h - 100); g.stroke();
            g.setLineDash([]);
            // Little painted ponds & park patches
            g.fillStyle = '#38bdf8';
            g.beginPath(); g.ellipse(180, 256, 38, 56, 0, 0, TAU); g.fill();
            g.fillStyle = '#dc2626'; g.strokeStyle = '#fef08a'; g.lineWidth = 8;
            g.strokeRect(6, 6, w - 12, h - 12);
        });
    }

    function bookCoverTex(title, bg, spineCol) {
        return L.canvasTex('book-cov:' + title, 256, 128, (g, w, h) => {
            g.fillStyle = bg; g.fillRect(0, 0, w, h);
            g.fillStyle = spineCol; g.fillRect(0, 0, 34, h);
            g.strokeStyle = '#fde047'; g.lineWidth = 5; g.strokeRect(42, 12, w - 54, h - 24);
            g.fillStyle = '#ffffff'; g.font = '900 28px Bahnschrift, sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(title, w / 2 + 14, h / 2, w - 70);
        });
    }

    function buildLegoBlock(S, x, y, z, studsX, studsZ, h, colHex, solid = true) {
        const unit = 1.35;
        const w = studsX * unit, d = studsZ * unit;
        const mat = new THREE.MeshStandardMaterial({ color: colHex, roughness: 0.22, metalness: 0.08 });
        const grp = new THREE.Group();
        const brick = S.box(x, y + h / 2, z, w, h, d, mat, { solid });
        for (let sx = 0; sx < studsX; sx++) {
            for (let sz = 0; sz < studsZ; sz++) {
                const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.28, 14), mat);
                stud.position.set(x - w / 2 + (sx + 0.5) * unit, y + h + 0.14, z - d / 2 + (sz + 0.5) * unit);
                stud.castShadow = true;
                S.add(stud);
            }
        }
        return { grp, brick };
    }

    function buildPlasticSoldier(isTan, withChute = false) {
        const col = isTan ? 0xd4a373 : 0x16a34a;
        const darkCol = isTan ? 0xa97142 : 0x14532d;
        const fig = F.human({
            skin: col, shirt: col, pants: col, coat: col,
            hat: 'helmet', hatColor: darkCol, gun: 'rifle', eyes: 'angry', scale: 0.96
        });
        // Glossy molded-plastic sheen + oval plastic stand base under their boots!
        const plasticMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.26, metalness: 0.12 });
        fig.root.traverse((m) => {
            if (m.isMesh && !m.userData.noHit) m.material = plasticMat;
        });
        const baseStand = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.60, 0.09, 18), plasticMat);
        baseStand.scale.set(0.85, 1, 1.15);
        baseStand.position.y = 0.045;
        fig.root.add(baseStand);

        let chute = null;
        if (withChute) {
            chute = new THREE.Group();
            const canopy = new THREE.Mesh(
                new THREE.SphereGeometry(1.55, 16, 10, 0, TAU, 0, Math.PI * 0.5),
                new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7, side: THREE.DoubleSide })
            );
            canopy.position.y = 3.2;
            chute.add(canopy);
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * TAU + Math.PI / 4;
                const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.2, 4), basic(0xe2e8f0));
                cord.position.set(Math.cos(a) * 0.75, 2.2, Math.sin(a) * 0.75);
                cord.rotation.z = Math.cos(a) * 0.35;
                cord.rotation.x = -Math.sin(a) * 0.35;
                chute.add(cord);
            }
            fig.root.add(chute);
        }
        return { fig, chute };
    }

    function buildWindUpBombBot() {
        const root = new THREE.Group();
        const hit = [];
        const tinRed = std(0xdc2626, 0.28, 0.78);
        const tinBlue = std(0x2563eb, 0.30, 0.75);
        const brass = std(0xfacc15, 0.22, 0.90);

        const feetL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.54), tinBlue); feetL.position.set(-0.24, 0.11, 0);
        const feetR = feetL.clone(); feetR.position.x = 0.24;
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.88, 0.62), tinRed); torso.position.y = 0.66;
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.44, 14), brass); head.position.y = 1.32;
        head.userData.hitbox = 'head';
        for (const sx of [-0.14, 0.14]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), basic(0x38bdf8));
            eye.position.set(sx, 1.35, 0.31);
            root.add(eye);
        }
        // Giant Brass Wind-Up Key on its back!
        const keyPivot = new THREE.Group();
        keyPivot.position.set(0, 0.72, -0.38);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8), brass); stem.rotation.x = Math.PI / 2;
        const loop1 = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.045, 8, 14), brass); loop1.position.set(-0.18, 0, -0.18);
        const loop2 = loop1.clone(); loop2.position.x = 0.18;
        keyPivot.add(stem, loop1, loop2);

        root.add(feetL, feetR, torso, head, keyPivot);
        hit.push(torso, head, feetL, feetR);
        root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        return { root, hit, keyPivot };
    }

    function buildToyBiplane() {
        const root = new THREE.Group();
        const hit = [];
        const bodyM = std(0xb91c1c, 0.32, 0.35);
        const wingM = std(0xfacc15, 0.38, 0.25);
        const darkM = std(0x1e293b, 0.5, 0.6);

        const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.42, 5.2, 14), bodyM);
        fus.rotation.x = Math.PI / 2;
        const cowling = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.65, 14), darkM);
        cowling.rotation.x = Math.PI / 2; cowling.position.z = 2.75;
        cowling.userData.hitbox = 'head';
        const topWing = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.14, 1.35), wingM); topWing.position.set(0, 0.95, 0.5);
        const botWing = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.14, 1.35), wingM); botWing.position.set(0, -0.45, 0.5);
        const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.15, 1.1), bodyM); tailFin.position.set(0, 0.65, -2.3);
        for (const sx of [-2.2, 2.2]) {
            const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), darkM);
            strut.position.set(sx, 0.25, 0.5);
            root.add(strut);
        }
        const prop = new THREE.Group();
        prop.position.set(0, 0, 3.15);
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 0.06), std(0x451a03, 0.6));
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.4, 0.06), std(0x451a03, 0.6));
        prop.add(b1, b2);

        root.add(fus, cowling, topWing, botWing, tailFin, prop);
        hit.push(fus, cowling, topWing, botWing, tailFin);
        return { root, hit, prop };
    }

    MG.register({
        id: 'fun_toy_war', cat: 'fun', order: 13,
        name: 'Toy-Soldier Bedroom War', icon: '🪖', accent: '#22c55e', badge: '5CM SCALE',
        tagline: 'Shrunk to 5cm! Battle Tan Army Men, Wind-Up Bots & a Toy Biplane across a giant Bedroom!',
        desc: 'You are a 5cm Green Plastic Commando fighting for control of Andy-scale Giant Bedroom! Sprint across the City-Road Playmat Rug, climb giant stacked Hardcover Textbooks onto the towering 14-meter Oak Study Desk, use Spring-Loaded Rubber-Eraser Bounce Pads [SPACE], call in Green Plastic Riflemen [Q], detonate Firecracker Bundles, and shoot down the Tan Baron Toy Biplane Boss!',
        guide: {
            objective: 'Defend the Green Command Flag on the Playmat Rug while eliminating Tan Paratroopers, Wind-Up Tin Bomb-Bots, and the Tan Baron Toy Biplane Boss!',
            tips: [
                'Step onto pink/blue RUBBER ERASER BOUNCE PADS to launch straight up onto the giant Book Stacks and LEGO Brick Fortresses!',
                'Press [Q] (18s cooldown) to air-drop 3 allied Green Plastic Riflemen who automatically trade fire with Tan troops!',
                'Shoot bright red FIRECRACKER BUNDLES when Wind-Up Bomb-Bots march past for huge chain explosions!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • 5CM MICRO-SCALE WARFARE', duration: 150,
        stars: [2600, 5200, 8400, 12000],
        standardWeapon: 'm16a4', lockWeapon: true, infiniteMag: true, forgivingMisses: true,
        weaponLabel: 'PLASTIC M16A4 CARBINE', weaponNote: '[Q] Drop 3 Green Allies (18s) • Bounce on Giant Erasers • Shoot Red Firecrackers!',
        keys: [['WASD', 'March Across Playmat'], ['SPACE', 'Jump / Eraser Bounce'], ['Q', 'Drop Green Squad (18s)'], ['LMB', 'Fire Plastic Rounds']],
        map: {
            atmosphere: { skyTop: 0x38bdf8, skyBottom: 0xfef3c7, fogColor: 0xfef9c3, fogDensity: 0.0045, sunColor: 0xfffbeb, sunIntensity: 1.75, sunPos: [30, 50, 20], hemiSky: 0xe0f2fe, hemiGround: 0x86efac, hemiIntensity: 0.95 },
            boxes: [
                B(0, -0.5, 0, 58, 1, 58, 'wood'),
                B(-29, 12, 0, 1, 24, 58, 'concrete'), B(29, 12, 0, 1, 24, 58, 'concrete'),
                B(0, 12, -29, 58, 24, 1, 'concrete'), B(0, 12, 29, 58, 24, 1, 'concrete')
            ],
            spawn: { x: 0, y: 0.1, z: 16, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            const D = S.data;
            Object.assign(D, {
                flagHp: 100, enemies: [], allies: [], bouncePads: [], allyCd: 0,
                spawnCd: 1.2, waveKilled: 0, biplane: null, biplaneSpawned: false, biplaneDown: false
            });

            // Giant Bedroom Hardwood Planks + Vibrant Kids' City-Road Playmat Rug in the center!
            const woodPlank = L.canvasTex('giant-oak-floor', 256, 256, (g, w, h) => {
                g.fillStyle = '#92400e'; g.fillRect(0, 0, w, h);
                for (let i = 0; i < 4; i++) {
                    g.fillStyle = i % 2 ? '#b45309' : '#78350f';
                    g.fillRect(0, i * 64 + 2, w, 60);
                }
            });
            woodPlank.wrapS = woodPlank.wrapT = THREE.RepeatWrapping; woodPlank.repeat.set(8, 8);
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(57, 57), new THREE.MeshStandardMaterial({ map: woodPlank, roughness: 0.65 }));
            floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; floor.receiveShadow = true; S.add(floor);

            const rug = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.MeshStandardMaterial({ map: bedroomRugTex(), roughness: 0.88 }));
            rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.03, 0); rug.receiveShadow = true; S.add(rug);

            // Giant Pastel Bedroom Walls + Baseboards + Sunlit Window Frame high on the wall!
            const wallMat = std(0xdbeafe, 0.85), baseMat = std(0xf8fafc, 0.6);
            for (const [wx, wz, ww, wd] of [[0, -28.4, 57, 0.3], [0, 28.4, 57, 0.3], [-28.4, 0, 0.3, 57], [28.4, 0, 0.3, 57]]) {
                const base = new THREE.Mesh(new THREE.BoxGeometry(ww, 1.8, wd + 0.15), baseMat);
                base.position.set(wx, 0.9, wz); S.add(base);
                const wMesh = new THREE.Mesh(new THREE.BoxGeometry(ww, 22, wd), wallMat);
                wMesh.position.set(wx, 12.8, wz); S.add(wMesh);
            }
            const winGlow = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), basic(0xfef9c3));
            winGlow.position.set(28.1, 14, -4); winGlow.rotation.y = -Math.PI / 2; S.add(winGlow);

            // 1. Towering 14m Giant Oak Study Desk against North Wall (z = -22) + Giant Desk Lamp & Pencil Cup!
            const oakM = std(0x78350f, 0.72);
            for (const [lx, lz] of [[-12, -25.5], [12, -25.5], [-12, -17.5], [12, -17.5]]) {
                S.box(lx, 6.5, lz, 1.4, 13.0, 1.4, oakM, { solid: true });
            }
            S.box(0, 13.4, -21.5, 27, 0.9, 10.5, oakM, { solid: true });
            const pencilCup = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.1, 3.4, 16), std(0x2563eb, 0.4));
            pencilCup.position.set(-8, 15.5, -22); S.add(pencilCup);
            for (let p = 0; p < 3; p++) {
                const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.2, 8), std(0xfacc15, 0.5));
                pen.position.set(-8 + (p - 1) * 0.5, 16.8, -22); pen.rotation.z = (p - 1) * 0.18; S.add(pen);
            }

            // 2. Giant Twin Bed on West Side (x = -21, z = 4) with Quilted Blanket & Fluffy Pillow!
            S.box(-21, 3.2, 4, 11, 2.2, 22, std(0x1d4ed8, 0.85), { solid: true });
            for (const [bx, bz] of [[-25.8, -6.2], [-16.2, -6.2], [-25.8, 14.2], [-16.2, 14.2]]) {
                S.box(bx, 2.5, bz, 0.9, 5.0, 0.9, oakM, { solid: true });
            }
            const pillow = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.2, 4.2), std(0xf8fafc, 0.8));
            pillow.position.set(-21, 4.8, -4.2); S.add(pillow);

            // 3. Stacked Giant Hardcover Textbooks forming stair/sniper perches!
            const books = [
                { x: -8.5, y: 0.7, z: -6, w: 6.5, h: 1.4, d: 4.8, t: 'DINOSAURS A-Z', bg: '#991b1b', sp: '#fde047' },
                { x: -8.2, y: 2.1, z: -6.2, w: 5.8, h: 1.4, d: 4.4, t: 'SPACE ATLAS', bg: '#1e3a8a', sp: '#38bdf8' },
                { x: 9.5, y: 0.7, z: 3, w: 6.4, h: 1.4, d: 4.8, t: 'COMIC ANNUAL', bg: '#065f46', sp: '#4ade80' },
                { x: 9.2, y: 2.1, z: 2.8, w: 5.6, h: 1.4, d: 4.2, t: 'ROBOTS 101', bg: '#581c87', sp: '#f472b6' }
            ];
            for (const bk of books) {
                const mat = new THREE.MeshStandardMaterial({ map: bookCoverTex(bk.t, bk.bg, bk.sp), roughness: 0.55 });
                S.box(bk.x, bk.y, bk.z, bk.w, bk.h, bk.d, mat, { solid: true });
            }

            // 4. Colorful Studded LEGO Brick Bunkers across the Playmat!
            buildLegoBlock(S, -5.5, 0, 7.5, 4, 1, 1.6, 0xef4444);
            buildLegoBlock(S, 5.5, 0, 7.5, 4, 1, 1.6, 0x3b82f6);
            buildLegoBlock(S, 0, 0, -2.5, 5, 2, 1.8, 0xfacc15);
            buildLegoBlock(S, -11, 0, -13.5, 4, 2, 2.2, 0x22c55e);
            buildLegoBlock(S, 11, 0, -13.5, 4, 2, 2.2, 0xa855f7);

            // 5. Pink & Blue Dual-Tone Rubber-Eraser Bounce Pads!
            for (const [ex, ez] of [[-12.5, -2.5], [12.5, -2.5], [0, 6.5]]) {
                const eg = new THREE.Group(); eg.position.set(ex, 0.22, ez);
                const pinkHalf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.44, 1.4), std(0xf472b6, 0.6)); pinkHalf.position.z = -0.65;
                const blueHalf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.44, 1.2), std(0x38bdf8, 0.6)); blueHalf.position.z = 0.65;
                const lbl = labelSprite('⬆ ERASER BOUNCE', '#fde047', 2.2); lbl.position.y = 1.1;
                eg.add(pinkHalf, blueHalf, lbl); S.add(eg);
                D.bouncePads.push(V(ex, 0.3, ez));
            }

            // 6. Shootable Red Firecracker Bundles scattered in the Tan approach lanes!
            for (const [fx, fz] of [[-6, -9], [6, -9], [0, -15], [-9, 1], [9, -4]]) {
                const fg = new THREE.Group();
                for (let k = -1; k <= 1; k++) {
                    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.15, 10), std(0xdc2626, 0.45));
                    stick.position.set(k * 0.28, 0.58, 0); fg.add(stick);
                }
                const band = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.44), basic(0xfacc15)); band.position.y = 0.6;
                const fuse = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), basic(0xfef08a)); fuse.position.set(0, 1.25, 0);
                fg.add(band, fuse);
                S.addTarget({
                    kind: 'firecracker', mesh: fg, pos: V(fx, 0, fz), life: 0, points: 100, appear: 'none', death: 'burst', deathColor: 0xf97316, bonus: true,
                    onKill: (tg) => {
                        const c = tg.root.position.clone().add(V(0, 0.6, 0));
                        BO.FX.spawnExplosion(c, 5.5, 0xf97316);
                        SFX.rumble(0.6);
                        let blasted = 0;
                        for (const e of D.enemies.slice()) {
                            if (e.tgt.alive && e.tgt.basePos.distanceTo(c) < 7.2) {
                                e.tgt.kill({ pt: e.tgt.basePos }); S.kills++; S.bumpCombo(); blasted++;
                            }
                        }
                        if (blasted > 0) S.award(220 * blasted, c, `🧨 FIRECRACKER x${blasted}!`, '#fde047');
                    }
                });
            }

            // 7. Green HQ Command Flag Base at (0, 0, 13.5)
            const hqRing = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.5, 28), basic(0x22c55e));
            hqRing.rotation.x = -Math.PI / 2; hqRing.position.set(0, 0.05, 13.5); S.add(hqRing);
            const hqPole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 5.5, 10), std(0xe2e8f0, 0.3, 0.8));
            hqPole.position.set(0, 2.75, 13.5); S.add(hqPole);
            const hqFlag = A.sign('★ GREEN ARMY HQ ★', 2.8, 0.85, { bg: '#14532d', color: '#fde047', borderColor: '#4ade80', size: 0.32 });
            hqFlag.position.set(1.45, 4.9, 13.5); S.add(hqFlag);
            D.hqPos = V(0, 0, 13.5);

            // Spawn 2 starting Green Allied Riflemen guarding the perimeter!
            this._spawnGreenSquad(S, true);

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyQ') this._spawnGreenSquad(S, false);
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
        },
        _spawnGreenSquad(S, initial = false) {
            const D = S.data;
            if (!initial && D.allyCd > 0) { MG.toast(`⏳ GREEN REINFORCEMENTS IN ${D.allyCd.toFixed(1)}s`, '#94a3b8'); return; }
            if (!initial) {
                D.allyCd = 18.0;
                tone(440, 880, 0.22, 'triangle', 0.11);
                MG.toast('🪂 GREEN PLASTIC PARATROOPERS DEPLOYED!', '#4ade80');
            }
            const count = initial ? 2 : 3;
            for (let i = 0; i < count; i++) {
                if (D.allies.length >= 6) break;
                const built = buildPlasticSoldier(false, false);
                F.pose(built.fig, 'aim');
                const ax = (i - (count - 1) / 2) * 3.4 + (Math.random() - 0.5);
                const az = 10.5 + (Math.random() - 0.5) * 1.5;
                built.fig.root.position.set(ax, 0, az);
                built.fig.root.rotation.y = Math.PI;
                S.add(built.fig.root);
                D.allies.push({ fig: built.fig, pos: V(ax, 0, az), fireCd: 0.6 + i * 0.35, hp: 45 });
            }
        },
        _spawnTanEnemy(S) {
            const D = S.data;
            if (D.enemies.length >= 11) return;
            const isBot = Math.random() < 0.28;
            const para = !isBot && Math.random() < 0.45;
            const sx = (Math.random() - 0.5) * 26;
            const sz = -17 - Math.random() * 5;
            const sy = para ? 14.5 : 0;

            if (isBot) {
                const bot = buildWindUpBombBot();
                const tgt = S.addTarget({
                    kind: 'tin_bot', mesh: bot.root, hitMeshes: bot.hit, pos: V(sx, 0, sz),
                    hp: 4, life: 0, points: 320, appear: 'scale', death: 'burst', deathColor: 0xfacc15,
                    onKill: () => {
                        BO.FX.spawnExplosion(tgt.basePos.clone().add(V(0, 0.8, 0)), 3.2, 0xf97316);
                        D.waveKilled++;
                        D.enemies = D.enemies.filter((e) => e.tgt !== tgt);
                    }
                });
                D.enemies.push({ tgt, isBot: true, bot, para: false, speed: 3.6, atkCd: 1.0, phase: Math.random() * 6 });
            } else {
                const built = buildPlasticSoldier(true, para);
                F.pose(built.fig, 'aim');
                const tgt = S.addTarget({
                    kind: 'tan_soldier', mesh: built.fig.root, hitMeshes: built.fig.hit, pos: V(sx, sy, sz),
                    hp: 2, life: 0, points: 185, appear: para ? 'none' : 'scale', death: 'tumble', deathColor: 0xd4a373,
                    onKill: () => {
                        D.waveKilled++;
                        D.enemies = D.enemies.filter((e) => e.tgt !== tgt);
                    }
                });
                D.enemies.push({ tgt, isBot: false, fig: built.fig, chute: built.chute, para, speed: 2.6, atkCd: 1.6 + Math.random(), phase: Math.random() * 6 });
            }
        },
        _spawnBiplaneBoss(S) {
            const D = S.data;
            D.biplaneSpawned = true;
            const bp = buildToyBiplane();
            const tgt = S.addTarget({
                kind: 'tan_biplane', mesh: bp.root, hitMeshes: bp.hit, pos: V(0, 10.5, -18),
                hp: 38, life: 0, points: 2600, appear: 'scale', death: 'burst', deathColor: 0xf97316,
                onKill: () => {
                    BO.FX.spawnExplosion(tgt.basePos.clone(), 7.5, 0xfacc15);
                    SFX.rumble(0.85);
                    D.biplaneDown = true;
                    D.biplane = null;
                    MG.finish('✈️ TAN BARON BIPLANE SHOT DOWN — BEDROOM SECURED!', { color: '#4ade80', delay: 2.0 });
                }
            });
            D.biplane = { tgt, bp, maxHp: 38, orbitA: 0, salvoCd: 2.8 };
            MG.toast('✈️ BOSS INBOUND: TAN BARON TOY BIPLANE CIRCLING OVERHEAD!', '#ef4444');
            SFX.horn && SFX.horn();
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            const D = S.data, P = BO.Player;
            D.allyCd = Math.max(0, D.allyCd - dt);

            // Rubber-Eraser Bounce Pads!
            for (const bp of D.bouncePads) {
                if (Math.hypot(P.pos.x - bp.x, P.pos.z - bp.z) < 1.35 && P.pos.y < 1.2) {
                    P.vel.y = 13.5; P.onGround = false;
                    SFX.boing();
                }
            }

            // Spawn Tan waves & trigger Toy Biplane Boss after 16 kills (or at 65s)!
            if (!D.biplaneSpawned && (D.waveKilled >= 16 || S.t >= 65)) {
                this._spawnBiplaneBoss(S);
            }
            D.spawnCd -= dt;
            if (D.spawnCd <= 0) {
                D.spawnCd = Math.max(1.35, 2.7 - S.t * 0.01);
                this._spawnTanEnemy(S);
            }

            // Update Green Allied Riflemen (auto-shoot nearest Tan enemy!)
            for (const al of D.allies) {
                al.fireCd -= dt;
                if (al.fireCd <= 0 && D.enemies.length > 0) {
                    al.fireCd = 1.35;
                    const liveEnemies = D.enemies.filter((e) => e.tgt.alive);
                    if (liveEnemies.length) {
                        const pick = liveEnemies[Math.floor(Math.random() * liveEnemies.length)];
                        al.fig.root.rotation.y = Math.atan2(pick.tgt.basePos.x - al.pos.x, pick.tgt.basePos.z - al.pos.z);
                        const from = al.pos.clone().add(V(0, 1.2, 0));
                        const to = pick.tgt.basePos.clone().add(V(0, 1.0, 0));
                        BO.FX.spawnTracer(from, to, 0x4ade80, 0.05, 0.10);
                        pick.tgt.hp--;
                        if (pick.tgt.hp <= 0) {
                            S.award(90, to, 'ALLY ASSIST', '#86efac');
                            pick.tgt.kill({ pt: to });
                        }
                    }
                }
            }

            // Update Tan Soldiers & Wind-Up Bomb-Bots
            for (const e of D.enemies.slice()) {
                if (!e.tgt.alive) continue;
                e.phase += dt * 8;
                if (e.para && e.tgt.basePos.y > 0.05) {
                    e.tgt.basePos.y = Math.max(0, e.tgt.basePos.y - 4.2 * dt);
                    e.tgt.basePos.x += Math.sin(S.t * 2 + e.phase) * 1.2 * dt;
                    e.tgt.root.position.copy(e.tgt.basePos);
                    if (e.tgt.basePos.y <= 0.05 && e.chute) { e.chute.visible = false; e.para = false; }
                    continue;
                }
                const goal = e.isBot ? D.hqPos : (Math.random() < 0.5 ? D.hqPos : P.pos);
                const dx = D.hqPos.x - e.tgt.basePos.x, dz = D.hqPos.z - e.tgt.basePos.z;
                const distHq = Math.max(0.1, Math.hypot(dx, dz));
                e.tgt.root.rotation.y = Math.atan2(dx, dz);

                if (distHq > (e.isBot ? 1.8 : 7.5)) {
                    e.tgt.basePos.x += (dx / distHq) * e.speed * dt;
                    e.tgt.basePos.z += (dz / distHq) * e.speed * dt;
                    e.tgt.root.position.copy(e.tgt.basePos);
                    if (e.fig) F.walk(e.fig, e.phase, 0.85, false);
                    if (e.bot) {
                        e.bot.keyPivot.rotation.z += dt * 12;
                        e.bot.root.rotation.z = Math.sin(e.phase * 1.8) * 0.10;
                    }
                } else if (e.isBot) {
                    // Tin Bomb-Bot self-destructs on Green HQ Flag!
                    BO.FX.spawnExplosion(e.tgt.basePos.clone().add(V(0, 0.8, 0)), 3.8, 0xef4444);
                    D.flagHp = Math.max(0, D.flagHp - 16);
                    MG.toast('💥 TIN BOMB-BOT DETONATED AT GREEN HQ!', '#f87171');
                    e.tgt.remove();
                    D.enemies = D.enemies.filter((x) => x !== e);
                    continue;
                } else {
                    e.atkCd -= dt;
                    if (e.atkCd <= 0) {
                        e.atkCd = 2.0;
                        const from = e.tgt.basePos.clone().add(V(0, 1.25, 0));
                        BO.FX.spawnTracer(from, P.pos.clone().add(V(0, 1.1, 0)), 0xfacc15, 0.04, 0.10);
                        P.takeDamage(6, from, true);
                        D.flagHp = Math.max(0, D.flagHp - 2.5);
                    }
                }
            }

            // Update Tan Baron Toy Biplane Boss
            if (D.biplane && D.biplane.tgt.alive) {
                const bp = D.biplane;
                bp.orbitA += dt * 0.65;
                const bx = Math.cos(bp.orbitA) * 16.5, bz = Math.sin(bp.orbitA) * 14.5 - 2;
                const by = 9.8 + Math.sin(S.t * 2.1) * 1.4;
                bp.tgt.basePos.set(bx, by, bz);
                bp.tgt.root.position.copy(bp.tgt.basePos);
                bp.tgt.root.rotation.y = Math.atan2(-Math.sin(bp.orbitA), Math.cos(bp.orbitA));
                bp.bp.root.rotation.z = 0.36;
                bp.bp.prop.rotation.z += dt * 32;
                bp.salvoCd -= dt;
                if (bp.salvoCd <= 0) {
                    bp.salvoCd = 2.9;
                    BO.FX.spawnTracer(bp.tgt.basePos.clone(), P.pos.clone().add(V(0, 1.0, 0)), 0xef4444, 0.12, 0.16);
                    P.takeDamage(10, bp.tgt.basePos, true);
                    D.flagHp = Math.max(0, D.flagHp - 4);
                }
            }

            if (D.flagHp <= 0) MG.finish('GREEN COMMAND FLAG OVERRUN', { color: '#f87171' });
            else if (!P.alive) MG.finish('GREEN COMMANDO MELTED', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, bp = D.biplane;
            return `<div class="fun-panel">
                <div class="mgx-chip ${D.flagHp < 35 ? 'mgx-hot' : ''}">★ GREEN HQ <b>${Math.ceil(D.flagHp)}%</b></div>
                <div class="mgx-chip">TAN TROOPS SLAIN <b>${D.waveKilled}</b></div>
                <div class="mgx-chip ${D.allyCd <= 0 ? 'mgx-hot' : ''}">GREEN SQUAD [Q] <b>${D.allyCd <= 0 ? 'READY' : D.allyCd.toFixed(0) + 's'}</b></div>
            </div>
            ${bp && bp.tgt.alive ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>✈️ TAN BARON TOY BIPLANE</span><b>${Math.max(0, Math.round(bp.tgt.hp))} / ${bp.maxHp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(bp.tgt.hp / bp.maxHp * 100))}%;background:linear-gradient(90deg,#ef4444,#facc15)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.biplaneDown ? 'SUPREME BEDROOM GENERAL' : 'TOY WAR CONCLUDED',
                stats: [['TAN FORCES DEFEATED', D.waveKilled], ['TAN BARON BIPLANE', D.biplaneDown ? 'SHOT DOWN' : D.biplaneSpawned ? 'SURVIVED' : 'NOT REACHED'], ['HQ FLAG INTEGRITY', Math.ceil(D.flagHp) + '%']],
                xp: Math.round(175 + S.score * 0.032 + stars * 150)
            };
        }
    });

    /* =====================================================================
       14. GRANDMASTER BATTLE-CHESS FPS
       Illuminated Marble & Obsidian Chess Cathedral + Sculpted Lathe Pieces +
       Tactical Command [E] + Real-Time FPS Combat!
    ===================================================================== */
    const CHESS_SPECS = {
        pawn: { name: 'PAWN', hp: 3, pts: 180, sc: 0.9, spd: 2.5 },
        knight: { name: 'KNIGHT', hp: 6, pts: 380, sc: 1.15, spd: 4.2 },
        bishop: { name: 'BISHOP', hp: 5, pts: 360, sc: 1.15, spd: 3.0 },
        rook: { name: 'ROOK', hp: 9, pts: 480, sc: 1.25, spd: 2.2 },
        queen: { name: 'BLACK QUEEN', hp: 16, pts: 950, sc: 1.42, spd: 3.6 },
        king: { name: 'OBSIDIAN KING', hp: 34, pts: 2400, sc: 1.65, spd: 2.0 }
    };

    function buildChessPiece(role, isBlack) {
        const sc = CHESS_SPECS[role].sc;
        const root = new THREE.Group();
        const hit = [];
        const mainCol = isBlack ? 0x1e1b4b : 0xf8fafc;
        const trimCol = isBlack ? 0xef4444 : 0xfacc15;
        const stoneMat = new THREE.MeshStandardMaterial({
            color: mainCol, roughness: 0.18, metalness: isBlack ? 0.55 : 0.25,
            emissive: isBlack ? 0x311042 : 0x334155, emissiveIntensity: 0.22
        });
        const trimMat = std(trimCol, 0.22, 0.88, { emissive: trimCol, emissiveIntensity: 0.28 });

        // Lathe-turned Classical Chess Pedestal & Column!
        const pts = [
            new THREE.Vector2(0.01, 0), new THREE.Vector2(0.72 * sc, 0.02), new THREE.Vector2(0.70 * sc, 0.18 * sc),
            new THREE.Vector2(0.54 * sc, 0.34 * sc), new THREE.Vector2(0.38 * sc, 1.15 * sc),
            new THREE.Vector2(0.50 * sc, 1.32 * sc), new THREE.Vector2(0.34 * sc, 1.48 * sc)
        ];
        const stem = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), stoneMat);
        const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.68 * sc, 0.05 * sc, 8, 24), trimMat);
        baseRing.rotation.x = Math.PI / 2; baseRing.position.y = 0.19 * sc;
        const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.46 * sc, 0.045 * sc, 8, 20), trimMat);
        collarRing.rotation.x = Math.PI / 2; collarRing.position.y = 1.32 * sc;
        root.add(stem, baseRing, collarRing);
        hit.push(stem);

        // Distinct Sculpted Crown Archetype per Chess Piece!
        let crown;
        if (role === 'pawn') {
            crown = new THREE.Mesh(new THREE.SphereGeometry(0.42 * sc, 18, 14), stoneMat);
            crown.position.y = 1.82 * sc;
        } else if (role === 'rook') {
            crown = new THREE.Group();
            crown.position.y = 1.75 * sc;
            const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.54 * sc, 0.44 * sc, 0.65 * sc, 16), stoneMat);
            crown.add(tower); hit.push(tower);
            for (let b = 0; b < 6; b++) {
                const a = (b / 6) * TAU;
                const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sc, 0.28 * sc, 0.22 * sc), trimMat);
                merlon.position.set(Math.cos(a) * 0.44 * sc, 0.42 * sc, Math.sin(a) * 0.44 * sc);
                crown.add(merlon);
            }
        } else if (role === 'knight') {
            crown = new THREE.Group();
            crown.position.y = 1.45 * sc;
            const neck = new THREE.Mesh(new THREE.BoxGeometry(0.44 * sc, 0.85 * sc, 0.56 * sc), stoneMat);
            neck.position.y = 0.35 * sc; neck.rotation.x = -0.25;
            const snout = new THREE.Mesh(new THREE.ConeGeometry(0.32 * sc, 0.72 * sc, 8), stoneMat);
            snout.rotation.x = Math.PI * 0.45; snout.position.set(0, 0.68 * sc, 0.42 * sc);
            const mane = new THREE.Mesh(new THREE.BoxGeometry(0.14 * sc, 0.88 * sc, 0.25 * sc), trimMat);
            mane.position.set(0, 0.45 * sc, -0.26 * sc);
            crown.add(neck, snout, mane); hit.push(neck, snout);
        } else if (role === 'bishop') {
            crown = new THREE.Group();
            crown.position.y = 1.85 * sc;
            const mitre = new THREE.Mesh(new THREE.SphereGeometry(0.45 * sc, 16, 14), stoneMat);
            mitre.scale.set(0.85, 1.45, 0.85);
            const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14 * sc, 10, 8), trimMat);
            orb.position.y = 0.70 * sc;
            crown.add(mitre, orb); hit.push(mitre);
        } else if (role === 'queen') {
            crown = new THREE.Group();
            crown.position.y = 1.85 * sc;
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.48 * sc, 18, 14), stoneMat);
            const coronet = new THREE.Mesh(new THREE.CylinderGeometry(0.56 * sc, 0.38 * sc, 0.42 * sc, 12), trimMat);
            coronet.position.y = 0.35 * sc;
            crown.add(dome, coronet); hit.push(dome, coronet);
        } else {
            // OBSIDIAN / MARBLE KING with Royal Cross Finial!
            crown = new THREE.Group();
            crown.position.y = 1.92 * sc;
            const mitre = new THREE.Mesh(new THREE.CylinderGeometry(0.58 * sc, 0.40 * sc, 0.72 * sc, 16), stoneMat);
            const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.18 * sc, 0.72 * sc, 0.18 * sc), trimMat);
            crossV.position.y = 0.68 * sc;
            const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.56 * sc, 0.18 * sc, 0.18 * sc), trimMat);
            crossH.position.y = 0.74 * sc;
            crown.add(mitre, crossV, crossH); hit.push(mitre, crossV);
        }
        if (crown.isMesh) crown.userData.hitbox = 'head';
        else crown.traverse((m) => { if (m.isMesh) m.userData.hitbox = 'head'; });
        root.add(crown);
        root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        return { root, hit };
    }

    MG.register({
        id: 'fun_chess_fps', cat: 'fun', order: 14,
        name: 'Grandmaster Battle-Chess FPS', icon: '♟️', accent: '#c084fc', badge: 'TACTICAL CHESS',
        tagline: 'Walk a giant 8x8 Marble Chessboard, command White Pieces [E] & shatter the Obsidian King!',
        desc: 'Step onto a colossal 32m × 32m Illuminated Marble & Obsidian Chessboard inside the Grandmaster Cathedral! Black Knights leap in L-arcs creating shockwaves, Black Rooks charge straight down files & ranks, Black Bishops fire diagonal arcane beams, and the Black Queen guards the shielded OBSIDIAN KING! Press [E] to issue a ROYAL ADVANCE to your White Pieces, capture glowing Gold Center Squares for 2x Weapon Empower, break the King\'s Royal Guard, and score CHECKMATE!',
        guide: {
            objective: 'Protect your White King on Rank 1 while eliminating the Black Royal Guard (Knights, Bishops, Rooks, Queen) to lower the Obsidian King\'s shield and shatter him for CHECKMATE!',
            tips: [
                'Stand inside either glowing GOLD POWER SQUARE in the center of the board (d4 / e5) for +65% bonus score and rapid health regen!',
                'Press [E] (12s cooldown) to blow the Royal Horn—all surviving White Pieces surge forward and blast nearby Black pieces!',
                'The Obsidian King has a purple Aegis Shield while the Black Queen or Rooks live—take out his heavy pieces first, then aim for his Golden Cross Crown!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • REAL-TIME BATTLE CHESS', duration: 165,
        stars: [2800, 5400, 8600, 12500],
        standardWeapon: 'scarh', lockWeapon: true, infiniteMag: true, forgivingMisses: true,
        weaponLabel: 'GRANDMASTER SCAR-H + ROYAL HORN [E]', weaponNote: '[E] Command White Surge (12s) • Stand on Gold Center Squares for Power Boost!',
        keys: [['WASD', 'Cross the 8x8 Board'], ['E', 'Command White Surge (12s)'], ['SPACE', 'Jump Knight Shockwaves'], ['LMB', 'Shatter Black Pieces']],
        map: {
            atmosphere: { skyTop: 0x090418, skyBottom: 0x311042, fogColor: 0x160929, fogDensity: 0.007, sunColor: 0xfef3c7, sunIntensity: 1.55, sunPos: [20, 55, 25], hemiSky: 0xe9d5ff, hemiGround: 0x1e1b4b, hemiIntensity: 0.95 },
            boxes: [
                B(0, -0.5, 0, 44, 1, 44, 'concrete'),
                B(-22, 6, 0, 1, 12, 44, 'concrete'), B(22, 6, 0, 1, 12, 44, 'concrete'),
                B(0, 6, -22, 44, 12, 1, 'concrete'), B(0, 6, 22, 44, 12, 1, 'concrete')
            ],
            spawn: { x: 0, y: 0.1, z: 12, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            const D = S.data;
            const SQ = 4.0; // 8x8 * 4m = 32m x 32m giant chessboard!
            Object.assign(D, {
                sq: SQ, blackPieces: [], whitePieces: [], whiteKingHp: 100,
                commandCd: 0, reinforceCd: 8.0, checkmate: false, powerZone: false
            });

            // 8x8 Veined Marble & Polished Obsidian Board Texture + Coordinate Border!
            const boardTex = L.canvasTex('chess-cathedral-board', 512, 512, (g, w, h) => {
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const light = (r + c) % 2 === 0;
                        g.fillStyle = light ? '#f1f5f9' : '#1e1b4b';
                        g.fillRect(c * 64, r * 64, 64, 64);
                        g.strokeStyle = light ? 'rgba(148,163,184,0.35)' : 'rgba(192,132,252,0.28)';
                        g.lineWidth = 2;
                        g.strokeRect(c * 64 + 2, r * 64 + 2, 60, 60);
                    }
                }
            });
            const board = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.18, metalness: 0.25 }));
            board.rotation.x = -Math.PI / 2; board.position.y = 0.03; board.receiveShadow = true; S.add(board);

            const border = new THREE.Mesh(new THREE.RingGeometry(22.6, 25.5, 4), std(0x78350f, 0.45, 0.5));
            border.rotation.x = -Math.PI / 2; border.rotation.z = Math.PI / 4; border.position.y = 0.02; S.add(border);

            // Cathedral Marble Columns + Stained-Glass Neon Arches around the board!
            const colMat = std(0xe2e8f0, 0.35, 0.2), goldM = std(0xfacc15, 0.25, 0.88);
            for (let i = -16; i <= 16; i += 8) {
                for (const side of [-19.5, 19.5]) {
                    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 11, 16), colMat);
                    p1.position.set(side, 5.5, i);
                    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), goldM);
                    cap.position.set(side, 11.1, i);
                    S.add(p1); S.add(cap);
                }
            }
            const banner = A.sign('♟️ GRANDMASTER CATHEDRAL — PROTECT WHITE KING & SHATTER OBSIDIAN KING ♟️', 14, 1.2, { bg: '#1e1b4b', color: '#fde047', borderColor: '#c084fc', size: 0.34, glow: '#c084fc' });
            banner.position.set(0, 9.2, -21.2); S.add(banner);

            // 2 Glowing Gold Center Power Squares (d4 = (-2, 2), e5 = (2, -2))
            D.powerSquares = [V(-2, 0.05, 2), V(2, 0.05, -2)];
            for (const ps of D.powerSquares) {
                const ring = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.75, 24), basic(0xfacc15));
                ring.rotation.x = -Math.PI / 2; ring.position.copy(ps); S.add(ring);
                const lbl = labelSprite('⚡ GRANDMASTER BUFF ZONE', '#fde047', 2.4);
                lbl.position.set(ps.x, 1.2, ps.z); S.add(lbl);
            }

            const cellToWorld = (col, row) => V((col - 3.5) * SQ, 0, (row - 3.5) * SQ);

            // Spawn White King (e1 = col 4, row 7 -> z = +14) + 4 White Vanguard Allies!
            const wkVis = buildChessPiece('king', false);
            wkVis.root.position.copy(cellToWorld(4, 7));
            const wkLbl = labelSprite('👑 WHITE KING', '#fde047', 2.2);
            wkLbl.position.set(0, 4.2, 0); wkVis.root.add(wkLbl);
            S.add(wkVis.root);
            D.whiteKingPos = cellToWorld(4, 7);

            const whiteLineup = [['rook', 1, 6], ['knight', 2, 6], ['bishop', 5, 6], ['rook', 6, 6]];
            for (const [role, c, r] of whiteLineup) {
                const wv = buildChessPiece(role, false);
                const wp = cellToWorld(c, r);
                wv.root.position.copy(wp); S.add(wv.root);
                D.whitePieces.push({ role, vis: wv, pos: wp, baseZ: wp.z, surgeT: 0, atkCd: 1.2 });
            }

            // Spawn Full Black Royal Lineup on Ranks 8 & 7 (z = -14 & -10)
            const backRow = [['rook', 0, 0], ['knight', 1, 0], ['bishop', 2, 0], ['queen', 3, 0], ['king', 4, 0], ['bishop', 5, 0], ['knight', 6, 0], ['rook', 7, 0]];
            for (const [role, c, r] of backRow) this._spawnBlackPiece(S, role, cellToWorld(c, r));
            for (let c = 1; c <= 6; c += 2) this._spawnBlackPiece(S, 'pawn', cellToWorld(c, 1));

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyE') this._triggerRoyalSurge(S);
            };
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
        },
        _spawnBlackPiece(S, role, pos) {
            const D = S.data;
            const spec = CHESS_SPECS[role];
            const vis = buildChessPiece(role, true);
            const isKing = role === 'king';
            let shieldMesh = null;
            if (isKing) {
                shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(2.35, 20, 14), new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.28, wireframe: true }));
                shieldMesh.position.y = 2.0; shieldMesh.userData.noHit = true;
                vis.root.add(shieldMesh);
            }
            const lbl = labelSprite(spec.name, isKing ? '#f472b6' : '#fca5a5', 2.0);
            lbl.position.y = 3.8 * spec.sc;
            vis.root.add(lbl);

            const tgt = S.addTarget({
                kind: 'chess_' + role, mesh: vis.root, hitMeshes: vis.hit, pos,
                hp: spec.hp, life: 0, points: spec.pts, appear: 'scale', death: 'shatter',
                deathColor: isKing ? 0xfacc15 : 0xc084fc,
                onDamage: (t, info) => {
                    if (isKing && this._royalGuardAlive(S)) {
                        t.hp = Math.min(spec.hp, t.hp + 0.7); // 70% damage reduction while Queen/Rooks guard him!
                        MG.popup(info.pt, '🛡️ ROYAL GUARD SHIELD!', '#c084fc');
                    } else if (D.powerZone) {
                        t.hp = Math.max(1, t.hp - 0.8);
                    }
                },
                onKill: () => {
                    D.blackPieces = D.blackPieces.filter((p) => p.tgt !== tgt);
                    if (isKing) {
                        D.checkmate = true;
                        BO.FX.spawnExplosion(tgt.basePos.clone().add(V(0, 2, 0)), 8.0, 0xfacc15);
                        SFX.fanfare();
                        MG.finish('♟️ CHECKMATE — OBSIDIAN KING SHATTERED!', { color: '#fde047', delay: 2.0 });
                    }
                }
            });
            const entry = { role, spec, tgt, vis, shieldMesh, moveCd: 1.5 + Math.random() * 1.8, goal: pos.clone(), leaping: 0 };
            D.blackPieces.push(entry);
            if (isKing) D.blackKing = entry;
        },
        _royalGuardAlive(S) {
            return S.data.blackPieces.some((p) => p.tgt.alive && (p.role === 'queen' || p.role === 'rook'));
        },
        _triggerRoyalSurge(S) {
            const D = S.data;
            if (D.commandCd > 0) { MG.toast(`⏳ ROYAL HORN RECHARGING (${D.commandCd.toFixed(1)}s)`, '#94a3b8'); return; }
            D.commandCd = 12.0;
            tone(392, 587, 0.22, 'sawtooth', 0.12);
            tone(587, 784, 0.28, 'sawtooth', 0.12, 0.10);
            MG.toast('📯 WHITE ROYAL ADVANCE — ALLIED PIECES SURGING!', '#fde047');
            for (const wp of D.whitePieces) {
                wp.surgeT = 4.5;
                // Blast nearest black piece with radiant lance!
                const foes = D.blackPieces.filter((b) => b.tgt.alive && b.role !== 'king');
                if (foes.length) {
                    foes.sort((a, b) => a.tgt.basePos.distanceTo(wp.pos) - b.tgt.basePos.distanceTo(wp.pos));
                    const f = foes[0];
                    BO.FX.spawnTracer(wp.pos.clone().add(V(0, 1.8, 0)), f.tgt.basePos.clone().add(V(0, 1.5, 0)), 0xfde047, 0.16, 0.22);
                    f.tgt.hp -= 3;
                    if (f.tgt.hp <= 0) {
                        S.award(250, f.tgt.basePos.clone().add(V(0, 2, 0)), '⚔️ WHITE CAPTURE!', '#fde047');
                        f.tgt.kill({ pt: f.tgt.basePos });
                    }
                }
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            const D = S.data, P = BO.Player;
            D.commandCd = Math.max(0, D.commandCd - dt);

            // Check if player stands on either Gold Center Power Square
            D.powerZone = D.powerSquares.some((ps) => Math.hypot(P.pos.x - ps.x, P.pos.z - ps.z) < 2.2);
            if (D.powerZone && P.hp < P.maxHp) P.hp = Math.min(P.maxHp, P.hp + 8 * dt);

            // Update Obsidian King shield visibility
            if (D.blackKing && D.blackKing.shieldMesh) {
                D.blackKing.shieldMesh.visible = this._royalGuardAlive(S);
                D.blackKing.shieldMesh.rotation.y += dt * 1.4;
            }

            // Reinforce Black Pawns/Knights periodically while King lives
            D.reinforceCd -= dt;
            if (D.reinforceCd <= 0 && D.blackPieces.length < 11) {
                D.reinforceCd = 9.5;
                const rRole = Math.random() < 0.35 ? 'knight' : Math.random() < 0.65 ? 'bishop' : 'pawn';
                const col = Math.floor(Math.random() * 8);
                this._spawnBlackPiece(S, rRole, V((col - 3.5) * D.sq, 0, -14));
            }

            // Animate White Pieces surging & returning
            for (const wp of D.whitePieces) {
                if (wp.surgeT > 0) {
                    wp.surgeT -= dt;
                    wp.pos.z = lerp(wp.pos.z, -2.0, dt * 2.2);
                } else {
                    wp.pos.z = lerp(wp.pos.z, wp.baseZ, dt * 1.5);
                }
                wp.vis.root.position.copy(wp.pos);
            }

            // Authentic Chess-Archetype Movement & Attacks for Black Pieces!
            for (const bp of D.blackPieces) {
                if (!bp.tgt.alive) continue;
                bp.moveCd -= dt;
                if (bp.moveCd <= 0) {
                    bp.moveCd = bp.role === 'knight' ? 3.2 : bp.role === 'bishop' ? 2.8 : 2.4;
                    const cur = bp.tgt.basePos;
                    if (bp.role === 'knight') {
                        // L-jump toward player or White King!
                        const target = Math.random() < 0.6 ? P.pos : D.whiteKingPos;
                        const dirX = Math.sign(target.x - cur.x) || 1, dirZ = Math.sign(target.z - cur.z) || 1;
                        bp.goal.set(BO.Math.clamp(cur.x + dirX * D.sq, -14, 14), 0, BO.Math.clamp(cur.z + dirZ * D.sq * 2, -14, 14));
                        bp.leaping = 0.65;
                    } else if (bp.role === 'rook') {
                        // Orthogonal Rook Charge along rank or file!
                        if (Math.abs(P.pos.x - cur.x) < Math.abs(P.pos.z - cur.z)) bp.goal.set(cur.x, 0, BO.Math.clamp(cur.z + Math.sign(P.pos.z - cur.z) * D.sq * 2, -14, 14));
                        else bp.goal.set(BO.Math.clamp(cur.x + Math.sign(P.pos.x - cur.x) * D.sq * 2, -14, 14), 0, cur.z);
                    } else if (bp.role === 'bishop' || bp.role === 'queen') {
                        // Diagonal glide + Arcane Beam shot!
                        const sx = Math.sign(P.pos.x - cur.x) || 1, sz = Math.sign(P.pos.z - cur.z) || 1;
                        bp.goal.set(BO.Math.clamp(cur.x + sx * D.sq, -14, 14), 0, BO.Math.clamp(cur.z + sz * D.sq, -14, 12));
                        if (cur.distanceTo(P.pos) < 24) {
                            BO.FX.spawnTracer(cur.clone().add(V(0, 2.2, 0)), P.pos.clone().add(V(0, 1.1, 0)), 0xc084fc, 0.10, 0.16);
                            P.takeDamage(bp.role === 'queen' ? 11 : 7, cur, true);
                        }
                    } else if (bp.role === 'pawn') {
                        bp.goal.set(cur.x, 0, Math.min(14, cur.z + D.sq));
                    } else if (bp.role === 'king') {
                        bp.goal.set(BO.Math.clamp(cur.x + (Math.random() < 0.5 ? -D.sq : D.sq), -10, 10), 0, -12);
                    }
                }

                // Slide / Leap toward goal square
                bp.tgt.basePos.x = lerp(bp.tgt.basePos.x, bp.goal.x, dt * bp.spec.spd);
                bp.tgt.basePos.z = lerp(bp.tgt.basePos.z, bp.goal.z, dt * bp.spec.spd);
                if (bp.leaping > 0) {
                    bp.leaping -= dt;
                    bp.tgt.basePos.y = Math.sin(clamp01(bp.leaping / 0.65) * Math.PI) * 3.8;
                    if (bp.leaping <= 0) {
                        bp.tgt.basePos.y = 0;
                        BO.FX.spawnParticles(bp.tgt.basePos.clone().add(V(0, 0.2, 0)), 14, 0xc084fc, 4.5, 2, 0.35, 0.8);
                        if (Math.hypot(P.pos.x - bp.tgt.basePos.x, P.pos.z - bp.tgt.basePos.z) < 3.6 && P.pos.y < 0.9) {
                            P.takeDamage(12, bp.tgt.basePos, true);
                        }
                    }
                }
                bp.tgt.root.position.copy(bp.tgt.basePos);

                // Attack White King if a Black Piece reaches Rank 1!
                if (bp.tgt.basePos.distanceTo(D.whiteKingPos) < 2.6) {
                    D.whiteKingHp = Math.max(0, D.whiteKingHp - 9 * dt);
                }
            }

            if (D.whiteKingHp <= 0) MG.finish('CHECKMATED — WHITE KING FELL', { color: '#f87171' });
            else if (!P.alive) MG.finish('GRANDMASTER FELLED ON THE BOARD', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, bk = D.blackKing;
            const guardUp = this._royalGuardAlive(S);
            return `<div class="fun-panel">
                <div class="mgx-chip ${D.whiteKingHp < 35 ? 'mgx-hot' : ''}">👑 WHITE KING <b>${Math.ceil(D.whiteKingHp)}%</b></div>
                <div class="mgx-chip ${D.commandCd <= 0 ? 'mgx-hot' : ''}">📯 ROYAL SURGE [E] <b>${D.commandCd <= 0 ? 'READY' : D.commandCd.toFixed(0) + 's'}</b></div>
                ${D.powerZone ? '<div class="mgx-chip mgx-hot">⚡ CENTER POWER SQUARE ACTIVE!</div>' : ''}
            </div>
            ${bk && bk.tgt.alive ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>♟️ OBSIDIAN KING ${guardUp ? '(🛡️ ROYAL GUARD ACTIVE)' : '(VULNERABLE!)'}</span><b>${Math.max(0, Math.round(bk.tgt.hp))} / ${bk.spec.hp}</b></div><div class="fun-bar"><i style="width:${Math.max(0, Math.round(bk.tgt.hp / bk.spec.hp * 100))}%;background:linear-gradient(90deg,#a855f7,#fde047)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.checkmate ? 'SUPREME FPS GRANDMASTER' : 'MATCH ADJOURNED',
                stats: [['CHECKMATE DELIVERED', D.checkmate ? 'YES' : 'NO'], ['BLACK PIECES CAPTURED', S.kills], ['WHITE KING INTEGRITY', Math.ceil(D.whiteKingHp) + '%']],
                xp: Math.round(180 + S.score * 0.032 + stars * 155)
            };
        }
    });

    /* =====================================================================
       15. ECTOPLASM GHOST-HUNTER MANSION
       Victorian Haunted Ballroom + First-Person Proton Wand & PKE Meter +
       Proton Stream Wrangling [LMB] + Ghost Trap Capture Beam [E / G] +
       LORD VOLTAIRE Phantom Pipe-Organ Boss!
    ===================================================================== */
    const GHOST_KINDS = [
        { id: 'slimer', name: 'GLUTTON ECTO-BLOB', col: 0x4ade80, hp: 100, pts: 450, spd: 3.6 },
        { id: 'librarian', name: 'WEEPING BANSHEE', col: 0x38bdf8, hp: 120, pts: 550, spd: 4.4 },
        { id: 'knight', name: 'POSSESSED ARMOR', col: 0xc084fc, hp: 150, pts: 680, spd: 2.9 },
        { id: 'voltaire', name: 'LORD VOLTAIRE (MAESTRO)', col: 0xf43f5e, hp: 420, pts: 2800, spd: 3.2, boss: true }
    ];

    function buildSpecterMesh(spec) {
        const sc = spec.boss ? 1.75 : 1.0;
        const root = new THREE.Group();
        const ectoMat = new THREE.MeshStandardMaterial({
            color: spec.col, emissive: spec.col, emissiveIntensity: 0.65,
            roughness: 0.15, transparent: true, opacity: 0.84
        });

        // Swirling tapered ghostly tail + puffed ectoplasm torso + expressive glowing eyes/mouth
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.55 * sc, 1.15 * sc, 14), ectoMat);
        tail.rotation.x = Math.PI; tail.position.y = 0.65 * sc;
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.68 * sc, 18, 14), ectoMat);
        belly.scale.set(1.08, 1.15, 0.95); belly.position.y = 1.45 * sc;
        root.add(tail, belly);

        for (const sx of [-0.24, 0.24]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13 * sc, 10, 8), basic(0xfef08a));
            eye.position.set(sx * sc, 1.65 * sc, 0.56 * sc);
            const pup = new THREE.Mesh(new THREE.SphereGeometry(0.06 * sc, 8, 6), basic(0x090d16));
            pup.position.set(sx * sc, 1.65 * sc, 0.66 * sc);
            const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14 * sc, 0.45 * sc, 5, 8), ectoMat);
            arm.position.set(sx * 3.1 * sc, 1.42 * sc, 0.2 * sc); arm.rotation.z = sx > 0 ? -0.6 : 0.6;
            root.add(eye, pup, arm);
        }
        const maw = new THREE.Mesh(new THREE.SphereGeometry(0.22 * sc, 10, 8), basic(0x090d16));
        maw.scale.set(1.3, 0.85, 0.5); maw.position.set(0, 1.32 * sc, 0.62 * sc);
        root.add(maw);

        if (spec.id === 'knight' || spec.boss) {
            const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * sc, 0.48 * sc, 0.52 * sc, 12), std(spec.boss ? 0xfacc15 : 0x94a3b8, 0.25, 0.88));
            helm.position.y = 2.15 * sc;
            root.add(helm);
        }
        return root;
    }

    MG.register({
        id: 'fun_ghost_hunters', cat: 'fun', order: 15,
        name: 'Ectoplasm Ghost-Hunter Mansion', icon: '👻', accent: '#4ade80', badge: 'PROTON TRAP',
        tagline: 'Wrangle ghosts with your 3D Proton Stream, toss Floor Ghost Traps [E/G] & banish Lord Voltaire!',
        desc: 'Enter the Haunted Ravenwood Grand Ballroom armed with a custom 3D Neutrona Proton Wand & PKE Meter! Hold [LMB] to lash swirling orange-and-cyan Proton Streams onto Glutton Ecto-Blobs, Weeping Banshees, and Possessed Armor to drain their Psychokinetic Stamina—then press [E / G] to slide a hazard-striped Ghost Trap underneath them and slam them into the containment grid! Vent your pack with [R] before overheating, and capture 8 ghosts to awaken LORD VOLTAIRE at the Haunted Pipe Organ!',
        guide: {
            objective: 'Drain ghosts to ≤ 35% Stamina with your [LMB] Proton Stream and capture them inside your [E / G] Floor Ghost Trap (or overload-vaporize them at 0%), then trap LORD VOLTAIRE!',
            tips: [
                'Capturing a weakened ghost (≤ 40% Stamina) in a Floor Ghost Trap [E / G] pays DOUBLE POINTS (+900) compared to brute-force Proton vaporization!',
                'Watch your PROTON HEAT bar—press [R] to manually vent steam rapidly so your Neutrona Wand never overheats!',
                'Your left-hand PKE Meter wings open wider and beep faster whenever an invisible or flanking specter drifts close!'
            ]
        },
        heroLabel: 'FUN & SPECIALS • PARANORMAL CONTAINMENT', duration: 165,
        stars: [2800, 5600, 9200, 13200],
        standardWeapon: 'm1911', lockWeapon: true, blockFire: true, hideViewmodel: true, infiniteMag: true, forgivingMisses: true,
        weaponLabel: 'NEUTRONA PROTON WAND + GHOST TRAP [E/G]', weaponNote: 'Hold [LMB] Proton Stream • [E / G] Toss Ghost Trap • [R] Vent Heat',
        keys: [['WASD', 'Patrol Ballroom'], ['HOLD LMB', 'Proton Stream Lash'], ['E / G', 'Toss Ghost Trap'], ['R', 'Vent Pack Heat']],
        map: {
            atmosphere: { skyTop: 0x030712, skyBottom: 0x1e1b4b, fogColor: 0x0b0f1d, fogDensity: 0.015, sunColor: 0x86efac, sunIntensity: 0.55, sunPos: [10, 30, 10], hemiSky: 0x818cf8, hemiGround: 0x1e1b4b, hemiIntensity: 0.85 },
            boxes: [
                B(0, -0.5, 0, 38, 1, 42, 'wood'),
                B(-19, 5, 0, 1, 10, 42, 'brick'), B(19, 5, 0, 1, 10, 42, 'brick'),
                B(0, 5, -21, 38, 10, 1, 'brick'), B(0, 5, 21, 38, 10, 1, 'brick')
            ],
            spawn: { x: 0, y: 0.1, z: 14, yaw: 0 }
        },
        countdown: 3,
        build(S) {
            const D = S.data;
            Object.assign(D, {
                ghosts: [], traps: [], ectoBolts: [], heat: 0, overheated: false,
                captured: 0, bossSpawned: false, bossTrapped: false, spawnCd: 1.0, trapCd: 0, beamSoundCd: 0
            });

            // Haunted Victorian Ballroom Parquet + Crimson Grand Rug + Grand Pipe Organ at North End (z = -19.2)!
            const floorTex = L.canvasTex('haunted-parquet', 256, 256, (g, w, h) => {
                g.fillStyle = '#291709'; g.fillRect(0, 0, w, h);
                for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
                    g.fillStyle = (x + y) % 2 ? '#3b2110' : '#231207';
                    g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30);
                }
            });
            floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(6, 6);
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(37, 41), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.45 }));
            floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; S.add(floor);

            const rug = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 32), std(0x4c0519, 0.9));
            rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.03, -1); S.add(rug);

            // Grand Gothic Pipe Organ Stage at z = -18.5!
            const organG = new THREE.Group();
            organG.position.set(0, 0, -18.8);
            const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(9.5, 2.6, 2.2), std(0x3b180c, 0.65));
            consoleBox.position.y = 1.3; organG.add(consoleBox);
            const keysMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 0.55), std(0xf8fafc, 0.3));
            keysMesh.position.set(0, 1.55, 1.15); organG.add(keysMesh);
            const brassM = std(0xd97706, 0.25, 0.88);
            for (let i = -7; i <= 7; i++) {
                const h = 7.4 - Math.abs(i) * 0.42;
                const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, h, 12), brassM);
                pipe.position.set(i * 0.62, 2.4 + h / 2, -0.4);
                organG.add(pipe);
            }
            S.add(organG);
            S.collider(-5, 0, -20.2, 5, 6, -17.4);

            // Haunted Floating Chandeliers & Possessed Portraits along Ballroom Columns!
            D.chandeliers = [];
            for (const cz of [-9, 4]) {
                const ch = new THREE.Group();
                ch.position.set(0, 6.8, cz);
                const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.09, 8, 24), brassM);
                ring.rotation.x = Math.PI / 2; ch.add(ring);
                for (let k = 0; k < 6; k++) {
                    const a = (k / 6) * TAU;
                    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), basic(0x4ade80));
                    flame.position.set(Math.cos(a) * 1.8, 0.22, Math.sin(a) * 1.8);
                    ch.add(flame);
                }
                const ptLight = new THREE.PointLight(0x4ade80, 1.1, 22, 1.6);
                ch.add(ptLight);
                S.add(ch);
                D.chandeliers.push(ch);
            }

            for (const sx of [-15.5, 15.5]) {
                for (const sz of [-12, -3, 6]) {
                    S.box(sx, 2.2, sz, 1.4, 4.4, 1.4, std(0x334155, 0.7), { solid: true });
                    S.add(A.torch(S, V(sx - Math.sign(sx) * 0.9, 1.2, sz), 0x818cf8, false));
                }
            }
            const sign = A.sign('👻 RAVENWOOD BALLROOM — WRANGLE [LMB] & TRAP [E/G]! 👻', 11.5, 1.05, { bg: '#052e16', color: '#86efac', borderColor: '#4ade80', size: 0.34, glow: '#4ade80' });
            sign.position.set(0, 7.6, -20.2); S.add(sign);

            // First-Person 3D Neutrona Proton Wand (Right) + PKE Meter (Left) + Dynamic Proton Beam Meshes!
            D.rig = new THREE.Group();
            S.add(D.rig);

            // Right-hand Neutrona Proton Wand
            const wand = new THREE.Group();
            wand.position.set(0.36, -0.32, -0.58);
            const wBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.56), std(0x1e293b, 0.4, 0.75));
            const wBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.42, 12), std(0x94a3b8, 0.25, 0.88));
            wBarrel.rotation.x = Math.PI / 2; wBarrel.position.z = -0.44;
            const wTip = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16), basic(0xf97316));
            wTip.position.z = -0.65;
            wand.add(wBody, wBarrel, wTip);
            D.wand = wand;
            D.wandTip = wTip;
            D.rig.add(wand);

            // Left-hand PKE Meter with animated sensing wings!
            const pke = new THREE.Group();
            pke.position.set(-0.38, -0.30, -0.52); pke.rotation.y = 0.22;
            const pkeHandle = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.08), std(0x1e293b, 0.5));
            const pkeScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.07), basic(0x4ade80));
            pkeScreen.position.set(0, 0.04, 0.042);
            const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.03), std(0xfacc15, 0.3, 0.8));
            wingL.position.set(-0.08, 0.11, 0);
            const wingR = wingL.clone(); wingR.position.x = 0.08;
            pke.add(pkeHandle, pkeScreen, wingL, wingR);
            D.pke = { grp: pke, wingL, wingR, screen: pkeScreen };
            D.rig.add(pke);

            S.animate(() => {
                const c = BO.App && BO.App.worldCamera;
                if (c && D.rig) {
                    D.rig.position.copy(c.position);
                    D.rig.quaternion.copy(c.quaternion);
                }
            });

            // World-space Proton Core Stream & Helical Blue Containment Arc!
            D.beamCore = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1, 10), basic(0xf97316));
            D.beamCore.visible = false; S.add(D.beamCore);
            D.beamSpiral = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.75 }));
            D.beamSpiral.visible = false; S.add(D.beamSpiral);

            // Spawn 3 initial ghosts!
            for (let i = 0; i < 3; i++) this._spawnGhost(S, false);

            D.onKey = (e) => {
                if (MG.session !== S || MG.state !== 'running') return;
                if (e.code === 'KeyE' || e.code === 'KeyG') this._tossGhostTrap(S);
                else if (e.code === 'KeyR') {
                    D.heat = Math.max(0, D.heat - 45);
                    D.overheated = false;
                    BO.FX.spawnParticles(P_pos_safe().add(V(0, 1.2, 0)), 14, 0xe2e8f0, 3, 2.5, 0.4, 0.7);
                    tone(650, 220, 0.22, 'sawtooth', 0.09);
                    MG.toast('💨 PROTON PACK VENTED!', '#bae6fd');
                }
            };
            const P_pos_safe = () => BO.Player.pos.clone();
            window.addEventListener('keydown', D.onKey);
        },
        dispose(S) {
            if (S.data.onKey) window.removeEventListener('keydown', S.data.onKey);
            if (S.data.rig && S.data.rig.parent) S.data.rig.parent.remove(S.data.rig);
        },
        _spawnGhost(S, isBoss = false) {
            const D = S.data;
            if (!isBoss && D.ghosts.length >= 6) return;
            const spec = isBoss ? GHOST_KINDS[3] : GHOST_KINDS[Math.floor(Math.random() * 3)];
            const mesh = buildSpecterMesh(spec);
            const pos = isBoss ? V(0, 2.6, -15) : V((Math.random() - 0.5) * 28, 1.8 + Math.random() * 2.5, -14 + Math.random() * 20);
            mesh.position.copy(pos);
            const lbl = labelSprite(`${spec.name} (100%)`, '#' + spec.col.toString(16).padStart(6, '0'), 2.5);
            lbl.position.y = isBoss ? 4.4 : 2.7;
            mesh.add(lbl);
            S.add(mesh);
            const gObj = { spec, mesh, lbl, pos, stamina: spec.hp, maxStamina: spec.hp, goal: pos.clone(), retargetT: 0.2, atkCd: 2.2, wrangled: false };
            D.ghosts.push(gObj);
            if (isBoss) {
                D.boss = gObj;
                MG.toast('🎹 LORD VOLTAIRE HAS RISEN FROM THE GRAND PIPE ORGAN!', '#f43f5e');
                SFX.horn && SFX.horn();
            }
        },
        _tossGhostTrap(S) {
            const D = S.data, P = BO.Player;
            if (D.trapCd > 0) { MG.toast(`⏳ GHOST TRAP RECHARGING (${D.trapCd.toFixed(1)}s)`, '#94a3b8'); return; }
            D.trapCd = 5.0;
            const fwd = new THREE.Vector3();
            BO.App.worldCamera.getWorldDirection(fwd);
            const land = P.pos.clone().addScaledVector(V(fwd.x, 0, fwd.z).normalize(), 6.5);
            land.x = BO.Math.clamp(land.x, -16, 16);
            land.z = BO.Math.clamp(land.z, -16, 18);
            land.y = 0.08;

            // Sculpted Hazard-Striped Ghost Trap Box + Golden Inverted Capture Cone!
            const tg = new THREE.Group();
            tg.position.copy(land);
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 1.35), std(0x1e293b, 0.4, 0.8));
            const doors = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 1.15), basic(0xfacc15));
            doors.position.y = 0.13;
            const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6.2, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false }));
            cone.rotation.x = Math.PI; cone.position.y = 3.1;
            tg.add(box, doors, cone);
            S.add(tg);
            tone(320, 960, 0.25, 'square', 0.11);
            D.traps.push({ grp: tg, pos: land, life: 4.5 });
        },
        _captureGhost(S, gObj, viaTrap) {
            const D = S.data;
            const pts = viaTrap ? gObj.spec.pts * 2 : gObj.spec.pts;
            BO.FX.spawnExplosion(gObj.pos.clone(), gObj.spec.boss ? 6.5 : 3.0, gObj.spec.col);
            S.scene.remove(gObj.mesh);
            D.ghosts = D.ghosts.filter((g) => g !== gObj);
            D.captured++; S.kills++; S.bumpCombo();
            S.award(Math.round(pts * S.comboMult), gObj.pos.clone().add(V(0, 1.2, 0)), viaTrap ? `⚡ TRAPPED: ${gObj.spec.name}!` : `💥 VAPORIZED: ${gObj.spec.name}`, viaTrap ? '#fde047' : '#4ade80');
            SFX.fanfare();
            if (gObj.spec.boss) {
                D.bossTrapped = true;
                MG.finish('👻 LORD VOLTAIRE SEALED IN CONTAINMENT!', { color: '#4ade80', delay: 2.0 });
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            const D = S.data, P = BO.Player, cam = BO.App.worldCamera;
            D.trapCd = Math.max(0, D.trapCd - dt);
            D.beamSoundCd = Math.max(0, D.beamSoundCd - dt);

            // Haunted Ballroom Chandeliers sway eerily
            for (let i = 0; i < D.chandeliers.length; i++) {
                D.chandeliers[i].rotation.z = Math.sin(S.t * 1.6 + i) * 0.14;
            }

            // Spawn ghosts & summon Lord Voltaire once 8 ghosts are captured!
            if (!D.bossSpawned && D.captured >= 8) {
                D.bossSpawned = true;
                this._spawnGhost(S, true);
            } else if (!D.bossSpawned) {
                D.spawnCd -= dt;
                if (D.spawnCd <= 0) { D.spawnCd = 3.8; this._spawnGhost(S, false); }
            }

            // PKE Meter proximity wing flare!
            let minGhostDist = 99;
            for (const g of D.ghosts) minGhostDist = Math.min(minGhostDist, g.pos.distanceTo(P.pos));
            const pkeAlert = clamp01(1 - (minGhostDist - 4) / 18);
            D.pke.wingL.rotation.z = pkeAlert * 0.65;
            D.pke.wingR.rotation.z = -pkeAlert * 0.65;
            D.pke.screen.material.color.setHex(pkeAlert > 0.6 ? 0xfacc15 : 0x4ade80);

            // Proton Stream Wrangling ([LMB] held)!
            for (const g of D.ghosts) g.wrangled = false;
            const firing = P.triggerHeld && !D.overheated;
            if (firing && cam) {
                D.heat = Math.min(100, D.heat + 22 * dt);
                if (D.heat >= 100) {
                    D.overheated = true;
                    MG.toast('🔥 PROTON PACK OVERHEATED — PRESS [R] TO VENT!', '#f87171');
                    SFX.buzzer();
                }
                const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
                const origin = new THREE.Vector3(); D.wandTip.getWorldPosition(origin);

                // Find ghost closest to aim ray within 22m
                let locked = null, bestScore = 0.86;
                for (const g of D.ghosts) {
                    const toG = g.pos.clone().add(V(0, 1.1, 0)).sub(cam.position);
                    const dist = toG.length();
                    if (dist > 22) continue;
                    const dot = toG.normalize().dot(fwd);
                    if (dot > bestScore) { bestScore = dot; locked = g; }
                }
                const endPt = locked ? locked.pos.clone().add(V(0, 1.1, 0)) : cam.position.clone().addScaledVector(fwd, 18);
                const seg = endPt.clone().sub(origin);
                const len = Math.max(0.2, seg.length());
                const mid = origin.clone().addScaledVector(seg, 0.5);
                const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), seg.clone().normalize());

                D.beamCore.visible = D.beamSpiral.visible = true;
                D.beamCore.position.copy(mid); D.beamCore.quaternion.copy(q); D.beamCore.scale.set(1, len, 1);
                D.beamSpiral.position.copy(mid); D.beamSpiral.quaternion.copy(q); D.beamSpiral.scale.set(1 + Math.sin(S.t * 35) * 0.3, len, 1 + Math.cos(S.t * 35) * 0.3);
                D.wand.position.z = -0.58 + Math.sin(S.t * 45) * 0.015;

                if (D.beamSoundCd <= 0) { D.beamSoundCd = 0.11; tone(140, 290, 0.10, 'sawtooth', 0.055); }

                if (locked) {
                    locked.wrangled = true;
                    locked.stamina = Math.max(0, locked.stamina - 44 * dt);
                    S.shots++; S.shotHits++;
                    BO.FX.spawnParticles(endPt, 2, 0x38bdf8, 3.5, 2, 0.22, 0.55);
                    // Pull wrangled ghost gently toward nearest active Ghost Trap if one is open!
                    if (D.traps.length > 0) {
                        const nearTrap = D.traps[0];
                        const pull = nearTrap.pos.clone().add(V(0, 1.5, 0)).sub(locked.pos);
                        if (pull.length() < 12) locked.pos.addScaledVector(pull.normalize(), 5.5 * dt);
                    }
                    if (locked.stamina <= 0) {
                        this._captureGhost(S, locked, false);
                    }
                }
            } else {
                D.beamCore.visible = D.beamSpiral.visible = false;
                D.heat = Math.max(0, D.heat - (D.overheated ? 26 : 18) * dt);
                if (D.overheated && D.heat <= 15) D.overheated = false;
            }

            // Update Active Floor Ghost Traps (suck in any ghost within cone when stamina <= 45%!)
            for (let i = D.traps.length - 1; i >= 0; i--) {
                const tr = D.traps[i];
                tr.life -= dt;
                tr.grp.children[2].rotation.y += dt * 8;
                for (const g of D.ghosts.slice()) {
                    const horiz = Math.hypot(g.pos.x - tr.pos.x, g.pos.z - tr.pos.z);
                    const pct = g.stamina / g.maxStamina;
                    if (horiz < 4.2 && pct <= (g.spec.boss ? 0.25 : 0.48)) {
                        g.pos.lerp(tr.pos.clone().add(V(0, 0.4, 0)), dt * 8);
                        g.mesh.scale.multiplyScalar(Math.pow(0.2, dt));
                        if (g.pos.y < 0.85 || tr.life < 0.3) {
                            this._captureGhost(S, g, true);
                        }
                    }
                }
                if (tr.life <= 0) { S.scene.remove(tr.grp); D.traps.splice(i, 1); }
            }

            // Update Ghost flight AI & Ectoplasm Bolt attacks
            for (const g of D.ghosts) {
                g.retargetT -= dt;
                if (g.retargetT <= 0) {
                    g.retargetT = 1.6 + Math.random() * 1.4;
                    g.goal.set((Math.random() - 0.5) * 28, 1.6 + Math.random() * 2.8, -14 + Math.random() * 26);
                }
                if (!g.wrangled) {
                    const toGoal = g.goal.clone().sub(g.pos);
                    if (toGoal.length() > 0.5) g.pos.addScaledVector(toGoal.normalize(), g.spec.spd * dt);
                } else {
                    g.mesh.rotation.z = Math.sin(S.t * 36) * 0.22;
                }
                g.pos.y = BO.Math.clamp(g.pos.y + Math.sin(S.t * 3 + g.stamina) * 0.015, 1.0, 5.2);
                g.mesh.position.copy(g.pos);
                g.mesh.lookAt(P.pos.x, g.pos.y, P.pos.z);

                g.atkCd -= dt;
                if (g.atkCd <= 0 && !g.wrangled) {
                    g.atkCd = g.spec.boss ? 1.8 : 3.2;
                    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), basic(g.spec.col));
                    bolt.position.copy(g.pos).add(V(0, 1.2, 0)); S.add(bolt);
                    const dir = P.pos.clone().add(V(0, 1.1, 0)).sub(bolt.position).normalize();
                    D.ectoBolts.push({ mesh: bolt, vel: dir.multiplyScalar(15), col: g.spec.col, life: 3.0 });
                }
            }

            for (let i = D.ectoBolts.length - 1; i >= 0; i--) {
                const b = D.ectoBolts[i];
                b.life -= dt;
                b.mesh.position.addScaledVector(b.vel, dt);
                if (b.mesh.position.distanceTo(P.pos.clone().add(V(0, 1.0, 0))) < 1.25) {
                    P.takeDamage(9, b.mesh.position, true);
                    BO.FX.spawnParticles(b.mesh.position, 10, b.col, 3, 2, 0.35, 0.7);
                    S.scene.remove(b.mesh); D.ectoBolts.splice(i, 1); continue;
                }
                if (b.life <= 0) { S.scene.remove(b.mesh); D.ectoBolts.splice(i, 1); }
            }

            if (!P.alive) MG.finish('SLIMED OUT OF RAVENWOOD MANSION', { color: '#f87171' });
        },
        hud(S) {
            const D = S.data, boss = D.boss && D.ghosts.includes(D.boss) ? D.boss : null;
            return `<div class="fun-panel">
                <div class="mgx-chip">👻 CAPTURED <b>${D.captured} / 8</b></div>
                <div class="mgx-chip ${D.overheated ? 'mgx-hot' : ''}">PROTON HEAT [R] <b>${Math.round(D.heat)}%</b></div>
                <div class="mgx-chip ${D.trapCd <= 0 ? 'mgx-hot' : ''}">GHOST TRAP [E/G] <b>${D.trapCd <= 0 ? 'READY' : D.trapCd.toFixed(1) + 's'}</b></div>
            </div>
            ${boss ? `<div class="fun-panel" style="margin-top:5px;"><div class="fun-bar-wrap"><div class="fun-bar-lbl"><span>🎹 LORD VOLTAIRE (${boss.stamina <= boss.maxStamina * 0.25 ? 'TRAP NOW [E]!' : 'WRANGLE BELOW 25%'})</span><b>${Math.ceil(boss.stamina)} / ${boss.maxStamina}</b></div><div class="fun-bar"><i style="width:${Math.round(boss.stamina / boss.maxStamina * 100)}%;background:linear-gradient(90deg,#4ade80,#f43f5e)"></i></div></div></div>` : ''}`;
        },
        result(S) {
            const D = S.data, stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: D.bossTrapped ? 'MASTER PARANORMAL ELIMINATOR' : 'CONTAINMENT SHIFT COMPLETE',
                stats: [['SPECTERS CAPTURED', D.captured], ['LORD VOLTAIRE', D.bossTrapped ? 'SEALED' : D.bossSpawned ? 'ESCAPED' : 'NOT SUMMONED'], ['BEST STREAK', S.maxCombo]],
                xp: Math.round(180 + S.score * 0.032 + stars * 155)
            };
        }
    });
})(window);
