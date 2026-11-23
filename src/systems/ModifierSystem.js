/* ============================================================================
   BLACKOUT OPS — Shared Modifier Engine & Starting Weapon Protocols
   One catalog of match modifiers used by Zombies, Tower Defense and (player-side)
   Multiplayer, plus 20 starting weapon protocols. Each mode calls the hooks below.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const CATEGORIES = [
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

    // modes: which game modes list the modifier.
    const DEFS = [
        // ---- Existing modifiers (implemented inside each mode) ----
        { k: 'allBosses', lbl: 'All Bosses', cat: 'boss', modes: Z, desc: 'Every enemy that spawns is a boss.' },
        { k: 'shieldedBosses', lbl: 'Shielded Bosses', cat: 'boss', modes: Z, desc: 'Bosses carry a regenerating shield.' },
        { k: 'fastZombies', lbl: 'Fast Zombies', cat: 'horde', modes: Z, desc: 'The whole horde moves about 1.6x faster.' },
        { k: 'giantZombies', lbl: 'Giant Zombies', cat: 'horde', modes: Z, desc: '1.65x bigger, tougher and a little slower.' },
        { k: 'tinyZombies', lbl: 'Tiny Speedsters', cat: 'horde', modes: Z, desc: 'Small, fragile and very fast.' },
        { k: 'armoredHorde', lbl: 'Armored Horde', cat: 'horde', modes: Z, desc: 'Every zombie gains +35% damage reduction.' },
        { k: 'halfZombieHp', lbl: 'Half Zombie Health', cat: 'horde', modes: Z, desc: 'All zombies spawn with 50% health.' },
        { k: 'quarterZombieHp', lbl: 'Quarter Zombie Health', cat: 'horde', modes: Z, desc: 'All zombies spawn with 25% health.' },
        { k: 'oneHitMeleeZombies', lbl: 'Deadly Touch (99,999 dmg)', cat: 'horde', modes: Z, desc: 'Any zombie swipe is instantly lethal.' },
        { k: 'chaosSwarm', lbl: 'Chaos Swarm', cat: 'horde', modes: Z, desc: 'Twice as many zombies per round, each a bit weaker.' },
        { k: 'allEnemiesUnlocked', lbl: 'Full Roster From Round 1', cat: 'behavior', modes: Z, desc: 'All 70 enemies and 10 bosses can appear from the start.' },
        { k: 'zombiesHeal', lbl: 'Healer Zombies', cat: 'behavior', modes: Z, desc: 'Zombies patch each other up mid-fight.' },
        { k: 'magicalZombies', lbl: 'Magical Zombies', cat: 'behavior', modes: Z, desc: 'Zombies cast ranged magic bolts.' },
        { k: 'explosiveDeath', lbl: 'Explosive Deaths', cat: 'behavior', modes: Z, desc: 'Zombies burst when they die. Keep your distance.' },
        { k: 'vampiric', lbl: 'Vampiric Zombies', cat: 'behavior', modes: Z, desc: 'Zombie attacks drain your life.' },
        { k: 'megaSplitters', lbl: 'Mega Splitters', cat: 'behavior', modes: Z, desc: 'Every zombie splits into two when killed.' },
        { k: 'superJumpZombies', lbl: 'Super-Jumping Horde', cat: 'behavior', modes: Z, desc: 'Zombies leap often and high.' },
        { k: 'berserkerWave', lbl: 'Berserker Rage', cat: 'behavior', modes: Z, desc: 'Zombies enrage when below half health.' },
        { k: 'noProjectiles', lbl: 'No Projectile Zombies', cat: 'behavior', modes: Z, desc: 'No zombie can shoot or cast at range.' },
        { k: 'noProjectilesUntil20', lbl: 'No Projectiles Until Rd 20', cat: 'behavior', modes: Z, desc: 'Ranged attacks only start at round 20.' },
        { k: 'headshotsOnly', lbl: 'Headshots Only', cat: 'weapons', modes: Z, desc: 'Body shots do nothing.' },
        { k: 'infiniteAmmo', lbl: 'Infinite Ammo', cat: 'weapons', modes: Z, desc: 'Never reload, never run dry.' },
        { k: 'randomLoadoutWave', lbl: 'Random Gun Each Round', cat: 'weapons', modes: Z, desc: 'You get a random gun at the start of every round.' },
        { k: 'sniperHeaven', lbl: 'Sniper Heaven', cat: 'weapons', modes: Z, desc: 'Sniper and marksman rifles deal 2.5x damage.' },
        { k: 'meleeMayhem', lbl: 'Melee Mayhem', cat: 'weapons', modes: Z, desc: 'Melee deals 4x damage and heals 20 HP per kill.' },
        { k: 'explosiveHeadshots', lbl: 'Explosive Headshots', cat: 'weapons', modes: Z, desc: 'Headshot kills explode and damage the crowd.' },
        { k: 'fastReload', lbl: 'Hyper Reload', cat: 'weapons', modes: ALL, desc: 'Reloads are about 3x faster.' },
        { k: 'glassCannon', lbl: 'Glass Cannon', cat: 'body', modes: Z, desc: 'You and the horde both hit 3x harder; you have half health.' },
        { k: 'vampirePlayer', lbl: 'Vampire (+15 HP per kill)', cat: 'body', modes: ALL, desc: 'Every kill heals you 15 HP.' },
        { k: 'hyperSpeedPlayer', lbl: 'Hyper Speed', cat: 'body', modes: ALL, desc: 'You move 1.6x faster.' },
        { k: 'noRegen', lbl: 'No Health Regen', cat: 'body', modes: ALL, desc: 'Health never comes back on its own.' },
        { k: 'noPerks', lbl: 'No Perk Machines', cat: 'economy', modes: Z, desc: 'Perk machines are switched off.' },
        { k: 'freePerks', lbl: 'Free Perks', cat: 'economy', modes: Z, desc: 'Perk machines cost nothing.' },
        { k: 'richStart', lbl: 'Rich Start (10,000)', cat: 'economy', modes: Z, desc: 'Begin with 10,000 points or gold.' },
        { k: 'doubleGold', lbl: 'Double Points / Gold', cat: 'economy', modes: Z, desc: 'All income is doubled.' },
        { k: 'cost4x', lbl: 'Everything Costs 4x', cat: 'economy', modes: ['td'], desc: 'Every shop price is four times higher.' },
        { k: 'bloodMoon', lbl: 'Blood Moon', cat: 'world', modes: Z, desc: 'Red sky and thick crimson fog.' },
        { k: 'nightmareDarkness', lbl: 'Nightmare Darkness', cat: 'world', modes: Z, desc: 'Near-total darkness. Bring a steady aim.' },
        { k: 'lowGravity', lbl: 'Low Gravity', cat: 'world', modes: Z, desc: 'Floaty, moon-like jumps.' },

        // ---- New modifiers (implemented by this engine) ----
        { k: 'doubleZombieHp', lbl: 'Double Zombie Health', cat: 'horde', modes: Z, desc: 'Every zombie has 2x health.' },
        { k: 'tripleZombieHp', lbl: 'Triple Zombie Health', cat: 'horde', modes: Z, desc: 'Every zombie has 3x health.' },
        { k: 'paperZombies', lbl: 'Paper Zombies (1 HP)', cat: 'horde', modes: Z, desc: 'Every zombie and boss dies in one hit.' },
        { k: 'slowZombies', lbl: 'Slow Horde', cat: 'horde', modes: Z, desc: 'Zombies move at 60% speed.' },
        { k: 'snailZombies', lbl: 'Snail Horde', cat: 'horde', modes: Z, desc: 'Zombies crawl along at 35% speed.' },
        { k: 'hardHitters', lbl: 'Hard Hitters', cat: 'horde', modes: Z, desc: 'Zombie attacks deal 2x damage.' },
        { k: 'softHitters', lbl: 'Soft Hitters', cat: 'horde', modes: Z, desc: 'Zombie attacks deal half damage.' },
        { k: 'titaniumHorde', lbl: 'Titanium Horde', cat: 'horde', modes: Z, desc: 'Zombies gain +55% damage reduction (stacks up to 80%).' },
        { k: 'randomSizes', lbl: 'Random Sizes', cat: 'horde', modes: Z, desc: 'Each zombie is randomly tiny or huge; health scales with size.' },
        { k: 'rampingHp', lbl: 'Escalating Health', cat: 'horde', modes: Z, desc: 'Zombies gain an extra +10% health every round.' },
        { k: 'rampingSpeed', lbl: 'Escalating Speed', cat: 'horde', modes: Z, desc: 'Zombies gain an extra +3% speed every round (max 2x).' },
        { k: 'zombieRegen', lbl: 'Regenerating Horde', cat: 'horde', modes: Z, desc: 'Wounded zombies heal 2% of their health every second.' },
        { k: 'eliteEvery10', lbl: 'Elite Every 10th', cat: 'horde', modes: Z, desc: 'Every 10th zombie is an elite: 3x health and noticeably bigger.' },
        { k: 'allSplitFour', lbl: 'Quad Splitters', cat: 'behavior', modes: Z, desc: 'Every normal zombie splits into four when killed.' },
        { k: 'allJumpers', lbl: 'Pogo Horde', cat: 'behavior', modes: Z, desc: 'Every zombie hops constantly.' },
        { k: 'woundedFrenzy', lbl: 'Wounded Frenzy', cat: 'behavior', modes: Z, desc: 'Zombies get 1.6x faster once they drop below half health.' },
        { k: 'thickSkulls', lbl: 'Thick Skulls', cat: 'behavior', modes: Z, desc: 'Headshots deal half damage.' },
        { k: 'glassJaws', lbl: 'Glass Jaws', cat: 'behavior', modes: Z, desc: 'Headshots deal 3x damage.' },
        { k: 'hulkingBosses', lbl: 'Colossal Bosses', cat: 'boss', modes: Z, desc: 'Bosses have 2x health and tower over you.' },
        { k: 'fragileBosses', lbl: 'Fragile Bosses', cat: 'boss', modes: Z, desc: 'Bosses have half health.' },
        { k: 'bossSlayer', lbl: 'Boss Slayer', cat: 'boss', modes: Z, desc: 'You deal 3x damage to bosses.' },
        { k: 'bountyHunter', lbl: 'Bounty Hunter', cat: 'boss', modes: Z, desc: 'Each boss kill pays an extra 2,000 points or gold.' },
        { k: 'pistolPower', lbl: 'Pistol Power', cat: 'weapons', modes: ALL, desc: 'Pistols deal 3x damage.' },
        { k: 'shotgunSurgeon', lbl: 'Shotgun Surgeon', cat: 'weapons', modes: ALL, desc: 'Shotguns deal 2x damage.' },
        { k: 'rifleman', lbl: 'Rifleman', cat: 'weapons', modes: ALL, desc: 'Assault rifles deal 1.75x damage.' },
        { k: 'smgSpray', lbl: 'SMG Spray', cat: 'weapons', modes: ALL, desc: 'SMGs deal 1.75x damage.' },
        { k: 'lmgSuppress', lbl: 'Heavy Gunner', cat: 'weapons', modes: ALL, desc: 'LMGs deal 1.75x damage.' },
        { k: 'doublePlayerDmg', lbl: 'Double Damage', cat: 'weapons', modes: ALL, desc: 'Everything you fire deals 2x damage.' },
        { k: 'weakPlayerDmg', lbl: 'Weak Rounds', cat: 'weapons', modes: ALL, desc: 'Everything you fire deals half damage.' },
        { k: 'critChance', lbl: 'Lucky Crits', cat: 'weapons', modes: ALL, desc: 'Each hit has a 15% chance to deal 3x damage.' },
        { k: 'executioner', lbl: 'Executioner', cat: 'weapons', modes: Z, desc: 'Hitting a non-boss below 20% health kills it outright.' },
        { k: 'meleeOnly', lbl: 'Melee Only', cat: 'weapons', modes: ALL, desc: 'Only melee attacks deal damage.' },
        { k: 'noMelee', lbl: 'No Melee', cat: 'weapons', modes: ALL, desc: 'Melee attacks deal no damage.' },
        { k: 'bodyshotsOnly', lbl: 'Bodyshots Only', cat: 'weapons', modes: ALL, desc: 'Headshots do nothing; aim center mass.' },
        { k: 'killAmmo', lbl: 'Scavenger Kills', cat: 'weapons', modes: ALL, desc: 'Every kill returns 25% of a magazine to your reserve.' },
        { k: 'ammoScarcity', lbl: 'Ammo Scarcity', cat: 'weapons', modes: ALL, desc: 'You start with half your reserve ammo.' },
        { k: 'startPaP', lbl: 'Start Pack-a-Punched', cat: 'weapons', modes: Z, desc: 'Your starting weapons are already upgraded.' },
        { k: 'grenadeResupply', lbl: 'Grenade Resupply', cat: 'weapons', modes: ALL, desc: 'Gain one grenade every 20 seconds.' },
        { k: 'ironWill', lbl: 'Iron Will', cat: 'body', modes: ALL, desc: 'You take half damage from everything.' },
        { k: 'fragileBody', lbl: 'Fragile', cat: 'body', modes: ALL, desc: 'You take double damage from everything.' },
        { k: 'oneHp', lbl: 'One HP Hero', cat: 'body', modes: ALL, desc: 'You have 1 HP and no armor. One mistake ends it.' },
        { k: 'tankPlayer', lbl: 'Tank', cat: 'body', modes: ALL, desc: 'You have 3x max health.' },
        { k: 'regenBoost', lbl: 'Rapid Regen', cat: 'body', modes: ALL, desc: 'Health regenerates 3x faster.' },
        { k: 'bleedOut', lbl: 'Bleed Out', cat: 'body', modes: ALL, desc: 'You slowly lose health while above 25 HP.' },
        { k: 'secondWind', lbl: 'Second Wind', cat: 'body', modes: ALL, desc: 'Once per match, dropping below 20% instantly refills your health.' },
        { k: 'slowPlayer', lbl: 'Heavy Boots', cat: 'body', modes: ALL, desc: 'You move at 70% speed.' },
        { k: 'adrenalineKills', lbl: 'Adrenaline', cat: 'body', modes: ALL, desc: 'Each kill gives a 3-second 1.35x speed burst.' },
        { k: 'allPerksStart', lbl: 'Start With 6 Perks', cat: 'body', modes: Z, desc: 'Begin with Quick Revive, Juggernog, Speed Cola, Double Tap, Stamin-Up and Deadshot.' },
        { k: 'fullArmorStart', lbl: 'Start With Full Armor', cat: 'body', modes: ALL, desc: 'Begin with every armor plate filled.' },
        { k: 'ultimateRush', lbl: 'Ultimate Rush', cat: 'body', modes: ALL, desc: 'Your ultimate charges 3x faster from kills, plus a slow passive charge.' },
        { k: 'tripleGold', lbl: 'Triple Points / Gold', cat: 'economy', modes: Z, desc: 'All income is tripled.' },
        { k: 'halfGold', lbl: 'Half Points / Gold', cat: 'economy', modes: Z, desc: 'All income is halved.' },
        { k: 'brokeStart', lbl: 'Broke Start', cat: 'economy', modes: Z, desc: 'You begin with zero points or gold.' },
        { k: 'chainLightning', lbl: 'Chain Lightning', cat: 'world', modes: Z, desc: 'Every kill zaps the nearest zombie for heavy damage.' },
        { k: 'corpseBombs', lbl: 'Corpse Bombs', cat: 'world', modes: Z, desc: '25% of kills detonate and hurt nearby zombies.' },
        { k: 'frostKills', lbl: 'Frost Kills', cat: 'world', modes: Z, desc: 'Kills freeze zombies within 5 m for 2.5 seconds.' }
    ];

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
            this._reset();
        }

        _reset() {
            this.spawnCount = 0;
            this.secondWindUsed = false;
            this.adrenalineTimer = 0;
            this.grenadeTimer = 20;
            this.zombieTickAccum = 0;
        }

        defsForMode(mode) { return DEFS.filter((d) => d.modes.includes(mode)); }
        get(k) { return DEF_MAP[k]; }
        getProtocol(id) { return PROTOCOLS.find((p) => p.id === id) || PROTOCOLS[0]; }

        countActive(mods, mode) {
            if (!mods) return 0;
            return this.defsForMode(mode).filter((d) => mods[d.k]).length;
        }

        /** The current match's modifier object (works in every mode). */
        active() {
            const m = BO.State && BO.State.activeMode;
            if (m === 'td' && BO.TowerDefenseMode) return BO.TowerDefenseMode.modifiers || {};
            if (m === 'zombies' && BO.ZombiesMode) return BO.ZombiesMode.modifiers || {};
            if (m === 'mp' && BO.MPMode && BO.MPMode.customRules) return BO.MPMode.customRules.mods || {};
            return {};
        }

        /* ---------------- Match start ---------------- */
        startCurrency(mods, base) {
            if (mods && mods.brokeStart) return 0;
            return base;
        }

        /** Call right after BO.Player.initForMatch (and after max-HP custom values). */
        applyPlayerStart(mods, mode) {
            this._reset();
            const P = BO.Player;
            if (!P || !mods) return;
            // Perks first: applyPerkStats recalculates max health, so health modifiers go after it.
            if (mods.allPerksStart && mode !== 'mp' && !mods.noPerks && P.zombiePerks) {
                ['quick_revive', 'juggernog', 'speed_cola', 'double_tap', 'stamin_up', 'deadshot'].forEach((pk) => P.zombiePerks.add(pk));
                if (P.applyPerkStats) P.applyPerkStats();
                P.hp = P.maxHp;
            }
            if (mods.tankPlayer) { P.maxHp = Math.round(P.maxHp * 3); P.hp = P.maxHp; }
            if (mods.oneHp) {
                P.maxHp = 1; P.hp = 1;
                P.armor = 0; P.maxArmor = 0; P.armorReservePlates = 0;
            }
            if (mods.fullArmorStart && !mods.oneHp && P.maxArmor > 0) P.armor = P.maxArmor;
            if (mods.startPaP && mode !== 'mp' && P.weapons) {
                P.weapons = P.weapons.map((w) => (w && !w.isPaP && w.stats.kind !== 'melee') ? P._createWeaponInstance(w.cfg, 1) : w);
                if (P.rebuildViewmodel) P.rebuildViewmodel();
            }
            if (mods.ammoScarcity && P.weapons) {
                P.weapons.forEach((w) => { if (w) w.reserve = Math.floor(w.reserve * 0.5); });
            }
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
        /** Mutates zombie constructor options before the entity is created. */
        tweakSpawnOpts(mods, opts, ctx = {}) {
            if (!mods || !opts) return opts;
            const round = ctx.round || 1;
            const isBoss = !!(ctx.isBoss || (opts.spec && opts.spec.isBoss));
            this.spawnCount++;
            let hp = opts.hp || 100;
            let speed = opts.speed || 2;
            let dmg = opts.damage || 20;
            let size = opts.sizeMult || 1;

            if (mods.doubleZombieHp) hp *= 2;
            if (mods.tripleZombieHp) hp *= 3;
            if (mods.rampingHp) hp *= 1 + 0.10 * Math.max(0, round - 1);
            if (mods.slowZombies) speed *= 0.6;
            if (mods.snailZombies) speed *= 0.35;
            if (mods.rampingSpeed) speed *= Math.min(2, 1 + 0.03 * Math.max(0, round - 1));
            if (mods.hardHitters && dmg < 99999) dmg *= 2;
            if (mods.softHitters && dmg < 99999) dmg *= 0.5;
            if (mods.randomSizes) {
                const s = 0.55 + Math.random() * 1.15;
                size *= s;
                hp *= 0.6 + s * 0.4;
            }
            if (isBoss && mods.hulkingBosses) { hp *= 2; size *= 1.3; }
            if (isBoss && mods.fragileBosses) hp *= 0.5;
            if (!isBoss && mods.eliteEvery10 && this.spawnCount % 10 === 0) {
                hp *= 3; size *= 1.35; opts._elite = true;
            }
            if (!isBoss && mods.allSplitFour && !opts.isSplitChild) opts.splitCount = 4;
            if (mods.allJumpers) opts.jumpChance = 1.0;
            if (mods.paperZombies) hp = 1;

            opts.hp = Math.max(1, Math.round(hp));
            opts.speed = Math.min(14, speed);
            opts.damage = Math.max(1, Math.round(dmg));
            opts.sizeMult = BO.Math.clamp(size, 0.35, 3.2);
            return opts;
        }

        /** Adjusts a freshly created zombie entity. */
        afterSpawn(mods, ent) {
            if (!mods || !ent) return ent;
            if (mods.titaniumHorde) ent.defense = Math.min(0.80, (ent.defense || 0) + 0.55);
            if (mods.paperZombies) { ent.defense = 0; ent.maxHp = 1; ent.hp = 1; }
            ent._baseSpeed = ent.speed;
            return ent;
        }

        /* ---------------- Damage dealt by the player ---------------- */
        /** Returns modified damage, or 0 to block the hit entirely. */
        outgoingDamage(mods, dmg, ctx = {}) {
            if (!mods) return dmg;
            const w = ctx.weaponInst;
            const st = (w && w.stats) || {};
            const isMelee = st.kind === 'melee' || (w && w.cfg && w.cfg.id === 'knife');
            const cat = String(st.category || '');
            const isHead = ctx.hitbox === 'head';
            const target = ctx.target;

            if (mods.meleeOnly && !isMelee) return 0;
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
            if (mods.critChance && Math.random() < 0.15) {
                d *= 3;
                if (BO.FX && target && target.pos) {
                    BO.FX.spawnParticles(target.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), 10, 0xfde047, 5, 1.5, 0.4, 0.8);
                }
            }
            if (mods.executioner && target && !target.isBoss && target.maxHp > 0 && target.hp / target.maxHp < 0.20) {
                d = Math.max(d, target.hp + 1);
            }
            return d;
        }

        /* ---------------- Kills ---------------- */
        /**
         * ctx: { list (array of enemies), explode(pt, rad, dmg), addCurrency(amount), isBoss }
         */
        onKill(mods, target, ctx = {}) {
            if (!mods) return;
            const P = BO.Player;
            if (P && P.alive) {
                if (mods.killAmmo && P.activeWeapon && P.activeWeapon.stats.kind === 'gun') {
                    const aw = P.activeWeapon;
                    aw.reserve = Math.min(aw.stats.reserveMax, aw.reserve + Math.ceil(aw.stats.magSize * 0.25));
                }
                if (mods.adrenalineKills) this.adrenalineTimer = 3.0;
                if (mods.ultimateRush && P.addUltimateCharge) P.addUltimateCharge(10);
            }
            if (mods.bountyHunter && target && target.isBoss && ctx.addCurrency) {
                ctx.addCurrency(2000);
                BO.Events.emit('hud:toast', { text: 'BOUNTY COLLECTED +2,000', color: '#fde047' });
            }
            const list = ctx.list || [];
            const origin = target && target.pos;
            if (!origin) return;
            if (mods.chainLightning) {
                let best = null; let bd = 9;
                for (const z of list) {
                    if (!z.alive || z === target) continue;
                    const d = z.pos.distanceTo(origin);
                    if (d < bd) { bd = d; best = z; }
                }
                if (best) {
                    if (BO.FX && BO.FX.spawnTracer) {
                        BO.FX.spawnTracer(origin.clone().add(new THREE.Vector3(0, 1.2, 0)), best.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x7dd3fc, 0.05, 0.22);
                    }
                    best.takeDamage(Math.max(60, best.maxHp * 0.35), 'torso', false, null, 'explosive');
                }
            }
            if (mods.frostKills) {
                for (const z of list) {
                    if (z.alive && z !== target && z.pos.distanceTo(origin) <= 5) {
                        z.frozenTimer = Math.max(z.frozenTimer || 0, 2.5);
                    }
                }
                if (BO.FX && BO.FX.spawnParticles) BO.FX.spawnParticles(origin.clone().add(new THREE.Vector3(0, 1, 0)), 16, 0x93c5fd, 6, 1.5, 0.5, 1.0);
            }
            if (mods.corpseBombs && ctx.explode && Math.random() < 0.25) {
                const pt = origin.clone().add(new THREE.Vector3(0, 1.0, 0));
                if (BO.FX && BO.FX.spawnExplosion) BO.FX.spawnExplosion(pt, 4.0, 0xef4444);
                if (BO.Sound && BO.Sound.playExplosion) BO.Sound.playExplosion(0.4);
                ctx.explode(pt, 4.5, 140);
            }
        }

        /* ---------------- Economy ---------------- */
        currencyMult(mods) {
            if (!mods) return 1;
            let m = 1;
            if (mods.tripleGold) m *= 3;
            if (mods.halfGold) m *= 0.5;
            return m;
        }

        /* ---------------- Player-side (read by PlayerController) ---------------- */
        incomingDamageMult() {
            const mods = this.active();
            let m = 1;
            if (mods.ironWill) m *= 0.5;
            if (mods.fragileBody) m *= 2;
            return m;
        }

        regenMult() {
            const mods = this.active();
            return mods.regenBoost ? 3 : 1;
        }

        speedMult() {
            const mods = this.active();
            let m = 1;
            if (mods.slowPlayer) m *= 0.7;
            if (mods.adrenalineKills && this.adrenalineTimer > 0) m *= 1.35;
            return m;
        }

        tickPlayer(dt) {
            const mods = this.active();
            const P = BO.Player;
            if (!P || !P.alive) return;
            if (this.adrenalineTimer > 0) this.adrenalineTimer = Math.max(0, this.adrenalineTimer - dt);
            if (mods.bleedOut && P.hp > 25) P.hp = Math.max(25, P.hp - 1.5 * dt);
            if (mods.secondWind && !this.secondWindUsed && P.maxHp > 1 && P.hp > 0 && P.hp < P.maxHp * 0.2) {
                this.secondWindUsed = true;
                P.hp = P.maxHp;
                BO.Events.emit('hud:banner', { title: 'SECOND WIND', sub: 'HEALTH FULLY RESTORED', color: '#4ade80' });
            }
            if (mods.ultimateRush && P.addUltimateCharge) P.addUltimateCharge(0.4 * dt);
            if (mods.grenadeResupply) {
                this.grenadeTimer -= dt;
                if (this.grenadeTimer <= 0) {
                    this.grenadeTimer = 20;
                    const cap = Math.max(2, (BO.AttachmentsData.LETHALS[P.lethalId] && BO.AttachmentsData.LETHALS[P.lethalId].count) || 2) + 2;
                    if (P.lethalCount < cap) {
                        P.lethalCount++;
                        BO.Events.emit('hud:toast', { text: '+1 GRENADE', color: '#38bdf8' });
                    }
                }
            }
        }

        /** Per-frame horde effects (regen, frenzy). */
        tickZombies(mods, list, dt) {
            if (!mods || !list || !(mods.zombieRegen || mods.woundedFrenzy)) return;
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
