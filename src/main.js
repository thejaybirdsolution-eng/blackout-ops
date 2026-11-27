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
            if (BO.PostFX) BO.PostFX.init(this.renderer);
            this._applyRendererQuality();

            this.worldCamera = new THREE.PerspectiveCamera(BO.Settings.get('fov') || 90, window.innerWidth / window.innerHeight, 0.08, 1500);

            this._buildShowcaseScene();
            if (BO.Atmosphere) {
                const studio = BO.Atmosphere.studio(this.renderer);
                this.showcaseScene.environment = studio;
                if (BO.Player && BO.Player.vmScene) BO.Player.vmScene.environment = studio;
            }
            if (BO.Ambience) BO.Ambience.init();
            if (BO.Juice) BO.Juice.init();
            this._bindHudFeedback();
            BO.Tooltips.init();
            BO.HUD.init();
            if (BO.RPGUI) BO.RPGUI.init();
            if (BO.OWRPGUI) BO.OWRPGUI.init();
            BO.GunsmithUI.init((cfg) => this._rebuildShowcaseWeapon(cfg));
            BO.Menus.init({
                onStartMatch: (opts) => this.startMatch(opts),
                onExitToMenu: () => this.exitToMenu(),
                onRestartMatch: () => this.restartMatch()
            });
            this._bindModeBundleLoaders();
            if (BO.Net) BO.Net.init();

            this._bindInputs();
            this._onResize();
            window.addEventListener('resize', () => this._onResize());
            BO.Events.on('settings:changed', (e) => {
                if (['quality', 'exposure', 'resScale', 'hudOpacity', 'postFx'].includes(e.key)) {
                    this._applyRendererQuality();
                }
            });

            BO.Menus.showScreen('main_menu');
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this._loop(t));
        }

        /** Ammo counter feedback: a kick on every round fired, warm-red glow when the mag runs low. */
        _bindHudFeedback() {
            const el = document.getElementById('hud-ammo-mag');
            if (!el || typeof MutationObserver === 'undefined') return;
            let last = null;
            let full = 0;
            const obs = new MutationObserver(() => {
                const v = parseInt(el.textContent, 10);
                if (!Number.isFinite(v)) { el.classList.remove('aaa-low'); last = null; return; }
                if (last === null || v > last) full = Math.max(v, 1);
                if (last !== null && v < last) {
                    el.classList.remove('aaa-kick');
                    void el.offsetWidth; // restart the animation
                    el.classList.add('aaa-kick');
                }
                el.classList.toggle('aaa-low', full >= 4 && v <= Math.ceil(full * 0.25));
                last = v;
            });
            obs.observe(el, { childList: true, characterData: true, subtree: true });
        }

        _applyRendererQuality() {
            const q = BO.Settings.getQualityPreset();
            const resScale = BO.Settings.get('resScale') || 1.0;
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pixelRatioCap) * resScale);
            this.renderer.shadowMap.enabled = q.shadows;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMappingExposure = BO.Settings.get('exposure') || 1.08;
            if (this.worldCamera && BO.State.activeMode !== 'survival' && q.drawDistance) {
                if (this.worldCamera.far !== q.drawDistance) {
                    this.worldCamera.far = q.drawDistance;
                    this.worldCamera.updateProjectionMatrix();
                }
            }
            if (BO.PostFX && BO.PostFX.ready) BO.PostFX.applyQuality();
            const hudEl = document.getElementById('hud-layer');
            if (hudEl) hudEl.style.opacity = String(BO.Settings.get('hudOpacity') ?? 1.0);
        }

        _onResize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.renderer.setSize(w, h, false);
            if (BO.PostFX) BO.PostFX.setSize();
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
            this.weaponStudio = new THREE.Group();
            this.weaponStudio.visible = false;
            const fill = new THREE.HemisphereLight(0xe2efff, 0x9fa8b3, 1.35);
            const studioKey = new THREE.DirectionalLight(0xf7fbff, 2.1);
            studioKey.position.set(-3, 2, 5);
            const rim = new THREE.DirectionalLight(0xb6d7ff, 1.8);
            rim.position.set(1, 2, -3);
            this.weaponStudio.add(fill, studioKey, rim);
            this.showcaseScene.add(this.weaponStudio);
            this.weaponStudioBackground = new THREE.Color(0x52667b);
            this.menuShowcaseBackground = this.showcaseScene.background;
            this.menuShowcaseFog = this.showcaseScene.fog;
            this.weaponStudioViewport = document.getElementById('gs-model-viewport');
            this.showcaseCenter = new THREE.Vector3();
            this.showcaseCorners = [];
            this.studioCorner = new THREE.Vector3();
            this.studioClearColor = new THREE.Color();

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
            this.showcasePodium = new THREE.Group();
            this.showcasePodium.add(podium, ring);
            this.showcaseScene.add(this.showcasePodium);

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
            if (built.laserBeam) built.laserBeam.visible = false;
            this._computeShowcaseBounds(built.root);
            if (built.readyPromise) {
                const expectedRoot = built.root;
                built.readyPromise.then(() => {
                    if (this.showcaseWeapon === expectedRoot) {
                        this._computeShowcaseBounds(expectedRoot);
                    }
                });
            }
        }

        _computeShowcaseBounds(weaponRoot) {
            const bounds = new THREE.Box3();
            const partBox = new THREE.Box3();
            const v = new THREE.Vector3();
            this.showcasePivot.updateMatrixWorld(true);
            const toPivot = this.showcasePivot.matrixWorld.clone().invert();
            const transform = new THREE.Matrix4();
            weaponRoot.traverseVisible((part) => {
                if (!part.isMesh || !part.geometry) return;
                const pos = part.geometry.attributes && part.geometry.attributes.position;
                if (part.isSkinnedMesh && typeof part.boneTransform === 'function' && pos) {
                    if (part.skeleton) part.skeleton.update();
                    transform.multiplyMatrices(toPivot, part.matrixWorld);
                    const step = Math.max(1, Math.floor(pos.count / 1000));
                    for (let i = 0; i < pos.count; i += step) {
                        v.fromBufferAttribute(pos, i);
                        part.boneTransform(i, v);
                        v.applyMatrix4(transform);
                        bounds.expandByPoint(v);
                    }
                } else {
                    if (!part.geometry.boundingBox) part.geometry.computeBoundingBox();
                    transform.multiplyMatrices(toPivot, part.matrixWorld);
                    bounds.union(partBox.copy(part.geometry.boundingBox).applyMatrix4(transform));
                }
            });
            bounds.getCenter(this.showcaseCenter);
            this.showcaseCorners = [];
            if (!bounds.isEmpty()) {
                for (const x of [bounds.min.x, bounds.max.x]) {
                    for (const y of [bounds.min.y, bounds.max.y]) {
                        for (const z of [bounds.min.z, bounds.max.z]) {
                            this.showcaseCorners.push(new THREE.Vector3(x, y, z).sub(this.showcaseCenter));
                        }
                    }
                }
            }
        }

        _renderWeaponStudio() {
            const vp = this.weaponStudioViewport.getBoundingClientRect();
            const renderer = this.renderer;
            const w = window.innerWidth;
            const h = window.innerHeight;
            renderer.getClearColor(this.studioClearColor);
            renderer.setClearColor(0x111a25);
            renderer.clear();
            const left = Math.max(0, vp.left + 1);
            const right = Math.min(w, vp.right - 1);
            const top = Math.max(0, vp.top + 1);
            const bottom = Math.min(h, vp.bottom - 1);
            if (right > left && bottom > top) {
                const gs = BO.GunsmithUI;
                const camera = this.showcaseCamera;
                const scene = this.showcaseScene;
                const pivot = this.showcasePivot;
                this.weaponStudio.visible = true;
                this.showcasePodium.visible = false;
                scene.background = this.weaponStudioBackground;
                scene.fog = null;
                pivot.scale.setScalar(1);
                pivot.rotation.set(gs.orbitPitch, gs.orbitYaw, 0);
                pivot.position.copy(this.showcaseCenter).applyQuaternion(pivot.quaternion).negate();
                camera.aspect = vp.width / vp.height;
                const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
                const horizontal = vertical * camera.aspect;
                let fitDistance = 0.35;
                for (const vertex of this.showcaseCorners) {
                    const corner = this.studioCorner.copy(vertex).applyQuaternion(pivot.quaternion);
                    const span = Math.max(Math.abs(corner.x) / horizontal, Math.abs(corner.y) / vertical);
                    fitDistance = Math.max(fitDistance, corner.z + 1.2 * span);
                }
                camera.position.set(0, 0, fitDistance * gs.orbitZoom / 0.92);
                camera.rotation.set(0, 0, 0);
                camera.updateProjectionMatrix();
                renderer.setViewport(vp.left, h - vp.bottom, vp.width, vp.height);
                renderer.setScissor(left, h - bottom, right - left, bottom - top);
                renderer.setScissorTest(true);
                renderer.clearDepth();
                renderer.render(scene, camera);
                renderer.setScissorTest(false);
                renderer.setViewport(0, 0, w, h);
                this.weaponStudio.visible = false;
                this.showcasePodium.visible = true;
                scene.background = this.menuShowcaseBackground;
                scene.fog = this.menuShowcaseFog;
                camera.aspect = w / h;
                camera.rotation.set(0, 0, 0);
                camera.updateProjectionMatrix();
            }
            renderer.setClearColor(this.studioClearColor);
        }

        _bindModeBundleLoaders() {
            const loader = BO.BundleLoader;
            if (!loader || !loader.isBundled()) return;
            const map = [
                ['btn-menu-survival', 'survival'],
                ['btn-menu-rpg', 'rpg'],
                ['btn-menu-owrpg', 'owrpg'],
                ['btn-menu-minigames', 'minigames']
            ];
            for (const [id, key] of map) {
                const btn = document.getElementById(id);
                if (!btn) continue;
                btn.addEventListener('pointerenter', () => {
                    if (!loader.isLoaded(key)) loader.ensure(key).catch(() => {});
                }, { passive: true });
                btn.addEventListener('click', (e) => {
                    if (loader.isLoaded(key)) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (btn.dataset.bundleBusy === '1') return;
                    btn.dataset.bundleBusy = '1';
                    BO.Events?.emit?.('hud:toast', { text: `Loading ${key.toUpperCase()} module...`, color: '#ffb23f' });
                    loader.ensure(key).then(() => {
                        delete btn.dataset.bundleBusy;
                        btn.click();
                    }).catch(() => {
                        delete btn.dataset.bundleBusy;
                        BO.Events?.emit?.('hud:toast', { text: `Failed to load ${key} module.`, color: '#ef4444' });
                    });
                }, true);
            }
        }

        startMatch(opts) {
            const bundleKey = BO.BundleLoader?.bundleKeyForMode?.(opts?.mode);
            if (bundleKey && BO.BundleLoader?.isBundled() && !BO.BundleLoader.isLoaded(bundleKey)) {
                if (this._loadingBundle === bundleKey) return;
                this._loadingBundle = bundleKey;
                BO.Events?.emit?.('hud:toast', { text: `Loading ${bundleKey.toUpperCase()} module...`, color: '#ffb23f' });
                BO.BundleLoader.ensure(bundleKey).then(() => {
                    this._loadingBundle = null;
                    this.startMatch(opts);
                }).catch(() => {
                    this._loadingBundle = null;
                    BO.Events?.emit?.('hud:toast', { text: `Failed to load ${bundleKey} module.`, color: '#ef4444' });
                });
                return;
            }
            // Request Pointer Lock at 0ms of user click gesture before world build!
            this._safePointerLock();
            this._clearInputState();

            if (opts.mode !== "survival" && opts.mode !== 'minigame' && opts.mode !== 'rpg' && opts.mode !== 'owrpg' && !opts._fromNetHost && BO.Net && BO.Net.active && BO.Net.isHost) {
                BO.Net.broadcastMatchStart(opts);
            }
            if (BO.Net) BO.Net.clearRemoteAvatars();

            this.lastMatchOpts = BO.Math.deepClone(opts);
            BO.SurvivalUI?.close?.();
            BO.SurvivalMode?.stop?.();
            BO.ZombiesMode.stop();
            BO.MPMode.stop();
            if (BO.TowerDefenseMode) BO.TowerDefenseMode.stop();
            if (BO.Minigames) BO.Minigames.stop();
            if (BO.RPGMode) BO.RPGMode.stop();
            if (BO.OWRPGMode) BO.OWRPGMode.stop();
            BO.Sound.stopEffects();
            BO.SceneCleanup?.disposeScene?.(BO.World?.scene, this.renderer);

            BO.State.activeMode = opts.mode;
            BO.State.activeMapId = opts.mapId;
            BO.State.paused = false;
            BO.State.timeScale = 1;
            BO.emitGameEvent?.('game:modeStart', { mode: opts.mode, mapId: opts.mapId });

            if (opts.mode === 'minigame') {
                BO.Minigames.start(this.worldCamera, opts);
            } else if (opts.mode === 'survival') {
                BO.SurvivalMode.start(this.worldCamera, opts);
            } else if (opts.mode === 'owrpg') {
                BO.OWRPGMode.start({ slot: opts.slot || 0, newChar: opts.newChar || null, camera: this.worldCamera });
            } else if (opts.mode === 'rpg') {
                BO.RPGMode.start({ resume: !!opts.resume, startFloor: opts.startFloor || 1, camera: this.worldCamera });
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

            BO.ReactiveModifiers.reset();
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
                BO.Player.padMoveX = 0;
                BO.Player.padMoveY = 0;
                BO.Player.padSprint = false;
                BO.Player.keys = Object.create(null);
            }
            if (BO.GamepadInput && BO.GamepadInput.clear) BO.GamepadInput.clear();
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
                if (res && typeof res.catch === 'function') res.catch((e) => BO.log?.('App', 'debug', 'PointerLock declined', e));
            } catch (e) {
                BO.log?.('App', 'debug', 'PointerLock threw', e);
            }
        }

        restartMatch() {
            if (this.lastMatchOpts && this.lastMatchOpts.mode === 'rpg') return; // delves restart from the Haven
            if (this.lastMatchOpts && this.lastMatchOpts.mode === 'owrpg') { if (BO.OWRPGMode?.active) { BO.Menus.setPauseOpen(false); BO.OWRPGMode.quickLoad(); } return; }
            if (this.lastMatchOpts) {
                this.startMatch(this.lastMatchOpts);
            }
        }

        exitToMenu() {
            this._clearInputState();
            const fromMinigame = BO.State.activeMode === 'minigame';
            const mgReturn = fromMinigame && BO.Minigames ? BO.Minigames.consumeReturnScreen() : null;
            if (BO.Minigames) BO.Minigames.stop();
            BO.State.timeScale = 1;
            const wasRpg = BO.State.activeMode === 'rpg' || (BO.RPGMode && BO.RPGMode.active);
            if (BO.RPGMode) {
                if (BO.RPGMode.active) BO.RPGMode.suspend();
                BO.RPGMode.stop();
            }
            if (BO.OWRPGMode && BO.OWRPGMode.active) BO.OWRPGMode.suspend();
            BO.ZombiesMode.stop();
            BO.MPMode.stop();
            if (BO.TowerDefenseMode) BO.TowerDefenseMode.stop();
            BO.SurvivalUI?.close?.();
            BO.SurvivalMode?.stop?.();
            BO.ExpansionShop.close();
            const prevMode = BO.State.activeMode;
            BO.Superpowers.reset();
            BO.Sound.stopEffects();
            BO.SceneCleanup?.disposeScene?.(BO.World?.scene, this.renderer);
            BO.State.activeMode = null;
            BO.State.paused = false;
            BO.emitGameEvent?.('game:modeStop', { mode: prevMode });
            if (document.pointerLockElement) document.exitPointerLock();
            if (wasRpg && BO.RPGUI) BO.RPGUI.openHaven();
            else BO.Menus.showScreen(mgReturn || 'main_menu');
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

                if (BO.ZoneBuild?.active && BO.State.activeMode === 'survival') {
                    if (e.button === 0) BO.ZoneBuild.place();
                    else if (e.button === 2) BO.ZoneBuild.end();
                    return;
                }
                if (e.button === 0) {
                    this.mouseDown = true;
                    P.mouseDragging = true;
                    BO.Combat.handleFireInput(true, true);
                } else if (e.button === 2) {
                    if (BO.State.activeMode === 'survival' && BO.ZoneWild?.spyglassOpen) {
                        BO.ZoneWild.setSpyglass(false);
                        return;
                    }
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
                if (BO.SurvivalUI?.open || BO.ExpansionShop.open || BO.RPGUI?.modalOpen || BO.OWRPGUI?.modalOpen) return;
                if (Math.abs(e.deltaY) > 4) {
                    if (BO.State.activeMode === 'survival' && BO.ZoneWild?.spyglassZoom > 1) {
                        BO.ZoneWild.adjustSpyglassZoom(e.deltaY < 0 ? 1 : -1);
                        return;
                    }
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
                if (BO.Minigames?.blockingUI) { BO.Minigames.handleUIKey(e); return; }
                if (BO.ZoneThrill?.picking) { BO.ZoneThrill.handleKey(e); return; }
                if (BO.ZoneWild?.boxOpen) { BO.ZoneWild.handleKey(e); return; }
                if (BO.ZoneArmory?.uiOpen) { BO.ZoneArmory.handleKey(e); return; }
                if (BO.ZoneLegends?.dialog) { BO.ZoneLegends.handleKey(e); return; }
                if (BO.RPGUI?.modalOpen) { BO.RPGUI.handleKey(e); return; }
                if (BO.OWRPGUI?.modalOpen) { BO.OWRPGUI.handleKey(e); return; }
                if (BO.SurvivalUI?.open) {
                    BO.SurvivalUI.handleKey(e);
                    return;
                }
                const code = e.code;
                const kb = BO.Settings.getKeybinds();
                const survival = BO.State.activeMode === 'survival' && BO.SurvivalMode?.active;
                const rpg = BO.State.activeMode === 'rpg' && BO.RPGMode?.active;
                const ow = BO.State.activeMode === 'owrpg' && BO.OWRPGMode?.active;

                if (code === 'Escape' && BO.ZoneWild?.spyglassOpen) { e.preventDefault(); BO.ZoneWild.setSpyglass(false); return; }
                if (code === 'Escape' && BO.ZoneBuild?.active) { e.preventDefault(); BO.ZoneBuild.end(); return; }
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

                if (BO.State.activeMode === 'minigame' && BO.Minigames?.handleGameKey(code, kb, firstDown)) {
                    e.preventDefault();
                    return;
                }

                // Survival field controls take priority over shared bindings (all rebindable).
                if (survival && firstDown && this._handleSurvivalKey(code, kb, e)) return;
                // RPG: class abilities, potion and pack replace grenades, powers and the scoreboard.
                if (rpg && (code === 'Tab' || this._isRpgSuppressed(code, kb))) e.preventDefault();
                if (rpg && firstDown && this._handleRpgKey(code, kb)) return;
                if (rpg && this._isRpgSuppressed(code, kb)) return;
                if (survival && (code === 'Tab' || code === 'AltLeft')) e.preventDefault();
                // Open World RPG: abilities, Pip-Pad, saves and dodge replace grenades, powers and the scoreboard.
                if (ow && (code === 'Tab' || code === 'AltLeft' || code === 'F5' || code === 'F9' || code === 'F8' || BO.OWRPGMode.isSuppressed(code, kb))) e.preventDefault();
                if (ow && firstDown && BO.OWRPGMode.handleKey(code, kb, e)) return;
                if (ow && BO.OWRPGMode.isSuppressed(code, kb)) return;

                if (code === 'Tab' && !survival && !ow) {
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
                } else if (code === kb.reload && firstDown && BO.ZoneBuild?.active && survival) {
                    BO.ZoneBuild.rotate();
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
                } else if (code === kb.fireMode && firstDown) {
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
                    if (BO.State.activeMode === 'rpg') BO.RPGMode.interact();
                    else if (BO.State.activeMode === 'owrpg') BO.OWRPGMode.interact();
                    else if (BO.State.activeMode === 'zombies') BO.ZombiesMode.tryInteract();
                    else if (BO.State.activeMode === 'td') BO.TowerDefenseMode.tryInteract();
                    else if (BO.State.activeMode === 'mp') BO.MPMode.tryInteract();
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
                if (code === kb.survFlask && BO.State.activeMode === 'survival' && BO.GM?.active) BO.GM.get('baselife')?.keyRelease?.();
                if (code === 'Tab') {
                    BO.HUD.setScoreboardOpen(false);
                } else if (code === kb.lethal && BO.State.screen === 'playing') {
                    BO.Combat.throwLethal(false, true);
                }
            });
        }

        /** RPG-only bindings. Returns true when the key was consumed. */
        _handleRpgKey(code, kb) {
            if (code === kb.rpgAbility1) { BO.RPGAbilities.cast('primer'); return true; }
            if (code === kb.rpgAbility2) { BO.RPGAbilities.cast('detonator'); return true; }
            if (code === kb.rpgUltimate) { BO.RPGAbilities.cast('ultimate'); return true; }
            if (code === kb.rpgPotion) { BO.RPGMode.drinkPotion(); return true; }
            if (code === (kb.rpgActive || 'KeyG')) { if (BO.RPGItems?.useActive) BO.RPGItems.useActive(); return true; }
            if (code === (kb.rpgPocket || 'KeyT')) { if (BO.RPGItems?.usePocket) BO.RPGItems.usePocket(); return true; }
            if (code === (kb.rpgBomb || 'KeyB')) { if (BO.RPGItems?.dropBomb) BO.RPGItems.dropBomb(); return true; }
            if (code === 'Tab') { BO.RPGUI.openPack(); return true; }
            return false;
        }

        /** Shared bindings that do nothing in RPG mode (grenades, powers, plates, streaks, shops). */
        _isRpgSuppressed(code, kb) {
            if (code === kb.rpgAbility1 || code === kb.rpgAbility2 || code === kb.rpgUltimate || code === kb.rpgPotion ||
                code === (kb.rpgActive || 'KeyG') || code === (kb.rpgPocket || 'KeyT') || code === (kb.rpgBomb || 'KeyB')) return false;
            return [kb.lethal, kb.tactical, kb.special, kb.ultimate, 'KeyZ', kb.armory, kb.armor, kb.exfil, 'Digit2', 'Digit3', 'Digit5', 'Digit6', 'Digit7'].includes(code);
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
            if (code === kb.survQuickStack && BO.GM?.active) { BO.GM.get('storage')?.quickStack(); return true; }
            if (code === kb.survRide && BO.GM?.get('vehicles')?.onRideKey(!!e.shiftKey)) return true;
            if (code === kb.survRide && BO.ZoneWild) { BO.ZoneWild.toggleRide(!!e.shiftKey); return true; }
            if (code === kb.survCompanion && BO.ZoneCompanions) { BO.ZoneCompanions.cycleStance(); return true; }
            // A pending perk card takes the Skills key.
            if (code === kb.survSkills && BO.ZoneThrill?.pending && BO.ZoneThrill.openPick(true)) return true;
            const tabs = {
                survInventory: 'inventory', survCraft: 'crafting', survMap: 'map', survTravel: 'travel',
                survSkills: 'skills', survJournal: 'journal', survLegend: 'legend', survBase: 'base', survCatalogue: 'catalogue'
            };
            for (const [action, tab] of Object.entries(tabs)) {
                if (code === kb[action]) {
                    e.preventDefault();
                    BO.SurvivalUI.show(tab);
                    return true;
                }
            }
            if (code === kb.survBuild) {
                if (BO.ZoneBuild?.active) BO.ZoneBuild.end();
                else if (P.lethalId === 'c4' && BO.Combat.c4Charges.length > 0) BO.Combat.detonateC4();
                else BO.SurvivalUI.show('build');
                return true;
            }
            if (code === kb.survFlask) {
                // Tap = quick field medicine; hold = quick wheel (gm/GMBaseLife.js).
                const wheel = BO.GM?.active ? BO.GM.get('baselife') : null;
                if (wheel?.keyPress) return wheel.keyPress();
                BO.SurvivalMode.campaign?.deep?.useFlask();
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
            // timeScale < 1 gives short slow-motion beats (Survival rare finds, solo only).
            const rawDt = Math.max(0.0005, (now - this.lastTime) / 1000);
            const dt = Math.min(0.05, Math.max(0.001, rawDt)) * (BO.State.timeScale || 1);
            this.lastTime = now;
            this.elapsed += dt;
            BO.PerfOverlay?.tick?.(rawDt, this.renderer);

            // Update live animated camos (Dark Matter / Pack-a-Punch)
            BO.Textures.updateAnimatedTextures(dt, this.elapsed);

            if (BO.State.screen === 'playing') {
                if (BO.ExpansionShop.open && !BO.Player.alive) BO.ExpansionShop.close();
                if (!BO.State.paused && !BO.SurvivalUI?.open && !BO.RPGUI?.modalOpen && !BO.OWRPGUI?.modalOpen && !BO.ZoneThrill?.picking && !BO.ZoneWild?.boxOpen && !BO.ZoneArmory?.uiOpen && !BO.ZoneLegends?.dialog && (!BO.ExpansionShop.open || BO.Net?.active)) {
                    const inKillcam = BO.State.activeMode === 'mp' && BO.MPMode && BO.MPMode.killcamActive;
                    if (inKillcam) {
                        BO.FX.update(dt);
                        BO.MPMode.update(dt);
                    } else {
                        if (this.mouseDown) BO.Combat.handleFireInput(true, false);
                        if (BO.State.activeMode === 'minigame') BO.Minigames.preUpdate(dt);
                        BO.GamepadInput?.poll?.(dt);
                        BO.Player.update(dt, this.worldCamera);
                        BO.Combat.updateBurstAndProjectiles(dt, this.worldCamera);
                        BO.Superpowers.tick(dt);
                        BO.World.updateAnimatedProps(dt, this.elapsed);
                        BO.FX.update(dt);

                        if (BO.State.activeMode === 'survival') BO.SurvivalMode.update(dt);
                        else if (BO.State.activeMode === 'minigame') BO.Minigames.update(dt);
                        else if (BO.State.activeMode === 'zombies') BO.ZombiesMode.update(dt);
                        else if (BO.State.activeMode === 'mp') BO.MPMode.update(dt);
                        else if (BO.State.activeMode === 'rpg') BO.RPGMode.update(dt);
                        else if (BO.State.activeMode === 'owrpg') BO.OWRPGMode.update(dt);
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
                    BO.SurvivalUI?.updateHud?.();
                    if (BO.RPGUI) BO.RPGUI.updateHud(dt);
                    if (BO.OWRPGUI && BO.State.activeMode === 'owrpg') BO.OWRPGUI.updateHud(dt);
                } else if (!BO.State.paused && BO.SurvivalUI?.open && BO.State.activeMode === 'survival' && BO.SurvivalMode?.active &&
                    !['respawn', 'briefing', 'ending', 'epilogue'].includes(BO.SurvivalUI.section)) {
                    // Real-time menus: the Zone keeps moving while you rummage through your pack.
                    BO.Combat.updateBurstAndProjectiles(dt, this.worldCamera);
                    BO.World.updateAnimatedProps(dt, this.elapsed);
                    BO.FX.update(dt);
                    BO.SurvivalMode.update(dt);
                    BO.HUD.update(dt);
                    if (BO.SurvivalUI.liveRefresh) BO.SurvivalUI.liveRefresh(dt);
                }

                if (BO.Net) BO.Net.update(dt, this.worldCamera);

                if (BO.Atmosphere) BO.Atmosphere.update(this.renderer, dt);
                if (BO.HitboxDebug && BO.HitboxDebug.isEnabled()) BO.HitboxDebug.update();
                if (BO.PostFX) BO.PostFX.setGrade(BO.State.activeMode || 'default');
                const post = BO.PostFX && BO.PostFX.begin(this.renderer);
                this.renderer.clear();
                if (BO.World.scene) {
                    this.renderer.render(BO.World.scene, this.worldCamera);
                }
                if (BO.PostFX) BO.PostFX.viewmodelPass(this.renderer); else this.renderer.clearDepth();
                this.renderer.render(BO.Player.vmScene, BO.Player.vmCamera);
                if (post) BO.PostFX.end(this.renderer, dt, this.worldCamera);
            } else {
                // Render Main Menu / Gunsmith Showcase 3D Scene
                if (this.showcasePivot) {
                    if (BO.State.screen === 'gunsmith') {
                        this._renderWeaponStudio();
                        return;
                    }
                    // Hero framing: weapon sits in the right third, slow turntable with a gentle bob.
                    const aspect = this.showcaseCamera.aspect || 1.6;
                    this.showcasePivot.scale.setScalar(0.72);
                    this.showcasePivot.position.set(0.16 + 0.26 * Math.min(1.8, aspect) / 1.8, -0.04 + Math.sin(this.elapsed * 0.8) * 0.008, 0);
                    this.showcasePivot.rotation.set(0.06, this.elapsed * 0.32, 0);
                    this.showcaseCamera.position.set(-0.05, 0.16, 1.5);
                }
                if (BO.PostFX) BO.PostFX.setGrade('menu');
                const post = BO.PostFX && BO.PostFX.begin(this.renderer);
                this.renderer.clear();
                this.renderer.render(this.showcaseScene, this.showcaseCamera);
                if (post) BO.PostFX.end(this.renderer, dt, this.showcaseCamera);
            }
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        const app = new BlackoutApp();
        BO.App = app;
        app.boot();
    });
})(window);
