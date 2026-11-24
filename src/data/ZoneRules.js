/* ============================================================================
   BLACKOUT OPS — Grounding Survival's rules for the Exclusion Zone
   Survival now always runs in the Zone, so operations, presets and modifiers
   that referred to the old valley (Evac Ridge, the Research Trench, Commander
   Sable) or to cut systems (runes, Sites of Grace, flasks, talismans, Aether
   meteors, mimics) are rewritten or removed here, in one place.
============================================================================ */
(function (BO) {
    'use strict';
    const R = BO.SurvivalRules;
    if (!R) return;

    /* ------------------------------------------------------------ operations */
    Object.assign(R.modes, {
        expedition: { name: 'The Lantern', description: 'The full story. Survive the crash, restore the Relay mast, repair three radio towers, recover the campus keycards and research, defeat the Warden and decide the Lantern\'s fate.' },
        homestead: { name: 'Homestead', description: 'Build a base of at least 12 structures with a bed, a crafting table and a storage chest, then survive two horde nights.' },
        survey: { name: 'Survey Circuit', description: 'Discover seven of the ten regions and repair all three radio towers.' },
        salvage: { name: 'Salvage Run', description: 'Bring 12 iron ore, 8 sawn boards, 4 coal and 10 salvage to Haven (the survivor camp east of the Relay mast).' },
        bounty: { name: 'PMC Bounty', description: 'Clear four PMC garrisons at the freight yards, turbine hall, mine head and refinery.' },
        siege: { name: 'Last Stand', description: 'A horde comes every second night instead of every third. Survive three of them.' },
        bloodmoon: { name: 'Nightly Hordes', description: 'A horde comes every single night, starting with the first. Survive five.' },
        gauntlet: { name: 'Guardian Gauntlet', description: 'Defeat four of the named infected that guard the Zone (the Butcher, the Den Mother, the Yard Colossus, the Spillway Bloat, the Pale Maul, the Cinder Regent).' },
        scavenger: { name: 'Zero-to-Hero', description: 'The Lantern story, but you wake from the crash bare-handed with no gun and no ammunition. Scavenge, craft and loot your way up.' },
        freeplay: { name: 'Free Roam', description: 'No objective. Explore, scavenge, build and survive as long as you like; the Lantern can still be decided whenever you find the research.' }
    });

    /* ------------------------------------------------------------ presets */
    if (R.presets.bloodmoon) Object.assign(R.presets.bloodmoon, {
        name: 'Horde Fortress', description: 'A horde every night. Build, trap and turret your way through five of them.',
        settings: { ...R.presets.bloodmoon.settings, gameType: 'bloodmoon', modifiers: (R.presets.bloodmoon.settings.modifiers || []).filter((m) => !['soulsDrop', 'bloodMoonEveryNight'].includes(m)) }
    });
    if (R.presets.tarnished) Object.assign(R.presets.tarnished, {
        name: 'Monster Hunter', description: 'Veteran difficulty, doubled named infected, infectious bites and freezing nights. Hunt four guardians.',
        settings: { ...R.presets.tarnished.settings, gameType: 'gauntlet', modifiers: (R.presets.tarnished.settings.modifiers || []).filter((m) => m !== 'soulsDrop') }
    });

    /* ------------------------------------------------------------ modifiers */
    const M = R.modifiers;
    const REMOVE = [
        // Cut systems: runes, Sites of Grace, flasks, talismans, infusions-for-free, Aether meteors, mimics, evac holds.
        'soulsDrop', 'sv_flask_overflow', 'sv_talisman_four', 'sv_shrine_start_lit', 'sv_rune_hoard', 'sv_cheap_attributes', 'sv_purist_no_flask',
        'sv_rune_wealth_start', 'sv_grace_blessing_long', 'sv_echo_safe_runes', 'sv_arcane_master_sv', 'sv_talisman_starter', 'sv_beacon_discount_sv',
        'sv_aurora_nights', 'sv_meteor_rain', 'sv_blood_moon_rewards_x2', 'sv_permadeath_high_stakes', 'sv_cursed_heavy_pack', 'sv_timed_evac_intense',
        'quickEvac', 'sv_cartographer_pins', 'sv_mimic_ambush_sv', 'sv_free_aether_altar'
    ];
    for (const id of REMOVE) delete M[id];
    const text = (id, patch) => { if (M[id]) Object.assign(M[id], patch); };
    text('noPatrols', { description: 'Roaming PMC patrols are disabled. Garrisons still hold their sites, and airdrops still draw a squad.' });
    text('noRoamers', { description: 'Ordinary roaming infected and horde nights are disabled. Named guardians, PMC garrisons and world events still happen. Horde goals count nights survived instead.' });
    text('bloodMoonEveryNight', { name: 'Nightly hordes', ico: '🌘', description: 'A horde comes every night instead of every third night.' });
    text('ironRun', { description: 'One life. Checkpoints are disabled and death ends the expedition.' });
    text('graceExtended', { group: 'world', description: 'Doubles the enemy-free opening period after the crash from 60 to 120 seconds.' });
    text('sv_no_map_gps', { description: 'The compass tape is hidden. Navigate by landmarks, the map and the Lantern beam.' });
    text('sv_one_life_titan', { description: 'Named infected and the Warden have 1.8× health.' });
    text('sv_crazed_sprinters_sv', { description: 'Infected move 30% faster at night.' });
    text('sv_dual_boss_bounty', { description: 'Killing any named infected awards +2 Tech Points.' });
    text('sv_boss_enrage_early', { description: 'Named infected enrage earlier, at 65% health.' });
    text('infectBite', { description: 'Infected hits can cause bleeding and infection. Treat with bandages, medkits and antibiotics.' });
    text('sv_lead_lined_blood', { description: 'Radiation builds up 55% slower everywhere — the campus, the Crater and Lantern surges included.' });
    text('abundantTech', { description: 'Start with +3 Tech Points and earn Tech Points twice as fast.' });
    text('sv_bench_mk_discount', { description: 'Weapon Mk II / Mk III bench upgrades cost 40% fewer resonance crystals.' });
    text('footOnly', { description: 'Vehicles, the freight handcar and fast travel are disabled.' });
    text('sv_npc_discount_sv', { description: 'Haven traders give you better barters.' });
    text('sv_triple_infusions', { name: 'Triple resonance mods', description: 'Up to three resonance mods can be active at once instead of two.' });
    text('sv_calm_skies', { description: 'Disables blizzards, rad fog and ash storms across the whole Zone.' });
    text('sv_start_infuse_fortune', { description: 'Start with the Fortune resonance mod already active on your gear.' });
    // Any remaining description that still mentions runes loses that clause.
    for (const m of Object.values(M)) {
        if (typeof m.description === 'string') m.description = m.description.replace(/\s*(?:&|and|,)?\s*(?:\+?\d+%\s*)?(?:more\s+|bonus\s+)?(?:Aether\s+)?Runes?(?:\s+drops?)?/gi, '').replace(/\s+([.!,])/g, '$1').replace(/Aether Shards?/g, 'resonance crystals');
        if (typeof m.name === 'string') m.name = m.name.replace(/Aether/g, 'Resonance');
    }

    /* ------------------------------------------------------------ presets: drop removed modifiers, ground the copy */
    const PRESET_TEXT = {
        standard: 'The full Lantern story at standard difficulty.',
        builder: 'Homestead with no roaming infected or patrols, rich loot and fast crops: build a proper base and see out two nights.',
        industrial: 'Free roam focused on mining, smelters, generators, turrets and weapon schematics.',
        zeroToHero: 'Wake from the crash bare-handed with a longer safe start. Loot, craft and forge your way through the Lantern story.',
        night: 'The Lantern story in permanent darkness with relentless nights.',
        iron: 'The Lantern story on foot, bare-handed, with one life and no checkpoints.',
        chart: 'Survey Circuit with extra ammunition and no roaming PMC patrols.',
        miner: 'Salvage Run with durable tools, rich loot and big packs.',
        siege: 'Last Stand with armour, extra ammunition and stronger turrets: a horde every second night, survive three.',
        peaceful: 'Free roam with no roaming infected, no patrols and no horde nights. Build, farm, fish and explore.'
    };
    for (const [id, p] of Object.entries(R.presets)) {
        if (p.settings?.modifiers) p.settings.modifiers = p.settings.modifiers.filter((m) => M[m]);
        if (PRESET_TEXT[id]) p.description = PRESET_TEXT[id];
    }
    if (R.presets.siege) R.presets.siege.name = 'Last Light';

    /* ------------------------------------------------------------ categories & bundles */
    const cats = R.categories;
    if (Array.isArray(cats)) {
        for (let i = cats.length - 1; i >= 0; i--) if (!Object.values(M).some((m) => m.group === cats[i].id)) cats.splice(i, 1);
        for (const c of cats) {
            if (c.id === 'hardcore') c.name = 'Trials & Hordes';
            if (c.id === 'crafting') c.name = 'Mining & Mods';
            if (c.id === 'vitals') c.name = 'Vitals & Stims';
        }
    }
    const bundles = R.bundles;
    if (Array.isArray(bundles)) {
        for (let i = bundles.length - 1; i >= 0; i--) {
            const b = bundles[i];
            b.keys = (b.keys || []).filter((k) => M[k]);
            if (b.id === 'sv_elden_tarnished' || b.keys.length < 2) bundles.splice(i, 1);
            else if (b.desc) b.desc = b.desc.replace(/Tri-Infusion Altar/g, 'three resonance mods');
        }
    }
})(window.BO);
