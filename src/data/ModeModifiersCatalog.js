/* ============================================================================
   BLACKOUT OPS — 300 Exclusive Mode Modifiers (100 Zombies, 100 MP, 100 TD)
   Organized into 8 dedicated categories per mode + curated bundles.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const CATEGORIES = [
        // Zombies (8 dedicated categories)
        { id: 'zm_perks', name: 'Perks & Alchemy', icon: '🥤', col: '#4ade80', mode: 'zombies' },
        { id: 'zm_mystery', name: 'Mystery Box & PaP', icon: '📦', col: '#f59e0b', mode: 'zombies' },
        { id: 'zm_powerups', name: 'Power-Ups & Drops', icon: '⚡', col: '#facc15', mode: 'zombies' },
        { id: 'zm_rounds', name: 'Rounds & Exfil', icon: '🔁', col: '#fb923c', mode: 'zombies' },
        { id: 'zm_fortify', name: 'Fortifications & Towers', icon: '🛡', col: '#60a5fa', mode: 'zombies' },
        { id: 'zm_mutations', name: 'Undead Mutations', icon: '🧬', col: '#f87171', mode: 'zombies' },
        { id: 'zm_arsenal', name: 'Arsenal & Elements', icon: '🔫', col: '#38bdf8', mode: 'zombies' },
        { id: 'zm_rituals', name: 'Dark Rituals', icon: '🕯', col: '#c084fc', mode: 'zombies' },

        // Multiplayer (8 dedicated categories)
        { id: 'mp_streaks', name: 'Streaks & Ultimates', icon: '🛰', col: '#f59e0b', mode: 'mp' },
        { id: 'mp_movement', name: 'Mobility & Parkour', icon: '💨', col: '#38bdf8', mode: 'mp' },
        { id: 'mp_gunplay', name: 'Ballistics & Gunplay', icon: '🎯', col: '#60a5fa', mode: 'mp' },
        { id: 'mp_objectives', name: 'Match & Objectives', icon: '🏁', col: '#4ade80', mode: 'mp' },
        { id: 'mp_bots', name: 'Bot Squad & AI', icon: '🤖', col: '#f87171', mode: 'mp' },
        { id: 'mp_tactical', name: 'Gear, Armor & Perks', icon: '🦺', col: '#a3e635', mode: 'mp' },
        { id: 'mp_duels', name: 'Duel Rulesets', icon: '⚔️', col: '#e879f9', mode: 'mp' },
        { id: 'mp_arena', name: 'Arena Storms', icon: '🌩', col: '#c084fc', mode: 'mp' },

        // Tower Defense (8 dedicated categories)
        { id: 'td_fortress', name: 'Castle Walls & Heart', icon: '🏰', col: '#4ade80', mode: 'td' },
        { id: 'td_turrets', name: 'Turrets & Traps', icon: '🔩', col: '#38bdf8', mode: 'td' },
        { id: 'td_economy', name: 'Treasury & Shop', icon: '💰', col: '#fde047', mode: 'td' },
        { id: 'td_towers', name: 'Sniper Towers & Perches', icon: '🗼', col: '#fb923c', mode: 'td' },
        { id: 'td_siege', name: 'Siege Breachers', icon: '🐏', col: '#f87171', mode: 'td' },
        { id: 'td_magic', name: 'Keep Wards & Elements', icon: '✨', col: '#c084fc', mode: 'td' },
        { id: 'td_arsenal', name: 'Defender Arms', icon: '💥', col: '#60a5fa', mode: 'td' },
        { id: 'td_tactics', name: 'Commander Tactics', icon: '🎖', col: '#e879f9', mode: 'td' }
    ];

    const z = (k, lbl, cat, tier, ico, desc, fx = {}) => ({ k, lbl, cat, tier, ico, modes: ['zombies'], exclusive: true, desc, fx });
    const m = (k, lbl, cat, tier, ico, desc, fx = {}) => ({ k, lbl, cat, tier, ico, modes: ['mp'], exclusive: true, desc, fx });
    const t = (k, lbl, cat, tier, ico, desc, fx = {}) => ({ k, lbl, cat, tier, ico, modes: ['td'], exclusive: true, desc, fx });

    const DEFS = [
        // =========================================================================
        // 100 UNIQUE ZOMBIES MODIFIERS (zm_*)
        // =========================================================================
        // zm_perks (12)
        z('zm_perk_surge', 'Perk Escalation (+12%/Perk)', 'zm_perks', 'buff', '🥤', 'Each active Perk-a-Cola adds +12% weapon damage.', { perkDmgStack: 0.12 }),
        z('zm_quick_hands_aura', 'Speed Cola Shockwave', 'zm_perks', 'tactical', '🌀', 'Finishing a reload triggers a 4.5m knockback pulse when Speed Cola is active (or +10% reload blast).', { reloadBlast: 85 }),
        z('zm_jug_thorns', 'Juggernog Reactive Arc', 'zm_perks', 'buff', '⚡', 'Melees hitting you trigger a reactive 90-dmg arc shock back at the attacker.', { counterShock: 90 }),
        z('zm_perk_insurance', 'Perk Recovery Rebate', 'zm_perks', 'buff', '🪙', 'Using a Self-Revive refunds 1,500 emergency recovery points.', { selfReviveBonusPts: 1500 }),
        z('zm_double_tap_echo', 'Quad-Round Echo', 'zm_perks', 'buff', '🔫', 'Every 4th round fired deals +120% bonus double-tap damage.', { everyNthShot: 4, nthMult: 2.2 }),
        z('zm_deadshot_domino', 'Deadshot Cranial Domino', 'zm_perks', 'buff', '💀', 'Headshot hits arc 35% bonus damage to the nearest undead head within 6m.', { headshotChain: 0.35 }),
        z('zm_stamin_slide_spark', 'Kinetic Slide Mine', 'zm_perks', 'tactical', '💨', 'Sliding plants a brief cryo-arc burst damaging zombies behind you.', { slideShock: 110 }),
        z('zm_blood_chalice_perks', 'Blood Chalice Altars', 'zm_perks', 'chaos', '🩸', 'Perk-a-Cola machines are 70% cheaper, but purchasing a perk drains 30% current HP.', { perkPriceMult: 0.30, perkHpCost: 0.30 }),
        z('zm_phd_meteor', 'PhD Meteor Impact', 'zm_perks', 'tactical', '☄️', 'Explosive self-damage is reduced 85% and sliding deals 140 impact dmg to zombies.', { noSelfExplode: true, slideRamDmg: 140 }),
        z('zm_mule_overdrive', 'Quick-Swap Overdrive', 'zm_perks', 'buff', '🔁', 'Switching weapons grants +30% fire rate for 2.5 seconds.', { swapFireRateBuff: 0.30 }),
        z('zm_tombstone_pulse', 'Tombstone Revive Nova', 'zm_perks', 'tactical', '💥', 'Recovering from Last Stand unleashes a 9m shockwave blasting zombies clear.', { reviveNova: 350 }),
        z('zm_alchemy_reserve', 'Alchemical Reserves', 'zm_perks', 'buff', '🧪', 'Maximum reserve ammo capacities across all firearms increase +35%.', { reserveMult: 1.35 }),

        // zm_mystery (12)
        z('zm_box_bargain', 'Bargain Mystery Box', 'zm_mystery', 'buff', '📦', 'Mystery Box spins cost 50% fewer points.', { boxPriceMult: 0.50 }),
        z('zm_box_wonder_luck', 'Golden Ticket Crates', 'zm_mystery', 'buff', '🎟', 'Every 4th Mystery Box roll guarantees a Wonder or Magic weapon.', { boxWonderCadence: 4 }),
        z('zm_box_tax_ammo', 'Loaded Box Crates', 'zm_mystery', 'buff', '🧰', 'Any weapon claimed from Box or Wallbuy arrives with +50% extra reserve.', { bonusDropReserve: 0.5 }),
        z('zm_pap_discount', 'Half-Price Pack-a-Punch', 'zm_mystery', 'buff', '⚡', 'Pack-a-Punch machine upgrades cost 45% fewer points.', { papPriceMult: 0.55 }),
        z('zm_pap_hyperclock', 'Overclocked PaP Chasis', 'zm_mystery', 'buff', '🔥', 'Pack-a-Punched firearms shoot +25% faster and recoil 35% less.', { papFireRateBonus: 0.25 }),
        z('zm_pap_elemental', 'Prismatic PaP Coils', 'zm_mystery', 'chaos', '🌈', 'Pack-a-Punched shots alternate Burn ignition and Cryo chill on impact.', { papElemental: true }),
        z('zm_wallbuy_scaling', 'Veteran Wall-Guns', 'zm_mystery', 'tactical', '📈', 'Non-PaP weapons gain +6% damage per surviving round (up to +120%).', { roundWeaponRamp: 0.06 }),
        z('zm_wonder_recharge', 'Aether Capacitor Core', 'zm_mystery', 'buff', '🔋', 'Magic & Wonder weapons passively recharge +1 reserve charge every 2s.', { wonderRegen: 0.5 }),
        z('zm_box_armor_gift', 'Armored Box Delivery', 'zm_mystery', 'buff', '🦺', 'Every Mystery Box weapon claim also restores full Armor + 1 spare plate.', { boxRestoresArmor: true }),
        z('zm_pap_shred_boss', 'Boss-Bane Infusion', 'zm_mystery', 'tactical', '👑', 'Pack-a-Punched rounds ignore zombie armor & deal +50% to Zone Bosses.', { papBossBonus: 0.50 }),
        z('zm_cursed_box_tax', 'Greed Mystery Crate', 'zm_mystery', 'challenge', '💸', 'Mystery Box rolls cost +75% points, but always grant +800 kill score bonus buff.', { boxPriceMult: 1.75 }),
        z('zm_no_pap_purist', 'Classic Unpacked', 'zm_mystery', 'challenge', '🚫', 'Pack-a-Punch price triples; base firearms gain +40% headshot critical dmg.', { papPriceMult: 3.0, headshotBonus: 0.40 }),

        // zm_powerups (12)
        z('zm_drop_frenzy', 'Power-Up Rain', 'zm_powerups', 'buff', '✨', 'Zombies drop Mystery Power-Ups 2.4x more frequently.', { dropRateMult: 2.4 }),
        z('zm_drop_double_dur', 'Extended Power-Ups', 'zm_powerups', 'buff', '⏳', 'Insta-Kill and Double Points durations last 2x longer.', { powerupDurMult: 2.0 }),
        z('zm_insta_cleave', 'Reaper Cleave', 'zm_powerups', 'tactical', '⚔️', 'Melee kills chain 160 cleave damage to adjacent undead within 3.5m.', { meleeCleave: 160 }),
        z('zm_nuke_jackpot', 'Golden Nuke', 'zm_powerups', 'buff', '☢️', 'Kill streaks & explosions award +250 bonus salvage points every 15 kills.', { streakPtsEvery15: 250 }),
        z('zm_overfill_mags', 'Overstuffed Chambers', 'zm_powerups', 'buff', '🧨', 'Kills have a 12% chance to instantly refill +25% of current magazine.', { killMagRefillChance: 0.12 }),
        z('zm_supply_jackpot', 'High-Yield Supplies', 'zm_powerups', 'buff', '🪵', 'Fallen zombies drop 2.2x more Engineering Supplies.', { suppliesMult: 2.2 }),
        z('zm_blood_orbs', 'Crimson Siphon Orbs', 'zm_powerups', 'buff', '🩸', '20% of zombie kills heal +20 HP and +15 Armor directly.', { siphonChanceHp: 0.20 }),
        z('zm_cryo_nova_periodic', 'Sub-Zero Pulse', 'zm_powerups', 'tactical', '❄️', 'Every 35 seconds a frost ring freezes all zombies within 9m for 3s.', { cryoPulseInterval: 35 }),
        z('zm_tesla_overcharge', 'Arc-Coil Surge', 'zm_powerups', 'tactical', '🌩', 'Every 28 seconds an arc shock zaps the 3 closest undead for 180 dmg.', { arcPulseInterval: 28 }),
        z('zm_drought_drops', 'Scavenger Famine', 'zm_powerups', 'challenge', '🏜', 'Drop rates cut by 70%; every headshot restores 1 bullet to magazine.', { dropRateMult: 0.30, headshotRefund: 1 }),
        z('zm_frenzy_ult_orb', 'Aether Kill Batteries', 'zm_powerups', 'buff', '🔋', 'Every zombie kill boosts Ultimate charge +80% faster.', { ultKillMult: 1.8 }),
        z('zm_no_nukes_pure', 'No Mercy Cleanse', 'zm_powerups', 'challenge', '🔥', 'All damage increased +25%, while player natural health regen speed is halved.', { flatDmgMult: 1.25, regenMult: 0.5 }),

        // zm_rounds (13)
        z('zm_instant_rounds', 'Zero-Pause Rounds', 'zm_rounds', 'challenge', '⏩', 'Intermission between zombie rounds is nearly instant (1.5s break).', { quickRoundBreak: true }),
        z('zm_crawler_tide', 'Ankle-Biter Rush', 'zm_rounds', 'chaos', '🐕', '25% of spawned zombies scale to sprint speed as low aggressive rushers.', { rushConvertPct: 0.25 }),
        z('zm_sprint_rounds', 'Compact Swarm Rounds', 'zm_rounds', 'tactical', '⚡', 'Rounds contain 35% fewer zombies so rounds advance rapidly; zombies hit +20% harder.', { waveScale: 0.65, enemyDmgMult: 1.2 }),
        z('zm_swarm_overload', 'Horde Overload', 'zm_rounds', 'challenge', '🌊', 'Rounds spawn +50% more zombies with slightly faster cadence.', { waveScale: 1.50 }),
        z('zm_odd_even_shift', 'Lunar Polarity Rounds', 'zm_rounds', 'chaos', '🌓', 'Odd rounds grant you +50% dmg; even rounds grant undead +35% speed.', { lunarPolarity: true }),
        z('zm_early_exfil', 'Express Evacuation', 'zm_rounds', 'tactical', '🚁', 'Chopper Exfil unlocks earlier (Round 5+) for swift extraction runs.', { earlyExfil: 5 }),
        z('zm_no_boss_pure', 'Pure Undead Waves', 'zm_rounds', 'tactical', '🧟', 'Zone Boss HP reduced 40% while regular zombie wave density grows +25%.', { bossHpMult: 0.6, waveScale: 1.25 }),
        z('zm_boss_every_third', 'Boss Parade (Every 3 Rd)', 'zm_rounds', 'challenge', '👹', 'Zone Boss spawns are triggered far more frequently with double bounty rewards.', { bossFreqBoost: true, bossBounty: 1800 }),
        z('zm_escalation_cap', 'Steadied Outbreak', 'zm_rounds', 'buff', '📉', 'Zombie round-by-round health escalation slows by 35%.', { roundScaleSoften: 0.65 }),
        z('zm_escalation_hyper', 'Hyper Outbreak Scale', 'zm_rounds', 'challenge', '📈', 'Every new round adds an extra +18% HP and +4% speed on top of baseline.', { extraRoundHp: 0.18, extraRoundSpd: 0.04 }),
        z('zm_fast_spawners', 'Flooded Breach Spawners', 'zm_rounds', 'chaos', '🚪', 'Zombies burst out of spawns 2x faster.', { spawnDelayMult: 0.5 }),
        z('zm_start_round_boost', 'Tactical Headstart (+2,500)', 'zm_rounds', 'buff', '💰', 'Start the outbreak with +2,500 bonus points.', { bonusStartCurrency: 2500 }),
        z('zm_nightfall_pressure', 'Dusk Escalation', 'zm_rounds', 'challenge', '🌑', 'Headshot multiplier increases +35% while undead deal +35% melee damage.', { headshotBonus: 0.35, enemyDmgMult: 1.35 }),

        // zm_fortify (12)
        z('zm_fort_discount', 'Half-Cost Barricades', 'zm_fortify', 'buff', '🪵', 'Mini Barricades, Wide Barricades & Sniper Towers cost 60% less Supplies.', { fortPriceMult: 0.40 }),
        z('zm_titan_barricades', 'Titanium Fortifications', 'zm_fortify', 'buff', '🛡', 'Fortification HP is multiplied 2.8x across every barricade and tower.', { wallHpMult: 2.8 }),
        z('zm_barricade_thorns', 'Electrified Wire Forts', 'zm_fortify', 'tactical', '⚡', 'Barricades shock biting zombies for 50 damage/hit.', { wallThorns: 50 }),
        z('zm_tower_rapid_ai', 'Rapid Sniper Towers', 'zm_fortify', 'buff', '🗼', 'Mini Sniper Towers fire twice as fast with +40% bullet damage.', { towerFireRateMult: 2.0, towerDmgMult: 1.4 }),
        z('zm_fort_auto_heal', 'Self-Mending Barriers', 'zm_fortify', 'buff', '🔧', 'Damaged fortifications regenerate 20 HP per second.', { wallRegen: 20 }),
        z('zm_teleporter_free', 'Zero-Cost Teleporters', 'zm_fortify', 'tactical', '🌀', 'Teleporters charge faster and weapon switch speed increases +40%.', { swapSpeedMult: 1.4 }),
        z('zm_supply_crate_start', 'Engineer Cache (+6,000)', 'zm_fortify', 'buff', '🧰', 'Start the match with +6,000 Engineering Supplies ready to fortify.', { startSupplies: 6000 }),
        z('zm_fort_kill_aura', 'Bunker Point Multiplier', 'zm_fortify', 'buff', '🪙', 'All hits deal +25% bonus points income when your armor is intact.', { armoredGoldBonus: 0.25 }),
        z('zm_sticky_barriers', 'Tarred Perimeter', 'zm_fortify', 'tactical', '🕳', 'Zombies moving near the player within 3.5m are passively slowed 18%.', { playerSlowAura: 0.18 }),
        z('zm_fragile_barriers', 'Crumbly Defenses', 'zm_fortify', 'challenge', '🪨', 'Barricades have half HP; kills grant double Engineering Supplies.', { wallHpMult: 0.5, suppliesMult: 2.0 }),
        z('zm_exploding_forts', 'Rigged Barricades', 'zm_fortify', 'chaos', '💣', 'Every 20th kill triggers a concussive blast blasting nearby undead away.', { everyNthKillExplode: 20 }),
        z('zm_fort_overwatch', 'High-Ground Advantage', 'zm_fortify', 'tactical', '⛰️', 'Being elevated >1.8m off ground adds +35% weapon damage.', { highGroundDmg: 0.35 }),

        // zm_mutations (13)
        z('zm_cryo_walkers', 'Frostbite Undead', 'zm_mutations', 'challenge', '❄️', 'Zombie melee strikes chill & slow your movement 25% for 1.5s.', { hitSlowsPlayer: 0.25 }),
        z('zm_arc_head_burst', 'Static Cranium Pop', 'zm_mutations', 'chaos', '⚡', 'Headshot kills release an arc flash staggering zombies within 4m.', { hsShockRadius: 4 }),
        z('zm_shadow_rushers', 'Adrenal Sprint Swarm', 'zm_mutations', 'challenge', '👻', 'All spawned zombies gain +22% base movement velocity.', { enemySpeedMult: 1.22 }),
        z('zm_iron_helmets', 'Armored Skulls', 'zm_mutations', 'challenge', '🪖', 'Zombie headshots deal 35% less damage; body shots deal +25% more.', { headshotMult: 0.65, bodyDmgBonus: 0.25 }),
        z('zm_cluster_frenzy', 'Pack Mentality', 'zm_mutations', 'challenge', '🐺', 'Whenever more than 12 zombies are alive, zombies deal +30% melee damage.', { swarmEnrageDmg: 0.30 }),
        z('zm_soft_sprinters', 'Glass Sprinters', 'zm_mutations', 'chaos', '💨', 'Undead move 1.45x faster with 40% lower HP.', { enemySpeedMult: 1.45, enemyHpMult: 0.60 }),
        z('zm_caustic_blood', 'Corrosive Splash', 'zm_mutations', 'challenge', '☣️', 'Kills at close range (<2.2m) splash 6 caustic damage back onto you.', { closeAcidBacklash: 6 }),
        z('zm_necrotic_aura', 'Wither Curse', 'zm_mutations', 'challenge', '💀', 'Player maximum Armor is capped 35% lower; kill heals +10 HP.', { maxArmorMult: 0.65, killHeal: 10 }),
        z('zm_no_splits_clean', 'Containment Seal', 'zm_mutations', 'buff', '🧬', 'Splitter mutants lose their ability to split upon death.', { disableSplitters: true }),
        z('zm_colossal_horde', 'Goliath Genetics', 'zm_mutations', 'challenge', '🗿', 'Undead spawn 25% larger with +60% HP and +40% point yield.', { enemySizeMult: 1.25, enemyHpMult: 1.6, currencyMult: 1.4 }),
        z('zm_mini_gnomes', 'Micro-Ankle Horde', 'zm_mutations', 'chaos', '🐁', 'Undead shrink 35% smaller and leap forward twice as often.', { enemySizeMult: 0.65, jumpChanceBonus: 0.5 }),
        z('zm_burning_zombies', 'Cinder-Veined Horde', 'zm_mutations', 'chaos', '🔥', 'All zombies deal ignite burn bonus damage while weak to Cold/Explosives.', { explosiveWeakness: 1.6, enemyDmgMult: 1.2 }),
        z('zm_boogie_curse', 'Rhythm Necrosis', 'zm_mutations', 'chaos', '🕺', 'Every 15th kill briefly forces nearby undead to freeze-dance for 1.5s.', { every15Dance: true }),

        // zm_arsenal (13)
        z('zm_dragons_breath', 'Dragons Breath Pellets', 'zm_arsenal', 'buff', '🔥', 'Shotguns ignite hit undead for 40% extra burn damage.', { shotgunBurn: 0.40 }),
        z('zm_cryo_smg', 'Liquid-Nitrogen Bore', 'zm_arsenal', 'tactical', '❄️', 'SMGs & LMGs freeze/chill undead 35% on hit for 2 seconds.', { autoChill: true }),
        z('zm_tesla_sidearms', 'Voltaic Pistols', 'zm_arsenal', 'buff', '⚡', 'Pistols deal +50% damage and chain 45% shock dmg to a nearby zombie.', { pistolChainShock: 0.45, pistolMult: 1.5 }),
        z('zm_ap_sabot_rifles', 'Tungsten Sabot Rifles', 'zm_arsenal', 'buff', '🔩', 'Assault Rifles & Snipers bypass zombie armor & gain +25% punch.', { rifleArmorPierce: true, rifleMult: 1.25 }),
        z('zm_lucky_seventh', 'Lucky 7th Chamber', 'zm_arsenal', 'chaos', '7️⃣', 'Every 7th shot fired deals 350% critical damage!', { everyNthShot: 7, nthMult: 3.5 }),
        z('zm_tactical_mag_swap', 'Auto-Feeder Belt', 'zm_arsenal', 'buff', '🔄', 'Kills automatically transfer +2 rounds directly into your active mag.', { killDirectChamber: 2 }),
        z('zm_last_round_nova', 'Last-Round Overload', 'zm_arsenal', 'tactical', '💥', 'Firing the final bullet of your magazine deals 2.5x damage + blast.', { lastBulletMult: 2.5, lastBulletBlast: 90 }),
        z('zm_executioner_blade', 'Butcher Execution', 'zm_arsenal', 'buff', '🔪', 'Melee hits execute non-boss zombies below 35% HP & restore +15 HP.', { meleeExecutePct: 0.35, meleeHeal: 15 }),
        z('zm_zero_recoil_zen', 'Gyro-Stabilized Bore', 'zm_arsenal', 'buff', '🎯', 'Weapon recoil & hipfire bloom are reduced by 70%.', { recoilMult: 0.30, spreadMult: 0.30 }),
        z('zm_heavy_caliber_slow', 'Heavy Magnums (-RoF / +DMG)', 'zm_arsenal', 'tactical', '🏋️', 'Firearms fire 20% slower but hit 55% harder per round.', { fireRateMult: 0.80, flatDmgMult: 1.55 }),
        z('zm_bullet_hose', 'Overpressured Cyclic', 'zm_arsenal', 'chaos', '🌪', 'All firearms shoot 35% faster with +35% recoil kick.', { fireRateMult: 1.35, recoilMult: 1.35 }),
        z('zm_ads_deadeye_z', 'Focus Sight Multiplier', 'zm_arsenal', 'tactical', '🔭', 'Shots fired while Aiming Down Sights deal +45% damage.', { adsDmgMult: 1.45 }),
        z('zm_hipfire_cowboy', 'Hipfire Outlaw', 'zm_arsenal', 'tactical', '🤠', 'Hipfire hits deal +45% damage while ADS slows walk speed extra.', { hipDmgMult: 1.45 }),

        // zm_rituals (13)
        z('zm_blood_pact_dmg', 'Crimson Blood Pact', 'zm_rituals', 'chaos', '🩸', 'Deal 2.2x damage at all times, but every shot costs 1 HP down to 20 HP.', { flatDmgMult: 2.2, shotHpCost: 1 }),
        z('zm_greed_toll', 'Avarice Ledger', 'zm_rituals', 'chaos', '🪙', 'Gain +140% extra points on all hits/kills, but taking a hit deducts 150 points.', { currencyMult: 2.4, damagePointLoss: 150 }),
        z('zm_phoenix_revives', 'Threefold Phoenix', 'zm_rituals', 'buff', '🔥', 'Begin match with 3 Self-Revives and revive in half time.', { bonusSelfRevives: 2 }),
        z('zm_sudden_death_z', 'Mortal Coil (0 Revives)', 'zm_rituals', 'challenge', '☠️', 'Zero Self-Revives allowed; +50% XP & double point gains!', { zeroSelfRevives: true, currencyMult: 2.0 }),
        z('zm_sacred_aura_burn', 'Sunfire Halo', 'zm_rituals', 'buff', '☀️', 'Zombies standing within 4m of you burn for 18 dmg per second.', { sunfireAura: 18 }),
        z('zm_desperation_rage', 'Last-Breath Berserk', 'zm_rituals', 'tactical', '💢', 'While below 45% HP, deal +85% weapon damage and run 25% faster.', { lowHpDmgMult: 1.85, lowHpSpeedMult: 1.25 }),
        z('zm_overheal_plates', 'Vitality Plating', 'zm_rituals', 'buff', '🛡', 'Every kill restores +4 Armor directly to your vest.', { killArmorRestore: 4 }),
        z('zm_gunslinger_vow', 'Pure Trigger Oath', 'zm_rituals', 'tactical', '🚫', 'Lethal & tactical explosives disabled; gain +35% firearm & melee dmg.', { disableThrowables: true, flatDmgMult: 1.35 }),
        z('zm_grenadier_ritual', 'Pyromaniac Belt', 'zm_rituals', 'chaos', '💣', 'Gain +1 Frag every 10s & explosions deal +90% wider damage.', { grenadeInterval: 10, explosionMult: 1.9 }),
        z('zm_boss_mirror_pact', 'Titan Duel Pact', 'zm_rituals', 'challenge', '⚖️', 'Both your weapons AND Zone Bosses deal 2.5x lethal damage.', { vsBossDmgMult: 2.5, bossAttackMult: 2.5 }),
        z('zm_turret_stance_z', 'Anchored Sentinel', 'zm_rituals', 'tactical', '⚓', 'Standing still builds up to +80% bonus damage over 3 seconds.', { stationaryDmgRamp: 0.80 }),
        z('zm_kinetic_runner_z', 'Kinetic Momentum', 'zm_rituals', 'tactical', '🏃', 'Sprinting/moving builds +40% damage and +20% damage mitigation.', { movingDmgMult: 1.40, movingResist: 0.20 }),
        z('zm_full_hp_ambush', 'Pristine Precision', 'zm_rituals', 'tactical', '💎', 'While at 95%+ HP, your first hits deal +50% bonus damage.', { fullHpDmgMult: 1.50 }),

        // =========================================================================
        // 100 UNIQUE MULTIPLAYER MODIFIERS (mp_*)
        // =========================================================================
        // mp_streaks (12)
        m('mp_perm_uav', 'Always-On Orbital UAV', 'mp_streaks', 'buff', '🛰', 'Orbital enemy sweep keeps bot contacts surfaced continuously.', { permUav: true }),
        m('mp_streak_discount', 'Hardline Protocol', 'mp_streaks', 'buff', '🎖', 'Kills count toward streaks 35% faster (bonus streak charge/kill).', { streakChargeMult: 1.35 }),
        m('mp_streak_overdrive', 'Overcharged Streaks', 'mp_streaks', 'buff', '⚡', 'Killstreak strikes, sentries & UAV pulses deal +45% impact.', { streakPowerMult: 1.45 }),
        m('mp_barebones_streaks', 'Barebones Gunplay', 'mp_streaks', 'tactical', '🚫', 'Disables scorestreaks & ultimates for pure weapon dueling.', { disableStreaks: true }),
        m('mp_ult_spawn_ready', 'Hot-Drop Ultimates', 'mp_streaks', 'buff', '🔥', 'Every respawn/match start begins with 100% Ultimate charge ready.', { startFullUlt: true }),
        m('mp_ult_hypercharge', 'Hyper Ultimate Loop', 'mp_streaks', 'chaos', '⚡', 'Ultimates charge 2.5x faster from eliminations and time.', { ultKillMult: 2.5, ultPassive: 1.0 }),
        m('mp_streak_armor_boost', 'Tactical Vest Streak', 'mp_streaks', 'buff', '🦺', 'Every 3-kill streak refills your active Armor to 100%.', { armorEvery3Kills: true }),
        m('mp_airstrike_wide', 'Carpet Bomb Ordinance', 'mp_streaks', 'chaos', '🚀', 'Explosives and airstrike blasts gain +55% radius and dmg.', { explosionMult: 1.55 }),
        m('mp_ult_heal_burst', 'Valkyrie Strike Boost', 'mp_streaks', 'buff', '✚', 'Triggering an Ultimate or Streak immediately heals you to 100% HP.', { streakHealsFull: true }),
        m('mp_emp_disrupt_kill', 'Kill-Streak EMP Scramble', 'mp_streaks', 'tactical', '📡', 'Scoring a double kill briefly scrambles enemy bot reaction time.', { multiKillEmp: true }),
        m('mp_persistent_score', 'Match Bonus Surge', 'mp_streaks', 'buff', '📈', 'All player kill & objective score yields +50% XP progress.', { xpMult: 1.50 }),
        m('mp_juggernaut_armor_ult', 'Titan Suit Ready', 'mp_streaks', 'chaos', '🛡', 'Spawn with +50 extra bonus Max Armor Capacity for heavy pushes.', { bonusMaxArmor: 50 }),

        // mp_movement (13)
        m('mp_exo_double_jump', 'Exo Double-Jump Boosters', 'mp_movement', 'buff', '🦘', 'Mid-air jump thrusters grant a crisp second jump!', { allowDoubleJump: true }),
        m('mp_jet_slide_reload', 'Jet-Slide Loader', 'mp_movement', 'tactical', '💨', 'Sliding surges faster and reloads 50% of your active magazine.', { slideSpeedMult: 1.4, slideReloadPct: 0.5 }),
        m('mp_moon_physics_mp', 'Lunar Arena Gravity', 'mp_movement', 'chaos', '🌕', 'Reduces arena gravity by 50% for soaring vertical gunfights.', { gravityMult: 0.50 }),
        m('mp_heavy_arena_grav', 'Crushing Gravity (1.7x)', 'mp_movement', 'challenge', '🪨', 'Higher gravity snaps jumps down fast; recoil drops 35%.', { gravityMult: 1.70, recoilMult: 0.65 }),
        m('mp_stalker_ads', 'Stalker Pro Strafe', 'mp_movement', 'buff', '🎯', 'Move at +35% faster speed while Aiming Down Sights.', { adsSpeedBonus: 0.35 }),
        m('mp_feather_sprint', 'Lightweight Marathon', 'mp_movement', 'buff', '🏃', 'Sprint speed boosted +25% and zero fall impact stun.', { speedMult: 1.25 }),
        m('mp_air_assassin', 'Aerial Precision (+45%)', 'mp_movement', 'tactical', '🦅', 'Shots landed while airborne deal +45% extra damage.', { airborneDmgMult: 1.45 }),
        m('mp_slide_shot_bonus', 'Power-Slide Hitbonus', 'mp_movement', 'tactical', '⚡', 'Shots fired during a slide deal +40% bonus damage.', { slideDmgMult: 1.40 }),
        m('mp_crouch_ambush', 'Shadow Crouch', 'mp_movement', 'tactical', '🥷', 'Crouching boosts accuracy 50% and cuts bot detection range.', { crouchStealth: true, crouchSpreadMult: 0.5 }),
        m('mp_kill_rush_speed', 'Momentum Rush', 'mp_movement', 'buff', '⚡', 'Each elimination grants +35% sprint velocity for 4 seconds.', { killSpeedBurst: 1.35 }),
        m('mp_juggernaut_gait', 'Armored Juggernaut Walk', 'mp_movement', 'tactical', '🛡️', 'Move 22% slower while gaining +80 Max HP.', { speedMult: 0.78, bonusMaxHp: 80 }),
        m('mp_grounded_discipline', 'Grounded Discipline', 'mp_movement', 'challenge', '👢', 'Jump height halved; standing stability removes 60% recoil.', { jumpMult: 0.5, recoilMult: 0.4 }),
        m('mp_nomad_regen_mp', 'Kinetic Flow Regen', 'mp_movement', 'tactical', '🌊', 'Continuously moving heals +6 HP/sec passively.', { movingRegenPerSec: 6 }),

        // mp_gunplay (13)
        m('mp_hardcore_arena', 'Hardcore Lethality', 'mp_gunplay', 'chaos', '💀', 'All weapons hit 2.2x harder while health regeneration delays.', { flatDmgMult: 2.2, regenMult: 0.4 }),
        m('mp_swat_precision', 'SWAT Headshot Duel', 'mp_gunplay', 'challenge', '🎯', 'Headshots deal 3.2x lethal damage; body shots deal 50%.', { headshotMult: 3.2, bodyDmgMult: 0.5 }),
        m('mp_zero_spread_mp', 'Tight-Bore Barrels', 'mp_gunplay', 'buff', '🔭', 'Reduces hipfire & movement spread by 65%.', { spreadMult: 0.35 }),
        m('mp_laser_recoil_mp', 'Compensated Precision', 'mp_gunplay', 'buff', '📏', 'Cuts vertical & horizontal weapon recoil by 75%.', { recoilMult: 0.25 }),
        m('mp_kill_mag_top', 'Blood-Fed Magazines', 'mp_gunplay', 'buff', '🔄', 'Every elimination instantly refills your active weapon magazine.', { killFullReload: true }),
        m('mp_he_sniper_rounds', 'Explosive .50 Cal', 'mp_gunplay', 'chaos', '💥', 'Sniper & Marksman hits detonate a 3m high-explosive pulse!', { sniperExplode: 95 }),
        m('mp_sleight_quick_swap', 'Dexterity Pro Swap', 'mp_gunplay', 'buff', '✋', 'Reloading and weapon swapping execute 2x faster.', { reloadMult: 0.50, swapSpeedMult: 2.0 }),
        m('mp_smg_pistol_frenzy', 'CQB Trigger Finger', 'mp_gunplay', 'tactical', '🔫', 'SMGs & Pistols shoot 25% faster and deal +30% up close.', { cqbRoFMult: 1.25, smgDmgMult: 1.3, pistolDmgMult: 1.3 }),
        m('mp_ar_dominance', 'Rifleman Arena', 'mp_gunplay', 'buff', '🪖', 'Assault Rifles gain +30% punch across medium-to-long range.', { rifleMult: 1.30 }),
        m('mp_shotgun_cannon', 'Breacher Force', 'mp_gunplay', 'tactical', '💥', 'Shotguns deal +45% damage inside 10m.', { shotgunMult: 1.45 }),
        m('mp_one_chamber_stakes', 'High-Stakes Chamber', 'mp_gunplay', 'challenge', '🥇', 'First shot of every magazine deals 3.5x damage; miss costs tempo.', { firstBulletMult: 3.5 }),
        m('mp_sustained_fire_mp', 'Hot-Barrel Ramp', 'mp_gunplay', 'chaos', '🔥', 'Each consecutive hit within 3s stacks +12% damage (up to +72%).', { comboRampDmg: 0.12 }),
        m('mp_slow_cannon_mp', 'Heavy Stops (-RoF / +DMG)', 'mp_gunplay', 'tactical', '🏋️', 'Fire 25% slower while dealing +65% impact per round.', { fireRateMult: 0.75, flatDmgMult: 1.65 }),

        // mp_objectives (12)
        m('mp_dom_cap_blitz', 'Hyper Capture Zones', 'mp_objectives', 'buff', '🏴', 'Domination & Hardpoint capture/tick progress runs 2.2x faster.', { objRateMult: 2.2 }),
        m('mp_instant_spawn_mp', 'Zero-Delay Respawns', 'mp_objectives', 'buff', '⚡', 'Respawn immediately upon elimination with zero downtime.', { respawnDelayMult: 0.1 }),
        m('mp_tactical_delay_mp', 'High-Value Lives', 'mp_objectives', 'challenge', '⏳', 'Respawn delay +1.8s longer; kills worth double objective score.', { respawnDelayAdd: 1.8, scoreMult: 2.0 }),
        m('mp_blitz_score_2x', 'Double Score Pace', 'mp_objectives', 'chaos', '⏩', 'Eliminations award +2 match score ticks toward faster victories.', { bonusMatchScore: 1 }),
        m('mp_headshot_score_2x', 'Headhunter Scoring', 'mp_objectives', 'tactical', '🎯', 'Headshot eliminations grant +2 extra match score & double XP.', { hsBonusScore: 1, hsXpMult: 2 }),
        m('mp_kc_auto_heal', 'Dogtag Field Heal', 'mp_objectives', 'buff', '🩹', 'Eliminating an enemy instantly restores +35 HP & +20 Armor.', { killHeal: 35, killArmorRestore: 20 }),
        m('mp_obj_bunker_shield', 'Zone Anchor Plating', 'mp_objectives', 'tactical', '🛡', 'Holding near center/objectives grants 30% damage resistance.', { centerResist: 0.30 }),
        m('mp_melee_gladiator_mp', 'Gladiator Knife Score', 'mp_objectives', 'chaos', '🔪', 'Melee eliminations score +2 extra match points & full armor.', { meleeBonusScore: 2 }),
        m('mp_skip_killcam_auto', 'Fast-Forward Cutscenes', 'mp_objectives', 'tactical', '⏭', 'Reduces end/killcam downtime for rapid firefights.', { fastKillcam: true }),
        m('mp_overtime_surge_mp', 'Clutch-Time Overdrive', 'mp_objectives', 'chaos', '🔥', 'Late match surges boost weapon dmg +35% for thrilling comebacks.', { lateMatchDmg: 1.35 }),
        m('mp_first_blood_boost', 'Hot-Start Opener', 'mp_objectives', 'buff', '⚡', 'First 30s of match grants +30% speed and +25% damage.', { openerBuff: true }),
        m('mp_assist_reward_xp', 'Combo Streak XP', 'mp_objectives', 'buff', '🏆', 'Every 5th kill grants a massive +400 Bonus XP surge.', { every5KillsXp: 400 }),

        // mp_bots (13)
        m('mp_bots_swarmer_hp', 'Target-Practice Wave', 'mp_bots', 'buff', '🎯', 'Enemy bots have 35% lower health for high killstreaks.', { botHpMult: 0.65 }),
        m('mp_bots_veteran_aim', 'Cyber-Ops Bot Aim', 'mp_bots', 'challenge', '👁️', 'Enemy bots acquire targets 45% faster with deadlier burst fire.', { botReactionMult: 0.55, botAccBonus: 0.25 }),
        m('mp_bots_armored_heavy', 'Heavy Bot Battalion', 'mp_bots', 'challenge', '🦺', 'Enemy bots spawn with +75% Max HP and full armor plates.', { botHpMult: 1.75 }),
        m('mp_bots_rusher_ai', 'Aggro Rush Squadron', 'mp_bots', 'chaos', '🏃', 'Bots sprint relentlessly toward engagements +30% faster.', { botSpeedMult: 1.30 }),
        m('mp_bots_turtle_slow', 'Heavy Garrison Bots', 'mp_bots', 'tactical', '🐢', 'Bots move 30% slower but hit 35% harder.', { botSpeedMult: 0.70, botDmgMult: 1.35 }),
        m('mp_bots_cloak_ghosts', 'Ghost-Ops Bots', 'mp_bots', 'challenge', '👻', 'Enemy bots gain translucent stealth shimmer until they fire.', { botCloak: true }),
        m('mp_bots_nades_more', 'Grenadier Bots', 'mp_bots', 'chaos', '💣', 'Enemy bots throw frag grenades twice as frequently.', { botNadeFreq: 2.0 }),
        m('mp_bots_clean_no_nades', 'Gunfight Honor Bots', 'mp_bots', 'tactical', '🚫', 'Enemy bots cannot throw frags or flashbangs.', { botNoNades: true }),
        m('mp_bots_frenzy_hurt', 'Wounded Bot Fury', 'mp_bots', 'challenge', '💢', 'Damaged bots sprint +45% faster and shoot erratically.', { botHurtFrenzy: true }),
        m('mp_bots_martyrdom_drop', 'Bot Martyrdom Drops', 'mp_bots', 'chaos', '🧨', 'Eliminated bots drop a delayed explosive blast after 1.1s.', { botMartyrdom: true }),
        m('mp_bots_plus_4', 'Crowded Arena (+4 Bots)', 'mp_bots', 'chaos', '👥', 'Adds +4 additional combatants to intensify arena chaos.', { extraBots: 4 }),
        m('mp_bots_fewer_duel', 'Tactical 1v2 Skirmish', 'mp_bots', 'tactical', '🤝', 'Cuts arena bot count by 40% for methodical precision duels.', { botCountMult: 0.60 }),
        m('mp_bots_bighead_mp', 'Big-Head Arena Bots', 'mp_bots', 'chaos', '🎈', 'Bots sport 2.2x oversized heads for arcade headshots!', { botBigHead: 2.2 }),

        // mp_tactical (12)
        m('mp_fast_plates_inf', 'Bottomless Armor Plates', 'mp_tactical', 'buff', '🛡', 'Start with 8 plates & regain +1 plate per kill.', { startPlates: 8, killPlates: 1 }),
        m('mp_no_armor_duels', 'Zero-Armor Gunplay', 'mp_tactical', 'challenge', '💔', 'Armor completely disabled across player & bots—raw HP duels.', { disableArmor: true }),
        m('mp_frag_replenish_mp', 'Auto-Belt Grenades', 'mp_tactical', 'tactical', '💣', 'Gain +1 Lethal & +1 Tactical charge every 18 seconds.', { grenadeInterval: 18, tactInterval: 18 }),
        m('mp_c4_overpressure', 'C4 Shockwave Mastery', 'mp_tactical', 'chaos', '🧨', 'C4 and Grenades deal +75% blast damage and wider stun.', { explosionMult: 1.75 }),
        m('mp_tac_visor_mp', 'Polarized Flash Visor', 'mp_tactical', 'buff', '🕶', 'Complete immunity to flashbang blinding effects.', { flashImmune: true }),
        m('mp_endless_tac_sprint', 'Unlimited Tactical Sprint', 'mp_tactical', 'buff', '⚡', 'Tactical sprint stamina never runs out in combat.', { endlessStamina: true }),
        m('mp_quick_fix_mp', 'Combat Quick-Fix', 'mp_tactical', 'buff', '✚', 'Eliminations cut health regen wait delay down to zero.', { killInstantRegen: true }),
        m('mp_ninja_silenced', 'Subsonic Shadow Gear', 'mp_tactical', 'tactical', '🤫', 'Suppressed & close hits deal +35% silent ambush dmg.', { silentDmgBonus: 0.35 }),
        m('mp_weapon_xp_double', 'Arsenal Grind (+75% XP)', 'mp_tactical', 'buff', '⭐', 'Rank & Weapon XP gains in MP boosted +75% per kill.', { xpMult: 1.75 }),
        m('mp_no_nades_player', 'Rifles-Only Discipline', 'mp_tactical', 'challenge', '🚫', 'Player grenades disabled; all bullets deal +22% dmg.', { disableThrowables: true, flatDmgMult: 1.22 }),
        m('mp_extra_ammo_belt', 'Bandolier Resupply', 'mp_tactical', 'buff', '🎗', 'Start with 2x max reserve ammo and reload 25% faster.', { reserveMult: 2.0, reloadMult: 0.75 }),
        m('mp_medkit_shield_regen', 'Bio-Foam Regeneration', 'mp_tactical', 'buff', '🫧', 'Armor passively regenerates +3 pts/sec after 5s out of damage.', { armorRegenPerSec: 3 }),

        // mp_duels (13)
        m('mp_kill_cycle_gun', 'Kill-Swap Gun Roulette', 'mp_duels', 'chaos', '🎲', 'Every 2 kills morphs your active weapon to a random firearm!', { cycleGunEveryKills: 2 }),
        m('mp_knife_only_duel', 'Sticks & Blades Arena', 'mp_duels', 'chaos', '🗡', 'Only melee swings deal damage—3x melee speed & dmg!', { meleeOnly: true, meleeMult: 3.0 }),
        m('mp_high_noon_pistols', 'High Noon Sidearms', 'mp_duels', 'tactical', '🤠', 'Pistols deal 3x damage while primaries deal half.', { pistolDmgMult: 3.0, primaryDmgMult: 0.5 }),
        m('mp_one_shot_snipers', 'Snipers One-Shot Duel', 'mp_duels', 'chaos', '🔭', 'Sniper rifles deal 5x lethal damage anywhere on target.', { sniperMult: 5.0 }),
        m('mp_blood_arena_vamp', 'Siphon Gladiator', 'mp_duels', 'chaos', '🩸', 'Auto-regen disabled; every point of damage dealt heals 25% HP!', { disableRegen: true, lifesteal: 0.25 }),
        m('mp_cranked_speed_mp', 'Cranked Arena Tempo', 'mp_duels', 'chaos', '⚡', 'Kills unleash 5 seconds of +45% movement speed and 2x reload.', { killCranked: 5 }),
        m('mp_close_quarters_pistol', 'CQB Tunnel Rules (<10m)', 'mp_duels', 'tactical', '🏚', 'Hits under 10m deal +60% damage; hits >22m deal half.', { closeDmgMult: 1.6, farDmgMult: 0.5 }),
        m('mp_longshot_duel', 'Horizon Duelist (>18m)', 'mp_duels', 'tactical', '🏔', 'Longshot hits beyond 18m deal 2.2x critical damage.', { farDmgMult: 2.2 }),
        m('mp_instant_knife_back', 'Backstabber Instakill', 'mp_duels', 'tactical', '🔪', 'Striking bots or landing melee hits deals 400 burst damage.', { meleeFlat: 400 }),
        m('mp_glass_champion', 'Champ Glass Pact', 'mp_duels', 'challenge', '👑', 'Both you AND bots deal 1.8x damage across every duel.', { flatDmgMult: 1.8, incomingMult: 1.8 }),
        m('mp_burst_reload_mp', 'Rapid Tactical Dump', 'mp_duels', 'chaos', '🔥', 'Shots in the bottom 25% of a magazine deal +65% panic damage!', { lowMagDmgMult: 1.65 }),
        m('mp_full_hp_duelist', 'Opening Strike Duelist', 'mp_duels', 'tactical', '💎', 'While at 100% HP, your opening shot deals +75% damage.', { fullHpDmgMult: 1.75 }),
        m('mp_underdog_fury_mp', 'Comeback Fury', 'mp_duels', 'tactical', '💢', 'When below 35% HP, gain +70% damage & +25% fire rate.', { lowHpDmgMult: 1.70 }),

        // mp_arena (12)
        m('mp_night_ops_mp', 'Blackout Night Ops', 'mp_arena', 'chaos', '🌑', 'Dark midnight arena lighting with intense muzzle flash duels.', { nightAtmosphere: true }),
        m('mp_lightning_arena_mp', 'Ion Storm Arena', 'mp_arena', 'chaos', '🌩', 'Periodic lightning strikes stun & damage random bots every 16s.', { lightningStrikeInterval: 16 }),
        m('mp_ice_rink_mp', 'Glacial Footing', 'mp_arena', 'tactical', '❄️', 'Sprint speed boosted +20% while bots move 15% slower in frost.', { speedMult: 1.20, botSpeedMult: 0.85 }),
        m('mp_headshot_fireworks', 'Sparkburst Crits', 'mp_arena', 'buff', '🎆', 'Headshot kills trigger bright shock sparks hitting bots within 4m.', { hsExplosionDmg: 85 }),
        m('mp_mid_king_zone', 'Center King Healing', 'mp_arena', 'tactical', '🏛', 'Standing near map center (r<11m) restores +10 HP/sec.', { centerHeal: 10 }),
        m('mp_mid_ammo_well', 'Center Supply Oasis', 'mp_arena', 'tactical', '🔋', 'Standing near map center passively tops up reserve ammo.', { centerAmmo: true }),
        m('mp_corner_hazard', 'Push-Mid Perimeter', 'mp_arena', 'challenge', '☢️', 'Camping far map edges (>36m out) slowly ticks HP—push center!', { edgeDangerDist: 36 }),
        m('mp_knockback_arena', 'Repulsor Impacts', 'mp_arena', 'chaos', '💨', 'Heavy gunfire & explosives push bots violently backward.', { forceKnockback: 8 }),
        m('mp_turbo_arena_mp', 'Hyper-Tempo Arena', 'mp_arena', 'chaos', '⚡', 'Speed, reload, fire rate & bot pace all bumped +18%!', { speedMult: 1.18, fireRateMult: 1.18, reloadMult: 0.82 }),
        m('mp_quiet_sanctum', 'Suppressed Warfare', 'mp_arena', 'tactical', '🔇', 'Silent/ADS shots deal +35% damage across darkened lanes.', { adsDmgMult: 1.35 }),
        m('mp_gladiator_bounty', 'Bounty Streak Bonus', 'mp_arena', 'buff', '🏅', 'Each bot kill restores +15% Ultimate charge directly.', { ultBonusPerKill: 15 }),
        m('mp_toxic_rain_mp', 'Acid Drizzle', 'mp_arena', 'challenge', '🌧', 'Maximum health capped 20% lower; kills restore full health.', { maxHpMult: 0.80, killFullHeal: true }),

        // =========================================================================
        // 100 UNIQUE TOWER DEFENSE MODIFIERS (td_*)
        // =========================================================================
        // td_fortress (12)
        t('td_wall_steel_core', 'Reinforced Masonry (2.5x)', 'td_fortress', 'buff', '🧱', 'All 3 castle defense wall layers start with 2.5x structural HP.', { wallHpMult: 2.5 }),
        t('td_heart_titan', 'Aegis Castle Heart (3x)', 'td_fortress', 'buff', '💎', 'The Castle Heart holds 3x HP and shrugs off 25% of siege strikes.', { heartHpMult: 3.0, heartResist: 0.25 }),
        t('td_living_walls', 'Living Castle Walls', 'td_fortress', 'buff', '🌿', 'Active castle defense walls regenerate 18 HP/sec throughout battle.', { wallRegen: 18 }),
        t('td_wall_thorns', 'Spiked Castle Ramparts', 'td_fortress', 'tactical', '🦔', 'Zombies striking castle walls take 65 reactive damage per swing.', { wallThorns: 65 }),
        t('td_inner_keep_stand', 'Alamo Inner Keep', 'td_fortress', 'challenge', '🏰', 'Outer walls weaken while Inner Keep & Heart hold 4x fortress HP!', { innerKeepBias: true }),
        t('td_cheap_wall_repair', 'Guild Masons (60% Off)', 'td_fortress', 'buff', '🛠', 'Repairing castle barriers in the Shop costs 60% less Gold.', { tdRepairMult: 0.40 }),
        t('td_breach_detonation', 'Bastion Self-Destruct', 'td_fortress', 'chaos', '💥', 'Whenever a wall layer is breached, a huge blast clears nearby attackers.', { wallBreakBlast: 500 }),
        t('td_wave_wall_rebuild', 'Intermission Masonry', 'td_fortress', 'buff', '🔨', 'Clearing each Siege wave automatically heals active walls +30% HP.', { waveClearWallHeal: 0.30 }),
        t('td_paper_walls_td', 'Fragile Ramparts', 'td_fortress', 'challenge', '📄', 'Walls start with half HP, but defenders & turrets deal +55% dmg!', { wallHpMult: 0.5, turretDmgMult: 1.55, flatDmgMult: 1.55 }),
        t('td_frost_brick_walls', 'Glacial Ramparts', 'td_fortress', 'tactical', '❄️', 'Zombies attacking a wall are chilled 45% for 3 seconds.', { wallFrostSlow: 0.45 }),
        t('td_heart_emergency_pulse', 'Heart Nova Guard', 'td_fortress', 'buff', '💫', 'Damaged Castle Heart emits periodic shock pulses pushing attackers back.', { heartShockPulse: true }),
        t('td_iron_gates_td', 'Fortified Gate Iron', 'td_fortress', 'buff', '🛡', 'All incoming damage to Castle defense layers is reduced by 25%.', { wallIncomingMult: 0.75 }),

        // td_turrets (13)
        t('td_turret_overclock', 'Overclocked Sentries', 'td_turrets', 'buff', '⚙️', 'Auto-Turrets & Heavy Sentries shoot 50% faster!', { turretFireRateMult: 1.50 }),
        t('td_turret_optics', 'Telescopic Turret Sights', 'td_turrets', 'buff', '🔭', 'Auto-Turrets gain +60% targeting range across outer courtyards.', { turretRangeMult: 1.60 }),
        t('td_turret_heavy_bore', 'Heavy-Caliber Sentries', 'td_turrets', 'buff', '💥', 'All placed Sentry Turrets inflict +65% damage per round.', { turretDmgMult: 1.65 }),
        t('td_turret_cryo', 'Cryo Turret Retrofit', 'td_turrets', 'tactical', '❄️', 'Turret rounds slow struck invaders by 35% for 2 seconds.', { turretCryoSlow: true }),
        t('td_turret_pyro', 'Incendiary Turret Core', 'td_turrets', 'buff', '🔥', 'Turret hits ignite zombies for bonus burning damage over 3s.', { turretBurnDmg: 25 }),
        t('td_turret_tesla', 'Tesla Chain Turrets', 'td_turrets', 'chaos', '⚡', 'Turret shots have a 25% chance to chain 90 shock dmg to a neighbor.', { turretChainDmg: 90 }),
        t('td_deploy_double_cap', 'Double Siege Engineers', 'td_turrets', 'buff', '🏗️', 'Doubles your deployable limit & halves Acid/Mine shop price!', { deployCostMult: 0.50 }),
        t('td_free_wave1_sentry', 'Starter Courtyard Turret', 'td_turrets', 'buff', '🔫', 'Begin Wave 1 with a complimentary Auto-Turret defending the Keep!', { freeStarterTurret: true }),
        t('td_acid_mines_x2', 'Corrosive Mine Mastery', 'td_turrets', 'tactical', '☣️', 'Proximity Landmines & Acid Sprayers inflict 2.2x damage.', { trapDmgMult: 2.2 }),
        t('td_aegis_turbo_td', 'Overcharged Aegis Emitter', 'td_turrets', 'buff', '🛡', 'Aegis Wall Regenerator emits 2.5x stronger repair pulses.', { aegisHealMult: 2.5 }),
        t('td_decoy_magnet_td', 'Holo-Decoy Singularity', 'td_turrets', 'tactical', '👤', 'Holographic Decoys pull zombies from 2x wider radius & take 60% less dmg.', { decoyBoost: true }),
        t('td_sentry_repair_wall', 'Nanite Sentry Kills', 'td_turrets', 'buff', '🔧', 'Kills by turrets or deployables heal damaged Castle Walls +20 HP!', { turretKillHealsWall: 20 }),
        t('td_no_turrets_hero_td', 'Solo Knight (No Turrets)', 'td_turrets', 'challenge', '⚔️', 'Deployables disabled in Shop; player deals 2.2x weapon damage!', { disableDeployables: true, flatDmgMult: 2.2 }),

        // td_economy (13)
        t('td_treasury_interest', 'Castle Bank Interest', 'td_economy', 'buff', '🏦', 'Earn +15% bonus Gold interest on your Gold pouch each wave clear.', { waveInterestPct: 0.15 }),
        t('td_half_deploy_shop', 'Half-Price Deployables', 'td_economy', 'buff', '💣', 'All Turrets, Med-Stations, Mines & Decoys cost 45% less Gold.', { deployCostMult: 0.55 }),
        t('td_merchant_guild', 'Merchants Guild Sale', 'td_economy', 'buff', '🛒', 'Every Shopkeeper weapon, perk & item costs 35% less Gold.', { tdShopMult: 0.65 }),
        t('td_free_magic_roll', 'Arcane Box Bargain', 'td_economy', 'buff', '📦', 'Castle Mystery Box spins cost 55% less Gold.', { boxPriceMult: 0.45 }),
        t('td_wave_jackpot_gold', 'Royal Bounty Payouts', 'td_economy', 'buff', '👑', 'Gold bonuses from surviving waves increase by +75%.', { waveGoldMult: 1.75 }),
        t('td_no_wave_stipend', 'Mercenary Economy', 'td_economy', 'challenge', '⚖️', 'Zero wave-clear stipends; every zombie kill grants +85% extra Gold!', { waveGoldMult: 0, currencyMult: 1.85 }),
        t('td_boss_gold_vault', 'Kingpin Gold Hoard', 'td_economy', 'buff', '🪙', 'Every Siege Boss defeated bursts +2,800 bonus Gold!', { bossBounty: 2800 }),
        t('td_gold_bullets_td', 'Midas Rounds', 'td_economy', 'tactical', '✨', 'Every 12th bullet hit steals +25 Gold straight into your treasury.', { hitGoldCadence: 12 }),
        t('td_bailout_grant_td', 'Emergency Crown Bailout', 'td_economy', 'buff', '📜', 'Once per match if Gold drops below 150 after Wave 2, gain +2,000 Gold.', { bailoutGold: 2000 }),
        t('td_wall_kill_payout', 'Last-Line Defense Bounty', 'td_economy', 'tactical', '🧱', 'Kills scored inside the inner Keep award +50% Gold.', { keepKillGoldBonus: 0.50 }),
        t('td_start_gold_chest', 'Royal Warchest (+4,000)', 'td_economy', 'buff', '💰', 'Start Wave 1 with +4,000 extra Gold to build immediately.', { bonusStartCurrency: 4000 }),
        t('td_inflation_siege', 'Wartime Inflation', 'td_economy', 'challenge', '💸', 'All Shopkeeper & Deployable items cost 1.6x Gold.', { tdShopMult: 1.60, deployCostMult: 1.60 }),
        t('td_no_pap_td', 'Ancient Steel Oath', 'td_economy', 'challenge', '⚒️', 'Pack-a-Punch disabled in Siege; weapons start +40% stronger.', { disablePap: true, flatDmgMult: 1.40 }),

        // td_towers (12)
        t('td_high_ground_king', 'Battlement Dominance (+55%)', 'td_towers', 'buff', '🗼', 'Standing elevated on Castle Towers increases weapon damage +55%.', { highGroundDmg: 0.55 }),
        t('td_tower_ammo_well', 'Parapet Munitions Hoist', 'td_towers', 'buff', '🔋', 'Standing in high elevation slowly replenishes active reserve ammo.', { highGroundAmmoRegen: true }),
        t('td_tower_wind_reload', 'Tower Breeze Loaders', 'td_towers', 'buff', '💨', 'Reload speed is 2x faster while defending from Castle Towers.', { highGroundReloadMult: 0.50 }),
        t('td_tower_shield_gen', 'Parapet Shield Conduit', 'td_towers', 'buff', '🛡', 'Armor recovers +4 pts/sec while stationed atop Castle Towers.', { highGroundArmorRegen: 4 }),
        t('td_overwatch_headshot', 'Hawk-Eye Sniper Nest', 'td_towers', 'tactical', '🔭', 'Headshots from elevation deal 2.4x devastating critical dmg.', { highGroundHsMult: 2.4 }),
        t('td_launch_pad_turbo', 'Sky-Pad Boosters', 'td_towers', 'chaos', '🚀', 'Tower pads launch higher & grant +35% speed burst for 4s!', { towerPadSpeed: 1.35 }),
        t('td_courtyard_gladiator', 'Courtyard Ground Fury', 'td_towers', 'tactical', '⚔️', 'Fighting on ground floor (<1m Y) grants +45% dmg & +25% move speed.', { groundFloorDmg: 1.45, groundFloorSpeed: 1.25 }),
        t('td_breach_killzone', 'Killzone Courtyard', 'td_towers', 'tactical', '🎯', 'Zombies inside 14m of the Castle Heart take +40% extra damage.', { closeHeartVulnerability: 0.40 }),
        t('td_spotter_mark_td', 'Tracer Target Painter', 'td_towers', 'tactical', '🔦', 'Damaging a zombie marks it to take +35% more turret & trap damage.', { markVulnTurret: 0.35 }),
        t('td_ground_siege_vow', 'Gatekeeper Ground Oath', 'td_towers', 'challenge', '🚧', 'High-ground bonus disabled; all melee & ground shotgun hits deal +65%.', { shotgunMult: 1.65, meleeMult: 1.65 }),
        t('td_parapet_cover', 'Tower Bastion Cover', 'td_towers', 'buff', '🪨', 'Incoming ranged zombie fire is reduced 60% while you are elevated.', { highGroundResist: 0.60 }),
        t('td_tower_bounty_bonus', 'Sniper Tower Bounty', 'td_towers', 'buff', '🪙', 'Kills scored from elevation pay +45% extra Gold.', { highGroundGoldMult: 1.45 }),

        // td_siege (13)
        t('td_mega_siege_waves', 'Armada Siege Waves', 'td_siege', 'challenge', '🌊', 'Waves unleash +50% more zombies with denser assault columns.', { waveScale: 1.50 }),
        t('td_blitz_intermission', '3-Second Intermission', 'td_siege', 'challenge', '⏩', 'Breathing room between Siege waves drops to 3 seconds.', { tdIntermissionSec: 3 }),
        t('td_architect_intermission', 'Architect Intermission (+25s)', 'td_siege', 'buff', '⏳', 'Grants +25 extra seconds between every wave to construct defenses.', { tdIntermissionAdd: 25 }),
        t('td_armed_zombies_x2', 'Armed Undead Infantry', 'td_siege', 'chaos', '🔫', 'Doubles the ratio of Siege zombies wielding rifles against your keep!', { gunZombiePctMult: 2.0 }),
        t('td_melee_ram_horde', 'Pure Battering Horde', 'td_siege', 'tactical', '🐏', 'Zero gun-wielding zombies; melee hordes hit walls +35% harder.', { gunZombiePctOverride: 0, wallDmgTakenMult: 1.35 }),
        t('td_boss_wave_every', 'Siege Titan Every Wave', 'td_siege', 'challenge', '👑', 'A massive Siege Boss spearheads every wave from Wave 2 onward!', { tdBossEveryWave: true }),
        t('td_sprinter_sappers', 'Sprint Sapper Tide', 'td_siege', 'challenge', '💨', 'Undead surge toward your keep +32% faster.', { enemySpeedMult: 1.32 }),
        t('td_swarmling_tide', 'Micro-Swarm Tide', 'td_siege', 'chaos', '🐜', 'Waves pack +80% zombies at 55% HP and smaller silhouettes.', { waveScale: 1.80, enemyHpMult: 0.55, enemySizeMult: 0.72 }),
        t('td_colossal_ram_horde', 'Siege Colossus Horde', 'td_siege', 'challenge', '🗿', 'Undead spawn 35% larger with +75% HP & +50% Gold value.', { enemySizeMult: 1.35, enemyHpMult: 1.75, currencyMult: 1.5 }),
        t('td_no_wall_dmg_wave10', 'Fortified Wave Opener', 'td_siege', 'buff', '🛡️', 'First 12 seconds of every wave protect Castle Walls from damage.', { waveWallGrace: 12 }),
        t('td_flank_lanes_wide', 'Wider Breacher Spawn', 'td_siege', 'tactical', '↔️', 'Zombies spread faster at spawn for wider turret coverage.', { spawnDelayMult: 0.65 }),
        t('td_sapper_focus_walls', 'Gate-Breaker Focus', 'td_siege', 'challenge', '🧨', 'Zombies deal +60% damage to Castle Walls, -30% damage to you.', { wallDmgTakenMult: 1.60, incomingMult: 0.70 }),
        t('td_wave1_builder_grace', 'Extended Wave 1 Setup', 'td_siege', 'buff', '📐', 'Start with +30s initial prep time & +1,200 Gold before Wave 1 hits!', { bonusStartCurrency: 1200, tdIntermissionAdd: 10 }),

        // td_magic (12)
        t('td_arcane_conduit', 'Arcane Wellspring', 'td_magic', 'buff', '🔮', 'Magic weapons deal +50% dmg & Med-Stations heal 2x faster.', { magicDmgMult: 1.50, medHealMult: 2.0 }),
        t('td_keep_lightning_rod', 'Keep Storm Spire', 'td_magic', 'chaos', '🌩', 'Every 12s, sky-lightning blasts the zombie closest to the Castle Heart.', { keepLightningSec: 12 }),
        t('td_frozen_courtyard', 'Permafrost Moat', 'td_magic', 'tactical', '❄️', 'Every zombie inside Siege passively moves 22% slower.', { enemySpeedMult: 0.78 }),
        t('td_meteor_barrage_td', 'Keep Meteor Bombard', 'td_magic', 'chaos', '☄️', 'Every 15th kill drops a fiery meteor blast on enemy clusters!', { everyNthKillExplode: 15 }),
        t('td_curse_weakness_td', 'Keep Ward of Weakness', 'td_magic', 'buff', '🕯', 'All undead suffer -30% attack power near castle defenders.', { enemyDmgMult: 0.70 }),
        t('td_med_damage_aura', 'Hallowed Med Aura', 'td_magic', 'buff', '✚', 'Combat Med-Stations also empower nearby gunfire +30%!', { medDmgBuff: 0.30 }),
        t('td_wonder_shop_td', 'Arcane Arsenal Stock', 'td_magic', 'buff', '🛸', 'Mystery Box spins pay +25% bonus Wonder chance & cheaper PaP.', { boxWonderCadence: 3, papPriceMult: 0.6 }),
        t('td_soul_nuke_every15', 'Gatekeeper Nova Burst', 'td_magic', 'chaos', '💥', 'Every 18 kills detonates a 5.5m shock nova around you!', { playerKillNova: 18 }),
        t('td_pyre_courtyard_td', 'Wall of Fire', 'td_magic', 'tactical', '🔥', 'Burning & explosive weapons deal +60% wider splash damage.', { explosionMult: 1.60 }),
        t('td_moon_keep_td', 'Low-Gravity Keep', 'td_magic', 'chaos', '🌕', 'Jump across battlements effortlessly with 50% lower gravity!', { gravityMult: 0.50 }),
        t('td_mirror_heart_td', 'Mirrored Heart Shield', 'td_magic', 'tactical', '🪞', 'Whenever the Castle Heart takes damage, nearby zombies take 180 dmg.', { heartThorns: 180 }),
        t('td_vampire_keep_td', 'Soul-Mending Castle', 'td_magic', 'buff', '🩸', 'Every kill restores +8 HP to damaged Castle Walls automatically.', { killHealsWall: 8 }),

        // td_arsenal (12)
        t('td_lmg_bunker_td', 'Bunker Machine Guns', 'td_arsenal', 'buff', '🔫', 'LMGs deal +55% damage and shoot 20% faster inside Siege.', { lmgMult: 1.55, lmgRoFMult: 1.20 }),
        t('td_ordnance_keep', 'Heavy Ordnance Keep', 'td_arsenal', 'chaos', '🚀', 'RPGs & launchers deal 2.2x damage with zero self-splash.', { launcherMult: 2.2, noSelfExplode: true }),
        t('td_shotgun_bouncer', 'Gatekeeper Scatter', 'td_arsenal', 'tactical', '💥', 'Shotguns deal +60% dmg and hurl zombies backward cleanly.', { shotgunMult: 1.60, forceKnockback: 6 }),
        t('td_sentinel_sniper_td', 'Castle Watchman Rifles', 'td_arsenal', 'buff', '🔭', 'Snipers deal 2.2x dmg and pierce armor cleanly.', { sniperMult: 2.2, rifleArmorPierce: true }),
        t('td_minigun_overload', 'Rotary Shredder (+45%)', 'td_arsenal', 'buff', '🌪', 'High-RoF SMGs & Miniguns deal +45% sustained damage.', { smgDmgMult: 1.45, minigunMult: 1.45 }),
        t('td_fast_keep_reload', 'Rampart Quick-Loaders', 'td_arsenal', 'buff', '🔄', 'Reload all Siege weapons twice as quickly!', { reloadMult: 0.50 }),
        t('td_crusader_crits', 'Crusader Criticals (25%)', 'td_arsenal', 'chaos', '⚡', '25% chance on every hit to land a 2.5x Paladin strike!', { critChancePct: 0.25, critMult: 2.5 }),
        t('td_endless_crates_td', 'Bottomless Keep Crates', 'td_arsenal', 'buff', '♾️', 'Reserve ammunition never decreases across waves.', { infiniteReserve: true }),
        t('td_paladin_blade_td', 'Paladin Broadsword', 'td_arsenal', 'tactical', '⚔️', 'Melee strikes inflict 4x damage & heal you 30 HP.', { meleeMult: 4.0, meleeHeal: 30 }),
        t('td_dual_sidearm_td', 'Twin Pistol Bastion', 'td_arsenal', 'tactical', '🤠', 'Pistols deal 2.5x lethal damage & fire 30% faster.', { pistolDmgMult: 2.5, pistolRoFMult: 1.3 }),
        t('td_armor_shred_td', 'Shatter-Point Bullets', 'td_arsenal', 'tactical', '🔩', 'Hits reduce zombie armor defense cleanly & hurt elites +40%.', { armorShred: true }),
        t('td_overdrive_rof_td', 'Full-Auto Turret Keep', 'td_arsenal', 'chaos', '🔥', 'Player fire rate +30% across all automatic firearms.', { fireRateMult: 1.30 }),

        // td_tactics (13)
        t('td_brave_skip_gold', 'Vanguard Wave Bonus', 'td_tactics', 'buff', '⏩', 'All wave clear Gold rewards boosted +40% & +20% fire rate.', { waveGoldMult: 1.4, fireRateMult: 1.2 }),
        t('td_commander_rally', 'War-Horn Synergy', 'td_tactics', 'buff', '📯', 'Player kills boost movement speed +25% & reload speed for 3s.', { killSpeedBurst: 1.25 }),
        t('td_knight_plate_td', 'Plate Knight Resilience', 'td_tactics', 'buff', '🛡', 'Begin Siege with +100 Max HP & +100 Max Armor.', { bonusMaxHp: 100, bonusMaxArmor: 100 }),
        t('td_combat_engineer', 'Fleet-Footed Engineer', 'td_tactics', 'buff', '💨', 'Sprint 35% faster across battlements and repair stations.', { speedMult: 1.35 }),
        t('td_supply_drops_x2', 'Sky-Drop Resupply (2x)', 'td_tactics', 'buff', '🪂', 'Mid-wave supply crates drop 2x more often with extra Gold.', { supplyIntervalMult: 0.5, supplyGoldMult: 1.8 }),
        t('td_no_repair_purist', 'Unrepaired Walls Vow', 'td_tactics', 'challenge', '🚫', 'Shop Repair item locked; earn +80% Gold from all sources!', { disableRepair: true, currencyMult: 1.8 }),
        t('td_blitz_victory_td', 'Blitz Siege (Faster Waves)', 'td_tactics', 'tactical', '⚡', 'Wave zombie counts drop 20% while Gold payouts remain full.', { waveScale: 0.80 }),
        t('td_half_price_perks_td', 'Tavern Discount (50%)', 'td_tactics', 'buff', '🍺', 'All 14 Perk Colas inside the Castle cost half Gold.', { perkPriceMult: 0.50 }),
        t('td_no_gun_shop_td', 'Mystery Box Knight Only', 'td_tactics', 'challenge', '📦', 'Shopkeeper direct guns locked; rely on Mystery Box & Drops (+60% dmg)!', { disableShopGuns: true, flatDmgMult: 1.60 }),
        t('td_wave_full_restore', 'Post-Wave Sanctuary', 'td_tactics', 'buff', '✚', 'Clearing each Siege wave refills HP, Armor & +1 Grenade.', { waveClearRestore: true }),
        t('td_glass_knight_td', 'Reckless Paladin', 'td_tactics', 'challenge', '💔', 'Deal 2.3x weapon damage at the cost of 50% lower Max HP.', { flatDmgMult: 2.3, maxHpMult: 0.50 }),
        t('td_stalwart_commander', 'Unshakeable Poise', 'td_tactics', 'buff', '🗿', 'Incoming zombie attacks reduced 40% & full flash immunity.', { incomingMult: 0.60, flashImmune: true }),
        t('td_final_stand_td', 'Last-Wall Desperation', 'td_tactics', 'chaos', '🔥', 'While Castle Heart HP < 60%, all your weapons deal +90% damage!', { heartLowDmgMult: 1.90 })
    ];

    const BUNDLES = {
        zombies: [
            { id: 'zm_arcade_god', name: 'Arcade Slayers', icon: '⚡', desc: 'Overpowered perks, cheaper Mystery Box, Quad-Round Echo & Golden Nukes.', keys: ['zm_perk_surge', 'zm_box_bargain', 'zm_double_tap_echo', 'zm_drop_frenzy', 'zm_wonder_recharge'] },
            { id: 'zm_alchemy_madness', name: 'Elemental Alchemy', icon: '🔥', desc: 'Prismatic PaP coils, Dragons Breath, Liquid-Nitrogen & Tesla Sidearms.', keys: ['zm_pap_elemental', 'zm_dragons_breath', 'zm_cryo_smg', 'zm_tesla_sidearms', 'zm_arc_head_burst'] },
            { id: 'zm_fortress_siege', name: 'Bunker Engineering', icon: '🛡', desc: 'Half-cost walls, Titanium forts, thorns wire & Rapid Sniper Towers.', keys: ['zm_fort_discount', 'zm_titan_barricades', 'zm_barricade_thorns', 'zm_tower_rapid_ai', 'zm_supply_crate_start'] },
            { id: 'zm_blood_chalice', name: 'Crimson Hardcore', icon: '🩸', desc: 'Zero-pause rounds, escalating outbreak, blood pact & boss parade.', keys: ['zm_instant_rounds', 'zm_escalation_hyper', 'zm_boss_every_third', 'zm_blood_pact_dmg'] }
        ],
        mp: [
            { id: 'mp_exo_movement', name: 'Jetpack Parkour', icon: '💨', desc: 'Exo double-jumps, jet-slide reload, lunar gravity & aerial accuracy.', keys: ['mp_exo_double_jump', 'mp_jet_slide_reload', 'mp_moon_physics_mp', 'mp_air_assassin', 'mp_endless_tac_sprint'] },
            { id: 'mp_swat_hardcore', name: 'SWAT Hardcore', icon: '🎯', desc: 'SWAT headshots, zero recoil, instant respawns & permanent UAV.', keys: ['mp_swat_precision', 'mp_laser_recoil_mp', 'mp_instant_spawn_mp', 'mp_perm_uav', 'mp_no_armor_duels'] },
            { id: 'mp_arena_chaos', name: 'Gladiator Chaos', icon: '🌩', desc: 'Gun roulette on kills, Cranked speed, Martyrdom bots & Ion storms.', keys: ['mp_kill_cycle_gun', 'mp_cranked_speed_mp', 'mp_bots_martyrdom_drop', 'mp_lightning_arena_mp', 'mp_bots_plus_4'] },
            { id: 'mp_specops_bots', name: 'Spec-Ops Challenge', icon: '🤖', desc: 'Veteran armored ghost bots with +4 extra enemies & double XP.', keys: ['mp_bots_veteran_aim', 'mp_bots_armored_heavy', 'mp_bots_cloak_ghosts', 'mp_bots_plus_4', 'mp_weapon_xp_double'] }
        ],
        td: [
            { id: 'td_aegis_engineer', name: 'Aegis Citadel', icon: '🏰', desc: 'Overclocked cryo/chain turrets, Living walls & Castle Bank Interest.', keys: ['td_wall_steel_core', 'td_living_walls', 'td_turret_overclock', 'td_turret_tesla', 'td_treasury_interest', 'td_free_wave1_sentry'] },
            { id: 'td_sniper_parapet', name: 'Tower Overwatch', icon: '🗼', desc: 'High-ground dominance, Tower ammo well, fast wind reloads & Sky-pads.', keys: ['td_high_ground_king', 'td_tower_ammo_well', 'td_tower_wind_reload', 'td_overwatch_headshot', 'td_launch_pad_turbo'] },
            { id: 'td_arcane_citadel', name: 'Arcane Keep', icon: '✨', desc: 'Permafrost moat, Keep storm spire, meteor strikes & soul-mending walls.', keys: ['td_arcane_conduit', 'td_keep_lightning_rod', 'td_frozen_courtyard', 'td_meteor_barrage_td', 'td_vampire_keep_td'] },
            { id: 'td_doomsday_siege', name: 'Alamo Doomsday', icon: '🔥', desc: 'Every-wave titans, 3s intermission, Armada waves & Armed undead.', keys: ['td_mega_siege_waves', 'td_blitz_intermission', 'td_boss_wave_every', 'td_armed_zombies_x2', 'td_inner_keep_stand'] }
        ]
    };

    BO.ModeModifiersCatalog = { CATEGORIES, DEFS, BUNDLES };
})(window);
