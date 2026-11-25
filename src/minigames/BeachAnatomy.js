/* ============================================================================
   BLACKOUT OPS — Sweetheart Shore AAA Character Anatomy, IBL & Shader Engine
   Dead-or-Alive-inspired 1:7.2 heroic proportions, procedural PMREM tropical
   IBL envMap for real clearcoat/metal/skin specular, true asymmetric 3D
   parametric anatomy + form-fitted parametric couture swimwear (zero boxy
   cylinders or floating tori), 512x512 anatomical AO skin/hair/fabric/face
   textures, and coupled 3-axis Soft-Engine spring-damper physics.
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

    // ------------------------------------------------------------------------
    // Procedural Studio-Tropical PMREM Environment Map (Real AAA IBL Specular!)
    // ------------------------------------------------------------------------
    let cachedEnvMap = null;
    function getEnvMap() {
        if (cachedEnvMap) return cachedEnvMap;
        try {
            const renderer = BO.App && BO.App.renderer;
            if (!renderer || !THREE.PMREMGenerator) return null;
            const pmrem = new THREE.PMREMGenerator(renderer);
            pmrem.compileEquirectangularShader();
            const envTex = L.canvasTex('aaa-beach-env', 256, 128, (g, w, h) => {
                // Rich tropical sky -> warm horizon -> golden sand bounce
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0.0, '#024d82');
                gr.addColorStop(0.35, '#1d8cd8');
                gr.addColorStop(0.50, '#fef3c7');
                gr.addColorStop(0.56, '#d4a36a');
                gr.addColorStop(1.0, '#8c6239');
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
                // Bright golden sun specular hotspot
                const sun = g.createRadialGradient(w * 0.65, h * 0.24, 2, w * 0.65, h * 0.24, 28);
                sun.addColorStop(0, '#ffffff');
                sun.addColorStop(0.35, '#fffbeb');
                sun.addColorStop(1, 'rgba(255,245,210,0)');
                g.fillStyle = sun; g.fillRect(0, 0, w, h);
                // Warm coral-peach rim fill light on opposite side
                const rim = g.createRadialGradient(w * 0.22, h * 0.36, 4, w * 0.22, h * 0.36, 36);
                rim.addColorStop(0, 'rgba(255, 224, 200, 0.75)');
                rim.addColorStop(1, 'rgba(255, 224, 200, 0)');
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
    // True Asymmetric 3D Parametric Surface Sculptor
    // ------------------------------------------------------------------------
    function sculptSurface(slices, radialSegs, evalPt, vMin = 0, vMax = 1) {
        const pos = [];
        const uvs = [];
        const idx = [];
        const cols = radialSegs + 1;
        for (let iy = 0; iy <= slices; iy++) {
            const v = lerp(vMin, vMax, iy / slices);
            for (let ix = 0; ix <= radialSegs; ix++) {
                const u = ix / radialSegs;
                const th = u * TAU;
                const p = evalPt(v, th);
                pos.push(p[0], p[1], p[2]);
                uvs.push(u, iy / slices);
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

    // Shared parametric torso evaluator so garments conform with millimeter precision!
    function evalTorso(v, th, offset = 0) {
        const y = lerp(-0.06, 0.505, v);
        const sinT = Math.sin(th);
        const cosT = Math.cos(th);
        const front = Math.max(0, cosT);
        const back = Math.max(0, -cosT);
        const side = Math.abs(sinT);

        // Heroic athletic-curvy hourglass profile (narrow waist 0.089, full hip 0.165, sleek shoulder 0.148)
        let rx = lerp(0.112, 0.164, smoothstep(0.0, 0.11, v));
        rx = lerp(rx, 0.089, smoothstep(0.13, 0.39, v));      // sculpted hourglass waist
        rx = lerp(rx, 0.128, smoothstep(0.41, 0.67, v));      // feminine ribcage
        rx = lerp(rx, 0.148, smoothstep(0.68, 0.85, v));      // graceful shoulder/clavicle
        rx = lerp(rx, 0.041, smoothstep(0.86, 0.99, v));      // trapezius -> slender neck

        let rz = lerp(0.098, 0.122, smoothstep(0.0, 0.11, v));
        rz = lerp(rz, 0.072, smoothstep(0.13, 0.39, v));
        rz = lerp(rz, 0.104, smoothstep(0.41, 0.67, v));
        rz = lerp(rz, 0.084, smoothstep(0.68, 0.86, v));
        rz = lerp(rz, 0.040, smoothstep(0.86, 0.99, v));

        // Pronounced feminine S-curve lumbar lordosis
        const spineZ = 0.020 * gauss(v, 0.35, 0.15) - 0.015 * gauss(v, 0.72, 0.17);
        const spineFurrow = -0.012 * Math.pow(back, 5) * smoothstep(0.08, 0.24, v) * (1 - smoothstep(0.82, 0.95, v));
        const lineaAlba = -0.0045 * Math.pow(front, 6) * gauss(v, 0.36, 0.15);
        const softBelly = 0.010 * Math.pow(front, 2.2) * gauss(v, 0.19, 0.09);
        const sternum = -0.007 * Math.pow(front, 5) * gauss(v, 0.66, 0.10);
        const clavicle = 0.008 * front * Math.pow(side, 1.4) * gauss(v, 0.85, 0.032);
        const scapula = 0.006 * back * Math.sin(side * Math.PI) * gauss(v, 0.74, 0.09);

        const rMod = spineFurrow + lineaAlba + softBelly + sternum + clavicle + scapula;
        const x = (rx + offset + rMod * 0.4) * sinT;
        const z = (rz + offset + rMod) * cosT + spineZ;
        return [x, y, z];
    }

    // ------------------------------------------------------------------------
    // Cached AAA Sculpted Anatomical & Couture Garment Geometries
    // ------------------------------------------------------------------------
    const GEO = {};

    function getGeos() {
        if (GEO.ready) return GEO;
        GEO.ready = true;

        // 1. SCULPTED TORSO + FORM-FITTED PARAMETRIC GARMENTS (zero cylinders/donuts!)
        GEO.torso = sculptSurface(28, 30, (v, th) => evalTorso(v, th, 0));

        // Form-fitted Athletic Sport Bra / Crop Top (hugs ribcage & upper torso seamlessly)
        GEO.sportTop = sculptSurface(14, 28, (v, th) => evalTorso(v, th, 0.0045), 0.48, 0.78);

        // Form-fitted Designer Monokini (hugs torso with dramatic side waist cutouts!)
        GEO.monokini = sculptSurface(22, 30, (v, th) => {
            const p = evalTorso(v, th, 0.0042);
            // Pinch slightly inward along side-cutout waist band for couture contour
            const side = Math.abs(Math.sin(th));
            const cutout = Math.pow(side, 2.5) * gauss(v, 0.37, 0.13);
            p[0] *= (1 - cutout * 0.06);
            return p;
        }, 0.04, 0.77);

        // Draped Off-Shoulder Sinusoidal Fabric Flounce (organic wavy cloth, NOT a stiff torus!)
        GEO.offShoulderFlounce = sculptSurface(10, 36, (v, th) => {
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const y = lerp(0.395, 0.255, v);
            const flare = lerp(0.148, 0.205, Math.pow(v, 0.85));
            const wave = Math.sin(th * 9) * 0.016 * Math.pow(v, 1.3);
            const x = (flare + wave) * sinT * 1.10;
            const z = (flare * 0.80 + wave) * cosT + 0.015 * Math.max(0, cosT) * v;
            return [x, y + Math.sin(th * 9) * 0.008 * v, z];
        });

        // 2. SCULPTED PELVIS & FULL ORGANIC GLUTES
        GEO.pelvis = sculptSurface(18, 28, (v, th) => {
            const y = lerp(-0.11, 0.075, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const front = Math.max(0, cosT), back = Math.max(0, -cosT), side = Math.abs(sinT);
            let rx = 0.032 + 0.136 * Math.pow(Math.sin(v * Math.PI * 0.88 + 0.12), 0.70);
            let rz = 0.028 + 0.090 * Math.pow(Math.sin(v * Math.PI * 0.88 + 0.12), 0.76);
            const gluteLobes = Math.pow(back, 1.55) * (0.42 + 0.58 * Math.sin(side * Math.PI)) * gauss(v, 0.44, 0.27);
            const cleft = -0.020 * Math.pow(back, 8) * gauss(v, 0.44, 0.26);
            const frontSlope = 0.008 * Math.pow(front, 2) * gauss(v, 0.62, 0.22);
            return [rx * sinT, y, (rz + gluteLobes * 0.044 + cleft + frontSlope) * cosT - gluteLobes * 0.014];
        });

        // 3. FULL SCULPTURAL DEAD-OR-ALIVE TEARDROP BUST + TAILORED BIKINI CUPS
        const makeBustGeo = (inflate = 0, triangleTrim = false) => sculptSurface(18, 24, (v, th) => {
            const sinT = Math.sin(th); // X
            const cosT = Math.cos(th); // Y (+top slope, -fuller lower teardrop pole)
            const r = (0.080 + inflate) * Math.sin(v * Math.PI * 0.52 + 0.02);
            const z = (0.086 + inflate * 0.85) * Math.pow(Math.sin(v * Math.PI * 0.5), 0.84);
            const dropY = -0.020 * Math.pow(v, 1.45);
            const lowerFull = cosT < 0 ? 1.16 : 0.86;
            let x = r * sinT * 1.06;
            let y = r * cosT * lowerFull + dropY;
            if (triangleTrim && cosT > 0.25) {
                // Sculpted triangle bikini apex tapering up toward halter strap, exposing cleavage!
                const t = (cosT - 0.25) / 0.75;
                x *= (1 - t * 0.52);
                y += t * 0.012;
            }
            return [x, y, z];
        });
        GEO.bustSkin = makeBustGeo(0, false);
        GEO.bustCup = makeBustGeo(0.0038, false);
        GEO.bustTriangle = makeBustGeo(0.0042, true);

        // Glute soft-tissue cushion for coupled spring physics
        GEO.gluteSoft = new THREE.SphereGeometry(0.094, 18, 14);
        GEO.gluteSoft.scale(1.06, 1.14, 0.90);

        // 4. LONGER, SLEEKER 1:7.2 ANATOMICAL THIGHS & CALVES
        GEO.thigh = sculptSurface(18, 22, (v, th) => {
            const y = lerp(0.02, -0.445, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const front = Math.max(0, cosT), back = Math.max(0, -cosT);
            let r = lerp(0.096, 0.049, Math.pow(v, 0.80));
            r *= 1 - 0.26 * gauss(v, 0.0, 0.06);
            const quad = 0.012 * front * gauss(v, 0.36, 0.23);
            const ham = 0.010 * back * gauss(v, 0.28, 0.22);
            const knee = 0.004 * front * gauss(v, 0.94, 0.06);
            return [r * sinT * 0.96, y, (r + quad + ham + knee) * cosT];
        });

        GEO.calf = sculptSurface(18, 22, (v, th) => {
            const y = lerp(0.01, -0.43, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const back = Math.max(0, -cosT), front = Math.max(0, cosT);
            let r = lerp(0.049, 0.030, smoothstep(0.0, 0.92, v));
            const gastro = 0.019 * (0.45 + 0.55 * back) * gauss(v, 0.28, 0.15);
            const shin = 0.004 * Math.pow(front, 3) * gauss(v, 0.55, 0.28);
            const ankleBone = 0.004 * Math.abs(sinT) * gauss(v, 0.94, 0.05);
            return [(r + gastro * 0.55 + ankleBone) * sinT, y, (r + gastro + shin) * cosT - gastro * 0.24];
        });

        // 5. SLEEK SCULPTED ARMS & NECK
        GEO.upperArm = sculptSurface(14, 16, (v, th) => {
            const y = lerp(0.02, -0.275, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const r = lerp(0.045, 0.031, v);
            const delt = 0.007 * gauss(v, 0.14, 0.12);
            const bicep = 0.0035 * Math.max(0, cosT) * gauss(v, 0.5, 0.22);
            return [(r + delt) * sinT, y, (r + delt * 0.8 + bicep) * cosT];
        });
        GEO.forearm = sculptSurface(14, 16, (v, th) => {
            const y = lerp(0.01, -0.25, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const r = lerp(0.034, 0.020, Math.pow(v, 0.9));
            const muscle = 0.0045 * gauss(v, 0.25, 0.18);
            return [(r + muscle) * sinT * 1.04, y, (r + muscle * 0.7) * cosT * 0.92];
        });
        GEO.neck = sculptSurface(10, 18, (v, th) => {
            const y = lerp(0.0, 0.118, v);
            const r = lerp(0.044, 0.036, smoothstep(0, 0.45, v)) + 0.004 * smoothstep(0.75, 1.0, v);
            return [r * Math.sin(th), y, r * Math.cos(th) * 0.95];
        });

        // 6. REFINED 1:7.2 DEAD-OR-ALIVE SCULPTED HEAD (eliminates chibi bobblehead!)
        GEO.head = sculptSurface(26, 32, (v, th) => {
            const y = lerp(-0.010, 0.265, v);
            const sinT = Math.sin(th), cosT = Math.cos(th);
            const front = Math.max(0, cosT);
            let rx = 0.118 * Math.pow(Math.sin(clamp(v, 0.001, 0.999) * Math.PI), 0.56);
            if (v < 0.34) rx *= lerp(0.42, 1.0, smoothstep(0.0, 0.34, v));
            let rz = rx * 0.98;
            const eyeL = gauss(th, 0.40, 0.22) + gauss(th, TAU - 0.40, 0.22);
            const eyeSock = -0.009 * eyeL * gauss(v, 0.47, 0.075);
            const cheek = 0.007 * (gauss(th, 0.62, 0.26) + gauss(th, TAU - 0.62, 0.26)) * gauss(v, 0.35, 0.09);
            const noseCenter = Math.pow(front, 18);
            const noseTip = 0.016 * noseCenter * gauss(v, 0.365, 0.032);
            const noseBridge = 0.007 * Math.pow(front, 14) * gauss(v, 0.43, 0.055);
            const mouthW = Math.pow(front, 10);
            const upperLip = 0.0065 * mouthW * gauss(v, 0.258, 0.016);
            const lowerLip = 0.0085 * mouthW * gauss(v, 0.226, 0.018);
            const chin = 0.005 * Math.pow(front, 6) * gauss(v, 0.09, 0.05);
            const zMod = eyeSock + cheek + noseTip + noseBridge + upperLip + lowerLip + chin;
            return [(rx + cheek * 0.35) * sinT, y, (rz + zMod) * cosT];
        });

        // 7. SILKY SWEPT HAIR RIBBONS (curved smoothly to forehead — ZERO spiky plastic cones!)
        const makeSweptStrand = (len, wBase, curveOut, sweepX) => {
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(sweepX * 0.25, -len * 0.30, curveOut),
                new THREE.Vector3(sweepX * 0.65, -len * 0.68, curveOut * 0.92),
                new THREE.Vector3(sweepX, -len, curveOut * 0.38)
            ];
            const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, wBase, 8, false);
            const p = geo.attributes.position;
            for (let i = 0; i < p.count; i++) {
                const y = p.getY(i);
                const t = clamp(-y / len, 0, 1);
                const flat = 0.55 + Math.sin(t * Math.PI) * 0.95;
                p.setX(i, p.getX(i) * flat * (1 - t * 0.55));
                p.setZ(i, p.getZ(i) * (0.55 + (1 - t) * 0.45));
            }
            geo.computeVertexNormals();
            return geo;
        };
        GEO.bangCenter = makeSweptStrand(0.115, 0.022, 0.022, 0.010);
        GEO.bangSweepL = makeSweptStrand(0.145, 0.022, 0.022, -0.028);
        GEO.bangSweepR = makeSweptStrand(0.145, 0.022, 0.022, 0.028);
        GEO.hairLock = makeSweptStrand(0.22, 0.024, 0.016, 0.014);

        GEO.hairSeg = sculptSurface(10, 12, (v, th) => {
            const y = lerp(0.01, -0.135, v);
            const r = 0.044 * (0.68 + 0.32 * Math.sin(v * Math.PI)) * (1 - v * 0.20);
            return [r * Math.sin(th) * 1.15, y, r * Math.cos(th) * 0.76];
        });
        GEO.hairTip = sculptSurface(12, 12, (v, th) => {
            const y = lerp(0.01, -0.175, v);
            const r = 0.040 * Math.pow(1 - v, 0.85);
            const curlX = Math.sin(v * Math.PI) * 0.018;
            return [r * Math.sin(th) * 1.12 + curlX, y, r * Math.cos(th) * 0.74];
        });

        GEO.ear = new THREE.SphereGeometry(0.020, 10, 8); GEO.ear.scale(0.38, 1.22, 0.82);
        GEO.nail = new THREE.SphereGeometry(0.0044, 6, 4); GEO.nail.scale(1.1, 0.45, 1.4);

        return GEO;
    }

    // ------------------------------------------------------------------------
    // High-Contrast 512x512 Anatomical AO Skin, Hair, Fabric & Jewel Face Maps
    // ------------------------------------------------------------------------
    let sharedSkinNorm = null;
    function getSkinNormalMap() {
        if (sharedSkinNorm) return sharedSkinNorm;
        sharedSkinNorm = L.canvasTex('doa-skin-norm', 256, 256, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let i = 0; i < 1800; i++) {
                const x = (i * 97) % w, y = (i * 53) % h;
                g.fillStyle = `rgb(${124 + (i % 9)},${124 + ((i * 3) % 9)},252)`;
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
        sharedFabricNorm = L.canvasTex('doa-fab-norm', 128, 128, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
                const odd = ((x + y) >> 2) & 1;
                g.fillStyle = odd ? 'rgb(142,122,246)' : 'rgb(114,134,246)';
                g.fillRect(x, y, 3, 3);
            }
        });
        sharedFabricNorm.wrapS = sharedFabricNorm.wrapT = THREE.RepeatWrapping;
        sharedFabricNorm.repeat.set(7, 7);
        return sharedFabricNorm;
    }

    let sharedHairNorm = null;
    function getHairNormalMap() {
        if (sharedHairNorm) return sharedHairNorm;
        sharedHairNorm = L.canvasTex('doa-hair-norm', 128, 128, (g, w, h) => {
            g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h);
            for (let x = 0; x < w; x += 2) {
                const nx = Math.round(128 + Math.sin(x * 1.1) * 30);
                g.fillStyle = `rgb(${nx},128,244)`;
                g.fillRect(x, 0, 2, h);
            }
        });
        sharedHairNorm.wrapS = sharedHairNorm.wrapT = THREE.RepeatWrapping;
        sharedHairNorm.repeat.set(2, 1);
        return sharedHairNorm;
    }

    function skinAlbedoTex(skinHex, blushHex) {
        return L.canvasTex('doa-skin:' + skinHex + ':' + blushHex, 512, 512, (g, w, h) => {
            // Rich sun-kissed tone (slightly deeper so bright beach sunlight never washes out contours!)
            const gr = g.createLinearGradient(0, 0, 0, h);
            gr.addColorStop(0, shadeHex(skinHex, 4));
            gr.addColorStop(0.5, shadeHex(skinHex, -8));
            gr.addColorStop(1, shadeHex(skinHex, -20));
            g.fillStyle = gr; g.fillRect(0, 0, w, h);

            // Warm peach-coral subsurface blush zones
            const blush = (x, y, rx, ry, a) => {
                const rg = g.createRadialGradient(x, y, 4, x, y, rx);
                rg.addColorStop(0, blushHex); rg.addColorStop(1, 'rgba(240,120,110,0)');
                g.globalAlpha = a; g.fillStyle = rg;
                g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
            };
            blush(w * 0.5, h * 0.16, 130, 52, 0.16);
            blush(w * 0.5, h * 0.56, 150, 85, 0.10);

            // Crisp anatomical AO & muscle contour shading (collarbones, sternum, obliques, navel)
            g.strokeStyle = shadeHex(skinHex, -46);
            g.globalAlpha = 0.38; g.lineWidth = 5; g.lineCap = 'round';
            g.beginPath(); g.moveTo(w * 0.28, h * 0.15); g.quadraticCurveTo(w * 0.42, h * 0.19, w * 0.48, h * 0.17); g.stroke();
            g.beginPath(); g.moveTo(w * 0.72, h * 0.15); g.quadraticCurveTo(w * 0.58, h * 0.19, w * 0.52, h * 0.17); g.stroke();
            // Sternum & soft under-bust AO
            g.lineWidth = 4; g.globalAlpha = 0.26;
            g.beginPath(); g.moveTo(w * 0.5, h * 0.28); g.lineTo(w * 0.5, h * 0.65); g.stroke();
            g.beginPath(); g.moveTo(w * 0.36, h * 0.44); g.quadraticCurveTo(w * 0.40, h * 0.62, w * 0.44, h * 0.74); g.stroke();
            g.beginPath(); g.moveTo(w * 0.64, h * 0.44); g.quadraticCurveTo(w * 0.60, h * 0.62, w * 0.56, h * 0.74); g.stroke();
            // Navel shadow
            g.globalAlpha = 0.44; g.fillStyle = shadeHex(skinHex, -55);
            g.beginPath(); g.ellipse(w * 0.5, h * 0.70, 5.5, 9, 0, 0, TAU); g.fill();
            g.globalAlpha = 1;
        });
    }

    function hairAlbedoTex(hairHex, hiCol) {
        return L.canvasTex('doa-hair:' + hairHex + ':' + hiCol, 512, 512, (g, w, h) => {
            // Richer, deeper root-to-tip gradient so pastel hair never blows out to white
            const gr = g.createLinearGradient(0, 0, 0, h);
            gr.addColorStop(0, shadeHex(hairHex, -36));
            gr.addColorStop(0.24, shadeHex(hairHex, -8));
            gr.addColorStop(0.40, shadeHex(hairHex, 14));
            gr.addColorStop(0.65, shadeHex(hairHex, -12));
            gr.addColorStop(1, shadeHex(hairHex, -42));
            g.fillStyle = gr; g.fillRect(0, 0, w, h);

            for (let x = 0; x < w; x += 2) {
                const v = Math.sin(x * 0.63) * 0.5 + 0.5;
                g.fillStyle = x % 4 === 0 ? `rgba(255,255,255,${v * 0.16})` : `rgba(0,0,0,${v * 0.22})`;
                g.fillRect(x, 0, 1.5, h);
            }
            for (const [yc, hh, al] of [[0.30, 0.12, 0.55], [0.68, 0.07, 0.25]]) {
                const halo = g.createLinearGradient(0, h * (yc - hh), 0, h * (yc + hh));
                halo.addColorStop(0, 'rgba(255,255,255,0)');
                halo.addColorStop(0.45, hiCol);
                halo.addColorStop(0.55, 'rgba(255,255,255,0.80)');
                halo.addColorStop(1, 'rgba(255,255,255,0)');
                g.globalAlpha = al; g.fillStyle = halo;
                g.fillRect(0, h * (yc - hh), w, h * hh * 2);
            }
            g.globalAlpha = 1;
        });
    }

    function fabricAlbedoTex(pattern, c1, c2) {
        const s1 = hexStr(c1), s2 = hexStr(c2);
        return L.canvasTex('doa-fab:' + pattern + ':' + s1 + ':' + s2, 512, 512, (g, w, h) => {
            g.fillStyle = s1; g.fillRect(0, 0, w, h);
            if (pattern === 'gingham') {
                g.fillStyle = s2; g.globalAlpha = 0.45;
                for (let i = 0; i < w; i += 48) { g.fillRect(i, 0, 24, h); g.fillRect(0, i, w, 24); }
                g.globalAlpha = 1;
                g.strokeStyle = 'rgba(255,255,255,0.55)'; g.setLineDash([6, 6]); g.lineWidth = 2;
                for (let i = 24; i < w; i += 48) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); }
                g.setLineDash([]);
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
                for (let y = 13; y < h; y += 72) g.fillRect(0, y, w, 3);
            } else if (pattern === 'polka') {
                g.fillStyle = s2;
                for (let y = 24; y < h; y += 48) for (let x = 24; x < w; x += 48) {
                    g.beginPath(); g.arc(x + ((y / 48) % 2) * 24, y, 10, 0, TAU); g.fill();
                }
            } else if (pattern === 'stripe') {
                g.fillStyle = s2;
                for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 11, h);
                g.fillStyle = 'rgba(255,255,255,0.3)';
                for (let x = 14; x < w; x += 40) g.fillRect(x, 0, 4, h);
            } else if (pattern === 'ombre') {
                const gr = g.createLinearGradient(0, 0, 0, h);
                gr.addColorStop(0, s1); gr.addColorStop(0.5, s2); gr.addColorStop(1, s1);
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
                g.strokeStyle = 'rgba(255,255,255,0.34)'; g.lineWidth = 3;
                for (let y = 24; y < h; y += 36) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.33, y - 14, w * 0.66, y + 14, w, y); g.stroke(); }
            } else if (pattern === 'shell') {
                g.strokeStyle = s2; g.lineWidth = 4;
                for (let y = 0; y <= h; y += 44) for (let x = 0; x <= w; x += 44) {
                    g.beginPath(); g.arc(x + ((y / 44) % 2) * 22, y, 22, Math.PI, TAU); g.stroke();
                }
            } else if (pattern === 'mesh') {
                g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 2;
                for (let i = -h; i < w + h; i += 18) {
                    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke();
                    g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke();
                }
            }
            // Subtle woven fabric rib
            g.fillStyle = 'rgba(0,0,0,0.06)';
            for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
        });
    }

    /** High-contrast 512x512 Dead-or-Alive-style jewel anime face with crisp lash lines & bang shadow */
    function faceOverlayTex(eyeCol, hairHex, blushCol, expr) {
        return L.canvasTex(`doa-face:${eyeCol}:${hairHex}:${expr}`, 512, 512, (g, w, h) => {
            g.clearRect(0, 0, w, h);
            const browCol = shadeHex(hairHex, -35);

            // Subtle warm bang-cast forehead shadow (gives huge 3D depth under hair!)
            const fSh = g.createLinearGradient(0, 60, 0, 175);
            fSh.addColorStop(0, 'rgba(65, 30, 25, 0.28)');
            fSh.addColorStop(1, 'rgba(65, 30, 25, 0)');
            g.fillStyle = fSh; g.fillRect(60, 60, 392, 115);

            const drawBlush = (cx, cy, al) => {
                const rg = g.createRadialGradient(cx, cy, 4, cx, cy, 56);
                rg.addColorStop(0, blushCol); rg.addColorStop(1, 'rgba(255,100,140,0)');
                g.globalAlpha = al; g.fillStyle = rg;
                g.beginPath(); g.ellipse(cx, cy, 58, 28, 0, 0, TAU); g.fill();
                g.globalAlpha = 1;
            };
            drawBlush(122, 322, expr === 'happy' ? 0.68 : 0.42);
            drawBlush(390, 322, expr === 'happy' ? 0.68 : 0.42);

            g.lineCap = 'round'; g.lineJoin = 'round';
            if (expr === 'happy') {
                for (const cx of [160, 352]) {
                    const dir = cx < 256 ? -1 : 1;
                    g.strokeStyle = '#140822'; g.lineWidth = 20;
                    g.beginPath(); g.moveTo(cx - 52, 260); g.quadraticCurveTo(cx, 190, cx + 52, 260); g.stroke();
                    g.lineWidth = 10;
                    g.beginPath(); g.moveTo(cx + dir * 48, 252); g.lineTo(cx + dir * 68, 230); g.stroke();
                    g.fillStyle = '#fff9c4'; g.beginPath(); g.arc(cx + dir * 64, 206, 8, 0, TAU); g.fill();
                }
                g.strokeStyle = browCol; g.lineWidth = 9;
                for (const cx of [160, 352]) { g.beginPath(); g.moveTo(cx - 40, 150); g.quadraticCurveTo(cx, 128, cx + 40, 150); g.stroke(); }
                g.fillStyle = '#881337';
                g.beginPath(); g.moveTo(206, 356); g.quadraticCurveTo(256, 434, 306, 356); g.quadraticCurveTo(256, 368, 206, 356); g.closePath(); g.fill();
                g.fillStyle = '#fb7185'; g.beginPath(); g.ellipse(256, 394, 26, 15, 0, 0, TAU); g.fill();
                g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(216, 360); g.quadraticCurveTo(256, 374, 296, 360); g.quadraticCurveTo(256, 378, 216, 360); g.fill();
            } else if (expr === 'blink') {
                for (const cx of [160, 352]) {
                    const dir = cx < 256 ? -1 : 1;
                    g.strokeStyle = '#140822'; g.lineWidth = 18;
                    g.beginPath(); g.moveTo(cx - 50, 254); g.quadraticCurveTo(cx, 282, cx + 50, 254); g.stroke();
                    g.lineWidth = 9;
                    g.beginPath(); g.moveTo(cx + dir * 46, 254); g.lineTo(cx + dir * 64, 244); g.stroke();
                }
                g.strokeStyle = browCol; g.lineWidth = 9;
                for (const cx of [160, 352]) { g.beginPath(); g.moveTo(cx - 40, 164); g.quadraticCurveTo(cx, 146, cx + 40, 164); g.stroke(); }
                g.fillStyle = 'rgba(225, 65, 112, 0.72)';
                g.beginPath(); g.ellipse(256, 378, 32, 12, 0, 0, TAU); g.fill();
                g.strokeStyle = '#881337'; g.lineWidth = 7;
                g.beginPath(); g.moveTo(224, 372); g.quadraticCurveTo(256, 392, 288, 372); g.stroke();
            } else {
                for (const cx of [160, 352]) {
                    const dir = cx < 256 ? -1 : 1;
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(cx, 248, 52, 60, 0, 0, TAU); g.fill();
                    g.fillStyle = 'rgba(71, 85, 105, 0.34)';
                    g.beginPath(); g.ellipse(cx, 216, 50, 28, 0, 0, TAU); g.fill();

                    // Vivid jewel-toned iris with crisp dark limbal ring
                    const ig = g.createLinearGradient(0, 196, 0, 304);
                    ig.addColorStop(0, '#090416');
                    ig.addColorStop(0.28, eyeCol);
                    ig.addColorStop(0.75, eyeCol);
                    ig.addColorStop(1, '#ffffff');
                    g.fillStyle = ig;
                    g.beginPath(); g.ellipse(cx, 254, 40, 51, 0, 0, TAU); g.fill();

                    g.fillStyle = 'rgba(255,255,255,0.58)';
                    g.beginPath(); g.ellipse(cx, 282, 25, 14, 0, 0, TAU); g.fill();

                    g.strokeStyle = '#090416'; g.lineWidth = 6;
                    g.beginPath(); g.ellipse(cx, 254, 40, 51, 0, 0, TAU); g.stroke();
                    g.fillStyle = '#090416';
                    g.beginPath(); g.ellipse(cx, 254, 17, 23, 0, 0, TAU); g.fill();

                    // Crisp studio catchlights
                    g.fillStyle = '#ffffff';
                    g.beginPath(); g.ellipse(cx - 15, 224, 15, 16, -0.25, 0, TAU); g.fill();
                    g.beginPath(); g.arc(cx + 16, 276, 8.5, 0, TAU); g.fill();
                    g.beginPath(); g.arc(cx + 12, 232, 5, 0, TAU); g.fill();

                    // Thick lush upper eyelashes + double wing + crease
                    g.strokeStyle = '#0e051a'; g.lineWidth = 21;
                    g.beginPath(); g.ellipse(cx, 248, 54, 60, 0, Math.PI * 1.06, Math.PI * 1.94); g.stroke();
                    g.lineWidth = 10;
                    g.beginPath(); g.moveTo(cx + dir * 48, 222); g.lineTo(cx + dir * 72, 198); g.stroke();
                    g.beginPath(); g.moveTo(cx + dir * 50, 238); g.lineTo(cx + dir * 68, 228); g.stroke();
                    g.strokeStyle = 'rgba(80, 38, 28, 0.65)'; g.lineWidth = 4.5;
                    g.beginPath(); g.ellipse(cx, 234, 57, 64, 0, Math.PI * 1.16, Math.PI * 1.84); g.stroke();
                    g.strokeStyle = 'rgba(14, 5, 26, 0.65)'; g.lineWidth = 5;
                    g.beginPath(); g.ellipse(cx, 250, 50, 56, 0, Math.PI * 0.22, Math.PI * 0.78); g.stroke();
                }
                g.strokeStyle = browCol; g.lineWidth = 10;
                for (const cx of [160, 352]) {
                    g.beginPath(); g.moveTo(cx - 42, 158); g.quadraticCurveTo(cx, 136, cx + 42, 156); g.stroke();
                }
                // Delicate nose contour shadow + glossy rose lips
                g.fillStyle = 'rgba(110, 52, 38, 0.36)';
                g.beginPath(); g.moveTo(256, 302); g.lineTo(248, 322); g.lineTo(260, 324); g.closePath(); g.fill();
                const lg = g.createLinearGradient(0, 356, 0, 398);
                lg.addColorStop(0, 'rgba(225, 58, 114, 0.78)');
                lg.addColorStop(1, 'rgba(244, 96, 128, 0.88)');
                g.fillStyle = lg;
                g.beginPath(); g.ellipse(256, 378, 33, 14, 0, 0, TAU); g.fill();
                g.strokeStyle = '#881337'; g.lineWidth = 6.5;
                g.beginPath(); g.moveTo(222, 372); g.quadraticCurveTo(256, 392, 290, 372); g.stroke();
                g.fillStyle = 'rgba(255, 240, 246, 0.92)';
                g.beginPath(); g.ellipse(256, 386, 16, 4.5, 0, 0, TAU); g.fill();
            }
        });
    }

    // ------------------------------------------------------------------------
    // Coupled 2nd-Order Soft-Tissue Spring-Damper Physics (Soft Engine)
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

    // Material factory with real PMREM IBL envMap for satin skin, glossy hair & 24k gold
    function createMaterials(d, matsOut) {
        const env = getEnvMap();
        const push = (m) => { matsOut.push(m); return m; };
        const skinM = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: skinAlbedoTex(d.skin, d.blush),
            normalMap: getSkinNormalMap(),
            normalScale: new THREE.Vector2(0.22, 0.22),
            roughness: 0.42,
            metalness: 0.02,
            clearcoat: 0.32,
            clearcoatRoughness: 0.30,
            sheen: 0.24,
            sheenColor: new THREE.Color(d.blush),
            sheenRoughness: 0.55,
            envMap: env,
            envMapIntensity: 0.85,
            emissive: 0x000000
        }));
        const hairM = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: hairAlbedoTex(d.hair, d.hairHi),
            normalMap: getHairNormalMap(),
            normalScale: new THREE.Vector2(0.40, 0.40),
            roughness: 0.28,
            metalness: 0.12,
            clearcoat: 0.60,
            clearcoatRoughness: 0.20,
            envMap: env,
            envMapIntensity: 0.95,
            emissive: 0x000000
        }));
        const suit1 = push(new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            map: fabricAlbedoTex(d.pattern, d.c1, d.c2),
            normalMap: getFabricNormalMap(),
            normalScale: new THREE.Vector2(0.32, 0.32),
            roughness: 0.38,
            metalness: 0.06,
            sheen: 0.28,
            sheenColor: new THREE.Color(d.c2),
            sheenRoughness: 0.45,
            envMap: env,
            envMapIntensity: 0.85,
            emissive: 0x000000
        }));
        const suit2 = push(new THREE.MeshPhysicalMaterial({
            color: d.c2,
            normalMap: getFabricNormalMap(),
            normalScale: new THREE.Vector2(0.25, 0.25),
            roughness: 0.42,
            metalness: 0.05,
            envMap: env,
            envMapIntensity: 0.75,
            emissive: 0x000000
        }));
        const metalM = push(new THREE.MeshStandardMaterial({
            color: d.metal, roughness: 0.14, metalness: 0.95, envMap: env, envMapIntensity: 1.4, emissive: 0x000000
        }));
        const accM = push(new THREE.MeshPhysicalMaterial({
            color: d.accC, roughness: 0.30, metalness: 0.10, clearcoat: 0.38, envMap: env, envMapIntensity: 0.9, emissive: 0x000000
        }));
        const nailM = push(new THREE.MeshPhysicalMaterial({
            color: d.nail || d.c1, roughness: 0.10, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.06, envMap: env, envMapIntensity: 1.2, emissive: 0x000000
        }));
        return { skinM, hairM, suit1, suit2, metalM, accM, nailM, env };
    }

    BO.BeachAnatomy = {
        getGeos, getEnvMap, sculptSurface, evalTorso, createMaterials,
        fabricAlbedoTex, faceOverlayTex,
        makeSpring, stepSpring, hexStr, shadeHex, clamp, lerp
    };
})(window);
