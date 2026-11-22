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
        }
    };

    const BY_ID = Object.create(null);
    for (const z of ZOMBIE_TYPES) BY_ID[z.id] = z;
    Object.values(BOSSES_BY_ROUND).forEach((b) => { BY_ID[b.id] = b; });

    BO.ZombiesData = {
        ZOMBIE_TYPES,
        BOSSES_BY_ROUND,
        get(id) {
            return BY_ID[id] || ZOMBIE_TYPES[0];
        },
        getBossForRound(round) {
            return BOSSES_BY_ROUND[round] || null;
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
        }
    };
})(window);
