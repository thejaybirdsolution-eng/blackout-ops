/* BLACKOUT OPS — rpg.bundle.js (13 files) | Dev-generated IIFE bundle (ADR-002) */

/* --- src/data/RPGData.js --- */
/* ============================================================================
   BLACKOUT OPS — RPG Mode Data (classes, abilities, statuses, enemies, loot,
   talents, boons, Haven upgrades, biomes, rooms, curves).
   Every tunable number for RPG mode lives here so balance changes never touch
   logic. Design record: docs/RPG_DESIGN.md
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    /* ---------------- Statuses & reactions (the one combo rule) ----------------
       Primers apply a status. Detonators consume EVERY status on the target and
       each consumed status triggers its reaction. */
    const STATUSES = {
        burn: { id: 'burn', name: 'Burn', icon: '🔥', color: '#f97316', hex: 0xf97316, duration: 6, dps: 9,
            desc: 'Takes fire damage every second.', reaction: 'combust' },
        chill: { id: 'chill', name: 'Chill', icon: '❄', color: '#38bdf8', hex: 0x38bdf8, duration: 5,
            desc: 'Moves 55% slower.', reaction: 'shatter' },
        shock: { id: 'shock', name: 'Shock', icon: '⚡', color: '#facc15', hex: 0xfacc15, duration: 6,
            desc: 'Charged with static. Detonate it to arc to nearby enemies.', reaction: 'overload' },
        expose: { id: 'expose', name: 'Expose', icon: '◎', color: '#f472b6', hex: 0xf472b6, duration: 6, dmgTakenMult: 1.2,
            desc: 'Takes 20% more damage. Breaks shields and wards.', reaction: 'rupture' }
    };
    const STATUS_ORDER = ['burn', 'chill', 'shock', 'expose'];

    const REACTIONS = {
        combust: { id: 'combust', name: 'COMBUST', color: '#fb923c', radius: 4.5, damage: 55,
            desc: 'Explodes, damaging every enemy within 4.5 m.' },
        shatter: { id: 'shatter', name: 'SHATTER', color: '#7dd3fc', bonusMult: 1.0, freeze: 1.2,
            desc: 'The detonation hits twice as hard and freezes the target (frozen enemies take 2.5× damage).' },
        overload: { id: 'overload', name: 'OVERLOAD', color: '#fde047', arcs: 3, radius: 9, damage: 40,
            desc: 'Lightning arcs to 3 nearby enemies.' },
        rupture: { id: 'rupture', name: 'RUPTURE', color: '#f9a8d4', damage: 70, armorBreak: 6,
            desc: 'Heavy bonus damage and breaks armour, shields and wards for 6 s.' }
    };

    /* ---------------- Classes & abilities ---------------- */
    const CLASSES = {
        vanguard: {
            id: 'vanguard', name: 'Vanguard', role: 'Frontline bruiser', color: '#f472b6', icon: '🛡',
            element: 'expose', baseHp: 140, startWeapon: 'r870',
            blurb: 'Crash into the pack, Expose everything, and slam it apart. Hard to kill up close.',
            passive: { id: 'bulwark', name: 'Bulwark', desc: 'Take 20% less damage from enemies within 4 m. Kills heal 4 HP.' },
            abilities: {
                primer: { id: 'breach_charge', name: 'Breach Charge', kind: 'primer', cd: 8, damage: 45, range: 9, width: 2.2, applies: ['expose'],
                    desc: 'Dash 9 m forward. Enemies in your path take damage, are knocked aside and Exposed.' },
                detonator: { id: 'concussion_slam', name: 'Concussion Slam', kind: 'detonator', cd: 10, damage: 60, radius: 6, stun: 1.0,
                    desc: 'Slam the ground: damages and stuns everything within 6 m and detonates their statuses.' },
                ultimate: { id: 'juggernaut', name: 'Juggernaut Protocol', kind: 'ultimate', duration: 8, dr: 0.5, gunMult: 1.3,
                    desc: '8 s: take 50% less damage, guns deal 30% more and every hit Exposes.' }
            }
        },
        pyrotech: {
            id: 'pyrotech', name: 'Pyrotech', role: 'Area controller', color: '#f97316', icon: '🔥',
            element: 'burn', baseHp: 110, startWeapon: 'mp5',
            blurb: 'Carpet the floor in napalm, then light it all up with one blast. Rewards positioning.',
            passive: { id: 'kindling', name: 'Kindling', desc: 'Your guns deal 20% more damage to Burning enemies.' },
            abilities: {
                primer: { id: 'napalm_lob', name: 'Napalm Lob', kind: 'primer', cd: 9, radius: 4, duration: 4, tick: 10, applies: ['burn'],
                    desc: 'Lob a canister that leaves a 4 m napalm pool. Enemies inside Burn and take damage.' },
                detonator: { id: 'flashover', name: 'Flashover', kind: 'detonator', cd: 8, damage: 55, range: 9, cone: 0.57,
                    desc: 'Blast a 9 m cone of superheated air that detonates every status it touches.' },
                ultimate: { id: 'firestorm', name: 'Firestorm', kind: 'ultimate', radius: 12, damage: 80, delay: 1.5,
                    desc: 'Ignite everything within 12 m, then detonate them all 1.5 s later.' }
            }
        },
        tempest: {
            id: 'tempest', name: 'Tempest', role: 'Precision caster', color: '#38bdf8', icon: '⚡',
            element: 'chill', baseHp: 100, startWeapon: 'm4a1',
            blurb: 'Pierce lines of enemies with ice, then chain lightning through the frozen crowd.',
            passive: { id: 'static', name: 'Static', desc: 'Shocked enemies conduct 20% of your gun damage to the nearest other enemy.' },
            abilities: {
                primer: { id: 'cryo_lance', name: 'Cryo Lance', kind: 'primer', cd: 6, damage: 40, range: 40, applies: ['chill'],
                    desc: 'Fire a lance of ice that pierces every enemy in a line, damaging and Chilling them.' },
                detonator: { id: 'arc_lash', name: 'Arc Lash', kind: 'detonator', cd: 7, damage: 50, range: 30, chains: 3, chainDamage: 35, applies: ['shock'],
                    desc: 'Lash the enemy under your crosshair: detonates its statuses, then chains to 3 nearby enemies and Shocks them all.' },
                ultimate: { id: 'storm_cell', name: 'Storm Cell', kind: 'ultimate', duration: 10, radius: 10, interval: 0.5, damage: 30,
                    desc: '10 s storm at your aim point: lightning strikes an enemy inside every 0.5 s and Shocks it.' }
            }
        }
    };
    const CLASS_ORDER = ['vanguard', 'pyrotech', 'tempest'];

    /* ---------------- Talents: 5 tiers × 3 exclusive choices per class ----------------
       Tier unlock levels: 2, 4, 6, 8, 10. Respec is free at the Haven. */
    const TALENT_TIER_LEVELS = [2, 4, 6, 8, 10];
    const TALENTS = {
        vanguard: [
            [
                { id: 'thermite_plating', name: 'Thermite Plating', desc: 'Breach Charge also applies Burn.' },
                { id: 'long_breach', name: 'Long Breach', desc: 'Breach Charge travels 60% farther and its cooldown is 2 s shorter.' },
                { id: 'shoulder_check', name: 'Shoulder Check', desc: 'Breach Charge stuns enemies it hits for 1.5 s.' }
            ],
            [
                { id: 'aftershock', name: 'Aftershock', desc: 'Concussion Slam pulses a second time 1 s later, detonating again.' },
                { id: 'magnet_slam', name: 'Magnet Slam', desc: 'Concussion Slam pulls enemies within 10 m toward you before it lands.' },
                { id: 'tectonic', name: 'Tectonic', desc: 'Concussion Slam radius +50%.' }
            ],
            [
                { id: 'iron_hide', name: 'Iron Hide', desc: '+25% max HP.' },
                { id: 'bloodletter', name: 'Bloodletter', desc: 'Kills heal 10 HP instead of 4.' },
                { id: 'rupture_specialist', name: 'Rupture Specialist', desc: 'Rupture deals double damage.' }
            ],
            [
                { id: 'static_gauntlets', name: 'Static Gauntlets', desc: 'Concussion Slam Shocks every enemy that survives it.' },
                { id: 'frost_breaker', name: 'Frost Breaker', desc: 'Breach Charge also applies Chill.' },
                { id: 'shotgun_doctrine', name: 'Shotgun Doctrine', desc: 'Shotguns deal 30% more damage.' }
            ],
            [
                { id: 'unstoppable', name: 'Unstoppable', desc: 'Juggernaut lasts 12 s and Breach Charge has no cooldown while it is active.' },
                { id: 'earthsplitter', name: 'Earthsplitter', desc: 'Juggernaut ends with a 14 m slam that detonates every status.' },
                { id: 'last_bastion', name: 'Last Bastion', desc: 'Once per floor, lethal damage leaves you at 1 HP and triggers Juggernaut.' }
            ]
        ],
        pyrotech: [
            [
                { id: 'sticky_napalm', name: 'Sticky Napalm', desc: 'Napalm pools last 7 s instead of 4.' },
                { id: 'cluster_lob', name: 'Cluster Lob', desc: 'Napalm Lob splits into 3 pools.' },
                { id: 'fuel_tank', name: 'Fuel Tank', desc: 'Napalm Lob cooldown 3 s shorter.' }
            ],
            [
                { id: 'backdraft', name: 'Backdraft', desc: 'Flashover reaches 50% farther.' },
                { id: 'heat_sink', name: 'Heat Sink', desc: 'Each enemy Flashover hits cuts Napalm Lob cooldown by 1 s.' },
                { id: 'wide_angle', name: 'Wide Angle', desc: 'Flashover cone is twice as wide.' }
            ],
            [
                { id: 'combustion_engine', name: 'Combustion Engine', desc: 'Combust radius +60%.' },
                { id: 'wildfire', name: 'Wildfire', desc: 'Combust sets every enemy it hits on fire.' },
                { id: 'heat_shield', name: 'Heat Shield', desc: 'Take 20% less damage while any enemy within 10 m is Burning.' }
            ],
            [
                { id: 'cryo_thermal', name: 'Cryo-Thermal', desc: 'Flashover Chills every enemy that survives it.' },
                { id: 'arc_flash', name: 'Arc Flash', desc: 'Flashover Shocks every enemy that survives it.' },
                { id: 'accelerant', name: 'Accelerant', desc: 'Burn deals double damage.' }
            ],
            [
                { id: 'supernova', name: 'Supernova', desc: 'Firestorm radius 20 m.' },
                { id: 'phoenix', name: 'Phoenix', desc: 'Firestorm heals you for 40% of max HP.' },
                { id: 'inferno_core', name: 'Inferno Core', desc: 'Firestorm detonates twice.' }
            ]
        ],
        tempest: [
            [
                { id: 'glacial_lance', name: 'Glacial Lance', desc: 'Cryo Lance freezes the first enemy it hits for 1.5 s.' },
                { id: 'twin_lance', name: 'Twin Lance', desc: 'Cryo Lance fires two lances in a narrow V.' },
                { id: 'quick_draw', name: 'Quick Draw', desc: 'Cryo Lance cooldown 2 s shorter.' }
            ],
            [
                { id: 'forked_lightning', name: 'Forked Lightning', desc: 'Arc Lash chains to 5 enemies.' },
                { id: 'capacitor', name: 'Capacitor', desc: 'Arc Lash deals 40% more damage.' },
                { id: 'ground_arc', name: 'Ground Arc', desc: 'Arc Lash also Chills everything it chains to.' }
            ],
            [
                { id: 'superconductor', name: 'Superconductor', desc: 'Overload arcs to 5 enemies and deals 40% more damage.' },
                { id: 'brittle', name: 'Brittle', desc: 'Shatter freezes for 3 s and triples the detonation instead of doubling it.' },
                { id: 'static_field', name: 'Static Field', desc: 'Static conducts 40% of your gun damage instead of 20%.' }
            ],
            [
                { id: 'thermal_shock', name: 'Thermal Shock', desc: 'Cryo Lance also applies Burn.' },
                { id: 'marksman', name: 'Marksman', desc: 'Headshots deal 35% more damage.' },
                { id: 'exposing_cold', name: 'Exposing Cold', desc: 'Cryo Lance also Exposes.' }
            ],
            [
                { id: 'perfect_storm', name: 'Perfect Storm', desc: 'Storm Cell lasts 16 s.' },
                { id: 'eye_of_the_storm', name: 'Eye of the Storm', desc: 'Storm Cell follows you.' },
                { id: 'tempest_lord', name: 'Tempest Lord', desc: 'Storm Cell strikes detonate statuses before Shocking.' }
            ]
        ]
    };

    /* ---------------- XP & levels ---------------- */
    const LEVEL_CAP = 10;
    function xpToNext(level) { return Math.round(120 * Math.pow(level, 1.55)); }
    // Odd levels: +max HP & potion strength. Even levels: a talent tier.
    function levelHpBonus(level) { return Math.floor(level / 2) * 10; }
    function levelPotionBonus(level) { return Math.floor(level / 2) * 0.03; }
    function abilityPower(level) { return 1 + 0.09 * (level - 1); }
    function recommendedLevel(floor) { return Math.min(LEVEL_CAP, Math.max(1, Math.ceil(floor * 0.62))); }

    /* ---------------- Momentum (style meter) ---------------- */
    const MOMENTUM = { max: 10, xpPerStack: 0.1, goldPerStack: 0.05, dmgPerStack: 0.01, decayEvery: 4, hitLoss: 3 };

    /* ---------------- Difficulty ---------------- */
    const DIFFICULTIES = {
        story: { id: 'story', name: 'Story', hp: 0.7, dmg: 0.6, reward: 1.0, desc: 'Enemies have less health and hit softer. For learning the combos.' },
        normal: { id: 'normal', name: 'Normal', hp: 1.0, dmg: 1.0, reward: 1.0, desc: 'The intended challenge.' },
        veteran: { id: 'veteran', name: 'Veteran', hp: 1.35, dmg: 1.4, reward: 1.25, desc: 'Tougher, deadlier enemies. +25% gold and XP.' }
    };

    /* ---------------- Enemy scaling ---------------- */
    function enemyHpMult(floor) { const f = floor - 1; return 1 + 0.16 * f + 0.006 * f * f; }
    function enemyDmgMult(floor) { return 1 + 0.085 * (floor - 1); }
    function depthRewardMult(floor) { return 1 + 0.12 * (floor - 1); }

    /* ---------------- Enemy archetypes (roles) ----------------
       base: a ZombiesData id whose body and AI are reused.
       weak: reactions of this element deal +50% to it (shown on its health bar). */
    const ENEMIES = {
        grunt: { id: 'grunt', base: 'shambler', name: 'Vault Husk', role: 'Grunt', hp: 90, speed: 2.5, attack: 11, xp: 10, gold: 3,
            weak: null, desc: 'Slow melee filler. Comes in numbers.' },
        runner: { id: 'runner', base: 'sprinter', name: 'Rabid Runner', role: 'Runner', hp: 65, speed: 4.6, attack: 8, xp: 12, gold: 3,
            weak: 'chill', desc: 'Very fast double-slasher. Chill it.' },
        spitter: { id: 'spitter', base: 'hunch_spitter', name: 'Acid Spitter', role: 'Ranged', hp: 75, speed: 2.4, attack: 10, xp: 14, gold: 4,
            weak: 'shock', ranged: true, desc: 'Circles and spits acid from range.' },
        bomber: { id: 'bomber', base: 'bloater', name: 'Bile Bomber', role: 'Bomber', hp: 60, speed: 3.0, attack: 26, xp: 12, gold: 4,
            weak: 'burn', minFloor: 3, desc: 'Explodes next to you. Shoot it early.' },
        brute: { id: 'brute', base: 'shield_walker', name: 'Riot Brute', role: 'Tank', hp: 300, speed: 2.1, attack: 24, xp: 30, gold: 9,
            weak: 'expose', armored: true, minFloor: 6, desc: 'Front shield blocks 75%. Flank it, or Expose it to break the shield.' },
        mender: { id: 'mender', base: 'vampire_siren', name: 'Blood Mender', role: 'Healer', hp: 110, speed: 3.0, attack: 0, xp: 26, gold: 8,
            weak: 'burn', healer: true, minFloor: 6, desc: 'Keeps its distance and heals allies. Kill it first.' },
        hexer: { id: 'hexer', base: 'shadow_stalker', name: 'Void Hexer', role: 'Disruptor', hp: 120, speed: 2.8, attack: 12, xp: 28, gold: 8,
            weak: 'chill', ranged: true, hexer: true, attackType: 'aether_bolt', habit: 'flank_circle', minFloor: 11,
            desc: 'Its bolts silence your abilities for 3 s. Stay out of its sight line.' },
        hound: { id: 'hound', base: 'bone_hound', name: 'Sump Hound', role: 'Pursuer', hp: 72, speed: 5.1, attack: 13, xp: 15, gold: 4,
            weak: 'chill', minFloor: 3, desc: 'A low, fast melee hunter. Slow it before it closes the gap.' },
        cinder: { id: 'cinder', base: 'ember_dwarf', name: 'Kiln Thrower', role: 'Skirmisher', hp: 120, speed: 3.1, attack: 15, xp: 20, gold: 6,
            weak: 'chill', ranged: true, minFloor: 6, desc: 'Throws cinders across open ground. Fight from cover.' },
        frost: { id: 'frost', base: 'frost_gnome', name: 'Rime Slinger', role: 'Ranged', hp: 105, speed: 3.2, attack: 14, xp: 22, gold: 6,
            weak: 'burn', ranged: true, minFloor: 11, desc: 'Flanks while throwing frost projectiles. Combust breaks up its escort.' },
        ogre: { id: 'ogre', base: 'iron_ogre', name: 'Archive Bulwark', role: 'Tank', hp: 380, speed: 2.0, attack: 29, xp: 35, gold: 11,
            weak: 'expose', armored: true, minFloor: 16, desc: 'Armored from the front. Flank it or strip its armor with Expose.' },
        spark: { id: 'spark', base: 'lightning_sprite', name: 'Relay Wisp', role: 'Ranged', hp: 100, speed: 4.2, attack: 13, xp: 23, gold: 7,
            weak: 'expose', ranged: true, minFloor: 21, desc: 'A small hovering target that drifts around cover and throws aether bolts.' },
        oracle: { id: 'oracle', base: 'swamp_witch', name: 'Spore Oracle', role: 'Healer', hp: 158, speed: 3.2, attack: 0, xp: 32, gold: 10,
            weak: 'burn', healer: true, minFloor: 26, desc: 'Hangs back and restores nearby enemies. Separate it from the pack.' },
        prowler: { id: 'prowler', base: 'saber_tigerman', name: 'Breach Prowler', role: 'Pursuer', hp: 188, speed: 5.2, attack: 22, xp: 31, gold: 9,
            weak: 'chill', minFloor: 31, desc: 'A fast double-claw threat. Chill gives you room to reposition.' },
        cantor: { id: 'cantor', base: 'arch_witch', name: 'Null Cantor', role: 'Disruptor', hp: 190, speed: 3.2, attack: 18, xp: 34, gold: 10,
            weak: 'shock', ranged: true, hexer: true, minFloor: 36, desc: 'Blinks around the arena and silences your abilities with aether bolts.' }
    };

    const ELITE_AFFIXES = {
        vampiric: { id: 'vampiric', name: 'Vampiric', color: '#ef4444', hex: 0xef4444, desc: 'Regenerates 4% HP per second when not hit for 2.5 s.' },
        warded: { id: 'warded', name: 'Warded', color: '#a78bfa', hex: 0xa78bfa, desc: 'Takes 60% less gun damage until an ability or Expose breaks the ward.' },
        hasted: { id: 'hasted', name: 'Hasted', color: '#22d3ee', hex: 0x22d3ee, desc: 'Moves 40% faster.' },
        volatile: { id: 'volatile', name: 'Volatile', color: '#f59e0b', hex: 0xf59e0b, desc: 'Explodes 0.8 s after dying. Back off.' }
    };
    const ELITE = { hpMult: 2.6, sizeMult: 1.25, xpMult: 3, goldMult: 3 };

    const BOSSES = [
        { id: 'boss_butcher', name: 'THE BUTCHER', title: 'Cleaver of the Substation', hp: 1500, speed: 3.6, attack: 30, xp: 260, gold: 120 },
        { id: 'boss_witch_queen', name: 'COVEN MATRIARCH', title: 'Hex-Queen of the Furnace', hp: 2400, speed: 3.4, attack: 30, xp: 380, gold: 180 },
        { id: 'boss_lycan_king', name: 'LYCAN KING', title: 'Warden of the Cryo Vault', hp: 3400, speed: 4.6, attack: 34, xp: 520, gold: 250 },
        { id: 'boss_colossus', name: 'IRON COLOSSUS', title: 'Abyssal Siege Engine', hp: 4400, speed: 2.8, attack: 40, xp: 680, gold: 320 },
        { id: 'boss_nyx', name: 'OVERLORD NYX', title: 'Sovereign of the Abyss', hp: 5200, speed: 3.6, attack: 38, xp: 820, gold: 400 },
        { id: 'boss_plague', name: 'THE BLOOMKEEPER', title: 'Custodian of the Spore Gardens', hp: 6050, speed: 3.1, attack: 35, xp: 950, gold: 470, escort: 'oracle', set: 'mire' },
        { id: 'boss_cerberus', name: 'RELAY CERBERUS', title: 'Hound of the Storm Relay', hp: 6750, speed: 4.2, attack: 37, xp: 1100, gold: 540, escort: 'spark', set: 'surge' },
        { id: 'boss_ogre_emperor', name: 'THE LAST ARCHIVIST', title: 'Keeper of the Black Archive', hp: 7550, speed: 2.8, attack: 42, xp: 1250, gold: 610, escort: 'ogre', set: 'bastion' },
        { id: 'boss_manbearpig', name: 'THE CINDER BEAST', title: 'Hunter of the Ember Crucible', hp: 8350, speed: 4.0, attack: 40, xp: 1400, gold: 680, escort: 'cinder', set: 'kiln' },
        { id: 'boss_hydra_matron', name: 'THE FAULT MATRON', title: 'Guardian of the Null Fault', hp: 9400, speed: 3.4, attack: 43, xp: 1550, gold: 760, escort: 'cantor' }
    ];

    /* ---------------- Biomes (every 5 floors) ---------------- */
    const BIOMES = [
        { id: 'substation', name: 'Sunken Substation', floors: [1, 5], floorMat: 'concrete', wallMat: 'soviet_concrete', coverMat: 'rusted_metal', crateMat: 'wood_crate',
            light: 0x5eead4, accent: '#5eead4', atmosphere: { skyTop: 0x02090b, skyBottom: 0x07191c, fogColor: 0x061416, fogDensity: 0.028, sunColor: 0x9ff6e8, sunIntensity: 0.55, sunPos: [18, 40, -12], hemiSky: 0x2b5c5a, hemiGround: 0x0b1111, hemiIntensity: 0.62 },
            pool: { grunt: 44, runner: 20, spitter: 18, bomber: 10, hound: 8 } },
        { id: 'furnace', name: 'Furnace Works', floors: [6, 10], floorMat: 'rust_steel', wallMat: 'brick', coverMat: 'diamond_plate', crateMat: 'wood_crate',
            light: 0xfb923c, accent: '#fb923c', atmosphere: { skyTop: 0x0c0402, skyBottom: 0x2a0d05, fogColor: 0x1d0a04, fogDensity: 0.026, sunColor: 0xffa66b, sunIntensity: 0.7, sunPos: [-20, 36, 16], hemiSky: 0x6b2e14, hemiGround: 0x140806, hemiIntensity: 0.6 },
            pool: { grunt: 24, runner: 13, spitter: 10, bomber: 12, brute: 14, mender: 12, cinder: 15 } },
        { id: 'cryo', name: 'Cryo Vault', floors: [11, 15], floorMat: 'diamond_plate', wallMat: 'lab_panel', coverMat: 'pentagon_panel', crateMat: 'container_blue',
            light: 0x93c5fd, accent: '#93c5fd', atmosphere: { skyTop: 0x02040b, skyBottom: 0x0a1630, fogColor: 0x0a1328, fogDensity: 0.024, sunColor: 0xcfe3ff, sunIntensity: 0.75, sunPos: [10, 44, 20], hemiSky: 0x3a5a8c, hemiGround: 0x0a0d16, hemiIntensity: 0.66 },
            pool: { grunt: 14, hound: 16, spitter: 9, bomber: 8, brute: 12, mender: 11, hexer: 12, frost: 18 } },
        { id: 'abyss', name: 'The Abyss', floors: [16, 25], floorMat: 'bunker_stone', wallMat: 'dark_slate_roof', coverMat: 'castle_stone', crateMat: 'container_red',
            light: 0xc084fc, accent: '#c084fc', atmosphere: { skyTop: 0x05020a, skyBottom: 0x180a2a, fogColor: 0x10081c, fogDensity: 0.027, sunColor: 0xd8b4fe, sunIntensity: 0.6, sunPos: [-14, 40, -18], hemiSky: 0x4c2a6b, hemiGround: 0x0b0610, hemiIntensity: 0.6 },
            pool: { grunt: 12, hound: 14, spitter: 12, bomber: 10, ogre: 15, mender: 12, hexer: 15, spark: 10 } },
        { id: 'gardens', name: 'Spore Gardens', floors: [26, 30], floorMat: 'bunker_stone', wallMat: 'castle_stone', coverMat: 'rusted_metal', crateMat: 'wood_crate',
            light: 0x86efac, accent: '#86efac', atmosphere: { skyTop: 0x040d06, skyBottom: 0x173819, fogColor: 0x122718, fogDensity: 0.026, sunColor: 0xd1fa89, sunIntensity: 0.68, sunPos: [15, 44, 20], hemiSky: 0x648f53, hemiGround: 0x111707, hemiIntensity: 0.62 },
            pool: { hound: 18, spitter: 18, bomber: 17, oracle: 20, ogre: 15, frost: 12 } },
        { id: 'relay', name: 'Storm Relay', floors: [31, 35], floorMat: 'lab_panel', wallMat: 'diamond_plate', coverMat: 'pentagon_panel', crateMat: 'container_blue',
            light: 0x67e8f9, accent: '#67e8f9', atmosphere: { skyTop: 0x020b12, skyBottom: 0x0d3048, fogColor: 0x0e2434, fogDensity: 0.02, sunColor: 0xb6f2ff, sunIntensity: 0.82, sunPos: [-24, 38, -16], hemiSky: 0x357b91, hemiGround: 0x0d1525, hemiIntensity: 0.65 },
            pool: { spark: 28, prowler: 19, frost: 15, brute: 13, hexer: 14, mender: 11 } },
        { id: 'archive', name: 'Black Archive', floors: [36, 40], floorMat: 'dark_slate_roof', wallMat: 'bunker_stone', coverMat: 'lab_panel', crateMat: 'container_blue',
            light: 0xf9a8d4, accent: '#f9a8d4', atmosphere: { skyTop: 0x100512, skyBottom: 0x301932, fogColor: 0x24152e, fogDensity: 0.021, sunColor: 0xf5c4fa, sunIntensity: 0.7, sunPos: [24, 38, -12], hemiSky: 0x755b98, hemiGround: 0x160e20, hemiIntensity: 0.64 },
            pool: { ogre: 23, cantor: 20, oracle: 14, prowler: 15, spark: 16, frost: 12 } },
        { id: 'crucible', name: 'Ember Crucible', floors: [41, 45], floorMat: 'rust_steel', wallMat: 'castle_stone', coverMat: 'rusted_metal', crateMat: 'container_red',
            light: 0xfcd34d, accent: '#fcd34d', atmosphere: { skyTop: 0x170601, skyBottom: 0x46210c, fogColor: 0x391609, fogDensity: 0.024, sunColor: 0xffd49a, sunIntensity: 0.85, sunPos: [-16, 40, 18], hemiSky: 0x9a511e, hemiGround: 0x210c02, hemiIntensity: 0.65 },
            pool: { cinder: 27, prowler: 22, ogre: 18, bomber: 15, oracle: 10, cantor: 8 } },
        { id: 'fault', name: 'Null Fault', floors: [46, Infinity], floorMat: 'pentagon_panel', wallMat: 'dark_slate_roof', coverMat: 'diamond_plate', crateMat: 'container_red',
            light: 0xa5b4fc, accent: '#a5b4fc', atmosphere: { skyTop: 0x050616, skyBottom: 0x19183d, fogColor: 0x12132f, fogDensity: 0.022, sunColor: 0xc7d2fe, sunIntensity: 0.73, sunPos: [12, 47, -18], hemiSky: 0x57538f, hemiGround: 0x0f0b1b, hemiIntensity: 0.69 },
            pool: { cantor: 22, spark: 17, prowler: 17, ogre: 16, oracle: 12, frost: 8, cinder: 8 } }
    ];
    function biomeForFloor(floor) {
        return BIOMES.find((b) => floor >= b.floors[0] && floor <= b.floors[1]) || BIOMES[BIOMES.length - 1];
    }

    /* ---------------- Room types (next-room choice) ---------------- */
    const ROOMS = {
        combat: { id: 'combat', name: 'Combat', icon: '⚔', color: '#e2e8f0', desc: 'A standard fight. Steady XP and gold.', weight: 46 },
        elite: { id: 'elite', name: 'Elite', icon: '☠', color: '#f87171', desc: 'An elite enemy with its pack. Harder — rewards a Boon and a Rare+ item.', weight: 18, minFloor: 2 },
        treasure: { id: 'treasure', name: 'Treasure', icon: '◆', color: '#fde047', desc: 'A guarded vault chest full of gold and an item.', weight: 14 },
        ambush: { id: 'ambush', name: 'Ambush', icon: '⚑', color: '#fb923c', desc: 'Three waves, no camps. +50% gold and XP.', weight: 10, minFloor: 3 },
        shrine: { id: 'shrine', name: 'Shrine', icon: '✦', color: '#c084fc', desc: 'No enemies. Trade max HP for a Boon, or pay gold.', weight: 6, minFloor: 2, quiet: true },
        rest: { id: 'rest', name: 'Rest', icon: '✚', color: '#4ade80', desc: 'No enemies. Heal, refill potions — and you may extract here.', weight: 6, minFloor: 2, quiet: true },
        vents: { id: 'vents', name: 'Pressure Vents', icon: '♨', color: '#fbbf24', desc: 'Steam erupts from marked vents. Clear the room for a bonus vault chest.', weight: 9, minFloor: 3,
            hazard: { name: 'Steam burst', radius: 2.9, period: 5.6, warning: 1.4, damage: 0.17, count: 5 } },
        surge: { id: 'surge', name: 'Surge Circuit', icon: 'ϟ', color: '#67e8f9', desc: 'Pulses damage and briefly silence you. Clear the room for a bonus vault chest.', weight: 8, minFloor: 8,
            hazard: { name: 'Surge pulse', radius: 3.5, period: 6.8, warning: 1.7, damage: 0.13, silence: 2, count: 5 } },
        fracture: { id: 'fracture', name: 'Null Fracture', icon: '◈', color: '#c4b5fd', desc: 'Void bursts drain Ultimate charge. Clear the room for a richer vault chest.', weight: 7, minFloor: 16,
            hazard: { name: 'Void burst', radius: 4.2, period: 7.4, warning: 1.8, damage: 0.19, drain: 0.2, count: 6 } },
        boss: { id: 'boss', name: 'Boss', icon: '♛', color: '#fbbf24', desc: 'The floor guardian. Beat it to unlock a checkpoint and extract.', weight: 0 }
    };

    /* ---------------- Loot ---------------- */
    const RARITIES = [
        { id: 'common', name: 'Common', color: '#cbd5e1', hex: 0xcbd5e1, affixes: 0, power: 0, value: 6, scrap: 2 },
        { id: 'rare', name: 'Rare', color: '#60a5fa', hex: 0x60a5fa, affixes: 1, power: 0.08, value: 30, scrap: 8 },
        { id: 'epic', name: 'Epic', color: '#c084fc', hex: 0xc084fc, affixes: 2, power: 0.16, value: 90, scrap: 20 },
        { id: 'legendary', name: 'Legendary', color: '#fbbf24', hex: 0xfbbf24, affixes: 2, power: 0.25, value: 220, scrap: 45 }
    ];
    const RARITY_INDEX = { common: 0, rare: 1, epic: 2, legendary: 3 };
    function rarityWeights(floor, bonus = 0) {
        // [common, rare, epic, legendary]; deeper floors & bonuses shift toward the top.
        const d = Math.min(1, (floor - 1) / 18) + bonus;
        return [Math.max(10, 62 - 40 * d), 28 + 10 * d, 8 + 20 * d, 2 + 8 * d];
    }
    const ITEM_SLOTS = {
        weapon: { id: 'weapon', name: 'Weapon', icon: '⌖' },
        rig: { id: 'rig', name: 'Rig', icon: '⛨' },
        relic: { id: 'relic', name: 'Relic', icon: '✧' }
    };
    const ITEM_POWER_PER_LEVEL = 0.05;

    // Real guns from the arsenal (launchers & wonder weapons excluded).
    const WEAPON_POOL = [
        'm4a1', 'ak47', 'scarh', 'm16a4', 'aug_hbars', 'acr_68', 'fal_osw',
        'mp5', 'p90', 'ump45', 'vector_kriss', 'mp7_navy', 'aks74u',
        'r870', 'm1014_cod4', 'spas12_tac', 'aa12', 'ksg_slug',
        'm249', 'rpd', 'mg42_buzzsaw',
        'mk14', 'dragunov_svd', 'intervention', 'l96a1_awm',
        'deagle', 'python_magnum', 'glock18_auto'
    ];
    const RIG_NAMES = ['Ballistic Rig', 'Plate Carrier', 'Kinetic Harness', 'Recon Vest', 'Bastion Frame', 'Cinder Mantle'];
    const RELIC_NAMES = ['Focus Shard', 'Ember Sigil', 'Storm Coil', 'Rune Capacitor', 'Hex Prism', 'Echo Stone'];

    // Affix pools. v = [min, max] at Rare; Epic/Legendary roll up to +40% higher.
    const AFFIXES = {
        weapon: [
            { k: 'gunDmg', label: '+{v}% gun damage', v: [10, 22] },
            { k: 'headDmg', label: '+{v}% headshot damage', v: [15, 40] },
            { k: 'burnChance', label: '{v}% chance on hit to Burn', v: [8, 16] },
            { k: 'chillChance', label: '{v}% chance on hit to Chill', v: [8, 16] },
            { k: 'shockChance', label: '{v}% chance on hit to Shock', v: [8, 16] },
            { k: 'exposeChance', label: '{v}% chance on hit to Expose', v: [6, 12] },
            { k: 'eliteDmg', label: '+{v}% damage to elites & bosses', v: [15, 35] },
            { k: 'killHeal', label: 'Kills heal {v} HP', v: [3, 7] }
        ],
        rig: [
            { k: 'maxHp', label: '+{v} max HP', v: [15, 40] },
            { k: 'dmgReduce', label: '{v}% less damage taken', v: [5, 12] },
            { k: 'potionHeal', label: 'Potions heal {v}% more', v: [20, 45] },
            { k: 'killHeal', label: 'Kills heal {v} HP', v: [3, 7] },
            { k: 'goldFind', label: '+{v}% gold found', v: [12, 30] },
            { k: 'momentumKeep', label: 'Lose {v}% less Momentum when hit', v: [30, 60] }
        ],
        relic: [
            { k: 'cdr', label: '{v}% shorter ability cooldowns', v: [8, 18] },
            { k: 'reactionDmg', label: '+{v}% reaction damage', v: [15, 40] },
            { k: 'abilityDmg', label: '+{v}% ability damage', v: [10, 28] },
            { k: 'statusDur', label: 'Statuses last {v}% longer', v: [20, 50] },
            { k: 'ultCharge', label: 'Ultimate charges {v}% faster', v: [15, 40] },
            { k: 'xpGain', label: '+{v}% XP', v: [10, 25] }
        ]
    };

    // Build-defining legendaries: a unique upside with a real downside.
    const LEGENDARIES = [
        { id: 'hellmouth', slot: 'weapon', base: 'aa12', name: 'Hellmouth', unique: 'Every gun hit applies Burn.', downside: '−15% gun damage.',
            fx: { alwaysBurn: true, gunDmg: -15 } },
        { id: 'glacier_edge', slot: 'weapon', base: 'l96a1_awm', name: "Glacier's Edge", unique: 'Headshots Chill and instantly detonate the target.', downside: '−30% body-shot damage.',
            fx: { headDetonate: true, bodyDmg: -30 } },
        { id: 'voltaic_choir', slot: 'weapon', base: 'mg42_buzzsaw', name: 'Voltaic Choir', unique: 'Every 8th hit Shocks and detonates its target.', downside: '−10% gun damage.',
            fx: { everyNthDetonate: 8, gunDmg: -10 } },
        { id: 'juggernaut_shell', slot: 'rig', name: 'Juggernaut Shell', unique: '+60% max HP.', downside: 'Potions heal 50% less.',
            fx: { maxHpPct: 60, potionHeal: -50 } },
        { id: 'bloodpact', slot: 'rig', name: 'Bloodpact Harness', unique: 'Kills heal 6% of max HP.', downside: 'Take 20% more damage.',
            fx: { killHealPct: 6, dmgReduce: -20 } },
        { id: 'cascade_engine', slot: 'relic', name: 'Cascade Engine', unique: 'Every reaction triggers twice.', downside: 'Ability cooldowns +30%.',
            fx: { doubleReactions: true, cdr: -30 } },
        { id: 'prism_core', slot: 'relic', name: 'Prism Core', unique: 'Primers also apply a random extra status.', downside: 'Ultimate charges 30% slower.',
            fx: { prismPrimer: true, ultCharge: -30 } },
        { id: 'gamblers_coin', slot: 'relic', name: "Gambler's Coin", unique: '+80% gold found.', downside: '−25% max HP.',
            fx: { goldFind: 80, maxHpPct: -25 } }
    ];

    const SETS = {
        mire: { name: 'Sumpwalker', minFloor: 26, bonuses: [
            { pieces: 2, desc: '+12 HP healed per kill and +20% status duration.', fx: { killHeal: 12, statusDur: 20 } },
            { pieces: 3, desc: 'Kills also heal 4% of max HP.', fx: { killHealPct: 4 } }
        ] },
        surge: { name: 'Storm Relay', minFloor: 31, bonuses: [
            { pieces: 2, desc: '18% shorter cooldowns and Ultimate charges 25% faster.', fx: { cdr: 18, ultCharge: 25 } },
            { pieces: 3, desc: 'Every reaction triggers twice.', fx: { doubleReactions: true } }
        ] },
        bastion: { name: 'Archive Guard', minFloor: 36, bonuses: [
            { pieces: 2, desc: '+20% max HP and 12% less damage taken.', fx: { maxHpPct: 20, dmgReduce: 12 } },
            { pieces: 3, desc: '+40% damage against elites and bosses.', fx: { eliteDmg: 40 } }
        ] },
        kiln: { name: 'Kilnforged', minFloor: 41, bonuses: [
            { pieces: 2, desc: '+20% ability damage and +25% reaction damage.', fx: { abilityDmg: 20, reactionDmg: 25 } },
            { pieces: 3, desc: 'Every gun hit applies Burn.', fx: { alwaysBurn: true } }
        ] }
    };
    LEGENDARIES.push(
        { id: 'mire_spitter', set: 'mire', slot: 'weapon', base: 'mp5', name: 'Sump Spitter', unique: 'Kills heal 9 HP.', downside: '−12% gun damage.', fx: { killHeal: 9, gunDmg: -12 } },
        { id: 'mire_coat', set: 'mire', slot: 'rig', name: 'Fen Coat', unique: 'Potions heal 45% more.', downside: '−15% max HP.', fx: { potionHeal: 45, maxHpPct: -15 } },
        { id: 'mire_seed', set: 'mire', slot: 'relic', name: 'Pale Seed', unique: '+55% status duration.', downside: '−12% ability damage.', fx: { statusDur: 55, abilityDmg: -12 } },
        { id: 'surge_carbine', set: 'surge', slot: 'weapon', base: 'acr_68', name: 'Relay Breaker', unique: 'Every 6th hit Shocks and detonates its target.', downside: '−18% gun damage.', fx: { everyNthDetonate: 6, gunDmg: -18 } },
        { id: 'surge_rig', set: 'surge', slot: 'rig', name: 'Relay Grounding', unique: 'Lose 60% less Momentum when hit.', downside: 'Potions heal 20% less.', fx: { momentumKeep: 60, potionHeal: -20 } },
        { id: 'surge_clock', set: 'surge', slot: 'relic', name: 'Arc Clock', unique: 'Cooldowns 25% shorter.', downside: 'Ultimate charges 20% slower.', fx: { cdr: 25, ultCharge: -20 } },
        { id: 'archive_rifle', set: 'bastion', slot: 'weapon', base: 'fal_osw', name: 'Red Ledger', unique: '+40% headshot damage.', downside: '−20% body-shot damage.', fx: { headDmg: 40, bodyDmg: -20 } },
        { id: 'archive_rig', set: 'bastion', slot: 'rig', name: 'Lockplate', unique: 'Take 18% less damage.', downside: '−15% gold found.', fx: { dmgReduce: 18, goldFind: -15 } },
        { id: 'archive_seal', set: 'bastion', slot: 'relic', name: 'Sealed Index', unique: '+30% damage against elites and bosses.', downside: 'Cooldowns 15% longer.', fx: { eliteDmg: 30, cdr: -15 } },
        { id: 'kiln_shotgun', set: 'kiln', slot: 'weapon', base: 'ksg_slug', name: 'Slag Driver', unique: 'Gun hits have a 30% chance to Burn.', downside: '−20% headshot damage.', fx: { burnChance: 30, headDmg: -20 } },
        { id: 'kiln_rig', set: 'kiln', slot: 'rig', name: 'Forgeman’s Apron', unique: '+18% ability damage.', downside: 'Take 10% more damage.', fx: { abilityDmg: 18, dmgReduce: -10 } },
        { id: 'kiln_ember', set: 'kiln', slot: 'relic', name: 'Banked Ember', unique: '+45% reaction damage.', downside: '−20% status duration.', fx: { reactionDmg: 45, statusDur: -20 } }
    );

    // Each contract is scoped to a single delve and pays only on extraction.
    const CONTRACTS = {
        sweep: { name: 'Vault Sweep', objective: 'Defeat 24 enemies', event: 'kills', goal: 24, floor: 1, gold: 140, scrap: 12 },
        compound: { name: 'Compound Reactions', objective: 'Trigger 18 elemental reactions', event: 'reactions', goal: 18, floor: 1, gold: 155, scrap: 14 },
        guardian: { name: 'Break the Gate', objective: 'Defeat a guardian', event: 'bosses', goal: 1, floor: 1, gold: 180, scrap: 18 },
        salvage: { name: 'Salvage Survey', objective: 'Open 3 vault chests or hidden caches', event: 'containers', goal: 3, floor: 1, gold: 170, scrap: 22 },
        pressure: { name: 'Pressure Test', objective: 'Clear 2 hazard rooms', event: 'hazards', goal: 2, floor: 1, gold: 220, scrap: 22 },
        hunters: { name: 'Pack Hunters', objective: 'Defeat 3 elites', event: 'elites', goal: 3, floor: 6, gold: 240, scrap: 22 },
        deep_sweep: { name: 'Deep Patrol', objective: 'Clear 6 combat floors', event: 'clears', goal: 6, floor: 11, gold: 270, scrap: 26 },
        breach: { name: 'Two Locks Down', objective: 'Defeat 2 guardians', event: 'bosses', goal: 2, floor: 16, gold: 360, scrap: 34 },
        faultline: { name: 'Faultline Survey', objective: 'Clear 3 hazard rooms', event: 'hazards', goal: 3, floor: 26, gold: 440, scrap: 46 },
        endgame: { name: 'End of the Line', objective: 'Defeat the Fault Matron', event: 'matron', goal: 1, floor: 46, gold: 750, scrap: 70 }
    };

    /* ---------------- Boons (run-only, pick 1 of 3) ---------------- */
    const BOONS = [
        { id: 'glass_cannon', name: 'Glass Cannon', icon: '◇', desc: '+35% damage, −25% max HP.' },
        { id: 'overclock', name: 'Overclock', icon: '⟳', desc: 'Ability cooldowns 25% shorter.' },
        { id: 'chain_reaction', name: 'Chain Reaction', icon: '∞', desc: 'Reactions re-apply their status 35% of the time.' },
        { id: 'second_wind', name: 'Second Wind', icon: '❤', desc: 'Once this delve, lethal damage leaves you at 30% HP.' },
        { id: 'vampiric_rounds', name: 'Vampiric Rounds', icon: '🩸', desc: 'Gun hits heal 1.5% of the damage dealt; kills heal 3 HP.' },
        { id: 'thermal_rounds', name: 'Thermal Rounds', icon: '🔥', desc: 'Gun hits have a 15% chance to Burn.' },
        { id: 'cryo_rounds', name: 'Cryo Rounds', icon: '❄', desc: 'Gun hits have a 15% chance to Chill.' },
        { id: 'static_rounds', name: 'Static Rounds', icon: '⚡', desc: 'Gun hits have a 15% chance to Shock.' },
        { id: 'exposing_rounds', name: 'Exposing Rounds', icon: '◎', desc: 'Headshots Expose.' },
        { id: 'fortune', name: 'Fortune', icon: '◆', desc: '+40% gold found.' },
        { id: 'deep_pockets', name: 'Deep Pockets', icon: '▣', desc: '+2 pack slots this delve.' },
        { id: 'adrenal', name: 'Adrenal', icon: '➹', desc: 'Momentum caps at 15 stacks and decays half as fast.' },
        { id: 'potion_belt', name: 'Potion Belt', icon: '⚗', desc: '+1 potion and refill all potions now.' },
        { id: 'executioner', name: 'Executioner', icon: '✕', desc: '+50% damage to enemies below 30% HP.' },
        { id: 'reactive_mend', name: 'Reactive Mend', icon: '✚', desc: 'Every reaction heals you 3 HP.' },
        { id: 'long_fuse', name: 'Long Fuse', icon: '◴', desc: 'Statuses last 50% longer.', fx: { statusDur: 50 } },
        { id: 'witchfire', name: 'Witchfire', icon: '✷', desc: '+35% reaction damage and −15% gun damage.', fx: { reactionDmg: 35, gunDmg: -15 } },
        { id: 'glass_sight', name: 'Glass Sight', icon: '⌖', desc: '+40% headshot damage and −20% body-shot damage.', fx: { headDmg: 40, bodyDmg: -20 } },
        { id: 'guardian_hunter', name: 'Guardian Hunter', icon: '♛', desc: '+35% damage to elites and guardians.', fx: { eliteDmg: 35 } },
        { id: 'tonic', name: 'Concentrated Tonic', icon: '⚗', desc: 'Potions heal 45% more.', fx: { potionHeal: 45 } },
        { id: 'bulkhead', name: 'Bulkhead', icon: '⛨', desc: 'Take 15% less damage.', fx: { dmgReduce: 15 } },
        { id: 'bookkeeper', name: 'Bookkeeper', icon: '▤', desc: '+25% XP.', fx: { xpGain: 25 } },
        { id: 'field_study', name: 'Field Study', icon: '⊕', desc: '+25% ability damage.', fx: { abilityDmg: 25 } },
        { id: 'voltage', name: 'Live Wires', icon: 'ϟ', desc: 'Ultimate charges 40% faster.', fx: { ultCharge: 40 } },
        { id: 'steady', name: 'Steady Nerves', icon: '◎', desc: 'Lose 60% less Momentum when hit.', fx: { momentumKeep: 60 } }
    ];

    /* ---------------- Haven upgrades (permanent gold sinks) ---------------- */
    const UPGRADES = [
        { id: 'potion_belt', name: 'Potion Belt', icon: '⚗', desc: '+1 potion carried per level.', costs: [150, 420, 950] },
        { id: 'alchemy', name: 'Alchemy', icon: '✚', desc: 'Potions heal +15% more per level.', costs: [140, 380, 880] },
        { id: 'field_pack', name: 'Field Pack', icon: '▣', desc: '+1 delve pack slot per level.', costs: [120, 360, 820] },
        { id: 'insurance', name: 'Insurance', icon: '⛉', desc: 'Keep 15% of unbanked gold per level when you die.', costs: [200, 520, 1150] },
        { id: 'scavenger', name: "Scavenger's Eye", icon: '◎', desc: '+12% item drop chance per level.', costs: [240, 620, 1350] },
        { id: 'vault_racks', name: 'Vault Racks', icon: '▥', desc: '+8 Haven stash slots per level.', costs: [260, 650, 1450] },
        { id: 'second_wind', name: 'Field Medic', icon: '❤', desc: 'Once per delve, lethal damage leaves you at 25% HP.', costs: [1500] }
    ];
    const BASE_POTIONS = 3;
    const BASE_POTION_HEAL = 0.4; // fraction of max HP
    const BASE_PACK_SLOTS = 6;
    const STASH_SIZE = 30;

    const ELIXIRS = [
        { id: 'wrath', name: 'Elixir of Wrath', icon: '⚔', cost: 120, desc: 'Next delve: +15% damage.' },
        { id: 'iron', name: 'Elixir of Iron', icon: '⛨', cost: 120, desc: 'Next delve: +20% max HP.' },
        { id: 'fortune', name: 'Elixir of Fortune', icon: '◆', cost: 100, desc: 'Next delve: +30% gold found.' }
    ];

    const FORGE = {
        rerollGold: [0, 60, 140, 260],
        rerollScrap: [0, 12, 28, 50],
        promoteGold: [150, 420, 950],   // common→rare, rare→epic, epic→legendary
        promoteScrap: [30, 80, 170],
        reforgeLevelScrap: 6           // per item level gained
    };

    const SHRINE = { hpCostPct: 20, goldCost: (floor) => 60 + floor * 18 };

    const ISAAC = {
        heartHeal: 25,
        soulHeartAmount: 25,
        soulShieldCap: 150,
        devilHpCostPct: 0.15,
        bombDamage: 185,
        bombRadius: 4.8,
        bombFuse: 1.55,
        startKeys: 1,
        startBombs: 2,
        shopPrices: {
            heart_red: 15,
            heart_soul: 26,
            key: 16,
            bomb_pickup: 16,
            battery: 28,
            pill: 22,
            card: 26,
            artifact: 65,
            active: 70
        }
    };

    BO.RPGData = {
        STATUSES, STATUS_ORDER, REACTIONS, CLASSES, CLASS_ORDER, TALENTS, TALENT_TIER_LEVELS,
        LEVEL_CAP, xpToNext, levelHpBonus, levelPotionBonus, abilityPower, recommendedLevel,
        MOMENTUM, DIFFICULTIES, enemyHpMult, enemyDmgMult, depthRewardMult,
        ENEMIES, ELITE_AFFIXES, ELITE, BOSSES, BIOMES, biomeForFloor, ROOMS,
        RARITIES, RARITY_INDEX, rarityWeights, ITEM_SLOTS, ITEM_POWER_PER_LEVEL, WEAPON_POOL, RIG_NAMES, RELIC_NAMES,
        AFFIXES, LEGENDARIES, SETS, CONTRACTS, BOONS, UPGRADES, BASE_POTIONS, BASE_POTION_HEAL, BASE_PACK_SLOTS, STASH_SIZE,
        ELIXIRS, FORGE, SHRINE, ISAAC,
        talentById(classId, talentId) {
            for (const tier of TALENTS[classId] || []) {
                const t = tier.find((x) => x.id === talentId);
                if (t) return t;
            }
            return null;
        },
        boonById(id) { return BOONS.find((b) => b.id === id) || null; },
        legendaryById(id) { return LEGENDARIES.find((l) => l.id === id) || null; },
        upgradeById(id) { return UPGRADES.find((u) => u.id === id) || null; }
    };
})(window);
;

/* --- src/data/RPGItemsData.js --- */
/* ============================================================================
   BLACKOUT OPS — RPG Mode Isaac-Style Artifacts, Actives, Pills, Cards & Synergies
   Loaded after RPGData.js. Zero-build IIFE pattern.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    /* ---------------- 40 Passive Items & Artifacts ---------------- */
    const PASSIVES = [
        // --- Shot & Tear Modifiers ---
        { id: 'inner_eye', name: 'Inner Eye', icon: '👁', color: '#e2e8f0', hex: 0xe2e8f0, tier: 'A',
            pools: ['treasure', 'boss'], tags: ['seraph'],
            desc: 'Triple Shot fan (+2 projectiles per shot, slight fire-rate penalty).',
            fx: { multishot: 2, spreadAdd: 0.042, fireRateMult: 0.84 } },
        { id: 'mutant_spider', name: 'Mutant Spider', icon: '🕷', color: '#c084fc', hex: 0xc084fc, tier: 'S',
            pools: ['treasure', 'devil'], tags: ['void'],
            desc: 'Quad Shot (+3 projectiles per shot, slower rate of fire).',
            fx: { multishot: 3, spreadAdd: 0.062, fireRateMult: 0.72 } },
        { id: 'spoon_bender', name: 'Spoon Bender', icon: '🥄', color: '#a855f7', hex: 0xa855f7, tier: 'A',
            pools: ['treasure', 'shop'], tags: ['storm'],
            desc: 'Psychic purple bolts home toward nearby enemies.',
            fx: { homing: true, tracerColor: 0xa855f7, rangeMult: 1.1 } },
        { id: 'rubber_cement', name: 'Rubber Cement', icon: '🟣', color: '#f472b6', hex: 0xf472b6, tier: 'A',
            pools: ['treasure', 'shop'], tags: ['storm'],
            desc: 'Shots ricochet off walls and obstacles up to 2 times.',
            fx: { bounceCount: 2, tracerColor: 0xf472b6 } },
        { id: 'cupids_arrow', name: "Cupid's Arrow", icon: '💘', color: '#fb7185', hex: 0xfb7185, tier: 'A',
            pools: ['treasure', 'angel'], tags: ['seraph'],
            desc: 'Spectral piercing shots pass through multiple enemies and thin cover.',
            fx: { pierceAdd: 2, spectral: true } },
        { id: 'ipecac', name: 'Ipecac', icon: '☣', color: '#84cc16', hex: 0x84cc16, tier: 'S',
            pools: ['treasure', 'boss'], tags: ['pyro'],
            desc: 'Explosive acid rounds (+45% damage, blast radius on hit, cracks Tinted Rocks).',
            fx: { explosive: true, explosiveRadius: 3.4, damageMult: 1.45, fireRateMult: 0.85, tracerColor: 0x84cc16, tracerWidth: 0.045 } },
        { id: 'polyphemus', name: 'Polyphemus', icon: '🧿', color: '#fca5a5', hex: 0xfca5a5, tier: 'S',
            pools: ['treasure', 'boss'], tags: ['goliath'],
            desc: 'Massive heavy rounds: 2.1× damage and oversized tracers, slower fire rate.',
            fx: { damageMult: 2.1, fireRateMult: 0.58, giantScale: 1.85, tracerWidth: 0.08 } },
        { id: 'soy_milk', name: 'Soy Milk', icon: '🥛', color: '#f8fafc', hex: 0xf8fafc, tier: 'A',
            pools: ['treasure', 'shop'], tags: ['goliath'],
            desc: '5× fire rate rapid micro-shots & 50% faster reload, at 28% per-shot damage.',
            fx: { fireRateMult: 5.0, damageMult: 0.28, reloadSpeedMult: 1.5, spreadAdd: 0.015 } },
        { id: 'brimstone_core', name: 'Brimstone Core', icon: '🩸', color: '#dc2626', hex: 0xdc2626, tier: 'S',
            pools: ['devil'], tags: ['void', 'pyro'],
            desc: 'Piercing crimson blood-laser beams (+5 pierce, +55% damage, wide beam).',
            fx: { brimstone: true, pierceAdd: 5, damageMult: 1.55, tracerColor: 0xdc2626, tracerWidth: 0.095, rangeMult: 1.4 } },
        { id: 'jacobs_ladder', name: "Jacob's Ladder", icon: '⚡', color: '#38bdf8', hex: 0x38bdf8, tier: 'S',
            pools: ['treasure', 'shop'], tags: ['storm'],
            desc: 'Hits discharge chain-lightning arcs to nearby enemies and apply Shock.',
            fx: { chainLightning: true, tracerColor: 0x38bdf8 } },
        { id: 'parasite', name: 'The Parasite', icon: '🦠', color: '#fb7185', hex: 0xfb7185, tier: 'A',
            pools: ['treasure', 'boss'], tags: ['pyro'],
            desc: 'Shots split into 2 shrapnel bolts on impact.',
            fx: { splitCount: 2, tracerColor: 0xfb7185 } },
        { id: 'tech_x', name: 'Tech X Ring', icon: '◎', color: '#22d3ee', hex: 0x22d3ee, tier: 'S',
            pools: ['treasure', 'shop'], tags: ['storm'],
            desc: 'Fires expanding plasma rings that pierce targets and shock areas.',
            fx: { techRing: true, pierceAdd: 2, damageMult: 1.15, tracerColor: 0x22d3ee, tracerWidth: 0.055 } },
        { id: 'tiny_planet', name: 'Tiny Planet', icon: '🪐', color: '#a78bfa', hex: 0xa78bfa, tier: 'B',
            pools: ['treasure'], tags: ['storm'],
            desc: 'Curved orbital shot trajectories (+35% range, +20% damage).',
            fx: { tinyPlanet: true, rangeMult: 1.35, damageMult: 1.2 } },
        { id: 'crickets_head', name: "Cricket's Head", icon: '🐾', color: '#f59e0b', hex: 0xf59e0b, tier: 'S',
            pools: ['treasure', 'boss'], tags: ['goliath'],
            desc: '1.5× total weapon damage multiplier.',
            fx: { damageMult: 1.5 } },
        { id: 'crown_of_light', name: 'Crown of Light', icon: '👑', color: '#7dd3fc', hex: 0x7dd3fc, tier: 'S',
            pools: ['angel'], tags: ['seraph'],
            desc: '2.0× weapon damage while at full Red HP.',
            fx: { fullHpDmgMult: 2.0, tracerColor: 0xbae6fd } },
        { id: 'sacred_heart', name: 'Sacred Heart', icon: '❤', color: '#fb7185', hex: 0xfb7185, tier: 'S',
            pools: ['angel'], tags: ['seraph'],
            desc: 'Homing shots, 1.75× damage, +35 Max HP, and restores full Red HP on pickup.',
            fx: { homing: true, damageMult: 1.75, maxHpAdd: 35, fullHealOnPickup: true, tracerColor: 0xfda4af } },
        { id: 'pentagram', name: 'Pentagram', icon: '⛧', color: '#ef4444', hex: 0xef4444, tier: 'A',
            pools: ['devil', 'boss'], tags: ['void', 'pyro'],
            desc: '+30% weapon damage and +25% Devil/Angel deal chance.',
            fx: { damageMult: 1.3, dealChanceAdd: 0.25 } },
        { id: 'holy_mantle', name: 'Holy Mantle', icon: '🛡', color: '#bae6fd', hex: 0xbae6fd, tier: 'S',
            pools: ['angel', 'treasure'], tags: ['seraph'],
            desc: 'Negates the first hit taken on every floor.',
            fx: { holyMantle: true } },
        { id: 'dead_cat', name: 'Dead Cat', icon: '🐈', color: '#94a3b8', hex: 0x94a3b8, tier: 'A',
            pools: ['devil', 'treasure'], tags: ['void'],
            desc: 'Grants 9 revives, but reduces Max HP by 45%.',
            fx: { grantLives: 9, maxHpMult: 0.55 } },
        { id: 'midas_crown', name: 'Midas Crown', icon: '🪙', color: '#fde047', hex: 0xfde047, tier: 'A',
            pools: ['shop', 'treasure'], tags: ['goliath'],
            desc: '+45% gold drops and enemies can drop extra Golden Coins.',
            fx: { goldBonusMult: 1.45, extraCoinChance: 0.35 } },
        { id: 'vampiric_fang', name: 'Vampiric Fang', icon: '🦇', color: '#e11d48', hex: 0xe11d48, tier: 'A',
            pools: ['devil', 'boss'], tags: ['void'],
            desc: 'Kills heal 3 HP and every 5th kill restores an extra 8 HP.',
            fx: { vampiric: true } },
        { id: 'magneto', name: 'Magneto', icon: '🧲', color: '#60a5fa', hex: 0x60a5fa, tier: 'B',
            pools: ['shop', 'treasure'], tags: ['storm'],
            desc: 'Pulls coins, hearts, keys, bombs, and batteries from across the entire room.',
            fx: { magnetRange: 999 } },
        { id: 'goat_head', name: 'Goat Head', icon: '🐐', color: '#b91c1c', hex: 0xb91c1c, tier: 'S',
            pools: ['devil'], tags: ['void'],
            desc: 'Guarantees a Devil Deal or Angel Sanctum pedestal on every floor clear.',
            fx: { guaranteedDeal: true } },
        { id: 'chaos_relic', name: 'Chaos Relic', icon: '🌀', color: '#d946ef', hex: 0xd946ef, tier: 'A',
            pools: ['shop', 'treasure'], tags: ['void'],
            desc: 'Mixes all item pools — Treasure, Shop, Devil, and Angel pedestals draw from everything.',
            fx: { chaosPools: true } },

        // --- 3D Orbitals & Autonomous Buddy Familiars ---
        { id: 'cube_of_steel', name: 'Cube of Steel', icon: '🧊', color: '#94a3b8', hex: 0x94a3b8, tier: 'A',
            pools: ['treasure', 'boss'], tags: ['goliath'],
            desc: '3D rotating orbital block that damages enemies on contact and blocks enemy projectiles.',
            fx: { orbital: 'cube_of_steel' } },
        { id: 'sawblade_halo', name: 'Sawblade Halo', icon: '⚙', color: '#cbd5e1', hex: 0xcbd5e1, tier: 'A',
            pools: ['treasure', 'shop'], tags: ['goliath'],
            desc: 'Twin spinning serrated orbital blades that slice nearby enemies.',
            fx: { orbital: 'sawblade_halo' } },
        { id: 'seraph_wisp', name: 'Seraph Wisp', icon: '👼', color: '#fef08a', hex: 0xfef08a, tier: 'S',
            pools: ['angel', 'treasure'], tags: ['seraph'],
            desc: 'Floating buddy turret that follows you and fires homing sacred bolts.',
            fx: { familiar: 'seraph_wisp' } },
        { id: 'demon_imp', name: 'Demon Imp', icon: '😈', color: '#f97316', hex: 0xf97316, tier: 'A',
            pools: ['devil'], tags: ['pyro'],
            desc: 'Close-range fire-spitting familiar that Burns nearby enemies.',
            fx: { familiar: 'demon_imp' } },
        { id: 'plasma_sentinel', name: 'Plasma Sentinel', icon: '🛸', color: '#22d3ee', hex: 0x22d3ee, tier: 'A',
            pools: ['shop', 'treasure'], tags: ['storm'],
            desc: 'Laser orb drone that zaps the nearest enemy with shock beams.',
            fx: { familiar: 'plasma_sentinel' } },

        // --- Additional Iconic Run Passives ---
        { id: 'deaths_touch', name: "Death's Touch", icon: '💀', color: '#64748b', hex: 0x64748b, tier: 'S',
            pools: ['devil', 'treasure'], tags: ['void', 'goliath'],
            desc: 'Heavy piercing scythe rounds (+3 pierce, +35% damage, enlarged tracers).',
            fx: { pierceAdd: 3, damageMult: 1.35, giantScale: 1.4, tracerColor: 0x94a3b8, tracerWidth: 0.055 } },
        { id: 'proptosis', name: 'Proptosis', icon: '🔴', color: '#f87171', hex: 0xf87171, tier: 'A',
            pools: ['treasure'], tags: ['goliath'],
            desc: '+65% damage and oversized shots, at -30% range.',
            fx: { damageMult: 1.65, rangeMult: 0.7, giantScale: 1.35 } },
        { id: 'magic_mushroom', name: 'Magic Mushroom', icon: '🍄', color: '#ef4444', hex: 0xef4444, tier: 'S',
            pools: ['treasure', 'boss'], tags: ['goliath'],
            desc: 'All-stats up: +25% damage, +15% fire rate, +15% move speed, +25 Max HP.',
            fx: { damageMult: 1.25, fireRateMult: 1.15, moveSpeedMult: 1.15, maxHpAdd: 25, fullHealOnPickup: true } },
        { id: 'twin_lens', name: '20/20 Lens', icon: '👓', color: '#e2e8f0', hex: 0xe2e8f0, tier: 'S',
            pools: ['treasure', 'shop'], tags: ['seraph'],
            desc: 'Double Shot (+1 projectile per shot) with zero fire-rate penalty.',
            fx: { multishot: 1, spreadAdd: 0.022 } },
        { id: 'crickets_body', name: "Cricket's Body", icon: '🦴', color: '#fda4af', hex: 0xfda4af, tier: 'A',
            pools: ['treasure', 'boss'], tags: ['goliath'],
            desc: '+30% fire rate and shots split into 2 shrapnel bolts on impact.',
            fx: { fireRateMult: 1.3, splitCount: 2 } },
        { id: 'abaddon', name: 'Abaddon', icon: '⛧', color: '#7f1d1d', hex: 0x7f1d1d, tier: 'S',
            pools: ['devil'], tags: ['void', 'pyro'],
            desc: '+45% damage, +15% move speed, and grants +45 Soul Shield on pickup.',
            fx: { damageMult: 1.45, moveSpeedMult: 1.15, soulShieldOnPickup: 45, tracerColor: 0x991b1b } },
        { id: 'the_wafer', name: 'The Wafer', icon: '🍞', color: '#fef3c7', hex: 0xfef3c7, tier: 'S',
            pools: ['angel', 'treasure'], tags: ['seraph'],
            desc: 'Caps any single incoming hit to at most 25% of your Max HP.',
            fx: { wafer: true } },
        { id: 'speed_ball', name: 'Speed Ball', icon: '💉', color: '#38bdf8', hex: 0x38bdf8, tier: 'B',
            pools: ['boss', 'shop'], tags: ['storm'],
            desc: '+25% move speed and +25% reload speed.',
            fx: { moveSpeedMult: 1.25, reloadSpeedMult: 1.25 } },
        { id: 'the_halo', name: 'The Halo', icon: '😇', color: '#fde68a', hex: 0xfde68a, tier: 'A',
            pools: ['angel', 'boss', 'treasure'], tags: ['seraph'],
            desc: '+20 Max HP, +15% damage, +15% fire rate, +10% move speed.',
            fx: { maxHpAdd: 20, damageMult: 1.15, fireRateMult: 1.15, moveSpeedMult: 1.1 } },
        { id: 'lump_of_coal', name: 'Lump of Coal', icon: '🪨', color: '#475569', hex: 0x475569, tier: 'A',
            pools: ['treasure', 'boss'], tags: ['pyro'],
            desc: '+25% damage and +25% shot range.',
            fx: { damageMult: 1.25, rangeMult: 1.25 } },
        { id: 'dead_eye', name: 'Dead Eye', icon: '🎯', color: '#ef4444', hex: 0xef4444, tier: 'A',
            pools: ['treasure', 'shop'], tags: ['pyro'],
            desc: '+20% damage, +20% reload speed, and consecutive hits ramp up to +40% bonus damage.',
            fx: { damageMult: 1.2, reloadSpeedMult: 1.2, deadEye: true } }
    ];

    /* ---------------- 13 Active Charged Items ---------------- */
    const ACTIVES = [
        { id: 'the_d6', name: 'The D6', icon: '🎲', color: '#dc2626', hex: 0xdc2626, charges: 4,
            pools: ['treasure', 'shop'], tags: ['void'],
            desc: 'Rerolls all unclaimed Item Pedestals in the current room into new artifacts.' },
        { id: 'necronomicon', name: 'Necronomicon', icon: '📕', color: '#7f1d1d', hex: 0x7f1d1d, charges: 4,
            pools: ['devil', 'treasure'], tags: ['pyro', 'void'],
            desc: 'Unleashes a massive room-wide dark shockwave that obliterates enemies.' },
        { id: 'book_of_shadows', name: 'Book of Shadows', icon: '🛡', color: '#38bdf8', hex: 0x38bdf8, charges: 3,
            pools: ['angel', 'treasure'], tags: ['seraph'],
            desc: 'Grants a 6-second invulnerability shield.' },
        { id: 'box_of_friends', name: 'Box of Friends', icon: '🎁', color: '#f472b6', hex: 0xf472b6, charges: 3,
            pools: ['shop', 'treasure'], tags: ['goliath'],
            desc: 'Doubles all active orbitals and buddy familiars for the current room.' },
        { id: 'stopwatch', name: 'Stopwatch', icon: '⏱', color: '#fde047', hex: 0xfde047, charges: 3,
            pools: ['shop', 'treasure'], tags: ['storm'],
            desc: 'Slows all enemies in the room by 60% for 8 seconds.' },
        { id: 'soul_battery', name: 'Soul Battery', icon: '🔋', color: '#60a5fa', hex: 0x60a5fa, charges: 3,
            pools: ['angel', 'shop'], tags: ['seraph'],
            desc: 'Instantly grants +40 Blue Soul Shield.' },
        { id: 'tammys_head', name: "Tammy's Head", icon: '🐱', color: '#cbd5e1', hex: 0xcbd5e1, charges: 2,
            pools: ['treasure'], tags: ['storm'],
            desc: 'Fires a 10-way radial burst of your fully modified shots around you.' },
        { id: 'teleport_scroll', name: 'Teleport Scroll', icon: '🌀', color: '#a855f7', hex: 0xa855f7, charges: 2,
            pools: ['shop', 'treasure'], tags: ['void'],
            desc: 'Emergency blink to the safest corner of the room with a radial shockwave blast.' },
        { id: 'midas_touch', name: 'Midas Touch', icon: '✋', color: '#fbbf24', hex: 0xfbbf24, charges: 3,
            pools: ['shop', 'treasure'], tags: ['goliath'],
            desc: 'Turns nearby enemies golden (stunned 2.5s and drop 2× bonus gold on death).' },
        { id: 'turret_deployer', name: 'Turret Deployer', icon: '🔫', color: '#4ade80', hex: 0x4ade80, charges: 3,
            pools: ['shop', 'treasure'], tags: ['storm'],
            desc: 'Deploys an autonomous 3D Gun Turret for the remainder of the floor.' },
        { id: 'blood_rights', name: 'Blood Rights', icon: '🗡', color: '#e11d48', hex: 0xe11d48, charges: 2,
            pools: ['devil'], tags: ['pyro'],
            desc: 'Sacrifice 15 HP (non-lethal) to deal heavy crimson blast damage to the whole room.' },
        { id: 'chaos_orb', name: 'Chaos Orb', icon: '🔮', color: '#d946ef', hex: 0xd946ef, charges: 3,
            pools: ['devil', 'treasure'], tags: ['void'],
            desc: 'Triggers two unpredictable tactical surges across the arena.' },
        { id: 'prayer_card', name: 'Prayer Card', icon: '🙏', color: '#fef08a', hex: 0xfef08a, charges: 4,
            pools: ['angel'], tags: ['seraph'],
            desc: 'Permanently grants +15 Max HP for this delve and heals 25 HP.' }
    ];

    /* ---------------- 3-Piece Transformation Synergies ---------------- */
    const TRANSFORMATIONS = [
        { id: 'pyro', name: 'Pyromancer', icon: '🔥', color: '#f97316', hex: 0xf97316,
            desc: '3+ Pyro artifacts: 25% chance to Burn on hit, +25% explosive/fire damage, fiery ember aura.',
            fx: { damageMult: 1.15, explosiveMult: 1.25, burnChance: 0.25 } },
        { id: 'storm', name: 'Stormlord', icon: '⚡', color: '#38bdf8', hex: 0x38bdf8,
            desc: '3+ Storm artifacts: +25% fire rate and periodic lightning strikes hit nearby enemies every 3.5s.',
            fx: { fireRateMult: 1.25, periodicLightning: true } },
        { id: 'void', name: 'Voidwalker', icon: '🌑', color: '#c084fc', hex: 0xc084fc,
            desc: '3+ Void artifacts: +20% move speed, +30% damage, and +1 spectral pierce.',
            fx: { moveSpeedMult: 1.2, damageMult: 1.3, pierceAdd: 1, spectral: true } },
        { id: 'goliath', name: 'Goliath', icon: '🗿', color: '#fbbf24', hex: 0xfbbf24,
            desc: '3+ Goliath artifacts: +40 Max HP, +25% damage, and 15% damage reduction.',
            fx: { maxHpAdd: 40, damageMult: 1.25, drMult: 0.85 } },
        { id: 'seraph', name: 'Seraphim', icon: '🕊', color: '#bae6fd', hex: 0xbae6fd,
            desc: '3+ Seraph artifacts: +20% damage, +30 Soul Shield now, and +15 Soul Shield every floor clear.',
            fx: { damageMult: 1.2, floorSoulShield: 15, grantSoulShield: 30 } }
    ];

    /* ---------------- 10 Mystery Pills (seeded identification per run) ---------------- */
    const PILLS = [
        { id: 'health_up', name: 'Health Up', desc: '+20 Max HP & heal 20 HP for this delve.', positive: true },
        { id: 'health_down', name: 'Health Down', desc: '-12 Max HP for this delve (min 40).', positive: false },
        { id: 'tears_up', name: 'Fire Rate Up', desc: '+15% fire rate for this delve.', positive: true },
        { id: 'damage_up', name: 'Damage Up', desc: '+12% weapon damage for this delve.', positive: true },
        { id: 'speed_up', name: 'Speed Up', desc: '+12% move speed for this delve.', positive: true },
        { id: 'full_health', name: 'Full Health', desc: 'Restores 100% Red HP.', positive: true },
        { id: 'bad_trip', name: 'Bad Trip', desc: 'Deals 15 non-lethal damage (heals 25 HP if low!).', positive: false },
        { id: 'balls_of_steel', name: 'Balls of Steel', desc: 'Grants +35 Blue Soul Shield.', positive: true },
        { id: 'bombs_are_key', name: 'Bombs Are Key', desc: 'Swaps your current Bomb and Key counts.', positive: true },
        { id: 'telepills', name: 'Telepills', desc: 'Blinks to a random safe spot and grants +10% reload speed.', positive: true }
    ];

    const PILL_APPEARANCES = [
        { color: '#ef4444', hex: 0xef4444, capHex: 0xf8fafc, label: 'Red-White Pill' },
        { color: '#38bdf8', hex: 0x38bdf8, capHex: 0xfde047, label: 'Cobalt-Gold Pill' },
        { color: '#a855f7', hex: 0xa855f7, capHex: 0x1e1b4b, label: 'Violet-Obsidian Pill' },
        { color: '#4ade80', hex: 0x4ade80, capHex: 0xf8fafc, label: 'Emerald-White Pill' },
        { color: '#f97316', hex: 0xf97316, capHex: 0x7c2d12, label: 'Amber-Rust Pill' },
        { color: '#f472b6', hex: 0xf472b6, capHex: 0xfef08a, label: 'Rose-Cream Pill' },
        { color: '#22d3ee', hex: 0x22d3ee, capHex: 0x0f172a, label: 'Cyan-Slate Pill' },
        { color: '#fde047', hex: 0xfde047, capHex: 0x451a03, label: 'Gold-Umber Pill' },
        { color: '#94a3b8', hex: 0x94a3b8, capHex: 0xdc2626, label: 'Silver-Crimson Pill' },
        { color: '#e2e8f0', hex: 0xe2e8f0, capHex: 0x6366f1, label: 'Pearl-Indigo Pill' }
    ];

    /* ---------------- 12 Tarot / Tactical Cards ---------------- */
    const CARDS = [
        { id: 'the_fool', numeral: '0', name: 'The Fool', icon: '🃏', color: '#e2e8f0',
            desc: 'Teleports safely to room entrance, grants 2.5s invulnerability, and refills mag.' },
        { id: 'the_emperor', numeral: 'IV', name: 'The Emperor', icon: '👑', color: '#f59e0b',
            desc: '+50% Damage & +30% Fire Rate for 20 seconds.' },
        { id: 'the_sun', numeral: 'XIX', name: 'The Sun', icon: '☀', color: '#fde047',
            desc: 'Restores full Red HP and blasts every enemy in the room.' },
        { id: 'the_devil', numeral: 'XV', name: 'The Devil', icon: '😈', color: '#ef4444',
            desc: '+75% Weapon Damage for 20 seconds.' },
        { id: 'death', numeral: 'XIII', name: 'Death', icon: '💀', color: '#94a3b8',
            desc: 'Reaps every enemy in the room with heavy necrotic AoE damage.' },
        { id: 'wheel_of_fortune', numeral: 'X', name: 'Wheel of Fortune', icon: '🎡', color: '#fbbf24',
            desc: 'Spawns a bonus supply cache of coins, hearts, keys, and bombs.' },
        { id: 'the_chariot', numeral: 'VII', name: 'The Chariot', icon: '🛡', color: '#38bdf8',
            desc: '8 seconds of invulnerability, +50% speed, and contact slam damage.' },
        { id: 'the_tower', numeral: 'XVI', name: 'The Tower', icon: '🗼', color: '#f97316',
            desc: 'Drops 4 live explosive bombs around the room.' },
        { id: 'the_hermit', numeral: 'IX', name: 'The Hermit', icon: '🕯', color: '#a78bfa',
            desc: 'Grants +45 Gold, +1 Brass Key, and +1 Floor Bomb.' },
        { id: 'strength', numeral: 'XI', name: 'Strength', icon: '💪', color: '#f87171',
            desc: '+40% Damage & +30 Max HP for the current floor.' },
        { id: 'justice', numeral: 'VIII', name: 'Justice', icon: '⚖', color: '#4ade80',
            desc: 'Drops a Red Heart, a Brass Key, a Floor Bomb, and 15 Gold.' },
        { id: 'judgement', numeral: 'XX', name: 'Judgement', icon: '🎺', color: '#bae6fd',
            desc: 'Summons a free Artifact Pedestal right in front of you.' }
    ];

    const PASSIVE_BY_ID = Object.fromEntries(PASSIVES.map((x) => [x.id, x]));
    const ACTIVE_BY_ID = Object.fromEntries(ACTIVES.map((x) => [x.id, x]));
    const PILL_BY_ID = Object.fromEntries(PILLS.map((x) => [x.id, x]));
    const CARD_BY_ID = Object.fromEntries(CARDS.map((x) => [x.id, x]));
    const TRANS_BY_ID = Object.fromEntries(TRANSFORMATIONS.map((x) => [x.id, x]));

    function rollArtifact(opts = {}) {
        const pool = opts.pool || 'treasure';
        const includeActives = opts.includeActives !== false;
        const chaos = !!opts.chaos;
        const ownedPassives = opts.ownedPassives || new Set();
        const ownedActive = opts.ownedActive || null;

        let cands = PASSIVES.filter((p) => !ownedPassives.has(p.id) && (chaos || p.pools.includes(pool)));
        if (includeActives) {
            const actCands = ACTIVES.filter((a) => a.id !== ownedActive && (chaos || a.pools.includes(pool)));
            // ~22% chance to offer an Active item if none is specified
            if (opts.onlyActives) cands = actCands;
            else if (actCands.length && (!cands.length || Math.random() < 0.22)) {
                return { kind: 'active', def: actCands[Math.floor(Math.random() * actCands.length)] };
            }
        }
        if (!cands.length) cands = PASSIVES.filter((p) => !ownedPassives.has(p.id));
        if (!cands.length) cands = PASSIVES;
        const def = cands[Math.floor(Math.random() * cands.length)];
        return { kind: PASSIVE_BY_ID[def.id] ? 'passive' : 'active', def };
    }

    BO.RPGItemsData = {
        PASSIVES,
        ACTIVES,
        TRANSFORMATIONS,
        PILLS,
        PILL_APPEARANCES,
        CARDS,
        passiveById: (id) => PASSIVE_BY_ID[id] || null,
        activeById: (id) => ACTIVE_BY_ID[id] || null,
        itemById: (id) => PASSIVE_BY_ID[id] || ACTIVE_BY_ID[id] || null,
        pillById: (id) => PILL_BY_ID[id] || null,
        cardById: (id) => CARD_BY_ID[id] || null,
        transformationById: (id) => TRANS_BY_ID[id] || null,
        rollArtifact
    };
})(window);
;

/* --- src/data/RPGEncounters.js --- */
/* Extra gates and the rooms that can only be reached through Mystery. */
(function (BO) {
    'use strict';

    const R = BO.RPGData.ROOMS;
    Object.assign(R, {
        shop: { id: 'shop', name: 'Traveling Shop', icon: '⚖', color: '#f2cb81', desc: 'Spend unbanked gold on potions, supplies, or gear.', weight: 9, minFloor: 2, quiet: true },
        puzzle: { id: 'puzzle', name: 'Rune Puzzle', icon: '⌘', color: '#b5a1ff', desc: 'Repeat the rune sequence for gold and a rare item.', weight: 10, minFloor: 2, quiet: true },
        speedrun: { id: 'speedrun', name: 'Speedrun', icon: '◴', color: '#ffd2a1', desc: 'Clear the floor before time runs out to double its clear bonus.', weight: 12, minFloor: 3 },
        hunt: { id: 'hunt', name: 'Bounty Hunt', icon: '⌖', color: '#f6a4ba', desc: 'A high-value elite flees with its guards. Defeat the pack for a bounty.', weight: 8, minFloor: 4 },
        crossfire: { id: 'crossfire', name: 'Crossfire', icon: '⟐', color: '#7edbff', desc: 'Two ranged patrols fire from opposite flanks. Break line of sight.', weight: 8, minFloor: 6 },
        sanctuary: { id: 'sanctuary', name: 'Sanctuary', icon: '☼', color: '#abeab0', desc: 'A field altar heals you or refills one potion, then you move on.', weight: 6, minFloor: 3, quiet: true },
        mystery: { id: 'mystery', name: 'Mystery', icon: '?', color: '#dfb7fa', desc: 'Any regular room or an encounter found only behind Mystery.', weight: 18, minFloor: 2, quiet: true },
        thief: { id: 'thief', name: 'The Thief', icon: '♠', color: '#f6a3a7', desc: 'A pickpocket takes half your unbanked gold.', secret: true, quiet: true },
        curse: { id: 'curse', name: 'Cursed Reliquary', icon: '☾', color: '#f1a1ca', desc: 'Gain a curse for the rest of the delve. Survive it to unlock rewards.', secret: true, quiet: true },
        blessing: { id: 'blessing', name: 'Blessing', icon: '✵', color: '#f8df94', desc: 'A spirit grants healing and a choice of free Boons.', secret: true, quiet: true },
        unlock: { id: 'unlock', name: 'Unlock Room', icon: '⚿', color: '#b5f3d3', desc: 'Discover a permanent curio available only here.', secret: true, quiet: true },
        bowling: { id: 'bowling', name: 'Vault Bowling', icon: '●', color: '#8ae4e2', desc: 'Knock down ten pins with up to two rolls. A strike unlocks Copperjack.', secret: true, quiet: true },
        miniboss: { id: 'miniboss', name: 'Mini-Boss', icon: '♞', color: '#fba496', desc: 'A champion and escalating reinforcements guard a prize.', secret: true },
        defend: { id: 'defend', name: 'Defend the Area', icon: '◎', color: '#80d9d0', desc: 'Stay inside the circle for two continuous minutes while enemies spawn.', secret: true },
        wager: { id: 'wager', name: 'Coin Wager', icon: '⚄', color: '#f1cc74', desc: 'Risk a small amount of unbanked gold for a chance to double it.', secret: true, quiet: true },
        fountain: { id: 'fountain', name: 'Fountain of Exchange', icon: '♒', color: '#8ddcff', desc: 'Trade a potion for gold or pay gold for a full heal.', secret: true, quiet: true },
        forge_room: { id: 'forge_room', name: 'Field Forge', icon: '⚒', color: '#fdab7c', desc: 'Spend unbanked scrap to raise the level of one packed item.', secret: true, quiet: true },
        relay_room: { id: 'relay_room', name: 'Charge Relay', icon: 'ϟ', color: '#8cf4ec', desc: 'Restore your Ultimate and reset ability cooldowns.', secret: true, quiet: true },
        mimic: { id: 'mimic', name: 'Mimic Vault', icon: '▣', color: '#f5d492', desc: 'An inviting chest turns into an elite ambush.', secret: true },
        darkroom: { id: 'darkroom', name: 'Blackout', icon: '◐', color: '#c6b3ea', desc: 'Fight fast attackers in a vault with its lights down.', secret: true },
        storm: { id: 'storm', name: 'Aether Storm', icon: '✧', color: '#e5abff', desc: 'Fast arc bursts sweep the floor. Win an Epic or better item.',
            secret: true, hazard: { name: 'Aether burst', radius: 3.4, period: 4.6, warning: 1.2, damage: 0.15, count: 7 } }
    });

    const ENCOUNTERS = [
        { name: 'Infiltration', formation: 'camps', factor: 0.90 },
        { name: 'Pincer', formation: 'flanks', factor: 0.96, speed: 1.08 },
        { name: 'Siege Line', formation: 'ranged', factor: 0.90, damage: 1.12 },
        { name: 'Rush', formation: 'rush', factor: 1.08, speed: 1.13 },
        { name: 'Heavy Column', formation: 'tanks', factor: 0.77, hp: 1.22 },
        { name: 'Hollow Guard', formation: 'mixed', factor: 0.94, hp: 1.10 },
        { name: 'Holding Action', formation: 'camps', factor: 1.12 },
        { name: 'Breakout', formation: 'flanks', factor: 1.02, damage: 1.07 },
        { name: 'Skirmish', formation: 'ranged', factor: 0.95, speed: 1.04 },
        { name: 'Stalkers', formation: 'rush', factor: 0.92, speed: 1.18 },
        { name: 'Iron Detail', formation: 'tanks', factor: 0.81, hp: 1.30 },
        { name: 'Long Patrol', formation: 'mixed', factor: 1.03 }
    ];
    BO.RPGEncounters = ENCOUNTERS;

    BO.RPGMysteryRoom = (floor, seed) => {
        const entries = Object.values(R).filter((room) => room.id !== 'mystery' && room.id !== 'boss' && (room.secret || (room.minFloor || 1) <= floor));
        const secret = entries.filter((room) => room.secret);
        const ordinary = entries.filter((room) => !room.secret);
        const favored = secret.filter((room) => ['unlock', 'bowling', 'defend', 'curse'].includes(room.id));
        const pool = [...ordinary, ...secret, ...secret, ...favored];
        return pool[(Math.floor(seed / 13) + floor * 37) % pool.length].id;
    };
})(window.BO);
;

/* --- src/rpg/RPGUnlocks.js --- */
/* Rogue Lite roster requirements, collectible catalog, and permanent records. */
(function (BO) {
    'use strict';

    const D = BO.RPGData;
    const OPERATIVES = [
        { id: 'wayfarer', kit: 'vanguard', name: 'Wayfarer', icon: '✦', color: '#f1d090', hp: 128, weapon: 'acr_68', metric: 'extractions', goal: 3,
            role: 'Treasure runner', perk: 'Prospector', desc: 'Find 35% more gold and bring two extra pack slots.', fx: { goldFind: 35, packSlots: 2 } },
        { id: 'ashwright', kit: 'pyrotech', name: 'Ashwright', icon: '♨', color: '#fc9870', hp: 102, weapon: 'p90', metric: 'reactions', goal: 75,
            role: 'Reaction specialist', perk: 'Furnace Heart', desc: 'Deal 30% more reaction damage, with 18% longer status duration.', fx: { reactionDmg: 30, statusDur: 18 } },
        { id: 'oathkeeper', kit: 'vanguard', name: 'Oathkeeper', icon: '♜', color: '#d3bc83', hp: 156, weapon: 'scarh', metric: 'bossKills', goal: 3,
            role: 'Guardian breaker', perk: 'Oath of Iron', desc: 'Deal 32% more damage to elites and guardians.', fx: { eliteDmg: 32 } },
        { id: 'glasswing', kit: 'tempest', name: 'Glasswing', icon: '◇', color: '#a7e8fa', hp: 85, weapon: 'l96a1_awm', metric: 'speedWins', goal: 2,
            role: 'Precision sprinter', perk: 'Thin Air', desc: 'Headshots deal 42% more damage and cooldowns are 15% shorter.', fx: { headDmg: 42, cdr: 15 } },
        { id: 'glyphkeeper', kit: 'tempest', name: 'Glyphkeeper', icon: '⌘', color: '#c6b3ff', hp: 106, weapon: 'm16a4', metric: 'puzzles', goal: 3,
            role: 'Runic caster', perk: 'Inscription', desc: 'Ultimate charges 40% faster and abilities deal 15% more damage.', fx: { ultCharge: 40, abilityDmg: 15 } },
        { id: 'mirewarden', kit: 'vanguard', name: 'Mirewarden', icon: '❧', color: '#b2e0a3', hp: 136, weapon: 'rpd', metric: 'defenses', goal: 1,
            role: 'Area defender', perk: 'Rooted', desc: 'Take 14% less damage and lose 60% less Momentum when hit.', fx: { dmgReduce: 14, momentumKeep: 60 } },
        { id: 'copperjack', kit: 'pyrotech', name: 'Copperjack', icon: '⚒', color: '#eeb880', hp: 116, weapon: 'm249', metric: 'strikes', goal: 1,
            role: 'Flame gunner', perk: 'Hot Chamber', desc: 'Gun hits have a 20% chance to Burn and deal 12% more damage.', fx: { burnChance: 20, gunDmg: 12 } },
        { id: 'nightcourier', kit: 'tempest', name: 'Night Courier', icon: '☾', color: '#aab4ff', hp: 96, weapon: 'vector_kriss', metric: 'curseExtractions', goal: 1,
            role: 'Curse runner', perk: 'Last Light', desc: 'Carry one extra potion and charge Ultimate 25% faster.', fx: { potionsMax: 1, ultCharge: 25 } },
        { id: 'rosemedic', kit: 'pyrotech', name: 'Rose Medic', icon: '✚', color: '#f4acc4', hp: 119, weapon: 'ump45', metric: 'contracts', goal: 5,
            role: 'Sustain specialist', perk: 'Field Alchemy', desc: 'Potions heal 40% more and every kill restores 5 HP.', fx: { potionHeal: 40, killHeal: 5 } },
        { id: 'gildedhound', kit: 'vanguard', name: 'Gilded Hound', icon: '❖', color: '#f5db7e', hp: 124, weapon: 'ksg_slug', metric: 'legendariesBanked', goal: 5,
            role: 'Close-range collector', perk: 'Golden Bite', desc: 'Kills heal 4% of max HP and items drop more often.', fx: { killHealPct: 4, dropBonus: 0.45 } },
        { id: 'starcaller', kit: 'tempest', name: 'Starcaller', icon: '✵', color: '#8cddd2', hp: 101, weapon: 'mk14', metric: 'curios', goal: 4,
            role: 'Storm conductor', perk: 'Constellation', desc: 'Gun hits have an 18% chance to Shock and reactions deal 22% more damage.', fx: { shockChance: 18, reactionDmg: 22 } },
        { id: 'nullregent', kit: 'pyrotech', name: 'Null Regent', icon: '♛', color: '#dbc9ff', hp: 114, weapon: 'spas12_tac', metric: 'extractedFloor', goal: 30,
            role: 'Deep vault caster', perk: 'Fault Crown', desc: 'Deal 25% more ability damage and gain 20% more XP.', fx: { abilityDmg: 25, xpGain: 20 } }
    ];

    for (const character of OPERATIVES) {
        const kit = D.CLASSES[character.kit];
        D.CLASSES[character.id] = {
            ...kit, ...character, baseHp: character.hp, startWeapon: character.weapon,
            blurb: character.desc, passive: { name: character.perk, desc: character.desc + ' Also inherits ' + kit.name + '’s ' + kit.passive.name + '.' }
        };
        D.TALENTS[character.id] = D.TALENTS[character.kit];
        D.CLASS_ORDER.push(character.id);
    }

    const CATEGORIES = {
        crest: { name: 'Crests', effect: 'Changes the emblem on your operative card and delve HUD.' },
        frame: { name: 'Frames', effect: 'Changes the trim and pattern on Haven and delve panels.' },
        gate: { name: 'Gate auras', effect: 'Changes the trim and particle color around opened doors.' },
        trail: { name: 'Footstep trails', effect: 'Leaves colored sparks as you move through a delve.' },
        curio: { name: 'Vault curios', effect: 'A rare crest found only in a Mystery door’s Unlock room.' }
    };

    const THEMES = [
        ['amber', 'Amber', '#f1bc66', 'kills', 20, 30], ['fern', 'Fern', '#99db91', 'extractions', 1, 1],
        ['cinder', 'Cinder', '#f18765', 'reactions', 10, 20], ['frost', 'Frost', '#99d9ff', 'bossKills', 1, 1],
        ['indigo', 'Indigo', '#b5a7ff', 'contracts', 1, 1], ['pearl', 'Pearl', '#f2e8cf', 'puzzles', 1, 1],
        ['copper', 'Copper', '#df9669', 'speedWins', 1, 1], ['verdigris', 'Verdigris', '#76d5c4', 'defenses', 1, 1],
        ['rose', 'Rose', '#f4a0b6', 'strikes', 1, 1], ['midnight', 'Midnight', '#9baffc', 'curseExtractions', 1, 1],
        ['opal', 'Opal', '#e4c1f7', 'legendariesBanked', 1, 1], ['ivory', 'Ivory', '#f6d78a', 'extractedFloor', 5, 2]
    ];
    const SIGILS = [
        ['spark', 'Spark', '✦', 2], ['crown', 'Crown', '♛', 6], ['eye', 'Eye', '◉', 10],
        ['moon', 'Moon', '☾', 14], ['leaf', 'Leaf', '❧', 18], ['spire', 'Spire', '▲', 22]
    ];
    const catalog = [];
    for (const [slotIndex, slot] of ['crest', 'frame', 'gate', 'trail'].entries()) {
        for (const [theme, colorName, color, metric, initial, step] of THEMES) {
            for (const [sigil, sigilName, icon, pattern] of SIGILS) {
                catalog.push({
                    id: slot + '_' + theme + '_' + sigil, slot, color, icon, pattern, metric,
                    name: colorName + ' ' + sigilName, goal: initial + (slotIndex + (pattern - 2)) * step
                });
            }
        }
    }
    const curios = [
        ['Sunken Bell', '♧', '#83dfc9'], ['Gilded Key', '⚿', '#f2c470'], ['Glass Moth', '✶', '#cad8fb'],
        ['Thief’s Calling Card', '♠', '#ebadab'], ['White Raven', '❖', '#dfecfa'], ['Mercury Rose', '✿', '#f29fc6'],
        ['Salt Crown', '♕', '#f2e7c3'], ['Broken Hourglass', '⌛', '#e2b073'], ['Lantern Seed', '✺', '#8fd7a3'],
        ['Gutter Star', '✷', '#b8a2ef'], ['Bone Dice', '⚄', '#e3d6a6'], ['Empty Halo', '☉', '#c2bef8'],
        ['Furnace Pearl', '◉', '#fe967c'], ['Moon Coin', '☾', '#9cbdea'], ['Black Orchid', '✻', '#d5a4e0'],
        ['Last Compass', '⌖', '#82d9d5'], ['Hollow Chalice', '♜', '#dfa58e'], ['Ember Feather', '❧', '#f6af80']
    ].map(([name, icon, color], i) => ({ id: 'curio_' + (i + 1), slot: 'curio', name, icon, color }));
    catalog.push(...curios);

    const METRICS = {
        kills: ['Defeat', 'enemies'], extractions: ['Complete', 'extractions'], reactions: ['Trigger', 'elemental reactions'],
        bossKills: ['Defeat', 'guardians'], contracts: ['Bank', 'completed contracts'], puzzles: ['Solve', 'rune puzzles'],
        speedWins: ['Beat', 'speedrun timers'], defenses: ['Clear', 'defense rooms'], strikes: ['Roll', 'bowling strikes'],
        curseExtractions: ['Extract with a curse', 'times'], legendariesBanked: ['Bank', 'legendary items'],
        extractedFloor: ['Extract at floor', 'or deeper'], curios: ['Find', 'Vault curios']
    };
    const byId = Object.fromEntries(catalog.map((item) => [item.id, item]));

    BO.RPGUnlocks = {
        OPERATIVES, CATEGORIES, catalog, curios, byId,
        value(profile, metric) {
            if (metric === 'contracts') return Object.values(profile.contractCompletions).reduce((sum, count) => sum + count, 0);
            return profile.stats[metric] ?? profile.unlockRecords[metric] ?? 0;
        },
        requirement(item) {
            if (!item.metric) return 'Find in an Unlock room behind a Mystery door.';
            const [verb, target] = METRICS[item.metric];
            if (item.goal === 1 && item.metric === 'curseExtractions') return 'Extract while carrying a curse.';
            const singular = { enemies: 'enemy', 'legendary items': 'legendary item' };
            const noun = item.goal === 1 && target.endsWith('s') ? (singular[target] || target.slice(0, -1)) : target;
            return verb + ' ' + item.goal + ' ' + noun + '.';
        },
        unlocked(profile, item) {
            return item.metric ? this.value(profile, item.metric) >= item.goal : profile.curios.includes(item.id);
        },
        record(profile, metric, amount = 1) {
            profile.unlockRecords[metric] = (profile.unlockRecords[metric] || 0) + amount;
        },
        equipped(profile, slot) {
            return byId[profile.cosmetics[slot]] || null;
        }
    };
})(window.BO);
;

/* --- src/rpg/RPGProfile.js --- */
/* ============================================================================
   BLACKOUT OPS — RPG Profile: persistence, characters, items, derived stats.
   Stored inside BO.Save.data.rpg so Barracks save export/import covers it.
   Schema version: RPG_SCHEMA (bump + migrate in _normalize when it changes).
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const RPG_SCHEMA = 1;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
    const pickWeighted = (entries) => {
        // entries: [[value, weight], ...]
        let total = 0;
        for (const e of entries) total += Math.max(0, e[1]);
        let r = Math.random() * total;
        for (const e of entries) {
            if (e[1] <= 0) continue;
            r -= e[1];
            if (r < 0) return e[0];
        }
        return entries[entries.length - 1][0];
    };

    function freshClassRecord() {
        return { level: 1, xp: 0, talents: [null, null, null, null, null], equip: { weapon: null, rig: null, relic: null } };
    }

    function freshProfile() {
        return {
            v: RPG_SCHEMA,
            activeClass: null,
            classes: {},
            gold: 0,
            scrap: 0,
            stash: [],
            upgrades: {},
            checkpoints: [1],
            deepest: 0,
            difficulty: 'normal',
            stats: { delves: 0, extractions: 0, deaths: 0, kills: 0, bossKills: 0, goldBanked: 0, legendaries: 0, reactions: 0 },
            merchant: { stock: [], stamp: 0 },
            elixir: null,
            autoSalvage: true,
            uidSeq: 1,
            unlockRecords: {},
            challengeReceipts: [],
            cosmetics: {},
            curios: [],
            contract: null,
            contractCompletions: {},
            fieldGuide: {},
            run: null
        };
    }

    class RPGProfile {
        get D() { return BO.RPGData; }

        /** Live profile object (normalized lazily the first time it is read). */
        get data() {
            if (!this._normalized || BO.Save.data.rpg !== this._ref) {
                BO.Save.data.rpg = this._normalize(BO.Save.data.rpg);
                this._ref = BO.Save.data.rpg;
                this._normalized = true;
            }
            return BO.Save.data.rpg;
        }

        _normalize(raw) {
            const base = freshProfile();
            if (!raw || typeof raw !== 'object') return base;
            const p = Object.assign(base, raw);
            p.v = RPG_SCHEMA;
            p.stats = Object.assign(freshProfile().stats, raw.stats || {});
            p.merchant = Object.assign({ stock: [], stamp: 0 }, raw.merchant || {});
            p.upgrades = raw.upgrades && typeof raw.upgrades === 'object' ? raw.upgrades : {};
            p.stash = Array.isArray(raw.stash) ? raw.stash.filter((it) => this._validItem(it)) : [];
            p.merchant.stock = Array.isArray(p.merchant.stock) ? p.merchant.stock.filter((it) => this._validItem(it)) : [];
            p.checkpoints = Array.isArray(raw.checkpoints) && raw.checkpoints.length ? raw.checkpoints.filter((n) => Number.isFinite(n)) : [1];
            if (!p.checkpoints.includes(1)) p.checkpoints.unshift(1);
            if (!this.D.DIFFICULTIES[p.difficulty]) p.difficulty = 'normal';
            p.classes = {};
            for (const id of this.D.CLASS_ORDER) {
                const rec = raw.classes && raw.classes[id];
                if (!rec) continue;
                const c = Object.assign(freshClassRecord(), rec);
                c.level = clamp(Math.floor(c.level) || 1, 1, this.D.LEVEL_CAP);
                c.xp = Math.max(0, Math.floor(c.xp) || 0);
                c.talents = Array.isArray(rec.talents) ? rec.talents.slice(0, 5) : [null, null, null, null, null];
                while (c.talents.length < 5) c.talents.push(null);
                c.equip = Object.assign({ weapon: null, rig: null, relic: null }, rec.equip || {});
                for (const s of ['weapon', 'rig', 'relic']) if (c.equip[s] && !this._validItem(c.equip[s])) c.equip[s] = null;
                p.classes[id] = c;
            }
            if (p.activeClass && !p.classes[p.activeClass]) p.activeClass = null;
            if (p.run && (typeof p.run !== 'object' || !p.classes[p.run.classId])) p.run = null;
            p.uidSeq = Math.max(1, Math.floor(p.uidSeq) || 1);
            p.challengeReceipts = Array.isArray(raw.challengeReceipts) ? raw.challengeReceipts.filter((id) => typeof id === 'string').slice(-300) : [];
            p.unlockRecords = this._normalizeCounts(raw.unlockRecords, [
                'puzzles', 'speedWins', 'defenses', 'strikes', 'curseExtractions', 'legendariesBanked', 'extractedFloor',
                'devilDeals', 'transformations', 'artifactsCollected'
            ]);
            const unlocks = BO.RPGUnlocks;
            p.curios = Array.isArray(raw.curios) ? [...new Set(raw.curios)].filter((id) => unlocks.byId[id]?.slot === 'curio') : [];
            p.unlockRecords.curios = p.curios.length;
            p.cosmetics = {};
            p.contractCompletions = this._normalizeCounts(raw.contractCompletions, Object.keys(this.D.CONTRACTS));
            for (const [slot, id] of Object.entries(raw.cosmetics || {})) {
                const item = unlocks.byId[id];
                if (item && (slot === item.slot || slot === 'crest' && item.slot === 'curio') && unlocks.unlocked(p, item)) p.cosmetics[slot] = id;
            }
            p.contract = Object.hasOwn(this.D.CONTRACTS, p.contract) ? p.contract : null;
            p.fieldGuide = this._normalizeCounts(raw.fieldGuide, [
                ...Object.keys(this.D.ENEMIES), ...this.D.BOSSES.map((boss) => boss.id)
            ]);
            return p;
        }

        _normalizeCounts(raw, ids) {
            return Object.fromEntries(ids.filter((id) => Number.isFinite(raw?.[id]) && raw[id] >= 1)
                .map((id) => [id, Math.floor(raw[id])]));
        }

        setContract(id) {
            const contract = Object.hasOwn(this.D.CONTRACTS, id) ? this.D.CONTRACTS[id] : null;
            const p = this.data;
            if (id !== null && (!contract || !p.checkpoints.some((floor) => floor >= contract.floor))) return false;
            p.contract = id;
            this.save();
            return true;
        }

        equippedSetCount(id) {
            return Object.values(this.cls?.equip || {}).filter((item) => this.D.legendaryById(item?.legendary)?.set === id).length;
        }

        _validItem(it) {
            return !!(it && typeof it === 'object' && this.D.ITEM_SLOTS[it.slot] && this.D.RARITY_INDEX[it.rarity] !== undefined && Number.isFinite(it.ilvl));
        }

        save() { BO.Save.save(); }

        /* ---------------- Characters ---------------- */
        get hasCharacter() { return !!this.data.activeClass; }
        get classId() { return this.data.activeClass; }
        get cls() { return this.data.activeClass ? this.data.classes[this.data.activeClass] : null; }
        classRecord(id) { return this.data.classes[id] || null; }

        /** Creates (if needed) and activates a class record with its starter weapon. */
        selectClass(id) {
            const character = this.D.CLASSES[id];
            if (!character || (character.metric && !BO.RPGUnlocks.unlocked(this.data, character))) return false;
            const p = this.data;
            if (!p.classes[id]) {
                const rec = freshClassRecord();
                rec.equip.weapon = this.makeStarterWeapon(id);
                p.classes[id] = rec;
            }
            p.activeClass = id;
            this.save();
            return true;
        }

        equipCosmetic(id) {
            const item = BO.RPGUnlocks.byId[id];
            const p = this.data;
            if (!item || !BO.RPGUnlocks.unlocked(p, item)) return false;
            const slot = item.slot === 'curio' ? 'crest' : item.slot;
            if (p.cosmetics[slot] === id) delete p.cosmetics[slot];
            else p.cosmetics[slot] = id;
            this.save();
            return true;
        }

        makeStarterWeapon(classId) {
            const c = this.D.CLASSES[classId];
            return this._finalizeItem({ slot: 'weapon', rarity: 'common', ilvl: 1, base: c.startWeapon, affixes: [], legendary: null });
        }

        /* ---------------- XP & talents ---------------- */
        xpNeeded(rec = this.cls) { return rec.level >= this.D.LEVEL_CAP ? 0 : this.D.xpToNext(rec.level); }

        /** Adds XP to the active class. Returns the list of levels reached. */
        addXP(amount) {
            const rec = this.cls;
            if (!rec || amount <= 0) return [];
            const reached = [];
            if (rec.level >= this.D.LEVEL_CAP) return reached;
            rec.xp += Math.round(amount);
            while (rec.level < this.D.LEVEL_CAP && rec.xp >= this.D.xpToNext(rec.level)) {
                rec.xp -= this.D.xpToNext(rec.level);
                rec.level++;
                reached.push(rec.level);
            }
            if (rec.level >= this.D.LEVEL_CAP) rec.xp = 0;
            return reached;
        }

        tierUnlocked(tier, rec = this.cls) { return !!rec && rec.level >= this.D.TALENT_TIER_LEVELS[tier]; }

        chooseTalent(tier, talentId) {
            const rec = this.cls;
            if (!rec || !this.tierUnlocked(tier, rec)) return false;
            const options = this.D.TALENTS[this.classId][tier];
            if (!options || !options.some((t) => t.id === talentId)) return false;
            rec.talents[tier] = talentId;
            this.save();
            return true;
        }

        respec() {
            const rec = this.cls;
            if (!rec) return;
            rec.talents = [null, null, null, null, null];
            this.save();
        }

        unspentTalentTiers(rec = this.cls) {
            if (!rec) return 0;
            let n = 0;
            for (let t = 0; t < 5; t++) if (this.tierUnlocked(t, rec) && !rec.talents[t]) n++;
            return n;
        }

        talentSet(rec = this.cls) { return new Set((rec ? rec.talents : []).filter(Boolean)); }

        /* ---------------- Items ---------------- */
        _nextUid() { const p = this.data; return 'it' + (p.uidSeq++).toString(36) + Math.random().toString(36).slice(2, 5); }

        _rollAffix(slot, rarityIdx, exclude) {
            const pool = this.D.AFFIXES[slot].filter((a) => !exclude.has(a.k));
            if (!pool.length) return null;
            const a = BO.Math.pick(pool);
            const boost = 1 + 0.2 * Math.max(0, rarityIdx - 1);
            const v = Math.round(BO.Math.randRange(a.v[0], a.v[1]) * boost);
            return { k: a.k, v: Math.max(1, v) };
        }

        _finalizeItem(it) {
            it.uid = it.uid || this._nextUid();
            it.ilvl = clamp(Math.floor(it.ilvl) || 1, 1, 40);
            if (it.slot === 'weapon' && !BO.WeaponsData.get(it.base)) it.base = 'm4a1';
            it.name = this._itemName(it);
            return it;
        }

        _itemName(it) {
            if (it.legendary) {
                const L = this.D.legendaryById(it.legendary);
                if (L) return L.name;
            }
            if (it.slot === 'weapon') return BO.WeaponsData.get(it.base).shortName;
            if (it.name) return it.name;
            return BO.Math.pick(it.slot === 'rig' ? this.D.RIG_NAMES : this.D.RELIC_NAMES);
        }

        /**
         * Rolls a random item.
         * opts: { floor, slot, minRarity, rarityBonus, set, excludeLegendaries }
         */
        rollItem(opts = {}) {
            const floor = Math.max(1, opts.floor || 1);
            const weights = this.D.rarityWeights(floor, opts.rarityBonus || 0);
            const minIdx = this.D.RARITY_INDEX[opts.set ? 'legendary' : opts.minRarity] || 0;
            const rIdx = pickWeighted(weights.map((w, i) => [i, i >= minIdx ? w : 0]));
            const rarity = this.D.RARITIES[rIdx];
            const setPool = opts.set ? this.D.LEGENDARIES.filter((item) => item.set === opts.set) : [];
            const newPieces = setPool.filter((item) => !opts.excludeLegendaries?.has(item.id));
            const setPiece = setPool.length ? BO.Math.pick(newPieces.length ? newPieces : setPool) : null;
            const slot = setPiece?.slot || opts.slot || pickWeighted([['weapon', 40], ['rig', 30], ['relic', 30]]);
            const ilvl = clamp(Math.ceil(floor * 0.8) + randInt(-1, 1), 1, 40);
            const it = { slot, rarity: rarity.id, ilvl, affixes: [], legendary: null };
            if (rarity.id === 'legendary') {
                const pool = this.D.LEGENDARIES.filter((l) => l.slot === slot && (!l.set || floor >= this.D.SETS[l.set].minFloor));
                const L = setPiece || BO.Math.pick(pool);
                it.legendary = L.id;
                if (slot === 'weapon') it.base = L.base;
            }
            if (slot === 'weapon' && !it.base) it.base = BO.Math.pick(this.D.WEAPON_POOL);
            const used = new Set();
            for (let i = 0; i < rarity.affixes; i++) {
                const a = this._rollAffix(slot, rIdx, used);
                if (!a) break;
                used.add(a.k);
                it.affixes.push(a);
            }
            return this._finalizeItem(it);
        }

        rarity(it) { return this.D.RARITIES[this.D.RARITY_INDEX[it.rarity] || 0]; }

        /** Inherent stat that grows with item level (the number item comparisons use). */
        baseStat(it) {
            const r = this.rarity(it);
            if (it.slot === 'weapon') {
                const mult = 1 + this.D.ITEM_POWER_PER_LEVEL * (it.ilvl - 1) + r.power;
                return { key: 'weaponPower', value: mult, label: `${Math.round(mult * 100)}% weapon power` };
            }
            if (it.slot === 'rig') {
                const hp = Math.round((8 + 5 * it.ilvl) * (1 + r.power * 2));
                return { key: 'maxHp', value: hp, label: `+${hp} max HP` };
            }
            const ad = Math.round((4 + 1.5 * it.ilvl) * (1 + r.power * 2));
            return { key: 'abilityDmg', value: ad, label: `+${ad}% ability damage` };
        }

        affixLabel(slot, a) {
            const def = this.D.AFFIXES[slot].find((x) => x.k === a.k);
            return def ? def.label.replace('{v}', a.v) : a.k;
        }

        describeItem(it) {
            const lines = [this.baseStat(it).label];
            for (const a of it.affixes) lines.push(this.affixLabel(it.slot, a));
            return lines;
        }

        sellValue(it) { return Math.round(this.rarity(it).value * (1 + it.ilvl * 0.12)); }
        buyValue(it) { return Math.round(this.sellValue(it) * 3.2); }
        scrapValue(it) { return Math.round(this.rarity(it).scrap * (1 + it.ilvl * 0.08)); }

        /* ---------------- Equipment & stash ---------------- */
        equip(item, rec = this.cls) {
            if (!rec || !item) return null;
            const prev = rec.equip[item.slot] || null;
            rec.equip[item.slot] = item;
            return prev;
        }

        /** Equips an item from the stash (swapping the old one back into the stash). */
        equipFromStash(uid) {
            const p = this.data;
            const idx = p.stash.findIndex((it) => it.uid === uid);
            if (idx < 0) return false;
            const it = p.stash.splice(idx, 1)[0];
            const prev = this.equip(it);
            if (prev) p.stash.splice(idx, 0, prev);
            this.save();
            return true;
        }

        unequip(slot) {
            const rec = this.cls;
            const p = this.data;
            if (!rec || !rec.equip[slot]) return false;
            if (slot === 'weapon') return false; // a weapon is always required
            if (this.stashFree() <= 0) return false;
            p.stash.push(rec.equip[slot]);
            rec.equip[slot] = null;
            this.save();
            return true;
        }

        stashCapacity() { return this.D.STASH_SIZE + this.upgradeLevel('vault_racks') * 8; }
        stashFree() { return this.stashCapacity() - this.data.stash.length; }

        sellFromStash(uid) {
            const p = this.data;
            const idx = p.stash.findIndex((it) => it.uid === uid);
            if (idx < 0) return 0;
            const it = p.stash.splice(idx, 1)[0];
            const g = this.sellValue(it);
            p.gold += g;
            this.save();
            return g;
        }

        salvageFromStash(uid) {
            const p = this.data;
            const idx = p.stash.findIndex((it) => it.uid === uid);
            if (idx < 0) return 0;
            const it = p.stash.splice(idx, 1)[0];
            const s = this.scrapValue(it);
            p.scrap += s;
            this.save();
            return s;
        }

        findStashItem(uid) { return this.data.stash.find((it) => it.uid === uid) || null; }

        findOwnedItem(uid) {
            const s = this.findStashItem(uid);
            if (s) return s;
            const rec = this.cls;
            if (rec) for (const slot of ['weapon', 'rig', 'relic']) if (rec.equip[slot] && rec.equip[slot].uid === uid) return rec.equip[slot];
            return null;
        }

        /* ---------------- Upgrades, merchant, elixirs, forge ---------------- */
        upgradeLevel(id) { return Math.max(0, Math.floor(this.data.upgrades[id] || 0)); }

        upgradeCost(id) {
            const u = this.D.upgradeById(id);
            const lv = this.upgradeLevel(id);
            return u && lv < u.costs.length ? u.costs[lv] : null;
        }

        buyUpgrade(id) {
            const cost = this.upgradeCost(id);
            const p = this.data;
            if (cost == null || p.gold < cost) return false;
            p.gold -= cost;
            p.upgrades[id] = this.upgradeLevel(id) + 1;
            this.save();
            return true;
        }

        /** Restocks the merchant after each delve (and on first visit). */
        refreshMerchant(force = false) {
            const p = this.data;
            const stamp = p.stats.delves;
            if (!force && p.merchant.stamp === stamp && p.merchant.stock.length) return;
            const lvl = this.cls ? this.cls.level : 1;
            const floor = Math.max(1, Math.max(p.deepest, Math.round(lvl * 1.4)));
            const stock = [];
            for (let i = 0; i < 4; i++) stock.push(this.rollItem({ floor, minRarity: i === 0 ? 'epic' : 'rare', slot: ['weapon', 'rig', 'relic', null][i] || undefined }));
            p.merchant = { stock, stamp };
            this.save();
        }

        buyMerchantItem(uid) {
            const p = this.data;
            const idx = p.merchant.stock.findIndex((it) => it.uid === uid);
            if (idx < 0) return 'missing';
            const it = p.merchant.stock[idx];
            const cost = this.buyValue(it);
            if (p.gold < cost) return 'gold';
            if (this.stashFree() <= 0) return 'stash';
            p.gold -= cost;
            p.merchant.stock.splice(idx, 1);
            p.stash.push(it);
            this.save();
            return 'ok';
        }

        buyElixir(id) {
            const e = this.D.ELIXIRS.find((x) => x.id === id);
            const p = this.data;
            if (!e || p.elixir || p.gold < e.cost) return false;
            p.gold -= e.cost;
            p.elixir = id;
            this.save();
            return true;
        }

        rerollCost(it) {
            const i = this.D.RARITY_INDEX[it.rarity];
            return { gold: this.D.FORGE.rerollGold[i], scrap: this.D.FORGE.rerollScrap[i] };
        }

        rerollAffix(uid, affixIdx) {
            const it = this.findOwnedItem(uid);
            const p = this.data;
            if (!it || !it.affixes[affixIdx]) return false;
            const c = this.rerollCost(it);
            if (p.gold < c.gold || p.scrap < c.scrap) return false;
            const used = new Set(it.affixes.map((a, i) => (i === affixIdx ? null : a.k)).filter(Boolean));
            used.add(it.affixes[affixIdx].k); // guarantee a different affix
            const a = this._rollAffix(it.slot, this.D.RARITY_INDEX[it.rarity], used);
            if (!a) return false;
            p.gold -= c.gold;
            p.scrap -= c.scrap;
            it.affixes[affixIdx] = a;
            this.save();
            return true;
        }

        promoteCost(it) {
            const i = this.D.RARITY_INDEX[it.rarity];
            if (i >= 2) return null; // Legendaries only drop; Epic is the forge ceiling.
            return { gold: this.D.FORGE.promoteGold[i], scrap: this.D.FORGE.promoteScrap[i] };
        }

        promote(uid) {
            const it = this.findOwnedItem(uid);
            const p = this.data;
            if (!it) return false;
            const c = this.promoteCost(it);
            if (!c || p.gold < c.gold || p.scrap < c.scrap) return false;
            p.gold -= c.gold;
            p.scrap -= c.scrap;
            const next = this.D.RARITY_INDEX[it.rarity] + 1;
            it.rarity = this.D.RARITIES[next].id;
            const used = new Set(it.affixes.map((a) => a.k));
            while (it.affixes.length < this.D.RARITIES[next].affixes) {
                const a = this._rollAffix(it.slot, next, used);
                if (!a) break;
                used.add(a.k);
                it.affixes.push(a);
            }
            this.save();
            return true;
        }

        reforgeTarget() {
            const lvl = this.cls ? this.cls.level : 1;
            return Math.max(1, Math.max(Math.ceil(this.data.deepest * 0.8), lvl));
        }

        reforgeCost(it) {
            const gain = this.reforgeTarget() - it.ilvl;
            return gain > 0 ? { scrap: gain * this.D.FORGE.reforgeLevelScrap, gain } : null;
        }

        reforge(uid) {
            const it = this.findOwnedItem(uid);
            const p = this.data;
            if (!it) return false;
            const c = this.reforgeCost(it);
            if (!c || p.scrap < c.scrap) return false;
            p.scrap -= c.scrap;
            it.ilvl += c.gain;
            this.save();
            return true;
        }

        /* ---------------- Derived stats ----------------
           run: optional live delve state ({ boons:Set, elixir, shrineHpPenalty }). */
        computeStats(run = null) {
            const D = this.D;
            const classId = this.classId;
            const rec = this.cls;
            const C = D.CLASSES[classId];
            const talents = this.talentSet(rec);
            const s = {
                classId, kitId: C.kit || classId, level: rec.level, talents,
                maxHp: C.baseHp + D.levelHpBonus(rec.level),
                weaponPower: 1, gunDmg: 0, headDmg: 0, bodyDmg: 0, eliteDmg: 0,
                burnChance: 0, chillChance: 0, shockChance: 0, exposeChance: 0,
                killHeal: (C.kit || classId) === 'vanguard' ? (talents.has('bloodletter') ? 10 : 4) : 0, killHealPct: 0,
                dmgReduce: 0, potionHeal: 0, goldFind: 0, momentumKeep: 0,
                cdr: 0, reactionDmg: 0, abilityDmg: 0, statusDur: 0, ultCharge: 0, xpGain: 0,
                maxHpPct: 0, dmgMult: 1,
                alwaysBurn: false, headDetonate: false, everyNthDetonate: 0, doubleReactions: false, prismPrimer: false,
                abilityPower: D.abilityPower(rec.level),
                potionsMax: D.BASE_POTIONS + this.upgradeLevel('potion_belt'),
                potionHealFrac: D.BASE_POTION_HEAL + D.levelPotionBonus(rec.level),
                packSlots: D.BASE_PACK_SLOTS + this.upgradeLevel('field_pack'),
                dropBonus: 0.12 * this.upgradeLevel('scavenger'),
                insurance: 0.15 * this.upgradeLevel('insurance'),
                fieldMedic: this.upgradeLevel('second_wind') > 0
            };
            s.potionHeal += 15 * this.upgradeLevel('alchemy');
            const addFx = (fx) => {
                for (const [k, v] of Object.entries(fx)) {
                    if (typeof v === 'boolean') s[k] = s[k] || v;
                    else if (k === 'everyNthDetonate') s[k] = v;
                    else s[k] = (s[k] || 0) + v;
                }
            };
            if (C.fx) addFx(C.fx);
            for (const slot of ['weapon', 'rig', 'relic']) {
                const it = rec.equip[slot];
                if (!it) continue;
                const b = this.baseStat(it);
                if (b.key === 'weaponPower') s.weaponPower = b.value;
                else s[b.key] += b.value;
                for (const a of it.affixes) s[a.k] = (s[a.k] || 0) + a.v;
                if (it.legendary) {
                    const L = D.legendaryById(it.legendary);
                    if (L) addFx(L.fx);
                }
            }
            for (const [id, set] of Object.entries(D.SETS)) {
                const count = this.equippedSetCount(id);
                for (const bonus of set.bonuses) if (count >= bonus.pieces) addFx(bonus.fx);
            }
            if (talents.has('iron_hide')) s.maxHpPct += 25;
            if (run) {
                for (const id of run.boons) {
                    const effects = D.boonById(id)?.fx;
                    if (effects) addFx(effects);
                }
                if (run.boons.has('glass_cannon')) { s.dmgMult *= 1.35; s.maxHpPct -= 25; }
                if (run.boons.has('overclock')) s.cdr += 25;
                if (run.boons.has('fortune')) s.goldFind += 40;
                if (run.boons.has('deep_pockets')) s.packSlots += 2;
                if (run.boons.has('potion_belt')) s.potionsMax += 1;
                if (run.boons.has('thermal_rounds')) s.burnChance += 15;
                if (run.boons.has('cryo_rounds')) s.chillChance += 15;
                if (run.boons.has('static_rounds')) s.shockChance += 15;
                if (run.elixir === 'wrath') s.dmgMult *= 1.15;
                if (run.elixir === 'iron') s.maxHpPct += 20;
                if (run.elixir === 'fortune') s.goldFind += 30;
            }
            s.maxHp = Math.max(30, Math.round(s.maxHp * (1 + s.maxHpPct / 100) * (1 - ((run && run.shrineHpPenalty) || 0))));
            if (run && BO.RPGItems) BO.RPGItems.applyProfileStats(s, run);
            s.cdrMult = clamp(1 - s.cdr / 100, 0.4, 1.6);
            s.dmgTakenMult = clamp(1 - s.dmgReduce / 100, 0.35, 1.5) * (run?.curse ? 1.15 : 1);
            s.potionHealFrac *= Math.max(0.2, 1 + s.potionHeal / 100);
            s.potionHealFrac = Math.min(1, s.potionHealFrac);
            return s;
        }

        /* ---------------- Delve suspend / resume ---------------- */
        saveRun(run) { this.data.run = run; this.save(); }
        clearRun() { this.data.run = null; this.save(); }
    }

    BO.RPGProfile = new RPGProfile();
})(window);
;

/* --- src/rpg/RPGArena.js --- */
/* ============================================================================
   BLACKOUT OPS — RPG Arena Generator
   Builds one procedural arena per delve floor as a regular map object (boxes,
   ramps, lights, waypoints) so BO.World.build() can construct it like any
   other map. Registered as BO.MapsData.MAPS.rpg_arena before each build.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const MAP_ID = 'rpg_arena';

    // Small deterministic PRNG so a suspended floor rebuilds identically on resume.
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function box(x1, y1, z1, x2, y2, z2, mat) {
        return {
            x: (x1 + x2) * 0.5, y: (y1 + y2) * 0.5, z: (z1 + z2) * 0.5,
            w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), d: Math.abs(z2 - z1), mat
        };
    }

    // 2D segment vs expanded AABB (slab test).
    function segHitsBox(ax, az, bx, bz, b, pad) {
        const minX = b.x - b.w * 0.5 - pad, maxX = b.x + b.w * 0.5 + pad;
        const minZ = b.z - b.d * 0.5 - pad, maxZ = b.z + b.d * 0.5 + pad;
        let t0 = 0, t1 = 1;
        const dx = bx - ax, dz = bz - az;
        const clip = (p, q) => {
            if (Math.abs(p) < 1e-9) return q >= 0;
            const r = q / p;
            if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
            return true;
        };
        return clip(-dx, ax - minX) && clip(dx, maxX - ax) && clip(-dz, az - minZ) && clip(dz, maxZ - az) && t0 <= t1;
    }

    function insideBox(x, z, b, pad) {
        return x >= b.x - b.w * 0.5 - pad && x <= b.x + b.w * 0.5 + pad && z >= b.z - b.d * 0.5 - pad && z <= b.z + b.d * 0.5 + pad;
    }

    const SIZES = {
        combat: [40, 44], elite: [40, 44], treasure: [36, 40], ambush: [42, 44],
        boss: [48, 52], rest: [24, 26], shrine: [26, 28],
        vents: [38, 46], surge: [46, 40], fracture: [46, 48], speedrun: [37, 41], hunt: [49, 35],
        crossfire: [56, 35], shop: [29, 27], puzzle: [27, 32], sanctuary: [25, 28], defend: [45, 49],
        miniboss: [41, 37], mimic: [35, 39], darkroom: [43, 48], storm: [52, 44]
    };

    BO.RPGArena = {
        MAP_ID,

        /**
         * @param {object} o { floor, roomType, seed, gateCount }
         * @returns {{ mapId, map, layout }}
         */
        generate(o) {
            const D = BO.RPGData;
            const rng = mulberry32((o.seed || 1) * 7919 + o.floor * 104729);
            const rr = (a, b) => a + rng() * (b - a);
            const biome = D.biomeForFloor(o.floor);
            const type = o.roomType || 'combat';
            const room = D.ROOMS[type] || D.ROOMS.combat;
            const hazard = room.hazard;
            const [baseWidth, baseLength] = SIZES[type] || (room.quiet ? [26, 30] : SIZES.combat);
            // Alternate odd and even widths so consecutive floors cannot share a footprint.
            const W = Math.round((baseWidth + rr(-4, 4)) / 2) * 2 + o.floor % 2;
            const L = Math.round((baseLength + rr(-5, 6)) * 2) / 2;
            const encounter = BO.RPGEncounters[(o.floor + (o.seed || 0) % 31) % BO.RPGEncounters.length];
            const styleIndex = (o.floor + Math.floor((o.seed || 0) / 53)) % 8;
            const style = ['Cloister', 'Spine', 'Terraces', 'Foundry', 'Split Court', 'Arcade', 'Switchback', 'Causeway'][styleIndex];
            const hw = W * 0.5, hl = L * 0.5;
            const wallH = 7.2 + (styleIndex % 3) * 1.05;
            const boxes = [];
            const ramps = [];
            const obstacles = []; // solid cover used for spacing & waypoint tests

            // Floor slab + perimeter walls.
            boxes.push(box(-hw - 1, -1, -hl - 1, hw + 1, 0, hl + 1, biome.floorMat));
            boxes.push(box(-hw - 1, 0, -hl - 1, hw + 1, wallH, -hl, biome.wallMat));
            boxes.push(box(-hw - 1, 0, hl, hw + 1, wallH, hl + 1, biome.wallMat));
            boxes.push(box(-hw - 1, 0, -hl, -hw, wallH, hl, biome.wallMat));
            boxes.push(box(hw, 0, -hl, hw + 1, wallH, hl, biome.wallMat));
            // Trim band along the walls for depth.
            boxes.push(box(-hw, 0, -hl, hw, 0.35, -hl + 0.4, biome.coverMat));
            boxes.push(box(-hw, 0, hl - 0.4, hw, 0.35, hl, biome.coverMat));

            const spawn = { x: 0, y: 0, z: hl - 3.2, yaw: 0 };
            const gateCount = Math.max(1, Math.min(3, o.gateCount || 2));
            const gateZ = -hl + 0.9;
            const gates = [];
            const spread = Math.min(11, W / (gateCount + 1));
            for (let i = 0; i < gateCount; i++) {
                const gx = (i - (gateCount - 1) * 0.5) * spread;
                gates.push({ x: gx, z: gateZ, standZ: gateZ + 1.9 });
                // Gate frame: two pillars and a lintel (portal surface is added by RPGMode).
                boxes.push(box(gx - 2.0, 0, gateZ - 0.45, gx - 1.45, 4.6, gateZ + 0.45, biome.coverMat));
                boxes.push(box(gx + 1.45, 0, gateZ - 0.45, gx + 2.0, 4.6, gateZ + 0.45, biome.coverMat));
                boxes.push(box(gx - 2.0, 4.6, gateZ - 0.45, gx + 2.0, 5.2, gateZ + 0.45, biome.coverMat));
            }

            const center = { x: 0, z: -2 };
            const keepClear = (x, z, pad = 0) => {
                if (z > spawn.z - 6.5) return false;                 // spawn pocket
                if (z < gateZ + 5.5) return false;                   // gate apron
                if (Math.hypot(x - center.x, z - center.z) < (type === 'defend' ? 7.2 : 4.2) + pad && type !== 'combat' && type !== 'ambush') return false; // feature spot
                return true;
            };
            const tryPlace = (w, d, h, mat, tries = 18) => {
                for (let t = 0; t < tries; t++) {
                    const x = rr(-hw + 3 + w * 0.5, hw - 3 - w * 0.5);
                    const z = rr(-hl + 3 + d * 0.5, hl - 3 - d * 0.5);
                    if (!keepClear(x, z, Math.max(w, d) / 2)) continue;
                    const cand = { x, z, w, d };
                    if (obstacles.some((b) => insideBox(x, z, b, Math.max(w, d) * 0.5 + 2.6))) continue;
                    const b = box(x - w * 0.5, 0, z - d * 0.5, x + w * 0.5, h, z + d * 0.5, mat);
                    boxes.push(b);
                    obstacles.push(b);
                    return cand;
                }
                return null;
            };

            // Each floor has a different landmark arrangement plus seed-placed tactical cover.
            const isBig = !room.quiet && type !== 'boss';
            if (isBig) {
                const landmarks = [
                    [[-0.40,-0.35],[0.40,-0.35],[-0.40,0.22],[0.40,0.22]],
                    [[0,-0.52],[0,0.05],[0,0.47]],
                    [[-0.64,-0.30],[0.55,-0.05],[-0.55,0.38]],
                    [[-0.63,-0.47],[0.55,-0.47],[0,0.25]],
                    [[-0.73,-0.15],[-0.25,-0.15],[0.25,0.19],[0.73,0.19]],
                    [[-0.66,-0.29],[0.66,-0.29],[-0.66,0.31],[0.66,0.31]],
                    [[-0.55,-0.42],[0.50,-0.15],[-0.40,0.24],[0.55,0.39]],
                    [[-0.28,-0.44],[0.28,-0.44],[-0.28,0.44],[0.28,0.44]]
                ][styleIndex];
                for (const [px, pz] of landmarks) {
                    const x = px * hw, z = pz * hl;
                    if (!keepClear(x, z, 1) || Math.hypot(x - center.x, z - center.z) < (type === 'defend' ? 6 : 3)) continue;
                    const w = styleIndex === 2 || styleIndex === 4 ? 3.1 : 0.95;
                    const height = (styleIndex === 2 ? 1.05 : 3.4 + styleIndex % 3) + rr(0, 0.5);
                    const b = box(x - w, 0, z - 0.9, x + w, height, z + 0.9, biome.wallMat);
                    boxes.push(b, box(x - w - 0.14, height, z - 1.04, x + w + 0.14, height + 0.22, z + 1.04, biome.coverMat));
                    obstacles.push(b);
                }
                const pillars = 2 + Math.floor(rng() * 3);
                for (let i = 0; i < pillars; i++) tryPlace(1.5, 1.5, wallH - 0.5, biome.wallMat);
                const lows = 3 + Math.floor(rng() * 3);
                for (let i = 0; i < lows; i++) {
                    if (rng() < 0.5) tryPlace(rr(3.5, 5.5), 0.8, 1.15, biome.coverMat);
                    else tryPlace(0.8, rr(3.5, 5.5), 1.15, biome.coverMat);
                }
                const crates = 3 + Math.floor(rng() * 4);
                for (let i = 0; i < crates; i++) {
                    const c = tryPlace(1.7, 1.7, 1.7, biome.crateMat);
                    if (c && rng() < 0.35) boxes.push(box(c.x - 0.7, 1.7, c.z - 0.7, c.x + 0.7, 3.1, c.z + 0.7, biome.crateMat));
                }
            } else if (type === 'boss') {
                const spread = 0.46 + styleIndex * 0.025;
                for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                    const px = sx * hw * spread, pz = sz * hl * (0.28 + rr(0.02, 0.22));
                    const b = box(px - 1, 0, pz - 1, px + 1, wallH - 0.5, pz + 1, biome.wallMat);
                    boxes.push(b);
                    obstacles.push(b);
                }
            }

            // Hidden cache: a ledge in a side corner reachable by a ramp (exploration reward).
            let cache = null;
            if (isBig && type !== 'ambush' && rng() < 0.55) {
                const side = rng() < 0.5 ? -1 : 1;
                const px = side * (hw - 3.2);
                const pz = rr(-hl + 9, -2);
                const platH = 2.6;
                const plat = box(px - 2.2, 0, pz - 2.2, px + 2.2, platH, pz + 2.2, biome.coverMat);
                if (!obstacles.some((b) => insideBox(px, pz, b, 4) || segHitsBox(px, pz + 2.2, px, pz + 8.2, b, 1.5))) {
                    boxes.push(plat);
                    obstacles.push(plat);
                    ramps.push({ x: px, w: 2.4, z1: pz + 7.6, z2: pz + 2.2, y1: 0, y2: platH, axis: 'z', mat: biome.coverMat });
                    cache = { x: px, y: platH, z: pz - 0.6 };
                }
            }

            // Open points for enemy camps (sorted far → near the spawn).
            const camps = [];
            for (let t = 0; t < 160 && camps.length < 10; t++) {
                const x = rr(-hw + 3.5, hw - 3.5);
                const z = rr(-hl + 4, hl - 12);
                if (Math.hypot(x - spawn.x, z - spawn.z) < 13) continue;
                if (obstacles.some((b) => insideBox(x, z, b, 2.2))) continue;
                if (ramps.some((r) => Math.abs(x - r.x) < r.w && z > Math.min(r.z1, r.z2) - 1 && z < Math.max(r.z1, r.z2) + 1)) continue;
                if (camps.some((c) => Math.hypot(c.x - x, c.z - z) < 6.5)) continue;
                camps.push({ x, z });
            }
            camps.sort((a, b) => Math.hypot(b.x - spawn.x, b.z - spawn.z) - Math.hypot(a.x - spawn.x, a.z - spawn.z));

            // Free spots for ambush waves (along the side walls, away from the player).
            const ambushSpots = [];
            for (let i = 0; i < 6; i++) {
                const side = i % 2 === 0 ? -1 : 1;
                ambushSpots.push({ x: side * (hw - 2), z: -hl + 5 + i * ((L - 18) / 6) });
            }

            // Waypoint grid (used by enemy pathing when line of sight is blocked).
            const waypoints = [];
            const step = 4.5;
            const grid = new Map();
            for (let x = -hw + 2; x <= hw - 2 + 0.01; x += step) {
                for (let z = -hl + 2; z <= hl - 2 + 0.01; z += step) {
                    if (obstacles.some((b) => insideBox(x, z, b, 0.9))) continue;
                    const id = `w${Math.round(x * 10)}_${Math.round(z * 10)}`;
                    const wp = { id, x, y: 0, z, links: [] };
                    waypoints.push(wp);
                    grid.set(`${Math.round((x + hw) / step)}_${Math.round((z + hl) / step)}`, wp);
                }
            }
            for (const [key, wp] of grid) {
                const [gi, gj] = key.split('_').map(Number);
                for (let di = -1; di <= 1; di++) {
                    for (let dj = -1; dj <= 1; dj++) {
                        if (!di && !dj) continue;
                        const nb = grid.get(`${gi + di}_${gj + dj}`);
                        if (!nb) continue;
                        if (obstacles.some((b) => segHitsBox(wp.x, wp.z, nb.x, nb.z, b, 0.5))) continue;
                        wp.links.push(nb.id);
                    }
                }
            }

            const hazards = [];
            if (hazard) {
                // Use open pathing points and leave space to escape each ring.
                const spots = waypoints.filter(({ x, z }) => keepClear(x, z, hazard.radius - 2) &&
                    Math.abs(x) < hw - hazard.radius && Math.abs(z) < hl - hazard.radius &&
                    !obstacles.some((b) => insideBox(x, z, b, hazard.radius * 0.65)) &&
                    !ramps.some((r) => Math.abs(x - r.x) < r.w / 2 + hazard.radius &&
                        z > Math.min(r.z1, r.z2) - hazard.radius && z < Math.max(r.z1, r.z2) + hazard.radius));
                while (hazards.length < hazard.count && spots.length) {
                    const [spot] = spots.splice(Math.floor(rng() * spots.length), 1);
                    if (hazards.some((h) => Math.hypot(h.x - spot.x, h.z - spot.z) < hazard.radius * 2 + 1)) continue;
                    hazards.push({ x: spot.x, z: spot.z, phase: hazards.length / hazard.count });
                }
            }

            // Lights: biome-tinted lamps plus fire barrels in the corners.
            const lights = [];
            const lampRows = room.quiet ? [[0, 0]] : [[-hw * 0.5, -hl * 0.45], [hw * 0.5, -hl * 0.45], [-hw * 0.5, hl * 0.35], [hw * 0.5, hl * 0.35], [0, 0]];
            for (const [i, [lx, lz]] of lampRows.entries()) {
                lights.push({ x: lx, y: wallH - 1.2, z: lz, color: i % 2 ? 0xffcf8b : biome.light,
                    intensity: type === 'darkroom' ? 0.42 : 1.85, distance: type === 'darkroom' ? 13 : 28, alwaysOn: true });
            }
            for (const [fx, fz] of [[-hw + 1.6, -hl + 1.6], [hw - 1.6, -hl + 1.6], [-hw + 1.6, hl - 1.6], [hw - 1.6, hl - 1.6]]) {
                lights.push({ x: fx, y: 1.4, z: fz, color: 0xff7a2f, intensity: 1.2, distance: 12, prop: 'fire_barrel', alwaysOn: true });
            }

            const floorLabel = 'B-' + String(o.floor).padStart(2, '0');
            const map = {
                id: MAP_ID,
                name: `${biome.name.toUpperCase()} • FLOOR ${o.floor}`,
                mode: 'rpg',
                subtitle: biome.name + ' · ' + style,
                description: 'Procedural RPG delve floor.',
                atmosphere: { moon: false, ...biome.atmosphere, ...(type === 'darkroom' ? { sunIntensity: 0.24, hemiIntensity: 0.38 } : {}) },
                playerSpawn: spawn,
                ramps,
                boxes,
                lights,
                zones: ['spawn'],
                waypoints,
                wallWritings: [
                    { text: floorLabel, sub: biome.name.toUpperCase(), x: 0, y: 6.2, z: -hl + 0.06, rotY: 0, w: 4.4, h: 2.2, color: biome.accent }
                ]
            };
            BO.MapsData.MAPS[MAP_ID] = map;

            return {
                mapId: MAP_ID,
                map,
                layout: { W, L, hw, hl, wallH, spawn, gates, camps, ambushSpots, cache, center, biome, type, hazards, encounter, style }
            };
        }
    };
})(window);
;

/* --- src/rpg/RPGAbilities.js --- */
/* ============================================================================
   BLACKOUT OPS — RPG Class Abilities
   Primer (applies a status) · Detonator (consumes statuses → reactions) ·
   Ultimate (charges from damage dealt). Numbers come from BO.RPGData.CLASSES;
   talent ids are checked by name (see RPGData.TALENTS).
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const UP = new THREE.Vector3(0, 1, 0);
    const _v = new THREE.Vector3();

    const RPGAbilities = {
        lobs: [],
        get M() { return BO.RPGMode; },
        get P() { return BO.Player; },

        classDef() { return BO.RPGData.CLASSES[this.M.stats.classId]; },
        has(t) { return this.M.stats.talents.has(t); },

        /** Effective cooldown for a slot after talents and CDR. */
        cooldownFor(slot) {
            const def = this.classDef().abilities[slot];
            let cd = def.cd || 0;
            if (slot === 'primer') {
                if (this.has('long_breach')) cd -= 2;
                if (this.has('fuel_tank')) cd -= 3;
                if (this.has('quick_draw')) cd -= 2;
            }
            return Math.max(1.5, cd * this.M.stats.cdrMult);
        },

        aim() {
            const cam = this.M.camera || BO.App.worldCamera;
            const origin = cam.position.clone();
            const dir = new THREE.Vector3();
            cam.getWorldDirection(dir);
            const flat = new THREE.Vector3(dir.x, 0, dir.z);
            if (flat.lengthSq() < 1e-6) flat.set(-Math.sin(this.P.yaw), 0, -Math.cos(this.P.yaw));
            flat.normalize();
            return { origin, dir, flat };
        },

        cast(slot) {
            const M = this.M;
            if (!M.active || M.state === 'transition' || M.state === 'ended' || !this.P.alive) return false;
            const A = M.ability;
            if (A.silenced > 0) {
                BO.Events.emit('hud:toast', { text: `SILENCED — ${A.silenced.toFixed(1)} S`, color: '#a855f7' });
                return false;
            }
            if (slot === 'ultimate') {
                if (A.ultActive > 0) return false;
                if (A.ult < 1) {
                    BO.Events.emit('hud:toast', { text: `ULTIMATE ${Math.floor(A.ult * 100)}% — DEAL DAMAGE TO CHARGE IT`, color: '#94a3b8' });
                    return false;
                }
                return this.startUltimate(false);
            }
            const unstoppable = slot === 'primer' && A.ultActive > 0 && A.ultId === 'juggernaut' && this.has('unstoppable');
            if (A.cd[slot] > 0 && !unstoppable) {
                BO.Sound.playEmptyClick();
                return false;
            }
            const def = this.classDef().abilities[slot];
            const ok = this['_' + def.id] ? this['_' + def.id](def) : false;
            if (ok) {
                A.cd[slot] = unstoppable ? 0.35 : this.cooldownFor(slot);
                if (BO.RPGUI) BO.RPGUI.pulseAbility(slot);
            }
            return ok;
        },

        startUltimate(forced) {
            const M = this.M;
            const A = M.ability;
            const def = this.classDef().abilities.ultimate;
            if (!forced) A.ult = 0;
            A.ultId = def.id;
            BO.Sound.playUltimate && BO.Sound.playUltimate('gravity_spikes');
            if (BO.RPGUI) BO.RPGUI.pulseAbility('ultimate');
            if (def.id === 'juggernaut') {
                A.ultActive = this.has('unstoppable') ? 12 : def.duration;
                BO.FX.spawnParticles(this.P.pos.clone().add(UP), 30, 0xf472b6, 5, 0, 0.8, 1.6);
                BO.Events.emit('hud:toast', { text: 'JUGGERNAUT PROTOCOL', color: '#f472b6' });
            } else if (def.id === 'firestorm') {
                this._firestorm(def);
            } else if (def.id === 'storm_cell') {
                this._stormCell(def);
            }
            return true;
        },

        update(dt) {
            const M = this.M;
            const A = M.ability;
            for (const k of ['primer', 'detonator']) if (A.cd[k] > 0) A.cd[k] = Math.max(0, A.cd[k] - dt);
            if (A.silenced > 0) A.silenced = Math.max(0, A.silenced - dt);
            if (A.potionCd > 0) A.potionCd = Math.max(0, A.potionCd - dt);
            if (A.ultActive > 0) {
                A.ultActive -= dt;
                if (A.ultActive <= 0) {
                    A.ultActive = 0;
                    if (A.ultId === 'juggernaut' && this.has('earthsplitter')) this._slam(14, 90, 0.8, true);
                    A.ultId = null;
                }
            }
            this._tickDash(dt);
            this._tickStorm(dt);
            this._tickLobs(dt);
        },

        /* ---------------- Vanguard ---------------- */
        _breach_charge(def) {
            const { flat } = this.aim();
            const dist = def.range * (this.has('long_breach') ? 1.6 : 1);
            const dur = 0.24;
            this.M.ability.dash = { dir: flat.clone(), speed: dist / dur, t: dur, hit: new Set(), def };
            this.P.invulnTimer = Math.max(this.P.invulnTimer, dur + 0.05);
            this.P.cameraShake = Math.max(this.P.cameraShake, 0.03);
            BO.Sound.playSlide();
            BO.FX.spawnParticles(this.P.pos.clone().add(new THREE.Vector3(0, 0.6, 0)), 14, 0xf472b6, 3, 0, 0.4, 1.2);
            return true;
        },

        _tickDash(dt) {
            const M = this.M;
            const d = M.ability.dash;
            if (!d) return;
            const P = this.P;
            const stepT = Math.min(dt, d.t);
            d.t -= stepT;
            const before = P.pos.clone();
            P.pos.addScaledVector(d.dir, d.speed * stepT);
            BO.World.resolveHorizontal(P.pos, P.radius, P.standHeight, true);
            const perp = new THREE.Vector3(-d.dir.z, 0, d.dir.x);
            for (const z of M.enemies) {
                if (!M.isAlive(z) || d.hit.has(z)) continue;
                if (BO.Math.dist2D(z.pos.x, z.pos.z, P.pos.x, P.pos.z) > d.def.width + z.radius) continue;
                d.hit.add(z);
                const side = Math.sign((z.pos.x - P.pos.x) * perp.x + (z.pos.z - P.pos.z) * perp.z) || 1;
                z.vel.x += perp.x * side * 9 + d.dir.x * 4;
                z.vel.z += perp.z * side * 9 + d.dir.z * 4;
                const ids = ['expose'];
                if (this.has('thermite_plating')) ids.push('burn');
                if (this.has('frost_breaker')) ids.push('chill');
                M.dealDamage(z, d.def.damage, { source: 'ability', dir: d.dir });
                M.applyPrimer(z, ids);
                if (this.has('shoulder_check') && M.isAlive(z)) z.stunTimer = Math.max(z.stunTimer, 1.5);
                BO.Sound.playMelee();
            }
            if (Math.random() < 0.6) BO.FX.spawnParticles(before.add(new THREE.Vector3(0, 0.5, 0)), 3, 0xf472b6, 1.5, 0, 0.3, 1.0);
            if (d.t <= 0) M.ability.dash = null;
        },

        _concussion_slam(def) {
            const M = this.M;
            const radius = def.radius * (this.has('tectonic') ? 1.5 : 1);
            if (this.has('magnet_slam')) {
                for (const z of M.enemiesInRadius(this.P.pos, 10)) {
                    _v.set(this.P.pos.x - z.pos.x, 0, this.P.pos.z - z.pos.z);
                    const len = _v.length();
                    if (len > 0.5) { _v.multiplyScalar(1 / len); z.vel.x += _v.x * 11; z.vel.z += _v.z * 11; z.vel.y = 3; }
                }
                M.timers.push({ t: 0.3, fn: () => this._slam(radius, def.damage, def.stun, false) });
            } else {
                this._slam(radius, def.damage, def.stun, false);
            }
            if (this.has('aftershock')) M.timers.push({ t: 1.0 + (this.has('magnet_slam') ? 0.3 : 0), fn: () => this._slam(radius, def.damage * 0.6, 0.5, false) });
            return true;
        },

        _slam(radius, damage, stun, big) {
            const M = this.M;
            if (!M.active || !this.P.alive) return;
            const P = this.P;
            BO.FX.spawnExplosion(P.pos.clone().add(new THREE.Vector3(0, 0.2, 0)), radius * 0.75, big ? 0xfbbf24 : 0xf472b6);
            BO.Sound.playExplosion(big ? 1.0 : 0.7);
            P.cameraShake = Math.max(P.cameraShake, big ? 0.09 : 0.05);
            for (const z of M.enemiesInRadius(P.pos, radius)) {
                const dealt = M.dealDamage(z, damage, { source: 'ability' });
                M.detonate(z, dealt); // detonators fire even when the hit is lethal
                if (!M.isAlive(z)) continue;
                z.stunTimer = Math.max(z.stunTimer, stun);
                if (this.has('static_gauntlets')) M.applyStatus(z, 'shock');
            }
        },

        /* ---------------- Pyrotech ---------------- */
        _napalm_lob(def) {
            const M = this.M;
            const { origin, dir } = this.aim();
            const start = origin.clone().addScaledVector(dir, 0.8).add(new THREE.Vector3(0, -0.2, 0));
            const vel = dir.clone().multiplyScalar(17).add(new THREE.Vector3(0, 4.5, 0));
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
            mesh.position.copy(start);
            BO.World.scene.add(mesh);
            M.props.push({ mesh });
            this.lobs.push({ mesh, pos: start, vel, t: 3, def });
            BO.Sound.playGrenadeBounce();
            return true;
        },

        _tickLobs(dt) {
            for (let i = this.lobs.length - 1; i >= 0; i--) {
                const p = this.lobs[i];
                if (!p.mesh.parent) { this.lobs.splice(i, 1); continue; } // floor was cleared
                p.t -= dt;
                p.vel.y -= 20 * dt;
                const step = p.vel.clone().multiplyScalar(dt);
                const len = step.length();
                const wall = len > 0 ? BO.World.raycastWorld(p.pos, step.clone().normalize(), len + 0.1) : null;
                p.pos.add(step);
                p.mesh.position.copy(p.pos);
                if (Math.random() < 0.5) BO.FX.spawnParticles(p.pos.clone(), 1, 0xfb923c, 0.6, -1, 0.3, 0.8);
                const ground = BO.World.getGroundHeight(p.pos.x, p.pos.z, p.pos.y + 0.3);
                if (wall || p.pos.y <= ground || p.t <= 0) {
                    const at = wall ? wall.point.clone() : p.pos.clone();
                    at.y = BO.World.getGroundHeight(at.x, at.z, at.y + 0.5);
                    BO.World.scene.remove(p.mesh);
                    this.lobs.splice(i, 1);
                    this._napalmImpact(at, p.def);
                }
            }
        },

        _napalmImpact(at, def) {
            const M = this.M;
            const dur = this.has('sticky_napalm') ? 7 : def.duration;
            const spots = this.has('cluster_lob')
                ? [0, 1, 2].map((i) => new THREE.Vector3(at.x + Math.cos(i * 2.094) * 2.6, at.y, at.z + Math.sin(i * 2.094) * 2.6))
                : [at];
            const r = this.has('cluster_lob') ? def.radius * 0.75 : def.radius;
            BO.FX.spawnExplosion(at.clone().add(new THREE.Vector3(0, 0.3, 0)), 2.5, 0xf97316);
            BO.Sound.playExplosion(0.5);
            for (const s of spots) {
                const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }));
                mesh.rotation.x = -Math.PI / 2;
                mesh.position.set(s.x, s.y + 0.04, s.z);
                BO.World.scene.add(mesh);
                M.pools.push({ x: s.x, z: s.z, r, t: dur, tick: 0, damage: def.tick, mesh });
            }
        },

        _flashover(def) {
            const M = this.M;
            const { origin, flat } = this.aim();
            const range = def.range * (this.has('backdraft') ? 1.5 : 1);
            const cone = this.has('wide_angle') ? 0.17 : def.cone;
            const P = this.P;
            BO.FX.spawnConeShockwave(origin.clone().add(new THREE.Vector3(0, -0.3, 0)), flat);
            for (let i = 0; i < 24; i++) {
                const spread = (Math.random() - 0.5) * (1.2 - cone);
                const d = flat.clone().applyAxisAngle(UP, spread);
                BO.FX.spawnParticles(P.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(d, 1 + Math.random() * range * 0.8), 1, 0xfb923c, 2, -1, 0.45, 1.3);
            }
            BO.Sound.playExplosion(0.45);
            let hits = 0;
            for (const z of M.enemiesInRadius(P.pos, range)) {
                _v.set(z.pos.x - P.pos.x, 0, z.pos.z - P.pos.z);
                const len = _v.length();
                if (len > 0.6 && _v.multiplyScalar(1 / len).dot(flat) < cone) continue;
                if (!BO.World.hasLineOfSight(P.pos.x, P.pos.y + 1.2, P.pos.z, z.pos.x, z.pos.y + 1.0, z.pos.z)) continue;
                hits++;
                const dealt = M.dealDamage(z, def.damage, { source: 'ability', element: 'burn' });
                M.detonate(z, dealt);
                if (!M.isAlive(z)) continue;
                if (this.has('cryo_thermal')) M.applyStatus(z, 'chill');
                if (this.has('arc_flash')) M.applyStatus(z, 'shock');
            }
            if (this.has('heat_sink') && hits) M.ability.cd.primer = Math.max(0, M.ability.cd.primer - hits);
            return true;
        },

        _firestorm(def) {
            const M = this.M;
            const P = this.P;
            const radius = this.has('supernova') ? 20 : def.radius;
            BO.FX.spawnExplosion(P.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), radius * 0.6, 0xf97316);
            BO.Sound.playExplosion(1.0);
            for (const z of M.enemiesInRadius(P.pos, radius)) M.applyPrimer(z, ['burn']);
            if (this.has('phoenix')) M.heal(P.maxHp * 0.4);
            const blast = () => {
                if (!M.active) return;
                BO.FX.spawnExplosion(P.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), radius * 0.8, 0xfbbf24);
                BO.Sound.playExplosion(1.0);
                P.cameraShake = Math.max(P.cameraShake, 0.08);
                for (const z of M.enemiesInRadius(P.pos, radius)) {
                    const dealt = M.dealDamage(z, def.damage, { source: 'ability', element: 'burn' });
                    M.detonate(z, dealt);
                }
            };
            M.timers.push({ t: def.delay, fn: blast });
            if (this.has('inferno_core')) {
                M.timers.push({ t: def.delay + 1.3, fn: () => { for (const z of M.enemiesInRadius(P.pos, radius)) M.applyStatus(z, 'burn'); blast(); } });
            }
        },

        /* ---------------- Tempest ---------------- */
        _cryo_lance(def) {
            const M = this.M;
            const { origin, dir } = this.aim();
            const dirs = this.has('twin_lance') ? [dir.clone().applyAxisAngle(UP, 0.06), dir.clone().applyAxisAngle(UP, -0.06)] : [dir];
            const ids = ['chill'];
            if (this.has('thermal_shock')) ids.push('burn');
            if (this.has('exposing_cold')) ids.push('expose');
            let first = true;
            for (const d of dirs) {
                const wall = BO.World.raycastWorld(origin, d, def.range);
                const maxT = wall ? wall.distance : def.range;
                const end = origin.clone().addScaledVector(d, maxT);
                BO.FX.spawnTracer(origin.clone().add(new THREE.Vector3(0, -0.15, 0)), end, 0x7dd3fc, 0.07, 0.22);
                const hits = [];
                for (const z of M.enemies) {
                    if (!M.isAlive(z)) continue;
                    const c = z.pos.clone().add(new THREE.Vector3(0, z.height * 0.55, 0));
                    const t = c.clone().sub(origin).dot(d);
                    if (t < 0 || t > maxT) continue;
                    const closest = origin.clone().addScaledVector(d, t);
                    if (closest.distanceTo(c) <= Math.max(0.9, z.radius + 0.55)) hits.push({ z, t });
                }
                hits.sort((a, b) => a.t - b.t);
                for (const h of hits) {
                    M.dealDamage(h.z, def.damage, { source: 'ability', element: 'chill', dir: d });
                    M.applyPrimer(h.z, ids);
                    if (first && this.has('glacial_lance') && M.isAlive(h.z)) h.z.frozenTimer = Math.max(h.z.frozenTimer, 1.5);
                    first = false;
                }
            }
            BO.Sound.playGunshot('sniper', false, true, 0.8);
            return true;
        },

        _arc_lash(def) {
            const M = this.M;
            const { origin, dir } = this.aim();
            let best = null;
            let bestScore = Infinity;
            for (const z of M.enemies) {
                if (!M.isAlive(z)) continue;
                const c = z.pos.clone().add(new THREE.Vector3(0, z.height * 0.55, 0));
                const to = c.clone().sub(origin);
                const dist = to.length();
                if (dist > def.range) continue;
                const ang = Math.acos(BO.Math.clamp(to.normalize().dot(dir), -1, 1));
                if (ang > 0.3) continue;
                if (!BO.World.hasLineOfSight(origin.x, origin.y, origin.z, c.x, c.y, c.z)) continue;
                const score = ang * 30 + dist * 0.05;
                if (score < bestScore) { bestScore = score; best = z; }
            }
            if (!best) {
                BO.Events.emit('hud:toast', { text: 'ARC LASH — NO TARGET UNDER YOUR CROSSHAIR', color: '#94a3b8' });
                return false;
            }
            const mult = this.has('capacitor') ? 1.4 : 1;
            const chainCount = this.has('forked_lightning') ? 5 : def.chains;
            const from = origin.clone().add(new THREE.Vector3(0, -0.2, 0));
            BO.FX.spawnTracer(from, best.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfde047, 0.06, 0.2);
            const dealt = M.dealDamage(best, def.damage * mult, { source: 'ability', element: 'shock' });
            M.detonate(best, dealt);
            if (M.isAlive(best)) M.applyStatus(best, 'shock');
            const visited = new Set([best]);
            let prev = best;
            for (let i = 0; i < chainCount; i++) {
                const next = M.nearestEnemies(prev.pos, 8, 1, visited)[0];
                if (!next) break;
                visited.add(next);
                BO.FX.spawnTracer(prev.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), next.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfde047, 0.045, 0.18);
                M.dealDamage(next, def.chainDamage * mult, { source: 'ability', element: 'shock' });
                if (M.isAlive(next)) {
                    M.applyStatus(next, 'shock');
                    if (this.has('ground_arc')) M.applyStatus(next, 'chill');
                }
                prev = next;
            }
            BO.Sound.playTrapZap();
            return true;
        },

        _stormCell(def) {
            const M = this.M;
            const { origin, dir } = this.aim();
            const hit = BO.World.raycastWorld(origin, dir, 40);
            const at = hit ? hit.point.clone() : origin.clone().addScaledVector(dir, 20);
            at.y = BO.World.getGroundHeight(at.x, at.z, at.y + 1);
            const ring = new THREE.Mesh(new THREE.RingGeometry(def.radius - 0.25, def.radius, 48), new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(at.x, at.y + 0.05, at.z);
            BO.World.scene.add(ring);
            M.props.push({ mesh: ring });
            M.ability.storm = { pos: at, t: this.has('perfect_storm') ? 16 : def.duration, tick: 0, def, ring };
            M.ability.ultActive = M.ability.storm.t;
            BO.Events.emit('hud:toast', { text: 'STORM CELL', color: '#fde047' });
        },

        _tickStorm(dt) {
            const M = this.M;
            const s = M.ability.storm;
            if (!s) return;
            s.t -= dt;
            if (this.has('eye_of_the_storm')) { s.pos.x = this.P.pos.x; s.pos.z = this.P.pos.z; s.pos.y = this.P.pos.y; }
            s.ring.position.set(s.pos.x, s.pos.y + 0.05, s.pos.z);
            s.ring.material.opacity = 0.3 + Math.sin(M.elapsed * 6) * 0.15;
            s.tick -= dt;
            if (s.tick <= 0) {
                s.tick = s.def.interval;
                const inside = M.enemiesInRadius(s.pos, s.def.radius);
                if (inside.length) {
                    const z = inside[Math.floor(Math.random() * inside.length)];
                    const top = z.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 12, (Math.random() - 0.5) * 2));
                    BO.FX.spawnTracer(top, z.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 0xfde047, 0.08, 0.14);
                    BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 0.3, 0)), 8, 0xfde047, 3, 4, 0.3, 1.0);
                    const dealt = M.dealDamage(z, s.def.damage, { source: 'ability', element: 'shock' });
                    if (this.has('tempest_lord')) M.detonate(z, dealt);
                    if (M.isAlive(z)) M.applyStatus(z, 'shock');
                    BO.Sound.playTrapZap();
                }
            }
            if (s.t <= 0) {
                BO.World.scene.remove(s.ring);
                M.ability.storm = null;
            }
        }
    };

    BO.RPGAbilities = RPGAbilities;
})(window);
;

/* --- src/rpg/RPGVaultArt.js --- */
/* Native 3D vault dressing. Decorative geometry stays outside playable space. */
(function (BO) {
    'use strict';

    BO.RPGVaultArt = {
        build(layout, seed) {
            const { hw, hl, wallH, biome, style } = layout;
            const group = new THREE.Group();
            group.name = 'Vault architecture';
            const accent = new THREE.Color(biome.light);
            const dark = new THREE.MeshStandardMaterial({ color: 0x172326, roughness: 0.83, metalness: 0.27 });
            const stone = new THREE.MeshStandardMaterial({ color: 0x293534, roughness: 0.9, metalness: 0.08 });
            const trim = new THREE.MeshStandardMaterial({ color: 0x9e7542, roughness: 0.45, metalness: 0.7 });
            const cool = new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(0.65) });
            const warm = new THREE.MeshBasicMaterial({ color: 0xe5b16b });
            const dustMat = new THREE.PointsMaterial({ color: accent, transparent: true, opacity: 0.37, size: 0.075, depthWrite: false });
            const geometries = [];

            const geom = (shape) => { geometries.push(shape); return shape; };
            const add = (shape, material, x, y, z) => {
                const mesh = new THREE.Mesh(shape, material);
                mesh.position.set(x, y, z);
                group.add(mesh);
                return mesh;
            };
            const box = (w, h, d) => geom(new THREE.BoxGeometry(w, h, d));

            const cap = box(0.85, 0.26, 1.35);
            const shaft = box(0.53, wallH - 0.7, 0.96);
            const chase = box(0.065, wallH - 1.5, 0.72);
            const lantern = box(0.25, 0.63, 0.35);
            const lanternCover = box(0.38, 0.13, 0.48);
            const buttresses = Math.max(3, Math.round(hl / 5));
            for (const side of [-1, 1]) {
                for (let i = 0; i < buttresses; i++) {
                    const x = side * (hw - 0.25);
                    const z = -hl + 4 + i * ((hl * 2 - 8) / Math.max(1, buttresses - 1));
                    add(shaft, stone, x, wallH / 2, z);
                    add(chase, trim, side * (hw - 0.56), wallH / 2, z);
                    add(cap, dark, x, 0.24, z);
                    add(cap, dark, x, wallH - 0.15, z);
                    add(lantern, i % 2 ? cool : warm, side * (hw - 0.69), 2.7, z);
                    for (const dy of [-0.37, 0.37]) add(lanternCover, trim, side * (hw - 0.69), 2.7 + dy, z);
                }
                add(box(0.2, 0.14, hl * 2 - 1.4), trim, side * (hw - 0.28), 4.4, 0);
                add(box(0.09, 0.025, hl * 2 - 2.1), cool, side * (hw - 0.82), 0.025, 0);
            }

            // Roof trusses lead the eye toward the gates while leaving light shafts open.
            const truss = box(hw * 2 - 0.42, 0.39, 0.9);
            const underside = box(hw * 2 - 1.3, 0.08, 0.18);
            const crossbars = style === 'Arcade' || style === 'Cloister' ? 5 : 4;
            for (let i = 0; i < crossbars; i++) {
                const z = -hl + 2.8 + i * ((hl * 2 - 5.6) / (crossbars - 1));
                add(truss, dark, 0, wallH - 0.12, z);
                add(underside, i % 2 ? cool : trim, 0, wallH - 0.34, z);
            }
            const roofLip = box(hw * 2 - 0.25, 0.36, 4.5);
            for (const side of [-1, 1]) add(roofLip, stone, 0, wallH + 0.25, side * (hl - 2.1));

            const marker = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.33, depthWrite: false });
            const ring = add(geom(new THREE.RingGeometry(1.12, 1.23, 8)), marker, layout.spawn.x, 0.035, layout.spawn.z - 2.8);
            ring.rotation.x = -Math.PI / 2;
            const diamond = add(geom(new THREE.RingGeometry(0.42, 0.52, 4)), marker, layout.spawn.x, 0.04, layout.spawn.z - 2.8);
            diamond.rotation.x = -Math.PI / 2;

            const motes = [];
            let state = (seed >>> 0) + 1;
            const rand = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
            for (let i = 0; i < 170; i++) motes.push((rand() - 0.5) * hw * 1.8, 1.55 + rand() * (wallH - 2), (rand() - 0.5) * hl * 1.8);
            const cloud = geom(new THREE.BufferGeometry());
            cloud.setAttribute('position', new THREE.Float32BufferAttribute(motes, 3));
            const particles = new THREE.Points(cloud, dustMat);
            group.add(particles);
            BO.World.scene.add(group);

            return {
                update(elapsed) {
                    particles.position.x = 0.38 * Math.sin(elapsed * 0.32);
                    particles.position.y = 0.15 * Math.sin(elapsed * 0.43);
                },
                dispose() {
                    group.removeFromParent();
                    geometries.forEach((geometry) => geometry.dispose());
                    [dark, stone, trim, cool, warm, dustMat, marker].forEach((material) => material.dispose());
                }
            };
        }
    };
})(window.BO);
;

/* --- src/rpg/RPGRoomEvent.js --- */
/* In-vault events and challenges. Each instance lives for exactly one floor. */
(function (BO) {
    'use strict';

    const INTERACTIVE = new Set(['shop', 'puzzle', 'sanctuary', 'blessing', 'unlock', 'bowling', 'defend', 'wager', 'fountain', 'forge_room', 'relay_room', 'mimic']);
    const OBJECTIVES = new Set(['puzzle', 'bowling', 'defend', 'mimic']);
    const DEFEND_TIME = 120;
    const RUNES = ['✦', '◈', '☾', '✚'];

    class RPGRoomEvent {
        constructor(mode, room) {
            this.mode = mode;
            this.room = room;
            this.type = room.id;
            this.done = false;
            this.used = false;
            this.elapsed = 0;
            this.active = false;
            this.blocks = OBJECTIVES.has(this.type);
            this.limit = this.type === 'speedrun' ? 37 + Math.min(22, mode.run.floor) + mode.layout.camps.length : 0;
            this.radius = 6;
            this.strikePins = Array.from({ length: 10 }, (_, i) => i);
            this.rolls = 0;
            this.pos = new THREE.Vector3(mode.layout.center.x, 0, mode.layout.center.z);
            if (INTERACTIVE.has(this.type)) this.build();
        }

        get run() { return this.mode.run; }
        get profile() { return this.mode.Profile; }

        build() {
            const group = new THREE.Group();
            const color = new THREE.Color(this.room.color);
            const metal = new THREE.MeshStandardMaterial({ color: 0x303c42, roughness: 0.5, metalness: 0.6 });
            const inlay = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4 });
            const brass = new THREE.MeshStandardMaterial({ color: 0xa57a42, roughness: 0.48, metalness: 0.68 });
            const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 0.92, 8), metal);
            pedestal.position.y = 0.46;
            const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.79, 0.86, 0.16, 8), brass);
            group.add(plinth);
            const shapes = {
                puzzle: () => new THREE.DodecahedronGeometry(0.36, 0),
                bowling: () => new THREE.SphereGeometry(0.34, 18, 12),
                relay_room: () => new THREE.TorusKnotGeometry(0.22, 0.075, 40, 8),
                wager: () => new THREE.CylinderGeometry(0.32, 0.32, 0.1, 18),
                forge_room: () => new THREE.BoxGeometry(0.62, 0.31, 0.34)
            };
            const glyph = new THREE.Mesh(shapes[this.type]?.() || new THREE.OctahedronGeometry(0.35, 0), inlay);
            glyph.position.y = 1.24;
            if (this.type === 'mimic' || this.type === 'unlock') {
                pedestal.geometry.dispose();
                pedestal.geometry = new THREE.BoxGeometry(1.5, 0.66, 0.87);
                pedestal.position.y = 0.41;
                const rim = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.16, 0.94), brass);
                rim.position.y = 0.77;
                group.add(rim);
                for (const x of [-0.49, 0.49]) {
                    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.75, 0.9), brass);
                    brace.position.set(x, 0.42, 0);
                    group.add(brace);
                }
            } else if (this.type === 'shop') {
                const counter = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.28, 1.05), brass);
                counter.position.y = 0.78;
                group.add(counter);
            }
            const ring = new THREE.Mesh(new THREE.RingGeometry(this.radius - 0.15, this.radius, 64),
                new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false }));
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.045;
            group.add(pedestal, glyph);
            if (this.type === 'defend') group.add(ring);
            else { ring.geometry.dispose(); ring.material.dispose(); }
            group.position.copy(this.pos);
            BO.World.scene.add(group);
            this.group = group;
            this.orb = glyph;
        }

        dispose() {
            if (!this.group) return;
            this.group.removeFromParent();
            const materials = new Set();
            this.group.traverse((object) => {
                if (!object.isMesh) return;
                object.geometry.dispose();
                materials.add(object.material);
            });
            materials.forEach((material) => material.dispose());
        }

        notify(text) {
            BO.Events.emit('hud:toast', { text, color: this.room.color });
        }

        record(metric) {
            const p = this.profile.data;
            const receipt = this.run.seed + ':' + this.run.floor + ':' + this.type + ':' + metric;
            if (p.challengeReceipts.includes(receipt)) return false;
            p.challengeReceipts.push(receipt);
            if (p.challengeReceipts.length > 300) p.challengeReceipts.shift();
            BO.RPGUnlocks.record(p, metric);
            this.profile.save();
            return true;
        }

        onEnter() {
            if (this.run.roomApplied) return;
            if (this.type === 'thief') {
                const lost = Math.floor(this.run.gold / 2);
                this.run.gold -= lost;
                this.run.roomApplied = true;
                this.mode.Profile.saveRun(this.mode._snapshot());
                this.modal('A shadow in the Vault', `
                    <div class="vault-theft" aria-hidden="true"><div></div><i>◆</i><i>◆</i></div>
                    <p>A cloaked thief snatches your pouch and disappears. You lose ${lost} gold, half of what you were carrying.</p>`,
                    [['Continue', () => this.close()]]);
            } else if (this.type === 'curse') {
                this.run.curse = true;
                this.run.roomApplied = true;
                this.mode.recomputeStats();
                this.mode.Profile.saveRun(this.mode._snapshot());
                this.notify('Curse of the Hollow: take 15% more damage. Extract alive to count toward Night Courier.');
            }
        }

        canUse() { return INTERACTIVE.has(this.type) && !this.done && !this.rolling && !(this.type === 'defend' && this.active) && !(this.type === 'mimic' && this.used); }

        objective() {
            if (this.type === 'speedrun' && !this.done) {
                return this.elapsed < this.limit ? 'Double bonus: ' + Math.ceil(this.limit - this.elapsed) + ' s left' : 'Time expired. You can still clear the room.';
            }
            if (this.type === 'defend' && !this.done) return this.active
                ? 'Hold the circle: ' + Math.floor(this.elapsed) + ' / ' + DEFEND_TIME + ' s. Leaving resets the timer.'
                : 'Use the altar to begin the two-minute defense.';
            if (this.type === 'mimic' && !this.used) return 'Inspect the chest.';
            if (this.blocks) return this.room.desc;
            return '';
        }

        update(dt) {
            if (this.orb) this.orb.rotation.y += dt * 1.4;
            if (this.done) return;
            if (this.type === 'speedrun') this.elapsed += dt;
            if (this.type === 'defend' && this.active) this.updateDefense(dt);
            if (this.type === 'mimic' && this.used && this.mode._livingCount() === 0) this.complete('Mimic defeated.', 42, 'rare');
            if (this.type === 'miniboss' && this.champion?.alive && this.champion.hp < this.champion.maxHp * 0.5 && !this.used) {
                this.used = true;
                this.spawnReinforcements(3);
                this.notify('The champion calls its escort.');
            }
        }

        spawnReinforcements(total) {
            const mode = this.mode;
            const spots = mode.layout.ambushSpots;
            const offset = this.reinforcements || 0;
            for (let i = 0; i < total; i++) {
                const p = spots[(offset + i) % spots.length];
                mode._spawnEnemy(mode._pickArchetype(), p.x, p.z, { aggro: true });
            }
            this.reinforcements = offset + total;
        }

        updateDefense(dt) {
            const player = this.mode.P;
            const inside = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z) <= this.radius && player.pos.y < 2;
            if (inside) this.elapsed += dt;
            else if (this.elapsed > 0) {
                this.elapsed = 0;
                this.notify('You left the circle. Defense timer reset.');
            }
            if (this.elapsed >= DEFEND_TIME) {
                for (const enemy of this.mode.enemies) enemy.destroy();
                this.mode.enemies = [];
                BO.Combat.setTargetPool([]);
                this.record('defenses');
                this.complete('Area secured.', 100, 'epic');
                return;
            }
            this.spawnClock -= dt;
            if (this.spawnClock <= 0) {
                const space = Math.max(0, 10 - this.mode._livingCount());
                this.spawnReinforcements(Math.min(space, 2 + Math.floor(this.elapsed / 40)));
                this.spawnClock = 6;
            }
        }

        clearBonus() {
            if (this.type !== 'speedrun' || this.done) return 1;
            this.done = true;
            const won = this.elapsed <= this.limit;
            this.mode._dropGold(this.pos, won ? 70 : 35);
            if (won) {
                this.record('speedWins');
                this.notify('Speedrun complete. Double floor-clear XP and gold.');
            }
            return won ? 2 : 1;
        }

        complete(text, gold = 0, rarity = '') {
            this.done = true;
            this.blocks = false;
            if (gold) this.mode._dropGold(this.pos, gold);
            if (rarity) this.mode._dropItem(this.pos.clone().add(new THREE.Vector3(1.3, 0, 0)), this.profile.rollItem({ floor: this.run.floor, minRarity: rarity }));
            this.notify(text);
        }

        close() { BO.RPGUI.closeModal(); }

        modal(title, body, options, closeLabel = 'Back') {
            const handlers = {};
            const buttons = options.map(([label, handler, disabled], i) => {
                handlers['opt' + i] = handler;
                return `<button class="btn btn-sm" data-mact="opt${i}" ${disabled ? 'disabled' : ''}>${label}</button>`;
            }).join('');
            BO.RPGUI._modalKind = 'room-event';
            BO.RPGUI.openModal({ title, kicker: this.room.name, accent: this.room.color, closeLabel, handlers,
                html: body + '<div class="rpg-row-end">' + buttons + '</div>' });
        }

        interact() {
            if (!this.canUse()) return;
            switch (this.type) {
                case 'puzzle': this.puzzle(); break;
                case 'bowling': this.bowling(); break;
                case 'shop': this.shop(); break;
                case 'defend':
                    this.active = true;
                    this.spawnClock = 0;
                    this.notify('Hold the circle for two continuous minutes.');
                    break;
                case 'blessing':
                    this.mode.heal(this.mode.P.maxHp * 0.3);
                    this.complete('Blessed by the Haven.');
                    this.mode._offerBoons('Choose a blessing');
                    break;
                case 'unlock': this.unlock(); break;
                case 'sanctuary': this.sanctuary(); break;
                case 'wager': this.wager(); break;
                case 'fountain': this.fountain(); break;
                case 'forge_room': this.forge(); break;
                case 'relay_room':
                    this.mode.ability.ult = 1;
                    this.mode.ability.cd.primer = this.mode.ability.cd.detonator = 0;
                    this.complete('Ultimate charged. Abilities refreshed.');
                    break;
                case 'mimic':
                    if (this.used) return;
                    this.used = true;
                    this.mode._spawnEnemy(this.mode._pickArchetype(), this.pos.x, this.pos.z - 2.5, { elite: true, aggro: true, hp: 1.3 });
                    this.spawnReinforcements(2);
                    this.notify('Mimic ambush!');
                    break;
            }
        }

        puzzle(recall = false) {
            if (!this.sequence) {
                const length = Math.min(6, 3 + Math.floor(this.run.floor / 8));
                this.sequence = Array.from({ length }, (_, i) => RUNES[(Math.floor(this.run.seed / (7 + i * 11)) + i) % RUNES.length]);
                this.input = [];
            }
            const skip = ['Skip reward', () => { this.complete('Puzzle passed.'); this.close(); }];
            if (!recall) {
                this.input = [];
                this.modal('Memorize the runes', '<div class="vault-runes">' + this.sequence.join(' ') + '</div><p>Repeat the symbols in the same order.</p>',
                    [['I’m ready', () => this.puzzle(true)], skip]);
                return;
            }
            const keys = RUNES.map((rune) => [rune, () => {
                if (rune !== this.sequence[this.input.length]) { this.notify('That rune was out of order. Try again.'); this.puzzle(); return; }
                this.input.push(rune);
                if (this.input.length < this.sequence.length) { this.puzzle(true); return; }
                this.record('puzzles');
                this.complete('Rune puzzle solved.', 48, 'rare');
                this.close();
            }]);
            this.modal('Repeat the sequence', '<p>' + this.input.length + ' / ' + this.sequence.length + ' runes entered</p>', [...keys, ['Show sequence', () => this.puzzle()], skip]);
        }

        bowling() {
            const rows = [[0], [-8, 8], [-16, 0, 16], [-24, -8, 8, 24]];
            const pins = rows.flat();
            const drift = (this.run.seed % 19) - 9;
            const score = 10 - this.strikePins.length;
            let pinId = 0;
            const lane = `<div class="vault-lane" aria-hidden="true">${rows.map(row => '<div class="vault-pin-row">' +
                row.map(() => '<i class="' + (this.strikePins.includes(pinId++) ? '' : 'down') + '"></i>').join('') + '</div>').join('')}<div class="vault-ball"></div></div>`;
            const options = [['Roll', () => {
                const modal = BO.RPGUI.modal;
                const aim = Number(modal.querySelector('[data-bowl="aim"]').value);
                const power = Number(modal.querySelector('[data-bowl="power"]').value);
                const position = aim + drift + (power - 68) * 0.14;
                const radius = Math.max(4, 27 - Math.abs(power - 68) * 0.55);
                this.strikePins = this.strikePins.filter((id) => Math.abs(pins[id] - position) > radius);
                this.rolls++;
                this.rolling = true;
                const ball = modal.querySelector('.vault-ball');
                ball.style.setProperty('--roll-offset', position * 2 + 'px');
                ball.classList.add('rolling');
                const rollId = BO.RPGUI._modalHandlers.opt0;
                modal.querySelector('[data-mact="opt0"]').disabled = true;
                const settle = () => {
                    if (this.mode.roomEvent !== this || !this.mode.active || this.done) return;
                    this.rolling = false;
                    if (!this.strikePins.length && this.rolls === 1) this.record('strikes');
                    if (!this.strikePins.length || this.rolls === 2) {
                        const fallen = 10 - this.strikePins.length;
                        const label = fallen === 10 ? (this.rolls === 1 ? 'Strike!' : 'Spare!') : fallen + ' pins down.';
                        this.complete(label, fallen * 6, fallen === 10 ? 'rare' : '');
                        if (BO.RPGUI._modalHandlers.opt0 === rollId) this.modal(label, '<p>' + fallen + ' of 10 pins knocked down.</p>', [['Leave the lane', () => this.close()]]);
                    } else if (BO.RPGUI._modalHandlers.opt0 === rollId) this.bowling();
                };
                setTimeout(settle, 620);
            }], ['Leave lane', () => { this.complete('Bowling round ended.'); this.close(); }]];
            this.modal('Vault Bowling', lane + `<p>${score}/10 pins · Roll ${this.rolls + 1}/2 · Lane bends ${drift < 0 ? 'left' : 'right'} by ${Math.abs(drift)}. Ideal power is 68.</p>
                <label class="vault-slider">Aim <input type="range" min="-34" max="34" value="${-drift}" data-bowl="aim"><output>${-drift}</output></label>
                <label class="vault-slider">Power <input type="range" min="25" max="100" value="52" data-bowl="power"><output>52</output></label>`, options);
        }

        shop() {
            const items = BO.RPGItems;
            const prices = this.mode.D.ISAAC?.shopPrices || {};
            const options = [
                ['Refill one potion · 28 gold', () => {
                    this.run.potions++; this.shop();
                }, () => this.run.potions >= this.mode.stats.potionsMax, 28],
                ['Heal 40% · 45 gold', () => { this.mode.heal(this.mode.P.maxHp * 0.4); this.shop(); }, () => this.mode.P.hp >= this.mode.P.maxHp, 45],
                [`Soul Shield Heart · ${prices.heart_soul || 26} gold`, () => {
                    items?.addSoulShield(25); this.shop();
                }, () => !items || (this.run.soulShield || 0) >= 150, prices.heart_soul || 26],
                [`Brass Key · ${prices.key || 16} gold`, () => {
                    if (items) { items.ensureRunState(this.run); this.run.keys++; } this.shop();
                }, () => !items, prices.key || 16],
                [`Floor Bomb · ${prices.bomb_pickup || 16} gold`, () => {
                    if (items) { items.ensureRunState(this.run); this.run.bombs++; } this.shop();
                }, () => !items, prices.bomb_pickup || 16],
                [`Mystery Pill / Card · ${prices.pill || 22} gold`, () => {
                    if (items) items.spawnPickup(this.pos.clone().add(new THREE.Vector3(0, 0, 1.8)), Math.random() < 0.5 ? 'pill' : 'card');
                    this.shop();
                }, () => !items, prices.pill || 22],
                ['Buy rare gear · 80 gold', () => {
                    this.used = true;
                    this.mode._dropItem(this.pos.clone().add(new THREE.Vector3(1.3, 0, 0)), this.profile.rollItem({ floor: this.run.floor + 1, minRarity: 'rare' }));
                    this.shop();
                }, () => this.used, 80]
            ].map(([text, buy, blocked, cost]) => [text, () => {
                if (this.run.gold < cost || blocked()) return;
                this.run.gold -= cost;
                buy();
            }, this.run.gold < cost || blocked()]);
            this.modal('Traveling Shop', '<p>You have ' + this.run.gold + ' unbanked gold. Pedestals in front of the counter also hold wares.</p>', options);
        }

        unlock() {
            const p = this.profile.data;
            const options = BO.RPGUnlocks.curios.filter((item) => !p.curios.includes(item.id));
            if (this.run.roomApplied || !options.length) {
                this.complete(options.length ? 'This vault has already been claimed.' : 'You have collected every Vault curio.', options.length ? 0 : 60);
                return;
            }
            const item = options[this.run.seed % options.length];
            p.curios.push(item.id);
            p.unlockRecords.curios = p.curios.length;
            this.run.roomApplied = true;
            this.profile.saveRun(this.mode._snapshot());
            this.complete('Curio unlocked: ' + item.name);
            this.modal(item.name, `<div class="vault-runes" style="color:${item.color}">${item.icon}</div><p>Added permanently. Equip it as a crest in the Haven collection.</p>`, [['Continue', () => this.close()]]);
        }

        sanctuary() {
            this.modal('Sanctuary', '<p>Take one blessing from this altar.</p>', [
                ['Heal 55%', () => { this.mode.heal(this.mode.P.maxHp * 0.55); this.claim('Recovered health.'); }],
                ['Gain +25 Soul Shield', () => { BO.RPGItems?.addSoulShield(25); this.claim('Soul Shield granted.'); }],
                ['Refill one potion', () => { this.run.potions++; this.claim('Potion restored.'); }, this.run.potions >= this.mode.stats.potionsMax]
            ]);
        }

        wager() {
            const cost = 30;
            this.modal('Coin Wager', '<p>Stake 30 unbanked gold. The vault either returns 60 or takes your stake.</p>', [
                ['Wager 30 gold', () => {
                    const won = this.run.seed % 11 < 5;
                    this.run.gold += won ? cost : -cost;
                    this.claim(won ? 'You won the wager.' : 'The vault kept your stake.');
                }, this.run.gold < cost]
            ]);
        }

        fountain() {
            this.modal('Fountain of Exchange', '<p>Choose one exchange.</p>', [
                ['Sell one potion for 55 gold', () => { this.run.potions--; this.run.gold += 55; this.claim('Potion exchanged.'); }, this.run.potions < 1],
                ['Full heal for 65 gold', () => { this.run.gold -= 65; this.mode.heal(this.mode.P.maxHp); this.claim('Fully healed.'); }, this.run.gold < 65]
            ]);
        }

        forge() {
            const items = this.run.pack.filter((item) => item.ilvl < 40);
            const cost = 18;
            this.modal('Field Forge', '<p>Spend 18 unbanked scrap to raise one packed item by two levels.</p>', items.map((item) => [
                item.name.replace(/[&<>"']/g, ''), () => {
                    if (this.run.scrap < cost) return;
                    this.run.scrap -= cost;
                    item.ilvl = Math.min(40, item.ilvl + 2);
                    this.claim('Packed gear reforged.');
                }, this.run.scrap < cost
            ]));
        }

        claim(text) { this.complete(text); this.close(); }
    }
    BO.RPGRoomEvent = RPGRoomEvent;
})(window.BO);
;

/* --- src/rpg/RPGDoors.js --- */
/* Rogue Lite door types: each door changes what entering costs and what the next floor pays,
   independently of which room waits behind it. */
(function (BO) {
    'use strict';

    const DOORS = {
        standard: { id: 'standard', name: 'Vault Door', icon: '▯', color: '#b7a27a', weight: 46, minFloor: 1,
            desc: 'An ordinary door. No cost, no modifier.' },
        gilded: { id: 'gilded', name: 'Gilded Door', icon: '◆', color: '#f6cf62', weight: 9, minFloor: 2,
            desc: 'Pay a toll in unbanked gold. Gold found on the next floor is doubled.',
            toll: (floor) => 15 + floor * 4, gold: 2 },
        blood: { id: 'blood', name: 'Blood Door', icon: '♥', color: '#f0606f', weight: 7, minFloor: 3,
            desc: 'Costs 15% of your max HP to open. The next floor gives 75% more XP and 25% more gold.',
            bloodPct: 0.15, xp: 1.75, gold: 1.25 },
        fractured: { id: 'fractured', name: 'Fractured Door', icon: '⚡', color: '#ff9d5c', weight: 8, minFloor: 4,
            desc: 'Enemies beyond have 35% more HP and hit 15% harder. XP and gold are raised by 50%.',
            hp: 1.35, dmg: 1.15, xp: 1.5, gold: 1.5 },
        veiled: { id: 'veiled', name: 'Veiled Door', icon: '◌', color: '#9fa8c7', weight: 7, minFloor: 3,
            desc: 'The sign is hidden, so you do not know the room. XP and gold are raised by 30%.',
            xp: 1.3, gold: 1.3, hidden: true },
        hourglass: { id: 'hourglass', name: 'Hourglass Door', icon: '⌛', color: '#8fe0ff', weight: 6, minFloor: 3,
            desc: 'Seals itself 25 seconds after the floor is cleared. The next floor gives 40% more gold and XP.',
            window: 25, xp: 1.4, gold: 1.4 },
        clover: { id: 'clover', name: 'Clover Door', icon: '✤', color: '#8ee08a', weight: 6, minFloor: 2,
            desc: 'Lucky. Refill one potion when you step through and find 20% more gold.',
            potion: 1, gold: 1.2 },
        reliquary: { id: 'reliquary', name: 'Reliquary Door', icon: '⚙', color: '#c9a8ff', weight: 6, minFloor: 5,
            desc: 'Pay unbanked scrap to open. A treasure chest waits on the next floor.',
            scrap: (floor) => 4 + Math.ceil(floor / 2), chest: true }
    };

    const NONE = DOORS.standard;
    const free = (id) => !DOORS[id].toll && !DOORS[id].bloodPct && !DOORS[id].scrap && !DOORS[id].window;

    BO.RPGDoors = {
        DOORS,
        get(id) { return DOORS[id] || NONE; },

        /** One door type per gate. At least one gate is always free and never seals. */
        roll(count, nextFloor, roomTypes) {
            const pool = Object.values(DOORS).filter((d) => d.minFloor <= nextFloor);
            const out = [];
            for (let i = 0; i < count; i++) {
                if (roomTypes[i] === 'boss' || nextFloor <= 2 && i === 0) { out.push('standard'); continue; }
                const options = pool.filter((d) => d.id === 'standard' || !out.includes(d.id));
                let total = 0;
                for (const d of options) total += d.weight;
                let roll = Math.random() * total;
                let pick = 'standard';
                for (const d of options) { roll -= d.weight; if (roll <= 0) { pick = d.id; break; } }
                out.push(pick);
            }
            if (!out.some(free)) out[0] = 'standard';
            return out;
        },

        cost(door, run, player) {
            const floor = run.floor + 1;
            if (door.toll) return { kind: 'gold', amount: door.toll(floor), ok: run.gold >= door.toll(floor), label: `${door.toll(floor)} GOLD` };
            if (door.scrap) return { kind: 'scrap', amount: door.scrap(floor), ok: run.scrap >= door.scrap(floor), label: `${door.scrap(floor)} SCRAP` };
            if (door.bloodPct) {
                const amount = Math.round(player.maxHp * door.bloodPct);
                return { kind: 'hp', amount, ok: player.hp > amount + 1, label: `${amount} HP` };
            }
            return null;
        }
    };
})(window.BO);
;

/* --- src/rpg/RPGItems.js --- */
/* ============================================================================
   BLACKOUT OPS — RPG Isaac-Style Run Items, Orbitals, Familiars, Pickups,
   Pedestals, Devil/Angel Deals, Pills, Cards & Transformations.
   Loaded before RPGMode.js. Zero-build IIFE pattern.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const UP = new THREE.Vector3(0, 1, 0);

    function seededShuffle(arr, seed) {
        const out = arr.slice();
        let s = (seed >>> 0) || 1;
        for (let i = out.length - 1; i > 0; i--) {
            s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
            const j = s % (i + 1);
            const tmp = out[i];
            out[i] = out[j];
            out[j] = tmp;
        }
        return out;
    }

    function disposeObject3D(root) {
        if (!root) return;
        root.removeFromParent();
        const mats = new Set();
        root.traverse((obj) => {
            if (!obj.isMesh) return;
            if (obj.geometry) obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m && mats.add(m));
            else if (obj.material) mats.add(obj.material);
        });
        mats.forEach((m) => m.dispose());
    }

    class RPGItems {
        constructor() {
            this.pedestals = [];
            this.pickups = [];
            this.bombs = [];
            this.rocks = [];      // { type: 'urn'|'tinted', mesh, group, pos, hp, dead, entity }
            this.lockedChests = [];
            this.orbitals = [];   // 3D meshes orbiting player
            this.familiars = [];  // 3D buddy meshes following player
            this.turrets = [];    // deployed 3D turrets for the room
            this._orbitalAngle = 0;
            this._stormTimer = 0;
            this._chariotHitCd = new WeakMap();
            this._familiarSignature = '';
        }

        get D() { return BO.RPGData; }
        get ID() { return BO.RPGItemsData; }
        get M() { return BO.RPGMode; }
        get P() { return BO.Player; }
        get run() { return this.M?.run || null; }

        /* ======================================================================
           Run state initialization & serialization helpers
        ====================================================================== */

        ensureRunState(run) {
            if (!run) return run;
            const I = this.D.ISAAC || {};
            if (!Array.isArray(run.artifacts)) run.artifacts = [];
            if (run.activeItem === undefined) run.activeItem = null;
            if (!Number.isFinite(run.activeCharges)) run.activeCharges = 0;
            if (!run.pocket || typeof run.pocket !== 'object') run.pocket = null;
            if (!run.pillMap || typeof run.pillMap !== 'object' || Object.keys(run.pillMap).length < 10) {
                run.pillMap = this._buildPillMap(run.seed || 1);
            }
            if (!Number.isFinite(run.keys)) run.keys = I.startKeys ?? 1;
            if (!Number.isFinite(run.bombs)) run.bombs = I.startBombs ?? 2;
            if (!Number.isFinite(run.soulShield)) run.soulShield = 0;
            if (!Number.isFinite(run.devilDeals)) run.devilDeals = 0;
            if (!Number.isFinite(run.angelChance)) run.angelChance = 0.5;
            if (!Array.isArray(run.transformations)) run.transformations = [];
            if (typeof run.holyMantleReady !== 'boolean') run.holyMantleReady = run.artifacts.includes('holy_mantle');
            if (!Number.isFinite(run.livesLeft)) run.livesLeft = 0;
            if (!Number.isFinite(run.devilHpPenalty)) run.devilHpPenalty = 0;
            if (typeof run.tookRedHpDamageOnFloor !== 'boolean') run.tookRedHpDamageOnFloor = false;
            if (!run.permPillBuffs || typeof run.permPillBuffs !== 'object') {
                run.permPillBuffs = { dmgMult: 1, fireRateMult: 1, moveSpeedMult: 1, reloadSpeedMult: 1, maxHpAdd: 0 };
            }
            if (!run.tempFloorBuffs || typeof run.tempFloorBuffs !== 'object') {
                run.tempFloorBuffs = { dmgMult: 1, maxHpAdd: 0, emperorTimer: 0, devilCardTimer: 0, chariotTimer: 0, familiarMult: 1 };
            }
            if (!Number.isFinite(run.vampiricKills)) run.vampiricKills = 0;
            if (!Number.isFinite(run.deadEyeStreak)) run.deadEyeStreak = 0;
            return run;
        }

        initRun(run) {
            this.clearVisuals();
            this.ensureRunState(run);
            return run;
        }

        _buildPillMap(seed) {
            const shuffled = seededShuffle(this.ID.PILLS.map((p) => p.id), (seed || 1) + 9173);
            const map = {};
            for (let i = 0; i < this.ID.PILL_APPEARANCES.length; i++) {
                map[String(i)] = { id: shuffled[i % shuffled.length], identified: false };
            }
            return map;
        }

        has(id) {
            const r = this.run;
            return !!(r && Array.isArray(r.artifacts) && r.artifacts.includes(id));
        }

        hasTransformation(id) {
            const r = this.run;
            return !!(r && Array.isArray(r.transformations) && r.transformations.includes(id));
        }

        transformationCounts(run = this.run) {
            const counts = {};
            for (const t of this.ID.TRANSFORMATIONS) counts[t.id] = 0;
            if (!run) return counts;
            const ids = [...(run.artifacts || [])];
            if (run.activeItem) ids.push(run.activeItem);
            const seen = new Set();
            for (const id of ids) {
                if (seen.has(id)) continue;
                seen.add(id);
                const def = this.ID.itemById(id);
                if (!def || !def.tags) continue;
                for (const tag of def.tags) {
                    if (counts[tag] !== undefined) counts[tag]++;
                }
            }
            return counts;
        }

        _checkTransformations(run = this.run) {
            if (!run) return;
            const counts = this.transformationCounts(run);
            for (const t of this.ID.TRANSFORMATIONS) {
                if (counts[t.id] >= 3 && !run.transformations.includes(t.id)) {
                    run.transformations.push(t.id);
                    if (t.fx.grantSoulShield) {
                        this.addSoulShield(t.fx.grantSoulShield);
                    }
                    this.M?.recomputeStats?.();
                    BO.RPGUnlocks?.record?.(BO.RPGProfile.data, 'transformations', 1);
                    BO.Sound?.playQuestFanfare?.();
                    BO.FX?.spawnParticles?.(this.P.pos.clone().add(UP), 34, t.hex, 5.5, -1, 0.9, 1.5);
                    BO.Events.emit('hud:banner', {
                        title: `TRANSFORMATION: ${t.name.toUpperCase()}`,
                        sub: t.desc,
                        color: t.color
                    });
                    BO.Events.emit('hud:toast', { text: `${t.icon} ${t.name.toUpperCase()} AWAKENED!`, color: t.color });
                }
            }
        }

        /* ======================================================================
           Stat integration for RPGProfile & Shared Engine (Combat / Player)
        ====================================================================== */

        applyProfileStats(s, run) {
            this.ensureRunState(run);
            let maxHpAdd = (run.permPillBuffs?.maxHpAdd || 0) + (run.tempFloorBuffs?.maxHpAdd || 0);
            let maxHpMult = 1;
            let goldBonus = 0;
            for (const id of run.artifacts) {
                const def = this.ID.passiveById(id);
                if (!def || !def.fx) continue;
                if (def.fx.maxHpAdd) maxHpAdd += def.fx.maxHpAdd;
                if (def.fx.maxHpMult) maxHpMult *= def.fx.maxHpMult;
                if (def.fx.goldBonusMult) goldBonus += (def.fx.goldBonusMult - 1) * 100;
            }
            if (Array.isArray(run.transformations) && run.transformations.includes('goliath')) {
                maxHpAdd += 40;
            }
            s.maxHp = Math.max(30, Math.round((s.maxHp + maxHpAdd) * maxHpMult * (1 - (run.devilHpPenalty || 0))));
            s.goldFind += goldBonus;
        }

        shotModifiers() {
            const out = {
                damageMult: 1,
                fireRateMult: 1,
                multishot: 0,
                spreadAdd: 0,
                rangeMult: 1,
                homing: false,
                bounceCount: 0,
                pierceAdd: 0,
                explosive: false,
                explosiveRadius: 0,
                splitCount: 0,
                spectral: false,
                giantScale: 1,
                tracerColor: null,
                tracerWidth: 0.024,
                chainLightning: false,
                brimstone: false,
                techRing: false,
                vampiric: false,
                tinyPlanet: false
            };
            const r = this.run;
            if (!r || !this.M?.active) return out;
            this.ensureRunState(r);

            for (const id of r.artifacts) {
                const def = this.ID.passiveById(id);
                if (!def || !def.fx) continue;
                const fx = def.fx;
                if (fx.damageMult) out.damageMult *= fx.damageMult;
                if (fx.fullHpDmgMult && this.P && this.P.hp >= this.P.maxHp - 0.5) out.damageMult *= fx.fullHpDmgMult;
                if (fx.fireRateMult) out.fireRateMult *= fx.fireRateMult;
                if (fx.multishot) out.multishot += fx.multishot;
                if (fx.spreadAdd) out.spreadAdd += fx.spreadAdd;
                if (fx.rangeMult) out.rangeMult *= fx.rangeMult;
                if (fx.homing) out.homing = true;
                if (fx.bounceCount) out.bounceCount += fx.bounceCount;
                if (fx.pierceAdd) out.pierceAdd += fx.pierceAdd;
                if (fx.explosive) {
                    out.explosive = true;
                    out.explosiveRadius = Math.max(out.explosiveRadius, fx.explosiveRadius || 3.2);
                }
                if (fx.splitCount) out.splitCount += fx.splitCount;
                if (fx.spectral) out.spectral = true;
                if (fx.giantScale) out.giantScale = Math.max(out.giantScale, fx.giantScale);
                if (fx.tracerColor) out.tracerColor = fx.tracerColor;
                if (fx.tracerWidth) out.tracerWidth = Math.max(out.tracerWidth, fx.tracerWidth);
                if (fx.chainLightning) out.chainLightning = true;
                if (fx.brimstone) out.brimstone = true;
                if (fx.techRing) out.techRing = true;
                if (fx.vampiric) out.vampiric = true;
                if (fx.tinyPlanet) out.tinyPlanet = true;
            }

            if (this.has('dead_eye') && r.deadEyeStreak > 0) {
                out.damageMult *= 1 + Math.min(0.4, r.deadEyeStreak * 0.05);
            }

            // Transformations
            for (const tid of r.transformations) {
                const tf = this.ID.transformationById(tid);
                if (!tf || !tf.fx) continue;
                if (tf.fx.damageMult) out.damageMult *= tf.fx.damageMult;
                if (tf.fx.fireRateMult) out.fireRateMult *= tf.fx.fireRateMult;
                if (tf.fx.pierceAdd) out.pierceAdd += tf.fx.pierceAdd;
                if (tf.fx.spectral) out.spectral = true;
            }

            // Pills & active Tarot cards
            if (r.permPillBuffs) {
                out.damageMult *= r.permPillBuffs.dmgMult || 1;
                out.fireRateMult *= r.permPillBuffs.fireRateMult || 1;
            }
            if (r.tempFloorBuffs) {
                out.damageMult *= r.tempFloorBuffs.dmgMult || 1;
                if (r.tempFloorBuffs.emperorTimer > 0) {
                    out.damageMult *= 1.5;
                    out.fireRateMult *= 1.3;
                }
                if (r.tempFloorBuffs.devilCardTimer > 0) {
                    out.damageMult *= 1.75;
                }
            }

            out.fireRateMult = BO.Math.clamp(out.fireRateMult, 0.25, 8.0);
            out.damageMult = BO.Math.clamp(out.damageMult, 0.15, 25.0);
            out.rangeMult = BO.Math.clamp(out.rangeMult, 0.4, 3.0);
            return out;
        }

        moveSpeedMult() {
            const r = this.run;
            if (!r || !this.M?.active) return 1;
            let mult = r.permPillBuffs?.moveSpeedMult || 1;
            for (const id of r.artifacts) {
                const fx = this.ID.passiveById(id)?.fx;
                if (fx?.moveSpeedMult) mult *= fx.moveSpeedMult;
            }
            if (this.hasTransformation('void')) mult *= 1.2;
            if (r.tempFloorBuffs?.chariotTimer > 0) mult *= 1.5;
            return BO.Math.clamp(mult, 0.5, 2.5);
        }

        reloadSpeedMult() {
            const r = this.run;
            if (!r || !this.M?.active) return 1;
            let mult = r.permPillBuffs?.reloadSpeedMult || 1;
            for (const id of r.artifacts) {
                const fx = this.ID.passiveById(id)?.fx;
                if (fx?.reloadSpeedMult) mult *= fx.reloadSpeedMult;
            }
            return BO.Math.clamp(mult, 0.5, 3.0);
        }

        /* ======================================================================
           Granting Artifacts, Soul Shield, Active Items, Pockets
        ====================================================================== */

        addSoulShield(amount) {
            const r = this.run;
            if (!r || amount <= 0) return 0;
            const cap = this.D.ISAAC?.soulShieldCap || 150;
            const prev = r.soulShield || 0;
            r.soulShield = Math.min(cap, prev + Math.round(amount));
            return r.soulShield - prev;
        }

        grantArtifact(id, opts = {}) {
            const r = this.run;
            if (!r) return false;
            this.ensureRunState(r);
            const activeDef = this.ID.activeById(id);
            if (activeDef) {
                const oldId = r.activeItem;
                r.activeItem = id;
                r.activeCharges = activeDef.charges;
                if (oldId && opts.dropOldAt) {
                    this.spawnPedestal(opts.dropOldAt.clone().add(new THREE.Vector3(1.5, 0, 0)), oldId, 'free');
                }
                this._checkTransformations(r);
                BO.Sound?.playPowerUp?.();
                BO.Events.emit('hud:banner', {
                    title: `${activeDef.icon} ${activeDef.name.toUpperCase()}`,
                    sub: activeDef.desc,
                    color: activeDef.color
                });
                return true;
            }

            const def = this.ID.passiveById(id);
            if (!def) return false;
            if (!r.artifacts.includes(id)) r.artifacts.push(id);
            if (def.fx?.holyMantle) r.holyMantleReady = true;
            if (def.fx?.grantLives) r.livesLeft += def.fx.grantLives;
            if (def.fx?.soulShieldOnPickup) this.addSoulShield(def.fx.soulShieldOnPickup);
            if (def.fx?.dealChanceAdd) r.angelChance = BO.Math.clamp(r.angelChance + def.fx.dealChanceAdd * 0.5, 0, 1);

            this.M?.recomputeStats?.();
            if (def.fx?.fullHealOnPickup && this.P) this.P.hp = this.P.maxHp;

            this._rebuildOrbitalsAndFamiliars();
            this._checkTransformations(r);
            BO.RPGUnlocks?.record?.(BO.RPGProfile.data, 'artifactsCollected', 1);
            BO.Sound?.playPaPChime?.();
            BO.Events.emit('hud:banner', {
                title: `${def.icon} ${def.name.toUpperCase()}`,
                sub: def.desc,
                color: def.color
            });
            return true;
        }

        /* ======================================================================
           Active Items (BO.RPGItems.useActive() -> KeyG / KeyC)
        ====================================================================== */

        useActive() {
            const M = this.M;
            const r = this.run;
            const P = this.P;
            if (!M?.active || !r || !P?.alive || M.state === 'transition' || M.state === 'ended') return false;
            this.ensureRunState(r);
            if (!r.activeItem) {
                BO.Events.emit('hud:toast', { text: 'NO ACTIVE ARTIFACT EQUIPPED', color: '#94a3b8' });
                return false;
            }
            const def = this.ID.activeById(r.activeItem);
            if (!def) return false;
            if (r.activeCharges < def.charges) {
                BO.Sound?.playEmptyClick?.();
                BO.Events.emit('hud:toast', { text: `${def.name.toUpperCase()} NEEDS ${def.charges - r.activeCharges} MORE CHARGE`, color: '#94a3b8' });
                return false;
            }

            if (def.id === 'the_d6') {
                const unclaimed = this.pedestals.filter((p) => !p.claimed);
                if (!unclaimed.length) {
                    BO.Events.emit('hud:toast', { text: 'THE D6 — NO PEDESTALS IN THIS ROOM TO REROLL', color: '#94a3b8' });
                    return false;
                }
                r.activeCharges = 0;
                this.rerollPedestals();
                BO.Sound?.playMysteryBoxJingle?.();
                BO.Events.emit('hud:toast', { text: '🎲 THE D6 REROLLED ALL ROOM PEDESTALS!', color: def.color });
                return true;
            }

            r.activeCharges = 0;
            const pos = P.pos.clone();
            const f = r.floor || 1;
            const roomDmg = (220 + f * 26) * (M.stats?.abilityPower || 1);

            switch (def.id) {
                case 'necronomicon': {
                    BO.FX?.spawnExplosion?.(pos.clone().add(UP), 10, 0x7f1d1d);
                    BO.Sound?.playExplosion?.(1.0);
                    P.cameraShake = Math.max(P.cameraShake, 0.08);
                    for (const z of M.enemies) {
                        if (!M.isAlive(z)) continue;
                        M.dealDamage(z, roomDmg, { source: 'ability', element: 'burn' });
                    }
                    BO.Events.emit('hud:toast', { text: '📕 NECRONOMICON — DARKNESS DEVOURS THE ROOM!', color: def.color });
                    break;
                }
                case 'book_of_shadows': {
                    P.invulnTimer = Math.max(P.invulnTimer, 6.0);
                    BO.FX?.spawnParticles?.(pos.clone().add(UP), 24, 0x38bdf8, 4, -1, 0.8, 1.3);
                    BO.Sound?.playPerkBuy?.();
                    BO.Events.emit('hud:toast', { text: '🛡 BOOK OF SHADOWS — 6S INVULNERABILITY!', color: def.color });
                    break;
                }
                case 'box_of_friends': {
                    r.tempFloorBuffs.familiarMult = (r.tempFloorBuffs.familiarMult || 1) * 2;
                    this._rebuildOrbitalsAndFamiliars();
                    BO.FX?.spawnParticles?.(pos.clone().add(UP), 20, 0xf472b6, 3.5, 1, 0.6, 1.2);
                    BO.Sound?.playPowerUp?.();
                    BO.Events.emit('hud:toast', { text: '🎁 BOX OF FRIENDS — FAMILIARS & ORBITALS DOUBLED!', color: def.color });
                    break;
                }
                case 'stopwatch': {
                    for (const z of M.enemies) {
                        if (!M.isAlive(z)) continue;
                        z.slowTimer = Math.max(z.slowTimer || 0, 8.0);
                        M.applyStatus(z, 'chill', { durMult: 1.6 });
                    }
                    BO.Sound?.playFlashbang?.(1, 0.5);
                    BO.Events.emit('hud:toast', { text: '⏱ STOPWATCH — ENEMIES SLOWED 60% FOR 8S!', color: def.color });
                    break;
                }
                case 'soul_battery': {
                    const gained = this.addSoulShield(40);
                    BO.FX?.spawnParticles?.(pos.clone().add(UP), 18, 0x60a5fa, 3.2, -2, 0.7, 1.2);
                    BO.Sound?.playPowerUp?.();
                    BO.Events.emit('hud:toast', { text: `🔋 SOUL BATTERY — +${gained || 40} SOUL SHIELD`, color: def.color });
                    break;
                }
                case 'tammys_head': {
                    const mods = this.shotModifiers();
                    const origin = (M.camera || BO.App.worldCamera).position.clone();
                    const baseDmg = (P.activeWeapon?.stats?.damage || 45) * mods.damageMult * 1.4;
                    const col = mods.tracerColor || 0xcbd5e1;
                    for (let i = 0; i < 10; i++) {
                        const ang = (i / 10) * Math.PI * 2;
                        const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
                        const end = origin.clone().addScaledVector(dir, 28);
                        BO.FX?.spawnTracer?.(origin.clone().add(new THREE.Vector3(0, -0.15, 0)), end, col, Math.max(0.035, mods.tracerWidth), 0.18);
                        for (const z of M.enemies) {
                            if (!M.isAlive(z)) continue;
                            const to = z.pos.clone().sub(pos);
                            const t = to.x * dir.x + to.z * dir.z;
                            if (t > 0 && t < 28) {
                                const perp = Math.abs(to.x * (-dir.z) + to.z * dir.x);
                                if (perp <= z.radius + 0.75) {
                                    M.dealDamage(z, baseDmg, { source: 'ability', dir });
                                }
                            }
                        }
                    }
                    BO.Sound?.playGunshot?.('shotgun', false, true, 1.0);
                    BO.Events.emit('hud:toast', { text: "🐱 TAMMY'S HEAD — 10-WAY RADIAL BURST!", color: def.color });
                    break;
                }
                case 'teleport_scroll': {
                    this._blastAt(pos, 5.5, roomDmg * 0.7, 0xa855f7);
                    const safe = this._findSafestSpot();
                    P.pos.set(safe.x, safe.y, safe.z);
                    P.vel.set(0, 0, 0);
                    P.invulnTimer = Math.max(P.invulnTimer, 1.5);
                    this._blastAt(safe, 5.5, roomDmg * 0.7, 0xa855f7);
                    BO.Sound?.playParkour?.('vault');
                    BO.Events.emit('hud:toast', { text: '🌀 TELEPORT SCROLL — BLINK BLAST!', color: def.color });
                    break;
                }
                case 'midas_touch': {
                    for (const z of M.enemiesInRadius(pos, 22)) {
                        z.stunTimer = Math.max(z.stunTimer || 0, 2.5);
                        if (z.rpg) z.rpg.gilded = true;
                        BO.FX?.spawnParticles?.(z.pos.clone().add(UP), 10, 0xfbbf24, 3, 2, 0.6, 1.1);
                    }
                    BO.Sound?.playLootChime?.();
                    BO.Events.emit('hud:toast', { text: '✋ MIDAS TOUCH — ENEMIES GILDED!', color: def.color });
                    break;
                }
                case 'turret_deployer': {
                    this._spawnTurret(pos.clone().add(new THREE.Vector3(0, 0, 0)));
                    BO.Sound?.playTurretPlace?.();
                    BO.Events.emit('hud:toast', { text: '🔫 TURRET DEPLOYED FOR THIS FLOOR!', color: def.color });
                    break;
                }
                case 'blood_rights': {
                    const cost = Math.min(15, Math.max(0, P.hp - 1));
                    P.hp = Math.max(1, P.hp - cost);
                    this._blastAt(pos, 26, roomDmg * 1.25, 0xe11d48);
                    BO.Sound?.playExplosion?.(0.9);
                    BO.Events.emit('hud:toast', { text: '🗡 BLOOD RIGHTS — CRIMSON NOVA!', color: def.color });
                    break;
                }
                case 'chaos_orb': {
                    const pool = ['shield', 'lightning', 'freeze', 'coins', 'blast'];
                    const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
                    const b = pool[Math.floor(Math.random() * pool.length)];
                    for (const fxKind of [a, b]) {
                        if (fxKind === 'shield') this.addSoulShield(25);
                        else if (fxKind === 'lightning') {
                            for (const z of M.nearestEnemies(pos, 20, 4)) {
                                BO.FX?.spawnTracer?.(pos.clone().add(UP), z.pos.clone().add(UP), 0x38bdf8, 0.05, 0.2);
                                M.dealDamage(z, roomDmg * 0.65, { source: 'ability', element: 'shock' });
                            }
                        } else if (fxKind === 'freeze') {
                            for (const z of M.enemiesInRadius(pos, 18)) z.frozenTimer = Math.max(z.frozenTimer || 0, 3.0);
                        } else if (fxKind === 'coins') {
                            M._dropGold(pos, 20 + f * 3);
                        } else {
                            this._blastAt(pos, 10, roomDmg * 0.85, 0xd946ef);
                        }
                    }
                    BO.Sound?.playPaPChime?.();
                    BO.Events.emit('hud:toast', { text: '🔮 CHAOS ORB — SURGE UNLEASHED!', color: def.color });
                    break;
                }
                case 'prayer_card': {
                    r.permPillBuffs.maxHpAdd = (r.permPillBuffs.maxHpAdd || 0) + 15;
                    M.recomputeStats();
                    M.heal(25);
                    BO.FX?.spawnParticles?.(pos.clone().add(UP), 22, 0xfef08a, 3.5, -2, 0.8, 1.3);
                    BO.Sound?.playPerkBuy?.();
                    BO.Events.emit('hud:toast', { text: '🙏 PRAYER CARD — +15 MAX HP & +25 HP!', color: def.color });
                    break;
                }
            }
            return true;
        }

        /* ======================================================================
           Pocket Slot: Mystery Pills & Tarot Cards (BO.RPGItems.usePocket() -> KeyT)
        ====================================================================== */

        usePocket() {
            const M = this.M;
            const r = this.run;
            const P = this.P;
            if (!M?.active || !r || !P?.alive || M.state === 'transition' || M.state === 'ended') return false;
            this.ensureRunState(r);
            const pk = r.pocket;
            if (!pk) {
                BO.Events.emit('hud:toast', { text: 'POCKET SLOT EMPTY', color: '#94a3b8' });
                return false;
            }
            r.pocket = null;
            if (pk.kind === 'pill') return this._consumePill(pk);
            if (pk.kind === 'card') return this._consumeCard(pk);
            return false;
        }

        _consumePill(pk) {
            const r = this.run;
            const P = this.P;
            const M = this.M;
            const entry = r.pillMap[String(pk.appearanceIdx)];
            const pillId = entry ? entry.id : pk.id;
            if (entry) entry.identified = true;
            const def = this.ID.pillById(pillId);
            if (!def) return false;

            switch (pillId) {
                case 'health_up':
                    r.permPillBuffs.maxHpAdd += 20;
                    M.recomputeStats();
                    M.heal(20);
                    break;
                case 'health_down':
                    r.permPillBuffs.maxHpAdd = Math.max(-40, r.permPillBuffs.maxHpAdd - 12);
                    M.recomputeStats();
                    break;
                case 'tears_up':
                    r.permPillBuffs.fireRateMult *= 1.15;
                    break;
                case 'damage_up':
                    r.permPillBuffs.dmgMult *= 1.12;
                    break;
                case 'speed_up':
                    r.permPillBuffs.moveSpeedMult *= 1.12;
                    break;
                case 'full_health':
                    P.hp = P.maxHp;
                    break;
                case 'bad_trip':
                    if (P.hp <= 20) M.heal(25);
                    else P.hp = Math.max(1, P.hp - 15);
                    break;
                case 'balls_of_steel':
                    this.addSoulShield(35);
                    break;
                case 'bombs_are_key': {
                    const tmp = r.bombs;
                    r.bombs = r.keys;
                    r.keys = tmp;
                    break;
                }
                case 'telepills': {
                    const safe = this._findSafestSpot();
                    P.pos.set(safe.x, safe.y, safe.z);
                    P.vel.set(0, 0, 0);
                    r.permPillBuffs.reloadSpeedMult *= 1.1;
                    break;
                }
            }
            BO.Sound?.playPerkBuy?.();
            BO.Events.emit('hud:banner', { title: `PILL: ${def.name.toUpperCase()}`, sub: def.desc, color: def.positive ? '#4ade80' : '#f87171' });
            return true;
        }

        _consumeCard(pk) {
            const r = this.run;
            const P = this.P;
            const M = this.M;
            const def = this.ID.cardById(pk.id);
            if (!def) return false;
            const pos = P.pos.clone();
            const roomDmg = (240 + (r.floor || 1) * 28) * (M.stats?.abilityPower || 1);

            switch (def.id) {
                case 'the_fool': {
                    const sp = M.layout?.spawn || { x: 0, y: 0, z: 10 };
                    P.pos.set(sp.x, sp.y, sp.z);
                    P.vel.set(0, 0, 0);
                    P.invulnTimer = Math.max(P.invulnTimer, 2.5);
                    if (P.activeWeapon?.stats) P.activeWeapon.mag = P.activeWeapon.stats.magSize;
                    break;
                }
                case 'the_emperor':
                    r.tempFloorBuffs.emperorTimer = 20;
                    break;
                case 'the_sun':
                    P.hp = P.maxHp;
                    this._blastAt(pos, 30, roomDmg * 0.9, 0xfde047);
                    break;
                case 'the_devil':
                    r.tempFloorBuffs.devilCardTimer = 20;
                    break;
                case 'death':
                    this._blastAt(pos, 32, roomDmg * 1.25, 0x94a3b8);
                    break;
                case 'wheel_of_fortune':
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(-1, 0, -1.2)), 'heart_red');
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(1, 0, -1.2)), 'key');
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(0, 0, -1.8)), 'bomb_pickup');
                    M._dropGold(pos.clone().add(new THREE.Vector3(0, 0, -1)), 25);
                    break;
                case 'the_chariot':
                    r.tempFloorBuffs.chariotTimer = 8.0;
                    P.invulnTimer = Math.max(P.invulnTimer, 8.0);
                    break;
                case 'the_tower':
                    for (let i = 0; i < 4; i++) {
                        const a = (i / 4) * Math.PI * 2 + 0.4;
                        this._spawnLiveBomb(pos.clone().add(new THREE.Vector3(Math.cos(a) * 3.2, 0.3, Math.sin(a) * 3.2)), true);
                    }
                    break;
                case 'the_hermit':
                    r.gold += 45;
                    r.keys += 1;
                    r.bombs += 1;
                    break;
                case 'strength':
                    r.tempFloorBuffs.dmgMult *= 1.4;
                    r.tempFloorBuffs.maxHpAdd += 30;
                    M.recomputeStats();
                    M.heal(30);
                    break;
                case 'justice':
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(-1.2, 0, -1.4)), 'heart_red');
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(0, 0, -1.4)), 'key');
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(1.2, 0, -1.4)), 'bomb_pickup');
                    M._dropGold(pos, 15);
                    break;
                case 'judgement': {
                    const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
                    const spot = pos.clone().addScaledVector(fwd, 2.5);
                    const roll = this.ID.rollArtifact({ pool: 'treasure', chaos: this.has('chaos_relic'), ownedPassives: new Set(r.artifacts), ownedActive: r.activeItem });
                    this.spawnPedestal(spot, roll.def.id, 'free');
                    break;
                }
            }
            BO.Sound?.playCardDraw?.();
            BO.Events.emit('hud:banner', { title: `${def.numeral} - ${def.name.toUpperCase()}`, sub: def.desc, color: def.color });
            return true;
        }

        /* ======================================================================
           Floor Bombs (BO.RPGItems.dropBomb() -> KeyB) & Destructibles
        ====================================================================== */

        dropBomb() {
            const M = this.M;
            const r = this.run;
            const P = this.P;
            if (!M?.active || !r || !P?.alive || M.state === 'transition' || M.state === 'ended') return false;
            this.ensureRunState(r);
            if (r.bombs <= 0) {
                BO.Sound?.playEmptyClick?.();
                BO.Events.emit('hud:toast', { text: 'NO BOMBS LEFT', color: '#94a3b8' });
                return false;
            }
            r.bombs--;
            const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
            const spawnPos = P.pos.clone().addScaledVector(fwd, 0.9);
            spawnPos.y = BO.World.getGroundHeight(spawnPos.x, spawnPos.z, P.pos.y + 0.5) + 0.28;
            this._spawnLiveBomb(spawnPos, false);
            BO.Sound?.playGrenadeBounce?.(1, 3);
            return true;
        }

        _spawnLiveBomb(pos, freeFromTower = false) {
            if (!BO.World?.scene) return;
            const g = new THREE.Group();
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.28, 12, 10),
                new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 })
            );
            const fuse = new THREE.Mesh(
                new THREE.SphereGeometry(0.11, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xef4444 })
            );
            fuse.position.y = 0.3;
            g.add(sphere, fuse);
            g.position.copy(pos);
            BO.World.scene.add(g);
            this.bombs.push({
                group: g,
                sphere,
                fuse,
                pos: pos.clone(),
                t: (this.D.ISAAC?.bombFuse || 1.55) * (freeFromTower ? 0.9 : 1),
                freeFromTower
            });
        }

        _detonateBomb(b) {
            const M = this.M;
            const I = this.D.ISAAC || {};
            const radius = I.bombRadius || 4.8;
            const dmg = (I.bombDamage || 185) * (1 + (this.run?.floor || 1) * 0.14);
            BO.FX?.spawnExplosion?.(b.pos.clone().add(new THREE.Vector3(0, 0.3, 0)), radius, 0xf97316);
            BO.Sound?.playExplosion?.(0.85);
            if (this.P) this.P.cameraShake = Math.max(this.P.cameraShake, 0.06);
            for (const z of M.enemiesInRadius(b.pos, radius)) {
                const d = BO.Math.dist2D(z.pos.x, z.pos.z, b.pos.x, b.pos.z);
                M.dealDamage(z, dmg * (1 - (d / radius) * 0.4), { source: 'ability', element: 'burn' });
            }
            this.onExplosionAt(b.pos, radius, dmg);
            disposeObject3D(b.group);
        }

        onExplosionAt(pos, radius, damage) {
            for (let i = this.rocks.length - 1; i >= 0; i--) {
                const rk = this.rocks[i];
                if (rk.dead) continue;
                if (BO.Math.dist2D(rk.pos.x, rk.pos.z, pos.x, pos.z) <= radius + 0.8) {
                    this._crackRock(rk);
                }
            }
        }

        damageProp(rk, dmg) {
            if (!rk || rk.dead) return;
            rk.hp -= dmg;
            if (rk.type === 'urn' && rk.hp <= 0) {
                this._crackRock(rk);
            } else if (rk.type === 'tinted' && (this.shotModifiers().explosive || rk.hp <= -999)) {
                this._crackRock(rk);
            }
        }

        _crackRock(rk) {
            if (!rk || rk.dead) return;
            rk.dead = true;
            if (rk.entity) rk.entity.alive = false;
            const pos = rk.pos.clone();
            if (rk.type === 'tinted') {
                BO.FX?.spawnParticles?.(pos.clone().add(UP), 24, 0x38bdf8, 5, 8, 0.7, 1.4);
                BO.Sound?.playWallBreak?.();
                BO.Events.emit('hud:toast', { text: '💎 TINTED ROCK CRACKED!', color: '#38bdf8' });
                this.spawnPickup(pos.clone().add(new THREE.Vector3(-0.6, 0, 0)), 'heart_soul');
                this.spawnPickup(pos.clone().add(new THREE.Vector3(0.6, 0, 0)), Math.random() < 0.5 ? 'key' : 'battery');
                if (Math.random() < 0.28) {
                    const roll = this.ID.rollArtifact({ pool: 'treasure', chaos: this.has('chaos_relic'), ownedPassives: new Set(this.run.artifacts), ownedActive: this.run.activeItem });
                    this.spawnPedestal(pos.clone().add(new THREE.Vector3(0, 0, 1.1)), roll.def.id, 'free');
                }
            } else {
                BO.FX?.spawnParticles?.(pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 14, 0xb45309, 4, 8, 0.5, 1.0);
                BO.Sound?.playWallHit?.();
                const roll = Math.random();
                if (roll < 0.35) this.M._dropGold(pos, 6 + (this.run?.floor || 1) * 2);
                else if (roll < 0.55) this.spawnPickup(pos, 'heart_red');
                else if (roll < 0.70) this.spawnPickup(pos, 'key');
                else if (roll < 0.85) this.spawnPickup(pos, 'bomb_pickup');
                else if (roll < 0.94) this.spawnPickup(pos, 'pill');
                else this.spawnPickup(pos, 'card');
            }
            disposeObject3D(rk.group);
            const idx = this.rocks.indexOf(rk);
            if (idx >= 0) this.rocks.splice(idx, 1);
        }

        getPropHitMeshes() {
            const out = [];
            for (const rk of this.rocks) {
                if (!rk.dead && rk.hitMesh) out.push(rk.hitMesh);
            }
            return out;
        }

        /* ======================================================================
           Combat & Floor Hooks (Killed, Hit, Damaged, Cleared, Reset)
        ====================================================================== */

        onPlayerDamaged(amt, attackerPos, attackerEntity) {
            const r = this.run;
            const P = this.P;
            if (!r || !P || amt <= 0) return amt;
            this.ensureRunState(r);
            if (P.invulnTimer > 0) return 0;

            // Holy Mantle negates 1st hit every floor
            if (r.holyMantleReady) {
                r.holyMantleReady = false;
                P.invulnTimer = Math.max(P.invulnTimer, 1.25);
                BO.FX?.spawnParticles?.(P.pos.clone().add(UP), 24, 0xbae6fd, 5, 0, 0.6, 1.3);
                BO.Sound?.playPowerUp?.();
                BO.Events.emit('hud:toast', { text: '🛡 HOLY MANTLE NEGATED THE HIT!', color: '#bae6fd' });
                return 0;
            }

            // The Wafer caps single hit to 25% of Max HP
            if (this.has('the_wafer')) {
                amt = Math.min(amt, P.maxHp * 0.25);
            }

            // Goliath Transformation DR
            if (this.hasTransformation('goliath')) {
                amt *= 0.85;
            }

            // Blue Soul Shield absorbs damage before Red HP
            if (r.soulShield > 0) {
                const absorbed = Math.min(r.soulShield, amt);
                r.soulShield -= absorbed;
                amt -= absorbed;
                if (absorbed >= 1 && BO.RPGUI) {
                    BO.RPGUI.floatText(P.pos, `-${Math.round(absorbed)} SHIELD`, '#60a5fa', 13, 1.0);
                }
            }

            if (amt > 0.5) {
                r.tookRedHpDamageOnFloor = true;
            }
            return amt;
        }

        onGunHit(z, dealt, hitbox, weapon, impactPos, dir, secondary = false) {
            const r = this.run;
            const M = this.M;
            if (!r || !M || secondary || !z || z.rpgProp) return;
            const mods = this.shotModifiers();

            // Dead Eye streak
            if (this.has('dead_eye')) {
                r.deadEyeStreak = Math.min(8, (r.deadEyeStreak || 0) + 1);
            }

            const hitPt = (impactPos ? impactPos.clone() : z.pos.clone().add(UP));

            // Pyromancer burn chance
            if (this.hasTransformation('pyro') && M.isAlive(z) && Math.random() < 0.25) {
                M.applyStatus(z, 'burn');
            }

            // Ipecac explosive acid round
            if (mods.explosive && dealt > 0) {
                const rad = mods.explosiveRadius || 3.4;
                const blastDmg = Math.max(20, dealt * 0.65) * (this.hasTransformation('pyro') ? 1.25 : 1);
                BO.FX?.spawnExplosion?.(hitPt, rad * 0.65, 0x84cc16);
                for (const o of M.enemiesInRadius(hitPt, rad)) {
                    if (o === z) continue;
                    M.dealDamage(o, blastDmg, { source: 'ability', element: 'burn' });
                    if (M.isAlive(o)) M.applyStatus(o, 'burn');
                }
                this.onExplosionAt(hitPt, rad, blastDmg);
            }

            // Jacob's Ladder chain lightning
            if (mods.chainLightning && dealt > 0) {
                const arcTargets = M.nearestEnemies(z.pos, 7.5, 2, new Set([z]));
                for (const t of arcTargets) {
                    BO.FX?.spawnTracer?.(hitPt, t.pos.clone().add(UP), 0x38bdf8, 0.032, 0.14);
                    M.dealDamage(t, Math.max(12, dealt * 0.45), { source: 'conduct', element: 'shock' });
                    if (M.isAlive(t)) M.applyStatus(t, 'shock');
                }
            }

            // Parasite / Cricket's Body split shrapnel
            if (mods.splitCount > 0 && dealt > 0) {
                const splitTargets = M.nearestEnemies(z.pos, 7.0, mods.splitCount, new Set([z]));
                for (const t of splitTargets) {
                    BO.FX?.spawnTracer?.(hitPt, t.pos.clone().add(UP), mods.tracerColor || 0xfb7185, 0.025, 0.12);
                    M.dealDamage(t, Math.max(10, dealt * 0.4), { source: 'conduct' });
                }
            }

            // Tech X plasma ring pulse
            if (mods.techRing && dealt > 0) {
                BO.FX?.spawnParticles?.(hitPt, 8, 0x22d3ee, 4.5, 0, 0.35, 1.1);
                for (const o of M.enemiesInRadius(hitPt, 2.8)) {
                    if (o !== z) M.dealDamage(o, Math.max(8, dealt * 0.3), { source: 'conduct', element: 'shock' });
                }
            }
        }

        onEnemyKilled(enemy, pos) {
            const r = this.run;
            const M = this.M;
            if (!r || !M || !pos) return;
            this.ensureRunState(r);

            // Vampiric Fang healing on kill + 5-kill streak
            if (this.has('vampiric_fang')) {
                r.vampiricKills = (r.vampiricKills || 0) + 1;
                let heal = 3;
                if (r.vampiricKills % 5 === 0) heal += 8;
                M.heal(heal);
            }

            // Midas Crown / Midas Touch bonus gold
            if (this.has('midas_crown') && Math.random() < 0.35) {
                M._dropGold(pos, 5 + Math.floor(r.floor * 0.8));
            }
            if (enemy?.rpg?.gilded) {
                M._dropGold(pos, (enemy.rpg.arch?.gold || 5) * 2);
            }

            // Dynamic 3D room pickup drops (Isaac room economy)
            const dropRoll = Math.random();
            if (dropRoll < 0.24) {
                const w = Math.random();
                if (w < 0.30) this.spawnPickup(pos, 'heart_red');
                else if (w < 0.46) this.spawnPickup(pos, 'key');
                else if (w < 0.62) this.spawnPickup(pos, 'bomb_pickup');
                else if (w < 0.74) this.spawnPickup(pos, 'heart_soul');
                else if (w < 0.84) this.spawnPickup(pos, 'battery');
                else if (w < 0.93) this.spawnPickup(pos, 'pill');
                else this.spawnPickup(pos, 'card');
            }
        }

        onFloorCleared() {
            const r = this.run;
            const M = this.M;
            if (!r || !M) return;
            this.ensureRunState(r);

            // Recharge active item by +1 pip
            if (r.activeItem) {
                const def = this.ID.activeById(r.activeItem);
                if (def && r.activeCharges < def.charges) {
                    r.activeCharges = Math.min(def.charges, r.activeCharges + 1);
                }
            }

            // Seraphim floor-clear Soul Shield
            if (this.hasTransformation('seraph')) {
                this.addSoulShield(15);
            }

            // Room clear pickup drop
            const center = M.layout?.center || { x: 0, z: 0 };
            const clearPos = new THREE.Vector3(center.x + (Math.random() - 0.5) * 3, 0, center.z + (Math.random() - 0.5) * 3);
            const dropTypes = ['heart_red', 'key', 'bomb_pickup', 'battery', 'pill', 'card', 'heart_soul'];
            if (Math.random() < 0.72) {
                this.spawnPickup(clearPos, dropTypes[Math.floor(Math.random() * dropTypes.length)]);
            }

            // Devil Deal vs Angel Sanctum Pedestal spawn!
            const isBoss = r.roomType === 'boss';
            const goatHead = this.has('goat_head');
            const dealRoll = isBoss || goatHead || (r.floor >= 2 && Math.random() < (0.28 + (this.has('pentagram') ? 0.25 : 0) + (!r.tookRedHpDamageOnFloor ? 0.25 : 0)));
            if (dealRoll) {
                const preferAngel = !r.tookRedHpDamageOnFloor && (r.devilDeals === 0 || Math.random() < r.angelChance);
                const spot = new THREE.Vector3(center.x - 3.6, 0, center.z - 1.5);
                const chaos = this.has('chaos_relic');
                if (preferAngel) {
                    const roll = this.ID.rollArtifact({ pool: 'angel', chaos, ownedPassives: new Set(r.artifacts), ownedActive: r.activeItem });
                    this.spawnPedestal(spot, roll.def.id, 'angel');
                    BO.Events.emit('hud:toast', { text: '👼 AN ANGEL SANCTUM PEDESTAL HAS APPEARED!', color: '#bae6fd' });
                } else {
                    const roll = this.ID.rollArtifact({ pool: 'devil', chaos, ownedPassives: new Set(r.artifacts), ownedActive: r.activeItem });
                    this.spawnPedestal(spot, roll.def.id, 'devil');
                    BO.Events.emit('hud:toast', { text: '😈 A DEVIL DEAL PEDESTAL HAS APPEARED!', color: '#ef4444' });
                }
            }
        }

        resetFloor() {
            this.clearVisuals();
            const r = this.run;
            if (!r) return;
            this.ensureRunState(r);
            r.tookRedHpDamageOnFloor = false;
            r.holyMantleReady = this.has('holy_mantle');
            r.tempFloorBuffs = { dmgMult: 1, maxHpAdd: 0, emperorTimer: 0, devilCardTimer: 0, chariotTimer: 0, familiarMult: 1 };
            r.deadEyeStreak = 0;
            this._rebuildOrbitalsAndFamiliars();
        }

        clearVisuals() {
            for (const p of this.pedestals) disposeObject3D(p.group);
            for (const pk of this.pickups) disposeObject3D(pk.group);
            for (const b of this.bombs) disposeObject3D(b.group);
            for (const rk of this.rocks) disposeObject3D(rk.group);
            for (const ch of this.lockedChests) disposeObject3D(ch.group);
            for (const orb of this.orbitals) disposeObject3D(orb.group);
            for (const fam of this.familiars) disposeObject3D(fam.group);
            for (const tur of this.turrets) disposeObject3D(tur.group);
            this.pedestals = [];
            this.pickups = [];
            this.bombs = [];
            this.rocks = [];
            this.lockedChests = [];
            this.orbitals = [];
            this.familiars = [];
            this.turrets = [];
            this._familiarSignature = '';
        }

        /* ======================================================================
           Room Population: Pedestals, Shop Items, Tinted Rocks, Urns, Chests
        ====================================================================== */

        populateFloor(mode) {
            const r = mode.run;
            const L = mode.layout;
            if (!r || !L) return;
            this.ensureRunState(r);
            const chaos = this.has('chaos_relic');
            const ownedPassives = new Set(r.artifacts);

            // Treasure room -> Artifact Pedestal + optional Locked Reliquary
            if (r.roomType === 'treasure') {
                const roll = this.ID.rollArtifact({ pool: 'treasure', chaos, ownedPassives, ownedActive: r.activeItem });
                this.spawnPedestal(new THREE.Vector3(L.center.x + 2.6, 0, L.center.z - 2.0), roll.def.id, 'treasure');
                this.spawnLockedChest(new THREE.Vector3(L.center.x - 2.6, 0, L.center.z - 2.0));
            }

            // Shop room -> 4 physical 3D Shop Pedestals in front of counter
            if (r.roomType === 'shop') {
                const prices = this.D.ISAAC?.shopPrices || {};
                const artRoll = this.ID.rollArtifact({ pool: 'shop', chaos, ownedPassives, ownedActive: r.activeItem });
                const shopOffers = [
                    { kind: 'pickup', pickupType: 'heart_soul', name: 'Soul Shield Heart', price: prices.heart_soul || 26, color: 0x60a5fa },
                    { kind: 'pickup', pickupType: 'key', name: 'Brass Key', price: prices.key || 16, color: 0xfde047 },
                    { kind: 'pickup', pickupType: 'battery', name: 'Energy Battery', price: prices.battery || 28, color: 0x4ade80 },
                    { kind: 'artifact', itemId: artRoll.def.id, price: prices.artifact || 65, color: artRoll.def.hex }
                ];
                shopOffers.forEach((offer, i) => {
                    const x = L.center.x + (i - 1.5) * 2.4;
                    const z = L.center.z + 2.5;
                    if (offer.kind === 'artifact') {
                        this.spawnPedestal(new THREE.Vector3(x, 0, z), offer.itemId, 'shop', offer.price);
                    } else {
                        this.spawnPedestal(new THREE.Vector3(x, 0, z), null, 'shop_pickup', offer.price, offer);
                    }
                });
            }

            // Combat / Elite / Hazard / Treasure / Ambush -> Breakable Urns, Tinted Rocks, Locked Chest
            const roomDef = this.D.ROOMS[r.roomType];
            if (!roomDef?.quiet) {
                const urnCount = 2 + Math.floor(Math.random() * 3);
                for (let i = 0; i < urnCount; i++) {
                    const p = this._pickRoomSpot(L, 3.2);
                    if (p) this._spawnUrn(p);
                }
                const tintedCount = Math.random() < 0.65 ? 1 : 0;
                for (let i = 0; i < tintedCount; i++) {
                    const p = this._pickRoomSpot(L, 3.8);
                    if (p) this._spawnTintedRock(p);
                }
                if (r.roomType !== 'treasure' && Math.random() < 0.35) {
                    const p = this._pickRoomSpot(L, 4.0);
                    if (p) this.spawnLockedChest(p);
                }
            }
            this._rebuildOrbitalsAndFamiliars();
        }

        _pickRoomSpot(L, minEdgePad = 3.2) {
            for (let t = 0; t < 20; t++) {
                const x = (Math.random() * 2 - 1) * (L.hw - minEdgePad);
                const z = (Math.random() * 2 - 1) * (L.hl - minEdgePad - 2);
                if (Math.hypot(x - L.spawn.x, z - L.spawn.z) < 5.0) continue;
                if (Math.hypot(x - L.center.x, z - L.center.z) < 3.5) continue;
                return new THREE.Vector3(x, 0, z);
            }
            return null;
        }

        _spawnUrn(pos) {
            if (!BO.World?.scene) return;
            const g = new THREE.Group();
            const mat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85, metalness: 0.1 });
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.8, 10), mat);
            body.position.y = 0.4;
            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 6, 12), mat);
            rim.rotation.x = Math.PI / 2;
            rim.position.y = 0.8;
            g.add(body, rim);
            pos.y = BO.World.getGroundHeight(pos.x, pos.z, 1);
            g.position.copy(pos);
            BO.World.scene.add(g);
            const rk = { type: 'urn', group: g, hitMesh: body, pos: pos.clone(), hp: 25, dead: false };
            const ent = { alive: true, hp: 25, maxHp: 25, pos: pos.clone(), noBlood: true, spec: {}, rpgProp: rk };
            rk.entity = ent;
            body.userData = { entity: ent, hitbox: 'torso' };
            this.rocks.push(rk);
        }

        _spawnTintedRock(pos) {
            if (!BO.World?.scene) return;
            const g = new THREE.Group();
            const stone = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.62, 0),
                new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, metalness: 0.15, emissive: 0x0ea5e9, emissiveIntensity: 0.18 })
            );
            stone.position.y = 0.42;
            const crack1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.06), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
            crack1.position.set(0, 0.78, 0.22);
            crack1.rotation.z = 0.55;
            const crack2 = crack1.clone();
            crack2.rotation.z = -0.55;
            g.add(stone, crack1, crack2);
            pos.y = BO.World.getGroundHeight(pos.x, pos.z, 1);
            g.position.copy(pos);
            BO.World.scene.add(g);
            const rk = { type: 'tinted', group: g, hitMesh: stone, pos: pos.clone(), hp: 9999, dead: false };
            const ent = { alive: true, hp: 9999, maxHp: 9999, pos: pos.clone(), noBlood: true, spec: {}, rpgProp: rk };
            rk.entity = ent;
            stone.userData = { entity: ent, hitbox: 'torso' };
            this.rocks.push(rk);
        }

        spawnLockedChest(pos) {
            if (!BO.World?.scene) return;
            const g = new THREE.Group();
            const base = new THREE.Mesh(
                new THREE.BoxGeometry(1.15, 0.65, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x854d0e, metalness: 0.7, roughness: 0.35 })
            );
            base.position.y = 0.33;
            const lock = new THREE.Mesh(
                new THREE.BoxGeometry(0.24, 0.26, 0.12),
                new THREE.MeshBasicMaterial({ color: 0xfde047 })
            );
            lock.position.set(0, 0.44, 0.43);
            g.add(base, lock);
            pos.y = BO.World.getGroundHeight(pos.x, pos.z, 1);
            g.position.copy(pos);
            BO.World.scene.add(g);
            this.lockedChests.push({ group: g, base, lock, pos: pos.clone(), opened: false });
        }

        /* ======================================================================
           3D Item Pedestals (Treasure, Shop, Devil, Angel)
        ====================================================================== */

        spawnPedestal(pos, itemId, kind = 'treasure', price = 0, shopOffer = null) {
            if (!BO.World?.scene) return null;
            const def = itemId ? this.ID.itemById(itemId) : null;
            const colorHex = shopOffer ? shopOffer.color : (kind === 'devil' ? 0xef4444 : kind === 'angel' ? 0xbae6fd : (def?.hex || 0xfde047));
            const g = new THREE.Group();

            const plinthColor = kind === 'devil' ? 0x1c0d11 : kind === 'angel' ? 0xe2e8f0 : 0x263142;
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.52, 0.68, 0.92, 10),
                new THREE.MeshStandardMaterial({ color: plinthColor, roughness: 0.45, metalness: 0.5 })
            );
            base.position.y = 0.46;

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.58, 0.045, 8, 24),
                new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.94;

            const orbGeo = def && this.ID.activeById(def.id)
                ? new THREE.BoxGeometry(0.42, 0.42, 0.42)
                : new THREE.OctahedronGeometry(0.36, 0);
            const orb = new THREE.Mesh(
                orbGeo,
                new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.85, roughness: 0.2, metalness: 0.3 })
            );
            orb.position.y = 1.48;

            const light = new THREE.PointLight(colorHex, 1.3, 8);
            light.position.y = 1.6;
            g.add(base, ring, orb, light);

            const p = pos.clone();
            p.y = BO.World.getGroundHeight(p.x, p.z, 1);
            g.position.copy(p);
            BO.World.scene.add(g);

            const ped = {
                group: g,
                orb,
                ring,
                pos: p,
                itemId,
                kind, // 'treasure' | 'free' | 'devil' | 'angel' | 'shop' | 'shop_pickup'
                price,
                shopOffer,
                claimed: false
            };
            this.pedestals.push(ped);
            return ped;
        }

        rerollPedestals() {
            const r = this.run;
            if (!r) return;
            const chaos = this.has('chaos_relic');
            const ownedPassives = new Set(r.artifacts);
            for (const ped of this.pedestals) {
                if (ped.claimed || ped.kind === 'shop_pickup') continue;
                const pool = ped.kind === 'devil' ? 'devil' : ped.kind === 'angel' ? 'angel' : ped.kind === 'shop' ? 'shop' : 'treasure';
                const roll = this.ID.rollArtifact({ pool, chaos, ownedPassives, ownedActive: r.activeItem });
                ped.itemId = roll.def.id;
                ped.orb.material.color.setHex(roll.def.hex);
                ped.orb.material.emissive.setHex(roll.def.hex);
                ped.ring.material.color.setHex(roll.def.hex);
                BO.FX?.spawnParticles?.(ped.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 14, roll.def.hex, 3, 2, 0.5, 1.0);
            }
        }

        /* ======================================================================
           3D Room Pickups (Hearts, Soul Hearts, Keys, Bombs, Batteries, Pills, Cards)
        ====================================================================== */

        spawnPickup(pos, type, extra = {}) {
            if (!BO.World?.scene || !pos) return null;
            const g = new THREE.Group();
            let color = 0xfde047;
            let mesh;

            if (type === 'heart_red') {
                color = 0xef4444;
                mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.25 }));
                mesh.scale.set(1.15, 0.9, 0.7);
            } else if (type === 'heart_soul') {
                color = 0x60a5fa;
                mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), new THREE.MeshStandardMaterial({ color, emissive: 0x38bdf8, emissiveIntensity: 0.75, roughness: 0.2 }));
                mesh.scale.set(1.15, 0.9, 0.7);
            } else if (type === 'key') {
                color = 0xfacc15;
                mesh = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.055, 8, 16), new THREE.MeshStandardMaterial({ color, emissive: 0xca8a04, emissiveIntensity: 0.4, metalness: 0.85, roughness: 0.25 }));
            } else if (type === 'bomb_pickup') {
                color = 0xf97316;
                mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0x7c2d12, emissiveIntensity: 0.35, metalness: 0.7, roughness: 0.3 }));
            } else if (type === 'battery') {
                color = 0x4ade80;
                mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.36, 10), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, metalness: 0.4, roughness: 0.3 }));
            } else if (type === 'pill') {
                const appIdx = extra.appearanceIdx ?? Math.floor(Math.random() * this.ID.PILL_APPEARANCES.length);
                const app = this.ID.PILL_APPEARANCES[appIdx];
                color = app.hex;
                extra.appearanceIdx = appIdx;
                mesh = new THREE.Group();
                const halfA = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 10), new THREE.MeshStandardMaterial({ color: app.hex, emissive: app.hex, emissiveIntensity: 0.35 }));
                halfA.position.y = 0.1;
                const halfB = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 10), new THREE.MeshStandardMaterial({ color: app.capHex }));
                halfB.position.y = -0.1;
                mesh.add(halfA, halfB);
                mesh.rotation.z = 0.5;
            } else if (type === 'card') {
                const cardDef = extra.cardId ? this.ID.cardById(extra.cardId) : this.ID.CARDS[Math.floor(Math.random() * this.ID.CARDS.length)];
                extra.cardId = cardDef.id;
                color = new THREE.Color(cardDef.color).getHex();
                mesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.04), new THREE.MeshStandardMaterial({ color: 0x1e1b4b, emissive: color, emissiveIntensity: 0.65, metalness: 0.3 }));
            }

            if (!mesh) return null;
            const halo = new THREE.Mesh(
                new THREE.RingGeometry(0.22, 0.3, 18),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
            );
            halo.rotation.x = -Math.PI / 2;
            halo.position.y = -0.35;
            g.add(mesh, halo);

            const p = pos.clone();
            p.x += (Math.random() - 0.5) * 0.9;
            p.z += (Math.random() - 0.5) * 0.9;
            p.y = BO.World.getGroundHeight(p.x, p.z, p.y + 0.8) + 0.42;
            g.position.copy(p);
            BO.World.scene.add(g);

            const pk = {
                type,
                group: g,
                mesh,
                pos: p,
                baseY: p.y,
                vel: new THREE.Vector3((Math.random() - 0.5) * 2.5, 2.2, (Math.random() - 0.5) * 2.5),
                extra,
                phase: Math.random() * 6.28
            };
            this.pickups.push(pk);
            return pk;
        }

        _collectPickup(pk) {
            const r = this.run;
            const P = this.P;
            const M = this.M;
            if (!r || !P || !M) return false;
            const I = this.D.ISAAC || {};

            if (pk.type === 'heart_red') {
                if (P.hp >= P.maxHp - 0.5) return false;
                M.heal(I.heartHeal || 25);
                BO.RPGUI?.floatText(pk.pos, `+${I.heartHeal || 25} HP`, '#ef4444', 13, 1.1);
                BO.Sound?.playPerkBuy?.();
            } else if (pk.type === 'heart_soul') {
                const cap = I.soulShieldCap || 150;
                if (r.soulShield >= cap) return false;
                const g = this.addSoulShield(I.soulHeartAmount || 25);
                BO.RPGUI?.floatText(pk.pos, `+${g} SOUL SHIELD`, '#60a5fa', 13, 1.2);
                BO.Sound?.playPowerUp?.();
            } else if (pk.type === 'key') {
                r.keys++;
                BO.RPGUI?.floatText(pk.pos, '+1 KEY', '#fde047', 13, 1.1);
                BO.Sound?.playLootChime?.();
            } else if (pk.type === 'bomb_pickup') {
                r.bombs++;
                BO.RPGUI?.floatText(pk.pos, '+1 BOMB', '#f97316', 13, 1.1);
                BO.Sound?.playPoints?.();
            } else if (pk.type === 'battery') {
                const def = r.activeItem ? this.ID.activeById(r.activeItem) : null;
                if (!def || r.activeCharges >= def.charges) return false;
                r.activeCharges = Math.min(def.charges, r.activeCharges + 2);
                BO.RPGUI?.floatText(pk.pos, '+2 CHARGE', '#4ade80', 13, 1.1);
                BO.Sound?.playPowerUp?.();
            } else if (pk.type === 'pill' || pk.type === 'card') {
                const prev = r.pocket;
                if (pk.type === 'pill') {
                    const entry = r.pillMap[String(pk.extra.appearanceIdx)];
                    r.pocket = { kind: 'pill', id: entry?.id || 'health_up', appearanceIdx: pk.extra.appearanceIdx };
                    const label = entry?.identified ? this.ID.pillById(entry.id)?.name : 'Mystery Pill ???';
                    BO.RPGUI?.floatText(pk.pos, label, '#a855f7', 13, 1.4);
                } else {
                    const card = this.ID.cardById(pk.extra.cardId);
                    r.pocket = { kind: 'card', id: pk.extra.cardId };
                    BO.RPGUI?.floatText(pk.pos, `${card?.numeral || ''} ${card?.name || 'Card'}`, card?.color || '#fde047', 13, 1.4);
                }
                if (prev) {
                    const dropPos = pk.pos.clone().add(new THREE.Vector3(1.1, 0, 0.8));
                    this.spawnPickup(dropPos, prev.kind, prev.kind === 'pill' ? { appearanceIdx: prev.appearanceIdx } : { cardId: prev.id });
                }
                BO.Sound?.playCardDraw?.();
            }

            disposeObject3D(pk.group);
            const idx = this.pickups.indexOf(pk);
            if (idx >= 0) this.pickups.splice(idx, 1);
            return true;
        }

        /* ======================================================================
           3D Orbitals, Buddy Familiars, Deployed Turrets
        ====================================================================== */

        _rebuildOrbitalsAndFamiliars() {
            for (const o of this.orbitals) disposeObject3D(o.group);
            for (const f of this.familiars) disposeObject3D(f.group);
            this.orbitals = [];
            this.familiars = [];
            const r = this.run;
            if (!r || !BO.World?.scene) return;
            const mult = r.tempFloorBuffs?.familiarMult || 1;

            const spawnOrbital = (type) => {
                const g = new THREE.Group();
                if (type === 'cube_of_steel') {
                    const box = new THREE.Mesh(
                        new THREE.BoxGeometry(0.55, 0.55, 0.55),
                        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25, emissive: 0x334155, emissiveIntensity: 0.4 })
                    );
                    g.add(box);
                    BO.World.scene.add(g);
                    this.orbitals.push({ type, group: g, radius: 1.85, speed: 2.6, dmg: 22, blocksProj: true, cd: new WeakMap() });
                } else if (type === 'sawblade_halo') {
                    const disc = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.48, 0.48, 0.07, 12),
                        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2, emissive: 0x64748b, emissiveIntensity: 0.3 })
                    );
                    g.add(disc);
                    BO.World.scene.add(g);
                    this.orbitals.push({ type, group: g, radius: 2.25, speed: 4.5, dmg: 28, blocksProj: false, cd: new WeakMap() });
                }
            };

            const spawnFamiliar = (type) => {
                const g = new THREE.Group();
                const col = type === 'seraph_wisp' ? 0xfef08a : type === 'demon_imp' ? 0xf97316 : 0x22d3ee;
                const core = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.24, 0),
                    new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9 })
                );
                const halo = new THREE.Mesh(
                    new THREE.TorusGeometry(0.32, 0.03, 6, 16),
                    new THREE.MeshBasicMaterial({ color: col })
                );
                halo.rotation.x = Math.PI / 2;
                g.add(core, halo);
                BO.World.scene.add(g);
                this.familiars.push({ type, group: g, core, color: col, cd: Math.random() * 0.4, offsetAngle: this.familiars.length * 1.9 });
            };

            for (const id of r.artifacts) {
                if (id === 'cube_of_steel') for (let i = 0; i < mult; i++) spawnOrbital('cube_of_steel');
                else if (id === 'sawblade_halo') for (let i = 0; i < 2 * mult; i++) spawnOrbital('sawblade_halo');
                else if (id === 'seraph_wisp' || id === 'demon_imp' || id === 'plasma_sentinel') {
                    for (let i = 0; i < mult; i++) spawnFamiliar(id);
                }
            }
        }

        _spawnTurret(pos) {
            if (!BO.World?.scene) return;
            const g = new THREE.Group();
            const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 0.75, 8), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 }));
            stand.position.y = 0.375;
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.6), new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x16a34a, emissiveIntensity: 0.6 }));
            head.position.y = 0.9;
            g.add(stand, head);
            pos.y = BO.World.getGroundHeight(pos.x, pos.z, pos.y + 0.8);
            g.position.copy(pos);
            BO.World.scene.add(g);
            this.turrets.push({ group: g, head, pos: pos.clone(), cd: 0.2 });
        }

        checkProjectileBlock(proj) {
            if (!proj || !this.orbitals.length) return false;
            for (const orb of this.orbitals) {
                if (!orb.blocksProj) continue;
                if (orb.group.position.distanceTo(proj.pos) <= 0.85) {
                    BO.FX?.spawnParticles?.(proj.pos, 6, 0x94a3b8, 3, 4, 0.35, 0.8);
                    return true;
                }
            }
            return false;
        }

        /* ======================================================================
           Interactions (Pedestals & Locked Golden Reliquary Chests)
        ====================================================================== */

        getInteractTarget(playerPos) {
            const r = this.run;
            if (!r) return null;
            for (const ped of this.pedestals) {
                if (ped.claimed) continue;
                if (BO.Math.dist2D(playerPos.x, playerPos.z, ped.pos.x, ped.pos.z) <= 2.3) {
                    if (ped.kind === 'shop_pickup') {
                        const ok = r.gold >= ped.price;
                        return {
                            kind: 'rpg_pedestal',
                            ref: ped,
                            prompt: {
                                text: ok ? `[E] BUY ${ped.shopOffer.name.toUpperCase()} — ${ped.price} GOLD` : `${ped.shopOffer.name.toUpperCase()} — NEEDS ${ped.price} GOLD`,
                                affordable: ok,
                                color: '#fde047'
                            }
                        };
                    }
                    const def = this.ID.itemById(ped.itemId);
                    if (!def) continue;
                    if (ped.kind === 'devil') {
                        const hpCost = Math.round(this.P.maxHp * (this.D.ISAAC?.devilHpCostPct || 0.15));
                        const ok = this.P.hp > hpCost + 2 && r.devilHpPenalty < 0.65;
                        return {
                            kind: 'rpg_pedestal',
                            ref: ped,
                            prompt: {
                                text: ok ? `[E] DEVIL DEAL: ${def.name.toUpperCase()} (PAY -15% MAX HP) — ${def.desc}` : `DEVIL DEAL: ${def.name.toUpperCase()} — NOT ENOUGH HP`,
                                affordable: ok,
                                color: '#ef4444'
                            }
                        };
                    }
                    if (ped.kind === 'shop') {
                        const ok = r.gold >= ped.price;
                        return {
                            kind: 'rpg_pedestal',
                            ref: ped,
                            prompt: {
                                text: ok ? `[E] BUY ${def.name.toUpperCase()} (${ped.price}g) — ${def.desc}` : `${def.name.toUpperCase()} — NEEDS ${ped.price} GOLD`,
                                affordable: ok,
                                color: def.color
                            }
                        };
                    }
                    return {
                        kind: 'rpg_pedestal',
                        ref: ped,
                        prompt: {
                            text: `[E] TAKE ${def.name.toUpperCase()} — ${def.desc}`,
                            affordable: true,
                            color: def.color
                        }
                    };
                }
            }

            for (const ch of this.lockedChests) {
                if (ch.opened) continue;
                if (BO.Math.dist2D(playerPos.x, playerPos.z, ch.pos.x, ch.pos.z) <= 2.3) {
                    const ok = r.keys > 0;
                    return {
                        kind: 'rpg_locked_chest',
                        ref: ch,
                        prompt: {
                            text: ok ? '[E] UNLOCK GOLDEN RELIQUARY (1 KEY)' : 'LOCKED GOLDEN RELIQUARY — NEEDS 1 BRASS KEY',
                            affordable: ok,
                            color: '#fde047'
                        }
                    };
                }
            }
            return null;
        }

        interactWith(target) {
            if (!target) return false;
            const r = this.run;
            if (!r) return false;
            if (target.kind === 'rpg_pedestal') {
                const ped = target.ref;
                if (ped.claimed) return false;
                if (ped.kind === 'shop' || ped.kind === 'shop_pickup') {
                    if (r.gold < ped.price) return false;
                    r.gold -= ped.price;
                    BO.Sound?.playShopBuy?.();
                } else if (ped.kind === 'devil') {
                    const pct = this.D.ISAAC?.devilHpCostPct || 0.15;
                    const hpCost = Math.round(this.P.maxHp * pct);
                    if (this.P.hp <= hpCost + 2 || r.devilHpPenalty >= 0.65) return false;
                    r.devilHpPenalty = Math.min(0.65, (r.devilHpPenalty || 0) + pct);
                    r.devilDeals++;
                    r.angelChance = Math.max(0.1, r.angelChance - 0.2);
                    BO.RPGUnlocks?.record?.(BO.RPGProfile.data, 'devilDeals', 1);
                    this.M?.recomputeStats?.();
                }

                ped.claimed = true;
                if (ped.kind === 'shop_pickup') {
                    this.spawnPickup(ped.pos.clone().add(new THREE.Vector3(0, 0.2, 0.6)), ped.shopOffer.pickupType);
                } else {
                    this.grantArtifact(ped.itemId, { dropOldAt: ped.pos });
                }
                ped.orb.visible = false;
                ped.ring.material.opacity = 0.15;
                return true;
            }

            if (target.kind === 'rpg_locked_chest') {
                const ch = target.ref;
                if (ch.opened || r.keys <= 0) return false;
                r.keys--;
                ch.opened = true;
                ch.lock.visible = false;
                BO.Sound?.playMysteryBoxJingle?.();
                BO.FX?.spawnParticles?.(ch.pos.clone().add(UP), 20, 0xfde047, 4, 4, 0.7, 1.3);
                const roll = this.ID.rollArtifact({ pool: 'treasure', chaos: this.has('chaos_relic'), ownedPassives: new Set(r.artifacts), ownedActive: r.activeItem });
                this.spawnPedestal(ch.pos.clone().add(new THREE.Vector3(0, 0, 1.4)), roll.def.id, 'free');
                this.M?._dropGold?.(ch.pos, 18 + r.floor * 3);
                BO.Events.emit('hud:toast', { text: '🔑 RELIQUARY UNLOCKED!', color: '#fde047' });
                return true;
            }
            return false;
        }

        /* ======================================================================
           Frame Update (Orbitals, Familiars, Turrets, Bombs, Pickups, Cards)
        ====================================================================== */

        update(dt) {
            const M = this.M;
            const r = this.run;
            const P = this.P;
            if (!M?.active || !r || !P) return;
            const t = M.elapsed;

            // Card timers
            if (r.tempFloorBuffs) {
                if (r.tempFloorBuffs.emperorTimer > 0) r.tempFloorBuffs.emperorTimer = Math.max(0, r.tempFloorBuffs.emperorTimer - dt);
                if (r.tempFloorBuffs.devilCardTimer > 0) r.tempFloorBuffs.devilCardTimer = Math.max(0, r.tempFloorBuffs.devilCardTimer - dt);
                if (r.tempFloorBuffs.chariotTimer > 0) {
                    r.tempFloorBuffs.chariotTimer = Math.max(0, r.tempFloorBuffs.chariotTimer - dt);
                    for (const z of M.enemiesInRadius(P.pos, 1.8)) {
                        const last = this._chariotHitCd.get(z) || -99;
                        if (t - last >= 0.4) {
                            this._chariotHitCd.set(z, t);
                            M.dealDamage(z, 65 + r.floor * 8, { source: 'ability' });
                        }
                    }
                }
            }

            // Stormlord periodic lightning
            if (this.hasTransformation('storm') && M.state === 'fighting') {
                this._stormTimer -= dt;
                if (this._stormTimer <= 0) {
                    this._stormTimer = 3.5;
                    const target = M.nearestEnemies(P.pos, 18, 1)[0];
                    if (target) {
                        BO.FX?.spawnTracer?.(target.pos.clone().add(new THREE.Vector3(0, 11, 0)), target.pos.clone().add(UP), 0x38bdf8, 0.06, 0.16);
                        M.dealDamage(target, 55 + r.floor * 8, { source: 'ability', element: 'shock' });
                        if (M.isAlive(target)) M.applyStatus(target, 'shock');
                        BO.Sound?.playTrapZap?.();
                    }
                }
            }

            // Orbitals
            if (this.orbitals.length) {
                this._orbitalAngle += dt;
                const count = this.orbitals.length;
                for (let i = 0; i < count; i++) {
                    const orb = this.orbitals[i];
                    const ang = this._orbitalAngle * orb.speed + (i / count) * Math.PI * 2;
                    const ox = P.pos.x + Math.cos(ang) * orb.radius;
                    const oz = P.pos.z + Math.sin(ang) * orb.radius;
                    orb.group.position.set(ox, P.pos.y + 1.05, oz);
                    orb.group.rotation.y += dt * 5;
                    for (const z of M.enemiesInRadius(orb.group.position, 1.05)) {
                        const last = orb.cd.get(z) || -99;
                        if (t - last >= 0.45) {
                            orb.cd.set(z, t);
                            M.dealDamage(z, orb.dmg + r.floor * 4, { source: 'ability' });
                            BO.FX?.spawnParticles?.(orb.group.position, 4, 0xe2e8f0, 2.5, 4, 0.3, 0.8);
                        }
                    }
                }
            }

            // Buddy Familiars
            for (const fam of this.familiars) {
                const targetAng = P.yaw + fam.offsetAngle + 0.9;
                const tx = P.pos.x + Math.cos(targetAng) * 1.35;
                const tz = P.pos.z + Math.sin(targetAng) * 1.35;
                const ty = P.pos.y + 1.55 + Math.sin(t * 3 + fam.offsetAngle) * 0.14;
                fam.group.position.lerp(new THREE.Vector3(tx, ty, tz), Math.min(1, dt * 6));
                fam.core.rotation.y += dt * 3;
                fam.cd -= dt;
                if (fam.cd <= 0 && M.state === 'fighting') {
                    const range = fam.type === 'demon_imp' ? 9 : 18;
                    const target = M.nearestEnemies(fam.group.position, range, 1)[0];
                    if (target) {
                        fam.cd = fam.type === 'plasma_sentinel' ? 0.8 : 0.95;
                        const aimPt = target.pos.clone().add(UP);
                        BO.FX?.spawnTracer?.(fam.group.position, aimPt, fam.color, 0.032, 0.14);
                        const dmg = (fam.type === 'seraph_wisp' ? 32 : fam.type === 'demon_imp' ? 28 : 26) + r.floor * 4;
                        M.dealDamage(target, dmg, { source: 'ability', element: fam.type === 'demon_imp' ? 'burn' : fam.type === 'plasma_sentinel' ? 'shock' : undefined });
                        if (M.isAlive(target)) {
                            if (fam.type === 'demon_imp') M.applyStatus(target, 'burn');
                            else if (fam.type === 'plasma_sentinel') M.applyStatus(target, 'shock');
                        }
                    }
                }
            }

            // Deployed Turrets
            for (const tur of this.turrets) {
                tur.cd -= dt;
                if (tur.cd <= 0 && M.state === 'fighting') {
                    const target = M.nearestEnemies(tur.pos, 22, 1)[0];
                    if (target) {
                        tur.cd = 0.42;
                        const from = tur.pos.clone().add(new THREE.Vector3(0, 0.95, 0));
                        const to = target.pos.clone().add(UP);
                        tur.head.lookAt(to);
                        BO.FX?.spawnTracer?.(from, to, 0x4ade80, 0.028, 0.1);
                        M.dealDamage(target, 24 + r.floor * 3.5, { source: 'ability' });
                        BO.Sound?.playTurretFire?.();
                    }
                }
            }

            // Live Bombs
            for (let i = this.bombs.length - 1; i >= 0; i--) {
                const b = this.bombs[i];
                b.t -= dt;
                const pulse = 1 + Math.sin(t * 24) * 0.2;
                b.fuse.scale.setScalar(pulse);
                if (b.t <= 0) {
                    this.bombs.splice(i, 1);
                    this._detonateBomb(b);
                }
            }

            // Pedestals animation
            for (const ped of this.pedestals) {
                if (ped.claimed) continue;
                ped.orb.rotation.y += dt * 1.9;
                ped.orb.position.y = 1.48 + Math.sin(t * 2.8 + ped.pos.x) * 0.1;
            }

            // Pickups bob, magnet, collect
            const magnet = M.state === 'cleared' || this.has('magneto') ? 999 : 4.5;
            const playerTarget = P.pos.clone().add(UP);
            for (let i = this.pickups.length - 1; i >= 0; i--) {
                const pk = this.pickups[i];
                pk.mesh.rotation.y += dt * 2.4;
                const d = pk.pos.distanceTo(playerTarget);
                const canAutoCollect = this._canCollect(pk);
                if (canAutoCollect && d < magnet && P.alive) {
                    const pull = playerTarget.clone().sub(pk.pos).normalize().multiplyScalar(Math.max(5.5, 14 - d * 1.5));
                    pk.vel.lerp(pull, Math.min(1, dt * 7));
                    pk.pos.addScaledVector(pk.vel, dt);
                    pk.group.position.copy(pk.pos);
                } else {
                    pk.group.position.set(pk.pos.x, pk.baseY + Math.sin(t * 3 + pk.phase) * 0.09, pk.pos.z);
                }
                if (d < 1.25 && canAutoCollect) {
                    this._collectPickup(pk);
                }
            }
        }

        _canCollect(pk) {
            const r = this.run;
            const P = this.P;
            if (!r || !P || !P.alive) return false;
            if (pk.type === 'heart_red') return P.hp < P.maxHp - 0.5;
            if (pk.type === 'heart_soul') return r.soulShield < (this.D.ISAAC?.soulShieldCap || 150);
            if (pk.type === 'battery') {
                const def = r.activeItem ? this.ID.activeById(r.activeItem) : null;
                return !!(def && r.activeCharges < def.charges);
            }
            return true;
        }

        _blastAt(pos, radius, dmg, colorHex) {
            const M = this.M;
            BO.FX?.spawnExplosion?.(pos.clone().add(UP), Math.min(8, radius), colorHex);
            for (const z of M.enemiesInRadius(pos, radius)) {
                M.dealDamage(z, dmg, { source: 'ability' });
            }
            this.onExplosionAt(pos, radius, dmg);
        }

        _findSafestSpot() {
            const L = this.M?.layout;
            if (!L) return this.P.pos.clone();
            const corners = [
                new THREE.Vector3(-L.hw + 3, 0, -L.hl + 4),
                new THREE.Vector3(L.hw - 3, 0, -L.hl + 4),
                new THREE.Vector3(-L.hw + 3, 0, L.hl - 4),
                new THREE.Vector3(L.hw - 3, 0, L.hl - 4)
            ];
            let best = corners[0];
            let bestScore = -1;
            for (const c of corners) {
                let minD = 999;
                for (const z of this.M.enemies) {
                    if (!this.M.isAlive(z)) continue;
                    minD = Math.min(minD, BO.Math.dist2D(c.x, c.z, z.pos.x, z.pos.z));
                }
                if (minD > bestScore) { bestScore = minD; best = c; }
            }
            best.y = BO.World.getGroundHeight(best.x, best.z, 1);
            return best;
        }
    }

    BO.RPGItems = new RPGItems();
})(window);
;

/* --- src/modes/RPGMode.js --- */
/* ============================================================================
   BLACKOUT OPS — RPG Mode ("Delve & Extract")
   First-person action RPG on the shared FPS engine:
   - Persistent class characters (BO.RPGProfile), run state per delve
   - One procedural arena per floor (BO.RPGArena), next-room choice gates
   - Role-based enemies with camps/aggro, elites with affixes, bosses w/ phases
   - Status/reaction combo engine (primers apply, detonators consume)
   - Unbanked gold & items until extraction; death loses the haul
   Abilities live in src/rpg/RPGAbilities.js, UI in src/ui/RPGUI.js.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const V3 = () => new THREE.Vector3();
    const AGGRO_RADIUS = 11;
    const AGGRO_RADIUS_CROUCH = 6.5;
    const PACK_RADIUS = 10;
    const CAMERA_LIGHT_UP = new THREE.Vector3(0, 1.0, 0);

    class RPGMode {
        constructor() {
            this.active = false;
            this.state = 'idle'; // idle | transition | fighting | cleared | ended
            this.run = null;
            this.stats = null;
            this.enemies = [];
            this.projectiles = [];
            this.pickups = [];
            this.pools = [];
            this.timers = [];
            this.props = [];
            this.gates = [];
            this.layout = null;
            this.camera = null;
            this.nextId = 1;
            this.elapsed = 0;
            this.ability = this._freshAbilityState();
            this.momentum = { stacks: 0, decay: 0 };
            this.prompt = null;
            this.waves = null;
            this.hazards = [];
            this.boss = null;
            this.bannerText = '';
        }

        get D() { return BO.RPGData; }
        get P() { return BO.Player; }
        get Profile() { return BO.RPGProfile; }

        _freshAbilityState() {
            return { cd: { primer: 0, detonator: 0 }, ult: 0, ultActive: 0, ultId: null, silenced: 0, potionCd: 0, storm: null, dash: null };
        }

        /* ======================================================================
           Lifecycle
        ====================================================================== */

        /**
         * opts: { mode:'rpg', resume:boolean, startFloor:number, camera }
         */
        start(opts) {
            this.camera = opts.camera;
            this.active = true;
            this.enemies = [];
            this.projectiles = [];
            this.pickups = [];
            this.pools = [];
            this.timers = [];
            this.props = [];
            this.gates = [];
            this.elapsed = 0;
            this.ability = this._freshAbilityState();
            this.momentum = { stacks: 0, decay: 0 };
            const profile = this.Profile;
            const p = profile.data;
            // A start without a chosen (or with a removed) class falls back to the first unlocked class
            // instead of crashing in computeStats.
            if (!profile.classId || !profile.cls || !profile.D.CLASSES[profile.classId]) {
                const first = Object.keys(profile.D.CLASSES).find((id) => profile.selectClass(id));
                if (!first) console.warn('[RPGMode] no selectable class');
            }

            if (opts.resume && p.run && p.run.classId === profile.classId) {
                this.run = this._runFromSnapshot(p.run);
            } else {
                const startFloor = Math.max(1, p.checkpoints.includes(opts.startFloor) ? opts.startFloor : 1);
                this.run = {
                    classId: profile.classId,
                    difficulty: p.difficulty,
                    floor: startFloor,
                    startFloor,
                    roomType: startFloor % 5 === 0 ? 'boss' : 'combat',
                    seed: Math.floor(Math.random() * 1e9),
                    boons: new Set(),
                    elixir: p.elixir || null,
                    shrineHpPenalty: 0,
                    gold: 0,
                    scrap: 0,
                    pack: [],
                    xpEarned: 0,
                    kills: 0,
                    reactions: 0,
                    potions: 0,
                    hpFrac: 1,
                    ult: 0,
                    secondWindUsed: false,
                    fieldMedicUsed: false,
                    lastBastionFloor: -1,
                    floorsCleared: 0,
                    elapsed: 0,
                    levelsGained: 0,
                    bossKills: 0,
                    contract: p.contract,
                    contractProgress: 0, curse: false, roomApplied: false, mystery: false,
                    door: 'standard', doorApplied: true
                };
                if (BO.RPGItems) BO.RPGItems.initRun(this.run);
                p.elixir = null;
                p.stats.delves++;
                this.stats = profile.computeStats(this.run);
                this.run.potions = this.stats.potionsMax;
            }
            if (BO.RPGItems) BO.RPGItems.initRun(this.run);
            this.stats = profile.computeStats(this.run);
            this.ability.ult = this.run.ult || 0;
            this._firstFloor = true;
            this._enterFloor();
            BO.Sound.startMusic('rpg');
            return BO.World.scene;
        }

        stop() {
            if (!this.active && this.state === 'idle') return;
            this._clearFloor();
            this.active = false;
            this.state = 'idle';
            this.run = null;
            this.prompt = null;
            if (BO.RPGUI) BO.RPGUI.closeModal(true);
            if (BO.Combat) {
                BO.Combat.onHitEnemy = null;
                BO.Combat.onExplodeAt = null;
                BO.Combat.setTargetPool([]);
            }
            BO.Sound.stopMusic();
        }

        _snapshot() {
            const r = this.run;
            return {
                classId: r.classId, difficulty: r.difficulty, floor: r.floor, startFloor: r.startFloor, roomType: r.roomType, seed: r.seed,
                boons: Array.from(r.boons), elixir: r.elixir, shrineHpPenalty: r.shrineHpPenalty,
                gold: r.gold, scrap: r.scrap, pack: r.pack.slice(), xpEarned: r.xpEarned, kills: r.kills, reactions: r.reactions,
                potions: r.potions, hpFrac: r.hpFrac, ult: r.ult, secondWindUsed: r.secondWindUsed, fieldMedicUsed: r.fieldMedicUsed,
                lastBastionFloor: r.lastBastionFloor, floorsCleared: r.floorsCleared, elapsed: r.elapsed, levelsGained: r.levelsGained, bossKills: r.bossKills,
                contract: r.contract, contractProgress: r.contractProgress, curse: !!r.curse, roomApplied: !!r.roomApplied, mystery: !!r.mystery,
                door: r.door || 'standard', doorApplied: r.doorApplied !== false,
                artifacts: Array.isArray(r.artifacts) ? r.artifacts.slice() : [],
                activeItem: r.activeItem || null,
                activeCharges: r.activeCharges || 0,
                pocket: r.pocket ? Object.assign({}, r.pocket) : null,
                pillMap: r.pillMap ? JSON.parse(JSON.stringify(r.pillMap)) : null,
                keys: Number.isFinite(r.keys) ? r.keys : 1,
                bombs: Number.isFinite(r.bombs) ? r.bombs : 2,
                soulShield: r.soulShield || 0,
                devilDeals: r.devilDeals || 0,
                angelChance: Number.isFinite(r.angelChance) ? r.angelChance : 0.5,
                transformations: Array.isArray(r.transformations) ? r.transformations.slice() : [],
                holyMantleReady: !!r.holyMantleReady,
                livesLeft: r.livesLeft || 0,
                devilHpPenalty: r.devilHpPenalty || 0,
                permPillBuffs: r.permPillBuffs ? Object.assign({}, r.permPillBuffs) : null,
                tookRedHpDamageOnFloor: !!r.tookRedHpDamageOnFloor
            };
        }

        _runFromSnapshot(s) {
            const r = Object.assign({}, s);
            r.boons = new Set(Array.isArray(s.boons) ? s.boons : []);
            r.pack = Array.isArray(s.pack) ? s.pack.slice() : [];
            r.hpFrac = BO.Math.clamp(Number(s.hpFrac) || 1, 0.05, 1);
            r.contract = Object.hasOwn(this.D.CONTRACTS, s.contract) ? s.contract : null;
            const contract = this.D.CONTRACTS[r.contract];
            r.contractProgress = contract ? BO.Math.clamp(Math.floor(Number(s.contractProgress) || 0), 0, contract.goal) : 0;
            r.artifacts = Array.isArray(s.artifacts) ? s.artifacts.slice() : [];
            r.activeItem = s.activeItem || null;
            r.activeCharges = Number.isFinite(s.activeCharges) ? s.activeCharges : 0;
            r.pocket = s.pocket && typeof s.pocket === 'object' ? Object.assign({}, s.pocket) : null;
            r.pillMap = s.pillMap && typeof s.pillMap === 'object' ? JSON.parse(JSON.stringify(s.pillMap)) : null;
            r.keys = Number.isFinite(s.keys) ? s.keys : 1;
            r.bombs = Number.isFinite(s.bombs) ? s.bombs : 2;
            r.soulShield = Number.isFinite(s.soulShield) ? s.soulShield : 0;
            r.devilDeals = Number.isFinite(s.devilDeals) ? s.devilDeals : 0;
            r.angelChance = Number.isFinite(s.angelChance) ? s.angelChance : 0.5;
            r.transformations = Array.isArray(s.transformations) ? s.transformations.slice() : [];
            r.holyMantleReady = !!s.holyMantleReady;
            r.livesLeft = Number.isFinite(s.livesLeft) ? s.livesLeft : 0;
            if (BO.RPGItems) BO.RPGItems.ensureRunState(r);
            return r;
        }

        /* ======================================================================
           Floors
        ====================================================================== */

        _clearFloor() {
            for (const z of this.enemies) z.destroy();
            this.enemies = [];
            const scene = BO.World.scene;
            for (const list of [this.projectiles, this.pickups, this.pools, this.props]) {
                for (const o of list) {
                    if (o.mesh && scene) scene.remove(o.mesh);
                    if (o.group && scene) scene.remove(o.group);
                }
            }
            for (const gate of this.gates) {
                gate.group.removeFromParent();
                gate.mat.map?.dispose();
                gate.group.traverse((obj) => {
                    if (!obj.isMesh) return;
                    if (obj.geometry && !(BO.Assets && BO.Assets.isSharedGeo(obj.geometry))) obj.geometry.dispose();
                    if (obj.material && !(BO.Assets && BO.Assets.hasSharedMatValue(obj.material))) obj.material.dispose();
                });
            }
            if (this.vaultGlbGroup) {
                this.vaultGlbGroup.removeFromParent();
                this.vaultGlbGroup.traverse((obj) => {
                    if (obj.isInstancedMesh && typeof obj.dispose === 'function') obj.dispose();
                    if (obj.geometry && !(BO.Assets && BO.Assets.isSharedGeo(obj.geometry))) obj.geometry.dispose();
                    if (obj.material && !(BO.Assets && BO.Assets.hasSharedMatValue(obj.material))) obj.material.dispose();
                });
                this.vaultGlbGroup = null;
            }
            this.roomEvent?.dispose();
            this.roomEvent = null;
            this.vaultArt?.dispose();
            this.vaultArt = null;
            this.floorResolved = false;
            this._clearHazards();
            this.projectiles = [];
            this.pickups = [];
            this.pools = [];
            this.props = [];
            this.gates = [];
            this.timers = [];
            this.waves = null;
            this.boss = null;
            this.beacon = null;
            this.altar = null;
            this.chest = null;
            this.cache = null;
            this.ability.storm = null;
            this.ability.dash = null;
            if (BO.RPGItems) BO.RPGItems.clearVisuals();
            if (BO.RPGUI) BO.RPGUI.clearWorldUi();
        }

        _enterFloor() {
            const r = this.run;
            const D = this.D;
            this.state = 'transition';
            this._clearFloor();
            if (BO.Combat) BO.Combat.reset(this.camera);

            if (r.roomType === 'mystery') {
                r.mystery = true;
                r.roomType = BO.RPGMysteryRoom(r.floor, r.seed);
            }
            const room = D.ROOMS[r.roomType];
            const quiet = room.quiet || r.roomType === 'rest' || r.roomType === 'shrine';
            const gateCount = (r.floor + 1) % 5 === 0 ? 1 : (quiet ? 2 : 2 + ((r.seed + r.floor) % 2));
            const gen = BO.RPGArena.generate({ floor: r.floor, roomType: r.roomType, seed: r.seed, gateCount });
            this.layout = gen.layout;
            BO.World.build(gen.mapId);
            if (r.roomType !== 'boss') BO.Sound.startMusic('rpg');
            this.vaultArt = BO.RPGVaultArt.build(this.layout, r.seed);
            if (BO.Assets && BO.Assets.placeGLBInstanced && BO.World.scene) {
                const vg = new THREE.Group();
                BO.World.scene.add(vg);
                this.vaultGlbGroup = vg;
                const { hw, hl, wallH } = this.layout;
                const cols = [];
                for (let z = -hl + 4; z <= hl - 4; z += 7.5) {
                    cols.push({ pos: [-hw + 0.9, 0, z], scale: [1.6, Math.min(wallH * 0.85, 6.2), 1.6] });
                    cols.push({ pos: [hw - 0.9, 0, z], scale: [1.6, Math.min(wallH * 0.85, 6.2), 1.6] });
                }
                BO.Assets.placeGLBInstanced(vg, 'mini_dungeon_kit/column.glb', cols, { fitSize: [1, 1, 1], guardScene: BO.World.scene });
                BO.Assets.placeGLBInstanced(vg, 'mini_dungeon_kit/barrel.glb', [
                    { pos: [-hw + 1.8, 0, hl - 2.2], rot: 0.4, scale: 1.5 },
                    { pos: [hw - 1.8, 0, hl - 2.2], rot: 1.9, scale: 1.5 },
                    { pos: [-hw + 1.9, 0, -hl + 2.4], rot: 0.9, scale: 1.45 },
                    { pos: [hw - 1.9, 0, -hl + 2.4], rot: 2.3, scale: 1.45 }
                ], { scale: 1, guardScene: BO.World.scene });
                BO.Assets.placeGLBInstanced(vg, 'mini_dungeon_kit/banner.glb', [
                    { pos: [-hw + 0.3, 3.2, 0], rot: Math.PI * 0.5, scale: 2.2 },
                    { pos: [hw - 0.3, 3.2, 0], rot: -Math.PI * 0.5, scale: 2.2 }
                ], { guardScene: BO.World.scene });
            }
            const sp = gen.layout.spawn;

            if (BO.RPGItems) BO.RPGItems.resetFloor();
            this.stats = this.Profile.computeStats(r);
            const P = this.P;
            if (this._firstFloor) {
                P.initForMatch('rpg', sp, this._loadoutConfig(), false);
                this._firstFloor = false;
            } else {
                P.pos.set(sp.x, sp.y, sp.z);
                P.vel.set(0, 0, 0);
                P.yaw = sp.yaw;
                P.pitch = 0;
                P.reloading = false;
            }
            P.maxHp = this.stats.maxHp;
            P.hp = Math.max(1, Math.round(P.maxHp * r.hpFrac));
            P.armor = 0;
            P.maxArmor = 0;
            P.armorReservePlates = 0;
            P.lethalCount = 0;
            P.tacticalCount = 0;
            P.selfRevives = 0;
            P.fieldCharge = 0;
            P.ultimateCharge = 0;
            for (const w of P.weapons) if (w && w.stats && w.stats.kind !== 'melee') w.reserve = w.stats.reserveMax;

            BO.Combat.onHitEnemy = (ent, dmg, hitbox, dist, w, pt, dir) => this._onGunHit(ent, dmg, hitbox, w, pt, dir);
            BO.Combat.onExplodeAt = (pos, rad, dmg) => this._onExplode(pos, rad, dmg);
            BO.Combat.onActivateKillstreak = null;

            this._buildGates();
            this.roomEvent = new BO.RPGRoomEvent(this, room);
            this.trail = BO.RPGUnlocks.equipped(this.Profile.data, 'trail');
            this.trailClock = 0;
            this._populateRoom();
            if (BO.RPGItems) BO.RPGItems.populateFloor(this);
            this._buildHazards();
            this._applyDoor();

            // Floor-start snapshot = the suspend/resume point.
            this.Profile.saveRun(this._snapshot());
            this.state = this._livingCount() === 0 && !this.waves && !this.roomEvent.blocks ? 'cleared' : 'fighting';
            if (this.state === 'cleared') this._onFloorCleared(true);

            const biome = this.layout.biome;
            BO.Events.emit('hud:banner', {
                title: `FLOOR ${r.floor} · ${r.mystery ? '? ' : ''}${room.name.toUpperCase()}`,
                sub: `${biome.name} · ${this.layout.style} · ${this.layout.W} × ${this.layout.L} m${this._door().id !== 'standard' ? ' · ' + this._door().name : ''}`,
                color: room.color
            });
            if (BO.RPGUI) BO.RPGUI.onFloorEntered();
            this.roomEvent.onEnter();
        }

        _loadoutConfig() {
            const it = this.Profile.cls.equip.weapon || this.Profile.makeStarterWeapon(this.run.classId);
            return {
                primary: this._weaponCfg(it),
                secondary: null,
                perks: [],
                lethal: 'frag',
                tactical: 'flashbang',
                fieldUpgrade: 'munitions_box',
                ultimatePower: 'gravity_spikes'
            };
        }

        _weaponCfg(item) {
            const spec = BO.WeaponsData.get(item.base);
            const camo = { common: 'default', rare: 'carbon', epic: 'dark_matter', legendary: 'gold' }[item.rarity] || 'default';
            return {
                id: item.base,
                camo,
                attachments: { optic: spec.modelSpec && spec.modelSpec.defaultScope ? 'sniper_scope' : 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' }
            };
        }

        /** Re-equips the active weapon item live (pack swaps during a delve). */
        refreshWeapon() {
            const P = this.P;
            const it = this.Profile.cls.equip.weapon;
            if (!it) return;
            P.weapons = [P._createWeaponInstance(this._weaponCfg(it), 0)];
            P.activeSlot = 0;
            P.reloading = false;
            P.reloadTimer = 0;
            P.rebuildViewmodel();
        }

        /** Recomputes derived stats after gear/boon changes, keeping the HP ratio. */
        recomputeStats() {
            const P = this.P;
            const frac = P.maxHp > 0 ? P.hp / P.maxHp : 1;
            this.stats = this.Profile.computeStats(this.run);
            P.maxHp = this.stats.maxHp;
            P.hp = Math.max(1, Math.min(P.maxHp, Math.round(P.maxHp * frac)));
            this.run.potions = Math.min(this.run.potions, this.stats.potionsMax);
        }

        _populateRoom() {
            const r = this.run;
            const L = this.layout;
            const f = r.floor;
            const tactic = L.encounter;
            const baseCount = BO.Math.clamp(Math.round((5 + f * 0.55) * tactic.factor), 4, 17);
            const camps = tactic.formation === 'flanks'
                ? L.camps.slice().sort((a, b) => Math.abs(b.x) - Math.abs(a.x))
                : L.camps.slice();
            const skirmisher = tactic.formation === 'ranged' ? 'ranged' : tactic.formation === 'tanks' ? 'armored' : null;
            const rush = tactic.formation === 'rush' || r.roomType === 'darkroom';
            const placeGroup = (count, campIdx, opts = {}) => {
                const c = camps[campIdx % Math.max(1, camps.length)] || { x: 0, z: -4 };
                for (let i = 0; i < count; i++) {
                    const a = (i / Math.max(1, count)) * Math.PI * 2 + Math.random() * 0.6;
                    const rad = count > 1 ? 1.6 + Math.random() * 0.8 : 0;
                    const special = i % 2 === 0 ? skirmisher : null;
                    this._spawnEnemy(opts.arch || this._pickArchetype(special), c.x + Math.cos(a) * rad, c.z + Math.sin(a) * rad, {
                        aggro: rush, hp: tactic.hp, damage: tactic.damage, speed: tactic.speed, ...opts
                    });
                }
            };
            const fillCamps = (total, startCamp = 0) => {
                let left = total;
                let ci = startCamp;
                while (left > 0) {
                    const g = Math.min(left, 2 + Math.floor(Math.random() * 3));
                    placeGroup(g, ci++);
                    left -= g;
                }
            };

            switch (r.roomType) {
                case 'puzzle':
                case 'bowling':
                case 'defend':
                case 'mimic':
                    break;
                case 'miniboss': {
                    const camp = camps[0] || L.center;
                    this.roomEvent.champion = this._spawnEnemy(this._pickArchetype('armored'), camp.x, camp.z, { elite: true, hp: 2.1, aggro: true });
                    fillCamps(Math.max(2, Math.floor(baseCount / 3)), 1);
                    break;
                }
                case 'hunt':
                    placeGroup(1, 0, { arch: this._pickArchetype('ranged'), elite: true, hp: 1.1 });
                    fillCamps(Math.round(baseCount * 0.75), 1);
                    break;
                case 'crossfire':
                    for (const side of [-1, 1]) {
                        const spots = L.camps.filter((c) => c.x * side > 2).slice(0, 3);
                        for (const spot of spots) this._spawnEnemy(this._pickArchetype('ranged'), spot.x, spot.z, { aggro: true });
                    }
                    fillCamps(Math.round(baseCount / 2));
                    break;
                case 'speedrun':
                    fillCamps(baseCount, 0);
                    for (const enemy of this.enemies) this.aggro(enemy);
                    break;
                case 'elite': {
                    const eliteArch = this._pickArchetype();
                    placeGroup(1, 0, { arch: eliteArch, elite: true });
                    fillCamps(Math.round(baseCount * 0.6), 1);
                    break;
                }
                case 'treasure':
                    this._spawnChest(L.center.x, L.center.z - 2);
                    fillCamps(Math.max(3, Math.round(baseCount * 0.6)));
                    break;
                case 'ambush': {
                    const per = BO.Math.clamp(Math.round(4 + f * 0.4), 4, 10);
                    this.waves = { total: 3, current: 0, perWave: per, delay: 1.2 };
                    BO.Events.emit('hud:toast', { text: 'AMBUSH — SURVIVE 3 WAVES', color: '#fb923c' });
                    break;
                }
                case 'boss':
                    this._spawnBoss();
                    break;
                case 'rest':
                    this._spawnBeacon(L.center.x + 4, L.center.z);
                    this._spawnCampfire(L.center.x - 3, L.center.z);
                    this._applyRest();
                    break;
                case 'shrine':
                    this._spawnAltar(L.center.x, L.center.z);
                    break;
                default:
                    if (this.D.ROOMS[r.roomType].quiet) break;
                    if (this.D.ROOMS[r.roomType].hazard) {
                        this._spawnChest(L.center.x, L.center.z);
                    }
                    fillCamps(baseCount);
            }
            if (L.cache) this._spawnCache(L.cache.x, L.cache.y, L.cache.z);
        }

        _pickArchetype(trait = null) {
            const biome = this.layout.biome;
            const eligible = Object.entries(biome.pool).filter(([id]) => (this.D.ENEMIES[id].minFloor || 1) <= this.run.floor);
            const preferred = trait ? eligible.filter(([id]) => this.D.ENEMIES[id][trait]) : [];
            const entries = preferred.length ? preferred : eligible;
            let total = 0;
            for (const [, w] of entries) total += w;
            let roll = Math.random() * total;
            for (const [id, w] of entries) { roll -= w; if (roll <= 0) return id; }
            return 'grunt';
        }

        _applyRest() {
            const P = this.P;
            P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.4);
            this.run.potions = this.stats.potionsMax;
            BO.Events.emit('hud:toast', { text: 'REST — HEALED 40% • POTIONS REFILLED • EXTRACTION AVAILABLE', color: '#4ade80' });
        }

        _nextRoomChoices(count) {
            const next = this.run.floor + 1;
            if (next % 5 === 0) return ['boss'];
            const rooms = Object.values(this.D.ROOMS).filter((rm) => rm.weight > 0 && (rm.minFloor || 1) <= next);
            const out = [];
            if (next % 5 === 4) out.push('rest'); // the floor before a boss always offers a breather
            const introductions = { 2: ['puzzle', 'mystery'], 3: ['speedrun', 'vents'], 6: ['shop', 'crossfire'], 8: ['surge'], 16: ['fracture'] };
            for (const id of introductions[next] || []) if (out.length < count) out.push(id);
            while (out.length < count) {
                const pool = rooms.filter((rm) => !out.includes(rm.id));
                if (!pool.length) break;
                let total = 0;
                for (const rm of pool) total += rm.weight;
                let roll = Math.random() * total;
                let picked = pool[0].id;
                for (const rm of pool) { roll -= rm.weight; if (roll <= 0) { picked = rm.id; break; } }
                out.push(picked);
            }
            return out;
        }

        _buildGates() {
            const choices = this._nextRoomChoices(this.layout.gates.length);
            const doors = BO.RPGDoors.roll(this.layout.gates.length, this.run.floor + 1, choices);
            this.layout.gates.forEach((g, i) => {
                const type = choices[i] || choices[0] || 'combat';
                const room = this.D.ROOMS[type];
                const door = BO.RPGDoors.get(doors[i]);
                const group = new THREE.Group();
                const tex = BO.RPGUI ? BO.RPGUI.makeGateTexture(room, this.run.floor + 1, door, BO.RPGDoors.cost(door, this.run, this.P)) : null;
                const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x555555, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
                const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 4.5), mat);
                plane.position.set(g.x, 2.3, g.z + 0.05);
                group.add(plane);
                const aura = BO.RPGUnlocks.equipped(this.Profile.data, 'gate');
                const light = new THREE.Color(door.id !== 'standard' ? door.color : (aura?.color || room.color));
                const trim = new THREE.MeshStandardMaterial({ color: door.id === 'standard' ? 0x907045 : new THREE.Color(door.color).multiplyScalar(0.55), metalness: 0.66, roughness: 0.36, emissive: light, emissiveIntensity: 0.15 });
                const arch = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.12, 8, 22, Math.PI), trim);
                arch.position.set(g.x, 3.32, g.z + 0.28);
                group.add(arch);
                const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.23, 0), new THREE.MeshBasicMaterial({ color: light }));
                lamp.position.set(g.x, 5.12, g.z + 0.25);
                group.add(lamp);
                const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.12), new THREE.MeshBasicMaterial({ color: light, transparent: true, opacity: 0.25 }));
                glow.rotation.x = -Math.PI / 2;
                glow.position.set(g.x, 0.03, g.z + 0.9);
                glow.scale.set(1, 14, 1);
                group.add(glow);
                BO.World.scene.add(group);
                if (door.id !== 'standard') {
                    // Door-type keystone above the arch so the door reads at a distance.
                    const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), new THREE.MeshStandardMaterial({ color: door.color, emissive: door.color, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 }));
                    stone.position.set(g.x, 4.25, g.z + 0.32);
                    stone.scale.set(1, 1.35, 0.5);
                    group.add(stone);
                }
                this.gates.push({ x: g.x, z: g.z, standZ: g.standZ, type, room, door, group, plane, mat, glow, arch, lamp, aura, open: false, timer: Infinity });
            });
        }

        _openGates() {
            for (const g of this.gates) {
                g.open = true;
                g.timer = g.door?.window || Infinity;
                g.mat.color.set(0xffffff);
                g.mat.opacity = 0.95;
                g.glow.material.opacity = 0.55;
                g.arch.material.emissiveIntensity = 0.55;
                if (g.aura) BO.FX.spawnParticles(g.lamp.position, g.aura.pattern, g.glow.material.color.getHex(), 2, -0.2, 1.2, 1.5);
            }
        }

        _livingCount() { return this.enemies.filter((z) => z.alive).length; }

        _onFloorCleared(silent = false) {
            if (this.floorResolved) return;
            this.floorResolved = true;
            const r = this.run;
            this.state = 'cleared';
            this._openGates();
            r.floorsCleared++;
            const fightRoom = !this.D.ROOMS[r.roomType].quiet && !['rest', 'shrine'].includes(r.roomType);
            if (fightRoom) {
                this._trackContract('clears');
                if (this.hazards.length) {
                    this._trackContract('hazards');
                    this._clearHazards();
                }
                const multiplier = this.roomEvent?.clearBonus() || 1;
                this._awardXP((25 + 8 * r.floor) * multiplier, null, 'FLOOR CLEARED');
                BO.Sound.playRoundEnd();
                if (!silent && BO.RPGItems) BO.RPGItems.onFloorCleared();
            }
            if (r.roomType === 'boss') {
                const p = this.Profile.data;
                const cp = r.floor + 1;
                if (!p.checkpoints.includes(cp)) {
                    p.checkpoints.push(cp);
                    p.checkpoints.sort((a, b) => a - b);
                    BO.Events.emit('hud:toast', { text: `CHECKPOINT UNLOCKED — FUTURE DELVES CAN START AT FLOOR ${cp}`, color: '#fbbf24' });
                }
                this._spawnBeacon(this.layout.center.x, this.layout.center.z + 6);
                this._offerBoons('Guardian slain — choose a Boon');
            } else if (r.roomType === 'elite') {
                this._offerBoons('Elite defeated — choose a Boon');
            } else if (r.roomType === 'hunt' || r.roomType === 'miniboss') {
                this._dropGold(new THREE.Vector3(this.layout.center.x, 0, this.layout.center.z), r.roomType === 'hunt' ? 70 : 100);
            }
            if (fightRoom && !silent) {
                BO.Events.emit('hud:banner', { title: 'FLOOR CLEARED', sub: this.beacon ? 'EXTRACT AT THE BEACON — OR CHOOSE A GATE TO GO DEEPER' : 'CHOOSE A GATE TO GO DEEPER', color: '#4ade80' });
            }
            this.Profile.save();
        }

        _buildHazards() {
            const room = this.D.ROOMS[this.run.roomType];
            const spec = room.hazard;
            if (!spec) return;

            for (const spot of this.layout.hazards) {
                const group = new THREE.Group();
                const material = new THREE.MeshBasicMaterial({
                    color: room.color, transparent: true, opacity: 0.3, depthWrite: false
                });
                const ring = new THREE.Mesh(new THREE.RingGeometry(spec.radius - 0.13, spec.radius, 40), material);
                const fill = new THREE.Mesh(new THREE.CircleGeometry(spec.radius - 0.16, 40), material.clone());
                fill.material.opacity = 0.06;
                ring.rotation.x = fill.rotation.x = -Math.PI / 2;
                group.position.set(spot.x, 0.035, spot.z);
                group.add(ring, fill);
                BO.World.scene.add(group);
                this.hazards.push({ group, ring, fill, clock: spot.phase * (spec.period - spec.warning) });
            }
        }

        _clearHazards() {
            for (const { group, ring, fill } of this.hazards) {
                group.removeFromParent();
                for (const mesh of [ring, fill]) {
                    mesh.material.dispose();
                    mesh.geometry.dispose();
                }
            }
            this.hazards = [];
        }

        _updateHazards(dt) {
            if (!this.hazards.length) return;
            const room = this.D.ROOMS[this.run.roomType];
            const spec = room.hazard;
            const player = this.P;
            for (const hazard of this.hazards) {
                hazard.clock += dt;
                const tell = (hazard.clock - spec.period + spec.warning) / spec.warning;
                hazard.ring.material.opacity = 0.32 + 0.67 * BO.Math.clamp(tell, 0, 1);
                hazard.fill.material.opacity = 0.06 + 0.45 * BO.Math.clamp(tell, 0, 1);
                if (hazard.clock < spec.period) continue;
                hazard.clock -= spec.period;
                const pos = hazard.group.position;
                BO.FX.spawnParticles(pos.clone().add(CAMERA_LIGHT_UP), 14, new THREE.Color(room.color).getHex(), 3, 1, 0.6, 1.2);
                if (!player.alive || player.pos.y > 0.9 || Math.hypot(player.pos.x - pos.x, player.pos.z - pos.z) >= spec.radius) continue;
                player.takeDamage(player.maxHp * spec.damage * this._difficulty().dmg, null, true);
                if (spec.silence) this.ability.silenced = Math.max(this.ability.silenced, spec.silence);
                if (spec.drain) this.ability.ult = Math.max(0, this.ability.ult - spec.drain);
                BO.Events.emit('hud:toast', { text: spec.name, color: room.color });
            }
        }

        _trackContract(event, amount = 1) {
            const r = this.run;
            const contract = this.D.CONTRACTS[r.contract];
            if (!contract || contract.event !== event || r.floor < contract.floor || r.contractProgress >= contract.goal) return;
            r.contractProgress = Math.min(contract.goal, r.contractProgress + amount);
            if (r.contractProgress === contract.goal) {
                BO.Events.emit('hud:toast', { text: `${contract.name} complete. Extract to collect your reward.`, color: '#fbbf24' });
            }
        }

        _offerBoons(title) {
            const owned = this.run.boons;
            const pool = this.D.BOONS.filter((b) => !owned.has(b.id));
            const picks = [];
            while (picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
            if (!picks.length || !BO.RPGUI) return;
            BO.RPGUI.openBoonPick(title, picks, (boon) => this.grantBoon(boon.id));
        }

        grantBoon(id) {
            const r = this.run;
            if (!this.D.boonById(id) || r.boons.has(id)) return;
            r.boons.add(id);
            if (id === 'potion_belt') {
                this.recomputeStats();
                r.potions = this.stats.potionsMax;
            } else {
                this.recomputeStats();
            }
            BO.Sound.playPerkBuy();
            BO.Events.emit('hud:toast', { text: `BOON GAINED — ${this.D.boonById(id).name.toUpperCase()}`, color: '#c084fc' });
        }

        enterGate(gate) {
            if (!gate || !gate.open || gate.sealed || this.state !== 'cleared') return;
            const r = this.run;
            const door = gate.door || BO.RPGDoors.get();
            const cost = BO.RPGDoors.cost(door, r, this.P);
            if (cost && !cost.ok) return;
            if (cost?.kind === 'gold') r.gold -= cost.amount;
            if (cost?.kind === 'scrap') r.scrap -= cost.amount;
            if (cost?.kind === 'hp') this.P.hp = Math.max(1, this.P.hp - cost.amount);
            if (cost) BO.Events.emit('hud:toast', { text: `${door.name.toUpperCase()} OPENED — PAID ${cost.label}`, color: door.color });
            this.state = 'transition'; // blocks double-entry during the fade
            r.hpFrac = BO.Math.clamp(this.P.hp / Math.max(1, this.P.maxHp), 0.05, 1);
            r.ult = this.ability.ult;
            r.floor += 1;
            r.roomType = gate.type;
            r.door = door.id;
            r.doorApplied = false;
            r.mystery = false;
            r.roomApplied = false;
            r.seed = (r.seed * 48271 + 12820163) % 2147483647;
            this.Profile.data.deepest = Math.max(this.Profile.data.deepest, r.floor);
            BO.Sound.playUIClick();
            const go = () => { if (this.active) this._enterFloor(); };
            if (BO.RPGUI) BO.RPGUI.fadeTransition(go); else go();
        }

        /* ======================================================================
           Spawning
        ====================================================================== */

        _difficulty() { return this.D.DIFFICULTIES[this.run.difficulty] || this.D.DIFFICULTIES.normal; }

        _spawnEnemy(archId, x, z, opts = {}) {
            const D = this.D;
            const A = D.ENEMIES[archId] || D.ENEMIES.grunt;
            const base = BO.ZombiesData.get(A.base);
            const diff = this._difficulty();
            const f = this.run.floor;
            const elite = !!opts.elite;
            const door = this._door();
            const hp = Math.round(A.hp * D.enemyHpMult(f) * diff.hp * (elite ? D.ELITE.hpMult : 1) * (opts.hp || 1) * (door.hp || 1));
            const dmg = Math.max(1, Math.round(A.attack * D.enemyDmgMult(f) * diff.dmg * (elite ? 1.3 : 1) * (opts.damage || 1) * (door.dmg || 1)));
            const speed = A.speed * (opts.speed || 1);
            const spec = Object.assign({}, base, {
                name: (elite ? 'Elite ' : '') + A.name,
                hp, speed, attack: dmg, defense: 0,
                resistances: { bullet: 1, explosive: 1, fire: 1, headshot: 1, melee: 1 },
                attackType: A.healer ? 'melee' : (A.attackType || base.attackType),
                movementHabit: A.habit || base.movementHabit,
                isBoss: false, isSuperBoss: false, isMagical: false, splitCount: 0, jumpChance: 0
            });
            const ent = new BO.ZombieEntity({
                id: this.nextId++, spec, round: f, hp, speed, damage: dmg,
                x, y: 0, z, sizeMult: elite ? D.ELITE.sizeMult : 1, windowInteractive: null
            });
            ent.rpg = {
                arch: A, camp: { x, z }, aggro: !!opts.aggro, elite, affixes: [], statuses: {},
                lastHitAt: -99, wardBroken: 0, armorBreak: 0, nthHits: 0, isBoss: false,
                healCd: 3 + Math.random() * 2, idleYaw: Math.random() * Math.PI * 2, idlePhase: Math.random() * 10, dead: false
            };
            ent.yaw = Math.atan2(this.layout.spawn.x - x, this.layout.spawn.z - z) + (Math.random() - 0.5) * 1.2;
            ent.rpg.idleYaw = ent.yaw;
            if (elite) {
                const keys = Object.keys(D.ELITE_AFFIXES);
                const n = f >= 10 ? 2 : 1;
                while (ent.rpg.affixes.length < n) {
                    const k = BO.Math.pick(keys);
                    if (!ent.rpg.affixes.includes(k)) ent.rpg.affixes.push(k);
                }
                if (ent.rpg.affixes.includes('hasted')) ent.speed *= 1.4;
                const col = D.ELITE_AFFIXES[ent.rpg.affixes[0]].hex;
                const aura = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 28), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 }));
                aura.rotation.x = Math.PI / 2;
                aura.position.y = 0.08;
                ent.parts.root.add(aura);
                ent.rpg.aura = aura;
            }
            if (opts.aggro) this._spawnFx(ent.pos, 0xa855f7);
            this.enemies.push(ent);
            return ent;
        }

        _spawnBoss() {
            const D = this.D;
            const f = this.run.floor;
            const idx = Math.floor((f / 5 - 1)) % D.BOSSES.length;
            const B = D.BOSSES[Math.max(0, idx)];
            const loops = Math.floor((f / 5 - 1) / D.BOSSES.length);
            const diff = this._difficulty();
            const base = BO.ZombiesData.get(B.id);
            const hp = Math.round(B.hp * (1 + 0.5 * loops) * diff.hp * (1 + 0.04 * (f - 5)));
            const dmg = Math.round(B.attack * D.enemyDmgMult(f) * diff.dmg);
            const spec = Object.assign({}, base, { name: B.name, title: B.title, hp, speed: B.speed, attack: dmg, defense: 0, isSuperBoss: false });
            const L = this.layout;
            const ent = new BO.ZombieEntity({ id: this.nextId++, spec, round: f, hp, speed: B.speed, damage: dmg, x: L.center.x, y: 0, z: L.center.z - 8, windowInteractive: null });
            ent.rpg = {
                arch: { id: 'boss', name: B.name, role: 'Boss', weak: null, xp: B.xp, gold: B.gold }, boss: B,
                camp: { x: L.center.x, z: L.center.z - 8 }, aggro: false, elite: false, affixes: [], statuses: {},
                lastHitAt: -99, wardBroken: 0, armorBreak: 0, nthHits: 0, isBoss: true, phase: 0,
                idleYaw: 0, idlePhase: 0, dead: false
            };
            ent.yaw = 0;
            this.enemies.push(ent);
            this.boss = ent;
            BO.Sound.startMusic('boss');
            BO.Sound.playBossIntro();
            BO.Juice?.shake?.(0.22);
            BO.Juice?.screenFlash?.('#dc2626', 0.24, 440);
        }

        _bossPhaseCheck(z) {
            const r = z.rpg;
            const frac = z.hp / z.maxHp;
            const thresholds = [0.66, 0.33];
            while (r.phase < thresholds.length && frac <= thresholds[r.phase]) {
                r.phase++;
                const adds = Math.min(8, 2 + Math.floor(this.run.floor / 5));
                for (let i = 0; i < adds; i++) {
                    const spot = this.layout.camps[i % Math.max(1, this.layout.camps.length)] || { x: 0, z: 0 };
                    const archetype = i === 0 && r.boss.escort ? r.boss.escort : this._pickArchetype();
                    this._spawnEnemy(archetype, spot.x, spot.z, { aggro: true });
                }
                z.stunTimer = Math.max(z.stunTimer, 0.6);
                BO.FX.spawnExplosion(z.pos.clone().add(CAMERA_LIGHT_UP), 5, 0xfbbf24);
                BO.Sound.playBossIntro();
                BO.Events.emit('hud:toast', { text: `${r.boss.name} — PHASE ${r.phase + 1}: IT CALLS FOR AID!`, color: '#fbbf24' });
            }
        }

        _spawnFx(pos, color) {
            BO.FX.spawnParticles(pos.clone().add(CAMERA_LIGHT_UP), 18, color, 4.5, 2, 0.6, 1.4);
        }

        _addProp(group) {
            BO.World.scene.add(group);
            const o = { group };
            this.props.push(o);
            return o;
        }

        _glowMat(hex, opacity = 0.9) { return new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity }); }

        _spawnBeacon(x, z) {
            const g = new THREE.Group();
            const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.25, 32), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.35 }));
            pad.position.y = 0.125;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.07, 8, 40), this._glowMat(0x4ade80));
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.3;
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 9, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
            beam.position.y = 4.6;
            g.add(pad, ring, beam);
            g.position.set(x, 0, z);
            this._addProp(g);
            this.beacon = { x, z, group: g, ring, beam };
        }

        _spawnCampfire(x, z) {
            const g = new THREE.Group();
            for (let i = 0; i < 6; i++) {
                const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 6), new THREE.MeshStandardMaterial({ color: 0x3f2a1a, roughness: 0.9 }));
                log.rotation.z = Math.PI / 2;
                log.rotation.y = (i / 6) * Math.PI;
                log.position.y = 0.12;
                g.add(log);
            }
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 10), this._glowMat(0xfb923c, 0.85));
            flame.position.y = 0.55;
            g.add(flame);
            const light = new THREE.PointLight(0xff8a3d, 1.6, 12);
            light.position.y = 1.2;
            g.add(light);
            g.position.set(x, 0, z);
            const o = this._addProp(g);
            o.flame = flame;
            o.light = light;
        }

        _spawnAltar(x, z) {
            const g = new THREE.Group();
            const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 1.0, 8), new THREE.MeshStandardMaterial({ color: 0x1e1b2e, metalness: 0.4, roughness: 0.5 }));
            base.position.y = 0.5;
            const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), this._glowMat(0xc084fc, 0.95));
            gem.position.y = 1.7;
            const light = new THREE.PointLight(0xc084fc, 1.4, 10);
            light.position.y = 1.8;
            g.add(base, gem, light);
            g.position.set(x, 0, z);
            this._addProp(g);
            this.altar = { x, z, group: g, gem, used: false };
        }

        _spawnChest(x, z) {
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.9), new THREE.MeshStandardMaterial({ color: 0x3b2a12, metalness: 0.5, roughness: 0.45 }));
            body.position.y = 0.4;
            const lid = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.25, 0.95), new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.85, roughness: 0.25 }));
            lid.position.y = 0.92;
            const glow = new THREE.PointLight(0xfde047, 1.2, 7);
            glow.position.y = 1.4;
            g.add(body, lid, glow);
            g.position.set(x, 0, z);
            this._addProp(g);
            this.chest = { x, z, group: g, lid, opened: false, kind: 'chest' };
        }

        _spawnCache(x, y, z) {
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.35 }));
            body.position.y = 0.3;
            const strip = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.62), this._glowMat(0x22d3ee));
            strip.position.y = 0.45;
            g.add(body, strip);
            g.position.set(x, y, z);
            this._addProp(g);
            this.cache = { x, y, z, group: g, opened: false, kind: 'cache' };
        }

        /* ======================================================================
           Damage, statuses & reactions
        ====================================================================== */

        isAlive(z) { return !!(z && z.alive && z.rpg && !z.rpg.dead); }

        hasStatus(z, id) { return !!(z.rpg && z.rpg.statuses[id] && z.rpg.statuses[id].t > 0); }

        enemiesInRadius(pos, radius, filter = null) {
            const out = [];
            for (const z of this.enemies) {
                if (!this.isAlive(z)) continue;
                if (BO.Math.dist2D(z.pos.x, z.pos.z, pos.x, pos.z) <= radius + z.radius && (!filter || filter(z))) out.push(z);
            }
            return out;
        }

        nearestEnemies(pos, radius, count, exclude = null) {
            return this.enemies
                .filter((z) => this.isAlive(z) && (!exclude || !exclude.has(z)) && BO.Math.dist2D(z.pos.x, z.pos.z, pos.x, pos.z) <= radius)
                .sort((a, b) => BO.Math.dist2D(a.pos.x, a.pos.z, pos.x, pos.z) - BO.Math.dist2D(b.pos.x, b.pos.z, pos.x, pos.z))
                .slice(0, count);
        }

        aggro(z) {
            if (!z || !z.rpg || z.rpg.aggro) return;
            z.rpg.aggro = true;
            // Pack aggro: nearby idle allies join in.
            for (const o of this.enemies) {
                if (o === z || !this.isAlive(o) || o.rpg.aggro) continue;
                if (BO.Math.dist2D(o.pos.x, o.pos.z, z.pos.x, z.pos.z) <= PACK_RADIUS) o.rpg.aggro = true;
            }
        }

        /**
         * Single entry point for every point of player damage dealt to an enemy.
         * ctx: { source:'gun'|'melee'|'ability'|'reaction'|'dot'|'conduct', hitbox, isHead, dir, weapon, weak }
         * Returns the HP actually removed (0 if none) and sets ctx.killed.
         */
        dealDamage(z, amount, ctx = {}) {
            if (!this.isAlive(z) || amount <= 0) return 0;
            const s = this.stats;
            const r = z.rpg;
            this.aggro(z);
            let mult = s.dmgMult * (1 + this.momentum.stacks * this.D.MOMENTUM.dmgPerStack);
            const src = ctx.source || 'gun';
            if (src === 'gun' || src === 'melee') {
                mult *= src === 'gun' ? s.weaponPower * (1 + s.gunDmg / 100) : s.abilityPower;
                if (ctx.isHead) mult *= 1 + s.headDmg / 100 + (s.talents.has('marksman') ? 0.35 : 0);
                else if (s.bodyDmg) mult *= Math.max(0.1, 1 + s.bodyDmg / 100);
                if (s.talents.has('shotgun_doctrine') && ctx.weapon && /shotgun/i.test(ctx.weapon.stats.category || '')) mult *= 1.3;
                if (s.kitId === 'pyrotech' && this.hasStatus(z, 'burn')) mult *= 1.2;
                if (this.ability.ultActive > 0 && this.ability.ultId === 'juggernaut') mult *= this.D.CLASSES.vanguard.abilities.ultimate.gunMult;
                if (r.affixes.includes('warded') && r.wardBroken <= 0 && r.armorBreak <= 0 && !this.hasStatus(z, 'expose')) mult *= 0.4;
            } else if (src === 'ability' || src === 'reaction') {
                mult *= s.abilityPower * (1 + s.abilityDmg / 100);
                if (src === 'reaction') mult *= 1 + s.reactionDmg / 100;
                if (ctx.weak) mult *= 1.5;
                if (r.affixes.includes('warded')) r.wardBroken = 5;
            } else if (src === 'dot') {
                mult *= s.abilityPower;
            }
            if (r.elite || r.isBoss) mult *= 1 + s.eliteDmg / 100;
            if (this.run.boons.has('executioner') && z.hp < z.maxHp * 0.3) mult *= 1.5;
            if (this.hasStatus(z, 'expose')) mult *= this.D.STATUSES.expose.dmgTakenMult;
            let hitbox = ctx.hitbox || 'torso';
            if (hitbox === 'shield' && (r.armorBreak > 0 || this.hasStatus(z, 'expose'))) hitbox = 'torso';
            const kind = src === 'melee' ? 'melee' : (src === 'gun' ? 'bullet' : (ctx.element === 'burn' ? 'fire' : 'explosive'));
            const before = z.hp;
            const killed = z.takeDamage(amount * mult, hitbox, !!ctx.isHead, ctx.dir || null, kind);
            const dealt = Math.max(0, before - Math.max(0, z.hp));
            r.lastHitAt = this.elapsed;
            ctx.killed = killed;
            if (dealt > 0) {
                const charge = BO.Math.clamp(1 + s.ultCharge / 100, 0.2, 3);
                if (this.ability.ultActive <= 0) this.ability.ult = Math.min(1, this.ability.ult + (dealt / 1100) * charge);
                if (BO.RPGUI) BO.RPGUI.damageNumber(z, dealt, ctx);
            }
            if (r.isBoss && !killed) this._bossPhaseCheck(z);
            if (killed) this._onEnemyKilled(z, ctx);
            return dealt;
        }

        applyStatus(z, id, ctx = {}) {
            if (!this.isAlive(z)) return;
            const st = this.D.STATUSES[id];
            if (!st) return;
            const dur = st.duration * (1 + this.stats.statusDur / 100) * (ctx.durMult || 1);
            const cur = z.rpg.statuses[id];
            z.rpg.statuses[id] = { t: Math.max(cur ? cur.t : 0, dur), tick: cur ? cur.tick : 1 };
            if (id === 'chill') z.slowTimer = Math.max(z.slowTimer || 0, dur);
            if (id === 'expose' && z.rpg.affixes.includes('warded')) z.rpg.wardBroken = Math.max(z.rpg.wardBroken, dur);
            this.aggro(z);
            BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 6, st.hex, 2.6, 1.5, 0.45, 1.0);
        }

        /** Primers can roll the Prism Core extra status. */
        applyPrimer(z, ids, ctx = {}) {
            for (const id of ids) this.applyStatus(z, id, ctx);
            if (this.stats.prismPrimer && this.isAlive(z)) {
                const extra = this.D.STATUS_ORDER.filter((s) => !ids.includes(s));
                if (extra.length) this.applyStatus(z, BO.Math.pick(extra), ctx);
            }
        }

        /**
         * Consumes every status on z and triggers its reaction.
         * detonatorDealt = damage the detonating hit dealt (Shatter scales with it).
         */
        detonate(z, detonatorDealt = 0) {
            if (!z || !z.rpg) return 0;
            const ids = this.D.STATUS_ORDER.filter((id) => this.hasStatus(z, id));
            if (!ids.length) return 0;
            for (const id of ids) {
                delete z.rpg.statuses[id];
                if (id === 'chill') z.slowTimer = 0;
            }
            const reps = this.stats.doubleReactions ? 2 : 1;
            let count = 0;
            for (const id of ids) {
                for (let k = 0; k < reps; k++) {
                    this._react(id, z, detonatorDealt);
                    count++;
                }
            }
            this.run.reactions += count;
            this._trackContract('reactions', count);
            this.Profile.data.stats.reactions += count;
            if (this.run.boons.has('reactive_mend')) this.heal(3 * count);
            return count;
        }

        _react(statusId, z, detonatorDealt) {
            const D = this.D;
            const s = this.stats;
            const reaction = D.REACTIONS[D.STATUSES[statusId].reaction];
            const weak = !!(z.rpg && z.rpg.arch && z.rpg.arch.weak === statusId);
            const pos = z.pos.clone();
            if (BO.RPGUI) BO.RPGUI.reactionText(z, reaction, weak);
            switch (reaction.id) {
                case 'combust': {
                    const radius = reaction.radius * (s.talents.has('combustion_engine') ? 1.6 : 1);
                    BO.FX.spawnExplosion(pos.clone().add(CAMERA_LIGHT_UP), radius, 0xfb923c);
                    BO.Sound.playExplosion(0.55);
                    for (const o of this.enemiesInRadius(pos, radius)) {
                        this.dealDamage(o, reaction.damage, { source: 'reaction', element: 'burn', weak: o === z ? weak : (o.rpg.arch.weak === 'burn') });
                        if (s.talents.has('wildfire') && this.isAlive(o)) this.applyStatus(o, 'burn');
                    }
                    break;
                }
                case 'shatter': {
                    const brittle = s.talents.has('brittle');
                    const bonus = Math.max(25, detonatorDealt) * (brittle ? 2 : 1) * reaction.bonusMult;
                    BO.FX.spawnParticles(pos.clone().add(CAMERA_LIGHT_UP), 26, 0x7dd3fc, 6, 8, 0.6, 1.4);
                    BO.Sound.playHitmarker(true, false);
                    if (this.isAlive(z)) {
                        z.frozenTimer = Math.max(z.frozenTimer || 0, brittle ? 3 : reaction.freeze);
                        this.dealDamage(z, bonus, { source: 'reaction', element: 'chill', weak });
                    } else {
                        // A frozen corpse bursts into shards that hit everything within 4 m.
                        for (const o of this.enemiesInRadius(pos, 4)) {
                            this.dealDamage(o, bonus * 0.6, { source: 'reaction', element: 'chill', weak: o.rpg.arch.weak === 'chill' });
                            if (this.isAlive(o)) o.frozenTimer = Math.max(o.frozenTimer || 0, 0.6);
                        }
                    }
                    break;
                }
                case 'overload': {
                    const supr = s.talents.has('superconductor');
                    const targets = this.nearestEnemies(pos, reaction.radius, supr ? 5 : reaction.arcs, new Set([z]));
                    const from = pos.clone().add(new THREE.Vector3(0, 1.3, 0));
                    for (const o of targets) {
                        BO.FX.spawnTracer(from, o.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfde047, 0.05, 0.16);
                        this.dealDamage(o, reaction.damage * (supr ? 1.4 : 1), { source: 'reaction', element: 'shock', weak: o.rpg.arch.weak === 'shock' || (o === z && weak) });
                    }
                    if (!targets.length && this.isAlive(z)) this.dealDamage(z, reaction.damage * 0.75, { source: 'reaction', element: 'shock', weak });
                    BO.Sound.playTrapZap();
                    break;
                }
                case 'rupture': {
                    const dmg = reaction.damage * (s.talents.has('rupture_specialist') ? 2 : 1);
                    BO.FX.spawnParticles(pos.clone().add(CAMERA_LIGHT_UP), 20, 0xf9a8d4, 5, 6, 0.5, 1.3);
                    if (this.isAlive(z)) {
                        z.rpg.armorBreak = reaction.armorBreak;
                        this.dealDamage(z, dmg, { source: 'reaction', element: 'expose', weak });
                    } else {
                        // The rupture shockwave hits the nearest enemy instead and breaks its armour.
                        const o = this.nearestEnemies(pos, 5, 1)[0];
                        if (o) {
                            o.rpg.armorBreak = reaction.armorBreak;
                            BO.FX.spawnTracer(pos.clone().add(new THREE.Vector3(0, 1.1, 0)), o.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xf9a8d4, 0.05, 0.18);
                            this.dealDamage(o, dmg * 0.7, { source: 'reaction', element: 'expose', weak: o.rpg.arch.weak === 'expose' });
                        }
                    }
                    break;
                }
                default:
                    break;
            }
            if (this.run.boons.has('chain_reaction') && this.isAlive(z) && Math.random() < 0.35) this.applyStatus(z, statusId);
        }

        _onGunHit(z, dmg, hitbox, weapon, impactPos, dir) {
            if (z && z.rpgProp) {
                BO.RPGItems?.damageProp(z.rpgProp, dmg);
                return !!z.rpgProp.dead;
            }
            if (!this.isAlive(z)) return false;
            const s = this.stats;
            const isMelee = !!(weapon && (weapon.id === 'knife' || (weapon.stats && weapon.stats.kind === 'melee')));
            const isHead = hitbox === 'head' && !(z.spec.bodySpec && z.spec.bodySpec.headless);
            const ctx = { source: isMelee ? 'melee' : 'gun', hitbox, isHead, dir, weapon };
            const dealt = this.dealDamage(z, dmg, ctx);
            if (dealt > 0 && this.run.boons.has('vampiric_rounds')) this.heal(dealt * 0.015);
            if (dealt > 0 && BO.RPGItems) BO.RPGItems.onGunHit(z, dealt, hitbox, weapon, impactPos, dir);
            if (ctx.killed || !this.isAlive(z)) return !!ctx.killed;

            // On-hit procs.
            const roll = (pct) => pct > 0 && Math.random() * 100 < pct;
            if (s.alwaysBurn || roll(s.burnChance)) this.applyStatus(z, 'burn');
            if (roll(s.chillChance)) this.applyStatus(z, 'chill');
            if (roll(s.shockChance)) this.applyStatus(z, 'shock');
            if (roll(s.exposeChance) || (isHead && this.run.boons.has('exposing_rounds'))) this.applyStatus(z, 'expose');
            if (this.ability.ultActive > 0 && this.ability.ultId === 'juggernaut') this.applyStatus(z, 'expose');
            if (s.headDetonate && isHead) {
                this.applyStatus(z, 'chill');
                this.detonate(z, dealt);
            }
            if (s.everyNthDetonate > 0 && this.isAlive(z)) {
                z.rpg.nthHits++;
                if (z.rpg.nthHits % s.everyNthDetonate === 0) {
                    this.applyStatus(z, 'shock');
                    this.detonate(z, dealt);
                }
            }
            // Tempest passive: Static conducts gun damage from Shocked targets.
            if (s.kitId === 'tempest' && dealt > 0 && this.isAlive(z) && this.hasStatus(z, 'shock')) {
                const pct = s.talents.has('static_field') ? 0.4 : 0.2;
                const t = this.nearestEnemies(z.pos, 8, 1, new Set([z]))[0];
                if (t) {
                    BO.FX.spawnTracer(z.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), t.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfde047, 0.025, 0.08);
                    this.dealDamage(t, dealt * pct, { source: 'conduct' });
                }
            }
            return false;
        }

        _onExplode(pos, radius, damage) {
            for (const z of this.enemiesInRadius(pos, radius)) {
                const d = BO.Math.dist2D(z.pos.x, z.pos.z, pos.x, pos.z);
                this.dealDamage(z, damage * (1 - (d / radius) * 0.5), { source: 'ability' });
            }
            if (BO.RPGItems) BO.RPGItems.onExplosionAt(pos, radius, damage);
        }

        _onEnemyKilled(z, ctx = {}) {
            const r = z.rpg;
            if (!r || r.dead) return;
            r.dead = true;
            const s = this.stats;
            const run = this.run;
            run.kills++;
            this.Profile.data.stats.kills++;
            if (r.aura) r.aura.visible = false;
            const selfDestruct = !!ctx.selfDestruct;

            if (!selfDestruct) {
                this._trackContract('kills');
                if (r.elite) this._trackContract('elites');
                const guide = this.Profile.data.fieldGuide;
                const key = r.isBoss ? r.boss.id : r.arch.id;
                guide[key] = (guide[key] || 0) + 1;
                // Momentum.
                const cap = run.boons.has('adrenal') ? 15 : this.D.MOMENTUM.max;
                this.momentum.stacks = Math.min(cap, this.momentum.stacks + 1);
                this.momentum.decay = 0;
                // Healing on kill.
                let heal = s.killHeal + (run.boons.has('vampiric_rounds') ? 3 : 0) + this.P.maxHp * (s.killHealPct / 100);
                if (heal > 0) this.heal(heal);
                // XP & gold.
                const xpBase = (r.arch.xp || 10) * (r.elite ? this.D.ELITE.xpMult : 1);
                this._awardXP(xpBase, z.pos, null);
                const midasMult = BO.RPGItems?.has('midas_crown') ? 1.45 : 1;
                const goldBase = (r.arch.gold || 3) * (r.elite ? this.D.ELITE.goldMult : 1) * midasMult;
                this._dropGold(z.pos, goldBase);
                this._maybeDropItem(z);
                if (BO.RPGItems) BO.RPGItems.onEnemyKilled(z, z.pos);
                BO.Sound.playHitmarker(!!ctx.isHead, true);
                BO.Events.emit('hud:hitmarker', { isHeadshot: !!ctx.isHead, isKill: true });
            }
            if (r.affixes.includes('volatile')) {
                const pos = z.pos.clone();
                BO.FX.spawnParticles(pos.clone().add(CAMERA_LIGHT_UP), 16, 0xf59e0b, 2.5, 0, 0.8, 1.6);
                this.timers.push({
                    t: 0.8,
                    fn: () => {
                        BO.FX.spawnExplosion(pos.clone().add(CAMERA_LIGHT_UP), 4.2, 0xf59e0b);
                        BO.Sound.playExplosion(0.7);
                        if (this.P.alive && BO.Math.dist2D(this.P.pos.x, this.P.pos.z, pos.x, pos.z) < 4.2) {
                            this.P.takeDamage(z.damage * 1.4, pos, true);
                        }
                    }
                });
            }
            if (r.isBoss) {
                this._trackContract('bosses');
                if (r.boss.id === 'boss_hydra_matron') this._trackContract('matron');
                run.bossKills++;
                this.Profile.data.stats.bossKills++;
                this.boss = null;
                BO.Events.emit('hud:banner', { title: `${r.boss.name} DEFEATED`, sub: 'THE WAY DEEPER IS OPEN • A BEACON HAS APPEARED', color: '#fbbf24' });
                BO.Sound.playPaPChime();
            }
        }

        heal(amount) {
            const P = this.P;
            if (!P.alive || amount <= 0) return;
            P.hp = Math.min(P.maxHp, P.hp + amount);
        }

        /* ======================================================================
           Player damage hooks (called from PlayerController.takeDamage)
        ====================================================================== */

        modifyIncomingDamage(amount, attackerPos, attackerEntity) {
            if (!this.active || !this.stats) return amount;
            const s = this.stats;
            const P = this.P;
            let a = amount * s.dmgTakenMult;
            if (s.kitId === 'vanguard' && attackerPos && BO.Math.dist2D(attackerPos.x, attackerPos.z, P.pos.x, P.pos.z) <= 4) a *= 0.8;
            if (this.ability.ultActive > 0 && this.ability.ultId === 'juggernaut') a *= 1 - this.D.CLASSES.vanguard.abilities.ultimate.dr;
            if (s.talents.has('heat_shield') && this.enemiesInRadius(P.pos, 10, (z) => this.hasStatus(z, 'burn')).length) a *= 0.8;
            if (BO.RPGItems) a = BO.RPGItems.onPlayerDamaged(a, attackerPos, attackerEntity);
            if (a > 0.5) {
                const loss = Math.round(this.D.MOMENTUM.hitLoss * (1 - BO.Math.clamp(s.momentumKeep / 100, 0, 0.9)));
                this.momentum.stacks = Math.max(0, this.momentum.stacks - Math.max(1, loss));
            }
            return a;
        }

        /** Returns true if death was prevented (Last Bastion, Second Wind, Field Medic, Dead Cat). */
        tryPreventDeath(P) {
            if (!this.active) return false;
            const r = this.run;
            const s = this.stats;
            if (s.talents.has('last_bastion') && r.lastBastionFloor !== r.floor) {
                r.lastBastionFloor = r.floor;
                P.hp = 1;
                BO.RPGAbilities.startUltimate(true);
                BO.Events.emit('hud:banner', { title: 'LAST BASTION', sub: 'JUGGERNAUT PROTOCOL ENGAGED', color: '#f472b6' });
                return true;
            }
            if (r.boons.has('second_wind') && !r.secondWindUsed) {
                r.secondWindUsed = true;
                P.hp = Math.round(P.maxHp * 0.3);
                P.reviveGraceTimer = 1.5;
                BO.Events.emit('hud:banner', { title: 'SECOND WIND', sub: 'BACK ON YOUR FEET AT 30% HP', color: '#4ade80' });
                return true;
            }
            if (s.fieldMedic && !r.fieldMedicUsed) {
                r.fieldMedicUsed = true;
                P.hp = Math.round(P.maxHp * 0.25);
                P.reviveGraceTimer = 1.5;
                BO.Events.emit('hud:banner', { title: 'FIELD MEDIC', sub: 'STABILISED AT 25% HP — ONCE PER DELVE', color: '#4ade80' });
                return true;
            }
            if ((r.livesLeft || 0) > 0) {
                r.livesLeft--;
                P.hp = Math.max(1, P.maxHp);
                P.reviveGraceTimer = 2.0;
                BO.FX.spawnParticles(P.pos.clone().add(CAMERA_LIGHT_UP), 28, 0x94a3b8, 5, -1, 0.9, 1.4);
                BO.Sound.playPerkBuy();
                BO.Events.emit('hud:banner', { title: 'DEAD CAT — NINE LIVES', sub: `${r.livesLeft} ${r.livesLeft === 1 ? 'LIFE' : 'LIVES'} REMAINING`, color: '#cbd5e1' });
                return true;
            }
            return false;
        }

        /* ======================================================================
           Rewards & loot
        ====================================================================== */

        _awardXP(base, pos, label) {
            if (base <= 0) return 0;
            const D = this.D;
            const rec = this.Profile.cls;
            const rec_lv = rec.level;
            const recommended = D.recommendedLevel(this.run.floor);
            const catchup = rec_lv < recommended ? 1 + 0.25 * Math.min(3, recommended - rec_lv) : 1;
            const amt = Math.round(base * D.depthRewardMult(this.run.floor) * (1 + this.momentum.stacks * D.MOMENTUM.xpPerStack)
                * (1 + this.stats.xpGain / 100) * this._difficulty().reward * catchup * (this._door().xp || 1));
            this.run.xpEarned += amt;
            const levels = this.Profile.addXP(amt);
            if (BO.RPGUI && pos) BO.RPGUI.floatText(pos, `+${amt} XP`, '#a78bfa', 13, 1.9);
            if (label && BO.RPGUI) BO.RPGUI.floatText(this.P.pos, `${label} +${amt} XP`, '#a78bfa', 16, 2.2);
            if (levels.length) this._onLevelUp(levels);
            return amt;
        }

        _onLevelUp(levels) {
            const lv = levels[levels.length - 1];
            this.run.levelsGained += levels.length;
            this.recomputeStats();
            this.P.hp = Math.min(this.P.maxHp, this.P.hp + this.P.maxHp * 0.3);
            const tierUnlocked = levels.some((l) => this.D.TALENT_TIER_LEVELS.includes(l));
            BO.Sound.playRankUp();
            BO.FX.spawnParticles(this.P.pos.clone().add(CAMERA_LIGHT_UP), 30, 0xa78bfa, 5, -2, 0.9, 1.4);
            BO.Events.emit('hud:toast', { text: tierUnlocked ? `LEVEL ${lv} — TALENT READY: PRESS [TAB]` : `LEVEL ${lv} REACHED`, color: '#a78bfa' });
            BO.Events.emit('hud:banner', {
                title: `LEVEL ${lv}`,
                sub: tierUnlocked ? 'TALENT TIER UNLOCKED — OPEN THE PACK [TAB] TO CHOOSE' : `+MAX HP • STRONGER POTIONS • ABILITY POWER ${Math.round(this.stats.abilityPower * 100)}%`,
                color: '#a78bfa'
            });
            this.Profile.save();
        }

        _goldMult() {
            return this.D.depthRewardMult(this.run.floor) * this._difficulty().reward * (1 + this.stats.goldFind / 100)
                * (1 + this.momentum.stacks * this.D.MOMENTUM.goldPerStack) * (this._door().gold || 1);
        }

        _door() { return BO.RPGDoors.get(this.run?.door); }

        _applyDoor() {
            const r = this.run;
            const door = this._door();
            const L = this.layout;
            // The chest is part of the room, so it is rebuilt when a suspended floor resumes.
            // Only one chest per floor is tracked, so a room that already has one pays out in gold instead.
            if (door.chest && r.roomType !== 'boss' && !this.chest) this._spawnChest(L.center.x + 3, L.center.z + 3);
            if (r.doorApplied) return;
            r.doorApplied = true;
            if (door.chest && (r.roomType === 'boss' || this.chest?.x !== L.center.x + 3)) {
                this._dropGold(new THREE.Vector3(L.center.x, 0, L.center.z + 3), 60);
            }
            if (door.potion) {
                r.potions = Math.min(this.stats.potionsMax, r.potions + door.potion);
                BO.Events.emit('hud:toast', { text: 'CLOVER DOOR — POTION REFILLED', color: door.color });
            }
        }

        _dropGold(pos, base) {
            const total = Math.max(1, Math.round(base * this._goldMult()));
            const coins = Math.min(4, 1 + Math.floor(total / 12));
            for (let i = 0; i < coins; i++) {
                const v = i === coins - 1 ? total - Math.floor(total / coins) * (coins - 1) : Math.floor(total / coins);
                const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), this._glowMat(0xfde047, 1));
                const p = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.9, (Math.random() - 0.5) * 1.2));
                mesh.position.copy(p);
                BO.World.scene.add(mesh);
                this.pickups.push({ kind: 'gold', value: v, mesh, pos: p, vel: new THREE.Vector3((Math.random() - 0.5) * 3, 3.5, (Math.random() - 0.5) * 3), life: 40 });
            }
        }

        _maybeDropItem(z) {
            const r = z.rpg;
            const s = this.stats;
            const f = this.run.floor;
            if (r.isBoss) {
                this._dropItem(z.pos, this.Profile.rollItem({ floor: f + 2, minRarity: 'epic', rarityBonus: 0.2 }));
                const extra = { floor: f + 1, minRarity: 'rare' };
                if (r.boss.set) {
                    extra.set = r.boss.set;
                    const p = this.Profile.data;
                    const equipped = Object.values(p.classes).flatMap((rec) => Object.values(rec.equip));
                    extra.excludeLegendaries = new Set([...equipped, ...p.stash, ...this.run.pack].map((item) => item?.legendary));
                }
                this._dropItem(z.pos.clone().add(new THREE.Vector3(1.5, 0, 0)), this.Profile.rollItem(extra));
                return;
            }
            if (r.elite) {
                this._dropItem(z.pos, this.Profile.rollItem({ floor: f + 1, minRarity: 'rare', rarityBonus: 0.1 }));
                return;
            }
            const chance = 0.075 * (1 + s.dropBonus) * (this.run.roomType === 'ambush' ? 1.3 : 1);
            if (Math.random() < chance) this._dropItem(z.pos, this.Profile.rollItem({ floor: f }));
        }

        _dropItem(pos, item) {
            const rar = this.Profile.rarity(item);
            const g = new THREE.Group();
            const core = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), this._glowMat(rar.hex, 0.95));
            core.position.y = 0.7;
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, item.rarity === 'common' ? 1.4 : 3.6, 8, 1, true),
                new THREE.MeshBasicMaterial({ color: rar.hex, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
            beam.position.y = item.rarity === 'common' ? 0.9 : 2.0;
            g.add(core, beam);
            const p = pos.clone();
            p.y = BO.World.getGroundHeight(p.x, p.z, p.y + 1.0);
            g.position.copy(p);
            BO.World.scene.add(g);
            this.pickups.push({ kind: 'item', item, group: g, core, pos: p, life: Infinity });
            if (item.rarity === 'legendary') {
                BO.Events.emit('hud:toast', { text: `★ LEGENDARY DROP — ${item.name.toUpperCase()}`, color: '#fbbf24' });
                BO.Sound.playPaPChime();
            } else if (item.rarity === 'epic') {
                BO.Sound.playPowerUp();
            }
        }

        _collectItem(pk) {
            const it = pk.item;
            const run = this.run;
            if (it.rarity === 'common' && this.Profile.data.autoSalvage) {
                const sc = this.Profile.scrapValue(it);
                run.scrap += sc;
                if (BO.RPGUI) BO.RPGUI.floatText(pk.pos, `+${sc} SCRAP (auto-salvaged ${it.name})`, '#94a3b8', 13, 2);
                this._removePickup(pk);
                return;
            }
            if (run.pack.length >= this.stats.packSlots) {
                if (BO.RPGUI) BO.RPGUI.openPackFull(it, (dropUid) => {
                    if (dropUid === it.uid) return; // leave the new item on the floor
                    const idx = run.pack.findIndex((x) => x.uid === dropUid);
                    if (idx < 0) return;
                    const dropped = run.pack.splice(idx, 1)[0];
                    run.scrap += this.Profile.scrapValue(dropped);
                    run.pack.push(it);
                    this._removePickup(pk);
                    BO.Events.emit('hud:toast', { text: `PICKED UP ${it.name.toUpperCase()} • SALVAGED ${dropped.name.toUpperCase()}`, color: this.Profile.rarity(it).color });
                });
                return;
            }
            run.pack.push(it);
            if (it.legendary) this.Profile.data.stats.legendaries++;
            this._removePickup(pk);
            BO.Sound.playPoints();
            BO.Events.emit('hud:toast', { text: `PICKED UP ${this.Profile.rarity(it).name.toUpperCase()} ${it.name.toUpperCase()} — UNBANKED UNTIL YOU EXTRACT`, color: this.Profile.rarity(it).color });
        }

        _removePickup(pk) {
            const idx = this.pickups.indexOf(pk);
            if (idx >= 0) this.pickups.splice(idx, 1);
            if (pk.mesh && BO.World.scene) BO.World.scene.remove(pk.mesh);
            if (pk.group && BO.World.scene) BO.World.scene.remove(pk.group);
        }

        _openContainer(c) {
            if (c.opened) return;
            c.opened = true;
            this._trackContract('containers');
            const f = this.run.floor;
            if (c.kind === 'chest') {
                c.lid.rotation.x = -1.1;
                c.lid.position.z -= 0.3;
                c.lid.position.y += 0.25;
                const fracture = ['fracture', 'storm'].includes(this.run.roomType);
                this._dropGold(new THREE.Vector3(c.x, 0, c.z), (fracture ? 55 : 30) + f * 6);
                this._dropItem(new THREE.Vector3(c.x + 1.2, 0, c.z + 0.6), this.Profile.rollItem({
                    floor: f + 1, minRarity: fracture ? 'epic' : 'rare', rarityBonus: 0.12
                }));
                BO.Sound.playMysteryBoxJingle();
            } else {
                c.group.children[1].material.color.set(0x334155);
                this._dropGold(new THREE.Vector3(c.x, c.y, c.z), 18 + f * 4);
                this._dropItem(new THREE.Vector3(c.x, c.y, c.z + 0.8), this.Profile.rollItem({ floor: f + 1, rarityBonus: 0.15 }));
                BO.Events.emit('hud:toast', { text: 'HIDDEN CACHE FOUND', color: '#22d3ee' });
                BO.Sound.playPowerUp();
                this._awardXP(20 + f * 3, new THREE.Vector3(c.x, c.y, c.z), null);
            }
        }

        useShrine(choice) {
            const a = this.altar;
            const r = this.run;
            if (!a || a.used) return false;
            if (choice === 'blood') {
                r.shrineHpPenalty = Math.min(0.6, r.shrineHpPenalty + this.D.SHRINE.hpCostPct / 100);
            } else if (choice === 'gold') {
                const cost = this.D.SHRINE.goldCost(r.floor);
                if (r.gold < cost) return false;
                r.gold -= cost;
            } else {
                return false;
            }
            a.used = true;
            a.gem.material.color.set(0x475569);
            this.recomputeStats();
            this._offerBoons('Shrine — choose a Boon');
            return true;
        }

        /* ======================================================================
           Extraction, death, suspend
        ====================================================================== */

        extract() {
            if (!this.active || this.state === 'ended') return;
            const r = this.run;
            const profile = this.Profile;
            const p = profile.data;
            const bonusXp = this._awardXP(50 + 10 * r.floor, null, 'EXTRACTION');
            p.gold += r.gold;
            p.scrap += r.scrap;
            p.stats.goldBanked += r.gold;
            p.stats.extractions++;
            const U = BO.RPGUnlocks;
            p.unlockRecords.extractedFloor = Math.max(p.unlockRecords.extractedFloor || 0, r.floor);
            if (r.curse) U.record(p, 'curseExtractions');
            const legendaries = r.pack.filter((item) => item.rarity === 'legendary').length;
            if (legendaries) U.record(p, 'legendariesBanked', legendaries);
            let soldOverflow = 0;
            const banked = [];
            for (const it of r.pack) {
                if (profile.stashFree() > 0) { p.stash.push(it); banked.push(it); } else {
                    const g = profile.sellValue(it);
                    p.gold += g;
                    soldOverflow += g;
                }
            }
            p.deepest = Math.max(p.deepest, r.floor);
            const contract = this.D.CONTRACTS[r.contract];
            const contractReward = contract && r.contractProgress >= contract.goal ? contract : null;
            if (contractReward) {
                p.gold += contractReward.gold;
                p.scrap += contractReward.scrap;
                p.contractCompletions[r.contract] = (p.contractCompletions[r.contract] || 0) + 1;
            }
            this._finish('extract', { bonusXp, banked, soldOverflow, goldKept: r.gold, scrapKept: r.scrap, contractReward });
        }

        _die() {
            const r = this.run;
            const p = this.Profile.data;
            const kept = Math.floor(r.gold * this.stats.insurance);
            p.gold += kept;
            p.stats.deaths++;
            p.deepest = Math.max(p.deepest, r.floor);
            this._finish('death', { goldKept: kept, goldLost: r.gold - kept, itemsLost: r.pack.slice(), scrapLost: r.scrap });
        }

        _finish(outcome, extra) {
            const r = this.run;
            this.state = 'ended';
            this.Profile.clearRun();
            this.Profile.save();
            const report = Object.assign({
                outcome, classId: r.classId, floor: r.floor, startFloor: r.startFloor, kills: r.kills, reactions: r.reactions,
                xpEarned: r.xpEarned, levelsGained: r.levelsGained, bossKills: r.bossKills, boons: Array.from(r.boons),
                time: BO.Math.formatTime(r.elapsed), gold: r.gold, scrap: r.scrap
            }, extra);
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.RPGUI) BO.RPGUI.showReport(report);
        }

        /** Pause-menu exit: the delve stays suspended at the start of this floor. */
        suspend() {
            if (!this.active || this.state === 'ended') return;
            // The floor-start snapshot saved in _enterFloor is the resume point.
            this.Profile.save();
        }

        /* ======================================================================
           Interaction
        ====================================================================== */

        _updatePrompt() {
            const P = this.P;
            const near = (x, z, d) => BO.Math.dist2D(P.pos.x, P.pos.z, x, z) <= d;
            const kbI = BO.Settings.keyLabel(BO.Settings.getKeybinds().interact);
            this.prompt = null;
            this._interactTarget = null;
            const itemTarget = BO.RPGItems?.getInteractTarget?.(P.pos);
            if (itemTarget) {
                this.prompt = { ...itemTarget.prompt, text: itemTarget.prompt.text.replace('[E]', `[${kbI}]`) };
                this._interactTarget = itemTarget;
                return;
            }
            for (const pk of this.pickups) {
                if (pk.kind !== 'item') continue;
                if (near(pk.pos.x, pk.pos.z, 2.0) && Math.abs(P.pos.y - pk.pos.y) < 1.6) {
                    const rar = this.Profile.rarity(pk.item);
                    this.prompt = { text: `[${kbI}] PICK UP ${rar.name.toUpperCase()} ${pk.item.name.toUpperCase()} (${this.D.ITEM_SLOTS[pk.item.slot].name.toUpperCase()} • ILVL ${pk.item.ilvl})`, affordable: true, color: rar.color };
                    this._interactTarget = { kind: 'item', ref: pk };
                    return;
                }
            }
            for (const c of [this.chest, this.cache]) {
                if (c && !c.opened && near(c.x, c.z, 2.1) && Math.abs(P.pos.y - (c.y || 0)) < 1.6) {
                    const locked = c.kind === 'chest' && this.state !== 'cleared';
                    this.prompt = { text: locked ? 'VAULT CHEST — CLEAR THE ROOM TO OPEN' : `[${kbI}] OPEN ${c.kind === 'chest' ? 'VAULT CHEST' : 'HIDDEN CACHE'}`, affordable: !locked };
                    this._interactTarget = locked ? null : { kind: 'container', ref: c };
                    return;
                }
            }
            const event = this.roomEvent;
            if (event?.canUse() && near(event.pos.x, event.pos.z, 2.8)) {
                this.prompt = { text: `[${kbI}] ${event.room.name.toUpperCase()}`, affordable: true, color: event.room.color };
                this._interactTarget = { kind: 'roomEvent' };
                return;
            }
            if (this.altar && !this.altar.used && near(this.altar.x, this.altar.z, 2.6)) {
                this.prompt = { text: `[${kbI}] COMMUNE WITH THE SHRINE`, affordable: true };
                this._interactTarget = { kind: 'altar' };
                return;
            }
            if (this.beacon && near(this.beacon.x, this.beacon.z, 2.2)) {
                const busy = this.state !== 'cleared';
                this.prompt = { text: busy ? 'EXTRACTION BEACON — CLEAR THE FLOOR FIRST' : `[${kbI}] EXTRACT — BANK ${this.run.gold} GOLD & ${this.run.pack.length} ITEMS`, affordable: !busy };
                this._interactTarget = busy ? null : { kind: 'beacon' };
                return;
            }
            for (const g of this.gates) {
                if (near(g.x, g.standZ, 2.6)) {
                    const door = g.door || BO.RPGDoors.get();
                    const roomName = door.hidden ? 'VEILED' : g.room.name.toUpperCase();
                    const cost = BO.RPGDoors.cost(door, this.run, this.P);
                    const doorNote = door.id === 'standard' ? '' : ` • ${door.name.toUpperCase()}: ${door.desc}`;
                    const timer = Number.isFinite(g.timer) && g.open ? ` • SEALS IN ${Math.ceil(g.timer)}s` : '';
                    if (g.sealed) this.prompt = { text: `${door.name.toUpperCase()} — THE SAND RAN OUT. THIS DOOR IS SEALED`, affordable: false };
                    else if (!g.open) this.prompt = { text: `${roomName} GATE — SEALED UNTIL THE FLOOR IS CLEAR${doorNote}`, affordable: false };
                    else if (cost && !cost.ok) this.prompt = { text: `${door.name.toUpperCase()} — NEEDS ${cost.label}${cost.kind === 'hp' ? ' (TOO WOUNDED)' : ''}${doorNote}`, affordable: false };
                    else this.prompt = { text: `[${kbI}] ENTER ${roomName} ROOM${cost ? ' — PAY ' + cost.label : ''} — ${door.hidden ? 'The room is hidden.' : g.room.desc}${doorNote}${timer}`, affordable: true };
                    const usable = g.open && !g.sealed && (!cost || cost.ok);
                    this._interactTarget = usable ? { kind: 'gate', ref: g } : null;
                    return;
                }
            }
        }

        getPromptText() { return this.prompt; }

        moveSpeedMult() { return BO.RPGItems ? BO.RPGItems.moveSpeedMult() : 1; }
        reloadSpeedMult() { return BO.RPGItems ? BO.RPGItems.reloadSpeedMult() : 1; }

        interact() {
            if (!this.active || this.state === 'transition' || this.state === 'ended') return;
            const t = this._interactTarget;
            if (!t) return;
            if (t.kind === 'rpg_pedestal' || t.kind === 'rpg_locked_chest') BO.RPGItems?.interactWith(t);
            else if (t.kind === 'item') this._collectItem(t.ref);
            else if (t.kind === 'roomEvent') this.roomEvent?.interact();
            else if (t.kind === 'container') this._openContainer(t.ref);
            else if (t.kind === 'gate') this.enterGate(t.ref);
            else if (t.kind === 'beacon' && BO.RPGUI) BO.RPGUI.openExtractConfirm(this.run, () => this.extract());
            else if (t.kind === 'altar' && BO.RPGUI) BO.RPGUI.openShrine(this.run, this.D.SHRINE.goldCost(this.run.floor), (choice) => this.useShrine(choice));
        }

        drinkPotion() {
            const P = this.P;
            const r = this.run;
            if (!this.active || !P.alive || this.ability.potionCd > 0) return;
            if (r.potions <= 0) { BO.Events.emit('hud:toast', { text: 'NO POTIONS LEFT — REST ROOMS REFILL THEM', color: '#ef4444' }); return; }
            if (P.hp >= P.maxHp) { BO.Events.emit('hud:toast', { text: 'ALREADY AT FULL HEALTH', color: '#94a3b8' }); return; }
            r.potions--;
            this.ability.potionCd = 0.8;
            this.heal(P.maxHp * this.stats.potionHealFrac);
            BO.FX.spawnParticles(P.pos.clone().add(CAMERA_LIGHT_UP), 18, 0x4ade80, 3, -3, 0.7, 1.2);
            BO.Sound.playPerkBuy();
        }

        /* ======================================================================
           Update
        ====================================================================== */

        update(dt) {
            if (!this.active || this.state === 'transition' || this.state === 'ended' || !this.run) return;
            this.elapsed += dt;
            this.run.elapsed += dt;
            const P = this.P;

            // Death.
            if (!P.alive) { this._die(); return; }

            // Timers & ability state.
            for (let i = this.timers.length - 1; i >= 0; i--) {
                const t = this.timers[i];
                t.t -= dt;
                if (t.t <= 0) { this.timers.splice(i, 1); t.fn(); }
            }
            BO.RPGAbilities.update(dt);

            // Momentum decay.
            const adrenal = this.run.boons.has('adrenal');
            if (this.momentum.stacks > 0) {
                this.momentum.decay += dt;
                const every = this.D.MOMENTUM.decayEvery * (adrenal ? 2 : 1);
                if (this.momentum.decay >= every) { this.momentum.decay = 0; this.momentum.stacks--; }
            }

            this._updateEnemies(dt);
            this._updateHazards(dt);
            this._updateProjectiles(dt);
            this._updatePickups(dt);
            this._updateProps(dt);
            this._updateWaves(dt);
            if (BO.RPGItems) BO.RPGItems.update(dt);
            this.roomEvent?.update(dt);
            this.vaultArt?.update(this.elapsed);
            if (this.trail) {
                this.trailClock -= dt;
                if (this.trailClock <= 0 && Math.hypot(P.vel.x, P.vel.z) > 1.2 && P.pos.y < 1.3) {
                    BO.FX.spawnParticles(P.pos.clone().addScaledVector(CAMERA_LIGHT_UP, 0.18), 1 + (this.trail.pattern - 2) / 4,
                        new THREE.Color(this.trail.color).getHex(), 0.7, -0.1, 0.35, 0.65);
                    this.trailClock = 0.3;
                }
            }
            if (this.state === 'fighting' && !this.waves && !this.roomEvent?.blocks && this._livingCount() === 0) this._onFloorCleared();
            this._updatePrompt();
        }

        _updateWaves(dt) {
            const w = this.waves;
            if (!w || this.state !== 'fighting') return;
            if (this._livingCount() > 0) return;
            if (w.current >= w.total) { this.waves = null; return; }
            w.delay -= dt;
            if (w.delay > 0) return;
            w.current++;
            w.delay = 2.2;
            const spots = this.layout.ambushSpots;
            for (let i = 0; i < w.perWave; i++) {
                const s = spots[(i + w.current) % spots.length];
                this._spawnEnemy(this._pickArchetype(), s.x + (Math.random() - 0.5) * 2, s.z + (Math.random() - 0.5) * 2, { aggro: true });
            }
            BO.Sound.playRoundStart(w.current);
            BO.Events.emit('hud:toast', { text: `AMBUSH — WAVE ${w.current} / ${w.total}`, color: '#fb923c' });
        }

        _updateEnemies(dt) {
            const P = this.P;
            const crouch = P.crouching;
            const aggroR = crouch ? AGGRO_RADIUS_CROUCH : AGGRO_RADIUS;
            const callbacks = {
                allowProjectiles: true,
                getTarget: (z) => this._aiTarget(z),
                onAttackCustomTarget: () => {},
                onMeleePlayer: (attacker) => {
                    P.takeDamage(attacker.damage, attacker.pos, false, attacker);
                    BO.Sound.playZombieGroan(attacker.soundProfile, 0.9);
                },
                onRangedAttack: (attacker, tx, ty, tz) => this._spawnProjectile(attacker, tx, ty, tz)
            };
            const targets = this._combatEntities || (this._combatEntities = []);
            targets.length = 0;
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const z = this.enemies[i];
                const r = z.rpg;
                // Deaths not caused by player damage (e.g. a bomber detonating itself).
                if (!z.alive && r && !r.dead) this._onEnemyKilled(z, { selfDestruct: true });

                if (z.alive && r) {
                    // Status ticking.
                    for (const id of Object.keys(r.statuses)) {
                        const st = r.statuses[id];
                        st.t -= dt;
                        if (id === 'burn' && st.t > 0) {
                            st.tick -= dt;
                            if (st.tick <= 0) {
                                st.tick = 1;
                                const dps = this.D.STATUSES.burn.dps * (this.stats.talents.has('accelerant') ? 2 : 1) * BO.RPGData.enemyHpMult(this.run.floor) * 0.6;
                                this.dealDamage(z, dps, { source: 'dot', element: 'burn' });
                                if (!this.isAlive(z)) break;
                            }
                        }
                        if (st.t <= 0) delete r.statuses[id];
                    }
                    if (!this.isAlive(z)) continue;
                    if (r.wardBroken > 0) r.wardBroken -= dt;
                    if (r.armorBreak > 0) r.armorBreak -= dt;
                    if (r.aura) r.aura.rotation.z += dt * 2.2;

                    // Aggro by proximity + sight.
                    if (!r.aggro) {
                        const d = BO.Math.dist2D(z.pos.x, z.pos.z, P.pos.x, P.pos.z);
                        if (d < (r.isBoss ? 14 : aggroR) && BO.World.hasLineOfSight(z.pos.x, z.pos.y + 1.4, z.pos.z, P.pos.x, P.pos.y + 1.4, P.pos.z)) this.aggro(z);
                    }

                    // Elite affix: Vampiric regen.
                    if (r.affixes.includes('vampiric') && this.elapsed - r.lastHitAt > 2.5) z.hp = Math.min(z.maxHp, z.hp + z.maxHp * 0.04 * dt);

                    // Healer behaviour.
                    if (r.arch.healer && r.aggro) {
                        r.healCd -= dt;
                        if (r.healCd <= 0) {
                            r.healCd = 4;
                            let healed = 0;
                            for (const o of this.enemiesInRadius(z.pos, 9)) {
                                if (o === z || o.hp >= o.maxHp) continue;
                                o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.14);
                                healed++;
                                BO.FX.spawnTracer(z.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), o.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xef4444, 0.04, 0.3);
                            }
                            if (healed) BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 1.6, 0)), 10, 0xef4444, 2.5, -1, 0.6, 1.2);
                        }
                    }
                }

                if (z.alive && r && !r.aggro) {
                    this._idleTick(z, dt);
                } else {
                    const keep = z.update(dt, this.enemies, callbacks);
                    if (!keep) {
                        z.destroy();
                        this.enemies.splice(i, 1);
                        continue;
                    }
                    // Keep everything inside the arena (blink habits can overshoot).
                    const L = this.layout;
                    z.pos.x = BO.Math.clamp(z.pos.x, -L.hw + 0.8, L.hw - 0.8);
                    z.pos.z = BO.Math.clamp(z.pos.z, -L.hl + 0.8, L.hl - 0.8);
                }
                if (this.isAlive(z)) {
                    targets.push(z);
                }
            }
            BO.Combat.setEntityTargets(targets, BO.RPGItems?.getPropHitMeshes());
        }

        _idleTick(z, dt) {
            const r = z.rpg;
            r.idlePhase += dt;
            z.yaw = r.idleYaw + Math.sin(r.idlePhase * 0.6) * 0.5;
            z.parts.root.position.copy(z.pos);
            z.parts.root.rotation.y = z.yaw;
            BO.CharacterMesh.animateLimbs(z.parts, 0, r.idlePhase * 1.5, 0, 0, 'torso', dt);
        }

        _aiTarget(z) {
            const r = z.rpg;
            if (!r) return null;
            if (r.arch.healer) {
                // Keep ~9 m from the player, drifting toward wounded allies.
                const P = this.P;
                const dx = z.pos.x - P.pos.x, dz = z.pos.z - P.pos.z;
                const d = Math.max(0.1, Math.hypot(dx, dz));
                let tx = z.pos.x, tz = z.pos.z;
                if (d < 9) { tx = z.pos.x + (dx / d) * 4; tz = z.pos.z + (dz / d) * 4; } else {
                    const hurt = this.enemies.find((o) => o !== z && this.isAlive(o) && o.hp < o.maxHp);
                    if (hurt) { tx = hurt.pos.x; tz = hurt.pos.z; }
                }
                const L = this.layout;
                tx = BO.Math.clamp(tx, -L.hw + 2, L.hw - 2);
                tz = BO.Math.clamp(tz, -L.hl + 2, L.hl - 2);
                return { x: tx, y: 0, z: tz, attackRange: 2.2 };
            }
            return null;
        }

        _spawnProjectile(attacker, tx, ty, tz) {
            if (!BO.World.scene) return;
            const hexer = !!(attacker.rpg && attacker.rpg.arch.hexer);
            const col = hexer ? 0xa855f7 : (attacker.attackType === 'acid_spit' ? 0x4ade80 : (attacker.attackType === 'fire_bolt' ? 0xf97316 : 0xc084fc));
            const count = attacker.isBoss ? 3 : 1;
            const origin = new THREE.Vector3(attacker.pos.x, attacker.pos.y + (attacker.isBoss ? 2.0 : 1.4), attacker.pos.z);
            for (let c = 0; c < count; c++) {
                const dir = new THREE.Vector3(tx - origin.x, ty - origin.y, tz - origin.z).normalize();
                if (count > 1) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), (c - 1) * 0.16);
                const mesh = new THREE.Mesh(new THREE.SphereGeometry(attacker.isBoss ? 0.22 : 0.15, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
                mesh.position.copy(origin);
                BO.World.scene.add(mesh);
                this.projectiles.push({ mesh, pos: origin.clone(), vel: dir.multiplyScalar(attacker.isBoss ? 18 : 14), damage: Math.round(attacker.damage * 0.85), life: 3.5, color: col, owner: attacker, hexer });
            }
            BO.Sound.playZombieGroan(attacker.soundProfile, 0.7);
        }

        _updateProjectiles(dt) {
            const P = this.P;
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const ep = this.projectiles[i];
                ep.life -= dt;
                const step = ep.vel.clone().multiplyScalar(dt);
                const len = step.length();
                const hitWall = len > 0 && BO.World.raycastWorld(ep.pos, step.clone().normalize(), len + 0.15);
                ep.pos.add(step);
                ep.mesh.position.copy(ep.pos);
                const blockedByOrbital = BO.RPGItems?.checkProjectileBlock?.(ep);
                const hitPlayer = !blockedByOrbital && P.alive && BO.Math.dist3D(ep.pos.x, ep.pos.y, ep.pos.z, P.pos.x, P.pos.y + 1.1, P.pos.z) < 0.8;
                if (hitPlayer) {
                    P.takeDamage(ep.damage, ep.owner ? ep.owner.pos : ep.pos, false, ep.owner);
                    if (ep.hexer) {
                        this.ability.silenced = 3;
                        BO.Events.emit('hud:toast', { text: 'HEXED — ABILITIES SILENCED FOR 3 S', color: '#a855f7' });
                    }
                    BO.FX.spawnParticles(ep.pos, 8, ep.color, 3.5, 6, 0.4, 1.2);
                }
                if (blockedByOrbital || hitPlayer || hitWall || ep.life <= 0) {
                    if (hitWall) BO.FX.spawnParticles(ep.pos, 6, ep.color, 3, 6, 0.35, 1.0);
                    BO.World.scene.remove(ep.mesh);
                    this.projectiles.splice(i, 1);
                }
            }
        }

        _updatePickups(dt) {
            const P = this.P;
            const target = P.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
            // Once the room is clear (or Magneto owned), every coin flies to the player (no busywork sweeping).
            const magnet = (this.state === 'cleared' || BO.RPGItems?.has?.('magneto')) ? 999 : 5.5;
            for (let i = this.pickups.length - 1; i >= 0; i--) {
                const pk = this.pickups[i];
                if (pk.kind === 'gold') {
                    pk.life -= dt;
                    const d = pk.pos.distanceTo(target);
                    if (d < magnet && P.alive) {
                        const pull = target.clone().sub(pk.pos).normalize().multiplyScalar(Math.max(6, 16 - d * 2));
                        pk.vel.lerp(pull, Math.min(1, dt * 8));
                    } else {
                        pk.vel.y -= 14 * dt;
                    }
                    pk.pos.addScaledVector(pk.vel, dt);
                    const floor = BO.World.getGroundHeight(pk.pos.x, pk.pos.z, pk.pos.y + 0.5) + 0.25;
                    if (pk.pos.y < floor) { pk.pos.y = floor; pk.vel.y = Math.abs(pk.vel.y) * 0.3; pk.vel.x *= 0.7; pk.vel.z *= 0.7; }
                    pk.mesh.position.copy(pk.pos);
                    pk.mesh.rotation.y += dt * 5;
                    if (d < 1.0) {
                        this.run.gold += pk.value;
                        if (BO.RPGUI) BO.RPGUI.floatText(pk.pos, `+${pk.value}g`, '#fde047', 13, 1.2);
                        BO.Sound.playPoints();
                        this._removePickup(pk);
                    } else if (pk.life <= 0 && this.state !== 'cleared') {
                        this._removePickup(pk);
                    }
                } else if (pk.kind === 'item') {
                    pk.core.rotation.y += dt * 1.8;
                    pk.core.position.y = 0.7 + Math.sin(this.elapsed * 3 + i) * 0.08;
                }
            }
        }

        _updateProps(dt) {
            const t = this.elapsed;
            if (this.beacon) {
                this.beacon.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
                this.beacon.beam.material.opacity = this.state === 'cleared' ? 0.22 + Math.sin(t * 4) * 0.06 : 0.06;
            }
            if (this.altar) {
                this.altar.gem.rotation.y += dt * 1.4;
                this.altar.gem.position.y = 1.7 + Math.sin(t * 2) * 0.1;
            }
            for (const o of this.props) {
                if (o.flame) {
                    o.flame.scale.set(1 + Math.sin(t * 13) * 0.08, 1 + Math.sin(t * 9) * 0.15, 1);
                    o.light.intensity = 1.4 + Math.sin(t * 11) * 0.25;
                }
            }
            for (const g of this.gates) {
                if (g.open) g.glow.material.opacity = 0.4 + Math.sin(t * 3 + g.x) * 0.15;
                if (g.open && Number.isFinite(g.timer) && this.state === 'cleared') {
                    g.timer -= dt;
                    if (g.timer <= 0) {
                        g.open = false;
                        g.sealed = true;
                        g.mat.color.set(0x333333);
                        g.mat.opacity = 0.4;
                        g.glow.material.opacity = 0;
                        g.arch.material.emissiveIntensity = 0.05;
                        BO.Events.emit('hud:toast', { text: 'THE HOURGLASS DOOR HAS SEALED', color: g.door.color });
                    } else if (g.timer < 6) {
                        g.glow.material.opacity = Math.sin(t * 18) > 0 ? 0.7 : 0.1; // flicker warning
                    }
                }
            }
            for (let i = this.pools.length - 1; i >= 0; i--) {
                const pool = this.pools[i];
                pool.t -= dt;
                pool.tick -= dt;
                pool.mesh.material.opacity = 0.35 + Math.sin(t * 10 + i) * 0.1;
                if (Math.random() < 0.35) BO.FX.spawnParticles(new THREE.Vector3(pool.x + (Math.random() - 0.5) * pool.r * 1.6, 0.15, pool.z + (Math.random() - 0.5) * pool.r * 1.6), 1, 0xf97316, 1.2, -2, 0.5, 1.0);
                if (pool.tick <= 0) {
                    pool.tick = 0.5;
                    for (const z of this.enemiesInRadius(new THREE.Vector3(pool.x, 0, pool.z), pool.r)) {
                        this.applyPrimer(z, ['burn']);
                        this.dealDamage(z, pool.damage, { source: 'ability', element: 'burn' });
                    }
                }
                if (pool.t <= 0) {
                    BO.World.scene.remove(pool.mesh);
                    this.pools.splice(i, 1);
                }
            }
        }
    }

    BO.RPGMode = new RPGMode();
})(window);
;

/* --- src/ui/RPGUI.js --- */
/* ============================================================================
   BLACKOUT OPS — RPG UI
   - The Haven (hub screen): Delve, Loadout, Talents, Stash, Merchant, Forge,
     Upgrades, Roster
   - In-delve HUD: ability bar, momentum, XP, floor card, boons, potions
   - World UI: enemy health/status bars, damage numbers, reaction callouts
   - Modals: boon pick, pack/character (Tab), pack full, shrine, extract, report
   Styles: css/rpg.css
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = (n) => Math.floor(n || 0).toLocaleString('en-US');
    const HEALTHBAR_POOL = 18;
    const FLOAT_POOL = 48;
    const _proj = new THREE.Vector3();

    const _rpgIco = (d, col) => `<svg class="ui-ico" viewBox="0 0 16 16" fill="none" stroke="${col || 'currentColor'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;vertical-align:-2px" aria-hidden="true">${d}</svg>`;
    const TABS = [
        ['delve', 'Delve', _rpgIco('<path d="M8 2l5 5-5 7-5-7z"/>')],
        ['loadout', 'Loadout', _rpgIco('<path d="M4 3l4-1 4 1 2 4-2 6H4L2 7z"/>')],
        ['talents', 'Talents', _rpgIco('<path d="M8 2l2 4 4.5.7-3.2 3.1.8 4.4L8 12.2 3.9 14.2l.8-4.4L1.5 6.7 6 6z"/>')],
        ['stash', 'Stash', _rpgIco('<rect x="3" y="4" width="10" height="9" rx="1.5"/><path d="M3 7.5h10"/>')],
        ['merchant', 'Merchant', _rpgIco('<circle cx="8" cy="8" r="5.5"/><path d="M8 5v6M5.5 8h5"/>')],
        ['forge', 'Forge', _rpgIco('<path d="M3 11h10M4 11V7l4-3 4 3v4"/>')],
        ['upgrades', 'Haven', _rpgIco('<path d="M2.5 8L8 3l5.5 5M4 7v6h8V7"/>')],
        ['roster', 'Roster', _rpgIco('<circle cx="8" cy="5.5" r="2.5"/><path d="M3.5 13.5a4.5 4.5 0 0 1 9 0"/>')],
        ['contracts', 'Contracts', _rpgIco('<path d="M4 2.5h8v11H4z"/><path d="M6 6h4M6 9h3"/>')],
        ['unlocks', 'Collection', _rpgIco('<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2"/>')]
    ];

    class RPGUI {
        constructor() {
            this.tab = 'delve';
            this.modalOpen = false;
            this.modalClosable = true;
            this.selectedUid = null;
            this.forgeUid = null;
            this.collectionSlot = 'crest';
            this.startFloor = 1;
            this.floats = [];
            this.bars = [];
            this._hudCache = {};
        }

        get D() { return BO.RPGData; }
        get Pr() { return BO.RPGProfile; }
        get M() { return BO.RPGMode; }

        init() {
            // Haven screen.
            this.haven = document.createElement('section');
            this.haven.id = 'rpg-haven';
            this.haven.className = 'rpg-haven hidden';
            document.body.append(this.haven);
            this.haven.addEventListener('click', (e) => this._onHavenClick(e));
            this.haven.addEventListener('change', (e) => this._onHavenChange(e));

            // HUD (inside the shared HUD layer so it hides with it).
            const hudLayer = document.getElementById('hud-layer');
            this.hud = document.createElement('div');
            this.hud.id = 'rpg-hud';
            this.hud.className = 'rpg-hud hidden';
            this.hud.innerHTML = `
                <div class="rpg-floorcard">
                    <div class="rpg-floorcard-top"><span class="rpg-floor-label"></span><span class="rpg-room-chip"></span></div>
                    <div class="rpg-objective"></div>
                    <div class="vault-encounter"></div>
                    <div class="rpg-haul"></div>
                    <div class="rpg-contract-hud"></div>
                    <div class="rpg-boons"></div>
                    <div class="rpg-synergies"></div>
                    <div class="rpg-artifacts-strip"></div>
                </div>
                <div class="rpg-bottom">
                    <div class="rpg-isaac-vitals hidden">
                        <div class="rpg-soulbar"><div class="rpg-soulbar-fill"></div><span class="rpg-soulbar-label"></span></div>
                        <div class="rpg-vital-badges"></div>
                    </div>
                    <div class="rpg-momentum"><div class="rpg-momentum-pips"></div><span class="rpg-momentum-label"></span></div>
                    <div class="rpg-xp"><div class="rpg-xp-fill"></div><span class="rpg-xp-label"></span></div>
                    <div class="rpg-abilities">
                        <div class="rpg-ab rpg-ab-active empty" data-slot="active">
                            <div class="rpg-ab-face"><span class="rpg-ab-glyph">🎲</span><div class="rpg-ab-cd"></div><span class="rpg-ab-cdtext"></span></div>
                            <div class="rpg-charge-pips"></div>
                            <span class="rpg-ab-key">G / C</span>
                            <span class="rpg-ab-name">ACTIVE</span>
                        </div>
                        ${['primer', 'detonator', 'ultimate', 'potion'].map((slot) => `
                        <div class="rpg-ab" data-slot="${slot}">
                            <div class="rpg-ab-face"><span class="rpg-ab-glyph"></span><div class="rpg-ab-cd"></div><span class="rpg-ab-cdtext"></span></div>
                            <span class="rpg-ab-key"></span>
                            <span class="rpg-ab-name"></span>
                        </div>`).join('')}
                        <div class="rpg-ab rpg-ab-pocket empty" data-slot="pocket">
                            <div class="rpg-ab-face"><span class="rpg-ab-glyph">🃏</span><div class="rpg-ab-cd"></div><span class="rpg-ab-cdtext"></span></div>
                            <span class="rpg-ab-key">T</span>
                            <span class="rpg-ab-name">POCKET</span>
                        </div>
                    </div>
                    <div class="rpg-silenced hidden">SILENCED</div>
                </div>`;
            hudLayer.append(this.hud);

            this.world = document.createElement('div');
            this.world.id = 'rpg-world';
            this.world.className = 'rpg-world hidden';
            hudLayer.append(this.world);
            for (let i = 0; i < HEALTHBAR_POOL; i++) {
                const el = document.createElement('div');
                el.className = 'rpg-hb hidden';
                el.innerHTML = '<div class="rpg-hb-name"></div><div class="rpg-hb-track"><div class="rpg-hb-fill"></div></div><div class="rpg-hb-status"></div>';
                this.world.append(el);
                this.bars.push({ el, name: el.children[0], fill: el.children[1].firstChild, status: el.children[2], key: '' });
            }
            for (let i = 0; i < FLOAT_POOL; i++) {
                const el = document.createElement('div');
                el.className = 'rpg-float hidden';
                this.world.append(el);
                this.floats.push({ el, life: 0, max: 1, pos: new THREE.Vector3(), vy: 1 });
            }

            this.modal = document.createElement('div');
            this.modal.id = 'rpg-modal';
            this.modal.className = 'rpg-modal hidden';
            document.body.append(this.modal);
            this.modal.addEventListener('click', (e) => this._onModalClick(e));
            this.modal.addEventListener('input', (e) => {
                if (e.target.matches('[data-bowl]')) e.target.nextElementSibling.value = e.target.value;
            });

            this.fade = document.createElement('div');
            this.fade.id = 'rpg-fade';
            this.fade.className = 'rpg-fade';
            document.body.append(this.fade);

            BO.Events.on('settings:changed', (e) => { if (e.key === 'keybinds') this._hudCache = {}; });
        }

        /* ======================================================================
           Screen routing
        ====================================================================== */

        openHaven(tab) {
            const p = this.Pr.data;
            if (tab) this.tab = tab;
            this.startFloor = p.checkpoints.includes(this.startFloor) ? this.startFloor : Math.max(...p.checkpoints.filter((c) => c <= Math.max(1, p.deepest + 1)), 1);
            BO.Menus.showScreen('rpg_haven');
            this.haven.classList.remove('hidden');
            this.haven.classList.add('rpg-enter');
            setTimeout(() => this.haven.classList.remove('rpg-enter'), 420);
            if (this.Pr.hasCharacter) this.Pr.refreshMerchant();
            this.renderHaven();
            BO.Sound.startMusic('menu');
        }

        /** Called by MenuController.showScreen for every screen change. */
        onScreenChanged(name) {
            if (name !== 'rpg_haven') this.haven.classList.add('hidden');
            const playing = name === 'playing' && BO.State.activeMode === 'rpg';
            this.hud.classList.toggle('hidden', !playing);
            this.world.classList.toggle('hidden', !playing);
            if (!playing && name !== 'rpg_haven') this.closeModal(true);
        }

        /* ======================================================================
           Haven
        ====================================================================== */

        renderHaven() {
            const Pr = this.Pr;
            const p = Pr.data;
            if (!Pr.hasCharacter) { this.haven.innerHTML = this._classPickHtml(true); return; }
            const C = this.D.CLASSES[Pr.classId];
            const rec = Pr.cls;
            const need = Pr.xpNeeded(rec);
            const unspent = Pr.unspentTalentTiers(rec);
            this.haven.style.setProperty('--rpg-accent', C.color);
            const crest = BO.RPGUnlocks.equipped(p, 'crest');
            const frame = BO.RPGUnlocks.equipped(p, 'frame');
            this.haven.style.setProperty('--vault-frame', frame?.color || '#c7a36b');
            this.haven.style.setProperty('--vault-pattern', (8 + (frame?.pattern || 0)) + 'px');
            this.haven.innerHTML = `
                <header class="rpg-top">
                    <div class="rpg-top-left">
                        <button class="btn" data-act="back">← MAIN MENU</button>
                        <div class="rpg-brand"><span class="rpg-brand-kicker">ROGUE LITE • DELVE &amp; EXTRACT</span><div class="rpg-brand-title">THE HAVEN</div></div>
                    </div>
                    <div class="rpg-wallet">
                        <div class="rpg-coin" data-tip-title="Gold" data-tip="Banked gold. Spend it at the Merchant, the Forge and on Haven upgrades. Gold found in a delve is only banked when you extract."><span>${_rpgIco('<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2.2"/>', '#fbbf24')}</span><b>${fmt(p.gold)}</b><small>GOLD</small></div>
                        <div class="rpg-coin rpg-coin-scrap" data-tip-title="Scrap" data-tip="Salvaged materials for the Forge. Common items are salvaged automatically when you pick them up."><span>${_rpgIco('<path d="M3 10l4-6 6 2-3 7z"/>', '#94a3b8')}</span><b>${fmt(p.scrap)}</b><small>SCRAP</small></div>
                        <div class="rpg-charchip" style="--c:${C.color}"><span class="rpg-charchip-ico" style="color:${crest?.color || C.color}">${crest?.icon || C.icon}</span><div><b>${esc(C.name.toUpperCase())}</b><small>LEVEL ${rec.level}${rec.level >= this.D.LEVEL_CAP ? ' • MAX' : ` • ${fmt(rec.xp)} / ${fmt(need)} XP`}</small><div class="rpg-mini-xp"><div style="width:${need ? Math.round((rec.xp / need) * 100) : 100}%"></div></div></div></div>
                    </div>
                </header>
                <div class="rpg-body">
                    <nav class="rpg-nav">
                        ${TABS.map(([id, label, ico]) => `<button class="rpg-nav-btn ${this.tab === id ? 'active' : ''}" data-act="tab" data-tab="${id}"><span>${ico}</span>${label}${id === 'talents' && unspent ? `<em>${unspent}</em>` : ''}${id === 'delve' && p.run ? '<em>!</em>' : ''}</button>`).join('')}
                        <button class="rpg-nav-btn" data-act="gameguide"><span>▤</span>Game Guide</button>
                    </nav>
                    <main class="rpg-main" data-tab="${this.tab}">${this._tabHtml()}</main>
                </div>`;
        }

        _tabHtml() {
            switch (this.tab) {
                case 'loadout': return this._loadoutHtml();
                case 'talents': return this._talentsHtml(false);
                case 'stash': return this._stashHtml();
                case 'merchant': return this._merchantHtml();
                case 'forge': return this._forgeHtml();
                case 'upgrades': return this._upgradesHtml();
                case 'roster': return this._classPickHtml(false);
                case 'contracts': return this._contractsHtml();
                case 'unlocks': return this._collectionHtml();
                default: return this._delveHtml();
            }
        }

        _section(title, sub, body, extraCls = '') {
            return `<section class="rpg-card ${extraCls}"><div class="rpg-card-head"><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>${body}</section>`;
        }

        _delveHtml() {
            const Pr = this.Pr;
            const p = Pr.data;
            const D = this.D;
            const C = D.CLASSES[Pr.classId];
            const s = Pr.computeStats(null);
            const run = p.run && p.run.classId === Pr.classId ? p.run : null;
            const otherRun = p.run && p.run.classId !== Pr.classId ? p.run : null;
            const diff = D.DIFFICULTIES[p.difficulty];
            const contract = D.CONTRACTS[run ? run.contract : p.contract];
            const kb = BO.Settings.getKeybinds();
            const key = (a) => esc(BO.Settings.keyLabel(kb[a]));
            const hero = `
                <div class="rpg-hero" style="--c:${C.color}">
                    <div class="rpg-hero-emblem">${C.icon}</div>
                    <div class="rpg-hero-text">
                        <span class="rpg-kicker">${esc(C.role.toUpperCase())}</span>
                        <h2>${esc(C.name)}</h2>
                        <p>${esc(C.blurb)}</p>
                        <div class="rpg-hero-abilities">
                            ${['primer', 'detonator', 'ultimate'].map((slot) => {
                                const a = C.abilities[slot];
                                const k = slot === 'primer' ? key('rpgAbility1') : slot === 'detonator' ? key('rpgAbility2') : key('rpgUltimate');
                                return `<div class="rpg-hero-ab" data-tip-title="${esc(a.name)}" data-tip="${esc(a.desc)}" data-tip-sub="${slot === 'ultimate' ? 'Charges from damage dealt' : `${a.cd}s cooldown`}"><kbd>${k}</kbd><b>${esc(a.name)}</b><small>${slot}</small></div>`;
                            }).join('')}
                            <div class="rpg-hero-ab" data-tip-title="${esc(C.passive.name)}" data-tip="${esc(C.passive.desc)}"><kbd>◈</kbd><b>${esc(C.passive.name)}</b><small>passive</small></div>
                        </div>
                    </div>
                </div>`;
            let action;
            if (run) {
                action = `
                    <div class="rpg-resume">
                        <div><span class="rpg-kicker">DELVE SUSPENDED</span><h3>Floor ${run.floor} • ${esc(D.biomeForFloor(run.floor).name)}</h3>
                        <p>Unbanked: <b class="rpg-gold">◆ ${fmt(run.gold)}</b> • <b>${run.pack.length}</b> items • ${run.boons.length} boons. You resume at the start of the floor.</p>
                        ${contract ? `<p>Contract: ${esc(contract.name)} • ${run.contractProgress || 0}/${contract.goal}</p>` : ''}</div>
                        <div class="rpg-resume-btns">
                            <button class="btn rpg-btn-ghost" data-act="abandon">ABANDON</button>
                            <button class="btn btn-primary rpg-btn-big" data-act="resume">RESUME FLOOR ${run.floor} →</button>
                        </div>
                    </div>`;
            } else {
                const cps = p.checkpoints.slice().sort((a, b) => a - b);
                action = `
                    <div class="rpg-launch">
                        <div class="rpg-field"><label>START AT</label><div class="rpg-seg">${cps.map((c) => `<button class="${this.startFloor === c ? 'active' : ''}" data-act="startfloor" data-floor="${c}" data-tip-title="Floor ${c}" data-tip="${esc(D.biomeForFloor(c).name)} • recommended level ${D.recommendedLevel(c)}">F${c}</button>`).join('')}</div></div>
                        <div class="rpg-field"><label>DIFFICULTY</label><div class="rpg-seg">${Object.values(D.DIFFICULTIES).map((d) => `<button class="${p.difficulty === d.id ? 'active' : ''}" data-act="difficulty" data-diff="${d.id}" data-tip-title="${esc(d.name)}" data-tip="${esc(d.desc)}">${esc(d.name.toUpperCase())}</button>`).join('')}</div></div>
                        <div class="rpg-contract-link">
                            <span>${contract ? `<b>${esc(contract.name)}</b> · ${esc(contract.objective)}` : 'No contract selected'}</span>
                            <button class="btn btn-sm" data-act="tab" data-tab="contracts">${contract ? 'CHANGE CONTRACT' : 'VIEW CONTRACTS'}</button>
                        </div>
                        ${otherRun ? `<p class="rpg-warn">Your ${esc(D.CLASSES[otherRun.classId].name)} has a suspended delve on floor ${otherRun.floor}. Starting a new delve abandons it.</p>` : ''}
                        <button class="btn btn-primary rpg-btn-big" data-act="delve">BEGIN DELVE → FLOOR ${this.startFloor}</button>
                        <p class="rpg-hint">Recommended level ${D.recommendedLevel(this.startFloor)} • ${esc(diff.name)} • ${p.elixir ? `Elixir ready: <b>${esc(D.ELIXIRS.find((e) => e.id === p.elixir).name)}</b>` : 'No elixir'}</p>
                    </div>`;
            }
            const stat = (label, val, tip) => `<div class="rpg-stat" data-tip-title="${esc(label)}" data-tip="${esc(tip)}"><small>${label}</small><b>${val}</b></div>`;
            const rules = `
                <ol class="rpg-rules">
                    <li><b>Primers</b> (${key('rpgAbility1')}) apply a status. <b>Detonators</b> (${key('rpgAbility2')}) consume every status on a target — each one triggers its reaction.</li>
                    <li>${D.STATUS_ORDER.map((id) => { const st = D.STATUSES[id]; const re = D.REACTIONS[st.reaction]; return `<span class="rpg-pill" style="--c:${st.color}">${st.icon} ${st.name} → ${re.name}</span>`; }).join(' ')}</li>
                    <li>Health does not regenerate. Drink potions with <b>${key('rpgPotion')}</b>; Rest rooms refill them.</li>
                    <li>Gold and items you find are <b>unbanked</b> until you reach an Extraction Beacon. Die and you lose them. XP is always kept.</li>
                    <li>Chain kills without getting hit to build <b>Momentum</b>: more XP, gold and damage.</li>
                    <li>Find <b>Run Artifacts</b> on 3D pedestals, Devil Deals (−15% max HP) and Angel Sanctums (no Red HP damage taken). Use <b>G/C</b> for Active items, <b>T</b> for Pills/Tarot Cards, and <b>B</b> to drop Bombs on Tinted Rocks.</li>
                </ol>`;
            return `
                ${hero}
                <div class="rpg-grid-2">
                    ${this._section('Deploy', run ? 'Pick up where you left off, or abandon the haul.' : 'Every 5th floor is a guardian. Beating one unlocks a checkpoint.', action)}
                    ${this._section('Your build', 'Live numbers with your current gear and talents.', `<div class="rpg-stats">
                        ${stat('MAX HP', s.maxHp, 'Class base + level + gear.')}
                        ${stat('WEAPON POWER', Math.round(s.weaponPower * (1 + s.gunDmg / 100) * 100) + '%', 'Gun damage multiplier from your weapon item and affixes.')}
                        ${stat('ABILITY POWER', Math.round(s.abilityPower * (1 + s.abilityDmg / 100) * 100) + '%', 'Ability and reaction damage multiplier from level and relic.')}
                        ${stat('POTIONS', `${s.potionsMax} × ${Math.round(s.potionHealFrac * 100)}%`, 'Potions carried and how much of your max HP each one heals.')}
                        ${stat('PACK', s.packSlots + ' slots', 'Items you can carry in a delve before you must salvage some.')}
                        ${stat('COOLDOWNS', Math.round(s.cdrMult * 100) + '%', 'Ability cooldown multiplier.')}
                    </div>`)}
                </div>
                ${this._section('How a delve works', '', rules)}
                ${this._section('Records', '', `<div class="rpg-stats rpg-stats-6">
                    ${stat('DEEPEST', 'F' + p.deepest, 'Deepest floor reached.')}
                    ${stat('DELVES', fmt(p.stats.delves), 'Delves started.')}
                    ${stat('EXTRACTED', fmt(p.stats.extractions), 'Successful extractions.')}
                    ${stat('FALLEN', fmt(p.stats.deaths), 'Delves lost to death.')}
                    ${stat('KILLS', fmt(p.stats.kills), 'Enemies defeated in Rogue Lite.')}
                    ${stat('REACTIONS', fmt(p.stats.reactions), 'Status reactions triggered.')}
                </div>`)}`;
        }

        _classPickHtml(first) {
            const Pr = this.Pr;
            const D = this.D;
            const cards = D.CLASS_ORDER.filter((id) => !first || !D.CLASSES[id].metric).map((id) => {
                const C = D.CLASSES[id];
                const rec = Pr.classRecord(id);
                const active = Pr.classId === id;
                const locked = C.metric && !BO.RPGUnlocks.unlocked(Pr.data, C);
                const requirement = C.metric ? BO.RPGUnlocks.requirement(C) : '';
                return `
                <button class="rpg-class ${active ? 'active' : ''}" style="--c:${C.color}" data-act="pickclass" data-class="${id}" ${locked ? 'disabled' : ''}>
                    <div class="rpg-class-emblem">${C.icon}</div>
                    <span class="rpg-kicker">${esc(C.role.toUpperCase())}</span>
                    <h3>${esc(C.name)}</h3>
                    <p>${esc(C.blurb)}</p>
                    <ul>
                        <li><b>${esc(C.abilities.primer.name)}</b> — ${esc(C.abilities.primer.desc)}</li>
                        <li><b>${esc(C.abilities.detonator.name)}</b> — ${esc(C.abilities.detonator.desc)}</li>
                        <li><b>${esc(C.abilities.ultimate.name)}</b> — ${esc(C.abilities.ultimate.desc)}</li>
                        <li><b>${esc(C.passive.name)}</b> — ${esc(C.passive.desc)}</li>
                    </ul>
                    ${locked ? `<p class="vault-lock">${esc(requirement)} <strong>${fmt(BO.RPGUnlocks.value(Pr.data, C.metric))}/${C.goal}</strong></p>` : ''}
                    <div class="rpg-class-foot"><span>${C.baseHp} HP · ${esc(BO.WeaponsData.get(C.startWeapon).shortName)}</span><b>${locked ? 'LOCKED' : rec ? `LEVEL ${rec.level}${active ? ' · ACTIVE' : ' · SWITCH'}` : 'SELECT'}</b></div>
                </button>`;
            }).join('');
            if (first) {
                return `
                <div class="rpg-first">
                    <header class="rpg-top"><div class="rpg-top-left"><button class="btn" data-act="back">← MAIN MENU</button>
                    <div class="rpg-brand"><span class="rpg-brand-kicker">ROGUE LITE • DELVE &amp; EXTRACT</span><div class="rpg-brand-title">CHOOSE YOUR OPERATIVE</div></div></div></header>
                    <p class="rpg-first-pitch">Delve floor by floor into the Blackout Vaults. Chain elemental combos with your abilities, bank your loot at an Extraction Beacon — or push deeper and risk losing it all. Choose one of three starting operatives. Twelve more can be unlocked in the Haven roster.</p>
                    <div class="rpg-classes">${cards}</div>
                </div>`;
            }
            return this._section('Roster', 'Each class keeps its own level, talents and equipped gear. Gold, scrap, stash, upgrades and checkpoints are shared.', `<div class="rpg-classes">${cards}</div>`);
        }

        _contractsHtml() {
            const p = this.Pr.data;
            const cards = Object.entries(this.D.CONTRACTS).map(([id, contract]) => {
                const locked = !p.checkpoints.some((floor) => floor >= contract.floor);
                const selected = p.contract === id;
                const completions = p.contractCompletions[id] || 0;
                return `<article class="rpg-entry ${selected ? 'selected' : ''}">
                    <h4>${esc(contract.name)}</h4>
                    <p>${esc(contract.objective)}${contract.floor > 1 ? ` on floor ${contract.floor} or deeper` : ''}.</p>
                    <p class="rpg-gold">◆ ${fmt(contract.gold)} gold · ⚙ ${fmt(contract.scrap)} scrap</p>
                    <div class="rpg-entry-footer">
                        <small>${completions ? `Completed ${fmt(completions)}×` : locked ? `Unlock at checkpoint ${contract.floor}` : 'Available now'}</small>
                        <button class="btn btn-sm" data-act="contract" data-id="${id}" aria-pressed="${selected}" ${locked ? 'disabled' : ''}>${selected ? 'REMOVE' : 'SELECT'}</button>
                    </div>
                </article>`;
            }).join('');
            const note = p.run ? ' Your suspended delve keeps its original contract.' : '';
            return this._section('Contract Board', `Choose one for your next delve. Finish it and extract to collect the reward.${note}`, `<div class="rpg-entry-grid">${cards}</div>`);
        }

        _collectionHtml() {
            const U = BO.RPGUnlocks;
            const p = this.Pr.data;
            const category = U.CATEGORIES[this.collectionSlot];
            const total = U.catalog.filter((item) => U.unlocked(p, item)).length;
            const tabs = Object.entries(U.CATEGORIES).map(([id, entry]) => `
                <button class="${id === this.collectionSlot ? 'active' : ''}" data-act="collection" data-slot="${id}" aria-pressed="${id === this.collectionSlot}">${esc(entry.name)}</button>`).join('');
            const items = U.catalog.filter((item) => item.slot === this.collectionSlot).map((item) => {
                const earned = U.unlocked(p, item);
                const equipped = Object.values(p.cosmetics).includes(item.id);
                const progress = item.metric ? Math.min(item.goal, U.value(p, item.metric)) : 0;
                return `<article class="vault-collectible ${earned ? 'earned' : ''}" style="--sigil:${item.color};--sigil-step:${item.pattern || 10}px">
                    <div class="vault-collectible-art" aria-hidden="true">${item.icon}</div>
                    <h4>${esc(item.name)}</h4><p>${esc(U.requirement(item))}</p>
                    ${earned ? `<button class="btn btn-sm" data-act="cosmetic" data-id="${item.id}" aria-pressed="${equipped}">${equipped ? 'REMOVE' : 'EQUIP'}</button>` :
                        item.metric ? `<progress aria-label="${esc(item.name)}" max="${item.goal}" value="${progress}"></progress><small>${fmt(progress)} / ${fmt(item.goal)}</small>` : '<small>Mystery exclusive</small>'}
                </article>`;
            }).join('');
            return this._section('Collection', `${total} of ${U.catalog.length} unlocked. ${category.effect}`,
                `<div class="rpg-seg vault-collection-tabs">${tabs}</div><div class="vault-collection-grid">${items}</div>`);
        }

        _itemCard(it, opts = {}) {
            const Pr = this.Pr;
            const D = this.D;
            const rar = Pr.rarity(it);
            const L = it.legendary ? D.legendaryById(it.legendary) : null;
            const slot = D.ITEM_SLOTS[it.slot];
            const set = L?.set ? D.SETS[L.set] : null;
            const setCount = set ? Pr.equippedSetCount(L.set) : 0;
            const eq = opts.compare === false ? null : (Pr.cls && Pr.cls.equip[it.slot]);
            let cmp = '';
            if (eq && eq.uid !== it.uid) {
                const a = Pr.baseStat(it).value, b = Pr.baseStat(eq).value;
                if (Math.abs(a - b) > 0.001) cmp = `<span class="rpg-cmp ${a > b ? 'up' : 'down'}">${a > b ? '▲' : '▼'}</span>`;
            }
            const sub = it.slot === 'weapon' ? esc(BO.WeaponsData.get(it.base).category) : slot.name;
            return `
                <div class="rpg-item ${opts.selected ? 'selected' : ''} ${opts.compact ? 'compact' : ''}" style="--r:${rar.color}" ${opts.act ? `data-act="${opts.act}" data-uid="${it.uid}"` : ''}>
                    <div class="rpg-item-head">
                        <span class="rpg-item-slot">${slot.icon}</span>
                        <div><b>${esc(it.name)}</b>${cmp}<small>${esc(rar.name)} ${sub} • iLvl ${it.ilvl}${set ? ` · ${esc(set.name)}` : ''}</small></div>
                    </div>
                    ${opts.compact ? '' : `<ul class="rpg-item-lines">
                        ${Pr.describeItem(it).map((l, i) => `<li class="${i === 0 ? 'base' : ''}">${esc(l)}</li>`).join('')}
                        ${L ? `<li class="uniq">★ ${esc(L.unique)}</li><li class="down">▼ ${esc(L.downside)}</li>` : ''}
                        ${set ? set.bonuses.map((bonus) => `<li class="${setCount >= bonus.pieces ? 'rpg-set-active' : 'rpg-dim'}">${bonus.pieces} pieces · ${esc(bonus.desc)}</li>`).join('') : ''}
                    </ul>`}
                    ${opts.footer || ''}
                </div>`;
        }

        _loadoutHtml() {
            const Pr = this.Pr;
            const rec = Pr.cls;
            const p = Pr.data;
            const slots = ['weapon', 'rig', 'relic'].map((slot) => {
                const it = rec.equip[slot];
                const S = this.D.ITEM_SLOTS[slot];
                const cands = p.stash.filter((x) => x.slot === slot);
                return `
                <div class="rpg-slot">
                    <div class="rpg-slot-head"><span>${S.icon} ${S.name.toUpperCase()}</span>${it && slot !== 'weapon' ? `<button class="btn btn-sm" data-act="unequip" data-slot="${slot}">UNEQUIP</button>` : ''}</div>
                    ${it ? this._itemCard(it, { compare: false }) : `<div class="rpg-empty">Empty — equip a ${S.name.toLowerCase()} from your stash.</div>`}
                    <div class="rpg-slot-cands">${cands.length ? cands.map((c) => this._itemCard(c, { compact: true, act: 'equip' })).join('') : `<small class="rpg-dim">No ${S.name.toLowerCase()}s in the stash.</small>`}</div>
                </div>`;
            }).join('');
            return this._section('Loadout', 'Click an item under a slot to equip it. The old item goes back to the stash. ▲/▼ compares the core stat.', `<div class="rpg-slots">${slots}</div>`);
        }

        _talentsHtml(inDelve) {
            const Pr = this.Pr;
            const D = this.D;
            const rec = Pr.cls;
            const tiers = D.TALENTS[Pr.classId].map((tier, ti) => {
                const unlocked = Pr.tierUnlocked(ti, rec);
                const lv = D.TALENT_TIER_LEVELS[ti];
                return `
                <div class="rpg-tier ${unlocked ? '' : 'locked'}">
                    <div class="rpg-tier-lv"><b>LV ${lv}</b><small>${unlocked ? (rec.talents[ti] ? 'CHOSEN' : 'CHOOSE 1') : 'LOCKED'}</small></div>
                    <div class="rpg-tier-opts">${tier.map((t) => `
                        <button class="rpg-talent ${rec.talents[ti] === t.id ? 'chosen' : ''}" ${unlocked ? `data-act="talent" data-tier="${ti}" data-talent="${t.id}"` : 'disabled'}>
                            <b>${esc(t.name)}</b><span>${esc(t.desc)}</span>
                        </button>`).join('')}</div>
                </div>`;
            }).join('');
            const respec = inDelve ? '<p class="rpg-hint">You can pick an unlocked tier now. Changing a choice (respec) is free at the Haven.</p>' : '<button class="btn" data-act="respec">RESPEC (FREE)</button>';
            return this._section('Talents', 'Each tier offers three mutually exclusive choices. They change how your abilities work.', `<div class="rpg-tiers">${tiers}</div><div class="rpg-row-end">${respec}</div>`);
        }

        _stashHtml() {
            const Pr = this.Pr;
            const p = Pr.data;
            const sel = this.selectedUid ? Pr.findStashItem(this.selectedUid) : null;
            const grid = p.stash.length
                ? p.stash.map((it) => this._itemCard(it, { compact: true, act: 'select', selected: sel && sel.uid === it.uid })).join('')
                : '<div class="rpg-empty">Your stash is empty. Extract from a delve to bank loot here.</div>';
            const detail = sel ? `
                ${this._itemCard(sel)}
                <div class="rpg-actions">
                    <button class="btn btn-primary" data-act="equip" data-uid="${sel.uid}">EQUIP</button>
                    <button class="btn" data-act="sell" data-uid="${sel.uid}">SELL ◆${Pr.sellValue(sel)}</button>
                    <button class="btn" data-act="salvage" data-uid="${sel.uid}">SALVAGE ⚙${Pr.scrapValue(sel)}</button>
                </div>` : '<div class="rpg-empty">Select an item to see it in full.</div>';
            return `<div class="rpg-grid-split">
                ${this._section(`Stash ${p.stash.length} / ${Pr.stashCapacity()}`, '', `<div class="rpg-item-grid">${grid}</div>
                    <label class="rpg-toggle"><input type="checkbox" data-act="autosalvage" ${p.autoSalvage ? 'checked' : ''}> Auto-salvage Common items when picked up in a delve</label>`)}
                ${this._section('Details', '', detail)}
            </div>`;
        }

        _merchantHtml() {
            const Pr = this.Pr;
            const p = Pr.data;
            const stock = p.merchant.stock.length ? p.merchant.stock.map((it) => this._itemCard(it, {
                footer: `<button class="btn btn-sm btn-primary rpg-item-buy" data-act="buy" data-uid="${it.uid}" ${p.gold < Pr.buyValue(it) ? 'disabled' : ''}>BUY ◆${fmt(Pr.buyValue(it))}</button>`
            })).join('') : '<div class="rpg-empty">Sold out. New stock arrives after your next delve.</div>';
            const elixirs = this.D.ELIXIRS.map((e) => `
                <div class="rpg-elixir ${p.elixir === e.id ? 'active' : ''}">
                    <span>${e.icon}</span><div><b>${esc(e.name)}</b><small>${esc(e.desc)}</small></div>
                    ${p.elixir === e.id ? '<em>READY</em>' : `<button class="btn btn-sm" data-act="elixir" data-id="${e.id}" ${p.elixir || p.gold < e.cost ? 'disabled' : ''}>◆${e.cost}</button>`}
                </div>`).join('');
            return `
                ${this._section('Merchant', 'Stock refreshes after every delve. Bought items go to your stash.', `<div class="rpg-item-row">${stock}</div>`)}
                ${this._section('Elixirs', 'One elixir per delve. It is consumed when the delve starts.', `<div class="rpg-elixirs">${elixirs}</div>`)}`;
        }

        _forgeHtml() {
            const Pr = this.Pr;
            const p = Pr.data;
            const rec = Pr.cls;
            const owned = [...['weapon', 'rig', 'relic'].map((s) => rec.equip[s]).filter(Boolean), ...p.stash];
            const sel = this.forgeUid ? Pr.findOwnedItem(this.forgeUid) : null;
            const list = owned.map((it) => this._itemCard(it, { compact: true, act: 'forgepick', selected: sel && sel.uid === it.uid, compare: false })).join('');
            let panel = '<div class="rpg-empty">Pick an item to work on.</div>';
            if (sel) {
                const rc = Pr.rerollCost(sel);
                const pc = Pr.promoteCost(sel);
                const fc = Pr.reforgeCost(sel);
                const can = (c) => c && p.gold >= (c.gold || 0) && p.scrap >= (c.scrap || 0);
                panel = `
                    ${this._itemCard(sel, { compare: false })}
                    <div class="rpg-forge-ops">
                        ${sel.affixes.length ? sel.affixes.map((a, i) => `<div class="rpg-forge-op"><div><b>Reroll</b><small>${esc(Pr.affixLabel(sel.slot, a))}</small></div><button class="btn btn-sm" data-act="reroll" data-uid="${sel.uid}" data-idx="${i}" ${can(rc) ? '' : 'disabled'}>◆${rc.gold} ⚙${rc.scrap}</button></div>`).join('') : '<div class="rpg-forge-op"><div><b>Reroll</b><small>This item has no affixes. Promote it first.</small></div></div>'}
                        <div class="rpg-forge-op"><div><b>Promote rarity</b><small>${pc ? `To ${esc(this.D.RARITIES[this.D.RARITY_INDEX[sel.rarity] + 1].name)} — adds an affix.` : 'Epic is the forge ceiling. Legendaries only drop.'}</small></div>${pc ? `<button class="btn btn-sm" data-act="promote" data-uid="${sel.uid}" ${can(pc) ? '' : 'disabled'}>◆${pc.gold} ⚙${pc.scrap}</button>` : ''}</div>
                        <div class="rpg-forge-op"><div><b>Reforge item level</b><small>${fc ? `iLvl ${sel.ilvl} → ${sel.ilvl + fc.gain} (your deepest floor / level sets the cap).` : 'Already at your current cap.'}</small></div>${fc ? `<button class="btn btn-sm" data-act="reforge" data-uid="${sel.uid}" ${can(fc) ? '' : 'disabled'}>⚙${fc.scrap}</button>` : ''}</div>
                    </div>`;
            }
            return `<div class="rpg-grid-split">
                ${this._section('Your items', 'Equipped items first, then your stash.', `<div class="rpg-item-grid">${list || '<div class="rpg-empty">No items.</div>'}</div>`)}
                ${this._section('The Forge', 'Turn scrap and gold into exactly the item you want.', panel)}
            </div>`;
        }

        _upgradesHtml() {
            const Pr = this.Pr;
            const p = Pr.data;
            const rows = this.D.UPGRADES.map((u) => {
                const lv = Pr.upgradeLevel(u.id);
                const cost = Pr.upgradeCost(u.id);
                return `
                <div class="rpg-upgrade">
                    <span class="rpg-upgrade-ico">${u.icon}</span>
                    <div><b>${esc(u.name)}</b><small>${esc(u.desc)}</small>
                        <div class="rpg-pips">${u.costs.map((_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
                    ${cost == null ? '<em>MAXED</em>' : `<button class="btn btn-sm btn-primary" data-act="upgrade" data-id="${u.id}" ${p.gold < cost ? 'disabled' : ''}>◆${fmt(cost)}</button>`}
                </div>`;
            }).join('');
            return this._section('Haven upgrades', 'Permanent improvements shared by every class.', `<div class="rpg-upgrades">${rows}</div>`);
        }

        _onHavenChange(e) {
            const t = e.target;
            if (t.matches('[data-act="autosalvage"]')) {
                this.Pr.data.autoSalvage = !!t.checked;
                this.Pr.save();
            }
        }

        _onHavenClick(e) {
            const btn = e.target.closest('[data-act]');
            if (!btn || btn.disabled) return;
            const act = btn.dataset.act;
            const Pr = this.Pr;
            const p = Pr.data;
            const uid = btn.dataset.uid;
            const ok = () => BO.Sound.playUIClick();
            const fail = (msg) => { BO.Sound.playEmptyClick(); if (msg) this._flash(msg); };
            switch (act) {
                case 'back': ok(); BO.Menus.showScreen('main_menu'); return;
                case 'tab': ok(); this.tab = btn.dataset.tab; this.selectedUid = null; break;
                case 'gameguide': ok(); BO.Menus.openLegend('rpg'); return;
                case 'pickclass':
                    ok();
                    if (p.run && p.run.classId !== btn.dataset.class && Pr.classId === p.run.classId) this._flash('Your suspended delve stays with its class.');
                    if (!Pr.selectClass(btn.dataset.class)) return;
                    this.tab = 'delve';
                    Pr.refreshMerchant();
                    break;
                case 'contract':
                    if (Pr.setContract(p.contract === btn.dataset.id ? null : btn.dataset.id)) ok();
                    else fail('Unlock the required checkpoint to take this contract.');
                    break;
                case 'collection': ok(); this.collectionSlot = btn.dataset.slot; break;
                case 'cosmetic': if (Pr.equipCosmetic(btn.dataset.id)) ok(); else fail(); break;
                case 'startfloor': ok(); this.startFloor = Number(btn.dataset.floor) || 1; break;
                case 'difficulty': ok(); p.difficulty = btn.dataset.diff; Pr.save(); break;
                case 'delve':
                    if (p.run && !window.confirm(`Start a new delve? The suspended delve on floor ${p.run.floor} and its unbanked haul will be lost.`)) return;
                    ok();
                    Pr.clearRun();
                    this._launch({ resume: false, startFloor: this.startFloor });
                    return;
                case 'resume': ok(); this._launch({ resume: true }); return;
                case 'abandon':
                    if (!window.confirm('Abandon this delve? Its unbanked gold and items are lost. XP you earned is kept.')) return;
                    ok();
                    p.stats.deaths++;
                    Pr.clearRun();
                    break;
                case 'equip': if (Pr.equipFromStash(uid)) { ok(); this.selectedUid = null; } else fail(); break;
                case 'unequip': if (Pr.unequip(btn.dataset.slot)) ok(); else fail('Your stash is full.'); break;
                case 'select': ok(); this.selectedUid = uid; break;
                case 'sell': { const g = Pr.sellFromStash(uid); if (g) { BO.Sound.playShopBuy(); this._flash(`Sold for ◆${g}`); this.selectedUid = null; } break; }
                case 'salvage': { const s = Pr.salvageFromStash(uid); if (s) { ok(); this._flash(`Salvaged for ⚙${s}`); this.selectedUid = null; } break; }
                case 'talent': if (Pr.chooseTalent(Number(btn.dataset.tier), btn.dataset.talent)) BO.Sound.playPerkBuy(); else fail(); break;
                case 'respec': ok(); Pr.respec(); this._flash('Talents reset. Choose again — it is free.'); break;
                case 'buy': {
                    const r = Pr.buyMerchantItem(uid);
                    if (r === 'ok') BO.Sound.playShopBuy(); else fail(r === 'stash' ? 'Your stash is full.' : 'Not enough gold.');
                    break;
                }
                case 'elixir': if (Pr.buyElixir(btn.dataset.id)) BO.Sound.playShopBuy(); else fail(); break;
                case 'upgrade': if (Pr.buyUpgrade(btn.dataset.id)) BO.Sound.playPerkBuy(); else fail('Not enough gold.'); break;
                case 'forgepick': ok(); this.forgeUid = uid; break;
                case 'reroll': if (Pr.rerollAffix(uid, Number(btn.dataset.idx))) BO.Sound.playPaPChime(); else fail(); break;
                case 'promote': if (Pr.promote(uid)) BO.Sound.playPaPChime(); else fail(); break;
                case 'reforge': if (Pr.reforge(uid)) BO.Sound.playPaPChime(); else fail(); break;
                default: return;
            }
            this.renderHaven();
        }

        _launch(o) {
            this.haven.classList.add('hidden');
            if (BO.App) BO.App.startMatch({ mode: 'rpg', resume: !!o.resume, startFloor: o.startFloor || 1 });
        }

        _flash(msg) {
            let el = document.getElementById('rpg-flash');
            if (!el) {
                el = document.createElement('div');
                el.id = 'rpg-flash';
                document.body.append(el);
            }
            el.textContent = msg;
            el.classList.remove('show');
            void el.offsetWidth;
            el.classList.add('show');
        }

        /* ======================================================================
           In-delve HUD
        ====================================================================== */

        onFloorEntered() {
            this._hudCache = {};
            this.closeModal(true);
        }

        clearWorldUi() {
            for (const f of this.floats) { f.life = 0; f.el.classList.add('hidden'); }
            for (const b of this.bars) b.el.classList.add('hidden');
        }

        updateHud(dt) {
            const M = this.M;
            if (!M.active || !M.run || BO.State.activeMode !== 'rpg') return;
            this._updateFloats(dt);
            this._updateBars();
            const D = this.D;
            const run = M.run;
            const s = M.stats;
            const C = D.CLASSES[s.classId];
            const kb = BO.Settings.getKeybinds();
            const cache = this._hudCache;
            const set = (key, el, html) => { if (cache[key] !== html) { cache[key] = html; el.innerHTML = html; } };
            const q = (sel) => this.hud.querySelector(sel);
            if (cache.accent !== C.color) { cache.accent = C.color; this.hud.style.setProperty('--rpg-accent', C.color); }

            // Floor card.
            const room = D.ROOMS[run.roomType];
            const crest = BO.RPGUnlocks.equipped(this.Pr.data, 'crest');
            const frame = BO.RPGUnlocks.equipped(this.Pr.data, 'frame');
            this.hud.style.setProperty('--vault-frame', frame?.color || '#c7a36b');
            set('floor', q('.rpg-floor-label'), `${crest ? `<i style="color:${crest.color}">${crest.icon}</i> ` : ''}FLOOR ${run.floor} <small>${esc(M.layout ? M.layout.biome.name.toUpperCase() : '')}</small>`);
            set('room', q('.rpg-room-chip'), `<span style="color:${room.color}">${run.mystery ? '? ' : room.icon} ${esc(room.name.toUpperCase())}</span>`);
            let obj;
            const living = M._livingCount();
            if (M.state === 'fighting') {
                if (M.waves) obj = `Ambush — wave ${Math.max(1, M.waves.current)} / ${M.waves.total} • ${living} left`;
                else if (M.boss) obj = `Defeat ${esc(M.boss.rpg.boss.name)}`;
                else obj = `Clear the floor — <b>${living}</b> ${living === 1 ? 'enemy' : 'enemies'} left${M.hazards.length ? ' · Leave the circles as they brighten' : ''}`;
            } else if (M.state === 'cleared') {
                obj = M.beacon ? 'Extract at the <b style="color:#4ade80">beacon</b> — or take a gate deeper' : 'Choose a <b>gate</b> to go deeper';
                if (M.altar && !M.altar.used) obj = 'Commune with the <b style="color:#c084fc">shrine</b> — then choose a gate';
            } else obj = '';
            const eventObjective = M.roomEvent?.objective();
            set('obj', q('.rpg-objective'), eventObjective ? esc(eventObjective) : obj);
            const map = M.layout;
            set('encounter', q('.vault-encounter'), map ? `${esc(map.style)} · ${map.W} × ${map.L} m${!room.quiet && room.id !== 'boss' ? ` · ${esc(map.encounter.name)}` : ''}${run.curse ? ' · Cursed' : ''}` : '');
            set('haul', q('.rpg-haul'), `<span class="rpg-gold">◆ ${fmt(run.gold)}</span><span>🔑 ${run.keys ?? 0}</span><span>💣 ${run.bombs ?? 0}</span><span>▣ ${run.pack.length}/${s.packSlots}</span><span>⚙ ${fmt(run.scrap)}</span><span class="rpg-dim">UNBANKED</span>`);
            const contract = D.CONTRACTS[run.contract];
            const contractStatus = contract && run.floor < contract.floor ? `counts from floor ${contract.floor}` :
                contract && run.contractProgress >= contract.goal ? 'complete · extract to collect' : `${run.contractProgress}/${contract?.goal}`;
            set('contract', q('.rpg-contract-hud'), contract ? `⚑ ${esc(contract.name)} · ${contractStatus}` : '');
            const boonsHtml = Array.from(run.boons).map((id) => { const b = D.boonById(id); return `<span class="rpg-boon-chip" title="${esc(b.name)}: ${esc(b.desc)}">${b.icon}</span>`; }).join('');
            set('boons', q('.rpg-boons'), boonsHtml);

            // Isaac Synergies & Artifact Icon Strip.
            const ID = BO.RPGItemsData;
            const synHtml = ID && Array.isArray(run.transformations) ? run.transformations.map((tid) => {
                const tf = ID.transformationById(tid);
                return tf ? `<span class="rpg-syn-badge" style="--c:${tf.color}" title="${esc(tf.desc)}">${tf.icon} ${esc(tf.name)}</span>` : '';
            }).join('') : '';
            set('synergies', q('.rpg-synergies'), synHtml);
            const artHtml = ID && Array.isArray(run.artifacts) ? run.artifacts.map((aid) => {
                const it = ID.passiveById(aid);
                return it ? `<span class="rpg-art-chip" style="--c:${it.color}" title="${esc(it.name)}: ${esc(it.desc)}">${it.icon}</span>` : '';
            }).join('') : '';
            set('artifacts', q('.rpg-artifacts-strip'), artHtml);

            // Soul Shield & Protection badges.
            const vitalsEl = q('.rpg-isaac-vitals');
            const soul = Math.round(run.soulShield || 0);
            const showVitals = soul > 0 || run.holyMantleReady || (run.livesLeft || 0) > 0;
            vitalsEl.classList.toggle('hidden', !showVitals);
            if (showVitals) {
                const cap = D.ISAAC?.soulShieldCap || 150;
                q('.rpg-soulbar').classList.toggle('hidden', soul <= 0);
                q('.rpg-soulbar-fill').style.width = BO.Math.clamp(soul / cap, 0, 1) * 100 + '%';
                set('soul', q('.rpg-soulbar-label'), `💙 SOUL SHIELD ${soul}`);
                const badges = [];
                if (run.holyMantleReady) badges.push('<span class="rpg-vbadge" title="Negates next hit on this floor">🛡 MANTLE</span>');
                if ((run.livesLeft || 0) > 0) badges.push(`<span class="rpg-vbadge cat" title="Dead Cat revives remaining">🐈 ×${run.livesLeft}</span>`);
                set('vbadges', q('.rpg-vital-badges'), badges.join(''));
            }

            // Momentum.
            const cap = run.boons.has('adrenal') ? 15 : D.MOMENTUM.max;
            const st = M.momentum.stacks;
            const pipsKey = `${st}/${cap}`;
            if (cache.pips !== pipsKey) {
                cache.pips = pipsKey;
                q('.rpg-momentum-pips').innerHTML = Array.from({ length: cap }, (_, i) => `<i class="${i < st ? 'on' : ''}"></i>`).join('');
                q('.rpg-momentum-label').textContent = st > 0 ? `MOMENTUM ${st} • +${Math.round(st * D.MOMENTUM.xpPerStack * 100)}% XP • +${Math.round(st * D.MOMENTUM.dmgPerStack * 100)}% DMG` : 'MOMENTUM — CHAIN KILLS WITHOUT GETTING HIT';
                q('.rpg-momentum').classList.toggle('hot', st >= cap * 0.7);
            }

            // XP.
            const rec = this.Pr.cls;
            const need = this.Pr.xpNeeded(rec);
            q('.rpg-xp-fill').style.width = (need ? BO.Math.clamp(rec.xp / need, 0, 1) * 100 : 100) + '%';
            set('xp', q('.rpg-xp-label'), `LV ${rec.level} ${esc(C.name.toUpperCase())} • ${need ? `${fmt(rec.xp)} / ${fmt(need)} XP` : 'MAX LEVEL'}${this.Pr.unspentTalentTiers(rec) ? ' • <b>TALENT READY [TAB]</b>' : ''}`);

            // Abilities + Active + Pocket.
            const A = M.ability;
            const slots = {
                primer: { def: C.abilities.primer, key: kb.rpgAbility1, cd: A.cd.primer, max: BO.RPGAbilities.cooldownFor('primer') },
                detonator: { def: C.abilities.detonator, key: kb.rpgAbility2, cd: A.cd.detonator, max: BO.RPGAbilities.cooldownFor('detonator') },
                ultimate: { def: C.abilities.ultimate, key: kb.rpgUltimate },
                potion: { key: kb.rpgPotion }
            };
            for (const el of this.hud.querySelectorAll('.rpg-ab')) {
                const slot = el.dataset.slot;
                if (slot === 'active') {
                    const actDef = ID && run.activeItem ? ID.activeById(run.activeItem) : null;
                    const charges = run.activeCharges || 0;
                    const maxCh = actDef ? actDef.charges : 0;
                    set('gactive', el.querySelector('.rpg-ab-glyph'), actDef ? actDef.icon : '◇');
                    set('nactive', el.querySelector('.rpg-ab-name'), actDef ? esc(actDef.name) : 'NO ACTIVE');
                    const pipsHtml = actDef ? Array.from({ length: maxCh }, (_, idx) => `<i class="${idx < charges ? 'on' : ''}"></i>`).join('') : '';
                    set('pactive', el.querySelector('.rpg-charge-pips'), pipsHtml);
                    const ready = !!(actDef && charges >= maxCh);
                    el.style.setProperty('--cd', actDef ? String(BO.Math.clamp(1 - charges / Math.max(1, maxCh), 0, 1)) : '0');
                    el.querySelector('.rpg-ab-cdtext').textContent = actDef && !ready ? `${charges}/${maxCh}` : '';
                    el.classList.toggle('ready', ready);
                    el.classList.toggle('empty', !actDef);
                    el.style.setProperty('--c', actDef ? actDef.color : '#4ade80');
                    continue;
                }
                if (slot === 'pocket') {
                    const pk = run.pocket;
                    let glyph = '🃏';
                    let label = 'EMPTY';
                    let col = '#38bdf8';
                    if (pk && ID) {
                        if (pk.kind === 'pill') {
                            const entry = run.pillMap?.[String(pk.appearanceIdx)];
                            const pillDef = entry?.identified ? ID.pillById(entry.id) : null;
                            const app = ID.PILL_APPEARANCES[pk.appearanceIdx] || {};
                            glyph = '💊';
                            label = pillDef ? esc(pillDef.name) : 'Mystery Pill ???';
                            col = app.color || '#a855f7';
                        } else if (pk.kind === 'card') {
                            const cardDef = ID.cardById(pk.id);
                            glyph = cardDef?.icon || '🃏';
                            label = cardDef ? esc(`${cardDef.numeral} ${cardDef.name}`) : 'TAROT CARD';
                            col = cardDef?.color || '#fde047';
                        }
                    }
                    set('gpocket', el.querySelector('.rpg-ab-glyph'), glyph);
                    set('npocket', el.querySelector('.rpg-ab-name'), label);
                    el.style.setProperty('--cd', '0');
                    el.querySelector('.rpg-ab-cdtext').textContent = '';
                    el.classList.toggle('ready', !!pk);
                    el.classList.toggle('empty', !pk);
                    el.style.setProperty('--c', col);
                    continue;
                }
                const info = slots[slot];
                const glyph = slot === 'potion' ? '⚗' : (slot === 'ultimate' ? C.icon : (slot === 'primer' ? '◉' : '✸'));
                set('g' + slot, el.querySelector('.rpg-ab-glyph'), glyph);
                set('k' + slot, el.querySelector('.rpg-ab-key'), esc(BO.Settings.keyLabel(info.key)));
                set('n' + slot, el.querySelector('.rpg-ab-name'), slot === 'potion' ? `POTION ×${run.potions}` : esc(info.def.name));
                let frac = 0;
                let text = '';
                let ready = true;
                if (slot === 'primer' || slot === 'detonator') {
                    frac = info.cd > 0 ? info.cd / info.max : 0;
                    text = info.cd > 0 ? info.cd.toFixed(info.cd < 3 ? 1 : 0) : '';
                    ready = info.cd <= 0;
                } else if (slot === 'ultimate') {
                    if (A.ultActive > 0) { frac = 0; text = A.ultActive.toFixed(0) + 's'; ready = true; } else {
                        frac = 1 - A.ult;
                        text = A.ult >= 1 ? '' : Math.floor(A.ult * 100) + '%';
                        ready = A.ult >= 1;
                    }
                } else {
                    ready = run.potions > 0;
                    frac = A.potionCd > 0 ? A.potionCd / 0.8 : 0;
                }
                el.style.setProperty('--cd', String(BO.Math.clamp(frac, 0, 1)));
                el.querySelector('.rpg-ab-cdtext').textContent = text;
                el.classList.toggle('ready', ready && A.silenced <= 0);
                el.classList.toggle('active', slot === 'ultimate' && A.ultActive > 0);
                el.classList.toggle('empty', slot === 'potion' && run.potions <= 0);
                el.style.setProperty('--c', C.color);
            }
            const sil = q('.rpg-silenced');
            sil.classList.toggle('hidden', A.silenced <= 0);
            if (A.silenced > 0) sil.textContent = `SILENCED ${A.silenced.toFixed(1)}s`;
        }

        pulseAbility(slot) {
            const el = this.hud.querySelector(`.rpg-ab[data-slot="${slot}"]`);
            if (!el) return;
            el.classList.remove('pulse');
            void el.offsetWidth;
            el.classList.add('pulse');
        }

        _project(pos, out) {
            const cam = BO.App && BO.App.worldCamera;
            if (!cam) return false;
            _proj.copy(pos).project(cam);
            if (_proj.z > 1 || _proj.z < -1) return false;
            out.x = (_proj.x * 0.5 + 0.5) * window.innerWidth;
            out.y = (-_proj.y * 0.5 + 0.5) * window.innerHeight;
            return out.x > -60 && out.x < window.innerWidth + 60 && out.y > -60 && out.y < window.innerHeight + 60;
        }

        _updateBars() {
            const M = this.M;
            const P = BO.Player;
            const D = this.D;
            const cands = [];
            for (const z of M.enemies) {
                if (!M.isAlive(z)) continue;
                const r = z.rpg;
                const d = z.pos.distanceTo(P.pos);
                if (d > 38) continue;
                const statused = Object.keys(r.statuses).length > 0;
                if (!r.aggro && !statused && z.hp >= z.maxHp && !r.elite && d > 16) continue;
                if (r.isBoss) continue; // the boss uses the top HUD bar
                cands.push({ z, d });
            }
            cands.sort((a, b) => a.d - b.d);
            const scr = { x: 0, y: 0 };
            for (let i = 0; i < this.bars.length; i++) {
                const b = this.bars[i];
                const c = cands[i];
                if (!c) { if (!b.el.classList.contains('hidden')) b.el.classList.add('hidden'); continue; }
                const z = c.z;
                const r = z.rpg;
                const head = z.pos.clone();
                head.y += z.height * (z.sizeMult || 1) + 0.45;
                if (!this._project(head, scr)) { b.el.classList.add('hidden'); continue; }
                b.el.classList.remove('hidden');
                const scale = BO.Math.clamp(1.25 - c.d / 40, 0.6, 1.1);
                b.el.style.transform = `translate(${scr.x.toFixed(0)}px, ${scr.y.toFixed(0)}px) translate(-50%, -100%) scale(${scale.toFixed(2)})`;
                b.fill.style.width = BO.Math.clamp(z.hp / z.maxHp, 0, 1) * 100 + '%';
                const statusHtml = D.STATUS_ORDER.filter((id) => M.hasStatus(z, id)).map((id) => `<i style="--c:${D.STATUSES[id].color}">${D.STATUSES[id].icon}</i>`).join('')
                    + (r.arch.weak ? `<em title="Weak to ${D.STATUSES[r.arch.weak].name} reactions" style="--c:${D.STATUSES[r.arch.weak].color}">WEAK ${D.STATUSES[r.arch.weak].icon}</em>` : '')
                    + (r.affixes.includes('warded') && r.wardBroken <= 0 && r.armorBreak <= 0 && !M.hasStatus(z, 'expose') ? '<em style="--c:#a78bfa">WARD</em>' : '');
                const nameHtml = r.elite ? `${esc(z.spec.name)} <span>${r.affixes.map((a) => `<b style="color:${D.ELITE_AFFIXES[a].color}">${esc(D.ELITE_AFFIXES[a].name)}</b>`).join(' ')}</span>` : (c.d < 14 ? `<span class="rpg-hb-role">${esc(r.arch.role)}</span>` : '');
                const key = statusHtml + '|' + nameHtml;
                if (b.key !== key) {
                    b.key = key;
                    b.status.innerHTML = statusHtml;
                    b.name.innerHTML = nameHtml;
                }
                b.el.classList.toggle('elite', !!r.elite);
            }
        }

        floatText(pos, text, color = '#fff', size = 14, life = 1.0) {
            const f = this.floats.find((x) => x.life <= 0) || this.floats.reduce((a, b) => (a.life < b.life ? a : b));
            f.pos.copy(pos);
            f.pos.x += (Math.random() - 0.5) * 0.5;
            f.pos.y += 1.6 + Math.random() * 0.3;
            f.pos.z += (Math.random() - 0.5) * 0.5;
            f.life = life;
            f.max = life;
            f.vy = 1.1;
            f.el.textContent = text;
            f.el.style.color = color;
            f.el.style.fontSize = size + 'px';
            f.el.classList.remove('hidden');
        }

        damageNumber(z, dealt, ctx) {
            if (dealt < 1) return;
            const src = ctx.source;
            const color = ctx.isHead ? '#fde047' : (src === 'reaction' ? '#f0abfc' : (src === 'ability' ? '#7dd3fc' : (src === 'dot' ? '#fb923c' : '#f8fafc')));
            const size = ctx.isHead || src === 'reaction' ? 17 : (src === 'dot' || src === 'conduct' ? 11 : 13);
            this.floatText(z.pos.clone().add(new THREE.Vector3(0, z.height * 0.2, 0)), Math.round(dealt).toString(), color, size, 0.75);
        }

        reactionText(z, reaction, weak) {
            this.floatText(z.pos.clone().add(new THREE.Vector3(0, z.height * 0.5, 0)), reaction.name + (weak ? ' • WEAK!' : '') + '!', reaction.color, weak ? 22 : 19, 1.15);
        }

        _updateFloats(dt) {
            const scr = { x: 0, y: 0 };
            for (const f of this.floats) {
                if (f.life <= 0) continue;
                f.life -= dt;
                if (f.life <= 0) { f.el.classList.add('hidden'); continue; }
                f.pos.y += f.vy * dt;
                f.vy *= 0.96;
                if (!this._project(f.pos, scr)) { f.el.style.opacity = '0'; continue; }
                const t = f.life / f.max;
                f.el.style.opacity = String(Math.min(1, t * 2.4));
                const pop = t > 0.85 ? 1 + (t - 0.85) * 2.2 : 1;
                f.el.style.transform = `translate(${scr.x.toFixed(0)}px, ${scr.y.toFixed(0)}px) translate(-50%, -50%) scale(${pop.toFixed(2)})`;
            }
        }

        /* ======================================================================
           Gate texture
        ====================================================================== */

        makeGateTexture(room, floor, door = null, cost = null) {
            if (door?.hidden) room = { icon: '?', name: 'Veiled', color: door.color, desc: 'The sign has been scratched away. Whatever waits here pays 30% more.' };
            const c = document.createElement('canvas');
            c.width = 512;
            c.height = 796;
            const ctx = c.getContext('2d');
            const g = ctx.createLinearGradient(0, 0, 0, c.height);
            g.addColorStop(0, 'rgba(8,12,20,0.92)');
            g.addColorStop(1, 'rgba(20,26,40,0.78)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.strokeStyle = room.color;
            ctx.lineWidth = 10;
            ctx.strokeRect(14, 14, c.width - 28, c.height - 28);
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = room.color;
            for (let y = 40; y < c.height; y += 18) ctx.fillRect(30, y, c.width - 60, 2);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'center';
            ctx.fillStyle = room.color;
            ctx.font = '900 190px "Segoe UI Symbol", "Segoe UI", sans-serif';
            ctx.fillText(room.icon, 256, 300);
            ctx.font = '900 72px Bahnschrift, Impact, sans-serif';
            ctx.fillStyle = '#f8fafc';
            ctx.fillText(room.name.toUpperCase(), 256, 430);
            ctx.font = 'bold 34px Consolas, monospace';
            ctx.fillStyle = room.color;
            ctx.fillText(`FLOOR ${floor}`, 256, 488);
            ctx.font = '26px "Segoe UI", sans-serif';
            ctx.fillStyle = '#cbd5e1';
            const words = room.desc.split(' ');
            let line = '';
            let y = 560;
            for (const w of words) {
                const test = line ? line + ' ' + w : w;
                if (ctx.measureText(test).width > 420) { ctx.fillText(line, 256, y); y += 36; line = w; } else line = test;
            }
            if (line) ctx.fillText(line, 256, y);
            if (door && door.id !== 'standard') {
                // Door-type band along the bottom of the sign.
                ctx.fillStyle = 'rgba(6,8,14,0.82)';
                ctx.fillRect(28, 680, c.width - 56, 90);
                ctx.fillStyle = door.color;
                ctx.fillRect(28, 680, c.width - 56, 5);
                ctx.font = '900 34px Bahnschrift, Impact, sans-serif';
                ctx.fillText(`${door.icon}  ${door.name.toUpperCase()}`, 256, 724);
                ctx.font = 'bold 24px Consolas, monospace';
                ctx.fillStyle = '#e2e8f0';
                const tag = cost ? `COST: ${cost.label}` : door.window ? `SEALS ${door.window}s AFTER CLEAR` : door.potion ? 'FREE POTION REFILL' : 'BONUS REWARDS';
                ctx.fillText(tag, 256, 756);
            }
            const tex = new THREE.CanvasTexture(c);
            if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        /* ======================================================================
           Modals
        ====================================================================== */

        openModal(o) {
            this.modalOpen = true;
            this.modalClosable = o.closable !== false;
            this._modalHandlers = o.handlers || {};
            this._onModalClose = o.onClose || null;
            this.modal.innerHTML = `
                <div class="rpg-modal-box ${o.wide ? 'wide' : ''}" style="${o.accent ? `--rpg-accent:${o.accent}` : ''}">
                    <div class="rpg-modal-head">
                        <div>${o.kicker ? `<span class="rpg-kicker">${esc(o.kicker)}</span>` : ''}<h2>${o.title}</h2></div>
                        ${this.modalClosable ? `<button class="btn btn-sm" data-mact="close">${esc(o.closeLabel || 'CLOSE')} <kbd>ESC</kbd></button>` : ''}
                    </div>
                    <div class="rpg-modal-body">${o.html}</div>
                </div>`;
            this.modal.classList.remove('hidden');
            this.modal.classList.remove('rpg-modal-in');
            void this.modal.offsetWidth;
            this.modal.classList.add('rpg-modal-in');
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            if (document.pointerLockElement) document.exitPointerLock();
        }

        closeModal(silent = false) {
            if (!this.modalOpen) { this.modal.classList.add('hidden'); return; }
            this.modalOpen = false;
            this.modal.classList.add('hidden');
            const cb = this._onModalClose;
            this._onModalClose = null;
            this._modalHandlers = {};
            if (cb && !silent) cb();
            if (!silent && BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
        }

        handleKey(e) {
            if (e.code === 'Escape' || (e.code === 'Tab' && this._modalKind === 'pack')) {
                e.preventDefault();
                if (this.modalClosable) { BO.Sound.playUIClick(); this.closeModal(); }
            }
        }

        _onModalClick(e) {
            const btn = e.target.closest('[data-mact]');
            if (!btn || btn.disabled) return;
            const act = btn.dataset.mact;
            if (act === 'close') { BO.Sound.playUIClick(); this.closeModal(); return; }
            const h = this._modalHandlers[act];
            if (h) h(btn);
        }

        openBoonPick(title, boons, onPick) {
            this._modalKind = 'boon';
            BO.Sound.playCardFan?.();
            this.openModal({
                kicker: 'BOON — LASTS UNTIL THE DELVE ENDS', title: esc(title), closable: false, accent: '#c084fc',
                html: `<div class="rpg-boon-row">${boons.map((b) => `
                    <button class="rpg-boon" data-mact="pick" data-id="${b.id}">
                        <span class="rpg-boon-ico">${b.icon}</span><b>${esc(b.name)}</b><p>${esc(b.desc)}</p><em>CHOOSE</em>
                    </button>`).join('')}</div>`,
                handlers: {
                    pick: (btn) => {
                        const b = boons.find((x) => x.id === btn.dataset.id);
                        BO.Sound.playCardDraw?.();
                        this.modalClosable = true;
                        this.closeModal();
                        if (b) onPick(b);
                    }
                }
            });
        }

        openPack() {
            const M = this.M;
            if (!M.active || !M.run || M.state === 'ended' || M.state === 'transition') return;
            this._modalKind = 'pack';
            this._packTab = this._packTab || 'pack';
            this._renderPack();
        }

        _renderPack() {
            const M = this.M;
            const Pr = this.Pr;
            const run = M.run;
            const rec = Pr.cls;
            const s = M.stats;
            const tab = this._packTab;
            const tabs = `<div class="rpg-seg rpg-pack-tabs">
                <button class="${tab === 'pack' ? 'active' : ''}" data-mact="ptab" data-tab="pack">PACK ${run.pack.length}/${s.packSlots}</button>
                <button class="${tab === 'artifacts' ? 'active' : ''}" data-mact="ptab" data-tab="artifacts">ARTIFACTS ${(run.artifacts || []).length}</button>
                <button class="${tab === 'talents' ? 'active' : ''}" data-mact="ptab" data-tab="talents">TALENTS${Pr.unspentTalentTiers(rec) ? ' •' : ''}</button>
                <button class="${tab === 'boons' ? 'active' : ''}" data-mact="ptab" data-tab="boons">BOONS ${run.boons.size}</button>
            </div>`;
            let body = '';
            if (tab === 'pack') {
                const equipped = ['weapon', 'rig', 'relic'].map((slot) => rec.equip[slot] ? this._itemCard(rec.equip[slot], { compare: false, compact: false }) : `<div class="rpg-empty">No ${slot}</div>`).join('');
                const items = run.pack.length ? run.pack.map((it) => this._itemCard(it, {
                    footer: `<div class="rpg-actions"><button class="btn btn-sm btn-primary" data-mact="pequip" data-uid="${it.uid}">EQUIP</button><button class="btn btn-sm" data-mact="pdrop" data-uid="${it.uid}">SALVAGE ⚙${Pr.scrapValue(it)}</button></div>`
                })).join('') : '<div class="rpg-empty">Nothing in your pack yet. Items you pick up stay unbanked until you extract.</div>';
                body = `
                    <div class="rpg-pack-cols">
                        <div><h4>EQUIPPED <small>(kept even if you die)</small></h4><div class="rpg-item-col">${equipped}</div></div>
                        <div><h4>PACK <small>(lost on death — equipping moves your old item into the pack)</small></h4><div class="rpg-item-col">${items}</div></div>
                    </div>
                    <div class="rpg-stats rpg-stats-6">
                        <div class="rpg-stat"><small>HP</small><b>${Math.ceil(BO.Player.hp)} / ${s.maxHp}</b></div>
                        <div class="rpg-stat"><small>POTIONS</small><b>${run.potions} / ${s.potionsMax}</b></div>
                        <div class="rpg-stat"><small>UNBANKED</small><b class="rpg-gold">◆ ${fmt(run.gold)}</b></div>
                        <div class="rpg-stat"><small>KEYS / BOMBS</small><b>🔑 ${run.keys ?? 0} · 💣 ${run.bombs ?? 0}</b></div>
                        <div class="rpg-stat"><small>KILLS</small><b>${run.kills}</b></div>
                        <div class="rpg-stat"><small>REACTIONS</small><b>${run.reactions}</b></div>
                    </div>`;
            } else if (tab === 'artifacts') {
                const ID = BO.RPGItemsData;
                const activeDef = ID && run.activeItem ? ID.activeById(run.activeItem) : null;
                const counts = BO.RPGItems ? BO.RPGItems.transformationCounts(run) : {};
                const synHtml = ID ? ID.TRANSFORMATIONS.map((tf) => {
                    const c = counts[tf.id] || 0;
                    const active = (run.transformations || []).includes(tf.id);
                    return `<div class="rpg-art-card" style="--c:${tf.color}"><span>${tf.icon}</span><div><b>${esc(tf.name)} (${Math.min(3, c)}/3)${active ? ' ✓' : ''}</b><small>${esc(tf.desc)}</small></div></div>`;
                }).join('') : '';
                const passivesHtml = ID && (run.artifacts || []).length
                    ? run.artifacts.map((id) => {
                        const it = ID.passiveById(id);
                        return it ? `<div class="rpg-art-card" style="--c:${it.color}"><span>${it.icon}</span><div><b>${esc(it.name)}</b><small>${esc(it.desc)}</small></div></div>` : '';
                    }).join('')
                    : '<div class="rpg-empty">No passive artifacts yet. Check Treasure rooms, Shops, Locked Reliquaries, and Devil/Angel pedestals!</div>';
                body = `
                    <h4>ACTIVE ITEM &amp; POCKET</h4>
                    <div class="rpg-art-grid">
                        <div class="rpg-art-card" style="--c:${activeDef ? activeDef.color : '#4ade80'}"><span>${activeDef ? activeDef.icon : '◇'}</span><div><b>${activeDef ? esc(activeDef.name) + ` (${run.activeCharges || 0}/${activeDef.charges}) [G/C]` : 'Empty Active Slot [G/C]'}</b><small>${activeDef ? esc(activeDef.desc) : 'Find an Active Artifact on pedestals to charge and trigger it.'}</small></div></div>
                        <div class="rpg-art-card" style="--c:#38bdf8"><span>${run.pocket ? (run.pocket.kind === 'pill' ? '💊' : (ID?.cardById(run.pocket.id)?.icon || '🃏')) : '🃏'}</span><div><b>${run.pocket ? (run.pocket.kind === 'pill' ? (run.pillMap?.[String(run.pocket.appearanceIdx)]?.identified ? esc(ID.pillById(run.pillMap[String(run.pocket.appearanceIdx)].id).name) : 'Mystery Pill ???') : esc(ID?.cardById(run.pocket.id)?.name || 'Card')) + ' [T]' : 'Empty Pocket [T]'}</b><small>Press T to use your held Pill or Tarot Card. Press B to drop a Floor Bomb.</small></div></div>
                    </div>
                    <h4>TRANSFORMATIONS (COLLECT 3 TAGGED ITEMS)</h4>
                    <div class="rpg-art-grid">${synHtml}</div>
                    <h4>PASSIVE ARTIFACTS (${(run.artifacts || []).length})</h4>
                    <div class="rpg-art-grid">${passivesHtml}</div>`;
            } else if (tab === 'talents') {
                body = this._talentsHtml(true).replace(/data-act="talent"/g, 'data-mact="ptalent"');
            } else {
                body = run.boons.size ? `<div class="rpg-boon-row small">${Array.from(run.boons).map((id) => { const b = this.D.boonById(id); return `<div class="rpg-boon owned"><span class="rpg-boon-ico">${b.icon}</span><b>${esc(b.name)}</b><p>${esc(b.desc)}</p></div>`; }).join('')}</div>` : '<div class="rpg-empty">No boons yet. Clear Elite rooms, guardians and shrines to earn them.</div>';
            }
            this.openModal({
                kicker: `FLOOR ${run.floor} • DELVE PACK`, title: 'Pack & Character', wide: true, closeLabel: 'BACK TO THE FIGHT', accent: this.D.CLASSES[s.classId].color,
                html: tabs + body,
                handlers: {
                    ptab: (btn) => { this._packTab = btn.dataset.tab; BO.Sound.playUIClick(); this._renderPack(); },
                    pequip: (btn) => {
                        const idx = run.pack.findIndex((x) => x.uid === btn.dataset.uid);
                        if (idx < 0) return;
                        const it = run.pack.splice(idx, 1)[0];
                        const prev = Pr.equip(it);
                        if (prev) run.pack.splice(idx, 0, prev);
                        if (it.slot === 'weapon') M.refreshWeapon();
                        M.recomputeStats();
                        Pr.save();
                        BO.Sound.playPerkBuy();
                        this._renderPack();
                    },
                    pdrop: (btn) => {
                        const idx = run.pack.findIndex((x) => x.uid === btn.dataset.uid);
                        if (idx < 0) return;
                        const it = run.pack.splice(idx, 1)[0];
                        run.scrap += Pr.scrapValue(it);
                        BO.Sound.playUIClick();
                        this._renderPack();
                    },
                    ptalent: (btn) => {
                        if (Pr.cls.talents[Number(btn.dataset.tier)]) { this._flash('Respec at the Haven to change a chosen talent.'); return; }
                        if (Pr.chooseTalent(Number(btn.dataset.tier), btn.dataset.talent)) {
                            M.recomputeStats();
                            BO.Sound.playPerkBuy();
                            this._renderPack();
                        }
                    }
                }
            });
        }

        openPackFull(newItem, onChoose) {
            const M = this.M;
            this._modalKind = 'packfull';
            this.openModal({
                kicker: 'PACK FULL', title: 'Make room?', accent: this.Pr.rarity(newItem).color, wide: true, closeLabel: 'LEAVE IT',
                html: `<p class="rpg-hint">Salvage one item (it turns into unbanked scrap) to pick up the new one — or leave the new item where it lies.</p>
                    <div class="rpg-pack-cols">
                        <div><h4>NEW</h4>${this._itemCard(newItem)}</div>
                        <div><h4>SALVAGE ONE</h4><div class="rpg-item-col">${M.run.pack.map((it) => this._itemCard(it, { footer: `<button class="btn btn-sm" data-mact="swap" data-uid="${it.uid}">SALVAGE &amp; TAKE NEW</button>` })).join('')}</div></div>
                    </div>`,
                handlers: { swap: (btn) => { const uid = btn.dataset.uid; this.closeModal(); onChoose(uid); } }
            });
        }

        openExtractConfirm(run, onYes) {
            this._modalKind = 'extract';
            const contract = this.D.CONTRACTS[run.contract];
            const reward = contract && run.contractProgress >= contract.goal ? contract : null;
            const items = run.pack.length ? run.pack.map((it) => this._itemCard(it, { compact: true })).join('') : '<small class="rpg-dim">No items in the pack.</small>';
            this.openModal({
                kicker: `FLOOR ${run.floor} • EXTRACTION BEACON`, title: 'Extract and bank your haul?', accent: '#4ade80', closeLabel: 'STAY',
                html: `<div class="rpg-extract">
                        <div class="rpg-stat big"><small>GOLD</small><b class="rpg-gold">◆ ${fmt(run.gold)}</b></div>
                        <div class="rpg-stat big"><small>SCRAP</small><b>⚙ ${fmt(run.scrap)}</b></div>
                        <div class="rpg-stat big"><small>ITEMS</small><b>${run.pack.length}</b></div>
                    </div>
                    <div class="rpg-item-grid">${items}</div>
                    ${reward ? `<p class="rpg-gold">${esc(reward.name)} pays ◆ ${fmt(reward.gold)} gold and ⚙ ${fmt(reward.scrap)} scrap on extraction.</p>` : ''}
                    <p class="rpg-hint">Going deeper multiplies gold, XP and item quality — but if you die, all of this is lost.</p>
                    <div class="rpg-row-end"><button class="btn btn-primary rpg-btn-big" data-mact="yes">EXTRACT NOW</button></div>`,
                handlers: { yes: () => { this.closeModal(true); onYes(); } }
            });
        }

        openShrine(run, goldCost, onChoose) {
            this._modalKind = 'shrine';
            const pct = this.D.SHRINE.hpCostPct;
            this.openModal({
                kicker: 'SHRINE', title: 'An offering for power', accent: '#c084fc', closeLabel: 'WALK AWAY',
                html: `<div class="rpg-boon-row">
                    <button class="rpg-boon" data-mact="blood"><span class="rpg-boon-ico">🩸</span><b>Blood Offering</b><p>Lose ${pct}% max HP for the rest of this delve. Choose a Boon.</p><em>OFFER BLOOD</em></button>
                    <button class="rpg-boon" data-mact="gold" ${run.gold < goldCost ? 'disabled' : ''}><span class="rpg-boon-ico">◆</span><b>Tithe</b><p>Pay ${goldCost} unbanked gold. Choose a Boon.</p><em>${run.gold < goldCost ? `NEED ◆${goldCost}` : `PAY ◆${goldCost}`}</em></button>
                </div>`,
                handlers: {
                    blood: () => { this.closeModal(true); onChoose('blood'); },
                    gold: () => { this.closeModal(true); onChoose('gold'); }
                }
            });
        }

        showReport(r) {
            const D = this.D;
            const C = D.CLASSES[r.classId];
            const win = r.outcome === 'extract';
            this._modalKind = 'report';
            const lostItems = !win && r.itemsLost && r.itemsLost.length ? `<h4>LOST</h4><div class="rpg-item-grid">${r.itemsLost.map((it) => this._itemCard(it, { compact: true })).join('')}</div>` : '';
            const banked = win && r.banked && r.banked.length ? `<h4>BANKED TO YOUR STASH</h4><div class="rpg-item-grid">${r.banked.map((it) => this._itemCard(it, { compact: true })).join('')}</div>` : '';
            this.openModal({
                kicker: `${C.name.toUpperCase()} • FLOORS ${r.startFloor}–${r.floor} • ${r.time}`,
                title: win ? 'EXTRACTED' : 'YOU FELL',
                accent: win ? '#4ade80' : '#ef4444',
                closable: false, wide: true,
                html: `
                    <p class="rpg-report-sub">${win ? 'The haul is safe in the Haven.' : 'The Vaults keep what you carried. Your XP and equipped gear are safe.'}</p>
                    <div class="rpg-stats rpg-stats-6">
                        <div class="rpg-stat"><small>${win ? 'GOLD BANKED' : 'GOLD KEPT'}</small><b class="rpg-gold">◆ ${fmt(r.goldKept)}</b></div>
                        <div class="rpg-stat"><small>${win ? 'SCRAP BANKED' : 'GOLD LOST'}</small><b>${win ? '⚙ ' + fmt(r.scrapKept) : '◆ ' + fmt(r.goldLost)}</b></div>
                        <div class="rpg-stat"><small>XP EARNED</small><b>${fmt(r.xpEarned)}</b></div>
                        <div class="rpg-stat"><small>LEVELS</small><b>+${r.levelsGained}</b></div>
                        <div class="rpg-stat"><small>KILLS</small><b>${r.kills}</b></div>
                        <div class="rpg-stat"><small>REACTIONS</small><b>${r.reactions}</b></div>
                    </div>
                    ${win && r.soldOverflow ? `<p class="rpg-warn">Stash full — overflow items were sold for ◆${fmt(r.soldOverflow)}.</p>` : ''}
                    ${r.contractReward ? `<p class="rpg-gold">Contract paid · ${esc(r.contractReward.name)} · ◆ ${fmt(r.contractReward.gold)} gold · ⚙ ${fmt(r.contractReward.scrap)} scrap</p>` : ''}
                    ${banked}${lostItems}
                    <div class="rpg-row-end">
                        <button class="btn" data-mact="haven">RETURN TO THE HAVEN</button>
                        <button class="btn btn-primary rpg-btn-big" data-mact="again">DELVE AGAIN →</button>
                    </div>`,
                handlers: {
                    haven: () => { this.modalClosable = true; this.closeModal(true); this._returnToHaven(); },
                    again: () => { this.modalClosable = true; this.closeModal(true); this._returnToHaven(true); }
                }
            });
        }

        _returnToHaven(quickDelve = false) {
            if (BO.App) BO.App.exitToMenu();
            if (quickDelve) {
                this._launch({ resume: false, startFloor: this.startFloor });
            }
        }

        fadeTransition(cb) {
            this.fade.classList.add('on');
            setTimeout(() => {
                try { cb(); } finally {
                    requestAnimationFrame(() => this.fade.classList.remove('on'));
                }
            }, 200);
        }
    }

    BO.RPGUI = new RPGUI();
})(window);
;
