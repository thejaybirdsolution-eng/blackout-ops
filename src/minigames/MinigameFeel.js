/* ============================================================================
   BLACKOUT OPS — Minigames · Feel Layer (sampled impacts + announcer)
   One shared layer that upgrades all 63 minigames at once with recorded audio
   from the asset library, on top of the synthesized cues in MinigameCore:

   - Kill impacts: a sampled hit picked from the target's material — steel
     plates ring, glass shatters, wood thunks, clay pops, bullseyes toll a bell.
     Courses can force a material with `def.feel = { impact: 'glass' }`.
   - Announcer: combo callouts (10 / 25 / 50), "combo breaker", "hurry up" in
     the final 10 s of timed courses, "time over", Boss Rush round calls and a
     "flawless victory" for perfect-accuracy platinum runs.
   - Never stacks voices: a 1.1 s voice gate keeps callouts from talking over
     each other or the results voice.
============================================================================ */
(function (BO) {
    'use strict';

    const VOICE = 'audio/voice/Voiceover Pack (Kenney)/Male/';
    const FIGHT = 'audio/voice/Voiceover Pack Fighter (Kenney)/Audio/';
    const IMPACT = 'audio/sfx/Impact Sounds (Kenney)/Audio/';
    const pick5 = (base) => IMPACT + base + '_00' + Math.floor(Math.random() * 5) + '.ogg';

    /** Material → sampled impact family. */
    const IMPACTS = {
        steel: () => pick5('impactPlate_medium'),
        heavy: () => pick5('impactPlate_heavy'),
        metal: () => pick5('impactMetal_medium'),
        glass: () => pick5('impactGlass_medium'),
        wood: () => pick5('impactPlank_medium'),
        soft: () => pick5('impactGeneric_light'),
        punch: () => pick5('impactPunch_medium'),
        bell: () => pick5('impactBell_heavy')
    };

    /** Target death animation / kind → material. */
    function materialOf(tg, def) {
        if (def && def.feel && def.feel.impact) return def.feel.impact;
        const k = String(tg.kind || ''), d = String(tg.death || '');
        if (/glass|bottle|shatter|ice|crystal/.test(k + d)) return 'glass';
        if (/balloon|pop|bubble|clay|skeet|disc/.test(k + d)) return 'soft';
        if (/wood|crate|barrel|plank|board/.test(k + d)) return 'wood';
        if (/mole|zombie|ghost|bandit|outlaw|enemy|dummy|monster|human/.test(k + d)) return 'punch';
        if (/drone|robot|mech|metal|steel|plate|popper|gong/.test(k + d)) return 'metal';
        return 'steel';
    }

    const Feel = {
        voiceGate: 0,
        lastSaid: '',
        enabled: true,
        _hurry: false,

        _now() { return performance.now() / 1000; },

        say(path, volume = 0.82, force) {
            if (!BO.Assets || !BO.Assets.playClip) return false;
            const t = this._now();
            if (!force && t < this.voiceGate) return false;
            this.voiceGate = t + 1.1;
            this.lastSaid = path;
            BO.Assets.playClip(path, { volume });
            return true;
        },

        /** Session reset (MinigameRuntime.start). */
        onStart(def) {
            this.voiceGate = this._now() + 0.4;
            this._hurry = false;
            this._def = def;
        },

        onKill(tg, info, def, label) {
            if (!this.enabled || !BO.Assets || !tg || tg._feelPlayed) return;
            tg._feelPlayed = true;   // custom onHit handlers may route through hitTarget too
            const bull = /BULLSEYE/.test(label || '');
            const mat = bull ? 'bell' : (info && info.hitbox === 'head' ? 'heavy' : materialOf(tg, def));
            BO.Assets.playClip(IMPACTS[mat](), { volume: bull ? 0.42 : 0.34, rateJitter: 0.07, volJitter: 0.12 });
        },

        onCombo(n) {
            if (n === 10) this.say(FIGHT + 'combo.ogg');
            else if (n === 25) this.say(FIGHT + 'multi_kill.ogg');
            else if (n === 50) this.say(VOICE + 'level_up.ogg');
        },

        onComboBreak(n) { if (n >= 10) this.say(FIGHT + 'combo_breaker.ogg', 0.78); },

        /** Called every frame while a timed course runs. */
        onTick(S) {
            if (!S || !S.duration || this._hurry) return;
            if (S.duration >= 25 && S.duration - S.t <= 10) { this._hurry = true; this.say(VOICE + 'hurry_up.ogg', 0.8, true); }
        },

        onFinish(label) { if (label === 'TIME!') this.say(VOICE + 'time_over.ogg', 0.8, true); },

        /** Results card: a second voice beat for perfect / failed runs (after the core's verdict clip). */
        onResults(res, maxStars) {
            if (!res) return;
            const perfect = res.stars >= Math.max(3, maxStars) && (res.accuracy || 0) >= 0.999;
            const clip = perfect ? FIGHT + 'flawless_victory.ogg' : res.stars >= Math.max(3, maxStars) ? FIGHT + 'you_win.ogg' : null;
            if (clip) setTimeout(() => this.say(clip, 0.85, true), 1500);
        },

        /** Boss Rush: announce each boss. */
        onBossRound(index, total) {
            const last = index >= total - 1;
            this.say(last ? FIGHT + 'final_round.ogg' : index < 5 ? FIGHT + 'round_' + (index + 1) + '.ogg' : FIGHT + 'prepare_yourself.ogg', 0.88, true);
        },

        onBossDown() { this.say(FIGHT + 'winner.ogg', 0.8); },

        materialOf
    };

    BO.MinigameFeel = Feel;
})(window.BO);
