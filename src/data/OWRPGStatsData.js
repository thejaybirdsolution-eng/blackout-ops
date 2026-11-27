/* ============================================================================
   BLACKOUT OPS — Open World RPG ("Operation Meridian") · Stats & Items Data
   Attributes, XP curve, perk trees (mutually exclusive tiers), 5-element
   statuses and reactions, abilities (incl. ultimate), enemy archetypes +
   world bosses, items, affixes and loot tables.
   Formulas are preserved for _qa_owrpg.html invariants.
============================================================================ */
(function (BO) {
    'use strict';

    const ATTRS = [
        { id: 'BRW', name: 'Brawn', desc: '+8 max HP and +6 kg carry weight per point, +6% melee damage. Brute-force checks.' },
        { id: 'RFX', name: 'Reflex', desc: '+3.5% ADS/swap speed, -3% spread per point, longer dodge window. Quick-draw checks.' },
        { id: 'TCH', name: 'Tech', desc: '-4% ability cooldown and +7% status potency per point. Hacking and repair checks.' },
        { id: 'PRC', name: 'Perception', desc: '+4.5% weakspot multiplier, -4% crouch noise per point. Insight checks.' },
        { id: 'PRS', name: 'Presence', desc: '-3.5% buy / +3.5% sell price, +8% reputation gains per point. Persuasion checks.' }
    ];
    const ATTR_IDS = ATTRS.map((a) => a.id);
    const ATTR_BASE = 5, ATTR_MIN = 1, ATTR_MAX = 10, CREATION_POINTS = 8;
    const LEVEL_CAP = 20;

    /** XP needed to go from level L to L+1. */
    function xpToNext(L) { return Math.round(150 * Math.pow(L, 1.65) + 50 * L); }

    /* ------------------------------------------------------------------ perks */
    const TIER_LEVELS = [2, 6, 10, 14, 18];
    const PERK_TREES = {
        vanguard: {
            name: 'Vanguard', color: '#f97316',
            tiers: [
                [{ id: 'van_t1_plating', name: 'Field Plating', desc: '+25 max HP.', fx: { maxHp: 25 } },
                    { id: 'van_t1_packmule', name: 'Pack Mule', desc: '+15 kg carry weight.', fx: { carry: 15 } }],
                [{ id: 'van_t2_bulwark', name: 'Bulwark', desc: 'Take 12% less damage while crouched.', fx: { crouchDR: 0.12 } },
                    { id: 'van_t2_bloodrush', name: 'Blood Rush', desc: 'Kills heal 8 HP.', fx: { killHeal: 8 } }],
                [{ id: 'van_t3_thermite', name: 'Thermite Rounds', desc: 'Every 6th hit applies Burn.', fx: { nthBurn: 6 } },
                    { id: 'van_t3_breacher', name: 'Breacher', desc: '+20 armor penetration with shotguns and LMGs.', fx: { heavyPen: 20 } }],
                [{ id: 'van_t4_juggernaut', name: 'Juggernaut', desc: '+15 armor.', fx: { armor: 15 } },
                    { id: 'van_t4_warcry', name: 'War Cry', desc: 'Detonator also heals 20 HP.', fx: { detHeal: 20 } }],
                [{ id: 'van_t5_unstoppable', name: 'Unstoppable', desc: 'Once per 120 s, lethal damage leaves you at 1 HP.', fx: { cheatDeath: 120 } },
                    { id: 'van_t5_demolisher', name: 'Demolisher', desc: 'Reactions deal +40% damage.', fx: { reactMult: 0.4 } }]
            ]
        },
        ghost: {
            name: 'Ghost', color: '#a3e635',
            tiers: [
                [{ id: 'ghost_t1_softstep', name: 'Soft Step', desc: '-25% movement noise.', fx: { noise: -0.25 } },
                    { id: 'ghost_t1_suppressed', name: 'Silent Partner', desc: 'Sneak-attack multiplier +0.5.', fx: { stealthMult: 0.5 } }],
                [{ id: 'ghost_t2_lockpick', name: 'Lockpick', desc: 'Open locked containers without a key.', fx: { lockpick: 1 } },
                    { id: 'ghost_t2_eagle', name: 'Eagle Eye', desc: 'Detection meters fill 30% slower.', fx: { detectSlow: 0.3 } }],
                [{ id: 'ghost_t3_shadowstep', name: 'Shadow Step', desc: 'Sneak kills grant 3 s of optical camo.', fx: { camoOnKill: 3 } },
                    { id: 'ghost_t3_deadeye', name: 'Deadeye Ambush', desc: 'Undetected shots from > 35 m always crit and Chill.', fx: { deadeye: 35 } }],
                [{ id: 'ghost_t4_vanish', name: 'Vanish', desc: 'Breaking line of sight drops alert 2x faster.', fx: { vanish: 1 } },
                    { id: 'ghost_t4_assassin', name: 'Assassin', desc: '+30% weakspot damage.', fx: { critAdd: 0.3 } }],
                [{ id: 'ghost_t5_phantom', name: 'Phantom', desc: 'Dodge grants 1.5 s invisibility.', fx: { dodgeCamo: 1.5 } },
                    { id: 'ghost_t5_executioner', name: 'Executioner', desc: 'Hits on targets under 25% HP deal +60%.', fx: { execute: 0.6 } }]
            ]
        },
        technomancer: {
            name: 'Technomancer', color: '#38bdf8',
            tiers: [
                [{ id: 'tech_t1_overclock', name: 'Overclock', desc: '-15% ability cooldowns.', fx: { cdr: 0.15 } },
                    { id: 'tech_t1_scavenger', name: 'Scavenger', desc: '+40% scrap from salvage.', fx: { salvage: 0.4 } }],
                [{ id: 'tech_t2_amplifier', name: 'Amplifier', desc: 'Statuses last 40% longer.', fx: { statusDur: 0.4 } },
                    { id: 'tech_t2_medtech', name: 'Med-Tech', desc: 'Med-injectors heal 50% more.', fx: { medMult: 0.5 } }],
                [{ id: 'tech_t3_chain', name: 'Chain Reaction', desc: 'Reactions spread the consumed status to 2 nearby foes.', fx: { chain: 2 } },
                    { id: 'tech_t3_override', name: 'Override', desc: 'Hacking terminals also disables nearby turrets and alarms.', fx: { override: 1 } }],
                [{ id: 'tech_t4_capacitor', name: 'Capacitor', desc: 'Primer gets a second charge.', fx: { primerCharges: 1 } },
                    { id: 'tech_t4_conductor', name: 'Conductor', desc: 'Shock arcs to 1 extra target.', fx: { shockArc: 1 } }],
                [{ id: 'tech_t5_singularity', name: 'Singularity', desc: 'Detonator radius +60%.', fx: { detRadius: 0.6 } },
                    { id: 'tech_t5_feedback', name: 'Feedback Loop', desc: 'Reactions refund 40% of Primer cooldown.', fx: { refund: 0.4 } }]
            ]
        }
    };

    /* --------------------------------------------------------- 5-element statuses */
    const STATUSES = {
        burn: { name: 'Burn', color: '#f97316', hex: 0xf97316, dur: 5, dps: 9, icon: '🔥' },
        chill: { name: 'Chill', color: '#38bdf8', hex: 0x38bdf8, dur: 5, slow: 0.45, icon: '❄' },
        shock: { name: 'Shock', color: '#facc15', hex: 0xfacc15, dur: 5, icon: '⚡' },
        venom: { name: 'Venom', color: '#84cc16', hex: 0x84cc16, dur: 6, dps: 7, maxStacks: 5, icon: '☠' },
        void: { name: 'Void', color: '#c084fc', hex: 0xc084fc, dur: 5, drain: 0.15, icon: '✦' },
        expose: { name: 'Expose', color: '#f472b6', hex: 0xf472b6, dur: 6, mult: 1.25, icon: '◈' }
    };
    const REACTIONS = {
        burn: { name: 'COMBUST', mult: 2.2, radius: 4.5, desc: 'Fiery blast around the target.' },
        chill: { name: 'SHATTER', mult: 3.0, radius: 0, desc: 'Massive single-target damage.' },
        shock: { name: 'OVERLOAD', mult: 1.4, radius: 7, desc: 'Arcs to nearby enemies and stuns.' },
        venom: { name: 'BLIGHT BURST', mult: 1.85, radius: 5.5, desc: 'Corrosive blast scaling per stack; spreads Venom.' },
        void: { name: 'SINGULARITY COLLAPSE', mult: 2.35, radius: 7.0, desc: 'Pulls nearby enemies inward and siphons health.' },
        expose: { name: 'RUPTURE', mult: 1.6, radius: 0, desc: 'Strips 50% armor for 10 s.' }
    };

    /* --------------------------------------------------------- abilities */
    const ABILITIES = {
        primer: {
            cryo_dart: { name: 'Cryo Dart', status: 'chill', cd: 9, dmg: 18, range: 45, desc: 'Fires a dart that Chills.' },
            thermite: { name: 'Thermite Canister', status: 'burn', cd: 10, dmg: 14, range: 30, radius: 3.5, desc: 'Lobbed canister: Burns an area.' },
            arc_mine: { name: 'Arc Spike', status: 'shock', cd: 10, dmg: 16, range: 40, radius: 3, desc: 'Spike that Shocks foes near the impact.' },
            breach_bash: { name: 'Breach Bash', status: 'expose', cd: 8, dmg: 30, range: 4, desc: 'Shoulder-charge that Exposes and staggers.' }
        },
        detonator: {
            arc_lash: { name: 'Arc Lash', cd: 12, dmg: 40, range: 30, radius: 0, desc: 'Lightning whip: consumes statuses on the target.' },
            concussion: { name: 'Concussion Pulse', cd: 14, dmg: 30, range: 0, radius: 7, desc: 'Pulse around you: consumes statuses on all nearby.' }
        },
        gadget: {
            med_injector: { name: 'Med-Injector', cd: 25, heal: 45, desc: 'Heal 45 HP over 2 s.' },
            decoy_holo: { name: 'Decoy Hologram', cd: 30, dur: 8, desc: 'Projects a decoy that hostiles investigate.' }
        },
        ultimate: {
            orbital_barrage: { name: 'Orbital Barrage', cd: 55, dmg: 140, range: 45, radius: 8, element: 'burn', desc: 'Calls down twin thermite-arc strikes on target area.' }
        }
    };

    /* --------------------------------------------------------- enemies */
    // kind 'bot' -> BotAI gunner; kind 'beast' -> ZombieEntity body.
    // All TTK calibrated for OWRPGValidator (normal 0.8-4.5s, boss 18-55s).
    const ENEMIES = {
        raider: { name: 'Basin Raider', kind: 'bot', faction: 'raiders', weapon: 'aks74u', hp: 120, armor: 5, lvl: 2, xp: 30, loot: 'raider' },
        raider_marksman: { name: 'Raider Marksman', kind: 'bot', faction: 'raiders', weapon: 'kar98k_irons', hp: 100, armor: 0, lvl: 3, xp: 40, loot: 'raider' },
        raider_pyro: { name: 'Basin Pyro', kind: 'bot', faction: 'raiders', weapon: 'aks74u', hp: 165, armor: 10, lvl: 4, xp: 52, loot: 'raider', elem: 'burn', weak: 'chill' },
        raider_bruiser: { name: 'Scrap Bruiser', kind: 'bot', faction: 'raiders', weapon: 'r870', hp: 230, armor: 18, lvl: 5, xp: 68, loot: 'raider', weak: 'shock' },
        raider_boss: { name: 'Gutter King Vasko', kind: 'bot', faction: 'raiders', weapon: 'aa12', hp: 2200, armor: 20, lvl: 5, xp: 220, loot: 'boss', boss: true },

        enforcer: { name: 'Syndicate Enforcer', kind: 'bot', faction: 'syndicate', weapon: 'spas12_tac', hp: 180, armor: 15, lvl: 6, xp: 55, loot: 'syndicate' },
        syn_gunner: { name: 'Syndicate Gunner', kind: 'bot', faction: 'syndicate', weapon: 'rpd', hp: 220, armor: 20, lvl: 7, xp: 65, loot: 'syndicate' },
        syn_arc_tech: { name: 'Syndicate Arc-Tech', kind: 'bot', faction: 'syndicate', weapon: 'p90', hp: 210, armor: 18, lvl: 8, xp: 75, loot: 'syndicate', elem: 'shock', weak: 'venom' },
        syn_sniper: { name: 'Syndicate Deadeye', kind: 'bot', faction: 'syndicate', weapon: 'dragunov_svd', hp: 175, armor: 12, lvl: 9, xp: 85, loot: 'syndicate', weak: 'void' },

        militia: { name: 'Freestead Ranger', kind: 'bot', faction: 'militia', weapon: 'm16a4', hp: 160, armor: 10, lvl: 5, xp: 45, loot: 'militia' },
        militia_scout: { name: 'Freestead Pathfinder', kind: 'bot', faction: 'militia', weapon: 'mp5', hp: 140, armor: 8, lvl: 4, xp: 40, loot: 'militia' },

        aegis: { name: 'Aegis Trooper', kind: 'bot', faction: 'aegis', weapon: 'scarh', hp: 240, armor: 35, lvl: 12, xp: 90, loot: 'aegis', weak: 'shock' },
        aegis_heavy: { name: 'Aegis Heavy Trooper', kind: 'bot', faction: 'aegis', weapon: 'm249', hp: 340, armor: 42, lvl: 13, xp: 115, loot: 'aegis', weak: 'shock' },
        aegis_cryo: { name: 'Aegis Cryo-Specialist', kind: 'bot', faction: 'aegis', weapon: 'acr_68', hp: 270, armor: 30, lvl: 14, xp: 125, loot: 'aegis', elem: 'chill', weak: 'burn' },

        helix: { name: 'Helix Acolyte', kind: 'bot', faction: 'helix', weapon: 'vector_kriss', hp: 200, armor: 10, lvl: 14, xp: 95, loot: 'helix', weak: 'burn' },
        helix_zealot: { name: 'Helix Blight Zealot', kind: 'bot', faction: 'helix', weapon: 'an94_abakan', hp: 290, armor: 18, lvl: 15, xp: 130, loot: 'helix', elem: 'venom', weak: 'burn' },
        helix_voidweaver: { name: 'Helix Voidweaver', kind: 'bot', faction: 'helix', weapon: 'f2000', hp: 310, armor: 20, lvl: 16, xp: 145, loot: 'helix', elem: 'void', weak: 'chill' },

        crawler: { name: 'Brood Crawler', kind: 'beast', faction: 'brood', body: 'ankle_biter', hp: 90, armor: 0, lvl: 2, xp: 22, speed: 4.4, dmg: 9, loot: 'brood' },
        brood_venom_mite: { name: 'Brood Venom Mite', kind: 'beast', faction: 'brood', body: 'nova_crawler', hp: 135, armor: 4, lvl: 4, xp: 34, speed: 4.5, dmg: 11, loot: 'brood', elem: 'venom', weak: 'burn' },
        stalker: { name: 'Brood Stalker', kind: 'beast', faction: 'brood', body: 'sprinter', hp: 150, armor: 5, lvl: 5, xp: 40, speed: 5.0, dmg: 14, loot: 'brood' },
        spitter: { name: 'Brood Spitter', kind: 'beast', faction: 'brood', body: 'hunch_spitter', hp: 130, armor: 0, lvl: 6, xp: 45, speed: 3.0, dmg: 12, ranged: true, loot: 'brood', elem: 'venom' },
        brood_blight_hound: { name: 'Blight Hound', kind: 'beast', faction: 'brood', body: 'hellhound', hp: 210, armor: 10, lvl: 7, xp: 62, speed: 5.2, dmg: 18, loot: 'brood', elem: 'venom', weak: 'burn' },
        brute: { name: 'Brood Brute', kind: 'beast', faction: 'brood', body: 'club_goliath', hp: 480, armor: 30, lvl: 9, xp: 120, speed: 3.2, dmg: 28, loot: 'brood' },
        brood_frost_wraith: { name: 'Mire Frost Wraith', kind: 'beast', faction: 'brood', body: 'frost_wraith', hp: 280, armor: 15, lvl: 10, xp: 95, speed: 4.1, dmg: 21, loot: 'brood', elem: 'chill', weak: 'burn' },
        brood_pyro_fiend: { name: 'Quarry Ash Fiend', kind: 'beast', faction: 'brood', body: 'pyro_fiend', hp: 310, armor: 18, lvl: 11, xp: 105, speed: 3.8, dmg: 24, loot: 'brood', elem: 'burn', weak: 'chill' },
        brood_iron_goliath: { name: 'Ironhide Goliath', kind: 'beast', faction: 'brood', body: 'iron_juggernaut', hp: 440, armor: 38, lvl: 14, xp: 150, speed: 3.0, dmg: 32, loot: 'brood', weak: 'shock' },
        brood_void_stalker: { name: 'Crater Void Stalker', kind: 'beast', faction: 'brood', body: 'aether_revenant', hp: 420, armor: 22, lvl: 17, xp: 175, speed: 4.4, dmg: 30, ranged: true, loot: 'brood', elem: 'void', weak: 'chill' },

        matriarch: { name: 'Culvert Matriarch', kind: 'beast', faction: 'brood', body: 'bloater', hp: 2400, armor: 25, lvl: 6, xp: 400, speed: 2.6, dmg: 30, loot: 'boss', boss: true, weak: 'chill', elem: 'venom' },
        boss_mire_hydra: { name: 'Mire Plague Hydra', kind: 'beast', faction: 'brood', body: 'boss_plague', hp: 4600, armor: 25, lvl: 10, xp: 650, speed: 2.8, dmg: 34, ranged: true, loot: 'boss', boss: true, weak: 'burn', elem: 'venom' },
        boss_quarry_colossus: { name: 'Ash Quarry Colossus', kind: 'beast', faction: 'brood', body: 'boss_colossus', hp: 5400, armor: 35, lvl: 12, xp: 800, speed: 2.5, dmg: 42, loot: 'boss', boss: true, weak: 'shock', elem: 'burn' },
        boss_alpine_warden: { name: 'Rogue Mecha Unit X-9', kind: 'bot', faction: 'aegis', weapon: 'minigun_death', hp: 5800, armor: 45, lvl: 15, xp: 1050, loot: 'boss', boss: true, weak: 'shock', elem: 'shock' },
        boss_meridian_sovereign: { name: 'The Meridian Sovereign', kind: 'beast', faction: 'brood', body: 'boss_nyx', hp: 7200, armor: 35, lvl: 18, xp: 1500, speed: 3.1, dmg: 46, ranged: true, loot: 'boss', boss: true, weak: 'chill', elem: 'void' }
    };

    /* --------------------------------------------------------- items */
    // type: weapon | consumable | junk | quest | rig | helmet | boots | relic | tool
    const ITEMS = {
        w_pistol: { name: 'Service Pistol', type: 'weapon', base: 'm1911', weight: 1.2, value: 60, rarity: 'common', suppressed: true },
        w_carbine: { name: 'Ranger Carbine', type: 'weapon', base: 'm16a4', weight: 3.4, value: 220, rarity: 'common' },
        w_smg: { name: 'Krinkov Sprayer', type: 'weapon', base: 'aks74u', weight: 2.6, value: 180, rarity: 'common' },
        w_shotgun: { name: 'Breacher 12', type: 'weapon', base: 'spas12_tac', weight: 3.8, value: 260, rarity: 'common', req: ['BRW', 5] },
        w_rifle: { name: 'Homestead Bolt Rifle', type: 'weapon', base: 'kar98k_irons', weight: 4.0, value: 240, rarity: 'common', req: ['PRC', 5] },
        w_lmg: { name: 'Rail Baron LMG', type: 'weapon', base: 'rpd', weight: 8.5, value: 420, rarity: 'rare', req: ['BRW', 7] },
        w_dmr: { name: 'Aegis Marksman', type: 'weapon', base: 'mk14', weight: 4.6, value: 520, rarity: 'rare', req: ['PRC', 6], suppressed: true },
        w_vector: { name: 'Helix Whisper', type: 'weapon', base: 'vector_kriss', weight: 2.8, value: 480, rarity: 'rare', req: ['RFX', 6], suppressed: true },
        w_aa12: { name: "Vasko's Gutter Drum", type: 'weapon', base: 'aa12', weight: 5.5, value: 900, rarity: 'legendary', req: ['BRW', 6], fixedAffix: 'thermal' },
        // Rigs (armor).
        rig_light: { name: 'Scav Harness', type: 'rig', armor: 10, weight: 3, value: 90, rarity: 'common', maxDur: 100 },
        rig_plated: { name: 'Plated Rig', type: 'rig', armor: 25, weight: 9, value: 320, rarity: 'rare', req: ['BRW', 6], maxDur: 130 },
        rig_aegis: { name: 'Aegis Carapace', type: 'rig', armor: 40, weight: 12, value: 900, rarity: 'epic', req: ['BRW', 7], maxDur: 160 },
        // Consumables.
        medkit: { name: 'Med-Injector', type: 'consumable', weight: 0.3, value: 35, heal: 45, stack: true },
        stim: { name: 'Combat Stim', type: 'consumable', weight: 0.2, value: 50, stim: 10, stack: true },
        relay_cell: { name: 'Relay Cell', type: 'consumable', weight: 0.5, value: 80, stack: true, desc: 'Powers one Transit Pylon jump.' },
        ammo_box: { name: 'Ammo Box', type: 'consumable', weight: 1.0, value: 25, ammo: 1, stack: true },
        // Junk (salvage -> scrap).
        scrap_metal: { name: 'Scrap Metal', type: 'junk', weight: 1.0, value: 6, scrap: 2, stack: true },
        circuitry: { name: 'Circuitry', type: 'junk', weight: 0.3, value: 14, scrap: 4, stack: true },
        brood_gland: { name: 'Brood Gland', type: 'junk', weight: 0.4, value: 18, scrap: 1, stack: true },
        // Quest items.
        culvert_keycard: { name: 'Culvert Keycard', type: 'quest', weight: 0, value: 0, desc: 'Opens the Culvert Sublevel hatch.' },
        bypass_valve: { name: 'Syndicate Bypass Valve', type: 'quest', weight: 2, value: 0, desc: 'Pulled from Pump Three. Somebody planted this.' },
        syndicate_ledger: { name: 'Syndicate Ledger', type: 'quest', weight: 0.5, value: 0, desc: 'Payment records naming the Culvert job.' },
        pressure_schematic: { name: 'Pressure Schematic', type: 'quest', weight: 0, value: 0, desc: 'Lets a technician reroute flow at the surface junction.' },
        relay_fuse: { name: 'Relay Fuse', type: 'quest', weight: 0.5, value: 0, desc: 'Fits the Abandoned Relay mast.' },
        convoy_manifest: { name: 'Convoy Manifest', type: 'quest', weight: 0.2, value: 0, desc: 'The cargo list from the crashed Aegis convoy.' }
    };

    const RARITY = {
        common: { name: 'Common', color: '#cbd5e1', affixes: 0, mult: 1.0, armorMult: 1.0 },
        rare: { name: 'Rare', color: '#38bdf8', affixes: 1, mult: 1.12, armorMult: 1.25 },
        epic: { name: 'Epic', color: '#c084fc', affixes: 2, mult: 1.25, armorMult: 1.55 },
        legendary: { name: 'Legendary', color: '#fbbf24', affixes: 2, mult: 1.4, armorMult: 1.9 }
    };
    const ARMOR_RARITY_MULT = { common: 1.0, rare: 1.25, epic: 1.55, legendary: 1.9 };
    const MANUFACTURERS = ['Freestead', 'Ironclad', 'Aegis', 'Helix', 'Basin-made'];
    const AFFIXES = {
        thermal: { name: 'Thermal', desc: '15% chance to Burn on hit.', burnChance: 15 },
        cryo: { name: 'Cryo-lined', desc: '15% chance to Chill on hit.', chillChance: 15 },
        arcing: { name: 'Arcing', desc: '15% chance to Shock on hit.', shockChance: 15 },
        venomous: { name: 'Venomous', desc: '18% chance to apply Venom on hit.', venomChance: 18 },
        voidtouched: { name: 'Void-Touched', desc: '15% chance to apply Void on hit.', voidChance: 15 },
        piercing: { name: 'Piercing', desc: '+15 armor penetration.', pen: 15 },
        keen: { name: 'Keen', desc: '+25% weakspot damage.', critAdd: 0.25 },
        light: { name: 'Lightweight', desc: '-40% weight.', weightMult: 0.6 }
    };

    /* --------------------------------------------------------- loot */
    const LOOT = {
        raider: [['credits', 40, 8, 25], ['ammo_box', 25, 1, 1], ['scrap_metal', 30, 1, 2], ['medkit', 12, 1, 1], ['w_smg', 4, 1, 1]],
        syndicate: [['credits', 40, 20, 45], ['circuitry', 25, 1, 2], ['stim', 12, 1, 1], ['ammo_box', 20, 1, 1], ['w_shotgun', 5, 1, 1], ['w_lmg', 2, 1, 1]],
        militia: [['credits', 35, 10, 30], ['medkit', 20, 1, 1], ['ammo_box', 25, 1, 1], ['w_rifle', 5, 1, 1]],
        aegis: [['credits', 30, 30, 60], ['circuitry', 30, 1, 3], ['relay_cell', 8, 1, 1], ['w_dmr', 4, 1, 1], ['rig_plated', 3, 1, 1]],
        helix: [['credits', 30, 30, 60], ['brood_gland', 30, 1, 2], ['stim', 15, 1, 1], ['w_vector', 4, 1, 1]],
        brood: [['brood_gland', 50, 1, 2], ['scrap_metal', 20, 1, 1], ['credits', 15, 2, 10]],
        boss: [['credits', 100, 120, 200], ['medkit', 100, 2, 3], ['relay_cell', 60, 1, 1]],
        cache: [['credits', 60, 20, 60], ['medkit', 30, 1, 2], ['ammo_box', 40, 1, 2], ['circuitry', 30, 1, 2], ['relay_cell', 12, 1, 1], ['w_carbine', 6, 1, 1], ['rig_light', 6, 1, 1]],
        locked: [['credits', 100, 60, 140], ['relay_cell', 40, 1, 1], ['stim', 50, 1, 2], ['w_dmr', 10, 1, 1], ['rig_plated', 10, 1, 1]]
    };
    const PITY_GUARANTEE = 12;

    BO.OWRPGStatsData = {
        ATTRS, ATTR_IDS, ATTR_BASE, ATTR_MIN, ATTR_MAX, CREATION_POINTS, LEVEL_CAP,
        xpToNext, TIER_LEVELS, PERK_TREES, STATUSES, REACTIONS, ABILITIES, ENEMIES,
        ITEMS, RARITY, ARMOR_RARITY_MULT, MANUFACTURERS, AFFIXES, LOOT, PITY_GUARANTEE,
        perkIndex() {
            if (this._pi) return this._pi;
            const out = {};
            for (const [tree, t] of Object.entries(PERK_TREES)) {
                t.tiers.forEach((pair, tier) => pair.forEach((perk) => { out[perk.id] = { tree, tier, perk }; }));
            }
            return (this._pi = out);
        }
    };
})(window.BO);
