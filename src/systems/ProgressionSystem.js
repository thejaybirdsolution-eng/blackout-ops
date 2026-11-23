/* ============================================================================
   BLACKOUT OPS — Player XP, Military Ranks (1–55), Prestige (1–10),
   Weapon Leveling (1–20), Camos, Medals & Challenges
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class ProgressionSystem {
        constructor() {
            this.sessionStartStats = null;
        }

        getRankInfo() {
            const p = BO.Save.data.player;
            const lvl = p.level;
            const curXp = p.xp;
            const baseXp = BO.ProgressionData.xpRequiredForLevel(lvl);
            const nextXp = lvl >= BO.ProgressionData.MAX_LEVEL
                ? baseXp + 1
                : BO.ProgressionData.xpRequiredForLevel(lvl + 1);
            return {
                level: lvl,
                prestige: p.prestige,
                xp: curXp,
                levelProgress: lvl >= BO.ProgressionData.MAX_LEVEL ? 1 : BO.Math.clamp((curXp - baseXp) / Math.max(1, nextXp - baseXp), 0, 1),
                xpIntoLevel: Math.max(0, curXp - baseXp),
                xpNeededForNext: Math.max(0, nextXp - curXp),
                rankName: BO.ProgressionData.getRankName(lvl),
                prestigeInfo: BO.ProgressionData.getPrestigeInfo(p.prestige)
            };
        }

        isItemUnlocked(unlockLevel, itemId) {
            if (BO.Settings.get('unlockAll')) return true;
            const p = BO.Save.data.player;
            if (p.prestige > 0 && p.permanentUnlocks.includes(itemId)) return true;
            return p.level >= (unlockLevel || 1);
        }

        isAttachmentUnlocked(weaponId, unlockWeaponLevel) {
            if (BO.Settings.get('unlockAll')) return true;
            const rec = BO.Save.getWeaponRecord(weaponId);
            return rec.level >= (unlockWeaponLevel || 1);
        }

        isCamoUnlocked(weaponId, camoId) {
            if (BO.Settings.get('unlockAll')) return true;
            const camo = BO.AttachmentsData.getCamo(camoId);
            if (!camo || (camo.killsRequired === 0 && !camo.headshotsRequired)) return true;
            const rec = BO.Save.getWeaponRecord(weaponId);
            if (rec.unlockedCamos.includes(camoId)) return true;
            if (camo.headshotsRequired) {
                return (rec.headshots || 0) >= camo.headshotsRequired;
            }
            return rec.kills >= camo.killsRequired;
        }

        grantPlayerXP(amount, reason = '') {
            if (!amount || amount <= 0) return;
            const p = BO.Save.data.player;
            const prestigeBonus = 1 + p.prestige * 0.10;
            const gained = Math.round(amount * prestigeBonus);
            p.xp += gained;

            let leveledUp = false;
            while (p.level < BO.ProgressionData.MAX_LEVEL &&
                   p.xp >= BO.ProgressionData.xpRequiredForLevel(p.level + 1)) {
                p.level++;
                leveledUp = true;
                BO.Sound.playRankUp();
                BO.Events.emit('progression:rankup', {
                    level: p.level,
                    rankName: BO.ProgressionData.getRankName(p.level)
                });
            }
            if (leveledUp || reason) {
                BO.Save.save();
            }
            return gained;
        }

        grantWeaponKill(weaponId, isHeadshot = false, xpGain = 100) {
            if (!weaponId) return;
            const rec = BO.Save.getWeaponRecord(weaponId);
            rec.kills++;
            if (isHeadshot) rec.headshots++;
            rec.xp += xpGain;

            BO.Save.data.stats.weaponKills[weaponId] = (BO.Save.data.stats.weaponKills[weaponId] || 0) + 1;

            // Weapon level up
            while (rec.level < BO.ProgressionData.MAX_WEAPON_LEVEL &&
                   rec.xp >= BO.ProgressionData.xpRequiredForWeaponLevel(rec.level + 1)) {
                rec.level++;
                BO.Events.emit('progression:weapon_levelup', {
                    weaponId,
                    weaponName: BO.WeaponsData.get(weaponId).shortName,
                    level: rec.level
                });
            }

            // Camo unlock checks
            for (const c of BO.AttachmentsData.CAMOS) {
                if (rec.unlockedCamos.includes(c.id)) continue;
                const meetsReq = c.headshotsRequired
                    ? (rec.headshots >= c.headshotsRequired)
                    : (c.killsRequired > 0 && rec.kills >= c.killsRequired);
                if (meetsReq) {
                    rec.unlockedCamos.push(c.id);
                    BO.Events.emit('progression:camo_unlock', {
                        weaponId,
                        weaponName: BO.WeaponsData.get(weaponId).shortName,
                        camoName: c.name
                    });
                }
            }
        }

        checkSingleGameHeadshotUnlock(matchHeadshots) {
            if (!BO.Save.data.unlockables) BO.Save.data.unlockables = {};
            if (matchHeadshots >= 1000 && !BO.Save.data.unlockables.topHatUnlocked) {
                BO.Save.data.unlockables.topHatUnlocked = true;
                BO.Save.data.unlockables.topHatEquipped = true;
                BO.Save.save();
                BO.Sound.playRankUp();
                BO.Events.emit('hud:banner', {
                    title: 'TOP HAT UNLOCKED!',
                    sub: '1,000 HEADSHOTS IN ONE GAME — GENTLEMAN TOP HAT EQUIPPED (+15% HS PTS)',
                    color: '#fde047'
                });
            }
        }

        checkRound50DifficultyUnlocks(completedRound, difficulty = 'normal') {
            if (!BO.Save.data.unlockables) BO.Save.data.unlockables = {};
            const u = BO.Save.data.unlockables;
            if (completedRound >= 50) {
                let newlyUnlocked = [];
                if (!u.hardModeUnlocked) { u.hardModeUnlocked = true; newlyUnlocked.push('HARD MODE'); }
                if (!u.bossRushUnlocked) { u.bossRushUnlocked = true; newlyUnlocked.push('BOSS RUSH MODE'); }
                if (difficulty === 'hard' && !u.veryHardModeUnlocked) {
                    u.veryHardModeUnlocked = true;
                    newlyUnlocked.push('VERY HARD MODE');
                }
                if (difficulty === 'very_hard' && !u.insanelyHardModeUnlocked) {
                    u.insanelyHardModeUnlocked = true;
                    newlyUnlocked.push('INSANELY HARD MODE');
                }
                if (newlyUnlocked.length > 0) {
                    BO.Save.save();
                    BO.Sound.playRankUp();
                    BO.Events.emit('hud:banner', {
                        title: 'ROUND 50 PASSED — MODES UNLOCKED!',
                        sub: newlyUnlocked.join(' • '),
                        color: '#fde047'
                    });
                }
            }
        }

        captureSnapshot() {
            return {
                unlockAll: !!BO.Settings.get('unlockAll'),
                unlockables: BO.Math.deepClone(BO.Save.data.unlockables || {}),
                player: BO.Math.deepClone(BO.Save.data.player || {}),
                weapons: BO.Math.deepClone(BO.Save.data.weapons || {})
            };
        }

        restoreSnapshot(snap) {
            if (!snap || typeof snap !== 'object') return;
            if (snap.unlockAll !== undefined) BO.Save.data.settings.unlockAll = !!snap.unlockAll;
            if (snap.unlockables) BO.Save.data.unlockables = BO.Math.deepClone(snap.unlockables);
            if (snap.player) BO.Save.data.player = BO.Math.deepClone(snap.player);
            if (snap.weapons) BO.Save.data.weapons = BO.Math.deepClone(snap.weapons);
            BO.Save.save();
            BO.Events.emit('settings:changed', { key: 'unlockAll', value: BO.Save.data.settings.unlockAll, settings: BO.Save.data.settings });
        }

        unlockEverything() {
            BO.Settings.set('unlockAll', true);
            if (!BO.Save.data.unlockables) BO.Save.data.unlockables = {};
            const u = BO.Save.data.unlockables;
            u.topHatUnlocked = true;
            u.topHatEquipped = true;
            u.hardModeUnlocked = true;
            u.veryHardModeUnlocked = true;
            u.insanelyHardModeUnlocked = true;
            u.bossRushUnlocked = true;
            const allCamos = BO.AttachmentsData.CAMOS.map((c) => c.id);
            for (const wid of BO.WeaponsData.ORDER) {
                const rec = BO.Save.getWeaponRecord(wid);
                rec.unlockedCamos = allCamos.slice();
            }
            BO.Save.save();
        }

        lockEverything() {
            BO.Settings.set('unlockAll', false);
            if (!BO.Save.data.unlockables) BO.Save.data.unlockables = {};
            const u = BO.Save.data.unlockables;
            u.topHatUnlocked = false;
            u.topHatEquipped = false;
            u.hardModeUnlocked = false;
            u.veryHardModeUnlocked = false;
            u.insanelyHardModeUnlocked = false;
            u.bossRushUnlocked = false;
            for (const wid of Object.keys(BO.Save.data.weapons || {})) {
                const rec = BO.Save.data.weapons[wid];
                rec.unlockedCamos = ['default'];
            }
            BO.Save.save();
        }

        setMaxLevel() {
            const p = BO.Save.data.player;
            p.level = BO.ProgressionData.MAX_LEVEL;
            p.prestige = BO.ProgressionData.MAX_PRESTIGE;
            p.xp = BO.ProgressionData.xpRequiredForLevel(BO.ProgressionData.MAX_LEVEL);
            for (const wid of BO.WeaponsData.ORDER) {
                const rec = BO.Save.getWeaponRecord(wid);
                rec.level = BO.ProgressionData.MAX_WEAPON_LEVEL;
                rec.xp = BO.ProgressionData.xpRequiredForWeaponLevel(BO.ProgressionData.MAX_WEAPON_LEVEL);
            }
            BO.Save.save();
        }

        resetAllLevels() {
            const p = BO.Save.data.player;
            p.level = 1;
            p.prestige = 0;
            p.xp = 0;
            p.permanentUnlocks = [];
            for (const wid of Object.keys(BO.Save.data.weapons || {})) {
                const rec = BO.Save.data.weapons[wid];
                rec.level = 1;
                rec.xp = 0;
            }
            BO.Save.save();
        }

        awardMedal(medalId) {
            const medal = BO.ProgressionData.MEDALS[medalId];
            if (!medal) return;
            const stats = BO.Save.data.stats;
            stats.medals[medalId] = (stats.medals[medalId] || 0) + 1;
            this.grantPlayerXP(medal.xp);
            BO.Sound.playMedal();
            BO.Events.emit('progression:medal', medal);
            this.evaluateChallenges();
        }

        recordStat(key, delta = 1) {
            const stats = BO.Save.data.stats;
            stats[key] = (stats[key] || 0) + delta;
        }

        recordHighestRound(mapId, roundNum) {
            const map = BO.Save.data.stats.highestRoundByMap;
            if ((map[mapId] || 0) < roundNum) {
                map[mapId] = roundNum;
            }
            this.evaluateChallenges();
        }

        evaluateChallenges() {
            const stats = BO.Save.data.stats;
            const chMap = BO.Save.data.challenges;
            const bestRoundAny = Math.max(0, ...Object.values(stats.highestRoundByMap || {}));

            for (const ch of BO.ProgressionData.CHALLENGES) {
                if (!chMap[ch.id]) chMap[ch.id] = { progress: 0, completed: false };
                const entry = chMap[ch.id];
                let val = 0;
                if (ch.stat === 'bestRoundAny') {
                    val = bestRoundAny;
                } else if (ch.stat.startsWith('medal_')) {
                    const mKey = ch.stat.slice(6);
                    val = stats.medals[mKey] || 0;
                } else {
                    val = stats[ch.stat] || 0;
                }
                entry.progress = Math.min(ch.target, val);
                if (!entry.completed && val >= ch.target) {
                    entry.completed = true;
                    this.grantPlayerXP(ch.rewardXp);
                    BO.Events.emit('progression:challenge', ch);
                }
            }
        }

        canEnterPrestige() {
            const p = BO.Save.data.player;
            return p.level >= BO.ProgressionData.MAX_LEVEL && p.prestige < BO.ProgressionData.MAX_PRESTIGE;
        }

        enterPrestige(permanentUnlockItemId = null) {
            if (!this.canEnterPrestige()) return false;
            const p = BO.Save.data.player;
            p.prestige++;
            p.level = 1;
            p.xp = 0;
            p.tokens++;
            if (permanentUnlockItemId && !p.permanentUnlocks.includes(permanentUnlockItemId)) {
                p.permanentUnlocks.push(permanentUnlockItemId);
            }
            BO.Save.save();
            BO.Sound.playRankUp();
            BO.Events.emit('progression:prestige', { prestige: p.prestige });
            return true;
        }

        flushSave() {
            this.evaluateChallenges();
            BO.Save.save();
        }
    }

    BO.Progression = new ProgressionSystem();
})(window);
