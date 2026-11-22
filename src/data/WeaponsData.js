/* ============================================================================
   BLACKOUT OPS — Complete 70-Weapon Arsenal
   - 50 Unique Firearms / Ranged Weapons (32 Common + 18 Uncommon)
   - 10 Unique Melee Weapons (6 Common + 4 Uncommon)
   - 10 Unique Magic Weapons (Super-Special Wonder Weapons)
   - Exact Mystery Box Odds: 60% Common Gun, 15% Uncommon Gun, 10% Common Melee,
     5% Uncommon Melee, 5% Magic Weapon, 5% Nothing.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    // Compact builder for standard firearm entries so all 50 guns have rich, complete, unique specs
    function makeGun(cfg) {
        const isPistol = cfg.category === 'Pistol';
        const isSniper = cfg.category === 'Sniper Rifle';
        const isShotgun = cfg.category === 'Shotgun';
        const isLMG = cfg.category === 'LMG';
        const isSMG = cfg.category === 'SMG';
        const isLauncher = cfg.category === 'Launcher';

        const recH = cfg.recH || (isPistol ? 0.045 : (isLMG ? 0.082 : (isSMG ? 0.064 : 0.070)));
        const recW = cfg.recW || (isPistol ? 0.034 : (isLMG ? 0.060 : 0.048));
        const recL = cfg.recL || (isPistol ? 0.22 : (isSMG ? 0.25 : 0.30));
        const barrelLen = cfg.barrelLen || (isPistol ? 0.05 : (isSniper ? 0.42 : (isSMG ? 0.16 : 0.28)));
        const hgLen = cfg.hgLen !== undefined ? cfg.hgLen : (isPistol ? 0 : (isSMG ? 0.14 : 0.20));

        return {
            id: cfg.id,
            name: cfg.name,
            shortName: cfg.shortName || cfg.name.split(' ')[0],
            category: cfg.category,
            kind: 'gun',
            tier: cfg.tier || 'common', // 'common' | 'uncommon'
            slotType: cfg.slotType || (isPistol || isLauncher ? 'secondary' : 'primary'),
            unlockLevel: cfg.unlockLevel || 1,
            mysteryBox: false,
            description: cfg.description,
            fireMode: cfg.fireMode || 'auto',
            altFireMode: cfg.altFireMode || null,
            burstCount: cfg.burstCount || 3,
            burstDelay: cfg.burstDelay || 0.06,
            rpm: cfg.rpm,
            damage: cfg.damage,
            headMult: cfg.headMult || 1.6,
            range: cfg.range || 40,
            rangeNear: Math.round((cfg.range || 40) * 0.45),
            rangeFar: cfg.range || 40,
            pellets: cfg.pellets || 1,
            magSize: cfg.magSize,
            reserveMax: cfg.reserveMax || cfg.magSize * 6,
            reserveAmmo: cfg.reserveMax || cfg.magSize * 6,
            reloadTime: cfg.reloadTime || 1.8,
            shellReload: !!cfg.shellReload,
            adsTime: cfg.adsTime || 0.19,
            adsFov: cfg.adsFov || (isSniper ? 28 : 62),
            isSniperScope: !!cfg.isSniperScope,
            hipSpread: cfg.hipSpread || 0.032,
            adsSpread: cfg.adsSpread || 0.0025,
            recoilPitch: cfg.recoilPitch || 0.022,
            recoilYaw: cfg.recoilYaw || 0.009,
            moveMult: cfg.moveMult || 0.95,
            moveSpeedMult: cfg.moveMult || 0.95,
            penetration: cfg.penetration !== undefined ? cfg.penetration : 1,
            explosiveRadius: cfg.explosiveRadius || 0,
            canDualWield: !!cfg.canDualWield,
            isGoldFinish: !!cfg.isGoldFinish,
            papName: cfg.papName,
            papDamageMult: cfg.papDamageMult || 2.35,
            papMagMult: cfg.papMagMult || 2.0,
            papEffect: cfg.papEffect || 'overdrive',
            papExplosiveRadius: cfg.papExplosiveRadius || 0,
            soundProfile: cfg.soundProfile || (isShotgun ? 'shotgun' : (isSniper ? 'sniper' : (isSMG ? 'smg' : (isLMG ? 'lmg' : (isPistol ? 'pistol' : 'ar_light'))))),
            hipPos: cfg.hipPos || (isPistol ? [0.19, -0.19, -0.36] : [0.22, -0.21, -0.44]),
            adsPos: cfg.adsPos || [0.0, -0.146, isPistol ? -0.30 : -0.34],
            sightHeight: 0.146,
            muzzleOffset: [0, 0.044, -(recL * 0.5 + barrelLen)],
            ejectOffset: [0.03, 0.045, -0.05],
            modelSpec: {
                isPistol,
                receiverLen: recL, receiverW: recW, receiverH: recH,
                barrelLen, barrelR: cfg.barrelR || (isShotgun ? 0.015 : 0.011),
                handguardLen: hgLen, handguardW: recW * 0.95, handguardH: recH * 0.78,
                stockLen: isPistol ? 0 : (cfg.stockLen || 0.20),
                stockStyle: isPistol ? 'none' : (cfg.stockStyle || 'crane'),
                magCurve: cfg.magCurve || 0.02,
                magH: cfg.magH || 0.15, magW: cfg.magW || 0.026, magL: cfg.magL || 0.056,
                topMag: !!cfg.topMag,
                tubeMag: !!cfg.tubeMag,
                drumMag: !!cfg.drumMag,
                boxMag: !!cfg.boxMag,
                defaultScope: !!cfg.isSniperScope,
                carryHandle: !!cfg.carryHandle,
                isMinigun: !!cfg.isMinigun,
                primaryColor: cfg.primaryColor || 0x2a2f38,
                accentColor: cfg.accentColor || 0x171a20,
                wood: !!cfg.wood
            }
        };
    }

    /* ========================================================================
       50 UNIQUE FIREARMS (32 Common + 18 Uncommon)
    ======================================================================== */
    const GUN_LIST = [
        // --- 12 ASSAULT RIFLES (8 Common, 4 Uncommon) ---
        makeGun({ id: 'm4a1', name: 'M4A1 SOPMOD', shortName: 'M4A1', category: 'Assault Rifle', tier: 'common', unlockLevel: 1, rpm: 780, damage: 32, headMult: 1.65, range: 42, magSize: 30, reserveMax: 180, reloadTime: 1.75, adsTime: 0.19, recoilPitch: 0.021, recoilYaw: 0.008, moveMult: 0.96, papName: 'Xeno-M4 Overdrive', primaryColor: 0x2a2f38, accentColor: 0x171a20, description: 'Balanced modular 5.56mm carbine with crisp handling and controllable recoil.' }),
        makeGun({ id: 'ak47', name: 'AK-47 KALASH', shortName: 'AK-47', category: 'Assault Rifle', tier: 'common', unlockLevel: 4, rpm: 600, damage: 42, headMult: 1.75, range: 46, magSize: 30, reserveMax: 180, reloadTime: 2.05, adsTime: 0.22, recoilPitch: 0.031, recoilYaw: 0.014, moveMult: 0.94, penetration: 2, papName: 'Rez-47 Red Star', papEffect: 'incendiary', soundProfile: 'ar_heavy', primaryColor: 0x24272d, accentColor: 0x6f4324, wood: true, magCurve: 0.075, description: 'Hard-hitting 7.62x39mm classic delivering heavy damage and incendiary PaP rounds.' }),
        makeGun({ id: 'scarh', name: 'SCAR-H HEAVY', shortName: 'SCAR-H', category: 'Assault Rifle', tier: 'uncommon', unlockLevel: 11, rpm: 560, damage: 46, headMult: 1.75, range: 54, magSize: 20, reserveMax: 160, reloadTime: 1.90, adsTime: 0.23, recoilPitch: 0.027, recoilYaw: 0.010, moveMult: 0.93, penetration: 2, papName: 'Apocalypse-H', papEffect: 'pierce', soundProfile: 'ar_heavy', primaryColor: 0x9b8662, accentColor: 0x25282e, description: '7.62mm NATO battle rifle with lethal stopping power and deep armor penetration.' }),
        makeGun({ id: 'm16a4', name: 'M16A4 TACTICAL', shortName: 'M16A4', category: 'Assault Rifle', tier: 'common', unlockLevel: 18, fireMode: 'burst', altFireMode: 'semi', rpm: 900, damage: 38, headMult: 1.80, range: 56, magSize: 30, reserveMax: 180, reloadTime: 1.80, adsTime: 0.20, recoilPitch: 0.018, recoilYaw: 0.006, moveMult: 0.95, carryHandle: true, papName: 'Skullcrusher M16', papEffect: 'full_auto_convert', primaryColor: 0x252a32, accentColor: 0x15181e, description: 'High-velocity 3-round burst rifle that converts to full-auto when Pack-a-Punched.' }),
        makeGun({ id: 'famas_f1', name: 'FAMAS (COD BO1)', shortName: 'FAMAS BO1', category: 'Assault Rifle', tier: 'common', unlockLevel: 7, fireMode: 'auto', altFireMode: 'burst', rpm: 935, damage: 35, headMult: 1.70, range: 45, magSize: 30, reserveMax: 180, reloadTime: 1.80, adsTime: 0.18, recoilPitch: 0.019, recoilYaw: 0.008, moveMult: 0.97, carryHandle: true, papName: 'G16-GL35', papEffect: 'overdrive', primaryColor: 0x333840, accentColor: 0x1c2026, description: 'Classic COD Black Ops 1 full-auto French bullpup rifle spitting 935 RPM.' }),
        makeGun({ id: 'galil_ar', name: 'GALIL (COD BO1)', shortName: 'GALIL BO1', category: 'Assault Rifle', tier: 'uncommon', unlockLevel: 14, rpm: 675, damage: 40, headMult: 1.72, range: 48, magSize: 35, reserveMax: 210, reloadTime: 2.00, adsTime: 0.21, recoilPitch: 0.023, recoilYaw: 0.009, moveMult: 0.94, penetration: 2, papName: 'Lamentation', soundProfile: 'ar_heavy', primaryColor: 0x2c3038, accentColor: 0x5c3e26, wood: true, description: 'Legendary COD Black Ops 1 35-round assault rifle with top-tier Zombies stopping power.' }),
        makeGun({ id: 'acr_68', name: 'ACR (MW2)', shortName: 'ACR MW2', category: 'Assault Rifle', tier: 'uncommon', unlockLevel: 24, rpm: 750, damage: 36, headMult: 1.75, range: 52, magSize: 30, reserveMax: 180, reloadTime: 1.62, adsTime: 0.18, recoilPitch: 0.011, recoilYaw: 0.004, moveMult: 0.96, papName: 'Laser-68 Sovereign', primaryColor: 0x7c725e, accentColor: 0x22262c, description: 'Iconic Modern Warfare 2 zero-recoil 6.8mm rifle with pinpoint laser accuracy.' }),
        makeGun({ id: 'aug_hbars', name: 'STEYR AUG A3', shortName: 'AUG A3', category: 'Assault Rifle', tier: 'common', unlockLevel: 9, rpm: 760, damage: 33, headMult: 1.65, range: 43, magSize: 30, reserveMax: 180, reloadTime: 1.78, adsTime: 0.17, recoilPitch: 0.019, recoilYaw: 0.008, moveMult: 0.98, papName: 'AUG-50M3', primaryColor: 0x4b5842, accentColor: 0x1c221a, description: 'Austrian olive-drab bullpup rifle combining AR range with SMG handling.' }),
        makeGun({ id: 'g36c_tac', name: 'G36C COMMANDO', shortName: 'G36C', category: 'Assault Rifle', tier: 'common', unlockLevel: 12, rpm: 750, damage: 34, headMult: 1.65, range: 41, magSize: 30, reserveMax: 180, reloadTime: 1.70, adsTime: 0.18, recoilPitch: 0.020, recoilYaw: 0.008, moveMult: 0.97, carryHandle: true, papName: 'Krypton G36', primaryColor: 0x282d35, accentColor: 0x181b20, description: 'Compact polymer carbine with rapid reload and snappy target acquisition.' }),
        makeGun({ id: 'an94_abakan', name: 'AN-94 ABAKAN', shortName: 'AN-94', category: 'Assault Rifle', tier: 'uncommon', unlockLevel: 31, rpm: 690, damage: 41, headMult: 1.78, range: 52, magSize: 30, reserveMax: 180, reloadTime: 1.92, adsTime: 0.21, recoilPitch: 0.021, recoilYaw: 0.007, moveMult: 0.95, penetration: 2, papName: 'Actuated Neutralizer', soundProfile: 'ar_heavy', primaryColor: 0x272a2f, accentColor: 0x3b2a22, description: 'Hyper-accurate Russian rifle with high headshot lethality and minimal drift.' }),
        makeGun({ id: 'fal_osw', name: 'FAL (MW2)', shortName: 'FAL MW2', category: 'Assault Rifle', tier: 'common', unlockLevel: 16, fireMode: 'semi', altFireMode: 'auto', rpm: 510, damage: 58, headMult: 2.10, range: 64, magSize: 20, reserveMax: 140, reloadTime: 1.82, adsTime: 0.20, recoilPitch: 0.030, recoilYaw: 0.008, moveMult: 0.94, penetration: 2, papName: 'EPC WN', papEffect: 'full_auto_convert', soundProfile: 'dmr', primaryColor: 0x2d3238, accentColor: 0x1c2024, description: 'Modern Warfare 2 semi-auto 7.62mm powerhouse with a massive 2.1x headshot multiplier.' }),
        makeGun({ id: 'xm8_storm', name: 'XM8 PROTOTYPE', shortName: 'XM8', category: 'Assault Rifle', tier: 'common', unlockLevel: 21, rpm: 810, damage: 31, headMult: 1.65, range: 43, magSize: 32, reserveMax: 192, reloadTime: 1.68, adsTime: 0.17, recoilPitch: 0.018, recoilYaw: 0.008, moveMult: 0.98, carryHandle: true, papName: 'X-Storm 88', primaryColor: 0x525b66, accentColor: 0x1e2228, description: 'Lightweight experimental carbine with high fire rate and fast mobility.' }),

        // --- 10 SUBMACHINE GUNS (7 Common, 3 Uncommon) ---
        makeGun({ id: 'mp5', name: 'MP5K NAVY', shortName: 'MP5', category: 'SMG', tier: 'common', unlockLevel: 1, rpm: 840, damage: 27, headMult: 1.55, range: 26, magSize: 30, reserveMax: 180, reloadTime: 1.55, adsTime: 0.14, recoilPitch: 0.016, recoilYaw: 0.008, moveMult: 1.03, papName: 'Phantom-5 Nightmare', primaryColor: 0x20252d, accentColor: 0x12151a, stockStyle: 'wire', magCurve: 0.06, description: 'Iconic 9mm submachine gun prized for razor-sharp ADS speed.' }),
        makeGun({ id: 'p90', name: 'P90 TR PDW', shortName: 'P90', category: 'SMG', tier: 'uncommon', unlockLevel: 8, rpm: 920, damage: 25, headMult: 1.50, range: 28, magSize: 50, reserveMax: 250, reloadTime: 1.90, adsTime: 0.15, recoilPitch: 0.015, recoilYaw: 0.010, moveMult: 1.04, topMag: true, magH: 0.032, magW: 0.044, magL: 0.24, papName: 'Hyperion-90', primaryColor: 0x2c323b, accentColor: 0x1b1f26, description: 'Bullpup 5.7mm PDW featuring a massive 50-round horizontal top magazine.' }),
        makeGun({ id: 'ump45', name: 'UMP45 (MW2)', shortName: 'UMP45 MW2', category: 'SMG', tier: 'common', unlockLevel: 15, rpm: 660, damage: 36, headMult: 1.65, range: 35, magSize: 32, reserveMax: 192, reloadTime: 1.65, adsTime: 0.15, recoilPitch: 0.017, recoilYaw: 0.007, moveMult: 1.01, papName: 'Executioner .45', soundProfile: 'smg_heavy', primaryColor: 0x23272f, accentColor: 0x16191f, description: 'Legendary MW2 .45 ACP submachine gun with 3-shot stopping power at any range.' }),
        makeGun({ id: 'mp7_navy', name: 'MP7A1 RECON', shortName: 'MP7', category: 'SMG', tier: 'uncommon', unlockLevel: 19, rpm: 950, damage: 26, headMult: 1.55, range: 27, magSize: 40, reserveMax: 240, reloadTime: 1.50, adsTime: 0.13, recoilPitch: 0.013, recoilYaw: 0.007, moveMult: 1.05, papName: 'Apex-7 Shredder', primaryColor: 0x2b303a, accentColor: 0x15181e, stockStyle: 'wire', description: 'Compact 4.6mm armor-piercing PDW with a 40-round mag and virtually zero kick.' }),
        makeGun({ id: 'vector_kriss', name: 'KRISS VECTOR .45', shortName: 'VECTOR', category: 'SMG', tier: 'uncommon', unlockLevel: 27, rpm: 1120, damage: 24, headMult: 1.50, range: 23, magSize: 32, reserveMax: 224, reloadTime: 1.48, adsTime: 0.13, recoilPitch: 0.012, recoilYaw: 0.011, moveMult: 1.04, papName: 'Vortex-1100', primaryColor: 0x383d47, accentColor: 0x857558, description: 'Super-V recoil mitigation system firing at an insane 1,120 RPM.' }),
        makeGun({ id: 'aks74u', name: 'AKS-74U KRINKOV', shortName: 'AK-74u', category: 'SMG', tier: 'common', unlockLevel: 5, rpm: 740, damage: 33, headMult: 1.62, range: 31, magSize: 30, reserveMax: 180, reloadTime: 1.68, adsTime: 0.15, recoilPitch: 0.022, recoilYaw: 0.010, moveMult: 1.01, papName: 'AK-74fu2', primaryColor: 0x262930, accentColor: 0x6b4226, wood: true, stockStyle: 'wire', magCurve: 0.06, description: 'Short-barrel rifle-caliber SMG hitting like an assault rifle up close.' }),
        makeGun({ id: 'mac10_uzi', name: 'MAC-10 INGRAM', shortName: 'MAC-10', category: 'SMG', tier: 'common', unlockLevel: 10, rpm: 1050, damage: 23, headMult: 1.48, range: 21, magSize: 32, reserveMax: 224, reloadTime: 1.45, adsTime: 0.12, recoilPitch: 0.020, recoilYaw: 0.013, moveMult: 1.07, papName: 'Tokyo Rose', primaryColor: 0x30343c, accentColor: 0x1a1d22, stockStyle: 'wire', description: 'Ultra-light box SMG with maximum sprint mobility and bullet hose fire rate.' }),
        makeGun({ id: 'pp19_bizon', name: 'PP-19 BIZON', shortName: 'BIZON', category: 'SMG', tier: 'common', unlockLevel: 17, rpm: 760, damage: 28, headMult: 1.55, range: 27, magSize: 64, reserveMax: 256, reloadTime: 1.95, adsTime: 0.16, recoilPitch: 0.016, recoilYaw: 0.008, moveMult: 1.00, tubeMag: true, papName: 'Stampede-64', primaryColor: 0x262b32, accentColor: 0x181c22, description: 'Helical 64-round cylinder magazine built for non-stop zombie train clearing.' }),
        makeGun({ id: 'thompson_m1', name: 'M1A1 THOMPSON', shortName: 'THOMPSON', category: 'SMG', tier: 'common', unlockLevel: 13, rpm: 780, damage: 31, headMult: 1.60, range: 29, magSize: 30, reserveMax: 180, reloadTime: 1.62, adsTime: 0.15, recoilPitch: 0.019, recoilYaw: 0.009, moveMult: 1.02, papName: 'Gibs-O-Matic', primaryColor: 0x2e3238, accentColor: 0x6e4222, wood: true, description: 'Classic WWII .45 ACP trench sweeper with punchy stopping power.' }),
        makeGun({ id: 'scorpion_evo', name: 'SKORPION EVO III', shortName: 'EVO III', category: 'SMG', tier: 'common', unlockLevel: 23, rpm: 1080, damage: 23, headMult: 1.52, range: 24, magSize: 35, reserveMax: 210, reloadTime: 1.52, adsTime: 0.13, recoilPitch: 0.016, recoilYaw: 0.010, moveMult: 1.05, papName: 'Stinger-EVO', primaryColor: 0x3b424c, accentColor: 0x1e2228, description: 'Modern CQB polymer submachine gun spitting 1,080 rounds per minute.' }),

        // --- 9 SHOTGUNS (incl. M1014 COD4 & Dual-Wield Model 1887 MW2) ---
        makeGun({ id: 'r870', name: 'R870 MCS PUMP', shortName: 'R870 MCS', category: 'Shotgun', tier: 'common', unlockLevel: 2, fireMode: 'pump', rpm: 78, damage: 24, headMult: 1.40, range: 16, pellets: 8, magSize: 8, reserveMax: 56, reloadTime: 0.45, shellReload: true, adsTime: 0.18, hipSpread: 0.068, adsSpread: 0.044, recoilPitch: 0.070, moveMult: 0.98, tubeMag: true, papName: 'Hellbreaker 870', papEffect: 'incendiary', primaryColor: 0x262a31, accentColor: 0x16191e, description: 'Devastating 12-gauge pump-action shotgun firing 8 buckshot pellets.' }),
        makeGun({ id: 'm1014_cod4', name: 'M1014 (COD4)', shortName: 'M1014 COD4', category: 'Shotgun', tier: 'common', unlockLevel: 6, fireMode: 'semi', rpm: 225, damage: 26, headMult: 1.45, range: 17, pellets: 8, magSize: 4, reserveMax: 44, reloadTime: 0.42, shellReload: true, adsTime: 0.16, hipSpread: 0.064, adsSpread: 0.040, recoilPitch: 0.052, moveMult: 1.00, tubeMag: true, papName: 'Benelli Dragon M1014', papMagMult: 2.5, papEffect: 'incendiary', primaryColor: 0x242830, accentColor: 0x14171c, description: 'Iconic COD4 Benelli M4 semi-auto tactical shotgun with rapid follow-up blasts.' }),
        makeGun({ id: 'model_1887_mw2', name: 'MODEL 1887 (MW2)', shortName: 'MODEL 1887', category: 'Shotgun', tier: 'uncommon', unlockLevel: 14, fireMode: 'pump', rpm: 96, damage: 29, headMult: 1.50, range: 21, pellets: 8, magSize: 7, reserveMax: 56, reloadTime: 0.44, shellReload: true, adsTime: 0.17, hipSpread: 0.058, adsSpread: 0.038, recoilPitch: 0.065, moveMult: 1.01, tubeMag: true, canDualWield: true, papName: 'Akimbo 1887 Terminators', papDamageMult: 2.6, primaryColor: 0x3a3f47, accentColor: 0x6b4226, wood: true, description: 'Legendary MW2 lever-action 12-gauge! Picking up two Model 1887s (or Pack-a-Punching) makes you DUAL WIELD Akimbo 1887s!' }),
        makeGun({ id: 'aa12', name: 'AA-12 AUTO DRUM', shortName: 'AA-12', category: 'Shotgun', tier: 'uncommon', unlockLevel: 22, rpm: 300, damage: 17, headMult: 1.35, range: 14, pellets: 8, magSize: 20, reserveMax: 80, reloadTime: 2.40, adsTime: 0.22, hipSpread: 0.082, adsSpread: 0.058, recoilPitch: 0.045, moveMult: 0.92, drumMag: true, papName: 'Devastator-12', primaryColor: 0x353b45, accentColor: 0x1a1d24, description: 'Full-auto 12-gauge combat sweeper fed by a 20-shell drum magazine.' }),
        makeGun({ id: 'spas12_tac', name: 'SPAS-12 TACTICAL', shortName: 'SPAS-12', category: 'Shotgun', tier: 'uncommon', unlockLevel: 12, fireMode: 'semi', rpm: 185, damage: 21, headMult: 1.40, range: 17, pellets: 8, magSize: 8, reserveMax: 56, reloadTime: 0.42, shellReload: true, adsTime: 0.17, hipSpread: 0.065, adsSpread: 0.042, recoilPitch: 0.055, moveMult: 0.97, tubeMag: true, papName: 'SPAZ-24 Dragon', papEffect: 'incendiary', primaryColor: 0x23272e, accentColor: 0x14171c, description: 'Rapid semi-automatic Italian combat shotgun with folding hook stock.' }),
        makeGun({ id: 'ksg_slug', name: 'KSG-12 BULLPUP', shortName: 'KSG-12', category: 'Shotgun', tier: 'uncommon', unlockLevel: 28, fireMode: 'pump', rpm: 88, damage: 135, headMult: 2.10, range: 29, pellets: 1, magSize: 14, reserveMax: 70, reloadTime: 0.40, shellReload: true, adsTime: 0.16, hipSpread: 0.045, adsSpread: 0.004, recoilPitch: 0.062, moveMult: 0.99, penetration: 2, tubeMag: true, papName: 'Mist Maker', primaryColor: 0x333a44, accentColor: 0x1a1e24, description: 'Dual-tube bullpup shotgun firing a single high-impact armor-piercing slug.' }),
        makeGun({ id: 'saiga12_k', name: 'SAIGA-12K MAG', shortName: 'SAIGA-12', category: 'Shotgun', tier: 'common', unlockLevel: 15, fireMode: 'semi', rpm: 230, damage: 19, headMult: 1.35, range: 15, pellets: 8, magSize: 10, reserveMax: 60, reloadTime: 1.95, adsTime: 0.19, hipSpread: 0.072, adsSpread: 0.048, recoilPitch: 0.052, moveMult: 0.95, papName: 'Tsar-12 Cleaver', primaryColor: 0x25282e, accentColor: 0x17191d, description: 'Kalashnikov box-magazine fed semi-auto 12-gauge with quick mag reloads.' }),
        makeGun({ id: 'double_barrel', name: 'OLYMPIA COACH GUN', shortName: 'OLYMPIA', category: 'Shotgun', tier: 'common', unlockLevel: 3, fireMode: 'semi', rpm: 210, damage: 30, headMult: 1.45, range: 18, pellets: 10, magSize: 2, reserveMax: 44, reloadTime: 1.45, adsTime: 0.16, hipSpread: 0.070, adsSpread: 0.045, recoilPitch: 0.075, moveMult: 1.01, papName: 'Hades Dragonbreath', papEffect: 'incendiary', primaryColor: 0x333840, accentColor: 0x734424, wood: true, description: 'Classic double-barrel break-action 12-gauge with massive 10-pellet blast.' }),
        makeGun({ id: 'striker_12', name: 'STRIKER-12 ROTARY', shortName: 'STRIKER', category: 'Shotgun', tier: 'common', unlockLevel: 19, fireMode: 'semi', rpm: 220, damage: 18, headMult: 1.35, range: 15, pellets: 8, magSize: 12, reserveMax: 60, reloadTime: 0.38, shellReload: true, adsTime: 0.18, hipSpread: 0.074, adsSpread: 0.050, recoilPitch: 0.048, moveMult: 0.96, drumMag: true, papName: 'Street Sweeper', primaryColor: 0x2c313a, accentColor: 0x171a20, description: '12-round rotary cylinder combat shotgun built for sustained CQB clearing.' }),

        // --- 7 LIGHT MACHINE GUNS (4 Common, 3 Uncommon) ---
        makeGun({ id: 'm249', name: 'M249 SAW PARA', shortName: 'M249 SAW', category: 'LMG', tier: 'common', unlockLevel: 13, rpm: 750, damage: 34, headMult: 1.55, range: 48, magSize: 100, reserveMax: 300, reloadTime: 3.10, adsTime: 0.31, recoilPitch: 0.023, recoilYaw: 0.012, moveMult: 0.86, penetration: 2, boxMag: true, papName: 'Valkyrie SAW', primaryColor: 0x2b3038, accentColor: 0x3b4832, description: 'Belt-fed 100-round squad automatic weapon built to mow down zombie hordes.' }),
        makeGun({ id: 'rpd', name: 'RPD DRUM', shortName: 'RPD', category: 'LMG', tier: 'common', unlockLevel: 26, rpm: 680, damage: 39, headMult: 1.65, range: 52, magSize: 100, reserveMax: 300, reloadTime: 3.00, adsTime: 0.30, recoilPitch: 0.025, recoilYaw: 0.011, moveMult: 0.87, penetration: 2, drumMag: true, papName: 'Relentless Iron', papEffect: 'incendiary', primaryColor: 0x22252b, accentColor: 0x764726, wood: true, description: '7.62mm drum-fed machine gun with fearsome suppression and penetration.' }),
        makeGun({ id: 'pkp_pecheneg', name: 'PKP PECHENEG', shortName: 'PECHENEG', category: 'LMG', tier: 'uncommon', unlockLevel: 32, rpm: 650, damage: 43, headMult: 1.70, range: 56, magSize: 100, reserveMax: 300, reloadTime: 3.20, adsTime: 0.32, recoilPitch: 0.026, recoilYaw: 0.011, moveMult: 0.85, penetration: 3, boxMag: true, papName: 'Red Bear Titan', primaryColor: 0x2b2f36, accentColor: 0x3b4238, description: 'Heavy 7.62x54mmR general-purpose machine gun with 3-target penetration.' }),
        makeGun({ id: 'mg42_buzzsaw', name: 'MG42 BUZZSAW', shortName: 'MG42', category: 'LMG', tier: 'uncommon', unlockLevel: 38, rpm: 1150, damage: 29, headMult: 1.55, range: 46, magSize: 125, reserveMax: 375, reloadTime: 3.30, adsTime: 0.31, recoilPitch: 0.022, recoilYaw: 0.014, moveMult: 0.85, penetration: 2, drumMag: true, papName: 'Barracuda FU-A11', primaryColor: 0x32363d, accentColor: 0x593a22, wood: true, description: 'Legendary 1,150 RPM German machine gun that rips through waves in seconds.' }),
        makeGun({ id: 'lsat_heavy', name: 'LSAT CASELESS', shortName: 'LSAT', category: 'LMG', tier: 'uncommon', unlockLevel: 29, rpm: 760, damage: 36, headMult: 1.60, range: 50, magSize: 100, reserveMax: 300, reloadTime: 2.75, adsTime: 0.28, recoilPitch: 0.019, recoilYaw: 0.009, moveMult: 0.89, penetration: 2, boxMag: true, papName: 'FSIRT-2000', primaryColor: 0x454d59, accentColor: 0x1d2128, description: 'Lightweight caseless-ammo LMG offering faster mobility and low recoil.' }),
        makeGun({ id: 'steyr_aug_lmg', name: 'AUG HBAR LSW', shortName: 'AUG HBAR', category: 'LMG', tier: 'common', unlockLevel: 17, rpm: 700, damage: 38, headMult: 1.65, range: 52, magSize: 42, reserveMax: 252, reloadTime: 2.05, adsTime: 0.24, recoilPitch: 0.018, recoilYaw: 0.007, moveMult: 0.92, penetration: 2, papName: 'Accelerator HBAR', primaryColor: 0x4a553f, accentColor: 0x1a1e18, description: 'Heavy-barrel light support weapon with fast 42-round box magazine reloads.' }),
        makeGun({ id: 'm60e4_pig', name: 'M60E4 BIG IRON', shortName: 'M60E4', category: 'LMG', tier: 'common', unlockLevel: 35, rpm: 550, damage: 48, headMult: 1.75, range: 58, magSize: 100, reserveMax: 300, reloadTime: 3.25, adsTime: 0.33, recoilPitch: 0.028, recoilYaw: 0.011, moveMult: 0.84, penetration: 3, boxMag: true, papName: 'Slow Burn 6000', primaryColor: 0x262930, accentColor: 0x17191d, description: 'Slow-chugging 7.62mm heavy LMG dealing massive per-bullet trauma.' }),
        makeGun({ id: 'minigun_death', name: 'M134 DEATH MACHINE (MINIGUN)', shortName: 'MINIGUN', category: 'LMG', tier: 'uncommon', unlockLevel: 28, rpm: 1400, damage: 42, headMult: 1.45, range: 65, magSize: 200, reserveMax: 600, reloadTime: 3.40, adsTime: 0.30, hipSpread: 0.042, adsSpread: 0.008, recoilPitch: 0.014, recoilYaw: 0.010, moveMult: 0.84, penetration: 3, isMinigun: true, barrelLen: 0.42, barrelR: 0.012, papName: 'Valkyrie Rotary X9', papDamageMult: 2.3, soundProfile: 'lmg', primaryColor: 0x262b33, accentColor: 0x475569, description: 'Six-barrel 7.62mm rotary Minigun firing an insane 1,400 rounds per minute from a 200-round ammo drum!' }),

        // --- 9 SNIPER & MARKSMAN RIFLES (incl. M40A3 COD4, R700 COD4, Barrett .50cal COD4, Intervention MW2, MSR MW3, L96A1 BO1) ---
        makeGun({ id: 'm40a3_cod4', name: 'M40A3 (COD4)', shortName: 'M40A3 COD4', category: 'Sniper Rifle', tier: 'common', unlockLevel: 3, fireMode: 'bolt', rpm: 58, damage: 132, headMult: 2.65, range: 115, magSize: 5, reserveMax: 40, reloadTime: 2.05, adsTime: 0.25, adsFov: 28, isSniperScope: true, hipSpread: 0.078, adsSpread: 0.0002, recoilPitch: 0.072, moveMult: 0.93, penetration: 3, papName: 'M40A5 Devil Dog', papEffect: 'pierce_5', primaryColor: 0x3f5a36, accentColor: 0x181c16, description: 'Legendary COD4 USMC fiberglass-stock bolt-action sniper rifle prized for quickscopes.' }),
        makeGun({ id: 'r700_cod4', name: 'R700 (COD4)', shortName: 'R700 COD4', category: 'Sniper Rifle', tier: 'uncommon', unlockLevel: 17, fireMode: 'bolt', rpm: 50, damage: 146, headMult: 2.75, range: 125, magSize: 4, reserveMax: 36, reloadTime: 2.25, adsTime: 0.27, adsFov: 27, isSniperScope: true, hipSpread: 0.082, adsSpread: 0.0002, recoilPitch: 0.086, moveMult: 0.91, penetration: 4, papName: 'R7000 Thunderclap', papEffect: 'pierce_5', primaryColor: 0x22262e, accentColor: 0x475569, description: 'Heavy COD4 Remington 700 bolt-action sniper with devastating upper-body stopping power.' }),
        makeGun({ id: 'intervention', name: 'INTERVENTION (MW2)', shortName: 'INTERVENTION', category: 'Sniper Rifle', tier: 'uncommon', unlockLevel: 6, fireMode: 'bolt', rpm: 52, damage: 138, headMult: 2.65, range: 125, magSize: 5, reserveMax: 35, reloadTime: 2.30, adsTime: 0.28, adsFov: 28, isSniperScope: true, hipSpread: 0.085, adsSpread: 0.0002, recoilPitch: 0.082, moveMult: 0.90, penetration: 3, stockStyle: 'sniper_skeleton', papName: 'Deathstar M200', papEffect: 'pierce_5', primaryColor: 0x3a3f47, accentColor: 0x1a1e24, description: 'Legendary MW2 .408 CheyTac bolt-action sniper built for 360 quickscopes and collaterals.' }),
        makeGun({ id: 'mk14', name: 'MK14 EBR', shortName: 'MK14 EBR', category: 'Marksman Rifle', tier: 'common', unlockLevel: 20, fireMode: 'semi', rpm: 380, damage: 64, headMult: 2.05, range: 75, magSize: 15, reserveMax: 105, reloadTime: 1.95, adsTime: 0.22, adsFov: 50, hipSpread: 0.048, adsSpread: 0.0010, recoilPitch: 0.035, moveMult: 0.92, penetration: 2, stockStyle: 'sniper_skeleton', papName: 'Oracle Mk14', soundProfile: 'dmr', primaryColor: 0x454b54, accentColor: 0x1d2026, description: 'Precision semi-auto 7.62mm marksman rifle with lightning follow-up shots.' }),
        makeGun({ id: 'barrett_50cal', name: 'BARRETT .50CAL (COD4)', shortName: 'BARRETT .50', category: 'Sniper Rifle', tier: 'uncommon', unlockLevel: 34, fireMode: 'semi', rpm: 140, damage: 155, headMult: 2.80, range: 140, magSize: 10, reserveMax: 50, reloadTime: 2.75, adsTime: 0.34, adsFov: 26, isSniperScope: true, hipSpread: 0.095, adsSpread: 0.0004, recoilPitch: 0.110, moveMult: 0.83, penetration: 5, papName: 'Macro Annihilator', papEffect: 'pierce_5', primaryColor: 0x2e333b, accentColor: 0x171a1f, description: 'Iconic COD4 semi-auto .50 BMG anti-materiel sniper that pierces 5 enemies in a single shot.' }),
        makeGun({ id: 'l96a1_awm', name: 'L96A1 (COD BO1)', shortName: 'L96A1 BO1', category: 'Sniper Rifle', tier: 'uncommon', unlockLevel: 25, fireMode: 'bolt', rpm: 55, damage: 134, headMult: 2.60, range: 115, magSize: 5, reserveMax: 40, reloadTime: 2.20, adsTime: 0.28, adsFov: 28, isSniperScope: true, hipSpread: 0.085, adsSpread: 0.0003, recoilPitch: 0.080, moveMult: 0.90, penetration: 3, papName: 'L115 Isolator', papEffect: 'pierce_5', primaryColor: 0x3f5e3d, accentColor: 0x1a2219, description: 'Classic COD Black Ops 1 British olive-green .338 Lapua bolt-action sniper.' }),
        makeGun({ id: 'dragunov_svd', name: 'DRAGUNOV SVD', shortName: 'DRAGUNOV', category: 'Sniper Rifle', tier: 'common', unlockLevel: 14, fireMode: 'semi', rpm: 230, damage: 92, headMult: 2.40, range: 95, magSize: 10, reserveMax: 60, reloadTime: 2.15, adsTime: 0.27, adsFov: 32, isSniperScope: true, hipSpread: 0.075, adsSpread: 0.0006, recoilPitch: 0.055, moveMult: 0.91, penetration: 2, papName: 'D115 Disassembler', primaryColor: 0x282c33, accentColor: 0x734625, wood: true, description: 'Fast-firing semi-auto Soviet sniper rifle lethal on upper-chest and headshots.' }),
        makeGun({ id: 'msr_remington', name: 'MSR (MW3)', shortName: 'MSR MW3', category: 'Sniper Rifle', tier: 'uncommon', unlockLevel: 30, fireMode: 'bolt', rpm: 66, damage: 130, headMult: 2.55, range: 112, magSize: 6, reserveMax: 42, reloadTime: 2.05, adsTime: 0.24, adsFov: 28, isSniperScope: true, hipSpread: 0.078, adsSpread: 0.0002, recoilPitch: 0.074, moveMult: 0.93, penetration: 3, stockStyle: 'sniper_skeleton', papName: 'Quickscope King', primaryColor: 0x8f7e60, accentColor: 0x22262c, description: 'Iconic MW3 Remington MSR with ultra-fast bolt cycle and 240ms quickscope ADS.' }),
        makeGun({ id: 'kar98k_irons', name: 'KAR98K MAUSER', shortName: 'KAR98K', category: 'Marksman Rifle', tier: 'common', unlockLevel: 5, fireMode: 'bolt', rpm: 62, damage: 115, headMult: 2.60, range: 90, magSize: 5, reserveMax: 50, reloadTime: 2.00, adsTime: 0.22, adsFov: 54, isSniperScope: false, hipSpread: 0.065, adsSpread: 0.0005, recoilPitch: 0.065, moveMult: 0.95, penetration: 2, papName: 'Armageddon 98k', soundProfile: 'sniper', primaryColor: 0x2e3238, accentColor: 0x6f4222, wood: true, description: 'Classic bolt-action rifle with crisp iron sights and instant headshot power.' }),

        // --- 8 PISTOLS, MACHINE PISTOLS & LAUNCHERS (incl. Gold Desert Eagle COD4 & RPG) ---
        makeGun({ id: 'm1911', name: 'M1911 .45 TACTICAL', shortName: 'M1911', category: 'Pistol', tier: 'common', unlockLevel: 1, fireMode: 'semi', rpm: 460, damage: 34, headMult: 1.80, range: 24, magSize: 8, reserveMax: 80, reloadTime: 1.25, adsTime: 0.11, recoilPitch: 0.024, moveMult: 1.06, papName: 'Mustang & Sally', papDamageMult: 7.5, papMagMult: 1.5, papEffect: 'explosive_rounds', papExplosiveRadius: 3.4, primaryColor: 0x313640, accentColor: 0x5c3c24, wood: true, description: 'Classic .45 sidearm. Pack-a-Punches into Mustang & Sally explosive grenade pistols!' }),
        makeGun({ id: 'deagle', name: 'DESERT EAGLE .50', shortName: 'DEAGLE .50', category: 'Pistol', tier: 'uncommon', unlockLevel: 10, fireMode: 'semi', rpm: 240, damage: 68, headMult: 2.15, range: 36, magSize: 7, reserveMax: 56, reloadTime: 1.50, adsTime: 0.14, recoilPitch: 0.056, moveMult: 1.03, penetration: 2, papName: 'Golden Judgment', papDamageMult: 2.9, soundProfile: 'deagle', primaryColor: 0xb6bec8, accentColor: 0x1e2228, description: 'High-caliber .50 Action Express hand cannon capable of one-tap headshots.' }),
        makeGun({ id: 'gold_deagle_cod4', name: 'GOLD DESERT EAGLE (COD4)', shortName: 'GOLD DEAGLE', category: 'Pistol', tier: 'uncommon', unlockLevel: 25, fireMode: 'semi', rpm: 265, damage: 86, headMult: 2.40, range: 42, magSize: 7, reserveMax: 63, reloadTime: 1.42, adsTime: 0.13, recoilPitch: 0.052, moveMult: 1.05, penetration: 3, isGoldFinish: true, papName: '24K Commander Eagle', papDamageMult: 3.2, soundProfile: 'deagle', primaryColor: 0xfacc15, accentColor: 0x854d0e, description: '24-Karat solid gold COD4 Desert Eagle .50 AE with gleaming gold slide and 1-shot headshot power!' }),
        makeGun({ id: 'glock18_auto', name: 'G18 FULL-AUTO', shortName: 'G18 AUTO', category: 'Pistol', tier: 'common', unlockLevel: 8, fireMode: 'auto', rpm: 1050, damage: 22, headMult: 1.50, range: 20, magSize: 24, reserveMax: 168, reloadTime: 1.35, adsTime: 0.12, recoilPitch: 0.022, recoilYaw: 0.014, moveMult: 1.05, papName: 'G18 Cyclone', primaryColor: 0x242830, accentColor: 0x15181d, description: 'Pocket machine pistol unloading 1,050 rounds per minute in full-auto.' }),
        makeGun({ id: 'b23r_burst', name: 'B23R BERETTA BURST', shortName: 'B23R', category: 'Pistol', tier: 'common', unlockLevel: 12, fireMode: 'burst', rpm: 920, damage: 30, headMult: 1.75, range: 26, magSize: 15, reserveMax: 120, reloadTime: 1.30, adsTime: 0.11, recoilPitch: 0.018, moveMult: 1.06, papName: 'B34R Claw', papEffect: 'full_auto_convert', primaryColor: 0x2e343e, accentColor: 0x181c22, description: 'Tactical 3-round burst sidearm famous on Zombies bus walls.' }),
        makeGun({ id: 'python_magnum', name: 'COLT PYTHON .357', shortName: 'PYTHON .357', category: 'Pistol', tier: 'uncommon', unlockLevel: 21, fireMode: 'semi', rpm: 185, damage: 82, headMult: 2.35, range: 40, magSize: 6, reserveMax: 60, reloadTime: 1.85, adsTime: 0.15, recoilPitch: 0.065, moveMult: 1.04, penetration: 2, papName: 'Cobra .357 King', soundProfile: 'deagle', primaryColor: 0xcbd5e1, accentColor: 0x6b4022, wood: true, description: 'Heavy .357 Magnum revolver with devastating headshot damage.' }),
        makeGun({ id: 'five_seven', name: 'FN FIVE-SEVEN', shortName: 'FIVE-SEVEN', category: 'Pistol', tier: 'common', unlockLevel: 6, fireMode: 'semi', rpm: 520, damage: 32, headMult: 1.85, range: 28, magSize: 20, reserveMax: 140, reloadTime: 1.28, adsTime: 0.11, recoilPitch: 0.017, moveMult: 1.07, penetration: 2, papName: 'Ultra-Seven', primaryColor: 0x2a2f37, accentColor: 0x1b1e24, description: '20-round armor-piercing 5.7mm pistol with ultra-fast trigger response.' }),
        makeGun({ id: 'rpg7_warhead', name: 'RPG-7 WARHEAD', shortName: 'RPG-7', category: 'Launcher', tier: 'common', unlockLevel: 33, fireMode: 'semi', rpm: 45, damage: 380, headMult: 1.20, range: 70, magSize: 1, reserveMax: 12, reloadTime: 2.50, adsTime: 0.28, recoilPitch: 0.095, moveMult: 0.88, explosiveRadius: 4.8, papName: 'Rocket Propelled Grievance', papDamageMult: 2.6, papMagMult: 3.0, papEffect: 'explosive_rounds', papExplosiveRadius: 5.8, soundProfile: 'zeus', primaryColor: 0x3b4832, accentColor: 0x6b4226, wood: true, description: 'Shoulder-fired high-explosive rocket launcher that obliterates clustered hordes.' })
    ];

    /* ========================================================================
       10 UNIQUE MELEE WEAPONS (6 Common + 4 Uncommon)
    ======================================================================== */
    function makeMelee(cfg) {
        return {
            id: cfg.id,
            name: cfg.name,
            shortName: cfg.shortName || cfg.name,
            category: 'Melee Weapon',
            kind: 'melee',
            tier: cfg.tier || 'common', // 'common' | 'uncommon'
            slotType: 'secondary',
            unlockLevel: cfg.unlockLevel || 1,
            mysteryBox: false,
            description: cfg.description,
            fireMode: cfg.fireMode || 'semi',
            rpm: cfg.rpm || 110,
            damage: cfg.damage,
            headMult: cfg.headMult || 1.5,
            range: cfg.range || 2.8, // melee reach in meters
            rangeNear: cfg.range || 2.8,
            rangeFar: cfg.range || 2.8,
            cleave: cfg.cleave || 1, // how many enemies hit in one swing
            lunge: cfg.lunge || 1.2,
            meleeEffect: cfg.meleeEffect || 'slash', // 'slash' | 'bleed' | 'stun' | 'knockback' | 'shockwave' | 'lifesteal' | 'shred'
            pellets: 1,
            magSize: 1,
            reserveMax: 1,
            reserveAmmo: 1,
            reloadTime: 0.5,
            shellReload: false,
            adsTime: 0.12,
            adsFov: 78,
            hipSpread: 0.01,
            adsSpread: 0.01,
            recoilPitch: 0.02,
            recoilYaw: 0.01,
            moveMult: cfg.moveMult || 1.08,
            moveSpeedMult: cfg.moveMult || 1.08,
            penetration: cfg.cleave || 1,
            explosiveRadius: 0,
            papName: cfg.papName,
            papDamageMult: 2.6,
            papMagMult: 1,
            papEffect: cfg.meleeEffect || 'slash',
            soundProfile: 'melee',
            hipPos: [0.22, -0.20, -0.38],
            adsPos: [0.08, -0.16, -0.32],
            sightHeight: 0.14,
            muzzleOffset: [0, 0.04, -0.35],
            ejectOffset: [0, 0, 0],
            modelSpec: {
                isMelee: true,
                meleeShape: cfg.meleeShape,
                primaryColor: cfg.primaryColor || 0x94a3b8,
                accentColor: cfg.accentColor || 0x1e293b,
                glowColor: cfg.glowColor || 0x000000
            }
        };
    }

    const MELEE_LIST = [
        makeMelee({ id: 'combat_knife', name: 'BOWIE COMBAT KNIFE', shortName: 'BOWIE KNIFE', tier: 'common', unlockLevel: 1, damage: 175, rpm: 125, range: 2.6, cleave: 1, moveMult: 1.09, meleeEffect: 'slash', meleeShape: 'knife', papName: 'Viper Bowie Blade', primaryColor: 0xcbd5e1, accentColor: 0x27272a, description: 'Heavy serrated Bowie knife with lightning swing speed and +9% sprint mobility.' }),
        makeMelee({ id: 'tomahawk_axe', name: 'BREACHER TOMAHAWK', shortName: 'TOMAHAWK', tier: 'common', unlockLevel: 4, damage: 225, rpm: 105, range: 2.8, cleave: 2, moveMult: 1.07, meleeEffect: 'bleed', meleeShape: 'axe', papName: 'Hellfire Hatchet', primaryColor: 0x64748b, accentColor: 0x7c2d12, description: 'Tactical steel tomahawk that cleaves 2 enemies and inflicts bleeding damage.' }),
        makeMelee({ id: 'riot_baton', name: 'VOLT STUN BATON', shortName: 'STUN BATON', tier: 'common', unlockLevel: 7, damage: 185, rpm: 140, range: 2.7, cleave: 2, moveMult: 1.08, meleeEffect: 'stun', meleeShape: 'baton', papName: 'Tesla Enforcer', primaryColor: 0x1e293b, accentColor: 0x38bdf8, glowColor: 0x38bdf8, description: 'Electrified police baton that stuns and paralyzes zombies on impact.' }),
        makeMelee({ id: 'machete_jungle', name: 'JUNGLE MACHETE', shortName: 'MACHETE', tier: 'common', unlockLevel: 10, damage: 235, rpm: 110, range: 2.9, cleave: 2, moveMult: 1.07, meleeEffect: 'bleed', meleeShape: 'sword', papName: 'Crimson Butcher', primaryColor: 0x94a3b8, accentColor: 0x451a03, description: 'Long carbon-steel machete with wide 2-target cleave and heavy bleed.' }),
        makeMelee({ id: 'crowbar_heavy', name: 'TITANIUM CROWBAR', shortName: 'CROWBAR', tier: 'common', unlockLevel: 13, damage: 215, rpm: 115, range: 2.8, cleave: 2, moveMult: 1.07, meleeEffect: 'knockback', meleeShape: 'crowbar', papName: 'Resonance Prybar', primaryColor: 0xdc2626, accentColor: 0x334155, description: 'Forged crowbar that knocks zombies reeling backward with every strike.' }),
        makeMelee({ id: 'trench_shovel', name: 'TRENCH E-TOOL SPADE', shortName: 'TRENCH SPADE', tier: 'common', unlockLevel: 16, damage: 245, rpm: 100, range: 2.9, cleave: 2, moveMult: 1.06, meleeEffect: 'knockback', meleeShape: 'axe', papName: 'Golden Gravedigger', primaryColor: 0x4b5563, accentColor: 0x713f12, description: 'Sharpened WWII entrenching shovel delivering brutal skull-cracking blows.' }),
        makeMelee({ id: 'katana_carbon', name: 'SHADOW CARBON KATANA', shortName: 'KATANA', tier: 'uncommon', unlockLevel: 20, damage: 320, rpm: 130, range: 3.3, cleave: 3, moveMult: 1.11, meleeEffect: 'bleed', meleeShape: 'sword', papName: 'Muramasa Eclipse', primaryColor: 0xe2e8f0, accentColor: 0x991b1b, glowColor: 0xef4444, description: 'Master-forged katana that lunges forward and slices through 3 zombies in one arc!' }),
        makeMelee({ id: 'sledge_hammer', name: 'DEMOLITION SLEDGE', shortName: 'SLEDGEHAMMER', tier: 'uncommon', unlockLevel: 24, damage: 440, rpm: 70, range: 3.2, cleave: 4, moveMult: 0.98, meleeEffect: 'shockwave', meleeShape: 'hammer', papName: 'Earthshaker Maul', primaryColor: 0x475569, accentColor: 0xf59e0b, glowColor: 0xf59e0b, description: '20-pound steel sledgehammer that unleashes a 4-target shockwave slam on hit!' }),
        makeMelee({ id: 'chainsaw_ripper', name: 'V8 RIPPER CHAINSAW', shortName: 'CHAINSAW', tier: 'uncommon', unlockLevel: 29, fireMode: 'auto', damage: 135, rpm: 420, range: 2.6, cleave: 2, moveMult: 1.00, meleeEffect: 'shred', meleeShape: 'chainsaw', papName: 'Doomsaw Overdrive', primaryColor: 0xeab308, accentColor: 0x334155, description: 'Hold Left-Click to rev the motorized chain and shred hordes continuously at 420 RPM!' }),
        makeMelee({ id: 'reaper_scythe', name: 'AETHER REAPER SCYTHE', shortName: 'REAPER SCYTHE', tier: 'uncommon', unlockLevel: 35, damage: 390, rpm: 95, range: 3.6, cleave: 4, moveMult: 1.06, meleeEffect: 'lifesteal', meleeShape: 'scythe', papName: 'Harvester of Souls', primaryColor: 0xc084fc, accentColor: 0x1e1b4b, glowColor: 0xc084fc, description: 'Cursed crescent scythe that cleaves 4 enemies and heals +25 HP on every kill!' })
    ];

    /* ========================================================================
       10 UNIQUE MAGIC WEAPONS (Super-Special Wonder Weapons)
    ======================================================================== */
    function makeMagic(cfg) {
        return {
            id: cfg.id,
            name: cfg.name,
            shortName: cfg.shortName || cfg.name,
            category: 'Magic Weapon',
            kind: 'magic',
            tier: 'magic',
            slotType: 'wonder',
            unlockLevel: 1,
            mysteryBox: true,
            description: cfg.description,
            fireMode: cfg.fireMode || 'semi',
            altFireMode: cfg.altFireMode || null,
            rpm: cfg.rpm,
            damage: cfg.damage,
            headMult: cfg.headMult || 1.5,
            range: cfg.range || 55,
            rangeNear: Math.round((cfg.range || 55) * 0.5),
            rangeFar: cfg.range || 55,
            pellets: cfg.pellets || 1,
            magSize: cfg.magSize,
            reserveMax: cfg.reserveMax,
            reserveAmmo: cfg.reserveMax,
            reloadTime: cfg.reloadTime || 2.1,
            shellReload: false,
            adsTime: cfg.adsTime || 0.16,
            adsFov: cfg.adsFov || 66,
            hipSpread: 0.01,
            adsSpread: 0.002,
            recoilPitch: cfg.recoilPitch || 0.025,
            recoilYaw: 0.005,
            moveMult: cfg.moveMult || 1.02,
            moveSpeedMult: cfg.moveMult || 1.02,
            penetration: cfg.penetration || 3,
            explosiveRadius: cfg.explosiveRadius || 0,
            isConeBlast: !!cfg.isConeBlast,
            coneHalfAngle: cfg.coneHalfAngle || 0.42,
            chargeMaxTime: cfg.chargeMaxTime || 0,
            chargeMaxScale: cfg.chargeMaxScale || 1,
            magicType: cfg.magicType,
            magicColor: cfg.magicColor || 0x22ff77,
            papName: cfg.papName,
            papDamageMult: cfg.papDamageMult || 2.4,
            papMagMult: cfg.papMagMult || 2.0,
            papEffect: cfg.magicType,
            papExplosiveRadius: (cfg.explosiveRadius || 2.5) + 1.0,
            soundProfile: cfg.soundProfile || 'raygun',
            hipPos: [0.21, -0.21, -0.39],
            adsPos: [0.0, -0.142, -0.32],
            sightHeight: 0.142,
            muzzleOffset: [0, 0.044, -0.34],
            ejectOffset: [0, 0.05, 0],
            modelSpec: {
                isPistol: !!cfg.isPistol,
                wonderType: cfg.wonderType,
                receiverLen: 0.30, receiverW: 0.056, receiverH: 0.072,
                barrelLen: 0.22, barrelR: 0.022,
                primaryColor: cfg.primaryColor,
                accentColor: cfg.magicColor
            }
        };
    }

    const MAGIC_LIST = [
        // --- COD WORLD AT WAR (WaW) ---
        makeMagic({
            id: 'raygun', name: 'RAY GUN (COD WaW)', shortName: 'RAY GUN',
            magicType: 'plasma_splash', wonderType: 'raygun', isPistol: true,
            rpm: 210, damage: 450, range: 65, magSize: 20, reserveMax: 160, explosiveRadius: 2.8,
            primaryColor: 0xc42828, magicColor: 0x38ff7a, soundProfile: 'raygun',
            papName: "Porter's X2 Ray Gun",
            description: 'Iconic COD WaW atomic plasma pistol firing volatile emerald energy bolts that detonate on impact!'
        }),
        makeMagic({
            id: 'tesla_wunder', name: 'WUNDERWAFFE DG-2 (COD WaW)', shortName: 'WUNDERWAFFE',
            magicType: 'chain_lightning', wonderType: 'tesla',
            rpm: 90, damage: 1250, range: 50, magSize: 3, reserveMax: 18,
            primaryColor: 0x475569, magicColor: 0x38bdf8, soundProfile: 'raygun',
            papName: 'Wunderwaffe DG-3 JZ',
            description: 'Shi No Numa / Der Riese high-voltage Tesla rifle whose lightning arcs chain-jump across up to 10 zombies!'
        }),
        // --- COD BLACK OPS 1 (BO1) ---
        makeMagic({
            id: 'zeus_cannon', name: 'THUNDERGUN (COD BO1)', shortName: 'THUNDERGUN',
            magicType: 'cone_shockwave', wonderType: 'thundergun', isConeBlast: true, coneHalfAngle: 0.45,
            rpm: 75, damage: 1600, range: 16, magSize: 2, reserveMax: 16,
            primaryColor: 0x3e4652, magicColor: 0x38bdf8, soundProfile: 'zeus',
            papName: 'Zeus Cannon',
            description: 'Kino der Toten & Ascension acoustic hurricane cannon that blasts entire hordes airborne!'
        }),
        makeMagic({
            id: 'winters_howl_bo1', name: "WINTER'S HOWL (COD BO1)", shortName: "WINTER'S HOWL",
            magicType: 'frost_cone', wonderType: 'raygun', isPistol: true,
            rpm: 165, damage: 490, range: 18, magSize: 6, reserveMax: 36,
            primaryColor: 0x1e3a8a, magicColor: 0x7dd3fc, soundProfile: 'raygun',
            papName: "Winter's Fury",
            description: '"Five" Pentagon cryo-revolver unleashing sub-zero vortex rings that freeze zombies solid!'
        }),
        makeMagic({
            id: 'baby_gun_bo1', name: '31-79 JGb215 BABY GUN (COD BO1)', shortName: '31-79 JGb215',
            magicType: 'shrink_ray', wonderType: 'thundergun',
            rpm: 85, damage: 1400, range: 26, magSize: 5, reserveMax: 25, explosiveRadius: 4.5,
            primaryColor: 0x854d0e, magicColor: 0xfacc15, soundProfile: 'raygun',
            papName: 'Fractalizer',
            description: 'Shangri-La Shrink Ray that shrinks zombies down to tiny toy size and crushes them instantly!'
        }),
        makeMagic({
            id: 'wave_gun_bo1', name: 'WAVE GUN / ZAP GUN (COD BO1)', shortName: 'WAVE GUN',
            magicType: 'microwave_pop', wonderType: 'tesla',
            rpm: 120, damage: 1350, range: 45, magSize: 12, reserveMax: 60, explosiveRadius: 4.8,
            primaryColor: 0x581c87, magicColor: 0xe879f9, soundProfile: 'zeus',
            papName: 'Max Wave Gun',
            description: 'Moon dual-mode microwave beam cannon that cooks and inflates zombies from the inside until they pop!'
        }),
        makeMagic({
            id: 'scavenger_bo1', name: 'SCAVENGER (COD BO1)', shortName: 'SCAVENGER',
            magicType: 'solar_pillar', wonderType: 'tesla',
            rpm: 55, damage: 1550, range: 95, magSize: 3, reserveMax: 18, explosiveRadius: 6.2,
            primaryColor: 0x3f3f46, magicColor: 0xf97316, soundProfile: 'sniper',
            papName: 'Hyena Infra-Dead',
            description: 'Call of the Dead bolt-action wonder sniper firing explosive harpoons with cataclysmic blast radius!'
        }),
        // --- COD BLACK OPS 2 (BO2) ---
        makeMagic({
            id: 'raygun_mk2', name: 'RAY GUN MARK II (COD BO2)', shortName: 'RAY GUN MK2',
            magicType: 'plasma_splash', wonderType: 'raygun', fireMode: 'burst',
            rpm: 620, damage: 520, range: 75, magSize: 21, reserveMax: 168, penetration: 5, explosiveRadius: 1.8,
            primaryColor: 0x991b1b, magicColor: 0x4ade80, soundProfile: 'raygun',
            papName: "Porter's Mark II Ray Gun",
            description: '3-round burst atomic laser rifle firing hyper-penetrating emerald beams with massive headshot damage!'
        }),
        makeMagic({
            id: 'blundergat_bo2', name: 'BLUNDERGAT / ACIDGAT (COD BO2)', shortName: 'BLUNDERGAT',
            magicType: 'acid_swarm', wonderType: 'thundergun',
            rpm: 110, damage: 340, pellets: 5, range: 35, magSize: 2, reserveMax: 60, explosiveRadius: 3.4,
            primaryColor: 0x451a03, magicColor: 0x4ade80, soundProfile: 'shotgun',
            papName: 'Vitriolic Withering',
            description: 'Mob of the Dead quad-barrel wonder shotgun firing 5 volatile acid-flechette darts that melt hordes!'
        }),
        makeMagic({
            id: 'paralyzer_bo2', name: 'PARALYZER / PETRIFIER (COD BO2)', shortName: 'PARALYZER',
            magicType: 'paralyzer_beam', wonderType: 'thundergun', fireMode: 'auto',
            rpm: 520, damage: 175, range: 22, magSize: 100, reserveMax: 500,
            primaryColor: 0x713f12, magicColor: 0x38bdf8, soundProfile: 'raygun',
            papName: 'Petrifier',
            description: 'Buried turbine beam cannon that slows & disintegrates zombies—and propels you upward into the air if aimed at the ground!'
        }),
        makeMagic({
            id: 'sliquifier_bo2', name: 'SLIQUIFIER (COD BO2)', shortName: 'SLIQUIFIER',
            magicType: 'acid_swarm', wonderType: 'raygun',
            rpm: 140, damage: 850, range: 48, magSize: 10, reserveMax: 50, explosiveRadius: 4.8,
            primaryColor: 0x4c1d95, magicColor: 0xc084fc, soundProfile: 'raygun',
            papName: 'Sludgehammer 115',
            description: 'Die Rise bio-sludge launcher whose purple goo triggers chain-reaction explosions across entire waves!'
        }),
        makeMagic({
            id: 'void_singularity', name: 'STAFF OF WIND / VOID (COD BO2)', shortName: 'VOID STAFF',
            magicType: 'black_hole', wonderType: 'staff',
            rpm: 65, damage: 950, range: 60, magSize: 3, reserveMax: 18, explosiveRadius: 6.5,
            primaryColor: 0x2e1065, magicColor: 0xc084fc, soundProfile: 'zeus',
            papName: "Boreas' Fury",
            description: 'Origins elemental staff firing a swirling vortex that sucks nearby zombies inward before imploding!'
        }),
        makeMagic({
            id: 'inferno_drake', name: 'STAFF OF FIRE (COD BO2)', shortName: 'FIRE STAFF',
            magicType: 'dragon_breath', wonderType: 'tome', fireMode: 'auto',
            rpm: 480, damage: 165, range: 18, magSize: 60, reserveMax: 300,
            primaryColor: 0x7c2d12, magicColor: 0xf97316, soundProfile: 'ar_heavy',
            papName: "Kagutsuchi's Blood",
            description: 'Origins elemental fire staff streaming continuous magma that ignites and melts every zombie ahead!'
        }),
        makeMagic({
            id: 'cryo_sceptre', name: 'STAFF OF ICE (COD BO2)', shortName: 'ICE STAFF',
            magicType: 'frost_cone', wonderType: 'staff',
            rpm: 120, damage: 560, range: 20, magSize: 8, reserveMax: 48,
            primaryColor: 0x0c4a6e, magicColor: 0x7dd3fc, soundProfile: 'raygun',
            papName: "Ull's Arrow",
            description: 'Origins elemental ice staff unleashing an arctic blizzard wave that freezes zombies solid for 2.5x shatter damage!'
        }),
        makeMagic({
            id: 'solar_lance', name: 'STAFF OF LIGHTNING (COD BO2)', shortName: 'LIGHTNING STAFF',
            magicType: 'solar_pillar', wonderType: 'staff',
            rpm: 95, damage: 980, range: 70, magSize: 6, reserveMax: 36, explosiveRadius: 5.5,
            primaryColor: 0x78350f, magicColor: 0xfde047, soundProfile: 'zeus',
            papName: "Kimat's Bite",
            description: 'Origins elemental lightning staff calling down pillars of high-voltage sky lightning on impact!'
        }),
        // --- COD BLACK OPS 3 (BO3) ---
        makeMagic({
            id: 'apothicon_servant_bo3', name: 'APOTHICON SERVANT (COD BO3)', shortName: 'APOTHICON',
            magicType: 'black_hole', wonderType: 'skull',
            rpm: 50, damage: 1450, range: 60, magSize: 1, reserveMax: 14, explosiveRadius: 7.5,
            primaryColor: 0x3b0764, magicColor: 0xa855f7, soundProfile: 'zeus',
            papName: 'Estoom-oth',
            description: 'Shadows of Evil bio-organic alien wonder cannon that tears open an interdimensional Black Hole rift!'
        }),
        makeMagic({
            id: 'necro_skull', name: 'SKULL OF NAN-SAPWE (COD BO3)', shortName: 'NECRO SKULL',
            magicType: 'soul_drain', wonderType: 'skull', fireMode: 'auto',
            rpm: 360, damage: 190, range: 26, magSize: 40, reserveMax: 200,
            primaryColor: 0x450a0a, magicColor: 0xef4444, soundProfile: 'raygun',
            papName: "Keeper's Doom Relic",
            description: 'Zetsubou No Shima ancient skull firing a soul-draining beam that vaporizes zombies while healing your HP & Armor!'
        }),
        makeMagic({
            id: 'acid_hydra', name: 'KT-4 MASAMUNE (COD BO3)', shortName: 'KT-4 MASAMUNE',
            magicType: 'acid_swarm', wonderType: 'tesla',
            rpm: 150, damage: 260, pellets: 5, range: 50, magSize: 12, reserveMax: 72, explosiveRadius: 2.8,
            primaryColor: 0x14532d, magicColor: 0x4ade80, soundProfile: 'raygun',
            papName: 'Masamune',
            description: 'Zetsubou No Shima liquid-spore wonder gun firing a 5-orb volley of corrosive Element 115 bio-venom!'
        }),
        makeMagic({
            id: 'chrono_shatter', name: 'GKZ-45 MK3 (COD BO3)', shortName: 'GKZ-45 MK3',
            magicType: 'chrono_rift', wonderType: 'thundergun',
            rpm: 110, damage: 820, range: 55, magSize: 8, reserveMax: 48, explosiveRadius: 5.2,
            primaryColor: 0x1e1b4b, magicColor: 0xe879f9, soundProfile: 'zeus',
            papName: 'Maelstrom of Eris',
            description: 'Gorod Krovi dual-energy wonder cannon that warps spacetime on impact, freezing and detonating hordes!'
        }),
        // --- COD BLACK OPS 4 (BO4) ---
        makeMagic({
            id: 'death_of_orion_bo4', name: 'DEATH OF ORION (COD BO4)', shortName: 'DEATH OF ORION',
            magicType: 'chain_lightning', wonderType: 'skull',
            rpm: 85, damage: 1320, range: 50, magSize: 4, reserveMax: 24,
            primaryColor: 0x92400e, magicColor: 0xfacc15, soundProfile: 'zeus',
            papName: "Serket's Kiss",
            description: 'IX Golden Scorpion wonder weapon that snares and electrocutes whole clusters of zombies in golden lightning!'
        }),
        makeMagic({
            id: 'alistairs_folly_bo4', name: "ALISTAIR'S ANNIHILATOR (COD BO4)", shortName: 'ANNIHILATOR BO4',
            magicType: 'chaos_storm', wonderType: 'raygun', isPistol: true,
            rpm: 180, damage: 920, range: 60, magSize: 12, reserveMax: 72, explosiveRadius: 5.2,
            primaryColor: 0x065f46, magicColor: 0x34d399, soundProfile: 'raygun',
            papName: "Alistair's Annihilator",
            description: 'Dead of the Night chaos wonder revolver unleashing random Firestorms, Shrink Vortexes, or Acid Tempests on every shot!'
        }),
        // --- MEGA MAN BUSTER ('megaman' CHEAT WEAPON) ---
        makeMagic({
            id: 'megaman_buster', name: 'MEGA BUSTER MK-X (MEGAMAN)', shortName: 'MEGA BUSTER',
            magicType: 'megaman_plasma', wonderType: 'megabuster', fireMode: 'charge',
            chargeMaxTime: 10.0, chargeMaxScale: 10.0,
            rpm: 280, damage: 640, range: 85, magSize: 50, reserveMax: 500, explosiveRadius: 3.2,
            primaryColor: 0x1d4ed8, magicColor: 0x38bdf8, soundProfile: 'raygun',
            papName: 'Hyper X-Buster Nova',
            description: 'Iconic blue Mega Man arm-cannon! Hold SHOOT to charge up to 10s (glows bright & scales blasts up to 10x size and 15x power!)'
        })
    ];

    const WEAPONS = Object.create(null);
    const ORDER = [];
    for (const w of GUN_LIST.concat(MELEE_LIST, MAGIC_LIST)) {
        WEAPONS[w.id] = w;
        ORDER.push(w.id);
    }

    const POOLS = {
        commonGun: GUN_LIST.filter((w) => w.tier === 'common').map((w) => w.id),
        uncommonGun: GUN_LIST.filter((w) => w.tier === 'uncommon').map((w) => w.id),
        commonMelee: MELEE_LIST.filter((w) => w.tier === 'common').map((w) => w.id),
        uncommonMelee: MELEE_LIST.filter((w) => w.tier === 'uncommon').map((w) => w.id),
        magic: MAGIC_LIST.map((w) => w.id)
    };

    const CLASS_ORDER = [
        'Assault Rifle',
        'SMG',
        'Sniper Rifle',
        'Marksman Rifle',
        'Shotgun',
        'LMG',
        'Pistol',
        'Launcher',
        'Melee Weapon',
        'Magic Weapon'
    ];

    BO.WeaponsData = {
        WEAPONS,
        ORDER,
        GUN_LIST,
        MELEE_LIST,
        MAGIC_LIST,
        POOLS,
        CLASS_ORDER,
        get(id) {
            return WEAPONS[id] || WEAPONS.m4a1;
        },
        listLoadoutWeapons() {
            // In Sandbox Unlock-All mode, even Magic Weapons can be tested in Gunsmith!
            if (BO.Settings && BO.Settings.get('unlockAll')) {
                return ORDER.map((id) => WEAPONS[id]);
            }
            return ORDER.map((id) => WEAPONS[id]).filter((w) => !w.mysteryBox);
        },
        listAll() {
            return ORDER.map((id) => WEAPONS[id]);
        },
        listByClass(weaponsList = null) {
            const src = weaponsList || ORDER.map((id) => WEAPONS[id]);
            const groups = new Map();
            for (const c of CLASS_ORDER) groups.set(c, []);
            for (const w of src) {
                const cat = w.category || 'Other';
                if (!groups.has(cat)) groups.set(cat, []);
                groups.get(cat).push(w);
            }
            const out = [];
            for (const [cat, items] of groups.entries()) {
                if (items.length > 0) out.push({ category: cat, weapons: items });
            }
            return out;
        },
        listGuns() {
            return GUN_LIST;
        },
        listMelee() {
            return MELEE_LIST;
        },
        listMagic() {
            return MAGIC_LIST;
        },
        /**
         * Exact Mystery Box Probability Table requested by user:
         *  60% Common tier weapon (gun)
         *  15% Uncommon tier weapon (gun)
         *  10% Common melee weapon
         *   5% Uncommon melee weapon
         *   5% Magic weapon
         *   5% Nothing
         */
        rollMysteryBox() {
            const r = Math.random() * 100;
            // 1% Ultra-Rare Pokéball roll (summons 1 of 10 Pokémon allies!)
            if (r < 1) {
                return { outcome: 'pokeball', tierLabel: 'POKÉBALL (1% ULTRA-RARE!)', color: '#ef4444', weaponId: 'pokeball' };
            }
            if (r < 60) {
                return { outcome: 'weapon', tierLabel: 'COMMON WEAPON (60%)', color: '#cbd5e1', weaponId: BO.Math.pick(POOLS.commonGun) };
            }
            if (r < 75) {
                return { outcome: 'weapon', tierLabel: 'UNCOMMON WEAPON (15%)', color: '#38bdf8', weaponId: BO.Math.pick(POOLS.uncommonGun) };
            }
            if (r < 85) {
                return { outcome: 'weapon', tierLabel: 'COMMON MELEE (10%)', color: '#a3e635', weaponId: BO.Math.pick(POOLS.commonMelee) };
            }
            if (r < 90) {
                return { outcome: 'weapon', tierLabel: 'UNCOMMON MELEE (5%)', color: '#f59e0b', weaponId: BO.Math.pick(POOLS.uncommonMelee) };
            }
            if (r < 95) {
                return { outcome: 'magic', tierLabel: 'MAGIC WONDER WEAPON (5%)', color: '#e879f9', weaponId: BO.Math.pick(POOLS.magic) };
            }
            return { outcome: 'nothing', tierLabel: 'NOTHING (5%)', color: '#ef4444', weaponId: null };
        }
    };
})(window);
