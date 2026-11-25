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
        pause: 'KeyP',
        // Survival field controls
        survInventory: 'Tab',
        survCraft: 'KeyJ',
        survBuild: 'KeyB',
        survMap: 'KeyM',
        survSkills: 'KeyK',
        survJournal: 'KeyO',
        survTravel: 'KeyT',
        survLegend: 'KeyL',
        survRide: 'KeyN',
        survBase: 'KeyU',
        survCatalogue: 'Period',
        survQuickStack: 'KeyZ',
        survCompanion: 'KeyY',
        survFlask: 'KeyX',
        survLight: 'KeyH',
        survPlate: 'KeyF',
        survDodge: 'AltLeft',
        hotbar1: 'Digit1',
        hotbar2: 'Digit2',
        hotbar3: 'Digit3',
        hotbar4: 'Digit4',
        hotbar5: 'Digit5',
        hotbar6: 'Digit6',
        hotbar7: 'Digit7',
        hotbar8: 'Digit8',
        hotbar9: 'Digit9',
        hotbar10: 'Digit0'
    };

    /* Every rebindable action, grouped for the Controls panel. `ctx` lists the modes in
       which the binding is live; two actions only conflict when their contexts overlap. */
    const ALL_MODES = ['zombies', 'mp', 'td', 'survival'];
    const CONTROL_CATALOG = [
        { group: 'movement', label: 'Movement', actions: [
            { action: 'forward', label: 'Move forward', tip: 'Walk or run forward.', ctx: ALL_MODES },
            { action: 'back', label: 'Move backward', tip: 'Step backward.', ctx: ALL_MODES },
            { action: 'left', label: 'Strafe left', tip: 'Move sideways to the left.', ctx: ALL_MODES },
            { action: 'right', label: 'Strafe right', tip: 'Move sideways to the right.', ctx: ALL_MODES },
            { action: 'sprint', label: 'Sprint', tip: 'Hold to run. Double-tap while running for a tactical sprint.', ctx: ALL_MODES },
            { action: 'jump', label: 'Jump / mantle', tip: 'Jump over obstacles and climb onto ledges.', ctx: ALL_MODES },
            { action: 'crouch', label: 'Crouch / slide', tip: 'Crouch while standing; slide while sprinting. Crouching keeps you quiet in Survival.', ctx: ALL_MODES },
            { action: 'survDodge', label: 'Dodge roll', tip: 'Roll in your movement direction with a brief moment of invulnerability. Costs stamina.', ctx: ['survival'] }
        ] },
        { group: 'combat', label: 'Combat', actions: [
            { action: 'reload', label: 'Reload / clear jam', tip: 'Reload your firearm. In Survival this also clears a weapon stoppage.', ctx: ALL_MODES },
            { action: 'melee', label: 'Melee / punch', tip: 'Quick melee strike. Works with any held item in Survival.', ctx: ALL_MODES },
            { action: 'lethal', label: 'Throw lethal', tip: 'Throw your lethal equipment (frag, semtex, C4, molotov). Hold to cook.', ctx: ALL_MODES },
            { action: 'tactical', label: 'Use tactical', tip: 'Use your tactical equipment (flash, stim, monkey bomb).', ctx: ALL_MODES },
            { action: 'fireMode', label: 'Fire mode / detonate C4', tip: 'Switch fire mode, or detonate thrown C4 charges.', ctx: ['zombies', 'mp', 'td'] },
            { action: 'inspect', label: 'Inspect weapon', tip: 'Inspect your weapon. In Survival this also reads how full the magazine is.', ctx: ALL_MODES },
            { action: 'armor', label: 'Insert armor plate', tip: 'Slide a spare armor plate into your vest.', ctx: ['zombies', 'mp', 'td'] },
            { action: 'special', label: 'Special power', tip: 'Activate your charged Special power.', ctx: ['zombies', 'mp', 'td'] },
            { action: 'ultimate', label: 'Ultimate power', tip: 'Unleash your charged Ultimate.', ctx: ['zombies', 'mp', 'td'] }
        ] },
        { group: 'interact', label: 'Interaction', actions: [
            { action: 'interact', label: 'Interact / gather', tip: 'Use doors, buy items, talk to contacts, open containers and gather resources.', ctx: ALL_MODES },
            { action: 'armory', label: 'Armory / soda catalog', tip: 'Open the armory or the soda catalog beside a Zombies perk machine.', ctx: ['zombies', 'mp', 'td'] },
            { action: 'exfil', label: 'Call exfil', tip: 'Call an extraction chopper in Zombies (round 10 and later).', ctx: ['zombies'] }
        ] },
        { group: 'survival', label: 'Survival field terminal', actions: [
            { action: 'survInventory', label: 'Inventory', tip: 'Open the field terminal on your backpack, hotbar and equipment.', ctx: ['survival'] },
            { action: 'survCraft', label: 'Crafting', tip: 'Open crafting. Recipes that need a workbench, campfire or kiln unlock when you stand at one.', ctx: ['survival'] },
            { action: 'survBuild', label: 'Build', tip: 'Open construction to place walls, stations, storage and defenses. Detonates C4 if you have charges out.', ctx: ['survival'] },
            { action: 'survMap', label: 'Map', tip: 'Open the field map with landmarks, contacts and your position.', ctx: ['survival'] },
            { action: 'survTravel', label: 'Travel', tip: 'Open the map on vehicles and fast-travel routes.', ctx: ['survival'] },
            { action: 'survSkills', label: 'Skills & tech', tip: 'Spend Tech Points and Aether Runes on research and attributes.', ctx: ['survival'] },
            { action: 'survJournal', label: 'Journal', tip: 'See your objective, field challenges, activities and career record.', ctx: ['survival'] },
            { action: 'survLegend', label: 'Survival guide', tip: 'Open the searchable Survival encyclopedia.', ctx: ['survival'] },
            { action: 'survRide', label: 'Ride / dismount', tip: 'Mount your fastest vehicle (or the last one you rode), or get off. Hold Shift to cycle vehicles.', ctx: ['survival'] },
            { action: 'survCompanion', label: 'Companion orders', tip: 'Cycle your tamed beast or Vanguard companion between Follow & Fight, Heel / Stealth, and Guard Post.', ctx: ['survival'] },
            { action: 'survFlask', label: 'Quick heal / quick wheel', tip: 'Tap: use the best medical item you carry. Hold: open the quick wheel (eat, heal, drink, torch, campfire, quick-stack, repair, throw); flick the mouse toward a slice and release.', ctx: ['survival'] },
            { action: 'survCatalogue', label: 'Field Catalogue', tip: 'Open the Field Catalogue: discoveries, missing finds and set bonuses.', ctx: ['survival'] },
            { action: 'survBase', label: 'Base & territory', tip: 'Open the Base screen: power grid, territory, settlers, outposts, hauls, threat ladder and weather forecast.', ctx: ['survival'] },
            { action: 'survQuickStack', label: 'Quick-stack', tip: 'Deposit every item you already store into your base storage within 10 m (not while hunted).', ctx: ['survival'] },
            { action: 'survLight', label: 'Toggle light', tip: 'Light or put out a carried torch or lantern.', ctx: ['survival'] },
            { action: 'survPlate', label: 'Insert armor plate', tip: 'Slide a spare armor plate into your vest.', ctx: ['survival'] }
        ] },
        { group: 'hotbar', label: 'Survival hotbar', actions: Array.from({ length: 10 }, (_, i) => ({
            action: 'hotbar' + (i + 1), label: 'Hotbar slot ' + (i + 1), ctx: ['survival'],
            tip: 'Select hotbar slot ' + (i + 1) + '. The mouse wheel also cycles through all ten slots.'
        })) },
        { group: 'system', label: 'System', actions: [
            { action: 'pause', label: 'Pause', tip: 'Pause the match. ESC always works as well.', ctx: ALL_MODES }
        ] }
    ];
    const MOUSE_CONTROLS = [
        { label: 'Fire / punch / use held item', key: 'LMB', tip: 'Fire your weapon. In Survival: punch with bare hands, swing a held tool to gather, or use a held consumable.' },
        { label: 'Aim down sights / guard', key: 'RMB', tip: 'Aim your weapon. With bare hands in Survival, raise a guard and time it to parry.' },
        { label: 'Heavy punch', key: 'HOLD LMB', tip: 'Survival bare hands: hold and release for a heavy finisher.' },
        { label: 'Cycle weapons / hotbar', key: 'WHEEL', tip: 'Switch weapons. In Survival, scroll through the ten hotbar slots.' },
        { label: 'Scoreboard', key: 'TAB', tip: 'Hold to view the scoreboard (Multiplayer, Zombies, Tower Defense).' }
    ];

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
            if (s.showControlHints === undefined) s.showControlHints = true;
            if (s.contextualHud === undefined) s.contextualHud = true;
            if (s.nextUpHint === undefined) s.nextUpHint = true;
            if (!Number.isFinite(s.uiScale)) s.uiScale = 1;
            if (!s.colorBlindMode) s.colorBlindMode = 'none'; // 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
            if (s.subtitles === undefined) s.subtitles = true;
            if (s.reducedMotion === undefined) s.reducedMotion = false;
            this.applyAccessibility();
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
            if (!BO.Save.data.cheatSnapshots || typeof BO.Save.data.cheatSnapshots !== 'object') {
                BO.Save.data.cheatSnapshots = {};
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
            if (key === 'colorBlindMode' || key === 'reducedMotion' || key === 'uiScale') this.applyAccessibility();
            BO.Events.emit('settings:changed', { key, value, settings: BO.Save.data.settings });
        }

        applyAccessibility() {
            if (typeof document === 'undefined' || !document.body) return;
            const s = BO.Save?.data?.settings || {};
            document.body.classList.remove('cb-protanopia', 'cb-deuteranopia', 'cb-tritanopia', 'sv-reduced-motion');
            if (s.colorBlindMode && s.colorBlindMode !== 'none') document.body.classList.add('cb-' + s.colorBlindMode);
            if (s.reducedMotion) document.body.classList.add('sv-reduced-motion');
            // HUD and terminal scale (80–140%), read by css/gm.css through --ui-scale.
            const scale = Math.max(0.8, Math.min(1.4, Number(s.uiScale) || 1));
            document.documentElement.style.setProperty('--ui-scale', String(scale));
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

        resetKeybinds(actions = null) {
            this._ensureDefaults();
            if (Array.isArray(actions)) {
                for (const a of actions) if (DEFAULT_KEYBINDS[a]) BO.Save.data.settings.keybinds[a] = DEFAULT_KEYBINDS[a];
            } else {
                BO.Save.data.settings.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
            }
            BO.Save.save();
            BO.Events.emit('settings:changed', { key: 'keybinds', value: BO.Save.data.settings.keybinds });
        }

        get defaultKeybinds() { return DEFAULT_KEYBINDS; }
        get controlCatalog() { return CONTROL_CATALOG; }
        get mouseControls() { return MOUSE_CONTROLS; }

        /** Context list for an action ('all modes' when unknown). */
        actionContexts(action) {
            for (const g of CONTROL_CATALOG) {
                const found = g.actions.find((a) => a.action === action);
                if (found) return found.ctx;
            }
            return ALL_MODES;
        }

        /** Other actions bound to `code` whose contexts overlap `action`'s. */
        findConflicts(action, code) {
            const kb = this.getKeybinds();
            const mine = this.actionContexts(action);
            const out = [];
            for (const g of CONTROL_CATALOG) {
                for (const a of g.actions) {
                    if (a.action === action || kb[a.action] !== code) continue;
                    if (a.ctx.some((c) => mine.includes(c))) out.push(a);
                }
            }
            return out;
        }

        /** Readable key-cap text for a KeyboardEvent.code. */
        keyLabel(code) {
            if (!code || code === 'Unbound') return '—';
            const named = {
                Space: 'SPACE', Tab: 'TAB', Escape: 'ESC', Enter: 'ENTER', Backspace: 'BKSP', CapsLock: 'CAPS',
                ShiftLeft: 'L-SHIFT', ShiftRight: 'R-SHIFT', ControlLeft: 'L-CTRL', ControlRight: 'R-CTRL',
                AltLeft: 'L-ALT', AltRight: 'R-ALT', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
                Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
                Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Delete: 'DEL', Insert: 'INS',
                Home: 'HOME', End: 'END', PageUp: 'PGUP', PageDown: 'PGDN', MetaLeft: 'WIN'
            };
            if (named[code]) return named[code];
            return String(code).replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'NUM ').toUpperCase();
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
        constructor() {
            this._prevWeaponBeforeMegaman = null;
            this._prevPointsBeforeInfMoney = null;
            this._prevPerksBeforeCheat = null;
        }

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

        disableAll(includeModMenu = false) {
            BO.Settings._ensureDefaults();
            for (const c of Object.keys(CHEAT_DEFS)) {
                if (BO.Save.data.cheats[c]) {
                    BO.Save.data.cheats[c] = false;
                    this._applyImmediateEffects(c, false);
                }
            }
            if (includeModMenu && BO.Save.data.cheats.unlockedModMenu) {
                BO.Save.data.cheats.unlockedModMenu = false;
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
            if (code === 'cheats') return !!BO.Save.data.cheats.unlockedModMenu;
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
            const next = !!enabled;
            if (code === 'cheats') {
                BO.Save.data.cheats.unlockedModMenu = next;
            } else if (CHEAT_DEFS[code]) {
                const prev = !!BO.Save.data.cheats[code];
                if (next && code === 'unlock' && BO.Save.data.cheats.lock) {
                    BO.Save.data.cheats.lock = false;
                    delete BO.Save.data.cheatSnapshots.lock;
                } else if (next && code === 'lock' && BO.Save.data.cheats.unlock) {
                    BO.Save.data.cheats.unlock = false;
                    delete BO.Save.data.cheatSnapshots.unlock;
                } else if (next && code === 'maxlevel' && BO.Save.data.cheats.resetlevel) {
                    BO.Save.data.cheats.resetlevel = false;
                    delete BO.Save.data.cheatSnapshots.resetlevel;
                } else if (next && code === 'resetlevel' && BO.Save.data.cheats.maxlevel) {
                    BO.Save.data.cheats.maxlevel = false;
                    delete BO.Save.data.cheatSnapshots.maxlevel;
                }
                if (prev !== next) {
                    this._applyImmediateEffects(code, next);
                    BO.Save.data.cheats[code] = next;
                } else {
                    BO.Save.data.cheats[code] = next;
                    if (next) this._applyImmediateEffects(code, true);
                }
            }
            BO.Save.save();
            BO.Events.emit('cheats:changed', { code, enabled: next, state: BO.Save.data.cheats });
        }

        /**
         * Processes a typed cheat code string from the user.
         * Every cheat (including megaman, choose, unlock, lock, maxlevel, resetlevel, cheats)
         * cleanly toggles ON and OFF when entered again or toggled from Settings / Mod Menu.
         */
        enterCode(rawInput) {
            const clean = String(rawInput || '').trim().toLowerCase().replace(/\s+/g, '');
            if (!clean) return { ok: false, msg: 'Enter a valid cheat code.' };

            if (clean === 'cheats') {
                const next = !this.isModMenuUnlocked();
                this.setCheat('cheats', next);
                if (next) BO.Sound.playRankUp();
                else BO.Sound.playUIClick();
                return {
                    ok: true,
                    code: 'cheats',
                    enabled: next,
                    title: next ? 'MOD MENU UNLOCKED!' : 'MOD MENU LOCKED!',
                    desc: 'Unlocks the "Mod Menu" option in the Start & Pause menus to turn any cheat ON or OFF anytime with checkboxes!',
                    msg: next
                        ? 'MOD MENU [cheats] ENABLED! Check the Start Menu or Pause Menu for ★ MOD MENU (CHEATS).'
                        : 'MOD MENU [cheats] DISABLED!'
                };
            }

            if (CHEAT_DEFS[clean]) {
                const next = !this.isActive(clean, true);
                this.setCheat(clean, next);
                if (next) BO.Sound.playPerkBuy();
                else BO.Sound.playUIClick();
                if (clean === 'choose' && next && BO.Menus && BO.Menus.openChooseModal) {
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
            const P = BO.Progression;
            if (P && (code === 'unlock' || code === 'lock' || code === 'maxlevel' || code === 'resetlevel')) {
                const snaps = BO.Save.data.cheatSnapshots;
                if (enabled) {
                    if (!snaps[code]) snaps[code] = P.captureSnapshot();
                    if (code === 'unlock') P.unlockEverything();
                    else if (code === 'lock') P.lockEverything();
                    else if (code === 'maxlevel') P.setMaxLevel();
                    else if (code === 'resetlevel') P.resetAllLevels();
                } else {
                    if (snaps[code]) {
                        P.restoreSnapshot(snaps[code]);
                        delete snaps[code];
                    } else if (code === 'unlock') {
                        P.lockEverything();
                    } else if (code === 'maxlevel') {
                        P.resetAllLevels();
                    } else if (code === 'lock') {
                        P.unlockEverything();
                    }
                }
            }

            if (!this.isZombiesActive()) return;
            const Pl = BO.Player;
            const ZM = BO.ZombiesMode;
            if (code === 'infmoney' && ZM) {
                if (enabled) {
                    if (this._prevPointsBeforeInfMoney === null && ZM.points < 99999) {
                        this._prevPointsBeforeInfMoney = ZM.points;
                    }
                    ZM.points = Math.max(ZM.points, 99999);
                } else {
                    const fallbackPts = this._prevPointsBeforeInfMoney !== null ? this._prevPointsBeforeInfMoney : 500;
                    if (ZM.points >= 99999) ZM.points = fallbackPts;
                    this._prevPointsBeforeInfMoney = null;
                }
            }
            if (code === 'perks' && Pl) {
                if (enabled) {
                    if (this._prevPerksBeforeCheat === null) {
                        this._prevPerksBeforeCheat = Array.from(Pl.zombiePerks || []);
                    }
                    ['quick_revive', 'juggernog', 'speed_cola', 'double_tap', 'stamin_up', 'deadshot'].forEach((pk) => Pl.zombiePerks.add(pk));
                    Pl.applyPerkStats();
                } else {
                    Pl.zombiePerks = new Set(this._prevPerksBeforeCheat || []);
                    this._prevPerksBeforeCheat = null;
                    Pl.applyPerkStats();
                    Pl.hp = Math.min(Pl.hp, Pl.maxHp);
                }
            }
            if (code === 'infammo' && enabled && Pl) {
                Pl.refillAllAmmo();
                Pl.reloading = false;
            }
            if (code === 'megaman' && Pl) {
                if (enabled) {
                    const curW = Pl.weapons && Pl.weapons[Pl.activeSlot];
                    if (curW && curW.cfg && curW.cfg.id !== 'megaman_buster') {
                        this._prevWeaponBeforeMegaman = BO.Math.deepClone(curW.cfg);
                    }
                    Pl.giveWeapon('megaman_buster', false, false);
                    BO.Events.emit('hud:banner', {
                        title: 'MEGA BUSTER MK-X EQUIPPED!',
                        sub: 'SOLAR PLASMA ARM-CANNON ONLINE',
                        color: '#38bdf8'
                    });
                } else {
                    if (BO.Combat && BO.Combat.cancelCharge) BO.Combat.cancelCharge();
                    const prevListLen = Array.isArray(Pl.weapons) ? Pl.weapons.length : 0;
                    const hadBuster = Array.isArray(Pl.weapons) && Pl.weapons.some((w) => w && w.cfg && w.cfg.id === 'megaman_buster');
                    if (Array.isArray(Pl.weapons)) {
                        Pl.weapons = Pl.weapons.filter((w) => w && w.cfg && w.cfg.id !== 'megaman_buster');
                    } else {
                        Pl.weapons = [];
                    }
                    const fallbackCfg = this._prevWeaponBeforeMegaman
                        || BO.Loadout?.getClasses?.()?.[BO.Loadout.getSelectedClassIndex()]?.primary
                        || { id: 'm1911', camo: 'default', attachments: { optic: 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' } };
                    if (Pl.weapons.length === 0 || (hadBuster && Pl.weapons.length < prevListLen && !Pl.weapons.some((w) => w.cfg && w.cfg.id === fallbackCfg.id))) {
                        Pl.weapons.push(Pl._createWeaponInstance(BO.Math.deepClone(fallbackCfg), false));
                    }
                    this._prevWeaponBeforeMegaman = null;
                    Pl.activeSlot = Math.max(0, Math.min(Pl.activeSlot || 0, Pl.weapons.length - 1));
                    Pl.reloading = false;
                    Pl.swapTimer = 0;
                    Pl.rebuildViewmodel();
                    BO.Events.emit('hud:toast', { text: 'MEGA BUSTER MK-X DISABLED', color: '#94a3b8' });
                }
            }
            if (code === 'dance' && ZM) {
                if (enabled && ZM.triggerZombieDance) {
                    ZM.triggerZombieDance();
                } else if (!enabled) {
                    for (const z of ZM.zombies) {
                        if (z) z.danceTimer = 0;
                    }
                }
            }
            if ((code === 'fly' || code === 'noclip') && !enabled && Pl) {
                if (!this.isActive('fly', true) && !this.isActive('noclip', true)) {
                    Pl.vel.y = Math.min(0, Pl.vel.y);
                }
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
