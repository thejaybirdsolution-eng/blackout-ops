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

    /* --------------------------------------------------------- 6 Level-by-Doing Skills (RuneScape / Dragonwilds style) */
    const SKILLS = {
        combat:   { id: 'combat',   name: 'Arms Mastery',  color: '#ef4444', icon: '⚔', desc: 'Leveled by gun & melee combat. Grants +0.5% weapon damage per level.' },
        slayer:   { id: 'slayer',   name: 'Slayer',        color: '#f97316', icon: '☠', desc: 'Leveled by hunting beasts, undead, and bosses. Grants +0.6% monster/boss damage per level.' },
        delving:  { id: 'delving',  name: 'Dungeoneering', color: '#a855f7', icon: '🗝', desc: 'Leveled by delving dungeons & opening chests. Grants +0.8% loot credits per level.' },
        foraging: { id: 'foraging', name: 'Foraging',      color: '#4ade80', icon: '🌿', desc: 'Leveled by harvesting herbs & timber. Grants +0.6% med/potion healing & bonus gather chance.' },
        mining:   { id: 'mining',   name: 'Artisan Mining',color: '#38bdf8', icon: '⛏', desc: 'Leveled by mining ore veins & salvaging gear. Grants +0.7% salvage yield & slower gear wear.' },
        arcana:   { id: 'arcana',   name: 'Runecraft',     color: '#c084fc', icon: '✦', desc: 'Leveled by elemental reactions & runic crystals. Grants +0.6% reaction & ability damage per level.' }
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

    /* ------------------------------------------------------------------ 7 Perk Trees × 6 Tiers = 84 Perks */
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
