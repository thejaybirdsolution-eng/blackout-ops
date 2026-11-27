/* ============================================================================
   BLACKOUT OPS — Open World RPG · Flagship Expansion Data
   1) BO.OWRPGGunStats: RPG-only stats covering EVERY weapon in WeaponsData.ORDER
      (never mutating BO.WeaponsData!).
   2) 24+ new unlockable guns, 18+ multi-slot armor pieces (4 Armor Sets with
      2-pc & 3-pc bonuses), 10 durability-tracked field pickups/tools,
      12+ unlockable Powers (incl. Ultimate slot), 4 Mounts, Bounties & Codex.
============================================================================ */
(function (BO) {
    'use strict';

    const PASSIVE_TRAITS = {
        executioner: { name: 'Executioner', desc: '+35% damage against targets below 35% HP.' },
        chain_arc: { name: 'Chain Arc', desc: '25% chance on hit to arc Shock damage to a nearby foe.' },
        venom_fang: { name: 'Venom Fang', desc: 'Applies Venom stacks and deals +15% damage vs poisoned targets.' },
        void_siphon: { name: 'Void Siphon', desc: 'Siphons 4% of damage dealt as HP (+6 HP on kill).' },
        armor_shredder: { name: 'Armor Shredder', desc: 'Hits shred 15% enemy armor (stacks up to 45%).' },
        headhunter: { name: 'Headhunter', desc: '+30% weakspot damage; weakspot kills refund 25% cooldowns.' },
        scavenger: { name: 'Scavenger', desc: 'Kills yield +12 bonus credits and refill 10% magazine.' },
        heat_sink: { name: 'Heat Sink', desc: 'Every 4th hit triggers bonus Burn damage & applies Burn.' },
        frostbite: { name: 'Frostbite', desc: '+20% damage vs Chilled foes and extends Chill duration.' },
        overcharge: { name: 'Overcharge', desc: 'Shock hits restore +6% Ultimate charge.' },
        bloodlust: { name: 'Bloodlust', desc: 'Close-range (<6m) & melee kills heal 12 HP.' },
        kinetic_slam: { name: 'Kinetic Slam', desc: 'Weakspot hits stagger briefly and gain +18 Armor Pen.' }
    };

    const CAT_BASELINE = {
        'Assault Rifle': { rpgDmgMult: 1.05, critChance: 0.08, critMultBonus: 0.12, armorPen: 10, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 140, passiveTrait: 'armor_shredder' },
        'SMG': { rpgDmgMult: 1.00, critChance: 0.10, critMultBonus: 0.08, armorPen: 6, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 130, passiveTrait: 'scavenger' },
        'Shotgun': { rpgDmgMult: 1.12, critChance: 0.06, critMultBonus: 0.10, armorPen: 12, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 150, passiveTrait: 'bloodlust' },
        'LMG': { rpgDmgMult: 1.10, critChance: 0.05, critMultBonus: 0.08, armorPen: 16, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 180, passiveTrait: 'heat_sink' },
        'Sniper Rifle': { rpgDmgMult: 1.25, critChance: 0.18, critMultBonus: 0.35, armorPen: 28, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 135, passiveTrait: 'headhunter' },
        'Marksman Rifle': { rpgDmgMult: 1.18, critChance: 0.15, critMultBonus: 0.25, armorPen: 20, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 140, passiveTrait: 'kinetic_slam' },
        'Pistol': { rpgDmgMult: 1.08, critChance: 0.12, critMultBonus: 0.18, armorPen: 8, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 120, passiveTrait: 'executioner' },
        'Launcher': { rpgDmgMult: 1.30, critChance: 0.04, critMultBonus: 0.05, armorPen: 35, element: 'burn', elemDmg: 22, statusChance: 35, maxDurability: 110, passiveTrait: 'heat_sink' },
        'Melee Weapon': { rpgDmgMult: 1.20, critChance: 0.16, critMultBonus: 0.25, armorPen: 22, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 170, passiveTrait: 'bloodlust' },
        'Magic Weapon': { rpgDmgMult: 1.35, critChance: 0.14, critMultBonus: 0.22, armorPen: 30, element: 'void', elemDmg: 28, statusChance: 38, maxDurability: 160, passiveTrait: 'void_siphon' }
    };

    const CURATED_GUN_OVERRIDES = {
        m1911: { rpgDmgMult: 1.08, critChance: 0.12, critMultBonus: 0.15, armorPen: 8, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 120, tier: 1, unlockReq: 'Starter Sidearm', passiveTrait: 'executioner' },
        m16a4: { rpgDmgMult: 1.05, critChance: 0.10, critMultBonus: 0.15, armorPen: 10, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 145, tier: 1, unlockReq: 'Starter Carbine', passiveTrait: 'headhunter' },
        aks74u: { rpgDmgMult: 1.06, critChance: 0.10, critMultBonus: 0.10, armorPen: 8, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 135, tier: 1, unlockReq: 'Raider Drop / Fence', passiveTrait: 'scavenger' },
        spas12_tac: { rpgDmgMult: 1.15, critChance: 0.08, critMultBonus: 0.12, armorPen: 14, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 150, tier: 2, unlockReq: 'Syndicate Fence', passiveTrait: 'kinetic_slam' },
        kar98k_irons: { rpgDmgMult: 1.22, critChance: 0.18, critMultBonus: 0.30, armorPen: 22, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 140, tier: 1, unlockReq: 'Dottie Store', passiveTrait: 'headhunter' },
        rpd: { rpgDmgMult: 1.16, critChance: 0.06, critMultBonus: 0.10, armorPen: 18, element: 'burn', elemDmg: 10, statusChance: 15, maxDurability: 185, tier: 2, unlockReq: 'Syndicate Fence', passiveTrait: 'heat_sink' },
        mk14: { rpgDmgMult: 1.24, critChance: 0.16, critMultBonus: 0.28, armorPen: 24, element: 'shock', elemDmg: 12, statusChance: 18, maxDurability: 155, tier: 3, unlockReq: 'Aegis Quartermaster', passiveTrait: 'overcharge' },
        vector_kriss: { rpgDmgMult: 1.14, critChance: 0.14, critMultBonus: 0.18, armorPen: 12, element: 'venom', elemDmg: 9, statusChance: 18, maxDurability: 140, tier: 3, unlockReq: 'Helix Exchange', passiveTrait: 'venom_fang' },
        aa12: { rpgDmgMult: 1.28, critChance: 0.08, critMultBonus: 0.15, armorPen: 18, element: 'burn', elemDmg: 14, statusChance: 22, maxDurability: 170, tier: 4, unlockReq: 'Gutter King Vasko', passiveTrait: 'heat_sink' },
        m4a1: { rpgDmgMult: 1.18, critChance: 0.12, critMultBonus: 0.18, armorPen: 14, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 160, tier: 2, unlockReq: 'Workbench Trials Quest', passiveTrait: 'armor_shredder' },
        ak47: { rpgDmgMult: 1.20, critChance: 0.09, critMultBonus: 0.16, armorPen: 16, element: 'burn', elemDmg: 10, statusChance: 14, maxDurability: 175, tier: 2, unlockReq: 'Rail Yard Fence', passiveTrait: 'scavenger' },
        scarh: { rpgDmgMult: 1.28, critChance: 0.14, critMultBonus: 0.24, armorPen: 26, element: 'shock', elemDmg: 14, statusChance: 20, maxDurability: 175, tier: 3, unlockReq: 'Rogue Mecha Quest', passiveTrait: 'armor_shredder' },
        acr_68: { rpgDmgMult: 1.26, critChance: 0.16, critMultBonus: 0.22, armorPen: 20, element: 'chill', elemDmg: 14, statusChance: 22, maxDurability: 165, tier: 3, unlockReq: 'Aegis Quartermaster', passiveTrait: 'frostbite' },
        an94_abakan: { rpgDmgMult: 1.25, critChance: 0.14, critMultBonus: 0.22, armorPen: 18, element: 'chill', elemDmg: 15, statusChance: 24, maxDurability: 165, tier: 3, unlockReq: 'Mire Plague Quest', passiveTrait: 'frostbite' },
        galil_ar: { rpgDmgMult: 1.22, critChance: 0.11, critMultBonus: 0.18, armorPen: 16, element: 'venom', elemDmg: 11, statusChance: 18, maxDurability: 170, tier: 3, unlockReq: 'Codex: 50 Kills', passiveTrait: 'venom_fang' },
        p90: { rpgDmgMult: 1.18, critChance: 0.13, critMultBonus: 0.15, armorPen: 14, element: 'shock', elemDmg: 10, statusChance: 18, maxDurability: 155, tier: 2, unlockReq: 'Syndicate Arc-Tech Drop', passiveTrait: 'chain_arc' },
        ump45: { rpgDmgMult: 1.16, critChance: 0.12, critMultBonus: 0.16, armorPen: 12, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 150, tier: 2, unlockReq: 'Dottie Store', passiveTrait: 'executioner' },
        mp7_navy: { rpgDmgMult: 1.20, critChance: 0.16, critMultBonus: 0.22, armorPen: 18, element: 'void', elemDmg: 10, statusChance: 16, maxDurability: 155, tier: 3, unlockReq: 'Ghost Codex Milestone', passiveTrait: 'executioner' },
        m40a3_cod4: { rpgDmgMult: 1.28, critChance: 0.20, critMultBonus: 0.35, armorPen: 26, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 145, tier: 2, unlockReq: 'Militia Trusted', passiveTrait: 'headhunter' },
        intervention: { rpgDmgMult: 1.38, critChance: 0.24, critMultBonus: 0.45, armorPen: 34, element: 'shock', elemDmg: 20, statusChance: 28, maxDurability: 160, tier: 4, unlockReq: 'Alpine Dish Cache', passiveTrait: 'headhunter' },
        barrett_50cal: { rpgDmgMult: 1.45, critChance: 0.22, critMultBonus: 0.50, armorPen: 45, element: 'burn', elemDmg: 26, statusChance: 30, maxDurability: 175, tier: 4, unlockReq: 'Codex: 3 Bosses', passiveTrait: 'kinetic_slam' },
        deagle: { rpgDmgMult: 1.22, critChance: 0.15, critMultBonus: 0.25, armorPen: 18, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 140, tier: 2, unlockReq: 'Syndicate Fence', passiveTrait: 'executioner' },
        gold_deagle_cod4: { rpgDmgMult: 1.38, critChance: 0.22, critMultBonus: 0.40, armorPen: 26, element: 'burn', elemDmg: 16, statusChance: 24, maxDurability: 180, tier: 4, unlockReq: 'Codex: 100 Kills', passiveTrait: 'scavenger' },
        python_magnum: { rpgDmgMult: 1.26, critChance: 0.18, critMultBonus: 0.30, armorPen: 20, element: 'venom', elemDmg: 14, statusChance: 22, maxDurability: 150, tier: 3, unlockReq: 'Mire Cache', passiveTrait: 'venom_fang' },
        m249: { rpgDmgMult: 1.22, critChance: 0.08, critMultBonus: 0.12, armorPen: 22, element: 'shock', elemDmg: 12, statusChance: 16, maxDurability: 200, tier: 3, unlockReq: 'Aegis Quartermaster', passiveTrait: 'overcharge' },
        mg42_buzzsaw: { rpgDmgMult: 1.28, critChance: 0.08, critMultBonus: 0.14, armorPen: 22, element: 'burn', elemDmg: 12, statusChance: 18, maxDurability: 210, tier: 4, unlockReq: 'Quarry Colossus Drop', passiveTrait: 'heat_sink' },
        minigun_death: { rpgDmgMult: 1.36, critChance: 0.10, critMultBonus: 0.16, armorPen: 28, element: 'shock', elemDmg: 16, statusChance: 22, maxDurability: 240, tier: 4, unlockReq: 'Rogue Mecha X-9', passiveTrait: 'overcharge' },
        rpg7_warhead: { rpgDmgMult: 1.40, critChance: 0.05, critMultBonus: 0.10, armorPen: 40, element: 'burn', elemDmg: 35, statusChance: 45, maxDurability: 125, tier: 4, unlockReq: 'Syndicate Sworn', passiveTrait: 'kinetic_slam' },
        model_1887_mw2: { rpgDmgMult: 1.26, critChance: 0.12, critMultBonus: 0.20, armorPen: 16, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 165, tier: 3, unlockReq: 'Rust Sprawl Bounty', passiveTrait: 'bloodlust' },
        ksg_slug: { rpgDmgMult: 1.30, critChance: 0.16, critMultBonus: 0.30, armorPen: 28, element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 165, tier: 3, unlockReq: 'Quarry Titans Quest', passiveTrait: 'kinetic_slam' },
        stg44: { rpgDmgMult: 1.20, critChance: 0.12, critMultBonus: 0.20, armorPen: 16, element: 'burn', elemDmg: 12, statusChance: 18, maxDurability: 170, tier: 3, unlockReq: 'Old-World Cache', passiveTrait: 'scavenger' },
        f2000: { rpgDmgMult: 1.24, critChance: 0.14, critMultBonus: 0.20, armorPen: 18, element: 'void', elemDmg: 14, statusChance: 22, maxDurability: 160, tier: 3, unlockReq: 'Helix Exchange', passiveTrait: 'void_siphon' },
        raygun: { rpgDmgMult: 1.42, critChance: 0.16, critMultBonus: 0.25, armorPen: 32, element: 'venom', elemDmg: 30, statusChance: 40, maxDurability: 180, tier: 4, unlockReq: 'Meridian Containment Event', passiveTrait: 'venom_fang' },
        tesla_wunder: { rpgDmgMult: 1.48, critChance: 0.14, critMultBonus: 0.20, armorPen: 35, element: 'shock', elemDmg: 34, statusChance: 45, maxDurability: 180, tier: 4, unlockReq: 'Aegis Sworn / Codex', passiveTrait: 'chain_arc' },
        void_singularity: { rpgDmgMult: 1.50, critChance: 0.16, critMultBonus: 0.25, armorPen: 36, element: 'void', elemDmg: 36, statusChance: 45, maxDurability: 185, tier: 4, unlockReq: 'Helix Cipher Quest', passiveTrait: 'void_siphon' },
        inferno_drake: { rpgDmgMult: 1.45, critChance: 0.12, critMultBonus: 0.20, armorPen: 28, element: 'burn', elemDmg: 32, statusChance: 45, maxDurability: 185, tier: 4, unlockReq: 'Quarry Boss Milestone', passiveTrait: 'heat_sink' }
    };

    const ELEM_BY_MAGIC = {
        plasma_splash: 'venom', chain_lightning: 'shock', cone_shockwave: 'shock',
        frost_cone: 'chill', shrink_ray: 'void', microwave_pop: 'burn',
        solar_pillar: 'shock', acid_swarm: 'venom', paralyzer_beam: 'chill',
        black_hole: 'void', dragon_breath: 'burn', soul_drain: 'void',
        chrono_rift: 'chill', chaos_storm: 'void', megaman_plasma: 'shock'
    };

    const OWRPGGunStats = {};
    const order = (BO.WeaponsData && BO.WeaponsData.ORDER) || [];
    for (let idx = 0; idx < order.length; idx++) {
        const id = order[idx];
        const w = BO.WeaponsData.get(id);
        const base = CAT_BASELINE[w.category] || CAT_BASELINE['Assault Rifle'];
        const tier = w.kind === 'magic' ? 4 : (w.tier === 'uncommon' ? 3 : (w.unlockLevel >= 16 ? 2 : 1));
        const lvlScale = 1 + Math.min(0.28, (w.unlockLevel || 1) * 0.008);
        const elem = w.magicType ? (ELEM_BY_MAGIC[w.magicType] || 'void') : base.element;
        const ov = CURATED_GUN_OVERRIDES[id] || {};
        const passiveTrait = ov.passiveTrait || base.passiveTrait;
        const entry = {
            rpgDmgMult: Number((ov.rpgDmgMult || (base.rpgDmgMult * lvlScale)).toFixed(2)),
            critChance: ov.critChance !== undefined ? ov.critChance : base.critChance,
            critMultBonus: ov.critMultBonus !== undefined ? ov.critMultBonus : base.critMultBonus,
            armorPen: ov.armorPen !== undefined ? ov.armorPen : (base.armorPen + (tier - 1) * 4),
            element: ov.element || elem,
            elemDmg: ov.elemDmg !== undefined ? ov.elemDmg : base.elemDmg,
            statusChance: ov.statusChance !== undefined ? ov.statusChance : base.statusChance,
            maxDurability: ov.maxDurability || (base.maxDurability + (tier - 1) * 15),
            tier: ov.tier || tier,
            unlockReq: ov.unlockReq || (tier >= 3 ? 'Expanse Drop / Faction Vendor' : 'Meridian Frontier'),
            passiveTrait,
            passiveDesc: PASSIVE_TRAITS[passiveTrait]?.desc || ''
        };
        OWRPGGunStats[id] = entry;
    }

    function getGunStats(weaponId) {
        return OWRPGGunStats[weaponId] || {
            rpgDmgMult: 1.0, critChance: 0.08, critMultBonus: 0.1, armorPen: 8,
            element: 'kinetic', elemDmg: 0, statusChance: 0, maxDurability: 140,
            tier: 1, unlockReq: 'Meridian Frontier', passiveTrait: 'armor_shredder',
            passiveDesc: PASSIVE_TRAITS.armor_shredder.desc
        };
    }

    /* --------------------------------------------------------- 4 Armor Sets */
    const ARMOR_SETS = {
        warden_vanguard: {
            id: 'warden_vanguard', name: 'Warden Vanguard', color: '#f5a623',
            bonus2: { label: '2-Piece: +25 Max HP, +10 Armor', maxHp: 25, armor: 10 },
            bonus3: { label: '3-Piece: Detonators heal 18 HP & +25% Reaction Damage', detHeal: 18, reactMult: 0.25 }
        },
        ironclad_juggernaut: {
            id: 'ironclad_juggernaut', name: 'Ironclad Juggernaut', color: '#ef4444',
            bonus2: { label: '2-Piece: +20 Armor, +15 kg Carry Weight', armor: 20, carry: 15 },
            bonus3: { label: '3-Piece: +25 Armor Pen & +15% Heavy/Shotgun Damage', heavyPen: 25, heavyDmg: 0.15 }
        },
        ghost_stalker: {
            id: 'ghost_stalker', name: 'Ghost Stalker', color: '#a3e635',
            bonus2: { label: '2-Piece: -20% Noise, +10% Move Speed', noise: -0.20, speedMult: 0.10 },
            bonus3: { label: '3-Piece: +35% Weakspot Mult & +0.5x Sneak Mult', critAdd: 0.35, stealthMult: 0.5 }
        },
        meridian_arctech: {
            id: 'meridian_arctech', name: 'Meridian Arc-Tech', color: '#38bdf8',
            bonus2: { label: '2-Piece: -15% Cooldowns, +20% Status Potency', cdr: 0.15, statusPotency: 0.20 },
            bonus3: { label: '3-Piece: +12% All Elem Resist & Reactions Chain +1', allElemRes: 0.12, chain: 1 }
        }
    };

    /* --------------------------------------------------------- 24+ New Guns */
    const NEW_GUNS = {
        w_m4a1_warden: { name: "Warden's SOPMOD M4", type: 'weapon', base: 'm4a1', weight: 3.3, value: 380, rarity: 'rare', req: ['RFX', 5] },
        w_ak47_rust: { name: 'Rail-Forged AK-47', type: 'weapon', base: 'ak47', weight: 3.9, value: 410, rarity: 'rare', req: ['BRW', 6], fixedAffix: 'thermal' },
        w_scar_aegis: { name: 'Aegis Director SCAR-H', type: 'weapon', base: 'scarh', weight: 4.3, value: 780, rarity: 'epic', req: ['BRW', 7], fixedAffix: 'arcing' },
        w_acr_specops: { name: 'Alpine Cryo ACR', type: 'weapon', base: 'acr_68', weight: 3.6, value: 720, rarity: 'epic', req: ['PRC', 6], fixedAffix: 'cryo', suppressed: true },
        w_p90_arc: { name: 'Volt-Coil P90', type: 'weapon', base: 'p90', weight: 2.7, value: 460, rarity: 'rare', req: ['TCH', 5], fixedAffix: 'arcing' },
        w_ump45_enforcer: { name: 'Ironclad UMP45', type: 'weapon', base: 'ump45', weight: 2.8, value: 340, rarity: 'rare', req: ['RFX', 5] },
        w_mp7_ghost: { name: 'Phantom MP7A1', type: 'weapon', base: 'mp7_navy', weight: 2.2, value: 640, rarity: 'epic', req: ['RFX', 7], suppressed: true, fixedAffix: 'voidtouched' },
        w_m40a3_ranger: { name: 'Basin Watch M40A3', type: 'weapon', base: 'm40a3_cod4', weight: 4.5, value: 440, rarity: 'rare', req: ['PRC', 6] },
        w_intervention_apex: { name: 'Apex Intervention .408', type: 'weapon', base: 'intervention', weight: 6.2, value: 1150, rarity: 'legendary', req: ['PRC', 8], fixedAffix: 'keen' },
        w_barrett_anti: { name: 'Crater-Buster .50 Cal', type: 'weapon', base: 'barrett_50cal', weight: 8.8, value: 1350, rarity: 'legendary', req: ['BRW', 8], fixedAffix: 'piercing' },
        w_deagle_judge: { name: 'Rail Marshal Deagle', type: 'weapon', base: 'deagle', weight: 1.9, value: 420, rarity: 'rare', req: ['BRW', 5], fixedAffix: 'piercing' },
        w_gold_deagle_king: { name: '24K Sovereign Eagle', type: 'weapon', base: 'gold_deagle_cod4', weight: 1.9, value: 1200, rarity: 'legendary', req: ['PRS', 7], fixedAffix: 'keen' },
        w_python_frontier: { name: 'Mirefang .357 Python', type: 'weapon', base: 'python_magnum', weight: 1.7, value: 540, rarity: 'epic', req: ['PRC', 6], fixedAffix: 'venomous' },
        w_m249_bastion: { name: 'Aegis Bastion SAW', type: 'weapon', base: 'm249', weight: 7.4, value: 760, rarity: 'epic', req: ['BRW', 7], fixedAffix: 'arcing' },
        w_mg42_scrap: { name: 'Quarry Buzzsaw MG42', type: 'weapon', base: 'mg42_buzzsaw', weight: 9.2, value: 1100, rarity: 'legendary', req: ['BRW', 8], fixedAffix: 'thermal' },
        w_minigun_titan: { name: 'Unit X-9 Rotary Minigun', type: 'weapon', base: 'minigun_death', weight: 12.5, value: 1550, rarity: 'legendary', req: ['BRW', 9], fixedAffix: 'arcing' },
        w_rpg7_demolisher: { name: 'Syndicate Siege RPG-7', type: 'weapon', base: 'rpg7_warhead', weight: 6.8, value: 980, rarity: 'epic', req: ['BRW', 7], fixedAffix: 'thermal' },
        w_model1887_twin: { name: 'Nomad Lever 1887', type: 'weapon', base: 'model_1887_mw2', weight: 3.6, value: 620, rarity: 'epic', req: ['RFX', 6] },
        w_ksg_breach: { name: 'Quarry Breacher KSG', type: 'weapon', base: 'ksg_slug', weight: 3.9, value: 680, rarity: 'epic', req: ['BRW', 6], fixedAffix: 'piercing' },
        w_galil_veteran: { name: 'Freestead Veteran Galil', type: 'weapon', base: 'galil_ar', weight: 3.7, value: 580, rarity: 'epic', req: ['PRC', 5], fixedAffix: 'venomous' },
        w_an94_cryo: { name: 'Boreal AN-94', type: 'weapon', base: 'an94_abakan', weight: 3.6, value: 740, rarity: 'epic', req: ['TCH', 6], fixedAffix: 'cryo' },
        w_stg44_relic: { name: 'Relic StG 44', type: 'weapon', base: 'stg44', weight: 4.1, value: 520, rarity: 'rare', req: ['BRW', 5], fixedAffix: 'thermal' },
        w_f2000_helix: { name: 'Helix Pulse F2000', type: 'weapon', base: 'f2000', weight: 3.5, value: 820, rarity: 'epic', req: ['TCH', 7], fixedAffix: 'voidtouched' },
        w_raygun_proto: { name: 'Meridian Proto Ray Gun', type: 'weapon', base: 'raygun', weight: 2.1, value: 1600, rarity: 'legendary', req: ['TCH', 7], fixedAffix: 'venomous' },
        w_tesla_coil: { name: 'Wunderwaffe Arc-Carbine', type: 'weapon', base: 'tesla_wunder', weight: 4.4, value: 1750, rarity: 'legendary', req: ['TCH', 8], fixedAffix: 'arcing' },
        w_void_staff: { name: 'Meridian Void Staff', type: 'weapon', base: 'void_singularity', weight: 3.8, value: 1850, rarity: 'legendary', req: ['TCH', 8], fixedAffix: 'voidtouched' },
        w_fire_staff: { name: 'Colossus Magma Staff', type: 'weapon', base: 'inferno_drake', weight: 3.8, value: 1700, rarity: 'legendary', req: ['TCH', 7], fixedAffix: 'thermal' }
    };

    /* --------------------------------------------------------- 18+ New Armor Pieces */
    const NEW_ARMOR = {
        // Helmets
        helm_scav: { name: 'Scrapper Respirator', type: 'helmet', armor: 6, weight: 1.2, value: 85, rarity: 'common', maxDur: 100, elemRes: { venom: 0.1 } },
        helm_warden: { name: 'Warden Ranger Visor', type: 'helmet', armor: 12, weight: 1.5, value: 320, rarity: 'rare', setId: 'warden_vanguard', maxDur: 130, elemRes: { burn: 0.12 }, stats: { critAdd: 0.08 } },
        helm_juggernaut: { name: 'Ironclad Blast Helm', type: 'helmet', armor: 18, weight: 2.6, value: 520, rarity: 'epic', setId: 'ironclad_juggernaut', req: ['BRW', 6], maxDur: 165, elemRes: { burn: 0.15, shock: 0.1 } },
        helm_ghost: { name: 'Ghost Recon Hood', type: 'helmet', armor: 9, weight: 0.9, value: 480, rarity: 'epic', setId: 'ghost_stalker', req: ['RFX', 6], maxDur: 125, stats: { critAdd: 0.12 } },
        helm_arctech: { name: 'Arc-Tech Neural Cowl', type: 'helmet', armor: 14, weight: 1.3, value: 740, rarity: 'legendary', setId: 'meridian_arctech', req: ['TCH', 7], maxDur: 150, elemRes: { shock: 0.2, void: 0.18 }, stats: { statusPotency: 0.12 } },
        // Rigs
        rig_warden: { name: 'Warden Vanguard Plate', type: 'rig', armor: 24, weight: 6.5, value: 450, rarity: 'rare', setId: 'warden_vanguard', req: ['BRW', 5], maxDur: 140, elemRes: { burn: 0.15 }, stats: { maxHp: 15 } },
        rig_juggernaut: { name: 'Ironclad Siege Rig', type: 'rig', armor: 38, weight: 11.0, value: 820, rarity: 'epic', setId: 'ironclad_juggernaut', req: ['BRW', 7], maxDur: 190, elemRes: { burn: 0.2, venom: 0.15 }, stats: { carry: 10 } },
        rig_ghost: { name: 'Ghost Stealth Harness', type: 'rig', armor: 18, weight: 3.5, value: 680, rarity: 'epic', setId: 'ghost_stalker', req: ['RFX', 6], maxDur: 130, elemRes: { chill: 0.15 }, stats: { noise: -0.15 } },
        rig_arctech: { name: 'Arc-Tech Exo-Vest', type: 'rig', armor: 30, weight: 5.5, value: 1100, rarity: 'legendary', setId: 'meridian_arctech', req: ['TCH', 7], maxDur: 170, elemRes: { shock: 0.25, void: 0.2 }, stats: { cdr: 0.1 } },
        // Boots
        boots_scav: { name: 'Patched Work Boots', type: 'boots', armor: 4, weight: 1.0, value: 70, rarity: 'common', maxDur: 100 },
        boots_warden: { name: 'Warden Trail Boots', type: 'boots', armor: 9, weight: 1.4, value: 280, rarity: 'rare', setId: 'warden_vanguard', maxDur: 130, elemRes: { venom: 0.12 }, stats: { speedMult: 0.05 } },
        boots_juggernaut: { name: 'Ironclad Mag-Greaves', type: 'boots', armor: 15, weight: 2.8, value: 490, rarity: 'epic', setId: 'ironclad_juggernaut', req: ['BRW', 6], maxDur: 165, elemRes: { shock: 0.18 }, stats: { carry: 8 } },
        boots_ghost: { name: 'Ghost Softstep Treads', type: 'boots', armor: 7, weight: 0.8, value: 510, rarity: 'epic', setId: 'ghost_stalker', req: ['RFX', 6], maxDur: 125, stats: { speedMult: 0.08, noise: -0.18 } },
        boots_arctech: { name: 'Arc-Tech Thruster Greaves', type: 'boots', armor: 11, weight: 1.2, value: 690, rarity: 'legendary', setId: 'meridian_arctech', req: ['TCH', 6], maxDur: 150, elemRes: { chill: 0.2, void: 0.12 }, stats: { speedMult: 0.09 } },
        // Relics
        relic_warden: { name: "Kessler's Ranger Star", type: 'relic', armor: 5, weight: 0.3, value: 420, rarity: 'rare', setId: 'warden_vanguard', maxDur: 140, stats: { maxHp: 20, detHeal: 8 } },
        relic_juggernaut: { name: 'Rail Baron Piston Core', type: 'relic', armor: 10, weight: 0.8, value: 640, rarity: 'epic', setId: 'ironclad_juggernaut', maxDur: 160, stats: { meleeMult: 0.2, armor: 8 } },
        relic_ghost: { name: 'Viper Optical Prism', type: 'relic', armor: 4, weight: 0.2, value: 620, rarity: 'epic', setId: 'ghost_stalker', maxDur: 135, stats: { critAdd: 0.15, stealthMult: 0.35 } },
        relic_arctech: { name: 'Meridian Harmonic Coil', type: 'relic', armor: 6, weight: 0.4, value: 950, rarity: 'legendary', setId: 'meridian_arctech', maxDur: 170, elemRes: { void: 0.25, shock: 0.2 }, stats: { statusPotency: 0.18, cdr: 0.08 } },
        relic_crater_shard: { name: 'Vitrified Crater Shard', type: 'relic', armor: 8, weight: 0.5, value: 880, rarity: 'legendary', maxDur: 160, elemRes: { burn: 0.22, void: 0.22 }, stats: { reactMult: 0.2 } },
        relic_brood_heart: { name: 'Matriarch Venom Heart', type: 'relic', armor: 6, weight: 0.6, value: 780, rarity: 'epic', maxDur: 150, elemRes: { venom: 0.35 }, stats: { maxHp: 22 } }
    };

    /* --------------------------------------------------------- 10+ Durability-Tracked Field Pickups / Tools */
    const NEW_TOOLS = {
        tool_scrap_flamer: { name: 'Scrap Flamer', type: 'tool', toolKind: 'flamer', weight: 3.0, value: 320, rarity: 'rare', maxDur: 60, wearPerUse: 6, dmg: 65, element: 'burn', range: 9, desc: 'Sprays a 9m cone of burning promethium. Degrades per burst.' },
        tool_breach_hammer: { name: 'Breaching Hammer', type: 'tool', toolKind: 'hammer', weight: 4.2, value: 340, rarity: 'rare', maxDur: 80, wearPerUse: 8, dmg: 110, element: 'expose', range: 4.5, desc: 'Shockwave maul that shatters armor and Exposes nearby enemies.' },
        tool_kinetic_shield: { name: 'Portable Kinetic Shield', type: 'tool', toolKind: 'shield', weight: 2.5, value: 420, rarity: 'epic', maxDur: 100, wearPerUse: 18, shieldHp: 60, durSec: 10, desc: 'Projects a 60 HP personal kinetic barrier for 10s.' },
        tool_arc_welder: { name: 'Arc Welder', type: 'tool', toolKind: 'welder', weight: 1.8, value: 260, rarity: 'rare', maxDur: 75, wearPerUse: 10, dmg: 55, element: 'shock', range: 12, desc: 'Zaps targets with Shock arcs or repairs equipped armor (+20 dur).' },
        tool_thermal_cutter: { name: 'Thermal Cutter', type: 'tool', toolKind: 'cutter', weight: 2.2, value: 310, rarity: 'rare', maxDur: 70, wearPerUse: 8, dmg: 80, element: 'burn', range: 7, desc: 'Superheated plasma torch slicing armor (+30 Pen) and applying Burn.' },
        tool_riot_plate: { name: 'Riot Plate Carrier', type: 'tool', toolKind: 'riot', weight: 3.5, value: 290, rarity: 'common', maxDur: 90, wearPerUse: 20, shieldHp: 45, durSec: 12, desc: 'Strap-on tactical plate granting +45 temporary barrier HP.' },
        tool_field_repair: { name: 'Field Repair Kit', type: 'tool', toolKind: 'repair_half', weight: 0.8, value: 95, rarity: 'common', maxDur: 30, wearPerUse: 15, desc: 'Restores 50% durability to all equipped weapons and armor (2 uses).' },
        tool_nano_patch: { name: 'Master Nano-Patch', type: 'tool', toolKind: 'repair_full', weight: 0.4, value: 220, rarity: 'epic', maxDur: 30, wearPerUse: 10, desc: 'Restores 100% durability to all equipped gear (3 uses).' },
        tool_overcharge_cell: { name: 'Overcharge Cell', type: 'tool', toolKind: 'overcharge', weight: 0.6, value: 180, rarity: 'rare', maxDur: 40, wearPerUse: 20, desc: 'Instantly resets Primer/Detonator cooldowns & grants +25% Ult charge (2 uses).' },
        tool_emergency_beacon: { name: 'Emergency Beacon', type: 'tool', toolKind: 'beacon', weight: 0.9, value: 240, rarity: 'rare', maxDur: 40, wearPerUse: 20, desc: 'Deploys a healing flare (+40 HP) and stuns hostiles within 8m (2 uses).' }
    };

    /* --------------------------------------------------------- Quest / Crafting / Mount Items */
    const NEW_MISC_ITEMS = {
        quarry_core_sample: { name: 'Quarry Core Sample', type: 'quest', weight: 0.5, value: 0, desc: 'Radioactive core drilled from Excavator Pit.' },
        mire_toxin_sample: { name: 'Mire Toxin Sample', type: 'quest', weight: 0.4, value: 0, desc: 'Concentrated bio-venom from Mire Delta.' },
        helix_cipher: { name: 'Helix Harmonic Cipher', type: 'quest', weight: 0.1, value: 0, desc: 'Encoded carrier-wave decryption slate.' },
        aegis_blackbox: { name: 'Aegis Flight Blackbox', type: 'quest', weight: 0.8, value: 0, desc: 'Encrypted telemetry from Bunker Delta.' },
        vasko_crest: { name: "Vasko's Scrap Crest", type: 'quest', weight: 0.3, value: 0, desc: 'Proof of Gutter King Vasko defeat.' },
        sovereign_core: { name: 'Sovereign Void Core', type: 'quest', weight: 0.6, value: 0, desc: 'Pulsing core recovered from the Meridian Sovereign.' },
        schematic_scout_bike: { name: 'Key: Scrap Scout Bike', type: 'quest', weight: 0, value: 0, desc: 'Unlocks the Scrap Scout Bike in your Mount Garage [T].' },
        schematic_hoverbike: { name: 'Key: Nomad Hoverbike', type: 'quest', weight: 0, value: 0, desc: 'Unlocks the Nomad Hoverbike in your Mount Garage [T].' },
        schematic_aegis_atv: { name: 'Key: Meridian Armored ATV', type: 'quest', weight: 0, value: 0, desc: 'Unlocks the Meridian Armored ATV in your Mount Garage [T].' },
        schematic_war_strider: { name: 'Key: Aegis War Strider', type: 'quest', weight: 0, value: 0, desc: 'Unlocks the Aegis War Strider in your Mount Garage [T].' }
    };

    /* --------------------------------------------------------- 12+ Unlockable Powers (incl. Ultimate) */
    const EXPANSION_ABILITIES = {
        primer: {
            venom_spit_dart: { name: 'Venom Dart', status: 'venom', cd: 8, dmg: 20, range: 45, desc: 'Fires a toxic dart applying 2 stacks of Venom.' },
            void_tether: { name: 'Void Tether', status: 'void', cd: 11, dmg: 22, range: 35, radius: 4.5, desc: 'Void orb that pulls targets slightly and applies Void.' },
            solar_flare: { name: 'Solar Flare', status: 'burn', cd: 11, dmg: 24, range: 32, radius: 5.0, desc: 'Wide plasma burst igniting all nearby enemies.' }
        },
        detonator: {
            seismic_slam: { name: 'Seismic Slam', cd: 13, dmg: 45, range: 0, radius: 8.5, desc: 'Slams the ground to detonate all enemies within 8.5m.' },
            void_implosion: { name: 'Void Implosion', cd: 14, dmg: 52, range: 35, radius: 6.5, desc: 'Remote singularity blast detonating statuses in 6.5m.' },
            venom_rupture: { name: 'Blight Catalyst', cd: 11, dmg: 48, range: 32, radius: 4.0, desc: 'Catalyzes statuses into toxic bursts with bonus damage.' }
        },
        gadget: {
            kinetic_barrier: { name: 'Kinetic Barrier', cd: 28, shield: 55, dur: 10, desc: 'Grants +55 temporary shield & +20% DR for 10s.' },
            nanite_field: { name: 'Nanite Field', cd: 30, heal: 65, desc: 'Regenerates 65 HP over 3s and boosts stamina.' },
            emp_pulse: { name: 'EMP Surge', cd: 24, dmg: 35, radius: 9, desc: 'Stuns nearby enemies for 2.2s and applies Shock.' }
        },
        ultimate: {
            orbital_barrage: { name: 'Orbital Barrage', cd: 55, dmg: 140, range: 45, radius: 8, element: 'burn', desc: 'Calls down twin thermite-arc strikes on target area.' },
            singularity_nova: { name: 'Singularity Nova', cd: 65, dmg: 165, range: 40, radius: 9, element: 'void', desc: 'Tears open a Void rift pulling foes inward and detonating all statuses.' },
            overdrive_protocol: { name: 'Overdrive Protocol', cd: 50, dur: 10, desc: '10s combat surge: +35% speed, +30% crit, lifesteal & instant reload.' },
            plague_tempest: { name: 'Plague Tempest', cd: 60, dmg: 130, range: 35, radius: 9, element: 'venom', desc: 'Unleashes a Venom + Chill storm that shreds armor and freezes.' }
        }
    };

    const POWER_UNLOCKS = {
        cryo_dart: { label: 'Starter', check: () => true },
        thermite: { label: 'Syndicate Trusted or TCH 7', check: (s) => BO.OWRPGFactions.rep(s, 'syndicate') >= 250 || BO.OWRPGCharacter.attr(s, 'TCH') >= 7 },
        arc_mine: { label: 'Aegis Trusted or TCH 8', check: (s) => BO.OWRPGFactions.rep(s, 'aegis') >= 250 || BO.OWRPGCharacter.attr(s, 'TCH') >= 8 },
        breach_bash: { label: 'BRW 7 or Militia Trusted', check: (s) => BO.OWRPGCharacter.attr(s, 'BRW') >= 7 || BO.OWRPGFactions.rep(s, 'militia') >= 250 },
        venom_spit_dart: { label: 'Quest: Brood Fever or Level 4', check: (s) => s.player.level >= 4 || s.quests.q_shale_nest?.state === 'completed' },
        void_tether: { label: 'Helix Trusted or Meridian Pylon', check: (s) => BO.OWRPGFactions.rep(s, 'helix') >= 250 || s.quests.q_helix_cipher?.state === 'completed' || s.player.level >= 10 },
        solar_flare: { label: 'Level 8 or 3 Pylons Online', check: (s) => s.player.level >= 8 || Object.values(s.pylons || {}).filter(Boolean).length >= 3 },
        arc_lash: { label: 'Starter', check: () => true },
        concussion: { label: 'Level 6', check: (s) => s.player.level >= 6 },
        seismic_slam: { label: 'BRW 6 or Gutter King Bounty', check: (s) => BO.OWRPGCharacter.attr(s, 'BRW') >= 6 || s.worldFlags.killed_raider_boss },
        void_implosion: { label: 'Level 9 or TCH 7', check: (s) => s.player.level >= 9 || BO.OWRPGCharacter.attr(s, 'TCH') >= 7 },
        venom_rupture: { label: 'Kill Mire Hydra or Level 7', check: (s) => s.player.level >= 7 || s.worldFlags.killed_boss_mire_hydra },
        med_injector: { label: 'Starter', check: () => true },
        decoy_holo: { label: 'Level 4 or any Ghost perk', check: (s) => s.player.level >= 4 || s.player.perks.some((p) => p.startsWith('ghost')) },
        kinetic_barrier: { label: 'Level 5 or Aegis Pylon', check: (s) => s.player.level >= 5 || !!s.pylons.py_check },
        nanite_field: { label: 'Militia Trusted or Level 7', check: (s) => s.player.level >= 7 || BO.OWRPGFactions.rep(s, 'militia') >= 250 },
        emp_pulse: { label: 'TCH 6 or Relay Lit', check: (s) => BO.OWRPGCharacter.attr(s, 'TCH') >= 6 || !!s.worldFlags.relay_lit },
        orbital_barrage: { label: 'Level 3 or Blackbox Quest', check: (s) => s.player.level >= 3 || s.quests.q_alpine_blackbox?.state === 'completed' },
        singularity_nova: { label: 'Slay Sovereign or Level 14', check: (s) => s.player.level >= 14 || !!s.worldFlags.killed_boss_meridian_sovereign },
        overdrive_protocol: { label: 'Level 5 or Slay Vasko', check: (s) => s.player.level >= 5 || !!s.worldFlags.killed_raider_boss },
        plague_tempest: { label: 'Slay Mire Hydra or Level 10', check: (s) => s.player.level >= 10 || !!s.worldFlags.killed_boss_mire_hydra }
    };

    /* --------------------------------------------------------- 4 Summonable Mounts */
    const MOUNTS = {
        scout_bike: {
            id: 'scout_bike', name: 'Scrap Scout Bike', speed: 14.5, boostSpeed: 20.5,
            dr: 0.1, jump: 7.5, color: 0xf59e0b, accent: 0x334155, hover: false,
            unlockLabel: 'Quest: Wheels for the Road (Freestead) or Buy from Torin',
            desc: 'Nimble frontier dirtbike built from Freestead salvage. Fast acceleration and tight turning.'
        },
        hoverbike: {
            id: 'hoverbike', name: 'Nomad Hoverbike', speed: 17.5, boostSpeed: 24.5,
            dr: 0.15, jump: 9.0, color: 0x38bdf8, accent: 0x1e293b, hover: true,
            unlockLabel: 'Quest: Rail Yard Smugglers or Level 6',
            desc: 'Mag-lev thruster bike that glides smoothly over Mire Delta marshes and rough scree.'
        },
        aegis_atv: {
            id: 'aegis_atv', name: 'Meridian Armored ATV', speed: 16.0, boostSpeed: 22.0,
            dr: 0.28, jump: 8.0, color: 0x64748b, accent: 0x0ea5e9, hover: false,
            unlockLabel: 'Quest: Iron on the Ridge (Alpine Array) or Aegis Trusted',
            desc: 'Heavy 4x4 tactical quad with plated rollcage granting +28% mounted damage reduction.'
        },
        war_strider: {
            id: 'war_strider', name: 'Aegis War Strider', speed: 14.0, boostSpeed: 19.5,
            dr: 0.42, jump: 10.5, color: 0xc084fc, accent: 0x1e1b4b, hover: false, strider: true,
            unlockLabel: 'Quest: Crown of the Crater (Meridian Core) or Level 15',
            desc: 'Articulated bipedal exo-walker with +42% mounted armor and seismic stomp landings.'
        }
    };

    /* --------------------------------------------------------- Bounties & Codex */
    const BOUNTIES = [
        { id: 'b_raiders', title: 'Clear Basin Raiders', target: 'raider', count: 5, region: 'haven_basin', xp: 180, credits: 140, rep: { militia: 60 }, desc: 'Eliminate 5 Basin Raiders menacing Haven roads.' },
        { id: 'b_crawlers', title: 'Exterminate Brood Crawlers', target: 'crawler', count: 6, region: 'haven_basin', xp: 160, credits: 120, rep: { militia: 50 }, desc: 'Cull 6 Brood Crawlers from the Basin ridges.' },
        { id: 'b_enforcers', title: 'Raid Syndicate Enforcers', target: 'enforcer', count: 4, region: 'rust_sprawl', xp: 240, credits: 210, rep: { militia: 80 }, desc: 'Take out 4 Syndicate Enforcers in Rust Sprawl.' },
        { id: 'b_mire', title: 'Mire Blight Sweep', target: 'brood_blight_hound', count: 4, region: 'mire_delta', xp: 290, credits: 240, rep: { aegis: 70 }, desc: 'Hunt 4 Blight Hounds across Mire Delta.' },
        { id: 'b_quarry', title: 'Quarry Ash Purging', target: 'brood_pyro_fiend', count: 3, region: 'ash_quarry', xp: 340, credits: 280, rep: { militia: 90 }, desc: 'Slay 3 Quarry Ash Fiends in Ash Quarry.' },
        { id: 'b_alpine', title: 'Rogue Aegis Patrol', target: 'aegis', count: 4, region: 'alpine_array', xp: 380, credits: 320, rep: { helix: 80 }, desc: 'Neutralize 4 Aegis Troopers in Alpine Array.' },
        { id: 'b_helix', title: 'Crater Void Purge', target: 'helix_voidweaver', count: 3, region: 'meridian_core', xp: 460, credits: 400, rep: { aegis: 110 }, desc: 'Defeat 3 Helix Voidweavers near Meridian Core.' }
    ];

    const CODEX_MILESTONES = [
        { id: 'cx_kills_25', title: 'Basin Hunter', desc: 'Defeat 25 enemies in the Meridian Expanse.', check: (s) => s.stats.kills >= 25, reward: { credits: 250, items: ['w_m4a1_warden'] } },
        { id: 'cx_kills_100', title: 'Expanse Legend', desc: 'Defeat 100 enemies.', check: (s) => s.stats.kills >= 100, reward: { credits: 600, items: ['w_gold_deagle_king'] } },
        { id: 'cx_react_20', title: 'Elemental Chemist', desc: 'Trigger 20 Elemental Reactions.', check: (s) => s.stats.reactions >= 20, reward: { credits: 300, items: ['w_p90_arc', 'tool_overcharge_cell'] } },
        { id: 'cx_disc_10', title: 'Cartographer', desc: 'Discover 10 Points of Interest.', check: (s) => s.stats.discovered >= 10, reward: { credits: 350, items: ['boots_ghost'] } },
        { id: 'cx_boss_3', title: 'Apex Slayer', desc: 'Defeat 3 Regional World Bosses.', check: (s) => ['killed_raider_boss', 'killed_matriarch', 'killed_boss_mire_hydra', 'killed_boss_quarry_colossus', 'killed_boss_alpine_warden', 'killed_boss_meridian_sovereign'].filter((k) => s.worldFlags[k]).length >= 3, reward: { credits: 800, items: ['w_barrett_anti', 'relic_crater_shard'] } },
        { id: 'cx_pylons_6', title: 'Grid Restorer', desc: 'Bring all 6 Transit Pylons online.', check: (s) => Object.values(s.pylons || {}).filter(Boolean).length >= 6, reward: { credits: 500, items: ['w_tesla_coil'] } }
    ];

    // Merge Expansion items, abilities, and loot tables into BO.OWRPGStatsData cleanly
    const SD = BO.OWRPGStatsData;
    if (SD) {
        Object.assign(SD.ITEMS, NEW_GUNS, NEW_ARMOR, NEW_TOOLS, NEW_MISC_ITEMS);
        for (const slot of ['primer', 'detonator', 'gadget', 'ultimate']) {
            SD.ABILITIES[slot] = Object.assign(SD.ABILITIES[slot] || {}, EXPANSION_ABILITIES[slot] || {});
        }
        // Enrich loot tables with new armor, tools, and weapons
        SD.LOOT.raider.push(['helm_scav', 4, 1, 1], ['boots_scav', 4, 1, 1], ['tool_field_repair', 5, 1, 1]);
        SD.LOOT.syndicate.push(['w_ak47_rust', 3, 1, 1], ['w_ump45_enforcer', 4, 1, 1], ['helm_juggernaut', 2, 1, 1], ['tool_thermal_cutter', 3, 1, 1]);
        SD.LOOT.militia.push(['helm_warden', 3, 1, 1], ['boots_warden', 3, 1, 1], ['w_m4a1_warden', 3, 1, 1]);
        SD.LOOT.aegis.push(['helm_arctech', 2, 1, 1], ['boots_arctech', 2, 1, 1], ['w_acr_specops', 2, 1, 1], ['tool_kinetic_shield', 2, 1, 1]);
        SD.LOOT.helix.push(['w_f2000_helix', 2, 1, 1], ['rig_arctech', 1, 1, 1], ['tool_nano_patch', 3, 1, 1]);
        SD.LOOT.brood.push(['tool_field_repair', 4, 1, 1], ['relic_brood_heart', 1, 1, 1]);
        SD.LOOT.boss.push(['tool_nano_patch', 65, 1, 1], ['rig_juggernaut', 25, 1, 1], ['helm_arctech', 25, 1, 1], ['w_mg42_scrap', 20, 1, 1]);
        SD.LOOT.cache.push(['tool_field_repair', 12, 1, 1], ['tool_riot_plate', 8, 1, 1], ['boots_scav', 6, 1, 1], ['helm_scav', 6, 1, 1]);
        SD.LOOT.locked.push(['tool_nano_patch', 18, 1, 1], ['w_deagle_judge', 8, 1, 1], ['rig_warden', 8, 1, 1], ['boots_ghost', 6, 1, 1]);
    }

    BO.OWRPGGunStats = OWRPGGunStats;
    BO.OWRPGExpansionData = {
        PASSIVE_TRAITS, ARMOR_SETS, NEW_GUNS, NEW_ARMOR, NEW_TOOLS, NEW_MISC_ITEMS,
        EXPANSION_ABILITIES, POWER_UNLOCKS, MOUNTS, BOUNTIES, CODEX_MILESTONES,
        getGunStats
    };
})(window.BO);
