/* ============================================================================
   BLACKOUT OPS — Ambience: grounded contact shadows under every character and
   drifting airborne dust motes around the camera.

   Contact shadows: a soft elliptical occlusion decal under soldiers, zombies,
   dogs and NPCs, so nobody floats — even outside the sun's shadow cascade or
   indoors where the sun casts nothing. Unpickable (raycasts skip it).

   Dust motes: 900 GPU-animated particles that live in a box wrapped around the
   camera (positions are wrapped in the vertex shader, so there is zero CPU cost
   per frame). Each mote drifts on a curl-like path, twinkles as it turns, picks
   up the sun's colour when back-lit, and fades out near the lens and in the
   distance. Tinted by the scene fog so it sits in the same air as everything else.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    // ------------------------------------------------------------ CONTACT SHADOWS
    let shadowGeo = null;
    let shadowMat = null;

    function shadowTexture() {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0.0, 'rgba(6, 8, 11, 0.78)');
        g.addColorStop(0.35, 'rgba(6, 8, 11, 0.52)');
        g.addColorStop(0.7, 'rgba(6, 8, 11, 0.16)');
        g.addColorStop(1.0, 'rgba(6, 8, 11, 0.0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
        const tex = new THREE.CanvasTexture(c);
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        return tex;
    }

    function makeContactShadow(radiusX, radiusZ) {
        if (!shadowGeo) {
            shadowGeo = new THREE.PlaneGeometry(1, 1);
            shadowGeo.rotateX(-Math.PI / 2);
            shadowMat = new THREE.MeshBasicMaterial({
                map: shadowTexture(), transparent: true, depthWrite: false,
                polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
                toneMapped: false, fog: true
            });
        }
        const m = new THREE.Mesh(shadowGeo, shadowMat);
        m.name = 'bo-contact-shadow';
        m.userData.noHit = true;
        m.scale.set(radiusX * 2, 1, radiusZ * 2);
        m.position.y = 0.025;
        m.renderOrder = 2;
        m.castShadow = false;
        m.receiveShadow = false;
        m.raycast = () => {};
        m.userData.noHit = true;
        return m;
    }

    function hookCharacters() {
        const CM = BO.CharacterMesh;
        if (!CM || CM.__contactShadows) return;
        CM.__contactShadows = true;
        const wrap = (name, rx, rz, skip) => {
            const orig = CM[name];
            if (typeof orig !== 'function') return;
            CM[name] = function (...args) {
                const out = orig.apply(this, args);
                try {
                    const root = out && (out.root || (out.isObject3D ? out : null));
                    if (root && !(skip && skip(args))) root.add(makeContactShadow(rx, rz));
                } catch (e) { /* never break a spawn for a cosmetic */ }
                return out;
            };
        };
        wrap('buildSoldier', 0.42, 0.36);
        wrap('buildShopkeeper', 0.42, 0.36);
        wrap('buildGuardDog', 0.34, 0.6);
        wrap('buildSentryTurret', 0.5, 0.5);
        wrap('buildZombieFromSpec', 0.44, 0.4, (args) => {
            const bs = (args[0] && args[0].bodySpec) || {};
            const id = String((args[0] && args[0].id) || '').toLowerCase();
            return !!bs.floating || /ghost|wraith|phantom|specter/.test(id);
        });
    }

    // ------------------------------------------------------------------ DUST MOTES
    const DUST_VERT = /* glsl */`
        attribute vec3 aSeed;
        uniform float uTime;
        uniform vec3 uCam;
        uniform float uBox;
        uniform float uSize;
        uniform float uPixelRatio;
        varying float vAlpha;
        varying float vGlint;
        uniform vec3 uSunDir;
        void main() {
            // Drift: slow wind plus per-mote swirl.
            vec3 p = position;
            float t = uTime * (0.35 + aSeed.x * 0.4);
            p += vec3(0.22, 0.03, 0.12) * uTime;
            p += vec3(sin(t + aSeed.y * 6.28), sin(t * 0.7 + aSeed.z * 6.28) * 0.6, cos(t * 0.9 + aSeed.x * 6.28)) * 0.35;
            // Wrap into a box centred on the camera (infinite field, no CPU work).
            vec3 rel = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5;
            vec4 mv = modelViewMatrix * vec4(uCam + rel, 1.0);
            float dist = -mv.z;
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uSize * (0.6 + aSeed.y * 0.8) * uPixelRatio / max(dist, 0.3);
            float nearFade = smoothstep(0.4, 1.6, dist);
            float farFade = 1.0 - smoothstep(uBox * 0.28, uBox * 0.5, dist);
            float twinkle = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed.z * 2.5) + aSeed.x * 40.0);
            vAlpha = nearFade * farFade * twinkle;
            // Back-lit motes (looking toward the sun) glint brighter.
            vec3 viewDir = normalize(rel);
            vGlint = pow(max(dot(viewDir, uSunDir), 0.0), 6.0);
        }
    `;

    const DUST_FRAG = /* glsl */`
        uniform vec3 uColor;
        uniform vec3 uSunColor;
        uniform float uOpacity;
        varying float vAlpha;
        varying float vGlint;
        void main() {
            vec2 c = gl_PointCoord - 0.5;
            float r = dot(c, c) * 4.0;
            float soft = exp(-r * 3.2);
            if (soft < 0.02) discard;
            vec3 col = uColor + uSunColor * vGlint * 2.5;
            gl_FragColor = vec4(col * soft, soft * vAlpha * uOpacity);
        }
    `;

    class Ambience {
        constructor() {
            this.dust = null;
            this.time = 0;
        }

        init() { hookCharacters(); }

        attachDust(scene) {
            this.detachDust();
            if (BO.Settings.get('quality') === 'low' || BO.Settings.get('ambientParticles') === false) return;
            const count = BO.Settings.get('quality') === 'medium' ? 520 : 900;
            const box = 22;
            const pos = new Float32Array(count * 3);
            const seed = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                pos[i * 3] = (Math.random() - 0.5) * box;
                pos[i * 3 + 1] = (Math.random() - 0.5) * box;
                pos[i * 3 + 2] = (Math.random() - 0.5) * box;
                seed[i * 3] = Math.random();
                seed[i * 3 + 1] = Math.random();
                seed[i * 3 + 2] = Math.random();
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uBox: { value: box },
                    uSize: { value: 13 }, uPixelRatio: { value: 1 },
                    uColor: { value: new THREE.Color(0.55, 0.55, 0.52) },
                    uSunColor: { value: new THREE.Color(1, 0.85, 0.6) },
                    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
                    uOpacity: { value: 0.2 }
                },
                vertexShader: DUST_VERT,
                fragmentShader: DUST_FRAG,
                transparent: true,
                depthWrite: false,
                blending: THREE.CustomBlending,
                blendSrc: THREE.OneFactor,
                blendDst: THREE.OneMinusSrcAlphaFactor,
                toneMapped: false
            });
            const pts = new THREE.Points(geo, mat);
            pts.name = 'bo-dust-motes';
            pts.frustumCulled = false;
            pts.renderOrder = 5;
            pts.raycast = () => {};
            pts.onBeforeRender = (renderer, sc, cam) => {
                const u = mat.uniforms;
                u.uCam.value.copy(cam.position);
                u.uPixelRatio.value = renderer.getPixelRatio() * (renderer.domElement.height / 1080) * 1.4;
                if (sc.fog) {
                    // Motes are lit air: a brightened, slightly desaturated copy of the fog colour.
                    u.uColor.value.copy(sc.fog.color).multiplyScalar(0.9).addScalar(0.05);
                }
                const A = BO.Atmosphere;
                if (A && A.dome) {
                    u.uSunDir.value.copy(A.dome.material.uniforms.uSunDir.value);
                    u.uSunColor.value.copy(A.dome.material.uniforms.uSunColor.value).multiplyScalar(Math.min(1, A.dome.material.uniforms.uSun.value) * 0.6);
                }
            };
            scene.add(pts);
            this.dust = pts;
        }

        detachDust() {
            if (!this.dust) return;
            this.dust.geometry.dispose();
            this.dust.material.dispose();
            if (this.dust.parent) this.dust.parent.remove(this.dust);
            this.dust = null;
        }

        update(dt) {
            this.time += dt;
            if (this.dust) this.dust.material.uniforms.uTime.value = this.time;
            if (BO.CharacterShading) BO.CharacterShading.update(dt);
        }
    }

    BO.Ambience = new Ambience();
})(window);
