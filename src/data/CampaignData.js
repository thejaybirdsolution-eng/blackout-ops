/* ============================================================================
   BLACKOUT OPS — Capstone: Operation Blackout (10-Mission Cross-Mode Story)
   Option A from docs/1.0_PLAN.md:
   - 10 sequential missions spanning all 7 game modes
   - Handlers: Director Reyes & Vanguard Soren
   - Connects directly to ProfileSystem XP, Calling Cards, Emblems & Titles
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO = global.BO || {};

    const MISSIONS = [
        {
            id: 'm01_range_qual', index: 1, code: 'OP-01', mode: 'minigames',
            title: 'Live-Fire Qualification',
            speaker: 'Director Reyes',
            briefing: 'Before deploying to the Quarantine Perimeter, calibrate optics and trigger discipline at the Task Force live-fire course.',
            objectiveText: 'Complete Range Day qualification with Bronze star or higher.',
            launchOpts: { mode: 'minigame', id: 'range_day' },
            rewardXp: 300,
            rewardEmblem: 'emb_crosshair',
            debriefChoices: [
                { id: 'precision', label: 'Precision Spec (+Focus Calibration)', note: 'Flagged as sharpshooter lead in Reyes dossier.' },
                { id: 'tempo', label: 'Aggressive Tempo (+Assault Pace)', note: 'Assigned point-man breacher clearance.' }
            ]
        },
        {
            id: 'm02_killhouse_breach', index: 2, code: 'OP-02', mode: 'mp',
            title: 'Killhouse Breach Drill',
            speaker: 'Vanguard Soren',
            briefing: 'Strike teams must clear tight CQB sightlines cleanly. Deploy into Killhouse TDM and establish arena superiority.',
            objectiveText: 'Finish a Team Deathmatch engagement on Killhouse.',
            launchOpts: { mode: 'mp', mapId: 'killhouse', modeType: 'tdm', difficulty: 'regular' },
            rewardXp: 400,
            debriefChoices: [
                { id: 'cqb', label: 'Close-Quarters Doctrine', note: 'Soren endorses heavy point offense.' },
                { id: 'overwatch', label: 'Flank Overwatch', note: 'Maintains disciplined perimeter control.' }
            ]
        },
        {
            id: 'm03_bunker_outbreak', index: 3, code: 'OP-03', mode: 'zombies',
            title: 'Sublevel Signal',
            speaker: 'Director Reyes',
            briefing: 'Emergency relays went dark beneath Der Bunker. Restore facility power, survive the undead surge, or reach extraction.',
            objectiveText: 'Deploy to Der Bunker Zombies and flip power / complete an engagement.',
            launchOpts: { mode: 'zombies', mapId: 'der_bunker', difficulty: 'normal' },
            rewardXp: 480,
            rewardEmblem: 'emb_skull',
            debriefChoices: [
                { id: 'salvage', label: 'Recover Lab Logs', note: 'Secures early Meridian toxin schematics.' },
                { id: 'purge', label: 'Seal the Vault Doors', note: 'Contains outbreak pressure around Sector 1.' }
            ]
        },
        {
            id: 'm04_castle_hold', index: 4, code: 'OP-04', mode: 'td',
            title: 'Bastion Line',
            speaker: 'Vanguard Soren',
            briefing: 'Hold the fortified Castle Keep perimeter while heavy siege waves probe our outer masonry.',
            objectiveText: 'Defend Castle Keep across siege waves in Tower Defense.',
            launchOpts: { mode: 'td', mapId: 'td_castle_1', tdConfig: { difficulty: 'medium' } },
            rewardXp: 520,
            rewardEmblem: 'emb_shield',
            debriefChoices: [
                { id: 'fortify', label: 'Bolster Outer Ramparts', note: 'Prioritizes automated turret perimeters.' },
                { id: 'counter', label: 'Counter-Battery Fire', note: 'Shifts heavy munitions forward.' }
            ]
        },
        {
            id: 'm05_zone_recon', index: 5, code: 'OP-05', mode: 'survival',
            title: 'Exclusion Zone Sweep',
            speaker: 'Director Reyes',
            briefing: 'Cross into the 500 m Exclusion Zone to verify Lantern interference and complete an expedition ending.',
            objectiveText: 'Deploy to Exclusion Zone Survival and achieve an expedition ending.',
            launchOpts: { mode: 'survival', difficulty: 'tactical' },
            rewardXp: 650,
            rewardEmblem: 'emb_lantern',
            debriefChoices: [
                { id: 'seal', label: 'Quarantine Seal Protocol', note: 'Stabilizes atmospheric contamination.' },
                { id: 'extract', label: 'Extract Core Research', note: 'Transfers samples to Haven scientists.' }
            ]
        },
        {
            id: 'm06_haven_delve', index: 6, code: 'OP-06', mode: 'rpg',
            title: 'The Deep Key',
            speaker: 'Director Reyes',
            briefing: 'Descend into the Rogue Lite Vaults beneath Haven to retrieve the harmonic cipher key and extract alive.',
            objectiveText: 'Complete a Rogue Lite delve (extract or clear Guardian floor).',
            launchOpts: { mode: 'rpg', resume: false, startFloor: 1 },
            rewardXp: 680,
            rewardEmblem: 'emb_relic',
            debriefChoices: [
                { id: 'extract', label: 'Bank Full Vault Cipher', note: 'Feeds cipher keys directly into Meridian uplinks.' },
                { id: 'overclock', label: 'Preserve Dark Relics', note: 'Retains volatile relic resonance for Act II.' }
            ]
        },
        {
            id: 'm07_sprawl_signal', index: 7, code: 'OP-07', mode: 'owrpg',
            title: 'Rust Sprawl Uplinks',
            speaker: 'Vanguard Soren',
            briefing: 'Cross Haven Basin into Rust Sprawl in Operation Meridian. Ally with Soren, clear Goliath Crane, and advance Act II quests.',
            objectiveText: 'Deploy to Open World RPG and complete an Act mission or quest stage.',
            launchOpts: { mode: 'owrpg', slot: 0 },
            rewardXp: 760,
            rewardEmblem: 'emb_compass',
            debriefChoices: [
                { id: 'militia', label: 'Back Freestead Militia', note: 'Strengthens frontier logistics for final push.' },
                { id: 'syndicate', label: 'Leverage Syndicate Rails', note: 'Opens heavy freight shortcuts toward Meridian Core.' }
            ]
        },
        {
            id: 'm08_omega_purge', index: 8, code: 'OP-08', mode: 'zombies',
            title: 'Station Omega Overload',
            speaker: 'Director Reyes',
            briefing: 'A second containment breach erupted at Station Omega. Cut the surge before Bosses breach the telemetry array.',
            objectiveText: 'Deploy to Station Omega Zombies on Hard difficulty.',
            launchOpts: { mode: 'zombies', mapId: 'station_omega', difficulty: 'hard' },
            rewardXp: 820,
            debriefChoices: [
                { id: 'vent', label: 'Purge Cooling Channels', note: 'Prevents cascade meltdown across neighboring sectors.' },
                { id: 'override', label: 'Bypass Reactor Lock', note: 'Feeds emergency power toward Orbital Uplink.' }
            ]
        },
        {
            id: 'm09_terminal_intercept', index: 9, code: 'OP-09', mode: 'mp',
            title: 'Terminal Intercept',
            speaker: 'Vanguard Soren',
            briefing: 'Hostile cells seized Terminal concourses to scramble Orbital Dispatches. Secure Domination zones across the concourse.',
            objectiveText: 'Finish a Domination match on Terminal.',
            launchOpts: { mode: 'mp', mapId: 'mp_terminal', modeType: 'dom', difficulty: 'hardened' },
            rewardXp: 900,
            debriefChoices: [
                { id: 'uplink', label: 'Lock Orbital Flightpath', note: 'Prepares Meridian Core strike corridor.' },
                { id: 'blackout', label: 'Go Radio Silent', note: 'Masks final squad insertion from Sovereign sensors.' }
            ]
        },
        {
            id: 'm10_blackout_zero', index: 10, code: 'OP-10', mode: 'owrpg',
            title: 'Operation Blackout Zero',
            speaker: 'Director Reyes',
            briefing: 'The Meridian Containment Dome stands open. Enter Meridian Core, confront the Sovereign, and seal Operation Blackout.',
            objectiveText: 'Deploy to Meridian Finale in Open World RPG & finalize Operation Blackout.',
            launchOpts: { mode: 'owrpg', slot: 0 },
            rewardXp: 1500,
            rewardCard: 'card_operation_blackout',
            rewardEmblem: 'emb_blackout',
            rewardTitle: 'BLACKOUT LEGEND',
            debriefChoices: [
                { id: 'shatter', label: 'Shatter the Meridian Sovereign', note: 'Destroys the anomaly core permanently.' },
                { id: 'harmonize', label: 'Contain & Harmonize Lattice', note: 'Reclaims clean Meridian power for all settlements.' }
            ]
        }
    ];

    BO.CampaignData = {
        TITLE: 'Operation Blackout',
        MISSIONS,
        get(id) { return MISSIONS.find((m) => m.id === id) || null; }
    };
})(window);
