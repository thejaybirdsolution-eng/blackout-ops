/* ============================================================================
   BLACKOUT OPS — Sweetheart Shore 2026 AAA Skinned Character & Soft-Engine Kit
   - True 25-bone THREE.Skeleton + unified THREE.SkinnedMesh human manifold:
     breasts, cleavage, ribcage, hourglass waist, navel, hips, glutes, thighs,
     knees, calves, ankles, shoulders, elbows & wrists sculpted into ONE
     continuous skinned surface (ZERO ball-joint seams, 1 body draw call!)
   - Dedicated bodyfat/soft-tissue jiggle bones (breastL, breastR, bellySoft,
     gluteL, gluteR, thighSoftL, thighSoftR) deforming skin & fitted couture
     swimwear together on the GPU with zero cloth clipping
   - LinearEncoding tangent-space normal maps + PMREM IBL + custom GLSL
     Subsurface Scattering (Soft-Engine warm peach wrap-lighting & sun sheen) shader
   - Ultra-crisp 512x512 jewel anime eye textures with multi-tier starlight irises,
     glossy 3D cornea lenses, Cupid's-bow lips, and emotive expressions
   - High-fashion couture fabric shaders (gingham, hibiscus, nautical, polka,
     stripe, ombre, shell, mesh, gamer-hearts, lifeguard-crests)
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const L = BO.MinigameLib;
    const { TAU } = L;
    const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
    const lerp = (a, b, t) => a + (b - a) * t;

    function hexStr(n) { return '#' + (n >>> 0).toString(16).padStart(6, '0'); }
    function shadeHex(hex, amt) {
        const r = clamp(((hex >> 16) & 255) + amt, 0, 255);
        const g = clamp(((hex >> 8) & 255) + amt, 0, 255);
        const b = clamp((hex & 255) + amt, 0, 255);
        return `rgb(${r},${g},${b})`;
    }
    function smoothstep(e0, e1, x) {
        const t = clamp((x - e0) / (e1 - e0), 0, 1);
        return t * t * (3 - 2 * t);
    }
    function gauss(x, mu, sig) {
        const d = (x - mu) / sig;
        return Math.exp(-0.5 * d * d);
    }
    // C2-continuous spherical dome: zero slope at r=0 (perfectly round, never pointy) and smooth blend to 0 at r=1
    function roundDome(r) {
        if (r >= 1.0) return 0.0;
        const sphere = Math.sqrt(Math.max(0.0, 1.0 - r * r));
        return sphere * smoothstep(1.0, 0.68, r);
    }

    // Linear-space canvas texture helper (CRITICAL for normal maps so Three.js
    // does NOT gamma-decode 0.5 -> 0.215 and bend normals 45 degrees backward!)
    const linTexCache = new Map();
    function linearCanvasTex(key, w, h, draw) {
        if (linTexCache.has(key)) return linTexCache.get(key);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        draw(c.getContext('2d'), w, h);
        const t = new THREE.CanvasTexture(c);
        if (THREE.LinearEncoding) t.encoding = THREE.LinearEncoding;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        linTexCache.set(key, t);
        return t;
    }

    // ------------------------------------------------------------------------
    // Procedural Studio-Tropical PMREM Environment Map (Real AAA IBL Specular)
    // ------------------------------------------------------------------------
    let cachedEnvMap = null;
    function getEnvMap() {
        if (cachedEnvMap) return cachedEnvMap;
        try {
            const renderer = BO.App && BO.App.renderer;
            if (!renderer || !THREE.PMREMGenerator) return null;
            const pmrem = new THREE.PMREMGenerator(renderer);
            pmrem.compileEquirectangularShader();
            const envTex = L.canvasTex('aaa26-beach-env-v3', 256, 128, (g, w, h) => {
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0.0, '#0c4a6e');
                gr.addColorStop(0.36, '#38bdf8');
                gr.addColorStop(0.50, '#fffbeb');
                gr.addColorStop(0.58, '#d6a46c');
                gr.addColorStop(1.0, '#784e28');
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
                // Crisp key-sun specular highlight (front-right)
                const sun = g.createRadialGradient(w * 0.35, h * 0.22, 2, w * 0.35, h * 0.22, 28);
                sun.addColorStop(0, '#ffffff');
                sun.addColorStop(0.35, '#fef08a');
                sun.addColorStop(0.7, '#f59e0b');
                sun.addColorStop(1, 'rgba(255,245,210,0)');
                g.fillStyle = sun; g.fillRect(0, 0, w, h);
                // Turquoise ocean rim reflection (back)
                const rim = g.createRadialGradient(w * 0.82, h * 0.42, 4, w * 0.82, h * 0.42, 42);
                rim.addColorStop(0, 'rgba(103, 232, 249, 0.85)');
                rim.addColorStop(0.5, 'rgba(6, 182, 212, 0.45)');
                rim.addColorStop(1, 'rgba(103, 232, 249, 0)');
                g.fillStyle = rim; g.fillRect(0, 0, w, h);
            });
            envTex.mapping = THREE.EquirectangularReflectionMapping;
            cachedEnvMap = pmrem.fromEquirectangular(envTex).texture;
            pmrem.dispose();
        } catch (e) {
            cachedEnvMap = null;
        }
        return cachedEnvMap;
    }

    // ------------------------------------------------------------------------
    // 25-Bone Humanoid + Bodyfat/Soft-Tissue Skeleton Indices & Bind Pose
    // ------------------------------------------------------------------------
    const BONE = {
        ROOT: 0, HIPS: 1, SPINE: 2, CHEST: 3, NECK: 4, HEAD: 5,
        BREAST_L: 6, BREAST_R: 7, BELLY: 8, GLUTE_L: 9, GLUTE_R: 10,
        THIGH_L: 11, THIGH_SOFT_L: 12, SHIN_L: 13, FOOT_L: 14,
        THIGH_R: 15, THIGH_SOFT_R: 16, SHIN_R: 17, FOOT_R: 18,
        SH_L: 19, EL_L: 20, WR_L: 21,
        SH_R: 22, EL_R: 23, WR_R: 24
    };

    function createSkeleton() {
        const B = [];
        const mk = (id, name, parent, x, y, z) => {
            const b = new THREE.Bone();
            b.name = name;
            b.position.set(x, y, z);
            B[id] = b;
            if (parent >= 0) B[parent].add(b);
            return b;
        };
        mk(BONE.ROOT, 'root', -1, 0, 0, 0);
        mk(BONE.HIPS, 'hips', BONE.ROOT, 0, 0.94, 0);
        mk(BONE.SPINE, 'spine', BONE.HIPS, 0, 0.13, 0);
        mk(BONE.CHEST, 'chest', BONE.SPINE, 0, 0.16, 0);        // world y = 1.23
        mk(BONE.NECK, 'neck', BONE.CHEST, 0, 0.21, -0.008);     // world y = 1.44
        mk(BONE.HEAD, 'head', BONE.NECK, 0, 0.095, 0.006);      // world y = 1.535

        // Soft-tissue / bodyfat jiggle bones
        mk(BONE.BREAST_L, 'breastL', BONE.CHEST, 0.076, 0.045, 0.085);
        mk(BONE.BREAST_R, 'breastR', BONE.CHEST, -0.076, 0.045, 0.085);
        mk(BONE.BELLY, 'bellySoft', BONE.SPINE, 0, -0.02, 0.075);
        mk(BONE.GLUTE_L, 'gluteL', BONE.HIPS, 0.075, -0.035, -0.075);
        mk(BONE.GLUTE_R, 'gluteR', BONE.HIPS, -0.075, -0.035, -0.075);

        // Legs (seamless hip -> thigh -> knee -> calf -> ankle)
        mk(BONE.THIGH_L, 'thighL', BONE.HIPS, 0.092, -0.02, 0);      // world y = 0.92
        mk(BONE.THIGH_SOFT_L, 'thighSoftL', BONE.THIGH_L, 0, -0.11, -0.015);
        mk(BONE.SHIN_L, 'shinL', BONE.THIGH_L, 0, -0.43, 0);         // world y = 0.49
        mk(BONE.FOOT_L, 'footL', BONE.SHIN_L, 0, -0.43, 0);          // world y = 0.06

        mk(BONE.THIGH_R, 'thighR', BONE.HIPS, -0.092, -0.02, 0);
        mk(BONE.THIGH_SOFT_R, 'thighSoftR', BONE.THIGH_R, 0, -0.11, -0.015);
        mk(BONE.SHIN_R, 'shinR', BONE.THIGH_R, 0, -0.43, 0);
        mk(BONE.FOOT_R, 'footR', BONE.SHIN_R, 0, -0.43, 0);

        // Arms (vertical bind pose along ±0.162 so rotations match run cycle cleanly)
        mk(BONE.SH_L, 'shL', BONE.CHEST, 0.152, 0.155, -0.006);      // world y = 1.385
        mk(BONE.EL_L, 'elL', BONE.SH_L, 0.018, -0.265, 0);           // world y = 1.120
        mk(BONE.WR_L, 'wrL', BONE.EL_L, 0.012, -0.240, 0.012);       // world y = 0.880

        mk(BONE.SH_R, 'shR', BONE.CHEST, -0.152, 0.155, -0.006);
        mk(BONE.EL_R, 'elR', BONE.SH_R, -0.018, -0.265, 0);
        mk(BONE.WR_R, 'wrR', BONE.EL_R, -0.012, -0.240, 0.012);

        return B;
    }

    // Normalize 4-bone skin weights
    function normW(i0, w0, i1 = 0, w1 = 0, i2 = 0, w2 = 0, i3 = 0, w3 = 0) {
        const s = (w0 + w1 + w2 + w3) || 1;
        return [[i0, i1, i2, i3], [w0 / s, w1 / s, w2 / s, w3 / s]];
    }

    // ------------------------------------------------------------------------
    // Unified Parametric Human Torso+Breasts+Glutes Evaluator (World Bind Space)
    // v in [0, 1] maps y from 0.825 (groin/sub-gluteal fold) -> 1.545 (upper neck)
    // Breasts, cleavage, ribcage, waist, navel, hips & glutes are ONE seamless surface!
    // ------------------------------------------------------------------------
    function evalUnifiedTorso(v, th, morph, offset = 0) {
        const bustSc = morph.bust || 1.12;
        const hipSc = morph.hip || 1.08;
        const waistSc = morph.waist || 0.96;

        const y = lerp(0.825, 1.545, v);
        const sinT = Math.sin(th); // +X = left, -X = right
        const cosT = Math.cos(th); // +Z = front, -Z = back
        const front = Math.max(0, cosT);
        const back = Math.max(0, -cosT);
        const side = Math.abs(sinT);

        // Base feminine silhouette widths (rx) and depths (rz)
        let rx = lerp(0.062, 0.168 * hipSc, smoothstep(0.0, 0.16, v));      // groin -> lush hip curve
        rx = lerp(rx, 0.090 * waistSc, smoothstep(0.18, 0.40, v));          // narrow sculpted hourglass waist (y ~ 1.11)
        rx = lerp(rx, 0.130, smoothstep(0.43, 0.66, v));                    // toned ribcage
        rx = lerp(rx, 0.152, smoothstep(0.67, 0.78, v));                    // shoulder/clavicle span (y ~ 1.385)
        rx = lerp(rx, 0.039, smoothstep(0.79, 0.90, v));                    // trapezius slope -> slender neck

        let rz = lerp(0.056, 0.114 * hipSc, smoothstep(0.0, 0.16, v));
        rz = lerp(rz, 0.074 * waistSc, smoothstep(0.18, 0.40, v));
        rz = lerp(rz, 0.098, smoothstep(0.43, 0.66, v));
        rz = lerp(rz, 0.082, smoothstep(0.67, 0.78, v));
        rz = lerp(rz, 0.039, smoothstep(0.79, 0.90, v));

        // S-curve lumbar lordosis (feminine lower-back arch)
        const spineZ = 0.022 * gauss(v, 0.37, 0.14) - 0.014 * gauss(v, 0.68, 0.15) - 0.008 * smoothstep(0.80, 0.95, v);

        // Integrated 3D Sculpted Plush Spherical Glute Lobes + Natural Medial Cleft!
        const gThL = Math.atan2(Math.sin(th - (Math.PI - 0.48)), Math.cos(th - (Math.PI - 0.48)));
        const gThR = Math.atan2(Math.sin(th - (Math.PI + 0.48)), Math.cos(th - (Math.PI + 0.48)));
        const gRadL = Math.hypot(gThL / 0.56, (v - 0.125) / 0.125);
        const gRadR = Math.hypot(gThR / 0.56, (v - 0.125) / 0.125);
        const gDomeL = roundDome(gRadL);
        const gDomeR = roundDome(gRadR);
        const gluteOut = 0.060 * hipSc * (gDomeL + gDomeR);
        const gluteCleft = -0.016 * gauss(th, Math.PI, 0.16) * gauss(v, 0.12, 0.085);

        // Integrated 3D Sculpted Spherical-Dome Breasts + Soft Cleavage Valley (Zero Pointy Tips!)
        const dThL = Math.atan2(Math.sin(th - 0.48), Math.cos(th - 0.48));
        const dThR = Math.atan2(Math.sin(th + 0.48), Math.cos(th + 0.48));
        const bRadL = Math.hypot(dThL / 0.54, (v - 0.602) / 0.122);
        const bRadR = Math.hypot(dThR / 0.54, (v - 0.602) / 0.122);
        const lobeL = roundDome(bRadL);
        const lobeR = roundDome(bRadR);
        const fullness = 1.0 + 0.12 * Math.tanh((0.60 - v) * 10.0);
        const breastProj = 0.082 * bustSc * (lobeL + lobeR) * fullness;
        const breastDropY = -0.016 * bustSc * (lobeL + lobeR);
        const breastSpreadX = 0.015 * bustSc * (lobeL - lobeR);

        // Crisp sternum cleavage valley between breasts + spinal furrow + athletic abs + navel + clavicles
        const sternumValley = -0.010 * Math.pow(front, 12) * gauss(v, 0.59, 0.08);
        const spineFurrow = -0.012 * Math.pow(back, 6) * smoothstep(0.18, 0.28, v) * (1 - smoothstep(0.74, 0.84, v));
        const lineaAlba = -0.005 * Math.pow(front, 8) * gauss(v, 0.40, 0.11);
        const navel = -0.008 * Math.pow(front, 24) * gauss(v, 0.305, 0.018);
        const softTummy = 0.012 * Math.pow(front, 2.4) * gauss(v, 0.25, 0.075);
        const clavicle = 0.009 * front * Math.pow(side, 1.3) * gauss(v, 0.775, 0.022);

        const x = (rx + offset + gluteOut * 0.28) * sinT + breastSpreadX;
        const z = (rz + offset + spineFurrow + lineaAlba + navel + softTummy + sternumValley + clavicle) * cosT
                + spineZ + breastProj - gluteOut - gluteCleft;

        // Compute smooth 4-bone skin weights including soft-tissue jiggle bones!
        let wHips = 1 - smoothstep(0.16, 0.34, v);
        let wSpine = smoothstep(0.16, 0.34, v) * (1 - smoothstep(0.40, 0.54, v));
        let wChest = smoothstep(0.40, 0.54, v) * (1 - smoothstep(0.77, 0.84, v));
        let wNeck = smoothstep(0.77, 0.84, v);

        const wBL = clamp(lobeL * 0.88, 0, 0.88);
        const wBR = clamp(lobeR * 0.88, 0, 0.88);
        const wGL = clamp(gDomeL * 0.85, 0, 0.85);
        const wGR = clamp(gDomeR * 0.85, 0, 0.85);
        const wBelly = clamp(Math.pow(front, 2.5) * gauss(v, 0.25, 0.07) * 0.65, 0, 0.65);

        let skin;
        if (wBL > 0.02 || wBR > 0.02) {
            const bId = wBL >= wBR ? BONE.BREAST_L : BONE.BREAST_R;
            const bw = Math.max(wBL, wBR);
            skin = normW(bId, bw, BONE.CHEST, (1 - bw) * 0.85, BONE.SPINE, (1 - bw) * 0.15, 0, 0);
        } else if (wGL > 0.02 || wGR > 0.02) {
            const gId = wGL >= wGR ? BONE.GLUTE_L : BONE.GLUTE_R;
            const gw = Math.max(wGL, wGR);
            skin = normW(gId, gw, BONE.HIPS, 1 - gw, 0, 0, 0, 0);
        } else if (wBelly > 0.03) {
            skin = normW(BONE.BELLY, wBelly, BONE.SPINE, (1 - wBelly) * 0.6, BONE.HIPS, (1 - wBelly) * 0.4, 0, 0);
        } else {
            skin = normW(BONE.HIPS, wHips, BONE.SPINE, wSpine, BONE.CHEST, wChest, BONE.NECK, wNeck);
        }

        return { p: [x, y + breastDropY, z], skin, lobeL, lobeR, v, th };
    }

    // ------------------------------------------------------------------------
    // Build Complete Unified Skinned Body Geometry (Torso + Legs + Arms = 1 Mesh!)
    // ------------------------------------------------------------------------
    const bodyGeoCache = new Map();

    function appendTubePart(out, slices, segs, evalFn) {
        const baseV = out.pos.length / 3;
        const cols = segs + 1;
        for (let iy = 0; iy <= slices; iy++) {
            const v = iy / slices;
            for (let ix = 0; ix <= segs; ix++) {
                const u = ix / segs;
                const r = evalFn(v, u * TAU, u);
                out.pos.push(r.p[0], r.p[1], r.p[2]);
                out.uv.push(r.uv ? r.uv[0] : u, r.uv ? r.uv[1] : v);
                out.si.push(r.skin[0][0], r.skin[0][1], r.skin[0][2], r.skin[0][3]);
                out.sw.push(r.skin[1][0], r.skin[1][1], r.skin[1][2], r.skin[1][3]);
            }
        }
        for (let iy = 0; iy < slices; iy++) {
            for (let ix = 0; ix < segs; ix++) {
                const a = baseV + iy * cols + ix;
                const b = a + 1;
                const c = a + cols;
                const d = c + 1;
                out.idx.push(a, c, b, b, c, d);
            }
        }
    }

    function finalizeSkinnedGeo(out) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(out.uv, 2));
        geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(out.si, 4));
        geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(out.sw, 4));
        geo.setIndex(out.idx);
        geo.computeVertexNormals();
        return geo;
    }

    function getSkinnedBodyGeo(morph) {
        const key = `${morph.bust}:${morph.hip}:${morph.waist}:${morph.thigh}`;
        if (bodyGeoCache.has(key)) return bodyGeoCache.get(key).clone();

        const out = { pos: [], uv: [], si: [], sw: [], idx: [] };
        const hipSc = morph.hip || 1.08;
        const thighSc = morph.thigh || 1.04;

        // 1. Unified Torso + Breasts + Pelvis + Glutes + Neck (72 slices x 64 segs for silky-round curves)
        appendTubePart(out, 72, 64, (v, th, u) => {
            const r = evalUnifiedTorso(v, th, morph, 0);
            r.uv = [u, v];
            return r;
        });

        // 2. Seamless Left & Right Sculpted Legs (Hip -> Thigh -> Knee -> Calf -> Ankle, 44 x 32)
        for (const s of [1, -1]) {
            const bThigh = s > 0 ? BONE.THIGH_L : BONE.THIGH_R;
            const bSoft = s > 0 ? BONE.THIGH_SOFT_L : BONE.THIGH_SOFT_R;
            const bShin = s > 0 ? BONE.SHIN_L : BONE.SHIN_R;
            const bFoot = s > 0 ? BONE.FOOT_L : BONE.FOOT_R;
            const bGlute = s > 0 ? BONE.GLUTE_L : BONE.GLUTE_R;
            const cx = s * 0.092 * hipSc;

            appendTubePart(out, 44, 32, (v, th, u) => {
                const y = lerp(0.935, 0.055, v);
                const sinT = Math.sin(th), cosT = Math.cos(th);
                const front = Math.max(0, cosT), back = Math.max(0, -cosT);
                const inner = s > 0 ? Math.max(0, -sinT) : Math.max(0, sinT);

                let rad;
                if (v < 0.50) {
                    const tv = v / 0.50;
                    rad = lerp(0.098 * thighSc, 0.049, Math.pow(tv, 0.82));
                    rad += 0.013 * thighSc * front * gauss(tv, 0.38, 0.24);
                    rad += 0.012 * thighSc * back * gauss(tv, 0.25, 0.24);
                    rad += 0.008 * thighSc * inner * gauss(tv, 0.20, 0.18);
                } else {
                    const cv = (v - 0.50) / 0.50;
                    rad = lerp(0.049, 0.030, smoothstep(0.0, 0.92, cv));
                    rad += 0.005 * front * gauss(cv, 0.04, 0.08);
                    rad += 0.019 * (0.42 + 0.58 * back) * gauss(cv, 0.28, 0.16);
                    rad += 0.004 * Math.abs(sinT) * gauss(cv, 0.94, 0.05);
                }

                const zShift = v > 0.50 ? -0.006 * gauss((v - 0.50) / 0.50, 0.28, 0.18) : 0;
                const x = cx + rad * sinT * 0.97;
                const z = rad * cosT + zShift;

                let skin;
                if (v < 0.10) {
                    const tHip = 1 - v / 0.10;
                    const glW = tHip * back * 0.55;
                    skin = normW(BONE.HIPS, tHip - glW, bGlute, glW, bThigh, 1 - tHip, 0, 0);
                } else if (v < 0.36) {
                    const softW = (back * 0.5 + inner * 0.5) * gauss(v, 0.18, 0.08) * 0.65;
                    skin = normW(bThigh, 1 - softW, bSoft, softW, 0, 0, 0, 0);
                } else if (v < 0.60) {
                    const kBlend = smoothstep(0.43, 0.56, v);
                    skin = normW(bThigh, 1 - kBlend, bShin, kBlend, 0, 0, 0, 0);
                } else {
                    const aBlend = smoothstep(0.92, 1.0, v);
                    skin = normW(bShin, 1 - aBlend, bFoot, aBlend, 0, 0, 0, 0);
                }
                return { p: [x, y, z], uv: [u, 1 - v * 0.6], skin };
            });
        }

        // 3. Seamless Left & Right Sculpted Arms (Shoulder -> Bicep -> Elbow -> Forearm -> Wrist, 28 x 22)
        for (const s of [1, -1]) {
            const bSh = s > 0 ? BONE.SH_L : BONE.SH_R;
            const bEl = s > 0 ? BONE.EL_L : BONE.EL_R;
            const bWr = s > 0 ? BONE.WR_L : BONE.WR_R;

            appendTubePart(out, 28, 22, (v, th, u) => {
                let cx, cy, cz, rad;
                if (v < 0.52) {
                    const t = v / 0.52;
                    cx = lerp(0.146 * s, 0.170 * s, t);
                    cy = lerp(1.395, 1.120, t);
                    cz = -0.006;
                    rad = lerp(0.045, 0.031, t) + 0.007 * gauss(t, 0.16, 0.14);
                } else {
                    const t = (v - 0.52) / 0.48;
                    cx = lerp(0.170 * s, 0.182 * s, t);
                    cy = lerp(1.120, 0.880, t);
                    cz = lerp(-0.006, 0.006, t);
                    rad = lerp(0.033, 0.020, Math.pow(t, 0.88)) + 0.004 * gauss(t, 0.24, 0.18);
                }
                const x = cx + rad * Math.sin(th);
                const z = cz + rad * Math.cos(th) * 0.94;
                let skin;
                if (v < 0.12) {
                    const cW = (1 - v / 0.12) * 0.75;
                    skin = normW(BONE.CHEST, cW, bSh, 1 - cW, 0, 0, 0, 0);
                } else if (v < 0.62) {
                    const eW = smoothstep(0.44, 0.59, v);
                    skin = normW(bSh, 1 - eW, bEl, eW, 0, 0, 0, 0);
                } else {
                    const wW = smoothstep(0.90, 1.0, v);
                    skin = normW(bEl, 1 - wW, bWr, wW, 0, 0, 0, 0);
                }
                return { p: [x, cy, z], uv: [u, 0.85 - v * 0.4], skin };
            });
        }

        const geo = finalizeSkinnedGeo(out);
        bodyGeoCache.set(key, geo);
        return geo.clone();
    }

    // ------------------------------------------------------------------------
    // Unified Skinned Couture Swimsuit Builder (Bound to Exact Same 25-Bone Skeleton!)
    // ------------------------------------------------------------------------
    const suitGeoCache = new Map();

    function getSkinnedSuitGeo(style, morph) {
        const key = `${style}:${morph.bust}:${morph.hip}:${morph.waist}`;
        if (suitGeoCache.has(key)) return suitGeoCache.get(key).clone();

        const out = { pos: [], uv: [], si: [], sw: [], idx: [] };

        const addBand = (v0, v1, slices, segs, shapeFn) => {
            const baseV = out.pos.length / 3;
            const cols = segs + 1;
            const keep = [];
            for (let iy = 0; iy <= slices; iy++) {
                const tv = iy / slices;
                const v = lerp(v0, v1, tv);
                for (let ix = 0; ix <= segs; ix++) {
                    const u = ix / segs;
                    const th = u * TAU;
                    const sh = shapeFn(v, th, tv);
                    const r = evalUnifiedTorso(sh.v, th, morph, sh.off ?? 0.0038);
                    out.pos.push(r.p[0], r.p[1], r.p[2]);
                    out.uv.push(u * 2, tv);
                    out.si.push(r.skin[0][0], r.skin[0][1], r.skin[0][2], r.skin[0][3]);
                    out.sw.push(r.skin[1][0], r.skin[1][1], r.skin[1][2], r.skin[1][3]);
                    keep.push(sh.inside !== false);
                }
            }
            for (let iy = 0; iy < slices; iy++) {
                for (let ix = 0; ix < segs; ix++) {
                    const a = baseV + iy * cols + ix;
                    const b = a + 1, c = a + cols, d = c + 1;
                    if (keep[a - baseV] || keep[b - baseV] || keep[c - baseV] || keep[d - baseV]) {
                        out.idx.push(a, c, b, b, c, d);
                    }
                }
            }
        };

        // 1. Sculpted High-Leg V-Cut Bikini / Swimsuit Bottoms (all styles)
        addBand(0.01, 0.23, 20, 64, (v, th, tv) => {
            const cosT = Math.cos(th), side = Math.abs(Math.sin(th));
            const highLeg = 0.065 * Math.pow(side, 1.6);
            const vDipFront = -0.028 * Math.pow(Math.max(0, cosT), 2);
            const vLo = 0.01 + highLeg * (1 - tv);
            const vHi = 0.215 + vDipFront + 0.02 * Math.pow(side, 2);
            return { v: lerp(vLo, vHi, tv), off: 0.0044 };
        });

        // 2. Style-specific Couture Upper Garment
        if (style === 'monokini' || style === 'lifeguard') {
            addBand(0.20, 0.72, 36, 64, (v, th, tv) => {
                const side = Math.abs(Math.sin(th));
                const cosT = Math.cos(th);
                if (style === 'lifeguard') {
                    // One-piece high-neck athletic lifeguard swimsuit
                    const armhole = side > 0.68 && v > 0.58 && v < 0.72;
                    const backDip = cosT < -0.42 && v > 0.66;
                    return { v, off: 0.0046, inside: !(armhole || backDip) };
                }
                const waistCutout = side > 0.48 && v > 0.24 && v < 0.50;
                const plungeCut = cosT > 0.88 && v > 0.56;
                const openBack = cosT < -0.45 && v > 0.44;
                return { v, off: 0.0046, inside: !(waistCutout || plungeCut || openBack) };
            });
        } else if (style === 'sport') {
            addBand(0.49, 0.72, 22, 64, (v, th, tv) => {
                const side = Math.abs(Math.sin(th));
                const armhole = side > 0.74 && v > 0.63;
                return { v, off: 0.0046, inside: !armhole };
            });
        } else if (style === 'bustier' || style === 'frill') {
            addBand(0.50, 0.675, 22, 64, (v, th, tv) => {
                const cosT = Math.cos(th);
                const sweetheart = -0.036 * Math.pow(Math.max(0, cosT), 8) * tv;
                const lowBack = cosT < -0.2 ? -0.045 * tv : 0;
                return { v: v + sweetheart + lowBack, off: 0.0046 };
            });
        } else {
            // Triangle or Shell cups
            addBand(0.515, 0.68, 22, 64, (v, th, tv) => {
                const dL = Math.abs(Math.atan2(Math.sin(th - 0.48), Math.cos(th - 0.48)));
                const dR = Math.abs(Math.atan2(Math.sin(th + 0.48), Math.cos(th + 0.48)));
                const dCup = Math.min(dL, dR);
                const maxW = lerp(0.52, 0.14, Math.pow(tv, 0.82));
                const isUnderStrap = tv < 0.16;
                const scallop = style === 'shell' ? Math.sin(th * 18) * 0.007 * tv : 0;
                return { v: v + scallop, off: 0.0048, inside: (dCup <= maxW || isUnderStrap) };
            });
        }

        const geo = finalizeSkinnedGeo(out);
        suitGeoCache.set(key, geo);
        return geo.clone();
    }

    // ------------------------------------------------------------------------
    // Static Geometries & Detailed 3D Props
    // ------------------------------------------------------------------------
    const GEO = {};

    function sculptStatic(slices, radialSegs, evalPt) {
        const pos = [], uvs = [], idx = [], cols = radialSegs + 1;
        for (let iy = 0; iy <= slices; iy++) {
            const v = iy / slices;
            for (let ix = 0; ix <= radialSegs; ix++) {
                const u = ix / radialSegs;
                const p = evalPt(v, u * TAU);
                pos.push(p[0], p[1], p[2]);
                uvs.push(u, v);
            }
        }
        for (let iy = 0; iy < slices; iy++) {
            for (let ix = 0; ix < radialSegs; ix++) {
                const a = iy * cols + ix, b = a + 1, c = a + cols, d = c + 1;
                idx.push(a, c, b, b, c, d);
            }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        g.setIndex(idx);
        geoCompute(g);
        return g;
    }

    function geoCompute(g) {
        g.computeVertexNormals();
    }

    function getStaticGeos() {
        if (GEO.ready) return GEO;
        GEO.ready = true;

        // 3D Sculpted Anime Head (soft rounded chin, full cheeks, petite rounded nose, plush lips)
        GEO.head = sculptStatic(40, 48, (v, th) => {
            const y = lerp(-0.012, 0.258, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const front = Math.max(0, cosT);
            let rx = 0.114 * Math.pow(Math.sin(clamp(v, 0.001, 0.999) * Math.PI), 0.50);
            if (v < 0.36) rx *= lerp(0.52, 1.0, smoothstep(0.0, 0.36, v));
            const rz = rx * 0.98;
            const cheek = 0.009 * (gauss(th, 0.56, 0.28) + gauss(th, TAU - 0.56, 0.28)) * gauss(v, 0.34, 0.095);
            const noseC = Math.pow(front, 10);
            const noseTip = 0.010 * noseC * gauss(v, 0.355, 0.036);
            const noseBridge = 0.005 * Math.pow(front, 8) * gauss(v, 0.42, 0.055);
            const mouthW = Math.pow(front, 8);
            const upperLip = 0.0055 * mouthW * gauss(v, 0.245, 0.018);
            const lowerLip = 0.0075 * mouthW * gauss(v, 0.215, 0.019);
            const chin = 0.004 * Math.pow(front, 4) * gauss(v, 0.09, 0.052);
            return [(rx + cheek * 0.42) * sinT, y, (rz + cheek + noseTip + noseBridge + upperLip + lowerLip + chin) * cosT];
        });

        // Curved 3D Upper Eyelash Ribbons
        const makeLash = (side) => {
            const pts = [
                new THREE.Vector3(side * 0.018, 0.000, 0.000),
                new THREE.Vector3(side * 0.036, 0.012, 0.004),
                new THREE.Vector3(side * 0.056, 0.010, -0.002),
                new THREE.Vector3(side * 0.072, 0.018, -0.010)
            ];
            const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.0028, 5, false);
            g.scale(1, 0.75, 1.2);
            g.computeVertexNormals();
            return g;
        };
        GEO.lashL = makeLash(1);
        GEO.lashR = makeLash(-1);

        // Silk Bangs & Sidelocks
        const makeSilkRibbon = (len, wBase, curveZ, sweepX) => {
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(sweepX * 0.30, -len * 0.34, curveZ),
                new THREE.Vector3(sweepX * 0.72, -len * 0.70, curveZ * 0.94),
                new THREE.Vector3(sweepX, -len, curveZ * 0.45)
            ];
            const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, wBase, 8, false);
            const p = geo.attributes.position;
            for (let i = 0; i < p.count; i++) {
                const y = p.getY(i);
                const t = clamp(-y / len, 0, 1);
                const wEnv = Math.sin(t * Math.PI * 0.88 + 0.12) * (1 - t * 0.68);
                p.setX(i, p.getX(i) * (0.42 + wEnv * 1.15));
                p.setZ(i, p.getZ(i) * 0.24 + curveZ * Math.sin(t * Math.PI) * 0.65);
            }
            geo.computeVertexNormals();
            return geo;
        };

        GEO.bangWispy = makeSilkRibbon(0.082, 0.017, 0.019, 0.009);
        GEO.bangPartL = makeSilkRibbon(0.126, 0.023, 0.021, -0.048);
        GEO.bangPartR = makeSilkRibbon(0.126, 0.023, 0.021, 0.048);
        GEO.sidelock = makeSilkRibbon(0.235, 0.024, 0.016, 0.018);
        GEO.bobStrand = makeSilkRibbon(0.165, 0.030, 0.018, 0.040);
        GEO.ahoge = makeSilkRibbon(0.068, 0.008, 0.024, 0.036);

        // Sinusoidal Flounce
        GEO.flounce = sculptStatic(10, 36, (v, th) => {
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const y = lerp(0.145, 0.015, v);
            const flare = lerp(0.146, 0.205, Math.pow(v, 0.85));
            const wave = Math.sin(th * 10) * 0.016 * Math.pow(v, 1.3);
            return [(flare + wave) * sinT * 1.08, y + Math.sin(th * 10) * 0.007 * v, (flare * 0.80 + wave) * cosT];
        });

        // Continuous overlapping silk hair ribbon segments (zero bead gaps!)
        GEO.hairSeg = sculptStatic(12, 14, (v, th) => {
            const y = lerp(0.032, -0.145, v);
            const r = 0.048 * (0.88 + 0.12 * Math.sin(v * Math.PI)) * (1 - v * 0.14);
            const waveX = Math.sin(v * Math.PI) * 0.007;
            return [r * Math.sin(th) * 1.24 + waveX, y, r * Math.cos(th) * 0.62];
        });
        GEO.hairTip = sculptStatic(16, 16, (v, th) => {
            const y = lerp(0.030, -0.185, v);
            const r = Math.max(0.006, 0.044 * Math.pow(1 - v * 0.88, 0.52));
            return [r * Math.sin(th) * 1.20 + Math.sin(v * Math.PI) * 0.022, y, r * Math.cos(th) * 0.62];
        });
        GEO.hairDrill = sculptStatic(16, 16, (v, th) => {
            const y = lerp(0.028, -0.170, v);
            const r = 0.041 * (1 - v * 0.35);
            const swirl = v * TAU * 1.5;
            return [r * Math.sin(th) + Math.cos(swirl) * 0.018 * v, y, r * Math.cos(th) + Math.sin(swirl) * 0.018 * v];
        });

        GEO.ear = new THREE.SphereGeometry(0.019, 10, 8); GEO.ear.scale(0.38, 1.22, 0.82);
        GEO.nail = new THREE.SphereGeometry(0.0042, 6, 4); GEO.nail.scale(1.1, 0.45, 1.4);
        GEO.cornea = new THREE.SphereGeometry(0.022, 14, 10, 0, TAU, 0, Math.PI * 0.42);
        GEO.cornea.rotateX(Math.PI / 2);

        // 3D Beach Props Geometries
        GEO.coconutCup = new THREE.SphereGeometry(0.046, 14, 12, 0, TAU, Math.PI * 0.18, Math.PI * 0.82);
        GEO.straw = new THREE.CylinderGeometry(0.004, 0.004, 0.12, 8);
        GEO.umbrellaPaper = new THREE.ConeGeometry(0.048, 0.024, 10, 1, true);

        GEO.swimRing = new THREE.TorusGeometry(0.188, 0.048, 16, 32);
        GEO.swimRing.scale(1.05, 0.88, 1.0);

        GEO.star = new THREE.SphereGeometry(0.012, 12, 10);
        GEO.heartGem = new THREE.SphereGeometry(0.012, 8, 6);
        GEO.heartGem.scale(1.2, 1.2, 0.5);

        return GEO;
    }

    // ------------------------------------------------------------------------
    // Normal Maps & Subsurface Skin Shader
    // ------------------------------------------------------------------------
    function getSkinNormalMap() {
        return linearCanvasTex('aaa26-skin-norm-v3', 256, 256, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let i = 0; i < 2000; i++) {
                const x = (i * 97) % w, y = (i * 53) % h;
                const tone = 125 + (i % 7);
                g.fillStyle = `rgb(${tone},${tone},253)`;
                g.fillRect(x, y, 2, 2);
            }
        });
    }

    function getFabricNormalMap() {
        return linearCanvasTex('aaa26-fab-norm-v3', 128, 128, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
                const odd = ((x + y) >> 2) & 1;
                g.fillStyle = odd ? 'rgb(138,122,248)' : 'rgb(118,134,248)';
                g.fillRect(x, y, 3, 3);
            }
        });
    }

    function getHairNormalMap() {
        return linearCanvasTex('aaa26-hair-norm-v3', 128, 128, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let x = 0; x < w; x += 2) {
                const nx = Math.round(128 + Math.sin(x * 1.1) * 28);
                g.fillStyle = `rgb(${nx},128,246)`;
                g.fillRect(x, 0, 2, h);
            }
        });
    }

    function applySubsurfaceSkinShader(mat, sssHex) {
        const sssCol = new THREE.Color(sssHex);
        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uSSSColor = { value: sssCol };
            shader.fragmentShader = 'uniform vec3 uSSSColor;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `
                vec3 nView = normalize(vNormal);
                vec3 vDir = normalize(vViewPosition);
                float ndv = clamp(dot(nView, vDir), 0.0, 1.0);
                float rim = pow(1.0 - ndv, 3.0);
                float luma = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
                float sssBand = smoothstep(0.05, 0.46, luma) * (1.0 - smoothstep(0.46, 0.88, luma));
                gl_FragColor.rgb += uSSSColor * (sssBand * 0.14 + rim * 0.11) + vec3(1.0, 0.92, 0.84) * pow(rim, 2.0) * 0.05;
                #include <dithering_fragment>
                `
            );
        };
        mat.customProgramCacheKey = () => 'doa-sss-skin-v5';
    }

    function applyHairAnisoShader(mat, hiHex) {
        const hiCol = new THREE.Color(hiHex || '#ffffff');
        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uHairHi = { value: hiCol };
            shader.fragmentShader = 'uniform vec3 uHairHi;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `
                vec3 hN = normalize(vNormal);
                vec3 hV = normalize(vViewPosition);
                vec3 hHalf = normalize(hV + normalize(vec3(0.35, 0.85, 0.55)));
                float anisoShift = hN.y * 0.72 + hHalf.y * 0.28;
                float ring1 = exp(-pow((hN.y - 0.34) * 5.8, 2.0)) * pow(max(dot(hN, hV), 0.0), 0.65);
                float ring2 = exp(-pow((hN.y + 0.18) * 7.2, 2.0)) * 0.55;
                float rimSilk = pow(1.0 - clamp(dot(hN, hV), 0.0, 1.0), 3.2);
                gl_FragColor.rgb += uHairHi * (ring1 * 0.34 + ring2 * 0.18) + uHairHi * rimSilk * 0.16;
                #include <dithering_fragment>
                `
            );
        };
        mat.customProgramCacheKey = () => 'doa-hair-aniso-v4';
    }

    function skinAlbedoTex(skinHex, blushHex) {
        return L.canvasTex('aaa26-skin-v4:' + skinHex + ':' + blushHex, 1024, 1024, (g, w, h) => {
            g.fillStyle = hexStr(skinHex);
            g.fillRect(0, 0, w, h);

            const blush = (x, y, rx, ry, a, col = blushHex) => {
                const rg = g.createRadialGradient(x, y, 6, x, y, rx);
                rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(255,120,110,0)');
                g.globalAlpha = a; g.fillStyle = rg;
                g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
            };

            for (const fx of [0, w]) {
                // Warm sun-kissed chest, bust top & shoulder glow
                blush(fx, h * 0.40, 192, 112, 0.26);
                blush(fx, h * 0.82, 220, 130, 0.16);
                blush(fx, h * 0.33, 140, 48, 0.18, '#fff7ed');
                // Underbust depth
                blush(fx, h * 0.46, 170, 48, 0.28, shadeHex(skinHex, -60));
                // Clavicle highlights & subtle contours
                g.strokeStyle = shadeHex(skinHex, -48);
                g.lineCap = 'round';
                g.globalAlpha = 0.32; g.lineWidth = 10;
                g.beginPath(); g.moveTo(fx - 92, h * 0.22); g.quadraticCurveTo(fx, h * 0.25, fx + 92, h * 0.22); g.stroke();
                g.strokeStyle = 'rgba(255,250,240,0.28)'; g.lineWidth = 6;
                g.beginPath(); g.moveTo(fx - 86, h * 0.215); g.quadraticCurveTo(fx, h * 0.244, fx + 86, h * 0.215); g.stroke();
                // Abdominal definition
                g.strokeStyle = shadeHex(skinHex, -46);
                g.globalAlpha = 0.22; g.lineWidth = 8;
                g.beginPath(); g.moveTo(fx, h * 0.44); g.lineTo(fx, h * 0.68); g.stroke();
                g.beginPath(); g.moveTo(fx - 76, h * 0.52); g.quadraticCurveTo(fx - 52, h * 0.64, fx - 36, h * 0.74); g.stroke();
                g.beginPath(); g.moveTo(fx + 76, h * 0.52); g.quadraticCurveTo(fx + 52, h * 0.64, fx + 36, h * 0.74); g.stroke();
                // Cute navel
                g.globalAlpha = 0.48; g.fillStyle = shadeHex(skinHex, -65);
                g.beginPath(); g.ellipse(fx, h * 0.695, 10, 17, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
            }

            // Back spine & glute crease
            g.strokeStyle = shadeHex(skinHex, -52);
            g.globalAlpha = 0.30; g.lineWidth = 12;
            g.beginPath(); g.moveTo(w * 0.5, h * 0.24); g.lineTo(w * 0.5, h * 0.92); g.stroke();
            g.globalAlpha = 1;
        });
    }

    function hairAlbedoTex(hairHex, hiCol) {
        return L.canvasTex('aaa26-hair-v4:' + hairHex + ':' + hiCol, 1024, 1024, (g, w, h) => {
            const gr = g.createLinearGradient(0, 0, 0, h);
            gr.addColorStop(0, shadeHex(hairHex, -42));
            gr.addColorStop(0.24, hexStr(hairHex));
            gr.addColorStop(0.42, shadeHex(hairHex, 28));
            gr.addColorStop(0.70, shadeHex(hairHex, -6));
            gr.addColorStop(1, shadeHex(hairHex, -44));
            g.fillStyle = gr; g.fillRect(0, 0, w, h);

            for (let x = 0; x < w; x += 2) {
                const v = Math.sin(x * 0.42) * 0.5 + 0.5;
                g.fillStyle = x % 4 === 0 ? `rgba(255,255,255,${v * 0.22})` : `rgba(0,0,0,${v * 0.20})`;
                g.fillRect(x, 0, 1.5, h);
            }
            // Double lustrous angel-ring specular sheen
            for (const [yc, hh, al] of [[0.30, 0.11, 0.72], [0.68, 0.06, 0.36]]) {
                const halo = g.createLinearGradient(0, h * (yc - hh), 0, h * (yc + hh));
                halo.addColorStop(0, 'rgba(255,255,255,0)');
                halo.addColorStop(0.45, hiCol);
                halo.addColorStop(0.55, 'rgba(255,255,255,0.95)');
                halo.addColorStop(1, 'rgba(255,255,255,0)');
                g.globalAlpha = al; g.fillStyle = halo;
                g.fillRect(0, h * (yc - hh), w, h * hh * 2);
            }
            g.globalAlpha = 1;
        });
    }

    function fabricAlbedoTex(pattern, c1, c2) {
        const s1 = hexStr(c1), s2 = hexStr(c2);
        return L.canvasTex('aaa26-fab-v3:' + pattern + ':' + s1 + ':' + s2, 512, 512, (g, w, h) => {
            g.fillStyle = s1; g.fillRect(0, 0, w, h);
            if (pattern === 'gingham') {
                g.fillStyle = s2; g.globalAlpha = 0.48;
                for (let i = 0; i < w; i += 48) { g.fillRect(i, 0, 24, h); g.fillRect(0, i, w, 24); }
                g.globalAlpha = 1;
                // Delicate lace edges
                g.fillStyle = s2; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16);
                for (let x = 8; x < w; x += 16) {
                    g.beginPath(); g.arc(x, 16, 6, 0, Math.PI); g.fill();
                    g.beginPath(); g.arc(x, h - 16, 6, Math.PI, TAU); g.fill();
                }
            } else if (pattern === 'hibiscus') {
                const drawFl = (cx, cy, r) => {
                    g.fillStyle = s2;
                    for (let k = 0; k < 5; k++) {
                        const a = k * TAU / 5;
                        g.beginPath(); g.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.52, r * 0.36, a, 0, TAU); g.fill();
                    }
                    g.fillStyle = '#b91c1c'; g.beginPath(); g.arc(cx, cy, r * 0.24, 0, TAU); g.fill();
                    g.fillStyle = '#fef08a'; g.beginPath(); g.arc(cx, cy, r * 0.10, 0, TAU); g.fill();
                };
                for (let y = 48; y < h; y += 96) for (let x = 48; x < w; x += 96) drawFl(x + ((y / 96) % 2) * 48, y, 34);
            } else if (pattern === 'nautical') {
                g.fillStyle = s2;
                for (let y = 0; y < h; y += 36) g.fillRect(0, y, w, 14);
                g.fillStyle = '#f59e0b';
                for (let y = 13; y < h; y += 72) g.fillRect(0, y, w, 4);
            } else if (pattern === 'polka') {
                g.fillStyle = s2;
                for (let y = 24; y < h; y += 48) for (let x = 24; x < w; x += 48) {
                    g.beginPath(); g.arc(x + ((y / 48) % 2) * 24, y, 10, 0, TAU); g.fill();
                }
            } else if (pattern === 'stripe') {
                g.fillStyle = s2;
                for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 13, h);
                g.fillStyle = '#fde047';
                for (let x = 14; x < w; x += 40) g.fillRect(x, 0, 5, h);
            } else if (pattern === 'ombre') {
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0, s1); gr.addColorStop(0.5, s2); gr.addColorStop(1, '#581c87');
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
                g.strokeStyle = 'rgba(250,204,21,0.65)'; g.lineWidth = 3.5;
                for (let y = 24; y < h; y += 40) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.33, y - 14, w * 0.66, y + 14, w, y); g.stroke(); }
            } else if (pattern === 'shell') {
                const gr = g.createLinearGradient(0, 0, w, h);
                gr.addColorStop(0, s1); gr.addColorStop(0.5, '#2dd4bf'); gr.addColorStop(1, '#a78bfa');
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
                g.strokeStyle = s2; g.lineWidth = 4;
                for (let y = 0; y <= h; y += 44) for (let x = 0; x <= w; x += 44) {
                    g.beginPath(); g.arc(x + ((y / 44) % 2) * 22, y, 22, Math.PI, TAU); g.stroke();
                }
            } else if (pattern === 'mesh') {
                g.fillStyle = s2; g.fillRect(0, 0, w, 24); g.fillRect(0, h - 24, w, 24);
                g.strokeStyle = 'rgba(255,255,255,0.42)'; g.lineWidth = 2.5;
                for (let i = -h; i < w + h; i += 18) {
                    g.beginPath(); g.moveTo(i, 24); g.lineTo(i + h, h - 24); g.stroke();
                    g.beginPath(); g.moveTo(i + h, 24); g.lineTo(i, h - 24); g.stroke();
                }
            } else if (pattern === 'gamer') {
                g.fillStyle = s2;
                for (let y = 32; y < h; y += 64) for (let x = 32; x < w; x += 64) {
                    const ox = x + ((y / 64) % 2) * 32;
                    g.beginPath();
                    g.moveTo(ox, y + 8);
                    g.lineTo(ox - 10, y - 6);
                    g.lineTo(ox - 5, y - 12);
                    g.lineTo(ox, y - 6);
                    g.lineTo(ox + 5, y - 12);
                    g.lineTo(ox + 10, y - 6);
                    g.closePath();
                    g.fill();
                }
            } else if (pattern === 'lifeguard') {
                g.fillStyle = s2;
                // Crisp white cross & double sport stripe
                g.fillRect(w * 0.44, h * 0.38, w * 0.12, h * 0.24);
                g.fillRect(w * 0.38, h * 0.44, w * 0.24, h * 0.12);
                g.strokeStyle = '#facc15'; g.lineWidth = 4;
                g.strokeRect(w * 0.38, h * 0.38, w * 0.24, h * 0.24);
            }
            g.fillStyle = s2;
            g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
        });
    }

    /** 1024x1024 Anime jewel face texture with crystalline multi-layer irises, feathered lashes & glossy Cupid's-bow lips */
    function faceOverlayTex(eyeCol, hairHex, blushCol, expr) {
        return L.canvasTex(`aaa26-face-v4:${eyeCol}:${hairHex}:${expr}`, 1024, 1024, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            g.save();
            g.scale(2, 2);
            const browCol = shadeHex(hairHex, -38);

            // Soft airbrushed cheek & nose-tip blush
            const drawBlush = (cx, cy, rx, ry, al) => {
                const rg = g.createRadialGradient(cx, cy, 3, cx, cy, rx);
                rg.addColorStop(0, blushCol); rg.addColorStop(1, 'rgba(255,100,140,0)');
                g.globalAlpha = al; g.fillStyle = rg;
                g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
            };
            drawBlush(120, 322, 66, 32, expr === 'happy' ? 0.80 : 0.52);
            drawBlush(392, 322, 66, 32, expr === 'happy' ? 0.80 : 0.52);
            drawBlush(256, 312, 26, 15, 0.30);

            // Subtle luminous cheek highlight dots
            g.fillStyle = 'rgba(255,255,255,0.45)';
            g.beginPath(); g.ellipse(108, 312, 9, 4.5, -0.25, 0, TAU); g.fill();
            g.beginPath(); g.ellipse(404, 312, 9, 4.5, 0.25, 0, TAU); g.fill();

            if (expr === 'happy') {
                const drawStar = (x, y, sz) => {
                    g.fillStyle = '#ffffff';
                    g.beginPath();
                    g.moveTo(x, y - sz);
                    g.quadraticCurveTo(x, y, x + sz, y);
                    g.quadraticCurveTo(x, y, x, y + sz);
                    g.quadraticCurveTo(x, y, x - sz, y);
                    g.quadraticCurveTo(x, y, x, y - sz);
                    g.fill();
                };
                drawStar(106, 314, 9);
                drawStar(406, 314, 9);
            }

            g.lineCap = 'round'; g.lineJoin = 'round';
            if (expr === 'happy') {
                for (const cx of [158, 354]) {
                    const dir = cx < 256 ? -1 : 1;
                    g.strokeStyle = '#11061c'; g.lineWidth = 21;
                    g.beginPath(); g.moveTo(cx - 52, 260); g.quadraticCurveTo(cx, 188, cx + 52, 260); g.stroke();
                    g.lineWidth = 11;
                    g.beginPath(); g.moveTo(cx + dir * 48, 252); g.lineTo(cx + dir * 74, 224); g.stroke();
                    g.fillStyle = '#fef08a'; g.beginPath(); g.arc(cx + dir * 68, 200, 9, 0, TAU); g.fill();
                }
                g.strokeStyle = browCol; g.lineWidth = 9;
                for (const cx of [158, 354]) { g.beginPath(); g.moveTo(cx - 42, 148); g.quadraticCurveTo(cx, 126, cx + 42, 148); g.stroke(); }
                g.fillStyle = '#881337';
                g.beginPath(); g.moveTo(206, 356); g.quadraticCurveTo(256, 434, 306, 356); g.quadraticCurveTo(256, 368, 206, 356); g.closePath(); g.fill();
                g.fillStyle = '#fb7185'; g.beginPath(); g.ellipse(256, 394, 26, 15, 0, 0, TAU); g.fill();
                g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(216, 360); g.quadraticCurveTo(256, 374, 296, 360); g.quadraticCurveTo(256, 378, 216, 360); g.fill();
            } else if (expr === 'blink') {
                for (const cx of [158, 354]) {
                    const dir = cx < 256 ? -1 : 1;
                    g.strokeStyle = '#11061c'; g.lineWidth = 19;
                    g.beginPath(); g.moveTo(cx - 50, 254); g.quadraticCurveTo(cx, 282, cx + 50, 254); g.stroke();
                    g.lineWidth = 10;
                    g.beginPath(); g.moveTo(cx + dir * 46, 254); g.lineTo(cx + dir * 68, 240); g.stroke();
                }
                g.strokeStyle = browCol; g.lineWidth = 9;
                for (const cx of [158, 354]) { g.beginPath(); g.moveTo(cx - 42, 162); g.quadraticCurveTo(cx, 144, cx + 42, 162); g.stroke(); }
                g.fillStyle = 'rgba(225, 58, 114, 0.85)';
                g.beginPath(); g.ellipse(256, 378, 34, 13, 0, 0, TAU); g.fill();
                g.strokeStyle = '#881337'; g.lineWidth = 7;
                g.beginPath(); g.moveTo(222, 372); g.quadraticCurveTo(256, 392, 290, 372); g.stroke();
            } else {
                for (const cx of [158, 354]) {
                    const dir = cx < 256 ? -1 : 1;
                    // Crisp white sclera + soft upper-lid drop shadow
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(cx, 248, 56, 64, 0, 0, TAU); g.fill();
                    g.fillStyle = 'rgba(71, 85, 105, 0.32)';
                    g.beginPath(); g.ellipse(cx, 212, 54, 28, 0, 0, TAU); g.fill();

                    // Multi-ring jewel iris
                    const ig = g.createLinearGradient(0, 192, 0, 310);
                    ig.addColorStop(0, '#090314');
                    ig.addColorStop(0.26, eyeCol);
                    ig.addColorStop(0.74, eyeCol);
                    ig.addColorStop(1, '#ffffff');
                    g.fillStyle = ig;
                    g.beginPath(); g.ellipse(cx, 254, 44, 55, 0, 0, TAU); g.fill();

                    // Crystalline radial iris facets
                    g.strokeStyle = 'rgba(255,255,255,0.38)'; g.lineWidth = 1.8;
                    for (let k = 0; k < 16; k++) {
                        const a = k * TAU / 16;
                        g.beginPath();
                        g.moveTo(cx + Math.cos(a) * 16, 254 + Math.sin(a) * 20);
                        g.lineTo(cx + Math.cos(a) * 39, 254 + Math.sin(a) * 49);
                        g.stroke();
                    }

                    // Luminous lower caustic crescent + deep pupil
                    g.fillStyle = 'rgba(255,255,255,0.72)';
                    g.beginPath(); g.ellipse(cx, 286, 28, 15, 0, 0, TAU); g.fill();
                    g.strokeStyle = '#070312'; g.lineWidth = 6.5;
                    g.beginPath(); g.ellipse(cx, 254, 44, 55, 0, 0, TAU); g.stroke();
                    g.fillStyle = '#070312';
                    g.beginPath(); g.ellipse(cx, 254, 18, 25, 0, 0, TAU); g.fill();

                    // Triple studio catchlights + star glint
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(cx - 17, 221, 16, 17, -0.25, 0, TAU); g.fill();
                    g.beginPath(); g.arc(cx + 18, 280, 9.5, 0, TAU); g.fill();
                    g.beginPath(); g.arc(cx + 15, 229, 5.5, 0, TAU); g.fill();

                    // Feathered upper lashes & winged tips
                    g.strokeStyle = '#090314'; g.lineWidth = 23;
                    g.beginPath(); g.ellipse(cx, 248, 57, 63, 0, Math.PI * 1.04, Math.PI * 1.96); g.stroke();
                    g.lineWidth = 10;
                    g.beginPath(); g.moveTo(cx + dir * 50, 220); g.lineTo(cx + dir * 79, 192); g.stroke();
                    g.beginPath(); g.moveTo(cx + dir * 53, 236); g.lineTo(cx + dir * 74, 222); g.stroke();
                    g.lineWidth = 5;
                    g.beginPath(); g.moveTo(cx + dir * 32, 194); g.lineTo(cx + dir * 44, 176); g.stroke();
                    g.strokeStyle = 'rgba(85, 38, 28, 0.72)'; g.lineWidth = 5;
                    g.beginPath(); g.ellipse(cx, 230, 61, 68, 0, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
                    g.strokeStyle = 'rgba(9, 3, 20, 0.72)'; g.lineWidth = 5;
                    g.beginPath(); g.ellipse(cx, 250, 53, 59, 0, Math.PI * 0.22, Math.PI * 0.78); g.stroke();
                }

                g.strokeStyle = browCol; g.lineWidth = 10;
                for (const cx of [158, 354]) {
                    g.beginPath(); g.moveTo(cx - 44, 156); g.quadraticCurveTo(cx, 134, cx + 44, 154); g.stroke();
                }

                // Nose shadow & tip highlight
                g.fillStyle = 'rgba(105, 48, 35, 0.42)';
                g.beginPath(); g.moveTo(256, 300); g.lineTo(247, 322); g.lineTo(261, 324); g.closePath(); g.fill();
                g.fillStyle = 'rgba(255,255,255,0.75)';
                g.beginPath(); g.arc(255, 314, 4.5, 0, TAU); g.fill();

                // Plump glossy Cupid's-bow lips
                const lg = g.createLinearGradient(0, 354, 0, 402);
                lg.addColorStop(0, 'rgba(225, 48, 108, 0.88)');
                lg.addColorStop(1, 'rgba(244, 88, 124, 0.94)');
                g.fillStyle = lg;
                g.beginPath(); g.ellipse(256, 378, 36, 16, 0, 0, TAU); g.fill();
                g.strokeStyle = '#7f1d3a'; g.lineWidth = 6.5;
                g.beginPath(); g.moveTo(218, 372); g.quadraticCurveTo(256, 394, 294, 372); g.stroke();
                g.fillStyle = 'rgba(255, 245, 250, 0.98)';
                g.beginPath(); g.ellipse(256, 386, 18, 5.5, 0, 0, TAU); g.fill();
            }
            g.restore();
        });
    }

    // ------------------------------------------------------------------------
    // Spring-Damper Solver
    // ------------------------------------------------------------------------
    function makeSpring(k, c, maxDisp) {
        return { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, k, c, max: maxDisp };
    }
    function stepSpring(sp, ax, ay, az, dt) {
        const d = Math.min(dt, 0.035);
        sp.vx += (-sp.k * sp.x - sp.c * sp.vx + ax) * d;
        sp.vy += (-sp.k * sp.y - sp.c * sp.vy + ay) * d;
        sp.vz += (-sp.k * sp.z - sp.c * sp.vz + az) * d;
        sp.x = clamp(sp.x + sp.vx * d, -sp.max, sp.max);
        sp.y = clamp(sp.y + sp.vy * d, -sp.max, sp.max);
        sp.z = clamp(sp.z + sp.vz * d, -sp.max, sp.max);
    }

    function createMaterials(d, matsOut) {
        const env = getEnvMap();
        const push = (m) => { matsOut.push(m); return m; };

        const skinM = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: skinAlbedoTex(d.skin, d.blush),
            normalMap: getSkinNormalMap(),
            normalScale: new THREE.Vector2(0.16, 0.16),
            roughness: 0.42,
            metalness: 0.01,
            clearcoat: 0.22,
            clearcoatRoughness: 0.30,
            sheen: 0.22,
            sheenColor: new THREE.Color(d.blush),
            sheenRoughness: 0.50,
            envMap: env,
            envMapIntensity: 0.56,
            emissive: 0x000000
        }));
        applySubsurfaceSkinShader(skinM, d.blush);

        const hairM = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: hairAlbedoTex(d.hair, d.hairHi),
            normalMap: getHairNormalMap(),
            normalScale: new THREE.Vector2(0.36, 0.36),
            roughness: 0.22,
            metalness: 0.12,
            clearcoat: 0.74,
            clearcoatRoughness: 0.16,
            envMap: env,
            envMapIntensity: 0.95,
            emissive: 0x000000
        }));
        applyHairAnisoShader(hairM, d.hairHi);

        const lashM = push(new THREE.MeshStandardMaterial({
            color: 0x0b0414, roughness: 0.32, metalness: 0.05
        }));

        const suit1 = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: fabricAlbedoTex(d.pattern, d.c1, d.c2),
            normalMap: getFabricNormalMap(),
            normalScale: new THREE.Vector2(0.30, 0.30),
            roughness: 0.34,
            metalness: 0.08,
            sheen: 0.34,
            sheenColor: new THREE.Color(d.c2),
            sheenRoughness: 0.42,
            side: THREE.DoubleSide,
            envMap: env,
            envMapIntensity: 0.85,
            emissive: 0x000000
        }));

        const suit2 = push(new THREE.MeshPhysicalMaterial({
            color: d.c2,
            normalMap: getFabricNormalMap(),
            normalScale: new THREE.Vector2(0.24, 0.24),
            roughness: 0.38,
            metalness: 0.06,
            envMap: env,
            envMapIntensity: 0.75,
            emissive: 0x000000
        }));

        const metalM = push(new THREE.MeshStandardMaterial({
            color: d.metal, roughness: 0.12, metalness: 0.96, envMap: env, envMapIntensity: 1.55, emissive: 0x000000
        }));

        const accM = push(new THREE.MeshPhysicalMaterial({
            color: d.accC, roughness: 0.26, metalness: 0.12, clearcoat: 0.46, envMap: env, envMapIntensity: 0.90, emissive: 0x000000
        }));

        const nailM = push(new THREE.MeshPhysicalMaterial({
            color: d.nail || d.c1, roughness: 0.06, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.04, envMap: env, envMapIntensity: 1.3, emissive: 0x000000
        }));

        const corneaM = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, roughness: 0.02, metalness: 0.0, transparent: true, opacity: 0.30,
            clearcoat: 1.0, clearcoatRoughness: 0.02, envMap: env, envMapIntensity: 2.0, depthWrite: false
        });

        // Translucent floatie / cup / sunglasses material
        const glassM = push(new THREE.MeshPhysicalMaterial({
            color: d.c1, roughness: 0.08, metalness: 0.02, transparent: true, opacity: 0.78,
            clearcoat: 1.0, clearcoatRoughness: 0.05, envMap: env, envMapIntensity: 1.4, side: THREE.DoubleSide
        }));

        return { skinM, hairM, lashM, suit1, suit2, metalM, accM, nailM, corneaM, glassM, env };
    }

    function createFaceMaterial(faceTexOpen, blushHex) {
        const mat = new THREE.MeshPhysicalMaterial({
            map: faceTexOpen,
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            roughness: 0.48,
            metalness: 0.0,
            clearcoat: 0.14,
            clearcoatRoughness: 0.32,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: faceTexOpen,
            emissiveIntensity: 0.18
        });
        applySubsurfaceSkinShader(mat, blushHex || '#fb7185');
        return mat;
    }

    BO.BeachAnatomy = {
        BONE, createSkeleton, getSkinnedBodyGeo, getSkinnedSuitGeo, getStaticGeos,
        getEnvMap, createMaterials, createFaceMaterial, fabricAlbedoTex, faceOverlayTex,
        makeSpring, stepSpring, hexStr, shadeHex, clamp, lerp
    };
})(window);
