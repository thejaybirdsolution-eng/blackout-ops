/* ============================================================================
   BLACKOUT OPS — Attachments, Camos, Equipment, Perks, Field Upgrades, Killstreaks
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const ATTACHMENTS = {
        optic: [
            {
                id: 'iron',
                name: 'Iron Sights',
                unlockWeaponLevel: 1,
                desc: 'Factory steel sights with fastest ADS transition.',
                mods: { adsTime: 1.0, adsFovOffset: 0, range: 1.0, hipSpread: 1.0 }
            },
            {
                id: 'reflex',
                name: 'Reflex Red Dot',
                unlockWeaponLevel: 2,
                desc: 'Clear reflex lens with glowing crimson dot for rapid target tracking.',
                mods: { adsTime: 1.03, adsFovOffset: -2, range: 1.04, adsSpread: 0.90 }
            },
            {
                id: 'holo',
                name: 'EOTech Holographic',
                unlockWeaponLevel: 5,
                desc: 'Wide tactical reticle ring improving recoil visual stability.',
                mods: { adsTime: 1.06, adsFovOffset: -4, range: 1.08, recoil: 0.92, adsSpread: 0.85 }
            },
            {
                id: 'acog',
                name: 'ACOG 3.0x Optic',
                unlockWeaponLevel: 9,
                desc: 'Magnified medium-range combat optic increasing effective range.',
                mods: { adsTime: 1.14, adsFovOffset: -14, range: 1.18, adsSpread: 0.72 }
            },
            {
                id: 'sniper_scope',
                name: 'Variable Precision Scope',
                unlockWeaponLevel: 12,
                desc: 'High-magnification optical scope with hold-breath stabilization.',
                mods: { adsTime: 1.24, adsFovOffset: -28, range: 1.28, adsSpread: 0.45, useScopeOverlay: true }
            },
            {
                id: 'thermal_holo',
                name: 'Thermal Recon Optic',
                unlockWeaponLevel: 16,
                desc: 'Late-level thermal target-acquisition optic with extended range & crisp ads.',
                mods: { adsTime: 1.12, adsFovOffset: -18, range: 1.24, adsSpread: 0.65, recoil: 0.90 }
            },
            {
                id: 'apex_hybrid',
                name: 'Apex 4.0x Marksman Sight',
                unlockWeaponLevel: 20,
                desc: 'Elite hybrid optic granting +6% damage, +32% range, and razor-tight stability.',
                mods: { adsTime: 1.10, adsFovOffset: -22, range: 1.32, recoil: 0.85, adsSpread: 0.60, damage: 1.06 }
            },
            {
                id: 'var_zoom_20x',
                name: 'Variable 1x–20x Sniper Scope',
                unlockWeaponLevel: 25,
                desc: 'Master-tier stepless 1x to 20x zoom sniper scope! Scroll Mouse Wheel or press +/- while aiming to zoom seamlessly from 1x to 20x!',
                mods: { adsTime: 1.16, range: 1.65, adsSpread: 0.25, damage: 1.08, useScopeOverlay: true, variableZoom: true, minZoom: 1.0, maxZoom: 20.0 }
            }
        ],

        muzzle: [
            {
                id: 'none',
                name: 'Factory Flash Hider',
                unlockWeaponLevel: 1,
                desc: 'Standard barrel crown.',
                mods: {}
            },
            {
                id: 'compensator',
                name: 'Tactical Compensator',
                unlockWeaponLevel: 3,
                desc: 'Ports gas upward to significantly tame vertical muzzle climb.',
                mods: { recoil: 0.80, adsTime: 1.04 }
            },
            {
                id: 'suppressor',
                name: 'Monolithic Suppressor',
                unlockWeaponLevel: 7,
                desc: 'Dampens muzzle signature, hides radar ping, and extends damage range.',
                mods: { suppressed: true, range: 1.12, recoil: 0.93, adsTime: 1.07 }
            },
            {
                id: 'muzzle_brake',
                name: 'Baffled Muzzle Brake',
                unlockWeaponLevel: 11,
                desc: 'Tightens horizontal spread and boosts projectile velocity.',
                mods: { recoil: 0.86, adsSpread: 0.85, damage: 1.04 }
            },
            {
                id: 'titanium_brake',
                name: 'Titanium Recoil Eliminator',
                unlockWeaponLevel: 16,
                desc: 'Late-level ported titanium brake cutting recoil by 32%.',
                mods: { recoil: 0.68, adsSpread: 0.78, adsTime: 1.02 }
            },
            {
                id: 'aether_suppressor',
                name: 'Aether Stealth Suppressor',
                unlockWeaponLevel: 20,
                desc: 'Advanced silent baffle boosting damage +8% and range +25%.',
                mods: { suppressed: true, damage: 1.08, range: 1.25, recoil: 0.82 }
            },
            {
                id: 'overpressure_comp',
                name: 'Overpressure Warhead Muzzle',
                unlockWeaponLevel: 25,
                desc: 'Master-tier high-velocity chamber adding +16% damage & +20% range.',
                mods: { damage: 1.16, range: 1.20, recoil: 0.76 }
            }
        ],

        underbarrel: [
            {
                id: 'none',
                name: 'Standard Rail',
                unlockWeaponLevel: 1,
                desc: 'Clean handguard with zero added weight.',
                mods: {}
            },
            {
                id: 'foregrip',
                name: 'Merc Vertical Foregrip',
                unlockWeaponLevel: 3,
                desc: 'Reduces recoil kick and improves hipfire control.',
                mods: { recoil: 0.82, hipSpread: 0.88, adsTime: 1.03 }
            },
            {
                id: 'laser',
                name: '5mW Tactical Laser',
                unlockWeaponLevel: 6,
                desc: 'Visible laser sight tightening hipfire spread and speeding sprint-to-fire.',
                mods: { hipSpread: 0.68, adsTime: 0.92, showLaser: true }
            },
            {
                id: 'heavy_barrel',
                name: 'Reinforced Heavy Barrel',
                unlockWeaponLevel: 10,
                desc: 'Extends effective range and bullet damage at the cost of mobility.',
                mods: { damage: 1.08, range: 1.22, moveMult: 0.96, adsTime: 1.08 }
            },
            {
                id: 'short_barrel',
                name: 'CQB Fluted Barrel',
                unlockWeaponLevel: 14,
                desc: 'Lightens front end for snappy ADS and faster movement.',
                mods: { adsTime: 0.86, moveMult: 1.04, range: 0.88 }
            },
            {
                id: 'carbon_bipod',
                name: 'Carbon-Fiber Precision Bipod',
                unlockWeaponLevel: 16,
                desc: 'Late-level sniper & LMG stabilizer cutting recoil 34% and spread 38%.',
                mods: { recoil: 0.66, adsSpread: 0.62, range: 1.15 }
            },
            {
                id: 'railgun_barrel',
                name: 'Magnetic Accelerator Barrel',
                unlockWeaponLevel: 20,
                desc: 'Electromagnetic rail coils boosting bullet damage +18% and range +38%.',
                mods: { damage: 1.18, range: 1.38, adsSpread: 0.70 }
            },
            {
                id: 'nano_angled',
                name: 'Nano-Composite Combat Grip',
                unlockWeaponLevel: 25,
                desc: 'Master-tier ultra-fast ADS, laser-tight hipfire, and +8% movement speed.',
                mods: { adsTime: 0.76, hipSpread: 0.55, recoil: 0.74, moveMult: 1.08, showLaser: true }
            }
        ],

        magazine: [
            {
                id: 'std_mag',
                name: 'Standard Magazine',
                unlockWeaponLevel: 1,
                desc: 'Factory ammunition feed.',
                mods: {}
            },
            {
                id: 'ext_mags',
                name: 'Extended Mags',
                unlockWeaponLevel: 4,
                desc: '+40% magazine capacity and extra reserve ammunition.',
                mods: { magMult: 1.4, reloadMult: 1.06 }
            },
            {
                id: 'fast_mags',
                name: 'Sleight Fast Mags',
                unlockWeaponLevel: 8,
                desc: 'Coupled pull-tab magazines slashing reload time by 28%.',
                mods: { reloadMult: 0.72, adsTime: 0.97 }
            },
            {
                id: 'drum_mag',
                name: 'High-Capacity Drum',
                unlockWeaponLevel: 15,
                desc: '+80% capacity for relentless sustained fire.',
                mods: { magMult: 1.8, reloadMult: 1.18, moveMult: 0.95, adsTime: 1.08 }
            },
            {
                id: 'hollow_point_mag',
                name: 'Hollow-Point Heavy Mag',
                unlockWeaponLevel: 16,
                desc: 'Late-level stopping-power rounds adding +15% damage and +25% capacity.',
                mods: { damage: 1.15, magMult: 1.25, reloadMult: 0.92 }
            },
            {
                id: 'beta_c_drum',
                name: 'Twin-Saddle 100-Rd Drum',
                unlockWeaponLevel: 20,
                desc: 'Massive +135% magazine capacity for endless horde shredding.',
                mods: { magMult: 2.35, reloadMult: 1.08 }
            },
            {
                id: 'quantum_autoloader',
                name: 'Quantum Autoloader Mag',
                unlockWeaponLevel: 25,
                desc: 'Master-tier 2x magazine capacity with 45% faster lightning reload!',
                mods: { magMult: 2.0, reloadMult: 0.55, adsTime: 0.94 }
            }
        ],

        stock: [
            {
                id: 'std_stock',
                name: 'Standard Tactical Stock',
                unlockWeaponLevel: 1,
                desc: 'Balanced cheek weld and recoil absorption.',
                mods: {}
            },
            {
                id: 'stippled',
                name: 'Stippled Grip Tape',
                unlockWeaponLevel: 4,
                desc: 'Aggressive textured grip improving ADS snap speed.',
                mods: { adsTime: 0.88, hipSpread: 0.92 }
            },
            {
                id: 'no_stock',
                name: 'Collapsed / No Stock',
                unlockWeaponLevel: 9,
                desc: 'Maximum CQB sprint speed and ADS agility, higher recoil.',
                mods: { adsTime: 0.82, moveMult: 1.06, recoil: 1.15 }
            },
            {
                id: 'precision_stock',
                name: 'Marksman Precision Stock',
                unlockWeaponLevel: 13,
                desc: 'Stabilizes aim sway and reduces kick.',
                mods: { recoil: 0.84, adsSpread: 0.80, adsTime: 1.06 }
            },
            {
                id: 'exo_stabilizer',
                name: 'Exo-Frame Gyro Stock',
                unlockWeaponLevel: 16,
                desc: 'Late-level gyroscopic stock cutting recoil 30% while boosting mobility.',
                mods: { recoil: 0.70, adsSpread: 0.65, moveMult: 1.04 }
            },
            {
                id: 'ultralight_skel',
                name: 'Ultralight Titanium Frame',
                unlockWeaponLevel: 20,
                desc: 'Featherweight skeletonized frame for +12% sprint speed & 26% faster ADS.',
                mods: { adsTime: 0.74, moveMult: 1.12, hipSpread: 0.75 }
            },
            {
                id: 'cyber_cheekrest',
                name: 'Cybernetic Zero-Kick Stock',
                unlockWeaponLevel: 25,
                desc: 'Master-tier recoil-canceling stock (-42% recoil, -45% ADS spread, +6% speed).',
                mods: { recoil: 0.58, adsTime: 0.82, adsSpread: 0.55, moveMult: 1.06 }
            }
        ]
    };

    const CAMOS = [
        { id: 'default', name: 'Factory Matte', killsRequired: 0, color: '#2b313a', preview: 'linear-gradient(135deg,#2b313a,#1b2027)' },
        { id: 'woodland', name: 'Woodland Tiger', killsRequired: 5, color: '#3f5a36', preview: 'linear-gradient(135deg,#3f5a36 25%,#26361f 50%,#604c33 75%,#3f5a36)' },
        { id: 'urban', name: 'Urban Digital', killsRequired: 15, color: '#64748b', preview: 'linear-gradient(135deg,#94a3b8 25%,#475569 50%,#1e293b 75%,#cbd5e1)' },
        { id: 'red_tiger', name: 'Crimson Tiger', killsRequired: 25, color: '#991b1b', preview: 'linear-gradient(135deg,#dc2626 25%,#1c1917 55%,#7f1d1d)' },
        { id: 'blue_tiger', name: 'Cobalt Tiger', killsRequired: 35, color: '#1d4ed8', preview: 'linear-gradient(135deg,#2563eb 25%,#0f172a 55%,#1e3a8a)' },
        { id: 'arctic', name: 'Arctic Frost', killsRequired: 45, color: '#e2e8f0', preview: 'linear-gradient(135deg,#f8fafc,#94a3b8,#e2e8f0)' },
        { id: 'carbon', name: 'Carbon Weave', killsRequired: 55, color: '#18181b', preview: 'repeating-linear-gradient(45deg,#18181b 0 4px,#27272a 4px 8px)' },
        { id: 'gold', name: '24K Gold Camo', killsRequired: 75, headshotsRequired: 1000, color: '#eab308', preview: 'linear-gradient(135deg,#fef08a,#eab308,#a16207,#fde047)' },
        { id: 'platinum', name: 'Brushed Platinum', killsRequired: 120, color: '#cbd5e1', preview: 'linear-gradient(135deg,#ffffff,#94a3b8,#e2e8f0,#64748b)' },
        { id: 'dark_matter', name: 'Dark Matter', killsRequired: 200, color: '#9333ea', preview: 'radial-gradient(circle at 30% 30%,#f472b6,#7e22ce 45%,#090518 85%)', animated: true }
    ];

    const LETHALS = {
        frag: {
            id: 'frag',
            name: 'M67 Frag Grenade',
            unlockLevel: 1,
            count: 2,
            cookable: true,
            fuseTime: 3.0,
            damage: 240,
            radius: 5.8,
            desc: 'Hold [G] to cook the 3.0s fuse before throwing for airburst impact.'
        },
        semtex: {
            id: 'semtex',
            name: 'Semtex Sticky',
            unlockLevel: 5,
            count: 2,
            cookable: false,
            fuseTime: 1.75,
            damage: 230,
            radius: 5.2,
            desc: 'Timed plastic explosive that adheres to walls, floors, and enemies.'
        },
        napalm: {
            id: 'napalm',
            name: 'Napalm Canister',
            unlockLevel: 9,
            count: 2,
            cookable: false,
            fuseTime: 1.4,
            damage: 210,
            radius: 6.2,
            burnDuration: 9.0,
            desc: 'Explodes into a 6.2m carpet of roaring Napalm fire for 9 seconds that burns and melts every zombie walking through it!'
        },
        c4: {
            id: 'c4',
            name: 'C4 Satchel Charge',
            unlockLevel: 14,
            count: 2,
            cookable: false,
            remote: true,
            damage: 320,
            radius: 6.5,
            desc: 'Toss satchel charge and double-tap [G] or press [B] to detonate remotely.'
        }
    };

    const TACTICALS = {
        flashbang: {
            id: 'flashbang',
            name: 'M84 Flashbang',
            unlockLevel: 1,
            count: 2,
            radius: 7.5,
            stunDuration: 3.4,
            desc: 'Blinds and stuns bots and disorients zombies within blast radius.'
        },
        stim: {
            id: 'stim',
            name: 'Tactical Stim Shot',
            unlockLevel: 3,
            count: 2,
            desc: 'Instant military adrenaline injector that restores full HP and Tactical Sprint.'
        },
        monkey_bomb: {
            id: 'monkey_bomb',
            name: 'Monkey Grenade',
            unlockLevel: 12,
            count: 2,
            fuseTime: 5.5,
            damage: 520,
            radius: 7.2,
            desc: 'Distracts and attracts all nearby zombies with hypnotic cymbals before detonating massively!'
        },
        pokeball: {
            id: 'pokeball',
            name: 'Pokéball (10 Pokémon Allies)',
            unlockLevel: 1,
            count: 1,
            duration: 18.0,
            desc: 'Throw [Q] (or roll 1% from Mystery Box) to summon 1 of 10 unique 3D Pokémon allies for 18s, each helping the battle in a unique way!'
        }
    };

    const POKEMON_ROSTER = [
        {
            id: 'pikachu',
            name: 'PIKACHU',
            title: 'THUNDERBOLT CHAIN',
            bodyColor: 0xfacc15,
            accentColor: 0xef4444,
            fxColor: 0xfde047,
            scale: 0.75,
            cooldown: 1.15,
            damage: 380,
            behavior: 'chain_thunder',
            desc: 'Fires golden Thunderbolt arcs every 1.15s that chain across 5 zombies and stun them!'
        },
        {
            id: 'charizard',
            name: 'CHARIZARD',
            title: 'FLAMETHROWER WING STORM',
            bodyColor: 0xf97316,
            accentColor: 0xfef08a,
            fxColor: 0xff5500,
            scale: 1.35,
            flying: true,
            cooldown: 1.0,
            damage: 420,
            behavior: 'napalm_breath',
            desc: 'Hovers above the battlefield breathing sweeping Napalm fire cones that ignite entire waves!'
        },
        {
            id: 'blastoise',
            name: 'BLASTOISE',
            title: 'HYDRO CANNON TORRENT',
            bodyColor: 0x2563eb,
            accentColor: 0x78350f,
            fxColor: 0x38bdf8,
            scale: 1.25,
            cooldown: 1.3,
            damage: 450,
            behavior: 'hydro_knockback',
            desc: 'Blasts twin high-pressure Hydro Cannons that deal heavy damage and knock zombies flying backward!'
        },
        {
            id: 'venusaur',
            name: 'VENUSAUR',
            title: 'SOLAR BEAM & POISON SPORES',
            bodyColor: 0x16a34a,
            accentColor: 0xf43f5e,
            fxColor: 0x4ade80,
            scale: 1.25,
            cooldown: 1.25,
            damage: 360,
            behavior: 'poison_vines',
            desc: 'Emits a toxic spore cloud that slows nearby zombies by 50% while whipping them with Razor Leaves!'
        },
        {
            id: 'gengar',
            name: 'GENGAR',
            title: 'SHADOW BALL LIFE DRAIN',
            bodyColor: 0x6b21a8,
            accentColor: 0xef4444,
            fxColor: 0xa855f7,
            scale: 0.95,
            cooldown: 1.1,
            damage: 410,
            behavior: 'shadow_drain',
            desc: 'Hurls dark Shadow Balls that vaporize zombies and heal your soldier +20 HP & +15 Armor on every hit!'
        },
        {
            id: 'mewtwo',
            name: 'MEWTWO',
            title: 'PSYSTRIKE GRAVITY CRUSH',
            bodyColor: 0xe9d5ff,
            accentColor: 0x9333ea,
            fxColor: 0xc084fc,
            scale: 1.20,
            flying: true,
            cooldown: 1.4,
            damage: 620,
            behavior: 'psystrike_lift',
            desc: 'Levitates in psychic aura, lifting groups of zombies into mid-air and slamming them down in a telekinetic blast!'
        },
        {
            id: 'lucario',
            name: 'LUCARIO',
            title: 'AURA SPHERE BOSS SLAYER',
            bodyColor: 0x1d4ed8,
            accentColor: 0x1e293b,
            fxColor: 0x60a5fa,
            scale: 0.95,
            cooldown: 0.95,
            damage: 480,
            behavior: 'aura_sphere',
            desc: 'Fires rapid homing blue Aura Spheres that never miss and deal 2.5x bonus damage to Bosses!'
        },
        {
            id: 'snorlax',
            name: 'SNORLAX',
            title: 'TAUNT & BODY SLAM QUAKE',
            bodyColor: 0x0f766e,
            accentColor: 0xfef3c7,
            fxColor: 0xf59e0b,
            scale: 1.55,
            cooldown: 2.0,
            damage: 580,
            behavior: 'snorlax_quake',
            desc: 'Giant tank ally that attracts all zombies like a Monkey Grenade and flattens them with earthquake slams!'
        },
        {
            id: 'gyarados',
            name: 'GYARADOS',
            title: 'HYPER BEAM LASER SWEEP',
            bodyColor: 0x0284c7,
            accentColor: 0xfef08a,
            fxColor: 0x38bdf8,
            scale: 1.50,
            flying: true,
            cooldown: 1.5,
            damage: 650,
            behavior: 'hyper_beam',
            desc: 'Sweeps a devastating golden-cyan Hyper Beam laser across the room that pierces and vaporizes lines of zombies!'
        },
        {
            id: 'rayquaza',
            name: 'RAYQUAZA',
            title: 'DRACO METEOR ORBITAL STORM',
            bodyColor: 0x059669,
            accentColor: 0xfacc15,
            fxColor: 0x34d399,
            scale: 1.60,
            flying: true,
            cooldown: 1.35,
            damage: 720,
            behavior: 'draco_meteor',
            desc: 'Legendary sky dragon calling down raining Draco Meteors from the heavens onto zombie hordes!'
        }
    ];

    const PERKS = {
        // Tier 1 (Blue)
        double_time: { id: 'double_time', tier: 1, name: 'Double Time', unlockLevel: 1, color: '#38bdf8', desc: '+100% Tactical Sprint duration and faster crouch movement.' },
        scavenger: { id: 'scavenger', tier: 1, name: 'Scavenger', unlockLevel: 1, color: '#38bdf8', desc: 'Replenish ammo packs from eliminated enemies.' },
        flak_jacket: { id: 'flak_jacket', tier: 1, name: 'E.O.D. / Flak Jacket', unlockLevel: 6, color: '#38bdf8', desc: 'Reduces incoming explosive and fire damage by 50%.' },
        overkill: { id: 'overkill', tier: 1, name: 'Overkill', unlockLevel: 16, color: '#38bdf8', desc: 'Carry a second primary weapon in your secondary slot.' },
        // Tier 2 (Red)
        sleight_of_hand: { id: 'sleight_of_hand', tier: 2, name: 'Sleight of Hand', unlockLevel: 1, color: '#f43f5e', desc: '+30% faster reload and equipment throw speed.' },
        ghost: { id: 'ghost', tier: 2, name: 'Ghost', unlockLevel: 4, color: '#f43f5e', desc: 'Invisible to enemy UAV sweeps and reduces bot detection range.' },
        quick_fix: { id: 'quick_fix', tier: 2, name: 'Quick Fix', unlockLevel: 9, color: '#f43f5e', desc: 'Kills immediately trigger health regeneration.' },
        hardline: { id: 'hardline', tier: 2, name: 'Hardline', unlockLevel: 17, color: '#f43f5e', desc: 'All Multiplayer Killstreaks require 1 fewer kill.' },
        // Tier 3 (Yellow)
        steady_aim: { id: 'steady_aim', tier: 3, name: 'Steady Aim', unlockLevel: 1, color: '#eab308', desc: 'Tightens hipfire spread by 30% across all weapons.' },
        dead_silence: { id: 'dead_silence', tier: 3, name: 'Ninja / Dead Silence', unlockLevel: 7, color: '#eab308', desc: 'Muffles footsteps and increases base sprint velocity by 6%.' },
        stalker: { id: 'stalker', tier: 3, name: 'Stalker', unlockLevel: 12, color: '#eab308', desc: '+35% faster movement speed while aiming down sights.' },
        amped: { id: 'amped', tier: 3, name: 'Amped', unlockLevel: 19, color: '#eab308', desc: 'Lightning-fast weapon swap speed and rocket/launcher readiness.' }
    };

    const FIELD_UPGRADES = {
        munitions_box: {
            id: 'munitions_box',
            name: 'Munitions Box',
            unlockLevel: 1,
            cooldown: 45,
            desc: 'Refills full reserve ammo and lethal/tactical gear immediately on press [X].'
        },
        aether_shroud: {
            id: 'aether_shroud',
            name: 'Aether Shroud',
            unlockLevel: 4,
            cooldown: 55,
            duration: 6.5,
            desc: 'Phase out of enemy perception for 6.5s while gaining +20% move speed.'
        },
        frenzied_guard: {
            id: 'frenzied_guard',
            name: 'Frenzied Guard',
            unlockLevel: 10,
            cooldown: 60,
            duration: 8.0,
            desc: 'Instantly restores full Armor Plates and repairs armor on every kill for 8s.'
        },
        trophy_system: {
            id: 'trophy_system',
            name: 'Trophy Pulse',
            unlockLevel: 14,
            cooldown: 50,
            duration: 15.0,
            desc: 'Deploys an active defense aura intercepting grenades and granting blast resistance.'
        }
    };

    const ULTIMATE_POWERS = {
        gravity_spikes: {
            id: 'gravity_spikes',
            name: 'Gravity Slam',
            unlockLevel: 1,
            chargeNeeded: 100,
            desc: 'Leap and slam the ground with a massive shockwave that blasts and wipes out nearby enemies!'
        },
        annihilator: {
            id: 'annihilator',
            name: 'Aether Railcannon',
            unlockLevel: 3,
            chargeNeeded: 100,
            desc: 'Fires an instant-kill golden energy beam that pierces straight through up to 8 enemies in a line!'
        },
        death_machine: {
            id: 'death_machine',
            name: 'Overdrive Minigun',
            unlockLevel: 7,
            chargeNeeded: 100,
            duration: 12.0,
            desc: 'For 12 seconds your gun uses zero ammo, fires 60% faster, deals double damage, and halves damage taken!'
        },
        cryo_nova: {
            id: 'cryo_nova',
            name: 'Absolute Zero',
            unlockLevel: 11,
            chargeNeeded: 100,
            duration: 7.0,
            desc: 'Freezes every enemy within 16 meters solid for 7 seconds and makes them take 2.5x shatter damage!'
        },
        orbital_strike: {
            id: 'orbital_strike',
            name: 'Orbital Laser Barrage',
            unlockLevel: 16,
            chargeNeeded: 100,
            desc: 'Calls down 4 giant explosions from the sky straight ahead of where you are aiming!'
        }
    };

    const KILLSTREAKS = {
        uav: {
            id: 'uav',
            name: 'Recon UAV',
            kills: 3,
            unlockLevel: 1,
            duration: 25,
            desc: 'Reveals all enemy positions in real-time on your radar for 25 seconds.'
        },
        care_package: {
            id: 'care_package',
            name: 'Care Package',
            kills: 4,
            unlockLevel: 3,
            desc: 'Drops a high-tier supply crate containing armor, ammo, and a bonus streak.'
        },
        predator: {
            id: 'predator',
            name: 'Precision Airstrike',
            kills: 5,
            unlockLevel: 6,
            desc: 'Calls an immediate targeted missile barrage onto your crosshair coordinates.'
        },
        chopper: {
            id: 'chopper',
            name: 'Attack Chopper',
            kills: 7,
            unlockLevel: 11,
            duration: 30,
            desc: 'Deploys an armored gunship circling the arena and eliminating exposed enemies.'
        },
        juggernaut: {
            id: 'juggernaut',
            name: 'Juggernaut Suit',
            kills: 9,
            unlockLevel: 18,
            duration: 40,
            desc: 'Equips heavy ballistic plating (+250 HP & full armor) and boosted damage.'
        },
        nuke: {
            id: 'nuke',
            name: 'Tactical Nuke',
            kills: 15,
            unlockLevel: 25,
            desc: 'Ultimate streak: 10-second siren countdown followed by total match-winning detonation.'
        }
    };

    const classicAttachments = {
        optic: [
            ['aperture', 'Aperture Sight', 'A compact sight with modest zoom and clearer aim.', { adsFovOffset: -5, adsSpread: 0.85 }],
            ['low_power_scope', 'Low-Power Scope', 'A period scope with lighter zoom than the precision optic.', { adsFovOffset: -12, useScopeOverlay: true, adsTime: 1.12 }]
        ],
        muzzle: [
            ['flash_hider', 'Flash Suppressor', 'Reduces muzzle signature with a small trade-off in effective range.', { suppressed: true, range: 0.94 }]
        ],
        underbarrel: [
            ['bayonet', 'Fixed Bayonet', 'Adds 0.75 m to quick melee reach.', { meleeReach: 0.75 }],
            ['masterkey', 'Underbarrel Shotgun', 'Adds a close-range shotgun mode fed from the primary magazine.', { weaponCategory: 'Assault Rifle' }],
            ['underbarrel_launcher', 'Underbarrel Grenade Launcher', 'Adds a slow explosive mode fed from the primary magazine.', { weaponCategory: 'Assault Rifle' }],
            ['underbarrel_flame', 'Underbarrel Flamethrower', 'Adds a short-range flame mode fed from the primary magazine.', { weaponCategory: 'Assault Rifle' }]
        ],
        magazine: [
            ['dual_mag', 'Dual Magazines', 'A paired magazine setup with quicker reloads and extra reserve capacity.', { magMult: 1.15, reloadMult: 0.82 }],
            ['rapid_fire', 'Rapid Fire', 'Increase SMG firing rate by 18% and recoil by 20%.', { weaponCategory: 'SMG', rpm: 1.18, recoil: 1.2 }],
            ['fmj', 'Full Metal Jacket', 'Penetrates one extra target or surface.', { penetration: 1 }]
        ],
        stock: [
            ['sawn_stock', 'Sawn Stock', 'A lighter setup with faster handling and stronger recoil.', { adsTime: 0.78, recoil: 1.28, moveMult: 1.06 }]
        ]
    };
    for (const [slot, entries] of Object.entries(classicAttachments)) {
        for (const [id, name, desc, mods] of entries) ATTACHMENTS[slot].push({ id, name, desc, mods, unlockWeaponLevel: 4 });
        // Keep factory default at index 0, then sort ascending by unlock level so master-tier attachments sit at the bottom.
        const [factoryDefault, ...rest] = ATTACHMENTS[slot];
        rest.sort((a, b) => (a.unlockWeaponLevel || 1) - (b.unlockWeaponLevel || 1));
        ATTACHMENTS[slot] = factoryDefault ? [factoryDefault, ...rest] : rest;
    }

    const classicPerks = [
        ['lightweight', 'Lightweight', 1, 'Move 8% faster on foot.'],
        ['marathon', 'Marathon', 1, 'Tactical sprint drains stamina at half the normal rate.'],
        ['stopping_power', 'Stopping Power', 2, 'Deal 15% more direct firearm damage.'],
        ['deep_impact', 'Deep Impact / FMJ', 2, 'Fire through one additional target or surface.', { penetration: 1 }],
        ['recon_spotter', 'SitRep', 3, 'Reduce damage from proximity mines by 60%.'],
        ['tactical_mask', 'Tactical Mask', 3, 'Recover from your own flash and concussion grenades 65% faster.']
    ];
    for (const [id, name, tier, desc, weaponMods] of classicPerks) {
        PERKS[id] = { id, name, tier, desc, weaponMods, unlockLevel: 8, color: ['','#38bdf8','#f43f5e','#eab308'][tier] };
    }

    Object.assign(LETHALS, {
        stick_grenade: { id: 'stick_grenade', name: 'Stick Grenade', unlockLevel: 3, count: 2, fuseTime: 2.8, damage: 205, radius: 6.4, desc: 'A long-fuse fragmentation grenade with a wider blast.' },
        tomahawk: { id: 'tomahawk', name: 'Throwing Tomahawk', unlockLevel: 6, count: 2, fuseTime: 0.85, damage: 260, radius: 0.95, desc: 'A thrown axe for pinpoint hits.' },
        claymore: { id: 'claymore', name: 'Claymore', unlockLevel: 10, count: 1, fuseTime: 25, damage: 210, radius: 3.2, proximity: 2.4, desc: 'A placed mine that triggers when a hostile approaches.' },
        bouncing_betty: { id: 'bouncing_betty', name: 'Bouncing Betty', unlockLevel: 13, count: 1, fuseTime: 25, damage: 175, radius: 4.2, proximity: 3.2, desc: 'A wide-area proximity mine with lighter damage.' }
    });
    Object.assign(TACTICALS, {
        concussion: { id: 'concussion', name: 'Concussion Grenade', unlockLevel: 4, count: 2, radius: 5, fuseTime: 0.85, damage: 0, stunDuration: 4.5, desc: 'A fast tactical throw that briefly stuns enemies.' },
        smoke: { id: 'smoke', name: 'Smoke Grenade', unlockLevel: 5, count: 2, radius: 5, fuseTime: 1.15, damage: 0, desc: 'Blocks bot sight through the smoke for 7 seconds.' },
        decoy: { id: 'decoy', name: 'Decoy Grenade', unlockLevel: 9, count: 2, radius: 10, fuseTime: 1.1, damage: 0, desc: 'Draws nearby bots toward a burst of simulated gunfire.' }
    });
    const classicStreaks = [
        ['counter_uav', 'Counter-UAV', 4, 'Conceals your squad from the enemy radar and disrupts hostile bot targeting for 12 seconds.'],
        ['sentry_gun', 'Sentry Gun', 5, 'Place a stationary defense that tracks nearby enemies for 18 seconds.'],
        ['napalm_strike', 'Napalm Strike', 5, 'Ignites three adjacent areas beyond your crosshair.'],
        ['artillery', 'Artillery', 6, 'Saturates the area beyond your crosshair with three spaced impacts.'],
        ['emergency_airdrop', 'Emergency Airdrop', 8, 'Resupplies the class and immediately calls a short recon sweep and helicopter pass.'],
        ['blackbird', 'Blackbird', 8, 'Tracks hostile positions for 45 seconds.'],
        ['pave_low', 'Heavy Helicopter', 9, 'Calls longer-duration helicopter cover.'],
        ['emp', 'EMP', 12, 'Clears existing enemy sensors and stuns hostile bots across the arena.']
    ];
    for (const [id, name, kills, desc] of classicStreaks) KILLSTREAKS[id] = { id, name, kills, desc, unlockLevel: kills + 3 };

    BO.AttachmentsData = {
        ATTACHMENTS,
        CAMOS,
        LETHALS,
        TACTICALS,
        POKEMON_ROSTER,
        PERKS,
        FIELD_UPGRADES,
        ULTIMATE_POWERS,
        KILLSTREAKS,
        getAttachment(slot, id) {
            const list = ATTACHMENTS[slot] || [];
            return list.find((a) => a.id === id) || list[0];
        },
        getCamo(id) {
            return CAMOS.find((c) => c.id === id) || CAMOS[0];
        },
        getPerksByTier(tier) {
            return Object.values(PERKS).filter((p) => p.tier === tier);
        }
    };
})(window);
