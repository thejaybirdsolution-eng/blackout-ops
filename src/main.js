/* ============================================================================
   BLACKOUT OPS — Master Engine Loop, Renderer, Showcase Scene & Input Router
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class BlackoutApp {
        constructor() {
            this.canvas = null;
            this.renderer = null;
            this.worldCamera = null;

            // Menu & 3D Gunsmith Showcase Scene
            this.showcaseScene = null;
            this.showcaseCamera = null;
            this.showcasePivot = null;
            this.showcaseWeapon = null;

            this.lastMatchOpts = null;
            this.lastTime = 0;
            this.elapsed = 0;
            this.c4LastTapTime = 0;
            this.mouseDown = false;
            this.lastMouseX = null;
            this.lastMouseY = null;
        }

        boot() {
            this.canvas = document.getElementById('game-canvas');
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                powerPreference: 'high-performance'
            });
            this.renderer.autoClear = false;
            if (THREE.sRGBEncoding) this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.08;
            this._applyRendererQuality();

            this.worldCamera = new THREE.PerspectiveCamera(BO.Settings.get('fov') || 90, window.innerWidth / window.innerHeight, 0.08, 1500);

            this._buildShowcaseScene();
            BO.Tooltips.init();
            BO.HUD.init();
            BO.GunsmithUI.init((cfg) => this._rebuildShowcaseWeapon(cfg));
            BO.Menus.init({
                onStartMatch: (opts) => this.startMatch(opts),
                onExitToMenu: () => this.exitToMenu(),
                onRestartMatch: () => this.restartMatch()
            });
            if (BO.Net) BO.Net.init();

            this._bindInputs();
            this._onResize();
            window.addEventListener('resize', () => this._onResize());
            BO.Events.on('settings:changed', (e) => {
                if (['quality', 'exposure', 'resScale', 'hudOpacity'].includes(e.key)) {
                    this._applyRendererQuality();
                }
            });

            BO.Menus.showScreen('main_menu');
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this._loop(t));
        }

        _applyRendererQuality() {
            const q = BO.Settings.getQualityPreset();
            const resScale = BO.Settings.get('resScale') || 1.0;
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pixelRatioCap) * resScale);
            this.renderer.shadowMap.enabled = q.shadows;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMappingExposure = BO.Settings.get('exposure') || 1.08;
            const hudEl = document.getElementById('hud-layer');
            if (hudEl) hudEl.style.opacity = String(BO.Settings.get('hudOpacity') ?? 1.0);
        }

        _onResize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.renderer.setSize(w, h, false);
            this.worldCamera.aspect = w / h;
            this.worldCamera.updateProjectionMatrix();
            BO.Player.vmCamera.aspect = w / h;
            BO.Player.vmCamera.updateProjectionMatrix();
            this.showcaseCamera.aspect = w / h;
            this.showcaseCamera.updateProjectionMatrix();
        }

        _buildShowcaseScene() {
            this.showcaseScene = new THREE.Scene();
            this.showcaseScene.background = new THREE.Color(0x070b11);
            this.showcaseScene.fog = new THREE.FogExp2(0x070b11, 0.09);

            this.showcaseCamera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.05, 50);
            this.showcaseCamera.position.set(0, 0.25, 1.35);

            const amb = new THREE.HemisphereLight(0x94a3b8, 0x0f172a, 0.85);
            const key = new THREE.DirectionalLight(0xffeedd, 1.8);
            key.position.set(2.2, 3.0, 2.5);
            const rimAmber = new THREE.PointLight(0xf5a623, 2.2, 6);
            rimAmber.position.set(-1.5, 0.6, -1.0);
            const rimCyan = new THREE.PointLight(0x38bdf8, 1.8, 6);
            rimCyan.position.set(1.6, -0.4, -1.2);
            this.showcaseScene.add(amb, key, rimAmber, rimCyan);

            const podium = new THREE.Mesh(
                new THREE.CylinderGeometry(0.95, 1.15, 0.16, 32),
                new THREE.MeshStandardMaterial({ color: 0x111722, roughness: 0.35, metalness: 0.8 })
            );
            podium.position.y = -0.42;
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.92, 0.96, 48),
                new THREE.MeshBasicMaterial({ color: 0xf5a623, side: THREE.DoubleSide })
            );
            ring.rotation.x = -Math.PI * 0.5;
            ring.position.y = -0.338;
            this.showcaseScene.add(podium, ring);

            this.showcasePivot = new THREE.Group();
            this.showcaseScene.add(this.showcasePivot);
        }

        _rebuildShowcaseWeapon(weaponCfg) {
            if (!this.showcasePivot) return;
            while (this.showcasePivot.children.length > 0) {
                this.showcasePivot.remove(this.showcasePivot.children[0]);
            }
            const spec = BO.WeaponsData.get(weaponCfg.id);
            const built = BO.WeaponMesh.buildWeapon(weaponCfg.id, weaponCfg.attachments, weaponCfg.camo, false, false, !!spec.canDualWield);
            built.root.scale.setScalar(1.45);
            this.showcasePivot.add(built.root);
            if (BO.Save && BO.Save.data && BO.Save.data.unlockables && BO.Save.data.unlockables.topHatEquipped && BO.WeaponMesh.buildTopHat) {
                const hat = BO.WeaponMesh.buildTopHat();
                hat.position.set(-0.42, -0.32, 0.25);
                hat.rotation.z = 0.12;
                this.showcasePivot.add(hat);
            }
            this.showcaseWeapon = built.root;
        }

        startMatch(opts) {
            // Request Pointer Lock at 0ms of user click gesture before world build!
            this._safePointerLock();
            this._clearInputState();

            if (opts.mode !== "survival" && !opts._fromNetHost && BO.Net && BO.Net.active && BO.Net.isHost) {
                BO.Net.broadcastMatchStart(opts);
            }
            if (BO.Net) BO.Net.clearRemoteAvatars();

            this.lastMatchOpts = BO.Math.deepClone(opts);
            BO.SurvivalUI.close();
            BO.SurvivalMode.stop();
            BO.ZombiesMode.stop();
            BO.MPMode.stop();
            if (BO.TowerDefenseMode) BO.TowerDefenseMode.stop();

            BO.State.activeMode = opts.mode;
            BO.State.activeMapId = opts.mapId;
            BO.State.paused = false;

            if (opts.mode === 'survival') {
                BO.SurvivalMode.start(this.worldCamera, opts);
            } else if (opts.mode === 'zombies') {
                BO.ZombiesMode.start({
                    mapId: opts.mapId,
                    difficulty: opts.difficulty || 'normal',
                    useClassicStarter: opts.useClassicStarter,
                    startProtocol: opts.startProtocol || null,
                    startRound: opts.startRound || 1,
                    zModifiers: opts.zModifiers || {},
                    zCustomValues: opts.zCustomValues || {},
                    disabledEnemies: opts.disabledEnemies || [],
                    camera: this.worldCamera
                });
            } else if (opts.mode === 'td') {
                BO.TowerDefenseMode.start({
                    mapId: opts.mapId,
                    tdConfig: opts.tdConfig || null,
                    camera: this.worldCamera
                });
            } else {
                BO.MPMode.start({
                    modeType: opts.modeType,
                    mapId: opts.mapId,
                    difficulty: opts.difficulty,
                    customRules: opts.customRules,
                    camera: this.worldCamera
                });
            }

            BO.Menus.showScreen('playing');
            this._safePointerLock();
        }

        _clearInputState() {
            this.mouseDown = false;
            this.lastMouseX = null;
            this.lastMouseY = null;
            if (BO.Player) {
                BO.Player.mouseDragging = false;
                BO.Player.triggerHeld = false;
                BO.Player.adsHeld = false;
                BO.Player.cookingFrag = false;
                BO.Player.burstRemaining = 0;
                BO.Player.keys = Object.create(null);
            }
            if (BO.Combat && BO.Combat.cancelCharge) BO.Combat.cancelCharge();
        }

        _isPointerLocked() {
            const ple = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
            return ple === this.canvas || !!ple;
        }

        _safePointerLock() {
            if (!this.canvas || this._isPointerLocked()) return;
            const req = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
            if (!req) return;
            try {
                const res = req.call(this.canvas);
                if (res && typeof res.catch === 'function') res.catch(() => {});
            } catch (e) {}
        }

        restartMatch() {
            if (this.lastMatchOpts) {
                this.startMatch(this.lastMatchOpts);
            }
        }

        exitToMenu() {
            this._clearInputState();
            BO.ZombiesMode.stop();
            BO.MPMode.stop();
            if (BO.TowerDefenseMode) BO.TowerDefenseMode.stop();
            BO.SurvivalUI.close();
            BO.SurvivalMode.stop();
            BO.ExpansionShop.close();
            BO.Superpowers.reset();
            BO.State.activeMode = null;
            BO.State.paused = false;
            if (document.pointerLockElement) document.exitPointerLock();
            BO.Menus.showScreen('main_menu');
        }

        _bindInputs() {
            const P = BO.Player;

            const lockTrigger = () => {
                BO.Sound.ensureContext();
                if (BO.State.screen === 'playing' && !BO.State.paused) {
                    this._safePointerLock();
                }
            };
            this.canvas.addEventListener('click', lockTrigger);
            const hint = document.getElementById('pointer-lock-hint');
            if (hint) hint.addEventListener('click', lockTrigger);

            document.addEventListener('pointerlockchange', () => {
                // Any button held across a pointer-lock transition can have its mouseup swallowed by the OS;
                // always clear held mouse buttons on lock state change so shooting/aiming never sticks!
                if (BO.Combat && BO.Combat.cancelCharge) BO.Combat.cancelCharge();
                this.mouseDown = false;
                P.mouseDragging = false;
                P.triggerHeld = false;
                P.adsHeld = false;
                this.lastMouseX = null;
                this.lastMouseY = null;
            });

            window.addEventListener('blur', () => this._clearInputState());
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this._clearInputState();
            });

            window.addEventListener('mousedown', (e) => {
                BO.Sound.ensureContext();
                if (BO.State.screen !== 'playing' || BO.State.paused) return;
                const onHint = e.target && e.target.closest && !!e.target.closest('#pointer-lock-hint');
                if (e.target !== this.canvas && !onHint) return;

                if (onHint) {
                    this._safePointerLock();
                    return;
                }

                if (e.button === 0) {
                    this.mouseDown = true;
                    P.mouseDragging = true;
                    BO.Combat.handleFireInput(true, true);
                } else if (e.button === 2) {
                    P.adsHeld = true;
                }
            });

            const handleMouseUp = (e) => {
                if (e.button === 0 || (typeof e.buttons === 'number' && (e.buttons & 1) === 0)) {
                    if (BO.Combat && BO.Combat.releaseFireInput) BO.Combat.releaseFireInput();
                    this.mouseDown = false;
                    P.mouseDragging = false;
                    P.triggerHeld = false;
                }
                if (e.button === 2 || (typeof e.buttons === 'number' && (e.buttons & 2) === 0)) {
                    P.adsHeld = false;
                }
            };
            window.addEventListener('mouseup', handleMouseUp, true);

            window.addEventListener('contextmenu', (e) => {
                if (BO.State.screen === 'playing') {
                    e.preventDefault();
                    if (typeof e.buttons === 'number' && (e.buttons & 2) === 0) {
                        P.adsHeld = false;
                    }
                }
            }, true);

            window.addEventListener('mousemove', (e) => {
                if (BO.State.screen !== 'playing' || BO.State.paused) {
                    this.lastMouseX = null;
                    this.lastMouseY = null;
                    return;
                }

                // Live hardware bitmask sync: if finger is off Left or Right button, immediately unlatch!
                if (typeof e.buttons === 'number') {
                    if ((e.buttons & 1) === 0 && this.mouseDown) {
                        if (BO.Combat && BO.Combat.releaseFireInput) BO.Combat.releaseFireInput();
                        this.mouseDown = false;
                        P.mouseDragging = false;
                        P.triggerHeld = false;
                    }
                    if ((e.buttons & 2) === 0 && P.adsHeld) {
                        P.adsHeld = false;
                    }
                }

                if (this._isPointerLocked()) {
                    // Infinite 360-degree raw FPS mouse look when Pointer Lock is active
                    P.onMouseMove(e.movementX || 0, e.movementY || 0);
                    this.lastMouseX = null;
                    this.lastMouseY = null;
                } else {
                    // Seamless free-look fallback without needing to hold click!
                    let dx = 0;
                    let dy = 0;
                    if (this.lastMouseX !== null && this.lastMouseY !== null) {
                        dx = e.clientX - this.lastMouseX;
                        dy = e.clientY - this.lastMouseY;
                    } else if (typeof e.movementX === 'number' && typeof e.movementY === 'number') {
                        dx = e.movementX;
                        dy = e.movementY;
                    }
                    this.lastMouseX = e.clientX;
                    this.lastMouseY = e.clientY;
                    if (Math.abs(dx) < 250 && Math.abs(dy) < 250 && (dx !== 0 || dy !== 0)) {
                        P.onMouseMove(dx, dy);
                    }
                }
            });

            window.addEventListener('wheel', (e) => {
                if (BO.State.screen !== 'playing' || BO.State.paused) return;
                if (BO.SurvivalUI.open || BO.ExpansionShop.open) return;
                if (Math.abs(e.deltaY) > 4) {
                    const w = P.activeWeapon;
                    if (w && w.stats && w.stats.variableZoom && (P.adsHeld || P.adsAlpha > 0.35)) {
                        P.adjustScopeZoom(e.deltaY < 0 ? 1 : -1);
                        return;
                    }
                    const hotbar = BO.State.activeMode === 'survival' ? BO.SurvivalMode.campaign?.hotbar : null;
                    if (hotbar) hotbar.cycle(e.deltaY > 0 ? 1 : -1);
                    else P.switchWeapon();
                }
            }, { passive: true });

            window.addEventListener('keydown', (e) => {
                if (BO.Menus && BO.Menus.isRebindingKey) return;
                if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
                if (BO.State.screen !== 'playing') return;
                if (BO.ExpansionShop.open) return;
                if (BO.SurvivalUI.open) {
                    BO.SurvivalUI.handleKey(e);
                    return;
                }
                const code = e.code;
                const kb = BO.Settings.getKeybinds();
                const survival = BO.State.activeMode === 'survival' && BO.SurvivalMode.active;

                if (code === 'Escape' || code === kb.pause) {
                    e.preventDefault();
                    // ESC backs out of an open sub-panel before unpausing.
                    if (BO.State.paused && code === 'Escape') {
                        if (BO.ControlsPanel?.isOpen) { BO.ControlsPanel.close(); return; }
                        const settings = document.getElementById('modal-settings');
                        if (settings && !settings.classList.contains('hidden')) { BO.ControlsPanel?.stopListening(); settings.classList.add('hidden'); return; }
                    }
                    BO.Menus.setPauseOpen(!BO.State.paused);
                    return;
                }
                if (BO.State.paused) return;

                if (BO.State.activeMode === 'mp' && BO.MPMode && BO.MPMode.killcamActive) {
                    if (code === 'Space' && !P.keys[code]) {
                        e.preventDefault();
                        BO.MPMode.skipKillcam();
                    }
                    P.keys[code] = true;
                    return;
                }

                const firstDown = !P.keys[code];
                P.keys[code] = true;

                // Survival field controls take priority over shared bindings (all rebindable).
                if (survival && firstDown && this._handleSurvivalKey(code, kb, e)) return;
                if (survival && (code === 'Tab' || code === 'AltLeft')) e.preventDefault();

                if (code === 'Tab' && !survival) {
                    e.preventDefault();
                    BO.HUD.setScoreboardOpen(true);
                } else if (code === 'KeyM' && firstDown && BO.State.activeMode === 'mp') {
                    BO.Menus.openChangeClassModal();
                } else if (code === 'KeyT' && firstDown && BO.State.activeMode === 'td') {
                    BO.Menus.openTdShopModal();
                } else if (code === 'KeyB' && firstDown && BO.State.activeMode === 'zombies') {
                    if (BO.Menus && BO.Menus.openZBuildModal) BO.Menus.openZBuildModal();
                } else if (code === 'KeyV' && firstDown && BO.State.activeMode === 'zombies') {
                    BO.ZombiesMode.throwSniperTowerBall();
                } else if (code === 'KeyN' && firstDown && BO.State.activeMode === 'td') {
                    BO.TowerDefenseMode.skipIntermission();
                } else if ((code === kb.jump || code === 'Space') && firstDown) {
                    e.preventDefault();
                    P.tryJumpOrMantle();
                } else if ((code === kb.crouch || code === 'KeyC' || code === 'ControlLeft') && firstDown) {
                    P.tryCrouchOrSlide();
                } else if (code === kb.reload && firstDown) {
                    if (BO.State.activeMode !== 'survival' || !BO.SurvivalMode.clearJam()) P.startReload();
                } else if (code === 'Digit1' && firstDown && !survival) {
                    P.switchWeapon(0);
                } else if (code === 'Digit2' && firstDown && !survival) {
                    P.switchWeapon(1);
                } else if (code === 'Digit3' && firstDown && !survival) {
                    P.switchWeapon(2);
                } else if ((code === 'Equal' || code === 'NumpadAdd' || code === 'BracketRight') && firstDown) {
                    P.adjustScopeZoom(1);
                } else if ((code === 'Minus' || code === 'NumpadSubtract' || code === 'BracketLeft') && firstDown) {
                    P.adjustScopeZoom(-1);
                } else if (code === kb.fireMode && firstDown && !survival) {
                    if (P.lethalId === 'c4' && BO.Combat.c4Charges.length > 0) BO.Combat.detonateC4();
                    else P.toggleFireMode();
                } else if (code === kb.melee && firstDown) {
                    BO.Combat.meleeAttack();
                } else if (code === kb.lethal && firstDown) {
                    const now = performance.now();
                    if (now - this.c4LastTapTime < 350 && BO.Combat.c4Charges.length > 0) {
                        P.keys['DoubleTapC4'] = true;
                        BO.Combat.throwLethal(true, false);
                        P.keys['DoubleTapC4'] = false;
                    } else {
                        BO.Combat.throwLethal(true, false);
                    }
                    this.c4LastTapTime = now;
                } else if (code === kb.tactical && firstDown) {
                    BO.Combat.throwTactical();
                } else if (code === kb.special && firstDown && !survival) {
                    BO.Combat.activateFieldUpgrade();
                } else if ((code === kb.ultimate || code === 'KeyZ') && firstDown && !survival) {
                    BO.Combat.activateUltimate();
                } else if (code === kb.armory && firstDown && !survival) {
                    BO.ExpansionShop.show();
                } else if (code === kb.interact && firstDown) {
                    if (BO.State.activeMode === 'zombies') BO.ZombiesMode.tryInteract();
                    else if (BO.State.activeMode === 'td') BO.TowerDefenseMode.tryInteract();
                    else if (BO.State.activeMode === 'survival') BO.SurvivalMode.interact();
                } else if (code === kb.exfil && firstDown && !survival) {
                    if (BO.State.activeMode === 'zombies') BO.ZombiesMode.startExfil();
                } else if (code === kb.armor && firstDown && !survival) {
                    P.insertArmorPlate();
                } else if (code === kb.inspect && firstDown) {
                    P.inspectTimer = 1.8;
                    if (BO.State.activeMode === 'survival') BO.SurvivalMode.inspect();
                } else if (code === 'Digit5' && firstDown && BO.State.activeMode === 'mp') {
                    BO.Combat.callKillstreak(0);
                } else if (code === 'Digit6' && firstDown && BO.State.activeMode === 'mp') {
                    BO.Combat.callKillstreak(1);
                } else if (code === 'Digit7' && firstDown && BO.State.activeMode === 'mp') {
                    BO.Combat.callKillstreak(2);
                }
            });

            window.addEventListener('keyup', (e) => {
                if (BO.ExpansionShop.open) return;
                if (BO.State.activeMode === 'survival' && e.code === 'Tab') e.preventDefault();
                const code = e.code;
                const kb = BO.Settings.getKeybinds();
                P.keys[code] = false;
                if (code === 'Tab') {
                    BO.HUD.setScoreboardOpen(false);
                } else if (code === kb.lethal && BO.State.screen === 'playing') {
                    BO.Combat.throwLethal(false, true);
                }
            });
        }

        /** Survival-only bindings. Returns true when the key was consumed. */
        _handleSurvivalKey(code, kb, e) {
            const P = BO.Player;
            const hotbar = BO.SurvivalMode.campaign?.hotbar;
            for (let i = 0; i < 10; i++) {
                if (code === kb['hotbar' + (i + 1)]) {
                    hotbar?.select(i);
                    return true;
                }
            }
            const tabs = {
                survInventory: 'inventory', survCraft: 'crafting', survMap: 'map', survTravel: 'travel',
                survSkills: 'skills', survJournal: 'journal', survLegend: 'legend'
            };
            for (const [action, tab] of Object.entries(tabs)) {
                if (code === kb[action]) {
                    e.preventDefault();
                    BO.SurvivalUI.show(tab);
                    return true;
                }
            }
            if (code === kb.survBuild) {
                if (P.lethalId === 'c4' && BO.Combat.c4Charges.length > 0) BO.Combat.detonateC4();
                else BO.SurvivalUI.show('build');
                return true;
            }
            if (code === kb.survFlask) {
                BO.SurvivalMode.campaign?.deep?.useFlask(); // In the Zone this is quick field medicine.
                return true;
            }
            if (code === kb.survLight) {
                BO.SurvivalMode.campaign?.pack.shortcut();
                return true;
            }
            if (code === kb.survPlate) {
                P.insertArmorPlate();
                return true;
            }
            if (code === kb.survDodge) {
                e.preventDefault();
                P.tryDodgeRoll();
                return true;
            }
            return false;
        }

        _loop(now) {
            requestAnimationFrame((t) => this._loop(t));
            const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
            this.lastTime = now;
            this.elapsed += dt;

            // Update live animated camos (Dark Matter / Pack-a-Punch)
            BO.Textures.updateAnimatedTextures(dt, this.elapsed);

            if (BO.State.screen === 'playing') {
                if (BO.ExpansionShop.open && !BO.Player.alive) BO.ExpansionShop.close();
                if (!BO.State.paused && !BO.SurvivalUI.open && (!BO.ExpansionShop.open || BO.Net?.active)) {
                    const inKillcam = BO.State.activeMode === 'mp' && BO.MPMode && BO.MPMode.killcamActive;
                    if (inKillcam) {
                        BO.FX.update(dt);
                        BO.MPMode.update(dt);
                    } else {
                        if (this.mouseDown) BO.Combat.handleFireInput(true, false);
                        BO.Player.update(dt, this.worldCamera);
                        BO.Combat.updateBurstAndProjectiles(dt, this.worldCamera);
                        BO.Superpowers.tick(dt);
                        BO.World.updateAnimatedProps(dt, this.elapsed);
                        BO.FX.update(dt);

                        if (BO.State.activeMode === 'survival') BO.SurvivalMode.update(dt);
                        else if (BO.State.activeMode === 'zombies') BO.ZombiesMode.update(dt);
                        else if (BO.State.activeMode === 'mp') BO.MPMode.update(dt);
                        else if (BO.State.activeMode === 'td') {
                            BO.TowerDefenseMode.update(dt);
                            if (BO.Menus && BO.Menus.modalTdShop && !BO.Menus.modalTdShop.classList.contains('hidden')) {
                                const secNow = Math.ceil(BO.TowerDefenseMode.intermissionTimer);
                                const subEl = document.getElementById('td-shop-sub');
                                if (BO.TowerDefenseMode.state !== 'intermission') {
                                    BO.Menus.modalTdShop.classList.add('hidden');
                                    this._safePointerLock();
                                } else if (subEl) {
                                    subEl.textContent = `Intermission: ${secNow}s remaining • Press [N] or button above to skip wait!`;
                                }
                            }
                        }
                    }

                    BO.HUD.update(dt);
                    BO.ExpansionShop.updateHud();
                    BO.SurvivalUI.updateHud();
                } else if (!BO.State.paused && BO.SurvivalUI.open && BO.State.activeMode === 'survival' && BO.SurvivalMode.active &&
                    !['respawn', 'briefing', 'ending'].includes(BO.SurvivalUI.section)) {
                    // Real-time menus: the Zone keeps moving while you rummage through your pack.
                    BO.Combat.updateBurstAndProjectiles(dt, this.worldCamera);
                    BO.World.updateAnimatedProps(dt, this.elapsed);
                    BO.FX.update(dt);
                    BO.SurvivalMode.update(dt);
                    BO.HUD.update(dt);
                    if (BO.SurvivalUI.liveRefresh) BO.SurvivalUI.liveRefresh(dt);
                }

                if (BO.Net) BO.Net.update(dt, this.worldCamera);

                this.renderer.clear();
                if (BO.World.scene) {
                    this.renderer.render(BO.World.scene, this.worldCamera);
                }
                this.renderer.clearDepth();
                this.renderer.render(BO.Player.vmScene, BO.Player.vmCamera);
            } else {
                // Render Main Menu / Gunsmith Showcase 3D Scene
                if (this.showcasePivot) {
                    if (BO.State.screen === 'gunsmith') {
                        const gs = BO.GunsmithUI;
                        this.showcasePivot.position.set(0.0, 0.04, 0);
                        this.showcasePivot.rotation.set(gs.orbitPitch, gs.orbitYaw, 0);
                        this.showcaseCamera.position.set(0, 0.12, gs.orbitZoom);
                    } else {
                        this.showcasePivot.position.set(0.28, -0.02, 0);
                        this.showcasePivot.rotation.set(0.08, this.elapsed * 0.45, 0);
                        this.showcaseCamera.position.set(0, 0.20, 1.32);
                    }
                }
                this.renderer.clear();
                this.renderer.render(this.showcaseScene, this.showcaseCamera);
            }
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        const app = new BlackoutApp();
        BO.App = app;
        app.boot();
    });
})(window);
