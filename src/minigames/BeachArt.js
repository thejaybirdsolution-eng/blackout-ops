/* ============================================================================
   BLACKOUT OPS — Sweetheart Shore 2026 AAA Skinned Character Roster & Physics
   8 bespoke Couture Beach Characters bound to BO.BeachAnatomy's 25-bone
   THREE.Skeleton + unified THREE.SkinnedMesh body & swimsuit manifold:
   - Distinct body morphs (petite-curvy, tall volleyball athlete, voluptuous
     hourglass, statuesque Riviera model, sun-bronzed surfer, bombshell)
   - Multi-piece couture outfits (garter ribbons, 24k body chains, sheer pareo
     wraps, upper-arm cuffs, 3D glossy cornea lenses over jewel eyes, razor-thin
     feathery parted bangs that never obscure the eyes)
   - Real-time GPU-skinned Soft-Engine jiggle bones (breastL/R, gluteL/R,
     bellySoft, thighSoftL/R) with coupled 3-axis spring-damper physics
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const L = BO.MinigameLib;
    const { SFX, TAU, HIDDEN_MAT } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    // 8 deeply distinct character designs — unique body morphs, Couture swimwear, jewelry & hair
    const GIRLS = [
        {
            name: 'Mina', skin: 0xf6cbb6, blush: '#f43f5e', hair: 0xdb2777, hairHi: '#fbcfe8', style: 'twintails',
            eyes: '#ec4899', suit: 'frill', pattern: 'gingham', c1: 0xec4899, c2: 0xfff1f2, metal: 0xfacc15,
            acc: 'bow', accC: 0x9d174d, jewelry: 'pearl', garter: true, nail: 0xec4899,
            morph: { bust: 1.14, hip: 1.08, waist: 0.94, thigh: 1.05 }, height: 1.00
        },
        {
            name: 'Rin', skin: 0xeec09e, blush: '#fb7185', hair: 0x0f172a, hairHi: '#38bdf8', style: 'ponytail',
            eyes: '#0284c7', suit: 'sport', pattern: 'mesh', c1: 0x0284c7, c2: 0xf8fafc, metal: 0xe2e8f0,
            acc: 'visor', accC: 0xf8fafc, jewelry: 'band', kneeBand: true, nail: 0x0ea5e9,
            morph: { bust: 1.02, hip: 1.02, waist: 0.96, thigh: 1.03 }, height: 1.04
        },
        {
            name: 'Hana', skin: 0xdfa376, blush: '#ea580c', hair: 0x6c240c, hairHi: '#fb923c', style: 'long',
            eyes: '#16a34a', suit: 'triangle', sarong: true, pattern: 'hibiscus', c1: 0xea580c, c2: 0xfde047, metal: 0xfacc15,
            acc: 'flower', accC: 0xdc2626, jewelry: 'anklet', bellyChain: true, nail: 0xf97316,
            morph: { bust: 1.24, hip: 1.14, waist: 0.91, thigh: 1.09 }, height: 1.02
        },
        {
            name: 'Yuki', skin: 0xf5d9c8, blush: '#ec4899', hair: 0x93c5fd, hairHi: '#ffffff', style: 'bob',
            eyes: '#1d4ed8', suit: 'monokini', pareo: true, pattern: 'nautical', c1: 0x1e3a8a, c2: 0xffffff, metal: 0xf59e0b,
            acc: 'shades', accC: 0x0f172a, jewelry: 'pearl', nail: 0x2563eb,
            morph: { bust: 1.10, hip: 1.06, waist: 0.92, thigh: 1.02 }, height: 1.03
        },
        {
            name: 'Sora', skin: 0xbe7c42, blush: '#e11d48', hair: 0xeab308, hairHi: '#fef9c3', style: 'bun',
            eyes: '#d97706', suit: 'sport', pattern: 'stripe', c1: 0x059669, c2: 0x064e3b, metal: 0xfacc15,
            acc: 'scrunchie', accC: 0x10b981, jewelry: 'hoop', bellyChain: true, nail: 0x10b981,
            morph: { bust: 1.08, hip: 1.08, waist: 0.94, thigh: 1.05 }, height: 1.02
        },
        {
            name: 'Aiko', skin: 0xf2c29b, blush: '#f43f5e', hair: 0x881313, hairHi: '#f87171', style: 'braid',
            eyes: '#dc2626', suit: 'frill', pattern: 'polka', c1: 0xf59e0b, c2: 0xfef08a, metal: 0xfde047,
            acc: 'hat', accC: 0xfde68a, jewelry: 'choker', nail: 0xf59e0b,
            morph: { bust: 1.16, hip: 1.10, waist: 0.93, thigh: 1.06 }, height: 0.99
        },
        {
            name: 'Nami', skin: 0x8c522a, blush: '#e11d48', hair: 0x090d16, hairHi: '#818cf8', style: 'long',
            eyes: '#f59e0b', suit: 'monokini', pattern: 'ombre', c1: 0xbe185d, c2: 0xf472b6, metal: 0xfacc15,
            acc: 'flower', accC: 0xfacc15, jewelry: 'bangle', garter: true, bellyChain: true, nail: 0xdb2777,
            morph: { bust: 1.28, hip: 1.16, waist: 0.89, thigh: 1.11 }, height: 1.05
        },
        {
            name: 'Kiko', skin: 0xe9b482, blush: '#db2777', hair: 0x7c3aed, hairHi: '#ddd6fe', style: 'drills',
            eyes: '#0d9488', suit: 'shell', sarong: true, pattern: 'shell', c1: 0x0d9488, c2: 0x99f6e4, metal: 0xf8fafc,
            acc: 'bow', accC: 0x5b21b6, jewelry: 'choker', nail: 0x14b8a6,
            morph: { bust: 1.10, hip: 1.07, waist: 0.93, thigh: 1.04 }, height: 0.99
        }
    ];

    // ------------------------------------------------------------------------
    // Heart projectile, burst & footstep sand-puff sprites
    // ------------------------------------------------------------------------
    function heartTex() {
        return L.canvasTex('aaa26-heart-sprite', 128, 128, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            const path = () => {
                g.beginPath();
                g.moveTo(64, 110);
                g.bezierCurveTo(10, 72, 10, 22, 40, 22);
                g.bezierCurveTo(56, 22, 64, 34, 64, 42);
                g.bezierCurveTo(64, 34, 72, 22, 88, 22);
                g.bezierCurveTo(118, 22, 118, 72, 64, 110);
                g.closePath();
            };
            g.shadowColor = '#ff2e93'; g.shadowBlur = 16;
            const gr = g.createLinearGradient(0, 20, 0, 110);
            gr.addColorStop(0, '#ff85c0'); gr.addColorStop(0.5, '#ff3d9a'); gr.addColorStop(1, '#db2777');
            path(); g.fillStyle = gr; g.fill();
            g.shadowBlur = 0;
            g.strokeStyle = 'rgba(255,255,255,0.68)'; g.lineWidth = 3;
            path(); g.stroke();
            g.fillStyle = 'rgba(255,255,255,0.9)';
            g.beginPath(); g.ellipse(44, 42, 11, 7, -0.55, 0, TAU); g.fill();
        });
    }
    let heartMat = null;
    function heartSprite(scale) {
        if (!heartMat) heartMat = new THREE.SpriteMaterial({ map: heartTex(), transparent: true, depthWrite: false });
        const s = new THREE.Sprite(heartMat);
        s.scale.setScalar(scale);
        return s;
    }

    function heartBurst(S, pos, n = 10) {
        for (let i = 0; i < n; i++) {
            const h = heartSprite(0.16 + Math.random() * 0.14);
            h.position.copy(pos);
            S.add(h);
            const v = V((Math.random() - 0.5) * 1.9, 1.3 + Math.random() * 1.6, (Math.random() - 0.5) * 1.9);
            let t = 0;
            S.animate((dt) => {
                t += dt;
                h.position.addScaledVector(v, dt);
                v.y -= 0.4 * dt;
                v.multiplyScalar(1 - dt * 1.15);
                h.scale.setScalar(Math.max(0.001, h.scale.x * (t > 0.95 ? 0.9 : 1.0)));
                if (t > 1.45) { if (h.parent) h.parent.remove(h); return false; }
            });
        }
    }

    let sandMat = null;
    function sandPuff(S, pos) {
        if (!sandMat) {
            const tex = L.canvasTex('aaa26-sand-puff', 64, 64, (g, w, h) => {
                const rg = g.createRadialGradient(32, 32, 4, 32, 32, 30);
                rg.addColorStop(0, 'rgba(216, 178, 122, 0.72)');
                rg.addColorStop(1, 'rgba(216, 178, 122, 0)');
                g.fillStyle = rg; g.fillRect(0, 0, w, h);
            });
            sandMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
        }
        const sp = new THREE.Sprite(sandMat);
        sp.position.set(pos.x + (Math.random() - 0.5) * 0.24, 0.08, pos.z - 0.12);
        sp.scale.setScalar(0.18 + Math.random() * 0.12);
        S.add(sp);
        const vy = 0.55 + Math.random() * 0.35, vz = -0.7 - Math.random() * 0.5;
        let t = 0;
        S.animate((dt) => {
            t += dt;
            sp.position.y += vy * dt * (1 - t * 1.4);
            sp.position.z += vz * dt;
            sp.scale.addScalar(dt * 0.45);
            if (t > 0.42) { if (sp.parent) sp.parent.remove(sp); return false; }
        });
    }

    // ------------------------------------------------------------------------
    // Sculpted Hand (w/ glossy painted nails) & Designer Resort Sandals
    // ------------------------------------------------------------------------
    const hitBoxGeo = new THREE.BoxGeometry(1, 1, 1);

    function buildHand(G, skinM, nailM, side) {
        const g = new THREE.Group();
        const palm = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), skinM);
        palm.scale.set(0.80, 1.15, 0.45);
        palm.position.y = -0.024;
        g.add(palm);
        for (let i = 0; i < 4; i++) {
            const fLen = (i === 1 || i === 2) ? 0.043 : 0.035;
            const fx = (-0.0135 + i * 0.009) * side;
            const fg = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0033, fLen, 6), skinM);
            fg.position.set(fx, -0.048 - fLen * 0.45, 0.005);
            fg.rotation.x = 0.24;
            const nail = new THREE.Mesh(G.nail, nailM);
            nail.position.set(fx, -0.048 - fLen * 0.88, 0.012);
            g.add(fg, nail);
        }
        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.0052, 0.0038, 0.030, 6), skinM);
        thumb.position.set(-0.021 * side, -0.024, 0.011);
        thumb.rotation.set(0.25, 0, -0.55 * side);
        g.add(thumb);
        return g;
    }

    function buildFootSandal(G, skinM, soleM, strapM, metalM, nailM) {
        const g = new THREE.Group();
        const heel = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), skinM);
        heel.scale.set(0.86, 0.72, 1.35);
        heel.position.set(0, -0.022, 0.008);
        const fore = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), skinM);
        fore.scale.set(0.98, 0.52, 1.48);
        fore.position.set(0, -0.032, 0.080);
        g.add(heel, fore);
        for (let i = 0; i < 5; i++) {
            const tr = i === 0 ? 0.0088 : 0.0068 - i * 0.0005;
            const tx = -0.021 + i * 0.0105;
            const tz = 0.130 - Math.abs(i - 0.5) * 0.006;
            const toe = new THREE.Mesh(new THREE.SphereGeometry(tr, 8, 6), skinM);
            toe.position.set(tx, -0.038, tz);
            toe.scale.set(1, 0.82, 1.22);
            const tn = new THREE.Mesh(G.nail, nailM);
            tn.position.set(tx, -0.032, tz + 0.005);
            g.add(toe, tn);
        }
        const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.039, 0.018, 16), soleM);
        sole.scale.set(0.95, 1, 2.28);
        sole.position.set(0, -0.050, 0.052);
        const trim = new THREE.Mesh(new THREE.TorusGeometry(0.041, 0.0032, 6, 18), metalM);
        trim.rotation.x = Math.PI / 2;
        trim.scale.set(0.95, 2.28, 1);
        trim.position.set(0, -0.046, 0.052);
        g.add(sole, trim);
        for (const s of [-1, 1]) {
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.0048, 0.0048, 0.090, 6), strapM);
            st.position.set(s * 0.018, -0.014, 0.086);
            st.rotation.set(1.18, 0, s * 0.36);
            g.add(st);
        }
        for (let k = 0; k < 2; k++) {
            const ankleStrap = new THREE.Mesh(new THREE.TorusGeometry(0.033 + k * 0.001, 0.0038, 6, 16), strapM);
            ankleStrap.rotation.x = Math.PI / 2 + (k === 0 ? 0.18 : -0.18);
            ankleStrap.position.set(0, 0.002 + k * 0.018, 0.0);
            g.add(ankleStrap);
        }
        const charm = new THREE.Mesh(new THREE.OctahedronGeometry(0.009, 0), metalM);
        charm.position.set(0, -0.004, 0.116);
        g.add(charm);
        return g;
    }

    // ------------------------------------------------------------------------
    // Main 2026 AAA Skinned Character Builder
    // ------------------------------------------------------------------------
    function buildGirl(d) {
        const AN = BO.BeachAnatomy;
        const B = AN.BONE;
        const G = AN.getStaticGeos();
        const mats = [];
        const { skinM, hairM, suit1, suit2, metalM, accM, nailM, corneaM, env } = AN.createMaterials(d, mats);

        const root = new THREE.Group();
        const body = new THREE.Group();
        body.scale.setScalar(d.height || 1.02);
        root.add(body);

        // 1. Create 25-Bone Humanoid + Bodyfat Skeleton & Bind Unified Skinned Body + Swimsuit!
        const bones = AN.createSkeleton();
        body.add(bones[B.ROOT]);
        body.updateMatrixWorld(true);
        const skeleton = new THREE.Skeleton(bones);

        const bodyGeo = AN.getSkinnedBodyGeo(d.morph);
        const bodySkin = new THREE.SkinnedMesh(bodyGeo, skinM);
        bodySkin.castShadow = true;
        bodySkin.frustumCulled = false;
        bodySkin.userData.noHit = true;
        body.add(bodySkin);
        bodySkin.bind(skeleton);

        const suitGeo = AN.getSkinnedSuitGeo(d.suit, d.morph);
        const suitMesh = new THREE.SkinnedMesh(suitGeo, suit1);
        suitMesh.castShadow = true;
        suitMesh.frustumCulled = false;
        suitMesh.userData.noHit = true;
        body.add(suitMesh);
        suitMesh.bind(skeleton);

        const P = {
            bones,
            hips: bones[B.HIPS],
            spine: bones[B.SPINE],
            chest: bones[B.CHEST],
            neck: bones[B.NECK],
            head: bones[B.HEAD],
            thighL: bones[B.THIGH_L], thighR: bones[B.THIGH_R],
            kneeL: bones[B.SHIN_L], kneeR: bones[B.SHIN_R],
            ankleL: bones[B.FOOT_L], ankleR: bones[B.FOOT_R],
            shL: bones[B.SH_L], shR: bones[B.SH_R],
            elL: bones[B.EL_L], elR: bones[B.EL_R],
            wrL: bones[B.WR_L], wrR: bones[B.WR_R],
            sway: [],
            springs: {}
        };

        // Fast O(1) invisible bone-parented hit-capsules (avoids CPU-raycasting 6,000 skinned triangles!)
        const hit = [];
        const addHitBox = (bone, w, h, dz, offY, tag = 'torso') => {
            const hm = new THREE.Mesh(hitBoxGeo, HIDDEN_MAT);
            hm.scale.set(w, h, dz);
            hm.position.y = offY;
            hm.userData.hitbox = tag;
            bone.add(hm);
            hit.push(hm);
        };
        addHitBox(P.hips, 0.36, 0.26, 0.26, 0.02);
        addHitBox(P.chest, 0.34, 0.42, 0.26, 0.04);
        addHitBox(P.head, 0.26, 0.28, 0.26, 0.12, 'head');
        addHitBox(P.thighL, 0.16, 0.44, 0.16, -0.22);
        addHitBox(P.thighR, 0.16, 0.44, 0.16, -0.22);
        addHitBox(P.kneeL, 0.13, 0.42, 0.14, -0.21);
        addHitBox(P.kneeR, 0.13, 0.42, 0.14, -0.21);

        // 2. Attach Soft-Engine Spring-Damper Rigs to All 7 Bodyfat/Soft-Tissue Bones!
        const bSc = d.morph.bust || 1.12;
        const hSc = d.morph.hip || 1.08;
        P.springs.bust = [
            { bone: bones[B.BREAST_L], base: bones[B.BREAST_L].position.clone(), sp: AN.makeSpring(88, 7.2, 0.038 * bSc), side: 1 },
            { bone: bones[B.BREAST_R], base: bones[B.BREAST_R].position.clone(), sp: AN.makeSpring(88, 7.2, 0.038 * bSc), side: -1 }
        ];
        P.springs.glutes = [
            { bone: bones[B.GLUTE_L], base: bones[B.GLUTE_L].position.clone(), sp: AN.makeSpring(118, 10.5, 0.026 * hSc), side: 1 },
            { bone: bones[B.GLUTE_R], base: bones[B.GLUTE_R].position.clone(), sp: AN.makeSpring(118, 10.5, 0.026 * hSc), side: -1 }
        ];
        P.springs.belly = { bone: bones[B.BELLY], base: bones[B.BELLY].position.clone(), sp: AN.makeSpring(135, 12.0, 0.016) };
        P.springs.thighs = [
            { bone: bones[B.THIGH_SOFT_L], base: bones[B.THIGH_SOFT_L].position.clone(), sp: AN.makeSpring(130, 11.0, 0.020), side: 1 },
            { bone: bones[B.THIGH_SOFT_R], base: bones[B.THIGH_SOFT_R].position.clone(), sp: AN.makeSpring(130, 11.0, 0.020), side: -1 }
        ];

        // 3. Attach Hands, Painted Nails, Sandals & Couture Body Accessories to Skeleton Bones!
        P.wrL.add(buildHand(G, skinM, nailM, 1));
        P.wrR.add(buildHand(G, skinM, nailM, -1));
        P.ankleL.add(buildFootSandal(G, skinM, suit2, suit1, metalM, nailM));
        P.ankleR.add(buildFootSandal(G, skinM, suit2, suit1, metalM, nailM));

        // Lace/Gold Thigh Garter Ribbon (Mina, Nami) or Athletic Knee-Band (Rin)
        if (d.garter) {
            const garter = new THREE.Mesh(new THREE.TorusGeometry(0.084 * d.morph.thigh, 0.007, 8, 24), d.jewelry === 'bangle' ? metalM : accM);
            garter.rotation.x = Math.PI / 2;
            garter.position.y = -0.15;
            const charm = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0), metalM);
            charm.position.set(0.05, -0.15, 0.072);
            P.thighL.add(garter, charm);
        }
        if (d.kneeBand) {
            const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.051, 0.049, 0.048, 18), suit2);
            kb.position.y = -0.02;
            P.kneeR.add(kb);
        }
        if (d.jewelry === 'anklet' || d.jewelry === 'bangle') {
            for (let k = 0; k < 2; k++) {
                const ank = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.0035, 6, 18), metalM);
                ank.rotation.x = Math.PI / 2 + (k ? 0.14 : -0.1);
                ank.position.y = -0.37 - k * 0.012;
                P.kneeR.add(ank);
            }
        }
        if (d.acc === 'scrunchie') {
            const sc = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.012, 8, 18), accM);
            sc.rotation.x = Math.PI / 2; sc.position.y = -0.19; P.elL.add(sc);
        } else if (d.jewelry === 'bangle') {
            for (let b = 0; b < 3; b++) {
                const bg = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.0032, 6, 16), metalM);
                bg.rotation.x = Math.PI / 2; bg.position.y = -0.18 - b * 0.011; P.elR.add(bg);
            }
            // Gold upper-arm goddess cuff!
            const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.004, 6, 18), metalM);
            cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.11; P.shL.add(cuff);
        } else if (d.jewelry === 'band') {
            for (const el of [P.elL, P.elR]) {
                const wb = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.026, 0.042, 14), suit2);
                wb.position.y = -0.19; el.add(wb);
            }
        }

        // Couture Halter Straps, Sternum Gold O-Ring, Belly Chains & Side-Tie Ribbons!
        for (const s of [-1, 1]) {
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.175, 8), suit1);
            st.position.set(s * 0.064, 0.135, 0.056);
            st.rotation.set(-0.46, 0, s * 0.28);
            P.chest.add(st);
            const backTie = new THREE.Group();
            backTie.position.set(s * 0.018, 0.20, -0.048);
            const str = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.002, 0.13, 6), suit1);
            str.position.y = -0.065;
            const ag = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 6), metalM);
            ag.position.y = -0.132;
            backTie.add(str, ag);
            P.chest.add(backTie);
            P.sway.push({ obj: backTie, kind: 'ribbon', mirror: s });
        }

        if (d.suit !== 'sport') {
            const cRing = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.004, 6, 16), metalM);
            cRing.position.set(0, 0.022, 0.105);
            P.chest.add(cRing);
        } else {
            const zip = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.115, 0.010), metalM);
            zip.position.set(0, 0.045, 0.104);
            P.chest.add(zip);
        }

        if (d.bellyChain || d.suit === 'monokini') {
            const bc = new THREE.Mesh(new THREE.TorusGeometry(0.098 * d.morph.waist, 0.0035, 6, 28), metalM);
            bc.rotation.x = Math.PI / 2 + 0.14;
            bc.scale.set(1.04, 0.82, 1);
            bc.position.y = 0.035;
            const drop = new THREE.Mesh(new THREE.OctahedronGeometry(0.010, 0), metalM);
            drop.position.set(0, 0.012, 0.092);
            P.spine.add(bc, drop);
        }

        // Hip side-tie ribbons w/ 24k gold O-rings & aglets
        for (const s of [-1, 1]) {
            const hRing = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.0035, 6, 14), metalM);
            hRing.position.set(s * 0.168 * hSc, 0.025, 0.012);
            hRing.rotation.y = Math.PI / 2;
            P.hips.add(hRing);
            if (d.suit !== 'sport' && d.suit !== 'monokini') {
                const tie = new THREE.Group();
                tie.position.set(s * 0.172 * hSc, 0.024, 0.012);
                for (const k of [-1, 1]) {
                    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 12), suit2);
                    loop.position.set(s * 0.011, k * 0.010, 0);
                    loop.rotation.y = Math.PI / 2;
                    tie.add(loop);
                }
                for (const tOff of [-0.008, 0.008]) {
                    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.002, 0.09, 6), suit2);
                    tail.position.set(s * 0.013, -0.046, tOff);
                    const ag = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.011, 6), metalM);
                    ag.position.set(s * 0.013, -0.092, tOff);
                    tie.add(tail, ag);
                }
                P.hips.add(tie);
                P.sway.push({ obj: tie, kind: 'ribbon', mirror: s });
            }
        }

        // Couture Flowing Skirts, Sheer Chiffon Sarongs & Open-Front Riviera Pareos!
        if (d.suit === 'frill') {
            const flounceM = new THREE.MeshPhysicalMaterial({
                color: 0xffffff, map: AN.fabricAlbedoTex(d.pattern, d.c2, d.c1),
                roughness: 0.38, side: THREE.DoubleSide, sheen: 0.35, envMap: env, envMapIntensity: 0.8, emissive: 0x000000
            });
            mats.push(flounceM);
            P.chest.add(new THREE.Mesh(G.flounce, flounceM));

            const skirtG = new THREE.Group();
            skirtG.position.y = 0.025;
            const skGeo = new THREE.CylinderGeometry(0.158 * hSc, 0.278 * hSc, 0.21, 32, 3, true);
            const spPos = skGeo.attributes.position;
            for (let i = 0; i < spPos.count; i++) {
                const x = spPos.getX(i), y = spPos.getY(i), z = spPos.getZ(i);
                const hem = AN.clamp((0.105 - y) / 0.21, 0, 1);
                const pleat = 1 + Math.sin(Math.atan2(z, x) * 16) * 0.09 * hem;
                spPos.setX(i, x * pleat);
                spPos.setZ(i, z * pleat * 0.86);
            }
            skGeo.computeVertexNormals();
            const skirt = new THREE.Mesh(skGeo, suit1);
            skirt.position.y = -0.10;
            skirtG.add(skirt);
            P.hips.add(skirtG);
            P.sway.push({ obj: skirtG, kind: 'skirt' });
        }

        if (d.sarong || d.pareo) {
            const sarG = new THREE.Group();
            sarG.position.y = 0.03;
            const arcStart = d.pareo ? 0.55 : -0.32;
            const arcLen = d.pareo ? Math.PI * 1.35 : Math.PI * 1.58;
            const sarGeo = new THREE.CylinderGeometry(0.168 * hSc, 0.295 * hSc, 0.48, 32, 4, true, arcStart, arcLen);
            const sarPos = sarGeo.attributes.position;
            for (let i = 0; i < sarPos.count; i++) {
                const x = sarPos.getX(i), y = sarPos.getY(i), z = sarPos.getZ(i);
                const hem = AN.clamp((0.24 - y) / 0.48, 0, 1);
                const wave = 1 + Math.sin(Math.atan2(z, x) * 8) * 0.08 * hem;
                sarPos.setX(i, x * wave);
                sarPos.setZ(i, z * wave * 0.85);
            }
            sarGeo.computeVertexNormals();
            const sarM = new THREE.MeshPhysicalMaterial({
                color: 0xffffff, map: AN.fabricAlbedoTex(d.pattern, d.c2, d.c1),
                roughness: 0.32, side: THREE.DoubleSide, transparent: true, opacity: d.pareo ? 0.68 : 0.82,
                sheen: 0.45, envMap: env, envMapIntensity: 0.8, emissive: 0x000000
            });
            mats.push(sarM);
            const sar = new THREE.Mesh(sarGeo, sarM);
            sar.position.y = -0.22;
            const knot = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), sarM);
            knot.position.set(0.172 * hSc, 0.01, 0.045);
            sarG.add(sar, knot);
            P.hips.add(sarG);
            P.sway.push({ obj: sarG, kind: 'sarong' });
        }

        // Choker / Pearl Necklace on Neck Bone
        if (d.jewelry === 'pearl' || d.jewelry === 'choker') {
            const ch = new THREE.Mesh(new THREE.TorusGeometry(0.040, 0.0048, 6, 22), d.jewelry === 'pearl' ? suit2 : accM);
            ch.rotation.x = Math.PI / 2; ch.position.y = 0.045;
            const pend = new THREE.Mesh(new THREE.OctahedronGeometry(0.010, 0), metalM);
            pend.position.set(0, 0.032, 0.044);
            P.neck.add(ch, pend);
        }

        // 4. 3D Sculpted Anime Head + Glossy 3D Cornea Lenses + Parted Silk Hair!
        const skull = new THREE.Mesh(G.head, skinM);
        skull.castShadow = true;
        skull.userData.noHit = true;
        P.head.add(skull);

        for (const s of [-1, 1]) {
            const ear = new THREE.Mesh(G.ear, skinM);
            ear.position.set(s * 0.110, 0.104, -0.005);
            P.head.add(ear);
            if (d.jewelry === 'hoop' || d.jewelry === 'pearl') {
                const er = d.jewelry === 'hoop'
                    ? new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0026, 6, 16), metalM)
                    : new THREE.Mesh(new THREE.SphereGeometry(0.0085, 8, 6), suit2);
                er.position.set(s * 0.116, 0.076, -0.002);
                er.rotation.y = Math.PI / 2;
                P.head.add(er);
            }
            // Real 3D Glossy Wet Cornea Dome over each eye (catches moving 3D sunlight!)
            const cor = new THREE.Mesh(G.cornea, corneaM);
            cor.position.set(s * 0.042, 0.122, 0.098);
            cor.userData.noHit = true;
            P.head.add(cor);
        }

        const faceTexOpen = AN.faceOverlayTex(d.eyes, d.hair, d.blush, 'open');
        const faceTexBlink = AN.faceOverlayTex(d.eyes, d.hair, d.blush, 'blink');
        const faceTexHappy = AN.faceOverlayTex(d.eyes, d.hair, d.blush, 'happy');
        const faceMat = new THREE.MeshBasicMaterial({ map: faceTexOpen, transparent: true, depthWrite: false });
        const face = new THREE.Mesh(new THREE.SphereGeometry(0.115, 28, 20, Math.PI / 2 - 0.72, 1.44, Math.PI / 2 - 0.46, 0.96), faceMat);
        face.scale.set(0.98, 1.04, 0.98);
        face.position.set(0, 0.116, 0.006);
        face.userData.noHit = true;
        P.head.add(face);
        P.faceMat = faceMat;
        P.faces = { open: faceTexOpen, blink: faceTexBlink, happy: faceTexHappy };

        // Salon-Parted Volumetric Hair (NEVER covers or blocks the eyes!)
        const hairCap = new THREE.Mesh(
            new THREE.SphereGeometry(d.style === 'bob' ? 0.134 : 0.128, 28, 18, 0, TAU, 0, Math.PI * (d.style === 'bob' ? 0.72 : 0.58)),
            hairM
        );
        hairCap.position.set(0, 0.142, -0.010);
        hairCap.rotation.x = -0.36;
        hairCap.scale.set(1.04, 1.04, 1.02);
        hairCap.castShadow = true;
        P.head.add(hairCap);

        // Delicate wispy center bangs (stop ABOVE eyebrows!) + temple-parted curtain bangs!
        for (const ox of [-0.018, 0.008]) {
            const wisp = new THREE.Mesh(G.bangWispy, hairM);
            wisp.position.set(ox, 0.232, 0.092);
            wisp.rotation.set(-0.08, ox * 2.2, ox * 1.4);
            P.head.add(wisp);
        }
        for (let k = 0; k < 3; k++) {
            const bL = new THREE.Mesh(G.bangPartL, hairM);
            bL.position.set(-0.025 - k * 0.026, 0.234 - k * 0.008, 0.092 - k * 0.014);
            bL.rotation.set(-0.06, -0.18 - k * 0.15, -0.12 - k * 0.08);
            const bR = new THREE.Mesh(G.bangPartR, hairM);
            bR.position.set(0.025 + k * 0.026, 0.234 - k * 0.008, 0.092 - k * 0.014);
            bR.rotation.set(-0.06, 0.18 + k * 0.15, 0.12 + k * 0.08);
            P.head.add(bL, bR);
        }

        // Cheek-framing sidelocks
        for (const s of [-1, 1]) {
            for (let k = 0; k < 2; k++) {
                const lockPiv = new THREE.Group();
                lockPiv.position.set(s * (0.106 + k * 0.007), 0.172 - k * 0.012, 0.042 - k * 0.026);
                const lk = new THREE.Mesh(G.sidelock, hairM);
                lk.scale.set(s * (0.76 - k * 0.12), d.style === 'bob' ? 0.92 : 1.25, 0.70);
                lockPiv.add(lk);
                P.head.add(lockPiv);
                P.sway.push({ obj: lockPiv, kind: 'sidelock', mirror: s });
            }
        }

        const hangChain = (x, y, z, scaleXZ, segs, kind, mirror, useDrill = false) => {
            const pivot = new THREE.Group();
            pivot.position.set(x, y, z);
            let parent = pivot;
            for (let i = 0; i < segs; i++) {
                const seg = new THREE.Group();
                const isLast = i === segs - 1;
                const geo = useDrill ? G.hairDrill : (isLast ? G.hairTip : G.hairSeg);
                const m = new THREE.Mesh(geo, hairM);
                const tap = 1 - i * 0.10;
                m.scale.set(scaleXZ * tap, 1.0, scaleXZ * tap * 0.85);
                seg.add(m);
                parent.add(seg);
                if (i > 0) seg.position.y = -0.122;
                P.sway.push({ obj: seg, kind, i, mirror, sp: AN.makeSpring(72 - i * 8, 6.6, 0.65) });
                parent = seg;
            }
            P.head.add(pivot);
            return pivot;
        };

        if (d.style === 'twintails' || d.style === 'drills') {
            for (const s of [-1, 1]) {
                hangChain(s * 0.114, 0.192, -0.044, 1.14, 5, 'tail', s, d.style === 'drills');
                const tie = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.010, 8, 16), accM);
                tie.position.set(s * 0.114, 0.192, -0.044);
                tie.rotation.y = s * 0.7;
                P.head.add(tie);
            }
        } else if (d.style === 'ponytail') {
            hangChain(0, 0.218, -0.118, 1.30, 5, 'tail', 0);
            const tie = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.011, 8, 16), accM);
            tie.position.set(0, 0.218, -0.118);
            tie.rotation.x = 0.5;
            P.head.add(tie);
        } else if (d.style === 'long') {
            for (const ox of [-0.080, -0.040, 0, 0.040, 0.080]) {
                hangChain(ox, 0.156, -0.102 + Math.abs(ox) * 0.24, 0.90, 5, 'long', Math.sign(ox));
            }
        } else if (d.style === 'bun') {
            const bun = new THREE.Mesh(new THREE.SphereGeometry(0.072, 18, 14), hairM);
            bun.position.set(0, 0.268, -0.058);
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.012, 8, 18), accM);
            band.rotation.x = Math.PI / 2 - 0.35;
            band.position.set(0, 0.234, -0.046);
            P.head.add(bun, band);
            hangChain(0, 0.200, -0.110, 0.68, 3, 'tail', 0);
        } else if (d.style === 'braid') {
            const pivot = new THREE.Group();
            pivot.position.set(0.095, 0.075, 0.020);
            let parent = pivot;
            for (let i = 0; i < 6; i++) {
                const seg = new THREE.Group();
                const bead = new THREE.Mesh(new THREE.SphereGeometry(0.030 * (1 - i * 0.07), 12, 10), hairM);
                bead.scale.set(1.1, 1.35, 0.85); bead.position.y = -0.030;
                seg.add(bead);
                if (i === 5) {
                    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.006, 6, 12), accM);
                    tie.rotation.x = Math.PI / 2; tie.position.y = -0.056;
                    const tuft = new THREE.Mesh(G.hairTip, hairM);
                    tuft.scale.setScalar(0.60); tuft.position.y = -0.060;
                    seg.add(tie, tuft);
                }
                parent.add(seg);
                if (i > 0) seg.position.y = -0.060;
                P.sway.push({ obj: seg, kind: 'braid', i, mirror: 1, sp: AN.makeSpring(82 - i * 8, 7.5, 0.45) });
                parent = seg;
            }
            P.head.add(pivot);
        }

        // Head Couture Accessories
        if (d.acc === 'bow') {
            const bow = new THREE.Group();
            for (const s of [-1, 1]) {
                const wing = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.092, 8), accM);
                wing.rotation.z = s * Math.PI / 2; wing.scale.set(0.75, 1, 0.42); wing.position.x = s * 0.044;
                bow.add(wing);
            }
            bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.020, 10, 8), accM));
            bow.position.set(0.090, 0.240, 0.015); bow.rotation.z = -0.38;
            P.head.add(bow);
        } else if (d.acc === 'flower') {
            const fl = new THREE.Group();
            for (let i = 0; i < 5; i++) {
                const a = i / 5 * TAU;
                const pet = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), accM);
                pet.scale.set(1.22, 0.72, 0.35);
                pet.position.set(Math.cos(a) * 0.029, Math.sin(a) * 0.029, 0);
                pet.rotation.z = a;
                fl.add(pet);
            }
            fl.add(new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), metalM));
            fl.position.set(0.118, 0.172, 0.038); fl.rotation.y = 1.15;
            P.head.add(fl);
        } else if (d.acc === 'visor') {
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.130, 0.011, 8, 28), accM);
            band.rotation.x = Math.PI / 2 - 0.24; band.position.y = 0.188;
            const brim = new THREE.Mesh(
                new THREE.CylinderGeometry(0.110, 0.110, 0.007, 20, 1, false, -0.88, 1.76),
                new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, roughness: 0.10, transparent: true, opacity: 0.72, clearcoat: 0.9, envMap: env })
            );
            brim.position.set(0, 0.200, 0.116); brim.rotation.x = 0.16;
            P.head.add(band, brim);
        } else if (d.acc === 'shades') {
            const sg = new THREE.Group();
            sg.position.set(0, 0.256, 0.056); sg.rotation.x = -0.58;
            const lensM = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.06, metalness: 0.8, clearcoat: 1.0, envMap: env });
            for (const s of [-1, 1]) {
                const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.009, 14), lensM);
                lens.rotation.x = Math.PI / 2; lens.scale.set(1.2, 1, 0.85); lens.position.x = s * 0.041;
                const frame = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0038, 6, 16), metalM);
                frame.scale.set(1.2, 0.85, 1); frame.position.x = s * 0.041;
                sg.add(lens, frame);
            }
            sg.add(new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.005, 0.005), metalM));
            P.head.add(sg);
        } else if (d.acc === 'hat') {
            const hatG = new THREE.Group();
            hatG.position.y = 0.240;
            const brimGeo = new THREE.CylinderGeometry(0.280, 0.300, 0.011, 28, 1);
            const bp = brimGeo.attributes.position;
            for (let i = 0; i < bp.count; i++) {
                const x = bp.getX(i), z = bp.getZ(i), r = Math.hypot(x, z);
                if (r > 0.14) bp.setY(i, bp.getY(i) - Math.sin(Math.atan2(z, x) * 3) * 0.016 * (r / 0.30));
            }
            brimGeo.computeVertexNormals();
            const brim = new THREE.Mesh(brimGeo, accM);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.114, 0.136, 0.092, 22), accM);
            crown.position.y = 0.046;
            const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.138, 0.028, 22), suit1);
            ribbon.position.y = 0.016;
            hatG.add(brim, crown, ribbon);
            for (const s of [-1, 1]) {
                const rt = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.22, 0.004), suit1);
                rt.position.set(s * 0.028, -0.095, -0.150); rt.rotation.x = 0.35;
                hatG.add(rt);
                P.sway.push({ obj: rt, kind: 'ribbon', mirror: s });
            }
            P.head.add(hatG);
            P.sway.push({ obj: brim, kind: 'brim' });
        }

        return {
            root, body, parts: P, hit, mats, def: d,
            prevY: 0.94, prevVy: 0, prevX: 0, prevVx: 0,
            blinkT: 1.4 + Math.random() * 2.5, blinking: false,
            breathT: Math.random() * TAU, lastStepSign: 1
        };
    }

    // ------------------------------------------------------------------------
    // GPU-Skinned Soft-Engine Jiggle Bone Solver (Breasts, Glutes, Belly, Thighs!)
    // ------------------------------------------------------------------------
    function stepSoftPhysics(g, dt, speed, amt, ph, extraImpulseY = 0) {
        const AN = BO.BeachAnatomy;
        const P = g.parts;
        const d = Math.min(Math.max(dt, 0.001), 0.035);

        const curY = g.root.position.y + P.hips.position.y;
        const curX = g.root.position.x;
        const vy = (curY - g.prevY) / d;
        const vx = (curX - g.prevX) / d;
        const ay = AN.clamp((vy - g.prevVy) / d, -55, 55) + extraImpulseY;
        const ax = AN.clamp((vx - g.prevVx) / d, -30, 30);
        g.prevY = curY; g.prevVy = vy;
        g.prevX = curX; g.prevVx = vx;

        const twistAcc = Math.cos(ph) * 8.5 * amt;

        // 1. Skinned Breast Jiggle Bones (3-axis spring + rotational sway + squash-and-stretch!)
        for (const br of P.springs.bust) {
            const sideTwist = twistAcc * br.side * 0.58;
            AN.stepSpring(br.sp, -ax * 0.085 + sideTwist * 0.12, -ay * 0.145, -Math.abs(ay) * 0.035 + sideTwist * 0.08, d);
            br.bone.position.set(br.base.x + br.sp.x, br.base.y + br.sp.y, br.base.z + br.sp.z);
            br.bone.rotation.x = -br.sp.y * 15;
            br.bone.rotation.z = br.sp.x * 11;
            const sy = 1 + AN.clamp(br.sp.y * 5.0, -0.12, 0.12);
            const sxz = 1 / Math.sqrt(sy);
            br.bone.scale.set(sxz, sy, sxz);
        }

        // 2. Skinned Glute Jiggle Bones
        for (const gr of P.springs.glutes) {
            AN.stepSpring(gr.sp, -ax * 0.055, -ay * 0.095, -Math.abs(ay) * 0.028, d);
            gr.bone.position.set(gr.base.x + gr.sp.x, gr.base.y + gr.sp.y, gr.base.z + gr.sp.z);
            const sy = 1 + AN.clamp(gr.sp.y * 4.2, -0.08, 0.08);
            gr.bone.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
        }

        // 3. Skinned Soft Belly & Plush Upper-Thigh Jiggle Bones
        const bl = P.springs.belly;
        AN.stepSpring(bl.sp, -ax * 0.03, -ay * 0.06, -Math.abs(ay) * 0.02, d);
        bl.bone.position.set(bl.base.x + bl.sp.x, bl.base.y + bl.sp.y, bl.base.z + bl.sp.z);

        for (const tr of P.springs.thighs) {
            AN.stepSpring(tr.sp, -ax * 0.04, -ay * 0.075, -Math.abs(ay) * 0.02, d);
            tr.bone.position.set(tr.base.x + tr.sp.x, tr.base.y + tr.sp.y, tr.base.z + tr.sp.z);
        }

        // 4. Cascaded 5-Bone Hair Chains & Flowing Sarong/Pareo/Skirt Cloth
        for (const sw of P.sway) {
            const o = sw.obj;
            if (sw.kind === 'tail' || sw.kind === 'braid' || sw.kind === 'long') {
                const lag = (sw.i || 0) * 0.52;
                const drag = (sw.i === 0 ? 0.24 + speed * 0.055 : 0.11) * amt;
                if (sw.sp) {
                    const targetX = drag + Math.sin(ph * 2 - 0.6 - lag) * 0.17 * amt - ay * 0.014;
                    const targetZ = Math.sin(ph - 0.4 - lag) * 0.20 * (sw.mirror || 1) * amt - ax * 0.016;
                    AN.stepSpring(sw.sp, (targetX - sw.sp.x) * 42, 0, (targetZ - sw.sp.z) * 42, d);
                    o.rotation.x = AN.clamp(sw.sp.x, -0.35, 1.15);
                    o.rotation.z = AN.clamp(sw.sp.z, -0.68, 0.68);
                }
            } else if (sw.kind === 'sidelock') {
                o.rotation.x = 0.08 * amt + Math.sin(ph * 2 - 0.4) * 0.08 * amt;
                o.rotation.z = sw.mirror * (0.05 + Math.abs(Math.sin(ph)) * 0.08 * amt);
            } else if (sw.kind === 'skirt' || sw.kind === 'sarong') {
                o.rotation.x = (0.09 + speed * 0.02) * amt + Math.sin(ph * 2 - 0.3) * 0.10 * amt;
                o.rotation.z = Math.sin(ph - 0.2) * 0.08 * amt;
                const flare = 1 + (0.05 + Math.sin(ph * 2) * 0.05) * amt;
                o.scale.set(flare, 1, flare);
            } else if (sw.kind === 'ribbon') {
                o.rotation.x = 0.35 + speed * 0.065 * amt + Math.sin(ph * 2.2) * 0.22 * amt;
                o.rotation.z = Math.sin(ph + (sw.mirror || 1)) * 0.16 * amt;
            } else if (sw.kind === 'brim') {
                o.rotation.x = Math.sin(ph * 2) * 0.06 * amt;
            }
        }
    }

    function updateGirl(g, S, dt, ph, amt, speed, allowBlink = true) {
        const P = g.parts;
        const s = Math.sin(ph);
        const c = Math.cos(ph);

        g.breathT += dt * 2.6;
        const breath = Math.sin(g.breathT) * 0.014;

        // Graceful feminine beach-jog skeleton kinematics (smooth S-spine & hip counter-roll!)
        P.thighL.rotation.x = s * 0.75 * amt;
        P.thighR.rotation.x = -s * 0.75 * amt;
        P.kneeL.rotation.x = (0.20 + Math.max(0, -Math.sin(ph - 0.55)) * 1.15) * amt;
        P.kneeR.rotation.x = (0.20 + Math.max(0, Math.sin(ph - 0.55)) * 1.15) * amt;
        P.ankleL.rotation.x = Math.sin(ph - 0.8) * 0.34 * amt;
        P.ankleR.rotation.x = -Math.sin(ph - 0.8) * 0.34 * amt;

        P.shL.rotation.set(-s * 0.60 * amt + 0.08, 0, -0.06);
        P.shR.rotation.set(s * 0.60 * amt + 0.08, 0, 0.06);
        P.elL.rotation.set(-1.02 * amt, 0, 0.06);
        P.elR.rotation.set(-1.02 * amt, 0, -0.06);

        P.hips.position.y = 0.94 + Math.abs(c) * 0.066 * amt;
        P.hips.rotation.set(0, s * 0.14 * amt, -s * 0.085 * amt);
        P.spine.rotation.set(0.05 * amt, -s * 0.10 * amt, s * 0.04 * amt);
        P.chest.rotation.set(0.06 * amt + breath, -s * 0.14 * amt, s * 0.04 * amt);
        P.head.rotation.set(-0.07 * amt, s * 0.09 * amt, -s * 0.03 * amt);

        stepSoftPhysics(g, dt, speed, amt, ph);

        if (S && amt > 0.7 && speed > 1.5) {
            const sign = s >= 0 ? 1 : -1;
            if (sign !== g.lastStepSign) {
                g.lastStepSign = sign;
                sandPuff(S, g.root.position);
            }
        }

        if (allowBlink && P.faceMat && P.faces) {
            g.blinkT -= dt;
            if (!g.blinking && g.blinkT <= 0) {
                g.blinking = true;
                g.blinkT = 0.11;
                P.faceMat.map = P.faces.blink;
                P.faceMat.needsUpdate = true;
            } else if (g.blinking && g.blinkT <= 0) {
                g.blinking = false;
                g.blinkT = 2.0 + Math.random() * 2.8;
                P.faceMat.map = P.faces.open;
                P.faceMat.needsUpdate = true;
            }
        }
    }

    function giggleSound(pitch) {
        for (let i = 0; i < 5; i++) {
            const f = (820 + (i % 2) * 145 - i * 28) * pitch;
            SFX.tone(f, f * 1.09, 0.08, 'sine', 0.07, i * 0.082);
            SFX.tone(f * 2, f * 2.12, 0.05, 'triangle', 0.022, i * 0.082);
        }
    }

    function reactGirl(S, g, d, pitch) {
        const AN = BO.BeachAnatomy;
        const P = g.parts;
        const r = g.root;
        P.faceMat.map = P.faces.happy;
        P.faceMat.needsUpdate = true;
        for (const m of g.mats) { m.emissive.setHex(0xff5fa8); m.emissiveIntensity = 0.0; }
        giggleSound(pitch);
        const headPos = new THREE.Vector3();
        P.head.getWorldPosition(headPos);
        heartBurst(S, headPos.add(V(0, 0.25, 0)), 11);
        const y0 = r.position.y;
        const side = r.position.x >= 0 ? 1 : -1;
        let t = 0, hearts = 0;
        S.animate((dt) => {
            t += dt;
            const glow = t < 0.25 ? t / 0.25 : Math.max(0, 1 - (t - 0.25) / 2.2);
            for (const m of g.mats) m.emissiveIntensity = 0.35 * glow + Math.max(0, Math.sin(t * 14)) * 0.08 * glow;
            if (t < 1.7) {
                const hop = t < 0.55 ? Math.sin(t / 0.55 * Math.PI) * 0.40 : Math.abs(Math.sin(t * 9)) * 0.04;
                r.position.y = y0 + hop;
                P.thighL.rotation.x = AN.lerp(P.thighL.rotation.x, t < 0.55 ? -0.35 : 0, 0.2);
                P.thighR.rotation.x = AN.lerp(P.thighR.rotation.x, t < 0.55 ? 0.18 : 0, 0.2);
                P.kneeL.rotation.x = AN.lerp(P.kneeL.rotation.x, t < 0.55 ? 1.05 : 0.05, 0.2);
                P.kneeR.rotation.x = AN.lerp(P.kneeR.rotation.x, 0.05, 0.2);
                P.shL.rotation.set(-2.05, 0, 0.48);
                P.shR.rotation.set(-2.05, 0, -0.48);
                P.elL.rotation.set(-1.45, 0, 0);
                P.elR.rotation.set(-1.45, 0, 0);
                P.spine.rotation.set(0, Math.sin(t * 20) * 0.06, 0);
                P.chest.rotation.set(-0.05, Math.sin(t * 22) * 0.08, Math.sin(t * 15) * 0.06);
                P.head.rotation.set(0.05, 0, 0.22 + Math.sin(t * 11) * 0.07);
                P.hips.position.y = 0.94;
                stepSoftPhysics(g, dt, 0.6, 0.82, t * 10, t < 0.12 ? 28 : 0);
                if (t > 0.5 && hearts < 3 && t > 0.5 + hearts * 0.35) {
                    hearts++;
                    const hp = new THREE.Vector3();
                    P.head.getWorldPosition(hp);
                    heartBurst(S, hp.add(V(0, 0.35, 0)), 3);
                }
            } else if (t < 3.4) {
                const k = t - 1.7;
                r.rotation.y = AN.lerp(r.rotation.y, side * 1.3, Math.min(1, dt * 4));
                r.position.x += side * dt * 2.6 * Math.min(1, k * 2);
                r.position.y = y0 + Math.abs(Math.sin(k * 7)) * 0.12;
                updateGirl(g, null, dt, k * 7, 0.55, 1.4, false);
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

    BO.BeachArt = { GIRLS, buildGirl, updateGirl, reactGirl, heartSprite, heartBurst, sandPuff };
})(window);
