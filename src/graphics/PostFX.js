/* ============================================================================
   BLACKOUT OPS — PostFX: HDR scene buffer (MSAA), physically-based bloom
   (13-tap downsample / tent upsample chain), ACES filmic tonemapping,
   colour grading, lens vignette, chromatic fringe, film grain and
   health-driven damage grading.

   Usage (main loop):  PostFX.begin(renderer) → render scenes → PostFX.end(renderer, dt)
   Falls back to direct rendering on Low quality or when HDR targets are unsupported.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const QUAD_VERT = /* glsl */`
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `;

    // Soft-knee threshold + 13-tap "CoD:AW" downsample with Karis average (kills fireflies).
    const PREFILTER_FRAG = /* glsl */`
        uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold; uniform float uKnee;
        varying vec2 vUv;
        float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
        vec3 tap(vec2 o) { return texture2D(tSrc, vUv + o * uTexel).rgb; }
        vec3 karis(vec3 a, vec3 b, vec3 c, vec3 d) {
            float wa = 1.0 / (1.0 + luma(a)), wb = 1.0 / (1.0 + luma(b)), wc = 1.0 / (1.0 + luma(c)), wd = 1.0 / (1.0 + luma(d));
            return (a * wa + b * wb + c * wc + d * wd) / (wa + wb + wc + wd);
        }
        void main() {
            vec3 a = tap(vec2(-2.0, 2.0)), b = tap(vec2(0.0, 2.0)), c = tap(vec2(2.0, 2.0));
            vec3 d = tap(vec2(-2.0, 0.0)), e = tap(vec2(0.0, 0.0)), f = tap(vec2(2.0, 0.0));
            vec3 g = tap(vec2(-2.0, -2.0)), h = tap(vec2(0.0, -2.0)), i = tap(vec2(2.0, -2.0));
            vec3 j = tap(vec2(-1.0, 1.0)), k = tap(vec2(1.0, 1.0)), l = tap(vec2(-1.0, -1.0)), m = tap(vec2(1.0, -1.0));
            vec3 col = karis(j, k, l, m) * 0.5
                     + karis(a, b, d, e) * 0.125 + karis(b, c, e, f) * 0.125
                     + karis(d, e, g, h) * 0.125 + karis(e, f, h, i) * 0.125;
            float br = max(col.r, max(col.g, col.b));
            float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
            soft = soft * soft / (4.0 * uKnee + 1e-4);
            float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
            gl_FragColor = vec4(col * contrib, 1.0);
        }
    `;

    const DOWN_FRAG = /* glsl */`
        uniform sampler2D tSrc; uniform vec2 uTexel;
        varying vec2 vUv;
        vec3 tap(vec2 o) { return texture2D(tSrc, vUv + o * uTexel).rgb; }
        void main() {
            vec3 a = tap(vec2(-2.0, 2.0)), b = tap(vec2(0.0, 2.0)), c = tap(vec2(2.0, 2.0));
            vec3 d = tap(vec2(-2.0, 0.0)), e = tap(vec2(0.0, 0.0)), f = tap(vec2(2.0, 0.0));
            vec3 g = tap(vec2(-2.0, -2.0)), h = tap(vec2(0.0, -2.0)), i = tap(vec2(2.0, -2.0));
            vec3 j = tap(vec2(-1.0, 1.0)), k = tap(vec2(1.0, 1.0)), l = tap(vec2(-1.0, -1.0)), m = tap(vec2(1.0, -1.0));
            vec3 col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
            gl_FragColor = vec4(col, 1.0);
        }
    `;

    const UP_FRAG = /* glsl */`
        uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uRadius;
        varying vec2 vUv;
        vec3 tap(vec2 o) { return texture2D(tSrc, vUv + o * uTexel * uRadius).rgb; }
        void main() {
            vec3 col = tap(vec2(0.0)) * 4.0
                + (tap(vec2(-1.0, 0.0)) + tap(vec2(1.0, 0.0)) + tap(vec2(0.0, -1.0)) + tap(vec2(0.0, 1.0))) * 2.0
                + tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0));
            gl_FragColor = vec4(col / 16.0, 1.0);
        }
    `;

    const COMPOSITE_FRAG = /* glsl */`
        uniform sampler2D tScene; uniform sampler2D tBloom;
        uniform vec2 uRes; uniform float uTime;
        uniform float uExposure; uniform float uBloom; uniform float uDirt;
        uniform float uContrast; uniform float uSaturation;
        uniform vec3 uShadowTint; uniform vec3 uHighTint;
        uniform float uVignette; uniform float uFringe; uniform float uGrain;
        uniform float uDamage; uniform float uLowHp;
        varying vec2 vUv;

        // Same ACES fit three.js uses, so exposure settings behave identically.
        vec3 RRTAndODTFit(vec3 v) {
            vec3 a = v * (v + 0.0245786) - 0.000090537;
            vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
            return a / b;
        }
        vec3 aces(vec3 color) {
            const mat3 ACESInputMat = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
            const mat3 ACESOutputMat = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
            color *= uExposure / 0.6;
            color = ACESInputMat * color;
            color = RRTAndODTFit(color);
            color = ACESOutputMat * color;
            return clamp(color, 0.0, 1.0);
        }
        vec3 toSRGB(vec3 c) {
            return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
        }
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

        void main() {
            vec2 uv = vUv;
            vec2 dc = uv - 0.5;
            float aspect = uRes.x / uRes.y;
            float r2 = dot(dc, dc);

            // Lens fringe grows toward the frame edge (and with damage shock).
            vec2 off = dc * r2 * (uFringe + uDamage * 0.012);
            vec3 col;
            col.r = texture2D(tScene, uv - off).r;
            col.g = texture2D(tScene, uv).g;
            col.b = texture2D(tScene, uv + off).b;

            vec3 bloom = texture2D(tBloom, uv).rgb;
            // Faint anamorphic lens dirt: bloom picks up extra energy toward the edges.
            col += bloom * (uBloom + uDirt * smoothstep(0.05, 0.35, r2));

            col = aces(col);
            col = toSRGB(col);

            // Grade: S-curve contrast, saturation, split-tone shadows/highlights.
            float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
            col = mix(col, col * col * (3.0 - 2.0 * col), uContrast);
            col = mix(vec3(l), col, uSaturation);
            col += uShadowTint * (1.0 - smoothstep(0.0, 0.45, l)) + uHighTint * smoothstep(0.55, 1.0, l);

            // Low health: drain colour and pulse a red bleed from the edges.
            float edge = smoothstep(0.12, 0.62, length(dc * vec2(aspect, 1.0)) / aspect * 1.2);
            float hurt = max(uLowHp, uDamage);
            col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), uLowHp * 0.65);
            col = mix(col, col * vec3(1.0, 0.22, 0.18) + vec3(0.16, 0.0, 0.0), edge * hurt * 0.85);

            // Optical vignette.
            float v = smoothstep(1.05, 0.25, length(dc * vec2(aspect * 0.78, 1.0)) * 1.15);
            col *= mix(1.0, v, uVignette);

            // Luma-weighted film grain (stronger in mids, never lifts black).
            float n = hash(uv * uRes + fract(uTime) * 91.7) - 0.5;
            col += n * uGrain * (0.35 + 0.65 * (1.0 - abs(l * 2.0 - 1.0)));

            // Dither to kill 8-bit banding in skies and fog.
            col += (hash(uv * uRes.yx + 3.1) - 0.5) / 255.0;
            gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
    `;

    // Per-mode grade presets. Values tuned against the ACES curve above.
    const GRADES = {
        default: { contrast: 0.22, saturation: 1.06, shadow: [-0.006, 0.004, 0.014], high: [0.014, 0.006, -0.01], vignette: 0.42, bloom: 0.055, threshold: 0.95 },
        zombies: { contrast: 0.28, saturation: 0.92, shadow: [0.0, 0.004, 0.018], high: [0.018, 0.004, -0.014], vignette: 0.6, bloom: 0.085, threshold: 0.75 },
        mp: { contrast: 0.2, saturation: 1.04, shadow: [-0.008, 0.002, 0.012], high: [0.016, 0.008, -0.008], vignette: 0.36, bloom: 0.05, threshold: 1.0 },
        survival: { contrast: 0.2, saturation: 0.96, shadow: [-0.004, 0.006, 0.012], high: [0.014, 0.008, -0.006], vignette: 0.4, bloom: 0.06, threshold: 0.9 },
        td: { contrast: 0.22, saturation: 1.05, shadow: [-0.004, 0.002, 0.016], high: [0.018, 0.008, -0.012], vignette: 0.42, bloom: 0.07, threshold: 0.85 },
        menu: { contrast: 0.18, saturation: 1.0, shadow: [0.0, 0.004, 0.014], high: [0.012, 0.006, -0.004], vignette: 0.55, bloom: 0.12, threshold: 0.7 }
    };

    class PostFX {
        constructor() {
            this.ready = false;
            this.supported = false;
            this.active = false;
            this.sceneRT = null;
            this.mips = [];
            this.w = 0;
            this.h = 0;
            this.time = 0;
            this.damage = 0;
            this.lastHp = null;
            this.grade = GRADES.default;
            this.gradeKey = 'default';
        }

        init(renderer) {
            this.renderer = renderer;
            const caps = renderer.capabilities;
            const ext = renderer.extensions;
            this.isWebGL2 = !!caps.isWebGL2;
            this.supported = this.isWebGL2
                ? (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'))
                : (ext.has('OES_texture_half_float') && ext.has('OES_texture_half_float_linear'));
            this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
            this.quad.frustumCulled = false;
            this.qscene = new THREE.Scene();
            this.qscene.add(this.quad);

            const mk = (frag, uniforms, extra) => new THREE.ShaderMaterial(Object.assign({
                uniforms, vertexShader: QUAD_VERT, fragmentShader: frag, depthTest: false, depthWrite: false, toneMapped: false
            }, extra || {}));
            this.matPrefilter = mk(PREFILTER_FRAG, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 0.9 }, uKnee: { value: 0.45 } });
            this.matDown = mk(DOWN_FRAG, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
            this.matUp = mk(UP_FRAG, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uRadius: { value: 1.0 } }, {
                blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor
            });
            this.matComposite = mk(COMPOSITE_FRAG, {
                tScene: { value: null }, tBloom: { value: null },
                uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 },
                uExposure: { value: 1.08 }, uBloom: { value: 0.06 }, uDirt: { value: 0.03 },
                uContrast: { value: 0.2 }, uSaturation: { value: 1.05 },
                uShadowTint: { value: new THREE.Vector3() }, uHighTint: { value: new THREE.Vector3() },
                uVignette: { value: 0.4 }, uFringe: { value: 0.006 }, uGrain: { value: 0.035 },
                uDamage: { value: 0 }, uLowHp: { value: 0 }
            });
            this.ready = true;
            this.applyQuality();
        }

        wanted() {
            if (!this.ready || !this.supported) return false;
            if (BO.Settings.get('postFx') === false) return false;
            return BO.Settings.get('quality') !== 'low';
        }

        applyQuality() {
            if (!this.ready) return;
            const on = this.wanted();
            this.active = on;
            // While the pipeline owns tonemapping, materials must output linear HDR.
            this.renderer.toneMapping = on ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
            this.mipCount = BO.Settings.get('quality') === 'medium' ? 4 : 6;
            this._alloc(true);
        }

        _alloc(force) {
            if (!this.active) { this._free(); return; }
            const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
            const w = Math.max(1, size.x | 0), h = Math.max(1, size.y | 0);
            if (!force && w === this.w && h === this.h && this.sceneRT) return;
            this._free();
            this.w = w; this.h = h;
            const type = THREE.HalfFloatType;
            this.sceneRT = new THREE.WebGLRenderTarget(w, h, {
                type, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, stencilBuffer: false
            });
            if (this.isWebGL2) this.sceneRT.samples = BO.Settings.get('quality') === 'medium' ? 2 : 4;
            let mw = w, mh = h;
            for (let i = 0; i < this.mipCount; i++) {
                mw = Math.max(1, mw >> 1); mh = Math.max(1, mh >> 1);
                const rt = new THREE.WebGLRenderTarget(mw, mh, { type, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
                rt.texture.generateMipmaps = false;
                this.mips.push(rt);
            }
            this.matComposite.uniforms.uRes.value.set(w, h);
        }

        _free() {
            if (this.sceneRT) this.sceneRT.dispose();
            this.mips.forEach((m) => m.dispose());
            this.sceneRT = null;
            this.mips = [];
            this.w = this.h = 0;
        }

        setSize() { if (this.ready) this._alloc(false); }

        setGrade(key) {
            if (this.gradeKey === key) return;
            this.gradeKey = key;
            this.grade = GRADES[key] || GRADES.default;
        }

        /** Route the frame into the HDR buffer. Returns true when post is active. */
        begin(renderer) {
            if (!this.active) {
                renderer.setRenderTarget(null);
                return false;
            }
            this._alloc(false);
            renderer.setRenderTarget(this.sceneRT);
            return true;
        }

        _pass(mat, target) {
            this.quad.material = mat;
            this.renderer.setRenderTarget(target);
            this.renderer.render(this.qscene, this.camera);
        }

        _trackHealth(dt) {
            const P = BO.Player;
            const inMatch = BO.State && BO.State.screen === 'playing';
            let lowHp = 0;
            if (inMatch && P && typeof P.hp === 'number' && P.maxHp > 0) {
                const frac = P.hp / P.maxHp;
                if (this.lastHp != null && P.hp < this.lastHp - 0.5) {
                    this.damage = Math.min(1, this.damage + 0.25 + (this.lastHp - P.hp) / P.maxHp * 1.6);
                }
                this.lastHp = P.hp;
                if (frac < 0.35 && P.hp > 0) lowHp = (0.35 - frac) / 0.35 * (0.75 + 0.25 * Math.sin(this.time * 6.0));
            } else {
                this.lastHp = null;
            }
            this.damage = Math.max(0, this.damage - dt * 1.8);
            return lowHp;
        }

        end(renderer, dt) {
            if (!this.active) return;
            this.time += dt;
            const g = this.grade;
            const mips = this.mips;

            // Bloom chain.
            const pf = this.matPrefilter.uniforms;
            pf.tSrc.value = this.sceneRT.texture;
            pf.uTexel.value.set(1 / this.w, 1 / this.h);
            pf.uThreshold.value = g.threshold;
            this._pass(this.matPrefilter, mips[0]);
            const dn = this.matDown.uniforms;
            for (let i = 1; i < mips.length; i++) {
                dn.tSrc.value = mips[i - 1].texture;
                dn.uTexel.value.set(1 / mips[i - 1].width, 1 / mips[i - 1].height);
                this._pass(this.matDown, mips[i]);
            }
            const up = this.matUp.uniforms;
            const prevAutoClear = renderer.autoClear;
            renderer.autoClear = false;
            for (let i = mips.length - 1; i > 0; i--) {
                up.tSrc.value = mips[i].texture;
                up.uTexel.value.set(1 / mips[i].width, 1 / mips[i].height);
                this._pass(this.matUp, mips[i - 1]);
            }
            renderer.autoClear = prevAutoClear;

            // Composite to screen.
            const c = this.matComposite.uniforms;
            c.tScene.value = this.sceneRT.texture;
            c.tBloom.value = mips[0].texture;
            c.uTime.value = this.time;
            c.uExposure.value = BO.Settings.get('exposure') || 1.08;
            c.uBloom.value = g.bloom * (BO.Settings.get('bloom') ?? 1);
            c.uContrast.value = g.contrast;
            c.uSaturation.value = g.saturation;
            c.uShadowTint.value.fromArray(g.shadow);
            c.uHighTint.value.fromArray(g.high);
            c.uVignette.value = g.vignette;
            c.uGrain.value = BO.Settings.get('filmGrain') === false ? 0 : 0.03;
            c.uFringe.value = BO.Settings.get('chromaticAberration') === false ? 0 : 0.006;
            c.uLowHp.value = this._trackHealth(dt);
            c.uDamage.value = this.damage;
            this._pass(this.matComposite, null);
        }
    }

    BO.PostFX = new PostFX();
})(window);
