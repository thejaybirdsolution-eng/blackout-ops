/* ============================================================================
   BLACKOUT OPS — Sweetheart Shore 2026 AAA Skinned Character Roster & Physics
   10 bespoke Couture Beach Characters bound to BO.BeachAnatomy's 25-bone
   THREE.Skeleton + unified THREE.SkinnedMesh body & swimsuit manifold:
   - 10 distinct anime beach archetypes with unique body morphs, couture swimwear,
     bespoke jewelry, 3D props (drinks, floaties, blasters, totes, rescue cans),
     and distinct feminine running & jog kinematics
   - Real-time GPU-skinned Soft-Engine jiggle bones (breastL/R, gluteL/R,
     bellySoft, thighSoftL/R) with coupled 3-axis spring-damper physics
   - Joyful heart-burst tag reactions, orbiting star sparkles, and cheerful voice popups
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const L = BO.MinigameLib;
    const { SFX, TAU, HIDDEN_MAT } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    // 10 deeply distinct character designs — unique body morphs, Couture swimwear, jewelry, props & hair
    const GIRLS = [
        {
            name: 'Mina', title: 'Sweetheart Idol',
            skin: 0xf8d0be, blush: '#fb7185', hair: 0xf43f5e, hairHi: '#ffe4e6', style: 'twintails',
            eyes: '#ec4899', suit: 'frill', pattern: 'gingham', c1: 0xf43f5e, c2: 0xfff1f2, metal: 0xfacc15,
            acc: 'bow', accC: 0x9d174d, jewelry: 'pearl', garter: true, nail: 0xf43f5e,
            prop: 'drink', propCol: 0xf43f5e,
            animStyle: 'cute_bounce', voiceLine: 'KYAA! ♥',
            morph: { bust: 1.15, hip: 1.09, waist: 0.93, thigh: 1.06 }, height: 1.00
        },
        {
            name: 'Rin', title: 'Volleyball Ace',
            skin: 0xebb58c, blush: '#f97316', hair: 0x0b132b, hairHi: '#38bdf8', style: 'ponytail',
            eyes: '#0284c7', suit: 'sport', pattern: 'mesh', c1: 0x0284c7, c2: 0xf8fafc, metal: 0xe2e8f0,
            acc: 'visor', accC: 0xf8fafc, jewelry: 'band', kneeBand: true, nail: 0x0ea5e9,
            prop: 'volleyball', propCol: 0x0284c7,
            animStyle: 'sporty_dash', voiceLine: 'NICE SHOT! ♥',
            morph: { bust: 1.04, hip: 1.03, waist: 0.95, thigh: 1.04 }, height: 1.04
        },
        {
            name: 'Hana', title: 'Tropical Goddess',
            skin: 0xdf9d6b, blush: '#ea580c', hair: 0x5c1d06, hairHi: '#fb923c', style: 'long',
            eyes: '#10b981', suit: 'triangle', sarong: true, pattern: 'hibiscus', c1: 0xea580c, c2: 0xfde047, metal: 0xfacc15,
            acc: 'flower', accC: 0xdc2626, jewelry: 'anklet', bellyChain: true, nail: 0xf97316,
            prop: 'coconut', propCol: 0x78350f,
            animStyle: 'graceful_glide', voiceLine: 'ALOHA! ♥',
            morph: { bust: 1.25, hip: 1.15, waist: 0.90, thigh: 1.10 }, height: 1.02
        },
        {
            name: 'Yuki', title: 'Riviera Heiress',
            skin: 0xf7dfd0, blush: '#f472b6', hair: 0x93c5fd, hairHi: '#ffffff', style: 'bob',
            eyes: '#1d4ed8', suit: 'monokini', pareo: true, pattern: 'nautical', c1: 0x1e3a8a, c2: 0xffffff, metal: 0xf59e0b,
            acc: 'shades', accC: 0x0f172a, jewelry: 'pearl', nail: 0x2563eb,
            prop: 'tote', propCol: 0xd4a373,
            animStyle: 'runway_strut', voiceLine: 'MERCI! ♥',
            morph: { bust: 1.12, hip: 1.07, waist: 0.91, thigh: 1.03 }, height: 1.03
        },
        {
            name: 'Sora', title: 'Sunset Surfer',
            skin: 0xba753b, blush: '#f59e0b', hair: 0xfbbf24, hairHi: '#fef9c3', style: 'bun',
            eyes: '#d97706', suit: 'sport', pattern: 'stripe', c1: 0x10b981, c2: 0xbef264, metal: 0xfacc15,
            acc: 'scrunchie', accC: 0x10b981, jewelry: 'hoop', bellyChain: true, nail: 0x10b981,
            prop: 'blaster', propCol: 0x22c55e,
            animStyle: 'playful_skip', voiceLine: 'COWABUNGA! ♥',
            morph: { bust: 1.09, hip: 1.08, waist: 0.93, thigh: 1.05 }, height: 1.02
        },
        {
            name: 'Aiko', title: 'Vintage Seaside',
            skin: 0xf4c5a2, blush: '#fb7185', hair: 0x7f1d1d, hairHi: '#f87171', style: 'braid',
            eyes: '#dc2626', suit: 'frill', pattern: 'polka', c1: 0xf59e0b, c2: 0xfef08a, metal: 0xfde047,
            acc: 'hat', accC: 0xfde68a, jewelry: 'choker', nail: 0xf59e0b,
            prop: 'popsicle', propCol: 0xf43f5e,
            animStyle: 'gentle_frolic', voiceLine: 'YATTA! ♥',
            morph: { bust: 1.17, hip: 1.11, waist: 0.92, thigh: 1.07 }, height: 0.99
        },
        {
            name: 'Nami', title: 'Golden Hour Goddess',
            skin: 0x854d24, blush: '#e11d48', hair: 0x090d16, hairHi: '#818cf8', style: 'long',
            eyes: '#f59e0b', suit: 'monokini', pattern: 'ombre', c1: 0xbe185d, c2: 0x7c3aed, metal: 0xfacc15,
            acc: 'flower', accC: 0xfacc15, jewelry: 'bangle', garter: true, bellyChain: true, nail: 0xdb2777,
            prop: 'floatie', propCol: 0xec4899,
            animStyle: 'sultry_strut', voiceLine: 'DARLING! ♥',
            morph: { bust: 1.28, hip: 1.17, waist: 0.88, thigh: 1.12 }, height: 1.05
        },
        {
            name: 'Kiko', title: 'Mermaid Princess',
            skin: 0xebd0bd, blush: '#ec4899', hair: 0x7c3aed, hairHi: '#ddd6fe', style: 'drills',
            eyes: '#0d9488', suit: 'shell', sarong: true, pattern: 'shell', c1: 0x0d9488, c2: 0x99f6e4, metal: 0xf8fafc,
            acc: 'bow', accC: 0x5b21b6, jewelry: 'choker', nail: 0x14b8a6,
            prop: 'drink', propCol: 0x2dd4bf,
            animStyle: 'bouncy_drill', voiceLine: 'BFF! ♥',
            morph: { bust: 1.11, hip: 1.08, waist: 0.92, thigh: 1.05 }, height: 0.99
        },
        {
            name: 'Chika', title: 'Pastel Gamer Girl',
            skin: 0xf9ddd0, blush: '#f43f5e', hair: 0x2dd4bf, hairHi: '#a5f3fc', style: 'spacebuns',
            eyes: '#8b5cf6', suit: 'sport', pattern: 'gamer', c1: 0x8b5cf6, c2: 0x2dd4bf, metal: 0xfacc15,
            acc: 'headphones', accC: 0xec4899, jewelry: 'band', nail: 0xa855f7,
            prop: 'blaster', propCol: 0x8b5cf6,
            animStyle: 'cute_bounce', voiceLine: 'GG! ♥',
            morph: { bust: 1.06, hip: 1.05, waist: 0.94, thigh: 1.04 }, height: 0.98
        },
        {
            name: 'Rei', title: 'Lifeguard Captain',
            skin: 0xca8a52, blush: '#e11d48', hair: 0xe2e8f0, hairHi: '#ffffff', style: 'samurai',
            eyes: '#b91c1c', suit: 'lifeguard', pattern: 'lifeguard', c1: 0xdc2626, c2: 0xffffff, metal: 0xfacc15,
            acc: 'whistle', accC: 0xf8fafc, jewelry: 'bangle', nail: 0xdc2626,
            prop: 'buoy', propCol: 0xef4444,
            animStyle: 'sporty_dash', voiceLine: 'CLEAR! ♥',
            morph: { bust: 1.20, hip: 1.10, waist: 0.92, thigh: 1.08 }, height: 1.06
        }
    ];

    // ------------------------------------------------------------------------
    // Heart & Star Projectiles, Particles & Footstep Sand Puffs
    // ------------------------------------------------------------------------
    function heartTex() {
        return L.canvasTex('aaa26-heart-sprite-v3', 128, 128, (g, w, h) => {
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
            g.shadowColor = '#ff2e93'; g.shadowBlur = 18;
            const gr = g.createLinearGradient(0, 20, 0, 110);
            gr.addColorStop(0, '#ff99cb'); gr.addColorStop(0.45, '#ff3d9a'); gr.addColorStop(1, '#db2777');
            path(); g.fillStyle = gr; g.fill();
            g.shadowBlur = 0;
            g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 3.5;
            path(); g.stroke();
            g.fillStyle = 'rgba(255,255,255,0.92)';
            g.beginPath(); g.ellipse(44, 42, 12, 7.5, -0.55, 0, TAU); g.fill();
        });
    }

    function starTex() {
        return L.canvasTex('aaa26-star-sparkle-v3', 64, 64, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            const cx = 32, cy = 32;
            g.shadowColor = '#facc15'; g.shadowBlur = 12;
            g.fillStyle = '#ffffff';
            g.beginPath();
            g.moveTo(cx, cy - 28);
            g.quadraticCurveTo(cx, cy, cx + 28, cy);
            g.quadraticCurveTo(cx, cy, cx, cy + 28);
            g.quadraticCurveTo(cx, cy, cx - 28, cy);
            g.quadraticCurveTo(cx, cy, cx, cy - 28);
            g.fill();
            g.shadowBlur = 0;
            g.fillStyle = '#fef08a';
            g.beginPath(); g.arc(cx, cy, 6, 0, TAU); g.fill();
        });
    }

    let heartMat = null;
    function heartSprite(scale) {
        if (!heartMat) heartMat = new THREE.SpriteMaterial({ map: heartTex(), transparent: true, depthWrite: false });
        const s = new THREE.Sprite(heartMat);
        s.scale.setScalar(scale);
        return s;
    }

    let starMat = null;
    function starSprite(scale) {
        if (!starMat) starMat = new THREE.SpriteMaterial({ map: starTex(), transparent: true, depthWrite: false });
        const s = new THREE.Sprite(starMat);
        s.scale.setScalar(scale);
        return s;
    }

    function heartBurst(S, pos, n = 12) {
        for (let i = 0; i < n; i++) {
            const isStar = i % 3 === 0;
            const spr = isStar ? starSprite(0.18 + Math.random() * 0.14) : heartSprite(0.18 + Math.random() * 0.16);
            spr.position.copy(pos);
            S.add(spr);
            const v = V((Math.random() - 0.5) * 2.2, 1.4 + Math.random() * 1.8, (Math.random() - 0.5) * 2.2);
            let t = 0;
            S.animate((dt) => {
                t += dt;
                spr.position.addScaledVector(v, dt);
                v.y -= 0.42 * dt;
                v.multiplyScalar(1 - dt * 1.1);
                spr.scale.setScalar(Math.max(0.001, spr.scale.x * (t > 0.9 ? 0.91 : 1.0)));
                if (t > 1.5) { if (spr.parent) spr.parent.remove(spr); return false; }
            });
        }
    }

    let sandMat = null;
    function sandPuff(S, pos) {
        if (!sandMat) {
            const tex = L.canvasTex('aaa26-sand-puff-v3', 64, 64, (g, w, h) => {
                const rg = g.createRadialGradient(32, 32, 4, 32, 32, 30);
                rg.addColorStop(0, 'rgba(216, 178, 122, 0.75)');
                rg.addColorStop(0.6, 'rgba(234, 198, 148, 0.45)');
                rg.addColorStop(1, 'rgba(216, 178, 122, 0)');
                g.fillStyle = rg; g.fillRect(0, 0, w, h);
            });
            sandMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
        }
        const sp = new THREE.Sprite(sandMat);
        sp.position.set(pos.x + (Math.random() - 0.5) * 0.24, 0.08, pos.z - 0.12);
        sp.scale.setScalar(0.20 + Math.random() * 0.14);
        S.add(sp);
        const vy = 0.55 + Math.random() * 0.35, vz = -0.7 - Math.random() * 0.5;
        let t = 0;
        S.animate((dt) => {
            t += dt;
            sp.position.y += vy * dt * (1 - t * 1.4);
            sp.position.z += vz * dt;
            sp.scale.addScalar(dt * 0.48);
            if (t > 0.45) { if (sp.parent) sp.parent.remove(sp); return false; }
        });
    }

    // ------------------------------------------------------------------------
    // Sculpted Hands & Sandals
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
    // 3D Beach Props Construction (Drink, Floaties, Blaster, Buoy, Tote, etc.)
    // ------------------------------------------------------------------------
    function buildProp(g, d, mats, AN) {
        const P = g.parts;
        const G = AN.getStaticGeos();
        const { metalM, accM, glassM, suit1, suit2, env } = mats;

        if (d.prop === 'drink') {
            const cupG = new THREE.Group();
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.022, 0.075, 14), glassM);
            const juice = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.021, 0.062, 12), accM);
            juice.position.y = -0.005;
            const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.008, 14), suit2);
            lid.position.y = 0.038;
            const straw = new THREE.Mesh(G.straw, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2 }));
            straw.position.set(0.008, 0.065, 0); straw.rotation.z = -0.25;
            const slice = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.003, 10), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
            slice.position.set(0.028, 0.038, 0); slice.rotation.x = Math.PI / 2;
            const umb = new THREE.Mesh(G.umbrellaPaper, accM);
            umb.position.set(-0.014, 0.075, 0.008); umb.rotation.set(0.3, 0, 0.4);
            cupG.add(cup, juice, lid, straw, slice, umb);
            cupG.position.set(0.012, -0.062, 0.025);
            cupG.rotation.set(0.2, 0, 0);
            P.wrL.add(cupG);
        } else if (d.prop === 'coconut') {
            const cocoG = new THREE.Group();
            const nut = new THREE.Mesh(G.coconutCup, new THREE.MeshStandardMaterial({ color: 0x54300e, roughness: 0.85 }));
            nut.rotation.x = Math.PI; nut.position.y = 0.02;
            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.004, 6, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            rim.rotation.x = Math.PI / 2; rim.position.y = 0.02;
            const straw = new THREE.Mesh(G.straw, new THREE.MeshPhysicalMaterial({ color: 0xfacc15, roughness: 0.3 }));
            straw.position.set(0.014, 0.052, 0); straw.rotation.z = -0.32;
            const fl = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), accM);
            fl.position.set(-0.032, 0.035, 0.012);
            cocoG.add(nut, rim, straw, fl);
            cocoG.position.set(0.012, -0.055, 0.030);
            P.wrL.add(cocoG);
        } else if (d.prop === 'floatie') {
            const flG = new THREE.Group();
            flG.position.set(0, 0.02, 0);
            const ring = new THREE.Mesh(G.swimRing, new THREE.MeshPhysicalMaterial({
                color: d.propCol || d.c1, roughness: 0.12, clearcoat: 0.85, envMap: env
            }));
            ring.rotation.x = Math.PI / 2 + 0.12;
            // Flamingo neck & head
            const neckPts = [
                new THREE.Vector3(0, 0, 0.18),
                new THREE.Vector3(0, 0.12, 0.23),
                new THREE.Vector3(0, 0.22, 0.19),
                new THREE.Vector3(0, 0.20, 0.24)
            ];
            const neckGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(neckPts), 14, 0.016, 8, false);
            const neck = new THREE.Mesh(neckGeo, ring.material);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), ring.material);
            head.position.set(0, 0.21, 0.24);
            const beak = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 8), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
            beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.205, 0.265);
            flG.add(ring, neck, head, beak);
            P.hips.add(flG);
            P.sway.push({ obj: flG, kind: 'ribbon' });
        } else if (d.prop === 'volleyball') {
            const ballM = new THREE.MeshStandardMaterial({
                color: 0xf8fafc, roughness: 0.35, map: L.canvasTex('vb-tex', 128, 64, (g, w, h) => {
                    g.fillStyle = '#f8fafc'; g.fillRect(0, 0, w, h);
                    g.fillStyle = '#0284c7'; g.fillRect(0, 0, w * 0.35, h);
                    g.fillStyle = '#facc15'; g.fillRect(w * 0.35, 0, w * 0.30, h);
                    g.strokeStyle = '#334155'; g.lineWidth = 2;
                    for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
                })
            });
            const vb = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 14), ballM);
            vb.position.set(-0.062, -0.14, 0.032);
            P.elL.add(vb);
        } else if (d.prop === 'blaster') {
            const blG = new THREE.Group();
            const bodyM = new THREE.MeshPhysicalMaterial({ color: d.propCol || 0x22c55e, roughness: 0.2, clearcoat: 0.8, envMap: env });
            const mainBody = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.062, 0.14), bodyM);
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.09, 10), glassM);
            tank.rotation.x = Math.PI / 2; tank.position.set(0, 0.036, -0.015);
            const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.035, 8), metalM);
            nozzle.rotation.x = Math.PI / 2; nozzle.position.set(0, 0.005, 0.085);
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.065, 0.030), bodyM);
            handle.position.set(0, -0.045, -0.030); handle.rotation.x = -0.35;
            blG.add(mainBody, tank, nozzle, handle);
            blG.position.set(0.015, -0.075, 0.045);
            blG.rotation.set(-0.25, 0, 0);
            P.wrR.add(blG);
        } else if (d.prop === 'tote') {
            const toteG = new THREE.Group();
            const strawM = new THREE.MeshStandardMaterial({
                color: 0xd4a373, roughness: 0.85, map: L.canvasTex('straw-weave', 64, 64, (g, w, h) => {
                    g.fillStyle = '#d4a373'; g.fillRect(0, 0, w, h);
                    g.strokeStyle = '#b08968'; g.lineWidth = 2;
                    for (let x = 0; x < w; x += 8) for (let y = 0; y < h; y += 8) g.strokeRect(x, y, 7, 7);
                })
            });
            const bag = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.155, 0.185), strawM);
            bag.position.y = -0.16;
            const strap = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.006, 6, 16), metalM);
            strap.position.y = -0.06; strap.scale.set(0.3, 1.2, 1);
            const towel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.16, 10), suit1);
            towel.position.set(0, -0.08, 0); towel.rotation.z = Math.PI / 2;
            toteG.add(bag, strap, towel);
            toteG.position.set(0.018, -0.035, 0.015);
            P.wrL.add(toteG);
            P.sway.push({ obj: toteG, kind: 'ribbon' });
        } else if (d.prop === 'buoy') {
            const buoyG = new THREE.Group();
            const canM = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.25, clearcoat: 0.6 });
            const can = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.24, 12), canM);
            can.rotation.x = Math.PI / 2;
            const handle1 = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.006, 6, 12), metalM);
            handle1.position.z = -0.06;
            const strapC = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.005, 6, 22), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            strapC.rotation.y = Math.PI / 2; strapC.scale.set(0.65, 1.45, 1);
            buoyG.add(can, handle1, strapC);
            buoyG.position.set(-0.015, -0.065, 0.04);
            P.wrR.add(buoyG);
        } else if (d.prop === 'popsicle') {
            const popG = new THREE.Group();
            const iceM = new THREE.MeshPhysicalMaterial({ color: d.c1, roughness: 0.15, clearcoat: 0.9, transparent: true, opacity: 0.9 });
            const pop = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.072, 0.018), iceM);
            pop.position.y = 0.035;
            const stick = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.075, 0.005), new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.8 }));
            stick.position.y = -0.02;
            popG.add(pop, stick);
            popG.position.set(0.012, -0.055, 0.020);
            popG.rotation.x = 0.3;
            P.wrR.add(popG);
        }
    }

    // ------------------------------------------------------------------------
    // Main 2026 AAA Skinned Character Builder
    // ------------------------------------------------------------------------
    function buildGirl(d) {
        const AN = BO.BeachAnatomy;
        const B = AN.BONE;
        const G = AN.getStaticGeos();
        const mats = [];
        const matsPack = AN.createMaterials(d, mats);
        const { skinM, hairM, suit1, suit2, metalM, accM, nailM, corneaM, env } = matsPack;

        const root = new THREE.Group();
        const body = new THREE.Group();
        body.scale.setScalar(d.height || 1.02);
        root.add(body);

        // 1. Create Skeleton & Bind Unified Skinned Body + Swimsuit
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

        // Fast O(1) bone-parented hitboxes
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

        // 2. Soft-Engine Spring-Damper Rigs
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

        // 3. Hands, Feet Sandals, Jewelry
        P.wrL.add(buildHand(G, skinM, nailM, 1));
        P.wrR.add(buildHand(G, skinM, nailM, -1));
        P.ankleL.add(buildFootSandal(G, skinM, suit2, suit1, metalM, nailM));
        P.ankleR.add(buildFootSandal(G, skinM, suit2, suit1, metalM, nailM));

        // Thigh garter / knee-band
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
            const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.004, 6, 18), metalM);
            cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.11; P.shL.add(cuff);
        } else if (d.jewelry === 'band') {
            for (const el of [P.elL, P.elR]) {
                const wb = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.026, 0.042, 14), suit2);
                wb.position.y = -0.19; el.add(wb);
            }
        }

        // Halter Straps, Sternum Ring & Belly Chain
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

        if (d.suit !== 'sport' && d.suit !== 'lifeguard') {
            const cRing = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.004, 6, 16), metalM);
            cRing.position.set(0, 0.022, 0.105);
            P.chest.add(cRing);
        } else if (d.suit === 'sport') {
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

        // Hip side-tie ribbons
        for (const s of [-1, 1]) {
            const hRing = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.0035, 6, 14), metalM);
            hRing.position.set(s * 0.168 * hSc, 0.025, 0.012);
            hRing.rotation.y = Math.PI / 2;
            P.hips.add(hRing);
            if (d.suit !== 'sport' && d.suit !== 'monokini' && d.suit !== 'lifeguard') {
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

        // Frill Flounce / Skirts / Sarongs
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

        // Neck jewelry / Whistle
        if (d.jewelry === 'pearl' || d.jewelry === 'choker') {
            const ch = new THREE.Mesh(new THREE.TorusGeometry(0.040, 0.0048, 6, 22), d.jewelry === 'pearl' ? suit2 : accM);
            ch.rotation.x = Math.PI / 2; ch.position.y = 0.045;
            const pend = new THREE.Mesh(new THREE.OctahedronGeometry(0.010, 0), metalM);
            pend.position.set(0, 0.032, 0.044);
            P.neck.add(ch, pend);
        } else if (d.acc === 'whistle') {
            const cord = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.0028, 6, 20), metalM);
            cord.rotation.x = Math.PI / 2 - 0.25; cord.position.set(0, 0.035, 0.02);
            const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.026, 8), metalM);
            wh.position.set(0, 0.008, 0.065); wh.rotation.x = 0.4;
            P.neck.add(cord, wh);
        }

        // 4. Head, Cornea & Expressions
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
            // Real 3D Glossy Cornea Dome
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

        // Volumetric Hair
        const hairCap = new THREE.Mesh(
            new THREE.SphereGeometry(d.style === 'bob' ? 0.134 : 0.128, 28, 18, 0, TAU, 0, Math.PI * (d.style === 'bob' ? 0.72 : 0.58)),
            hairM
        );
        hairCap.position.set(0, 0.142, -0.010);
        hairCap.rotation.x = -0.36;
        hairCap.scale.set(1.04, 1.04, 1.02);
        hairCap.castShadow = true;
        P.head.add(hairCap);

        // Wispy bangs
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

        // Sidelocks
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
        } else if (d.style === 'ponytail' || d.style === 'samurai') {
            const py = d.style === 'samurai' ? 0.235 : 0.218;
            hangChain(0, py, -0.118, d.style === 'samurai' ? 1.45 : 1.30, 5, 'tail', 0);
            const tie = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.011, 8, 16), accM);
            tie.position.set(0, py, -0.118);
            tie.rotation.x = 0.5;
            P.head.add(tie);
        } else if (d.style === 'long') {
            for (const ox of [-0.080, -0.040, 0, 0.040, 0.080]) {
                hangChain(ox, 0.156, -0.102 + Math.abs(ox) * 0.14, 0.90, 5, 'long', Math.sign(ox));
            }
        } else if (d.style === 'bob') {
            // Sculpted back bob strands
            for (const s of [-1, 0, 1]) {
                const strand = new THREE.Mesh(G.bobStrand, hairM);
                strand.position.set(s * 0.065, 0.165, -0.092);
                strand.rotation.set(-0.45, s * 0.22, 0);
                P.head.add(strand);
            }
        } else if (d.style === 'bun') {
            const bun = new THREE.Mesh(new THREE.SphereGeometry(0.072, 18, 14), hairM);
            bun.position.set(0, 0.268, -0.058);
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.012, 8, 18), accM);
            band.rotation.x = Math.PI / 2 - 0.35;
            band.position.set(0, 0.234, -0.046);
            P.head.add(bun, band);
            hangChain(0, 0.200, -0.110, 0.68, 3, 'tail', 0);
        } else if (d.style === 'spacebuns') {
            for (const s of [-1, 1]) {
                const sb = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 12), hairM);
                sb.position.set(s * 0.085, 0.258, -0.024);
                const sBand = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.008, 6, 14), accM);
                sBand.rotation.x = Math.PI / 2; sBand.position.set(s * 0.085, 0.245, -0.024);
                P.head.add(sb, sBand);
                hangChain(s * 0.085, 0.235, -0.045, 0.65, 3, 'tail', s);
            }
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
        } else if (d.acc === 'headphones') {
            const hpG = new THREE.Group();
            hpG.position.set(0, 0.065, 0.012);
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.008, 6, 20), accM);
            band.rotation.x = Math.PI / 2;
            for (const s of [-1, 1]) {
                const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.016, 12), metalM);
                cup.position.set(s * 0.062, 0, 0); cup.rotation.z = Math.PI / 2;
                const earTip = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.026, 4), accM);
                earTip.position.set(s * 0.048, 0.048, 0); earTip.rotation.z = -s * 0.35;
                hpG.add(cup, earTip);
            }
            hpG.add(band);
            P.neck.add(hpG);
        }

        const girlObj = {
            root, body, parts: P, hit, mats, def: d,
            prevY: 0.94, prevVy: 0, prevX: 0, prevVx: 0,
            blinkT: 1.4 + Math.random() * 2.5, blinking: false,
            breathT: Math.random() * TAU, lastStepSign: 1
        };

        // Attach Signature 3D Beach Props
        buildProp(girlObj, d, matsPack, AN);

        return girlObj;
    }

    // ------------------------------------------------------------------------
    // GPU-Skinned Soft-Engine Jiggle Bone Solver
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

        // 1. Skinned Breast Jiggle Bones
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

        // 4. Cascaded Hair Chains & Flowing Cloth
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

    // ------------------------------------------------------------------------
    // Personality-Driven Kinematics (Bespoke Arm & Leg Cycles per Archetype!)
    // ------------------------------------------------------------------------
    function updateGirl(g, S, dt, ph, amt, speed, allowBlink = true) {
        const P = g.parts;
        const d = g.def;
        const s = Math.sin(ph);
        const c = Math.cos(ph);

        g.breathT += dt * 2.6;
        const breath = Math.sin(g.breathT) * 0.014;
        const anim = d.animStyle || 'cute_bounce';

        // Base Leg Kinematics
        const kneeAmp = anim === 'sporty_dash' ? 1.35 : anim === 'playful_skip' ? 1.25 : 1.15;
        P.thighL.rotation.x = s * 0.75 * amt;
        P.thighR.rotation.x = -s * 0.75 * amt;
        P.kneeL.rotation.x = (0.20 + Math.max(0, -Math.sin(ph - 0.55)) * kneeAmp) * amt;
        P.kneeR.rotation.x = (0.20 + Math.max(0, Math.sin(ph - 0.55)) * kneeAmp) * amt;
        P.ankleL.rotation.x = Math.sin(ph - 0.8) * 0.34 * amt;
        P.ankleR.rotation.x = -Math.sin(ph - 0.8) * 0.34 * amt;

        // Archetype-Specific Upper Body & Arm Kinematics
        if (anim === 'cute_bounce' || anim === 'bouncy_drill') {
            // Cute Idol: Hands held high near collarbone, cheerful elbows
            P.shL.rotation.set(-0.25 - s * 0.25 * amt, 0, -0.32);
            P.shR.rotation.set(-0.25 + s * 0.25 * amt, 0, 0.32);
            P.elL.rotation.set(-1.45 * amt, 0, 0.25);
            P.elR.rotation.set(-1.45 * amt, 0, -0.25);
            P.head.rotation.set(-0.05 * amt, s * 0.12 * amt, -s * 0.08 * amt);
        } else if (anim === 'sporty_dash') {
            // Athletic: Deep forward lean, strong rhythmic arm swings
            P.shL.rotation.set(-s * 0.85 * amt + 0.18, 0, -0.08);
            P.shR.rotation.set(s * 0.85 * amt + 0.18, 0, 0.08);
            P.elL.rotation.set(-1.18 * amt, 0, 0.05);
            P.elR.rotation.set(-1.18 * amt, 0, -0.05);
            P.head.rotation.set(-0.14 * amt, s * 0.06 * amt, 0);
        } else if (anim === 'runway_strut' || anim === 'sultry_strut') {
            // Model: Graceful hip roll, left hand on hip, poised shoulders
            P.shL.rotation.set(0.12, 0, -0.55);
            P.elL.rotation.set(-1.55 * amt, 0, 0.35);
            P.shR.rotation.set(s * 0.55 * amt + 0.05, 0, 0.15);
            P.elR.rotation.set(-0.75 * amt, 0, -0.10);
            P.head.rotation.set(-0.04 * amt, s * 0.14 * amt, -0.08 * amt);
        } else if (anim === 'gentle_frolic') {
            // Romantic: Left hand gently holding sunhat
            P.shL.rotation.set(-1.65 * amt, 0, 0.42);
            P.elL.rotation.set(-1.75 * amt, 0, -0.35);
            P.shR.rotation.set(s * 0.52 * amt + 0.06, 0, 0.12);
            P.elR.rotation.set(-0.95 * amt, 0, -0.08);
            P.head.rotation.set(-0.06 * amt, s * 0.08 * amt, 0.06 * amt);
        } else {
            // Graceful Glide & Playful Skip
            P.shL.rotation.set(-s * 0.60 * amt + 0.08, 0, -0.06);
            P.shR.rotation.set(s * 0.60 * amt + 0.08, 0, 0.06);
            P.elL.rotation.set(-1.02 * amt, 0, 0.06);
            P.elR.rotation.set(-1.02 * amt, 0, -0.06);
            P.head.rotation.set(-0.07 * amt, s * 0.09 * amt, -s * 0.03 * amt);
        }

        const hipBounce = anim === 'cute_bounce' ? 0.085 : anim === 'playful_skip' ? 0.092 : 0.066;
        P.hips.position.y = 0.94 + Math.abs(c) * hipBounce * amt;
        P.hips.rotation.set(0, s * 0.15 * amt, -s * 0.095 * amt);
        P.spine.rotation.set(0.05 * amt, -s * 0.10 * amt, s * 0.04 * amt);
        P.chest.rotation.set(0.06 * amt + breath, -s * 0.14 * amt, s * 0.04 * amt);

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

    // ------------------------------------------------------------------------
    // Tag Reaction (Heart Bursts, Star Orbits, Twirl, Wave & Cheerful Escape)
    // ------------------------------------------------------------------------
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
        heartBurst(S, headPos.add(V(0, 0.25, 0)), 14);

        if (BO.Minigames && BO.Minigames.popup) {
            BO.Minigames.popup(headPos.clone().add(V(0, 0.3, 0)), `${d.name}: ${d.voiceLine}`, '#f472b6');
        }

        const y0 = r.position.y;
        const side = r.position.x >= 0 ? 1 : -1;
        let t = 0, hearts = 0;

        S.animate((dt) => {
            t += dt;
            const glow = t < 0.25 ? t / 0.25 : Math.max(0, 1 - (t - 0.25) / 2.2);
            for (const m of g.mats) m.emissiveIntensity = 0.40 * glow + Math.max(0, Math.sin(t * 14)) * 0.10 * glow;

            if (t < 1.7) {
                // Cheerful hop & celebratory double wave
                const hop = t < 0.55 ? Math.sin(t / 0.55 * Math.PI) * 0.44 : Math.abs(Math.sin(t * 9)) * 0.05;
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
                if (t > 0.5 && hearts < 4 && t > 0.5 + hearts * 0.30) {
                    hearts++;
                    const hp = new THREE.Vector3();
                    P.head.getWorldPosition(hp);
                    heartBurst(S, hp.add(V(0, 0.35, 0)), 4);
                }
            } else if (t < 3.4) {
                // Cheerful dash with backward goodbye wave
                const k = t - 1.7;
                r.rotation.y = AN.lerp(r.rotation.y, side * 1.3, Math.min(1, dt * 4));
                r.position.x += side * dt * 2.8 * Math.min(1, k * 2);
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
