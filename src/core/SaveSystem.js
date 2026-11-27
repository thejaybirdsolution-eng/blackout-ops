/* ============================================================================
   BLACKOUT OPS — Persistent Offline SaveSystem
   Safe localStorage wrapper with in-memory fallback, schema defaults,
   export/import JSON, and reset.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const STORAGE_KEY = 'blackout_ops_save_v1';
    const STORAGE_TMP = STORAGE_KEY + '_tmp';
    const BACKUP_KEYS = [STORAGE_KEY + '_bak0', STORAGE_KEY + '_bak1', STORAGE_KEY + '_bak2'];
    const CURRENT_VERSION = 3;

    let memoryFallback = null;
    const sliceOwners = new Map();

    function buildStarterClasses() {
        return [
            {
                id: 0,
                name: 'TACTICAL ASSAULT',
                primary: {
                    id: 'm4a1',
                    camo: 'woodland',
                    attachments: {
                        optic: 'reflex',
                        muzzle: 'compensator',
                        underbarrel: 'foregrip',
                        magazine: 'ext_mags',
                        stock: 'stippled'
                    }
                },
                secondary: {
                    id: 'm1911',
                    camo: 'default',
                    attachments: {
                        optic: 'iron',
                        muzzle: 'none',
                        underbarrel: 'none',
                        magazine: 'std_mag',
                        stock: 'std_stock'
                    }
                },
                lethal: 'frag',
                tactical: 'flashbang',
                perks: ['scavenger', 'sleight_of_hand', 'steady_aim'],
                fieldUpgrade: 'munitions_box',
                ultimatePower: 'gravity_spikes',
                killstreaks: ['uav', 'predator', 'chopper']
            },
            {
                id: 1,
                name: 'CQB BREACHER',
                primary: {
                    id: 'mp5',
                    camo: 'urban',
                    attachments: {
                        optic: 'holo',
                        muzzle: 'suppressor',
                        underbarrel: 'laser',
                        magazine: 'fast_mags',
                        stock: 'no_stock'
                    }
                },
                secondary: {
                    id: 'm1911',
                    camo: 'carbon',
                    attachments: {
                        optic: 'iron',
                        muzzle: 'suppressor',
                        underbarrel: 'laser',
                        magazine: 'ext_mags',
                        stock: 'std_stock'
                    }
                },
                lethal: 'semtex',
                tactical: 'stim',
                perks: ['double_time', 'quick_fix', 'dead_silence'],
                fieldUpgrade: 'aether_shroud',
                ultimatePower: 'annihilator',
                killstreaks: ['uav', 'care_package', 'chopper']
            },
            {
                id: 2,
                name: 'OVERWATCH SNIPER',
                primary: {
                    id: 'intervention',
                    camo: 'arctic',
                    attachments: {
                        optic: 'sniper_scope',
                        muzzle: 'muzzle_brake',
                        underbarrel: 'heavy_barrel',
                        magazine: 'ext_mags',
                        stock: 'precision_stock'
                    }
                },
                secondary: {
                    id: 'deagle',
                    camo: 'carbon',
                    attachments: {
                        optic: 'reflex',
                        muzzle: 'compensator',
                        underbarrel: 'none',
                        magazine: 'std_mag',
                        stock: 'std_stock'
                    }
                },
                lethal: 'c4',
                tactical: 'flashbang',
                perks: ['overkill', 'ghost', 'stalker'],
                fieldUpgrade: 'trophy_system',
                ultimatePower: 'cryo_nova',
                killstreaks: ['uav', 'predator', 'juggernaut']
            },
            {
                id: 3,
                name: 'BREACH SHOTGUNNER',
                primary: {
                    id: 'r870',
                    camo: 'red_tiger',
                    attachments: {
                        optic: 'reflex',
                        muzzle: 'muzzle_brake',
                        underbarrel: 'laser',
                        magazine: 'ext_mags',
                        stock: 'no_stock'
                    }
                },
                secondary: {
                    id: 'm1911',
                    camo: 'default',
                    attachments: {
                        optic: 'iron',
                        muzzle: 'none',
                        underbarrel: 'none',
                        magazine: 'fast_mags',
                        stock: 'std_stock'
                    }
                },
                lethal: 'semtex',
                tactical: 'stim',
                perks: ['flak_jacket', 'quick_fix', 'amped'],
                fieldUpgrade: 'frenzied_guard',
                ultimatePower: 'death_machine',
                killstreaks: ['uav', 'care_package', 'predator']
            },
            {
                id: 4,
                name: 'HEAVY SUPPRESSOR',
                primary: {
                    id: 'm249',
                    camo: 'carbon',
                    attachments: {
                        optic: 'acog',
                        muzzle: 'compensator',
                        underbarrel: 'foregrip',
                        magazine: 'drum_mag',
                        stock: 'precision_stock'
                    }
                },
                secondary: {
                    id: 'm1911',
                    camo: 'default',
                    attachments: {
                        optic: 'iron',
                        muzzle: 'none',
                        underbarrel: 'none',
                        magazine: 'std_mag',
                        stock: 'std_stock'
                    }
                },
                lethal: 'frag',
                tactical: 'monkey_bomb',
                perks: ['scavenger', 'hardline', 'steady_aim'],
                fieldUpgrade: 'munitions_box',
                ultimatePower: 'orbital_strike',
                killstreaks: ['uav', 'chopper', 'nuke']
            }
        ];
    }

    function createDefaultClasses() {
        const list = buildStarterClasses();
        for (let i = 5; i < 10; i++) {
            const base = BO.Math.deepClone(list[0]);
            base.id = i;
            base.name = 'CUSTOM CLASS ' + (i + 1);
            list.push(base);
        }
        return list;
    }

    function createDefaultSave() {
        return {
            version: CURRENT_VERSION,
            callsign: 'SPECTRE-01',
            player: {
                xp: 0,
                level: 1,
                prestige: 0,
                permanentUnlocks: [],
                tokens: 1
            },
            weapons: {}, // { weaponId: { xp, level, kills, headshots, unlockedCamos: ['default', ...] } }
            classes: createDefaultClasses(),
            selectedClassIndex: 0,
            stats: {
                mpKills: 0,
                mpDeaths: 0,
                mpWins: 0,
                mpMatches: 0,
                mpHeadshots: 0,
                mpObjectives: 0,
                mpBestKills: 0,
                mpScore: 0,
                mpKillstreaksCalled: 0,
                shotsFired: 0,
                shotsHit: 0,
                zombiesKills: 0,
                zombiesHeadshots: 0,
                zombiesGames: 0,
                zombiesRevives: 0,
                zombiesPerksBought: 0,
                zombiesBoxSpins: 0,
                zombiesPaPUsed: 0,
                zombiesExfils: 0,
                highestRoundByMap: {
                    der_bunker: 0,
                    station_omega: 0
                },
                medals: {},
                weaponKills: {}
            },
            challenges: {}, // { challengeId: { progress: 0, completed: false } }
            unlockables: {
                topHatUnlocked: false,
                topHatEquipped: false,
                hardModeUnlocked: false,
                veryHardModeUnlocked: false,
                insanelyHardModeUnlocked: false,
                bossRushUnlocked: false
            },
            chooseConfig: {
                startRound: 1,
                startPoints: 500,
                startPrimary: '',
                startSecondary: '',
                startPapTier: 0,
                startAllPerks: false,
                customZombiePool: [],
                advDoubleDamage: false,
                advInstaKill: false,
                advDoublePoints: false,
                advLowGravity: false,
                disHeadshotsOnly: false,
                disHalfDamage: false,
                disOneHp: false,
                disNoPerks: false,
                disTurboZombies: false
            },
            settings: {
                quality: 'high',
                sensitivity: 1.0,
                adsSensitivity: 0.65,
                fov: 90,
                invertY: false,
                masterVolume: 0.8,
                sfxVolume: 0.85,
                musicVolume: 0.55,
                musicMuted: false,
                sfxMuted: false,
                crosshairColor: '#f8fafc',
                crosshairStyle: 'dynamic',
                showFps: true,
                unlockAll: false
            },
            minigames: {
                best: {},
                plays: 0,
                skipCountdown: false
            },
            profile: {
                level: 1,
                xp: 0,
                totalXp: 0,
                callingCard: 'card_blackout',
                emblem: 'emb_star',
                title: 'OPERATIVE',
                unlockedCards: ['card_blackout'],
                unlockedEmblems: ['emb_star'],
                unlockedTitles: ['OPERATIVE'],
                unlockedRewards: [],
                lastMode: null,
                lastMapId: null,
                lastPlayedAt: 0,
                onboardingDone: false,
                challenges: { dailyKey: '', daily: [], weeklyKey: '', weekly: [] },
                campaign: { completed: {}, activeMissionId: null, choices: {} }
            }
        };
    }

    function deepMerge(target, source) {
        if (!source || typeof source !== 'object') return target;
        const keys = Object.keys(source);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const sv = source[k];
            const tv = target[k];
            if (Array.isArray(sv)) {
                target[k] = sv.slice();
            } else if (sv && typeof sv === 'object' && tv && typeof tv === 'object' && !Array.isArray(tv)) {
                deepMerge(tv, sv);
            } else if (sv !== undefined) {
                target[k] = sv;
            }
        }
        return target;
    }

    const MIGRATIONS = {
        0(save) {
            if (!save.stats || typeof save.stats !== 'object') save.stats = {};
            if (!save.weapons || typeof save.weapons !== 'object') save.weapons = {};
            save.version = 1;
            return save;
        },
        1(save) {
            if (!save.settings || typeof save.settings !== 'object') save.settings = {};
            if (!save.minigames || typeof save.minigames !== 'object') save.minigames = { best: {} };
            save.version = 2;
            return save;
        },
        2(save) {
            if (!save.profile || typeof save.profile !== 'object') save.profile = {};
            save.version = 3;
            return save;
        }
    };

    function migrateSaveData(parsed) {
        if (!parsed || typeof parsed !== 'object') return parsed;
        let v = Number.isFinite(parsed.version) ? parsed.version : 0;
        while (v < CURRENT_VERSION && typeof MIGRATIONS[v] === 'function') {
            parsed = MIGRATIONS[v](parsed);
            v = parsed.version;
        }
        parsed.version = CURRENT_VERSION;
        return parsed;
    }

    function readKeySafe(key) {
        try {
            if (global.localStorage) {
                return global.localStorage.getItem(key);
            }
        } catch (e) {
            BO.log?.('SaveSystem', 'warn', 'localStorage read failed for ' + key, e);
        }
        return null;
    }

    function writeKeySafe(key, val) {
        if (!global.localStorage) return false;
        try {
            global.localStorage.setItem(key, val);
            return global.localStorage.getItem(key) === val;
        } catch (e) {
            return false;
        }
    }

    function removeKeySafe(key) {
        try {
            if (global.localStorage) global.localStorage.removeItem(key);
        } catch (e) {
            BO.log?.('SaveSystem', 'debug', 'localStorage remove failed for ' + key, e);
        }
    }

    function validateParsedSave(parsed) {
        return !!(parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.player && typeof parsed.player === 'object');
    }

    class SaveSystem {
        constructor() {
            this.storageDegraded = false;
            this.recoveredFromBackup = false;
            this.recoverySource = null;
            this.lastMigratedFrom = null;
            this._degradedToastShown = false;
            this.data = this.load();
        }

        _keysFor(primaryKey) {
            const pk = primaryKey || STORAGE_KEY;
            return {
                primary: pk,
                tmp: pk + '_tmp',
                backups: [pk + '_bak0', pk + '_bak1', pk + '_bak2']
            };
        }

        _writeAtomic(str, keyOverride) {
            memoryFallback = str;
            if (!global.localStorage) {
                this.storageDegraded = true;
                return false;
            }
            const keys = this._keysFor(keyOverride);
            const prevPrimary = readKeySafe(keys.primary);

            // Stage in _tmp first to avoid partial primary overwrite
            let wroteTmp = writeKeySafe(keys.tmp, str);
            if (!wroteTmp) {
                // Quota pressure: prune oldest backups and retry
                removeKeySafe(keys.backups[2]);
                removeKeySafe(keys.backups[1]);
                wroteTmp = writeKeySafe(keys.tmp, str);
            }
            if (!wroteTmp) {
                this.storageDegraded = true;
                BO.log?.('SaveSystem', 'warn', 'Storage quota/write failed; running in memory fallback');
                if (!this._degradedToastShown) {
                    this._degradedToastShown = true;
                    setTimeout(() => BO.Events?.emit?.('hud:toast', {
                        text: 'WARNING: Browser storage unavailable/full — export save JSON to keep progress!',
                        color: '#ef4444'
                    }), 300);
                }
                return false;
            }

            // Rotate backups when replacing an existing valid save
            if (prevPrimary && prevPrimary !== str) {
                try {
                    const b1 = readKeySafe(keys.backups[1]);
                    const b0 = readKeySafe(keys.backups[0]);
                    if (b1) writeKeySafe(keys.backups[2], b1);
                    if (b0) writeKeySafe(keys.backups[1], b0);
                    writeKeySafe(keys.backups[0], prevPrimary);
                } catch (e) {
                    BO.log?.('SaveSystem', 'debug', 'Backup rotation skipped under quota pressure', e);
                }
            }

            const swapped = writeKeySafe(keys.primary, str);
            removeKeySafe(keys.tmp);
            if (!swapped) {
                this.storageDegraded = true;
                return false;
            }
            this.storageDegraded = false;
            return true;
        }

        _hydrateFromParsed(parsed) {
            const origVer = Number.isFinite(parsed.version) ? parsed.version : 0;
            if (origVer < CURRENT_VERSION) this.lastMigratedFrom = origVer;
            const migrated = migrateSaveData(parsed);
            const base = createDefaultSave();
            deepMerge(base, migrated);
            base.version = CURRENT_VERSION;
            if (!Array.isArray(base.classes) || base.classes.length < 10) {
                const fresh = createDefaultClasses();
                for (let i = 0; i < 10; i++) {
                    if (base.classes && base.classes[i]) {
                        fresh[i] = deepMerge(fresh[i], base.classes[i]);
                    }
                }
                base.classes = fresh;
            }
            for (let i = 0; i < 10; i++) {
                base.classes[i].id = i;
                if (!base.classes[i].primary) base.classes[i].primary = createDefaultClasses()[0].primary;
                if (!base.classes[i].secondary) base.classes[i].secondary = createDefaultClasses()[0].secondary;
                if (!Array.isArray(base.classes[i].perks) || base.classes[i].perks.length !== 3) {
                    base.classes[i].perks = ['scavenger', 'sleight_of_hand', 'steady_aim'];
                }
                if (!Array.isArray(base.classes[i].killstreaks) || base.classes[i].killstreaks.length !== 3) {
                    base.classes[i].killstreaks = ['uav', 'predator', 'chopper'];
                }
                if (!base.classes[i].ultimatePower) {
                    base.classes[i].ultimatePower = 'gravity_spikes';
                }
            }
            return base;
        }

        load(keyOverride = null) {
            this.recoveredFromBackup = false;
            this.recoverySource = null;
            const keys = this._keysFor(keyOverride);
            const candidates = [
                { key: keys.primary, label: 'primary' },
                { key: keys.tmp, label: 'tmp' },
                { key: keys.backups[0], label: 'bak0' },
                { key: keys.backups[1], label: 'bak1' },
                { key: keys.backups[2], label: 'bak2' }
            ];

            let anyData = false;
            for (let i = 0; i < candidates.length; i++) {
                const raw = readKeySafe(candidates[i].key);
                if (!raw) continue;
                anyData = true;
                try {
                    const parsed = JSON.parse(raw);
                    if (!validateParsedSave(parsed)) continue;
                    const hydrated = this._hydrateFromParsed(parsed);
                    if (i > 0) {
                        this.recoveredFromBackup = true;
                        this.recoverySource = candidates[i].label;
                        BO.log?.('SaveSystem', 'warn', `Primary save corrupt; recovered from ${candidates[i].label}`);
                        setTimeout(() => BO.Events?.emit?.('hud:toast', {
                            text: `Save recovered automatically from ${candidates[i].label} backup.`,
                            color: '#ffb23f'
                        }), 400);
                    }
                    return hydrated;
                } catch (e) {
                    BO.log?.('SaveSystem', 'warn', `Failed to parse save candidate ${candidates[i].label}`, e);
                }
            }

            if (!anyData && memoryFallback) {
                try {
                    const parsedMem = JSON.parse(memoryFallback);
                    if (validateParsedSave(parsedMem)) return this._hydrateFromParsed(parsedMem);
                } catch (e) {
                    BO.log?.('SaveSystem', 'warn', 'Memory fallback save corrupt', e);
                }
            }
            if (anyData) {
                BO.log?.('SaveSystem', 'warn', 'All save copies corrupt; starting fresh.');
            }
            return createDefaultSave();
        }

        save(keyOverride = null) {
            this.data.version = CURRENT_VERSION;
            const json = JSON.stringify(this.data);
            this._writeAtomic(json, keyOverride);
            BO.Events?.emit?.('save:updated', this.data);
        }

        assertSliceOwner(sliceKey, ownerName) {
            const existing = sliceOwners.get(sliceKey);
            if (existing && existing !== ownerName) {
                const msg = `Save slice "${sliceKey}" ownership conflict: ${existing} vs ${ownerName}`;
                BO.log?.('SaveSystem', 'error', msg);
                throw new Error(msg);
            }
            sliceOwners.set(sliceKey, ownerName);
            return true;
        }

        getWeaponRecord(weaponId) {
            if (!this.data.weapons[weaponId]) {
                this.data.weapons[weaponId] = {
                    xp: 0,
                    level: 1,
                    kills: 0,
                    headshots: 0,
                    unlockedCamos: ['default']
                };
            }
            return this.data.weapons[weaponId];
        }

        exportSave() {
            this.data.version = CURRENT_VERSION;
            return JSON.stringify(this.data, null, 2);
        }

        downloadExportFile() {
            const txt = this.exportSave();
            const blob = new Blob([txt], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const stamp = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `blackout-ops-save-${stamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            BO.Events?.emit?.('hud:toast', { text: 'Save file exported.', color: '#22c55e' });
            return true;
        }

        importSave(jsonStr, keyOverride = null) {
            const parsed = JSON.parse(jsonStr);
            if (!validateParsedSave(parsed)) {
                throw new Error('Invalid BLACKOUT OPS save file.');
            }
            this.data = this._hydrateFromParsed(parsed);
            this.save(keyOverride);
            return true;
        }

        importFromFile(file) {
            if (!file) return Promise.reject(new Error('No file selected'));
            return file.text().then((txt) => {
                this.importSave(txt);
                BO.Events?.emit?.('hud:toast', { text: 'Save imported & backups updated!', color: '#22c55e' });
                return true;
            });
        }

        resetSave(keyOverride = null) {
            this.data = createDefaultSave();
            this.save(keyOverride);
            return this.data;
        }
    }

    BO.Save = new SaveSystem();
    BO.SaveSystemClass = SaveSystem;
    BO.Save.CURRENT_VERSION = CURRENT_VERSION;
    BO.Save.STORAGE_KEY = STORAGE_KEY;
    BO.Save.BACKUP_KEYS = BACKUP_KEYS;
    BO.Save.STORAGE_TMP = STORAGE_TMP;
    BO.Save.migrateSaveData = migrateSaveData;
})(window);
