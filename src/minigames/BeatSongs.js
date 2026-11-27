/* ============================================================================
   BLACKOUT OPS — MINIGAMES: Beat Drop song book
   ----------------------------------------------------------------------------
   Eleven live-synthesised songs (the original + ten new ones, difficulty 1–10)
   and four play modes (Easy, Medium, Hard, Hell). Everything here is pure data
   plus three functions used by the Beat Drop course in TargetCoursesC.js:

     BO.BeatSongs.get(id)                  → song
     BO.BeatSongs.chart(song, mode)        → deterministic note list
     BO.BeatSongs.playStep(bus, song, step, t) → schedules one 16th of audio
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    /* ------------------------------------------------------------ pitch helpers */
    const NOTE = { C: -9, 'C#': -8, Db: -8, D: -7, 'D#': -6, Eb: -6, E: -5, F: -4, 'F#': -3, Gb: -3, G: -2, 'G#': -1, Ab: -1, A: 0, 'A#': 1, Bb: 1, B: 2 };
    const hz = (semi) => 440 * Math.pow(2, semi / 12);
    /** 'Am', 'F', 'C#m', 'Bb7' → { root (bass, octave 2), tones (octave 3) } */
    function chord(name) {
        const m = /^([A-G][#b]?)(m?)(7?)$/.exec(name);
        const r = NOTE[m[1]];
        const third = m[2] ? 3 : 4;
        const semis = [0, third, 7];
        if (m[3]) semis[2] = 10;
        const base = r <= -3 ? r + 12 : r;            // keep pads around A3..F#4
        return { root: hz(base - 24), tones: semis.map((s) => hz(base - 12 + s)) };
    }
    function scale(key, minor) {
        const r = NOTE[key];
        const steps = minor ? [0, 3, 5, 7, 10, 12, 15] : [0, 2, 4, 7, 9, 12, 14];
        const base = r < -2 ? r + 12 : r;
        return steps.map((s) => hz(base + s));
    }

    /* ----------------------------------------------------------------- songs */
    // drums: four | half | shuffle | break | trap | march | dnb
    const SONGS = [
        {
            id: 'original', name: 'Beat Drop', artist: 'House band', diff: 5, bpm: 120, drums: 'four',
            chords: ['Am', 'F', 'C', 'G'], key: 'A', minor: true, lead: 'square', bass: 'sawtooth',
            hook: [4, -1, 3, 4, -1, 2, 3, -1, 2, -1, 1, 2, -1, 0, 1, -1, 4, -1, 3, 4, -1, 5, 6, -1, 5, 4, 3, -1, 2, -1, 1, -1],
            desc: 'The house track. Steady four-on-the-floor at 120 BPM.'
        },
        {
            id: 'sunday_drift', name: 'Sunday Drift', artist: 'Lowtide', diff: 1, bpm: 88, drums: 'half',
            chords: ['C', 'G', 'Am', 'F'], key: 'C', minor: false, lead: 'sine', bass: 'triangle',
            hook: [0, -1, -1, 2, -1, -1, 4, -1, 3, -1, -1, 2, -1, -1, 0, -1, 0, -1, -1, 2, -1, -1, 4, -1, 5, -1, 4, -1, 2, -1, -1, -1],
            desc: 'Lazy half-time groove at 88 BPM. Wide gaps, big targets.'
        },
        {
            id: 'paper_lanterns', name: 'Paper Lanterns', artist: 'Kite Season', diff: 2, bpm: 96, drums: 'four',
            chords: ['G', 'Em', 'C', 'D'], key: 'G', minor: false, lead: 'triangle', bass: 'triangle',
            hook: [2, -1, 4, -1, 2, -1, 1, -1, 0, -1, 1, -1, 2, -1, -1, -1, 4, -1, 5, -1, 4, -1, 2, -1, 1, -1, 2, -1, 0, -1, -1, -1],
            desc: 'A gentle walk at 96 BPM. Notes land on the beat.'
        },
        {
            id: 'harbor_lights', name: 'Harbor Lights', artist: 'Saltline', diff: 3, bpm: 104, drums: 'shuffle', swing: 0.16,
            chords: ['Dm', 'Bb', 'F', 'C'], key: 'D', minor: true, lead: 'triangle', bass: 'sawtooth',
            hook: [0, -1, 2, 3, -1, 2, 0, -1, 4, -1, 3, -1, 2, -1, -1, -1, 0, -1, 2, 3, -1, 4, 5, -1, 4, -1, 2, -1, 0, -1, -1, -1],
            desc: 'A swung shuffle at 104 BPM. Off-beats lean late.'
        },
        {
            id: 'copper_circuit', name: 'Copper Circuit', artist: 'Ohm Choir', diff: 4, bpm: 112, drums: 'four',
            chords: ['Em', 'C', 'G', 'D'], key: 'E', minor: true, lead: 'square', bass: 'square',
            hook: [0, 2, 3, -1, 3, 2, 0, -1, 4, -1, 3, 2, -1, 0, -1, -1, 0, 2, 3, -1, 5, 4, 3, -1, 2, -1, 3, -1, 0, -1, -1, -1],
            desc: 'Chiptune pulse at 112 BPM. First real off-beat runs.'
        },
        {
            id: 'glass_garden', name: 'Glass Garden', artist: 'Prism Hall', diff: 5, bpm: 118, drums: 'break',
            chords: ['F', 'C', 'Dm', 'Bb'], key: 'F', minor: false, lead: 'sine', bass: 'sawtooth',
            hook: [4, -1, 5, 4, 2, -1, 0, -1, 1, -1, 2, -1, 4, -1, -1, -1, 4, -1, 5, 6, 5, -1, 4, -1, 2, -1, 1, -1, 0, -1, -1, -1],
            desc: 'Bright breakbeat at 118 BPM with ghost snares.'
        },
        {
            id: 'midnight_relay', name: 'Midnight Relay', artist: 'Courier Nine', diff: 6, bpm: 126, drums: 'four',
            chords: ['Bm', 'G', 'D', 'A'], key: 'B', minor: true, lead: 'sawtooth', bass: 'sawtooth',
            hook: [0, -1, 0, 2, -1, 3, -1, 2, 4, -1, 3, -1, 2, 0, -1, -1, 0, -1, 0, 2, -1, 3, 4, 5, 4, -1, 3, -1, 2, -1, 0, -1],
            desc: 'Driving night-drive house at 126 BPM. Busy choruses.'
        },
        {
            id: 'static_bloom', name: 'Static Bloom', artist: 'Null Petal', diff: 7, bpm: 136, drums: 'trap',
            chords: ['C#m', 'A', 'E', 'B'], key: 'C#', minor: true, lead: 'square', bass: 'sine',
            hook: [3, -1, -1, 3, 4, -1, 3, -1, 2, -1, 0, -1, 2, 3, -1, -1, 3, -1, -1, 3, 5, -1, 4, 3, 2, -1, 3, -1, 0, -1, -1, -1],
            desc: 'Trap hats and syncopated kicks at 136 BPM. Expect bursts.'
        },
        {
            id: 'ironclad_parade', name: 'Ironclad Parade', artist: 'Brass Engine', diff: 8, bpm: 144, drums: 'march',
            chords: ['Bb', 'F', 'Gm', 'Eb'], key: 'Bb', minor: false, lead: 'sawtooth', bass: 'square',
            hook: [0, 0, 2, -1, 4, -1, 2, 0, 5, -1, 4, -1, 2, -1, 0, -1, 0, 0, 2, -1, 4, -1, 5, 6, 5, -1, 4, 2, 0, -1, -1, -1],
            desc: 'A double-time march at 144 BPM with snare rolls.'
        },
        {
            id: 'voltage_storm', name: 'Voltage Storm', artist: 'Arc Riot', diff: 9, bpm: 160, drums: 'dnb',
            chords: ['F#m', 'D', 'A', 'E'], key: 'F#', minor: true, lead: 'sawtooth', bass: 'sawtooth',
            hook: [0, 2, 3, 2, 0, -1, 4, 3, 2, -1, 0, 2, 3, -1, 2, -1, 0, 2, 3, 4, 5, -1, 4, 3, 2, 3, 2, 0, -1, 0, -1, -1],
            desc: 'Drum and bass at 160 BPM. Fast jumps across the wall.'
        },
        {
            id: 'overclock_inferno', name: 'Overclock Inferno', artist: 'Red Line', diff: 10, bpm: 174, drums: 'dnb',
            chords: ['Am', 'G', 'F', 'E'], key: 'A', minor: true, lead: 'square', bass: 'sawtooth',
            hook: [4, 3, 4, 5, 4, 3, 2, 0, 2, 3, 2, 0, 1, 0, -1, 0, 4, 3, 4, 5, 6, 5, 4, 3, 2, 3, 4, 2, 0, -1, 0, -1],
            desc: 'The final boss track. 174 BPM, no mercy.'
        }
    ];
    for (const s of SONGS) {
        s.chordsF = s.chords.map(chord);
        s.scaleF = scale(s.key, s.minor);
        s.beat = 60 / s.bpm;
        s.step = s.beat / 4;
        s.bars = Math.round(s.bpm / 4);                     // ≈ 60 seconds of music
        s.length = s.bars * s.beat * 4;
        s.secEnds = [4, Math.round(s.bars * 0.4), Math.round(s.bars * 0.667), Math.round(s.bars * 0.8)];
    }

    const MODES = {
        easy: { label: 'EASY', approach: 1.35, window: 1.45, radius: 0.75, walk: 1, desc: 'On the beat only, slow rings, big discs, generous timing.' },
        medium: { label: 'MEDIUM', approach: 1.0, window: 1.0, radius: 0.6, walk: 2, desc: 'The standard chart: beats plus some off-beats in the chorus.' },
        hard: { label: 'HARD', approach: 0.8, window: 0.85, radius: 0.52, walk: 3, desc: 'More off-beats, double notes, faster rings, tighter timing.' },
        hell: { label: 'HELL', approach: 0.62, window: 0.7, radius: 0.45, walk: 3, drift: true, desc: '16th-note bursts, triples, drifting discs and razor timing.' }
    };

    function section(song, bar) {
        const e = song.secEnds;
        return bar < e[0] ? 'intro' : bar < e[1] ? 'verse' : bar < e[2] ? 'chorus' : bar < e[3] ? 'break' : 'finale';
    }

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

    const XS = [-6, -4, -2, 0, 2, 4, 6];
    const YS = [1.5, 2.7, 3.9, 5.1];

    /**
     * Builds the note chart for a song in a mode. Deterministic: the same song and mode
     * always produce the same chart. Notes: { t, x, y, sec, ci, approach, radius, drift }.
     */
    function chart(song, modeId) {
        const mode = MODES[modeId] || MODES.medium;
        const rng = mulberry32(hashStr('beat:' + song.id + ':' + modeId));
        const d = song.diff;
        const p8c = 0.1 + d * 0.035, p8f = 0.15 + d * 0.05;
        const approach = mode.approach * (1.1 - d * 0.02);
        const notes = [];
        let col = 3, row = 1;
        const lastAt = {};
        const push = (t, sec, slot, extra) => {
            const w = mode.walk;
            col = Math.max(0, Math.min(6, col + Math.floor(rng() * (w * 2 + 1)) - w));
            row = Math.max(0, Math.min(3, row + Math.floor(rng() * 3) - 1));
            const n = { t, x: XS[col], y: YS[row], sec, ci: slot % 5, approach: sec === 'finale' ? approach * 0.88 : approach, radius: mode.radius * (sec === 'finale' ? 0.88 : 1), drift: mode.drift ? (rng() - 0.5) * 2.4 : 0 };
            notes.push(Object.assign(n, extra || {}));
            lastAt[col + ':' + row] = t;
            return n;
        };
        const sixteenths = song.bars * 16;
        for (let st = 16; st < sixteenths - 6; st++) {              // 16th-note grid, first bar is a lead-in
            const t = st * song.step;
            const bar = Math.floor(st / 16);
            const sec = section(song, bar);
            const s = st % 16;
            const beat = s % 4 === 0, eighth = s % 2 === 0;
            let want = false;
            if (modeId === 'easy') {
                const every = d <= 3 ? 8 : d <= 7 ? (sec === 'chorus' || sec === 'finale' ? 4 : 8) : 4;
                want = sec === 'intro' || sec === 'break' ? s % 8 === 0 && (st / 8) % 2 === 0 : s % every === 0;
            } else if (modeId === 'medium') {
                if (sec === 'intro' || sec === 'break') want = s % 8 === 0;
                else if (sec === 'verse') want = beat;
                else if (sec === 'chorus') want = beat || (eighth && rng() < p8c);
                else want = beat || (eighth && rng() < p8f);
            } else if (modeId === 'hard') {
                if (sec === 'intro' || sec === 'break') want = beat && s % 8 === 0 || (beat && rng() < 0.4);
                else if (sec === 'verse') want = beat || (eighth && rng() < p8c * 0.7);
                else if (sec === 'chorus') want = beat || (eighth && rng() < p8c + 0.2);
                else want = eighth && (beat || rng() < p8f + 0.25);
            } else {
                if (sec === 'intro') want = beat;
                else if (sec === 'break') want = eighth && (beat || rng() < 0.3);
                else if (sec === 'verse') want = eighth && (beat || rng() < 0.5 + d * 0.03);
                else want = eighth || (rng() < 0.12 + d * 0.02);       // 16th bursts in chorus + finale
            }
            if (!want) continue;
            push(t, sec, st);
            // doubles / triples: a second disc at the mirrored column
            const pDouble = modeId === 'medium' ? (sec === 'finale' && beat ? 0.18 : 0) : modeId === 'hard' ? (beat && sec !== 'intro' ? 0.12 + d * 0.01 : 0) : modeId === 'hell' ? (beat ? 0.25 : 0.06) : 0;
            if (pDouble && rng() < pDouble) {
                const last = notes[notes.length - 1];
                const mx = -last.x || (rng() < 0.5 ? -4 : 4);
                const my = YS[3 - YS.indexOf(last.y)];
                notes.push(Object.assign({}, last, { x: mx, y: my, ci: (last.ci + 2) % 5, drift: -last.drift }));
                if (modeId === 'hell' && sec === 'finale' && rng() < 0.3) notes.push(Object.assign({}, last, { x: 0, y: YS[(YS.indexOf(last.y) + 2) % 4], ci: (last.ci + 3) % 5, drift: 0 }));
            }
        }
        return notes;
    }

    /** Star thresholds scale with the chart's note count (original Medium keeps its legacy numbers). */
    const LEGACY_STARS = [15000, 35000, 60000, 85000];
    const PER_NOTE = [83, 194, 333, 472];
    const starCache = new Map();
    function stars(song, modeId) {
        if (song.id === 'original' && modeId === 'medium') return LEGACY_STARS;
        const k = song.id + ':' + modeId;
        if (!starCache.has(k)) {
            const n = chart(song, modeId).length;
            starCache.set(k, PER_NOTE.map((f) => Math.max(500, Math.round(n * f / 500) * 500)));
        }
        return starCache.get(k);
    }

    /* ----------------------------------------------------------------- synth */
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
        let f = null;
        let node = o;
        if (lp) {
            f = ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.value = lp;
            f.Q.value = 2;
            o.connect(f);
            node = f;
        }
        node.connect(g);
        g.connect(bus.layers[layer]);
        o.onended = () => { o.disconnect(); f?.disconnect(); g.disconnect(); };
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
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + Math.min(0.003, dur * 0.15));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f); f.connect(g); g.connect(bus.layers[layer]);
        src.onended = () => { src.disconnect(); f.disconnect(); g.disconnect(); };
        src.start(t, Math.random() * 0.5);
        src.stop(t + dur + 0.02);
    }

    const kick = (bus, t, v = 0.95) => {
        bOsc(bus, 'drums', t, 158, 40, 0.32, 'sine', v);
        bOsc(bus, 'drums', t, 240, 72, 0.075, 'triangle', 0.28 * v, 1400);
        bNoise(bus, 'drums', t, 0.022, 2600, 'bandpass', 0.20 * v);
    };
    const snare = (bus, t, v = 0.34) => {
        bNoise(bus, 'drums', t, 0.16, 2050, 'bandpass', v);
        bNoise(bus, 'drums', t, 0.09, 4400, 'highpass', 0.38 * v);
        bOsc(bus, 'drums', t, 215, 138, 0.105, 'triangle', v * 0.48, 2200);
    };
    const hat = (bus, t, v = 0.14, open) => bNoise(bus, 'drums', t, open ? 0.14 : 0.05, 8500, 'highpass', v);

    /** Drum pattern for one 16th step: returns [kick, snare, hat] intensities (0 = silent). */
    function drumHit(style, s, bar, swing) {
        switch (style) {
            case 'half': return [s === 0 || s === 10 ? 1 : 0, s === 8 ? 1 : 0, s % 4 === 2 ? 1 : 0];
            case 'shuffle': return [s === 0 || s === 8 || s === 11 ? 1 : 0, s === 4 || s === 12 ? 1 : 0, s % 4 === 0 || s % 4 === 3 ? 0.8 : 0];
            case 'break': return [s === 0 || s === 10 ? 1 : 0, s === 4 || s === 12 ? 1 : (s === 7 || s === 15 ? 0.3 : 0), 0.7];
            case 'trap': return [s === 0 || s === 7 || s === 11 ? 1 : 0, s === 8 ? 1 : 0, bar % 2 && s >= 12 ? 1.2 : (s % 2 === 0 ? 0.8 : 0)];
            case 'march': return [s === 0 || s === 8 ? 1 : 0, s === 4 || s === 12 ? 1 : (s >= 13 ? 0.45 : 0), s % 2 === 0 ? 0.6 : 0];
            case 'dnb': return [s === 0 || s === 10 ? 1 : 0, s === 4 || s === 12 ? 1 : (s === 7 || s === 9 ? 0.28 : 0), 0.75];
            default: return [s % 4 === 0 ? 1 : 0, s === 4 || s === 12 ? 1 : 0, s % 4 === 2 ? 1 : 0];
        }
    }

    /** Schedules one 16th-note step of a song at audio time t. */
    function playStep(bus, song, step, t) {
        const bar = Math.floor(step / 16);
        if (bar >= song.bars) {
            if (step === song.bars * 16) {
                for (const f of song.chordsF[0].tones) { bOsc(bus, 'drums', t, f, f, 2.4, 'triangle', 0.06); bOsc(bus, 'drums', t, f * 2, f * 2, 2.0, 'sine', 0.03); }
                bOsc(bus, 'drums', t, 150, 40, 0.5, 'sine', 0.9);
                bNoise(bus, 'drums', t, 1.6, 6000, 'highpass', 0.25);
            }
            return;
        }
        const s = step % 16;
        const sec = section(song, bar);
        const ch = song.chordsF[bar % song.chordsF.length];
        const breakLast = song.secEnds[3] - 1;
        if (song.swing && s % 2 === 1) t += song.step * song.swing;
        // drums
        const [k, sn, h] = drumHit(song.drums, s, bar, song.swing);
        if (sec === 'intro') { if (k && s % 8 === 0) kick(bus, t); if (bar === 3 && s >= 12) snare(bus, t); if (s % 4 === 2) hat(bus, t); }
        else if (sec === 'break') {
            if (bar === breakLast && s % 4 === 0) kick(bus, t);
            if (bar === breakLast && s >= 8 && s % 2 === 0) snare(bus, t, 0.12 + (s - 8) * 0.03);
            if (s % 4 === 2) hat(bus, t, 0.1);
        } else {
            if (k) kick(bus, t);
            if (sn) snare(bus, t, 0.34 * sn);
            if (h) hat(bus, t, (s % 2 ? 0.06 : 0.12) * h, song.drums === 'four' && s % 8 === 6 && sec === 'finale');
            if (song.drums === 'trap' && h > 1) hat(bus, t + song.step * 0.5, 0.07);
        }
        // bass (8ths with an octave bounce; held notes in the break)
        if (sec !== 'intro' && s % 2 === 0) {
            if (sec === 'break') { if (s === 0) bOsc(bus, 'bass', t, ch.root, ch.root, song.beat * 3.6, song.bass, 0.12, 420); }
            else {
                const f = ch.root * (s % 4 === 2 ? 2 : 1);
                bOsc(bus, 'bass', t, f, f, song.step * 1.7, song.bass, song.bass === 'sine' ? 0.3 : 0.15, 700);
            }
        }
        // chord pad once per bar (+ off-beat stabs in the chorus/finale)
        if (s === 0) for (const f of ch.tones) { bOsc(bus, 'chords', t, f, f, song.beat * 3.9, 'triangle', 0.045); bOsc(bus, 'chords', t, f * 1.004, f * 1.004, song.beat * 3.9, 'sawtooth', 0.012, 1600); }
        if ((sec === 'chorus' || sec === 'finale') && s % 4 === 2) for (const f of ch.tones) bOsc(bus, 'chords', t, f * 2, f * 2, 0.12, 'square', 0.014, 2600);
        // lead hook (8ths)
        if ((sec === 'verse' || sec === 'chorus' || sec === 'finale') && s % 2 === 0) {
            const n = song.hook[(bar % 4) * 8 + s / 2];
            if (n >= 0) {
                const f = song.scaleF[n] * (sec === 'verse' ? 0.5 : 1);
                const vol = song.lead === 'sine' ? 0.09 : song.lead === 'triangle' ? 0.08 : 0.05;
                bOsc(bus, 'lead', t, f, f, Math.min(0.26, song.beat * 0.45), song.lead, vol, 3200);
                bOsc(bus, 'lead', t, f * 2, f * 2, 0.14, 'sine', 0.02);
            }
        }
        // sparkle arpeggio (16ths)
        if (sec !== 'intro') {
            const f = ch.tones[s % 3] * 4;
            bOsc(bus, 'spark', t, f, f, 0.09, 'sine', 0.03);
        }
    }

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

    BO.BeatSongs = {
        SONGS, MODES,
        get(id) { return SONGS.find((s) => s.id === id) || SONGS[0]; },
        section, chart, stars, playStep, makeBus, bOsc, bNoise
    };
})(window);
