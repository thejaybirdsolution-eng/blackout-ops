/* ============================================================================
   BLACKOUT OPS — Ranks (1–55), Prestige (1–10), Medals & Challenges
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const RANK_NAMES = [
        'Private I', 'Private II', 'Private First Class I', 'Private First Class II', 'Specialist',
        'Corporal I', 'Corporal II', 'Sergeant I', 'Sergeant II', 'Staff Sergeant I',
        'Staff Sergeant II', 'Sergeant First Class I', 'Sergeant First Class II', 'Master Sergeant I', 'Master Sergeant II',
        'First Sergeant I', 'First Sergeant II', 'Sergeant Major I', 'Sergeant Major II', 'Command Sergeant Major',
        'Second Lieutenant I', 'Second Lieutenant II', 'First Lieutenant I', 'First Lieutenant II', 'Captain I',
        'Captain II', 'Captain III', 'Major I', 'Major II', 'Major III',
        'Lieutenant Colonel I', 'Lieutenant Colonel II', 'Lieutenant Colonel III', 'Colonel I', 'Colonel II',
        'Colonel III', 'Brigadier General I', 'Brigadier General II', 'Brigadier General III', 'Major General I',
        'Major General II', 'Major General III', 'Lieutenant General I', 'Lieutenant General II', 'Lieutenant General III',
        'General I', 'General II', 'General III', 'General IV', 'Field Marshal I',
        'Field Marshal II', 'Shadow Operative', 'Blackout Elite', 'Apex Vanguard', 'Commander of the Blackout'
    ];

    const PRESTIGE_TIERS = [
        { level: 0, title: 'Enlisted', color: '#94a3b8', icon: '★' },
        { level: 1, title: 'Prestige I — Iron Cross', color: '#cbd5e1', icon: '✦' },
        { level: 2, title: 'Prestige II — Crimson Wing', color: '#ef4444', icon: '❖' },
        { level: 3, title: 'Prestige III — Cobalt Talon', color: '#38bdf8', icon: '⚔' },
        { level: 4, title: 'Prestige IV — Gold Trident', color: '#f59e0b', icon: '🔱' },
        { level: 5, title: 'Prestige V — Emerald Skull', color: '#22c55e', icon: '☠' },
        { level: 6, title: 'Prestige VI — Obsidian Star', color: '#a855f7', icon: '✴' },
        { level: 7, title: 'Prestige VII — Solar Phoenix', color: '#fb923c', icon: '🦅' },
        { level: 8, title: 'Prestige VIII — Diamond Shield', color: '#67e8f9', icon: '🛡' },
        { level: 9, title: 'Prestige IX — Reaper Crown', color: '#f43f5e', icon: '👑' },
        { level: 10, title: 'Prestige Master — Blackout Apex', color: '#fde047', icon: '⚡' }
    ];

    const MEDALS = {
        headshot: { id: 'headshot', name: 'Headshot', xp: 50, color: '#ef4444', icon: '⌖' },
        one_shot: { id: 'one_shot', name: 'One Shot, One Kill', xp: 75, color: '#f59e0b', icon: '◎' },
        point_blank: { id: 'point_blank', name: 'Point Blank', xp: 50, color: '#38bdf8', icon: '◈' },
        longshot: { id: 'longshot', name: 'Longshot', xp: 100, color: '#60a5fa', icon: '⌖' },
        slide_kill: { id: 'slide_kill', name: 'Low Blow', xp: 80, color: '#22d3ee', icon: '➹' },
        double_kill: { id: 'double_kill', name: 'Double Kill', xp: 100, color: '#f59e0b', icon: '★★' },
        triple_kill: { id: 'triple_kill', name: 'Triple Kill', xp: 175, color: '#f97316', icon: '★★★' },
        fury_kill: { id: 'fury_kill', name: 'Fury Kill', xp: 250, color: '#ef4444', icon: '🔥' },
        frenzy_kill: { id: 'frenzy_kill', name: 'Frenzy Kill', xp: 350, color: '#a855f7', icon: '⚡' },
        bloodthirsty: { id: 'bloodthirsty', name: 'Bloodthirsty', xp: 200, color: '#dc2626', icon: '☠' },
        merciless: { id: 'merciless', name: 'Merciless (10)', xp: 400, color: '#ec4899', icon: '☠☠' },
        ruthless: { id: 'ruthless', name: 'Ruthless (15)', xp: 750, color: '#eab308', icon: '👑' },
        collateral: { id: 'collateral', name: 'Collateral', xp: 250, color: '#38bdf8', icon: '⇶' },
        round_clear: { id: 'round_clear', name: 'Wave Survived', xp: 120, color: '#22c55e', icon: '☽' },
        pap_upgrade: { id: 'pap_upgrade', name: 'Pack-a-Punched', xp: 250, color: '#c084fc', icon: '✦' },
        exfil_success: { id: 'exfil_success', name: 'Exfil Successful', xp: 750, color: '#10b981', icon: '🚁' }
    };

    const CHALLENGES = [
        { id: 'z_kills_50', name: 'Undead Hunter I', desc: 'Eliminate 50 Zombies.', stat: 'zombiesKills', target: 50, rewardXp: 500 },
        { id: 'z_kills_250', name: 'Undead Hunter II', desc: 'Eliminate 250 Zombies.', stat: 'zombiesKills', target: 250, rewardXp: 1500 },
        { id: 'z_kills_1000', name: 'Grim Reaper', desc: 'Eliminate 1,000 Zombies.', stat: 'zombiesKills', target: 1000, rewardXp: 4000 },
        { id: 'z_hs_50', name: 'Brain Surgeon', desc: 'Score 50 Zombie Headshots.', stat: 'zombiesHeadshots', target: 50, rewardXp: 1000 },
        { id: 'z_round_10', name: 'Outlast the Night', desc: 'Reach Round 10 on any Zombies map.', stat: 'bestRoundAny', target: 10, rewardXp: 1500 },
        { id: 'z_round_20', name: 'Round XX Legend', desc: 'Reach Round 20 on any Zombies map.', stat: 'bestRoundAny', target: 20, rewardXp: 4000 },
        { id: 'z_pap_1', name: 'Forged in Fire', desc: 'Pack-a-Punch a weapon in Zombies.', stat: 'zombiesPaPUsed', target: 1, rewardXp: 750 },
        { id: 'z_box_10', name: 'Mystery Gambler', desc: 'Spin the Mystery Box 10 times.', stat: 'zombiesBoxSpins', target: 10, rewardXp: 800 },
        { id: 'z_perks_10', name: 'Cola Connoisseur', desc: 'Purchase 10 Perk-a-Colas.', stat: 'zombiesPerksBought', target: 10, rewardXp: 800 },
        { id: 'z_exfil_1', name: 'Clean Extraction', desc: 'Complete a Zombies Exfil.', stat: 'zombiesExfils', target: 1, rewardXp: 2500 },
        { id: 'mp_kills_25', name: 'Boot Camp Marksman', desc: 'Eliminate 25 Multiplayer bots.', stat: 'mpKills', target: 25, rewardXp: 600 },
        { id: 'mp_kills_150', name: 'Frontline Veteran', desc: 'Eliminate 150 Multiplayer bots.', stat: 'mpKills', target: 150, rewardXp: 2000 },
        { id: 'mp_hs_25', name: 'Precision Marksman', desc: 'Score 25 Multiplayer headshots.', stat: 'mpHeadshots', target: 25, rewardXp: 1200 },
        { id: 'mp_wins_3', name: 'Match Winner', desc: 'Win 3 Multiplayer matches.', stat: 'mpWins', target: 3, rewardXp: 1200 },
        { id: 'mp_wins_10', name: 'Dominator', desc: 'Win 10 Multiplayer matches.', stat: 'mpWins', target: 10, rewardXp: 3500 },
        { id: 'mp_streaks_5', name: 'Air Support', desc: 'Call in 5 Killstreaks.', stat: 'mpKillstreaksCalled', target: 5, rewardXp: 1100 },
        { id: 'medal_double_5', name: 'Double Trouble', desc: 'Earn 5 Double Kill medals.', stat: 'medal_double_kill', target: 5, rewardXp: 900 },
        { id: 'medal_blood_3', name: 'Unstoppable Force', desc: 'Earn 3 Bloodthirsty medals.', stat: 'medal_bloodthirsty', target: 3, rewardXp: 1800 }
    ];

    function xpRequiredForLevel(lvl) {
        if (lvl <= 1) return 0;
        let total = 0;
        for (let l = 1; l < lvl; l++) {
            total += Math.floor(450 + l * 145 + Math.pow(l, 1.55) * 24);
        }
        return total;
    }

    function xpRequiredForWeaponLevel(lvl) {
        if (lvl <= 1) return 0;
        let total = 0;
        for (let l = 1; l < lvl; l++) {
            total += Math.floor(180 + l * 95);
        }
        return total;
    }

    BO.ProgressionData = {
        MAX_LEVEL: 55,
        MAX_PRESTIGE: 10,
        MAX_WEAPON_LEVEL: 20,
        RANK_NAMES,
        PRESTIGE_TIERS,
        MEDALS,
        CHALLENGES,
        xpRequiredForLevel,
        xpRequiredForWeaponLevel,
        getRankName(lvl) {
            return RANK_NAMES[Math.max(0, Math.min(RANK_NAMES.length - 1, (lvl || 1) - 1))];
        },
        getPrestigeInfo(prestige) {
            return PRESTIGE_TIERS[Math.max(0, Math.min(PRESTIGE_TIERS.length - 1, prestige || 0))];
        }
    };
})(window);
