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
