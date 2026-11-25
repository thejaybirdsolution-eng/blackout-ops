/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Target Practice courses 11–13
     11. Beat Drop       — rhythm shooting; your shots are notes, hits build the song
     12. One Mag         — 30 rounds, 30 targets, 31 seconds, no reload
     13. Outlaw Pursuit  — on horseback, bandits ride up behind, beside and ahead
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MG = BO.Minigames;
    const L = BO.MinigameLib;
    const A = BO.MinigameArt;
    const K = BO.MGCourseKit;
    const F = BO.MGFigures;
    const { B, SFX, std, basic, clamp01, Ease, TAU } = L;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lerp = (a, b, t) => a + (b - a) * t;
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    /* =====================================================================
       11. BEAT DROP — rhythm shooting
       The song is synthesised live. Drums always play; each on-time hit adds
       "groove", and groove unlocks the bass, chords, lead and sparkle layers.
    ===================================================================== */
    const BPM = 120, BEAT = 60 / BPM, STEP = BEAT / 4;
    const SONG_BARS = 30;
    const CHORDS = [
        { root: 110.00, tones: [220.00, 261.63, 329.63] },  // Am
        { root: 87.31, tones: [174.61, 220.00, 261.63] },   // F
        { root: 130.81, tones: [261.63, 329.63, 392.00] },  // C
        { root: 98.00, tones: [196.00, 246.94, 293.66] }    // G
    ];
    const PENTA = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const HOOK = [4, -1, 3, 4, -1, 2, 3, -1, 2, -1, 1, 2, -1, 0, 1, -1, 4, -1, 3, 4, -1, 5, 6, -1, 5, 4, 3, -1, 2, -1, 1, -1];
    const LAYERS = [
        { id: 'bass', at: 15, label: 'BASS IN' },
        { id: 'chords', at: 35, label: 'CHORDS IN' },
        { id: 'lead', at: 55, label: 'LEAD IN' },
        { id: 'spark', at: 80, label: 'FULL MIX!' }
    ];
    const NEON = [0x22d3ee, 0xf472b6, 0xfacc15, 0xa3e635, 0xa78bfa];
    const section = (bar) => bar < 4 ? 'intro' : bar < 12 ? 'verse' : bar < 20 ? 'chorus' : bar < 24 ? 'break' : 'finale';

    function makeBus() {
        const S = BO.Sound;
        const ctx = S && S.ensureContext ? S.ensureContext() : null;
        if (!ctx || !S.masterGain) return null;
        const out = ctx.createGain();
        out.gain.value = 0.85;
        out.connect(S.masterGain);
        const layers = {};
        for (const k of ['drums', 'bass', 'chords', 'lead', 'spark', 'fx']) {
            const g = ctx.createGain();
            g.gain.value = (k === 'drums' || k === 'fx') ? 1 : 0;
            g.connect(out);
            layers[k] = g;
        }
        return { ctx, out, layers, noise: S.noiseBuffer };
    }

    function bOsc(bus, layer, t, f1, f2, dur, type, vol, lp) {
        const { ctx } = bus;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f1, t);
        if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + Math.min(0.012, dur * 0.2));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        let node = o;
        if (lp) {
            const f = ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.value = lp;
            f.Q.value = 2;
            o.connect(f);
            node = f;
        }
        node.connect(g);
        g.connect(bus.layers[layer]);
        o.start(t);
        o.stop(t + dur + 0.03);
    }

    function bNoise(bus, layer, t, dur, freq, type, vol) {
        if (!bus.noise) return;
        const { ctx } = bus;
        const src = ctx.createBufferSource();
        src.buffer = bus.noise;
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f); f.connect(g); g.connect(bus.layers[layer]);
        src.start(t, Math.random() * 0.5);
        src.stop(t + dur + 0.02);
    }

    /** Schedules one 16th-note step of the song at audio time t. */
    function playStep(bus, step, t) {
        const bar = Math.floor(step / 16);
        if (bar >= SONG_BARS) {
            if (step === SONG_BARS * 16) {
                // final ringing chord
                for (const f of CHORDS[0].tones) { bOsc(bus, 'drums', t, f, f, 2.4, 'triangle', 0.06); bOsc(bus, 'drums', t, f * 2, f * 2, 2.0, 'sine', 0.03); }
                bOsc(bus, 'drums', t, 150, 40, 0.5, 'sine', 0.9);
                bNoise(bus, 'drums', t, 1.6, 6000, 'highpass', 0.25);
            }
            return;
        }
        const s = step % 16;
        const sec = section(bar);
        const ch = CHORDS[bar % 4];
        // drums
        const kick = sec === 'intro' ? s % 8 === 0 : sec === 'break' ? (bar === 23 && s % 4 === 0) : s % 4 === 0;
        if (kick) { bOsc(bus, 'drums', t, 155, 42, 0.32, 'sine', 0.95); bNoise(bus, 'drums', t, 0.02, 2500, 'bandpass', 0.18); }
        const snare = (sec !== 'intro' && sec !== 'break' && (s === 4 || s === 12)) || (bar === 23 && s >= 8 && s % 2 === 0) || (bar === 3 && s >= 12);
        if (snare) {
            const v = bar === 23 ? 0.12 + (s - 8) * 0.03 : 0.34;
            bNoise(bus, 'drums', t, 0.16, 1900, 'bandpass', v);
            bOsc(bus, 'drums', t, 220, 160, 0.1, 'triangle', v * 0.45);
        }
        if (s % 4 === 2) bNoise(bus, 'drums', t, 0.05, 8500, 'highpass', 0.14);
        else if ((sec === 'chorus' || sec === 'finale') && s % 2 === 1) bNoise(bus, 'drums', t, 0.025, 9500, 'highpass', 0.05);
        // bass (8ths, octave bounce)
        if (sec !== 'intro' && s % 2 === 0) {
            if (sec === 'break') { if (s === 0) bOsc(bus, 'bass', t, ch.root, ch.root, BEAT * 3.6, 'sawtooth', 0.12, 420); }
            else {
                const f = ch.root * (s % 4 === 2 ? 2 : 1);
                bOsc(bus, 'bass', t, f, f, STEP * 1.7, 'sawtooth', 0.15, 700);
            }
        }
        // chord pad, once per bar (+ offbeat stabs in the chorus)
        if (s === 0) for (const f of ch.tones) { bOsc(bus, 'chords', t, f, f, BEAT * 3.9, 'triangle', 0.045); bOsc(bus, 'chords', t, f * 1.004, f * 1.004, BEAT * 3.9, 'sawtooth', 0.012, 1600); }
        if ((sec === 'chorus' || sec === 'finale') && s % 4 === 2) for (const f of ch.tones) bOsc(bus, 'chords', t, f * 2, f * 2, 0.12, 'square', 0.014, 2600);
        // lead hook (8ths)
        if ((sec === 'verse' || sec === 'chorus' || sec === 'finale') && s % 2 === 0) {
            const n = HOOK[(bar % 4) * 8 + s / 2];
            if (n >= 0) {
                const f = PENTA[n] * (sec === 'verse' ? 0.5 : 1);
                bOsc(bus, 'lead', t, f, f, 0.22, 'square', 0.05, 3200);
                bOsc(bus, 'lead', t, f * 2, f * 2, 0.14, 'sine', 0.02);
            }
        }
        // sparkle arpeggio (16ths)
        if (sec !== 'intro') {
            const f = ch.tones[s % 3] * 4;
            bOsc(bus, 'spark', t, f, f, 0.09, 'sine', 0.03);
        }
    }

    function beatTarget(color, radius) {
        const grp = new THREE.Group();
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.08, 36), new THREE.MeshStandardMaterial({ color: 0x0b1020, emissive: color, emissiveIntensity: 0.85, roughness: 0.35 }));
        disc.rotation.x = Math.PI / 2;
        const core = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.38, 28), basic(0xffffff));
        core.position.z = 0.05;
        core.userData.noHit = true;
        const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.045, 8, 44), basic(color));
        rim.userData.noHit = true;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.04, 6, 52), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
        ring.userData.noHit = true;
        grp.add(disc, core, rim, ring);
        return { mesh: grp, hitMeshes: [disc], ring, disc };
    }

    MG.register({
        id: 'beat_drop', cat: 'target', order: 11,
        name: 'Beat Drop', icon: '🎵', accent: '#22d3ee',
        tagline: 'Shoot on the beat. Build the song.',
        desc: 'A neon stage and a live-synthesised track. Targets pop in time with the music, and a ring closes on each one. Fire as the ring meets the disc. Your gun plays notes instead of gunshots. Stay on time to build Groove, which brings in the bass, the chords, the lead and finally the full mix. Miss and the song falls apart.',
        hudSub: 'Fire when the ring meets the disc • on-time hits build the song',
        heroLabel: 'TARGET PRACTICE • RHYTHM • 60 SECONDS',
        duration: 61, stars: [15000, 35000, 60000, 85000], standardWeapon: 'p90', customMusic: true, forgivingMisses: true, infiniteMag: true,
        map: {
            atmosphere: { skyTop: 0x05010f, skyBottom: 0x1e0b3a, fogColor: 0x0d0420, fogDensity: 0.02, sunColor: 0xc4b5fd, sunIntensity: 0.4, sunPos: [0, 40, 20], hemiSky: 0x7c3aed, hemiGround: 0x0b0216, hemiIntensity: 0.7 },
            boxes: [B(0, -0.5, -10, 80, 1, 80, 'concrete')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        keys: [['LMB', 'Shoot (on the beat)'], ['R', 'Retry from results']],
        build(S) {
            S.data.songT = 0;
            S.data.groove = 0;
            S.data.level = 0;
            S.data.judge = { PERFECT: 0, GREAT: 0, GOOD: 0, OFF: 0, MISS: 0 };
            S.data.grooveTime = [0, 0, 0, 0, 0];
            // stage floor with a glowing grid
            const grid = L.canvasTex('beat-grid', 256, 256, (g, w, h) => {
                g.fillStyle = '#07030f'; g.fillRect(0, 0, w, h);
                g.strokeStyle = '#7c3aed'; g.lineWidth = 3;
                g.strokeRect(0, 0, w, h);
                g.strokeStyle = 'rgba(34,211,238,0.35)'; g.lineWidth = 1;
                g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
            });
            grid.wrapS = grid.wrapT = THREE.RepeatWrapping;
            grid.repeat.set(20, 20);
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: grid, emissive: 0xffffff, emissiveMap: grid, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.4 }));
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(0, 0.003, -10);
            S.add(floor);
            S.solid(floor);
            // DJ riser around the player
            S.box(0, 0.5, -1.0, 3.6, 1.0, 0.6, std(0x111827, 0.4, 0.5));
            const deckTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.04, 0.6), new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x22d3ee, emissiveIntensity: 0.3 }));
            deckTop.position.set(0, 1.02, -1.0);
            S.add(deckTop);
            for (const sx of [-0.9, 0.9]) {
                const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 24), std(0x1f2937, 0.3, 0.6));
                platter.position.set(sx, 1.05, -1.0);
                S.add(platter);
                S.animate((dt) => { platter.rotation.y += dt * 3.5; });
            }
            S.collider(-2.2, 0, -1.4, -1.8, 3, 2.5);
            S.collider(1.8, 0, -1.4, 2.2, 3, 2.5);
            S.collider(-2.2, 0, 2.1, 2.2, 3, 2.5);
            // back wall of LED panels
            const wall = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 0.4), std(0x0a0614, 0.6, 0.3));
            wall.position.set(0, 6, -18);
            S.add(wall);
            S.solid(wall);
            const panels = [];
            for (let x = -6; x <= 6; x++) {
                for (let y = 0; y < 5; y++) {
                    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ color: NEON[(x + y + 20) % NEON.length], transparent: true, opacity: 0.12 }));
                    p.position.set(x * 2.1, 1.6 + y * 2.1, -17.75);
                    S.add(p);
                    panels.push({ p, x, y });
                }
            }
            // equaliser bars along the stage lip
            const eq = [];
            for (let i = 0; i < 28; i++) {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), new THREE.MeshBasicMaterial({ color: NEON[i % NEON.length] }));
                bar.position.set(-13.5 + i, 0.5, -16.6);
                S.add(bar);
                eq.push(bar);
            }
            // speaker stacks
            for (const sx of [-12, 12]) {
                for (let j = 0; j < 3; j++) {
                    const spk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 1.6), std(0x111111, 0.7));
                    spk.position.set(sx, 0.9 + j * 1.85, -12);
                    S.add(spk);
                    const cone = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), std(0x27272a, 0.5));
                    cone.position.set(sx, 0.9 + j * 1.85, -11.19);
                    S.add(cone);
                    S.data.cones = S.data.cones || [];
                    S.data.cones.push(cone);
                }
            }
            // sweeping light beams
            const beams = [];
            for (let i = 0; i < 6; i++) {
                const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 16, 18, 1, true), new THREE.MeshBasicMaterial({ color: NEON[i % NEON.length], transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
                cone.geometry.translate(0, -8, 0);
                const holder = new THREE.Group();
                holder.position.set(-12.5 + i * 5, 11, -15);
                holder.add(cone);
                S.add(holder);
                beams.push({ holder, ph: i * 1.1 });
            }
            const truss = new THREE.Mesh(new THREE.BoxGeometry(28, 0.4, 0.4), std(0x9ca3af, 0.4, 0.8));
            truss.position.set(0, 11.2, -15);
            S.add(truss);
            const title = A.sign('BEAT DROP', 6, 1.2, { bg: '#0b0216', color: '#f0abfc', borderColor: '#22d3ee', glow: '#f0abfc', size: 0.6 });
            title.position.set(0, 12.4, -17.7);
            S.add(title);
            // stage animation driven by the song clock
            const rnd = L.mulberry32(5);
            const eqH = eq.map(() => rnd());
            S.animate(() => {
                const st = S.data.songT;
                const ph = (st % BEAT) / BEAT;
                const pulse = Math.exp(-ph * 5);
                const lvl = S.data.level;
                const bar = Math.floor(st / (BEAT * 4));
                for (let i = 0; i < eq.length; i++) {
                    const k = Math.abs(Math.sin(st * (2 + eqH[i] * 5) + i * 0.7));
                    const h = 0.3 + k * (1.2 + lvl * 0.8) + pulse * (1 + lvl * 0.6);
                    eq[i].scale.y = h;
                    eq[i].position.y = h / 2;
                }
                for (const pp of panels) {
                    const wave = Math.sin(st * 3 + pp.x * 0.6 + pp.y * 0.9 + bar);
                    pp.p.material.opacity = 0.08 + Math.max(0, wave) * 0.12 * (1 + lvl) * 0.5 + pulse * 0.1 * lvl;
                }
                for (const b of beams) {
                    b.holder.rotation.z = Math.sin(st * 0.9 + b.ph) * 0.7;
                    b.holder.rotation.x = Math.cos(st * 0.7 + b.ph) * 0.35 + 0.25;
                    b.holder.children[0].material.opacity = 0.04 + lvl * 0.025 + pulse * 0.04;
                }
                if (S.data.cones) for (const c of S.data.cones) c.scale.setScalar(1 + pulse * 0.12);
                deckTop.material.emissiveIntensity = 0.2 + pulse * 0.6;
            });
        },
        schedule(S) {
            const rng = S.rng;
            let col = 3, row = 1;
            const xs = [-6, -4, -2, 0, 2, 4, 6];
            const ys = [1.5, 2.7, 3.9, 5.1];
            const notes = [];
            for (let slot = 4; slot < SONG_BARS * 8 - 3; slot++) {   // slot = 8th note
                const t = slot * BEAT / 2;
                const bar = Math.floor(slot / 8);
                const sec = section(bar);
                const onBeat = slot % 2 === 0;
                let want = false;
                if (sec === 'intro') want = slot % 4 === 0;
                else if (sec === 'verse') want = onBeat;
                else if (sec === 'chorus') want = onBeat || rng() < 0.28;
                else if (sec === 'break') want = slot % 4 === 0;
                else want = onBeat || rng() < 0.42;
                if (!want) continue;
                col = BO.Math.clamp(col + Math.floor(rng() * 5) - 2, 0, 6);
                row = BO.Math.clamp(row + Math.floor(rng() * 3) - 1, 0, 3);
                notes.push({ t, x: xs[col], y: ys[row], sec, c: NEON[(slot >> 1) % NEON.length] });
                if (sec === 'finale' && onBeat && rng() < 0.18) notes.push({ t, x: -xs[col] || 4, y: ys[3 - row], sec, c: NEON[((slot >> 1) + 2) % NEON.length] });
            }
            S.data.noteCount = notes.length;
            for (const n of notes) {
                const approach = n.sec === 'finale' ? 0.85 : 1.0;
                S.at(Math.max(0, n.t - approach), (S2) => {
                    const radius = n.sec === 'finale' ? 0.5 : 0.6;
                    const bt = beatTarget(n.c, radius);
                    const tg = S2.addTarget({
                        mesh: bt.mesh, hitMeshes: bt.hitMeshes, pos: V(n.x, n.y, -14), yaw: 0,
                        points: 100, appear: 'scale', vanish: 'scale', inT: 0.12, life: approach - 0.12 + 0.24, outT: 0.1,
                        death: 'pop', deathColor: n.c,
                        onTick: (t) => {
                            const left = t.hitT - S2.data.songT;
                            const k = clamp01(left / approach);
                            bt.ring.scale.setScalar(1 + k * 2.4);
                            bt.ring.material.opacity = 0.35 + (1 - k) * 0.6;
                            bt.disc.material.emissiveIntensity = 0.5 + (1 - k) * 0.9;
                        },
                        onExpire: () => {
                            S2.data.judge.MISS++;
                            S2.data.groove = Math.max(0, S2.data.groove - 12);
                        }
                    });
                    tg.hitT = n.t;
                });
            }
        },
        onGo(S) {
            S.data.bus = makeBus();
            if (S.data.bus) S.data.anchor = S.data.bus.ctx.currentTime + 0.03;
            S.data.nextStep = 0;
        },
        update(S, dt, lib, state) {
            const bus = S.data.bus;
            if (state === 'running' || state === 'finish') {
                if (bus) {
                    // audio clock is the master; re-anchor after a pause
                    const audioT = bus.ctx.currentTime - S.data.anchor;
                    if (Math.abs(audioT - S.t) > 0.12) S.data.anchor = bus.ctx.currentTime - S.t;
                    S.data.songT = S.t;
                    while (S.data.nextStep * STEP < S.t + 0.12) {
                        const when = Math.max(bus.ctx.currentTime, S.data.anchor + S.data.nextStep * STEP);
                        playStep(bus, S.data.nextStep, when);
                        S.data.nextStep++;
                    }
                } else S.data.songT = S.t;
                if (state === 'running') S.data.grooveTime[S.data.level] += dt;
            }
            // groove decays slowly; layers follow it
            if (state === 'running') S.data.groove = Math.max(0, S.data.groove - dt * 1.5);
            let level = 0;
            for (let i = 0; i < LAYERS.length; i++) if (S.data.groove >= LAYERS[i].at) level = i + 1;
            if (level !== S.data.level) {
                if (level > S.data.level) { MG.toast(LAYERS[level - 1].label, '#67e8f9'); }
                else MG.toast('LOSING THE GROOVE', '#f472b6');
                S.data.level = level;
                if (bus) {
                    const t = bus.ctx.currentTime;
                    LAYERS.forEach((ly, i) => bus.layers[ly.id].gain.setTargetAtTime(i < level ? 1 : 0, t, 0.25));
                }
            }
        },
        gunSound(S) {
            const bus = S && S.data.bus;
            if (!bus) { SFX.tone(880, 880, 0.12, 'triangle', 0.1); return true; }
            const bar = Math.floor(S.data.songT / (BEAT * 4));
            const ch = CHORDS[((bar % 4) + 4) % 4];
            const i = (S.shots * 7 + Math.floor(S.data.songT / BEAT)) % 3;
            const f = ch.tones[i] * 2;
            const t = bus.ctx.currentTime;
            bOsc(bus, 'fx', t, f, f, 0.32, 'triangle', 0.13);
            bOsc(bus, 'fx', t, f * 2, f * 2, 0.18, 'sine', 0.05);
            bNoise(bus, 'fx', t, 0.03, 7000, 'highpass', 0.08);
            return true;
        },
        onShot(S) {
            // a shot that hits nothing costs a little groove (resolved after the ray test)
            S.data.lastShotHits = S.hits;
            setTimeout(() => { if (MG.session === S && S.hits === S.data.lastShotHits) S.data.groove = Math.max(0, S.data.groove - 3); }, 0);
        },
        onHit(S, ent, info) {
            if (!ent.mgTarget || !ent.alive) return false;
            const d = S.data.songT - ent.hitT;
            const ad = Math.abs(d);
            let j, base, gr, col;
            if (ad <= 0.07) { j = 'PERFECT'; base = 300; gr = 9; col = '#67e8f9'; }
            else if (ad <= 0.13) { j = 'GREAT'; base = 200; gr = 6; col = '#a3e635'; }
            else if (ad <= 0.22) { j = 'GOOD'; base = 100; gr = 3; col = '#fde68a'; }
            else { j = 'OFF'; base = 40; gr = 0; col = '#f9a8d4'; }
            S.data.judge[j]++;
            S.data.lastJudge = j === 'OFF' ? (d < 0 ? 'EARLY' : 'LATE') : j;
            S.data.lastJudgeT = performance.now();
            S.data.groove = Math.min(100, S.data.groove + gr);
            S.hits++;
            S.kills++;
            if (j !== 'OFF') S.bumpCombo(); else S.breakCombo(d < 0 ? 'EARLY' : 'LATE');
            const mult = S.comboMult;
            S.award(base * mult, info.pt, (j === 'OFF' ? S.data.lastJudge : j) + (mult > 1 ? ' x' + mult.toFixed(1).replace('.0', '') : ''), col);
            if (j === 'PERFECT' && S.data.bus) {
                const t = S.data.bus.ctx.currentTime;
                bOsc(S.data.bus, 'fx', t + 0.02, 1760, 1760, 0.25, 'sine', 0.05);
                bOsc(S.data.bus, 'fx', t + 0.07, 2637, 2637, 0.2, 'sine', 0.03);
            }
            ent.kill(info);
            return true;
        },
        hud(S) {
            const g = S.data.groove;
            const fresh = performance.now() - (S.data.lastJudgeT || 0) < 450;
            return `<div class="mgx-groove"><small>GROOVE</small><div class="mgx-groove-bar"><i style="width:${g.toFixed(0)}%"></i>${LAYERS.map((ly) => `<em style="left:${ly.at}%"></em>`).join('')}</div>
                <div class="mgx-layers"><span class="on">DRUMS</span>${LAYERS.map((ly, i) => `<span class="${i < S.data.level ? 'on' : ''}">${ly.id.toUpperCase()}</span>`).join('')}</div></div>
                ${fresh ? `<div class="mgx-judge mgx-j-${S.data.lastJudge}">${S.data.lastJudge}</div>` : ''}`;
        },
        dispose(S) {
            const bus = S.data.bus;
            if (bus) {
                try { bus.out.gain.setTargetAtTime(0, bus.ctx.currentTime, 0.08); setTimeout(() => { try { bus.out.disconnect(); } catch (e) { /* gone */ } }, 600); } catch (e) { /* ignore */ }
            }
        },
        result(S) {
            const stars = this.stars.filter((th) => S.score >= th).length;
            const j = S.data.judge;
            const total = S.data.noteCount || 1;
            const fullMix = S.data.grooveTime[4];
            return {
                score: S.score, stars,
                title: stars >= 4 ? 'PLATINUM RECORD' : stars === 3 ? 'GOLD RECORD' : stars === 2 ? 'SILVER' : stars === 1 ? 'BRONZE' : 'KEEP PRACTISING',
                stats: [
                    ['PERFECT', j.PERFECT], ['GREAT', j.GREAT], ['GOOD', j.GOOD],
                    ['MISSED', j.MISS + ' / ' + total], ['BEST STREAK', S.maxCombo], ['FULL MIX TIME', fullMix.toFixed(1) + 's']
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(120 + S.score * 0.02 + stars * 150)
            };
        }
    });

    /* =====================================================================
       12. ONE MAG — 30 rounds, 30 targets, 31 seconds
    ===================================================================== */
    const ONE_MAG_ROUNDS = 30;
    MG.register({
        id: 'one_mag', cat: 'target', order: 12,
        name: 'One Mag', icon: '🔂', accent: '#94a3b8',
        tagline: '30 rounds. 30 targets. 31 seconds. No reload.',
        desc: 'The purist trial. You get the Lone Star DMR: one magazine of 30 rounds, and it can only fire once every half second. Thirty steel plates appear, one after another, over 31 seconds. Every miss is a target you can no longer clear. They get smaller, further away and start to move. Hard.',
        hudSub: 'One magazine • one shot per 0.5s • every round counts',
        heroLabel: 'TARGET PRACTICE • CHALLENGE • 31 SECONDS',
        duration: 31, stars: [18, 24, 28, 30], starLabel: (th) => th + ' / 30',
        standardWeapon: 'mk14', lockWeapon: true, weaponLabel: 'LONE STAR DMR', weaponNote: '30 rounds • 1 shot / 0.5s • no reload',
        fireInterval: 0.5, noReload: true, ringScoring: true,
        formatBest: (b) => (b.extra && b.extra.hits !== undefined ? b.extra.hits + '/30 • ' : '') + Number(b.score).toLocaleString(),
        map: {
            atmosphere: { skyTop: 0x1e293b, skyBottom: 0xfb923c, fogColor: 0x9a6b4b, fogDensity: 0.008, sunColor: 0xffb070, sunIntensity: 1.5, sunPos: [-50, 14, -60], hemiSky: 0xfed7aa, hemiGround: 0x3b2f2a, hemiIntensity: 0.7 },
            boxes: [B(0, -0.5, -25, 140, 1, 140, 'desert_sand')],
            spawn: { x: 0, y: 0, z: 0, yaw: 0 }
        },
        keys: [['LMB', 'Fire (0.5s between shots)'], ['R', 'Retry from results']],
        build(S) {
            K.booth(S, { wood: 0x3f3f46, trim: 0x18181b, awning: '#475569' });
            const sign = A.sign('ONE MAG • NO RELOAD', 3.2, 0.5, { bg: '#0f172a', color: '#e2e8f0', borderColor: '#94a3b8', size: 0.5 });
            sign.position.set(0, 2.45, -1.42);
            S.add(sign);
            // berms and barricades at staggered distances
            for (const [x, z, w] of [[-9, -14, 4], [7, -18, 5], [-3, -26, 6], [11, -32, 4], [-12, -36, 5], [2, -42, 8]]) {
                const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, 0.9), std(0x7c6248, 1));
                b.position.set(x, 0.45, z);
                S.add(b);
                S.solid(b);
            }
            const berm = new THREE.Mesh(new THREE.BoxGeometry(70, 7, 4), std(0x8b6b45, 1));
            berm.position.set(0, 3.5, -52);
            S.add(berm);
            S.solid(berm);
            for (const [d, x] of [[10, -14], [20, 14], [30, -16], [40, 16]]) K.distanceSign(S, d + 'M', x, -d);
            for (let i = 0; i < 14; i++) {
                const r = A.rock(1 + (i % 3) * 0.6, 0x78716c);
                r.position.set((i % 2 ? 1 : -1) * (20 + (i * 7) % 15), 0.3, -8 - i * 3.3);
                S.add(r);
            }
            // round counter pips
            S.data.hitsByShot = [];
        },
        start(S) {
            const w = BO.Player.activeWeapon;
            if (w) { w.mag = ONE_MAG_ROUNDS; w.reserve = 0; }
        },
        onGo(S) { this.start(S); },
        schedule(S) {
            const rng = S.rng;
            const N = 30;
            for (let i = 0; i < N; i++) {
                const k = i / (N - 1);
                const at = 0.55 + i * 0.975 + (rng() - 0.5) * 0.25;
                const dist = lerp(10, 40, Math.min(1, k * 0.8 + rng() * 0.35));
                const x = (rng() - 0.5) * lerp(14, 26, k);
                const y = 0.9 + rng() * 2.2;
                const radius = lerp(0.5, 0.26, k) * (i % 5 === 4 ? 0.8 : 1);
                const life = lerp(2.6, 1.55, k);
                const mover = i >= 10 && rng() < 0.3 + k * 0.5;
                const amp = 1.4 + rng() * 2.5;
                const spd = lerp(1.0, 2.6, k) * (rng() < 0.5 ? 1 : -1);
                const ph = rng() * TAU;
                S.at(at, (S2) => {
                    const t = A.steelPlate(radius, i % 5 === 4 ? 0xfde68a : 0xd4d4d8);
                    const pos = V(x, y, -dist);
                    S2.addTarget(Object.assign(t, {
                        pos, yaw: A.yawTo(pos, V(0, 1.6, 0)), points: 1000, life, appear: 'flip', death: 'knock', deathColor: 0xe5e7eb,
                        motion: mover ? K.sweep(amp, spd, ph) : null,
                        onKill: () => SFX.ding(1 + (i % 4) * 0.08)
                    }));
                });
            }
        },
        update(S, dt, lib, state) {
            if (state !== 'running') return;
            const w = BO.Player.activeWeapon;
            const all = S.spawned >= 30 && !S.targets.some((t) => t.alive);
            if (all) MG.finish('ALL TARGETS', { color: '#e2e8f0' });
            else if (w && w.mag <= 0 && !MG.pendingShot) MG.finish('OUT OF AMMO', { color: '#fca5a5' });
        },
        hud(S) {
            const w = BO.Player.activeWeapon;
            const left = w ? Math.max(0, w.mag) : 0;
            let pips = '';
            for (let i = 0; i < ONE_MAG_ROUNDS; i++) pips += `<i class="${i < left ? 'live' : ''}"></i>`;
            return `<div class="mgx-mag"><small>LONE STAR • ${left} ROUNDS</small><div class="mgx-pips">${pips}</div><b>${S.kills} / 30 PLATES</b></div>`;
        },
        result(S) {
            const w = BO.Player.activeWeapon;
            const left = w ? Math.max(0, w.mag) : 0;
            const hits = S.kills;
            const stars = this.stars.filter((th) => hits >= th).length;
            const score = hits * 1000 + S.bullseyes * 250 + (hits === 30 ? 5000 : 0);
            return {
                score, stars, saveExtra: { hits },
                title: hits === 30 ? 'FLAWLESS MAGAZINE' : stars >= 3 ? 'GOLD' : stars === 2 ? 'SILVER' : stars === 1 ? 'BRONZE' : 'TRY AGAIN',
                stats: [
                    ['PLATES HIT', hits + ' / 30'], ['ROUNDS FIRED', S.shots], ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—'],
                    ['BULLSEYES', S.bullseyes], ['ROUNDS LEFT', left], ['PLATES MISSED', 30 - hits]
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(150 + hits * 25 + stars * 150)
            };
        }
    });

    /* =====================================================================
       13. OUTLAW PURSUIT — gallop through the desert, bandits close in
    ===================================================================== */
    const TRAIL_PTS = (() => {
        const pts = [];
        const N = 30;
        for (let i = 0; i < N; i++) {
            const a = i / N * TAU;
            const r = 125 + Math.sin(a * 3) * 22 + Math.cos(a * 5) * 9;
            pts.push(V(Math.cos(a) * r, 0, Math.sin(a) * r * 0.82));
        }
        return pts;
    })();

    function railFrame(R, s) {
        const u = (((s / R.len) % 1) + 1) % 1;
        const p = R.curve.getPointAt(u);
        const t = R.curve.getTangentAt(u);
        const side = V(t.z, 0, -t.x).normalize();   // right-hand side of travel
        return { p, t, side, yaw: Math.atan2(t.x, t.z) };
    }

    function ribbon(R, width, color, y, samples) {
        const pos = [];
        const idx = [];
        for (let i = 0; i <= samples; i++) {
            const f = railFrame(R, i / samples * R.len);
            const a = f.p.clone().addScaledVector(f.side, -width / 2);
            const b = f.p.clone().addScaledVector(f.side, width / 2);
            pos.push(a.x, y, a.z, b.x, y, b.z);
            if (i < samples) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.DoubleSide }));
        m.receiveShadow = true;
        return m;
    }

    const BANDIT_COATS = [0x5b3a1e, 0x1c1917, 0x78350f, 0xd6d3d1, 0x44403c, 0x9a3412];
    function makeBandit(rng, mounted) {
        const pick = (a) => a[Math.floor(rng() * a.length) % a.length];
        const rider = F.human({
            skin: pick(F.SKINS), shirt: pick([0x7f1d1d, 0x44403c, 0x1e3a8a, 0x713f12, 0x3f6212]), pants: pick([0x292524, 0x3f2a14, 0x1f2937]),
            coat: rng() < 0.5 ? pick([0x3f2a14, 0x1c1917, 0x57534e]) : null, hat: 'cowboy', hatColor: pick([0x1c1917, 0x3f2a14, 0x57534e, 0x0c0a09]),
            bandana: pick([0xb91c1c, 0x111827, 0x7f1d1d, 0x1e3a8a]), gun: 'revolver', eyes: 'angry'
        });
        if (!mounted) return { rider };
        const horse = F.horse({ coat: pick(BANDIT_COATS), mane: 0x0c0a09 });
        F.mount(horse, rider);
        return { rider, horse };
    }

    function banditFire(S, tg) {
        const P = BO.Player;
        const cam = BO.App && BO.App.worldCamera;
        const gun = tg.fig.rider.parts.gun;
        const from = new THREE.Vector3();
        if (gun) gun.getWorldPosition(from); else tg.root.getWorldPosition(from);
        const to = cam ? cam.position.clone().add(V((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.2)) : P.pos.clone();
        BO.FX.spawnTracer(from, to, 0xff7a3d, 0.03, 0.09);
        BO.FX.spawnParticles(from, 6, 0xfbbf24, 3, 2, 0.15, 0.6);
        SFX.noise(0.14, 1400, 'bandpass', 0.8, 0.42);
        SFX.tone(160, 70, 0.14, 'triangle', 0.18);
        S.data.hitsTaken = (S.data.hitsTaken || 0) + 1;
        const fwd = new THREE.Vector3();
        if (cam) { cam.getWorldDirection(fwd); S.award(-200, cam.position.clone().addScaledVector(fwd, 4), "YOU'RE HIT", '#f87171'); }
        S.breakCombo('SHOT BY A BANDIT');
        MG.flashScreen('rgba(220,38,38,0.32)');
        P.cameraShake = Math.max(P.cameraShake, 0.05);
    }

    MG.register({
        id: 'outlaw_pursuit', cat: 'target', order: 13,
        name: 'Outlaw Pursuit', icon: '🐎', accent: '#d97706',
        tagline: 'Ride hard. The gang is closing in.',
        desc: 'You are a lawman at full gallop across the desert, and the whole gang is after you. Riders close in from behind, pull up alongside, cut across the trail ahead and turn in the saddle to fire back. Look all around you. Any bandit left alive too long takes a shot at you. Snipers wait on the rocks.',
        hudSub: 'Look behind you! Bandits fire if you leave them alive',
        duration: 60, stars: [3500, 7000, 11000, 15500], standardWeapon: 'python_magnum', rail: true,
        map: {
            atmosphere: { skyTop: 0x1e3a8a, skyBottom: 0xfdba74, fogColor: 0xe7b98a, fogDensity: 0.0045, sunColor: 0xffc58a, sunIntensity: 1.8, sunPos: [-80, 30, -40], hemiSky: 0xfed7aa, hemiGround: 0x7c4a1e, hemiIntensity: 0.85 },
            boxes: [B(0, -0.5, 0, 460, 1, 460, 'desert_sand')],
            spawn: { x: TRAIL_PTS[0].x, y: 0, z: TRAIL_PTS[0].z, yaw: 0 }
        },
        build(S) {
            const R = K.rail(TRAIL_PTS, true, 0.5);
            S.data.rail = R;
            S.data.dist = 0;
            S.data.speed = 0;
            S.data.hitsTaken = 0;
            S.add(ribbon(R, 7, 0xb98a5a, 0.02, 400));
            S.add(ribbon(R, 3.2, 0xa47548, 0.03, 400));
            // your horse
            const mine = F.horse({ coat: 0xe7e5e4, mane: 0x44403c, saddle: 0x7c2d12 });
            mine.root.traverse((m) => { if (m.isMesh) m.castShadow = false; });
            S.add(mine.root);
            S.data.mine = mine;
            // scenery: cacti, mesas, rocks, telegraph poles, a ghost town
            const rnd = L.mulberry32(1849);
            const cactusMat = std(0x3f6212, 0.85);
            for (let i = 0; i < 110; i++) {
                const f = railFrame(R, rnd() * R.len);
                const off = (rnd() < 0.5 ? -1 : 1) * (9 + rnd() * 40);
                const c = new THREE.Group();
                const h = 2 + rnd() * 2.5;
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, h, 8), cactusMat);
                trunk.position.y = h / 2;
                c.add(trunk);
                for (const s of [-1, 1]) {
                    if (rnd() < 0.3) continue;
                    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.1, 7), cactusMat);
                    arm.position.set(s * 0.55, h * (0.45 + rnd() * 0.25) + 0.45, 0);
                    const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.55, 7), cactusMat);
                    elbow.rotation.z = Math.PI / 2;
                    elbow.position.set(s * 0.3, arm.position.y - 0.5, 0);
                    c.add(arm, elbow);
                }
                c.position.copy(f.p).addScaledVector(f.side, off);
                c.rotation.y = rnd() * TAU;
                S.add(c);
            }
            for (let i = 0; i < 26; i++) {
                const a = i / 26 * TAU + rnd() * 0.2;
                const r = 210 + rnd() * 25;
                const w = 18 + rnd() * 30, h = 14 + rnd() * 22;
                const mesa = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.75, w, h, 7), std(rnd() < 0.5 ? 0xb45309 : 0x9a3412, 1));
                mesa.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
                S.add(mesa);
            }
            for (let i = 0; i < 40; i++) {
                const f = railFrame(R, i / 40 * R.len);
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6, 6), std(0x57391c, 0.9));
                pole.position.copy(f.p).addScaledVector(f.side, -6.5).add(V(0, 3, 0));
                const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), std(0x57391c, 0.9));
                bar.position.set(0, 2.6, 0);
                bar.rotation.y = f.yaw + Math.PI / 2;
                pole.add(bar);
                S.add(pole);
            }
            // sniper rocks along the trail
            S.data.rocks = [];
            for (let i = 0; i < 9; i++) {
                const s = (i + 0.5) / 9 * R.len;
                const f = railFrame(R, s);
                const side = i % 2 ? 1 : -1;
                const p = f.p.clone().addScaledVector(f.side, side * 15);
                const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 0), std(0x9a6a44, 1));
                rock.scale.set(1.3, 0.7, 1.1);
                rock.position.set(p.x, 1.2, p.z);
                S.add(rock);
                S.solid(rock);
                S.data.rocks.push({ s, p: V(p.x, 3.25, p.z) });
            }
            // ghost town near the start/finish
            for (let i = 0; i < 6; i++) {
                const f = railFrame(R, R.len - 60 + i * 14);
                for (const side of [-1, 1]) {
                    const b = new THREE.Group();
                    const w = 5, h = 4 + (i % 3);
                    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), std([0x8b5a2b, 0x7c4a1e, 0xa16207][i % 3], 0.9));
                    body.position.y = h / 2;
                    const facade = new THREE.Mesh(new THREE.BoxGeometry(w, 1.5, 0.3), std(0x5b3a1e, 0.9));
                    facade.position.set(0, h + 0.6, 3);
                    const porch = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, 2), std(0x3f2a14, 0.9));
                    porch.position.set(0, 2.8, 3.8);
                    b.add(body, facade, porch);
                    b.position.copy(f.p).addScaledVector(f.side, side * 11);
                    b.rotation.y = f.yaw + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
                    S.add(b);
                }
            }
            // tumbleweeds
            for (let i = 0; i < 8; i++) {
                const tw = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), new THREE.MeshStandardMaterial({ color: 0xa16207, wireframe: true }));
                const f = railFrame(R, rnd() * R.len);
                tw.position.copy(f.p).addScaledVector(f.side, -30).add(V(0, 0.5, 0));
                S.add(tw);
                const dir = f.side.clone();
                const sp = 2 + rnd() * 3;
                let tt = rnd() * 10;
                S.animate((dt) => {
                    tt += dt;
                    tw.position.addScaledVector(dir, sp * dt);
                    tw.position.y = 0.5 + Math.abs(Math.sin(tt * 3)) * 0.6;
                    tw.rotation.x += dt * sp;
                    if (tt > 30) { tt = 0; tw.position.addScaledVector(dir, -sp * 30); }
                });
            }
            this.preUpdate(S, 0, L, 'countdown');
        },
        preUpdate(S, dt, lib, state) {
            const R = S.data.rail;
            if (!R) return;
            const run = state === 'running' || state === 'finish' || state === 'results';
            const want = state === 'running' ? 14.5 : state === 'countdown' ? 0 : 6;
            S.data.speed = lerp(S.data.speed, want, Math.min(1, dt * 1.2));
            S.data.dist += S.data.speed * dt;
            S.data.gph = (S.data.gph || 0) + dt * (2 + S.data.speed * 0.62);
            const amt = clamp01(S.data.speed / 10);
            const bob = Math.abs(Math.cos(S.data.gph)) * 0.16 * amt;
            const r = K.driveRail(S, R, S.data.dist, dt, { bank: 0.05, pitchFollow: 0, eye: 2.35 + bob });
            if (r && S.data.mine) {
                const m = S.data.mine;
                m.root.position.set(r.p.x, 0, r.p.z);
                m.root.rotation.y = Math.atan2(r.tan.x, r.tan.z);
                // sit just behind the saddle so the neck and head are in view
                m.root.position.addScaledVector(r.tan, -0.15);
                F.gallop(m, S.data.gph, amt);
            }
            if (run && amt > 0.4) {
                const step = Math.floor(S.data.gph / Math.PI);
                if (step !== S.data._hoof) {
                    S.data._hoof = step;
                    SFX.noise(0.06, 260, 'lowpass', 1, 0.3);
                    SFX.noise(0.05, 320, 'lowpass', 1, 0.22, 0.07);
                }
                BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.004 * amt);
            }
        },
        schedule(S) {
            K.ramp(S, { from: 2.5, to: 1.05, start: 1.2, end: 54.5, jitter: 0.3 }, (at, k, rng, i) => {
                const roll = rng();
                let kind;
                if (k < 0.2) kind = roll < 0.6 ? 'chase' : 'flank';
                else if (k < 0.5) kind = roll < 0.35 ? 'chase' : roll < 0.65 ? 'flank' : roll < 0.85 ? 'front' : 'ridge';
                else kind = roll < 0.25 ? 'chase' : roll < 0.5 ? 'flank' : roll < 0.7 ? 'front' : roll < 0.85 ? 'cutoff' : 'ridge';
                const side = rng() < 0.5 ? -1 : 1;
                const lat0 = (rng() - 0.5) * 4;
                const fuse = lerp(4.2, 2.6, k) + rng() * 1.2;
                const seed = Math.floor(rng() * 1e6);
                S.at(at, (S2) => spawnRider(S2, kind, side, lat0, fuse, seed, k));
            });
        },
        update(S, dt, lib, state) {
            // nothing extra; riders drive themselves
        },
        hud(S) {
            return S.data.hitsTaken ? `<div class="mgx-chip mgx-bad">TIMES SHOT: ${S.data.hitsTaken}</div>` : '';
        },
        result(S) {
            const stars = this.stars.filter((th) => S.score >= th).length;
            return {
                score: S.score, stars,
                title: stars >= 4 ? 'LEGEND OF THE WEST' : stars === 3 ? 'SHERIFF' : stars === 2 ? 'DEPUTY' : stars === 1 ? 'GREENHORN' : 'RIDE AGAIN',
                stats: [
                    ['ACCURACY', S.shots ? Math.round(S.shotHits / S.shots * 100) + '%' : '—'],
                    ['OUTLAWS DOWN', S.kills + ' / ' + S.spawned], ['HEADSHOTS', S.headshots],
                    ['BEST STREAK', S.maxCombo], ['GOT AWAY', S.expired], ['TIMES SHOT', S.data.hitsTaken || 0]
                ],
                accuracy: S.shots ? S.shotHits / S.shots : 0,
                xp: Math.round(120 + S.score * 0.06 + stars * 150)
            };
        }
    });

    function spawnRider(S, kind, side, lat0, fuse, seed, k) {
        const R = S.data.rail;
        const rng = L.mulberry32(seed);
        const mounted = kind !== 'ridge';
        const fig = makeBandit(rng, mounted);
        let rock = null;
        if (!mounted) {
            rock = S.data.rocks.find((r) => {
                const ahead = ((r.s - S.data.dist) % R.len + R.len) % R.len;
                return ahead > 35 && ahead < 110;
            });
            if (!rock) return;
        }
        const grp = new THREE.Group();
        grp.add(mounted ? fig.horse.root : fig.rider.root);
        F.pose(fig.rider, 'aimOne');
        const st = { t: 0, leaving: 0, fuse, gph: rng() * 6 };
        const place = (tg, dt) => {
            st.t += dt;
            if (!mounted) {
                tg.root.position.copy(rock.p);
                const cam = BO.App.worldCamera.position;
                tg.root.rotation.y = Math.atan2(cam.x - rock.p.x, cam.z - rock.p.z);
                return;
            }
            const t = st.t;
            let sOff, lat;
            if (kind === 'chase') { sOff = lerp(-34, -7, Ease.outCubic(clamp01(t / 3))) + Math.sin(t * 0.8) * 2; lat = lat0 + Math.sin(t * 1.3) * 1.3; }
            else if (kind === 'flank') { const e = Ease.outCubic(clamp01(t / 3.4)); sOff = lerp(-22, 0.6, e) + Math.sin(t * 0.9) * 1.6; lat = side * lerp(8, 3.4, e); }
            else if (kind === 'front') { sOff = lerp(46, 11, Ease.outCubic(clamp01(t / 4))) + Math.sin(t * 0.7) * 2; lat = lat0 + Math.sin(t * 1.1) * 1.6; }
            else { sOff = 22 - t * 1.5; lat = side * lerp(-16, 16, clamp01(t / 4.5)); }
            if (st.leaving > 0) { st.leaving += dt; sOff -= st.leaving * st.leaving * 4; lat += Math.sign(lat || 1) * st.leaving * 5; }
            const f = railFrame(R, S.data.dist + sOff);
            tg.root.position.copy(f.p).addScaledVector(f.side, lat);
            let yaw = f.yaw;
            if (kind === 'cutoff') yaw += side * 0.9;
            tg.root.rotation.y = yaw;
            st.gph += dt * 11;
            F.gallop(fig.horse, st.gph, 1);
            // twist in the saddle to aim at the player
            const cam = BO.App.worldCamera.position;
            const want = Math.atan2(cam.x - tg.root.position.x, cam.z - tg.root.position.z);
            fig.rider.parts.chest.rotation.y = BO.Math.clamp(wrapA(want - yaw), -2.4, 2.4);
            if (Math.random() < dt * 3) BO.FX.spawnParticles(tg.root.position.clone().add(V(0, 0.2, 0)), 2, 0xd6b370, 1.5, 1, 0.5, 1.4);
        };
        const tg = S.addTarget({
            mesh: grp, hitMeshes: fig.rider.hit, pos: V(0, -50, 0), points: 160, life: 0, appear: 'none', inT: 0.01,
            death: 'none', deathColor: 0xd6b370,
            onTick: (t, dt) => {
                place(t, dt);
                st.fuse -= dt;
                if (st.fuse <= 0 && st.leaving === 0 && MG.state === 'running') {
                    banditFire(S, t);
                    st.shots = (st.shots || 0) + 1;
                    st.fuse = 3.2;
                    if (st.shots >= 2 && mounted) st.leaving = 0.001;
                    if (st.shots >= 2 && !mounted) t.retire();
                }
                if (st.leaving > 2.2) t.retire();
            },
            onKill: (t) => {
                SFX.thunk();
                SFX.tone(420, 120, 0.25, 'sawtooth', 0.06);
                // rider tumbles off, horse bolts away
                const rider = fig.rider.root;
                S.scene.attach(rider);
                let vy = 2.5, tt = 0;
                const back = V(Math.sin(t.root.rotation.y), 0, Math.cos(t.root.rotation.y));
                S.animate((dt) => {
                    tt += dt;
                    vy -= 14 * dt;
                    rider.position.y = Math.max(0, rider.position.y + vy * dt);
                    rider.position.addScaledVector(back, -dt * 3);
                    rider.rotation.x = Math.max(-Math.PI / 2, rider.rotation.x - dt * 5);
                    if (tt > 2.5) { if (rider.parent) rider.parent.remove(rider); return false; }
                });
                if (mounted) {
                    const horse = fig.horse.root;
                    S.scene.attach(horse);
                    let ht = 0, hph = st.gph;
                    const dir = back.clone().applyAxisAngle(V(0, 1, 0), (Math.random() - 0.5) * 1.2);
                    horse.rotation.y = Math.atan2(dir.x, dir.z);
                    S.animate((dt) => {
                        ht += dt;
                        horse.position.addScaledVector(dir, dt * 15);
                        hph += dt * 12;
                        F.gallop(fig.horse, hph, 1);
                        if (ht > 2.5) { if (horse.parent) horse.parent.remove(horse); return false; }
                    });
                }
            }
        });
        tg.fig = fig;
        place(tg, 0);
        tg.root.updateMatrixWorld(true);
    }
})(window);
