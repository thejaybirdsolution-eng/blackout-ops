/* ============================================================================
   BLACKOUT OPS — Master Menu, 8-Tab Legend Encyclopedia, 7-Tab Settings,
   Zombies Mod Menu, Wonder-No-More Box Picker, Lobby, Barracks & Pause UI
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    function escAttr(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function formatKeyCode(code) {
        if (!code) return 'NONE';
        return String(code)
            .replace(/^Key/, '')
            .replace(/^Digit/, '')
            .replace('ShiftLeft', 'L-SHIFT')
            .replace('ShiftRight', 'R-SHIFT')
            .replace('ControlLeft', 'L-CTRL')
            .replace('ControlRight', 'R-CTRL')
            .replace('Space', 'SPACE')
            .toUpperCase();
    }

    const KEYBIND_LABELS = [
        { action: 'forward', label: 'Move Forward', tip: 'Walk or run forward.' },
        { action: 'back', label: 'Move Backward', tip: 'Step backward.' },
        { action: 'left', label: 'Strafe Left', tip: 'Move sideways to the left.' },
        { action: 'right', label: 'Strafe Right', tip: 'Move sideways to the right.' },
        { action: 'sprint', label: 'Sprint / Tactical Sprint', tip: 'Hold to run fast; double-tap to Tactical Sprint!' },
        { action: 'jump', label: 'Jump / Mantle / Double Jump', tip: 'Jump over obstacles, climb ledges, or double-jump with 2jump cheat.' },
        { action: 'crouch', label: 'Crouch / Tactical Slide', tip: 'Press while standing to crouch, or press while sprinting to slide!' },
        { action: 'reload', label: 'Reload Weapon', tip: 'Put a fresh magazine into your gun.' },
        { action: 'armory', label: 'Soda Catalog / Superpower Armory', tip: 'Browse beside a Zombies soda machine or open the armory in an offline bot match.' },
        { action: 'interact', label: 'Interact / Buy / Repair', tip: 'Buy doors, grab wall guns, drink Perks, spin Mystery Box, or Pack-a-Punch.' },
        { action: 'melee', label: 'Quick Melee / Swing Blade', tip: 'Slash nearby enemies with your melee weapon.' },
        { action: 'lethal', label: 'Throw Grenade / Lethal', tip: 'Throw Frag, Semtex, C4, or Molotov.' },
        { action: 'tactical', label: 'Use Tactical Item', tip: 'Use Flashbang, Concussion, Stim Shot, or Monkey Bomb.' },
        { action: 'special', label: 'Activate Special Power', tip: 'Trigger your Special Power (Ring of Fire, Aether Shroud, Frenzied Guard, Ammo Box).' },
        { action: 'ultimate', label: 'Unleash Ultimate Power', tip: 'Unleash your charged Ultimate super ability!' },
        { action: 'armor', label: 'Insert Armor Plate', tip: 'Slide a fresh armor plate into your vest (+50 Armor).' },
        { action: 'fireMode', label: 'Toggle Fire Mode / Detonate C4', tip: 'Switch between Full-Auto and Semi-Auto.' },
        { action: 'inspect', label: 'Inspect 3D Weapon', tip: 'Tilt and admire your custom 3D gun and camo in battle.' },
        { action: 'exfil', label: 'Call Helicopter Exfil', tip: 'Call an extraction chopper in Zombies from Round 10 onward.' },
        { action: 'pause', label: 'Pause Match', tip: 'Pause the game and open the Pause Menu (ESC also always works).' }
    ];

    class MenuController {
        constructor() {
            this.lobbyMode = 'zombies';
            this.selectedZMap = 'der_bunker';
            this.selectedZDifficulty = 'normal';
            this.classicStarter = false;
            this.selectedStartRound = 1;
            this.selectedMpMode = 'tdm';
            this.selectedMpMap = 'mp_nuketown';
            this.selectedDifficulty = 'regular';
            this.selectedTdMap = 'td_castle_1';
            this.tdConfig = {
                tdMode: 'standard',
                difficulty: 'medium',
                startingZombies: 10,
                mapSize: 1.0,
                wallHp: 250,
                gunZombiePct: 0,
                disabledEnemies: (BO.ZombieCustomizer && Array.isArray(BO.ZombieCustomizer.config.disabledEnemies))
                    ? BO.ZombieCustomizer.config.disabledEnemies.slice()
                    : [],
                modifiers: {
                    allBosses: false,
                    fastZombies: false,
                    allEnemiesUnlocked: false,
                    cost4x: false,
                    zombiesHeal: false,
                    magicalZombies: false,
                    explosiveDeath: false,
                    giantZombies: false,
                    tinyZombies: false,
                    vampiric: false,
                    bloodMoon: false,
                    lowGravity: false,
                    doubleGold: false,
                    headshotsOnly: false,
                    infiniteAmmo: false,
                    randomLoadoutWave: false,
                    glassCannon: false,
                    megaSplitters: false,
                    superJumpZombies: false,
                    vampirePlayer: false,
                    sniperHeaven: false,
                    meleeMayhem: false,
                    explosiveHeadshots: false,
                    fastReload: false,
                    hyperSpeedPlayer: false,
                    armoredHorde: false,
                    chaosSwarm: false,
                    noPerks: false,
                    freePerks: false,
                    richStart: false,
                    berserkerWave: false,
                    nightmareDarkness: false,
                    noRegen: false,
                    shieldedBosses: false,
                    halfZombieHp: false,
                    quarterZombieHp: false,
                    oneHitMeleeZombies: false,
                    noProjectiles: false,
                    noProjectilesUntil20: false
                },
                customValues: {
                    zombieHpMult: 1.0,
                    zombieSpeedMult: 1.0,
                    zombieDamageMult: 1.0,
                    playerMaxHp: 100,
                    startCurrency: 0,
                    bossSpawnPct: 2.0,
                    maxAliveZombies: 28,
                    spawnDelaySec: 0,
                    waveSizeMult: 1.0,
                    intermissionSec: 30,
                    priceMult: 1.0
                }
            };
            this.zModifiers = Object.assign({}, this.tdConfig.modifiers);
            this.zCustomValues = {
                zombieHpMult: 1.0,
                zombieSpeedMult: 1.0,
                zombieDamageMult: 1.0,
                playerMaxHp: 100,
                startCurrency: 0,
                bossSpawnPct: 2.0,
                maxAliveZombies: 24,
                spawnDelaySec: 0,
                waveSizeMult: 1.0,
                supplyDropPct: 50
            };
            this.customRules = {
                enemyCount: 6, teamSizeLimit: 6, enemyWeaponMode: 'all', playerWeaponMode: 'custom',
                scoreLimit: 0, timeLimit: 0, enemyHp: 100, playerHp: 100, respawnDelay: 2.4,
                headshotsOnly: false, oneShotKills: false, unlimitedAmmo: false, explosiveRounds: false,
                bigHeads: false, alwaysRadar: false, killstreaksEnabled: true,
                gravityScale: 1.0, speedScale: 1.0, jumpScale: 1.0, killcamEnabled: true,
                mods: {}, startProtocol: 'custom'
            };
            this.tdConfig.startProtocol = 'custom';
            this.zStartProtocol = 'custom';
            this.lobbySection = { zombies: 'map', mp: 'mode', td: 'castle' };
            this.modFilter = { cat: 'all', q: '', onlyActive: false };
            this.barracksTab = 'bestiary';
            this.settingsTab = 'controls';
            this.legendTab = 'zombies';
            this.boxPickerTab = 'all';
            this.isRebindingKey = false;
            this.rebindingAction = null;

            this.onStartMatch = null;
            this.onExitToMenu = null;
            this.onRestartMatch = null;
        }

        init(callbacks) {
            this.onStartMatch = callbacks.onStartMatch;
            this.onExitToMenu = callbacks.onExitToMenu;
            this.onRestartMatch = callbacks.onRestartMatch;

            this.screens = {
                main_menu: document.getElementById('screen-main-menu'),
                play_lobby: document.getElementById('screen-lobby'),
                gunsmith: document.getElementById('screen-gunsmith'),
                barracks: document.getElementById('screen-barracks'),
                aar: document.getElementById('screen-aar'),
                minigames: document.getElementById('screen-minigames')
            };
            this.modalSettings = document.getElementById('modal-settings');
            this.modalPause = document.getElementById('modal-pause');
            this.modalLegend = document.getElementById('modal-legend');
            this.modalModMenu = document.getElementById('modal-modmenu');
            this.modalBoxPicker = document.getElementById('modal-box-picker');
            this.modalChoose = document.getElementById('modal-choose');
            this.modalMpClass = document.getElementById('modal-mp-class');
            this.modalTdShop = document.getElementById('modal-td-shop');
            this.modalTdAttachments = document.getElementById('modal-td-attachments');
            this.modalTdCustomClass = document.getElementById('modal-td-custom-class');
            this.modalTdPerks = document.getElementById('modal-td-perks');
            this.modalTdLift = document.getElementById('modal-td-lift');
            this.modalZBuild = document.getElementById('modal-z-build');
            this.modalEnemyPool = document.getElementById('modal-enemy-pool');

            this._bindButtons();
            if (BO.UpdateLogUI) BO.UpdateLogUI.init();
            this.updateAllRankBadges();
            this.updateCheatMenuVisibility();

            BO.Events.on('save:updated', () => this.updateAllRankBadges());
            BO.Events.on('cheats:changed', () => this.updateCheatMenuVisibility());
            BO.Events.on('match:ended', (report) => this.showAAR(report));
            BO.Events.on('net:updated', () => {
                this._refreshNetUI();
            });
            BO.Events.on('net:chat', () => {
                this._refreshNetChatUI();
            });
            BO.Events.on('net:link_copied', (d) => {
                const btn = document.getElementById('btn-net-copy-link');
                if (btn) {
                    btn.textContent = '✓ LINK COPIED TO CLIPBOARD!';
                    btn.style.borderColor = '#22c55e';
                    btn.style.color = '#22c55e';
                }
                const pBtn = document.getElementById('btn-pause-invite');
                if (pBtn) {
                    pBtn.textContent = '✓ INVITE LINK COPIED! (' + (BO.Net ? BO.Net.roomCode : '') + ')';
                }
            });
        }

        _bindButtons() {
            const onlineBtn = document.getElementById('btn-menu-online');
            if (onlineBtn) {
                onlineBtn.onclick = () => {
                    BO.Sound.playUIClick();
                    if (BO.Net && !BO.Net.active) {
                        BO.Net.hostRoom();
                    }
                    this.showScreen('play_lobby');
                    setTimeout(() => {
                        if (BO.Net && BO.Net.active) BO.Net.copyInviteLink();
                    }, 120);
                };
            }
            const pauseInviteBtn = document.getElementById('btn-pause-invite');
            if (pauseInviteBtn) {
                pauseInviteBtn.onclick = () => {
                    BO.Sound.playUIClick();
                    if (BO.Net) BO.Net.copyInviteLink();
                };
            }
            document.getElementById('btn-menu-zombies').onclick = () => { BO.Sound.playUIClick(); this.lobbyMode = 'zombies'; this.showScreen('play_lobby'); };
            document.getElementById('btn-menu-survival').onclick = () => {
                if (BO.Net?.active) {
                    BO.Events.emit('hud:toast', { text: 'Survival is solo. Leave the online lobby to deploy.', color: '#a6ddd0' });
                    return;
                }
                BO.Sound.playUIClick();
                BO.SurvivalUI.show('briefing', this.onStartMatch);
            };
            document.getElementById('btn-menu-mp').onclick = () => { BO.Sound.playUIClick(); this.lobbyMode = 'mp'; this.showScreen('play_lobby'); };
            const rpgBtn = document.getElementById('btn-menu-rpg');
            if (rpgBtn) rpgBtn.onclick = () => { BO.Sound.playUIClick(); if (BO.RPGUI) BO.RPGUI.openHaven(); };
            const owBtn = document.getElementById('btn-menu-owrpg');
            if (owBtn) owBtn.onclick = () => {
                if (BO.Net?.active) { BO.Events.emit('hud:toast', { text: 'Open World RPG is solo. Leave the online lobby to deploy.', color: '#f5a623' }); return; }
                BO.Sound.playUIClick();
                if (BO.OWRPGUI) BO.OWRPGUI.openSlots();
            };
            const tdBtn = document.getElementById('btn-menu-td');
            if (tdBtn) tdBtn.onclick = () => { BO.Sound.playUIClick(); this.lobbyMode = 'td'; this.showScreen('play_lobby'); };
            const mgBtn = document.getElementById('btn-menu-minigames');
            if (mgBtn) mgBtn.onclick = () => { BO.Sound.playUIClick(); this.showScreen('minigames'); };
            document.getElementById('btn-menu-gunsmith').onclick = () => { BO.Sound.playUIClick(); this.showScreen('gunsmith'); };
            document.getElementById('btn-menu-barracks').onclick = () => { BO.Sound.playUIClick(); this.showScreen('barracks'); };
            document.getElementById('btn-menu-legend').onclick = () => { BO.Sound.playUIClick(); this.openLegend(); };
            document.getElementById('btn-menu-settings').onclick = () => { BO.Sound.playUIClick(); this.openSettings('controls'); };
            const updatesBtn = document.getElementById('btn-menu-updates');
            if (updatesBtn) updatesBtn.onclick = () => { BO.Sound.playUIClick(); if (BO.UpdateLogUI) BO.UpdateLogUI.open(); };
            const allUpdatesBtn = document.getElementById('btn-open-all-updates');
            if (allUpdatesBtn) allUpdatesBtn.onclick = () => { BO.Sound.playUIClick(); if (BO.UpdateLogUI) BO.UpdateLogUI.open(); };
            document.getElementById('btn-menu-modmenu').onclick = () => { BO.Sound.playUIClick(); this.openModMenu(); };

            const menuRoundInput = document.getElementById('menu-round-input');
            const btnMenuGoRound = document.getElementById('btn-menu-go-round');
            if (btnMenuGoRound && menuRoundInput) {
                btnMenuGoRound.onclick = () => {
                    BO.Sound.playUIClick();
                    const r = Math.max(1, Math.min(999, parseInt(menuRoundInput.value, 10) || 1));
                    this.selectedStartRound = r;
                    if (this.onStartMatch) {
                        this.onStartMatch({
                            mode: 'zombies',
                            mapId: this.selectedZMap,
                            useClassicStarter: this.classicStarter,
                            startRound: r
                        });
                    }
                };
            }

            // ESC everywhere outside gameplay: close the top-most open window, or go Back from a sub-screen.
            // (main.js only handles keys while playing, so menus had no Escape at all.)
            const ESC_CLOSE = [
                ['modal-enemy-pool', 'btn-ep-close'], ['modal-updates', 'btn-updates-close'], ['modal-legend', 'btn-legend-close'], ['modal-modmenu', 'btn-modmenu-close'],
                ['modal-choose', 'btn-choose-close'], ['modal-box-picker', 'btn-box-picker-close'], ['modal-td-attachments', 'btn-td-att-close'],
                ['modal-td-custom-class', 'btn-td-cc-close'], ['modal-td-perks', 'btn-td-perks-close'], ['modal-td-lift', 'btn-td-lift-close'],
                ['modal-td-shop', 'btn-td-shop-close'], ['modal-z-build', 'btn-z-build-close'], ['modal-mp-class', 'btn-mp-class-close'],
                ['modal-settings', 'btn-settings-close']
            ];
            window.addEventListener('keydown', (e) => {
                if (e.code !== 'Escape' || this.isRebindingKey || e.repeat) return;
                if (BO.ControlsPanel?.isOpen || BO.SurvivalUI?.open || document.querySelector('#enemy-lab[open]')) return; // they handle their own Escape
                const t = e.target;
                if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') && t.value) return; // let Esc clear a search box first
                for (const [modal, close] of ESC_CLOSE) {
                    const el = document.getElementById(modal);
                    if (el && !el.classList.contains('hidden')) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        document.getElementById(close)?.click();
                        return;
                    }
                }
                if (BO.State.screen !== 'playing' && BO.State.screen !== 'main_menu') {
                    const scr = this.screens?.[BO.State.screen];
                    const back = scr?.querySelector('.js-back-menu');
                    if (back) { e.preventDefault(); back.click(); }
                }
            }, true);

            document.querySelectorAll('.js-back-menu').forEach((b) => {
                b.setAttribute('data-tip-title', 'Back to Main Menu');
                b.setAttribute('data-tip', 'Return to the main title screen.');
                b.onclick = () => { BO.Sound.playUIClick(); this.showScreen('main_menu'); };
            });

            document.getElementById('btn-edit-callsign').onclick = () => {
                const cur = BO.Save.data.callsign || 'SPECTRE-01';
                const next = window.prompt('Enter Operator Callsign (max 16 chars):', cur);
                if (next !== null && next.trim()) {
                    BO.Save.data.callsign = next.trim().slice(0, 16).toUpperCase();
                    BO.Save.save();
                    this.updateAllRankBadges();
                }
            };

            // Pause modal buttons
            document.getElementById('btn-pause-resume').onclick = () => {
                BO.Sound.playUIClick();
                this.setPauseOpen(false);
                if (BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
            };
            const btnPauseCls = document.getElementById('btn-pause-change-class');
            if (btnPauseCls) {
                btnPauseCls.onclick = () => {
                    BO.Sound.playUIClick();
                    this.setPauseOpen(false);
                    this.openChangeClassModal();
                };
            }
            const btnMpClsClose = document.getElementById('btn-mp-class-close');
            if (btnMpClsClose) {
                btnMpClsClose.onclick = () => {
                    BO.Sound.playUIClick();
                    if (this.modalMpClass) this.modalMpClass.classList.add('hidden');
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            }
            const btnTdClose = document.getElementById('btn-td-shop-close');
            if (btnTdClose) {
                btnTdClose.onclick = () => {
                    BO.Sound.playUIClick();
                    if (this.modalTdShop) this.modalTdShop.classList.add('hidden');
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            }
            const btnTdAttClose = document.getElementById('btn-td-att-close');
            if (btnTdAttClose) {
                btnTdAttClose.onclick = () => {
                    BO.Sound.playUIClick();
                    if (this.modalTdAttachments) this.modalTdAttachments.classList.add('hidden');
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            }
            const btnTdCcClose = document.getElementById('btn-td-cc-close');
            if (btnTdCcClose) {
                btnTdCcClose.onclick = () => {
                    BO.Sound.playUIClick();
                    if (this.modalTdCustomClass) this.modalTdCustomClass.classList.add('hidden');
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            }
            const btnTdPerksClose = document.getElementById('btn-td-perks-close');
            if (btnTdPerksClose) {
                btnTdPerksClose.onclick = () => {
                    BO.Sound.playUIClick();
                    if (this.modalTdPerks) this.modalTdPerks.classList.add('hidden');
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            }
            const btnTdLiftClose = document.getElementById('btn-td-lift-close');
            if (btnTdLiftClose) {
                btnTdLiftClose.onclick = () => {
                    BO.Sound.playUIClick();
                    if (this.modalTdLift) this.modalTdLift.classList.add('hidden');
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            }
            const btnZBuildClose = document.getElementById('btn-z-build-close');
            if (btnZBuildClose) {
                btnZBuildClose.onclick = () => {
                    BO.Sound.playUIClick();
                    if (this.modalZBuild) this.modalZBuild.classList.add('hidden');
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            }
            const btnEpAllOn = document.getElementById('btn-ep-all-on');
            if (btnEpAllOn) {
                btnEpAllOn.onclick = () => {
                    BO.Sound.playUIClick();
                    this._setDisabledEnemies([]);
                    this.renderEnemyPool();
                };
            }
            const btnEpAllOff = document.getElementById('btn-ep-all-off');
            if (btnEpAllOff) {
                btnEpAllOff.onclick = () => {
                    BO.Sound.playUIClick();
                    const allIds = BO.ZombiesData.ORDERED_PROGRESSION.map((z) => z.id)
                        .concat(BO.ZombiesData.ORDERED_BOSSES.map((b) => b.id));
                    // Keep at least 1 enemy enabled so spawns never stall
                    this._setDisabledEnemies(allIds.slice(1));
                    this.renderEnemyPool();
                };
            }
            const btnEpResetAll = document.getElementById('btn-ep-reset-all');
            if (btnEpResetAll) {
                btnEpResetAll.onclick = () => {
                    BO.Sound.playUIClick();
                    if (!confirm('Reset all zombie stats, start rounds, spawn % and disabled enemies back to defaults?')) return;
                    if (BO.ZombieCustomizer) BO.ZombieCustomizer.resetAll();
                    this._setDisabledEnemies([]);
                    this.renderEnemyPool();
                };
            }
            const btnEpClose = document.getElementById('btn-ep-close');
            if (btnEpClose) {
                btnEpClose.onclick = () => {
                    BO.Sound.playUIClick();
                    this.closeEnemyPoolModal();
                };
            }
            const epSearch = document.getElementById('ep-search');
            if (epSearch) {
                epSearch.oninput = (e) => {
                    this._epSearchQuery = (e.target.value || '').trim().toLowerCase();
                    this.renderEnemyPool();
                };
            }
            const epPresetSel = document.getElementById('ep-preset-select');
            if (epPresetSel) {
                epPresetSel.onchange = (e) => {
                    BO.Sound.playUIClick();
                    const val = e.target.value;
                    if (!BO.ZombieCustomizer || !val) return;
                    if (BO.ZombieCustomizer.loadPreset(val)) {
                        this._syncDisabledFromCustomizer();
                        const nameInp = document.getElementById('ep-preset-name');
                        if (nameInp) nameInp.value = val === '__default__' ? '' : val;
                        this.renderEnemyPool();
                    }
                };
            }
            const btnEpSavePreset = document.getElementById('btn-ep-save-preset');
            if (btnEpSavePreset) {
                btnEpSavePreset.onclick = () => {
                    BO.Sound.playUIClick();
                    if (!BO.ZombieCustomizer) return;
                    const nameInp = document.getElementById('ep-preset-name');
                    const sel = document.getElementById('ep-preset-select');
                    const typed = (nameInp && nameInp.value.trim()) || (sel && sel.value !== '__default__' ? sel.value : '');
                    const name = typed || prompt('Enter a name for this zombie setup:', BO.ZombieCustomizer.config.activePresetName || 'My Setup');
                    if (!name || !name.trim()) return;
                    BO.ZombieCustomizer.savePreset(name.trim());
                    if (nameInp) nameInp.value = name.trim();
                    this.renderEnemyPool();
                    BO.Events.emit('hud:toast', { text: `Saved zombie setup: ${name.trim()}`, color: '#4ade80' });
                };
            }
            const btnEpDelPreset = document.getElementById('btn-ep-del-preset');
            if (btnEpDelPreset) {
                btnEpDelPreset.onclick = () => {
                    BO.Sound.playUIClick();
                    if (!BO.ZombieCustomizer) return;
                    const sel = document.getElementById('ep-preset-select');
                    const name = sel && sel.value;
                    if (!name || name === '__default__') return;
                    if (!confirm(`Delete saved zombie setup "${name}"?`)) return;
                    BO.ZombieCustomizer.deletePreset(name);
                    const nameInp = document.getElementById('ep-preset-name');
                    if (nameInp && nameInp.value.trim() === name) nameInp.value = '';
                    this.renderEnemyPool();
                };
            }
            const btnEpExport = document.getElementById('btn-ep-export');
            if (btnEpExport) {
                btnEpExport.onclick = () => {
                    BO.Sound.playUIClick();
                    if (!BO.ZombieCustomizer) return;
                    const json = BO.ZombieCustomizer.exportJSON();
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(json).then(
                            () => BO.Events.emit('hud:toast', { text: 'Zombie setup JSON copied to clipboard!', color: '#38bdf8' }),
                            () => prompt('Copy your zombie setup JSON:', json)
                        );
                    } else {
                        prompt('Copy your zombie setup JSON:', json);
                    }
                };
            }
            const btnEpImport = document.getElementById('btn-ep-import');
            if (btnEpImport) {
                btnEpImport.onclick = () => {
                    BO.Sound.playUIClick();
                    if (!BO.ZombieCustomizer) return;
                    const raw = prompt('Paste exported zombie setup JSON:');
                    if (!raw || !raw.trim()) return;
                    try {
                        BO.ZombieCustomizer.importJSON(raw.trim());
                        this._syncDisabledFromCustomizer();
                        this.renderEnemyPool();
                        BO.Events.emit('hud:toast', { text: 'Imported zombie setup!', color: '#4ade80' });
                    } catch (err) {
                        alert('Could not import zombie setup JSON: ' + err.message);
                    }
                };
            }

            // Legend live search & backdrop click-to-close across compact modals
            const legSearch = document.getElementById('legend-search-input');
            const legClear = document.getElementById('legend-search-clear');
            if (legSearch) {
                legSearch.addEventListener('input', () => {
                    this.legendQuery = legSearch.value || '';
                    if (legClear) legClear.classList.toggle('hidden', !this.legendQuery);
                    this.renderLegend(true);
                });
            }
            if (legClear && legSearch) {
                legClear.onclick = () => {
                    legSearch.value = '';
                    this.legendQuery = '';
                    legClear.classList.add('hidden');
                    this.renderLegend(true);
                    legSearch.focus();
                };
            }
            document.querySelectorAll('.ui-modal').forEach((modal) => {
                if (modal.id === 'modal-pause' || modal.id === 'scoreboard-overlay') return;
                modal.addEventListener('mousedown', (ev) => {
                    if (ev.target !== modal) return;
                    BO.Sound.playUIClick();
                    modal.classList.add('hidden');
                    if (modal.id === 'modal-enemy-pool') this.renderLobby();
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) {
                        BO.App._safePointerLock();
                    }
                });
            });
            const btnTdSkip = document.getElementById('btn-td-skip-wait');
            if (btnTdSkip) {
                btnTdSkip.onclick = () => {
                    if (this.modalTdShop) this.modalTdShop.classList.add('hidden');
                    if (BO.TowerDefenseMode) BO.TowerDefenseMode.skipIntermission();
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            }
            document.getElementById('btn-pause-modmenu').onclick = () => { BO.Sound.playUIClick(); this.openModMenu(); };
            document.getElementById('btn-pause-legend').onclick = () => {
                BO.Sound.playUIClick();
                this.openLegend(BO.State.activeMode === 'minigame' ? 'minigames' : BO.State.activeMode);
            };
            document.getElementById('btn-pause-settings').onclick = () => { BO.Sound.playUIClick(); this.openSettings('controls'); };
            const btnPauseControls = document.getElementById('btn-pause-controls');
            if (btnPauseControls) btnPauseControls.onclick = () => { BO.Sound.playUIClick(); BO.ControlsPanel.open(); };
            // Survival: leaving or restarting used to drop everything since the last save without a word.
            // Save automatically when it is safe; otherwise ask, saying how much would be lost.
            const survivalLeave = (verb) => {
                const SM = BO.SurvivalMode;
                if (BO.State.activeMode !== 'survival' || !SM?.active || !SM.campaign) return true;
                const c = SM.campaign;
                if (verb === 'exit' && c.canSave?.() && c.save(true)) { SM.toast?.('Progress saved.'); return true; }
                const cp = BO.SurvivalCareer?.checkpoint;
                const ago = cp ? Math.max(0, Math.round(SM.clock - cp.clock)) : null;
                if (ago != null && ago < 15) return true; // nothing meaningful to lose
                const lost = ago == null ? 'This run has never been saved' : 'Your last save was ' + (ago >= 60 ? Math.floor(ago / 60) + ' min ' : '') + (ago % 60) + ' s of play ago';
                const why = verb === 'exit' ? ' and enemies are too close to save now' : '';
                return window.confirm(lost + why + '. ' + (verb === 'exit' ? 'Quit to the main menu' : 'Restart this run') + ' and lose the progress since then?');
            };
            document.getElementById('btn-pause-restart').onclick = () => { BO.Sound.playUIClick(); if (!survivalLeave('restart')) return; this.setPauseOpen(false); if (this.onRestartMatch) this.onRestartMatch(); };
            // RPG: leaving suspends the delve at the start of the current floor (resume from the Haven).
            const rpgLeave = () => {
                const RM = BO.RPGMode;
                if (BO.State.activeMode !== 'rpg' || !RM?.active || !RM.run || RM.state === 'ended') return true;
                return window.confirm(`Leave the delve? It is suspended at the start of floor ${RM.run.floor} — resume it from the Haven. Anything picked up on this floor is lost.`);
            };
            document.getElementById('btn-pause-quit').onclick = () => { BO.Sound.playUIClick(); if (!survivalLeave('exit') || !rpgLeave()) return; this.setPauseOpen(false); if (this.onExitToMenu) this.onExitToMenu(); };

            const pauseRoundInput = document.getElementById('pause-round-input');
            const btnPauseJump = document.getElementById('btn-pause-jump-round');
            if (btnPauseJump && pauseRoundInput) {
                btnPauseJump.onclick = () => {
                    BO.Sound.playUIClick();
                    const r = Math.max(1, Math.min(999, parseInt(pauseRoundInput.value, 10) || 1));
                    this.selectedStartRound = r;
                    if (BO.State.activeMode === 'zombies' && BO.ZombiesMode.active) {
                        BO.ZombiesMode.jumpToRound(r);
                        this.setPauseOpen(false);
                        if (BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                    }
                };
            }
            document.querySelectorAll('.js-quick-round').forEach((btn) => {
                btn.onclick = () => {
                    BO.Sound.playUIClick();
                    const r = parseInt(btn.dataset.rnd, 10) || 1;
                    if (pauseRoundInput) pauseRoundInput.value = String(r);
                    this.selectedStartRound = r;
                    if (BO.State.activeMode === 'zombies' && BO.ZombiesMode.active) {
                        BO.ZombiesMode.jumpToRound(r);
                        this.setPauseOpen(false);
                        if (BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                    }
                };
            });

            // Modal Close buttons
            document.getElementById('btn-settings-close').onclick = () => {
                BO.Sound.playUIClick();
                BO.ControlsPanel?.stopListening();
                this.isRebindingKey = false;
                this.modalSettings.classList.add('hidden');
            };
            document.getElementById('btn-legend-close').onclick = () => {
                BO.Sound.playUIClick();
                this.modalLegend.classList.add('hidden');
            };
            document.getElementById('btn-modmenu-close').onclick = () => {
                BO.Sound.playUIClick();
                this.modalModMenu.classList.add('hidden');
            };
            document.getElementById('btn-box-picker-close').onclick = () => {
                BO.Sound.playUIClick();
                this.modalBoxPicker.classList.add('hidden');
                if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) {
                    BO.App._safePointerLock();
                }
            };
            const btnChooseClose = document.getElementById('btn-choose-close');
            if (btnChooseClose) {
                btnChooseClose.onclick = () => {
                    BO.Sound.playUIClick();
                    if (this.modalChoose) this.modalChoose.classList.add('hidden');
                };
            }

            document.getElementById('btn-aar-replay').onclick = () => { BO.Sound.playUIClick(); if (this.onRestartMatch) this.onRestartMatch(); };
            document.getElementById('btn-aar-lobby').onclick = () => { BO.Sound.playUIClick(); if (this.onExitToMenu) this.onExitToMenu(); };
        }

        updateCheatMenuVisibility() {
            const modUnlocked = BO.Cheats && BO.Cheats.isModMenuUnlocked();
            const roundsUnlocked = modUnlocked || (BO.Cheats && BO.Cheats.isActive('rounds', true));

            const btnMenuMod = document.getElementById('btn-menu-modmenu');
            const btnPauseMod = document.getElementById('btn-pause-modmenu');
            const menuRoundWrap = document.getElementById('menu-round-picker-wrap');
            const pauseRoundWrap = document.getElementById('pause-round-picker-wrap');

            if (btnMenuMod) btnMenuMod.classList.toggle('hidden', !modUnlocked);
            if (btnPauseMod) btnPauseMod.classList.toggle('hidden', !modUnlocked);
            if (menuRoundWrap) menuRoundWrap.classList.toggle('hidden', !roundsUnlocked);
            if (pauseRoundWrap) {
                const showInPause = roundsUnlocked && (!BO.State.activeMode || BO.State.activeMode === 'zombies');
                pauseRoundWrap.classList.toggle('hidden', !showInPause);
            }
        }

        showScreen(name) {
            BO.State.screen = name;
            if (BO.Tooltips) BO.Tooltips.hide();
            Object.entries(this.screens).forEach(([k, el]) => {
                if (el) el.classList.toggle('hidden', k !== name);
            });
            BO.HUD.setVisible(name === 'playing');
            this.updateCheatMenuVisibility();
            if (BO.RPGUI && BO.RPGUI.haven) BO.RPGUI.onScreenChanged(name);

            if (name === 'main_menu') {
                BO.Sound.startMusic('menu');
                const cls = BO.Loadout.getActiveClass();
                document.getElementById('menu-showcase-name').textContent = `${cls.name} — ${BO.WeaponsData.get(cls.primary.id).name}`;
                if (BO.GunsmithUI.onRebuildShowcase) BO.GunsmithUI.onRebuildShowcase(cls.primary);
            } else if (name === 'play_lobby') {
                this.renderLobby();
            } else if (name === 'gunsmith') {
                BO.GunsmithUI.open();
            } else if (name === 'barracks') {
                this.renderBarracks();
            } else if (name === 'minigames') {
                BO.Sound.startMusic('menu');
                if (BO.MinigameHub) BO.MinigameHub.render();
            }
        }

        setPauseOpen(open) {
            BO.State.paused = open;
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            this.updateCheatMenuVisibility();
            const btnDev = document.getElementById('btn-pause-dev');
            if (btnDev) {
                const dev = BO.GM?.active ? BO.GM.get('dev') : null;
                btnDev.classList.toggle('hidden', !open || !dev?.active);
                btnDev.onclick = () => { this.setPauseOpen(false); dev?.toggle(true); };
            }
            const btnCls = document.getElementById('btn-pause-change-class');
            if (btnCls) btnCls.classList.toggle('hidden', !open || BO.State.activeMode !== 'mp');
            // RPG delves restart from the Haven, so the pause-menu restart is hidden there.
            const btnRestart = document.getElementById('btn-pause-restart');
            if (btnRestart) btnRestart.classList.toggle('hidden', BO.State.activeMode === 'rpg');
            const btnQuit = document.getElementById('btn-pause-quit');
            if (btnQuit) {
                if (!btnQuit.dataset.baseLabel) btnQuit.dataset.baseLabel = btnQuit.textContent;
                btnQuit.textContent = BO.State.activeMode === 'rpg' ? 'SUSPEND DELVE → HAVEN' : btnQuit.dataset.baseLabel;
            }
            if (this.modalPause) this.modalPause.classList.toggle('hidden', !open);
            if (!open && BO.ControlsPanel?.isOpen) BO.ControlsPanel.close();
            if (open && this.modalTdShop) this.modalTdShop.classList.add('hidden');
            if (open && this.modalTdAttachments) this.modalTdAttachments.classList.add('hidden');
            if (open && this.modalMpClass) this.modalMpClass.classList.add('hidden');
            if (!open && this.modalBoxPicker) this.modalBoxPicker.classList.add('hidden');
            if (open && document.pointerLockElement) document.exitPointerLock();
        }

        updateAllRankBadges() {
            const info = BO.Progression.getRankInfo();
            const callsign = BO.Save.data.callsign || 'SPECTRE-01';
            const hasHat = !!(BO.Save.data.unlockables && BO.Save.data.unlockables.topHatEquipped);
            document.querySelectorAll('.js-rank-pill').forEach((el) => {
                el.innerHTML = `
                    <div class="rank-emblem" style="color:${info.prestigeInfo.color};border-color:${info.prestigeInfo.color}">${hasHat ? '🎩' : info.prestigeInfo.icon}</div>
                    <div class="rank-meta">
                        <div class="callsign">${callsign} ${hasHat ? '<span style="color:#fde047;font-size:11px;">[TOP HAT]</span>' : ''}</div>
                        <div class="rank-sub">LV ${info.level} • ${info.rankName.toUpperCase()} ${info.prestige > 0 ? `(P${info.prestige})` : ''}</div>
                        <div class="xp-track"><div class="xp-fill" style="width:${Math.round(info.levelProgress * 100)}%"></div></div>
                    </div>
                `;
            });
        }

        /* ====================================================================
           DEPLOYMENT LOBBY
        ==================================================================== */
        /* ====================================================================
           DEPLOYMENT LOBBY — step-by-step setup (left) + live summary (right)
        ==================================================================== */
        _lobbySections(mode) {
            if (mode === 'zombies') return [
                { id: 'map', label: 'Map', icon: '🗺' },
                { id: 'difficulty', label: 'Difficulty', icon: '⚙' },
                { id: 'loadout', label: 'Starting Weapons', icon: '🔫' },
                { id: 'enemies', label: 'Enemies & Values', icon: '🧟' },
                { id: 'modifiers', label: 'Modifiers', icon: '🧪' }
            ];
            if (mode === 'mp') return [
                { id: 'mode', label: 'Mode & Map', icon: '🗺' },
                { id: 'bots', label: 'Bots', icon: '🤖' },
                { id: 'rules', label: 'Match Rules', icon: '📜' },
                { id: 'loadout', label: 'Starting Weapons', icon: '🔫' },
                { id: 'modifiers', label: 'Modifiers', icon: '🧪' }
            ];
            return [
                { id: 'castle', label: 'Castle', icon: '🏰' },
                { id: 'difficulty', label: 'Mode & Difficulty', icon: '⚙' },
                { id: 'battlefield', label: 'Battlefield', icon: '📐' },
                { id: 'loadout', label: 'Starting Weapons', icon: '🔫' },
                { id: 'enemies', label: 'Enemy Pool', icon: '🧟' },
                { id: 'modifiers', label: 'Modifiers', icon: '🧪' }
            ];
        }

        _lobbyMods(mode) {
            if (mode === 'zombies') return this.zModifiers;
            if (mode === 'td') return this.tdConfig.modifiers;
            if (!this.customRules.mods) this.customRules.mods = {};
            return this.customRules.mods;
        }

        _lobbyProtocol(mode) {
            if (mode === 'zombies') return this.zStartProtocol || (this.classicStarter ? 'classic' : 'custom');
            if (mode === 'td') return this.tdConfig.startProtocol || 'custom';
            return this.customRules.startProtocol || 'custom';
        }

        _setLobbyProtocol(mode, id) {
            if (mode === 'zombies') { this.zStartProtocol = id; this.classicStarter = id === 'classic'; }
            else if (mode === 'td') this.tdConfig.startProtocol = id;
            else this.customRules.startProtocol = id;
        }

        _lobbyBroadcast() {
            if (BO.Net && BO.Net.active && BO.Net.isHost) BO.Net.broadcastLobbySettings();
        }

        _section(title, sub, inner) {
            return `
                <section class="lobby-section">
                    <header class="lobby-section-head">
                        <h3>${title}</h3>
                        ${sub ? `<p>${sub}</p>` : ''}
                    </header>
                    ${inner}
                </section>`;
        }

        _valueGrid(fields, values, cls, dataKey) {
            return `
                <div class="value-grid">
                    ${fields.map((f) => `
                        <label class="value-field" data-tip-title="${escAttr(f.lbl)}" data-tip="${escAttr(f.tip || `Exact value. Range ${f.min} – ${f.max}.`)}">
                            <span>${f.lbl}</span>
                            <input type="number" class="${cls}" data-${dataKey}="${f.k}" step="${f.step}" min="${f.min}" max="${f.max}" value="${values[f.k] ?? f.def ?? 1}">
                        </label>`).join('')}
                </div>`;
        }

        _protocolHtml(mode) {
            const cur = this._lobbyProtocol(mode);
            const mpNote = mode === 'mp' && this.customRules.playerWeaponMode && this.customRules.playerWeaponMode !== 'custom'
                ? `<div class="lobby-note">⚠ The Match Rules "Player Weapon Rule" is set to <b>${escAttr(this.customRules.playerWeaponMode.toUpperCase())}</b>, which overrides this choice. Set it back to "My Custom Class" to use a protocol.</div>`
                : '';
            return `${mpNote}
                <div class="protocol-grid">
                    ${BO.Mods.PROTOCOLS.map((p) => `
                        <button class="protocol-card ${cur === p.id ? 'active' : ''}" data-proto="${p.id}" data-tip-title="${escAttr(p.name)}" data-tip="${escAttr(p.desc)}">
                            <span class="protocol-ico">${p.icon}</span>
                            <span class="protocol-name">${escAttr(p.name)}</span>
                            <span class="protocol-desc">${escAttr(p.desc)}</span>
                        </button>`).join('')}
                </div>`;
        }

        _bindProtocol(body, mode) {
            body.querySelectorAll('[data-proto]').forEach((b) => {
                b.onclick = () => {
                    BO.Sound.playUIClick();
                    this._setLobbyProtocol(mode, b.dataset.proto);
                    body.querySelectorAll('[data-proto]').forEach((x) => x.classList.toggle('active', x === b));
                    this._lobbyBroadcast();
                    this._renderLobbySummary();
                };
            });
        }

        _modifiersHtml(mode) {
            if (BO.ModifierMenuUI) {
                return BO.ModifierMenuUI.renderHtml({ mode, active: this._lobbyMods(mode) });
            }
            return '';
        }

        _bindModifiers(body, mode) {
            if (!BO.ModifierMenuUI) return;
            BO.ModifierMenuUI.bindContainer(body, {
                mode,
                getActive: () => this._lobbyMods(mode),
                onChange: (nextObj) => {
                    BO.Sound.playUIClick();
                    const mods = this._lobbyMods(mode);
                    Object.keys(mods).forEach((k) => delete mods[k]);
                    Object.assign(mods, nextObj);
                    const n = BO.Mods.countActive(mods, mode);
                    const badge = document.getElementById('lobby-mod-badge');
                    if (badge) { badge.textContent = n; badge.classList.toggle('hidden', n === 0); }
                    this._renderLobbySummary();
                    this._lobbyBroadcast();
                }
            });
        }

        renderLobby() {
            const left = document.getElementById('lobby-left');
            const mode = this.lobbyMode; // 'zombies' | 'mp' | 'td'
            const roundsUnlocked = !!(BO.Cheats && (BO.Cheats.isModMenuUnlocked() || BO.Cheats.isActive('rounds', true)));
            if (!this.lobbySection) this.lobbySection = { zombies: 'map', mp: 'mode', td: 'castle' };
            if (!this.modFilter) this.modFilter = { cat: 'all', q: '', onlyActive: false };
            if (!this.customRules.mods) this.customRules.mods = {};

            const tabs = [
                { id: 'zombies', label: 'ZOMBIES', sub: 'Survive the rounds', cls: 'z' },
                { id: 'mp', label: 'MULTIPLAYER', sub: 'Bots & friends', cls: 'mp' },
                { id: 'td', label: 'TOWER DEFENSE', sub: 'Hold the castle', cls: 'td' }
            ];
            document.getElementById('lobby-mode-tabs').innerHTML = tabs.map((t) => `
                <button class="mode-tab mode-tab-${t.cls} ${mode === t.id ? 'active' : ''}" data-lmode="${t.id}">
                    <b>${t.label}</b><small>${t.sub}</small>
                </button>`).join('');
            document.querySelectorAll('[data-lmode]').forEach((b) => {
                b.onclick = () => { BO.Sound.playUIClick(); this.lobbyMode = b.dataset.lmode; this.renderLobby(); };
            });

            const sections = this._lobbySections(mode);
            let sec = this.lobbySection[mode];
            if (!sections.find((s) => s.id === sec)) { sec = sections[0].id; this.lobbySection[mode] = sec; }
            const idx = sections.findIndex((s) => s.id === sec);
            const modCount = BO.Mods.countActive(this._lobbyMods(mode), mode);

            left.innerHTML = `
                <nav class="lobby-steps">
                    ${sections.map((s, i) => `
                        <button class="lobby-step ${s.id === sec ? 'active' : ''} ${i < idx ? 'done' : ''}" data-lsec="${s.id}">
                            <span class="lobby-step-num">${i + 1}</span>
                            <span class="lobby-step-label">${s.icon} ${s.label}</span>
                            ${s.id === 'modifiers' ? `<span class="lobby-step-badge ${modCount ? '' : 'hidden'}" id="lobby-mod-badge">${modCount}</span>` : ''}
                        </button>`).join('')}
                </nav>
                <div class="lobby-step-body" id="lobby-step-body"></div>
                <footer class="lobby-step-footer">
                    <button class="btn btn-sm" id="lobby-prev" ${idx === 0 ? 'disabled' : ''}>← PREVIOUS</button>
                    <span class="lobby-step-count">STEP ${idx + 1} / ${sections.length}</span>
                    ${idx < sections.length - 1
                        ? `<button class="btn btn-sm btn-primary" id="lobby-next">NEXT: ${sections[idx + 1].label.toUpperCase()} →</button>`
                        : `<button class="btn btn-sm btn-primary" id="lobby-next-deploy">DEPLOY →</button>`}
                </footer>`;
            left.querySelectorAll('[data-lsec]').forEach((b) => {
                b.onclick = () => { BO.Sound.playUIClick(); this.lobbySection[mode] = b.dataset.lsec; this.renderLobby(); };
            });
            const prev = document.getElementById('lobby-prev');
            if (prev) prev.onclick = () => { BO.Sound.playUIClick(); this.lobbySection[mode] = sections[Math.max(0, idx - 1)].id; this.renderLobby(); };
            const next = document.getElementById('lobby-next');
            if (next) next.onclick = () => { BO.Sound.playUIClick(); this.lobbySection[mode] = sections[idx + 1].id; this.renderLobby(); };
            const nextDeploy = document.getElementById('lobby-next-deploy');
            if (nextDeploy) nextDeploy.onclick = () => { const d = document.getElementById('btn-deploy-match'); if (d) d.click(); };

            const body = document.getElementById('lobby-step-body');
            if (mode === 'zombies') this._renderZSection(body, sec, roundsUnlocked);
            else if (mode === 'mp') this._renderMpSection(body, sec);
            else this._renderTdSection(body, sec);
            body.scrollTop = 0;

            this._lobbyBroadcast();
            this._renderLobbyRight(mode, roundsUnlocked);
        }

        _renderZSection(body, sec, roundsUnlocked) {
            const disabledCount = (this.tdConfig.disabledEnemies || []).length;
            if (sec === 'map') {
                const maps = BO.MapsData.listByMode('zombies');
                body.innerHTML = this._section('Choose a map', `${maps.length} zombies maps. Your best round on each is shown.`, `
                    <div class="pick-grid">
                        ${maps.map((m) => `
                            <button class="pick-card ${this.selectedZMap === m.id ? 'active' : ''}" data-zmap="${m.id}" style="--pick-col:#f87171;"
                                data-tip-title="${escAttr(m.name)}" data-tip="${escAttr(m.description)}">
                                <span class="pick-name">${escAttr(m.name)}</span>
                                <span class="pick-sub">${escAttr(m.subtitle || '')}</span>
                                <span class="pick-desc">${escAttr(m.description || '')}</span>
                                <span class="pick-foot">BEST ROUND <b>${BO.Save.data.stats.highestRoundByMap[m.id] || 0}</b></span>
                            </button>`).join('')}
                    </div>`);
                body.querySelectorAll('[data-zmap]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedZMap = b.dataset.zmap; this.renderLobby(); }; });
            } else if (sec === 'difficulty') {
                const u = BO.Save.data.unlockables || {};
                const allUnlocked = BO.Settings.get('unlockAll');
                const zDiffs = [
                    { id: 'normal', name: 'Normal', unlocked: true, col: '#4ade80', tip: 'Standard zombies survival.' },
                    { id: 'hard', name: 'Hard', unlocked: !!(u.hardModeUnlocked || allUnlocked), col: '#fbbf24', tip: '1.5x zombie health, +18% speed, 1.35x attack. Unlock by reaching round 50.' },
                    { id: 'very_hard', name: 'Very Hard', unlocked: !!(u.veryHardModeUnlocked || allUnlocked), col: '#fb923c', tip: '2.25x health, +32% speed, 1.7x attack. Unlock by reaching round 50 on Hard.' },
                    { id: 'insanely_hard', name: 'Insanely Hard', unlocked: !!(u.insanelyHardModeUnlocked || allUnlocked), col: '#ef4444', tip: '3.5x health, +48% speed, 2.2x attack. Unlock by reaching round 50 on Very Hard.' },
                    { id: 'boss_rush', name: 'Boss Rush', unlocked: !!(u.bossRushUnlocked || allUnlocked), col: '#e879f9', tip: 'Start with 10,000 points and fight a boss every round. Unlock by reaching round 50.' }
                ];
                if (!zDiffs.find((d) => d.id === this.selectedZDifficulty && d.unlocked)) this.selectedZDifficulty = 'normal';
                body.innerHTML = this._section('Difficulty', 'Harder modes unlock as you survive to round 50.', `
                    <div class="pick-grid pick-grid-sm">
                        ${zDiffs.map((d) => `
                            <button class="pick-card ${this.selectedZDifficulty === d.id ? 'active' : ''}" data-zdiff="${d.id}" ${d.unlocked ? '' : 'disabled'} style="--pick-col:${d.col};">
                                <span class="pick-name">${d.name} ${d.unlocked ? '' : '🔒'}</span>
                                <span class="pick-desc">${escAttr(d.tip)}</span>
                            </button>`).join('')}
                    </div>`) + (roundsUnlocked ? this._section('Starting round', 'Unlocked by cheat. Jump straight to any round.', `
                    <div class="round-row">
                        <input type="number" id="lobby-round-input" min="1" max="999" value="${this.selectedStartRound}">
                        ${[1, 5, 10, 20, 25, 50].map((r) => `<button class="btn btn-sm ${this.selectedStartRound === r ? 'btn-zombies' : ''}" data-lobbyrnd="${r}">RD ${r}${r >= 5 ? ' BOSS' : ''}</button>`).join('')}
                    </div>`) : '');
                body.querySelectorAll('[data-zdiff]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedZDifficulty = b.dataset.zdiff; this.renderLobby(); }; });
                const lri = document.getElementById('lobby-round-input');
                if (lri) lri.oninput = (e) => { this.selectedStartRound = Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)); this._renderLobbyRight('zombies', roundsUnlocked); };
                body.querySelectorAll('[data-lobbyrnd]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedStartRound = parseInt(b.dataset.lobbyrnd, 10) || 1; this.renderLobby(); }; });
            } else if (sec === 'loadout') {
                body.innerHTML = this._section('Starting weapons', 'Pick what you spawn with. "Custom Class" uses the class selected on the right.', this._protocolHtml('zombies'));
                this._bindProtocol(body, 'zombies');
            } else if (sec === 'enemies') {
                const totalEp = (BO.ZombiesData.ORDERED_PROGRESSION.length || 70) + (BO.ZombiesData.ORDERED_BOSSES.length || 15);
                const zc = BO.ZombieCustomizer;
                const modCnt = zc ? zc.getCustomizedCount() : 0;
                const setupName = zc ? (zc.config.activePresetName || 'Default') : 'Default';
                body.innerHTML = this._section('Enemy pool & zombie customizer', 'Edit zombie stats, start rounds, per-zombie & category spawn %, and save setups.', `
                    <button class="big-action" id="btn-z-open-ep">
                        <span class="big-action-ico">🧟</span>
                        <span><b>Customize zombies, stats &amp; spawn %</b><small>${totalEp - disabledCount} of ${totalEp} enabled • Setup: ${escAttr(setupName)}${modCnt ? ` • ${modCnt} edited` : ''}</small></span>
                        <span class="big-action-go">OPEN →</span>
                    </button>`) + this._section('Exact values', 'Fine-tune the horde with precise numbers.', this._valueGrid([
                    { k: 'zombieHpMult', lbl: 'Zombie health ×', step: 0.1, min: 0.05, max: 20 },
                    { k: 'zombieSpeedMult', lbl: 'Zombie speed ×', step: 0.1, min: 0.2, max: 5 },
                    { k: 'zombieDamageMult', lbl: 'Zombie damage ×', step: 0.1, min: 0.1, max: 20 },
                    { k: 'playerMaxHp', lbl: 'Your max health', step: 25, min: 1, max: 5000 },
                    { k: 'startCurrency', lbl: 'Start points (0 = default)', step: 500, min: 0, max: 100000 },
                    { k: 'bossSpawnPct', lbl: 'Base boss chance %', step: 0.5, min: 0, max: 100 },
                    { k: 'maxAliveZombies', lbl: 'Max zombies alive', step: 2, min: 5, max: 60 },
                    { k: 'spawnDelaySec', lbl: 'Spawn delay s (0 = auto)', step: 0.1, min: 0, max: 4 },
                    { k: 'waveSizeMult', lbl: 'Round size ×', step: 0.25, min: 0.25, max: 5 },
                    { k: 'supplyDropPct', lbl: 'Supply drop rate %', step: 5, min: 0, max: 100 }
                ], this.zCustomValues, 'js-z-cval', 'zk'));
                document.getElementById('btn-z-open-ep').onclick = () => { BO.Sound.playUIClick(); this.openEnemyPoolModal(); };
                body.querySelectorAll('.js-z-cval').forEach((inp) => {
                    inp.onchange = (e) => { this.zCustomValues[e.target.dataset.zk] = Number(e.target.value); this._lobbyBroadcast(); };
                });
            } else {
                body.innerHTML = this._section('Modifiers', 'Mix and match. Hover any tile to read its effect. They stack.', this._modifiersHtml('zombies'));
                this._bindModifiers(body, 'zombies');
            }
        }

        _renderMpSection(body, sec) {
            const cr = this.customRules;
            if (sec === 'mode') {
                const mpModes = [
                    { id: 'tdm', name: 'Team Deathmatch', sub: 'First team to the kill limit wins (50 by default).' },
                    { id: 'ffa', name: 'Free-for-All', sub: 'Everyone for themselves (30 kills).' },
                    { id: 'dom', name: 'Domination', sub: 'Capture and hold flags A, B and C to 150 points.' },
                    { id: 'hardpoint', name: 'Hardpoint', sub: 'Hold the rotating zone to 150 points.' },
                    { id: 'gun_game', name: 'Gun Game', sub: 'Every kill upgrades your weapon. 16 steps to win.' }
                ];
                const maps = BO.MapsData.listByMode('mp');
                body.innerHTML = this._section('Game mode', '', `
                    <div class="pick-grid pick-grid-sm">
                        ${mpModes.map((mm) => `
                            <button class="pick-card ${this.selectedMpMode === mm.id ? 'active' : ''}" data-mpmode="${mm.id}" style="--pick-col:#38bdf8;">
                                <span class="pick-name">${mm.name}</span>
                                <span class="pick-desc">${mm.sub}</span>
                            </button>`).join('')}
                    </div>`) + this._section('Map', `${maps.length} arenas.`, `
                    <div class="pick-grid">
                        ${maps.map((m) => `
                            <button class="pick-card ${this.selectedMpMap === m.id ? 'active' : ''}" data-mpmap="${m.id}" style="--pick-col:#38bdf8;"
                                data-tip-title="${escAttr(m.name)}" data-tip="${escAttr(m.description)}">
                                <span class="pick-name">${escAttr(m.name)}</span>
                                <span class="pick-sub">${escAttr(m.subtitle || '')}</span>
                                <span class="pick-desc">${escAttr(m.description || '')}</span>
                            </button>`).join('')}
                    </div>`);
                body.querySelectorAll('[data-mpmode]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedMpMode = b.dataset.mpmode; this.renderLobby(); }; });
                body.querySelectorAll('[data-mpmap]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedMpMap = b.dataset.mpmap; this.renderLobby(); }; });
            } else if (sec === 'bots') {
                const diffs = [
                    { id: 'recruit', tip: 'Waits 2–5 s after spotting you before shooting. Relaxed.' },
                    { id: 'regular', tip: 'Waits 2–4 s before shooting. Balanced.' },
                    { id: 'hardened', tip: 'Waits 2–3 s before shooting. Aggressive.' },
                    { id: 'veteran', tip: 'Waits only 1–2 s and aims well. Elite.' }
                ];
                const weaponOpts = [['all', 'All weapons'], ['unarmed', 'Unarmed'], ['pistols', 'Pistols only'], ['snipers', 'Snipers only'], ['shotguns', 'Shotguns only'], ['smgs', 'SMGs only'], ['ar', 'Assault rifles'], ['melee', 'Melee only'], ['rpg', 'RPG launchers']];
                body.innerHTML = this._section('Bot skill', '', `
                    <div class="pick-grid pick-grid-sm">
                        ${diffs.map((d) => `
                            <button class="pick-card ${this.selectedDifficulty === d.id ? 'active' : ''}" data-diff="${d.id}" style="--pick-col:#38bdf8;">
                                <span class="pick-name">${d.id.charAt(0).toUpperCase() + d.id.slice(1)}</span>
                                <span class="pick-desc">${d.tip}</span>
                            </button>`).join('')}
                    </div>`) + this._section('Bot setup', 'Up to 100 bots total. Enemy slots take priority over allied slots.', `
                    <div class="value-grid">
                        <label class="value-field"><span>Enemy bots: <b id="cg-ec-lbl">${cr.enemyCount}</b></span><input type="range" id="cg-enemyCount" min="0" max="100" step="1" value="${cr.enemyCount}"></label>
                        <label class="value-field"><span>Team size: <b id="cg-ts-lbl">${cr.teamSizeLimit}</b></span><input type="range" id="cg-teamSize" min="1" max="100" step="1" value="${cr.teamSizeLimit}"></label>
                        <label class="value-field"><span>Bot health (1–1000)</span><input type="number" id="cg-enemyHp" min="1" max="1000" value="${cr.enemyHp}"></label>
                        <label class="value-field"><span>Bot weapons</span>
                            <select id="cg-enemyWeapons">${weaponOpts.map(([v, l]) => `<option value="${v}" ${cr.enemyWeaponMode === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
                        </label>
                    </div>`);
                body.querySelectorAll('[data-diff]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedDifficulty = b.dataset.diff; this.renderLobby(); }; });
                document.getElementById('cg-enemyCount').oninput = (e) => { cr.enemyCount = Number(e.target.value); document.getElementById('cg-ec-lbl').textContent = cr.enemyCount; this._lobbyBroadcast(); };
                document.getElementById('cg-teamSize').oninput = (e) => { cr.teamSizeLimit = Number(e.target.value); document.getElementById('cg-ts-lbl').textContent = cr.teamSizeLimit; this._lobbyBroadcast(); };
                document.getElementById('cg-enemyHp').oninput = (e) => { cr.enemyHp = Math.max(1, parseInt(e.target.value, 10) || 100); this._lobbyBroadcast(); };
                document.getElementById('cg-enemyWeapons').onchange = (e) => { cr.enemyWeaponMode = e.target.value; this._lobbyBroadcast(); };
            } else if (sec === 'rules') {
                const presets = [
                    ['standard', 'Standard'], ['unarmed', 'Unarmed target practice'], ['snipers', 'One-shot snipers'],
                    ['chaos', 'Moon gravity chaos'], ['quickcam', '5-kill blitz']
                ];
                const toggles = [
                    ['headshotsOnly', 'Headshots only'], ['oneShotKills', 'One-shot kills'], ['unlimitedAmmo', 'Unlimited ammo'],
                    ['explosiveRounds', 'Explosive bullets'], ['bigHeads', 'Big heads (3x)'], ['alwaysRadar', 'Radar always on'],
                    ['killstreaksEnabled', 'Killstreaks'], ['killcamEnabled', 'Winner killcam']
                ];
                const isOn = (k) => (k === 'killstreaksEnabled' || k === 'killcamEnabled') ? cr[k] !== false : !!cr[k];
                const renderSwitches = (entries) => `<div class="switch-grid">${entries.map(([k, label]) =>
                    `<button class="switch-card ${isOn(k) ? 'active' : ''}" aria-pressed="${isOn(k)}" data-cgk="${k}"><span>${label}</span><span class="mod-switch"></span></button>`
                ).join('')}</div>`;
                const playerOpts = [['custom', 'My custom class'], ['snipers', 'Force snipers'], ['pistols', 'Force pistols'], ['shotguns', 'Force shotguns'], ['rpg', 'Force RPG-7'], ['raygun', 'Force Ray Gun']];
                body.innerHTML = this._section('Quick presets', 'Start from a preset, then tweak anything below.', `
                    <div class="chip-row">${presets.map(([id, l]) => `<button class="chip js-cg-preset" data-preset="${id}">${l}</button>`).join('')}</div>`)
                    + this._section('Win conditions & physics', '', `
                    <div class="value-grid">
                        <label class="value-field"><span>Score to win (0 = default)</span><input type="number" id="cg-scoreLimit" min="0" max="500" value="${cr.scoreLimit}"></label>
                        <label class="value-field"><span>Time limit min (0 = default)</span><input type="number" id="cg-timeLimit" min="0" max="60" value="${cr.timeLimit}"></label>
                        <label class="value-field"><span>Your health (1–1000)</span><input type="number" id="cg-playerHp" min="1" max="1000" value="${cr.playerHp}"></label>
                        <label class="value-field"><span>Player weapon rule</span><select id="cg-playerWeapons">${playerOpts.map(([v, l]) => `<option value="${v}" ${cr.playerWeaponMode === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
                        <label class="value-field"><span>Gravity: <b id="cg-grv-lbl">${cr.gravityScale}x</b></span><input type="range" id="cg-gravity" min="0.4" max="1.6" step="0.1" value="${cr.gravityScale}"></label>
                        <label class="value-field"><span>Move speed: <b id="cg-spd-lbl">${cr.speedScale}x</b></span><input type="range" id="cg-speed" min="0.7" max="2.5" step="0.1" value="${cr.speedScale}"></label>
                        <label class="value-field"><span>Jump height: <b id="cg-jmp-lbl">${cr.jumpScale}x</b></span><input type="range" id="cg-jump" min="0.8" max="2.2" step="0.1" value="${cr.jumpScale}"></label>
                        <label class="value-field"><span>Respawn delay: <b id="cg-rsp-lbl">${cr.respawnDelay}s</b></span><input type="range" id="cg-respawn" min="0.5" max="8" step="0.5" value="${cr.respawnDelay}"></label>
                    </div>`)
                    + this._section('Match switches', '', `
                    ${renderSwitches(toggles)}`)
                    + BO.ExpansionData.matchSwitches.map(([group, entries]) =>
                        this._section(group, '', renderSwitches(entries))).join('');
                body.querySelectorAll('.js-cg-preset').forEach((pb) => {
                    pb.onclick = () => {
                        BO.Sound.playUIClick();
                        const p = pb.dataset.preset;
                        const keepMods = this.customRules.mods || {};
                        const keepProto = this.customRules.startProtocol || 'custom';
                        Object.assign(this.customRules, BO.MPMode.getDefaultCustomRules());
                        this.customRules.mods = keepMods;
                        this.customRules.startProtocol = keepProto;
                        if (p === 'unarmed') { this.customRules.enemyWeaponMode = 'unarmed'; this.customRules.enemyCount = 10; }
                        else if (p === 'snipers') { this.customRules.enemyWeaponMode = 'snipers'; this.customRules.playerWeaponMode = 'snipers'; this.customRules.oneShotKills = true; }
                        else if (p === 'chaos') { Object.assign(this.customRules, { gravityScale: 0.5, speedScale: 1.6, jumpScale: 1.6, bigHeads: true, explosiveRounds: true, unlimitedAmmo: true }); }
                        else if (p === 'quickcam') { Object.assign(this.customRules, { scoreLimit: 5, enemyHp: 40, killcamEnabled: true }); }
                        this._lobbyBroadcast();
                        this.renderLobby();
                    };
                });
                const num = (id, k, def) => { document.getElementById(id).oninput = (e) => { cr[k] = Math.max(0, parseInt(e.target.value, 10) || def); this._lobbyBroadcast(); }; };
                num('cg-scoreLimit', 'scoreLimit', 0);
                num('cg-timeLimit', 'timeLimit', 0);
                num('cg-playerHp', 'playerHp', 100);
                document.getElementById('cg-playerWeapons').onchange = (e) => { cr.playerWeaponMode = e.target.value; this._lobbyBroadcast(); this._renderLobbySummary(); };
                const rng = (id, k, lbl, suf) => {
                    document.getElementById(id).oninput = (e) => { cr[k] = Number(e.target.value); document.getElementById(lbl).textContent = cr[k] + suf; this._lobbyBroadcast(); };
                };
                rng('cg-gravity', 'gravityScale', 'cg-grv-lbl', 'x');
                rng('cg-speed', 'speedScale', 'cg-spd-lbl', 'x');
                rng('cg-jump', 'jumpScale', 'cg-jmp-lbl', 'x');
                rng('cg-respawn', 'respawnDelay', 'cg-rsp-lbl', 's');
                body.querySelectorAll('[data-cgk]').forEach((b) => {
                    b.onclick = () => {
                        BO.Sound.playUIClick();
                        const k = b.dataset.cgk;
                        cr[k] = !isOn(k);
                        if (cr[k] && cr.slowFire && cr.fastFire && ['slowFire', 'fastFire'].includes(k)) {
                            cr[k === 'slowFire' ? 'fastFire' : 'slowFire'] = false;
                        }
                        if (cr[k] && cr.slowBots && cr.quickBots && ['slowBots', 'quickBots'].includes(k)) {
                            cr[k === 'slowBots' ? 'quickBots' : 'slowBots'] = false;
                        }
                        if (cr[k] && cr.fragileBots && cr.toughBots && ['fragileBots', 'toughBots'].includes(k)) {
                            cr[k === 'fragileBots' ? 'toughBots' : 'fragileBots'] = false;
                        }
                        body.querySelectorAll('[data-cgk]').forEach((button) => {
                            const active = isOn(button.dataset.cgk);
                            button.classList.toggle('active', active);
                            button.setAttribute('aria-pressed', String(active));
                        });
                        this._lobbyBroadcast();
                    };
                });
            } else if (sec === 'loadout') {
                body.innerHTML = this._section('Starting weapons', 'What you spawn with each life. "Custom Class" uses the class selected on the right.', this._protocolHtml('mp'));
                this._bindProtocol(body, 'mp');
            } else {
                body.innerHTML = this._section('Modifiers', 'Mix and match. Hover any tile to read its effect. They stack.', this._modifiersHtml('mp'));
                this._bindModifiers(body, 'mp');
            }
        }

        _renderTdSection(body, sec) {
            const tc = this.tdConfig;
            const disabledCount = (tc.disabledEnemies || []).length;
            if (sec === 'castle') {
                const tdMaps = BO.MapsData.listByMode('td');
                body.innerHTML = this._section('Choose a castle', 'Each castle has 2 sniper towers, a perk kiosk, Pack-a-Punch and an attachment bench.', `
                    <div class="pick-grid">
                        ${tdMaps.map((m) => `
                            <button class="pick-card ${this.selectedTdMap === m.id ? 'active' : ''}" data-tdmap="${m.id}" style="--pick-col:#22c55e;">
                                <span class="pick-name">${escAttr(m.name)}</span>
                                <span class="pick-sub">${escAttr(m.subtitle || '')}</span>
                                <span class="pick-desc">${escAttr(m.description || '')}</span>
                            </button>`).join('')}
                    </div>`);
                body.querySelectorAll('[data-tdmap]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedTdMap = b.dataset.tdmap; this.renderLobby(); }; });
            } else if (sec === 'difficulty') {
                const tdModes = [
                    { id: 'standard', name: 'Standard Siege', sub: 'Classic scaling waves with rotating deployables.' },
                    { id: 'all_bosses', name: 'All Bosses', sub: 'Every enemy is a boss.' },
                    { id: 'boss_rush', name: 'Boss Rush', sub: 'A boss from wave 1 and every wave after.' },
                    { id: 'gun_warfare', name: 'Gun-Toting Horde', sub: 'At least 75% of zombies carry rifles and shoot back.' },
                    { id: 'magic_siege', name: 'Magical Siege', sub: 'Arcane zombies throw magic bolts.' },
                    { id: 'endless_swarm', name: 'Endless Swarm', sub: 'Full roster from wave 1, fast horde, big waves.' }
                ];
                const tdDiffs = [
                    { id: 'easy', name: 'Easy', col: '#22c55e', sub: 'Starts with 2 enemy types.' },
                    { id: 'medium', name: 'Medium', col: '#38bdf8', sub: 'Starts with 2 enemy types, tougher.' },
                    { id: 'hard', name: 'Hard', col: '#f59e0b', sub: 'Starts with 3 enemy types.' },
                    { id: 'hell', name: 'Hell', col: '#ef4444', sub: 'Starts with 5 enemy types. Brutal.' }
                ];
                body.innerHTML = this._section('Siege mode', '', `
                    <div class="pick-grid pick-grid-sm">
                        ${tdModes.map((mm) => `
                            <button class="pick-card ${tc.tdMode === mm.id ? 'active' : ''}" data-tdmode="${mm.id}" style="--pick-col:#22c55e;">
                                <span class="pick-name">${mm.name}</span><span class="pick-desc">${mm.sub}</span>
                            </button>`).join('')}
                    </div>`) + this._section('Difficulty', '', `
                    <div class="pick-grid pick-grid-sm">
                        ${tdDiffs.map((d) => `
                            <button class="pick-card ${tc.difficulty === d.id ? 'active' : ''}" data-tddiff="${d.id}" style="--pick-col:${d.col};">
                                <span class="pick-name">${d.name}</span><span class="pick-desc">${d.sub}</span>
                            </button>`).join('')}
                    </div>`);
                body.querySelectorAll('[data-tdmode]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); tc.tdMode = b.dataset.tdmode; this.renderLobby(); }; });
                body.querySelectorAll('[data-tddiff]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); tc.difficulty = b.dataset.tddiff; this.renderLobby(); }; });
            } else if (sec === 'battlefield') {
                body.innerHTML = this._section('Battlefield', '', `
                    <div class="value-grid">
                        <label class="value-field"><span>Starting zombies: <b id="td-sz-lbl">${tc.startingZombies}</b></span><input type="range" id="td-startZ" min="3" max="60" step="1" value="${tc.startingZombies}"></label>
                        <label class="value-field"><span>Map size</span>
                            <select id="td-mapSize">
                                <option value="0.7" ${tc.mapSize === 0.7 ? 'selected' : ''}>Compact (0.7x)</option>
                                <option value="1" ${tc.mapSize === 1.0 ? 'selected' : ''}>Standard (1.0x)</option>
                                <option value="1.35" ${tc.mapSize === 1.35 ? 'selected' : ''}>Large (1.35x)</option>
                                <option value="1.75" ${tc.mapSize === 1.75 ? 'selected' : ''}>Massive (1.75x)</option>
                            </select>
                        </label>
                        <label class="value-field"><span>Wall health: <b id="td-whp-lbl">${tc.wallHp}</b></span><input type="range" id="td-wallHp" min="50" max="2000" step="50" value="${tc.wallHp}"></label>
                        <label class="value-field"><span>Zombies with guns: <b id="td-gpct-lbl">${tc.gunZombiePct}%</b></span><input type="range" id="td-gunPct" min="0" max="100" step="5" value="${tc.gunZombiePct}"></label>
                    </div>`) + this._section('Exact values', '', this._valueGrid([
                    { k: 'zombieHpMult', lbl: 'Zombie health ×', step: 0.1, min: 0.05, max: 20 },
                    { k: 'zombieSpeedMult', lbl: 'Zombie speed ×', step: 0.1, min: 0.2, max: 5 },
                    { k: 'zombieDamageMult', lbl: 'Zombie damage ×', step: 0.1, min: 0.1, max: 20 },
                    { k: 'playerMaxHp', lbl: 'Your max health', step: 25, min: 1, max: 5000 },
                    { k: 'startCurrency', lbl: 'Start gold (0 = default)', step: 500, min: 0, max: 100000 },
                    { k: 'bossSpawnPct', lbl: 'Base boss chance %', step: 0.5, min: 0, max: 100 },
                    { k: 'maxAliveZombies', lbl: 'Max zombies alive', step: 2, min: 5, max: 60 },
                    { k: 'spawnDelaySec', lbl: 'Spawn delay s (0 = auto)', step: 0.1, min: 0, max: 4 },
                    { k: 'waveSizeMult', lbl: 'Wave size ×', step: 0.25, min: 0.25, max: 5 },
                    { k: 'intermissionSec', lbl: 'Intermission (s)', step: 5, min: 3, max: 120 },
                    { k: 'priceMult', lbl: 'Shop price ×', step: 0.25, min: 0.1, max: 10 }
                ], tc.customValues || {}, 'js-td-cval', 'tdk'));
                const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.oninput = el.onchange = (e) => { fn(e); this._lobbyBroadcast(); }; };
                bind('td-startZ', (e) => { tc.startingZombies = Number(e.target.value); document.getElementById('td-sz-lbl').textContent = tc.startingZombies; });
                bind('td-mapSize', (e) => { tc.mapSize = Number(e.target.value); });
                bind('td-wallHp', (e) => { tc.wallHp = Number(e.target.value); document.getElementById('td-whp-lbl').textContent = tc.wallHp; });
                bind('td-gunPct', (e) => { tc.gunZombiePct = Number(e.target.value); document.getElementById('td-gpct-lbl').textContent = tc.gunZombiePct + '%'; });
                body.querySelectorAll('.js-td-cval').forEach((inp) => {
                    inp.onchange = (e) => {
                        if (!tc.customValues) tc.customValues = {};
                        tc.customValues[e.target.dataset.tdk] = Number(e.target.value);
                        this._lobbyBroadcast();
                    };
                });
            } else if (sec === 'loadout') {
                body.innerHTML = this._section('Starting weapons', 'What you spawn with. You can still buy more from the shopkeeper.', this._protocolHtml('td'));
                this._bindProtocol(body, 'td');
            } else if (sec === 'enemies') {
                const totalEp = (BO.ZombiesData.ORDERED_PROGRESSION.length || 70) + (BO.ZombiesData.ORDERED_BOSSES.length || 15);
                const zc = BO.ZombieCustomizer;
                const modCnt = zc ? zc.getCustomizedCount() : 0;
                const setupName = zc ? (zc.config.activePresetName || 'Default') : 'Default';
                body.innerHTML = this._section('Enemy pool & zombie customizer', 'Edit zombie stats, start waves, per-zombie & category spawn %, and save setups.', `
                    <button class="big-action" id="btn-td-open-ep">
                        <span class="big-action-ico">🧟</span>
                        <span><b>Customize zombies, stats &amp; spawn %</b><small>${totalEp - disabledCount} of ${totalEp} enabled • Setup: ${escAttr(setupName)}${modCnt ? ` • ${modCnt} edited` : ''}</small></span>
                        <span class="big-action-go">OPEN →</span>
                    </button>`);
                document.getElementById('btn-td-open-ep').onclick = () => { BO.Sound.playUIClick(); this.openEnemyPoolModal(); };
            } else {
                body.innerHTML = this._section('Modifiers', 'Mix and match. Hover any tile to read its effect. They stack.', this._modifiersHtml('td'));
                this._bindModifiers(body, 'td');
            }
        }

        _renderLobbySummary() {
            const host = document.getElementById('lobby-summary');
            if (!host) return;
            const mode = this.lobbyMode;
            const rows = [];
            if (mode === 'zombies') {
                const m = BO.MapsData.get ? BO.MapsData.get(this.selectedZMap) : null;
                rows.push(['Map', m ? m.name : this.selectedZMap]);
                rows.push(['Difficulty', String(this.selectedZDifficulty || 'normal').replace(/_/g, ' ')]);
            } else if (mode === 'mp') {
                const m = BO.MapsData.get ? BO.MapsData.get(this.selectedMpMap) : null;
                rows.push(['Mode', String(this.selectedMpMode).replace(/_/g, ' ')]);
                rows.push(['Map', m ? m.name : this.selectedMpMap]);
                rows.push(['Bots', `${this.customRules.enemyCount} • ${this.selectedDifficulty}`]);
            } else {
                const m = BO.MapsData.get ? BO.MapsData.get(this.selectedTdMap) : null;
                rows.push(['Castle', m ? m.name : this.selectedTdMap]);
                rows.push(['Siege', `${String(this.tdConfig.tdMode).replace(/_/g, ' ')} • ${this.tdConfig.difficulty}`]);
            }
            const proto = BO.Mods.getProtocol(this._lobbyProtocol(mode));
            rows.push(['Start', `${proto.icon} ${proto.name}`]);
            if (mode !== 'mp') rows.push(['Enemies', `${80 - (this.tdConfig.disabledEnemies || []).length} / 80 enabled`]);
            const mods = this._lobbyMods(mode);
            const activeDefs = BO.Mods.defsForMode(mode).filter((d) => mods[d.k]);
            host.innerHTML = `
                <div class="side-title">MATCH SUMMARY</div>
                <dl class="summary-list">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${escAttr(v)}</dd>`).join('')}</dl>
                <div class="side-title" style="margin-top:10px;">MODIFIERS <span class="side-count">${activeDefs.length}</span></div>
                <div class="summary-chips">
                    ${activeDefs.length ? activeDefs.slice(0, 10).map((d) => `<span class="summary-chip" data-tip-title="${escAttr(d.lbl)}" data-tip="${escAttr(d.desc)}">${escAttr(d.lbl)}</span>`).join('') + (activeDefs.length > 10 ? `<span class="summary-chip more">+${activeDefs.length - 10} more</span>` : '') : '<span class="summary-none">None — classic rules.</span>'}
                </div>`;
        }

        _renderLobbyRight(mode, roundsUnlocked) {
            const right = document.getElementById('lobby-right');
            const isZ = mode === 'zombies';
            const isMp = mode === 'mp';
            const classes = BO.Loadout.getClasses();
            const selIdx = BO.Loadout.getSelectedClassIndex();
            const activeCls = classes[selIdx];
            const ult = BO.AttachmentsData.ULTIMATE_POWERS[activeCls.ultimatePower || 'gravity_spikes'];
            const netActive = !!(BO.Net && BO.Net.active);
            const isClientInLobby = netActive && !BO.Net.isHost;
            const pSpec = BO.WeaponsData.get(activeCls.primary.id);
            const sSpec = BO.WeaponsData.get(activeCls.secondary.id);

            right.innerHTML = `
                <div class="side-card side-card-net">
                    <div class="side-title" style="color:#4ade80;">🌐 ONLINE SQUAD</div>
                    <div id="net-lobby-box" class="net-lobby-box"></div>
                </div>
                <div class="side-card">
                    <div class="side-title">YOUR CLASS</div>
                    <select id="lobby-class-select" class="side-select" data-tip-title="Pick your class" data-tip="Choose which of your custom classes to take into this match.">
                        ${classes.map((c, i) => `<option value="${i}" ${i === selIdx ? 'selected' : ''}>${i + 1}. ${escAttr(c.name)}</option>`).join('')}
                    </select>
                    <div class="class-mini">
                        <div class="class-mini-row"><span>PRIMARY</span><b>${escAttr(pSpec.name)}</b></div>
                        <div class="class-mini-row"><span>SECONDARY</span><b>${escAttr(sSpec.shortName || sSpec.name)}</b></div>
                        <div class="class-mini-row"><span>GEAR</span><b>${escAttr(BO.AttachmentsData.LETHALS[activeCls.lethal]?.name || '—')} • ${escAttr(BO.AttachmentsData.TACTICALS[activeCls.tactical]?.name || '—')}</b></div>
                        <div class="class-mini-row"><span>POWERS</span><b>${escAttr(BO.AttachmentsData.FIELD_UPGRADES[activeCls.fieldUpgrade]?.name || '—')} • ${escAttr(ult ? ult.name : '—')}</b></div>
                    </div>
                    <div class="side-btn-row">
                        <button class="btn btn-sm" id="lobby-edit-class">EDIT CLASS</button>
                        <button class="btn btn-sm" id="lobby-open-legend">GAME GUIDE</button>
                        ${BO.Cheats && BO.Cheats.isModMenuUnlocked() ? '<button class="btn btn-sm" id="lobby-open-modmenu" style="border-color:#fde047;color:#fde047;">★ MODS</button>' : ''}
                    </div>
                </div>
                <div class="side-card" id="lobby-summary"></div>
                <button class="btn deploy-btn ${isZ ? 'btn-zombies' : 'btn-primary'}" id="btn-deploy-match"
                    data-tip-title="Start match" data-tip="Launches the match for everyone in your online lobby.">
                    ${isClientInLobby ? 'DEPLOY NOW (OR WAIT FOR HOST)' : (netActive ? `DEPLOY SQUAD (${BO.Net.players.size})` : `DEPLOY${isZ && roundsUnlocked && this.selectedStartRound > 1 ? ` • ROUND ${this.selectedStartRound}` : ''}`)}
                </button>`;
            this._renderLobbySummary();

            document.getElementById('lobby-class-select').onchange = (e) => {
                BO.Loadout.setSelectedClassIndex(Number(e.target.value));
                if (BO.Net && BO.Net.active) BO.Net.syncMyProfile();
                this._renderLobbyRight(mode, roundsUnlocked);
            };
            document.getElementById('lobby-edit-class').onclick = () => { BO.Sound.playUIClick(); this.showScreen('gunsmith'); };
            document.getElementById('lobby-open-legend').onclick = () => { BO.Sound.playUIClick(); this.openLegend(this.lobbyMode); };
            const lModBtn = document.getElementById('lobby-open-modmenu');
            if (lModBtn) lModBtn.onclick = () => { BO.Sound.playUIClick(); this.openModMenu(); };
            document.getElementById('btn-deploy-match').onclick = () => {
                BO.Sound.playUIClick();
                if (!this.onStartMatch) return;
                if (isZ) {
                    const proto = this._lobbyProtocol('zombies');
                    this.onStartMatch({
                        mode: 'zombies',
                        mapId: this.selectedZMap,
                        difficulty: this.selectedZDifficulty || 'normal',
                        useClassicStarter: proto === 'classic',
                        startProtocol: proto,
                        startRound: roundsUnlocked ? this.selectedStartRound : 1,
                        zModifiers: BO.Math.deepClone(this.zModifiers),
                        zCustomValues: BO.Math.deepClone(this.zCustomValues),
                        disabledEnemies: (this.tdConfig.disabledEnemies || []).slice()
                    });
                } else if (isMp) {
                    this.onStartMatch({
                        mode: 'mp',
                        modeType: this.selectedMpMode,
                        mapId: this.selectedMpMap,
                        difficulty: this.selectedDifficulty,
                        customRules: BO.Math.deepClone(this.customRules)
                    });
                } else {
                    this.onStartMatch({
                        mode: 'td',
                        mapId: this.selectedTdMap,
                        tdConfig: BO.Math.deepClone(this.tdConfig)
                    });
                }
            };
            this._refreshNetUI();
        }

        _refreshNetUI() {
            const box = document.getElementById('net-lobby-box');
            if (!box || !BO.Net) return;
            const N = BO.Net;

            const deployBtn = document.getElementById('btn-deploy-match');
            if (deployBtn) {
                if (N.active && !N.isHost) {
                    deployBtn.textContent = 'WAITING FOR HOST TO LAUNCH (OR CLICK TO START)';
                } else if (N.active) {
                    deployBtn.textContent = `DEPLOY SQUAD (${N.players.size}) INTO COMBAT`;
                }
            }

            if (!N.active) {
                box.innerHTML = `
                    <div style="font-size:11.5px;color:#cbd5e1;line-height:1.35;">
                        Create an Online Room to get a shareable link—anyone who opens your link automatically lands in this lobby with you!
                    </div>
                    <button class="btn btn-sm" id="btn-net-create" style="background:linear-gradient(135deg,#15803d,#22c55e);color:#052e16;border-color:#4ade80;font-weight:800;padding:10px;">
                        🔗 CREATE ONLINE LOBBY &amp; GET FRIEND LINK
                    </button>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <input type="text" id="inp-net-code" placeholder="ENTER ROOM CODE" maxlength="8" style="flex:1;background:#070a0f;color:#fde047;border:1px solid var(--border-subtle);padding:6px 8px;font-family:var(--font-mono);font-weight:800;text-transform:uppercase;">
                        <button class="btn btn-sm btn-primary" id="btn-net-join">JOIN CODE</button>
                    </div>
                `;
                document.getElementById('btn-net-create').onclick = () => {
                    BO.Sound.playUIClick();
                    N.hostRoom();
                    setTimeout(() => N.copyInviteLink(), 80);
                };
                const inp = document.getElementById('inp-net-code');
                const jBtn = document.getElementById('btn-net-join');
                jBtn.onclick = () => {
                    BO.Sound.playUIClick();
                    if (inp.value.trim()) N.joinRoom(inp.value.trim(), false);
                };
                inp.onkeydown = (e) => {
                    if (e.key === 'Enter' && inp.value.trim()) N.joinRoom(inp.value.trim(), false);
                };
                return;
            }

            const inviteUrl = N.getInviteUrl();
            const players = Array.from(N.players.values());
            const isMp = this.lobbyMode === 'mp';

            box.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                    <span style="font-size:12px;font-weight:800;color:#4ade80;">● ${escAttr(N.statusText)}</span>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:800;color:#fde047;background:#070a0f;padding:2px 7px;border:1px solid var(--amber);">CODE: ${N.roomCode}</span>
                </div>
                <div style="display:flex;gap:4px;">
                    <input type="text" readonly value="${escAttr(inviteUrl)}" id="inp-invite-url" style="flex:1;background:#070a0f;color:#38bdf8;border:1px solid rgba(56,189,248,0.4);padding:5px 7px;font-family:var(--font-mono);font-size:11px;user-select:all;">
                    <button class="btn btn-sm btn-primary" id="btn-net-copy-link" title="Copy link to send to your friend">📋 COPY LINK</button>
                </div>
                <div style="font-size:11px;font-weight:800;color:var(--amber);letter-spacing:1px;display:flex;justify-content:space-between;align-items:center;">
                    <span>SQUAD IN LOBBY (${players.length} / 8)</span>
                    ${isMp ? `<button class="btn btn-sm" id="btn-net-toggle-team" style="padding:2px 7px;font-size:10px;border-color:${N.myTeam === 0 ? '#38bdf8' : '#ef4444'};color:${N.myTeam === 0 ? '#38bdf8' : '#ef4444'};">MY TEAM: ${N.myTeam === 0 ? 'ALLIES (CO-OP)' : 'HOSTILES (VS FRIENDS)'}</button>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;max-height:110px;overflow-y:auto;">
                    ${players.map((p) => {
                        const wShort = BO.WeaponsData.get(p.weaponId || 'm4a1')?.shortName || 'M4A1';
                        const isMe = p.peerId === N.myPeerId;
                        const teamTag = isMp
                            ? `<span style="color:${(p.team || 0) === 0 ? '#38bdf8' : '#ef4444'};font-size:10px;">[${(p.team || 0) === 0 ? 'ALLY' : 'ENEMY'}]</span>`
                            : `<span style="color:#22c55e;font-size:10px;">[SQUAD]</span>`;
                        return `
                            <div style="display:flex;justify-content:space-between;align-items:center;background:#070a0f;padding:4px 8px;border-left:3px solid ${p.isHost ? '#fde047' : '#38bdf8'};font-size:11.5px;">
                                <span><b>${escAttr(p.callsign)}</b> ${isMe ? '(YOU)' : ''} ${p.isHost ? '<span style="color:#fde047;font-size:10px;">★ HOST</span>' : ''}</span>
                                <span>${teamTag} <span style="color:#94a3b8;font-size:10.5px;">LV${p.level || 1} • ${wShort}</span></span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div id="net-chat-log" style="background:#05080d;border:1px solid var(--border-subtle);padding:5px 7px;height:56px;overflow-y:auto;font-size:11px;display:flex;flex-direction:column;gap:2px;"></div>
                <div style="display:flex;gap:4px;">
                    <input type="text" id="inp-net-chat" placeholder="Chat with squad..." maxlength="120" style="flex:1;background:#070a0f;color:#f8fafc;border:1px solid var(--border-subtle);padding:4px 7px;font-size:11.5px;">
                    <button class="btn btn-sm" id="btn-net-send">SEND</button>
                    <button class="btn btn-sm btn-zombies" id="btn-net-leave" title="Leave Online Lobby">LEAVE</button>
                </div>
            `;

            document.getElementById('btn-net-copy-link').onclick = () => {
                BO.Sound.playUIClick();
                N.copyInviteLink();
            };
            const urlInp = document.getElementById('inp-invite-url');
            if (urlInp) urlInp.onclick = () => urlInp.select();

            const teamBtn = document.getElementById('btn-net-toggle-team');
            if (teamBtn) {
                teamBtn.onclick = () => {
                    BO.Sound.playUIClick();
                    N.setMyTeam(N.myTeam === 0 ? 1 : 0);
                };
            }

            const chatInp = document.getElementById('inp-net-chat');
            const sendBtn = document.getElementById('btn-net-send');
            const doSend = () => {
                if (chatInp && chatInp.value.trim()) {
                    N.sendChat(chatInp.value.trim());
                    chatInp.value = '';
                }
            };
            if (sendBtn) sendBtn.onclick = doSend;
            if (chatInp) chatInp.onkeydown = (e) => { if (e.key === 'Enter') doSend(); };

            document.getElementById('btn-net-leave').onclick = () => {
                BO.Sound.playUIClick();
                N.leaveRoom(true);
            };
            this._refreshNetChatUI();
        }

        _refreshNetChatUI() {
            const log = document.getElementById('net-chat-log');
            if (!log || !BO.Net) return;
            log.innerHTML = BO.Net.chatMessages.map((m) =>
                `<div><b style="color:${m.color || '#38bdf8'}">${escAttr(m.sender)}:</b> <span style="color:#e2e8f0">${escAttr(m.text)}</span></div>`
            ).join('');
            log.scrollTop = log.scrollHeight;
        }

        /* ====================================================================
           BARRACKS & SERVICE RECORD
        ==================================================================== */
        renderBarracks() {
            const body = document.getElementById('barracks-body');
            const stats = BO.Save.data.stats;
            const info = BO.Progression.getRankInfo();
            const canPres = BO.Progression.canEnterPrestige();

            const allZombiesCount = (BO.ZombiesData.ORDERED_PROGRESSION || BO.ZombiesData.ZOMBIE_TYPES || []).length;
            const allBossesCount = (BO.ZombiesData.ORDERED_BOSSES || Object.values(BO.ZombiesData.BOSSES_BY_ROUND || {})).length;
            document.getElementById('barracks-tabs').innerHTML = `
                <button class="btn ${this.barracksTab === 'bestiary' ? 'btn-zombies' : ''}" data-btab="bestiary"
                    data-tip-title="Full Combat Bestiary" data-tip="Inspect all ${allZombiesCount} unique zombies, ${allBossesCount} Bosses & Super Bosses, weaknesses, resistances, and drops!">BESTIARY (${allZombiesCount} + ${allBossesCount} BOSSES)</button>
                <button class="btn ${this.barracksTab === 'unlockables' ? 'btn-primary' : ''}" data-btab="unlockables"
                    data-tip-title="Unlockables Trophy Case" data-tip="Track Gold Camo (1,000 HS), Top Hat (1,000 HS in 1 game), Hard Mode, Very Hard Mode, Insanely Hard Mode, and Boss Rush!">UNLOCKABLES &amp; TOP HAT</button>
                <button class="btn ${this.barracksTab === 'record' ? 'btn-primary' : ''}" data-btab="record"
                    data-tip-title="Combat Record & Prestige" data-tip="View your rank, K/D ratio, highest Zombies rounds, and Prestige reset.">COMBAT RECORD &amp; PRESTIGE</button>
                <button class="btn ${this.barracksTab === 'medals' ? 'btn-primary' : ''}" data-btab="medals"
                    data-tip-title="Medals Earned" data-tip="Special awards earned for headshots, multikills, streaks, Pack-a-Punch, and survival.">MEDALS</button>
                <button class="btn ${this.barracksTab === 'challenges' ? 'btn-primary' : ''}" data-btab="challenges"
                    data-tip-title="18 Career Challenges" data-tip="Complete goals to earn huge bonus XP and level up faster.">CHALLENGES (18)</button>
                <button class="btn ${this.barracksTab === 'save' ? 'btn-primary' : ''}" data-btab="save"
                    data-tip-title="Offline Save Backup" data-tip="Export your progress to text, import a backup, or start fresh.">SAVE DATA (OFFLINE)</button>
            `;
            document.querySelectorAll('[data-btab]').forEach((b) => {
                b.onclick = () => { BO.Sound.playUIClick(); this.barracksTab = b.dataset.btab; this.renderBarracks(); };
            });

            if (this.barracksTab === 'unlockables') {
                const u = BO.Save.data.unlockables || {};
                const allOn = BO.Settings.get('unlockAll');
                const cls = BO.Loadout.getActiveClass();
                const pRec = BO.Save.getWeaponRecord(cls.primary.id);
                const goldUnlocked = BO.Progression.isCamoUnlocked(cls.primary.id, 'gold');
                const hatUnlocked = !!(u.topHatUnlocked || allOn);
                const hatEq = !!u.topHatEquipped;

                body.innerHTML = `
                    <div class="panel-title" style="color:#fde047;">SPECIAL UNLOCKABLES &amp; ENDGAME MODES</div>
                    <div class="card-grid">
                        <div class="select-card ${goldUnlocked ? 'active' : ''}">
                            <div class="card-head" style="color:#fde047;">1. 24K GOLD CAMO (${goldUnlocked ? 'UNLOCKED ✓' : 'LOCKED 🔒'})</div>
                            <div class="card-sub"><b>Requirement:</b> Score 1,000 Headshots with your selected weapon (or use the <b>unlock</b> cheat).<br>Active Primary (${BO.WeaponsData.get(cls.primary.id).shortName}): <b>${pRec.headshots || 0} / 1,000 Headshots</b></div>
                        </div>
                        <div class="select-card ${hatUnlocked ? 'active' : ''}">
                            <div class="card-head" style="color:#fde047;">2. 🎩 GENTLEMAN TOP HAT (${hatUnlocked ? 'UNLOCKED ✓' : 'LOCKED 🔒'})</div>
                            <div class="card-sub"><b>Requirement:</b> Score 1,000 Headshots in a single game! Displays a 3D Black &amp; Gold Top Hat on your podium and grants +15% Headshot Points in Zombies!</div>
                            ${hatUnlocked ? `<button class="btn btn-sm ${hatEq ? 'btn-primary' : ''}" id="btn-toggle-tophat" style="margin-top:8px;">${hatEq ? '🎩 TOP HAT EQUIPPED (CLICK TO UNEQUIP)' : 'EQUIP 3D TOP HAT'}</button>` : ''}
                        </div>
                        <div class="select-card ${(u.hardModeUnlocked || allOn) ? 'active' : ''}">
                            <div class="card-head" style="color:#f87171;">3. HARD MODE (${(u.hardModeUnlocked || allOn) ? 'UNLOCKED ✓' : 'LOCKED 🔒'})</div>
                            <div class="card-sub"><b>Requirement:</b> Pass Round 50 in Zombies! Zombies have 1.5x HP, +18% Speed, and 1.35x Attack.</div>
                        </div>
                        <div class="select-card ${(u.veryHardModeUnlocked || allOn) ? 'active' : ''}">
                            <div class="card-head" style="color:#ef4444;">4. VERY HARD MODE (${(u.veryHardModeUnlocked || allOn) ? 'UNLOCKED ✓' : 'LOCKED 🔒'})</div>
                            <div class="card-sub"><b>Requirement:</b> Pass Round 50 on Hard Mode! Zombies have 2.25x HP, +32% Speed, and 1.7x Attack.</div>
                        </div>
                        <div class="select-card ${(u.insanelyHardModeUnlocked || allOn) ? 'active' : ''}">
                            <div class="card-head" style="color:#dc2626;">5. INSANELY HARD MODE (${(u.insanelyHardModeUnlocked || allOn) ? 'UNLOCKED ✓' : 'LOCKED 🔒'})</div>
                            <div class="card-sub"><b>Requirement:</b> Pass Round 50 on Very Hard Mode! Zombies have 3.5x HP, +48% Speed, and 2.2x Attack.</div>
                        </div>
                        <div class="select-card ${(u.bossRushUnlocked || allOn) ? 'active' : ''}">
                            <div class="card-head" style="color:#c084fc;">6. ★ BOSS RUSH MODE (${(u.bossRushUnlocked || allOn) ? 'UNLOCKED ✓' : 'LOCKED 🔒'})</div>
                            <div class="card-sub"><b>Requirement:</b> Pass Round 50 in Zombies! Start with 10,000 Points and fight a Boss every single round!</div>
                        </div>
                    </div>
                `;
                const btnHat = document.getElementById('btn-toggle-tophat');
                if (btnHat) {
                    btnHat.onclick = () => {
                        BO.Sound.playUIClick();
                        if (!BO.Save.data.unlockables) BO.Save.data.unlockables = {};
                        BO.Save.data.unlockables.topHatUnlocked = true;
                        BO.Save.data.unlockables.topHatEquipped = !BO.Save.data.unlockables.topHatEquipped;
                        BO.Save.save();
                        this.updateAllRankBadges();
                        this.renderBarracks();
                    };
                }
                return;
            }

            if (this.barracksTab === 'bestiary') {
                const allBosses = BO.ZombiesData.ORDERED_BOSSES || Object.values(BO.ZombiesData.BOSSES_BY_ROUND);
                const superBosses = allBosses.filter((b) => b.isSuperBoss);
                const regBosses = allBosses.filter((b) => !b.isSuperBoss);
                const allZombies = BO.ZombiesData.ORDERED_PROGRESSION || BO.ZombiesData.ZOMBIE_TYPES;
                const rar = this.barracksRarityFilter || 'all';
                const zombies = rar === 'all' ? allZombies : allZombies.filter((z) => (z.rarity || 'easy') === rar);
                body.innerHTML = `
                    ${superBosses.length ? `
                    <div class="panel-title" style="color:#fde047;">👑 ${superBosses.length} COLOSSAL SUPER BOSSES (APEX ENCOUNTERS)</div>
                    <div class="card-grid" style="margin-bottom:14px;">
                        ${superBosses.map((b) => `
                            <div class="select-card active" style="border-color:#f59e0b;" data-tip-enemy="${b.id}"
                                data-tip-title="SUPER BOSS: ${escAttr(b.name)}"
                                data-tip="${escAttr(b.simpleDesc || b.weaknessText || '')}"
                                data-tip-sub="${escAttr(b.weaknessText || '')} | Reward: +${b.drops?.points || 5000} PTS">
                                <div class="card-head" style="color:#fde047;">👑 ${escAttr(b.name)}</div>
                                <div class="card-sub"><b>${escAttr(b.title || 'Apex Super Boss')}</b><br>HP: ${b.hp} • SPD: ${b.speed} • ATK: ${b.attack} • DEF: ${Math.round((b.defense || 0) * 100)}%<br>${escAttr(b.weaknessText || b.simpleDesc || '')}</div>
                            </div>`).join('')}
                    </div>` : ''}
                    <div class="panel-title" style="color:#f87171;">☠ ${regBosses.length} BOSS COMMANDERS</div>
                    <div class="card-grid" style="margin-bottom:14px;">
                        ${regBosses.map((b) => `
                            <div class="select-card active-zombies" data-tip-enemy="${b.id}"
                                data-tip-title="${b.bossRound ? 'ROUND ' + b.bossRound + ' BOSS: ' : 'BOSS: '}${escAttr(b.name)}"
                                data-tip="${escAttr(b.simpleDesc || '')}"
                                data-tip-sub="${escAttr(b.weaknessText || '')} | Reward: +${b.drops?.points || 1500} PTS">
                                <div class="card-head" style="color:#f87171;">${b.bossRound ? 'RD ' + b.bossRound + ': ' : ''}${escAttr(b.name)}</div>
                                <div class="card-sub"><b>${escAttr(b.title || 'Boss')}</b><br>HP: ${b.hp} • SPD: ${b.speed} • ATK: ${b.attack} • DEF: ${Math.round((b.defense || 0) * 100)}%<br>${escAttr(b.weaknessText || b.simpleDesc || '')}</div>
                            </div>`).join('')}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                        <div class="panel-title" style="margin:0;">${allZombies.length} UNIQUE ZOMBIE ARCHETYPES (SHOWING ${zombies.length})</div>
                        <div style="display:flex;gap:5px;flex-wrap:wrap;">
                            ${[['all', 'ALL'], ['easy', 'EASY'], ['normal', 'NORMAL'], ['hard', 'HARD']].map(([k, lbl]) =>
                                `<button class="btn btn-sm ${rar === k ? 'btn-primary' : ''}" data-brar="${k}">${lbl}</button>`).join('')}
                        </div>
                    </div>
                    <div class="card-grid">
                        ${zombies.map((z, idx) => {
                            const r = z.resistances || { bullet: 1, explosive: 1, fire: 1, headshot: 1.5 };
                            const rarCol = z.rarity === 'hard' ? '#f59e0b' : (z.rarity === 'normal' ? '#38bdf8' : '#4ade80');
                            return `<div class="select-card" data-tip-enemy="${z.id}"
                                data-tip-title="${escAttr(z.name)}"
                                data-tip="${escAttr(z.simpleDesc || '')}"
                                data-tip-sub="Habit: ${z.movementHabit || 'shamble'} • Attack: ${z.attackType || 'claw'} • Bullet ${Math.round((r.bullet || 1) * 100)}% / Blast ${Math.round((r.explosive || 1) * 100)}% / Fire ${Math.round((r.fire || 1) * 100)}%">
                                <div class="card-head">#${z.tier || (idx + 1)} ${escAttr(z.name)} <span style="font-size:10px;color:${rarCol};text-transform:uppercase;">${z.rarity || 'easy'}</span></div>
                                <div class="card-sub">HP: ${z.hp} • SPD: ${z.speed} • ATK: ${z.attack} • DEF: ${Math.round((z.defense || 0) * 100)}%<br>${escAttr(z.simpleDesc || '')}</div>
                            </div>`;
                        }).join('')}
                    </div>
                `;
                body.querySelectorAll('[data-brar]').forEach((btn) => {
                    btn.onclick = () => {
                        BO.Sound.playUIClick();
                        this.barracksRarityFilter = btn.dataset.brar;
                        this.renderBarracks();
                    };
                });
            } else if (this.barracksTab === 'record') {
                const kd = (stats.mpKills / Math.max(1, stats.mpDeaths)).toFixed(2);
                const acc = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) + '%' : '0%';
                body.innerHTML = `
                    <div class="card-grid">
                        <div class="select-card" data-tip-title="Military Rank" data-tip="Play matches to level up from 1 to 55 and unlock weapons and perks."><div class="card-head">RANK ${info.level} / 55</div><div class="card-sub">${info.rankName} • ${info.xpNeededForNext} XP to Next</div></div>
                        <div class="select-card" data-tip-title="Prestige Tier" data-tip="At Level 55 you can reset your rank for a shiny new emblem and +10% permanent XP boost!"><div class="card-head" style="color:${info.prestigeInfo.color}">${info.prestigeInfo.title}</div><div class="card-sub">+${info.prestige * 10}% Permanent XP Bonus • Tokens: ${BO.Save.data.player.tokens}</div></div>
                        <div class="select-card" data-tip-title="Multiplayer Stats" data-tip="Your lifetime Kill-to-Death ratio, wins, and bullet accuracy across offline bot matches."><div class="card-head">MP K/D: ${kd}</div><div class="card-sub">${stats.mpKills} Kills / ${stats.mpDeaths} Deaths • Wins: ${stats.mpWins} • Acc: ${acc}</div></div>
                        <div class="select-card" data-tip-title="Zombies Survival Stats" data-tip="Total zombies eliminated and your highest wave reached on each Zombies map."><div class="card-head">ZOMBIES KILLS: ${stats.zombiesKills}</div><div class="card-sub">Headshots: ${stats.zombiesHeadshots} • Der Bunker Best: ${stats.highestRoundByMap.der_bunker || 0} • Station Omega: ${stats.highestRoundByMap.station_omega || 0}</div></div>
                    </div>
                    <div style="margin-top:16px;display:flex;align-items:center;gap:14px;">
                        <button class="btn btn-primary" id="btn-enter-prestige" ${canPres ? '' : 'disabled'}
                            data-tip-title="Enter Prestige" data-tip="Once you hit Level 55, click here to earn the next Prestige badge and +10% permanent XP gain.">
                            ${canPres ? 'ENTER NEXT PRESTIGE' : 'PRESTIGE UNLOCKS AT RANK 55'}
                        </button>
                    </div>
                `;
                document.getElementById('btn-enter-prestige').onclick = () => {
                    if (BO.Progression.enterPrestige()) { this.updateAllRankBadges(); this.renderBarracks(); }
                };
            } else if (this.barracksTab === 'medals') {
                body.innerHTML = `<div class="card-grid">
                    ${Object.values(BO.ProgressionData.MEDALS).map((m) => `
                        <div class="select-card" data-tip-title="${escAttr(m.name)}" data-tip="Awards +${m.xp} bonus XP every time you pull this off in battle!">
                            <div class="card-head" style="color:${m.color}">${m.icon} ${m.name}</div>
                            <div class="card-sub">Earned: <b>${stats.medals[m.id] || 0}</b> • +${m.xp} XP</div>
                        </div>`).join('')}
                </div>`;
            } else if (this.barracksTab === 'challenges') {
                BO.Progression.evaluateChallenges();
                const chState = BO.Save.data.challenges;
                body.innerHTML = `<div class="card-grid">
                    ${BO.ProgressionData.CHALLENGES.map((c) => {
                        const st = chState[c.id] || { progress: 0, completed: false };
                        const pct = Math.min(100, Math.round((st.progress / c.target) * 100));
                        return `<div class="select-card ${st.completed ? 'active' : ''}" data-tip-title="${escAttr(c.name)}" data-tip="${escAttr(c.desc)} Rewards +${c.rewardXp} XP when finished!">
                            <div class="card-head">${c.name} ${st.completed ? '✓' : ''}</div>
                            <div class="card-sub">${c.desc} (${st.progress}/${c.target}) • +${c.rewardXp} XP</div>
                            <div class="xp-track" style="margin-top:6px;"><div class="xp-fill" style="width:${pct}%"></div></div>
                        </div>`;
                    }).join('')}
                </div>`;
            } else if (this.barracksTab === 'save') {
                body.innerHTML = `
                    <div class="panel-title">OFFLINE SAVE MANAGEMENT</div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                        <button class="btn btn-primary" id="btn-export-save" data-tip-title="Export Save" data-tip="Copies your entire offline profile into the text box so you can back it up.">EXPORT SAVE JSON</button>
                        <button class="btn" id="btn-import-save" data-tip-title="Import Save" data-tip="Paste a previously exported save below and click here to restore it.">IMPORT SAVE JSON</button>
                        <button class="btn btn-zombies" id="btn-reset-save" data-tip-title="Reset Everything" data-tip="Wipes all levels, camos, and classes back to Level 1.">RESET ALL PROGRESS</button>
                    </div>
                    <textarea id="save-json-box" rows="10" style="width:100%;margin-top:10px;background:#0d131d;color:#e2e8f0;border:1px solid var(--border-subtle);font-family:var(--font-mono);font-size:12px;" placeholder="Exported JSON appears here or paste save JSON to import..."></textarea>
                `;
                document.getElementById('btn-export-save').onclick = () => { document.getElementById('save-json-box').value = BO.Save.exportSave(); };
                document.getElementById('btn-import-save').onclick = () => {
                    try { BO.Save.importSave(document.getElementById('save-json-box').value); this.updateAllRankBadges(); alert('Save data imported successfully!'); }
                    catch (e) { alert('Import failed: ' + e.message); }
                };
                document.getElementById('btn-reset-save').onclick = () => {
                    if (window.confirm('Reset ALL rank, prestige, weapon levels, camos, and combat stats?')) {
                        BO.Save.resetSave(); this.updateAllRankBadges(); this.renderBarracks();
                    }
                };
            }
        }

        openLegend(mode) {
            this.legendTab = BO.ModeGuide.MODES[mode] ? mode : 'zombies';
            this.legendQuery = '';
            const search = document.getElementById('legend-search-input');
            search.value = '';
            document.getElementById('legend-search-clear').classList.add('hidden');
            this.modalLegend.classList.remove('hidden');
            this.renderLegend();
            document.getElementById('btn-legend-close').focus();
        }

        renderLegend(keepScroll = false) {
            const rail = document.getElementById('legend-tabs');
            const body = document.getElementById('legend-body');
            const search = document.getElementById('legend-search-input');
            const buttons = Object.entries(BO.ModeGuide.MODES);
            if (!keepScroll) {
                rail.innerHTML = buttons.map(([id, mode]) => `<button class="mode-guide-tab" data-mode="${id}"
                    role="tab" aria-controls="legend-body" id="guide-tab-${id}" aria-selected="${id === this.legendTab}">${mode.name}</button>`).join('');
                rail.querySelectorAll('[data-mode]').forEach((button) => {
                    button.onclick = () => {
                        BO.Sound.playUIClick();
                        this.legendTab = button.dataset.mode;
                        rail.querySelectorAll('[data-mode]').forEach((tab) => tab.setAttribute('aria-selected', String(tab === button)));
                        body.setAttribute('aria-labelledby', button.id);
                        body.innerHTML = BO.ModeGuide.render(this.legendTab, this.legendQuery);
                        search.placeholder = 'Search ' + BO.ModeGuide.MODES[this.legendTab].name;
                        body.scrollTop = 0;
                    };
                });
            }
            search.placeholder = 'Search ' + BO.ModeGuide.MODES[this.legendTab].name;
            body.setAttribute('aria-labelledby', 'guide-tab-' + this.legendTab);
            body.innerHTML = BO.ModeGuide.render(this.legendTab, this.legendQuery);
            body.scrollTop = 0;
        }

        /* ====================================================================
           ZOMBIES MOD MENU MODAL (CHECKBOXES FOR ALL CHEATS + ROUND PICKER)
        ==================================================================== */
        openModMenu() {
            this.renderModMenu();
            this.modalModMenu.classList.remove('hidden');
        }

        renderModMenu() {
            const body = document.getElementById('modmenu-body');
            if (!body) return;
            const defs = BO.Cheats.getDefinitions().filter((d) => !d.isMeta);
            const curRound = (BO.State.activeMode === 'zombies' && BO.ZombiesMode.active) ? BO.ZombiesMode.round : this.selectedStartRound;

            body.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary" id="btn-mod-all-on" data-tip-title="Enable All Cheats" data-tip="Turn ON every Zombies cheat below at once!">ENABLE ALL CHEATS</button>
                        <button class="btn btn-sm" id="btn-mod-all-off" data-tip-title="Disable All Cheats" data-tip="Turn OFF all active Zombies cheats.">DISABLE ALL CHEATS</button>
                        <button class="btn btn-sm" id="btn-mod-open-choose" style="border-color:#38bdf8;color:#38bdf8;">★ SANDBOX DIRECTOR (CHOOSE)</button>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;background:rgba(245,166,35,0.14);border:1px solid var(--amber);padding:6px 12px;">
                        <span style="font-size:12px;font-weight:800;color:#fde047;">PICK ROUND:</span>
                        <input type="number" id="mod-round-input" min="1" max="999" value="${curRound}" style="width:68px;background:#0d131d;color:#fde047;border:1px solid var(--amber);padding:4px 8px;font-family:var(--font-mono);font-weight:800;">
                        <button class="btn btn-sm btn-zombies" id="btn-mod-jump-round">${BO.State.activeMode === 'zombies' && BO.ZombiesMode.active ? 'JUMP TO ROUND' : 'SET START ROUND'}</button>
                    </div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
                    ${[1, 5, 10, 12, 24, 36, 48, 50, 60].map((r) => {
                        const isSuper = [12, 24, 36, 48, 60].includes(r);
                        return `<button class="btn btn-sm js-mod-quick-rnd" data-rnd="${r}" style="${isSuper ? 'border-color:#fbbf24;color:#fde047;' : ''}">RD ${r}${isSuper ? ' 👑 SUPER' : (r >= 5 ? ' (BOSS)' : '')}</button>`;
                    }).join('')}
                </div>
                <div id="mod-checkbox-list">
                    ${defs.map((d) => {
                        const checked = BO.Cheats.isActive(d.code, true);
                        return `
                            <label class="mod-row ${checked ? 'active' : ''}" data-code="${d.code}"
                                data-tip-title="Cheat: ${d.code}" data-tip="${escAttr(d.desc)}">
                                <div>
                                    <div style="font-size:15px;font-weight:800;color:${checked ? '#22c55e' : '#f8fafc'};">
                                        <span style="font-family:var(--font-mono);color:#fde047;">[${d.code}]</span> — ${d.name}
                                    </div>
                                    <div style="font-size:12px;color:var(--text-dim);margin-top:2px;">${d.desc}</div>
                                </div>
                                <input type="checkbox" class="js-mod-cb" data-code="${d.code}" ${checked ? 'checked' : ''}>
                            </label>
                        `;
                    }).join('')}
                </div>
            `;

            body.querySelectorAll('.js-mod-cb').forEach((cb) => {
                cb.onchange = (e) => {
                    BO.Sound.playUIClick();
                    const code = e.target.dataset.code;
                    BO.Cheats.setCheat(code, e.target.checked);
                    this.renderModMenu();
                    this.updateCheatMenuVisibility();
                };
            });

            document.getElementById('btn-mod-all-on').onclick = () => {
                BO.Sound.playPowerUp();
                defs.forEach((d) => {
                    if (d.code !== 'tiny' && d.code !== 'lock' && d.code !== 'resetlevel') BO.Cheats.setCheat(d.code, true);
                });
                this.renderModMenu();
                this.updateCheatMenuVisibility();
            };

            document.getElementById('btn-mod-all-off').onclick = () => {
                BO.Sound.playUIClick();
                BO.Cheats.disableAll();
                this.renderModMenu();
                this.updateCheatMenuVisibility();
            };

            const btnModChoose = document.getElementById('btn-mod-open-choose');
            if (btnModChoose) {
                btnModChoose.onclick = () => {
                    BO.Sound.playUIClick();
                    BO.Cheats.setCheat('choose', true);
                    this.modalModMenu.classList.add('hidden');
                    this.openChooseModal();
                };
            }

            const applyModRound = (rVal) => {
                const r = Math.max(1, Math.min(999, parseInt(rVal, 10) || 1));
                this.selectedStartRound = r;
                const mri = document.getElementById('menu-round-input');
                const pri = document.getElementById('pause-round-input');
                if (mri) mri.value = String(r);
                if (pri) pri.value = String(r);
                if (BO.State.activeMode === 'zombies' && BO.ZombiesMode.active) {
                    BO.ZombiesMode.jumpToRound(r);
                    this.modalModMenu.classList.add('hidden');
                    this.setPauseOpen(false);
                    if (BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                } else {
                    BO.Events.emit('hud:toast', { text: `START ROUND SET TO ROUND ${r}`, color: '#fde047' });
                    this.renderModMenu();
                }
            };

            document.getElementById('btn-mod-jump-round').onclick = () => {
                BO.Sound.playUIClick();
                applyModRound(document.getElementById('mod-round-input').value);
            };
            body.querySelectorAll('.js-mod-quick-rnd').forEach((btn) => {
                btn.onclick = () => {
                    BO.Sound.playUIClick();
                    applyModRound(btn.dataset.rnd);
                };
            });
        }

        /* ====================================================================
           WONDER NO MORE — MYSTERY BOX WEAPON PICKER MODAL
        ==================================================================== */
        openMysteryBoxPicker() {
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            this.renderMysteryBoxPicker();
            this.modalBoxPicker.classList.remove('hidden');
        }

        renderMysteryBoxPicker() {
            const tabsEl = document.getElementById('box-picker-tabs');
            const body = document.getElementById('box-picker-body');
            if (!tabsEl || !body) return;

            const tabs = [
                { id: 'all', label: `ALL ${BO.WeaponsData.listAll().length} WEAPONS` },
                { id: 'gun', label: `${BO.WeaponsData.listGuns().length} FIREARMS` },
                { id: 'melee', label: `${BO.WeaponsData.listMelee().length} MELEE WEAPONS` },
                { id: 'magic', label: `${BO.WeaponsData.listMagic().length} MAGIC WONDER WEAPONS` }
            ];
            tabsEl.innerHTML = tabs.map((t) => `
                <button class="btn btn-sm ${this.boxPickerTab === t.id ? 'btn-primary' : ''}" data-bptab="${t.id}">${t.label}</button>
            `).join('');
            tabsEl.querySelectorAll('[data-bptab]').forEach((b) => {
                b.onclick = () => { BO.Sound.playUIClick(); this.boxPickerTab = b.dataset.bptab; this.renderMysteryBoxPicker(); };
            });

            const list = BO.WeaponsData.listAll().filter((w) => this.boxPickerTab === 'all' || w.kind === this.boxPickerTab);
            body.innerHTML = `
                <div class="card-grid">
                    ${list.map((w) => {
                        const col = w.tier === 'magic' ? '#c084fc' : (w.tier === 'uncommon' ? '#38bdf8' : '#f5a623');
                        return `
                            <button class="select-card js-pick-box-weapon" data-wid="${w.id}" style="border-color:${col};"
                                data-tip-title="${escAttr(w.name)} (${w.tier.toUpperCase()})"
                                data-tip="${escAttr(w.description)}"
                                data-tip-sub="Click to immediately equip ${escAttr(w.name)} from the Mystery Box!">
                                <div class="card-head" style="color:${col};">${w.name}</div>
                                <div class="card-sub">${w.category} • ${w.damage}${w.pellets > 1 ? 'x' + w.pellets : ''} DMG • ${w.rpm} RPM<br>PaP: <b>${w.papName}</b></div>
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
            body.querySelectorAll('.js-pick-box-weapon').forEach((btn) => {
                btn.onclick = () => {
                    const wid = btn.dataset.wid;
                    const wSpec = BO.WeaponsData.get(wid);
                    BO.Sound.playPerkBuy();
                    if (BO.Player) {
                        BO.Player.giveWeapon(wid, false, false);
                    }
                    BO.Events.emit('hud:banner', {
                        title: `${wSpec.name.toUpperCase()} EQUIPPED!`,
                        sub: 'WONDER NO MORE — MYSTERY BOX SELECTION',
                        color: '#c084fc'
                    });
                    this.modalBoxPicker.classList.add('hidden');
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) {
                        BO.App._safePointerLock();
                    }
                };
            });
        }

        /* ====================================================================
           CUSTOM SANDBOX DIRECTOR MODAL ('choose' CHEAT)
        ==================================================================== */
        openChooseModal() {
            if (!this.modalChoose) return;
            BO.Cheats.setCheat('choose', true);
            this.renderChooseModal();
            this.modalChoose.classList.remove('hidden');
        }

        renderChooseModal() {
            const body = document.getElementById('choose-body');
            if (!body) return;
            if (!BO.Save.data.chooseConfig) BO.Save.data.chooseConfig = { startRound: 1, startPoints: 500, customZombiePool: [] };
            const cc = BO.Save.data.chooseConfig;
            if (!Array.isArray(cc.customZombiePool)) cc.customZombiePool = [];

            const allWeapons = BO.WeaponsData.listAll();
            const zombies = BO.ZombiesData.ZOMBIE_TYPES;

            body.innerHTML = `
                <div class="panel-title" style="color:#fde047;">1. STARTING ROUND &amp; STARTING LOADOUT</div>
                <div class="card-grid" style="margin-bottom:14px;">
                    <div class="select-card">
                        <div class="card-head">STARTING / CURRENT ROUND</div>
                        <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
                            <input type="number" id="ch-round" min="1" max="999" value="${cc.startRound || 1}" style="width:90px;background:#0d131d;color:#fde047;border:1px solid var(--amber);padding:6px;font-family:var(--font-mono);font-weight:800;">
                            <button class="btn btn-sm btn-zombies" id="ch-apply-round-now">APPLY ROUND</button>
                        </div>
                    </div>
                    <div class="select-card">
                        <div class="card-head">STARTING POINTS</div>
                        <select id="ch-points" style="width:100%;margin-top:8px;background:#0d131d;color:#fde047;border:1px solid var(--border-subtle);padding:8px;">
                            ${[500, 2500, 10000, 50000, 99999].map((pts) => `<option value="${pts}" ${cc.startPoints === pts ? 'selected' : ''}>${pts.toLocaleString()} PTS</option>`).join('')}
                        </select>
                    </div>
                    <div class="select-card">
                        <div class="card-head">STARTING PRIMARY WEAPON</div>
                        <select id="ch-primary" style="width:100%;margin-top:8px;background:#0d131d;color:#f8fafc;border:1px solid var(--border-subtle);padding:8px;">
                            <option value="">(Use Active Class Primary)</option>
                            ${allWeapons.map((w) => `<option value="${w.id}" ${cc.startPrimary === w.id ? 'selected' : ''}>${w.name} (${w.category})</option>`).join('')}
                        </select>
                    </div>
                    <div class="select-card">
                        <div class="card-head">STARTING SIDE WEAPON &amp; PaP TIER</div>
                        <select id="ch-secondary" style="width:100%;margin-top:6px;background:#0d131d;color:#f8fafc;border:1px solid var(--border-subtle);padding:6px;">
                            <option value="">(Use Active Class Sidearm)</option>
                            ${allWeapons.map((w) => `<option value="${w.id}" ${cc.startSecondary === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
                        </select>
                        <select id="ch-paptier" style="width:100%;margin-top:6px;background:#0d131d;color:#c084fc;border:1px solid var(--border-subtle);padding:6px;">
                            <option value="0" ${!cc.startPapTier ? 'selected' : ''}>Base Un-Upgraded (Tier 0)</option>
                            <option value="1" ${cc.startPapTier === 1 ? 'selected' : ''}>Pack-a-Punch Tier I</option>
                            <option value="2" ${cc.startPapTier === 2 ? 'selected' : ''}>Pack-a-Punch Tier II</option>
                            <option value="3" ${cc.startPapTier === 3 ? 'selected' : ''}>Pack-a-Punch Tier III (MAX)</option>
                        </select>
                    </div>
                </div>

                <div class="panel-title" style="color:#22c55e;">2. ADVANTAGES &amp; DISADVANTAGES (MODIFIERS)</div>
                <div class="card-grid" style="margin-bottom:14px;">
                    <label class="mod-row ${cc.startAllPerks ? 'active' : ''}" data-tip-title="Start With All 6 Perks" data-tip="Deploy with all six Perk-a-Colas already active."><span><b>Advantage:</b> Start With All 6 Perks</span><input type="checkbox" data-chkey="startAllPerks" ${cc.startAllPerks ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.advDoubleDamage ? 'active' : ''}" data-tip-title="2x Player Bullet Damage" data-tip="Doubles all firearm bullet damage you deal."><span><b>Advantage:</b> 2x Player Bullet Damage</span><input type="checkbox" data-chkey="advDoubleDamage" ${cc.advDoubleDamage ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.advInstaKill ? 'active' : ''}" data-tip-title="Permanent Insta-Kill" data-tip="Every hit kills standard zombies instantly."><span><b>Advantage:</b> Permanent Insta-Kill</span><input type="checkbox" data-chkey="advInstaKill" ${cc.advInstaKill ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.advDoublePoints ? 'active' : ''}" data-tip-title="Permanent 2x Points" data-tip="Doubles all points earned from hits and kills."><span><b>Advantage:</b> Permanent 2x Points</span><input type="checkbox" data-chkey="advDoublePoints" ${cc.advDoublePoints ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.advLowGravity ? 'active' : ''}" data-tip-title="Low Gravity Moon Jump" data-tip="Reduces gravity so you jump higher and fall slower."><span><b>Advantage:</b> Low Gravity Moon Jump</span><input type="checkbox" data-chkey="advLowGravity" ${cc.advLowGravity ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.disHeadshotsOnly ? 'active' : ''}" data-tip-title="Headshots Only" data-tip="Body shots deal zero damage; only headshots hurt enemies."><span><b style="color:#ef4444;">Disadvantage:</b> Headshots Only (Body = 0 DMG)</span><input type="checkbox" data-chkey="disHeadshotsOnly" ${cc.disHeadshotsOnly ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.disHalfDamage ? 'active' : ''}" data-tip-title="0.5x Player Damage" data-tip="Cuts all player weapon damage in half."><span><b style="color:#ef4444;">Disadvantage:</b> 0.5x Player Damage</span><input type="checkbox" data-chkey="disHalfDamage" ${cc.disHalfDamage ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.disOneHp ? 'active' : ''}" data-tip-title="1 HP Glass Cannon" data-tip="Locks you at 1 max HP with no armor."><span><b style="color:#ef4444;">Disadvantage:</b> 1 HP Glass Cannon (No Armor)</span><input type="checkbox" data-chkey="disOneHp" ${cc.disOneHp ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.disNoPerks ? 'active' : ''}" data-tip-title="No Perks Allowed" data-tip="Disables buying or keeping any Perk-a-Colas."><span><b style="color:#ef4444;">Disadvantage:</b> No Perks Allowed</span><input type="checkbox" data-chkey="disNoPerks" ${cc.disNoPerks ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.disTurboZombies ? 'active' : ''}" data-tip-title="Turbo Sprint Zombies" data-tip="Increases zombie movement speed by 45%."><span><b style="color:#ef4444;">Disadvantage:</b> Turbo Sprint Zombies (1.45x SPD)</span><input type="checkbox" data-chkey="disTurboZombies" ${cc.disTurboZombies ? 'checked' : ''}></label>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div class="panel-title" style="margin:0;border:none;color:#38bdf8;">3. EDIT ACTIVE ZOMBIE SPAWN POOL (${cc.customZombiePool.length === 0 ? 'DEFAULT ROUND POOL' : cc.customZombiePool.length + ' CUSTOM TYPES SELECTED'})</div>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-sm" id="ch-pool-all">SELECT ALL ${zombies.length}</button>
                        <button class="btn btn-sm" id="ch-pool-reset">USE DEFAULT ROUND POOL</button>
                    </div>
                </div>
                <div class="card-grid">
                    ${zombies.map((z) => {
                        const checked = cc.customZombiePool.includes(z.id);
                        return `
                            <label class="mod-row ${checked ? 'active' : ''}" data-tip-enemy="${z.id}" data-tip="${escAttr(z.simpleDesc || z.name)}" data-tip-sub="${checked ? 'In your custom pool' : 'Tick to add to your custom pool'}">
                                <div>
                                    <div style="font-weight:800;">#${z.tier} ${z.name}</div>
                                    <div style="font-size:11px;color:var(--text-dim);">HP ${z.hp} • SPD ${z.speed} • ${z.attackType}</div>
                                </div>
                                <input type="checkbox" class="js-ch-zpool" data-zid="${z.id}" ${checked ? 'checked' : ''}>
                            </label>
                        `;
                    }).join('')}
                </div>
            `;

            document.getElementById('ch-round').oninput = (e) => {
                cc.startRound = Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1));
                this.selectedStartRound = cc.startRound;
                BO.Save.save();
            };
            document.getElementById('ch-apply-round-now').onclick = () => {
                BO.Sound.playUIClick();
                const r = Math.max(1, Math.min(999, parseInt(document.getElementById('ch-round').value, 10) || 1));
                cc.startRound = r;
                this.selectedStartRound = r;
                BO.Save.save();
                if (BO.State.activeMode === 'zombies' && BO.ZombiesMode.active) {
                    BO.ZombiesMode.jumpToRound(r);
                }
            };
            document.getElementById('ch-points').onchange = (e) => {
                cc.startPoints = parseInt(e.target.value, 10) || 500;
                BO.Save.save();
                if (BO.State.activeMode === 'zombies' && BO.ZombiesMode.active) {
                    BO.ZombiesMode.points = cc.startPoints;
                }
            };
            document.getElementById('ch-primary').onchange = (e) => {
                cc.startPrimary = e.target.value;
                BO.Save.save();
                if (cc.startPrimary && BO.State.activeMode === 'zombies' && BO.Player) {
                    BO.Player.giveWeapon(cc.startPrimary, cc.startPapTier || 0, false);
                }
            };
            document.getElementById('ch-secondary').onchange = (e) => {
                cc.startSecondary = e.target.value;
                BO.Save.save();
                if (cc.startSecondary && BO.State.activeMode === 'zombies' && BO.Player) {
                    BO.Player.giveWeapon(cc.startSecondary, cc.startPapTier || 0, false);
                }
            };
            document.getElementById('ch-paptier').onchange = (e) => {
                cc.startPapTier = parseInt(e.target.value, 10) || 0;
                BO.Save.save();
            };
            body.querySelectorAll('[data-chkey]').forEach((cb) => {
                cb.onchange = (e) => {
                    BO.Sound.playUIClick();
                    cc[e.target.dataset.chkey] = e.target.checked;
                    BO.Save.save();
                    this.renderChooseModal();
                };
            });
            body.querySelectorAll('.js-ch-zpool').forEach((cb) => {
                cb.onchange = (e) => {
                    BO.Sound.playUIClick();
                    const zid = e.target.dataset.zid;
                    if (e.target.checked) {
                        if (!cc.customZombiePool.includes(zid)) cc.customZombiePool.push(zid);
                    } else {
                        cc.customZombiePool = cc.customZombiePool.filter((id) => id !== zid);
                    }
                    BO.Save.save();
                    this.renderChooseModal();
                };
            });
            document.getElementById('ch-pool-all').onclick = () => {
                BO.Sound.playUIClick();
                cc.customZombiePool = zombies.map((z) => z.id);
                BO.Save.save();
                this.renderChooseModal();
            };
            document.getElementById('ch-pool-reset').onclick = () => {
                BO.Sound.playUIClick();
                cc.customZombiePool = [];
                BO.Save.save();
                this.renderChooseModal();
            };
        }

        /* ====================================================================
           COMPREHENSIVE 7-TAB SETTINGS MODAL
        ==================================================================== */
        openSettings(tab) {
            if (tab) this.settingsTab = tab;
            this.isRebindingKey = false;
            this.renderSettings();
            this.modalSettings.classList.remove('hidden');
        }

        renderSettings() {
            const tabsEl = document.getElementById('settings-tabs');
            const body = document.getElementById('settings-body');
            if (!tabsEl || !body) return;

            const TABS = [
                { id: 'controls', label: 'CONTROLS & KEYBINDS' },
                { id: 'video', label: 'VIDEO & FULLSCREEN' },
                { id: 'gfx', label: 'GFX & BLOOD' },
                { id: 'sound', label: 'SOUND & AUDIO' },
                { id: 'cheats', label: 'CHEAT CODES (ZOMBIES)' },
                { id: 'save', label: 'SAVE GAME & SANDBOX' },
                { id: 'legend', label: 'GAME GUIDE' }
            ];

            tabsEl.innerHTML = TABS.map((t) => `
                <button class="btn btn-sm ${this.settingsTab === t.id ? 'btn-primary' : ''}" data-stab="${t.id}">${t.label}</button>
            `).join('');
            tabsEl.querySelectorAll('[data-stab]').forEach((b) => {
                b.onclick = () => {
                    BO.Sound.playUIClick();
                    this.isRebindingKey = false;
                    this.settingsTab = b.dataset.stab;
                    this.renderSettings();
                };
            });

            const s = BO.Settings.all;

            if (this.settingsTab === 'controls') {
                body.innerHTML = '<div class="cp-embed"></div>';
                BO.ControlsPanel.mount(body.querySelector('.cp-embed'));
            } else if (this.settingsTab === 'video') {
                const isFs = !!document.fullscreenElement;
                body.innerHTML = `
                    <div class="panel-title">DISPLAY, FULLSCREEN &amp; CAMERA</div>
                    <div class="setting-row" data-tip-title="Full Screen Mode" data-tip="Expand Blackout Ops to fill your entire monitor screen with no browser bars.">
                        <span>Full Screen Mode</span>
                        <button class="btn btn-sm ${isFs ? 'btn-primary' : ''}" id="btn-toggle-fullscreen">${isFs ? 'EXIT FULL SCREEN' : 'ENTER FULL SCREEN'}</button>
                    </div>
                    <div class="setting-row" data-tip-title="Field of View (FOV)" data-tip="Controls how wide your camera sees (70° to 110°). Higher FOV lets you spot enemies on your flanks!">
                        <span>Field of View (<span id="lbl-fov">${s.fov}</span>°)</span>
                        <input type="range" id="set-fov" min="70" max="110" step="2" value="${s.fov}">
                    </div>
                    <div class="setting-row" data-tip-title="Render Resolution Scale" data-tip="100% is sharpest native resolution; lower values boost frame rate on integrated GPUs.">
                        <span>Resolution Scale (<span id="lbl-res">${Math.round((s.resScale || 1) * 100)}%</span>)</span>
                        <input type="range" id="set-res" min="0.5" max="1.0" step="0.05" value="${s.resScale || 1}">
                    </div>
                    <div class="setting-row" data-tip-title="Brightness / Exposure" data-tip="Adjust 3D world brightness so dark bunker corners are easy to see.">
                        <span>Scene Brightness (<span id="lbl-exp">${Math.round((s.exposure || 1.08) * 100)}%</span>)</span>
                        <input type="range" id="set-exp" min="0.7" max="1.5" step="0.05" value="${s.exposure || 1.08}">
                    </div>
                    <div class="setting-row" data-tip-title="HUD Opacity" data-tip="Adjust how solid or transparent the on-screen HUD widgets appear.">
                        <span>HUD Opacity (<span id="lbl-hudop">${Math.round((s.hudOpacity ?? 1) * 100)}%</span>)</span>
                        <input type="range" id="set-hudop" min="0.3" max="1.0" step="0.05" value="${s.hudOpacity ?? 1}">
                    </div>
                    <div class="setting-row" data-tip-title="Crosshair Color" data-tip="Choose your center reticle color.">
                        <span>Crosshair Color</span>
                        <select id="set-chcol">
                            <option value="#f8fafc" ${s.crosshairColor === '#f8fafc' ? 'selected' : ''}>WHITE</option>
                            <option value="#22c55e" ${s.crosshairColor === '#22c55e' ? 'selected' : ''}>TACTICAL GREEN</option>
                            <option value="#38bdf8" ${s.crosshairColor === '#38bdf8' ? 'selected' : ''}>CYAN</option>
                            <option value="#f5a623" ${s.crosshairColor === '#f5a623' ? 'selected' : ''}>AMBER</option>
                            <option value="#ef4444" ${s.crosshairColor === '#ef4444' ? 'selected' : ''}>CRIMSON RED</option>
                        </select>
                    </div>
                    <div class="setting-row" data-tip-title="Crosshair Visibility" data-tip="Show dynamic expanding crosshairs or hide them for hardcore realism.">
                        <span>Crosshair Style</span>
                        <select id="set-chstyle">
                            <option value="dynamic" ${s.crosshairStyle !== 'off' ? 'selected' : ''}>DYNAMIC 4-TICK + DOT</option>
                            <option value="off" ${s.crosshairStyle === 'off' ? 'selected' : ''}>HIDDEN (HARDCORE)</option>
                        </select>
                    </div>
                    <div class="setting-row" data-tip-title="FPS Counter" data-tip="Show live frames-per-second counter in the top-right corner.">
                        <span>Show Live FPS Counter</span>
                        <input type="checkbox" id="set-fps" ${s.showFps ? 'checked' : ''}>
                    </div>
                `;
                document.getElementById('btn-toggle-fullscreen').onclick = () => {
                    BO.Sound.playUIClick();
                    try {
                        if (!document.fullscreenElement) {
                            document.documentElement.requestFullscreen().then(() => this.renderSettings()).catch(() => {});
                        } else {
                            document.exitFullscreen().then(() => this.renderSettings()).catch(() => {});
                        }
                    } catch (e) {}
                };
                document.getElementById('set-fov').oninput = (e) => {
                    const v = Number(e.target.value);
                    document.getElementById('lbl-fov').textContent = String(v);
                    BO.Settings.set('fov', v);
                };
                document.getElementById('set-res').oninput = (e) => {
                    const v = Number(e.target.value);
                    document.getElementById('lbl-res').textContent = Math.round(v * 100) + '%';
                    BO.Settings.set('resScale', v);
                };
                document.getElementById('set-exp').oninput = (e) => {
                    const v = Number(e.target.value);
                    document.getElementById('lbl-exp').textContent = Math.round(v * 100) + '%';
                    BO.Settings.set('exposure', v);
                };
                document.getElementById('set-hudop').oninput = (e) => {
                    const v = Number(e.target.value);
                    document.getElementById('lbl-hudop').textContent = Math.round(v * 100) + '%';
                    BO.Settings.set('hudOpacity', v);
                };
                document.getElementById('set-chcol').onchange = (e) => BO.Settings.set('crosshairColor', e.target.value);
                document.getElementById('set-chstyle').onchange = (e) => BO.Settings.set('crosshairStyle', e.target.value);
                document.getElementById('set-fps').onchange = (e) => BO.Settings.set('showFps', e.target.checked);
            } else if (this.settingsTab === 'gfx') {
                body.innerHTML = `
                    <div class="panel-title">GRAPHICS QUALITY, BLOOD &amp; VISUAL FX</div>
                    <div class="setting-row" data-tip-title="Graphics Preset" data-tip="Controls shadow map resolution, particle density, and pixel ratio cap.">
                        <span>3D Graphics &amp; Shadow Quality</span>
                        <select id="set-quality">
                            <option value="high" ${s.quality === 'high' ? 'selected' : ''}>HIGH (2048px Soft Shadows &amp; Full Particles)</option>
                            <option value="medium" ${s.quality === 'medium' ? 'selected' : ''}>MEDIUM (1024px Shadows &amp; Balanced FX)</option>
                            <option value="low" ${s.quality === 'low' ? 'selected' : ''}>LOW (Fastest FPS / No Shadows)</option>
                        </select>
                    </div>
                    <div class="setting-row" data-tip-title="Blood & Gore Level" data-tip="Choose how much blood splatter and zombie decapitation gore appears on hits.">
                        <span>Blood &amp; Gore Intensity</span>
                        <select id="set-blood">
                            <option value="off" ${s.bloodLevel === 'off' ? 'selected' : ''}>OFF (No Blood Splatter)</option>
                            <option value="normal" ${(!s.bloodLevel || s.bloodLevel === 'normal') ? 'selected' : ''}>NORMAL (Standard Tactical Blood)</option>
                            <option value="ultra" ${s.bloodLevel === 'ultra' ? 'selected' : ''}>ULTRA GORE (2x Blood Burst &amp; Decapitations)</option>
                        </select>
                    </div>
                    <div class="setting-row" data-tip-title="Screen Shake Intensity" data-tip="Controls how much explosions, boss slams, and heavy gunfire shake the camera.">
                        <span>Camera Screen Shake (<span id="lbl-shake">${Math.round((s.screenShake ?? 1) * 100)}%</span>)</span>
                        <input type="range" id="set-shake" min="0" max="1.5" step="0.1" value="${s.screenShake ?? 1}">
                    </div>
                    <div class="setting-row" data-tip-title="Dynamic Muzzle & Explosion Lights" data-tip="Illuminates walls when firing guns or detonating explosives.">
                        <span>Dynamic Muzzle &amp; Explosion Lighting</span>
                        <input type="checkbox" id="set-dynlights" ${s.dynamicLights !== false ? 'checked' : ''}>
                    </div>
                    <div class="setting-row" data-tip-title="Bullet Impact Sparks & Decals" data-tip="Spawns impact sparks and debris when bullets strike walls.">
                        <span>Wall Impact Sparks &amp; Debris</span>
                        <input type="checkbox" id="set-decals" ${s.wallDecals !== false ? 'checked' : ''}>
                    </div>
                    <div class="setting-row" data-tip-title="Cinematic Post-Processing" data-tip="HDR rendering with bloom, filmic colour grading, lens vignette and damage grading. Turned off automatically on Low quality.">
                        <span>Cinematic Post-Processing</span>
                        <input type="checkbox" id="set-postfx" ${s.postFx !== false ? 'checked' : ''}>
                    </div>
                    <div class="setting-row" data-tip-title="Bloom Intensity" data-tip="How strongly bright lights, muzzle flashes and the sun glow.">
                        <span>Bloom (<span id="lbl-bloom">${Math.round((s.bloom ?? 1) * 100)}%</span>)</span>
                        <input type="range" id="set-bloom" min="0" max="2" step="0.1" value="${s.bloom ?? 1}">
                    </div>
                    <div class="setting-row" data-tip-title="Film Grain" data-tip="Subtle animated grain that adds texture to the image.">
                        <span>Film Grain</span>
                        <input type="checkbox" id="set-grain" ${s.filmGrain !== false ? 'checked' : ''}>
                    </div>
                    <div class="setting-row" data-tip-title="Chromatic Aberration" data-tip="Slight colour fringing toward the screen edges, like a real lens.">
                        <span>Chromatic Aberration</span>
                        <input type="checkbox" id="set-ca" ${s.chromaticAberration !== false ? 'checked' : ''}>
                    </div>
                    <div class="setting-row" data-tip-title="Ambient Occlusion" data-tip="Soft contact shadows in corners, under objects and where walls meet the floor. Costs some performance.">
                        <span>Ambient Occlusion</span>
                        <input type="checkbox" id="set-ssao" ${s.ssao !== false ? 'checked' : ''}>
                    </div>
                    <div class="setting-row" data-tip-title="Eye Adaptation" data-tip="Exposure adjusts gradually when you move between dark interiors and bright exteriors, like a real eye or camera.">
                        <span>Eye Adaptation (Auto Exposure)</span>
                        <input type="checkbox" id="set-autoexp" ${s.autoExposure !== false ? 'checked' : ''}>
                    </div>
                    <div class="setting-row" data-tip-title="Ambient Particles" data-tip="Dust motes drifting in the air around you. Applies from the next match.">
                        <span>Ambient Dust Particles</span>
                        <input type="checkbox" id="set-ambient" ${s.ambientParticles !== false ? 'checked' : ''}>
                    </div>
                `;
                document.getElementById('set-ssao').onchange = (e) => BO.Settings.set('ssao', e.target.checked);
                document.getElementById('set-autoexp').onchange = (e) => BO.Settings.set('autoExposure', e.target.checked);
                document.getElementById('set-ambient').onchange = (e) => BO.Settings.set('ambientParticles', e.target.checked);
                document.getElementById('set-postfx').onchange = (e) => BO.Settings.set('postFx', e.target.checked);
                document.getElementById('set-bloom').oninput = (e) => {
                    const v = Number(e.target.value);
                    document.getElementById('lbl-bloom').textContent = Math.round(v * 100) + '%';
                    BO.Settings.set('bloom', v);
                };
                document.getElementById('set-grain').onchange = (e) => BO.Settings.set('filmGrain', e.target.checked);
                document.getElementById('set-ca').onchange = (e) => BO.Settings.set('chromaticAberration', e.target.checked);
                document.getElementById('set-quality').onchange = (e) => BO.Settings.set('quality', e.target.value);
                document.getElementById('set-blood').onchange = (e) => BO.Settings.set('bloodLevel', e.target.value);
                document.getElementById('set-shake').oninput = (e) => {
                    const v = Number(e.target.value);
                    document.getElementById('lbl-shake').textContent = Math.round(v * 100) + '%';
                    BO.Settings.set('screenShake', v);
                };
                document.getElementById('set-dynlights').onchange = (e) => BO.Settings.set('dynamicLights', e.target.checked);
                document.getElementById('set-decals').onchange = (e) => BO.Settings.set('wallDecals', e.target.checked);
            } else if (this.settingsTab === 'sound') {
                body.innerHTML = `
                    <div class="panel-title">WEBAUDIO SYNTHESIS &amp; VOLUME MIXER</div>
                    <div class="setting-row" data-tip-title="Master Volume" data-tip="Overall volume for the entire game.">
                        <span>Master Volume (<span id="lbl-mvol">${Math.round(s.masterVolume * 100)}%</span>)</span>
                        <input type="range" id="set-mvol" min="0" max="1" step="0.05" value="${s.masterVolume}">
                    </div>
                    <div class="setting-row" data-tip-title="Gunshots & Explosions Volume" data-tip="Volume of weapons, reloads, perks, and explosions.">
                        <span>Gunshots &amp; SFX Volume (<span id="lbl-sfx">${Math.round(s.sfxVolume * 100)}%</span>)</span>
                        <input type="range" id="set-sfx" min="0" max="1" step="0.05" value="${s.sfxVolume}">
                    </div>
                    <div class="setting-row" data-tip-title="Music Volume" data-tip="Volume of menu and Zombies dark ambient music.">
                        <span>Music Volume (<span id="lbl-mus">${Math.round(s.musicVolume * 100)}%</span>)</span>
                        <input type="range" id="set-mus" min="0" max="1" step="0.05" value="${s.musicVolume}">
                    </div>
                    <div class="setting-row" data-tip-title="Hitmarker Volume" data-tip="Volume of the crisp COD hitmarker thud on enemy hits.">
                        <span>Hitmarker Sound Volume (<span id="lbl-hmvol">${Math.round((s.hitmarkerVolume ?? 1) * 100)}%</span>)</span>
                        <input type="range" id="set-hmvol" min="0" max="1" step="0.05" value="${s.hitmarkerVolume ?? 1}">
                    </div>
                    <div class="setting-row" data-tip-title="Zombie Voice Volume" data-tip="Volume of zombie groans, shrieks, and boss roars.">
                        <span>Zombie Voices Volume (<span id="lbl-zvol">${Math.round((s.zombieVolume ?? 0.9) * 100)}%</span>)</span>
                        <input type="range" id="set-zvol" min="0" max="1" step="0.05" value="${s.zombieVolume ?? 0.9}">
                    </div>
                    <div style="margin-top:12px;">
                        <button class="btn btn-sm btn-primary" id="btn-test-audio">TEST SOUND &amp; HITMARKER</button>
                    </div>
                `;
                const bindRange = (id, lblId, key) => {
                    document.getElementById(id).oninput = (e) => {
                        const v = Number(e.target.value);
                        document.getElementById(lblId).textContent = Math.round(v * 100) + '%';
                        BO.Settings.set(key, v);
                    };
                };
                bindRange('set-mvol', 'lbl-mvol', 'masterVolume');
                bindRange('set-sfx', 'lbl-sfx', 'sfxVolume');
                bindRange('set-mus', 'lbl-mus', 'musicVolume');
                bindRange('set-hmvol', 'lbl-hmvol', 'hitmarkerVolume');
                bindRange('set-zvol', 'lbl-zvol', 'zombieVolume');
                document.getElementById('btn-test-audio').onclick = () => {
                    BO.Sound.ensureContext();
                    BO.Sound.playHitmarker(true, true);
                };
            } else if (this.settingsTab === 'cheats') {
                const defs = BO.Cheats.getDefinitions();
                const modUnlocked = BO.Cheats.isModMenuUnlocked();
                body.innerHTML = `
                    <div class="panel-title" style="color:#fde047;">ZOMBIES CHEAT CODE TERMINAL (ZOMBIES MODE ONLY)</div>
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">
                        <input type="text" id="cheat-code-input" placeholder="Type cheat code (e.g. cheats, megaman, infammo, infmoney, bighead)..."
                            style="flex:1;min-width:240px;background:#0d131d;color:#fde047;border:1px solid var(--amber);padding:10px 14px;font-family:var(--font-mono);font-size:15px;font-weight:800;">
                        <button class="btn btn-primary" id="btn-apply-cheat" data-tip-title="Toggle Cheat Code" data-tip="Enable or disable the cheat code typed in the box.">TOGGLE CHEAT</button>
                        <button class="btn btn-sm" id="btn-cheats-disable-all" style="border-color:#ef4444;color:#f87171;">DISABLE ALL CHEATS</button>
                        ${modUnlocked ? `<button class="btn" id="btn-settings-open-modmenu" style="border-color:#fde047;color:#fde047;">★ OPEN MOD MENU</button>` : ''}
                    </div>
                    <div id="cheat-feedback-msg" style="min-height:22px;font-size:13px;font-weight:800;color:#22c55e;margin-bottom:10px;"></div>
                    <table class="legend-table">
                        <thead>
                            <tr><th>CODE</th><th>NAME</th><th>TOGGLE</th><th>DESCRIPTION (CLICK ROW OR BUTTON TO ENABLE / DISABLE)</th></tr>
                        </thead>
                        <tbody>
                            ${defs.map((d) => {
                                const on = d.code === 'cheats' ? modUnlocked : BO.Cheats.isActive(d.code, true);
                                return `
                                    <tr class="js-quick-cheat-row" data-code="${d.code}" style="cursor:pointer;"
                                        data-tip-title="Click to Toggle: ${d.code}" data-tip="${escAttr(d.desc)}">
                                        <td style="font-family:var(--font-mono);color:#fde047;font-weight:800;">${d.code}</td>
                                        <td><b>${d.name}</b></td>
                                        <td><button type="button" class="btn btn-sm" style="min-width:84px;border-color:${on ? '#22c55e' : '#64748b'};color:${on ? '#4ade80' : '#94a3b8'};background:${on ? 'rgba(34,197,94,0.14)' : 'rgba(15,23,42,0.75)'};">${on ? 'ON · TURN OFF' : 'OFF · TURN ON'}</button></td>
                                        <td>${d.desc}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
                const inputEl = document.getElementById('cheat-code-input');
                const msgEl = document.getElementById('cheat-feedback-msg');
                const submitCheat = (raw) => {
                    const res = BO.Cheats.enterCode(raw);
                    if (res.ok) {
                        if (res.enabled) BO.Sound.playPowerUp();
                        else BO.Sound.playUIClick();
                        this.updateCheatMenuVisibility();
                        this.renderSettings();
                        const newMsg = document.getElementById('cheat-feedback-msg');
                        if (newMsg) {
                            newMsg.style.color = res.enabled ? '#22c55e' : '#facc15';
                            newMsg.textContent = (res.enabled ? '✓ ' : '○ ') + res.msg;
                        }
                    } else if (msgEl) {
                        BO.Sound.playEmptyClick();
                        msgEl.style.color = '#ef4444';
                        msgEl.textContent = '✕ ' + res.msg;
                    }
                };
                document.getElementById('btn-apply-cheat').onclick = () => submitCheat(inputEl.value);
                const btnDisableAll = document.getElementById('btn-cheats-disable-all');
                if (btnDisableAll) {
                    btnDisableAll.onclick = () => {
                        BO.Sound.playUIClick();
                        BO.Cheats.disableAll();
                        this.updateCheatMenuVisibility();
                        this.renderSettings();
                        const newMsg = document.getElementById('cheat-feedback-msg');
                        if (newMsg) {
                            newMsg.style.color = '#facc15';
                            newMsg.textContent = '○ All Zombies cheats disabled.';
                        }
                    };
                }
                inputEl.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submitCheat(inputEl.value);
                    }
                };
                body.querySelectorAll('.js-quick-cheat-row').forEach((row) => {
                    row.onclick = () => submitCheat(row.dataset.code);
                });
                const btnOpenMod = document.getElementById('btn-settings-open-modmenu');
                if (btnOpenMod) {
                    btnOpenMod.onclick = () => {
                        BO.Sound.playUIClick();
                        this.modalSettings.classList.add('hidden');
                        this.openModMenu();
                    };
                }
            } else if (this.settingsTab === 'save') {
                body.innerHTML = `
                    <div class="panel-title">SANDBOX MODE &amp; OFFLINE SAVE DATA</div>
                    <div class="setting-row" data-tip-title="Sandbox Unlock-All" data-tip="Immediately unlocks all 50 Firearms, 10 Melee Weapons, 10 Magic Weapons, all attachments, all camos, and all powers in Create-a-Class!">
                        <span>Sandbox Mode: Unlock All 70 Weapons, Attachments, Camos &amp; Perks</span>
                        <input type="checkbox" id="set-unlockall" ${s.unlockAll ? 'checked' : ''}>
                    </div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                        <button class="btn btn-primary" id="btn-set-export-save">EXPORT SAVE JSON</button>
                        <button class="btn" id="btn-set-import-save">IMPORT SAVE JSON</button>
                        <button class="btn btn-zombies" id="btn-set-reset-save">RESET ALL PROGRESS</button>
                    </div>
                    <textarea id="set-save-json-box" rows="9" style="width:100%;margin-top:10px;background:#0d131d;color:#e2e8f0;border:1px solid var(--border-subtle);font-family:var(--font-mono);font-size:12px;" placeholder="Click EXPORT SAVE JSON to copy your offline profile or paste a backup JSON here to import..."></textarea>
                `;
                document.getElementById('set-unlockall').onchange = (e) => {
                    BO.Settings.set('unlockAll', e.target.checked);
                    if (BO.State.screen === 'gunsmith') BO.GunsmithUI.render();
                };
                document.getElementById('btn-set-export-save').onclick = () => {
                    document.getElementById('set-save-json-box').value = BO.Save.exportSave();
                };
                document.getElementById('btn-set-import-save').onclick = () => {
                    try {
                        BO.Save.importSave(document.getElementById('set-save-json-box').value);
                        this.updateAllRankBadges();
                        alert('Save data imported successfully!');
                    } catch (e) {
                        alert('Import failed: ' + e.message);
                    }
                };
                document.getElementById('btn-set-reset-save').onclick = () => {
                    if (window.confirm('Reset ALL rank, prestige, weapon levels, camos, and combat stats?')) {
                        BO.Save.resetSave();
                        this.updateAllRankBadges();
                        this.renderSettings();
                    }
                };
            } else if (this.settingsTab === 'legend') {
                body.innerHTML = `<div class="panel-title">GAME GUIDE</div>
                    <p>Choose a mode to find its rules, controls, progression and advice.</p>
                    <button class="btn btn-primary" id="btn-set-open-legend">OPEN GAME GUIDE</button>`;
                document.getElementById('btn-set-open-legend').onclick = () => {
                    BO.Sound.playUIClick();
                    this.modalSettings.classList.add('hidden');
                    this.openLegend(BO.State.activeMode);
                };
            }
        }

        /* ====================================================================
           AFTER ACTION REPORT
        ==================================================================== */
        showAAR(report) {
            if (document.pointerLockElement) document.exitPointerLock();
            this.showScreen('aar');
            const title = document.getElementById('aar-title');
            const sub = document.getElementById('aar-sub');
            const statsEl = document.getElementById('aar-stats');
            const sbWrap = document.getElementById('aar-scoreboard');

            title.textContent = report.title;
            title.style.color = report.victory ? '#22c55e' : (report.mode === 'zombies' ? '#dc2626' : '#ef4444');
            sub.textContent = `${report.mapName} • TIME ${report.time}`;

            if (report.mode === 'survival') {
                statsEl.innerHTML = `
                    <div class="select-card"><div class="card-head">${report.kills}</div><div class="card-sub">Hostiles eliminated</div></div>
                    <div class="select-card"><div class="card-head">${report.salvaged}</div><div class="card-sub">Supplies scavenged</div></div>
                    <div class="select-card"><div class="card-head">${report.breaches}</div><div class="card-sub">Structure sections destroyed</div></div>
                    <div class="select-card"><div class="card-head">${report.recoveredCore ? 'SECURED' : 'MISSING'}</div><div class="card-sub">Research core</div></div>`;
                sbWrap.innerHTML = '';
            } else if (report.mode === 'zombies') {
                statsEl.innerHTML = `
                    <div class="select-card"><div class="card-head">ROUND ${BO.Math.toRoman(report.round)}</div><div class="card-sub">Waves Survived</div></div>
                    <div class="select-card"><div class="card-head">${report.kills} KILLS</div><div class="card-sub">${report.headshots} Headshots</div></div>
                    <div class="select-card"><div class="card-head">${report.points} PTS</div><div class="card-sub">Remaining Score</div></div>
                `;
                sbWrap.innerHTML = '';
            } else if (report.mode === 'td') {
                statsEl.innerHTML = `
                    <div class="select-card"><div class="card-head">WAVE ${report.wave}</div><div class="card-sub">Castle Waves Held</div></div>
                    <div class="select-card"><div class="card-head">${report.kills} KILLS</div><div class="card-sub">${report.headshots} Headshots</div></div>
                    <div class="select-card"><div class="card-head">${report.score} GOLD</div><div class="card-sub">Gold Remaining</div></div>
                `;
                sbWrap.innerHTML = '';
            } else {
                const isFFA = report.modeType === 'FFA' || report.modeType === 'GUN_GAME';
                const board = report.scoreboard || [];
                const topRival = board.filter((r) => !r.isPlayer).sort((a, b) => b.kills - a.kills || b.score - a.score)[0];
                const place = Math.max(1, board.findIndex((r) => r.isPlayer) + 1);
                const mainHead = isFFA
                    ? `${report.kills} K vs ${topRival ? topRival.kills : 0} K`
                    : `${report.teamScores[0]} - ${report.teamScores[1]}`;
                const mainSub = isFFA ? `${report.modeType} Standing (#${place})` : `${report.modeType} Final Score`;
                statsEl.innerHTML = `
                    <div class="select-card"><div class="card-head">${mainHead}</div><div class="card-sub">${mainSub}</div></div>
                    <div class="select-card"><div class="card-head">${report.kills} K / ${report.deaths} D</div><div class="card-sub">${report.headshots} Headshots</div></div>
                    <div class="select-card"><div class="card-head">${report.score} SCORE</div><div class="card-sub">Match Points</div></div>
                `;
                sbWrap.innerHTML = `<table class="sb-table"><thead><tr><th>OPERATOR</th><th>TEAM</th><th>K</th><th>D</th><th>SCORE</th></tr></thead><tbody>
                    ${board.map((r) => `
                        <tr class="${r.isPlayer ? 'sb-row-player' : ''}">
                            <td>${r.name}</td><td>${isFFA ? (r.isPlayer ? 'YOU' : 'FFA') : (r.team === 0 ? 'ALLIES' : 'HOSTILES')}</td><td>${r.kills}</td><td>${r.deaths}</td><td>${r.score}</td>
                        </tr>`).join('')}
                </tbody></table>`;
            }
            this.updateAllRankBadges();
        }

        /* ====================================================================
           MID-BATTLE CHANGE CLASS MODAL (MULTIPLAYER)
        ==================================================================== */
        openChangeClassModal() {
            if (!this.modalMpClass || BO.State.activeMode !== 'mp') return;
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            const classes = BO.Loadout.getClasses();
            const cur = BO.Loadout.getSelectedClassIndex();
            const host = document.getElementById('mp-class-list');
            host.innerHTML = classes.map((c, i) => `
                <button class="select-card ${i === cur ? 'active' : ''}" data-mpcidx="${i}">
                    <div class="card-head">${i + 1}. ${c.name} ${i === cur ? '<span style="color:#fde047">[CURRENT]</span>' : ''}</div>
                    <div class="card-sub">Primary: <b>${BO.WeaponsData.get(c.primary.id).shortName}</b> • Side: <b>${BO.WeaponsData.get(c.secondary.id).shortName}</b><br>[G] ${c.lethal} • [Q] ${c.tactical} • [X] ${c.fieldUpgrade}</div>
                </button>
            `).join('');
            host.querySelectorAll('[data-mpcidx]').forEach((btn) => {
                btn.onclick = () => {
                    BO.Sound.playUIClick();
                    BO.MPMode.queueClassChange(Number(btn.dataset.mpcidx));
                    this.modalMpClass.classList.add('hidden');
                    if (BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            });
            this.modalMpClass.classList.remove('hidden');
        }

        /* ====================================================================
           TOWER DEFENSE SHOPKEEPER MODAL (30s INTERMISSION)
        ==================================================================== */
        openTdShopModal() {
            const td = BO.TowerDefenseMode;
            if (!this.modalTdShop || !td || !td.active) return;
            if (td.state !== 'intermission') {
                BO.Events.emit('hud:toast', { text: 'SHOPKEEPER ONLY OPENS DURING 30s INTERMISSION!', color: '#ef4444' });
                return;
            }
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            this.renderTdShop();
            this.modalTdShop.classList.remove('hidden');
        }

        renderTdShop() {
            const td = BO.TowerDefenseMode;
            const body = document.getElementById('td-shop-body');
            const goldEl = document.getElementById('td-shop-gold');
            const subEl = document.getElementById('td-shop-sub');
            if (!body || !td) return;

            if (td.state !== 'intermission') {
                if (this.modalTdShop) this.modalTdShop.classList.add('hidden');
                return;
            }

            if (goldEl) goldEl.textContent = `GOLD: ${td.gold}`;
            if (subEl) subEl.textContent = `Intermission: ${Math.ceil(td.intermissionTimer)}s remaining • Press [N] or button above to skip wait!`;

            const weapons = td.shopWeapons || [];
            const cycleDeps = td.getCycleDeployables ? td.getCycleDeployables() : [];
            const items = td.getShopItems();

            body.innerHTML = `
                <div class="panel-title" style="color:#fde047;">5 ROLLED WEAPONS (60% COMMON / 10% COM. MELEE / 5% UNC. MELEE / 15% UNCOMMON / 5% FREE / 5% MAGIC)</div>
                <div class="card-grid" style="margin-bottom:14px;">
                    ${weapons.map((o) => `
                        <button class="select-card js-td-buy-w" data-slot="${o.slotIndex}" ${o.sold ? 'disabled' : ''} style="border-color:${o.color};">
                            <div style="font-size:10px;font-weight:800;color:${o.color};">${o.badge}</div>
                            <div class="card-head" style="margin-top:2px;">${o.spec.name}</div>
                            <div class="card-sub">${o.spec.category} • ${o.spec.damage}${o.spec.pellets > 1 ? 'x' + o.spec.pellets : ''} DMG • ${o.spec.rpm} RPM</div>
                            <div style="margin-top:6px;font-family:var(--font-mono);font-weight:800;color:${o.sold ? '#64748b' : (o.cost === 0 ? '#22c55e' : '#fde047')};">
                                ${o.sold ? 'PURCHASED ✓' : (o.cost === 0 ? '★ FREE WEAPON (0 GOLD)!' : `${o.cost} GOLD`)}
                            </div>
                        </button>
                    `).join('')}
                </div>
                <div class="panel-title" style="color:#c084fc;">★ ROTATING SUPPORT DEPLOYABLES (6 ROLLED THIS CYCLE FROM 20 UNIQUE DEPLOYABLES!)</div>
                <div class="card-grid" style="margin-bottom:14px;">
                    ${cycleDeps.map((d) => `
                        <button class="select-card js-td-buy-dep" data-depid="${d.id}" style="border-color:${d.color || '#c084fc'};">
                            <div class="card-head" style="color:${d.color || '#c084fc'};">${d.name}</div>
                            <div class="card-sub">${d.desc}</div>
                            <div style="margin-top:6px;font-family:var(--font-mono);font-weight:800;color:#fde047;">${d.cost} GOLD</div>
                        </button>
                    `).join('')}
                </div>
                <div class="panel-title" style="color:#38bdf8;">CORE CASTLE DEFENSES, ALLIES &amp; HEAVY ORDNANCE</div>
                <div class="card-grid">
                    ${items.map((it) => `
                        <button class="select-card js-td-buy-it" data-itid="${it.id}">
                            <div class="card-head" style="color:#38bdf8;">${it.name}</div>
                            <div class="card-sub">${it.desc}</div>
                            <div style="margin-top:6px;font-family:var(--font-mono);font-weight:800;color:#fde047;">${it.cost} GOLD</div>
                        </button>
                    `).join('')}
                </div>
            `;

            body.querySelectorAll('.js-td-buy-w').forEach((btn) => {
                btn.onclick = () => {
                    td.buyShopWeapon(Number(btn.dataset.slot));
                    this.renderTdShop();
                };
            });
            body.querySelectorAll('.js-td-buy-dep').forEach((btn) => {
                btn.onclick = () => {
                    td.buyDeployable(btn.dataset.depid);
                    this.renderTdShop();
                };
            });
            body.querySelectorAll('.js-td-buy-it').forEach((btn) => {
                btn.onclick = () => {
                    td.buyShopItem(btn.dataset.itid);
                    this.renderTdShop();
                };
            });
        }

        /* ====================================================================
           TOWER DEFENSE FIELD ATTACHMENT WORKBENCH STATION MODAL
        ==================================================================== */
        openTdAttachmentModal() {
            if (!this.modalTdAttachments || !BO.Player || !BO.Player.activeWeapon) return;
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            this.renderTdAttachments();
            this.modalTdAttachments.classList.remove('hidden');
        }

        renderTdAttachments() {
            const body = document.getElementById('td-att-body');
            const sub = document.getElementById('td-att-sub');
            const w = BO.Player ? BO.Player.activeWeapon : null;
            if (!body || !w) return;
            if (sub) sub.textContent = `Active Weapon: ${w.stats.name} — Click any attachment below to equip or unequip immediately!`;

            const atts = BO.AttachmentsData.ATTACHMENTS || {};
            const slots = [
                { key: 'optic', label: 'OPTIC / SIGHT', list: atts.optic || [] },
                { key: 'muzzle', label: 'MUZZLE', list: atts.muzzle || [] },
                { key: 'underbarrel', label: 'UNDERBARREL', list: atts.underbarrel || [] },
                { key: 'magazine', label: 'MAGAZINE', list: atts.magazine || [] },
                { key: 'stock', label: 'STOCK / GRIP', list: atts.stock || [] },
                { key: 'camo', label: 'WEAPON CAMO', list: Array.isArray(BO.AttachmentsData.CAMOS) ? BO.AttachmentsData.CAMOS : Object.values(BO.AttachmentsData.CAMOS || {}) }
            ];

            body.innerHTML = slots.map((sl) => {
                const curVal = sl.key === 'camo' ? (w.cfg.camo || 'default') : (w.cfg.attachments?.[sl.key] || 'none');
                return `
                    <div class="panel-title" style="color:#38bdf8;margin-top:8px;">${sl.label}</div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
                        ${sl.list.map((a) => `
                            <button class="btn btn-sm ${curVal === a.id ? 'btn-primary' : ''} js-td-att-pick"
                                data-slot="${sl.key}" data-val="${a.id}">
                                ${escAttr(a.name)}${curVal === a.id ? ' ✓' : ''}
                            </button>
                        `).join('')}
                    </div>
                `;
            }).join('');

            body.querySelectorAll('.js-td-att-pick').forEach((btn) => {
                btn.onclick = () => {
                    BO.Sound.playUIClick();
                    BO.Player.updateActiveWeaponAttachments(btn.dataset.slot, btn.dataset.val);
                    this.renderTdAttachments();
                };
            });
        }

        /* ====================================================================
           PAY-TO-USE CUSTOM CLASS ARMORY MODAL (TOWER DEFENSE)
        ==================================================================== */
        openTdCustomClassModal() {
            if (!this.modalTdCustomClass || !BO.TowerDefenseMode) return;
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            this.renderTdCustomClass();
            this.modalTdCustomClass.classList.remove('hidden');
        }

        renderTdCustomClass() {
            const list = document.getElementById('td-cc-list');
            const sub = document.getElementById('td-cc-sub');
            const td = BO.TowerDefenseMode;
            if (!list || !td) return;
            const cost = td.getCost(1000);
            if (sub) sub.textContent = `Your Gold: ${td.gold} • Equip any of your 10 Custom Classes for ${cost} GOLD!`;
            const classes = BO.Loadout.getClasses();
            list.innerHTML = classes.map((c, idx) => {
                const pName = BO.WeaponsData.get(c.primary.id)?.name || c.primary.id;
                const sName = BO.WeaponsData.get(c.secondary.id)?.name || c.secondary.id;
                const canAfford = td.gold >= cost;
                return `
                    <button class="select-card js-td-buy-cc" data-cidx="${idx}" style="border-color:${canAfford ? '#fde047' : '#475569'};">
                        <div class="card-head" style="color:#fde047;">${escAttr(c.name)}</div>
                        <div class="card-sub">Primary: <b>${escAttr(pName)}</b><br>Secondary: ${escAttr(sName)}</div>
                        <div style="margin-top:6px;font-family:var(--font-mono);font-weight:800;color:${canAfford ? '#4ade80' : '#ef4444'};">EQUIP FOR ${cost} GOLD</div>
                    </button>
                `;
            }).join('');
            list.querySelectorAll('.js-td-buy-cc').forEach((btn) => {
                btn.onclick = () => {
                    if (td.buyCustomClass(Number(btn.dataset.cidx))) {
                        this.modalTdCustomClass.classList.add('hidden');
                        if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                    }
                };
            });
        }

        /* ====================================================================
           CUSTOMIZE ENEMY POOL & ZOMBIE STATS MODAL
           (APPLIES TO SURVIVAL, ZOMBIES & TOWER DEFENSE)
        ==================================================================== */
        _setDisabledEnemies(ids) {
            const clean = Array.from(new Set((ids || []).filter((x) => typeof x === 'string')));
            this.tdConfig.disabledEnemies = clean;
            if (BO.ZombieCustomizer) BO.ZombieCustomizer.setDisabledEnemies(clean);
            if (BO.SurvivalCareer && BO.SurvivalCareer.profile && BO.SurvivalCareer.profile.options) {
                BO.SurvivalCareer.remember({ ...BO.SurvivalCareer.profile.options, disabledEnemies: clean.slice() });
            }
        }

        _syncDisabledFromCustomizer() {
            if (!BO.ZombieCustomizer) return;
            const ids = (BO.ZombieCustomizer.config.disabledEnemies || []).slice();
            this.tdConfig.disabledEnemies = ids;
            if (BO.SurvivalCareer && BO.SurvivalCareer.profile && BO.SurvivalCareer.profile.options) {
                BO.SurvivalCareer.remember({ ...BO.SurvivalCareer.profile.options, disabledEnemies: ids.slice() });
            }
        }

        openEnemyPoolModal(opts = null) {
            if (!this.modalEnemyPool) return;
            this._epContext = opts || { mode: this.lobbyMode || 'zombies', onClose: null };
            // If opened from Survival, sync Survival's disabledEnemies into customizer if needed
            if (this._epContext.mode === 'survival' && BO.SurvivalCareer?.profile?.options) {
                const svDis = BO.SurvivalCareer.profile.options.disabledEnemies || [];
                this.tdConfig.disabledEnemies = svDis.slice();
                if (BO.ZombieCustomizer) BO.ZombieCustomizer.setDisabledEnemies(svDis);
            } else if (BO.ZombieCustomizer) {
                this.tdConfig.disabledEnemies = (BO.ZombieCustomizer.config.disabledEnemies || []).slice();
            }
            const sub = document.getElementById('ep-modal-sub');
            if (sub) {
                const unit = this._epContext.mode === 'survival' ? 'Start Day' : (this._epContext.mode === 'td' ? 'Start Wave' : 'Start Round');
                sub.textContent = `Edit stats, ${unit}, per-zombie & category spawn %, and save setups — applies to Survival, Zombies & Tower Defense.`;
            }
            this.renderEnemyPool();
            this.modalEnemyPool.classList.remove('hidden');
        }

        closeEnemyPoolModal() {
            if (this.modalEnemyPool) this.modalEnemyPool.classList.add('hidden');
            const cb = this._epContext && this._epContext.onClose;
            this._epContext = null;
            if (typeof cb === 'function') cb();
            else this.renderLobby();
        }

        _renderEpPresetsBar() {
            const ZC = BO.ZombieCustomizer;
            const sel = document.getElementById('ep-preset-select');
            if (!sel || !ZC) return;
            const presets = ZC.listPresets();
            const active = ZC.config.activePresetName || 'Default';
            const opts = [`<option value="__default__" ${!ZC.presets[active] ? 'selected' : ''}>Default (Factory)</option>`]
                .concat(presets.map((p) => `<option value="${escAttr(p.name)}" ${active === p.name ? 'selected' : ''}>${escAttr(p.name)} (${p.modifiedCount} edited)</option>`));
            sel.innerHTML = opts.join('');
            const delBtn = document.getElementById('btn-ep-del-preset');
            if (delBtn) delBtn.disabled = !ZC.presets[sel.value];
        }

        _renderEpCategoryBar() {
            const bar = document.getElementById('ep-cat-bar');
            const ZC = BO.ZombieCustomizer;
            if (!bar || !ZC) return;
            const ch = ZC.config.categoryChances;
            const total = ZC.CATEGORIES.reduce((acc, c) => acc + (Number(ch[c.id]) || 0), 0);
            const totalCol = Math.abs(total - 100) < 0.2 ? '#4ade80' : '#fbbf24';
            bar.innerHTML = `
                <span class="ep-tb-lbl" style="color:#38bdf8;">CATEGORY SPAWN %:</span>
                ${ZC.CATEGORIES.map((c) => `
                    <label class="ep-cat-pill" style="--cat-col:${c.color};" title="Spawn probability for the entire ${c.label} category">
                        <b>${c.label.toUpperCase()}</b>
                        <input type="number" class="js-ep-cat-pct" data-cat="${c.id}" min="0" max="100" step="0.5" value="${ch[c.id]}">
                        <span style="color:#94a3b8;">%</span>
                    </label>
                `).join('')}
                <span class="ep-cat-total" style="color:${totalCol};">TOTAL: ${total.toFixed(1)}%</span>
                <button class="btn btn-sm" id="btn-ep-norm-cat" style="padding:3px 8px;font-size:10.5px;">NORMALIZE 100%</button>
                <button class="btn btn-sm" id="btn-ep-reset-cat" style="padding:3px 8px;font-size:10.5px;">RESET %</button>
            `;
            bar.querySelectorAll('.js-ep-cat-pct').forEach((inp) => {
                inp.onchange = (e) => {
                    ZC.setCategoryChance(e.target.dataset.cat, Number(e.target.value));
                    this.renderEnemyPool();
                };
            });
            const normBtn = document.getElementById('btn-ep-norm-cat');
            if (normBtn) normBtn.onclick = () => { BO.Sound.playUIClick(); ZC.normalizeCategoryChances(); this.renderEnemyPool(); };
            const resetBtn = document.getElementById('btn-ep-reset-cat');
            if (resetBtn) resetBtn.onclick = () => { BO.Sound.playUIClick(); ZC.resetCategoryChances(); this.renderEnemyPool(); };
        }

        renderEnemyPool() {
            const body = document.getElementById('enemy-pool-body');
            if (!body) return;
            const ZC = BO.ZombieCustomizer;
            this._renderEpPresetsBar();
            this._renderEpCategoryBar();

            const disSet = new Set(this.tdConfig.disabledEnemies || []);
            const oddsData = ZC ? ZC.computeEffectiveOdds(disSet) : { catEffective: {}, enemyOdds: {} };
            const q = this._epSearchQuery || '';
            const superBossList = BO.ZombiesData.ORDERED_BOSSES.filter((b) => b.isSuperBoss);
            const regBossList = BO.ZombiesData.ORDERED_BOSSES.filter((b) => !b.isSuperBoss);
            const groups = [
                { cat: 'easy', title: 'EASY ENEMIES', color: '#4ade80', list: BO.ZombiesData.ORDERED_PROGRESSION.filter((z) => z.rarity === 'easy') },
                { cat: 'normal', title: 'NORMAL ENEMIES', color: '#38bdf8', list: BO.ZombiesData.ORDERED_PROGRESSION.filter((z) => z.rarity === 'normal') },
                { cat: 'hard', title: 'HARD / ROUGHEST ENEMIES', color: '#f59e0b', list: BO.ZombiesData.ORDERED_PROGRESSION.filter((z) => z.rarity === 'hard') },
                { cat: 'boss', title: 'BOSS COMMANDERS', color: '#ef4444', list: regBossList },
                ...(superBossList.length ? [{ cat: 'super_boss', title: '👑 COLOSSAL SUPER BOSSES', color: '#fde047', list: superBossList }] : [])
            ];

            const roundLbl = (this._epContext && this._epContext.mode === 'survival') ? 'Day' : 'Rd';
            const selectedId = this._epSelectedId || (this._epPreviewActiveSpec && this._epPreviewActiveSpec.id) || (BO.ZombiesData.ORDERED_PROGRESSION[0] && BO.ZombiesData.ORDERED_PROGRESSION[0].id);

            body.innerHTML = groups.map((g) => {
                const filtered = q ? g.list.filter((z) => (z.name || '').toLowerCase().includes(q) || (z.id || '').toLowerCase().includes(q) || (z.simpleDesc || '').toLowerCase().includes(q)) : g.list;
                if (q && filtered.length === 0) return '';
                const catPct = ZC ? ZC.config.categoryChances[g.cat] : 0;
                const enabledInCat = g.list.filter((z) => !disSet.has(z.id)).length;
                return `
                <div class="ep-cat-head">
                    <div class="panel-title" style="color:${g.color};margin:0;">${g.title} — ${catPct}% (${enabledInCat}/${g.list.length} ON)</div>
                    <div class="ep-cat-head-btns">
                        <button class="btn btn-sm js-ep-cat-on" data-cat="${g.cat}">ALL ON</button>
                        <button class="btn btn-sm js-ep-cat-off" data-cat="${g.cat}">ALL OFF</button>
                    </div>
                </div>
                <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(225px,1fr));gap:6px;">
                    ${filtered.map((z) => {
                        const enabled = !disSet.has(z.id);
                        const isSel = selectedId === z.id;
                        const isMod = ZC && ZC.isCustomized(z.id);
                        const customStart = ZC ? ZC.getStartRound(z.id) : null;
                        const showStart = customStart != null ? customStart : (ZC ? ZC.getDefaultStartRound(z) : (z.unlockRound || z.bossRound || 1));
                        const ov = ZC ? ZC.getOverride(z.id) : null;
                        const odds = oddsData.enemyOdds[z.id];
                        const pctTxt = enabled && odds ? `${odds.overallPct.toFixed(1)}%` : '0%';
                        const isCustomPct = !!(ov && ov.spawnChance != null);
                        return `
                            <div class="mod-row ep-row js-ep-row ${enabled ? 'active' : ''} ${isSel ? 'selected' : ''}" data-eid="${z.id}" style="--ep-col:${g.color};">
                                <span class="ep-row-main">
                                    <b>${escAttr(z.name)}${isMod ? '<span class="ep-badge-mod">✎</span>' : ''}</b>
                                    <span class="ep-row-meta">
                                        <span>HP ${z.hp}</span>
                                        <span class="ep-badge-rnd" title="${customStart != null ? 'Custom start' : 'Default start'}">${roundLbl} ${showStart}${customStart != null ? '*' : ''}</span>
                                        <span class="ep-badge-pct" title="Effective overall spawn %${isCustomPct ? ' (custom)' : ''}">${pctTxt}${isCustomPct ? '*' : ''}</span>
                                    </span>
                                </span>
                                <input type="checkbox" class="js-ep-cb" data-eid="${z.id}" ${enabled ? 'checked' : ''} title="Enable or disable this enemy">
                            </div>
                        `;
                    }).join('')}
                </div>`;
            }).join('');

            body.querySelectorAll('.js-ep-cat-on, .js-ep-cat-off').forEach((btn) => {
                btn.onclick = () => {
                    BO.Sound.playUIClick();
                    const cat = btn.dataset.cat;
                    const turnOn = btn.classList.contains('js-ep-cat-on');
                    const grp = groups.find((x) => x.cat === cat);
                    if (!grp) return;
                    const s = new Set(this.tdConfig.disabledEnemies || []);
                    for (const z of grp.list) {
                        if (turnOn) s.delete(z.id);
                        else s.add(z.id);
                    }
                    // Ensure at least 1 enemy remains enabled overall
                    const allIds = BO.ZombiesData.ORDERED_PROGRESSION.map((z) => z.id).concat(BO.ZombiesData.ORDERED_BOSSES.map((b) => b.id));
                    if (s.size >= allIds.length) s.delete(allIds[0]);
                    this._setDisabledEnemies(Array.from(s));
                    this.renderEnemyPool();
                };
            });

            body.querySelectorAll('.js-ep-row').forEach((row) => {
                row.onclick = (e) => {
                    if (e.target && e.target.classList.contains('js-ep-cb')) return;
                    BO.Sound.playUIClick();
                    this._epSelectedId = row.dataset.eid;
                    body.querySelectorAll('.js-ep-row.selected').forEach((r) => r.classList.remove('selected'));
                    row.classList.add('selected');
                    const spec = BO.ZombiesData.get(row.dataset.eid);
                    if (spec) this._showEnemyPreview(spec);
                };
            });
            body.querySelectorAll('.js-ep-cb').forEach((cb) => {
                cb.onchange = (e) => {
                    e.stopPropagation();
                    BO.Sound.playUIClick();
                    const id = e.target.dataset.eid;
                    const s = new Set(this.tdConfig.disabledEnemies || []);
                    if (e.target.checked) s.delete(id);
                    else s.add(id);
                    this._setDisabledEnemies(Array.from(s));
                    this.renderEnemyPool();
                };
            });

            const activeSpec = BO.ZombiesData.get(selectedId) || BO.ZombiesData.ORDERED_PROGRESSION[0];
            if (activeSpec) {
                this._epSelectedId = activeSpec.id;
                this._showEnemyPreview(activeSpec);
            }
        }

        _initEnemyPreviewRenderer() {
            if (this._epRenderer) return;
            const canvas = document.getElementById('enemy-preview-canvas');
            if (!canvas || typeof THREE === 'undefined') return;
            this._epRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
            this._epRenderer.setSize(144, 144, false);
            this._epScene = new THREE.Scene();
            this._epCam = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
            this._epCam.position.set(0, 1.35, 3.6);
            this._epCam.lookAt(0, 0.95, 0);
            const amb = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 1.1);
            const key = new THREE.DirectionalLight(0xfff5e4, 1.6);
            key.position.set(2.5, 4, 3);
            const rim = new THREE.PointLight(0x38bdf8, 1.4, 12);
            rim.position.set(-2.5, 2, -2);
            this._epScene.add(amb, key, rim);
            this._epPivot = new THREE.Group();
            this._epScene.add(this._epPivot);

            const tick = () => {
                requestAnimationFrame(tick);
                if (!this.modalEnemyPool || this.modalEnemyPool.classList.contains('hidden')) return;
                if (this._epPivot) this._epPivot.rotation.y += 0.018;
                if (this._epRenderer && this._epScene && this._epCam) {
                    this._epRenderer.render(this._epScene, this._epCam);
                }
            };
            requestAnimationFrame(tick);
        }

        _showEnemyPreview(spec) {
            this._epPreviewActiveSpec = spec;
            this._initEnemyPreviewRenderer();
            if (this._epPivot) {
                while (this._epPivot.children.length > 0) this._epPivot.remove(this._epPivot.children[0]);
                try {
                    const built = BO.CharacterMesh.buildZombieFromSpec(spec, null);
                    const sc = spec.bodySpec?.scale || [1, 1, 1];
                    const maxDim = Math.max(sc[0] || 1, sc[1] || 1, sc[2] || 1);
                    const norm = Math.min(1.25, 1.35 / Math.max(0.7, maxDim));
                    built.root.scale.setScalar(norm);
                    this._epPivot.add(built.root);
                } catch (e) {}
            }
            const info = document.getElementById('enemy-preview-info');
            if (info) {
                const rarCol = spec.isSuperBoss ? '#fde047' : (spec.isBoss ? '#ef4444' : (spec.rarity === 'hard' ? '#f59e0b' : (spec.rarity === 'normal' ? '#38bdf8' : '#4ade80')));
                const catLabel = spec.isSuperBoss ? 'SUPER BOSS' : (spec.isBoss ? 'BOSS' : `${(spec.rarity || 'easy').toUpperCase()} TIER`);
                info.innerHTML = `
                    <div style="font-size:14px;font-weight:800;color:${rarCol};letter-spacing:0.6px;">${escAttr(spec.name)}</div>
                    <div style="font-size:10.5px;color:#94a3b8;margin-bottom:4px;">${catLabel}</div>
                    <div style="font-size:11px;color:#cbd5e1;line-height:1.35;">${escAttr(spec.simpleDesc || spec.weaknessText || 'Unique undead combatant.')}</div>
                `;
            }
            this._renderEnemyEditor(spec);
        }

        _renderEnemyEditor(spec) {
            const form = document.getElementById('enemy-editor-form');
            const ZC = BO.ZombieCustomizer;
            if (!form || !ZC || !spec) return;
            const ov = ZC.getOverride(spec.id) || {};
            const base = ZC.getBaseSpec(spec.id) || spec;
            const disSet = new Set(this.tdConfig.disabledEnemies || []);
            const odds = ZC.computeEffectiveOdds(disSet).enemyOdds[spec.id];
            const defStart = ZC.getDefaultStartRound(spec);
            const curStart = ov.startRound != null ? ov.startRound : '';
            const curSpawnPct = ov.spawnChance != null ? ov.spawnChance : '';
            const curScale = ov.scale != null ? ov.scale : 1.0;
            const res = spec.resistances || { bullet: 1, explosive: 1, fire: 1, headshot: 1, melee: 1 };
            const isMod = (k) => ov[k] !== undefined && ov[k] !== null;
            const isResMod = (rk) => !!(ov.resistances && ov.resistances[rk] !== undefined);
            const roundLbl = (this._epContext && this._epContext.mode === 'survival') ? 'Start Day' : 'Start Round / Day';

            form.innerHTML = `
                <div class="ep-ed-sec">
                    <span>SPAWN RULES</span>
                    <button class="btn btn-sm" id="btn-ep-reset-one" style="padding:2px 7px;font-size:10px;border-color:#f59e0b;color:#fbbf24;">RESET ENEMY</button>
                </div>
                <div class="ep-ed-grid">
                    <label class="ep-ed-field ${isMod('startRound') ? 'modified' : ''}" title="First round (or day in Survival) this zombie can appear. Leave blank for default progression.">
                        <span>${roundLbl} (def ${defStart})</span>
                        <input type="number" id="ed-startRound" min="1" max="999" step="1" placeholder="Auto (${defStart})" value="${curStart}">
                    </label>
                    <label class="ep-ed-field ${isMod('spawnChance') ? 'modified' : ''}" title="% share within its category (0-100). Leave blank for Auto equal split.">
                        <span>Category Share %</span>
                        <input type="number" id="ed-spawnChance" min="0" max="100" step="0.5" placeholder="Auto" value="${curSpawnPct}">
                    </label>
                </div>
                <div class="ep-ed-note">
                    Effective spawn: <b style="color:#7dd3fc;">${odds ? odds.inCatPct.toFixed(1) : '0.0'}%</b> in category • <b style="color:#4ade80;">${odds ? odds.overallPct.toFixed(2) : '0.00'}%</b> overall
                </div>

                <div class="ep-ed-sec"><span>CORE STATS</span></div>
                <div class="ep-ed-grid">
                    <label class="ep-ed-field ${isMod('hp') ? 'modified' : ''}">
                        <span>Base HP (def ${base.hp})</span>
                        <input type="number" id="ed-hp" min="1" max="500000" step="10" value="${spec.hp}">
                    </label>
                    <label class="ep-ed-field ${isMod('speed') ? 'modified' : ''}">
                        <span>Speed (def ${base.speed})</span>
                        <input type="number" id="ed-speed" min="0.2" max="15" step="0.1" value="${spec.speed}">
                    </label>
                    <label class="ep-ed-field ${isMod('attack') ? 'modified' : ''}">
                        <span>Attack DMG (def ${base.attack})</span>
                        <input type="number" id="ed-attack" min="0" max="99999" step="2" value="${spec.attack}">
                    </label>
                    <label class="ep-ed-field ${isMod('defense') ? 'modified' : ''}">
                        <span>Armor % (def ${Math.round((base.defense || 0) * 100)}%)</span>
                        <input type="number" id="ed-defense" min="0" max="95" step="1" value="${Math.round((spec.defense || 0) * 100)}">
                    </label>
                    <label class="ep-ed-field ${isMod('points') ? 'modified' : ''}">
                        <span>Kill Points (def ${(base.drops && base.drops.points) || 60})</span>
                        <input type="number" id="ed-points" min="0" max="100000" step="10" value="${(spec.drops && spec.drops.points) || 60}">
                    </label>
                    <label class="ep-ed-field ${isMod('scale') ? 'modified' : ''}">
                        <span>Size Scale × (def 1.0)</span>
                        <input type="number" id="ed-scale" min="0.35" max="3.5" step="0.05" value="${curScale}">
                    </label>
                </div>

                <div class="ep-ed-sec"><span>BEHAVIOR &amp; TRAITS</span></div>
                <div class="ep-ed-grid">
                    <label class="ep-ed-field ${isMod('movementHabit') ? 'modified' : ''}">
                        <span>Movement</span>
                        <select id="ed-movementHabit">${ZC.MOVEMENT_HABITS.map((m) => `<option value="${m}" ${spec.movementHabit === m ? 'selected' : ''}>${m.replace(/_/g, ' ')}</option>`).join('')}</select>
                    </label>
                    <label class="ep-ed-field ${isMod('attackType') ? 'modified' : ''}">
                        <span>Attack Type</span>
                        <select id="ed-attackType">${ZC.ATTACK_TYPES.map((a) => `<option value="${a}" ${spec.attackType === a ? 'selected' : ''}>${a.replace(/_/g, ' ')}</option>`).join('')}</select>
                    </label>
                    <label class="ep-ed-field ${isMod('splitCount') ? 'modified' : ''}">
                        <span>Splits on Death (0-6)</span>
                        <input type="number" id="ed-splitCount" min="0" max="6" step="1" value="${spec.splitCount || 0}">
                    </label>
                    <label class="ep-ed-field ${isMod('jumpChance') ? 'modified' : ''}">
                        <span>Jump Chance %</span>
                        <input type="number" id="ed-jumpChance" min="0" max="100" step="5" value="${Math.round((spec.jumpChance || 0) * 100)}">
                    </label>
                </div>
                <label class="ep-ed-check">
                    <input type="checkbox" id="ed-isMagical" ${spec.isMagical ? 'checked' : ''}>
                    <span>Magical (casts arcane bolts &amp; glows)</span>
                </label>

                <div class="ep-ed-sec"><span>DAMAGE TAKEN MULTIPLIERS</span></div>
                <div class="ep-ed-grid-3">
                    ${['bullet', 'explosive', 'fire', 'headshot', 'melee'].map((rk) => `
                        <label class="ep-ed-field ${isResMod(rk) ? 'modified' : ''}">
                            <span>${rk.charAt(0).toUpperCase() + rk.slice(1)} ×</span>
                            <input type="number" class="js-ed-res" data-rk="${rk}" min="0" max="10" step="0.05" value="${Number(res[rk] ?? 1).toFixed(2)}">
                        </label>
                    `).join('')}
                </div>
            `;

            const commit = (patch) => {
                ZC.setEnemyOverride(spec.id, patch);
                this.renderEnemyPool();
            };

            const bindNum = (elId, key, transform, allowBlank = false) => {
                const el = document.getElementById(elId);
                if (!el) return;
                el.onchange = () => {
                    const raw = el.value.trim();
                    if (allowBlank && raw === '') return commit({ [key]: null });
                    const n = Number(raw);
                    if (!Number.isFinite(n)) return;
                    commit({ [key]: transform ? transform(n) : n });
                };
            };

            bindNum('ed-startRound', 'startRound', (n) => Math.max(1, Math.min(999, Math.floor(n))), true);
            bindNum('ed-spawnChance', 'spawnChance', (n) => Math.max(0, Math.min(100, Math.round(n * 10) / 10)), true);
            bindNum('ed-hp', 'hp', (n) => Math.max(1, Math.round(n)));
            bindNum('ed-speed', 'speed', (n) => Math.max(0.2, Math.min(15, Math.round(n * 100) / 100)));
            bindNum('ed-attack', 'attack', (n) => Math.max(0, Math.round(n)));
            bindNum('ed-defense', 'defense', (n) => Math.max(0, Math.min(0.95, Math.round(n) / 100)));
            bindNum('ed-points', 'points', (n) => Math.max(0, Math.floor(n)));
            bindNum('ed-scale', 'scale', (n) => Math.max(0.35, Math.min(3.5, Math.round(n * 100) / 100)));
            bindNum('ed-splitCount', 'splitCount', (n) => Math.max(0, Math.min(6, Math.floor(n))));
            bindNum('ed-jumpChance', 'jumpChance', (n) => Math.max(0, Math.min(1, Math.round(n) / 100)));

            const mh = document.getElementById('ed-movementHabit');
            if (mh) mh.onchange = () => commit({ movementHabit: mh.value });
            const at = document.getElementById('ed-attackType');
            if (at) at.onchange = () => commit({ attackType: at.value });
            const mag = document.getElementById('ed-isMagical');
            if (mag) mag.onchange = () => commit({ isMagical: !!mag.checked });

            form.querySelectorAll('.js-ed-res').forEach((inp) => {
                inp.onchange = () => {
                    const n = Number(inp.value);
                    if (!Number.isFinite(n)) return;
                    commit({ resistances: { [inp.dataset.rk]: Math.max(0, Math.min(10, n)) } });
                };
            });

            const resetOne = document.getElementById('btn-ep-reset-one');
            if (resetOne) {
                resetOne.onclick = () => {
                    BO.Sound.playUIClick();
                    ZC.resetEnemy(spec.id);
                    this.renderEnemyPool();
                };
            }
        }

        /* ====================================================================
           ZOMBIES MODE TACTICAL FORTIFICATION BUILDER MODAL ([B])
        ==================================================================== */
        openZBuildModal() {
            if (!this.modalZBuild || !BO.ZombiesMode || !BO.ZombiesMode.active) return;
            if (!this.modalZBuild.classList.contains('hidden')) {
                this.modalZBuild.classList.add('hidden');
                if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                return;
            }
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            this.renderZBuild();
            this.modalZBuild.classList.remove('hidden');
        }

        renderZBuild() {
            const list = document.getElementById('z-build-list');
            const sub = document.getElementById('z-build-sub');
            const zm = BO.ZombiesMode;
            if (!list || !zm) return;
            if (sub) {
                sub.textContent = `Your Supplies: ${zm.supplies.toLocaleString()} • Fallen enemies have a 50% chance to drop 10% of their HP in Supplies!`;
            }
            const items = [
                { id: 'mini_barricade', name: '🧱 MINI BARRICADE', cost: 2000, col: '#4ade80', desc: 'Deploys a 2.8m tactical sandbag barricade (450 HP) directly in front of you. Blocks & absorbs zombie attacks!' },
                { id: 'wide_barricade', name: '🛡 WIDE BARRICADE', cost: 10000, col: '#38bdf8', desc: 'Deploys a massive 7.5m reinforced fortress wall (1,600 HP) that seals off entire hallways & choke points!' },
                { id: 'sniper_tower_ball', name: '🔵 SNIPER TOWER BALL', cost: 25000, col: '#fde047', desc: 'Throw a glowing Capsule Ball to deploy a durable 4,500 HP Mini Sniper Tower with a Quick-Zip Pad! Enemies sometimes attack it!' }
            ];
            list.innerHTML = items.map((it) => {
                const ok = zm.supplies >= it.cost;
                return `
                    <button class="select-card js-z-build-buy" data-bid="${it.id}" style="border-color:${ok ? it.col : '#334155'};">
                        <div class="card-head" style="color:${it.col};">${it.name}</div>
                        <div class="card-sub">${it.desc}</div>
                        <div style="margin-top:8px;font-family:var(--font-mono);font-weight:800;color:${ok ? '#fde047' : '#ef4444'};">${it.cost.toLocaleString()} SUPPLIES</div>
                    </button>
                `;
            }).join('');
            list.querySelectorAll('.js-z-build-buy').forEach((btn) => {
                btn.onclick = () => {
                    if (zm.buyFortification(btn.dataset.bid)) {
                        this.modalZBuild.classList.add('hidden');
                        if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                    }
                };
            });
        }

        /* ====================================================================
           WUNDERFIZZ MASTER PERK KIOSK MODAL (ALL 14 PERKS — MAX 8 EQUIPPED)
        ==================================================================== */
        openTdPerkKioskModal() {
            if (!this.modalTdPerks || !BO.TowerDefenseMode) return;
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            this.renderTdPerkKiosk();
            this.modalTdPerks.classList.remove('hidden');
        }

        renderTdPerkKiosk() {
            const list = document.getElementById('td-perks-list');
            const sub = document.getElementById('td-perks-sub');
            const td = BO.TowerDefenseMode;
            const P = BO.Player;
            if (!list || !td || !P) return;
            const perks = (BO.World && BO.World.tdAllPerks) || [];
            if (sub) {
                sub.textContent = `Your Gold: ${td.gold} • Equipped: ${P.zombiePerks.size}/8 Perks • Click any Perk to drink it immediately!`;
            }
            list.innerHTML = perks.map((pk, idx) => {
                const owned = P.zombiePerks.has(pk.id);
                const cost = td.modifiers.freePerks ? 0 : td.getCost(pk.cost);
                const canAfford = !owned && P.zombiePerks.size < 8 && td.gold >= cost && !td.modifiers.noPerks;
                const tag = idx < 6 ? 'OG CLASSIC' : 'NEW PERK';
                return `
                    <button class="select-card js-td-buy-pk" data-pkid="${pk.id}" style="border-color:${owned ? '#22c55e' : (canAfford ? pk.color : '#334155')};opacity:${owned ? '0.78' : '1'};">
                        <div class="card-head" style="color:${pk.color};">${escAttr(pk.name)} <span style="font-size:10px;color:#94a3b8;">[${tag}]</span></div>
                        <div class="card-sub">${escAttr(pk.desc)}</div>
                        <div style="margin-top:6px;font-family:var(--font-mono);font-weight:800;color:${owned ? '#4ade80' : (canAfford ? '#fde047' : '#ef4444')};">
                            ${owned ? '✓ EQUIPPED' : (cost === 0 ? 'FREE (0 GOLD)' : `${cost} GOLD`)}
                        </div>
                    </button>
                `;
            }).join('');
            list.querySelectorAll('.js-td-buy-pk').forEach((btn) => {
                btn.onclick = () => {
                    const pk = perks.find((x) => x.id === btn.dataset.pkid);
                    if (pk) {
                        td.buyPerkByDef(pk);
                        this.renderTdPerkKiosk();
                    }
                };
            });
        }

        /* ====================================================================
           SNIPER TOWER SKY-LIFT FLOOR SELECTOR MODAL (6 HEIGHTS!)
        ==================================================================== */
        openTdLiftModal(liftInter) {
            if (!this.modalTdLift || !liftInter || !BO.TowerDefenseMode) return;
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            const title = document.getElementById('td-lift-title');
            if (title) title.textContent = `🚀 ${liftInter.towerLabel} — SKY-LIFT`;
            const list = document.getElementById('td-lift-list');
            if (!list) return;
            list.innerHTML = (liftInter.floors || []).map((fl) => {
                const isHere = fl.floorIndex === liftInter.currentFloor;
                const col = fl.floorIndex === 5 ? '#fde047' : (fl.floorIndex === 4 ? '#38bdf8' : (fl.floorIndex === 3 ? '#f59e0b' : '#cbd5e1'));
                return `
                    <button class="btn ${isHere ? '' : 'btn-primary'} js-td-lift-go" data-fidx="${fl.floorIndex}"
                        style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-color:${col};color:${isHere ? '#94a3b8' : '#f8fafc'};">
                        <span style="font-weight:800;letter-spacing:1px;">${escAttr(fl.name)}</span>
                        <span style="font-family:var(--font-mono);font-size:12px;color:${col};">${isHere ? 'CURRENT FLOOR' : 'ZIP LAUNCH →'}</span>
                    </button>
                `;
            }).join('');
            list.querySelectorAll('.js-td-lift-go').forEach((btn) => {
                btn.onclick = () => {
                    const fl = liftInter.floors[Number(btn.dataset.fidx)];
                    this.modalTdLift.classList.add('hidden');
                    if (fl) BO.TowerDefenseMode.launchToTowerFloor(fl, liftInter.towerLabel);
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            });
            this.modalTdLift.classList.remove('hidden');
        }
    }

    BO.Menus = new MenuController();
})(window);
