/* ============================================================================
   BLACKOUT OPS — Persistent Offline SaveSystem
   Safe localStorage wrapper with in-memory fallback, schema defaults,
   export/import JSON, and reset.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const STORAGE_KEY = 'blackout_ops_save_v1';

    let memoryFallback = null;

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
            version: 1,
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
                crosshairColor: '#f8fafc',
                crosshairStyle: 'dynamic',
                showFps: true,
                unlockAll: false
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

    function readRawStorage() {
        try {
            if (global.localStorage) {
                return global.localStorage.getItem(STORAGE_KEY);
            }
        } catch (e) {
            // Private browsing / restricted file:// storage fallback
        }
        return memoryFallback;
    }

    function writeRawStorage(str) {
        memoryFallback = str;
        try {
            if (global.localStorage) {
                global.localStorage.setItem(STORAGE_KEY, str);
            }
        } catch (e) {
            // Ignore storage quota / security exception; memoryFallback keeps session state
        }
    }

    class SaveSystem {
        constructor() {
            this.data = this.load();
        }

        load() {
            const base = createDefaultSave();
            const raw = readRawStorage();
            if (!raw) return base;
            try {
                const parsed = JSON.parse(raw);
                deepMerge(base, parsed);
                // Ensure exactly 10 class slots exist and are well-formed
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
            } catch (e) {
                console.warn('[SaveSystem] Corrupt save ignored, starting fresh.', e);
                return createDefaultSave();
            }
            return base;
        }

        save() {
            writeRawStorage(JSON.stringify(this.data));
            BO.Events.emit('save:updated', this.data);
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
            return JSON.stringify(this.data, null, 2);
        }

        importSave(jsonStr) {
            const parsed = JSON.parse(jsonStr);
            if (!parsed || typeof parsed !== 'object' || !parsed.player) {
                throw new Error('Invalid BLACKOUT OPS save file.');
            }
            const fresh = createDefaultSave();
            deepMerge(fresh, parsed);
            this.data = fresh;
            this.save();
            return true;
        }

        resetSave() {
            this.data = createDefaultSave();
            this.save();
            return this.data;
        }
    }

    BO.Save = new SaveSystem();
})(window);
