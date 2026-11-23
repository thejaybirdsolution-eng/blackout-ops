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
                disabledEnemies: [],
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
                    shieldedBosses: false
                }
            };
            this.zModifiers = Object.assign({}, this.tdConfig.modifiers);
            this.customRules = {
                enemyCount: 6, teamSizeLimit: 6, enemyWeaponMode: 'all', playerWeaponMode: 'custom',
                scoreLimit: 0, timeLimit: 0, enemyHp: 100, playerHp: 100, respawnDelay: 2.4,
                headshotsOnly: false, oneShotKills: false, unlimitedAmmo: false, explosiveRounds: false,
                bigHeads: false, alwaysRadar: false, killstreaksEnabled: true,
                gravityScale: 1.0, speedScale: 1.0, jumpScale: 1.0, killcamEnabled: true
            };
            this.barracksTab = 'bestiary';
            this.settingsTab = 'controls';
            this.legendTab = 'howto';
            this.legendGunFilter = 'ALL';
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
                aar: document.getElementById('screen-aar')
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
            this.modalEnemyPool = document.getElementById('modal-enemy-pool');

            this._bindButtons();
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
            document.getElementById('btn-menu-mp').onclick = () => { BO.Sound.playUIClick(); this.lobbyMode = 'mp'; this.showScreen('play_lobby'); };
            const tdBtn = document.getElementById('btn-menu-td');
            if (tdBtn) tdBtn.onclick = () => { BO.Sound.playUIClick(); this.lobbyMode = 'td'; this.showScreen('play_lobby'); };
            document.getElementById('btn-menu-gunsmith').onclick = () => { BO.Sound.playUIClick(); this.showScreen('gunsmith'); };
            document.getElementById('btn-menu-barracks').onclick = () => { BO.Sound.playUIClick(); this.showScreen('barracks'); };
            document.getElementById('btn-menu-legend').onclick = () => { BO.Sound.playUIClick(); this.openLegend('howto'); };
            document.getElementById('btn-menu-settings').onclick = () => { BO.Sound.playUIClick(); this.openSettings('controls'); };
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
            const btnEpAllOn = document.getElementById('btn-ep-all-on');
            if (btnEpAllOn) {
                btnEpAllOn.onclick = () => {
                    BO.Sound.playUIClick();
                    this.tdConfig.disabledEnemies = [];
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
                    this.tdConfig.disabledEnemies = allIds.slice(1);
                    this.renderEnemyPool();
                };
            }
            const btnEpClose = document.getElementById('btn-ep-close');
            if (btnEpClose) {
                btnEpClose.onclick = () => {
                    BO.Sound.playUIClick();
                    if (this.modalEnemyPool) this.modalEnemyPool.classList.add('hidden');
                    this.renderLobby();
                };
            }
            const btnTdSkip = document.getElementById('btn-td-skip-wait');
            if (btnTdSkip) {
                btnTdSkip.onclick = () => {
                    if (this.modalTdShop) this.modalTdShop.classList.add('hidden');
                    if (BO.TowerDefenseMode) BO.TowerDefenseMode.skipIntermission();
                    if (BO.State.screen === 'playing' && !BO.State.paused && BO.App && BO.App._safePointerLock) BO.App._safePointerLock();
                };
            }
            document.getElementById('btn-pause-modmenu').onclick = () => { BO.Sound.playUIClick(); this.openModMenu(); };
            document.getElementById('btn-pause-legend').onclick = () => { BO.Sound.playUIClick(); this.openLegend('howto'); };
            document.getElementById('btn-pause-settings').onclick = () => { BO.Sound.playUIClick(); this.openSettings('controls'); };
            document.getElementById('btn-pause-restart').onclick = () => { BO.Sound.playUIClick(); this.setPauseOpen(false); if (this.onRestartMatch) this.onRestartMatch(); };
            document.getElementById('btn-pause-quit').onclick = () => { BO.Sound.playUIClick(); this.setPauseOpen(false); if (this.onExitToMenu) this.onExitToMenu(); };

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
            }
        }

        setPauseOpen(open) {
            BO.State.paused = open;
            if (BO.App && BO.App._clearInputState) BO.App._clearInputState();
            this.updateCheatMenuVisibility();
            const btnCls = document.getElementById('btn-pause-change-class');
            if (btnCls) btnCls.classList.toggle('hidden', !open || BO.State.activeMode !== 'mp');
            if (this.modalPause) this.modalPause.classList.toggle('hidden', !open);
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
        renderLobby() {
            const left = document.getElementById('lobby-left');
            const right = document.getElementById('lobby-right');
            const mode = this.lobbyMode; // 'zombies' | 'mp' | 'td'
            const isZ = mode === 'zombies';
            const isMp = mode === 'mp';
            const isTd = mode === 'td';
            const roundsUnlocked = BO.Cheats && (BO.Cheats.isModMenuUnlocked() || BO.Cheats.isActive('rounds', true));

            document.getElementById('lobby-mode-tabs').innerHTML = `
                <button class="btn ${isZ ? 'btn-zombies' : ''}" id="tab-lobby-z"
                    data-tip-title="COD Zombies Mode" data-tip="Survive endless waves of 20 unique zombies, fight Bosses on Rounds 5, 10, 20, 25, & 50, drink Perks, and upgrade guns in Pack-a-Punch!">COD ZOMBIES</button>
                <button class="btn ${isMp ? 'btn-primary' : ''}" id="tab-lobby-mp"
                    data-tip-title="Multiplayer Bot Combat + Custom Games" data-tip="Play Nuketown (BO1), Shipment (CoD4), Terminal (MW2), Rust (MW2), Killhouse & Crash Site with Custom Games & 15s Winner Killcam!">MULTIPLAYER BOTS</button>
                <button class="btn ${isTd ? 'btn-primary' : ''}" id="tab-lobby-td" style="${isTd ? 'background:linear-gradient(135deg,#15803d,#22c55e);color:#052e16;border-color:#4ade80;' : ''}"
                    data-tip-title="Tower Defense (Castle Siege)" data-tip="Defend your 3D Castle Keep (3 Wall Layers x 250 HP + 100 HP Heart) across 3 Castle Setups with a 30s Shopkeeper Intermission!">TOWER DEFENSE</button>
            `;
            document.getElementById('tab-lobby-z').onclick = () => { BO.Sound.playUIClick(); this.lobbyMode = 'zombies'; this.renderLobby(); };
            document.getElementById('tab-lobby-mp').onclick = () => { BO.Sound.playUIClick(); this.lobbyMode = 'mp'; this.renderLobby(); };
            document.getElementById('tab-lobby-td').onclick = () => { BO.Sound.playUIClick(); this.lobbyMode = 'td'; this.renderLobby(); };

            const ALL_WAVE_MODIFIERS = [
                { k: 'allBosses', lbl: '💀 All Bosses' },
                { k: 'fastZombies', lbl: '⚡ Fast Zombies (1.65x)' },
                { k: 'allEnemiesUnlocked', lbl: '🔓 All 70+10 Unlocked Wave 1' },
                { k: 'cost4x', lbl: '💸 Everything Costs 4x' },
                { k: 'zombiesHeal', lbl: '💚 Zombies Heal Each Other' },
                { k: 'magicalZombies', lbl: '✨ Magical Zombies' },
                { k: 'explosiveDeath', lbl: '💥 Explosive Zombie Deaths' },
                { k: 'giantZombies', lbl: '🦖 Giant Zombies (1.65x)' },
                { k: 'tinyZombies', lbl: '🐜 Tiny Speedsters (0.6x)' },
                { k: 'vampiric', lbl: '🧛 Vampiric Zombies' },
                { k: 'bloodMoon', lbl: '🩸 Blood Moon Fog' },
                { k: 'lowGravity', lbl: '🌙 Low Gravity Jumps' },
                { k: 'doubleGold', lbl: '🪙 Double Gold / 2x Points' },
                { k: 'headshotsOnly', lbl: '🎯 Headshots Only' },
                { k: 'infiniteAmmo', lbl: '∞ Infinite Ammo' },
                { k: 'randomLoadoutWave', lbl: '🎲 Random Gun Each Wave' },
                { k: 'glassCannon', lbl: '🔥 Glass Cannon (3x Dmg / 0.5x HP)' },
                { k: 'megaSplitters', lbl: '🧬 Mega Splitters (All Split!)' },
                { k: 'superJumpZombies', lbl: '🦘 Super Jumping Horde' },
                { k: 'vampirePlayer', lbl: '❤️ Vampire Player (+15 HP/Kill)' },
                { k: 'sniperHeaven', lbl: '🔭 Sniper Heaven (2.5x Sniper Dmg)' },
                { k: 'meleeMayhem', lbl: '⚔️ Melee Mayhem (4x + Heal)' },
                { k: 'explosiveHeadshots', lbl: '💣 Explosive Headshots' },
                { k: 'fastReload', lbl: '⚡ Hyper Reload (2.5x Speed)' },
                { k: 'hyperSpeedPlayer', lbl: '🏃 Hyper Speed Player (1.45x)' },
                { k: 'armoredHorde', lbl: '🛡️ Armored Horde (+35% Def)' },
                { k: 'chaosSwarm', lbl: '🌊 Chaos Swarm (2x Count)' },
                { k: 'noPerks', lbl: '🚫 No Perk Machines' },
                { k: 'freePerks', lbl: '🎁 Free Perk Machines (0g)' },
                { k: 'richStart', lbl: '💰 Rich Start (10,000 Gold/Pts)' },
                { k: 'berserkerWave', lbl: '😡 Berserker Rage (<50% HP)' },
                { k: 'nightmareDarkness', lbl: '🌑 Nightmare Darkness' },
                { k: 'noRegen', lbl: '☠️ No Health Regen' },
                { k: 'shieldedBosses', lbl: '🔰 Shielded Bosses (Regen)' }
            ];
            const disabledCount = (this.tdConfig.disabledEnemies || []).length;

            if (isZ) {
                const maps = BO.MapsData.listByMode('zombies');
                const u = BO.Save.data.unlockables || {};
                const allUnlocked = BO.Settings.get('unlockAll');
                const zDiffs = [
                    { id: 'normal', name: 'NORMAL', unlocked: true, tip: 'Standard COD Zombies wave survival.' },
                    { id: 'hard', name: 'HARD MODE', unlocked: !!(u.hardModeUnlocked || allUnlocked), tip: '1.5x Zombie HP, +18% Speed, 1.35x Attack. Unlocks by passing Round 50 (or "unlock" cheat)!' },
                    { id: 'very_hard', name: 'VERY HARD', unlocked: !!(u.veryHardModeUnlocked || allUnlocked), tip: '2.25x Zombie HP, +32% Speed, 1.7x Attack. Unlocks by passing Round 50 on Hard Mode!' },
                    { id: 'insanely_hard', name: 'INSANELY HARD', unlocked: !!(u.insanelyHardModeUnlocked || allUnlocked), tip: '3.5x Zombie HP, +48% Speed, 2.2x Attack. Unlocks by passing Round 50 on Very Hard Mode!' },
                    { id: 'boss_rush', name: '★ BOSS RUSH', unlocked: !!(u.bossRushUnlocked || allUnlocked), tip: 'Start with 10,000 PTS and fight a Boss every single round! Unlocks by passing Round 50!' }
                ];
                if (!zDiffs.find((d) => d.id === this.selectedZDifficulty && d.unlocked)) {
                    this.selectedZDifficulty = 'normal';
                }
                left.innerHTML = `
                    <div class="panel-title">SELECT ZOMBIES SECTOR (9 MAPS • INCLUDES 1:1 WAW / BO1 / BO2 CLASSICS)</div>
                    <div class="card-grid">
                        ${maps.map((m) => `
                            <button class="select-card ${this.selectedZMap === m.id ? 'active-zombies' : ''}" data-zmap="${m.id}"
                                data-tip-title="${escAttr(m.name)}" data-tip="${escAttr(m.description)}" data-tip-sub="Features Painted 'POWER →' Wall Arrows, Power Switch, 6 Perks, Mystery Box &amp; 3-Tier Pack-a-Punch!">
                                <div class="card-head">${m.name}</div>
                                <div class="card-sub">${m.subtitle}<br><br>${m.description}</div>
                                <div style="margin-top:8px;font-size:11px;color:#f87171">BEST ROUND: ${BO.Save.data.stats.highestRoundByMap[m.id] || 0}</div>
                            </button>`).join('')}
                    </div>
                    <div class="panel-title" style="margin-top:8px;">ZOMBIES DIFFICULTY &amp; BOSS RUSH (UNLOCKS AT ROUND 50)</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${zDiffs.map((d) => `
                            <button class="btn btn-sm ${this.selectedZDifficulty === d.id ? 'btn-zombies' : ''}" data-zdiff="${d.id}" ${d.unlocked ? '' : 'disabled'}
                                data-tip-title="${escAttr(d.name)}" data-tip="${escAttr(d.tip)}">
                                ${d.name} ${d.unlocked ? '' : '🔒'}
                            </button>
                        `).join('')}
                    </div>
                    <div class="panel-title" style="margin-top:8px;">STARTING WEAPON PROTOCOL</div>
                    <div class="card-grid">
                        <button class="select-card ${!this.classicStarter ? 'active-zombies' : ''}" id="z-start-custom"
                            data-tip-title="Custom Loadout Start" data-tip="Bring your custom Primary gun, Side Weapon, Perks, Special Power, and Ultimate Power right from Round 1!">
                            <div class="card-head">CUSTOM CLASS LOADOUT</div>
                            <div class="card-sub">Drop in with your active Gunsmith Primary + Sidearm + Special &amp; Ultimate Powers.</div>
                        </button>
                        <button class="select-card ${this.classicStarter ? 'active-zombies' : ''}" id="z-start-classic"
                            data-tip-title="Classic M1911 Start" data-tip="Old-school Zombies challenge: start with only the M1911 pistol and 500 points, then buy wall guns or spin the Mystery Box!">
                            <div class="card-head">CLASSIC M1911 PISTOL</div>
                            <div class="card-sub">Purist COD Zombies survival: start with M1911 &amp; 500 points.</div>
                        </button>
                    </div>
                    ${roundsUnlocked ? `
                        <div class="round-picker-card" style="margin-top:8px;">
                            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                                <span style="font-size:13px;font-weight:800;color:#fde047;">★ STARTING ROUND (CHEAT UNLOCKED):</span>
                                <input type="number" id="lobby-round-input" min="1" max="999" value="${this.selectedStartRound}" style="width:80px;background:#0d131d;color:#fde047;border:1px solid var(--amber);padding:6px 10px;font-family:var(--font-mono);font-weight:800;">
                                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                    ${[1, 5, 10, 20, 25, 50].map((r) => `<button class="btn btn-sm ${this.selectedStartRound === r ? 'btn-zombies' : ''}" data-lobbyrnd="${r}">RD ${r}${r >= 5 ? ' BOSS' : ''}</button>`).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    <div class="panel-title" style="color:#f87171;margin-top:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
                        <span>★ ENEMY POOL (70 ENEMIES + 10 BOSSES • EASY 50% / NORMAL 25% / HARD 15% / BOSS 10%)</span>
                        <button class="btn btn-sm btn-zombies" id="btn-z-open-ep">🧟 ENABLE / DISABLE ENEMIES (${80 - disabledCount}/80 ON)</button>
                    </div>
                    <div class="panel-title" style="color:#c084fc;margin-top:8px;">★ ZOMBIES CUSTOM MODIFIERS (${ALL_WAVE_MODIFIERS.length} MODIFIERS!)</div>
                    <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:6px;">
                        ${ALL_WAVE_MODIFIERS.map((md) => `
                            <label class="mod-row ${this.zModifiers[md.k] ? 'active' : ''}" style="margin:0;padding:6px 9px;font-size:11.5px;">
                                <span>${md.lbl}</span>
                                <input type="checkbox" class="js-z-mod" data-zmod="${md.k}" ${this.zModifiers[md.k] ? 'checked' : ''}>
                            </label>
                        `).join('')}
                    </div>
                `;
                left.querySelectorAll('[data-zmap]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedZMap = b.dataset.zmap; this.renderLobby(); }; });
                left.querySelectorAll('[data-zdiff]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedZDifficulty = b.dataset.zdiff; this.renderLobby(); }; });
                document.getElementById('z-start-custom').onclick = () => { BO.Sound.playUIClick(); this.classicStarter = false; this.renderLobby(); };
                document.getElementById('z-start-classic').onclick = () => { BO.Sound.playUIClick(); this.classicStarter = true; this.renderLobby(); };
                const zEpBtn = document.getElementById('btn-z-open-ep');
                if (zEpBtn) zEpBtn.onclick = () => { BO.Sound.playUIClick(); this.openEnemyPoolModal(); };
                left.querySelectorAll('.js-z-mod').forEach((cb) => {
                    cb.onchange = (e) => {
                        BO.Sound.playUIClick();
                        this.zModifiers[e.target.dataset.zmod] = e.target.checked;
                        this.renderLobby();
                    };
                });
                const lri = document.getElementById('lobby-round-input');
                if (lri) {
                    lri.oninput = (e) => {
                        this.selectedStartRound = Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1));
                    };
                }
                left.querySelectorAll('[data-lobbyrnd]').forEach((b) => {
                    b.onclick = () => {
                        BO.Sound.playUIClick();
                        this.selectedStartRound = parseInt(b.dataset.lobbyrnd, 10) || 1;
                        this.renderLobby();
                    };
                });
            } else if (isMp) {
                const mpModes = [
                    { id: 'tdm', name: 'TEAM DEATHMATCH', sub: 'Squad Elimination (default 50 Kills).', tip: 'Work with AI teammates to reach the kill limit first!' },
                    { id: 'ffa', name: 'FREE-FOR-ALL', sub: 'Every-Soldier-for-Himself (default 30 Kills).', tip: 'No teammates! Shoot everyone you see to win!' },
                    { id: 'dom', name: 'DOMINATION', sub: 'Capture & Hold Flags A, B, C to 150 Points.', tip: 'Stand inside the glowing A, B, and C rings to earn points!' },
                    { id: 'hardpoint', name: 'HARDPOINT', sub: 'Contest Rotating Tactical Zones to 150 Points.', tip: 'Hold the rotating objective zone!' },
                    { id: 'gun_game', name: 'GUN GAME', sub: '16-Weapon Ladder Promotion ending in Ray Gun.', tip: 'Every kill upgrades your weapon!' }
                ];
                const maps = BO.MapsData.listByMode('mp');
                const diffs = [
                    { id: 'recruit', tip: 'Sight delay 2–5 seconds before shooting! Relaxed bots.' },
                    { id: 'regular', tip: 'Sight delay 2–4 seconds before shooting! Balanced combat.' },
                    { id: 'hardened', tip: 'Sight delay 2–3 seconds before shooting! Aggressive bots.' },
                    { id: 'veteran', tip: 'Sight delay 1–2 seconds before shooting! Elite accuracy.' }
                ];
                const cr = this.customRules;
                left.innerHTML = `
                    <div class="panel-title">GAME MODE</div>
                    <div class="card-grid">
                        ${mpModes.map((mm) => `
                            <button class="select-card ${this.selectedMpMode === mm.id ? 'active' : ''}" data-mpmode="${mm.id}"
                                data-tip-title="${mm.name}" data-tip="${escAttr(mm.tip)}">
                                <div class="card-head">${mm.name}</div>
                                <div class="card-sub">${mm.sub}</div>
                            </button>`).join('')}
                    </div>
                    <div class="panel-title">SELECT MAP (6 ARENAS • INCLUDES 1:1 NUKETOWN / SHIPMENT / TERMINAL / RUST)</div>
                    <div class="card-grid">
                        ${maps.map((m) => `
                            <button class="select-card ${this.selectedMpMap === m.id ? 'active' : ''}" data-mpmap="${m.id}"
                                data-tip-title="${escAttr(m.name)}" data-tip="${escAttr(m.description)}">
                                <div class="card-head">${m.name}</div>
                                <div class="card-sub">${m.subtitle}<br>${m.description}</div>
                            </button>`).join('')}
                    </div>
                    <div class="panel-title">BOT DIFFICULTY (WITH AUTHENTIC SIGHT REACTION DELAYS)</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${diffs.map((d) => `<button class="btn ${this.selectedDifficulty === d.id ? 'btn-primary' : ''}" data-diff="${d.id}"
                            data-tip-title="Difficulty: ${d.id.toUpperCase()}" data-tip="${escAttr(d.tip)}">${d.id.toUpperCase()}</button>`).join('')}
                    </div>

                    <div class="panel-title" style="color:#38bdf8;margin-top:8px;">★ CUSTOM GAMES &amp; FULL MATCH RULESET (SERIOUS &amp; FUN)</div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
                        <button class="btn btn-sm js-cg-preset" data-preset="standard">PRESET: STANDARD COD</button>
                        <button class="btn btn-sm js-cg-preset" data-preset="unarmed" style="border-color:#22c55e;color:#22c55e;">UNARMED TARGET PRACTICE</button>
                        <button class="btn btn-sm js-cg-preset" data-preset="snipers" style="border-color:#38bdf8;color:#38bdf8;">ONE-SHOT SNIPERS</button>
                        <button class="btn btn-sm js-cg-preset" data-preset="chaos" style="border-color:#c084fc;color:#c084fc;">MOON GRAVITY + BIG HEADS + SUPER SPEED</button>
                        <button class="btn btn-sm js-cg-preset" data-preset="quickcam" style="border-color:#fde047;color:#fde047;">5-KILL WINNER KILLCAM BLITZ</button>
                    </div>
                    <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));">
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Enemy Count (1–18): <b id="cg-ec-lbl">${cr.enemyCount}</b></span>
                            <input type="range" id="cg-enemyCount" min="1" max="18" step="1" value="${cr.enemyCount}" style="width:110px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Team Size Limit (1–12): <b id="cg-ts-lbl">${cr.teamSizeLimit}</b></span>
                            <input type="range" id="cg-teamSize" min="1" max="12" step="1" value="${cr.teamSizeLimit}" style="width:110px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Enemy Weapons</span>
                            <select id="cg-enemyWeapons" style="max-width:140px;">
                                <option value="all" ${cr.enemyWeaponMode === 'all' ? 'selected' : ''}>ALL WEAPONS</option>
                                <option value="unarmed" ${cr.enemyWeaponMode === 'unarmed' ? 'selected' : ''}>NO GUNS / UNARMED</option>
                                <option value="pistols" ${cr.enemyWeaponMode === 'pistols' ? 'selected' : ''}>PISTOLS ONLY</option>
                                <option value="snipers" ${cr.enemyWeaponMode === 'snipers' ? 'selected' : ''}>SNIPERS ONLY</option>
                                <option value="shotguns" ${cr.enemyWeaponMode === 'shotguns' ? 'selected' : ''}>SHOTGUNS ONLY</option>
                                <option value="smgs" ${cr.enemyWeaponMode === 'smgs' ? 'selected' : ''}>SMGS ONLY</option>
                                <option value="ar" ${cr.enemyWeaponMode === 'ar' ? 'selected' : ''}>ASSAULT RIFLES</option>
                                <option value="melee" ${cr.enemyWeaponMode === 'melee' ? 'selected' : ''}>MELEE BLADES ONLY</option>
                                <option value="rpg" ${cr.enemyWeaponMode === 'rpg' ? 'selected' : ''}>RPG LAUNCHERS</option>
                            </select>
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Player Weapon Rule</span>
                            <select id="cg-playerWeapons" style="max-width:140px;">
                                <option value="custom" ${cr.playerWeaponMode === 'custom' ? 'selected' : ''}>MY CUSTOM CLASS</option>
                                <option value="snipers" ${cr.playerWeaponMode === 'snipers' ? 'selected' : ''}>FORCE SNIPERS</option>
                                <option value="pistols" ${cr.playerWeaponMode === 'pistols' ? 'selected' : ''}>FORCE PISTOLS</option>
                                <option value="shotguns" ${cr.playerWeaponMode === 'shotguns' ? 'selected' : ''}>FORCE SHOTGUNS</option>
                                <option value="rpg" ${cr.playerWeaponMode === 'rpg' ? 'selected' : ''}>FORCE RPG-7</option>
                                <option value="raygun" ${cr.playerWeaponMode === 'raygun' ? 'selected' : ''}>FORCE RAY GUN</option>
                            </select>
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Kills / Score To Win (0=Def)</span>
                            <input type="number" id="cg-scoreLimit" min="0" max="500" value="${cr.scoreLimit}" style="width:74px;background:#0d131d;color:#fde047;border:1px solid var(--border-subtle);padding:4px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Time Limit Min (0=Def)</span>
                            <input type="number" id="cg-timeLimit" min="0" max="60" value="${cr.timeLimit}" style="width:74px;background:#0d131d;color:#fde047;border:1px solid var(--border-subtle);padding:4px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Enemy Health (1–1000)</span>
                            <input type="number" id="cg-enemyHp" min="1" max="1000" value="${cr.enemyHp}" style="width:74px;background:#0d131d;color:#f87171;border:1px solid var(--border-subtle);padding:4px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Player Health (1–1000)</span>
                            <input type="number" id="cg-playerHp" min="1" max="1000" value="${cr.playerHp}" style="width:74px;background:#0d131d;color:#22c55e;border:1px solid var(--border-subtle);padding:4px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Gravity: <b id="cg-grv-lbl">${cr.gravityScale}x</b></span>
                            <input type="range" id="cg-gravity" min="0.4" max="1.6" step="0.1" value="${cr.gravityScale}" style="width:105px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Move Speed: <b id="cg-spd-lbl">${cr.speedScale}x</b></span>
                            <input type="range" id="cg-speed" min="0.7" max="2.5" step="0.1" value="${cr.speedScale}" style="width:105px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Jump Height: <b id="cg-jmp-lbl">${cr.jumpScale}x</b></span>
                            <input type="range" id="cg-jump" min="0.8" max="2.2" step="0.1" value="${cr.jumpScale}" style="width:105px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Respawn Delay: <b id="cg-rsp-lbl">${cr.respawnDelay}s</b></span>
                            <input type="range" id="cg-respawn" min="0.5" max="8" step="0.5" value="${cr.respawnDelay}" style="width:105px;">
                        </div>
                    </div>
                    <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;">
                        <label class="mod-row ${cr.headshotsOnly ? 'active' : ''}" style="margin:0;padding:6px 10px;"><span>Headshots Only</span><input type="checkbox" class="js-cg-cb" data-cg="headshotsOnly" ${cr.headshotsOnly ? 'checked' : ''}></label>
                        <label class="mod-row ${cr.oneShotKills ? 'active' : ''}" style="margin:0;padding:6px 10px;"><span>One-Shot Kills (Minigame)</span><input type="checkbox" class="js-cg-cb" data-cg="oneShotKills" ${cr.oneShotKills ? 'checked' : ''}></label>
                        <label class="mod-row ${cr.unlimitedAmmo ? 'active' : ''}" style="margin:0;padding:6px 10px;"><span>Unlimited Ammo</span><input type="checkbox" class="js-cg-cb" data-cg="unlimitedAmmo" ${cr.unlimitedAmmo ? 'checked' : ''}></label>
                        <label class="mod-row ${cr.explosiveRounds ? 'active' : ''}" style="margin:0;padding:6px 10px;"><span>Explosive Bullets</span><input type="checkbox" class="js-cg-cb" data-cg="explosiveRounds" ${cr.explosiveRounds ? 'checked' : ''}></label>
                        <label class="mod-row ${cr.bigHeads ? 'active' : ''}" style="margin:0;padding:6px 10px;"><span>Big Head Mode (3x)</span><input type="checkbox" class="js-cg-cb" data-cg="bigHeads" ${cr.bigHeads ? 'checked' : ''}></label>
                        <label class="mod-row ${cr.alwaysRadar ? 'active' : ''}" style="margin:0;padding:6px 10px;"><span>Radar Always On</span><input type="checkbox" class="js-cg-cb" data-cg="alwaysRadar" ${cr.alwaysRadar ? 'checked' : ''}></label>
                        <label class="mod-row ${cr.killstreaksEnabled !== false ? 'active' : ''}" style="margin:0;padding:6px 10px;"><span>Killstreaks Enabled</span><input type="checkbox" class="js-cg-cb" data-cg="killstreaksEnabled" ${cr.killstreaksEnabled !== false ? 'checked' : ''}></label>
                        <label class="mod-row ${cr.killcamEnabled !== false ? 'active' : ''}" style="margin:0;padding:6px 10px;"><span>15s Winner Killcam</span><input type="checkbox" class="js-cg-cb" data-cg="killcamEnabled" ${cr.killcamEnabled !== false ? 'checked' : ''}></label>
                    </div>
                `;
                left.querySelectorAll('[data-mpmode]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedMpMode = b.dataset.mpmode; this.renderLobby(); }; });
                left.querySelectorAll('[data-mpmap]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedMpMap = b.dataset.mpmap; this.renderLobby(); }; });
                left.querySelectorAll('[data-diff]').forEach((b) => { b.onclick = () => { BO.Sound.playUIClick(); this.selectedDifficulty = b.dataset.diff; this.renderLobby(); }; });

                left.querySelectorAll('.js-cg-preset').forEach((pb) => {
                    pb.onclick = () => {
                        BO.Sound.playUIClick();
                        const p = pb.dataset.preset;
                        Object.assign(this.customRules, BO.MPMode.getDefaultCustomRules());
                        if (p === 'unarmed') { this.customRules.enemyWeaponMode = 'unarmed'; this.customRules.enemyCount = 10; }
                        else if (p === 'snipers') { this.customRules.enemyWeaponMode = 'snipers'; this.customRules.playerWeaponMode = 'snipers'; this.customRules.oneShotKills = true; }
                        else if (p === 'chaos') { this.customRules.gravityScale = 0.5; this.customRules.speedScale = 1.6; this.customRules.jumpScale = 1.6; this.customRules.bigHeads = true; this.customRules.explosiveRounds = true; this.customRules.unlimitedAmmo = true; }
                        else if (p === 'quickcam') { this.customRules.scoreLimit = 5; this.customRules.enemyHp = 40; this.customRules.killcamEnabled = true; }
                        this.renderLobby();
                    };
                });

                document.getElementById('cg-enemyCount').oninput = (e) => { cr.enemyCount = Number(e.target.value); document.getElementById('cg-ec-lbl').textContent = cr.enemyCount; };
                document.getElementById('cg-teamSize').oninput = (e) => { cr.teamSizeLimit = Number(e.target.value); document.getElementById('cg-ts-lbl').textContent = cr.teamSizeLimit; };
                document.getElementById('cg-enemyWeapons').onchange = (e) => { cr.enemyWeaponMode = e.target.value; };
                document.getElementById('cg-playerWeapons').onchange = (e) => { cr.playerWeaponMode = e.target.value; };
                document.getElementById('cg-scoreLimit').oninput = (e) => { cr.scoreLimit = Math.max(0, parseInt(e.target.value, 10) || 0); };
                document.getElementById('cg-timeLimit').oninput = (e) => { cr.timeLimit = Math.max(0, parseInt(e.target.value, 10) || 0); };
                document.getElementById('cg-enemyHp').oninput = (e) => { cr.enemyHp = Math.max(1, parseInt(e.target.value, 10) || 100); };
                document.getElementById('cg-playerHp').oninput = (e) => { cr.playerHp = Math.max(1, parseInt(e.target.value, 10) || 100); };
                document.getElementById('cg-gravity').oninput = (e) => { cr.gravityScale = Number(e.target.value); document.getElementById('cg-grv-lbl').textContent = cr.gravityScale + 'x'; };
                document.getElementById('cg-speed').oninput = (e) => { cr.speedScale = Number(e.target.value); document.getElementById('cg-spd-lbl').textContent = cr.speedScale + 'x'; };
                document.getElementById('cg-jump').oninput = (e) => { cr.jumpScale = Number(e.target.value); document.getElementById('cg-jmp-lbl').textContent = cr.jumpScale + 'x'; };
                document.getElementById('cg-respawn').oninput = (e) => { cr.respawnDelay = Number(e.target.value); document.getElementById('cg-rsp-lbl').textContent = cr.respawnDelay + 's'; };
                left.querySelectorAll('.js-cg-cb').forEach((cb) => {
                    cb.onchange = (e) => { BO.Sound.playUIClick(); cr[e.target.dataset.cg] = e.target.checked; this.renderLobby(); };
                });
            } else {
                const tdMaps = BO.MapsData.listByMode('td');
                const tc = this.tdConfig;
                const mods = tc.modifiers;
                const tdModes = [
                    { id: 'standard', name: 'STANDARD SIEGE', sub: 'Classic scaling waves with 20 rotating deployables.' },
                    { id: 'all_bosses', name: '💀 ALL BOSSES', sub: 'Every single enemy spawned is a giant Boss!' },
                    { id: 'boss_rush', name: '★ BOSS RUSH', sub: 'Guaranteed Bosses on Wave 1 and every wave!' },
                    { id: 'gun_warfare', name: '🔫 GUN-TOTING HORDE', sub: '75%+ of zombies carry rifles & shoot back!' },
                    { id: 'magic_siege', name: '✨ MAGICAL SIEGE', sub: 'Arcane zombies shoot purple magic bolts!' },
                    { id: 'endless_swarm', name: '⚡ ENDLESS SWARM', sub: 'All 20 enemy types unlocked Wave 1 + Fast Horde!' }
                ];
                const tdDiffs = [
                    { id: 'easy', name: 'EASY', col: '#22c55e' },
                    { id: 'medium', name: 'MEDIUM', col: '#38bdf8' },
                    { id: 'hard', name: 'HARD', col: '#f59e0b' },
                    { id: 'hell', name: '🔥 HELL', col: '#ef4444' }
                ];
                const MOD_DEFS = ALL_WAVE_MODIFIERS;

                left.innerHTML = `
                    <div class="panel-title" style="color:#22c55e;">1. SELECT CASTLE DEFENSE SETUP (3 MAPS • 2 MULTI-HEIGHT SNIPING TOWERS EACH)</div>
                    <div class="card-grid">
                        ${tdMaps.map((m) => `
                            <button class="select-card ${this.selectedTdMap === m.id ? 'active' : ''}" data-tdmap="${m.id}"
                                style="${this.selectedTdMap === m.id ? 'border-color:#22c55e;background:rgba(34,197,94,0.14);' : ''}">
                                <div class="card-head" style="color:#4ade80;">${m.name}</div>
                                <div class="card-sub">${m.subtitle}<br>Includes 2 Sniping Towers (4 Heights), 14 Perks (Max 8), Pack-a-Punch, Attachment Station &amp; War Gong!</div>
                            </button>`).join('')}
                    </div>

                    <div class="panel-title" style="color:#38bdf8;margin-top:8px;">2. TOWER DEFENSE MODE &amp; DIFFICULTY</div>
                    <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px;margin-bottom:6px;">
                        ${tdModes.map((mm) => `
                            <button class="select-card ${tc.tdMode === mm.id ? 'active' : ''}" data-tdmode="${mm.id}" style="padding:8px;">
                                <div class="card-head" style="font-size:12px;">${mm.name}</div>
                                <div class="card-sub" style="font-size:10.5px;">${mm.sub}</div>
                            </button>`).join('')}
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                        ${tdDiffs.map((d) => `
                            <button class="btn btn-sm ${tc.difficulty === d.id ? 'btn-primary' : ''}" data-tddiff="${d.id}"
                                style="${tc.difficulty === d.id ? `border-color:${d.col};color:${d.col};` : ''}">${d.name}</button>
                        `).join('')}
                    </div>

                    <div class="panel-title" style="color:#fde047;">3. CUSTOM BATTLEFIELD &amp; HORDE SETTINGS</div>
                    <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px;margin-bottom:8px;">
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Starting Zombies: <b id="td-sz-lbl" style="color:#fde047;">${tc.startingZombies}</b></span>
                            <input type="range" id="td-startZ" min="3" max="60" step="1" value="${tc.startingZombies}" style="width:110px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Custom Map Size</span>
                            <select id="td-mapSize" style="max-width:135px;">
                                <option value="0.7" ${tc.mapSize === 0.7 ? 'selected' : ''}>COMPACT (0.7x)</option>
                                <option value="1" ${tc.mapSize === 1.0 ? 'selected' : ''}>STANDARD (1.0x)</option>
                                <option value="1.35" ${tc.mapSize === 1.35 ? 'selected' : ''}>LARGE (1.35x)</option>
                                <option value="1.75" ${tc.mapSize === 1.75 ? 'selected' : ''}>MASSIVE (1.75x)</option>
                            </select>
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Wall Barrier HP: <b id="td-whp-lbl" style="color:#4ade80;">${tc.wallHp}</b></span>
                            <input type="range" id="td-wallHp" min="50" max="2000" step="50" value="${tc.wallHp}" style="width:110px;">
                        </div>
                        <div class="setting-row" style="background:var(--glass-card);padding:8px 10px;border:1px solid var(--border-subtle);">
                            <span>Zombies w/ Guns: <b id="td-gpct-lbl" style="color:#f59e0b;">${tc.gunZombiePct}%</b></span>
                            <input type="range" id="td-gunPct" min="0" max="100" step="5" value="${tc.gunZombiePct}" style="width:110px;">
                        </div>
                    </div>

                    <div class="panel-title" style="color:#f87171;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
                        <span>4. ENEMY POOL (70 ENEMIES + 10 BOSSES • EASY 50% / NORMAL 25% / HARD 15% / BOSS 10%)</span>
                        <button class="btn btn-sm btn-zombies" id="btn-td-open-ep">🧟 ENABLE / DISABLE ENEMIES (${80 - disabledCount}/80 ON)</button>
                    </div>
                    <div class="panel-title" style="color:#c084fc;">5. CUSTOM MODIFIERS (${MOD_DEFS.length} MODIFIERS — MIX &amp; MATCH!)</div>
                    <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:6px;">
                        ${MOD_DEFS.map((md) => `
                            <label class="mod-row ${mods[md.k] ? 'active' : ''}" style="margin:0;padding:6px 9px;font-size:11.5px;">
                                <span>${md.lbl}</span>
                                <input type="checkbox" class="js-td-mod" data-tdmod="${md.k}" ${mods[md.k] ? 'checked' : ''}>
                            </label>
                        `).join('')}
                    </div>
                `;
                left.querySelectorAll('[data-tdmap]').forEach((b) => {
                    b.onclick = () => { BO.Sound.playUIClick(); this.selectedTdMap = b.dataset.tdmap; this.renderLobby(); };
                });
                left.querySelectorAll('[data-tdmode]').forEach((b) => {
                    b.onclick = () => { BO.Sound.playUIClick(); tc.tdMode = b.dataset.tdmode; this.renderLobby(); };
                });
                left.querySelectorAll('[data-tddiff]').forEach((b) => {
                    b.onclick = () => { BO.Sound.playUIClick(); tc.difficulty = b.dataset.tddiff; this.renderLobby(); };
                });
                document.getElementById('td-startZ').oninput = (e) => {
                    tc.startingZombies = Number(e.target.value);
                    document.getElementById('td-sz-lbl').textContent = tc.startingZombies;
                    if (BO.Net && BO.Net.active && BO.Net.isHost) BO.Net.broadcastLobbySettings();
                };
                document.getElementById('td-mapSize').onchange = (e) => {
                    tc.mapSize = Number(e.target.value);
                    if (BO.Net && BO.Net.active && BO.Net.isHost) BO.Net.broadcastLobbySettings();
                };
                document.getElementById('td-wallHp').oninput = (e) => {
                    tc.wallHp = Number(e.target.value);
                    document.getElementById('td-whp-lbl').textContent = tc.wallHp;
                    if (BO.Net && BO.Net.active && BO.Net.isHost) BO.Net.broadcastLobbySettings();
                };
                document.getElementById('td-gunPct').oninput = (e) => {
                    tc.gunZombiePct = Number(e.target.value);
                    document.getElementById('td-gpct-lbl').textContent = tc.gunZombiePct + '%';
                    if (BO.Net && BO.Net.active && BO.Net.isHost) BO.Net.broadcastLobbySettings();
                };
                const tdEpBtn = document.getElementById('btn-td-open-ep');
                if (tdEpBtn) tdEpBtn.onclick = () => { BO.Sound.playUIClick(); this.openEnemyPoolModal(); };
                left.querySelectorAll('.js-td-mod').forEach((cb) => {
                    cb.onchange = (e) => {
                        BO.Sound.playUIClick();
                        mods[e.target.dataset.tdmod] = e.target.checked;
                        this.renderLobby();
                    };
                });
            }

            if (BO.Net && BO.Net.active && BO.Net.isHost) {
                BO.Net.broadcastLobbySettings();
            }

            const classes = BO.Loadout.getClasses();
            const selIdx = BO.Loadout.getSelectedClassIndex();
            const activeCls = classes[selIdx];
            const ult = BO.AttachmentsData.ULTIMATE_POWERS[activeCls.ultimatePower || 'gravity_spikes'];
            const netActive = !!(BO.Net && BO.Net.active);
            const isClientInLobby = netActive && !BO.Net.isHost;

            right.innerHTML = `
                <div class="panel-title" style="color:#22c55e;">🌐 ONLINE SQUAD LOBBY (ALL 3 MODES)</div>
                <div id="net-lobby-box" style="background:rgba(13,19,29,0.92);border:1px solid #22c55e;padding:10px;display:flex;flex-direction:column;gap:8px;"></div>

                <div class="panel-title" style="margin-top:4px;">ACTIVE CLASS DEPLOYMENT</div>
                <select id="lobby-class-select" data-tip-title="Pick Your Class" data-tip="Choose which of your 10 custom classes you want to take into this match." style="background:#0d131d;color:#f8fafc;border:1px solid var(--border-subtle);padding:10px;font-family:var(--font-ui);font-size:14px;">
                    ${classes.map((c, i) => `<option value="${i}" ${i === selIdx ? 'selected' : ''}>${i + 1}. ${c.name}</option>`).join('')}
                </select>
                <div class="select-card" data-tip-title="Current Loadout Summary" data-tip="Everything inside your selected class—click OPEN 3D GUNSMITH below to change any piece.">
                    <div class="card-head">${BO.WeaponsData.get(activeCls.primary.id).name}</div>
                    <div class="card-sub">Side Weapon: ${BO.WeaponsData.get(activeCls.secondary.id).shortName} • Camo: ${BO.AttachmentsData.getCamo(activeCls.primary.camo).name}</div>
                    <div class="card-sub">Grenade [G]: ${BO.AttachmentsData.LETHALS[activeCls.lethal]?.name} • Tactical [Q]: ${BO.AttachmentsData.TACTICALS[activeCls.tactical]?.name}</div>
                    <div class="card-sub">Special [X]: ${BO.AttachmentsData.FIELD_UPGRADES[activeCls.fieldUpgrade]?.name} • Ultimate [U]: ${ult ? ult.name : ''}</div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn" id="lobby-edit-class" style="flex:1;" data-tip-title="3D Gunsmith" data-tip="Customize your primary gun, side weapon, attachments, perks, grenade, tactical, special power, and ultimate power.">3D GUNSMITH</button>
                    <button class="btn" id="lobby-open-legend" style="flex:1;border-color:#38bdf8;color:#38bdf8;" data-tip-title="Master Legend" data-tip="Read stats for all 70 weapons, 20 zombies, 5 bosses, Mystery Box odds, and cheat codes.">LEGEND</button>
                </div>
                ${BO.Cheats && BO.Cheats.isModMenuUnlocked() ? `<button class="btn" id="lobby-open-modmenu" style="border-color:#fde047;color:#fde047;">★ OPEN ZOMBIES MOD MENU</button>` : ''}
                <div style="flex:1"></div>
                <button class="btn ${isZ ? 'btn-zombies' : 'btn-primary'}" id="btn-deploy-match" style="padding:14px;font-size:17px;"
                    data-tip-title="Start Match!" data-tip="Launches the 3D battlefield for everyone in your online lobby!">
                    ${isClientInLobby ? 'DEPLOY NOW (OR WAIT FOR HOST)' : (netActive ? `DEPLOY SQUAD (${BO.Net.players.size}) INTO COMBAT` : `DEPLOY INTO COMBAT ${isZ && roundsUnlocked && this.selectedStartRound > 1 ? `(ROUND ${this.selectedStartRound})` : ''}`)}
                </button>
            `;
            document.getElementById('lobby-class-select').onchange = (e) => {
                BO.Loadout.setSelectedClassIndex(Number(e.target.value));
                if (BO.Net && BO.Net.active) BO.Net.syncMyProfile();
                this.renderLobby();
            };
            document.getElementById('lobby-edit-class').onclick = () => { BO.Sound.playUIClick(); this.showScreen('gunsmith'); };
            document.getElementById('lobby-open-legend').onclick = () => { BO.Sound.playUIClick(); this.openLegend('howto'); };
            const lModBtn = document.getElementById('lobby-open-modmenu');
            if (lModBtn) lModBtn.onclick = () => { BO.Sound.playUIClick(); this.openModMenu(); };
            document.getElementById('btn-deploy-match').onclick = () => {
                BO.Sound.playUIClick();
                if (this.onStartMatch) {
                    if (isZ) {
                        this.onStartMatch({
                            mode: 'zombies',
                            mapId: this.selectedZMap,
                            difficulty: this.selectedZDifficulty || 'normal',
                            useClassicStarter: this.classicStarter,
                            startRound: roundsUnlocked ? this.selectedStartRound : 1,
                            zModifiers: BO.Math.deepClone(this.zModifiers),
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

            document.getElementById('barracks-tabs').innerHTML = `
                <button class="btn ${this.barracksTab === 'bestiary' ? 'btn-zombies' : ''}" data-btab="bestiary"
                    data-tip-title="20 Zombies & 5 Bosses Guide" data-tip="See all 20 unique zombies, when each one unlocks (every 3 rounds!), their spawn odds, stats, weaknesses, and all 5 Bosses!">ZOMBIE GUIDE (20 + 5 BOSSES)</button>
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
                const bosses = Object.values(BO.ZombiesData.BOSSES_BY_ROUND);
                const zombies = BO.ZombiesData.ZOMBIE_TYPES;
                body.innerHTML = `
                    <div class="panel-title" style="color:#f87171;">5 UNIQUE BOSS ROUNDS (ROUNDS 5, 10, 20, 25 &amp; 50)</div>
                    <div class="card-grid" style="margin-bottom:14px;">
                        ${bosses.map((b) => `
                            <div class="select-card active-zombies"
                                data-tip-title="ROUND ${b.bossRound} BOSS: ${escAttr(b.name)}"
                                data-tip="${escAttr(b.simpleDesc)}"
                                data-tip-sub="${escAttr(b.weaknessText)} | Reward: +${b.drops.points} PTS &amp; Guaranteed Power-Up">
                                <div class="card-head" style="color:#f87171;">RD ${b.bossRound}: ${b.name}</div>
                                <div class="card-sub"><b>${b.title}</b><br>HP: ${b.hp} • SPD: ${b.speed} • ATK: ${b.attack} • DEF: ${Math.round(b.defense * 100)}%<br>${b.weaknessText}</div>
                            </div>`).join('')}
                    </div>
                    <div class="panel-title">20 UNIQUE ZOMBIES (1 NEW ADDED EVERY 3 ROUNDS • TOUGHER = LOWER SPAWN ODDS)</div>
                    <div class="card-grid">
                        ${zombies.map((z) => {
                            const odds = BO.ZombiesData.getSpawnOddsPercent(z, 60);
                            const res = z.resistances;
                            return `<div class="select-card"
                                data-tip-title="#${z.tier} ${escAttr(z.name)} (Unlocks Round ${z.unlockRound})"
                                data-tip="${escAttr(z.simpleDesc)}"
                                data-tip-sub="Habit: ${z.movementHabit} • Attack: ${z.attackType} • Bullet ${Math.round(res.bullet * 100)}% / Blast ${Math.round(res.explosive * 100)}% / Fire ${Math.round(res.fire * 100)}% / HS ${Math.round(res.headshot * 100)}%">
                                <div class="card-head">#${z.tier} ${z.name} <span style="font-size:11px;color:#f5a623;">RD ${z.unlockRound}+</span></div>
                                <div class="card-sub">HP: ${z.hp} • SPD: ${z.speed} • ATK: ${z.attack} • DEF: ${Math.round(z.defense * 100)}%<br>RNG Weight: ${z.spawnWeight} (${odds}% at full pool) • ${z.attackType.replace('_', ' ')}</div>
                            </div>`;
                        }).join('')}
                    </div>
                `;
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

        /* ====================================================================
           MASTER LEGEND & COMBAT ENCYCLOPEDIA (8 TABS)
        ==================================================================== */
        openLegend(tab = 'howto') {
            if (tab) this.legendTab = tab;
            this.renderLegend();
            this.modalLegend.classList.remove('hidden');
        }

        renderLegend() {
            const tabsEl = document.getElementById('legend-tabs');
            const body = document.getElementById('legend-body');
            if (!tabsEl || !body) return;

            const TABS = [
                { id: 'howto', label: '1. HOW TO PLAY & BOX ODDS', tip: 'Learn controls, how Zombies & Multiplayer work, Pack-a-Punch tiers, and the exact Mystery Box odds.' },
                { id: 'personal', label: '2. PERSONAL STATS', tip: 'Your soldier health, armor plates, movement speeds, rank, prestige, and lifetime combat record.' },
                { id: 'guns', label: '3. 50 FIREARMS (GUN STATS)', tip: 'All 50 unique guns with tier, damage, fire rate, headshot bonus, range, magazine, reload, and Pack-a-Punch name.' },
                { id: 'melee', label: '4. 10 MELEE WEAPONS', tip: 'All 10 unique melee blades & blunt weapons with damage, cleave count, speed bonus, and special effects.' },
                { id: 'magic', label: '5. 10 MAGIC WEAPONS', tip: 'All 10 super-special wonder weapons (Black Hole, Chain Lightning, Dragon Breath, Frost Sceptre, Soul Skull & more).' },
                { id: 'powers', label: '6. POWERS, PERKS & GEAR', tip: 'Every Perk-a-Cola, Loadout Perk, Grenade, Tactical item, Special Power [X], Ultimate Power [U], and Killstreak.' },
                { id: 'enemies', label: '7. 20 ZOMBIES & 5 BOSSES', tip: 'Every zombie & boss with unlock round, RNG spawn odds, HP, speed, attack, defense, resistances, and drops.' },
                { id: 'rounds_cheats', label: '8. ROUND INFO & CHEAT CODES', tip: 'How the 3-round zombie pool rule works, Boss round schedule, Exfil rules, and all 13 Zombies cheat codes!' }
            ];

            tabsEl.innerHTML = TABS.map((t) => `
                <button class="btn btn-sm ${this.legendTab === t.id ? 'btn-primary' : ''}" data-ltab="${t.id}"
                    data-tip-title="${escAttr(t.label)}" data-tip="${escAttr(t.tip)}">
                    ${t.label}
                </button>
            `).join('');
            tabsEl.querySelectorAll('[data-ltab]').forEach((b) => {
                b.onclick = () => { BO.Sound.playUIClick(); this.legendTab = b.dataset.ltab; this.renderLegend(); };
            });

            const kb = BO.Settings.getKeybinds();

            if (this.legendTab === 'howto') {
                body.innerHTML = `
                    <div class="panel-title">HOW TO PLAY BLACKOUT OPS</div>
                    <div class="card-grid" style="margin-bottom:14px;">
                        <div class="select-card">
                            <div class="card-head" style="color:#f5a623;">1. MOVEMENT &amp; SHOOTING</div>
                            <div class="card-sub">Move with <b>${formatKeyCode(kb.forward)}/${formatKeyCode(kb.left)}/${formatKeyCode(kb.back)}/${formatKeyCode(kb.right)}</b>, hold <b>${formatKeyCode(kb.sprint)}</b> to Sprint (double-tap for Tactical Sprint), press <b>${formatKeyCode(kb.crouch)}</b> while sprinting to Slide, and press <b>${formatKeyCode(kb.jump)}</b> to Jump or Mantle ledges. Left-Click shoots and Right-Click aims down sights (ADS).</div>
                        </div>
                        <div class="select-card">
                            <div class="card-head" style="color:#f87171;">2. COD ZOMBIES SURVIVAL</div>
                            <div class="card-sub">Earn Points by hitting (<b>+10</b>) and killing zombies (<b>+60 to +320</b>). Press <b>[${formatKeyCode(kb.interact)}]</b> to open doors, flip the Main Power Switch, buy Wall Guns, drink 6 Perk-a-Colas, spin the Mystery Box (<b>950 PTS</b>), and upgrade any weapon 3 times in the Pack-a-Punch Machine!</div>
                        </div>
                        <div class="select-card">
                            <div class="card-head" style="color:#c084fc;">3. 3-TIER PACK-A-PUNCH MACHINE</div>
                            <div class="card-sub">Once Power is ON, visit the glowing purple Pack-a-Punch machine:<br>• <b>Tier I (5,000 PTS):</b> +90% Damage, +50% Mag, +60% Reserve &amp; custom PaP name.<br>• <b>Tier II (10,000 PTS):</b> 2.65x Damage + Double Reserve.<br>• <b>Tier III (15,000 PTS):</b> 3.55x Damage + Triple Reserve!</div>
                        </div>
                        <div class="select-card">
                            <div class="card-head" style="color:#38bdf8;">4. CREATE-A-CLASS &amp; POWERS</div>
                            <div class="card-sub">Build 10 custom classes with a Primary + 5 Attachments + Camo, Side Weapon + 5 Attachments + Camo, 3 Perks, Grenade <b>[${formatKeyCode(kb.lethal)}]</b>, Tactical <b>[${formatKeyCode(kb.tactical)}]</b>, Special Power <b>[${formatKeyCode(kb.special)}]</b>, and Ultimate Power <b>[${formatKeyCode(kb.ultimate)}]</b>!</div>
                        </div>
                    </div>

                    <div class="panel-title" style="color:#fde047;">OFFICIAL MYSTERY BOX ODDS TABLE (950 PTS / 10 PTS FIRE SALE)</div>
                    <table class="legend-table">
                        <thead>
                            <tr><th>DROP TIER</th><th>EXACT ODDS</th><th>POOL SIZE</th><th>WHAT YOU GET</th></tr>
                        </thead>
                        <tbody>
                            <tr><td><span class="tier-pill tier-common">Common Tier Weapon</span></td><td><b>60%</b></td><td>32 Guns</td><td>Reliable military rifles, SMGs, shotguns, LMGs, snipers, and sidearms.</td></tr>
                            <tr><td><span class="tier-pill tier-uncommon">Uncommon Weapon</span></td><td><b>15%</b></td><td>18 Guns</td><td>High-spec prototype firearms, heavy anti-materiel rifles, rotary minigun &amp; launchers.</td></tr>
                            <tr><td><span class="tier-pill tier-common">Common Melee Weapon</span></td><td><b>10%</b></td><td>6 Melee</td><td>Fast close-quarters blades &amp; blunt weapons (Combat Knife, Tactical Axe, Riot Baton, Machete, Crowbar, Trench Shovel).</td></tr>
                            <tr><td><span class="tier-pill tier-uncommon">Uncommon Melee Weapon</span></td><td><b>5%</b></td><td>4 Melee</td><td>Elite multi-target melee weapons (Carbon Katana, 20lb Sledgehammer, Ripper Chainsaw, Grim Reaper Scythe).</td></tr>
                            <tr><td><span class="tier-pill tier-magic">Magic Wonder Weapon</span></td><td><b>5%</b></td><td>10 Magic</td><td>Super-special supernatural wonder weapons (Ray Gun, Zeus Cannon, Singularity Orb, Wunderwaffe, Dragon Breath, Cryo Sceptre, Necro Skull, Solar Lance, Hydra Acid, Chrono Splitter)!</td></tr>
                            <tr><td><span class="tier-pill" style="color:#ef4444;">Nothing (Empty Roll)</span></td><td><b>5%</b></td><td>—</td><td>The Mystery Box laughs and comes up empty! (Use cheat code <b>wondernomore</b> to pick any weapon directly.)</td></tr>
                        </tbody>
                    </table>
                `;
            } else if (this.legendTab === 'personal') {
                const P = BO.Player;
                const info = BO.Progression.getRankInfo();
                const stats = BO.Save.data.stats;
                const cls = BO.Loadout.getActiveClass();
                const kd = (stats.mpKills / Math.max(1, stats.mpDeaths)).toFixed(2);
                const acc = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) + '%' : '0%';
                const speedMult = (BO.Cheats && BO.Cheats.isActive('superfast')) ? '4.0x (SUPERFAST)' : ((BO.Cheats && BO.Cheats.isActive('fast')) ? '2.0x (FAST)' : '1.0x');
                const sizeMult = (BO.Cheats && BO.Cheats.isActive('tiny')) ? '25% (TINY)' : '100% (1.75m)';

                body.innerHTML = `
                    <div class="panel-title">SOLDIER VITALS &amp; PHYSICAL STATS</div>
                    <div class="card-grid" style="margin-bottom:14px;">
                        <div class="select-card"><div class="card-head">HEALTH: ${P ? Math.ceil(P.hp) : 100} / ${P ? P.maxHp : 100} HP</div><div class="card-sub">Base 100 HP • Juggernog boosts to <b>250 HP</b> • Auto-regenerates after 4.0s out of combat (instant on kill with Quick-Fix).</div></div>
                        <div class="select-card"><div class="card-head">ARMOR: ${P ? Math.ceil(P.armor) : 150} / 150 (3 PLATES)</div><div class="card-sub">3 Armor Plates (50 Armor each = 150 total). Absorbs 65% of incoming damage. Press <b>[${formatKeyCode(kb.armor)}]</b> to insert a reserve plate.</div></div>
                        <div class="select-card"><div class="card-head">MOVEMENT SPEED: ${speedMult}</div><div class="card-sub">Walk: <b>4.9 m/s</b> • Sprint: <b>7.15 m/s</b> • Tactical Sprint: <b>8.45 m/s</b> • Slide Boost: <b>10.2 m/s</b> • Stamin-Up adds +14%.</div></div>
                        <div class="select-card"><div class="card-head">JUMP &amp; SIZE: ${sizeMult}</div><div class="card-sub">Base Jump Velocity: <b>7.5 m/s</b> • Auto-Mantle up to <b>1.55m</b> ledges • Supports 2x High Jump &amp; Airborne Double-Jump cheats.</div></div>
                    </div>

                    <div class="panel-title">ACTIVE CLASS &amp; CAREER PROGRESSION</div>
                    <div class="card-grid">
                        <div class="select-card"><div class="card-head">RANK ${info.level} / 55 (${info.rankName})</div><div class="card-sub">Prestige: <b>${info.prestigeInfo.title}</b> (+${info.prestige * 10}% XP) • Next Level in ${info.xpNeededForNext} XP</div></div>
                        <div class="select-card"><div class="card-head">ACTIVE CLASS: ${cls.name}</div><div class="card-sub">Primary: <b>${BO.WeaponsData.get(cls.primary.id).name}</b><br>Sidearm: <b>${BO.WeaponsData.get(cls.secondary.id).name}</b></div></div>
                        <div class="select-card"><div class="card-head">ZOMBIES RECORD: ${stats.zombiesKills} KILLS</div><div class="card-sub">Headshots: ${stats.zombiesHeadshots} • Box Spins: ${stats.zombiesBoxSpins || 0} • PaP Upgrades: ${stats.zombiesPaPUsed || 0} • Exfils: ${stats.zombiesExfils || 0}</div></div>
                        <div class="select-card"><div class="card-head">MULTIPLAYER RECORD: ${kd} K/D</div><div class="card-sub">Kills: ${stats.mpKills} • Deaths: ${stats.mpDeaths} • Wins: ${stats.mpWins} • Accuracy: ${acc}</div></div>
                    </div>
                `;
            } else if (this.legendTab === 'guns') {
                const cats = ['ALL', 'Assault Rifle', 'SMG', 'Shotgun', 'LMG', 'Marksman Rifle', 'Sniper Rifle', 'Pistol', 'Launcher'];
                const allGuns = BO.WeaponsData.listGuns();
                const guns = allGuns.filter((g) => this.legendGunFilter === 'ALL' || g.category === this.legendGunFilter);
                body.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                        <div class="panel-title" style="margin:0;border:none;">FIREARMS REGISTRY (${allGuns.length} GUNS • SHOWING ${guns.length})</div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${cats.map((c) => `<button class="btn btn-sm ${this.legendGunFilter === c ? 'btn-primary' : ''}" data-gcat="${c}">${c}</button>`).join('')}
                        </div>
                    </div>
                    <table class="legend-table">
                        <thead>
                            <tr><th>#</th><th>WEAPON NAME</th><th>TIER</th><th>CATEGORY</th><th>DMG</th><th>RPM</th><th>HS</th><th>RANGE</th><th>MAG / RES</th><th>RLD</th><th>ADS</th><th>PACK-A-PUNCH NAME</th></tr>
                        </thead>
                        <tbody>
                            ${guns.map((w, i) => `
                                <tr data-tip-title="${escAttr(w.name)}" data-tip="${escAttr(w.description)}" data-tip-sub="Pack-a-Punch: ${escAttr(w.papName)} (${w.papDamageMult}x Base Damage)">
                                    <td>${i + 1}</td>
                                    <td><b>${w.name}</b></td>
                                    <td><span class="tier-pill tier-${w.tier}">${w.tier}</span></td>
                                    <td>${w.category}</td>
                                    <td style="color:#f5a623;font-family:var(--font-mono);">${w.damage}${w.pellets > 1 ? 'x' + w.pellets : ''}</td>
                                    <td style="font-family:var(--font-mono);">${w.rpm}</td>
                                    <td>${w.headMult}x</td>
                                    <td>${w.rangeNear}–${w.rangeFar}m</td>
                                    <td>${w.magSize} / ${w.reserveAmmo}</td>
                                    <td>${w.reloadTime.toFixed(2)}s</td>
                                    <td>${Math.round(w.adsTime * 1000)}ms</td>
                                    <td style="color:#c084fc;font-weight:700;">${w.papName}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
                body.querySelectorAll('[data-gcat]').forEach((b) => {
                    b.onclick = () => { BO.Sound.playUIClick(); this.legendGunFilter = b.dataset.gcat; this.renderLegend(); };
                });
            } else if (this.legendTab === 'melee') {
                const melees = BO.WeaponsData.listMelee();
                body.innerHTML = `
                    <div class="panel-title">ALL 10 UNIQUE MELEE WEAPONS (6 COMMON • 4 UNCOMMON)</div>
                    <table class="legend-table">
                        <thead>
                            <tr><th>#</th><th>MELEE WEAPON</th><th>TIER</th><th>DAMAGE</th><th>SWING RPM</th><th>REACH</th><th>CLEAVE</th><th>MOVE SPD</th><th>SPECIAL EFFECT</th><th>PACK-A-PUNCH NAME</th></tr>
                        </thead>
                        <tbody>
                            ${melees.map((w, i) => `
                                <tr data-tip-title="${escAttr(w.name)}" data-tip="${escAttr(w.description)}" data-tip-sub="Pack-a-Punch: ${escAttr(w.papName)} (${w.papDamageMult}x Damage)">
                                    <td>${i + 1}</td>
                                    <td><b>${w.name}</b></td>
                                    <td><span class="tier-pill tier-${w.tier}">${w.tier}</span></td>
                                    <td style="color:#f5a623;font-family:var(--font-mono);font-weight:800;">${w.damage}</td>
                                    <td>${w.rpm} RPM</td>
                                    <td>${w.rangeFar.toFixed(2)}m</td>
                                    <td>Hits <b>${w.cleave || 1}</b></td>
                                    <td>${Math.round(w.moveSpeedMult * 100)}%</td>
                                    <td style="color:#38bdf8;text-transform:uppercase;font-weight:700;">${w.meleeEffect || 'slash'}</td>
                                    <td style="color:#c084fc;font-weight:700;">${w.papName}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else if (this.legendTab === 'magic') {
                const magics = BO.WeaponsData.listMagic();
                body.innerHTML = `
                    <div class="panel-title" style="color:#c084fc;">ALL 10 SUPER-SPECIAL MAGIC WONDER WEAPONS (5% MYSTERY BOX ODDS)</div>
                    <div class="card-grid" style="margin-bottom:14px;">
                        ${magics.map((w, i) => `
                            <div class="select-card" style="border-color:#c084fc;">
                                <div class="card-head" style="color:#c084fc;">#${i + 1} ${w.name}</div>
                                <div class="card-sub">
                                    <b>Spell Type:</b> <span style="color:#38bdf8;text-transform:uppercase;">${(w.magicType || '').replace('_', ' ')}</span><br>
                                    <b>Damage:</b> ${w.damage}${w.pellets > 1 ? 'x' + w.pellets : ''} • <b>RPM:</b> ${w.rpm} • <b>Mag:</b> ${w.magSize}/${w.reserveAmmo}<br>
                                    <b>Pack-a-Punch:</b> <span style="color:#fde047;">${w.papName} (${w.papDamageMult}x DMG)</span><br>
                                    <span style="color:#e2e8f0;">${w.description}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (this.legendTab === 'powers') {
                const zPerks = Object.values(BO.ZombiesData.PERK_MACHINES);
                const mpPerks = Object.values(BO.AttachmentsData.PERKS);
                const specials = Object.values(BO.AttachmentsData.FIELD_UPGRADES);
                const ults = Object.values(BO.AttachmentsData.ULTIMATE_POWERS);
                const lethals = Object.values(BO.AttachmentsData.LETHALS);
                const tacticals = Object.values(BO.AttachmentsData.TACTICALS);
                const streaks = Object.values(BO.AttachmentsData.KILLSTREAKS);

                body.innerHTML = `
                    <div class="panel-title" style="color:#fde047;">5 ULTIMATE SUPER POWERS [KEY ${formatKeyCode(kb.ultimate)}] &amp; 4 SPECIAL POWERS [KEY ${formatKeyCode(kb.special)}]</div>
                    <div class="card-grid" style="margin-bottom:14px;">
                        ${ults.map((u) => `<div class="select-card" style="border-color:${u.color}"><div class="card-head" style="color:${u.color}">ULTIMATE: ${u.name}</div><div class="card-sub">${u.desc}</div></div>`).join('')}
                        ${specials.map((s) => `<div class="select-card"><div class="card-head" style="color:#38bdf8">SPECIAL: ${s.name}</div><div class="card-sub">${s.desc} (Cooldown: ${s.cooldown}s)</div></div>`).join('')}
                    </div>

                    <div class="panel-title" style="color:#ef4444;">POKÉBALL (1% MYSTERY BOX / TACTICAL [Q]) — ALL 10 POKÉMON BATTLE ALLIES</div>
                    <div class="card-grid" style="margin-bottom:14px;">
                        ${(BO.AttachmentsData.POKEMON_ROSTER || []).map((pk, idx) => `
                            <div class="select-card" style="border-color:#fde047;">
                                <div class="card-head" style="color:#fde047;">#${idx + 1} ${pk.name} — ${pk.title}</div>
                                <div class="card-sub"><b>Attack DMG:</b> ${pk.damage} • <b>Cooldown:</b> ${pk.cooldown}s<br>${pk.desc}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="panel-title" style="color:#f87171;">6 ZOMBIES PERK-A-COLA MACHINES</div>
                    <div class="card-grid" style="margin-bottom:14px;">
                        ${zPerks.map((p) => `<div class="select-card"><div class="card-head" style="color:${p.color}">${p.name} (${p.cost} PTS)</div><div class="card-sub">${p.desc}</div></div>`).join('')}
                    </div>

                    <div class="panel-title">12 CREATE-A-CLASS PERKS, GRENADES [${formatKeyCode(kb.lethal)}], TACTICALS [${formatKeyCode(kb.tactical)}] &amp; KILLSTREAKS</div>
                    <div class="card-grid">
                        ${mpPerks.map((p) => `<div class="select-card"><div class="card-head" style="color:${p.color}">PERK ${p.tier}: ${p.name}</div><div class="card-sub">${p.desc}</div></div>`).join('')}
                        ${lethals.map((l) => `<div class="select-card"><div class="card-head" style="color:#f5a623">GRENADE: ${l.name}</div><div class="card-sub">${l.desc}</div></div>`).join('')}
                        ${tacticals.map((t) => `<div class="select-card"><div class="card-head" style="color:#38bdf8">TACTICAL: ${t.name}</div><div class="card-sub">${t.desc}</div></div>`).join('')}
                        ${streaks.map((k) => `<div class="select-card"><div class="card-head" style="color:#22c55e">STREAK (${k.kills}K): ${k.name}</div><div class="card-sub">${k.desc}</div></div>`).join('')}
                    </div>
                `;
            } else if (this.legendTab === 'enemies') {
                const bosses = Object.values(BO.ZombiesData.BOSSES_BY_ROUND);
                const zombies = BO.ZombiesData.ZOMBIE_TYPES;
                body.innerHTML = `
                    <div class="panel-title" style="color:#f87171;">5 UNIQUE BOSS ROUNDS (ROUNDS 5, 10, 20, 25 &amp; 50)</div>
                    <table class="legend-table" style="margin-bottom:16px;">
                        <thead>
                            <tr><th>ROUND</th><th>BOSS NAME &amp; TITLE</th><th>HP</th><th>SPD</th><th>ATK</th><th>DEF</th><th>HABIT &amp; ATTACK</th><th>WEAKNESS &amp; REWARD</th></tr>
                        </thead>
                        <tbody>
                            ${bosses.map((b) => `
                                <tr>
                                    <td style="color:#f87171;font-weight:800;">ROUND ${b.bossRound}</td>
                                    <td><b>${b.name}</b><br><span style="font-size:11px;color:var(--text-dim);">${b.title}</span></td>
                                    <td style="font-family:var(--font-mono);color:#fde047;">${b.hp}</td>
                                    <td>${b.speed}</td>
                                    <td>${b.attack}</td>
                                    <td>${Math.round(b.defense * 100)}%</td>
                                    <td>${b.movementHabit} / ${b.attackType}</td>
                                    <td>${b.weaknessText}<br><span style="color:#22c55e;">+${b.drops.points} PTS &amp; ${b.drops.guaranteedPowerUp.toUpperCase()}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="panel-title">ALL 20 UNIQUE ZOMBIE TYPES (1 NEW ADDED EVERY 3 COMPLETED ROUNDS)</div>
                    <table class="legend-table">
                        <thead>
                            <tr><th>#</th><th>ZOMBIE TYPE</th><th>UNLOCK RD</th><th>RNG ODDS</th><th>HP</th><th>SPD</th><th>ATK</th><th>DEF</th><th>RESISTANCES (BUL/EXP/FIR/HS)</th><th>HABIT &amp; ATTACK</th><th>DROPS</th></tr>
                        </thead>
                        <tbody>
                            ${zombies.map((z) => {
                                const odds = BO.ZombiesData.getSpawnOddsPercent(z, 60);
                                const r = z.resistances;
                                return `
                                    <tr data-tip-title="#${z.tier} ${escAttr(z.name)}" data-tip="${escAttr(z.simpleDesc)}">
                                        <td>#${z.tier}</td>
                                        <td><b>${z.name}</b></td>
                                        <td style="color:#f5a623;font-weight:700;">Round ${z.unlockRound}</td>
                                        <td>Wt ${z.spawnWeight} (${odds}%)</td>
                                        <td style="font-family:var(--font-mono);">${z.hp}</td>
                                        <td>${z.speed}</td>
                                        <td>${z.attack}</td>
                                        <td>${Math.round(z.defense * 100)}%</td>
                                        <td style="font-family:var(--font-mono);font-size:11px;">${Math.round(r.bullet * 100)}% / ${Math.round(r.explosive * 100)}% / ${Math.round(r.fire * 100)}% / ${Math.round(r.headshot * 100)}%</td>
                                        <td>${z.movementHabit} • ${z.attackType}</td>
                                        <td>+${z.drops.points} PTS (${Math.round(z.drops.dropChance * 100)}% PU)</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
            } else if (this.legendTab === 'rounds_cheats') {
                const defs = BO.Cheats.getDefinitions();
                body.innerHTML = `
                    <div class="panel-title">ZOMBIES ROUND SYSTEM &amp; POOL RULES</div>
                    <div class="card-grid" style="margin-bottom:14px;">
                        <div class="select-card"><div class="card-head">EVERY 3 ROUNDS = NEW ZOMBIE</div><div class="card-sub">Round 1 starts with the Shambler. Every 3 completed rounds (Rounds 4, 7, 10, 13 ... 58), the next tougher zombie is added to the active spawn pool!</div></div>
                        <div class="select-card"><div class="card-head">WEIGHTED RNG SPAWN ODDS</div><div class="card-sub">Easier zombies have high RNG weights (<b>100</b> down to <b>50</b>); elite late-round horrors have rare RNG weights (<b>16</b> down to <b>6</b>).</div></div>
                        <div class="select-card"><div class="card-head">5 BOSS ROUNDS (5 / 10 / 20 / 25 / 50)</div><div class="card-sub">Special Boss waves trigger on Rounds 5, 10, 20, 25, and 50 with a live top-center Boss Health Bar and guaranteed Max Ammo / Nuke rewards!</div></div>
                        <div class="select-card"><div class="card-head">HELICOPTER EXFIL (ROUND 10+)</div><div class="card-sub">From Round 10 onward, press <b>[${formatKeyCode(kb.exfil)}]</b> anytime to call an evacuation helicopter. Clear the LZ within 75 seconds for +1,200 Bonus XP!</div></div>
                    </div>

                    <div class="panel-title" style="color:#fde047;">ALL 13 ZOMBIES CHEAT CODES (ENTER IN SETTINGS → CHEAT CODES)</div>
                    <table class="legend-table">
                        <thead>
                            <tr><th>CHEAT CODE</th><th>NAME</th><th>STATUS</th><th>WHAT IT DOES (ZOMBIES MODE ONLY)</th></tr>
                        </thead>
                        <tbody>
                            ${defs.map((d) => {
                                const on = d.code === 'cheats' ? BO.Cheats.isModMenuUnlocked() : BO.Cheats.isActive(d.code, true);
                                return `
                                    <tr>
                                        <td style="font-family:var(--font-mono);color:#fde047;font-weight:800;font-size:14px;">${d.code}</td>
                                        <td><b>${d.name}</b></td>
                                        <td><span class="tier-pill" style="color:${on ? '#22c55e' : '#94a3b8'}">${on ? 'ACTIVE' : 'OFF'}</span></td>
                                        <td>${d.desc}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
            }
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
                    ${[1, 5, 10, 20, 25, 50].map((r) => `<button class="btn btn-sm js-mod-quick-rnd" data-rnd="${r}">ROUND ${r}${r >= 5 ? ' (BOSS)' : ''}</button>`).join('')}
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
                    if (d.code !== 'tiny') BO.Cheats.setCheat(d.code, true);
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
                    <label class="mod-row ${cc.startAllPerks ? 'active' : ''}"><span><b>Advantage:</b> Start With All 6 Perks</span><input type="checkbox" data-chkey="startAllPerks" ${cc.startAllPerks ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.advDoubleDamage ? 'active' : ''}"><span><b>Advantage:</b> 2x Player Bullet Damage</span><input type="checkbox" data-chkey="advDoubleDamage" ${cc.advDoubleDamage ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.advInstaKill ? 'active' : ''}"><span><b>Advantage:</b> Permanent Insta-Kill</span><input type="checkbox" data-chkey="advInstaKill" ${cc.advInstaKill ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.advDoublePoints ? 'active' : ''}"><span><b>Advantage:</b> Permanent 2x Points</span><input type="checkbox" data-chkey="advDoublePoints" ${cc.advDoublePoints ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.advLowGravity ? 'active' : ''}"><span><b>Advantage:</b> Low Gravity Moon Jump</span><input type="checkbox" data-chkey="advLowGravity" ${cc.advLowGravity ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.disHeadshotsOnly ? 'active' : ''}"><span><b style="color:#ef4444;">Disadvantage:</b> Headshots Only (Body = 0 DMG)</span><input type="checkbox" data-chkey="disHeadshotsOnly" ${cc.disHeadshotsOnly ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.disHalfDamage ? 'active' : ''}"><span><b style="color:#ef4444;">Disadvantage:</b> 0.5x Player Damage</span><input type="checkbox" data-chkey="disHalfDamage" ${cc.disHalfDamage ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.disOneHp ? 'active' : ''}"><span><b style="color:#ef4444;">Disadvantage:</b> 1 HP Glass Cannon (No Armor)</span><input type="checkbox" data-chkey="disOneHp" ${cc.disOneHp ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.disNoPerks ? 'active' : ''}"><span><b style="color:#ef4444;">Disadvantage:</b> No Perks Allowed</span><input type="checkbox" data-chkey="disNoPerks" ${cc.disNoPerks ? 'checked' : ''}></label>
                    <label class="mod-row ${cc.disTurboZombies ? 'active' : ''}"><span><b style="color:#ef4444;">Disadvantage:</b> Turbo Sprint Zombies (1.45x SPD)</span><input type="checkbox" data-chkey="disTurboZombies" ${cc.disTurboZombies ? 'checked' : ''}></label>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div class="panel-title" style="margin:0;border:none;color:#38bdf8;">3. EDIT ACTIVE ZOMBIE SPAWN POOL (${cc.customZombiePool.length === 0 ? 'DEFAULT ROUND POOL' : cc.customZombiePool.length + ' CUSTOM TYPES SELECTED'})</div>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-sm" id="ch-pool-all">SELECT ALL 20</button>
                        <button class="btn btn-sm" id="ch-pool-reset">USE DEFAULT ROUND POOL</button>
                    </div>
                </div>
                <div class="card-grid">
                    ${zombies.map((z) => {
                        const checked = cc.customZombiePool.includes(z.id);
                        return `
                            <label class="mod-row ${checked ? 'active' : ''}">
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
                { id: 'legend', label: 'LEGEND & GUIDE' }
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
                const kb = BO.Settings.getKeybinds();
                body.innerHTML = `
                    <div class="panel-title">MOUSE AIM &amp; SENSITIVITY</div>
                    <div class="setting-row" data-tip-title="Mouse Sensitivity" data-tip="How fast your camera turns when moving the mouse."><span>Mouse Look Sensitivity (<span id="lbl-sens">${s.sensitivity}</span>)</span><input type="range" id="set-sens" min="0.2" max="3.0" step="0.1" value="${s.sensitivity}"></div>
                    <div class="setting-row" data-tip-title="ADS Aim Speed" data-tip="Slows down mouse movement while holding Right-Click so long-range shots are steadier."><span>ADS Zoom Sensitivity Multiplier (<span id="lbl-adssens">${s.adsSensitivity}</span>)</span><input type="range" id="set-adssens" min="0.3" max="1.2" step="0.05" value="${s.adsSensitivity}"></div>
                    <div class="setting-row" data-tip-title="Invert Vertical Look" data-tip="Flips up and down mouse movement."><span>Invert Y Axis</span><input type="checkbox" id="set-inverty" ${s.invertY ? 'checked' : ''}></div>

                    <div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 8px;">
                        <div class="panel-title" style="margin:0;border:none;">CUSTOM KEYBINDS (CLICK ANY KEY TO REBIND)</div>
                        <button class="btn btn-sm" id="btn-reset-binds" data-tip-title="Reset Default Controls" data-tip="Restore all 19 keyboard controls back to standard Call of Duty defaults.">RESET DEFAULT KEYS</button>
                    </div>
                    <div class="keybind-grid">
                        ${KEYBIND_LABELS.map((item) => `
                            <div class="keybind-item" data-tip-title="${escAttr(item.label)}" data-tip="${escAttr(item.tip)} Click the button on the right, then press any keyboard key to rebind.">
                                <span style="font-size:12.5px;font-weight:700;">${item.label}</span>
                                <button class="keybind-btn ${this.rebindingAction === item.action ? 'listening' : ''}" data-bindact="${item.action}">
                                    ${this.rebindingAction === item.action ? 'PRESS KEY...' : formatKeyCode(kb[item.action])}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `;
                document.getElementById('set-sens').oninput = (e) => {
                    const v = Number(e.target.value);
                    document.getElementById('lbl-sens').textContent = v.toFixed(1);
                    BO.Settings.set('sensitivity', v);
                };
                document.getElementById('set-adssens').oninput = (e) => {
                    const v = Number(e.target.value);
                    document.getElementById('lbl-adssens').textContent = v.toFixed(2);
                    BO.Settings.set('adsSensitivity', v);
                };
                document.getElementById('set-inverty').onchange = (e) => BO.Settings.set('invertY', e.target.checked);
                document.getElementById('btn-reset-binds').onclick = () => {
                    BO.Sound.playUIClick();
                    BO.Settings.resetKeybinds();
                    this.isRebindingKey = false;
                    this.rebindingAction = null;
                    this.renderSettings();
                };
                body.querySelectorAll('[data-bindact]').forEach((btn) => {
                    btn.onclick = () => {
                        BO.Sound.playUIClick();
                        const act = btn.dataset.bindact;
                        this.isRebindingKey = true;
                        this.rebindingAction = act;
                        this.renderSettings();
                        const onKey = (ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            window.removeEventListener('keydown', onKey, true);
                            if (ev.code !== 'Escape') {
                                BO.Settings.setKeybind(act, ev.code);
                            }
                            this.isRebindingKey = false;
                            this.rebindingAction = null;
                            this.renderSettings();
                        };
                        window.addEventListener('keydown', onKey, true);
                    };
                });
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
                `;
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
                        <input type="text" id="cheat-code-input" placeholder="Type cheat code (e.g. cheats, infammo, infmoney, bighead)..."
                            style="flex:1;min-width:240px;background:#0d131d;color:#fde047;border:1px solid var(--amber);padding:10px 14px;font-family:var(--font-mono);font-size:15px;font-weight:800;">
                        <button class="btn btn-primary" id="btn-apply-cheat" data-tip-title="Submit Cheat Code" data-tip="Activate or toggle the cheat code typed in the box.">ACTIVATE CHEAT</button>
                        ${modUnlocked ? `<button class="btn" id="btn-settings-open-modmenu" style="border-color:#fde047;color:#fde047;">★ OPEN MOD MENU</button>` : ''}
                    </div>
                    <div id="cheat-feedback-msg" style="min-height:22px;font-size:13px;font-weight:800;color:#22c55e;margin-bottom:10px;"></div>
                    <table class="legend-table">
                        <thead>
                            <tr><th>CODE</th><th>NAME</th><th>STATUS</th><th>DESCRIPTION (CLICK ROW TO QUICK-ENTER)</th></tr>
                        </thead>
                        <tbody>
                            ${defs.map((d) => {
                                const on = d.code === 'cheats' ? modUnlocked : BO.Cheats.isActive(d.code, true);
                                return `
                                    <tr class="js-quick-cheat-row" data-code="${d.code}" style="cursor:pointer;"
                                        data-tip-title="Click to Toggle: ${d.code}" data-tip="${escAttr(d.desc)}">
                                        <td style="font-family:var(--font-mono);color:#fde047;font-weight:800;">${d.code}</td>
                                        <td><b>${d.name}</b></td>
                                        <td><span class="tier-pill" style="color:${on ? '#22c55e' : '#94a3b8'}">${on ? 'ACTIVE' : 'OFF'}</span></td>
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
                        BO.Sound.playPowerUp();
                        this.updateCheatMenuVisibility();
                        this.renderSettings();
                        const newMsg = document.getElementById('cheat-feedback-msg');
                        if (newMsg) {
                            newMsg.style.color = '#22c55e';
                            newMsg.textContent = '✓ ' + res.msg;
                        }
                    } else if (msgEl) {
                        BO.Sound.playEmptyClick();
                        msgEl.style.color = '#ef4444';
                        msgEl.textContent = '✕ ' + res.msg;
                    }
                };
                document.getElementById('btn-apply-cheat').onclick = () => submitCheat(inputEl.value);
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
                body.innerHTML = `
                    <div class="panel-title">MASTER LEGEND &amp; COMBAT ENCYCLOPEDIA</div>
                    <p style="font-size:13.5px;color:var(--text-dim);line-height:1.6;">
                        Open the full 8-Tab Master Legend to inspect every stat in the game: How to Play, the exact Mystery Box Odds (60% Common Gun, 15% Uncommon Gun, 10% Common Melee, 5% Uncommon Melee, 5% Magic Weapon, 5% Nothing), Personal Vitals, all 50 Firearms, 10 Melee Weapons, 10 Magic Weapons, Perks &amp; Ultimate Powers, all 20 Zombies &amp; 5 Bosses, and all 13 Zombies Cheat Codes.
                    </p>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
                        <button class="btn btn-primary" id="btn-set-open-legend-howto">OPEN FULL MASTER LEGEND</button>
                        <button class="btn" id="btn-set-open-legend-guns">VIEW 50 FIREARMS</button>
                        <button class="btn" id="btn-set-open-legend-melee">VIEW 10 MELEE WEAPONS</button>
                        <button class="btn" id="btn-set-open-legend-magic">VIEW 10 MAGIC WEAPONS</button>
                        <button class="btn" id="btn-set-open-legend-enemies">VIEW 20 ZOMBIES &amp; 5 BOSSES</button>
                    </div>
                `;
                const jumpLegend = (t) => {
                    BO.Sound.playUIClick();
                    this.modalSettings.classList.add('hidden');
                    this.openLegend(t);
                };
                document.getElementById('btn-set-open-legend-howto').onclick = () => jumpLegend('howto');
                document.getElementById('btn-set-open-legend-guns').onclick = () => jumpLegend('guns');
                document.getElementById('btn-set-open-legend-melee').onclick = () => jumpLegend('melee');
                document.getElementById('btn-set-open-legend-magic').onclick = () => jumpLegend('magic');
                document.getElementById('btn-set-open-legend-enemies').onclick = () => jumpLegend('enemies');
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

            if (report.mode === 'zombies') {
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
           CUSTOMIZE ENEMY POOL MODAL (ENABLE / DISABLE 70 ENEMIES + 10 BOSSES)
        ==================================================================== */
        openEnemyPoolModal() {
            if (!this.modalEnemyPool) return;
            this.renderEnemyPool();
            this.modalEnemyPool.classList.remove('hidden');
        }

        renderEnemyPool() {
            const body = document.getElementById('enemy-pool-body');
            if (!body) return;
            const disSet = new Set(this.tdConfig.disabledEnemies || []);
            const groups = [
                { title: 'EASY ENEMIES (50% SPAWN RATE)', color: '#4ade80', list: BO.ZombiesData.ORDERED_PROGRESSION.filter((z) => z.rarity === 'easy') },
                { title: 'NORMAL ENEMIES (25% SPAWN RATE)', color: '#38bdf8', list: BO.ZombiesData.ORDERED_PROGRESSION.filter((z) => z.rarity === 'normal') },
                { title: 'HARD / ROUGHEST ENEMIES (15% SPAWN RATE — LATE ROUNDS)', color: '#f59e0b', list: BO.ZombiesData.ORDERED_PROGRESSION.filter((z) => z.rarity === 'hard') },
                { title: 'BOSS ENEMIES (10% SPAWN RATE — +1 BOSS EVERY 5 WAVES)', color: '#ef4444', list: BO.ZombiesData.ORDERED_BOSSES }
            ];

            body.innerHTML = groups.map((g) => `
                <div class="panel-title" style="color:${g.color};margin-top:10px;">${g.title} (${g.list.length})</div>
                <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:6px;">
                    ${g.list.map((z) => {
                        const enabled = !disSet.has(z.id);
                        const tags = [];
                        if (z.splitCount) tags.push(`Splits x${z.splitCount}`);
                        if (z.jumpChance) tags.push('Jumps');
                        if (z.isMagical) tags.push('Magic');
                        return `
                            <label class="mod-row ${enabled ? 'active' : ''}" style="margin:0;padding:6px 9px;font-size:11px;border-color:${enabled ? g.color : 'rgba(148,163,184,0.2)'};">
                                <span><b>${escAttr(z.name)}</b> <span style="color:#94a3b8;font-size:10px;">HP ${z.hp}${tags.length ? ' • ' + tags.join(', ') : ''}</span></span>
                                <input type="checkbox" class="js-ep-cb" data-eid="${z.id}" ${enabled ? 'checked' : ''}>
                            </label>
                        `;
                    }).join('')}
                </div>
            `).join('');

            body.querySelectorAll('.js-ep-cb').forEach((cb) => {
                cb.onchange = (e) => {
                    BO.Sound.playUIClick();
                    const id = e.target.dataset.eid;
                    const s = new Set(this.tdConfig.disabledEnemies || []);
                    if (e.target.checked) s.delete(id);
                    else s.add(id);
                    this.tdConfig.disabledEnemies = Array.from(s);
                    this.renderEnemyPool();
                };
            });
        }
    }

    BO.Menus = new MenuController();
})(window);
