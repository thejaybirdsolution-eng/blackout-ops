/* ============================================================================
   BLACKOUT OPS — Atmosphere: shader sky dome, sun/halo, clouds, stars and
   image-based lighting (PMREM environment from the live sky).

   The dome reads the scene's live fog colour for its horizon, so every mode
   that drives fog (day/night, weather, blood moons, power-off blackouts)
   automatically drives the sky and the reflections with it.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const SKY_VERT = /* glsl */`
        varying vec3 vDir;
        void main() {
            vDir = position;
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww; // pin to the far plane
        }
    `;

    const SKY_FRAG = /* glsl */`
        uniform vec3 uZenith;
        uniform vec3 uHorizon;
        uniform vec3 uGround;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform float uSun;
        uniform float uDisk;
        uniform float uTime;
        uniform float uCloud;
        uniform float uStars;
        uniform float uScale;
        varying vec3 vDir;

        float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
            return v;
        }

        void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            float up = clamp(h, 0.0, 1.0);

            // Rayleigh-ish gradient: thick, bright haze at the horizon, deeper zenith.
            vec3 col = mix(uHorizon, uZenith, pow(up, 0.42));
            col = mix(col, uGround, smoothstep(0.0, -0.22, h));

            float sd = max(dot(d, uSunDir), 0.0);
            float sunUp = smoothstep(-0.12, 0.08, uSunDir.y);
            // Mie forward-scatter halo and a warm horizon band toward the sun.
            col += uSunColor * uSun * sunUp * (pow(sd, 6.0) * 0.18 + pow(sd, 48.0) * 0.55 + pow(sd, 3.0) * (1.0 - up) * 0.22);

            // Clouds on a virtual plane, lit from the sun side.
            if (uCloud > 0.001 && h > 0.0) {
                vec2 uv = d.xz / (h + 0.09);
                float c = fbm(uv * 0.9 + vec2(uTime * 0.006, uTime * 0.002));
                float c2 = fbm(uv * 2.7 - vec2(uTime * 0.01, 0.0));
                float cov = smoothstep(0.48, 0.86, c * 0.75 + c2 * 0.35) * smoothstep(0.0, 0.22, h) * uCloud;
                float lum = dot(uHorizon, vec3(0.2126, 0.7152, 0.0722));
                vec3 cloudBase = mix(uHorizon, vec3(lum * 1.35 + 0.04), 0.55);
                vec3 cloudLit = cloudBase + uSunColor * uSun * sunUp * (0.18 + pow(sd, 4.0) * 0.6);
                col = mix(col, cloudLit, cov * 0.85);
            }

            // Stars fade in as the sky darkens.
            if (uStars > 0.001 && h > 0.0) {
                vec2 g = vec2(atan(d.z, d.x) * 180.0, h * 260.0);
                vec2 cell = floor(g);
                float s = hash(cell);
                float tw = 0.65 + 0.35 * sin(uTime * 2.0 + s * 60.0);
                float star = step(0.9965, s) * smoothstep(0.45, 0.0, length(fract(g) - 0.5)) * tw;
                col += vec3(0.9, 0.95, 1.0) * star * uStars * smoothstep(0.0, 0.3, h) * 1.6;
            }

            // Sun disk (HDR so the post chain blooms it).
            col += uSunColor * smoothstep(0.99935, 0.99975, sd) * uDisk * sunUp * step(0.0, h);

            gl_FragColor = vec4(col * uScale, 1.0);
            #include <tonemapping_fragment>
            #include <encodings_fragment>
        }
    `;

    const _tmpA = new THREE.Color();
    const _lum = (c) => c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;

    function makeSkyMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                uZenith: { value: new THREE.Color() },
                uHorizon: { value: new THREE.Color() },
                uGround: { value: new THREE.Color() },
                uSunDir: { value: new THREE.Vector3(0.3, 0.6, -0.4).normalize() },
                uSunColor: { value: new THREE.Color(1, 0.9, 0.8) },
                uSun: { value: 1 },
                uDisk: { value: 14 },
                uTime: { value: 0 },
                uCloud: { value: 0.6 },
                uStars: { value: 0 },
                uScale: { value: 1 }
            },
            vertexShader: SKY_VERT,
            fragmentShader: SKY_FRAG,
            side: THREE.BackSide,
            depthWrite: false,
            fog: false
        });
    }

    class Atmosphere {
        constructor() {
            this.dome = null;
            this.scene = null;
            this.atm = null;
            this.baseFogLum = 0.2;
            this.baseZenith = new THREE.Color();
            this.envRT = null;
            this.envScene = null;
            this.envDome = null;
            this.pmrem = null;
            this.envTimer = 0;
            this.lastEnvKey = -1;
            this.dirLights = [];
            this.lightScan = 0;
            this.time = 0;
            this.studioEnv = null;
        }

        enabled() {
            return BO.Settings.get('quality') !== 'low';
        }

        _pmrem(renderer) {
            if (!this.pmrem) {
                this.pmrem = new THREE.PMREMGenerator(renderer);
                this.pmrem.compileCubemapShader();
            }
            return this.pmrem;
        }

        /** Called by WorldBuilder after fog is set. Replaces the flat gradient sky. */
        install(scene, atm) {
            this.dispose();
            this.scene = scene;
            this.atm = atm;
            const fogCol = new THREE.Color(atm.fogColor);
            this.baseFogLum = Math.max(0.004, _lum(fogCol));
            this.baseZenith.set(atm.skyTop);
            // Keep a plain colour background: modes that tint scene.background still work.
            scene.background = new THREE.Color(atm.fogColor);

            const mat = makeSkyMaterial();
            const dome = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), mat);
            dome.name = 'bo-sky-dome';
            dome.frustumCulled = false;
            dome.renderOrder = -1000;
            dome.matrixAutoUpdate = true;
            dome.onBeforeRender = (r, s, cam) => { dome.position.copy(cam.position); dome.updateMatrixWorld(); };
            scene.add(dome);
            this.dome = dome;

            // Cloud cover from map mood: bright day maps get scattered cumulus, dark maps a thin veil.
            const dayLum = _lum(this.baseZenith);
            mat.uniforms.uCloud.value = atm.clouds != null ? atm.clouds : (dayLum > 0.12 ? 0.55 : 0.28);

            this.envScene = new THREE.Scene();
            this.envDome = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), makeSkyMaterial());
            this.envDome.frustumCulled = false;
            this.envScene.add(this.envDome);
            this.lastEnvKey = -1;
            this.envTimer = 0;
            this.lightScan = 0;
            this._sync(0);
            if (BO.Ambience) BO.Ambience.attachDust(scene);
        }

        _scanLights() {
            this.dirLights = [];
            if (!this.scene) return;
            this.scene.traverse((o) => { if (o.isDirectionalLight) this.dirLights.push(o); });
        }

        _sync(dt) {
            if (!this.dome || !this.scene) return;
            const u = this.dome.material.uniforms;
            this.time += dt;
            u.uTime.value = this.time;

            const fog = this.scene.fog;
            const horizon = u.uHorizon.value;
            if (fog) horizon.copy(fog.color); else horizon.set(this.atm.skyBottom);

            // Zenith keeps the map's hue but tracks how dark the live fog has become.
            const k = BO.Math.clamp(_lum(horizon) / this.baseFogLum, 0.05, 1.6);
            u.uZenith.value.copy(this.baseZenith).multiplyScalar(k);
            // Give daytime zeniths some depth instead of a flat cyan wash.
            const zl = _lum(u.uZenith.value);
            if (zl > 0.15) u.uZenith.value.lerp(_tmpA.copy(u.uZenith.value).multiplyScalar(0.72), 0.5);
            u.uGround.value.copy(horizon).multiplyScalar(0.55);

            this.lightScan -= dt;
            if (this.lightScan <= 0) { this.lightScan = 2; this._scanLights(); }
            let sun = null;
            for (let i = 0; i < this.dirLights.length; i++) {
                const l = this.dirLights[i];
                if (l.parent && (!sun || l.intensity > sun.intensity)) sun = l;
            }
            if (sun) {
                const target = sun.target ? sun.target.position : new THREE.Vector3();
                u.uSunDir.value.copy(sun.position).sub(target).normalize();
                u.uSunColor.value.copy(sun.color);
                const night = 1 - BO.Math.clamp(k, 0, 1);
                u.uSun.value = BO.Math.clamp(sun.intensity, 0, 2.2) * (0.35 + 0.65 * (1 - night));
                u.uDisk.value = sun.intensity > 0.5 && zl > 0.06 ? 16 : 3.5; // dark maps read it as a moon
            } else {
                u.uSun.value = 0;
            }
            u.uStars.value = BO.Math.clamp(1 - zl * 14, 0, 1);
        }

        _bakeEnv(renderer) {
            if (!this.envDome || !this.dome) return;
            const src = this.dome.material.uniforms;
            const dst = this.envDome.material.uniforms;
            for (const key in src) {
                const v = src[key].value;
                if (v && v.copy) dst[key].value.copy(v); else dst[key].value = v;
            }
            dst.uDisk.value = Math.min(src.uDisk.value, 4); // avoid fireflies in the specular lobe
            dst.uStars.value = 0;
            dst.uScale.value = 0.6;
            const prevTM = renderer.toneMapping;
            renderer.toneMapping = THREE.NoToneMapping;
            const prevRT = renderer.getRenderTarget();
            const rt = this._pmrem(renderer).fromScene(this.envScene, 0.035, 0.1, 400);
            renderer.setRenderTarget(prevRT);
            renderer.toneMapping = prevTM;
            if (this.envRT) this.envRT.dispose();
            this.envRT = rt;
            if (this.scene) this.scene.environment = rt.texture;
            if (BO.Player && BO.Player.vmScene) BO.Player.vmScene.environment = rt.texture;
        }

        /** Per-frame: animate the dome and rebake reflections when the sky changes. */
        update(renderer, dt) {
            if (!this.dome || !this.scene || BO.World.scene !== this.scene) return;
            this._sync(dt);
            if (BO.Ambience) BO.Ambience.update(dt);
            if (!this.enabled()) {
                if (this.scene.environment) this.scene.environment = null;
                if (BO.Player && BO.Player.vmScene) BO.Player.vmScene.environment = this.studio(renderer);
                return;
            }
            this.envTimer -= dt;
            if (this.envTimer > 0) return;
            this.envTimer = 1.5;
            const u = this.dome.material.uniforms;
            const key = Math.round(_lum(u.uHorizon.value) * 60) * 1000 + Math.round(u.uSun.value * 20) * 10 + Math.round((u.uSunDir.value.y + 1) * 4);
            if (key !== this.lastEnvKey || !this.scene.environment) {
                this.lastEnvKey = key;
                this._bakeEnv(renderer);
            }
        }

        /** Neutral photo-studio reflections for the menu showcase and the viewmodel fallback. */
        studio(renderer) {
            if (this.studioEnv) return this.studioEnv;
            const s = new THREE.Scene();
            const room = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 12), new THREE.MeshBasicMaterial({ color: 0x0b0f16, side: THREE.BackSide }));
            s.add(room);
            const panel = (w, h, x, y, z, ry, c, i) => {
                const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide }));
                m.position.set(x, y, z);
                m.lookAt(0, 0, 0);
                if (ry) m.rotation.z = ry;
                s.add(m);
            };
            panel(5, 1.2, 0, 3.6, 1, 0, 0xffffff, 1.3);    // overhead softbox
            panel(1.6, 4, -5.5, 0.5, 2, 0, 0xffd7a8, 1.2);   // warm key strip
            panel(1.2, 3.5, 5.5, 0.4, -2, 0, 0x9cc8ff, 0.9); // cool rim strip
            panel(8, 1, 0, -3.5, 0, 0, 0x30363f, 1);        // floor bounce
            const prevTM = renderer.toneMapping;
            renderer.toneMapping = THREE.NoToneMapping;
            const prevRT = renderer.getRenderTarget();
            this.studioEnv = this._pmrem(renderer).fromScene(s, 0.04).texture;
            renderer.setRenderTarget(prevRT);
            renderer.toneMapping = prevTM;
            return this.studioEnv;
        }

        dispose() {
            if (this.dome) {
                this.dome.geometry.dispose();
                this.dome.material.dispose();
                if (this.dome.parent) this.dome.parent.remove(this.dome);
            }
            if (this.envDome) { this.envDome.geometry.dispose(); this.envDome.material.dispose(); }
            if (this.envRT) this.envRT.dispose();
            this.dome = null;
            this.envDome = null;
            this.envScene = null;
            this.envRT = null;
            this.scene = null;
        }
    }

    BO.Atmosphere = new Atmosphere();
})(window);
