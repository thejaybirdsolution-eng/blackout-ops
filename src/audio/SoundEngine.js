/* ============================================================================
   BLACKOUT OPS — Procedural Web Audio API DSP Synthesizer
   Zero external audio files required. Full COD-style weapon punch, hitmarkers,
   headshot crunches, reloads, footsteps, zombies audio, Mystery Box jingle,
   Perk fanfare, Pack-a-Punch chime, Killstreak radio & Tactical Nuke siren.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    // Low chamber tone, crack center, body length, bolt center, and overall weight.
    const SHOTS = {
        pistol: [112, 2950, 0.077, 3300, 0.72],
        deagle: [73, 1950, 0.172, 2550, 1.03],
        smg: [105, 3100, 0.066, 2900, 0.69],
        smg_heavy: [84, 2320, 0.093, 2700, 0.80],
        ar_light: [88, 2470, 0.102, 2600, 0.86],
        ar_heavy: [71, 1710, 0.138, 2340, 0.96],
        dmr: [81, 2850, 0.153, 3080, 0.98],
        lmg: [64, 1960, 0.142, 1750, 1.00],
        shotgun: [54, 1220, 0.233, 1980, 1.12],
        sniper: [61, 2860, 0.278, 2430, 1.14],
        launcher: [48, 740, 0.325, 1100, 1.06]
    };

    const GUN_DIR = 'sfx/Weapons & Combat/Gunshots - Single Shot/';
    const SCIFI_DIR = 'sfx/Sci-Fi Sounds (Kenney)/Audio/';
    const RPG_SFX_DIR = 'sfx/RPG Audio (Kenney)/Audio/';
    const IMPACT_SFX_DIR = 'sfx/Impact Sounds (Kenney)/Audio/';
    const DESERT_SFX_DIR = 'sfx/Gameplay Effects (Desert Shooter)/';

    const PISTOL_DIR = GUN_DIR + 'Pistols & Handguns (Single Shot)/';
    const SHOTGUN_DIR = GUN_DIR + 'Shotguns (Single Shot)/';
    const SNIPER_DIR = GUN_DIR + 'Sniper Rifles (Single Shot)/';
    const OTHER_GUN_DIR = GUN_DIR + 'Other Firearm SFX/';

    // Per-weapon-ID audio clips (Create-a-Class guns, Wonder Weapons, Launchers, Specials).
    const WEAPON_CLIPS = {
        // Pistols & Handguns
        m1911: PISTOL_DIR + '080 - Gun SFX M1911.mp3',
        deagle: PISTOL_DIR + 'desert eagle mw2 (2009) gunshot.mp3',
        gold_deagle_cod4: PISTOL_DIR + 'OG Modern Warfare 2 Deagle firing sound.mp3',
        glock18_auto: PISTOL_DIR + '050 - Gun SFX Glock.mp3',
        b23r_burst: PISTOL_DIR + '031 - Gun SFX Beretta.mp3',
        m9: PISTOL_DIR + '031 - Gun SFX Beretta.mp3',
        m93_raffica: OTHER_GUN_DIR + '076 - Gun SFX M93.mp3',
        python_magnum: PISTOL_DIR + '037 - Gun SFX Colt Python.mp3',
        magnum44: PISTOL_DIR + '101 - Gun SFX S And W M29.mp3',
        sw_m27: PISTOL_DIR + '100 - Gun SFX S And W M10 M And P.mp3',
        five_seven: PISTOL_DIR + '046 - Gun SFX Fn Five Seven N Usg.mp3',
        usp45: PISTOL_DIR + '035 - Gun SFX Colt 45.mp3',
        makarov: PISTOL_DIR + '094 - Gun SFX PPK.mp3',
        tt33: PISTOL_DIR + '079 - Gun SFX M1910.mp3',
        nambu: PISTOL_DIR + '091 - Gun SFX New Nambu 60.mp3',
        walther_p38: PISTOL_DIR + '093 - Gun SFX P99.mp3',
        cz75: PISTOL_DIR + '038 - Gun SFX Cze Cz75.mp3',
        asp: PISTOL_DIR + '052 - Gun SFX Glock G26.mp3',
        tmp: PISTOL_DIR + '039 - Gun SFX Dd Bren Ten.mp3',
        pp2000: PISTOL_DIR + '043 - Gun SFX Fn Browning Hi Power.mp3',

        // SMGs
        mp5: OTHER_GUN_DIR + '069 - Gun SFX M3.mp3',
        mp5_classic: OTHER_GUN_DIR + '069 - Gun SFX M3.mp3',
        ump45: PISTOL_DIR + '035 - Gun SFX Colt 45.mp3',
        p90: PISTOL_DIR + '046 - Gun SFX Fn Five Seven N Usg.mp3',
        mp7_navy: PISTOL_DIR + '052 - Gun SFX Glock G26.mp3',
        vector_kriss: PISTOL_DIR + '039 - Gun SFX Dd Bren Ten.mp3',
        aks74u: OTHER_GUN_DIR + '085 - Gun SFX Mauser C96.mp3',
        mac10_uzi: PISTOL_DIR + '107 - Gun SFX Sterling.mp3',
        mac11: PISTOL_DIR + '107 - Gun SFX Sterling.mp3',
        uzi: PISTOL_DIR + '107 - Gun SFX Sterling.mp3',
        mini_uzi: PISTOL_DIR + '107 - Gun SFX Sterling.mp3',
        thompson_m1: OTHER_GUN_DIR + '069 - Gun SFX M3.mp3',
        mp40: PISTOL_DIR + '107 - Gun SFX Sterling.mp3',

        // Assault & Marksman Rifles
        kar98k_irons: OTHER_GUN_DIR + '084 - Gun SFX Mauser 98k.mp3',
        springfield: OTHER_GUN_DIR + '084 - Gun SFX Mauser 98k.mp3',
        arisaka: OTHER_GUN_DIR + '084 - Gun SFX Mauser 98k.mp3',
        mosin_nagant: OTHER_GUN_DIR + '084 - Gun SFX Mauser 98k.mp3',
        m1_garand: SNIPER_DIR + '105 - Gun SFX Sniper Rifle M392.mp3',
        m14_classic: SNIPER_DIR + '105 - Gun SFX Sniper Rifle M392.mp3',
        mk14: SNIPER_DIR + '105 - Gun SFX Sniper Rifle M392.mp3',
        fal_osw: SNIPER_DIR + '105 - Gun SFX Sniper Rifle M392.mp3',
        g3: SNIPER_DIR + '105 - Gun SFX Sniper Rifle M392.mp3',
        svt40: SNIPER_DIR + '110 - Gun SFX T Svd Shot.mp3',
        gewehr43: OTHER_GUN_DIR + '084 - Gun SFX Mauser 98k.mp3',

        // Shotguns
        r870: SHOTGUN_DIR + '077 - Gun SFX M870.mp3',
        stakeout: SHOTGUN_DIR + '077 - Gun SFX M870.mp3',
        w1200: SHOTGUN_DIR + '078 - Gun SFX M1300.mp3',
        m1014_cod4: SHOTGUN_DIR + '078 - Gun SFX M1300.mp3',
        spas12_tac: SHOTGUN_DIR + '078 - Gun SFX M1300.mp3',
        trench_gun: SHOTGUN_DIR + '077 - Gun SFX M870.mp3',
        model_1887_mw2: SHOTGUN_DIR + '104 - Gun SFX Shotgun.mp3',
        double_barrel: SHOTGUN_DIR + '104 - Gun SFX Shotgun.mp3',
        sawed_off: SHOTGUN_DIR + '104 - Gun SFX Shotgun.mp3',
        ranger: SHOTGUN_DIR + '104 - Gun SFX Shotgun.mp3',
        aa12: SHOTGUN_DIR + '086 - Gun SFX Mm500.mp3',
        saiga12_k: SHOTGUN_DIR + '086 - Gun SFX Mm500.mp3',
        striker_12: SHOTGUN_DIR + '086 - Gun SFX Mm500.mp3',
        hs10: SHOTGUN_DIR + '086 - Gun SFX Mm500.mp3',
        ksg_slug: SHOTGUN_DIR + '087 - Gun SFX Mm500.mp3',

        // Snipers
        intervention: SNIPER_DIR + 'Intervention Sound mw2.mp3',
        barrett_50cal: SNIPER_DIR + '028 - Gun SFX Barrett M82 A1.mp3',
        ptrs41: SNIPER_DIR + '029 - Gun SFX Barrett50 Cal.mp3',
        l96a1_awm: SNIPER_DIR + '023 - Gun SFX Ai L96a1.mp3',
        r700_cod4: SNIPER_DIR + '097 - Gun SFX Remington M24.mp3',
        m40a3_cod4: SNIPER_DIR + '097 - Gun SFX Remington M24.mp3',
        msr_remington: SNIPER_DIR + '099 - Gun SFX Rsr.mp3',
        dragunov_svd: SNIPER_DIR + '110 - Gun SFX T Svd Shot.mp3',
        m21: SNIPER_DIR + '110 - Gun SFX T Svd Shot.mp3',
        m21_ebr: SNIPER_DIR + '110 - Gun SFX T Svd Shot.mp3',
        wa2000: SNIPER_DIR + '116 - Gun SFX Wa200.mp3',
        psg1: SNIPER_DIR + '027 - Gun SFX Barrett.mp3',

        // Launchers & Special Ballistics
        rpg7_warhead: DESERT_SFX_DIR + 'explosion-a.ogg',
        m9_bazooka: DESERT_SFX_DIR + 'explosion-b.ogg',
        panzerschreck: DESERT_SFX_DIR + 'explosion-c.ogg',
        at4: SCIFI_DIR + 'explosionCrunch_000.ogg',
        stinger: SCIFI_DIR + 'explosionCrunch_002.ogg',
        javelin: SCIFI_DIR + 'lowFrequency_explosion_001.ogg',
        thumper: DESERT_SFX_DIR + 'explosion-a.ogg',
        m72_law: DESERT_SFX_DIR + 'explosion-b.ogg',
        strela3: DESERT_SFX_DIR + 'explosion-c.ogg',
        china_lake: DESERT_SFX_DIR + 'explosion-a.ogg',
        crossbow: RPG_SFX_DIR + 'knifeSlice.ogg',
        ballistic_knife: RPG_SFX_DIR + 'drawKnife1.ogg',

        // Wonder / Magic Weapons (short, punchy sci-fi sounds — no long loops)
        raygun: SCIFI_DIR + 'laserRetro_000.ogg',
        raygun_mk2: SCIFI_DIR + 'laserRetro_002.ogg',
        tesla_wunder: SCIFI_DIR + 'laserLarge_000.ogg',
        zeus_cannon: SCIFI_DIR + 'lowFrequency_explosion_001.ogg',
        winters_howl_bo1: SCIFI_DIR + 'forceField_000.ogg',
        baby_gun_bo1: SCIFI_DIR + 'laserRetro_004.ogg',
        wave_gun_bo1: SCIFI_DIR + 'laserLarge_002.ogg',
        scavenger_bo1: SNIPER_DIR + '029 - Gun SFX Barrett50 Cal.mp3',
        blundergat_bo2: SCIFI_DIR + 'explosionCrunch_000.ogg',
        paralyzer_bo2: SCIFI_DIR + 'laserSmall_002.ogg',
        sliquifier_bo2: SCIFI_DIR + 'slime_000.ogg',
        void_singularity: SCIFI_DIR + 'forceField_002.ogg',
        inferno_drake: SCIFI_DIR + 'explosionCrunch_001.ogg',
        cryo_sceptre: SCIFI_DIR + 'forceField_001.ogg',
        solar_lance: SCIFI_DIR + 'laserLarge_003.ogg',
        apothicon_servant_bo3: SCIFI_DIR + 'lowFrequency_explosion_000.ogg',
        necro_skull: SCIFI_DIR + 'laserSmall_004.ogg',
        acid_hydra: SCIFI_DIR + 'slime_000.ogg',
        chrono_shatter: SCIFI_DIR + 'forceField_003.ogg',
        death_of_orion_bo4: SCIFI_DIR + 'laserLarge_004.ogg',
        alistairs_folly_bo4: PISTOL_DIR + 'MW-20 Bryar Pistol.mp3',
        megaman_buster: PISTOL_DIR + 'MW-20 Bryar Pistol 2.mp3'
    };

    // Fallback pools by soundProfile so every Create-a-Class & Classic gun has a real gunshot clip.
    const PROFILE_CLIPS = {
        pistol: [PISTOL_DIR + '050 - Gun SFX Glock.mp3', PISTOL_DIR + '093 - Gun SFX P99.mp3', PISTOL_DIR + '031 - Gun SFX Beretta.mp3', PISTOL_DIR + '080 - Gun SFX M1911.mp3'],
        deagle: [PISTOL_DIR + 'OG Modern Warfare 2 Deagle firing sound.mp3', PISTOL_DIR + 'desert eagle mw2 (2009) gunshot.mp3', PISTOL_DIR + '109 - Gun SFX Sw 500.mp3'],
        smg: [OTHER_GUN_DIR + '069 - Gun SFX M3.mp3', PISTOL_DIR + '107 - Gun SFX Sterling.mp3', OTHER_GUN_DIR + '076 - Gun SFX M93.mp3'],
        smg_heavy: [OTHER_GUN_DIR + '085 - Gun SFX Mauser C96.mp3', PISTOL_DIR + '039 - Gun SFX Dd Bren Ten.mp3'],
        ar_light: [PISTOL_DIR + '046 - Gun SFX Fn Five Seven N Usg.mp3', PISTOL_DIR + '035 - Gun SFX Colt 45.mp3', PISTOL_DIR + '043 - Gun SFX Fn Browning Hi Power.mp3'],
        ar_heavy: [OTHER_GUN_DIR + '084 - Gun SFX Mauser 98k.mp3', PISTOL_DIR + '040 - Gun SFX Desert.mp3', SNIPER_DIR + '105 - Gun SFX Sniper Rifle M392.mp3'],
        dmr: [SNIPER_DIR + '105 - Gun SFX Sniper Rifle M392.mp3', SNIPER_DIR + '110 - Gun SFX T Svd Shot.mp3', OTHER_GUN_DIR + '084 - Gun SFX Mauser 98k.mp3'],
        lmg: [SNIPER_DIR + '028 - Gun SFX Barrett M82 A1.mp3', PISTOL_DIR + '040 - Gun SFX Desert.mp3', OTHER_GUN_DIR + '084 - Gun SFX Mauser 98k.mp3'],
        shotgun: [SHOTGUN_DIR + '077 - Gun SFX M870.mp3', SHOTGUN_DIR + '078 - Gun SFX M1300.mp3', SHOTGUN_DIR + '086 - Gun SFX Mm500.mp3', SHOTGUN_DIR + '104 - Gun SFX Shotgun.mp3'],
        sniper: [SNIPER_DIR + '097 - Gun SFX Remington M24.mp3', SNIPER_DIR + '027 - Gun SFX Barrett.mp3', SNIPER_DIR + '023 - Gun SFX Ai L96a1.mp3', SNIPER_DIR + '099 - Gun SFX Rsr.mp3'],
        launcher: [DESERT_SFX_DIR + 'explosion-a.ogg', DESERT_SFX_DIR + 'explosion-b.ogg'],
        raygun: [SCIFI_DIR + 'laserRetro_000.ogg', SCIFI_DIR + 'laserSmall_001.ogg'],
        zeus: [SCIFI_DIR + 'lowFrequency_explosion_001.ogg', SCIFI_DIR + 'laserLarge_000.ogg']
    };

    const MELEE_CLIPS = {
        combat_knife: RPG_SFX_DIR + 'knifeSlice.ogg',
        tomahawk_axe: RPG_SFX_DIR + 'chop.ogg',
        riot_baton: SCIFI_DIR + 'laserSmall_000.ogg',
        machete_jungle: RPG_SFX_DIR + 'knifeSlice2.ogg',
        crowbar_heavy: IMPACT_SFX_DIR + 'impactMetal_heavy_001.ogg',
        trench_shovel: RPG_SFX_DIR + 'chop.ogg',
        katana_carbon: RPG_SFX_DIR + 'knifeSlice2.ogg',
        sledge_hammer: IMPACT_SFX_DIR + 'impactPunch_heavy_000.ogg',
        chainsaw_ripper: IMPACT_SFX_DIR + 'impactMining_000.ogg',
        reaper_scythe: RPG_SFX_DIR + 'knifeSlice.ogg'
    };

    const VOICE_LIMITS = { shot: [7, 0.09], vocal: [4, 0.18], impact: [5, 0.08], step: [5, 0.12] };
    const FOOTING = {
        metal: [1680, 0.12, 278],
        wood: [980, 0.085, 182],
        earth: [2500, 0.075, 76],
        masonry: [1210, 0.063, 113]
    };

    function surfaceFamily(material = '') {
        if (/wood|plank|crate|parquet|timber/i.test(material)) return 'wood';
        if (/steel|metal|plate|grate|rust|panel|container|tram|rail|catwalk/i.test(material)) return 'metal';
        if (/sand|dirt|mud|soil|snow|gravel|grass|ground|swamp/i.test(material)) return 'earth';
        return 'masonry';
    }

    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.masterGain = null;
            this.sfxGain = null;
            this.uiGain = null;
            this.musicGain = null;
            this.combatGain = null;
            this.worldVoiceTimes = { shot: [], vocal: [], impact: [], step: [] };
            this.resumePending = false;
            this.effectVoices = new Map();
            this._recentSfx = new Map();
            this.noiseBuffer = null;
            this.unlocked = false;
            this.musicTimer = null;
            this.musicMode = null;

            BO.Events.on('settings:changed', () => this.applyVolumes());
            if (typeof document !== 'undefined') {
                document.addEventListener('visibilitychange', () => this.applyVolumes(false));
            }
        }

        _canPlay(key, minGapMs = 25) {
            const now = performance.now();
            const prev = this._recentSfx.get(key) || 0;
            if (now - prev < minGapMs) return false;
            this._recentSfx.set(key, now);
            return true;
        }

        _hasClip(clip) {
            return !!(clip && BO.Assets?.playClip && (!BO.Assets.hasAudioBuffer || BO.Assets.hasAudioBuffer(clip)));
        }

        _tryClip(clip, opts, synthFallback) {
            if (clip && BO.Assets?.playClip) {
                if (!BO.Assets.hasAudioBuffer || BO.Assets.hasAudioBuffer(clip)) {
                    BO.Assets.playClip(clip, opts);
                    return true;
                }
                BO.Assets.loadAudioBuffer?.(clip);
            }
            if (synthFallback) synthFallback();
            return false;
        }

        ensureContext() {
            if (!this.ctx) {
                const AudioCtx = global.AudioContext || global.webkitAudioContext;
                if (!AudioCtx) return null;
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.sfxGain = this.ctx.createGain();
                this.uiGain = this.ctx.createGain();
                this.musicGain = this.ctx.createGain();
                this.combatGain = this.ctx.createGain();
                const combatDynamics = this._compressor(-19, 4, 0.003, 0.105);
                const effectsDynamics = this._compressor(-10, 5, 0.002, 0.095);
                const lowCut = this.ctx.createBiquadFilter();
                lowCut.type = 'highpass';
                lowCut.frequency.value = 29;
                lowCut.Q.value = 0.707;
                this.combatGain.connect(combatDynamics).connect(this.sfxGain);
                this.sfxGain.connect(lowCut).connect(effectsDynamics).connect(this.masterGain);
                this.uiGain.connect(this.masterGain);
                this.musicGain.connect(this.masterGain);
                // Pad the shaper input so it can soften peaks above full scale without hard clipping.
                const outputPad = this.ctx.createGain();
                outputPad.gain.value = 0.5;
                const outputCeiling = this.ctx.createWaveShaper();
                outputCeiling.curve = Float32Array.from({ length: 1025 }, (_, i) => {
                    const sample = (i / 512 - 1) * 2;
                    const level = Math.abs(sample);
                    return level <= 0.78 ? sample : Math.sign(sample) * (0.78 + 0.2 * Math.tanh((level - 0.78) / 0.2));
                });
                this.masterGain.connect(outputPad).connect(outputCeiling).connect(this.ctx.destination);
                this._buildNoiseBuffer();
                this.applyVolumes(true);
            }
            if (this.ctx.state === 'suspended' && !this.resumePending) {
                this.resumePending = true;
                this.ctx.resume().then(() => {
                    if (this.musicMode === 'menu' && this.menuBar === 0) this._playMenuBar();
                }).catch(() => {}).finally(() => { this.resumePending = false; });
            }
            this.unlocked = true;
            return this.ctx;
        }

        _compressor(threshold, ratio, attack, release) {
            const node = this.ctx.createDynamicsCompressor();
            node.threshold.value = threshold;
            node.knee.value = 14;
            node.ratio.value = ratio;
            node.attack.value = attack;
            node.release.value = release;
            return node;
        }

        applyVolumes(immediate = false) {
            const s = BO.Settings.all;
            const hiddenMute = (typeof document !== 'undefined' && document.hidden && s.muteWhenHidden !== false) ? 0 : 1;
            if (s.sfxMuted || hiddenMute === 0) global.speechSynthesis?.cancel();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const targets = [
                [this.masterGain.gain, (s.masterVolume ?? 0.8) * hiddenMute, 0.02],
                [this.sfxGain.gain, s.sfxMuted ? 0 : (s.sfxVolume ?? 0.85), 0.02],
                [this.uiGain ? this.uiGain.gain : this.sfxGain.gain, s.sfxMuted ? 0 : (s.uiVolume ?? 0.8), 0.02],
                [this.musicGain.gain, s.musicMuted ? 0 : (s.musicVolume ?? 0.55) * 0.45, 0.03]
            ];
            for (const [gain, value, ramp] of targets) {
                if (immediate) gain.value = value;
                else gain.setTargetAtTime(value, t, ramp);
            }
        }

        _buildNoiseBuffer() {
            const sr = this.ctx.sampleRate;
            const len = Math.floor(sr * 4);
            const buf = this.ctx.createBuffer(1, len, sr);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            this.noiseBuffer = buf;
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
            const pan = BO.Math.clamp((dx * rx + dz * rz) / hd, -1, 1) * 0.76;
            const deg = ((Math.atan2(dx, -dz) * 180 / Math.PI) + 360) % 360;
            const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const dir = dirs[Math.round(deg / 45) % 8];
            return { gain, pan, dir, dist: d };
        }

        _connectVoice(source, nodes, pan, dest, envelope, startTime) {
            const target = typeof dest === 'object' ? dest :
                dest === 'music' ? this.musicGain :
                dest === 'combat' ? this.combatGain :
                dest === 'ui' ? (this.uiGain || this.sfxGain) : this.sfxGain;
            if (Math.abs(pan) > 0.02 && typeof this.ctx.createStereoPanner === 'function') {
                const panner = this.ctx.createStereoPanner();
                panner.pan.value = Math.min(1, Math.max(-1, pan));
                nodes.push(panner);
            }
            let last = source;
            for (const node of nodes) {
                last.connect(node);
                last = node;
            }
            last.connect(target);
            if (dest === 'sfx' || dest === 'combat') this.effectVoices.set(source, { envelope, startTime });
            source.onended = () => {
                this.effectVoices.delete(source);
                source.disconnect();
                for (const node of nodes) node.disconnect();
            };
        }

        synthTone(from, to, duration, type, volume, options = {}) {
            const { delay = 0, pan = 0, dest = 'sfx', detune = 0,
                attack = Math.min(0.012, duration * 0.12), filter, wobble } = options;
            const ctx = this.ensureContext();
            if (!ctx || volume <= 0.001 || duration <= 0 || !Number.isFinite(from) || !Number.isFinite(to)) return;
            const time = ctx.currentTime + delay;
            const oscillator = ctx.createOscillator();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(Math.max(20, from), time);
            if (from !== to) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), time + duration);
            if (detune) oscillator.detune.value = detune;
            if (wobble) {
                const [rate, depth] = wobble;
                const curve = Float32Array.from({ length: 64 }, (_, i) =>
                    detune + Math.sin(i * duration * rate * 2 * Math.PI / 63) * depth);
                oscillator.detune.setValueCurveAtTime(curve, time, duration);
            }
            const envelope = this._envelope(time, duration, volume, attack);
            const nodes = filter ? [this._filter(time, duration, filter), envelope] : [envelope];
            this._connectVoice(oscillator, nodes, pan, dest, envelope, time);
            oscillator.start(time);
            oscillator.stop(time + duration + 0.01);
        }

        synthNoise(duration, frequency, type, q, volume, options = {}) {
            const { delay = 0, pan = 0, dest = 'sfx', endFrequency, saturated = false,
                attack = Math.min(0.004, duration * 0.15) } = options;
            const ctx = this.ensureContext();
            if (!ctx || volume <= 0.001 || duration <= 0) return;
            const time = ctx.currentTime + delay;
            const source = ctx.createBufferSource();
            source.buffer = this.noiseBuffer;
            const filter = this._filter(time, duration, [type, frequency, q, endFrequency]);
            const envelope = this._envelope(time, duration, volume, attack);
            const nodes = [filter];
            if (saturated) {
                const shaper = ctx.createWaveShaper();
                shaper.curve = this._getSaturationCurve();
                nodes.push(shaper);
            }
            nodes.push(envelope);
            this._connectVoice(source, nodes, pan, dest, envelope, time);
            source.loop = duration + 0.02 > source.buffer.duration;
            const available = source.loop ? source.buffer.duration : source.buffer.duration - duration - 0.02;
            source.start(time, Math.random() * available);
            source.stop(time + duration + 0.01);
        }

        stopEffects() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            for (const [source, { envelope, startTime }] of this.effectVoices) {
                if (startTime > now) {
                    source.disconnect();
                    source.stop(now);
                } else {
                    const level = envelope.gain;
                    if (level.cancelAndHoldAtTime) level.cancelAndHoldAtTime(now);
                    else level.cancelScheduledValues(now);
                    level.setTargetAtTime(0.0001, now, 0.006);
                    source.stop(now + 0.025);
                }
            }
            this.effectVoices.clear();
            for (const times of Object.values(this.worldVoiceTimes)) times.length = 0;
            this._lastAnnounceUntil = 0;
            global.speechSynthesis?.cancel();
        }

        _filter(time, duration, [type, frequency, q, endFrequency]) {
            const node = this.ctx.createBiquadFilter();
            node.type = type;
            node.Q.value = q;
            node.frequency.setValueAtTime(frequency, time);
            if (endFrequency) node.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
            return node;
        }

        _envelope(time, duration, volume, attack) {
            const node = this.ctx.createGain();
            node.gain.setValueAtTime(0.0001, time);
            node.gain.linearRampToValueAtTime(volume, time + Math.min(Math.max(attack, 0.0005), duration * 0.6));
            node.gain.exponentialRampToValueAtTime(0.0001, time + duration);
            return node;
        }

        playSpatialTone(freqStart, freqEnd, duration, type = 'sine', volume = 0.25, pan = 0, delay = 0) {
            this.synthTone(freqStart, freqEnd, duration, type, volume, { pan, delay });
        }

        playSpatialNoise(duration, frequency, type = 'bandpass', q = 1.2, volume = 0.3, pan = 0, delay = 0) {
            this.synthNoise(duration, frequency, type, q, volume, { pan, delay });
        }

        /** Positional infected vocal cue + optional directional subtitle. */
        playSpatialInfected(profile = 'groan_mid', sourcePos = null, label = '') {
            const m = this._spatialMetrics(sourcePos, 70);
            if (m.gain <= 0.04) return;
            this.playZombieGroan(profile, sourcePos ?? 1, 70);
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

        playTone(freqStart, freqEnd, duration, type = 'sine', volume = 0.25, delay = 0, dest = 'sfx') {
            this.synthTone(freqStart, freqEnd, duration, type, volume, { delay, dest });
        }

        playNoise(duration, frequency, type = 'bandpass', q = 1.2, volume = 0.3, delay = 0) {
            this.synthNoise(duration, frequency, type, q, volume, { delay });
        }

        playUIClick() {
            if (!this._canPlay('ui_click', 25)) return;
            const clip = Math.random() < 0.5 ? 'overhaul/ui/click_001.ogg' : 'overhaul/ui/click_002.ogg';
            const uiVol = BO.Settings?.get('uiVolume') ?? 0.8;
            this._tryClip(clip, { volume: 0.22 * uiVol, rateJitter: 0.08, volJitter: 0.08 }, () => {
                this.synthTone(660, 310, 0.052, 'triangle', 0.13, { attack: 0.0015, dest: 'ui' });
                this.synthTone(1320, 880, 0.028, 'sine', 0.055, { attack: 0.001, dest: 'ui' });
                this.synthNoise(0.022, 2600, 'bandpass', 2.4, 0.085, { attack: 0.001, endFrequency: 1200, dest: 'ui' });
            });
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

        _worldEffect(source, range, category) {
            if (source == null || typeof source === 'number') {
                return { gain: source ?? 1, pan: 0, clarity: 1, nearby: true };
            }
            if (!Number.isFinite(source.x) || !Number.isFinite(source.z)) return { gain: 0 };
            const { gain, pan, dist = 0 } = this._spatialMetrics(source, range);
            if (gain < 0.035) return { gain: 0 };
            const now = performance.now() / 1000;
            const times = this.worldVoiceTimes[category];
            const [limit, interval] = VOICE_LIMITS[category];
            while (times.length && now - times[0] >= interval) times.shift();
            // Keep room for nearby threats when many distant actors fire together.
            const nearby = dist < range * 0.31;
            if (times.length >= (nearby ? limit : limit - 2)) return { gain: 0 };
            times.push(now);

            const listener = BO.Player?.pos;
            const sourceHeight = (source.y ?? listener?.y ?? 0) + (category === 'vocal' || category === 'step' ? 1.1 : 0.15);
            const clear = !listener || !BO.World?.scene || BO.World.hasLineOfSight(
                listener.x, listener.y + 1.35, listener.z, source.x, sourceHeight, source.z
            );
            return { gain: gain * (clear ? 0.82 : 0.51), pan,
                clarity: (clear ? 1 : 0.52) * (1 - 0.47 * dist / range), nearby };
        }

        _pickWeaponClip(weaponId, profile) {
            if (weaponId && WEAPON_CLIPS[weaponId]) return WEAPON_CLIPS[weaponId];
            const pool = PROFILE_CLIPS[profile] || PROFILE_CLIPS.ar_light;
            if (!pool || !pool.length) return null;
            if (weaponId) {
                let h = 0;
                for (let i = 0; i < weaponId.length; i++) h = (h * 31 + weaponId.charCodeAt(i)) | 0;
                return pool[Math.abs(h) % pool.length];
            }
            return pool[0];
        }

        preloadWeapon(weaponId, profile = 'ar_light') {
            const clip = MELEE_CLIPS[weaponId] || this._pickWeaponClip(weaponId, profile);
            if (clip && BO.Assets?.loadAudioBuffer) BO.Assets.loadAudioBuffer(clip);
        }

        playGunshot(profile, suppressed = false, isPaP = false, source = 1, weaponId = null) {
            const { gain, pan, clarity, nearby } = this._worldEffect(source, 84, 'shot');
            if (gain <= 0.025) return;
            const v = gain * (suppressed ? 0.58 : 1);
            const variation = 0.94 + Math.random() * 0.12;
            const combat = { dest: 'combat', pan, attack: 0.0015 };

            const clip = this._pickWeaponClip(weaponId, profile);
            if (clip && BO.Assets?.playClip) {
                if (BO.Assets.hasAudioBuffer?.(clip)) {
                    BO.Assets.playClip(clip, {
                        volume: v * (suppressed ? 0.42 : 0.72),
                        pan,
                        dest: 'combat',
                        rate: isPaP ? 1.12 : (suppressed ? 1.08 : 1.0),
                        rateJitter: 0.045,
                        volJitter: 0.04
                    });
                    if (isPaP) {
                        this.synthTone(1770 * variation, 455, 0.16, 'triangle', v * 0.18, { ...combat, delay: 0.012, wobble: [24, 76] });
                    }
                    return;
                }
                BO.Assets.loadAudioBuffer?.(clip);
            }

            if (profile === 'raygun' || profile === 'zeus') {
                const wave = profile === 'zeus';
                this.synthTone(wave ? 128 : 1630 * variation, wave ? 32 : 232, wave ? 0.49 : 0.19,
                    'sawtooth', (wave ? 0.58 : 0.27) * v,
                    { ...combat, filter: ['lowpass', (wave ? 860 : 5900) * clarity, 0.8, wave ? 150 : 560], wobble: [wave ? 17 : 28, 62] });
                this.synthTone(wave ? 72 : 115, 30, wave ? 0.48 : 0.14, 'sine', 0.44 * v, combat);
                this.synthNoise(wave ? 0.52 : 0.16, (wave ? 430 : 3270) * clarity,
                    wave ? 'lowpass' : 'bandpass', 0.9, 0.36 * v, { ...combat, endFrequency: wave ? 140 : 670 });
                if (isPaP) this.synthTone(2330 * variation, 584, 0.23, 'triangle', 0.18 * v, { ...combat, delay: 0.022 });
                return;
            }

            const [bass, crack, length, action, weight] = SHOTS[profile] || SHOTS.ar_light;
            const level = v * weight;
            const cutoff = crack * variation * clarity * (suppressed ? 0.48 : 1);
            this.synthNoise(length * (suppressed ? 0.64 : 1), cutoff, suppressed ? 'lowpass' : 'bandpass',
                0.86, level * (suppressed ? 0.39 : 0.72), { ...combat, saturated: !suppressed, endFrequency: cutoff * 0.38 });
            this.synthTone(bass * variation, bass * 0.43, length * 0.87, 'sine', level * 0.53, combat);
            if (!nearby) return;

            this.synthTone(bass * 2.15, bass * 0.75, length * 0.65, 'triangle', level * 0.25, combat);
            if (!suppressed) {
                this.synthNoise(0.023 + length * 0.12, (crack + 2250) * clarity, 'highpass', 0.7, level * 0.29, combat);
                this.synthNoise(length * 1.24, crack * 0.39 * clarity, 'lowpass', 0.7, level * 0.16,
                    { ...combat, pan: Math.min(0.95, pan + 0.36), delay: 0.040 });
                this.synthNoise(length * 1.41, crack * 0.32 * clarity, 'lowpass', 0.7, level * 0.13,
                    { ...combat, pan: Math.max(-0.95, pan - 0.33), delay: 0.058 });
            }
            this.synthNoise(0.038, action * variation * clarity, 'bandpass', 2.75, level * 0.17,
                { ...combat, delay: 0.015 + length * 0.105, endFrequency: action * clarity * 0.71 });
            if (profile === 'launcher') {
                this.synthNoise(0.35, 1550 * clarity, 'bandpass', 0.9, level * 0.32,
                    { ...combat, endFrequency: 420 * clarity, delay: 0.038, attack: 0.03 });
            }
            if (isPaP) {
                this.synthTone(1770 * variation, 455, 0.18, 'triangle', level * 0.21, { ...combat, delay: 0.012, wobble: [24, 76] });
                this.synthTone(2320, 672, 0.14, 'sine', level * 0.14, { ...combat, delay: 0.026 });
            }
        }

        playHitmarker(isHeadshot = false, isKill = false) {
            if (!this._canPlay(isKill ? 'hm_kill' : 'hm_hit', 25)) return;
            const hmVol = Math.max(0, Math.min(1.5, Number(BO.Settings?.get('hitmarkerVolume') ?? 1.0)));
            if (hmVol <= 0.01) return;
            const options = { attack: 0.0018 };
            const jit = 0.96 + Math.random() * 0.08;
            this.synthNoise(0.036, (isHeadshot ? 4020 : 2860) * jit, 'bandpass', 2.3, (isHeadshot ? 0.37 : 0.27) * hmVol, options);
            this.synthTone((isHeadshot ? 2290 : 1470) * jit, (isHeadshot ? 1630 : 1170) * jit, 0.041, 'triangle', (isHeadshot ? 0.28 : 0.20) * hmVol, options);
            if (isKill) {
                this.synthTone(246, 85, 0.077, 'sine', 0.26 * hmVol, { ...options, delay: 0.023 });
                this.synthTone(659, 524, 0.12, 'triangle', 0.15 * hmVol, { ...options, delay: 0.052 });
            }
            if (isHeadshot && isKill) {
                this.synthNoise(0.096, 1730, 'bandpass', 1.1, 0.33 * hmVol, { ...options, delay: 0.010, endFrequency: 500 });
            }
            if (this._hasClip('overhaul/combat/MW2Hitmarker.mp3')) {
                BO.Assets.playClip('overhaul/combat/MW2Hitmarker.mp3', { volume: (isHeadshot ? 0.32 : 0.22) * hmVol, rate: isHeadshot ? 1.08 : 1.0, rateJitter: 0.06 });
            } else {
                BO.Assets?.loadAudioBuffer?.('overhaul/combat/MW2Hitmarker.mp3');
            }
        }

        playReload(stage = 'out') {
            switch (stage) {
                case 'out':
                    this._metalImpact(1.34, 0.62);
                    this.synthNoise(0.088, 2090, 'bandpass', 1.7, 0.23, { delay: 0.023, endFrequency: 970 });
                    this.synthTone(309, 128, 0.096, 'triangle', 0.18, { delay: 0.026, attack: 0.004 });
                    break;
                case 'in':
                    this.synthTone(168, 64, 0.083, 'sine', 0.32, { attack: 0.002 });
                    this.synthNoise(0.087, 1780, 'bandpass', 1.25, 0.21, { endFrequency: 630 });
                    this.synthTone(891, 871, 0.084, 'triangle', 0.21, { delay: 0.047, attack: 0.0018 });
                    break;
                case 'bolt':
                    this.synthNoise(0.093, 1170, 'bandpass', 2.4, 0.25, { endFrequency: 3400 });
                    this.synthTone(575, 392, 0.084, 'sawtooth', 0.21,
                        { filter: ['bandpass', 2030, 2, 1220], attack: 0.007 });
                    this.synthTone(206, 77, 0.062, 'triangle', 0.22, { delay: 0.085, attack: 0.0015 });
                    this.synthNoise(0.067, 2950, 'bandpass', 2.4, 0.31, { delay: 0.085, endFrequency: 990 });
                    break;
                case 'shell':
                    this.synthTone(638, 355, 0.049, 'triangle', 0.17, { attack: 0.002 });
                    this.synthNoise(0.069, 3560, 'bandpass', 1.7, 0.20, { endFrequency: 1480 });
                    this.synthTone(1420, 1398, 0.067, 'sine', 0.13, { delay: 0.038, attack: 0.0017 });
                    break;
            }
        }

        playParkour(kind = 'mantle') {
            if (kind === 'vault') {
                this.synthTone(145, 58, 0.095, 'sine', 0.23, { attack: 0.002 });
                this.synthNoise(0.14, 1350, 'bandpass', 1.1, 0.21, { pan: -0.15, endFrequency: 680 });
                this.synthNoise(0.085, 2450, 'highpass', 1.0, 0.12, { delay: 0.055, pan: 0.18 });
                this.synthTone(115, 48, 0.075, 'triangle', 0.15, { delay: 0.11, pan: 0.1 });
            } else {
                this.synthTone(125, 52, 0.085, 'sine', 0.21, { attack: 0.002 });
                this.synthNoise(0.12, 950, 'bandpass', 1.25, 0.19, { pan: -0.14, endFrequency: 520 });
                this.synthTone(165, 72, 0.08, 'triangle', 0.17, { delay: 0.13, pan: 0.14 });
                this.synthNoise(0.06, 1780, 'bandpass', 1.5, 0.11, { delay: 0.14, endFrequency: 740 });
            }
        }

        playEmptyClick() {
            this._metalImpact(1.6, 0.47);
            this.synthNoise(0.036, 1660, 'bandpass', 1.7, 0.1, { delay: 0.021 });
        }

        _floorMaterial(position) {
            if (!BO.World?.scene || !position) return 'masonry';
            const start = new global.THREE.Vector3(position.x, position.y + 0.48, position.z);
            const down = this.floorProbe ??= new global.THREE.Vector3(0, -1, 0);
            const hit = BO.World.raycastWorld(start, down, 0.92);
            return hit?.terrain ? 'earth' : surfaceFamily(hit?.object?.userData.surfaceMaterial);
        }

        playFootstep(sprinting = false, source = null, surfaceOverride = null, crouching = false) {
            const mix = source ? this._worldEffect(source, 15, 'step') : { gain: 1, pan: 0, clarity: 1 };
            if (mix.gain < 0.045) return;
            const family = surfaceOverride ? surfaceFamily(surfaceOverride) : this._floorMaterial(source || BO.Player?.pos);
            const [texture, duration, heel] = FOOTING[family] || FOOTING.masonry;
            const variation = 0.88 + Math.random() * 0.24;
            const pan = source ? mix.pan : (this.stepSide = this.stepSide === 0.13 ? -0.13 : 0.13);
            const crouchMult = crouching ? 0.45 : 1.0;
            const v = mix.gain * (sprinting ? 1 : 0.64) * crouchMult * (source ? 0.76 : 1);
            const pitchBias = crouching ? 0.85 : 1.0;
            this.synthTone(heel * variation * pitchBias, heel * 0.54 * pitchBias, duration, 'triangle', 0.13 * v, { pan, attack: 0.002 });
            this.synthNoise(duration * 0.86, texture * variation * mix.clarity * pitchBias, 'bandpass', 1.18, 0.25 * v,
                { pan, endFrequency: texture * 0.44 * mix.clarity });
            this.synthNoise(duration * 0.5, texture * 1.15 * mix.clarity, 'bandpass', 1.6, 0.115 * v, { pan, delay: 0.034 });
            if ((family === 'masonry' || family === 'stone' || family === 'earth') && mix.gain >= 0.12 && this._hasClip('overhaul/env/step_concrete_1.wav')) {
                BO.Assets.playClip(Math.random() < 0.5 ? 'overhaul/env/step_concrete_1.wav' : 'overhaul/env/step_concrete_2.wav', {
                    volume: 0.11 * v, rateJitter: 0.14, volJitter: 0.10, pan
                });
            }
        }

        playSlide() {
            const [texture] = FOOTING[this._floorMaterial(BO.Player?.pos)];
            this.synthNoise(0.40, texture * 1.75, 'bandpass', 0.72, 0.31,
                { endFrequency: texture * 0.46, attack: 0.020 });
            this.synthTone(127, 43, 0.17, 'triangle', 0.15, { attack: 0.002 });
            this.synthNoise(0.14, 630, 'lowpass', 0.8, 0.14, { delay: 0.098 });
        }

        playMelee(source = 1, weaponId = null) {
            const { gain, pan } = this._worldEffect(source, 20, 'impact');
            if (gain <= 0.035) return;
            const clip = (weaponId && MELEE_CLIPS[weaponId]) || (RPG_SFX_DIR + 'knifeSlice.ogg');
            if (clip && BO.Assets?.playClip) {
                if (BO.Assets.hasAudioBuffer?.(clip)) {
                    BO.Assets.playClip(clip, { volume: 0.44 * gain, pan, rateJitter: 0.08, volJitter: 0.05 });
                } else {
                    BO.Assets.loadAudioBuffer?.(clip);
                }
            }
            this.synthNoise(0.14, 812, 'bandpass', 0.85, 0.32 * gain, { pan, attack: 0.036, endFrequency: 2760 });
            this.synthNoise(0.047, 2900, 'bandpass', 1.25, 0.19 * gain, { pan, delay: 0.052 });
            this.synthTone(238, 85, 0.098, 'triangle', 0.13 * gain, { pan, delay: 0.028 });
        }

        playExplosion(source = 1, intensity = 1) {
            const { gain: spatialGain, pan, clarity, nearby } = this._worldEffect(source, 68, 'impact');
            const gain = spatialGain * intensity;
            if (gain <= 0.035) return;
            const mix = { pan, dest: 'combat' };
            this.synthTone(94, 29, 0.56, 'sine', 0.8 * gain, { ...mix, attack: 0.002 });
            this.synthNoise(0.69, 620 * clarity, 'lowpass', 0.84, 0.81 * gain,
                { ...mix, endFrequency: 165 * clarity, saturated: true });
            this.synthNoise(0.15, 2270 * clarity, 'bandpass', 0.72, 0.56 * gain,
                { ...mix, endFrequency: 510 * clarity });
            if (nearby) {
                this.synthNoise(0.33, 1320 * clarity, 'bandpass', 1.05, 0.26 * gain,
                    { ...mix, pan: Math.min(0.95, pan + 0.35), delay: 0.066, endFrequency: 230 * clarity });
                this.synthNoise(0.52, 710 * clarity, 'lowpass', 0.76, 0.24 * gain,
                    { ...mix, pan: Math.max(-0.95, pan - 0.35), delay: 0.10 });
            }
        }

        playFlashbang(source = 1, proximity = 1) {
            this.playExplosion(source, 0.46);
            if (proximity <= 0) return;
            this.synthTone(3450, 3190, 1.28, 'sine', 0.105 * proximity,
                { attack: 0.024, delay: 0.052, wobble: [6, 24] });
            this.synthNoise(0.45, 6120, 'bandpass', 1.32, 0.12 * proximity,
                { delay: 0.037, endFrequency: 2200 });
        }

        _metalImpact(pitch, gain, pan = 0) {
            this.synthTone(486 * pitch, 482 * pitch, 0.15, 'triangle', 0.22 * gain, { pan, attack: 0.002 });
            this.synthTone(1334 * pitch, 1320 * pitch, 0.089, 'sine', 0.16 * gain, { pan, attack: 0.002 });
            this.synthNoise(0.046, 3090 * pitch, 'bandpass', 2.4, 0.26 * gain, { pan, endFrequency: 1800 * pitch });
        }

        playGrenadeBounce(source = 1, speed = 3, sticky = false) {
            const { gain, pan } = this._worldEffect(source, 24, 'impact');
            if (gain <= 0.035) return;
            const strength = Math.min(1.3, 0.40 + speed * 0.13);
            if (sticky) {
                this.synthNoise(0.07, 1070, 'bandpass', 1.4, 0.33 * strength * gain, { pan, endFrequency: 290 });
                this.synthTone(202, 77, 0.09, 'triangle', 0.19 * strength * gain, { pan, attack: 0.003 });
            } else {
                this._metalImpact(1.12 + Math.random() * 0.24, strength * gain, pan);
            }
        }

        playBulletImpact(hit) {
            const { gain, pan, clarity } = this._worldEffect(hit.point, 23, 'impact');
            if (gain <= 0.035) return;
            const family = hit.terrain ? 'earth' : surfaceFamily(hit.object?.userData.surfaceMaterial);
            if (family === 'metal') {
                this._metalImpact(1.36 + Math.random() * 0.3, gain * 0.73, pan);
            } else {
                const [texture, , heel] = FOOTING[family];
                this.synthNoise(0.082, (texture + 640) * clarity, 'bandpass', 0.95, 0.28 * gain,
                    { pan, endFrequency: texture * 0.61 * clarity });
                this.synthTone(heel * 2.2, 59, 0.064, 'triangle', 0.11 * gain, { pan, attack: 0.002 });
            }
        }

        playZombieStrike(source, special = false) {
            const { gain, pan } = this._worldEffect(source, 24, 'impact');
            if (gain <= 0.035) return;
            this.synthNoise(special ? 0.21 : 0.104, special ? 2720 : 1850, 'bandpass', 0.92, 0.36 * gain,
                { pan, attack: 0.018, endFrequency: special ? 840 : 530 });
            this.synthTone(special ? 246 : 136, 47, 0.14, 'triangle', 0.25 * gain, { pan, delay: 0.026 });
        }

        playBarricadeBreak(source) {
            const { gain, pan } = this._worldEffect(source, 28, 'impact');
            if (gain <= 0.035) return;
            this.synthNoise(0.15, 1660, 'bandpass', 1.3, 0.38 * gain, { pan, endFrequency: 490 });
            this.synthTone(184, 73, 0.12, 'triangle', 0.24 * gain, { pan, attack: 0.002 });
            this.synthNoise(0.14, 2440, 'bandpass', 1.1, 0.15 * gain, { pan, delay: 0.056 });
        }

        playZombieGroan(profile = 'groan_mid', source = 1, range = 36) {
            const zVol = Math.max(0, Math.min(1.5, Number(BO.Settings?.get('zombieVolume') ?? 1.0)));
            if (zVol <= 0.01) return;
            const { gain: rawGain, pan, clarity } = this._worldEffect(source, range, 'vocal');
            const gain = rawGain * zVol;
            if (gain <= 0.035) return;
            if (BO.Assets?.playClip && gain >= 0.16 && Math.random() < 0.38) {
                const clip = ['zombie1.wav', 'zombie2.wav', 'zombie3.wav'][Math.floor(Math.random() * 3)];
                BO.Assets.playClip('overhaul/zombies/' + clip, { volume: 0.24 * gain, rateJitter: 0.10, volJitter: 0.08, pan });
            }

            const pitch = 0.90 + Math.random() * 0.20;
            const rasp = (from, to, duration, formant, level, delay = 0) => {
                this.synthTone(from * pitch, to * pitch, duration, 'sawtooth', level * gain,
                    { pan, delay, attack: 0.024, filter: ['bandpass', formant * clarity, 1.1, formant * 0.7 * clarity], wobble: [15, 125] });
                this.synthNoise(duration * 0.84, formant * 1.7 * clarity, 'bandpass', 0.92, level * 0.48 * gain,
                    { pan, delay: delay + 0.012, attack: 0.026, endFrequency: formant * 0.57 * clarity });
            };
            switch (profile) {
                case 'hellhound':
                case 'hound_bark':
                    rasp(246, 104, 0.19, 1170, 0.42);
                    rasp(191, 82, 0.25, 810, 0.28, 0.13);
                    break;
                case 'chitter_high':
                    [0, 0.067, 0.14].forEach((delay, i) => rasp(540 + i * 75, 340 + i * 25, 0.078, 2800, 0.26, delay));
                    break;
                case 'shriek_fast':
                case 'screamer':
                    rasp(740, 390, 0.36, 2380, 0.42);
                    this.synthTone(890, 470, 0.29, 'sine', 0.07 * gain, { pan, delay: 0.038, wobble: [20, 235] });
                    break;
                case 'gurgle_wet':
                case 'gurgle_deep':
                    rasp(profile === 'gurgle_deep' ? 83 : 132, 52, 0.38, 590, 0.36);
                    [0.03, 0.11, 0.18].forEach((delay, i) => this.synthTone(290 + i * 53, 104, 0.105, 'sine', 0.082 * gain, { pan, delay }));
                    break;
                case 'metal_clang':
                    this._metalImpact(1.35, gain, pan);
                    rasp(245, 93, 0.28, 1420, 0.22, 0.035);
                    break;
                case 'hiss_toxic':
                case 'spitter':
                    this.synthNoise(0.38, 4700 * clarity, 'highpass', 0.77, 0.34 * gain,
                        { pan, attack: 0.033, endFrequency: 1330 * clarity });
                    rasp(210, 101, 0.19, 830, 0.21, 0.12);
                    break;
                case 'wail_ice':
                case 'wail_void':
                case 'wraith': {
                    const ice = profile === 'wail_ice';
                    this.synthTone(ice ? 740 : 401, ice ? 370 : 148, 0.57, 'sine', 0.19 * gain, { pan, attack: 0.054, wobble: [6, 195] });
                    rasp(ice ? 489 : 263, ice ? 193 : 102, 0.48, ice ? 1840 : 940, 0.29, 0.056);
                    break;
                }
                case 'roar_deep':
                case 'roar_hollow':
                case 'brute':
                case 'roar_heavy':
                    rasp(109, 48, 0.63, profile === 'roar_hollow' ? 940 : 490, 0.49);
                    this.synthTone(75, 38, 0.53, 'triangle', 0.24 * gain, { pan, wobble: [13, 140] });
                    break;
                case 'crackle_fire':
                    rasp(208, 80, 0.34, 790, 0.37);
                    [0, 0.09, 0.13, 0.24].forEach(delay => this.synthNoise(0.072, 3100 * clarity, 'bandpass', 1.65, 0.16 * gain, { pan, delay }));
                    break;
                case 'groan_dual':
                    rasp(164, 89, 0.43, 740, 0.34);
                    rasp(213, 137, 0.38, 1260, 0.23, 0.052);
                    break;
                case 'snarl_raspy':
                case 'growl_beast':
                    rasp(184, 75, 0.28, 1310, 0.4);
                    break;
                default:
                    rasp(143, 76, 0.42, 770, 0.41);
                    this.synthTone(91, 55, 0.29, 'sine', 0.085 * gain, { pan, delay: 0.041 });
            }
        }

        playBossIntro() {
            if (BO.Assets?.playClip) {
                BO.Assets.playClip('overhaul/zombies/zombie_scream.mp3', { volume: 0.34, rateJitter: 0.06 });
            }
            this.synthNoise(0.95, 340, 'lowpass', 0.85, 0.26, { attack: 0.08, endFrequency: 110, saturated: true });
            [110, 103.8, 98, 73.4].forEach((f, i) => {
                const delay = i * 0.24;
                const pan = i % 2 ? 0.22 : -0.22;
                this.synthTone(f, f * 0.94, 0.85, 'sawtooth', 0.24,
                    { delay, pan, attack: 0.03, filter: ['lowpass', 1150, 1.1, 360], wobble: [5, 18] });
                this.synthTone(f * 0.5, f * 0.48, 0.95, 'sine', 0.30, { delay, attack: 0.02 });
            });
            this.synthTone(64, 28, 0.52, 'sine', 0.36, { delay: 0.72, attack: 0.004 });
        }

        playUltimate(ultId) {
            if (ultId === 'cryo_nova') {
                this.synthTone(1460, 260, 0.68, 'sine', 0.28, { wobble: [11, 45] });
                this.synthTone(2210, 1180, 0.48, 'triangle', 0.14, { delay: 0.04, pan: -0.25 });
                this.synthTone(2640, 1420, 0.44, 'sine', 0.12, { delay: 0.08, pan: 0.25 });
                this.synthNoise(0.58, 3800, 'highpass', 1.15, 0.26, { endFrequency: 1350 });
                this.synthTone(110, 38, 0.42, 'sine', 0.26, { attack: 0.003 });
            } else if (ultId === 'annihilator') {
                this.synthTone(1880, 145, 0.44, 'sawtooth', 0.32,
                    { filter: ['lowpass', 4800, 1.1, 520], attack: 0.002 });
                this.synthTone(142, 36, 0.34, 'sine', 0.36, { attack: 0.002, dest: 'combat' });
                this.synthNoise(0.32, 1950, 'bandpass', 0.85, 0.38, { saturated: true, endFrequency: 460 });
            } else {
                this.synthTone(180, 38, 0.74, 'sawtooth', 0.34,
                    { filter: ['lowpass', 1450, 1.0, 240], dest: 'combat' });
                this.synthTone(440, 920, 0.38, 'triangle', 0.20, { pan: -0.18 });
                this.synthTone(660, 1320, 0.34, 'sine', 0.14, { delay: 0.03, pan: 0.18 });
                this.synthNoise(0.58, 740, 'lowpass', 0.85, 0.44, { saturated: true, endFrequency: 180 });
            }
        }

        playRoundStart(roundNum, isDogRound = false) {
            if (BO.Assets?.playClip && (isDogRound || roundNum % 5 === 0)) {
                BO.Assets.playClip('overhaul/zombies/zombie_laugh.mp3', { volume: 0.30, rateJitter: 0.05 });
            }
            if (isDogRound) {
                this.synthNoise(1.05, 420, 'lowpass', 0.85, 0.26, { attack: 0.12, endFrequency: 110, saturated: true });
                this.synthTone(144, 46, 0.82, 'sawtooth', 0.25,
                    { filter: ['lowpass', 920, 1.1, 240], wobble: [12, 65], pan: -0.2 });
                this.synthTone(215, 62, 0.90, 'triangle', 0.22, { delay: 0.22, pan: 0.22 });
                this.playZombieGroan('hound_bark', 0.85);
                return;
            }
            // Eerie Zombies round chord progression
            const root = roundNum % 2 === 1 ? 146.8 : 130.8;
            [1, 1.19, 1.5, 1.414].forEach((ratio, index) => {
                const note = root * ratio;
                this.synthTone(note, note * 0.992, 0.82, 'triangle', 0.20,
                    { delay: index * 0.18, attack: 0.06, pan: index % 2 ? 0.22 : -0.22, wobble: [5, 44] });
                this.synthTone(note * 2.01, note * 1.99, 0.51, 'sine', 0.086, { delay: index * 0.18, attack: 0.028 });
            });
            this.synthNoise(0.86, 505, 'lowpass', 0.65, 0.21, { attack: 0.21, endFrequency: 154 });
        }

        playRoundEnd() {
            this.synthTone(58, 35, 0.57, 'sine', 0.18, { attack: 0.06 });
            [220, 196, 174.6, 146.8].forEach((f, idx) => {
                this.synthTone(f, f * 0.997, 0.56, 'triangle', 0.15, { delay: idx * 0.15, attack: 0.027 });
                this.synthTone(f * 2.46, f * 2.44, 0.31, 'sine', 0.07, { delay: 0.022 + idx * 0.15 });
            });
        }

        playMysteryBoxJingle() {
            const melody = [523.25, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25, 587.33];
            this.synthNoise(0.19, 1680, 'bandpass', 1.7, 0.16, { endFrequency: 510 });
            melody.forEach((f, idx) => {
                const delay = 0.08 + idx * 0.175;
                this.synthTone(f, f * 0.998, 0.35, 'triangle', 0.16, { delay, wobble: [5, 16], pan: idx % 2 ? 0.22 : -0.22 });
                this.synthTone(f * 2.38, f * 2.36, 0.18, 'sine', 0.075, { delay, attack: 0.0015 });
            });
        }

        playTeddyLaugh() {
            [720, 560, 690, 490, 645, 410].forEach((f, i) => {
                const delay = i * 0.135;
                const pan = i % 2 ? 0.24 : -0.24;
                this.synthTone(f, f * 0.72, 0.17, 'sawtooth', 0.17,
                    { delay, pan, filter: ['bandpass', f * 1.8, 1.4, f * 0.9], wobble: [14, 72] });
                this.synthTone(f * 0.5, f * 0.38, 0.15, 'triangle', 0.09, { delay, pan });
            });
        }

        playPerkBuy() {
            this._metalImpact(1.42, 0.48);
            this.synthNoise(0.22, 1880, 'bandpass', 2.2, 0.19, { delay: 0.068, endFrequency: 680 });
            this.synthTone(477, 461, 0.32, 'sine', 0.12, { delay: 0.095, wobble: [12, 42] });
            [392, 493.88, 587.33, 783.99].forEach((f, i) => {
                this.synthTone(f, f, 0.32, 'triangle', 0.15, { delay: 0.18 + i * 0.079, pan: i % 2 ? -0.17 : 0.17 });
            });
        }

        playPaPChime() {
            this.synthTone(62, 124, 0.44, 'triangle', 0.16, { attack: 0.042 });
            this.synthNoise(0.52, 560, 'bandpass', 1.42, 0.22, { attack: 0.083, endFrequency: 3300 });
            [261.6, 329.6, 392.0, 523.25, 659.25, 784.0].forEach((f, i) => {
                this.synthTone(f, f * 1.01, 0.36, 'sawtooth', 0.15,
                    { delay: 0.11 + i * 0.075, pan: i % 2 ? 0.25 : -0.25, filter: ['lowpass', 2750, 1.1, 780] });
            });
            this._metalImpact(0.64, 0.57);
        }

        playPowerUp() {
            this.synthTone(146.83, 293.66, 0.36, 'sine', 0.18, { attack: 0.02 });
            [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
                this.synthTone(f, f * 1.006, 0.30, i % 2 ? 'triangle' : 'sine', 0.17,
                    { delay: i * 0.068, pan: i % 2 ? 0.22 : -0.22 });
            });
            this.synthNoise(0.18, 3400, 'highpass', 1.1, 0.09, { delay: 0.04, endFrequency: 5200 });
        }

        playPowerOn() {
            this._metalImpact(0.78, 0.62);
            this.synthTone(64, 220, 0.92, 'sawtooth', 0.23,
                { delay: 0.04, filter: ['lowpass', 1650, 1.1, 540] });
            this.synthTone(130, 440, 0.90, 'triangle', 0.20, { delay: 0.09, pan: 0.18 });
            this.synthNoise(0.42, 1750, 'bandpass', 1.35, 0.24, { delay: 0.22, endFrequency: 640 });
        }

        playPoints() {
            const now = performance.now();
            if (now < (this.nextPointsSound || 0)) return;
            this.nextPointsSound = now + 62;
            this.synthTone(1105, 1370, 0.068, 'sine', 0.13, { attack: 0.0015 });
            this.synthNoise(0.027, 2610, 'bandpass', 2.1, 0.10, { delay: 0.015 });
        }

        playRankUp() {
            this.synthTone(110, 55, 0.42, 'sine', 0.24, { attack: 0.004 });
            [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => {
                const delay = i * 0.095;
                const pan = (i - 2) * 0.14;
                this.synthTone(f, f, 0.38, 'triangle', 0.17, { delay, pan });
                this.synthTone(f * 0.5, f * 0.5, 0.36, 'sawtooth', 0.09,
                    { delay, pan: -pan, filter: ['lowpass', 2200, 0.9, 900] });
            });
        }

        playMedal() {
            this.synthTone(740, 988, 0.14, 'triangle', 0.15, { pan: -0.15 });
            this.synthTone(1110, 1480, 0.20, 'sine', 0.15, { delay: 0.055, pan: 0.15 });
            this.synthTone(2220, 2210, 0.16, 'sine', 0.07, { delay: 0.08 });
        }

        playKillstreakReady() {
            this.synthNoise(0.054, 3180, 'bandpass', 2.0, 0.17, { endFrequency: 1170 });
            [680, 910, 1250].forEach((f, i) => {
                this.synthTone(f, f * 1.07, i === 2 ? 0.18 : 0.068, 'square', 0.16,
                    { delay: 0.033 + i * 0.079, filter: ['lowpass', 2900, 0.78, 1750] });
            });
        }

        playKillstreakDeploy() {
            this.synthNoise(0.14, 2510, 'bandpass', 1.8, 0.25, { endFrequency: 1120 });
            this.synthTone(740, 554, 0.13, 'triangle', 0.20, { delay: 0.054 });
            this.synthTone(554, 415, 0.16, 'triangle', 0.16, { delay: 0.152 });
        }

        playObjectiveSignal(kind, source) {
            if (kind === 'charge_tick') {
                const { gain, pan } = this._worldEffect(source, 26, 'impact');
                this.synthTone(1780, 1770, 0.11, 'sine', 0.35 * gain, { pan });
                this.synthNoise(0.039, 2630, 'bandpass', 1.5, 0.13 * gain, { pan });
                return;
            }

            const notes = kind === 'charge_armed' ? [468, 468, 894] : kind === 'charge_safe' ? [847, 560, 418] : [392, 594, 786];
            this._metalImpact(kind === 'bounty' ? 1.14 : 1.54, 0.44);
            notes.forEach((note, index) => this.synthTone(note, note * 0.98, index === 2 ? 0.2 : 0.075, 'triangle', 0.20,
                { attack: 0.002, delay: 0.04 + index * 0.092 }));
        }

        playNukeSiren() {
            for (let i = 0; i < 6; i++) {
                const upDelay = i * 1.1;
                const downDelay = upDelay + 0.55;
                this.synthTone(420, 760, 0.55, 'sawtooth', 0.18,
                    { delay: upDelay, pan: -0.18, filter: ['lowpass', 1900, 1.3, 2800], wobble: [8, 22] });
                this.synthTone(630, 1140, 0.55, 'triangle', 0.11, { delay: upDelay, pan: 0.18 });
                this.synthTone(760, 420, 0.55, 'sawtooth', 0.18,
                    { delay: downDelay, pan: -0.18, filter: ['lowpass', 2800, 1.3, 1500], wobble: [8, 22] });
                this.synthTone(1140, 630, 0.55, 'triangle', 0.11, { delay: downDelay, pan: 0.18 });
            }
        }

        playTrapZap(source = 1) {
            const { gain, pan, clarity = 1 } = this._worldEffect(source, 32, 'impact');
            if (gain <= 0.035) return;
            this.synthNoise(0.28, 3300 * clarity, 'bandpass', 2.2, 0.34 * gain,
                { pan, endFrequency: 980 * clarity, saturated: true });
            this.synthTone(185, 88, 0.24, 'sawtooth', 0.20 * gain,
                { pan, filter: ['lowpass', 1400 * clarity, 1.2, 420], wobble: [32, 85] });
            this.synthTone(1040, 310, 0.16, 'triangle', 0.13 * gain, { pan, delay: 0.035 });
        }

        playAirRaidSiren() {
            this.synthTone(280, 680, 0.9, 'sawtooth', 0.20,
                { pan: -0.16, filter: ['bandpass', 1450, 1.1, 2300], wobble: [6, 20] });
            this.synthTone(420, 1020, 0.9, 'triangle', 0.11, { pan: 0.16 });
            this.synthTone(680, 260, 0.9, 'sawtooth', 0.19,
                { delay: 0.9, pan: -0.16, filter: ['bandpass', 2300, 1.1, 1100], wobble: [6, 20] });
            this.synthTone(1020, 390, 0.9, 'triangle', 0.10, { delay: 0.9, pan: 0.16 });
        }

        playRocketLaunch(source = 1) {
            const { gain, pan, clarity = 1 } = this._worldEffect(source, 72, 'impact');
            if (gain <= 0.035) return;
            this.synthNoise(0.18, 2200 * clarity, 'bandpass', 1.1, 0.36 * gain,
                { pan, endFrequency: 480 * clarity, dest: 'combat' });
            this.synthNoise(1.4, 340 * clarity, 'lowpass', 0.9, 0.56 * gain,
                { pan, endFrequency: 140 * clarity, saturated: true, dest: 'combat' });
            this.synthTone(98, 40, 1.35, 'sawtooth', 0.28 * gain,
                { pan, filter: ['lowpass', 720 * clarity, 0.9, 210], dest: 'combat' });
            this.synthTone(160, 330, 1.1, 'triangle', 0.19 * gain, { pan, delay: 0.14 });
        }

        playDefconBeep(level = 4) {
            const base = 620 + (5 - Math.max(1, Math.min(5, level))) * 90;
            this._metalImpact(1.45, 0.32);
            this.synthTone(base, base * 0.99, 0.14, 'square', 0.17,
                { filter: ['lowpass', 2600, 1.1, 1600] });
            if (level >= 5) {
                [0.16, 0.42].forEach((delay) => {
                    this.synthTone(base * 1.35, base * 1.34, 0.22, 'sawtooth', 0.19,
                        { delay, filter: ['lowpass', 2800, 1.2, 1400] });
                    this.synthTone(base * 0.675, base * 0.67, 0.22, 'triangle', 0.12, { delay });
                });
            }
        }

        playTelephoneEasterEgg() {
            // Vintage phone double-ring followed by 6-note eerie synth riff homage to "The One"
            [0.0, 0.18].forEach((delay) => {
                this.synthTone(1120, 1180, 0.12, 'triangle', 0.17, { delay, wobble: [24, 35] });
                this.synthNoise(0.05, 3200, 'bandpass', 2.4, 0.08, { delay });
            });
            const riff = [329.63, 493.88, 659.25, 587.33, 523.25, 493.88];
            riff.forEach((f, idx) => {
                const delay = 0.52 + idx * 0.24;
                this.synthTone(f, f * 0.995, 0.34, 'sawtooth', 0.13,
                    { delay, pan: idx % 2 ? 0.22 : -0.22, filter: ['lowpass', 2200, 1.0, 900] });
                this.synthTone(f * 0.5, f * 0.5, 0.34, 'sine', 0.16, { delay });
            });
        }

        playElevatorHum() {
            this.synthTone(880, 876, 0.22, 'sine', 0.16);
            this.synthTone(1760, 1752, 0.14, 'triangle', 0.07, { delay: 0.01 });
            this.synthNoise(0.95, 210, 'lowpass', 1.1, 0.24, { delay: 0.12, endFrequency: 130 });
            this.synthTone(68, 54, 0.85, 'triangle', 0.12, { delay: 0.14 });
        }

        playBusterChargeTick(frac = 0) {
            const c = BO.Math.clamp(frac, 0, 1);
            const f = 220 + c * 860;
            this.synthTone(f, f * 1.14, 0.14, 'sawtooth', 0.08 + c * 0.08,
                { filter: ['lowpass', 2600 + c * 2200, 1.2], wobble: [16, 30] });
            this.synthTone(f * 1.5, f * 1.68, 0.12, 'triangle', 0.05 + c * 0.06, { delay: 0.02, pan: 0.18 });
        }

        playBusterRelease(frac = 0) {
            const f = BO.Math.clamp(frac, 0, 1);
            this.synthTone(980 + f * 650, 110, 0.24 + f * 0.48, 'sawtooth', 0.26 + f * 0.22,
                { filter: ['lowpass', 4200, 1.1, 380], dest: 'combat' });
            this.synthTone(180 + f * 140, 36, 0.26 + f * 0.55, 'sine', 0.28 + f * 0.28, { dest: 'combat' });
            if (f >= 0.4) {
                this.synthNoise(0.28 + f * 0.4, 960 + f * 800, 'bandpass', 0.85, 0.34 + f * 0.24,
                    { saturated: true, endFrequency: 260, dest: 'combat' });
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
            this.synthTone(68, 34, 0.42, 'sine', 0.28, { attack: 0.004 });
            this.synthNoise(0.16, 620, 'lowpass', 0.9, 0.22, { endFrequency: 240 });
            notes.forEach((f, idx) => {
                const delay = idx * 0.052;
                const pan = (idx % 2 ? 1 : -1) * 0.22;
                this.synthTone(f, f * 0.996, 0.44, 'sawtooth', 0.14,
                    { delay, pan, filter: ['lowpass', 2400, 0.9, 950] });
                this.synthTone(f * 1.004, f, 0.46, 'triangle', 0.15, { delay: delay + 0.008, pan: -pan });
                this.synthTone(f * 0.5, f * 0.498, 0.50, 'sine', 0.17, { delay });
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

            if (BO.Settings.get('sfxMuted') || BO.Settings.get('announcerEnabled') === false) return;
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
            if (BO.State.activeMode !== 'mp') return;
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
            this.synthTone(82, 36, 1.35, 'sawtooth', 0.22,
                { filter: ['lowpass', 920, 1.1, 240], pan: -0.15 });
            this.synthTone(164, 110, 1.35, 'triangle', 0.17, { delay: 0.06, pan: 0.15 });
            this.synthNoise(0.9, 580, 'bandpass', 0.95, 0.24, { endFrequency: 180 });
        }

        playTurretFire(source = 1) {
            const { gain, pan, clarity = 1 } = this._worldEffect(source, 48, 'shot');
            if (gain <= 0.03) return;
            const variation = 0.95 + Math.random() * 0.10;
            this.synthTone(245 * variation, 74, 0.072, 'triangle', 0.20 * gain, { pan, dest: 'combat', attack: 0.0015 });
            this.synthNoise(0.058, 2150 * variation * clarity, 'bandpass', 1.25, 0.24 * gain,
                { pan, dest: 'combat', saturated: true, endFrequency: 680 * clarity });
            this.synthNoise(0.025, 3100 * clarity, 'bandpass', 2.4, 0.12 * gain,
                { pan, delay: 0.022, dest: 'combat' });
        }

        playDogBark(source = 1) {
            this.playZombieGroan('hound_bark', source, 38);
        }

        playWallHit(source = 1) {
            const { gain, pan, clarity = 1 } = this._worldEffect(source, 30, 'impact');
            if (gain <= 0.035) return;
            this.synthTone(134, 48, 0.15, 'triangle', 0.19 * gain, { pan, attack: 0.002 });
            this.synthNoise(0.13, 640 * clarity, 'bandpass', 1.05, 0.21 * gain,
                { pan, endFrequency: 240 * clarity });
        }

        playWallBreak(source = 1) {
            this.playExplosion(source, 0.72);
            const { gain, pan, clarity = 1 } = this._worldEffect(source, 38, 'impact');
            if (gain <= 0.035) return;
            this.synthNoise(0.45, 920 * clarity, 'bandpass', 0.85, 0.34 * gain,
                { pan, delay: 0.04, endFrequency: 280 * clarity });
        }

        playShopBuy() {
            const uiVol = BO.Settings?.get('uiVolume') ?? 0.8;
            this._tryClip('overhaul/ui/buy.wav', { volume: 0.34 * uiVol, rateJitter: 0.05 }, () => {
                this.synthTone(587.33, 880, 0.12, 'triangle', 0.19, { pan: -0.14, dest: 'ui' });
                this.synthTone(880, 1174.66, 0.20, 'sine', 0.18, { delay: 0.075, pan: 0.14, dest: 'ui' });
            });
            this._metalImpact(1.52, 0.32 * uiVol);
        }

        playUIHover() {
            if (!this._canPlay('ui_hover', 45)) return;
            const uiVol = BO.Settings?.get('uiVolume') ?? 0.8;
            this._tryClip('overhaul/ui/click_002.ogg', { volume: 0.09 * uiVol, rate: 1.25, rateJitter: 0.08 }, () => {
                this.synthTone(980, 1180, 0.032, 'triangle', 0.065, { attack: 0.002, dest: 'ui' });
                this.synthNoise(0.014, 4200, 'bandpass', 3.2, 0.045, { attack: 0.001, endFrequency: 5600, dest: 'ui' });
            });
        }
        playUIBack() {
            if (!this._canPlay('ui_back', 40)) return;
            const uiVol = BO.Settings?.get('uiVolume') ?? 0.8;
            this._tryClip('overhaul/ui/back_001.ogg', { volume: 0.25 * uiVol, rateJitter: 0.05 }, () => {
                this.synthTone(440, 210, 0.068, 'triangle', 0.12, { attack: 0.002, dest: 'ui' });
                this.synthNoise(0.025, 1600, 'bandpass', 1.8, 0.06, { attack: 0.001, endFrequency: 700, dest: 'ui' });
            });
        }
        playUITab() {
            if (!this._canPlay('ui_tab', 35)) return;
            this.synthTone(740, 920, 0.042, 'triangle', 0.09, { attack: 0.0015, dest: 'ui' });
            this.synthNoise(0.016, 3200, 'bandpass', 2.6, 0.045, { attack: 0.001, dest: 'ui' });
        }
        playUIToggle(checked = true) {
            if (!this._canPlay('ui_toggle', 35)) return;
            const f0 = checked ? 520 : 680;
            const f1 = checked ? 860 : 410;
            this.synthTone(f0, f1, 0.055, 'triangle', 0.11, { attack: 0.0015, dest: 'ui' });
        }
        playUISliderTick() {
            if (!this._canPlay('ui_slider', 55)) return;
            this.synthTone(1120, 960, 0.018, 'sine', 0.05, { attack: 0.001, dest: 'ui' });
        }
        playUIDisabled() {
            if (!this._canPlay('ui_disabled', 90)) return;
            this.synthTone(165, 118, 0.075, 'sawtooth', 0.11, { attack: 0.002, filter: ['lowpass', 620, 1.0], dest: 'ui' });
        }
        playUIDragStart() {
            if (!this._canPlay('ui_drag', 40)) return;
            this.synthTone(380, 620, 0.045, 'triangle', 0.09, { attack: 0.002, dest: 'ui' });
        }
        playUIDrop() {
            if (!this._canPlay('ui_drop', 40)) return;
            this.synthTone(640, 420, 0.05, 'triangle', 0.11, { attack: 0.0015, dest: 'ui' });
            this.synthTone(840, 1080, 0.04, 'sine', 0.06, { delay: 0.025, dest: 'ui' });
        }
        playShieldRicochet(source = 1) {
            if (!this._canPlay('shield_ricochet', 35)) return;
            const { gain, pan } = this._worldEffect(source, 32, 'impact');
            if (gain <= 0.035) return;
            this._metalImpact(1.75 + Math.random() * 0.25, 0.55 * gain, pan);
            this.synthTone(1860, 980, 0.09, 'sine', 0.16 * gain, { pan, delay: 0.012 });
        }
        playWeaponEquip() {
            if (!this._canPlay('wpn_equip', 80)) return;
            this.synthNoise(0.055, 1950, 'bandpass', 1.4, 0.12, { endFrequency: 920 });
            this.synthTone(410, 220, 0.045, 'triangle', 0.10, { delay: 0.028, attack: 0.0015 });
        }
        playDryFire() {
            if (!this._canPlay('dry_fire', 45)) return;
            this.playEmptyClick();
        }
        playCardDraw() {
            const clip = Math.random() < 0.5 ? 'overhaul/cards/card_draw_1.wav' : 'overhaul/cards/card_draw_2.wav';
            this._tryClip(clip, { volume: 0.36, rateJitter: 0.08 }, () => {
                this.synthNoise(0.055, 2900, 'bandpass', 1.5, 0.12, { endFrequency: 1400, dest: 'ui' });
            });
        }
        playCardFan() {
            this._tryClip('overhaul/cards/card_fan.wav', { volume: 0.38, rateJitter: 0.05 }, () => {
                for (let i = 0; i < 4; i++) {
                    this.synthNoise(0.035, 2500 + i * 350, 'bandpass', 1.8, 0.08, { delay: i * 0.04, dest: 'ui' });
                }
            });
        }
        playQuestFanfare() {
            this._tryClip('overhaul/combat/LevelUpMW2.mp3', { volume: 0.38 }, () => {
                [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                    this.synthTone(f, f * 1.005, 0.34, 'triangle', 0.15, { delay: i * 0.09, dest: 'ui' });
                });
            });
        }
        playLootChime() {
            const hasCoin = this._hasClip('overhaul/env/coin_collect.wav');
            if (hasCoin) {
                BO.Assets.playClip('overhaul/env/coin_collect.wav', { volume: 0.30, rateJitter: 0.08 });
                this._tryClip('overhaul/ui/ching.wav', { volume: 0.22, rateJitter: 0.06 });
            } else {
                BO.Assets?.loadAudioBuffer?.('overhaul/env/coin_collect.wav');
                this.synthTone(987.77, 1318.5, 0.14, 'sine', 0.14, { dest: 'ui' });
                this.synthTone(1318.5, 1760, 0.18, 'triangle', 0.11, { delay: 0.06, dest: 'ui' });
            }
        }
        playPing() {
            if (!this._canPlay('ping', 60)) return;
            this._tryClip('overhaul/combat/mw2_ping.mp3', { volume: 0.32, rateJitter: 0.05 }, () => {
                this.synthTone(1480, 1480, 0.16, 'sine', 0.13, { attack: 0.002, dest: 'ui' });
            });
        }
        playTurretPlace() {
            this._metalImpact(1.2, 0.45);
            this._tryClip('overhaul/ui/confirmation_001.ogg', { volume: 0.32, rateJitter: 0.06 }, () => {
                this.synthTone(220, 440, 0.09, 'triangle', 0.14, { delay: 0.04 });
            });
        }
        playGoreImpact(heavy = false) {
            if (!this._canPlay('gore', 35)) return;
            const clip = heavy ? 'overhaul/combat/bone_snap.wav' : 'overhaul/combat/crunch_splat.wav';
            this._tryClip(clip, { volume: heavy ? 0.34 : 0.24, rateJitter: 0.10 }, () => {
                this.synthNoise(heavy ? 0.12 : 0.075, heavy ? 880 : 1250, 'bandpass', 0.9, heavy ? 0.26 : 0.18, { endFrequency: 240 });
                if (heavy) this.synthTone(165, 68, 0.07, 'triangle', 0.19, { attack: 0.002 });
            });
        }
        playMatchStinger(victory = true) {
            const clip = victory ? 'overhaul/stingers/level_complete.wav' : 'overhaul/ui/error_001.ogg';
            this._tryClip(clip, { volume: 0.36 }, () => {
                const notes = victory ? [392, 493.88, 587.33, 783.99] : [293.66, 261.63, 220, 174.61];
                notes.forEach((f, i) => this.synthTone(f, f, 0.36, 'triangle', 0.16, { delay: i * 0.11, dest: 'ui' }));
            });
        }

        playMonkeyChime(source = 1) {
            const { gain, pan, clarity = 1 } = this._worldEffect(source, 32, 'impact');
            if (gain <= 0.035) return;
            this.synthTone(1040, 1260, 0.085, 'triangle', 0.16 * gain, { pan, attack: 0.002 });
            this.synthTone(2120, 2480, 0.07, 'sine', 0.09 * gain, { pan: -pan * 0.5, delay: 0.01 });
            this.synthNoise(0.042, 4400 * clarity, 'highpass', 1.4, 0.11 * gain, { pan });
        }

        _playMenuBar() {
            const harmony = [
                [38, 45, 50, 53], [34, 41, 46, 50], [41, 48, 53, 57], [36, 43, 48, 51],
                [38, 45, 50, 53], [31, 38, 46, 50], [34, 41, 46, 53], [33, 40, 46, 49]
            ];
            const melody = [
                [62, null, 65, 64], [62, null, 58, null], [60, 65, null, 69], [67, null, 63, null],
                [65, null, 64, 62], [58, 62, null, 65], [70, null, 65, 62], [61, null, 58, 57]
            ];
            const bar = this.menuBar++ % harmony.length;
            const hz = (note) => 440 * Math.pow(2, (note - 69) / 12);
            harmony[bar].forEach((note, i) => {
                this.playTone(hz(note), hz(note), 2.65, i === 0 ? 'sine' : 'triangle', i === 0 ? 0.19 : 0.055, i * 0.045, 'music');
            });
            melody[bar].forEach((note, i) => {
                if (note === null) return;
                this.playTone(hz(note), hz(note), 0.86, 'triangle', 0.077, 0.24 + i * 0.68, 'music');
                this.playTone(hz(note), hz(note), 0.65, 'sine', 0.022, 0.55 + i * 0.68, 'music');
            });
            for (const beat of [0, 1.5, 2.25]) {
                this.playTone(72, 31, 0.29, 'sine', 0.19, beat, 'music');
            }
        }

        startMusic(mode) {
            if (this.musicMode === mode) return;
            this.stopMusic(false);
            this.musicMode = mode;
            this.menuBar = 0;

            const stagedTracks = {
                menu: ['overhaul/music/after_the_end.m4a', 0.20],
                mp: ['overhaul/music/action_strike.m4a', 0.18],
                zombies: ['overhaul/music/abstract_anxiety.m4a', 0.20],
                td: ['overhaul/music/behind_enemy_lines.m4a', 0.18],
                owrpg: ['overhaul/music/cold_journey.m4a', 0.20],
                owrpg_combat: ['overhaul/music/beginning_of_conflict.m4a', 0.22],
                rpg: ['overhaul/music/behind_the_sword.m4a', 0.19],
                boss: ['overhaul/music/action_strike.m4a', 0.24]
            };
            const tr = stagedTracks[mode];
            if (tr && BO.Assets?.crossfadeMusic) {
                BO.Assets.crossfadeMusic(tr[0], { volume: tr[1], fadeSec: 0.85 });
                return;
            }

            // Procedural fallback when Web Audio clip streaming is unavailable.
            const playPulse = () => {
                if (!this.musicMode) return;
                const s = BO.Settings.all;
                if ((s.musicVolume ?? 0.55) <= 0.02) return;
                if (!this.ctx || this.ctx.state !== 'running') return;

                if (this.musicMode === 'menu') {
                    this._playMenuBar();
                } else if (this.musicMode === 'rpg' || this.musicMode === 'owrpg') {
                    this.playTone(65.4, 65.4, 2.6, 'triangle', 0.13, 0, 'music');
                    this.playTone(98, 97, 2.0, 'sine', 0.09, 0.6, 'music');
                    this.playTone(155.6, 155.6, 1.2, 'sine', 0.05, 1.6, 'music');
                } else if (this.musicMode === 'zombies' || this.musicMode === 'boss') {
                    this.playTone(49, 48, 2.4, 'sawtooth', 0.09, 0, 'music');
                    this.playTone(146.8, 138.6, 1.8, 'sine', 0.10, 0.8, 'music');
                }
            };

            playPulse();
            this.musicTimer = setInterval(playPulse, mode === 'menu' ? 3000 : 3200);
        }

        stopMusic(stopClips = true) {
            this.musicMode = null;
            if (this.musicTimer) {
                clearInterval(this.musicTimer);
                this.musicTimer = null;
            }
            if (stopClips && BO.Assets?.stopMusicClips) BO.Assets.stopMusicClips(0.45);
            if (stopClips && BO.Assets?.stopAmbient) BO.Assets.stopAmbient(0.45);
        }
    }

    BO.Sound = new SoundEngine();
})(window);
