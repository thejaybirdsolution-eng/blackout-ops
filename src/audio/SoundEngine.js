/* ============================================================================
   BLACKOUT OPS — Procedural Web Audio API DSP Synthesizer
   Zero external audio files required. Full COD-style weapon punch, hitmarkers,
   headshot crunches, reloads, footsteps, zombies audio, Mystery Box jingle,
   Perk fanfare, Pack-a-Punch chime, Killstreak radio & Tactical Nuke siren.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.masterGain = null;
            this.sfxGain = null;
            this.musicGain = null;
            this.noiseBuffer = null;
            this.unlocked = false;
            this.musicTimer = null;
            this.musicMode = null;

            BO.Events.on('settings:changed', () => this.applyVolumes());
        }

        ensureContext() {
            if (!this.ctx) {
                const AudioCtx = global.AudioContext || global.webkitAudioContext;
                if (!AudioCtx) return null;
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.sfxGain = this.ctx.createGain();
                this.musicGain = this.ctx.createGain();
                this.sfxGain.connect(this.masterGain);
                this.musicGain.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);
                this._buildNoiseBuffer();
                this.applyVolumes();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            this.unlocked = true;
            return this.ctx;
        }

        applyVolumes() {
            if (!this.ctx) return;
            const s = BO.Settings.all;
            const t = this.ctx.currentTime;
            this.masterGain.gain.setTargetAtTime(s.masterVolume ?? 0.8, t, 0.02);
            this.sfxGain.gain.setTargetAtTime(s.sfxVolume ?? 0.85, t, 0.02);
            this.musicGain.gain.setTargetAtTime((s.musicVolume ?? 0.55) * 0.45, t, 0.03);
        }

        _buildNoiseBuffer() {
            const sr = this.ctx.sampleRate;
            const len = Math.floor(sr * 1.5);
            const buf = this.ctx.createBuffer(1, len, sr);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            this.noiseBuffer = buf;
        }

        _distanceGain(pos, listenerPos, maxDist = 45) {
            if (!pos || !listenerPos) return 1.0;
            const d = BO.Math.dist3D(pos.x, pos.y, pos.z, listenerPos.x, listenerPos.y, listenerPos.z);
            if (d >= maxDist) return 0;
            return Math.pow(1 - d / maxDist, 1.5);
        }

        _spatialMetrics(sourcePos, maxDist = 65) {
            const p = BO.Player;
            if (!sourcePos || !p?.pos) return { gain: 1, pan: 0, dir: '' };
            const dx = sourcePos.x - p.pos.x;
            const dz = sourcePos.z - p.pos.z;
            const dy = (sourcePos.y ?? p.pos.y) - p.pos.y;
            const d = Math.hypot(dx, dy, dz);
            if (d >= maxDist) return { gain: 0, pan: 0, dir: '' };
            const gain = Math.pow(1 - d / maxDist, 1.35);
            const yaw = p.yaw || 0;
            // Player right vector in Three.js yaw space
            const rx = Math.cos(yaw), rz = -Math.sin(yaw);
            const hd = Math.hypot(dx, dz) || 1;
            const pan = BO.Math.clamp((dx * rx + dz * rz) / hd, -0.95, 0.95);
            const deg = ((Math.atan2(dx, -dz) * 180 / Math.PI) + 360) % 360;
            const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const dir = dirs[Math.round(deg / 45) % 8];
            return { gain, pan, dir, dist: d };
        }

        _connectDest(node, pan = 0, dest = 'sfx') {
            const target = dest === 'music' ? this.musicGain : this.sfxGain;
            if (Math.abs(pan) > 0.02 && typeof this.ctx.createStereoPanner === 'function') {
                const panner = this.ctx.createStereoPanner();
                panner.pan.value = pan;
                node.connect(panner);
                panner.connect(target);
            } else {
                node.connect(target);
            }
        }

        playSpatialTone(freqStart, freqEnd, dur, type = 'sine', vol = 0.25, pan = 0, delay = 0) {
            const ctx = this.ensureContext();
            if (!ctx || vol <= 0.002) return;
            const t = ctx.currentTime + delay;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(Math.max(20, freqStart), t);
            if (freqEnd !== freqStart) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + Math.min(0.015, dur * 0.15));
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(g);
            this._connectDest(g, pan, 'sfx');
            osc.start(t);
            osc.stop(t + dur + 0.02);
        }

        playSpatialNoise(dur, filterFreq, filterType = 'bandpass', q = 1.2, vol = 0.3, pan = 0, delay = 0) {
            const ctx = this.ensureContext();
            if (!ctx || !this.noiseBuffer || vol <= 0.002) return;
            const t = ctx.currentTime + delay;
            const src = ctx.createBufferSource();
            src.buffer = this.noiseBuffer;
            const filt = ctx.createBiquadFilter();
            filt.type = filterType;
            filt.frequency.setValueAtTime(filterFreq, t);
            filt.Q.setValueAtTime(q, t);
            const g = ctx.createGain();
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.connect(filt);
            filt.connect(g);
            this._connectDest(g, pan, 'sfx');
            src.start(t, Math.random() * 0.4, dur + 0.02);
        }

        /** Positional infected vocal cue + optional directional subtitle. */
        playSpatialInfected(profile = 'groan_mid', sourcePos = null, label = '') {
            const m = this._spatialMetrics(sourcePos, 70);
            if (m.gain <= 0.04) return;
            const v = m.gain;
            const p = m.pan;
            switch (profile) {
                case 'brute':
                case 'roar_deep':
                case 'roar_hollow':
                    this.playSpatialTone(68, 38, 0.65, 'sawtooth', 0.25 * v, p);
                    this.playSpatialNoise(0.45, 380, 'lowpass', 1.1, 0.18 * v, p);
                    break;
                case 'wraith':
                case 'wail_void':
                case 'wail_ice':
                    this.playSpatialTone(520, 180, 0.55, 'sine', 0.18 * v, p);
                    this.playSpatialTone(780, 310, 0.45, 'triangle', 0.10 * v, p, 0.08);
                    break;
                case 'shriek_fast':
                case 'screamer':
                    this.playSpatialTone(620 + Math.random() * 140, 290, 0.34, 'sawtooth', 0.17 * v, p);
                    break;
                case 'hiss_toxic':
                case 'spitter':
                    this.playSpatialNoise(0.36, 2600, 'highpass', 1.3, 0.18 * v, p);
                    this.playSpatialTone(150, 75, 0.28, 'sine', 0.12 * v, p);
                    break;
                case 'hound_bark':
                case 'hellhound':
                    this.playSpatialTone(240 + Math.random() * 50, 95, 0.22, 'sawtooth', 0.20 * v, p);
                    this.playSpatialNoise(0.16, 900, 'bandpass', 1.4, 0.14 * v, p);
                    break;
                default: {
                    const base = 112 + Math.random() * 44;
                    this.playSpatialTone(base, base * 0.66, 0.38, 'sawtooth', 0.15 * v, p);
                    this.playSpatialNoise(0.28, 520, 'bandpass', 2.2, 0.11 * v, p);
                }
            }
            if (m.dist && m.dist < 42 && label) {
                BO.Events.emit('survival:subtitle', { tag: m.dir, text: label, kind: 'cue', dur: 2.2 });
            }
        }

        playLanternCharge() {
            this.playTone(95, 420, 2.7, 'sine', 0.22, 0);
            this.playTone(48, 120, 2.7, 'sawtooth', 0.14, 0);
            this.playNoise(2.5, 620, 'bandpass', 3.0, 0.10, 0.1);
            BO.Events.emit('survival:subtitle', { tag: 'CRATER', text: 'Lantern core charging — take cover behind a monolith!', kind: 'warn', dur: 3.1 });
        }

        playLanternPulse() {
            this.playTone(130, 32, 0.9, 'sawtooth', 0.32, 0);
            this.playTone(880, 220, 0.65, 'sine', 0.16, 0.04);
            this.playNoise(0.75, 340, 'lowpass', 0.8, 0.30, 0);
            BO.Events.emit('survival:subtitle', { tag: 'CRATER', text: 'Lantern shockwave pulse detonated.', kind: 'warn', dur: 2.4 });
        }

        playGeigerTick(intensity = 0.5) {
            const v = BO.Math.clamp(0.05 + intensity * 0.12, 0.04, 0.18);
            this.playNoise(0.016, 3800 + Math.random() * 1400, 'bandpass', 4.5, v);
        }

        playRadioChirp(kind = 'in') {
            this.playNoise(0.09, 1900, 'bandpass', 2.4, 0.09, 0);
            this.playTone(kind === 'warn' ? 880 : 1240, kind === 'warn' ? 660 : 1480, 0.08, 'sine', 0.10, 0.05);
        }

        playHeartbeat(intensity = 0.6) {
            const v = BO.Math.clamp(0.10 + intensity * 0.14, 0.08, 0.24);
            this.playTone(62, 38, 0.14, 'sine', v, 0);
            this.playTone(54, 34, 0.16, 'sine', v * 0.85, 0.20);
        }

        playWeatherGust(kind = 'wind') {
            if (kind === 'blizzard') this.playNoise(1.4, 780, 'bandpass', 1.6, 0.07);
            else if (kind === 'ash') this.playNoise(1.1, 1450, 'highpass', 1.0, 0.045);
            else this.playNoise(1.2, 520, 'lowpass', 1.2, 0.05);
        }

        _createGain(vol, dest = 'sfx') {
            const g = this.ctx.createGain();
            g.gain.value = vol;
            g.connect(dest === 'music' ? this.musicGain : this.sfxGain);
            return g;
        }

        playTone(freqStart, freqEnd, dur, type = 'sine', vol = 0.25, delay = 0, dest = 'sfx') {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const t = ctx.currentTime + delay;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(Math.max(20, freqStart), t);
            if (freqEnd !== freqStart) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
            }
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + Math.min(0.015, dur * 0.15));
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(g);
            g.connect(dest === 'music' ? this.musicGain : this.sfxGain);
            osc.start(t);
            osc.stop(t + dur + 0.02);
        }

        playNoise(dur, filterFreq, filterType = 'bandpass', q = 1.2, vol = 0.3, delay = 0) {
            const ctx = this.ensureContext();
            if (!ctx || !this.noiseBuffer) return;
            const t = ctx.currentTime + delay;
            const src = ctx.createBufferSource();
            src.buffer = this.noiseBuffer;

            const filt = ctx.createBiquadFilter();
            filt.type = filterType;
            filt.frequency.setValueAtTime(filterFreq, t);
            filt.Q.setValueAtTime(q, t);

            const g = ctx.createGain();
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

            src.connect(filt);
            filt.connect(g);
            g.connect(this.sfxGain);
            src.start(t, Math.random() * 0.4, dur + 0.02);
        }

        playUIHover() {
            this.playTone(950, 1100, 0.035, 'triangle', 0.08);
        }

        playUIClick() {
            this.playTone(620, 320, 0.055, 'triangle', 0.14);
        }

        _getSaturationCurve() {
            if (!this._satCurve) {
                const n = 512;
                const curve = new Float32Array(n);
                for (let i = 0; i < n; i++) {
                    const x = (i * 2) / n - 1;
                    curve[i] = Math.tanh(x * 2.65);
                }
                this._satCurve = curve;
            }
            return this._satCurve;
        }

        _playSaturatedBurst(dur, filterFreq, filterType = 'bandpass', q = 1.0, vol = 0.35, pan = 0, delay = 0) {
            const ctx = this.ensureContext();
            if (!ctx || !this.noiseBuffer || vol <= 0.002) return;
            const t = ctx.currentTime + delay;
            const src = ctx.createBufferSource();
            src.buffer = this.noiseBuffer;

            const filt = ctx.createBiquadFilter();
            filt.type = filterType;
            filt.frequency.setValueAtTime(filterFreq, t);
            filt.Q.setValueAtTime(q, t);

            const shaper = ctx.createWaveShaper();
            shaper.curve = this._getSaturationCurve();

            const g = ctx.createGain();
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

            src.connect(filt);
            filt.connect(shaper);
            shaper.connect(g);
            this._connectDest(g, pan, 'sfx');
            src.start(t, Math.random() * 0.45, dur + 0.02);
        }

        playGunshot(profile, suppressed = false, isPaP = false, distScale = 1.0) {
            if (distScale <= 0.02) return;
            const ctx = this.ensureContext();
            if (!ctx) return;

            const v = distScale * (suppressed ? 0.58 : 1.0);
            const detune = 0.96 + Math.random() * 0.08;

            if (profile === 'raygun') {
                this.playTone(1480 * detune, 195, 0.21, 'sawtooth', 0.30 * v);
                this.playTone(960 * detune, 130, 0.24, 'sine', 0.28 * v, 0.008);
                this.playTone(72, 34, 0.14, 'sine', 0.24 * v);
                this._playSaturatedBurst(0.09, 3200, 'bandpass', 2.2, 0.22 * v);
                if (isPaP) this.playTone(2100, 440, 0.22, 'triangle', 0.20 * v, 0.015);
                return;
            }
            if (profile === 'zeus') {
                this.playTone(118 * detune, 28, 0.62, 'sawtooth', 0.58 * v);
                this.playTone(62, 20, 0.55, 'sine', 0.52 * v);
                this._playSaturatedBurst(0.50, 340, 'lowpass', 0.75, 0.68 * v);
                this.playTone(520, 72, 0.38, 'triangle', 0.34 * v, 0.01);
                return;
            }

            // Multi-layered ballistic synthesis: Sub-bass chest thump + chamber body + saturated supersonic crack + mechanical bolt clack + stereo room tail
            let subF = 78;
            let punchF = 160;
            let bodyF = 580;
            let noiseF = 1900;
            let dur = 0.13;
            let punchVol = 0.40;
            let crackVol = 0.48;
            let mechDelay = 0.024;
            let mechF = 2400;
            let tailDur = 0.18;

            switch (profile) {
                case 'smg':
                case 'smg_heavy':
                    subF = 92; punchF = 190; bodyF = 720; noiseF = 2550; dur = 0.09; punchVol = 0.31; crackVol = 0.40; mechDelay = 0.018; mechF = 2850; tailDur = 0.13; break;
                case 'ar_light':
                    subF = 78; punchF = 158; bodyF = 610; noiseF = 2150; dur = 0.13; punchVol = 0.39; crackVol = 0.48; mechDelay = 0.024; mechF = 2600; tailDur = 0.19; break;
                case 'ar_heavy':
                case 'dmr':
                    subF = 66; punchF = 132; bodyF = 480; noiseF = 1650; dur = 0.17; punchVol = 0.48; crackVol = 0.56; mechDelay = 0.028; mechF = 2200; tailDur = 0.25; break;
                case 'lmg':
                    subF = 68; punchF = 142; bodyF = 520; noiseF = 1780; dur = 0.16; punchVol = 0.46; crackVol = 0.53; mechDelay = 0.026; mechF = 2100; tailDur = 0.23; break;
                case 'shotgun':
                    subF = 54; punchF = 102; bodyF = 360; noiseF = 1050; dur = 0.28; punchVol = 0.64; crackVol = 0.72; mechDelay = 0.045; mechF = 1850; tailDur = 0.34; break;
                case 'sniper':
                    subF = 50; punchF = 114; bodyF = 410; noiseF = 1420; dur = 0.38; punchVol = 0.68; crackVol = 0.78; mechDelay = 0.042; mechF = 2350; tailDur = 0.46; break;
                case 'pistol':
                    subF = 96; punchF = 215; bodyF = 780; noiseF = 2450; dur = 0.095; punchVol = 0.32; crackVol = 0.38; mechDelay = 0.016; mechF = 3100; tailDur = 0.14; break;
                case 'deagle':
                    subF = 58; punchF = 124; bodyF = 450; noiseF = 1520; dur = 0.23; punchVol = 0.56; crackVol = 0.60; mechDelay = 0.030; mechF = 2400; tailDur = 0.30; break;
            }

            if (suppressed) {
                // Subsonic gas-baffle thwip + crisp reciprocating bolt carrier clack
                this.playTone(subF * 1.08, 36, dur * 0.68, 'sine', punchVol * 0.78 * v);
                this.playTone(punchF * 1.15 * detune, 54, dur * 0.65, 'triangle', punchVol * 0.55 * v);
                this._playSaturatedBurst(dur * 0.65, 980 * detune, 'lowpass', 1.5, crackVol * 0.44 * v);
                this.playNoise(0.028, mechF, 'bandpass', 2.8, 0.16 * v, mechDelay);
                this.playTone(1950 * detune, 920, 0.026, 'triangle', 0.11 * v, mechDelay);
            } else {
                // 1. Sub-bass chest punch
                this.playTone(subF * detune, 28, dur * 0.92, 'sine', punchVol * 0.85 * v);
                // 2. Chamber body resonance
                this.playTone(punchF * detune, 38, dur * 0.85, 'triangle', punchVol * 0.75 * v);
                this.playTone(bodyF * detune, bodyF * 0.32, Math.min(0.055, dur * 0.45), 'sawtooth', punchVol * 0.32 * v);
                // 3. Saturated supersonic crack + high-frequency snap
                this._playSaturatedBurst(dur, noiseF * detune, 'bandpass', 0.82, crackVol * v);
                this.playNoise(dur * 0.42, 4400 * detune, 'highpass', 0.75, crackVol * 0.36 * v);
                // 4. Mechanical bolt / slide carrier snap
                this.playNoise(0.025, mechF, 'bandpass', 3.0, 0.14 * v, mechDelay);
                // 5. Subtle stereo early-reflection acoustic tail (player & nearby shots)
                if (v > 0.35) {
                    this.playSpatialNoise(tailDur, noiseF * 0.52, 'lowpass', 0.85, crackVol * 0.13 * v, -0.38, 0.038);
                    this.playSpatialNoise(tailDur * 1.12, noiseF * 0.46, 'lowpass', 0.85, crackVol * 0.12 * v, 0.38, 0.052);
                }
            }

            if (isPaP) {
                // Signature Pack-a-Punch futuristic plasma harmonic chord tail
                this.playTone(1680 * detune, 420, 0.15, 'sawtooth', 0.16 * v, 0.008);
                this.playTone(2520 * detune, 680, 0.12, 'triangle', 0.10 * v, 0.018);
            }
        }

        playHitmarker(isHeadshot = false, isKill = false) {
            // Crisp iconic COD tick
            this.playNoise(0.035, isHeadshot ? 3800 : 2800, 'bandpass', 2.5, isHeadshot ? 0.42 : 0.30);
            this.playTone(isHeadshot ? 2100 : 1450, isHeadshot ? 1500 : 980, 0.032, 'triangle', isHeadshot ? 0.28 : 0.18);
            if (isKill) {
                this.playTone(180, 75, 0.075, 'sine', 0.22, 0.015);
            }
            if (isHeadshot && isKill) {
                // Visceral helmet/skull crunch
                this.playNoise(0.09, 1400, 'bandpass', 1.2, 0.36, 0.01);
                this.playTone(460, 120, 0.08, 'sawtooth', 0.18, 0.02);
            }
        }

        playReload(stage = 'out') {
            if (stage === 'out') {
                // Mag catch button click + metallic/polymer mag slide out
                this.playTone(980, 560, 0.022, 'square', 0.12);
                this.playTone(420, 210, 0.075, 'triangle', 0.16, 0.018);
                this.playNoise(0.075, 2350, 'bandpass', 2.2, 0.18, 0.015);
            } else if (stage === 'in') {
                // Magwell insertion thump + positive steel latch click
                this.playTone(165, 92, 0.055, 'sine', 0.22);
                this.playNoise(0.045, 2900, 'bandpass', 2.0, 0.20);
                this.playTone(620, 1180, 0.038, 'triangle', 0.20, 0.042);
                this.playNoise(0.025, 4200, 'highpass', 1.6, 0.14, 0.042);
            } else if (stage === 'bolt') {
                // Heavy charging handle pull + spring-driven bolt slam forward
                this.playTone(760, 390, 0.055, 'sawtooth', 0.17);
                this.playNoise(0.045, 3100, 'bandpass', 2.6, 0.16);
                this.playTone(480, 1060, 0.048, 'triangle', 0.20, 0.078);
                this.playTone(190, 85, 0.045, 'sine', 0.18, 0.078);
                this.playNoise(0.032, 3600, 'bandpass', 2.4, 0.18, 0.078);
            } else if (stage === 'shell') {
                // Shotgun lifter gate click + brass shell slide
                this.playTone(580, 310, 0.042, 'triangle', 0.16);
                this.playTone(1120, 740, 0.024, 'sine', 0.11, 0.026);
                this.playNoise(0.035, 2900, 'highpass', 1.3, 0.14);
            }
        }

        playParkour(kind = 'mantle') {
            if (kind === 'vault') {
                this.playTone(145, 68, 0.09, 'sine', 0.22);
                this.playNoise(0.14, 1350, 'bandpass', 1.1, 0.20);
                this.playNoise(0.09, 2600, 'highpass', 1.0, 0.12, 0.06);
            } else {
                this.playTone(125, 58, 0.08, 'sine', 0.20);
                this.playNoise(0.11, 950, 'bandpass', 1.2, 0.18);
                this.playTone(165, 78, 0.07, 'triangle', 0.16, 0.14);
            }
        }

        playEmptyClick() {
            this.playTone(1200, 600, 0.025, 'square', 0.12);
        }

        playFootstep(sprinting = false) {
            const v = sprinting ? 0.14 : 0.085;
            this.playTone(95 + Math.random() * 25, 38, 0.06, 'sine', v);
            this.playNoise(0.05, 650 + Math.random() * 200, 'lowpass', 1.0, v * 0.8);
        }

        playSlide() {
            this.playNoise(0.28, 1200, 'bandpass', 0.8, 0.22);
            this.playTone(180, 75, 0.24, 'sine', 0.16);
        }

        playMelee() {
            this.playNoise(0.12, 1600, 'bandpass', 1.0, 0.30);
            this.playTone(320, 110, 0.10, 'triangle', 0.24);
        }

        playExplosion(distScale = 1.0) {
            if (distScale <= 0.02) return;
            this.playTone(88, 22, 0.78, 'sawtooth', 0.58 * distScale);
            this.playTone(62, 18, 0.90, 'sine', 0.65 * distScale);
            this.playNoise(0.85, 420, 'lowpass', 0.6, 0.78 * distScale);
            this.playNoise(0.35, 1900, 'bandpass', 0.8, 0.35 * distScale, 0.02);
        }

        playFlashbang() {
            // Iconic high-pitched tinnitus ring + concussive thump
            this.playExplosion(0.6);
            this.playTone(3850, 3650, 2.1, 'sine', 0.22, 0.04);
        }

        playGrenadeBounce() {
            this.playTone(680, 380, 0.04, 'triangle', 0.14);
        }

        playZombieGroan(profile = 'groan_mid', distScale = 1.0) {
            if (distScale <= 0.04) return;
            switch (profile) {
                case 'hound_bark':
                case 'hellhound':
                    this.playTone(230 + Math.random() * 60, 95, 0.22, 'sawtooth', 0.22 * distScale);
                    this.playNoise(0.18, 850, 'bandpass', 1.4, 0.16 * distScale);
                    return;
                case 'chitter_high':
                    this.playTone(720, 460, 0.12, 'square', 0.12 * distScale);
                    this.playTone(620, 910, 0.10, 'triangle', 0.11 * distScale, 0.08);
                    return;
                case 'shriek_fast':
                    this.playTone(540 + Math.random() * 120, 260, 0.32, 'sawtooth', 0.16 * distScale);
                    return;
                case 'gurgle_wet':
                case 'gurgle_deep':
                    this.playTone(profile === 'gurgle_deep' ? 75 : 130, 58, 0.42, 'sine', 0.20 * distScale);
                    this.playNoise(0.32, 340, 'bandpass', 3.5, 0.16 * distScale);
                    return;
                case 'metal_clang':
                    this.playTone(320, 180, 0.18, 'square', 0.15 * distScale);
                    this.playNoise(0.15, 2200, 'bandpass', 2.6, 0.18 * distScale);
                    return;
                case 'hiss_toxic':
                    this.playNoise(0.38, 2800, 'highpass', 1.2, 0.18 * distScale);
                    return;
                case 'wail_ice':
                case 'wail_void':
                    this.playTone(profile === 'wail_ice' ? 880 : 310, profile === 'wail_ice' ? 420 : 120, 0.55, 'sine', 0.18 * distScale);
                    return;
                case 'roar_deep':
                case 'roar_hollow':
                    this.playTone(72, 42, 0.62, 'sawtooth', 0.24 * distScale);
                    this.playNoise(0.45, 420, 'lowpass', 1.0, 0.18 * distScale);
                    return;
                case 'crackle_fire':
                    this.playNoise(0.28, 1600, 'bandpass', 1.5, 0.16 * distScale);
                    this.playTone(190, 95, 0.25, 'sawtooth', 0.14 * distScale);
                    return;
                case 'groan_dual':
                    this.playTone(135, 92, 0.36, 'sawtooth', 0.13 * distScale);
                    this.playTone(195, 138, 0.36, 'sawtooth', 0.13 * distScale, 0.05);
                    return;
                default: {
                    const base = 115 + Math.random() * 45;
                    this.playTone(base, base * 0.68, 0.38, 'sawtooth', 0.16 * distScale);
                    this.playNoise(0.30, 520, 'bandpass', 2.4, 0.12 * distScale);
                }
            }
        }

        playBossIntro() {
            [110, 103.8, 98, 73.4].forEach((f, i) => {
                this.playTone(f, f * 0.94, 0.85, 'sawtooth', 0.26, i * 0.24);
                this.playTone(f * 0.5, f * 0.48, 0.95, 'sine', 0.30, i * 0.24);
            });
            this.playNoise(0.8, 320, 'lowpass', 0.9, 0.25, 0.2);
        }

        playUltimate(ultId) {
            if (ultId === 'cryo_nova') {
                this.playTone(1400, 280, 0.65, 'sine', 0.28);
                this.playNoise(0.55, 3600, 'highpass', 1.2, 0.25);
            } else if (ultId === 'annihilator') {
                this.playTone(1850, 140, 0.45, 'sawtooth', 0.35);
                this.playNoise(0.32, 1800, 'bandpass', 0.8, 0.40);
            } else {
                this.playTone(180, 42, 0.72, 'sawtooth', 0.38);
                this.playTone(440, 880, 0.35, 'triangle', 0.22);
                this.playNoise(0.55, 700, 'lowpass', 0.8, 0.45);
            }
        }

        playRoundStart(roundNum, isDogRound = false) {
            if (isDogRound) {
                this.playTone(140, 48, 0.8, 'sawtooth', 0.28);
                this.playTone(210, 62, 0.9, 'triangle', 0.22, 0.25);
                return;
            }
            // Eerie Zombies round chord progression
            const notes = roundNum % 2 === 1 ? [146.8, 174.6, 220.0, 207.6] : [130.8, 155.6, 196.0, 185.0];
            notes.forEach((f, idx) => {
                this.playTone(f, f * 0.98, 0.65, 'sawtooth', 0.14, idx * 0.22);
                this.playTone(f * 0.5, f * 0.49, 0.75, 'triangle', 0.16, idx * 0.22);
            });
        }

        playRoundEnd() {
            [220, 196, 174.6, 146.8].forEach((f, idx) => {
                this.playTone(f, f, 0.45, 'triangle', 0.15, idx * 0.18);
            });
        }

        playMysteryBoxJingle() {
            const melody = [523.25, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25, 587.33];
            melody.forEach((f, idx) => {
                this.playTone(f, f * 1.002, 0.28, 'sine', 0.16, idx * 0.19);
                this.playTone(f * 2, f * 2, 0.20, 'triangle', 0.06, idx * 0.19);
            });
        }

        playTeddyLaugh() {
            [720, 540, 680, 480, 640, 420].forEach((f, i) => {
                this.playTone(f, f * 0.72, 0.16, 'sawtooth', 0.18, i * 0.14);
            });
        }

        playPerkBuy() {
            [392, 493.88, 587.33, 783.99].forEach((f, i) => {
                this.playTone(f, f, 0.26, 'triangle', 0.18, i * 0.09);
            });
        }

        playPaPChime() {
            [261.6, 329.6, 392.0, 523.25, 659.25, 784.0].forEach((f, i) => {
                this.playTone(f, f * 1.01, 0.30, 'sawtooth', 0.12, i * 0.08);
            });
            this.playNoise(0.45, 2200, 'bandpass', 1.8, 0.18, 0.25);
        }

        playPowerUp() {
            this.playTone(587.33, 880, 0.22, 'sine', 0.22);
            this.playTone(880, 1174.66, 0.35, 'triangle', 0.20, 0.12);
        }

        playPowerOn() {
            this.playTone(65, 210, 0.9, 'sawtooth', 0.25);
            this.playTone(130, 420, 0.9, 'triangle', 0.22, 0.1);
            this.playNoise(0.4, 1500, 'bandpass', 1.2, 0.22, 0.25);
        }

        playPoints() {
            this.playTone(1180, 1460, 0.055, 'sine', 0.12);
        }

        playRankUp() {
            [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => {
                this.playTone(f, f, 0.38, 'triangle', 0.18, i * 0.10);
            });
        }

        playMedal() {
            this.playTone(740, 988, 0.14, 'triangle', 0.15);
            this.playTone(1110, 1480, 0.18, 'sine', 0.14, 0.06);
        }

        playKillstreakReady() {
            this.playNoise(0.06, 2600, 'bandpass', 2.0, 0.14);
            this.playTone(880, 1175, 0.12, 'square', 0.12, 0.04);
            this.playTone(1175, 1320, 0.18, 'square', 0.12, 0.15);
        }

        playNukeSiren() {
            for (let i = 0; i < 6; i++) {
                this.playTone(420, 760, 0.55, 'sawtooth', 0.20, i * 1.1);
                this.playTone(760, 420, 0.55, 'sawtooth', 0.20, i * 1.1 + 0.55);
            }
        }

        playTrapZap() {
            this.playNoise(0.28, 3200, 'bandpass', 2.2, 0.34);
            this.playTone(180, 95, 0.24, 'sawtooth', 0.22);
            this.playTone(960, 320, 0.16, 'square', 0.12, 0.04);
        }

        playAirRaidSiren() {
            this.playTone(280, 680, 0.9, 'sawtooth', 0.22);
            this.playTone(680, 260, 0.9, 'sawtooth', 0.20, 0.9);
        }

        playRocketLaunch() {
            this.playNoise(1.4, 240, 'lowpass', 0.9, 0.55);
            this.playTone(95, 42, 1.35, 'sawtooth', 0.32);
            this.playTone(160, 320, 1.1, 'triangle', 0.20, 0.15);
        }

        playDefconBeep(level = 4) {
            const base = 620 + (5 - Math.max(1, Math.min(5, level))) * 90;
            this.playTone(base, base, 0.14, 'square', 0.20);
            if (level >= 5) {
                this.playTone(base * 1.35, base * 1.35, 0.22, 'sawtooth', 0.22, 0.16);
                this.playTone(base * 1.35, base * 1.35, 0.22, 'sawtooth', 0.22, 0.42);
            }
        }

        playTelephoneEasterEgg() {
            // Vintage phone double-ring followed by 6-note eerie synth riff homage to "The One"
            this.playTone(1120, 1180, 0.12, 'triangle', 0.18, 0.0);
            this.playTone(1120, 1180, 0.12, 'triangle', 0.18, 0.18);
            const riff = [329.63, 493.88, 659.25, 587.33, 523.25, 493.88];
            riff.forEach((f, idx) => {
                this.playTone(f, f * 0.995, 0.34, 'sawtooth', 0.14, 0.52 + idx * 0.24);
                this.playTone(f * 0.5, f * 0.5, 0.34, 'sine', 0.16, 0.52 + idx * 0.24);
            });
        }

        playElevatorHum() {
            this.playTone(880, 880, 0.14, 'sine', 0.16);
            this.playNoise(0.95, 190, 'lowpass', 1.1, 0.24, 0.12);
        }

        playBusterChargeTick(frac = 0) {
            const f = 220 + BO.Math.clamp(frac, 0, 1) * 860;
            this.playTone(f, f * 1.14, 0.14, 'sawtooth', 0.08 + frac * 0.08);
            this.playTone(f * 1.5, f * 1.68, 0.12, 'triangle', 0.05 + frac * 0.06, 0.02);
        }

        playBusterRelease(frac = 0) {
            const f = BO.Math.clamp(frac, 0, 1);
            this.playTone(980 + f * 650, 110, 0.24 + f * 0.48, 'sawtooth', 0.28 + f * 0.25);
            this.playTone(180 + f * 140, 38, 0.26 + f * 0.55, 'sine', 0.26 + f * 0.30);
            if (f >= 0.4) {
                this.playNoise(0.28 + f * 0.4, 900 + f * 800, 'bandpass', 0.8, 0.35 + f * 0.25);
            }
        }

        playHaloMedalSting(tier = 1) {
            // Iconic Halo-inspired brass + choral fifths + timpani sub-impact
            const chords = {
                1: [146.83, 220.0, 293.66],
                2: [146.83, 220.0, 293.66, 369.99],
                3: [130.81, 196.0, 261.63, 329.63, 392.0],
                4: [110.0, 164.81, 220.0, 277.18, 329.63, 440.0]
            };
            const notes = chords[Math.max(1, Math.min(4, tier))] || chords[1];
            this.playTone(68, 34, 0.42, 'sine', 0.28);
            this.playNoise(0.16, 620, 'lowpass', 0.9, 0.22);
            notes.forEach((f, idx) => {
                const d = idx * 0.052;
                this.playTone(f, f * 0.996, 0.44, 'sawtooth', 0.15, d);
                this.playTone(f * 1.004, f, 0.46, 'triangle', 0.16, d + 0.008);
                this.playTone(f * 0.5, f * 0.498, 0.50, 'sine', 0.18, d);
            });
        }

        playAnnouncement(calloutId, customLine = '', priority = 2) {
            const CALLOUTS = {
                double_kill: { line: 'Double Kill!', tier: 1, prio: 2 },
                triple_kill: { line: 'Triple Kill!', tier: 2, prio: 3 },
                overkill: { line: 'Overkill!', tier: 3, prio: 4 },
                killtacular: { line: 'Killtacular!', tier: 3, prio: 5 },
                killtrocity: { line: 'Killtrocity!', tier: 4, prio: 6 },
                killimanjaro: { line: 'Killimanjaro!', tier: 4, prio: 7 },
                killtastrophe: { line: 'Killtastrophe!', tier: 4, prio: 8 },
                killpocalypse: { line: 'Killpocalypse!', tier: 4, prio: 9 },
                killionaire: { line: 'Killionaire!', tier: 4, prio: 10 },
                killing_spree: { line: 'Killing Spree!', tier: 2, prio: 3 },
                killing_frenzy: { line: 'Killing Frenzy!', tier: 3, prio: 4 },
                running_riot: { line: 'Running Riot!', tier: 3, prio: 5 },
                rampage: { line: 'Rampage!', tier: 4, prio: 6 },
                untouchable: { line: 'Untouchable!', tier: 4, prio: 7 },
                invincible: { line: 'Invincible!', tier: 4, prio: 8 },
                headhunter: { line: 'Headhunter!', tier: 2, prio: 2 },
                bulltrue: { line: 'Bulltrue!', tier: 2, prio: 2 },
                extermination: { line: 'Extermination!', tier: 3, prio: 4 },
                super_boss: { line: 'Super Boss Inbound!', tier: 4, prio: 7 },
                boss_slain: { line: 'Colossus Slain!', tier: 3, prio: 5 }
            };
            const spec = CALLOUTS[calloutId] || { line: customLine || String(calloutId || ''), tier: 2, prio: priority };
            const spoken = customLine || spec.line;
            if (!spoken) return;

            this.playHaloMedalSting(spec.tier);

            if (BO.Settings && BO.Settings.get('announcerEnabled') === false) return;
            const masterVol = BO.Settings ? (BO.Settings.get('masterVolume') ?? 0.8) : 0.8;
            const sfxVol = BO.Settings ? (BO.Settings.get('sfxVolume') ?? 0.85) : 0.85;
            if (masterVol * sfxVol <= 0.03) return;

            const now = performance.now();
            if (this._lastAnnounceUntil && now < this._lastAnnounceUntil && (this._lastAnnouncePrio || 0) > spec.prio) {
                return;
            }
            this._lastAnnouncePrio = spec.prio;
            this._lastAnnounceUntil = now + 1150;

            try {
                if (typeof global.speechSynthesis !== 'undefined' && typeof global.SpeechSynthesisUtterance !== 'undefined') {
                    global.speechSynthesis.cancel();
                    const u = new global.SpeechSynthesisUtterance(spoken);
                    // Deep, resonant, authoritative Halo-style announcer cadence
                    u.pitch = spec.prio >= 5 ? 0.62 : 0.68;
                    u.rate = spec.prio >= 5 ? 0.88 : 0.92;
                    u.volume = BO.Math.clamp(masterVol * sfxVol * 1.1, 0.1, 1.0);
                    const voices = global.speechSynthesis.getVoices ? global.speechSynthesis.getVoices() : [];
                    if (voices && voices.length > 0) {
                        const deepEn = voices.find((v) => /en/i.test(v.lang) && /(david|mark|george|guy|christopher|ryan|eric|daniel|male)/i.test(v.name))
                            || voices.find((v) => /en[-_](us|gb)/i.test(v.lang))
                            || voices.find((v) => /en/i.test(v.lang))
                            || voices[0];
                        if (deepEn) u.voice = deepEn;
                    }
                    global.speechSynthesis.speak(u);
                }
            } catch (e) {}
        }

        playMultikillVoice(count) {
            const map = {
                2: 'double_kill',
                3: 'triple_kill',
                4: 'overkill',
                5: 'killtacular',
                6: 'killtrocity',
                7: 'killimanjaro',
                8: 'killtastrophe',
                9: 'killpocalypse'
            };
            const id = count >= 10 ? 'killionaire' : map[count];
            if (id) this.playAnnouncement(id);
        }

        playKillcamStart() {
            this.playTone(82, 55, 1.4, 'sawtooth', 0.22);
            this.playTone(164, 110, 1.4, 'triangle', 0.18, 0.08);
            this.playNoise(0.9, 260, 'lowpass', 1.0, 0.25);
        }

        playTurretFire() {
            this.playTone(260, 75, 0.065, 'square', 0.14);
            this.playNoise(0.05, 2200, 'bandpass', 1.2, 0.16);
        }

        playDogBark() {
            this.playTone(280, 120, 0.16, 'sawtooth', 0.22);
            this.playTone(220, 95, 0.18, 'triangle', 0.18, 0.12);
        }

        playWallHit() {
            this.playTone(130, 52, 0.14, 'triangle', 0.16);
            this.playNoise(0.12, 480, 'lowpass', 1.1, 0.18);
        }

        playWallBreak() {
            this.playExplosion(0.72);
            this.playNoise(0.45, 750, 'bandpass', 0.8, 0.35);
        }

        playShopBuy() {
            this.playTone(587.33, 880, 0.12, 'triangle', 0.20);
            this.playTone(880, 1174.66, 0.18, 'sine', 0.18, 0.08);
        }

        startMusic(mode) {
            if (this.musicMode === mode) return;
            this.stopMusic();
            this.musicMode = mode;

            // Subtle moody dark ambient pulse that stays atmospheric
            const playPulse = () => {
                if (!this.musicMode) return;
                const s = BO.Settings.all;
                if ((s.musicVolume ?? 0.55) <= 0.02) return;
                if (!this.ctx || this.ctx.state !== 'running') return;

                if (this.musicMode === 'menu') {
                    this.playTone(55, 55, 2.2, 'sine', 0.24, 0, 'music');
                    this.playTone(110, 108, 1.8, 'triangle', 0.12, 0.4, 'music');
                    this.playTone(164.8, 164.8, 1.4, 'sine', 0.08, 1.1, 'music');
                } else if (this.musicMode === 'zombies') {
                    this.playTone(49, 48, 2.4, 'sawtooth', 0.09, 0, 'music');
                    this.playTone(146.8, 138.6, 1.8, 'sine', 0.10, 0.8, 'music');
                }
            };

            playPulse();
            this.musicTimer = setInterval(playPulse, 3200);
        }

        stopMusic() {
            this.musicMode = null;
            if (this.musicTimer) {
                clearInterval(this.musicTimer);
                this.musicTimer = null;
            }
        }
    }

    BO.Sound = new SoundEngine();
})(window);
