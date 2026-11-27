/* ============================================================================
   BLACKOUT OPS — MINIGAME AUDIO & PROCEDURAL MULTI-TRACK MUSIC STUDIO
   Dedicated Web Audio DSP music arrangements & bespoke sound effects for:
     1. Master Zombie   — Dark Industrial Bio-Horror Siege + Phase-2 Boss Score
     2. Snowboarding    — 172 BPM Liquid Drum & Bass / Alpine Synthwave + Board Physics Audio
     3. 360 Trick Shot  — Arena Trap Beat + Dynamic Slow-Mo Lowpass Drop + Style Chimes
     4. Mario FPS       — 4-Channel Chiptune & Synth Arrangements (1-1, 1-2, 1-3, 1-4,
                          Starman, Bowser Metal, and Prism Foundry Clockwork Synth)
   Routes cleanly through BO.Sound.musicGain & BO.Sound.sfxGain so user volume
   settings apply everywhere and audio stops cleanly on mode exit.
============================================================================ */
(function (BO) {
    'use strict';

    const NOTE = {
        C2: 65.41, Cs2: 69.30, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47,
        C3: 130.81, Cs3: 138.59, Db3: 138.59, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
        C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
        C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
        C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00
    };

    class MinigameAudioEngine {
        constructor() {
            this.mode = null;
            this.step = 0;
            this.timer = 0;
            this.bus = null;
            this.filter = null;
            this.carveLoop = null;
            this.grindLoop = null;
            this.windLoop = null;
        }

        _ctx() {
            if (!BO.Sound) return null;
            return BO.Sound.ensureContext ? BO.Sound.ensureContext() : BO.Sound.ctx;
        }

        _ensureBus() {
            const ctx = this._ctx();
            if (!ctx) return null;
            if (!this.bus || this.bus.context !== ctx) {
                this.filter = ctx.createBiquadFilter();
                this.filter.type = 'lowpass';
                this.filter.frequency.value = 18000;
                this.filter.Q.value = 0.9;
                this.bus = ctx.createGain();
                this.bus.gain.value = 1.0;
                this.bus.connect(this.filter);
                this.filter.connect(BO.Sound.musicGain || ctx.destination);
            }
            return ctx;
        }

        start(mode) {
            this.stop();
            this.mode = mode;
            this.step = 0;
            this.timer = 0.02;
            const ctx = this._ensureBus();
            if (ctx && this.filter) {
                this.filter.frequency.setValueAtTime(18000, ctx.currentTime);
            }
        }

        setLowpass(hz, ramp = 0.08) {
            const ctx = this._ensureBus();
            if (!ctx || !this.filter) return;
            this.filter.frequency.setTargetAtTime(Math.max(180, hz), ctx.currentTime, ramp);
        }

        stop() {
            this.mode = null;
            this.step = 0;
            this.stopBoardLoops();
            const ctx = BO.Sound && BO.Sound.ctx;
            if (ctx && this.filter) {
                try { this.filter.frequency.setTargetAtTime(18000, ctx.currentTime, 0.04); } catch (e) {}
            }
        }

        /* ---------------------------------------------------- Core Synth Voices */
        _osc(freq, duration, type = 'sawtooth', volume = 0.14, opts = {}) {
            if (!freq || volume <= 0.001 || !this._ensureBus()) return;
            const cutoff = opts.cutoff || (opts.sfx && (type === 'square' || type === 'sawtooth')
                ? Math.min(8100, freq * 4.2 + 680) : null);
            const filter = cutoff ? [opts.filterType || 'lowpass', cutoff, opts.q || 1.8, opts.cutoffEnd] : null;
            BO.Sound.synthTone(freq, opts.slideTo || freq, duration, type, volume, {
                dest: opts.sfx ? 'sfx' : this.bus, filter, detune: opts.detune,
                attack: opts.attack ?? 0.008, delay: opts.delay, pan: opts.pan
            });
        }

        _supersaw(freq, dur, vol = 0.08, cutoff = 3200, delay = 0) {
            this._osc(freq, dur, 'sawtooth', vol * 0.55, { detune: -11, cutoff, cutoffEnd: cutoff * 0.45, pan: -0.35, delay, attack: 0.015 });
            this._osc(freq, dur, 'sawtooth', vol * 0.55, { detune: 11, cutoff, cutoffEnd: cutoff * 0.45, pan: 0.35, delay, attack: 0.015 });
        }

        _kick(vol = 0.28, punch = 148, sub = 42, dur = 0.22, sfx = false) {
            this._osc(punch, dur, 'sine', vol, { slideTo: sub, attack: 0.002, sfx });
            this._noise(0.024, 2400, 'lowpass', 0.9, vol * 0.28, 0, sfx);
        }

        _snare(vol = 0.18, tone = 195, dur = 0.14, sfx = false) {
            this._osc(tone, dur * 0.55, 'triangle', vol * 0.55, { slideTo: 105, attack: 0.002, sfx });
            this._noise(dur, 2100, 'bandpass', 1.1, vol, 0, sfx);
        }

        _hat(vol = 0.08, open = false, pan = 0) {
            this._noise(open ? 0.16 : 0.042, 7800, 'highpass', 1.2, vol, pan, false);
        }

        _noise(duration, freq, type = 'bandpass', q = 1.2, volume = 0.15, pan = 0, sfx = false, delay = 0) {
            if (volume <= 0.001 || !this._ensureBus()) return;
            BO.Sound.synthNoise(duration, freq, type, q, volume, {
                dest: sfx ? 'sfx' : this.bus, delay, pan,
                attack: sfx ? undefined : 0.0005,
                endFrequency: sfx && type === 'bandpass' ? freq * 0.7 : undefined
            });
        }

        /* ====================================================================
           CONTINUOUS SNOWBOARD / GRIND / WIND PHYSICS LOOPS
        ==================================================================== */
        updateBoardAudio(speed, carveAmt, onGround, onRail, boostActive) {
            const ctx = this._ctx();
            if (!ctx || !BO.Sound.noiseBuffer) return;
            if (!this.carveLoop || this.carveLoop.ctx !== ctx) {
                const mkLoop = (type, freq, q) => {
                    const src = ctx.createBufferSource();
                    src.buffer = BO.Sound.noiseBuffer;
                    src.loop = true;
                    const flt = ctx.createBiquadFilter();
                    flt.type = type;
                    flt.frequency.value = freq;
                    flt.Q.value = q;
                    const g = ctx.createGain();
                    g.gain.value = 0.0001;
                    src.connect(flt);
                    flt.connect(g);
                    const pan = ctx.createStereoPanner?.();
                    if (pan) g.connect(pan).connect(BO.Sound.sfxGain);
                    else g.connect(BO.Sound.sfxGain);
                    src.onended = () => { src.disconnect(); flt.disconnect(); g.disconnect(); pan?.disconnect(); };
                    src.start(0, Math.random() * src.buffer.duration);
                    return { ctx, source: src, flt, g, pan };
                };
                this.carveLoop = mkLoop('bandpass', 1500, 1.8);
                this.windLoop = mkLoop('lowpass', 620, 0.8);
                // Metallic resonant ring for copper rail grinds
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = 410;
                const rFlt = ctx.createBiquadFilter();
                rFlt.type = 'bandpass';
                rFlt.frequency.value = 1850;
                rFlt.Q.value = 7.5;
                const rG = ctx.createGain();
                rG.gain.value = 0.0001;
                osc.connect(rFlt);
                rFlt.connect(rG);
                rG.connect(BO.Sound.sfxGain);
                osc.onended = () => { osc.disconnect(); rFlt.disconnect(); rG.disconnect(); };
                osc.start();
                this.grindLoop = { ctx, source: osc, flt: rFlt, g: rG };
            }
            const t = ctx.currentTime;
            const spdNorm = Math.min(1.4, Math.max(0, speed / 30));
            const carveGain = onGround && !onRail ? Math.min(0.16, (0.025 + Math.abs(carveAmt) * 0.085) * spdNorm) : 0.0001;
            this.carveLoop.flt.frequency.setTargetAtTime(1100 + Math.abs(carveAmt) * 1400 + spdNorm * 500, t, 0.05);
            this.carveLoop.g.gain.setTargetAtTime(carveGain, t, 0.04);
            this.carveLoop.pan?.pan.setTargetAtTime(Math.max(-0.72, Math.min(0.72, carveAmt * 0.65)), t, 0.065);

            const windGain = Math.min(0.14, spdNorm * (onGround ? 0.049 : 0.097) + (boostActive ? 0.05 : 0));
            this.windLoop.flt.frequency.setTargetAtTime(380 + spdNorm * 650 + (boostActive ? 500 : 0), t, 0.06);
            this.windLoop.g.gain.setTargetAtTime(windGain, t, 0.05);

            const grindGain = onRail ? Math.min(0.13, 0.06 + spdNorm * 0.05) : 0.0001;
            if (onRail) {
                this.grindLoop.source.frequency.setTargetAtTime(295 + spdNorm * 180, t, 0.04);
                this.grindLoop.flt.frequency.setTargetAtTime(1250 + spdNorm * 1050, t, 0.05);
            }
            this.grindLoop.g.gain.setTargetAtTime(grindGain, t, 0.03);
        }

        stopBoardLoops() {
            for (const k of ['carveLoop', 'windLoop', 'grindLoop']) {
                const l = this[k];
                if (!l) continue;
                const now = l.ctx.currentTime;
                l.g.gain.setTargetAtTime(0.0001, now, 0.014);
                l.source.stop(now + 0.075);
                this[k] = null;
            }
        }

        /* ====================================================================
           MULTI-TRACK MUSIC SEQUENCER UPDATE (CALLED PER FRAME)
        ==================================================================== */
        tick(dt, state = {}) {
            if (!this.mode) return;
            this.timer -= dt;
            if (this.timer > 0) return;

            const s = this.step++;
            if (this.mode === 'siege') {
                // 132 BPM Dark Industrial Bio-Horror Siege (16th note = 0.113s)
                const intense = !!state.wardenAwake;
                const phase2 = !!state.wardenPhase2;
                this.timer = phase2 ? 0.098 : intense ? 0.105 : 0.116;
                const barStep = s % 16;
                const bar = Math.floor(s / 16) % 4;
                const roots = [NOTE.D2, NOTE.D2, NOTE.Eb2, phase2 ? NOTE.F2 : NOTE.Cs2];
                const root = roots[bar];

                // Heavy industrial kick & metallic anvil snare
                if (barStep === 0 || barStep === 6 || barStep === 10 || (intense && barStep === 14)) {
                    this._kick(intense ? 0.30 : 0.24, 138, 38, 0.24);
                }
                if (barStep === 4 || barStep === 12) {
                    this._snare(intense ? 0.20 : 0.15, 175, 0.16);
                    if (intense) this._osc(420, 0.09, 'square', 0.045, { slideTo: 160, cutoff: 1400 });
                }
                if (barStep % 2 === 1) this._hat(intense ? 0.065 : 0.04, barStep === 15, (barStep % 4 === 1) ? -0.3 : 0.3);

                // Gritty sawtooth D-Phrygian bass riff
                const riff = [1, 0, 1, 1.059, 0, 1, 1.498, 1.335, 1, 0, 1.189, 1.059, 0, 1, 0.891, 1.059];
                const mult = riff[barStep];
                if (mult) {
                    this._osc(root * mult, this.timer * 0.92, 'sawtooth', intense ? 0.15 : 0.11, {
                        cutoff: intense ? 1650 : 980, cutoffEnd: 240, q: 3.2
                    });
                }
                // Eerie bio-choir / alarm synth lead
                if (barStep === 0) {
                    this._supersaw(root * 4, this.timer * 7.5, 0.045, intense ? 2400 : 1200);
                }
                if (intense && (barStep === 0 || barStep === 3 || barStep === 6 || barStep === 11 || barStep === 14)) {
                    const lead = [NOTE.D5, NOTE.Eb5, NOTE.A4, NOTE.Bb4, NOTE.F5][barStep % 5];
                    this._osc(lead, this.timer * 1.4, 'sawtooth', 0.065, { cutoff: 2800, pan: Math.sin(s) * 0.45 });
                }
            } else if (this.mode === 'snow') {
                // 172 BPM Liquid Drum & Bass / SSX Synthwave (16th note = 0.087s)
                const boost = !!state.boost;
                this.timer = boost ? 0.081 : 0.087;
                const st = s % 16;
                const bar = Math.floor(s / 16) % 4;
                const chords = [
                    [NOTE.F3, NOTE.Ab4, NOTE.C5, NOTE.Eb5],
                    [NOTE.Db3, NOTE.F4, NOTE.Ab4, NOTE.C5],
                    [NOTE.Ab2, NOTE.Eb4, NOTE.Ab4, NOTE.C5],
                    [NOTE.Eb3, NOTE.G4, NOTE.Bb4, NOTE.D5]
                ][bar];

                // Classic 2-step Amen DnB breakbeat: Kick on 0 & 10, Snare on 4 & 12, ghost snares on 7 & 9
                if (st === 0 || st === 10) this._kick(0.27, 155, 44, 0.19);
                if (st === 4 || st === 12) this._snare(0.19, 225, 0.13);
                else if (st === 7 || st === 9 || (boost && st === 15)) this._snare(0.075, 250, 0.07);
                this._hat(st % 2 === 0 ? 0.055 : 0.035, st === 14, (st % 4 < 2) ? -0.25 : 0.25);

                // Warm Reese sub + detuned mid bass
                if (st === 0 || st === 6 || st === 10) {
                    const dur = (st === 0 ? 5.5 : 3.5) * this.timer;
                    this._osc(chords[0] * 0.5, dur, 'sine', 0.20, { attack: 0.01 });
                    this._osc(chords[0], dur, 'sawtooth', 0.09, { detune: 9, cutoff: boost ? 1400 : 850, q: 2.2 });
                }
                // Lush supersaw chord stabs
                if (st === 0 || st === 6 || st === 12) {
                    for (let i = 1; i < 4; i++) {
                        this._supersaw(chords[i], this.timer * 3.2, boost ? 0.042 : 0.03, boost ? 4400 : 2600);
                    }
                }
                // Soaring alpine synth lead arpeggio
                const arp = [chords[3], chords[2], chords[1], chords[2], chords[3] * 1.5, chords[3], chords[2], chords[1]];
                if (st % 2 === 0 || boost) {
                    const f = arp[st % arp.length];
                    this._osc(f, this.timer * 1.6, 'triangle', boost ? 0.085 : 0.06, { pan: Math.cos(s * 0.7) * 0.4 });
                }
            } else if (this.mode === 'trickshot') {
                // 144 BPM Hype Trap / Arena Beat (16th note = 0.104s)
                this.timer = 0.104;
                const st = s % 16;
                const bar = Math.floor(s / 16) % 4;
                const bassRoot = [NOTE.E2, NOTE.E2, NOTE.C2, NOTE.D2][bar];

                if (st === 0 || st === 7 || st === 10) {
                    this._kick(0.28, 145, bassRoot * 0.5, 0.28);
                    this._osc(bassRoot, 0.34, 'sawtooth', 0.12, { cutoff: 520, cutoffEnd: 160 });
                }
                if (st === 8) this._snare(0.20, 210, 0.15);
                // Trap hi-hat rolls on steps 3,4,5 and 13,14,15
                if (st === 14 || st === 15) {
                    this._hat(0.06, false, -0.35);
                    this._noise(0.025, 8500, 'highpass', 1.2, 0.05, 0.35, false, this.timer * 0.5);
                } else if (st % 2 === 0 || st === 3) {
                    this._hat(0.05, st === 6, 0);
                }
                // Brass / bell arena motif
                const bell = [NOTE.E5, 0, NOTE.G5, NOTE.Fs5, 0, NOTE.E5, NOTE.B4, 0, NOTE.E5, 0, NOTE.A5, NOTE.G5, 0, NOTE.Fs5, NOTE.D5, 0][st];
                if (bell) {
                    this._osc(bell, this.timer * 1.8, 'sawtooth', 0.065, { cutoff: 2600, cutoffEnd: 700, pan: (st % 4 - 1.5) * 0.2 });
                }
            } else if (this.mode === 'foundry') {
                // Clockwork Arcane Synthwave — shifts mode between Cyan (Lydian) and Amber (Dorian)
                const amber = !!state.amber;
                const boss = !!state.boss;
                this.timer = boss ? 0.102 : 0.118;
                const st = s % 16;
                const bar = Math.floor(s / 16) % 4;
                const root = [NOTE.C3, NOTE.A2, NOTE.F2, NOTE.G2][bar];
                const scale = amber
                    ? [NOTE.C4, NOTE.D4, NOTE.Eb4, NOTE.G4, NOTE.A4, NOTE.Bb4, NOTE.C5, NOTE.D5]
                    : [NOTE.C4, NOTE.D4, NOTE.E4, NOTE.Fs4, NOTE.G4, NOTE.A4, NOTE.B4, NOTE.C5];

                if (st % 4 === 0) this._kick(0.24, 150, 45, 0.20);
                if (st === 4 || st === 12) this._snare(0.15, 200, 0.12);
                // Stereo clockwork escapement tick-tock!
                this._noise(0.018, st % 2 ? 4200 : 5600, 'bandpass', 5.0, 0.055, st % 2 ? -0.45 : 0.45, false);

                if (st % 2 === 0) {
                    this._osc(root * (st % 4 === 2 ? 2 : 1), this.timer * 1.5, 'sawtooth', 0.11, {
                        cutoff: amber ? 1700 : 1250, cutoffEnd: 300, q: 2.5
                    });
                }
                const note = scale[(st * 3 + bar * 2) % scale.length] * (boss && st % 4 === 0 ? 2 : 1);
                this._osc(note, this.timer * 1.6, amber ? 'sawtooth' : 'triangle', 0.075, {
                    cutoff: 3600, pan: Math.sin(s * 0.8) * 0.4
                });
            } else if (this.mode === 'angrybirds') {
                // Playful 136 BPM Bouncy Polka / Accordion & Pizzicato Theme
                this.timer = 0.110;
                const st = s % 32;
                const mel = [
                    NOTE.E4, NOTE.Fs4, NOTE.G4, 0, NOTE.E4, 0, NOTE.B4, 0,
                    NOTE.A4, NOTE.G4, NOTE.Fs4, 0, NOTE.E4, 0, 0, 0,
                    NOTE.G4, NOTE.A4, NOTE.B4, 0, NOTE.G4, 0, NOTE.D5, 0,
                    NOTE.C5, NOTE.B4, NOTE.A4, NOTE.G4, NOTE.Fs4, 0, NOTE.B4, 0
                ];
                const bass = [NOTE.E3, 0, NOTE.B2, 0, NOTE.E3, 0, NOTE.B2, 0, NOTE.A2, 0, NOTE.E3, 0, NOTE.B2, 0, NOTE.E3, 0];
                if (st % 4 === 0) this._kick(0.18, 130, 52, 0.13);
                if (st % 4 === 2) this._snare(0.11, 240, 0.08);
                if (mel[st]) {
                    this._osc(mel[st], 0.10, 'sawtooth', 0.068, { cutoff: 2200, pan: -0.15 });
                    this._osc(mel[st] * 2, 0.07, 'triangle', 0.04, { pan: 0.2 });
                }
                const b = bass[st % bass.length];
                if (b) this._osc(b, 0.14, 'triangle', 0.11);
            } else if (this.mode && this.mode.startsWith('mario:')) {
                this._tickMario(this.mode.slice(6), s);
            } else if (this.mode && this.mode.startsWith('ff:')) {
                // Final Fantasy JRPG: Explore (Prelude Harp), Battle (ATB 152 BPM), Boss (168 BPM Orchestral Organ)
                const sub = this.mode.slice(3);
                const N = NOTE;
                if (sub === 'explore') {
                    this.timer = 0.145;
                    const harp = [N.C4, N.D4, N.E4, N.G4, N.C5, N.D5, N.E5, N.G5, N.C6, N.G5, N.E5, N.D5, N.C5, N.G4, N.E4, N.D4,
                                  N.A3, N.B3, N.C4, N.E4, N.A4, N.B4, N.C5, N.E5, N.A5, N.E5, N.C5, N.B4, N.A4, N.E4, N.C4, N.B3];
                    const st = s % harp.length;
                    this._osc(harp[st], 0.34, 'triangle', 0.068, { pan: Math.sin(s * 0.4) * 0.35 });
                    if (st % 8 === 0) this._supersaw(st < 16 ? N.C3 : N.A2, 1.1, 0.032, 950);
                    if (st === 0 || st === 12 || st === 16 || st === 28) {
                        const fl = [N.E5, N.G5, N.C5, N.E5][Math.floor(st / 8)];
                        this._osc(fl, 0.65, 'sine', 0.055, { attack: 0.06, pan: 0.15 });
                    }
                } else if (sub === 'boss') {
                    this.timer = 0.095;
                    const st = s % 16;
                    const bar = Math.floor(s / 16) % 4;
                    const root = [N.D2, N.Bb2 * 0.5, N.C2, N.A2 * 0.5][bar];
                    if (st === 0 || st === 3 || st === 6 || st === 10 || st === 14) this._kick(0.28, 145, 42, 0.22);
                    if (st === 4 || st === 12) this._snare(0.19, 195, 0.14);
                    this._hat(st % 2 ? 0.055 : 0.035, st === 15, (st % 4 - 1.5) * 0.2);
                    this._osc(root * (st % 2 ? 2 : 1), 0.09, 'sawtooth', 0.11, { cutoff: 1100 });
                    const lead = [N.D5, 0, N.F5, N.E5, N.D5, 0, N.A4, N.Bb4, N.C5, 0, N.D5, N.F5, N.E5, N.D5, N.Cs5, 0][st];
                    if (lead) {
                        this._osc(lead, 0.17, 'sawtooth', 0.075, { cutoff: 3200, pan: -0.22 });
                        this._osc(lead * 0.5, 0.17, 'square', 0.045, { pan: 0.22 });
                    }
                    if (st === 0) this._supersaw(root * 4, 0.72, 0.042, 2200);
                } else {
                    // Classic 152 BPM JRPG ATB Battle Theme!
                    this.timer = 0.102;
                    const st = s % 16;
                    const bar = Math.floor(s / 16) % 4;
                    const bass = [N.E2, N.E2, N.G2, N.A2][bar];
                    if (st === 0 || st === 6 || st === 10) this._kick(0.24, 150, 48, 0.18);
                    if (st === 4 || st === 12) this._snare(0.16, 210, 0.12);
                    if (st % 2 === 0) this._hat(0.045, st === 14, 0.15);
                    this._osc(bass * (st % 4 === 2 ? 1.5 : 1), 0.095, 'triangle', 0.13);
                    const mel = [N.E5, N.G5, N.B5, 0, N.A5, N.G5, N.Fs5, 0, N.E5, N.Fs5, N.G5, N.A5, N.B5, 0, N.G5, 0][st];
                    if (mel) this._osc(mel, 0.12, 'square', 0.068, { cutoff: 2600, pan: -0.15 });
                }
            } else if (this.mode === 'bunker') {
                // Tense Cold-War Quarantine Ambience + Heartbeat when outbreak/infected
                const alert = !!state.outbreak;
                this.timer = alert ? 0.14 : 0.28;
                const st = s % 16;
                if (st === 0) this._osc(NOTE.C2, 2.2, 'sine', 0.14, { attack: 0.12 });
                if (st === 0 || (alert && st === 8)) this._kick(alert ? 0.24 : 0.12, 78, 36, 0.22);
                if (alert && (st === 2 || st === 10)) this._kick(0.16, 68, 34, 0.16);
                if (st === 4 || st === 12) {
                    this._osc(alert ? NOTE.Eb5 : NOTE.G4, 0.18, 'sine', alert ? 0.075 : 0.032, { pan: st === 4 ? -0.35 : 0.35 });
                }
                if (alert && st % 4 === 0) this._osc(840, 0.14, 'sawtooth', 0.055, { slideTo: 620, cutoff: 1400 });
            } else if (this.mode === 'toyshop') {
                // Whimsical Spooky-Cozy 3/4 Midnight Music-Box Waltz
                this.timer = 0.175;
                const N = NOTE;
                const st = s % 24;
                const waltz = [
                    N.E5, N.B4, N.C5, N.D5, N.C5, N.B4,
                    N.A4, N.E5, N.C5, N.B4, 0, N.G4,
                    N.Fs4, N.A4, N.D5, N.C5, N.B4, N.A4,
                    N.B4, N.E5, N.G5, N.Fs5, 0, 0
                ];
                const bass = [N.E3, N.B3, N.B3, N.A2, N.E3, N.E3, N.D3, N.A3, N.A3, N.E3, N.B3, N.B3];
                if (waltz[st]) {
                    this._osc(waltz[st], 0.36, 'sine', 0.075, { pan: Math.sin(s * 0.6) * 0.32 });
                    this._osc(waltz[st] * 2, 0.14, 'triangle', 0.03, { pan: -Math.sin(s * 0.6) * 0.28 });
                }
                if (st % 2 === 0) {
                    const b = bass[(st / 2) % bass.length];
                    this._osc(b, 0.22, 'triangle', st % 6 === 0 ? 0.10 : 0.055);
                }
            } else if (this.mode && this.mode.startsWith('kaiju')) {
                // Godzilla Brass & Taiko Stomp March / Mecha-Titan Synth-Rock Anthem
                const boss = this.mode === 'kaiju:mecha';
                const N = NOTE;
                this.timer = boss ? 0.098 : 0.135;
                const st = s % 16;
                const bar = Math.floor(s / 16) % 4;
                if (boss) {
                    const root = [N.E2, N.G2, N.A2, N.B2][bar];
                    if (st === 0 || st === 6 || st === 10 || st === 14) this._kick(0.30, 148, 38, 0.22);
                    if (st === 4 || st === 12) this._snare(0.22, 195, 0.16);
                    this._hat(0.05, st === 15, (st % 2 ? -0.3 : 0.3));
                    this._osc(root, 0.11, 'sawtooth', 0.14, { cutoff: 1450 });
                    const riff = [N.E4, N.E4, N.G4, N.A4, N.B4, 0, N.A4, N.G4, N.E4, N.D4, N.E4, N.G4, N.B4, N.A4, N.G4, N.Fs4][st];
                    if (riff) this._supersaw(riff * 2, 0.14, 0.055, 3200);
                } else {
                    // Heavy Taiko + Low Brass Kaiju March
                    if (st === 0 || st === 4 || st === 8 || st === 11 || st === 14) this._kick(0.32, 115, 34, 0.28);
                    if (st === 6 || st === 12) this._snare(0.18, 140, 0.18);
                    const brass = [N.C3, N.B2, N.Bb2, 0, N.C3, N.B2, N.Bb2, 0, N.Ab2, N.G2, N.F2, N.G2, N.C3, 0, 0, 0][st];
                    if (brass) {
                        this._osc(brass, 0.24, 'sawtooth', 0.13, { cutoff: 1100, cutoffEnd: 420 });
                        this._osc(brass * 0.5, 0.26, 'sawtooth', 0.10, { cutoff: 650 });
                    }
                }
            } else if (this.mode === 'derby') {
                // 140 BPM Electrifying Synthwave Carnival Rock-Organ Banger
                this.timer = 0.107;
                const N = NOTE;
                const st = s % 16;
                const bar = Math.floor(s / 16) % 4;
                const roots = [N.F2, N.Ab2, N.Bb2, N.C3];
                const root = roots[bar];
                if (st % 4 === 0) this._kick(0.28, 155, 45, 0.20);
                if (st === 4 || st === 12) this._snare(0.19, 220, 0.14);
                if (st % 2 === 1) this._hat(0.055, st === 15, (st % 4 === 1 ? -0.3 : 0.3));
                // Funky octave synth-bass
                this._osc(root * (st % 2 ? 2 : 1), 0.10, 'sawtooth', 0.11, { cutoff: 1350, cutoffEnd: 380, q: 2.5 });
                // Bouncy carnival organ riff
                const riff = [N.F5, 0, N.Ab5, N.F5, 0, N.C5, N.Eb5, 0, N.F5, 0, N.Bb5, N.Ab5, N.G5, 0, N.Eb5, 0][st];
                if (riff) {
                    this._osc(riff, 0.12, 'square', 0.062, { cutoff: 2900, pan: -0.22 });
                    this._osc(riff * 0.5, 0.12, 'sawtooth', 0.045, { cutoff: 1800, pan: 0.22 });
                }
            } else if (this.mode === 'kitchen') {
                // 148 BPM French Bistro Accordion / Gypsy-Jazz Rush!
                this.timer = 0.101;
                const N = NOTE, st = s % 16, bar = Math.floor(s / 16) % 4;
                const bass = [N.D3, N.A2, N.G2, N.A2][bar];
                if (st % 4 === 0) this._kick(0.18, 130, 50, 0.12);
                if (st % 4 === 2) this._hat(0.055, false, 0.2);
                if (st % 2 === 0) this._osc(st % 4 === 0 ? bass : bass * 1.5, 0.11, 'triangle', 0.10);
                const mel = [N.D5, N.F5, N.A5, 0, N.G5, N.F5, N.E5, N.D5, N.E5, N.G5, N.Bb5, 0, N.A5, N.G5, N.F5, N.E5][st];
                if (mel) {
                    this._osc(mel, 0.10, 'sawtooth', 0.058, { cutoff: 2400, pan: -0.18 });
                    this._osc(mel * 1.005, 0.10, 'triangle', 0.045, { pan: 0.18 });
                }
            } else if (this.mode === 'skypirate') {
                // Swashbuckling 6/8 Sea-Shanty Brass & Fiddle Adventure!
                this.timer = 0.118;
                const N = NOTE, st = s % 24;
                const mel = [
                    N.D5, 0, N.D5, N.F5, N.G5, N.A5, N.A5, 0, N.G5, N.F5, N.E5, N.D5,
                    N.C5, 0, N.C5, N.E5, N.G5, N.E5, N.D5, 0, N.A4, N.D5, 0, 0
                ];
                const bass = [N.D2, 0, 0, N.A2, 0, 0, N.F2, 0, 0, N.C3, 0, 0, N.C2, 0, 0, N.G2, 0, 0, N.D2, 0, 0, N.A2, 0, 0];
                if (st % 6 === 0) this._kick(0.24, 135, 44, 0.18);
                if (st % 6 === 3) this._snare(0.15, 190, 0.12);
                if (mel[st]) {
                    this._osc(mel[st], 0.18, 'sawtooth', 0.072, { cutoff: 2600, pan: -0.15 });
                    this._osc(mel[st] * 0.5, 0.18, 'triangle', 0.05, { pan: 0.15 });
                }
                if (bass[st]) this._osc(bass[st], 0.28, 'sawtooth', 0.11, { cutoff: 720 });
            } else if (this.mode === 'toywar') {
                // Crisp 132 BPM Toy-Soldier Snare March & Fife Bugle!
                this.timer = 0.113;
                const N = NOTE, st = s % 16;
                if (st === 0 || st === 8) this._kick(0.22, 145, 52, 0.14);
                if (st === 4 || st === 12 || st === 14 || st === 15) this._snare(st >= 14 ? 0.10 : 0.18, 250, 0.10);
                const fife = [N.C5, 0, N.E5, N.G5, N.C6, 0, N.G5, 0, N.A5, N.G5, N.F5, N.E5, N.D5, 0, N.G5, 0][st];
                if (fife) this._osc(fife, 0.12, 'triangle', 0.078, { pan: Math.sin(s * 0.5) * 0.25 });
                if (st % 4 === 0) this._osc(st < 8 ? N.C3 : N.G2, 0.22, 'triangle', 0.11);
            } else if (this.mode === 'chess') {
                // Dramatic Gothic Harpsichord & Cathedral Strings Toccata
                this.timer = 0.115;
                const N = NOTE, st = s % 16, bar = Math.floor(s / 16) % 4;
                const arp = [
                    [N.D4, N.F4, N.A4, N.D5], [N.Bb3, N.D4, N.F4, N.Bb4],
                    [N.G3, N.Bb3, N.D4, N.G4], [N.A3, N.Cs4, N.E4, N.A4]
                ][bar];
                const f = arp[st % 4] * (st >= 8 ? 2 : 1);
                this._osc(f, 0.14, 'sawtooth', 0.052, { cutoff: 3400, cutoffEnd: 900, pan: (st % 4 - 1.5) * 0.22 });
                if (st === 0) {
                    this._supersaw(arp[0] * 0.5, 0.85, 0.042, 1400);
                    this._kick(0.20, 110, 42, 0.22);
                }
            } else if (this.mode === 'ghosts') {
                // Funky 124 BPM Ghost-Hunter Synth Bassline + Spooky Theremin Organ!
                this.timer = 0.121;
                const N = NOTE, st = s % 16;
                if (st % 4 === 0) this._kick(0.26, 150, 46, 0.18);
                if (st === 4 || st === 12) this._snare(0.17, 215, 0.13);
                if (st % 2 === 1) this._hat(0.05, st === 15, 0.2);
                const bass = [N.B2, N.B2, 0, N.B2, N.D3, 0, N.Cs3, 0, N.A2, N.A2, 0, N.A2, N.B2, 0, N.Fs2, 0][st];
                if (bass) this._osc(bass, 0.11, 'sawtooth', 0.13, { cutoff: 1450, cutoffEnd: 360, q: 3.0 });
                const spooky = [0, 0, N.Fs5, 0, 0, N.G5, 0, N.Fs5, 0, 0, N.E5, 0, N.D5, 0, N.Cs5, 0][st];
                if (spooky) this._osc(spooky, 0.24, 'sine', 0.068, { slideTo: spooky * 1.03, pan: Math.sin(s) * 0.35 });
            } else if (this.mode === 'colosseum') {
                // 136 BPM Imperial Gladiator War-Drums & Brass Fanfare
                this.timer = 0.110;
                const N = NOTE, st = s % 16, bar = Math.floor(s / 16) % 4;
                if (st === 0 || st === 3 || st === 6 || st === 8 || st === 12) this._kick(0.28, 120, 38, 0.24);
                if (st === 4 || st === 10 || st === 14) this._snare(0.16, 170, 0.15);
                const horn = [N.D4, 0, 0, N.D4, N.F4, 0, N.A4, 0, N.G4, 0, N.F4, N.E4, N.D4, 0, N.A3, 0][st];
                if (horn) {
                    this._osc(horn, 0.22, 'sawtooth', 0.08, { cutoff: 1900, pan: -0.18 });
                    this._osc(horn * 0.5, 0.24, 'sawtooth', 0.06, { cutoff: 950, pan: 0.18 });
                }
                if (st === 0) this._supersaw([N.D3, N.Bb2, N.C3, N.A2][bar], 0.8, 0.04, 1300);
            } else if (this.mode === 'orbital') {
                // Ethereal Zero-G Sci-Fi Ambient Arp & Pulse
                this.timer = 0.155;
                const N = NOTE, st = s % 16;
                const arp = [N.C4, N.G4, N.B4, N.D5, N.E5, N.D5, N.B4, N.G4, N.A3, N.E4, N.A4, N.C5, N.E5, N.C5, N.A4, N.E4];
                this._osc(arp[st], 0.32, 'sine', 0.065, { pan: Math.sin(s * 0.45) * 0.4 });
                if (st % 8 === 0) this._supersaw(st === 0 ? N.C3 : N.A2, 1.15, 0.035, 1100);
                if (st === 0 || st === 10) this._kick(0.16, 90, 36, 0.22);
            } else if (this.mode === 'abyssal') {
                // Deep-Sea Bioluminescent Sub-Sonar & Leviathan Pulse
                this.timer = 0.185;
                const N = NOTE, st = s % 16;
                if (st === 0) this._osc(N.D2, 1.4, 'sine', 0.16, { attack: 0.1 });
                if (st === 0 || st === 8) this._kick(0.20, 74, 30, 0.26);
                const ping = [N.A4, 0, 0, N.D5, 0, 0, N.F5, 0, N.E5, 0, 0, N.C5, 0, 0, N.A4, 0][st];
                if (ping) this._osc(ping, 0.42, 'triangle', 0.062, { pan: Math.cos(s * 0.5) * 0.4 });
            } else if (this.mode === 'jurassic') {
                // Rainforest Tribal Timpani & Adventure Brass
                this.timer = 0.125;
                const N = NOTE, st = s % 16;
                if (st === 0 || st === 6 || st === 8 || st === 11 || st === 14) this._kick(0.26, 130, 44, 0.20);
                if (st === 4 || st === 12) this._snare(0.14, 185, 0.12);
                const mel = [N.Bb4, N.A4, N.Bb4, 0, N.F4, 0, N.Eb4, 0, N.Bb4, N.A4, N.Bb4, 0, N.D5, 0, N.C5, 0][st];
                if (mel) this._osc(mel, 0.22, 'sawtooth', 0.072, { cutoff: 2100 });
            } else if (this.mode === 'castle') {
                // Medieval Siege War-Drums & Brass Battle March
                this.timer = 0.116;
                const N = NOTE, st = s % 16;
                if (st % 4 === 0 || st === 14) this._kick(0.28, 118, 38, 0.22);
                if (st === 4 || st === 12) this._snare(0.19, 190, 0.15);
                const mel = [N.E4, N.G4, N.A4, N.B4, N.B4, 0, N.A4, N.G4, N.E4, N.D4, N.E4, N.G4, N.Fs4, 0, N.E4, 0][st];
                if (mel) {
                    this._osc(mel, 0.18, 'sawtooth', 0.075, { cutoff: 2200, pan: -0.2 });
                    this._osc(mel * 0.5, 0.20, 'triangle', 0.08, { pan: 0.2 });
                }
            } else if (this.mode === 'cyberpunk') {
                // 160 BPM Outrun Synthwave Neon Highway!
                this.timer = 0.094;
                const N = NOTE, st = s % 16, bar = Math.floor(s / 16) % 4;
                const root = [N.A2, N.F2, N.C3, N.G2][bar];
                if (st % 4 === 0) this._kick(0.28, 165, 44, 0.18);
                if (st === 4 || st === 12) this._snare(0.20, 235, 0.14);
                if (st % 2 === 1) this._hat(0.055, st === 15, (st % 4 === 1 ? -0.3 : 0.3));
                this._osc(root * (st % 2 ? 2 : 1), 0.085, 'sawtooth', 0.12, { cutoff: 1700, cutoffEnd: 420, q: 2.6 });
                const lead = [N.A5, 0, N.E5, N.A5, N.C6, 0, N.B5, N.A5, N.G5, 0, N.E5, N.G5, N.A5, 0, N.E5, 0][st];
                if (lead) this._supersaw(lead, 0.13, 0.055, 3600);
            } else if (this.mode === 'pinball') {
                // 146 BPM Carnival Arcade Pinball Organ-Chiptune!
                this.timer = 0.103;
                const N = NOTE, st = s % 16, bar = Math.floor(s / 16) % 4;
                const root = [N.C3, N.F2, N.G2, N.C3][bar];
                if (st % 4 === 0) this._kick(0.22, 155, 50, 0.15);
                if (st === 4 || st === 12) this._snare(0.16, 230, 0.11);
                this._osc(root * (st % 2 ? 1.5 : 1), 0.09, 'triangle', 0.11);
                const mel = [N.C5, N.E5, N.G5, N.C6, N.A5, N.G5, N.E5, N.C5, N.D5, N.F5, N.A5, N.G5, N.E5, N.D5, N.C5, 0][st];
                if (mel) this._osc(mel, 0.10, 'square', 0.068, { cutoff: 3200, pan: (st % 4 - 1.5) * 0.22 });
            } else if (this.mode === 'contracts') {
                // Sleek Hitman / Noir Spy-Thriller Stealth Pulse
                const urgent = !!state.urgent;
                this.timer = urgent ? 0.118 : 0.155;
                const N = NOTE, st = s % 16;
                const bass = [N.E2, 0, 0, N.G2, 0, 0, N.A2, 0, N.Bb2, 0, N.A2, 0, N.G2, 0, N.Fs2, 0][st];
                if (bass) this._osc(bass, 0.26, 'triangle', 0.14);
                if (st === 0 || (urgent && st === 8)) this._kick(urgent ? 0.22 : 0.14, 95, 38, 0.20);
                if (st % 4 === 2) this._hat(urgent ? 0.055 : 0.032, false, (st % 8 === 2 ? -0.25 : 0.25));
                const noir = [0, 0, N.B4, 0, 0, N.C5, 0, 0, N.B4, 0, 0, N.G4, 0, 0, N.Fs4, 0][st];
                if (noir) this._osc(noir, 0.34, 'sine', 0.055, { pan: Math.sin(s * 0.4) * 0.35 });
            } else if (this.mode === 'range') {
                // 128 BPM Upbeat Tactical Firing-Range Groove
                this.timer = 0.117;
                const N = NOTE, st = s % 16, bar = Math.floor(s / 16) % 4;
                const root = [N.E2, N.E2, N.G2, N.A2][bar];
                if (st === 0 || st === 6 || st === 10) this._kick(0.24, 150, 48, 0.16);
                if (st === 4 || st === 12) this._snare(0.15, 210, 0.12);
                if (st % 2 === 1) this._hat(0.045, false, (st % 4 === 1 ? -0.2 : 0.2));
                this._osc(root * (st % 4 === 2 ? 1.5 : 1), 0.10, 'triangle', 0.11);
                const mel = [N.E4, 0, N.G4, N.A4, N.B4, 0, N.A4, N.G4, N.E4, 0, N.G4, N.B4, N.D5, 0, N.B4, N.A4][st];
                if (mel) this._osc(mel, 0.11, 'triangle', 0.068, { pan: (st % 4 - 1.5) * 0.18 });
            } else if (this.mode === 'western') {
                // Ennio-style High Noon Standoff -> Driving Showdown on Draw
                const draw = !!state.draw;
                this.timer = draw ? 0.105 : 0.185;
                const N = NOTE, st = s % 16;
                if (draw) {
                    if (st % 4 === 0 || st === 14) this._kick(0.26, 138, 42, 0.18);
                    if (st === 4 || st === 12) this._snare(0.18, 200, 0.13);
                    this._osc([N.D2, N.D2, N.F2, N.A2][Math.floor(st / 4)], 0.10, 'sawtooth', 0.10, { cutoff: 900 });
                    const gal = [N.D4, N.F4, N.A4, N.D5, N.C5, N.A4, N.F4, N.G4][st % 8];
                    this._osc(gal, 0.10, 'triangle', 0.075);
                } else {
                    if (st === 0) this._kick(0.16, 86, 36, 0.20);
                    if (st === 8) this._snare(0.07, 175, 0.08);
                    const bass = [N.D2, 0, 0, 0, N.A2, 0, 0, 0, N.D2, 0, 0, 0, N.F2, 0, N.G2, 0][st];
                    if (bass) this._osc(bass, 0.28, 'triangle', 0.13);
                    const whistle = [0, 0, N.A4, 0, N.D5, 0, 0, 0, N.A4, 0, N.C5, 0, N.G4, 0, 0, 0][st];
                    if (whistle) this._osc(whistle, 0.36, 'sine', 0.065, { pan: Math.sin(s * 0.25) * 0.25 });
                }
            } else if (this.mode === 'tactical') {
                // 136 BPM High-Energy CQB / Neon Synth-Action Pulse
                this.timer = 0.110;
                const N = NOTE, st = s % 16, bar = Math.floor(s / 16) % 4;
                const root = [N.E2, N.E2, N.G2, N.D2][bar];
                if (st % 4 === 0 || st === 14) this._kick(0.26, 148, 44, 0.18);
                if (st === 4 || st === 12) this._snare(0.18, 205, 0.13);
                if (st % 2 === 1) this._hat(0.05, false, (st % 4 === 1 ? -0.25 : 0.25));
                this._osc(root * (st % 4 === 2 ? 1.5 : 1), 0.10, 'sawtooth', 0.095, { cutoff: 950 });
                const stab = [N.E4, 0, N.B4, N.E5, 0, N.D5, N.B4, 0, N.G4, 0, N.A4, N.B4, 0, N.G4, N.Fs4, 0][st];
                if (stab) this._osc(stab, 0.10, 'triangle', 0.072, { pan: (st % 4 - 1.5) * 0.2 });
            }
        }

        _tickMario(sub, s) {
            const N = NOTE;
            if (sub === 'starman') {
                this.timer = 0.088;
                const mel = [N.C5, N.C5, N.C5, 0, N.C5, 0, N.C5, N.D5, N.C5, 0, N.B4, N.B4, N.B4, 0, N.B4, N.C5];
                const bass = [N.F3, N.C4, N.F3, N.C4, N.F3, N.C4, N.F3, N.C4, N.E3, N.B3, N.E3, N.B3, N.E3, N.B3, N.E3, N.B3];
                const st = s % 16;
                if (st % 4 === 0) this._kick(0.22, 160, 52, 0.14);
                if (st % 4 === 2) this._hat(0.06, false, 0);
                if (mel[st]) {
                    this._osc(mel[st], 0.08, 'square', 0.09, { pan: -0.2 });
                    this._osc(mel[st] * 1.25, 0.08, 'square', 0.055, { pan: 0.2 });
                }
                this._osc(bass[st], 0.085, 'triangle', 0.12);
                return;
            }
            if (sub === 'bowser') {
                this.timer = 0.102;
                const st = s % 16;
                const mel = [N.E4, N.E4, N.B4, N.E4, N.C5, N.B4, N.Bb4, N.A4, N.G4, N.Fs4, N.G4, N.A4, N.Bb4, N.B4, N.E5, N.Eb5];
                const bass = [N.E2, N.E2, N.E3, N.E2, N.C2, N.C3, N.B2, N.A2, N.G2, N.Fs2, N.G2, N.A2, N.Bb2, N.B2, N.E2, N.B2];
                if (st % 4 === 0 || st === 14) this._kick(0.28, 140, 40, 0.20);
                if (st === 4 || st === 12) this._snare(0.18, 185, 0.13);
                this._osc(mel[st], 0.095, 'sawtooth', 0.085, { cutoff: 2600, pan: -0.2 });
                this._osc(mel[st] * 0.5, 0.095, 'square', 0.055, { pan: 0.2 });
                this._osc(bass[st], 0.10, 'sawtooth', 0.12, { cutoff: 900 });
                return;
            }
            const sheets = {
                '1-1': {
                    t: 0.132,
                    mel: [N.E5, N.E5, 0, N.E5, 0, N.C5, N.E5, 0, N.G5, 0, 0, 0, N.G4, 0, 0, 0, N.C5, 0, 0, N.G4, 0, 0, N.E4, 0, 0, N.A4, 0, N.B4, 0, N.Bb4, N.A4, 0],
                    harm: [N.Fs4, N.Fs4, 0, N.Fs4, 0, N.E4, N.Fs4, 0, N.B4, 0, 0, 0, N.B3, 0, 0, 0, N.E4, 0, 0, N.C4, 0, 0, N.G3, 0, 0, N.C4, 0, N.D4, 0, N.Cs4, N.C4, 0],
                    bass: [N.D3, N.D3, 0, N.D3, 0, N.D3, N.D3, 0, N.G3, 0, 0, 0, N.G2, 0, 0, 0, N.G3, 0, 0, N.E3, 0, 0, N.C3, 0, 0, N.F3, 0, N.G3, 0, N.Fs3, N.F3, 0]
                },
                '1-2': {
                    t: 0.125,
                    mel: [N.C5, N.C6, N.A4, N.A5, N.Bb4, N.Bb5, 0, 0, N.C5, N.C6, N.A4, N.A5, N.Bb4, N.Bb5, 0, 0, N.F4, N.F5, N.D4, N.D5, N.Eb4, N.Eb5, 0, 0, N.Eb5, N.D5, N.Cs5, N.C5, N.Eb5, N.D5, N.Ab4, N.G4],
                    harm: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, N.A3, N.A4, N.F3, N.F4, N.G3, N.G4, 0, 0, N.G4, N.Fs4, N.F4, N.E4, N.G4, N.F4, N.C4, N.B3],
                    bass: [N.C3, 0, N.G2, 0, N.Bb2, 0, N.G2, 0, N.C3, 0, N.G2, 0, N.Bb2, 0, N.G2, 0, N.F2, 0, N.D2, 0, N.Eb2, 0, N.G2, 0, N.C3, 0, N.Ab2, 0, N.Bb2, 0, N.G2, 0]
                },
                '1-3': {
                    t: 0.122,
                    mel: [N.E5, 0, N.G5, N.C6, 0, N.A5, N.G5, 0, N.E5, N.C5, N.D5, N.E5, 0, N.D5, N.C5, 0, N.F5, 0, N.A5, N.C6, 0, N.B5, N.A5, N.G5, N.E5, N.G5, N.A5, N.G5, N.F5, N.E5, N.D5, 0],
                    harm: [N.C5, 0, N.E5, N.E5, 0, N.F5, N.E5, 0, N.C5, N.G4, N.B4, N.C5, 0, N.B4, N.G4, 0, N.A4, 0, N.C5, N.F5, 0, N.D5, N.C5, N.B4, N.C5, N.E5, N.F5, N.E5, N.D5, N.C5, N.B4, 0],
                    bass: [N.C3, N.G3, N.E3, N.G3, N.C3, N.F3, N.C3, N.G3, N.C3, N.G3, N.G2, N.G3, N.C3, N.G2, N.C3, 0, N.F2, N.C3, N.A2, N.C3, N.G2, N.D3, N.B2, N.G2, N.C3, N.E3, N.F3, N.C3, N.G2, N.A2, N.B2, N.G2]
                },
                '1-4': {
                    t: 0.108,
                    mel: [N.G4, N.Fs4, N.G4, N.Ab4, N.G4, N.Fs4, N.G4, N.Bb4, N.A4, N.Ab4, N.A4, N.Bb4, N.A4, N.Ab4, N.A4, N.C5, N.B4, N.Bb4, N.B4, N.C5, N.B4, N.Bb4, N.B4, N.D5, N.Cs5, N.C5, N.B4, N.Bb4, N.A4, N.Ab4, N.G4, N.Fs4],
                    harm: [N.Eb4, N.D4, N.Eb4, N.E4, N.Eb4, N.D4, N.Eb4, N.G4, N.F4, N.E4, N.F4, N.Fs4, N.F4, N.E4, N.F4, N.Ab4, N.G4, N.Fs4, N.G4, N.Ab4, N.G4, N.Fs4, N.G4, N.B4, N.Bb4, N.A4, N.Ab4, N.G4, N.Fs4, N.F4, N.E4, N.Eb4],
                    bass: [N.D2, 0, N.D3, 0, N.Eb2, 0, N.Eb3, 0, N.E2, 0, N.E3, 0, N.F2, 0, N.F3, 0, N.Fs2, 0, N.Fs3, 0, N.G2, 0, N.G3, 0, N.Ab2, 0, N.G2, 0, N.Fs2, 0, N.D2, 0]
                }
            };
            const sh = sheets[sub] || sheets['1-1'];
            this.timer = sh.t;
            const i = s % sh.mel.length;
            if (sh.mel[i]) this._osc(sh.mel[i], sh.t * 0.86, 'square', 0.075, { pan: -0.18 });
            if (sh.harm[i]) this._osc(sh.harm[i], sh.t * 0.86, 'square', 0.048, { pan: 0.22 });
            if (sh.bass[i]) this._osc(sh.bass[i], sh.t * 0.94, 'triangle', 0.115);
            if (i % 4 === 0) this._kick(0.14, 130, 48, 0.11);
            else if (i % 4 === 2) this._noise(0.035, 5200, 'highpass', 1.4, 0.04, 0, false);
        }

        /* ====================================================================
           BESPOKE MODE SOUND EFFECTS
        ==================================================================== */
        acidSpit() {
            const v = 0.94 + Math.random() * 0.12;
            this._osc(540 * v, 0.16, 'sawtooth', 0.16, { slideTo: 135, cutoff: 2100, cutoffEnd: 480, sfx: true });
            this._noise(0.19, 3100 * v, 'bandpass', 2.2, 0.24, 0, true);
            this._noise(0.08, 4600 * v, 'highpass', 1.4, 0.12, 0.12, true, 0.03);
        }
        acidSplash() {
            this._noise(0.34, 2400, 'bandpass', 1.7, 0.27, -0.15, true);
            this._noise(0.24, 3800, 'highpass', 1.2, 0.14, 0.18, true, 0.04);
            this._osc(260, 0.22, 'sine', 0.16, { slideTo: 65, sfx: true });
        }
        clawRend() {
            this._noise(0.14, 1750, 'bandpass', 1.2, 0.30, -0.28, true);
            this._noise(0.14, 2250, 'bandpass', 1.2, 0.27, 0.28, true, 0.048);
            this._osc(220, 0.16, 'sawtooth', 0.19, { slideTo: 64, cutoff: 1400, cutoffEnd: 320, sfx: true });
            this._kick(0.18, 125, 42, 0.12, true);
        }
        hordeRoar() {
            const v = 0.93 + Math.random() * 0.14;
            this._osc(96 * v, 0.56, 'sawtooth', 0.24, { slideTo: 48, cutoff: 820, cutoffEnd: 260, pan: -0.18, sfx: true });
            this._osc(144 * v, 0.50, 'sawtooth', 0.17, { slideTo: 70, cutoff: 1050, cutoffEnd: 340, pan: 0.18, sfx: true, delay: 0.04 });
            this._osc(62, 0.52, 'sine', 0.22, { slideTo: 34, sfx: true });
            this._noise(0.52, 480, 'lowpass', 1.1, 0.25, 0, true);
        }
        evolveSting() {
            [NOTE.D4, NOTE.F4, NOTE.A4, NOTE.D5, NOTE.F5].forEach((f, i) => {
                this._osc(f, 0.26, 'sawtooth', 0.13, { cutoff: 3400, cutoffEnd: 1100, pan: (i % 2 ? 0.22 : -0.22), sfx: true, delay: i * 0.065 });
            });
            this.hordeRoar();
        }
        wardenStep() {
            this._kick(0.34, 98, 30, 0.28, true);
            this._noise(0.14, 620, 'bandpass', 1.8, 0.18, 0, true);
            this._noise(0.08, 1450, 'bandpass', 2.2, 0.09, 0.15, true, 0.02);
        }
        spinTick(quarter) {
            const freqs = [587.3, 784.0, 987.8, 1318.5];
            const f = freqs[Math.min(3, quarter)];
            this._osc(f, 0.09, 'triangle', 0.14, { sfx: true });
            if (quarter >= 3) this._osc(f * 1.5, 0.18, 'sine', 0.12, { sfx: true, delay: 0.03 });
        }
        bouncePad() {
            this._osc(140, 0.36, 'sine', 0.25, { slideTo: 700, sfx: true });
            this._osc(280, 0.26, 'triangle', 0.12, { slideTo: 1120, sfx: true, delay: 0.03 });
            this._noise(0.24, 1900, 'bandpass', 1.4, 0.19, 0, true);
        }
        sniperKillcamBoom() {
            // Heavy sniper crack + sub-bass drop + brass shell clink + crowd cheer!
            this._noise(0.28, 1950, 'bandpass', 0.85, 0.40, 0, true);
            this._noise(0.14, 4200, 'highpass', 0.9, 0.20, 0, true);
            this._osc(132, 0.78, 'sine', 0.36, { slideTo: 28, sfx: true });
            [3450, 4120, 3890].forEach((f, i) => this._osc(f, 0.06, 'sine', 0.075, { sfx: true, delay: 0.32 + i * 0.09, pan: 0.4 }));
            [NOTE.E5, NOTE.B5, NOTE.E6].forEach((f, i) => this._osc(f, 0.28, 'sawtooth', 0.11, { cutoff: 3400, cutoffEnd: 1200, pan: (i - 1) * 0.22, sfx: true, delay: 0.08 + i * 0.07 }));
        }
        gongRicochet() {
            this._osc(880, 0.68, 'triangle', 0.22, { slideTo: 862, pan: -0.18, sfx: true });
            this._osc(1328, 0.54, 'sine', 0.16, { pan: 0.18, sfx: true });
            this._osc(2480, 0.18, 'sawtooth', 0.12, { slideTo: 920, cutoff: 3800, sfx: true });
            this._noise(0.06, 3600, 'highpass', 1.4, 0.14, 0, true);
        }
        marioCoin() {
            this._osc(NOTE.B5, 0.075, 'square', 0.13, { sfx: true });
            this._osc(NOTE.E6, 0.30, 'square', 0.13, { sfx: true, delay: 0.07 });
        }
        marioPowerup() {
            [NOTE.C4, NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.G5, NOTE.Ab4, NOTE.C5, NOTE.Eb5, NOTE.Ab5, NOTE.Eb5, NOTE.Bb4, NOTE.D5, NOTE.F5, NOTE.Bb5].forEach((f, i) => {
                this._osc(f, 0.065, 'square', 0.10, { sfx: true, delay: i * 0.042 });
            });
        }
        marioPipe() {
            [660, 510, 380, 250].forEach((f, i) => {
                this._osc(f, 0.085, 'square', 0.12, { sfx: true, delay: i * 0.075 });
                this._noise(0.05, 900, 'bandpass', 2.0, 0.08, 0, true, i * 0.075);
            });
        }
        marioBrickBreak() {
            this._kick(0.22, 160, 54, 0.12, true);
            this._noise(0.20, 1050, 'bandpass', 0.95, 0.29, 0, true);
            [320, 220, 150].forEach((f, i) => this._osc(f, 0.08, 'square', 0.12, { pan: (i - 1) * 0.25, sfx: true, delay: i * 0.04 }));
        }
        marioShellKick() {
            this._osc(220, 0.12, 'square', 0.16, { slideTo: 640, sfx: true });
            this._noise(0.06, 2200, 'bandpass', 1.6, 0.18, 0, true);
        }
        marioFlagpole() {
            [NOTE.G3, NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5, NOTE.Ab3, NOTE.C4, NOTE.Eb4, NOTE.Ab4, NOTE.C5, NOTE.Eb5, NOTE.Ab5, NOTE.Bb5, NOTE.C6].forEach((f, i) => {
                this._osc(f, i === 16 ? 0.55 : 0.09, 'square', 0.11, { sfx: true, delay: i * 0.065 });
            });
        }
        slingStretch() {
            this._osc(180, 0.14, 'sawtooth', 0.06, { slideTo: 245, cutoff: 700, sfx: true });
        }
        birdLaunch(kind = 0) {
            if (kind === 1) {
                // Chuck high-pitched zippy squawk
                this._osc(780, 0.16, 'triangle', 0.16, { slideTo: 1480, sfx: true });
                this._osc(1200, 0.12, 'sawtooth', 0.09, { slideTo: 620, cutoff: 2600, sfx: true, delay: 0.08 });
            } else if (kind === 2) {
                // Bomb deep grunt
                this._osc(260, 0.24, 'sawtooth', 0.19, { slideTo: 120, cutoff: 900, sfx: true });
                this._osc(120, 0.20, 'sine', 0.16, { slideTo: 56, sfx: true });
            } else if (kind === 3) {
                // Blues playful triple-chirp
                [980, 1240, 1520].forEach((f, i) => this._osc(f, 0.07, 'sine', 0.13, { slideTo: f * 1.2, pan: (i - 1) * 0.25, sfx: true, delay: i * 0.045 }));
            } else {
                // Red classic "WAAAH-HAA!" battle cry
                this._osc(540, 0.18, 'sawtooth', 0.15, { slideTo: 920, cutoff: 2200, sfx: true });
                this._osc(880, 0.16, 'triangle', 0.13, { slideTo: 480, sfx: true, delay: 0.12 });
            }
            this._noise(0.16, 980, 'bandpass', 1.15, 0.16, 0, true);
        }
        pigOink(king = false) {
            const base = king ? 132 : 220 + Math.random() * 60;
            this._osc(base, 0.12, 'sawtooth', 0.15, { slideTo: base * 1.45, cutoff: 950, sfx: true });
            this._osc(base * 1.35, 0.11, 'sawtooth', 0.12, { slideTo: base * 0.85, cutoff: 900, sfx: true, delay: 0.09 });
            this._noise(0.06, 650, 'bandpass', 1.8, 0.09, 0, true, 0.04);
        }
        woodBreak() {
            const v = 0.9 + Math.random() * 0.2;
            this._noise(0.15, 1180 * v, 'bandpass', 1.35, 0.26, -0.12, true);
            this._noise(0.09, 2400 * v, 'bandpass', 1.8, 0.14, 0.15, true, 0.03);
            this._osc(235 * v, 0.085, 'triangle', 0.14, { slideTo: 88, sfx: true });
        }
        ffVictory() {
            const N = NOTE;
            [[N.C5, 0.11, 0], [N.C5, 0.11, 0.12], [N.C5, 0.11, 0.24], [N.C5, 0.30, 0.36],
             [N.Ab4, 0.30, 0.70], [N.Bb4, 0.30, 1.04], [N.C5, 0.18, 1.38], [N.Bb4, 0.12, 1.58], [N.C5, 0.55, 1.72]].forEach(([f, d, t]) => {
                this._osc(f, d, 'sawtooth', 0.11, { cutoff: 3400, sfx: true, delay: t });
                this._osc(f * 0.5, d, 'triangle', 0.08, { sfx: true, delay: t });
            });
        }
        ffSpell(elem = 'fire') {
            if (elem === 'heal') {
                [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => this._osc(f, 0.26, 'sine', 0.13, { pan: (i - 1.5) * 0.18, sfx: true, delay: i * 0.055 }));
                this._osc(NOTE.C4, 0.38, 'triangle', 0.09, { sfx: true, delay: 0.04 });
            } else if (elem === 'ice') {
                [1480, 1960, 2480].forEach((f, i) => this._osc(f, 0.15, 'triangle', 0.12, { slideTo: f * 0.85, pan: (i - 1) * 0.22, sfx: true, delay: i * 0.04 }));
                this._noise(0.18, 4200, 'highpass', 1.3, 0.12, 0, true);
            } else if (elem === 'thunder') {
                this._noise(0.26, 3200, 'bandpass', 1.15, 0.32, 0, true);
                this._osc(880, 0.20, 'sawtooth', 0.16, { slideTo: 110, cutoff: 3200, cutoffEnd: 420, sfx: true });
                this._kick(0.24, 130, 38, 0.20, true);
            } else {
                this._noise(0.34, 980, 'bandpass', 1.3, 0.29, 0, true);
                this._osc(260, 0.28, 'sawtooth', 0.16, { slideTo: 90, cutoff: 1700, cutoffEnd: 380, sfx: true });
            }
        }
        ffLimit() {
            [NOTE.D4, NOTE.A4, NOTE.D5, NOTE.Fs5, NOTE.A5].forEach((f, i) => this._osc(f, 0.42, 'sawtooth', 0.12, { cutoff: 4200, sfx: true, delay: i * 0.045 }));
            this._kick(0.32, 140, 38, 0.28, true);
        }
        bunkerStamp(approve = true) {
            this._kick(0.24, 120, 48, 0.12, true);
            this._osc(approve ? NOTE.E5 : 190, 0.16, approve ? 'triangle' : 'sawtooth', 0.12, { slideTo: approve ? NOTE.A5 : 130, sfx: true, delay: 0.05 });
        }
        bunkerShutter() {
            this._noise(0.38, 520, 'bandpass', 1.8, 0.26, 0, true);
            this._osc(120, 0.36, 'sawtooth', 0.14, { slideTo: 65, cutoff: 600, sfx: true });
        }
        bunkerCough() {
            this._noise(0.11, 780, 'bandpass', 2.4, 0.22, 0, true);
            this._noise(0.14, 650, 'bandpass', 2.0, 0.20, 0, true, 0.13);
        }
        toyGiggle() {
            [880, 1175, 1046, 1397].forEach((f, i) => this._osc(f, 0.075, 'sine', 0.10, { slideTo: f * 1.12, sfx: true, delay: i * 0.065 }));
        }
        toySonar() {
            this._osc(580, 0.34, 'sine', 0.15, { slideTo: 1240, sfx: true });
            this._osc(1160, 0.28, 'triangle', 0.08, { sfx: true, delay: 0.06 });
        }
        toyBell() {
            this._osc(1568, 0.38, 'sine', 0.14, { sfx: true });
            this._osc(3136, 0.22, 'triangle', 0.08, { sfx: true });
        }
        kaijuRoar() {
            this._osc(92, 0.88, 'sawtooth', 0.28, { slideTo: 46, cutoff: 840, cutoffEnd: 240, pan: -0.2, sfx: true });
            this._osc(138, 0.76, 'sawtooth', 0.20, { slideTo: 62, cutoff: 1120, cutoffEnd: 320, pan: 0.2, sfx: true, delay: 0.05 });
            this._osc(58, 0.80, 'sine', 0.24, { slideTo: 29, sfx: true });
            this._noise(0.78, 420, 'lowpass', 1.2, 0.28, 0, true);
        }
        kaijuStep() {
            this._kick(0.32, 86, 26, 0.26, true);
            this._noise(0.14, 340, 'lowpass', 1.1, 0.18, 0, true);
        }
        bumperCrash(intensity = 1) {
            const v = Math.min(1.4, Math.max(0.5, intensity));
            this._kick(0.28 * v, 155, 48, 0.18, true);
            this._osc(260, 0.15, 'triangle', 0.15 * v, { slideTo: 420, pan: -0.18, sfx: true });
            this._osc(520, 0.10, 'sine', 0.09 * v, { slideTo: 820, pan: 0.18, sfx: true });
            this._noise(0.13, 2400, 'bandpass', 1.7, 0.20 * v, 0, true);
        }
        derbyZap() {
            this._osc(920, 0.18, 'sawtooth', 0.14, { slideTo: 240, cutoff: 2800, sfx: true });
            this._noise(0.14, 4200, 'highpass', 1.4, 0.16, 0, true);
        }
        kitchenSizzle() {
            this._noise(0.28, 3800, 'bandpass', 1.2, 0.18, 0, true);
        }
        kitchenBell() {
            this._osc(1760, 0.42, 'sine', 0.16, { sfx: true });
            this._osc(3520, 0.26, 'triangle', 0.09, { sfx: true });
        }
        cannonBoom() {
            this._kick(0.38, 112, 26, 0.36, true);
            this._noise(0.45, 680, 'lowpass', 1.05, 0.34, 0, true);
            this._noise(0.18, 1900, 'bandpass', 0.9, 0.20, 0, true);
        }
        bugleCall() {
            [NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5].forEach((f, i) => this._osc(f, 0.14, 'sawtooth', 0.11, { cutoff: 2800, sfx: true, delay: i * 0.08 }));
        }
        chessHorn() {
            [NOTE.D4, NOTE.A4, NOTE.D5].forEach((f, i) => this._osc(f, 0.32, 'sawtooth', 0.10, { cutoff: 2200, sfx: true, delay: i * 0.09 }));
        }
        trapSnap() {
            this._osc(280, 0.22, 'sawtooth', 0.16, { slideTo: 880, cutoff: 2600, sfx: true });
            this._kick(0.25, 160, 52, 0.14, true);
            this._osc(NOTE.E5, 0.28, 'triangle', 0.13, { sfx: true, delay: 0.12 });
        }
        plasmaWeld() {
            this._noise(0.26, 3600, 'bandpass', 1.8, 0.22, 0, true);
            this._osc(620, 0.24, 'triangle', 0.14, { slideTo: 1240, sfx: true });
        }
        sonarPing() {
            this._osc(1046, 0.55, 'sine', 0.18, { sfx: true });
            this._osc(2093, 0.35, 'triangle', 0.07, { sfx: true, delay: 0.06 });
        }
        ballistaTwang() {
            this._osc(180, 0.22, 'sawtooth', 0.18, { slideTo: 72, cutoff: 1400, sfx: true });
            this._noise(0.14, 1800, 'bandpass', 1.5, 0.20, 0, true);
        }
        katanaSlash() {
            const v = 0.94 + Math.random() * 0.12;
            this._noise(0.16, 4800 * v, 'highpass', 1.15, 0.25, -0.2, true);
            this._noise(0.08, 2200 * v, 'bandpass', 1.4, 0.16, 0.2, true, 0.03);
            this._osc(1320 * v, 0.15, 'sawtooth', 0.14, { slideTo: 270, cutoff: 3400, cutoffEnd: 780, sfx: true });
        }
        pinballBumper() {
            this._osc(784, 0.09, 'square', 0.12, { slideTo: 1175, sfx: true });
            this._osc(1568, 0.10, 'triangle', 0.10, { sfx: true, delay: 0.03 });
        }
        pinballJackpot() {
            [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6].forEach((f, i) => {
                this._osc(f, 0.18, 'square', 0.12, { sfx: true, delay: i * 0.055 });
            });
        }
        steelPing(pitch = 1) {
            const v = pitch * (0.96 + Math.random() * 0.08);
            this._noise(0.05, 4200, 'bandpass', 1.6, 0.16, 0, true);
            this._osc(1480 * v, 0.26, 'triangle', 0.15, { pan: -0.14, sfx: true });
            this._osc(2960 * v, 0.20, 'sine', 0.085, { pan: 0.14, sfx: true, delay: 0.01 });
            this._osc(4420 * v, 0.11, 'sine', 0.045, { sfx: true, delay: 0.015 });
        }
        westernBell() {
            this._noise(0.04, 2900, 'bandpass', 1.9, 0.12, 0, true);
            this._osc(620, 0.74, 'sine', 0.19, { pan: -0.12, sfx: true });
            this._osc(1240, 0.56, 'triangle', 0.10, { pan: 0.12, sfx: true, delay: 0.01 });
            this._osc(930, 0.46, 'sine', 0.065, { sfx: true, delay: 0.015 });
        }
    }

    BO.MinigameAudio = new MinigameAudioEngine();
})(window.BO);
