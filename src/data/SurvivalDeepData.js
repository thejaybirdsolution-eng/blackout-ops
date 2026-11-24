/* ============================================================================
   BLACKOUT OPS — Deep Survival Mode Data
   Combines Minecraft crafting/infusions/automation, Elden Ring Shrines/Runes/
   Attributes/Talismans/Flasks/Poise, Palworld-style Tech Tree & Base Tiers
   (strictly ZERO pals/creatures), and Classic Zombie Perk Tonics & Pack Tiers.
============================================================================ */
(function (BO) {
    'use strict';

    // Extend SurvivalFrontierData Items, Tools & Recipes cleanly
    const frontier = BO.SurvivalFrontierData;
    Object.assign(frontier.items, {
        aetherShard: ['Aether shard', 'Components', 0.25],
        stew: ['Hearty venison stew', 'Consumables', 0.45],
        espresso: ['Field espresso', 'Consumables', 0.18],
        antibiotic: ['Antibiotic elixir', 'Consumables', 0.22],
        broth: ['Thermal spiced broth', 'Consumables', 0.35],
        aetherStim: ['Aether combat stim', 'Consumables', 0.20],
        orbitalFlare: ['Orbital supply flare', 'Consumables', 0.50],
        jugBrew: ['Juggernaut tonic', 'Consumables', 0.40],
        speedTonic: ['Quick-Hands tonic', 'Consumables', 0.40],
        staminElixir: ['Stamin-Up elixir', 'Consumables', 0.40],
        deadshotTinc: ['Deadshot tincture', 'Consumables', 0.40]
    });

    Object.assign(frontier.tools, {
        aetherPick: { name: 'Aether crystal pick', family: 'pick', level: 4, wear: 140, power: 4, cost: { ingot: 3, quartz: 3, aetherShard: 2 }, station: 'bench' },
        aetherAxe: { name: 'Aether cleaver axe', family: 'axe', level: 4, wear: 140, power: 4, cost: { ingot: 3, planks: 3, aetherShard: 2 }, station: 'bench' }
    });

    frontier.recipes.push(
        { id: 'cookStew', name: 'Hearty stew', station: 'campfire', cost: { rations: 1, herbs: 2, freshWater: 1 }, gain: { stew: 1 }, desc: 'Restores +65 hunger, +35 hydration, +25 HP & grants Warmth.' },
        { id: 'brewEspresso', name: 'Field espresso', station: 'campfire', cost: { freshWater: 1, coal: 1, herbs: 1 }, gain: { espresso: 2 }, desc: 'Restores +25 composure, +20 hydration, and +25s stamina boost.' },
        { id: 'brewBroth', tech: 't1_alchemy', name: 'Thermal spiced broth', station: 'campfire', cost: { freshWater: 1, herbs: 2, resin: 1 }, gain: { broth: 1 }, desc: 'Warms body temperature by +18°C and protects against freezing nights.' },
        { id: 'craftAntibiotic', tech: 't1_alchemy', name: 'Antibiotic elixir', station: 'bench', cost: { herbs: 3, freshWater: 1, cloth: 1 }, gain: { antibiotic: 2 }, desc: 'Cures Bio-Infection & Bleeding and clears 30% radiation.' },
        { id: 'craftAetherStim', name: 'Aether combat stim', station: 'bench', cost: { aetherShard: 1, herbs: 2, scrap: 1 }, gain: { aetherStim: 1 }, desc: 'Restores +45 HP, full stamina, and +30% speed for 20s.' },
        { id: 'craftOrbitalFlare', name: 'Orbital supply flare', station: 'bench', cost: { aetherShard: 1, wire: 2, fuel: 2, scrap: 3 }, gain: { orbitalFlare: 1 }, desc: 'Use from Backpack to call down an instant Supply Drop Crate nearby.' },
        { id: 'brewJug', tech: 't2_tonics', name: 'Juggernaut tonic', station: 'campfire', cost: { aetherShard: 1, herbs: 2, freshWater: 1 }, gain: { jugBrew: 1 }, desc: 'Grants +75 Max HP & +25% damage resistance for 3 minutes.' },
        { id: 'brewSpeed', tech: 't2_tonics', name: 'Quick-Hands tonic', station: 'campfire', cost: { quartz: 1, herbs: 2, freshWater: 1 }, gain: { speedTonic: 1 }, desc: 'Grants +40% faster weapon reload & fire rate for 3 minutes.' },
        { id: 'brewStamin', tech: 't2_tonics', name: 'Stamin-Up elixir', station: 'campfire', cost: { resin: 2, herbs: 2, freshWater: 1 }, gain: { staminElixir: 1 }, desc: 'Grants +22% sprint speed & halved stamina drain for 3 minutes.' },
        { id: 'brewDeadshot', tech: 't2_tonics', name: 'Deadshot tincture', station: 'campfire', cost: { copper: 2, quartz: 1, freshWater: 1 }, gain: { deadshotTinc: 1 }, desc: 'Grants +45% headshot & critical damage for 3 minutes.' },
        { id: 'smeltAetherAlloy', name: 'Refine Aether shard', station: 'kiln', cost: { quartz: 3, coal: 2, iron: 2 }, gain: { aetherShard: 1 }, desc: 'Crystallize Zone minerals into a high-energy Aether Shard.' }
    );

    // New Base-Building Fortifications, Interactive Doors, Traps & Automated Base Tech (Zero Pals!)
    const deepBuildings = [
        { id: 'spikes', name: 'Spike barricade', size: [2.4, 0.9, 0.55], cost: { timber: 3, scrap: 2 }, color: 0x8f6b47, tech: 't1_fortifications', detail: 'Damages (14 DPS) and slows hostiles who push against your perimeter.' },
        { id: 'wire', name: 'Barbed wire snare', size: [2.4, 0.45, 0.85], cost: { scrap: 2, wire: 1 }, color: 0x76838d, tech: 't1_fortifications', detail: 'Slows infected movement by 55% and inflicts continuous bleed.' },
        { id: 'door', name: 'Reinforced door', size: [1.5, 2.5, 0.24], cost: { planks: 4, ingot: 1 }, color: 0x62747d, tech: 't1_doors', detail: 'Interactive gate! Press [E] to swing open or seal against hordes.' },
        { id: 'platform', name: 'Firing deck', size: [2.8, 2.2, 2.8], cost: { planks: 5, stone: 3 }, color: 0x7e684e, tech: 't1_doors', detail: 'Elevated defense platform for sightlines and sniper/turret placement.' },
        { id: 'smelter', name: 'Auto-smelter', size: [1.1, 1.35, 1.1], cost: { ingot: 4, brick: 4, coal: 2 }, color: 0xa15d44, tech: 't2_automation', detail: 'Passively refines salvage & iron bars every 30s (2x speed near Generator). Press [E] to collect.' },
        { id: 'hydro', name: 'Hydro-collector', size: [0.95, 1.45, 0.95], cost: { scrap: 4, planks: 3, cloth: 2 }, color: 0x52889b, tech: 't2_automation', detail: 'Condenses clean Filtered Water automatically every 45s. Press [E] to collect.' },
        { id: 'turret', name: 'Scrap sentry turret', size: [0.85, 1.40, 0.85], cost: { ingot: 4, wire: 3, scrap: 5 }, color: 0x50695b, tech: 't3_turrets', detail: 'Automated tripod turret that locks onto hostiles within 18m and fires live tracer bursts!' },
        { id: 'generator', name: 'Field power generator', size: [1.25, 1.15, 0.95], cost: { ingot: 5, wire: 4, fuel: 3 }, color: 0xc29346, tech: 't3_power', detail: 'Powers base floodlights, doubles Auto-Smelter output, and boosts nearby Turret fire rate by +30%.' },
        { id: 'beacon', name: 'Homestead grace beacon', size: [0.75, 1.85, 0.75], cost: { quartz: 3, ingot: 3, aetherShard: 1 }, color: 0x7bdcb5, tech: 't3_tactical', detail: 'Player-built Site of Grace: rest, refill Aether Flask, level attributes, and respawn/fast-travel.' },
        { id: 'infuser', name: 'Aether infusion altar', size: [1.2, 1.05, 1.2], cost: { brick: 4, quartz: 3, aetherShard: 2 }, color: 0xa584e6, tech: 't4_infusion', detail: 'Press [E] to imbue your weapons and tools with Minecraft-style Aether Infusions.' }
    ];
    frontier.buildings.push(...deepBuildings);
    BO.SurvivalCampaignData.build.push(...deepBuildings);

    // 7 Sites of Grace (Elden Ring-inspired Sanctuary Checkpoints across 20x Valley)
    const shrines = [
        { id: 'relay_grace', name: 'Relay Sanctuary Grace', area: 'relay', x: 14, y: 0, z: 118 },
        { id: 'pine_grace', name: 'Pinebreak Glade Grace', area: 'pine', x: -138, y: 0, z: 42 },
        { id: 'freight_grace', name: 'Freight Overpass Grace', area: 'freight', x: 102, y: 0, z: -38 },
        { id: 'ridge_grace', name: 'Slateback Summit Grace', area: 'ridge', x: -198, y: 14, z: 142 },
        { id: 'airfield_grace', name: 'Airfield Hangar Grace', area: 'airfield', x: 168, y: 0, z: 162 },
        { id: 'radar_grace', name: 'Radar Overlook Grace', area: 'radar', x: 88, y: 11, z: -186 },
        { id: 'trench_grace', name: 'Trench Threshold Grace', area: 'trench', x: 14, y: -8, z: -180 }
    ];

    // 5 Levelable RPG Attributes (Spend Aether Runes at Shrines or Tech Panel)
    const attributes = {
        vigor: { name: 'Vigor', bonus: '+15 Max Health per rank', color: '#ef4444' },
        endurance: { name: 'Endurance', bonus: '+12% Max Stamina & +3 kg Carry Capacity per rank', color: '#22c55e' },
        strength: { name: 'Strength', bonus: '+18% Bare-Hands / Melee Damage & Poise Break per rank', color: '#f97316' },
        dexterity: { name: 'Dexterity', bonus: '+10% Firearm Damage & +6% Reload Speed per rank', color: '#38bdf8' },
        arcane: { name: 'Arcane', bonus: '+15% Rune Gain, +4 Flask Heal & -8% Rad Buildup per rank', color: '#c084fc' }
    };

    // 7 Collectible Talismans (Equip up to 3 in Backpack or at a Shrine)
    const talismans = {
        crimson_medallion: { name: 'Crimson Amber Medallion', effect: '+25 Max HP and +15% healing received.', location: 'Hospital Cache / Salvage', color: '#f87171' },
        turtle_emblem: { name: 'Green Turtle Emblem', effect: '+40% stamina recovery speed.', location: 'Pinebreak Woods Cache', color: '#4ade80' },
        claw_talisman: { name: 'Raptor Claw Talisman', effect: '+35% Bare-Hands & Melee attack damage and wider Parry window.', location: 'Slateback Ridge Pickup', color: '#fb923c' },
        marksman_lens: { name: 'Deadeye Optical Crest', effect: '+25% headshot multiplier and tighter ADS spread.', location: 'Freight Siding Pickup', color: '#60a5fa' },
        rad_charm: { name: 'Lead-Lined Zone Charm', effect: 'Reduces ambient radiation buildup by 40% and cold drain by 50%.', location: 'Spillway Marsh Pickup', color: '#a3e635' },
        scavenger_scarab: { name: 'Golden Rune Scarab', effect: '+35% Aether Runes from enemies and +25% Tech XP.', location: 'Pale Maul / Frostline Drop', color: '#facc15' },
        ironheart_crest: { name: 'Ironheart Shield Crest', effect: 'Reduces all incoming damage by 25% when below 45% HP.', location: 'Cinder Regent / Apex Drop', color: '#c084fc' }
    };

    const talismanPickups = [
        { id: 'turtle_emblem', x: -144, y: 0, z: 74 },
        { id: 'marksman_lens', x: 134, y: 0, z: -8 },
        { id: 'rad_charm', x: 186, y: 0, z: -96 },
        { id: 'claw_talisman', x: -208, y: 20, z: 164 }
    ];

    const goldenSeeds = [
        { id: 'seed_pine', name: 'Golden Aether Seed (Pinebreak)', x: -178, y: 0, z: 102 },
        { id: 'seed_basin', name: 'Golden Aether Seed (Spillway)', x: 206, y: 0, z: -72 },
        { id: 'seed_cavern', name: 'Golden Aether Seed (Echo Cavern)', x: -64, y: -8, z: -214 }
    ];

    // 16-Node 4-Tier Palworld-Inspired Technology Tree (STRICTLY ZERO CREATURES/PALS!)
    const techTree = [
        // Tier 1
        { id: 't1_fortifications', tier: 1, cost: 1, name: 'Perimeter Traps', desc: 'Unlocks Spike Barricades and Barbed Wire Snares in Build.' },
        { id: 't1_doors', tier: 1, cost: 1, name: 'Gatehouse & Platforms', desc: 'Unlocks interactive Reinforced Doors and elevated Firing Decks.' },
        { id: 't1_alchemy', tier: 1, cost: 1, name: 'Field Rations & Medicine', desc: 'Boosts campfire cooking & unlocks Antibiotic Elixir and Thermal Broth.' },
        { id: 't1_scavenge', tier: 1, cost: 1, name: 'Field Logistics', desc: 'Grants +8 kg bonus carry weight immediately and +15% salvage haul loot.' },
        // Tier 2
        { id: 't2_armory', tier: 2, cost: 1, name: 'Field Armory Schematics', req: 't1_fortifications', desc: 'Forge MP5, R870 Pump, Kar98k, and Desert Eagle at your Workbench.' },
        { id: 't2_automation', tier: 2, cost: 1, name: 'Automated Base Machines', req: 't1_doors', desc: 'Unlocks passive Auto-Smelter and Hydro-Collector stations.' },
        { id: 't2_tonics', tier: 2, cost: 1, name: 'Zombies Perk Tonics', req: 't1_alchemy', desc: 'Allows brewing Juggernaut, Quick-Hands, Stamin-Up & Deadshot tonics.' },
        { id: 't2_gunsmith', tier: 2, cost: 1, name: 'Weapon Mk II / III Bench', req: 't1_scavenge', desc: 'Upgrade equipped firearms at any Workbench up to Mk III (+45% DMG).' },
        // Tier 3
        { id: 't3_turrets', tier: 3, cost: 2, name: 'Automated Sentry Turrets', req: 't2_automation', desc: 'Unlocks automated Scrap Sentry Turrets that track & shoot threats.' },
        { id: 't3_power', tier: 3, cost: 2, name: 'Field Power Grid', req: 't2_automation', desc: 'Unlocks Field Power Generator (2x smelter speed & +30% turret fire rate).' },
        { id: 't3_heavy_arms', tier: 3, cost: 2, name: 'Heavy Weapon Schematics', req: 't2_armory', desc: 'Forge M4A1, AK-47, SPAS-12, and Shadow Carbon Katana at Workbench.' },
        { id: 't3_tactical', tier: 3, cost: 2, name: 'Homestead Grace & Stealth', req: 't2_tonics', desc: 'Unlocks buildable Homestead Grace Beacon and +25% crouch stealth reduction.' },
        // Tier 4
        { id: 't4_infusion', tier: 4, cost: 2, name: 'Aether Infusion Altar', req: 't3_power', desc: 'Unlocks Aether Infusion Altar for Minecraft-style Fortune, Fire Aspect, Vampiric & Overclock.' },
        { id: 't4_elite_arms', tier: 4, cost: 2, name: 'Elite & Wonder Armory', req: 't3_heavy_arms', desc: 'Forge Intervention .408, SCAR-H, M249 SAW, and Ray Gun Prototype!' },
        { id: 't4_orbital', tier: 4, cost: 2, name: 'Orbital Supply Support', req: 't3_turrets', desc: 'Craft Orbital Supply Flares and double all Auto-Turret magazine efficiency.' },
        { id: 't4_mastery', tier: 4, cost: 2, name: 'Aether Master Tools', req: 't2_gunsmith', desc: 'Unlocks Tier 4 Aether Pick/Axe and grants +50 permanent max Armor capacity.' }
    ];

    // 7 Minecraft-Style Aether Infusions (Up to 2 Active Simultaneously)
    const infusions = {
        fortune: { name: 'Fortune III', desc: '+45% extra resource & salvage drops from all deposits and kills.' },
        overclock: { name: 'Sharpness / Power III', desc: '+25% flat weapon, bare-hands, and melee damage.' },
        fire_aspect: { name: 'Fire Aspect II', desc: 'Bare-hands, melee, and bullets ignite enemies for bonus burn damage.' },
        vampiric: { name: 'Life Mending', desc: 'Kills restore +8 HP and slowly repair equipped tool durability.' },
        swiftness: { name: 'Swiftness II', desc: '+14% movement speed and +20% faster reload speed.' },
        thorns: { name: 'Thorns II', desc: 'Reflects 35% of melee damage back onto attackers and briefly staggers them.' },
        unbreaking: { name: 'Unbreaking III', desc: 'Reduces tool wear and firearm stoppage risk by 60%.' }
    };

    // Craftable Weapon Schematics at Workbench (Equips real 3D weapon directly!)
    const weaponSchematics = [
        { id: 'mp5', name: 'MP5K Navy SMG', tech: 't2_armory', cost: { ingot: 2, scrap: 3, wire: 1 }, ammo: 120 },
        { id: 'r870', name: 'R870 MCS Pump Shotgun', tech: 't2_armory', cost: { ingot: 2, planks: 2, scrap: 2 }, ammo: 40 },
        { id: 'kar98k_irons', name: 'Kar98k Mauser Rifle', tech: 't2_armory', cost: { ingot: 3, planks: 2, scrap: 1 }, ammo: 35 },
        { id: 'deagle', name: 'Desert Eagle .50 AE', tech: 't2_armory', cost: { ingot: 3, scrap: 2 }, ammo: 42 },
        { id: 'm4a1', name: 'M4A1 SOPMOD Carbine', tech: 't3_heavy_arms', cost: { ingot: 4, wire: 2, scrap: 4 }, ammo: 150 },
        { id: 'ak47', name: 'AK-47 Kalash Rifle', tech: 't3_heavy_arms', cost: { ingot: 4, planks: 2, scrap: 3 }, ammo: 150 },
        { id: 'spas12_tac', name: 'SPAS-12 Tactical', tech: 't3_heavy_arms', cost: { ingot: 4, wire: 1, scrap: 4 }, ammo: 48 },
        { id: 'katana_carbon', name: 'Shadow Carbon Katana', tech: 't3_heavy_arms', cost: { ingot: 4, quartz: 2, cord: 2 }, ammo: 1 },
        { id: 'scarh', name: 'SCAR-H Heavy 7.62', tech: 't4_elite_arms', cost: { ingot: 5, wire: 3, aetherShard: 1 }, ammo: 120 },
        { id: 'intervention', name: 'Intervention (MW2)', tech: 't4_elite_arms', cost: { ingot: 5, lens: 1, wire: 2, aetherShard: 1 }, ammo: 30 },
        { id: 'm249', name: 'M249 SAW LMG', tech: 't4_elite_arms', cost: { ingot: 6, wire: 3, aetherShard: 1 }, ammo: 200 },
        { id: 'raygun', name: 'Ray Gun Prototype', tech: 't4_elite_arms', cost: { coil: 1, lens: 2, aetherShard: 3 }, ammo: 100 }
    ];

    BO.SurvivalDeepData = {
        shrines,
        attributes,
        talismans,
        talismanPickups,
        goldenSeeds,
        techTree,
        infusions,
        weaponSchematics
    };
})(window.BO);
