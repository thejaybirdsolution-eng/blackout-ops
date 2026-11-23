(function (BO) {
    'use strict';

    const modes = {
        expedition: { name: 'Core Expedition', description: 'Defeat the Apex Guardian below the Research Trench, retrieve the Aether core, and hold Evac Ridge.' },
        homestead: { name: 'Homestead', description: 'Build six different surviving structures, craft eight items, and survive three minutes before evacuating.' },
        survey: { name: 'Survey Circuit', description: 'Discover six areas and record three survey cairns before calling extraction.' },
        salvage: { name: 'Salvage Run', description: 'Deliver twelve iron ore, eight sawn boards, four coal, and ten salvage to Evac Ridge.' },
        bounty: { name: 'Rival Bounty', description: 'Eliminate Commander Sable and any one Zone Boss, then return to Evac Ridge.' },
        siege: { name: 'Ridge Siege', description: 'Trigger and survive a three-wave defense at Evac Ridge after the safe minute, then call extraction.' },
        bloodmoon: { name: 'Blood Moon Defense', description: 'Fortify a homestead with traps and turrets, survive a Crimson Blood Moon night surge, then evacuate at Evac Ridge.' },
        gauntlet: { name: 'Zone Boss Gauntlet', description: 'Slay any three Zone Bosses (Apex Guardian, Pale Maul, Cinder Regent, Resonant Sentinel) and extract.' },
        scavenger: { name: 'Zero-to-Hero Scavenger', description: 'Drop barehanded with zero guns or ammo. Gather materials, unlock schematics or loot caches, forge firearms, and extract.' },
        freeplay: { name: 'Free Roam', description: 'Explore, farm, fish, build, upgrade attributes, and unlock tech indefinitely. Evacuation opens after the safe minute.' }
    };

    const difficulties = {
        customLite: { name: 'Exploration', hp: 0.72, damage: 0.48, rate: 0.50, enemyCap: 8 },
        relaxed: { name: 'Trailblazer', hp: 0.80, damage: 0.65, rate: 0.72, enemyCap: 12 },
        standard: { name: 'Standard', hp: 1.00, damage: 1.00, rate: 1.00, enemyCap: 20 },
        hard: { name: 'Hard', hp: 1.24, damage: 1.28, rate: 1.20, enemyCap: 24 },
        veteran: { name: 'Veteran', hp: 1.48, damage: 1.52, rate: 1.40, enemyCap: 26 },
        nightmare: { name: 'Nightmare', hp: 1.80, damage: 1.75, rate: 1.62, enemyCap: 30 },
        apocalypse: { name: 'Apocalypse', hp: 2.15, damage: 2.00, rate: 1.85, enemyCap: 34 }
    };

    const modifiers = {
        // World & Time
        noPatrols: { name: 'No roaming PMC patrols', group: 'world', description: 'Ordinary surface PMC patrols are disabled. Commander Sable still appears during Rival Bounty.' },
        noRoamers: { name: 'No roaming infected', group: 'world', description: 'Ordinary infected and Mimics are disabled. Bosses, Blood Moons, and Ridge Siege waves still spawn.' },
        blackout: { name: 'Permanent blackout', group: 'world', description: 'Darkness remains at midnight levels even during daytime.' },
        longDusk: { name: 'Short daylight', group: 'world', description: 'Darkness arrives earlier in the evening and lingers longer after sunrise.' },
        brutalNights: { name: 'Relentless nights', group: 'world', description: 'Doubles the nighttime hostile spawn rate multiplier.' },
        bloodMoonEveryNight: { name: 'Crimson Blood Moons', group: 'world', description: 'Every night after the safe minute triggers a Crimson Blood Moon surge with bonus Aether Shard rewards.' },
        graceExtended: { name: 'Extended safe start (120s)', group: 'world', description: 'Doubles the enemy-free opening grace period from 60 seconds to 120 seconds.' },

        // Combat & Enemies
        fists: { name: 'Bare-hands insertion', group: 'combat', description: 'Start with bare hands selected and zero pistol ammunition until you craft or loot some.' },
        noFirearms: { name: 'Melee & bare-hands honor', group: 'combat', description: 'Firearms are sealed; fight exclusively with bare-hand combos, parries, melee blades, turrets, and throwables.' },
        headshotsOnly: { name: 'Precision headshots', group: 'combat', description: 'Firearm body shots deal 35% damage while headshots and melee/parry strikes deal 220% damage.' },
        doubleBosses: { name: 'Twin boss threat', group: 'combat', description: 'Spawning any Zone Boss also calls an elite infected lieutenant nearby.' },
        turretMaster: { name: 'Overclocked defenses', group: 'combat', description: 'Placed sentry turrets fire 35% faster and Spike/Barbed Wire barricades deal double damage.' },
        soulsDrop: { name: 'Aether Soul Echo', group: 'combat', description: 'Falling near a kindled Shrine or Field Bed lets you respawn there while dropping your carried Runes at a recoverable Soul Echo.' },

        // Survival & Status
        glass: { name: 'Fragile operator', group: 'survival', description: 'Start with a maximum of 70 base health.' },
        armored: { name: 'Armored insertion', group: 'survival', description: 'Start with 100 armor and three spare armor plates.' },
        hungry: { name: 'Fast metabolism', group: 'survival', description: 'Hunger and hydration drain twice as quickly when survival needs are active.' },
        irradiated: { name: 'Hot exclusion zone', group: 'survival', description: 'Radiation buildup increases by 80% in contaminated zones.' },
        freezingNights: { name: 'Sub-zero nights', group: 'survival', description: 'Nighttime temperature plunges sharply; stay near fires, wear warmth, or drink Thermal Broth.' },
        infectBite: { name: 'Bio-toxic hits', group: 'survival', description: 'Infected melee hits can inflict Bleeding or Bio-Infection; cure with dressings, Aether Flask, or Antibiotics.' },
        fieldMedic: { name: 'Field medic', group: 'survival', description: 'Trauma kits restore up to 75 health and herbal dressings restore up to 40 and cure bleeding.' },

        // Economy & Base Tech
        loaded: { name: 'Supply crate start', group: 'economy', description: 'Start with extra materials, rations, water, a torch, and spare pistol ammunition.' },
        richLoot: { name: 'Rich natural deposits', group: 'economy', description: 'Gathering yields ~50% more ordinary resources. Unique Resonant Core is unaffected.' },
        steadyTools: { name: 'Long-lasting tools', group: 'economy', description: 'Reduces tool durability wear from gathering and mining by half.' },
        fullBags: { name: 'Expedition rucksack', group: 'economy', description: 'Start immediately with a 51 kg rucksack (23 inventory stacks).' },
        megaStack: { name: 'Deep pack capacity', group: 'economy', description: 'Doubles backpack carry weight limit and adds +10 extra inventory stack slots.' },
        fastGrow: { name: 'Rapid hydroponics', group: 'economy', description: 'Garden crops grow 2.5x faster and salvage line catches bite twice as fast.' },
        abundantTech: { name: 'Research surge', group: 'economy', description: 'Start with +3 Tech Points and gain double Tech Points and Rune drops from all sources.' },

        // Challenge & Extraction
        ironRun: { name: 'Iron expedition', group: 'challenge', description: 'Manual/auto checkpoints and Shrine respawn are disabled. One life only.' },
        footOnly: { name: 'On foot only', group: 'challenge', description: 'Personal vehicles, the locomotive, and map fast travel are disabled.' },
        quickEvac: { name: 'Fast evacuation', group: 'challenge', description: 'Cuts the final Evac Ridge hold from 38 seconds to 19 seconds.' }
    };

    const presets = {
        standard: { name: 'Balanced Expedition', description: 'The standard Exclusion Zone core recovery run.', settings: { gameType: 'expedition', difficulty: 'standard', modifiers: ['soulsDrop'] } },
        builder: { name: 'Quiet Homestead', description: 'Peaceful fort-building, gardening, and tech run.', settings: { gameType: 'homestead', difficulty: 'relaxed', modifiers: ['noPatrols', 'noRoamers', 'richLoot', 'steadyTools', 'loaded', 'fastGrow'] } },
        bloodmoon: { name: 'Blood Moon Fortress', description: 'Prepare turrets, spikes, and doors before crimson nights hit.', settings: { gameType: 'bloodmoon', difficulty: 'hard', startHour: 12, modifiers: ['bloodMoonEveryNight', 'turretMaster', 'loaded', 'abundantTech', 'soulsDrop'] } },
        tarnished: { name: 'Aether Tarnished', description: 'Shrines of Grace, Soul Echoes, Aether Flasks, Talismans, and tougher bosses.', settings: { gameType: 'gauntlet', difficulty: 'veteran', modifiers: ['soulsDrop', 'doubleBosses', 'infectBite', 'freezingNights'] } },
        industrial: { name: 'Frontier Engineer', description: 'Focus on mining, smelters, generators, turrets, and weapon schematics.', settings: { gameType: 'freeplay', difficulty: 'standard', modifiers: ['abundantTech', 'turretMaster', 'megaStack', 'richLoot', 'steadyTools'] } },
        zeroToHero: { name: 'Bare-Hands Scavenger', description: 'Start unarmed in the wilds; fight barehanded, loot, and forge your guns.', settings: { gameType: 'scavenger', difficulty: 'standard', modifiers: ['fists', 'soulsDrop', 'graceExtended'] } },
        night: { name: 'Nightfall', description: 'Hard extraction with total blackout and relentless infected pressure.', settings: { gameType: 'expedition', difficulty: 'hard', startHour: 22, pool: 'horde', modifiers: ['blackout', 'brutalNights'] } },
        iron: { name: 'Iron Road', description: 'Veteran hardcore run on foot with bare hands start and zero checkpoints.', settings: { gameType: 'expedition', difficulty: 'veteran', modifiers: ['ironRun', 'fists', 'footOnly'] } },
        chart: { name: 'Cartographer', description: 'Long daylight and bonus supplies for a complete map survey circuit.', settings: { gameType: 'survey', difficulty: 'customLite', dayLength: 720, modifiers: ['loaded', 'noPatrols'] } },
        miner: { name: 'Deep Salvage', description: 'Heavy mining and smelting run with durable tools and big packs.', settings: { gameType: 'salvage', modifiers: ['steadyTools', 'richLoot', 'fullBags', 'megaStack'] } },
        siege: { name: 'Last Light Siege', description: 'Armored three-wave Evac Ridge defense beginning at dusk.', settings: { gameType: 'siege', difficulty: 'hard', startHour: 18, pool: 'horde', modifiers: ['armored', 'loaded', 'turretMaster'] } },
        peaceful: { name: 'Peaceful Sandbox', description: 'Build, farm, fish, and explore freely with zero roaming enemies and no hunger damage.', settings: { gameType: 'freeplay', difficulty: 'customLite', survivalNeeds: false, modifiers: ['noPatrols', 'noRoamers', 'loaded', 'fullBags', 'steadyTools', 'fastGrow', 'abundantTech'] } }
    };

    const openingSeconds = 60;
    function openingSecondsFor(options) {
        const mods = Array.isArray(options?.modifiers) ? options.modifiers : [];
        return mods.includes('graceExtended') ? 120 : openingSeconds;
    }

    BO.SurvivalRules = { modes, difficulties, modifiers, presets, openingSeconds, openingSecondsFor };
})(window.BO);
