/* ============================================================================
   BLACKOUT OPS — Unified Match Modifier Engine & Starting Weapon Protocols
   Powers Zombies, Multiplayer, and Tower Defense with organized categories,
   curated bundles, O(1) effect aggregation, and 20 starting weapon protocols.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const BASE_CATEGORIES = [
        { id: 'horde', name: 'Horde Stats', icon: '🧟', col: '#f87171' },
        { id: 'behavior', name: 'Horde Behavior', icon: '🌀', col: '#fb923c' },
        { id: 'boss', name: 'Bosses', icon: '💀', col: '#e879f9' },
        { id: 'weapons', name: 'Your Weapons', icon: '🔫', col: '#38bdf8' },
        { id: 'body', name: 'Your Body', icon: '❤️', col: '#4ade80' },
        { id: 'economy', name: 'Economy', icon: '🪙', col: '#fde047' },
        { id: 'world', name: 'World & Chaos', icon: '🌋', col: '#c084fc' }
    ];

    const Z = ['zombies', 'td'];
    const ALL = ['zombies', 'td', 'mp'];

    const CORE_DEFS = [
        { k: 'allBosses', lbl: 'All Bosses', cat: 'boss', tier: 'challenge', ico: '👹', modes: Z, desc: 'Every enemy that spawns is a boss.' },
        { k: 'shieldedBosses', lbl: 'Shielded Bosses', cat: 'boss', tier: 'challenge', ico: '🛡', modes: Z, desc: 'Bosses carry a regenerating shield.' },
        { k: 'fastZombies', lbl: 'Fast Zombies', cat: 'horde', tier: 'challenge', ico: '💨', modes: Z, desc: 'The whole horde moves about 1.6x faster.' },
        { k: 'giantZombies', lbl: 'Giant Zombies', cat: 'horde', tier: 'challenge', ico: '🗿', modes: Z, desc: '1.65x bigger, tougher and a little slower.' },
        { k: 'tinyZombies', lbl: 'Tiny Speedsters', cat: 'horde', tier: 'chaos', ico: '🐁', modes: Z, desc: 'Small, fragile and very fast.' },
        { k: 'armoredHorde', lbl: 'Armored Horde', cat: 'horde', tier: 'challenge', ico: '🪖', modes: Z, desc: 'Every zombie gains +35% damage reduction.' },
        { k: 'halfZombieHp', lbl: 'Half Zombie Health', cat: 'horde', tier: 'buff', ico: '📉', modes: Z, desc: 'All zombies spawn with 50% health.' },
        { k: 'quarterZombieHp', lbl: 'Quarter Zombie Health', cat: 'horde', tier: 'buff', ico: '🪶', modes: Z, desc: 'All zombies spawn with 25% health.' },
        { k: 'oneHitMeleeZombies', lbl: 'Deadly Touch (99,999 dmg)', cat: 'horde', tier: 'challenge', ico: '☠️', modes: Z, desc: 'Any zombie swipe is instantly lethal.' },
        { k: 'chaosSwarm', lbl: 'Chaos Swarm', cat: 'horde', tier: 'chaos', ico: '🌊', modes: Z, desc: 'Twice as many zombies per round, each a bit weaker.' },
        { k: 'allEnemiesUnlocked', lbl: 'Full Roster From Round 1', cat: 'behavior', tier: 'chaos', ico: '🧬', modes: Z, desc: 'All 70 enemies and 10 bosses can appear from the start.' },
        { k: 'zombiesHeal', lbl: 'Healer Zombies', cat: 'behavior', tier: 'challenge', ico: '💚', modes: Z, desc: 'Zombies patch each other up mid-fight.' },
        { k: 'magicalZombies', lbl: 'Magical Zombies', cat: 'behavior', tier: 'challenge', ico: '🔮', modes: Z, desc: 'Zombies cast ranged magic bolts.' },
        { k: 'explosiveDeath', lbl: 'Explosive Deaths', cat: 'behavior', tier: 'chaos', ico: '💥', modes: Z, desc: 'Zombies burst when they die. Keep your distance.' },
        { k: 'vampiric', lbl: 'Vampiric Zombies', cat: 'behavior', tier: 'challenge', ico: '🧛', modes: Z, desc: 'Zombie attacks drain your life.' },
        { k: 'megaSplitters', lbl: 'Mega Splitters', cat: 'behavior', tier: 'chaos', ico: '♊', modes: Z, desc: 'Every zombie splits into two when killed.' },
        { k: 'superJumpZombies', lbl: 'Super-Jumping Horde', cat: 'behavior', tier: 'chaos', ico: '🦘', modes: Z, desc: 'Zombies leap often and high.' },
        { k: 'berserkerWave', lbl: 'Berserker Rage', cat: 'behavior', tier: 'challenge', ico: '💢', modes: Z, desc: 'Zombies enrage when below half health.' },
        { k: 'noProjectiles', lbl: 'No Projectile Zombies', cat: 'behavior', tier: 'buff', ico: '🚫', modes: Z, desc: 'No zombie can shoot or cast at range.' },
        { k: 'noProjectilesUntil20', lbl: 'No Projectiles Until Rd 20', cat: 'behavior', tier: 'tactical', ico: '🕊', modes: Z, desc: 'Ranged attacks only start at round 20.' },
        { k: 'headshotsOnly', lbl: 'Headshots Only', cat: 'weapons', tier: 'challenge', ico: '🎯', modes: Z, desc: 'Body shots do nothing.' },
        { k: 'infiniteAmmo', lbl: 'Infinite Ammo', cat: 'weapons', tier: 'buff', ico: '♾️', modes: Z, desc: 'Never reload, never run dry.' },
        { k: 'randomLoadoutWave', lbl: 'Random Gun Each Round', cat: 'weapons', tier: 'chaos', ico: '🎲', modes: Z, desc: 'You get a random gun at the start of every round.' },
        { k: 'sniperHeaven', lbl: 'Sniper Heaven', cat: 'weapons', tier: 'buff', ico: '🔭', modes: Z, desc: 'Sniper and marksman rifles deal 2.5x damage.' },
        { k: 'meleeMayhem', lbl: 'Melee Mayhem', cat: 'weapons', tier: 'buff', ico: '🔪', modes: Z, desc: 'Melee deals 4x damage and heals 20 HP per kill.' },
        { k: 'explosiveHeadshots', lbl: 'Explosive Headshots', cat: 'weapons', tier: 'buff', ico: '🎇', modes: Z, desc: 'Headshot kills explode and damage the crowd.' },
        { k: 'fastReload', lbl: 'Hyper Reload', cat: 'weapons', tier: 'buff', ico: '🔄', modes: ALL, desc: 'Reloads are about 3x faster.' },
        { k: 'glassCannon', lbl: 'Glass Cannon', cat: 'body', tier: 'chaos', ico: '💎', modes: Z, desc: 'You and the horde both hit 3x harder; you have half health.' },
        { k: 'vampirePlayer', lbl: 'Vampire (+15 HP per kill)', cat: 'body', tier: 'buff', ico: '🩸', modes: ALL, desc: 'Every kill heals you 15 HP.' },
        { k: 'hyperSpeedPlayer', lbl: 'Hyper Speed', cat: 'body', tier: 'buff', ico: '⚡', modes: ALL, desc: 'You move 1.6x faster.' },
        { k: 'noRegen', lbl: 'No Health Regen', cat: 'body', tier: 'challenge', ico: '💔', modes: ALL, desc: 'Health never comes back on its own.' },
        { k: 'noPerks', lbl: 'No Perk Machines', cat: 'economy', tier: 'challenge', ico: '🚫', modes: Z, desc: 'Perk machines are switched off.' },
        { k: 'freePerks', lbl: 'Free Perks', cat: 'economy', tier: 'buff', ico: '🥤', modes: Z, desc: 'Perk machines cost nothing.' },
        { k: 'richStart', lbl: 'Rich Start (10,000)', cat: 'economy', tier: 'buff', ico: '💰', modes: Z, desc: 'Begin with 10,000 points or gold.' },
        { k: 'doubleGold', lbl: 'Double Points / Gold', cat: 'economy', tier: 'buff', ico: '🪙', modes: Z, desc: 'All income is doubled.' },
        { k: 'cost4x', lbl: 'Everything Costs 4x', cat: 'economy', tier: 'challenge', ico: '💸', modes: ['td'], desc: 'Every shop price is four times higher.' },
        { k: 'bloodMoon', lbl: 'Blood Moon', cat: 'world', tier: 'chaos', ico: '🌕', modes: Z, desc: 'Red sky and thick crimson fog.' },
        { k: 'nightmareDarkness', lbl: 'Nightmare Darkness', cat: 'world', tier: 'challenge', ico: '🌑', modes: Z, desc: 'Near-total darkness. Bring a steady aim.' },
        { k: 'lowGravity', lbl: 'Low Gravity', cat: 'world', tier: 'chaos', ico: '🪐', modes: Z, desc: 'Floaty, moon-like jumps.' },

        { k: 'doubleZombieHp', lbl: 'Double Zombie Health', cat: 'horde', tier: 'challenge', ico: '✖️', modes: Z, desc: 'Every zombie has 2x health.' },
        { k: 'tripleZombieHp', lbl: 'Triple Zombie Health', cat: 'horde', tier: 'challenge', ico: '⚠️', modes: Z, desc: 'Every zombie has 3x health.' },
        { k: 'paperZombies', lbl: 'Paper Zombies (1 HP)', cat: 'horde', tier: 'buff', ico: '📃', modes: Z, desc: 'Every zombie and boss dies in one hit.' },
        { k: 'slowZombies', lbl: 'Slow Horde', cat: 'horde', tier: 'buff', ico: '🐢', modes: Z, desc: 'Zombies move at 60% speed.' },
        { k: 'snailZombies', lbl: 'Snail Horde', cat: 'horde', tier: 'buff', ico: '🐌', modes: Z, desc: 'Zombies crawl along at 35% speed.' },
        { k: 'hardHitters', lbl: 'Hard Hitters', cat: 'horde', tier: 'challenge', ico: '💢', modes: Z, desc: 'Zombie attacks deal 2x damage.' },
        { k: 'softHitters', lbl: 'Soft Hitters', cat: 'horde', tier: 'buff', ico: '🪶', modes: Z, desc: 'Zombie attacks deal half damage.' },
        { k: 'titaniumHorde', lbl: 'Titanium Horde', cat: 'horde', tier: 'challenge', ico: '🔩', modes: Z, desc: 'Zombies gain +55% damage reduction (stacks up to 80%).' },
        { k: 'randomSizes', lbl: 'Random Sizes', cat: 'horde', tier: 'chaos', ico: '📏', modes: Z, desc: 'Each zombie is randomly tiny or huge; health scales with size.' },
        { k: 'rampingHp', lbl: 'Escalating Health', cat: 'horde', tier: 'challenge', ico: '📈', modes: Z, desc: 'Zombies gain an extra +10% health every round.' },
        { k: 'rampingSpeed', lbl: 'Escalating Speed', cat: 'horde', tier: 'challenge', ico: '🏃', modes: Z, desc: 'Zombies gain an extra +3% speed every round (max 2x).' },
        { k: 'zombieRegen', lbl: 'Regenerating Horde', cat: 'horde', tier: 'challenge', ico: '🧬', modes: Z, desc: 'Wounded zombies heal 2% of their health every second.' },
        { k: 'eliteEvery10', lbl: 'Elite Every 10th', cat: 'horde', tier: 'challenge', ico: '⭐', modes: Z, desc: 'Every 10th zombie is an elite: 3x health and noticeably bigger.' },
        { k: 'allSplitFour', lbl: 'Quad Splitters', cat: 'behavior', tier: 'chaos', ico: '🔀', modes: Z, desc: 'Every normal zombie splits into four when killed.' },
        { k: 'allJumpers', lbl: 'Pogo Horde', cat: 'behavior', tier: 'chaos', ico: '🐇', modes: Z, desc: 'Every zombie hops constantly.' },
        { k: 'woundedFrenzy', lbl: 'Wounded Frenzy', cat: 'behavior', tier: 'challenge', ico: '😡', modes: Z, desc: 'Zombies get 1.6x faster once they drop below half health.' },
        { k: 'thickSkulls', lbl: 'Thick Skulls', cat: 'behavior', tier: 'challenge', ico: '🪨', modes: Z, desc: 'Headshots deal half damage.' },
        { k: 'glassJaws', lbl: 'Glass Jaws', cat: 'behavior', tier: 'buff', ico: '💥', modes: Z, desc: 'Headshots deal 3x damage.' },
        { k: 'hulkingBosses', lbl: 'Colossal Bosses', cat: 'boss', tier: 'challenge', ico: '🌋', modes: Z, desc: 'Bosses have 2x health and tower over you.' },
        { k: 'fragileBosses', lbl: 'Fragile Bosses', cat: 'boss', tier: 'buff', ico: '🦴', modes: Z, desc: 'Bosses have half health.' },
        { k: 'bossSlayer', lbl: 'Boss Slayer', cat: 'boss', tier: 'buff', ico: '⚔️', modes: Z, desc: 'You deal 3x damage to bosses.' },
        { k: 'bountyHunter', lbl: 'Bounty Hunter', cat: 'boss', tier: 'buff', ico: '🏅', modes: Z, desc: 'Each boss kill pays an extra 2,000 points or gold.' },
        { k: 'pistolPower', lbl: 'Pistol Power', cat: 'weapons', tier: 'buff', ico: '🔫', modes: ALL, desc: 'Pistols deal 3x damage.' },
        { k: 'shotgunSurgeon', lbl: 'Shotgun Surgeon', cat: 'weapons', tier: 'buff', ico: '💥', modes: ALL, desc: 'Shotguns deal 2x damage.' },
        { k: 'rifleman', lbl: 'Rifleman', cat: 'weapons', tier: 'buff', ico: '🪖', modes: ALL, desc: 'Assault rifles deal 1.75x damage.' },
        { k: 'smgSpray', lbl: 'SMG Spray', cat: 'weapons', tier: 'buff', ico: '💨', modes: ALL, desc: 'SMGs deal 1.75x damage.' },
        { k: 'lmgSuppress', lbl: 'Heavy Gunner', cat: 'weapons', tier: 'buff', ico: '🔥', modes: ALL, desc: 'LMGs deal 1.75x damage.' },
        { k: 'doublePlayerDmg', lbl: 'Double Damage', cat: 'weapons', tier: 'buff', ico: '💢', modes: ALL, desc: 'Everything you fire deals 2x damage.' },
        { k: 'weakPlayerDmg', lbl: 'Weak Rounds', cat: 'weapons', tier: 'challenge', ico: '🫧', modes: ALL, desc: 'Everything you fire deals half damage.' },
        { k: 'critChance', lbl: 'Lucky Crits', cat: 'weapons', tier: 'buff', ico: '✨', modes: ALL, desc: 'Each hit has a 15% chance to deal 3x damage.' },
        { k: 'executioner', lbl: 'Executioner', cat: 'weapons', tier: 'buff', ico: '🪓', modes: Z, desc: 'Hitting a non-boss below 20% health kills it outright.' },
        { k: 'meleeOnly', lbl: 'Melee Only', cat: 'weapons', tier: 'challenge', ico: '🗡', modes: ALL, desc: 'Only melee attacks deal damage.' },
        { k: 'noMelee', lbl: 'No Melee', cat: 'weapons', tier: 'challenge', ico: '✋', modes: ALL, desc: 'Melee attacks deal no damage.' },
        { k: 'bodyshotsOnly', lbl: 'Bodyshots Only', cat: 'weapons', tier: 'challenge', ico: '👕', modes: ALL, desc: 'Headshots do nothing; aim center mass.' },
        { k: 'killAmmo', lbl: 'Scavenger Kills', cat: 'weapons', tier: 'buff', ico: '🧰', modes: ALL, desc: 'Every kill returns 25% of a magazine to your reserve.' },
        { k: 'ammoScarcity', lbl: 'Ammo Scarcity', cat: 'weapons', tier: 'challenge', ico: '📉', modes: ALL, desc: 'You start with half your reserve ammo.' },
        { k: 'startPaP', lbl: 'Start Pack-a-Punched', cat: 'weapons', tier: 'buff', ico: '🔮', modes: Z, desc: 'Your starting weapons are already upgraded.' },
        { k: 'grenadeResupply', lbl: 'Grenade Resupply', cat: 'weapons', tier: 'buff', ico: '💣', modes: ALL, desc: 'Gain one grenade every 20 seconds.' },
        { k: 'ironWill', lbl: 'Iron Will', cat: 'body', tier: 'buff', ico: '🛡', modes: ALL, desc: 'You take half damage from everything.' },
        { k: 'fragileBody', lbl: 'Fragile', cat: 'body', tier: 'challenge', ico: '🩹', modes: ALL, desc: 'You take double damage from everything.' },
        { k: 'oneHp', lbl: 'One HP Hero', cat: 'body', tier: 'challenge', ico: '☠️', modes: ALL, desc: 'You have 1 HP and no armor. One mistake ends it.' },
        { k: 'tankPlayer', lbl: 'Tank', cat: 'body', tier: 'buff', ico: '🦾', modes: ALL, desc: 'You have 3x max health.' },
        { k: 'regenBoost', lbl: 'Rapid Regen', cat: 'body', tier: 'buff', ico: '✚', modes: ALL, desc: 'Health regenerates 3x faster.' },
        { k: 'bleedOut', lbl: 'Bleed Out', cat: 'body', tier: 'challenge', ico: '🩸', modes: ALL, desc: 'You slowly lose health while above 25 HP.' },
        { k: 'secondWind', lbl: 'Second Wind', cat: 'body', tier: 'buff', ico: '🌬', modes: ALL, desc: 'Once per match, dropping below 20% instantly refills your health.' },
        { k: 'slowPlayer', lbl: 'Heavy Boots', cat: 'body', tier: 'challenge', ico: '🥾', modes: ALL, desc: 'You move at 70% speed.' },
        { k: 'adrenalineKills', lbl: 'Adrenaline', cat: 'body', tier: 'buff', ico: '⚡', modes: ALL, desc: 'Each kill gives a 3-second 1.35x speed burst.' },
        { k: 'allPerksStart', lbl: 'Start With 6 Perks', cat: 'body', tier: 'buff', ico: '🥤', modes: Z, desc: 'Begin with Quick Revive, Juggernog, Speed Cola, Double Tap, Stamin-Up and Deadshot.' },
        { k: 'fullArmorStart', lbl: 'Start With Full Armor', cat: 'body', tier: 'buff', ico: '🦺', modes: ALL, desc: 'Begin with every armor plate filled.' },
        { k: 'ultimateRush', lbl: 'Ultimate Rush', cat: 'body', tier: 'buff', ico: '🌟', modes: ALL, desc: 'Your ultimate charges 3x faster from kills, plus a slow passive charge.' },
        { k: 'tripleGold', lbl: 'Triple Points / Gold', cat: 'economy', tier: 'buff', ico: '💎', modes: Z, desc: 'All income is tripled.' },
        { k: 'halfGold', lbl: 'Half Points / Gold', cat: 'economy', tier: 'challenge', ico: '🪙', modes: Z, desc: 'All income is halved.' },
        { k: 'brokeStart', lbl: 'Broke Start', cat: 'economy', tier: 'challenge', ico: '🕳', modes: Z, desc: 'You begin with zero points or gold.' },
        { k: 'chainLightning', lbl: 'Chain Lightning', cat: 'world', tier: 'buff', ico: '🌩', modes: Z, desc: 'Every kill zaps the nearest zombie for heavy damage.' },
        { k: 'corpseBombs', lbl: 'Corpse Bombs', cat: 'world', tier: 'chaos', ico: '💣', modes: Z, desc: '25% of kills detonate and hurt nearby zombies.' },
        { k: 'frostKills', lbl: 'Frost Kills', cat: 'world', tier: 'buff', ico: '❄️', modes: Z, desc: 'Kills freeze zombies within 5 m for 2.5 seconds.' }
    ];

    const CAT_MAP_BY_MODE = {
        zombies: { horde: 'zm_mutations', behavior: 'zm_mutations', boss: 'zm_rounds', weapons: 'zm_arsenal', body: 'zm_perks', economy: 'zm_powerups', world: 'zm_rituals' },
        mp: { weapons: 'mp_gunplay', body: 'mp_tactical', horde: 'mp_bots', behavior: 'mp_bots', boss: 'mp_duels', economy: 'mp_objectives', world: 'mp_arena' },
        td: { horde: 'td_siege', behavior: 'td_siege', boss: 'td_siege', weapons: 'td_arsenal', body: 'td_tactics', economy: 'td_economy', world: 'td_magic' }
    };

    const CATALOG = BO.ModeModifiersCatalog || { CATEGORIES: [], DEFS: [], BUNDLES: {} };
    const CATEGORIES = BASE_CATEGORIES.concat(CATALOG.CATEGORIES || []);
    const DEFS = CORE_DEFS.concat(CATALOG.DEFS || [], BO.ReactiveModifiers.definitions);
    const DEF_MAP = {};
    DEFS.forEach((d) => { DEF_MAP[d.k] = d; });

    /* ---------------- Starting Weapon Protocols ---------------- */
    const PROTOCOLS = [
        { id: 'custom', name: 'Custom Class', icon: '🎖', desc: 'Your selected Create-a-Class loadout.' },
        { id: 'classic', name: 'Classic Pistol', icon: '🔫', desc: 'Only an M1911 and the standard 500 points. The purist start.' },
        { id: 'pap_custom', name: 'Upgraded Custom', icon: '⚡', desc: 'Your custom class, both weapons Pack-a-Punched.' },
        { id: 'pap_classic', name: 'Upgraded Pistol', icon: '✨', desc: 'A single Pack-a-Punched M1911.' },
        { id: 'random_gun', name: 'Random Gun', icon: '🎲', desc: 'One random gun from the full armory, plus an M1911.' },
        { id: 'random_pair', name: 'Random Pair', icon: '🎰', desc: 'Two random guns. Could be great, could be awful.' },
        { id: 'box_roulette', name: 'Mystery Box Start', icon: '📦', desc: 'One random Mystery Box roll — wonder weapons included.' },
        { id: 'pistol_pair', name: 'Twin Pistols', icon: '🤠', desc: 'Two random pistols.' },
        { id: 'rifleman', name: 'Rifleman', icon: '🪖', desc: 'M4A1 with an M1911 sidearm.' },
        { id: 'smg_runner', name: 'SMG Runner', icon: '🏃', desc: 'Vector and MP7 for fast, close fighting.' },
        { id: 'shotgun_rush', name: 'Shotgun Rush', icon: '💥', desc: 'AA-12 and Model 1887.' },
        { id: 'sniper_duo', name: 'Marksman', icon: '🎯', desc: 'Intervention with a Desert Eagle backup.' },
        { id: 'lmg_fortress', name: 'Fortress', icon: '🛡', desc: 'M249 and a Python revolver.' },
        { id: 'demolition', name: 'Demolition', icon: '🚀', desc: 'RPG-7 with an M1911.' },
        { id: 'minigun', name: 'Minigun', icon: '🌪', desc: 'Just the minigun. Spin it up.' },
        { id: 'gold_rush', name: 'Golden Gun', icon: '🏆', desc: 'A single golden Desert Eagle.' },
        { id: 'wonder_start', name: 'Ray Gun Start', icon: '🛸', desc: 'Ray Gun plus an M1911.' },
        { id: 'wonder_random', name: 'Random Wonder', icon: '🔮', desc: 'A random wonder weapon plus an M1911.' },
        { id: 'melee_master', name: 'Blade Master', icon: '⚔️', desc: 'Katana and tomahawk. No guns.' },
        { id: 'knife_only', name: 'Knife Only', icon: '🔪', desc: 'Just a combat knife. Earn everything else.' }
    ];

    const MULT_KEYS = new Set([
        'perkPriceMult', 'enemyDmgMult', 'enemySpeedMult', 'enemyHpMult', 'bossHpMult',
        'boxPriceMult', 'papPriceMult', 'dropRateMult', 'powerupDurMult', 'suppliesMult',
        'ultKillMult', 'spawnDelayMult', 'headshotMult', 'fortPriceMult', 'wallHpMult',
        'towerFireRateMult', 'towerDmgMult', 'swapSpeedMult', 'currencyMult', 'enemySizeMult',
        'pistolMult', 'rifleMult', 'recoilMult', 'spreadMult', 'fireRateMult', 'flatDmgMult',
        'adsDmgMult', 'hipDmgMult', 'explosionMult', 'vsBossDmgMult', 'bossAttackMult',
        'movingDmgMult', 'fullHpDmgMult', 'lowHpDmgMult', 'lowHpSpeedMult', 'regenMult',
        'streakChargeMult', 'streakPowerMult', 'xpMult', 'slideSpeedMult', 'gravityMult',
        'speedMult', 'airborneDmgMult', 'slideDmgMult', 'jumpMult', 'reloadMult',
        'cqbRoFMult', 'smgDmgMult', 'pistolDmgMult', 'shotgunMult', 'objRateMult',
        'respawnDelayMult', 'scoreMult', 'hsXpMult', 'lateMatchDmg', 'botHpMult',
        'botReactionMult', 'botSpeedMult', 'botDmgMult', 'botNadeFreq', 'botCountMult',
        'reserveMult', 'meleeMult', 'primaryDmgMult', 'sniperMult', 'closeDmgMult',
        'farDmgMult', 'incomingMult', 'lowMagDmgMult', 'maxHpMult', 'maxArmorMult',
        'heartHpMult', 'tdRepairMult', 'turretDmgMult', 'turretFireRateMult',
        'turretRangeMult', 'wallIncomingMult', 'deployCostMult', 'trapDmgMult', 'aegisHealMult',
        'tdShopMult', 'waveGoldMult', 'highGroundReloadMult', 'highGroundHsMult',
        'groundFloorDmg', 'groundFloorSpeed', 'highGroundGoldMult', 'gunZombiePctMult',
        'wallDmgTakenMult', 'medHealMult', 'lmgMult', 'lmgRoFMult', 'launcherMult',
        'minigunMult', 'pistolRoFMult', 'supplyIntervalMult', 'supplyGoldMult',
        'heartLowDmgMult', 'roundScaleSoften'
    ]);

    const MIN_KEYS = new Set([
        'everyNthShot', 'boxWonderCadence', 'hitGoldCadence', 'earlyExfil',
        'everyNthKillExplode', 'cryoPulseInterval', 'arcPulseInterval', 'grenadeInterval',
        'tactInterval', 'lightningStrikeInterval', 'keepLightningSec', 'tdIntermissionSec',
        'cycleGunEveryKills', 'playerKillNova'
    ]);

    function cfgFor(id) {
        const spec = BO.WeaponsData.get(id);
        return {
            id,
            camo: 'default',
            attachments: {
                optic: spec && spec.modelSpec && spec.modelSpec.defaultScope ? 'sniper_scope' : 'iron',
                muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock'
            }
        };
    }

    function weaponExists(id) {
        return !!(BO.WeaponsData.WEAPONS && BO.WeaponsData.WEAPONS[id]);
    }

    function listByCategory(cat) {
        return Object.values(BO.WeaponsData.WEAPONS).filter((w) => w.category === cat).map((w) => w.id);
    }

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    class ModifierSystem {
        constructor() {
            this.CATEGORIES = CATEGORIES;
            this.DEFS = DEFS;
            this.PROTOCOLS = PROTOCOLS;
            this._fxCacheKey = '';
            this._fxCacheVal = {};
            this._reset();
        }

        _reset() {
            this.spawnCount = 0;
            this.killCount = 0;
            this.shotCount = 0;
            this.comboHits = 0;
            this.comboUntil = 0;
            this.secondWindUsed = false;
            this.bailoutUsed = false;
            this.adrenalineTimer = 0;
            this.swapBuffTimer = 0;
            this.stationarySec = 0;
            this.grenadeTimer = 20;
            this.tactTimer = 18;
            this.cryoTimer = 20;
            this.arcTimer = 15;
            this.keepLightningTimer = 12;
            this.mpLightningTimer = 16;
            this.matchClock = 0;
            this.lastDamagedAt = -999;
            this.zombieTickAccum = 0;
            this.crankedTimer = 0;
        }

        defsForMode(mode) { return DEFS.filter((d) => d.modes.includes(mode)); }
        forMode(mode) { return this.defsForMode(mode); }

        categoriesForMode(mode) {
            const dedicated = (CATALOG.CATEGORIES || []).filter((c) => c.mode === mode);
            if (dedicated.length) return [...dedicated, { id: 'reactions', name: 'Triggered effects', icon: '↯', col: '#a78bfa' }];
            const defs = this.defsForMode(mode);
            return CATEGORIES.filter((c) => defs.some((d) => d.cat === c.id));
        }

        categoryOf(def, mode) {
            if (!def) return 'horde';
            if (def.cat && (def.cat.startsWith('zm_') || def.cat.startsWith('mp_') || def.cat.startsWith('td_'))) {
                return def.cat;
            }
            const map = CAT_MAP_BY_MODE[mode];
            return (map && map[def.cat]) || def.cat;
        }

        bundlesForMode(mode) {
            return (CATALOG.BUNDLES && CATALOG.BUNDLES[mode]) || [];
        }

        get(k) { return DEF_MAP[k] || BO.ReactiveModifiers.get(k); }
        getProtocol(id) { return PROTOCOLS.find((p) => p.id === id) || PROTOCOLS[0]; }

        countActive(mods, mode) {
            if (!mods) return 0;
            return Object.keys(mods).filter((k) => mods[k] && this.get(k)?.modes.includes(mode)).length;
        }

        /** The current match's modifier object (works in every mode). */
        active() {
            const m = BO.State && BO.State.activeMode;
            if (m === 'td' && BO.TowerDefenseMode) return BO.TowerDefenseMode.modifiers || {};
            if (m === 'zombies' && BO.ZombiesMode) return BO.ZombiesMode.modifiers || {};
            if (m === 'mp' && BO.MPMode && BO.MPMode.customRules) return BO.MPMode.customRules.mods || {};
            return {};
        }

        has(key) {
            const mods = this.active();
            return !!(mods && mods[key]);
        }

        fx(mods = this.active(), mode = BO.State && BO.State.activeMode) {
            if (!mods || typeof mods !== 'object') return {};
            const activeKeys = [];
            for (const k in mods) if (mods[k]) activeKeys.push(k);
            const sig = (mode || 'any') + '|' + activeKeys.sort().join(',');
            if (sig === this._fxCacheKey) return this._fxCacheVal;

            const out = {};
            for (const k of activeKeys) {
                const def = DEF_MAP[k];
                if (!def || !def.fx) continue;
                if (mode && def.modes && !def.modes.includes(mode)) continue;
                for (const [fk, fv] of Object.entries(def.fx)) {
                    if (typeof fv === 'boolean') {
                        out[fk] = out[fk] || fv;
                    } else if (typeof fv === 'number') {
                        if (MULT_KEYS.has(fk)) {
                            out[fk] = (out[fk] !== undefined ? out[fk] : 1) * fv;
                        } else if (MIN_KEYS.has(fk)) {
                            out[fk] = out[fk] !== undefined ? Math.min(out[fk], fv) : fv;
                        } else if (fk === 'gunZombiePctOverride') {
                            out[fk] = fv;
                        } else {
                            out[fk] = (out[fk] || 0) + fv;
                        }
                    }
                }
            }
            this._fxCacheKey = sig;
            this._fxCacheVal = out;
            return out;
        }

        fxActive() { return this.fx(this.active(), BO.State && BO.State.activeMode); }

        /* ---------------- Match start ---------------- */
        startCurrency(mods, base) {
            if (mods && mods.brokeStart) return 0;
            const fx = this.fx(mods);
            return Math.max(0, Math.round(base + (fx.bonusStartCurrency || 0)));
        }

        applyPlayerStart(mods, mode) {
            this._reset();
            const P = BO.Player;
            if (!P || !mods) return;
            const fx = this.fx(mods, mode);

            if (mods.allPerksStart && mode !== 'mp' && !mods.noPerks && P.zombiePerks) {
                ['quick_revive', 'juggernog', 'speed_cola', 'double_tap', 'stamin_up', 'deadshot'].forEach((pk) => P.zombiePerks.add(pk));
                if (P.applyPerkStats) P.applyPerkStats();
                P.hp = P.maxHp;
            }
            if (mods.tankPlayer) { P.maxHp = Math.round(P.maxHp * 3); P.hp = P.maxHp; }
            if (fx.maxHpMult && fx.maxHpMult !== 1) {
                P.maxHp = Math.max(10, Math.round(P.maxHp * BO.Math.clamp(fx.maxHpMult, 0.2, 4)));
                P.hp = Math.min(P.hp, P.maxHp);
            }
            if (fx.bonusMaxHp) {
                P.maxHp += fx.bonusMaxHp;
                P.hp = P.maxHp;
            }
            if (fx.maxArmorMult && fx.maxArmorMult !== 1) {
                P.maxArmor = Math.max(0, Math.round(P.maxArmor * fx.maxArmorMult));
                P.armor = Math.min(P.armor, P.maxArmor);
            }
            if (fx.bonusMaxArmor) {
                P.maxArmor += fx.bonusMaxArmor;
                P.armor = P.maxArmor;
            }
            if (fx.disableArmor || mods.oneHp) {
                P.armor = 0; P.maxArmor = 0; P.armorReservePlates = 0;
            }
            if (mods.oneHp) {
                P.maxHp = 1; P.hp = 1;
            }
            if ((mods.fullArmorStart || fx.startPlates) && !mods.oneHp && !fx.disableArmor && P.maxArmor > 0) {
                P.armor = P.maxArmor;
                if (fx.startPlates) P.armorReservePlates = Math.max(P.armorReservePlates || 0, fx.startPlates);
            }
            if (fx.bonusSelfRevives && mode === 'zombies') {
                P.selfRevives = (P.selfRevives || 1) + fx.bonusSelfRevives;
            }
            if (fx.zeroSelfRevives && mode === 'zombies') {
                P.selfRevives = 0;
            }
            if (fx.disableThrowables) {
                P.lethalCount = 0;
                P.tacticalCount = 0;
            }
            if (fx.startFullUlt) {
                P.ultimateCharge = 1.0;
            }
            if (mods.startPaP && mode !== 'mp' && P.weapons) {
                P.weapons = P.weapons.map((w) => (w && !w.isPaP && w.stats.kind !== 'melee') ? P._createWeaponInstance(w.cfg, 1) : w);
                if (P.rebuildViewmodel) P.rebuildViewmodel();
            }
            if (fx.reserveMult && fx.reserveMult !== 1 && P.weapons) {
                P.weapons.forEach((w) => {
                    if (w && w.stats && w.stats.reserveMax) {
                        w.reserve = Math.round(w.reserve * fx.reserveMult);
                    }
                });
            }
            if (mods.ammoScarcity && P.weapons) {
                P.weapons.forEach((w) => { if (w) w.reserve = Math.floor(w.reserve * 0.5); });
            }
            if (fx.grenadeInterval) this.grenadeTimer = fx.grenadeInterval;
            if (fx.tactInterval) this.tactTimer = fx.tactInterval;
            if (fx.cryoPulseInterval) this.cryoTimer = fx.cryoPulseInterval;
            if (fx.arcPulseInterval) this.arcTimer = fx.arcPulseInterval;
            if (fx.keepLightningSec) this.keepLightningTimer = fx.keepLightningSec;
            if (fx.lightningStrikeInterval) this.mpLightningTimer = fx.lightningStrikeInterval;
        }

        /** Replace the player's starting weapons with a protocol's loadout. */
        applyStartProtocol(id, mode) {
            const P = BO.Player;
            if (!P || !id || id === 'custom') return;
            const guns = Object.values(BO.WeaponsData.WEAPONS).filter((w) => w.kind === 'gun').map((w) => w.id);
            const magic = Object.values(BO.WeaponsData.WEAPONS).filter((w) => w.kind === 'magic').map((w) => w.id);
            let list = null;
            let papTier = 0;
            switch (id) {
                case 'classic': list = ['m1911']; break;
                case 'pap_classic': list = ['m1911']; papTier = 1; break;
                case 'pap_custom':
                    P.weapons = P.weapons.map((w) => (w && w.stats.kind !== 'melee') ? P._createWeaponInstance(w.cfg, 1) : w);
                    break;
                case 'random_gun': list = [pick(guns), 'm1911']; break;
                case 'random_pair': {
                    const a = pick(guns);
                    let b = pick(guns);
                    if (b === a) b = pick(guns);
                    list = a === b ? [a] : [a, b];
                    break;
                }
                case 'box_roulette': {
                    let rolled = null;
                    try { rolled = BO.WeaponsData.rollMysteryBox ? BO.WeaponsData.rollMysteryBox() : null; } catch (e) { rolled = null; }
                    const rid = rolled && (rolled.id || rolled);
                    list = [weaponExists(rid) ? rid : pick(guns.concat(magic))];
                    break;
                }
                case 'pistol_pair': {
                    const pistols = listByCategory('Pistol');
                    const a = pick(pistols);
                    const rest = pistols.filter((p) => p !== a);
                    list = [a, rest.length ? pick(rest) : a];
                    break;
                }
                case 'rifleman': list = ['m4a1', 'm1911']; break;
                case 'smg_runner': list = ['vector_kriss', 'mp7_navy']; break;
                case 'shotgun_rush': list = ['aa12', 'model_1887_mw2']; break;
                case 'sniper_duo': list = ['intervention', 'deagle']; break;
                case 'lmg_fortress': list = ['m249', 'python_magnum']; break;
                case 'demolition': list = ['rpg7_warhead', 'm1911']; break;
                case 'minigun': list = ['minigun_death']; break;
                case 'gold_rush': list = ['gold_deagle_cod4']; break;
                case 'wonder_start': list = ['raygun', 'm1911']; break;
                case 'wonder_random': list = [pick(magic.filter((m) => m !== 'megaman_buster')), 'm1911']; break;
                case 'melee_master': list = ['katana_carbon', 'tomahawk_axe']; break;
                case 'knife_only': list = ['combat_knife']; break;
                default: break;
            }
            if (list) {
                const valid = list.filter(weaponExists);
                if (valid.length) {
                    P.weapons = valid.map((wid) => P._createWeaponInstance(cfgFor(wid), papTier));
                }
            }
            P.activeSlot = 0;
            P.reloading = false;
            if (P.rebuildViewmodel) P.rebuildViewmodel();
        }

        /* ---------------- Spawning ---------------- */
        tweakSpawnOpts(mods, opts, ctx = {}) {
            if (!mods || !opts) return opts;
            const round = ctx.round || 1;
            const isBoss = !!(ctx.isBoss || (opts.spec && opts.spec.isBoss));
            const fx = this.fx(mods);
            this.spawnCount++;
            let hp = opts.hp || 100;
            let speed = opts.speed || 2;
            let dmg = opts.damage || 20;
            let size = opts.sizeMult || 1;

            if (mods.doubleZombieHp) hp *= 2;
            if (mods.tripleZombieHp) hp *= 3;
            if (fx.enemyHpMult) hp *= fx.enemyHpMult;
            if (mods.rampingHp) hp *= 1 + 0.10 * Math.max(0, round - 1);
            if (fx.extraRoundHp) hp *= 1 + fx.extraRoundHp * Math.max(0, round - 1);
            if (fx.roundScaleSoften && round > 1) {
                hp /= 1 + Math.max(0, (1 - fx.roundScaleSoften) * Math.min(2.0, (round - 1) * 0.04));
            }
            if (mods.slowZombies) speed *= 0.6;
            if (mods.snailZombies) speed *= 0.35;
            if (fx.enemySpeedMult) speed *= fx.enemySpeedMult;
            if (fx.lunarPolarity && round % 2 === 0) speed *= 1.35;
            if (mods.rampingSpeed) speed *= Math.min(2, 1 + 0.03 * Math.max(0, round - 1));
            if (fx.extraRoundSpd) speed *= Math.min(2.2, 1 + fx.extraRoundSpd * Math.max(0, round - 1));
            if (mods.hardHitters && dmg < 99999) dmg *= 2;
            if (mods.softHitters && dmg < 99999) dmg *= 0.5;
            if (fx.enemyDmgMult && dmg < 99999) dmg *= fx.enemyDmgMult;
            if (isBoss && fx.bossAttackMult && dmg < 99999) dmg *= fx.bossAttackMult;
            if (mods.randomSizes) {
                const s = 0.55 + Math.random() * 1.15;
                size *= s;
                hp *= 0.6 + s * 0.4;
            }
            if (fx.enemySizeMult) size *= fx.enemySizeMult;
            if (fx.rushConvertPct && !isBoss && Math.random() < fx.rushConvertPct) {
                size *= 0.72;
                speed *= 1.45;
                hp *= 0.65;
            }
            if (isBoss && mods.hulkingBosses) { hp *= 2; size *= 1.3; }
            if (isBoss && mods.fragileBosses) hp *= 0.5;
            if (isBoss && fx.bossHpMult) hp *= fx.bossHpMult;
            if (!isBoss && mods.eliteEvery10 && this.spawnCount % 10 === 0) {
                hp *= 3; size *= 1.35; opts._elite = true;
            }
            if (!isBoss && mods.allSplitFour && !opts.isSplitChild) opts.splitCount = 4;
            if (fx.disableSplitters) opts.splitCount = 0;
            if (mods.allJumpers) opts.jumpChance = 1.0;
            if (fx.jumpChanceBonus) opts.jumpChance = Math.min(1, (opts.jumpChance || 0.08) + fx.jumpChanceBonus);
            if (mods.paperZombies) hp = 1;

            opts.hp = Math.max(1, Math.round(hp));
            opts.speed = Math.min(14, speed);
            opts.damage = Math.max(1, Math.round(dmg));
            opts.sizeMult = BO.Math.clamp(size, 0.35, 3.2);
            return opts;
        }

        afterSpawn(mods, ent) {
            if (!mods || !ent) return ent;
            const fx = this.fx(mods);
            if (mods.titaniumHorde) ent.defense = Math.min(0.80, (ent.defense || 0) + 0.55);
            if (mods.paperZombies) { ent.defense = 0; ent.maxHp = 1; ent.hp = 1; }
            if (fx.disableSplitters) ent.splitCount = 0;
            ent._baseSpeed = ent.speed;
            return ent;
        }

        /* ---------------- Weapons & Combat ---------------- */
        onWeaponShot(weaponInst) {
            this.triggerReaction('shot');
            const fx = this.fxActive();
            this.shotCount++;
            const P = BO.Player;
            if (fx.shotHpCost && P && P.alive && P.hp > 20) {
                P.hp = Math.max(20, P.hp - fx.shotHpCost);
            }
        }

        onSwapWeapon() {
            this.triggerReaction('swap');
            const fx = this.fxActive();
            if (fx.swapFireRateBuff) this.swapBuffTimer = 2.5;
        }

        onReload(weaponInst) {
            const fx = this.fxActive();
            const P = BO.Player;
            if (!P || !P.alive) return;
            if (fx.reloadBlast) {
                const pos = P.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
                if (BO.FX?.spawnExplosion) BO.FX.spawnExplosion(pos, 4.2, 0x38bdf8);
                if (BO.Combat?.onExplodeAt) BO.Combat.onExplodeAt(pos, 4.5, fx.reloadBlast, 'player', false, 0, 'reload_blast');
            }
        }

        onSlide() {
            this.triggerReaction('slide');
            const fx = this.fxActive();
            const P = BO.Player;
            if (!P || !P.alive) return;
            if (fx.slideReloadPct && P.activeWeapon && P.activeWeapon.stats.kind === 'gun') {
                const aw = P.activeWeapon;
                const need = aw.stats.magSize - aw.mag;
                const add = Math.min(aw.reserve, Math.ceil(need * fx.slideReloadPct));
                if (add > 0) { aw.mag += add; aw.reserve -= add; }
            }
            if ((fx.slideShock || fx.slideRamDmg) && BO.Combat?.onExplodeAt) {
                const dmg = fx.slideShock || fx.slideRamDmg;
                const pos = P.pos.clone().add(new THREE.Vector3(0, 0.8, 0));
                if (BO.FX?.spawnParticles) BO.FX.spawnParticles(pos, 12, 0x38bdf8, 5, 1.5, 0.4, 0.6);
                BO.Combat.onExplodeAt(pos, 3.6, dmg, 'player', false, 0, 'slide_impact');
            }
        }

        fireRateMult() {
            const fx = this.fxActive();
            let m = fx.fireRateMult || 1;
            const P = BO.Player;
            const w = P && P.activeWeapon;
            const st = (w && w.stats) || {};
            const cat = String(st.category || '');
            if (w && w.isPaP && fx.papFireRateBonus) m *= 1 + fx.papFireRateBonus;
            if (this.swapBuffTimer > 0 && fx.swapFireRateBuff) m *= 1 + fx.swapFireRateBuff;
            if (fx.cqbRoFMult && (cat === 'SMG' || cat === 'Pistol')) m *= fx.cqbRoFMult;
            if (fx.lmgRoFMult && cat === 'LMG') m *= fx.lmgRoFMult;
            if (fx.pistolRoFMult && cat === 'Pistol') m *= fx.pistolRoFMult;
            if (fx.underdogFury && P && P.hp < P.maxHp * 0.35) m *= 1.25;
            return m;
        }

        reloadMult() {
            const fx = this.fxActive();
            const P = BO.Player;
            let m = fx.reloadMult || 1;
            if (this.crankedTimer > 0) m *= 0.5;
            if (fx.highGroundReloadMult && P && P.pos.y > 2.2) m *= fx.highGroundReloadMult;
            return Math.max(0.25, m);
        }

        recoilMult() {
            const fx = this.fxActive();
            let m = fx.recoilMult || 1;
            const P = BO.Player;
            if (P && P.activeWeapon && P.activeWeapon.isPaP && fx.papFireRateBonus) m *= 0.65;
            return m;
        }

        spreadMult() {
            const fx = this.fxActive();
            let m = fx.spreadMult || 1;
            const P = BO.Player;
            if (fx.crouchSpreadMult && P && P.crouching) m *= fx.crouchSpreadMult;
            return m;
        }

        /** Returns modified damage, or 0 to block the hit entirely. */
        outgoingDamage(mods, dmg, ctx = {}) {
            if (!mods) return dmg;
            const fx = this.fx(mods);
            const P = BO.Player;
            const w = ctx.weaponInst;
            const st = (w && w.stats) || {};
            const isMelee = st.kind === 'melee' || (w && w.cfg && w.cfg.id === 'knife');
            const isMagic = st.kind === 'magic';
            const cat = String(st.category || '');
            const isHead = ctx.hitbox === 'head';
            const target = ctx.target;
            const dist = ctx.distance || (target && target.pos && P ? P.pos.distanceTo(target.pos) : 12);

            if (mods.meleeOnly || fx.meleeOnly) {
                if (!isMelee) return 0;
            }
            if (mods.noMelee && isMelee) return 0;
            if (mods.bodyshotsOnly && isHead) return 0;

            let d = dmg;
            if (mods.pistolPower && cat === 'Pistol') d *= 3;
            if (mods.shotgunSurgeon && cat === 'Shotgun') d *= 2;
            if (mods.rifleman && cat === 'Assault Rifle') d *= 1.75;
            if (mods.smgSpray && cat === 'SMG') d *= 1.75;
            if (mods.lmgSuppress && cat === 'LMG') d *= 1.75;
            if (mods.doublePlayerDmg) d *= 2;
            if (mods.weakPlayerDmg) d *= 0.5;
            if (mods.thickSkulls && isHead) d *= 0.5;
            if (mods.glassJaws && isHead) d *= 3;
            if (mods.bossSlayer && target && target.isBoss) d *= 3;

            // ModeModifiersCatalog multiplicative/bonus rules
            if (fx.flatDmgMult) d *= fx.flatDmgMult;
            if (fx.pistolDmgMult && cat === 'Pistol') d *= fx.pistolDmgMult;
            if (fx.pistolMult && cat === 'Pistol') d *= fx.pistolMult;
            if (fx.shotgunMult && cat === 'Shotgun') d *= fx.shotgunMult;
            if (fx.rifleMult && (cat === 'Assault Rifle' || cat === 'Sniper Rifle' || cat === 'Marksman Rifle')) d *= fx.rifleMult;
            if (fx.smgDmgMult && cat === 'SMG') d *= fx.smgDmgMult;
            if (fx.lmgMult && cat === 'LMG') d *= fx.lmgMult;
            if (fx.sniperMult && (cat === 'Sniper Rifle' || cat === 'Marksman Rifle')) d *= fx.sniperMult;
            if (fx.magicDmgMult && isMagic) d *= fx.magicDmgMult;
            if (fx.launcherMult && (cat === 'Launcher' || st.explosiveRadius)) d *= fx.launcherMult;
            if (fx.minigunMult && w?.cfg?.id === 'minigun_death') d *= fx.minigunMult;
            if (fx.primaryDmgMult && cat !== 'Pistol' && !isMelee) d *= fx.primaryDmgMult;
            if (fx.meleeMult && isMelee) d *= fx.meleeMult;
            if (fx.meleeFlat && isMelee) d = Math.max(d, fx.meleeFlat);

            if (isHead && fx.headshotMult) d *= fx.headshotMult;
            if (isHead && fx.headshotBonus) d *= 1 + fx.headshotBonus;
            if (!isHead && fx.bodyDmgMult) d *= fx.bodyDmgMult;
            if (!isHead && fx.bodyDmgBonus) d *= 1 + fx.bodyDmgBonus;

            // Situational & positional bonuses
            if (fx.perkDmgStack && P?.zombiePerks) d *= 1 + P.zombiePerks.size * fx.perkDmgStack;
            if (fx.roundWeaponRamp && w && !w.isPaP) {
                const r = BO.ZombiesMode?.round || BO.TowerDefenseMode?.wave || 1;
                d *= 1 + Math.min(1.2, (r - 1) * fx.roundWeaponRamp);
            }
            if (fx.lunarPolarity) {
                const r = BO.ZombiesMode?.round || 1;
                if (r % 2 === 1) d *= 1.50;
            }
            if (fx.papBossBonus && w?.isPaP && target?.isBoss) d *= 1 + fx.papBossBonus;
            if (fx.vsBossDmgMult && target?.isBoss) d *= fx.vsBossDmgMult;
            if (fx.explosiveWeakness && st.explosiveRadius) d *= fx.explosiveWeakness;
            if (fx.highGroundDmg && P && P.pos.y > 2.2) d *= 1 + fx.highGroundDmg;
            if (isHead && fx.highGroundHsMult && P && P.pos.y > 2.2) d *= fx.highGroundHsMult;
            if (fx.groundFloorDmg && P && P.pos.y < 1.2) d *= fx.groundFloorDmg;
            if (fx.airborneDmgMult && P && !P.grounded) d *= fx.airborneDmgMult;
            if (fx.slideDmgMult && P && P.sliding) d *= fx.slideDmgMult;
            if (fx.adsDmgMult && P && P.adsHeld) d *= fx.adsDmgMult;
            if (fx.hipDmgMult && P && !P.adsHeld) d *= fx.hipDmgMult;
            if (fx.closeDmgMult && dist <= 10) d *= fx.closeDmgMult;
            if (fx.farDmgMult && dist >= 18) d *= fx.farDmgMult;
            if (fx.lowHpDmgMult && P && P.hp < P.maxHp * 0.45) d *= fx.lowHpDmgMult;
            if (fx.fullHpDmgMult && P && P.hp >= P.maxHp * 0.95) d *= fx.fullHpDmgMult;
            if (fx.movingDmgMult && P && Math.hypot(P.vel.x, P.vel.z) > 4.2) d *= fx.movingDmgMult;
            if (fx.stationaryDmgRamp && this.stationarySec > 0.2) d *= 1 + Math.min(fx.stationaryDmgRamp, this.stationarySec * 0.25);
            if (fx.openerBuff && this.matchClock <= 30) d *= 1.25;
            if (fx.heartLowDmgMult && BO.TowerDefenseMode && BO.TowerDefenseMode.heartHp < BO.TowerDefenseMode.heartMaxHp * 0.6) {
                d *= fx.heartLowDmgMult;
            }
            if (fx.closeHeartVulnerability && target && target.pos && target.pos.length() < 16) d *= 1 + fx.closeHeartVulnerability;
            if (fx.markVulnTurret && target) target._tdMarked = true;

            if (fx.everyNthShot && this.shotCount > 0 && this.shotCount % fx.everyNthShot === 0) {
                d *= (fx.nthMult || 2.0);
            }
            if (fx.firstBulletMult && w && w.mag >= (w.stats.magSize - 1)) d *= fx.firstBulletMult;
            if (fx.lastBulletMult && w && w.mag <= 1) d *= fx.lastBulletMult;
            if (fx.lowMagDmgMult && w && w.stats.magSize > 1 && (w.mag / w.stats.magSize) <= 0.25) d *= fx.lowMagDmgMult;
            if (fx.comboRampDmg) {
                const now = performance.now();
                this.comboHits = now < this.comboUntil ? Math.min(6, this.comboHits + 1) : 1;
                this.comboUntil = now + 3000;
                d *= 1 + this.comboHits * fx.comboRampDmg;
            }

            // Crits
            if (mods.critChance && Math.random() < 0.15) d *= 3;
            if (fx.critChancePct && Math.random() < fx.critChancePct) d *= (fx.critMult || 2.5);

            // Elemental & special on-hit effects on zombies
            if (target && target.alive) {
                if (fx.autoChill && (cat === 'SMG' || cat === 'LMG' || fx.papElemental && this.shotCount % 2 === 0)) {
                    target.frozenTimer = Math.max(target.frozenTimer || 0, 1.8);
                }
                if (((cat === 'Shotgun' && fx.shotgunBurn) || (w?.isPaP && fx.papElemental && this.shotCount % 2 === 1)) && !target._burned) {
                    target.burnTimer = Math.max(target.burnTimer || 0, 3.0);
                    d *= 1 + (fx.shotgunBurn || 0.25);
                }
                if (fx.armorShred && target.defense > 0) target.defense = Math.max(0, target.defense - 0.15);
                if (fx.headshotRefund && isHead && w && w.stats.kind === 'gun') w.mag = Math.min(w.stats.magSize, w.mag + fx.headshotRefund);
                if (fx.sniperExplode && (cat === 'Sniper Rifle' || cat === 'Marksman Rifle') && target.pos && BO.Combat?.onExplodeAt) {
                    BO.Combat.onExplodeAt(target.pos.clone(), 3.0, fx.sniperExplode, 'player', false, 0, 'he_sniper');
                }
                if ((mods.executioner || fx.meleeExecutePct) && !target.isBoss && target.maxHp > 0) {
                    const pct = fx.meleeExecutePct && isMelee ? fx.meleeExecutePct : (mods.executioner ? 0.20 : 0);
                    if (pct > 0 && target.hp / target.maxHp < pct) d = Math.max(d, target.hp + 1);
                }
            }

            if (fx.lifesteal && P && P.alive) P.hp = Math.min(P.maxHp, P.hp + d * fx.lifesteal);
            if (fx.hitGoldCadence && this.shotCount % fx.hitGoldCadence === 0 && BO.TowerDefenseMode?.active) {
                BO.TowerDefenseMode.gold += 25;
            }
            if (fx.forceKnockback && target && target.pos && P) {
                const push = target.pos.clone().sub(P.pos).setY(0).normalize().multiplyScalar(fx.forceKnockback * 0.25);
                target.pos.add(push);
            }
            if (isHead && fx.headshotChain && BO.ZombiesMode?.active && target?.pos) {
                const list = BO.ZombiesMode.zombies || [];
                let nearZ = null; let minD = 6.5;
                for (const other of list) {
                    if (!other.alive || other === target) continue;
                    const dd = other.pos.distanceTo(target.pos);
                    if (dd < minD) { minD = dd; nearZ = other; }
                }
                if (nearZ) nearZ.takeDamage(Math.max(10, d * fx.headshotChain), 'head', false, null, 'arc');
            }
            if (fx.pistolChainShock && cat === 'Pistol' && target?.pos && BO.ZombiesMode?.active) {
                for (const other of (BO.ZombiesMode.zombies || [])) {
                    if (other.alive && other !== target && other.pos.distanceTo(target.pos) < 5) {
                        other.takeDamage(Math.max(12, d * fx.pistolChainShock), 'torso', false, null, 'arc');
                        break;
                    }
                }
            }
            return d;
        }

        /* ---------------- Kills ---------------- */
        onKill(mods, target, ctx = {}) {
            this.triggerReaction('kill', mods);
            if (!mods) return;
            const fx = this.fx(mods);
            this.killCount++;
            const P = BO.Player;
            const origin = target && target.pos;

            if (P && P.alive) {
                if (mods.killAmmo && P.activeWeapon && P.activeWeapon.stats.kind === 'gun') {
                    const aw = P.activeWeapon;
                    aw.reserve = Math.min(aw.stats.reserveMax, aw.reserve + Math.ceil(aw.stats.magSize * 0.25));
                }
                if (fx.killDirectChamber && P.activeWeapon && P.activeWeapon.stats.kind === 'gun') {
                    const aw = P.activeWeapon;
                    aw.mag = Math.min(aw.stats.magSize, aw.mag + fx.killDirectChamber);
                }
                if (fx.killFullReload && P.activeWeapon && P.activeWeapon.stats.kind === 'gun') {
                    P.activeWeapon.mag = P.activeWeapon.stats.magSize;
                }
                if (fx.killMagRefillChance && Math.random() < fx.killMagRefillChance && P.activeWeapon && P.activeWeapon.stats.kind === 'gun') {
                    const aw = P.activeWeapon;
                    aw.mag = Math.min(aw.stats.magSize, aw.mag + Math.ceil(aw.stats.magSize * 0.25));
                }
                if (mods.adrenalineKills) this.adrenalineTimer = 3.0;
                if (fx.killSpeedBurst) this.adrenalineTimer = Math.max(this.adrenalineTimer, 4.0);
                if (fx.killCranked) this.crankedTimer = fx.killCranked;
                if (mods.ultimateRush && P.addUltimateCharge) P.addUltimateCharge(10 * (fx.ultKillMult || 1));
                if (fx.ultBonusPerKill && P.addUltimateCharge) P.addUltimateCharge(fx.ultBonusPerKill);
                if (fx.killHeal) P.hp = Math.min(P.maxHp, P.hp + fx.killHeal);
                if (fx.killFullHeal) P.hp = P.maxHp;
                if (fx.killInstantRegen) P.regenDelay = 0;
                if (fx.killArmorRestore && P.maxArmor > 0) P.armor = Math.min(P.maxArmor, P.armor + fx.killArmorRestore);
                if (fx.killPlates && P.maxArmor > 0) P.armorReservePlates = (P.armorReservePlates || 0) + fx.killPlates;
                if (fx.armorEvery3Kills && this.killCount % 3 === 0 && P.maxArmor > 0) P.armor = P.maxArmor;
                if (fx.siphonChanceHp && Math.random() < fx.siphonChanceHp) {
                    P.hp = Math.min(P.maxHp, P.hp + 20);
                    if (P.maxArmor > 0) P.armor = Math.min(P.maxArmor, P.armor + 15);
                }
                if (fx.meleeCleave && ctx.isMelee && origin && ctx.list) {
                    for (const z of ctx.list) {
                        if (z.alive && z !== target && z.pos.distanceTo(origin) <= 3.6) z.takeDamage(fx.meleeCleave, 'torso', false, null, 'melee');
                    }
                }
                if (fx.cycleGunEveryKills && this.killCount % fx.cycleGunEveryKills === 0 && BO.WeaponsData?.WEAPONS) {
                    const pool = Object.values(BO.WeaponsData.WEAPONS).filter((w) => w.kind === 'gun');
                    if (pool.length) P.giveWeapon(pick(pool).id, false, false);
                }
            }

            if (fx.closeAcidBacklash && origin && P && P.alive && P.pos.distanceTo(origin) < 2.2) {
                P.hp = Math.max(1, P.hp - fx.closeAcidBacklash);
            }
            if ((mods.bountyHunter || fx.bossBounty) && target && target.isBoss && ctx.addCurrency) {
                const bonus = (mods.bountyHunter ? 2000 : 0) + (fx.bossBounty || 0);
                ctx.addCurrency(bonus);
                BO.Events.emit('hud:toast', { text: `BOUNTY COLLECTED +${bonus}`, color: '#fde047' });
            }
            if (fx.streakPtsEvery15 && this.killCount % 15 === 0 && ctx.addCurrency) {
                ctx.addCurrency(fx.streakPtsEvery15);
            }
            if (fx.killHealsWall && BO.TowerDefenseMode?.active) {
                for (const l of BO.TowerDefenseMode.layers || []) {
                    if (l.active && l.hp > 0 && l.hp < l.maxHp) { l.hp = Math.min(l.maxHp, l.hp + fx.killHealsWall); break; }
                }
            }
            if (fx.every5KillsXp && this.killCount % 5 === 0 && BO.Progression) {
                BO.Progression.grantPlayerXP(fx.every5KillsXp, 'Combo');
            }

            const list = ctx.list || [];
            if (!origin) return;
            if (mods.chainLightning) {
                let best = null; let bd = 9;
                for (const z of list) {
                    if (!z.alive || z === target) continue;
                    const d = z.pos.distanceTo(origin);
                    if (d < bd) { bd = d; best = z; }
                }
                if (best) {
                    if (BO.FX?.spawnTracer) BO.FX.spawnTracer(origin.clone().add(new THREE.Vector3(0, 1.2, 0)), best.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x7dd3fc, 0.05, 0.22);
                    best.takeDamage(Math.max(60, best.maxHp * 0.35), 'torso', false, null, 'explosive');
                }
            }
            if (mods.frostKills) {
                for (const z of list) {
                    if (z.alive && z !== target && z.pos.distanceTo(origin) <= 5) z.frozenTimer = Math.max(z.frozenTimer || 0, 2.5);
                }
                if (BO.FX?.spawnParticles) BO.FX.spawnParticles(origin.clone().add(new THREE.Vector3(0, 1, 0)), 16, 0x93c5fd, 6, 1.5, 0.5, 1.0);
            }
            if (fx.every15Dance && (this.killCount % 15 === 0 || target.isBoss) && BO.ZombiesMode?.triggerZombieDance) {
                BO.ZombiesMode.triggerZombieDance();
            }
            if ((mods.corpseBombs && ctx.explode && Math.random() < 0.25) ||
                (fx.everyNthKillExplode && ctx.explode && this.killCount % fx.everyNthKillExplode === 0) ||
                (fx.playerKillNova && ctx.explode && this.killCount % fx.playerKillNova === 0)) {
                const pt = (fx.playerKillNova && P ? P.pos : origin).clone().add(new THREE.Vector3(0, 1.0, 0));
                if (BO.FX?.spawnExplosion) BO.FX.spawnExplosion(pt, 4.5, 0xef4444);
                if (BO.Sound?.playExplosion) BO.Sound.playExplosion(0.4);
                ctx.explode(pt, 5.0, 165);
            }
        }

        /* ---------------- Incoming Damage & Economy ---------------- */
        triggerReaction(event, mods) {
            const active = BO.State.activeMode === 'survival' ? BO.SurvivalMode?.campaign?.options?.modifiers : (mods || this.active());
            BO.ReactiveModifiers.fire(event, active, BO.Player);
        }

        onTakeDamage(amount, attackerEntity) {
            this.lastDamagedAt = this.matchClock;
            const fx = this.fxActive();
            if (fx.counterShock && attackerEntity && attackerEntity.alive && attackerEntity.takeDamage) {
                attackerEntity.takeDamage(fx.counterShock, 'torso', false, null, 'arc');
            }
            if (fx.damagePointLoss && BO.ZombiesMode?.active) {
                BO.ZombiesMode.points = Math.max(0, BO.ZombiesMode.points - fx.damagePointLoss);
            }
        }

        priceMult(mods, kind) {
            const fx = this.fx(mods);
            let m = 1;
            if (kind === 'perk' && fx.perkPriceMult) m *= fx.perkPriceMult;
            if (kind === 'box' && fx.boxPriceMult) m *= fx.boxPriceMult;
            if (kind === 'pap' && fx.papPriceMult) m *= fx.papPriceMult;
            if (kind === 'fort' && fx.fortPriceMult) m *= fx.fortPriceMult;
            if (kind === 'td_shop' && fx.tdShopMult) m *= fx.tdShopMult;
            if (kind === 'td_dep' && fx.deployCostMult) m *= fx.deployCostMult;
            if (kind === 'td_repair' && fx.tdRepairMult) m *= fx.tdRepairMult;
            return Math.max(0.1, m);
        }

        currencyMult(mods, ctx = {}) {
            if (!mods) return 1;
            const fx = this.fx(mods);
            const P = BO.Player;
            let m = fx.currencyMult || 1;
            if (mods.tripleGold) m *= 3;
            if (mods.halfGold) m *= 0.5;
            if (fx.armoredGoldBonus && P && P.armor > 0) m *= 1 + fx.armoredGoldBonus;
            if (fx.highGroundGoldMult && P && P.pos.y > 2.2) m *= fx.highGroundGoldMult;
            if (fx.keepKillGoldBonus && ctx.pos && ctx.pos.length() < 16) m *= 1 + fx.keepKillGoldBonus;
            return m;
        }

        xpMult() { return this.fxActive().xpMult || 1; }
        scoreMult() { return this.fxActive().scoreMult || 1; }
        objRateMult() { return this.fxActive().objRateMult || 1; }
        wallHpMult(mods) { return this.fx(mods, 'td').wallHpMult || 1; }
        heartHpMult(mods) { return this.fx(mods, 'td').heartHpMult || 1; }
        wallDamageMult(mods) { return this.fx(mods, 'td').wallDmgTakenMult || this.fx(mods, 'td').wallIncomingMult || 1; }

        turretStatMult(mods) {
            const fx = this.fx(mods, 'td');
            return {
                fireRate: fx.turretFireRateMult || 1,
                dmg: fx.turretDmgMult || 1,
                range: fx.turretRangeMult || 1,
                cryo: !!fx.turretCryoSlow,
                burn: fx.turretBurnDmg || 0,
                chain: fx.turretChainDmg || 0,
                killHealsWall: fx.turretKillHealsWall || 0
            };
        }

        incomingDamageMult(ctx = {}) {
            const mods = this.active();
            const fx = this.fx(mods);
            const P = BO.Player;
            let m = fx.incomingMult || 1;
            if (mods.ironWill) m *= 0.5;
            if (mods.fragileBody) m *= 2;
            if (fx.movingResist && P && Math.hypot(P.vel.x, P.vel.z) > 4.2) m *= 1 - fx.movingResist;
            if (fx.centerResist && P && P.pos.length() < 12) m *= 1 - fx.centerResist;
            if (fx.highGroundResist && P && P.pos.y > 2.2) m *= 1 - fx.highGroundResist;
            return m;
        }

        regenMult() {
            const mods = this.active();
            const fx = this.fx(mods);
            if (fx.disableRegen) return 0;
            return (mods.regenBoost ? 3 : 1) * (fx.regenMult || 1);
        }

        speedMult() {
            const mods = this.active();
            const fx = this.fx(mods);
            const P = BO.Player;
            let m = fx.speedMult || 1;
            if (BO.Player?.mpPerks.includes('lightweight')) m *= 1.08;
            if (mods.slowPlayer) m *= 0.7;
            if (mods.adrenalineKills && this.adrenalineTimer > 0) m *= Math.max(1.35, fx.killSpeedBurst || 1.35);
            else if (this.adrenalineTimer > 0 && fx.killSpeedBurst) m *= fx.killSpeedBurst;
            if (this.crankedTimer > 0) m *= 1.45;
            if (fx.adsSpeedBonus && P && P.adsHeld) m *= 1 + fx.adsSpeedBonus;
            if (fx.lowHpSpeedMult && P && P.hp < P.maxHp * 0.45) m *= fx.lowHpSpeedMult;
            if (fx.groundFloorSpeed && P && P.pos.y < 1.2) m *= fx.groundFloorSpeed;
            if (fx.openerBuff && this.matchClock <= 30) m *= 1.30;
            return m;
        }

        jumpMult() { return this.fxActive().jumpMult || 1; }
        gravityMult() { return this.fxActive().gravityMult || 1; }

        tickPlayer(dt) {
            this.matchClock += dt;
            const mods = this.active();
            const fx = this.fx(mods);
            const P = BO.Player;
            if (!P || !P.alive) return;

            if (this.adrenalineTimer > 0) this.adrenalineTimer = Math.max(0, this.adrenalineTimer - dt);
            if (this.crankedTimer > 0) this.crankedTimer = Math.max(0, this.crankedTimer - dt);
            if (this.swapBuffTimer > 0) this.swapBuffTimer = Math.max(0, this.swapBuffTimer - dt);

            const horizSpd = Math.hypot(P.vel.x, P.vel.z);
            this.stationarySec = horizSpd < 0.8 ? this.stationarySec + dt : 0;

            if (mods.bleedOut && P.hp > 25) P.hp = Math.max(25, P.hp - 1.5 * dt);
            if (mods.secondWind && !this.secondWindUsed && P.maxHp > 1 && P.hp > 0 && P.hp < P.maxHp * 0.2) {
                this.secondWindUsed = true;
                P.hp = P.maxHp;
                BO.Events.emit('hud:banner', { title: 'SECOND WIND', sub: 'HEALTH FULLY RESTORED', color: '#4ade80' });
            }
            if ((mods.ultimateRush || fx.ultPassive) && P.addUltimateCharge) {
                P.addUltimateCharge((mods.ultimateRush ? 0.4 : 0) * dt + (fx.ultPassive || 0) * dt);
            }
            if (fx.movingRegenPerSec && horizSpd > 2.2) P.hp = Math.min(P.maxHp, P.hp + fx.movingRegenPerSec * dt);
            if (fx.centerHeal && P.pos.length() < 11) P.hp = Math.min(P.maxHp, P.hp + fx.centerHeal * dt);
            if (fx.edgeDangerDist && Math.hypot(P.pos.x, P.pos.z) > fx.edgeDangerDist && P.hp > 10) {
                P.hp = Math.max(10, P.hp - 4 * dt);
            }
            if (fx.armorRegenPerSec && P.maxArmor > 0 && (this.matchClock - this.lastDamagedAt) > 4.5) {
                P.armor = Math.min(P.maxArmor, P.armor + fx.armorRegenPerSec * dt);
            }
            if (fx.highGroundArmorRegen && P.maxArmor > 0 && P.pos.y > 2.2) {
                P.armor = Math.min(P.maxArmor, P.armor + fx.highGroundArmorRegen * dt);
            }
            if ((fx.centerAmmo && P.pos.length() < 11) || (fx.highGroundAmmoRegen && P.pos.y > 2.2)) {
                const aw = P.activeWeapon;
                if (aw && aw.stats.kind === 'gun' && Math.floor(this.matchClock * 4) !== Math.floor((this.matchClock - dt) * 4)) {
                    aw.reserve = Math.min(aw.stats.reserveMax, aw.reserve + 2);
                }
            }
            if (fx.wonderRegen) {
                const aw = P.activeWeapon;
                if (aw && aw.stats.kind === 'magic' && Math.floor(this.matchClock * fx.wonderRegen) !== Math.floor((this.matchClock - dt) * fx.wonderRegen)) {
                    aw.reserve = Math.min(aw.stats.reserveMax, aw.reserve + 1);
                }
            }
            if (mods.grenadeResupply || fx.grenadeInterval) {
                const interval = fx.grenadeInterval || 20;
                this.grenadeTimer -= dt;
                if (this.grenadeTimer <= 0) {
                    this.grenadeTimer = interval;
                    const cap = Math.max(2, (BO.AttachmentsData.LETHALS[P.lethalId] && BO.AttachmentsData.LETHALS[P.lethalId].count) || 2) + 2;
                    if (P.lethalCount < cap) {
                        P.lethalCount++;
                        BO.Events.emit('hud:toast', { text: '+1 GRENADE', color: '#38bdf8' });
                    }
                }
            }
            if (fx.tactInterval) {
                this.tactTimer -= dt;
                if (this.tactTimer <= 0) {
                    this.tactTimer = fx.tactInterval;
                    if (P.tacticalCount < 4) P.tacticalCount++;
                }
            }
        }

        tickMode(mode, dt, ctx = {}) {
            const fx = this.fx(this.active(), mode);
            const P = BO.Player;
            if (!P || !P.alive) return;
            const zombies = ctx.zombies || BO.ZombiesMode?.zombies || BO.TowerDefenseMode?.zombies || [];

            if (fx.sunfireAura && zombies.length) {
                for (const z of zombies) {
                    if (z.alive && z.pos.distanceTo(P.pos) <= 4.2) z.takeDamage(fx.sunfireAura * dt, 'torso', false, null, 'burn');
                }
            }
            if (fx.playerSlowAura && zombies.length) {
                for (const z of zombies) {
                    if (z.alive && z.pos.distanceTo(P.pos) <= 3.8) z.speed = Math.max(0.8, (z._baseSpeed || z.speed) * (1 - fx.playerSlowAura));
                }
            }
            if (fx.cryoPulseInterval && zombies.length) {
                this.cryoTimer -= dt;
                if (this.cryoTimer <= 0) {
                    this.cryoTimer = fx.cryoPulseInterval;
                    for (const z of zombies) if (z.alive && z.pos.distanceTo(P.pos) <= 9.5) z.frozenTimer = Math.max(z.frozenTimer || 0, 3.0);
                    if (BO.FX?.spawnParticles) BO.FX.spawnParticles(P.pos.clone().add(new THREE.Vector3(0, 1, 0)), 18, 0x93c5fd, 7, 1.5, 0.5, 1.0);
                    BO.Events.emit('hud:toast', { text: 'SUB-ZERO PULSE!', color: '#93c5fd' });
                }
            }
            if (fx.arcPulseInterval && zombies.length) {
                this.arcTimer -= dt;
                if (this.arcTimer <= 0) {
                    this.arcTimer = fx.arcPulseInterval;
                    const near = zombies.filter((z) => z.alive).sort((a, b) => a.pos.distanceTo(P.pos) - b.pos.distanceTo(P.pos)).slice(0, 3);
                    for (const z of near) {
                        if (BO.FX?.spawnTracer) BO.FX.spawnTracer(P.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), z.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x38bdf8, 0.05, 0.2);
                        z.takeDamage(180, 'torso', false, null, 'arc');
                    }
                }
            }
            if (mode === 'td' && fx.keepLightningSec && zombies.length) {
                this.keepLightningTimer -= dt;
                if (this.keepLightningTimer <= 0) {
                    this.keepLightningTimer = fx.keepLightningSec;
                    const lead = zombies.filter((z) => z.alive).sort((a, b) => a.pos.length() - b.pos.length())[0];
                    if (lead) {
                        if (BO.FX?.spawnTracer) BO.FX.spawnTracer(lead.pos.clone().add(new THREE.Vector3(0, 12, 0)), lead.pos.clone(), 0xfde047, 0.08, 0.25);
                        lead.takeDamage(280, 'torso', false, null, 'arc');
                    }
                }
            }
            if (mode === 'mp' && fx.lightningStrikeInterval && ctx.bots?.length) {
                this.mpLightningTimer -= dt;
                if (this.mpLightningTimer <= 0) {
                    this.mpLightningTimer = fx.lightningStrikeInterval;
                    const living = ctx.bots.filter((b) => b.alive && b.team !== 0);
                    if (living.length) {
                        const victim = pick(living);
                        if (BO.FX?.spawnTracer) BO.FX.spawnTracer(victim.pos.clone().add(new THREE.Vector3(0, 12, 0)), victim.pos.clone(), 0x38bdf8, 0.07, 0.25);
                        if (ctx.damageBot) ctx.damageBot(victim, 55);
                    }
                }
            }
        }

        tickZombies(mods, list, dt) {
            if (!mods || !list) return;
            const fx = this.fx(mods);
            if (!(mods.zombieRegen || mods.woundedFrenzy || fx.swarmEnrageDmg || fx.towerDmgMult)) return;
            for (const z of list) {
                if (!z.alive) continue;
                if (mods.zombieRegen && z.hp < z.maxHp) z.hp = Math.min(z.maxHp, z.hp + z.maxHp * 0.02 * dt);
                if (mods.woundedFrenzy && !z._frenzied && z.hp < z.maxHp * 0.5) {
                    z._frenzied = true;
                    z.speed = Math.min(14, z.speed * 1.6);
                }
            }
        }
    }

    BO.Mods = new ModifierSystem();
})(window);
