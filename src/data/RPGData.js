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
        shrine: { id: 'shrine', name: 'Shrine', icon: '✦', color: '#c084fc', desc: 'No enemies. Trade max HP for a Boon, or pay gold.', weight: 6, minFloor: 2 },
        rest: { id: 'rest', name: 'Rest', icon: '✚', color: '#4ade80', desc: 'No enemies. Heal, refill potions — and you may extract here.', weight: 6, minFloor: 2 },
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

    BO.RPGData = {
        STATUSES, STATUS_ORDER, REACTIONS, CLASSES, CLASS_ORDER, TALENTS, TALENT_TIER_LEVELS,
        LEVEL_CAP, xpToNext, levelHpBonus, levelPotionBonus, abilityPower, recommendedLevel,
        MOMENTUM, DIFFICULTIES, enemyHpMult, enemyDmgMult, depthRewardMult,
        ENEMIES, ELITE_AFFIXES, ELITE, BOSSES, BIOMES, biomeForFloor, ROOMS,
        RARITIES, RARITY_INDEX, rarityWeights, ITEM_SLOTS, ITEM_POWER_PER_LEVEL, WEAPON_POOL, RIG_NAMES, RELIC_NAMES,
        AFFIXES, LEGENDARIES, SETS, CONTRACTS, BOONS, UPGRADES, BASE_POTIONS, BASE_POTION_HEAL, BASE_PACK_SLOTS, STASH_SIZE,
        ELIXIRS, FORGE, SHRINE,
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
