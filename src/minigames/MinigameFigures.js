/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Sculpted 3D Figure & Equine Kit
   Contoured lathe torsos, tapered anatomical limbs, rounded cranial heads,
   256x256 anti-aliased expressive faces, sculpted hair, and sculpted horses.
   Preserves exact parts/hit/walk/pose/gallop/mount contract for all courses.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const L = BO.MinigameLib;
    const { std, canvasTex } = L;

    const SKINS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0x6b4226];
    const GEO = {};

    function lathe(pts, segs = 14, scaleZ = 1) {
        const g = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), segs);
        if (scaleZ !== 1) g.scale(1, 1, scaleZ);
        g.computeVertexNormals();
        return g;
    }

    function getGeos() {
        if (GEO.ready) return GEO;
        GEO.ready = true;
        GEO.torso = lathe([
            [0.01, 0.00], [0.16, 0.02], [0.17, 0.12], [0.15, 0.25], [0.19, 0.44],
            [0.21, 0.56], [0.15, 0.62], [0.07, 0.64], [0.01, 0.65]
        ], 16, 0.66);
        GEO.coatTail = lathe([[0.22, 0.0], [0.20, 0.24], [0.17, 0.48]], 16, 0.68);
        GEO.vest = lathe([[0.18, 0.14], [0.21, 0.36], [0.22, 0.56], [0.16, 0.62]], 16, 0.72);
        GEO.thigh = new THREE.CapsuleGeometry(0.082, 0.34, 5, 12);
        GEO.shin = new THREE.CapsuleGeometry(0.062, 0.34, 5, 12);
        GEO.shoe = new THREE.CapsuleGeometry(0.068, 0.14, 5, 10);
        GEO.uarm = new THREE.CapsuleGeometry(0.056, 0.24, 5, 10);
        GEO.farm = new THREE.CapsuleGeometry(0.044, 0.22, 5, 10);
        GEO.hand = new THREE.SphereGeometry(0.048, 10, 8);
        GEO.head = new THREE.SphereGeometry(0.145, 18, 14);
        GEO.head.scale(0.92, 1.06, 0.98);
        GEO.horseBody = (() => {
            const g = lathe([
                [0.01, -0.78], [0.26, -0.62], [0.29, -0.25], [0.26, 0.10], [0.31, 0.42], [0.25, 0.68], [0.01, 0.80]
            ], 16, 0.94);
            g.rotateX(Math.PI * 0.5);
            return g;
        })();
        GEO.horseNeck = lathe([[0.18, 0.0], [0.15, 0.35], [0.11, 0.74]], 12, 0.78);
        GEO.horseHead = lathe([[0.06, -0.32], [0.09, -0.14], [0.14, 0.12], [0.12, 0.28], [0.01, 0.34]], 12, 0.90);
        GEO.horseHead.rotateX(-Math.PI * 0.5);
        GEO.horseLeg = new THREE.CapsuleGeometry(0.062, 0.82, 5, 10);
        GEO.hoof = new THREE.CylinderGeometry(0.072, 0.084, 0.10, 12);
        return GEO;
    }

    function faceTex(o) {
        const key = 'face2:' + [o.skin, o.eyes, o.mouth, o.mask, o.beard].join(':');
        return canvasTex(key, 256, 256, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            const skin = '#' + o.skin.toString(16).padStart(6, '0');
            if (o.mask) {
                g.fillStyle = o.mask;
                g.fillRect(0, 0, w, h);
                g.fillStyle = skin;
                g.beginPath(); g.roundRect(38, 86, 180, 44, 18); g.fill();
                g.beginPath(); g.roundRect(92, 168, 72, 28, 12); g.fill();
            }
            // Cheek warmth & nose shadow
            g.fillStyle = 'rgba(180, 75, 55, 0.20)';
            g.beginPath(); g.ellipse(62, 144, 24, 14, 0, 0, Math.PI * 2); g.fill();
            g.beginPath(); g.ellipse(194, 144, 24, 14, 0, 0, Math.PI * 2); g.fill();
            g.fillStyle = 'rgba(60, 28, 18, 0.25)';
            g.beginPath(); g.ellipse(128, 142, 10, 14, 0, 0, Math.PI * 2); g.fill();

            const ey = 112;
            const drawEye = (cx, scared, angry) => {
                g.fillStyle = '#ffffff';
                g.beginPath(); g.ellipse(cx, ey, scared ? 20 : 16, scared ? 22 : 14, 0, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#1e293b';
                g.beginPath(); g.arc(cx, ey + 1, scared ? 10 : 9, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#090d14';
                g.beginPath(); g.arc(cx, ey + 1, 5, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#ffffff';
                g.beginPath(); g.arc(cx - 3, ey - 3, 2.8, 0, Math.PI * 2); g.fill();

                g.strokeStyle = '#1c1410';
                g.lineWidth = 6;
                g.lineCap = 'round';
                g.beginPath();
                if (angry) {
                    const dir = cx < 128 ? 1 : -1;
                    g.moveTo(cx - 18, ey - 24 - dir * 5);
                    g.lineTo(cx + 18, ey - 24 + dir * 5);
                } else {
                    g.moveTo(cx - 18, ey - 22);
                    g.quadraticCurveTo(cx, ey - 30, cx + 18, ey - 22);
                }
                g.stroke();
            };
            drawEye(84, o.eyes === 'scared', o.eyes === 'angry');
            drawEye(172, o.eyes === 'scared', o.eyes === 'angry');

            if (o.beard) {
                g.fillStyle = o.beard;
                g.beginPath();
                g.moveTo(42, 152);
                g.quadraticCurveTo(128, 252, 214, 152);
                g.lineTo(214, 256); g.lineTo(42, 256); g.closePath();
                g.fill();
                g.fillStyle = skin;
                g.beginPath(); g.ellipse(128, 184, 34, 14, 0, 0, Math.PI * 2); g.fill();
            }

            g.fillStyle = '#5b1a1a';
            g.strokeStyle = '#5b1a1a';
            g.lineWidth = 6;
            g.lineCap = 'round';
            if (o.mouth === 'o') {
                g.beginPath(); g.ellipse(128, 188, 14, 16, 0, 0, Math.PI * 2); g.fill();
            } else if (o.mouth === 'frown') {
                g.beginPath(); g.moveTo(100, 194); g.quadraticCurveTo(128, 178, 156, 194); g.stroke();
            } else {
                g.beginPath(); g.moveTo(100, 186); g.quadraticCurveTo(128, 196, 156, 186); g.stroke();
            }
        });
    }

    const F = BO.MGFigures = {
        SKINS,

        human(o = {}) {
            const G = getGeos();
            const sc = o.scale || 1;
            const root = new THREE.Group();
            const body = new THREE.Group();
            body.scale.setScalar(sc);
            root.add(body);
            const skin = o.skin ?? SKINS[0];
            const mSkin = std(skin, 0.65);
            const mShirt = std(o.shirt ?? 0x475569, 0.85);
            const mPants = std(o.pants ?? 0x1f2937, 0.86);
            const mShoes = std(o.shoes ?? 0x15171c, 0.55);
            const hit = [];
            const P = {};

            const hips = new THREE.Group();
            hips.position.y = 0.95;
            body.add(hips);
            P.hips = hips;

            // Sculpted rounded legs & contoured shoes
            for (const s of [-1, 1]) {
                const leg = new THREE.Group();
                leg.position.set(s * 0.105, 0, 0);
                const thigh = new THREE.Mesh(G.thigh, mPants);
                thigh.position.y = -0.23;
                thigh.userData.hitbox = 'torso';
                const shin = new THREE.Mesh(G.shin, mPants);
                shin.position.y = -0.66;
                shin.userData.hitbox = 'torso';
                const shoe = new THREE.Mesh(G.shoe, mShoes);
                shoe.rotation.x = Math.PI * 0.5;
                shoe.scale.set(1.0, 1.0, 0.68);
                shoe.position.set(0, -0.90, 0.05);
                leg.add(thigh, shin, shoe);
                hips.add(leg);
                hit.push(thigh, shin);
                P[s < 0 ? 'legL' : 'legR'] = leg;
            }

            // Contoured lathe-turned torso
            const chest = new THREE.Group();
            hips.add(chest);
            P.chest = chest;
            const mTorso = o.coat ? std(o.coat, 0.85) : mShirt;
            const torso = new THREE.Mesh(G.torso, mTorso);
            torso.userData.hitbox = 'torso';
            chest.add(torso);
            hit.push(torso);
            P.torso = torso;

            if (o.coat) {
                const tail = new THREE.Mesh(G.coatTail, mTorso);
                tail.position.y = -0.38;
                tail.userData.hitbox = 'torso';
                chest.add(tail);
                hit.push(tail);
                const collar = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.025, 8, 16), mShirt);
                collar.rotation.x = Math.PI * 0.42;
                collar.position.set(0, 0.61, 0.02);
                collar.userData.noHit = true;
                chest.add(collar);
            }
            if (o.tie) {
                const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.012, 0.34, 6), std(o.tie, 0.55));
                tie.scale.z = 0.35;
                tie.position.set(0, 0.39, 0.138);
                tie.userData.noHit = true;
                chest.add(tie);
            }
            if (o.vest) {
                const vest = new THREE.Mesh(G.vest, std(o.vest, 0.9));
                vest.userData.hitbox = 'torso';
                chest.add(vest);
                hit.push(vest);
            }

            // Sculpted rounded arms + shoulders + hands
            for (const s of [-1, 1]) {
                const arm = new THREE.Group();
                arm.position.set(s * 0.255, 0.56, 0);
                const shCap = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), mTorso);
                const upper = new THREE.Mesh(G.uarm, mTorso);
                upper.position.y = -0.16;
                upper.userData.hitbox = 'torso';
                const fore = new THREE.Mesh(G.farm, o.coat ? mTorso : mSkin);
                fore.position.y = -0.45;
                fore.userData.hitbox = 'torso';
                const hand = new THREE.Mesh(G.hand, mSkin);
                hand.scale.set(0.85, 1.15, 0.65);
                hand.position.y = -0.63;
                hand.userData.hitbox = 'torso';
                arm.add(shCap, upper, fore, hand);
                chest.add(arm);
                hit.push(upper, fore, hand);
                P[s < 0 ? 'armL' : 'armR'] = arm;
                P[s < 0 ? 'handL' : 'handR'] = hand;
            }

            // Rounded sculpted cranial head + illustrated face overlay
            const headG = new THREE.Group();
            headG.position.y = 0.65;
            chest.add(headG);
            P.headG = headG;
            const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.068, 0.12, 12), mSkin);
            neck.position.y = 0.04;
            neck.userData.hitbox = 'head';
            headG.add(neck);

            const face = faceTex({
                skin, eyes: o.eyes || 'normal', mouth: o.mouth || 'line',
                mask: o.mask ? '#' + o.mask.toString(16).padStart(6, '0') : null,
                beard: o.beard ? '#' + o.beard.toString(16).padStart(6, '0') : null
            });
            const head = new THREE.Mesh(G.head, o.mask ? std(o.mask, 0.9) : mSkin);
            head.position.y = 0.22;
            head.userData.hitbox = 'head';
            headG.add(head);
            hit.push(head, neck);
            P.head = head;

            const faceOverlay = new THREE.Mesh(
                new THREE.SphereGeometry(0.147, 20, 14, Math.PI / 2 - 0.68, 1.36, Math.PI / 2 - 0.48, 0.96),
                new THREE.MeshStandardMaterial({ map: face, transparent: true, depthWrite: false, roughness: 0.65 })
            );
            faceOverlay.scale.set(0.92, 1.06, 0.98);
            faceOverlay.position.y = 0.22;
            faceOverlay.userData.noHit = true;
            headG.add(faceOverlay);

            if (o.hair && !o.mask) {
                const mHair = std(o.hair, 0.82);
                const cap = new THREE.Mesh(new THREE.SphereGeometry(0.152, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), mHair);
                cap.scale.set(0.94, 1.06, 1.0);
                cap.position.set(0, 0.23, -0.008);
                cap.rotation.x = -0.32;
                cap.userData.hitbox = 'head';
                headG.add(cap);
                hit.push(cap);
                if (o.longHair) {
                    const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.26, 6, 12), mHair);
                    back.scale.set(1.08, 1.0, 0.58);
                    back.position.set(0, 0.08, -0.105);
                    back.userData.hitbox = 'head';
                    headG.add(back);
                    hit.push(back);
                }
            }
            if (o.glasses) {
                const glMat = o.glasses === 'shades' ? std(0x0a0a0a, 0.15, 0.7) : std(0x9ca3af, 0.25, 0.85);
                for (const s of [-1, 1]) {
                    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 12), glMat);
                    lens.rotation.x = Math.PI * 0.5;
                    lens.position.set(s * 0.044, 0.24, 0.136);
                    lens.userData.hitbox = 'head';
                    headG.add(lens);
                    hit.push(lens);
                }
            }
            if (o.bandana) {
                const b = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.128, 0.12, 14), std(o.bandana, 0.85));
                b.position.set(0, 0.14, 0.008);
                b.userData.hitbox = 'head';
                headG.add(b);
                hit.push(b);
            }
            if (o.hat) {
                const hm = std(o.hatColor ?? 0x292524, 0.8);
                const hat = new THREE.Group();
                hat.position.y = 0.36;
                if (o.hat === 'fedora' || o.hat === 'cowboy') {
                    const brim = new THREE.Mesh(new THREE.CylinderGeometry(o.hat === 'cowboy' ? 0.3 : 0.24, o.hat === 'cowboy' ? 0.3 : 0.24, 0.025, 18), hm);
                    if (o.hat === 'cowboy') brim.scale.set(1, 1, 0.85);
                    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.148, 0.16, 16), hm);
                    crown.position.y = 0.08;
                    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.150, 0.150, 0.035, 16), std(o.hatBand ?? 0x111111, 0.7));
                    band.position.y = 0.025;
                    hat.add(brim, crown, band);
                } else if (o.hat === 'cap') {
                    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hm);
                    crown.position.y = -0.04;
                    const bill = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 14, 1, false, -Math.PI * 0.45, Math.PI * 0.9), hm);
                    bill.position.set(0, -0.03, 0.11);
                    hat.add(crown, bill);
                } else if (o.hat === 'beanie') {
                    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hm);
                    crown.scale.y = 1.2; crown.position.y = -0.06;
                    hat.add(crown);
                } else if (o.hat === 'tophat') {
                    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 16), hm);
                    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.28, 16), hm);
                    crown.position.y = 0.14;
                    hat.add(brim, crown);
                } else if (o.hat === 'helmet') {
                    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hm);
                    crown.position.y = -0.07;
                    hat.add(crown);
                }
                hat.traverse((m) => { if (m.isMesh) { m.userData.hitbox = 'head'; hit.push(m); } });
                headG.add(hat);
                P.hat = hat;
            }
            if (o.gun) {
                const g = new THREE.Group();
                const gm = std(0x18181b, 0.38, 0.72);
                if (o.gun === 'rifle') {
                    const rec = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.36), gm);
                    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.48, 10), gm);
                    barrel.rotation.x = Math.PI * 0.5; barrel.position.set(0, 0.015, 0.42);
                    g.add(rec, barrel);
                } else {
                    const m = o.gun === 'revolver' ? std(0x9ca3af, 0.28, 0.9) : gm;
                    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.068, o.gun === 'revolver' ? 0.24 : 0.22), m);
                    slide.position.z = 0.08;
                    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.14, 10), m);
                    barrel.rotation.x = Math.PI * 0.5; barrel.position.set(0, 0.012, 0.22);
                    const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.08, 4, 8), o.gun === 'revolver' ? std(0x5b3a1e, 0.75) : gm);
                    grip.position.set(0, -0.06, -0.01);
                    grip.rotation.x = -0.25;
                    g.add(slide, barrel, grip);
                }
                g.position.set(0, -0.66, 0.04);
                g.rotation.x = Math.PI / 2;
                g.traverse((m) => { if (m.isMesh) m.userData.noHit = true; });
                P.armR.add(g);
                P.gun = g;
            }
            if (o.briefcase) {
                const bc = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.42), std(o.briefcase === true ? 0x3f2a14 : o.briefcase, 0.55));
                bc.position.set(0, -0.84, 0);
                bc.userData.noHit = true;
                (o.gun ? P.armL : P.armR).add(bc);
                P.briefcase = bc;
            }
            if (o.phone) {
                const ph = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.08), std(0x0f172a, 0.25, 0.45));
                ph.position.set(0, -0.66, 0.06);
                ph.userData.noHit = true;
                P.armL.add(ph);
                P.phone = ph;
            }
            root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
            return { root, body, parts: P, hit, opts: o, height: 1.78 * sc };
        },

        walk(fig, phase, amount = 1, run = false) {
            const P = fig.parts;
            const sw = Math.sin(phase) * (run ? 0.9 : 0.5) * amount;
            P.legL.rotation.x = sw;
            P.legR.rotation.x = -sw;
            if (!fig.armsBusy) {
                const idleArm = Math.sin(phase * 0.55) * 0.04;
                P.armL.rotation.x = -sw * 0.8 + idleArm;
                P.armR.rotation.x = sw * 0.8 - idleArm;
                P.armL.rotation.z = -0.04 - Math.sin(phase * 0.5) * 0.02;
                P.armR.rotation.z = 0.04 + Math.sin(phase * 0.5) * 0.02;
            }
            const breath = Math.sin(phase * 0.65) * 0.012;
            P.hips.position.y = 0.95 + Math.abs(Math.cos(phase)) * (run ? 0.06 : 0.025) * amount + breath;
            P.chest.rotation.x = (run ? 0.18 * amount : 0) + breath * 1.6;
            P.chest.rotation.y = -Math.sin(phase) * 0.12 * amount;
            if (P.headG) {
                P.headG.rotation.y = Math.sin(phase) * 0.06 * amount + Math.sin(phase * 0.35) * 0.05;
                P.headG.rotation.z = Math.sin(phase * 0.5) * 0.03;
            }
        },

        pose(fig, name, t = 0) {
            const P = fig.parts;
            const liveT = t || (performance.now() * 0.001);
            const sway = Math.sin(liveT * 2.1);
            const sway2 = Math.cos(liveT * 1.7);
            fig.armsBusy = name !== 'idle';
            P.armL.rotation.set(0, 0, 0);
            P.armR.rotation.set(0, 0, 0);
            P.chest.rotation.x = sway2 * 0.025;
            if (name === 'handsUp') {
                P.armL.rotation.z = -Math.PI * 0.85 - Math.sin(liveT * 9) * 0.06;
                P.armR.rotation.z = Math.PI * 0.85 + Math.sin(liveT * 9 + 1) * 0.06;
            } else if (name === 'aim') {
                P.armR.rotation.x = -Math.PI / 2 + sway * 0.03;
                P.armL.rotation.x = -Math.PI / 2 + 0.15 + sway * 0.03;
                P.armL.rotation.z = 0.45;
            } else if (name === 'aimOne') {
                P.armR.rotation.x = -Math.PI / 2 + sway * 0.035;
                P.armL.rotation.z = -0.08 + sway2 * 0.04;
            } else if (name === 'phone') {
                P.armL.rotation.x = -2.5 + sway * 0.03;
                P.armL.rotation.z = 0.3;
            } else if (name === 'watch') {
                P.armL.rotation.x = -1.4 + sway * 0.04;
                P.armL.rotation.z = 0.9;
                P.headG.rotation.x = 0.35 + sway2 * 0.03;
            } else if (name === 'holster') {
                P.armR.rotation.z = 0.12 + sway * 0.03;
                P.armR.rotation.x = 0.05;
                P.armL.rotation.z = -0.12 - sway * 0.03;
            } else if (name === 'shield') {
                P.armR.rotation.x = -Math.PI / 2 + sway * 0.025;
                P.armL.rotation.x = -1.2;
                P.armL.rotation.z = 0.7;
            }
        },

        /** Sculpted four-legged horse (zero boxes). Faces +Z, feet at y=0. */
        horse(o = {}) {
            const G = getGeos();
            const root = new THREE.Group();
            const coat = std(o.coat ?? 0x7c4a1e, 0.78);
            const dark = std(o.mane ?? 0x1c1008, 0.88);
            const P = {};

            const body = new THREE.Mesh(G.horseBody, coat);
            body.position.y = 1.25;
            root.add(body);
            P.body = body;

            const neck = new THREE.Group();
            neck.position.set(0, 1.38, 0.65);
            const nm = new THREE.Mesh(G.horseNeck, coat);
            nm.rotation.x = 0.55;
            const head = new THREE.Mesh(G.horseHead, coat);
            head.position.set(0, 0.64, 0.50);
            head.rotation.x = 0.35;
            const mane = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.62, 4, 8), dark);
            mane.position.set(0, 0.38, -0.02);
            mane.rotation.x = 0.55;
            const earL = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.13, 7), coat);
            earL.position.set(-0.085, 0.80, 0.30);
            const earR = earL.clone(); earR.position.x = 0.085;
            neck.add(nm, head, mane, earL, earR);
            root.add(neck);
            P.neck = neck;
            P.earL = earL;
            P.earR = earR;

            const tail = new THREE.Group();
            tail.position.set(0, 1.44, -0.76);
            const tm = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.58, 4, 8), dark);
            tm.position.y = -0.32;
            tail.add(tm);
            tail.rotation.x = 0.5;
            root.add(tail);
            P.tail = tail;

            const legs = [];
            for (const [x, z] of [[-0.21, 0.56], [0.21, 0.56], [-0.21, -0.56], [0.21, -0.56]]) {
                const leg = new THREE.Group();
                leg.position.set(x, 1.0, z);
                const lm = new THREE.Mesh(G.horseLeg, coat);
                lm.position.y = -0.48;
                const hoof = new THREE.Mesh(G.hoof, dark);
                hoof.position.y = -0.95;
                leg.add(lm, hoof);
                root.add(leg);
                legs.push(leg);
            }
            P.legs = legs;

            const saddle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.32, 0.34, 0.46, 14, 1, false, -Math.PI * 0.45, Math.PI * 0.9),
                std(o.saddle ?? 0x3f1d0b, 0.65)
            );
            saddle.rotation.z = Math.PI * 0.5;
            saddle.position.set(0, 1.42, 0.05);
            root.add(saddle);

            root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.noHit = true; } });
            return { root, parts: P, saddleY: 1.62 };
        },

        gallop(h, phase, amt = 1) {
            const P = h.parts;
            const s = Math.sin(phase), c = Math.cos(phase);
            P.legs[0].rotation.x = s * 0.8 * amt;
            P.legs[1].rotation.x = Math.sin(phase + 0.5) * 0.8 * amt;
            P.legs[2].rotation.x = -Math.sin(phase + 0.2) * 0.8 * amt;
            P.legs[3].rotation.x = -Math.sin(phase + 0.7) * 0.8 * amt;
            P.body.position.y = 1.25 + Math.abs(c) * 0.12 * amt;
            P.body.rotation.x = s * 0.06 * amt;
            P.neck.rotation.x = -c * 0.15 * amt;
            P.tail.rotation.x = 0.6 + c * 0.25 * amt;
            P.tail.rotation.z = Math.sin(phase * 1.2) * 0.22 * amt;
            if (P.earL) P.earL.rotation.x = Math.sin(phase * 1.5) * 0.14;
            if (P.earR) P.earR.rotation.x = -Math.sin(phase * 1.5) * 0.14;
        },

        mount(horse, rider) {
            rider.root.position.set(0, horse.saddleY - 0.95 * (rider.opts.scale || 1) + 0.05, 0);
            rider.parts.legL.rotation.set(-1.2, 0, -0.35);
            rider.parts.legR.rotation.set(-1.2, 0, 0.35);
            horse.root.add(rider.root);
        },

        randomCivilian(rng, extra = {}) {
            const pick = (a) => a[Math.floor(rng() * a.length) % a.length];
            const o = {
                skin: pick(SKINS),
                shirt: pick([0x2563eb, 0x16a34a, 0xdc2626, 0xf59e0b, 0x7c3aed, 0x0891b2, 0xe5e7eb, 0x334155, 0xdb2777, 0x65a30d]),
                pants: pick([0x1f2937, 0x1e3a8a, 0x44403c, 0x78716c, 0x0f172a, 0x854d0e]),
                hair: pick([0x111111, 0x3b2314, 0x6b4423, 0xd6b370, 0x9ca3af, 0x7f1d1d]),
                longHair: rng() < 0.4,
                hat: rng() < 0.25 ? pick(['cap', 'beanie', 'fedora']) : null,
                hatColor: pick([0x111827, 0x7f1d1d, 0x1e3a8a, 0x713f12, 0x374151]),
                glasses: rng() < 0.2 ? (rng() < 0.5 ? 'shades' : true) : false
            };
            return Object.assign(o, extra);
        }
    };
})(window);
