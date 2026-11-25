/* ============================================================================
   BLACKOUT OPS — Sweetheart Shore AAA Parametric Anatomy & Shader Engine
   True asymmetric 3D parametric sculpted meshes (S-curve spine, clavicles,
   hourglass waist, contoured limbs, 3D sculpted anime face with nose/lips/
   cheekbones/recessed glossy eyes, volumetric hair ribbons), MeshPhysicalMaterial
   subsurface-style skin/hair/fabric shaders with procedural 512x512 albedo &
   normal maps, and coupled 2nd-order spring-damper soft-tissue physics.
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

    // ------------------------------------------------------------------------
    // True Asymmetric 3D Parametric Surface Sculptor
    // evalRing(v, theta) -> [x, y, z] where v in [0,1], theta in [0, TAU]
    // theta = 0 is +Z (front), PI/2 is +X (left), PI is -Z (back)
    // ------------------------------------------------------------------------
    function sculptSurface(slices, radialSegs, evalPt) {
        const pos = [];
        const uvs = [];
        const idx = [];
        const cols = radialSegs + 1;
        for (let iy = 0; iy <= slices; iy++) {
            const v = iy / slices;
            for (let ix = 0; ix <= radialSegs; ix++) {
                const u = ix / radialSegs;
                const th = u * TAU;
                const p = evalPt(v, th);
                pos.push(p[0], p[1], p[2]);
                uvs.push(u, v);
            }
        }
        for (let iy = 0; iy < slices; iy++) {
            for (let ix = 0; ix < radialSegs; ix++) {
                const a = iy * cols + ix;
                const b = a + 1;
                const c = (iy + 1) * cols + ix;
                const d = c + 1;
                idx.push(a, c, b, b, c, d);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        return geo;
    }

    function smoothstep(e0, e1, x) {
        const t = clamp((x - e0) / (e1 - e0), 0, 1);
        return t * t * (3 - 2 * t);
    }
    function gauss(x, mu, sig) {
        const d = (x - mu) / sig;
        return Math.exp(-0.5 * d * d);
    }

    // ------------------------------------------------------------------------
    // Cached AAA Sculpted Anatomical Geometries
    // ------------------------------------------------------------------------
    const GEO = {};

    function getGeos() {
        if (GEO.ready) return GEO;
        GEO.ready = true;

        // 1. SCULPTED TORSO (y = -0.06 pelvis root -> y = 0.495 neck base)
        // Includes lumbar S-curve lordosis, spinal furrow, clavicles, sternum hollow,
        // subtle athletic abs/obliques, hourglass waist, and ribcage flare.
        GEO.torso = sculptSurface(26, 28, (v, th) => {
            const y = lerp(-0.06, 0.495, v);
            const sinT = Math.sin(th); // +X = left, -X = right
            const cosT = Math.cos(th); // +Z = front, -Z = back
            const front = Math.max(0, cosT);
            const back = Math.max(0, -cosT);
            const side = Math.abs(sinT);

            // Base hourglass width (rx) and depth (rz)
            let rx = 0.148 * gauss(v, 0.08, 0.16)
                   + 0.096 * gauss(v, 0.38, 0.18)
                   + 0.138 * gauss(v, 0.74, 0.22)
                   + 0.155 * gauss(v, 0.87, 0.09)
                   + 0.044 * gauss(v, 1.0, 0.08);
            // Normalize smooth envelope cleanly
            const wHip = smoothstep(0.0, 0.14, v) * (1 - smoothstep(0.14, 0.42, v));
            const wWaist = gauss(v, 0.39, 0.14);
            const wRib = gauss(v, 0.68, 0.18);
            const wSh = gauss(v, 0.86, 0.09);
            const wNeck = smoothstep(0.88, 1.0, v);

            rx = lerp(0.105, 0.156, smoothstep(0.0, 0.12, v));
            rx = lerp(rx, 0.098, smoothstep(0.14, 0.39, v));     // narrow sculpted waist
            rx = lerp(rx, 0.132, smoothstep(0.41, 0.68, v));     // ribcage
            rx = lerp(rx, 0.156, smoothstep(0.68, 0.85, v));     // feminine shoulder/clavicle
            rx = lerp(rx, 0.045, smoothstep(0.86, 0.99, v));     // trapezius -> neck root

            let rz = lerp(0.095, 0.118, smoothstep(0.0, 0.12, v));
            rz = lerp(rz, 0.080, smoothstep(0.14, 0.39, v));
            rz = lerp(rz, 0.106, smoothstep(0.41, 0.68, v));
            rz = lerp(rz, 0.088, smoothstep(0.68, 0.86, v));
            rz = lerp(rz, 0.044, smoothstep(0.86, 0.99, v));

            // Natural S-curve spine (lumbar lordosis at waist, gentle thoracic arch)
            const spineZ = 0.016 * gauss(v, 0.36, 0.16) - 0.014 * gauss(v, 0.72, 0.18);

            // Spinal furrow indent along center back
            const spineFurrow = -0.011 * Math.pow(back, 5) * smoothstep(0.08, 0.25, v) * (1 - smoothstep(0.82, 0.95, v));

            // Subtle athletic abdominal linea alba + gentle lower-belly softness
            const lineaAlba = -0.004 * Math.pow(front, 6) * gauss(v, 0.35, 0.15);
            const softBelly = 0.009 * Math.pow(front, 2.2) * gauss(v, 0.20, 0.10);

            // Sternum hollow & subtle collarbone ridge
            const sternum = -0.006 * Math.pow(front, 5) * gauss(v, 0.66, 0.10);
            const clavicle = 0.007 * front * Math.pow(side, 1.5) * gauss(v, 0.85, 0.035);

            // Subtle shoulder blade contours on upper back
            const scapula = 0.006 * back * Math.sin(side * Math.PI) * gauss(v, 0.74, 0.09);

            const rMod = spineFurrow + lineaAlba + softBelly + sternum + clavicle + scapula;
            const x = (rx + rMod * 0.4) * sinT;
            const z = (rz + rMod) * cosT + spineZ;
            return [x, y, z];
        });

        // 2. SCULPTED PELVIS & GLUTES (y = -0.11 -> y = 0.075)
        // Smooth organic hip curve + sculpted dual glute fullness + subtle cleft
        GEO.pelvis = sculptSurface(16, 26, (v, th) => {
            const y = lerp(-0.105, 0.075, v);
            const sinT = Math.sin(th);
            const cosT = Math.cos(th);
            const front = Math.max(0, cosT);
            const back = Math.max(0, -cosT);
            const side = Math.abs(sinT);

            // Smooth elliptical pelvis silhouette tapering cleanly at bottom & matching torso at top
            let rx = 0.032 + 0.128 * Math.pow(Math.sin(v * Math.PI * 0.88 + 0.12), 0.72);
            let rz = 0.028 + 0.086 * Math.pow(Math.sin(v * Math.PI * 0.88 + 0.12), 0.78);

            // Sculpted dual glute fullness (peaking around theta = PI ± 0.55) with natural cleft at PI
            const gluteLobes = Math.pow(back, 1.6) * (0.45 + 0.55 * Math.sin(side * Math.PI)) * gauss(v, 0.46, 0.26);
            const cleft = -0.018 * Math.pow(back, 8) * gauss(v, 0.45, 0.25);
            const frontSlope = 0.008 * Math.pow(front, 2) * gauss(v, 0.62, 0.22);

            const x = rx * sinT;
            const z = (rz + gluteLobes * 0.036 + cleft + frontSlope) * cosT - gluteLobes * 0.012;
            return [x, y, z];
        });

        // 3. TRUE ASYMMETRIC TEARDROP BUST (gentle upper slope, fuller lower pole, natural gravity!)
        const makeBustGeo = (inflate = 0) => sculptSurface(16, 22, (v, th) => {
            // v=0 is chest wall root, v=1 is apex (+Z)
            const sinT = Math.sin(th); // X
            const cosT = Math.cos(th); // Y (+cosT = top slope, -cosT = fuller lower pole)
            const r = (0.068 + inflate) * Math.sin(v * Math.PI * 0.52 + 0.02);
            const z = (0.072 + inflate * 0.8) * Math.pow(Math.sin(v * Math.PI * 0.5), 0.85);
            // Gravity teardrop droop: lower pole is fuller & sits slightly lower, upper slope tapers smoothly
            const dropY = -0.016 * Math.pow(v, 1.5);
            const lowerFull = cosT < 0 ? 1.12 : 0.88;
            const x = r * sinT * 1.04;
            const y = r * cosT * lowerFull + dropY;
            return [x, y, z];
        });
        GEO.bustSkin = makeBustGeo(0);
        GEO.bustCup = makeBustGeo(0.0032); // tailored swimsuit cup offset +3.2mm over skin

        // 4. SCULPTED GLUTE SOFT-TISSUE CUSHION (blends organically into pelvis for spring physics)
        GEO.gluteSoft = new THREE.SphereGeometry(0.086, 18, 14);
        GEO.gluteSoft.scale(1.06, 1.12, 0.88);

        // 5. SCULPTED ANATOMICAL THIGH (y = +0.02 hip -> y = -0.425 knee)
        // Real quadriceps curve in front, hamstring sweep in back, inner-thigh taper
        GEO.thigh = sculptSurface(18, 20, (v, th) => {
            const y = lerp(0.02, -0.425, v);
            const sinT = Math.sin(th);
            const cosT = Math.cos(th);
            const front = Math.max(0, cosT);
            const back = Math.max(0, -cosT);
            let r = lerp(0.092, 0.050, Math.pow(v, 0.82));
            r *= 1 - 0.28 * gauss(v, 0.0, 0.06); // smooth hip socket cap
            const quad = 0.011 * front * gauss(v, 0.38, 0.24);
            const ham = 0.009 * back * gauss(v, 0.28, 0.22);
            const knee = 0.004 * front * gauss(v, 0.94, 0.06);
            return [r * sinT * 0.96, y, (r + quad + ham + knee) * cosT];
        });

        // 6. SCULPTED ANATOMICAL CALF (y = +0.01 knee -> y = -0.405 ankle)
        // Asymmetric gastrocnemius curve tapering to slender Achilles & ankle
        GEO.calf = sculptSurface(18, 20, (v, th) => {
            const y = lerp(0.01, -0.405, v);
            const sinT = Math.sin(th);
            const cosT = Math.cos(th);
            const back = Math.max(0, -cosT);
            const front = Math.max(0, cosT);
            let r = lerp(0.050, 0.032, smoothstep(0.0, 0.92, v));
            const gastro = 0.018 * (0.45 + 0.55 * back) * gauss(v, 0.30, 0.16);
            const shin = 0.004 * Math.pow(front, 3) * gauss(v, 0.55, 0.28);
            const ankleBone = 0.004 * Math.abs(sinT) * gauss(v, 0.94, 0.05);
            return [(r + gastro * 0.55 + ankleBone) * sinT, y, (r + gastro + shin) * cosT - gastro * 0.25];
        });

        // 7. SCULPTED UPPER ARM & FOREARM
        GEO.upperArm = sculptSurface(14, 16, (v, th) => {
            const y = lerp(0.02, -0.268, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            let r = lerp(0.048, 0.033, v);
            const delt = 0.008 * gauss(v, 0.14, 0.12);
            const bicep = 0.004 * Math.max(0, cosT) * gauss(v, 0.5, 0.22);
            return [(r + delt) * sinT, y, (r + delt * 0.8 + bicep) * cosT];
        });
        GEO.forearm = sculptSurface(14, 16, (v, th) => {
            const y = lerp(0.01, -0.242, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            let r = lerp(0.036, 0.022, Math.pow(v, 0.9));
            const muscle = 0.005 * gauss(v, 0.25, 0.18);
            return [(r + muscle) * sinT * 1.04, y, (r + muscle * 0.7) * cosT * 0.92];
        });

        // 8. SCULPTED NECK (slender feminine neck with subtle sternocleidomastoid taper)
        GEO.neck = sculptSurface(10, 18, (v, th) => {
            const y = lerp(0.0, 0.112, v);
            const r = lerp(0.047, 0.039, smoothstep(0, 0.45, v)) + 0.005 * smoothstep(0.75, 1.0, v);
            return [r * Math.sin(th), y, r * Math.cos(th) * 0.96];
        });

        // 9. TRUE 3D SCULPTED ANIME-SEMI-REALISTIC HEAD (Dead or Alive / FF7R proportions!)
        // Sculpted cranium, delicate V-tapered jawline & chin, cheekbones, subtle eye sockets,
        // 3D sculpted nose bridge & cute upturned tip, and 3D sculpted lips!
        GEO.head = sculptSurface(26, 32, (v, th) => {
            const y = lerp(-0.012, 0.295, v);
            const sinT = Math.sin(th);
            const cosT = Math.cos(th);
            const front = Math.max(0, cosT);
            const side = Math.abs(sinT);

            // Base anime head silhouette (pointed soft chin -> plump cheeks -> full cranium)
            let rx = 0.138 * Math.pow(Math.sin(clamp(v, 0.001, 0.999) * Math.PI), 0.56);
            if (v < 0.32) rx *= lerp(0.45, 1.0, smoothstep(0.0, 0.32, v)); // delicate V-jawline
            let rz = rx * 0.96;

            // Subtle eye-socket recess (left & right around theta = ±0.42, v = 0.46)
            const eyeL = gauss(th, 0.40, 0.22) + gauss(th, TAU - 0.40, 0.22);
            const eyeSock = -0.010 * eyeL * gauss(v, 0.47, 0.075);

            // Cheekbone fullness beneath eyes
            const cheek = 0.008 * (gauss(th, 0.62, 0.26) + gauss(th, TAU - 0.62, 0.26)) * gauss(v, 0.35, 0.09);

            // Cute 3D sculpted nose bridge & upturned tip (center front, v = 0.36..0.46)
            const noseCenter = Math.pow(front, 18);
            const noseTip = 0.018 * noseCenter * gauss(v, 0.365, 0.032);
            const noseBridge = 0.008 * Math.pow(front, 14) * gauss(v, 0.43, 0.055);

            // Sculpted 3D lips (upper Cupid's bow + fuller lower lip, v = 0.22..0.28)
            const mouthWidth = Math.pow(front, 10);
            const upperLip = 0.007 * mouthWidth * gauss(v, 0.258, 0.016);
            const lowerLip = 0.009 * mouthWidth * gauss(v, 0.226, 0.018);
            const philtrum = -0.003 * noseCenter * gauss(v, 0.30, 0.025);

            // Slight chin forward projection
            const chin = 0.006 * Math.pow(front, 6) * gauss(v, 0.09, 0.05);

            const zMod = eyeSock + cheek + noseTip + noseBridge + upperLip + lowerLip + philtrum + chin;
            const x = (rx + cheek * 0.4) * sinT;
            const z = (rz + zMod) * cosT;
            return [x, y, z];
        });

        // 10. VOLUMETRIC CURVED HAIR RIBBONS & LOCKS (zero cones!)
        const makeHairRibbon = (len, wBase, curveOut, curlEnd) => {
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, -len * 0.28, curveOut),
                new THREE.Vector3(0, -len * 0.65, curveOut * 1.15),
                new THREE.Vector3(curlEnd, -len, curveOut * 0.65)
            ];
            const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, wBase, 8, false);
            const p = geo.attributes.position;
            for (let i = 0; i < p.count; i++) {
                const y = p.getY(i);
                const t = clamp(-y / len, 0, 1);
                const taper = Math.sin(t * Math.PI * 0.85 + 0.15) * (1 - t * 0.78);
                p.setX(i, p.getX(i) * (0.45 + taper * 1.35));
            }
            geo.computeVertexNormals();
            return geo;
        };
        GEO.bangMain = makeHairRibbon(0.155, 0.019, 0.026, 0.0);
        GEO.bangSide = makeHairRibbon(0.195, 0.020, 0.024, 0.022);
        GEO.hairLock = makeHairRibbon(0.24, 0.024, 0.018, 0.012);

        // Multi-segment tapered hair chain locks
        GEO.hairSeg = sculptSurface(10, 12, (v, th) => {
            const y = lerp(0.01, -0.135, v);
            const r = 0.044 * (0.65 + 0.35 * Math.sin(v * Math.PI)) * (1 - v * 0.22);
            return [r * Math.sin(th) * 1.12, y, r * Math.cos(th) * 0.78];
        });
        GEO.hairTip = sculptSurface(12, 12, (v, th) => {
            const y = lerp(0.01, -0.175, v);
            const r = 0.040 * Math.pow(1 - v, 0.85);
            const curlX = Math.sin(v * Math.PI) * 0.016;
            return [r * Math.sin(th) * 1.1 + curlX, y, r * Math.cos(th) * 0.75];
        });

        // Cached small accessory & anatomical detail geometries (huge draw-call/memory win)
        GEO.eyeBall = new THREE.SphereGeometry(0.022, 16, 12);
        GEO.cornea = new THREE.SphereGeometry(0.0232, 16, 12);
        GEO.ear = new THREE.SphereGeometry(0.024, 10, 8); GEO.ear.scale(0.38, 1.22, 0.82);
        GEO.nail = new THREE.SphereGeometry(0.0046, 6, 4); GEO.nail.scale(1.1, 0.45, 1.4);

        return GEO;
    }

    // ------------------------------------------------------------------------
    // Procedural 512x512 Skin, Hair, Fabric & Eye Textures + Normal Maps
    // ------------------------------------------------------------------------
    let sharedSkinNorm = null;
    function getSkinNormalMap() {
        if (sharedSkinNorm) return sharedSkinNorm;
        sharedSkinNorm = L.canvasTex('aaa-skin-norm', 256, 256, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)';
            g.fillRect(0, 0, w, h);
            // Subtle satin micro-pore normal variation (prevents plastic look)
            for (let i = 0; i < 1800; i++) {
                const x = (i * 97) % w, y = (i * 53) % h;
                const dx = 124 + (i % 9);
                const dy = 124 + ((i * 3) % 9);
                g.fillStyle = `rgb(${dx},${dy},252)`;
                g.fillRect(x, y, 2, 2);
            }
        });
        sharedSkinNorm.wrapS = sharedSkinNorm.wrapT = THREE.RepeatWrapping;
        sharedSkinNorm.repeat.set(3, 3);
        return sharedSkinNorm;
    }

    let sharedFabricNorm = null;
    function getFabricNormalMap() {
        if (sharedFabricNorm) return sharedFabricNorm;
        sharedFabricNorm = L.canvasTex('aaa-fab-norm', 128, 128, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
                const odd = ((x + y) >> 2) & 1;
                g.fillStyle = odd ? 'rgb(138,124,248)' : 'rgb(118,132,248)';
                g.fillRect(x, y, 3, 3);
            }
        });
        sharedFabricNorm.wrapS = sharedFabricNorm.wrapT = THREE.RepeatWrapping;
        sharedFabricNorm.repeat.set(6, 6);
        return sharedFabricNorm;
    }

    let sharedHairNorm = null;
    function getHairNormalMap() {
        if (sharedHairNorm) return sharedHairNorm;
        sharedHairNorm = L.canvasTex('aaa-hair-norm', 128, 128, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let x = 0; x < w; x += 2) {
                const nx = Math.round(128 + Math.sin(x * 1.1) * 26);
                g.fillStyle = `rgb(${nx},128,245)`;
                g.fillRect(x, 0, 2, h);
            }
        });
        sharedHairNorm.wrapS = sharedHairNorm.wrapT = THREE.RepeatWrapping;
        sharedHairNorm.repeat.set(2, 1);
        return sharedHairNorm;
    }

    function skinAlbedoTex(skinHex, blushHex) {
        return L.canvasTex('aaa-skin:' + skinHex + ':' + blushHex, 512, 512, (g, w, h) => {
            const gr = g.createLinearGradient(0, 0, 0, h);
            gr.addColorStop(0, shadeHex(skinHex, 10));
            gr.addColorStop(0.45, hexStr(skinHex));
            gr.addColorStop(1, shadeHex(skinHex, -8));
            g.fillStyle = gr; g.fillRect(0, 0, w, h);

            // Warm subsurface blush zones (shoulders, clavicles, sternum, hips)
            const blush = (x, y, rx, ry, a) => {
                const rg = g.createRadialGradient(x, y, 4, x, y, rx);
                rg.addColorStop(0, blushHex); rg.addColorStop(1, 'rgba(255,140,130,0)');
                g.globalAlpha = a; g.fillStyle = rg;
                g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
            };
            blush(w * 0.5, h * 0.16, 120, 48, 0.12);
            blush(w * 0.5, h * 0.55, 140, 80, 0.08);

            // Subtle anatomical shading (clavicle highlight, sternum shadow, soft athletic abs & navel)
            g.strokeStyle = shadeHex(skinHex, -24);
            g.globalAlpha = 0.26; g.lineWidth = 4; g.lineCap = 'round';
            // Collarbones
            g.beginPath(); g.moveTo(w * 0.30, h * 0.15); g.quadraticCurveTo(w * 0.42, h * 0.18, w * 0.48, h * 0.17); g.stroke();
            g.beginPath(); g.moveTo(w * 0.70, h * 0.15); g.quadraticCurveTo(w * 0.58, h * 0.18, w * 0.52, h * 0.17); g.stroke();
            // Subtle linea alba & oblique lines
            g.lineWidth = 3; g.globalAlpha = 0.16;
            g.beginPath(); g.moveTo(w * 0.5, h * 0.38); g.lineTo(w * 0.5, h * 0.65); g.stroke();
            g.beginPath(); g.moveTo(w * 0.38, h * 0.46); g.quadraticCurveTo(w * 0.41, h * 0.62, w * 0.44, h * 0.72); g.stroke();
            g.beginPath(); g.moveTo(w * 0.62, h * 0.46); g.quadraticCurveTo(w * 0.59, h * 0.62, w * 0.56, h * 0.72); g.stroke();
            // Delicate navel
            g.globalAlpha = 0.32; g.fillStyle = shadeHex(skinHex, -38);
            g.beginPath(); g.ellipse(w * 0.5, h * 0.70, 5, 8, 0, 0, TAU); g.fill();
            g.globalAlpha = 1;
        });
    }

    function hairAlbedoTex(hairHex, hiCol) {
        return L.canvasTex('aaa-hair:' + hairHex + ':' + hiCol, 512, 512, (g, w, h) => {
            const gr = g.createLinearGradient(0, 0, 0, h);
            gr.addColorStop(0, shadeHex(hairHex, -24));
            gr.addColorStop(0.24, hexStr(hairHex));
            gr.addColorStop(0.38, shadeHex(hairHex, 26));
            gr.addColorStop(0.62, hexStr(hairHex));
            gr.addColorStop(0.84, shadeHex(hairHex, 12));
            gr.addColorStop(1, shadeHex(hairHex, -28));
            g.fillStyle = gr; g.fillRect(0, 0, w, h);

            // Fine multi-tone silk hair fibers
            for (let x = 0; x < w; x += 2) {
                const v = Math.sin(x * 0.63) * 0.5 + 0.5;
                g.fillStyle = x % 4 === 0 ? `rgba(255,255,255,${v * 0.16})` : `rgba(0,0,0,${v * 0.14})`;
                g.fillRect(x, 0, 1.5, h);
            }
            // Dual anime "angel-ring" anisotropic specular bands
            for (const [yc, hh, al] of [[0.30, 0.14, 0.52], [0.68, 0.08, 0.24]]) {
                const halo = g.createLinearGradient(0, h * (yc - hh), 0, h * (yc + hh));
                halo.addColorStop(0, 'rgba(255,255,255,0)');
                halo.addColorStop(0.45, hiCol);
                halo.addColorStop(0.55, 'rgba(255,255,255,0.78)');
                halo.addColorStop(1, 'rgba(255,255,255,0)');
                g.globalAlpha = al; g.fillStyle = halo;
                g.fillRect(0, h * (yc - hh), w, h * hh * 2);
            }
            g.globalAlpha = 1;
        });
    }

    function fabricAlbedoTex(pattern, c1, c2) {
        const s1 = hexStr(c1), s2 = hexStr(c2);
        return L.canvasTex('aaa-fab:' + pattern + ':' + s1 + ':' + s2, 512, 512, (g, w, h) => {
            g.fillStyle = s1; g.fillRect(0, 0, w, h);
            if (pattern === 'gingham') {
                g.fillStyle = s2; g.globalAlpha = 0.52;
                for (let i = 0; i < w; i += 48) { g.fillRect(i, 0, 24, h); g.fillRect(0, i, w, 24); }
                g.globalAlpha = 1;
                // Fine white stitching lines
                g.strokeStyle = 'rgba(255,255,255,0.5)'; g.setLineDash([6, 6]); g.lineWidth = 2;
                for (let i = 24; i < w; i += 48) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); }
                g.setLineDash([]);
            } else if (pattern === 'hibiscus') {
                const drawFl = (cx, cy, r) => {
                    g.fillStyle = s2;
                    for (let k = 0; k < 5; k++) {
                        const a = k * TAU / 5;
                        g.beginPath(); g.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.52, r * 0.36, a, 0, TAU); g.fill();
                    }
                    g.fillStyle = '#dc2626'; g.beginPath(); g.arc(cx, cy, r * 0.24, 0, TAU); g.fill();
                    g.fillStyle = '#fef08a'; g.beginPath(); g.arc(cx, cy, r * 0.10, 0, TAU); g.fill();
                };
                for (let y = 48; y < h; y += 96) for (let x = 48; x < w; x += 96) drawFl(x + ((y / 96) % 2) * 48, y, 34);
                // Tropical palm leaf silhouettes
                g.fillStyle = 'rgba(255,255,255,0.14)';
                for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse((i * 83) % w, (i * 61) % h, 26, 8, i * 0.7, 0, TAU); g.fill(); }
            } else if (pattern === 'nautical') {
                g.fillStyle = s2;
                for (let y = 0; y < h; y += 36) g.fillRect(0, y, w, 14);
                g.fillStyle = '#fbbf24';
                for (let y = 14; y < h; y += 72) g.fillRect(0, y, w, 2.5);
            } else if (pattern === 'polka') {
                g.fillStyle = s2;
                for (let y = 24; y < h; y += 48) for (let x = 24; x < w; x += 48) {
                    g.beginPath(); g.arc(x + ((y / 48) % 2) * 24, y, 10, 0, TAU); g.fill();
                }
            } else if (pattern === 'stripe') {
                g.fillStyle = s2;
                for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 10, h);
                g.fillStyle = 'rgba(255,255,255,0.28)';
                for (let x = 14; x < w; x += 40) g.fillRect(x, 0, 4, h);
            } else if (pattern === 'ombre') {
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0, s1); gr.addColorStop(0.5, s2); gr.addColorStop(1, s1);
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
                g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 3;
                for (let y = 24; y < h; y += 36) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.33, y - 14, w * 0.66, y + 14, w, y); g.stroke(); }
            } else if (pattern === 'shell') {
                g.strokeStyle = s2; g.lineWidth = 4;
                for (let y = 0; y <= h; y += 44) for (let x = 0; x <= w; x += 44) {
                    g.beginPath(); g.arc(x + ((y / 44) % 2) * 22, y, 22, Math.PI, TAU); g.stroke();
                }
            } else if (pattern === 'mesh') {
                g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 2;
                for (let i = -h; i < w + h; i += 18) {
                    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke();
                    g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke();
                }
            }
            // Fine satin rib texture
            g.fillStyle = 'rgba(255,255,255,0.06)';
            for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
        });
    }

    /** 512x512 Dead-or-Alive-style jewel anime face texture (works seamlessly over 3D sculpted head) */
    function faceOverlayTex(eyeCol, hairHex, blushCol, expr) {
        return L.canvasTex(`aaa-face:${eyeCol}:${hairHex}:${expr}`, 512, 512, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            const browCol = shadeHex(hairHex, -22);

            // Airbrushed rosy cheek blush + subtle highlight
            const drawBlush = (cx, cy, al) => {
                const rg = g.createRadialGradient(cx, cy, 4, cx, cy, 52);
                rg.addColorStop(0, blushCol); rg.addColorStop(1, 'rgba(255,120,150,0)');
                g.globalAlpha = al; g.fillStyle = rg;
                g.beginPath(); g.ellipse(cx, cy, 56, 28, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
            };
            drawBlush(126, 322, expr === 'happy' ? 0.62 : 0.34);
            drawBlush(386, 322, expr === 'happy' ? 0.62 : 0.34);

            g.lineCap = 'round'; g.lineJoin = 'round';
            if (expr === 'happy') {
                for (const cx of [162, 350]) {
                    const dir = cx < 256 ? -1 : 1;
                    g.strokeStyle = '#1b0d2e'; g.lineWidth = 17;
                    g.beginPath(); g.moveTo(cx - 50, 260); g.quadraticCurveTo(cx, 192, cx + 50, 260); g.stroke();
                    g.lineWidth = 9;
                    g.beginPath(); g.moveTo(cx + dir * 46, 252); g.lineTo(cx + dir * 66, 232); g.stroke();
                    g.fillStyle = '#fff9c4'; g.beginPath(); g.arc(cx + dir * 62, 208, 7, 0, TAU); g.fill();
                }
                g.strokeStyle = browCol; g.lineWidth = 7;
                for (const cx of [162, 350]) { g.beginPath(); g.moveTo(cx - 38, 152); g.quadraticCurveTo(cx, 130, cx + 38, 152); g.stroke(); }
                // Radiant laughing smile with glossy lip tint
                g.fillStyle = '#881337';
                g.beginPath(); g.moveTo(208, 358); g.quadraticCurveTo(256, 430, 304, 358); g.quadraticCurveTo(256, 368, 208, 358); g.closePath(); g.fill();
                g.fillStyle = '#fb7185'; g.beginPath(); g.ellipse(256, 394, 26, 14, 0, 0, TAU); g.fill();
                g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(218, 362); g.quadraticCurveTo(256, 374, 294, 362); g.quadraticCurveTo(256, 378, 218, 362); g.fill();
            } else if (expr === 'blink') {
                for (const cx of [162, 350]) {
                    const dir = cx < 256 ? -1 : 1;
                    g.strokeStyle = '#1b0d2e'; g.lineWidth = 15;
                    g.beginPath(); g.moveTo(cx - 48, 254); g.quadraticCurveTo(cx, 280, cx + 48, 254); g.stroke();
                    g.lineWidth = 8;
                    g.beginPath(); g.moveTo(cx + dir * 44, 254); g.lineTo(cx + dir * 62, 244); g.stroke();
                }
                g.strokeStyle = browCol; g.lineWidth = 7;
                for (const cx of [162, 350]) { g.beginPath(); g.moveTo(cx - 38, 165); g.quadraticCurveTo(cx, 148, cx + 38, 165); g.stroke(); }
                g.fillStyle = 'rgba(236, 72, 118, 0.55)';
                g.beginPath(); g.ellipse(256, 376, 30, 10, 0, 0, TAU); g.fill();
                g.strokeStyle = '#9f1239'; g.lineWidth = 7;
                g.beginPath(); g.moveTo(226, 372); g.quadraticCurveTo(256, 392, 286, 372); g.stroke();
            } else {
                for (const cx of [162, 350]) {
                    const dir = cx < 256 ? -1 : 1;
                    // Sclera + soft top eyelid shadow
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(cx, 248, 50, 58, 0, 0, TAU); g.fill();
                    g.fillStyle = 'rgba(100, 116, 139, 0.28)';
                    g.beginPath(); g.ellipse(cx, 218, 48, 26, 0, 0, TAU); g.fill();

                    // Deep jewel-like gradient iris with radial fiber ring
                    const ig = g.createLinearGradient(0, 198, 0, 300);
                    ig.addColorStop(0, '#0f0722');
                    ig.addColorStop(0.32, eyeCol);
                    ig.addColorStop(0.76, eyeCol);
                    ig.addColorStop(1, '#ffffff');
                    g.fillStyle = ig;
                    g.beginPath(); g.ellipse(cx, 254, 38, 49, 0, 0, TAU); g.fill();

                    // Glowing lower iris crescent
                    g.fillStyle = 'rgba(255,255,255,0.52)';
                    g.beginPath(); g.ellipse(cx, 280, 24, 13, 0, 0, TAU); g.fill();

                    // Pupil + limbal ring
                    g.strokeStyle = '#0f0722'; g.lineWidth = 4;
                    g.beginPath(); g.ellipse(cx, 254, 38, 49, 0, 0, TAU); g.stroke();
                    g.fillStyle = '#0f0722';
                    g.beginPath(); g.ellipse(cx, 254, 16, 22, 0, 0, TAU); g.fill();

                    // Triple wet catchlights
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(cx - 15, 224, 14, 15, -0.25, 0, TAU); g.fill();
                    g.beginPath(); g.arc(cx + 16, 275, 8, 0, TAU); g.fill();
                    g.beginPath(); g.arc(cx + 12, 232, 4.5, 0, TAU); g.fill();

                    // Feathered upper eyelashes + winged flicks + double eyelid crease
                    g.strokeStyle = '#140822'; g.lineWidth = 17;
                    g.beginPath(); g.ellipse(cx, 248, 52, 58, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
                    g.lineWidth = 9;
                    g.beginPath(); g.moveTo(cx + dir * 46, 222); g.lineTo(cx + dir * 68, 200); g.stroke();
                    g.beginPath(); g.moveTo(cx + dir * 48, 238); g.lineTo(cx + dir * 64, 228); g.stroke();
                    g.strokeStyle = 'rgba(95, 48, 38, 0.55)'; g.lineWidth = 4;
                    g.beginPath(); g.ellipse(cx, 236, 55, 62, 0, Math.PI * 1.18, Math.PI * 1.82); g.stroke();
                    g.strokeStyle = 'rgba(20, 8, 34, 0.50)'; g.lineWidth = 4.5;
                    g.beginPath(); g.ellipse(cx, 250, 48, 55, 0, Math.PI * 0.24, Math.PI * 0.76); g.stroke();
                }
                // Expressive feathered brows
                g.strokeStyle = browCol; g.lineWidth = 8;
                for (const cx of [162, 350]) {
                    g.beginPath(); g.moveTo(cx - 42, 160); g.quadraticCurveTo(cx, 138, cx + 42, 158); g.stroke();
                }
                // Delicate glossy pink lips over the 3D sculpted mouth
                const lg = g.createLinearGradient(0, 356, 0, 396);
                lg.addColorStop(0, 'rgba(236, 72, 128, 0.65)');
                lg.addColorStop(1, 'rgba(251, 113, 133, 0.78)');
                g.fillStyle = lg;
                g.beginPath(); g.ellipse(256, 378, 32, 13, 0, 0, TAU); g.fill();
                g.strokeStyle = '#9f1239'; g.lineWidth = 6;
                g.beginPath(); g.moveTo(224, 372); g.quadraticCurveTo(256, 390, 288, 372); g.stroke();
                // Wet lip-gloss specular shine
                g.fillStyle = 'rgba(255, 240, 246, 0.88)';
                g.beginPath(); g.ellipse(256, 386, 15, 4.5, 0, 0, TAU); g.fill();
            }
        });
    }

    // ------------------------------------------------------------------------
    // Coupled 2nd-Order Soft-Tissue Spring-Damper Physics (Soft Engine Style)
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

    // Material factory using MeshPhysicalMaterial for AAA satin skin, sheen hair & rich fabric
    function createMaterials(d, matsOut) {
        const push = (m) => { matsOut.push(m); return m; };
        const skinM = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: skinAlbedoTex(d.skin, d.blush),
            normalMap: getSkinNormalMap(),
            normalScale: new THREE.Vector2(0.18, 0.18),
            roughness: 0.44,
            metalness: 0.01,
            clearcoat: 0.24,
            clearcoatRoughness: 0.36,
            sheen: 0.36,
            sheenColor: new THREE.Color(d.blush),
            sheenRoughness: 0.58,
            emissive: 0x000000
        }));
        const hairM = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: hairAlbedoTex(d.hair, d.hairHi),
            normalMap: getHairNormalMap(),
            normalScale: new THREE.Vector2(0.35, 0.35),
            roughness: 0.30,
            metalness: 0.10,
            clearcoat: 0.50,
            clearcoatRoughness: 0.24,
            emissive: 0x000000
        }));
        const suit1 = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: fabricAlbedoTex(d.pattern, d.c1, d.c2),
            normalMap: getFabricNormalMap(),
            normalScale: new THREE.Vector2(0.28, 0.28),
            roughness: 0.42,
            metalness: 0.05,
            sheen: 0.25,
            sheenColor: new THREE.Color(d.c2),
            sheenRoughness: 0.5,
            emissive: 0x000000
        }));
        const suit2 = push(new THREE.MeshPhysicalMaterial({
            color: d.c2,
            normalMap: getFabricNormalMap(),
            normalScale: new THREE.Vector2(0.22, 0.22),
            roughness: 0.46,
            metalness: 0.04,
            emissive: 0x000000
        }));
        const metalM = push(new THREE.MeshStandardMaterial({
            color: d.metal, roughness: 0.18, metalness: 0.90, emissive: 0x000000
        }));
        const accM = push(new THREE.MeshPhysicalMaterial({
            color: d.accC, roughness: 0.34, metalness: 0.08, clearcoat: 0.28, emissive: 0x000000
        }));
        const nailM = push(new THREE.MeshPhysicalMaterial({
            color: d.nail || d.c1, roughness: 0.12, metalness: 0.05, clearcoat: 0.95, clearcoatRoughness: 0.08, emissive: 0x000000
        }));
        const lipM = push(new THREE.MeshPhysicalMaterial({
            color: d.blush, roughness: 0.16, clearcoat: 0.85, clearcoatRoughness: 0.12, emissive: 0x000000
        }));
        return { skinM, hairM, suit1, suit2, metalM, accM, nailM, lipM };
    }

    BO.BeachAnatomy = {
        getGeos, sculptSurface, createMaterials,
        fabricAlbedoTex, faceOverlayTex,
        makeSpring, stepSpring, hexStr, shadeHex, clamp, lerp
    };
})(window);
