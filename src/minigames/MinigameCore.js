/* ============================================================================
   BLACKOUT OPS — MINIGAMES: core runtime
   ----------------------------------------------------------------------------
   One mode ('minigame') hosts every minigame. A minigame is a definition
   registered with BO.Minigames.register(def):

     { id, cat: 'target' | 'boss' | 'mole', name, tagline, desc, icon, accent,
       duration (s, or 0 for open-ended), stars: [bronze, silver, gold, plat],
       standardWeapon, map: { atmosphere, boxes, spawn }, rail: bool,
       build(ctx), schedule(S), update(ctx, dt), preUpdate(ctx, dt),
       onHit(ctx, ent, info), finish(ctx) ... }

   Timed courses are deterministic: their spawn schedule is generated from a
   fixed seed before the run starts, so every attempt plays out identically.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const TAU = Math.PI * 2;

    /* ---------------------------------------------------------------- utils */
    function mulberry32(seed) {
        let s = seed >>> 0;
        return function () {
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function hashStr(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }
    const Ease = {
        outBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
        outCubic(t) { return 1 - Math.pow(1 - t, 3); },
        inCubic(t) { return t * t * t; },
        inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
        outElastic(t) {
            if (t === 0 || t === 1) return t;
            return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;
        }
    };
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    /** Box helper used by course maps: centre + size. */
    function B(x, y, z, w, h, d, mat) { return { x, y, z, w, h, d, mat: mat || 'concrete' }; }
    /** Box helper: min/max corners. */
    function BMM(x1, y1, z1, x2, y2, z2, mat) {
        return B((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, Math.abs(x2 - x1), Math.abs(y2 - y1), Math.abs(z2 - z1), mat);
    }

    /* ---------------------------------------------------------------- sound */
    const SFX = {
        tone(from, to, duration, type = 'sine', volume = 0.2, delay = 0) {
            if (!BO.Sound?.ensureContext?.()) return;
            const filter = type === 'square' || type === 'sawtooth'
                ? ['lowpass', Math.min(9000, from * 3.8 + 700), 0.76] : null;
            BO.Sound.synthTone(from, to || from, duration, type, volume, { delay, filter });
        },
        noise(duration, frequency, type = 'bandpass', q = 1.2, volume = 0.25, delay = 0, endFrequency, attack) {
            if (!BO.Sound?.ensureContext?.()) return;
            BO.Sound.synthNoise(duration, frequency, type, q, volume, { delay, endFrequency, attack });
        },
        ding(pitch = 1) {
            this.tone(1168 * pitch, 1164 * pitch, 0.32, 'triangle', 0.20);
            this.tone(2397 * pitch, 2390 * pitch, 0.15, 'sine', 0.10);
            this.tone(1770 * pitch, 1766 * pitch, 0.27, 'sine', 0.09, 0.052);
        },
        thunk() {
            this.noise(0.10, 840, 'bandpass', 0.95, 0.28, 0, 310);
            this.tone(146, 49, 0.15, 'sine', 0.30);
            this.tone(299, 107, 0.061, 'triangle', 0.11, 0.018);
        },
        pop() {
            this.noise(0.055, 2880, 'bandpass', 0.92, 0.38, 0, 940);
            this.tone(630, 151, 0.075, 'triangle', 0.19);
        },
        shatter() {
            this.noise(0.17, 5400, 'highpass', 0.76, 0.35, 0, 2100);
            [0.012, 0.049, 0.095].forEach((delay, i) => this.tone(3170 - i * 370, 2100 - i * 260, 0.10, 'sine', 0.084, delay));
        },
        bonk() {
            this.tone(410, 155, 0.15, 'triangle', 0.25);
            this.tone(667, 288, 0.089, 'sine', 0.12, 0.018);
            this.noise(0.056, 1050, 'bandpass', 1.05, 0.25, 0, 520);
        },
        boing() {
            this.tone(209, 680, 0.16, 'triangle', 0.22);
            this.tone(666, 350, 0.19, 'sine', 0.17, 0.093);
            this.tone(360, 274, 0.15, 'triangle', 0.09, 0.193);
        },
        buzzer() {
            this.tone(230, 145, 0.16, 'square', 0.20);
            this.tone(173, 125, 0.21, 'triangle', 0.18, 0.127);
        },
        whoosh(v = 0.22) { this.noise(0.31, 580, 'bandpass', 0.76, v, 0, 3850, 0.09); },
        launch() {
            this.noise(0.15, 620, 'lowpass', 0.85, 0.43, 0, 190);
            this.tone(121, 47, 0.17, 'sine', 0.25);
            this.whoosh(0.21);
        },
        beep(final) {
            const pitch = final ? 988 : 660;
            this.tone(pitch, pitch * (final ? 1.02 : 0.98), final ? 0.26 : 0.095, 'triangle', 0.20);
            if (final) this.tone(1480, 1500, 0.24, 'sine', 0.14, 0.11);
        },
        combo(level) {
            const base = 523 * Math.pow(1.122, Math.min(12, level));
            [1, 1.26, 1.5].forEach((ratio, i) => {
                this.tone(base * ratio, base * ratio, i === 2 ? 0.135 : 0.077, 'triangle', 0.13, i * 0.051);
            });
        },
        comboBreak() {
            this.tone(394, 238, 0.12, 'triangle', 0.17);
            this.tone(238, 161, 0.16, 'sine', 0.14, 0.081);
        },
        star(i) {
            const f = [784, 988, 1175, 1568][i] || 1568;
            this.tone(f, f, 0.33, 'triangle', 0.20);
            this.tone(f * 1.5, f * 1.5, 0.24, 'sine', 0.10, 0.056);
            this.tone(f * 2, f * 2, 0.21, 'sine', 0.07, 0.091);
        },
        fanfare() {
            [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.34, 'triangle', 0.17, i * 0.092));
            this.tone(524, 520, 0.51, 'sine', 0.16, 0.275);
            this.tone(1569, 1564, 0.57, 'sine', 0.089, 0.35);
        },
        crowd(v = 0.18) {
            this.noise(1.40, 860, 'bandpass', 0.55, v, 0, 620, 0.16);
            this.noise(0.98, 1720, 'bandpass', 0.66, v * 0.64, 0.18, 1240, 0.20);
        },
        rumble(v = 0.35) {
            this.noise(0.53, 280, 'lowpass', 0.83, v, 0, 90);
            this.tone(79, 32, 0.44, 'sine', v * 0.65);
        },
        clack() {
            this.noise(0.046, 2550, 'bandpass', 2.2, 0.25, 0, 1050);
            this.tone(627, 511, 0.048, 'triangle', 0.15);
        },
        heal() {
            [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, f * 1.013, 0.28, 'sine', 0.13, i * 0.056));
            this.tone(233, 389, 0.35, 'triangle', 0.10, 0.056);
        }
    };

    /* ------------------------------------------------------------ textures & 3D assets */
    const texCache = new Map();
    const _mgSessionGuard = () => {
        const owner = BO.Minigames && BO.Minigames.session;
        return () => !owner || (BO.Minigames && BO.Minigames.session === owner);
    };
    const loadTex = (relPath, repeatX = 1, repeatY = 1) => BO.Assets.loadTex(relPath, repeatX, repeatY);
    const pbrMat = (relPath, repeatX = 1, repeatY = 1, extra = {}) => BO.Assets.pbrMat(relPath, repeatX, repeatY, extra);
    const loadSkyboxTex = (relPath) => BO.Assets.loadSkyboxTex(relPath);
    const applySkybox = (scene, relPath) => BO.Assets.applySkybox(scene, relPath);
    const loadGLB = (relPath) => BO.Assets.loadGLB(relPath);
    const placeGLB = (parent, path, opts = {}) => BO.Assets.placeGLB(parent, path, Object.assign({ isAlive: _mgSessionGuard() }, opts));
    const placeGLBInstanced = (parent, path, transforms, opts = {}) => BO.Assets.placeGLBInstanced(parent, path, transforms, Object.assign({ isAlive: _mgSessionGuard() }, opts));

    function canvasTex(key, w, h, draw) {
        if (texCache.has(key)) return texCache.get(key);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        draw(g, w, h);
        const t = new THREE.CanvasTexture(c);
        if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
        t.anisotropy = 4;
        texCache.set(key, t);
        return t;
    }
    const matCache = new Map();
    function mat(key, make) {
        if (!matCache.has(key)) matCache.set(key, make());
        return matCache.get(key);
    }
    const std = (hex, rough = 0.6, metal = 0.05, extra = {}) =>
        mat('std:' + hex + ':' + rough + ':' + metal + ':' + JSON.stringify(extra), () => new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: rough, metalness: metal }, extra)));
    const basic = (hex, extra = {}) =>
        mat('basic:' + hex + ':' + JSON.stringify(extra), () => new THREE.MeshBasicMaterial(Object.assign({ color: hex }, extra)));
    const HIDDEN_MAT = new THREE.MeshBasicMaterial({ visible: false });

    /** Text sign texture (used for course banners, scoreboards, signage). */
    function signTex(text, opts = {}) {
        const key = 'sign:' + text + JSON.stringify(opts);
        return canvasTex(key, opts.w || 512, opts.h || 128, (g, w, h) => {
            g.fillStyle = opts.bg || '#111827';
            g.fillRect(0, 0, w, h);
            if (opts.border !== false) {
                g.strokeStyle = opts.borderColor || '#f5a623';
                g.lineWidth = Math.max(4, h * 0.06);
                g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth);
            }
            g.fillStyle = opts.color || '#fde68a';
            g.font = `900 ${Math.round(h * (opts.size || 0.5))}px Bahnschrift, Impact, sans-serif`;
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            if (opts.glow) { g.shadowColor = opts.glow; g.shadowBlur = h * 0.18; }
            const maxW = Math.round(w * 0.88);
            g.fillText(text, w / 2, h / 2 + h * 0.03, maxW);
        });
    }

    /* ------------------------------------------------------------ targets */
    let nextTargetId = 1;
    /**
     * A shootable minigame object. Lifecycle: in (appear anim) → hold → out
     * (disappear anim) → removed. Shooting it plays a death animation.
     */
    class Target {
        constructor(ctx, o) {
            this.id = nextTargetId++;
            this.ctx = ctx;
            this.mgTarget = true;
            this.noBlood = true;
            this.alive = true;
            this.kind = o.kind || 'target';
            this.points = o.points ?? 100;
            this.penalty = o.penalty || 0;            // >0 = shooting it costs points
            this.bonus = !!o.bonus;                    // optional extra, never breaks combo when missed
            this.hp = o.hp || 1;
            this.maxHp = this.hp;
            this.ringRadius = o.ringRadius || 0;       // >0 = bullseye scoring on the face
            this.ringCenter = o.ringCenter || new THREE.Vector3(0, 0, 0);
            this.appear = o.appear || 'flip';
            this.vanish = o.vanish || this.appear;
            this.death = o.death || 'knock';
            this.inT = o.inT ?? 0.24;
            this.life = o.life ?? 2.4;
            this.outT = o.outT ?? 0.22;
            this.slideDir = o.slideDir || 1;
            this.slideDist = o.slideDist || 1.6;
            this.riseDepth = o.riseDepth || 1.4;
            this.motion = o.motion || null;            // fn(target, tAlive, outVec3) → world offset
            this.onTick = o.onTick || null;            // fn(target, dt)
            this.onKill = o.onKill || null;            // fn(target, info)
            this.onDamage = o.onDamage || null;        // fn(target, info) for multi-hp
            this.onExpire = o.onExpire || null;        // fn(target) when it leaves unshot
            this.penaltyLabel = o.penaltyLabel || null;
            this.deathColor = o.deathColor ?? 0xf5f5f4;
            this.age = 0;
            this.phase = 'in';
            this.deadT = 0;
            this.removed = false;

            this.root = new THREE.Group();
            this.pivot = new THREE.Group();
            this.root.add(this.pivot);
            if (o.mesh) this.pivot.add(o.mesh);
            this.basePos = o.pos.clone();
            this.root.position.copy(this.basePos);
            if (o.yaw !== undefined) this.root.rotation.y = o.yaw;
            if (o.faceCamera) this.faceCamera = true;

            this.hitMeshes = [];
            const hm = o.hitMeshes || (o.mesh ? collectMeshes(o.mesh) : []);
            for (const m of hm) {
                m.userData.entity = this;
                if (!m.userData.hitbox) m.userData.hitbox = 'torso';
                this.hitMeshes.push(m);
            }
            this._offset = new THREE.Vector3();
            this._applyAnim(0, true);
            ctx.scene.add(this.root);
            this.root.updateMatrixWorld(true);
        }

        get tAlive() { return this.age; }

        worldCenter(out = new THREE.Vector3()) {
            return out.copy(this.ringCenter).applyMatrix4(this.pivot.matrixWorld);
        }

        _applyAnim(p, entering) {
            // p: 0 = hidden, 1 = fully shown
            const style = entering ? this.appear : this.vanish;
            const e = entering ? Ease.outBack(p) : Ease.inCubic(p);
            const pv = this.pivot;
            pv.rotation.set(0, 0, 0);
            pv.position.set(0, 0, 0);
            pv.scale.setScalar(1);
            switch (style) {
                case 'flip': pv.rotation.x = -(1 - e) * Math.PI * 0.5; break;
                case 'flipdown': pv.rotation.x = (1 - e) * Math.PI * 0.5; break;
                case 'rise': pv.position.y = -(1 - (entering ? Ease.outCubic(p) : p)) * this.riseDepth; break;
                case 'scale': pv.scale.setScalar(Math.max(0.001, e)); break;
                case 'slide': pv.position.x = -(1 - (entering ? Ease.outCubic(p) : p)) * this.slideDist * this.slideDir; break;
                case 'spin': pv.rotation.y = (1 - e) * Math.PI; pv.scale.setScalar(Math.max(0.001, Math.min(1, p * 1.4))); break;
                case 'drop': pv.position.y = (1 - (entering ? Ease.outElastic(p) : p)) * this.riseDepth; break;
                default: break;
            }
        }

        update(dt) {
            this.age += dt;
            if (!this.alive) {
                this.deadT += dt;
                this._animateDeath(dt);
                if (this.deadT > 0.75) this.remove();
                this.root.updateMatrixWorld(true);
                return;
            }
            if (this.motion) {
                this.motion(this, this.age, this._offset);
                this.root.position.copy(this.basePos).add(this._offset);
            }
            if (this.faceCamera && BO.App && BO.App.worldCamera) {
                const c = BO.App.worldCamera.position;
                this.root.rotation.y = Math.atan2(c.x - this.root.position.x, c.z - this.root.position.z);
            }
            if (this.phase === 'in') {
                const p = clamp01(this.age / this.inT);
                this._applyAnim(p, true);
                if (p >= 1) { this.phase = 'hold'; this.holdStart = this.age; }
            } else if (this.phase === 'hold') {
                this._applyAnim(1, true);
                if (this.life > 0 && this.age - this.holdStart >= this.life) { this.phase = 'out'; this.outStart = this.age; }
            } else if (this.phase === 'out') {
                const p = clamp01((this.age - this.outStart) / this.outT);
                this._applyAnim(1 - p, false);
                if (p >= 1) {
                    this.alive = false;
                    this.expired = true;
                    this.ctx._onExpire(this);
                    if (this.onExpire) this.onExpire(this);
                    this.remove();
                }
            }
            if (this.onTick) this.onTick(this, dt);
            this.root.updateMatrixWorld(true);
        }

        /** Begin vanishing now (used by scripted sequences). */
        retire() { if (this.alive && this.phase !== 'out') { this.phase = 'out'; this.outStart = this.age; } }

        kill(info) {
            if (!this.alive) return;
            this.alive = false;
            this.deadT = 0;
            this.killInfo = info;
            this._deathSpin = (Math.random() - 0.5) * 8;
            this._deathVel = new THREE.Vector3((info && info.dir ? info.dir.x : 0) * 4, 3.5, (info && info.dir ? info.dir.z : 0) * 4);
            const c = info && info.pt ? info.pt : this.worldCenter();
            if (this.death === 'shatter' || this.death === 'pop' || this.death === 'burst') {
                this.pivot.visible = false;
                const n = this.death === 'shatter' ? 26 : 18;
                BO.FX.spawnParticles(c, n, this.deathColor, this.death === 'pop' ? 5 : 6.5, this.death === 'pop' ? 2 : 11, 0.55, this.death === 'shatter' ? 1.3 : 1.0);
                if (this.death === 'burst') BO.FX.spawnExplosion(c, 2.2, this.deathColor);
            } else {
                BO.FX.spawnParticles(c, 8, this.deathColor, 3.5, 9, 0.4, 0.8);
            }
            if (this.onKill) this.onKill(this, info);
        }

        _animateDeath(dt) {
            const t = this.deadT;
            if (this.death === 'knock') {
                const p = clamp01(t / 0.28);
                this.pivot.rotation.x = -Ease.outCubic(p) * Math.PI * 0.5;
            } else if (this.death === 'fall' || this.death === 'tumble') {
                this._deathVel.y -= 18 * dt;
                this.root.position.addScaledVector(this._deathVel, dt);
                this.pivot.rotation.x += this._deathSpin * dt;
                this.pivot.rotation.z += this._deathSpin * 0.6 * dt;
            } else if (this.death === 'squash') {
                const p = clamp01(t / 0.18);
                this.pivot.scale.set(1 + p * 0.35, Math.max(0.05, 1 - p * 0.75), 1 + p * 0.35);
                if (t > 0.35) this.pivot.position.y -= dt * 4.5;
            } else if (this.death === 'spin') {
                this.pivot.rotation.y += dt * 22;
                this.pivot.scale.setScalar(Math.max(0.001, 1 - t / 0.6));
            }
        }

        remove() {
            if (this.removed) return;
            this.removed = true;
            this.alive = false;
            // Park the root in the session graveyard (outside the scene) so its GPU resources are
            // released with the rest of the session in MinigameRuntime.stop().
            if (this.ctx && this.ctx.graveyard) this.ctx.graveyard.add(this.root);
            else if (this.root.parent) this.root.parent.remove(this.root);
        }
    }

    function collectMeshes(obj) {
        const out = [];
        obj.traverse((o) => { if (o.isMesh && !o.userData.noHit) out.push(o); });
        return out;
    }

    /* -------------------------------------------------------- the session */
    class Session {
        constructor(runtime, def, scene, opts) {
            this.rt = runtime;
            this.def = def;
            this.scene = scene;
            this.graveyard = new THREE.Group();   // removed targets wait here for GPU release
            this.opts = opts || {};
            this.seed = hashStr('blackout-mg:' + def.id + ':' + (opts.variant || ''));
            this.rng = mulberry32(this.seed);
            this.t = 0;
            this.duration = def.duration || 0;
            this.targets = [];
            this.events = [];
            this.eventCursor = 0;
            this.score = 0;
            this.displayScore = 0;
            this.shots = 0;
            this.shotHits = 0;
            this.hits = 0;
            this.kills = 0;
            this.spawned = 0;
            this.expired = 0;
            this.bullseyes = 0;
            this.headshots = 0;
            this.penalties = 0;
            this.combo = 0;
            this.maxCombo = 0;
            this.timeline = [];
            this.updaters = [];
            this.props = [];
            this.data = {};
        }

        get k() { return this.duration ? clamp01(this.t / this.duration) : 0; }
        get comboMult() { return Math.min(4, 1 + Math.floor(this.combo / 5) * 0.5); }

        /** Register a deterministic spawn event (used while scheduling). */
        at(t, fn) { this.events.push({ t, fn }); }

        addTarget(o) {
            const tg = new Target(this, o);
            this.targets.push(tg);
            if (!tg.penalty && !tg.bonus) this.spawned++;
            return tg;
        }

        /** Each-frame callback for scenery animation. Return false to drop it. */
        animate(fn) { this.updaters.push(fn); }

        /** Make a mesh block bullets (decals + tracer stop) without colliding. */
        solid(mesh) {
            this._solids = this._solids || [];
            this._solids.push(mesh);
            mesh.traverse((o) => { if (o.isMesh) BO.World.worldMeshes.push(o); });
            return mesh;
        }

        add(obj) { this.scene.add(obj); return obj; }

        /** Invisible player-blocking box (min/max corners). */
        collider(x1, y1, z1, x2, y2, z2) {
            BO.World.colliders.push({
                minX: Math.min(x1, x2), maxX: Math.max(x1, x2),
                minY: Math.min(y1, y2), maxY: Math.max(y1, y2),
                minZ: Math.min(z1, z2), maxZ: Math.max(z1, z2),
                enemiesOnly: false, active: true
            });
        }

        /** Visible + colliding box (centre/size). */
        box(x, y, z, w, h, d, material, opts = {}) {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
            m.position.set(x, y, z);
            m.castShadow = opts.shadow !== false;
            m.receiveShadow = true;
            this.scene.add(m);
            if (opts.collide !== false) this.collider(x - w / 2, y - h / 2, z - d / 2, x + w / 2, y + h / 2, z + d / 2);
            if (opts.solid) this.solid(m);
            return m;
        }

        award(points, pos, label, color) {
            let pts = Math.round(points);
            if (this.score + pts < 0) pts = -this.score; // never drop below zero
            this.score += pts;
            if (pos) this.rt.popup(pos, (pts >= 0 ? '+' : '') + pts + (label ? ' ' + label : ''), color || (pts >= 0 ? '#fde68a' : '#f87171'), Math.abs(pts) >= 250);
            return pts;
        }

        bumpCombo() {
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            if (this.combo % 5 === 0 && this.combo <= 30) {
                SFX.combo(this.combo / 5);
                this.rt.flashCombo();
            }
            BO.MinigameFeel?.onCombo(this.combo);
        }

        breakCombo(reason) {
            BO.MinigameFeel?.onComboBreak(this.combo);
            if (this.combo >= 5) {
                SFX.comboBreak();
                this.rt.toast(reason ? `COMBO LOST — ${reason}` : 'COMBO LOST', '#f87171');
            }
            this.combo = 0;
        }

        /** Standard scoring for a target hit. Returns true if it died. */
        hitTarget(tg, info) {
            if (!tg.alive) return false;
            const P = BO.Player;
            if (tg.penalty) {
                this.penalties++;
                tg.kill(info);
                this.award(-tg.penalty, info.pt, tg.penaltyLabel || 'PENALTY', '#f87171');
                this.breakCombo('FRIENDLY HIT');
                SFX.buzzer();
                this.rt.flashScreen('rgba(220,38,38,0.28)');
                return true;
            }
            this.hits++;
            if (tg.hp > 1) {
                tg.hp -= 1;
                if (tg.onDamage) tg.onDamage(tg, info);
                SFX.ding(1.4);
                this.award(10, info.pt, '', '#cbd5e1');
                return false;
            }
            let pts = tg.points;
            let label = '';
            let col = '#fde68a';
            if (tg.ringRadius > 0 && info.pt) {
                const local = tg.pivot.worldToLocal(info.pt.clone());
                const r = Math.hypot(local.x - tg.ringCenter.x, local.y - tg.ringCenter.y) / tg.ringRadius;
                const ring = Math.max(5, 10 - Math.floor(clamp01(r) * 5));
                pts = Math.round(tg.points * (ring / 10));
                if (ring === 10) {
                    pts += Math.round(tg.points * 0.5);
                    label = 'BULLSEYE';
                    col = '#facc15';
                    this.bullseyes++;
                    SFX.ding(1.25);
                    BO.Juice?.shake?.(0.075);
                } else {
                    label = String(ring);
                }
            } else if (info.hitbox === 'head') {
                pts = Math.round(pts * 1.5);
                label = 'HEADSHOT';
                col = '#fb923c';
                this.headshots++;
                BO.Juice?.shake?.(0.065);
            }
            this.bumpCombo();
            this.kills++;
            const mult = this.comboMult;
            pts = Math.round(pts * mult);
            if (mult > 1) label += (label ? ' ' : '') + 'x' + mult.toFixed(1).replace('.0', '');
            this.award(pts, info.pt, label, col);
            BO.MinigameFeel?.onKill(tg, info, this.def, label);
            tg.kill(info);
            return true;
        }

        _onExpire(tg) {
            if (tg.penalty || tg.bonus || this.rt.state !== 'running') return;
            this.expired++;
            this.breakCombo('TOO SLOW');
        }

        clearTargets() {
            for (const tg of this.targets) tg.remove();
            this.targets = [];
        }
    }

    /* -------------------------------------------------------- the runtime */
    class MinigameRuntime {
        constructor() {
            this.defs = new Map();
            this.order = { fun: [], target: [], boss: [], mole: [], arcade: [], speed: [] };
            this.active = false;
            this.blockingUI = false;
            this.session = null;
            this.def = null;
            this.state = 'idle';
            this.matchRules = {};
            this.infiniteMag = false;
            this.pendingShot = null;
            this.hubCat = 'fun';
            this.hubSel = { fun: null, target: null, boss: null, mole: null, arcade: null, speed: null };
            this.hubOpts = { weapon: 'standard', difficulty: 'veteran', variant: 'gauntlet' };
            this.lib = {
                B, BMM, Ease, SFX, mulberry32, signTex, canvasTex, std, basic, HIDDEN_MAT, Target, clamp01, TAU, esc,
                loadTex, pbrMat, loadSkyboxTex, applySkybox, loadGLB, placeGLB, placeGLBInstanced
            };
        }

        register(def) {
            def.cat = def.cat || 'target';
            this.defs.set(def.id, def);
            if (!this.order[def.cat]) this.order[def.cat] = [];
            if (!this.order[def.cat].includes(def.id)) {
                this.order[def.cat].push(def.id);
                // keep each category in its declared order, whatever file registered it
                this.order[def.cat].sort((a, b) => ((this.defs.get(a).order ?? 999) - (this.defs.get(b).order ?? 999)));
            }
            if (def.map && BO.MapsData) {
                const atm = Object.assign({
                    skyTop: 0x1e3a8a, skyBottom: 0x93c5fd, fogColor: 0x9fb4cc, fogDensity: 0.006,
                    sunColor: 0xfff4e0, sunIntensity: 1.6, sunPos: [30, 60, 20],
                    hemiSky: 0xbfdbfe, hemiGround: 0x3f3a32, hemiIntensity: 0.85, moon: false
                }, def.map.atmosphere || {});
                BO.MapsData.MAPS['mg_' + def.id] = {
                    id: 'mg_' + def.id,
                    name: def.name,
                    mode: 'minigame',
                    subtitle: def.tagline || '',
                    description: def.desc || '',
                    atmosphere: atm,
                    skybox: def.map.skybox || null,
                    boxes: def.map.boxes || [B(0, -0.5, 0, 200, 1, 200, 'concrete')],
                    ramps: def.map.ramps || [],
                    lights: def.map.lights || [],
                    playerSpawn: def.map.spawn || { x: 0, y: 0, z: 0, yaw: 0 },
                    waypoints: def.map.waypoints || []
                };
            }
        }

        get(id) { return this.defs.get(id); }

        /** True when the player may pick between the course weapon and their own class. */
        hasWeaponChoice(def) { return !!def && def.cat === 'target' && !!def.standardWeapon && !def.lockWeapon; }

        /**
         * Save key for a personal best. Boss Rush keys on mode + difficulty; courses with
         * options (songs, modes) key on def.variantKey(opts); target courses keep a separate
         * record for the player's own class weapon (":class").
         */
        bestKey(def, opts) {
            opts = opts || {};
            if (def.cat === 'boss') return def.id + ':' + (opts.variant || '') + ':' + (opts.difficulty || 'veteran');
            let k = def.id;
            if (def.variantKey) { const v = def.variantKey(opts); if (v) k += ':' + v; }
            else if (def.variants && opts.variant) k += ':' + opts.variant;
            if (this.hasWeaponChoice(def) && opts.weapon === 'class') k += ':class';
            return k;
        }

        /** Star thresholds for a course with these options. */
        starsOf(def, opts) { return (def.starsFor && def.starsFor(opts || {})) || def.stars || []; }

        /** Best star count over every record of a definition (all variants and weapons). */
        bestStarsAny(def) {
            const m = (BO.Save.data && BO.Save.data.minigames && BO.Save.data.minigames.best) || {};
            let best = 0;
            for (const k of Object.keys(m)) if (k === def.id || k.startsWith(def.id + ':')) best = Math.max(best, m[k].stars || 0);
            return best;
        }
        list(cat) { return (this.order[cat] || []).map((id) => this.defs.get(id)); }

        /* ---------------------------------------------------------- lifecycle */
        start(camera, opts) {
            const def = this.defs.get(opts.mgId);
            if (!def) throw new Error('Unknown minigame ' + opts.mgId);
            this.stop();
            this.active = true;
            this.def = def;
            this.camera = camera;
            this.opts = Object.assign({}, opts.mgOptions || {});
            this.blockingUI = false;
            this.matchRules = Object.assign({ noHealthRegen: false }, def.matchRules || {});
            this.infiniteMag = !!def.infiniteMag;
            this.pendingShot = null;

            const scene = BO.World.build('mg_' + def.id);
            if (def.map && def.map.skybox) applySkybox(scene, def.map.skybox);
            const map = BO.World.mapData;
            const cls = BO.Loadout.getActiveClass();
            const loadout = this._buildLoadout(def, cls, this.opts.weapon);
            BO.Player.initForMatch('minigame', map.playerSpawn, loadout, false);
            if (!def.keepEquipment) {
                BO.Player.lethalCount = 0;
                BO.Player.tacticalCount = 0;
                BO.Player.ultimateCharge = 0;
                BO.Player.fieldCharge = 0;
            }
            if (def.noArmor) { BO.Player.armor = 0; BO.Player.armorReservePlates = 0; }
            BO.Combat.reset(camera);
            BO.Combat.onHitEnemy = (ent, dmg, hitbox, dist, w, pt, dir) => this._onHit(ent, { dmg, hitbox, dist, w, pt, dir });
            BO.Combat.onExplodeAt = (pos, rad, dmg, owner, isFlash, stunDur, wid) => this._onExplode(pos, rad, dmg, isFlash, stunDur, wid);
            BO.Combat.onActivateKillstreak = null;

            const S = new Session(this, def, scene, this.opts);
            this.session = S;
            BO.MinigameFeel?.onStart(def);
            if (def.build) def.build(S, this.lib);
            if (def.schedule) {
                def.schedule(S, this.lib);
                S.events.sort((a, b) => a.t - b.t);
            }
            if (def.rail) BO.Player.rideState = { kind: 'minigame', pos: BO.Player.pos.clone(), roll: 0, pitch: 0, eye: def.eyeHeight || 1.6 };
            if (def.start) def.start(S, this.lib);
            // Bullets ray-test against world matrices; make sure freshly built props are placed before frame one.
            scene.updateMatrixWorld(true);

            const skipCd = !!(BO.Save && BO.Save.data && BO.Save.data.minigames && BO.Save.data.minigames.skipCountdown)
                || !!(this.opts && this.opts.skipCountdown)
                || !!def.noCountdown
                || !!(S.data && S.data.noCountdown);
            this._lastBeep = 4;
            this.finishTimer = 0;
            this._buildHud();
            if (def.customMusic) { if (BO.Sound.stopMusic) BO.Sound.stopMusic(); }
            else BO.Sound.startMusic('zombies');
            BO.Events.emit('hud:banner', { title: def.name.toUpperCase(), sub: def.tagline || '', color: def.accent || '#f5a623' });
            if (skipCd || (def.countdown !== undefined && def.countdown <= 0)) {
                this.state = 'running';
                this.countdown = 0;
                this._showCountdown('GO!');
                SFX.beep(true);
                if (def.onGo) def.onGo(S, this.lib);
            } else {
                this.state = 'countdown';
                this.countdown = def.countdown ?? 3.0;
            }
            return scene;
        }

        stop() {
            if (!this.active && !this.session) return;
            if (BO.Assets && BO.Assets.stopMusicClips) BO.Assets.stopMusicClips();
            if (this.session) {
                if (this.def && this.def.dispose) { try { this.def.dispose(this.session, this.lib); } catch (e) { console.error(e); } }
                this.session.clearTargets();
                this._releaseGpu(this.session.scene);
                this._releaseGpu(this.session.graveyard);
                this.session.graveyard.clear();
                // Shared caches keep their CPU data but drop their GPU copies between sessions.
                for (const t of texCache.values()) if (t && t.isTexture) t.dispose();
                if (BO.Assets && BO.Assets.releaseGpu) BO.Assets.releaseGpu();
            }
            this.active = false;
            this.session = null;
            this.state = 'idle';
            this.blockingUI = false;
            this.infiniteMag = false;
            this.matchRules = {};
            if (BO.Player && BO.Player.rideState && BO.Player.rideState.kind === 'minigame') {
                BO.Player.rideState = null;
                BO.Player.parkourRoll = 0;
                BO.Player.parkourPitch = 0;
                BO.Player.eyeHeight = 1.6;
            }
            this._hideHud();
            this._hideResults();
        }

        /** Free GPU buffers for everything a course built (shared/cached materials & textures are kept). */
        /**
         * Frees everything a session uploaded to the GPU except the shared caches (canvasTex/pbrMat
         * caches here and the AssetLoader GLB/texture caches). Course files build many one-off
         * CanvasTextures for signs, labels and sprites; before this pass they were never disposed and
         * ~15 textures leaked per run (600+ after a long session). three.js re-uploads a disposed
         * texture or geometry if a module-level reference is ever drawn again, so this is safe.
         */
        _releaseGpu(scene) {
            if (!scene) return;
            const cachedMats = new Set(matCache.values());
            const cachedTex = new Set(texCache.values());
            const A = BO.Assets;
            const keepTex = (tx) => cachedTex.has(tx) || (A && A.hasCachedTexValue(tx));
            const freeTex = (tx) => { if (tx && tx.isTexture && !keepTex(tx)) tx.dispose(); };
            scene.traverse((o) => {
                if (!o.isMesh && !o.isInstancedMesh && !o.isSprite && !o.isPoints && !o.isLine) return;
                if (o.isInstancedMesh && typeof o.dispose === 'function') o.dispose();
                if (!o.isSprite && o.geometry && o.geometry.dispose && !(A && A.isSharedGeo(o.geometry)) && !o.userData.sharedGeometry) o.geometry.dispose();
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                for (const m of mats) {
                    if (!m || cachedMats.has(m) || (A && A.hasSharedMatValue(m)) || m === HIDDEN_MAT) continue;
                    for (const tk of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'emissiveMap', 'alphaMap', 'aoMap', 'envMap']) freeTex(m[tk]);
                    m.dispose();
                }
            });
            freeTex(scene.background);
            freeTex(scene.environment);
        }

        _buildLoadout(def, cls, weaponPref) {
            const mk = (id) => {
                const spec = BO.WeaponsData.get(id);
                const scoped = spec.modelSpec && spec.modelSpec.defaultScope;
                return {
                    id, camo: 'default',
                    attachments: { optic: scoped ? 'sniper_scope' : (def.standardOptic || 'reflex'), muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' }
                };
            };
            if (def.cat === 'boss') {
                return Object.assign({}, cls, { primary: cls.primary, secondary: cls.secondary });
            }
            const stdWep = typeof def.standardWeapon === 'function' ? def.standardWeapon(this.opts) : def.standardWeapon;
            const primary = ((weaponPref === 'class' && !def.lockWeapon) || !stdWep) ? cls.primary : mk(stdWep);
            const secondary = def.secondaryWeapon ? mk(def.secondaryWeapon) : null;
            return {
                name: 'MINIGAME', primary, secondary, perks: [],
                lethal: cls.lethal, tactical: cls.tactical, fieldUpgrade: cls.fieldUpgrade, ultimatePower: cls.ultimatePower
            };
        }

        /* ------------------------------------------------------------- input */
        /** Called by CombatSystem after a round is spent. */
        onShotFired() {
            if (!this.session || this.state !== 'running') return;
            this._resolvePendingShot();
            this.session.shots++;
            this.pendingShot = { hit: false };
            if (this.def.onShot) { try { this.def.onShot(this.session, this.lib); } catch (e) { console.error('[Minigames] onShot', e); } }
        }

        /** CombatSystem asks before playing the normal gunshot; true = the minigame made its own sound. */
        customGunSound(w) {
            if (!this.active || !this.def || !this.def.gunSound) return false;
            try { return this.def.gunSound(this.session, w, this.lib) !== false; } catch (e) { console.error(e); return false; }
        }

        /** CombatSystem skips the shot entirely while this is true (the minigame reads the trigger itself). */
        get blockFire() {
            if (!this.active || !this.def || !this.session) return false;
            return typeof this.def.blockFire === 'function' ? !!this.def.blockFire(this.session, this.state) : !!this.def.blockFire;
        }

        /** CombatSystem: a bullet stops at the first target it touches (no penetration). */
        get singleTargetShots() { return !!(this.active && this.def && this.def.oneTargetPerShot); }

        /** Minimum seconds between shots, regardless of the weapon's RPM. */
        get fireInterval() { return this.active && this.def ? (this.def.fireInterval || 0) : 0; }

        /** Bullet tracer colour override. */
        get tracerColor() { return this.active && this.def ? (this.def.tracerColor || 0) : 0; }

        /** PlayerController hides the first-person weapon while this is true. */
        get hideViewmodel() {
            if (!this.active || !this.def || !this.session) return false;
            return typeof this.def.hideViewmodel === 'function' ? !!this.def.hideViewmodel(this.session) : !!this.def.hideViewmodel;
        }

        _resolvePendingShot() {
            const ps = this.pendingShot;
            this.pendingShot = null;
            if (!ps || !this.session) return;
            if (ps.hit) this.session.shotHits++;
            else if (!this.def.forgivingMisses) this.session.breakCombo('MISSED SHOT');
        }

        _onHit(ent, info) {
            const S = this.session;
            if (!S || !ent || !ent.alive) return false;
            if (this.state !== 'running' && this.state !== 'finish' && !(this.def.cat === 'boss')) return false;
            // One round = one target: a bullet (or a whole shotgun shell) never touches a second target.
            if (this.def.oneTargetPerShot && this.pendingShot) {
                if (this.pendingShot.used) return false;
                this.pendingShot.used = true;
            }
            if (this.pendingShot) this.pendingShot.hit = true;
            if (this.def.onHit) {
                const r = this.def.onHit(S, ent, info, this.lib);
                if (r !== undefined) {
                    // Custom-scored courses still get the sampled impact when their target dies.
                    if (r === true && ent.mgTarget) BO.MinigameFeel?.onKill(ent, info, this.def, '');
                    return r;
                }
            }
            if (ent.mgTarget) return S.hitTarget(ent, info);
            return false;
        }

        _onExplode(pos, rad, dmg, isFlash, stunDur, wid) {
            if (this.def && this.def.onExplode) this.def.onExplode(this.session, pos, rad, dmg, isFlash, stunDur, wid);
        }

        /** Keys during play. Returns true when consumed. */
        handleGameKey(code, kb, firstDown) {
            if (!this.active) return false;
            if (this.def.onKey && firstDown && this.def.onKey(this.session, code, this.lib)) return true;
            if (this.def.keepEquipment) {
                return code === kb.armory || code === kb.exfil;
            }
            const blocked = [kb.lethal, kb.tactical, kb.special, kb.ultimate, 'KeyZ', kb.armory, kb.exfil, kb.armor].concat(this.def.blockKeys || []);
            return blocked.includes(code);
        }

        /** Keys while the results card is up. */
        handleUIKey(e) {
            if (!this.blockingUI) return false;
            const code = e.code;
            e.preventDefault();
            if (code === 'KeyR' || code === 'Space' || code === 'Enter') this._resultAction('retry');
            else if (code === 'KeyN') this._resultAction('next');
            else if (code === 'Escape' || code === 'KeyH') this._resultAction('hub');
            return true;
        }

        /* ------------------------------------------------------------ update */
        /** Before Player.update: drives rail vehicles so the camera never lags. */
        preUpdate(dt) {
            if (!this.active || !this.session) return;
            if (this.def.preUpdate) this.def.preUpdate(this.session, dt, this.lib, this.state);
        }

        update(dt) {
            if (!this.active || !this.session) return;
            const S = this.session;
            const def = this.def;
            const P = BO.Player;

            // Endless reserve ammo in every minigame (except the ones built around a single magazine).
            if (def.noReload) {
                for (const w of P.weapons) if (w) w.reserve = 0;
                if (P.reloading) { P.reloading = false; P.reloadTimer = 0; }
            } else if (!def.fixedAmmo) {
                for (const w of P.weapons) if (w && w.stats && w.stats.reserveMax) w.reserve = w.stats.reserveMax;
            }
            if (this.infiniteMag && P.activeWeapon && P.activeWeapon.stats && P.activeWeapon.stats.magSize) {
                P.activeWeapon.mag = P.activeWeapon.stats.magSize;
                if (P.reloading) { P.reloading = false; P.reloadTimer = 0; }
            }

            if (def.maxScopeTime) {
                if (S.data._scopeLock > 0) {
                    S.data._scopeLock -= dt;
                    P.adsHeld = false;
                } else if (P.adsHeld) {
                    S.data._scopeT = (S.data._scopeT || 0) + dt;
                    if (S.data._scopeT >= def.maxScopeTime) {
                        P.adsHeld = false;
                        P.adsAlpha = 0;
                        S.data._scopeT = 0;
                        S.data._scopeLock = 0.40;
                        this.toast('QUICKSCOPE ONLY — SCOPE RESET', '#fde68a');
                    }
                } else {
                    S.data._scopeT = 0;
                }
            }

            if (def.onMelee) {
                if (P.meleeTimer > 0 && !S.data._meleeFired) {
                    S.data._meleeFired = true;
                    def.onMelee(S, this.lib);
                } else if (P.meleeTimer <= 0) {
                    S.data._meleeFired = false;
                }
            }

            if (this.pendingShot) this._resolvePendingShot();

            if (this.state === 'countdown') {
                this.countdown -= dt;
                const n = Math.ceil(this.countdown);
                if (n !== this._lastBeep && n >= 0) {
                    this._lastBeep = n;
                    if (n > 0) {
                        SFX.beep(false);
                        this._showCountdown(String(n));
                        if (n >= 1 && n <= 3 && BO.Assets) BO.Assets.playClip(`audio/voice/Voiceover Pack (Kenney)/Male/${n}.ogg`, { volume: 0.78 });
                    } else {
                        SFX.beep(true);
                        this._showCountdown('GO!');
                        if (BO.Assets) BO.Assets.playClip('audio/voice/Voiceover Pack (Kenney)/Male/go.ogg', { volume: 0.84 });
                    }
                }
                if (this.countdown <= 0) {
                    this.state = 'running';
                    if (def.onGo) def.onGo(S, this.lib);
                }
            } else if (this.state === 'running') {
                S.t += dt;
                while (S.eventCursor < S.events.length && S.events[S.eventCursor].t <= S.t) {
                    const ev = S.events[S.eventCursor++];
                    try { ev.fn(S, this.lib); } catch (err) { console.error('[Minigames] event', err); }
                }
                const sec = Math.floor(S.t);
                if (S.timeline.length <= sec) S.timeline.push(S.score);
                BO.MinigameFeel?.onTick(S);
                if (S.duration && S.t >= S.duration) this._beginFinish('TIME!');
            } else if (this.state === 'finish') {
                this.finishTimer -= dt;
                if (this.finishTimer <= 0) {
                    if (S.opts && S.opts.exampleMode) this.launch(def.id, Object.assign({}, this.opts, { exampleMode: false }));
                    else this._showResults();
                }
            }

            if (def.update) def.update(S, dt, this.lib, this.state);

            // Targets + scenery.
            const pool = [];
            for (let i = S.targets.length - 1; i >= 0; i--) {
                const tg = S.targets[i];
                tg.update(dt);
                if (tg.removed) { S.targets.splice(i, 1); continue; }
                if (tg.alive) for (const m of tg.hitMeshes) pool.push(m);
            }
            for (let i = S.updaters.length - 1; i >= 0; i--) {
                if (S.updaters[i](dt, S) === false) S.updaters.splice(i, 1);
            }
            if (def.extraTargets) def.extraTargets(S, pool);
            BO.Combat.setTargetPool(pool);

            S.displayScore += (S.score - S.displayScore) * Math.min(1, dt * 10);
            if (Math.abs(S.score - S.displayScore) < 0.5) S.displayScore = S.score;
            this._updateHud(dt);
            this._updatePopups(dt);
        }

        /** Ends a run: shows the "TIME!" beat then the results card. */
        _beginFinish(label, opts = {}) {
            if (this.state === 'finish' || this.state === 'results') return;
            this.state = 'finish';
            this.finishTimer = opts.delay ?? 1.8;
            this.finishLabel = label;
            this.finishOpts = opts;
            if (this.pendingShot) this._resolvePendingShot();
            const S = this.session;
            S.timeline.push(S.score);
            for (const tg of S.targets) if (tg.alive) tg.retire();
            const isExample = !!(S && S.opts && S.opts.exampleMode);
            if (!isExample) BO.MinigameFeel?.onFinish(label);
            this._showCountdown(isExample ? 'EXAMPLE COMPLETE — YOUR TURN!' : label, isExample ? '#67e8f9' : (opts.color || '#fde68a'), true);
            SFX.beep(true);
        }

        finish(label, opts) { this._beginFinish(label, opts); }

        /* --------------------------------------------------------------- HUD */
        _buildHud() {
            let el = document.getElementById('mg-hud');
            if (!el) {
                el = document.createElement('div');
                el.id = 'mg-hud';
                document.getElementById('hud-layer').appendChild(el);
            }
            const def = this.def;
            el.className = 'mg-hud mg-cat-' + def.cat;
            el.style.setProperty('--mg-accent', def.accent || '#f5a623');
            el.innerHTML = `
                <div class="mg-top">
                    <div class="mg-course"><span class="mg-ico">${def.icon || '🎯'}</span><div><b>${esc(def.name)}</b><small>${esc(def.hudSub || def.tagline || '')}</small></div></div>
                    <div class="mg-clock"><div class="mg-clock-val" id="mg-clock">--</div><div class="mg-clock-bar"><i id="mg-clock-fill"></i></div></div>
                    <div class="mg-scorebox"><small id="mg-score-lbl">SCORE</small><div id="mg-score">0</div></div>
                </div>
                <div class="mg-side">
                    <div class="mg-combo" id="mg-combo"><div class="mg-combo-mult" id="mg-combo-mult">x1</div><div class="mg-combo-sub"><span id="mg-combo-n">0</span> STREAK</div><div class="mg-combo-bar"><i id="mg-combo-fill"></i></div></div>
                    <div class="mg-stat-row"><span>ACCURACY</span><b id="mg-acc">—</b></div>
                    <div class="mg-stat-row"><span>TARGETS</span><b id="mg-tg">0</b></div>
                    <div class="mg-stat-row" id="mg-intensity-row"><span>INTENSITY</span><div class="mg-intensity"><i id="mg-intensity"></i></div></div>
                </div>
                <div class="mg-extra" id="mg-extra"></div>
                <img class="mg-reticle hidden" id="mg-reticle" alt="">
                <div class="mg-count hidden" id="mg-count"></div>
                <div class="mg-toast hidden" id="mg-toast"></div>
                <div class="mg-flash" id="mg-flash"></div>
                <div class="mg-popups" id="mg-popups"></div>`;
            const retPath = def.reticle || (
                def.id === 'sniper_ridge' ? 'staged_assets/ui/cursors/Vector/Outline/target_b.svg' :
                def.id === 'aim_lab' ? 'staged_assets/ui/cursors/Vector/Outline/cross_small.svg' :
                def.cat === 'speed' ? 'staged_assets/ui/cursors/Vector/Outline/target_round_a.svg' :
                def.cat === 'target' ? 'staged_assets/ui/cursors/Vector/Outline/target_a.svg' :
                def.cat === 'fun' ? 'staged_assets/ui/cursors/Vector/Outline/target_round_b.svg' : ''
            );
            const retEl = el.querySelector('#mg-reticle');
            if (retPath && retEl) {
                retEl.src = retPath;
                document.body.classList.add('mg-custom-reticle');
            } else {
                document.body.classList.remove('mg-custom-reticle');
            }
            el.classList.remove('hidden');
            this.hud = {
                root: el,
                clock: el.querySelector('#mg-clock'), clockFill: el.querySelector('#mg-clock-fill'),
                score: el.querySelector('#mg-score'), scoreLbl: el.querySelector('#mg-score-lbl'),
                combo: el.querySelector('#mg-combo'), comboMult: el.querySelector('#mg-combo-mult'), comboN: el.querySelector('#mg-combo-n'), comboFill: el.querySelector('#mg-combo-fill'),
                acc: el.querySelector('#mg-acc'), tg: el.querySelector('#mg-tg'), intensity: el.querySelector('#mg-intensity'),
                extra: el.querySelector('#mg-extra'), reticle: retEl, hasReticle: !!retPath,
                count: el.querySelector('#mg-count'), toast: el.querySelector('#mg-toast'),
                flash: el.querySelector('#mg-flash'), popups: el.querySelector('#mg-popups')
            };
            this.popups = [];
            this._toastT = 0;
            this._countT = 0;
            document.body.classList.add('mg-playing');
            if (def.cat === 'boss') this.hud.scoreLbl.textContent = 'BOSSES';
        }

        _hideHud() {
            const el = document.getElementById('mg-hud');
            if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
            document.body.classList.remove('mg-playing', 'mg-custom-reticle');
            this.hud = null;
            this.popups = [];
        }

        _updateHud(dt) {
            const h = this.hud;
            const S = this.session;
            if (!h || !S) return;
            const def = this.def;
            if (h.reticle && h.hasReticle) {
                const P = BO.Player;
                const w = P && P.activeWeapon;
                const useScope = w && w.stats && w.stats.useScopeOverlay && P.adsAlpha > 0.80;
                const showRet = !this.blockingUI && !this.hideViewmodel && P && P.adsAlpha < 0.55 && !useScope && BO.Settings.get('crosshairStyle') !== 'off';
                h.reticle.classList.toggle('hidden', !showRet);
                if (showRet && P) {
                    const spd = Math.hypot(P.vel.x, P.vel.z);
                    const spread = (w && w.stats ? w.stats.hipSpread * 8 : 0) + spd * 0.04 + (P.recoilPitch || 0) * 1.6;
                    const sc = Math.min(1.65, 1.0 + spread * 0.25);
                    h.reticle.style.transform = `translate(-50%, -50%) scale(${sc.toFixed(2)})`;
                }
            }
            if (S.duration) {
                const rem = this.state === 'countdown' ? S.duration : Math.max(0, S.duration - S.t);
                h.clock.textContent = rem.toFixed(rem < 10 ? 1 : 0);
                h.clock.classList.toggle('mg-clock-low', rem < 10 && this.state === 'running');
                h.clockFill.style.width = (rem / S.duration * 100).toFixed(1) + '%';
            } else {
                h.clock.textContent = BO.Math.formatTime(S.t);
                h.clockFill.style.width = '100%';
            }
            h.score.textContent = def.scoreText ? def.scoreText(S) : Math.round(S.displayScore).toLocaleString();
            const mult = S.comboMult;
            h.comboMult.textContent = 'x' + mult.toFixed(1).replace('.0', '');
            h.comboN.textContent = S.combo;
            h.comboFill.style.width = (mult >= 4 ? 100 : (S.combo % 5) / 5 * 100) + '%';
            h.combo.dataset.tier = String(Math.min(6, Math.floor(S.combo / 5)));
            h.acc.textContent = S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—';
            h.tg.textContent = def.cat === 'boss' ? (S.data.defeated || 0) + ' / ' + (S.data.total || 0) : S.kills + ' / ' + S.spawned;
            h.intensity.style.width = (S.k * 100).toFixed(0) + '%';
            if (def.hud) {
                const html = def.hud(S, this.lib, this.state);
                if (html !== h._lastExtra) { h.extra.innerHTML = html || ''; h._lastExtra = html; }
            }
            if (this._toastT > 0) { this._toastT -= dt; if (this._toastT <= 0) h.toast.classList.add('hidden'); }
            if (this._countT > 0) { this._countT -= dt; if (this._countT <= 0) h.count.classList.add('hidden'); }
        }

        _showCountdown(text, color, hold) {
            if (!this.hud) return;
            const c = this.hud.count;
            c.textContent = text;
            c.style.color = color || '';
            c.classList.remove('hidden', 'mg-pulse');
            void c.offsetWidth;
            c.classList.add('mg-pulse');
            this._countT = hold ? 99 : 0.9;
        }

        toast(text, color) {
            if (!this.hud) return;
            const t = this.hud.toast;
            t.textContent = text;
            t.style.color = color || '#fde68a';
            t.classList.remove('hidden', 'mg-pulse');
            void t.offsetWidth;
            t.classList.add('mg-pulse');
            this._toastT = 1.6;
        }

        flashScreen(color) {
            if (!this.hud) return;
            const f = this.hud.flash;
            f.style.background = color;
            f.classList.remove('mg-flash-on');
            void f.offsetWidth;
            f.classList.add('mg-flash-on');
        }

        flashCombo() {
            if (!this.hud) return;
            const c = this.hud.combo;
            c.classList.remove('mg-pulse');
            void c.offsetWidth;
            c.classList.add('mg-pulse');
        }

        popup(pos, text, color, big) {
            if (!this.hud) return;
            const el = document.createElement('div');
            el.className = 'mg-pop' + (big ? ' mg-pop-big' : '');
            el.textContent = text;
            el.style.color = color;
            this.hud.popups.appendChild(el);
            this.popups.push({ el, pos: pos.clone(), t: 0, life: big ? 1.25 : 0.95 });
            if (this.popups.length > 28) { const p = this.popups.shift(); p.el.remove(); }
        }

        _updatePopups(dt) {
            if (!this.popups || !this.camera) return;
            const cam = this.camera;
            const v = new THREE.Vector3();
            const W = window.innerWidth, H = window.innerHeight;
            for (let i = this.popups.length - 1; i >= 0; i--) {
                const p = this.popups[i];
                p.t += dt;
                if (p.t >= p.life) { p.el.remove(); this.popups.splice(i, 1); continue; }
                v.copy(p.pos);
                v.y += p.t * 0.9;
                v.project(cam);
                if (v.z > 1) { p.el.style.opacity = '0'; continue; }
                const x = (v.x * 0.5 + 0.5) * W;
                const y = (-v.y * 0.5 + 0.5) * H;
                const a = p.t < 0.12 ? p.t / 0.12 : 1 - clamp01((p.t - p.life * 0.6) / (p.life * 0.4));
                const s = p.t < 0.12 ? 0.6 + p.t / 0.12 * 0.6 : 1.2 - Math.min(0.2, (p.t - 0.12) * 0.8);
                p.el.style.opacity = a.toFixed(2);
                p.el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) translate(-50%, -50%) scale(${s.toFixed(2)})`;
            }
        }

        /* ----------------------------------------------------------- results */
        _computeResult() {
            const S = this.session;
            const def = this.def;
            if (def.result) return def.result(S, this.lib);
            const stars = this.starsOf(def, this.opts).filter((th) => S.score >= th).length;
            return {
                score: S.score,
                stars,
                title: stars >= 4 ? 'PLATINUM' : stars === 3 ? 'GOLD' : stars === 2 ? 'SILVER' : stars === 1 ? 'BRONZE' : 'COURSE COMPLETE',
                stats: [
                    ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—'],
                    ['TARGETS HIT', S.kills + ' / ' + S.spawned],
                    ['BEST STREAK', S.maxCombo],
                    [def.ringScoring ? 'BULLSEYES' : 'HEADSHOTS', def.ringScoring ? S.bullseyes : S.headshots],
                    ['ESCAPED', S.expired],
                    ['PENALTIES', S.penalties]
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(120 + S.score * 0.06 + stars * 150)
            };
        }

        _save() {
            const d = BO.Save.data;
            if (!d.minigames) d.minigames = { best: {}, plays: 0, skipCountdown: false };
            if (!d.minigames.best) d.minigames.best = {};
            if (typeof d.minigames.skipCountdown !== 'boolean') d.minigames.skipCountdown = false;
            return d.minigames;
        }

        bestFor(id, variant) {
            const m = (BO.Save.data && BO.Save.data.minigames) || null;
            if (!m || !m.best) return null;
            return m.best[variant ? id + ':' + variant : id] || null;
        }

        _showResults() {
            if (this.state === 'results') return;
            this.state = 'results';
            const def = this.def;
            const S = this.session;
            const res = this._computeResult();
            const isExample = !!(S && S.opts && S.opts.exampleMode);
            const isSandbox = !!(S && ((S.opts && S.opts.noHighScore) || (S.data && S.data.noHighScore) || def.noHighScore));
            const noSave = isExample || isSandbox;
            if (isExample) { res.score = 0; res.stars = 0; res.xp = 0; }
            else if (isSandbox) { res.stars = 0; res.xp = 0; }
            const key = this.bestKey(def, this.opts);
            const store = this._save();
            const prev = noSave ? null : (store.best[key] || null);
            const better = !noSave && (def.betterThan ? def.betterThan(res, prev) : (!prev || res.score > prev.score));
            if (!noSave) {
                store.plays = (store.plays || 0) + 1;
                if (better) store.best[key] = { score: res.score, stars: Math.max(res.stars, prev ? prev.stars : 0), extra: res.saveExtra || null, at: Date.now() };
                else if (prev && res.stars > prev.stars) prev.stars = res.stars;
                if (res.xp) BO.Progression.grantPlayerXP(res.xp, 'minigame');
                BO.Progression.flushSave ? BO.Progression.flushSave() : BO.Save.save();
                if (BO.Assets) {
                    const clip = (better && prev) ? 'new_highscore.ogg' : (res.stars >= 1 ? 'mission_completed.ogg' : 'game_over.ogg');
                    BO.Assets.playClip('audio/voice/Voiceover Pack (Kenney)/Male/' + clip, { volume: 0.80 });
                }
                BO.MinigameFeel?.onResults(res, this.starsOf(def, this.opts).length);
                BO.MinigameDaily?.onResults(def, res);
            }

            this.blockingUI = true;
            BO.State.paused = true;
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            if (document.pointerLockElement) document.exitPointerLock();

            const next = this._nextDef();
            let el = document.getElementById('mg-results');
            if (!el) {
                el = document.createElement('div');
                el.id = 'mg-results';
                document.body.appendChild(el);
            }
            const starList = this.starsOf(def, this.opts);
            const starHtml = (starList.length ? starList : [1, 1, 1, 1]).map((th, i) => `<div class="mg-star mg-star-${i}" data-i="${i}"><svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg><small>${def.starLabel ? def.starLabel(th, i) : Number(th).toLocaleString()}</small></div>`).join('');
            el.className = 'mg-results';
            el.style.setProperty('--mg-accent', def.accent || '#f5a623');
            el.innerHTML = `
                <div class="mg-res-card">
                    <div class="mg-res-head">
                        <span class="mg-res-ico">${def.icon || '🎯'}</span>
                        <div><small>${{ fun: 'FUN & SPECIALS', target: 'TARGET PRACTICE', boss: 'BOSS RUSH', arcade: 'ARCADE HALL', speed: 'SPEED RUN', mole: 'WHACK-A-MOLE' }[def.cat] || 'MINIGAME'}${this.hasWeaponChoice(def) ? (this.opts.weapon === 'class' ? ' • MY CLASS' : ' • COURSE WEAPON') : ''}${this.opts.variantLabel ? ' • ' + esc(this.opts.variantLabel) : ''}</small><h2>${esc(def.name)}</h2></div>
                        ${!noSave && better && prev ? '<div class="mg-newbest">NEW BEST!</div>' : (!noSave && !prev ? '<div class="mg-newbest mg-first">FIRST CLEAR</div>' : (isExample ? '<div class="mg-newbest">EXAMPLE POV</div>' : (isSandbox ? '<div class="mg-newbest">SANDBOX</div>' : '')))}
                    </div>
                    <div class="mg-res-title">${esc(res.title)}</div>
                    <div class="mg-res-score"><span id="mg-res-score">0</span><small>${esc(res.scoreLabel || 'POINTS')}</small></div>
                    <div class="mg-res-stars">${starHtml}</div>
                    <div class="mg-res-grid">${res.stats.map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>
                    ${res.extraHtml || ''}
                    ${res.noGraph ? '' : `<div class="mg-res-graph"><canvas id="mg-res-canvas" width="640" height="120"></canvas><small>${esc(res.graphLabel || 'SCORE OVER TIME')}</small></div>`}
                    <div class="mg-res-best">${isExample ? '<b>EXAMPLE PLAYBACK ONLY — 0 POINTS / NO PROGRESS SAVED</b>' : isSandbox ? '<b>SANDBOX MODE — NO HIGH SCORE OR XP SAVED</b>' : (prev ? 'PREVIOUS BEST: <b>' + esc(def.formatBest ? def.formatBest(prev) : Number(prev.score).toLocaleString()) + '</b>' : 'No previous record') + ' • +' + (res.xp || 0) + ' XP'}</div>
                    <div class="mg-res-actions">
                        <button class="btn" data-act="hub">MINIGAMES <kbd>ESC</kbd></button>
                        <button class="btn" data-act="menu">MAIN MENU</button>
                        ${(res.actions || []).map((a) => `<button class="btn mg-res-custom" data-act="x:${esc(a.id)}">${esc(a.label)}</button>`).join('')}
                        ${next ? `<button class="btn" data-act="next">NEXT: ${esc(next.name)} <kbd>N</kbd></button>` : ''}
                        <button class="btn btn-primary" data-act="retry">RETRY <kbd>R</kbd></button>
                    </div>
                </div>`;
            el.classList.remove('hidden');
            el.querySelectorAll('[data-act]').forEach((b) => {
                b.onmouseenter = () => BO.Sound.playUIHover?.();
                b.onclick = () => { BO.Sound.playUIClick(); this._resultAction(b.dataset.act); };
            });
            this._lastRes = res;
            this._animateResults(el, res);
            if (res.onShow) { try { res.onShow(el); } catch (e) { console.error(e); } }
        }

        _animateResults(el, res) {
            const scoreEl = el.querySelector('#mg-res-score');
            const target = res.score;
            const t0 = performance.now();
            const dur = 1100;
            const fmt = res.formatScore || ((v) => Math.round(v).toLocaleString());
            const tick = () => {
                if (!el.isConnected || el.classList.contains('hidden')) return;
                const p = clamp01((performance.now() - t0) / dur);
                scoreEl.textContent = fmt(target * Ease.outCubic(p));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            const stars = el.querySelectorAll('.mg-star');
            for (let i = 0; i < stars.length; i++) {
                if (i < res.stars) {
                    setTimeout(() => { stars[i].classList.add('mg-star-on'); SFX.star(i); }, 650 + i * 330);
                }
            }
            if (res.stars >= 3) setTimeout(() => SFX.fanfare(), 650 + res.stars * 330);
            if (res.stars >= 2 && BO.Assets?.playClip) {
                setTimeout(() => BO.Assets.playClip(res.stars >= 3 ? 'overhaul/stingers/level_complete.wav' : 'overhaul/stingers/chime_positive.wav', { volume: 0.34 }), 650 + res.stars * 300);
            }
            // Score-over-time sparkline.
            const cv = el.querySelector('#mg-res-canvas');
            const S = this.session;
            const data = res.graph || (S ? S.timeline : []);
            if (cv && data && data.length > 1) {
                const g = cv.getContext('2d');
                const W = cv.width, H = cv.height;
                const max = Math.max(1, ...data);
                const min = Math.min(0, ...data);
                g.clearRect(0, 0, W, H);
                g.strokeStyle = 'rgba(148,163,184,0.15)';
                g.lineWidth = 1;
                for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, H * i / 4); g.lineTo(W, H * i / 4); g.stroke(); }
                const accent = getComputedStyle(el).getPropertyValue('--mg-accent').trim() || '#f5a623';
                const pts = data.map((v, i) => [i / (data.length - 1) * (W - 8) + 4, H - 6 - (v - min) / (max - min) * (H - 14)]);
                const grad = g.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0, accent + '88');
                grad.addColorStop(1, accent + '00');
                g.beginPath();
                g.moveTo(pts[0][0], H);
                pts.forEach(([x, y]) => g.lineTo(x, y));
                g.lineTo(pts[pts.length - 1][0], H);
                g.closePath();
                g.fillStyle = grad;
                g.fill();
                g.beginPath();
                pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
                g.strokeStyle = accent;
                g.lineWidth = 3;
                g.lineJoin = 'round';
                g.stroke();
                (this.def.cat === 'boss' || res.timeScore ? [] : this.starsOf(this.def, this.opts)).forEach((th, i) => {
                    if (th > max || th < min) return;
                    const y = H - 6 - (th - min) / (max - min) * (H - 14);
                    g.setLineDash([5, 5]);
                    g.strokeStyle = ['#b45309', '#94a3b8', '#facc15', '#a5f3fc'][i];
                    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
                    g.setLineDash([]);
                });
            }
        }

        _hideResults() {
            const el = document.getElementById('mg-results');
            if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
        }

        _nextDef() {
            if (!this.def || this.def.cat === 'boss') return null;
            const ids = this.order[this.def.cat];
            const i = ids.indexOf(this.def.id);
            return i >= 0 && i < ids.length - 1 ? this.defs.get(ids[i + 1]) : null;
        }

        _resultAction(act) {
            const def = this.def;
            const opts = this.opts;
            if (act.startsWith('x:')) {
                const res = this._lastRes;
                this._hideResults();
                this.blockingUI = false;
                BO.State.paused = false;
                if (res && res.onAction) res.onAction(act.slice(2));
                return;
            }
            this._hideResults();
            this.blockingUI = false;
            BO.State.paused = false;
            if (act === 'retry') {
                if (opts && opts.exampleMode) this.launch(def.id, Object.assign({}, opts, { exampleMode: false }));
                else BO.App.restartMatch();
            } else if (act === 'next') {
                const n = this._nextDef();
                if (n) this.launch(n.id, Object.assign({}, opts));
                else BO.App.restartMatch();
            } else if (act === 'menu') {
                this._returnTo = 'main_menu';
                BO.App.exitToMenu();
            } else {
                this.hubCat = def ? def.cat : this.hubCat;
                this._returnTo = 'minigames';
                BO.App.exitToMenu();
            }
        }

        /** Where exitToMenu should land after a minigame. */
        consumeReturnScreen() {
            const r = this._returnTo || 'minigames';
            this._returnTo = null;
            return r;
        }

        launch(id, mgOptions) {
            const def = this.defs.get(id);
            if (!def) return;
            if (BO.Net && BO.Net.active) {
                BO.Events.emit('hud:toast', { text: 'Minigames are solo. Leave the online lobby to play.', color: '#a6ddd0' });
                return;
            }
            BO.App.startMatch({ mode: 'minigame', mapId: 'mg_' + id, mgId: id, mgOptions: mgOptions || {} });
        }
    }

    BO.Minigames = new MinigameRuntime();
    BO.MinigameLib = BO.Minigames.lib;
})(window);
