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

        playGunshot(profile, suppressed = false, isPaP = false, distScale = 1.0) {
            if (distScale <= 0.02) return;
            const ctx = this.ensureContext();
            if (!ctx) return;

            const v = distScale * (suppressed ? 0.55 : 1.0);

            if (profile === 'raygun') {
                this.playTone(1350, 210, 0.19, 'sawtooth', 0.30 * v);
                this.playTone(920, 140, 0.22, 'sine', 0.28 * v, 0.01);
                if (isPaP) this.playTone(1900, 480, 0.20, 'triangle', 0.18 * v);
                return;
            }
            if (profile === 'zeus') {
                this.playTone(110, 32, 0.55, 'sawtooth', 0.55 * v);
                this.playNoise(0.45, 320, 'lowpass', 0.8, 0.65 * v);
                this.playTone(460, 80, 0.35, 'triangle', 0.32 * v);
                return;
            }

            // Layered COD weapon crack: low punch + mid transient + high crack + bolt snap
            let punchF = 160;
            let noiseF = 1850;
            let dur = 0.12;
            let punchVol = 0.38;
            let crackVol = 0.45;

            switch (profile) {
                case 'smg':
                case 'smg_heavy':
                    punchF = 185; noiseF = 2400; dur = 0.085; punchVol = 0.28; crackVol = 0.36; break;
                case 'ar_light':
                    punchF = 155; noiseF = 2000; dur = 0.12; punchVol = 0.36; crackVol = 0.44; break;
                case 'ar_heavy':
                case 'dmr':
                    punchF = 132; noiseF = 1550; dur = 0.15; punchVol = 0.44; crackVol = 0.50; break;
                case 'lmg':
                    punchF = 140; noiseF = 1700; dur = 0.14; punchVol = 0.42; crackVol = 0.48; break;
                case 'shotgun':
                    punchF = 105; noiseF = 950; dur = 0.24; punchVol = 0.58; crackVol = 0.65; break;
                case 'sniper':
                    punchF = 115; noiseF = 1350; dur = 0.34; punchVol = 0.62; crackVol = 0.72; break;
                case 'pistol':
                    punchF = 210; noiseF = 2300; dur = 0.095; punchVol = 0.30; crackVol = 0.34; break;
                case 'deagle':
                    punchF = 125; noiseF = 1500; dur = 0.20; punchVol = 0.50; crackVol = 0.52; break;
            }

            if (suppressed) {
                this.playTone(punchF * 1.1, 48, dur * 0.75, 'sine', punchVol * 0.75 * v);
                this.playNoise(dur * 0.7, 920, 'lowpass', 1.4, crackVol * 0.45 * v);
                this.playTone(1850, 900, 0.03, 'triangle', 0.10 * v);
            } else {
                this.playTone(punchF, 36, dur * 0.9, 'triangle', punchVol * v);
                this.playNoise(dur, noiseF, 'bandpass', 0.75, crackVol * v);
                this.playNoise(dur * 0.45, 4200, 'highpass', 0.7, crackVol * 0.38 * v);
            }

            if (isPaP) {
                // Signature Pack-a-Punch futuristic laser-harmonic tail
                this.playTone(1580, 420, 0.13, 'sawtooth', 0.15 * v, 0.01);
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
                this.playTone(420, 220, 0.07, 'square', 0.14);
                this.playNoise(0.06, 2200, 'bandpass', 2.0, 0.16);
            } else if (stage === 'in') {
                this.playTone(260, 520, 0.07, 'triangle', 0.20);
                this.playNoise(0.05, 3100, 'bandpass', 2.2, 0.20);
            } else if (stage === 'bolt') {
                this.playTone(720, 380, 0.06, 'sawtooth', 0.16);
                this.playTone(520, 920, 0.05, 'triangle', 0.16, 0.07);
            } else if (stage === 'shell') {
                this.playTone(540, 290, 0.045, 'triangle', 0.15);
                this.playNoise(0.03, 2800, 'highpass', 1.2, 0.12);
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

        playMultikillVoice(count) {
            let line = '';
            if (count === 2) line = 'Double Kill!';
            else if (count === 3) line = 'Triple Kill!';
            else if (count === 4) line = 'Quad Kill!';
            else if (count >= 5) line = 'Mega Kill!';
            if (!line) return;

            // Epic COD brass + sub-bass impact stinger (always works offline)
            const notes = count >= 4 ? [110, 164.8, 220, 329.6] : (count === 3 ? [110, 146.8, 220] : [110, 164.8]);
            notes.forEach((f, idx) => {
                this.playTone(f, f * 0.99, 0.42, 'sawtooth', 0.22, idx * 0.06);
                this.playTone(f * 0.5, f * 0.49, 0.48, 'sine', 0.24, idx * 0.06);
            });
            this.playNoise(0.22, 650, 'lowpass', 0.9, 0.26);

            // Offline Epic Announcer Speech Synthesis
            try {
                if (typeof global.speechSynthesis !== 'undefined' && typeof global.SpeechSynthesisUtterance !== 'undefined') {
                    global.speechSynthesis.cancel();
                    const u = new global.SpeechSynthesisUtterance(line);
                    u.pitch = 0.62;
                    u.rate = 0.94;
                    u.volume = BO.Math.clamp((BO.Settings.get('masterVolume') ?? 0.8) * (BO.Settings.get('sfxVolume') ?? 0.9), 0.1, 1.0);
                    const voices = global.speechSynthesis.getVoices ? global.speechSynthesis.getVoices() : [];
                    if (voices && voices.length > 0) {
                        const deepEn = voices.find((v) => /en/i.test(v.lang) && /(david|mark|george|daniel|guy|male|google)/i.test(v.name))
                            || voices.find((v) => /en/i.test(v.lang)) || voices[0];
                        if (deepEn) u.voice = deepEn;
                    }
                    global.speechSynthesis.speak(u);
                }
            } catch (e) {}
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
