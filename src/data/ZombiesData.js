/* ============================================================================
   BLACKOUT OPS — 20 Completely Unique Zombies + 5 Unique Bosses
   Every 3 rounds completed adds 1 new zombie to the spawn pool (easier first).
   Tougher zombies have lower RNG spawn weights.
   Boss Rounds occur at Rounds 5, 10, 20, 25, and 50.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    // 20 ordered Zombies (Tier 1 easiest -> Tier 20 deadliest)
    // Unlock Round = 1 + (tier - 1) * 3  => Rd 1, 4, 7, 10, 13, ..., 58
    const ZOMBIE_TYPES = [
        {
            id: 'shambler',
            tier: 1,
            unlockRound: 1,
            spawnWeight: 100,
            name: 'Rotten Shambler',
            simpleDesc: 'Classic slow zombie. Easy to outrun and aim for the head.',
            hp: 145,
            speed: 2.0,
            attack: 26,
            defense: 0.0,
            resistances: { bullet: 1.0, explosive: 1.0, fire: 1.0, headshot: 1.0, melee: 1.0 },
            movementHabit: 'lumber',
            attackType: 'melee',
            soundProfile: 'groan_mid',
            drops: { points: 60, dropChance: 0.08, bias: 'any', bonusDrop: null },
            bodySpec: {
                scale: [1.0, 1.0, 1.0],
                skinColor: 0x5c6958, shirtColor: 0x333935, pantsColor: 0x24262a, eyeColor: 0xff3333,
                torsoShape: 'standard'
            }
        },
        {
            id: 'ankle_biter',
            tier: 2,
            unlockRound: 4,
            spawnWeight: 86,
            name: 'Ankle-Biter Crawler',
            simpleDesc: 'Tiny legless crawler that zips low across the floor in zig-zags. Look down!',
            hp: 105,
            speed: 3.1,
            attack: 22,
            defense: 0.0,
            resistances: { bullet: 1.0, explosive: 1.3, fire: 1.2, headshot: 1.1, melee: 1.2 },
            movementHabit: 'crawl_fast',
            attackType: 'melee',
            soundProfile: 'chitter_high',
            drops: { points: 70, dropChance: 0.09, bias: 'double_points', bonusDrop: null },
            bodySpec: {
                scale: [0.76, 0.72, 0.85],
                skinColor: 0x6b705c, shirtColor: 0x42332c, pantsColor: 0x222020, eyeColor: 0xfacc15,
                missingLegs: true, torsoShape: 'crawler'
            }
        },
        {
            id: 'sprinter',
            tier: 3,
            unlockRound: 7,
            spawnWeight: 78,
            name: 'Rabid Sprinter',
            simpleDesc: 'Skinny, super-fast runner that sprints straight at you and slashes twice fast.',
            hp: 130,
            speed: 4.3,
            attack: 28,
            defense: 0.0,
            resistances: { bullet: 1.05, explosive: 1.1, fire: 1.15, headshot: 1.15, melee: 1.0 },
            movementHabit: 'sprint',
            attackType: 'double_claw',
            soundProfile: 'shriek_fast',
            drops: { points: 80, dropChance: 0.09, bias: 'insta_kill', bonusDrop: null },
            bodySpec: {
                scale: [0.84, 1.06, 0.84],
                skinColor: 0x6e5a54, shirtColor: 0x4c1d1d, pantsColor: 0x1f1d22, eyeColor: 0xf59e0b,
                torsoShape: 'lean', razorClaws: true
            }
        },
        {
            id: 'one_arm_ripper',
            tier: 4,
            unlockRound: 10,
            spawnWeight: 70,
            name: 'One-Arm Ripper',
            simpleDesc: 'Missing its left arm, with one giant mutated blade-arm on the right. Hops erratically.',
            hp: 185,
            speed: 3.4,
            attack: 38,
            defense: 0.08,
            resistances: { bullet: 1.0, explosive: 1.0, fire: 1.0, headshot: 1.0, melee: 0.75 },
            movementHabit: 'hop_erratic',
            attackType: 'melee',
            soundProfile: 'snarl_raspy',
            drops: { points: 90, dropChance: 0.10, bias: 'carpenter', bonusDrop: 'ammo_small' },
            bodySpec: {
                scale: [1.0, 1.05, 1.0],
                skinColor: 0x5c4f4b, shirtColor: 0x2b2d34, pantsColor: 0x1e2024, eyeColor: 0xf97316,
                missingLeftArm: true, giantClubArm: true, torsoShape: 'hunched'
            }
        },
        {
            id: 'hunch_spitter',
            tier: 5,
            unlockRound: 13,
            spawnWeight: 62,
            name: 'Acid Hunchback',
            simpleDesc: 'Hunched mutant with a glowing green acid sac on its back. Spits burning acid from afar!',
            hp: 155,
            speed: 2.6,
            attack: 24,
            defense: 0.05,
            resistances: { bullet: 1.0, explosive: 1.35, fire: 1.25, headshot: 1.25, melee: 1.0 },
            movementHabit: 'flank_circle',
            attackType: 'acid_spit',
            soundProfile: 'gurgle_wet',
            drops: { points: 100, dropChance: 0.11, bias: 'max_ammo', bonusDrop: null },
            bodySpec: {
                scale: [0.95, 0.96, 1.08],
                skinColor: 0x4b6b48, shirtColor: 0x1e3522, pantsColor: 0x1a201b, eyeColor: 0x4ade80,
                torsoShape: 'hunched', backSac: 0x4ade80
            }
        },
        {
            id: 'headless_charger',
            tier: 6,
            unlockRound: 16,
            spawnWeight: 56,
            name: 'Headless Charger',
            simpleDesc: 'Has NO head—just a glowing spine! Immune to headshots and charges like a bull.',
            hp: 230,
            speed: 3.9,
            attack: 42,
            defense: 0.12,
            resistances: { bullet: 0.95, explosive: 1.3, fire: 1.0, headshot: 0.0, melee: 0.85 },
            movementHabit: 'charge_bull',
            attackType: 'melee',
            soundProfile: 'roar_hollow',
            drops: { points: 110, dropChance: 0.11, bias: 'insta_kill', bonusDrop: 'armor_shard' },
            bodySpec: {
                scale: [1.12, 1.06, 1.12],
                skinColor: 0x6b4744, shirtColor: 0x3b2322, pantsColor: 0x211919, eyeColor: 0xef4444,
                headless: true, boneSpikes: true, torsoShape: 'broad'
            }
        },
        {
            id: 'bloater',
            tier: 7,
            unlockRound: 19,
            spawnWeight: 50,
            name: 'Bile Bloater',
            simpleDesc: 'Huge, swollen zombie full of gas. Explodes when killed or when right next to you!',
            hp: 310,
            speed: 1.75,
            attack: 48,
            defense: 0.15,
            resistances: { bullet: 0.88, explosive: 1.65, fire: 1.5, headshot: 1.2, melee: 0.6 },
            movementHabit: 'stomp_march',
            attackType: 'suicide_blast',
            soundProfile: 'gurgle_deep',
            drops: { points: 120, dropChance: 0.13, bias: 'nuke', bonusDrop: null },
            bodySpec: {
                scale: [1.46, 1.12, 1.46],
                skinColor: 0x767c46, shirtColor: 0x4d522b, pantsColor: 0x2b2d1f, eyeColor: 0xd9f99d,
                torsoShape: 'bloated', backSac: 0xa3e635
            }
        },
        {
            id: 'hopper',
            tier: 8,
            unlockRound: 22,
            spawnWeight: 46,
            name: 'Feral Leaper',
            simpleDesc: 'Long-limbed hunter that leaps through the air to pounce on you from medium distance.',
            hp: 195,
            speed: 4.1,
            attack: 34,
            defense: 0.06,
            resistances: { bullet: 1.0, explosive: 1.15, fire: 1.1, headshot: 1.15, melee: 1.0 },
            movementHabit: 'leap_pounce',
            attackType: 'pounce',
            soundProfile: 'shriek_fast',
            drops: { points: 115, dropChance: 0.12, bias: 'double_points', bonusDrop: null },
            bodySpec: {
                scale: [0.86, 1.24, 0.86],
                skinColor: 0x4d5d6b, shirtColor: 0x1e293b, pantsColor: 0x171c26, eyeColor: 0x38bdf8,
                torsoShape: 'lean', razorClaws: true
            }
        },
        {
            id: 'hellhound',
            tier: 9,
            unlockRound: 25,
            spawnWeight: 42,
            name: 'Cinder Hound',
            simpleDesc: 'Four-legged flaming demon dog. Super fast, resists fire, and loves dropping Max Ammo.',
            hp: 175,
            speed: 5.1,
            attack: 32,
            defense: 0.10,
            resistances: { bullet: 1.0, explosive: 1.15, fire: 0.15, headshot: 1.3, melee: 1.0 },
            movementHabit: 'leap_pounce',
            attackType: 'pounce',
            soundProfile: 'hound_bark',
            drops: { points: 120, dropChance: 0.16, bias: 'max_ammo', bonusDrop: null },
            bodySpec: {
                scale: [1.05, 1.0, 1.1],
                skinColor: 0x241715, shirtColor: 0x7c1d0c, pantsColor: 0x1a1210, eyeColor: 0xff7b00,
                quadruped: true, horns: true
            }
        },
        {
            id: 'nova_crawler',
            tier: 10,
            unlockRound: 28,
            spawnWeight: 38,
            name: 'Nova Toxic Fiend',
            simpleDesc: 'Glowing green lab mutant. Bursts into a choking gas cloud unless you finish it with a headshot.',
            hp: 245,
            speed: 3.5,
            attack: 34,
            defense: 0.12,
            resistances: { bullet: 0.95, explosive: 1.25, fire: 1.1, headshot: 1.35, melee: 0.7 },
            movementHabit: 'zig_zag',
            attackType: 'toxic_cloud',
            soundProfile: 'hiss_toxic',
            drops: { points: 130, dropChance: 0.13, bias: 'fire_sale', bonusDrop: null },
            bodySpec: {
                scale: [0.96, 0.92, 0.98],
                skinColor: 0x347047, shirtColor: 0x14532d, pantsColor: 0x0f2618, eyeColor: 0x4ade80,
                torsoShape: 'hunched', glowingRibs: 0x22c55e
            }
        },
        {
            id: 'shield_walker',
            tier: 11,
            unlockRound: 31,
            spawnWeight: 34,
            name: 'Riot Shielder',
            simpleDesc: 'Carries a heavy steel riot shield that blocks half of bullet damage. Use grenades or headshots!',
            hp: 340,
            speed: 2.3,
            attack: 40,
            defense: 0.30,
            resistances: { bullet: 0.48, explosive: 1.65, fire: 1.1, headshot: 1.3, melee: 0.55 },
            movementHabit: 'stomp_march',
            attackType: 'shield_bash',
            soundProfile: 'metal_clang',
            drops: { points: 145, dropChance: 0.15, bias: 'carpenter', bonusDrop: 'armor_shard' },
            bodySpec: {
                scale: [1.14, 1.10, 1.10],
                skinColor: 0x475569, shirtColor: 0x1e293b, pantsColor: 0x0f172a, eyeColor: 0x60a5fa,
                riotShield: true, helmet: true, torsoShape: 'broad'
            }
        },
        {
            id: 'twin_horror',
            tier: 12,
            unlockRound: 34,
            spawnWeight: 30,
            name: 'Two-Headed Twin',
            simpleDesc: 'Creepy mutant with TWO heads side-by-side. Circles around you and hits hard, but both heads take crit damage!',
            hp: 320,
            speed: 3.1,
            attack: 44,
            defense: 0.15,
            resistances: { bullet: 0.95, explosive: 1.15, fire: 1.1, headshot: 1.5, melee: 0.9 },
            movementHabit: 'flank_circle',
            attackType: 'double_claw',
            soundProfile: 'groan_dual',
            drops: { points: 160, dropChance: 0.15, bias: 'double_points', bonusDrop: 'ammo_small' },
            bodySpec: {
                scale: [1.16, 1.12, 1.05],
                skinColor: 0x6b5c6e, shirtColor: 0x3b243f, pantsColor: 0x1e1624, eyeColor: 0xe879f9,
                extraHeads: 1, torsoShape: 'broad'
            }
        },
        {
            id: 'pyro_fiend',
            tier: 13,
            unlockRound: 37,
            spawnWeight: 26,
            name: 'Pyro Ashwalker',
            simpleDesc: 'Horned burning zombie that hurls fireballs from range. Nearly immune to fire!',
            hp: 295,
            speed: 3.2,
            attack: 36,
            defense: 0.18,
            resistances: { bullet: 0.95, explosive: 0.75, fire: 0.12, headshot: 1.25, melee: 0.85 },
            movementHabit: 'zig_zag',
            attackType: 'fire_bolt',
            soundProfile: 'crackle_fire',
            drops: { points: 165, dropChance: 0.16, bias: 'nuke', bonusDrop: null },
            bodySpec: {
                scale: [1.06, 1.12, 1.06],
                skinColor: 0x2b1914, shirtColor: 0x9a3412, pantsColor: 0x1c120f, eyeColor: 0xfb923c,
                horns: true, glowingRibs: 0xf97316, torsoShape: 'standard'
            }
        },
        {
            id: 'frost_wraith',
            tier: 14,
            unlockRound: 40,
            spawnWeight: 23,
            name: 'Frost Wraith',
            simpleDesc: 'Floating legless ice ghost that drifts smoothly and shoots frost shards that briefly chill you.',
            hp: 280,
            speed: 3.4,
            attack: 30,
            defense: 0.18,
            resistances: { bullet: 0.85, explosive: 1.25, fire: 1.75, headshot: 1.2, melee: 0.75 },
            movementHabit: 'hover_drift',
            attackType: 'frost_shard',
            soundProfile: 'wail_ice',
            drops: { points: 175, dropChance: 0.16, bias: 'max_ammo', bonusDrop: null },
            bodySpec: {
                scale: [1.0, 1.15, 1.0],
                skinColor: 0xbae6fd, shirtColor: 0x0284c7, pantsColor: 0x0c4a6e, eyeColor: 0xe0f2fe,
                missingLegs: true, floating: true, haloCrystal: 0x38bdf8, torsoShape: 'floating'
            }
        },
        {
            id: 'spider_ravager',
            tier: 15,
            unlockRound: 43,
            spawnWeight: 20,
            name: 'Four-Armed Ravager',
            simpleDesc: 'Nightmare mutant with FOUR razor-clawed arms! Sprints in zig-zags and unleashes rapid slashes.',
            hp: 360,
            speed: 4.0,
            attack: 48,
            defense: 0.18,
            resistances: { bullet: 0.92, explosive: 1.2, fire: 1.15, headshot: 1.2, melee: 0.65 },
            movementHabit: 'zig_zag',
            attackType: 'double_claw',
            soundProfile: 'chitter_high',
            drops: { points: 190, dropChance: 0.17, bias: 'insta_kill', bonusDrop: 'ammo_small' },
            bodySpec: {
                scale: [1.1, 1.15, 1.05],
                skinColor: 0x453035, shirtColor: 0x26151a, pantsColor: 0x1a1215, eyeColor: 0xf43f5e,
                extraArms: 2, razorClaws: true, boneSpikes: true, torsoShape: 'lean'
            }
        },
        {
            id: 'club_goliath',
            tier: 16,
            unlockRound: 46,
            spawnWeight: 16,
            name: 'Bone-Club Goliath',
            simpleDesc: 'Towering giant with a massive bone club arm that slams the floor with shockwaves.',
            hp: 560,
            speed: 2.35,
            attack: 58,
            defense: 0.28,
            resistances: { bullet: 0.80, explosive: 1.35, fire: 1.0, headshot: 1.35, melee: 0.5 },
            movementHabit: 'stomp_march',
            attackType: 'shockwave_slam',
            soundProfile: 'roar_deep',
            drops: { points: 220, dropChance: 0.20, bias: 'carpenter', bonusDrop: 'armor_shard' },
            bodySpec: {
                scale: [1.36, 1.44, 1.32],
                skinColor: 0x5c5346, shirtColor: 0x2e2922, pantsColor: 0x1c1917, eyeColor: 0xf59e0b,
                giantClubArm: true, boneSpikes: true, torsoShape: 'broad'
            }
        },
        {
            id: 'shadow_stalker',
            tier: 17,
            unlockRound: 49,
            spawnWeight: 13,
            name: 'Shadow Blinker',
            simpleDesc: 'Dark horned assassin that blinks forward through shadows every few seconds!',
            hp: 340,
            speed: 3.9,
            attack: 46,
            defense: 0.20,
            resistances: { bullet: 0.88, explosive: 1.25, fire: 1.25, headshot: 1.4, melee: 0.85 },
            movementHabit: 'teleport_blink',
            attackType: 'double_claw',
            soundProfile: 'wail_void',
            drops: { points: 230, dropChance: 0.20, bias: 'fire_sale', bonusDrop: null },
            bodySpec: {
                scale: [0.95, 1.22, 0.95],
                skinColor: 0x181326, shirtColor: 0x0f0a1a, pantsColor: 0x090612, eyeColor: 0xc084fc,
                horns: true, tentacles: true, torsoShape: 'lean'
            }
        },
        {
            id: 'vampire_siren',
            tier: 18,
            unlockRound: 52,
            spawnWeight: 11,
            name: 'Crimson Leech',
            simpleDesc: 'Winged blood-fiend that shrieks life-draining bolts and heals itself when it hits you!',
            hp: 410,
            speed: 3.6,
            attack: 42,
            defense: 0.22,
            resistances: { bullet: 0.90, explosive: 1.2, fire: 1.4, headshot: 1.35, melee: 0.9 },
            movementHabit: 'flank_circle',
            attackType: 'life_drain',
            soundProfile: 'shriek_fast',
            drops: { points: 250, dropChance: 0.22, bias: 'double_points', bonusDrop: 'health_orb' },
            bodySpec: {
                scale: [1.0, 1.2, 1.0],
                skinColor: 0x7f1d1d, shirtColor: 0x450a0a, pantsColor: 0x1c0808, eyeColor: 0xfef08a,
                wings: true, razorClaws: true, torsoShape: 'lean'
            }
        },
        {
            id: 'iron_juggernaut',
            tier: 19,
            unlockRound: 55,
            spawnWeight: 8,
            name: 'Iron Juggernaut',
            simpleDesc: 'Heavy armored tank-zombie with massive defense against bullets. Blast it with explosives or Pack-a-Punch!',
            hp: 740,
            speed: 2.25,
            attack: 62,
            defense: 0.42,
            resistances: { bullet: 0.50, explosive: 1.75, fire: 0.7, headshot: 1.25, melee: 0.45 },
            movementHabit: 'stomp_march',
            attackType: 'shockwave_slam',
            soundProfile: 'metal_clang',
            drops: { points: 300, dropChance: 0.26, bias: 'max_ammo', bonusDrop: 'armor_shard' },
            bodySpec: {
                scale: [1.40, 1.42, 1.38],
                skinColor: 0x334155, shirtColor: 0x1e293b, pantsColor: 0x0f172a, eyeColor: 0xf43f5e,
                helmet: true, riotShield: false, boneSpikes: true, torsoShape: 'armored'
            }
        },
        {
            id: 'aether_revenant',
            tier: 20,
            unlockRound: 58,
            spawnWeight: 6,
            name: 'Apex Aether Revenant',
            simpleDesc: 'Ultimate cosmic horror with 4 arms and floating crystal halo. Teleports and fires Aether bolts!',
            hp: 880,
            speed: 3.7,
            attack: 68,
            defense: 0.35,
            resistances: { bullet: 0.72, explosive: 1.25, fire: 0.85, headshot: 1.35, melee: 0.6 },
            movementHabit: 'teleport_blink',
            attackType: 'aether_bolt',
            soundProfile: 'wail_void',
            drops: { points: 400, dropChance: 0.35, bias: 'nuke', bonusDrop: 'armor_shard' },
            bodySpec: {
                scale: [1.28, 1.48, 1.22],
                skinColor: 0x2e1065, shirtColor: 0x4c1d95, pantsColor: 0x1e093d, eyeColor: 0xf0abfc,
                extraArms: 2, horns: true, floating: true, haloCrystal: 0xc084fc, tentacles: true, torsoShape: 'floating'
            }
        }
    ];

    // Tag the original 20 with explicit rarity tiers (1-7 easy, 8-14 normal, 15-20 hard)
    for (let i = 0; i < ZOMBIE_TYPES.length; i++) {
        ZOMBIE_TYPES[i].rarity = i < 7 ? 'easy' : (i < 14 ? 'normal' : 'hard');
    }

    // 50 BRAND-NEW UNIQUE ENEMIES (ordered easiest -> normal -> hard -> ultra-late-round!)
    function mkEnemy(tier, id, name, rarity, hp, speed, attack, defense, habit, atkType, desc, bodySpec, extra = {}) {
        return Object.assign({
            id,
            tier,
            rarity,
            unlockRound: Math.max(1, tier),
            spawnWeight: rarity === 'easy' ? 60 : (rarity === 'normal' ? 35 : 18),
            name,
            simpleDesc: desc,
            hp,
            speed,
            attack,
            defense,
            resistances: extra.resistances || { bullet: 1.0, explosive: 1.0, fire: 1.0, headshot: 1.15, melee: 1.0 },
            movementHabit: habit,
            attackType: atkType,
            soundProfile: extra.soundProfile || 'groan_mid',
            splitCount: extra.splitCount || 0,
            jumpChance: extra.jumpChance || 0,
            isMagical: !!extra.isMagical,
            drops: { points: rarity === 'easy' ? 75 : (rarity === 'normal' ? 135 : 240), dropChance: rarity === 'hard' ? 0.20 : 0.10, bias: 'any', bonusDrop: null },
            bodySpec
        }, extra);
    }

    const NEW_50_ENEMIES = [
        // --- EASY TIER (17 new) ---
        mkEnemy(21, 'goblin_runt', 'Goblin Runt', 'easy', 85, 4.1, 18, 0.0, 'zig_zag', 'melee', 'Short green sneaky goblin that darts fast and hops.', { scale: [0.62, 0.62, 0.62], skinColor: 0x4d7c0f, shirtColor: 0x3f2e1d, pantsColor: 0x261d14, eyeColor: 0xfacc15, horns: true, torsoShape: 'lean' }, { jumpChance: 0.25 }),
        mkEnemy(22, 'bone_lanky', 'Lanky Skeleton', 'easy', 95, 3.2, 22, 0.0, 'lumber', 'melee', 'Tall super-skinny rattling skeleton with long reach.', { scale: [0.68, 1.48, 0.68], skinColor: 0xe2e8f0, shirtColor: 0xcbd5e1, pantsColor: 0x94a3b8, eyeColor: 0x38bdf8, torsoShape: 'lean' }),
        mkEnemy(23, 'spring_imp', 'Spring-Hopper Imp', 'easy', 110, 3.6, 20, 0.0, 'hop_erratic', 'melee', 'Small crimson imp that constantly jumps high through the air!', { scale: [0.72, 0.78, 0.72], skinColor: 0xb91c1c, shirtColor: 0x450a0a, pantsColor: 0x1c1917, eyeColor: 0xfde047, horns: true, torsoShape: 'lean' }, { jumpChance: 0.55 }),
        mkEnemy(24, 'twin_slime', 'Twin-Split Slime', 'easy', 140, 2.2, 22, 0.05, 'lumber', 'melee', 'Bouncy green slime mutant that SPLITS INTO 2 smaller slimes on death!', { scale: [1.18, 0.92, 1.18], skinColor: 0x22c55e, shirtColor: 0x15803d, pantsColor: 0x14532d, eyeColor: 0xfef08a, torsoShape: 'bloated' }, { splitCount: 2 }),
        mkEnemy(25, 'plague_ratman', 'Plague Ratman', 'easy', 105, 4.4, 21, 0.0, 'sprint', 'double_claw', 'Hunched scurrying sewer ratman with rapid slashes.', { scale: [0.78, 0.82, 0.92], skinColor: 0x57534e, shirtColor: 0x292524, pantsColor: 0x1c1917, eyeColor: 0xef4444, torsoShape: 'hunched', razorClaws: true }),
        mkEnemy(26, 'frost_gnome', 'Frostbite Gnome', 'easy', 115, 2.9, 20, 0.04, 'flank_circle', 'frost_shard', 'Tiny icy blue gnome that tosses chilly frost shards.', { scale: [0.65, 0.68, 0.65], skinColor: 0x7dd3fc, shirtColor: 0x0369a1, pantsColor: 0x0c4a6e, eyeColor: 0xe0f2fe, torsoShape: 'standard' }, { isMagical: true }),
        mkEnemy(27, 'toxic_toad', 'Venom Toad-Fiend', 'easy', 135, 2.7, 24, 0.04, 'hop_erratic', 'acid_spit', 'Fat green leaping frog-mutant that hops and spits acid.', { scale: [1.22, 0.78, 1.25], skinColor: 0x65a30d, shirtColor: 0x365314, pantsColor: 0x1a2e05, eyeColor: 0xfacc15, torsoShape: 'bloated' }, { jumpChance: 0.45 }),
        mkEnemy(28, 'sand_mummy', 'Desert Mummy', 'easy', 165, 2.1, 26, 0.08, 'lumber', 'melee', 'Bandage-wrapped ancient mummy; slow but sturdy.', { scale: [1.0, 1.08, 1.0], skinColor: 0xd6d3d1, shirtColor: 0xa8a29e, pantsColor: 0x78716c, eyeColor: 0xf59e0b, torsoShape: 'standard' }),
        mkEnemy(29, 'shadow_imp', 'Shadow Creeper', 'easy', 98, 4.3, 24, 0.0, 'zig_zag', 'melee', 'Jet-black skinny phantom that weaves unpredictably.', { scale: [0.76, 0.96, 0.76], skinColor: 0x0f172a, shirtColor: 0x020617, pantsColor: 0x020617, eyeColor: 0xa855f7, torsoShape: 'lean' }),
        mkEnemy(30, 'acrobat_ghoul', 'Acrobat Ghoul', 'easy', 120, 3.9, 23, 0.0, 'hop_erratic', 'melee', 'Hyper-agile undead tumbler that jumps high mid-charge.', { scale: [0.85, 1.05, 0.85], skinColor: 0x94a3b8, shirtColor: 0x7c3aed, pantsColor: 0x312e81, eyeColor: 0x22d3ee, torsoShape: 'lean' }, { jumpChance: 0.50 }),
        mkEnemy(31, 'scarecrow_fiend', 'Hollow Scarecrow', 'easy', 130, 3.0, 25, 0.02, 'zig_zag', 'melee', 'Tall lanky straw-stuffed horror with glowing pumpkin eyes.', { scale: [0.82, 1.38, 0.82], skinColor: 0xb45309, shirtColor: 0x78350f, pantsColor: 0x451a03, eyeColor: 0xf97316, torsoShape: 'lean' }),
        mkEnemy(32, 'mud_waddler', 'Swamp Mud-Waddler', 'easy', 190, 1.65, 28, 0.10, 'stomp_march', 'melee', 'Wide, heavy, slow mud creature that absorbs bullets.', { scale: [1.38, 0.95, 1.38], skinColor: 0x44403c, shirtColor: 0x292524, pantsColor: 0x1c1917, eyeColor: 0x84cc16, torsoShape: 'bloated' }),
        mkEnemy(33, 'lightning_sprite', 'Volt Sprite', 'easy', 90, 4.7, 22, 0.0, 'hover_drift', 'aether_bolt', 'Tiny hovering cyan electric spirit that zips fast.', { scale: [0.68, 0.75, 0.68], skinColor: 0x06b6d4, shirtColor: 0x0891b2, pantsColor: 0x164e63, eyeColor: 0xfef08a, floating: true, torsoShape: 'floating' }, { isMagical: true }),
        mkEnemy(34, 'mitosis_ghoul', 'Mitosis Ghoul', 'easy', 155, 2.7, 25, 0.04, 'lumber', 'melee', 'Glowing teal mutant that SPLITS INTO 2 fast ghouls when killed!', { scale: [1.05, 1.05, 1.05], skinColor: 0x14b8a6, shirtColor: 0x0f766e, pantsColor: 0x134e4a, eyeColor: 0x5eead4, torsoShape: 'standard' }, { splitCount: 2 }),
        mkEnemy(35, 'bone_hound', 'Skeletal Jackal', 'easy', 120, 4.9, 24, 0.0, 'sprint', 'melee', 'Fast quadruped bone-hound that bounds across the field.', { scale: [0.95, 0.85, 1.15], skinColor: 0xe5e7eb, shirtColor: 0x9ca3af, pantsColor: 0x4b5563, eyeColor: 0xef4444, quadruped: true }),
        mkEnemy(36, 'ember_dwarf', 'Cinder Dwarf', 'easy', 145, 2.8, 27, 0.06, 'charge_bull', 'fire_bolt', 'Short stocky fiery dwarf that lobs hot cinders.', { scale: [0.92, 0.72, 0.92], skinColor: 0x9a3412, shirtColor: 0xea580c, pantsColor: 0x431407, eyeColor: 0xfef08a, glowingRibs: 0xf97316, torsoShape: 'broad' }),
        mkEnemy(37, 'swamp_witch', 'Bog Witch', 'easy', 145, 2.9, 26, 0.05, 'hover_drift', 'acid_spit', 'Floating green-robed Witch casting hex bolts from afar!', { scale: [0.88, 1.12, 0.88], skinColor: 0x65a30d, shirtColor: 0x3b0764, pantsColor: 0x1e1b4b, eyeColor: 0xa855f7, floating: true, haloCrystal: 0x4ade80, torsoShape: 'floating' }, { isMagical: true }),

        // --- NORMAL TIER (17 new) ---
        mkEnemy(38, 'feral_werewolf', 'Feral Werewolf', 'normal', 260, 4.9, 40, 0.10, 'leap_pounce', 'double_claw', 'Tall savage Werewolf that sprints & leaps onto prey!', { scale: [1.14, 1.32, 1.14], skinColor: 0x475569, shirtColor: 0x334155, pantsColor: 0x1e293b, eyeColor: 0xfef08a, horns: true, razorClaws: true, torsoShape: 'broad' }, { jumpChance: 0.35 }),
        mkEnemy(39, 'jungle_tigerman', 'Jungle Tigerman', 'normal', 245, 5.1, 38, 0.08, 'flank_circle', 'double_claw', 'Fierce orange-and-black Tigerman warrior with blazing speed!', { scale: [1.10, 1.24, 1.08], skinColor: 0xf97316, shirtColor: 0x1c1917, pantsColor: 0x7c2d12, eyeColor: 0xfde047, razorClaws: true, torsoShape: 'lean' }, { jumpChance: 0.30 }),
        mkEnemy(40, 'grizzly_bear', 'Rabid Grizzly Bear', 'normal', 380, 3.6, 46, 0.16, 'charge_bull', 'melee', 'Massive brown charging Bear that smashes through defenses!', { scale: [1.45, 1.32, 1.55], skinColor: 0x78350f, shirtColor: 0x451a03, pantsColor: 0x291103, eyeColor: 0xef4444, quadruped: true, torsoShape: 'bloated' }),
        mkEnemy(41, 'swamp_ogre', 'Swamp Ogre', 'normal', 440, 2.2, 52, 0.20, 'stomp_march', 'shockwave_slam', 'Huge fat green Ogre with a massive club arm and ground slam!', { scale: [1.55, 1.48, 1.52], skinColor: 0x4d7c0f, shirtColor: 0x713f12, pantsColor: 0x3f2e1d, eyeColor: 0xfacc15, giantClubArm: true, torsoShape: 'bloated' }),
        mkEnemy(42, 'quad_blob', 'Quad-Split Gelatin', 'normal', 240, 2.3, 30, 0.08, 'lumber', 'melee', 'Volatile purple blob that SPLITS INTO 4 mini-swarmers on death!', { scale: [1.32, 1.02, 1.32], skinColor: 0x9333ea, shirtColor: 0x6b21a8, pantsColor: 0x3b0764, eyeColor: 0xf0abfc, torsoShape: 'bloated' }, { splitCount: 4 }),
        mkEnemy(43, 'blood_witch', 'Crimson Blood Witch', 'normal', 225, 3.2, 34, 0.08, 'hover_drift', 'life_drain', 'Floating crimson Witch that drains life with arcane magic!', { scale: [0.92, 1.18, 0.92], skinColor: 0x9f1239, shirtColor: 0x4c0519, pantsColor: 0x1f020a, eyeColor: 0xfb7185, floating: true, haloCrystal: 0xf43f5e, torsoShape: 'floating' }, { isMagical: true }),
        mkEnemy(44, 'sumo_gut', 'Undead Sumo Titan', 'normal', 490, 1.85, 48, 0.22, 'stomp_march', 'shockwave_slam', 'Enormous wide heavyweight brute with huge bullet resistance.', { scale: [1.68, 1.28, 1.65], skinColor: 0x9a7b69, shirtColor: 0x7f1d1d, pantsColor: 0x1c1917, eyeColor: 0xef4444, torsoShape: 'bloated' }),
        mkEnemy(45, 'stilts_stalker', 'Sky-Tall Stalker', 'normal', 235, 3.5, 36, 0.08, 'zig_zag', 'melee', 'Towering 2.1x tall skinny horror striding over crowds!', { scale: [0.78, 2.05, 0.78], skinColor: 0x334155, shirtColor: 0x0f172a, pantsColor: 0x020617, eyeColor: 0x38bdf8, torsoShape: 'lean' }),
        mkEnemy(46, 'kangaroo_fiend', 'Pogo-Leap Fiend', 'normal', 230, 4.4, 34, 0.06, 'hop_erratic', 'melee', 'Bouncing desert mutant that leaps huge arcs toward the base!', { scale: [1.0, 1.22, 1.0], skinColor: 0xd97706, shirtColor: 0x78350f, pantsColor: 0x451a03, eyeColor: 0xfef08a, torsoShape: 'lean' }, { jumpChance: 0.60 }),
        mkEnemy(47, 'storm_shaman', 'Storm-Caller Shaman', 'normal', 250, 2.9, 36, 0.10, 'flank_circle', 'aether_bolt', 'Tribal mage firing crackling storm bolts.', { scale: [1.0, 1.16, 1.0], skinColor: 0x1e40af, shirtColor: 0x1d4ed8, pantsColor: 0x172554, eyeColor: 0x38bdf8, haloCrystal: 0x38bdf8, horns: true, torsoShape: 'standard' }, { isMagical: true }),
        mkEnemy(48, 'viking_berserker', 'Viking Berserker', 'normal', 330, 4.0, 44, 0.15, 'charge_bull', 'double_claw', 'Horned Nordic warrior charging recklessly at full speed.', { scale: [1.22, 1.24, 1.18], skinColor: 0x9ca3af, shirtColor: 0x7c2d12, pantsColor: 0x1f2937, eyeColor: 0x60a5fa, helmet: true, horns: true, torsoShape: 'broad' }),
        mkEnemy(49, 'ronin_undead', 'Phantom Ronin', 'normal', 270, 4.6, 42, 0.12, 'zig_zag', 'double_claw', 'Swift undead samurai weaving side-to-side with blade arms.', { scale: [0.96, 1.14, 0.96], skinColor: 0x64748b, shirtColor: 0x991b1b, pantsColor: 0x0f172a, eyeColor: 0xfef08a, helmet: true, razorClaws: true, torsoShape: 'lean' }),
        mkEnemy(50, 'polar_mauler', 'Arctic Polar Bear', 'normal', 430, 3.8, 48, 0.18, 'charge_bull', 'frost_shard', 'Giant white frost Bear that charges and breathes ice.', { scale: [1.52, 1.38, 1.62], skinColor: 0xf1f5f9, shirtColor: 0xe2e8f0, pantsColor: 0xcbd5e1, eyeColor: 0x38bdf8, quadruped: true, torsoShape: 'bloated' }),
        mkEnemy(51, 'mirror_wraith', 'Mirror-Split Wraith', 'normal', 260, 3.7, 36, 0.10, 'hover_drift', 'aether_bolt', 'Spectral ghost that SPLITS INTO 2 wraiths upon death!', { scale: [0.98, 1.22, 0.98], skinColor: 0x818cf8, shirtColor: 0x4338ca, pantsColor: 0x1e1b4b, eyeColor: 0xe0e7ff, floating: true, torsoShape: 'floating' }, { splitCount: 2, isMagical: true }),
        mkEnemy(52, 'stone_gargoyle', 'Winged Gargoyle', 'normal', 340, 3.6, 40, 0.24, 'hover_drift', 'melee', 'Winged stone statue with thick rocky defense.', { scale: [1.18, 1.25, 1.15], skinColor: 0x64748b, shirtColor: 0x475569, pantsColor: 0x334155, eyeColor: 0xf97316, wings: true, horns: true, floating: true, torsoShape: 'broad' }),
        mkEnemy(53, 'cyber_assassin', 'Cyber Stalker', 'normal', 255, 5.2, 42, 0.12, 'sprint', 'double_claw', 'Neon-visor cybernetic assassin with extreme sprint speed.', { scale: [0.92, 1.10, 0.92], skinColor: 0x1e293b, shirtColor: 0x0f172a, pantsColor: 0x020617, eyeColor: 0x22d3ee, helmet: true, razorClaws: true, torsoShape: 'lean' }),
        mkEnemy(54, 'saber_tigerman', 'Saber-Fang Tigerman', 'normal', 310, 5.4, 46, 0.12, 'leap_pounce', 'double_claw', 'White-striped alpha Tigerman that leaps and shreds.', { scale: [1.18, 1.30, 1.15], skinColor: 0xfde68a, shirtColor: 0x1e293b, pantsColor: 0x0f172a, eyeColor: 0xef4444, razorClaws: true, torsoShape: 'broad' }, { jumpChance: 0.40 }),

        // --- HARD & ULTRA-LATE-ROUND TIER (16 new) ---
        mkEnemy(55, 'manbearpig', 'ManBearPig', 'hard', 620, 4.2, 62, 0.26, 'charge_bull', 'shockwave_slam', 'Half Man, Half Bear, Half Pig! Hulking pink-and-brown terror!', { scale: [1.62, 1.54, 1.62], skinColor: 0xf472b6, shirtColor: 0x78350f, pantsColor: 0x451a03, eyeColor: 0xef4444, horns: true, boneSpikes: true, torsoShape: 'bloated' }),
        mkEnemy(56, 'alpha_werewolf', 'Alpha Dire Werewolf', 'hard', 540, 5.6, 58, 0.22, 'leap_pounce', 'double_claw', 'Massive midnight Werewolf alpha that bounds across walls!', { scale: [1.34, 1.54, 1.32], skinColor: 0x1e293b, shirtColor: 0x0f172a, pantsColor: 0x020617, eyeColor: 0xef4444, horns: true, razorClaws: true, glowingRibs: 0xef4444, torsoShape: 'broad' }, { jumpChance: 0.45 }),
        mkEnemy(57, 'iron_ogre', 'Armored Iron Ogre', 'hard', 760, 2.3, 68, 0.36, 'stomp_march', 'shockwave_slam', 'Colossal steel-plated Ogre juggernaut with massive armor.', { scale: [1.72, 1.66, 1.68], skinColor: 0x3f6212, shirtColor: 0x334155, pantsColor: 0x1e293b, eyeColor: 0xf97316, helmet: true, giantClubArm: true, torsoShape: 'armored' }),
        mkEnemy(58, 'arch_witch', 'Grand Coven Arch-Witch', 'hard', 490, 3.6, 55, 0.18, 'teleport_blink', 'aether_bolt', 'Teleporting purple Arch-Witch unleashing arcane barrages!', { scale: [1.10, 1.36, 1.10], skinColor: 0x581c87, shirtColor: 0x3b0764, pantsColor: 0x1e093d, eyeColor: 0xf0abfc, floating: true, wings: true, haloCrystal: 0xe879f9, torsoShape: 'floating' }, { isMagical: true }),
        mkEnemy(59, 'armored_warbear', 'War-Plated Grizzly', 'hard', 710, 4.1, 64, 0.34, 'charge_bull', 'shockwave_slam', 'Steel-armored war Bear that bulldozes fortifications!', { scale: [1.66, 1.52, 1.78], skinColor: 0x451a03, shirtColor: 0x334155, pantsColor: 0x0f172a, eyeColor: 0xfacc15, quadruped: true, boneSpikes: true, torsoShape: 'armored' }),
        mkEnemy(60, 'swarm_broodmother', 'Broodmother Splitter', 'hard', 560, 2.5, 50, 0.20, 'stomp_march', 'acid_spit', 'Giant pulsing hive-mother that SPLITS INTO 4 fast swarmers on death!', { scale: [1.65, 1.38, 1.65], skinColor: 0x4d7c0f, shirtColor: 0x365314, pantsColor: 0x1a2e05, eyeColor: 0xa3e635, backSac: 0x4ade80, tentacles: true, torsoShape: 'bloated' }, { splitCount: 4 }),
        mkEnemy(61, 'minotaur_charger', 'Crimson Minotaur', 'hard', 660, 4.7, 65, 0.28, 'charge_bull', 'shockwave_slam', 'Giant horned Minotaur that charges like a freight train!', { scale: [1.50, 1.62, 1.48], skinColor: 0x7f1d1d, shirtColor: 0x450a0a, pantsColor: 0x1c1917, eyeColor: 0xfacc15, horns: true, torsoShape: 'broad' }),
        mkEnemy(62, 'cyclops_crusher', 'One-Eyed Cyclops', 'hard', 820, 2.4, 74, 0.32, 'stomp_march', 'shockwave_slam', 'Towering 1.9x Cyclops giant smashing everything in sight!', { scale: [1.75, 1.92, 1.70], skinColor: 0x92400e, shirtColor: 0x451a03, pantsColor: 0x291103, eyeColor: 0xfef08a, giantClubArm: true, torsoShape: 'broad' }),
        mkEnemy(63, 'yeti_colossus', 'Himalayan Yeti', 'hard', 740, 3.5, 62, 0.28, 'leap_pounce', 'frost_shard', 'Massive white snow-monster that leaps & hurls frost shards.', { scale: [1.65, 1.78, 1.60], skinColor: 0xe2e8f0, shirtColor: 0xcbd5e1, pantsColor: 0x94a3b8, eyeColor: 0x38bdf8, horns: true, torsoShape: 'broad' }, { jumpChance: 0.30 }),
        mkEnemy(64, 'vampire_lord', 'Nosferatu Vampire Lord', 'hard', 520, 5.1, 56, 0.20, 'teleport_blink', 'life_drain', 'Winged immortal Vampire that teleports & steals health!', { scale: [1.08, 1.38, 1.05], skinColor: 0xe2e8f0, shirtColor: 0x7f1d1d, pantsColor: 0x0f172a, eyeColor: 0xef4444, wings: true, floating: true, torsoShape: 'floating' }, { isMagical: true }),
        mkEnemy(65, 'magma_brute', 'Volcanic Magma Titan', 'hard', 780, 2.7, 68, 0.34, 'stomp_march', 'fire_bolt', 'Molten lava giant glowing orange and hurling fireballs!', { scale: [1.60, 1.65, 1.58], skinColor: 0x450a0a, shirtColor: 0x9a3412, pantsColor: 0x1c1917, eyeColor: 0xfef08a, glowingRibs: 0xf97316, torsoShape: 'broad' }),
        mkEnemy(66, 'fracture_golem', 'Crystal Fracture Golem', 'hard', 690, 2.4, 58, 0.36, 'stomp_march', 'melee', 'Diamond-armored golem that SPLITS INTO 4 crystal shards on death!', { scale: [1.54, 1.56, 1.52], skinColor: 0x38bdf8, shirtColor: 0x0284c7, pantsColor: 0x0c4a6e, eyeColor: 0xe0f2fe, haloCrystal: 0x38bdf8, torsoShape: 'armored' }, { splitCount: 4 }),
        mkEnemy(67, 'hydra_spawn', 'Three-Headed Hydra', 'hard', 720, 3.2, 64, 0.28, 'charge_bull', 'acid_spit', 'Multi-headed serpent beast that SPLITS INTO 2 hydras when slain!', { scale: [1.55, 1.52, 1.62], skinColor: 0x15803d, shirtColor: 0x166534, pantsColor: 0x052e16, eyeColor: 0xfacc15, extraHeads: 2, tentacles: true, torsoShape: 'broad' }, { splitCount: 2 }),
        mkEnemy(68, 'obsidian_golem', 'Obsidian Dreadnought', 'hard', 950, 2.1, 78, 0.44, 'stomp_march', 'shockwave_slam', 'Near-indestructible black obsidian colossus for ultra-late waves.', { scale: [1.80, 1.84, 1.78], skinColor: 0x0f172a, shirtColor: 0x1e1b4b, pantsColor: 0x020617, eyeColor: 0xc084fc, glowingRibs: 0xa855f7, torsoShape: 'armored' }),
        mkEnemy(69, 'infernal_manbearpig', 'Infernal ManBearPig', 'hard', 980, 4.8, 82, 0.35, 'charge_bull', 'fire_bolt', 'Super-powered blazing ManBearPig with flaming ribs and horns!', { scale: [1.78, 1.72, 1.78], skinColor: 0xec4899, shirtColor: 0x991b1b, pantsColor: 0x450a0a, eyeColor: 0xfef08a, horns: true, glowingRibs: 0xf97316, boneSpikes: true, torsoShape: 'bloated' }),
        mkEnemy(70, 'void_emperor', 'Abyssal Void Sovereign', 'hard', 1120, 4.1, 86, 0.40, 'teleport_blink', 'aether_bolt', 'Ultimate late-game cosmic nightmare with 4 arms, wings & void magic!', { scale: [1.55, 1.82, 1.50], skinColor: 0x1e093d, shirtColor: 0x581c87, pantsColor: 0x090314, eyeColor: 0x38bdf8, extraArms: 2, wings: true, horns: true, floating: true, haloCrystal: 0x22d3ee, tentacles: true, torsoShape: 'floating' }, { isMagical: true })
    ];

    for (const ne of NEW_50_ENEMIES) ZOMBIE_TYPES.push(ne);

    // Ordered progression array: Easy (easiest first) -> Normal -> Hard (roughest last!)
    const ORDERED_PROGRESSION = ZOMBIE_TYPES.slice().sort((a, b) => {
        const rRank = { easy: 0, normal: 1, hard: 2 };
        if (rRank[a.rarity] !== rRank[b.rarity]) return rRank[a.rarity] - rRank[b.rarity];
        return (a.hp + a.attack * 3) - (b.hp + b.attack * 3);
    });

    // 5 Completely Unique Bosses at Rounds 5, 10, 20, 25, and 50
    const BOSSES_BY_ROUND = {
        5: {
            id: 'boss_butcher',
            bossRound: 5,
            name: 'THE BUTCHER',
            title: 'Cleaver Juggernaut',
            simpleDesc: 'Round 5 Boss! Giant stitched butcher with a huge cleaver arm that charges and slams the ground. Aim for his head!',
            weaknessText: 'WEAK: HEADSHOTS (1.8x) • RESISTS: MELEE',
            hp: 1650,
            speed: 3.1,
            attack: 52,
            defense: 0.22,
            resistances: { bullet: 0.90, explosive: 1.25, fire: 1.0, headshot: 1.80, melee: 0.45 },
            movementHabit: 'charge_bull',
            attackType: 'shockwave_slam',
            soundProfile: 'roar_deep',
            isBoss: true,
            drops: { points: 1500, xp: 650, guaranteedPowerUp: 'max_ammo', refillArmor: true },
            bodySpec: {
                scale: [1.65, 1.70, 1.55],
                skinColor: 0x6b4c45, shirtColor: 0x451a1a, pantsColor: 0x1c1917, eyeColor: 0xff4500,
                giantClubArm: true, boneSpikes: true, torsoShape: 'broad'
            }
        },
        10: {
            id: 'boss_cerberus',
            bossRound: 10,
            name: 'INFERNO CERBERUS',
            title: 'Three-Headed Hellhound Alpha',
            simpleDesc: 'Round 10 Boss! Massive three-headed fire hound that leaps across rooms and spits blazing fireballs. Immune to fire!',
            weaknessText: 'WEAK: HEADSHOTS & BULLETS • IMMUNE: FIRE',
            hp: 3400,
            speed: 4.5,
            attack: 56,
            defense: 0.25,
            resistances: { bullet: 1.0, explosive: 1.20, fire: 0.10, headshot: 1.65, melee: 0.70 },
            movementHabit: 'leap_pounce',
            attackType: 'fire_bolt',
            soundProfile: 'hound_bark',
            isBoss: true,
            drops: { points: 2500, xp: 1100, guaranteedPowerUp: 'max_ammo', refillArmor: true },
            bodySpec: {
                scale: [1.75, 1.65, 1.85],
                skinColor: 0x26120f, shirtColor: 0xb91c1c, pantsColor: 0x1a0e0c, eyeColor: 0xff8c00,
                quadruped: true, extraHeads: 2, horns: true, glowingRibs: 0xf97316
            }
        },
        20: {
            id: 'boss_plague',
            bossRound: 20,
            name: 'DR. PLAGUE',
            title: 'Four-Armed Blight Alchemist',
            simpleDesc: 'Round 20 Boss! Mutated scientist with 4 syringe arms and glowing green bio-tanks. Launches acid volleys and toxic clouds!',
            weaknessText: 'WEAK: EXPLOSIVES & HEADSHOTS • HIGH DEFENSE',
            hp: 6800,
            speed: 3.3,
            attack: 64,
            defense: 0.34,
            resistances: { bullet: 0.80, explosive: 1.65, fire: 1.20, headshot: 1.55, melee: 0.60 },
            movementHabit: 'flank_circle',
            attackType: 'acid_spit',
            soundProfile: 'hiss_toxic',
            isBoss: true,
            drops: { points: 4000, xp: 1800, guaranteedPowerUp: 'double_points', refillArmor: true },
            bodySpec: {
                scale: [1.52, 1.62, 1.52],
                skinColor: 0x3b6e4c, shirtColor: 0x14532d, pantsColor: 0x0b2615, eyeColor: 0x4ade80,
                extraArms: 2, backSac: 0x22c55e, glowingRibs: 0x4ade80, helmet: true, torsoShape: 'hunched'
            }
        },
        25: {
            id: 'boss_colossus',
            bossRound: 25,
            name: 'IRON COLOSSUS',
            title: 'Armored Siege Dreadnought',
            simpleDesc: 'Round 25 Boss! Colossal welded tank-zombie with heavy riot armor. Shrugs off regular bullets—bring explosives or Pack-a-Punch!',
            weaknessText: 'WEAK: EXPLOSIVES (1.8x) & PACK-A-PUNCH • RESISTS BULLETS',
            hp: 10500,
            speed: 2.55,
            attack: 78,
            defense: 0.48,
            resistances: { bullet: 0.42, explosive: 1.80, fire: 0.65, headshot: 1.35, melee: 0.35 },
            movementHabit: 'stomp_march',
            attackType: 'shockwave_slam',
            soundProfile: 'metal_clang',
            isBoss: true,
            drops: { points: 6000, xp: 2500, guaranteedPowerUp: 'max_ammo', refillArmor: true },
            bodySpec: {
                scale: [2.0, 2.05, 1.95],
                skinColor: 0x334155, shirtColor: 0x1e293b, pantsColor: 0x0f172a, eyeColor: 0xef4444,
                helmet: true, riotShield: true, giantClubArm: true, boneSpikes: true, torsoShape: 'armored'
            }
        },
        50: {
            id: 'boss_nyx',
            bossRound: 50,
            name: 'OVERLORD NYX',
            title: 'Shadow Aether Sovereign',
            simpleDesc: 'Round 50 Final Boss! Colossal floating 4-armed Aether monarch with orbiting crystals. Teleports and rains dark-matter bolts!',
            weaknessText: 'WEAK: PACK-A-PUNCH TIER III & HEADSHOTS',
            hp: 24000,
            speed: 4.1,
            attack: 95,
            defense: 0.45,
            resistances: { bullet: 0.65, explosive: 1.30, fire: 0.75, headshot: 1.50, melee: 0.50 },
            movementHabit: 'teleport_blink',
            attackType: 'aether_bolt',
            soundProfile: 'wail_void',
            isBoss: true,
            drops: { points: 15000, xp: 6000, guaranteedPowerUp: 'nuke', refillArmor: true },
            bodySpec: {
                scale: [2.05, 2.20, 1.95],
                skinColor: 0x1e0b38, shirtColor: 0x581c87, pantsColor: 0x0f051d, eyeColor: 0xf472b6,
                extraArms: 2, horns: true, wings: true, floating: true, haloCrystal: 0xe879f9, tentacles: true, torsoShape: 'floating'
            }
        },
        15: {
            id: 'boss_witch_queen',
            bossRound: 15,
            name: 'GRAND COVEN MATRIARCH',
            title: 'Supreme Hex Witch',
            simpleDesc: 'Wave 15 Boss! Giant floating Witch Queen firing arcane volleys!',
            weaknessText: 'WEAK: HEADSHOTS & SNIPERS • MAGICAL',
            hp: 4600, speed: 3.6, attack: 60, defense: 0.28, isBoss: true, isMagical: true,
            resistances: { bullet: 0.90, explosive: 1.25, fire: 1.15, headshot: 1.70, melee: 0.70 },
            movementHabit: 'hover_drift', attackType: 'aether_bolt', soundProfile: 'wail_void',
            drops: { points: 3200, xp: 1400, guaranteedPowerUp: 'max_ammo', refillArmor: true },
            bodySpec: { scale: [1.75, 1.95, 1.70], skinColor: 0x4c1d95, shirtColor: 0x3b0764, pantsColor: 0x1e093d, eyeColor: 0x4ade80, floating: true, wings: true, haloCrystal: 0xc084fc, torsoShape: 'floating' }
        },
        30: {
            id: 'boss_manbearpig',
            bossRound: 30,
            name: 'APEX MANBEARPIG',
            title: 'Super Cereal Chimera',
            simpleDesc: 'Wave 30 Boss! Colossal half-man, half-bear, half-pig juggernaut!',
            weaknessText: 'WEAK: EXPLOSIVES & HEADSHOTS',
            hp: 11500, speed: 4.5, attack: 78, defense: 0.36, isBoss: true,
            resistances: { bullet: 0.80, explosive: 1.45, fire: 0.90, headshot: 1.65, melee: 0.55 },
            movementHabit: 'charge_bull', attackType: 'shockwave_slam', soundProfile: 'roar_deep',
            drops: { points: 6500, xp: 2800, guaranteedPowerUp: 'max_ammo', refillArmor: true },
            bodySpec: { scale: [2.15, 2.05, 2.15], skinColor: 0xf472b6, shirtColor: 0x78350f, pantsColor: 0x451a03, eyeColor: 0xef4444, horns: true, boneSpikes: true, torsoShape: 'bloated' }
        },
        35: {
            id: 'boss_lycan_king',
            bossRound: 35,
            name: 'LYCANTHROPE KING',
            title: 'Bloodmoon Werewolf Sovereign',
            simpleDesc: 'Wave 35 Boss! Giant leaping Alpha Werewolf monarch!',
            weaknessText: 'WEAK: SILVER/HEADSHOTS • SUPER FAST',
            hp: 13800, speed: 5.4, attack: 80, defense: 0.34, isBoss: true, jumpChance: 0.45,
            resistances: { bullet: 0.85, explosive: 1.25, fire: 1.25, headshot: 1.75, melee: 0.65 },
            movementHabit: 'leap_pounce', attackType: 'double_claw', soundProfile: 'hound_bark',
            drops: { points: 8000, xp: 3400, guaranteedPowerUp: 'insta_kill', refillArmor: true },
            bodySpec: { scale: [1.90, 2.15, 1.85], skinColor: 0x1e293b, shirtColor: 0x0f172a, pantsColor: 0x020617, eyeColor: 0xfef08a, horns: true, razorClaws: true, glowingRibs: 0xef4444, torsoShape: 'broad' }
        },
        40: {
            id: 'boss_ogre_emperor',
            bossRound: 40,
            name: 'OGRE EMPEROR',
            title: 'Mountain Siege Crusher',
            simpleDesc: 'Wave 40 Boss! Gargantuan armored Ogre king with earth-shattering slams!',
            weaknessText: 'WEAK: EXPLOSIVES & PACK-A-PUNCH',
            hp: 17500, speed: 2.7, attack: 92, defense: 0.45, isBoss: true,
            resistances: { bullet: 0.68, explosive: 1.65, fire: 0.90, headshot: 1.50, melee: 0.40 },
            movementHabit: 'stomp_march', attackType: 'shockwave_slam', soundProfile: 'roar_deep',
            drops: { points: 10000, xp: 4200, guaranteedPowerUp: 'max_ammo', refillArmor: true },
            bodySpec: { scale: [2.30, 2.25, 2.25], skinColor: 0x4d7c0f, shirtColor: 0x334155, pantsColor: 0x1e293b, eyeColor: 0xf97316, helmet: true, giantClubArm: true, torsoShape: 'armored' }
        },
        45: {
            id: 'boss_hydra_matron',
            bossRound: 45,
            name: 'HYDRA MATRON',
            title: 'Splitting Terror',
            simpleDesc: 'Wave 45 Boss! Three-headed boss that SPLITS INTO 2 hydras on death!',
            weaknessText: 'WEAK: FIRE & EXPLOSIVES',
            hp: 19500, speed: 3.4, attack: 88, defense: 0.40, isBoss: true, splitCount: 2,
            resistances: { bullet: 0.78, explosive: 1.45, fire: 1.55, headshot: 1.50, melee: 0.55 },
            movementHabit: 'charge_bull', attackType: 'acid_spit', soundProfile: 'hiss_toxic',
            drops: { points: 12000, xp: 5000, guaranteedPowerUp: 'nuke', refillArmor: true },
            bodySpec: { scale: [2.15, 2.05, 2.25], skinColor: 0x15803d, shirtColor: 0x14532d, pantsColor: 0x052e16, eyeColor: 0xfacc15, extraHeads: 2, tentacles: true, torsoShape: 'broad' }
        }
    };

    const ORDERED_BOSSES = Object.values(BOSSES_BY_ROUND).sort((a, b) => a.bossRound - b.bossRound);

    const BY_ID = Object.create(null);
    for (const z of ZOMBIE_TYPES) BY_ID[z.id] = z;
    Object.values(BOSSES_BY_ROUND).forEach((b) => { BY_ID[b.id] = b; });

    BO.ZombiesData = {
        ZOMBIE_TYPES,
        ORDERED_PROGRESSION,
        BOSSES_BY_ROUND,
        ORDERED_BOSSES,
        get(id) {
            return BY_ID[id] || ZOMBIE_TYPES[0];
        },
        getBossForRound(round) {
            return BOSSES_BY_ROUND[round] || null;
        },
        /**
         * Picks an enemy using exact tier spawn rates:
         * Boss starts at 2% (+0.5% per round after Round 10, or custom bossChancePct).
         * Non-boss tiers scale proportionally at Easy 50 : Normal 25 : Hard 15.
         */
        pickFromTieredPool(unlockedEnemyList, unlockedBossList, disabledSet, bossChancePct = 2.0) {
            const isOk = (e) => !disabledSet || !disabledSet.has(e.id);
            const easy = (unlockedEnemyList || []).filter((e) => e.rarity === 'easy' && isOk(e));
            const normal = (unlockedEnemyList || []).filter((e) => e.rarity === 'normal' && isOk(e));
            const hard = (unlockedEnemyList || []).filter((e) => e.rarity === 'hard' && isOk(e));
            const boss = (unlockedBossList || []).filter((b) => isOk(b));

            const clampedBoss = Math.max(0, Math.min(100, Number(bossChancePct)));
            if (boss.length > 0 && clampedBoss > 0 && Math.random() * 100 < clampedBoss) {
                return BO.Math.pick(boss);
            }

            const buckets = [];
            if (easy.length > 0) buckets.push({ list: easy, w: 50 });
            if (normal.length > 0) buckets.push({ list: normal, w: 25 });
            if (hard.length > 0) buckets.push({ list: hard, w: 15 });

            if (buckets.length === 0) {
                if (boss.length > 0) return BO.Math.pick(boss);
                return ZOMBIE_TYPES[0];
            }
            const totalW = buckets.reduce((a, b) => a + b.w, 0);
            let roll = Math.random() * totalW;
            for (const b of buckets) {
                roll -= b.w;
                if (roll <= 0) return BO.Math.pick(b.list);
            }
            return BO.Math.pick(buckets[buckets.length - 1].list);
        },
        /**
         * Returns all zombies unlocked for a given round:
         * Round 1 starts with Zombie #1; every 3 rounds completed adds 1 new zombie (Rd 4, 7, 10, ..., 58).
         */
        getUnlockedPool(round) {
            const unlockedCount = Math.min(ZOMBIE_TYPES.length, 1 + Math.floor(Math.max(0, round - 1) / 3));
            return ZOMBIE_TYPES.slice(0, unlockedCount);
        },
        getNewlyUnlockedForRound(round) {
            if (round <= 1) return null;
            if ((round - 1) % 3 !== 0) return null;
            const idx = Math.floor((round - 1) / 3);
            return ZOMBIE_TYPES[idx] || null;
        },
        pickWeightedZombie(round) {
            const pool = this.getUnlockedPool(round);
            let total = 0;
            for (let i = 0; i < pool.length; i++) total += pool[i].spawnWeight;
            let roll = Math.random() * total;
            for (let i = 0; i < pool.length; i++) {
                roll -= pool[i].spawnWeight;
                if (roll <= 0) return pool[i];
            }
            return pool[pool.length - 1];
        },
        getSpawnOddsPercent(zombieSpec, referenceRound = 60) {
            const pool = this.getUnlockedPool(Math.max(referenceRound, zombieSpec.unlockRound));
            const total = pool.reduce((acc, z) => acc + z.spawnWeight, 0);
            return ((zombieSpec.spawnWeight / Math.max(1, total)) * 100).toFixed(1);
        },

        /**
         * Builds a detailed, plain-English field report for any enemy or boss.
         * Returns { threat, threatLabel, movement, attack, traits[], weak[], resists[], tip, lines[] }.
         */
        describe(spec) {
            if (!spec) return null;
            const MOVE = {
                lumber: 'Lumbers forward in a slow, steady line — easy to kite.',
                crawl_fast: 'Scuttles low along the ground at speed; aim down, it is a small target.',
                sprint: 'Sprints straight at you. Back-pedal and keep firing.',
                hop_erratic: 'Hops unpredictably, making it hard to track.',
                flank_circle: 'Circles around to flank you instead of charging head-on.',
                charge_bull: 'Builds up and charges in a straight line — sidestep at the last second.',
                stomp_march: 'Marches slowly but cannot be staggered easily.',
                leap_pounce: 'Closes distance with long leaping pounces.',
                zig_zag: 'Zig-zags as it approaches to throw off your aim.',
                hover_drift: 'Floats and drifts through the air above obstacles.',
                teleport_blink: 'Blinks short distances, appearing suddenly closer.'
            };
            const ATK = {
                melee: 'Basic claw and bite swipes at close range.',
                double_claw: 'Fast two-handed claw combos that shred armor.',
                acid_spit: 'Spits acid from range that burns over time.',
                suicide_blast: 'Explodes when it reaches you — kill it at range.',
                pounce: 'Pounces on you from a distance.',
                toxic_cloud: 'Leaves a lingering toxic cloud; do not stand in it.',
                shield_bash: 'Bashes with a heavy shield; flank it or aim for exposed spots.',
                fire_bolt: 'Hurls bolts of fire from range.',
                frost_shard: 'Fires ice shards that slow you down.',
                shockwave_slam: 'Slams the ground, sending out a damaging shockwave.',
                life_drain: 'Drains your health from range to heal itself.',
                aether_bolt: 'Casts glowing aether bolts from range.'
            };
            const BODY = {
                missingLegs: 'Legless crawler', razorClaws: 'Razor claws', missingLeftArm: 'One arm',
                giantClubArm: 'Giant club arm', backSac: 'Volatile back sac', headless: 'Headless (headshots do not apply)',
                boneSpikes: 'Bone spikes', quadruped: 'Four-legged', horns: 'Horned', glowingRibs: 'Glowing ribcage',
                riotShield: 'Riot shield', helmet: 'Helmet', extraHeads: 'Multiple heads', floating: 'Floating',
                haloCrystal: 'Halo crystal', extraArms: 'Extra arms', tentacles: 'Tentacles', wings: 'Winged'
            };
            const RES_NAMES = { bullet: 'bullets', explosive: 'explosives', fire: 'fire', headshot: 'headshots', melee: 'melee' };
            const res = spec.resistances || {};
            const weak = [];
            const resists = [];
            Object.keys(RES_NAMES).forEach((k) => {
                const v = Number(res[k] ?? 1);
                if (v >= 1.15) weak.push(`${RES_NAMES[k]} (${v.toFixed(2)}x)`);
                else if (v <= 0.85) resists.push(`${RES_NAMES[k]} (${Math.round((1 - v) * 100)}% less)`);
            });
            const bs = spec.bodySpec || {};
            const traits = Object.keys(BODY).filter((k) => bs[k]).map((k) => BODY[k]);
            if (spec.splitCount) traits.push(`Splits into ${spec.splitCount} on death`);
            if (spec.jumpChance) traits.push(`Jumps (${Math.round(spec.jumpChance * 100)}% of the time)`);
            if (spec.isMagical) traits.push('Casts magic');
            const sc = bs.scale || [1, 1, 1];
            const height = sc[1] || 1;
            if (height >= 1.4) traits.push('Very tall');
            else if (height <= 0.75) traits.push('Small');
            if ((sc[0] || 1) >= 1.4) traits.push('Heavy build');

            // Threat score from effective health, damage and speed
            const effHp = (spec.hp || 100) / Math.max(0.2, 1 - (spec.defense || 0));
            const score = effHp / 150 + (spec.attack || 20) / 25 + (spec.speed || 2) / 2.2 + (spec.isMagical ? 0.8 : 0) + (spec.splitCount ? 0.6 : 0);
            const threat = spec.isBoss ? 5 : Math.max(1, Math.min(5, Math.round(score / 1.4)));
            const threatLabel = ['', 'Low', 'Moderate', 'High', 'Severe', 'Extreme'][threat];

            let tip;
            if (bs.headless) tip = 'No head to hit — focus on body damage and explosives.';
            else if (spec.attackType === 'suicide_blast') tip = 'Never let it reach you. Shoot it early, ideally into a crowd.';
            else if (res.headshot >= 1.5) tip = 'Its head is a huge weak spot — precision weapons shine here.';
            else if (res.explosive >= 1.2) tip = 'Explosives deal bonus damage. Save a grenade for it.';
            else if (res.fire >= 1.2) tip = 'Fire hurts it badly — incendiary rounds or fire weapons work well.';
            else if (res.melee >= 1.2) tip = 'Surprisingly weak to melee. Get close and swing.';
            else if (spec.speed >= 4) tip = 'Very fast. Keep moving backward and aim slightly ahead of it.';
            else if (['acid_spit', 'fire_bolt', 'frost_shard', 'aether_bolt', 'life_drain'].includes(spec.attackType)) tip = 'Ranged attacker — break line of sight and close in, or out-shoot it from cover.';
            else if ((spec.defense || 0) >= 0.25) tip = 'Heavily armored. Use high-damage or armor-piercing weapons.';
            else tip = 'Straightforward fighter — headshots end it fastest.';

            const lines = [];
            lines.push(spec.simpleDesc || 'A unique undead combatant.');
            if (spec.title) lines.push(spec.title + '.');
            lines.push(MOVE[spec.movementHabit] || 'Moves steadily toward you.');
            lines.push(ATK[spec.attackType] || 'Attacks at close range.');
            return {
                threat, threatLabel,
                movement: MOVE[spec.movementHabit] || '',
                attack: ATK[spec.attackType] || '',
                traits, weak, resists, tip, lines,
                unlock: spec.isBoss ? (spec.bossRound ? `Boss round ${spec.bossRound}` : 'Boss pool') : `Joins from round ${spec.unlockRound || 1}`,
                points: (spec.drops && spec.drops.points) || 0
            };
        }
    };
})(window);
