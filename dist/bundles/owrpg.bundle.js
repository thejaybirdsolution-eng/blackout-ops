/* BLACKOUT OPS — owrpg.bundle.js (30 files) | Dev-generated IIFE bundle (ADR-002) */

/* --- src/data/OWRPGStatsData.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG ("Operation Meridian" 2.0) · Stats & Items Data
   - Level 1 start, Level Cap 50, Hardcore RuneScape/Classic-style XP curve
   - 7 Full Perk Trees × 6 Tiers = 84 Perks (mutually exclusive pairs)
   - 6 Level-by-Doing Mastery Skills (Combat, Slayer, Delving, Foraging, Mining, Arcana)
   - 8 Skyrim-style Standing Stone Blessings
   - 70 Distinct Enemy & Boss Archetypes (with 3D GLB model bindings & TTK-calibrated stats)
   - Preserves starter derived stat formulas verified by _qa_owrpg.html
============================================================================ */
(function (BO) {
    'use strict';

    const ATTRS = [
        { id: 'BRW', name: 'Brawn', desc: '+8 max HP and +6 kg carry weight per point, +6% melee damage. Brute-force checks.' },
        { id: 'RFX', name: 'Reflex', desc: '+3.5% ADS/swap speed, -3% spread per point, longer dodge window. Quick-draw checks.' },
        { id: 'TCH', name: 'Tech', desc: '-4% ability cooldown and +7% status potency per point. Hacking and repair checks.' },
        { id: 'PRC', name: 'Perception', desc: '+4.5% weakspot multiplier, -4% crouch noise per point. Insight checks.' },
        { id: 'PRS', name: 'Presence', desc: '-3.5% buy / +3.5% sell price, +8% reputation gains per point. Persuasion checks.' }
    ];
    const ATTR_IDS = ATTRS.map((a) => a.id);
    const ATTR_BASE = 5, ATTR_MIN = 1, ATTR_MAX = 15, CREATION_POINTS = 8;
    const LEVEL_CAP = 50;

    /** Hardcore RuneScape / Classic RPG XP curve: steep grind from Level 1 to 50.
     *  L1 -> L2 = 600 XP; L5 -> L6 = 10,653 XP; L10 -> L11 = 38,948 XP; L25 -> L26 = 221,922 XP; L49 -> L50 = 799,944 XP. */
    function xpToNext(L) { return Math.round(450 * Math.pow(L, 1.92) + 150 * L); }

    /* --------------------------------------------------------- 7 Level-by-Doing Skills (RuneScape / Dragonwilds style) */
    const SKILLS = {
        combat:   { id: 'combat',   name: 'Arms Mastery',  color: '#ef4444', icon: '⚔', desc: 'Leveled by gun & melee combat. Grants +0.5% weapon damage per level.' },
        slayer:   { id: 'slayer',   name: 'Slayer',        color: '#f97316', icon: '☠', desc: 'Leveled by hunting beasts, undead, and bosses. Grants +0.6% monster/boss damage per level.' },
        delving:  { id: 'delving',  name: 'Dungeoneering', color: '#a855f7', icon: '🗝', desc: 'Leveled by delving dungeons & opening chests. Grants +0.8% loot credits per level.' },
        foraging: { id: 'foraging', name: 'Foraging',      color: '#4ade80', icon: '🌿', desc: 'Leveled by harvesting herbs & timber. Grants +0.6% med/potion healing & bonus gather chance.' },
        mining:   { id: 'mining',   name: 'Artisan Mining',color: '#38bdf8', icon: '⛏', desc: 'Leveled by mining ore veins & salvaging gear. Grants +0.7% salvage yield & slower gear wear.' },
        arcana:   { id: 'arcana',   name: 'Runecraft',     color: '#c084fc', icon: '✦', desc: 'Leveled by elemental reactions & runic crystals. Grants +0.6% reaction & ability damage per level.' },
        exploration: { id: 'exploration', name: 'Pathfinding', color: '#fbbf24', icon: '🧭', desc: 'Leveled by charting unexplored land, syncing vistas and uncovering hidden sites. Grants +0.2% move speed and +1% discovery rewards per level.' }
    };
    const SKILL_CAP = 99;
    function skillXpToNext(L) { return Math.round(85 * Math.pow(L, 1.58) + 45 * L); }

    /* --------------------------------------------------------- 8 Standing Stones (Skyrim style) */
    const STANDING_STONES = {
        stone_warrior:  { id: 'stone_warrior',  name: 'The Warrior Stone',    color: '#ef4444', desc: '+12% Weapon & Melee Damage and +15 Armor.', fx: { allDmgMult: 0.12, armor: 15 } },
        stone_shadow:   { id: 'stone_shadow',   name: 'The Shadow Stone',     color: '#a3e635', desc: '-30% Movement Noise, +0.45x Sneak Multiplier, +8% Move Speed.', fx: { noise: -0.30, stealthMult: 0.45, speedMult: 0.08 } },
        stone_mage:     { id: 'stone_mage',     name: 'The Ritual Mage Stone',color: '#38bdf8', desc: '-18% Ability Cooldowns and +25% Status Duration.', fx: { cdr: 0.18, statusDur: 0.25 } },
        stone_lover:    { id: 'stone_lover',    name: "The Pilgrim's Stone",  color: '#fde047', desc: '+20% Character XP and +25% Mastery Skill XP from all sources.', fx: { xpMult: 0.20, skillXpMult: 0.25 } },
        stone_steed:    { id: 'stone_steed',    name: 'The Steed Stone',      color: '#22d3ee', desc: '+40 kg Carry Weight and +10% Movement Speed.', fx: { carry: 40, speedMult: 0.10 } },
        stone_slayer:   { id: 'stone_slayer',   name: 'The Monster Stone',    color: '#f97316', desc: '+20% Damage vs Beasts/Bosses and Kills restore +10 HP.', fx: { bossDmg: 0.20, killHeal: 10 } },
        stone_atronach: { id: 'stone_atronach', name: 'The Bastion Stone',    color: '#c084fc', desc: '+35 Max HP and +15% All Elemental Resistances.', fx: { maxHp: 35, allElemRes: 0.15 } },
        stone_dragon:   { id: 'stone_dragon',   name: 'The Dragonwild Stone', color: '#fbbf24', desc: '+30% Elemental Reaction Damage and +18 Armor Penetration.', fx: { reactMult: 0.30, bonusPen: 18 } }
    };

    /* ------------------------------------------------------------------ 9 Perk Trees × 6 Tiers = 108 Perks */
    const TIER_LEVELS = [2, 6, 12, 18, 26, 36];
    const PERK_TREES = {
        vanguard: {
            name: 'Vanguard', color: '#f97316', icon: 'staged_assets/ui/fantasy_rpg_icons/Classes/warrior-class-001.png',
            tiers: [
                [{ id: 'van_t1_plating', name: 'Field Plating', desc: '+25 max HP.', fx: { maxHp: 25 } },
                    { id: 'van_t1_packmule', name: 'Pack Mule', desc: '+15 kg carry weight.', fx: { carry: 15 } }],
                [{ id: 'van_t2_bulwark', name: 'Bulwark', desc: 'Take 12% less damage while crouched.', fx: { crouchDR: 0.12 } },
                    { id: 'van_t2_bloodrush', name: 'Blood Rush', desc: 'Kills heal 8 HP.', fx: { killHeal: 8 } }],
                [{ id: 'van_t3_thermite', name: 'Thermite Rounds', desc: 'Every 6th hit applies Burn.', fx: { nthBurn: 6 } },
                    { id: 'van_t3_breacher', name: 'Breacher', desc: '+20 armor penetration with shotguns and LMGs.', fx: { heavyPen: 20 } }],
                [{ id: 'van_t4_juggernaut', name: 'Juggernaut', desc: '+15 armor.', fx: { armor: 15 } },
                    { id: 'van_t4_warcry', name: 'War Cry', desc: 'Detonator also heals 20 HP.', fx: { detHeal: 20 } }],
                [{ id: 'van_t5_unstoppable', name: 'Unstoppable', desc: 'Once per 120 s, lethal damage leaves you at 1 HP.', fx: { cheatDeath: 120 } },
                    { id: 'van_t5_demolisher', name: 'Demolisher', desc: 'Reactions deal +40% damage.', fx: { reactMult: 0.4 } }],
                [{ id: 'van_t6_titan', name: 'Immortal Bastion', desc: '+60 max HP and +25 armor.', fx: { maxHp: 60, armor: 25 } },
                    { id: 'van_t6_warmaster', name: 'Warmaster', desc: '+25% Heavy/Shotgun/Melee damage & kills restore +12 HP.', fx: { heavyDmg: 0.25, killHeal: 12 } }]
            ]
        },
        ghost: {
            name: 'Ghost', color: '#a3e635', icon: 'staged_assets/ui/fantasy_rpg_icons/Classes/rogue-class-001.png',
            tiers: [
                [{ id: 'ghost_t1_softstep', name: 'Soft Step', desc: '-25% movement noise.', fx: { noise: -0.25 } },
                    { id: 'ghost_t1_suppressed', name: 'Silent Partner', desc: 'Sneak-attack multiplier +0.5.', fx: { stealthMult: 0.5 } }],
                [{ id: 'ghost_t2_lockpick', name: 'Lockpick', desc: 'Open locked containers & dungeon gates without a key.', fx: { lockpick: 1 } },
                    { id: 'ghost_t2_eagle', name: 'Eagle Eye', desc: 'Detection meters fill 30% slower.', fx: { detectSlow: 0.3 } }],
                [{ id: 'ghost_t3_shadowstep', name: 'Shadow Step', desc: 'Sneak kills grant 3 s of optical camo.', fx: { camoOnKill: 3 } },
                    { id: 'ghost_t3_deadeye', name: 'Deadeye Ambush', desc: 'Undetected shots from > 35 m always crit and Chill.', fx: { deadeye: 35 } }],
                [{ id: 'ghost_t4_vanish', name: 'Vanish', desc: 'Breaking line of sight drops alert 2x faster.', fx: { vanish: 1 } },
                    { id: 'ghost_t4_assassin', name: 'Assassin', desc: '+30% weakspot damage.', fx: { critAdd: 0.3 } }],
                [{ id: 'ghost_t5_phantom', name: 'Phantom', desc: 'Dodge grants 1.5 s invisibility.', fx: { dodgeCamo: 1.5 } },
                    { id: 'ghost_t5_executioner', name: 'Executioner', desc: 'Hits on targets under 25% HP deal +60%.', fx: { execute: 0.6 } }],
                [{ id: 'ghost_t6_reaper', name: 'Wraith Reaper', desc: '+0.85x sneak multiplier & 5 s optical camo on sneak kill.', fx: { stealthMult: 0.85, camoOnKill: 2 } },
                    { id: 'ghost_t6_nightblade', name: 'Nightblade Sovereign', desc: '+45% weakspot mult & +12% movement speed.', fx: { critAdd: 0.45, speedMult: 0.12 } }]
            ]
        },
        technomancer: {
            name: 'Technomancer', color: '#38bdf8', icon: 'staged_assets/ui/scifi_icons/Power Cores/amber-overdrive-cell-001.png',
            tiers: [
                [{ id: 'tech_t1_overclock', name: 'Overclock', desc: '-15% ability cooldowns.', fx: { cdr: 0.15 } },
                    { id: 'tech_t1_scavenger', name: 'Scavenger', desc: '+40% scrap from salvage.', fx: { salvage: 0.4 } }],
                [{ id: 'tech_t2_amplifier', name: 'Amplifier', desc: 'Statuses last 40% longer.', fx: { statusDur: 0.4 } },
                    { id: 'tech_t2_medtech', name: 'Med-Tech', desc: 'Med-injectors heal 50% more.', fx: { medMult: 0.5 } }],
                [{ id: 'tech_t3_chain', name: 'Chain Reaction', desc: 'Reactions spread the consumed status to 2 nearby foes.', fx: { chain: 2 } },
                    { id: 'tech_t3_override', name: 'Override', desc: 'Hacking terminals also disables nearby turrets and alarms.', fx: { override: 1 } }],
                [{ id: 'tech_t4_capacitor', name: 'Capacitor', desc: 'Primer gets a second charge.', fx: { primerCharges: 1 } },
                    { id: 'tech_t4_conductor', name: 'Conductor', desc: 'Shock arcs to 1 extra target.', fx: { shockArc: 1 } }],
                [{ id: 'tech_t5_singularity', name: 'Singularity', desc: 'Detonator radius +60%.', fx: { detRadius: 0.6 } },
                    { id: 'tech_t5_feedback', name: 'Feedback Loop', desc: 'Reactions refund 40% of Primer cooldown.', fx: { refund: 0.4 } }],
                [{ id: 'tech_t6_archon', name: 'Reactor Archon', desc: '-20% cooldowns & +55% elemental reaction damage.', fx: { cdr: 0.20, reactMult: 0.55 } },
                    { id: 'tech_t6_overseer', name: 'Nanite Overseer', desc: 'Detonators heal +30 HP & grant +1 chain spread.', fx: { detHeal: 30, chain: 1 } }]
            ]
        },
        slayer: {
            name: 'Slayer', color: '#ef4444', icon: 'staged_assets/ui/fantasy_rpg_icons/Classes/bounty-hunter-class-001.png',
            tiers: [
                [{ id: 'slay_t1_tracker', name: 'Monster Tracker', desc: '+15% damage against Beasts, Undead, and Brood.', fx: { beastDmg: 0.15 } },
                    { id: 'slay_t1_studious', name: 'Seasoned Grinder', desc: '+15% XP earned from slaying enemies.', fx: { killXpBonus: 0.15 } }],
                [{ id: 'slay_t2_silvered', name: 'Silvered Munitions', desc: '+15 armor penetration on weapon attacks.', fx: { bonusPen: 15 } },
                    { id: 'slay_t2_trophy', name: 'Trophy Harvester', desc: '+25% credits from boss loot and completed bounties.', fx: { bountyMult: 0.25 } }],
                [{ id: 'slay_t3_witcher', name: 'Mutagenic Reflex', desc: 'Healing items restore 35% more HP and max HP increases by 20.', fx: { medMult: 0.35, maxHp: 20 } },
                    { id: 'slay_t3_cull', name: 'Cull the Herd', desc: 'Kills heal 10 HP and all mastery skill XP increases by 15%.', fx: { killHeal: 10, skillXpMult: 0.15 } }],
                [{ id: 'slay_t4_giantslayer', name: 'Giant Slayer', desc: '+25% damage against all Bosses and Mini-Bosses.', fx: { bossDmg: 0.25 } },
                    { id: 'slay_t4_rend', name: 'Heartseeker', desc: '+25% weakspot damage & every 5th hit applies Venom.', fx: { critAdd: 0.25, nthVenom: 5 } }],
                [{ id: 'slay_t5_relentless', name: 'Relentless Pursuer', desc: '+10% move speed & 20% less damage taken from Bosses.', fx: { speedMult: 0.10, bossDR: 0.20 } },
                    { id: 'slay_t5_bloodbath', name: 'Crimson Momentum', desc: 'Hits on targets below 35% HP deal +45% damage.', fx: { execute: 0.45 } }],
                [{ id: 'slay_t6_dragonbane', name: 'Dragonwild Bane', desc: '+35% boss damage, +25% beast damage, and +25% kill XP.', fx: { bossDmg: 0.35, beastDmg: 0.25, killXpBonus: 0.25 } },
                    { id: 'slay_t6_grandmaster', name: 'Grandmaster Witcher', desc: '+40 max HP, +20 armor, and +18 HP on every kill.', fx: { maxHp: 40, armor: 20, killHeal: 18 } }]
            ]
        },
        deadeye: {
            name: 'Deadeye', color: '#facc15', icon: 'staged_assets/ui/military_icons/Optics Sensors/compact-binocular-optic-001.png',
            tiers: [
                [{ id: 'dead_t1_steady', name: 'Steady Breath', desc: '+18% weakspot damage.', fx: { critAdd: 0.18 } },
                    { id: 'dead_t1_quickdraw', name: 'Gunslinger', desc: '+10% all weapon damage.', fx: { allDmgMult: 0.10 } }],
                [{ id: 'dead_t2_ap', name: 'Tungsten Cores', desc: '+18 armor penetration on all firearms.', fx: { bonusPen: 18 } },
                    { id: 'dead_t2_keen', name: 'Hawk Sight', desc: '+8% flat critical hit chance on body shots.', fx: { bonusCritChance: 0.08 } }],
                [{ id: 'dead_t3_longshot', name: 'Longshot Mastery', desc: 'Shots beyond 22 m deal +25% bonus damage.', fx: { rangeDmg22: 0.25 } },
                    { id: 'dead_t3_tempo', name: 'Kill Tempo', desc: 'Kills heal 8 HP and ability cooldowns are reduced by 10%.', fx: { killHeal: 8, cdr: 0.10 } }],
                [{ id: 'dead_t4_vital', name: 'Vital Anatomy', desc: '+32% weakspot multiplier.', fx: { critAdd: 0.32 } },
                    { id: 'dead_t4_calib', name: 'High-Caliber Frame', desc: '+15% all weapon damage & +12 armor pen.', fx: { allDmgMult: 0.15, bonusPen: 12 } }],
                [{ id: 'dead_t5_shockround', name: 'Voltaic Primers', desc: 'Every 4th firearm hit applies Shock.', fx: { nthShock: 4 } },
                    { id: 'dead_t5_finisher', name: 'Coup de Grace', desc: '+12% flat crit chance & +35% execute damage.', fx: { bonusCritChance: 0.12, execute: 0.35 } }],
                [{ id: 'dead_t6_marksman', name: 'Mythic Deadeye', desc: '+60% weakspot mult & +25 armor penetration.', fx: { critAdd: 0.60, bonusPen: 25 } },
                    { id: 'dead_t6_desperado', name: 'Sovereign Gunslinger', desc: '+28% all firearm damage & +10% crit chance.', fx: { allDmgMult: 0.28, bonusCritChance: 0.10 } }]
            ]
        },
        arcanist: {
            name: 'Arcanist', color: '#c084fc', icon: 'staged_assets/ui/fantasy_rpg_icons/Weapons/arcane-orb-001.png',
            tiers: [
                [{ id: 'arc_t1_ward', name: 'Runic Ward', desc: '+12% resistance to all 5 elements.', fx: { allElemRes: 0.12 } },
                    { id: 'arc_t1_spark', name: 'Astral Spark', desc: '+20% elemental reaction damage.', fx: { reactMult: 0.20 } }],
                [{ id: 'arc_t2_siphon', name: 'Void Leech', desc: 'Detonating elemental reactions heals you for 14 HP.', fx: { detHeal: 14 } },
                    { id: 'arc_t2_potent', name: 'Hex Potency', desc: '+35% status duration & potency.', fx: { statusDur: 0.35, statusPotency: 0.35 } }],
                [{ id: 'arc_t3_chilltouch', name: 'Frost-Weave', desc: 'Every 5th firearm hit applies Chill.', fx: { nthChill: 5 } },
                    { id: 'arc_t3_voidtouch', name: 'Abyssal Etching', desc: 'Every 5th firearm hit applies Void.', fx: { nthVoid: 5 } }],
                [{ id: 'arc_t4_aegis', name: 'Spellshield', desc: '+30 max HP & +15% all elemental resistances.', fx: { maxHp: 30, allElemRes: 0.15 } },
                    { id: 'arc_t4_haste', name: 'Leyline Conduit', desc: '-18% ability & ultimate cooldowns.', fx: { cdr: 0.18 } }],
                [{ id: 'arc_t5_cataclysm', name: 'Cataclysmic Mastery', desc: '+45% reaction damage & +35% detonator radius.', fx: { reactMult: 0.45, detRadius: 0.35 } },
                    { id: 'arc_t5_immortalhex', name: 'Soul Anchor', desc: 'Once per 90 s, survive lethal blows with 1 HP.', fx: { cheatDeath: 90 } }],
                [{ id: 'arc_t6_archmage', name: 'Meridian Archmage', desc: '+70% reaction damage, +1 chain target & -15% CDs.', fx: { reactMult: 0.70, chain: 1, cdr: 0.15 } },
                    { id: 'arc_t6_voidlord', name: 'Avatar of the Rift', desc: '+50 max HP, +20% all elem resist & +25 detonate heal.', fx: { maxHp: 50, allElemRes: 0.20, detHeal: 25 } }]
            ]
        },
        wayfarer: {
            name: 'Wayfarer', color: '#2dd4bf', icon: 'staged_assets/ui/military_icons/Field Gear/assault-day-pack-001.png',
            tiers: [
                [{ id: 'way_t1_porter', name: 'Frontier Ox', desc: '+30 kg carry weight.', fx: { carry: 30 } },
                    { id: 'way_t1_strider', name: 'Trail Runner', desc: '+8% movement speed.', fx: { speedMult: 0.08 } }],
                [{ id: 'way_t2_bountiful', name: 'Bountiful Harvest', desc: 'Always harvest double yield from ore, herbs, trees and crystals.', fx: { doubleGather: 1 } },
                    { id: 'way_t2_prospector', name: 'Treasure Finder', desc: '+30% salvage value & +20% container credits.', fx: { salvage: 0.30, creditFind: 0.20 } }],
                [{ id: 'way_t3_tinker', name: 'Master Smith', desc: 'Equipped weapons & armor lose 45% less durability.', fx: { durSave: 0.45 } },
                    { id: 'way_t3_herbalist', name: 'Apothecary', desc: 'Medkits & elixirs heal +60% more HP.', fx: { medMult: 0.60 } }],
                [{ id: 'way_t4_scholar', name: 'Lore Seeker', desc: '+20% Character XP & +30% Mastery Skill XP.', fx: { xpMult: 0.20, skillXpMult: 0.30 } },
                    { id: 'way_t4_diplomat', name: 'Caravan Envoy', desc: '+25 max HP & +45 kg carry weight.', fx: { maxHp: 25, carry: 45 } }],
                [{ id: 'way_t5_outlander', name: 'Dragonwild Pioneer', desc: '+12% movement speed & +15 armor.', fx: { speedMult: 0.12, armor: 15 } },
                    { id: 'way_t5_delver', name: 'Dungeon Delver', desc: 'Bypass chest and culvert locks, and deal +25% boss damage.', fx: { lockpick: 1, bossDmg: 0.25 } }],
                [{ id: 'way_t6_legend', name: 'Legend of Meridian', desc: '+35% All XP Gain, +15% All Damage & +50 kg Carry.', fx: { xpMult: 0.35, allDmgMult: 0.15, carry: 50 } },
                    { id: 'way_t6_warden', name: 'High Warden', desc: '+65 max HP, +20% all elem resist & +14% move speed.', fx: { maxHp: 65, allElemRes: 0.20, speedMult: 0.14 } }]
            ]
        },
        pathfinder: {
            name: 'Pathfinder', color: '#fbbf24', icon: 'staged_assets/ui/military_icons/Optics Sensors/compact-binocular-optic-001.png',
            tiers: [
                [{ id: 'path_t1_cartographer', name: 'Cartographer', desc: '+40% fog-of-war reveal radius and +30 m minimap range.', fx: { revealRadius: 0.40, minimapRange: 30 } },
                    { id: 'path_t1_trailblazer', name: 'Trailblazer', desc: '+6% movement speed and +10 kg carry weight.', fx: { speedMult: 0.06, carry: 10 } }],
                [{ id: 'path_t2_antiquarian', name: 'Antiquarian', desc: '+35% XP from caches, tomes, shrines, vistas and altars.', fx: { discoveryXp: 0.35 } },
                    { id: 'path_t2_treasure', name: 'Treasure Sense', desc: '+30% chance of a bonus item from treasure caches.', fx: { cacheLuck: 0.30 } }],
                [{ id: 'path_t3_pilgrim', name: 'Devout Pilgrim', desc: 'Shrine blessings last 60% longer.', fx: { shrineDur: 0.60 } },
                    { id: 'path_t3_wildcraft', name: 'Wildcrafter', desc: '+15% bonus gather chance and +20% med healing.', fx: { gatherChance: 0.15, medMult: 0.20 } }],
                [{ id: 'path_t4_survey', name: 'Field Survey', desc: '+25% Mastery XP and +10% character XP.', fx: { skillXpMult: 0.25, xpMult: 0.10 } },
                    { id: 'path_t4_gilded', name: 'Gilded Luck', desc: '+25% credits found everywhere.', fx: { creditFind: 0.25 } }],
                [{ id: 'path_t5_wayfinder', name: 'Wayfinder', desc: '+10% movement speed and +20 armor.', fx: { speedMult: 0.10, armor: 20 } },
                    { id: 'path_t5_relic', name: 'Relic Hunter', desc: '+50% cache bonus-item chance and +20% discovery XP.', fx: { cacheLuck: 0.50, discoveryXp: 0.20 } }],
                [{ id: 'path_t6_atlas', name: 'Living Atlas', desc: '+80% reveal radius, +60% discovery XP and +12% movement speed.', fx: { revealRadius: 0.80, discoveryXp: 0.60, speedMult: 0.12 } },
                    { id: 'path_t6_hoard', name: "Dragon's Hoard", desc: '+60% credits found and every cache yields a bonus item.', fx: { creditFind: 0.60, cacheLuck: 1 } }]
            ]
        },
        huntsman: {
            name: 'Huntsman', color: '#f43f5e', icon: 'staged_assets/ui/fantasy_rpg_icons/Classes/bounty-hunter-class-001.png',
            tiers: [
                [{ id: 'hunt_t1_quarry', name: 'Mark the Quarry', desc: '+15% damage against Champions.', fx: { champDmg: 0.15 } },
                    { id: 'hunt_t1_tracker', name: "Tracker's Eye", desc: '+10% damage against beasts and bosses.', fx: { monsterDmg: 0.10 } }],
                [{ id: 'hunt_t2_hide', name: 'Thick Hide', desc: 'Take 15% less damage from Champions.', fx: { champDR: 0.15 } },
                    { id: 'hunt_t2_trophy', name: 'Trophy Taker', desc: '+50% chance of a bonus loot roll from Champions.', fx: { champLoot: 0.50 } }],
                [{ id: 'hunt_t3_venom', name: 'Envenomed Rounds', desc: 'Every 5th firearm hit applies Venom.', fx: { nthVenom: 5 } },
                    { id: 'hunt_t3_static', name: 'Static Rounds', desc: 'Every 5th firearm hit applies Shock.', fx: { nthShock: 5 } }],
                [{ id: 'hunt_t4_executioner', name: 'Executioner', desc: '+30% damage to enemies below 35% HP.', fx: { execute: 0.30 } },
                    { id: 'hunt_t4_bloodhound', name: 'Bloodhound', desc: 'Kills restore 10 HP and +8% critical chance.', fx: { killHeal: 10, bonusCritChance: 0.08 } }],
                [{ id: 'hunt_t5_bane', name: "Champion's Bane", desc: '+35% Champion damage and +20% boss damage.', fx: { champDmg: 0.35, bossDmg: 0.20 } },
                    { id: 'hunt_t5_ward', name: 'Monster Ward', desc: 'Take 30% less damage from Champions and 20% less from bosses.', fx: { champDR: 0.30, bossDR: 0.20 } }],
                [{ id: 'hunt_t6_apex', name: 'Apex Predator', desc: '+25% damage to beasts, bosses and Champions; Champions always drop a bonus roll.', fx: { monsterDmg: 0.25, champDmg: 0.25, champLoot: 1 } },
                    { id: 'hunt_t6_legend', name: 'Monster-Slayer Legend', desc: '+70 max HP, +20 armor and kills heal 15 HP.', fx: { maxHp: 70, armor: 20, killHeal: 15 } }]
            ]
        }
    };

    /* --------------------------------------------------------- 5-element statuses */
    const STATUSES = {
        burn: { name: 'Burn', color: '#f97316', hex: 0xf97316, dur: 5, dps: 9, icon: '🔥' },
        chill: { name: 'Chill', color: '#38bdf8', hex: 0x38bdf8, dur: 5, slow: 0.45, icon: '❄' },
        shock: { name: 'Shock', color: '#facc15', hex: 0xfacc15, dur: 5, icon: '⚡' },
        venom: { name: 'Venom', color: '#84cc16', hex: 0x84cc16, dur: 6, dps: 7, maxStacks: 5, icon: '☠' },
        void: { name: 'Void', color: '#c084fc', hex: 0xc084fc, dur: 5, drain: 0.15, icon: '✦' },
        expose: { name: 'Expose', color: '#f472b6', hex: 0xf472b6, dur: 6, mult: 1.25, icon: '◈' }
    };
    const REACTIONS = {
        burn: { name: 'COMBUST', mult: 2.2, radius: 4.5, desc: 'Fiery blast around the target.' },
        chill: { name: 'SHATTER', mult: 3.0, radius: 0, desc: 'Massive single-target damage.' },
        shock: { name: 'OVERLOAD', mult: 1.4, radius: 7, desc: 'Arcs to nearby enemies and stuns.' },
        venom: { name: 'BLIGHT BURST', mult: 1.85, radius: 5.5, desc: 'Corrosive blast scaling per stack; spreads Venom.' },
        void: { name: 'SINGULARITY COLLAPSE', mult: 2.35, radius: 7.0, desc: 'Pulls nearby enemies inward and siphons health.' },
        expose: { name: 'RUPTURE', mult: 1.6, radius: 0, desc: 'Strips 50% armor for 10 s.' }
    };

    /* --------------------------------------------------------- abilities */
    const ABILITIES = {
        primer: {
            cryo_dart: { name: 'Cryo Dart', status: 'chill', cd: 9, dmg: 18, range: 45, desc: 'Fires a dart that Chills.' },
            thermite: { name: 'Thermite Canister', status: 'burn', cd: 10, dmg: 14, range: 30, radius: 3.5, desc: 'Lobbed canister: Burns an area.' },
            arc_mine: { name: 'Arc Spike', status: 'shock', cd: 10, dmg: 16, range: 40, radius: 3, desc: 'Spike that Shocks foes near the impact.' },
            breach_bash: { name: 'Breach Bash', status: 'expose', cd: 8, dmg: 30, range: 4, desc: 'Shoulder-charge that Exposes and staggers.' }
        },
        detonator: {
            arc_lash: { name: 'Arc Lash', cd: 12, dmg: 40, range: 30, radius: 0, desc: 'Lightning whip: consumes statuses on the target.' },
            concussion: { name: 'Concussion Pulse', cd: 14, dmg: 30, range: 0, radius: 7, desc: 'Pulse around you: consumes statuses on all nearby.' }
        },
        gadget: {
            med_injector: { name: 'Med-Injector', cd: 25, heal: 45, desc: 'Heal 45 HP over 2 s.' },
            decoy_holo: { name: 'Decoy Hologram', cd: 30, dur: 8, desc: 'Projects a decoy that hostiles investigate.' }
        },
        ultimate: {
            orbital_barrage: { name: 'Orbital Barrage', cd: 55, dmg: 140, range: 45, radius: 8, element: 'burn', desc: 'Calls down twin thermite-arc strikes on target area.' }
        }
    };

    /* --------------------------------------------------------- 66 Enemies & World/Dungeon Bosses (Lvl 1–50)
       Every single entry satisfies OWRPGValidator._ttk() (normal 0.8-4.5s, boss 18-55s)
       and supports optional 3D GLB character/monster visual overlays (`glb`, `glbScale`). */
    const ENEMIES = {
        /* --- HAVEN BASIN & WHISPERING PINEWOODS (Lvl 1–9) --- */
         puglin_scamp: { name: 'Puglin Scavenger', kind: 'beast', faction: 'brood', body: 'ankle_biter', glb: 'monsters/Puglin.glb', glbScale: 1.35, hp: 165, armor: 0, lvl: 1, xp: 18, speed: 4.3, dmg: 8, loot: 'brood' },
        raider: { name: 'Basin Raider', kind: 'bot', faction: 'raiders', weapon: 'aks74u', hp: 190, armor: 5, lvl: 2, xp: 24, loot: 'raider' },
        crawler: { name: 'Brood Crawler', kind: 'beast', faction: 'brood', body: 'ankle_biter', hp: 160, armor: 0, lvl: 2, xp: 20, speed: 4.4, dmg: 9, loot: 'brood' },
        raider_marksman: { name: 'Raider Marksman', kind: 'bot', faction: 'raiders', weapon: 'kar98k_irons', hp: 210, armor: 0, lvl: 3, xp: 30, loot: 'raider' },
        forest_poacher: { name: 'Pinewood Poacher', kind: 'bot', faction: 'raiders', weapon: 'kar98k_irons', glb: 'mini_forest_kit/character-archer.glb', glbScale: 1.7, hp: 240, armor: 6, lvl: 4, xp: 36, loot: 'raider' },
        timber_wolf: { name: 'Dire Timber Wolf', kind: 'beast', faction: 'brood', body: 'hellhound', hp: 255, armor: 4, lvl: 4, xp: 34, speed: 5.3, dmg: 12, loot: 'brood' },
        raider_pyro: { name: 'Basin Pyro', kind: 'bot', faction: 'raiders', weapon: 'aks74u', hp: 250, armor: 10, lvl: 4, xp: 38, loot: 'raider', elem: 'burn', weak: 'chill' },
        brood_venom_mite: { name: 'Brood Venom Mite', kind: 'beast', faction: 'brood', body: 'nova_crawler', hp: 225, armor: 4, lvl: 4, xp: 32, speed: 4.5, dmg: 11, loot: 'brood', elem: 'venom', weak: 'burn' },
        militia_scout: { name: 'Freestead Pathfinder', kind: 'bot', faction: 'militia', weapon: 'mp5', hp: 220, armor: 8, lvl: 4, xp: 32, loot: 'militia' },
        militia: { name: 'Freestead Ranger', kind: 'bot', faction: 'militia', weapon: 'm16a4', hp: 250, armor: 10, lvl: 5, xp: 38, loot: 'militia' },
        raider_bruiser: { name: 'Scrap Bruiser', kind: 'bot', faction: 'raiders', weapon: 'r870', hp: 290, armor: 18, lvl: 5, xp: 45, loot: 'raider', weak: 'shock' },
        stalker: { name: 'Brood Stalker', kind: 'beast', faction: 'brood', body: 'sprinter', hp: 255, armor: 5, lvl: 5, xp: 38, speed: 5.0, dmg: 14, loot: 'brood' },
        orc_reaver: { name: 'Root-Barrow Orc', kind: 'beast', faction: 'raiders', body: 'club_goliath', glb: 'mini_dungeon_kit/character-orc.glb', glbScale: 1.85, hp: 310, armor: 14, lvl: 6, xp: 52, speed: 3.9, dmg: 16, loot: 'raider' },
        imp_firestarter: { name: 'Cinder Imp', kind: 'beast', faction: 'brood', body: 'pyro_fiend', glb: 'monsters/Imp.glb', glbScale: 1.4, hp: 295, armor: 8, lvl: 6, xp: 50, speed: 4.6, dmg: 15, ranged: true, loot: 'brood', elem: 'burn', weak: 'chill' },
        spitter: { name: 'Brood Spitter', kind: 'beast', faction: 'brood', body: 'hunch_spitter', hp: 270, armor: 0, lvl: 6, xp: 44, speed: 3.0, dmg: 13, ranged: true, loot: 'brood', elem: 'venom' },

        /* --- RUST SPRAWL & BARROW-MOOR GRAVEYARD (Lvl 6–16) --- */
        enforcer: { name: 'Syndicate Enforcer', kind: 'bot', faction: 'syndicate', weapon: 'spas12_tac', hp: 290, armor: 15, lvl: 6, xp: 48, loot: 'syndicate' },
        syn_gunner: { name: 'Syndicate Gunner', kind: 'bot', faction: 'syndicate', weapon: 'rpd', hp: 320, armor: 20, lvl: 7, xp: 56, loot: 'syndicate' },
        brood_blight_hound: { name: 'Blight Hound', kind: 'beast', faction: 'brood', body: 'hellhound', hp: 310, armor: 10, lvl: 7, xp: 54, speed: 5.2, dmg: 18, loot: 'brood', elem: 'venom', weak: 'burn' },
        syn_arc_tech: { name: 'Syndicate Arc-Tech', kind: 'bot', faction: 'syndicate', weapon: 'p90', hp: 335, armor: 18, lvl: 8, xp: 64, loot: 'syndicate', elem: 'shock', weak: 'venom' },
        syn_sniper: { name: 'Syndicate Deadeye', kind: 'bot', faction: 'syndicate', weapon: 'dragunov_svd', hp: 325, armor: 12, lvl: 9, xp: 72, loot: 'syndicate', weak: 'void' },
        brute: { name: 'Brood Brute', kind: 'beast', faction: 'brood', body: 'club_goliath', hp: 410, armor: 25, lvl: 9, xp: 85, speed: 3.2, dmg: 26, loot: 'brood' },
        skeleton_warrior: { name: 'Barrow Skeleton', kind: 'beast', faction: 'brood', body: 'sprinter', glb: 'graveyard_kit/character-skeleton.glb', glbScale: 1.75, hp: 365, armor: 14, lvl: 10, xp: 78, speed: 4.3, dmg: 20, loot: 'undead', weak: 'burn' },
        grave_zombie: { name: 'Risen Corpse-Walker', kind: 'beast', faction: 'brood', body: 'shambler', glb: 'graveyard_kit/character-zombie.glb', glbScale: 1.75, hp: 410, armor: 12, lvl: 11, xp: 84, speed: 3.5, dmg: 22, loot: 'undead', elem: 'venom', weak: 'burn' },
        barrow_ghost: { name: 'Moorland Specter', kind: 'beast', faction: 'brood', body: 'frost_wraith', glb: 'graveyard_kit/character-ghost.glb', glbScale: 1.8, hp: 390, armor: 18, lvl: 12, xp: 94, speed: 4.5, dmg: 23, ranged: true, loot: 'undead', elem: 'chill', weak: 'burn' },
        crypt_keeper: { name: 'Grimhollow Keeper', kind: 'beast', faction: 'brood', body: 'club_goliath', glb: 'graveyard_kit/character-keeper.glb', glbScale: 1.85, hp: 460, armor: 24, lvl: 13, xp: 108, speed: 3.4, dmg: 27, loot: 'undead', elem: 'void' },
        blood_vampire: { name: 'Crimson Nightlord', kind: 'beast', faction: 'brood', body: 'aether_revenant', glb: 'graveyard_kit/character-vampire.glb', glbScale: 1.85, hp: 485, armor: 24, lvl: 15, xp: 128, speed: 4.8, dmg: 30, ranged: true, loot: 'undead', elem: 'void', weak: 'burn' },

        /* --- MIRE DELTA, ASH QUARRY & SUNSCORCHED BADLANDS (Lvl 10–25) --- */
        brood_frost_wraith: { name: 'Mire Frost Wraith', kind: 'beast', faction: 'brood', body: 'frost_wraith', hp: 380, armor: 15, lvl: 10, xp: 82, speed: 4.1, dmg: 21, loot: 'brood', elem: 'chill', weak: 'burn' },
        mire_witch: { name: 'Coven Swamp-Hexer', kind: 'bot', faction: 'helix', weapon: 'vector_kriss', hp: 450, armor: 18, lvl: 14, xp: 118, loot: 'helix', elem: 'venom', weak: 'burn' },
        brood_pyro_fiend: { name: 'Quarry Ash Fiend', kind: 'beast', faction: 'brood', body: 'pyro_fiend', hp: 410, armor: 18, lvl: 11, xp: 90, speed: 3.8, dmg: 24, loot: 'brood', elem: 'burn', weak: 'chill' },
        brood_iron_goliath: { name: 'Ironhide Goliath', kind: 'beast', faction: 'brood', body: 'iron_juggernaut', hp: 495, armor: 34, lvl: 14, xp: 125, speed: 3.0, dmg: 30, loot: 'brood', weak: 'shock' },
        quarry_sapper: { name: 'Slag Demolitionist', kind: 'bot', faction: 'syndicate', weapon: 'spas12_tac', hp: 490, armor: 26, lvl: 16, xp: 135, loot: 'syndicate', elem: 'burn' },
        badlands_outlaw: { name: 'Redrock Desperado', kind: 'bot', faction: 'raiders', weapon: 'ak47', hp: 530, armor: 24, lvl: 18, xp: 150, loot: 'syndicate' },
        badlands_sharpshooter: { name: 'Mesa Canyon Sniper', kind: 'bot', faction: 'raiders', weapon: 'm40a3_cod4', hp: 510, armor: 20, lvl: 19, xp: 160, loot: 'syndicate', weak: 'chill' },
        dune_scorpion: { name: 'Sunscorched Stinger', kind: 'beast', faction: 'brood', body: 'nova_crawler', hp: 560, armor: 28, lvl: 20, xp: 172, speed: 4.8, dmg: 32, loot: 'brood', elem: 'venom', weak: 'chill' },
        sunfang_guardian: { name: 'Sunfang Construct', kind: 'beast', faction: 'brood', body: 'iron_juggernaut', glb: 'mini_arena_kit/character-soldier.glb', glbScale: 2.0, hp: 620, armor: 35, lvl: 22, xp: 195, speed: 3.4, dmg: 35, loot: 'locked', elem: 'burn', weak: 'shock' },

        /* --- SUNKEN RUIN COAST, ALPINE ARRAY & FROSTFANG PEAKS (Lvl 12–36) --- */
        aegis: { name: 'Aegis Trooper', kind: 'bot', faction: 'aegis', weapon: 'scarh', hp: 390, armor: 32, lvl: 12, xp: 88, loot: 'aegis', weak: 'shock' },
        aegis_heavy: { name: 'Aegis Heavy Trooper', kind: 'bot', faction: 'aegis', weapon: 'm249', hp: 440, armor: 38, lvl: 13, xp: 104, loot: 'aegis', weak: 'shock' },
        aegis_cryo: { name: 'Aegis Cryo-Specialist', kind: 'bot', faction: 'aegis', weapon: 'acr_68', hp: 430, armor: 30, lvl: 14, xp: 112, loot: 'aegis', elem: 'chill', weak: 'burn' },
        drowned_corsair: { name: 'Drowned Corsair', kind: 'beast', faction: 'brood', body: 'shambler', glb: 'mini_dungeon_kit/character-human.glb', glbScale: 1.8, hp: 660, armor: 28, lvl: 24, xp: 215, speed: 3.9, dmg: 36, loot: 'undead', elem: 'chill', weak: 'shock' },
        abyssal_siren: { name: 'Tide-Ruin Siren', kind: 'beast', faction: 'brood', body: 'hunch_spitter', glb: 'graveyard_kit/character-ghost.glb', glbScale: 1.9, hp: 680, armor: 25, lvl: 26, xp: 235, speed: 4.2, dmg: 38, ranged: true, loot: 'undead', elem: 'chill', weak: 'shock' },
        frost_knight: { name: 'Frostspire Templar', kind: 'bot', faction: 'aegis', weapon: 'acr_68', glb: 'mini_arena_kit/character-soldier.glb', glbScale: 1.95, hp: 740, armor: 38, lvl: 29, xp: 270, loot: 'aegis', elem: 'chill', weak: 'burn' },
        glacier_troll: { name: 'Frostfang Ice-Troll', kind: 'beast', faction: 'brood', body: 'club_goliath', glb: 'mini_dungeon_kit/character-orc.glb', glbScale: 2.25, hp: 820, armor: 36, lvl: 32, xp: 310, speed: 3.5, dmg: 44, loot: 'brood', elem: 'chill', weak: 'burn' },
        frost_wyrmling: { name: 'Glacier Wyrmling', kind: 'beast', faction: 'brood', body: 'frost_wraith', glb: 'monsters/Imp.glb', glbScale: 1.95, hp: 850, armor: 34, lvl: 34, xp: 335, speed: 4.8, dmg: 46, ranged: true, loot: 'dragon', elem: 'chill', weak: 'burn' },

        /* --- MERIDIAN CORE & OBSIDIAN DRAGONWILDS (Lvl 14–50) --- */
        helix: { name: 'Helix Acolyte', kind: 'bot', faction: 'helix', weapon: 'vector_kriss', hp: 440, armor: 18, lvl: 14, xp: 105, loot: 'helix', weak: 'burn' },
        helix_zealot: { name: 'Helix Blight Zealot', kind: 'bot', faction: 'helix', weapon: 'an94_abakan', hp: 470, armor: 22, lvl: 15, xp: 120, loot: 'helix', elem: 'venom', weak: 'burn' },
        helix_voidweaver: { name: 'Helix Voidweaver', kind: 'bot', faction: 'helix', weapon: 'f2000', hp: 500, armor: 24, lvl: 16, xp: 135, loot: 'helix', elem: 'void', weak: 'chill' },
        brood_void_stalker: { name: 'Crater Void Stalker', kind: 'beast', faction: 'brood', body: 'aether_revenant', hp: 530, armor: 25, lvl: 17, xp: 148, speed: 4.4, dmg: 30, ranged: true, loot: 'brood', elem: 'void', weak: 'chill' },
        helix_archon: { name: 'Meridian Rift Archon', kind: 'bot', faction: 'helix', weapon: 'f2000', hp: 920, armor: 36, lvl: 37, xp: 380, loot: 'helix', elem: 'void', weak: 'chill' },
        obsidian_cultist: { name: 'Dragonwild Flame-Sworn', kind: 'bot', faction: 'helix', weapon: 'stg44', hp: 980, armor: 38, lvl: 40, xp: 425, loot: 'dragon', elem: 'burn', weak: 'chill' },
        ashen_drake: { name: 'Obsidian Ash-Drake', kind: 'beast', faction: 'brood', body: 'pyro_fiend', glb: 'monsters/Imp.glb', glbScale: 2.35, hp: 1080, armor: 40, lvl: 43, xp: 475, speed: 4.7, dmg: 54, ranged: true, loot: 'dragon', elem: 'burn', weak: 'chill' },
        dragonwild_juggernaut: { name: 'Dragonbone Dreadknight', kind: 'beast', faction: 'brood', body: 'iron_juggernaut', glb: 'mini_arena_kit/character-soldier.glb', glbScale: 2.3, hp: 1180, armor: 44, lvl: 46, xp: 540, speed: 3.6, dmg: 58, loot: 'dragon', elem: 'void', weak: 'shock' },

        /* --- TREASURE GOBLIN / SPECIAL EVENT --- */
        treasure_puglin: { name: 'Golden Hoarder Puglin', kind: 'beast', faction: 'raiders', body: 'sprinter', glb: 'monsters/Puglin.glb', glbScale: 1.65, hp: 480, armor: 20, lvl: 12, xp: 240, speed: 5.5, dmg: 10, loot: 'locked' },

        /* --- 18 WORLD & DUNGEON BOSSES (TTK calibrated strictly inside 18–55s) --- */
        raider_boss: { name: 'Gutter King Vasko', kind: 'bot', faction: 'raiders', weapon: 'aa12', hp: 3800, armor: 20, lvl: 5, xp: 280, loot: 'boss', boss: true },
        matriarch: { name: 'Culvert Matriarch', kind: 'beast', faction: 'brood', body: 'bloater', hp: 4100, armor: 25, lvl: 6, xp: 340, speed: 2.6, dmg: 30, loot: 'boss', boss: true, weak: 'chill', elem: 'venom' },
        boss_thornback_orc: { name: 'Warchief Thornback', kind: 'beast', faction: 'raiders', body: 'boss_butcher', glb: 'mini_dungeon_kit/character-orc.glb', glbScale: 2.7, hp: 4800, armor: 25, lvl: 8, xp: 450, speed: 3.1, dmg: 32, loot: 'boss', boss: true, weak: 'burn' },
        boss_mire_hydra: { name: 'Mire Plague Hydra', kind: 'beast', faction: 'brood', body: 'boss_plague', hp: 5400, armor: 25, lvl: 10, xp: 560, speed: 2.8, dmg: 34, ranged: true, loot: 'boss', boss: true, weak: 'burn', elem: 'venom' },
        boss_foundry_kragg: { name: 'Foreman Kragg the Welder', kind: 'bot', faction: 'syndicate', weapon: 'mg42_buzzsaw', hp: 5600, armor: 30, lvl: 11, xp: 620, loot: 'boss', boss: true, elem: 'burn', weak: 'chill' },
        boss_quarry_colossus: { name: 'Ash Quarry Colossus', kind: 'beast', faction: 'brood', body: 'boss_colossus', hp: 5600, armor: 35, lvl: 12, xp: 680, speed: 2.5, dmg: 42, loot: 'boss', boss: true, weak: 'shock', elem: 'burn' },
        boss_lich_malgath: { name: 'Arch-Lich Malgath', kind: 'beast', faction: 'brood', body: 'boss_witch_queen', glb: 'graveyard_kit/character-keeper.glb', glbScale: 2.7, hp: 6200, armor: 32, lvl: 14, xp: 820, speed: 2.9, dmg: 38, ranged: true, loot: 'boss', boss: true, elem: 'void', weak: 'burn' },
        boss_alpine_warden: { name: 'Rogue Mecha Unit X-9', kind: 'bot', faction: 'aegis', weapon: 'minigun_death', hp: 6200, armor: 42, lvl: 15, xp: 900, loot: 'boss', boss: true, weak: 'shock', elem: 'shock' },
        boss_lord_vespera: { name: 'Lord Vespera the Undying', kind: 'beast', faction: 'brood', body: 'boss_nyx', glb: 'graveyard_kit/character-vampire.glb', glbScale: 2.7, hp: 6900, armor: 35, lvl: 17, xp: 1050, speed: 3.4, dmg: 42, ranged: true, loot: 'boss', boss: true, elem: 'void', weak: 'burn' },
        boss_meridian_sovereign: { name: 'The Meridian Sovereign', kind: 'beast', faction: 'brood', body: 'boss_nyx', hp: 7400, armor: 35, lvl: 18, xp: 1250, speed: 3.1, dmg: 46, ranged: true, loot: 'boss', boss: true, weak: 'chill', elem: 'void' },
        boss_coven_morwen: { name: 'Hag-Mother Morwen', kind: 'beast', faction: 'brood', body: 'boss_witch_queen', hp: 7600, armor: 36, lvl: 19, xp: 1320, speed: 3.0, dmg: 44, ranged: true, loot: 'boss', boss: true, elem: 'venom', weak: 'burn' },
        boss_molten_ignis: { name: 'Molten Golem Ignis', kind: 'beast', faction: 'brood', body: 'boss_colossus', hp: 8400, armor: 40, lvl: 22, xp: 1580, speed: 2.7, dmg: 48, loot: 'boss', boss: true, elem: 'burn', weak: 'chill' },
        boss_pharaoh_kharim: { name: 'Sand-King Kharim', kind: 'beast', faction: 'brood', body: 'boss_ogre_emperor', glb: 'graveyard_kit/character-skeleton.glb', glbScale: 2.8, hp: 9200, armor: 40, lvl: 25, xp: 1850, speed: 3.1, dmg: 52, ranged: true, loot: 'boss', boss: true, elem: 'burn', weak: 'chill' },
        boss_tide_nereus: { name: 'Tide-Caller Nereus', kind: 'beast', faction: 'brood', body: 'boss_hydra_matron', hp: 10400, armor: 40, lvl: 29, xp: 2250, speed: 3.0, dmg: 55, ranged: true, loot: 'boss', boss: true, elem: 'chill', weak: 'shock' },
        boss_omega_zero: { name: 'Prototype Omega-Zero', kind: 'bot', faction: 'aegis', weapon: 'minigun_death', hp: 11400, armor: 45, lvl: 33, xp: 2700, loot: 'boss', boss: true, elem: 'shock', weak: 'venom' },
        boss_frost_valdris: { name: 'Frost-King Valdris', kind: 'beast', faction: 'brood', body: 'boss_lycan_king', glb: 'mini_arena_kit/character-soldier.glb', glbScale: 2.9, hp: 12800, armor: 45, lvl: 38, xp: 3400, speed: 3.4, dmg: 60, ranged: true, loot: 'boss', boss: true, elem: 'chill', weak: 'burn' },
        boss_dragon_vaelgor: { name: 'Vaelgor the Ashen Wyrm', kind: 'beast', faction: 'brood', body: 'boss_cerberus', glb: 'monsters/Imp.glb', glbScale: 3.4, hp: 15500, armor: 48, lvl: 46, xp: 5200, speed: 3.6, dmg: 68, ranged: true, loot: 'dragon', boss: true, elem: 'burn', weak: 'chill' },
        boss_abyssal_archon: { name: 'Malakor, Dragonwild Archon', kind: 'beast', faction: 'brood', body: 'boss_nyx', hp: 16800, armor: 50, lvl: 50, xp: 6800, speed: 3.5, dmg: 74, ranged: true, loot: 'dragon', boss: true, elem: 'void', weak: 'chill' }
    };

    /* --------------------------------------------------------- items */
    // type: weapon | consumable | junk | quest | rig | helmet | boots | relic | tool
    const ITEMS = {
        w_pistol: { name: 'Service Pistol', type: 'weapon', base: 'm1911', weight: 1.2, value: 60, rarity: 'common', suppressed: true },
        w_carbine: { name: 'Ranger Carbine', type: 'weapon', base: 'm16a4', weight: 3.4, value: 220, rarity: 'common' },
        w_smg: { name: 'Krinkov Sprayer', type: 'weapon', base: 'aks74u', weight: 2.6, value: 180, rarity: 'common' },
        w_shotgun: { name: 'Breacher 12', type: 'weapon', base: 'spas12_tac', weight: 3.8, value: 260, rarity: 'common', req: ['BRW', 5] },
        w_rifle: { name: 'Homestead Bolt Rifle', type: 'weapon', base: 'kar98k_irons', weight: 4.0, value: 240, rarity: 'common', req: ['PRC', 5] },
        w_lmg: { name: 'Rail Baron LMG', type: 'weapon', base: 'rpd', weight: 8.5, value: 420, rarity: 'rare', req: ['BRW', 7] },
        w_dmr: { name: 'Aegis Marksman', type: 'weapon', base: 'mk14', weight: 4.6, value: 520, rarity: 'rare', req: ['PRC', 6], suppressed: true },
        w_vector: { name: 'Helix Whisper', type: 'weapon', base: 'vector_kriss', weight: 2.8, value: 480, rarity: 'rare', req: ['RFX', 6], suppressed: true },
        w_aa12: { name: "Vasko's Gutter Drum", type: 'weapon', base: 'aa12', weight: 5.5, value: 900, rarity: 'legendary', req: ['BRW', 6], fixedAffix: 'thermal' },
        // Rigs (armor).
        rig_light: { name: 'Scav Harness', type: 'rig', armor: 10, weight: 3, value: 90, rarity: 'common', maxDur: 100 },
        rig_plated: { name: 'Plated Rig', type: 'rig', armor: 25, weight: 9, value: 320, rarity: 'rare', req: ['BRW', 6], maxDur: 130 },
        rig_aegis: { name: 'Aegis Carapace', type: 'rig', armor: 40, weight: 12, value: 900, rarity: 'epic', req: ['BRW', 7], maxDur: 160 },
        // Consumables & Witcher/Alchemy Elixirs.
        medkit: { name: 'Med-Injector', type: 'consumable', weight: 0.3, value: 35, heal: 45, stack: true },
        elixir_swallow: { name: 'Swallow Vital Elixir', type: 'consumable', weight: 0.25, value: 95, heal: 95, stack: true, desc: 'Alchemical healing brew restoring 95 HP.' },
        stim: { name: 'Combat Stim', type: 'consumable', weight: 0.2, value: 50, stim: 12, stack: true },
        elixir_thunderbolt: { name: 'Thunderbolt Potion', type: 'consumable', weight: 0.25, value: 130, stim: 25, heal: 35, stack: true, desc: 'Witcher-grade mutagen: +25s surge & +35 HP.' },
        elixir_wisdom: { name: "Grinder's XP Draught", type: 'consumable', weight: 0.2, value: 180, xpBoost: 180, stack: true, desc: '+30% XP from all kills & quests for 3 minutes.' },
        relay_cell: { name: 'Relay Cell', type: 'consumable', weight: 0.5, value: 80, stack: true, desc: 'Powers one Transit Pylon jump.' },
        ammo_box: { name: 'Ammo Box', type: 'consumable', weight: 1.0, value: 25, ammo: 1, stack: true },
        // Junk & Harvestable Gathering Resources (salvage -> credits / quest turn-ins).
        scrap_metal: { name: 'Scrap Metal', type: 'junk', weight: 1.0, value: 6, scrap: 2, stack: true },
        circuitry: { name: 'Circuitry', type: 'junk', weight: 0.3, value: 14, scrap: 4, stack: true },
        brood_gland: { name: 'Brood Gland', type: 'junk', weight: 0.4, value: 18, scrap: 2, stack: true },
        iron_ore: { name: 'Basin Iron Ore', type: 'junk', weight: 0.8, value: 22, scrap: 5, stack: true, desc: 'Mined from frontier ore veins.' },
        mithril_ore: { name: 'Deep-Vein Mithril Ore', type: 'junk', weight: 0.7, value: 48, scrap: 11, stack: true, desc: 'Gleaming blue-silver ore prized by smiths.' },
        starmetal_ore: { name: 'Meteorite Star-Metal', type: 'junk', weight: 0.6, value: 95, scrap: 22, stack: true, desc: 'Dense astral alloy from Dragonwild craters.' },
        champion_sigil: { name: "Champion's Sigil", type: 'junk', weight: 0.2, value: 140, scrap: 24, stack: true, desc: 'Torn from a slain Champion. Collectors across the Expanse pay well for these.' },
        ancient_coin: { name: 'Pre-Fall Coin', type: 'junk', weight: 0.05, value: 55, scrap: 9, stack: true, desc: 'Minted before the Meridian collapse. Found in buried caches.' },
        elderwood_log: { name: 'Elderwood Timber', type: 'junk', weight: 0.9, value: 20, scrap: 5, stack: true, desc: 'Resinous heartwood from Whispering Pinewoods.' },
        mirebloom_herb: { name: 'Mirebloom Herb', type: 'junk', weight: 0.15, value: 26, scrap: 6, stack: true, desc: 'Luminous swamp herb used in Swallow elixirs.' },
        sunleaf_herb: { name: 'Sunscorched Crimsonleaf', type: 'junk', weight: 0.15, value: 38, scrap: 9, stack: true, desc: 'Potent desert flora for Thunderbolt brews.' },
        runic_shard: { name: 'Meridian Runic Shard', type: 'junk', weight: 0.25, value: 55, scrap: 13, stack: true, desc: 'Crystallized ley-energy humming with Void resonance.' },
        cursed_bone: { name: 'Barrow-Wight Bone', type: 'junk', weight: 0.35, value: 32, scrap: 7, stack: true, desc: 'Etched undead relic from Barrow-Moor.' },
        dragon_scale: { name: 'Obsidian Dragon Scale', type: 'junk', weight: 0.5, value: 140, scrap: 32, stack: true, desc: 'Impervious volcanic scale shed by Dragonwild wyrms.' },
        // Quest items.
        culvert_keycard: { name: 'Culvert Keycard', type: 'quest', weight: 0, value: 0, desc: 'Opens the Culvert Sublevel hatch.' },
        bypass_valve: { name: 'Syndicate Bypass Valve', type: 'quest', weight: 2, value: 0, desc: 'Pulled from Pump Three. Somebody planted this.' },
        syndicate_ledger: { name: 'Syndicate Ledger', type: 'quest', weight: 0.5, value: 0, desc: 'Payment records naming the Culvert job.' },
        pressure_schematic: { name: 'Pressure Schematic', type: 'quest', weight: 0, value: 0, desc: 'Lets a technician reroute flow at the surface junction.' },
        relay_fuse: { name: 'Relay Fuse', type: 'quest', weight: 0.5, value: 0, desc: 'Fits the Abandoned Relay mast.' },
        convoy_manifest: { name: 'Convoy Manifest', type: 'quest', weight: 0.2, value: 0, desc: 'The cargo list from the crashed Aegis convoy.' }
    };

    const RARITY = {
        common: { name: 'Common', color: '#cbd5e1', affixes: 0, mult: 1.0, armorMult: 1.0 },
        rare: { name: 'Rare', color: '#38bdf8', affixes: 1, mult: 1.12, armorMult: 1.25 },
        epic: { name: 'Epic', color: '#c084fc', affixes: 2, mult: 1.25, armorMult: 1.55 },
        legendary: { name: 'Legendary', color: '#fbbf24', affixes: 2, mult: 1.45, armorMult: 1.95 }
    };
    const ARMOR_RARITY_MULT = { common: 1.0, rare: 1.25, epic: 1.55, legendary: 1.95 };
    const MANUFACTURERS = ['Freestead', 'Ironclad', 'Aegis', 'Helix', 'Basin-made', 'Dragonforged', 'Frostspire'];
    const AFFIXES = {
        thermal: { name: 'Thermal', desc: '15% chance to Burn on hit.', burnChance: 15 },
        cryo: { name: 'Cryo-lined', desc: '15% chance to Chill on hit.', chillChance: 15 },
        arcing: { name: 'Arcing', desc: '15% chance to Shock on hit.', shockChance: 15 },
        venomous: { name: 'Venomous', desc: '18% chance to apply Venom on hit.', venomChance: 18 },
        voidtouched: { name: 'Void-Touched', desc: '15% chance to apply Void on hit.', voidChance: 15 },
        piercing: { name: 'Piercing', desc: '+15 armor penetration.', pen: 15 },
        keen: { name: 'Keen', desc: '+25% weakspot damage.', critAdd: 0.25 },
        light: { name: 'Lightweight', desc: '-40% weight.', weightMult: 0.6 }
    };

    /* --------------------------------------------------------- loot */
    const LOOT = {
        raider: [['credits', 40, 8, 25], ['ammo_box', 25, 1, 1], ['scrap_metal', 30, 1, 2], ['medkit', 12, 1, 1], ['w_smg', 4, 1, 1]],
        syndicate: [['credits', 40, 20, 45], ['circuitry', 25, 1, 2], ['stim', 12, 1, 1], ['ammo_box', 20, 1, 1], ['w_shotgun', 5, 1, 1], ['w_lmg', 2, 1, 1]],
        militia: [['credits', 35, 10, 30], ['medkit', 20, 1, 1], ['ammo_box', 25, 1, 1], ['w_rifle', 5, 1, 1]],
        aegis: [['credits', 30, 30, 65], ['circuitry', 30, 1, 3], ['relay_cell', 8, 1, 1], ['w_dmr', 4, 1, 1], ['rig_plated', 3, 1, 1], ['elixir_swallow', 8, 1, 1]],
        helix: [['credits', 30, 30, 65], ['brood_gland', 25, 1, 2], ['runic_shard', 18, 1, 2], ['stim', 15, 1, 1], ['w_vector', 4, 1, 1]],
        brood: [['brood_gland', 45, 1, 2], ['scrap_metal', 18, 1, 1], ['credits', 15, 4, 14], ['mirebloom_herb', 10, 1, 1]],
        undead: [['cursed_bone', 45, 1, 2], ['credits', 30, 18, 48], ['elixir_swallow', 14, 1, 1], ['runic_shard', 14, 1, 1], ['w_rifle', 4, 1, 1]],
        dragon: [['dragon_scale', 45, 1, 2], ['starmetal_ore', 25, 1, 2], ['credits', 35, 65, 150], ['elixir_thunderbolt', 18, 1, 1], ['elixir_wisdom', 10, 1, 1]],
        boss: [['credits', 100, 140, 260], ['medkit', 80, 2, 3], ['elixir_swallow', 55, 1, 2], ['relay_cell', 60, 1, 2], ['elixir_wisdom', 25, 1, 1]],
        cache: [['credits', 60, 20, 65], ['medkit', 30, 1, 2], ['ammo_box', 40, 1, 2], ['circuitry', 25, 1, 2], ['relay_cell', 12, 1, 1], ['w_carbine', 6, 1, 1], ['rig_light', 6, 1, 1]],
        champion: [['credits', 100, 90, 220], ['champion_sigil', 70, 1, 1], ['elixir_thunderbolt', 30, 1, 1], ['elixir_wisdom', 22, 1, 1], ['relay_cell', 25, 1, 1], ['w_dmr', 8, 1, 1], ['rig_plated', 8, 1, 1]],
        treasure: [['credits', 100, 45, 140], ['ancient_coin', 60, 1, 3], ['elixir_swallow', 25, 1, 1], ['elixir_wisdom', 10, 1, 1], ['runic_shard', 20, 1, 2], ['relay_cell', 12, 1, 1], ['w_rifle', 6, 1, 1], ['rig_light', 6, 1, 1]],
        locked: [['credits', 100, 75, 180], ['relay_cell', 45, 1, 2], ['elixir_thunderbolt', 35, 1, 2], ['w_dmr', 10, 1, 1], ['rig_plated', 10, 1, 1], ['elixir_wisdom', 18, 1, 1]]
    };
    const PITY_GUARANTEE = 12;

    BO.OWRPGStatsData = {
        ATTRS, ATTR_IDS, ATTR_BASE, ATTR_MIN, ATTR_MAX, CREATION_POINTS, LEVEL_CAP,
        xpToNext, SKILLS, SKILL_CAP, skillXpToNext, STANDING_STONES,
        TIER_LEVELS, PERK_TREES, STATUSES, REACTIONS, ABILITIES, ENEMIES,
        ITEMS, RARITY, ARMOR_RARITY_MULT, MANUFACTURERS, AFFIXES, LOOT, PITY_GUARANTEE,
        perkIndex() {
            if (this._pi) return this._pi;
            const out = {};
            for (const [tree, t] of Object.entries(PERK_TREES)) {
                t.tiers.forEach((pair, tier) => pair.forEach((perk) => { out[perk.id] = { tree, tier, perk }; }));
            }
            return (this._pi = out);
        }
    };
})(window.BO);
;

/* --- src/data/OWRPGExpansionData.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Flagship Expansion Data (2.0)
   1) BO.OWRPGGunStats: RPG-only stats covering EVERY weapon in WeaponsData.ORDER
      (never mutating BO.WeaponsData!).
   2) 30+ unlockable guns, 24+ multi-slot armor pieces (6 Armor Sets including
      Dragonwild Slayer & Barrow Lichplate), 10 durability-tracked field tools,
      12+ unlockable Powers (incl. Ultimate slot), 4 Mounts, 16 Witcher-style
      Bounties & 12 Codex Milestones across the 1280 x 1280 m Meridian Expanse.
============================================================================ */
(function (BO) {
    'use strict';

    const PASSIVE_TRAITS = {
        executioner: { name: 'Executioner', desc: '+35% damage against targets below 35% HP.' },
        chain_arc: { name: 'Chain Arc', desc: '25% chance on hit to arc Shock damage to a nearby foe.' },
        venom_fang: { name: 'Venom Fang', desc: 'Applies Venom stacks and deals +15% damage vs poisoned targets.' },
        void_siphon: { name: 'Void Siphon', desc: 'Siphons 4% of damage dealt as HP (+6 HP on kill).' },
        armor_shredder: { name: 'Armor Shredder', desc: 'Hits shred 15% enemy armor (stacks up to 45%).' },
        headhunter: { name: 'Headhunter', desc: '+30% weakspot damage; weakspot kills refund 25% cooldowns.' },
        scavenger: { name: 'Scavenger', desc: 'Kills yield +12 bonus credits and refill 10% magazine.' },
        heat_sink: { name: 'Heat Sink', desc: 'Every 4th hit triggers bonus Burn damage & applies Burn.' },
        frostbite: { name: 'Frostbite', desc: '+20% damage vs Chilled foes and extends Chill duration.' },
        overcharge: { name: 'Overcharge', desc: 'Shock hits restore +6% Ultimate charge.' },
        bloodlust: { name: 'Bloodlust', desc: 'Close-range (<6m) & melee kills heal 12 HP.' },
        kinetic_slam: { name: 'Kinetic Slam', desc: 'Weakspot hits stagger briefly and gain +18 Armor Pen.' }
    };

    const CAT_BASELINE = {
        'Assault Rifle': { rpgDmgMult: 1.05, critChance: 0.08, critMultBonus: 0.12, armorPen: 10, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 140, passiveTrait: 'armor_shredder' },
        'SMG': { rpgDmgMult: 1.00, critChance: 0.10, critMultBonus: 0.08, armorPen: 6, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 130, passiveTrait: 'scavenger' },
        'Shotgun': { rpgDmgMult: 1.12, critChance: 0.06, critMultBonus: 0.10, armorPen: 12, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 150, passiveTrait: 'bloodlust' },
        'LMG': { rpgDmgMult: 1.10, critChance: 0.05, critMultBonus: 0.08, armorPen: 16, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 180, passiveTrait: 'heat_sink' },
        'Sniper Rifle': { rpgDmgMult: 1.25, critChance: 0.18, critMultBonus: 0.35, armorPen: 28, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 135, passiveTrait: 'headhunter' },
        'Marksman Rifle': { rpgDmgMult: 1.18, critChance: 0.15, critMultBonus: 0.25, armorPen: 20, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 140, passiveTrait: 'kinetic_slam' },
        'Pistol': { rpgDmgMult: 1.08, critChance: 0.12, critMultBonus: 0.18, armorPen: 8, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 120, passiveTrait: 'executioner' },
        'Launcher': { rpgDmgMult: 1.30, critChance: 0.04, critMultBonus: 0.05, armorPen: 35, element: 'burn', elemDmg: 22, statusChance: 35, maxDurability: 110, passiveTrait: 'heat_sink' },
        'Melee Weapon': { rpgDmgMult: 1.20, critChance: 0.16, critMultBonus: 0.25, armorPen: 22, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 170, passiveTrait: 'bloodlust' },
        'Magic Weapon': { rpgDmgMult: 1.35, critChance: 0.14, critMultBonus: 0.22, armorPen: 30, element: 'void', elemDmg: 28, statusChance: 38, maxDurability: 160, passiveTrait: 'void_siphon' }
    };

    const CURATED_GUN_OVERRIDES = {
        m1911: { rpgDmgMult: 1.08, critChance: 0.12, critMultBonus: 0.15, armorPen: 8, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 120, tier: 1, unlockReq: 'Starter Sidearm', passiveTrait: 'executioner' },
        m16a4: { rpgDmgMult: 1.05, critChance: 0.10, critMultBonus: 0.15, armorPen: 10, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 145, tier: 1, unlockReq: 'Starter Carbine', passiveTrait: 'headhunter' },
        aks74u: { rpgDmgMult: 1.06, critChance: 0.10, critMultBonus: 0.10, armorPen: 8, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 135, tier: 1, unlockReq: 'Raider Drop / Fence', passiveTrait: 'scavenger' },
        spas12_tac: { rpgDmgMult: 1.15, critChance: 0.08, critMultBonus: 0.12, armorPen: 14, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 150, tier: 2, unlockReq: 'Syndicate Fence', passiveTrait: 'kinetic_slam' },
        kar98k_irons: { rpgDmgMult: 1.22, critChance: 0.18, critMultBonus: 0.30, armorPen: 22, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 140, tier: 1, unlockReq: 'Dottie Store', passiveTrait: 'headhunter' },
        rpd: { rpgDmgMult: 1.16, critChance: 0.06, critMultBonus: 0.10, armorPen: 18, element: 'burn', elemDmg: 10, statusChance: 15, maxDurability: 185, tier: 2, unlockReq: 'Syndicate Fence', passiveTrait: 'heat_sink' },
        mk14: { rpgDmgMult: 1.24, critChance: 0.16, critMultBonus: 0.28, armorPen: 24, element: 'shock', elemDmg: 12, statusChance: 18, maxDurability: 155, tier: 3, unlockReq: 'Aegis Quartermaster', passiveTrait: 'overcharge' },
        vector_kriss: { rpgDmgMult: 1.14, critChance: 0.14, critMultBonus: 0.18, armorPen: 12, element: 'venom', elemDmg: 9, statusChance: 18, maxDurability: 140, tier: 3, unlockReq: 'Helix Exchange', passiveTrait: 'venom_fang' },
        aa12: { rpgDmgMult: 1.28, critChance: 0.08, critMultBonus: 0.15, armorPen: 18, element: 'burn', elemDmg: 14, statusChance: 22, maxDurability: 170, tier: 4, unlockReq: 'Gutter King Vasko', passiveTrait: 'heat_sink' },
        m4a1: { rpgDmgMult: 1.18, critChance: 0.12, critMultBonus: 0.18, armorPen: 14, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 160, tier: 2, unlockReq: 'Workbench Trials Quest', passiveTrait: 'armor_shredder' },
        ak47: { rpgDmgMult: 1.20, critChance: 0.09, critMultBonus: 0.16, armorPen: 16, element: 'burn', elemDmg: 10, statusChance: 14, maxDurability: 175, tier: 2, unlockReq: 'Rail Yard Fence', passiveTrait: 'scavenger' },
        scarh: { rpgDmgMult: 1.28, critChance: 0.14, critMultBonus: 0.24, armorPen: 26, element: 'shock', elemDmg: 14, statusChance: 20, maxDurability: 175, tier: 3, unlockReq: 'Rogue Mecha Quest', passiveTrait: 'armor_shredder' },
        acr_68: { rpgDmgMult: 1.26, critChance: 0.16, critMultBonus: 0.22, armorPen: 20, element: 'chill', elemDmg: 14, statusChance: 22, maxDurability: 165, tier: 3, unlockReq: 'Aegis Quartermaster', passiveTrait: 'frostbite' },
        an94_abakan: { rpgDmgMult: 1.25, critChance: 0.14, critMultBonus: 0.22, armorPen: 18, element: 'chill', elemDmg: 15, statusChance: 24, maxDurability: 165, tier: 3, unlockReq: 'Mire Plague Quest', passiveTrait: 'frostbite' },
        galil_ar: { rpgDmgMult: 1.22, critChance: 0.11, critMultBonus: 0.18, armorPen: 16, element: 'venom', elemDmg: 11, statusChance: 18, maxDurability: 170, tier: 3, unlockReq: 'Codex: 50 Kills', passiveTrait: 'venom_fang' },
        p90: { rpgDmgMult: 1.18, critChance: 0.13, critMultBonus: 0.15, armorPen: 14, element: 'shock', elemDmg: 10, statusChance: 18, maxDurability: 155, tier: 2, unlockReq: 'Syndicate Arc-Tech Drop', passiveTrait: 'chain_arc' },
        ump45: { rpgDmgMult: 1.16, critChance: 0.12, critMultBonus: 0.16, armorPen: 12, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 150, tier: 2, unlockReq: 'Dottie Store', passiveTrait: 'executioner' },
        mp7_navy: { rpgDmgMult: 1.20, critChance: 0.16, critMultBonus: 0.22, armorPen: 18, element: 'void', elemDmg: 10, statusChance: 16, maxDurability: 155, tier: 3, unlockReq: 'Ghost Codex Milestone', passiveTrait: 'executioner' },
        m40a3_cod4: { rpgDmgMult: 1.28, critChance: 0.20, critMultBonus: 0.35, armorPen: 26, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 145, tier: 2, unlockReq: 'Militia Trusted', passiveTrait: 'headhunter' },
        intervention: { rpgDmgMult: 1.42, critChance: 0.24, critMultBonus: 0.45, armorPen: 36, element: 'shock', elemDmg: 22, statusChance: 28, maxDurability: 165, tier: 4, unlockReq: 'Alpine Dish / Frostspire', passiveTrait: 'headhunter' },
        barrett_50cal: { rpgDmgMult: 1.52, critChance: 0.22, critMultBonus: 0.52, armorPen: 46, element: 'burn', elemDmg: 28, statusChance: 32, maxDurability: 185, tier: 4, unlockReq: 'Codex: 3 Bosses', passiveTrait: 'kinetic_slam' },
        deagle: { rpgDmgMult: 1.22, critChance: 0.15, critMultBonus: 0.25, armorPen: 18, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 140, tier: 2, unlockReq: 'Syndicate Fence', passiveTrait: 'executioner' },
        gold_deagle_cod4: { rpgDmgMult: 1.42, critChance: 0.22, critMultBonus: 0.40, armorPen: 28, element: 'burn', elemDmg: 18, statusChance: 24, maxDurability: 185, tier: 4, unlockReq: 'Codex: 100 Kills', passiveTrait: 'scavenger' },
        python_magnum: { rpgDmgMult: 1.26, critChance: 0.18, critMultBonus: 0.30, armorPen: 20, element: 'venom', elemDmg: 14, statusChance: 22, maxDurability: 150, tier: 3, unlockReq: 'Mire Cache', passiveTrait: 'venom_fang' },
        m249: { rpgDmgMult: 1.22, critChance: 0.08, critMultBonus: 0.12, armorPen: 22, element: 'shock', elemDmg: 12, statusChance: 16, maxDurability: 200, tier: 3, unlockReq: 'Aegis Quartermaster', passiveTrait: 'overcharge' },
        mg42_buzzsaw: { rpgDmgMult: 1.32, critChance: 0.08, critMultBonus: 0.14, armorPen: 24, element: 'burn', elemDmg: 14, statusChance: 18, maxDurability: 215, tier: 4, unlockReq: 'Quarry Colossus / Foundry', passiveTrait: 'heat_sink' },
        minigun_death: { rpgDmgMult: 1.44, critChance: 0.10, critMultBonus: 0.18, armorPen: 32, element: 'shock', elemDmg: 18, statusChance: 22, maxDurability: 250, tier: 4, unlockReq: 'Rogue Mecha X-9', passiveTrait: 'overcharge' },
        rpg7_warhead: { rpgDmgMult: 1.45, critChance: 0.05, critMultBonus: 0.10, armorPen: 42, element: 'burn', elemDmg: 38, statusChance: 45, maxDurability: 130, tier: 4, unlockReq: 'Syndicate Sworn', passiveTrait: 'kinetic_slam' },
        model_1887_mw2: { rpgDmgMult: 1.26, critChance: 0.12, critMultBonus: 0.20, armorPen: 16, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 165, tier: 3, unlockReq: 'Gutter King Bounty', passiveTrait: 'bloodlust' },
        ksg_slug: { rpgDmgMult: 1.30, critChance: 0.16, critMultBonus: 0.30, armorPen: 28, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 165, tier: 3, unlockReq: 'Quarry Titans Quest', passiveTrait: 'kinetic_slam' },
        stg44: { rpgDmgMult: 1.22, critChance: 0.12, critMultBonus: 0.20, armorPen: 16, element: 'burn', elemDmg: 12, statusChance: 18, maxDurability: 170, tier: 3, unlockReq: 'Old-World Cache', passiveTrait: 'scavenger' },
        f2000: { rpgDmgMult: 1.28, critChance: 0.14, critMultBonus: 0.20, armorPen: 18, element: 'void', elemDmg: 16, statusChance: 22, maxDurability: 165, tier: 3, unlockReq: 'Helix Exchange', passiveTrait: 'void_siphon' },
        raygun: { rpgDmgMult: 1.52, critChance: 0.16, critMultBonus: 0.28, armorPen: 36, element: 'venom', elemDmg: 34, statusChance: 40, maxDurability: 190, tier: 4, unlockReq: 'Meridian Sovereign Quest', passiveTrait: 'venom_fang' },
        tesla_wunder: { rpgDmgMult: 1.58, critChance: 0.14, critMultBonus: 0.22, armorPen: 38, element: 'shock', elemDmg: 38, statusChance: 45, maxDurability: 190, tier: 4, unlockReq: 'Grid Restorer Codex', passiveTrait: 'chain_arc' },
        void_singularity: { rpgDmgMult: 1.62, critChance: 0.16, critMultBonus: 0.28, armorPen: 40, element: 'void', elemDmg: 42, statusChance: 45, maxDurability: 195, tier: 4, unlockReq: 'Helix Cipher / Lich Crypt', passiveTrait: 'void_siphon' },
        inferno_drake: { rpgDmgMult: 1.68, critChance: 0.16, critMultBonus: 0.30, armorPen: 44, element: 'burn', elemDmg: 48, statusChance: 48, maxDurability: 210, tier: 4, unlockReq: 'Dragonwild Vault Boss', passiveTrait: 'heat_sink' }
    };

    const ELEM_BY_MAGIC = {
        plasma_splash: 'venom', chain_lightning: 'shock', cone_shockwave: 'shock',
        frost_cone: 'chill', shrink_ray: 'void', microwave_pop: 'burn',
        solar_pillar: 'shock', acid_swarm: 'venom', paralyzer_beam: 'chill',
        black_hole: 'void', dragon_breath: 'burn', soul_drain: 'void',
        chrono_rift: 'chill', chaos_storm: 'void', megaman_plasma: 'shock'
    };

    const OWRPGGunStats = {};
    const order = (BO.WeaponsData && BO.WeaponsData.ORDER) || [];
    for (let idx = 0; idx < order.length; idx++) {
        const id = order[idx];
        const w = BO.WeaponsData.get(id);
        const base = CAT_BASELINE[w.category] || CAT_BASELINE['Assault Rifle'];
        const tier = w.kind === 'magic' ? 4 : (w.tier === 'uncommon' ? 3 : (w.unlockLevel >= 16 ? 2 : 1));
        const lvlScale = 1 + Math.min(0.28, (w.unlockLevel || 1) * 0.008);
        const elem = w.magicType ? (ELEM_BY_MAGIC[w.magicType] || 'void') : base.element;
        const ov = CURATED_GUN_OVERRIDES[id] || {};
        const passiveTrait = ov.passiveTrait || base.passiveTrait;
        OWRPGGunStats[id] = {
            rpgDmgMult: Number((ov.rpgDmgMult || (base.rpgDmgMult * lvlScale)).toFixed(2)),
            critChance: ov.critChance !== undefined ? ov.critChance : base.critChance,
            critMultBonus: ov.critMultBonus !== undefined ? ov.critMultBonus : base.critMultBonus,
            armorPen: ov.armorPen !== undefined ? ov.armorPen : (base.armorPen + (tier - 1) * 4),
            element: ov.element || elem,
            elemDmg: ov.elemDmg !== undefined ? ov.elemDmg : base.elemDmg,
            statusChance: ov.statusChance !== undefined ? ov.statusChance : base.statusChance,
            maxDurability: ov.maxDurability || (base.maxDurability + (tier - 1) * 15),
            tier: ov.tier || tier,
            unlockReq: ov.unlockReq || (tier >= 3 ? 'Expanse Drop / Faction Vendor' : 'Meridian Frontier'),
            passiveTrait,
            passiveDesc: PASSIVE_TRAITS[passiveTrait]?.desc || ''
        };
    }

    function getGunStats(weaponId) {
        return OWRPGGunStats[weaponId] || {
            rpgDmgMult: 1.0, critChance: 0.08, critMultBonus: 0.1, armorPen: 8,
            element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 140,
            tier: 1, unlockReq: 'Meridian Frontier', passiveTrait: 'armor_shredder',
            passiveDesc: PASSIVE_TRAITS.armor_shredder.desc
        };
    }

    /* --------------------------------------------------------- 6 Armor Sets (2-pc & 3-pc bonuses) */
    const ARMOR_SETS = {
        warden_vanguard: {
            id: 'warden_vanguard', name: 'Warden Vanguard', color: '#f5a623',
            bonus2: { label: '2-Piece: +25 Max HP, +10 Armor', maxHp: 25, armor: 10 },
            bonus3: { label: '3-Piece: Detonators heal 18 HP & +25% Reaction Damage', detHeal: 18, reactMult: 0.25 }
        },
        ironclad_juggernaut: {
            id: 'ironclad_juggernaut', name: 'Ironclad Juggernaut', color: '#ef4444',
            bonus2: { label: '2-Piece: +20 Armor, +15 kg Carry Weight', armor: 20, carry: 15 },
            bonus3: { label: '3-Piece: +25 Armor Pen & +15% Heavy/Shotgun Damage', heavyPen: 25, heavyDmg: 0.15 }
        },
        ghost_stalker: {
            id: 'ghost_stalker', name: 'Ghost Stalker', color: '#a3e635',
            bonus2: { label: '2-Piece: -20% Noise, +10% Move Speed', noise: -0.20, speedMult: 0.10 },
            bonus3: { label: '3-Piece: +35% Weakspot Mult & +0.5x Sneak Mult', critAdd: 0.35, stealthMult: 0.5 }
        },
        meridian_arctech: {
            id: 'meridian_arctech', name: 'Meridian Arc-Tech', color: '#38bdf8',
            bonus2: { label: '2-Piece: -15% Cooldowns, +20% Status Potency', cdr: 0.15, statusPotency: 0.20 },
            bonus3: { label: '3-Piece: +12% All Elem Resist & Reactions Chain +1', allElemRes: 0.12, chain: 1 }
        },
        barrow_lichplate: {
            id: 'barrow_lichplate', name: 'Barrow-Wight Lichplate', color: '#a855f7',
            bonus2: { label: '2-Piece: +30 Max HP, +18% Void/Chill Resist', maxHp: 30, armor: 14 },
            bonus3: { label: '3-Piece: +16 HP on Kill & +35% Status Potency', killHeal: 16, statusPotency: 0.35 }
        },
        dragonwild_slayer: {
            id: 'dragonwild_slayer', name: 'Dragonwild Obsidian Plate', color: '#fbbf24',
            bonus2: { label: '2-Piece: +35 Armor, +20% All Elemental Resist', armor: 35, allElemRes: 0.20 },
            bonus3: { label: '3-Piece: +35% Boss/Beast Damage & +40% Reaction Damage', bossDmg: 0.35, reactMult: 0.40 }
        }
    };

    /* --------------------------------------------------------- 30+ Unlockable Guns */
    const NEW_GUNS = {
        w_m4a1_warden: { name: "Warden's SOPMOD M4", type: 'weapon', base: 'm4a1', weight: 3.3, value: 380, rarity: 'rare', req: ['RFX', 5] },
        w_ak47_rust: { name: 'Rail-Forged AK-47', type: 'weapon', base: 'ak47', weight: 3.9, value: 410, rarity: 'rare', req: ['BRW', 6], fixedAffix: 'thermal' },
        w_scar_aegis: { name: 'Aegis Director SCAR-H', type: 'weapon', base: 'scarh', weight: 4.3, value: 780, rarity: 'epic', req: ['BRW', 7], fixedAffix: 'arcing' },
        w_acr_specops: { name: 'Alpine Cryo ACR', type: 'weapon', base: 'acr_68', weight: 3.6, value: 720, rarity: 'epic', req: ['PRC', 6], fixedAffix: 'cryo', suppressed: true },
        w_p90_arc: { name: 'Volt-Coil P90', type: 'weapon', base: 'p90', weight: 2.7, value: 460, rarity: 'rare', req: ['TCH', 5], fixedAffix: 'arcing' },
        w_ump45_enforcer: { name: 'Ironclad UMP45', type: 'weapon', base: 'ump45', weight: 2.8, value: 340, rarity: 'rare', req: ['RFX', 5] },
        w_mp7_ghost: { name: 'Phantom MP7A1', type: 'weapon', base: 'mp7_navy', weight: 2.2, value: 640, rarity: 'epic', req: ['RFX', 7], suppressed: true, fixedAffix: 'voidtouched' },
        w_m40a3_ranger: { name: 'Basin Watch M40A3', type: 'weapon', base: 'm40a3_cod4', weight: 4.5, value: 440, rarity: 'rare', req: ['PRC', 6] },
        w_intervention_apex: { name: 'Frostspire Intervention .408', type: 'weapon', base: 'intervention', weight: 6.2, value: 1250, rarity: 'legendary', req: ['PRC', 8], fixedAffix: 'keen' },
        w_barrett_anti: { name: 'Crater-Buster .50 Cal', type: 'weapon', base: 'barrett_50cal', weight: 8.8, value: 1450, rarity: 'legendary', req: ['BRW', 8], fixedAffix: 'piercing' },
        w_deagle_judge: { name: 'Rail Marshal Deagle', type: 'weapon', base: 'deagle', weight: 1.9, value: 420, rarity: 'rare', req: ['BRW', 5], fixedAffix: 'piercing' },
        w_gold_deagle_king: { name: '24K Sovereign Eagle', type: 'weapon', base: 'gold_deagle_cod4', weight: 1.9, value: 1200, rarity: 'legendary', req: ['PRS', 7], fixedAffix: 'keen' },
        w_python_frontier: { name: 'Mirefang .357 Python', type: 'weapon', base: 'python_magnum', weight: 1.7, value: 540, rarity: 'epic', req: ['PRC', 6], fixedAffix: 'venomous' },
        w_m249_bastion: { name: 'Aegis Bastion SAW', type: 'weapon', base: 'm249', weight: 7.4, value: 760, rarity: 'epic', req: ['BRW', 7], fixedAffix: 'arcing' },
        w_mg42_scrap: { name: 'Quarry Buzzsaw MG42', type: 'weapon', base: 'mg42_buzzsaw', weight: 9.2, value: 1100, rarity: 'legendary', req: ['BRW', 8], fixedAffix: 'thermal' },
        w_minigun_titan: { name: 'Unit X-9 Rotary Minigun', type: 'weapon', base: 'minigun_death', weight: 12.5, value: 1650, rarity: 'legendary', req: ['BRW', 9], fixedAffix: 'arcing' },
        w_rpg7_demolisher: { name: 'Syndicate Siege RPG-7', type: 'weapon', base: 'rpg7_warhead', weight: 6.8, value: 980, rarity: 'epic', req: ['BRW', 7], fixedAffix: 'thermal' },
        w_model1887_twin: { name: 'Nomad Lever 1887', type: 'weapon', base: 'model_1887_mw2', weight: 3.6, value: 620, rarity: 'epic', req: ['RFX', 6] },
        w_ksg_breach: { name: 'Quarry Breacher KSG', type: 'weapon', base: 'ksg_slug', weight: 3.9, value: 680, rarity: 'epic', req: ['BRW', 6], fixedAffix: 'piercing' },
        w_galil_veteran: { name: 'Whispering Pine Galil', type: 'weapon', base: 'galil_ar', weight: 3.7, value: 580, rarity: 'epic', req: ['PRC', 5], fixedAffix: 'venomous' },
        w_an94_cryo: { name: 'Boreal AN-94', type: 'weapon', base: 'an94_abakan', weight: 3.6, value: 740, rarity: 'epic', req: ['TCH', 6], fixedAffix: 'cryo' },
        w_stg44_relic: { name: 'Relic StG 44', type: 'weapon', base: 'stg44', weight: 4.1, value: 520, rarity: 'rare', req: ['BRW', 5], fixedAffix: 'thermal' },
        w_f2000_helix: { name: 'Helix Pulse F2000', type: 'weapon', base: 'f2000', weight: 3.5, value: 820, rarity: 'epic', req: ['TCH', 7], fixedAffix: 'voidtouched' },
        w_raygun_proto: { name: 'Meridian Proto Ray Gun', type: 'weapon', base: 'raygun', weight: 2.1, value: 1700, rarity: 'legendary', req: ['TCH', 7], fixedAffix: 'venomous' },
        w_tesla_coil: { name: 'Wunderwaffe Arc-Carbine', type: 'weapon', base: 'tesla_wunder', weight: 4.4, value: 1850, rarity: 'legendary', req: ['TCH', 8], fixedAffix: 'arcing' },
        w_void_staff: { name: 'Barrow-Lich Void Staff', type: 'weapon', base: 'void_singularity', weight: 3.8, value: 1950, rarity: 'legendary', req: ['TCH', 8], fixedAffix: 'voidtouched' },
        w_fire_staff: { name: "Vaelgor's Dragonwild Staff", type: 'weapon', base: 'inferno_drake', weight: 3.8, value: 2400, rarity: 'legendary', req: ['TCH', 8], fixedAffix: 'thermal' }
    };

    /* --------------------------------------------------------- 26+ Multi-Slot Armor Pieces */
    const NEW_ARMOR = {
        // Helmets
        helm_scav: { name: 'Scrapper Respirator', type: 'helmet', armor: 6, weight: 1.2, value: 85, rarity: 'common', maxDur: 100, elemRes: { venom: 0.1 } },
        helm_warden: { name: 'Warden Ranger Visor', type: 'helmet', armor: 12, weight: 1.5, value: 320, rarity: 'rare', setId: 'warden_vanguard', maxDur: 130, elemRes: { burn: 0.12 }, stats: { critAdd: 0.08 } },
        helm_juggernaut: { name: 'Ironclad Blast Helm', type: 'helmet', armor: 18, weight: 2.6, value: 520, rarity: 'epic', setId: 'ironclad_juggernaut', req: ['BRW', 6], maxDur: 165, elemRes: { burn: 0.15, shock: 0.1 } },
        helm_ghost: { name: 'Ghost Recon Hood', type: 'helmet', armor: 9, weight: 0.9, value: 480, rarity: 'epic', setId: 'ghost_stalker', req: ['RFX', 6], maxDur: 125, stats: { critAdd: 0.12 } },
        helm_arctech: { name: 'Arc-Tech Neural Cowl', type: 'helmet', armor: 14, weight: 1.3, value: 740, rarity: 'legendary', setId: 'meridian_arctech', req: ['TCH', 7], maxDur: 150, elemRes: { shock: 0.2, void: 0.18 }, stats: { statusPotency: 0.12 } },
        helm_lichplate: { name: 'Crown of Grimhollow', type: 'helmet', armor: 16, weight: 1.6, value: 860, rarity: 'epic', setId: 'barrow_lichplate', req: ['TCH', 6], maxDur: 155, elemRes: { void: 0.22, chill: 0.18 }, stats: { statusPotency: 0.15 } },
        helm_dragonwild: { name: 'Dragonbone Greathelm', type: 'helmet', armor: 24, weight: 2.4, value: 1600, rarity: 'legendary', setId: 'dragonwild_slayer', req: ['BRW', 8], maxDur: 200, elemRes: { burn: 0.28, void: 0.18 }, stats: { critAdd: 0.18 } },
        // Rigs
        rig_warden: { name: 'Warden Vanguard Plate', type: 'rig', armor: 24, weight: 6.5, value: 450, rarity: 'rare', setId: 'warden_vanguard', req: ['BRW', 5], maxDur: 140, elemRes: { burn: 0.15 }, stats: { maxHp: 15 } },
        rig_juggernaut: { name: 'Ironclad Siege Rig', type: 'rig', armor: 38, weight: 11.0, value: 820, rarity: 'epic', setId: 'ironclad_juggernaut', req: ['BRW', 7], maxDur: 190, elemRes: { burn: 0.2, venom: 0.15 }, stats: { carry: 10 } },
        rig_ghost: { name: 'Ghost Stealth Harness', type: 'rig', armor: 18, weight: 3.5, value: 680, rarity: 'epic', setId: 'ghost_stalker', req: ['RFX', 6], maxDur: 130, elemRes: { chill: 0.15 }, stats: { noise: -0.15 } },
        rig_arctech: { name: 'Arc-Tech Exo-Vest', type: 'rig', armor: 30, weight: 5.5, value: 1100, rarity: 'legendary', setId: 'meridian_arctech', req: ['TCH', 7], maxDur: 170, elemRes: { shock: 0.25, void: 0.2 }, stats: { cdr: 0.1 } },
        rig_lichplate: { name: 'Barrow-Wight Cuirass', type: 'rig', armor: 34, weight: 7.5, value: 1050, rarity: 'epic', setId: 'barrow_lichplate', req: ['BRW', 6], maxDur: 175, elemRes: { void: 0.25, venom: 0.2 }, stats: { maxHp: 25 } },
        rig_dragonwild: { name: 'Obsidian Dragonscale Cuirass', type: 'rig', armor: 48, weight: 9.5, value: 2100, rarity: 'legendary', setId: 'dragonwild_slayer', req: ['BRW', 8], maxDur: 220, elemRes: { burn: 0.35, shock: 0.2 }, stats: { maxHp: 40 } },
        // Boots
        boots_scav: { name: 'Patched Work Boots', type: 'boots', armor: 4, weight: 1.0, value: 70, rarity: 'common', maxDur: 100 },
        boots_warden: { name: 'Warden Trail Boots', type: 'boots', armor: 9, weight: 1.4, value: 280, rarity: 'rare', setId: 'warden_vanguard', maxDur: 130, elemRes: { venom: 0.12 }, stats: { speedMult: 0.05 } },
        boots_juggernaut: { name: 'Ironclad Mag-Greaves', type: 'boots', armor: 15, weight: 2.8, value: 490, rarity: 'epic', setId: 'ironclad_juggernaut', req: ['BRW', 6], maxDur: 165, elemRes: { shock: 0.18 }, stats: { carry: 8 } },
        boots_ghost: { name: 'Ghost Softstep Treads', type: 'boots', armor: 7, weight: 0.8, value: 510, rarity: 'epic', setId: 'ghost_stalker', req: ['RFX', 6], maxDur: 125, stats: { speedMult: 0.08, noise: -0.18 } },
        boots_arctech: { name: 'Arc-Tech Thruster Greaves', type: 'boots', armor: 11, weight: 1.2, value: 690, rarity: 'legendary', setId: 'meridian_arctech', req: ['TCH', 6], maxDur: 150, elemRes: { chill: 0.2, void: 0.12 }, stats: { speedMult: 0.09 } },
        boots_lichplate: { name: 'Grimhollow Sabatons', type: 'boots', armor: 13, weight: 1.8, value: 720, rarity: 'epic', setId: 'barrow_lichplate', maxDur: 155, elemRes: { chill: 0.22 }, stats: { speedMult: 0.06 } },
        boots_dragonwild: { name: 'Dragonclaw Striders', type: 'boots', armor: 19, weight: 2.0, value: 1450, rarity: 'legendary', setId: 'dragonwild_slayer', req: ['RFX', 7], maxDur: 195, elemRes: { burn: 0.25 }, stats: { speedMult: 0.11 } },
        // Relics
        relic_warden: { name: "Kessler's Ranger Star", type: 'relic', armor: 5, weight: 0.3, value: 420, rarity: 'rare', setId: 'warden_vanguard', maxDur: 140, stats: { maxHp: 20, detHeal: 8 } },
        relic_juggernaut: { name: 'Rail Baron Piston Core', type: 'relic', armor: 10, weight: 0.8, value: 640, rarity: 'epic', setId: 'ironclad_juggernaut', maxDur: 160, stats: { meleeMult: 0.2, armor: 8 } },
        relic_ghost: { name: 'Viper Optical Prism', type: 'relic', armor: 4, weight: 0.2, value: 620, rarity: 'epic', setId: 'ghost_stalker', maxDur: 135, stats: { critAdd: 0.15, stealthMult: 0.35 } },
        relic_arctech: { name: 'Meridian Harmonic Coil', type: 'relic', armor: 6, weight: 0.4, value: 950, rarity: 'legendary', setId: 'meridian_arctech', maxDur: 170, elemRes: { void: 0.25, shock: 0.2 }, stats: { statusPotency: 0.18, cdr: 0.08 } },
        relic_lich_phylactery: { name: "Malgath's Soul Phylactery", type: 'relic', armor: 8, weight: 0.4, value: 1150, rarity: 'legendary', setId: 'barrow_lichplate', maxDur: 175, elemRes: { void: 0.30 }, stats: { killHeal: 12, cdr: 0.10 } },
        relic_dragon_heart: { name: 'Heart of Vaelgor', type: 'relic', armor: 14, weight: 0.6, value: 2200, rarity: 'legendary', setId: 'dragonwild_slayer', maxDur: 210, elemRes: { burn: 0.35, void: 0.25 }, stats: { maxHp: 45, reactMult: 0.25 } },
        relic_crater_shard: { name: 'Vitrified Crater Shard', type: 'relic', armor: 8, weight: 0.5, value: 880, rarity: 'legendary', maxDur: 160, elemRes: { burn: 0.22, void: 0.22 }, stats: { reactMult: 0.2 } },
        relic_brood_heart: { name: 'Matriarch Venom Heart', type: 'relic', armor: 6, weight: 0.6, value: 780, rarity: 'epic', maxDur: 150, elemRes: { venom: 0.35 }, stats: { maxHp: 22 } }
    };

    /* --------------------------------------------------------- 10 Durability-Tracked Field Pickups / Tools */
    const NEW_TOOLS = {
        tool_scrap_flamer: { name: 'Scrap Flamer', type: 'tool', toolKind: 'flamer', weight: 3.0, value: 320, rarity: 'rare', maxDur: 60, wearPerUse: 6, dmg: 65, element: 'burn', range: 9, desc: 'Sprays a 9m cone of burning promethium. Degrades per burst.' },
        tool_breach_hammer: { name: 'Breaching Hammer', type: 'tool', toolKind: 'hammer', weight: 4.2, value: 340, rarity: 'rare', maxDur: 80, wearPerUse: 8, dmg: 110, element: 'expose', range: 4.5, desc: 'Shockwave maul that shatters armor and Exposes nearby enemies.' },
        tool_kinetic_shield: { name: 'Portable Kinetic Shield', type: 'tool', toolKind: 'shield', weight: 2.5, value: 420, rarity: 'epic', maxDur: 100, wearPerUse: 18, shieldHp: 60, durSec: 10, desc: 'Projects a 60 HP personal kinetic barrier for 10s.' },
        tool_arc_welder: { name: 'Arc Welder', type: 'tool', toolKind: 'welder', weight: 1.8, value: 260, rarity: 'rare', maxDur: 75, wearPerUse: 10, dmg: 55, element: 'shock', range: 12, desc: 'Zaps targets with Shock arcs or repairs equipped armor (+20 dur).' },
        tool_thermal_cutter: { name: 'Thermal Cutter', type: 'tool', toolKind: 'cutter', weight: 2.2, value: 310, rarity: 'rare', maxDur: 70, wearPerUse: 8, dmg: 80, element: 'burn', range: 7, desc: 'Superheated plasma torch slicing armor (+30 Pen) and applying Burn.' },
        tool_riot_plate: { name: 'Riot Plate Carrier', type: 'tool', toolKind: 'riot', weight: 3.5, value: 290, rarity: 'common', maxDur: 90, wearPerUse: 20, shieldHp: 45, durSec: 12, desc: 'Strap-on tactical plate granting +45 temporary barrier HP.' },
        tool_field_repair: { name: 'Field Repair Kit', type: 'tool', toolKind: 'repair_half', weight: 0.8, value: 95, rarity: 'common', maxDur: 30, wearPerUse: 15, desc: 'Restores 50% durability to all equipped weapons and armor (2 uses).' },
        tool_nano_patch: { name: 'Master Nano-Patch', type: 'tool', toolKind: 'repair_full', weight: 0.4, value: 220, rarity: 'epic', maxDur: 30, wearPerUse: 10, desc: 'Restores 100% durability to all equipped gear (3 uses).' },
        tool_overcharge_cell: { name: 'Overcharge Cell', type: 'tool', toolKind: 'overcharge', weight: 0.6, value: 180, rarity: 'rare', maxDur: 40, wearPerUse: 20, desc: 'Instantly resets Primer/Detonator cooldowns & grants +25% Ult charge (2 uses).' },
        tool_emergency_beacon: { name: 'Emergency Beacon', type: 'tool', toolKind: 'beacon', weight: 0.9, value: 240, rarity: 'rare', maxDur: 40, wearPerUse: 20, desc: 'Deploys a healing flare (+40 HP) and stuns hostiles within 8m (2 uses).' }
    };

    /* --------------------------------------------------------- Quest / Crafting / Mount Items */
    const NEW_MISC_ITEMS = {
        quarry_core_sample: { name: 'Quarry Core Sample', type: 'quest', weight: 0.5, value: 0, desc: 'Radioactive core drilled from Excavator Pit.' },
        mire_toxin_sample: { name: 'Mire Toxin Sample', type: 'quest', weight: 0.4, value: 0, desc: 'Concentrated bio-venom from Mire Delta.' },
        helix_cipher: { name: 'Helix Harmonic Cipher', type: 'quest', weight: 0.1, value: 0, desc: 'Encoded carrier-wave decryption slate.' },
        aegis_blackbox: { name: 'Aegis Flight Blackbox', type: 'quest', weight: 0.8, value: 0, desc: 'Encrypted telemetry from Bunker Delta.' },
        vasko_crest: { name: "Vasko's Scrap Crest", type: 'quest', weight: 0.3, value: 0, desc: 'Proof of Gutter King Vasko defeat.' },
        sovereign_core: { name: 'Sovereign Void Core', type: 'quest', weight: 0.6, value: 0, desc: 'Pulsing core recovered from the Meridian Sovereign.' },
        barrow_seal: { name: 'Seal of Grimhollow', type: 'quest', weight: 0.2, value: 0, desc: 'Ancient signet recovered from the Sunken Crypt of Marrow.' },
        sunfang_idol: { name: 'Golden Sunfang Idol', type: 'quest', weight: 0.5, value: 0, desc: 'Relic recovered from Pharaoh Kharim in the Sunfang Tomb.' },
        frostspire_crown: { name: 'Crown of Valdris', type: 'quest', weight: 0.6, value: 0, desc: 'Rime-forged crown of the Frost-King.' },
        vaelgor_fang: { name: 'Fang of Vaelgor', type: 'quest', weight: 0.8, value: 0, desc: 'Smoldering dragon fang torn from the Obsidian Dragonwild Vault.' },
        schematic_scout_bike: { name: 'Key: Scrap Scout Bike', type: 'quest', weight: 0, value: 0, desc: 'Unlocks the Scrap Scout Bike in your Mount Garage [T].' },
        schematic_hoverbike: { name: 'Key: Nomad Hoverbike', type: 'quest', weight: 0, value: 0, desc: 'Unlocks the Nomad Hoverbike in your Mount Garage [T].' },
        schematic_aegis_atv: { name: 'Key: Meridian Armored ATV', type: 'quest', weight: 0, value: 0, desc: 'Unlocks the Meridian Armored ATV in your Mount Garage [T].' },
        schematic_war_strider: { name: 'Key: Aegis War Strider', type: 'quest', weight: 0, value: 0, desc: 'Unlocks the Aegis War Strider in your Mount Garage [T].' }
    };

    /* --------------------------------------------------------- 12+ Unlockable Powers (incl. Ultimate) */
    const EXPANSION_ABILITIES = {
        primer: {
            venom_spit_dart: { name: 'Venom Dart', status: 'venom', cd: 8, dmg: 20, range: 45, desc: 'Fires a toxic dart applying 2 stacks of Venom.' },
            void_tether: { name: 'Void Tether', status: 'void', cd: 11, dmg: 22, range: 35, radius: 4.5, desc: 'Void orb that pulls targets slightly and applies Void.' },
            solar_flare: { name: 'Solar Flare', status: 'burn', cd: 11, dmg: 24, range: 32, radius: 5.0, desc: 'Wide plasma burst igniting all nearby enemies.' }
        },
        detonator: {
            seismic_slam: { name: 'Seismic Slam', cd: 13, dmg: 45, range: 0, radius: 8.5, desc: 'Slams the ground to detonate all enemies within 8.5m.' },
            void_implosion: { name: 'Void Implosion', cd: 14, dmg: 52, range: 35, radius: 6.5, desc: 'Remote singularity blast detonating statuses in 6.5m.' },
            venom_rupture: { name: 'Blight Catalyst', cd: 11, dmg: 48, range: 32, radius: 4.0, desc: 'Catalyzes statuses into toxic bursts with bonus damage.' }
        },
        gadget: {
            kinetic_barrier: { name: 'Kinetic Barrier', cd: 28, shield: 55, dur: 10, desc: 'Grants +55 temporary shield & +20% DR for 10s.' },
            nanite_field: { name: 'Nanite Field', cd: 30, heal: 65, desc: 'Regenerates 65 HP over 3s and boosts stamina.' },
            emp_pulse: { name: 'EMP Surge', cd: 24, dmg: 35, radius: 9, desc: 'Stuns nearby enemies for 2.2s and applies Shock.' }
        },
        ultimate: {
            orbital_barrage: { name: 'Orbital Barrage', cd: 55, dmg: 140, range: 45, radius: 8, element: 'burn', desc: 'Calls down twin thermite-arc strikes on target area.' },
            singularity_nova: { name: 'Singularity Nova', cd: 65, dmg: 165, range: 40, radius: 9, element: 'void', desc: 'Tears open a Void rift pulling foes inward and detonating all statuses.' },
            overdrive_protocol: { name: 'Overdrive Protocol', cd: 50, dur: 10, desc: '10s combat surge: +35% speed, +30% crit, lifesteal & instant reload.' },
            plague_tempest: { name: 'Plague Tempest', cd: 60, dmg: 130, range: 35, radius: 9, element: 'venom', desc: 'Unleashes a Venom + Chill storm that shreds armor and freezes.' }
        }
    };

    const POWER_UNLOCKS = {
        cryo_dart: { label: 'Starter', check: () => true },
        thermite: { label: 'Syndicate Trusted or TCH 7', check: (s) => BO.OWRPGFactions.rep(s, 'syndicate') >= 250 || BO.OWRPGCharacter.attr(s, 'TCH') >= 7 },
        arc_mine: { label: 'Aegis Trusted or TCH 8', check: (s) => BO.OWRPGFactions.rep(s, 'aegis') >= 250 || BO.OWRPGCharacter.attr(s, 'TCH') >= 8 },
        breach_bash: { label: 'BRW 7 or Militia Trusted', check: (s) => BO.OWRPGCharacter.attr(s, 'BRW') >= 7 || BO.OWRPGFactions.rep(s, 'militia') >= 250 },
        venom_spit_dart: { label: 'Quest: Brood Fever or Level 4', check: (s) => s.player.level >= 4 || s.quests.q_shale_nest?.state === 'completed' },
        void_tether: { label: 'Helix Trusted or Meridian Pylon', check: (s) => BO.OWRPGFactions.rep(s, 'helix') >= 250 || s.quests.q_helix_cipher?.state === 'completed' || s.player.level >= 10 },
        solar_flare: { label: 'Level 8 or 3 Pylons Online', check: (s) => s.player.level >= 8 || Object.values(s.pylons || {}).filter(Boolean).length >= 3 },
        arc_lash: { label: 'Starter', check: () => true },
        concussion: { label: 'Level 6', check: (s) => s.player.level >= 6 },
        seismic_slam: { label: 'BRW 6 or Gutter King Bounty', check: (s) => BO.OWRPGCharacter.attr(s, 'BRW') >= 6 || s.worldFlags.killed_raider_boss },
        void_implosion: { label: 'Level 9 or TCH 7', check: (s) => s.player.level >= 9 || BO.OWRPGCharacter.attr(s, 'TCH') >= 7 },
        venom_rupture: { label: 'Kill Mire Hydra or Level 7', check: (s) => s.player.level >= 7 || s.worldFlags.killed_boss_mire_hydra },
        med_injector: { label: 'Starter', check: () => true },
        decoy_holo: { label: 'Level 4 or any Ghost perk', check: (s) => s.player.level >= 4 || s.player.perks.some((p) => p.startsWith('ghost')) },
        kinetic_barrier: { label: 'Level 5 or Aegis Pylon', check: (s) => s.player.level >= 5 || !!s.pylons.py_check },
        nanite_field: { label: 'Militia Trusted or Level 7', check: (s) => s.player.level >= 7 || BO.OWRPGFactions.rep(s, 'militia') >= 250 },
        emp_pulse: { label: 'TCH 6 or Relay Lit', check: (s) => BO.OWRPGCharacter.attr(s, 'TCH') >= 6 || !!s.worldFlags.relay_lit },
        orbital_barrage: { label: 'Level 3 or Blackbox Quest', check: (s) => s.player.level >= 3 || s.quests.q_alpine_blackbox?.state === 'completed' },
        singularity_nova: { label: 'Slay Sovereign or Level 16', check: (s) => s.player.level >= 16 || !!s.worldFlags.killed_boss_meridian_sovereign },
        overdrive_protocol: { label: 'Level 5 or Slay Vasko', check: (s) => s.player.level >= 5 || !!s.worldFlags.killed_raider_boss },
        plague_tempest: { label: 'Slay Mire Hydra or Level 11', check: (s) => s.player.level >= 11 || !!s.worldFlags.killed_boss_mire_hydra }
    };

    /* --------------------------------------------------------- 4 Summonable Mounts */
    const MOUNTS = {
        scout_bike: {
            id: 'scout_bike', name: 'Scrap Scout Bike', speed: 15.5, boostSpeed: 22.0,
            dr: 0.1, jump: 7.5, color: 0xf59e0b, accent: 0x334155, hover: false,
            unlockLabel: 'Quest: Wheels for the Road (Freestead) or Buy from Torin',
            desc: 'Nimble frontier dirtbike built from Freestead salvage. Fast acceleration across the 1280m Expanse.'
        },
        hoverbike: {
            id: 'hoverbike', name: 'Nomad Hoverbike', speed: 18.5, boostSpeed: 26.0,
            dr: 0.15, jump: 9.0, color: 0x38bdf8, accent: 0x1e293b, hover: true,
            unlockLabel: 'Quest: Rail Yard Smugglers or Level 8',
            desc: 'Mag-lev thruster bike that glides smoothly over Mire marshes, Sunken Coast shoals, and desert dunes.'
        },
        aegis_atv: {
            id: 'aegis_atv', name: 'Meridian Armored ATV', speed: 17.0, boostSpeed: 23.5,
            dr: 0.28, jump: 8.0, color: 0x64748b, accent: 0x0ea5e9, hover: false,
            unlockLabel: 'Quest: Iron on the Ridge (Alpine Array) or Aegis Trusted',
            desc: 'Heavy 4x4 tactical quad with plated rollcage granting +28% mounted damage reduction.'
        },
        war_strider: {
            id: 'war_strider', name: 'Aegis War Strider', speed: 15.0, boostSpeed: 21.0,
            dr: 0.42, jump: 10.5, color: 0xc084fc, accent: 0x1e1b4b, hover: false, strider: true,
            unlockLabel: 'Quest: Crown of the Crater (Meridian Core) or Level 22',
            desc: 'Articulated bipedal exo-walker with +42% mounted armor and seismic stomp landings.'
        }
    };

    /* --------------------------------------------------------- 16 Repeatable Witcher-Style Monster & Faction Bounties */
    const BOUNTIES = [
        { id: 'b_puglins', title: 'Cull Basin Puglins', target: 'puglin_scamp', count: 6, region: 'haven_basin', xp: 140, credits: 110, rep: { militia: 45 }, desc: 'Eliminate 6 Puglin Scavengers raiding Haven farms.' },
        { id: 'b_raiders', title: 'Clear Basin Raiders', target: 'raider', count: 6, region: 'haven_basin', xp: 165, credits: 140, rep: { militia: 60 }, desc: 'Eliminate 6 Basin Raiders menacing Haven roads.' },
        { id: 'b_wolves', title: 'Whispering Wolf Contract', target: 'timber_wolf', count: 6, region: 'whispering_woods', xp: 210, credits: 175, rep: { militia: 70 }, desc: 'Hunt 6 Dire Timber Wolves in Whispering Pinewoods.' },
        { id: 'b_orcs', title: 'Root-Barrow Orc Hunt', target: 'orc_reaver', count: 5, region: 'whispering_woods', xp: 260, credits: 210, rep: { militia: 85 }, desc: 'Slay 5 Root-Barrow Orcs in the western woods.' },
        { id: 'b_enforcers', title: 'Raid Syndicate Enforcers', target: 'enforcer', count: 5, region: 'rust_sprawl', xp: 240, credits: 210, rep: { militia: 80 }, desc: 'Take out 5 Syndicate Enforcers in Rust Sprawl.' },
        { id: 'b_skeletons', title: 'Purge Barrow Skeletons', target: 'skeleton_warrior', count: 6, region: 'barrow_moor', xp: 340, credits: 260, rep: { militia: 90 }, desc: 'Shatter 6 Barrow Skeletons across Barrow-Moor Graveyard.' },
        { id: 'b_vampires', title: 'Witcher Contract: Nightlords', target: 'blood_vampire', count: 4, region: 'barrow_moor', xp: 480, credits: 360, rep: { aegis: 100 }, desc: 'Slay 4 Crimson Nightlords stalking Grimhollow.' },
        { id: 'b_mire', title: 'Mire Blight Sweep', target: 'brood_blight_hound', count: 5, region: 'mire_delta', xp: 310, credits: 250, rep: { aegis: 75 }, desc: 'Hunt 5 Blight Hounds across Mire Delta.' },
        { id: 'b_quarry', title: 'Quarry Ash Purging', target: 'brood_pyro_fiend', count: 4, region: 'ash_quarry', xp: 360, credits: 290, rep: { militia: 90 }, desc: 'Slay 4 Quarry Ash Fiends in Ash Quarry.' },
        { id: 'b_outlaws', title: 'Badlands Outlaw Warrant', target: 'badlands_outlaw', count: 6, region: 'sunscorched_badlands', xp: 520, credits: 420, rep: { syndicate: 110 }, desc: 'Eliminate 6 Redrock Desperados in Sunscorched Badlands.' },
        { id: 'b_scorpions', title: 'Witcher Contract: Stingers', target: 'dune_scorpion', count: 5, region: 'sunscorched_badlands', xp: 560, credits: 440, rep: { militia: 100 }, desc: 'Exterminate 5 Sunscorched Stingers in Scorpion Canyon.' },
        { id: 'b_drowned', title: 'Sunken Coast Salvage', target: 'drowned_corsair', count: 5, region: 'sunken_coast', xp: 680, credits: 520, rep: { aegis: 120 }, desc: 'Put down 5 Drowned Corsairs along Sunken Ruin Coast.' },
        { id: 'b_alpine', title: 'Rogue Aegis Patrol', target: 'aegis', count: 5, region: 'alpine_array', xp: 450, credits: 350, rep: { helix: 90 }, desc: 'Neutralize 5 Aegis Troopers in Alpine Array.' },
        { id: 'b_trolls', title: 'Witcher Contract: Ice-Trolls', target: 'glacier_troll', count: 4, region: 'frostfang_peaks', xp: 920, credits: 680, rep: { aegis: 150 }, desc: 'Slay 4 Frostfang Ice-Trolls in Frostfang Peaks.' },
        { id: 'b_helix', title: 'Crater Void Purge', target: 'helix_voidweaver', count: 4, region: 'meridian_core', xp: 640, credits: 480, rep: { aegis: 120 }, desc: 'Defeat 4 Helix Voidweavers near Meridian Core.' },
        { id: 'b_drakes', title: 'Dragonwild Drake Hunt', target: 'ashen_drake', count: 4, region: 'obsidian_dragonwilds', xp: 1450, credits: 980, rep: { militia: 180, aegis: 180 }, desc: 'Slay 4 Obsidian Ash-Drakes in the Dragonwilds.' }
    ];

    const CODEX_MILESTONES = [
        { id: 'cx_kills_25', title: 'Basin Hunter', desc: 'Defeat 25 enemies in the Meridian Expanse.', check: (s) => s.stats.kills >= 25, reward: { credits: 250, items: ['w_m4a1_warden'] } },
        { id: 'cx_kills_100', title: 'Expanse Legend', desc: 'Defeat 100 enemies.', check: (s) => s.stats.kills >= 100, reward: { credits: 650, items: ['w_gold_deagle_king'] } },
        { id: 'cx_kills_300', title: 'Grandmaster Grinder', desc: 'Defeat 300 enemies across the frontier.', check: (s) => s.stats.kills >= 300, reward: { credits: 1600, items: ['helm_dragonwild', 'elixir_wisdom'] } },
        { id: 'cx_react_20', title: 'Elemental Chemist', desc: 'Trigger 20 Elemental Reactions.', check: (s) => s.stats.reactions >= 20, reward: { credits: 300, items: ['w_p90_arc', 'tool_overcharge_cell'] } },
        { id: 'cx_disc_10', title: 'Basin Scout', desc: 'Discover 10 Points of Interest.', check: (s) => s.stats.discovered >= 10, reward: { credits: 350, items: ['boots_ghost'] } },
        { id: 'cx_disc_30', title: 'Master Cartographer', desc: 'Discover 30 Points of Interest across the 1280m world.', check: (s) => s.stats.discovered >= 30, reward: { credits: 1200, items: ['w_intervention_apex', 'boots_dragonwild'] } },
        { id: 'cx_boss_3', title: 'Apex Slayer', desc: 'Defeat 3 distinct World or Dungeon Bosses.', check: (s) => Object.keys(s.worldFlags || {}).filter((k) => k.startsWith('killed_') && BO.OWRPGStatsData.ENEMIES[k.slice(7)]?.boss).length >= 3, reward: { credits: 850, items: ['w_barrett_anti', 'relic_crater_shard'] } },
        { id: 'cx_boss_8', title: 'Dungeon Conqueror', desc: 'Defeat 8 distinct World or Dungeon Bosses.', check: (s) => Object.keys(s.worldFlags || {}).filter((k) => k.startsWith('killed_') && BO.OWRPGStatsData.ENEMIES[k.slice(7)]?.boss).length >= 8, reward: { credits: 2200, items: ['rig_dragonwild', 'relic_dragon_heart'] } },
        { id: 'cx_pylons_6', title: 'Grid Restorer', desc: 'Bring 6 Transit Pylons online.', check: (s) => Object.values(s.pylons || {}).filter(Boolean).length >= 6, reward: { credits: 500, items: ['w_tesla_coil'] } },
        { id: 'cx_pylons_12', title: 'Continental Network', desc: 'Bring all 12 Transit Pylons online.', check: (s) => Object.values(s.pylons || {}).filter(Boolean).length >= 12, reward: { credits: 1800, items: ['w_fire_staff'] } }
    ];

    // Merge Expansion items, abilities, and loot tables into BO.OWRPGStatsData cleanly
    const SD = BO.OWRPGStatsData;
    if (SD) {
        Object.assign(SD.ITEMS, NEW_GUNS, NEW_ARMOR, NEW_TOOLS, NEW_MISC_ITEMS);
        for (const slot of ['primer', 'detonator', 'gadget', 'ultimate']) {
            SD.ABILITIES[slot] = Object.assign(SD.ABILITIES[slot] || {}, EXPANSION_ABILITIES[slot] || {});
        }
        SD.LOOT.raider.push(['helm_scav', 4, 1, 1], ['boots_scav', 4, 1, 1], ['tool_field_repair', 5, 1, 1]);
        SD.LOOT.syndicate.push(['w_ak47_rust', 3, 1, 1], ['w_ump45_enforcer', 4, 1, 1], ['helm_juggernaut', 2, 1, 1], ['tool_thermal_cutter', 3, 1, 1]);
        SD.LOOT.militia.push(['helm_warden', 3, 1, 1], ['boots_warden', 3, 1, 1], ['w_m4a1_warden', 3, 1, 1]);
        SD.LOOT.aegis.push(['helm_arctech', 2, 1, 1], ['boots_arctech', 2, 1, 1], ['w_acr_specops', 2, 1, 1], ['tool_kinetic_shield', 2, 1, 1]);
        SD.LOOT.helix.push(['w_f2000_helix', 2, 1, 1], ['rig_arctech', 1, 1, 1], ['tool_nano_patch', 3, 1, 1]);
        SD.LOOT.brood.push(['tool_field_repair', 4, 1, 1], ['relic_brood_heart', 1, 1, 1]);
        SD.LOOT.undead.push(['helm_lichplate', 2, 1, 1], ['boots_lichplate', 2, 1, 1], ['rig_lichplate', 1, 1, 1], ['relic_lich_phylactery', 1, 1, 1]);
        SD.LOOT.dragon.push(['helm_dragonwild', 2, 1, 1], ['boots_dragonwild', 2, 1, 1], ['rig_dragonwild', 1, 1, 1], ['w_fire_staff', 1, 1, 1]);
        SD.LOOT.boss.push(['tool_nano_patch', 65, 1, 1], ['rig_juggernaut', 20, 1, 1], ['helm_arctech', 20, 1, 1], ['w_mg42_scrap', 18, 1, 1], ['rig_lichplate', 16, 1, 1], ['helm_dragonwild', 10, 1, 1]);
        SD.LOOT.cache.push(['tool_field_repair', 12, 1, 1], ['tool_riot_plate', 8, 1, 1], ['boots_scav', 6, 1, 1], ['helm_scav', 6, 1, 1]);
        SD.LOOT.locked.push(['tool_nano_patch', 18, 1, 1], ['w_deagle_judge', 8, 1, 1], ['rig_warden', 8, 1, 1], ['boots_ghost', 6, 1, 1], ['helm_lichplate', 5, 1, 1]);
    }

    BO.OWRPGGunStats = OWRPGGunStats;
    BO.OWRPGExpansionData = {
        PASSIVE_TRAITS, ARMOR_SETS, NEW_GUNS, NEW_ARMOR, NEW_TOOLS, NEW_MISC_ITEMS,
        EXPANSION_ABILITIES, POWER_UNLOCKS, MOUNTS, BOUNTIES, CODEX_MILESTONES,
        getGunStats
    };
})(window.BO);
;

/* --- src/data/OWRPGFactionsData.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Factions & Frontier Vendors Data (2.0)
   Four major factions with staged Faction Crest emblems, negative spillover,
   reputation tiers, and 9 vendors across the 1280 x 1280 m Meridian Expanse.
============================================================================ */
(function (BO) {
    'use strict';

    const FACTIONS = {
        militia: {
            name: 'Freestead Militia', short: 'Militia', color: '#f5a623', rival: 'syndicate',
            crest: 'staged_assets/ui/faction_crests/dieselpunk-piston-wing-guard.png',
            blurb: 'Frontier rangers, woodwardens, and settlers defending clean water and the Basin towns.'
        },
        syndicate: {
            name: 'Ironclad Syndicate', short: 'Syndicate', color: '#ef4444', rival: 'militia',
            crest: 'staged_assets/ui/faction_crests/dieselpunk-gear-laurel-syndicate.png',
            blurb: 'Industrial salvagers, rail barons, badlands caravan bosses, and black-market mercenaries.'
        },
        aegis: {
            name: 'Aegis Directorate', short: 'Aegis', color: '#38bdf8', rival: 'helix',
            crest: 'staged_assets/ui/faction_crests/sci-fi-comet-sentinel-ring.png',
            blurb: 'Pre-collapse military scientists and Frostspire garrison enforcing the Meridian quarantine.'
        },
        helix: {
            name: 'Children of the Helix', short: 'Helix', color: '#c084fc', rival: 'aegis',
            crest: 'staged_assets/ui/faction_crests/astral-lens-order.png',
            blurb: 'Transhumanist runecrafters and crater mystics harnessing Meridian & Dragonwild energies.'
        }
    };
    const HOSTILE_GROUPS = ['raiders', 'brood'];

    const REP_MIN = -1000, REP_MAX = 1500;
    const SPILLOVER = 0.5;
    const TIERS = [
        { id: 'hated', name: 'Hated', min: -1000, color: '#dc2626' },
        { id: 'shunned', name: 'Shunned', min: -499, color: '#f97316' },
        { id: 'neutral', name: 'Neutral', min: -149, color: '#cbd5e1' },
        { id: 'trusted', name: 'Trusted', min: 250, color: '#4ade80' },
        { id: 'sworn', name: 'Sworn', min: 750, color: '#fbbf24' }
    ];
    const TIER_DISCOUNT = { hated: null, shunned: null, neutral: 0, trusted: 0.12, sworn: 0.2 };

    const START_REP = { militia: 0, syndicate: 0, aegis: 0, helix: 0 };

    const VENDORS = {
        freestead_store: {
            name: "Dottie's Supply", faction: 'militia',
            stock: ['medkit', 'elixir_swallow', 'ammo_box', 'stim', 'relay_cell', 'tool_field_repair', 'w_carbine', 'w_rifle', 'w_ump45_enforcer', 'w_m40a3_ranger', 'rig_light', 'helm_scav', 'boots_scav', 'helm_warden', 'boots_warden']
        },
        torin_bench: {
            name: "Torin's Forge & Garage", faction: 'militia',
            stock: ['tool_field_repair', 'tool_nano_patch', 'tool_scrap_flamer', 'tool_arc_welder', 'tool_riot_plate', 'tool_emergency_beacon', 'rig_warden', 'rig_plated', 'w_m4a1_warden', 'w_stg44_relic', 'schematic_scout_bike']
        },
        syndicate_fence: {
            name: 'Rail Yard Fence', faction: 'syndicate',
            stock: ['ammo_box', 'stim', 'elixir_thunderbolt', 'medkit', 'tool_field_repair', 'tool_thermal_cutter', 'tool_breach_hammer', 'w_shotgun', 'w_lmg', 'w_smg', 'w_ak47_rust', 'w_deagle_judge', 'w_p90_arc', 'rig_plated', 'helm_juggernaut', 'boots_juggernaut', 'rig_juggernaut', 'relay_cell']
        },
        aegis_quarter: {
            name: 'Aegis Quartermaster', faction: 'aegis',
            stock: ['medkit', 'elixir_swallow', 'relay_cell', 'tool_nano_patch', 'tool_kinetic_shield', 'tool_overcharge_cell', 'w_dmr', 'w_acr_specops', 'w_m249_bastion', 'w_scar_aegis', 'w_intervention_apex', 'rig_aegis', 'helm_arctech', 'boots_arctech'],
            minTier: 'neutral'
        },
        helix_exchange: {
            name: 'Helix Exchange', faction: 'helix',
            stock: ['stim', 'elixir_thunderbolt', 'elixir_wisdom', 'medkit', 'tool_nano_patch', 'tool_overcharge_cell', 'w_vector', 'w_f2000_helix', 'w_mp7_ghost', 'w_void_staff', 'rig_arctech', 'relic_arctech', 'helm_ghost', 'boots_ghost', 'relay_cell'],
            minTier: 'neutral'
        },
        lyra_field: {
            name: "Dr. Lyra's Field Kit", faction: 'aegis',
            stock: ['medkit', 'elixir_swallow', 'stim', 'tool_nano_patch', 'tool_overcharge_cell', 'w_an94_cryo', 'w_python_frontier', 'rig_ghost', 'relic_ghost'],
            minTier: 'neutral'
        },
        halvar_lodge: {
            name: "Whispering Ranger Armorer", faction: 'militia',
            stock: ['medkit', 'elixir_swallow', 'elixir_wisdom', 'ammo_box', 'relay_cell', 'w_galil_veteran', 'w_m40a3_ranger', 'helm_warden', 'rig_warden', 'boots_warden', 'relic_warden']
        },
        orlok_apothecary: {
            name: "Grimhollow Crypt Reliquary", faction: 'helix',
            stock: ['elixir_swallow', 'elixir_thunderbolt', 'elixir_wisdom', 'relay_cell', 'helm_lichplate', 'rig_lichplate', 'boots_lichplate', 'relic_lich_phylactery', 'w_mp7_ghost']
        },
        zahra_bazaar: {
            name: "Dustwind Caravan Bazaar", faction: 'syndicate',
            stock: ['ammo_box', 'elixir_thunderbolt', 'elixir_wisdom', 'relay_cell', 'tool_nano_patch', 'w_model1887_twin', 'w_ksg_breach', 'w_rpg7_demolisher', 'w_gold_deagle_king', 'helm_dragonwild', 'boots_dragonwild']
        }
    };

    BO.OWRPGFactionsData = { FACTIONS, HOSTILE_GROUPS, REP_MIN, REP_MAX, SPILLOVER, TIERS, TIER_DISCOUNT, START_REP, VENDORS };
})(window.BO);
;

/* --- src/data/OWRPGWorldData.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · The Meridian Expanse 2.0 (1280 x 1280 m)
   - Twice the linear span (4x surface area: [-640, 640] x [-640, 640])
   - 12 Distinct Biomes & Frontier Territories (Levels 1–50)
   - 12 Skyline Landmarks, 12 Transit Pylons, 5 Frontier Settlements/Outposts
   - 12 Multi-Room Sealed Underground Dungeons (at x >= 1600, z >= 1600)
   - 8 Skyrim-style Standing Stones, 32 Harvestable Resource Nodes & Lore Tomes
============================================================================ */
(function (BO) {
    'use strict';

    const W = BO.WorldCore;
    const N = W.noise;
    const BOUNDS = { minX: -640, maxX: 640, minZ: -640, maxZ: 640 };
    const WATER = -0.6;

    const REGIONS = [
        { id: 'haven_basin',          name: 'Haven Basin',          x: -190, z: 190,  r: 145, lvl: '1–5',   faction: 'militia',   col: [0.42, 0.52, 0.30] },
        { id: 'whispering_woods',     name: 'Whispering Pinewoods', x: -450, z: 390,  r: 175, lvl: '3–9',   faction: 'militia',   col: [0.24, 0.42, 0.25] },
        { id: 'rust_sprawl',          name: 'Rust Sprawl',          x: 60,   z: 210,  r: 145, lvl: '6–12',  faction: 'syndicate', col: [0.46, 0.41, 0.35] },
        { id: 'barrow_moor',          name: 'Barrow-Moor Graveyard',x: -460, z: -20,  r: 175, lvl: '10–17', faction: null,        col: [0.29, 0.28, 0.34] },
        { id: 'mire_delta',           name: 'Mire Delta',           x: 225,  z: 30,   r: 145, lvl: '11–18', faction: null,        col: [0.26, 0.37, 0.26] },
        { id: 'ash_quarry',           name: 'Ash Quarry',           x: -180, z: -60,  r: 135, lvl: '13–20', faction: 'contested', col: [0.49, 0.44, 0.40] },
        { id: 'sunscorched_badlands', name: 'Sunscorched Badlands', x: 420,  z: 420,  r: 185, lvl: '17–26', faction: 'syndicate', col: [0.64, 0.48, 0.29] },
        { id: 'sunken_coast',         name: 'Sunken Ruin Coast',    x: 490,  z: -60,  r: 175, lvl: '22–30', faction: null,        col: [0.34, 0.46, 0.44] },
        { id: 'alpine_array',         name: 'Alpine Array',         x: -60,  z: -230, r: 145, lvl: '24–33', faction: 'aegis',     col: [0.60, 0.65, 0.67] },
        { id: 'frostfang_peaks',      name: 'Frostfang Peaks',      x: -440, z: -430, r: 190, lvl: '30–40', faction: 'aegis',     col: [0.76, 0.82, 0.88] },
        { id: 'meridian_core',        name: 'Meridian Core',        x: 180,  z: -190, r: 135, lvl: '34–44', faction: 'helix',     col: [0.34, 0.27, 0.40] },
        { id: 'obsidian_dragonwilds', name: 'Obsidian Dragonwilds', x: 450,  z: -450, r: 190, lvl: '40–50', faction: 'helix',     col: [0.22, 0.17, 0.21] }
    ];

    const CORE = { x: 180, z: -190 };
    const QUARRY = { x: -180, z: -60 };
    const DRAGON_CRATER = { x: 470, z: -470 };

    const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const lerp = (a, b, t) => a + (b - a) * t;

    function regionAt(x, z) {
        let best = REGIONS[0], bd = Infinity;
        for (const r of REGIONS) {
            const d = Math.hypot(x - r.x, z - r.z) / r.r;
            if (d < bd) { bd = d; best = r; }
        }
        return best;
    }

    const ROADS = [
        // Central Basin & Sprawl arteries
        { w: 7, mat: 'asphalt', pts: [[-560, 410], [-420, 360], [-300, 200], [-230, 196], [-190, 214], [-140, 200], [-60, 196], [40, 214], [140, 210], [280, 310], [390, 400]] },
        { w: 6, mat: 'asphalt', pts: [[-190, 166], [-170, 110], [-160, 40], [-150, -40], [-120, -110], [-70, -140], [-60, -230], [-220, -320], [-420, -410]] },
        // Outer Frontier Highways & Ancient Trails
        { w: 5, mat: 'dirt', pts: [[-70, -140], [20, -130], [110, -120], [150, -140], [310, -280], [430, -420]] },
        { w: 5, mat: 'dirt', pts: [[140, 210], [210, 110], [210, 40], [170, -40], [150, -120]] },
        { w: 5, mat: 'dirt', pts: [[210, 40], [350, 10], [470, -50], [450, -260], [430, -420]] },
        { w: 5, mat: 'dirt', pts: [[-230, 196], [-330, 100], [-430, 10], [-460, -60], [-440, -260], [-420, -410]] },
        { w: 4, mat: 'dirt', pts: [[-190, 214], [-200, 262], [-260, 272], [-420, 360]] },
        { w: 4, mat: 'dirt', pts: [[390, 400], [465, 455], [530, 320], [470, -50]] }
    ];
    function segDist(px, pz, ax, az, bx, bz) {
        const dx = bx - ax, dz = bz - az;
        const L = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L));
        return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
    }
    function roadInfo(x, z) {
        let best = null;
        for (const road of ROADS) {
            for (let i = 0; i < road.pts.length - 1; i++) {
                const d = segDist(x, z, road.pts[i][0], road.pts[i][1], road.pts[i + 1][0], road.pts[i + 1][1]);
                if (d < road.w * 0.5 + 3 && (!best || d < best.d)) best = { d, road };
            }
        }
        return best;
    }
    const RAIL = [[-320, 245], [-40, 236], [40, 232], [120, 228], [260, 260], [410, 360]];
    function railDist(x, z) {
        let b = Infinity;
        for (let i = 0; i < RAIL.length - 1; i++) b = Math.min(b, segDist(x, z, RAIL[i][0], RAIL[i][1], RAIL[i + 1][0], RAIL[i + 1][1]));
        return b;
    }

    function rawHeight(x, z) {
        let h = N.fbm(x / 140, z / 140, 7, 4) * 6.2 + N.fbm(x / 32, z / 32, 19, 3) * 1.2 + 2.4;
        // Haven Basin terraces
        const hv = smooth(150, 65, Math.hypot(x + 190, z - 190));
        if (hv > 0) { const t = Math.max(1.4, 4.5 + N.fbm(x / 60, z / 60, 3, 3) * 5); h = lerp(h, Math.floor(t / 2.4) * 2.4 + (t % 2.4) * 0.35, hv * 0.85); }
        // Whispering Pinewoods rolling hills
        const ww = smooth(210, 80, Math.hypot(x + 450, z - 390));
        if (ww > 0) h += ww * (4.5 + N.fbm(x / 55, z / 55, 29, 3) * 6.5);
        // Rust Sprawl rail grade
        const rs = smooth(150, 70, Math.hypot(x - 60, z - 210));
        h = lerp(h, 2.2 + N.fbm(x / 40, z / 40, 9, 2) * 0.8, rs * 0.8);
        h -= 2.4 * smooth(6, 2, railDist(x, z)) * rs;
        // Barrow-Moor misty barrow hills
        const bm = smooth(195, 75, Math.hypot(x + 460, z + 20));
        if (bm > 0) h = lerp(h, 3.2 + N.ridged(x / 48, z / 48, 37, 3) * 5.2, bm * 0.75);
        // Mire Delta wetlands
        const md = smooth(140, 60, Math.hypot(x - 215, z - 25));
        h = lerp(h, -0.7 + N.fbm(x / 26, z / 26, 41, 3) * 2.2, md);
        // Sunken Coast shoals & cliffs
        const sc = smooth(185, 70, Math.hypot(x - 490, z + 60));
        if (sc > 0) h = lerp(h, 1.8 + N.fbm(x / 38, z / 38, 61, 3) * 4.5, sc * 0.8);
        // Sunscorched Badlands mesas
        const sb = smooth(210, 85, Math.hypot(x - 420, z - 420));
        if (sb > 0) {
            const mesa = 5.5 + N.ridged(x / 65, z / 65, 73, 3) * 14;
            h = lerp(h, Math.floor(mesa / 3.5) * 3.5 + (mesa % 3.5) * 0.28, sb * 0.85);
        }
        // Ash Quarry stepped pit
        const dq = Math.hypot(x - QUARRY.x, z - QUARRY.z);
        if (dq < 90) {
            const depth = dq < 62 ? -15 * (1 - (dq / 62) ** 2) : 0;
            const stepped = Math.round(depth / 3) * 3 + (depth % 3) * 0.25;
            const rim = 5 * Math.exp(-((dq - 68) ** 2) / 60);
            h = lerp(h, 2.2 + stepped + rim, smooth(90, 60, dq));
        }
        // Alpine Array & Frostfang Peaks mountains
        const north = smooth(-130, -320, z) * smooth(580, 140, Math.abs(x + 220));
        h += north * (N.ridged(x / 85, z / 85, 5, 4) * 28 + 18);
        const ff = smooth(220, 80, Math.hypot(x + 440, z + 430));
        if (ff > 0) h += ff * (14 + N.ridged(x / 72, z / 72, 83, 4) * 20);
        // Meridian Core blast crater
        const dc = Math.hypot(x - CORE.x, z - CORE.z);
        if (dc < 95) {
            const bowl = dc < 44 ? -11 * (1 - (dc / 44) ** 2) : 0;
            const rim = 16 * Math.exp(-((dc - 54) ** 2) / 90);
            h = lerp(h, 3 + bowl + rim, smooth(95, 60, dc));
        }
        // Obsidian Dragonwilds volcanic caldera
        const dd = Math.hypot(x - DRAGON_CRATER.x, z - DRAGON_CRATER.z);
        if (dd < 155) {
            const ridge = 12 * Math.exp(-((dd - 88) ** 2) / 260) + N.ridged(x / 52, z / 52, 97, 3) * 9;
            h = lerp(h, 6.5 + ridge, smooth(155, 70, dd));
        }
        const edge = Math.min(x - BOUNDS.minX, BOUNDS.maxX - x, z - BOUNDS.minZ, BOUNDS.maxZ - z);
        h += smooth(24, 0, edge) * 26;
        return h;
    }

    const boxes = [];
    const pads = [];
    function addPad(x, z, w, d, blend = 10, minH = 1.2) {
        const pad = { x, z, hw: w / 2, hd: d / 2, blend, h: Math.max(minH, rawHeight(x, z)) };
        pads.push(pad);
        return pad.h;
    }
    function rawFinal(x, z) {
        let h = rawHeight(x, z);
        const road = roadInfo(x, z);
        if (road) {
            const target = 2.2 + N.fbm(x / 160, z / 160, 11, 2) * 3;
            const k = smooth(road.road.w * 0.5 + 3, road.road.w * 0.5, road.d);
            if (h > -0.2) h = lerp(h, Math.max(target, h * 0.6), k * 0.6);
        }
        for (let i = 0; i < pads.length; i++) {
            const p = pads[i];
            const dx = Math.max(0, Math.abs(x - p.x) - p.hw), dz = Math.max(0, Math.abs(z - p.z) - p.hd);
            const d = Math.hypot(dx, dz);
            if (d < p.blend) h = lerp(h, p.h, smooth(p.blend, 0, d));
        }
        return h;
    }
    const B = (x, y, z, w, h, d, mat, opts) => boxes.push(Object.assign({ x, y, z, w, h, d, mat }, opts || {}));

    function building(x, z, w, d, y, mat, door = 's', h = 3.4, roof = 'dark_slate_roof') {
        const t = 0.3, dw = 1.8, dh = 2.5;
        B(x, y + 0.1, z, w, 0.2, d, 'wood_plank');
        B(x, y + h + 0.12, z, w + 0.6, 0.24, d + 0.6, roof);
        const wall = (side) => {
            const alongX = side === 'n' || side === 's';
            const len = alongX ? w : d;
            const cx = side === 'e' ? x + w / 2 : side === 'w' ? x - w / 2 : x;
            const cz = side === 'n' ? z - d / 2 : side === 's' ? z + d / 2 : z;
            if (side !== door) {
                if (alongX) B(cx, y + h / 2, cz, len, h, t, mat); else B(cx, y + h / 2, cz, t, h, len, mat);
                return;
            }
            const seg = (len - dw) / 2;
            const off = dw / 2 + seg / 2;
            if (alongX) {
                B(cx - off, y + h / 2, cz, seg, h, t, mat); B(cx + off, y + h / 2, cz, seg, h, t, mat);
                B(cx, y + dh + (h - dh) / 2, cz, dw, h - dh, t, mat);
            } else {
                B(cx, y + h / 2, cz - off, t, h, seg, mat); B(cx, y + h / 2, cz + off, t, h, seg, mat);
                B(cx, y + dh + (h - dh) / 2, cz, t, h - dh, dw, mat);
            }
        };
        ['n', 's', 'e', 'w'].forEach(wall);
    }

    function watchtower(x, z, y, mat = 'castle_stone', h = 8.5) {
        B(x, y + h / 2, z, 5.2, h, 5.2, mat);
        B(x, y + h + 0.3, z, 6.4, 0.6, 6.4, mat);
    }

    /* ================================================================ CORE & ORIGINAL POIS */
    const TOWN = { x: -190, z: 190 };
    const townY = addPad(TOWN.x, TOWN.z, 66, 56, 12);
    (function town() {
        const y = townY, hw = 33, hd = 28, wh = 3.2;
        const seg = (x1, z1, x2, z2) => {
            const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
            if (x1 === x2) B(cx, y + wh / 2, cz, 0.6, wh, Math.abs(z2 - z1), 'wood_fort');
            else B(cx, y + wh / 2, cz, Math.abs(x2 - x1), wh, 0.6, 'wood_fort');
        };
        const X0 = TOWN.x - hw, X1 = TOWN.x + hw, Z0 = TOWN.z - hd, Z1 = TOWN.z + hd;
        seg(X0, Z0, TOWN.x - 4, Z0); seg(TOWN.x + 4, Z0, X1, Z0);
        seg(X0, Z1, TOWN.x - 4, Z1); seg(TOWN.x + 4, Z1, X1, Z1);
        seg(X0, Z0, X0, Z1);
        seg(X1, Z0, X1, TOWN.z - 4); seg(X1, TOWN.z + 4, X1, Z1);
        building(TOWN.x - 12, TOWN.z - 14, 12, 9, y, 'brick', 's', 4.2);
        building(TOWN.x + 12, TOWN.z - 12, 10, 8, y, 'green_siding', 's');
        building(TOWN.x - 12, TOWN.z + 12, 10, 8, y, 'yellow_siding', 'n');
        building(TOWN.x + 13, TOWN.z + 12, 9, 7, y, 'wood_plank', 'n');
        B(TOWN.x, y + 0.5, TOWN.z, 2.4, 1.0, 2.4, 'castle_stone');
        B(TOWN.x + 24, y + 0.6, TOWN.z - 2, 1.2, 1.2, 1.2, 'wood_crate');
        B(TOWN.x + 25.4, y + 0.6, TOWN.z - 1.6, 1.2, 1.2, 1.2, 'wood_crate');
        for (const [lx, lz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) B(TOWN.x - 25 + lx, y + 4, TOWN.z - 20 + lz, 0.25, 8, 0.25, 'rust_steel');
        B(TOWN.x - 25, y + 9.5, TOWN.z - 20, 4, 3, 4, 'wood_plank');
    })();

    const PUMP = { x: -118, z: 150 };
    const pumpY = addPad(PUMP.x, PUMP.z, 24, 18);
    building(PUMP.x, PUMP.z, 10, 8, pumpY, 'soviet_concrete', 'w', 4.0);
    B(PUMP.x + 8, pumpY + 0.8, PUMP.z + 4, 3, 1.6, 2, 'rusted_metal');
    B(PUMP.x + 3.5, pumpY + 1.2, PUMP.z - 6, 6, 2.4, 0.8, 'rust_steel');
    B(PUMP.x - 8, pumpY + 0.25, PUMP.z + 5, 3, 0.5, 3, 'diamond_plate');

    const OVER = { x: -112, z: 252 };
    const overY = addPad(OVER.x, OVER.z, 40, 22);
    for (const dx of [-14, 0, 14]) B(OVER.x + dx, overY + 2.5, OVER.z, 2, 5, 2, 'concrete');
    B(OVER.x, overY + 5.4, OVER.z, 40, 0.8, 9, 'concrete');
    B(OVER.x - 6, overY + 0.6, OVER.z + 7, 6, 1.2, 0.8, 'sandbag');
    B(OVER.x + 7, overY + 0.6, OVER.z - 7, 6, 1.2, 0.8, 'sandbag');
    B(OVER.x + 4, overY + 1.1, OVER.z + 6, 4.5, 2.2, 2, 'container_red');
    const ramps = [{ axis: 'x', z: OVER.z, x1: OVER.x + 34, x2: OVER.x + 20, y1: overY, y2: overY + 5.8, w: 4, mat: 'concrete' }];

    const RELAY = { x: -258, z: 122 };
    const relayY = addPad(RELAY.x, RELAY.z, 18, 16);
    building(RELAY.x + 5, RELAY.z + 2, 6, 5, relayY, 'concrete', 'w');
    for (const [lx, lz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) B(RELAY.x - 4 + lx, relayY + 9, RELAY.z + lz, 0.22, 18, 0.22, 'rust_steel');
    B(RELAY.x - 4, relayY + 18.1, RELAY.z, 3, 0.2, 3, 'diamond_plate');

    const CONVOY = { x: -150, z: 104 };
    const convoyY = addPad(CONVOY.x, CONVOY.z, 26, 16);
    B(CONVOY.x - 6, convoyY + 1.3, CONVOY.z, 8, 2.6, 3, 'container_olive');
    B(CONVOY.x + 5, convoyY + 1.0, CONVOY.z + 2, 6, 2.0, 2.6, 'truck_yellow');
    B(CONVOY.x + 1, convoyY + 0.5, CONVOY.z - 5, 3, 1.0, 2, 'rusted_metal');

    const CAVE = { x: -268, z: 268 };
    const caveY = addPad(CAVE.x, CAVE.z, 20, 18, 6);
    B(CAVE.x - 7, caveY + 3, CAVE.z, 4, 6, 10, 'bunker_stone');
    B(CAVE.x + 7, caveY + 3, CAVE.z, 4, 6, 10, 'bunker_stone');
    B(CAVE.x, caveY + 6.5, CAVE.z, 18, 1.2, 12, 'bunker_stone');
    B(CAVE.x, caveY + 3, CAVE.z - 6.5, 18, 6, 1.2, 'bunker_stone');

    const YARD = { x: 40, z: 196 };
    const yardY = addPad(YARD.x, YARD.z, 50, 36);
    building(YARD.x - 10, YARD.z - 8, 10, 8, yardY, 'rusted_metal', 'e', 3.6);
    for (let i = 0; i < 5; i++) B(YARD.x + 4 + i * 3.2, yardY + 1.3, YARD.z + 8, 2.6, 2.6, 6, i % 2 ? 'container_blue' : 'container_red');
    B(YARD.x + 12, yardY + 3.9, YARD.z + 8, 2.6, 2.6, 6, 'container_olive');
    B(YARD.x - 25, yardY + 1.5, YARD.z, 0.4, 3, 36, 'privacy_fence');

    const QCAMP = { x: -150, z: -40 };
    const qcampY = addPad(QCAMP.x, QCAMP.z, 22, 18);
    building(QCAMP.x, QCAMP.z, 8, 6, qcampY, 'rusted_metal', 'e');
    B(QCAMP.x - 7, qcampY + 0.6, QCAMP.z + 5, 5, 1.2, 0.8, 'sandbag');

    const CHECK = { x: -72, z: -140 };
    const checkY = addPad(CHECK.x, CHECK.z, 26, 18);
    building(CHECK.x - 6, CHECK.z, 9, 7, checkY, 'lab_panel', 'e', 3.6);
    B(CHECK.x + 6, checkY + 1, CHECK.z - 7, 0.6, 2, 6, 'concrete');
    B(CHECK.x + 6, checkY + 1, CHECK.z + 7, 0.6, 2, 6, 'concrete');
    B(CHECK.x + 6, checkY + 3.2, CHECK.z, 0.3, 0.3, 8, 'diamond_plate', { noCollide: true });

    const SHRINE = { x: 140, z: -122 };
    const shrineY = addPad(SHRINE.x, SHRINE.z, 18, 18);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; B(SHRINE.x + Math.cos(a) * 6, shrineY + 2, SHRINE.z + Math.sin(a) * 6, 0.8, 4, 0.8, 'pentagon_marble'); }
    B(SHRINE.x, shrineY + 0.3, SHRINE.z, 4, 0.6, 4, 'pentagon_panel');

    const NEST = { x: 214, z: 26 };
    addPad(NEST.x, NEST.z, 28, 28, 8, 0.4);

    const BARGE = { x: 136, z: 54 };
    const bargeY = addPad(BARGE.x, BARGE.z, 18, 12, 6, 0.8);
    B(BARGE.x, bargeY + 1.1, BARGE.z, 12, 2.2, 4.5, 'container_blue');
    B(BARGE.x + 4, bargeY + 0.6, BARGE.z - 4, 3, 1.2, 2, 'rusted_metal');

    const BUNKER = { x: -135, z: -205 };
    const bunkerY = addPad(BUNKER.x, BUNKER.z, 20, 16, 6);
    building(BUNKER.x, BUNKER.z, 8, 7, bunkerY, 'soviet_concrete', 's', 3.5);
    B(BUNKER.x + 6, bunkerY + 0.6, BUNKER.z + 5, 4, 1.2, 0.8, 'sandbag');

    const RIFT = { x: 230, z: -145 };
    const riftY = addPad(RIFT.x, RIFT.z, 16, 16, 6);
    B(RIFT.x, riftY + 1.2, RIFT.z, 2.4, 2.4, 2.4, 'pentagon_marble');

    /* ================================================================ NEW 1280m FRONTIER SETTLEMENTS, FORTS & RUINS */
    // 1. Whispering Pinewoods: Ranger's Watch Lodge (Safe Settlement) + Poacher Palisade + Root-Barrow Entrance
    const LODGE = { x: -420, z: 360 };
    const lodgeY = addPad(LODGE.x, LODGE.z, 42, 36, 12);
    building(LODGE.x - 8, LODGE.z - 6, 11, 8, lodgeY, 'wood_plank', 's', 3.8);
    building(LODGE.x + 9, LODGE.z - 5, 8, 7, lodgeY, 'wood_fort', 's', 3.4);
    watchtower(LODGE.x - 16, LODGE.z + 12, lodgeY, 'wood_fort', 7.5);

    const POACHER_CAMP = { x: -520, z: 310 };
    const poachY = addPad(POACHER_CAMP.x, POACHER_CAMP.z, 28, 24, 8);
    building(POACHER_CAMP.x, POACHER_CAMP.z - 5, 9, 7, poachY, 'wood_fort', 's', 3.2);
    B(POACHER_CAMP.x - 8, poachY + 0.6, POACHER_CAMP.z + 6, 4, 1.2, 0.8, 'sandbag');

    const WOLF_DEN = { x: -355, z: 455 };
    const wolfY = addPad(WOLF_DEN.x, WOLF_DEN.z, 24, 22, 8);
    B(WOLF_DEN.x, wolfY + 2.2, WOLF_DEN.z - 6, 8, 4.4, 5, 'bunker_stone');

    const BARROW_ENT = { x: -475, z: 445 };
    const barrowEntY = addPad(BARROW_ENT.x, BARROW_ENT.z, 26, 24, 8);
    B(BARROW_ENT.x - 5, barrowEntY + 2.5, BARROW_ENT.z - 4, 3, 5, 6, 'castle_stone');
    B(BARROW_ENT.x + 5, barrowEntY + 2.5, BARROW_ENT.z - 4, 3, 5, 6, 'castle_stone');
    B(BARROW_ENT.x, barrowEntY + 5.3, BARROW_ENT.z - 4, 13, 0.8, 6, 'castle_stone');

    // 2. Barrow-Moor Graveyard: Grimhollow Chapel (Outpost) + Crypt of Marrow + Crimson Manor + Gallow's Mound
    const CHAPEL = { x: -425, z: 15 };
    const chapelY = addPad(CHAPEL.x, CHAPEL.z, 36, 32, 10);
    building(CHAPEL.x, CHAPEL.z - 6, 12, 9, chapelY, 'castle_stone', 's', 4.6);

    const CRYPT_MOOR = { x: -475, z: -75 };
    const cryptY = addPad(CRYPT_MOOR.x, CRYPT_MOOR.z, 32, 28, 10);
    building(CRYPT_MOOR.x, CRYPT_MOOR.z - 5, 10, 8, cryptY, 'castle_stone', 's', 4.0);
    watchtower(CRYPT_MOOR.x - 11, CRYPT_MOOR.z - 8, cryptY, 'castle_stone', 7);

    const VAMP_MANOR = { x: -535, z: 95 };
    const vampY = addPad(VAMP_MANOR.x, VAMP_MANOR.z, 38, 34, 10);
    building(VAMP_MANOR.x, VAMP_MANOR.z - 6, 14, 10, vampY, 'brick', 's', 5.0);
    watchtower(VAMP_MANOR.x - 10, VAMP_MANOR.z - 8, vampY, 'castle_stone', 9);
    watchtower(VAMP_MANOR.x + 10, VAMP_MANOR.z - 8, vampY, 'castle_stone', 9);

    const GALLOWS = { x: -345, z: -65 };
    addPad(GALLOWS.x, GALLOWS.z, 26, 24, 8);

    // 3. Rust Sprawl & Mire Delta Outer Sites: Foundry Depths Yard + Coven Bog
    const FOUNDRY_YARD = { x: 135, z: 265 };
    const foundryY = addPad(FOUNDRY_YARD.x, FOUNDRY_YARD.z, 34, 28, 10);
    building(FOUNDRY_YARD.x, FOUNDRY_YARD.z - 5, 12, 8, foundryY, 'rusted_metal', 's', 4.2);
    B(FOUNDRY_YARD.x + 10, foundryY + 1.3, FOUNDRY_YARD.z + 5, 6, 2.6, 2.8, 'container_red');

    const COVEN_BOG = { x: 325, z: 85 };
    const covenY = addPad(COVEN_BOG.x, COVEN_BOG.z, 28, 26, 8, 1.0);
    building(COVEN_BOG.x, COVEN_BOG.z - 4, 8, 7, covenY, 'wood_plank', 's', 3.4);

    // 4. Ash Quarry Outer: Deep-Vein Minehead
    const MINEHEAD = { x: -255, z: -115 };
    const mineY = addPad(MINEHEAD.x, MINEHEAD.z, 28, 24, 8);
    building(MINEHEAD.x, MINEHEAD.z - 5, 9, 7, mineY, 'soviet_concrete', 's', 3.8);

    // 5. Sunscorched Badlands: Dustwind Oasis (Outpost) + Redrock Outlaw Mesa + Sunfang Pyramid Ruins + Scorpion Canyon
    const OASIS = { x: 385, z: 395 };
    const oasisY = addPad(OASIS.x, OASIS.z, 40, 36, 12);
    building(OASIS.x - 8, OASIS.z - 6, 10, 8, oasisY, 'yellow_siding', 's', 3.6);
    building(OASIS.x + 9, OASIS.z - 6, 9, 7, oasisY, 'wood_plank', 's', 3.4);

    const REDROCK_MESA = { x: 300, z: 485 };
    const mesaY = addPad(REDROCK_MESA.x, REDROCK_MESA.z, 34, 28, 10);
    building(REDROCK_MESA.x, REDROCK_MESA.z - 5, 11, 8, mesaY, 'rusted_metal', 's', 3.8);
    B(REDROCK_MESA.x - 9, mesaY + 0.6, REDROCK_MESA.z + 6, 5, 1.2, 0.8, 'sandbag');

    const SUNFANG_RUINS = { x: 485, z: 470 };
    const sunfangY = addPad(SUNFANG_RUINS.x, SUNFANG_RUINS.z, 38, 36, 10);
    for (let i = 0; i < 4; i++) {
        const s = 18 - i * 3.6;
        B(SUNFANG_RUINS.x, sunfangY + 0.9 + i * 1.8, SUNFANG_RUINS.z - 6, s, 1.8, s, 'pentagon_marble');
    }

    const SCORPION_CANYON = { x: 495, z: 295 };
    addPad(SCORPION_CANYON.x, SCORPION_CANYON.z, 30, 28, 8);

    // 6. Sunken Ruin Coast: Drowned Lighthouse + Shipwreck Shoals + Abyssal Sanctum Gate
    const LIGHTHOUSE = { x: 470, z: -45 };
    const lightY = addPad(LIGHTHOUSE.x, LIGHTHOUSE.z, 32, 30, 10, 1.8);
    watchtower(LIGHTHOUSE.x, LIGHTHOUSE.z - 6, lightY, 'castle_stone', 18);

    const SHIPWRECK = { x: 535, z: 75 };
    const wreckY = addPad(SHIPWRECK.x, SHIPWRECK.z, 30, 24, 8, 1.0);
    B(SHIPWRECK.x, wreckY + 1.4, SHIPWRECK.z - 3, 14, 2.8, 5, 'wood_fort');

    const DROWNED_GATE = { x: 525, z: -135 };
    const drownedY = addPad(DROWNED_GATE.x, DROWNED_GATE.z, 28, 26, 8, 1.5);
    for (const dx of [-5, 5]) B(DROWNED_GATE.x + dx, drownedY + 3, DROWNED_GATE.z - 4, 2, 6, 2, 'castle_stone');
    B(DROWNED_GATE.x, drownedY + 6.4, DROWNED_GATE.z - 4, 12, 1, 2.4, 'castle_stone');

    // 7. Alpine Outer & Frostfang Peaks: Black-Site Sublevel Hatch + Frostspire Castle Keep + Glacier Pass
    const BLACKLAB_TOP = { x: -165, z: -285 };
    const blackY = addPad(BLACKLAB_TOP.x, BLACKLAB_TOP.z, 28, 24, 8);
    building(BLACKLAB_TOP.x, BLACKLAB_TOP.z - 5, 10, 7, blackY, 'lab_panel', 's', 3.8);

    const FROSTSPIRE = { x: -455, z: -445 };
    const frostY = addPad(FROSTSPIRE.x, FROSTSPIRE.z, 48, 44, 12);
    building(FROSTSPIRE.x, FROSTSPIRE.z - 8, 16, 12, frostY, 'castle_stone', 's', 5.6);
    watchtower(FROSTSPIRE.x - 14, FROSTSPIRE.z - 10, frostY, 'castle_stone', 12);
    watchtower(FROSTSPIRE.x + 14, FROSTSPIRE.z - 10, frostY, 'castle_stone', 12);
    watchtower(FROSTSPIRE.x - 14, FROSTSPIRE.z + 12, frostY, 'castle_stone', 9);
    watchtower(FROSTSPIRE.x + 14, FROSTSPIRE.z + 12, frostY, 'castle_stone', 9);

    const GLACIER_PASS = { x: -330, z: -380 };
    addPad(GLACIER_PASS.x, GLACIER_PASS.z, 30, 28, 8);

    // 8. Obsidian Dragonwilds: Dragonbone Outpost (Safe Camp) + Wyvern Roost + Obsidian Dragon Vault
    const DRAGON_CAMP = { x: 355, z: -345 };
    const dcampY = addPad(DRAGON_CAMP.x, DRAGON_CAMP.z, 36, 32, 10);
    building(DRAGON_CAMP.x, DRAGON_CAMP.z - 6, 11, 8, dcampY, 'castle_stone', 's', 4.0);

    const WYVERN_ROOST = { x: 430, z: -395 };
    const roostY = addPad(WYVERN_ROOST.x, WYVERN_ROOST.z, 34, 30, 10);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; B(WYVERN_ROOST.x + Math.cos(a) * 9, roostY + 3.2, WYVERN_ROOST.z + Math.sin(a) * 9, 1.4, 6.4, 1.4, 'bunker_stone'); }

    const DRAGON_VAULT_TOP = { x: 485, z: -485 };
    const dvTopY = addPad(DRAGON_VAULT_TOP.x, DRAGON_VAULT_TOP.z, 40, 36, 10);
    watchtower(DRAGON_VAULT_TOP.x - 10, DRAGON_VAULT_TOP.z - 6, dvTopY, 'bunker_stone', 11);
    watchtower(DRAGON_VAULT_TOP.x + 10, DRAGON_VAULT_TOP.z - 6, dvTopY, 'bunker_stone', 11);
    B(DRAGON_VAULT_TOP.x, dvTopY + 7.5, DRAGON_VAULT_TOP.z - 6, 22, 1.6, 4, 'bunker_stone');

    /* ================================================================ 12 SEALED UNDERGROUND DUNGEONS (x >= 1600, z >= 1600) */
    const INT = { x: 1600, z: 1600 };
    // 1. Original Culvert Sublevel at (1600, 1600) — exact layout preserved for quest & QA parity!
    (function culvert() {
        const x = INT.x, z = INT.z, H = 4.2;
        B(x, -0.2, z + 22, 26, 0.4, 56, 'bunker_stone');
        B(x, H + 0.2, z + 22, 26, 0.4, 56, 'bunker_stone');
        B(x - 13, H / 2, z + 22, 0.6, H, 56, 'bunker_stone');
        B(x + 13, H / 2, z + 22, 0.6, H, 56, 'bunker_stone');
        B(x, H / 2, z - 6, 26, H, 0.6, 'bunker_stone');
        B(x, H / 2, z + 50, 26, H, 0.6, 'bunker_stone');
        B(x - 7, H / 2, z + 10, 11, H, 0.6, 'soviet_concrete');
        B(x + 8, H / 2, z + 10, 9, H, 0.6, 'soviet_concrete');
        B(x - 3, H / 2, z + 2, 0.6, H, 16, 'soviet_concrete');
        B(x + 6, H / 2, z + 20, 0.6, H, 10, 'rust_steel');
        B(x - 6, 0.6, z + 28, 4, 1.2, 1.2, 'rusted_metal');
        B(x + 5, 0.6, z + 36, 1.2, 1.2, 4, 'rusted_metal');
        B(x - 2, 0.9, z + 42, 6, 1.8, 0.8, 'rust_steel');
        B(x, 0.02, z + 32, 18, 0.04, 20, 'swamp_water', { noCollide: true });
    })();

    // Parametric Multi-Chamber Sealed Dungeon Builder for Dungeons 2..12
    const DUNGEONS = [
        { id: 'culvert_sublevel', name: 'Culvert Sublevel', region: 'haven_basin', lvl: '3–6', x: INT.x, z: INT.z, surf: { x: PUMP.x - 8, z: PUMP.z + 5 } },
        { id: 'dng_whisper_barrow', name: 'Whispering Root-Barrow', region: 'whispering_woods', lvl: '5–9', x: 1900, z: 1600, wallMat: 'castle_stone', floorMat: 'bunker_stone', surf: { x: BARROW_ENT.x, z: BARROW_ENT.z + 3 },
            enemies: ['orc_reaver', 'timber_wolf', 'orc_reaver', 'puglin_scamp'], boss: 'boss_thornback_orc', grant: null },
        { id: 'dng_foundry_depths', name: 'Ironclad Foundry Depths', region: 'rust_sprawl', lvl: '8–12', x: 2200, z: 1600, wallMat: 'rust_steel', floorMat: 'diamond_plate', surf: { x: FOUNDRY_YARD.x, z: FOUNDRY_YARD.z + 4 },
            enemies: ['enforcer', 'syn_gunner', 'syn_arc_tech', 'quarry_sapper'], boss: 'boss_foundry_kragg', grant: 'w_mg42_scrap' },
        { id: 'dng_sunken_crypt', name: 'Sunken Crypt of Marrow', region: 'barrow_moor', lvl: '11–16', x: 2500, z: 1600, wallMat: 'castle_stone', floorMat: 'bunker_stone', surf: { x: CRYPT_MOOR.x, z: CRYPT_MOOR.z + 4 },
            enemies: ['skeleton_warrior', 'grave_zombie', 'barrow_ghost', 'crypt_keeper'], boss: 'boss_lich_malgath', grant: 'barrow_seal' },
        { id: 'dng_vampire_vault', name: 'Crimson Sanctum Vaults', region: 'barrow_moor', lvl: '14–19', x: 1600, z: 1900, wallMat: 'brick', floorMat: 'pentagon_marble', surf: { x: VAMP_MANOR.x, z: VAMP_MANOR.z + 6 },
            enemies: ['skeleton_warrior', 'crypt_keeper', 'blood_vampire', 'blood_vampire'], boss: 'boss_lord_vespera', grant: 'relic_lich_phylactery' },
        { id: 'dng_coven_cavern', name: 'Mire Witch Coven Cavern', region: 'mire_delta', lvl: '15–20', x: 1900, z: 1900, wallMat: 'bunker_stone', floorMat: 'bunker_stone', surf: { x: COVEN_BOG.x, z: COVEN_BOG.z + 5 },
            enemies: ['mire_witch', 'brood_blight_hound', 'spitter', 'brood_frost_wraith'], boss: 'boss_coven_morwen', grant: 'elixir_wisdom' },
        { id: 'dng_dwarven_mine', name: 'Deep-Vein Quarry Mines', region: 'ash_quarry', lvl: '18–24', x: 2200, z: 1900, wallMat: 'bunker_stone', floorMat: 'concrete', surf: { x: MINEHEAD.x, z: MINEHEAD.z + 4 },
            enemies: ['brood_pyro_fiend', 'quarry_sapper', 'brood_iron_goliath', 'imp_firestarter'], boss: 'boss_molten_ignis', grant: 'mithril_ore' },
        { id: 'dng_sand_tomb', name: "Sunfang Pharaoh's Tomb", region: 'sunscorched_badlands', lvl: '21–27', x: 2500, z: 1900, wallMat: 'pentagon_marble', floorMat: 'pentagon_panel', surf: { x: SUNFANG_RUINS.x, z: SUNFANG_RUINS.z + 8 },
            enemies: ['skeleton_warrior', 'dune_scorpion', 'sunfang_guardian', 'sunfang_guardian'], boss: 'boss_pharaoh_kharim', grant: 'sunfang_idol' },
        { id: 'dng_drowned_sanctum', name: 'Abyssal Tide Sanctum', region: 'sunken_coast', lvl: '25–31', x: 1600, z: 2200, wallMat: 'castle_stone', floorMat: 'bunker_stone', surf: { x: DROWNED_GATE.x, z: DROWNED_GATE.z + 2 },
            enemies: ['drowned_corsair', 'abyssal_siren', 'drowned_corsair', 'brood_frost_wraith'], boss: 'boss_tide_nereus', grant: 'w_an94_cryo' },
        { id: 'dng_aegis_blacklab', name: 'Aegis Black-Site Sublevel 9', region: 'alpine_array', lvl: '28–35', x: 1900, z: 2200, wallMat: 'lab_panel', floorMat: 'diamond_plate', surf: { x: BLACKLAB_TOP.x, z: BLACKLAB_TOP.z + 4 },
            enemies: ['aegis', 'aegis_heavy', 'aegis_cryo', 'brood_iron_goliath'], boss: 'boss_omega_zero', grant: 'w_minigun_titan' },
        { id: 'dng_frostspire_keep', name: 'Frostspire Citadel Undercroft', region: 'frostfang_peaks', lvl: '33–41', x: 2200, z: 2200, wallMat: 'castle_stone', floorMat: 'pentagon_marble', surf: { x: FROSTSPIRE.x, z: FROSTSPIRE.z + 5 },
            enemies: ['frost_knight', 'glacier_troll', 'frost_wyrmling', 'frost_knight'], boss: 'boss_frost_valdris', grant: 'frostspire_crown' },
        { id: 'dng_dragon_vault', name: 'Obsidian Dragonwild Vault', region: 'obsidian_dragonwilds', lvl: '42–50', x: 2500, z: 2200, wallMat: 'bunker_stone', floorMat: 'pentagon_marble', surf: { x: DRAGON_VAULT_TOP.x, z: DRAGON_VAULT_TOP.z + 4 },
            enemies: ['obsidian_cultist', 'ashen_drake', 'dragonwild_juggernaut', 'ashen_drake'], boss: 'boss_dragon_vaelgor', grant: 'vaelgor_fang' }
    ];

    function buildDungeonGeometry(d) {
        const x = d.x, z = d.z, H = 5.4, Wd = 32, Ln = 72;
        B(x, -0.2, z + 30, Wd, 0.4, Ln, d.floorMat);
        B(x, H + 0.2, z + 30, Wd, 0.4, Ln, d.wallMat);
        B(x - Wd / 2, H / 2, z + 30, 0.8, H, Ln, d.wallMat);
        B(x + Wd / 2, H / 2, z + 30, 0.8, H, Ln, d.wallMat);
        B(x, H / 2, z - 6, Wd, H, 0.8, d.wallMat);
        B(x, H / 2, z + 66, Wd, H, 0.8, d.wallMat);
        // Chamber 1 divider with wide archway
        B(x - 10, H / 2, z + 14, 12, H, 0.8, d.wallMat);
        B(x + 10, H / 2, z + 14, 12, H, 0.8, d.wallMat);
        // Chamber 2 pillars & tactical cover
        for (const dz of [24, 36, 48]) {
            B(x - 9, H / 2, z + dz, 1.6, H, 1.6, d.wallMat);
            B(x + 9, H / 2, z + dz, 1.6, H, 1.6, d.wallMat);
        }
        B(x - 5, 0.7, z + 28, 3.2, 1.4, 1.2, d.wallMat);
        B(x + 5, 0.7, z + 40, 3.2, 1.4, 1.2, d.wallMat);
        // Boss dais at back of sanctum
        B(x, 0.25, z + 58, 12, 0.5, 10, d.floorMat);
    }
    for (let i = 1; i < DUNGEONS.length; i++) buildDungeonGeometry(DUNGEONS[i]);

    /* ================================================================ ALL 60 POIS (48 Surface + 12 Sealed Dungeons) */
    const POIS = [
        // Original 19 POIs (exact IDs preserved)
        { id: 'freestead', name: 'Freestead Town', region: 'haven_basin', x: TOWN.x, z: TOWN.z, r: 34, safe: true, kind: 'settlement' },
        { id: 'pump_three', name: 'Culvert Pumphouse', region: 'haven_basin', x: PUMP.x, z: PUMP.z, r: 18, kind: 'site',
            spawns: [['crawler', -8, 10], ['crawler', 9, 12], ['raider', 13, -8], ['puglin_scamp', -11, -7]] },
        { id: 'overpass', name: 'Raider Overpass', region: 'haven_basin', x: OVER.x, z: OVER.z, r: 26, kind: 'camp',
            spawns: [['raider', -10, 5], ['raider', 11, -5], ['raider_pyro', 15, 6], ['raider_marksman', 0, -2, 5.8], ['raider_boss', 2, 10]] },
        { id: 'relay', name: 'Abandoned Relay', region: 'haven_basin', x: RELAY.x, z: RELAY.z, r: 16, kind: 'site',
            spawns: [['crawler', 8, -8], ['brood_venom_mite', -8, 8], ['puglin_scamp', 0, -9]] },
        { id: 'convoy', name: 'Crashed Convoy', region: 'haven_basin', x: CONVOY.x, z: CONVOY.z, r: 18, kind: 'site',
            spawns: [['crawler', -4, 9], ['stalker', 10, -7], ['brood_venom_mite', 12, 5]] },
        { id: 'shale_cave', name: 'Shale Cave', region: 'haven_basin', x: CAVE.x, z: CAVE.z, r: 18, kind: 'nest',
            spawns: [['crawler', 0, 10], ['crawler', 4, 11], ['stalker', -4, 10], ['spitter', 0, 13]] },
        { id: 'rail_yard', name: 'Ironclad Rail Yard', region: 'rust_sprawl', x: YARD.x, z: YARD.z, r: 30, kind: 'hub', faction: 'syndicate',
            spawns: [['enforcer', 8, -6], ['enforcer', -14, 10], ['syn_gunner', 15, -2], ['syn_arc_tech', 4, -14]] },
        { id: 'quarry_camp', name: 'Quarry Dig Camp', region: 'ash_quarry', x: QCAMP.x, z: QCAMP.z, r: 22, kind: 'contested',
            spawns: [['militia', -8, 8], ['militia_scout', -10, -5], ['enforcer', 10, 7], ['syn_gunner', 12, -7]] },
        { id: 'quarry_pit', name: 'Excavator Pit', region: 'ash_quarry', x: QUARRY.x, z: QUARRY.z, r: 34, kind: 'site',
            spawns: [['brood_pyro_fiend', 14, 0], ['brute', -10, 12], ['spitter', 8, -14], ['boss_quarry_colossus', 18, 16]] },
        { id: 'checkpoint', name: 'Aegis Checkpoint K-4', region: 'alpine_array', x: CHECK.x, z: CHECK.z, r: 20, kind: 'hub', faction: 'aegis',
            spawns: [['aegis', 10, -4], ['aegis_heavy', 10, 4]] },
        { id: 'dish_ridge', name: 'Deep-Space Dish Ridge', region: 'alpine_array', x: -60, z: -238, r: 34, kind: 'site',
            spawns: [['aegis', 0, 10], ['aegis_cryo', 14, -6], ['stalker', -14, 2], ['boss_alpine_warden', -18, 14]] },
        { id: 'helix_shrine', name: 'Helix Bloom Shrine', region: 'meridian_core', x: SHRINE.x, z: SHRINE.z, r: 16, kind: 'hub', faction: 'helix',
            spawns: [['helix', 9, 8], ['helix_zealot', -9, -8]] },
        { id: 'mire_nest', name: 'Cooling Stack Nest', region: 'mire_delta', x: NEST.x, z: NEST.z, r: 28, kind: 'nest',
            spawns: [['brood_blight_hound', 0, 12], ['spitter', 10, -8], ['brood_frost_wraith', -12, 2], ['boss_mire_hydra', -8, 14]] },
        { id: 'goliath', name: 'Goliath Crane', region: 'rust_sprawl', x: 90, z: 232, r: 18, kind: 'site',
            spawns: [['raider_bruiser', 0, 10], ['raider_pyro', 10, -4], ['syn_sniper', -8, 8]] },
        { id: 'sunken_barge', name: 'Sunken Cargo Barge', region: 'mire_delta', x: BARGE.x, z: BARGE.z, r: 18, kind: 'site',
            spawns: [['brood_blight_hound', -8, 8], ['brood_frost_wraith', 9, -7], ['spitter', 8, 8]] },
        { id: 'bunker_delta', name: 'Bunker Delta', region: 'alpine_array', x: BUNKER.x, z: BUNKER.z, r: 20, kind: 'site',
            spawns: [['aegis_heavy', 9, 9], ['aegis_cryo', -9, 8], ['brood_iron_goliath', 11, -8]] },
        { id: 'crater_rift', name: 'Crater Anomaly Rift', region: 'meridian_core', x: RIFT.x, z: RIFT.z, r: 20, kind: 'site',
            spawns: [['helix_voidweaver', 8, 8], ['helix_zealot', -9, 6], ['brood_void_stalker', 0, -11]] },
        { id: 'meridian_dome', name: 'Meridian Containment Dome', region: 'meridian_core', x: CORE.x, z: CORE.z, r: 42, kind: 'endgame',
            spawns: [['helix_voidweaver', 24, 0], ['brood_iron_goliath', -20, 14], ['helix', 0, -26], ['boss_meridian_sovereign', 16, 20]] },
        { id: 'culvert_sublevel', name: 'Culvert Sublevel', region: 'haven_basin', x: INT.x, z: INT.z + 22, r: 30, kind: 'interior', interior: true,
            spawns: [['crawler', -6, 0], ['crawler', 6, 4], ['stalker', 0, 10], ['spitter', -8, 16], ['matriarch', 0, 22]] },

        // --- NEW OUTER FRONTIER SURFACE POIS ---
        { id: 'whisper_lodge', name: "Ranger's Watch Lodge", region: 'whispering_woods', x: LODGE.x, z: LODGE.z, r: 28, safe: true, kind: 'settlement' },
        { id: 'poacher_palisade', name: 'Poacher Palisade', region: 'whispering_woods', x: POACHER_CAMP.x, z: POACHER_CAMP.z, r: 24, kind: 'camp',
            spawns: [['forest_poacher', -9, 8], ['forest_poacher', 9, 8], ['raider_bruiser', 0, 11], ['timber_wolf', -11, -4]] },
        { id: 'wolf_den', name: 'Dire Wolf Den', region: 'whispering_woods', x: WOLF_DEN.x, z: WOLF_DEN.z, r: 22, kind: 'nest',
            spawns: [['timber_wolf', -7, 7], ['timber_wolf', 7, 7], ['timber_wolf', 0, 11], ['orc_reaver', -8, -2]] },
        { id: 'barrow_gate', name: 'Root-Barrow Mound', region: 'whispering_woods', x: BARROW_ENT.x, z: BARROW_ENT.z, r: 22, kind: 'site',
            spawns: [['orc_reaver', -9, 8], ['orc_reaver', 9, 8], ['puglin_scamp', 0, 12]] },

        { id: 'grimhollow_chapel', name: 'Grimhollow Sanctuary', region: 'barrow_moor', x: CHAPEL.x, z: CHAPEL.z, r: 26, safe: true, kind: 'settlement' },
        { id: 'marrow_crypt_yard', name: 'Marrow Boneyard', region: 'barrow_moor', x: CRYPT_MOOR.x, z: CRYPT_MOOR.z, r: 26, kind: 'site',
            spawns: [['skeleton_warrior', -9, 9], ['skeleton_warrior', 9, 9], ['grave_zombie', -10, 2], ['barrow_ghost', 10, 2]] },
        { id: 'vampire_manor', name: 'Crimson Manor Courtyard', region: 'barrow_moor', x: VAMP_MANOR.x, z: VAMP_MANOR.z, r: 28, kind: 'camp',
            spawns: [['blood_vampire', -10, 10], ['crypt_keeper', 10, 10], ['skeleton_warrior', 0, 13]] },
        { id: 'gallows_cross', name: "Gallow's Crossroads", region: 'barrow_moor', x: GALLOWS.x, z: GALLOWS.z, r: 22, kind: 'site',
            spawns: [['grave_zombie', -7, 6], ['barrow_ghost', 7, 6], ['skeleton_warrior', 0, -7]] },

        { id: 'foundry_yard', name: 'Smuggler Foundry Yard', region: 'rust_sprawl', x: FOUNDRY_YARD.x, z: FOUNDRY_YARD.z, r: 26, kind: 'camp',
            spawns: [['enforcer', -10, 9], ['syn_gunner', 10, 9], ['syn_arc_tech', 0, 12], ['imp_firestarter', -11, -3]] },
        { id: 'coven_hut', name: 'Witch Coven Bog', region: 'mire_delta', x: COVEN_BOG.x, z: COVEN_BOG.z, r: 24, kind: 'nest',
            spawns: [['mire_witch', -8, 9], ['mire_witch', 8, 9], ['brood_blight_hound', 0, 12]] },
        { id: 'quarry_minehead', name: 'Deep-Vein Minehead', region: 'ash_quarry', x: MINEHEAD.x, z: MINEHEAD.z, r: 24, kind: 'site',
            spawns: [['quarry_sapper', -9, 8], ['brood_pyro_fiend', 9, 8], ['imp_firestarter', 0, 11]] },

        { id: 'dustwind_oasis', name: 'Dustwind Caravan Oasis', region: 'sunscorched_badlands', x: OASIS.x, z: OASIS.z, r: 28, safe: true, kind: 'settlement' },
        { id: 'redrock_mesa', name: 'Redrock Outlaw Mesa', region: 'sunscorched_badlands', x: REDROCK_MESA.x, z: REDROCK_MESA.z, r: 26, kind: 'camp',
            spawns: [['badlands_outlaw', -10, 9], ['badlands_outlaw', 10, 9], ['badlands_sharpshooter', 0, 12]] },
        { id: 'sunfang_ruins', name: 'Sunfang Pyramid Plaza', region: 'sunscorched_badlands', x: SUNFANG_RUINS.x, z: SUNFANG_RUINS.z, r: 30, kind: 'site',
            spawns: [['sunfang_guardian', -11, 11], ['sunfang_guardian', 11, 11], ['dune_scorpion', 0, 14]] },
        { id: 'scorpion_canyon', name: 'Scorpion Gulch', region: 'sunscorched_badlands', x: SCORPION_CANYON.x, z: SCORPION_CANYON.z, r: 24, kind: 'nest',
            spawns: [['dune_scorpion', -8, 6], ['dune_scorpion', 8, 6], ['dune_scorpion', 0, -8]] },

        { id: 'drowned_lighthouse', name: 'Drowned Lighthouse', region: 'sunken_coast', x: LIGHTHOUSE.x, z: LIGHTHOUSE.z, r: 26, kind: 'site',
            spawns: [['drowned_corsair', -9, 9], ['abyssal_siren', 9, 9], ['drowned_corsair', 0, 12]] },
        { id: 'shipwreck_shoals', name: 'Galleon Shipwreck Shoals', region: 'sunken_coast', x: SHIPWRECK.x, z: SHIPWRECK.z, r: 24, kind: 'site',
            spawns: [['drowned_corsair', -8, 8], ['drowned_corsair', 8, 8], ['abyssal_siren', 0, 10]] },
        { id: 'abyssal_gate', name: 'Tide-Sanctum Arch', region: 'sunken_coast', x: DROWNED_GATE.x, z: DROWNED_GATE.z, r: 24, kind: 'site',
            spawns: [['abyssal_siren', -9, 7], ['abyssal_siren', 9, 7], ['drowned_corsair', 0, 10]] },

        { id: 'blacklab_surface', name: 'Aegis Black-Site Perimeter', region: 'alpine_array', x: BLACKLAB_TOP.x, z: BLACKLAB_TOP.z, r: 24, kind: 'camp',
            spawns: [['aegis_heavy', -9, 8], ['aegis_cryo', 9, 8], ['aegis', 0, 11]] },
        { id: 'frostspire_courtyard', name: 'Frostspire Castle Keep', region: 'frostfang_peaks', x: FROSTSPIRE.x, z: FROSTSPIRE.z, r: 34, kind: 'camp',
            spawns: [['frost_knight', -10, 9], ['frost_knight', 10, 9], ['glacier_troll', 0, 15], ['frost_wyrmling', -12, 3]] },
        { id: 'glacier_pass', name: 'Frozen Wyrm Pass', region: 'frostfang_peaks', x: GLACIER_PASS.x, z: GLACIER_PASS.z, r: 26, kind: 'nest',
            spawns: [['glacier_troll', -8, 6], ['frost_wyrmling', 8, 6], ['frost_wyrmling', 0, -8]] },

        { id: 'dragonbone_outpost', name: 'Dragonbone Expedition Camp', region: 'obsidian_dragonwilds', x: DRAGON_CAMP.x, z: DRAGON_CAMP.z, r: 26, safe: true, kind: 'settlement' },
        { id: 'wyvern_roost', name: 'Ashen Wyvern Roost', region: 'obsidian_dragonwilds', x: WYVERN_ROOST.x, z: WYVERN_ROOST.z, r: 30, kind: 'nest',
            spawns: [['ashen_drake', -11, 0], ['ashen_drake', 11, 0], ['obsidian_cultist', 0, 12], ['dragonwild_juggernaut', 0, -12]] },
        { id: 'dragon_citadel_gate', name: 'Obsidian Vault Threshold', region: 'obsidian_dragonwilds', x: DRAGON_VAULT_TOP.x, z: DRAGON_VAULT_TOP.z, r: 34, kind: 'endgame',
            spawns: [['dragonwild_juggernaut', -10, 10], ['ashen_drake', 10, 10], ['helix_archon', 0, 14], ['boss_abyssal_archon', 0, -15]] }
    ];

    // Append Dungeons 2..12 as interior POIs
    for (let i = 1; i < DUNGEONS.length; i++) {
        const d = DUNGEONS[i];
        POIS.push({
            id: d.id, name: d.name, region: d.region, x: d.x, z: d.z + 30, r: 38, kind: 'interior', interior: true,
            spawns: [
                [d.enemies[0], -6, -10],
                [d.enemies[1], 6, -6],
                [d.enemies[2], -7, 6],
                [d.enemies[3], 7, 10],
                [d.boss, 0, 26]
            ]
        });
    }

    const NPCS = [
        { id: 'kessler', name: 'Warden Kessler', faction: 'militia', x: TOWN.x - 12, z: TOWN.z - 15, indoor: true, yaw: 0, dialogue: 'kessler' },
        { id: 'dottie', name: 'Dottie Vail', faction: 'militia', x: TOWN.x + 12, z: TOWN.z - 13, indoor: true, yaw: 0, dialogue: 'dottie', vendor: 'freestead_store' },
        { id: 'ines', name: 'Medic Ines', faction: 'militia', x: TOWN.x - 12, z: TOWN.z + 13, indoor: true, yaw: Math.PI, dialogue: 'ines' },
        { id: 'sola', name: 'Engineer Sola', faction: 'militia', x: TOWN.x + 13, z: TOWN.z + 13, indoor: true, yaw: Math.PI, dialogue: 'sola' },
        { id: 'torin', name: 'Quartermaster Torin', faction: 'militia', x: TOWN.x + 6, z: TOWN.z + 6, yaw: -Math.PI * 0.75, dialogue: 'torin', vendor: 'torin_bench' },
        { id: 'mags', name: 'Mags Orrin', faction: 'syndicate', x: YARD.x - 10, z: YARD.z - 8, indoor: true, yaw: Math.PI / 2, dialogue: 'mags', vendor: 'syndicate_fence' },
        { id: 'vance', name: 'Lt. Imre Vance', faction: 'aegis', x: CHECK.x - 6, z: CHECK.z, indoor: true, yaw: Math.PI / 2, dialogue: 'vance', vendor: 'aegis_quarter' },
        { id: 'lyra', name: 'Dr. Lyra Chen', faction: 'aegis', x: QCAMP.x + 6, z: QCAMP.z - 6, yaw: Math.PI * 0.5, dialogue: 'lyra', vendor: 'lyra_field' },
        { id: 'calla', name: 'Sister Calla', faction: 'helix', x: SHRINE.x, z: SHRINE.z, yaw: 0, dialogue: 'calla', vendor: 'helix_exchange' },
        // 4 New Outer Frontier Settlement NPCs
        { id: 'halvar', name: 'Captain Halvar', faction: 'militia', x: LODGE.x - 8, z: LODGE.z - 6, indoor: true, yaw: 0, dialogue: 'halvar', vendor: 'halvar_lodge' },
        { id: 'orlok', name: 'Grave-Warden Orlok', faction: 'helix', x: CHAPEL.x, z: CHAPEL.z + 4, yaw: 0, dialogue: 'orlok', vendor: 'orlok_apothecary' },
        { id: 'zahra', name: 'Caravan Master Zahra', faction: 'syndicate', x: OASIS.x - 8, z: OASIS.z - 6, indoor: true, yaw: 0, dialogue: 'zahra', vendor: 'zahra_bazaar' },
        { id: 'eryndor', name: 'Scholar Eryndor', faction: 'aegis', x: DRAGON_CAMP.x, z: DRAGON_CAMP.z + 5, yaw: 0, dialogue: 'eryndor' }
    ];

    const INTERACTS = [
        { id: 'c_town_stash', kind: 'stash', name: 'Personal Stash', x: TOWN.x - 22, z: TOWN.z + 4 },
        { id: 'w_town_bench', kind: 'workbench', name: 'Field Repair Bench', x: TOWN.x + 8, z: TOWN.z + 4 },
        { id: 'b_town_bounties', kind: 'bounty_board', name: 'Freestead Notice Board', x: TOWN.x - 4, z: TOWN.z - 4 },
        { id: 'c_pump_office', kind: 'container', name: 'Foreman Locker', x: PUMP.x + 2.5, z: PUMP.z - 2.5, indoor: true, loot: 'cache', grant: 'pressure_schematic' },
        { id: 't_junction', kind: 'terminal', name: 'Surface Junction', x: PUMP.x + 8, z: PUMP.z + 5.6 },
        { id: 'h_culvert', kind: 'hatch', name: 'Sublevel Hatch', x: PUMP.x - 8, z: PUMP.z + 5, dngId: 'culvert_sublevel', dngName: 'Culvert Sublevel', to: { x: INT.x, y: 0.1, z: INT.z - 3, yaw: Math.PI } },
        { id: 'x_culvert', kind: 'exit', name: 'Ladder to Surface', x: INT.x, z: INT.z - 4.5, int: true, to: { x: PUMP.x - 8, z: PUMP.z + 8.5, yaw: 0 } },
        { id: 'v_bypass', kind: 'valve', name: 'Bypass Valve', x: INT.x + 9.5, z: INT.z + 20, int: true },
        { id: 'c_culvert_cache', kind: 'container', name: 'Flooded Crate', x: INT.x - 10, z: INT.z + 44, int: true, loot: 'locked' },
        { id: 'c_overpass_box', kind: 'container', name: "Vasko's Strongbox", x: OVER.x + 2, z: OVER.z + 2.4, loot: 'locked', locked: true, y: overY + 5.85, grant: 'vasko_crest' },
        { id: 'c_convoy', kind: 'container', name: 'Aegis Cargo Case', x: CONVOY.x - 1, z: CONVOY.z - 2, loot: 'cache', grant: 'convoy_manifest', grant2: 'relay_fuse' },
        { id: 'm_relay', kind: 'mast', name: 'Relay Mast Panel', x: RELAY.x - 2.4, z: RELAY.z },
        { id: 'c_relay', kind: 'container', name: 'Tool Chest', x: RELAY.x + 5, z: RELAY.z + 3, indoor: true, loot: 'cache' },
        { id: 'c_mags_safe', kind: 'container', name: "Mags' Safe", x: YARD.x - 13.5, z: YARD.z - 10.5, indoor: true, loot: 'locked', locked: true, grant: 'syndicate_ledger', owner: 'syndicate' },
        { id: 's_sac_1', kind: 'sac', name: 'Brood Egg Sac', x: CAVE.x - 3, z: CAVE.z - 3 },
        { id: 's_sac_2', kind: 'sac', name: 'Brood Egg Sac', x: CAVE.x + 3.5, z: CAVE.z - 2 },
        { id: 's_sac_3', kind: 'sac', name: 'Brood Egg Sac', x: CAVE.x, z: CAVE.z + 3 },
        { id: 'c_quarry', kind: 'container', name: 'Survey Crate', x: QUARRY.x + 4, z: QUARRY.z + 3, loot: 'cache', grant: 'quarry_core_sample' },
        { id: 'c_dish', kind: 'container', name: 'Aegis Footlocker', x: -56, z: -236, loot: 'locked', locked: true },
        { id: 'c_nest', kind: 'container', name: 'Half-Sunk Cache', x: NEST.x - 4, z: NEST.z + 6, loot: 'locked', grant: 'mire_toxin_sample' },
        { id: 'c_barge', kind: 'container', name: 'Barge Manifest Locker', x: BARGE.x - 4, z: BARGE.z + 4, loot: 'locked' },
        { id: 'c_bunker_delta', kind: 'container', name: 'Bunker Telemetry Vault', x: BUNKER.x, z: BUNKER.z, indoor: true, loot: 'locked', locked: true, grant: 'aegis_blackbox' },
        { id: 'c_crater_rift', kind: 'container', name: 'Helix Cipher Chest', x: RIFT.x + 4, z: RIFT.z - 4, loot: 'locked', grant: 'helix_cipher' },

        // Settlement Notice Boards, Workbenches & Stashes across Frontier Outposts
        { id: 'b_lodge_board', kind: 'bounty_board', name: 'Pinewoods Notice Board', x: LODGE.x + 2, z: LODGE.z + 4 },
        { id: 'w_lodge_bench', kind: 'workbench', name: 'Ranger Repair Anvil', x: LODGE.x - 2, z: LODGE.z + 4 },
        { id: 'b_chapel_board', kind: 'bounty_board', name: 'Grimhollow Contract Board', x: CHAPEL.x - 6, z: CHAPEL.z + 6 },
        { id: 'b_oasis_board', kind: 'bounty_board', name: 'Dustwind Bounty Board', x: OASIS.x + 2, z: OASIS.z + 5 },
        { id: 'w_oasis_bench', kind: 'workbench', name: 'Caravan Tinker Bench', x: OASIS.x - 3, z: OASIS.z + 5 },
        { id: 'c_oasis_stash', kind: 'stash', name: 'Caravan Vault Stash', x: OASIS.x + 8, z: OASIS.z + 5 },
        { id: 'w_dragon_bench', kind: 'workbench', name: 'Dragonbone Field Forge', x: DRAGON_CAMP.x + 6, z: DRAGON_CAMP.z + 4 }
    ];

    // Add Entrances, Exits & Boss Hoard Chests for Dungeons 2..12
    for (let i = 1; i < DUNGEONS.length; i++) {
        const d = DUNGEONS[i];
        INTERACTS.push(
            { id: 'h_' + d.id, kind: 'dungeon_gate', name: d.name + ' Entrance', dngId: d.id, dngName: d.name, dngLvl: d.lvl, x: d.surf.x, z: d.surf.z, to: { x: d.x, y: 0.15, z: d.z - 2, yaw: 0 } },
            { id: 'x_' + d.id, kind: 'exit', name: 'Exit ' + d.name, x: d.x, z: d.z - 4.5, int: true, to: { x: d.surf.x, z: d.surf.z + 4.5, yaw: 0 } },
            { id: 'c_' + d.id + '_hoard', kind: 'container', name: d.name + ' Hoard Chest', x: d.x, z: d.z + 62, int: true, loot: 'locked', grant: d.grant || undefined },
            { id: 'c_' + d.id + '_side', kind: 'container', name: 'Reliquary Coffer', x: d.x - 11, z: d.z + 32, int: true, loot: 'cache' }
        );
    }

    // 8 Skyrim-Style Standing Stones (each placed on a safe dry pad)
    const STONES_LAYOUT = [
        ['stone_lover',    "The Pilgrim's Stone",  -235, 235],
        ['stone_warrior',  'The Warrior Stone',    -390, 330],
        ['stone_shadow',   'The Shadow Stone',     -410, -45],
        ['stone_steed',    'The Steed Stone',       95,  175],
        ['stone_mage',     'The Ritual Mage Stone', 255, -25],
        ['stone_slayer',   'The Monster Stone',     355, 365],
        ['stone_atronach', 'The Bastion Stone',    -395, -395],
        ['stone_dragon',   'The Dragonwild Stone',  395, -395]
    ];
    for (const [sid, sname, sx, sz] of STONES_LAYOUT) {
        addPad(sx, sz, 10, 10, 6);
        INTERACTS.push({ id: sid, kind: 'standing_stone', stoneId: sid, name: sname, x: sx, z: sz });
    }

    // 24 Harvestable RuneScape / Dragonwilds Resource Nodes & Ancient Lore Tomes
    const RESOURCE_SPOTS = [
        ['n_iron_1', 'resource_node', 'Iron Ore Vein', -155, 175, 'iron_ore', 'mining'],
        ['n_iron_2', 'resource_node', 'Iron Ore Vein', -220, 145, 'iron_ore', 'mining'],
        ['n_iron_3', 'resource_node', 'Iron Ore Vein', -130, -25, 'iron_ore', 'mining'],
        ['n_wood_1', 'resource_node', 'Ancient Elderwood', -400, 395, 'elderwood_log', 'foraging'],
        ['n_wood_2', 'resource_node', 'Ancient Elderwood', -460, 345, 'elderwood_log', 'foraging'],
        ['n_wood_3', 'resource_node', 'Ancient Elderwood', -330, 310, 'elderwood_log', 'foraging'],
        ['n_herb_1', 'resource_node', 'Luminous Mirebloom', 195, 65, 'mirebloom_herb', 'foraging'],
        ['n_herb_2', 'resource_node', 'Luminous Mirebloom', 265, 55, 'mirebloom_herb', 'foraging'],
        ['n_herb_3', 'resource_node', 'Luminous Mirebloom', -240, 235, 'mirebloom_herb', 'foraging'],
        ['n_bone_1', 'resource_node', 'Ossuary Bone Pile', -445, -40, 'cursed_bone', 'foraging'],
        ['n_bone_2', 'resource_node', 'Ossuary Bone Pile', -495, 35, 'cursed_bone', 'foraging'],
        ['n_mith_1', 'resource_node', 'Mithril Ore Seam', -215, -90, 'mithril_ore', 'mining'],
        ['n_mith_2', 'resource_node', 'Mithril Ore Seam', -95, -195, 'mithril_ore', 'mining'],
        ['n_mith_3', 'resource_node', 'Mithril Ore Seam', -380, -350, 'mithril_ore', 'mining'],
        ['n_sun_1',  'resource_node', 'Crimson Sunleaf', 350, 430, 'sunleaf_herb', 'foraging'],
        ['n_sun_2',  'resource_node', 'Crimson Sunleaf', 435, 365, 'sunleaf_herb', 'foraging'],
        ['n_rune_1', 'resource_node', 'Runic Ley-Crystal', 165, -145, 'runic_shard', 'arcana'],
        ['n_rune_2', 'resource_node', 'Runic Ley-Crystal', 455, -95, 'runic_shard', 'arcana'],
        ['n_rune_3', 'resource_node', 'Runic Ley-Crystal', -420, -470, 'runic_shard', 'arcana'],
        ['n_star_1', 'resource_node', 'Star-Metal Meteorite', 405, -425, 'starmetal_ore', 'mining'],
        ['n_star_2', 'resource_node', 'Star-Metal Meteorite', 455, -430, 'starmetal_ore', 'mining'],
        ['l_tome_1', 'lore_tome', 'Chronicle I: Fall of Haven', TOWN.x + 2, TOWN.z - 2],
        ['l_tome_2', 'lore_tome', 'Chronicle II: Grimhollow Pact', CHAPEL.x + 5, CHAPEL.z + 5],
        ['l_tome_3', 'lore_tome', 'Chronicle III: The Dragonwilds', DRAGON_CAMP.x - 5, DRAGON_CAMP.z + 4]
    ];
    for (const [nid, nkind, nname, nx, nz, yieldId, skillId] of RESOURCE_SPOTS) {
        addPad(nx, nz, 5, 5, 4, 1.0);
        INTERACTS.push({ id: nid, kind: nkind, name: nname, x: nx, z: nz, yieldItem: yieldId, skill: skillId });
    }

    /* ================================================================ 12 TRANSIT PYLONS (1 per Region) */
    const PYLONS = [
        { id: 'py_freestead',  name: 'Freestead Pylon',       x: TOWN.x + 22,       z: TOWN.z + 22,       region: 'haven_basin', start: true },
        { id: 'py_relay',      name: 'Relay Ridge Pylon',     x: RELAY.x + 10,      z: RELAY.z - 8,       region: 'haven_basin' },
        { id: 'py_whisper',    name: 'Whispering Lodge Pylon',x: LODGE.x + 16,      z: LODGE.z + 12,      region: 'whispering_woods' },
        { id: 'py_yard',       name: 'Rail Yard Pylon',       x: YARD.x + 22,       z: YARD.z - 14,       region: 'rust_sprawl' },
        { id: 'py_grimhollow', name: 'Grimhollow Pylon',      x: CHAPEL.x + 14,     z: CHAPEL.z + 10,     region: 'barrow_moor' },
        { id: 'py_mire',       name: 'Mire Causeway Pylon',   x: 186,               z: 54,                region: 'mire_delta' },
        { id: 'py_quarry',     name: 'Quarry Pylon',          x: QCAMP.x + 12,      z: QCAMP.z - 10,      region: 'ash_quarry' },
        { id: 'py_oasis',      name: 'Dustwind Oasis Pylon',  x: OASIS.x + 16,      z: OASIS.z + 12,      region: 'sunscorched_badlands' },
        { id: 'py_coast',      name: 'Lighthouse Pylon',      x: LIGHTHOUSE.x - 14, z: LIGHTHOUSE.z + 10, region: 'sunken_coast' },
        { id: 'py_check',      name: 'Checkpoint K-4 Pylon',  x: CHECK.x + 14,      z: CHECK.z + 10,      region: 'alpine_array' },
        { id: 'py_frostspire', name: 'Frostspire Pylon',      x: FROSTSPIRE.x + 22, z: FROSTSPIRE.z + 18, region: 'frostfang_peaks' },
        { id: 'py_dragonwild', name: 'Dragonbone Pylon',      x: DRAGON_CAMP.x - 14,z: DRAGON_CAMP.z + 10,region: 'obsidian_dragonwilds' }
    ];
    for (const p of PYLONS) addPad(p.x, p.z, 6, 6, 5, 1.0);

    const LANDMARKS = [
        { id: 'mast_alpha',    name: 'Watchtower Mast Alpha',     x: -160, z: 160,  h: 42, color: 0xf5a623 },
        { id: 'goliath',       name: 'Goliath Straddle Crane',    x: 90,   z: 232,  h: 38, color: 0xfacc15 },
        { id: 'cooling_stack', name: 'Sunken Cooling Stack',      x: 228,  z: 4,    h: 45, color: 0x4ade80 },
        { id: 'excavator',     name: 'Bucket-Wheel Excavator',    x: QUARRY.x - 4, z: QUARRY.z - 6, h: 36, color: 0xf97316 },
        { id: 'dishes',        name: 'Deep-Space Dish Array',     x: -60,  z: -250, h: 32, color: 0xe2e8f0 },
        { id: 'obelisk',       name: 'Meridian Containment Dome', x: CORE.x, z: CORE.z, h: 58, color: 0xa855f7 },
        // 6 New Outer Frontier Skyline Landmarks
        { id: 'elder_tree',    name: 'Great Elderwood Spire',     x: -485, z: 390,  h: 46, color: 0x22c55e },
        { id: 'barrow_spire',  name: 'Grimhollow Necro-Spire',    x: -495, z: -30,  h: 44, color: 0xc084fc },
        { id: 'sun_pyramid',   name: 'Sunfang Solar Obelisk',     x: 485,  z: 464,  h: 42, color: 0xfbbf24 },
        { id: 'coast_beacon',  name: 'Abyssal Sea-Beacon',        x: 470,  z: -51,  h: 40, color: 0x38bdf8 },
        { id: 'frost_citadel', name: 'Frostspire High Keep',      x: -455, z: -453, h: 50, color: 0x93c5fd },
        { id: 'dragon_monolith',name: 'Dragonwild Obsidian Spire',x: 485,  z: -491, h: 64, color: 0xef4444 }
    ];
    for (const l of LANDMARKS) if (l.id !== 'obelisk' && l.id !== 'excavator') addPad(l.x, l.z, 12, 12, 6);

    function isWet(x, z) { return Math.hypot(x - 215, z - 25) < 135 || Math.hypot(x - 510, z + 55) < 120; }
    function colorAt(x, z, h, slope) {
        let c = [0, 0, 0], wsum = 0;
        for (const r of REGIONS) {
            const w = 1 / Math.pow(Math.max(0.05, Math.hypot(x - r.x, z - r.z) / r.r), 6);
            c[0] += r.col[0] * w; c[1] += r.col[1] * w; c[2] += r.col[2] * w; wsum += w;
        }
        c = c.map((v) => v / wsum);
        const n = N.fbm(x / 18, z / 18, 51, 3) * 0.07;
        c = c.map((v) => v + n);
        if (slope > 0.8) { const k = smooth(0.8, 1.4, slope); c = c.map((v, i) => lerp(v, [0.4, 0.39, 0.37][i], k)); }
        if (h > 24) { const k = smooth(24, 38, h); c = c.map((v, i) => lerp(v, [0.92, 0.95, 0.98][i], k)); }
        if (h < WATER + 0.8 && isWet(x, z)) { const k = smooth(WATER + 0.8, WATER - 0.3, h); c = c.map((v, i) => lerp(v, [0.20, 0.28, 0.24][i], k)); }
        const road = roadInfo(x, z);
        if (road && road.d < road.road.w * 0.5) {
            const tint = road.road.mat === 'asphalt' ? [0.24, 0.25, 0.26] : [0.45, 0.38, 0.29];
            c = c.map((v, i) => lerp(v, tint[i], smooth(road.road.w * 0.5, road.road.w * 0.5 - 1.2, road.d)));
        }
        if (railDist(x, z) < 2) c = c.map((v, i) => lerp(v, [0.3, 0.27, 0.25][i], 0.75));
        const dc = Math.hypot(x - CORE.x, z - CORE.z);
        if (dc < 50) c = c.map((v, i) => lerp(v, [0.2, 0.16, 0.26][i], smooth(50, 20, dc)));
        const dd = Math.hypot(x - DRAGON_CRATER.x, z - DRAGON_CRATER.z);
        if (dd < 90) c = c.map((v, i) => lerp(v, [0.16, 0.10, 0.12][i], smooth(90, 25, dd)));
        return c.map((v) => Math.max(0, Math.min(1, v)));
    }

    const terrainDef = () => ({
        ...BOUNDS, res: 2, chunk: 160, batchChunk: 320, navCell: 4, waterLevel: WATER,
        height: (x, z) => rawFinal(x, z),
        color: (x, z, h, s) => colorAt(x, z, h, s).map((v) => Math.pow(Math.max(0, v), 2.2)),
        carves: []
    });

    const map = {
        id: 'meridian', name: 'The Meridian Expanse', mode: 'owrpg', large: true,
        playerSpawn: { x: TOWN.x + 20, y: 0, z: TOWN.z + 20, yaw: Math.PI * 0.25 },
        terrain: terrainDef,
        boxes, ramps, waypoints: [],
        populate: (world, scene) => BO.OWRPGWorldArt && BO.OWRPGWorldArt.populate(world, scene),
        atmosphere: {
            skyTop: 0x3f5874, skyBottom: 0xa4a998, fogColor: 0x9a9f92, fogDensity: 0.0034,
            hemiSky: 0xbfd0e2, hemiGround: 0x4a4f3a, hemiIntensity: 1.05,
            sunColor: 0xffe2b8, sunIntensity: 1.5, sunPos: [-70, 95, 50]
        }
    };
    BO.MapsData.MAPS.meridian = map;

    BO.OWRPGWorldData = {
        BOUNDS, WATER, REGIONS, ROADS, RAIL, POIS, NPCS, INTERACTS, PYLONS, LANDMARKS, DUNGEONS, INTERIOR: INT,
        TOWN, regionAt, rawFinal, heightAt: rawFinal, isWet, segDist, roadInfo, railDist,
        isInterior(x, z) { return x > 1350 && z > 1350; }
    };
})(window.BO);
;

/* --- src/data/OWRPGDialogueData.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Dialogue Trees 2.0 (13 Full NPC Trees)
   Preserves 100% of _qa_owrpg.html paths (kessler, mags, etc.) while adding
   Captain Halvar, Grave-Warden Orlok, Caravan Master Zahra, and Scholar Eryndor
   with zero dead ends and full OWRPGValidator compliance.
============================================================================ */
(function (BO) {
    'use strict';

    const q = (ctx, id) => ctx.quest(id);
    const active = (ctx, id) => q(ctx, id).state === 'active';

    const TREES = {
        /* ------------------------------------------------------------ KESSLER */
        kessler: {
            name: 'Warden Kessler',
            entry: (ctx) => {
                if (ctx.flags.kessler_betrayed) return 'hostile_bark';
                const qa = q(ctx, 'q_dry_artery');
                if (qa.state === 'inactive' && (ctx.flags.culvert_valve_pulled || ctx.flags.junction_rerouted || ctx.flags.mags_shutoff)) return 'prefixed';
                if (qa.state === 'inactive') return 'intro_1';
                if (qa.state === 'active' && qa.stage === 'report') return 'turnin';
                return 'hub';
            },
            nodes: {
                intro_1: {
                    text: "Pump Three went dead at dawn. The Syndicate swears they didn't cap the line, which means someone planted a bypass down in the culvert. Haven has four days of water in the cisterns. Maybe five if we stop washing.",
                    choices: [
                        { text: '[PRC 7] (Notice the clay on his boots) "You already went down there. What chased you out?"', req: { attr: ['PRC', 7] }, next: 'admit_brood', fx: { xp: 45, setFlag: 'kessler_read' } },
                        { text: '[TCH 6] "Give me the pressure schematics. I can reroute from the surface junction."', req: { attr: ['TCH', 6] }, next: 'schematic_grant', fx: { grantItem: 'pressure_schematic', xp: 45, startQuest: 'q_dry_artery' } },
                        { text: '"How much is working water worth to Haven?"', next: 'negotiate_pay' },
                        { text: '"I\'ll check the culvert."', next: 'accept_std', fx: { startQuest: 'q_dry_artery' } }
                    ]
                },
                admit_brood: {
                    text: "...Brood. A nest of them in the lower tunnel, and something big under the water that the little ones feed. I lost Tamsin down there and I'm not sending another ranger. If you go, take the keycard and don't be a hero near the flooded chamber.",
                    choices: [{ text: '"I\'ll handle it." (Take the keycard)', next: 'accept_std', fx: { grantItem: 'culvert_keycard', startQuest: 'q_dry_artery' } }]
                },
                schematic_grant: {
                    text: "You can read these? Then you're worth more than half my rangers. The junction box is on the east face of the pumphouse. Reroute the main line and the bypass starves. Nobody has to go below.",
                    choices: [{ text: '"Consider it done."', next: 'END', fx: { grantItem: 'culvert_keycard' } }]
                },
                negotiate_pay: {
                    text: 'Haven pays in credits, beds and a name people remember. Two hundred if the water runs by sundown. And if you find out who planted that bypass, I want to know.',
                    choices: [
                        { text: '[PRS 6] "Make it two-fifty. You need this more than I do."', req: { attr: ['PRS', 6] }, next: 'accept_std', fx: { setFlag: 'kessler_bonus', startQuest: 'q_dry_artery', grantItem: 'culvert_keycard', xp: 30 } },
                        { text: '"Deal."', next: 'accept_std', fx: { startQuest: 'q_dry_artery', grantItem: 'culvert_keycard' } }
                    ]
                },
                accept_std: {
                    text: "The pumphouse is east of the gate. Follow the dirt road toward the overpass and look for the concrete block with the pipes. Watch for raiders on the way. They've been bold since the rains.",
                    choices: [{ text: '(Leave)', next: 'END' }]
                },
                prefixed: {
                    text: "The cistern gauges jumped an hour ago. Folks are dancing in the wash-house. Rangers say a drifter went into the culvert alone. That was you, wasn't it? Haven owes you before I even had the chance to ask.",
                    choices: [{ text: '"Just passing through. The water seemed important."', next: 'turnin', fx: { startQuest: 'q_dry_artery', stage: ['q_dry_artery', 'report'] } }]
                },
                turnin: {
                    text: 'Well? Is Pump Three flowing?',
                    choices: [
                        { text: '"The bypass is pulled. The thing guarding it is dead." (Hand over the valve)', req: { flag: 'culvert_valve_pulled' }, next: 'thanks', fx: { takeItem: 'bypass_valve', complete: ['q_dry_artery', 'combat'] } },
                        { text: '"I rerouted the main line at the junction. The bypass is starved."', req: { flag: 'junction_rerouted' }, next: 'thanks', fx: { complete: ['q_dry_artery', 'reroute'] } },
                        { text: '"The Syndicate planted it. Here are their books." (Give the ledger)', req: { item: 'syndicate_ledger' }, next: 'ledger', fx: { takeItem: 'syndicate_ledger', complete: ['q_dry_artery', 'exposed'] } },
                        { text: '"I talked Mags Orrin into shutting it off herself."', req: { flag: 'mags_shutoff' }, next: 'thanks_dip', fx: { complete: ['q_dry_artery', 'diplomacy'] } },
                        { text: '"Not yet."', next: 'END' }
                    ]
                },
                thanks: {
                    text: "Then Haven drinks tonight. Here: what I promised, and a Relay Cell from the stores. Those pylons the old world left will carry you across all twelve frontier regions if you wake them. Ask me about the signal when ready.",
                    choices: [{ text: '"Tell me about the signal."', next: 'signal' }, { text: '(Leave)', next: 'END' }]
                },
                thanks_dip: {
                    text: "You walked into the rail yard and talked? Either you're a fool or the best negotiator in the Basin. The water's back, and nobody died for it. Haven won't forget. Ask me about the signal when you have a moment.",
                    choices: [{ text: '"Tell me about the signal."', next: 'signal' }, { text: '(Leave)', next: 'END' }]
                },
                ledger: {
                    text: "Payments to 'culvert labour', signed by Orrin's own clerk. They wanted us thirsty enough to buy water by the barrel. The council will hear about this, and so will every trader on the rail. You've done the Basin a real service.",
                    choices: [{ text: '"Tell me about the signal."', next: 'signal' }, { text: '(Leave)', next: 'END' }]
                },
                signal: {
                    text: "Since the rains, Mast Alpha has been picking up a carrier wave out of the Meridian crater — and beyond it, smoke rising from the Obsidian Dragonwilds. Check with Aegis at K-4 or march into the frontier yourself.",
                    choices: [
                        { text: '"I\'ll look into it."', req: { quest: ['q_meridian_signal', 'inactive'] }, next: 'END', fx: { startQuest: 'q_meridian_signal' } },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                hub: {
                    text: (ctx) => active(ctx, 'q_dry_artery') ? 'The cisterns are dropping. What do you need?' : 'Ranger. Twelve territories stretch beyond our palisade — Pinewoods west, Badlands east, Frostfang north, and the Dragonwilds beyond the crater. What is it?',
                    choices: [
                        { text: '"Where\'s the pumphouse again?"', req: { quest: ['q_dry_artery', 'active'] }, next: 'accept_std' },
                        { text: '"Any work for a gun?" (Raider bounty)', req: { quest: ['q_overpass_bounty', 'inactive'] }, next: 'bounty' },
                        { text: '"Vasko is dead."', req: { stage: ['q_overpass_bounty', 'report'] }, next: 'bounty_done', fx: { complete: ['q_overpass_bounty', 'killed'] } },
                        { text: '"What\'s happening in Ash Quarry?"', req: { quest: ['q_quarry_titans', 'inactive'] }, next: 'quarry_offer' },
                        { text: '"The Ash Quarry Colossus is dead."', req: { stage: ['q_quarry_titans', 'report'] }, next: 'quarry_done', fx: { complete: ['q_quarry_titans', 'slain'] } },
                        { text: '"Tell me about the Meridian Sovereign."', req: { quest: ['q_meridian_signal', 'completed'] }, next: 'sovereign_offer' },
                        { text: '"The Meridian Sovereign has fallen."', req: { stage: ['q_sovereign_hunt', 'report'] }, next: 'sovereign_done', fx: { complete: ['q_sovereign_hunt', 'triumph'] } },
                        { text: '"Tell me about the signal."', req: { quest: ['q_dry_artery', 'completed'] }, next: 'signal' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                bounty: {
                    text: "A raider who calls himself the Gutter King has taken the old overpass south of town. Two hundred credits for his head, plus whatever gear he hoards.",
                    choices: [{ text: '"I\'ll take the contract."', next: 'END', fx: { startQuest: 'q_overpass_bounty' } }, { text: '"Not now."', next: 'END' }]
                },
                bounty_done: { text: 'The caravans will be glad to hear it. Clean work — take this Nomad Lever 1887 from our armory.', choices: [{ text: '(Leave)', next: 'END' }] },
                quarry_offer: {
                    text: "Miners out of Ash Quarry say tremors woke something massive inside Excavator Pit — a walking furnace they call the Ash Colossus. Put it down before it reaches the Basin road.",
                    choices: [
                        { text: '"I\'ll hunt it down."', req: { quest: ['q_quarry_titans', 'inactive'] }, next: 'END', fx: { startQuest: 'q_quarry_titans' } },
                        { text: '"Maybe later."', next: 'END' }
                    ]
                },
                quarry_done: { text: 'You brought down a Quarry Colossus? Take this Breaching Hammer and KSG slug gun. You earned them.', choices: [{ text: '(Leave)', next: 'END' }] },
                sovereign_offer: {
                    text: "Scouts report an apex entity nesting inside the Meridian Containment Dome — the Sovereign. If you clear the crater, Torin has an Aegis War Strider chassis ready to imprint to your callsign.",
                    choices: [
                        { text: '"I\'ll end the Sovereign."', req: { quest: ['q_sovereign_hunt', 'inactive'] }, next: 'END', fx: { startQuest: 'q_sovereign_hunt' } },
                        { text: '"I need better gear first."', next: 'END' }
                    ]
                },
                sovereign_done: { text: "The Basin is finally safe from the crater's heart. The War Strider is yours — now seek Scholar Eryndor in the Obsidian Dragonwilds!", choices: [{ text: '(Leave)', next: 'END' }] },
                hostile_bark: { text: 'You sold us to the rail barons. Get out of my sight before the rangers decide what you\'re worth.', choices: [{ text: '(Leave)', next: 'END' }] }
            }
        },

        /* ------------------------------------------------------------ DOTTIE */
        dottie: {
            name: 'Dottie Vail',
            entry: () => 'hub',
            nodes: {
                hub: {
                    text: "Dottie's Supply. If it shoots, heals, or brews into an elixir, I've either got it or I know who stole it. Prices go down for friends of Haven.",
                    choices: [
                        { text: '(Trade)', next: 'END', fx: { vendor: 'freestead_store' } },
                        { text: '"What are Relay Cells and Standing Stones?"', next: 'cells' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                cells: {
                    text: "Relay Cells power Pylon jumps across the 1280m frontier. And keep an eye out for ancient Standing Stones — touch The Pilgrim's Stone northwest of town for a +20% XP blessing while grinding!",
                    choices: [{ text: '"Good to know."', next: 'hub' }]
                }
            }
        },

        /* ------------------------------------------------------------ INES */
        ines: {
            name: 'Medic Ines',
            entry: (ctx) => {
                const s = q(ctx, 'q_shale_nest');
                if (s.state === 'active' && s.stage === 'report') return 'nest_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: 'Sit, if you are bleeding. If you are not bleeding, you are blocking my light.',
                    choices: [
                        { text: '"Patch me up." (Restore health)', next: 'healed', fx: { heal: 9999 } },
                        { text: '"Something has you worried."', req: { quest: ['q_shale_nest', 'inactive'] }, next: 'nest_offer' },
                        { text: '"I want to rethink my training." (Respec perks)', next: 'END', fx: { respec: 1 } },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                healed: { text: 'There. Try to keep the holes on the outside this time.', choices: [{ text: '(Leave)', next: 'END' }] },
                nest_offer: {
                    text: "Three children came in this week with brood fever. All of them had been near the shale cave on the western ridge. Burn the egg sacs, all three, before they hatch.",
                    choices: [
                        { text: '[PRC 6] "Fever spreads from the sacs\' spores, not the bites. Close quarters only, then."', req: { attr: ['PRC', 6] }, next: 'nest_tip', fx: { xp: 30, startQuest: 'q_shale_nest', grantItem: 'medkit' } },
                        { text: '"I\'ll burn them."', next: 'END', fx: { startQuest: 'q_shale_nest' } }
                    ]
                },
                nest_tip: { text: 'Exactly right. Take this injector, and hold your breath when they pop.', choices: [{ text: '(Leave)', next: 'END' }] },
                nest_done: {
                    text: 'The fever broke in all three last night. Thank you.',
                    choices: [{ text: '"Glad they\'re safe."', next: 'END', fx: { complete: ['q_shale_nest', 'burned'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ SOLA */
        sola: {
            name: 'Engineer Sola',
            entry: (ctx) => {
                const s = q(ctx, 'q_relay_light');
                if (s.state === 'active' && s.stage === 'report') return 'relay_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Mind the solder. If you're here to tell me the relay is still dark, I know. I can see it from the roof.",
                    choices: [
                        { text: '"What\'s wrong with the relay?"', req: { quest: ['q_relay_light', 'inactive'] }, next: 'relay_offer' },
                        { text: '"Where would I find a fuse?"', req: { quest: ['q_relay_light', 'active'] }, next: 'fuse_hint' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                relay_offer: {
                    text: "The Abandoned Relay on the western ridge blew its fuse in the storm. Relit, it powers the pylon beside it. Aegis convoys carried spare fuses — one went down north of here.",
                    choices: [{ text: '"I\'ll get the relay running."', next: 'END', fx: { startQuest: 'q_relay_light' } }]
                },
                fuse_hint: { text: 'Crashed convoy, north of town by the crossroads. Or jury-rig the panel with TCH 5.', choices: [{ text: '(Leave)', next: 'END' }] },
                relay_done: {
                    text: "I heard the outer farms on the band an hour ago! You've earned this, and the pylon out there is live now.",
                    choices: [{ text: '"Happy to help."', next: 'END', fx: { complete: ['q_relay_light', 'lit'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ TORIN */
        torin: {
            name: 'Quartermaster Torin',
            entry: (ctx) => {
                if (active(ctx, 'q_scrap_wheels') && q(ctx, 'q_scrap_wheels').stage === 'report') return 'wheels_done';
                if (active(ctx, 'q_workbench_trials') && q(ctx, 'q_workbench_trials').stage === 'report') return 'trials_done';
                if (active(ctx, 'q_sunken_barge') && q(ctx, 'q_sunken_barge').stage === 'report') return 'barge_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Grease, steel, and spare pistons — welcome to the Freestead Forge. Keep your guns maintained on the repair bench and let me know if you want wheels for the big frontier.",
                    choices: [
                        { text: '(Browse Forge, Tools & Mount Keys)', next: 'END', fx: { vendor: 'torin_bench' } },
                        { text: '"Can you build me a Scrap Scout Bike?"', req: { quest: ['q_scrap_wheels', 'inactive'] }, next: 'wheels_offer' },
                        { text: '"Got any field hardware to test?"', req: { quest: ['q_workbench_trials', 'inactive'] }, next: 'trials_offer' },
                        { text: '"Heard anything about salvage in Mire Delta?"', req: { quest: ['q_sunken_barge', 'inactive'] }, next: 'barge_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                wheels_offer: {
                    text: "I've got a half-built Scout Bike frame sitting by the palisade. Bring me Scrap Metal or scout the Crashed Convoy north of town for spare coils and I'll register it to you ([T] to mount).",
                    choices: [{ text: '"Consider it done."', next: 'END', fx: { startQuest: 'q_scrap_wheels' } }]
                },
                wheels_done: {
                    text: "Solid parts! Here are the ignition keys to your Scrap Scout Bike, plus a Field Repair Kit. Press [T] outside town to ride and [Shift] to boost.",
                    choices: [{ text: '"Time to ride."', next: 'END', fx: { complete: ['q_scrap_wheels', 'built'] } }]
                },
                trials_offer: {
                    text: "Raiders took over Goliath Crane down in Rust Sprawl. Go knock them off the tracks and I'll hand over a Scrap Flamer and a Warden SOPMOD M4.",
                    choices: [{ text: '"I\'ll test your hardware on them."', next: 'END', fx: { startQuest: 'q_workbench_trials' } }]
                },
                trials_done: {
                    text: "Clean field test! That Scrap Flamer and SOPMOD M4 are yours.",
                    choices: [{ text: '"Appreciate it."', next: 'END', fx: { complete: ['q_workbench_trials', 'done'] } }]
                },
                barge_offer: {
                    text: "A supply barge ran aground at the edge of Mire Delta. Check its hull for surviving plate gear and report back.",
                    choices: [{ text: '"I\'ll check the barge."', next: 'END', fx: { startQuest: 'q_sunken_barge' } }]
                },
                barge_done: {
                    text: "You made it out of the Mire alive! Take this Ironclad Siege Rig and Warden Trail Boots.",
                    choices: [{ text: '"Thanks, Torin."', next: 'END', fx: { complete: ['q_sunken_barge', 'salvaged'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ MAGS */
        mags: {
            name: 'Mags Orrin',
            entry: (ctx) => {
                if (ctx.flags.mags_hostile) return 'hostile';
                if (active(ctx, 'q_rust_smugglers') && q(ctx, 'q_rust_smugglers').stage === 'report') return 'smugglers_done';
                if (active(ctx, 'q_foundry_delve') && q(ctx, 'q_foundry_delve').stage === 'report') return 'foundry_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Welcome to the Ironclad yard. Everything here is for sale, including the truth if you can afford it. What do you want?",
                    choices: [
                        { text: '(Trade)', next: 'END', fx: { vendor: 'syndicate_fence' } },
                        { text: '"Somebody bypassed Haven\'s Pump Three."', req: { quest: ['q_dry_artery', 'active'], notFlag: 'mags_talked' }, next: 'pump', fx: { setFlag: 'mags_talked' } },
                        { text: '"About Pump Three..."', req: { quest: ['q_dry_artery', 'active'], flag: 'mags_talked' }, next: 'pump' },
                        { text: '"Need help clearing the Goliath Crane tracks?"', req: { quest: ['q_rust_smugglers', 'inactive'] }, next: 'smugglers_offer' },
                        { text: '"What happened at the Smuggler Foundry?"', req: { quest: ['q_foundry_delve', 'inactive'] }, next: 'foundry_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                pump: {
                    text: "Bypassed? Tragic. If Haven ever needs water I'll sell it by the barrel, at a fair rate. ...You don't look convinced. Fine. Say what you came to say.",
                    choices: [
                        { text: '[PRS 7] "Once Haven finds out, every caravan on the rail will boycott you. Shut it off and I\'ll say it was a fault."', req: { attr: ['PRS', 7] }, next: 'shutoff', fx: { setFlag: 'mags_shutoff', stage: ['q_dry_artery', 'report'], xp: 80 } },
                        { text: '[BRW 8] (Lean over her desk) "Shut it off. Now."', req: { attr: ['BRW', 8] }, next: 'shutoff_threat', fx: { setFlag: 'mags_shutoff', stage: ['q_dry_artery', 'report'], rep: { syndicate: -100 }, xp: 60 } },
                        { text: '[Syndicate Trusted] "We\'re on the same side. Turn it off as a favour to me."', req: { rep: ['syndicate', 250] }, next: 'shutoff', fx: { setFlag: 'mags_shutoff', stage: ['q_dry_artery', 'report'] } },
                        { text: '"What\'s it worth to you if Haven stays thirsty?"', next: 'deal' },
                        { text: '"Never mind."', next: 'END' }
                    ]
                },
                shutoff: { text: "...Fine. A 'fault.' I'll send a runner to close the line. You're wasted on that farm town, you know. Come see me when you want real money.", choices: [{ text: '(Leave)', next: 'END' }] },
                shutoff_threat: { text: 'Easy! Easy. It\'s off. Get your hands off my ledgers. And don\'t come back here unarmed.', choices: [{ text: '(Leave)', next: 'END' }] },
                deal: {
                    text: "Smart. Tell Kessler the culvert's a lost cause and the brood own it. Haven buys from me for a season, and you get three hundred credits plus a friend in the Syndicate.",
                    choices: [
                        { text: '"Deal." (Betray Haven)', next: 'deal_done', fx: { setFlag: 'kessler_betrayed', complete: ['q_dry_artery', 'betrayal'] } },
                        { text: '"No."', next: 'END' }
                    ]
                },
                deal_done: { text: "Pleasure. Stay away from Haven for a while. Kessler has a long memory and a short temper.", choices: [{ text: '(Leave)', next: 'END' }] },
                smugglers_offer: {
                    text: "Squatters and rogue deadeyes camped under Goliath Crane east of here. Clear them off my rail spur and I'll gift you a Nomad Hoverbike.",
                    choices: [{ text: '"Deal. I\'ll clear Goliath Crane."', next: 'END', fx: { startQuest: 'q_rust_smugglers' } }]
                },
                smugglers_done: {
                    text: "Tracks are clear and the rail rolls again. Here's your Nomad Hoverbike key.",
                    choices: [
                        { text: '"Pleasure doing business."', next: 'END', fx: { complete: ['q_rust_smugglers', 'enforced'] } },
                        { text: '[PRS 6] "Keep the peace with Haven caravans too."', req: { attr: ['PRS', 6] }, next: 'END', fx: { complete: ['q_rust_smugglers', 'haggled'] } }
                    ]
                },
                foundry_offer: {
                    text: "Foreman Kragg went rogue and locked himself inside the Ironclad Foundry Depths northeast of the yard. Go down there and settle his account.",
                    choices: [{ text: '"I\'ll clear the Foundry Depths."', next: 'END', fx: { startQuest: 'q_foundry_delve' } }, { text: '"Later."', next: 'END' }]
                },
                foundry_done: {
                    text: "Kragg's torches are cold and the smelters are ours again! Take this Ironclad Blast Helm and Thermal Cutter.",
                    choices: [{ text: '"Pleasure."', next: 'END', fx: { complete: ['q_foundry_delve', 'reclaimed'] } }]
                },
                hostile: { text: 'You have some nerve showing your face here.', choices: [{ text: '(Leave)', next: 'END' }] }
            }
        },

        /* ------------------------------------------------------------ VANCE */
        vance: {
            name: 'Lt. Imre Vance',
            entry: (ctx) => {
                if (active(ctx, 'q_meridian_signal') && q(ctx, 'q_meridian_signal').stage === 'reach_array') return 'signal';
                if (active(ctx, 'q_alpine_rogue') && q(ctx, 'q_alpine_rogue').stage === 'report') return 'rogue_done';
                if (active(ctx, 'q_blacklab_delve') && q(ctx, 'q_blacklab_delve').stage === 'report') return 'blacklab_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: 'Checkpoint K-4. Civilians turn around. You are not a civilian, I take it. State your business.',
                    choices: [
                        { text: '(Requisition gear)', next: 'END', fx: { vendor: 'aegis_quarter' } },
                        { text: '"I have your convoy manifest." (Give to Aegis)', req: { item: 'convoy_manifest' }, next: 'manifest', fx: { takeItem: 'convoy_manifest', complete: ['q_convoy_manifest', 'aegis'] } },
                        { text: '"What is happening up at Dish Ridge?"', req: { quest: ['q_alpine_rogue', 'inactive'] }, next: 'rogue_offer' },
                        { text: '"Tell me about Black-Site Sublevel 9."', req: { quest: ['q_blacklab_delve', 'inactive'] }, next: 'blacklab_offer' },
                        { text: '"I have a Helix Harmonic Cipher if Aegis wants to copy it."', req: { item: 'helix_cipher', quest: ['q_helix_cipher', 'active'] }, next: 'cipher_aegis', fx: { takeItem: 'helix_cipher', complete: ['q_helix_cipher', 'studied'] } },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                manifest: { text: "The Kestrel convoy's manifest. Our cargo is still unaccounted for, but now we know where to look. The Directorate thanks you.", choices: [{ text: '(Leave)', next: 'END' }] },
                signal: {
                    text: "The carrier wave? We've logged it for six weeks. It's coming from inside the Containment Dome. The Helix say it's the Meridian waking up.",
                    choices: [
                        { text: '[TCH 7] "Let me see the logs. That\'s a handshake protocol, not a warning."', req: { attr: ['TCH', 7] }, next: 'logs', fx: { xp: 80, setFlag: 'signal_handshake', stage: ['q_meridian_signal', 'reach_dome'] } },
                        { text: '"I\'m going to the dome."', next: 'END', fx: { stage: ['q_meridian_signal', 'reach_dome'] } }
                    ]
                },
                logs: { text: "...A handshake. Something in there is waiting for an answer. Go. Report what you see, and for God's sake don't answer it.", choices: [{ text: '(Leave)', next: 'END' }] },
                rogue_offer: {
                    text: "Our automated defense mecha, Unit X-9, went rogue at Deep-Space Dish Ridge. Bring it down and you can commandeer our Armored ATV.",
                    choices: [{ text: '"I\'ll take down Unit X-9."', next: 'END', fx: { startQuest: 'q_alpine_rogue' } }]
                },
                rogue_done: {
                    text: "Outstanding work, operative. Unit X-9 is scrap and the Meridian Armored ATV is cleared for your callsign.",
                    choices: [{ text: '"Thank you, Lieutenant."', next: 'END', fx: { complete: ['q_alpine_rogue', 'destroyed'] } }]
                },
                blacklab_offer: {
                    text: "West of Dish Ridge lies Aegis Black-Site Sublevel 9. Prototype Omega-Zero breached its vault. Descend and terminate it.",
                    choices: [{ text: '"I\'ll enter Sublevel 9."', next: 'END', fx: { startQuest: 'q_blacklab_delve' } }, { text: '"Not yet."', next: 'END' }]
                },
                blacklab_done: {
                    text: "Omega-Zero terminated! Take this Rotary Minigun and Arc-Tech Greaves with the Directorate's highest commendation.",
                    choices: [{ text: '"Dismissed."', next: 'END', fx: { complete: ['q_blacklab_delve', 'terminated'] } }]
                },
                cipher_aegis: {
                    text: "A Helix harmonic decryption key! Our cryptographers will neutralize their dome link. Take this Cryo ACR and Harmonic Coil.",
                    choices: [{ text: '(Leave)', next: 'END' }]
                }
            }
        },

        /* ------------------------------------------------------------ LYRA */
        lyra: {
            name: 'Dr. Lyra Chen',
            entry: (ctx) => {
                if (active(ctx, 'q_mire_plague') && q(ctx, 'q_mire_plague').stage === 'report') return 'mire_done';
                if (active(ctx, 'q_alpine_blackbox') && q(ctx, 'q_alpine_blackbox').stage === 'report') return 'blackbox_done';
                if (active(ctx, 'q_quarry_truce') && q(ctx, 'q_quarry_truce').stage === 'report') return 'truce_done';
                if (active(ctx, 'q_dwarven_mine_delve') && q(ctx, 'q_dwarven_mine_delve').stage === 'report') return 'mine_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Keep your visor sealed — ash and Meridian spores don't mix well. I'm logging anomalous bio-signatures across the Quarry, Mire, and Deep-Vein Mines.",
                    choices: [
                        { text: '(Inspect Field Kit & Cryo Gear)', next: 'END', fx: { vendor: 'lyra_field' } },
                        { text: '"Tell me about the Mire Delta mutation."', req: { quest: ['q_mire_plague', 'inactive'] }, next: 'mire_offer' },
                        { text: '"How can we resolve the Quarry standoff?"', req: { quest: ['q_quarry_truce', 'inactive'] }, next: 'truce_offer' },
                        { text: '"What\'s blocking the Deep-Vein Quarry Mines?"', req: { quest: ['q_dwarven_mine_delve', 'inactive'] }, next: 'mine_offer' },
                        { text: '"Need anything from Bunker Delta?"', req: { quest: ['q_alpine_blackbox', 'inactive'] }, next: 'blackbox_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                mire_offer: {
                    text: "A colossal Brood organism — the Mire Plague Hydra — is saturating the delta with corrosive venom. Put it down at the Cooling Stack Nest and report back.",
                    choices: [{ text: '"I\'ll purge the Hydra."', next: 'END', fx: { startQuest: 'q_mire_plague' } }]
                },
                mire_done: {
                    text: "Bio-readings in the Mire just dropped by 70%! Take this Boreal AN-94 and the Matriarch Venom Heart.",
                    choices: [{ text: '"Glad to help, Doctor."', next: 'END', fx: { complete: ['q_mire_plague', 'slain'] } }]
                },
                truce_offer: {
                    text: "Militia and Syndicate are fighting over Excavator Pit blindly. Pull a Quarry Core Sample from the pit so we have hard mineral data.",
                    choices: [{ text: '"I\'ll grab the core sample."', next: 'END', fx: { startQuest: 'q_quarry_truce' } }]
                },
                truce_done: {
                    text: "This Quarry Core Sample proves the pit is unstable for heavy mining. Who should receive the survey?",
                    choices: [
                        { text: '"Publish it to both Militia and Syndicate to force a truce."', next: 'END', fx: { takeItem: 'quarry_core_sample', complete: ['q_quarry_truce', 'truce'] } },
                        { text: '"Hand it strictly to Aegis Directorate."', next: 'END', fx: { takeItem: 'quarry_core_sample', complete: ['q_quarry_truce', 'aegis_claim'] } }
                    ]
                },
                mine_offer: {
                    text: "Southwest of Excavator Pit lies the Deep-Vein Minehead. A Molten Golem named Ignis has fused with the geothermal vents inside.",
                    choices: [{ text: '"I\'ll shatter Ignis."', next: 'END', fx: { startQuest: 'q_dwarven_mine_delve' } }, { text: '"Later."', next: 'END' }]
                },
                mine_done: {
                    text: "Thermal readings stabilized! Take this Quarry Buzzsaw MG42 and Master Nano-Patch.",
                    choices: [{ text: '"Thanks, Dr. Chen."', next: 'END', fx: { complete: ['q_dwarven_mine_delve', 'shattered'] } }]
                },
                blackbox_offer: {
                    text: "An Aegis flight blackbox is still locked inside Bunker Delta in Alpine Array. Recover it and I'll give you my Arc-Tech Neural Cowl.",
                    choices: [{ text: '"I\'ll recover the blackbox."', next: 'END', fx: { startQuest: 'q_alpine_blackbox' } }]
                },
                blackbox_done: {
                    text: "The telemetry is intact! Here is the Arc-Tech Neural Cowl and Nano-Patch kit as promised.",
                    choices: [{ text: '"Pleasure working with you."', next: 'END', fx: { takeItem: 'aegis_blackbox', complete: ['q_alpine_blackbox', 'decoded'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ CALLA */
        calla: {
            name: 'Sister Calla',
            entry: (ctx) => {
                if (active(ctx, 'q_helix_cipher') && q(ctx, 'q_helix_cipher').stage === 'report') return 'cipher_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: 'The bloom is gentle today. Can you feel it humming in your teeth? The Meridian remembers everything, stranger, and it will remember you too.',
                    choices: [
                        { text: '(Exchange)', next: 'END', fx: { vendor: 'helix_exchange' } },
                        { text: '"I recovered an Aegis convoy manifest." (Give to Helix)', req: { item: 'convoy_manifest' }, next: 'manifest', fx: { takeItem: 'convoy_manifest', complete: ['q_convoy_manifest', 'helix'] } },
                        { text: '"What is the signal from the dome?"', req: { quest: ['q_meridian_signal', 'active'] }, next: 'signal' },
                        { text: '"Do the Helix need help in the Crater Rift?"', req: { quest: ['q_helix_cipher', 'inactive'] }, next: 'cipher_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                manifest: { text: "Aegis hid samples on that convoy, Meridian tissue, living. Now we know where they took them. The bloom will remember this.", choices: [{ text: '(Leave)', next: 'END' }] },
                signal: { text: "It's a lullaby turned the wrong way round. Walk into the crater and listen for yourself. Aegis will tell you to be afraid. Don't be.", choices: [{ text: '(Leave)', next: 'END' }] },
                cipher_offer: {
                    text: "Our Harmonic Cipher fell into the Crater Anomaly Rift east of the dome. Recover it for the Helix and the Void Staff is yours.",
                    choices: [{ text: '"I\'ll retrieve the cipher."', next: 'END', fx: { startQuest: 'q_helix_cipher' } }]
                },
                cipher_done: {
                    text: "The harmonic notes sing clearly again. Take the Void Staff with our blessing.",
                    choices: [{ text: '"May the bloom guide you."', next: 'END', fx: { takeItem: 'helix_cipher', complete: ['q_helix_cipher', 'blessed'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ HALVAR (NEW: Whispering Pinewoods) */
        halvar: {
            name: 'Captain Halvar',
            entry: (ctx) => {
                if (active(ctx, 'q_whisper_poachers') && q(ctx, 'q_whisper_poachers').stage === 'report') return 'poachers_done';
                if (active(ctx, 'q_barrow_orc_delve') && q(ctx, 'q_barrow_orc_delve').stage === 'report') return 'barrow_done';
                if (active(ctx, 'q_elderwood_harvest') && q(ctx, 'q_elderwood_harvest').stage === 'report') return 'wood_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Welcome to Ranger's Watch Lodge in the Whispering Pinewoods. Good hunting, ancient Standing Stones, and deep barrow-dungeons for anyone tough enough to grind them.",
                    choices: [
                        { text: '(Trade Ranger Armory & Elixirs)', next: 'END', fx: { vendor: 'halvar_lodge' } },
                        { text: '"Tell me about the Poacher Palisade."', req: { quest: ['q_whisper_poachers', 'inactive'] }, next: 'poachers_offer' },
                        { text: '"What lurks inside the Root-Barrow dungeon?"', req: { quest: ['q_barrow_orc_delve', 'inactive'] }, next: 'barrow_offer' },
                        { text: '"Need Elderwood timber for the palisade?"', req: { quest: ['q_elderwood_harvest', 'inactive'] }, next: 'wood_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                poachers_offer: {
                    text: "Cutthroats built a palisade west of the lodge, trapping game and ambushing scouts. Rout them and I'll bring the Whispering Lodge Pylon online.",
                    choices: [{ text: '"I\'ll clear the palisade."', next: 'END', fx: { startQuest: 'q_whisper_poachers' } }, { text: '"Not now."', next: 'END' }]
                },
                poachers_done: {
                    text: "The pines are quiet again! The Lodge Pylon is online and this Galil rifle is yours.",
                    choices: [{ text: '"Honored, Captain."', next: 'END', fx: { complete: ['q_whisper_poachers', 'cleared'] } }]
                },
                barrow_offer: {
                    text: "Northwest of here stands the Root-Barrow Mound. Warchief Thornback's orc warband holds the subterranean chambers. Slay him!",
                    choices: [{ text: '"I\'ll delve the Root-Barrow."', next: 'END', fx: { startQuest: 'q_barrow_orc_delve' } }, { text: '"Later."', next: 'END' }]
                },
                barrow_done: {
                    text: "Thornback felled! Take this Warden Vanguard Plate and Grinder's XP Draught.",
                    choices: [{ text: '"Thanks, Halvar."', next: 'END', fx: { complete: ['q_barrow_orc_delve', 'slain'] } }]
                },
                wood_offer: {
                    text: "Harvest Elderwood Timber from any Ancient Elderwood node in the Pinewoods and bring it back to reinforce our watchtower.",
                    choices: [{ text: '"On my way."', next: 'END', fx: { startQuest: 'q_elderwood_harvest' } }]
                },
                wood_done: {
                    text: "Fine heartwood! Keep the extra timber for salvage and take these Warden Trail Boots.",
                    choices: [{ text: '"Glad to help."', next: 'END', fx: { complete: ['q_elderwood_harvest', 'delivered'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ ORLOK (NEW: Barrow-Moor Graveyard) */
        orlok: {
            name: 'Grave-Warden Orlok',
            entry: (ctx) => {
                if (active(ctx, 'q_marrow_crypt_delve') && q(ctx, 'q_marrow_crypt_delve').stage === 'report') return 'crypt_done';
                if (active(ctx, 'q_crimson_vampire_hunt') && q(ctx, 'q_crimson_vampire_hunt').stage === 'report') return 'vamp_done';
                if (active(ctx, 'q_coven_cavern_delve') && q(ctx, 'q_coven_cavern_delve').stage === 'report') return 'coven_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Tread softly in Grimhollow. Barrow-Moor's dead do not sleep long — leave the area or wait ten minutes and the crypts stir anew. Ready for a true Slayer's contract?",
                    choices: [
                        { text: '(Browse Crypt Reliquary & Lichplate)', next: 'END', fx: { vendor: 'orlok_apothecary' } },
                        { text: '"Contract: Sunken Crypt of Marrow (Arch-Lich Malgath)"', req: { quest: ['q_marrow_crypt_delve', 'inactive'] }, next: 'crypt_offer' },
                        { text: '"Contract: Crimson Sanctum Vaults (Lord Vespera)"', req: { quest: ['q_crimson_vampire_hunt', 'inactive'] }, next: 'vamp_offer' },
                        { text: '"Contract: Mire Witch Coven Cavern (Hag-Mother Morwen)"', req: { quest: ['q_coven_cavern_delve', 'inactive'] }, next: 'coven_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                crypt_offer: {
                    text: "South of this chapel lies Marrow Boneyard. Descend into the Sunken Crypt and shatter Arch-Lich Malgath.",
                    choices: [{ text: '"Accept contract."', next: 'END', fx: { startQuest: 'q_marrow_crypt_delve' } }, { text: '"Decline."', next: 'END' }]
                },
                crypt_done: {
                    text: "Malgath's phylactery dims! Grimhollow Pylon is yours, along with the Crown and Cuirass of Grimhollow.",
                    choices: [{ text: '"Collect reward."', next: 'END', fx: { complete: ['q_marrow_crypt_delve', 'banished'] } }]
                },
                vamp_offer: {
                    text: "Northwest stands Crimson Manor. Beneath its courtyard, Lord Vespera commands a coven of Nightlords. End his reign.",
                    choices: [{ text: '"Accept vampire contract."', next: 'END', fx: { startQuest: 'q_crimson_vampire_hunt' } }, { text: '"Not yet."', next: 'END' }]
                },
                vamp_done: {
                    text: "A master Witcher's strike! Take these Grimhollow Sabatons and Malgath's Soul Phylactery.",
                    choices: [{ text: '"Well met, Orlok."', next: 'END', fx: { complete: ['q_crimson_vampire_hunt', 'slain'] } }]
                },
                coven_offer: {
                    text: "Across the basin in Mire Delta, Hag-Mother Morwen brews hex-spores inside the Coven Cavern. Purge her lair.",
                    choices: [{ text: '"I\'ll hunt the Hag-Mother."', next: 'END', fx: { startQuest: 'q_coven_cavern_delve' } }, { text: '"Later."', next: 'END' }]
                },
                coven_done: {
                    text: "The bog breathes easier tonight. Drink deep of these Thunderbolt and Wisdom elixirs.",
                    choices: [{ text: '"Farewell."', next: 'END', fx: { complete: ['q_coven_cavern_delve', 'purged'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ ZAHRA (NEW: Sunscorched Badlands) */
        zahra: {
            name: 'Caravan Master Zahra',
            entry: (ctx) => {
                if (active(ctx, 'q_badlands_mesa') && q(ctx, 'q_badlands_mesa').stage === 'report') return 'mesa_done';
                if (active(ctx, 'q_sunfang_tomb_delve') && q(ctx, 'q_sunfang_tomb_delve').stage === 'report') return 'tomb_done';
                if (active(ctx, 'q_drowned_sanctum_delve') && q(ctx, 'q_drowned_sanctum_delve').stage === 'report') return 'coast_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "Shade, cold water, and high-caliber ordnance — welcome to Dustwind Caravan Oasis! Between the Sunscorched Badlands and Sunken Ruin Coast, fortune favors the bold.",
                    choices: [
                        { text: '(Browse Dustwind Bazaar)', next: 'END', fx: { vendor: 'zahra_bazaar' } },
                        { text: '"Need someone to hit Redrock Outlaw Mesa?"', req: { quest: ['q_badlands_mesa', 'inactive'] }, next: 'mesa_offer' },
                        { text: '"Tell me about Sunfang Pharaoh\'s Tomb."', req: { quest: ['q_sunfang_tomb_delve', 'inactive'] }, next: 'tomb_offer' },
                        { text: '"What\'s sinking ships on the Sunken Ruin Coast?"', req: { quest: ['q_drowned_sanctum_delve', 'inactive'] }, next: 'coast_offer' },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                mesa_offer: {
                    text: "Redrock Desperados hole up on the mesa northwest of the oasis. Break their camp and I'll key you into Dustwind Oasis Pylon.",
                    choices: [{ text: '"Consider them gone."', next: 'END', fx: { startQuest: 'q_badlands_mesa' } }, { text: '"Later."', next: 'END' }]
                },
                mesa_done: {
                    text: "The spice road is open! Dustwind Pylon is online, and this Siege RPG-7 is yours.",
                    choices: [{ text: '"Pleasure, Zahra."', next: 'END', fx: { complete: ['q_badlands_mesa', 'secured'] } }]
                },
                tomb_offer: {
                    text: "Northeast towers the Sunfang Pyramid. Beneath it lies Pharaoh Kharim's sealed tomb. Slay the Sand-King and we split the glory!",
                    choices: [{ text: '"I\'ll raid the Sunfang Tomb."', next: 'END', fx: { startQuest: 'q_sunfang_tomb_delve' } }, { text: '"Not yet."', next: 'END' }]
                },
                tomb_done: {
                    text: "By the desert stars — Kharim defeated! Take this 24K Sovereign Eagle.",
                    choices: [{ text: '"Worth every grain of sand."', next: 'END', fx: { complete: ['q_sunfang_tomb_delve', 'plundered'] } }]
                },
                coast_offer: {
                    text: "South along the Sunken Ruin Coast, Tide-Caller Nereus commands drowned corsairs from the Abyssal Tide Sanctum. Put him under!",
                    choices: [{ text: '"I\'ll delve the Tide Sanctum."', next: 'END', fx: { startQuest: 'q_drowned_sanctum_delve' } }, { text: '"Maybe later."', next: 'END' }]
                },
                coast_done: {
                    text: "The Lighthouse Pylon shines clear across the shoals! Take this Arc-Tech Exo-Vest.",
                    choices: [{ text: '"Safe travels, Zahra."', next: 'END', fx: { complete: ['q_drowned_sanctum_delve', 'calmed'] } }]
                }
            }
        },

        /* ------------------------------------------------------------ ERYNDOR (NEW: Obsidian Dragonwilds) */
        eryndor: {
            name: 'Scholar Eryndor',
            entry: (ctx) => {
                if (active(ctx, 'q_frostspire_delve') && q(ctx, 'q_frostspire_delve').stage === 'report') return 'frost_done';
                if (active(ctx, 'q_dragonwild_vault') && q(ctx, 'q_dragonwild_vault').stage === 'report') return 'dragon_done';
                return 'hub';
            },
            nodes: {
                hub: {
                    text: "You stand at the edge of the Obsidian Dragonwilds, operative. Only hardened veterans who have ground their skills across the twelve realms survive Frostspire and Vaelgor's Vault.",
                    choices: [
                        { text: '"Tell me of Frostspire Castle Keep in the far northwest."', req: { quest: ['q_frostspire_delve', 'inactive'] }, next: 'frost_offer' },
                        { text: '"I am ready to face Vaelgor in the Obsidian Dragonwild Vault."', req: { quest: ['q_dragonwild_vault', 'inactive'] }, next: 'dragon_offer' },
                        { text: '"Heal my wounds before the ascent."', next: 'healed', fx: { heal: 9999 } },
                        { text: '(Leave)', next: 'END' }
                    ]
                },
                healed: { text: 'Runic warmth restores your strength. Stand tall against the wyrms.', choices: [{ text: '(Leave)', next: 'END' }] },
                frost_offer: {
                    text: "Across the northern glaciers stands Frostspire Castle Keep. Descend into its Undercroft and overthrow Frost-King Valdris.",
                    choices: [{ text: '"I will claim Frostspire."', next: 'END', fx: { startQuest: 'q_frostspire_delve' } }, { text: '"I must prepare first."', next: 'END' }]
                },
                frost_done: {
                    text: "Frost-King Valdris has fallen! Frostspire Pylon is awake — take this Intervention .408 and Dragonbone Greathelm.",
                    choices: [{ text: '"Onward to the Dragonwilds."', next: 'END', fx: { complete: ['q_frostspire_delve', 'crowned'] } }]
                },
                dragon_offer: {
                    text: "Southeast at the heart of the caldera lies the Obsidian Vault Threshold. Descend into the Dragonwild Vault and slay Vaelgor the Ashen Wyrm!",
                    choices: [{ text: '"For the Expanse — Vaelgor falls tonight!"', next: 'END', fx: { startQuest: 'q_dragonwild_vault' } }, { text: '"I need more training."', next: 'END' }]
                },
                dragon_done: {
                    text: "Vaelgor the Ashen Wyrm is slain! Songs of your grind from Level 1 to Dragonslayer will echo across Meridian forever. Claim Vaelgor's Staff and Dragonscale Cuirass!",
                    choices: [{ text: '"Glory to the Meridian Expanse!"', next: 'END', fx: { complete: ['q_dragonwild_vault', 'legend'] } }]
                }
            }
        }
    };

    BO.OWRPGDialogueData = { TREES };
})(window.BO);
;

/* --- src/data/OWRPGQuestsData.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Quests 2.0 (40 Quests Across 12 Regions & 12 Dungeons)
   Categories: main · faction · side · contract (Witcher hunts) · delve (Dungeons) · explore (self-starting)
   Preserves 100% of original quest stages/branches for _qa_owrpg.html.
============================================================================ */
(function (BO) {
    'use strict';

    const QUESTS = {
        /* ==================== ORIGINAL 17 QUESTS (PRESERVED) ==================== */
        q_dry_artery: {
            name: 'The Dry Artery', giver: 'kessler', kind: 'main', region: 'haven_basin',
            summary: "Haven's Pump Three is dry. Someone planted a bypass in the culvert.",
            stages: {
                investigate: {
                    text: 'Find out what happened to Pump Three. Pull the bypass in the Culvert Sublevel, reroute at the Surface Junction, or find out who planted it.',
                    marker: 'pump_three',
                    on: { 'flag:culvert_valve_pulled': 'report', 'flag:junction_rerouted': 'report', 'flag:mags_shutoff': 'report', 'item:syndicate_ledger': 'report' }
                },
                report: { text: 'Report back to Warden Kessler in Freestead Town.', marker: 'freestead' }
            },
            branches: {
                combat: { label: 'Pulled the bypass by force', xp: 320, credits: 150, rep: { militia: 200 }, items: ['relay_cell'] },
                reroute: { label: 'Rerouted the main line', xp: 320, credits: 100, rep: { militia: 150 }, items: ['relay_cell'] },
                exposed: { label: 'Exposed the Syndicate', xp: 360, credits: 200, rep: { militia: 300 }, items: ['relay_cell'], flags: ['syndicate_exposed'] },
                diplomacy: { label: 'Talked the Syndicate down', xp: 360, credits: 100, rep: { militia: 150, syndicate: 100 }, items: ['relay_cell'] },
                betrayal: { label: 'Sold Haven out to the Syndicate', xp: 280, credits: 300, rep: { syndicate: 300, militia: -400 }, flags: ['mags_friend'] }
            },
            bonusFlag: { flag: 'kessler_bonus', credits: 50 }
        },
        q_overpass_bounty: {
            name: 'The Gutter King', giver: 'kessler', kind: 'contract', region: 'haven_basin',
            summary: 'A raider warlord has taken the old overpass south of town.',
            stages: {
                hunt: { text: 'Kill Gutter King Vasko at the Raider Overpass.', marker: 'overpass', on: { 'kill:raider_boss': 'report' } },
                report: { text: 'Collect the bounty from Warden Kessler.', marker: 'freestead' }
            },
            branches: { killed: { label: 'Collected the bounty', xp: 280, credits: 200, rep: { militia: 100 }, items: ['w_model1887_twin'] } }
        },
        q_relay_light: {
            name: 'Light on the Ridge', giver: 'sola', kind: 'side', region: 'haven_basin',
            summary: 'Relight the Abandoned Relay to restore comms and power its pylon.',
            stages: {
                fetch: { text: 'Find a relay fuse (the crashed Aegis convoy north of town), or jury-rig the mast panel with TCH 5.', marker: 'convoy', on: { 'item:relay_fuse': 'install', 'flag:relay_lit': 'report' } },
                install: { text: 'Install the fuse at the Abandoned Relay mast panel.', marker: 'relay', on: { 'flag:relay_lit': 'report' } },
                report: { text: 'Tell Engineer Sola the relay is live.', marker: 'freestead' }
            },
            branches: { lit: { label: 'Relit the relay', xp: 200, credits: 80, rep: { militia: 75 }, pylon: 'py_relay' } }
        },
        q_shale_nest: {
            name: 'Brood Fever', giver: 'ines', kind: 'side', region: 'haven_basin',
            summary: 'A brood laying nest in the Shale Cave is spreading fever to Haven children.',
            stages: {
                burn: { text: 'Destroy the three egg sacs in the Shale Cave (west ridge).', marker: 'shale_cave', on: { 'count:sacs_destroyed:3': 'report' } },
                report: { text: 'Tell Medic Ines the nest is gone.', marker: 'freestead' }
            },
            branches: { burned: { label: 'Burned the nest', xp: 240, credits: 60, rep: { militia: 75 }, items: ['medkit', 'medkit', 'elixir_swallow'] } }
        },
        q_convoy_manifest: {
            name: 'Two Buyers', giver: null, kind: 'faction', region: 'haven_basin',
            summary: 'The crashed convoy carried a manifest that Aegis and the Helix both want.',
            autoStart: 'item:convoy_manifest',
            stages: {
                deliver: { text: 'Deliver the convoy manifest to Lt. Vance (Aegis Checkpoint K-4) or Sister Calla (Helix Bloom Shrine). You can only choose one.', marker: 'checkpoint' }
            },
            branches: {
                aegis: { label: 'Gave it to Aegis', xp: 250, credits: 150, rep: { aegis: 250 } },
                helix: { label: 'Gave it to the Helix', xp: 250, credits: 150, rep: { helix: 250 } }
            }
        },
        q_meridian_signal: {
            name: 'Act I: The Carrier Wave', giver: 'kessler', kind: 'main', region: 'alpine_array',
            summary: 'A patterned signal is pulsing out of the Meridian crater.',
            stages: {
                reach_array: { text: 'Ask Lt. Vance at Aegis Checkpoint K-4 about the signal, or go straight to the crater.', marker: 'checkpoint', on: { 'discover:meridian_dome': 'done_dome' } },
                reach_dome: { text: 'Reach the Meridian Containment Dome.', marker: 'meridian_dome', on: { 'discover:meridian_dome': 'done_dome' } },
                done_dome: { text: 'You stood beneath the dome and heard the handshake.', autoComplete: 'heard' }
            },
            branches: { heard: { label: 'Reached the dome', xp: 550, credits: 180, rep: {} } }
        },
        q_scrap_wheels: {
            name: 'Wheels for the Road', giver: 'torin', kind: 'side', region: 'haven_basin',
            summary: 'Quartermaster Torin can assemble a Scrap Scout Bike if you gather scrap and check the Crashed Convoy.',
            stages: {
                gather: { text: 'Collect Scrap Metal or investigate the Crashed Convoy north of Freestead.', marker: 'convoy', on: { 'discover:convoy': 'report', 'item:scrap_metal': 'report' } },
                report: { text: 'Return to Quartermaster Torin in Freestead Town to claim your Scrap Scout Bike.', marker: 'freestead' }
            },
            branches: { built: { label: 'Assembled Scrap Scout Bike', xp: 180, credits: 75, rep: { militia: 60 }, items: ['schematic_scout_bike', 'tool_field_repair'] } }
        },
        q_workbench_trials: {
            name: 'Trial by Fire', giver: 'torin', kind: 'side', region: 'haven_basin',
            summary: 'Test Basin hardware by clearing raiders at Goliath Crane in Rust Sprawl.',
            stages: {
                clear: { text: 'Defeat the raiders guarding Goliath Crane in Rust Sprawl.', marker: 'goliath', on: { 'discover:goliath': 'report', 'kill:raider_pyro': 'report' } },
                report: { text: 'Report to Quartermaster Torin in Freestead.', marker: 'freestead' }
            },
            branches: { done: { label: 'Proved the Basin loadout', xp: 260, credits: 180, rep: { militia: 90 }, items: ['tool_scrap_flamer', 'w_m4a1_warden'] } }
        },
        q_rust_smugglers: {
            name: 'Rail Yard Smugglers', giver: 'mags', kind: 'faction', region: 'rust_sprawl',
            summary: 'Mags wants competition cleared off the Goliath Crane siding — or bought out.',
            stages: {
                handle: { text: 'Clear out the Syndicate Deadeye at Goliath Crane or defeat the Scrap Bruiser.', marker: 'goliath', on: { 'kill:syn_sniper': 'report', 'kill:raider_bruiser': 'report' } },
                report: { text: 'Report back to Mags Orrin at Ironclad Rail Yard.', marker: 'rail_yard' }
            },
            branches: {
                enforced: { label: 'Cleared the tracks by force', xp: 340, credits: 240, rep: { syndicate: 180 }, items: ['schematic_hoverbike', 'w_ak47_rust'] },
                haggled: { label: 'Negotiated rail passage', xp: 320, credits: 300, rep: { syndicate: 120, militia: 60 }, items: ['schematic_hoverbike'] }
            }
        },
        q_mire_plague: {
            name: 'Waters of the Hydra', giver: 'lyra', kind: 'contract', region: 'mire_delta',
            summary: 'Dr. Lyra Chen needs the Mire Plague Hydra slain at Cooling Stack Nest.',
            stages: {
                hunt: { text: 'Slay the Mire Plague Hydra at the Cooling Stack Nest in Mire Delta.', marker: 'mire_nest', on: { 'kill:boss_mire_hydra': 'report' } },
                report: { text: 'Bring word to Dr. Lyra Chen at Quarry Dig Camp.', marker: 'quarry_camp' }
            },
            branches: { slain: { label: 'Purged the Mire Hydra', xp: 480, credits: 320, rep: { aegis: 180, militia: 100 }, items: ['w_an94_cryo', 'relic_brood_heart'] } }
        },
        q_sunken_barge: {
            name: 'Salvage in the Mire', giver: 'torin', kind: 'side', region: 'mire_delta',
            summary: 'An armored cargo barge ran aground in Mire Delta carrying pre-collapse armor crates.',
            stages: {
                locate: { text: 'Reach the Sunken Cargo Barge in Mire Delta and loot its locker.', marker: 'sunken_barge', on: { 'discover:sunken_barge': 'report' } },
                report: { text: 'Return to Quartermaster Torin in Freestead.', marker: 'freestead' }
            },
            branches: { salvaged: { label: 'Recovered barge armor', xp: 300, credits: 200, rep: { militia: 100 }, items: ['rig_juggernaut', 'boots_warden'] } }
        },
        q_quarry_titans: {
            name: 'Core of the Ash Pit', giver: 'kessler', kind: 'contract', region: 'ash_quarry',
            summary: 'A towering Ash Quarry Colossus has awakened in Excavator Pit.',
            stages: {
                slay: { text: 'Defeat the Ash Quarry Colossus in Excavator Pit.', marker: 'quarry_pit', on: { 'kill:boss_quarry_colossus': 'report' } },
                report: { text: 'Report the kill to Warden Kessler in Freestead.', marker: 'freestead' }
            },
            branches: { slain: { label: 'Felled the Ash Colossus', xp: 540, credits: 360, rep: { militia: 200 }, items: ['tool_breach_hammer', 'w_ksg_breach'] } }
        },
        q_quarry_truce: {
            name: 'Iron & Ember', giver: 'lyra', kind: 'faction', region: 'ash_quarry',
            summary: 'Militia and Syndicate are deadlocked at Quarry Dig Camp. Broker a truce or pick a side.',
            stages: {
                resolve: { text: 'Collect a Quarry Core Sample in Excavator Pit.', marker: 'quarry_pit', on: { 'item:quarry_core_sample': 'report' } },
                report: { text: 'Deliver the Quarry Core Sample to Dr. Lyra Chen at Quarry Dig Camp.', marker: 'quarry_camp' }
            },
            branches: {
                truce: { label: 'Brokered Quarry Neutrality', xp: 400, credits: 260, rep: { militia: 140, syndicate: 140 }, items: ['relic_warden'] },
                aegis_claim: { label: 'Handed survey to Aegis', xp: 400, credits: 280, rep: { aegis: 220 }, items: ['w_m249_bastion'] }
            }
        },
        q_alpine_rogue: {
            name: 'Iron on the Ridge', giver: 'vance', kind: 'main', region: 'alpine_array',
            summary: 'A Rogue Mecha Unit X-9 has gone berserk on Deep-Space Dish Ridge.',
            stages: {
                destroy: { text: 'Destroy Rogue Mecha Unit X-9 at Deep-Space Dish Ridge.', marker: 'dish_ridge', on: { 'kill:boss_alpine_warden': 'report' } },
                report: { text: 'Report to Lt. Imre Vance at Aegis Checkpoint K-4.', marker: 'checkpoint' }
            },
            branches: { destroyed: { label: 'Decommissioned Unit X-9', xp: 640, credits: 420, rep: { aegis: 260 }, items: ['schematic_aegis_atv', 'w_scar_aegis'] } }
        },
        q_alpine_blackbox: {
            name: 'Silent Telemetry', giver: 'lyra', kind: 'side', region: 'alpine_array',
            summary: 'Recover the flight blackbox sealed inside Bunker Delta in Alpine Array.',
            stages: {
                recover: { text: 'Recover the Aegis Flight Blackbox from Bunker Delta.', marker: 'bunker_delta', on: { 'item:aegis_blackbox': 'report' } },
                report: { text: 'Bring the Aegis Flight Blackbox to Dr. Lyra Chen.', marker: 'quarry_camp' }
            },
            branches: { decoded: { label: 'Decoded telemetry logs', xp: 500, credits: 320, rep: { aegis: 200 }, items: ['helm_arctech', 'tool_nano_patch'] } }
        },
        q_helix_cipher: {
            name: 'Harmonic Resonance', giver: 'calla', kind: 'faction', region: 'meridian_core',
            summary: 'Sister Calla seeks the Helix Harmonic Cipher left in the Crater Anomaly Rift.',
            stages: {
                seek: { text: 'Retrieve the Helix Harmonic Cipher from the Crater Anomaly Rift.', marker: 'crater_rift', on: { 'item:helix_cipher': 'report' } },
                report: { text: 'Return the cipher to Sister Calla at the Helix Bloom Shrine.', marker: 'helix_shrine' }
            },
            branches: {
                blessed: { label: 'Shared the Harmonic Cipher', xp: 600, credits: 360, rep: { helix: 280 }, items: ['w_void_staff', 'helm_ghost'] },
                studied: { label: 'Copied cipher for Aegis instead', xp: 600, credits: 380, rep: { aegis: 260, helix: -150 }, items: ['w_acr_specops', 'relic_arctech'] }
            }
        },
        q_sovereign_hunt: {
            name: 'Crown of the Crater', giver: 'kessler', kind: 'main', region: 'meridian_core',
            summary: 'The Meridian Sovereign guards the Containment Dome at the heart of the blast crater.',
            stages: {
                slay: { text: 'Defeat The Meridian Sovereign inside Meridian Containment Dome.', marker: 'meridian_dome', on: { 'kill:boss_meridian_sovereign': 'report' } },
                report: { text: 'Return victorious to Warden Kessler in Freestead Town.', marker: 'freestead' }
            },
            branches: { triumph: { label: 'Shattered the Crater Sovereign', xp: 950, credits: 750, rep: { militia: 350, aegis: 250 }, items: ['schematic_war_strider', 'w_raygun_proto', 'relic_crater_shard'] } }
        },

        /* ==================== 14 NEW FRONTIER, DUNGEON & DRAGONWILDS QUESTS ==================== */
        q_whisper_poachers: {
            name: 'Shadows in the Pines', giver: 'halvar', kind: 'side', region: 'whispering_woods',
            summary: 'Poachers have erected a fortified palisade in Whispering Pinewoods.',
            stages: {
                clear: { text: 'Eliminate Pinewood Poachers at the Poacher Palisade.', marker: 'poacher_palisade', on: { 'kill:forest_poacher': 'report', 'discover:poacher_palisade': 'report' } },
                report: { text: "Report back to Captain Halvar at Ranger's Watch Lodge.", marker: 'whisper_lodge' }
            },
            branches: { cleared: { label: 'Drove out the poachers', xp: 340, credits: 220, rep: { militia: 140 }, pylon: 'py_whisper', items: ['w_galil_veteran', 'elixir_swallow'] } }
        },
        q_barrow_orc_delve: {
            name: 'Delve: Whispering Root-Barrow', giver: 'halvar', kind: 'delve', region: 'whispering_woods',
            summary: 'Warchief Thornback rallies orc reavers beneath the Root-Barrow Mound.',
            stages: {
                delve: { text: 'Enter Whispering Root-Barrow and slay Warchief Thornback.', marker: 'barrow_gate', on: { 'kill:boss_thornback_orc': 'report' } },
                report: { text: "Return to Captain Halvar at Ranger's Watch Lodge.", marker: 'whisper_lodge' }
            },
            branches: { slain: { label: 'Conquered Root-Barrow', xp: 520, credits: 320, rep: { militia: 180 }, items: ['rig_warden', 'elixir_wisdom'] } }
        },
        q_elderwood_harvest: {
            name: 'Heartwood & Iron', giver: 'halvar', kind: 'side', region: 'whispering_woods',
            summary: 'Gather Elderwood Timber from ancient trees in Whispering Pinewoods to fortify the lodge.',
            stages: {
                gather: { text: 'Harvest Elderwood Timber from Ancient Elderwood trees in Whispering Pinewoods.', marker: 'whisper_lodge', on: { 'item:elderwood_log': 'report' } },
                report: { text: "Deliver the timber to Captain Halvar at Ranger's Watch Lodge.", marker: 'whisper_lodge' }
            },
            branches: { delivered: { label: 'Delivered Elderwood Timber', xp: 280, credits: 180, rep: { militia: 100 }, items: ['boots_warden', 'relay_cell'] } }
        },
        q_foundry_delve: {
            name: 'Delve: Ironclad Foundry Depths', giver: 'mags', kind: 'delve', region: 'rust_sprawl',
            summary: 'Rogue Foreman Kragg has sealed himself inside the subterranean Ironclad Foundry Depths.',
            stages: {
                delve: { text: 'Enter Ironclad Foundry Depths at Smuggler Foundry Yard and defeat Foreman Kragg.', marker: 'foundry_yard', on: { 'kill:boss_foundry_kragg': 'report' } },
                report: { text: 'Report to Mags Orrin at Ironclad Rail Yard.', marker: 'rail_yard' }
            },
            branches: { reclaimed: { label: 'Reclaimed the Foundry Depths', xp: 620, credits: 420, rep: { syndicate: 220 }, items: ['helm_juggernaut', 'tool_thermal_cutter'] } }
        },
        q_marrow_crypt_delve: {
            name: 'Delve: Sunken Crypt of Marrow', giver: 'orlok', kind: 'delve', region: 'barrow_moor',
            summary: 'Arch-Lich Malgath is raising the dead across Barrow-Moor from the Sunken Crypt of Marrow.',
            stages: {
                delve: { text: 'Enter the Sunken Crypt of Marrow at Marrow Boneyard and slay Arch-Lich Malgath.', marker: 'marrow_crypt_yard', on: { 'kill:boss_lich_malgath': 'report' } },
                report: { text: 'Return to Grave-Warden Orlok at Grimhollow Sanctuary.', marker: 'grimhollow_chapel' }
            },
            branches: { banished: { label: 'Banished Arch-Lich Malgath', xp: 780, credits: 480, rep: { helix: 220 }, pylon: 'py_grimhollow', items: ['helm_lichplate', 'rig_lichplate'] } }
        },
        q_crimson_vampire_hunt: {
            name: 'Contract: Lord of Crimson Manor', giver: 'orlok', kind: 'contract', region: 'barrow_moor',
            summary: 'Lord Vespera the Undying feasts within the Crimson Sanctum Vaults beneath Vampire Manor.',
            stages: {
                hunt: { text: 'Delve into Crimson Sanctum Vaults at Crimson Manor and slay Lord Vespera.', marker: 'vampire_manor', on: { 'kill:boss_lord_vespera': 'report' } },
                report: { text: 'Claim the Witcher contract reward from Grave-Warden Orlok.', marker: 'grimhollow_chapel' }
            },
            branches: { slain: { label: 'Staked Lord Vespera', xp: 920, credits: 580, rep: { helix: 240 }, items: ['boots_lichplate', 'relic_lich_phylactery'] } }
        },
        q_coven_cavern_delve: {
            name: 'Contract: The Bog Hag-Mother', giver: 'orlok', kind: 'contract', region: 'mire_delta',
            summary: 'Hag-Mother Morwen brews hex-plagues inside the Mire Witch Coven Cavern.',
            stages: {
                hunt: { text: 'Enter Mire Witch Coven Cavern at Witch Coven Bog and slay Hag-Mother Morwen.', marker: 'coven_hut', on: { 'kill:boss_coven_morwen': 'report' } },
                report: { text: 'Return to Grave-Warden Orlok at Grimhollow Sanctuary.', marker: 'grimhollow_chapel' }
            },
            branches: { purged: { label: 'Ended the Coven Sabbat', xp: 960, credits: 600, rep: { aegis: 180, helix: 180 }, items: ['elixir_thunderbolt', 'elixir_wisdom'] } }
        },
        q_dwarven_mine_delve: {
            name: 'Delve: Deep-Vein Molten Core', giver: 'lyra', kind: 'delve', region: 'ash_quarry',
            summary: 'Molten Golem Ignis blocks the mithril seams inside the Deep-Vein Quarry Mines.',
            stages: {
                delve: { text: 'Enter Deep-Vein Quarry Mines at Deep-Vein Minehead and shatter Molten Golem Ignis.', marker: 'quarry_minehead', on: { 'kill:boss_molten_ignis': 'report' } },
                report: { text: 'Report back to Dr. Lyra Chen at Quarry Dig Camp.', marker: 'quarry_camp' }
            },
            branches: { shattered: { label: 'Opened the Deep-Vein seams', xp: 1150, credits: 680, rep: { aegis: 240 }, items: ['w_mg42_scrap', 'tool_nano_patch'] } }
        },
        q_badlands_mesa: {
            name: 'Blood on Redrock Mesa', giver: 'zahra', kind: 'faction', region: 'sunscorched_badlands',
            summary: 'Redrock Desperados are raiding every Dustwind caravan crossing the Badlands.',
            stages: {
                raid: { text: 'Assault Redrock Outlaw Mesa and eliminate Redrock Desperados.', marker: 'redrock_mesa', on: { 'kill:badlands_outlaw': 'report', 'discover:redrock_mesa': 'report' } },
                report: { text: 'Return to Caravan Master Zahra at Dustwind Caravan Oasis.', marker: 'dustwind_oasis' }
            },
            branches: { secured: { label: 'Secured the Badlands trade route', xp: 880, credits: 560, rep: { syndicate: 240 }, pylon: 'py_oasis', items: ['w_rpg7_demolisher', 'relay_cell'] } }
        },
        q_sunfang_tomb_delve: {
            name: "Delve: Sunfang Pharaoh's Tomb", giver: 'zahra', kind: 'delve', region: 'sunscorched_badlands',
            summary: 'Ancient Sunfang Pharaoh Kharim guards the Golden Sunfang Idol beneath the desert pyramid.',
            stages: {
                delve: { text: "Enter Sunfang Pharaoh's Tomb at Sunfang Pyramid Plaza and defeat Sand-King Kharim.", marker: 'sunfang_ruins', on: { 'kill:boss_pharaoh_kharim': 'report' } },
                report: { text: 'Bring word to Caravan Master Zahra at Dustwind Caravan Oasis.', marker: 'dustwind_oasis' }
            },
            branches: { plundered: { label: 'Claimed the Sunfang treasure', xp: 1350, credits: 850, rep: { syndicate: 280 }, items: ['w_gold_deagle_king', 'elixir_wisdom'] } }
        },
        q_drowned_sanctum_delve: {
            name: 'Delve: Abyssal Tide Sanctum', giver: 'zahra', kind: 'delve', region: 'sunken_coast',
            summary: 'Tide-Caller Nereus drags coastal salvage crews into the Abyssal Tide Sanctum.',
            stages: {
                delve: { text: 'Enter Abyssal Tide Sanctum at Tide-Sanctum Arch and slay Tide-Caller Nereus.', marker: 'abyssal_gate', on: { 'kill:boss_tide_nereus': 'report' } },
                report: { text: 'Report to Caravan Master Zahra at Dustwind Caravan Oasis.', marker: 'dustwind_oasis' }
            },
            branches: { calmed: { label: 'Calmed the Sunken Ruin Coast', xp: 1550, credits: 920, rep: { syndicate: 220, militia: 160 }, pylon: 'py_coast', items: ['rig_arctech', 'relay_cell'] } }
        },
        q_blacklab_delve: {
            name: 'Delve: Aegis Sublevel 9', giver: 'vance', kind: 'delve', region: 'alpine_array',
            summary: 'Prototype Omega-Zero broke containment in Aegis Black-Site Sublevel 9.',
            stages: {
                delve: { text: 'Descend into Aegis Black-Site Sublevel 9 and terminate Prototype Omega-Zero.', marker: 'blacklab_surface', on: { 'kill:boss_omega_zero': 'report' } },
                report: { text: 'Report to Lt. Imre Vance at Aegis Checkpoint K-4.', marker: 'checkpoint' }
            },
            branches: { terminated: { label: 'Terminated Prototype Omega-Zero', xp: 1850, credits: 1100, rep: { aegis: 320 }, items: ['w_minigun_titan', 'boots_arctech'] } }
        },
        q_frostspire_delve: {
            name: 'Crown of Frostspire Keep', giver: 'eryndor', kind: 'delve', region: 'frostfang_peaks',
            summary: 'Frost-King Valdris rules the frozen citadel Undercroft in Frostfang Peaks.',
            stages: {
                delve: { text: 'Storm Frostspire Citadel Undercroft at Frostspire Castle Keep and defeat Frost-King Valdris.', marker: 'frostspire_courtyard', on: { 'kill:boss_frost_valdris': 'report' } },
                report: { text: 'Report to Scholar Eryndor at Dragonbone Expedition Camp.', marker: 'dragonbone_outpost' }
            },
            branches: { crowned: { label: 'Shattered the Frost-King', xp: 2400, credits: 1450, rep: { aegis: 350 }, pylon: 'py_frostspire', items: ['w_intervention_apex', 'helm_dragonwild'] } }
        },
        q_dragonwild_vault: {
            name: 'Act II: Scourge of the Dragonwilds', giver: 'eryndor', kind: 'main', region: 'obsidian_dragonwilds',
            summary: 'Vaelgor the Ashen Wyrm slumbers atop an ancient Meridian core in the Obsidian Dragonwild Vault.',
            stages: {
                slay: { text: 'Enter the Obsidian Dragonwild Vault at Obsidian Vault Threshold and slay Vaelgor the Ashen Wyrm.', marker: 'dragon_citadel_gate', on: { 'kill:boss_dragon_vaelgor': 'report' } },
                report: { text: 'Return in triumph to Scholar Eryndor at Dragonbone Expedition Camp.', marker: 'dragonbone_outpost' }
            },
            branches: { legend: { label: 'Dragonwilds Dragonslayer', xp: 4200, credits: 2500, rep: { militia: 400, aegis: 400, helix: 250 }, pylon: 'py_dragonwild', items: ['w_fire_staff', 'rig_dragonwild', 'relic_dragon_heart'] } }
        },

        /* ==================== EXPLORATION QUESTS (Cartography · Discoveries · Champions) ====================
           Self-starting: each begins the first time you chart land or find a site of its kind, and counts
           numeric world flags written by OWRPGCartography / OWRPGDiscoveries / OWRPGChampions. */
        q_atlas_cartographer: {
            name: "The Cartographers' Guild", kind: 'explore', region: null, autoStart: 'flag:explored_pct',
            summary: 'An old guild creed promises a reward to anyone who maps the Expanse. The fog lifts wherever you walk.',
            stages: {
                survey: { text: 'Chart 15% of the Meridian Expanse (Atlas tab tracks progress).', on: { 'count:explored_pct:15': 'expand' } },
                expand: { text: 'Chart 35% of the Expanse. Survey Vistas chart wide areas at once.', on: { 'count:explored_pct:35': 'master' } },
                master: { text: 'Chart 60% of the Expanse to earn the Guild\'s seal.', on: { 'count:explored_pct:60': 'sealed' } },
                sealed: { text: 'The Guild seal is yours.', autoComplete: 'charted' }
            },
            branches: { charted: { label: 'Guild Cartographer', xp: 3200, credits: 1200, items: ['elixir_wisdom', 'elixir_wisdom'], rep: { militia: 150 } } }
        },
        q_lorekeeper: {
            name: 'Lorekeeper of the Expanse', kind: 'explore', region: null, autoStart: 'flag:first_tome',
            summary: 'Field journals and black-box transcripts are scattered across every region. Together they tell what broke the Meridian.',
            stages: {
                gather: { text: 'Recover 5 Lore Tomes.', on: { 'count:found_tome:5': 'archive' } },
                archive: { text: 'Recover 12 Lore Tomes to complete the first archive.', on: { 'count:found_tome:12': 'done' } },
                done: { text: 'The archive is complete.', autoComplete: 'archived' }
            },
            branches: { archived: { label: 'Keeper of the Archive', xp: 2200, credits: 600, items: ['elixir_wisdom', 'runic_shard'] } }
        },
        q_pilgrim_road: {
            name: "The Pilgrim's Road", kind: 'explore', region: null, autoStart: 'flag:first_shrine',
            summary: 'Root-wrapped wayside shrines still answer prayers. Pilgrims once walked between them all.',
            stages: {
                walk: { text: 'Pray at 6 different Wayside Shrines.', on: { 'count:found_shrine:6': 'done' } },
                done: { text: 'The road is walked.', autoComplete: 'walked' }
            },
            branches: { walked: { label: 'Pilgrim of the Expanse', xp: 1600, credits: 350, items: ['elixir_thunderbolt', 'elixir_swallow'] } }
        },
        q_fortune_bold: {
            name: 'Fortune Favours the Bold', kind: 'explore', region: null, autoStart: 'flag:first_cache',
            summary: 'Pre-Fall strongboxes lie buried under every region. Somebody hid a fortune before the dome went dark.',
            stages: {
                dig: { text: 'Open 10 Treasure Caches.', on: { 'count:found_cache:10': 'hoard' } },
                hoard: { text: 'Open 25 Treasure Caches.', on: { 'count:found_cache:25': 'done' } },
                done: { text: 'The hoard is yours.', autoComplete: 'rich' }
            },
            branches: { rich: { label: 'Treasure Hunter', xp: 1900, credits: 1800, items: ['rig_aegis'] } }
        },
        q_eyes_expanse: {
            name: 'Eyes Over the Expanse', kind: 'explore', region: null, autoStart: 'flag:first_vista',
            summary: 'Surveyor beacons crown the high ground of every region. Synchronising one charts the land around it.',
            stages: {
                sync: { text: 'Synchronise 6 Survey Vistas (shown as ? on the minimap).', on: { 'count:found_vista:6': 'all' } },
                all: { text: 'Synchronise all 12 Survey Vistas.', on: { 'count:found_vista:12': 'done' } },
                done: { text: 'Every beacon is lit.', autoComplete: 'synced' }
            },
            branches: { synced: { label: 'Master Surveyor', xp: 2600, credits: 700, items: ['elixir_wisdom'] } }
        },
        q_champion_hunter: {
            name: 'Hunter of Champions', kind: 'explore', region: null, autoStart: 'flag:first_champion',
            summary: 'Champions — larger, aura-wrapped enemies with deadly affixes — roam every region. Collectors pay for their sigils.',
            stages: {
                hunt: { text: 'Slay 5 Champions.', on: { 'count:champions_slain:5': 'legend' } },
                legend: { text: 'Slay 15 Champions.', on: { 'count:champions_slain:15': 'done' } },
                done: { text: 'Your name is known.', autoComplete: 'apex' }
            },
            branches: { apex: { label: 'Champion Hunter', xp: 2800, credits: 1400, items: ['elixir_thunderbolt', 'relay_cell'] } }
        },
        q_trial_fire: {
            name: 'Trial by Fire', kind: 'explore', region: null, autoStart: 'flag:first_altar',
            summary: 'Altars of Trials summon a Champion and its retinue. Each victory is recorded in the stone.',
            stages: {
                trials: { text: 'Win 3 Altar Trials.', on: { 'count:trials_won:3': 'done' } },
                done: { text: 'The stones remember you.', autoComplete: 'tried' }
            },
            branches: { tried: { label: 'Altar Champion', xp: 2400, credits: 900, items: ['elixir_thunderbolt'] } }
        },
        q_echoes_mastery: {
            name: 'Echoes of Mastery', kind: 'explore', region: null, autoStart: 'flag:first_shard',
            summary: 'Crystallised memories of forgotten crafts pulse in the wilds. Each one teaches a lifetime in a moment.',
            stages: {
                absorb: { text: 'Absorb 8 Skill Shards.', on: { 'count:found_shard:8': 'done' } },
                done: { text: 'The echoes settle.', autoComplete: 'echo' }
            },
            branches: { echo: { label: 'Echo-Touched', xp: 1700, credits: 300, items: ['elixir_wisdom'] } }
        },
        q_smugglers_trail: {
            name: "Smuggler's Trail", kind: 'explore', region: null, autoStart: 'flag:first_cairn',
            summary: 'Cairns of piled stone mark a smuggling network that ran gear between the regions.',
            stages: {
                follow: { text: 'Search 8 Hidden Stashes.', on: { 'count:found_cairn:8': 'done' } },
                done: { text: 'The network is exposed.', autoComplete: 'exposed' }
            },
            branches: { exposed: { label: 'Trail Breaker', xp: 1300, credits: 1000, rep: { militia: 100, syndicate: -100 } } }
        }
    };

    BO.OWRPGQuestsData = { QUESTS };
})(window.BO);
;

/* --- src/data/OWRPGAct2Data.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Act II–VI Expansion Quests, Companions & NG+
   Authoring full multi-path questlines across Regions 2–6 (Rust Sprawl,
   Mire Delta, Ash Quarry, Alpine Array, Meridian Core & Dragonwilds):
   - Combat / Tech-Stealth / Social paths on every quest
   - Deterministic skill/attribute checks (ADR-003)
   - Faction territory consequences, 3 recruitable Companions, NPC schedules
   Injected into OWRPGStatsData / OWRPGQuestsData / OWRPGDialogueData before
   OWRPGValidator.js executes so all graph & ref integrity checks pass (0 errs).
============================================================================ */
(function (BO) {
    'use strict';

    const SD = BO.OWRPGStatsData;

    /* ---------------------------------------------------- 1. Act II–VI Items (lazy quest defs) */
    const ACT2_ITEMS = {
        dish_override_key: {
            id: 'dish_override_key',
            name: 'Dish Array Override Token',
            type: 'quest',
            weight: 0.2,
            value: 0,
            desc: 'Encrypted Aegis authorization shard used to realign Alpine Dish Ridge without triggering orbital lockdown.'
        },
        crate_cipher_chip: {
            id: 'crate_cipher_chip',
            name: 'Smuggler Rail Cipher Chip',
            type: 'quest',
            weight: 0.2,
            value: 0,
            desc: 'Syndicate manifest key linking Goliath Crane shipments to the Ash Quarry extraction rig.'
        },
        companion_signal_tag: {
            id: 'companion_signal_tag',
            name: 'Meridian Companion Transponder',
            type: 'quest',
            weight: 0.2,
            value: 0,
            desc: 'Encrypted short-range beacon synchronizing squadmate tactics across the Meridian Expanse.'
        }
    };
    Object.assign(SD.ITEMS, ACT2_ITEMS);

    /* ---------------------------------------------------- 2. Act II–VI Quests (kept separate so OWRPGQuestsData keeps its 31-quest schema parity) */
    const ACT2_QUESTS = {
        q_act2_sprawl_signal: {
            name: 'Iron Frequency (Act II)',
            giver: 'mags',
            region: 'rust_sprawl',
            kind: 'main',
            summary: 'Trace the hijacked Goliath Crane relay inside Rust Sprawl and secure Syndicate telemetry for Act II.',
            stages: {
                investigate: {
                    text: 'Reach the Goliath Crane in Rust Sprawl and neutralize or bypass its Syndicate hijackers.',
                    marker: 'goliath',
                    on: {
                        'kill:syn_sniper': 'secure',
                        'flag:act2_crane_hacked': 'secure',
                        'flag:act2_crane_truce': 'secure'
                    }
                },
                secure: {
                    text: 'Report back to Mags Orrin at Ironclad Rail Yard.',
                    marker: 'rail_yard',
                    on: { 'flag:act2_sprawl_done': 'done' }
                },
                done: {
                    text: 'Rust Sprawl telemetry secured.',
                    autoComplete: 'combat'
                }
            },
            branches: {
                combat: {
                    label: 'Eliminated the Goliath sniper team',
                    xp: 380, credits: 260,
                    items: ['crate_cipher_chip'],
                    rep: { syndicate: -60, militia: 90 },
                    flags: ['act2_sprawl_complete']
                },
                tech: {
                    label: 'Spliced the Goliath crane transponder silently',
                    xp: 420, credits: 240,
                    items: ['crate_cipher_chip', 'relay_cell'],
                    rep: { militia: 60, aegis: 50 },
                    flags: ['act2_sprawl_complete', 'sprawl_stealth_clear']
                },
                social: {
                    label: 'Brokered an Ironclad data-sharing truce',
                    xp: 400, credits: 300,
                    items: ['crate_cipher_chip'],
                    rep: { syndicate: 140 },
                    flags: ['act2_sprawl_complete', 'sprawl_syndicate_truce']
                }
            }
        },

        q_act2_goliath_ledger: {
            name: 'Heavy Freight Ledger',
            giver: 'torin',
            region: 'rust_sprawl',
            kind: 'side',
            summary: 'Recover lost Militia ordnance manifests from the Smuggler Foundry Yard.',
            stages: {
                recover: {
                    text: 'Track stolen Militia freight in Smuggler Foundry Yard.',
                    marker: 'foundry_yard',
                    on: {
                        'kill:enforcer': 'return_torin',
                        'discover:foundry_yard': 'return_torin',
                        'flag:act2_ledger_bought': 'return_torin'
                    }
                },
                return_torin: {
                    text: 'Return the freight status to Quartermaster Torin in Freestead.',
                    marker: 'freestead',
                    on: { 'flag:act2_ledger_done': 'done' }
                },
                done: { text: 'Militia supply line restored.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Reclaimed shipment by force', xp: 260, credits: 190, items: ['ammo_box'], rep: { militia: 110, syndicate: -70 }, flags: ['foundry_militia_raided'] },
                tech: { label: 'Copied digital ledger via terminal', xp: 280, credits: 160, items: ['relay_cell'], rep: { militia: 80 }, flags: ['foundry_copied'] },
                social: { label: 'Purchased amnesty manifest quietly', xp: 250, credits: 120, items: ['stim'], rep: { militia: 60, syndicate: 60 }, flags: ['foundry_amnesty'] }
            }
        },

        q_act3_mire_relay: {
            name: 'Spore Tide (Act III)',
            giver: 'lyra',
            region: 'mire_delta',
            kind: 'main',
            summary: 'Sample the mutated Cooling Stack brood in Mire Delta and neutralize the Mire Hydra threat.',
            stages: {
                collect: {
                    text: 'Clear Cooling Stack Nest or inspect the Sunken Cargo Barge for stabilized toxin readings.',
                    marker: 'mire_nest',
                    on: {
                        'kill:boss_mire_hydra': 'report',
                        'item:mire_toxin_sample': 'report',
                        'flag:act3_mire_purged': 'report',
                        'flag:act3_mire_bribe': 'report'
                    }
                },
                report: {
                    text: 'Deliver the Mire Delta findings to Dr. Lyra Chen at Quarry Dig Camp.',
                    marker: 'quarry_camp',
                    on: { 'flag:act3_mire_done': 'done' }
                },
                done: { text: 'Mire Delta telemetry delivered.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Slew the Mire Hydra apex brood', xp: 520, credits: 360, items: ['elixir_wisdom'], rep: { aegis: 120, militia: 70 }, flags: ['act3_mire_complete'] },
                tech: { label: 'Triggered sonic bio-scrubber on Sunken Barge', xp: 540, credits: 320, items: ['w_p90_arc'], rep: { aegis: 140 }, flags: ['act3_mire_complete', 'mire_scrubbed'] },
                social: { label: 'Traded anti-venom formula with Sister Calla', xp: 500, credits: 340, items: ['elixir_swallow'], rep: { helix: 110, aegis: 60 }, flags: ['act3_mire_complete', 'mire_helix_accord'] }
            }
        },

        q_act3_coven_cure: {
            name: 'Bitter Antidote',
            giver: 'ines',
            region: 'mire_delta',
            kind: 'side',
            summary: 'Secure clean bog reagents from Witch Coven Bog before infection spreads to Freestead.',
            stages: {
                gather: {
                    text: 'Visit Witch Coven Bog in Mire Delta to secure reagents.',
                    marker: 'coven_hut',
                    on: {
                        'kill:mire_witch': 'return_ines',
                        'discover:coven_hut': 'return_ines',
                        'flag:act3_coven_trade': 'return_ines'
                    }
                },
                return_ines: {
                    text: 'Bring reagent telemetry back to Medic Ines in Freestead.',
                    marker: 'freestead',
                    on: { 'flag:act3_coven_done': 'done' }
                },
                done: { text: 'Antidote stock synthesized.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Dispersed the Coven & seized vials', xp: 340, credits: 220, items: ['medkit', 'elixir_swallow'], rep: { militia: 100, helix: -60 }, flags: ['coven_purged'] },
                tech: { label: 'Extracted pure distillate via analyzer', xp: 360, credits: 240, items: ['elixir_swallow'], rep: { militia: 90, aegis: 50 }, flags: ['coven_distilled'] },
                social: { label: 'Negotiated medicinal herb swap', xp: 350, credits: 200, items: ['medkit'], rep: { militia: 80, helix: 80 }, flags: ['coven_accord'] }
            }
        },

        q_act4_quarry_breach: {
            name: 'Ash & Iron (Act IV)',
            giver: 'vance',
            region: 'ash_quarry',
            kind: 'main',
            summary: 'Break the deadlock in Ash Quarry, defeat the Excavator Pit Colossus, and stabilize frontline control.',
            stages: {
                assault: {
                    text: 'Enter Excavator Pit and dismantle the Colossus threat or claim Quarry control.',
                    marker: 'quarry_pit',
                    on: {
                        'kill:boss_quarry_colossus': 'report',
                        'flag:act4_quarry_hacked': 'report',
                        'flag:act4_quarry_pact': 'report'
                    }
                },
                report: {
                    text: 'Report Ash Quarry status to Lt. Imre Vance at Checkpoint K-4.',
                    marker: 'checkpoint',
                    on: { 'flag:act4_quarry_done': 'done' }
                },
                done: { text: 'Ash Quarry secured.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Destroyed the Quarry Colossus', xp: 680, credits: 460, items: ['w_scar_aegis'], rep: { aegis: 150, syndicate: -90 }, flags: ['act4_quarry_complete', 'quarry_aegis_hold'] },
                tech: { label: 'Overloaded seismic excavator pylons', xp: 710, credits: 420, items: ['relay_cell', 'aegis_blackbox'], rep: { aegis: 120, militia: 80 }, flags: ['act4_quarry_complete', 'quarry_militia_hold'] },
                social: { label: 'Partitioned quarry ore rights peacefully', xp: 690, credits: 520, items: ['quarry_core_sample'], rep: { syndicate: 130, aegis: 90 }, flags: ['act4_quarry_complete', 'quarry_syndicate_hold'] }
            }
        },

        q_act4_deep_vein: {
            name: 'Deep-Vein Extraction',
            giver: 'mags',
            region: 'ash_quarry',
            kind: 'side',
            summary: 'Investigate seismic blasts in Deep-Vein Minehead for rare Syndicate alloys.',
            stages: {
                probe: {
                    text: 'Scout Deep-Vein Minehead in Ash Quarry.',
                    marker: 'quarry_minehead',
                    on: {
                        'kill:brood_iron_goliath': 'return_mags',
                        'discover:quarry_minehead': 'return_mags',
                        'flag:act4_vein_dealt': 'return_mags'
                    }
                },
                return_mags: {
                    text: 'Report ore survey to Mags Orrin.',
                    marker: 'rail_yard',
                    on: { 'flag:act4_vein_done': 'done' }
                },
                done: { text: 'Deep-Vein route charted.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Cleared Iron Goliath from shaft', xp: 450, credits: 320, items: ['scrap_metal', 'circuitry'], rep: { syndicate: 110 }, flags: ['deep_vein_cleared'] },
                tech: { label: 'Mapped fault line with seismic scan', xp: 470, credits: 300, items: ['circuitry'], rep: { aegis: 90, syndicate: 60 }, flags: ['deep_vein_mapped'] },
                social: { label: 'Sold exclusive drilling claim', xp: 460, credits: 420, items: ['stim'], rep: { syndicate: 140 }, flags: ['deep_vein_sold'] }
            }
        },

        q_act5_alpine_uplink: {
            name: 'Skyline Silent (Act V)',
            giver: 'vance',
            region: 'alpine_array',
            kind: 'main',
            summary: 'Cleanse Deep-Space Dish Ridge in Alpine Array and unlock the real Act V uplink for Meridian Core.',
            stages: {
                dish: {
                    text: 'Reclaim Deep-Space Dish Ridge and deal with the Alpine Warden.',
                    marker: 'dish_ridge',
                    on: {
                        'kill:boss_alpine_warden': 'debrief',
                        'item:dish_override_key': 'debrief',
                        'flag:act5_dish_negotiated': 'debrief'
                    }
                },
                debrief: {
                    text: 'Transmit uplink keys to Lt. Imre Vance at Checkpoint K-4.',
                    marker: 'checkpoint',
                    on: { 'flag:act5_alpine_done': 'done' }
                },
                done: { text: 'Alpine Array aligned toward Meridian Core.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Defeated the Alpine Warden atop Dish Ridge', xp: 860, credits: 580, items: ['w_acr_specops'], rep: { aegis: 180, helix: -80 }, flags: ['act5_alpine_complete', 'alpine_aegis_secured'] },
                tech: { label: 'Injected stealth override key into Dish Array', xp: 900, credits: 520, items: ['dish_override_key', 'w_mp7_ghost'], rep: { aegis: 150 }, flags: ['act5_alpine_complete', 'alpine_aegis_secured', 'dish_ghost_hack'] },
                social: { label: 'Shared orbital telemetry with Helix observers', xp: 880, credits: 600, items: ['helix_cipher'], rep: { aegis: 100, helix: 130 }, flags: ['act5_alpine_complete', 'alpine_shared_link'] }
            }
        },

        q_act5_blacklab_purge: {
            name: 'Black-Site Sublevel Protocol',
            giver: 'sola',
            region: 'alpine_array',
            kind: 'side',
            summary: 'Recover cold-fusion stabilizers from Aegis Black-Site Perimeter.',
            stages: {
                reach: {
                    text: 'Locate cold-fusion lockboxes at Aegis Black-Site Perimeter.',
                    marker: 'blacklab_surface',
                    on: {
                        'kill:aegis_cryo': 'return_sola',
                        'discover:blacklab_surface': 'return_sola',
                        'flag:act5_blacklab_accord': 'return_sola'
                    }
                },
                return_sola: {
                    text: 'Bring schematics to Engineer Sola in Freestead.',
                    marker: 'freestead',
                    on: { 'flag:act5_blacklab_done': 'done' }
                },
                done: { text: 'Stabilizer specs logged.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Breached Black-Site perimeter', xp: 580, credits: 390, items: ['circuitry', 'relay_cell'], rep: { militia: 110, aegis: -90 }, flags: ['blacklab_breached'] },
                tech: { label: 'Spoofed cryo lockdown remotely', xp: 610, credits: 360, items: ['w_p90_arc'], rep: { militia: 90, aegis: 80 }, flags: ['blacklab_spoofed'] },
                social: { label: 'Secured licensed Aegis transfer', xp: 590, credits: 410, items: ['relay_cell'], rep: { aegis: 120, militia: 70 }, flags: ['blacklab_licensed'] }
            }
        },

        q_act6_meridian_finale: {
            name: 'Crown of Meridian (Act VI Finale)',
            giver: 'calla',
            region: 'meridian_core',
            kind: 'main',
            summary: 'Enter the Meridian Containment Dome, resolve the Meridian Sovereign crisis, and shape the future of the Expanse.',
            stages: {
                breach: {
                    text: 'Reach the Meridian Containment Dome in Meridian Core and confront the Meridian Sovereign.',
                    marker: 'meridian_dome',
                    on: {
                        'kill:boss_meridian_sovereign': 'converge',
                        'item:sovereign_core': 'converge',
                        'flag:act6_harmonic_pact': 'converge'
                    }
                },
                converge: {
                    text: 'Return to Sister Calla at Helix Bloom Shrine to finalize Meridian Core settlement.',
                    marker: 'helix_shrine',
                    on: { 'flag:act6_meridian_done': 'done' }
                },
                done: { text: 'Operation Meridian Finale resolved. New Game+ unlocked.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Shattered the Meridian Sovereign', xp: 1400, credits: 1000, items: ['w_raygun_proto', 'sovereign_core'], rep: { militia: 200, aegis: 200 }, flags: ['meridian_act6_complete', 'ending_shattered'] },
                tech: { label: 'Reprogrammed containment lattice', xp: 1450, credits: 950, items: ['w_tesla_coil', 'sovereign_core'], rep: { aegis: 220, syndicate: 120 }, flags: ['meridian_act6_complete', 'ending_contained'] },
                social: { label: 'Harmonized Meridian Core & Helix Shrine', xp: 1420, credits: 1100, items: ['w_f2000_helix'], rep: { helix: 250, militia: 140 }, flags: ['meridian_act6_complete', 'ending_harmonized'] }
            }
        },

        q_act6_dragon_pact: {
            name: 'Ashes of the Crater',
            giver: 'eryndor',
            region: 'obsidian_dragonwilds',
            kind: 'side',
            summary: 'Survey Obsidian Vault Threshold for Dragonwild resonance stabilizing Meridian Core.',
            stages: {
                survey: {
                    text: 'Reach Obsidian Vault Threshold or defeat an Ashen Drake.',
                    marker: 'dragon_citadel_gate',
                    on: {
                        'discover:dragon_citadel_gate': 'return_eryndor',
                        'kill:boss_abyssal_archon': 'return_eryndor',
                        'flag:act6_dragon_sealed': 'return_eryndor'
                    }
                },
                return_eryndor: {
                    text: 'Report findings to Scholar Eryndor at Dragonbone Outpost.',
                    marker: 'dragonbone_outpost',
                    on: { 'flag:act6_dragon_done': 'done' }
                },
                done: { text: 'Crater resonance documented.', autoComplete: 'combat' }
            },
            branches: {
                combat: { label: 'Purged the Obsidian Vault gatekeepers', xp: 980, credits: 720, items: ['elixir_thunderbolt'], rep: { aegis: 150, militia: 110 }, flags: ['dragonwild_purged'] },
                tech: { label: 'Deployed obsidian frequency dampener', xp: 1020, credits: 680, items: ['relay_cell', 'elixir_wisdom'], rep: { aegis: 180 }, flags: ['dragonwild_dampened'] },
                social: { label: 'Preserved ancient archive for joint study', xp: 1000, credits: 760, items: ['helix_cipher'], rep: { helix: 160, aegis: 120 }, flags: ['dragonwild_archive'] }
            }
        }
    };

    /* ---------------------------------------------------- 3. Dialogue Injection Specs */
    const DIALOGUE_INJECTIONS = {};
    function injectTree(npcId, hubChoices, extraNodes) {
        DIALOGUE_INJECTIONS[npcId] = { hubChoices, extraNodes };
    }

    // Rust Sprawl + Ash Quarry Minehead: Mags
    injectTree('mags', [
        { text: '[ACT II] "Need intel on Rust Sprawl & Goliath Crane?"', req: { quest: ['q_act2_sprawl_signal', 'inactive'] }, next: 'act2_offer' },
        { text: '[ACT II] "Goliath Crane telemetry is ready." (Complete Act II)', req: { stage: ['q_act2_sprawl_signal', 'secure'] }, next: 'act2_turnin' },
        { text: '[SIDE] "Anything new near Deep-Vein Minehead?"', req: { quest: ['q_act4_deep_vein', 'inactive'] }, next: 'vein_offer' },
        { text: '[SIDE] "Deep-Vein ore survey is done."', req: { stage: ['q_act4_deep_vein', 'return_mags'] }, next: 'vein_turnin' },
        { text: '[COMPANION] "Send Tinker Torque with me for field support."', req: { flag: 'act2_sprawl_complete', notFlag: 'comp_torque_recruited' }, next: 'recruit_torque' }
    ], {
        act2_offer: {
            text: "Goliath Crane's signal tower is broadcasting junk cipher into my rail switches. Take out their sniper nest, spoof the dish, or negotiate a Syndicate data split — your call.",
            choices: [
                { text: '"I\'ll handle Goliath Crane."', next: 'END', fx: { startQuest: 'q_act2_sprawl_signal' } },
                { text: '[TCH 6] "I can bypass the crane array remotely if you give me the rail cipher."', req: { attr: ['TCH', 6] }, next: 'END', fx: { startQuest: 'q_act2_sprawl_signal', setFlag: 'act2_crane_hacked', grantItem: 'crate_cipher_chip', xp: 60 } },
                { text: '[PRS 6] "Tell your spotters to stand down — we split the salvage."', req: { attr: ['PRS', 6] }, next: 'END', fx: { startQuest: 'q_act2_sprawl_signal', setFlag: 'act2_crane_truce', xp: 60 } },
                { text: '"Maybe later."', next: 'hub' }
            ]
        },
        act2_turnin: {
            text: "Clean signal across the tracks again. How did you settle it up on the crane?",
            choices: [
                { text: '"Dropped the hijackers cleanly."', next: 'END', fx: { complete: ['q_act2_sprawl_signal', 'combat'], setFlag: 'act2_sprawl_done' } },
                { text: '[TCH 6] "Rewired the dish silently without firing a shot."', req: { attr: ['TCH', 6] }, next: 'END', fx: { complete: ['q_act2_sprawl_signal', 'tech'], setFlag: 'act2_sprawl_done' } },
                { text: '[PRS 6] "Cut a revenue deal with their crew."', req: { attr: ['PRS', 6] }, next: 'END', fx: { complete: ['q_act2_sprawl_signal', 'social'], setFlag: 'act2_sprawl_done' } }
            ]
        },
        vein_offer: {
            text: "Deep-Vein Minehead in Ash Quarry has been shaking my railcars loose. Clear out the Iron Goliath down there or bring me a seismic read.",
            choices: [
                { text: '"I\'ll check Deep-Vein Minehead."', next: 'END', fx: { startQuest: 'q_act4_deep_vein' } },
                { text: '"Not right now."', next: 'hub' }
            ]
        },
        vein_turnin: {
            text: "You're back from Deep-Vein in one piece. How should we file the claim?",
            choices: [
                { text: '"Cleared the tunnel brood by force."', next: 'END', fx: { complete: ['q_act4_deep_vein', 'combat'], setFlag: 'act4_vein_done' } },
                { text: '[TCH 7] "Brought back fault-line telemetry."', req: { attr: ['TCH', 7] }, next: 'END', fx: { complete: ['q_act4_deep_vein', 'tech'], setFlag: 'act4_vein_done' } },
                { text: '[PRS 7] "Sold exclusive Syndicate drilling rights."', req: { attr: ['PRS', 7] }, next: 'END', fx: { complete: ['q_act4_deep_vein', 'social'], setFlag: 'act4_vein_done' } }
            ]
        },
        recruit_torque: {
            text: "Tinker Torque's drone rig is already primed. Treat him right — his field patches keep operatives breathing and abilities cycling faster.",
            choices: [
                { text: '"Welcome aboard, Torque."', next: 'END', fx: { setFlag: 'comp_torque_recruited', grantItem: 'companion_signal_tag' } }
            ]
        }
    });

    // Torin: Act II Side + Companion Soren
    injectTree('torin', [
        { text: '[SIDE] "Missing freight out at the Smuggler Foundry?"', req: { quest: ['q_act2_goliath_ledger', 'inactive'] }, next: 'ledger_offer' },
        { text: '[SIDE] "Foundry ledger update ready."', req: { stage: ['q_act2_goliath_ledger', 'return_torin'] }, next: 'ledger_turnin' },
        { text: '[COMPANION] "Assign Vanguard Soren to my squad."', req: { notFlag: 'comp_soren_recruited' }, next: 'recruit_soren' }
    ], {
        ledger_offer: {
            text: "Smugglers hauled three crates of Militia plates into the Foundry Yard. Hit them, clone their manifest, or buy them quiet.",
            choices: [
                { text: '"I\'ll recover it."', next: 'END', fx: { startQuest: 'q_act2_goliath_ledger' } },
                { text: '"Hold off for now."', next: 'hub' }
            ]
        },
        ledger_turnin: {
            text: "Good work near the Foundry. What's the verdict?",
            choices: [
                { text: '"Took the ordnance back head-on."', next: 'END', fx: { complete: ['q_act2_goliath_ledger', 'combat'], setFlag: 'act2_ledger_done' } },
                { text: '[TCH 5] "Cloned the shipping ledger without raising alarm."', req: { attr: ['TCH', 5] }, next: 'END', fx: { complete: ['q_act2_goliath_ledger', 'tech'], setFlag: 'act2_ledger_done' } },
                { text: '[PRS 5] "Paid an amnesty broker to reroute it."', req: { attr: ['PRS', 5] }, next: 'END', fx: { complete: ['q_act2_goliath_ledger', 'social'], setFlag: 'act2_ledger_done' } }
            ]
        },
        recruit_soren: {
            text: "Vanguard Soren is itching to get out of the yard. His heavy plating draws fire and shaves damage off everyone close by.",
            choices: [
                { text: '"Soren, fall in."', next: 'END', fx: { setFlag: 'comp_soren_recruited', grantItem: 'companion_signal_tag' } }
            ]
        }
    });

    // Lyra: Act III Mire Delta
    injectTree('lyra', [
        { text: '[ACT III] "Ready to tackle Cooling Stack Nest & the Mire?"', req: { quest: ['q_act3_mire_relay', 'inactive'] }, next: 'act3_offer' },
        { text: '[ACT III] "Here is the Mire Delta spore data."', req: { stage: ['q_act3_mire_relay', 'report'] }, next: 'act3_turnin' }
    ], {
        act3_offer: {
            text: "Spore output in Mire Delta spiked overnight. Neutralize the Mire Hydra at Cooling Stack Nest, purge the Sunken Barge scrubber, or broker an anti-venom swap.",
            choices: [
                { text: '"Deploying to Mire Delta."', next: 'END', fx: { startQuest: 'q_act3_mire_relay' } },
                { text: '[TCH 7] "Load the sonic scrubber bypass code onto my Pip-Pad."', req: { attr: ['TCH', 7] }, next: 'END', fx: { startQuest: 'q_act3_mire_relay', setFlag: 'act3_mire_purged', xp: 75 } },
                { text: '"Later, Doctor."', next: 'hub' }
            ]
        },
        act3_turnin: {
            text: "These spore metrics are remarkable. How did you handle the delta?",
            choices: [
                { text: '"Put the Mire Hydra down for good."', next: 'END', fx: { complete: ['q_act3_mire_relay', 'combat'], setFlag: 'act3_mire_done' } },
                { text: '[TCH 7] "Sterilized the water via the Sunken Barge scrubbers."', req: { attr: ['TCH', 7] }, next: 'END', fx: { complete: ['q_act3_mire_relay', 'tech'], setFlag: 'act3_mire_done' } },
                { text: '[PRS 7] "Coordinated Helix botanical cultures."', req: { attr: ['PRS', 7] }, next: 'END', fx: { complete: ['q_act3_mire_relay', 'social'], setFlag: 'act3_mire_done' } }
            ]
        }
    });

    // Ines: Act III Side Coven Cure
    injectTree('ines', [
        { text: '[SIDE] "Need reagents from Witch Coven Bog?"', req: { quest: ['q_act3_coven_cure', 'inactive'] }, next: 'coven_offer' },
        { text: '[SIDE] "I have the Coven Bog serum readings."', req: { stage: ['q_act3_coven_cure', 'return_ines'] }, next: 'coven_turnin' }
    ], {
        coven_offer: {
            text: "The swamp witches hoard clean bog distillates that stabilize field stims. Seize, distill, or bargain for a sample.",
            choices: [
                { text: '"I\'ll head to the Coven Bog."', next: 'END', fx: { startQuest: 'q_act3_coven_cure' } },
                { text: '"Another time."', next: 'hub' }
            ]
        },
        coven_turnin: {
            text: "My synthesizer is ready. How did you pull the reagent?",
            choices: [
                { text: '"Cleared the bog and confiscated the vials."', next: 'END', fx: { complete: ['q_act3_coven_cure', 'combat'], setFlag: 'act3_coven_done' } },
                { text: '[TCH 6] "Distilled a sterile micro-sample cleanly."', req: { attr: ['TCH', 6] }, next: 'END', fx: { complete: ['q_act3_coven_cure', 'tech'], setFlag: 'act3_coven_done' } },
                { text: '[PRS 6] "Traded clean bandages for surplus stock."', req: { attr: ['PRS', 6] }, next: 'END', fx: { complete: ['q_act3_coven_cure', 'social'], setFlag: 'act3_coven_done' } }
            ]
        }
    });

    // Vance: Act IV Quarry + Act V Dish Ridge + Companion Kael
    injectTree('vance', [
        { text: '[ACT IV] "Give me orders for Ash Quarry & the Colossus."', req: { quest: ['q_act4_quarry_breach', 'inactive'] }, next: 'act4_offer' },
        { text: '[ACT IV] "Ash Quarry situation resolved."', req: { stage: ['q_act4_quarry_breach', 'report'] }, next: 'act4_turnin' },
        { text: '[ACT V] "Brief me on Alpine Array & Dish Ridge."', req: { quest: ['q_act5_alpine_uplink', 'inactive'] }, next: 'act5_offer' },
        { text: '[ACT V] "Dish Ridge uplink telemetry secured."', req: { stage: ['q_act5_alpine_uplink', 'debrief'] }, next: 'act5_turnin' },
        { text: '[COMPANION] "Assign Ghost Kael to cover my flanks."', req: { notFlag: 'comp_kael_recruited' }, next: 'recruit_kael' }
    ], {
        act4_offer: {
            text: "Excavator Pit is crawling with heavy iron mutants and fighting between Syndicate and Militia squads. Break the Colossus or stabilize the quarry.",
            choices: [
                { text: '"Heading to Ash Quarry now."', next: 'END', fx: { startQuest: 'q_act4_quarry_breach' } },
                { text: '"Check back soon."', next: 'hub' }
            ]
        },
        act4_turnin: {
            text: "Ash Quarry seismic monitors settled down. Who holds the pit now?",
            choices: [
                { text: '"Aegis holds it — Colossus destroyed."', next: 'END', fx: { complete: ['q_act4_quarry_breach', 'combat'], setFlag: 'act4_quarry_done' } },
                { text: '[TCH 7] "Rerouted seismic pylons to Militia grid."', req: { attr: ['TCH', 7] }, next: 'END', fx: { complete: ['q_act4_quarry_breach', 'tech'], setFlag: 'act4_quarry_done' } },
                { text: '[PRS 7] "Syndicate & Aegis agreed on split shifts."', req: { attr: ['PRS', 7] }, next: 'END', fx: { complete: ['q_act4_quarry_breach', 'social'], setFlag: 'act4_quarry_done' } }
            ]
        },
        act5_offer: {
            text: "The Alpine Warden locked Deep-Space Dish Ridge before we could lock Meridian Core's frequency. Take the ridge or slip my override shard into the console.",
            choices: [
                { text: '"On my way to Dish Ridge."', next: 'END', fx: { startQuest: 'q_act5_alpine_uplink' } },
                { text: '[TCH 8] "Give me the override shard — I\'ll ghost the array."', req: { attr: ['TCH', 8] }, next: 'END', fx: { startQuest: 'q_act5_alpine_uplink', grantItem: 'dish_override_key' } },
                { text: '"Standing by."', next: 'hub' }
            ]
        },
        act5_turnin: {
            text: "Orbital lock acquired. How did Dish Ridge fall?",
            choices: [
                { text: '"Warden eliminated. Dish Ridge is Aegis airspace."', next: 'END', fx: { complete: ['q_act5_alpine_uplink', 'combat'], setFlag: 'act5_alpine_done' } },
                { text: '[TCH 8] "Flashed the override key into the main dish."', req: { attr: ['TCH', 8] }, next: 'END', fx: { complete: ['q_act5_alpine_uplink', 'tech'], setFlag: 'act5_alpine_done' } },
                { text: '[PRS 8] "Opened shared bandwidth to Helix monitors."', req: { attr: ['PRS', 8] }, next: 'END', fx: { complete: ['q_act5_alpine_uplink', 'social'], setFlag: 'act5_alpine_done' } }
            ]
        },
        recruit_kael: {
            text: "Ghost Kael is our sharpest recon marksman. He spots targets at range and pushes your weakspot multipliers higher.",
            choices: [
                { text: '"Kael, link comms with me."', next: 'END', fx: { setFlag: 'comp_kael_recruited', grantItem: 'companion_signal_tag' } }
            ]
        }
    });

    // Sola: Act V Blacklab Side
    injectTree('sola', [
        { text: '[SIDE] "Tell me about the Aegis Black-Site cold-fusion lockboxes."', req: { quest: ['q_act5_blacklab_purge', 'inactive'] }, next: 'blacklab_offer' },
        { text: '[SIDE] "Black-Site telemetry logged."', req: { stage: ['q_act5_blacklab_purge', 'return_sola'] }, next: 'blacklab_turnin' }
    ], {
        blacklab_offer: {
            text: "Up at Aegis Black-Site Perimeter in the Alpine foothills, there's cryo-stabilizer tech Freestead badly needs. Breaching, spoofing, or negotiating — get us those specs.",
            choices: [
                { text: '"I\'ll retrieve them."', next: 'END', fx: { startQuest: 'q_act5_blacklab_purge' } },
                { text: '"Wait on that."', next: 'hub' }
            ]
        },
        blacklab_turnin: {
            text: "Telemetry looks solid! How did you clear the Black-Site perimeter?",
            choices: [
                { text: '"Fought through their cryo detail."', next: 'END', fx: { complete: ['q_act5_blacklab_purge', 'combat'], setFlag: 'act5_blacklab_done' } },
                { text: '[TCH 7] "Spoofed the perimeter terminal cleanly."', req: { attr: ['TCH', 7] }, next: 'END', fx: { complete: ['q_act5_blacklab_purge', 'tech'], setFlag: 'act5_blacklab_done' } },
                { text: '[PRS 7] "Convinced the garrison to license it."', req: { attr: ['PRS', 7] }, next: 'END', fx: { complete: ['q_act5_blacklab_purge', 'social'], setFlag: 'act5_blacklab_done' } }
            ]
        }
    });

    // Calla: Act VI Meridian Core Finale
    injectTree('calla', [
        { text: '[ACT VI FINALE] "I am ready to confront the Meridian Containment Dome."', req: { quest: ['q_act6_meridian_finale', 'inactive'] }, next: 'act6_offer' },
        { text: '[ACT VI FINALE] "The Meridian Sovereign crisis is settled."', req: { stage: ['q_act6_meridian_finale', 'converge'] }, next: 'act6_turnin' }
    ], {
        act6_offer: {
            text: "The Meridian Sovereign wakes inside the Containment Dome. You can shatter its core, rewrite its containment lattice, or harmonize its pulse with the Helix.",
            choices: [
                { text: '"I\'ll enter Meridian Containment Dome."', next: 'END', fx: { startQuest: 'q_act6_meridian_finale' } },
                { text: '[PRS 8] "Teach me the Helix harmonic chant before I go."', req: { attr: ['PRS', 8] }, next: 'END', fx: { startQuest: 'q_act6_meridian_finale', setFlag: 'act6_harmonic_pact', xp: 120 } },
                { text: '"I need more preparation."', next: 'hub' }
            ]
        },
        act6_turnin: {
            text: "The Expanse itself exhales. What future did you choose for Meridian Core?",
            choices: [
                { text: '"Shattered the Sovereign forever. Humanity walks free."', next: 'END', fx: { complete: ['q_act6_meridian_finale', 'combat'], setFlag: 'act6_meridian_done' } },
                { text: '[TCH 8] "Contained the lattice under precision lockdown."', req: { attr: ['TCH', 8] }, next: 'END', fx: { complete: ['q_act6_meridian_finale', 'tech'], setFlag: 'act6_meridian_done' } },
                { text: '[PRS 8] "Harmonized Meridian & the Helix Shrine."', req: { attr: ['PRS', 8] }, next: 'END', fx: { complete: ['q_act6_meridian_finale', 'social'], setFlag: 'act6_meridian_done' } }
            ]
        }
    });

    // Eryndor: Dragonwilds Side
    injectTree('eryndor', [
        { text: '[SIDE] "What stirs at the Obsidian Vault Threshold?"', req: { quest: ['q_act6_dragon_pact', 'inactive'] }, next: 'dragon_offer' },
        { text: '[SIDE] "Vault Threshold scan complete."', req: { stage: ['q_act6_dragon_pact', 'return_eryndor'] }, next: 'dragon_turnin' }
    ], {
        dragon_offer: {
            text: "Abyssal resonance bleeds out of the Obsidian Vault Threshold. Purge its guardians, place a dampener, or preserve the ancient runes.",
            choices: [
                { text: '"I\'ll survey the Threshold."', next: 'END', fx: { startQuest: 'q_act6_dragon_pact' } },
                { text: '"Not today."', next: 'hub' }
            ]
        },
        dragon_turnin: {
            text: "Remarkable work near the Crater! How shall I log your methodology?",
            choices: [
                { text: '"Fought past the Obsidian gatekeepers."', next: 'END', fx: { complete: ['q_act6_dragon_pact', 'combat'], setFlag: 'act6_dragon_done' } },
                { text: '[TCH 8] "Stabilized resonance with a tech dampener."', req: { attr: ['TCH', 8] }, next: 'END', fx: { complete: ['q_act6_dragon_pact', 'tech'], setFlag: 'act6_dragon_done' } },
                { text: '[PRS 8] "Brokered joint Helix-Aegis archive preservation."', req: { attr: ['PRS', 8] }, next: 'END', fx: { complete: ['q_act6_dragon_pact', 'social'], setFlag: 'act6_dragon_done' } }
            ]
        }
    });

    /* ---------------------------------------------------- 4. Companions, Schedules & Territory */
    BO.OWRPGAct2 = {
        QUESTS: ACT2_QUESTS,
        DIALOGUE_INJECTIONS,
        validate() {
            const errors = [];
            const D = BO.OWRPGWorldData;
            for (const [id, q] of Object.entries(ACT2_QUESTS)) {
                if (q.giver && !BO.OWRPGDialogueData.TREES[q.giver]) errors.push(`${id}: missing giver ${q.giver}`);
                for (const [sid, st] of Object.entries(q.stages)) {
                    if (st.marker && D && !D.POIS.some((p) => p.id === st.marker)) errors.push(`${id}.${sid}: bad marker ${st.marker}`);
                    for (const [k, next] of Object.entries(st.on || {})) {
                        if (!q.stages[next]) errors.push(`${id}.${sid}: missing stage ${next}`);
                        const [type, val] = k.split(':');
                        if (type === 'item' && !SD.ITEMS[val]) errors.push(`${id}.${sid}: unknown item ${val}`);
                        if (type === 'kill' && !SD.ENEMIES[val]) errors.push(`${id}.${sid}: unknown enemy ${val}`);
                        if (type === 'discover' && D && !D.POIS.some((p) => p.id === val)) errors.push(`${id}.${sid}: unknown POI ${val}`);
                    }
                }
            }
            return { errors };
        },
        COMPANIONS: {
            soren: {
                id: 'soren',
                name: 'Vanguard Soren',
                role: 'Frontline Shieldbearer',
                faction: 'militia',
                flag: 'comp_soren_recruited',
                color: '#f5a623',
                weapon: 'm4a1_tech',
                dmgMult: 1.0,
                range: 34,
                cooldown: 1.05,
                auraLabel: '+12% Damage Resistance',
                aura: { dmgReduce: 0.12 },
                blurb: 'Freestead heavy vanguard. Draws aggression and bolsters nearby armor defense.'
            },
            kael: {
                id: 'kael',
                name: 'Ghost Kael',
                role: 'Aegis Recon Marksman',
                faction: 'aegis',
                flag: 'comp_kael_recruited',
                color: '#38bdf8',
                weapon: 'mk14',
                dmgMult: 1.25,
                range: 52,
                cooldown: 1.4,
                auraLabel: '+15% Weakspot Multiplier',
                aura: { critBonus: 0.15 },
                blurb: 'Alpine sniper operative. Picks off distant elites and sharpens tactical targeting.'
            },
            torque: {
                id: 'torque',
                name: 'Tinker Torque',
                role: 'Syndicate Tech Specialist',
                faction: 'syndicate',
                flag: 'comp_torque_recruited',
                color: '#a3e635',
                weapon: 'p90',
                dmgMult: 0.9,
                range: 28,
                cooldown: 0.85,
                auraLabel: '+15% Ability Haste & Field Regen',
                aura: { cdBonus: 0.15, regenPerSec: 2.0 },
                blurb: 'Rail Yard engineer. Accelerates Primer/Detonator cycles and repairs micro-wounds.'
            }
        },
        SCHEDULES: [
            { start: 600, end: 1199, id: 'morning', label: 'Dawn Shift · Vendors stocked & patrols deploying' },
            { start: 1200, end: 1899, id: 'day', label: 'Midday · Full frontier traffic & scouting' },
            { start: 1900, end: 2399, id: 'night', label: 'Nightfall · Settlements fortified & nocturnal brood active' },
            { start: 0, end: 599, id: 'night', label: 'Deep Night · Reduced visibility · stealth advantage' }
        ],
        TERRITORY_SHIFTS: [
            { flag: 'sprawl_syndicate_truce', poi: 'goliath', owner: 'syndicate', desc: 'Syndicate & Militia share Goliath Crane salvage' },
            { flag: 'quarry_aegis_hold', poi: 'quarry_camp', owner: 'aegis', desc: 'Aegis Directorate fortifies Quarry Dig Camp' },
            { flag: 'quarry_militia_hold', poi: 'quarry_camp', owner: 'militia', desc: 'Freestead Militia secures Quarry Dig Camp' },
            { flag: 'quarry_syndicate_hold', poi: 'quarry_camp', owner: 'syndicate', desc: 'Ironclad Syndicate runs Quarry ore logistics' },
            { flag: 'alpine_aegis_secured', poi: 'dish_ridge', owner: 'aegis', desc: 'Aegis holds Deep-Space Dish Ridge uplink' }
        ]
    };
})(window.BO);
;

/* --- src/data/OWRPGDiscoveryData.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Discovery Data
   Hidden-site archetypes, shrine blessings and the lore library read from
   tomes. Site placement is generated deterministically from terrain at
   runtime (OWRPGDiscoveries), so this file holds only definitions.
============================================================================ */
(function (BO) {
    'use strict';

    /* Per region: how many of each site to scatter. 12 regions × 13 = 156 sites. */
    const PER_REGION = { cache: 4, tome: 2, shrine: 1, shard: 2, vista: 1, cairn: 2, altar: 1 };

    const TYPES = {
        cache: {
            name: 'Treasure Cache', icon: '✦', color: '#fbbf24', xp: 40, skill: ['delving', 30],
            prompt: 'Open Treasure Cache', model: 'pixel_fantasy/pixel-fantasy-treasure-chest.glb', fit: [1.3, 1.0, 1.0],
            sound: ['rpg_sfx/creak1.ogg', 'rpg_sfx/handleCoins.ogg'],
            desc: 'Buried strongboxes from before the Fall. Each holds credits, Pre-Fall coins and a chance at gear.'
        },
        tome: {
            name: 'Lore Tome', icon: '❦', color: '#e9c46a', xp: 30, skill: ['arcana', 35],
            prompt: 'Read Lore Tome', model: 'mini_dungeon_kit/table.glb', fit: [1.4, 0.95, 0.9],
            sound: ['rpg_sfx/bookOpen.ogg', 'rpg_sfx/bookFlip1.ogg'],
            desc: 'Field journals, sermons and black-box transcripts that piece together what broke the Meridian.'
        },
        shrine: {
            name: 'Wayside Shrine', icon: '✧', color: '#5eead4', xp: 25, skill: ['foraging', 25], cooldown: 600,
            prompt: 'Pray at Wayside Shrine', model: 'pixel_fantasy/pixel-fantasy-root-entangled-wayside-shrine.glb', fit: [1.8, 2.4, 1.8],
            sound: ['overhaul/stingers/chime_positive.wav'],
            desc: 'Grants a 5-minute blessing. Shrines can be used again every 10 minutes.'
        },
        shard: {
            name: 'Skill Shard', icon: '◈', color: '#a78bfa', xp: 35, skill: null,
            prompt: 'Absorb Skill Shard', model: null, fit: null,
            sound: ['sfx/Digital Audio (Kenney)/Audio/powerUp3.ogg'],
            desc: 'Crystallised memories of a craft. Absorbing one grants a large burst of Mastery XP.'
        },
        vista: {
            name: 'Survey Vista', icon: '⛰', color: '#38bdf8', xp: 80, skill: ['exploration', 120], revealR: 260,
            prompt: 'Synchronise Survey Vista', model: 'castle_kit/flag-banner-long.glb', fit: [1.2, 4.6, 0.5],
            sound: ['overhaul/stingers/level_complete.wav'],
            desc: 'High ground with a surveyor\'s beacon. Synchronising charts a wide area of the map at once.'
        },
        cairn: {
            name: 'Hidden Stash', icon: '▲', color: '#a8a29e', xp: 30, skill: ['mining', 25],
            prompt: 'Search Hidden Stash', model: 'mini_dungeon_kit/stones.glb', fit: [1.6, 0.9, 1.6],
            sound: ['rpg_sfx/handleSmallLeather.ogg'],
            desc: 'Rock cairns hiding a smuggler\'s stash. Good odds of rare gear.'
        },
        altar: {
            name: 'Altar of Trials', icon: '☗', color: '#f43f5e', xp: 150, skill: ['slayer', 140],
            prompt: 'Invoke the Altar of Trials', model: 'pixel_fantasy/pixel-fantasy-carved-weathered-limestone-ritual-altar.glb', fit: [2.2, 1.4, 1.6],
            sound: ['sfx/Impact Sounds (Kenney)/Audio/impactBell_heavy_000.ogg'],
            desc: 'Summons a Champion of the region with two of its retinue. Slay the Champion to claim the altar\'s reward.'
        }
    };

    /* Shrine blessings: fx keys are read by OWRPGCharacter.perkFx (s.player.blessing). */
    const BLESSINGS = [
        { id: 'b_hunter', name: "Hunter's Blessing", color: '#f97316', desc: '+15% weapon damage and +10% critical chance.', fx: { allDmgMult: 0.15, bonusCritChance: 0.10 } },
        { id: 'b_warden', name: "Warden's Blessing", color: '#38bdf8', desc: '+25 armor and +40 max HP.', fx: { armor: 25, maxHp: 40 } },
        { id: 'b_scholar', name: "Scholar's Blessing", color: '#c084fc', desc: '+25% character XP and +25% Mastery XP.', fx: { xpMult: 0.25, skillXpMult: 0.25 } },
        { id: 'b_wind', name: 'Blessing of the Wind', color: '#5eead4', desc: '+15% movement speed and -30% movement noise.', fx: { speedMult: 0.15, noise: -0.30 } },
        { id: 'b_ember', name: 'Ember Blessing', color: '#fb923c', desc: 'Every 4th firearm hit applies Burn.', fx: { nthBurn: 4 } },
        { id: 'b_frost', name: 'Frost Blessing', color: '#7dd3fc', desc: 'Every 4th firearm hit applies Chill and +15% elemental resistance.', fx: { nthChill: 4, allElemRes: 0.15 } },
        { id: 'b_fortune', name: 'Blessing of Fortune', color: '#fde047', desc: '+40% credits found and +30% cache bonus-item chance.', fx: { creditFind: 0.40, cacheLuck: 0.30 } },
        { id: 'b_slayer', name: "Slayer's Blessing", color: '#f43f5e', desc: '+25% damage to beasts, bosses and Champions.', fx: { monsterDmg: 0.25, champDmg: 0.25 } }
    ];
    const BLESSING_SEC = 300;

    /* Original lore for the Meridian Expanse. Tomes pick an entry by region first, then any unread. */
    const LORE = [
        { id: 'l_fall', region: 'haven_basin', title: 'The Night the Dome Went Dark', text: 'Pump Three\'s logbook stops mid-sentence. The last line reads: "Core pressure off the gauge, every light in the basin flickering in time with it, like a heartbeat." Nobody in Haven remembers who wrote it.' },
        { id: 'l_freestead', region: 'haven_basin', title: 'Freestead Charter', text: 'We claim no land beyond the walls we can defend and no water beyond the wells we dig. Any traveller who raises no weapon inside the gate eats at our table. — signed by the eleven families of Freestead.' },
        { id: 'l_pines', region: 'whispering_woods', title: 'Ranger\'s Notebook, Page 9', text: 'The pines hum at night. Not wind. A low tone, felt in the teeth. The wolves go quiet when it starts and the poachers pack up and leave. I am staying to find the source.' },
        { id: 'l_puglins', region: 'whispering_woods', title: 'On the Hoarding of Puglins', text: 'They steal anything that shines: lenses, shell casings, wedding rings. Follow a fat one home and you will find a burrow lined with a decade of lost treasure. Bring a shotgun. They bite.' },
        { id: 'l_syndicate', region: 'rust_sprawl', title: 'Syndicate Ledger (Torn)', text: 'Water futures up 400% since the pumps failed. Recommend we keep at least one pump failing. Scarcity is a resource. — M.O.' },
        { id: 'l_crane', region: 'rust_sprawl', title: 'Goliath Crane Safety Placard', text: 'MAXIMUM LOAD 900 TONNES. Someone has scratched underneath: "Maximum load reached 14 March. It was carrying the old reactor lid. Then the lid started carrying it."' },
        { id: 'l_barrow', region: 'barrow_moor', title: 'Sexton\'s Lament', text: 'We buried them deep and sang them down, as our grandmothers taught us. Since the Fall the songs no longer hold. The dead walk the moor at moonrise and they hum the same low tone as the pines.' },
        { id: 'l_vampire', region: 'barrow_moor', title: 'The Nightlord\'s Bargain', text: 'It offered the village safety from the walking dead in exchange for one guest a month. The village agreed. In a year there were no guests left, and then there was no village.' },
        { id: 'l_mire', region: 'mire_delta', title: 'Brood Containment Memo', text: 'Specimens are NOT reacting to cold. They are reacting to the hum. Recommend all field teams carry tone generators. Recommend we stop pretending we know what we released.' },
        { id: 'l_barge', region: 'mire_delta', title: 'Bargemaster\'s Last Entry', text: 'Fog so thick the lanterns drowned. Something knocked on the hull three times, waited, then knocked three more. The crew wants to turn back. I want to know what is knocking.' },
        { id: 'l_quarry', region: 'ash_quarry', title: 'Quarry Truce Terms', text: 'Militia hold the north benches by day. Syndicate hold the south pits by night. Neither side fires on the ore trains. The truce lasted nine days. The ore trains are still running, with nobody aboard.' },
        { id: 'l_mesa', region: 'sunscorched_badlands', title: 'The Sunfang Inscriptions', text: 'Older than the Meridian. Older than the cities. The glyphs describe a crown of light falling from the sky and a guardian built to stand watch beneath it until the light returned.' },
        { id: 'l_scorpion', region: 'sunscorched_badlands', title: 'Prospector\'s Warning', text: 'If the sand is warm at midnight, walk away. That is the dune scorpions breathing underneath you, a hundred of them, waiting for something heavy enough to be worth surfacing for.' },
        { id: 'l_coast', region: 'sunken_coast', title: 'Harbourmaster\'s Tide Table', text: 'The tide no longer follows the moon. It follows the Core. When the dome pulses, the sea draws back half a mile and the drowned corsairs walk out across the seabed to whatever is calling them.' },
        { id: 'l_siren', region: 'sunken_coast', title: 'The Siren\'s Song (Transcribed)', text: 'It is not a song. It is the hum, slowed down and given a voice. Every sailor who heard it describes it as their mother calling them home for supper.' },
        { id: 'l_aegis', region: 'alpine_array', title: 'Aegis Directive 77', text: 'The Array is not a weapon. The Array is a lid. Under no circumstances is the Array to be powered down, regardless of the cost to surrounding settlements. Acknowledge and destroy.' },
        { id: 'l_frost', region: 'frostfang_peaks', title: 'Frost Knight\'s Oath', text: 'We swore to hold the pass until the thaw. The thaw has not come in eleven years. Our armour has frozen to our skin and our oath has frozen to our souls. We hold.' },
        { id: 'l_troll', region: 'frostfang_peaks', title: 'Glacier Survey Core #4', text: 'Ice layer dated to the Fall contains intact biological tissue at a depth of 40 metres. The tissue is warm. The tissue is growing. Abandoning the drill site.' },
        { id: 'l_helix', region: 'meridian_core', title: 'Helix Sermon of the Open Door', text: 'The Core is not broken. The Core is opening. What the Aegis call a catastrophe we call a door, and every door is an invitation. Will you be standing at the threshold when it swings wide?' },
        { id: 'l_core', region: 'meridian_core', title: 'Engineer\'s Final Diagnostic', text: 'Containment field at 3%. Output at 4000% of rated. The hum is the field failing at a frequency the human ear can almost hear. When it stops humming, run.' },
        { id: 'l_dragons', region: 'obsidian_dragonwilds', title: 'The Ashfall Chronicle', text: 'The drakes came after the crown of light fell. They nest in the obsidian because nothing else can bear the heat of their sleep. Their elders remember the sky before the Meridian, and they are not grateful.' },
        { id: 'l_juggernaut', region: 'obsidian_dragonwilds', title: 'Cult of the Obsidian Flame', text: 'We feed the Juggernaut the ore of the fallen crown and it grows. When it is tall enough to touch the sky, the crown will return to it, and the drakes will kneel. So it is written. So we build.' },
        { id: 'l_militia', region: null, title: 'Militia Recruitment Poster', text: 'HAVEN NEEDS YOU. Clean water. Hot meals. A wall at your back and a rifle in your hands. Report to Warden Kessler. Bring your own boots.' },
        { id: 'l_cartographer', region: null, title: 'The Cartographers\' Guild Creed', text: 'Every map is a promise that the world can be known. Walk where no one has walked, write down what you see, and leave the next traveller a little less lost than you were.' }
    ];

    BO.OWRPGDiscoveryData = { PER_REGION, TYPES, BLESSINGS, BLESSING_SEC, LORE };
})(window.BO);
;

/* --- src/owrpg/OWRPGSave.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Versioned Save Slots
   All Open World RPG state lives in BO.Save.data.owrpg. Three character slots
   of compact deltas. migrate() upgrades older schemas and backfills new
   multi-slot armor, durability, mounts, codex, and bounty keys before boot.
============================================================================ */
(function (BO) {
    'use strict';

    const SCHEMA_VERSION = 4;
    const SLOT_COUNT = 3;

    const clone = (o) => JSON.parse(JSON.stringify(o));

    function defaultSlot(opts = {}) {
        const SD = BO.OWRPGStatsData;
        const attrs = {};
        for (const id of SD.ATTR_IDS) attrs[id] = (opts.attrs && opts.attrs[id]) || SD.ATTR_BASE;
        const sp = BO.MapsData.MAPS.meridian.playerSpawn;
        return {
            id: 'slot_' + (opts.index || 0),
            timestamp: Date.now(),
            playtimeSec: 0,
            worldSeed: 884120,
            worldClock: 760,
            weatherId: 'clear',
            difficulty: opts.difficulty || 'tactical',
            player: {
                name: (opts.name || 'MERCER').toUpperCase().slice(0, 16),
                pos: [sp.x, null, sp.z], yaw: sp.yaw, interiorId: null,
                hp: null, level: 1, xp: 0, credits: 60, relayCells: 1,
                attrs, attrPoints: 0, perkPoints: 0, perks: [], respecCount: 0,
                abilities: { primer: 'cryo_dart', detonator: 'arc_lash', gadget: 'med_injector', ultimate: 'orbital_barrage' },
                equipped: { primary: null, secondary: null, helmet: null, rig: null, boots: null, relic: null, tool: null },
                inventory: [], stash: [], nextUid: 1,
                mounts: { owned: [], active: null },
                skills: Object.fromEntries(Object.keys(SD.SKILLS).map(id => [id, { level: 1, xp: 0 }])),
                standingStone: null,
                blessing: null,
                unlockedPowers: ['cryo_dart', 'arc_lash', 'med_injector'],
                codex: { enemies: {}, elements: {}, unlocksClaimed: [] },
                bounties: { active: null, completed: 0, progress: 0 }
            },
            factions: Object.assign({}, BO.OWRPGFactionsData.START_REP),
            poiStates: {},
            quests: {},
            worldFlags: { compassEnabled: opts.compass !== false, compassQuest: true, minimapEnabled: opts.minimap !== false, minimapNorthUp: false, trackedQuests: [] },
            // Cartography + Discoveries: explored is a base64 bitset over a 64×64 grid; found maps site id → playtime.
            atlas: { explored: '', found: {}, shrineT: {}, champions: 0, trials: 0 },
            pylons: { py_freestead: true },
            pins: [],
            pityCounter: 0,
            stats: { kills: 0, deaths: 0, reactions: 0, sneakKills: 0, discovered: 0, eventsCleared: 0 }
        };
    }

    function fill(target, def) {
        for (const k of Object.keys(def)) {
            if (target[k] === undefined || (target[k] === null && def[k] !== null)) target[k] = clone(def[k]);
            else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof target[k] === 'object' && !Array.isArray(target[k])) fill(target[k], def[k]);
        }
        return target;
    }

    function backfillItems(slot) {
        const SD = BO.OWRPGStatsData;
        const durTypes = { weapon: 1, rig: 1, helmet: 1, boots: 1, relic: 1, tool: 1 };
        const lists = [slot.player.inventory, slot.player.stash];
        for (const list of lists) {
            if (!Array.isArray(list)) continue;
            for (const e of list) {
                const d = SD.ITEMS[e.id];
                if (!d || !durTypes[d.type]) continue;
                if (e.maxDur == null) {
                    const gs = d.type === 'weapon' && BO.OWRPGGunStats ? BO.OWRPGGunStats[d.base] : null;
                    e.maxDur = d.maxDur || (gs && gs.maxDurability) || 120;
                }
                if (e.dur == null) e.dur = e.maxDur;
            }
        }
    }

    const Save = {
        SCHEMA_VERSION, SLOT_COUNT, defaultSlot,

        root() {
            const d = BO.Save.data;
            if (!d.owrpg || typeof d.owrpg !== 'object') d.owrpg = { schemaVersion: SCHEMA_VERSION, activeSlot: 0, slots: [] };
            const r = d.owrpg;
            if (!Array.isArray(r.slots)) r.slots = [];
            while (r.slots.length < SLOT_COUNT) r.slots.push(null);
            if ((Number(r.migrated) || 0) < SCHEMA_VERSION) { this.migrate(r); r.migrated = SCHEMA_VERSION; }
            return r;
        },

        migrate(raw) {
            const upgraders = {
                1: (r) => {
                    for (const s of r.slots || []) {
                        if (!s || typeof s !== 'object') continue;
                        if (s.player && s.player.equipped) {
                            if (s.player.equipped.helmet === undefined) s.player.equipped.helmet = null;
                            if (s.player.equipped.boots === undefined) s.player.equipped.boots = null;
                            if (s.player.equipped.relic === undefined) s.player.equipped.relic = null;
                            if (s.player.equipped.tool === undefined) s.player.equipped.tool = null;
                        }
                    }
                }
            };
            let v = Number(raw.schemaVersion) || 1;
            while (v < SCHEMA_VERSION) { if (upgraders[v]) upgraders[v](raw); v++; }
            raw.schemaVersion = SCHEMA_VERSION;
            raw.slots = (raw.slots || []).map((s, i) => {
                if (!s || typeof s !== 'object') return null;
                fill(s, defaultSlot({ index: i }));
                backfillItems(s);
                return s;
            });
            return raw;
        },

        list() { return this.root().slots.map((s, i) => s ? { index: i, name: s.player.name, level: s.player.level, playtimeSec: s.playtimeSec, timestamp: s.timestamp } : null); },

        read(i) { const s = this.root().slots[i]; return s ? clone(s) : null; },

        write(i, slot) {
            const r = this.root();
            slot.timestamp = Date.now();
            r.slots[i] = clone(slot);
            r.activeSlot = i;
            BO.Save.save();
        },

        remove(i) { const r = this.root(); r.slots[i] = null; BO.Save.save(); },

        byteSize() { return JSON.stringify(this.root()).length; }
    };

    BO.OWRPGSave = Save;
})(window.BO);
;

/* --- src/owrpg/OWRPGCharacter.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Character (attributes, XP, perks, armor sets)
   Preserves starter formulas verified by _qa_owrpg.html:
     maxHp = 60 + 8 * BRW (+ perks + non-starter gear)
     maxWeight = 35 + 6 * BRW (+ perks + non-starter gear)
     critMult = 1 + 0.50 + 0.045 * PRC (+ perks + non-starter gear)
============================================================================ */
(function (BO) {
    'use strict';

    const SD = () => BO.OWRPGStatsData;
    const EX = () => BO.OWRPGExpansionData;
    const ARMOR_RARITY = { common: 1.0, rare: 1.25, epic: 1.55, legendary: 1.9 };
    const ARMOR_SLOTS = ['helmet', 'rig', 'boots', 'relic'];

    const Char = {
        attr(s, id) { return s.player.attrs[id] || 5; },

        perkFx(s) {
            const idx = SD().perkIndex();
            const out = {};
            for (const id of s.player.perks) {
                const e = idx[id];
                if (!e) continue;
                for (const [k, v] of Object.entries(e.perk.fx)) out[k] = (out[k] || 0) + v;
            }
            const stone = SD().STANDING_STONES[s.player.standingStone];
            if (stone) for (const [k, v] of Object.entries(stone.fx)) out[k] = (out[k] || 0) + v;
            const rank = id => Math.max(0, this.skill(s, id).level - 1);
            const add = (key, value) => { out[key] = (out[key] || 0) + value; };
            if ((s.worldFlags.xpBoostUntil || 0) > s.playtimeSec) add('xpMult', 0.3);
            add('allDmgMult', rank('combat') * 0.005);
            add('monsterDmg', rank('slayer') * 0.006);
            add('creditFind', rank('delving') * 0.008);
            add('medMult', rank('foraging') * 0.006);
            add('gatherChance', rank('foraging') * 0.006);
            add('salvage', rank('mining') * 0.007);
            add('durSave', rank('mining') * 0.007);
            add('arcanaDmg', rank('arcana') * 0.006);
            add('speedMult', rank('exploration') * 0.002);
            add('discoveryXp', rank('exploration') * 0.01);
            // Timed shrine blessing (Discoveries): fx bundle that expires on playtime.
            const bl = s.player.blessing;
            if (bl && bl.until > s.playtimeSec && bl.fx) for (const [k, v] of Object.entries(bl.fx)) add(k, v);
            return out;
        },

        skill(s, id) {
            const skills = s.player.skills || (s.player.skills = {});
            return skills[id] || (skills[id] = { level: 1, xp: 0 });
        },

        addSkillXp(s, id, amount) {
            if (!SD().SKILLS[id] || !Number.isFinite(amount) || amount <= 0) return 0;
            const sk = this.skill(s, id);
            if (sk.level >= SD().SKILL_CAP) return 0;
            sk.xp += Math.round(amount * (1 + (this.perkFx(s).skillXpMult || 0)));
            let levels = 0;
            while (sk.level < SD().SKILL_CAP && sk.xp >= SD().skillXpToNext(sk.level)) {
                sk.xp -= SD().skillXpToNext(sk.level);
                sk.level++;
                levels++;
            }
            if (sk.level >= SD().SKILL_CAP) sk.xp = 0;
            if (levels) BO.Events.emit('hud:toast', { text: SD().SKILLS[id].name + ' advanced to ' + sk.level, color: SD().SKILLS[id].color });
            return levels;
        },

        /** Compute active 2-piece & 3-piece Set Bonuses and summed armor stats. */
        gearStats(s) {
            const inv = BO.OWRPGInventory;
            const Dur = BO.OWRPGDurability;
            const counts = {};
            const elemRes = { burn: 0, chill: 0, shock: 0, venom: 0, void: 0 };
            const bonus = { armor: 0, maxHp: 0, carry: 0, critAdd: 0, cdr: 0, statusPotency: 0, noise: 0, speedMult: 0, meleeMult: 0, stealthMult: 0, detHeal: 0, reactMult: 0, heavyPen: 0, heavyDmg: 0, chain: 0 };

            if (inv) {
                for (const slot of ARMOR_SLOTS) {
                    const entry = inv.equippedEntry(s, slot);
                    if (!entry) continue;
                    const def = SD().ITEMS[entry.id];
                    if (!def) continue;
                    const rar = ARMOR_RARITY[entry.rarity || def.rarity || 'common'] || 1.0;
                    const perf = Dur ? Dur.performanceMult(entry) : 1.0;
                    bonus.armor += Math.round((def.armor || 0) * rar * perf);
                    if (def.elemRes) {
                        for (const [el, v] of Object.entries(def.elemRes)) elemRes[el] = (elemRes[el] || 0) + v * perf;
                    }
                    if (def.stats) {
                        for (const [k, v] of Object.entries(def.stats)) bonus[k] = (bonus[k] || 0) + v * perf;
                    }
                    if (def.setId) counts[def.setId] = (counts[def.setId] || 0) + 1;
                }
            }

            const activeSets = [];
            const setsData = EX() ? EX().ARMOR_SETS : {};
            for (const [setId, n] of Object.entries(counts)) {
                const setDef = setsData[setId];
                if (!setDef) continue;
                const applyTier = (b) => {
                    if (!b) return;
                    for (const [k, v] of Object.entries(b)) {
                        if (k === 'label') continue;
                        if (k === 'allElemRes') {
                            for (const el of Object.keys(elemRes)) elemRes[el] += v;
                        } else {
                            bonus[k] = (bonus[k] || 0) + v;
                        }
                    }
                };
                const tiers = [];
                if (n >= 2) { applyTier(setDef.bonus2); tiers.push(setDef.bonus2.label); }
                if (n >= 3) { applyTier(setDef.bonus3); tiers.push(setDef.bonus3.label); }
                activeSets.push({ id: setId, name: setDef.name, color: setDef.color, count: n, tiers });
            }

            for (const el of Object.keys(elemRes)) elemRes[el] = Math.min(0.75, elemRes[el]);
            return { bonus, elemRes, activeSets };
        },

        derived(s) {
            const a = (id) => this.attr(s, id);
            const fx = this.perkFx(s);
            const gs = this.gearStats(s);
            const gb = gs.bonus;
            const maxWeight = 35 + 6 * a('BRW') + (fx.carry || 0) + Math.round(gb.carry || 0);
            const mergedFx = Object.assign({}, fx);
            for (const k of ['detHeal', 'reactMult', 'heavyPen', 'heavyDmg', 'chain']) {
                if (gb[k]) mergedFx[k] = (mergedFx[k] || 0) + gb[k];
            }
            for (const el of Object.keys(gs.elemRes)) gs.elemRes[el] = Math.min(0.75, gs.elemRes[el] + (fx.allElemRes || 0));
            return {
                maxHp: Math.round(60 + 8 * a('BRW') + (fx.maxHp || 0) + (gb.maxHp || 0)),
                maxWeight,
                armor: Math.round((gb.armor || 0) + (fx.armor || 0)),
                meleeMult: 1 + 0.06 * (a('BRW') - 5) + (gb.meleeMult || 0),
                adsMult: 1 + 0.035 * (a('RFX') - 5),
                spreadMult: Math.max(0.6, 1 - 0.03 * (a('RFX') - 5)),
                dodgeWindow: 0.25 + 0.025 * a('RFX'),
                cdMult: Math.max(0.35, (1 - 0.04 * (a('TCH') - 5)) * (1 - (fx.cdr || 0)) * (1 - (gb.cdr || 0))),
                statusPotency: 1 + 0.07 * (a('TCH') - 5) + (gb.statusPotency || 0) + (fx.statusPotency || 0),
                statusDur: 1 + (fx.statusDur || 0) + 0.07 * (a('TCH') - 5),
                critMult: 1 + 0.5 + 0.045 * a('PRC') + (fx.critAdd || 0) + (gb.critAdd || 0),
                noiseMult: Math.max(0.25, (1 - 0.04 * (a('PRC') - 5)) * (1 + (fx.noise || 0) + (gb.noise || 0))),
                trapRadius: 2.5 * a('PRC'),
                buyMult: Math.max(0.6, 1 - 0.035 * (a('PRS') - 5)),
                sellMult: 0.35 * (1 + 0.035 * (a('PRS') - 5)),
                repMult: 1 + 0.08 * (a('PRS') - 5),
                stealthMult: 2.25 + (fx.stealthMult || 0) + (gb.stealthMult || 0),
                detectSlow: fx.detectSlow || 0,
                gearSpeedMult: 1 + (gb.speedMult || 0) + (fx.speedMult || 0),
                elemRes: gs.elemRes,
                activeSets: gs.activeSets,
                fx: mergedFx
            };
        },

        xpToNext(s) { return SD().xpToNext(s.player.level); },

        addXp(s, amount) {
            const p = s.player;
            const cap = SD().LEVEL_CAP;
            if (p.level >= cap) return 0;
            p.xp += Number.isFinite(amount) ? Math.max(0, Math.round(amount * (1 + (this.perkFx(s).xpMult || 0)))) : 0;
            let gained = 0;
            while (p.level < cap && p.xp >= SD().xpToNext(p.level)) {
                p.xp -= SD().xpToNext(p.level);
                p.level++;
                gained++;
                if (p.level % 2 === 0) p.perkPoints++;
                else if (p.level >= 3) p.attrPoints++;
            }
            if (p.level >= cap) p.xp = 0;
            return gained;
        },

        killXpMult(s, enemyLvl) { return s.player.level - enemyLvl >= 5 ? 0.25 : 1; },

        raiseAttr(s, id) {
            const p = s.player;
            if (p.attrPoints <= 0 || this.attr(s, id) >= SD().ATTR_MAX) return false;
            p.attrs[id]++;
            p.attrPoints--;
            return true;
        },

        perkBlock(s, perkId) {
            const e = SD().perkIndex()[perkId];
            if (!e) return 'Unknown perk';
            const p = s.player;
            if (p.perks.includes(perkId)) return 'Owned';
            const tree = SD().PERK_TREES[e.tree];
            const pair = tree.tiers[e.tier];
            if (pair.some((pk) => pk.id !== perkId && p.perks.includes(pk.id))) return 'Locked by choice';
            const need = SD().TIER_LEVELS[e.tier];
            if (p.level < need) return 'Requires level ' + need;
            if (e.tier > 0 && !tree.tiers[e.tier - 1].some((pk) => p.perks.includes(pk.id))) return 'Requires previous tier';
            if (p.perkPoints <= 0) return 'No perk points';
            return '';
        },

        takePerk(s, perkId) {
            if (this.perkBlock(s, perkId)) return false;
            s.player.perks.push(perkId);
            s.player.perkPoints--;
            return true;
        },

        respecCost(s) { return 150 * (s.player.respecCount || 0); },

        respec(s) {
            const cost = this.respecCost(s);
            if (s.player.credits < cost) return false;
            s.player.credits -= cost;
            s.player.perkPoints += s.player.perks.length;
            s.player.perks = [];
            s.player.respecCount = (s.player.respecCount || 0) + 1;
            return true;
        },

        powerUnlocked(s, id) {
            const rule = EX()?.POWER_UNLOCKS?.[id];
            if (!rule) return true;
            if (s.player.unlockedPowers && s.player.unlockedPowers.includes(id)) return true;
            return !!rule.check(s);
        },

        encumbrance(s) {
            const d = this.derived(s);
            const w = BO.OWRPGInventory ? BO.OWRPGInventory.weight(s) : 0;
            const r = w / d.maxWeight;
            const band = r <= 0.7 ? 'light' : r <= 1 ? 'normal' : r <= 1.3 ? 'heavy' : 'over';
            const FX = {
                light: { speed: 1.05, noise: 0.85, stamina: 1, dodge: true, label: 'Light' },
                normal: { speed: 1, noise: 1, stamina: 1, dodge: true, label: 'Normal' },
                heavy: { speed: 0.75, noise: 1.35, stamina: 1.4, dodge: true, label: 'Heavy' },
                over: { speed: 0.55, noise: 1.6, stamina: 2, dodge: false, label: 'Overburdened' }
            };
            return Object.assign({ weight: w, max: d.maxWeight, ratio: r, band }, FX[band]);
        }
    };

    BO.OWRPGCharacter = Char;
})(window.BO);
;

/* --- src/owrpg/OWRPGFactions.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Faction Reputation & Hostility
   Reputation in [-1000, +1500]. Gains are scaled by Presence; the rival
   faction loses SPILLOVER × the raw change (only on gains). Raiders and the
   Brood are always hostile. Contested POIs record an owner in poiStates.
============================================================================ */
(function (BO) {
    'use strict';

    const FD = () => BO.OWRPGFactionsData;

    const Factions = {
        rep(s, f) { return s.factions[f] || 0; },

        tier(s, f) {
            const r = this.rep(s, f);
            let t = FD().TIERS[0];
            for (const tier of FD().TIERS) if (r >= tier.min) t = tier;
            return t;
        },

        /** Change reputation. Returns the applied delta for the main faction. */
        add(s, f, amount, opts = {}) {
            if (!FD().FACTIONS[f] || !amount) return 0;
            const before = this.tier(s, f).id;
            let delta = amount;
            if (delta > 0 && !opts.raw) delta *= BO.OWRPGCharacter.derived(s).repMult;
            delta = Math.round(delta);
            s.factions[f] = BO.Math.clamp(this.rep(s, f) + delta, FD().REP_MIN, FD().REP_MAX);
            // Sworn locks out the rival's Sworn tier.
            const rival = FD().FACTIONS[f].rival;
            if (delta > 0 && rival && !opts.noSpill) {
                s.factions[rival] = BO.Math.clamp(this.rep(s, rival) - Math.round(amount * FD().SPILLOVER), FD().REP_MIN, FD().REP_MAX);
            }
            if (this.tier(s, f).id === 'sworn' && rival && this.rep(s, rival) >= 750) s.factions[rival] = 749;
            const after = this.tier(s, f).id;
            BO.Events.emit('owrpg:rep', { faction: f, delta, tierChanged: before !== after, tier: after });
            return delta;
        },

        /** Hostile to the player? groups: raiders/brood always; factions when Hated, or a provoked flag. */
        isHostile(s, group) {
            if (FD().HOSTILE_GROUPS.includes(group)) return true;
            if (!FD().FACTIONS[group]) return false;
            if (s.worldFlags['provoked_' + group]) return true;
            return this.tier(s, group).id === 'hated';
        },

        /** Shunned factions warn, then open fire if you linger inside 12 m. */
        isWary(s, group) { return !!FD().FACTIONS[group] && this.tier(s, group).id === 'shunned'; },

        vendorDiscount(s, f) { const d = FD().TIER_DISCOUNT[this.tier(s, f).id]; return d === null ? null : d; },

        canTrade(s, vendorId) {
            const v = FD().VENDORS[vendorId];
            if (!v) return false;
            return this.vendorDiscount(s, v.faction) !== null && !this.isHostile(s, v.faction);
        },

        /** Killing a faction member costs rep with them and earns a little with their rival. */
        onFactionKill(s, f) {
            if (!FD().FACTIONS[f]) return;
            this.add(s, f, -60, { noSpill: true });
            const rival = FD().FACTIONS[f].rival;
            if (rival) this.add(s, rival, 15, { noSpill: true });
        },

        poiOwner(s, poi) {
            const st = s.poiStates[poi.id];
            return (st && st.owner) || poi.faction || null;
        },

        setPoiOwner(s, poiId, owner) {
            const st = s.poiStates[poiId] || (s.poiStates[poiId] = {});
            if (st.owner === owner) return;
            st.owner = owner;
            BO.Events.emit('owrpg:territory', { poi: poiId, owner });
        }
    };

    BO.OWRPGFactions = Factions;
})(window.BO);
;

/* --- src/owrpg/OWRPGDurability.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Equipment Durability & Field Pickups/Tools
   Tracks dur/maxDur on weapons, armor slots (helmet/rig/boots/relic), and
   field tools. Degrades gradually on use, never bricks cleanly (reduced
   performance at 0 until repaired via Field Repair Kit or Pip-Pad Workbench).
============================================================================ */
(function (BO) {
    'use strict';

    const DUR_TYPES = { weapon: 1, rig: 1, helmet: 1, boots: 1, relic: 1, tool: 1 };
    const UP = new THREE.Vector3(0, 1.2, 0);

    const Dur = {
        supports(type) { return !!DUR_TYPES[type]; },

        initItem(entry) {
            if (!entry) return entry;
            const SD = BO.OWRPGStatsData;
            const d = SD.ITEMS[entry.id];
            if (!d || !DUR_TYPES[d.type]) return entry;
            if (entry.maxDur == null) {
                const gs = d.type === 'weapon' && BO.OWRPGGunStats ? BO.OWRPGGunStats[d.base] : null;
                entry.maxDur = d.maxDur || (gs && gs.maxDurability) || 120;
            }
            if (entry.dur == null) entry.dur = entry.maxDur;
            return entry;
        },

        ratio(entry) {
            if (!entry || !entry.maxDur) return 1;
            return Math.max(0, Math.min(1, (entry.dur ?? entry.maxDur) / entry.maxDur));
        },

        /** Reduced performance at 0 durability (55%), slight wear below 25% (85%), full above 25%. */
        performanceMult(entry) {
            if (!entry || entry.maxDur == null) return 1;
            const r = this.ratio(entry);
            if (r <= 0) return 0.55;
            if (r <= 0.25) return 0.85;
            return 1.0;
        },

        badgeColor(r) {
            if (r <= 0) return '#ef4444';
            if (r <= 0.25) return '#f97316';
            if (r <= 0.6) return '#facc15';
            return '#4ade80';
        },

        degrade(s, entry, amount = 0.25) {
            if (!entry) return;
            this.initItem(entry);
            if (entry.maxDur == null || entry.dur <= 0) return;
            amount *= 1 - Math.min(0.8, BO.OWRPGCharacter.perkFx(s).durSave || 0);
            const prev = entry.dur;
            entry.dur = Math.max(0, Number((entry.dur - amount).toFixed(2)));
            const d = BO.OWRPGStatsData.ITEMS[entry.id];
            const name = d ? d.name : entry.id;
            if (prev > entry.maxDur * 0.25 && entry.dur <= entry.maxDur * 0.25 && entry.dur > 0) {
                BO.Events.emit('hud:toast', { text: `${name} durability low (${Math.round(this.ratio(entry) * 100)}%)`, color: '#f97316' });
            } else if (prev > 0 && entry.dur <= 0) {
                BO.Events.emit('hud:toast', { text: `${name} worn out — reduced performance until repaired`, color: '#ef4444' });
            }
        },

        repairCost(s, entry) {
            if (!entry) return 0;
            this.initItem(entry);
            if (entry.maxDur == null || entry.dur >= entry.maxDur) return 0;
            const missing = entry.maxDur - entry.dur;
            const tch = BO.OWRPGCharacter ? BO.OWRPGCharacter.attr(s, 'TCH') : 5;
            const disc = Math.max(0.55, 1 - (tch - 5) * 0.05);
            return Math.max(4, Math.ceil(missing * 0.65 * disc));
        },

        repairItem(s, uid, mode = 'credits') {
            const I = BO.OWRPGInventory;
            const e = I.byUid(s, uid);
            if (!e) return 'Item not found';
            this.initItem(e);
            if (e.maxDur == null || e.dur >= e.maxDur) return 'Already at full durability';
            if (mode === 'kit') {
                const kit = s.player.inventory.find((x) => x.id === 'tool_field_repair' && (x.dur == null || x.dur > 0));
                if (!kit) return 'Need a Field Repair Kit';
                this.initItem(kit);
                e.dur = Math.min(e.maxDur, Math.round(e.dur + e.maxDur * 0.5));
                kit.dur = Math.max(0, kit.dur - (BO.OWRPGStatsData.ITEMS.tool_field_repair.wearPerUse || 15));
                if (kit.dur <= 0) I.removeUid(s, kit.uid);
                return '';
            }
            const cost = this.repairCost(s, e);
            if (s.player.credits < cost) return `Need ${cost} credits`;
            s.player.credits -= cost;
            e.dur = e.maxDur;
            return '';
        },

        repairAllEquipped(s) {
            const eq = s.player.equipped;
            let total = 0;
            const items = [];
            for (const slot of ['primary', 'secondary', 'helmet', 'rig', 'boots', 'relic', 'tool']) {
                const e = eq[slot] ? BO.OWRPGInventory.byUid(s, eq[slot]) : null;
                if (!e) continue;
                const c = this.repairCost(s, e);
                if (c > 0) { total += c; items.push(e); }
            }
            if (!items.length) return 'Equipped gear is already in top condition.';
            if (s.player.credits < total) return `Need ${total} credits to repair all.`;
            s.player.credits -= total;
            for (const e of items) e.dur = e.maxDur;
            return '';
        },

        /** Activate a field pickup/tool (from Inventory or equipped tool slot). */
        useTool(s, uid) {
            const I = BO.OWRPGInventory;
            const M = BO.OWRPGMode;
            const C = BO.OWRPGCombat;
            const P = BO.Player;
            const e = I.byUid(s, uid);
            if (!e) return 'Tool not found';
            const d = I.def(e.id);
            if (!d || d.type !== 'tool') return 'Not a tool';
            this.initItem(e);
            const perf = this.performanceMult(e);
            const wear = d.wearPerUse || 10;

            if (d.toolKind === 'repair_half' || d.toolKind === 'repair_full') {
                if (e.dur <= 0) return `${d.name} is depleted.`;
                const frac = d.toolKind === 'repair_full' ? 1.0 : 0.5;
                let fixed = 0;
                for (const slot of ['primary', 'secondary', 'helmet', 'rig', 'boots', 'relic']) {
                    const eqItem = s.player.equipped[slot] ? I.byUid(s, s.player.equipped[slot]) : null;
                    if (!eqItem) continue;
                    this.initItem(eqItem);
                    if (eqItem.dur < eqItem.maxDur) {
                        eqItem.dur = Math.min(eqItem.maxDur, Math.round(eqItem.dur + eqItem.maxDur * frac));
                        fixed++;
                    }
                }
                if (!fixed) return 'Equipped gear is already at 100% durability.';
                e.dur = Math.max(0, e.dur - wear);
                if (e.dur <= 0) I.removeUid(s, e.uid);
                M.toast(`Repaired ${fixed} equipped item(s) via ${d.name}`, '#4ade80');
                return '';
            }

            if (d.toolKind === 'overcharge') {
                if (e.dur <= 0) return `${d.name} is depleted.`;
                C.cd.primer = 0; C.cd.detonator = 0; C.cd.gadget = 0;
                C.cd.ultimate = Math.max(0, (C.cd.ultimate || 0) - 18);
                e.dur = Math.max(0, e.dur - wear);
                if (e.dur <= 0) I.removeUid(s, e.uid);
                BO.FX.spawnParticles(P.pos.clone().add(UP), 16, 0xfacc15, 4, 2, 0.5, 1.2);
                M.toast('Abilities Overcharged!', '#facc15');
                return '';
            }

            if (d.toolKind === 'beacon') {
                if (e.dur <= 0) return `${d.name} is depleted.`;
                M.heal(40);
                for (const a of BO.OWRPGAI.agentsNear(P.pos, 8, false)) {
                    a.ent.stunTimer = Math.max(a.ent.stunTimer || 0, 2.2);
                    C.applyStatus(a, 'shock');
                }
                BO.FX.spawnExplosion(P.pos.clone().add(UP), 5, 0x38bdf8);
                e.dur = Math.max(0, e.dur - wear);
                if (e.dur <= 0) I.removeUid(s, e.uid);
                M.toast('Emergency Beacon deployed (+40 HP & shockwave)!', '#38bdf8');
                return '';
            }

            if (d.toolKind === 'shield' || d.toolKind === 'riot') {
                const hp = Math.round((d.shieldHp || 45) * perf);
                C.barrierHp = Math.max(C.barrierHp || 0, hp);
                C.barrierT = Math.max(C.barrierT || 0, d.durSec || 10);
                this.degrade(s, e, wear);
                BO.FX.spawnParticles(P.pos.clone().add(UP), 14, 0x38bdf8, 3, 1, 0.5, 1.1);
                M.toast(`${d.name}: +${hp} Kinetic Barrier (${d.durSec}s)`, '#38bdf8');
                return '';
            }

            // Combat tools (flamer, hammer, welder, cutter)
            const eye = P.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
            const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
            const range = d.range || 7;
            const elem = d.element || 'burn';
            const hex = (BO.OWRPGStatsData.STATUSES[elem] && BO.OWRPGStatsData.STATUSES[elem].hex) || 0xf97316;
            const center = P.pos.clone().addScaledVector(fwd, Math.min(range * 0.55, 3.5));
            BO.FX.spawnTracer(eye, P.pos.clone().addScaledVector(fwd, range), hex, 0.14, 0.25);
            BO.FX.spawnExplosion(center, Math.min(4.5, range * 0.6), hex);
            const hits = BO.OWRPGAI.agentsNear(center, range * 0.75, false);
            for (const a of hits) {
                C.applyStatus(a, elem);
                C.damage(a, (d.dmg || 60) * perf, { source: 'ability', element: elem });
            }
            if (d.toolKind === 'welder' && s.player.equipped.rig) {
                const rig = I.byUid(s, s.player.equipped.rig);
                if (rig) { this.initItem(rig); rig.dur = Math.min(rig.maxDur, rig.dur + 20); }
            }
            this.degrade(s, e, wear);
            BO.Sound?.playMelee?.();
            M.toast(`${d.name} fired (${hits.length} hit${hits.length === 1 ? '' : 's'})`, '#f5a623');
            return '';
        }
    };

    BO.OWRPGDurability = Dur;
})(window.BO);
;

/* --- src/owrpg/OWRPGInventory.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Inventory, Multi-Slot Armor, Gun RPG Stats
   Reads BO.OWRPGGunStats exclusively for OWRPG (never mutating BO.WeaponsData).
   Supports multi-slot armor (helmet, rig, boots, relic), tools with
   durability, and mount schematic auto-unlocks.
============================================================================ */
(function (BO) {
    'use strict';

    const SD = () => BO.OWRPGStatsData;
    const RAR_ORDER = ['common', 'rare', 'epic', 'legendary'];
    const ARMOR_SLOTS = { helmet: 'helmet', rig: 'rig', boots: 'boots', relic: 'relic', tool: 'tool' };

    const Inv = {
        def(id) { return SD().ITEMS[id]; },

        _push(s, entry, list) {
            const p = s.player;
            entry.uid = 'u' + (p.nextUid++);
            (list || p.inventory).push(entry);
            return entry;
        },

        add(s, id, n = 1, opts = {}) {
            const d = this.def(id);
            if (!d) { console.warn('[OWRPG] unknown item', id); return null; }
            if (id === 'relay_cell') { s.player.relayCells += n; BO.Events.emit('owrpg:item', { id, n }); return { id, n }; }
            if (id.startsWith('schematic_') && BO.OWRPGMounts) {
                const mountId = id.replace('schematic_', '');
                if (BO.OWRPGExpansionData?.MOUNTS?.[mountId]) {
                    BO.OWRPGMounts.unlock(s, mountId);
                    return { id, n: 1, mountUnlocked: mountId };
                }
            }
            let last = null;
            if (d.stack || d.type === 'quest' || d.type === 'junk') {
                const ex = s.player.inventory.find((e) => e.id === id);
                if (ex) { ex.n += n; last = ex; } else last = this._push(s, { id, n });
            } else {
                for (let i = 0; i < n; i++) last = this._push(s, this.makeInstance(id, opts.rarity));
            }
            BO.Events.emit('owrpg:item', { id, n });
            return last;
        },

        makeInstance(id, rarity) {
            const d = this.def(id);
            const r = rarity || d.rarity || 'common';
            const e = { id, n: 1, rarity: r, affixes: [] };
            if (d.type === 'weapon') {
                e.mfr = BO.Math.pick(SD().MANUFACTURERS);
                if (d.fixedAffix) e.affixes.push(d.fixedAffix);
                const keys = Object.keys(SD().AFFIXES);
                let guard = 0;
                while (e.affixes.length < SD().RARITY[r].affixes && guard++ < 20) {
                    const k = BO.Math.pick(keys);
                    if (!e.affixes.includes(k)) e.affixes.push(k);
                }
            }
            if (BO.OWRPGDurability) BO.OWRPGDurability.initItem(e);
            return e;
        },

        count(s, id) {
            if (id === 'relay_cell') return s.player.relayCells;
            return s.player.inventory.filter((e) => e.id === id).reduce((a, e) => a + e.n, 0);
        },
        has(s, id) { return this.count(s, id) > 0; },

        remove(s, id, n = 1) {
            if (id === 'relay_cell') { s.player.relayCells = Math.max(0, s.player.relayCells - n); return true; }
            const inv = s.player.inventory;
            for (let i = inv.length - 1; i >= 0 && n > 0; i--) {
                if (inv[i].id !== id) continue;
                const take = Math.min(n, inv[i].n);
                inv[i].n -= take;
                n -= take;
                if (inv[i].n <= 0) { this._unequipUid(s, inv[i].uid); inv.splice(i, 1); }
            }
            return n === 0;
        },

        removeUid(s, uid) {
            const inv = s.player.inventory;
            const i = inv.findIndex((e) => e.uid === uid);
            if (i < 0) return null;
            this._unequipUid(s, uid);
            return inv.splice(i, 1)[0];
        },

        byUid(s, uid) { return s.player.inventory.find((e) => e.uid === uid) || null; },

        _unequipUid(s, uid) {
            const eq = s.player.equipped;
            for (const k of Object.keys(eq)) if (eq[k] === uid) eq[k] = null;
        },

        equippedEntry(s, slot) { const uid = s.player.equipped[slot]; return uid ? this.byUid(s, uid) : null; },

        entryWeight(e) {
            const d = this.def(e.id);
            if (!d) return 0;
            let w = d.weight * e.n;
            if (e.affixes && e.affixes.includes('light')) w *= SD().AFFIXES.light.weightMult;
            return w;
        },
        weight(s) { return s.player.inventory.reduce((a, e) => a + this.entryWeight(e), 0); },

        meetsReq(s, id) {
            const d = this.def(id);
            if (!d || !d.req) return true;
            return BO.OWRPGCharacter.attr(s, d.req[0]) >= d.req[1];
        },

        /** Equip a weapon ('primary'/'secondary'), armor ('helmet'/'rig'/'boots'/'relic'), or tool ('tool'). */
        equip(s, uid, slot) {
            const e = this.byUid(s, uid);
            if (!e) return 'Missing item';
            const d = this.def(e.id);
            if (!this.meetsReq(s, e.id)) return `Requires ${d.req[0]} ${d.req[1]}`;
            if (ARMOR_SLOTS[d.type]) slot = ARMOR_SLOTS[d.type];
            else if (d.type !== 'weapon') return 'Not equippable';
            else if (slot !== 'primary' && slot !== 'secondary') slot = 'primary';
            const eq = s.player.equipped;
            for (const k of Object.keys(eq)) if (eq[k] === uid) eq[k] = null;
            eq[slot] = uid;
            return '';
        },

        /** Combat-relevant stats of a weapon entry (merges OWRPGGunStats + rarity + affixes + durability). */
        weaponStats(e) {
            const d = this.def(e.id);
            const r = SD().RARITY[e.rarity || d.rarity || 'common'];
            const gs = (BO.OWRPGGunStats && d && BO.OWRPGGunStats[d.base]) || {};
            const durPerf = BO.OWRPGDurability ? BO.OWRPGDurability.performanceMult(e) : 1.0;
            const out = {
                dmgMult: r.mult * (gs.rpgDmgMult || 1.0) * durPerf,
                pen: gs.armorPen || 0,
                critChance: gs.critChance || 0.08,
                critAdd: gs.critMultBonus || 0,
                element: gs.element || 'kinetic',
                elemDmg: (gs.elemDmg || 0) * durPerf,
                statusChance: gs.statusChance || 0,
                passiveTrait: gs.passiveTrait || null,
                passiveDesc: gs.passiveDesc || '',
                burnChance: 0, chillChance: 0, shockChance: 0, venomChance: 0, voidChance: 0
            };
            if (out.element && out.element !== 'kinetic' && out.statusChance > 0) {
                const key = out.element + 'Chance';
                if (key in out) out[key] += out.statusChance;
            }
            for (const a of e.affixes || []) {
                const A = SD().AFFIXES[a];
                if (!A) continue;
                for (const k of ['pen', 'critAdd', 'burnChance', 'chillChance', 'shockChance', 'venomChance', 'voidChance']) {
                    if (A[k]) out[k] += A[k];
                }
            }
            return out;
        },

        armorStats(e) {
            const d = this.def(e.id);
            if (!d) return { armor: 0 };
            const mult = (SD().ARMOR_RARITY_MULT && SD().ARMOR_RARITY_MULT[e.rarity || d.rarity || 'common']) || 1.0;
            const perf = BO.OWRPGDurability ? BO.OWRPGDurability.performanceMult(e) : 1.0;
            return { armor: Math.round((d.armor || 0) * mult * perf), elemRes: d.elemRes || {}, setId: d.setId || null };
        },

        displayName(e) {
            const d = this.def(e.id);
            if (!d) return e.id;
            const pre = (e.affixes || []).slice(0, 1).map((a) => SD().AFFIXES[a] ? SD().AFFIXES[a].name + ' ' : '');
            return (d.type === 'weapon' ? pre.join('') : '') + d.name + (e.n > 1 ? ` ×${e.n}` : '');
        },

        rarityColor(e) { const d = this.def(e.id); return SD().RARITY[e.rarity || (d && d.rarity) || 'common'].color; },

        rollLoot(s, table, rolls = 2) {
            const T = SD().LOOT[table];
            if (!T) return { items: [], credits: 0 };
            const out = { items: [], credits: 0 };
            const total = T.reduce((a, r) => a + r[1], 0);
            for (let k = 0; k < rolls; k++) {
                let pick = Math.random() * total;
                const row = T.find((r) => (pick -= r[1]) <= 0) || T[0];
                const n = row[2] + Math.floor(Math.random() * (row[3] - row[2] + 1));
                if (row[0] === 'credits') out.credits += n;
                else out.items.push({ id: row[0], n });
            }
            const gearTypes = { weapon: 1, rig: 1, helmet: 1, boots: 1, relic: 1 };
            for (const it of out.items) {
                const d = this.def(it.id);
                if (!d || !gearTypes[d.type]) continue;
                let r = d.rarity || 'common';
                const roll = Math.random();
                if (roll < 0.06) r = 'legendary'; else if (roll < 0.2) r = 'epic'; else if (roll < 0.5 && r === 'common') r = 'rare';
                if (s.pityCounter + 1 >= SD().PITY_GUARANTEE && RAR_ORDER.indexOf(r) < 2) r = 'epic';
                it.rarity = r;
            }
            const big = out.items.some((it) => it.rarity === 'epic' || it.rarity === 'legendary');
            s.pityCounter = big ? 0 : s.pityCounter + 1;
            out.credits = Math.round(out.credits * (1 + (BO.OWRPGCharacter.perkFx(s).creditFind || 0) + (table === 'boss' || table === 'dragon' ? BO.OWRPGCharacter.perkFx(s).bountyMult || 0 : 0)));
            return out;
        },

        grantLoot(s, loot) {
            for (const it of loot.items) this.add(s, it.id, it.n, { rarity: it.rarity });
            s.player.credits += loot.credits;
        },

        buyPrice(s, vendorId, id) {
            const v = BO.OWRPGFactionsData.VENDORS[vendorId];
            const disc = BO.OWRPGFactions.vendorDiscount(s, v.faction);
            if (disc === null) return null;
            return Math.max(1, Math.round(this.def(id).value * BO.OWRPGCharacter.derived(s).buyMult * (1 - disc)));
        },

        sellPrice(s, e) {
            const d = this.def(e.id);
            if (!d || d.type === 'quest') return 0;
            const r = SD().RARITY[e.rarity || d.rarity || 'common'];
            return Math.max(1, Math.round(d.value * r.mult * BO.OWRPGCharacter.derived(s).sellMult));
        },

        buy(s, vendorId, id) {
            const price = this.buyPrice(s, vendorId, id);
            if (price === null) return 'They refuse to trade with you.';
            if (s.player.credits < price) return 'Not enough credits.';
            s.player.credits -= price;
            this.add(s, id, 1);
            return '';
        },

        sell(s, uid) {
            const e = this.byUid(s, uid);
            if (!e) return 0;
            const each = this.sellPrice(s, Object.assign({}, e, { n: 1 }));
            if (!each) return 0;
            if (e.n > 1) e.n--; else this.removeUid(s, uid);
            s.player.credits += each;
            return each;
        },

        salvage(s, uid) {
            const e = this.byUid(s, uid);
            if (!e) return 0;
            const d = this.def(e.id);
            if (d.type === 'quest' || d.type === 'consumable') return 0;
            const fx = BO.OWRPGCharacter.perkFx(s);
            const base = d.type === 'junk' ? (d.scrap || Math.max(1, d.value / 4)) * 4 : Math.round(d.value * 0.25);
            const each = Math.round(base * (1 + (fx.salvage || 0)));
            BO.OWRPGCharacter.addSkillXp(s, 'mining', Math.max(5, Math.min(30, each)));
            if (e.n > 1) e.n--; else this.removeUid(s, uid);
            s.player.credits += each;
            return each;
        }
    };

    BO.OWRPGInventory = Inv;
})(window.BO);
;

/* --- src/owrpg/OWRPGQuests.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Quest Engine
   Finite-state quests driven by world events, so out-of-sequence play never
   breaks them. Events: ('flag', id) ('kill', enemyId) ('item', id)
   ('discover', poiId). Counters use numeric world flags ('count:flag:n').
   Quest records: s.quests[id] = { state, stage, branch, startedAt }.
============================================================================ */
(function (BO) {
    'use strict';

    const QD = () => BO.OWRPGQuestsData.QUESTS;

    const Quests = {
        get(s, id) { return s.quests[id] || { state: 'inactive', stage: null, branch: null }; },

        def(id) { return QD()[id]; },

        start(s, id) {
            const d = this.def(id);
            if (!d || this.get(s, id).state !== 'inactive') return false;
            const first = Object.keys(d.stages)[0];
            s.quests[id] = { state: 'active', stage: first, branch: null, startedAt: s.playtimeSec };
            BO.Events.emit('owrpg:quest', { id, kind: 'started', name: d.name });
            // Events that already happened (sequence breaks) resolve immediately.
            this._catchUp(s, id);
            return true;
        },

        setStage(s, id, stage) {
            const d = this.def(id);
            const q = s.quests[id];
            if (!d || !q || q.state !== 'active' || !d.stages[stage] || q.stage === stage) return false;
            q.stage = stage;
            BO.Events.emit('owrpg:quest', { id, kind: 'stage', name: d.name, text: d.stages[stage].text });
            if (d.stages[stage].autoComplete) this.complete(s, id, d.stages[stage].autoComplete);
            else this._catchUp(s, id);
            return true;
        },

        complete(s, id, branch) {
            const d = this.def(id);
            if (!d) return false;
            if (!s.quests[id]) s.quests[id] = { state: 'active', stage: Object.keys(d.stages)[0], branch: null, startedAt: s.playtimeSec };
            const q = s.quests[id];
            if (q.state === 'completed') return false;
            const b = d.branches[branch] || Object.values(d.branches)[0];
            q.state = 'completed';
            q.branch = branch;
            const reward = Object.assign({}, b);
            if (d.bonusFlag && s.worldFlags[d.bonusFlag.flag]) reward.credits = (reward.credits || 0) + d.bonusFlag.credits;
            BO.OWRPGMode.reward(reward, d.name);
            for (const f of b.flags || []) BO.OWRPGMode.setFlag(f, true);
            BO.Events.emit('owrpg:quest', { id, kind: 'completed', name: d.name, branch: b.label });
            return true;
        },

        /** Active quest marker POI ids (for the map; the HUD shows no floating arrows). */
        markers(s) {
            const out = [];
            for (const [id, q] of Object.entries(s.quests)) {
                if (q.state !== 'active') continue;
                const st = this.def(id)?.stages[q.stage];
                if (st && st.marker) out.push({ quest: id, poi: st.marker });
            }
            return out;
        },

        objective(s, id) {
            const q = s.quests[id];
            if (!q || q.state !== 'active') return '';
            return this.def(id).stages[q.stage]?.text || '';
        },

        /** Route a world event into every quest. */
        onEvent(s, type, key) {
            const tag = type + ':' + key;
            for (const [id, d] of Object.entries(QD())) {
                const q = this.get(s, id);
                if (q.state === 'inactive' && d.autoStart === tag) { this.start(s, id); continue; }
                if (q.state !== 'active') continue;
                const on = d.stages[q.stage]?.on;
                if (!on) continue;
                if (on[tag]) { this.setStage(s, id, on[tag]); continue; }
                if (type === 'flag') {
                    for (const [k, next] of Object.entries(on)) {
                        const m = k.match(/^count:([a-z0-9_]+):(\d+)$/);
                        if (m && m[1] === key && (Number(s.worldFlags[key]) || 0) >= Number(m[2])) this.setStage(s, id, next);
                    }
                }
            }
        },

        /** Re-check a quest's current stage against already-true world state. */
        _catchUp(s, id) {
            const d = this.def(id);
            const q = s.quests[id];
            if (!q || q.state !== 'active') return;
            const on = d.stages[q.stage]?.on || {};
            for (const [k, next] of Object.entries(on)) {
                const [type, a, b] = k.split(':');
                let hit = false;
                if (type === 'flag') hit = !!s.worldFlags[a];
                else if (type === 'item') hit = BO.OWRPGInventory.has(s, a);
                else if (type === 'discover') hit = !!(s.poiStates[a] && s.poiStates[a].discovered);
                else if (type === 'kill') hit = !!s.worldFlags['killed_' + a];
                else if (type === 'count') hit = (Number(s.worldFlags[a]) || 0) >= Number(b);
                if (hit) { this.setStage(s, id, next); return; }
            }
        }
    };

    BO.OWRPGQuests = Quests;
})(window.BO);
;

/* --- src/owrpg/OWRPGDialogue.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Dialogue Evaluator
   Builds a read-only context, filters choices by deterministic predicates
   (no percentage rolls → no save-scumming) and dispatches consequences.
============================================================================ */
(function (BO) {
    'use strict';

    const ATTR_LABEL = { BRW: 'BRAWN', RFX: 'REFLEX', TCH: 'TECH', PRC: 'PERCEPTION', PRS: 'PRESENCE' };

    const Dialogue = {
        ctx(s) {
            return {
                flags: s.worldFlags,
                attr: (id) => BO.OWRPGCharacter.attr(s, id),
                rep: (f) => BO.OWRPGFactions.rep(s, f),
                has: (id) => BO.OWRPGInventory.has(s, id),
                credits: s.player.credits,
                level: s.player.level,
                quest: (id) => BO.OWRPGQuests.get(s, id)
            };
        },

        /** Returns '' when the requirement passes, otherwise a short reason. */
        check(s, req) {
            if (!req) return '';
            const c = this.ctx(s);
            if (req.attr && c.attr(req.attr[0]) < req.attr[1]) return `${ATTR_LABEL[req.attr[0]]} ${req.attr[1]}`;
            if (req.rep && c.rep(req.rep[0]) < req.rep[1]) return `${BO.OWRPGFactionsData.FACTIONS[req.rep[0]].short} rep ${req.rep[1]}`;
            if (req.item && !c.has(req.item)) return 'Needs ' + BO.OWRPGStatsData.ITEMS[req.item].name;
            if (req.notItem && c.has(req.notItem)) return 'hidden';
            if (req.flag && !c.flags[req.flag]) return 'hidden';
            if (req.notFlag && c.flags[req.notFlag]) return 'hidden';
            if (req.credits && c.credits < req.credits) return `${req.credits} credits`;
            if (req.level && c.level < req.level) return `Level ${req.level}`;
            if (req.quest && c.quest(req.quest[0]).state !== req.quest[1]) return 'hidden';
            if (req.stage) { const q = c.quest(req.stage[0]); if (q.state !== 'active' || q.stage !== req.stage[1]) return 'hidden'; }
            return '';
        },

        tree(npcId) { return BO.OWRPGDialogueData.TREES[npcId]; },

        entry(s, npcId) { const t = this.tree(npcId); return t ? t.entry(this.ctx(s)) : null; },

        /** Renderable view of a node: { speaker, text, choices:[{i,text,ok,reason,badge}] } */
        view(s, npcId, nodeId) {
            const t = this.tree(npcId);
            const n = t && t.nodes[nodeId];
            if (!n) return null;
            const c = this.ctx(s);
            const choices = [];
            n.choices.forEach((ch, i) => {
                const reason = this.check(s, ch.req);
                if (reason === 'hidden') return;
                const badge = ch.req && ch.req.attr ? ch.req.attr[0] : (ch.req && ch.req.rep ? 'REP' : (ch.req && ch.req.item ? 'ITEM' : ''));
                choices.push({ i, text: ch.text, ok: !reason, reason, badge });
            });
            return { speaker: n.speaker || t.name, text: typeof n.text === 'function' ? n.text(c) : n.text, choices };
        },

        /** Apply a choice; returns the next node id or 'END'. */
        choose(s, npcId, nodeId, idx) {
            const n = this.tree(npcId).nodes[nodeId];
            const ch = n.choices[idx];
            if (!ch || this.check(s, ch.req)) return nodeId;
            if (ch.fx) this.apply(s, ch.fx, npcId);
            return ch.next || 'END';
        },

        apply(s, fx, npcId) {
            const M = BO.OWRPGMode;
            const I = BO.OWRPGInventory;
            if (fx.takeItem) I.remove(s, fx.takeItem, 1);
            if (fx.grantItem) { I.add(s, fx.grantItem, 1); M.toast('Received: ' + BO.OWRPGStatsData.ITEMS[fx.grantItem].name, '#a3e635'); M.itemEvent(fx.grantItem); }
            if (fx.credits) { s.player.credits += fx.credits; M.toast((fx.credits > 0 ? '+' : '') + fx.credits + ' credits', '#fbbf24'); }
            if (fx.xp) M.giveXp(fx.xp, 'Insight');
            if (fx.rep) for (const [f, v] of Object.entries(fx.rep)) M.changeRep(f, v);
            if (fx.setFlag) M.setFlag(fx.setFlag, true);
            if (fx.clearFlag) M.setFlag(fx.clearFlag, false);
            if (fx.startQuest) BO.OWRPGQuests.start(s, fx.startQuest);
            if (fx.stage) BO.OWRPGQuests.setStage(s, fx.stage[0], fx.stage[1]);
            if (fx.complete) BO.OWRPGQuests.complete(s, fx.complete[0], fx.complete[1]);
            if (fx.heal) M.healFull();
            if (fx.respec) M.openRespec();
            if (fx.vendor) M.pendingVendor = fx.vendor;
            if (fx.hostile && npcId) M.setFlag('provoked_' + (BO.OWRPGWorldData.NPCS.find((n) => n.id === npcId)?.faction || ''), true);
        }
    };

    BO.OWRPGDialogue = Dialogue;
})(window.BO);
;

/* --- src/owrpg/OWRPGCombat.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Combat (5-Element Pipeline, Passive Traits,
   Reactions, Abilities & Ultimates)
   No double hitmarker SFX: CombatSystem plays hitmarker on gun/melee;
   OWRPGCombat plays hitmarker only for ability/reaction hits.
============================================================================ */
(function (BO) {
    'use strict';

    const SD = () => BO.OWRPGStatsData;
    const UP = new THREE.Vector3(0, 1.2, 0);
    const _ray = new THREE.Raycaster();
    const _v = new THREE.Vector3();
    const _center = new THREE.Vector2(0, 0);
    const DIFF = { story: { out: 1.3, inc: 0.6 }, tactical: { out: 1, inc: 1 }, blackout: { out: 0.85, inc: 1.35 } };

    const Combat = {
        cd: { primer: 0, detonator: 0, gadget: 0, ultimate: 0 },
        primerCharges: 1,
        heal: null,
        decoy: null,
        barrierHp: 0,
        barrierT: 0,
        overdriveT: 0,
        hitCount: 0,

        reset() {
            this.cd = { primer: 0, detonator: 0, gadget: 0, ultimate: 0 };
            this.primerCharges = 0;
            this.heal = null;
            this.barrierHp = 0;
            this.barrierT = 0;
            this.overdriveT = 0;
            this.removeDecoy();
            this.hitCount = 0;
        },

        get s() { return BO.OWRPGMode.state; },
        diff() { return DIFF[this.s.difficulty] || DIFF.tactical; },

        /* ------------------------------------------------ incoming */
        modifyIncoming(amount, attackerPos, attackerEntity) {
            const s = this.s;
            if (!s) return amount;
            const d = BO.OWRPGCharacter.derived(s);
            let a = amount * this.diff().inc * (100 / (100 + d.armor));
            if (attackerEntity?.owAgent?.boss) a *= 1 - Math.min(0.8, d.fx.bossDR || 0);
            if (attackerEntity?.owAgent && BO.OWRPGChampions) a *= BO.OWRPGChampions.dealtMult(attackerEntity.owAgent);
            if (d.fx.crouchDR && BO.Player.crouching) a *= 1 - d.fx.crouchDR;
            if (BO.OWRPGMounts && BO.OWRPGMounts.mounted) a *= BO.OWRPGMounts.drMult();
            const attElem = attackerEntity && attackerEntity.owAgent && attackerEntity.owAgent.def && attackerEntity.owAgent.def.elem;
            if (attElem && d.elemRes && d.elemRes[attElem]) a *= (1 - d.elemRes[attElem]);

            // Kinetic Barrier absorption
            if (this.barrierHp > 0 && this.barrierT > 0) {
                const abs = Math.min(this.barrierHp, a);
                this.barrierHp -= abs;
                a -= abs;
                if (this.barrierHp <= 0) BO.OWRPGMode.toast('Kinetic Barrier depleted!', '#f97316');
            }

            // Degrade armor subtly on real hits
            if (a > 2 && BO.OWRPGDurability) {
                for (const slot of ['rig', 'helmet', 'boots']) {
                    const eq = BO.OWRPGInventory.equippedEntry(s, slot);
                    if (eq) BO.OWRPGDurability.degrade(s, eq, 0.22);
                }
            }
            if (attackerEntity?.owAgent?.champ) BO.OWRPGChampions.afterHitPlayer(attackerEntity.owAgent, a);
            BO.OWRPGMode.onPlayerHurt();
            return a;
        },

        /* ------------------------------------------------ outgoing */
        /** CombatSystem.onHitEnemy hook. Returns true on kill. */
        onGunHit(ent, dmg, hitbox, dist, w) {
            const agent = ent && ent.owAgent;
            if (!agent || !agent.alive) return false;
            const melee = !!(w && w.stats && w.stats.kind === 'melee');
            const isHead = hitbox === 'head';
            const base = isHead && w && w.stats.headMult ? dmg / w.stats.headMult : dmg;
            const entry = BO.OWRPGMode.activeWeaponEntry();
            const ctx = {
                source: melee ? 'melee' : 'gun',
                isHead, dist, entry, w,
                suppressed: !!(w && w.stats && w.stats.suppressed)
            };
            const killed = this.damage(agent, base, ctx);
            if (!killed && agent.alive) this._procs(agent, ctx);
            return killed;
        },

        damage(agent, base, ctx = {}) {
            const s = this.s;
            const d = BO.OWRPGCharacter.derived(s);
            const ws = ctx.entry ? BO.OWRPGInventory.weaponStats(ctx.entry) : { dmgMult: 1, pen: 0, critChance: 0, critAdd: 0, element: 'kinetic', elemDmg: 0, passiveTrait: null };
            const elem = ctx.element || (ctx.source === 'gun' || ctx.source === 'melee' ? (ws.element !== 'kinetic' ? ws.element : null) : null);
            const unaware = agent.state !== 'combat';

            let m = 1;
            if (ctx.source === 'gun' || ctx.source === 'melee') m *= 1 + (d.fx.allDmgMult || 0);
            if (agent.kind === 'beast') m *= 1 + (d.fx.beastDmg || 0);
            if (agent.kind === 'beast' || agent.boss) m *= 1 + (d.fx.monsterDmg || 0);
            if (agent.boss) m *= 1 + (d.fx.bossDmg || 0);
            if (agent.champ) m *= BO.OWRPGChampions.takenMult(agent);
            if (ctx.source === 'gun' && ctx.dist > 22) m *= 1 + (d.fx.rangeDmg22 || 0);
            if (ctx.source === 'ability' || ctx.source === 'reaction') m *= 1 + (d.fx.arcanaDmg || 0);
            if (ctx.source === 'gun') m *= ws.dmgMult;
            if (ctx.source === 'melee') m *= d.meleeMult * (ws.dmgMult || 1);
            if (this.overdriveT > 0) m *= 1.25;

            if (d.fx.heavyDmg && ctx.entry) {
                const cat = BO.WeaponsData.get(SD().ITEMS[ctx.entry.id].base).category;
                if (/Shotgun|LMG|Launcher/.test(cat)) m *= (1 + d.fx.heavyDmg);
            }

            let crit = false;
            if (ctx.isHead && (ctx.source === 'gun' || ctx.source === 'melee')) {
                m *= d.critMult + (ws.critAdd || 0) + (this.overdriveT > 0 ? 0.3 : 0);
                crit = true;
            } else if ((ctx.source === 'gun' || ctx.source === 'melee') && Math.random() < (ws.critChance || 0) + (d.fx.bonusCritChance || 0) + (this.overdriveT > 0 ? 0.25 : 0)) {
                m *= (1.45 + (ws.critAdd || 0) * 0.5);
                crit = true;
            }
            if (unaware && d.fx.deadeye && ctx.source === 'gun' && ctx.dist > d.fx.deadeye) {
                if (!crit) m *= d.critMult + (ws.critAdd || 0);
                crit = true;
                this.applyStatus(agent, 'chill');
            }
            let sneak = false;
            if (unaware && (ctx.source === 'melee' || ctx.suppressed)) { m *= d.stealthMult; sneak = true; }
            if (agent.st.expose) m *= SD().STATUSES.expose.mult;
            if (d.fx.execute && agent.ent.hp < agent.ent.maxHp * 0.35) m *= 1 + d.fx.execute;

            // Weapon Passive Traits (damage modifiers)
            const trait = (ctx.source === 'gun' || ctx.source === 'melee') ? ws.passiveTrait : null;
            if (trait === 'executioner' && agent.ent.hp < agent.ent.maxHp * 0.35) m *= 1.35;
            if (trait === 'venom_fang' && agent.st.venom) m *= 1.15;
            if (trait === 'frostbite' && agent.st.chill) m *= 1.20;
            if (trait === 'headhunter' && ctx.isHead) m *= 1.30;

            let pen = (ws.pen || 0) + ((ctx.source === 'gun' || ctx.source === 'melee') ? (d.fx.bonusPen || 0) : 0);
            if (trait === 'kinetic_slam' && crit) { pen += 18; agent.ent.stunTimer = Math.max(agent.ent.stunTimer || 0, 0.35); }
            if (d.fx.heavyPen && ctx.entry && /Shotgun|LMG/.test(BO.WeaponsData.get(SD().ITEMS[ctx.entry.id].base).category)) pen += d.fx.heavyPen;

            const shred = 1 - Math.min(0.45, (agent.shredStacks || 0) * 0.15);
            const armor = agent.armor * (agent.ruptureT > 0 ? 0.5 : 1) * shred;
            let rawDmg = base + ((ctx.source === 'gun' || ctx.source === 'melee') ? (ws.elemDmg || 0) : 0);
            let dmg = rawDmg * m * (100 / (100 + Math.max(0, armor - pen))) * this.diff().out;

            if (elem && agent.def.weak === elem) dmg *= 1.5;
            if (elem && agent.def.resist === elem) dmg *= 0.7;
            dmg = Math.max(1, dmg);

            const ent = agent.ent;
            const hpBefore = ent.hp;
            const killed = agent.kind === 'bot'
                ? ent.takeDamage(dmg, 'player')
                : ent.takeDamage(dmg, ctx.isHead ? 'head' : 'torso', crit, null, ctx.source === 'melee' ? 'melee' : 'bullet');
            if (agent.champ && ctx.source !== 'dot') BO.OWRPGChampions.afterDamaged(agent, Math.min(dmg, Math.max(0, hpBefore)));

            // Only play hitmarker here for ability/reaction (CombatSystem already plays it for gun/melee!)
            if (ctx.source === 'ability' || ctx.source === 'reaction') {
                BO.Sound.playHitmarker(crit, killed);
            }
            if (crit || killed) {
                BO.Juice?.shake?.(crit ? 0.095 : 0.05);
                if (ctx.source === 'melee' || crit) BO.Sound?.playGoreImpact?.(crit);
            }

            // Elemental impact particles
            if (elem && SD().STATUSES[elem] && ctx.source !== 'dot') {
                BO.FX.spawnParticles(ent.pos.clone().add(UP), 5, SD().STATUSES[elem].hex, 3.2, 4, 0.32, 0.9);
            }

            // Weapon passive on-hit / on-kill effects & durability wear
            if (ctx.source === 'gun' || ctx.source === 'melee') {
                if (ctx.entry && BO.OWRPGDurability) BO.OWRPGDurability.degrade(s, ctx.entry, ctx.source === 'melee' ? 0.3 : 0.16);
                if (trait === 'void_siphon' || this.overdriveT > 0) {
                    BO.OWRPGMode.heal(Math.max(1, Math.round(dmg * 0.04)) + (killed ? 6 : 0));
                }
                if (trait === 'armor_shredder') {
                    agent.shredStacks = Math.min(3, (agent.shredStacks || 0) + 1);
                }
                if (trait === 'bloodlust' && killed && (ctx.dist < 6 || ctx.source === 'melee')) {
                    BO.OWRPGMode.heal(12);
                }
                if (trait === 'headhunter' && killed && ctx.isHead) {
                    for (const k of ['primer', 'detonator', 'gadget']) this.cd[k] = Math.max(0, this.cd[k] * 0.75);
                }
                if (trait === 'scavenger' && killed) {
                    s.player.credits += 12;
                    const aw = BO.Player.activeWeapon;
                    if (aw && aw.stats.magSize > 1) aw.mag = Math.min(aw.stats.magSize, aw.mag + Math.max(1, Math.ceil(aw.stats.magSize * 0.1)));
                }
            }

            if (ctx.source !== 'dot') BO.OWRPGAI.onDamaged(agent, ctx);
            if (killed) BO.OWRPGAI.onKilled(agent, Object.assign({ sneak, crit }, ctx));
            BO.OWRPGUI && BO.OWRPGUI.floatDamage(agent, dmg, crit, elem || (sneak ? 'sneak' : null));
            return killed;
        },

        _procs(agent, ctx) {
            const s = this.s;
            const fx = BO.OWRPGCharacter.perkFx(s);
            const ws = ctx.entry ? BO.OWRPGInventory.weaponStats(ctx.entry) : {};
            const roll = (pct) => pct > 0 && Math.random() * 100 < pct;
            if (roll(ws.burnChance)) this.applyStatus(agent, 'burn');
            if (roll(ws.chillChance)) this.applyStatus(agent, 'chill');
            if (roll(ws.shockChance)) {
                this.applyStatus(agent, 'shock');
                if (ws.passiveTrait === 'overcharge') this.cd.ultimate = Math.max(0, (this.cd.ultimate || 0) - 3);
            }
            if (roll(ws.venomChance)) this.applyStatus(agent, 'venom');
            if (roll(ws.voidChance)) this.applyStatus(agent, 'void');

            this.hitCount++;
            if (ctx.source === 'gun') for (const [key, status] of [['nthBurn', 'burn'], ['nthChill', 'chill'], ['nthShock', 'shock'], ['nthVenom', 'venom'], ['nthVoid', 'void']]) {
                if (fx[key] && this.hitCount % fx[key] === 0) this.applyStatus(agent, status);
            }
            if (ws.passiveTrait === 'heat_sink' && this.hitCount % 4 === 0) {
                this.applyStatus(agent, 'burn');
                this.damage(agent, 18, { source: 'dot', element: 'burn' });
            }
            if (ws.passiveTrait === 'venom_fang' && Math.random() < 0.35) this.applyStatus(agent, 'venom');
            if (ws.passiveTrait === 'chain_arc' && Math.random() < 0.25) {
                const near = BO.OWRPGAI.agentsNear(agent.ent.pos, 7, true).find((o) => o !== agent);
                if (near) {
                    BO.FX.spawnTracer(agent.ent.pos.clone().add(UP), near.ent.pos.clone().add(UP), 0xfacc15, 0.04, 0.18);
                    this.applyStatus(near, 'shock');
                    this.damage(near, 18, { source: 'ability', element: 'shock' });
                }
            }
        },

        /* ------------------------------------------------ 5-element statuses */
        applyStatus(agent, id) {
            if (!agent.alive) return;
            const S = SD().STATUSES[id];
            if (!S) return;
            const d = BO.OWRPGCharacter.derived(this.s);
            const prev = agent.st[id];
            const stacks = id === 'venom' ? Math.min(S.maxStacks || 5, ((prev && prev.stacks) || 0) + 1) : 1;
            agent.st[id] = { t: S.dur * d.statusDur, tick: 1, stacks };
            if (id === 'shock') agent.ent.stunTimer = Math.max(agent.ent.stunTimer || 0, 0.45);
            if (id === 'venom') agent.healBlock = true;
            if (this.s.player.codex && this.s.player.codex.elements) {
                this.s.player.codex.elements[id] = (this.s.player.codex.elements[id] || 0) + 1;
            }
            BO.FX.spawnParticles(agent.ent.pos.clone().add(UP), 10, S.hex, 3, 2, 0.5, 1.1);
            BO.OWRPGAI.onDamaged(agent, { source: 'ability' });
        },

        tickStatuses(agent, dt) {
            const st = agent.st;
            if (agent.ruptureT > 0) agent.ruptureT -= dt;
            for (const id of Object.keys(st)) {
                const e = st[id];
                e.t -= dt;
                if ((id === 'burn' || id === 'venom') && e.t > 0) {
                    e.tick -= dt;
                    if (e.tick <= 0) {
                        e.tick = 1;
                        const pot = BO.OWRPGCharacter.derived(this.s).statusPotency;
                        const stacks = id === 'venom' ? (e.stacks || 1) : 1;
                        const dps = SD().STATUSES[id].dps * stacks;
                        this.damage(agent, dps * pot * (1 + agent.lvl * 0.15), { source: 'dot', element: id });
                        if (!agent.alive) return;
                    }
                }
                if (e.t <= 0) {
                    if (id === 'venom') agent.healBlock = false;
                    delete st[id];
                }
            }
            const chilled = !!st.chill;
            if (chilled !== !!agent._chilled) {
                agent._chilled = chilled;
                const k = chilled ? 1 - SD().STATUSES.chill.slow : 1 / (1 - SD().STATUSES.chill.slow);
                if (agent.kind === 'bot') agent.ent.speedScale *= k; else agent.ent.speed *= k;
            }
        },

        /** Consume every status on the target and fire 5-element reactions. */
        detonate(agent, detDmg) {
            if (!agent.alive) return 0;
            const s = this.s;
            const d = BO.OWRPGCharacter.derived(s);
            const fx = d.fx;
            const ids = Object.keys(agent.st);
            let fired = 0;
            for (const id of ids) {
                const R = SD().REACTIONS[id];
                const S = SD().STATUSES[id];
                const stObj = agent.st[id];
                const stacks = (stObj && stObj.stacks) || 1;
                delete agent.st[id];
                if (!R || !S) continue;
                fired++;
                const dmg = detDmg * R.mult * (1 + (fx.reactMult || 0)) * d.statusPotency * (id === 'venom' ? (1 + (stacks - 1) * 0.25) : 1);
                const p = agent.ent.pos.clone().add(UP);
                BO.FX.spawnExplosion(p, Math.max(2.5, R.radius || 2.5), S.hex);
                BO.Events.emit('hud:toast', { text: R.name + '!', color: S.color });

                if (id === 'burn') {
                    for (const o of BO.OWRPGAI.agentsNear(agent.ent.pos, R.radius, true)) this.damage(o, dmg * (o === agent ? 1 : 0.6), { source: 'reaction', element: 'burn' });
                } else if (id === 'chill') {
                    this.damage(agent, dmg, { source: 'reaction', element: 'chill' });
                } else if (id === 'shock') {
                    const near = BO.OWRPGAI.agentsNear(agent.ent.pos, R.radius, true).slice(0, 4 + (fx.shockArc || 0));
                    for (const o of near) {
                        BO.FX.spawnTracer(p, o.ent.pos.clone().add(UP), S.hex, 0.04, 0.2);
                        o.ent.stunTimer = Math.max(o.ent.stunTimer || 0, 1.3);
                        this.damage(o, dmg * (o === agent ? 1 : 0.55), { source: 'reaction', element: 'shock' });
                    }
                } else if (id === 'venom') {
                    agent.healBlock = false;
                    for (const o of BO.OWRPGAI.agentsNear(agent.ent.pos, R.radius, true)) {
                        this.damage(o, dmg * (o === agent ? 1 : 0.65), { source: 'reaction', element: 'venom' });
                        if (o !== agent && o.alive) this.applyStatus(o, 'venom');
                    }
                } else if (id === 'void') {
                    const near = BO.OWRPGAI.agentsNear(agent.ent.pos, R.radius, true);
                    for (const o of near) {
                        if (o !== agent) {
                            const pull = agent.ent.pos.clone().sub(o.ent.pos).multiplyScalar(0.55);
                            o.ent.pos.add(pull);
                        }
                        this.damage(o, dmg * (o === agent ? 1 : 0.6), { source: 'reaction', element: 'void' });
                    }
                    BO.OWRPGMode.heal(Math.max(8, Math.round(dmg * 0.14)));
                } else if (id === 'expose') {
                    agent.ruptureT = 10;
                    this.damage(agent, dmg, { source: 'reaction', element: 'expose' });
                }

                if (fx.chain) {
                    for (const o of BO.OWRPGAI.agentsNear(agent.ent.pos, 8, true).filter((o) => o !== agent).slice(0, fx.chain)) this.applyStatus(o, id);
                }
                if (fx.refund) this.cd.primer = Math.max(0, this.cd.primer * (1 - fx.refund));
                s.stats.reactions++;
            BO.OWRPGCharacter.addSkillXp(s, 'arcana', 18);
                if (!agent.alive) break;
            }
            if (!fired) this.damage(agent, detDmg, { source: 'ability' });
            return fired;
        },

        /* ------------------------------------------------ abilities & ultimates */
        aim(maxDist) {
            const cam = BO.OWRPGMode.camera;
            _ray.setFromCamera(_center, cam);
            _ray.far = maxDist;
            const hits = _ray.intersectObjects(BO.Combat.targetPool || [], false);
            const hit = hits.find((h) => h.object.userData.entity && h.object.userData.entity.owAgent && h.object.userData.entity.alive);
            const wh = BO.World.raycastWorld(_ray.ray.origin, _ray.ray.direction, maxDist);
            if (hit && (!wh || hit.distance < wh.distance)) return { agent: hit.object.userData.entity.owAgent, point: hit.point.clone(), dist: hit.distance };
            const point = wh ? wh.point.clone() : _ray.ray.origin.clone().addScaledVector(_ray.ray.direction, maxDist);
            let best = null, bd = 0.97;
            const fwd = _ray.ray.direction;
            for (const a of BO.OWRPGAI.agents) {
                if (!a.alive || !a.ent.parts.root.visible) continue;
                _v.copy(a.ent.pos).add(UP).sub(_ray.ray.origin);
                const dist = _v.length();
                if (dist > maxDist) continue;
                const dot = _v.normalize().dot(fwd);
                if (dot > bd) { bd = dot; best = { agent: a, point: a.ent.pos.clone().add(UP), dist }; }
            }
            return best || { agent: null, point, dist: wh ? wh.distance : maxDist };
        },

        cast(slot) {
            const M = BO.OWRPGMode;
            const s = this.s;
            const id = s.player.abilities[slot];
            const A = SD().ABILITIES[slot] && SD().ABILITIES[slot][id];
            if (!A) { BO.Events.emit('hud:toast', { text: `No ${slot} power equipped`, color: '#94a3b8' }); return; }
            if (BO.OWRPGCharacter.powerUnlocked && !BO.OWRPGCharacter.powerUnlocked(s, id)) {
                BO.Events.emit('hud:toast', { text: `${A.name} is locked`, color: '#f97316' });
                return;
            }
            const extraUse = slot === 'primer' && this.cd.primer > 0 && this.primerCharges > 0;
            if ((this.cd[slot] || 0) > 0 && !extraUse) {
                BO.Events.emit('hud:toast', { text: `${A.name} recharging (${Math.ceil(this.cd[slot])} s)`, color: '#94a3b8' });
                return;
            }
            const d = BO.OWRPGCharacter.derived(s);
            const P = BO.Player;
            const eye = P.pos.clone().add(new THREE.Vector3(0, 1.55, 0));
            let ok = true;

            if (slot === 'primer') {
                if (id === 'breach_bash') {
                    const f = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
                    P.vel.x += f.x * 14; P.vel.z += f.z * 14;
                    const hits = BO.OWRPGAI.agentsNear(P.pos.clone().addScaledVector(f, 2.2), 3.2, false);
                    for (const a of hits) { this.applyStatus(a, 'expose'); a.ent.stunTimer = Math.max(a.ent.stunTimer || 0, 1); this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: 'expose' }); }
                    BO.Sound.playMelee();
                } else {
                    const t = this.aim(A.range);
                    const stDef = SD().STATUSES[A.status];
                    BO.FX.spawnTracer(eye, t.point, stDef.hex, 0.05, 0.25);
                    if (A.radius) {
                        BO.FX.spawnExplosion(t.point, A.radius, stDef.hex);
                        for (const a of BO.OWRPGAI.agentsNear(t.point, A.radius, false)) {
                            this.applyStatus(a, A.status);
                            if (id === 'venom_spit_dart') this.applyStatus(a, 'venom');
                            this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: A.status });
                        }
                    } else if (t.agent) {
                        this.applyStatus(t.agent, A.status);
                        if (id === 'venom_spit_dart') this.applyStatus(t.agent, 'venom');
                        this.damage(t.agent, A.dmg * d.statusPotency, { source: 'ability', element: A.status });
                    } else ok = false;
                }
                if (extraUse) this.primerCharges--;
            } else if (slot === 'detonator') {
                const radius = (A.radius || 0) * (1 + (d.fx.detRadius || 0));
                if (id === 'concussion' || id === 'seismic_slam') {
                    BO.FX.spawnExplosion(P.pos.clone().add(UP), radius, id === 'seismic_slam' ? 0xf59e0b : 0xe2e8f0);
                    for (const a of BO.OWRPGAI.agentsNear(P.pos, radius, false)) this.detonate(a, A.dmg);
                } else if (id === 'void_implosion' || id === 'venom_rupture') {
                    const t = this.aim(A.range);
                    const col = id === 'void_implosion' ? 0xc084fc : 0x84cc16;
                    BO.FX.spawnTracer(eye, t.point, col, 0.07, 0.2);
                    BO.FX.spawnExplosion(t.point, radius, col);
                    const near = BO.OWRPGAI.agentsNear(t.point, radius, false);
                    if (near.length) {
                        for (const a of near) this.detonate(a, A.dmg);
                    } else ok = false;
                } else {
                    const t = this.aim(A.range);
                    BO.FX.spawnTracer(eye, t.point, 0xfacc15, 0.06, 0.18);
                    if (t.agent) this.detonate(t.agent, A.dmg); else ok = false;
                }
                if (d.fx.detHeal) M.heal(d.fx.detHeal);
            } else if (slot === 'gadget') {
                if (id === 'med_injector' || id === 'nanite_field') {
                    if (P.hp >= P.maxHp && id === 'med_injector') { BO.Events.emit('hud:toast', { text: 'Already at full health', color: '#94a3b8' }); return; }
                    const total = A.heal * (1 + (d.fx.medMult || 0));
                    this.heal = { left: total, rate: total / (id === 'nanite_field' ? 3 : 2) };
                    if (id === 'nanite_field') P.tacStamina = 1.0;
                } else if (id === 'decoy_holo') {
                    this.spawnDecoy(this.aim(25).point, A.dur);
                } else if (id === 'kinetic_barrier') {
                    this.barrierHp = A.shield || 55;
                    this.barrierT = A.dur || 10;
                    BO.FX.spawnParticles(P.pos.clone().add(UP), 14, 0x38bdf8, 3, 2, 0.5, 1.2);
                    M.toast(`Kinetic Barrier +${this.barrierHp}`, '#38bdf8');
                } else if (id === 'emp_pulse') {
                    BO.FX.spawnExplosion(P.pos.clone().add(UP), A.radius, 0xfacc15);
                    for (const a of BO.OWRPGAI.agentsNear(P.pos, A.radius, false)) {
                        a.ent.stunTimer = Math.max(a.ent.stunTimer || 0, 2.2);
                        this.applyStatus(a, 'shock');
                        this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: 'shock' });
                    }
                }
            } else if (slot === 'ultimate') {
                if (id === 'overdrive_protocol') {
                    this.overdriveT = A.dur || 10;
                    const aw = P.activeWeapon;
                    if (aw) aw.mag = aw.stats.magSize;
                    BO.FX.spawnParticles(P.pos.clone().add(UP), 24, 0xf59e0b, 5, 2, 0.6, 1.3);
                    BO.Events.emit('hud:banner', { title: 'OVERDRIVE PROTOCOL', sub: '10s surge: +25% dmg, +30% crit, lifesteal & speed', color: '#f5a623' });
                } else {
                    const t = this.aim(A.range || 40);
                    const pt = t.point;
                    const col = (SD().STATUSES[A.element] && SD().STATUSES[A.element].hex) || 0xf97316;
                    BO.FX.spawnTracer(pt.clone().add(new THREE.Vector3(0, 26, 0)), pt, col, 0.35, 0.4);
                    BO.FX.spawnExplosion(pt, A.radius || 8, col);
                    for (const a of BO.OWRPGAI.agentsNear(pt, A.radius || 8, false)) {
                        if (id === 'singularity_nova') {
                            a.ent.pos.lerp(pt, 0.55);
                            this.applyStatus(a, 'void');
                            this.detonate(a, A.dmg * 0.7);
                        } else if (id === 'plague_tempest') {
                            this.applyStatus(a, 'venom');
                            this.applyStatus(a, 'chill');
                            this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: 'venom' });
                        } else {
                            this.applyStatus(a, 'burn');
                            this.applyStatus(a, 'shock');
                            this.damage(a, A.dmg * d.statusPotency, { source: 'ability', element: 'burn' });
                        }
                    }
                    BO.Events.emit('hud:banner', { title: A.name.toUpperCase(), sub: 'Ultimate unleashed', color: SD().STATUSES[A.element]?.color || '#f5a623' });
                }
                BO.Sound.playExplosion?.(0.75);
            }

            if (!ok) { BO.Events.emit('hud:toast', { text: 'No target', color: '#94a3b8' }); this.cd[slot] = 1; return; }
            if (!extraUse) this.cd[slot] = A.cd * d.cdMult;
            BO.OWRPGAI.noise(P.pos, slot === 'gadget' ? 6 : 22);
        },

        _extraPrimer() { return BO.OWRPGCharacter.perkFx(this.s).primerCharges > 0; },

        spawnDecoy(point, dur) {
            this.removeDecoy();
            const parts = BO.CharacterMesh.buildSoldier(0, {});
            parts.root.position.copy(point);
            parts.root.traverse((o) => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.45 }); o.userData = {}; } });
            BO.World.scene.add(parts.root);
            this.decoy = { mesh: parts.root, pos: point.clone(), t: dur };
            BO.OWRPGAI.noise(point, 30, true);
        },

        removeDecoy() {
            if (this.decoy && this.decoy.mesh) this.decoy.mesh.removeFromParent();
            this.decoy = null;
        },

        update(dt) {
            for (const k of Object.keys(this.cd)) if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - dt);
            const extra = this._extraPrimer() ? 1 : 0;
            if (this.cd.primer <= 0) this.primerCharges = extra;
            if (this.barrierT > 0) { this.barrierT -= dt; if (this.barrierT <= 0) this.barrierHp = 0; }
            if (this.overdriveT > 0) this.overdriveT = Math.max(0, this.overdriveT - dt);
            if (this.heal) {
                const P = BO.Player;
                const amt = Math.min(this.heal.left, this.heal.rate * dt);
                P.hp = Math.min(P.maxHp, P.hp + amt);
                this.heal.left -= amt;
                if (this.heal.left <= 0 || P.hp >= P.maxHp) this.heal = null;
            }
            if (this.decoy) {
                this.decoy.t -= dt;
                this.decoy.mesh.rotation.y += dt * 1.5;
                if (this.decoy.t <= 0) this.removeDecoy();
            }
        }
    };

    BO.OWRPGCombat = Combat;
})(window.BO);
;

/* --- src/owrpg/OWRPGAI.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Agents, Stealth, Faction Uniforms & 3D Bars
   - 4-faction + raider uniform color tinting on BotAI soldiers
   - Floating 3D world-space enemy health / level / 5-element status bars
   - Codex kill tracking & repeatable Bounty progress hooks
============================================================================ */
(function (BO) {
    'use strict';

    const SD = () => BO.OWRPGStatsData;
    const UP = new THREE.Vector3(0, 1.2, 0);
    const SIDE = { militia: 0, aegis: 0, raiders: 1, syndicate: 1, helix: 1, brood: 2 };
    const CONE_COS = Math.cos((110 / 2) * Math.PI / 180);
    const AGENT_DETAIL_DIST = 28;   // metres: beyond this agents render as a merged proxy (MeshProxy)

    // Distinct uniform tint palettes per faction (applied to BotAI meshes)
    const FACTION_PALETTE = {
        militia: { tint: 0xd99b43, accent: 0xf5a623 },
        syndicate: { tint: 0xb9423a, accent: 0xef4444 },
        aegis: { tint: 0x4b87b8, accent: 0x38bdf8 },
        helix: { tint: 0x8f5cb8, accent: 0xc084fc },
        raiders: { tint: 0x7c5840, accent: 0xf97316 }
    };

    const ELEM_ICON = { burn: '🔥', chill: '❄', shock: '⚡', venom: '☠', void: '✦', expose: '◈' };

    function styleFactionBot(ent, faction, isBoss) {
        const pal = FACTION_PALETTE[faction];
        if (!pal || !ent || !ent.parts || !ent.parts.root) return;
        const cloned = new Map();
        ent.parts.root.traverse((o) => {
            if (!o.isMesh || !o.material) return;
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            const next = mats.map((m) => {
                if (cloned.has(m)) return cloned.get(m);
                const c = m.clone();
                if (c.isMeshStandardMaterial && c.color) {
                    c.color.lerp(new THREE.Color(pal.tint), 0.35);
                } else if (c.isMeshBasicMaterial && c.color) {
                    c.color.setHex(pal.accent);
                }
                cloned.set(m, c);
                return c;
            });
            o.material = Array.isArray(o.material) ? next : next[0];
        });
        if (isBoss) ent.parts.root.scale.setScalar(1.28);
    }

    function makeBarSprite() {
        const cv = document.createElement('canvas');
        cv.width = 256;
        cv.height = 56;
        const tex = new THREE.CanvasTexture(cv);
        const mat = new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true });
        const sp = new THREE.Sprite(mat);
        sp.scale.set(1.9, 0.42, 1);
        sp.visible = false;
        return { sprite: sp, canvas: cv, ctx: cv.getContext('2d'), tex, lastKey: '' };
    }

    function updateBarSprite(a) {
        const b = a.bar;
        if (!b) return;
        const stKeys = Object.keys(a.st);
        const hpInt = Math.ceil(a.ent.hp);
        const key = `${hpInt}|${a.state}|${a.hostile ? 1 : 0}|${a.champ ? 'c' : ''}|${stKeys.map((k) => k + (a.st[k].stacks || 1)).join(',')}`;
        if (b.lastKey === key) return;
        b.lastKey = key;

        const g = b.ctx;
        g.clearRect(0, 0, 256, 56);
        const pct = Math.max(0, Math.min(1, a.ent.hp / Math.max(1, a.ent.maxHp)));
        const facCol = (BO.OWRPGFactionsData.FACTIONS[a.faction]?.color) || (a.hostile ? '#ef4444' : '#4ade80');

        g.font = 'bold 18px "Segoe UI", sans-serif';
        g.textAlign = 'center';
        g.fillStyle = 'rgba(0,0,0,0.75)';
        g.fillText(`LV ${a.lvl} ${a.name.slice(0, 18)}`, 129, 20);
        g.fillStyle = a.boss ? '#fde047' : a.champ ? '#f0abfc' : '#f8fafc';
        g.fillText(`LV ${a.lvl} ${a.name.slice(0, 18)}`, 128, 19);

        // HP Bar
        g.fillStyle = 'rgba(10,12,14,0.85)';
        g.fillRect(28, 25, 200, 12);
        g.fillStyle = a.hostile ? (a.boss ? '#f59e0b' : a.champ ? a.champ.color : '#ef4444') : facCol;
        g.fillRect(30, 27, Math.round(196 * pct), 8);
        g.strokeStyle = 'rgba(255,255,255,0.28)';
        g.lineWidth = 1;
        g.strokeRect(28, 25, 200, 12);

        // Status icons, or the Champion's affixes when it has no statuses.
        if (stKeys.length) {
            g.font = 'bold 16px "Segoe UI", sans-serif';
            const badges = stKeys.map((k) => (ELEM_ICON[k] || '*') + (k === 'venom' && a.st[k].stacks > 1 ? a.st[k].stacks : '')).join(' ');
            g.fillStyle = '#fde68a';
            g.fillText(badges, 128, 52);
        } else if (a.champ) {
            g.font = 'bold 14px "Segoe UI", sans-serif';
            const lbl = '★ ' + BO.OWRPGChampions.label(a).toUpperCase();
            g.fillStyle = 'rgba(0,0,0,0.8)'; g.fillText(lbl, 129, 53);
            g.fillStyle = a.champ.color; g.fillText(lbl, 128, 52);
        }
        b.tex.needsUpdate = true;
    }

    const AI = {
        agents: [],
        projectiles: [],
        nextId: 1,
        warnT: {},

        get s() { return BO.OWRPGMode.state; },

        clear() {
            for (const a of this.agents.slice()) this.despawn(a);
            for (const p of this.projectiles) p.mesh.removeFromParent();
            this.agents = [];
            this.projectiles = [];
            this.warnT = {};
        },

        spawn(defId, x, z, opts = {}) {
            const def = SD().ENEMIES[defId];
            if (!def) return null;
            const y = opts.y != null ? opts.y : BO.World.getGroundHeight(x, z, BO.World.terrainHeight(x, z) + 1.5);
            const id = this.nextId++;
            let ent;
            if (def.kind === 'bot') {
                const diff = def.lvl >= 12 ? 'veteran' : def.lvl >= 7 ? 'hardened' : def.lvl >= 4 ? 'regular' : 'recruit';
                ent = new BO.BotAI({ id: 10000 + id, name: def.name, team: SIDE[def.faction] ?? 1, x, y, z, weaponId: def.weapon, maxHp: def.hp, difficulty: diff, speedScale: 0.85, respawnDelay: 1e9 });
                ent.post = { x, y, z, r: opts.postR || 6 };
                ent.yaw = Math.random() * Math.PI * 2;
                styleFactionBot(ent, def.faction, !!def.boss);
            } else {
                const base = BO.ZombiesData.get(def.body);
                const spec = Object.assign({}, base, {
                    name: def.name, hp: def.hp, speed: def.speed, attack: def.dmg, defense: 0,
                    resistances: { bullet: 1, explosive: 1, fire: 1, headshot: 1, melee: 1 },
                    attackType: def.ranged ? (base.attackType === 'melee' ? 'acid_spit' : base.attackType) : 'melee',
                    isBoss: !!def.boss, isSuperBoss: false, isMagical: false, splitCount: 0, jumpChance: 0
                });
                ent = new BO.ZombieEntity({ id: 10000 + id, spec, round: def.lvl, hp: def.hp, speed: def.speed, damage: def.dmg, x, y, z, sizeMult: def.boss ? 1.5 : 1, windowInteractive: null });
                ent.yaw = Math.random() * Math.PI * 2;
            }
            const bar = makeBarSprite();
            bar.sprite.position.set(0, def.boss ? 2.85 : 2.15, 0);
            ent.parts.root.add(bar.sprite);

            const agent = {
                id, defId, def, ent, kind: def.kind, faction: def.faction, name: def.name, boss: !!def.boss,
                poiId: opts.poiId || null, home: { x, y, z }, leash: opts.leash || 55,
                armor: def.armor, lvl: def.lvl, st: {}, ruptureT: 0, shredStacks: 0, alive: true,
                state: 'idle', detect: 0, investigate: null, lostT: 0, idlePhase: Math.random() * 10, wanderT: 0, goal: null,
                hostile: BO.OWRPGFactions.isHostile(this.s, def.faction),
                bar
            };
            ent.owAgent = agent;
            this.agents.push(agent);
            if (!def.glb && BO.MeshProxy) {
                // Far LOD shared by every agent of the same rig type (see MeshProxy.js).
                const key = def.kind === 'bot' ? 'ow-bot:' + def.faction + ':' + !!def.boss + ':' + def.weapon : 'ow-beast:' + def.body + ':' + !!def.boss;
                agent.lod = BO.MeshProxy.attach(ent.parts.root, key);
            }
            if (def.glb && BO.Assets) {
                const root = ent.parts.root;
                const fallback = root.children.filter(child => child !== bar.sprite);
                agent.visual = BO.Assets.placeGLB(root, def.glb, {
                    fitSize: [100, (def.glbScale || 1.8) / root.scale.y, 100], uniform: true,
                    guardScene: BO.World.scene, ownerSession: null,
                    onLoad: (holder, model) => {
                        if (!agent.alive || !this.agents.includes(agent)) { holder.removeFromParent(); return; }
                        for (const child of fallback) child.visible = false;
                        bar.sprite.position.y = (def.glbScale || 1.8) / root.scale.y + 0.35;
                        if (model.animations?.length) {
                            agent.mixer = new THREE.AnimationMixer(model);
                            agent.clips = model.animations;
                            agent.actions = {};
                        }
                    }
                });
            }
            BO.OWRPGChampions?.onSpawn(agent, opts);
            return agent;
        },

        despawn(agent) {
            if (agent.lod) { BO.MeshProxy.detach(agent.lod); agent.lod = null; }
            if (agent.mixer) { agent.mixer.stopAllAction(); agent.mixer.uncacheRoot(agent.mixer.getRoot()); }
            if (agent.bar) { agent.bar.tex.dispose(); agent.bar.sprite.material.dispose(); }
            agent.ent.destroy();
            const i = this.agents.indexOf(agent);
            if (i >= 0) this.agents.splice(i, 1);
        },

        agentsNear(pos, r, onlyHostile) {
            const out = [];
            for (const a of this.agents) {
                if (!a.alive || (onlyHostile && !a.hostile && a.state !== 'combat')) continue;
                if (BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, pos.x, pos.z) <= r) out.push(a);
            }
            return out;
        },

        anyHostileInCombat() { return this.agents.some((a) => a.alive && a.state === 'combat' && a.hostile); },

        activeBoss() {
            const P = BO.Player;
            let best = null, bd = 65;
            for (const a of this.agents) {
                if (!a.alive || !a.boss) continue;
                const d = BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, P.pos.x, P.pos.z);
                if (a.state === 'combat' || d < bd) { bd = d; best = a; }
            }
            return best;
        },

        awareness() {
            let best = 0, combat = false;
            for (const a of this.agents) {
                if (!a.alive || !a.hostile) continue;
                if (a.state === 'combat') combat = true;
                best = Math.max(best, a.detect);
            }
            return combat ? 1.01 : Math.min(1, best);
        },

        noise(pos, radius, decoy = false) {
            for (const a of this.agents) {
                if (!a.alive || !a.hostile || a.state === 'combat') continue;
                const d = BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, pos.x, pos.z);
                if (d > radius) continue;
                a.investigate = { x: pos.x, z: pos.z, t: 10 };
                a.detect = Math.max(a.detect, decoy ? 0.5 : (d < radius * 0.4 ? 1 : 0.6));
                if (a.detect >= 1) this.engage(a); else a.state = 'suspicious';
            }
        },

        engage(a, spread = true) {
            if (!a.alive || a.state === 'combat') return;
            a.state = 'combat';
            a.detect = 1;
            a.lostT = 0;
            if (a.kind === 'bot') BO.Sound.playUIClick?.();
            if (spread) {
                for (const o of this.agents) {
                    if (o !== a && o.alive && o.hostile && o.state !== 'combat' && (o.poiId === a.poiId || BO.Math.dist2D(o.ent.pos.x, o.ent.pos.z, a.ent.pos.x, a.ent.pos.z) < 22)) this.engage(o, false);
                }
            }
        },

        onDamaged(a, ctx) {
            if (!a.alive) return;
            if (!a.hostile && BO.OWRPGFactionsData.FACTIONS[a.faction] && ctx.source !== 'reaction') {
                BO.OWRPGMode.setFlag('provoked_' + a.faction, true);
                BO.OWRPGMode.changeRep(a.faction, -40);
                BO.Events.emit('hud:toast', { text: `${BO.OWRPGFactionsData.FACTIONS[a.faction].short.toUpperCase()} TURNED HOSTILE`, color: '#ef4444' });
                this.refreshHostility();
            }
            if (a.hostile) this.engage(a);
        },

        onKilled(a, ctx = {}) {
            if (!a.alive) return;
            a.alive = false;
            if (a.bar) a.bar.sprite.visible = false;
            const M = BO.OWRPGMode;
            const s = this.s;
            if (a._chilled) a._chilled = false;
            if (!ctx.byNpc) {
                const xp = a.def.xp * BO.OWRPGCharacter.killXpMult(s, a.lvl) * (1 + (BO.OWRPGCharacter.perkFx(s).killXpBonus || 0)) * (ctx.sneak ? 1.5 : 1);
                M.giveXp(xp, ctx.sneak ? 'Sneak kill' : null);
                s.stats.kills++;
                if (ctx.source === 'gun' || ctx.source === 'melee') BO.OWRPGCharacter.addSkillXp(s, 'combat', Math.max(8, a.lvl * 3));
                if (a.kind === 'beast' || a.boss) BO.OWRPGCharacter.addSkillXp(s, 'slayer', a.boss ? 100 : Math.max(10, a.lvl * 3));
                if (BO.OWRPGWorldData.isInterior(a.ent.pos.x, a.ent.pos.z)) BO.OWRPGCharacter.addSkillXp(s, 'delving', a.boss ? 120 : 12);
                if (s.player.codex && s.player.codex.enemies) {
                    s.player.codex.enemies[a.defId] = (s.player.codex.enemies[a.defId] || 0) + 1;
                }
                if (s.player.bounties && s.player.bounties.active) {
                    const B = BO.OWRPGExpansionData?.BOUNTIES?.find((b) => b.id === s.player.bounties.active);
                    if (B && B.target === a.defId) {
                        s.player.bounties.progress = (s.player.bounties.progress || 0) + 1;
                        if (s.player.bounties.progress >= B.count) {
                            M.giveXp(B.xp, 'Bounty');
                            s.player.credits += Math.round(B.credits * (1 + (BO.OWRPGCharacter.perkFx(s).bountyMult || 0)));
                            for (const [f, v] of Object.entries(B.rep || {})) M.changeRep(f, v);
                            s.player.bounties.completed = (s.player.bounties.completed || 0) + 1;
                            s.player.bounties.active = null;
                            s.player.bounties.progress = 0;
                            BO.Sound?.playQuestFanfare?.();
                            BO.Events.emit('hud:banner', { title: 'BOUNTY COMPLETE', sub: `${B.title} · +${B.xp} XP · +${B.credits} cr`, color: '#fbbf24' });
                        } else {
                            M.toast(`Bounty: ${s.player.bounties.progress}/${B.count} ${a.name}`, '#fbbf24');
                        }
                    }
                }
                if (ctx.sneak) {
                    s.stats.sneakKills++;
                    const fx = BO.OWRPGCharacter.perkFx(s);
                    if (fx.camoOnKill) M.camoT = Math.max(M.camoT, fx.camoOnKill);
                }
                const fx = BO.OWRPGCharacter.perkFx(s);
                if (fx.killHeal) M.heal(fx.killHeal);
                if (BO.OWRPGFactionsData.FACTIONS[a.faction]) BO.OWRPGFactions.onFactionKill(s, a.faction);
            }
            BO.OWRPGChampions?.onKilled(a, ctx);
            M.setFlag('killed_' + a.defId, true);
            BO.OWRPGQuests.onEvent(s, 'kill', a.defId);
            if (a.poiId) BO.OWRPGWorldSim.onAgentKilled(a);
            M.dropLoot(a.ent.pos, a.def.loot, a.boss ? 4 : 1);
        },

        refreshHostility() {
            const s = this.s;
            for (const a of this.agents) {
                const h = a.eventHostile || BO.OWRPGFactions.isHostile(s, a.faction);
                if (h === a.hostile) continue;
                a.hostile = h;
                if (!h && a.state === 'combat') { a.state = 'idle'; a.detect = 0; }
            }
        },

        /* ------------------------------------------------ 10 Hz perception */
        tick10(dt) {
            const s = this.s;
            const P = BO.Player;
            const M = BO.OWRPGMode;
            const d = BO.OWRPGCharacter.derived(s);
            const enc = BO.OWRPGCharacter.encumbrance(s);
            const light = BO.OWRPGWorldSim.light;
            const speed = Math.hypot(P.vel.x, P.vel.z);
            const stepR = (P.sprinting || P.tacSprinting ? 14 : speed > 1 ? 7 : 0) * (P.crouching ? 0.35 : 1) * d.noiseMult * enc.noise;
            const camo = M.camoT > 0;
            const wary = {};
            for (const a of this.agents) {
                if (!a.alive) continue;
                const dist = BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, P.pos.x, P.pos.z);
                if (!a.hostile) {
                    if (BO.OWRPGFactions.isWary(s, a.faction) && dist < 12) wary[a.faction] = true;
                    continue;
                }
                if (a.state === 'combat') {
                    const los = dist < 45 && BO.World.hasLineOfSight(a.ent.pos.x, a.ent.pos.y + 1.5, a.ent.pos.z, P.pos.x, P.pos.y + 1.4, P.pos.z);
                    a.lostT = los && !camo ? 0 : a.lostT + dt * (d.fx.vanish ? 2 : 1);
                    if (a.lostT > 12 && dist > 25) { a.state = 'suspicious'; a.detect = 0.6; a.investigate = { x: P.pos.x, z: P.pos.z, t: 12 }; }
                    const fromHome = BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, a.home.x, a.home.z);
                    if (fromHome > a.leash && BO.Math.dist2D(P.pos.x, P.pos.z, a.home.x, a.home.z) > a.leash + 15) { a.state = 'return'; a.detect = 0; }
                    continue;
                }
                if (a.state === 'return') continue;
                let gain = 0;
                const sight = (a.kind === 'bot' ? 40 : 26) * (0.6 + 0.4 * light);
                if (!camo && dist < sight) {
                    const fx = Math.sin(a.ent.yaw), fz = Math.cos(a.ent.yaw);
                    const dx = (P.pos.x - a.ent.pos.x) / Math.max(0.1, dist), dz = (P.pos.z - a.ent.pos.z) / Math.max(0.1, dist);
                    const inCone = dist < 4 || fx * dx + fz * dz > CONE_COS || (a.state === 'suspicious' && dist < sight * 0.6);
                    const periph = !inCone && dist < 12 ? 0.3 : 0;
                    if ((inCone || periph) && BO.World.hasLineOfSight(a.ent.pos.x, a.ent.pos.y + 1.5, a.ent.pos.z, P.pos.x, P.pos.y + (P.crouching ? 0.9 : 1.4), P.pos.z)) {
                        gain += (0.15 + 2.0 * Math.pow(1 - dist / sight, 1.5)) * (inCone ? 1 : periph) * (P.crouching ? 0.45 : 1) * (P.sprinting ? 1.3 : 1) * (1 - d.detectSlow);
                    }
                }
                if (stepR > 0 && dist < stepR) {
                    gain += 0.5 * (1 - dist / stepR);
                    a.investigate = { x: P.pos.x, z: P.pos.z, t: 6 };
                }
                if (gain > 0) a.detect = Math.min(1, a.detect + gain * dt);
                else a.detect = Math.max(0, a.detect - dt * 0.12 * (d.fx.vanish ? 2 : 1));
                if (a.detect >= 1) this.engage(a);
                else if (a.detect > 0.35) { a.state = 'suspicious'; if (!a.investigate) a.investigate = { x: P.pos.x, z: P.pos.z, t: 6 }; }
                else if (a.state === 'suspicious' && a.detect < 0.1) a.state = 'idle';
            }
            for (const f of Object.keys(BO.OWRPGFactionsData.FACTIONS)) {
                if (wary[f]) {
                    if (!this.warnT[f]) BO.Events.emit('hud:toast', { text: `${BO.OWRPGFactionsData.FACTIONS[f].short}: "Back off. Last warning."`, color: '#f97316' });
                    this.warnT[f] = (this.warnT[f] || 0) + dt;
                    if (this.warnT[f] > 4) { M.setFlag('provoked_' + f, true); this.refreshHostility(); }
                } else this.warnT[f] = 0;
            }
        },

        /* ------------------------------------------------ per-frame */
        update(dt) {
            const P = BO.Player;
            const decoy = BO.OWRPGCombat.decoy;
            const ents = [];
            const bots = [];
            for (const a of this.agents) { if (a.alive) ents.push(a.ent); if (a.kind === 'bot' && a.alive) bots.push(a.ent); }
            const beastCb = {
                allowProjectiles: true,
                getTarget: (z) => (decoy && z.owAgent && z.pos.distanceTo(decoy.pos) < 25) ? { x: decoy.pos.x, y: decoy.pos.y, z: decoy.pos.z, attackRange: 1.4 } : null,
                onAttackCustomTarget: () => {},
                onMeleePlayer: (z) => { P.takeDamage(z.damage, z.pos, false, z); BO.Sound.playZombieGroan(z.soundProfile, 0.9); },
                onRangedAttack: (z, tx, ty, tz) => this._spit(z, tx, ty, tz)
            };
            const hitMeshes = [];
            for (let i = this.agents.length - 1; i >= 0; i--) {
                const a = this.agents[i];
                const ent = a.ent;
                if (a.alive && !ent.alive) this.onKilled(a, { byNpc: true });
                if (a.alive) BO.OWRPGCombat.tickStatuses(a, dt);
                if (!a.alive) {
                    if (a.lod) BO.MeshProxy.set(a.lod, false);
                    if (a.kind === 'beast') { if (!ent.update(dt, ents, beastCb)) { this.despawn(a); } }
                    else { a.deadT = (a.deadT || 0) + dt; if (a.deadT > 0.2) this.despawn(a); }
                    continue;
                }
                const dist = BO.Math.dist2D(ent.pos.x, ent.pos.z, P.pos.x, P.pos.z);
                if (a.lod) BO.MeshProxy.set(a.lod, dist > AGENT_DETAIL_DIST);

                // Floating 3D world-space bar visibility
                if (a.bar) {
                    const showBar = ent.parts.root.visible && dist < (a.champ ? 48 : 34) && (a.state === 'combat' || ent.hp < ent.maxHp || a.boss || a.champ || Object.keys(a.st).length > 0);
                    a.bar.sprite.visible = showBar;
                    if (showBar) updateBarSprite(a);
                }

                const engaged = a.state === 'combat' && a.hostile;
                const rivalNear = a.kind === 'bot' && !engaged && bots.some((b) => b !== ent && b.team !== ent.team && b.pos.distanceTo(ent.pos) < 40);
                if (a.kind === 'bot' && (engaged || rivalNear)) {
                    if (engaged && decoy && ent.pos.distanceTo(decoy.pos) < 25) this._walk(a, decoy.pos.x, decoy.pos.z, 3.2, dt);
                    else {
                        ent.update(dt, {
                            playerAlive: P.alive && BO.OWRPGMode.camoT <= 0, playerPos: P.pos, playerTeam: engaged ? (ent.team === 0 ? 1 : 0) : ent.team, bots,
                            modeType: 'owrpg', objectivePos: null,
                            onBotShootPlayer: (bot, dmg) => P.takeDamage(dmg * 0.78, bot.pos, false, bot),
                            onBotKillBot: (killer, victim) => { if (victim.owAgent) this.onKilled(victim.owAgent, { byNpc: true }); }
                        });
                    }
                } else if (a.kind === 'beast' && engaged) {
                    if (!ent.update(dt, ents, beastCb)) { this.despawn(a); continue; }
                } else if (a.state === 'return') {
                    if (this._walk(a, a.home.x, a.home.z, 3.4, dt) < 2) { a.state = 'idle'; ent.hp = ent.maxHp; a.st = {}; a.shredStacks = 0; }
                } else if (a.state === 'suspicious' && a.investigate) {
                    a.investigate.t -= dt;
                    if (this._walk(a, a.investigate.x, a.investigate.z, 2.2, dt) < 1.5 || a.investigate.t <= 0) { a.investigate = null; a.detect *= 0.6; }
                } else this._idle(a, dt);
                if (a.visual && dist < 130) {
                    const speed = a.lastVisualPos ? ent.pos.distanceTo(a.lastVisualPos) / Math.max(0.001, dt) : 0;
                    a.lastVisualPos = ent.pos.clone();
                    if (a.mixer) {
                        const desired = speed > 0.2 ? /walk|run/i : engaged && dist < 3 ? /attack|punch|bite/i : /idle/i;
                        const clip = a.clips.find(c => desired.test(c.name)) || a.clips[0];
                        if (clip && a.clip !== clip.name) {
                            const next = a.actions[clip.name] || (a.actions[clip.name] = a.mixer.clipAction(clip));
                            if (a.action) a.action.fadeOut(0.18);
                            next.reset().fadeIn(0.18).play(); a.action = next; a.clip = clip.name;
                        }
                        a.mixer.update(dt);
                    } else {
                        a.visual.position.y = speed > 0.2 ? Math.abs(Math.sin((a.idlePhase += dt * 8))) * 0.06 : Math.sin((a.idlePhase += dt * 1.6)) * 0.015;
                        a.visual.rotation.z = speed > 0.2 ? Math.sin(a.idlePhase) * 0.035 : 0;
                    }
                }
                if (dist < 130 && ent.parts.root.visible) {
                    const meshes = ent.getHitboxMeshes();
                    for (let m = 0; m < meshes.length; m++) hitMeshes.push(meshes[m]);
                }
            }
            BO.Combat.setTargetPool(hitMeshes);
            this._updateProjectiles(dt);
        },

        _walk(a, x, z, speed, dt) {
            const ent = a.ent;
            const dx = x - ent.pos.x, dz = z - ent.pos.z;
            const d = Math.hypot(dx, dz);
            if (d > 0.3) {
                const sp = speed * (a._chilled ? 0.55 : 1);
                ent.pos.x += (dx / d) * sp * dt;
                ent.pos.z += (dz / d) * sp * dt;
                ent.yaw += BO.Math.angleDiff(ent.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 6);
                BO.World.resolveHorizontal(ent.pos, ent.radius || 0.4, ent.height || 1.75, false);
            }
            ent.pos.y = BO.World.getGroundHeight(ent.pos.x, ent.pos.z, ent.pos.y + 0.4);
            a.idlePhase += dt * (d > 0.3 ? speed * 2.2 : 1);
            ent.parts.root.position.copy(ent.pos);
            ent.parts.root.rotation.y = ent.yaw;
            BO.CharacterMesh.animateLimbs(ent.parts, d > 0.3 ? speed : 0, a.idlePhase, 0, 0);
            return d;
        },

        _idle(a, dt) {
            a.wanderT -= dt;
            if (a.kind === 'bot') {
                if (!a.goal || a.wanderT <= 0) {
                    a.watching = !a.watching && Math.random() < 0.65;
                    if (a.watching) { a.lookYaw = a.ent.yaw; a.wanderT = 3 + Math.random() * 4; }
                    else {
                        const r = Math.random() * (a.ent.post ? a.ent.post.r : 5), ang = Math.random() * Math.PI * 2;
                        a.goal = { x: a.home.x + Math.cos(ang) * r, z: a.home.z + Math.sin(ang) * r };
                        a.wanderT = 4 + Math.random() * 4;
                    }
                }
                if (a.watching) {
                    a.idlePhase += dt;
                    const ent = a.ent;
                    ent.yaw = a.lookYaw + Math.sin(a.idlePhase * 0.5) * 0.9;
                    ent.parts.root.rotation.y = ent.yaw;
                    BO.CharacterMesh.animateLimbs(ent.parts, 0, a.idlePhase * 1.4, 0, 0);
                } else this._walk(a, a.goal.x, a.goal.z, 1.3, dt);
            } else {
                a.idlePhase += dt;
                const ent = a.ent;
                ent.yaw += Math.sin(a.idlePhase * 0.4) * dt * 0.4;
                ent.parts.root.position.copy(ent.pos);
                ent.parts.root.rotation.y = ent.yaw;
                BO.CharacterMesh.animateLimbs(ent.parts, 0, a.idlePhase * 1.5, 0, 0);
            }
        },

        _spit(z, tx, ty, tz) {
            const origin = new THREE.Vector3(z.pos.x, z.pos.y + 1.4, z.pos.z);
            const dir = new THREE.Vector3(tx - origin.x, ty - origin.y, tz - origin.z).normalize();
            const elem = z.owAgent && z.owAgent.def && z.owAgent.def.elem;
            const col = elem === 'void' ? 0xc084fc : (elem === 'chill' ? 0x38bdf8 : 0x84cc16);
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: col }));
            mesh.position.copy(origin);
            BO.World.scene.add(mesh);
            this.projectiles.push({ mesh, pos: origin, vel: dir.multiplyScalar(15), dmg: Math.round(z.damage * 0.85), life: 3, owner: z, col });
        },

        _updateProjectiles(dt) {
            const P = BO.Player;
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                p.life -= dt;
                const step = p.vel.clone().multiplyScalar(dt);
                const wall = BO.World.raycastWorld(p.pos, step.clone().normalize(), step.length() + 0.1);
                p.pos.add(step);
                p.mesh.position.copy(p.pos);
                const hit = P.alive && BO.Math.dist3D(p.pos.x, p.pos.y, p.pos.z, P.pos.x, P.pos.y + 1.1, P.pos.z) < 0.8;
                if (hit) P.takeDamage(p.dmg, p.owner.pos, false, p.owner);
                if (hit || wall || p.life <= 0) {
                    BO.FX.spawnParticles(p.pos, 6, p.col || 0x84cc16, 3, 6, 0.35, 1);
                    p.mesh.removeFromParent();
                    this.projectiles.splice(i, 1);
                }
            }
        },

        _upVec: UP
    };

    BO.OWRPGAI = AI;
})(window.BO);
;

/* --- src/owrpg/OWRPGWorldArt.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · World Art 2.0 (1280 x 1280 m & 12 Dungeons)
   - GPU-instanced trees, rocks, castles, crypts, banners & dungeon dressing
   - Keeps total draw calls well below 180 across the 4x larger world!
   - Distance-culls detailed settlement/dungeon 3D GLB clusters cleanly.
============================================================================ */
(function (BO) {
    'use strict';

    function rng(seed) {
        let a = seed >>> 0;
        return () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    const std = (color, opts) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0.2 }, opts || {}));
    const glow = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, fog: false, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });

    function addCol(world, x, z, hw, hd, y0, y1) {
        world.colliders.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd, minY: y0, maxY: y1, active: true });
    }
    function mesh(scene, world, geo, mat, x, y, z, solid = true) {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
        if (solid) world.worldMeshes.push(m);
        return m;
    }

    let strutBatches = null;
    function strut(scene, world, mat, x1, y1, z1, x2, y2, z2, r = 0.18) {
        const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
        const m = new THREE.Object3D();
        m.position.copy(a).add(b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        m.scale.set(r, a.distanceTo(b), r);
        m.updateMatrix();
        let list = strutBatches.get(mat);
        if (!list) strutBatches.set(mat, list = []);
        list.push(m.matrix.clone());
    }
    function flushStruts(scene) {
        const geo = new THREE.CylinderGeometry(1, 1, 1, 5);
        for (const [mat, list] of strutBatches) {
            const im = new THREE.InstancedMesh(geo, mat, list.length);
            list.forEach((mx, i) => im.setMatrixAt(i, mx));
            im.castShadow = true;
            im.frustumCulled = false;
            scene.add(im);
        }
        strutBatches = null;
    }

    const WEATHER_COLORS = {
        haven_basin: 0xfde68a,
        whispering_woods: 0x86efac,
        rust_sprawl: 0xd6b08c,
        barrow_moor: 0xc4b5fd,
        mire_delta: 0x84cc16,
        ash_quarry: 0xf97316,
        sunscorched_badlands: 0xfbbf24,
        sunken_coast: 0x67e8f9,
        alpine_array: 0xe2e8f0,
        frostfang_peaks: 0xbae6fd,
        meridian_core: 0xc084fc,
        obsidian_dragonwilds: 0xef4444
    };

    const Art = {
        populate(world, scene) {
            const D = BO.OWRPGWorldData;
            const t = world.terrain;
            const out = { beacons: [], plumes: [], arcs: [], spinners: [], pylons: {}, waters: [], flames: [], weather: null, weatherRegion: 'haven_basin', culledGroups: [] };
            world.owrpg = out;
            strutBatches = new Map();
            if (BO.Assets && BO.Assets.applySkybox) {
                BO.Assets.applySkybox(scene, 'skybox-morning.png');
            }
            for (const L of D.LANDMARKS) {
                const fn = this['_lm_' + L.id] || this._lm_spire;
                fn.call(this, world, scene, L, t.height(L.x, L.z), out);
            }
            this._vegetation(world, scene, D);
            this._water(scene, D, out);
            for (const p of D.PYLONS) {
                out.pylons[p.id] = this._pylon(world, scene, p, t.height(p.x, p.z));
                // A 6 m pylon is a couple of pixels beyond ~420 m; stop drawing it there (6 draw calls each).
                out.culledGroups.push({ group: out.pylons[p.id].group, x: p.x, z: p.z, r: 420 });
            }
            flushStruts(scene);
            this._townWarmth(scene, D, t, out);
            this._weatherMotes(scene, out);
            this._dressFrontierAndDungeons(scene, D, t, out);
            return out;
        },

        _dressFrontierAndDungeons(scene, D, t, out) {
            if (!BO.Assets || !BO.Assets.placeGLB) return;
            const addCluster = (cx, cz, radius, buildFn) => {
                const g = new THREE.Group();
                scene.add(g);
                out.culledGroups.push({ group: g, x: cx, z: cz, r: radius });
                buildFn(g);
            };
            const pSurface = (grp, path, x, z, rot, scale) => {
                BO.Assets.placeGLB(grp, path, { pos: [x, t.height(x, z), z], rot, scale, castShadow: false, guardScene: scene });
            };

            // 1. Freestead Town
            const T = D.TOWN;
            addCluster(T.x, T.z, 95, (g) => {
                pSurface(g, 'mini_forest_kit/tent.glb', T.x - 22, T.z - 6, 0.4, 3.4);
                pSurface(g, 'mini_arena_kit/weapon-rack.glb', T.x - 5, T.z - 6, -0.6, 2.3);
                pSurface(g, 'mini_arena_kit/banner.glb', T.x + 4, T.z - 16, 0.2, 2.8);
                pSurface(g, 'mini_arena_kit/statue.glb', T.x, T.z + 7, 0.8, 2.8);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-canvas-market-stall.glb', T.x + 18, T.z - 4, -0.5, 2.2);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-timber-wellhead.glb', T.x, T.z, 0, 2.0);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-cargo-handcart.glb', T.x - 18, T.z + 6, 0.7, 2.0);
            });

            // 2. Whispering Pinewoods (Ranger's Watch Lodge & Root-Barrow)
            addCluster(-445, 395, 130, (g) => {
                pSurface(g, 'mini_forest_kit/tent.glb', -432, 368, 0.5, 3.5);
                pSurface(g, 'mini_forest_kit/target.glb', -406, 368, -0.4, 2.5);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-wooden-weapon-rack.glb', -414, 355, 0, 2.2);
                pSurface(g, 'castle_kit/gate.glb', -475, 442, 0, 3.2);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-giant-keep-banner.glb', -482, 442, 0, 2.6);
            });

            // 3. Barrow-Moor Graveyard (Grimhollow Chapel, Marrow Crypt, Crimson Manor)
            addCluster(-470, 5, 150, (g) => {
                pSurface(g, 'graveyard_kit/crypt-large.glb', -475, -82, 0, 3.2);
                pSurface(g, 'graveyard_kit/altar-stone.glb', -425, 22, 0, 2.6);
                pSurface(g, 'graveyard_kit/coffin.glb', -483, -72, 0.3, 2.4);
                pSurface(g, 'graveyard_kit/candle-multiple.glb', -422, 18, 0, 2.4);
                pSurface(g, 'castle_kit/flag-banner-long.glb', -525, 88, 0, 3.2);
                pSurface(g, 'castle_kit/flag-banner-long.glb', -545, 88, 0, 3.2);
            });

            // 4. Sunscorched Badlands (Dustwind Oasis & Sunfang Pyramid)
            addCluster(435, 430, 150, (g) => {
                pSurface(g, 'pixel_fantasy/pixel-fantasy-canvas-market-stall.glb', 392, 402, 0.4, 2.4);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-wooden-barrel.glb', 380, 403, 0, 2.0);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-standalone-lion-statue.glb', 478, 478, 0, 2.8);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-standalone-lion-statue.glb', 492, 478, 0, 2.8);
            });

            // 5. Frostfang Peaks & Obsidian Dragonwilds
            addCluster(-455, -445, 140, (g) => {
                pSurface(g, 'castle_kit/siege-ballista.glb', -442, -432, 0.4, 3.0);
                pSurface(g, 'castle_kit/flag-banner-long.glb', -448, -438, 0, 3.5);
                pSurface(g, 'castle_kit/flag-banner-long.glb', -462, -438, 0, 3.5);
            });
            addCluster(420, -420, 160, (g) => {
                pSurface(g, 'pixel_fantasy/pixel-fantasy-iron-brazier.glb', 478, -480, 0, 2.8);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-iron-brazier.glb', 492, -480, 0, 2.8);
                pSurface(g, 'pixel_fantasy/pixel-fantasy-carved-weathered-limestone-ritual-altar.glb', 430, -395, 0, 2.6);
                pSurface(g, 'mini_forest_kit/tent.glb', 345, -340, 0.6, 3.4);
            });

            // 6. Dress all 12 Sealed Dungeons with distance-culled 3D banners, braziers, altars & columns!
            for (let i = 1; i < (D.DUNGEONS || []).length; i++) {
                const dng = D.DUNGEONS[i];
                addCluster(dng.x, dng.z + 30, 95, (g) => {
                    const pInt = (path, dx, dz, rot, scale) => {
                        BO.Assets.placeGLB(g, path, { pos: [dng.x + dx, 0, dng.z + dz], rot, scale, castShadow: false, guardScene: scene });
                    };
                    pInt('pixel_fantasy/pixel-fantasy-iron-brazier.glb', -6, 6, 0, 2.2);
                    pInt('pixel_fantasy/pixel-fantasy-iron-brazier.glb', 6, 6, 0, 2.2);
                    pInt('pixel_fantasy/pixel-fantasy-iron-brazier.glb', -6, 52, 0, 2.4);
                    pInt('pixel_fantasy/pixel-fantasy-iron-brazier.glb', 6, 52, 0, 2.4);
                    pInt('mini_dungeon_kit/banner.glb', -14.5, 22, Math.PI / 2, 2.8);
                    pInt('mini_dungeon_kit/banner.glb', 14.5, 22, -Math.PI / 2, 2.8);
                    pInt('mini_dungeon_kit/barrel.glb', 12, 18, 0.3, 2.2);
                    pInt('graveyard_kit/altar-stone.glb', 0, 60, 0, 2.4);
                });
                const dLight = new THREE.PointLight(i === 11 ? 0xf97316 : (i >= 9 ? 0x38bdf8 : 0xfbbf24), 1.6, 55, 1.5);
                dLight.position.set(dng.x, 4.2, dng.z + 34);
                scene.add(dLight);
            }
        },

        _townWarmth(scene, D, t, out) {
            const T = D.TOWN;
            const dummy = new THREE.Object3D();
            const fx = T.x - 4, fz = T.z + 5, fy = t.height(fx, fz);
            const logIm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 6), std(0x4a3525, { roughness: 0.9 }), 3);
            for (let i = 0; i < 3; i++) {
                dummy.position.set(fx, fy + 0.1, fz);
                dummy.rotation.set(0, (i / 3) * Math.PI, Math.PI / 2);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                logIm.setMatrixAt(i, dummy.matrix);
            }
            logIm.instanceMatrix.needsUpdate = true;
            scene.add(logIm);

            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.65, 6), glow(0xf97316, 0.9));
            flame.position.set(fx, fy + 0.42, fz);
            scene.add(flame);
            const fireLight = new THREE.PointLight(0xff9233, 1.8, 26, 1.6);
            fireLight.position.set(fx, fy + 1.2, fz);
            scene.add(fireLight);
            out.flames.push({ mesh: flame, light: fireLight, baseY: fy + 0.42 });

            const lanterns = [[4, -24], [4, 24], [29, 3], [-12, -8]];
            const postIm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.09, 2.8, 6), std(0x27272a, { metalness: 0.6 }), lanterns.length);
            const bulbIm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), glow(0xfbbf24, 0.95), lanterns.length);
            lanterns.forEach(([dx, dz], i) => {
                const lx = T.x + dx, lz = T.z + dz, ly = t.height(lx, lz);
                dummy.rotation.set(0, 0, 0);
                dummy.position.set(lx, ly + 1.4, lz);
                dummy.updateMatrix();
                postIm.setMatrixAt(i, dummy.matrix);
                dummy.position.set(lx, ly + 2.85, lz);
                dummy.updateMatrix();
                bulbIm.setMatrixAt(i, dummy.matrix);
            });
            postIm.instanceMatrix.needsUpdate = true;
            bulbIm.instanceMatrix.needsUpdate = true;
            scene.add(postIm, bulbIm);
        },

        _weatherMotes(scene, out) {
            const COUNT = 160;
            const pos = new Float32Array(COUNT * 3);
            for (let i = 0; i < COUNT; i++) {
                pos[i * 3] = (Math.random() - 0.5) * 48;
                pos[i * 3 + 1] = Math.random() * 14;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 48;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color: WEATHER_COLORS.haven_basin, size: 0.16, transparent: true, opacity: 0.6, depthWrite: false });
            const pts = new THREE.Points(geo, mat);
            pts.frustumCulled = false;
            scene.add(pts);
            out.weather = { points: pts, geo, mat, count: COUNT };
        },

        setRegionWeather(world, regId) {
            const w = world.owrpg && world.owrpg.weather;
            if (!w || world.owrpg.weatherRegion === regId) return;
            world.owrpg.weatherRegion = regId;
            w.mat.color.setHex(WEATHER_COLORS[regId] || 0xfde68a);
        },

        _beacon(scene, out, x, y, z, color, size = 0.7) {
            const m = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), glow(color));
            m.position.set(x, y, z);
            scene.add(m);
            out.beacons.push(m);
            return m;
        },

        _lm_spire(world, scene, L, y, out) {
            const ob = mesh(scene, world, new THREE.CylinderGeometry(1.4, 3.6, L.h, 7), std(0x3f3f46, { metalness: 0.45, roughness: 0.65 }), L.x, y + L.h / 2, L.z);
            void ob;
            addCol(world, L.x, L.z, 3.2, 3.2, y, y + L.h);
            this._beacon(scene, out, L.x, y + L.h + 1.4, L.z, L.color, 1.1);
        },

        _lm_mast_alpha(world, scene, L, y, out) {
            const mat = std(0x7c6a58, { metalness: 0.6, roughness: 0.6 });
            const s = 2.2, H = L.h;
            const legs = [[-s, -s], [s, -s], [s, s], [-s, s]];
            for (const [lx, lz] of legs) strut(scene, world, mat, L.x + lx, y, L.z + lz, L.x + lx * 0.35, y + H, L.z + lz * 0.35, 0.22);
            for (let h = 6; h < H; h += 6) {
                const k = 1 - (h / H) * 0.65;
                for (let i = 0; i < 4; i++) {
                    const [ax, az] = legs[i], [bx, bz] = legs[(i + 1) % 4];
                    strut(scene, world, mat, L.x + ax * k, y + h, L.z + az * k, L.x + bx * k, y + h, L.z + bz * k, 0.1);
                }
            }
            mesh(scene, world, new THREE.BoxGeometry(3, 0.3, 3), mat, L.x, y + H, L.z);
            const beacon = this._beacon(scene, out, L.x, y + H + 1.2, L.z, L.color, 0.9);
            const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 26, 12, 1, true), new THREE.MeshBasicMaterial({ color: L.color, transparent: true, opacity: 0.12, fog: false, depthWrite: false, side: THREE.DoubleSide }));
            beam.rotation.z = Math.PI / 2;
            beam.position.set(13, 0, 0);
            const pivot = new THREE.Group();
            pivot.position.copy(beacon.position);
            pivot.add(beam);
            scene.add(pivot);
            out.spinners.push({ obj: pivot, speed: 0.9 });
            addCol(world, L.x, L.z, s, s, y, y + 1.2);
        },

        _lm_goliath(world, scene, L, y, out) {
            const mat = std(0xd4a017, { metalness: 0.5, roughness: 0.5 });
            const H = L.h, span = 26;
            for (const dx of [-span / 2, span / 2]) for (const dz of [-3, 3]) {
                mesh(scene, world, new THREE.BoxGeometry(1.4, H, 1.4), mat, L.x + dx, y + H / 2, L.z + dz);
                addCol(world, L.x + dx, L.z + dz, 0.7, 0.7, y, y + H);
            }
            mesh(scene, world, new THREE.BoxGeometry(span + 6, 2.4, 8), mat, L.x, y + H, L.z);
            mesh(scene, world, new THREE.BoxGeometry(4, 3, 4), std(0x3f3f46), L.x + 4, y + H - 2.4, L.z);
            strut(scene, world, std(0x27272a), L.x + 4, y + H - 4, L.z, L.x + 4, y + 10, L.z, 0.06);
            this._beacon(scene, out, L.x - span / 2, y + H + 1.6, L.z, 0xff3b30, 0.5);
            this._beacon(scene, out, L.x + span / 2, y + H + 1.6, L.z, 0xff3b30, 0.5);
        },

        _lm_cooling_stack(world, scene, L, y, out) {
            const pts = [];
            for (let i = 0; i <= 12; i++) {
                const k = i / 12;
                pts.push(new THREE.Vector2(9 + 6 * Math.pow(Math.abs(k - 0.62) / 0.62, 1.6) * (k < 0.62 ? 1 : 0.55), k * L.h));
            }
            const geo = new THREE.LatheGeometry(pts, 24);
            const m = mesh(scene, world, geo, std(0x8a8f86, { side: THREE.DoubleSide, roughness: 0.95 }), L.x, y - 3, L.z);
            m.rotation.z = 0.06;
            for (let i = 0; i < 6; i++) {
                const p = new THREE.Mesh(new THREE.SphereGeometry(4 + i * 0.8, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.16, fog: false, depthWrite: false }));
                p.position.set(L.x, y + L.h + i * 5, L.z);
                scene.add(p);
                out.plumes.push({ m: p, base: y + L.h, phase: i / 6 });
            }
            for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; addCol(world, L.x + Math.cos(a) * 14, L.z + Math.sin(a) * 14, 2.4, 2.4, y - 3, y + 12); }
        },

        _lm_excavator(world, scene, L, y, out) {
            const mat = std(0xb45309, { metalness: 0.5, roughness: 0.7 });
            mesh(scene, world, new THREE.BoxGeometry(14, 8, 9), mat, L.x, y + 4, L.z);
            addCol(world, L.x, L.z, 7, 4.5, y, y + 8);
            mesh(scene, world, new THREE.BoxGeometry(8, 7, 7), mat, L.x - 2, y + 11.5, L.z);
            const boom = mesh(scene, world, new THREE.BoxGeometry(30, 2.2, 2.2), mat, L.x + 14, y + 20, L.z, false);
            boom.rotation.z = 0.45;
            const wheel = new THREE.Mesh(new THREE.TorusGeometry(7, 0.9, 8, 24), mat);
            wheel.position.set(L.x + 27, y + 27, L.z);
            scene.add(wheel);
            out.spinners.push({ obj: wheel, speed: 0.15, axis: 'z' });
            this._beacon(scene, out, L.x - 2, y + L.h, L.z, L.color, 0.6);
        },

        _lm_dishes(world, scene, L, y, out) {
            const mat = std(0xe5e7eb, { metalness: 0.3, roughness: 0.4, side: THREE.DoubleSide });
            for (let i = 0; i < 3; i++) {
                const x = L.x + (i - 1) * 26, z = L.z + (i === 1 ? -6 : 4);
                const gy = world.terrain.height(x, z);
                mesh(scene, world, new THREE.CylinderGeometry(1.2, 2, 16, 10), mat, x, gy + 8, z);
                addCol(world, x, z, 1.6, 1.6, gy, gy + 16);
                const dish = new THREE.Mesh(new THREE.SphereGeometry(11, 20, 10, 0, Math.PI * 2, 0, 0.9), mat);
                dish.position.set(x, gy + 21, z);
                dish.rotation.x = -0.9 - i * 0.12;
                dish.rotation.y = i * 0.5;
                scene.add(dish);
                this._beacon(scene, out, x, gy + L.h, z, 0xff3b30, 0.45);
            }
        },

        _lm_obelisk(world, scene, L, y, out) {
            const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(24, 1), new THREE.MeshStandardMaterial({ color: 0x6d28d9, emissive: 0x3b0764, emissiveIntensity: 0.6, wireframe: true }));
            dome.position.set(L.x, y + 10, L.z);
            scene.add(dome);
            out.spinners.push({ obj: dome, speed: 0.03 });
            const ob = mesh(scene, world, new THREE.OctahedronGeometry(4, 0), new THREE.MeshStandardMaterial({ color: 0x1e1030, emissive: 0x9333ea, emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.3 }), L.x, y + 26, L.z);
            ob.scale.set(1, 7.5, 1);
            addCol(world, L.x, L.z, 3.4, 3.4, y, y + 50);
            out.obelisk = ob;
            const arcMat = new THREE.LineBasicMaterial({ color: 0xd8b4fe, transparent: true, opacity: 0.9, fog: false });
            for (let i = 0; i < 4; i++) {
                const g = new THREE.BufferGeometry().setFromPoints(new Array(9).fill(0).map(() => new THREE.Vector3()));
                const line = new THREE.Line(g, arcMat);
                scene.add(line);
                out.arcs.push({ line, cx: L.x, cy: y + 26, cz: L.z, t: Math.random() });
            }
            this._beacon(scene, out, L.x, y + L.h, L.z, L.color, 1.2);
        },

        _pylon(world, scene, p, y) {
            const g = new THREE.Group();
            const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 0.6, 12), std(0x334155, { metalness: 0.7 }));
            base.position.y = 0.3;
            const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 5, 8), std(0x64748b, { metalness: 0.8, roughness: 0.3 }));
            coil.position.y = 3;
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x475569, fog: false });
            const rings = [];
            for (let i = 0; i < 3; i++) {
                const r = new THREE.Mesh(new THREE.TorusGeometry(0.9 - i * 0.15, 0.08, 6, 20), ringMat);
                r.rotation.x = Math.PI / 2;
                r.position.y = 2 + i * 1.4;
                g.add(r);
                rings.push(r);
            }
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), ringMat);
            tip.position.y = 5.8;
            g.add(base, coil, tip);
            g.position.set(p.x, y, p.z);
            scene.add(g);
            addCol(world, p.x, p.z, 0.6, 0.6, y, y + 5.5);
            return { group: g, rings, ringMat, active: false };
        },

        setPylonActive(world, id, on) {
            const p = world.owrpg && world.owrpg.pylons[id];
            if (!p) return;
            p.active = on;
            p.ringMat.color.setHex(on ? 0x22d3ee : 0x475569);
        },

        _vegetation(world, scene, D) {
            const r = rng(884120);
            const lists = { pine: [], broad: [], dead: [] };
            const t = world.terrain;
            const nearAnchor = (x, z) => D.POIS.some((p) => !p.interior && Math.hypot(x - p.x, z - p.z) < p.r + 7) ||
                D.PYLONS.some((p) => Math.hypot(x - p.x, z - p.z) < 7) ||
                D.LANDMARKS.some((l) => Math.hypot(x - l.x, z - l.z) < 16) ||
                D.INTERACTS.some((it) => !it.int && Math.hypot(x - it.x, z - it.z) < 6);
            const span = D.BOUNDS.maxX - D.BOUNDS.minX - 32;
            const densMap = {
                haven_basin: 0.55, whispering_woods: 0.85, alpine_array: 0.68, frostfang_peaks: 0.55,
                rust_sprawl: 0.14, barrow_moor: 0.42, mire_delta: 0.38, ash_quarry: 0.15,
                sunscorched_badlands: 0.08, sunken_coast: 0.22, meridian_core: 0.12, obsidian_dragonwilds: 0.20
            };
            for (let i = 0; i < 6500 && lists.pine.length + lists.broad.length + lists.dead.length < 2800; i++) {
                const x = D.BOUNDS.minX + 16 + r() * span;
                const z = D.BOUNDS.minZ + 16 + r() * span;
                const h = t.height(x, z);
                if (h < D.WATER + 0.4 || t.slope(x, z) > 0.9 || nearAnchor(x, z)) continue;
                if (D.roadInfo(x, z) || D.railDist(x, z) < 4.5) continue;
                const reg = D.regionAt(x, z).id;
                if (r() > (densMap[reg] || 0.2)) continue;
                let kind = 'dead';
                if (reg === 'alpine_array' || reg === 'frostfang_peaks') kind = 'pine';
                else if (reg === 'whispering_woods' || reg === 'haven_basin') kind = r() < 0.5 ? 'broad' : 'pine';
                else if (reg === 'sunken_coast') kind = r() < 0.4 ? 'broad' : 'dead';
                lists[kind].push({ x, z, y: h, s: 0.85 + r() * 0.8 });
            }
            const defs = {
                pine: { trunk: new THREE.CylinderGeometry(0.16, 0.3, 4.2, 6), crown: new THREE.ConeGeometry(1.8, 5.4, 7), crownY: 4.7, tc: 0x5a4332, cc: 0x2f4a33 },
                broad: { trunk: new THREE.CylinderGeometry(0.2, 0.32, 3.4, 6), crown: new THREE.IcosahedronGeometry(2.2, 0), crownY: 4.3, tc: 0x5e4a38, cc: 0x56713c },
                dead: { trunk: new THREE.CylinderGeometry(0.12, 0.26, 4.6, 5), crown: new THREE.BoxGeometry(2.2, 0.12, 0.12), crownY: 3.6, tc: 0x3a332e, cc: 0x3a332e }
            };
            const dummy = new THREE.Object3D();
            for (const [kind, list] of Object.entries(lists)) {
                if (!list.length) continue;
                const d = defs[kind];
                const trunk = new THREE.InstancedMesh(d.trunk, std(d.tc, { roughness: 0.95, metalness: 0 }), list.length);
                const crown = new THREE.InstancedMesh(d.crown, new THREE.MeshStandardMaterial({ color: d.cc, roughness: 0.85, flatShading: true }), list.length);
                list.forEach((tr, i) => {
                    dummy.position.set(tr.x, tr.y + d.trunk.parameters.height * tr.s / 2, tr.z);
                    dummy.rotation.set(0, (tr.x * 13.1 + tr.z) % 6.28, 0);
                    dummy.scale.setScalar(tr.s);
                    dummy.updateMatrix();
                    trunk.setMatrixAt(i, dummy.matrix);
                    dummy.position.set(tr.x, tr.y + d.crownY * tr.s, tr.z);
                    dummy.updateMatrix();
                    crown.setMatrixAt(i, dummy.matrix);
                    world.colliders.push({ minX: tr.x - 0.3 * tr.s, maxX: tr.x + 0.3 * tr.s, minY: tr.y, maxY: tr.y + 5 * tr.s, minZ: tr.z - 0.3 * tr.s, maxZ: tr.z + 0.3 * tr.s, active: true, tree: true, navIgnore: true });
                });
                trunk.castShadow = crown.castShadow = false;
                trunk.frustumCulled = crown.frustumCulled = false;
                scene.add(trunk, crown);
                if (BO.Assets && BO.Assets.placeGLBInstanced) {
                    const modelPath = kind === 'dead' ? 'graveyard_kit/trunk.glb' : (kind === 'pine' ? 'mini_forest_kit/tree-high.glb' : 'mini_forest_kit/tree.glb');
                    const hScale = kind === 'pine' ? 8.2 : (kind === 'broad' ? 6.8 : 5.2);
                    const trs = list.map((tr) => ({ pos: [tr.x, tr.y, tr.z], rot: (tr.x * 13.1 + tr.z) % 6.28, scale: tr.s * hScale }));
                    BO.Assets.placeGLBInstanced(scene, modelPath, trs, {
                        fitSize: [1, 1, 1], uniform: true, hideFallback: [trunk, crown],
                        castShadow: false, frustumCulled: false, guardScene: scene
                    });
                }
            }
            const rocks = [];
            for (let i = 0; i < 620; i++) {
                const x = D.BOUNDS.minX + 16 + r() * span, z = D.BOUNDS.minZ + 16 + r() * span;
                if (nearAnchor(x, z) || D.roadInfo(x, z)) continue;
                rocks.push({ x, z, s: 0.6 + r() * 1.9 });
            }
            const rm = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x7b7d76, roughness: 0.95, flatShading: true }), rocks.length);
            const rockTrs = [];
            rocks.forEach((rk, i) => {
                const y = t.height(rk.x, rk.z);
                dummy.position.set(rk.x, y + rk.s * 0.3, rk.z);
                dummy.rotation.set(rk.x % 3, rk.z % 3, 0);
                dummy.scale.set(rk.s * 1.3, rk.s * 0.7, rk.s);
                dummy.updateMatrix();
                rm.setMatrixAt(i, dummy.matrix);
                rockTrs.push({ pos: [rk.x, y, rk.z], rot: rk.z % 3, scale: [rk.s * 2.1, rk.s * 1.2, rk.s * 1.8] });
                if (rk.s > 1.2) world.colliders.push({ minX: rk.x - rk.s, maxX: rk.x + rk.s, minY: y, maxY: y + rk.s * 0.8, minZ: rk.z - rk.s * 0.8, maxZ: rk.z + rk.s * 0.8, active: true, navIgnore: true });
            });
            rm.castShadow = false;
            rm.frustumCulled = false;
            scene.add(rm);
            if (BO.Assets && BO.Assets.placeGLBInstanced && rockTrs.length) {
                BO.Assets.placeGLBInstanced(scene, 'mini_forest_kit/rocks-low.glb', rockTrs, {
                    fitSize: [1, 1, 1], hideFallback: rm, castShadow: false, frustumCulled: false, guardScene: scene
                });
            }
        },

        _water(scene, D, out) {
            const sheet = (w, d, x, y, z, color, opacity) => {
                const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.12, metalness: 0.3, depthWrite: false }));
                m.rotation.x = -Math.PI / 2;
                m.position.set(x, y, z);
                scene.add(m);
                out.waters.push(m);
            };
            sheet(280, 280, 215, D.WATER, 25, 0x2c4a3a, 0.82);
            sheet(240, 240, 510, D.WATER, -55, 0x1e4e5f, 0.80);
            sheet(40, 40, -180, -11.6, -60, 0x3d4a52, 0.8);
            sheet(36, 36, 180, -6.4, -190, 0x4c1d95, 0.7);
        },

        animate(world, clock, dt = 0.016) {
            const o = world.owrpg;
            if (!o) return;
            const step = Math.min(0.1, dt || 0.016);
            const blink = Math.sin(clock * 3) > 0.1;
            for (const b of o.beacons) b.visible = blink;
            for (const s of o.spinners) { if (s.axis === 'z') s.obj.rotation.z += s.speed * step; else s.obj.rotation.y += s.speed * step; }
            for (const p of o.plumes) {
                const k = (clock * 0.05 + p.phase) % 1;
                p.m.position.y = p.base + k * 40;
                p.m.scale.setScalar(0.6 + k * 1.6);
                p.m.material.opacity = 0.2 * (1 - k);
            }
            for (const a of o.arcs) {
                a.t -= step;
                if (a.t > 0) continue;
                a.t = 0.08 + Math.random() * 0.25;
                const pos = a.line.geometry.attributes.position;
                const ang = Math.random() * Math.PI * 2, R = 18 + Math.random() * 8;
                const ex = a.cx + Math.cos(ang) * R, ey = a.cy - 10 + Math.random() * 20, ez = a.cz + Math.sin(ang) * R;
                for (let i = 0; i < pos.count; i++) {
                    const k = i / (pos.count - 1), j = i === 0 || i === pos.count - 1 ? 0 : 2.2;
                    pos.setXYZ(i, a.cx + (ex - a.cx) * k + (Math.random() - 0.5) * j, a.cy + (ey - a.cy) * k + (Math.random() - 0.5) * j, a.cz + (ez - a.cz) * k + (Math.random() - 0.5) * j);
                }
                pos.needsUpdate = true;
            }
            for (const f of o.flames) {
                f.mesh.scale.set(0.9 + Math.sin(clock * 11) * 0.15, 0.9 + Math.cos(clock * 15) * 0.2, 0.9 + Math.sin(clock * 9) * 0.15);
                f.light.intensity = 1.6 + Math.sin(clock * 13) * 0.35;
            }
            if (BO.Player && o.culledGroups) {
                const px = BO.Player.pos.x, pz = BO.Player.pos.z;
                for (const cg of o.culledGroups) {
                    const vis = BO.Math.dist2D(px, pz, cg.x, cg.z) < cg.r;
                    if (cg.group.visible !== vis) cg.group.visible = vis;
                }
            }
            if (o.weather && BO.Player) {
                const P = BO.Player;
                o.weather.points.visible = !BO.OWRPGWorldData.isInterior(P.pos.x, P.pos.z);
                if (o.weather.points.visible) {
                    o.weather.points.position.set(P.pos.x, P.pos.y, P.pos.z);
                    const arr = o.weather.geo.attributes.position.array;
                    const fall = (o.weatherRegion === 'alpine_array' || o.weatherRegion === 'frostfang_peaks') ? -1.6 : ((o.weatherRegion === 'ash_quarry' || o.weatherRegion === 'obsidian_dragonwilds') ? 1.1 : 0.25);
                    for (let i = 0; i < o.weather.count; i++) {
                        arr[i * 3 + 1] += fall * step;
                        arr[i * 3] += Math.sin(clock + i) * 0.35 * step;
                        if (arr[i * 3 + 1] > 14) arr[i * 3 + 1] = 0.5;
                        else if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 13.5;
                    }
                    o.weather.geo.attributes.position.needsUpdate = true;
                }
            }
            for (const p of Object.values(o.pylons)) if (p.active) p.rings.forEach((r, i) => { r.rotation.z = clock * (1 + i * 0.6); });
            if (o.obelisk) o.obelisk.material.emissiveIntensity = 0.7 + Math.sin(clock * 1.3) * 0.3;
        }
    };

    BO.OWRPGWorldArt = Art;
})(window.BO);
;

/* --- src/owrpg/OWRPGWorldSim.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · World Simulation
   Preserves the panoramic skybox texture on scene.background (tinting fog
   and lights cleanly across day/night/interiors). Drives POI streaming,
   expanded regional encounters, dynamic World Events, and weather motes.
============================================================================ */
(function (BO) {
    'use strict';

    const DAY = 2400;
    const ACTIVE_MAX = 24;
    const RESPAWN_SEC = 600;
    const ENCOUNTERS = {
        haven_basin: [['raider', 'raider'], ['crawler', 'brood_venom_mite', 'crawler'], ['raider', 'raider_marksman'], ['raider_pyro', 'raider']],
        rust_sprawl: [['raider', 'raider_bruiser'], ['enforcer', 'syn_arc_tech'], ['stalker', 'brood_venom_mite'], ['syn_sniper', 'enforcer']],
        mire_delta: [['stalker', 'spitter'], ['brood_blight_hound', 'brood_venom_mite'], ['brood_frost_wraith', 'spitter'], ['brute']],
        ash_quarry: [['brood_pyro_fiend', 'stalker'], ['militia', 'militia_scout'], ['enforcer', 'syn_gunner'], ['brood_iron_goliath']],
        alpine_array: [['aegis', 'aegis_cryo'], ['aegis_heavy', 'aegis'], ['brood_frost_wraith', 'stalker']],
        whispering_woods: [['timber_wolf', 'timber_wolf'], ['forest_poacher', 'orc_reaver'], ['puglin_scamp', 'treasure_puglin']],
        barrow_moor: [['skeleton_warrior', 'grave_zombie'], ['barrow_ghost', 'crypt_keeper'], ['blood_vampire', 'grave_zombie']],
        sunscorched_badlands: [['dune_scorpion', 'sunfang_guardian'], ['sunfang_guardian', 'imp_firestarter']],
        sunken_coast: [['drowned_corsair', 'abyssal_siren'], ['drowned_corsair', 'brood_frost_wraith']],
        frostfang_peaks: [['frost_knight', 'glacier_troll'], ['frost_wyrmling', 'frost_knight']],
        obsidian_dragonwilds: [['obsidian_cultist', 'ashen_drake'], ['dragonwild_juggernaut', 'ashen_drake']],
        meridian_core: [['helix', 'helix_voidweaver'], ['helix_zealot', 'brood_void_stalker'], ['brood_iron_goliath', 'helix']]
    };
    const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const _c1 = new THREE.Color(), _c2 = new THREE.Color();

    const Sim = {
        light: 1,
        poiAgents: {},
        region: null,
        encT: 30,
        encN: 0,
        hasSkybox: false,

        get s() { return BO.OWRPGMode.state; },
        get D() { return BO.OWRPGWorldData; },

        init(scene) {
            this.poiAgents = {};
            this._cullAt = null;
            this._collectCullables();
            this.region = null;
            this.encT = 30;
            this.scene = scene;
            this.hemi = scene.children.find((o) => o.isHemisphereLight);
            this.sun = scene.children.find((o) => o.isDirectionalLight);
            const atm = BO.World.mapData.atmosphere;
            this.base = { hemi: atm.hemiIntensity, sun: atm.sunIntensity, fog: new THREE.Color(atm.fogColor), sky: new THREE.Color(atm.skyBottom), fogD: atm.fogDensity };
            // Preserve panoramic skybox texture if applied; only set flat color as fallback!
            this.hasSkybox = !!(scene.background && scene.background.isTexture);
            if (!this.hasSkybox) scene.background = new THREE.Color(atm.skyBottom);
            if (this.sun) {
                scene.add(this.sun.target);
                const cam = this.sun.shadow.camera;
                cam.left = -60; cam.right = 60; cam.top = 60; cam.bottom = -60; cam.far = 260;
                cam.updateProjectionMatrix();
            }
        },

        timeLabel() {
            const h = (this.s.worldClock / DAY) * 24;
            const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
            return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
        },

        isNight() { return this.light < 0.35; },

        update(dt) {
            const s = this.s;
            s.worldClock = (s.worldClock + dt) % DAY;
            const P = BO.Player;
            const inside = this.D.isInterior(P.pos.x, P.pos.z);
            const t = s.worldClock / DAY;
            const sunH = Math.sin((t - 0.25) * Math.PI * 2);
            this.light = inside ? 0.3 : 0.12 + 0.88 * smooth(-0.18, 0.3, sunH);
            const k = this.light;
            if (this.hemi) this.hemi.intensity = this.base.hemi * (inside ? 0.45 : 0.22 + 0.78 * k);
            if (this.sun) {
                this.sun.intensity = inside ? 0 : this.base.sun * Math.max(0, smooth(-0.05, 0.3, sunH));
                const ang = t * Math.PI * 2;
                this.sun.position.set(P.pos.x - Math.cos(ang) * 80, P.pos.y + 40 + Math.max(10, sunH * 90), P.pos.z + 50);
                this.sun.target.position.set(P.pos.x, P.pos.y, P.pos.z);
            }
            const sc = BO.World.scene;
            if (sc && sc.fog) {
                const night = _c2.setHex(inside ? 0x0b0d10 : 0x141b26);
                sc.fog.color.copy(_c1.copy(this.base.fog).lerp(night, 1 - k));
                sc.fog.density = inside ? 0.06 : this.base.fogD * (1 + (1 - k) * 0.6);
                if (sc.background && sc.background.isColor) sc.background.copy(_c1.copy(this.base.sky).lerp(night, 1 - k));
            }
            if (BO.World.terrain && !inside) BO.World.terrain.updateLOD(P.pos.x, P.pos.z, 135, this.fogCullDist() + 115);
            // Re-cull static batches once a second, or immediately after a teleport / long move.
            this._cullT = (this._cullT || 0) - dt;
            const lc = this._cullAt;
            if (this._cullT <= 0 || !lc || Math.abs(P.pos.x - lc.x) + Math.abs(P.pos.z - lc.z) > 24) {
                this._cullT = 1;
                this._cullAt = { x: P.pos.x, z: P.pos.z };
                this._cullBatches(inside);
            }
        },

        /** Random-encounter squads for a region (used by Altars of Trials). */
        encounterPool(regionId) { return ENCOUNTERS[regionId] || ENCOUNTERS.haven_basin; },

        /** Distance where exp² fog leaves < 1% of a surface visible — anything beyond is pure fog colour. */
        fogCullDist() {
            const fog = BO.World.scene && BO.World.scene.fog;
            return fog && fog.density > 0 ? 2.15 / fog.density : Infinity;
        },

        /** Hide merged static-box chunks and loose static meshes that sit entirely inside the fog wall. */
        _cullBatches(inside) {
            const P = BO.Player;
            if (!this._batches) this._collectCullables();
            const cull = Math.max(inside ? 260 : 0, this.fogCullDist());
            for (const b of this._batches) {
                const vis = BO.Math.dist2D(P.pos.x, P.pos.z, b.x, b.z) < cull + b.r;
                if (b.m.visible !== vis) b.m.visible = vis;
            }
        },

        /** Snapshot the static world right after it is built: merged box chunks plus loose top-level
         *  meshes (landmark parts). Groups are skipped on purpose — props, NPCs and GLB holders run
         *  their own visibility logic — and so are transient FX meshes (particles, decals, shells). */
        _collectCullables() {
            this._batches = [];
            {
                const fxGeo = BO.FX ? new Set([BO.FX.particleGeo, BO.FX.decalGeo, BO.FX.shellGeo]) : new Set();
                const terrain = new Set();
                for (const c of (BO.World.terrain && BO.World.terrain.chunks) || []) { terrain.add(c.near); terrain.add(c.far); }
                const fogged = (mat) => !Array.isArray(mat) && mat && mat.fog !== false;
                const consider = (m) => {
                    if (!m.isMesh || m.isInstancedMesh || terrain.has(m) || !m.geometry || fxGeo.has(m.geometry) || !fogged(m.material)) return;
                    m.updateMatrixWorld(true);
                    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
                    const c = m.geometry.boundingSphere.center.clone().applyMatrix4(m.matrixWorld);
                    const sc = Math.max(m.scale.x, m.scale.y, m.scale.z);
                    this._batches.push({ m, x: c.x, z: c.z, r: m.geometry.boundingSphere.radius * sc });
                };
                for (const m of BO.World.worldMeshes || []) if (m.userData && m.userData.batch) consider(m);
                for (const m of BO.World.scene.children) if (!(m.userData && m.userData.batch)) consider(m);
            }
        },

        tick1(dt) {
            const s = this.s;
            const P = BO.Player;
            const D = this.D;
            const inside = D.isInterior(P.pos.x, P.pos.z);
            if (!inside) {
                const reg = D.regionAt(P.pos.x, P.pos.z);
                if (reg !== this.region) {
                    if (this.region) BO.Events.emit('hud:banner', { title: reg.name.toUpperCase(), sub: `Threat level ${reg.lvl}`, color: '#f5a623' });
                    this.region = reg;
                    BO.OWRPGWorldArt.setRegionWeather?.(BO.World, reg.id);
                }
            }
            // Unload distant areas before filling nearby areas, including teleport destinations.
            for (const poi of D.POIS) if (this.poiAgents[poi.id] && BO.Math.dist2D(P.pos.x, P.pos.z, poi.x, poi.z) > poi.r + 150) this.despawnPoi(poi);
            for (const poi of D.POIS.slice().sort((a, b) => Math.hypot(P.pos.x-a.x, P.pos.z-a.z) - Math.hypot(P.pos.x-b.x, P.pos.z-b.z))) {
                const d = BO.Math.dist2D(P.pos.x, P.pos.z, poi.x, poi.z);
                const st = s.poiStates[poi.id] || (s.poiStates[poi.id] = {});
                if (!st.discovered && d < poi.r) this.discover(poi);
                if (d < poi.r + 85 && poi.spawns) this.spawnPoi(poi);
            }
            this._encounters(dt, inside);
            if (BO.OWRPGEvents) BO.OWRPGEvents.tick(dt);
            for (const a of BO.OWRPGAI.agents.slice()) {
                if (a.poiId && a.poiId.startsWith('enc_') && a.alive && BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, P.pos.x, P.pos.z) > 170) BO.OWRPGAI.despawn(a);
            }
        },

        discover(poi) {
            const s = this.s;
            const st = s.poiStates[poi.id];
            st.discovered = true;
            s.stats.discovered++;
            BO.Events.emit('hud:banner', { title: 'DISCOVERED', sub: poi.name, color: '#a3e635' });
            BO.OWRPGMode.giveXp(poi.kind === 'endgame' ? 150 : 40, null, true);
            BO.OWRPGQuests.onEvent(s, 'discover', poi.id);
            BO.OWRPGMode.checkpoint('Discovered ' + poi.name);
        },

        spawnPoi(poi) {
            const s = this.s;
            const st = s.poiStates[poi.id];
            const list = this.poiAgents[poi.id] || (this.poiAgents[poi.id] = []);
            const owner = BO.OWRPGFactions.poiOwner(s, poi);
            for (let index = 0; index < poi.spawns.length; index++) {
                const sp = poi.spawns[index];
                const previous = list.find(a => a.spawnIndex === index);
                if (previous && (previous.alive || s.playtimeSec < previous.respawnAt)) continue;
                if (BO.OWRPGAI.agents.filter(a => a.alive).length >= ACTIVE_MAX) break;
                const def = BO.OWRPGStatsData.ENEMIES[sp[0]];
                if (!def) continue;
                if (poi.kind === 'contested' && owner && BO.OWRPGFactionsData.FACTIONS[def.faction] && def.faction !== owner) continue;
                if (previous) {
                    if (BO.OWRPGAI.agents.includes(previous)) BO.OWRPGAI.despawn(previous);
                    list.splice(list.indexOf(previous), 1);
                }
                const x = poi.x + sp[1], z = poi.z + sp[2];
                const y = sp[3] != null ? (poi.interior ? 0 : BO.World.terrainHeight(poi.x, poi.z)) + sp[3] : (poi.interior ? 0 : null);
                const a = BO.OWRPGAI.spawn(sp[0], x, z, { poiId: poi.id, y, leash: poi.interior ? 80 : poi.r + 40, postR: def.boss ? 2 : (sp[3] != null ? 1.2 : 5) });
                if (a) { a.spawnIndex = index; list.push(a); }
            }
            st.spawned = list.length;
        },

        despawnPoi(poi) {
            const list = this.poiAgents[poi.id] || [];
            for (const a of list) if (BO.OWRPGAI.agents.includes(a)) BO.OWRPGAI.despawn(a);
            delete this.poiAgents[poi.id];
        },

        onAgentKilled(a) {
            const s = this.s;
            const poi = this.D.POIS.find((p) => p.id === a.poiId);
            if (!poi) return;
            a.respawnAt = s.playtimeSec + RESPAWN_SEC;
            const list = this.poiAgents[poi.id] || [];
            const st = s.poiStates[poi.id] || (s.poiStates[poi.id] = {});
            if (a.boss) st.deadUnique = [...new Set([...(st.deadUnique || []), a.defId])];
            const hostileLeft = list.filter((o) => o.alive && o.hostile).length;
            if (poi.kind === 'contested') {
                const sides = new Set(list.filter((o) => o.alive).map((o) => o.faction));
                if (sides.size === 1) { const f = [...sides][0]; if (BO.OWRPGFactions.poiOwner(s, poi) !== f) { BO.OWRPGFactions.setPoiOwner(s, poi.id, f); BO.Events.emit('hud:banner', { title: 'TERRITORY SHIFT', sub: `${BO.OWRPGFactionsData.FACTIONS[f].name} hold ${poi.name}`, color: BO.OWRPGFactionsData.FACTIONS[f].color }); } }
            }
            if (hostileLeft === 0 && a.hostile && (st.clearedAt == null || s.playtimeSec - st.clearedAt > 60)) {
                st.clearedAt = s.playtimeSec;
                BO.Events.emit('hud:toast', { text: `${poi.name.toUpperCase()} CLEARED`, color: '#a3e635' });
                BO.OWRPGMode.giveXp(60, 'Area cleared', true);
            }
        },

        _encounters(dt, inside) {
            const P = BO.Player;
            const D = this.D;
            if (inside) return;
            const nearPoi = D.POIS.some((p) => BO.Math.dist2D(P.pos.x, P.pos.z, p.x, p.z) < p.r + 25);
            const moving = Math.hypot(P.vel.x, P.vel.z) > 1.5;
            if (nearPoi || !moving) return;
            this.encT -= dt;
            if (this.encT > 0 || BO.OWRPGAI.agents.filter(a => a.alive).length > 14) return;
            this.encT = 25 + Math.random() * 15;
            const reg = D.regionAt(P.pos.x, P.pos.z);
            const group = BO.Math.pick(ENCOUNTERS[reg.id] || ENCOUNTERS.haven_basin);
            const heading = Math.atan2(P.vel.x, P.vel.z) + (Math.random() - 0.5) * 1.6;
            const dist = 60 + Math.random() * 20;
            const cx = BO.Math.clamp(P.pos.x + Math.sin(heading) * dist, D.BOUNDS.minX + 20, D.BOUNDS.maxX - 20);
            const cz = BO.Math.clamp(P.pos.z + Math.cos(heading) * dist, D.BOUNDS.minZ + 20, D.BOUNDS.maxZ - 20);
            if (BO.World.terrainHeight(cx, cz) < D.WATER + 0.2 || BO.Math.dist2D(cx, cz, D.TOWN.x, D.TOWN.z) < 60) return;
            const id = 'enc_' + (++this.encN);
            group.forEach((e, i) => BO.OWRPGAI.spawn(e, cx + (i % 2) * 3 - 1.5, cz + Math.floor(i / 2) * 3, { poiId: id, leash: 80, postR: 8 }));
            if (Math.random() < 0.5) BO.OWRPGMode.smokeHint(cx, cz);
        }
    };

    BO.OWRPGWorldSim = Sim;
})(window.BO);
;

/* --- src/owrpg/OWRPGInteriors.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Props, NPCs, Loot Bags & Sealed Interiors
   Supports Workbenches, Bounty Boards, auto-dismount indoors/dialogue, and
   new NPCs (Torin, Dr. Lyra Chen).
============================================================================ */
(function (BO) {
    'use strict';

    const NPC_DETAIL_DIST = 7;    // metres: full rig + idle animation inside, merged proxy outside
    const UP = new THREE.Vector3(0, 1.2, 0);
    const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, metalness: 0.3 }, o || {}));
    const glow = (c) => new THREE.MeshBasicMaterial({ color: c });

    function label(text, color = '#f8fafc') {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 48;
        const g = c.getContext('2d');
        g.font = 'bold 24px "Segoe UI", sans-serif';
        g.textAlign = 'center';
        g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,0.75)';
        g.strokeText(text, 128, 32);
        g.fillStyle = color; g.fillText(text, 128, 32);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true }));
        sp.scale.set(2.6, 0.5, 1);
        return sp;
    }

    const Props = {
        props: [],
        npcs: [],
        bags: [],

        get s() { return BO.OWRPGMode.state; },
        get D() { return BO.OWRPGWorldData; },

        clear() {
            for (const p of this.props) p.mesh.removeFromParent();
            for (const n of this.npcs) n.parts.root.removeFromParent();
            for (const b of this.bags) b.mesh.removeFromParent();
            this.props = []; this.npcs = []; this.bags = [];
        },

        yFor(def) {
            if (typeof def.y === 'number') return def.y;
            if (def.int) return 0;
            return BO.World.terrainHeight(def.x, def.z) + (def.indoor ? 0.2 : 0);
        },

        build(scene) {
            this.clear();
            const s = this.s;
            for (const def of this.D.INTERACTS) {
                if (def.kind === 'sac' && s.worldFlags['sac_' + def.id]) continue;
                const mesh = this._mesh(def);
                const y = this.yFor(def);
                mesh.position.set(def.x, y, def.z);
                scene.add(mesh);
                this.props.push({ def, mesh, pos: new THREE.Vector3(def.x, y, def.z), phase: Math.random() * 6 });
            }
            const FA = BO.OWRPGFactionsData.FACTIONS;
            for (const def of this.D.NPCS) {
                const parts = BO.CharacterMesh.buildSoldier(def.faction === 'militia' || def.faction === 'aegis' ? 0 : 1, {});
                parts.root.traverse((o) => { if (o.isMesh) o.userData = {}; });
                const y = this.yFor(def);
                parts.root.position.set(def.x, y, def.z);
                parts.root.rotation.y = def.yaw || 0;
                const tag = label(def.name, FA[def.faction].color);
                tag.position.set(0, 2.2, 0);
                parts.root.add(tag);
                scene.add(parts.root);
                // Far LOD: one merged mesh per material instead of ~135 rig parts.
                const lod = BO.MeshProxy ? BO.MeshProxy.attach(parts.root) : null;
                this.npcs.push({ def, parts, lod, pos: new THREE.Vector3(def.x, y, def.z), yaw: def.yaw || 0, phase: Math.random() * 6 });
            }
            for (const [id, on] of Object.entries(s.pylons)) if (on) BO.OWRPGWorldArt.setPylonActive(BO.World, id, true);
        },

        _mesh(def) {
            const g = new THREE.Group();
            const add = (geo, mat, x = 0, y = 0, z = 0, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; g.add(m); return m; };
            switch (def.kind) {
                case 'container':
                case 'stash': {
                    add(new THREE.BoxGeometry(1.0, 0.6, 0.6), std(def.kind === 'stash' ? 0x334155 : 0x6b4f2e), 0, 0.3, 0);
                    add(new THREE.BoxGeometry(1.04, 0.08, 0.64), std(0x1f2937, { metalness: 0.7 }), 0, 0.62, 0, false);
                    if (def.locked) add(new THREE.BoxGeometry(0.12, 0.12, 0.04), glow(0xef4444), 0, 0.42, 0.32, false);
                    g.userData.glow = add(new THREE.SphereGeometry(0.06, 6, 6), glow(def.kind === 'stash' ? 0x38bdf8 : 0xfbbf24), 0, 0.75, 0, false);
                    break;
                }
                case 'workbench':
                    add(new THREE.BoxGeometry(1.5, 0.9, 0.75), std(0x523b28), 0, 0.45, 0);
                    add(new THREE.BoxGeometry(1.56, 0.08, 0.8), std(0x475569, { metalness: 0.8 }), 0, 0.92, 0, false);
                    g.userData.glow = add(new THREE.BoxGeometry(0.28, 0.22, 0.2), glow(0xf59e0b), 0.4, 1.07, 0, false);
                    break;
                case 'bounty_board':
                    add(new THREE.BoxGeometry(1.4, 1.6, 0.14), std(0x4a3525), 0, 1.1, 0);
                    g.userData.glow = add(new THREE.BoxGeometry(0.95, 0.7, 0.04), glow(0xfacc15), 0, 1.25, 0.09, false);
                    break;
                case 'terminal':
                    add(new THREE.BoxGeometry(0.7, 1.3, 0.4), std(0x1e293b), 0, 0.65, 0);
                    g.userData.glow = add(new THREE.BoxGeometry(0.5, 0.35, 0.02), glow(0x22d3ee), 0, 1.05, 0.21, false);
                    break;
                case 'dungeon_gate': {
                    for (const x of [-1.25, 1.25]) add(new THREE.BoxGeometry(0.5, 3.5, 0.7), std(0x485362), x, 1.75);
                    add(new THREE.BoxGeometry(3, 0.55, 0.7), std(0x64748b), 0, 3.45);
                    g.userData.glow = add(new THREE.TorusGeometry(0.9, 0.055, 8, 32), glow(0x67e8f9), 0, 1.8);
                    const tag = label(def.dngName, '#67e8f9'); tag.position.y = 4; g.add(tag);
                    break;
                }
                case 'standing_stone': {
                    const stone = BO.OWRPGStatsData.STANDING_STONES[def.stoneId];
                    add(new THREE.CylinderGeometry(0.3, 0.7, 2.7, 5), std(0x334155), 0, 1.35);
                    g.userData.glow = add(new THREE.TorusGeometry(0.48, 0.035, 6, 24), glow(stone.color), 0, 1.9, 0.35);
                    const tag = label(stone.name, stone.color); tag.position.y = 3.2; g.add(tag);
                    break;
                }
                case 'resource_node': {
                    const ore = def.skill === 'mining', rune = def.skill === 'arcana', wood = def.yieldItem === 'elderwood_log';
                    const color = ore ? 0x7dd3fc : rune ? 0xc084fc : 0x86efac;
                    if (wood) {
                        add(new THREE.CylinderGeometry(0.2, 0.45, 3.2, 7), std(0x594230), 0, 1.6);
                        for (let i = 0; i < 3; i++) add(new THREE.ConeGeometry(1.6-i*0.3, 2, 7), std(0x2d6542), 0, 2.8+i*0.7);
                    } else {
                        for (let i = 0; i < 5; i++) {
                            const angle = i * Math.PI * 2 / 5;
                            const node = add(new THREE.IcosahedronGeometry(ore || rune ? 0.42 : 0.22, 0), std(color, { emissive: color, emissiveIntensity: 0.12 }), Math.cos(angle)*0.4, 0.3 + i*0.07, Math.sin(angle)*0.4);
                            node.scale.y = rune ? 2.4 : 1;
                        }
                    }
                    g.userData.glow = add(new THREE.SphereGeometry(0.09, 8, 6), glow(color), 0, wood ? 1.9 : 1.1);
                    break;
                }
                case 'lore_tome':
                    add(new THREE.BoxGeometry(0.8, 0.75, 0.6), std(0x475569), 0, 0.375);
                    g.userData.glow = add(new THREE.BoxGeometry(0.65, 0.1, 0.45), glow(0xe9c46a), 0, 0.82);
                    break;
                case 'hatch':
                    g.userData.glow = add(new THREE.TorusGeometry(1.1, 0.06, 6, 24), glow(0xf5a623), 0, 0.55, 0);
                    g.userData.glow.rotation.x = Math.PI / 2;
                    break;
                case 'exit':
                    for (const dx of [-0.35, 0.35]) add(new THREE.BoxGeometry(0.08, 4, 0.08), std(0x64748b), dx, 2, 0);
                    for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.7, 0.05, 0.05), std(0x94a3b8), 0, 0.35 + i * 0.42, 0);
                    g.userData.glow = add(new THREE.SphereGeometry(0.1, 6, 6), glow(0xa3e635), 0, 4, 0);
                    break;
                case 'valve':
                    add(new THREE.CylinderGeometry(0.25, 0.25, 1.4, 10), std(0x52525b), 0, 0.7, 0);
                    g.userData.wheel = add(new THREE.TorusGeometry(0.55, 0.07, 6, 20), std(0xb91c1c, { metalness: 0.6 }), 0, 1.4, 0.2);
                    g.userData.glow = add(new THREE.SphereGeometry(0.08, 6, 6), glow(0xef4444), 0, 2, 0);
                    break;
                case 'mast':
                    add(new THREE.BoxGeometry(0.8, 1.2, 0.3), std(0x475569), 0, 1.2, 0);
                    g.userData.glow = add(new THREE.BoxGeometry(0.5, 0.2, 0.02), glow(0xf97316), 0, 1.4, 0.16);
                    break;
                case 'sac': {
                    const m = add(new THREE.SphereGeometry(0.7, 12, 10), new THREE.MeshStandardMaterial({ color: 0x65a30d, emissive: 0x365314, emissiveIntensity: 0.8, roughness: 0.4 }), 0, 0.6, 0);
                    m.scale.set(1, 1.3, 1);
                    g.userData.pulse = m;
                    break;
                }
                default:
                    add(new THREE.BoxGeometry(0.5, 0.5, 0.5), std(0x888888), 0, 0.25, 0);
            }
            return g;
        },

        nearest() {
            const P = BO.Player;
            const s = this.s;
            let best = null, bd = 2.8;
            const consider = (type, obj, pos, text, reach = 2.6) => {
                const d = BO.Math.dist3D(P.pos.x, P.pos.y + 0.9, P.pos.z, pos.x, pos.y + 0.6, pos.z);
                if (d < Math.min(bd, reach)) { bd = d; best = { type, obj, text }; }
            };
            for (const n of this.npcs) consider('npc', n, n.pos, `Talk to ${n.def.name}`, 3);
            for (const b of this.bags) consider('bag', b, b.pos, 'Search remains');
            for (const p of this.props) {
                const def = p.def;
                if (s.worldFlags['opened_' + def.id] && def.kind === 'container') continue;
                consider('prop', p, p.pos, this._propText(def), def.kind === 'hatch' ? 2.4 : 2.3);
            }
            const art = BO.World.owrpg;
            if (art) for (const py of this.D.PYLONS) {
                const pos = art.pylons[py.id].group.position;
                consider('pylon', py, pos, s.pylons[py.id] ? `Transit Pylon — ${py.name}` : `Wake ${py.name}`, 3);
            }
            return best;
        },

        _propText(def) {
            const s = this.s;
            const C = BO.OWRPGCharacter;
            switch (def.kind) {
                case 'stash': return 'Open stash';
                case 'workbench': return 'Use Field Repair Bench';
                case 'bounty_board': return 'Open Bounty Board';
                case 'container': {
                    if (!def.locked) return 'Search ' + def.name;
                    const fx = C.perkFx(s);
                    if (fx.lockpick) return `Pick lock: ${def.name} [Lockpick]`;
                    if (C.attr(s, 'TCH') >= 7) return `Bypass lock: ${def.name} [TCH 7]`;
                    if (C.attr(s, 'BRW') >= 8) return `Smash open: ${def.name} [BRW 8]`;
                    return `${def.name} — locked (Lockpick, TCH 7 or BRW 8)`;
                }
                case 'terminal': return s.worldFlags.junction_rerouted ? 'Junction — main line rerouted' : 'Use ' + def.name;
                case 'dungeon_gate': return 'Enter ' + def.dngName + ' · Level ' + def.dngLvl;
                case 'standing_stone': return (s.player.standingStone === def.stoneId ? 'Attuned to ' : 'Attune to ') + def.name;
                case 'resource_node': {
                    const left = Math.ceil((s.worldFlags['gather_' + def.id] || 0) - s.playtimeSec);
                    return left > 0 ? def.name + ' · Regrows in ' + left + 's' : 'Harvest ' + def.name;
                }
                case 'lore_tome': return 'Read ' + def.name;
                case 'hatch': return 'Enter the Culvert Sublevel';
                case 'exit': return 'Climb to the surface';
                case 'valve': return s.worldFlags.culvert_valve_pulled ? 'Bypass valve — removed' : 'Pull the bypass valve';
                case 'mast': return s.worldFlags.relay_lit ? 'Relay mast — online' : 'Repair the relay mast';
                case 'sac': return 'Burn the egg sac';
                default: return def.name;
            }
        },

        interact(t) {
            const M = BO.OWRPGMode;
            if (t.type === 'npc') { BO.OWRPGMounts?.dismount(true); return M.openDialogue(t.obj.def.id); }
            if (t.type === 'bag') return this._lootBag(t.obj);
            if (t.type === 'pylon') return M.usePylon(t.obj);
            return this._useProp(t.obj);
        },

        _useProp(p) {
            const s = this.s;
            const M = BO.OWRPGMode;
            const C = BO.OWRPGCharacter;
            const I = BO.OWRPGInventory;
            const def = p.def;
            const toast = (text, color = '#e2e8f0') => BO.Events.emit('hud:toast', { text, color });
            switch (def.kind) {
                case 'stash': M.openStash(); return;
                case 'workbench': BO.OWRPGUI.openPipPad('inventory'); return;
                case 'bounty_board': BO.OWRPGUI.openPipPad('bounties'); return;
                case 'container': {
                    if (s.worldFlags['opened_' + def.id]) return;
                    if (def.locked) {
                        const fx = C.perkFx(s);
                        if (!fx.lockpick && C.attr(s, 'TCH') < 7 && C.attr(s, 'BRW') < 8) { toast('Locked. Needs the Lockpick perk, TCH 7 or BRW 8.', '#f97316'); return; }
                        if (!fx.lockpick && C.attr(s, 'TCH') < 7) BO.OWRPGAI.noise(p.pos, 25);
                    }
                    if (def.owner && this._witnessed(def.owner, p.pos)) {
                        M.setFlag('provoked_' + def.owner, true);
                        M.changeRep(def.owner, -150);
                        BO.OWRPGAI.refreshHostility();
                        for (const a of BO.OWRPGAI.agentsNear(p.pos, 30, false)) if (a.faction === def.owner) BO.OWRPGAI.engage(a);
                        toast('CAUGHT STEALING — ' + BO.OWRPGFactionsData.FACTIONS[def.owner].short.toUpperCase() + ' HOSTILE', '#ef4444');
                    }
                    M.setFlag('opened_' + def.id, true);
                    const loot = I.rollLoot(s, def.loot || 'cache', def.locked ? 3 : 2);
                    if (def.grant) loot.items.push({ id: def.grant, n: 1 });
                    if (def.grant2) loot.items.push({ id: def.grant2, n: 1 });
                    M.giveLootReport(loot, def.name);
                    C.addSkillXp(s, 'delving', def.int ? 65 : 25);
                    if (p.mesh.userData.glow) p.mesh.userData.glow.visible = false;
                    BO.Sound.playUIClick();
                    return;
                }
                case 'terminal': {
                    if (s.worldFlags.junction_rerouted) { toast('The main line is already rerouted.'); return; }
                    if (C.attr(s, 'TCH') >= 6 || I.has(s, 'pressure_schematic')) {
                        M.setFlag('junction_rerouted', true);
                        M.giveXp(80, 'Rerouted');
                        toast('Main line rerouted. The bypass is starved of pressure.', '#22d3ee');
                        if (BO.OWRPGCharacter.perkFx(s).override) BO.OWRPGAI.noise(p.pos, 0);
                    } else toast('The pressure readouts mean nothing to you. (TCH 6 or a Pressure Schematic)', '#f97316');
                    return;
                }
                case 'hatch': {
                    const fx = C.perkFx(s);
                    if (!I.has(s, 'culvert_keycard') && !fx.lockpick && C.attr(s, 'BRW') < 7) { toast('The hatch is sealed. (Culvert Keycard, Lockpick perk or BRW 7)', '#f97316'); return; }
                    this.enter(def.to, 'culvert');
                    return;
                }
                case 'dungeon_gate': this.enter(def.to, def.dngId); return;
                case 'standing_stone': {
                    const stone = BO.OWRPGStatsData.STANDING_STONES[def.stoneId];
                    if (s.player.standingStone === def.stoneId) { toast(stone.desc, stone.color); return; }
                    s.player.standingStone = def.stoneId;
                    M.applyDerived();
                    toast(stone.name + ' — ' + stone.desc, stone.color);
                    BO.Sound.playPerkBuy();
                    M.checkpoint('Standing stone attuned');
                    return;
                }
                case 'resource_node': {
                    if ((s.worldFlags['gather_' + def.id] || 0) > s.playtimeSec) return;
                    const fx = C.perkFx(s);
                    const n = 1 + (Math.random() < Math.min(1, (fx.doubleGather || 0) + (fx.gatherChance || 0)) ? 1 : 0);
                    I.add(s, def.yieldItem, n);
                    s.worldFlags['gather_' + def.id] = s.playtimeSec + 600;
                    C.addSkillXp(s, def.skill, 35);
                    M.itemEvent(def.yieldItem);
                    M.giveXp(8, 'Harvest');
                    toast(I.def(def.yieldItem).name + ' ×' + n, '#86efac');
                    BO.Sound.playUIClick();
                    return;
                }
                case 'lore_tome': {
                    const lore = {
                        l_tome_1: 'Haven fell when its transmitters went silent. Freestead survives by maintaining the old relay routes. The first expedition marked a culvert beneath Pump Three as a passage into the buried network.',
                        l_tome_2: 'The Grimhollow Pact bound the dead to the moor. Its keepers sealed their names inside the Sunken Crypt. Fire breaks their frost-bound armor, but the Nightlords wait beyond the graveyard.',
                        l_tome_3: 'The Dragonwilds formed around a fallen star. Runic stone feeds the ash-drakes, while frost disrupts their inner flame. Vaelgor guards the deepest vault, and the last expedition never returned.'
                    };
                    if (!s.worldFlags['read_' + def.id]) {
                        M.setFlag('read_' + def.id, true);
                        C.addSkillXp(s, 'arcana', 80);
                        M.giveXp(75, 'Chronicle discovered');
                    }
                    BO.OWRPGUI.open('lore', '<span class="ow-kicker">MERIDIAN ARCHIVES</span><h2>' + def.name + '</h2><p class="ow-dim">' + lore[def.id] + '</p><button class="ow-btn" data-act="close">CLOSE</button>');
                    return;
                }
                case 'exit': this.exit(def.to); return;
                case 'valve': {
                    if (s.worldFlags.culvert_valve_pulled) { toast('The bypass is already gone.'); return; }
                    M.setFlag('culvert_valve_pulled', true);
                    I.add(s, 'bypass_valve', 1);
                    M.itemEvent('bypass_valve');
                    M.giveXp(60, 'Bypass pulled');
                    toast('You wrench the bypass valve free. Somewhere above, Pump Three groans back to life.', '#a3e635');
                    BO.OWRPGAI.noise(p.pos, 40);
                    return;
                }
                case 'mast': {
                    if (s.worldFlags.relay_lit) { toast('The relay is already broadcasting.'); return; }
                    if (I.has(s, 'relay_fuse')) { I.remove(s, 'relay_fuse', 1); }
                    else if (C.attr(s, 'TCH') < 5) { toast('The fuse is blown. (Relay Fuse or TCH 5 to jury-rig)', '#f97316'); return; }
                    M.setFlag('relay_lit', true);
                    M.giveXp(80, 'Relay online');
                    if (p.mesh.userData.glow) p.mesh.userData.glow.material.color.setHex(0x22c55e);
                    toast('The relay hums. Static gives way to voices from the outer farms.', '#22d3ee');
                    return;
                }
                case 'sac': {
                    M.setFlag('sac_' + def.id, true);
                    M.setFlag('sacs_destroyed', (Number(s.worldFlags.sacs_destroyed) || 0) + 1);
                    BO.FX.spawnExplosion(p.pos.clone().add(UP), 2.5, 0x84cc16);
                    BO.Sound.playExplosion?.(0.4);
                    p.mesh.removeFromParent();
                    this.props.splice(this.props.indexOf(p), 1);
                    M.giveXp(30, null, true);
                    if (Math.random() < 0.5) BO.OWRPGAI.spawn('crawler', def.x + 2, def.z + 2, { poiId: 'shale_cave', leash: 40 });
                    return;
                }
                default: return;
            }
        },

        _witnessed(faction, pos) {
            if (BO.OWRPGMode.camoT > 0) return false;
            return BO.OWRPGAI.agents.some((a) => a.alive && a.faction === faction && !a.hostile &&
                a.ent.pos.distanceTo(pos) < 18 && BO.World.hasLineOfSight(a.ent.pos.x, a.ent.pos.y + 1.5, a.ent.pos.z, pos.x, pos.y + 0.8, pos.z));
        },

        dropBag(pos, loot) {
            if (!loot.items.length && !loot.credits) return;
            const g = new THREE.Group();
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.35), std(0x3f3a2e));
            m.position.y = 0.15;
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.55 }));
            beam.position.y = 0.95;
            g.add(m, beam);
            const y = BO.World.getGroundHeight(pos.x, pos.z, pos.y + 0.6);
            g.position.set(pos.x, y, pos.z);
            BO.World.scene.add(g);
            this.bags.push({ mesh: g, pos: new THREE.Vector3(pos.x, y, pos.z), loot, t: 300 });
        },

        _lootBag(b) {
            BO.OWRPGMode.giveLootReport(b.loot, 'Remains');
            b.mesh.removeFromParent();
            this.bags.splice(this.bags.indexOf(b), 1);
        },

        enter(to, id) {
            BO.OWRPGMounts?.dismount(true);
            const P = BO.Player;
            P.pos.set(to.x, to.y, to.z);
            P.vel.set(0, 0, 0);
            P.yaw = to.yaw || 0;
            this.s.player.interiorId = id;
            const dungeon = this.D.DUNGEONS.find(d => d.id === id || (id === 'culvert' && d.id === 'culvert_sublevel'));
            BO.Events.emit('hud:banner', { title: dungeon ? dungeon.name.toUpperCase() : 'CULVERT SUBLEVEL', sub: dungeon ? 'Recommended level ' + dungeon.lvl : 'Flooded maintenance tunnels', color: '#84cc16' });
            BO.OWRPGWorldSim.tick1(0);
            BO.OWRPGMode.checkpoint('Entered ' + (dungeon ? dungeon.name : 'interior'));
        },

        exit(to) {
            const P = BO.Player;
            P.pos.set(to.x, BO.World.terrainHeight(to.x, to.z) + 0.2, to.z);
            P.vel.set(0, 0, 0);
            P.yaw = to.yaw || 0;
            this.s.player.interiorId = null;
            BO.OWRPGWorldSim.tick1(0);
            BO.OWRPGMode.checkpoint('Left interior');
        },

        update(dt) {
            const P = BO.Player;
            for (const p of this.props) {
                const near = BO.Math.dist2D(P.pos.x, P.pos.z, p.pos.x, p.pos.z) < 58;
                if (p.mesh.visible !== near) p.mesh.visible = near;
                if (!near) continue;
                p.phase += dt;
                const u = p.mesh.userData;
                if (u.glow && p.def.kind === 'resource_node') u.glow.visible = (this.s.worldFlags['gather_' + p.def.id] || 0) <= this.s.playtimeSec;
                if (u.glow && p.def.kind === 'container') u.glow.visible = !this.s.worldFlags['opened_' + p.def.id];
                if (u.glow && u.glow.visible) u.glow.scale.setScalar(1 + Math.sin(p.phase * 4) * 0.25);
                if (u.pulse) u.pulse.scale.set(1 + Math.sin(p.phase * 3) * 0.06, 1.3 + Math.sin(p.phase * 3) * 0.08, 1);
                if (u.wheel && this.s.worldFlags.culvert_valve_pulled) u.wheel.visible = false;
            }
            for (const n of this.npcs) {
                n.phase += dt;
                const d = BO.Math.dist2D(P.pos.x, P.pos.z, n.pos.x, n.pos.z);
                const near = d < (n.def.indoor ? 36 : 65);
                if (n.parts.root.visible !== near) n.parts.root.visible = near;
                if (!near) continue;
                const want = d < 6 ? Math.atan2(P.pos.x - n.pos.x, P.pos.z - n.pos.z) : n.def.yaw || 0;
                n.yaw += BO.Math.angleDiff(n.yaw, want) * Math.min(1, dt * 4);
                n.parts.root.rotation.y = n.yaw;
                const far = d > NPC_DETAIL_DIST;
                if (n.lod) BO.MeshProxy.set(n.lod, far);
                if (!far || !n.lod) BO.CharacterMesh.animateLimbs(n.parts, 0, n.phase * 1.4, 0, 0);
            }
            for (let i = this.bags.length - 1; i >= 0; i--) {
                const b = this.bags[i];
                b.t -= dt;
                b.mesh.rotation.y += dt;
                if (b.t <= 0) { b.mesh.removeFromParent(); this.bags.splice(i, 1); }
            }
        }
    };

    BO.OWRPGInteriors = Props;
})(window.BO);
;

/* --- src/owrpg/OWRPGMounts.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Summonable Rideable Mounts
   4 distinct custom 3D articulated mounts (Scrap Scout Bike, Nomad Hoverbike,
   Meridian Armored ATV, Aegis War Strider). Toggle with [T], boost with [Shift].
   Smooth terrain & slope tracking, night headlights, bob/lean animations,
   auto-dismount indoors/dialogue/death. Low draw calls (only active mount).
============================================================================ */
(function (BO) {
    'use strict';

    const Mounts = {
        mounted: false,
        activeId: null,
        mesh: null,
        headlight: null,
        parts: null,
        boostFuel: 100,
        boosting: false,
        speed: 0,
        animPhase: 0,
        _lastEye: null,

        get defs() { return (BO.OWRPGExpansionData && BO.OWRPGExpansionData.MOUNTS) || {}; },
        get s() { return BO.OWRPGMode.state; },

        reset() {
            this.dismount(true);
            this.boostFuel = 100;
            this.boosting = false;
            this.speed = 0;
        },

        isOwned(s, id) {
            return !!(s && s.player && s.player.mounts && s.player.mounts.owned.includes(id));
        },

        unlock(s, id) {
            if (!s || !s.player || !this.defs[id]) return false;
            if (!s.player.mounts) s.player.mounts = { owned: [], active: null };
            if (!s.player.mounts.owned.includes(id)) {
                s.player.mounts.owned.push(id);
                if (!s.player.mounts.active) s.player.mounts.active = id;
                BO.Events.emit('hud:banner', { title: 'MOUNT UNLOCKED', sub: `${this.defs[id].name} — Press [T] to summon`, color: '#38bdf8' });
                return true;
            }
            return false;
        },

        select(s, id) {
            if (!this.isOwned(s, id)) return false;
            s.player.mounts.active = id;
            if (this.mounted && this.activeId !== id) {
                this.dismount(true);
                this.mount();
            }
            return true;
        },

        toggle() {
            if (this.mounted) { this.dismount(); return; }
            this.mount();
        },

        mount() {
            const s = this.s;
            if (!s || !BO.Player.alive) return false;
            if (BO.OWRPGWorldData.isInterior(BO.Player.pos.x, BO.Player.pos.z)) {
                BO.OWRPGMode.toast('Cannot summon mount indoors.', '#f97316');
                return false;
            }
            const mState = s.player.mounts || { owned: [], active: null };
            const id = mState.active || mState.owned[0];
            if (!id || !this.defs[id]) {
                BO.OWRPGMode.toast('No mount unlocked yet — talk to Torin in Freestead!', '#f97316');
                return false;
            }
            this.dismount(true);
            this.activeId = id;
            this.mounted = true;
            this.mesh = this._buildMesh(id);
            BO.World.scene.add(this.mesh);
            BO.Player.adsHeld = false;
            BO.Player.adsAlpha = 0;
            BO.Player.reloading = false;
            BO.Combat?.cancelCharge?.();
            BO.Sound?.playUIClick?.();
            BO.OWRPGMode.toast(`Mounted: ${this.defs[id].name} ([Shift] Turbo · [T] Dismount)`, '#38bdf8');
            return true;
        },

        dismount(silent = false) {
            if (this.mesh) {
                this.mesh.removeFromParent();
                this.mesh = null;
            }
            this.headlight = null;
            this.parts = null;
            if (this.mounted) {
                this.mounted = false;
                this.activeId = null;
                this.boosting = false;
                this.speed = 0;
                BO.Player.eyeHeight = BO.Player.crouching ? 1.04 : 1.60;
                if (!silent) BO.OWRPGMode.toast('Dismounted', '#94a3b8');
            }
        },

        speedMult() {
            if (!this.mounted || !this.activeId) return 1;
            const d = this.defs[this.activeId];
            if (!d) return 1;
            const P = BO.Player;
            const wantsBoost = (P.keys?.ShiftLeft || P.keys?.ShiftRight) && this.boostFuel > 4 && Math.hypot(P.vel.x, P.vel.z) > 1;
            this.boosting = wantsBoost;
            const targetSpd = wantsBoost ? d.boostSpeed : d.speed;
            // Base walk speed in PlayerController is ~5.4 (sprint 7.1, tac 8.4)
            const baseRef = P.tacSprinting ? 8.4 : (P.sprinting ? 7.1 : 5.4);
            return targetSpd / Math.max(1, baseRef);
        },

        drMult() {
            if (!this.mounted || !this.activeId) return 1;
            const d = this.defs[this.activeId];
            return 1 - ((d && d.dr) || 0);
        },

        _buildMesh(id) {
            const def = this.defs[id];
            const g = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.45, metalness: 0.55 });
            const darkMat = new THREE.MeshStandardMaterial({ color: def.accent, roughness: 0.65, metalness: 0.6 });
            const glowMat = new THREE.MeshBasicMaterial({ color: def.hover ? 0x38bdf8 : 0xfde047 });
            const parts = { wheels: [], legs: [], thrusters: [] };

            if (id === 'scout_bike') {
                const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 1.75), bodyMat);
                chassis.position.set(0, 0.55, 0);
                const fork = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.16), darkMat);
                fork.position.set(0, 0.68, -0.78); fork.rotation.x = 0.35;
                const bars = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.08), darkMat);
                bars.position.set(0, 0.98, -0.62);
                const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), glowMat);
                lamp.position.set(0, 0.85, -0.88);
                g.add(chassis, fork, bars, lamp);
                const wGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.16, 12);
                wGeo.rotateZ(Math.PI / 2);
                for (const wz of [-0.75, 0.72]) {
                    const w = new THREE.Mesh(wGeo, darkMat);
                    w.position.set(0, 0.32, wz);
                    g.add(w); parts.wheels.push(w);
                }
            } else if (id === 'hoverbike') {
                const hull = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 2.2), bodyMat);
                hull.position.set(0, 0.65, 0);
                const nose = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 6), bodyMat);
                nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0.66, -1.35);
                const finL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.9), darkMat);
                finL.position.set(-0.4, 0.6, 0.35);
                const finR = finL.clone(); finR.position.x = 0.4;
                const thrL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.3, 8), glowMat);
                thrL.rotation.x = Math.PI / 2; thrL.position.set(-0.22, 0.6, 1.15);
                const thrR = thrL.clone(); thrR.position.x = 0.22;
                g.add(hull, nose, finL, finR, thrL, thrR);
                parts.thrusters.push(thrL, thrR);
            } else if (id === 'aegis_atv') {
                const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.45, 2.0), bodyMat);
                body.position.set(0, 0.62, 0);
                const cage = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.55, 1.1), darkMat);
                cage.position.set(0, 1.05, 0.15);
                const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.22), darkMat);
                bumper.position.set(0, 0.52, -1.08);
                const bar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.08), glowMat);
                bar.position.set(0, 0.75, -1.02);
                g.add(body, cage, bumper, bar);
                const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.24, 12);
                wGeo.rotateZ(Math.PI / 2);
                for (const [wx, wz] of [[-0.62, -0.72], [0.62, -0.72], [-0.62, 0.72], [0.62, 0.72]]) {
                    const w = new THREE.Mesh(wGeo, darkMat);
                    w.position.set(wx, 0.35, wz);
                    g.add(w); parts.wheels.push(w);
                }
            } else {
                // war_strider
                const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 1.25), bodyMat);
                cockpit.position.set(0, 1.85, 0);
                const visor = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.26, 0.12), glowMat);
                visor.position.set(0, 1.98, -0.62);
                const podL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.9), darkMat);
                podL.position.set(-0.75, 1.95, -0.15);
                const podR = podL.clone(); podR.position.x = 0.75;
                const legL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.35, 0.42), darkMat);
                legL.position.set(-0.45, 0.72, 0);
                const legR = legL.clone(); legR.position.x = 0.45;
                g.add(cockpit, visor, podL, podR, legL, legR);
                parts.legs.push(legL, legR);
            }

            const spot = new THREE.SpotLight(def.hover ? 0x7dd3fc : 0xfff3c4, 0, 42, Math.PI / 4, 0.45, 1.3);
            spot.position.set(0, def.strider ? 2.0 : 0.9, -0.9);
            const target = new THREE.Object3D();
            target.position.set(0, 0.2, -14);
            g.add(spot, target);
            spot.target = target;
            this.headlight = spot;
            this.parts = parts;
            return g;
        },

        update(dt) {
            if (!this.mounted || !this.mesh || !this.activeId) return;
            const P = BO.Player;
            if (!P.alive || BO.OWRPGWorldData.isInterior(P.pos.x, P.pos.z)) {
                this.dismount(true);
                return;
            }
            const def = this.defs[this.activeId];
            const hSpeed = Math.hypot(P.vel.x, P.vel.z);
            this.speed = hSpeed;
            if (this.boosting) this.boostFuel = Math.max(0, this.boostFuel - dt * 28);
            else this.boostFuel = Math.min(100, this.boostFuel + dt * 16);

            // Position & yaw tracking
            this.mesh.position.set(P.pos.x, P.pos.y, P.pos.z);
            this.mesh.rotation.y = P.yaw;

            // Terrain slope pitch & lean roll
            const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
            const hF = BO.World.terrainHeight(P.pos.x + fx * 1.1, P.pos.z + fz * 1.1);
            const hB = BO.World.terrainHeight(P.pos.x - fx * 1.1, P.pos.z - fz * 1.1);
            const slopePitch = Math.atan2(hF - hB, 2.2) * 0.6;
            const steerLean = ((P.keys?.KeyA ? 1 : 0) - (P.keys?.KeyD ? 1 : 0)) * (def.hover || this.activeId === 'scout_bike' ? 0.14 : 0.04) * Math.min(1, hSpeed / 8);
            this.mesh.rotation.x = BO.Math.damp(this.mesh.rotation.x, slopePitch, 10, dt);
            this.mesh.rotation.z = BO.Math.damp(this.mesh.rotation.z, steerLean, 10, dt);

            this.animPhase += dt * Math.max(1, hSpeed * 0.9);
            if (def.hover) {
                this.mesh.position.y += 0.22 + Math.sin(this.animPhase * 1.8) * 0.06;
            }
            if (this.parts) {
                for (const w of this.parts.wheels) w.rotation.x -= hSpeed * dt * 2.6;
                for (const t of this.parts.thrusters) t.scale.setScalar(this.boosting ? 1.35 : 0.95 + Math.sin(this.animPhase * 4) * 0.08);
                if (this.parts.legs.length === 2) {
                    const stride = Math.min(1, hSpeed / 6) * 0.45;
                    this.parts.legs[0].rotation.x = Math.sin(this.animPhase) * stride;
                    this.parts.legs[1].rotation.x = -Math.sin(this.animPhase) * stride;
                }
            }

            // Eye height adjustment
            const targetEye = def.strider ? 2.35 : 1.72;
            P.eyeHeight = BO.Math.damp(P.eyeHeight, targetEye + (hSpeed > 2 ? Math.sin(this.animPhase * 2) * 0.02 : 0), 12, dt);

            // Night headlights
            if (this.headlight) {
                const night = BO.OWRPGWorldSim && BO.OWRPGWorldSim.isNight();
                this.headlight.intensity = night ? 2.4 : 0;
            }
        }
    };

    BO.OWRPGMounts = Mounts;
})(window.BO);
;

/* --- src/owrpg/OWRPGEvents.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Dynamic World Events (21 Regional Event Types)
   Spawns timed dynamic events near the player while exploring the Meridian
   Expanse: Supply Drop, Faction Skirmish, Brood Swarm, Convoy Raid, Void
   Anomaly Storm, Relay Defense, Rogue Mecha, Black-Market Cache.
============================================================================ */
(function (BO) {
    'use strict';

    const EVENT_TYPES = [
        // Region-flavoured events: `dynamic` squads are drawn from the local encounter pool; `champion` promotes the leader.
        { id: 'champion_incursion', title: 'Champion Incursion', color: '#e879f9', dur: 150, dynamic: true, champion: 2, enemies: ['raider', 'raider_bruiser'], loot: 'champion', xp: 520, credits: 300, desc: 'A Champion leads a local warband into the open. Slay the Champion and its escort.' },
        { id: 'relic_storm', title: 'Relic Storm', color: '#fbbf24', dur: 150, dynamic: true, goal: 'hold', hold: 40, enemies: ['raider', 'raider'], loot: 'treasure', xp: 460, credits: 260, desc: 'A Pre-Fall relic is surfacing. Stay within 12 m for 40 seconds while scavengers close in.' },
        { id: 'champion_warband', title: 'Champion Warband', color: '#f43f5e', dur: 220, dynamic: true, champion: 3, goal: 'waves', waves: 2, enemies: ['raider', 'raider'], loot: 'champion', xp: 980, credits: 560, desc: 'Two waves, each led by a three-affix Champion.' },
        { id: 'pinewood_rescue', title: 'Pinewood Rescue Signal', color: '#4ade80', dur: 130, enemies: ['forest_poacher', 'orc_reaver'], goal: 'hold', hold: 35, loot: 'raider', xp: 290, credits: 170, desc: 'Stay within 12 m of the signal for 35 seconds to finish the rescue uplink.' },
        { id: 'wolf_migration', title: 'Moonlit Wolf Migration', color: '#86efac', dur: 160, enemies: ['timber_wolf', 'timber_wolf'], goal: 'waves', waves: 3, loot: 'brood', xp: 360, credits: 180, desc: 'Survive three approaching wolf packs.' },
        { id: 'grave_procession', title: 'Procession of the Restless', color: '#c4b5fd', dur: 190, enemies: ['skeleton_warrior', 'grave_zombie', 'barrow_ghost'], goal: 'waves', waves: 3, loot: 'undead', xp: 640, credits: 320, desc: 'Break three waves of the grave procession.' },
        { id: 'blood_moon', title: 'Blood-Moon Hunt', color: '#fb7185', dur: 130, enemies: ['blood_vampire', 'crypt_keeper'], loot: 'undead', xp: 540, credits: 290, desc: 'Defeat the Nightlord and its keeper before the blood-moon window closes.' },
        { id: 'sunfang_survey', title: 'Sunfang Survey Beacon', color: '#fbbf24', dur: 160, enemies: ['sunfang_guardian', 'dune_scorpion'], goal: 'hold', hold: 45, loot: 'locked', xp: 760, credits: 380, desc: 'Hold the 12 m survey ring for 45 seconds while constructs converge.' },
        { id: 'tidal_incursion', title: 'Corsair Tidefall', color: '#22d3ee', dur: 200, enemies: ['drowned_corsair', 'abyssal_siren'], goal: 'waves', waves: 3, loot: 'undead', xp: 890, credits: 420, desc: 'Repel three waves of the drowned tide.' },
        { id: 'frost_resonance', title: 'Frostspire Resonance', color: '#7dd3fc', dur: 170, enemies: ['frost_knight', 'frost_wyrmling'], goal: 'hold', hold: 50, loot: 'aegis', xp: 1150, credits: 540, desc: 'Remain near the resonance beacon for 50 seconds to stabilize the glacier.' },
        { id: 'glacier_hunt', title: 'Glacier Colossus Hunt', color: '#e0f2fe', dur: 140, enemies: ['glacier_troll', 'glacier_troll'], loot: 'locked', xp: 1250, credits: 600, desc: 'Bring down both ice-trolls before they leave the hunting grounds.' },
        { id: 'dragonwild_siege', title: 'Ashfall Siege', color: '#fb923c', dur: 240, enemies: ['ashen_drake', 'obsidian_cultist', 'dragonwild_juggernaut'], goal: 'waves', waves: 3, loot: 'dragon', xp: 1900, credits: 850, desc: 'Withstand three assault waves from the Dragonwilds.' },
        { id: 'gilded_hoard', title: 'The Gilded Hoard', color: '#fde047', dur: 90, enemies: ['treasure_puglin', 'puglin_scamp', 'puglin_scamp'], loot: 'locked', xp: 420, credits: 480, desc: 'Defeat the golden hoarder and recover its guarded cache.' },
        { id: 'supply_drop', title: 'Orbital Supply Drop', color: '#38bdf8', dur: 110, enemies: ['raider', 'raider_pyro', 'raider_bruiser'], loot: 'locked', xp: 240, credits: 160, desc: 'Eliminate scavengers guarding the supply pod.' },
        { id: 'faction_skirmish', title: 'Faction Skirmish', color: '#f5a623', dur: 110, enemies: ['militia', 'militia_scout', 'enforcer', 'syn_gunner'], loot: 'syndicate', xp: 260, credits: 180, desc: 'Intervene in the firefight between Militia and Syndicate.' },
        { id: 'brood_swarm', title: 'Brood Swarm Surge', color: '#84cc16', dur: 100, enemies: ['crawler', 'brood_venom_mite', 'stalker', 'brood_blight_hound'], loot: 'brood', xp: 250, credits: 140, desc: 'Purge the surging Brood pack.' },
        { id: 'convoy_raid', title: 'Convoy Ambush', color: '#ef4444', dur: 110, enemies: ['raider', 'raider_marksman', 'raider_bruiser'], loot: 'cache', xp: 230, credits: 170, desc: 'Drive off raiders ambushing the supply convoy.' },
        { id: 'void_storm', title: 'Void Anomaly Storm', color: '#c084fc', dur: 120, enemies: ['helix_voidweaver', 'brood_void_stalker', 'helix_zealot'], loot: 'helix', xp: 340, credits: 240, desc: 'Close the Void rift by defeating its guardians.' },
        { id: 'relay_defense', title: 'Relay Surge Defense', color: '#facc15', dur: 100, enemies: ['syn_arc_tech', 'enforcer', 'brood_blight_hound'], loot: 'aegis', xp: 290, credits: 210, desc: 'Eliminate the disruptor squad jamming the relay.' },
        { id: 'rogue_mecha', title: 'Rogue Aegis Patrol', color: '#60a5fa', dur: 120, enemies: ['aegis', 'aegis_heavy', 'aegis_cryo'], loot: 'aegis', xp: 360, credits: 260, desc: 'Disable the malfunctioning Aegis heavy squad.' },
        { id: 'black_market', title: 'Black-Market Stash', color: '#fbbf24', dur: 110, enemies: ['enforcer', 'syn_sniper', 'syn_arc_tech'], loot: 'locked', xp: 310, credits: 250, desc: 'Defeat the Syndicate smugglers and seize their cache.' }
    ];

    const Events = {
        types: EVENT_TYPES,
        activeEvent: null,
        cooldown: 55,
        _n: 0,

        reset() {
            this.clear();
            this.cooldown = 55;
        },

        clear() {
            if (this.activeEvent) {
                if (this.activeEvent.beacon) this.activeEvent.beacon.removeFromParent();
                for (const a of this.activeEvent.agents) {
                    if (BO.OWRPGAI.agents.includes(a)) BO.OWRPGAI.despawn(a);
                }
                this.activeEvent = null;
            }
        },

        tick(dt) {
            const s = BO.OWRPGMode.state;
            const P = BO.Player;
            if (!s || !P.alive) return;
            const inside = BO.OWRPGWorldData.isInterior(P.pos.x, P.pos.z);

            if (this.activeEvent) {
                const ev = this.activeEvent;
                ev.t -= dt;
                if (ev.beacon) ev.beacon.rotation.y += dt * 1.8;
                const aliveHostiles = ev.agents.filter((a) => a.alive && a.hostile).length;
                ev.remaining = aliveHostiles;
                const distance = BO.Math.dist2D(P.pos.x, P.pos.z, ev.x, ev.z);
                if (ev.def.goal === 'hold') {
                    if (!inside && distance <= 12) ev.progress += dt;
                    ev.desc = ev.def.desc + ' · ' + Math.floor(ev.progress) + '/' + ev.def.hold + 's';
                    if (ev.progress >= ev.def.hold) { this._complete(ev); return; }
                } else if (aliveHostiles === 0) {
                    if (ev.def.goal === 'waves' && ev.wave < ev.def.waves) {
                        for (const a of ev.agents) if (BO.OWRPGAI.agents.includes(a)) BO.OWRPGAI.despawn(a);
                        ev.wave++;
                        ev.agents = this._spawnSquad(ev.def, ev.x, ev.z, 'evt_' + (++this._n));
                        ev.total = ev.remaining = ev.agents.length;
                        ev.desc = ev.def.desc + ' · Wave ' + ev.wave + '/' + ev.def.waves;
                        BO.OWRPGMode.toast('Wave ' + ev.wave + ' incoming', ev.color);
                    } else { this._complete(ev); return; }
                }
                if (ev.t <= 0 || inside || BO.Math.dist2D(P.pos.x, P.pos.z, ev.x, ev.z) > 210) {
                    BO.OWRPGMode.toast(`World Event ended: ${ev.title}`, '#94a3b8');
                    this.clear();
                    this.cooldown = 75;
                }
                return;
            }

            if (inside || BO.OWRPGAI.agents.filter(a => a.alive).length > 14) return;
            this.cooldown -= dt;
            if (this.cooldown <= 0) {
                this.spawnNearPlayer();
                this.cooldown = 115;
            }
        },

        spawnNearPlayer(forcedId = null) {
            const P = BO.Player;
            const D = BO.OWRPGWorldData;
            if (this.activeEvent || D.isInterior(P.pos.x, P.pos.z)) return null;
            const reg = D.regionAt(P.pos.x, P.pos.z);
            const ang = Math.random() * Math.PI * 2;
            const dist = 52 + Math.random() * 24;
            const x = BO.Math.clamp(P.pos.x + Math.cos(ang) * dist, D.BOUNDS.minX + 24, D.BOUNDS.maxX - 24);
            const z = BO.Math.clamp(P.pos.z + Math.sin(ang) * dist, D.BOUNDS.minZ + 24, D.BOUNDS.maxZ - 24);
            if (BO.World.terrainHeight(x, z) < D.WATER + 0.3 || BO.Math.dist2D(x, z, D.TOWN.x, D.TOWN.z) < 55) return null;

            const def = forcedId ? (EVENT_TYPES.find((e) => e.id === forcedId) || EVENT_TYPES[0]) : this._pickForRegion(reg.id);
            const id = 'evt_' + (++this._n);
            const agents = this._spawnSquad(def, x, z, id);
            if (!agents.length) return null;

            const y = BO.World.terrainHeight(x, z);
            const beacon = new THREE.Group();
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.28, 16, 8),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(def.color), transparent: true, opacity: 0.45, fog: false })
            );
            pillar.position.y = 8;
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(1.4, 0.09, 6, 20),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(def.color), fog: false })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 1.2;
            beacon.add(pillar, ring);
            beacon.position.set(x, y, z);
            BO.World.scene.add(beacon);

            this.activeEvent = {
                progress: 0, wave: 1,
                id: def.id, title: def.title, desc: def.desc, color: def.color,
                x, z, t: def.dur, maxT: def.dur, agents, beacon, def,
                total: agents.filter((a) => a.hostile).length,
                remaining: agents.filter((a) => a.hostile).length
            };
            BO.Events.emit('hud:banner', { title: 'WORLD EVENT', sub: `${def.title} — ${Math.round(dist)}m away`, color: def.color });
            return this.activeEvent;
        },

        _spawnSquad(def, x, z, id) {
            let ids = def.enemies;
            if (def.dynamic && BO.OWRPGWorldSim.encounterPool) {
                const pool = BO.OWRPGWorldSim.encounterPool(BO.OWRPGWorldData.regionAt(x, z).id);
                const pick = pool[Math.floor(Math.random() * pool.length)];
                ids = pick.length >= 3 ? pick : pick.concat(pick).slice(0, 3);
            }
            const squad = ids.map((eid, i) => {
                const a = BO.OWRPGAI.spawn(eid, x + (i % 2)*5 - 2.5, z + Math.floor(i / 2)*5 - 2.5, { poiId: id, leash: 80, postR: 8, noChampion: !!def.champion });
                if (a) {
                    // Event squads are explicit adversaries even when their parent faction is friendly.
                    a.eventHostile = true; a.hostile = true;
                    BO.OWRPGAI.engage(a);
                }
                return a;
            }).filter(Boolean);
            if (def.champion && squad[0] && BO.OWRPGChampions) BO.OWRPGChampions.make(squad[0], def.champion);
            return squad;
        },

        _pickForRegion(regId) {
            const byReg = {
                haven_basin: ['supply_drop', 'convoy_raid', 'brood_swarm'],
                rust_sprawl: ['faction_skirmish', 'black_market', 'convoy_raid'],
                mire_delta: ['brood_swarm', 'supply_drop', 'relay_defense'],
                ash_quarry: ['faction_skirmish', 'rogue_mecha', 'supply_drop'],
                alpine_array: ['rogue_mecha', 'relay_defense', 'supply_drop'],
                meridian_core: ['void_storm', 'rogue_mecha', 'black_market'],
                whispering_woods: ['pinewood_rescue', 'wolf_migration', 'gilded_hoard'],
                barrow_moor: ['grave_procession', 'blood_moon'],
                sunscorched_badlands: ['sunfang_survey', 'gilded_hoard'],
                sunken_coast: ['tidal_incursion', 'black_market'],
                frostfang_peaks: ['frost_resonance', 'glacier_hunt'],
                obsidian_dragonwilds: ['dragonwild_siege', 'void_storm']
            };
            const tier = parseInt(String((BO.OWRPGWorldData.REGIONS.find((r) => r.id === regId) || {}).lvl), 10) || 1;
            const pool = (byReg[regId] || EVENT_TYPES.map((e) => e.id)).concat(['champion_incursion', 'relic_storm'], tier >= 17 ? ['champion_warband'] : []);
            const pickId = BO.Math.pick(pool);
            return EVENT_TYPES.find((e) => e.id === pickId) || EVENT_TYPES[0];
        },

        _complete(ev) {
            const s = BO.OWRPGMode.state;
            const def = ev.def;
            if (ev.beacon) ev.beacon.removeFromParent();
            BO.OWRPGMode.giveXp(def.xp, ev.title);
            s.player.credits += def.credits;
            s.stats.eventsCleared = (s.stats.eventsCleared || 0) + 1;
            const loot = BO.OWRPGInventory.rollLoot(s, def.loot || 'cache', 3);
            BO.OWRPGInteriors.dropBag(new THREE.Vector3(ev.x, BO.World.terrainHeight(ev.x, ev.z), ev.z), loot);
            BO.Sound?.playQuestFanfare?.();
            BO.Events.emit('hud:banner', { title: 'EVENT CLEARED', sub: `${ev.title} · +${def.xp} XP · +${def.credits} cr`, color: '#4ade80' });
            this.clear();
            this.cooldown = 95;
        }
    };

    BO.OWRPGEvents = Events;
})(window.BO);
;

/* --- src/owrpg/OWRPGValidator.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Developer Integrity Validator
   Checks dialogue graph refs, quest refs, world refs, OWRPGGunStats coverage,
   armor sets/mounts/abilities, spatial audit, and TTK curve.
============================================================================ */
(function (BO) {
    'use strict';

    const ENTRY_NODES = [
        'intro_1', 'hub', 'prefixed', 'turnin', 'hostile_bark', 'hostile',
        'nest_done', 'relay_done', 'signal',
        'wheels_done', 'trials_done', 'barge_done', 'smugglers_done',
        'rogue_done', 'mire_done', 'blackbox_done', 'truce_done', 'cipher_done'
    ];

    const V = {
        runAll(logToConsole = false) {
            const errors = [], warnings = [];
            const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
            this._dialogue(err, warn);
            this._quests(err, warn);
            this._world(err, warn);
            this._expansion(err, warn);
            this._ttk(err, warn);
            if (BO.World && BO.World.mapData && BO.World.mapData.id === 'meridian') { this._spatial(err, warn); this._discoveries(err, warn); }
            const report = `OWRPG validator: ${errors.length} error(s), ${warnings.length} warning(s)\n` +
                errors.map((e) => '  ERROR ' + e).join('\n') + (errors.length ? '\n' : '') + warnings.map((w) => '  warn  ' + w).join('\n');
            if (logToConsole) (errors.length ? console.error : console.log)(report);
            return { errors, warnings, report };
        },

        _dialogue(err, warn) {
            const SD = BO.OWRPGStatsData, QD = BO.OWRPGQuestsData.QUESTS, VD = BO.OWRPGFactionsData.VENDORS;
            for (const [npc, t] of Object.entries(BO.OWRPGDialogueData.TREES)) {
                const reached = new Set();
                for (const [id, n] of Object.entries(t.nodes)) {
                    if (!n.choices || !n.choices.length) err(`${npc}.${id}: node has no choices (dead end)`);
                    for (const ch of n.choices || []) {
                        if (ch.next && ch.next !== 'END' && !t.nodes[ch.next]) err(`${npc}.${id}: next '${ch.next}' missing`);
                        if (ch.next) reached.add(ch.next);
                        const r = ch.req || {}, fx = ch.fx || {};
                        for (const it of [r.item, r.notItem, fx.grantItem, fx.takeItem]) if (it && !SD.ITEMS[it]) err(`${npc}.${id}: unknown item '${it}'`);
                        for (const q of [fx.startQuest, fx.stage && fx.stage[0], fx.complete && fx.complete[0], r.quest && r.quest[0], r.stage && r.stage[0]]) if (q && !QD[q]) err(`${npc}.${id}: unknown quest '${q}'`);
                        if (fx.stage && QD[fx.stage[0]] && !QD[fx.stage[0]].stages[fx.stage[1]]) err(`${npc}.${id}: unknown stage '${fx.stage[1]}'`);
                        if (r.stage && QD[r.stage[0]] && !QD[r.stage[0]].stages[r.stage[1]]) err(`${npc}.${id}: unknown req stage '${r.stage[1]}'`);
                        if (fx.complete && QD[fx.complete[0]] && !QD[fx.complete[0]].branches[fx.complete[1]]) err(`${npc}.${id}: unknown branch '${fx.complete[1]}'`);
                        if (fx.vendor && !VD[fx.vendor]) err(`${npc}.${id}: unknown vendor '${fx.vendor}'`);
                        if (r.attr && !SD.ATTR_IDS.includes(r.attr[0])) err(`${npc}.${id}: unknown attribute '${r.attr[0]}'`);
                    }
                    if (n.choices && n.choices.every((c) => c.req && !c.req.quest && !c.req.flag && !c.req.stage && !c.req.notFlag)) warn(`${npc}.${id}: every choice is gated — player can get stuck`);
                }
                for (const id of Object.keys(t.nodes)) if (!reached.has(id) && !ENTRY_NODES.includes(id) && !(t.entry && t.entry.toString().includes(id))) warn(`${npc}.${id}: node not reachable from any choice (entry-only?)`);
            }
        },

        /** Hidden sites: every type placed, every counter quest reachable, every reference valid. */
        _discoveries(err, warn) {
            const Disc = BO.OWRPGDiscoveries, DD = BO.OWRPGDiscoveryData;
            if (!Disc || !DD) return;
            const sites = Disc.generate(884120);
            const per = {};
            for (const site of sites) {
                per[site.type] = (per[site.type] || 0) + 1;
                if (site.type === 'tome' && !DD.LORE.some((l) => l.id === site.lore)) err(`site ${site.id}: unknown lore '${site.lore}'`);
                if (site.type === 'shrine' && !DD.BLESSINGS.some((b) => b.id === site.blessing)) err(`site ${site.id}: unknown blessing '${site.blessing}'`);
                if (site.type === 'shard' && !BO.OWRPGStatsData.SKILLS[site.skill]) err(`site ${site.id}: unknown skill '${site.skill}'`);
            }
            const expected = BO.OWRPGWorldData.REGIONS.length;
            for (const [type, n] of Object.entries(DD.PER_REGION)) if ((per[type] || 0) < n * expected * 0.9) warn(`discoveries: only ${per[type] || 0} ${type} sites placed (want ${n * expected})`);
            for (const [id, q] of Object.entries(BO.OWRPGQuestsData.QUESTS)) {
                for (const st of Object.values(q.stages)) for (const k of Object.keys(st.on || {})) {
                    const m = k.match(/^count:found_([a-z]+):(\d+)$/);
                    if (m && Number(m[2]) > (per[m[1]] || 0)) err(`${id}: needs ${m[2]} ${m[1]} sites but only ${per[m[1]] || 0} exist`);
                }
            }
            for (const b of DD.BLESSINGS) for (const k of Object.keys(b.fx)) if (typeof b.fx[k] !== 'number') err(`blessing ${b.id}: fx '${k}' is not numeric`);
        },

        _quests(err) {
            const SD = BO.OWRPGStatsData, D = BO.OWRPGWorldData;
            for (const [id, q] of Object.entries(BO.OWRPGQuestsData.QUESTS)) {
                if (q.giver && !BO.OWRPGDialogueData.TREES[q.giver]) err(`${id}: giver '${q.giver}' has no dialogue`);
                for (const [sid, st] of Object.entries(q.stages)) {
                    if (st.marker && !D.POIS.some((p) => p.id === st.marker)) err(`${id}.${sid}: marker '${st.marker}' is not a POI`);
                    for (const [k, next] of Object.entries(st.on || {})) {
                        if (!q.stages[next]) err(`${id}.${sid}: event '${k}' -> missing stage '${next}'`);
                        const [type, a] = k.split(':');
                        if (type === 'item' && !SD.ITEMS[a]) err(`${id}.${sid}: unknown item '${a}'`);
                        if (type === 'kill' && !SD.ENEMIES[a]) err(`${id}.${sid}: unknown enemy '${a}'`);
                        if (type === 'discover' && !D.POIS.some((p) => p.id === a)) err(`${id}.${sid}: unknown POI '${a}'`);
                    }
                    if (st.autoComplete && !q.branches[st.autoComplete]) err(`${id}.${sid}: autoComplete branch missing`);
                }
                for (const [bid, b] of Object.entries(q.branches)) {
                    for (const it of b.items || []) if (!SD.ITEMS[it]) err(`${id}.${bid}: unknown reward item '${it}'`);
                    if (b.pylon && !D.PYLONS.some((p) => p.id === b.pylon)) err(`${id}.${bid}: unknown pylon '${b.pylon}'`);
                    for (const f of Object.keys(b.rep || {})) if (!BO.OWRPGFactionsData.FACTIONS[f]) err(`${id}.${bid}: unknown faction '${f}'`);
                }
            }
        },

        _world(err, warn) {
            const SD = BO.OWRPGStatsData, D = BO.OWRPGWorldData;
            for (const poi of D.POIS) for (const sp of poi.spawns || []) if (!SD.ENEMIES[sp[0]]) err(`POI ${poi.id}: unknown enemy '${sp[0]}'`);
            for (const [id, e] of Object.entries(SD.ENEMIES)) {
                if (e.loot && !SD.LOOT[e.loot]) err(`enemy ${id}: unknown loot table '${e.loot}'`);
                if (e.kind === 'bot' && BO.WeaponsData.get(e.weapon).id !== e.weapon) err(`enemy ${id}: unknown weapon '${e.weapon}'`);
                if (e.kind === 'beast' && !BO.ZombiesData.get(e.body)) err(`enemy ${id}: unknown body '${e.body}'`);
            }
            for (const [t, rows] of Object.entries(SD.LOOT)) for (const r of rows) if (r[0] !== 'credits' && !SD.ITEMS[r[0]]) err(`loot ${t}: unknown item '${r[0]}'`);
            for (const [id, it] of Object.entries(SD.ITEMS)) if (it.type === 'weapon' && BO.WeaponsData.get(it.base).id !== it.base) err(`item ${id}: unknown base weapon '${it.base}'`);
            for (const n of D.NPCS) {
                if (!BO.OWRPGDialogueData.TREES[n.dialogue]) err(`NPC ${n.id}: no dialogue tree '${n.dialogue}'`);
                if (n.vendor && !BO.OWRPGFactionsData.VENDORS[n.vendor]) err(`NPC ${n.id}: unknown vendor`);
            }
            for (const v of Object.values(BO.OWRPGFactionsData.VENDORS)) for (const it of v.stock) if (!SD.ITEMS[it]) err(`vendor ${v.name}: unknown item '${it}'`);
            for (const i of D.INTERACTS) {
                if (i.loot && !SD.LOOT[i.loot]) err(`interact ${i.id}: unknown loot '${i.loot}'`);
                for (const g of [i.grant, i.grant2]) if (g && !SD.ITEMS[g]) err(`interact ${i.id}: unknown grant '${g}'`);
            }
            const ids = new Set();
            for (const list of [D.POIS, D.NPCS, D.INTERACTS, D.PYLONS]) for (const o of list) { if (ids.has(o.id)) err(`duplicate id '${o.id}'`); ids.add(o.id); }
            if (D.POIS.filter((p) => !p.interior).length < 12) warn('fewer than 12 surface POIs');
        },

        _expansion(err) {
            const SD = BO.OWRPGStatsData;
            const GS = BO.OWRPGGunStats;
            const EX = BO.OWRPGExpansionData;
            if (!GS) { err('OWRPGGunStats missing'); return; }
            for (const wid of BO.WeaponsData.ORDER) {
                if (!GS[wid]) err(`OWRPGGunStats missing weapon '${wid}'`);
            }
            if (!EX) { err('OWRPGExpansionData missing'); return; }
            for (const b of EX.BOUNTIES || []) {
                if (!SD.ENEMIES[b.target]) err(`bounty ${b.id}: unknown enemy '${b.target}'`);
            }
            for (const cx of EX.CODEX_MILESTONES || []) {
                for (const it of cx.reward?.items || []) if (!SD.ITEMS[it]) err(`codex ${cx.id}: unknown reward item '${it}'`);
            }
        },

        _ttk(err, warn) {
            const SD = BO.OWRPGStatsData;
            const carbine = BO.WeaponsData.get('m16a4');
            for (const [id, e] of Object.entries(SD.ENEMIES)) {
                const gear = 1 + 0.05 * (e.lvl - 1);
                const dps = carbine.damage * gear * (Math.min(carbine.rpm, 450) / 60) * 0.5;
                const ehp = e.hp * (100 + e.armor) / 100;
                const ttk = ehp / dps;
                const band = e.boss ? [18, 55] : [0.8, 4.5];
                if (e.boss && ttk < band[0]) warn(`boss ${id}: TTK ${ttk.toFixed(1)} s is below ${band[0]} s`);
                else if (!e.boss && (ttk < band[0] || ttk > band[1])) warn(`enemy ${id}: TTK ${ttk.toFixed(1)} s outside ${band[0]}–${band[1]} s`);
            }
        },

        _spatial(err, warn) {
            const W = BO.World, D = BO.OWRPGWorldData;
            const check = (label, x, z, interior) => {
                if (interior) return;
                const h = W.terrainHeight(x, z);
                if (h < D.WATER - 0.2) warn(`${label} is under water (h=${h.toFixed(1)})`);
                if (x < D.BOUNDS.minX || x > D.BOUNDS.maxX || z < D.BOUNDS.minZ || z > D.BOUNDS.maxZ) err(`${label} is outside the map`);
            };
            for (const p of D.POIS) check('POI ' + p.id, p.x, p.z, p.interior);
            for (const n of D.NPCS) check('NPC ' + n.id, n.x, n.z, false);
            for (const p of D.PYLONS) check('pylon ' + p.id, p.x, p.z, false);
            for (const i of D.INTERACTS) check('interact ' + i.id, i.x, i.z, i.int);
            for (const poi of D.POIS) for (const sp of poi.spawns || []) {
                const x = poi.x + sp[1], z = poi.z + sp[2];
                if (poi.interior || sp[3] != null) continue;
                const y = W.terrainHeight(x, z);
                if (!W.hasHeadroom(x, y, z, 0.3, 1.7)) {
                    warn(`spawn ${poi.id}/${sp[0]} at (${x.toFixed(0)},${z.toFixed(0)}) overlaps geometry`);
                }
            }
        }
    };

    BO.OWRPGValidator = V;
})(window.BO);
;

/* --- src/modes/OWRPGMode.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG Mode ("Operation Meridian")
   Mode lifecycle and the glue between engine and OWRPG systems:
   - start/stop/suspend, character slots, quick-save (F5) / quick-load (F9),
     rolling checkpoints on discovery, interior transitions and quest stages
   - per-frame physics/combat, 10 Hz perception + statuses, 1 Hz world sim
   - player hooks: speed (encumbrance/holster), incoming damage (armor),
     cheat-death perk, out-of-combat regeneration (to 60%)
   Systems live in src/owrpg/*, data in src/data/OWRPG*.js, UI in OWRPGUI.js.
============================================================================ */
(function (BO) {
    'use strict';

    const UP = new THREE.Vector3(0, 1, 0);
    const SEC_FIXED = 0.1;

    const Mode = {
        active: false,
        state: null,
        slot: 0,
        camera: null,
        acc10: 0,
        acc1: 0,
        camoT: 0,
        holstered: false,
        combatT: 0,
        cheatCd: 0,
        pendingVendor: null,
        lastMag: null,
        prompt: null,
        lastSaveLabel: '',

        /* ================================================== lifecycle */
        /** opts: { slot, newChar?: { name, attrs, difficulty }, camera } */
        /* ================================================== pluggable world systems
           Modules such as Cartography, Discoveries and Champions register here and get
           start/stop/update/tick1/handleKey/nearest/interact hooks without new wiring. */
        systems: [],

        registerSystem(sys) { if (sys && !this.systems.includes(sys)) this.systems.push(sys); },

        _sys(hook, a, b, c) {
            for (const sys of this.systems) {
                if (typeof sys[hook] !== 'function') continue;
                try { sys[hook](a, b, c); } catch (e) { console.error('[OWRPG] ' + (sys.id || 'system') + '.' + hook, e); }
            }
        },

        start(opts) {
            this.camera = opts.camera;
            this.slot = opts.slot || 0;
            const Save = BO.OWRPGSave;
            let s = opts.newChar ? null : Save.read(this.slot);
            const fresh = !s;
            if (fresh) s = Save.defaultSlot(Object.assign({ index: this.slot }, opts.newChar || {}));
            this.state = s;
            this.active = true;
            this.acc10 = this.acc1 = 0;
            this.camoT = 0; this.holstered = false; this.combatT = 0; this.cheatCd = 0; this.chillT = 0;
            this.lastMag = null;
            if (fresh) {
                this._starterKit(s);
                const pr = opts.newChar && opts.newChar.primer;
                if (pr && BO.OWRPGStatsData.ABILITIES.primer[pr]) s.player.abilities.primer = pr;
            }

            if (BO.Combat) BO.Combat.reset(this.camera);
            BO.OWRPGCombat.reset();
            BO.OWRPGMounts?.reset();
            BO.OWRPGEvents?.reset();
            BO.OWRPGAI.clear();
            const scene = BO.World.build('meridian');
            BO.OWRPGWorldSim.init(scene);
            BO.OWRPGInteriors.build(scene);
            this._sys('start', s, scene);
            this._milestoneNotified = new Set();
            // Auto-grant level-based mounts if eligible on load
            if (s.player.level >= 6) BO.OWRPGMounts?.unlock(s, 'hoverbike');
            if (s.player.level >= 15) BO.OWRPGMounts?.unlock(s, 'war_strider');

            const p = s.player;
            const inside = p.interiorId || BO.OWRPGWorldData.isInterior(p.pos[0], p.pos[2]);
            const y = inside ? 0.1 : BO.World.terrainHeight(p.pos[0], p.pos[2]) + 0.2;
            BO.Player.initForMatch('owrpg', { x: p.pos[0], y: p.pos[1] != null ? Math.max(p.pos[1], y) : y, z: p.pos[2], yaw: p.yaw }, this._loadoutCfg(), false);
            BO.Player.lethalCount = 0;
            BO.Player.tacticalCount = 0;
            this.refreshLoadout(true);
            this.applyDerived();
            BO.Player.hp = p.hp ? Math.min(p.hp, BO.Player.maxHp) : BO.Player.maxHp;

            BO.Combat.onHitEnemy = (ent, dmg, hitbox, dist, w) => BO.OWRPGCombat.onGunHit(ent, dmg, hitbox, dist, w);
            BO.Combat.onExplodeAt = (pos, radius, damage) => {
                for (const a of BO.OWRPGAI.agentsNear(pos, radius, false)) BO.OWRPGCombat.damage(a, damage * 0.6, { source: 'ability' });
            };
            BO.Combat.onActivateKillstreak = null;
            BO.Sound.startMusic('owrpg');
            BO.Assets?.playAmbient?.('overhaul/env/ambient_wind.wav', { volume: 0.11, fadeIn: 1.2 });
            BO.OWRPGUI.showHud();
            if (fresh) {
                BO.Events.emit('hud:banner', { title: 'OPERATION MERIDIAN', sub: 'Freestead Town, Haven Basin — find Warden Kessler in the brick HQ', color: '#f5a623' });
                this.save(this.slot, 'New character');
            } else {
                BO.Events.emit('hud:banner', { title: 'THE MERIDIAN EXPANSE', sub: `${p.name} · Level ${p.level}`, color: '#f5a623' });
            }
            if (BO.OWRPGValidator && BO.Settings.get('owrpgDev')) BO.OWRPGValidator.runAll(true);
            return scene;
        },

        _starterKit(s) {
            const I = BO.OWRPGInventory;
            const prim = I.add(s, 'w_carbine', 1);
            const sec = I.add(s, 'w_pistol', 1);
            const rig = I.add(s, 'rig_light', 1);
            I.add(s, 'medkit', 2);
            I.add(s, 'ammo_box', 2);
            I.add(s, 'tool_field_repair', 1);
            Object.assign(s.player.equipped, { primary: prim.uid, secondary: sec.uid, rig: rig.uid });
        },

        stop() {
            if (!this.active) return;
            this.active = false;
            this._sys('stop');
            BO.OWRPGMounts?.reset();
            BO.OWRPGEvents?.clear();
            BO.OWRPGAI.clear();
            BO.OWRPGInteriors.clear();
            BO.OWRPGCombat.reset();
            BO.OWRPGUI.hideAll();
            if (BO.Combat) { BO.Combat.onHitEnemy = null; BO.Combat.onExplodeAt = null; BO.Combat.setTargetPool([]); }
            BO.Sound.stopMusic();
        },

        /** Called on exit-to-menu: autosave (unless dead) then stop. */
        suspend() {
            if (this.active && BO.Player.alive) this.save(this.slot, 'Exit');
            this.stop();
        },

        /* ================================================== saving */
        _snapshot() {
            const s = this.state;
            const P = BO.Player;
            s.player.pos = [+P.pos.x.toFixed(2), +P.pos.y.toFixed(2), +P.pos.z.toFixed(2)];
            s.player.yaw = +P.yaw.toFixed(3);
            s.player.hp = Math.round(P.hp);
            return s;
        },

        canSave() {
            const P = BO.Player;
            if (!this.active || !P.alive) return 'You are dead.';
            if (BO.OWRPGAI.anyHostileInCombat()) return 'Cannot save during combat.';
            if (!P.onGround || P.sliding) return 'Cannot save while airborne.';
            return '';
        },

        save(slot = this.slot, label = 'Save') {
            BO.OWRPGSave.write(slot, this._snapshot());
            this.lastSaveLabel = label;
        },

        quickSave() {
            const why = this.canSave();
            if (why) { this.toast(why, '#f97316'); return false; }
            this.save(this.slot, 'Quick save');
            this.toast('Game saved', '#a3e635');
            return true;
        },

        quickLoad() {
            const s = BO.OWRPGSave.read(this.slot);
            if (!s) { this.toast('No save in this slot', '#f97316'); return; }
            const cam = this.camera;
            this.stop();
            BO.State.activeMode = 'owrpg';
            this.start({ slot: this.slot, camera: cam });
            this.toast('Loaded', '#a3e635');
        },

        /** Rolling checkpoint: silent autosave when it's safe. */
        checkpoint(label) {
            if (this.canSave()) return;
            this.save(this.slot, label);
        },

        /* ================================================== loadout & stats */
        _weaponCfg(entry) {
            const d = BO.OWRPGStatsData.ITEMS[entry.id];
            const spec = BO.WeaponsData.get(d.base);
            const camo = { common: 'default', rare: 'carbon', epic: 'dark_matter', legendary: 'gold' }[entry.rarity] || 'default';
            return { id: d.base, camo, attachments: { optic: spec.modelSpec && spec.modelSpec.defaultScope ? 'sniper_scope' : 'iron', muzzle: d.suppressed ? 'suppressor' : 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' } };
        },

        _loadoutCfg() {
            const I = BO.OWRPGInventory;
            const prim = I.equippedEntry(this.state, 'primary') || I.equippedEntry(this.state, 'secondary');
            const sec = I.equippedEntry(this.state, 'secondary');
            return {
                primary: prim ? this._weaponCfg(prim) : { id: 'm1911', camo: 'default', attachments: { optic: 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' } },
                secondary: sec && prim !== sec ? this._weaponCfg(sec) : null,
                perks: [], lethal: 'frag', tactical: 'flashbang', fieldUpgrade: 'munitions_box', ultimatePower: 'gravity_spikes'
            };
        },

        /** Rebuild the player's weapons from equipped items (keeps ammo where possible). */
        refreshLoadout(initial = false) {
            const P = BO.Player;
            const I = BO.OWRPGInventory;
            const s = this.state;
            const d = BO.OWRPGCharacter.derived(s);
            const entries = [I.equippedEntry(s, 'primary'), I.equippedEntry(s, 'secondary')].filter(Boolean);
            const old = P.weapons || [];
            this.weaponEntries = entries;
            P.weapons = entries.map((e, i) => {
                const w = P._createWeaponInstance(this._weaponCfg(e), 0);
                w.stats.adsTime /= d.adsMult;
                w.stats.hipSpread *= d.spreadMult;
                w.stats.adsSpread *= d.spreadMult;
                w.reserve = initial ? Math.round(w.stats.reserveMax * 0.6) : (old[i] && old[i].cfg.id === w.cfg.id ? old[i].reserve : Math.round(w.stats.reserveMax * 0.4));
                if (!initial && old[i] && old[i].cfg.id === w.cfg.id) w.mag = old[i].mag;
                return w;
            });
            if (!P.weapons.length) P.weapons = [P._createWeaponInstance(this._loadoutCfg().primary, 0)];
            P.activeSlot = Math.min(P.activeSlot || 0, P.weapons.length - 1);
            P.reloading = false;
            P.rebuildViewmodel();
            this.lastMag = null;
        },

        activeWeaponEntry() { return this.weaponEntries ? this.weaponEntries[BO.Player.activeSlot] || null : null; },

        applyDerived() {
            const P = BO.Player;
            const d = BO.OWRPGCharacter.derived(this.state);
            const frac = P.maxHp > 0 ? P.hp / P.maxHp : 1;
            P.maxHp = d.maxHp;
            P.hp = Math.max(1, Math.min(P.maxHp, Math.round(P.maxHp * frac)));
            P.armor = 0; P.maxArmor = 0; P.armorReservePlates = 0;
            P.selfRevives = 0;
        },

        /* ================================================== player hooks */
        speedMult() {
            if (!this.active) return 1;
            const d = BO.OWRPGCharacter.derived(this.state);
            const enc = BO.OWRPGCharacter.encumbrance(this.state);
            const mountSpd = BO.OWRPGMounts?.mounted ? BO.OWRPGMounts.speedMult() : 1;
            const odMult = BO.OWRPGCombat.overdriveT > 0 ? 1.35 : 1;
            const chill = this.chillT > 0 ? 0.75 : 1;   // Frozen Champion hits
            return enc.speed * (d.gearSpeedMult || 1) * (this.holstered && BO.Player.sprinting ? 1.12 : 1) * (this.stimT > 0 ? 1.25 : 1) * mountSpd * odMult * chill;
        },

        modifyIncomingDamage(amount, attackerPos, attackerEntity) {
            return BO.OWRPGCombat.modifyIncoming(amount, attackerPos, attackerEntity) * (this.stimT > 0 ? 0.8 : 1);
        },

        onPlayerHurt() { this.combatT = 6; },

        tryPreventDeath(P) {
            const fx = BO.OWRPGCharacter.perkFx(this.state);
            if (fx.cheatDeath && this.cheatCd <= 0) {
                this.cheatCd = fx.cheatDeath;
                P.hp = 1;
                P.invulnTimer = 1.5;
                this.toast('UNSTOPPABLE — still standing!', '#f97316');
                return true;
            }
            return false;
        },

        /* ================================================== rewards & state */
        toast(text, color = '#e2e8f0') { BO.Events.emit('hud:toast', { text, color }); },

        giveXp(amount, label, quiet) {
            const s = this.state;
            const levels = BO.OWRPGCharacter.addXp(s, amount);
            if (!quiet || label) BO.OWRPGUI.xpPop(Math.round(amount * (1 + (BO.OWRPGCharacter.perkFx(s).xpMult || 0))), label);
            if (levels > 0) {
                this.applyDerived();
                BO.Player.hp = BO.Player.maxHp;
                BO.Sound.playPerkBuy();
                BO.Sound.playQuestFanfare?.();
                BO.Juice?.screenFlash?.('#fbbf24', 0.16, 360);
                BO.Events.emit('hud:banner', { title: `LEVEL ${s.player.level}`, sub: `${s.player.perkPoints ? s.player.perkPoints + ' perk point(s) · ' : ''}${s.player.attrPoints ? s.player.attrPoints + ' attribute point(s) · ' : ''}Open the Pip-Pad [Tab]`, color: '#fbbf24' });
            }
        },

        changeRep(f, v) {
            const delta = BO.OWRPGFactions.add(this.state, f, v);
            if (delta) this.toast(`${BO.OWRPGFactionsData.FACTIONS[f].short} ${delta > 0 ? '+' : ''}${delta}`, BO.OWRPGFactionsData.FACTIONS[f].color);
            BO.OWRPGAI.refreshHostility();
        },

        setFlag(id, val) {
            const s = this.state;
            if (s.worldFlags[id] === val) return;
            s.worldFlags[id] = val;
            if (val) BO.OWRPGQuests.onEvent(s, 'flag', id);
        },

        itemEvent(id) { BO.OWRPGQuests.onEvent(this.state, 'item', id); },

        reward(r, label) {
            const s = this.state;
            if (r.xp) this.giveXp(r.xp, 'Quest');
            if (r.credits) s.player.credits += r.credits;
            for (const it of r.items || []) BO.OWRPGInventory.add(s, it, 1);
            for (const [f, v] of Object.entries(r.rep || {})) this.changeRep(f, v);
            if (r.pylon) { s.pylons[r.pylon] = true; BO.OWRPGWorldArt.setPylonActive(BO.World, r.pylon, true); }
            BO.Sound.playQuestFanfare?.();
            BO.Juice?.screenFlash?.('#a3e635', 0.14, 320);
            BO.Events.emit('hud:banner', { title: 'QUEST COMPLETE', sub: `${label}${r.label ? ' — ' + r.label : ''}${r.credits ? ' · +' + r.credits + ' cr' : ''}`, color: '#a3e635' });
            this.checkpoint('Quest complete');
        },

        heal(n) { const P = BO.Player; P.hp = Math.min(P.maxHp, P.hp + n); },
        healFull() { BO.Player.hp = BO.Player.maxHp; this.toast('Fully healed', '#4ade80'); },

        dropLoot(pos, table, rolls) {
            if (!table) return;
            const loot = BO.OWRPGInventory.rollLoot(this.state, table, rolls + 1);
            BO.OWRPGInteriors.dropBag(pos, loot);
        },

        giveLootReport(loot, source) {
            const s = this.state;
            BO.OWRPGInventory.grantLoot(s, loot);
            for (const it of loot.items) this.itemEvent(it.id);
            BO.OWRPGUI.lootToast(loot, source);
        },

        smokeHint(x, z) {
            const y = BO.World.terrainHeight(x, z);
            for (let i = 0; i < 3; i++) BO.FX.spawnParticles(new THREE.Vector3(x, y + 2 + i * 2, z), 8, 0x6b7280, 1.2, -1.5, 2.5, 3);
        },

        /* ================================================== UI routes */
        openDialogue(npcId) { BO.OWRPGMounts?.dismount(true); BO.OWRPGUI.openDialogue(npcId); },
        openStash() { BO.OWRPGUI.openStash(); },
        openRespec() { BO.OWRPGUI.openPipPad('perks', true); },

        usePylon(py) {
            const s = this.state;
            if (!s.pylons[py.id]) {
                s.pylons[py.id] = true;
                BO.OWRPGWorldArt.setPylonActive(BO.World, py.id, true);
                this.giveXp(50, 'Pylon online');
                this.toast(`${py.name} is online. Jumps cost 1 Relay Cell.`, '#22d3ee');
                this.checkpoint('Pylon');
                return;
            }
            BO.OWRPGUI.openTravel(py.id);
        },

        travelTo(id) {
            const s = this.state;
            const py = BO.OWRPGWorldData.PYLONS.find((p) => p.id === id);
            if (!py || !s.pylons[id]) return 'That pylon is offline.';
            if (BO.OWRPGAI.anyHostileInCombat()) return 'Cannot travel during combat.';
            if (s.player.relayCells < 1) return 'You need a Relay Cell.';
            s.player.relayCells--;
            BO.OWRPGMounts?.dismount(true);
            const P = BO.Player;
            P.pos.set(py.x + 2.5, BO.World.terrainHeight(py.x + 2.5, py.z + 2.5) + 0.3, py.z + 2.5);
            P.vel.set(0, 0, 0);
            BO.OWRPGAI.clear();
            BO.OWRPGWorldSim.poiAgents = {};
            BO.FX.spawnParticles(P.pos.clone().addScaledVector(UP, 1), 30, 0x22d3ee, 5, 2, 0.6, 1.4);
            this.toast(`Arrived at ${py.name}`, '#22d3ee');
            this.checkpoint('Fast travel');
            return '';
        },

        useConsumable(uid) {
            const s = this.state;
            const I = BO.OWRPGInventory;
            const e = I.byUid(s, uid);
            if (!e) return;
            const d = I.def(e.id);
            if (!d.heal && !d.ammo && !d.stim && !d.xpBoost) return;
            if (d.heal) {
                const fx = BO.OWRPGCharacter.perkFx(s);
                BO.OWRPGCombat.heal = { left: d.heal * (1 + (fx.medMult || 0)), rate: d.heal / 1.5 };
            }
            if (d.ammo) {
                for (const w of BO.Player.weapons) if (w.stats.kind !== 'melee') w.reserve = w.stats.reserveMax;
                this.toast('Ammunition restocked', '#fbbf24');
            }
            if (d.stim) {
                this.stimT = d.stim;
                this.toast('Stim: +25% speed, damage resistance', '#f472b6');
            }
            if (d.xpBoost) {
                s.worldFlags.xpBoostUntil = Math.max(s.worldFlags.xpBoostUntil || 0, s.playtimeSec) + d.xpBoost;
                this.toast('Wisdom draught · +30% XP for 3 minutes', '#c084fc');
            }
            I.remove(s, e.id, 1);
        },

        quickMed() {
            const s = this.state;
            const e = s.player.inventory.find((x) => x.id === 'medkit');
            if (!e) { this.toast('No Med-Injectors', '#f97316'); return; }
            if (BO.Player.hp >= BO.Player.maxHp) { this.toast('Already at full health', '#94a3b8'); return; }
            this.useConsumable(e.uid);
        },

        useEquippedToolOrRepair() {
            const s = this.state;
            const Dur = BO.OWRPGDurability;
            if (!s || !Dur) return;
            const eqTool = s.player.equipped.tool;
            if (eqTool) {
                const err = Dur.useTool(s, eqTool);
                if (err) this.toast(err, '#f97316');
                return;
            }
            const kit = s.player.inventory.find((x) => (x.id === 'tool_field_repair' || x.id === 'tool_nano_patch') && (x.dur == null || x.dur > 0));
            if (kit) {
                const err = Dur.useTool(s, kit.uid);
                if (err) this.toast(err, '#f97316');
                return;
            }
            const err = Dur.repairAllEquipped(s);
            this.toast(err || 'Repaired all equipped gear!', err ? '#f97316' : '#4ade80');
        },

        /* ================================================== input */
        interact() {
            if (!this.active || !BO.Player.alive || BO.OWRPGUI.deathOpen) return;
            const t = BO.OWRPGInteriors.nearest() || this._systemPrompt();
            if (!t) return;
            if (t.type === 'system') t.sys.interact(t);
            else BO.OWRPGInteriors.interact(t);
        },

        /** Mode keys (rebindable via Settings). Returns true when consumed. */
        handleKey(code, kb, e) {
            if (!this.active) return false;
            if (!BO.Player.alive || BO.OWRPGUI.deathOpen) return code !== 'Escape';
            if (code === kb.owAbility1) { BO.OWRPGCombat.cast('primer'); return true; }
            if (code === kb.owAbility2) { BO.OWRPGCombat.cast('detonator'); return true; }
            if (code === kb.owGadget) { BO.OWRPGCombat.cast('gadget'); return true; }
            if (code === kb.owUltimate) { BO.OWRPGCombat.cast('ultimate'); return true; }
            if (code === kb.owMed) { this.quickMed(); return true; }
            if (code === kb.owMount) { BO.OWRPGMounts?.toggle(); return true; }
            if (code === kb.owRepair) { this.useEquippedToolOrRepair(); return true; }
            if (code === kb.owCharacter || code === 'Tab') { e && e.preventDefault(); BO.OWRPGUI.openPipPad('character'); return true; }
            if (code === kb.owQuestLog) { BO.OWRPGUI.openPipPad('quests'); return true; }
            if (code === kb.owMap) { BO.OWRPGUI.openPipPad('map'); return true; }
            if (code === kb.owQuickSave) { e && e.preventDefault(); this.quickSave(); return true; }
            if (code === kb.owQuickLoad) { e && e.preventDefault(); this.quickLoad(); return true; }
            if (code === kb.owHolster) { this.holstered = !this.holstered; this.toast(this.holstered ? 'Weapon holstered (+12% sprint)' : 'Weapon drawn', '#94a3b8'); return true; }
            if (code === kb.owDodge) {
                if (!BO.OWRPGCharacter.encumbrance(this.state).dodge) { this.toast('Overburdened — cannot dodge', '#f97316'); return true; }
                if (BO.Player.tryDodgeRoll) BO.Player.tryDodgeRoll();
                const fx = BO.OWRPGCharacter.perkFx(this.state);
                if (fx.dodgeCamo) this.camoT = Math.max(this.camoT, fx.dodgeCamo);
                return true;
            }
            if (code === 'F8') { BO.OWRPGUI.toggleDev(); return true; }
            for (const sys of this.systems) if (typeof sys.handleKey === 'function' && sys.handleKey(code, kb, e)) return true;
            return false;
        },

        /** Shared bindings that do nothing here (grenades, streaks, shops, plates). */
        isSuppressed(code, kb) {
            const mine = [kb.owAbility1, kb.owAbility2, kb.owGadget, kb.owUltimate, kb.owMount, kb.owRepair, kb.owMed, kb.owHolster, kb.owDodge, kb.owQuestLog, kb.owMap, kb.owMinimapZoom];
            if (mine.includes(code)) return false;
            return [kb.lethal, kb.tactical, kb.special, kb.ultimate, 'KeyZ', kb.armory, kb.armor, kb.exfil, 'Digit3', 'Digit5', 'Digit6', 'Digit7'].includes(code);
        },

        /* ================================================== frame */
        update(dt) {
            if (!this.active || !this.state) return;
            const s = this.state;
            const P = BO.Player;
            if (!P.alive) { if (!BO.OWRPGUI.deathOpen) { BO.OWRPGMounts?.dismount(true); s.stats.deaths++; BO.OWRPGUI.showDeath(); } return; }
            s.playtimeSec += dt;
            if (this.camoT > 0) this.camoT -= dt;
            if (this.cheatCd > 0) this.cheatCd -= dt;
            if (this.combatT > 0) this.combatT -= dt;
            if (this.stimT > 0) this.stimT -= dt;
            if (this.chillT > 0) this.chillT -= dt;
            if (BO.OWRPGAI.anyHostileInCombat()) this.combatT = Math.max(this.combatT, 2);
            const desiredMusic = this.combatT > 0 ? 'owrpg_combat' : 'owrpg';
            if (BO.Sound.musicMode !== desiredMusic) BO.Sound.startMusic(desiredMusic);

            BO.OWRPGCombat.update(dt);
            BO.OWRPGMounts?.update(dt);
            if (BO.OWRPGEvents?.activeEvent?.beacon) BO.OWRPGEvents.activeEvent.beacon.rotation.y += dt * 1.8;
            BO.OWRPGAI.update(dt);
            BO.OWRPGWorldSim.update(dt);
            BO.OWRPGInteriors.update(dt);
            BO.OWRPGWorldArt.animate(BO.World, s.worldClock, dt);
            this._sys('update', dt);

            // Gunfire noise & slight shot wear: unsuppressed shots carry 55 m, suppressed 9 m.
            const w = P.weapons[P.activeSlot];
            if (w) {
                if (this.lastMag !== null && w.mag < this.lastMag && this.lastSlot === P.activeSlot) {
                    BO.OWRPGAI.noise(P.pos, w.stats.suppressed ? 9 : 55);
                    BO.OWRPGDurability?.degrade(s, this.activeWeaponEntry(), 0.08);
                }
                this.lastMag = w.mag;
                this.lastSlot = P.activeSlot;
            }

            this.acc10 += dt;
            while (this.acc10 >= SEC_FIXED) { this.acc10 -= SEC_FIXED; BO.OWRPGAI.tick10(SEC_FIXED); }
            this.acc1 += dt;
            if (this.acc1 >= 1) {
                this.acc1 -= 1;
                BO.OWRPGWorldSim.tick1(1);
                this._sys('tick1');
                if (this.combatT <= 0 && P.hp < P.maxHp * 0.6) P.hp = Math.min(P.maxHp * 0.6, P.hp + 2.5);
                if (this.pendingVendor) { const v = this.pendingVendor; this.pendingVendor = null; BO.OWRPGUI.openVendor(v); }
                if (BO.OWRPGExpansionData?.CODEX_MILESTONES && this._milestoneNotified) {
                    const claimed = s.player.codex?.unlocksClaimed || [];
                    for (const cx of BO.OWRPGExpansionData.CODEX_MILESTONES) {
                        if (!claimed.includes(cx.id) && !this._milestoneNotified.has(cx.id) && cx.check(s)) {
                            this._milestoneNotified.add(cx.id);
                            this.toast(`Codex Milestone Ready: ${cx.title} — claim in Pip-Pad [Tab]`, '#fbbf24');
                        }
                    }
                }
            }
            this.prompt = BO.OWRPGInteriors.nearest() || this._systemPrompt();
        },

        /** Closest interactable offered by a registered system ({ type: 'system', sys, obj, text }). */
        _systemPrompt() {
            let best = null;
            for (const sys of this.systems) {
                if (typeof sys.nearest !== 'function') continue;
                const t = sys.nearest();
                if (t && (!best || t.d < best.d)) best = Object.assign(t, { type: 'system', sys });
            }
            return best;
        }
    };

    BO.OWRPGMode = Mode;
})(window.BO);
;

/* --- src/owrpg/OWRPGCartography.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Cartography
   Fog-of-war exploration, the HUD minimap, the hill-shaded world-map base
   layer and the Atlas (completion per region).

   - The Expanse is split into a 64 × 64 grid (20 m cells). Cells within the
     reveal radius of the player are charted and stored as a base64 bitset in
     s.atlas.explored, so a fully explored map costs 684 bytes of save data.
   - Charting a cell grants Pathfinding mastery XP; every whole percent of the
     map updates the numeric world flag `explored_pct` that quests count on.
   - The base map (hill-shading + contours + roads) is rendered once per
     session into an off-screen canvas shared by the minimap and Pip-Pad map.
============================================================================ */
(function (BO) {
    'use strict';

    const GRID = 64;
    const BASE_RES = 256;               // terrain samples per side for the shaded base map
    const BASE_PX = 768;                // off-screen base map size
    const REVEAL_R = 70;                // metres
    const MM_PX = 200;                  // minimap canvas size (CSS px)
    const ZOOMS = [95, 150, 230];       // minimap radius in metres
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const D = () => BO.OWRPGWorldData;

    const Carto = {
        id: 'cartography',
        GRID,
        bits: null,
        explored: 0,
        cellRegion: null,
        regionCells: {},
        regionExplored: {},
        base: null,
        fog: null,
        fogCtx: null,
        fogImg: null,
        fogDirty: true,
        mm: null,
        mmT: 0,
        revealT: 0,
        lastPct: 0,

        get s() { return BO.OWRPGMode.state; },

        /* ------------------------------------------------ lifecycle */
        start(s) {
            this._decode(s.atlas.explored);
            this._indexRegions();
            this._buildBase();
            this._buildFog();
            this.lastPct = this.percent();
            this._ensureMinimap();
            this.revealT = 0;
            this.mmT = 0;
        },

        stop() {
            if (this.mm) this.mm.root.classList.add('hidden');
        },

        update(dt) {
            const s = this.s;
            if (!s) return;
            this.revealT -= dt;
            if (this.revealT <= 0) { this.revealT = 0.25; this._revealAroundPlayer(); }
            this.mmT -= dt;
            if (this.mmT <= 0) { this.mmT = 1 / 15; this._drawMinimap(); }
        },

        handleKey(code, kb) {
            if (code !== kb.owMinimapZoom) return false;
            const f = this.s.worldFlags;
            if (f.minimapEnabled === false) { f.minimapEnabled = true; f.minimapZoom = 0; }
            else f.minimapZoom = ((f.minimapZoom || 0) + 1) % ZOOMS.length;
            BO.OWRPGMode.toast('Minimap range ' + this.range() + ' m', '#fbbf24');
            this._drawMinimap();
            return true;
        },

        /* ------------------------------------------------ grid */
        cellOf(x, z) {
            const B = D().BOUNDS;
            const cx = Math.floor((x - B.minX) / (B.maxX - B.minX) * GRID);
            const cz = Math.floor((z - B.minZ) / (B.maxZ - B.minZ) * GRID);
            if (cx < 0 || cz < 0 || cx >= GRID || cz >= GRID) return -1;
            return cz * GRID + cx;
        },

        cellCenter(i) {
            const B = D().BOUNDS, w = (B.maxX - B.minX) / GRID;
            return { x: B.minX + (i % GRID + 0.5) * w, z: B.minZ + (Math.floor(i / GRID) + 0.5) * w };
        },

        isExplored(x, z) { const i = this.cellOf(x, z); return i >= 0 && this._get(i); },
        _get(i) { return (this.bits[i >> 3] >> (i & 7)) & 1; },

        percent() { return Math.floor((this.explored / (GRID * GRID)) * 100); },

        regionPercent(id) { const n = this.regionCells[id] || 1; return Math.round(((this.regionExplored[id] || 0) / n) * 100); },

        range() {
            const f = this.s.worldFlags;
            return ZOOMS[f.minimapZoom || 0] + (BO.OWRPGCharacter.perkFx(this.s).minimapRange || 0);
        },

        revealRadius() { return REVEAL_R * (1 + (BO.OWRPGCharacter.perkFx(this.s).revealRadius || 0)); },

        /** Chart every cell within `r` metres of (x, z). Returns the number of newly charted cells. */
        reveal(x, z, r, silent) {
            const B = D().BOUNDS, w = (B.maxX - B.minX) / GRID;
            const c0 = Math.max(0, Math.floor((x - r - B.minX) / w)), c1 = Math.min(GRID - 1, Math.floor((x + r - B.minX) / w));
            const r0 = Math.max(0, Math.floor((z - r - B.minZ) / w)), r1 = Math.min(GRID - 1, Math.floor((z + r - B.minZ) / w));
            let fresh = 0;
            for (let cz = r0; cz <= r1; cz++) for (let cx = c0; cx <= c1; cx++) {
                const i = cz * GRID + cx;
                if (this._get(i)) continue;
                const px = B.minX + (cx + 0.5) * w, pz = B.minZ + (cz + 0.5) * w;
                if ((px - x) * (px - x) + (pz - z) * (pz - z) > r * r) continue;
                this.bits[i >> 3] |= 1 << (i & 7);
                this.explored++;
                const reg = this.cellRegion[i];
                this.regionExplored[reg] = (this.regionExplored[reg] || 0) + 1;
                this._fogPixel(i);
                fresh++;
            }
            if (!fresh) return 0;
            const s = this.s;
            s.atlas.explored = this._encode();
            if (!silent) BO.OWRPGCharacter.addSkillXp(s, 'exploration', fresh * 6);
            const pct = this.percent();
            if (pct !== this.lastPct) {
                this.lastPct = pct;
                BO.OWRPGMode.setFlag('explored_pct', pct);
                if (pct > 0 && pct % 10 === 0 && !silent) {
                    BO.OWRPGMode.giveXp(60 + pct * 4, 'Charted ' + pct + '% of the Expanse');
                    BO.Events.emit('hud:toast', { text: 'Atlas: ' + pct + '% of the Meridian Expanse charted', color: '#fbbf24' });
                }
            }
            return fresh;
        },

        _revealAroundPlayer() {
            const P = BO.Player;
            if (!P || D().isInterior(P.pos.x, P.pos.z)) return;
            this.reveal(P.pos.x, P.pos.z, this.revealRadius());
        },

        _decode(str) {
            this.bits = new Uint8Array(GRID * GRID / 8);
            this.explored = 0;
            if (str) {
                try {
                    const bin = atob(str);
                    for (let i = 0; i < Math.min(bin.length, this.bits.length); i++) this.bits[i] = bin.charCodeAt(i);
                } catch (e) { console.warn('[Cartography] bad explored bitset, starting fresh', e); }
            }
            for (let i = 0; i < GRID * GRID; i++) if (this._get(i)) this.explored++;
        },

        _encode() {
            let bin = '';
            for (let i = 0; i < this.bits.length; i++) bin += String.fromCharCode(this.bits[i]);
            return btoa(bin);
        },

        _indexRegions() {
            this.cellRegion = new Array(GRID * GRID);
            this.regionCells = {};
            this.regionExplored = {};
            for (let i = 0; i < GRID * GRID; i++) {
                const c = this.cellCenter(i);
                const id = D().regionAt(c.x, c.z).id;
                this.cellRegion[i] = id;
                this.regionCells[id] = (this.regionCells[id] || 0) + 1;
                if (this._get(i)) this.regionExplored[id] = (this.regionExplored[id] || 0) + 1;
            }
        },

        /* ------------------------------------------------ base map */
        /** Hill-shaded, contoured terrain with roads, cached for the session. */
        _buildBase() {
            if (this.base && this.base._seed === BO.World.mapData.id) return;
            const Dd = D(), B = Dd.BOUNDS, span = B.maxX - B.minX, step = span / BASE_RES;
            const H = new Float32Array((BASE_RES + 1) * (BASE_RES + 1));
            for (let j = 0; j <= BASE_RES; j++) for (let i = 0; i <= BASE_RES; i++) H[j * (BASE_RES + 1) + i] = BO.World.terrainHeight(B.minX + i * step, B.minZ + j * step);
            const small = document.createElement('canvas');
            small.width = small.height = BASE_RES;
            const g = small.getContext('2d');
            const img = g.createImageData(BASE_RES, BASE_RES);
            const lx = -0.6, lz = -0.55, ly = 0.58;            // light from the north-west
            for (let j = 0; j < BASE_RES; j++) for (let i = 0; i < BASE_RES; i++) {
                const h = H[j * (BASE_RES + 1) + i];
                const hx = H[j * (BASE_RES + 1) + i + 1] - h, hz = H[(j + 1) * (BASE_RES + 1) + i] - h;
                const nx = -hx, nz = -hz, ny = step;
                const nl = Math.hypot(nx, ny, nz);
                const shade = Math.max(0.35, Math.min(1.25, 0.55 + 0.75 * ((nx * lx + ny * ly + nz * lz) / nl)));
                const x = B.minX + (i + 0.5) * step, z = B.minZ + (j + 0.5) * step;
                const reg = Dd.regionAt(x, z);
                const wet = (h < Dd.WATER && Dd.isWet(x, z)) || (h < -11.6 && Math.hypot(x + 180, z + 60) < 22) || (h < -6.4 && Math.hypot(x - 180, z + 190) < 20);
                let r, gg, b;
                if (wet) { const d = Math.max(0, Math.min(1, (Dd.WATER - h) / 6)); r = 30 - d * 14; gg = 70 - d * 22; b = 82 - d * 10; }
                else {
                    const alt = Math.max(0.7, Math.min(1.25, 0.9 + h / 90));
                    r = reg.col[0] * 255 * shade * alt; gg = reg.col[1] * 255 * shade * alt; b = reg.col[2] * 255 * shade * alt;
                    // 8 m contour lines.
                    if (Math.floor(h / 8) !== Math.floor(H[j * (BASE_RES + 1) + i + 1] / 8) || Math.floor(h / 8) !== Math.floor(H[(j + 1) * (BASE_RES + 1) + i] / 8)) { r *= 0.8; gg *= 0.8; b *= 0.8; }
                }
                const o = (j * BASE_RES + i) * 4;
                img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
            }
            g.putImageData(img, 0, 0);
            const base = document.createElement('canvas');
            base.width = base.height = BASE_PX;
            const bg = base.getContext('2d');
            bg.imageSmoothingEnabled = true;
            bg.drawImage(small, 0, 0, BASE_PX, BASE_PX);
            const S = BASE_PX / span, X = (x) => (x - B.minX) * S, Z = (z) => (z - B.minZ) * S;
            bg.lineCap = 'round'; bg.lineJoin = 'round';
            for (const [w, col] of [[5, 'rgba(20,18,14,0.75)'], [2.2, 'rgba(214,196,160,0.85)']]) {
                bg.strokeStyle = col; bg.lineWidth = w;
                for (const r of Dd.ROADS || []) { bg.beginPath(); r.pts.forEach(([x, z], i) => (i ? bg.lineTo(X(x), Z(z)) : bg.moveTo(X(x), Z(z)))); bg.stroke(); }
            }
            const grad = bg.createRadialGradient(BASE_PX / 2, BASE_PX / 2, BASE_PX * 0.35, BASE_PX / 2, BASE_PX / 2, BASE_PX * 0.75);
            grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.35)');
            bg.fillStyle = grad; bg.fillRect(0, 0, BASE_PX, BASE_PX);
            base._seed = BO.World.mapData.id;
            this.base = base;
        },

        _buildFog() {
            const c = document.createElement('canvas');
            c.width = c.height = GRID;
            this.fog = c;
            this.fogCtx = c.getContext('2d');
            this.fogImg = this.fogCtx.createImageData(GRID, GRID);
            for (let i = 0; i < GRID * GRID; i++) {
                const o = i * 4;
                this.fogImg.data[o] = 9; this.fogImg.data[o + 1] = 13; this.fogImg.data[o + 2] = 20;
                this.fogImg.data[o + 3] = this._get(i) ? 0 : 236;
            }
            this.fogCtx.putImageData(this.fogImg, 0, 0);
            this.fogDirty = false;
        },

        _fogPixel(i) {
            if (!this.fogImg) return;
            this.fogImg.data[i * 4 + 3] = 0;
            this.fogDirty = true;
        },

        _flushFog() {
            if (!this.fogDirty || !this.fogCtx) return;
            this.fogCtx.putImageData(this.fogImg, 0, 0);
            this.fogDirty = false;
        },

        /** World-map overlay used by the Pip-Pad map tab (draw after POIs, before the player arrow). */
        drawWorldBase(g, size) {
            this._buildBase();
            g.imageSmoothingEnabled = true;
            g.drawImage(this.base, 0, 0, size, size);
        },

        drawWorldFog(g, size) {
            this._flushFog();
            g.save();
            g.imageSmoothingEnabled = true;
            g.filter = 'blur(' + (size / GRID * 0.6).toFixed(1) + 'px)';
            g.drawImage(this.fog, 0, 0, size, size);
            g.restore();
        },

        /* ------------------------------------------------ minimap */
        _ensureMinimap() {
            const UI = BO.OWRPGUI;
            UI.init();
            if (this.mm && document.body.contains(this.mm.root)) { this.mm.root.classList.remove('hidden'); return; }
            const root = document.createElement('div');
            root.id = 'ow-minimap';
            root.className = 'ow-minimap';
            root.innerHTML = '<canvas width="' + MM_PX * 2 + '" height="' + MM_PX * 2 + '" aria-label="Minimap"></canvas><div class="ow-mm-rim"></div><div class="ow-mm-cardinals"></div><div class="ow-mm-info"><b></b><span></span></div>';
            UI.hud.appendChild(root);
            this.mm = { root, cv: root.querySelector('canvas'), ctx: root.querySelector('canvas').getContext('2d'), card: root.querySelector('.ow-mm-cardinals'), info: root.querySelector('.ow-mm-info'), lastInfo: '' };
        },

        _drawMinimap() {
            const s = this.s, P = BO.Player, Dd = D();
            if (!this.mm || !s || !P) return;
            const show = s.worldFlags.minimapEnabled !== false && !BO.OWRPGUI.modalOpen;
            this.mm.root.classList.toggle('hidden', !show);
            if (!show) return;
            const g = this.mm.ctx, W = this.mm.cv.width, R = W / 2;
            const range = this.range(), k = R / range;
            const inside = Dd.isInterior(P.pos.x, P.pos.z);
            const northUp = !!s.worldFlags.minimapNorthUp;
            // Forward is (-sin yaw, -cos yaw) in map space; rotating the map by +yaw puts it straight up.
            const rot = northUp ? 0 : P.yaw;
            const cs = Math.cos(rot), sn = Math.sin(rot);
            const toScreen = (x, z) => { const dx = (x - P.pos.x) * k, dz = (z - P.pos.z) * k; return [R + dx * cs - dz * sn, R + dx * sn + dz * cs]; };
            g.save();
            g.clearRect(0, 0, W, W);
            g.beginPath(); g.arc(R, R, R - 2, 0, Math.PI * 2); g.clip();
            if (inside) {
                const grd = g.createRadialGradient(R, R, 10, R, R, R);
                grd.addColorStop(0, '#1c1917'); grd.addColorStop(1, '#0c0a09');
                g.fillStyle = grd; g.fillRect(0, 0, W, W);
                g.strokeStyle = 'rgba(148,163,184,0.12)'; g.lineWidth = 1;
                for (let r = range / 4; r < range; r += range / 4) { g.beginPath(); g.arc(R, R, r * k, 0, Math.PI * 2); g.stroke(); }
            } else {
                const B = Dd.BOUNDS, span = B.maxX - B.minX;
                this._flushFog();
                g.translate(R, R); g.rotate(rot); g.scale(k, k); g.translate(-P.pos.x, -P.pos.z);
                g.imageSmoothingEnabled = true;
                g.fillStyle = '#0b1118'; g.fillRect(P.pos.x - range * 1.5, P.pos.z - range * 1.5, range * 3, range * 3);
                g.drawImage(this.base, B.minX, B.minZ, span, span);
                g.globalAlpha = 0.96;
                g.drawImage(this.fog, B.minX, B.minZ, span, span);
                g.globalAlpha = 1;
                g.setTransform(1, 0, 0, 1, 0, 0);
            }
            const dot = (x, z, col, rad, glyph, ring) => {
                const [sx, sy] = toScreen(x, z);
                const dd = Math.hypot(sx - R, sy - R);
                let px = sx, py = sy;
                if (dd > R - 12) { if (!ring) return; px = R + (sx - R) / dd * (R - 12); py = R + (sy - R) / dd * (R - 12); }
                if (glyph) {
                    g.font = '900 ' + Math.round(rad * 2.6) + 'px Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
                    g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(glyph, px, py); g.fillStyle = col; g.fillText(glyph, px, py);
                } else {
                    g.beginPath(); g.arc(px, py, rad, 0, Math.PI * 2); g.fillStyle = col; g.fill();
                    g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.stroke();
                }
            };
            if (!inside) {
                for (const poi of Dd.POIS) {
                    if (poi.interior) continue;
                    const st = s.poiStates[poi.id];
                    if (!st || !st.discovered) continue;
                    dot(poi.x, poi.z, poi.safe ? '#f5a623' : st.clearedAt != null ? '#94a3b8' : '#f87171', poi.safe ? 8 : 6, poi.safe ? '◆' : null);
                }
                for (const dg of Dd.DUNGEONS) if (this.isExplored(dg.surf.x, dg.surf.z)) dot(dg.surf.x, dg.surf.z, '#67e8f9', 8, '∩');
                for (const py of Dd.PYLONS) if (s.pylons[py.id] || this.isExplored(py.x, py.z)) dot(py.x, py.z, s.pylons[py.id] ? '#22d3ee' : '#64748b', 5);
                if (BO.OWRPGDiscoveries) BO.OWRPGDiscoveries.drawOnMinimap(dot, P);
                for (const pin of s.pins) dot(pin[0], pin[1], '#f472b6', 8, '✚', true);
                const ev = BO.OWRPGEvents && BO.OWRPGEvents.activeEvent;
                if (ev) dot(ev.x, ev.z, ev.color || '#38bdf8', 9, '⚡', true);
            }
            for (const a of BO.OWRPGAI.agents) {
                if (!a.alive || !a.ent.parts.root.visible) continue;
                const d = Math.hypot(a.ent.pos.x - P.pos.x, a.ent.pos.z - P.pos.z);
                if (d > range) continue;
                if (a.hostile && (a.state === 'combat' || a.state === 'suspicious' || d < 30)) dot(a.ent.pos.x, a.ent.pos.z, a.champ ? '#e879f9' : a.boss ? '#fb7185' : '#ef4444', a.boss || a.champ ? 5 : 3.5);
                else if (!a.hostile && d < 60) dot(a.ent.pos.x, a.ent.pos.z, '#86efac', 3);
            }
            if (!inside && BO.OWRPGInteriors) for (const n of BO.OWRPGInteriors.npcs) dot(n.pos.x, n.pos.z, '#a7f3d0', 3.5);
            // Quest markers: tracked quests get an edge arrow when out of range.
            const tracked = BO.OWRPGUI.trackedQuests ? BO.OWRPGUI.trackedQuests() : [];
            for (const m of BO.OWRPGQuests.markers(s)) {
                const tgt = this.questTarget(m.poi);
                if (!tgt) continue;
                const on = tracked.includes(m.quest);
                dot(tgt.x, tgt.z, on ? '#a3e635' : 'rgba(163,230,53,0.55)', on ? 8 : 6, '◆', on);
            }
            // Player arrow.
            g.save(); g.translate(R, R); g.rotate(northUp ? -P.yaw : 0);
            g.beginPath(); g.moveTo(0, -11); g.lineTo(7.5, 8); g.lineTo(0, 4); g.lineTo(-7.5, 8); g.closePath();
            g.fillStyle = '#f8fafc'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#0f172a'; g.stroke();
            g.restore();
            g.restore();
            // Cardinals ride the rim.
            this.mm.card.innerHTML = [['N', 0], ['E', Math.PI / 2], ['S', Math.PI], ['W', -Math.PI / 2]].map(([n, off]) => {
                const ang = rot + off;
                const x = 50 + Math.sin(ang) * 46, y = 50 - Math.cos(ang) * 46;
                return '<i class="' + (n === 'N' ? 'ow-mm-n' : '') + '" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%">' + n + '</i>';
            }).join('');
            const reg = inside ? null : Dd.regionAt(P.pos.x, P.pos.z);
            const dungeon = inside ? Dd.DUNGEONS.find((d) => Math.hypot(P.pos.x - d.x, P.pos.z - d.z) < 130) : null;
            const info = inside ? (dungeon ? dungeon.name : 'Underground') + '|DELVING' : reg.name + '|' + this.regionPercent(reg.id) + '% charted · ' + range + ' m';
            if (info !== this.mm.lastInfo) {
                this.mm.lastInfo = info;
                const [a, b] = info.split('|');
                this.mm.info.innerHTML = '<b>' + esc(a) + '</b><span>' + esc(b) + '</span>';
            }
        },

        /** Surface position to point at for a quest marker POI (dungeon entrance for interiors). */
        questTarget(poiId) {
            const Dd = D();
            const poi = Dd.POIS.find((p) => p.id === poiId);
            if (!poi) return null;
            if (poi.interior) {
                const dg = Dd.DUNGEONS.find((d) => d.id === poi.id);
                return dg ? dg.surf : null;
            }
            return poi;
        },

        /* ------------------------------------------------ atlas tab */
        atlasHtml() {
            const s = this.s, Dd = D(), Disc = BO.OWRPGDiscoveries;
            const pct = this.percent();
            const discTotal = Disc ? Disc.sites.length : 0, discFound = Disc ? Disc.foundCount() : 0;
            const poiTotal = Dd.POIS.filter((p) => !p.interior).length;
            const poiFound = Dd.POIS.filter((p) => !p.interior && s.poiStates[p.id] && s.poiStates[p.id].discovered).length;
            const completion = Math.round((pct + (discTotal ? (discFound / discTotal) * 100 : 0) + (poiFound / Math.max(1, poiTotal)) * 100) / 3);
            const rank = [[90, 'Living Legend'], [70, 'Master Cartographer'], [50, 'Pathfinder'], [30, 'Surveyor'], [12, 'Scout'], [0, 'Greenhorn']].find(([t]) => completion >= t)[1];
            const rows = Dd.REGIONS.map((r) => {
                const rp = this.regionPercent(r.id);
                const sites = Disc ? Disc.sites.filter((d) => d.region === r.id) : [];
                const found = sites.filter((d) => s.atlas.found[d.id]).length;
                const pois = Dd.POIS.filter((p) => !p.interior && Dd.regionAt(p.x, p.z).id === r.id);
                const pf = pois.filter((p) => s.poiStates[p.id] && s.poiStates[p.id].discovered).length;
                const col = 'rgb(' + r.col.map((v) => Math.round(v * 255)).join(',') + ')';
                return '<div class="ow-atlas-row" style="--c:' + col + '"><div><b>' + esc(r.name) + '</b><small>Level ' + esc(r.lvl) + ' · ' + (r.faction ? esc(r.faction) : 'unclaimed') + '</small></div>' +
                    '<div class="ow-atlas-bars"><label>Charted <i style="--p:' + rp + '%"></i><em>' + rp + '%</em></label>' +
                    '<label>Sites <i style="--p:' + (sites.length ? Math.round(found / sites.length * 100) : 0) + '%"></i><em>' + found + '/' + sites.length + '</em></label>' +
                    '<label>Locations <i style="--p:' + (pois.length ? Math.round(pf / pois.length * 100) : 0) + '%"></i><em>' + pf + '/' + pois.length + '</em></label></div></div>';
            }).join('');
            const byType = Disc ? Disc.typeSummary() : [];
            const types = byType.map((t) => '<div class="ow-stat" style="--c:' + t.color + '"><small>' + t.icon + ' ' + esc(t.name) + '</small><b>' + t.found + ' / ' + t.total + '</b></div>').join('');
            return '<div class="ow-atlas-head"><div class="ow-atlas-ring" style="--p:' + completion + '"><b>' + completion + '%</b><small>COMPLETE</small></div>' +
                '<div><span class="ow-kicker">ATLAS OF THE MERIDIAN EXPANSE</span><h3>' + rank + '</h3><p class="ow-dim">' + pct + '% of the land charted · ' + poiFound + '/' + poiTotal + ' locations · ' + discFound + '/' + discTotal + ' hidden sites · ' + (s.atlas.champions || 0) + ' Champions slain</p>' +
                '<p class="ow-dim">Walk the land to lift the fog. Vistas chart a wide area at once. Every 10% charted pays out XP; Pathfinding mastery grows with every new cell.</p></div></div>' +
                '<div class="ow-sub">HIDDEN SITES</div><div class="ow-stats">' + types + '</div><div class="ow-sub">REGIONS</div><div class="ow-atlas">' + rows + '</div>';
        }
    };

    BO.OWRPGCartography = Carto;
    if (BO.OWRPGMode) BO.OWRPGMode.registerSystem(Carto);
})(window.BO);
;

/* --- src/owrpg/OWRPGChampions.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Champions
   Any hostile spawn can roll as a Champion (Diablo / WoW-elite style): larger,
   tougher, wrapped in an affix aura, and carrying 1–3 affixes drawn from 12.
   With 70 base archetypes this multiplies the enemy roster into hundreds of
   distinct encounters. Altars of Trials (OWRPGDiscoveries) force Champions.

   Hooks (all optional-chained at the call sites):
     onSpawn(agent)            OWRPGAI.spawn      → roll + apply
     dealtMult(agent, P)       OWRPGCombat.modifyIncoming (damage to player)
     afterHitPlayer(agent, a)  OWRPGCombat.modifyIncoming (vampiric, frost)
     takenMult(agent)          OWRPGCombat.damage (shield / champion damage perks)
     afterDamaged(agent, dmg)  OWRPGCombat.damage (thorns, summons)
     onKilled(agent)           OWRPGAI.onKilled   (rewards, death novas)
============================================================================ */
(function (BO) {
    'use strict';

    const AFFIXES = {
        vampiric:     { name: 'Vampiric',     color: '#dc2626', desc: 'Heals for 35% of the damage it deals.' },
        molten:       { name: 'Molten',       color: '#f97316', desc: 'Hits burn for +20% damage and it erupts when slain.' },
        frozen:       { name: 'Frozen',       color: '#38bdf8', desc: 'Hits chill you (-25% speed) and it shatters into a frost nova when slain.' },
        shielded:     { name: 'Shielded',     color: '#a5b4fc', desc: 'Raises a barrier for 3 s out of every 8 s that blocks 65% of damage.' },
        swift:        { name: 'Swift',        color: '#a3e635', desc: '+45% movement speed.' },
        berserker:    { name: 'Berserker',    color: '#ef4444', desc: '+60% damage below half health.' },
        thorned:      { name: 'Thorned',      color: '#84cc16', desc: 'Reflects 10% of damage taken back at you.' },
        juggernaut:   { name: 'Juggernaut',   color: '#a8a29e', desc: '+80% health and noticeably larger.' },
        arcane:       { name: 'Arcane',       color: '#c084fc', desc: 'Hurls void bolts every few seconds.' },
        summoner:     { name: 'Summoner',     color: '#facc15', desc: 'Calls two of its kin at 60% and 30% health.' },
        regenerating: { name: 'Regenerating', color: '#4ade80', desc: 'Regenerates 2% of its health every second.' },
        warlord:      { name: 'Warlord',      color: '#fb7185', desc: 'Nearby allies deal +25% damage and the Champion takes 15% less.' }
    };
    const IDS = Object.keys(AFFIXES);
    const BASE_CHANCE = 0.06;
    const MAX_ALIVE = 3;
    const _v = new THREE.Vector3();

    const regionTier = (x, z) => {
        const r = BO.OWRPGWorldData.regionAt(x, z);
        return parseInt(String(r.lvl), 10) || 1;
    };

    const Champions = {
        id: 'champions',
        AFFIXES,
        list: [],

        get s() { return BO.OWRPGMode.state; },

        start() { this.list = []; },
        stop() { this.list = []; },

        /** Roll a fresh spawn. Event squads, bosses, friendlies and summoned kin never roll. */
        onSpawn(agent, opts) {
            if (!agent || agent.boss || !agent.hostile || (opts && (opts.noChampion || opts.summoned))) return;
            if (this.list.filter((a) => a.alive).length >= MAX_ALIVE) return;
            const tier = regionTier(agent.home.x, agent.home.z);
            const chance = BASE_CHANCE + Math.min(0.06, tier * 0.0015);
            if (Math.random() >= chance) return;
            this.make(agent, 1 + (Math.random() < 0.35 + tier * 0.006 ? 1 : 0) + (tier >= 30 && Math.random() < 0.25 ? 1 : 0));
        },

        /** Turn an agent into a Champion with `n` distinct affixes (or the given list). */
        make(agent, n = 2, forced) {
            if (!agent || agent.champ) return agent;
            const pool = IDS.slice();
            const affixes = forced ? forced.slice() : [];
            while (affixes.length < Math.min(3, n) && pool.length) {
                const id = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
                if (!affixes.includes(id)) affixes.push(id);
            }
            const ent = agent.ent;
            const hpMult = 2.4 * (affixes.includes('juggernaut') ? 1.8 : 1);
            ent.maxHp = Math.round(ent.maxHp * hpMult);
            ent.hp = ent.maxHp;
            agent.armor = (agent.armor || 0) + 15;
            if (affixes.includes('swift')) {
                if (agent.kind === 'bot') ent.speedScale = (ent.speedScale || 1) * 1.45;
                else ent.speed = (ent.speed || 2) * 1.45;
            }
            const scale = affixes.includes('juggernaut') ? 1.38 : 1.18;
            ent.parts.root.scale.multiplyScalar(scale);
            agent.champ = { affixes, cycle: Math.random() * 8, regenT: 0, boltT: 2 + Math.random() * 2, summons: 0, color: AFFIXES[affixes[0]].color };
            agent.lvl += 3;
            this._aura(agent);
            if (agent.bar) agent.bar.lastKey = '';
            this.list.push(agent);
            return agent;
        },

        _aura(agent) {
            const col = new THREE.Color(agent.champ.color);
            const group = new THREE.Group();
            const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 40), ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.06;
            const inner = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 6), ringMat);
            inner.rotation.x = -Math.PI / 2;
            inner.position.y = 0.07;
            const shieldMat = new THREE.MeshBasicMaterial({ color: 0xa5b4fc, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
            const shield = new THREE.Mesh(new THREE.SphereGeometry(1.1, 18, 12), shieldMat);
            shield.position.y = 1;
            shield.visible = false;
            group.add(ring, inner, shield);
            group.userData.noHit = true;
            group.traverse((o) => { o.userData.noHit = true; o.raycast = () => {}; });
            agent.ent.parts.root.add(group);
            agent.champ.aura = { group, ring, inner, shield };
        },

        has(agent, id) { return !!(agent && agent.champ && agent.champ.affixes.includes(id)); },

        shieldUp(agent) { return this.has(agent, 'shielded') && (agent.champ.cycle % 8) < 3; },

        label(agent) { return agent.champ ? agent.champ.affixes.map((id) => AFFIXES[id].name).join(' · ') : ''; },

        /* ------------------------------------------------ combat hooks */
        /** Multiplier on damage a Champion (or an ally inspired by a Warlord) deals to the player. */
        dealtMult(agent) {
            let m = 1;
            const fx = BO.OWRPGCharacter.perkFx(this.s);
            if (agent.champ) {
                m *= 1.25;
                if (this.has(agent, 'berserker') && agent.ent.hp < agent.ent.maxHp * 0.5) m *= 1.6;
                if (this.has(agent, 'molten')) m *= 1.2;
                m *= 1 - Math.min(0.75, fx.champDR || 0);
            }
            if (this.list.some((c) => c !== agent && c.alive && this.has(c, 'warlord') && c.ent.pos.distanceTo(agent.ent.pos) < 18)) m *= 1.25;
            return m;
        },

        afterHitPlayer(agent, dealt) {
            if (!agent.champ || dealt <= 0) return;
            if (this.has(agent, 'vampiric')) agent.ent.hp = Math.min(agent.ent.maxHp, agent.ent.hp + dealt * 0.35);
            if (this.has(agent, 'frozen')) BO.OWRPGMode.chillT = Math.max(BO.OWRPGMode.chillT || 0, 2.5);
            if (this.has(agent, 'molten')) BO.FX.spawnParticles(BO.Player.pos.clone().add(_v.set(0, 1, 0)), 6, 0xf97316, 3, 4, 0.3, 0.8);
        },

        /** Multiplier on damage the player deals to this agent. */
        takenMult(agent) {
            if (!agent.champ) return 1;
            const fx = BO.OWRPGCharacter.perkFx(this.s);
            let m = 1 + (fx.champDmg || 0);
            if (this.shieldUp(agent)) m *= 0.35;
            if (this.has(agent, 'warlord')) m *= 0.85;
            return m;
        },

        afterDamaged(agent, dmg) {
            if (!agent.champ || dmg <= 0) return;
            const P = BO.Player;
            // Thorns reflect 10% of the damage actually dealt (overkill excluded), capped at 6% of max HP per hit.
            if (this.has(agent, 'thorned') && P.alive) P.takeDamage(Math.max(1, Math.min(dmg * 0.1, P.maxHp * 0.06)), agent.ent.pos, false, null);
            if (this.has(agent, 'summoner') && agent.alive) {
                const frac = agent.ent.hp / agent.ent.maxHp;
                const want = frac < 0.3 ? 2 : frac < 0.6 ? 1 : 0;
                while (agent.champ.summons < want) { agent.champ.summons++; this._summon(agent); }
            }
        },

        _summon(agent) {
            for (let i = 0; i < 2; i++) {
                const ang = Math.random() * Math.PI * 2;
                const x = agent.ent.pos.x + Math.cos(ang) * 4, z = agent.ent.pos.z + Math.sin(ang) * 4;
                const kin = BO.OWRPGAI.spawn(agent.defId, x, z, { poiId: null, leash: 60, postR: 4, summoned: true, y: BO.OWRPGWorldData.isInterior(x, z) ? agent.ent.pos.y : null });
                if (kin) { kin.summoned = true; BO.OWRPGAI.engage(kin, false); }
            }
            BO.FX.spawnParticles(agent.ent.pos.clone().add(_v.set(0, 1.2, 0)), 18, 0xfacc15, 5, 6, 0.5, 1.2);
            BO.OWRPGMode.toast('The Champion calls for aid!', '#facc15');
        },

        /* ------------------------------------------------ frame */
        update(dt) {
            if (!this.list.length) return;
            const P = BO.Player;
            for (let i = this.list.length - 1; i >= 0; i--) {
                const a = this.list[i];
                if (!a.alive || !BO.OWRPGAI.agents.includes(a)) { this.list.splice(i, 1); continue; }
                const c = a.champ;
                c.cycle += dt;
                const au = c.aura;
                if (au && a.ent.parts.root.visible) {
                    au.ring.rotation.z += dt * 1.2;
                    au.inner.rotation.z -= dt * 2.4;
                    au.ring.material.opacity = 0.55 + Math.sin(c.cycle * 4) * 0.2;
                    au.shield.visible = this.shieldUp(a);
                }
                if (this.has(a, 'regenerating') && a.ent.hp < a.ent.maxHp) a.ent.hp = Math.min(a.ent.maxHp, a.ent.hp + a.ent.maxHp * 0.02 * dt);
                if (this.has(a, 'arcane') && a.state === 'combat' && a.hostile && P.alive) {
                    c.boltT -= dt;
                    const dist = a.ent.pos.distanceTo(P.pos);
                    if (c.boltT <= 0 && dist < 40 && BO.World.hasLineOfSight(a.ent.pos.x, a.ent.pos.y + 1.5, a.ent.pos.z, P.pos.x, P.pos.y + 1.3, P.pos.z)) {
                        c.boltT = 3.2 + Math.random() * 1.5;
                        this._bolt(a);
                    }
                }
            }
        },

        _bolt(a) {
            const P = BO.Player;
            const origin = new THREE.Vector3(a.ent.pos.x, a.ent.pos.y + 1.6 * a.ent.parts.root.scale.y, a.ent.pos.z);
            const dir = new THREE.Vector3(P.pos.x - origin.x, P.pos.y + 1.2 - origin.y, P.pos.z - origin.z).normalize();
            const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: 0xc084fc }));
            mesh.position.copy(origin);
            BO.World.scene.add(mesh);
            const dmg = Math.round(10 + a.lvl * 1.4);
            BO.OWRPGAI.projectiles.push({ mesh, pos: origin, vel: dir.multiplyScalar(17), dmg, life: 3, owner: a.ent, col: 0xc084fc });
        },

        /* ------------------------------------------------ death */
        onKilled(a, ctx) {
            if (!a.champ) return;
            const s = this.s, M = BO.OWRPGMode, P = BO.Player;
            const pos = a.ent.pos.clone();
            if (this.has(a, 'molten') || this.has(a, 'frozen')) {
                const frost = this.has(a, 'frozen');
                BO.FX.spawnParticles(pos.clone().add(_v.set(0, 1, 0)), 30, frost ? 0x7dd3fc : 0xf97316, 7, 8, 0.6, 1.4);
                if (P.alive && P.pos.distanceTo(pos) < 6) P.takeDamage(frost ? 18 : 28, pos, true, null);
                if (frost && P.pos.distanceTo(pos) < 6) M.chillT = Math.max(M.chillT || 0, 3);
            }
            if (ctx && ctx.byNpc) return;
            s.atlas.champions = (s.atlas.champions || 0) + 1;
            const fx = BO.OWRPGCharacter.perkFx(s);
            M.giveXp(a.def.xp * 2 * BO.OWRPGCharacter.killXpMult(s, a.lvl), 'Champion slain');
            BO.OWRPGCharacter.addSkillXp(s, 'slayer', 60 + a.lvl * 4);
            const rolls = 2 + (Math.random() < (fx.champLoot || 0) ? 1 : 0);
            M.dropLoot(pos, 'champion', rolls);
            M.setFlag('first_champion', true);
            M.setFlag('champions_slain', s.atlas.champions);
            BO.Events.emit('hud:toast', { text: 'Champion slain: ' + a.name + ' (' + this.label(a) + ')', color: a.champ.color });
        }
    };

    BO.OWRPGChampions = Champions;
    if (BO.OWRPGMode) BO.OWRPGMode.registerSystem(Champions);
})(window.BO);
;

/* --- src/owrpg/OWRPGDiscoveries.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Discoveries
   156 hidden sites scattered across the 12 regions: treasure caches, lore
   tomes, wayside shrines, skill shards, survey vistas, hidden stashes and
   Altars of Trials. Placement is derived from the terrain and a fixed seed,
   so every save sees the same world; only `s.atlas.found` is persisted.

   Sites stream in within 150 m (GLB model + fallback + a bobbing marker that
   disappears once found), show on the minimap, the world map and the Atlas,
   and feed the exploration questline through numeric world flags.
============================================================================ */
(function (BO) {
    'use strict';

    const STREAM_IN = 125, STREAM_OUT = 150, REACH = 2.9, TRIAL_RANGE = 110;
    const DD = () => BO.OWRPGDiscoveryData;
    const W = () => BO.OWRPGWorldData;
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function rng(seed) {
        let a = seed >>> 0;
        return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }

    const markerTex = {};
    function markerTexture(type) {
        if (markerTex[type]) return markerTex[type];
        const T = DD().TYPES[type];
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62);
        grad.addColorStop(0, T.color); grad.addColorStop(0.45, T.color + '88'); grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
        g.font = '900 64px Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.65)'; g.strokeText(T.icon, 64, 68);
        g.fillStyle = '#fff'; g.fillText(T.icon, 64, 68);
        const tex = new THREE.CanvasTexture(c);
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        markerTex[type] = tex;
        return tex;
    }

    const Disc = {
        id: 'discoveries',
        sites: [],
        live: new Map(),
        trial: null,
        streamT: 0,
        _seed: null,

        get s() { return BO.OWRPGMode.state; },

        /* ------------------------------------------------ lifecycle */
        start(s, scene) {
            this.scene = scene;
            this.generate(s.worldSeed || 884120);
            this.live = new Map();
            this.trial = null;
            this.streamT = 0;
        },

        stop() {
            for (const v of this.live.values()) v.group.removeFromParent();
            this.live.clear();
            this.trial = null;
        },

        /** Deterministic placement: same seed + terrain → same 156 sites. */
        generate(seed) {
            if (this._seed === seed && this.sites.length) return this.sites;
            const D = W(), B = D.BOUNDS, out = [];
            const blocked = [];
            for (const p of D.POIS) if (!p.interior) blocked.push([p.x, p.z, (p.r || 25) + 14]);
            for (const d of D.DUNGEONS) blocked.push([d.surf.x, d.surf.z, 22]);
            for (const py of D.PYLONS) blocked.push([py.x, py.z, 14]);
            for (const n of D.NPCS) blocked.push([n.x, n.z, 10]);
            for (const it of D.INTERACTS) if (!it.int) blocked.push([it.x, it.z, 6]);
            // `relax` 0 = strict; 1 = steeper ground and tighter clearances (fallback for rugged / marshy regions).
            const ok = (x, z, reg, gap, relax) => {
                if (x < B.minX + 24 || x > B.maxX - 24 || z < B.minZ + 24 || z > B.maxZ - 24) return false;
                if (D.regionAt(x, z).id !== reg) return false;
                const h = BO.World.terrainHeight(x, z);
                if (h < D.WATER + 0.4) return false;
                const slope = Math.abs(BO.World.terrainHeight(x + 2, z) - h) + Math.abs(BO.World.terrainHeight(x, z + 2) - h);
                if (slope > (relax ? 4.5 : 2.2)) return false;
                const pad = relax ? 0.55 : 1;
                for (const [bx, bz, br] of blocked) if ((x - bx) * (x - bx) + (z - bz) * (z - bz) < br * br * pad * pad) return false;
                for (const o of out) if ((x - o.x) * (x - o.x) + (z - o.z) * (z - o.z) < gap * gap) return false;
                return true;
            };
            const skills = Object.keys(BO.OWRPGStatsData.SKILLS);
            const generic = DD().LORE.filter((l) => !l.region);
            let genericIdx = 0, shardIdx = 0;
            D.REGIONS.forEach((reg, ri) => {
                const rand = rng(seed * 31 + ri * 7919);
                const tier = parseInt(String(reg.lvl), 10) || 1;
                for (const [type, count] of Object.entries(DD().PER_REGION)) {
                    for (let k = 0; k < count; k++) {
                        let best = null;
                        const tries = type === 'vista' ? 120 : 70;
                        for (let relax = 0; relax < 2 && !best; relax++) {
                            for (let t = 0; t < tries; t++) {
                                const ang = rand() * Math.PI * 2, rr = Math.sqrt(rand()) * reg.r * (relax ? 1 : 0.92);
                                const x = reg.x + Math.cos(ang) * rr, z = reg.z + Math.sin(ang) * rr;
                                if (!ok(x, z, reg.id, type === 'vista' ? 60 : relax ? 24 : 34, relax)) continue;
                                if (type !== 'vista') { best = { x, z }; break; }
                                const h = BO.World.terrainHeight(x, z);
                                if (!best || h > best.h) best = { x, z, h };
                            }
                        }
                        if (!best) continue;
                        const site = { id: 'ds_' + reg.id.slice(0, 6) + '_' + type + k, type, region: reg.id, tier, x: Math.round(best.x * 10) / 10, z: Math.round(best.z * 10) / 10, yaw: rand() * Math.PI * 2 };
                        if (type === 'tome') {
                            const own = DD().LORE.filter((l) => l.region === reg.id);
                            site.lore = own.length ? own[k % own.length].id : generic[genericIdx++ % generic.length].id;
                        }
                        if (type === 'shard') site.skill = skills[(ri + shardIdx++) % skills.length];
                        if (type === 'shrine') site.blessing = DD().BLESSINGS[(ri + k) % DD().BLESSINGS.length].id;
                        out.push(site);
                    }
                }
            });
            this.sites = out;
            this._seed = seed;
            return out;
        },

        /* ------------------------------------------------ queries */
        isFound(site) { return !!this.s.atlas.found[site.id]; },
        foundCount() { return this.sites.filter((x) => this.s.atlas.found[x.id]).length; },

        typeSummary() {
            const T = DD().TYPES;
            return Object.keys(T).map((type) => {
                const all = this.sites.filter((x) => x.type === type);
                return { type, name: T[type].name, icon: T[type].icon, color: T[type].color, total: all.length, found: all.filter((x) => this.s.atlas.found[x.id]).length };
            });
        },

        shrineReady(site) { return (this.s.atlas.shrineT[site.id] || 0) <= this.s.playtimeSec; },

        nearest() {
            const P = BO.Player;
            if (this.trial || W().isInterior(P.pos.x, P.pos.z)) return null;
            let best = null;
            for (const v of this.live.values()) {
                const site = v.site;
                const found = this.isFound(site);
                if (found && !(site.type === 'shrine' && this.shrineReady(site))) continue;
                const d = BO.Math.dist3D(P.pos.x, P.pos.y + 0.9, P.pos.z, site.x, v.y + 0.6, site.z);
                if (d < REACH && (!best || d < best.d)) best = { obj: site, d, text: DD().TYPES[site.type].prompt };
            }
            return best;
        },

        /* ------------------------------------------------ streaming & animation */
        update(dt) {
            const P = BO.Player;
            this.streamT -= dt;
            if (this.streamT <= 0) { this.streamT = 0.5; this._stream(P); }
            const t = this.s.playtimeSec;
            for (const v of this.live.values()) {
                if (v.marker && v.marker.visible) {
                    v.marker.position.y = v.markerY + Math.sin(t * 2.2 + v.phase) * 0.18;
                    v.marker.material.rotation = Math.sin(t * 0.8 + v.phase) * 0.15;
                }
                if (v.crystal) { v.crystal.rotation.y += dt * 1.4; v.crystal.position.y = 1.15 + Math.sin(t * 1.8 + v.phase) * 0.12; }
                if (v.ring) v.ring.rotation.z += dt * 0.6;
            }
            if (this.trial) this._updateTrial();
        },

        _stream(P) {
            const inside = W().isInterior(P.pos.x, P.pos.z);
            for (const site of this.sites) {
                const d = BO.Math.dist2D(P.pos.x, P.pos.z, site.x, site.z);
                const has = this.live.has(site.id);
                if (!inside && !has && d < STREAM_IN) this._spawnSite(site);
                else if (has && (inside || d > STREAM_OUT)) { this.live.get(site.id).group.removeFromParent(); this.live.delete(site.id); }
            }
            for (const v of this.live.values()) { v.dist = BO.Math.dist2D(P.pos.x, P.pos.z, v.site.x, v.site.z); this._refreshState(v); }
        },

        _spawnSite(site) {
            const T = DD().TYPES[site.type];
            const y = BO.World.terrainHeight(site.x, site.z);
            const group = new THREE.Group();
            group.position.set(site.x, y, site.z);
            group.rotation.y = site.yaw;
            const col = new THREE.Color(T.color);
            const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, metalness: 0.15 }, o || {}));
            const fallback = [];
            // Pedestals and fallbacks skip the shadow pass; the merged GLB model casts the site's shadow.
            const add = (geo, mat, x, yy, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, yy, z); m.castShadow = false; m.receiveShadow = true; m.userData.noHit = true; group.add(m); return m; };
            const v = { site, group, y, phase: Math.random() * 6 };
            switch (site.type) {
                case 'cache': fallback.push(add(new THREE.BoxGeometry(1.1, 0.7, 0.75), std(0x6b4f2e), 0, 0.35, 0), add(new THREE.BoxGeometry(1.14, 0.12, 0.79), std(0xb45309, { metalness: 0.6 }), 0, 0.72, 0)); break;
                case 'tome': {
                    fallback.push(add(new THREE.BoxGeometry(1.2, 0.85, 0.7), std(0x57534e), 0, 0.42, 0));
                    const book = add(new THREE.BoxGeometry(0.55, 0.08, 0.4), std(0x7f1d1d, { emissive: 0xe9c46a, emissiveIntensity: 0.25 }), 0, 0.99, 0);
                    book.rotation.x = -0.25;
                    break;
                }
                case 'shrine': fallback.push(add(new THREE.CylinderGeometry(0.45, 0.6, 1.8, 6), std(0x44403c), 0, 0.9, 0)); break;
                case 'shard': {
                    add(new THREE.CylinderGeometry(0.7, 0.9, 0.3, 7), std(0x334155), 0, 0.15, 0);
                    v.crystal = add(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.65, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.92 }), 0, 1.15, 0);
                    v.crystal.scale.y = 1.6;
                    break;
                }
                case 'vista': {
                    fallback.push(add(new THREE.CylinderGeometry(0.08, 0.1, 4.6, 6), std(0x78716c), 0, 2.3, 0));
                    add(new THREE.CylinderGeometry(1.4, 1.6, 0.25, 12), std(0x57534e), 0, 0.12, 0);
                    break;
                }
                case 'cairn': fallback.push(add(new THREE.DodecahedronGeometry(0.6, 0), std(0x78716c), 0, 0.45, 0), add(new THREE.DodecahedronGeometry(0.38, 0), std(0x57534e), 0.1, 1.05, 0)); break;
                case 'altar': {
                    fallback.push(add(new THREE.BoxGeometry(2, 1.1, 1.3), std(0x57534e), 0, 0.55, 0));
                    const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
                    v.ring = add(new THREE.RingGeometry(2.4, 2.65, 48), ringMat, 0, 0.05, 0);
                    v.ring.rotation.x = -Math.PI / 2;
                    v.ring.castShadow = false;
                    break;
                }
            }
            if (T.model && BO.Assets) {
                BO.Assets.placeGLB(group, T.model, {
                    fitSize: T.fit, uniform: true, hideFallback: fallback, guardScene: BO.World.scene, ownerSession: null,
                    // Static prop: bake the GLB into one mesh per material (usually a single draw call).
                    onLoad: (holder) => { if (BO.MeshProxy && holder.parent) BO.MeshProxy.set(BO.MeshProxy.attach(holder, 'disc:' + site.type), true); }
                });
            }
            const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTexture(site.type), transparent: true, depthWrite: false, fog: false }));
            marker.scale.set(0.9, 0.9, 1);
            v.markerY = site.type === 'vista' ? 5.6 : site.type === 'shrine' ? 3.1 : 2.2;
            marker.position.set(0, v.markerY, 0);
            marker.userData.noHit = true;
            marker.raycast = () => {};
            group.add(marker);
            v.marker = marker;
            group.traverse((o) => { o.userData.noHit = true; });
            this.scene.add(group);
            this.live.set(site.id, v);
            this._refreshState(v);
        },

        _refreshState(v) {
            const site = v.site, found = this.isFound(site);
            const ready = site.type === 'shrine' ? this.shrineReady(site) : !found;
            // Floating marker only inside 75 m (vistas: always) — beyond that the model and minimap guide you.
            if (v.marker) v.marker.visible = ready && (site.type === 'vista' || (v.dist == null ? true : v.dist < 75));
            if (v.crystal) v.crystal.visible = !found;
            if (v.ring) v.ring.visible = !found && !this.trial;
        },

        /* ------------------------------------------------ interaction */
        interact(t) {
            const site = t.obj, s = this.s, T = DD().TYPES[site.type];
            const M = BO.OWRPGMode, C = BO.OWRPGCharacter, I = BO.OWRPGInventory;
            const fx = C.perkFx(s);
            const first = !this.isFound(site);
            const xp = Math.round((T.xp + site.tier * 10) * (1 + (fx.discoveryXp || 0)));
            if (site.type !== 'altar') this._play(T);
            switch (site.type) {
                case 'cache': {
                    const loot = I.rollLoot(s, 'treasure', 2 + (Math.random() < (fx.cacheLuck || 0) ? 1 : 0) + (site.tier >= 20 ? 1 : 0));
                    // Every cache holds coin on top of its rolls, scaled by region tier.
                    loot.credits = Math.round((loot.credits + 15 + site.tier * 3) * (1 + site.tier * 0.04) * (1 + (fx.creditFind || 0)));
                    M.giveLootReport(loot, T.name);
                    break;
                }
                case 'tome': this._showLore(site); break;
                case 'shrine': {
                    const b = DD().BLESSINGS.find((x) => x.id === site.blessing) || DD().BLESSINGS[0];
                    const dur = DD().BLESSING_SEC * (1 + (fx.shrineDur || 0));
                    s.player.blessing = { id: b.id, name: b.name, color: b.color, until: s.playtimeSec + dur, fx: b.fx };
                    s.atlas.shrineT[site.id] = s.playtimeSec + (T.cooldown || 600);
                    M.applyDerived();
                    BO.Events.emit('hud:banner', { title: b.name.toUpperCase(), sub: b.desc + ' · ' + Math.round(dur / 60) + ' min', color: b.color });
                    break;
                }
                case 'shard': {
                    const sk = BO.OWRPGStatsData.SKILLS[site.skill];
                    const amt = 260 + site.tier * 22;
                    C.addSkillXp(s, site.skill, amt);
                    M.toast(sk.icon + ' ' + sk.name + ' +' + amt + ' Mastery XP', sk.color);
                    break;
                }
                case 'vista': {
                    const n = BO.OWRPGCartography ? BO.OWRPGCartography.reveal(site.x, site.z, T.revealR * (1 + (fx.revealRadius || 0) * 0.5)) : 0;
                    BO.Events.emit('hud:banner', { title: 'VISTA SYNCHRONISED', sub: W().regionAt(site.x, site.z).name + ' · ' + n + ' map cells charted', color: T.color });
                    break;
                }
                case 'cairn': {
                    const loot = I.rollLoot(s, Math.random() < 0.45 ? 'locked' : 'treasure', 1 + (site.tier >= 15 ? 1 : 0));
                    M.giveLootReport(loot, T.name);
                    break;
                }
                case 'altar': this._startTrial(site); return;
            }
            if (first) this._markFound(site, xp, T);
            else if (site.type === 'shrine') M.giveXp(Math.round(xp * 0.25), 'Shrine');
            const v = this.live.get(site.id);
            if (v) this._refreshState(v);
        },

        _play(T) { for (const clip of T.sound || []) BO.Assets?.playClip?.(clip, { volume: 0.5, rateJitter: 0.04 }); },

        _markFound(site, xp, T) {
            const s = this.s, M = BO.OWRPGMode, C = BO.OWRPGCharacter;
            s.atlas.found[site.id] = Math.round(s.playtimeSec);
            M.giveXp(xp, T.name);
            if (T.skill) C.addSkillXp(s, T.skill[0], T.skill[1]);
            C.addSkillXp(s, 'exploration', 45 + site.tier * 2);
            const n = this.sites.filter((x) => x.type === site.type && s.atlas.found[x.id]).length;
            M.setFlag('first_' + site.type, true);
            M.setFlag('found_' + site.type, n);
            M.setFlag('sites_found', this.foundCount());
            BO.FX.spawnParticles(new THREE.Vector3(site.x, BO.World.terrainHeight(site.x, site.z) + 1.4, site.z), 22, new THREE.Color(T.color).getHex(), 4, 5, 0.45, 1.3);
        },

        _showLore(site) {
            const L = DD().LORE.find((l) => l.id === site.lore) || DD().LORE[0];
            const read = DD().LORE.filter((l) => this.sites.some((x) => x.lore === l.id && this.s.atlas.found[x.id])).length + (this.isFound(site) ? 0 : 1);
            BO.OWRPGUI.open('lore', '<div class="ow-tome"><span class="ow-kicker">MERIDIAN ARCHIVES · ' + esc(W().regionAt(site.x, site.z).name.toUpperCase()) + '</span><h2>' + esc(L.title) + '</h2><p>' + esc(L.text) + '</p><small class="ow-dim">Tomes recovered: ' + read + ' / ' + this.sites.filter((x) => x.type === 'tome').length + '</small><div class="ow-row"><button class="ow-btn ow-primary" data-act="close">CLOSE</button></div></div>');
        },

        /* ------------------------------------------------ Altar of Trials */
        _startTrial(site) {
            const s = this.s, M = BO.OWRPGMode;
            if (this.isFound(site) && (s.atlas.shrineT[site.id] || 0) > s.playtimeSec) { M.toast('The altar is dormant. It will stir again in ' + Math.ceil(((s.atlas.shrineT[site.id] || 0) - s.playtimeSec) / 60) + ' min.', '#94a3b8'); return; }
            const pool = BO.OWRPGWorldSim.encounterPool ? BO.OWRPGWorldSim.encounterPool(site.region) : null;
            const group = pool && pool.length ? pool[Math.floor(Math.random() * pool.length)] : ['raider', 'raider'];
            const y = BO.World.terrainHeight(site.x, site.z);
            const spawn = (id, ang, dist) => BO.OWRPGAI.spawn(id, site.x + Math.cos(ang) * dist, site.z + Math.sin(ang) * dist, { poiId: null, leash: 90, postR: 5, noChampion: true });
            const champ = spawn(group[0], site.yaw, 9);
            if (!champ) return;
            champ.eventHostile = true; champ.hostile = true;
            BO.OWRPGChampions.make(champ, 2);
            const minions = [];
            for (let i = 1; i <= 2; i++) {
                const m = spawn(group[i % group.length], site.yaw + i * 2.1, 8);
                if (m) { m.eventHostile = true; m.hostile = true; minions.push(m); }
            }
            for (const a of [champ, ...minions]) BO.OWRPGAI.engage(a, false);
            this._play(DD().TYPES.altar);
            this.trial = { site, champ, minions, y };
            const v = this.live.get(site.id);
            if (v) this._refreshState(v);
            BO.Events.emit('hud:banner', { title: 'TRIAL OF CHAMPIONS', sub: 'Slay ' + champ.name + ' (' + BO.OWRPGChampions.label(champ) + ')', color: '#f43f5e' });
        },

        _updateTrial() {
            const tr = this.trial, P = BO.Player, s = this.s, M = BO.OWRPGMode;
            if (!P.alive || BO.Math.dist2D(P.pos.x, P.pos.z, tr.site.x, tr.site.z) > TRIAL_RANGE) {
                for (const a of [tr.champ, ...tr.minions]) if (a.alive && BO.OWRPGAI.agents.includes(a)) BO.OWRPGAI.despawn(a);
                this.trial = null;
                M.toast('The trial fades. The altar waits for a worthier challenger.', '#94a3b8');
                return;
            }
            if (tr.champ.alive) return;
            const T = DD().TYPES.altar;
            const fx = BO.OWRPGCharacter.perkFx(s);
            const xp = Math.round((T.xp + tr.site.tier * 14) * (1 + (fx.discoveryXp || 0)));
            s.atlas.trials = (s.atlas.trials || 0) + 1;
            s.atlas.shrineT[tr.site.id] = s.playtimeSec + 900;
            M.dropLoot(new THREE.Vector3(tr.site.x, tr.y + 1, tr.site.z), 'champion', 2);
            if (!this.isFound(tr.site)) this._markFound(tr.site, xp, T);
            else M.giveXp(Math.round(xp * 0.5), 'Trial');
            M.setFlag('trials_won', s.atlas.trials);
            BO.Events.emit('hud:banner', { title: 'TRIAL COMPLETE', sub: 'The altar yields its reward', color: '#f43f5e' });
            this.trial = null;
            const v = this.live.get(tr.site.id);
            if (v) this._refreshState(v);
        },

        /* ------------------------------------------------ map layers */
        drawOnMinimap(dot, P) {
            const C = BO.OWRPGCartography;
            const range = C ? C.range() : 120;
            const T = DD().TYPES;
            for (const site of this.sites) {
                if (Math.abs(site.x - P.pos.x) > range || Math.abs(site.z - P.pos.z) > range) continue;
                const found = this.isFound(site);
                const near = Math.hypot(site.x - P.pos.x, site.z - P.pos.z) < 40;
                if (found) dot(site.x, site.z, site.type === 'shrine' && this.shrineReady(site) ? T.shrine.color : 'rgba(203,213,225,0.55)', 5, T[site.type].icon);
                else if (near || site.type === 'vista') dot(site.x, site.z, T[site.type].color, near ? 6 : 5, near ? T[site.type].icon : '?');
            }
        },

        drawOnWorldMap(g, X, Z) {
            const T = DD().TYPES;
            g.textAlign = 'center'; g.textBaseline = 'middle';
            for (const site of this.sites) {
                const found = this.isFound(site);
                const charted = BO.OWRPGCartography && BO.OWRPGCartography.isExplored(site.x, site.z);
                if (!found && !(site.type === 'vista' && charted)) continue;
                g.font = '900 ' + (found ? 12 : 13) + 'px Segoe UI, sans-serif';
                g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.7)';
                g.strokeText(found ? T[site.type].icon : '?', X(site.x), Z(site.z));
                g.fillStyle = found ? T[site.type].color : '#e2e8f0';
                g.fillText(found ? T[site.type].icon : '?', X(site.x), Z(site.z));
            }
            g.textBaseline = 'alphabetic';
        },

        /** Developer helper: closest unfound site. */
        nearestUnfound(x, z) {
            let best = null, bd = Infinity;
            for (const site of this.sites) {
                if (this.isFound(site)) continue;
                const d = Math.hypot(site.x - x, site.z - z);
                if (d < bd) { bd = d; best = site; }
            }
            return best;
        }
    };

    BO.OWRPGDiscoveries = Disc;
    if (BO.OWRPGMode) BO.OWRPGMode.registerSystem(Disc);
})(window.BO);
;

/* --- src/owrpg/OWRPGCompanions.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Companions, World Schedules & New Game+
   Extends OWRPGMode cleanly via non-destructive lifecycle wrappers:
   - Recruitable Squadmates (Vanguard Soren, Ghost Kael, Tinker Torque)
   - Passive companion auras, allied Soldier mesh & throttled combat assist
   - Day/Night NPC routine phase indicator & quest Territory shifts
   - New Game+ cycling Act I–VI quests at +4 difficulty tiers while keeping
     perks, skills, mounts, codex & gear intact.
============================================================================ */
(function (BO) {
    'use strict';

    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const _vA = new THREE.Vector3();
    const _vB = new THREE.Vector3();

    const Comp = {
        activeId: null,
        stance: 'follow', // 'follow' | 'hold'
        mesh: null,
        sprite: null,
        pos: new THREE.Vector3(),
        fireCd: 0,
        lastScheduleId: '',
        _hooked: false,

        get s() { return BO.OWRPGMode.state; },

        initHooks() {
            if (this._hooked) return;
            this._hooked = true;

            // Route Act II-VI quests through OWRPGQuests & OWRPGDialogue without mutating base OWRPGQuestsData key count
            if (BO.OWRPGQuests && BO.OWRPGAct2?.QUESTS) {
                const Q = BO.OWRPGQuests;
                const A2Q = BO.OWRPGAct2.QUESTS;
                const origDef = Q.def.bind(Q);
                const origOnEvent = Q.onEvent.bind(Q);
                Q.def = (id) => origDef(id) || A2Q[id];
                Q.onEvent = (s, type, key) => {
                    origOnEvent(s, type, key);
                    const tag = type + ':' + key;
                    for (const [id, d] of Object.entries(A2Q)) {
                        const q = Q.get(s, id);
                        if (q.state === 'inactive' && d.autoStart === tag) { Q.start(s, id); continue; }
                        if (q.state !== 'active') continue;
                        const on = d.stages[q.stage]?.on;
                        if (on && on[tag]) { Q.setStage(s, id, on[tag]); }
                    }
                };
            }
            if (BO.OWRPGDialogue && BO.OWRPGAct2?.DIALOGUE_INJECTIONS) {
                const DLG = BO.OWRPGDialogue;
                const INJ = BO.OWRPGAct2.DIALOGUE_INJECTIONS;
                const origTree = DLG.tree.bind(DLG);
                const treeCache = new WeakMap();
                DLG.tree = (npcId) => {
                    const base = origTree(npcId);
                    const ext = INJ[npcId];
                    if (!base || !ext) return base;
                    if (treeCache.has(base)) return treeCache.get(base);
                    const nodes = Object.assign({}, base.nodes, ext.extraNodes);
                    if (base.nodes?.hub) {
                        nodes.hub = Object.assign({}, base.nodes.hub, {
                            choices: [...ext.hubChoices, ...base.nodes.hub.choices]
                        });
                    }
                    const wrapped = Object.assign({}, base, { nodes });
                    treeCache.set(base, wrapped);
                    return wrapped;
                };
            }

            const M = BO.OWRPGMode;
            const origStart = M.start.bind(M);
            const origStop = M.stop.bind(M);
            const origUpdate = M.update.bind(M);
            const origIncoming = M.modifyIncomingDamage.bind(M);

            M.start = (opts) => {
                const scene = origStart(opts);
                this._onModeStart(scene);
                return scene;
            };
            M.stop = () => {
                this._despawnMesh();
                origStop();
            };
            M.update = (dt) => {
                origUpdate(dt);
                if (M.active && M.state) this._update(dt);
            };
            M.modifyIncomingDamage = (amount, attackerPos, attackerEntity) => {
                let v = origIncoming(amount, attackerPos, attackerEntity);
                const def = this.activeDef();
                if (def && def.aura && def.aura.dmgReduce) v *= (1 - def.aura.dmgReduce);
                return v;
            };

            // Inject derived crit/cd bonuses when a companion is active
            if (BO.OWRPGCharacter && BO.OWRPGCharacter.derived) {
                const origDerived = BO.OWRPGCharacter.derived.bind(BO.OWRPGCharacter);
                BO.OWRPGCharacter.derived = (s) => {
                    const d = origDerived(s);
                    const id = s && s.player && s.player.activeCompanion;
                    const def = id && BO.OWRPGAct2?.COMPANIONS?.[id];
                    if (def && def.aura) {
                        if (def.aura.critBonus) d.critMult = +(d.critMult + def.aura.critBonus).toFixed(2);
                        if (def.aura.cdBonus) d.cdMult = +Math.max(0.45, d.cdMult - def.aura.cdBonus).toFixed(2);
                    }
                    return d;
                };
            }

            // Inject Companions & NG+ panel directly inside Pip-Pad Character & System tabs
            if (BO.OWRPGPipPad) {
                const Pad = BO.OWRPGPipPad;
                const origChar = Pad._character.bind(Pad);
                Pad._character = () => origChar() + this._renderCompanionCard();

                const origSys = Pad._system ? Pad._system.bind(Pad) : null;
                if (origSys) {
                    Pad._system = () => origSys() + this._renderNgPlusCard();
                }

                Object.assign(Pad.handlers, {
                    setCompanion: (v) => { this.setActive(v === 'none' ? null : v); Pad.render(); },
                    toggleStance: () => { this.toggleStance(); Pad.render(); },
                    startNgPlus: () => {
                        const err = this.startNewGamePlus();
                        if (err) BO.OWRPGMode.toast(err, '#f97316');
                        else { BO.OWRPGUI.close(true); Pad.UI?.close?.(true); }
                    }
                });
            }
        },

        unlockedList(s) {
            const comps = BO.OWRPGAct2?.COMPANIONS || {};
            return Object.values(comps).filter((c) => !c.flag || (s && s.worldFlags && s.worldFlags[c.flag]));
        },

        activeDef() {
            const s = this.s;
            const id = s && s.player && s.player.activeCompanion;
            return (id && BO.OWRPGAct2?.COMPANIONS?.[id]) || null;
        },

        setActive(id) {
            const s = this.s;
            if (!s) return;
            if (!id) {
                s.player.activeCompanion = null;
                this._despawnMesh();
                this._syncHudPill();
                BO.OWRPGMode.toast('Companion dismissed to camp', '#94a3b8');
                return;
            }
            const def = BO.OWRPGAct2?.COMPANIONS?.[id];
            if (!def) return;
            s.worldFlags[def.flag] = true;
            s.player.activeCompanion = id;
            this._spawnMesh(def);
            this._syncHudPill();
            BO.OWRPGMode.applyDerived();
            BO.Sound?.playUIClick?.();
            BO.OWRPGMode.toast(`${def.name} deployed (${def.auraLabel})`, def.color);
        },

        toggleStance() {
            this.stance = this.stance === 'follow' ? 'hold' : 'follow';
            this._syncHudPill();
            BO.OWRPGMode.toast(`Squad stance: ${this.stance.toUpperCase()}`, '#38bdf8');
        },

        _onModeStart(scene) {
            const s = this.s;
            if (!s) return;
            // Apply Territory shifts from quest flags
            for (const sh of (BO.OWRPGAct2?.TERRITORY_SHIFTS || [])) {
                if (s.worldFlags[sh.flag]) BO.OWRPGFactions?.setPoiOwner?.(s, sh.poi, sh.owner);
            }
            // Apply NG+ difficulty scale to enemy base stats non-destructively via flag reference
            this._syncNgPlusBadge();
            this._syncHudPill();
            const active = this.activeDef();
            if (active && scene) this._spawnMesh(active);
        },

        _spawnMesh(def) {
            this._despawnMesh();
            if (!BO.World || !BO.World.scene || !BO.CharacterMesh) return;
            const P = BO.Player;
            this.pos.set(P.pos.x - 2.6, P.pos.y, P.pos.z - 2.2);
            const built = BO.CharacterMesh.buildSoldier(0, def.weapon || 'm4a1_tech');
            const root = built.root || built;
            root.position.copy(this.pos);
            root.traverse((o) => {
                if (o.isMesh && o.material && o.material.color) {
                    o.material = o.material.clone();
                    o.material.color.lerp(new THREE.Color(def.color || '#f5a623'), 0.25);
                }
            });
            BO.World.scene.add(root);
            this.mesh = root;
            this.fireCd = 0.6;
        },

        _despawnMesh() {
            if (this.mesh && this.mesh.parent) this.mesh.parent.remove(this.mesh);
            this.mesh = null;
        },

        _update(dt) {
            const s = this.s;
            const P = BO.Player;
            if (!P || !s) return;

            // 1 Hz schedule & quest territory sync
            const clk = Math.floor(s.worldClock || 760);
            const sched = (BO.OWRPGAct2?.SCHEDULES || []).find((x) => clk >= x.start && clk <= x.end);
            if (sched && sched.id !== this.lastScheduleId) {
                this.lastScheduleId = sched.id;
                const clkEl = document.getElementById('ow-clock');
                if (clkEl) clkEl.title = sched.label;
            }

            const def = this.activeDef();
            if (!def) return;

            // Passive out-of-combat regen aura (Torque)
            if (def.aura?.regenPerSec && BO.OWRPGMode.combatT <= 0 && P.hp < P.maxHp) {
                P.hp = Math.min(P.maxHp, P.hp + def.aura.regenPerSec * dt);
            }

            if (!this.mesh && BO.World?.scene) this._spawnMesh(def);
            if (!this.mesh) return;

            // Keep companion near player unless stance === 'hold'
            if (this.stance === 'follow') {
                _vA.set(P.pos.x - Math.cos(P.yaw) * 2.8, P.pos.y, P.pos.z - Math.sin(P.yaw) * 2.8);
                const distSq = this.pos.distanceToSquared(_vA);
                if (distSq > 900) {
                    this.pos.copy(_vA);
                } else if (distSq > 2.2) {
                    _vB.subVectors(_vA, this.pos);
                    _vB.y = 0;
                    const len = _vB.length();
                    if (len > 0.01) {
                        _vB.multiplyScalar(Math.min(1, (6.2 * dt) / len));
                        this.pos.x += _vB.x;
                        this.pos.z += _vB.z;
                    }
                    this.mesh.rotation.y = Math.atan2(_vB.x, _vB.z);
                }
            }
            const inside = s.player.interiorId || BO.OWRPGWorldData.isInterior(this.pos.x, this.pos.z);
            this.pos.y = inside ? 0.1 : BO.World.terrainHeight(this.pos.x, this.pos.z);
            this.mesh.position.copy(this.pos);

            // Engage nearest visible hostile within range
            this.fireCd -= dt;
            if (this.fireCd <= 0 && BO.OWRPGAI) {
                let best = null, bestD2 = def.range * def.range;
                for (const a of BO.OWRPGAI.agents) {
                    if (!a.alive || !a.hostile || !a.ent) continue;
                    const dx = a.ent.pos.x - this.pos.x;
                    const dz = a.ent.pos.z - this.pos.z;
                    const d2 = dx * dx + dz * dz;
                    if (d2 < bestD2) { bestD2 = d2; best = a; }
                }
                if (best) {
                    this.fireCd = def.cooldown;
                    this.mesh.rotation.y = Math.atan2(best.ent.pos.x - this.pos.x, best.ent.pos.z - this.pos.z);
                    const lvlMult = 1 + 0.06 * Math.max(0, (s.player.level || 1) - 1);
                    const dmg = Math.round(16 * (def.dmgMult || 1) * lvlMult);
                    BO.OWRPGCombat?.damage(best, dmg, { source: 'companion', pos: this.pos });
                    BO.Sound?.playGunshot?.('ar', 0.2);
                } else {
                    this.fireCd = 0.25;
                }
            }
        },

        _syncHudPill() {
            const xpBox = document.getElementById('ow-xp');
            if (!xpBox) return;
            let el = document.getElementById('ow-companion-hud');
            if (!el) {
                el = document.createElement('div');
                el.id = 'ow-companion-hud';
                el.style.cssText = 'margin-top:6px;font-size:11px;letter-spacing:.05em;color:#e2e8f0;background:rgba(15,23,42,.75);border:1px solid rgba(255,178,63,.35);padding:4px 8px;border-radius:4px;display:none;';
                xpBox.appendChild(el);
            }
            const def = this.activeDef();
            if (!def) { el.style.display = 'none'; return; }
            el.style.display = 'block';
            el.innerHTML = `<b style="color:${def.color}">ALLY: ${esc(def.name)}</b> · ${esc(def.auraLabel)} <span style="opacity:.7">[${this.stance.toUpperCase()}]</span>`;
        },

        _syncNgPlusBadge() {
            const s = this.s;
            if (!s) return;
            const ng = Number(s.ngPlus || 0);
            const lvl = document.getElementById('ow-lvl');
            if (lvl && ng > 0 && !lvl.textContent.includes('NG+')) {
                lvl.textContent = `LV ${s.player.level} · NG+${ng}`;
            }
        },

        _renderCompanionCard() {
            const s = this.s;
            if (!s) return '';
            const comps = Object.values(BO.OWRPGAct2?.COMPANIONS || {});
            const active = s.player.activeCompanion;
            const rows = comps.map((c) => {
                const unlocked = !c.flag || !!s.worldFlags[c.flag];
                const isOn = active === c.id;
                return `<div class="ow-item" style="border-left:3px solid ${c.color}">
                    <div><b>${esc(c.name)}</b> <small style="color:${c.color}">${esc(c.role)} · ${esc(c.auraLabel)}</small><br><small>${esc(c.blurb)}</small></div>
                    <div>${isOn
                        ? `<button class="ow-btn ow-ghost" data-act="toggleStance">${this.stance.toUpperCase()}</button> <button class="ow-btn ow-ghost" data-act="setCompanion" data-v="none">DISMISS</button>`
                        : (unlocked ? `<button class="ow-btn" data-act="setCompanion" data-v="${c.id}">DEPLOY</button>` : `<small class="ow-dim">Recruit from ${esc(c.faction)} hub</small>`)}</div>
                </div>`;
            }).join('');
            return `<div class="ow-sub" style="margin-top:14px">SQUAD COMPANIONS</div><div class="ow-items">${rows}</div>`;
        },

        _renderNgPlusCard() {
            const s = this.s;
            if (!s) return '';
            const eligible = !!(s.worldFlags?.meridian_act6_complete || (s.quests?.q_act6_meridian_finale?.state === 'completed'));
            const ng = Number(s.ngPlus || 0);
            return `<div class="ow-sub" style="margin-top:14px">NEW GAME+ CYCLE</div>
                <div class="ow-item"><div><b>Operation Meridian · NG+${ng}</b><small>${eligible ? 'Act VI Finale complete! Start a higher-stakes cycle keeping all gear, perks, skills, mounts & codex.' : 'Complete Act VI Finale ("Crown of Meridian") in Meridian Core to unlock New Game+.'}</small></div>
                <button class="ow-btn ow-primary" data-act="startNgPlus" ${eligible ? '' : 'disabled'}>BEGIN NG+${ng + 1}</button></div>`;
        },

        startNewGamePlus() {
            const s = this.s;
            if (!s) return 'No active save.';
            const eligible = !!(s.worldFlags?.meridian_act6_complete || (s.quests?.q_act6_meridian_finale?.state === 'completed'));
            if (!eligible) return 'Complete Act VI Finale first to unlock New Game+.';
            const nextNg = (Number(s.ngPlus) || 0) + 1;
            const keepFlags = {};
            for (const k of ['comp_soren_recruited', 'comp_kael_recruited', 'comp_torque_recruited', 'compassEnabled', 'compassQuest']) {
                if (s.worldFlags[k]) keepFlags[k] = s.worldFlags[k];
            }
            s.ngPlus = nextNg;
            s.quests = {};
            s.worldFlags = keepFlags;
            s.poiStates = {};
            s.player.credits += 1500 * nextNg;
            s.player.relayCells += 3;
            const sp = BO.MapsData.MAPS.meridian.playerSpawn;
            s.player.pos = [sp.x, null, sp.z];
            s.player.interiorId = null;
            BO.OWRPGMode.save(BO.OWRPGMode.slot, `New Game+ ${nextNg}`);
            const cam = BO.OWRPGMode.camera;
            BO.OWRPGMode.stop();
            BO.OWRPGMode.start({ slot: BO.OWRPGMode.slot, camera: cam });
            BO.Events.emit('hud:banner', { title: `NEW GAME+ ${nextNg}`, sub: 'All quests reset · Perks, mounts, skills & gear retained', color: '#fbbf24' });
            return '';
        }
    };

    Comp.initHooks();
    BO.OWRPGCompanions = Comp;
})(window.BO);
;

/* --- src/ui/OWRPGUI.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · UI (HUD, modal framework, dialogue,
   character creator & slots, vendor, stash, travel, death screen)
   The Pip-Pad tabs and dev overlay live in OWRPGPipPad.js.
   modalOpen pauses the simulation (checked by main.js like RPGUI.modalOpen).
============================================================================ */
(function (BO) {
    'use strict';

    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const ATTR_COL = { BRW: '#f97316', RFX: '#a3e635', TCH: '#38bdf8', PRC: '#facc15', PRS: '#f472b6', REP: '#c084fc', ITEM: '#cbd5e1' };
    const _v = new THREE.Vector3();

    const UI = {
        modalOpen: false,
        deathOpen: false,
        kind: null,
        floats: [],
        dlg: null,

        get M() { return BO.OWRPGMode; },
        get s() { return BO.OWRPGMode.state; },

        init() {
            if (this.root) return;
            const root = document.createElement('div');
            root.id = 'owrpg-root';
            root.innerHTML = `
                <div id="ow-hud" class="hidden">
                    <div class="ow-compass" id="ow-compass"></div>
                    <div class="ow-eye" id="ow-eye"><span></span><b id="ow-eye-label">HIDDEN</b></div>
                    <div class="ow-boss hidden" id="ow-boss"></div>
                    <div class="ow-event hidden" id="ow-event"></div>
                    <div class="ow-quest" id="ow-quest" aria-live="polite"></div>
                    <div class="ow-blessing hidden" id="ow-blessing"></div>
                    <div class="ow-clock" id="ow-clock"></div>
                    <div class="ow-prompt hidden" id="ow-prompt"></div>
                    <div class="ow-xp" id="ow-xp"><div class="ow-xp-top"><b id="ow-lvl">LV 1</b><span id="ow-xpnum"></span></div><div class="ow-xp-bar"><i id="ow-xpfill"></i></div>
                        <div class="ow-res"><span id="ow-cr"></span><span id="ow-cells"></span><span id="ow-enc"></span></div>
                        <div class="ow-barrier hidden" id="ow-barrier"></div>
                        <div class="ow-mount hidden" id="ow-mount"></div>
                        <div class="ow-dur-warn hidden" id="ow-dur-warn"></div></div>
                    <div class="ow-abilities" id="ow-abilities"></div>
                    <div class="ow-pops" id="ow-pops"></div>
                    <div class="ow-floats" id="ow-floats"></div>
                    <div class="ow-camo hidden" id="ow-camo">OPTICAL CAMO</div>
                </div>
                <div id="ow-modal" class="hidden"><div class="ow-panel" id="ow-panel"></div></div>`;
            document.body.appendChild(root);
            this.root = root;
            this.hud = root.querySelector('#ow-hud');
            this.modal = root.querySelector('#ow-modal');
            this.panel = root.querySelector('#ow-panel');
            this.panel.addEventListener('click', (e) => this._onClick(e));
            this.panel.addEventListener('input', (e) => this._onInput(e));
        },

        /* ================================================== modal framework */
        open(kind, html, opts = {}) {
            this.init();
            this.kind = kind;
            this.panel.className = 'ow-panel ow-' + kind;
            this.panel.innerHTML = html;
            this.modal.classList.remove('hidden');
            this.modal.classList.toggle('ow-letterbox', kind === 'dialogue');
            this.modalOpen = true;
            this.closable = opts.closable !== false;
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
        },

        close(silent) {
            if (!this.modalOpen) return;
            this.modalOpen = false;
            this.kind = null;
            this.modal.classList.add('hidden');
            if (!silent) BO.Sound.playUIClick();
            if (BO.State.screen === 'playing' && BO.App) BO.App._safePointerLock();
        },

        hideAll() {
            this.init();
            this.close(true);
            this.deathOpen = false;
            this.hud.classList.add('hidden');
            this.floats.forEach((f) => f.el.remove());
            this.floats = [];
        },

        handleKey(e) {
            const code = e.code;
            if (this.kind === 'dialogue') {
                const n = parseInt(code.replace('Digit', '').replace('Numpad', ''), 10);
                if (n >= 1 && n <= 9) { e.preventDefault(); this._chooseDialogue(n - 1); return; }
                if (code === 'Escape') { e.preventDefault(); this._endDialogue(); }
                return;
            }
            if (code === 'Escape' || (this.kind === 'pippad' && (code === 'Tab' || code === BO.Settings.getKeybinds().owCharacter))) {
                e.preventDefault();
                if (this.closable) this.close();
                return;
            }
            if (this.kind === 'pippad' && BO.OWRPGPipPad) BO.OWRPGPipPad.handleKey(e);
        },

        _onInput(e) {
            const t = e.target;
            if (t.dataset.act === 'cname' && this.creator) this.creator.name = t.value;
        },

        _onClick(e) {
            const b = e.target.closest('[data-act]');
            if (!b || b.disabled) return;
            const act = b.dataset.act, v = b.dataset.v;
            const h = this.handlers[act];
            if (h) { BO.Sound.playUIClick(); h.call(this, v, b); }
            else if (BO.OWRPGPipPad && BO.OWRPGPipPad.handlers[act]) { BO.Sound.playUIClick(); BO.OWRPGPipPad.handlers[act].call(BO.OWRPGPipPad, v, b); }
        },

        handlers: {
            close() { this.close(); },
            choose(v) { this._chooseDialogue(Number(v)); },
            buy(v) { const err = BO.OWRPGInventory.buy(this.s, this.vendorId, v); if (err) this.M.toast(err, '#f97316'); else BO.Sound.playShopBuy?.(); this.openVendor(this.vendorId); },
            sell(v) { const cr = BO.OWRPGInventory.sell(this.s, v); if (cr) { this.M.toast(`Sold for ${cr} cr`, '#fbbf24'); BO.Sound.playLootChime?.(); } this.M.refreshLoadout(); this.openVendor(this.vendorId); },
            stashIn(v) { const e = BO.OWRPGInventory.removeUid(this.s, v); if (e) { this.s.player.stash.push(e); this.M.refreshLoadout(); BO.Sound.playLootChime?.(); } this.openStash(); },
            stashOut(v) { const st = this.s.player.stash; const i = st.findIndex((x) => x.uid === v); if (i >= 0) { this.s.player.inventory.push(st.splice(i, 1)[0]); BO.Sound.playLootChime?.(); } this.openStash(); },
            travel(v) { const err = this.M.travelTo(v); if (err) this.M.toast(err, '#f97316'); else this.close(); },
            deathLoad() { this.deathOpen = false; this.close(true); this.M.quickLoad(); },
            deathRespawn() {
                const s = this.s, P = BO.Player, T = BO.OWRPGWorldData.TOWN;
                this.deathOpen = false;
                BO.OWRPGMounts?.dismount(true);
                s.player.credits = Math.floor(s.player.credits * 0.85);
                P.alive = true; P.hp = P.maxHp; P.inLastStand = false;
                P.pos.set(T.x + 20, BO.World.terrainHeight(T.x + 20, T.z + 20) + 0.3, T.z + 20);
                P.vel.set(0, 0, 0);
                BO.OWRPGAI.clear(); BO.OWRPGWorldSim.poiAgents = {};
                s.player.interiorId = null;
                this.close();
                this.M.toast('You wake in Freestead. Ines patched you up — for a fee.', '#f472b6');
            },
            deathMenu() { this.deathOpen = false; this.close(true); BO.App.exitToMenu(); },
            // Slots & creator (main menu).
            slotContinue(v) { this.close(true); this._start({ mode: 'owrpg', slot: Number(v) }); },
            slotNew(v) { this.openCreator(Number(v)); },
            slotDelete(v) { if (confirm('Delete this character permanently?')) { BO.OWRPGSave.remove(Number(v)); this.openSlots(); } },
            attrUp(v) { const c = this.creator; if (c.points > 0 && c.attrs[v] < 10) { c.attrs[v]++; c.points--; this._renderCreator(); } },
            attrDown(v) { const c = this.creator; if (c.attrs[v] > 1) { c.attrs[v]--; c.points++; this._renderCreator(); } },
            diff(v) { this.creator.difficulty = v; this._renderCreator(); },
            primer(v) { this.creator.primer = v; this._renderCreator(); },
            navOpt(v) { if (v === 'compass' || v === 'minimap') { this.creator[v] = !this.creator[v]; this._renderCreator(); } },
            begin() {
                const c = this.creator;
                this.close(true);
                this._start({ mode: 'owrpg', slot: c.slot, newChar: { name: c.name || 'MERCER', attrs: c.attrs, difficulty: c.difficulty, primer: c.primer, compass: c.compass, minimap: c.minimap } });
            },
            backSlots() { this.openSlots(); }
        },

        _start(opts) { if (BO.Menus && BO.Menus.onStartMatch) BO.Menus.onStartMatch(opts); },

        /* ================================================== slots & creator */
        openSlots() {
            const list = BO.OWRPGSave.list();
            const rows = list.map((sl, i) => sl ? `
                <div class="ow-slot"><div><b>${esc(sl.name)}</b><small>Level ${sl.level} · ${Math.round(sl.playtimeSec / 60)} min · ${new Date(sl.timestamp).toLocaleString()}</small></div>
                <div class="ow-row"><button class="ow-btn ow-primary" data-act="slotContinue" data-v="${i}">CONTINUE</button><button class="ow-btn ow-ghost" data-act="slotDelete" data-v="${i}">DELETE</button></div></div>` : `
                <div class="ow-slot ow-empty"><div><b>Empty slot ${i + 1}</b><small>Create a new operative</small></div><button class="ow-btn" data-act="slotNew" data-v="${i}">NEW CHARACTER</button></div>`).join('');
            this.open('slots', `
                <div class="ow-head"><span class="ow-kicker">OPEN WORLD RPG</span><h2>Operation Meridian</h2>
                <p class="ow-dim">A 1280 × 1280 m frontier of twelve regions, twelve dungeons and choices that stick. Every new operative begins at level 1. Build a character, take sides, and find out what is calling from the crater.</p></div>
                <div class="ow-slots">${rows}</div>
                <div class="ow-row ow-end"><button class="ow-btn ow-ghost" data-act="close">BACK</button></div>`);
        },

        openCreator(slot) {
            const SD = BO.OWRPGStatsData;
            const attrs = {};
            SD.ATTR_IDS.forEach((id) => { attrs[id] = SD.ATTR_BASE; });
            this.creator = { slot, name: '', attrs, points: SD.CREATION_POINTS, difficulty: 'tactical', primer: 'cryo_dart', compass: true, minimap: true };
            this._renderCreator();
        },

        _renderCreator() {
            const SD = BO.OWRPGStatsData;
            const c = this.creator;
            const attrRows = SD.ATTRS.map((a) => `
                <div class="ow-attr"><div class="ow-attr-name" style="--c:${ATTR_COL[a.id]}"><b>${a.name}</b><small>${a.desc}</small></div>
                <div class="ow-attr-ctl"><button class="ow-btn ow-sq" data-act="attrDown" data-v="${a.id}" ${c.attrs[a.id] <= 1 ? 'disabled' : ''}>−</button>
                <span class="ow-pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < c.attrs[a.id] ? 'on' : ''}" style="--c:${ATTR_COL[a.id]}"></i>`).join('')}</span><b class="ow-num">${c.attrs[a.id]}</b>
                <button class="ow-btn ow-sq" data-act="attrUp" data-v="${a.id}" ${c.points <= 0 || c.attrs[a.id] >= 10 ? 'disabled' : ''}>+</button></div></div>`).join('');
            const diffs = [['story', 'Story', 'Forgiving damage for exploring the narrative.'], ['tactical', 'Tactical', 'The intended balance.'], ['blackout', 'Blackout', 'Enemies hit hard; armor matters.']];
            const primers = Object.entries(SD.ABILITIES.primer);
            const name = c.name ? esc(c.name) : '';
            this.open('creator', `
                <div class="ow-head"><span class="ow-kicker">NEW OPERATIVE · SLOT ${c.slot + 1}</span><h2>Who walks into the Basin?</h2></div>
                <label class="ow-field">CALLSIGN<input data-act="cname" maxlength="16" placeholder="MERCER" value="${name}"></label>
                <div class="ow-sub">ATTRIBUTES <span class="ow-gold">${c.points} point${c.points === 1 ? '' : 's'} left</span></div>
                <div class="ow-attrs">${attrRows}</div>
                <div class="ow-two">
                  <div><div class="ow-sub">STARTING PRIMER</div><div class="ow-chips">${primers.map(([id, p]) => `<button class="ow-chip ${c.primer === id ? 'on' : ''}" data-act="primer" data-v="${id}" title="${esc(p.desc)}"><b>${p.name}</b><small>${p.desc}</small></button>`).join('')}</div></div>
                  <div><div class="ow-sub">DIFFICULTY</div><div class="ow-chips">${diffs.map(([id, n, d]) => `<button class="ow-chip ${c.difficulty === id ? 'on' : ''}" data-act="diff" data-v="${id}"><b>${n}</b><small>${d}</small></button>`).join('')}</div></div>
                </div>
                <div class="ow-sub">NAVIGATION HUD <span class="ow-dim">(change any time from the pause menu or Pip-Pad › System)</span></div>
                <div class="ow-chips ow-nav-opts">
                  <button class="ow-chip ${c.compass ? 'on' : ''}" data-act="navOpt" data-v="compass" aria-pressed="${c.compass}"><b>Compass · ${c.compass ? 'ON' : 'OFF'}</b><small>Cardinal strip with quest bearings, events and pins.</small></button>
                  <button class="ow-chip ${c.minimap ? 'on' : ''}" data-act="navOpt" data-v="minimap" aria-pressed="${c.minimap}"><b>Minimap · ${c.minimap ? 'ON' : 'OFF'}</b><small>Rotating fog-of-war minimap. [N] cycles range.</small></button>
                </div>
                <div class="ow-row ow-end"><button class="ow-btn ow-ghost" data-act="backSlots">BACK</button><button class="ow-btn ow-primary" data-act="begin">BEGIN OPERATION →</button></div>`);
            const inp = this.panel.querySelector('input[data-act="cname"]');
            if (inp && document.activeElement !== inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
        },

        /* ================================================== dialogue */
        openDialogue(npcId) {
            const s = this.s;
            const node = BO.OWRPGDialogue.entry(s, npcId);
            if (!node) return;
            this.dlg = { npc: npcId, node };
            this.M.setFlag('met_' + npcId, true);
            BO.Assets?.playClip?.('audio/overhaul/env/book_open.wav', { volume: 0.38, rateJitter: 0.06 });
            this._renderDialogue();
        },

        _renderDialogue() {
            const v = BO.OWRPGDialogue.view(this.s, this.dlg.npc, this.dlg.node);
            if (!v) { this._endDialogue(); return; }
            const fac = BO.OWRPGWorldData.NPCS.find((n) => n.id === this.dlg.npc)?.faction;
            const F = fac && BO.OWRPGFactionsData.FACTIONS[fac];
            this.dlg.choices = v.choices;
            const choices = v.choices.map((c, k) => `<button class="ow-choice ${c.ok ? '' : 'locked'}" data-act="choose" data-v="${k}" ${c.ok ? '' : 'disabled'}>
                <kbd>${k + 1}</kbd>${c.badge ? `<span class="ow-badge" style="--c:${ATTR_COL[c.badge] || '#cbd5e1'}">${c.ok ? 'PASS' : 'NEED ' + esc(c.reason)}</span>` : ''}<span>${esc(c.text)}</span></button>`).join('');
            this.open('dialogue', `
                <div class="ow-speaker" style="--c:${F ? F.color : '#f5a623'}"><b>${esc(v.speaker)}</b>${F ? `<small>${F.name} · ${BO.OWRPGFactions.tier(this.s, fac).name}</small>` : ''}</div>
                <p class="ow-line">${esc(v.text)}</p>
                <div class="ow-choices">${choices}</div>`);
        },

        _chooseDialogue(k) {
            const c = this.dlg && this.dlg.choices[k];
            if (!c || !c.ok) return;
            const next = BO.OWRPGDialogue.choose(this.s, this.dlg.npc, this.dlg.node, c.i);
            if (next === 'END') { this._endDialogue(); return; }
            this.dlg.node = next;
            this._renderDialogue();
        },

        _endDialogue() {
            this.dlg = null;
            this.close(true);
            this.M.refreshLoadout();
            if (this.M.pendingVendor) { const v = this.M.pendingVendor; this.M.pendingVendor = null; this.openVendor(v); }
        },

        /* ================================================== vendor / stash / travel */
        openVendor(id) {
            const s = this.s, I = BO.OWRPGInventory;
            const V = BO.OWRPGFactionsData.VENDORS[id];
            this.vendorId = id;
            if (!BO.OWRPGFactions.canTrade(s, id)) { this.M.toast(`${V.name} refuses to trade with you.`, '#f97316'); return; }
            const disc = BO.OWRPGFactions.vendorDiscount(s, V.faction);
            const stock = V.stock.map((itemId) => {
                const d = I.def(itemId), price = I.buyPrice(s, id, itemId);
                const req = d.req ? `<small class="${I.meetsReq(s, itemId) ? '' : 'ow-bad'}">Req ${d.req[0]} ${d.req[1]}</small>` : '';
                return `<div class="ow-item"><div><b style="color:${BO.OWRPGStatsData.RARITY[d.rarity || 'common'].color}">${esc(d.name)}</b><small>${d.type} · ${d.weight} kg</small>${req}</div>
                    <button class="ow-btn" data-act="buy" data-v="${itemId}" ${s.player.credits < price ? 'disabled' : ''}>${price} cr</button></div>`;
            }).join('');
            const mine = s.player.inventory.filter((e) => I.def(e.id).type !== 'quest').map((e) => `
                <div class="ow-item"><div><b style="color:${I.rarityColor(e)}">${esc(I.displayName(e))}</b><small>${Object.values(s.player.equipped).includes(e.uid) ? 'EQUIPPED' : I.def(e.id).type}</small></div>
                <button class="ow-btn ow-ghost" data-act="sell" data-v="${e.uid}">+${I.sellPrice(s, Object.assign({}, e, { n: 1 }))} cr</button></div>`).join('') || '<div class="ow-empty">Nothing to sell.</div>';
            this.open('vendor', `
                <div class="ow-head"><span class="ow-kicker">${esc(BO.OWRPGFactionsData.FACTIONS[V.faction].name)} · ${disc ? Math.round(disc * 100) + '% reputation discount' : 'standard prices'}</span><h2>${esc(V.name)}</h2>
                <p class="ow-dim">Credits: <b class="ow-gold">${s.player.credits}</b> · Relay Cells: ${s.player.relayCells} · Carry ${BO.OWRPGInventory.weight(s).toFixed(1)} / ${BO.OWRPGCharacter.derived(s).maxWeight} kg</p></div>
                <div class="ow-two"><div><div class="ow-sub">FOR SALE</div><div class="ow-list">${stock}</div></div><div><div class="ow-sub">YOUR PACK</div><div class="ow-list">${mine}</div></div></div>
                <div class="ow-row ow-end"><button class="ow-btn ow-primary" data-act="close">DONE</button></div>`);
        },

        openStash() {
            const s = this.s, I = BO.OWRPGInventory;
            const row = (e, act, label) => `<div class="ow-item"><div><b style="color:${I.rarityColor(e)}">${esc(I.displayName(e))}</b><small>${I.entryWeight(e).toFixed(1)} kg</small></div><button class="ow-btn ow-ghost" data-act="${act}" data-v="${e.uid}">${label}</button></div>`;
            const inv = s.player.inventory.filter((e) => I.def(e.id).type !== 'quest' && !Object.values(s.player.equipped).includes(e.uid)).map((e) => row(e, 'stashIn', 'STORE →')).join('') || '<div class="ow-empty">Nothing to store.</div>';
            const st = s.player.stash.map((e) => row(e, 'stashOut', '← TAKE')).join('') || '<div class="ow-empty">Stash is empty.</div>';
            this.open('vendor', `<div class="ow-head"><span class="ow-kicker">FREESTEAD</span><h2>Personal Stash</h2><p class="ow-dim">Stored items weigh nothing. Carry ${I.weight(s).toFixed(1)} / ${BO.OWRPGCharacter.derived(s).maxWeight} kg</p></div>
                <div class="ow-two"><div><div class="ow-sub">PACK</div><div class="ow-list">${inv}</div></div><div><div class="ow-sub">STASH</div><div class="ow-list">${st}</div></div></div>
                <div class="ow-row ow-end"><button class="ow-btn ow-primary" data-act="close">DONE</button></div>`);
        },

        openTravel(fromId) {
            const s = this.s;
            const rows = BO.OWRPGWorldData.PYLONS.map((p) => {
                const on = s.pylons[p.id];
                return `<div class="ow-item"><div><b>${esc(p.name)}</b><small>${BO.OWRPGWorldData.REGIONS.find((r) => r.id === p.region).name}${on ? '' : ' · offline'}</small></div>
                    ${p.id === fromId ? '<span class="ow-dim">YOU ARE HERE</span>' : `<button class="ow-btn" data-act="travel" data-v="${p.id}" ${on && s.player.relayCells > 0 ? '' : 'disabled'}>JUMP · 1 CELL</button>`}</div>`;
            }).join('');
            this.open('vendor', `<div class="ow-head"><span class="ow-kicker">TRANSIT NETWORK</span><h2>Pylon Jump</h2><p class="ow-dim">Relay Cells: <b class="ow-gold">${s.player.relayCells}</b>. Wake new pylons by touching their coils.</p></div>
                <div class="ow-list">${rows}</div><div class="ow-row ow-end"><button class="ow-btn ow-primary" data-act="close">CANCEL</button></div>`);
        },

        showDeath() {
            this.deathOpen = true;
            this.open('death', `<div class="ow-head ow-center"><span class="ow-kicker" style="color:#ef4444">K.I.A.</span><h2>You died in the Expanse</h2>
                <p class="ow-dim">Last save: ${esc(this.M.lastSaveLabel || 'none')}</p></div>
                <div class="ow-row ow-center"><button class="ow-btn ow-primary" data-act="deathLoad">LOAD LAST SAVE</button>
                <button class="ow-btn" data-act="deathRespawn">WAKE IN FREESTEAD (−15% CREDITS)</button><button class="ow-btn ow-ghost" data-act="deathMenu">MAIN MENU</button></div>`, { closable: false });
        },

        openPipPad(tab, respec) { if (BO.OWRPGPipPad) BO.OWRPGPipPad.open(tab, respec); },
        toggleDev() { if (BO.OWRPGPipPad) BO.OWRPGPipPad.open('dev'); },

        /* ================================================== HUD */
        showHud() { this.init(); this.hud.classList.remove('hidden'); this._last = {}; },

        _set(id, val, prop = 'textContent') {
            if (this._last[id + prop] === val) return;
            this._last[id + prop] = val;
            const el = this.root.querySelector('#' + id);
            if (el) el[prop] = val;
        },

        updateHud() {
            if (!this.root || !this.M.active || !this.s) return;
            const s = this.s, p = s.player, C = BO.OWRPGCharacter;
            const need = C.xpToNext(s);
            this._set('ow-lvl', 'LV ' + p.level);
            this._set('ow-xpnum', p.level >= BO.OWRPGStatsData.LEVEL_CAP ? 'MAX' : `${p.xp} / ${need} XP${p.perkPoints || p.attrPoints ? ' · ★' : ''}`);
            this._set('ow-xpfill', `width:${Math.min(100, (p.xp / need) * 100).toFixed(1)}%`, 'style');
            const enc = C.encumbrance(s);
            this._set('ow-cr', `◈ ${p.credits} cr`);
            this._set('ow-cells', `⚡ ${p.relayCells}`);
            this._set('ow-enc', `${enc.weight.toFixed(0)}/${enc.max} kg · ${enc.label}`);
            this._set('ow-clock', `${BO.OWRPGWorldSim.timeLabel()} · ${(BO.OWRPGWorldSim.region || {}).name || ''}`);
            // Quest tracker: up to three tracked quests with live distance to their marker.
            const trackedList = this.trackedQuests();
            const tracked = trackedList[0] || null;
            this._set('ow-quest', this._trackerHtml(trackedList), 'innerHTML');
            // Shrine blessing.
            const bl = p.blessing && p.blessing.until > s.playtimeSec ? p.blessing : null;
            this._set('ow-blessing', bl ? `<b style="color:${bl.color}">✧ ${esc(bl.name)}</b><span>${Math.ceil((bl.until - s.playtimeSec) / 60)} min</span>` : '', 'innerHTML');
            this._set('ow-blessing', bl ? 'ow-blessing' : 'ow-blessing hidden', 'className');
            // Stealth eye.
            const aw = BO.OWRPGAI.awareness();
            const lbl = aw > 1 ? 'COMBAT' : aw >= 0.35 ? 'SUSPICIOUS' : this.M.camoT > 0 ? 'CLOAKED' : 'HIDDEN';
            this._set('ow-eye-label', lbl);
            this._set('ow-eye', 'ow-eye ow-eye-' + lbl.toLowerCase(), 'className');
            this._set('ow-camo', this.M.camoT > 0 ? 'ow-camo' : 'ow-camo hidden', 'className');
            // Prompt.
            const pr = this.M.prompt;
            const key = (BO.Settings.getKeybinds().interact || 'KeyE').replace('Key', '');
            this._set('ow-prompt', pr ? `<kbd>${key}</kbd> ${esc(pr.text)}` : '', 'innerHTML');
            this._set('ow-prompt', pr ? 'ow-prompt' : 'ow-prompt hidden', 'className');
            // Abilities + Ultimate + Med + Tool.
            const kb = BO.Settings.getKeybinds();
            const cd = BO.OWRPGCombat.cd;
            const A = BO.OWRPGStatsData.ABILITIES;
            const meds = BO.OWRPGInventory.count(s, 'medkit');
            const eqTool = BO.OWRPGInventory.equippedEntry(s, 'tool');
            const toolDef = eqTool ? BO.OWRPGInventory.def(eqTool.id) : null;
            const slot = (k, name, t, extra = '') => `<div class="ow-ab ${t > 0 ? 'cd' : ''}"><kbd>${k}</kbd><b>${esc(name)}</b>${t > 0 ? `<i>${Math.ceil(t)}</i>` : ''}${extra}</div>`;
            const kn = (c) => (c || '').replace('Key', '').replace('Digit', '');
            const primDef = A.primer[p.abilities.primer];
            const detDef = A.detonator[p.abilities.detonator];
            const gadDef = A.gadget[p.abilities.gadget];
            const ultDef = A.ultimate && A.ultimate[p.abilities.ultimate];
            this._set('ow-abilities',
                (primDef ? slot(kn(kb.owAbility1), primDef.name, cd.primer, BO.OWRPGCombat.primerCharges > 0 && cd.primer > 0 ? '<em>+1</em>' : '') : '') +
                (detDef ? slot(kn(kb.owAbility2), detDef.name, cd.detonator) : '') +
                (gadDef ? slot(kn(kb.owGadget), gadDef.name, cd.gadget) : '') +
                (ultDef ? slot(kn(kb.owUltimate || 'KeyU'), ultDef.name, cd.ultimate || 0, BO.OWRPGCombat.overdriveT > 0 ? '<em>SURGE</em>' : '') : '') +
                slot(kn(kb.owMed), `Med ×${meds}`, 0) +
                slot(kn(kb.owRepair || 'KeyG'), toolDef ? toolDef.name : 'Repair', 0), 'innerHTML');

            // Boss HUD bar.
            const boss = BO.OWRPGAI.agents.find((a) => a.alive && a.boss && (a.state === 'combat' || BO.Math.dist2D(a.ent.pos.x, a.ent.pos.z, BO.Player.pos.x, BO.Player.pos.z) < 75));
            if (boss) {
                const pct = Math.max(0, Math.min(100, (boss.ent.hp / boss.ent.maxHp) * 100));
                const stBadges = Object.keys(boss.st || {}).map((stId) => `<span style="color:${BO.OWRPGStatsData.STATUSES[stId]?.color || '#fff'}">${stId.toUpperCase()}</span>`).join(' ');
                this._set('ow-boss', `<div class="ow-boss-top"><b>☠ ${esc(boss.name)} · LV ${boss.lvl}</b><span>${Math.round(boss.ent.hp)} / ${boss.ent.maxHp} ${stBadges}</span></div><div class="ow-boss-bar"><i style="width:${pct.toFixed(1)}%"></i></div>`, 'innerHTML');
                this._set('ow-boss', 'ow-boss', 'className');
            } else {
                this._set('ow-boss', 'ow-boss hidden', 'className');
            }

            // Dynamic World Event HUD card.
            const ev = BO.OWRPGEvents?.activeEvent;
            if (ev) {
                const dist = Math.round(BO.Math.dist2D(BO.Player.pos.x, BO.Player.pos.z, ev.x, ev.z));
                this._set('ow-event', `<b style="color:${ev.color}">⚡ EVENT: ${esc(ev.title)} (${dist}m)</b><span>${esc(ev.desc)} · ${ev.remaining}/${ev.total} left · ${Math.ceil(ev.t)}s</span>`, 'innerHTML');
                this._set('ow-event', 'ow-event', 'className');
            } else {
                this._set('ow-event', 'ow-event hidden', 'className');
            }

            // Mount status & turbo boost bar.
            const Mnt = BO.OWRPGMounts;
            if (Mnt?.mounted && Mnt.activeId) {
                const mDef = Mnt.defs[Mnt.activeId];
                this._set('ow-mount', `<div><b>🏍 ${esc(mDef?.name || 'Mount')}</b><span>${Mnt.speed.toFixed(1)} m/s · [T] Dismount</span></div><div class="ow-mount-bar"><i style="width:${Math.round(Mnt.boostFuel)}%"></i></div>`, 'innerHTML');
                this._set('ow-mount', 'ow-mount', 'className');
            } else {
                this._set('ow-mount', 'ow-mount hidden', 'className');
            }

            // Kinetic barrier bar.
            if (BO.OWRPGCombat.barrierHp > 0 && BO.OWRPGCombat.barrierT > 0) {
                this._set('ow-barrier', `🛡 BARRIER: <b>${Math.ceil(BO.OWRPGCombat.barrierHp)}</b> (${Math.ceil(BO.OWRPGCombat.barrierT)}s)`, 'innerHTML');
                this._set('ow-barrier', 'ow-barrier', 'className');
            } else {
                this._set('ow-barrier', 'ow-barrier hidden', 'className');
            }

            // Low durability warning.
            const Dur = BO.OWRPGDurability;
            const worn = Dur && ['primary', 'secondary', 'helmet', 'rig', 'boots', 'relic'].some((sl) => {
                const it = BO.OWRPGInventory.equippedEntry(s, sl);
                return it && Dur.ratio(it) <= 0.25;
            });
            if (worn) {
                this._set('ow-dur-warn', `⚠ GEAR WORN — PRESS [${kn(kb.owRepair || 'KeyG')}] OR TAB TO REPAIR`, 'textContent');
                this._set('ow-dur-warn', 'ow-dur-warn', 'className');
            } else {
                this._set('ow-dur-warn', 'ow-dur-warn hidden', 'className');
            }

            this._set('ow-compass', this._compassHtml(tracked), 'innerHTML');
            this._updateFloats();
        },

        /** Active quests the HUD follows: the player's picks (max 3), else the most recent active quest. */
        trackedQuests() {
            const s = this.s;
            if (!s) return [];
            const f = s.worldFlags;
            if (!Array.isArray(f.trackedQuests)) f.trackedQuests = f.trackedQuest ? [f.trackedQuest] : [];
            const list = f.trackedQuests.filter((id) => s.quests[id] && s.quests[id].state === 'active').slice(0, 3);
            if (list.length !== f.trackedQuests.length) f.trackedQuests = list;
            if (list.length) return list;
            const active = Object.keys(s.quests).filter((id) => s.quests[id].state === 'active');
            return active.length ? [active.sort((a, b) => (s.quests[b].startedAt || 0) - (s.quests[a].startedAt || 0))[0]] : [];
        },

        toggleTrack(id) {
            const f = this.s.worldFlags;
            const list = this.trackedQuests().filter((q) => f.trackedQuests.includes(q));
            const i = list.indexOf(id);
            if (i >= 0) list.splice(i, 1);
            else { list.unshift(id); if (list.length > 3) list.length = 3; }
            f.trackedQuests = list;
            f.trackedQuest = list[0] || null;
        },

        _trackerHtml(list) {
            const s = this.s, P = BO.Player, Q = BO.OWRPGQuests, C = BO.OWRPGCartography;
            if (!list.length) return '<div class="ow-qt"><b>No active quest</b><span>Talk to the people of Freestead, or explore — hidden sites start quests too.</span></div>';
            const KIND = { main: '#f5a623', faction: '#38bdf8', side: '#a3e635', contract: '#f87171', delve: '#c084fc', explore: '#fbbf24' };
            return list.map((id, i) => {
                const d = Q.def(id);
                const m = Q.markers(s).find((k) => k.quest === id);
                const tgt = m && C ? C.questTarget(m.poi) : null;
                const dist = tgt ? Math.round(Math.hypot(tgt.x - P.pos.x, tgt.z - P.pos.z)) : null;
                return `<div class="ow-qt ${i ? 'ow-qt-sub' : ''}" style="--k:${KIND[d.kind] || '#f5a623'}"><b>${esc(d.name)}${dist != null ? `<em>${dist} m</em>` : ''}</b><span>${esc(Q.objective(s, id))}</span></div>`;
            }).join('');
        },

        /** Pins, active World Event, and tracked quest as bearings on a ±70° strip under the compass. */
        _compassHtml(tracked) {
            const s = this.s, P = BO.Player, D = BO.OWRPGWorldData;
            if (s.worldFlags.compassEnabled === false) return '';
            const marks = s.pins.map((p) => ({ x: p[0], z: p[1], c: '#f472b6', g: '✚' }));
            if (BO.OWRPGEvents?.activeEvent) {
                const ev = BO.OWRPGEvents.activeEvent;
                marks.push({ x: ev.x, z: ev.z, c: ev.color || '#38bdf8', g: '⚡' });
            }
            if (s.worldFlags.compassQuest) for (const tq of this.trackedQuests()) {
                const m = BO.OWRPGQuests.markers(s).find((k) => k.quest === tq);
                const poi = m && D.POIS.find((p) => p.id === m.poi);
                if (poi) {
                    let target = poi;
                    if (poi.interior && !D.isInterior(P.pos.x, P.pos.z)) target = D.DUNGEONS.find(d => d.id === poi.id)?.surf || poi;
                    if (D.isInterior(P.pos.x, P.pos.z) && (!poi.interior || Math.hypot(poi.x-P.pos.x, poi.z-P.pos.z) > 130)) {
                        const dungeon = D.DUNGEONS.find(d => Math.hypot(P.pos.x-d.x, P.pos.z-d.z) < 130);
                        if (dungeon) target = { x: dungeon.x, z: dungeon.z - 4.5 };
                    }
                    marks.push({ x: target.x, z: target.z, c: '#a3e635', g: '◆' });
                }
            }
            const fwd = Math.atan2(-Math.sin(P.yaw), -Math.cos(P.yaw));
            const cardinal = [['N', Math.PI], ['NE', Math.PI*0.75], ['E', Math.PI/2], ['SE', Math.PI/4], ['S', 0], ['SW', -Math.PI/4], ['W', -Math.PI/2], ['NW', -Math.PI*0.75]].map(([name, angle]) => {
                const deg = -BO.Math.wrapAngle(angle-fwd) * 180/Math.PI;
                return Math.abs(deg) <= 70 ? '<b class="ow-bearing" style="left:' + (50+deg/70*50) + '%">' + name + '</b>' : '';
            }).join('');
            return '<span class="ow-compass-needle">▾</span>' + cardinal + marks.map((m) => {
                const ang = BO.Math.wrapAngle(Math.atan2(m.x - P.pos.x, m.z - P.pos.z) - fwd);
                const deg = -ang * 180 / Math.PI;
                if (Math.abs(deg) > 70) return '';
                const dist = Math.round(Math.hypot(m.x - P.pos.x, m.z - P.pos.z));
                return `<i style="left:${50 + (deg / 70) * 50}%;color:${m.c}" title="${dist} m">${m.g}</i>`;
            }).join('');
        },

        xpPop(n, label) {
            if (!this.root) return;
            const el = document.createElement('div');
            el.className = 'ow-pop';
            el.textContent = `+${n} XP${label ? ' · ' + label : ''}`;
            this.root.querySelector('#ow-pops').appendChild(el);
            setTimeout(() => el.remove(), 2200);
        },

        lootToast(loot, source) {
            const parts = loot.items.map((it) => `${BO.OWRPGStatsData.ITEMS[it.id].name}${it.n > 1 ? ' ×' + it.n : ''}`);
            if (loot.credits) parts.unshift(loot.credits + ' cr');
            BO.Events.emit('hud:toast', { text: parts.length ? `${source}: ${parts.join(', ')}` : `${source}: empty`, color: '#fbbf24' });
        },

        floatDamage(agent, dmg, crit, kind) {
            if (!this.root || this.floats.length > 24) return;
            const el = document.createElement('div');
            const col = { burn: '#f97316', chill: '#38bdf8', shock: '#facc15', venom: '#84cc16', void: '#c084fc', expose: '#f472b6', sneak: '#a3e635' }[kind] || (crit ? '#fde047' : '#f8fafc');
            el.className = 'ow-float' + (crit ? ' crit' : '');
            el.style.color = col;
            el.textContent = Math.round(dmg) + (kind === 'sneak' ? ' SNEAK' : '');
            this.root.querySelector('#ow-floats').appendChild(el);
            this.floats.push({ el, pos: agent.ent.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 2 + Math.random() * 0.4, 0)), t: 0.9 });
        },

        _updateFloats() {
            const now = performance.now();
            const dt = this._lastFloatT ? Math.min(0.05, Math.max(0.001, (now - this._lastFloatT) / 1000)) : (1 / 60);
            this._lastFloatT = now;
            const cam = this.M.camera;
            const w = window.innerWidth, h = window.innerHeight;
            for (let i = this.floats.length - 1; i >= 0; i--) {
                const f = this.floats[i];
                f.t -= dt;
                f.pos.y += dt * 1.2;
                _v.copy(f.pos).project(cam);
                if (f.t <= 0 || _v.z > 1) { f.el.remove(); this.floats.splice(i, 1); continue; }
                f.el.style.transform = `translate(${((_v.x + 1) / 2) * w}px, ${((1 - _v.y) / 2) * h}px)`;
                f.el.style.opacity = Math.min(1, f.t * 2.5);
            }
        }
    };

    BO.OWRPGUI = UI;
})(window.BO);
;

/* --- src/ui/OWRPGPipPad.js --- */
/* ============================================================================
   BLACKOUT OPS — Open World RPG · Pip-Pad (diegetic wrist terminal)
   Tabs: Character · Mastery · Perks · Inventory · Abilities · Mounts · Quests ·
   Bounties · Codex · Map · Atlas · Factions · System, plus the [F8] Dev overlay.
   Rendered into OWRPGUI's modal; clicks route through data-act handlers.
============================================================================ */
(function (BO) {
    'use strict';

    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const TABS = [
        ['character', 'Character', 'staged_assets/ui/military_icons/Field Gear/ballistic-document-clipboard-001.png'],
        ['mastery', 'Mastery', 'staged_assets/ui/fantasy_rpg_icons/Classes/warrior-class-001.png'],
        ['perks', 'Perks', 'staged_assets/ui/scifi_icons/Power Cores/amber-overdrive-cell-001.png'],
        ['inventory', 'Inventory', 'staged_assets/ui/military_icons/Field Gear/assault-day-pack-001.png'],
        ['abilities', 'Abilities', 'staged_assets/ui/scifi_icons/Gadgets/acoustic-hull-probe-001.png'],
        ['mounts', 'Mounts', 'staged_assets/ui/military_icons/Vehicles/recon-dirt-bike-001.png'],
        ['quests', 'Quests', 'staged_assets/ui/military_icons/Maps Data/fire-support-target-card-001.png'],
        ['bounties', 'Bounties', 'staged_assets/ui/fantasy_rpg_icons/Classes/bounty-hunter-class-001.png'],
        ['codex', 'Codex', 'staged_assets/ui/military_icons/Field Gear/encrypted-field-notebook-001.png'],
        ['map', 'Map', 'staged_assets/ui/military_icons/Optics Sensors/compact-binocular-optic-001.png'],
        ['atlas', 'Atlas', 'staged_assets/ui/fantasy_rpg_icons/Items/protection-scroll-001.png'],
        ['factions', 'Factions', 'staged_assets/ui/military_icons/Communications/antenna-relay-puck-001.png'],
        ['system', 'System', 'staged_assets/ui/dieselpunk_icons/Tools/antenna-splice-kit-001.png']
    ];
    const ATTR_COL = { BRW: '#f97316', RFX: '#a3e635', TCH: '#38bdf8', PRC: '#facc15', PRS: '#f472b6' };
    const ELEM_BADGE = {
        kinetic: { label: 'KINETIC', color: '#cbd5e1' },
        burn: { label: 'BURN', color: '#f97316' },
        chill: { label: 'CHILL', color: '#38bdf8' },
        shock: { label: 'SHOCK', color: '#facc15' },
        venom: { label: 'VENOM', color: '#84cc16' },
        void: { label: 'VOID', color: '#c084fc' }
    };

    const Pad = {
        tab: 'character',
        get UI() { return BO.OWRPGUI; },
        get s() { return BO.OWRPGMode.state; },

        open(tab, respec) {
            this.tab = tab || this.tab;
            this.respecMode = !!respec;
            this.render();
        },

        render() {
            const nav = TABS.map(([id, n, ico]) => `<button class="ow-tab ${this.tab === id ? 'on' : ''}" data-act="padTab" data-v="${id}"><img src="${ico}" alt="" style="width:15px;height:15px;object-fit:contain;vertical-align:-2px;margin-right:5px;border-radius:3px">${n}</button>`).join('');
            const body = this['_' + this.tab] ? this['_' + this.tab]() : '';
            const p = this.s.player;
            this.UI.open('pippad', `
                <div class="ow-pad-top"><div><span class="ow-kicker">PIP-PAD · ${esc(p.name)}</span><b class="ow-pad-lv">Level ${p.level}${p.perkPoints ? ` · <span class="ow-gold">${p.perkPoints} perk pt</span>` : ''}${p.attrPoints ? ` · <span class="ow-gold">${p.attrPoints} attr pt</span>` : ''}</b></div>
                <button class="ow-btn ow-ghost" data-act="close">CLOSE [Tab]</button></div>
                <nav class="ow-tabs">${nav}${this.tab === 'dev' ? '<button class="ow-tab on">Dev</button>' : ''}</nav>
                <div class="ow-pad-body">${body}</div>`);
            if (this.tab === 'map') this._drawMap();
        },

        handleKey(e) {
            const i = TABS.findIndex(([id]) => id === this.tab);
            if (e.code === 'KeyQ' || e.code === 'KeyE') { this.tab = TABS[(i + (e.code === 'KeyE' ? 1 : TABS.length - 1)) % TABS.length][0]; this.render(); }
        },

        /* ------------------------------------------------ tabs */
        _character() {
            const s = this.s, SD = BO.OWRPGStatsData, C = BO.OWRPGCharacter, I = BO.OWRPGInventory;
            const d = C.derived(s), enc = C.encumbrance(s), p = s.player;
            const rows = SD.ATTRS.map((a) => `<div class="ow-attr"><div class="ow-attr-name" style="--c:${ATTR_COL[a.id]}"><b>${a.name}</b><small>${a.desc}</small></div>
                <div class="ow-attr-ctl"><span class="ow-pips">${Array.from({ length: SD.ATTR_MAX }, (_, i) => `<i class="${i < C.attr(s, a.id) ? 'on' : ''}" style="--c:${ATTR_COL[a.id]}"></i>`).join('')}</span><b class="ow-num">${C.attr(s, a.id)}</b>
                <button class="ow-btn ow-sq" data-act="raise" data-v="${a.id}" ${p.attrPoints > 0 && C.attr(s, a.id) < SD.ATTR_MAX ? '' : 'disabled'}>+</button></div></div>`).join('');
            const stat = (k, v) => `<div class="ow-stat"><small>${k}</small><b>${v}</b></div>`;
            const res = d.elemRes || {};
            const resPills = ['burn', 'chill', 'shock', 'venom', 'void'].map((el) => {
                const pct = Math.round((res[el] || 0) * 100);
                return `<span class="ow-elem-pill" style="--c:${ELEM_BADGE[el].color}">${ELEM_BADGE[el].label} RES <b>${pct}%</b></span>`;
            }).join('');
            const slotOrder = [['helmet', 'HELMET'], ['rig', 'ARMOR RIG'], ['boots', 'BOOTS'], ['relic', 'RELIC'], ['tool', 'FIELD TOOL [G]']];
            const doll = slotOrder.map(([sl, lbl]) => {
                const e = I.equippedEntry(s, sl);
                const def = e ? I.def(e.id) : null;
                const durPct = e && BO.OWRPGDurability ? Math.round(BO.OWRPGDurability.ratio(e) * 100) : 100;
                return `<div class="ow-doll-slot"><small>${lbl}</small><b>${def ? esc(def.name) : '<span class="ow-dim">Empty</span>'}</b>${e ? `<em style="color:${BO.OWRPGDurability?.badgeColor(durPct / 100) || '#4ade80'}">${durPct}%</em>` : ''}</div>`;
            }).join('');
            const setsHtml = (d.activeSets || []).length
                ? d.activeSets.map((st) => `<div class="ow-set-card" style="--c:${st.color}"><b>${esc(st.name)} (${st.count}/3)</b><small>${st.tiers.length ? st.tiers.map(esc).join(' · ') : 'Equip 2+ pieces for set bonus'}</small></div>`).join('')
                : '<div class="ow-empty">Equip matching set armor (Warden Vanguard, Ironclad Juggernaut, Ghost Stalker, Meridian Arc-Tech) to unlock 2-pc &amp; 3-pc bonuses.</div>';
            return `<div class="ow-two"><div><div class="ow-sub">ATTRIBUTES ${p.attrPoints ? `<span class="ow-gold">${p.attrPoints} to spend</span>` : ''}</div><div class="ow-attrs">${rows}</div>
                <div class="ow-sub">ARMOR PAPER-DOLL &amp; TOOL</div><div class="ow-paperdoll">${doll}</div></div>
                <div><div class="ow-sub">DERIVED</div><div class="ow-stats">
                ${stat('Max HP', d.maxHp)}${stat('Armor', d.armor)}${stat('Carry', `${enc.weight.toFixed(1)} / ${d.maxWeight} kg (${enc.label})`)}
                ${stat('Weakspot ×', d.critMult.toFixed(2))}${stat('Sneak attack ×', d.stealthMult.toFixed(2))}${stat('Cooldowns', Math.round(d.cdMult * 100) + '%')}
                ${stat('Status potency', Math.round(d.statusPotency * 100) + '%')}${stat('Noise', Math.round(d.noiseMult * 100) + '%')}${stat('Buy prices', Math.round(d.buyMult * 100) + '%')}
                ${stat('Reputation gains', Math.round(d.repMult * 100) + '%')}${stat('XP', `${p.xp} / ${C.xpToNext(s)}`)}${stat('Credits', p.credits)}</div>
                <div class="ow-sub">ELEMENTAL RESISTANCES</div><div class="ow-elem-row">${resPills}</div>
                <div class="ow-sub">ACTIVE SET BONUSES</div>${setsHtml}
                <div class="ow-sub">RECORD</div><div class="ow-stats">${stat('Kills', s.stats.kills)}${stat('Sneak kills', s.stats.sneakKills)}${stat('Reactions', s.stats.reactions)}${stat('Events cleared', s.stats.eventsCleared || 0)}${stat('Discovered', s.stats.discovered)}${stat('Played', Math.round(s.playtimeSec / 60) + ' min')}</div></div></div>`;
        },

        _mastery() {
            const s = this.s, SD = BO.OWRPGStatsData, C = BO.OWRPGCharacter;
            const skills = Object.entries(SD.SKILLS).map(([id, def]) => {
                const sk = C.skill(s, id), cap = sk.level >= SD.SKILL_CAP;
                const need = SD.skillXpToNext(sk.level);
                return '<article class="ow-mastery" style="--c:' + def.color + '"><div><b>' + def.icon + ' ' + def.name + '</b><strong>LV ' + sk.level + '</strong></div><p>' + def.desc + '</p><progress max="' + need + '" value="' + (cap ? need : sk.xp) + '" aria-label="' + def.name + ' progress"></progress><small>' + (cap ? 'MASTERED' : sk.xp + ' / ' + need + ' XP') + '</small></article>';
            }).join('');
            const stone = SD.STANDING_STONES[s.player.standingStone];
            return '<p class="ow-dim">Skills grow through practice and persist with your character. Bonuses begin at level 2. Character levels have a separate, demanding XP curve.</p><div class="ow-mastery-grid">' + skills + '</div><div class="ow-sub">STANDING STONE</div><div class="ow-item"><div><b>' + (stone ? stone.name : 'No blessing active') + '</b><small>' + (stone ? stone.desc : 'Find a standing stone in the frontier to receive its blessing. Attuning to another stone replaces your current blessing.') + '</small></div></div>';
        },

        _perks() {
            const s = this.s, SD = BO.OWRPGStatsData, C = BO.OWRPGCharacter;
            const trees = Object.entries(SD.PERK_TREES).map(([tid, t]) => `<div class="ow-tree" style="--c:${t.color}"><h3>${t.name}</h3>${t.tiers.map((pair, ti) => `
                <div class="ow-tier"><small>LV ${SD.TIER_LEVELS[ti]}</small><div class="ow-xor">${pair.map((pk) => {
                const owned = s.player.perks.includes(pk.id), why = C.perkBlock(s, pk.id);
                return `<button class="ow-perk ${owned ? 'owned' : ''} ${!owned && why ? 'locked' : ''}" data-act="perk" data-v="${pk.id}" ${owned || why ? 'disabled' : ''} title="${esc(why)}"><b>${pk.name}</b><small>${pk.desc}</small>${!owned && why ? `<em>${why}</em>` : ''}</button>`;
            }).join('<span class="ow-or">OR</span>')}</div></div>`).join('')}</div>`).join('');
            const cost = C.respecCost(s);
            const respec = this.respecMode ? `<div class="ow-note">Medic Ines can retrain you. Cost: <b class="ow-gold">${cost} cr</b>. <button class="ow-btn" data-act="respec" ${s.player.credits >= cost && s.player.perks.length ? '' : 'disabled'}>RESPEC PERKS</button></div>` : '';
            return `${respec}<p class="ow-dim">One perk point every even level. Each tier is a choice: taking one perk locks the other. Tiers need the previous tier of the same tree.</p><div class="ow-trees">${trees}</div>`;
        },

        _inventory() {
            const s = this.s, I = BO.OWRPGInventory, SD = BO.OWRPGStatsData, Dur = BO.OWRPGDurability;
            const eq = s.player.equipped;
            const groups = { weapon: [], helmet: [], rig: [], boots: [], relic: [], tool: [], consumable: [], junk: [], quest: [] };
            let totalRepair = 0;
            for (const slot of ['primary', 'secondary', 'helmet', 'rig', 'boots', 'relic', 'tool']) {
                const it = eq[slot] ? I.byUid(s, eq[slot]) : null;
                if (it && Dur) totalRepair += Dur.repairCost(s, it);
            }
            for (const e of s.player.inventory) {
                const d = I.def(e.id);
                if (!d) continue;
                if (Dur && Dur.supports(d.type)) Dur.initItem(e);
                (groups[d.type] || groups.junk).push(e);
            }
            const row = (e) => {
                const d = I.def(e.id);
                const isEq = Object.values(eq).includes(e.uid);
                let info = `${I.entryWeight(e).toFixed(1)} kg`;
                let rpgInspector = '';
                let durBar = '';
                if (Dur && Dur.supports(d.type) && e.maxDur) {
                    const r = Dur.ratio(e);
                    const pct = Math.round(r * 100);
                    durBar = `<div class="ow-dur-wrap"><span class="ow-durbar"><i style="width:${pct}%;background:${Dur.badgeColor(r)}"></i></span><small>${Math.round(e.dur)}/${e.maxDur} dur (${pct}%)</small></div>`;
                }
                if (d.type === 'weapon') {
                    const ws = I.weaponStats(e), base = BO.WeaponsData.get(d.base);
                    const gs = BO.OWRPGExpansionData?.getGunStats?.(d.base) || {};
                    const eb = ELEM_BADGE[ws.element] || ELEM_BADGE.kinetic;
                    const traitName = (BO.OWRPGExpansionData?.PASSIVE_TRAITS?.[ws.passiveTrait]?.name) || '';
                    info = `${base.category} · ${Math.round(base.damage * ws.dmgMult)} RPG dmg · ${(e.mfr || '')} ${(e.affixes || []).map((a) => SD.AFFIXES[a]?.name || a).join(', ')} · ${info}`;
                    rpgInspector = `<div class="ow-gun-insp"><span class="ow-elem-pill" style="--c:${eb.color}">${eb.label}${ws.elemDmg ? ' +' + Math.round(ws.elemDmg) : ''}</span>` +
                        `<span>Crit ${Math.round((ws.critChance || 0.08) * 100)}% (+${Math.round((ws.critAdd || 0) * 100)}%)</span>` +
                        `<span>Pen ${ws.pen || 0}</span>` +
                        (traitName ? `<span title="${esc(gs.passiveDesc || ws.passiveDesc || '')}">★ ${esc(traitName)}</span>` : '') +
                        `</div>`;
                } else if (d.type === 'helmet' || d.type === 'rig' || d.type === 'boots' || d.type === 'relic') {
                    const as = I.armorStats(e);
                    const resList = Object.entries(d.elemRes || {}).map(([k, v]) => `${k.toUpperCase()} +${Math.round(v * 100)}%`).join(', ');
                    const setName = d.setId && BO.OWRPGExpansionData?.ARMOR_SETS?.[d.setId]?.name;
                    info = `${as.armor} armor${setName ? ' · Set: ' + setName : ''}${resList ? ' · ' + resList : ''} · ${info}`;
                } else if (d.desc) {
                    info = d.desc + ' · ' + info;
                }
                const req = d.req && !I.meetsReq(s, e.id) ? `<em class="ow-bad">Req ${d.req[0]} ${d.req[1]}</em>` : '';
                let btns = '';
                if (d.type === 'weapon') btns = `<button class="ow-btn ow-sm" data-act="equip" data-v="${e.uid}|primary" ${eq.primary === e.uid ? 'disabled' : ''}>PRIMARY</button><button class="ow-btn ow-sm" data-act="equip" data-v="${e.uid}|secondary" ${eq.secondary === e.uid ? 'disabled' : ''}>SIDEARM</button>`;
                if (d.type === 'helmet' || d.type === 'rig' || d.type === 'boots' || d.type === 'relic') btns = `<button class="ow-btn ow-sm" data-act="equip" data-v="${e.uid}|${d.type}" ${eq[d.type] === e.uid ? 'disabled' : ''}>EQUIP</button>`;
                if (d.type === 'tool') btns = `<button class="ow-btn ow-sm" data-act="equip" data-v="${e.uid}|tool" ${eq.tool === e.uid ? 'disabled' : ''}>SLOT [G]</button><button class="ow-btn ow-sm" data-act="useTool" data-v="${e.uid}">USE</button>`;
                if (d.type === 'consumable' && e.id !== 'relay_cell') btns = `<button class="ow-btn ow-sm" data-act="use" data-v="${e.uid}">USE</button>`;
                const repCost = Dur && Dur.supports(d.type) ? Dur.repairCost(s, e) : 0;
                if (repCost > 0) btns += `<button class="ow-btn ow-sm" data-act="repairItem" data-v="${e.uid}" ${s.player.credits >= repCost ? '' : 'disabled'}>REPAIR ${repCost}cr</button>`;
                if (d.type !== 'quest' && !isEq) btns += `<button class="ow-btn ow-sm ow-ghost" data-act="salvage" data-v="${e.uid}">SALVAGE</button><button class="ow-btn ow-sm ow-ghost" data-act="drop" data-v="${e.uid}">DROP</button>`;
                return `<div class="ow-item ${isEq ? 'eq' : ''}"><div><b style="color:${I.rarityColor(e)}">${esc(I.displayName(e))}${isEq ? ' <span class="ow-tagx">EQUIPPED</span>' : ''}</b><small>${esc(info)}</small>${rpgInspector}${durBar}${req}</div><div class="ow-row ow-wrap">${btns}</div></div>`;
            };
            const enc = BO.OWRPGCharacter.encumbrance(s);
            const sect = (k, n) => groups[k].length ? `<div class="ow-sub">${n}</div><div class="ow-list">${groups[k].map(row).join('')}</div>` : '';
            const wb = `<div class="ow-workbench"><div><b>FIELD REPAIR WORKBENCH</b><small>Damaged gear loses effectiveness at &le;25% durability. Tech reduces repair cost.</small></div><button class="ow-btn ${totalRepair ? 'ow-primary' : ''}" data-act="repairAll" ${totalRepair > 0 && s.player.credits >= totalRepair ? '' : 'disabled'}>${totalRepair ? `REPAIR ALL EQUIPPED (${totalRepair} cr)` : 'EQUIPPED GEAR 100%'}</button></div>`;
            return `${wb}<p class="ow-dim">Carrying <b>${enc.weight.toFixed(1)} / ${enc.max} kg</b> — <b>${enc.label}</b>. Heavy loads slow your sprint and make you louder. Relay Cells: ${s.player.relayCells}. Credits: <b class="ow-gold">${s.player.credits}</b>.</p>
                ${sect('weapon', 'WEAPONS (MERIDIAN RPG STATS)')}${sect('helmet', 'HELMETS')}${sect('rig', 'ARMOR RIGS')}${sect('boots', 'BOOTS')}${sect('relic', 'RELICS')}${sect('tool', 'FIELD PICKUPS & TOOLS')}${sect('consumable', 'CONSUMABLES')}${sect('junk', 'SALVAGE')}${sect('quest', 'QUEST ITEMS & KEYS')}`;
        },

        _abilities() {
            const s = this.s, A = BO.OWRPGStatsData.ABILITIES, kb = BO.Settings.getKeybinds();
            const EX = BO.OWRPGExpansionData;
            const kn = (c) => (c || '').replace('Key', '');
            const col = (slot, key) => `<div><div class="ow-sub">${slot.toUpperCase()} <kbd>${kn(key)}</kbd></div><div class="ow-chips">${Object.entries(A[slot] || {}).map(([id, a]) => {
                const ok = BO.OWRPGCharacter.powerUnlocked ? BO.OWRPGCharacter.powerUnlocked(s, id) : true;
                const label = (EX?.POWER_UNLOCKS?.[id]?.label) || 'Locked';
                const on = s.player.abilities[slot] === id;
                return `<button class="ow-chip ${on ? 'on' : ''}" data-act="ability" data-v="${slot}|${id}" ${ok ? '' : 'disabled'}><b>${esc(a.name)}</b><small>${esc(a.desc)} · ${a.cd}s</small>${ok ? '' : `<em>Unlock: ${esc(label)}</em>`}</button>`;
            }).join('')}</div></div>`;
            return `<p class="ow-dim">Primers apply 5-Element Statuses: <span style="color:#f97316">Burn</span>, <span style="color:#38bdf8">Chill</span>, <span style="color:#facc15">Shock</span>, <span style="color:#84cc16">Venom</span>, <span style="color:#c084fc">Void</span>, <span style="color:#f472b6">Expose</span>. Detonators consume statuses for chain reactions, and Ultimates turn the tide.</p>
                <div class="ow-four">${col('primer', kb.owAbility1)}${col('detonator', kb.owAbility2)}${col('gadget', kb.owGadget)}${col('ultimate', kb.owUltimate || 'KeyU')}</div>`;
        },

        _mounts() {
            const s = this.s;
            const MOUNTS = BO.OWRPGExpansionData?.MOUNTS || {};
            const Mnt = BO.OWRPGMounts;
            const active = (s.player.mounts && s.player.mounts.active) || null;
            const cards = Object.values(MOUNTS).map((m) => {
                const owned = Mnt ? Mnt.isOwned(s, m.id) : false;
                const sel = active === m.id;
                const isRidden = Mnt && Mnt.mounted && Mnt.activeId === m.id;
                return `<div class="ow-mount-card ${sel ? 'on' : ''} ${owned ? '' : 'locked'}" style="--c:#${m.color.toString(16).padStart(6, '0')}">
                    <div><b>${esc(m.name)}</b><small>${esc(m.desc)}</small>
                    <div class="ow-mount-stats"><span>Cruise ${m.speed} m/s</span><span>Turbo ${m.boostSpeed} m/s</span><span>Mounted DR +${Math.round(m.dr * 100)}%</span><span>Jump ${m.jump}</span></div>
                    ${owned ? '' : `<em>Unlock: ${esc(m.unlockLabel)}</em>`}</div>
                    <div class="ow-row">${owned ? `<button class="ow-btn ${isRidden ? 'ow-primary' : ''}" data-act="mountSelect" data-v="${m.id}">${isRidden ? 'MOUNTED [T]' : 'SUMMON [T]'}</button>` : '<span class="ow-dim">LOCKED</span>'}</div></div>`;
            }).join('');
            return `<p class="ow-dim">Press <kbd>T</kbd> anytime outdoors to summon or dismount your selected vehicle/walker. Hold <kbd>Shift</kbd> for turbo boost and <kbd>Space</kbd> to jump terrain gaps.</p><div class="ow-list">${cards}</div>`;
        },

        _bounties() {
            const s = this.s;
            const list = BO.OWRPGExpansionData?.BOUNTIES || [];
            const bState = s.player.bounties || { active: null, completed: 0, progress: 0 };
            const ev = BO.OWRPGEvents?.activeEvent;
            const evCard = ev
                ? `<div class="ow-note" style="border-color:${ev.color}"><div><b style="color:${ev.color}">ACTIVE WORLD EVENT: ${esc(ev.title)}</b><br><small>${esc(ev.desc)} · ${ev.remaining}/${ev.total} enemies · ${Math.ceil(ev.t)}s</small></div></div>`
                : `<div class="ow-workbench"><div><b>DYNAMIC WORLD EVENTS</b><small>Roam outside Freestead to encounter Supply Drops, Faction Skirmishes, Void Storms, and Rogue Patrols.</small></div><button class="ow-btn" data-act="scanEvent">SCAN NEARBY SECTOR</button></div>`;
            const cards = list.map((b) => {
                const isAct = bState.active === b.id;
                const pct = isAct ? Math.min(100, Math.round((bState.progress / b.count) * 100)) : 0;
                return `<div class="ow-bounty-card ${isAct ? 'active' : ''}"><div><b>${esc(b.title)}</b><small>${esc(b.desc)}</small>
                    <small class="ow-gold">Reward: ${b.xp} XP · ${b.credits} cr</small>
                    ${isAct ? `<div class="ow-dur-wrap"><span class="ow-durbar"><i style="width:${pct}%;background:#fbbf24"></i></span><small>${bState.progress} / ${b.count} eliminated</small></div>` : ''}</div>
                    <div>${isAct ? `<button class="ow-btn ow-sm ow-ghost" data-act="abandonBounty">ABANDON</button>` : `<button class="ow-btn ow-sm" data-act="acceptBounty" data-v="${b.id}">${bState.active ? 'SWITCH' : 'ACCEPT'}</button>`}</div></div>`;
            }).join('');
            return `${evCard}<p class="ow-dim">Bounties Completed: <b class="ow-gold">${bState.completed || 0}</b> · World Events Cleared: <b class="ow-gold">${s.stats.eventsCleared || 0}</b></p><div class="ow-list">${cards}</div>`;
        },

        _codex() {
            const s = this.s;
            const EX = BO.OWRPGExpansionData;
            const claimed = (s.player.codex && s.player.codex.unlocksClaimed) || [];
            const cards = (EX?.CODEX_MILESTONES || []).map((cx) => {
                const done = cx.check(s);
                const got = claimed.includes(cx.id);
                const rwNames = [cx.reward?.credits ? `${cx.reward.credits} cr` : '', ...(cx.reward?.items || []).map((id) => BO.OWRPGInventory.def(id)?.name || id)].filter(Boolean).join(', ');
                return `<div class="ow-codex-card ${got ? 'claimed' : done ? 'ready' : ''}"><div><b>${esc(cx.title)}</b><small>${esc(cx.desc)}</small><small class="ow-gold">Unlock: ${esc(rwNames)}</small></div>
                    <div>${got ? '<span class="ow-tagx">CLAIMED</span>' : done ? `<button class="ow-btn ow-primary ow-sm" data-act="claimCodex" data-v="${cx.id}">CLAIM</button>` : '<span class="ow-dim">IN PROGRESS</span>'}</div></div>`;
            }).join('');
            const kills = Object.entries((s.player.codex && s.player.codex.enemies) || {}).map(([id, n]) => {
                const def = BO.OWRPGStatsData.ENEMIES[id];
                return `<div class="ow-stat"><small>${esc(def ? def.name : id)}</small><b>${n} slain</b></div>`;
            }).join('') || '<div class="ow-empty">No hostile encounters logged yet.</div>';
            const guns = ((BO.WeaponsData && BO.WeaponsData.ORDER) || []).slice(0, 24).map((wid) => {
                const w = BO.WeaponsData.get(wid), gs = EX.getGunStats(wid);
                const eb = ELEM_BADGE[gs.element] || ELEM_BADGE.kinetic;
                return `<div class="ow-item"><div><b>${esc(w.name)}</b><small>${esc(w.category)} · ×${gs.rpgDmgMult} RPG · Crit ${Math.round(gs.critChance * 100)}% · Pen ${gs.armorPen} · ${esc(gs.unlockReq)}</small></div><span class="ow-elem-pill" style="--c:${eb.color}">${eb.label}</span></div>`;
            }).join('');
            return `<div class="ow-sub">CODEX MILESTONES &amp; UNLOCKABLES</div><div class="ow-list">${cards}</div>
                <div class="ow-sub">BESTIARY KILL LOG</div><div class="ow-stats">${kills}</div>
                <div class="ow-sub">MERIDIAN WEAPON COMPENDIUM (RPG STATS)</div><div class="ow-list">${guns}</div>`;
        },

        _quests() {
            const s = this.s, Q = BO.OWRPGQuests;
            const all = Object.entries(s.quests);
            const active = all.filter(([, q]) => q.state === 'active');
            const done = all.filter(([, q]) => q.state === 'completed');
            const tracked = this.UI.trackedQuests();
            const pinned = s.worldFlags.trackedQuests || [];
            const KINDS = [['main', 'Main Story'], ['faction', 'Faction'], ['side', 'Side'], ['contract', 'Contracts'], ['delve', 'Dungeon Delves'], ['explore', 'Exploration']];
            const card = ([id, q]) => {
                const d = Q.def(id);
                const b = q.branch && d.branches[q.branch];
                const on = pinned.includes(id);
                const reg = d.region && BO.OWRPGWorldData.REGIONS.find((r) => r.id === d.region);
                return `<div class="ow-qcard ${q.state} ${tracked.includes(id) ? 'tracked' : ''}"><div><span class="ow-kicker">${esc(d.kind.toUpperCase())}${reg ? ' · ' + esc(reg.name) : ''}</span><b>${esc(d.name)}</b><small>${esc(d.summary)}</small>
                    ${q.state === 'active' ? `<p>▸ ${esc(Q.objective(s, id))}</p>` : `<p class="ow-dim">Outcome: ${esc(b ? b.label : 'Complete')}</p>`}</div>
                    ${q.state === 'active' ? `<button class="ow-btn ow-sm ${on ? 'ow-primary' : ''}" data-act="track" data-v="${id}" aria-pressed="${on}">${on ? 'TRACKED' : 'TRACK'}</button>` : ''}</div>`;
            };
            const groups = KINDS.map(([k, label]) => {
                const list = active.filter(([id]) => (Q.def(id).kind || 'side') === k);
                return list.length ? `<div class="ow-sub">${label.toUpperCase()} <span class="ow-dim">${list.length}</span></div>${list.map(card).join('')}` : '';
            }).join('');
            return `<p class="ow-dim">Track up to three quests: they appear on the HUD tracker, the compass and the minimap with live distances.</p>
                ${groups || '<div class="ow-empty">No active quests. Talk to people in Freestead, or explore — hidden sites start quests too.</div>'}
                <div class="ow-sub">COMPLETED <span class="ow-dim">${done.length} / ${Object.keys(BO.OWRPGQuestsData.QUESTS).length}</span></div>${done.map(card).join('') || '<div class="ow-empty">Nothing yet.</div>'}`;
        },

        _map() {
            const C = BO.OWRPGCartography;
            return `<div class="ow-mapwrap"><canvas id="ow-map" width="768" height="768"></canvas>
                <div class="ow-maplegend"><p class="ow-dim">Click to place or remove a pin (shown on the compass and minimap). Uncharted land stays under fog until you walk it or sync a vista.</p>
                ${C ? `<div class="ow-stat"><small>Charted</small><b>${C.percent()}% of the Expanse</b></div>` : ''}
                <label class="ow-check"><input type="checkbox" data-act="compassQuest" ${this.s.worldFlags.compassQuest ? 'checked' : ''}> Show tracked quests on compass</label>
                <div class="ow-legend"><span style="--c:#f5a623">◆ Settlement</span><span style="--c:#fca5a5">● Hostile site</span><span style="--c:#67e8f9">∩ Dungeon</span><span style="--c:#22d3ee">● Pylon (online)</span><span style="--c:#a3e635">◯ Quest marker</span><span style="--c:#fbbf24">✦ Cache</span><span style="--c:#e9c46a">❦ Tome</span><span style="--c:#5eead4">✧ Shrine</span><span style="--c:#a78bfa">◈ Shard</span><span style="--c:#38bdf8">⛰ Vista</span><span style="--c:#a8a29e">▲ Stash</span><span style="--c:#f43f5e">☗ Altar</span><span style="--c:#f8fafc">▲ You</span><span style="--c:#f472b6">✚ Pin</span></div></div></div>`;
        },

        _drawMap() {
            const cv = document.getElementById('ow-map');
            if (!cv) return;
            const g = cv.getContext('2d');
            const s = this.s, D = BO.OWRPGWorldData, P = BO.Player;
            const W = cv.width, B = D.BOUNDS, span = B.maxX - B.minX, S = W / span;
            const X = x => (x - B.minX) * S, Z = z => (z - B.minZ) * S;
            const Carto = BO.OWRPGCartography;
            g.fillStyle = '#0b1118'; g.fillRect(0, 0, W, W);
            // Hill-shaded base layer (cached by Cartography) under the fog of war.
            if (Carto) { Carto.drawWorldBase(g, W); Carto.drawWorldFog(g, W); }
            g.font = 'bold 13px Segoe UI'; g.textAlign = 'center';
            for (const r of D.REGIONS) {
                const pct = Carto ? Carto.regionPercent(r.id) : 100;
                g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.strokeText(r.name.toUpperCase(), X(r.x), Z(r.z) - 30);
                g.fillStyle = pct > 0 ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.32)'; g.fillText(r.name.toUpperCase(), X(r.x), Z(r.z) - 30);
                if (Carto) { g.font = '600 11px Segoe UI'; g.fillStyle = 'rgba(251,191,36,0.85)'; g.fillText(pct + '% charted', X(r.x), Z(r.z) - 16); g.font = 'bold 13px Segoe UI'; }
            }
            for (const l of D.LANDMARKS) { g.fillStyle = '#' + l.color.toString(16).padStart(6, '0'); g.fillRect(X(l.x) - 3, Z(l.z) - 9, 6, 12); }
            g.font = '11px Segoe UI';
            for (const poi of D.POIS) {
                if (poi.interior) continue;
                const st = s.poiStates[poi.id];
                if (!st || !st.discovered) continue;
                g.fillStyle = poi.safe ? '#f5a623' : (st.clearedAt != null ? '#94a3b8' : '#fca5a5');
                g.beginPath(); g.arc(X(poi.x), Z(poi.z), 4, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#e2e8f0'; g.fillText(poi.name, X(poi.x), Z(poi.z) + 15);
            }
            for (const py of D.PYLONS) { g.fillStyle = s.pylons[py.id] ? '#22d3ee' : '#475569'; g.beginPath(); g.arc(X(py.x), Z(py.z), 3.5, 0, Math.PI * 2); g.fill(); }
            for (const dg of D.DUNGEONS) {
                if (Carto && !Carto.isExplored(dg.surf.x, dg.surf.z)) continue;
                g.font = '900 15px Segoe UI'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.strokeText('∩', X(dg.surf.x), Z(dg.surf.z) + 5);
                g.fillStyle = '#67e8f9'; g.fillText('∩', X(dg.surf.x), Z(dg.surf.z) + 5);
            }
            g.font = '11px Segoe UI';
            if (BO.OWRPGDiscoveries) BO.OWRPGDiscoveries.drawOnWorldMap(g, X, Z);
            for (const m of BO.OWRPGQuests.markers(s)) {
                const target = D.POIS.find((p) => p.id === m.poi);
                if (!target) continue;
                const poi = target.interior ? D.DUNGEONS.find(d => d.id === target.id)?.surf : target;
                if (!poi) continue;
                g.strokeStyle = '#a3e635'; g.lineWidth = 2;
                g.beginPath(); g.arc(X(poi.x), Z(poi.z), 9, 0, Math.PI * 2); g.stroke();
            }
            for (const pin of s.pins) { g.fillStyle = '#f472b6'; g.font = 'bold 16px Segoe UI'; g.fillText('✚', X(pin[0]), Z(pin[1]) + 5); }
            const currentDungeon = D.DUNGEONS.find(d => Math.hypot(P.pos.x-d.x, P.pos.z-d.z) < 130);
            if (currentDungeon) {
                g.strokeStyle = '#f8fafc'; g.lineWidth = 2;
                g.strokeRect(X(currentDungeon.surf.x)-7, Z(currentDungeon.surf.z)-7, 14, 14);
                g.fillStyle = '#f8fafc'; g.fillText('YOU · ' + currentDungeon.name, X(currentDungeon.surf.x), Z(currentDungeon.surf.z)-12);
            }
            if (!D.isInterior(P.pos.x, P.pos.z)) {
                g.save(); g.translate(X(P.pos.x), Z(P.pos.z)); g.rotate(-P.yaw);   // forward = (-sin yaw, -cos yaw)
                g.fillStyle = '#f8fafc'; g.beginPath(); g.moveTo(0, -8); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath(); g.fill(); g.restore();
            }
            cv.onclick = (e) => {
                const r = cv.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * span + B.minX, z = ((e.clientY - r.top) / r.height) * (B.maxZ - B.minZ) + B.minZ;
                const i = s.pins.findIndex((p) => Math.hypot(p[0] - x, p[1] - z) < 12);
                if (i >= 0) s.pins.splice(i, 1); else if (s.pins.length < 6) s.pins.push([Math.round(x), Math.round(z)]);
                this._drawMap();
            };
            g.fillStyle = '#cbd5e1'; g.textAlign = 'left'; g.font = '12px Segoe UI';
            g.fillText('N ↑    ' + span + ' × ' + (B.maxZ - B.minZ) + ' metres', 12, 20);
            const chk = this.UI.panel.querySelector('[data-act="compassQuest"]');
            if (chk) chk.onchange = () => { s.worldFlags.compassQuest = chk.checked; };
        },

        _atlas() { return BO.OWRPGCartography ? BO.OWRPGCartography.atlasHtml() : '<div class="ow-empty">Cartography unavailable.</div>'; },

        _factions() {
            const s = this.s, FD = BO.OWRPGFactionsData, F = BO.OWRPGFactions;
            const rows = Object.entries(FD.FACTIONS).map(([id, f]) => {
                const r = F.rep(s, id), t = F.tier(s, id);
                const pct = ((r - FD.REP_MIN) / (FD.REP_MAX - FD.REP_MIN)) * 100;
                return `<div class="ow-fac" style="--c:${f.color}"><div><b>${f.name}</b><small>${f.blurb}</small><small>Rival: ${FD.FACTIONS[f.rival].name}</small></div>
                    <div class="ow-facbar"><i style="width:${pct.toFixed(1)}%"></i><span>${r}</span></div><b class="ow-tier" style="color:${t.color}">${t.name}${F.isHostile(s, id) ? ' · HOSTILE' : ''}</b></div>`;
            }).join('');
            const owned = BO.OWRPGWorldData.POIS.filter((p) => p.kind === 'contested').map((p) => `<div class="ow-item"><b>${p.name}</b><small>${F.poiOwner(s, p) ? FD.FACTIONS[F.poiOwner(s, p)].name : 'Contested'}</small></div>`).join('');
            return `<p class="ow-dim">Tiers: Hated ≤ −500 (kill on sight) · Shunned (warnings) · Neutral · Trusted ≥ 250 (12% discount) · Sworn ≥ 750 (locks out the rival's Sworn tier). Helping one faction costs you 50% of that gain with its rival.</p>
                <div class="ow-facs">${rows}</div><div class="ow-sub">TERRITORY</div><div class="ow-list">${owned}</div>`;
        },

        _system() {
            const M = BO.OWRPGMode;
            const can = M.canSave();
            return `<div class="ow-list"><div class="ow-item"><div><b>Compass</b><small>Show cardinal directions, quest bearings and map pins.</small></div><button class="ow-btn" data-act="toggleCompass" aria-pressed="${this.s.worldFlags.compassEnabled !== false}">${this.s.worldFlags.compassEnabled !== false ? 'ON' : 'OFF'}</button></div>
                <div class="ow-item"><div><b>Minimap</b><small>Rotating fog-of-war minimap (top left). [${esc((BO.Settings.getKeybinds().owMinimapZoom || 'KeyN').replace('Key', ''))}] cycles its range.</small></div><button class="ow-btn" data-act="toggleMinimap" aria-pressed="${this.s.worldFlags.minimapEnabled !== false}">${this.s.worldFlags.minimapEnabled !== false ? 'ON' : 'OFF'}</button></div>
                <div class="ow-item"><div><b>Minimap orientation</b><small>Rotate with the player, or keep north up.</small></div><button class="ow-btn" data-act="toggleNorthUp">${this.s.worldFlags.minimapNorthUp ? 'NORTH UP' : 'ROTATING'}</button></div>
                <div class="ow-item"><div><b>Developer menu</b><small>Grants, teleportation and world diagnostics. Also available with F8.</small></div><button class="ow-btn" data-act="padTab" data-v="dev">OPEN</button></div>
                <div class="ow-item"><div><b>Quick save</b><small>${can ? esc(can) : 'Saves to slot ' + (M.slot + 1) + ' (also F5). Checkpoints save automatically.'}</small></div><button class="ow-btn" data-act="sysSave" ${can ? 'disabled' : ''}>SAVE</button></div>
                <div class="ow-item"><div><b>Load last save</b><small>${esc(M.lastSaveLabel || '')} (also F9)</small></div><button class="ow-btn ow-ghost" data-act="sysLoad">LOAD</button></div>
                <div class="ow-item"><div><b>Save size</b><small>${(BO.OWRPGSave.byteSize() / 1024).toFixed(1)} KB of the 250 KB budget</small></div></div></div>
                <div class="ow-sub">CONTROLS</div><p class="ow-dim">E interact · Q primer · F detonator · X gadget · H med-injector · B holster · Left Alt dodge · Tab Pip-Pad · J quests · M map · F5/F9 save/load · F8 dev tools. Rebind in Settings → Controls.</p>`;
        },

        _dev() {
            const D = BO.OWRPGWorldData;
            const pois = D.POIS.map((p) => `<button class="ow-btn ow-sm" data-act="devTp" data-v="${p.id}">${esc(p.name)}</button>`).join('');
            const res = this.validation ? `<pre class="ow-pre">${esc(this.validation)}</pre>` : '';
            return `<p class="ow-dim">Developer tools. Changes are saved with your character.</p>
                <div class="ow-sub">GRANTS</div><div class="ow-row ow-wrap"><button class="ow-btn ow-sm" data-act="devXp">+1000 XP</button><button class="ow-btn ow-sm" data-act="devAttr">+2 attr pts</button><button class="ow-btn ow-sm" data-act="devCells">+3 relay cells</button><button class="ow-btn ow-sm" data-act="devCr">+500 cr</button><button class="ow-btn ow-sm" data-act="devRep">+250 all reps</button><button class="ow-btn ow-sm" data-act="devTime">+6 hours</button><button class="ow-btn ow-sm" data-act="devMounts">Unlock all mounts</button><button class="ow-btn ow-sm" data-act="devEvent">Spawn world event</button><button class="ow-btn ow-sm" data-act="devVal">Run validator</button></div>
                <div class="ow-sub">EXPLORATION &amp; CHAMPIONS</div><div class="ow-row ow-wrap"><button class="ow-btn ow-sm" data-act="devReveal">Reveal whole map</button><button class="ow-btn ow-sm" data-act="devSite">Teleport to nearest hidden site</button><button class="ow-btn ow-sm" data-act="devChampion">Spawn a Champion</button><button class="ow-btn ow-sm" data-act="devMastery">+5 all Mastery levels</button><button class="ow-btn ow-sm" data-act="devBlessing">Random shrine blessing</button><button class="ow-btn ow-sm" data-act="devHeal">Full heal</button></div>
                <div class="ow-sub">TELEPORT</div><div class="ow-row ow-wrap">${pois}</div>
                <div class="ow-sub">WORLD FLAGS</div><pre class="ow-pre">${esc(JSON.stringify(this.s.worldFlags, null, 1))}</pre>${res}`;
        },

        /* ------------------------------------------------ handlers */
        handlers: {
            toggleCompass() { this.s.worldFlags.compassEnabled = this.s.worldFlags.compassEnabled === false; this.render(); },
            padTab(v) { this.tab = v; this.render(); },
            raise(v) { if (BO.OWRPGCharacter.raiseAttr(this.s, v)) { BO.OWRPGMode.applyDerived(); BO.OWRPGMode.refreshLoadout(); } this.render(); },
            perk(v) { if (BO.OWRPGCharacter.takePerk(this.s, v)) { BO.OWRPGMode.applyDerived(); BO.OWRPGMode.toast('Perk learned: ' + BO.OWRPGStatsData.perkIndex()[v].perk.name, '#fbbf24'); } this.render(); },
            respec() { if (BO.OWRPGCharacter.respec(this.s)) { BO.OWRPGMode.applyDerived(); BO.OWRPGMode.toast('Perks reset', '#f472b6'); } this.render(); },
            equip(v) {
                const [uid, slot] = v.split('|');
                const err = BO.OWRPGInventory.equip(this.s, uid, slot);
                if (err) BO.OWRPGMode.toast(err, '#f97316');
                else { BO.OWRPGMode.refreshLoadout(); BO.OWRPGMode.applyDerived(); }
                this.render();
            },
            use(v) { BO.OWRPGMode.useConsumable(v); this.render(); },
            useTool(v) {
                const err = BO.OWRPGDurability?.useTool(this.s, v);
                if (err) BO.OWRPGMode.toast(err, '#f97316');
                BO.OWRPGMode.applyDerived();
                this.render();
            },
            repairItem(v) {
                const err = BO.OWRPGDurability?.repairItem(this.s, v, 'credits');
                if (err) BO.OWRPGMode.toast(err, '#f97316');
                else { BO.OWRPGMode.applyDerived(); BO.OWRPGMode.toast('Repaired!', '#4ade80'); }
                this.render();
            },
            repairAll() {
                const err = BO.OWRPGDurability?.repairAllEquipped(this.s);
                if (err) BO.OWRPGMode.toast(err, '#f97316');
                else { BO.OWRPGMode.applyDerived(); BO.OWRPGMode.toast('All equipped gear repaired!', '#4ade80'); }
                this.render();
            },
            mountSelect(v) {
                if (BO.OWRPGMounts?.select(this.s, v)) {
                    this.UI.close();
                    if (!BO.OWRPGMounts.mounted) BO.OWRPGMounts.mount();
                } else {
                    this.render();
                }
            },
            acceptBounty(v) {
                this.s.player.bounties = this.s.player.bounties || { active: null, completed: 0, progress: 0 };
                this.s.player.bounties.active = v;
                this.s.player.bounties.progress = 0;
                const B = BO.OWRPGExpansionData?.BOUNTIES?.find((b) => b.id === v);
                if (B) BO.OWRPGMode.toast(`Bounty Accepted: ${B.title}`, '#fbbf24');
                this.render();
            },
            abandonBounty() {
                if (this.s.player.bounties) { this.s.player.bounties.active = null; this.s.player.bounties.progress = 0; }
                this.render();
            },
            scanEvent() {
                const ev = BO.OWRPGEvents?.spawnNearPlayer?.();
                if (!ev) BO.OWRPGMode.toast('Step outside Freestead roads to scan for active events.', '#94a3b8');
                this.render();
            },
            claimCodex(v) {
                const cx = BO.OWRPGExpansionData?.CODEX_MILESTONES?.find((m) => m.id === v);
                if (!cx || !cx.check(this.s)) return;
                this.s.player.codex = this.s.player.codex || { enemies: {}, elements: {}, unlocksClaimed: [] };
                if (this.s.player.codex.unlocksClaimed.includes(v)) return;
                this.s.player.codex.unlocksClaimed.push(v);
                if (cx.reward?.credits) this.s.player.credits += cx.reward.credits;
                for (const it of cx.reward?.items || []) BO.OWRPGInventory.add(this.s, it, 1);
                BO.Sound?.playQuestFanfare?.();
                BO.OWRPGMode.toast(`Codex Claimed: ${cx.title}!`, '#fbbf24');
                this.render();
            },
            salvage(v) { const cr = BO.OWRPGInventory.salvage(this.s, v); if (cr) BO.OWRPGMode.toast(`Salvaged for ${cr} cr`, '#fbbf24'); this.render(); },
            drop(v) { BO.OWRPGInventory.removeUid(this.s, v); BO.OWRPGMode.refreshLoadout(); this.render(); },
            ability(v) { const [slot, id] = v.split('|'); this.s.player.abilities[slot] = id; this.render(); },
            track(v) { this.UI.toggleTrack(v); this.render(); },
            toggleMinimap() { this.s.worldFlags.minimapEnabled = this.s.worldFlags.minimapEnabled === false; this.render(); },
            toggleNorthUp() { this.s.worldFlags.minimapNorthUp = !this.s.worldFlags.minimapNorthUp; this.render(); },
            devReveal() { const C = BO.OWRPGCartography; if (C) { const B = BO.OWRPGWorldData.BOUNDS; C.reveal((B.minX + B.maxX) / 2, (B.minZ + B.maxZ) / 2, 2000, true); } this.render(); },
            devSite() {
                const P = BO.Player, site = BO.OWRPGDiscoveries?.nearestUnfound(P.pos.x, P.pos.z);
                if (!site) { BO.OWRPGMode.toast('Every hidden site has been found', '#a3e635'); return; }
                P.pos.set(site.x + 2.5, BO.World.terrainHeight(site.x + 2.5, site.z) + 0.3, site.z); P.vel.set(0, 0, 0);
                this.UI.close();
            },
            devChampion() {
                const P = BO.Player, pool = BO.OWRPGWorldSim.encounterPool(BO.OWRPGWorldData.regionAt(P.pos.x, P.pos.z).id);
                const a = BO.OWRPGAI.spawn(pool[0][0], P.pos.x + 14 * -Math.sin(P.yaw), P.pos.z + 14 * -Math.cos(P.yaw), { leash: 80, noChampion: true });
                if (a) { a.eventHostile = true; a.hostile = true; BO.OWRPGChampions.make(a, 3); BO.OWRPGAI.engage(a, false); }
                this.UI.close();
            },
            devMastery() { const s = this.s, SD = BO.OWRPGStatsData; for (const id of Object.keys(SD.SKILLS)) { const sk = BO.OWRPGCharacter.skill(s, id); for (let i = 0; i < 5 && sk.level < SD.SKILL_CAP; i++) BO.OWRPGCharacter.addSkillXp(s, id, SD.skillXpToNext(sk.level)); } BO.OWRPGMode.applyDerived(); this.render(); },
            devBlessing() { const s = this.s, list = BO.OWRPGDiscoveryData.BLESSINGS, b = list[Math.floor(Math.random() * list.length)]; s.player.blessing = { id: b.id, name: b.name, color: b.color, until: s.playtimeSec + 300, fx: b.fx }; BO.OWRPGMode.applyDerived(); BO.OWRPGMode.toast(b.name + ' — ' + b.desc, b.color); this.render(); },
            devHeal() { BO.OWRPGMode.healFull(); },
            sysSave() { BO.OWRPGMode.quickSave(); this.render(); },
            sysLoad() { this.UI.close(true); BO.OWRPGMode.quickLoad(); },
            devTp(v) {
                const p = BO.OWRPGWorldData.POIS.find((x) => x.id === v);
                const P = BO.Player;
                const x = p.x + (p.interior ? 0 : p.r * 0.6), z = p.z + (p.interior ? -20 : p.r * 0.6);
                P.pos.set(x, p.interior ? 0.2 : BO.World.terrainHeight(x, z) + 0.5, z);
                P.vel.set(0, 0, 0);
                this.s.player.interiorId = p.interior ? p.id : null;
                BO.OWRPGWorldSim.tick1(0);
                this.UI.close();
            },
            devXp() { BO.OWRPGMode.giveXp(1000, 'Dev'); this.render(); },
            devAttr() { this.s.player.attrPoints += 2; this.render(); },
            devCells() { this.s.player.relayCells += 3; this.render(); },
            devCr() { this.s.player.credits += 500; this.render(); },
            devRep() { for (const f of Object.keys(BO.OWRPGFactionsData.FACTIONS)) BO.OWRPGFactions.add(this.s, f, 250, { raw: true, noSpill: true }); BO.OWRPGAI.refreshHostility(); this.render(); },
            devTime() { this.s.worldClock = (this.s.worldClock + 600) % 2400; this.render(); },
            devMounts() { for (const id of Object.keys(BO.OWRPGExpansionData?.MOUNTS || {})) BO.OWRPGMounts?.unlock(this.s, id); this.render(); },
            devEvent() { const ev = BO.OWRPGEvents?.spawnNearPlayer?.(); if (!ev) BO.OWRPGMode.toast('Move away from Freestead to spawn event', '#f97316'); else this.UI.close(); },
            devVal() { const r = BO.OWRPGValidator.runAll(); this.validation = r.report; this.render(); }
        }
    };

    BO.OWRPGPipPad = Pad;
})(window.BO);
;
