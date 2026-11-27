(function (BO) {
    'use strict';

    // Category baselines and weapon handling are tuned for Blackout Ops.
    const categories = {
        ar: ['Assault Rifle', 45, 1.9], smg: ['SMG', 30, 1.65], lmg: ['LMG', 55, 3.1],
        sniper: ['Sniper Rifle', 115, 2.35], rifle: ['Marksman Rifle', 78, 2.15],
        shotgun: ['Shotgun', 18, 1.9], pistol: ['Pistol', 25, 1.35], launcher: ['Launcher', 72, 2.9]
    };
    // ID, display name, category, fire mode, magazine, cyclic rate, damage.
    const rows = [
        ['g3', 'G3', 'rifle', 'semi', 20, 385, 62],
        ['m14_classic', 'M14', 'rifle', 'semi', 20, 350, 71],
        ['skorpion_vz61', 'Skorpion vz. 61', 'smg', 'auto', 20, 820, 28],
        ['mini_uzi', 'Mini-Uzi', 'smg', 'auto', 32, 900, 25],
        ['w1200', 'W1200', 'shotgun', 'pump', 7, 92, 31],
        ['m21', 'M21', 'sniper', 'semi', 10, 235, 91],
        ['m9', 'M9', 'pistol', 'semi', 15, 465, 36],
        ['usp45', 'USP .45', 'pistol', 'semi', 12, 410, 41],
        ['makarov', 'Makarov', 'pistol', 'semi', 8, 450, 37],
        ['tt33', 'Tokarev TT-33', 'pistol', 'semi', 8, 395, 43],
        ['nambu', 'Type 14 Nambu', 'pistol', 'semi', 8, 435, 31],
        ['walther_p38', 'Walther P38', 'pistol', 'semi', 8, 410, 39],
        ['sw_m27', 'S&W Model 27', 'pistol', 'semi', 6, 230, 74],
        ['m1_garand', 'M1 Garand', 'rifle', 'semi', 8, 330, 77],
        ['svt40', 'SVT-40', 'rifle', 'semi', 10, 400, 65],
        ['gewehr43', 'Gewehr 43', 'rifle', 'semi', 10, 410, 61],
        ['m1_carbine', 'M1 Carbine', 'rifle', 'semi', 15, 475, 49],
        ['springfield', 'Springfield M1903', 'rifle', 'bolt', 5, 58, 119],
        ['arisaka', 'Arisaka Type 99', 'rifle', 'bolt', 5, 63, 111],
        ['mosin_nagant', 'Mosin-Nagant', 'rifle', 'bolt', 5, 53, 128],
        ['ptrs41', 'PTRS-41', 'sniper', 'semi', 5, 105, 169],
        ['mp40', 'MP40', 'smg', 'auto', 32, 525, 39],
        ['ppsh41', 'PPSh-41', 'smg', 'auto', 35, 970, 25],
        ['type100', 'Type 100', 'smg', 'auto', 30, 735, 31],
        ['bar_m1918', 'BAR M1918', 'lmg', 'auto', 20, 535, 51],
        ['dp28', 'DP-28', 'lmg', 'auto', 47, 565, 45],
        ['type99_lmg', 'Type 99 LMG', 'lmg', 'auto', 30, 670, 37],
        ['browning_m1919', 'Browning M1919', 'lmg', 'auto', 75, 515, 48],
        ['fg42', 'FG 42', 'lmg', 'auto', 20, 760, 37],
        ['stg44', 'StG 44', 'ar', 'auto', 30, 615, 39],
        ['trench_gun', 'M1897 Trench Gun', 'shotgun', 'pump', 6, 95, 33],
        ['sawed_off', 'Sawed-Off Double Barrel', 'shotgun', 'semi', 2, 250, 29],
        ['m9_bazooka', 'M9 Bazooka', 'launcher', 'semi', 1, 44, 290],
        ['panzerschreck', 'Panzerschreck', 'launcher', 'semi', 1, 38, 340],
        ['f2000', 'F2000', 'ar', 'auto', 30, 900, 29],
        ['tar21', 'TAR-21', 'ar', 'auto', 30, 785, 37],
        ['famas_mw2', 'FAMAS F1 (Burst)', 'ar', 'burst', 30, 880, 36],
        ['m16a1', 'M16A1', 'ar', 'auto', 20, 745, 34],
        ['mpl', 'Walther MPL', 'smg', 'auto', 32, 815, 29],
        ['pm63', 'PM-63 RAK', 'smg', 'auto', 20, 795, 33],
        ['kiparis', 'Kiparis', 'smg', 'auto', 20, 930, 27],
        ['spectre_m4', 'Spectre M4', 'smg', 'auto', 30, 890, 29],
        ['uzi', 'Uzi', 'smg', 'auto', 32, 665, 34],
        ['mac11', 'MAC-11', 'smg', 'auto', 20, 1100, 23],
        ['mp5_classic', 'MP5', 'smg', 'auto', 30, 780, 32],
        ['mg4', 'MG4', 'lmg', 'auto', 100, 770, 33],
        ['m240', 'M240', 'lmg', 'auto', 100, 650, 43],
        ['l86_lsw', 'L86 LSW', 'lmg', 'auto', 100, 745, 37],
        ['m21_ebr', 'M21 EBR', 'sniper', 'semi', 10, 270, 88],
        ['wa2000', 'WA2000', 'sniper', 'semi', 6, 202, 114],
        ['ranger', 'Ranger', 'shotgun', 'semi', 2, 360, 28],
        ['m93_raffica', 'M93 Raffica', 'pistol', 'burst', 20, 890, 30],
        ['tmp', 'TMP', 'pistol', 'auto', 15, 900, 24],
        ['pp2000', 'PP-2000', 'pistol', 'auto', 20, 765, 31],
        ['magnum44', '.44 Magnum', 'pistol', 'semi', 6, 225, 78],
        ['at4', 'AT4', 'launcher', 'semi', 1, 45, 320],
        ['stinger', 'Stinger', 'launcher', 'semi', 1, 41, 295],
        ['javelin', 'Javelin', 'launcher', 'semi', 1, 35, 390],
        ['thumper', 'M79 Thumper', 'launcher', 'semi', 1, 68, 195],
        ['aug_a1', 'AUG A1', 'ar', 'auto', 30, 760, 35],
        ['enfield', 'Enfield', 'ar', 'auto', 30, 680, 34],
        ['commando', 'Commando', 'ar', 'auto', 30, 755, 38],
        ['g11', 'G11', 'ar', 'burst', 48, 1060, 28],
        ['hk21', 'HK21', 'lmg', 'auto', 30, 635, 42],
        ['rpk', 'RPK', 'lmg', 'auto', 40, 610, 44],
        ['m60', 'M60', 'lmg', 'auto', 100, 535, 49],
        ['stoner63', 'Stoner 63', 'lmg', 'auto', 30, 865, 35],
        ['hs10', 'HS10', 'shotgun', 'semi', 4, 245, 23],
        ['stakeout', 'Stakeout', 'shotgun', 'pump', 4, 81, 35],
        ['psg1', 'PSG1', 'sniper', 'semi', 5, 214, 124],
        ['asp', 'ASP', 'pistol', 'semi', 7, 540, 31],
        ['cz75', 'CZ75', 'pistol', 'semi', 12, 420, 40],
        ['m72_law', 'M72 LAW', 'launcher', 'semi', 1, 42, 285],
        ['strela3', 'Strela-3', 'launcher', 'semi', 1, 50, 275],
        ['china_lake', 'China Lake', 'launcher', 'pump', 2, 75, 210],
        ['crossbow', 'Explosive Crossbow', 'launcher', 'semi', 1, 59, 160],
        ['ballistic_knife', 'Ballistic Knife', 'launcher', 'semi', 1, 84, 120]
    ];
    const rosters = {
        cod4: 'm4a1 ak47 m16a4 g36c_tac g3 m14_classic mp5_classic p90 skorpion_vz61 mini_uzi aks74u stg44 m249 rpd m60e4_pig w1200 m1014_cod4 m40a3_cod4 r700_cod4 m21 dragunov_svd barrett_50cal m9 usp45 m1911 deagle gold_deagle_cod4 rpg7_warhead',
        waw: 'm1911 tt33 nambu walther_p38 sw_m27 m1_garand svt40 gewehr43 m1_carbine springfield arisaka mosin_nagant kar98k_irons ptrs41 mp40 ppsh41 thompson_m1 type100 bar_m1918 dp28 type99_lmg browning_m1919 fg42 stg44 mg42_buzzsaw trench_gun double_barrel sawed_off m9_bazooka panzerschreck raygun tesla_wunder',
        mw2: 'm4a1 ak47 m16a4 scarh acr_68 fal_osw f2000 tar21 famas_mw2 ump45 p90 mp5 mini_uzi vector_kriss mg4 rpd l86_lsw m240 steyr_aug_lmg intervention barrett_50cal m21_ebr wa2000 mk14 aa12 spas12_tac m1014_cod4 model_1887_mw2 striker_12 ranger usp45 m9 deagle magnum44 glock18_auto m93_raffica tmp pp2000 rpg7_warhead at4 stinger javelin thumper',
        bo1: 'm16a4 m16a1 famas_f1 galil_ar aug_a1 ak47 enfield commando g11 m14_classic fal_osw mp5 aks74u uzi skorpion_vz61 mac11 mpl pm63 kiparis spectre_m4 hk21 rpk m60 stoner63 double_barrel spas12_tac hs10 stakeout dragunov_svd wa2000 l96a1_awm psg1 asp m1911 makarov python_magnum cz75 rpg7_warhead m72_law strela3 china_lake crossbow ballistic_knife raygun tesla_wunder zeus_cannon baby_gun_bo1 wave_gun_bo1 scavenger_bo1'
    };

    const titles = { cod4: 'CoD 4', waw: 'World at War', mw2: 'Modern Warfare 2 (2009)', bo1: 'Black Ops' };
    const gamesByWeapon = Object.create(null);
    for (const [game, ids] of Object.entries(rosters)) {
        for (const id of ids.split(' ')) (gamesByWeapon[id] ||= []).push(game);
    }

    function build(makeGun) {
        return rows.map(([id, name, type, fireMode, magSize, rpm, damage], i) => {
            const [category, range, reloadTime] = categories[type];
            const longGun = type === 'rifle' || type === 'sniper';
            const explosive = type === 'launcher' && id !== 'ballistic_knife';
            return makeGun({
                id, name, shortName: name, category, fireMode, magSize, rpm, damage,
                range, reloadTime: fireMode === 'pump' && type === 'shotgun' ? 0.46 : reloadTime, unlockLevel: 1 + i % 18,
                headMult: longGun ? 2.25 : 1.6, isSniperScope: type === 'sniper',
                penetration: longGun ? 2 : 1, pellets: type === 'shotgun' ? 8 : 1,
                shellReload: fireMode === 'pump', tubeMag: fireMode === 'pump',
                hipSpread: type === 'shotgun' ? 0.075 : 0.032,
                recoilPitch: longGun ? 0.05 : type === 'lmg' ? 0.03 : 0.023,
                moveMult: type === 'lmg' ? 0.86 : type === 'smg' ? 1.04 : 0.96,
                reserveMax: type === 'launcher' ? magSize * 8 : magSize * 6,
                explosiveRadius: explosive ? (id === 'crossbow' ? 2.6 : 4.4) : 0,
                wood: ['rifle', 'shotgun', 'lmg'].includes(type) && gamesByWeapon[id]?.includes('waw'),
                description: `${name} • ${category} • ${fireMode.toUpperCase()} • Classic arsenal`
            });
        });
    }

    BO.ClassicWeapons = { build, gamesByWeapon, titles };
})(window.BO);
