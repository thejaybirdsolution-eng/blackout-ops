/* ============================================================================
   BLACKOUT OPS — EnemyRig
   Animation + hit volumes for enemies whose body is a GLB model.

   Three drivers, picked from what the model contains:
   • ClipDriver      — Kenney-style characters with named clips (idle, walk,
                       sprint, attack-melee-*, holding-*-shoot, die …). Legs keep
                       walking while the upper body attacks or aims, through
                       split upper/lower clips. Playback speed follows ground
                       speed so feet do not skate.
   • HumanoidDriver  — skinned humanoids without clips (the Imp and Puglin
                       monsters). Builds a relaxed rest pose out of the bind
                       T-pose and drives a procedural base (stride, breathing,
                       lean, stun wobble), then layers Quaternius UAL mocap
                       presets on top: zombie idle/walk, jog/sprint, scratch,
                       jab, cross, overhead smash, cast, throw, head/chest hit
                       reactions, dance and a full fall-down death.
   • BobDriver       — rigid models with no skeleton: bob, sway and lean.

   Every rig also replaces the entity's hit list with surfaces taken from the
   model (BO.Hitboxes.fromModel), so the hitboxes follow the animation.

   Public:
     EnemyRig.mount(entity|null, parts, holder, model, opts) -> rig
     EnemyRig.mountZombieOverlay(parts, spec, entity)        (ZombieModel hook)
     rig.update(dt, state)   state: { speed, attackSwing, flinch, hitZone, dead, firing, aim }
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
    const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion();
    const _va = new THREE.Vector3(), _vb = new THREE.Vector3();
    const _ma = new THREE.Matrix4(), _mb = new THREE.Matrix4();
    const _s = new THREE.Vector3(), _p = new THREE.Vector3();

    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const smooth = (cur, target, rate, dt) => cur + (target - cur) * Math.min(1, rate * dt);
    const ease = (t) => t * t * (3 - 2 * t);

    /** Rotation of `obj` expressed in `frame`'s space (scale discarded). */
    function frameQuat(obj, frame, out) {
        _ma.copy(frame.matrixWorld).invert().multiply(obj.matrixWorld);
        _ma.decompose(_p, out, _s);
        return out;
    }
    function framePos(obj, frame, out) {
        _ma.copy(frame.matrixWorld).invert().multiply(obj.matrixWorld);
        return out.setFromMatrixPosition(_ma);
    }

    // Composes a character-space rotation from Euler-like components (x: pitch, y: yaw, z: roll).
    function deltaQ(out, x, y, z) {
        out.identity();
        if (y) out.multiply(_qc.setFromAxisAngle(Y, y));
        if (x) out.multiply(_qc.setFromAxisAngle(X, x));
        if (z) out.multiply(_qc.setFromAxisAngle(Z, z));
        return out;
    }

    /* ======================================================================
       HumanoidDriver — UE-mannequin style skeletons without clips
    ====================================================================== */
    const BONE_PATTERNS = {
        pelvis: /^(pelvis|hips?)$/i,
        spine1: /^spine_?0?1$|^spine$/i,
        spine2: /^spine_?0?2$|^chest$/i,
        spine3: /^spine_?0?3$|^upper_?chest$/i,
        neck: /^neck(_?0?1)?$/i,
        head: /^head$/i,
        claL: /^clavicle_l$|^l(eft)?_?shoulder$/i, claR: /^clavicle_r$|^r(ight)?_?shoulder$/i,
        uaL: /^upperarm_l$|^l(eft)?_?(upper)?arm$/i, uaR: /^upperarm_r$|^r(ight)?_?(upper)?arm$/i,
        laL: /^lowerarm_l$|^l(eft)?_?fore_?arm$/i, laR: /^lowerarm_r$|^r(ight)?_?fore_?arm$/i,
        handL: /^hand_l$|^l(eft)?_?hand$/i, handR: /^hand_r$|^r(ight)?_?hand$/i,
        thL: /^thigh_l$|^l(eft)?_?(up_?)?leg$/i, thR: /^thigh_r$|^r(ight)?_?(up_?)?leg$/i,
        caL: /^calf_l$|^l(eft)?_?(low_?|shin)/i, caR: /^calf_r$|^r(ight)?_?(low_?|shin)/i,
        ftL: /^foot_l$|^l(eft)?_?foot$/i, ftR: /^foot_r$|^r(ight)?_?foot$/i
    };

    // Quaternius Universal Animation Library 1 & 2 (CC0), stripped to the 20 tracked bones.
    //  • zombie-locomotion.glb — in-place idle/walk rotations.
    //  • humanoid-presets.glb  — jog, sprint, melee (scratch, jab, cross, overhead smash),
    //    cast and throw, head/chest hit reactions, a full fall-down death and a dance loop,
    //    with the pelvis translation track so the death drops the body to the ground.
    // Each monster keeps its own proportions; clips are applied as deltas from the UAL rest pose.
    let locomotionSource, presetSource;
    function loadLocomotion() {
        if (!locomotionSource) {
            locomotionSource = BO.Assets.loadGLB('monsters/zombie-locomotion.glb').catch((err) => {
                BO.log?.('EnemyRig', 'debug', 'Using procedural locomotion', err);
                return null;
            });
        }
        return locomotionSource;
    }
    function loadPresets() {
        if (!presetSource) {
            presetSource = BO.Assets.loadGLB('monsters/humanoid-presets.glb').catch((err) => {
                BO.log?.('EnemyRig', 'debug', 'Using procedural combat poses', err);
                return null;
            });
        }
        return presetSource;
    }

    /**
     * Strike timing per attack clip (seconds into the clip where the striking arm peaks),
     * measured from the clip's arm angular velocity. The entity's swing timer is mapped so
     * the clip's strike lands on the same beat as the gameplay hit (p = 0.47).
     */
    const ATTACK_CLIPS = {
        Zombie_Scratch: { strike: 0.6, span: 1.15 },
        Punch_Jab: { strike: 0.17, span: 0.62 },
        Punch_Cross: { strike: 0.23, span: 0.72 },
        Sword_Attack: { strike: 0.4, span: 0.95 },
        Spell_Simple_Shoot: { strike: 0.12, span: 0.5 },
        OverhandThrow: { strike: 0.4, span: 0.95 }
    };
    const STRIKE_P = 0.47;
    const DEATH_RATE = 1.5; // Death01 is 2.4 s; this lands the body in 1.6 s, before entities start sinking it.

    class HumanoidDriver {
        static detect(model) {
            let bones = 0, pelvis = false, ua = false, th = false;
            model.traverse((o) => {
                if (!o.isBone) return;
                bones++;
                if (BONE_PATTERNS.pelvis.test(o.name)) pelvis = true;
                if (BONE_PATTERNS.uaL.test(o.name)) ua = true;
                if (BONE_PATTERNS.thL.test(o.name)) th = true;
            });
            return bones > 8 && pelvis && ua && th;
        }

        constructor(rig, model, opts) {
            this.rig = rig;
            this.frame = rig.holder;
            this.style = opts.style || 'fiend'; // 'fiend' (lean, clawed) | 'brute' (heavy, two-handed)
            const b = this.b = {};
            model.traverse((o) => {
                if (!o.isBone) return;
                for (const k in BONE_PATTERNS) if (!b[k] && BONE_PATTERNS[k].test(o.name)) b[k] = o;
            });
            this.frame.updateMatrixWorld(true);
            // Tracked bones (topologically ordered) and their bind data.
            const tracked = Object.values(b).filter(Boolean);
            const depth = (o) => { let d = 0; for (let p = o.parent; p; p = p.parent) d++; return d; };
            tracked.sort((p, q) => depth(p) - depth(q));
            this.order = tracked;
            this.isTracked = new Set(tracked);
            this.L0 = new Map(); this.F0 = new Map(); this.Fstatic = new Map(); this.Lrest = new Map();
            for (const bone of tracked) {
                this.L0.set(bone, bone.quaternion.clone());
                this.F0.set(bone, frameQuat(bone, this.frame, new THREE.Quaternion()));
                if (bone.parent && !this.isTracked.has(bone.parent)) this.Fstatic.set(bone.parent, frameQuat(bone.parent, this.frame, new THREE.Quaternion()));
            }
            this.Frest = new Map();
            for (const bone of tracked) this.Frest.set(bone, this.F0.get(bone).clone());
            this._buildRest();
            for (const bone of tracked) {
                const Fp = this._parentRest(bone);
                this.Lrest.set(bone, Fp.clone().invert().multiply(this.Frest.get(bone)));
            }
            // Pelvis bob axis: one frame-space metre expressed in the pelvis parent's local units.
            if (b.pelvis && b.pelvis.parent) {
                _mb.copy(this.frame.matrixWorld).invert().multiply(b.pelvis.parent.matrixWorld).invert();
                this.bobAxis = new THREE.Vector3(0, 1, 0).applyMatrix3(new THREE.Matrix3().setFromMatrix4(_mb));
                this.fwdAxis = new THREE.Vector3(0, 0, 1).applyMatrix3(new THREE.Matrix3().setFromMatrix4(_mb));
                this.pelvis0 = b.pelvis.position.clone();
            }
            // Character height in frame units drives stride length.
            const top = b.head ? framePos(b.head, this.frame, new THREE.Vector3()).y : 1.6;
            this.h = Math.max(0.6, top * 1.08);
            this.D = new Map();
            for (const bone of tracked) this.D.set(bone, new THREE.Quaternion());
            this.Fanim = new Map();
            this.t = Math.random() * 10;
            this.gait = Math.random() * Math.PI * 2;
            this.s = { a: 0, run: 0, flinch: 0, attack: 0, stun: 0, dance: 0, dead: 0, cast: 0 };
            this.attackSide = 1;
            this.lastSwing = 0;
            this.headScale = 1;
            this.ok = !!(b.pelvis && b.uaL && b.uaR && b.thL && b.thR);
            this.apply();
            loadLocomotion().then((source) => {
                if (!source || this.rig.disposed) return;
                this.presets = source.animations.map((clip) => this._bindClip(source, clip));
            });
            this.clips = null;
            this.hitT = -1;
            this.hitClip = null;
            this.deadT = 0;
            this.deathByClip = null;
            this.lastFlinch = 0;
            loadPresets().then((source) => {
                if (!source || this.rig.disposed) return;
                const clips = {};
                for (const clip of source.animations) clips[clip.name] = this._bindClip(source, clip);
                this.clips = clips;
            });
        }

        /** Binds a UAL clip to this skeleton: rotation deltas from the UAL rest, pelvis offset scaled to this body. */
        _bindClip(source, clip) {
            const tracks = [];
            let pos = null;
            for (const track of clip.tracks) {
                const parsed = THREE.PropertyBinding.parseTrackName(track.name);
                const name = parsed.nodeName;
                const bone = this.order.find((joint) => joint.name === name);
                const restNode = bone && source.getObjectByName(name);
                if (!restNode) continue;
                if (parsed.propertyName === 'quaternion') {
                    const basis = this.L0.get(bone).clone().multiply(restNode.quaternion.clone().invert());
                    tracks.push({ bone, basis, sampler: track.createInterpolant() });
                } else if (parsed.propertyName === 'position' && bone === this.b.pelvis && this.pelvis0) {
                    const restLen = restNode.position.length() || 1;
                    pos = { sampler: track.createInterpolant(), rest: restNode.position.clone(), ratio: this.pelvis0.length() / restLen };
                }
            }
            return { name: clip.name, duration: clip.duration, tracks, pos };
        }

        /** Blends one bound clip at time `t` into the current pose by `amount` (0..1). */
        _sampleClip(clip, t, amount, withPelvis) {
            if (!clip || amount <= 0.001) return;
            const time = clamp(t, 0, clip.duration - 1e-4);
            for (let i = 0; i < clip.tracks.length; i++) {
                const { bone, basis, sampler } = clip.tracks[i];
                _qa.fromArray(sampler.evaluate(time)).premultiply(basis);
                bone.quaternion.slerp(_qa, amount);
            }
            if (withPelvis && clip.pos) {
                const v = clip.pos.sampler.evaluate(time);
                _vb.set(v[0], v[1], v[2]).sub(clip.pos.rest).multiplyScalar(clip.pos.ratio).add(this.pelvis0);
                this.b.pelvis.position.lerp(_vb, amount);
            }
        }

        /** True once the death fall is driven by the authored clip (entities then only sink the body). */
        get handlesDeath() {
            return this.deathByClip != null ? this.deathByClip : !!(this.clips && this.clips.Death01);
        }

        _sampleLocomotion(weight, stride) {
            if (!this.presets || weight <= 0.001) return;
            for (const clip of this.presets) {
                const walk = clip.name === 'Zombie_Walk_Fwd_Loop';
                const amount = weight * (walk ? stride : 1 - stride);
                if (amount <= 0.001) continue;
                const phase = walk ? this.gait / (Math.PI * 2) * clip.duration : this.t;
                for (const { bone, basis, sampler } of clip.tracks) {
                    _qa.fromArray(sampler.evaluate(phase % clip.duration)).premultiply(basis);
                    bone.quaternion.slerp(_qa, amount);
                }
            }
        }

        _parentRest(bone) {
            const p = bone.parent;
            if (this.isTracked.has(p)) return this.Frest.get(p);
            return this.Fstatic.get(p) || _qa.identity();
        }

        // Turns the bind T/A-pose into a relaxed stance: arms down at the sides, elbows soft.
        _buildRest() {
            const b = this.b;
            const fiend = this.style === 'fiend';
            for (const side of ['L', 'R']) {
                const ua = b['ua' + side], la = b['la' + side], hand = b['hand' + side];
                if (!ua || !la) continue;
                const sUa = framePos(ua, this.frame, new THREE.Vector3());
                const sLa = framePos(la, this.frame, new THREE.Vector3());
                const sHand = hand ? framePos(hand, this.frame, new THREE.Vector3()) : sLa.clone().add(sLa.clone().sub(sUa));
                const sign = Math.sign(sUa.x) || (side === 'L' ? 1 : -1);
                const dUa = sLa.clone().sub(sUa).normalize();
                const dLa = sHand.clone().sub(sLa).normalize();
                const tUa = new THREE.Vector3(sign * (fiend ? 0.3 : 0.42), -1, fiend ? 0.22 : 0.06).normalize();
                const tLa = new THREE.Vector3(sign * (fiend ? 0.12 : 0.2), -0.75, fiend ? 0.75 : 0.42).normalize();
                const R1 = new THREE.Quaternion().setFromUnitVectors(dUa, tUa);
                this.Frest.set(ua, R1.clone().multiply(this.F0.get(ua)));
                // Forearm moved rigidly with the upper arm; now bend it toward its own target.
                const cur = dLa.clone().applyQuaternion(R1);
                const R2 = new THREE.Quaternion().setFromUnitVectors(cur, tLa);
                const FlaRigid = this.Frest.get(ua).clone().multiply(this.L0.get(la));
                this.Frest.set(la, R2.clone().multiply(FlaRigid));
                if (hand) this.Frest.set(hand, this.Frest.get(la).clone().multiply(this.L0.get(hand)));
            }
            // Legs: pull wide A-pose legs in under the hips.
            for (const side of ['L', 'R']) {
                const th = b['th' + side], ca = b['ca' + side];
                if (!th || !ca) continue;
                const p0 = framePos(th, this.frame, new THREE.Vector3());
                const p1 = framePos(ca, this.frame, new THREE.Vector3());
                const d = p1.clone().sub(p0).normalize();
                const sign = Math.sign(p0.x) || (side === 'L' ? 1 : -1);
                const t = new THREE.Vector3(sign * 0.07, -1, 0.02).normalize();
                if (d.angleTo(t) > 0.06) {
                    const R = new THREE.Quaternion().setFromUnitVectors(d, t);
                    this.Frest.set(th, R.clone().multiply(this.F0.get(th)));
                    for (const k of ['ca', 'ft']) {
                        const bone = b[k + side];
                        if (!bone) continue;
                        const par = bone.parent;
                        this.Frest.set(bone, this.Frest.get(par).clone().multiply(this.L0.get(bone)));
                    }
                }
            }
        }

        apply() {
            for (const bone of this.order) {
                const p = bone.parent;
                const Fp = this.isTracked.has(p) ? this.Fanim.get(p) : (this.Fstatic.get(p) || _qa.identity());
                let Fb = this.Fanim.get(bone);
                if (!Fb) { Fb = new THREE.Quaternion(); this.Fanim.set(bone, Fb); }
                Fb.copy(this.D.get(bone)).multiply(Fp).multiply(this.Lrest.get(bone));
                bone.quaternion.copy(_qb.copy(Fp).invert().multiply(Fb));
            }
            if (this.b.head && this.headScale !== 1) this.b.head.scale.setScalar(this.headScale);
        }

        _set(key, x, y, z) {
            const bone = this.b[key];
            if (bone) deltaQ(this.D.get(bone), x, y, z);
        }

        update(dt, st) {
            if (st.frozen) return;
            const s = this.s;
            this.t += dt;
            const speed = st.speed || 0;
            const hS = this.h / 1.75;
            const brute = this.style === 'brute';
            s.a = smooth(s.a, clamp(speed / (1.7 * hS), 0, 1), 8, dt);
            s.run = smooth(s.run, clamp((speed / hS - 3.0) / 2.4, 0, 1), 6, dt);
            const cycle = (1.45 + 0.85 * s.run) * hS * (brute ? 1.12 : 1);
            this.gait += (Math.PI * 2 * speed / cycle) * dt;
            const ph = this.gait;

            // Attacks: rising edge of the entity's swing timer starts a new strike.
            const swing = st.attackSwing || 0;
            if (swing > this.lastSwing + 0.25) {
                this.attackSide = -this.attackSide;
                this.attackRanged = !!st.ranged;
                this.attackTwoHand = brute && Math.random() < 0.55;
                this.attackClip = this.attackRanged ? (brute ? 'OverhandThrow' : 'Spell_Simple_Shoot')
                    : brute ? (this.attackTwoHand ? 'Sword_Attack' : 'Punch_Cross')
                        : (this.attackSide > 0 ? 'Zombie_Scratch' : 'Punch_Jab');
            }
            this.lastSwing = swing;
            const p = swing > 0 ? 1 - swing : 1;
            s.flinch = Math.max(st.flinch || 0, s.flinch - dt * 5);
            s.stun = smooth(s.stun, st.stunned ? 1 : 0, 6, dt);
            s.dance = smooth(s.dance, st.dance ? 1 : 0, 5, dt);
            s.dead = st.dead ? Math.min(1, s.dead + dt * 2.2) : 0;

            const a = s.a * (1 - s.dead), run = s.run * (1 - s.dead);
            const sinP = Math.sin(ph), cosP = Math.cos(ph);
            const lean = (this.style === 'fiend' ? 0.2 : 0.1) + 0.08 * a + 0.2 * run;

            // ---- legs
            const A = (0.42 + 0.3 * run) * a;
            const legs = (side, phase) => {
                const sp = Math.sin(phase), cp = Math.cos(phase);
                const fwd = sp * A;
                const knee = a * (0.12 + (0.7 + 0.55 * run) * Math.max(0, cp)) + s.dead * 0.75 + s.dance * (0.22 + 0.22 * Math.abs(Math.sin(this.t * 7)));
                this._set('th' + side, -fwd - s.dead * 0.35 - s.dance * 0.1, 0, 0);
                this._set('ca' + side, knee, 0, 0);
                this._set('ft' + side, fwd - knee * 0.75, 0, 0);
            };
            legs('L', ph);
            legs('R', ph + Math.PI);

            // ---- pelvis / spine
            const breathe = Math.sin(this.t * 1.7) * 0.03;
            const flinchBack = s.flinch * (st.hitZone === 'head' ? 0.22 : st.hitZone === 'limb' ? 0.12 : 0.34);
            const twistLimb = st.hitZone === 'limb' ? s.flinch * 0.28 : 0;
            const stunRoll = s.stun * Math.sin(this.t * 7.5) * 0.14;
            const danceRoll = s.dance * Math.sin(this.t * 6) * 0.2;

            // Attack curve: windup (0..0.32) → strike (0.32..0.62) → recover.
            let raise = 0, strike = 0;
            if (swing > 0) {
                if (p < 0.32) raise = ease(p / 0.32);
                else if (p < 0.62) { const k = (p - 0.32) / 0.3; raise = 1 - ease(k) * 1.25; strike = Math.sin(k * Math.PI); }
                else raise = -0.25 * (1 - (p - 0.62) / 0.38);
            }
            const ranged = swing > 0 && this.attackRanged;
            const melee = swing > 0 && !ranged;
            const side = this.attackSide;

            this._set('pelvis', 0, Math.sin(ph) * 0.09 * a + (melee ? side * 0.18 * strike : 0), Math.sin(ph) * 0.05 * a + danceRoll);
            this._set('spine1', lean * 0.45 - flinchBack * 0.5 + (melee ? 0.12 * strike : 0), -Math.sin(ph) * 0.06 * a + twistLimb, stunRoll * 0.5);
            this._set('spine2', lean * 0.35 + breathe - flinchBack * 0.5 + (melee ? 0.1 * strike - 0.08 * raise : 0) + (ranged ? 0.12 * strike : 0),
                (melee ? -side * 0.35 * raise + side * 0.5 * strike : 0), stunRoll * 0.5);
            this._set('spine3', lean * 0.2 + breathe * 0.6, 0, 0);
            const headPitch = -lean * 0.6 - s.flinch * (st.hitZone === 'head' ? 0.6 : 0.3) + s.stun * 0.35 + s.dead * 0.45 + (ranged ? -0.35 * raise + 0.5 * strike : 0);
            this._set('neck', headPitch * 0.4, Math.sin(this.t * 0.45) * 0.18 * (1 - a), 0);
            this._set('head', headPitch * 0.6, Math.sin(this.t * 0.3 + 1) * 0.22 * (1 - a) * (1 - s.dead), s.stun * Math.sin(this.t * 5) * 0.2 + s.dead * 0.35);

            // ---- arms
            const armSwing = (0.42 + 0.35 * run) * a;
            const elbowRun = 0.15 + 1.0 * run;
            for (const sd of ['L', 'R']) {
                const sgn = sd === 'L' ? 1 : -1;     // +X is the character's left
                const legPhase = sd === 'L' ? ph : ph + Math.PI;
                let x = Math.sin(legPhase) * armSwing;  // arm swings opposite its leg
                let y = 0, z = 0, elbow = -elbowRun * a;
                x += s.flinch * 0.35;
                // Strike arm(s).
                const strikeArm = melee && (this.attackTwoHand || (sd === 'L' ? side > 0 : side < 0));
                if (strikeArm) {
                    x += -2.5 * Math.max(0, raise) + 0.45 * Math.max(0, -raise);
                    z += sgn * (this.attackTwoHand ? 0.1 : -0.35) * strike;
                    elbow += -0.9 * Math.max(0, raise) + 0.4 * strike;
                } else if (melee) {
                    x += 0.25 * strike;
                }
                if (ranged) { x += -1.35 * Math.max(0, raise + strike * 0.6); elbow += -0.2; }
                // Stun: arms dangle and sway.
                x += s.stun * Math.sin(this.t * 3 + sgn) * 0.25;
                // Dance: arms up, waving.
                x += s.dance * (-2.6 + Math.sin(this.t * 8 + sgn) * 0.45);
                z += s.dance * sgn * 0.35;
                // Death: limp, flung outward.
                x += s.dead * -0.35;
                z += s.dead * sgn * 0.9;
                elbow += s.dead * 0.3;
                this._set('ua' + sd, x, y, z);
                this._set('la' + sd, elbow, 0, 0);
            }
            // Pelvis bob in metres.
            if (this.bobAxis && this.pelvis0) {
                const bob = (Math.abs(cosP) - 0.5) * (0.045 + 0.03 * run) * a * hS - 0.04 * hS * (s.dance * Math.abs(Math.sin(this.t * 7)));
                this.b.pelvis.position.copy(this.pelvis0).addScaledVector(this.bobAxis, bob);
            }
            this.apply();
            const combat = Math.max(s.flinch, s.stun, s.dance, s.dead, swing > 0 || st.firing ? 1 : 0);
            this._sampleLocomotion(0.78 * (1 - clamp(combat, 0, 1)) * (1 - s.run), s.a);
            this._samplePresets(dt, st, swing, p, combat);
        }

        /** Authored combat/locomotion layers from the UAL preset library, over the procedural base. */
        _samplePresets(dt, st, swing, p, combat) {
            const C = this.clips;
            if (!C) return;
            const s = this.s;
            // Death: latch which system owns the fall so it never switches halfway.
            if (st.dead) {
                if (this.deathByClip == null) this.deathByClip = !!C.Death01;
                this.deadT += dt;
                if (this.deathByClip) {
                    this._sampleClip(C.Death01, this.deadT * DEATH_RATE, clamp(this.deadT * 7, 0, 1), true);
                    return;
                }
            } else {
                this.deadT = 0;
                this.deathByClip = null;
            }
            // Run cycle: jog blending into sprint, phase-locked to the stride so feet stay planted.
            const runW = 0.85 * s.run * (1 - clamp(combat, 0, 1)) * (1 - s.dead);
            if (runW > 0.001) {
                const sprint = clamp((s.run - 0.55) / 0.45, 0, 1);
                const cyc = this.gait / (Math.PI * 2);
                if (C.Jog_Fwd_Loop) this._sampleClip(C.Jog_Fwd_Loop, (cyc % 1) * C.Jog_Fwd_Loop.duration, runW * (1 - sprint), false);
                if (C.Sprint_Loop) this._sampleClip(C.Sprint_Loop, (cyc % 1) * C.Sprint_Loop.duration, runW * sprint, false);
            }
            // Dance (Ray-gun "Dance" effects, emotes).
            if (s.dance > 0.01 && C.Dance_Loop) this._sampleClip(C.Dance_Loop, this.t % C.Dance_Loop.duration, s.dance * 0.9, true);
            // Attacks: the clip's strike frame lands on the gameplay hit beat.
            if (swing > 0 && this.attackClip && C[this.attackClip]) {
                const clip = C[this.attackClip], tm = ATTACK_CLIPS[this.attackClip];
                const t = tm.strike + (p - STRIKE_P) * tm.span;
                const w = ease(clamp(p / 0.12, 0, 1)) * (1 - ease(clamp((p - 0.8) / 0.2, 0, 1)));
                this._sampleClip(clip, t, 0.88 * w * (1 - s.stun), false);
            }
            // Hit reactions: a fresh flinch restarts the zone's clip.
            const fl = st.flinch || 0;
            if (fl > this.lastFlinch + 0.3) {
                this.hitClip = st.hitZone === 'head' ? C.Hit_Head : C.Hit_Chest;
                this.hitT = 0;
            }
            this.lastFlinch = fl;
            if (this.hitClip && this.hitT >= 0) {
                this.hitT += dt;
                const k = this.hitT / this.hitClip.duration;
                if (k >= 1) this.hitT = -1;
                else this._sampleClip(this.hitClip, this.hitT, 0.8 * Math.sqrt(1 - k), false);
            }
        }

        setHeadScale(sc) { this.headScale = sc; if (this.b.head) this.b.head.scale.setScalar(sc); }
        handBone(side) { return this.b[side === 'L' ? 'handL' : 'handR'] || this.b[side === 'L' ? 'laL' : 'laR']; }
        headBone() { return this.b.head; }
    }

    /* ======================================================================
       ClipDriver — models that ship named clips (Kenney character kits)
    ====================================================================== */
    const UPPER_NODES = ['torso', 'arm-left', 'arm-right', 'head'];
    const clipFind = (clips, ...names) => {
        for (const n of names) {
            const c = clips.find((cl) => cl.name === n) || clips.find((cl) => cl.name.toLowerCase().includes(n));
            if (c) return c;
        }
        return null;
    };
    function filterClip(clip, keep, suffix) {
        const tracks = clip.tracks.filter((t) => keep(t.name.split('.')[0]));
        return new THREE.AnimationClip(clip.name + suffix, clip.duration, tracks);
    }

    class ClipDriver {
        static detect(clips) {
            return !!(clips && clips.length && clipFind(clips, 'walk', 'run') && clipFind(clips, 'idle'));
        }

        constructor(rig, model, clips, opts) {
            this.rig = rig;
            this.mixer = new THREE.AnimationMixer(model);
            this.clips = clips;
            this.h = opts.height || 1.8;
            const upperNames = new Set();
            model.traverse((o) => { if (UPPER_NODES.includes(o.name)) upperNames.add(THREE.PropertyBinding.sanitizeNodeName(o.name)); });
            const isUpper = (n) => upperNames.has(n);
            const hasSplit = upperNames.size > 0;
            this.split = hasSplit;
            const mk = (clip, part, fullIfUnsplit) => {
                if (!clip) return null;
                if (!hasSplit && part === 'upper' && !fullIfUnsplit) return null;
                const c = part === 'full' || !hasSplit ? clip.clone() : filterClip(clip, part === 'upper' ? isUpper : (n) => !isUpper(n), '#' + part);
                const act = this.mixer.clipAction(c);
                act.enabled = true;
                act.setEffectiveWeight(0);
                act.play();
                return act;
            };
            const base = {
                idle: clipFind(clips, 'idle'),
                walk: clipFind(clips, 'walk', 'run'),
                sprint: clipFind(clips, 'sprint', 'run') || clipFind(clips, 'walk'),
                dance: clipFind(clips, 'emote-yes', 'dance', 'emote') || clipFind(clips, 'idle')
            };
            this.loco = {};
            for (const k in base) this.loco[k] = { lower: mk(base[k], 'lower'), upper: mk(base[k], 'upper'), w: k === 'idle' ? 1 : 0 };
            this.loco.idle.lower.setEffectiveWeight(1);
            if (this.loco.idle.upper) this.loco.idle.upper.setEffectiveWeight(1);
            // Upper-body overlays.
            const armed = opts.armed;
            this.ov = {
                meleeR: mk(clipFind(clips, 'attack-melee-right', 'attack', 'punch'), 'upper', true),
                meleeL: mk(clipFind(clips, 'attack-melee-left', 'attack-melee-right', 'attack', 'punch'), 'upper', true),
                cast: mk(clipFind(clips, 'interact-right'), 'upper', true),
                hold: armed ? mk(clipFind(clips, armed === 'both' ? 'holding-both' : 'holding-right'), 'upper', true) : null,
                shoot: armed ? mk(clipFind(clips, armed === 'both' ? 'holding-both-shoot' : 'holding-right-shoot'), 'upper', true) : null
            };
            for (const k of ['meleeR', 'meleeL', 'cast']) {
                const a = this.ov[k];
                if (a) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.stop(); }
            }
            this.ovW = {};
            for (const k in this.ov) this.ovW[k] = 0;
            const dieClip = clipFind(clips, 'die', 'death');
            this.die = dieClip ? this.mixer.clipAction(dieClip) : null;
            if (this.die) { this.die.setLoop(THREE.LoopOnce, 1); this.die.clampWhenFinished = true; this.die.timeScale = 0.55; }
            this.handlesDeath = !!this.die;
            this.lastSwing = 0;
            this.attackSide = 1;
            this.active = null;
            this.dead = false;
            this.flinch = 0;
            this.t = 0;
        }

        _trigger(name) {
            const a = this.ov[name];
            if (!a) return;
            a.reset();
            a.play();
            this.active = name;
        }

        update(dt, st) {
            const rig = this.rig;
            this.t += dt;
            if (st.frozen) return;
            if (st.dead) {
                if (!this.dead && this.die) {
                    this.dead = true;
                    for (const k in this.loco) { this.loco[k].lower.fadeOut(0.12); if (this.loco[k].upper) this.loco[k].upper.fadeOut(0.12); }
                    for (const k in this.ov) if (this.ov[k]) this.ov[k].fadeOut(0.1);
                    this.die.reset().setEffectiveWeight(1).fadeIn(0.08).play();
                }
                this.mixer.update(dt);
                return;
            }
            const speed = st.speed || 0;
            const hS = this.h / 1.8;
            let want = 'idle', ts = 1;
            if (st.dance) want = 'dance';
            else if (speed > 3.3 * hS) { want = 'sprint'; ts = clamp(speed / (4.8 * hS), 0.75, 1.7); }
            else if (speed > 0.25) { want = 'walk'; ts = clamp(speed / (1.6 * hS), 0.55, 2.0); }
            for (const k in this.loco) {
                const L = this.loco[k];
                L.w = smooth(L.w, k === want ? 1 : 0, 9, dt);
                L.lower.setEffectiveWeight(L.w);
                L.lower.timeScale = k === want ? ts : L.lower.timeScale;
            }
            // Upper body: attack edge → one-shot overlay.
            const swing = st.attackSwing || 0;
            if (swing > this.lastSwing + 0.25) {
                if (st.ranged) this._trigger(this.ov.cast ? 'cast' : 'meleeR');
                else { this.attackSide = -this.attackSide; this._trigger(this.attackSide > 0 ? 'meleeR' : 'meleeL'); }
            }
            this.lastSwing = swing;
            let ovTotal = 0;
            for (const k in this.ov) {
                const a = this.ov[k];
                if (!a) continue;
                let target = 0;
                if (k === this.active) {
                    const done = !a.isRunning() || a.time >= a.getClip().duration - 0.001;
                    if (done) this.active = null; else target = 1;
                }
                if (k === 'hold') target = this.active ? 0 : (st.aim != null ? st.aim : 1) * (st.firing ? 0 : 1);
                if (k === 'shoot') target = this.active ? 0 : (st.firing ? 1 : 0);
                this.ovW[k] = smooth(this.ovW[k], target, k === this.active ? 30 : 12, dt);
                a.setEffectiveWeight(this.ovW[k]);
                ovTotal += this.ovW[k];
            }
            const locoUpper = clamp(1 - ovTotal, 0, 1);
            for (const k in this.loco) {
                const L = this.loco[k];
                if (!L.upper) continue;
                L.upper.setEffectiveWeight(L.w * locoUpper);
                L.upper.timeScale = L.lower.timeScale;
                L.upper.time = L.lower.time;
            }
            this.mixer.timeScale = st.stunned ? 0.35 : 1;
            this.mixer.update(dt);
            // Hit reaction and stun wobble on the whole model.
            this.flinch = Math.max(st.flinch || 0, this.flinch - dt * 5);
            const zoneK = st.hitZone === 'head' ? 1.3 : st.hitZone === 'limb' ? 0.6 : 1;
            rig.model.rotation.x = -0.2 * this.flinch * zoneK;
            rig.model.rotation.z = st.stunned ? Math.sin(this.t * 7) * 0.1 : (st.hitZone === 'limb' ? 0.08 * this.flinch : 0);
        }

        handBone(side) {
            let n = null;
            this.rig.model.traverse((o) => { if (!n && o.name === (side === 'L' ? 'arm-left' : 'arm-right')) n = o; });
            return n;
        }
        headBone() {
            let n = null;
            this.rig.model.traverse((o) => { if (!n && o.name === 'head') n = o; });
            return n;
        }
        setHeadScale(sc) { const h = this.headBone(); if (h) h.scale.setScalar(sc); }
    }

    /* ======================================================================
       BobDriver — rigid models without a skeleton or clips
    ====================================================================== */
    class BobDriver {
        constructor(rig) { this.rig = rig; this.t = Math.random() * 6; this.flinch = 0; }
        update(dt, st) {
            if (st.frozen) return;
            this.t += dt * (1 + (st.speed || 0) * 1.6);
            const m = this.rig.model;
            const a = clamp((st.speed || 0) / 3, 0, 1);
            this.flinch = Math.max(st.flinch || 0, this.flinch - dt * 5);
            m.position.y = this.rig.modelY + Math.abs(Math.sin(this.t * 2)) * 0.06 * a + Math.sin(this.t * 0.9) * 0.01;
            m.rotation.z = Math.sin(this.t * 2) * 0.05 * a;
            m.rotation.x = 0.06 * a - 0.2 * this.flinch + ((st.attackSwing || 0) > 0 ? Math.sin((st.attackSwing || 0) * Math.PI) * 0.25 : 0);
        }
        handBone() { return null; }
        headBone() { return null; }
        setHeadScale() {}
    }

    /* ======================================================================
       Rig — owns the driver, the hit volumes and any held weapon
    ====================================================================== */
    class Rig {
        constructor(entity, parts, holder, model, opts = {}) {
            this.entity = entity;
            this.parts = parts;
            this.holder = holder;
            this.model = model;
            this.modelY = model.position.y;
            this.opts = opts;
            this.lastT = performance.now();
            holder.updateMatrixWorld(true);
            const clips = opts.clips || model.animations || [];
            if (ClipDriver.detect(clips)) this.driver = new ClipDriver(this, model, clips, opts);
            else if (HumanoidDriver.detect(model)) this.driver = new HumanoidDriver(this, model, opts);
            else this.driver = new BobDriver(this);
            this.kind = this.driver.constructor.name;
            this.weapon = null;
            if (entity && BO.Hitboxes) BO.Hitboxes.fromModel(entity, model, opts.hitbox || {});
            if (parts) parts.glbRig = this;
            this._q = new THREE.Quaternion();
        }

        /** Whether the driver plays the death itself (clip-driven); read live because presets stream in. */
        get handlesDeath() { return !!this.driver.handlesDeath; }

        /** Per-frame drive. `dt` may be omitted; wall-clock delta is used then. */
        update(dt, st = {}) {
            const nowT = performance.now();
            if (dt == null) dt = (nowT - this.lastT) / 1000;
            this.lastT = nowT;
            dt = clamp(dt, 0, 0.1);
            const e = this.entity;
            if (e) {
                if (st.dead == null) st.dead = !e.alive;
                if (st.frozen == null) st.frozen = (e.frozenTimer || 0) > 0;
                if (st.stunned == null) st.stunned = (e.stunTimer || 0) > 0 || (e.stunnedTimer || 0) > 0;
                if (st.dance == null) st.dance = (e.danceTimer || 0) > 0;
                if (st.ranged == null) st.ranged = ['acid_spit', 'fire_bolt', 'frost_shard', 'life_drain', 'aether_bolt'].includes(e.attackType) || this.opts.ranged;
                if (st.hitZone == null) st.hitZone = e.lastHitZone || (e.animPose && e.animPose.hitZone) || 'torso';
            }
            this.driver.update(dt, st);
            if (this.weapon) this._poseWeapon(st);
        }

        /** Mounts a weapon in the right hand; it tracks the hand and stays aimed along the facing. */
        attachWeapon(weaponId) {
            if (!BO.WeaponMesh || !weaponId || this.weapon) return null;
            const hand = this.driver.handBone('R');
            if (!hand) return null;
            try {
                const w = BO.WeaponMesh.buildWeapon(weaponId, {}, 'default', false, false);
                w.root.traverse((o) => { o.userData.noHit = true; o.userData.isWeapon = true; if (o.isMesh) { o.castShadow = true; } });
                w.root.userData.isWeapon = true;
                this.holder.add(w.root);
                // Hand point: tip of the arm node for rigid kits, the hand bone origin for skeletons.
                const local = new THREE.Vector3();
                if (this.kind === 'ClipDriver') {
                    const box = new THREE.Box3();
                    hand.traverse((o) => { if (o.isMesh && o.geometry) { o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox); } });
                    const proxy = hand.children.find((c) => c.userData.hitProxy);
                    if (box.isEmpty() && proxy) { proxy.geometry.computeBoundingBox(); box.copy(proxy.geometry.boundingBox).translate(proxy.position); }
                    if (!box.isEmpty()) local.set((box.min.x + box.max.x) / 2, box.min.y * 0.92, (box.min.z + box.max.z) / 2);
                }
                this.weapon = { root: w.root, hand, local };
                return w.root;
            } catch (err) {
                BO.log?.('EnemyRig', 'debug', 'weapon attach failed', err);
                return null;
            }
        }

        _poseWeapon(st) {
            const W = this.weapon;
            W.hand.updateWorldMatrix(true, false);
            _va.copy(W.local).applyMatrix4(W.hand.matrixWorld);
            this.holder.worldToLocal(_va);
            W.root.position.copy(_va);
            // Barrel along the character's facing (+Z), pitched down a touch at rest.
            const pitch = st.dead ? 1.2 : (st.firing ? 0 : 0.18);
            W.root.quaternion.setFromAxisAngle(Y, Math.PI).premultiply(_qa.setFromAxisAngle(X, pitch));
            W.root.visible = !st.dead || this.kind !== 'ClipDriver';
        }

        decapitate() { this.driver.setHeadScale(0.001); }
        setHeadScale(s) { this.driver.setHeadScale(s); }

        dispose() {
            if (this.disposed) return;
            this.disposed = true;
            this.model.traverse((o) => { if (o.isSkinnedMesh) o.skeleton.dispose(); });
            if (this.driver.mixer) this.driver.mixer.stopAllAction();
            if (this.entity && BO.Hitboxes) BO.Hitboxes.dispose(this.entity);
            if (this.parts && this.parts.glbRig === this) this.parts.glbRig = null;
        }
    }

    /* ======================================================================
       Zombie overlays: sculpted GLB monsters replacing select archetypes
    ====================================================================== */
    function overlayFor(spec) {
        const bs = spec.bodySpec || {};
        if (bs.missingLegs || bs.floating || bs.quadruped || spec.isSuperBoss) return null;
        const sid = String(spec.id || '').toLowerCase();
        const sname = String(spec.name || '').toLowerCase();
        // Silhouettes the monster models cannot represent keep their sculpted procedural bodies.
        if (/ankle_biter|crawler|stilts|spider|twin|kangaroo|hopper|siren|witch|shaman|nova/.test(sid)) return null;
        if (/imp|flame|pyro|demon|hunch_spitter|acid|spitter|sprinter|shadow_stalker/.test(sid) || /\bimp\b|fiend|spitter/.test(sname)) {
            return { path: 'monsters/Imp.glb', height: 1.65, style: 'fiend' };
        }
        if (/club_goliath|bloater|brute|berserker|mauler|golem|ogre/.test(sid) || /brute|matriarch|goliath|ogre/.test(sname)) {
            return { path: 'monsters/Puglin.glb', height: 1.92, style: 'brute' };
        }
        return null;
    }

    function fitModel(sc, height) {
        const wrap = new THREE.Group();
        wrap.add(sc);
        wrap.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(sc);
        if (!box.isEmpty()) {
            const sz = box.getSize(new THREE.Vector3());
            sc.scale.multiplyScalar(height / Math.max(sz.y, 1e-4));
            sc.updateMatrixWorld(true);
            box.setFromObject(sc);
            const c = box.getCenter(new THREE.Vector3());
            sc.position.x -= c.x;
            sc.position.z -= c.z;
            sc.position.y -= box.min.y;
        }
        return wrap;
    }

    /** Hides a procedural body that a GLB now stands in for. Keeps auras, shadows, bars and weapons. */
    function hideProcedural(parts, keep) {
        const root = parts.root;
        root.userData.glbBody = true;
        for (const c of root.children) {
            if (c === keep || c.name === 'bo-contact-shadow' || c.isSprite || c.userData.keepVisible || c.userData.isWeapon || c.name === 'MeshProxy') continue;
            c.visible = false;
        }
    }

    const EnemyRig = {
        Rig, ClipDriver, HumanoidDriver, BobDriver,
        overlayFor,

        mount(entity, parts, holder, model, opts) {
            return new Rig(entity, parts, holder, model, opts);
        },

        mountZombieOverlay(parts, spec, entity) {
            const ov = overlayFor(spec);
            if (!ov || !BO.Assets || typeof BO.Assets.loadGLB !== 'function') return;
            parts.glbPending = ov.path;
            BO.Assets.loadGLB(ov.path).then((sc) => {
                if (parts.glbPending !== ov.path) return;
                parts.glbPending = null;
                if (entity && entity.alive === false) return; // died before the model arrived
                const holder = fitModel(sc, ov.height);
                holder.name = 'glb-holder';
                sc.traverse((o) => {
                    if (!o.isMesh) return;
                    o.castShadow = true;
                    o.receiveShadow = true;
                    if (o.isSkinnedMesh) {
                        // Bind-pose bounds are wrong once posed: keep it drawn and give the raycast sphere slack.
                        o.frustumCulled = false;
                    }
                });
                if (BO.CharacterShading && BO.CharacterShading.applySkinToModel) BO.CharacterShading.applySkinToModel(sc);
                parts.root.add(holder);
                hideProcedural(parts, holder);
                const rig = new Rig(entity, parts, holder, sc, { style: ov.style, height: ov.height });
                if (entity && entity.hasGun) rig.attachWeapon(entity.isBoss ? 'm249' : 'ak47');
                if (parts.headGroup && parts.headGroup.scale.x > 1.5) rig.setHeadScale(parts.headGroup.scale.x * 0.6);
                if (entity && entity.decapitated) rig.decapitate();
                rig.update(0, { speed: 0 });
            }).catch((err) => { parts.glbPending = null; BO.log?.('EnemyRig', 'debug', 'overlay load failed', err); });
        }
    };

    BO.EnemyRig = EnemyRig;
})(window);
