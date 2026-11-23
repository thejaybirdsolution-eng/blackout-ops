/* ============================================================================
   BLACKOUT OPS — Live Settings, Custom Keybinds & Zombies Cheat Manager
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const DEFAULT_KEYBINDS = {
        forward: 'KeyW',
        back: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        sprint: 'ShiftLeft',
        jump: 'Space',
        crouch: 'KeyC',
        reload: 'KeyR',
        interact: 'KeyE',
        armory: 'KeyJ',
        melee: 'KeyV',
        lethal: 'KeyG',
        tactical: 'KeyQ',
        special: 'KeyX',
        ultimate: 'KeyU',
        armor: 'Digit4',
        fireMode: 'KeyB',
        inspect: 'KeyI',
        exfil: 'KeyH',
        pause: 'KeyP'
    };

    const CHEAT_DEFS = {
        infammo: { code: 'infammo', name: 'Infinite Ammo & No Reload', desc: 'Unlimited bullets, magic energy, grenades, and tacticals—never reload!' },
        infmoney: { code: 'infmoney', name: 'Infinite Money (99,999 PTS)', desc: 'Sets your Zombies points to 99,999 and keeps them topped up.' },
        infhealth: { code: 'infhealth', name: 'Invincible (God Mode)', desc: 'You cannot take health damage or die in Zombies mode.' },
        fast: { code: 'fast', name: '2x Movement Speed', desc: 'Move twice as fast across the map in Zombies.' },
        superfast: { code: 'superfast', name: '4x Super Speed', desc: 'Blaze around the map at 4x movement speed in Zombies.' },
        jump: { code: 'jump', name: '2x High Jump', desc: 'Jump twice as high into the air in Zombies.' },
        '2jump': { code: '2jump', name: 'Double Jump', desc: 'Press Jump a second time while in mid-air to double jump!' },
        bighead: { code: 'bighead', name: 'Big Head Zombies (3x)', desc: 'All zombies have giant 3x oversized heads for easy headshots.' },
        wondernomore: { code: 'wondernomore', name: 'Wonder No More (Pick Box Gun)', desc: 'The Mystery Box lets you directly choose any of the 70 weapons!' },
        perks: { code: 'perks', name: 'Permanent All Perks', desc: 'Unlocks all 6 Perk-a-Colas immediately and you never lose them when downed.' },
        rounds: { code: 'rounds', name: 'Round Selector Unlocked', desc: 'Unlocks the Round Picker in the Start & Pause menus to jump to any wave or Boss Round!' },
        tiny: { code: 'tiny', name: 'Tiny Mode (25% Size)', desc: 'Shrinks your soldier down to 25% height in Zombies mode.' },
        choose: { code: 'choose', name: 'Custom Sandbox Director', desc: 'Choose round, edit the active Zombie Pool, toggle advantages/disadvantages, and pick your starting gear!' },
        fly: { code: 'fly', name: 'Fly Mode (3D Flight)', desc: 'Fly freely through the air! Hold [SPACE] to ascend and [C] / [CTRL] to descend.' },
        noclip: { code: 'noclip', name: 'Noclip (Walk Through Walls)', desc: 'Fly and phase straight through any wall, door, ceiling, or obstacle!' },
        megaman: { code: 'megaman', name: 'Mega Man Buster Weapon', desc: 'Equips the cybernetic MEGA BUSTER MK-X arm-cannon firing Solar Plasma blasts!' },
        dance: { code: 'dance', name: 'Zombie Dance Party', desc: 'Once every minute (and right away!), all zombies stop and dance for 2 seconds!' },
        unlock: { code: 'unlock', name: 'Unlock Everything', desc: 'Unlocks all weapons, attachments, Gold Camo, Top Hat, Hard/Very Hard/Insanely Hard modes & Boss Rush!' },
        lock: { code: 'lock', name: 'Lock Everything', desc: 'Locks all progression-gated items, camos, Top Hat, and difficulty modes.' },
        maxlevel: { code: 'maxlevel', name: 'Max Level (Rank 55 / P10)', desc: 'Instantly sets your Rank to Level 55 (Prestige 10) and all weapons to Max Level 20!' },
        resetlevel: { code: 'resetlevel', name: 'Reset Level & All XP', desc: 'Resets your Military Rank, Prestige, and all Weapon XP back to Level 1 (0 XP).' }
    };

    class SettingsManager {
        constructor() {
            this._ensureDefaults();
        }

        _ensureDefaults() {
            const s = BO.Save.data.settings;
            if (!s.bloodLevel) s.bloodLevel = 'normal'; // 'off' | 'normal' | 'ultra'
            if (s.screenShake === undefined) s.screenShake = 1.0;
            if (s.exposure === undefined) s.exposure = 1.08;
            if (s.resScale === undefined) s.resScale = 1.0;
            if (s.hudOpacity === undefined) s.hudOpacity = 1.0;
            if (s.hitmarkerVolume === undefined) s.hitmarkerVolume = 1.0;
            if (s.zombieVolume === undefined) s.zombieVolume = 1.0;
            if (s.dynamicLights === undefined) s.dynamicLights = true;
            if (s.wallDecals === undefined) s.wallDecals = true;
            if (s.damageNumbers === undefined) s.damageNumbers = true;
            if (!s.keybinds || typeof s.keybinds !== 'object') {
                s.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
            } else {
                for (const k of Object.keys(DEFAULT_KEYBINDS)) {
                    if (!s.keybinds[k]) s.keybinds[k] = DEFAULT_KEYBINDS[k];
                }
            }
            if (!BO.Save.data.cheats || typeof BO.Save.data.cheats !== 'object') {
                BO.Save.data.cheats = { unlockedModMenu: false };
            }
            for (const c of Object.keys(CHEAT_DEFS)) {
                if (BO.Save.data.cheats[c] === undefined) BO.Save.data.cheats[c] = false;
            }
        }

        get all() {
            this._ensureDefaults();
            return BO.Save.data.settings;
        }

        get(key) {
            this._ensureDefaults();
            return BO.Save.data.settings[key];
        }

        set(key, value) {
            this._ensureDefaults();
            BO.Save.data.settings[key] = value;
            BO.Save.save();
            BO.Events.emit('settings:changed', { key, value, settings: BO.Save.data.settings });
        }

        getKeybinds() {
            this._ensureDefaults();
            return BO.Save.data.settings.keybinds;
        }

        setKeybind(action, code) {
            this._ensureDefaults();
            BO.Save.data.settings.keybinds[action] = code;
            BO.Save.save();
            BO.Events.emit('settings:changed', { key: 'keybinds', value: BO.Save.data.settings.keybinds });
        }

        resetKeybinds() {
            this._ensureDefaults();
            BO.Save.data.settings.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
            BO.Save.save();
            BO.Events.emit('settings:changed', { key: 'keybinds', value: BO.Save.data.settings.keybinds });
        }

        getQualityPreset() {
            const q = this.get('quality') || 'high';
            const dynLights = this.get('dynamicLights') !== false;
            const decalsOn = this.get('wallDecals') !== false;
            const scale = BO.Math.clamp(this.get('resScale') || 1.0, 0.5, 1.0);
            if (q === 'low') {
                return {
                    pixelRatioCap: 1.0 * scale,
                    shadows: false,
                    shadowMapSize: 512,
                    maxParticles: 80,
                    maxDecals: decalsOn ? 25 : 0,
                    pointLights: false
                };
            }
            if (q === 'medium') {
                return {
                    pixelRatioCap: 1.35 * scale,
                    shadows: true,
                    shadowMapSize: 1024,
                    maxParticles: 160,
                    maxDecals: decalsOn ? 55 : 0,
                    pointLights: dynLights
                };
            }
            return {
                pixelRatioCap: 1.8 * scale,
                shadows: true,
                shadowMapSize: 2048,
                maxParticles: 280,
                maxDecals: decalsOn ? 80 : 0,
                pointLights: dynLights
            };
        }
    }

    class CheatManager {
        get defs() {
            return CHEAT_DEFS;
        }

        getDefinitions() {
            const list = Object.values(CHEAT_DEFS);
            return list.concat([
                {
                    code: 'cheats',
                    name: 'Unlock Mod Menu',
                    desc: 'Unlocks the "Mod Menu" option in the Start & Pause menus to turn any cheat ON or OFF anytime with checkboxes!',
                    isMeta: true
                }
            ]);
        }

        disableAll() {
            BO.Settings._ensureDefaults();
            for (const c of Object.keys(CHEAT_DEFS)) {
                BO.Save.data.cheats[c] = false;
                this._applyImmediateEffects(c, false);
            }
            BO.Save.save();
            BO.Events.emit('cheats:changed', { code: 'all', enabled: false, state: BO.Save.data.cheats });
        }

        get state() {
            BO.Settings._ensureDefaults();
            return BO.Save.data.cheats;
        }

        isZombiesActive() {
            return BO.State && BO.State.activeMode === 'zombies';
        }

        /**
         * Returns true if the cheat is enabled AND we are currently in Zombies mode
         * (or checkRaw=true for UI checkboxes/menus).
         */
        isActive(code, checkRaw = false) {
            BO.Settings._ensureDefaults();
            const val = !!BO.Save.data.cheats[code];
            if (checkRaw) return val;
            return val && this.isZombiesActive();
        }

        isModMenuUnlocked() {
            BO.Settings._ensureDefaults();
            return !!BO.Save.data.cheats.unlockedModMenu;
        }

        setCheat(code, enabled) {
            BO.Settings._ensureDefaults();
            if (code === 'cheats') {
                BO.Save.data.cheats.unlockedModMenu = !!enabled;
            } else if (CHEAT_DEFS[code]) {
                BO.Save.data.cheats[code] = !!enabled;
            }
            BO.Save.save();
            this._applyImmediateEffects(code, !!enabled);
            BO.Events.emit('cheats:changed', { code, enabled: !!enabled, state: BO.Save.data.cheats });
        }

        /**
         * Processes a typed cheat code string from the user.
         * Returns { ok, title, desc, enabled }
         */
        enterCode(rawInput) {
            const clean = String(rawInput || '').trim().toLowerCase().replace(/\s+/g, '');
            if (!clean) return { ok: false, msg: 'Enter a valid cheat code.' };

            if (clean === 'cheats') {
                this.setCheat('cheats', true);
                BO.Sound.playRankUp();
                return {
                    ok: true,
                    code: 'cheats',
                    enabled: true,
                    title: 'MOD MENU UNLOCKED!',
                    desc: 'The "MOD MENU" button is now unlocked in the Start Menu and Pause Menu!',
                    msg: 'MOD MENU UNLOCKED! Check the Start Menu or Pause Menu for ★ MOD MENU (CHEATS).'
                };
            }

            if (clean === 'unlock') {
                if (BO.Progression) BO.Progression.unlockEverything();
                this.setCheat('unlock', true);
                this.setCheat('lock', false);
                BO.Sound.playRankUp();
                return {
                    ok: true,
                    code: 'unlock',
                    enabled: true,
                    title: 'EVERYTHING UNLOCKED!',
                    desc: CHEAT_DEFS.unlock.desc,
                    msg: 'EVERYTHING UNLOCKED! All weapons, Gold Camo, Top Hat, Hard/Very Hard/Insanely Hard modes & Boss Rush are now unlocked!'
                };
            }

            if (clean === 'lock') {
                if (BO.Progression) BO.Progression.lockEverything();
                this.setCheat('lock', true);
                this.setCheat('unlock', false);
                BO.Sound.playUIClick();
                return {
                    ok: true,
                    code: 'lock',
                    enabled: true,
                    title: 'EVERYTHING LOCKED!',
                    desc: CHEAT_DEFS.lock.desc,
                    msg: 'EVERYTHING LOCKED! Items, camos, Top Hat, and difficulty modes reset to locked progression.'
                };
            }

            if (clean === 'maxlevel') {
                if (BO.Progression) BO.Progression.setMaxLevel();
                this.setCheat('maxlevel', true);
                this.setCheat('resetlevel', false);
                BO.Sound.playRankUp();
                return {
                    ok: true,
                    code: 'maxlevel',
                    enabled: true,
                    title: 'MAX LEVEL 55 (PRESTIGE 10)!',
                    desc: CHEAT_DEFS.maxlevel.desc,
                    msg: 'MAX LEVEL REACHED! You are now Rank 55 Commander (Prestige 10) with all weapons at Level 20!'
                };
            }

            if (clean === 'resetlevel') {
                if (BO.Progression) BO.Progression.resetAllLevels();
                this.setCheat('resetlevel', true);
                this.setCheat('maxlevel', false);
                BO.Sound.playUIClick();
                return {
                    ok: true,
                    code: 'resetlevel',
                    enabled: true,
                    title: 'LEVEL & XP RESET!',
                    desc: CHEAT_DEFS.resetlevel.desc,
                    msg: 'LEVEL & XP RESET! Rank, Prestige, and weapon XP have been reset to Level 1 (0 XP).'
                };
            }

            if (CHEAT_DEFS[clean]) {
                const next = (clean === 'choose' || clean === 'megaman') ? true : !this.isActive(clean, true);
                this.setCheat(clean, next);
                BO.Sound.playPerkBuy();
                if (clean === 'choose' && BO.Menus && BO.Menus.openChooseModal) {
                    setTimeout(() => BO.Menus.openChooseModal(), 60);
                }
                return {
                    ok: true,
                    code: clean,
                    enabled: next,
                    title: `${CHEAT_DEFS[clean].name}: ${next ? 'ON' : 'OFF'}`,
                    desc: CHEAT_DEFS[clean].desc,
                    msg: `${CHEAT_DEFS[clean].name} [${clean}] is now ${next ? 'ENABLED' : 'DISABLED'}!`
                };
            }

            BO.Sound.playEmptyClick();
            return {
                ok: false,
                msg: `Unknown code "${rawInput}". Valid codes: infammo, infmoney, infhealth, fast, superfast, jump, 2jump, bighead, wondernomore, perks, rounds, tiny, choose, fly, noclip, megaman, dance, unlock, lock, maxlevel, resetlevel, cheats.`
            };
        }

        _applyImmediateEffects(code, enabled) {
            if (code === 'unlock' && enabled && BO.Progression) BO.Progression.unlockEverything();
            if (code === 'lock' && enabled && BO.Progression) BO.Progression.lockEverything();
            if (code === 'maxlevel' && enabled && BO.Progression) BO.Progression.setMaxLevel();
            if (code === 'resetlevel' && enabled && BO.Progression) BO.Progression.resetAllLevels();

            if (!this.isZombiesActive()) return;
            const P = BO.Player;
            const ZM = BO.ZombiesMode;
            if (code === 'infmoney' && enabled && ZM) {
                ZM.points = Math.max(ZM.points, 99999);
            }
            if (code === 'perks' && enabled && P) {
                ['quick_revive', 'juggernog', 'speed_cola', 'double_tap', 'stamin_up', 'deadshot'].forEach((pk) => P.zombiePerks.add(pk));
                P.applyPerkStats();
            }
            if (code === 'infammo' && enabled && P) {
                P.refillAllAmmo();
                P.reloading = false;
            }
            if (code === 'megaman' && enabled && P) {
                P.giveWeapon('megaman_buster', false, false);
                BO.Events.emit('hud:banner', {
                    title: 'MEGA BUSTER MK-X EQUIPPED!',
                    sub: 'SOLAR PLASMA ARM-CANNON ONLINE',
                    color: '#38bdf8'
                });
            }
            if (code === 'dance' && enabled && ZM && ZM.triggerZombieDance) {
                ZM.triggerZombieDance();
            }
            if (code === 'bighead' && ZM) {
                for (const z of ZM.zombies) {
                    if (z.parts && z.parts.headGroup) {
                        z.parts.headGroup.scale.setScalar(enabled ? 3.0 : 1.0);
                    }
                }
            }
        }
    }

    BO.Settings = new SettingsManager();
    BO.Cheats = new CheatManager();
})(window);
