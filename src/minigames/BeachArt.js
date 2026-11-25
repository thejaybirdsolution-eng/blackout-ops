/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Sweetheart Shore High-Detail Character & Physics Kit
   Sculpted anatomical LatheGeometry figures, high-res procedural skin/fabric/
   anime-face/hair-sheen textures, bespoke swimwear per character, and real
   2nd-order spring-damper dynamics for soft tissue, hair chains, and cloth.
   Faces +Z, feet at y=0, ~1.68m tall. Zero external assets.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const L = BO.MinigameLib;
    const { SFX, TAU } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

    // 8 unique characters — distinct palettes, proportions, hairstyles, swimwear & accessories
    const GIRLS = [
        {
            name: 'Mina', skin: 0xffe0cc, blush: '#ff7aa8', hair: 0xf472b6, hairHi: '#fbcfe8', style: 'twintails',
            eyes: '#ec4899', suit: 'frill', pattern: 'gingham', c1: 0xf472b6, c2: 0xffffff, metal: 0xfef08a,
            acc: 'bow', accC: 0xbe185d, jewelry: 'pearl', bust: 1.06, hip: 1.04, height: 0.99
        },
        {
            name: 'Rin', skin: 0xf6d4b8, blush: '#fb7185', hair: 0x1e293b, hairHi: '#60a5fa', style: 'ponytail',
            eyes: '#0ea5e9', suit: 'sport', pattern: 'mesh', c1: 0x0ea5e9, c2: 0xf8fafc, metal: 0xe2e8f0,
            acc: 'visor', accC: 0xffffff, jewelry: 'band', bust: 0.96, hip: 0.98, height: 1.02
        },
        {
            name: 'Hana', skin: 0xe9b68c, blush: '#f97316', hair: 0x7c2d12, hairHi: '#fb923c', style: 'long',
            eyes: '#16a34a', suit: 'sarong', pattern: 'hibiscus', c1: 0xf97316, c2: 0xfef08a, metal: 0xfacc15,
            acc: 'flower', accC: 0xef4444, jewelry: 'anklet', bust: 1.12, hip: 1.08, height: 1.01
        },
        {
            name: 'Yuki', skin: 0xfff0e6, blush: '#f472b6', hair: 0xdbeafe, hairHi: '#ffffff', style: 'bob',
            eyes: '#2563eb', suit: 'onepiece', pattern: 'nautical', c1: 0x1d4ed8, c2: 0xffffff, metal: 0xfbbf24,
            acc: 'shades', accC: 0x0f172a, jewelry: 'pearl', bust: 1.02, hip: 1.02, height: 1.0
        },
        {
            name: 'Sora', skin: 0xc98a4e, blush: '#f43f5e', hair: 0xfacc15, hairHi: '#fef9c3', style: 'bun',
            eyes: '#d97706', suit: 'sport', pattern: 'stripe', c1: 0x10b981, c2: 0x064e3b, metal: 0xfde047,
            acc: 'scrunchie', accC: 0x34d399, jewelry: 'hoop', bust: 1.04, hip: 1.05, height: 1.01
        },
        {
            name: 'Aiko', skin: 0xffd9b3, blush: '#fb7185', hair: 0x991b1b, hairHi: '#f87171', style: 'braid',
            eyes: '#dc2626', suit: 'frill', pattern: 'polka', c1: 0xfde047, c2: 0xf59e0b, metal: 0xfef3c7,
            acc: 'hat', accC: 0xfef3c7, jewelry: 'ribbon', bust: 1.08, hip: 1.06, height: 0.98
        },
        {
            name: 'Nami', skin: 0x9b6236, blush: '#f43f5e', hair: 0x0f172a, hairHi: '#818cf8', style: 'long',
            eyes: '#f59e0b', suit: 'onepiece', pattern: 'ombre', c1: 0xdb2777, c2: 0xfbcfe8, metal: 0xfacc15,
            acc: 'flower', accC: 0xfde047, jewelry: 'bangle', bust: 1.14, hip: 1.1, height: 1.03
        },
        {
            name: 'Kiko', skin: 0xf2c693, blush: '#ec4899', hair: 0xa78bfa, hairHi: '#ede9fe', style: 'twintails',
            eyes: '#14b8a6', suit: 'sarong', pattern: 'shell', c1: 0x14b8a6, c2: 0xccfbf1, metal: 0xe2e8f0,
            acc: 'bow', accC: 0x7c3aed, jewelry: 'choker', bust: 1.0, hip: 1.03, height: 0.99
        }
    ];

    function hexStr(n) { return '#' + (n >>> 0).toString(16).padStart(6, '0'); }
    function shadeHex(hex, amt) {
        const r = clamp(((hex >> 16) & 255) + amt, 0, 255);
        const g = clamp(((hex >> 8) & 255) + amt, 0, 255);
        const b = clamp((hex & 255) + amt, 0, 255);
        return `rgb(${r},${g},${b})`;
    }

    // ------------------------------------------------------------------------
    // Cached sculpted geometries (built once, shared across all characters)
    // ------------------------------------------------------------------------
    const GEO = {};
    function lathe(pts, segs = 24) {
        const v2 = pts.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y));
        const g = new THREE.LatheGeometry(v2, segs);
        g.computeVertexNormals();
        return g;
    }

    function getGeos() {
        if (GEO.ready) return GEO;
        GEO.ready = true;

        // Continuous sculpted hourglass torso (pelvis -> waist -> ribcage -> shoulders -> neck base)
        GEO.torso = lathe([
            [0.015, -0.07],
            [0.105, -0.055],
            [0.152, -0.015],  // lower hip curve
            [0.158,  0.035],  // iliac crest / hip peak
            [0.128,  0.10],   // lower belly taper
            [0.102,  0.165],  // narrow sculpted waist
            [0.112,  0.225],  // lower ribcage
            [0.128,  0.295],  // mid ribcage
            [0.136,  0.365],  // upper chest
            [0.145,  0.425],  // shoulder/clavicle flare
            [0.115,  0.455],  // trapezius slope
            [0.052,  0.475],  // neck root
            [0.044,  0.50]
        ], 28);

        // Contoured anatomical thigh (pivot at hip joint y=0, extends down to knee y=-0.42)
        GEO.thigh = lathe([
            [0.055,  0.02],
            [0.086, -0.03],   // upper outer thigh fullness
            [0.088, -0.09],
            [0.081, -0.17],   // mid thigh taper
            [0.070, -0.27],
            [0.057, -0.36],   // above knee
            [0.052, -0.41],   // knee cap
            [0.045, -0.435]
        ], 20);

        // Contoured anatomical calf (pivot at knee y=0, extends down to ankle y=-0.41)
        GEO.calf = lathe([
            [0.048,  0.01],
            [0.055, -0.04],
            [0.063, -0.115],  // gastrocnemius curve
            [0.058, -0.19],
            [0.046, -0.28],   // Achilles taper
            [0.036, -0.36],   // slender ankle
            [0.035, -0.405]
        ], 20);

        // Sculpted upper arm (deltoid cap -> bicep -> elbow)
        GEO.upperArm = lathe([
            [0.042,  0.015],
            [0.049, -0.025],  // deltoid curve
            [0.044, -0.09],
            [0.040, -0.17],
            [0.036, -0.245],
            [0.032, -0.27]
        ], 16);

        // Sculpted forearm (elbow -> wrist)
        GEO.forearm = lathe([
            [0.034,  0.01],
            [0.038, -0.05],   // brachioradialis curve
            [0.033, -0.13],
            [0.026, -0.21],   // slender wrist
            [0.023, -0.245]
        ], 16);

        // Sculpted bust teardrop contour (rotated forward along +Z)
        GEO.bust = lathe([
            [0.002,  0.068],  // apex
            [0.028,  0.060],
            [0.052,  0.038],
            [0.064,  0.008],  // fullest contour
            [0.066, -0.022],
            [0.054, -0.048],  // underbust curve
            [0.012, -0.058]
        ], 22);
        GEO.bust.rotateX(Math.PI / 2);

        // Sculpted glute / hip contour
        GEO.glute = new THREE.SphereGeometry(0.088, 18, 14);
        GEO.glute.scale(1.04, 1.08, 0.92);

        // Sculpted anime head (rounded cranium tapering smoothly into delicate chin)
        GEO.skull = lathe([
            [0.004, -0.015],  // chin tip
            [0.048,  0.002],  // jawline
            [0.095,  0.035],  // cheeks
            [0.128,  0.085],  // cheekbones
            [0.142,  0.145],  // temples
            [0.144,  0.205],  // cranium
            [0.125,  0.258],  // upper crown
            [0.080,  0.292],
            [0.004,  0.305]
        ], 28);

        // Curved anime bang / lock ribbon (tapered curved strand)
        const curvePts = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -0.045, 0.022),
            new THREE.Vector3(0, -0.095, 0.028),
            new THREE.Vector3(0, -0.145, 0.016)
        ];
        GEO.bangCurve = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), 10, 0.018, 8, false);
        // Taper tip of bangCurve
        const bp = GEO.bangCurve.attributes.position;
        for (let i = 0; i < bp.count; i++) {
            const y = bp.getY(i);
            const t = clamp(-y / 0.145, 0, 1);
            const taper = 1 - t * 0.85;
            bp.setX(i, bp.getX(i) * taper * 1.45);
        }
        GEO.bangCurve.computeVertexNormals();

        // Hair segment for spring-chain tails (tapered silky lock)
        GEO.hairSeg = lathe([
            [0.018, -0.14],
            [0.036, -0.11],
            [0.046, -0.06],
            [0.044, -0.015],
            [0.028,  0.01]
        ], 14);

        // Hair tip segment (pointed wispy end)
        GEO.hairTip = lathe([
            [0.003, -0.16],
            [0.018, -0.11],
            [0.032, -0.05],
            [0.036, -0.008],
            [0.020,  0.01]
        ], 14);

        // Sculpted neck
        GEO.neck = lathe([
            [0.046, 0.0],
            [0.039, 0.035],
            [0.038, 0.075],
            [0.043, 0.105]
        ], 16);

        return GEO;
    }

    // ------------------------------------------------------------------------
    // High-Res Procedural Textures (Skin SSS, Fabric Patterns, Hair Sheen, Face)
    // ------------------------------------------------------------------------
    function skinTex(skinHex, blushCol) {
        return L.canvasTex('hq-skin:' + skinHex + ':' + blushCol, 256, 256, (g, w, h) => {
            // Subtle vertical warm SSS gradient (sun-kissed shoulders, soft warmth at torso)
            const gr = g.createLinearGradient(0, 0, 0, h);
            gr.addColorStop(0, shadeHex(skinHex, 10));
            gr.addColorStop(0.5, hexStr(skinHex));
            gr.addColorStop(1, shadeHex(skinHex, -8));
            g.fillStyle = gr;
            g.fillRect(0, 0, w, h);
            // Soft rosy ambient blush bands (simulates warm subsurface scattering)
            const rad = g.createRadialGradient(w * 0.5, h * 0.42, 8, w * 0.5, h * 0.42, w * 0.48);
            rad.addColorStop(0, 'rgba(255, 160, 150, 0.10)');
            rad.addColorStop(1, 'rgba(255, 160, 150, 0.0)');
            g.fillStyle = rad;
            g.fillRect(0, 0, w, h);
            // Delicate collarbone & navel highlights/shadows for torso UV
            g.strokeStyle = shadeHex(skinHex, -22);
            g.globalAlpha = 0.25;
            g.lineWidth = 3;
            g.beginPath(); g.moveTo(w * 0.32, h * 0.18); g.quadraticCurveTo(w * 0.5, h * 0.21, w * 0.68, h * 0.18); g.stroke();
            g.fillStyle = shadeHex(skinHex, -28);
            g.beginPath(); g.ellipse(w * 0.5, h * 0.68, 3.5, 5, 0, 0, TAU); g.fill();
            g.globalAlpha = 1;
        });
    }

    function hairTex(hairHex, hiCol) {
        return L.canvasTex('hq-hair:' + hairHex + ':' + hiCol, 256, 256, (g, w, h) => {
            const gr = g.createLinearGradient(0, 0, 0, h);
            gr.addColorStop(0, shadeHex(hairHex, -18));
            gr.addColorStop(0.28, hexStr(hairHex));
            gr.addColorStop(0.42, shadeHex(hairHex, 24));
            gr.addColorStop(0.65, hexStr(hairHex));
            gr.addColorStop(1, shadeHex(hairHex, -25));
            g.fillStyle = gr;
            g.fillRect(0, 0, w, h);
            // Fine vertical hair strands
            for (let x = 0; x < w; x += 2) {
                const a = (Math.sin(x * 0.7) * 0.5 + 0.5) * 0.14;
                g.fillStyle = x % 4 === 0 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 0.9})`;
                g.fillRect(x, 0, 1.5, h);
            }
            // Anime "angel ring" anisotropic specular band
            const halo = g.createLinearGradient(0, h * 0.25, 0, h * 0.44);
            halo.addColorStop(0, 'rgba(255,255,255,0)');
            halo.addColorStop(0.45, hiCol);
            halo.addColorStop(0.55, 'rgba(255,255,255,0.65)');
            halo.addColorStop(1, 'rgba(255,255,255,0)');
            g.globalAlpha = 0.45;
            g.fillStyle = halo;
            g.fillRect(0, h * 0.25, w, h * 0.19);
            g.globalAlpha = 1;
        });
    }

    function fabricTex(pattern, c1, c2) {
        const s1 = hexStr(c1), s2 = hexStr(c2);
        return L.canvasTex('hq-fab:' + pattern + ':' + s1 + ':' + s2, 256, 256, (g, w, h) => {
            g.fillStyle = s1;
            g.fillRect(0, 0, w, h);
            if (pattern === 'gingham') {
                g.fillStyle = s2;
                g.globalAlpha = 0.55;
                for (let i = 0; i < w; i += 32) { g.fillRect(i, 0, 16, h); g.fillRect(0, i, w, 16); }
                g.globalAlpha = 1;
            } else if (pattern === 'hibiscus') {
                const drawFlower = (cx, cy, r) => {
                    g.fillStyle = s2;
                    for (let k = 0; k < 5; k++) {
                        const a = k * TAU / 5;
                        g.beginPath(); g.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.5, r * 0.34, a, 0, TAU); g.fill();
                    }
                    g.fillStyle = '#ef4444';
                    g.beginPath(); g.arc(cx, cy, r * 0.22, 0, TAU); g.fill();
                };
                for (let y = 32; y < h; y += 64) for (let x = 32; x < w; x += 64) drawFlower(x + ((y / 64) % 2) * 32, y, 22);
            } else if (pattern === 'nautical') {
                g.fillStyle = s2;
                for (let y = 0; y < h; y += 28) g.fillRect(0, y, w, 11);
            } else if (pattern === 'polka') {
                g.fillStyle = s2;
                for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) {
                    g.beginPath(); g.arc(x + ((y / 32) % 2) * 16, y, 7, 0, TAU); g.fill();
                }
            } else if (pattern === 'stripe') {
                g.fillStyle = s2;
                for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 8, h);
                g.fillStyle = 'rgba(255,255,255,0.22)';
                for (let x = 12; x < w; x += 32) g.fillRect(x, 0, 3, h);
            } else if (pattern === 'ombre') {
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0, s1); gr.addColorStop(0.55, s2); gr.addColorStop(1, s1);
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
                g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2;
                for (let y = 16; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.33, y - 10, w * 0.66, y + 10, w, y); g.stroke(); }
            } else if (pattern === 'shell') {
                g.strokeStyle = s2; g.lineWidth = 3;
                for (let y = 0; y <= h; y += 32) for (let x = 0; x <= w; x += 32) {
                    g.beginPath(); g.arc(x + ((y / 32) % 2) * 16, y, 16, Math.PI, TAU); g.stroke();
                }
            } else if (pattern === 'mesh') {
                g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1.5;
                for (let i = -h; i < w + h; i += 14) {
                    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke();
                    g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke();
                }
            }
            // Subtle woven micro-sheen
            g.fillStyle = 'rgba(255,255,255,0.06)';
            for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
        });
    }

    /** 512x512 high-resolution anime face with 'open' | 'blink' | 'happy' expressions */
    function animeFaceHQ(eyeCol, hairHex, blushCol, expr) {
        const key = `hq-face:${eyeCol}:${hairHex}:${expr}`;
        return L.canvasTex(key, 512, 512, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            const browCol = shadeHex(hairHex, -20);

            // Soft airbrushed cheek blush + subtle highlight dots
            const drawBlush = (cx, cy, alpha) => {
                const rg = g.createRadialGradient(cx, cy, 4, cx, cy, 48);
                rg.addColorStop(0, blushCol);
                rg.addColorStop(1, 'rgba(255,120,150,0)');
                g.globalAlpha = alpha;
                g.fillStyle = rg;
                g.beginPath(); g.ellipse(cx, cy, 52, 26, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
                // Cute anime blush hatch strokes
                g.strokeStyle = blushCol;
                g.globalAlpha = alpha * 0.9;
                g.lineWidth = 3;
                for (let k = -1; k <= 1; k++) {
                    g.beginPath(); g.moveTo(cx + k * 14 - 4, cy + 8); g.lineTo(cx + k * 14 + 4, cy - 8); g.stroke();
                }
                g.globalAlpha = 1;
            };
            drawBlush(128, 325, expr === 'happy' ? 0.65 : 0.36);
            drawBlush(384, 325, expr === 'happy' ? 0.65 : 0.36);

            g.lineCap = 'round';
            g.lineJoin = 'round';

            if (expr === 'happy') {
                // Joyful sparkling ^ ^ eyes
                for (const cx of [162, 350]) {
                    g.strokeStyle = '#1b0d2e'; g.lineWidth = 18;
                    g.beginPath(); g.moveTo(cx - 52, 264); g.quadraticCurveTo(cx, 192, cx + 52, 264); g.stroke();
                    // Eyelash flicks
                    g.lineWidth = 10;
                    const dir = cx < 256 ? -1 : 1;
                    g.beginPath(); g.moveTo(cx + dir * 48, 256); g.lineTo(cx + dir * 68, 236); g.stroke();
                    // Tiny sparkle star next to eye
                    g.fillStyle = '#fff9c4';
                    g.beginPath(); g.arc(cx + dir * 64, 210, 7, 0, TAU); g.fill();
                }
                // Happy eyebrows raised
                g.strokeStyle = browCol; g.lineWidth = 8;
                for (const cx of [162, 350]) { g.beginPath(); g.moveTo(cx - 38, 152); g.quadraticCurveTo(cx, 130, cx + 38, 152); g.stroke(); }
                // Bright open laughing smile
                g.fillStyle = '#881337';
                g.beginPath(); g.moveTo(206, 358); g.quadraticCurveTo(256, 434, 306, 358); g.quadraticCurveTo(256, 368, 206, 358); g.closePath(); g.fill();
                g.fillStyle = '#fb7185';
                g.beginPath(); g.ellipse(256, 396, 28, 15, 0, 0, TAU); g.fill();
                g.fillStyle = '#ffffff';
                g.beginPath(); g.moveTo(216, 362); g.quadraticCurveTo(256, 374, 296, 362); g.quadraticCurveTo(256, 378, 216, 362); g.fill();
            } else if (expr === 'blink') {
                // Soft curved closed eyelids
                for (const cx of [162, 350]) {
                    g.strokeStyle = '#1b0d2e'; g.lineWidth = 16;
                    g.beginPath(); g.moveTo(cx - 50, 255); g.quadraticCurveTo(cx, 282, cx + 50, 255); g.stroke();
                    const dir = cx < 256 ? -1 : 1;
                    g.lineWidth = 9;
                    g.beginPath(); g.moveTo(cx + dir * 46, 256); g.lineTo(cx + dir * 64, 246); g.stroke();
                }
                g.strokeStyle = browCol; g.lineWidth = 8;
                for (const cx of [162, 350]) { g.beginPath(); g.moveTo(cx - 38, 165); g.quadraticCurveTo(cx, 148, cx + 38, 165); g.stroke(); }
                // Warm closed smile
                g.strokeStyle = '#9f1239'; g.lineWidth = 9;
                g.beginPath(); g.moveTo(224, 372); g.quadraticCurveTo(256, 396, 288, 372); g.stroke();
            } else {
                // Detailed jewel-like anime eyes
                for (const cx of [162, 350]) {
                    const dir = cx < 256 ? -1 : 1;
                    // Sclera with subtle top shadow
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(cx, 248, 52, 62, 0, 0, TAU); g.fill();
                    g.fillStyle = 'rgba(148, 163, 184, 0.25)';
                    g.beginPath(); g.ellipse(cx, 220, 50, 28, 0, 0, TAU); g.fill();

                    // Layered jewel iris
                    const ig = g.createLinearGradient(0, 196, 0, 304);
                    ig.addColorStop(0, '#120826');
                    ig.addColorStop(0.35, eyeCol);
                    ig.addColorStop(0.78, eyeCol);
                    ig.addColorStop(1, '#ffffff');
                    g.fillStyle = ig;
                    g.beginPath(); g.ellipse(cx, 254, 39, 51, 0, 0, TAU); g.fill();

                    // Lower glowing crescent in iris
                    g.fillStyle = 'rgba(255,255,255,0.45)';
                    g.beginPath(); g.ellipse(cx, 282, 24, 14, 0, 0, TAU); g.fill();

                    // Deep pupil + ring
                    g.fillStyle = '#140826';
                    g.beginPath(); g.ellipse(cx, 254, 17, 24, 0, 0, TAU); g.fill();

                    // Multi-point starlight catchlights
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(cx - 16, 224, 14, 16, -0.25, 0, TAU); g.fill();
                    g.beginPath(); g.arc(cx + 16, 276, 8, 0, TAU); g.fill();
                    g.beginPath(); g.arc(cx + 12, 232, 4.5, 0, TAU); g.fill();

                    // Sculpted upper lash line + wing + lower lash accent
                    g.strokeStyle = '#1b0d2e'; g.lineWidth = 18;
                    g.beginPath(); g.ellipse(cx, 248, 54, 62, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
                    g.lineWidth = 10;
                    g.beginPath(); g.moveTo(cx + dir * 48, 222); g.lineTo(cx + dir * 70, 202); g.stroke();
                    g.beginPath(); g.moveTo(cx + dir * 50, 238); g.lineTo(cx + dir * 66, 228); g.stroke();
                    // Upper eyelid crease
                    g.strokeStyle = 'rgba(90, 45, 35, 0.55)'; g.lineWidth = 4;
                    g.beginPath(); g.ellipse(cx, 238, 56, 66, 0, Math.PI * 1.18, Math.PI * 1.82); g.stroke();
                    // Delicate lower lash
                    g.strokeStyle = 'rgba(27, 13, 46, 0.55)'; g.lineWidth = 5;
                    g.beginPath(); g.ellipse(cx, 250, 50, 58, 0, Math.PI * 0.25, Math.PI * 0.75); g.stroke();
                }
                // Eyebrows matching hair
                g.strokeStyle = browCol; g.lineWidth = 9;
                for (const cx of [162, 350]) {
                    g.beginPath(); g.moveTo(cx - 42, 160); g.quadraticCurveTo(cx, 138, cx + 42, 158); g.stroke();
                }
                // Delicate nose shadow
                g.fillStyle = 'rgba(120, 60, 45, 0.32)';
                g.beginPath(); g.moveTo(256, 304); g.lineTo(250, 322); g.lineTo(260, 324); g.closePath(); g.fill();
                // Cheerful glossy smile
                g.strokeStyle = '#9f1239'; g.lineWidth = 9;
                g.beginPath(); g.moveTo(222, 368); g.quadraticCurveTo(256, 398, 290, 368); g.stroke();
                // Lower lip gloss highlight
                g.fillStyle = 'rgba(255, 220, 230, 0.75)';
                g.beginPath(); g.ellipse(256, 392, 14, 4.5, 0, 0, TAU); g.fill();
            }
        });
    }

    // ------------------------------------------------------------------------
    // Heart projectile & burst sprites
    // ------------------------------------------------------------------------
    function heartTex() {
        return L.canvasTex('hq-heart-sprite', 128, 128, (g, w, h) => {
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
            g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3;
            path(); g.stroke();
            g.fillStyle = 'rgba(255,255,255,0.85)';
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

    function heartBurst(S, pos, n = 9) {
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

    // Subtle sand kick puff on footsteps
    let sandMat = null;
    function sandPuff(S, pos) {
        if (!sandMat) {
            const tex = L.canvasTex('hq-sand-puff', 64, 64, (g, w, h) => {
                const rg = g.createRadialGradient(32, 32, 4, 32, 32, 30);
                rg.addColorStop(0, 'rgba(246, 224, 176, 0.72)');
                rg.addColorStop(1, 'rgba(246, 224, 176, 0)');
                g.fillStyle = rg; g.fillRect(0, 0, w, h);
            });
            sandMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
        }
        const sp = new THREE.Sprite(sandMat);
        sp.position.set(pos.x + (Math.random() - 0.5) * 0.25, 0.08, pos.z - 0.12);
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
    // 2nd-Order Spring-Damper Physics Engine (real velocity + stiffness + damping)
    // ------------------------------------------------------------------------
    function makeSpring(k, c, maxDisp) {
        return { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, k, c, max: maxDisp };
    }
    function stepSpring(sp, ax, ay, az, dt) {
        const d = Math.min(dt, 0.04);
        sp.vx += (-sp.k * sp.x - sp.c * sp.vx + ax) * d;
        sp.vy += (-sp.k * sp.y - sp.c * sp.vy + ay) * d;
        sp.vz += (-sp.k * sp.z - sp.c * sp.vz + az) * d;
        sp.x = clamp(sp.x + sp.vx * d, -sp.max, sp.max);
        sp.y = clamp(sp.y + sp.vy * d, -sp.max, sp.max);
        sp.z = clamp(sp.z + sp.vz * d, -sp.max, sp.max);
    }

    // ------------------------------------------------------------------------
    // Sculpted Hand & Foot+Sandal helpers
    // ------------------------------------------------------------------------
    function buildHand(skinMat, side) {
        const g = new THREE.Group();
        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.056, 0.02), skinMat);
        palm.position.y = -0.026;
        g.add(palm);
        // 4 slender tapered fingers
        for (let i = 0; i < 4; i++) {
            const fLen = i === 1 || i === 2 ? 0.044 : 0.036;
            const fg = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.0038, fLen, 6), skinMat);
            fg.position.set((-0.015 + i * 0.01) * side, -0.054 - fLen * 0.45, 0.005);
            fg.rotation.x = 0.22;
            g.add(fg);
        }
        // Thumb
        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.0045, 0.032, 6), skinMat);
        thumb.position.set(-0.024 * side, -0.026, 0.012);
        thumb.rotation.set(0.25, 0, -0.55 * side);
        g.add(thumb);
        return g;
    }

    function buildFootSandal(skinMat, soleMat, strapMat, metalMat) {
        const g = new THREE.Group();
        // Sculpted foot arch + forefoot
        const heel = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), skinMat);
        heel.scale.set(0.9, 0.72, 1.35);
        heel.position.set(0, -0.016, 0.01);
        const fore = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), skinMat);
        fore.scale.set(1.02, 0.56, 1.45);
        fore.position.set(0, -0.024, 0.08);
        g.add(heel, fore);
        // 5 sculpted toes
        for (let i = 0; i < 5; i++) {
            const tr = i === 0 ? 0.0095 : 0.0075 - i * 0.0006;
            const toe = new THREE.Mesh(new THREE.SphereGeometry(tr, 8, 6), skinMat);
            toe.position.set(-0.024 + i * 0.012, -0.032, 0.132 - Math.abs(i - 0.5) * 0.006);
            toe.scale.set(1, 0.85, 1.2);
            g.add(toe);
        }
        // Designer contoured sandal sole
        const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.040, 0.016, 16), soleMat);
        sole.scale.set(0.95, 1, 2.25);
        sole.position.set(0, -0.044, 0.052);
        g.add(sole);
        // Y-strap across forefoot + ankle wrap
        for (const s of [-1, 1]) {
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.088, 6), strapMat);
            st.position.set(s * 0.018, -0.008, 0.085);
            st.rotation.set(1.18, 0, s * 0.36);
            g.add(st);
        }
        const ankleStrap = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.005, 6, 16), strapMat);
        ankleStrap.rotation.x = Math.PI / 2;
        ankleStrap.position.set(0, 0.004, 0.0);
        g.add(ankleStrap);
        // Metallic charm at strap junction
        const charm = new THREE.Mesh(new THREE.OctahedronGeometry(0.009, 0), metalMat);
        charm.position.set(0, 0.002, 0.118);
        g.add(charm);
        return g;
    }

    // ------------------------------------------------------------------------
    // Main High-Detail Character Builder
    // ------------------------------------------------------------------------
    function buildGirl(d) {
        const G = getGeos();
        const mats = [];
        const M = (hex, rough = 0.5, extra = {}) => {
            const m = new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: rough, emissive: 0x000000 }, extra));
            mats.push(m);
            return m;
        };

        const skinM = M(0xffffff, 0.44, { map: skinTex(d.skin, d.blush), metalness: 0.02 });
        const hairM = M(0xffffff, 0.32, { map: hairTex(d.hair, d.hairHi), metalness: 0.12 });
        const suit1 = M(0xffffff, 0.42, { map: fabricTex(d.pattern, d.c1, d.c2), metalness: 0.06 });
        const suit2 = M(d.c2, 0.46, { metalness: 0.05 });
        const metalM = M(d.metal, 0.22, { metalness: 0.85 });
        const accM = M(d.accC, 0.38, { metalness: 0.08 });
        const soleM = M(d.c2, 0.55);

        const root = new THREE.Group();
        const body = new THREE.Group();
        body.scale.setScalar(d.height || 1);
        root.add(body);

        const P = { sway: [], springs: {} };

        // --- HIPS & PELVIS ---
        const hips = new THREE.Group();
        hips.position.y = 0.89;
        body.add(hips);
        P.hips = hips;

        // Sculpted bikini/swimsuit bottom shell fitted over pelvis
        const bottomMat = (d.suit === 'sport' || d.suit === 'sarong') ? suit2 : suit1;
        const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.148, 22, 16), bottomMat);
        pelvis.scale.set(1.06 * d.hip, 0.72, 0.80 * d.hip);
        pelvis.position.y = -0.01;
        hips.add(pelvis);

        // Swimsuit waistband trim + side tie bows (for bikini/sarong/frill)
        const waistBand = new THREE.Mesh(new THREE.TorusGeometry(0.136, 0.011, 8, 28), suit2);
        waistBand.rotation.x = Math.PI / 2;
        waistBand.scale.set(1.06 * d.hip, 0.78 * d.hip, 1);
        waistBand.position.y = 0.048;
        hips.add(waistBand);
        if (d.suit === 'sarong' || d.suit === 'frill') {
            for (const s of [-1, 1]) {
                const tie = new THREE.Group();
                tie.position.set(s * 0.152 * d.hip, 0.042, 0.01);
                for (const k of [-1, 1]) {
                    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.005, 6, 12), suit2);
                    loop.position.set(s * 0.012, k * 0.012, 0);
                    loop.rotation.y = Math.PI / 2;
                    tie.add(loop);
                }
                const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.002, 0.07, 6), suit2);
                tail.position.set(s * 0.014, -0.04, 0);
                tie.add(tail);
                hips.add(tie);
                P.sway.push({ obj: tie, kind: 'ribbon', mirror: s });
            }
        }

        // Sculpted glute soft-tissue mounts with independent 2nd-order spring physics
        const gluteRigs = [];
        for (const s of [-1, 1]) {
            const gRig = new THREE.Group();
            gRig.position.set(s * 0.068 * d.hip, -0.032, -0.052 * d.hip);
            const gm = new THREE.Mesh(G.glute, bottomMat);
            gm.scale.setScalar(d.hip);
            gRig.add(gm);
            hips.add(gRig);
            gluteRigs.push({ obj: gRig, base: gRig.position.clone(), sp: makeSpring(140, 14, 0.018), side: s });
        }
        P.springs.glutes = gluteRigs;

        // --- ANATOMICAL LEGS & SANDALS ---
        for (const s of [-1, 1]) {
            const thigh = new THREE.Group();
            thigh.position.set(s * 0.088 * d.hip, -0.025, 0);
            const tm = new THREE.Mesh(G.thigh, skinM);
            tm.scale.set(1.0, 1, 1.04);
            thigh.add(tm);

            const knee = new THREE.Group();
            knee.position.y = -0.42;
            const kneecap = new THREE.Mesh(new THREE.SphereGeometry(0.050, 12, 10), skinM);
            knee.add(kneecap);
            const cm = new THREE.Mesh(G.calf, skinM);
            knee.add(cm);

            // Optional ankle jewelry / sport tape
            if (d.jewelry === 'anklet' && s > 0) {
                const ank = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.0045, 6, 18), metalM);
                ank.rotation.x = Math.PI / 2;
                ank.position.y = -0.35;
                knee.add(ank);
            }

            const ankle = new THREE.Group();
            ankle.position.y = -0.405;
            ankle.add(buildFootSandal(skinM, soleM, suit1, metalM));
            knee.add(ankle);

            thigh.add(knee);
            hips.add(thigh);
            P[s < 0 ? 'thighL' : 'thighR'] = thigh;
            P[s < 0 ? 'kneeL' : 'kneeR'] = knee;
            P[s < 0 ? 'ankleL' : 'ankleR'] = ankle;
        }

        // --- SCULPTED TORSO & SPINE ---
        const chest = new THREE.Group();
        chest.position.y = 0.03;
        hips.add(chest);
        P.chest = chest;

        const isFullSuit = d.suit === 'onepiece';
        const torsoMesh = new THREE.Mesh(G.torso, isFullSuit ? suit1 : skinM);
        torsoMesh.scale.set(1.02, 1, 0.78);
        chest.add(torsoMesh);

        // Swimsuit torso overlays (one-piece cutouts/belt, sport crop top, frill ruffle, sarong)
        if (d.suit === 'onepiece') {
            // Gold waist chain / belt accent + upper neckline trim
            const belt = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.011, 8, 28), metalM);
            belt.rotation.x = Math.PI / 2;
            belt.scale.set(1.02, 0.79, 1);
            belt.position.y = 0.165;
            const neckTrim = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.009, 6, 24), suit2);
            neckTrim.rotation.x = Math.PI / 2;
            neckTrim.scale.set(1.05, 0.80, 1);
            neckTrim.position.y = 0.39;
            chest.add(belt, neckTrim);
        } else if (d.suit === 'sport') {
            // Athletic racerback crop top + contrast underband
            const crop = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.116, 0.16, 24), suit1);
            crop.scale.set(1.03, 1, 0.80);
            crop.position.y = 0.325;
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.014, 8, 28), suit2);
            band.rotation.x = Math.PI / 2;
            band.scale.set(1.03, 0.80, 1);
            band.position.y = 0.248;
            chest.add(crop, band);
        } else {
            // Bikini back strap + center clasp ring
            const strap = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.009, 6, 28), suit1);
            strap.rotation.x = Math.PI / 2;
            strap.scale.set(1.02, 0.80, 1);
            strap.position.y = 0.285;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.004, 6, 14), metalM);
            ring.position.set(0, 0.295, 0.115);
            chest.add(strap, ring);
        }

        // Halter / shoulder straps connecting bust to neck/shoulders
        for (const s of [-1, 1]) {
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.17, 8), suit1);
            st.position.set(s * 0.072, 0.405, 0.055);
            st.rotation.set(-0.48, 0, s * 0.26);
            chest.add(st);
        }

        // --- SCULPTED BUST + 2ND-ORDER SPRING-DAMPER SOFT-TISSUE PHYSICS ---
        const bustRigs = [];
        for (const s of [-1, 1]) {
            const bRig = new THREE.Group();
            bRig.position.set(s * 0.068, 0.302, 0.082);
            const bSc = d.bust || 1.0;

            // Sculpted cup/bust mesh (swimsuit cup seamlessly contoured over upper bust)
            const cup = new THREE.Mesh(G.bust, suit1);
            cup.scale.set(1.02 * bSc, 1.04 * bSc, 1.08 * bSc);
            cup.rotation.set(0.14, s * 0.22, 0);
            bRig.add(cup);

            // Delicate top-edge trim / lace / contrast piping along cup rim
            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.056 * bSc, 0.007, 6, 18, Math.PI * 1.15), suit2);
            rim.position.set(0, 0.025 * bSc, 0.024 * bSc);
            rim.rotation.set(-0.35, s * 0.22, Math.PI * 0.92);
            bRig.add(rim);

            chest.add(bRig);
            // Realistic soft-tissue spring parameters (stiffness k, damping c, max displacement)
            bustRigs.push({
                obj: bRig,
                base: bRig.position.clone(),
                sp: makeSpring(115, 10.5, 0.024 * bSc),
                side: s,
                scale: bSc
            });
        }
        P.springs.bust = bustRigs;

        // Off-shoulder ruffle / pleated skirt / multi-panel translucent sarong
        if (d.suit === 'frill') {
            // Layered scalloped flounce ruffle
            for (let k = 0; k < 2; k++) {
                const rf = new THREE.Mesh(new THREE.TorusGeometry(0.148 + k * 0.012, 0.018, 8, 32), k === 0 ? suit2 : suit1);
                rf.rotation.x = Math.PI / 2;
                rf.scale.set(1.08, 0.85, 1);
                rf.position.y = 0.365 - k * 0.022;
                chest.add(rf);
            }
            // Pleated micro-skirt with spring sway
            const skirtG = new THREE.Group();
            skirtG.position.y = 0.02;
            const skGeo = new THREE.CylinderGeometry(0.148 * d.hip, 0.255 * d.hip, 0.19, 28, 3, true);
            // Pleat wave displacement on skirt vertices
            const spPos = skGeo.attributes.position;
            for (let i = 0; i < spPos.count; i++) {
                const x = spPos.getX(i), y = spPos.getY(i), z = spPos.getZ(i);
                const ang = Math.atan2(z, x);
                const hem = clamp((0.095 - y) / 0.19, 0, 1);
                const pleat = 1 + Math.sin(ang * 14) * 0.08 * hem;
                spPos.setX(i, x * pleat);
                spPos.setZ(i, z * pleat * 0.88);
            }
            skGeo.computeVertexNormals();
            const skirtM = M(0xffffff, 0.48, { map: fabricTex(d.pattern, d.c1, d.c2), side: THREE.DoubleSide });
            const skirt = new THREE.Mesh(skGeo, skirtM);
            skirt.position.y = -0.09;
            skirtG.add(skirt);
            hips.add(skirtG);
            P.sway.push({ obj: skirtG, kind: 'skirt' });
        } else if (d.suit === 'sarong') {
            // Sheer tie-side floral wrap sarong with flowing hem
            const sarG = new THREE.Group();
            sarG.position.y = 0.025;
            const sarGeo = new THREE.CylinderGeometry(0.156 * d.hip, 0.265 * d.hip, 0.44, 28, 4, true, -0.35, Math.PI * 1.62);
            const sarPos = sarGeo.attributes.position;
            for (let i = 0; i < sarPos.count; i++) {
                const x = sarPos.getX(i), y = sarPos.getY(i), z = sarPos.getZ(i);
                const ang = Math.atan2(z, x);
                const hem = clamp((0.22 - y) / 0.44, 0, 1);
                const wave = 1 + Math.sin(ang * 7) * 0.065 * hem;
                sarPos.setX(i, x * wave);
                sarPos.setZ(i, z * wave * 0.86);
            }
            sarGeo.computeVertexNormals();
            const sarM = M(0xffffff, 0.42, { map: fabricTex(d.pattern, d.c2, d.c1), side: THREE.DoubleSide, transparent: true, opacity: 0.84 });
            const sar = new THREE.Mesh(sarGeo, sarM);
            sar.position.y = -0.21;
            sarG.add(sar);
            hips.add(sarG);
            P.sway.push({ obj: sarG, kind: 'sarong' });
        }

        // --- ANATOMICAL ARMS & SCULPTED HANDS ---
        for (const s of [-1, 1]) {
            const sh = new THREE.Group();
            sh.position.set(s * 0.158, 0.425, -0.005);
            const shCap = new THREE.Mesh(new THREE.SphereGeometry(0.044, 14, 10), skinM);
            sh.add(shCap, new THREE.Mesh(G.upperArm, skinM));

            const el = new THREE.Group();
            el.position.y = -0.265;
            el.add(new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), skinM));
            el.add(new THREE.Mesh(G.forearm, skinM));

            const wrist = new THREE.Group();
            wrist.position.y = -0.24;
            wrist.add(buildHand(skinM, s));
            el.add(wrist);

            // Wrist accessories (scrunchie, sport band, gold bangles)
            if (d.acc === 'scrunchie' && s < 0) {
                const sc = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.014, 8, 18), accM);
                sc.rotation.x = Math.PI / 2;
                sc.position.y = -0.205;
                el.add(sc);
            } else if (d.jewelry === 'bangle' && s > 0) {
                for (let b = 0; b < 3; b++) {
                    const bg = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0035, 6, 16), metalM);
                    bg.rotation.x = Math.PI / 2;
                    bg.position.y = -0.19 - b * 0.011;
                    el.add(bg);
                }
            } else if (d.jewelry === 'band' && s < 0) {
                const wb = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.030, 0.045, 14), suit2);
                wb.position.y = -0.20;
                el.add(wb);
            }

            sh.add(el);
            chest.add(sh);
            P[s < 0 ? 'shL' : 'shR'] = sh;
            P[s < 0 ? 'elL' : 'elR'] = el;
        }

        // --- NECK, JEWELRY & SCULPTED ANIME HEAD ---
        const neck = new THREE.Mesh(G.neck, skinM);
        neck.position.y = 0.468;
        chest.add(neck);

        if (d.jewelry === 'pearl' || d.jewelry === 'choker') {
            const ch = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.0055, 6, 20), d.jewelry === 'pearl' ? suit2 : accM);
            ch.rotation.x = Math.PI / 2;
            ch.position.y = 0.505;
            chest.add(ch);
            const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.01, 0), metalM);
            pendant.position.set(0, 0.492, 0.046);
            chest.add(pendant);
        }

        const head = new THREE.Group();
        head.position.y = 0.562;
        chest.add(head);
        P.head = head;

        const skull = new THREE.Mesh(G.skull, skinM);
        skull.scale.set(1.0, 1.0, 0.96);
        head.add(skull);

        // Sculpted ears + earrings
        for (const s of [-1, 1]) {
            const ear = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), skinM);
            ear.scale.set(0.42, 1.18, 0.85);
            ear.position.set(s * 0.136, 0.115, -0.005);
            head.add(ear);
            if (d.jewelry === 'hoop' || d.jewelry === 'pearl') {
                const er = d.jewelry === 'hoop'
                    ? new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0028, 6, 14), metalM)
                    : new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), suit2);
                er.position.set(s * 0.142, 0.084, -0.002);
                er.rotation.y = Math.PI / 2;
                head.add(er);
            }
        }

        // High-res 512x512 anime face decal curved seamlessly onto front skull
        const faceTexOpen = animeFaceHQ(d.eyes, d.hair, d.blush, 'open');
        const faceTexBlink = animeFaceHQ(d.eyes, d.hair, d.blush, 'blink');
        const faceTexHappy = animeFaceHQ(d.eyes, d.hair, d.blush, 'happy');
        const faceMat = new THREE.MeshBasicMaterial({ map: faceTexOpen, transparent: true, depthWrite: false });
        const face = new THREE.Mesh(new THREE.SphereGeometry(0.1445, 28, 20, Math.PI / 2 - 0.72, 1.44, Math.PI / 2 - 0.46, 0.96), faceMat);
        face.scale.set(0.99, 1.03, 0.96);
        face.position.y = 0.132;
        face.userData.noHit = true;
        head.add(face);
        P.faceMat = faceMat;
        P.faces = { open: faceTexOpen, blink: faceTexBlink, happy: faceTexHappy };

        // --- LAYERED ANIME HAIR WITH CURVED BANGS & SPRING-CHAIN TAILS ---
        const hairCap = new THREE.Mesh(
            new THREE.SphereGeometry(d.style === 'bob' ? 0.162 : 0.155, 28, 18, 0, TAU, 0, Math.PI * (d.style === 'bob' ? 0.70 : 0.58)),
            hairM
        );
        hairCap.position.set(0, 0.158, -0.012);
        hairCap.rotation.x = -0.34;
        hairCap.scale.set(1.04, 1.04, 1.02);
        head.add(hairCap);

        // Sweeping curved anime bangs (7 layered curved ribbons instead of cones)
        for (let i = 0; i < 7; i++) {
            const u = (i - 3) / 3;
            const bang = new THREE.Mesh(G.bangCurve, hairM);
            bang.position.set(u * 0.105, 0.268 - Math.abs(u) * 0.015, 0.115 - Math.abs(u) * 0.025);
            bang.rotation.set(-0.08, u * 0.35, u * 0.16);
            bang.scale.set(0.85 + (1 - Math.abs(u)) * 0.35, 0.85 + (i % 2) * 0.18, 1);
            head.add(bang);
        }

        // Face-framing sidelocks with gentle spring sway
        for (const s of [-1, 1]) {
            const lockPiv = new THREE.Group();
            lockPiv.position.set(s * 0.132, 0.195, 0.048);
            const lk = new THREE.Mesh(G.hairTip, hairM);
            lk.scale.set(0.72, d.style === 'bob' ? 1.15 : 1.45, 0.65);
            lockPiv.add(lk);
            head.add(lockPiv);
            P.sway.push({ obj: lockPiv, kind: 'sidelock', mirror: s });
        }

        // Multi-segment spring-chain hair builder
        const hangChain = (x, y, z, scaleXZ, segs, kind, mirror) => {
            const pivot = new THREE.Group();
            pivot.position.set(x, y, z);
            let parent = pivot;
            for (let i = 0; i < segs; i++) {
                const seg = new THREE.Group();
                const isLast = i === segs - 1;
                const m = new THREE.Mesh(isLast ? G.hairTip : G.hairSeg, hairM);
                const tap = 1 - i * 0.12;
                m.scale.set(scaleXZ * tap, 1.0, scaleXZ * tap * 0.85);
                seg.add(m);
                parent.add(seg);
                if (i > 0) seg.position.y = -0.125;
                P.sway.push({ obj: seg, kind, i, mirror, sp: makeSpring(72 - i * 10, 7.5, 0.55) });
                parent = seg;
            }
            head.add(pivot);
            return pivot;
        };

        if (d.style === 'twintails') {
            for (const s of [-1, 1]) {
                hangChain(s * 0.138, 0.215, -0.055, 1.15, 4, 'tail', s);
                const tie = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.011, 8, 16), accM);
                tie.position.set(s * 0.138, 0.215, -0.055);
                tie.rotation.y = s * 0.7;
                head.add(tie);
            }
        } else if (d.style === 'ponytail') {
            hangChain(0, 0.245, -0.142, 1.32, 4, 'tail', 0);
            const tie = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.012, 8, 16), accM);
            tie.position.set(0, 0.245, -0.142);
            tie.rotation.x = 0.5;
            head.add(tie);
        } else if (d.style === 'long') {
            // 3 layered curtains of flowing waist-length hair
            for (const ox of [-0.078, 0, 0.078]) {
                hangChain(ox, 0.175, -0.118 + Math.abs(ox) * 0.22, 1.25, 4, 'long', Math.sign(ox));
            }
        } else if (d.style === 'bun') {
            const bun = new THREE.Mesh(new THREE.SphereGeometry(0.082, 18, 14), hairM);
            bun.position.set(0, 0.305, -0.068);
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.013, 8, 18), accM);
            band.rotation.x = Math.PI / 2 - 0.35;
            band.position.set(0, 0.265, -0.055);
            head.add(bun, band);
            hangChain(0, 0.23, -0.132, 0.72, 2, 'tail', 0);
        } else if (d.style === 'braid') {
            // Sculpted beaded side-braid resting over right shoulder
            const pivot = new THREE.Group();
            pivot.position.set(0.115, 0.08, 0.02);
            let parent = pivot;
            for (let i = 0; i < 6; i++) {
                const seg = new THREE.Group();
                const bead = new THREE.Mesh(new THREE.SphereGeometry(0.034 * (1 - i * 0.08), 12, 10), hairM);
                bead.scale.set(1.1, 1.35, 0.85);
                bead.position.y = -0.032;
                seg.add(bead);
                if (i === 5) {
                    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.007, 6, 12), accM);
                    tie.rotation.x = Math.PI / 2;
                    tie.position.y = -0.06;
                    const tuft = new THREE.Mesh(G.hairTip, hairM);
                    tuft.scale.set(0.65, 0.65, 0.65);
                    tuft.position.y = -0.065;
                    seg.add(tie, tuft);
                }
                parent.add(seg);
                if (i > 0) seg.position.y = -0.064;
                P.sway.push({ obj: seg, kind: 'braid', i, mirror: 1, sp: makeSpring(85 - i * 8, 8, 0.4) });
                parent = seg;
            }
            head.add(pivot);
        }

        // --- BESPOKE HEAD ACCESSORIES ---
        if (d.acc === 'bow') {
            const bow = new THREE.Group();
            for (const s of [-1, 1]) {
                const wing = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.105, 8), accM);
                wing.rotation.z = s * Math.PI / 2;
                wing.scale.set(0.75, 1, 0.42);
                wing.position.x = s * 0.05;
                bow.add(wing);
            }
            bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), accM));
            bow.position.set(0.105, 0.275, 0.018);
            bow.rotation.z = -0.38;
            head.add(bow);
        } else if (d.acc === 'flower') {
            const fl = new THREE.Group();
            for (let i = 0; i < 5; i++) {
                const a = i / 5 * TAU;
                const pet = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), accM);
                pet.scale.set(1.2, 0.72, 0.35);
                pet.position.set(Math.cos(a) * 0.032, Math.sin(a) * 0.032, 0);
                pet.rotation.z = a;
                fl.add(pet);
            }
            fl.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), M(0xfde047, 0.4)));
            fl.position.set(0.142, 0.195, 0.045);
            fl.rotation.y = 1.15;
            head.add(fl);
        } else if (d.acc === 'visor') {
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.156, 0.013, 8, 28), accM);
            band.rotation.x = Math.PI / 2 - 0.24;
            band.position.y = 0.215;
            const brim = new THREE.Mesh(
                new THREE.CylinderGeometry(0.125, 0.125, 0.008, 20, 1, false, -0.88, 1.76),
                M(0x38bdf8, 0.15, { transparent: true, opacity: 0.72, metalness: 0.2 })
            );
            brim.position.set(0, 0.23, 0.135);
            brim.rotation.x = 0.16;
            head.add(band, brim);
        } else if (d.acc === 'shades') {
            const sg = new THREE.Group();
            sg.position.set(0, 0.295, 0.068);
            sg.rotation.x = -0.58;
            for (const s of [-1, 1]) {
                const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.01, 14), M(0x0f172a, 0.1, { metalness: 0.7 }));
                lens.rotation.x = Math.PI / 2;
                lens.scale.set(1.2, 1, 0.85);
                lens.position.x = s * 0.048;
                const frame = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.004, 6, 16), metalM);
                frame.scale.set(1.2, 0.85, 1);
                frame.position.x = s * 0.048;
                sg.add(lens, frame);
            }
            const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.006, 0.006), metalM);
            sg.add(bridge);
            head.add(sg);
        } else if (d.acc === 'hat') {
            // Wide-brim woven sun hat with flowing ribbon tails
            const hatG = new THREE.Group();
            hatG.position.y = 0.278;
            const brimGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.012, 28, 1);
            const bp = brimGeo.attributes.position;
            for (let i = 0; i < bp.count; i++) {
                const x = bp.getX(i), z = bp.getZ(i);
                const r = Math.hypot(x, z);
                if (r > 0.16) bp.setY(i, bp.getY(i) - Math.sin(Math.atan2(z, x) * 3) * 0.018 * (r / 0.34));
            }
            brimGeo.computeVertexNormals();
            const brim = new THREE.Mesh(brimGeo, accM);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.158, 0.105, 22), accM);
            crown.position.y = 0.052;
            const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.160, 0.160, 0.030, 22), suit1);
            ribbon.position.y = 0.018;
            hatG.add(brim, crown, ribbon);
            // Two flowing hat ribbon tails behind
            for (const s of [-1, 1]) {
                const rt = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.24, 0.004), suit1);
                rt.position.set(s * 0.03, -0.10, -0.17);
                rt.rotation.x = 0.35;
                hatG.add(rt);
                P.sway.push({ obj: rt, kind: 'ribbon', mirror: s });
            }
            head.add(hatG);
            P.sway.push({ obj: brim, kind: 'brim' });
        }

        const hit = [];
        // Only primary silhouette meshes cast shadows (huge FPS boost with 12+ runners, zero self-shadow acne on anime skin)
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
            prevY: 0.89, prevVy: 0, prevX: 0, prevVx: 0,
            blinkT: 1.4 + Math.random() * 2.5, blinking: false,
            lastStepSign: 1
        };
    }

    // ------------------------------------------------------------------------
    // Real Physics & Athletic Beach-Run Animation Step
    // ------------------------------------------------------------------------
    function stepSoftPhysics(g, dt, speed, amt, ph, extraImpulseY = 0) {
        const P = g.parts;
        const d = Math.min(Math.max(dt, 0.001), 0.04);

        // Compute real vertical & lateral acceleration of the torso/hips
        const curY = g.root.position.y + P.hips.position.y;
        const curX = g.root.position.x;
        const vy = (curY - g.prevY) / d;
        const vx = (curX - g.prevX) / d;
        const ay = clamp((vy - g.prevVy) / d, -45, 45) + extraImpulseY;
        const ax = clamp((vx - g.prevVx) / d, -25, 25);
        g.prevY = curY; g.prevVy = vy;
        g.prevX = curX; g.prevVx = vx;

        // Torso twist impulse from running stride
        const twistAcc = Math.cos(ph) * 6.5 * amt;

        // Bust 2nd-order spring-damper physics (reacts inversely to torso acceleration)
        for (const br of P.springs.bust) {
            const sideTwist = twistAcc * br.side * 0.45;
            stepSpring(br.sp, -ax * 0.06 + sideTwist * 0.08, -ay * 0.095, -Math.abs(ay) * 0.025 + sideTwist * 0.05, d);
            br.obj.position.set(
                br.base.x + br.sp.x,
                br.base.y + br.sp.y,
                br.base.z + br.sp.z
            );
            // Subtle natural pitch/roll tilt of soft tissue with bounce
            br.obj.rotation.x = -br.sp.y * 12;
            br.obj.rotation.z = br.sp.x * 8;
        }

        // Glute / hip soft-tissue follow-through
        for (const gr of P.springs.glutes) {
            stepSpring(gr.sp, -ax * 0.04, -ay * 0.065, -Math.abs(ay) * 0.018, d);
            gr.obj.position.set(gr.base.x + gr.sp.x, gr.base.y + gr.sp.y, gr.base.z + gr.sp.z);
        }

        // Spring-chain hair, ribbons, skirt & sarong cloth dynamics
        for (const sw of P.sway) {
            const o = sw.obj;
            if (sw.kind === 'tail' || sw.kind === 'braid' || sw.kind === 'long') {
                const lag = (sw.i || 0) * 0.55;
                const drag = (sw.i === 0 ? 0.24 + speed * 0.055 : 0.11) * amt;
                if (sw.sp) {
                    const targetX = drag + Math.sin(ph * 2 - 0.6 - lag) * 0.15 * amt - ay * 0.012;
                    const targetZ = Math.sin(ph - 0.4 - lag) * 0.18 * (sw.mirror || 1) * amt - ax * 0.015;
                    stepSpring(sw.sp, (targetX - sw.sp.x) * 40, 0, (targetZ - sw.sp.z) * 40, d);
                    o.rotation.x = clamp(sw.sp.x, -0.35, 1.1);
                    o.rotation.z = clamp(sw.sp.z, -0.65, 0.65);
                } else {
                    o.rotation.x = drag + Math.sin(ph * 2 - 0.7 - lag) * 0.14 * amt;
                    o.rotation.z = Math.sin(ph - 0.5 - lag) * 0.16 * (sw.mirror || 1);
                }
            } else if (sw.kind === 'sidelock') {
                o.rotation.x = 0.08 * amt + Math.sin(ph * 2 - 0.4) * 0.07 * amt;
                o.rotation.z = sw.mirror * (0.06 + Math.abs(Math.sin(ph)) * 0.08 * amt);
            } else if (sw.kind === 'skirt' || sw.kind === 'sarong') {
                o.rotation.x = (0.08 + speed * 0.018) * amt + Math.sin(ph * 2 - 0.3) * 0.09 * amt;
                o.rotation.z = Math.sin(ph - 0.2) * 0.07 * amt;
                const flare = 1 + (0.04 + Math.sin(ph * 2) * 0.04) * amt;
                o.scale.set(flare, 1, flare);
            } else if (sw.kind === 'ribbon') {
                o.rotation.x = 0.35 + speed * 0.06 * amt + Math.sin(ph * 2.2) * 0.18 * amt;
                o.rotation.z = Math.sin(ph + (sw.mirror || 1)) * 0.14 * amt;
            } else if (sw.kind === 'brim') {
                o.rotation.x = Math.sin(ph * 2) * 0.055 * amt;
            }
        }
    }

    function updateGirl(g, S, dt, ph, amt, speed, allowBlink = true) {
        const P = g.parts;
        const s = Math.sin(ph);
        const c = Math.cos(ph);

        // Athletic feminine beach jog with knee drive, ankle push-off, hip sway & counter-rotation
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

        P.hips.position.y = 0.89 + Math.abs(c) * 0.058 * amt;
        P.hips.rotation.set(0, s * 0.11 * amt, -s * 0.065 * amt);
        P.chest.rotation.set(0.11 * amt, -s * 0.19 * amt, s * 0.05 * amt);
        P.head.rotation.set(-0.08 * amt, s * 0.09 * amt, -s * 0.03 * amt);

        // Real 2nd-order soft-tissue, hair & cloth physics
        stepSoftPhysics(g, dt, speed, amt, ph);

        // Footstep sand kick puff on stride zero-crossing
        if (S && amt > 0.7 && speed > 1.5) {
            const sign = s >= 0 ? 1 : -1;
            if (sign !== g.lastStepSign) {
                g.lastStepSign = sign;
                sandPuff(S, g.root.position);
            }
        }

        // Natural blinking while running
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
        const P = g.parts;
        const r = g.root;
        P.faceMat.map = P.faces.happy;
        P.faceMat.needsUpdate = true;
        for (const m of g.mats) { m.emissive.setHex(0xff5fa8); m.emissiveIntensity = 0.0; }
        giggleSound(pitch);
        const headPos = new THREE.Vector3();
        P.head.getWorldPosition(headPos);
        heartBurst(S, headPos.add(V(0, 0.25, 0)), 10);
        const y0 = r.position.y;
        const side = r.position.x >= 0 ? 1 : -1;
        let t = 0, hearts = 0;
        S.animate((dt) => {
            t += dt;
            const glow = t < 0.25 ? t / 0.25 : Math.max(0, 1 - (t - 0.25) / 2.2);
            for (const m of g.mats) m.emissiveIntensity = 0.45 * glow + Math.max(0, Math.sin(t * 14)) * 0.1 * glow;
            if (t < 1.7) {
                const hop = t < 0.55 ? Math.sin(t / 0.55 * Math.PI) * 0.36 : Math.abs(Math.sin(t * 9)) * 0.035;
                r.position.y = y0 + hop;
                P.thighL.rotation.x = lerp(P.thighL.rotation.x, t < 0.55 ? -0.35 : 0, 0.2);
                P.thighR.rotation.x = lerp(P.thighR.rotation.x, t < 0.55 ? 0.18 : 0, 0.2);
                P.kneeL.rotation.x = lerp(P.kneeL.rotation.x, t < 0.55 ? 1.05 : 0.05, 0.2);
                P.kneeR.rotation.x = lerp(P.kneeR.rotation.x, 0.05, 0.2);
                P.shL.rotation.set(-2.15, 0, 0.52);
                P.shR.rotation.set(-2.15, 0, -0.52);
                P.elL.rotation.set(-1.5, 0, 0);
                P.elR.rotation.set(-1.5, 0, 0);
                P.chest.rotation.set(-0.05, Math.sin(t * 22) * 0.08, Math.sin(t * 15) * 0.06);
                P.head.rotation.set(0.05, 0, 0.22 + Math.sin(t * 11) * 0.07);
                P.hips.position.y = 0.89;
                stepSoftPhysics(g, dt, 0.6, 0.7, t * 10, t < 0.12 ? 18 : 0);
                if (t > 0.5 && hearts < 3 && t > 0.5 + hearts * 0.35) {
                    hearts++;
                    const hp = new THREE.Vector3();
                    P.head.getWorldPosition(hp);
                    heartBurst(S, hp.add(V(0, 0.35, 0)), 3);
                }
            } else if (t < 3.4) {
                const k = t - 1.7;
                r.rotation.y = lerp(r.rotation.y, side * 1.3, Math.min(1, dt * 4));
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
