/* ============================================================================
   BLACKOUT OPS — 100 Exclusive Survival Mode Modifiers (sv_*)
   Zero pals/creatures. Organized across 8 Survival categories + bundles.
============================================================================ */
(function (BO) {
    'use strict';

    const CATEGORIES = [
        { id: 'world', name: 'World & Atmosphere', icon: '🌍', col: '#38bdf8' },
        { id: 'combat', name: 'Combat, Fists & Parry', icon: '🥊', col: '#f87171' },
        { id: 'grace', name: 'Shrines, Runes & Flasks', icon: '🕯', col: '#fde047' },
        { id: 'tech', name: 'Tech & Automation', icon: '⚙️', col: '#60a5fa' },
        { id: 'crafting', name: 'Mining & Infusions', icon: '⛏️', col: '#fb923c' },
        { id: 'vitals', name: 'Vitals & Tonics', icon: '❤️', col: '#4ade80' },
        { id: 'stealth', name: 'Stealth, Gear & Travel', icon: '🥷', col: '#a3e635' },
        { id: 'hardcore', name: 'Trials & Blood Moons', icon: '☠️', col: '#c084fc' }
    ];

    const sv = (group, name, tier, ico, description, fx = {}) => ({ name, group, tier, ico, exclusive: true, description, fx });

    const MODIFIERS = {
        // ---- world (13) ----
        sv_eternal_blizzard: sv('world', 'Eternal Deep Freeze', 'challenge', '❄️', 'Ambient temperature drops 10°C colder all day & night—carry broths and stay near hearths.', { tempOffset: -10 }),
        sv_ember_sky: sv('world', 'Scorched Solar Flare', 'chaos', '☀️', 'Daylight burns +9°C warmer (faster dehydration) and increases solar warmth regen.', { tempOffset: 9, hydDrainMult: 1.35 }),
        sv_toxic_rainstorms: sv('world', 'Irradiated Ash Rain', 'challenge', '☣️', 'Active weather storms double ambient Exclusion Zone radiation seepage.', { weatherRadMult: 2.0 }),
        sv_aurora_nights: sv('world', 'Aether Aurora Nights', 'buff', '🌌', 'Nightfall grants +45% stamina recovery and +25% Rune drops under clear skies.', { nightStaminaBonus: 0.45, nightRuneBonus: 0.25 }),
        sv_short_twilight: sv('world', 'Compressed Twilight', 'tactical', '🌓', 'Dawn and dusk transition smoothly with longer golden mid-days (+25% daylight clarity).', { brightDays: true }),
        sv_calm_skies: sv('world', 'Clear Zone Weather', 'buff', '🌤', 'Disables harsh blizzards and toxic fog storms across all six biomes.', { calmWeather: true }),
        sv_meteor_rain: sv('world', 'Frequent Aether Meteors', 'chaos', '☄️', 'Crimson Aether Meteor events strike twice as frequently after the safe period.', { meteorIntervalMult: 0.5 }),
        sv_airdrop_blitz: sv('world', 'Overflight Supply Drops', 'buff', '🎈', 'Weather Balloons and Crate Drops arrive twice as often across the valley.', { dropIntervalMult: 0.5 }),
        sv_dead_radio_zone: sv('world', 'Encrypted Comms Jamming', 'challenge', '📵', 'Disables automated area XP discovery chimes & demands sharp navigation.', { xpMult: 1.25 }),
        sv_flooded_high_tide: sv('world', 'Rising Spillway Tide', 'challenge', '🌊', 'Basin spillway hazards deepen while Shore Fishing bites 2x richer loot.', { fishBonus: 2 }),
        sv_wind_sprints: sv('world', 'Tailwind Expeditions', 'buff', '💨', 'Movement speed across open roads & valley trails boosted +14%.', { speedBonus: 0.14 }),
        sv_thick_ash_haze: sv('world', 'Obsidian Ash Haze', 'challenge', '🌫', 'Permanent dense Zone fog shrinks visibility while boosting stealth concealment +20%.', { fogStealthBonus: 0.20, extraFog: true }),
        sv_calm_waters: sv('world', 'Bountiful Basin Waters', 'buff', '🐟', 'Water pumps purify instantly and Shoreline casts finish 2x faster.', { pumpSpeedMult: 2.0, fishSpeedMult: 2.0 }),

        // ---- combat (13) ----
        sv_iron_knuckles: sv('combat', 'Titanium Bare Knuckles', 'buff', '🥊', 'Unarmed Jabs, Uppercuts & Haymakers deal +65% bonus damage & poise break!', { fistsDmgMult: 1.65 }),
        sv_parry_titan: sv('combat', 'Grandmaster Parry', 'buff', '🛡', 'Broadens Perfect Parry window by +0.16s and heals +18 HP + full Stamina on parry!', { parryWindowAdd: 0.16, parryHeal: 18 }),
        sv_dodge_phantom: sv('combat', 'Phantom Step Dodge', 'buff', '💨', 'Dodge Rolls grant +0.16s longer invulnerability and cost 40% less stamina.', { dodgeIframesAdd: 0.16, dodgeCostMult: 0.60 }),
        sv_glass_jaw_z: sv('combat', 'Fragile Crania (Survival)', 'tactical', '💀', 'Zombie & PMC headshots inflict +55% bonus lethal damage.', { headshotMult: 1.55 }),
        sv_one_inch_punch: sv('combat', 'Blazing Heavy Haymaker', 'chaos', '🔥', 'Charged bare-hands haymakers ignite targets and unleash shock knockback.', { heavyIgnites: true }),
        sv_recoil_zen_sv: sv('combat', 'Field Recoil Dampeners', 'buff', '🎯', 'Survival firearm recoil reduced by 45% for pinpoint range control.', { recoilMult: 0.55 }),
        sv_silent_muzzle_sv: sv('combat', 'Subsonic Field Barrels', 'tactical', '🔇', 'Gunshots create 65% less acoustic alert noise across surrounding sectors.', { noiseMult: 0.35 }),
        sv_pmc_elite_squads: sv('combat', 'Hardened PMC Commandos', 'challenge', '🪖', 'Hostile PMC patrols spawn with +45% HP and drop extra weapon parts.', { botHpMult: 1.45, botLootBonus: true }),
        sv_mimic_ambush_sv: sv('combat', 'Mimic Outbreak Bias', 'challenge', '👾', 'Doubles Mimic stalker ambushes after the safe minute ends (bonus crystal drops).', { mimicFreqMult: 2.0 }),
        sv_boss_enrage_early: sv('combat', 'Unbound Zone Bosses', 'challenge', '👹', 'Zone Bosses trigger Phase 2 Enrage earlier at 65% HP for extra Runes.', { bossPhase2Pct: 0.65, runeMult: 1.35 }),
        sv_barehand_siphon: sv('combat', 'Monk Fist Siphon', 'buff', '✚', 'Knockdowns with Bare Hands or Melee restore +14 HP immediately.', { meleeKillHeal: 14 }),
        sv_stagger_heavy: sv('combat', 'Crushing Poise Impact', 'tactical', '🔨', 'All bare-hands punches & melee hits deal 2x stagger duration against zombies.', { staggerBonus: 2.0 }),
        sv_ammo_scavenger_sv: sv('combat', 'Brass Recovery Doctrine', 'buff', '🔫', 'Firearm kills have a 30% chance to refund ammunition into current reserve.', { killAmmoChance: 0.30 }),

        // ---- grace (12) ----
        sv_flask_overflow: sv('grace', 'Sacred Flask Overflow', 'buff', '🧪', 'Start expedition with +2 bonus Aether Flask charges & +25 heal potency!', { bonusFlasks: 2, flaskHealAdd: 25 }),
        sv_talisman_four: sv('grace', 'Fourth Talisman Pouch', 'buff', '📿', 'Equip up to 4 active Collectible Talismans simultaneously instead of 3!', { maxTalismans: 4 }),
        sv_shrine_start_lit: sv('grace', 'Kindled Home Grace', 'buff', '🔥', 'Relay Sanctuary Grace begins pre-kindled with +1 starter Tech Point.', { startKindledRelay: true, bonusTechPts: 1 }),
        sv_rune_hoard: sv('grace', 'Abundant Aether Runes', 'buff', '✨', 'All enemies, quests & exploration yield +75% more Aether Runes.', { runeMult: 1.75 }),
        sv_cheap_attributes: sv('grace', 'Blessed Rune Leveling', 'buff', '📉', 'Attribute level-up Rune costs at Sites of Grace are reduced 35%.', { attrCostMult: 0.65 }),
        sv_purist_no_flask: sv('grace', 'Hollow Chalice Vow', 'challenge', '🚫', 'Aether Flask healing disabled; gain +80% Runes & faster natural regen.', { disableFlask: true, runeMult: 1.80, regenMult: 1.6 }),
        sv_rune_wealth_start: sv('grace', 'Tarnished Inheritance', 'buff', '🪙', 'Start with 1,200 Aether Runes to immediately level up at Relay Grace.', { startRunes: 1200 }),
        sv_grace_blessing_long: sv('grace', 'Enduring Grace Blessing', 'buff', '🕊', 'Resting at a Site of Grace grants a 2x longer Rested Comfort stamina buff.', { comfortDurMult: 2.0 }),
        sv_echo_safe_runes: sv('grace', 'Soul Anchored Echo', 'buff', '💠', 'Dying & respawning at Grace keeps 100% of carried Runes cleanly in your pouch.', { safeRunes: true }),
        sv_arcane_master_sv: sv('grace', 'Scholars of the Trench', 'tactical', '🔮', 'Begin with +2 bonus Arcane attribute levels automatically!', { startAttrArcane: 2 }),
        sv_talisman_starter: sv('grace', 'Scarab Heirloom Drop', 'buff', '🪲', 'Start expedition with the Golden Rune Scarab Talisman discovered & equipped!', { startScarab: true }),
        sv_beacon_discount_sv: sv('grace', 'Pocket Grace Beacons', 'tactical', '🕯', 'Building Homestead Grace Beacons costs 50% fewer Quartz & Iron.', { cheapBeacons: true }),

        // ---- tech (13) ----
        sv_turbo_smelter: sv('tech', 'Blast-Furnace Smelters', 'buff', '🏭', 'Auto-Smelters refine iron ore 2.5x faster & bonus ingots.', { smelterSpeedMult: 2.5 }),
        sv_hydro_overdrive: sv('tech', 'Industrial Hydro-Pump', 'buff', '💧', 'Hydro-Collectors condense fresh drinking water 2.2x faster!', { hydroSpeedMult: 2.2 }),
        sv_free_power_grid: sv('tech', 'Perpetual Grid Generators', 'buff', '🔋', 'Built Power Generators boost nearby turrets & smelters effortlessly.', { powerBoostMult: 1.5 }),
        sv_sentry_twin_coil: sv('tech', 'Overdriven Sentry Turrets', 'buff', '🔩', 'Placed Sentry Turrets deal +55% damage per burst & track wider.', { turretDmgMult: 1.55 }),
        sv_razor_barricades: sv('tech', 'Razor-Edge Traps', 'tactical', '🌵', 'Spike Barricades & Wire Snares shred attackers for +75% bleed damage.', { trapDmgMult: 1.75 }),
        sv_titanium_structures: sv('tech', 'Reinforced Bunkers (3x HP)', 'buff', '🧱', 'All built Chests, Doors, Walls, Platforms & Stations gain 3x HP.', { structureHpMult: 3.0 }),
        sv_prodigy_one_tp: sv('tech', 'Genius Engineer (1 TP Max)', 'buff', '🧠', 'Every Tech Tree node across all 4 tiers costs only 1 Tech Point!', { maxTechCostOne: true }),
        sv_starter_sentry_pack: sv('tech', 'Fortification Air-Crate', 'buff', '📦', 'Drop in with ready-to-build Timber, Scrap, Ingots & Wire!', { extraBuildKit: true }),
        sv_schematic_drop_x2: sv('tech', 'Blueprint Hunter (2x)', 'buff', '📜', 'Locked weapon schematics drop cleanly 2x more often from Patrols & Bosses.', { schematicLuckMult: 2.0 }),
        sv_bench_mk_discount: sv('tech', 'Master Gunsmith Bench', 'buff', '🔧', 'Weapon Mk II / Mk III Workbench upgrades cost 40% fewer Aether Shards.', { upgradeCostMult: 0.60 }),
        sv_manual_grit_sv: sv('tech', 'Off-Grid Pioneer', 'challenge', '🪚', 'Auto-Turrets & Auto-Smelters locked; combat XP & resource yields +50%!', { disableAutoTech: true, xpMult: 1.5, gatherMult: 1.5 }),
        sv_generator_heal_aura: sv('tech', 'Electro-Mending Field', 'tactical', '⚡', 'Nearby built Generators slowly restore +4 Armor/sec while defending home base.', { generatorArmorRegen: 4 }),
        sv_start_tech_unlock_t1: sv('tech', 'Pre-Breach Prep (Tier 1)', 'buff', '📋', 'Begin expedition with Tier 1 Perimeter Traps already researched!', { startT1Fort: true }),

        // ---- crafting (13) ----
        sv_triple_infusions: sv('crafting', 'Tri-Infusion Altar', 'buff', '✨', 'Stack up to 3 active Minecraft-style Aether Infusions at once instead of 2!', { maxInfusions: 3 }),
        sv_free_aether_altar: sv('crafting', 'Zero-Rune Infusion', 'buff', '💎', 'Aether Infusions require zero Runes—only Quartz & Shards.', { freeInfusionRunes: true }),
        sv_power_mining_swing: sv('crafting', 'Titanium Pickaxe Arc', 'buff', '⛏️', 'Mining rocks, chopping timber & salvage harvesting work 65% faster.', { gatherSpeedMult: 1.65 }),
        sv_gem_vein_luck: sv('crafting', 'Luminous Crystal Veins', 'buff', '💠', 'Every mined mineral node has high bonus chance for Luminous Quartz & Shards.', { gemDropChance: 0.45 }),
        sv_master_hearth_chef: sv('crafting', 'Master Campfire Chef', 'buff', '🍲', 'Cooked meals grant 2x longer stamina/reload buff duration.', { mealDurMult: 2.0 }),
        sv_perk_tonic_double: sv('crafting', 'Alchemist Perk Tonics', 'buff', '🧪', 'Brewed Zombie Perk Tonics last 2x longer once consumed.', { tonicDurMult: 2.0 }),
        sv_alloy_starter_tools: sv('crafting', 'Alloy Pioneer Kit', 'buff', '🪓', 'Begin expedition immediately equipped with higher durability & sharp tools!', { bonusToolLife: true }),
        sv_full_salvage_refund: sv('crafting', 'Zero-Waste Dismantle', 'buff', '♻️', 'Dismantling/repacking placed structures refunds 100% of resources.', { dismantleRefundPct: 1.0 }),
        sv_green_thumb_crops: sv('crafting', 'Miracle Soil Harvest', 'buff', '🌱', 'Harvesting planted Crop Beds yields double Herbs & Cloth Fibers!', { cropYieldMult: 2 }),
        sv_frame_brace_pack: sv('crafting', 'Exo-Frame Load Lifter', 'buff', '🎒', 'Adds +18 kg extra Carry Weight Capacity cleanly to any Backpack!', { bonusCarryKg: 18 }),
        sv_golden_reel_fish: sv('crafting', 'Master Angler Reel', 'buff', '🎣', 'Fishing hauls land double materials with extra Copper Wire / Coil odds.', { fishBonus: 2 }),
        sv_barren_world_ores: sv('crafting', 'Harsh Wasteland Nodes', 'challenge', '🪨', 'Natural gathering nodes yield 40% fewer raw drops—rely on raids & recycling.', { gatherYieldMult: 0.60 }),
        sv_start_infuse_fortune: sv('crafting', 'Blessed Fortune Pick', 'buff', '🍀', 'Start with Fortune III infusion already humming on your gear!', { startFortune: true }),

        // ---- vitals (12) ----
        sv_desert_camel_h2o: sv('vitals', 'Camel Hydration Retention', 'buff', '💧', 'Thirst / Hydration drains 60% slower during strenuous exploration.', { hydDrainMult: 0.40 }),
        sv_frostproof_coat: sv('vitals', 'Insulated Parka Weave', 'buff', '🧥', 'Immunity to freezing cold stamina drain across pine ridges & night.', { coldImmune: true }),
        sv_biotic_immunity: sv('vitals', 'Antibody Hyper-Defense', 'buff', '🧬', 'Bleeding and Bio-Infection buildup cut by 80% against toxic hits.', { statusResist: 0.80 }),
        sv_long_comfort_sv: sv('vitals', 'Sanctuary Inner Peace', 'buff', '🔥', 'Rested Comfort buffs last 2.5x longer with faster HP regeneration.', { comfortDurMult: 2.5, regenMult: 1.4 }),
        sv_thirst_siphon_kill: sv('vitals', 'Flesh & Oasis Siphon', 'tactical', '🩸', 'Melee & Bare-Hands kills restore +8 HP and +10% Hydration.', { meleeSiphonHyd: 10, meleeKillHeal: 8 }),
        sv_lead_lined_blood: sv('vitals', 'Lead-Filtered Marrow', 'buff', '☢️', 'Radiation accumulates 55% slower inside Trench & Spillway hotspots.', { radGainMult: 0.45 }),
        sv_marathon_lungs_sv: sv('vitals', 'Alpine Marathon Lungs', 'buff', '🫁', 'Base stamina regeneration runs 50% faster across all actions.', { staminaRegenMult: 1.50 }),
        sv_auto_bandage_regen: sv('vitals', 'Clotting Field Platelet', 'buff', '🩹', 'Minor bleeding clots away automatically 3x faster over time.', { bleedDecayMult: 3.0 }),
        sv_bleed_risk_double: sv('vitals', 'Arterial Fragility', 'challenge', '💔', 'Enemy slashes inflict twice as much Bleeding—pack dressings!', { bleedTakenMult: 2.0 }),
        sv_parched_wasteland: sv('vitals', 'Arid Scorched Wasteland', 'challenge', '🏜', 'Hydration & Food burn 65% faster under Zone stress.', { hydDrainMult: 1.65, hungerDrainMult: 1.65 }),
        sv_med_potion_power: sv('vitals', 'Concentrated Antibiotics', 'buff', '💊', 'Trauma Kits, Bandages & Tonics restore +45% extra Vitality.', { healItemMult: 1.45 }),
        sv_starvation_rage_sv: sv('vitals', 'Hollow Endurance', 'tactical', '⚡', 'Low Stamina or HP grants +25% bonus close-combat fury!', { lowStamFury: true }),

        // ---- stealth (12) ----
        sv_ghost_crouch_sv: sv('stealth', 'Ghillie Crouched Stalker', 'buff', '🌿', 'Crouching shrinks enemy detection distance down by an extra 45%!', { stealthFactorMult: 0.55 }),
        sv_reaper_backstab_sv: sv('stealth', 'Phantom Backstab (5x)', 'tactical', '🗡', 'Unalerted stealth/flank strikes inflict 5.0x execution damage!', { backstabMult: 5.0 }),
        sv_supercharged_engines: sv('stealth', 'Nitrous Rover & Train', 'buff', '🏍️', 'ATV, Utility Truck & Rail Locomotive drive 40% faster cleanly.', { vehicleSpeedMult: 1.40 }),
        sv_extra_fuel_pack: sv('stealth', 'Jerrycan Logistics (+4)', 'buff', '⛽', 'Drop in carrying +4 bonus Fuel canisters for long-range travel.', { startFuelBonus: 4 }),
        sv_cartographer_pins: sv('stealth', 'Cartographer Shrines Reveal', 'buff', '🗺', 'All 5 Sites of Grace appear pre-charted clearly on your Sector Map.', { revealAllGraces: true }),
        sv_whisper_treads_sv: sv('stealth', 'Quiet Rubber Soles', 'buff', '👟', 'Footsteps and sprinting generate 65% less acoustic alert noise.', { noiseMult: 0.35 }),
        sv_survey_double_xp: sv('stealth', 'Guild Cartographer Bonus', 'buff', '🧭', 'Area exploration & Survey beacons pay +80% Career XP!', { surveyXpMult: 1.80 }),
        sv_dispatch_bonus_sv: sv('stealth', 'Courier Guild Route (2x)', 'buff', '📬', 'Dispatch routes & Radio Repeater rewards pay double Tech/Scrap!', { dispatchMult: 2.0 }),
        sv_free_safe_travel: sv('stealth', 'Zero-Fuel Safe Travel', 'buff', '⚡', 'Fast traveling between cleared safe zones via Map costs 0 Fuel!', { freeTravel: true }),
        sv_binocular_crit_sv: sv('stealth', 'Sniper Overwatch Range', 'tactical', '🔭', 'Long-range Survival shots beyond 25m deal +40% bonus dmg.', { longRangeDmgMult: 1.40 }),
        sv_npc_discount_sv: sv('stealth', 'Allied Barter Favor', 'buff', '🤝', 'Friendly Trader NPCs grant +150 bonus Runes & cheaper barters.', { npcGiftRunes: 150 }),
        sv_scout_light_foot: sv('stealth', 'Light Scout Frame', 'tactical', '🏃', 'Trade -15 Max HP for +18% faster base travel & dodge speed.', { speedBonus: 0.18, maxHpDelta: -15 }),

        // ---- hardcore (12) ----
        sv_no_safe_period_warning: sv('hardcore', 'Aggressive First Surge', 'challenge', '⏰', 'Once the 60s safe minute ends, initial hostiles arrive +40% denser!', { postGraceSurge: 1.4 }),
        sv_no_map_gps: sv('hardcore', 'Compass Disabled Trial', 'challenge', '🧭', 'Rely on visual landmarks—bosses drop +100% bonus Aether Runes!', { hideMinimapHints: true, runeMult: 2.0 }),
        sv_one_life_titan: sv('hardcore', 'Titans of the Zone (1.8x)', 'challenge', '👹', 'Zone Bosses hold 1.8x HP & drop guaranteed bonus Aether Shards!', { bossHpMult: 1.8, bossExtraShard: 2 }),
        sv_crazed_sprinters_sv: sv('hardcore', 'Feral Night Sprinters', 'challenge', '🐺', 'Nighttime infected run +30% faster while dropping +60% more Runes.', { nightEnemySpdMult: 1.30, runeMult: 1.60 }),
        sv_permadeath_high_stakes: sv('hardcore', 'Ascetic Warrior Vow', 'challenge', '🥋', 'Start unarmed with 1 Flask, +100% Bare-Hands dmg & +100% Runes!', { fistsDmgMult: 2.0, runeMult: 2.0 }),
        sv_blood_moon_rewards_x2: sv('hardcore', 'Crimson Blood Spoils (2x)', 'chaos', '🌕', 'Blood Moon nights spawn heavier surges that reward double Tech Points!', { bloodMoonDoubleRewards: true }),
        sv_zero_armor_sv: sv('hardcore', 'Unarmored Expedition', 'challenge', '💔', 'Armor & Plates disabled across the run; weapon dmg boosted +35%.', { disableArmor: true, weaponDmgMult: 1.35 }),
        sv_cursed_heavy_pack: sv('hardcore', 'Oath of Minimal Gear', 'challenge', '🎒', 'Inventory slots trimmed -4; carried Runes empower +30% flat dmg!', { flatDmgMult: 1.30 }),
        sv_trench_horror_bias: sv('hardcore', 'Abyssal Mutant Incursion', 'challenge', '☣️', 'Spawns elite late-tier mutant variants earlier once hostiles unlock.', { eliteMutationBias: true }),
        sv_timed_evac_intense: sv('hardcore', 'Hot LZ Extraction', 'challenge', '🚁', 'Evac Ridge hold spawns constant waves & doubles victory XP payout!', { hotEvac: true }),
        sv_dual_boss_bounty: sv('hardcore', 'Twin Sovereign Bounty', 'chaos', '👑', 'Killing any Zone Boss immediately awards +500 Runes & +2 Tech Points!', { bossBonusTech: 2, bossBonusRunes: 500 }),
        sv_apocalypse_chaos_sv: sv('hardcore', 'Cataclysm Protocol', 'chaos', '🌋', 'All Survival weapons & all enemies deal +75% lethal damage!', { weaponDmgMult: 1.75, enemyDmgMult: 1.75 })
    };

    const BUNDLES = [
        { id: 'sv_monk_warrior', name: 'Fist & Parry Master', icon: '🥊', desc: 'Titanium knuckles, Grandmaster Parry, Phantom Dodge, & Monk Fist Siphon.', keys: ['fists', 'sv_iron_knuckles', 'sv_parry_titan', 'sv_dodge_phantom', 'sv_barehand_siphon'] },
        { id: 'sv_elden_tarnished', name: 'Elden Grace Walker', icon: '🕯', desc: '4 Talismans, Sacred Flask Overflow, 1,200 starter Runes, & Kindled Home Grace.', keys: ['soulsDrop', 'sv_talisman_four', 'sv_flask_overflow', 'sv_shrine_start_lit', 'sv_rune_wealth_start'] },
        { id: 'sv_forge_architect', name: 'Automated Fortress', icon: '⚙️', desc: '1-TP Tech Tree, Overdriven Turrets, Turbo Smelters, & Tri-Infusion Altar.', keys: ['abundantTech', 'turretMaster', 'sv_prodigy_one_tp', 'sv_sentry_twin_coil', 'sv_turbo_smelter', 'sv_triple_infusions'] },
        { id: 'sv_shadow_reaper', name: 'Night Stalker', icon: '🥷', desc: 'Phantom 5x Backstab, Ghillie Crouch, Whisper Treads, & Kindled Home Grace.', keys: ['sv_reaper_backstab_sv', 'sv_ghost_crouch_sv', 'sv_whisper_treads_sv', 'sv_shrine_start_lit', 'graceExtended'] }
    ];

    BO.SurvivalModifiersCatalog = { CATEGORIES, MODIFIERS, BUNDLES };
})(window.BO);
