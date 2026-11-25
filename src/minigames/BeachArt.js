/* ============================================================================
   BLACKOUT OPS — Sweetheart Shore AAA Character Roster & Soft-Tissue Director
   8 uniquely sculpted high-fashion beach characters built on BO.BeachAnatomy:
   - True 3D sculpted anatomy (S-curve torso, teardrop bust + tailored cups,
     sculpted hips/glutes, contoured limbs, hands w/ painted nails, feet w/
     designer sandals, 3D sculpted anime head w/ nose/lips/ears & jewelry)
   - Multi-layer volumetric hairstyles with 5-bone cascaded spring-damper chains
   - Coupled 3-axis Soft-Engine-style bust & glute spring-damper physics with
     volume-preserving squash-and-stretch, plus breathing, blinking & reactions
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const L = BO.MinigameLib;
    const { SFX, TAU } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    const GIRLS = [
        {
            name: 'Mina', skin: 0xffe0cc, blush: '#ff6b9d', hair: 0xf472b6, hairHi: '#fce7f3', style: 'twintails',
            eyes: '#ec4899', suit: 'frill', pattern: 'gingham', c1: 0xf472b6, c2: 0xffffff, metal: 0xfde047,
            acc: 'bow', accC: 0xbe185d, jewelry: 'pearl', nail: 0xf472b6, bust: 1.08, hip: 1.06, height: 0.99
        },
        {
            name: 'Rin', skin: 0xf6d4b8, blush: '#fb7185', hair: 0x1e293b, hairHi: '#60a5fa', style: 'ponytail',
            eyes: '#0ea5e9', suit: 'sport', pattern: 'mesh', c1: 0x0ea5e9, c2: 0xf8fafc, metal: 0xe2e8f0,
            acc: 'visor', accC: 0xffffff, jewelry: 'band', nail: 0x38bdf8, bust: 0.98, hip: 1.00, height: 1.02
        },
        {
            name: 'Hana', skin: 0xe9b68c, blush: '#f97316', hair: 0x7c2d12, hairHi: '#fb923c', style: 'long',
            eyes: '#16a34a', suit: 'sarong', pattern: 'hibiscus', c1: 0xf97316, c2: 0xfef08a, metal: 0xfacc15,
            acc: 'flower', accC: 0xef4444, jewelry: 'anklet', nail: 0xfb7185, bust: 1.15, hip: 1.10, height: 1.01
        },
        {
            name: 'Yuki', skin: 0xfff0e6, blush: '#f472b6', hair: 0xdbeafe, hairHi: '#ffffff', style: 'bob',
            eyes: '#2563eb', suit: 'onepiece', pattern: 'nautical', c1: 0x1d4ed8, c2: 0xffffff, metal: 0xfbbf24,
            acc: 'shades', accC: 0x0f172a, jewelry: 'pearl', nail: 0x60a5fa, bust: 1.04, hip: 1.04, height: 1.00
        },
        {
            name: 'Sora', skin: 0xc98a4e, blush: '#f43f5e', hair: 0xfacc15, hairHi: '#fef9c3', style: 'bun',
            eyes: '#d97706', suit: 'sport', pattern: 'stripe', c1: 0x10b981, c2: 0x064e3b, metal: 0xfde047,
            acc: 'scrunchie', accC: 0x34d399, jewelry: 'hoop', nail: 0x34d399, bust: 1.06, hip: 1.06, height: 1.01
        },
        {
            name: 'Aiko', skin: 0xffd9b3, blush: '#fb7185', hair: 0x991b1b, hairHi: '#f87171', style: 'braid',
            eyes: '#dc2626', suit: 'frill', pattern: 'polka', c1: 0xfde047, c2: 0xf59e0b, metal: 0xfef3c7,
            acc: 'hat', accC: 0xfef3c7, jewelry: 'ribbon', nail: 0xfef08a, bust: 1.10, hip: 1.08, height: 0.98
        },
        {
            name: 'Nami', skin: 0x9b6236, blush: '#f43f5e', hair: 0x0f172a, hairHi: '#818cf8', style: 'long',
            eyes: '#f59e0b', suit: 'onepiece', pattern: 'ombre', c1: 0xdb2777, c2: 0xfbcfe8, metal: 0xfacc15,
            acc: 'flower', accC: 0xfde047, jewelry: 'bangle', nail: 0xf43f5e, bust: 1.16, hip: 1.12, height: 1.03
        },
        {
            name: 'Kiko', skin: 0xf2c693, blush: '#ec4899', hair: 0xa78bfa, hairHi: '#ede9fe', style: 'twintails',
            eyes: '#14b8a6', suit: 'sarong', pattern: 'shell', c1: 0x14b8a6, c2: 0xccfbf1, metal: 0xe2e8f0,
            acc: 'bow', accC: 0x7c3aed, jewelry: 'choker', nail: 0x2dd4bf, bust: 1.04, hip: 1.05, height: 0.99
        }
    ];

    // ------------------------------------------------------------------------
    // Heart projectile, burst & footstep sand-puff sprites
    // ------------------------------------------------------------------------
    function heartTex() {
        return L.canvasTex('aaa-heart-sprite', 128, 128, (g, w, h) => {
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
            g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 3;
            path(); g.stroke();
            g.fillStyle = 'rgba(255,255,255,0.88)';
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
            const tex = L.canvasTex('aaa-sand-puff', 64, 64, (g, w, h) => {
                const rg = g.createRadialGradient(32, 32, 4, 32, 32, 30);
                rg.addColorStop(0, 'rgba(220, 184, 128, 0.72)');
                rg.addColorStop(1, 'rgba(220, 184, 128, 0)');
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
    // Sculpted Hand (w/ glossy painted fingernails) & Designer Beach Sandals
    // ------------------------------------------------------------------------
    function buildHand(G, skinM, nailM, side) {
        const g = new THREE.Group();
        const palm = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), skinM);
        palm.scale.set(0.82, 1.15, 0.46);
        palm.position.y = -0.025;
        g.add(palm);
        for (let i = 0; i < 4; i++) {
            const fLen = (i === 1 || i === 2) ? 0.044 : 0.036;
            const fx = (-0.015 + i * 0.01) * side;
            const fg = new THREE.Mesh(new THREE.CylinderGeometry(0.0048, 0.0036, fLen, 6), skinM);
            fg.position.set(fx, -0.052 - fLen * 0.45, 0.005);
            fg.rotation.x = 0.24;
            const nail = new THREE.Mesh(G.nail, nailM);
            nail.position.set(fx, -0.052 - fLen * 0.88, 0.013);
            g.add(fg, nail);
        }
        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.0056, 0.0042, 0.032, 6), skinM);
        thumb.position.set(-0.023 * side, -0.026, 0.012);
        thumb.rotation.set(0.25, 0, -0.55 * side);
        g.add(thumb);
        return g;
    }

    function buildFootSandal(G, skinM, soleM, strapM, metalM, nailM) {
        const g = new THREE.Group();
        const heel = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), skinM);
        heel.scale.set(0.88, 0.72, 1.35);
        heel.position.set(0, -0.016, 0.01);
        const fore = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), skinM);
        fore.scale.set(1.0, 0.54, 1.48);
        fore.position.set(0, -0.025, 0.082);
        g.add(heel, fore);
        for (let i = 0; i < 5; i++) {
            const tr = i === 0 ? 0.0092 : 0.0072 - i * 0.00055;
            const tx = -0.023 + i * 0.0115;
            const tz = 0.132 - Math.abs(i - 0.5) * 0.006;
            const toe = new THREE.Mesh(new THREE.SphereGeometry(tr, 8, 6), skinM);
            toe.position.set(tx, -0.032, tz);
            toe.scale.set(1, 0.82, 1.22);
            const tn = new THREE.Mesh(G.nail, nailM);
            tn.position.set(tx, -0.026, tz + 0.005);
            g.add(toe, tn);
        }
        // Contoured espadrille / resort sandal sole + criss-cross ankle straps + charm
        const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.040, 0.018, 16), soleM);
        sole.scale.set(0.95, 1, 2.28);
        sole.position.set(0, -0.045, 0.052);
        const trim = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.0035, 6, 18), metalM);
        trim.rotation.x = Math.PI / 2;
        trim.scale.set(0.95, 2.28, 1);
        trim.position.set(0, -0.042, 0.052);
        g.add(sole, trim);
        for (const s of [-1, 1]) {
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.0052, 0.0052, 0.090, 6), strapM);
            st.position.set(s * 0.018, -0.007, 0.086);
            st.rotation.set(1.18, 0, s * 0.36);
            g.add(st);
        }
        for (let k = 0; k < 2; k++) {
            const ankleStrap = new THREE.Mesh(new THREE.TorusGeometry(0.036 + k * 0.001, 0.0042, 6, 16), strapM);
            ankleStrap.rotation.x = Math.PI / 2 + (k === 0 ? 0.18 : -0.18);
            ankleStrap.position.set(0, 0.006 + k * 0.018, 0.0);
            g.add(ankleStrap);
        }
        const charm = new THREE.Mesh(new THREE.OctahedronGeometry(0.009, 0), metalM);
        charm.position.set(0, 0.003, 0.118);
        g.add(charm);
        return g;
    }

    // ------------------------------------------------------------------------
    // Main AAA Character Builder
    // ------------------------------------------------------------------------
    function buildGirl(d) {
        const AN = BO.BeachAnatomy;
        const G = AN.getGeos();
        const mats = [];
        const { skinM, hairM, suit1, suit2, metalM, accM, nailM } = AN.createMaterials(d, mats);
        const soleM = suit2;

        const root = new THREE.Group();
        const body = new THREE.Group();
        body.scale.setScalar(d.height || 1);
        root.add(body);

        const P = { sway: [], springs: {} };

        // --- SCULPTED HIPS & PELVIS ---
        const hips = new THREE.Group();
        hips.position.y = 0.895;
        body.add(hips);
        P.hips = hips;

        const bottomMat = (d.suit === 'sport' || d.suit === 'sarong') ? suit2 : suit1;
        const pelvis = new THREE.Mesh(G.pelvis, bottomMat);
        pelvis.scale.set(d.hip, 1.0, d.hip);
        hips.add(pelvis);

        // Swimsuit hip-line piping + gold hip O-rings & tie-side strings with aglets
        const waistBand = new THREE.Mesh(new THREE.TorusGeometry(0.138, 0.009, 8, 28), suit2);
        waistBand.rotation.x = Math.PI / 2;
        waistBand.scale.set(1.06 * d.hip, 0.78 * d.hip, 1);
        waistBand.position.y = 0.052;
        hips.add(waistBand);

        if (d.suit === 'sarong' || d.suit === 'frill' || d.suit === 'sport') {
            for (const s of [-1, 1]) {
                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.0035, 6, 14), metalM);
                ring.position.set(s * 0.152 * d.hip, 0.046, 0.012);
                ring.rotation.y = Math.PI / 2;
                hips.add(ring);
                if (d.suit !== 'sport') {
                    const tie = new THREE.Group();
                    tie.position.set(s * 0.156 * d.hip, 0.044, 0.012);
                    for (const k of [-1, 1]) {
                        const loop = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.0045, 6, 12), suit2);
                        loop.position.set(s * 0.012, k * 0.011, 0);
                        loop.rotation.y = Math.PI / 2;
                        tie.add(loop);
                    }
                    for (const tOff of [-0.008, 0.008]) {
                        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.002, 0.085, 6), suit2);
                        tail.position.set(s * 0.014, -0.045, tOff);
                        const aglet = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 6), metalM);
                        aglet.position.set(s * 0.014, -0.090, tOff);
                        tie.add(tail, aglet);
                    }
                    hips.add(tie);
                    P.sway.push({ obj: tie, kind: 'ribbon', mirror: s });
                }
            }
        }

        // Independent Left & Right Glute Soft-Tissue Spring Physics Rigs
        const gluteRigs = [];
        for (const s of [-1, 1]) {
            const gRig = new THREE.Group();
            gRig.position.set(s * 0.066 * d.hip, -0.028, -0.056 * d.hip);
            const gm = new THREE.Mesh(G.gluteSoft, bottomMat);
            gm.scale.setScalar(d.hip);
            gRig.add(gm);
            hips.add(gRig);
            gluteRigs.push({ obj: gRig, base: gRig.position.clone(), sp: AN.makeSpring(135, 13, 0.020), side: s });
        }
        P.springs.glutes = gluteRigs;

        // --- SCULPTED ANATOMICAL LEGS & DESIGNER SANDALS ---
        for (const s of [-1, 1]) {
            const thigh = new THREE.Group();
            thigh.position.set(s * 0.086 * d.hip, -0.025, 0);
            const tm = new THREE.Mesh(G.thigh, skinM);
            thigh.add(tm);

            const knee = new THREE.Group();
            knee.position.y = -0.42;
            const kneecap = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), skinM);
            knee.add(kneecap, new THREE.Mesh(G.calf, skinM));

            // Anklets / layered gold chains on ankles
            if (d.jewelry === 'anklet' || d.jewelry === 'bangle') {
                for (let k = 0; k < 2; k++) {
                    const ank = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.0038, 6, 18), metalM);
                    ank.rotation.x = Math.PI / 2 + (k ? 0.15 : -0.1);
                    ank.position.y = -0.35 - k * 0.012;
                    knee.add(ank);
                }
            }

            const ankle = new THREE.Group();
            ankle.position.y = -0.402;
            ankle.add(buildFootSandal(G, skinM, soleM, suit1, metalM, nailM));
            knee.add(ankle);

            thigh.add(knee);
            hips.add(thigh);
            P[s < 0 ? 'thighL' : 'thighR'] = thigh;
            P[s < 0 ? 'kneeL' : 'kneeR'] = knee;
            P[s < 0 ? 'ankleL' : 'ankleR'] = ankle;
        }

        // --- SCULPTED TORSO (S-curve spine, clavicles, hourglass waist, obliques) ---
        const chest = new THREE.Group();
        chest.position.y = 0.03;
        hips.add(chest);
        P.chest = chest;

        const isFullSuit = d.suit === 'onepiece';
        const torsoMesh = new THREE.Mesh(G.torso, isFullSuit ? suit1 : skinM);
        chest.add(torsoMesh);

        // Swimwear torso structure & couture hardware
        if (d.suit === 'onepiece') {
            // Designer monokini gold chain belt + neckline trim + back strap detail
            const belt = new THREE.Mesh(new THREE.TorusGeometry(0.101, 0.009, 8, 28), metalM);
            belt.rotation.x = Math.PI / 2;
            belt.scale.set(1.02, 0.80, 1);
            belt.position.y = 0.165;
            const clasp = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 6, 16), metalM);
            clasp.position.set(0, 0.165, 0.095);
            const neckTrim = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.008, 6, 24), suit2);
            neckTrim.rotation.x = Math.PI / 2;
            neckTrim.scale.set(1.06, 0.82, 1);
            neckTrim.position.y = 0.39;
            chest.add(belt, clasp, neckTrim);
        } else if (d.suit === 'sport') {
            // Contoured athletic crop-top + contrast elastic underband + sporty front zipper accent
            const crop = new THREE.Mesh(new THREE.CylinderGeometry(0.136, 0.114, 0.155, 26), suit1);
            crop.scale.set(1.02, 1, 0.80);
            crop.position.y = 0.328;
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.116, 0.013, 8, 28), suit2);
            band.rotation.x = Math.PI / 2;
            band.scale.set(1.02, 0.80, 1);
            band.position.y = 0.252;
            const zip = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.12, 0.012), metalM);
            zip.position.set(0, 0.33, 0.106);
            chest.add(crop, band, zip);
        } else {
            // Bikini back strap + center sternum gold O-ring + delicate gold belly chain
            const strap = new THREE.Mesh(new THREE.TorusGeometry(0.126, 0.008, 6, 28), suit1);
            strap.rotation.x = Math.PI / 2;
            strap.scale.set(1.02, 0.80, 1);
            strap.position.y = 0.282;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.004, 6, 16), metalM);
            ring.position.set(0, 0.292, 0.116);
            const bellyChain = new THREE.Mesh(new THREE.TorusGeometry(0.104, 0.003, 6, 28), metalM);
            bellyChain.rotation.x = Math.PI / 2 + 0.12;
            bellyChain.scale.set(1.02, 0.82, 1);
            bellyChain.position.y = 0.135;
            chest.add(strap, ring, bellyChain);
        }

        // Halter neck straps + knotted back neck ties with gold aglets
        for (const s of [-1, 1]) {
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.175, 8), suit1);
            st.position.set(s * 0.068, 0.405, 0.056);
            st.rotation.set(-0.46, 0, s * 0.28);
            chest.add(st);
            // Flowing neck-tie ribbon hanging down upper back
            const backTie = new THREE.Group();
            backTie.position.set(s * 0.018, 0.465, -0.048);
            const str = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0022, 0.12, 6), suit1);
            str.position.y = -0.06;
            const ag = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 6), metalM);
            ag.position.y = -0.122;
            backTie.add(str, ag);
            chest.add(backTie);
            P.sway.push({ obj: backTie, kind: 'ribbon', mirror: s });
        }

        // --- TRUE ASYMMETRIC TEARDROP BUST + TAILORED SWIMSUIT CUPS + SOFT-ENGINE PHYSICS ---
        const bustRigs = [];
        for (const s of [-1, 1]) {
            const bRig = new THREE.Group();
            bRig.position.set(s * 0.066, 0.308, 0.072);
            const bSc = d.bust || 1.05;

            // Sculpted skin bust base (visible at upper cleavage slope)
            const skinBust = new THREE.Mesh(G.bustSkin, skinM);
            skinBust.scale.set(bSc, bSc, bSc);
            skinBust.rotation.set(0.08, s * 0.18, 0);
            bRig.add(skinBust);

            // Tailored swimsuit cup hugging the lower/outer teardrop contour with contrast lace/piping rim
            const cup = new THREE.Mesh(G.bustCup, suit1);
            cup.scale.set(bSc * 0.99, bSc * 0.96, bSc * 0.99);
            cup.position.set(0, -0.005 * bSc, 0.003);
            cup.rotation.set(0.12, s * 0.18, 0);
            bRig.add(cup);

            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.056 * bSc, 0.006, 6, 20, Math.PI * 1.15), suit2);
            rim.position.set(0, 0.018 * bSc, 0.028 * bSc);
            rim.rotation.set(-0.35, s * 0.18, Math.PI * 0.92);
            bRig.add(rim);

            chest.add(bRig);
            // Independent Soft-Engine 3-axis spring-damper state (natural weight, jiggle & bounce!)
            bustRigs.push({
                obj: bRig,
                base: bRig.position.clone(),
                sp: AN.makeSpring(105, 9.2, 0.028 * bSc),
                side: s,
                scale: bSc
            });
        }
        P.springs.bust = bustRigs;

        // Off-shoulder ruffled flounce / pleated micro-skirt / sheer multi-panel chiffon sarong
        if (d.suit === 'frill') {
            for (let k = 0; k < 2; k++) {
                const rf = new THREE.Mesh(new THREE.TorusGeometry(0.148 + k * 0.013, 0.017, 8, 32), k === 0 ? suit2 : suit1);
                rf.rotation.x = Math.PI / 2;
                rf.scale.set(1.08, 0.85, 1);
                rf.position.y = 0.365 - k * 0.022;
                chest.add(rf);
            }
            const skirtG = new THREE.Group();
            skirtG.position.y = 0.022;
            const skGeo = new THREE.CylinderGeometry(0.150 * d.hip, 0.265 * d.hip, 0.20, 32, 3, true);
            const spPos = skGeo.attributes.position;
            for (let i = 0; i < spPos.count; i++) {
                const x = spPos.getX(i), y = spPos.getY(i), z = spPos.getZ(i);
                const ang = Math.atan2(z, x);
                const hem = AN.clamp((0.10 - y) / 0.20, 0, 1);
                const pleat = 1 + Math.sin(ang * 16) * 0.085 * hem;
                spPos.setX(i, x * pleat);
                spPos.setZ(i, z * pleat * 0.88);
            }
            skGeo.computeVertexNormals();
            const skirtM = new THREE.MeshPhysicalMaterial({
                color: 0xffffff, map: AN.fabricAlbedoTex(d.pattern, d.c1, d.c2),
                roughness: 0.44, side: THREE.DoubleSide, emissive: 0x000000
            });
            mats.push(skirtM);
            const skirt = new THREE.Mesh(skGeo, skirtM);
            skirt.position.y = -0.095;
            skirtG.add(skirt);
            hips.add(skirtG);
            P.sway.push({ obj: skirtG, kind: 'skirt' });
        } else if (d.suit === 'sarong') {
            const sarG = new THREE.Group();
            sarG.position.y = 0.026;
            const sarGeo = new THREE.CylinderGeometry(0.158 * d.hip, 0.275 * d.hip, 0.45, 32, 4, true, -0.32, Math.PI * 1.62);
            const sarPos = sarGeo.attributes.position;
            for (let i = 0; i < sarPos.count; i++) {
                const x = sarPos.getX(i), y = sarPos.getY(i), z = sarPos.getZ(i);
                const ang = Math.atan2(z, x);
                const hem = AN.clamp((0.225 - y) / 0.45, 0, 1);
                const wave = 1 + Math.sin(ang * 8) * 0.07 * hem;
                sarPos.setX(i, x * wave);
                sarPos.setZ(i, z * wave * 0.86);
            }
            sarGeo.computeVertexNormals();
            const sarM = new THREE.MeshPhysicalMaterial({
                color: 0xffffff, map: AN.fabricAlbedoTex(d.pattern, d.c2, d.c1),
                roughness: 0.36, side: THREE.DoubleSide, transparent: true, opacity: 0.82, sheen: 0.4, emissive: 0x000000
            });
            mats.push(sarM);
            const sar = new THREE.Mesh(sarGeo, sarM);
            sar.position.y = -0.215;
            sarG.add(sar);
            hips.add(sarG);
            P.sway.push({ obj: sarG, kind: 'sarong' });
        }

        // --- SCULPTED ARMS, WRIST JEWELRY & PAINTED-NAIL HANDS ---
        for (const s of [-1, 1]) {
            const sh = new THREE.Group();
            sh.position.set(s * 0.156, 0.422, -0.006);
            sh.add(new THREE.Mesh(new THREE.SphereGeometry(0.044, 14, 10), skinM), new THREE.Mesh(G.upperArm, skinM));

            const el = new THREE.Group();
            el.position.y = -0.262;
            el.add(new THREE.Mesh(new THREE.SphereGeometry(0.033, 10, 8), skinM), new THREE.Mesh(G.forearm, skinM));

            const wrist = new THREE.Group();
            wrist.position.y = -0.238;
            wrist.add(buildHand(G, skinM, nailM, s));
            el.add(wrist);

            if (d.acc === 'scrunchie' && s < 0) {
                const sc = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.013, 8, 18), accM);
                sc.rotation.x = Math.PI / 2; sc.position.y = -0.205; el.add(sc);
            } else if (d.jewelry === 'bangle' && s > 0) {
                for (let b = 0; b < 3; b++) {
                    const bg = new THREE.Mesh(new THREE.TorusGeometry(0.030, 0.0032, 6, 16), metalM);
                    bg.rotation.x = Math.PI / 2; bg.position.y = -0.188 - b * 0.011; el.add(bg);
                }
            } else if (d.jewelry === 'band' && s < 0) {
                const wb = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.029, 0.044, 14), suit2);
                wb.position.y = -0.20; el.add(wb);
            }

            sh.add(el);
            chest.add(sh);
            P[s < 0 ? 'shL' : 'shR'] = sh;
            P[s < 0 ? 'elL' : 'elR'] = el;
        }

        // --- SCULPTED NECK, CHOKER/PEARLS & 3D SCULPTED ANIME HEAD ---
        const neck = new THREE.Mesh(G.neck, skinM);
        neck.position.y = 0.468;
        chest.add(neck);

        if (d.jewelry === 'pearl' || d.jewelry === 'choker') {
            const ch = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.005, 6, 22), d.jewelry === 'pearl' ? suit2 : accM);
            ch.rotation.x = Math.PI / 2; ch.position.y = 0.506;
            const pend = new THREE.Mesh(new THREE.OctahedronGeometry(0.010, 0), metalM);
            pend.position.set(0, 0.492, 0.047);
            chest.add(ch, pend);
        }

        const head = new THREE.Group();
        head.position.y = 0.562;
        chest.add(head);
        P.head = head;

        // True 3D sculpted anime head (nose bridge/tip, 3D lips, cheekbones, V-jawline, eye sockets)
        const skull = new THREE.Mesh(G.head, skinM);
        head.add(skull);

        // Sculpted ears + dangling pearl / gold hoop earrings
        for (const s of [-1, 1]) {
            const ear = new THREE.Mesh(G.ear, skinM);
            ear.position.set(s * 0.132, 0.118, -0.006);
            head.add(ear);
            if (d.jewelry === 'hoop' || d.jewelry === 'pearl') {
                const er = d.jewelry === 'hoop'
                    ? new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.0028, 6, 16), metalM)
                    : new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), suit2);
                er.position.set(s * 0.138, 0.086, -0.002);
                er.rotation.y = Math.PI / 2;
                head.add(er);
            }
        }

        // High-res 512x512 jewel-iris anime face overlay fitted cleanly over sculpted 3D face
        const faceTexOpen = AN.faceOverlayTex(d.eyes, d.hair, d.blush, 'open');
        const faceTexBlink = AN.faceOverlayTex(d.eyes, d.hair, d.blush, 'blink');
        const faceTexHappy = AN.faceOverlayTex(d.eyes, d.hair, d.blush, 'happy');
        const faceMat = new THREE.MeshBasicMaterial({ map: faceTexOpen, transparent: true, depthWrite: false });
        const face = new THREE.Mesh(new THREE.SphereGeometry(0.1365, 28, 20, Math.PI / 2 - 0.72, 1.44, Math.PI / 2 - 0.46, 0.96), faceMat);
        face.scale.set(0.98, 1.03, 0.98);
        face.position.set(0, 0.134, 0.006);
        face.userData.noHit = true;
        head.add(face);
        P.faceMat = faceMat;
        P.faces = { open: faceTexOpen, blink: faceTexBlink, happy: faceTexHappy };

        // --- VOLUMETRIC SALON-SCULPTED ANIME HAIR & 5-BONE SPRING CHAINS ---
        const hairCap = new THREE.Mesh(
            new THREE.SphereGeometry(d.style === 'bob' ? 0.158 : 0.151, 28, 18, 0, TAU, 0, Math.PI * (d.style === 'bob' ? 0.72 : 0.58)),
            hairM
        );
        hairCap.position.set(0, 0.160, -0.012);
        hairCap.rotation.x = -0.34;
        hairCap.scale.set(1.04, 1.04, 1.02);
        head.add(hairCap);

        // 11 layered sweeping curved bangs (overlapping volumetric ribbons across forehead & temples)
        for (let i = 0; i < 11; i++) {
            const u = (i - 5) / 5;
            const isSide = Math.abs(u) > 0.65;
            const bang = new THREE.Mesh(isSide ? G.bangSide : G.bangMain, hairM);
            bang.position.set(u * 0.112, 0.268 - Math.abs(u) * 0.018, 0.112 - Math.abs(u) * 0.032);
            bang.rotation.set(-0.08, u * 0.42, u * 0.18);
            bang.scale.set(0.75 + (1 - Math.abs(u)) * 0.35, 0.82 + (i % 3) * 0.12, 1.0);
            head.add(bang);
        }

        // Layered face-framing sidelocks with gentle spring sway
        for (const s of [-1, 1]) {
            for (let k = 0; k < 2; k++) {
                const lockPiv = new THREE.Group();
                lockPiv.position.set(s * (0.126 + k * 0.008), 0.195 - k * 0.015, 0.052 - k * 0.032);
                const lk = new THREE.Mesh(G.hairLock, hairM);
                lk.scale.set(0.78 - k * 0.12, d.style === 'bob' ? 1.0 : 1.28, 0.72);
                lockPiv.add(lk);
                head.add(lockPiv);
                P.sway.push({ obj: lockPiv, kind: 'sidelock', mirror: s });
            }
        }

        // Multi-segment 5-bone cascaded spring-damper hair chain builder
        const hangChain = (x, y, z, scaleXZ, segs, kind, mirror) => {
            const pivot = new THREE.Group();
            pivot.position.set(x, y, z);
            let parent = pivot;
            for (let i = 0; i < segs; i++) {
                const seg = new THREE.Group();
                const isLast = i === segs - 1;
                const m = new THREE.Mesh(isLast ? G.hairTip : G.hairSeg, hairM);
                const tap = 1 - i * 0.10;
                m.scale.set(scaleXZ * tap, 1.0, scaleXZ * tap * 0.85);
                seg.add(m);
                parent.add(seg);
                if (i > 0) seg.position.y = -0.122;
                P.sway.push({ obj: seg, kind, i, mirror, sp: AN.makeSpring(78 - i * 9, 7.2, 0.62) });
                parent = seg;
            }
            head.add(pivot);
            return pivot;
        };

        if (d.style === 'twintails') {
            for (const s of [-1, 1]) {
                hangChain(s * 0.135, 0.215, -0.052, 1.18, 5, 'tail', s);
                const tie = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.011, 8, 16), accM);
                tie.position.set(s * 0.135, 0.215, -0.052);
                tie.rotation.y = s * 0.7;
                head.add(tie);
            }
        } else if (d.style === 'ponytail') {
            hangChain(0, 0.245, -0.140, 1.35, 5, 'tail', 0);
            const tie = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.012, 8, 16), accM);
            tie.position.set(0, 0.245, -0.140);
            tie.rotation.x = 0.5;
            head.add(tie);
        } else if (d.style === 'long') {
            for (const ox of [-0.092, -0.046, 0, 0.046, 0.092]) {
                hangChain(ox, 0.178, -0.118 + Math.abs(ox) * 0.25, 0.92, 5, 'long', Math.sign(ox));
            }
        } else if (d.style === 'bun') {
            const bun = new THREE.Mesh(new THREE.SphereGeometry(0.084, 18, 14), hairM);
            bun.position.set(0, 0.305, -0.068);
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.013, 8, 18), accM);
            band.rotation.x = Math.PI / 2 - 0.35;
            band.position.set(0, 0.265, -0.055);
            head.add(bun, band);
            hangChain(0, 0.23, -0.130, 0.74, 3, 'tail', 0);
        } else if (d.style === 'braid') {
            const pivot = new THREE.Group();
            pivot.position.set(0.112, 0.085, 0.022);
            let parent = pivot;
            for (let i = 0; i < 6; i++) {
                const seg = new THREE.Group();
                const bead = new THREE.Mesh(new THREE.SphereGeometry(0.034 * (1 - i * 0.07), 12, 10), hairM);
                bead.scale.set(1.1, 1.35, 0.85);
                bead.position.y = -0.032;
                seg.add(bead);
                if (i === 5) {
                    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.007, 6, 12), accM);
                    tie.rotation.x = Math.PI / 2; tie.position.y = -0.06;
                    const tuft = new THREE.Mesh(G.hairTip, hairM);
                    tuft.scale.set(0.65, 0.65, 0.65); tuft.position.y = -0.065;
                    seg.add(tie, tuft);
                }
                parent.add(seg);
                if (i > 0) seg.position.y = -0.064;
                P.sway.push({ obj: seg, kind: 'braid', i, mirror: 1, sp: AN.makeSpring(85 - i * 8, 8, 0.45) });
                parent = seg;
            }
            head.add(pivot);
        }

        // --- BESPOKE HEAD ACCESSORIES ---
        if (d.acc === 'bow') {
            const bow = new THREE.Group();
            for (const s of [-1, 1]) {
                const wing = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.105, 8), accM);
                wing.rotation.z = s * Math.PI / 2; wing.scale.set(0.75, 1, 0.42); wing.position.x = s * 0.05;
                bow.add(wing);
            }
            bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), accM));
            bow.position.set(0.105, 0.275, 0.018); bow.rotation.z = -0.38;
            head.add(bow);
        } else if (d.acc === 'flower') {
            const fl = new THREE.Group();
            for (let i = 0; i < 5; i++) {
                const a = i / 5 * TAU;
                const pet = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), accM);
                pet.scale.set(1.22, 0.72, 0.35);
                pet.position.set(Math.cos(a) * 0.032, Math.sin(a) * 0.032, 0);
                pet.rotation.z = a;
                fl.add(pet);
            }
            const center = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), metalM);
            fl.add(center);
            fl.position.set(0.140, 0.195, 0.045); fl.rotation.y = 1.15;
            head.add(fl);
        } else if (d.acc === 'visor') {
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.154, 0.013, 8, 28), accM);
            band.rotation.x = Math.PI / 2 - 0.24; band.position.y = 0.215;
            const brim = new THREE.Mesh(
                new THREE.CylinderGeometry(0.125, 0.125, 0.008, 20, 1, false, -0.88, 1.76),
                new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.12, transparent: true, opacity: 0.72, clearcoat: 0.9 })
            );
            brim.position.set(0, 0.23, 0.135); brim.rotation.x = 0.16;
            head.add(band, brim);
        } else if (d.acc === 'shades') {
            const sg = new THREE.Group();
            sg.position.set(0, 0.295, 0.068); sg.rotation.x = -0.58;
            const lensM = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.08, metalness: 0.75, clearcoat: 1.0 });
            for (const s of [-1, 1]) {
                const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.01, 14), lensM);
                lens.rotation.x = Math.PI / 2; lens.scale.set(1.2, 1, 0.85); lens.position.x = s * 0.048;
                const frame = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.004, 6, 16), metalM);
                frame.scale.set(1.2, 0.85, 1); frame.position.x = s * 0.048;
                sg.add(lens, frame);
            }
            sg.add(new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.006, 0.006), metalM));
            head.add(sg);
        } else if (d.acc === 'hat') {
            const hatG = new THREE.Group();
            hatG.position.y = 0.278;
            const brimGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.012, 28, 1);
            const bp = brimGeo.attributes.position;
            for (let i = 0; i < bp.count; i++) {
                const x = bp.getX(i), z = bp.getZ(i), r = Math.hypot(x, z);
                if (r > 0.16) bp.setY(i, bp.getY(i) - Math.sin(Math.atan2(z, x) * 3) * 0.018 * (r / 0.34));
            }
            brimGeo.computeVertexNormals();
            const brim = new THREE.Mesh(brimGeo, accM);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.158, 0.105, 22), accM);
            crown.position.y = 0.052;
            const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.160, 0.160, 0.030, 22), suit1);
            ribbon.position.y = 0.018;
            hatG.add(brim, crown, ribbon);
            for (const s of [-1, 1]) {
                const rt = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.24, 0.004), suit1);
                rt.position.set(s * 0.03, -0.10, -0.17); rt.rotation.x = 0.35;
                hatG.add(rt);
                P.sway.push({ obj: rt, kind: 'ribbon', mirror: s });
            }
            head.add(hatG);
            P.sway.push({ obj: brim, kind: 'brim' });
        }

        // Silhouette-only shadow casting for 90+ FPS even during dense waves
        const hit = [];
        for (const sm of [pelvis, torsoMesh, skull, hairCap]) sm.userData.castSil = true;
        root.traverse((m) => {
            if (m.isMesh && !m.userData.noHit) {
                if (m.userData.castSil || m.geometry === G.thigh || m.geometry === G.calf) m.castShadow = true;
                m.userData.hitbox = 'torso';
                hit.push(m);
            }
        });

        return {
            root, body, parts: P, hit, mats, def: d,
            prevY: 0.895, prevVy: 0, prevX: 0, prevVx: 0,
            blinkT: 1.4 + Math.random() * 2.5, blinking: false,
            breathT: Math.random() * TAU, lastStepSign: 1
        };
    }

    // ------------------------------------------------------------------------
    // Coupled Soft-Engine Physics (3-axis spring + volume-preserving squash/stretch)
    // ------------------------------------------------------------------------
    function stepSoftPhysics(g, dt, speed, amt, ph, extraImpulseY = 0) {
        const AN = BO.BeachAnatomy;
        const P = g.parts;
        const d = Math.min(Math.max(dt, 0.001), 0.035);

        const curY = g.root.position.y + P.hips.position.y;
        const curX = g.root.position.x;
        const vy = (curY - g.prevY) / d;
        const vx = (curX - g.prevX) / d;
        const ay = AN.clamp((vy - g.prevVy) / d, -48, 48) + extraImpulseY;
        const ax = AN.clamp((vx - g.prevVx) / d, -28, 28);
        g.prevY = curY; g.prevVy = vy;
        g.prevX = curX; g.prevVx = vx;

        const twistAcc = Math.cos(ph) * 7.2 * amt;

        // Coupled Left & Right Bust Soft-Tissue Solver + volume-preserving squash-and-stretch
        for (const br of P.springs.bust) {
            const sideTwist = twistAcc * br.side * 0.50;
            AN.stepSpring(br.sp, -ax * 0.07 + sideTwist * 0.09, -ay * 0.11, -Math.abs(ay) * 0.028 + sideTwist * 0.06, d);
            br.obj.position.set(br.base.x + br.sp.x, br.base.y + br.sp.y, br.base.z + br.sp.z);
            br.obj.rotation.x = -br.sp.y * 14;
            br.obj.rotation.z = br.sp.x * 10;
            // Subtle volume-preserving squash & stretch on peak bounce
            const stretchY = 1 + AN.clamp(br.sp.y * 4.5, -0.09, 0.09);
            const squashXZ = 1 / Math.sqrt(stretchY);
            br.obj.scale.set(squashXZ, stretchY, squashXZ);
        }

        // Glute / hip soft-tissue follow-through + subtle footstrike squash
        for (const gr of P.springs.glutes) {
            AN.stepSpring(gr.sp, -ax * 0.045, -ay * 0.075, -Math.abs(ay) * 0.022, d);
            gr.obj.position.set(gr.base.x + gr.sp.x, gr.base.y + gr.sp.y, gr.base.z + gr.sp.z);
            const sy = 1 + AN.clamp(gr.sp.y * 3.5, -0.06, 0.06);
            gr.obj.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
        }

        // Cascaded 5-bone hair chains, ribbons, skirts & sheer sarongs
        for (const sw of P.sway) {
            const o = sw.obj;
            if (sw.kind === 'tail' || sw.kind === 'braid' || sw.kind === 'long') {
                const lag = (sw.i || 0) * 0.52;
                const drag = (sw.i === 0 ? 0.24 + speed * 0.055 : 0.11) * amt;
                if (sw.sp) {
                    const targetX = drag + Math.sin(ph * 2 - 0.6 - lag) * 0.16 * amt - ay * 0.013;
                    const targetZ = Math.sin(ph - 0.4 - lag) * 0.19 * (sw.mirror || 1) * amt - ax * 0.016;
                    AN.stepSpring(sw.sp, (targetX - sw.sp.x) * 42, 0, (targetZ - sw.sp.z) * 42, d);
                    o.rotation.x = AN.clamp(sw.sp.x, -0.35, 1.15);
                    o.rotation.z = AN.clamp(sw.sp.z, -0.68, 0.68);
                }
            } else if (sw.kind === 'sidelock') {
                o.rotation.x = 0.08 * amt + Math.sin(ph * 2 - 0.4) * 0.075 * amt;
                o.rotation.z = sw.mirror * (0.06 + Math.abs(Math.sin(ph)) * 0.085 * amt);
            } else if (sw.kind === 'skirt' || sw.kind === 'sarong') {
                o.rotation.x = (0.09 + speed * 0.02) * amt + Math.sin(ph * 2 - 0.3) * 0.095 * amt;
                o.rotation.z = Math.sin(ph - 0.2) * 0.075 * amt;
                const flare = 1 + (0.045 + Math.sin(ph * 2) * 0.045) * amt;
                o.scale.set(flare, 1, flare);
            } else if (sw.kind === 'ribbon') {
                o.rotation.x = 0.35 + speed * 0.065 * amt + Math.sin(ph * 2.2) * 0.20 * amt;
                o.rotation.z = Math.sin(ph + (sw.mirror || 1)) * 0.15 * amt;
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

        P.thighL.rotation.x = s * 0.78 * amt;
        P.thighR.rotation.x = -s * 0.78 * amt;
        P.kneeL.rotation.x = (0.22 + Math.max(0, -Math.sin(ph - 0.55)) * 1.18) * amt;
        P.kneeR.rotation.x = (0.22 + Math.max(0, Math.sin(ph - 0.55)) * 1.18) * amt;
        P.ankleL.rotation.x = Math.sin(ph - 0.8) * 0.32 * amt;
        P.ankleR.rotation.x = -Math.sin(ph - 0.8) * 0.32 * amt;

        P.shL.rotation.set(-s * 0.68 * amt, 0, -0.20);
        P.shR.rotation.set(s * 0.68 * amt, 0, 0.20);
        P.elL.rotation.set(-1.28 * amt, 0, 0);
        P.elR.rotation.set(-1.28 * amt, 0, 0);

        P.hips.position.y = 0.895 + Math.abs(c) * 0.06 * amt;
        P.hips.rotation.set(0, s * 0.12 * amt, -s * 0.07 * amt);
        P.chest.rotation.set(0.11 * amt + breath, -s * 0.20 * amt, s * 0.055 * amt);
        P.head.rotation.set(-0.08 * amt, s * 0.09 * amt, -s * 0.03 * amt);

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
            for (const m of g.mats) m.emissiveIntensity = 0.42 * glow + Math.max(0, Math.sin(t * 14)) * 0.1 * glow;
            if (t < 1.7) {
                const hop = t < 0.55 ? Math.sin(t / 0.55 * Math.PI) * 0.38 : Math.abs(Math.sin(t * 9)) * 0.04;
                r.position.y = y0 + hop;
                P.thighL.rotation.x = AN.lerp(P.thighL.rotation.x, t < 0.55 ? -0.35 : 0, 0.2);
                P.thighR.rotation.x = AN.lerp(P.thighR.rotation.x, t < 0.55 ? 0.18 : 0, 0.2);
                P.kneeL.rotation.x = AN.lerp(P.kneeL.rotation.x, t < 0.55 ? 1.05 : 0.05, 0.2);
                P.kneeR.rotation.x = AN.lerp(P.kneeR.rotation.x, 0.05, 0.2);
                P.shL.rotation.set(-2.15, 0, 0.52);
                P.shR.rotation.set(-2.15, 0, -0.52);
                P.elL.rotation.set(-1.5, 0, 0);
                P.elR.rotation.set(-1.5, 0, 0);
                P.chest.rotation.set(-0.05, Math.sin(t * 22) * 0.08, Math.sin(t * 15) * 0.06);
                P.head.rotation.set(0.05, 0, 0.22 + Math.sin(t * 11) * 0.07);
                P.hips.position.y = 0.895;
                stepSoftPhysics(g, dt, 0.6, 0.75, t * 10, t < 0.12 ? 22 : 0);
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
