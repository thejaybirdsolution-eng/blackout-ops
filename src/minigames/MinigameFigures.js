/* ============================================================================
   BLACKOUT OPS — MINIGAMES: low-poly figure kit
   People (criminals, hostages, cowboys, civilians, contract targets) and
   horses, built from primitives with jointed limbs so they can walk, gallop,
   aim, raise their hands and react. Pivot is at the feet; figures face +Z.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const L = BO.MinigameLib;
    const { std, basic, canvasTex } = L;

    const SKINS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0x6b4226];

    function faceTex(o) {
        const key = 'face:' + [o.skin, o.eyes, o.mouth, o.mask, o.beard].join(':');
        return canvasTex(key, 64, 64, (g, w, h) => {
            const skin = '#' + o.skin.toString(16).padStart(6, '0');
            g.fillStyle = skin;
            g.fillRect(0, 0, w, h);
            if (o.mask) {
                g.fillStyle = o.mask;
                g.fillRect(0, 0, w, h);
                g.fillStyle = skin;
                g.fillRect(10, 22, 44, 12);   // eye slit
                g.fillRect(22, 42, 20, 8);    // mouth hole
            }
            g.fillStyle = '#111';
            const ey = 28;
            if (o.eyes === 'angry') {
                g.fillRect(16, ey, 9, 5); g.fillRect(39, ey, 9, 5);
                g.fillRect(14, ey - 6, 12, 3); g.fillRect(38, ey - 6, 12, 3);
            } else if (o.eyes === 'scared') {
                g.fillStyle = '#fff'; g.beginPath(); g.arc(20, ey + 2, 6, 0, 7); g.arc(44, ey + 2, 6, 0, 7); g.fill();
                g.fillStyle = '#111'; g.beginPath(); g.arc(20, ey + 2, 3, 0, 7); g.arc(44, ey + 2, 3, 0, 7); g.fill();
            } else {
                g.fillRect(17, ey, 7, 7); g.fillRect(40, ey, 7, 7);
            }
            if (o.beard) {
                g.fillStyle = o.beard;
                g.fillRect(8, 40, 48, 24);
                g.fillStyle = skin; g.fillRect(24, 44, 16, 5);
            }
            g.fillStyle = '#5b1a1a';
            if (o.mouth === 'o') { g.beginPath(); g.arc(32, 48, 5, 0, 7); g.fill(); }
            else if (o.mouth === 'frown') { g.fillRect(24, 50, 16, 3); g.fillRect(22, 52, 3, 3); g.fillRect(39, 52, 3, 3); }
            else g.fillRect(24, 48, 16, 3);
        });
    }

    const F = BO.MGFigures = {
        SKINS,

        /**
         * Jointed person. Options:
         *  skin, shirt, pants, shoes, hair (color|null), hat ('fedora'|'cap'|'cowboy'|'beanie'|'tophat'|null), hatColor,
         *  coat (color, long coat), glasses (bool|'shades'), mask (color), beard (color), tie (color),
         *  briefcase, phone, gun ('pistol'|'rifle'|'revolver'), eyes, mouth, scale, bandana (color)
         */
        human(o = {}) {
            const sc = o.scale || 1;
            const root = new THREE.Group();
            const body = new THREE.Group();
            body.scale.setScalar(sc);
            root.add(body);
            const skin = o.skin ?? SKINS[0];
            const mSkin = std(skin, 0.75);
            const mShirt = std(o.shirt ?? 0x475569, 0.85);
            const mPants = std(o.pants ?? 0x1f2937, 0.85);
            const mShoes = std(o.shoes ?? 0x111111, 0.6);
            const hit = [];
            const P = {};

            const hips = new THREE.Group();
            hips.position.y = 0.95;
            body.add(hips);
            P.hips = hips;
            // legs
            for (const s of [-1, 1]) {
                const leg = new THREE.Group();
                leg.position.set(s * 0.11, 0, 0);
                const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.92, 0.19), mPants);
                thigh.position.y = -0.46;
                const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.3), mShoes);
                shoe.position.set(0, -0.9, 0.05);
                leg.add(thigh, shoe);
                hips.add(leg);
                thigh.userData.hitbox = 'torso';
                hit.push(thigh);
                P[s < 0 ? 'legL' : 'legR'] = leg;
            }
            // torso
            const chest = new THREE.Group();
            hips.add(chest);
            P.chest = chest;
            const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.62, 0.25), o.coat ? std(o.coat, 0.85) : mShirt);
            torso.position.y = 0.31;
            torso.userData.hitbox = 'torso';
            chest.add(torso);
            hit.push(torso);
            P.torso = torso;
            if (o.coat) {
                const tail = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.27), std(o.coat, 0.85));
                tail.position.y = -0.18;
                tail.userData.hitbox = 'torso';
                chest.add(tail);
                hit.push(tail);
                const collar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.02), mShirt);
                collar.position.set(0, 0.45, 0.13);
                collar.userData.noHit = true;
                chest.add(collar);
            }
            if (o.tie) {
                const tie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.02), std(o.tie, 0.6));
                tie.position.set(0, 0.38, 0.135);
                tie.userData.noHit = true;
                chest.add(tie);
            }
            if (o.vest) {
                const vest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), std(o.vest, 0.9));
                vest.position.y = 0.35;
                vest.userData.hitbox = 'torso';
                chest.add(vest);
                hit.push(vest);
            }
            // arms
            for (const s of [-1, 1]) {
                const arm = new THREE.Group();
                arm.position.set(s * 0.3, 0.58, 0);
                const upper = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.64, 0.14), o.coat ? std(o.coat, 0.85) : mShirt);
                upper.position.y = -0.3;
                upper.userData.hitbox = 'torso';
                const hand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.11), mSkin);
                hand.position.y = -0.66;
                hand.userData.hitbox = 'torso';
                arm.add(upper, hand);
                chest.add(arm);
                hit.push(upper, hand);
                P[s < 0 ? 'armL' : 'armR'] = arm;
                P[s < 0 ? 'handL' : 'handR'] = hand;
            }
            // head
            const headG = new THREE.Group();
            headG.position.y = 0.66;
            chest.add(headG);
            P.headG = headG;
            const neck = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.1, 0.11), mSkin);
            neck.position.y = 0.03;
            neck.userData.hitbox = 'head';
            headG.add(neck);
            const face = faceTex({ skin, eyes: o.eyes || 'normal', mouth: o.mouth || 'line', mask: o.mask ? '#' + o.mask.toString(16).padStart(6, '0') : null, beard: o.beard ? '#' + o.beard.toString(16).padStart(6, '0') : null });
            const headMats = [mSkin, mSkin, mSkin, mSkin, new THREE.MeshStandardMaterial({ map: face, roughness: 0.75 }), mSkin];
            if (o.mask) { const mm = std(o.mask, 0.9); headMats[0] = headMats[1] = headMats[2] = headMats[3] = headMats[5] = mm; }
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), headMats);
            head.position.y = 0.22;
            head.userData.hitbox = 'head';
            headG.add(head);
            hit.push(head, neck);
            P.head = head;
            if (o.hair && !o.mask) {
                const hair = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.28), std(o.hair, 0.9));
                hair.position.set(0, 0.36, -0.01);
                hair.userData.hitbox = 'head';
                const back = new THREE.Mesh(new THREE.BoxGeometry(0.28, o.longHair ? 0.42 : 0.2, 0.06), std(o.hair, 0.9));
                back.position.set(0, o.longHair ? 0.12 : 0.24, -0.13);
                back.userData.hitbox = 'head';
                headG.add(hair, back);
                hit.push(hair, back);
            }
            if (o.glasses) {
                const gl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.02), o.glasses === 'shades' ? std(0x0a0a0a, 0.2, 0.6) : std(0x9ca3af, 0.3, 0.8));
                gl.position.set(0, 0.25, 0.14);
                gl.userData.hitbox = 'head';
                headG.add(gl);
                hit.push(gl);
            }
            if (o.bandana) {
                const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.13, 0.28), std(o.bandana, 0.85));
                b.position.set(0, 0.13, 0.005);
                b.userData.hitbox = 'head';
                headG.add(b);
                hit.push(b);
            }
            if (o.hat) {
                const hm = std(o.hatColor ?? 0x292524, 0.8);
                const hat = new THREE.Group();
                hat.position.y = 0.37;
                if (o.hat === 'fedora' || o.hat === 'cowboy') {
                    const brim = new THREE.Mesh(new THREE.CylinderGeometry(o.hat === 'cowboy' ? 0.3 : 0.24, o.hat === 'cowboy' ? 0.3 : 0.24, 0.025, 14), hm);
                    if (o.hat === 'cowboy') brim.scale.set(1, 1, 0.85);
                    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.16, 12), hm);
                    crown.position.y = 0.08;
                    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.035, 12), std(o.hatBand ?? 0x111111, 0.7));
                    band.position.y = 0.025;
                    hat.add(brim, crown, band);
                } else if (o.hat === 'cap') {
                    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), hm);
                    crown.position.y = -0.04;
                    const bill = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.14), hm);
                    bill.position.set(0, -0.03, 0.18);
                    hat.add(crown, bill);
                } else if (o.hat === 'beanie') {
                    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), hm);
                    crown.scale.y = 1.2;
                    crown.position.y = -0.06;
                    hat.add(crown);
                } else if (o.hat === 'tophat') {
                    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 14), hm);
                    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.28, 14), hm);
                    crown.position.y = 0.14;
                    hat.add(brim, crown);
                } else if (o.hat === 'helmet') {
                    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), hm);
                    crown.position.y = -0.07;
                    hat.add(crown);
                }
                hat.traverse((m) => { if (m.isMesh) { m.userData.hitbox = 'head'; hit.push(m); } });
                headG.add(hat);
                P.hat = hat;
            }
            // held items (right hand)
            if (o.gun) {
                const g = new THREE.Group();
                const gm = std(0x18181b, 0.4, 0.6);
                if (o.gun === 'rifle') {
                    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.8), gm);
                    b.position.z = 0.25;
                    g.add(b);
                } else {
                    const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, o.gun === 'revolver' ? 0.32 : 0.24), o.gun === 'revolver' ? std(0x9ca3af, 0.3, 0.9) : gm);
                    b.position.z = 0.1;
                    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.06), o.gun === 'revolver' ? std(0x5b3a1e, 0.8) : gm);
                    grip.position.set(0, -0.07, -0.01);
                    g.add(b, grip);
                }
                g.position.set(0, -0.7, 0.04);
                g.rotation.x = Math.PI / 2;
                g.traverse((m) => { if (m.isMesh) m.userData.noHit = true; });
                P.armR.add(g);
                P.gun = g;
            }
            if (o.briefcase) {
                const bc = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.42), std(o.briefcase === true ? 0x3f2a14 : o.briefcase, 0.6));
                bc.position.set(0, -0.86, 0);
                bc.userData.noHit = true;
                (o.gun ? P.armL : P.armR).add(bc);
                P.briefcase = bc;
            }
            if (o.phone) {
                const ph = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.08), std(0x0f172a, 0.3, 0.4));
                ph.position.set(0, -0.68, 0.06);
                ph.userData.noHit = true;
                P.armL.add(ph);
                P.phone = ph;
            }
            root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
            return { root, body, parts: P, hit, opts: o, height: 1.78 * sc };
        },

        /** Walk / run cycle. amount 0..1 scales the swing. */
        walk(fig, phase, amount = 1, run = false) {
            const P = fig.parts;
            const sw = Math.sin(phase) * (run ? 0.9 : 0.5) * amount;
            P.legL.rotation.x = sw;
            P.legR.rotation.x = -sw;
            if (!fig.armsBusy) {
                P.armL.rotation.x = -sw * 0.8;
                P.armR.rotation.x = sw * 0.8;
                P.armL.rotation.z = 0; P.armR.rotation.z = 0;
            }
            P.hips.position.y = 0.95 + Math.abs(Math.cos(phase)) * (run ? 0.06 : 0.025) * amount;
            P.chest.rotation.x = run ? 0.18 * amount : 0;
        },

        pose(fig, name, t = 0) {
            const P = fig.parts;
            fig.armsBusy = name !== 'idle';
            P.armL.rotation.set(0, 0, 0);
            P.armR.rotation.set(0, 0, 0);
            if (name === 'handsUp') {
                P.armL.rotation.z = -Math.PI * 0.85 - Math.sin(t * 9) * 0.05;
                P.armR.rotation.z = Math.PI * 0.85 + Math.sin(t * 9 + 1) * 0.05;
            } else if (name === 'aim') {
                P.armR.rotation.x = -Math.PI / 2;
                P.armL.rotation.x = -Math.PI / 2 + 0.15;
                P.armL.rotation.z = 0.45;
            } else if (name === 'aimOne') {
                P.armR.rotation.x = -Math.PI / 2;
            } else if (name === 'phone') {
                P.armL.rotation.x = -2.5;
                P.armL.rotation.z = 0.3;
            } else if (name === 'watch') {
                P.armL.rotation.x = -1.4;
                P.armL.rotation.z = 0.9;
                P.headG.rotation.x = 0.35;
            } else if (name === 'holster') {
                P.armR.rotation.z = 0.12;
                P.armR.rotation.x = 0.05;
                P.armL.rotation.z = -0.12;
            } else if (name === 'shield') {
                // grabbing someone in front
                P.armR.rotation.x = -Math.PI / 2;
                P.armL.rotation.x = -1.2;
                P.armL.rotation.z = 0.7;
            }
        },

        /** Little four-legged horse. Faces +Z, feet at y=0. */
        horse(o = {}) {
            const root = new THREE.Group();
            const coat = std(o.coat ?? 0x7c4a1e, 0.8);
            const dark = std(o.mane ?? 0x1c1008, 0.9);
            const P = {};
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 1.6), coat);
            body.position.y = 1.25;
            root.add(body);
            P.body = body;
            const neck = new THREE.Group();
            neck.position.set(0, 1.45, 0.7);
            const nm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.8, 0.36), coat);
            nm.position.set(0, 0.32, 0.1);
            nm.rotation.x = 0.55;
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.62), coat);
            head.position.set(0, 0.62, 0.48);
            const mane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.2), dark);
            mane.position.set(0, 0.42, -0.08);
            mane.rotation.x = 0.55;
            const earL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.06), coat);
            earL.position.set(-0.09, 0.82, 0.28);
            const earR = earL.clone(); earR.position.x = 0.09;
            neck.add(nm, head, mane, earL, earR);
            root.add(neck);
            P.neck = neck;
            const tail = new THREE.Group();
            tail.position.set(0, 1.45, -0.8);
            const tm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), dark);
            tm.position.y = -0.33;
            tail.add(tm);
            tail.rotation.x = 0.5;
            root.add(tail);
            P.tail = tail;
            const legs = [];
            for (const [x, z] of [[-0.22, 0.62], [0.22, 0.62], [-0.22, -0.62], [0.22, -0.62]]) {
                const leg = new THREE.Group();
                leg.position.set(x, 1.0, z);
                const lm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 0.16), coat);
                lm.position.y = -0.5;
                const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.18), dark);
                hoof.position.y = -0.98;
                leg.add(lm, hoof);
                root.add(leg);
                legs.push(leg);
            }
            P.legs = legs;
            const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.55), std(o.saddle ?? 0x3f1d0b, 0.7));
            saddle.position.set(0, 1.6, 0.05);
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
        },

        /** Seat a rider on a horse (legs splayed). */
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
