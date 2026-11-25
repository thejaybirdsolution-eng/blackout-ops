/* ============================================================================
   BLACKOUT OPS — Sweetheart Shore 2026 AAA Skinned Character & Soft-Engine Kit
   - True 25-bone THREE.Skeleton + unified THREE.SkinnedMesh human manifold:
     breasts, cleavage, ribcage, hourglass waist, navel, hips, glutes, thighs,
     knees, calves, ankles, shoulders, elbows & wrists are sculpted into ONE
     continuous skinned surface (ZERO ball-joint seams, 1 body draw call!)
   - Dedicated bodyfat/soft-tissue jiggle bones (breastL, breastR, bellySoft,
     gluteL, gluteR, thighSoftL, thighSoftR) deforming skin & fitted couture
     swimwear together on the GPU with zero cloth clipping
   - LinearEncoding tangent-space normal maps + PMREM IBL + custom GLSL
     Subsurface Scattering (Soft-Engine warm peach wrap-lighting) shader
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
            const envTex = L.canvasTex('aaa26-beach-env', 256, 128, (g, w, h) => {
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0.0, '#0c4a6e');
                gr.addColorStop(0.36, '#38bdf8');
                gr.addColorStop(0.50, '#fffbeb');
                gr.addColorStop(0.58, '#d6a46c');
                gr.addColorStop(1.0, '#784e28');
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
                // Crisp key-sun specular highlight (front-right)
                const sun = g.createRadialGradient(w * 0.35, h * 0.22, 2, w * 0.35, h * 0.22, 24);
                sun.addColorStop(0, '#ffffff');
                sun.addColorStop(0.4, '#fef3c7');
                sun.addColorStop(1, 'rgba(255,245,210,0)');
                g.fillStyle = sun; g.fillRect(0, 0, w, h);
                // Turquoise ocean rim reflection (back)
                const rim = g.createRadialGradient(w * 0.82, h * 0.42, 4, w * 0.82, h * 0.42, 36);
                rim.addColorStop(0, 'rgba(103, 232, 249, 0.75)');
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

        // Integrated 3D Sculpted Dual Glute Lobes + Gluteal Cleft + Under-Glute Crease!
        const gluteAngL = gauss(th - (Math.PI - 0.52), 0, 0.42);
        const gluteAngR = gauss(th - (Math.PI + 0.52), 0, 0.42);
        const gluteProfile = gauss(v, 0.125, 0.085) * (1 - 0.35 * smoothstep(0.0, 0.05, v));
        const gluteOut = 0.054 * hipSc * (gluteAngL + gluteAngR) * gluteProfile;
        const gluteCleft = -0.022 * gauss(th, Math.PI, 0.14) * gauss(v, 0.12, 0.08);

        // Integrated 3D Sculpted Teardrop Breasts + Natural Medial Cleavage Valley!
        // Left breast centered near th = +0.52, Right breast near th = TAU - 0.52, v ~ 0.60 (y ~ 1.26)
        const dThL = Math.atan2(Math.sin(th - 0.50), Math.cos(th - 0.50));
        const dThR = Math.atan2(Math.sin(th + 0.50), Math.cos(th + 0.50));
        const bRadL = Math.hypot(dThL / 0.46, (v - 0.605) / 0.105);
        const bRadR = Math.hypot(dThR / 0.46, (v - 0.605) / 0.105);
        const lobeL = bRadL < 1.35 ? Math.pow(Math.max(0, Math.cos(bRadL * 1.12)), 1.55) : 0;
        const lobeR = bRadR < 1.35 ? Math.pow(Math.max(0, Math.cos(bRadR * 1.12)), 1.55) : 0;
        // Gravity teardrop asymmetry: fuller rounded lower pole, smooth natural upper pectoral slope!
        const tearSlope = v < 0.605 ? 1.18 : lerp(1.0, 0.62, clamp((v - 0.605) / 0.11, 0, 1));
        const breastProj = 0.086 * bustSc * (lobeL + lobeR) * tearSlope;
        const breastDropY = -0.022 * bustSc * (lobeL + lobeR) * Math.pow(clamp(1.1 - Math.min(bRadL, bRadR), 0, 1), 1.3);
        const breastSpreadX = 0.016 * bustSc * (lobeL - lobeR);

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
        const wGL = clamp(gluteAngL * gluteProfile * 0.85, 0, 0.85);
        const wGR = clamp(gluteAngR * gluteProfile * 0.85, 0, 0.85);
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

        // 1. Unified Torso + Breasts + Pelvis + Glutes + Neck (46 slices x 42 segs)
        appendTubePart(out, 46, 42, (v, th, u) => {
            const r = evalUnifiedTorso(v, th, morph, 0);
            r.uv = [u, v];
            return r;
        });

        // 2. Seamless Left & Right Sculpted Legs (Hip -> Thigh -> Knee -> Calf -> Ankle, 32 x 22)
        for (const s of [1, -1]) {
            const bThigh = s > 0 ? BONE.THIGH_L : BONE.THIGH_R;
            const bSoft = s > 0 ? BONE.THIGH_SOFT_L : BONE.THIGH_SOFT_R;
            const bShin = s > 0 ? BONE.SHIN_L : BONE.SHIN_R;
            const bFoot = s > 0 ? BONE.FOOT_L : BONE.FOOT_R;
            const bGlute = s > 0 ? BONE.GLUTE_L : BONE.GLUTE_R;
            const cx = s * 0.092 * hipSc;

            appendTubePart(out, 32, 22, (v, th, u) => {
                // v=0 at y=0.935 (blends seamlessly into pelvis/glutes) -> v=1 at y=0.055 (ankle)
                const y = lerp(0.935, 0.055, v);
                const sinT = Math.sin(th), cosT = Math.cos(th);
                const front = Math.max(0, cosT), back = Math.max(0, -cosT);
                const inner = s > 0 ? Math.max(0, -sinT) : Math.max(0, sinT);

                let rad;
                if (v < 0.50) {
                    // Sculpted plush upper thigh tapering to knee (v = 0.50 -> y = 0.495)
                    const tv = v / 0.50;
                    rad = lerp(0.098 * thighSc, 0.049, Math.pow(tv, 0.82));
                    rad += 0.013 * thighSc * front * gauss(tv, 0.38, 0.24);        // quadriceps sweep
                    rad += 0.012 * thighSc * back * gauss(tv, 0.25, 0.24);         // hamstring curve
                    rad += 0.008 * thighSc * inner * gauss(tv, 0.20, 0.18);        // plush inner-thigh softness
                } else {
                    // Knee patella -> asymmetric gastrocnemius calf -> slender Achilles & ankle
                    const cv = (v - 0.50) / 0.50;
                    rad = lerp(0.049, 0.030, smoothstep(0.0, 0.92, cv));
                    rad += 0.005 * front * gauss(cv, 0.04, 0.08);                  // kneecap
                    rad += 0.019 * (0.42 + 0.58 * back) * gauss(cv, 0.28, 0.16);   // calf muscle
                    rad += 0.004 * Math.abs(sinT) * gauss(cv, 0.94, 0.05);         // ankle malleoli
                }

                const zShift = v > 0.50 ? -0.006 * gauss((v - 0.50) / 0.50, 0.28, 0.18) : 0;
                const x = cx + rad * sinT * 0.97;
                const z = rad * cosT + zShift;

                // Smooth hip-to-thigh, plush-thigh jiggle, knee, and ankle skin weights!
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

        // 3. Seamless Left & Right Sculpted Arms (Shoulder -> Bicep -> Elbow -> Forearm -> Wrist, 22 x 16)
        for (const s of [1, -1]) {
            const bSh = s > 0 ? BONE.SH_L : BONE.SH_R;
            const bEl = s > 0 ? BONE.EL_L : BONE.EL_R;
            const bWr = s > 0 ? BONE.WR_L : BONE.WR_R;

            appendTubePart(out, 22, 16, (v, th, u) => {
                // Follows exact bind bone line: sh (0.152*s, 1.385, -0.006) -> el (0.170*s, 1.120, -0.006) -> wr (0.182*s, 0.880, 0.006)
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
    // Generates form-fitted bikini / bustier / sport / cutout-monokini / shell-cup
    // directly from evalUnifiedTorso (+0.0035m normal offset) -> ZERO clipping ever!
    // ------------------------------------------------------------------------
    const suitGeoCache = new Map();

    function getSkinnedSuitGeo(style, morph) {
        const key = `${style}:${morph.bust}:${morph.hip}:${morph.waist}`;
        if (suitGeoCache.has(key)) return suitGeoCache.get(key).clone();

        const out = { pos: [], uv: [], si: [], sw: [], idx: [] };

        // Helper to emit a vertex band on the torso with custom per-(v, th) coverage shaping
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
        addBand(0.01, 0.23, 14, 40, (v, th, tv) => {
            const cosT = Math.cos(th), side = Math.abs(Math.sin(th));
            // V-dip in front & cheeky high-leg cut on sides!
            const highLeg = 0.065 * Math.pow(side, 1.6);
            const vDipFront = -0.028 * Math.pow(Math.max(0, cosT), 2);
            const vLo = 0.01 + highLeg * (1 - tv);
            const vHi = 0.215 + vDipFront + 0.02 * Math.pow(side, 2);
            return { v: lerp(vLo, vHi, tv), off: 0.0040 };
        });

        // 2. Style-specific Couture Upper Garment
        if (style === 'monokini') {
            // Plunging Riviera Cutout Monokini (connects front & back with dramatic open side-waist cutouts!)
            addBand(0.20, 0.69, 24, 42, (v, th, tv) => {
                const side = Math.abs(Math.sin(th));
                const cosT = Math.cos(th);
                const waistCutout = side > 0.48 && v > 0.24 && v < 0.50;
                const plungeCut = cosT > 0.88 && v > 0.56;
                const openBack = cosT < -0.45 && v > 0.44;
                return { v, off: 0.0042, inside: !(waistCutout || plungeCut || openBack) };
            });
        } else if (style === 'sport') {
            // Sleek Contoured Volleyball Crop-Top (snug underbust band -> sculpted racerback)
            addBand(0.49, 0.72, 16, 40, (v, th, tv) => {
                const side = Math.abs(Math.sin(th));
                const armhole = side > 0.74 && v > 0.63;
                return { v, off: 0.0042, inside: !armhole };
            });
        } else if (style === 'bustier' || style === 'frill') {
            // Sweetheart Balconette Bustier Bikini Top (lifts & frames cleavage cleanly!)
            addBand(0.50, 0.675, 16, 42, (v, th, tv) => {
                const cosT = Math.cos(th);
                // Sweetheart V-notch dip at center sternum
                const sweetheart = -0.038 * Math.pow(Math.max(0, cosT), 8) * tv;
                const lowBack = cosT < -0.2 ? -0.045 * tv : 0;
                return { v: v + sweetheart + lowBack, off: 0.0042 };
            });
        } else {
            // Micro-Triangle / Scalloped Seashell String Bikini Cups + Thin Back Strap!
            addBand(0.515, 0.68, 16, 44, (v, th, tv) => {
                const dL = Math.abs(Math.atan2(Math.sin(th - 0.50), Math.cos(th - 0.50)));
                const dR = Math.abs(Math.atan2(Math.sin(th + 0.50), Math.cos(th + 0.50)));
                const dCup = Math.min(dL, dR);
                // Triangle cup narrows toward top apex (tv -> 1), plus thin underband wrap around back
                const maxW = lerp(0.46, 0.11, Math.pow(tv, 0.85));
                const isUnderStrap = tv < 0.16;
                const scallop = style === 'shell' ? Math.sin(th * 18) * 0.008 * tv : 0;
                return { v: v + scallop, off: 0.0044, inside: (dCup <= maxW || isUnderStrap) };
            });
        }

        const geo = finalizeSkinnedGeo(out);
        suitGeoCache.set(key, geo);
        return geo.clone();
    }

    // ------------------------------------------------------------------------
    // Cached 3D Sculpted Head, Real 3D Layered Jewel Eyes, 3D Lashes & Hair
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
        g.computeVertexNormals();
        return g;
    }

    function getStaticGeos() {
        if (GEO.ready) return GEO;
        GEO.ready = true;

        // 3D Sculpted Dead-or-Alive / FF7R Head (delicate V-chin, plush cheeks, 3D nose, 3D lips)
        GEO.head = sculptStatic(28, 34, (v, th) => {
            const y = lerp(-0.012, 0.258, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const front = Math.max(0, cosT);
            let rx = 0.114 * Math.pow(Math.sin(clamp(v, 0.001, 0.999) * Math.PI), 0.55);
            if (v < 0.35) rx *= lerp(0.40, 1.0, smoothstep(0.0, 0.35, v));
            const rz = rx * 0.98;
            const cheek = 0.007 * (gauss(th, 0.58, 0.25) + gauss(th, TAU - 0.58, 0.25)) * gauss(v, 0.34, 0.09);
            const noseC = Math.pow(front, 20);
            const noseTip = 0.015 * noseC * gauss(v, 0.355, 0.028);
            const noseBridge = 0.007 * Math.pow(front, 14) * gauss(v, 0.42, 0.05);
            const mouthW = Math.pow(front, 12);
            const upperLip = 0.006 * mouthW * gauss(v, 0.245, 0.015);
            const lowerLip = 0.008 * mouthW * gauss(v, 0.215, 0.016);
            const chin = 0.005 * Math.pow(front, 6) * gauss(v, 0.085, 0.045);
            return [(rx + cheek * 0.35) * sinT, y, (rz + cheek + noseTip + noseBridge + upperLip + lowerLip + chin) * cosT];
        });

        // Feathery Razor-Thin Silk Forehead Bangs (3mm thin curved ribbons parted ABOVE/AROUND eyes!)
        const makeSilkRibbon = (len, wBase, curveZ, sweepX) => {
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(sweepX * 0.30, -len * 0.34, curveZ),
                new THREE.Vector3(sweepX * 0.72, -len * 0.70, curveZ * 0.94),
                new THREE.Vector3(sweepX, -len, curveZ * 0.45)
            ];
            const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, wBase, 8, false);
            const p = geo.attributes.position;
            for (let i = 0; i < p.count; i++) {
                const y = p.getY(i);
                const t = clamp(-y / len, 0, 1);
                // Flatten Z into a sleek 3mm silk blade and taper tip to a razor point!
                const wEnv = Math.sin(t * Math.PI * 0.88 + 0.12) * (1 - t * 0.72);
                p.setX(i, p.getX(i) * (0.4 + wEnv * 1.1));
                p.setZ(i, p.getZ(i) * 0.26 + curveZ * Math.sin(t * Math.PI) * 0.65);
            }
            geo.computeVertexNormals();
            return geo;
        };
        // Short wispy center bang (stops ABOVE eyes!) + graceful temple-swept side bangs!
        GEO.bangWispy = makeSilkRibbon(0.074, 0.016, 0.018, 0.008);
        GEO.bangPartL = makeSilkRibbon(0.118, 0.022, 0.020, -0.046);
        GEO.bangPartR = makeSilkRibbon(0.118, 0.022, 0.020, 0.046);
        GEO.sidelock = makeSilkRibbon(0.215, 0.022, 0.014, 0.016);

        // Draped Off-Shoulder Sinusoidal Flounce
        GEO.flounce = sculptStatic(10, 36, (v, th) => {
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const y = lerp(0.145, 0.015, v);
            const flare = lerp(0.146, 0.205, Math.pow(v, 0.85));
            const wave = Math.sin(th * 10) * 0.016 * Math.pow(v, 1.3);
            return [(flare + wave) * sinT * 1.08, y + Math.sin(th * 10) * 0.007 * v, (flare * 0.80 + wave) * cosT];
        });

        // Volumetric flowing hair chain segments + spiral drill curl
        GEO.hairSeg = sculptStatic(10, 12, (v, th) => {
            const y = lerp(0.01, -0.135, v);
            const r = 0.042 * (0.68 + 0.32 * Math.sin(v * Math.PI)) * (1 - v * 0.18);
            return [r * Math.sin(th) * 1.15, y, r * Math.cos(th) * 0.72];
        });
        GEO.hairTip = sculptStatic(12, 12, (v, th) => {
            const y = lerp(0.01, -0.175, v);
            const r = 0.038 * Math.pow(1 - v, 0.85);
            return [r * Math.sin(th) * 1.12 + Math.sin(v * Math.PI) * 0.018, y, r * Math.cos(th) * 0.70];
        });
        GEO.hairDrill = sculptStatic(14, 14, (v, th) => {
            const y = lerp(0.01, -0.16, v);
            const r = 0.038 * (1 - v * 0.45);
            const swirl = v * TAU * 1.5;
            return [r * Math.sin(th) + Math.cos(swirl) * 0.016 * v, y, r * Math.cos(th) + Math.sin(swirl) * 0.016 * v];
        });

        GEO.ear = new THREE.SphereGeometry(0.019, 10, 8); GEO.ear.scale(0.38, 1.22, 0.82);
        GEO.nail = new THREE.SphereGeometry(0.0042, 6, 4); GEO.nail.scale(1.1, 0.45, 1.4);
        GEO.cornea = new THREE.SphereGeometry(0.022, 14, 10, 0, TAU, 0, Math.PI * 0.42);
        GEO.cornea.rotateX(Math.PI / 2);

        return GEO;
    }

    // ------------------------------------------------------------------------
    // LinearEncoding Normal Maps + Custom GLSL Subsurface Scattering Skin Shader
    // ------------------------------------------------------------------------
    function getSkinNormalMap() {
        return linearCanvasTex('aaa26-skin-norm', 256, 256, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let i = 0; i < 1600; i++) {
                const x = (i * 97) % w, y = (i * 53) % h;
                g.fillStyle = `rgb(${125 + (i % 7)},${125 + ((i * 3) % 7)},253)`;
                g.fillRect(x, y, 2, 2);
            }
        });
    }

    function getFabricNormalMap() {
        return linearCanvasTex('aaa26-fab-norm', 128, 128, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
                const odd = ((x + y) >> 2) & 1;
                g.fillStyle = odd ? 'rgb(138,122,248)' : 'rgb(118,134,248)';
                g.fillRect(x, y, 3, 3);
            }
        });
    }

    function getHairNormalMap() {
        return linearCanvasTex('aaa26-hair-norm', 128, 128, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let x = 0; x < w; x += 2) {
                const nx = Math.round(128 + Math.sin(x * 1.1) * 28);
                g.fillStyle = `rgb(${nx},128,246)`;
                g.fillRect(x, 0, 2, h);
            }
        });
    }

    // Inject Dead-or-Alive Soft-Engine Subsurface Scattering + Peach Fresnel Rim into PBR skin!
    function applySubsurfaceSkinShader(mat, sssHex) {
        const sssCol = new THREE.Color(sssHex);
        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uSSSColor = { value: sssCol };
            shader.fragmentShader = 'uniform vec3 uSSSColor;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `
                // Soft-Engine Subsurface Scattering (warm blood-scatter in midtone terminator + satin rim)
                float ndv = clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);
                float rim = pow(1.0 - ndv, 3.2);
                float luma = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
                float sssBand = smoothstep(0.08, 0.42, luma) * (1.0 - smoothstep(0.45, 0.85, luma));
                gl_FragColor.rgb += uSSSColor * (sssBand * 0.16 + rim * 0.11);
                #include <dithering_fragment>
                `
            );
        };
        mat.customProgramCacheKey = () => 'doa-sss-skin-v1';
    }

    function skinAlbedoTex(skinHex, blushHex) {
        return L.canvasTex('aaa26-skin:' + skinHex + ':' + blushHex, 512, 512, (g, w, h) => {
            // u=0/1 is +Z (front), u=0.5 is -Z (back); v=0 groin -> v=1 neck
            g.fillStyle = hexStr(skinHex);
            g.fillRect(0, 0, w, h);

            const blush = (x, y, rx, ry, a, col = blushHex) => {
                const rg = g.createRadialGradient(x, y, 4, x, y, rx);
                rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(255,120,110,0)');
                g.globalAlpha = a; g.fillStyle = rg;
                g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
            };
            // Rosy subsurface warmth at chest/cleavage (u=0 & u=1), shoulders & hips
            for (const fx of [0, w]) {
                blush(fx, h * 0.40, 95, 55, 0.20);
                blush(fx, h * 0.82, 110, 65, 0.12);
                // Crisp under-bust & cleavage AO shadow (v ~ 0.53 -> canvas y = h * (1 - 0.53) = 0.47)
                blush(fx, h * 0.46, 85, 24, 0.28, shadeHex(skinHex, -65));
                // Collarbone & athletic oblique definition
                g.strokeStyle = shadeHex(skinHex, -52);
                g.lineCap = 'round';
                g.globalAlpha = 0.34; g.lineWidth = 5;
                g.beginPath(); g.moveTo(fx - 46, h * 0.22); g.quadraticCurveTo(fx, h * 0.25, fx + 46, h * 0.22); g.stroke();
                g.globalAlpha = 0.24; g.lineWidth = 4;
                g.beginPath(); g.moveTo(fx, h * 0.44); g.lineTo(fx, h * 0.68); g.stroke();
                g.beginPath(); g.moveTo(fx - 38, h * 0.52); g.quadraticCurveTo(fx - 26, h * 0.64, fx - 18, h * 0.74); g.stroke();
                g.beginPath(); g.moveTo(fx + 38, h * 0.52); g.quadraticCurveTo(fx + 26, h * 0.64, fx + 18, h * 0.74); g.stroke();
                // Sculpted navel
                g.globalAlpha = 0.50; g.fillStyle = shadeHex(skinHex, -68);
                g.beginPath(); g.ellipse(fx, h * 0.695, 5, 8.5, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
            }
            // Spinal furrow & gluteal cleft AO at u = 0.5 (back)
            g.strokeStyle = shadeHex(skinHex, -55);
            g.globalAlpha = 0.32; g.lineWidth = 6;
            g.beginPath(); g.moveTo(w * 0.5, h * 0.24); g.lineTo(w * 0.5, h * 0.92); g.stroke();
            g.globalAlpha = 1;
        });
    }

    function hairAlbedoTex(hairHex, hiCol) {
        return L.canvasTex('aaa26-hair:' + hairHex + ':' + hiCol, 512, 512, (g, w, h) => {
            const gr = g.createLinearGradient(0, 0, 0, h);
            gr.addColorStop(0, shadeHex(hairHex, -38));
            gr.addColorStop(0.26, hexStr(hairHex));
            gr.addColorStop(0.42, shadeHex(hairHex, 22));
            gr.addColorStop(0.68, shadeHex(hairHex, -8));
            gr.addColorStop(1, shadeHex(hairHex, -45));
            g.fillStyle = gr; g.fillRect(0, 0, w, h);

            for (let x = 0; x < w; x += 2) {
                const v = Math.sin(x * 0.63) * 0.5 + 0.5;
                g.fillStyle = x % 4 === 0 ? `rgba(255,255,255,${v * 0.18})` : `rgba(0,0,0,${v * 0.22})`;
                g.fillRect(x, 0, 1.5, h);
            }
            for (const [yc, hh, al] of [[0.30, 0.11, 0.62], [0.68, 0.06, 0.28]]) {
                const halo = g.createLinearGradient(0, h * (yc - hh), 0, h * (yc + hh));
                halo.addColorStop(0, 'rgba(255,255,255,0)');
                halo.addColorStop(0.45, hiCol);
                halo.addColorStop(0.55, 'rgba(255,255,255,0.88)');
                halo.addColorStop(1, 'rgba(255,255,255,0)');
                g.globalAlpha = al; g.fillStyle = halo;
                g.fillRect(0, h * (yc - hh), w, h * hh * 2);
            }
            g.globalAlpha = 1;
        });
    }

    function fabricAlbedoTex(pattern, c1, c2) {
        const s1 = hexStr(c1), s2 = hexStr(c2);
        return L.canvasTex('aaa26-fab:' + pattern + ':' + s1 + ':' + s2, 512, 512, (g, w, h) => {
            g.fillStyle = s1; g.fillRect(0, 0, w, h);
            if (pattern === 'gingham') {
                g.fillStyle = s2; g.globalAlpha = 0.45;
                for (let i = 0; i < w; i += 48) { g.fillRect(i, 0, 24, h); g.fillRect(0, i, w, 24); }
                g.globalAlpha = 1;
                // Delicate top & bottom lace trim
                g.fillStyle = s2; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16);
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
                for (let y = 0; y < h; y += 36) g.fillRect(0, y, w, 13);
                g.fillStyle = '#f59e0b';
                for (let y = 13; y < h; y += 72) g.fillRect(0, y, w, 4);
            } else if (pattern === 'polka') {
                g.fillStyle = s2;
                for (let y = 24; y < h; y += 48) for (let x = 24; x < w; x += 48) {
                    g.beginPath(); g.arc(x + ((y / 48) % 2) * 24, y, 10, 0, TAU); g.fill();
                }
            } else if (pattern === 'stripe') {
                g.fillStyle = s2;
                for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 12, h);
                g.fillStyle = '#bef264';
                for (let x = 14; x < w; x += 40) g.fillRect(x, 0, 5, h);
            } else if (pattern === 'ombre') {
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0, s1); gr.addColorStop(0.5, s2); gr.addColorStop(1, '#581c87');
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
                g.strokeStyle = 'rgba(250,204,21,0.55)'; g.lineWidth = 3;
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
                g.strokeStyle = 'rgba(255,255,255,0.36)'; g.lineWidth = 2.5;
                for (let i = -h; i < w + h; i += 18) {
                    g.beginPath(); g.moveTo(i, 24); g.lineTo(i + h, h - 24); g.stroke();
                    g.beginPath(); g.moveTo(i + h, 24); g.lineTo(i, h - 24); g.stroke();
                }
            }
            // Border hem trim
            g.fillStyle = s2;
            g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
        });
    }

    /** Ultra-crisp 512x512 Dead-or-Alive / Stellar-Blade jewel anime face + glossy 3D cornea support */
    function faceOverlayTex(eyeCol, hairHex, blushCol, expr) {
        return L.canvasTex(`aaa26-face:${eyeCol}:${hairHex}:${expr}`, 512, 512, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            const browCol = shadeHex(hairHex, -38);

            // Soft rosy cheek & nose-tip blush
            const drawBlush = (cx, cy, rx, ry, al) => {
                const rg = g.createRadialGradient(cx, cy, 3, cx, cy, rx);
                rg.addColorStop(0, blushCol); rg.addColorStop(1, 'rgba(255,100,140,0)');
                g.globalAlpha = al; g.fillStyle = rg;
                g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
            };
            drawBlush(120, 322, 60, 28, expr === 'happy' ? 0.72 : 0.45);
            drawBlush(392, 322, 60, 28, expr === 'happy' ? 0.72 : 0.45);
            drawBlush(256, 312, 22, 12, 0.25);

            g.lineCap = 'round'; g.lineJoin = 'round';
            if (expr === 'happy') {
                for (const cx of [158, 354]) {
                    const dir = cx < 256 ? -1 : 1;
                    g.strokeStyle = '#11061c'; g.lineWidth = 21;
                    g.beginPath(); g.moveTo(cx - 52, 260); g.quadraticCurveTo(cx, 188, cx + 52, 260); g.stroke();
                    g.lineWidth = 11;
                    g.beginPath(); g.moveTo(cx + dir * 48, 252); g.lineTo(cx + dir * 70, 228); g.stroke();
                    g.fillStyle = '#fef08a'; g.beginPath(); g.arc(cx + dir * 66, 204, 8.5, 0, TAU); g.fill();
                }
                g.strokeStyle = browCol; g.lineWidth = 10;
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
                    g.beginPath(); g.moveTo(cx + dir * 46, 254); g.lineTo(cx + dir * 66, 242); g.stroke();
                }
                g.strokeStyle = browCol; g.lineWidth = 10;
                for (const cx of [158, 354]) { g.beginPath(); g.moveTo(cx - 42, 162); g.quadraticCurveTo(cx, 144, cx + 42, 162); g.stroke(); }
                g.fillStyle = 'rgba(225, 58, 114, 0.82)';
                g.beginPath(); g.ellipse(256, 378, 34, 13, 0, 0, TAU); g.fill();
                g.strokeStyle = '#881337'; g.lineWidth = 7;
                g.beginPath(); g.moveTo(222, 372); g.quadraticCurveTo(256, 392, 290, 372); g.stroke();
            } else {
                for (const cx of [158, 354]) {
                    const dir = cx < 256 ? -1 : 1;
                    // Crisp white sclera + upper-lash AO shadow
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(cx, 248, 54, 62, 0, 0, TAU); g.fill();
                    g.fillStyle = 'rgba(51, 65, 85, 0.36)';
                    g.beginPath(); g.ellipse(cx, 214, 52, 28, 0, 0, TAU); g.fill();

                    // Multi-ring jewel iris with radial starlight fibers
                    const ig = g.createLinearGradient(0, 194, 0, 306);
                    ig.addColorStop(0, '#070312');
                    ig.addColorStop(0.28, eyeCol);
                    ig.addColorStop(0.76, eyeCol);
                    ig.addColorStop(1, '#ffffff');
                    g.fillStyle = ig;
                    g.beginPath(); g.ellipse(cx, 254, 42, 53, 0, 0, TAU); g.fill();

                    // Radial iris spokes
                    g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 2;
                    for (let k = 0; k < 12; k++) {
                        const a = k * TAU / 12;
                        g.beginPath();
                        g.moveTo(cx + Math.cos(a) * 18, 254 + Math.sin(a) * 22);
                        g.lineTo(cx + Math.cos(a) * 36, 254 + Math.sin(a) * 46);
                        g.stroke();
                    }

                    // Lower caustic glow + dark limbal ring + deep pupil
                    g.fillStyle = 'rgba(255,255,255,0.62)';
                    g.beginPath(); g.ellipse(cx, 284, 26, 14, 0, 0, TAU); g.fill();
                    g.strokeStyle = '#070312'; g.lineWidth = 7;
                    g.beginPath(); g.ellipse(cx, 254, 42, 53, 0, 0, TAU); g.stroke();
                    g.fillStyle = '#070312';
                    g.beginPath(); g.ellipse(cx, 254, 18, 25, 0, 0, TAU); g.fill();

                    // Triple studio catchlights
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(cx - 16, 222, 16, 17, -0.25, 0, TAU); g.fill();
                    g.beginPath(); g.arc(cx + 17, 278, 9, 0, TAU); g.fill();
                    g.beginPath(); g.arc(cx + 14, 230, 5.5, 0, TAU); g.fill();

                    // Bold lush upper eyelashes + winged outer flicks + double eyelid crease
                    g.strokeStyle = '#090314'; g.lineWidth = 23;
                    g.beginPath(); g.ellipse(cx, 248, 56, 62, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
                    g.lineWidth = 11;
                    g.beginPath(); g.moveTo(cx + dir * 50, 222); g.lineTo(cx + dir * 76, 196); g.stroke();
                    g.beginPath(); g.moveTo(cx + dir * 52, 238); g.lineTo(cx + dir * 70, 226); g.stroke();
                    g.strokeStyle = 'rgba(75, 35, 25, 0.70)'; g.lineWidth = 5;
                    g.beginPath(); g.ellipse(cx, 232, 59, 66, 0, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
                    g.strokeStyle = 'rgba(9, 3, 20, 0.72)'; g.lineWidth = 5.5;
                    g.beginPath(); g.ellipse(cx, 250, 52, 58, 0, Math.PI * 0.22, Math.PI * 0.78); g.stroke();
                }
                g.strokeStyle = browCol; g.lineWidth = 11;
                for (const cx of [158, 354]) {
                    g.beginPath(); g.moveTo(cx - 44, 156); g.quadraticCurveTo(cx, 134, cx + 44, 154); g.stroke();
                }
                // Cute nose highlight/shadow + luscious glossy Cupid's-bow lips
                g.fillStyle = 'rgba(105, 48, 35, 0.42)';
                g.beginPath(); g.moveTo(256, 300); g.lineTo(247, 322); g.lineTo(261, 324); g.closePath(); g.fill();
                g.fillStyle = 'rgba(255,255,255,0.65)';
                g.beginPath(); g.arc(255, 314, 4, 0, TAU); g.fill();

                const lg = g.createLinearGradient(0, 354, 0, 400);
                lg.addColorStop(0, 'rgba(225, 48, 108, 0.85)');
                lg.addColorStop(1, 'rgba(244, 88, 124, 0.92)');
                g.fillStyle = lg;
                g.beginPath(); g.ellipse(256, 378, 35, 15, 0, 0, TAU); g.fill();
                g.strokeStyle = '#7f1d3a'; g.lineWidth = 7;
                g.beginPath(); g.moveTo(220, 372); g.quadraticCurveTo(256, 394, 292, 372); g.stroke();
                g.fillStyle = 'rgba(255, 245, 250, 0.95)';
                g.beginPath(); g.ellipse(256, 386, 17, 5, 0, 0, TAU); g.fill();
            }
        });
    }

    // ------------------------------------------------------------------------
    // Coupled 3-Axis Soft-Engine Spring-Damper Solver
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
            roughness: 0.40,
            metalness: 0.01,
            clearcoat: 0.28,
            clearcoatRoughness: 0.32,
            sheen: 0.22,
            sheenColor: new THREE.Color(d.blush),
            sheenRoughness: 0.52,
            envMap: env,
            envMapIntensity: 0.72,
            emissive: 0x000000
        }));
        applySubsurfaceSkinShader(skinM, d.blush);

        const hairM = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: hairAlbedoTex(d.hair, d.hairHi),
            normalMap: getHairNormalMap(),
            normalScale: new THREE.Vector2(0.32, 0.32),
            roughness: 0.26,
            metalness: 0.10,
            clearcoat: 0.62,
            clearcoatRoughness: 0.20,
            envMap: env,
            envMapIntensity: 0.85,
            emissive: 0x000000
        }));

        const suit1 = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: fabricAlbedoTex(d.pattern, d.c1, d.c2),
            normalMap: getFabricNormalMap(),
            normalScale: new THREE.Vector2(0.28, 0.28),
            roughness: 0.36,
            metalness: 0.06,
            sheen: 0.30,
            sheenColor: new THREE.Color(d.c2),
            sheenRoughness: 0.44,
            side: THREE.DoubleSide,
            envMap: env,
            envMapIntensity: 0.80,
            emissive: 0x000000
        }));

        const suit2 = push(new THREE.MeshPhysicalMaterial({
            color: d.c2,
            normalMap: getFabricNormalMap(),
            normalScale: new THREE.Vector2(0.22, 0.22),
            roughness: 0.40,
            metalness: 0.05,
            envMap: env,
            envMapIntensity: 0.70,
            emissive: 0x000000
        }));

        const metalM = push(new THREE.MeshStandardMaterial({
            color: d.metal, roughness: 0.14, metalness: 0.95, envMap: env, envMapIntensity: 1.45, emissive: 0x000000
        }));

        const accM = push(new THREE.MeshPhysicalMaterial({
            color: d.accC, roughness: 0.28, metalness: 0.10, clearcoat: 0.42, envMap: env, envMapIntensity: 0.85, emissive: 0x000000
        }));

        const nailM = push(new THREE.MeshPhysicalMaterial({
            color: d.nail || d.c1, roughness: 0.08, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.05, envMap: env, envMapIntensity: 1.2, emissive: 0x000000
        }));

        const corneaM = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, roughness: 0.02, metalness: 0.0, transparent: true, opacity: 0.28,
            clearcoat: 1.0, clearcoatRoughness: 0.02, envMap: env, envMapIntensity: 1.8, depthWrite: false
        });

        return { skinM, hairM, suit1, suit2, metalM, accM, nailM, corneaM, env };
    }

    BO.BeachAnatomy = {
        BONE, createSkeleton, getSkinnedBodyGeo, getSkinnedSuitGeo, getStaticGeos,
        getEnvMap, createMaterials, fabricAlbedoTex, faceOverlayTex,
        makeSpring, stepSpring, hexStr, shadeHex, clamp, lerp
    };
})(window);
