/* ============================================================================
   BLACKOUT OPS — COD Player Controller & Dual-Scene Viewmodel Animation
   Supports Walk, Sprint, Tactical Sprint, Crouch, Slide, Slide-Cancel, Jump,
   Coyote Time, Mantle, ADS Dead-Center Alignment, Sniper Hold Breath,
   Recoil Springs, Multi-Stage/Shell Reload, Armor Plates, and Last Stand.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class PlayerController {
        constructor() {
            this.pos = new THREE.Vector3(0, 0, 0);
            this.vel = new THREE.Vector3(0, 0, 0);
            this.yaw = 0;
            this.pitch = 0;
            this.radius = 0.42;
            this.standHeight = 1.75;
            this.crouchHeight = 1.15;

            // Vitals
            this.hp = 100;
            this.maxHp = 100;
            this.armor = 0; // 0..150 (3 plates x 50)
            this.maxArmor = 150;
            this.armorReservePlates = 2;
            this.regenDelayTimer = 0;
            this.alive = true;
            this.inLastStand = false;
            this.lastStandTimer = 0;
            this.reviveGraceTimer = 0;
            this.selfRevives = 0;
            this.isJuggernaut = false;
            this.juggernautTimer = 0;

            // Movement state
            this.onGround = true;
            this.jumpsUsed = 0;
            this.coyoteTimer = 0;
            this.crouching = false;
            this.sliding = false;
            this.slideTimer = 0;
            this.slideDir = new THREE.Vector3();
            this.tacStamina = 1.0;
            this.sprinting = false;
            this.tacSprinting = false;
            this.stepDist = 0;
            this.eyeHeight = 1.60;
            this.rideState = null;
            this.inSwampMud = false;
            this.centrifugeCooldown = 0;

            // Weapons & Combat State
            this.weapons = []; // [slot0, slot1]
            this.activeSlot = 0;
            this.swapTimer = 0;
            this.adsAlpha = 0;
            this.adsHeld = false;
            this.reloading = false;
            this.reloadTimer = 0;
            this.reloadDuration = 1.5;
            this.reloadStage = 0;
            this.fireCooldown = 0;
            this.burstRemaining = 0;
            this.burstTimer = 0;
            this.triggerHeld = false;
            this.meleeTimer = 0;
            this.inspectTimer = 0;
            this.platingTimer = 0;
            this.holdBreath = false;
            this.scopeZoom = 4.0; // Stepless 1.0x .. 20.0x variable sniper scope zoom!

            // Equipment & Perks
            this.lethalId = 'frag';
            this.lethalCount = 2;
            this.tacticalId = 'flashbang';
            this.tacticalCount = 2;
            this.cookingFrag = false;
            this.cookTimer = 0;
            this.mpPerks = [];
            this.zombiePerks = new Set(); // 'quick_revive','juggernog','speed_cola','double_tap','stamin_up','deadshot'
            this.fieldUpgradeId = 'munitions_box';
            this.fieldCharge = 1.0; // 0..1
            this.fieldActiveTimer = 0;
            this.aetherActive = false;
            this.frenziedActive = false;

            this.ultimateId = 'gravity_spikes';
            this.ultimateCharge = 1.0; // 0..1 (starts ready or charges fast on kills!)
            this.ultimateActiveTimer = 0;
            this.overdriveActive = false;

            // Recoil & Visual Springs
            this.recoilPitch = 0;
            this.recoilYaw = 0;
            this.recoilZ = 0;
            this.flinchPitch = 0;
            this.bobPhase = 0;
            this.swayX = 0;
            this.swayY = 0;
            this.cameraShake = 0;
            this.flashBlindTimer = 0;
            this.damageArcs = []; // { angle, timer }

            // Viewmodel Scene
            this.vmScene = new THREE.Scene();
            this.vmCamera = new THREE.PerspectiveCamera(58, 16 / 9, 0.02, 10);
            this.vmAnchor = new THREE.Group();
            this.vmCamera.add(this.vmAnchor);
            this.vmScene.add(this.vmCamera);
            this.vmBuild = null;
            this.fistRig = null;
            this.punchSide = 1;
            this.guardStartTime = -99;
            this._wasGuarding = false;
            this.parryFeedbackTimer = 0;
            this.invulnTimer = 0;
            this.dodgeCooldown = 0;
            this.dodgeRollTimer = 0;
            this.bareComboStep = 0;
            this.bareComboWindow = 0;
            this.muzzleFlashMesh = null;
            this.muzzleFlashTimer = 0;
            this._setupVMLights();

            // Input tracking
            this.keys = Object.create(null);
            this.mouseDragging = false;
        }

        _setupVMLights() {
            const amb = new THREE.AmbientLight(0xdbeafe, 0.75);
            const key = new THREE.DirectionalLight(0xfff5e4, 1.35);
            key.position.set(1.5, 2.5, 1.2);
            const rim = new THREE.DirectionalLight(0x60a5fa, 0.65);
            rim.position.set(-2.0, 0.5, -1.5);
            this.vmScene.add(amb, key, rim);
        }

        get matchRules() {
            return BO.State.activeMode === 'mp' ? BO.MPMode.customRules : {};
        }

        initForMatch(mode, spawn, loadoutCfg, useClassicStarter = false) {
            this.pos.set(spawn.x, spawn.y, spawn.z);
            this.vel.set(0, 0, 0);
            this.yaw = spawn.yaw || 0;
            this.pitch = 0;
            this.onGround = true;
            this.coyoteTimer = 0;
            this.crouching = false;
            this.sliding = false;
            this.slideTimer = 0;
            this.tacStamina = 1.0;

            this.maxHp = 100;
            this.hp = 100;
            this.armor = mode === 'mp' ? 0 : 100; // Start Zombies with 2 armor plates (or replenish)
            this.armorReservePlates = 2;
            this.alive = true;
            this.inLastStand = false;
            this.lastStandTimer = 0;
            this.reviveGraceTimer = 0;
            this.selfRevives = mode === 'zombies' ? 1 : 0;
            this.isJuggernaut = false;
            this.juggernautTimer = 0;

            this.mpPerks = !this.matchRules.noClassPerks && loadoutCfg.perks ? loadoutCfg.perks.slice() : [];
            this.zombiePerks.clear();
            if (mode === 'zombies' && BO.Cheats && BO.Cheats.isActive('perks', true)) {
                ['quick_revive', 'juggernog', 'speed_cola', 'double_tap', 'stamin_up', 'deadshot'].forEach((pk) => this.zombiePerks.add(pk));
                this.applyPerkStats();
            }

            this.lethalId = loadoutCfg.lethal || 'frag';
            this.lethalCount = BO.AttachmentsData.LETHALS[this.lethalId]?.count || 2;
            this.tacticalId = loadoutCfg.tactical || 'flashbang';
            this.tacticalCount = BO.AttachmentsData.TACTICALS[this.tacticalId]?.count || 2;
            if (mode === 'zombies' && useClassicStarter) {
                this.lethalId = 'frag';
                this.lethalCount = 2;
                this.tacticalId = 'monkey_bomb';
                this.tacticalCount = 1;
            }

            this.fieldUpgradeId = loadoutCfg.fieldUpgrade || 'munitions_box';
            this.fieldCharge = 1.0;
            this.fieldActiveTimer = 0;
            this.aetherActive = false;
            this.frenziedActive = false;
            this.ultimateId = loadoutCfg.ultimatePower || 'gravity_spikes';
            this.ultimateCharge = 0.35; // Starts partially charged, charges rapidly with kills!
            this.ultimateActiveTimer = 0;
            this.overdriveActive = false;
            this.cookingFrag = false;
            this.cookTimer = 0;
            this.flashBlindTimer = 0;
            this.damageArcs = [];
            this.recoilPitch = 0;
            this.recoilYaw = 0;
            this.recoilZ = 0;

            // Weapons setup
            this.weapons = [];
            const cc = (mode === 'zombies' && BO.Cheats && BO.Cheats.isActive('choose', true)) ? BO.Save.data.chooseConfig : null;
            if (cc && (cc.startPrimary || cc.startSecondary)) {
                const pId = cc.startPrimary || loadoutCfg.primary.id;
                const sId = cc.startSecondary || '';
                const pSpec = BO.WeaponsData.get(pId);
                this.weapons.push(this._createWeaponInstance({
                    id: pId, camo: 'default',
                    attachments: { optic: pSpec.modelSpec.defaultScope ? 'sniper_scope' : 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' }
                }, cc.startPapTier || 0));
                if (sId) {
                    const sSpec = BO.WeaponsData.get(sId);
                    this.weapons.push(this._createWeaponInstance({
                        id: sId, camo: 'default',
                        attachments: { optic: sSpec.modelSpec.defaultScope ? 'sniper_scope' : 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' }
                    }, cc.startPapTier || 0));
                }
            } else if (mode === 'zombies' && useClassicStarter) {
                const m1911Cfg = { id: 'm1911', camo: 'default', attachments: { optic: 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' } };
                this.weapons.push(this._createWeaponInstance(m1911Cfg, false));
            } else {
                this.weapons.push(this._createWeaponInstance(loadoutCfg.primary, false));
                if (mode === 'mp' || loadoutCfg.secondary) {
                    this.weapons.push(this._createWeaponInstance(loadoutCfg.secondary, false));
                }
            }

            if (mode === 'zombies' && BO.Cheats && BO.Cheats.isActive('megaman', true)) {
                this.weapons[0] = this._createWeaponInstance({
                    id: 'megaman_buster', camo: 'default',
                    attachments: { optic: 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' }
                }, false);
            }
            if (cc) {
                if (cc.startAllPerks && !cc.disNoPerks) {
                    ['quick_revive', 'juggernog', 'speed_cola', 'double_tap', 'stamin_up', 'deadshot'].forEach((pk) => this.zombiePerks.add(pk));
                    this.applyPerkStats();
                }
                if (cc.disNoPerks) {
                    this.zombiePerks.clear();
                }
                if (cc.disOneHp) {
                    this.maxHp = 1;
                    this.hp = 1;
                    this.armor = 0;
                    this.maxArmor = 0;
                    this.armorReservePlates = 0;
                }
            }

            this.activeSlot = 0;
            this.reloading = false;
            this.reloadTimer = 0;
            this.swapTimer = 0;
            this.adsAlpha = 0;
            this.adsHeld = false;
            this.triggerHeld = false;
            this.mouseDragging = false;
            this.fireCooldown = 0;
            this.burstRemaining = 0;
            this.burstTimer = 0;
            this.meleeTimer = 0;
            this.inspectTimer = 0;
            this.platingTimer = 0;
            this.holdBreath = false;
            this.scopeZoom = 4.0; // Stepless 1.0x .. 20.0x variable sniper scope zoom!
            this.keys = Object.create(null);
            this.rideState = null;
            this.inSwampMud = false;
            this.centrifugeCooldown = 0;
            this.rebuildViewmodel();
        }

        applyCustomLoadoutLive(cls) {
            if (!cls) return;
            this.mpPerks = !this.matchRules.noClassPerks && cls.perks ? cls.perks.slice() : [];
            this.lethalId = cls.lethal || 'frag';
            this.lethalCount = BO.AttachmentsData.LETHALS[this.lethalId]?.count || 2;
            this.tacticalId = cls.tactical || 'flashbang';
            this.tacticalCount = BO.AttachmentsData.TACTICALS[this.tacticalId]?.count || 2;
            this.fieldUpgradeId = cls.fieldUpgrade || 'munitions_box';
            this.ultimateId = cls.ultimatePower || 'gravity_spikes';
            this.weapons = [];
            if (cls.primary) this.weapons.push(this._createWeaponInstance(BO.Math.deepClone(cls.primary), 0));
            if (cls.secondary) this.weapons.push(this._createWeaponInstance(BO.Math.deepClone(cls.secondary), 0));
            this.activeSlot = 0;
            this.reloading = false;
            this.reloadTimer = 0;
            this.scopeZoom = 4.0;
            this.rebuildViewmodel();
        }

        _createWeaponInstance(cfg, isPaP = false, isDualWield = false) {
            const papTier = typeof isPaP === 'number' ? isPaP : (isPaP ? 1 : 0);
            const spec = BO.WeaponsData.get(cfg.id);
            const dual = !!(isDualWield || (papTier > 0 && spec.canDualWield));
            const stats = BO.Loadout.computeWeaponStats(cfg, papTier, this.mpPerks, dual);
            return {
                cfg: BO.Math.deepClone(cfg),
                stats,
                isPaP: papTier > 0,
                papTier,
                isDualWield: dual,
                mag: stats.magSize,
                reserve: stats.reserveMax,
                fireMode: stats.fireMode
            };
        }

        addUltimateCharge(pctPoints) {
            if (this.ultimateActiveTimer > 0) return;
            this.ultimateCharge = BO.Math.clamp(this.ultimateCharge + pctPoints / 100, 0, 1);
        }

        get usingBareHands() {
            return BO.State.activeMode === 'survival' && this.activeSlot === -1;
        }

        get guardingWithHands() {
            return this.usingBareHands && this.adsHeld && this.meleeTimer <= 0 &&
                this.swapTimer <= 0 && this.tacStamina >= 0.22 && !this.sliding;
        }

        get activeWeapon() {
            if (this.usingBareHands) return undefined;
            return this.weapons[this.activeSlot] || this.weapons[0];
        }

        giveWeapon(weaponId, isPaP = false, preserveAttachments = false) {
            const spec = BO.WeaponsData.get(weaponId);
            const existingIdx = this.weapons.findIndex((w) => w.cfg.id === weaponId);
            if (existingIdx !== -1) {
                const w = this.weapons[existingIdx];
                // Picking up a second Model 1887 activates Akimbo Dual-Wield!
                if (spec.canDualWield && !w.isDualWield) {
                    w.isDualWield = true;
                    w.stats = BO.Loadout.computeWeaponStats(w.cfg, w.papTier || 0, this.mpPerks, true);
                    w.mag = w.stats.magSize;
                    w.reserve = w.stats.reserveMax;
                    this.activeSlot = existingIdx;
                    this.rebuildViewmodel();
                    BO.Events.emit('hud:banner', {
                        title: 'AKIMBO DUAL-WIELD UNLOCKED!',
                        sub: `${w.stats.name.toUpperCase()} — DOUBLE SHOTGUNS & 2X CAPACITY`,
                        color: '#fde047'
                    });
                    return;
                }
                w.reserve = w.stats.reserveMax;
                w.mag = w.stats.magSize;
                this.activeSlot = existingIdx;
                this.rebuildViewmodel();
                return;
            }
            const newCfg = {
                id: weaponId,
                camo: preserveAttachments && this.activeWeapon ? this.activeWeapon.cfg.camo : 'default',
                attachments: preserveAttachments && this.activeWeapon ? this.activeWeapon.cfg.attachments : {
                    optic: spec.modelSpec.defaultScope ? 'sniper_scope' : 'iron',
                    muzzle: 'none',
                    underbarrel: 'none',
                    magazine: 'std_mag',
                    stock: 'std_stock'
                }
            };
            const inst = this._createWeaponInstance(newCfg, isPaP);
            const maxSlots = this.zombiePerks.has('mule_kick') ? 3 : 2;
            if (this.weapons.length < maxSlots) {
                this.weapons.push(inst);
                this.activeSlot = this.weapons.length - 1;
            } else {
                if (this.usingBareHands) this.activeSlot = 0;
                this.weapons[this.activeSlot] = inst;
            }
            this.reloading = false;
            this.rebuildViewmodel();
        }

        updateActiveWeaponAttachments(slotKey, val) {
            const w = this.activeWeapon;
            if (!w || !w.cfg) return false;
            if (!w.cfg.attachments) w.cfg.attachments = {};
            if (slotKey === 'camo') {
                w.cfg.camo = val;
            } else {
                w.cfg.attachments[slotKey] = val;
            }
            w.stats = BO.Loadout.computeWeaponStats(w.cfg, w.papTier || 0, this.mpPerks, !!w.isDualWield);
            w.mag = Math.min(w.mag, w.stats.magSize);
            w.reserve = Math.min(w.reserve, w.stats.reserveMax);
            this.rebuildViewmodel();
            return true;
        }

        packAPunchActiveWeapon() {
            const cur = this.activeWeapon;
            if (!cur || (cur.papTier || 0) >= 3) return false;
            cur.papTier = (cur.papTier || 0) + 1;
            cur.isPaP = true;
            if (BO.WeaponsData.get(cur.cfg.id).canDualWield) {
                cur.isDualWield = true;
            }
            cur.stats = BO.Loadout.computeWeaponStats(cur.cfg, cur.papTier, this.mpPerks, !!cur.isDualWield);
            cur.mag = cur.stats.magSize;
            cur.reserve = cur.stats.reserveMax;
            cur.fireMode = cur.stats.fireMode;
            this.reloading = false;
            this.rebuildViewmodel();
            return true;
        }

        rebuildViewmodel() {
            while (this.vmAnchor.children.length > 0) {
                this.vmAnchor.remove(this.vmAnchor.children[0]);
            }
            this.vmBuild = null;
            this.muzzleFlashMesh = null;
            this.muzzleFlashTimer = 0;
            if (this.usingBareHands) {
                this.fistRig ??= this._buildFistRig();
                this._attachSurvivalProp();
                this.vmAnchor.add(this.fistRig.root);
                this._updateFistPose();
                return;
            }
            const w = this.activeWeapon;
            if (!w) return;
            this.vmBuild = BO.WeaponMesh.buildWeapon(w.cfg.id, w.cfg.attachments, w.cfg.camo, w.isPaP, true, !!w.isDualWield);
            this.vmAnchor.add(this.vmBuild.root);

            // Attach 3D star muzzle flash mesh
            const flashGeo = new THREE.OctahedronGeometry(0.055, 0);
            const flashMat = new THREE.MeshBasicMaterial({
                color: w.isPaP ? 0xc084fc : (w.cfg.id === 'raygun' ? 0x22ff77 : 0xffcc44),
                transparent: true,
                opacity: 0.9
            });
            this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
            this.muzzleFlashMesh.visible = false;
            this.vmBuild.muzzleAnchor.add(this.muzzleFlashMesh);
        }

        triggerMuzzleFlash() {
            if (!this.muzzleFlashMesh || (this.activeWeapon && this.activeWeapon.stats.suppressed)) return;
            this.muzzleFlashMesh.visible = true;
            this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI;
            this.muzzleFlashMesh.scale.setScalar(0.8 + Math.random() * 0.7);
            this.muzzleFlashTimer = 0.045;
        }

        applyPerkStats() {
            this.maxHp = this.zombiePerks.has('juggernog') ? 250 : 100;
            if (this.hp > this.maxHp) this.hp = this.maxHp;
            if (this.zombiePerks.has('juggernog')) {
                this.hp = Math.min(this.maxHp, this.hp + 100);
            }
            if (this.zombiePerks.has('quick_revive')) {
                this.selfRevives = Math.max(this.selfRevives, 1);
            }
            if (this.zombiePerks.has('golden_armor')) {
                this.maxArmor = 250;
                this.armor = Math.min(this.maxArmor, this.armor + 100);
            } else {
                this.maxArmor = 150;
            }
        }

        refillAllAmmo() {
            for (const w of this.weapons) {
                w.reserve = w.stats.reserveMax;
                w.mag = w.stats.magSize;
            }
            this.lethalCount = BO.AttachmentsData.LETHALS[this.lethalId]?.count || 2;
            this.tacticalCount = BO.AttachmentsData.TACTICALS[this.tacticalId]?.count || 2;
        }

        getMoveDirectionVectors() {
            const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
            const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
            return { forward, right };
        }

        getAimRay(worldCamera) {
            const origin = worldCamera.position.clone();
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(worldCamera.quaternion).normalize();
            return { origin, dir };
        }

        adjustScopeZoom(direction) {
            const w = this.activeWeapon;
            if (!w || !w.stats || !w.stats.variableZoom) return false;
            const minZ = w.stats.minZoom || 1.0;
            const maxZ = w.stats.maxZoom || 20.0;
            const step = this.scopeZoom < 3.0 ? 0.5 : (this.scopeZoom < 8.0 ? 1.0 : 2.0);
            this.scopeZoom = BO.Math.clamp(Number((this.scopeZoom + direction * step).toFixed(1)), minZ, maxZ);
            return true;
        }

        onMouseMove(dx, dy) {
            if (!this.alive) return;
            const sens = BO.Settings.get('sensitivity') || 1.0;
            const adsSens = BO.Settings.get('adsSensitivity') || 0.65;
            const w = this.activeWeapon;
            const spyZoom = (BO.State.activeMode === 'survival' && BO.ZoneWild?.spyglassZoom > 1) ? BO.ZoneWild.spyglassZoom : 0;
            const varZoomDamp = spyZoom
                ? (1 / Math.sqrt(spyZoom))
                : ((w && w.stats && w.stats.variableZoom && this.adsAlpha > 0.35)
                    ? (1 / Math.sqrt(Math.max(1, this.scopeZoom)))
                    : 1.0);
            const fovFactor = spyZoom ? (adsSens * varZoomDamp) : (this.adsAlpha > 0.2 ? BO.Math.lerp(1.0, adsSens * varZoomDamp, this.adsAlpha) : 1.0);
            const scale = 0.0021 * sens * fovFactor;
            const inv = BO.Settings.get('invertY') ? -1 : 1;

            this.yaw -= dx * scale;
            this.pitch = BO.Math.clamp(this.pitch - dy * scale * inv, -1.48, 1.48);
            this.swayX = BO.Math.clamp(this.swayX - dx * 0.00018, -0.025, 0.025);
            this.swayY = BO.Math.clamp(this.swayY + dy * 0.00018, -0.025, 0.025);
        }

        /** Survival hotbar: equip a weapon index, or bare hands holding an optional tool/item prop. */
        equipSurvivalSlot(ref, prop = null, force = false) {
            const propKey = prop ? prop.kind + ':' + prop.id + (prop.broken ? ':x' : '') : '';
            const nextSlot = ref >= 0 && this.weapons[ref] ? ref : -1;
            if (!force && nextSlot === this.activeSlot && propKey === (this.survivalPropKey || '')) return;
            if (BO.Combat && BO.Combat.cancelCharge) BO.Combat.cancelCharge();
            const changedSlot = nextSlot !== this.activeSlot || propKey !== (this.survivalPropKey || '');
            this.activeSlot = nextSlot;
            this.survivalProp = nextSlot === -1 ? prop : null;
            this.survivalPropKey = nextSlot === -1 ? propKey : '';
            this.reloading = false;
            this.burstRemaining = 0;
            if (changedSlot) this.swapTimer = Math.max(this.swapTimer, 0.22);
            if (nextSlot === -1) {
                this.adsAlpha = 0;
                this.inspectTimer = 0;
                this._wasGuarding = false;
            }
            this.rebuildViewmodel();
            if (BO.Mods && BO.Mods.onSwapWeapon) BO.Mods.onSwapWeapon();
        }

        switchWeapon(targetSlot = null) {
            if (this.swapTimer > 0) return;
            const isSurvival = BO.State.activeMode === 'survival';
            const hotbar = isSurvival ? BO.SurvivalMode?.campaign?.hotbar : null;
            if (hotbar && targetSlot === null) {
                hotbar.cycle(1);
                return;
            }
            if (targetSlot === null && !isSurvival && this.weapons.length < 2) return;
            let next = targetSlot;
            if (next === null) {
                if (isSurvival) {
                    if (this.activeSlot === -1) next = 0;
                    else if (this.activeSlot + 1 < this.weapons.length) next = this.activeSlot + 1;
                    else next = -1;
                } else {
                    next = (this.activeSlot + 1) % this.weapons.length;
                }
            }
            const stowing = next === -1 && isSurvival;
            if (next === this.activeSlot || (!stowing && !this.weapons[next])) return;
            if (BO.Combat && BO.Combat.cancelCharge) BO.Combat.cancelCharge();
            this.activeSlot = next;
            this.reloading = false;
            this.burstRemaining = 0;
            this.swapTimer = this.mpPerks.includes('amped') ? 0.16 : 0.28;
            if (stowing) {
                this.adsAlpha = 0;
                this.inspectTimer = 0;
                this.meleeTimer = 0;
                this._wasGuarding = false;
            }
            this.rebuildViewmodel();
            if (BO.Mods && BO.Mods.onSwapWeapon) BO.Mods.onSwapWeapon();
        }

        tryDodgeRoll() {
            if (!this.alive || this.inLastStand || this.dodgeCooldown > 0 || this.tacStamina < 0.25) return false;
            const deep = BO.State.activeMode === 'survival' ? BO.SurvivalMode?.campaign?.deep : null;
            const mfx = deep?.modFx || {};
            const endRed = Math.max(0.45, (1 - (deep?.attributes?.endurance || 0) * 0.05) * (mfx.dodgeCostMult || 1));
            this.tacStamina = Math.max(0, this.tacStamina - 0.26 * endRed);
            this.invulnTimer = 0.34 + (mfx.dodgeIframesAdd || 0);
            this.dodgeCooldown = 0.58;
            this.dodgeRollTimer = 0.30;
            const { forward, right } = this.getMoveDirectionVectors();
            const kb = BO.Settings.getKeybinds();
            let ix = 0, iz = 0;
            if (this.keys[kb.forward] || this.keys['KeyW']) iz += 1;
            if (this.keys[kb.back] || this.keys['KeyS']) iz -= 1;
            if (this.keys[kb.right] || this.keys['KeyD']) ix += 1;
            if (this.keys[kb.left] || this.keys['KeyA']) ix -= 1;
            const dashDir = new THREE.Vector3();
            if (iz !== 0) dashDir.addScaledVector(forward, iz);
            if (ix !== 0) dashDir.addScaledVector(right, ix);
            if (dashDir.lengthSq() === 0) dashDir.copy(forward).multiplyScalar(-1);
            dashDir.normalize();
            this.vel.x = dashDir.x * 11.5;
            this.vel.z = dashDir.z * 11.5;
            BO.Sound.playSlide();
            return true;
        }

        startReload() {
            const w = this.activeWeapon;
            if (!w || w.stats.kind === 'melee' || this.reloading || this.swapTimer > 0) return;
            if (BO.Cheats && BO.Cheats.isActive('infammo')) {
                w.mag = w.stats.magSize;
                w.reserve = w.stats.reserveMax;
                return;
            }
            if (w.mag >= w.stats.magSize || w.reserve <= 0) return;
            if (BO.Combat && BO.Combat.cancelCharge) BO.Combat.cancelCharge();
            this.reloading = true;
            this.adsHeld = false;
            const speedColaMult = (this.zombiePerks.has('speed_cola') ? 0.52 : 1) * (this.zombiePerks.has('rush_order') && BO.ZombiesMode.exfilActive ? 0.7 : 1);
            const activeMods = BO.Mods ? BO.Mods.active() : {};
            const fastRldMult = activeMods.fastReload ? 0.35 : 1.0;
            const modRldMult = BO.Mods ? BO.Mods.reloadMult() : 1.0;
            const mealMult = BO.State.activeMode === 'survival' && BO.SurvivalMode.mealUntil > BO.SurvivalMode.clock ? 0.70 : 1;
            this.reloadDuration = w.stats.reloadTime * speedColaMult * fastRldMult * modRldMult * mealMult;
            this.reloadTimer = this.reloadDuration;
            this.reloadStage = 0;
            BO.Sound.playReload(w.stats.shellReload ? 'shell' : 'out');
            if (this.zombiePerks.has('electric_cherry') && BO.Combat && BO.Combat.onExplodeAt) {
                BO.FX.spawnExplosion(this.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 5.0, 0x06b6d4);
                BO.Combat.onExplodeAt(this.pos.clone(), 5.8, 120, 'player', true, 3.0, 'electric_cherry');
                BO.Combat.onExplodeAt(this.pos.clone(), 5.8, 110, 'player', false, 0, 'electric_cherry');
            }
        }

        toggleFireMode() {
            const w = this.activeWeapon;
            if (!w || !w.stats.altFireMode) return;
            w.fireMode = w.fireMode === w.stats.fireMode ? w.stats.altFireMode : w.stats.fireMode;
            BO.Sound.playUIClick();
            BO.Events.emit('hud:toast', { text: `${w.stats.shortName} — ${w.fireMode.toUpperCase()} FIRE`, color: '#38bdf8' });
        }

        insertArmorPlate() {
            if (this.armor >= this.maxArmor || this.armorReservePlates <= 0 || this.platingTimer > 0) return;
            this.armorReservePlates--;
            this.platingTimer = this.mpPerks.includes('runner_plates') ? 0.55 : 0.85;
            BO.Sound.playReload('in');
        }

        takeDamage(amount, attackerPos = null, isExplosive = false, attackerEntity = null) {
            if (!this.alive || this.inLastStand || this.reviveGraceTimer > 0) return;
            if (BO.Cheats && BO.Cheats.isActive('infhealth')) return;
            if (this.invulnTimer > 0) {
                BO.Events.emit('hud:toast', { text: 'EVADED!', color: '#a6ddd0' });
                return;
            }
            const deep = BO.State.activeMode === 'survival' ? BO.SurvivalMode?.campaign?.deep : null;
            if (this.guardingWithHands && attackerPos && !isExplosive) {
                const dx = attackerPos.x - this.pos.x;
                const dz = attackerPos.z - this.pos.z;
                const distance = Math.hypot(dx, dz);
                const facing = -(dx * Math.sin(this.yaw) + dz * Math.cos(this.yaw));
                if (distance > 0.01 && distance <= 3.4 && facing > distance * 0.45) {
                    const nowSec = performance.now() / 1000;
                    const parryWin = (deep?.hasTalisman('claw_talisman') ? 0.38 : 0.28) + (deep?.modFx?.parryWindowAdd || 0);
                    if (nowSec - this.guardStartTime <= parryWin) {
                        this.parryFeedbackTimer = 1.0;
                        this.tacStamina = Math.min(1.0, this.tacStamina + 0.25);
                        if (deep?.modFx?.parryHeal) {
                            this.hp = Math.min(this.maxHp, this.hp + deep.modFx.parryHeal);
                            this.tacStamina = 1.0;
                        }
                        BO.Sound.playHitmarker(true, false);
                        BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), 14, 0xfacc15, 4.5, 4, 0.35);
                        BO.Events.emit('hud:toast', { text: 'PERFECT PARRY! Counter-punch for 2.8x Riposte!', color: '#facc15' });
                        if (attackerEntity) {
                            attackerEntity.stunTimer = Math.max(attackerEntity.stunTimer || 0, 2.4);
                            attackerEntity.parriedUntil = nowSec + 2.8;
                        }
                        return;
                    }
                    this.tacStamina = Math.max(0, this.tacStamina - 0.18);
                    amount *= 0.32;
                }
            }
            if (deep) {
                if (deep.activeTonics?.jugBrew > BO.SurvivalMode.clock) amount *= 0.75;
                if (deep.hasTalisman('ironheart_crest') && this.hp < this.maxHp * 0.45) amount *= 0.75;
                if (deep.hasInfusion('thorns') && attackerEntity && !isExplosive) {
                    BO.SurvivalMode.hit(attackerEntity, Math.max(8, Math.round(amount * 0.35)), 'torso', null, 'melee');
                }
            }
            if (isExplosive && (this.zombiePerks.has('phd_flopper') || BO.Mods?.fxActive?.().noSelfExplode)) return;
            if (isExplosive && this.mpPerks.includes('flak_jacket')) amount *= 0.5;
            if (this.zombiePerks.has('widows_wine') && (!this._widowCd || this._widowCd <= 0)) {
                this._widowCd = 8.0;
                BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 22, 0xe2e8f0, 7, 2, 0.7, 1.6);
                if (BO.Combat && BO.Combat.onExplodeAt) {
                    BO.Combat.onExplodeAt(this.pos.clone(), 6.5, 65, 'player', false, 4.0, 'cryo_nova');
                }
                BO.Events.emit('hud:toast', { text: "WIDOW'S WINE WEB BLAST!", color: '#e2e8f0' });
            }
            if (this.frenziedActive) {
                // Frenzied Guard absorbs all health damage into armor/reduction
                amount *= 0.35;
            }
            if (this.isJuggernaut || this.overdriveActive) {
                amount *= 0.48;
            }
            if (BO.Mods) amount *= BO.Mods.incomingDamageMult();
            if (this.mpPerks.includes('bulwark') && this.crouching && Math.hypot(this.vel.x, this.vel.z) < 0.3) amount *= 0.78;
            if (BO.State.activeMode === 'zombies' && amount > 0) {
                const mode = BO.ZombiesMode;
                mode.roundDamageTaken = true;
                if (this.zombiePerks.has('night_guard') && !BO.World.powerOn) amount *= 0.8;
                if (this.zombiePerks.has('rear_guard') && attackerPos) {
                    const source = Math.atan2(attackerPos.x - this.pos.x, attackerPos.z - this.pos.z);
                    if (Math.cos(source - this.yaw) > 0) amount *= 0.75;
                }
                if (this.zombiePerks.has('surge_guard') && mode.surgeUsedRound !== mode.round) {
                    mode.surgeUsedRound = mode.round;
                    amount *= 0.4;
                }
            }
            amount = BO.Superpowers.absorb(amount);
            if (amount <= 0) return;
            if (BO.Mods && BO.Mods.onTakeDamage) BO.Mods.onTakeDamage(amount, attackerEntity);

            // Directional indicator angle relative to player facing
            if (attackerPos) {
                const dx = attackerPos.x - this.pos.x;
                const dz = attackerPos.z - this.pos.z;
                const worldAngle = Math.atan2(dx, dz);
                const rel = BO.Math.wrapAngle(worldAngle - this.yaw + Math.PI);
                this.damageArcs.push({ angle: rel, timer: 1.1 });
            }

            this.regenDelayTimer = this.zombiePerks.has('quick_revive') ? 2.4 : 4.0;
            this.flinchPitch += 0.045;
            this.cameraShake = Math.max(this.cameraShake, 0.035);

            // Armor absorbs 65% of damage first
            if (this.armor > 0) {
                const absorb = Math.min(this.armor, amount * 0.65);
                this.armor -= absorb;
                amount -= absorb;
            }

            this.hp -= amount;
            if (this.hp <= 0) {
                if (BO.Combat && BO.Combat.cancelCharge) BO.Combat.cancelCharge();
                const permPerks = BO.Cheats && BO.Cheats.isActive('perks');
                if ((BO.State.activeMode === 'zombies' || BO.State.activeMode === 'td') && (this.selfRevives > 0 || permPerks)) {
                    if (!permPerks) {
                        this.selfRevives--;
                        this.zombiePerks.delete('quick_revive');
                    }
                    this.inLastStand = true;
                    this.coopNeedsRevive = false;
                    this.lastStandTimer = 2.6;
                    this.hp = Math.round(this.maxHp * 0.6);
                    BO.Events.emit('hud:toast', { text: 'LAST STAND — SELF REVIVING...', color: '#ef4444' });
                } else if (BO.Net && BO.Net.active && BO.Net.players.size > 1 && (BO.State.activeMode === 'zombies' || BO.State.activeMode === 'td')) {
                    this.inLastStand = true;
                    this.coopNeedsRevive = true;
                    this.lastStandTimer = 45.0;
                    this.hp = 10;
                    BO.Events.emit('hud:banner', {
                        title: 'DOWNED — CALL FOR REVIVE!',
                        sub: 'TEAMMATE CAN PRESS [E] NEAR YOU TO REVIVE!',
                        color: '#ef4444'
                    });
                } else {
                    this.hp = 0;
                    this.alive = false;
                }
            }
        }

        update(dt, worldCamera) {
            if (!this.alive) return;

            // Arrow-key look fallback for pointer-lock-free environments
            const turnSpeed = 2.0 * (BO.Settings.get('sensitivity') || 1.0);
            if (this.keys['ArrowLeft']) this.yaw += turnSpeed * dt;
            if (this.keys['ArrowRight']) this.yaw -= turnSpeed * dt;
            if (this.keys['ArrowUp']) this.pitch = BO.Math.clamp(this.pitch + turnSpeed * 0.7 * dt, -1.48, 1.48);
            if (this.keys['ArrowDown']) this.pitch = BO.Math.clamp(this.pitch - turnSpeed * 0.7 * dt, -1.48, 1.48);

            // Timers
            if (this.fireCooldown > 0) this.fireCooldown -= dt;
            if (this.swapTimer > 0) this.swapTimer -= dt;
            if (this.meleeTimer > 0) this.meleeTimer -= dt;
            if (this.inspectTimer > 0) this.inspectTimer -= dt;
            if (this.parryFeedbackTimer > 0) this.parryFeedbackTimer = Math.max(0, this.parryFeedbackTimer - dt);
            if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
            if (this.dodgeCooldown > 0) this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
            if (this.dodgeRollTimer > 0) this.dodgeRollTimer = Math.max(0, this.dodgeRollTimer - dt);
            if (this.bareComboWindow > 0) {
                this.bareComboWindow = Math.max(0, this.bareComboWindow - dt);
                if (this.bareComboWindow === 0) this.bareComboStep = 0;
            }
            const guardingNow = this.guardingWithHands;
            if (guardingNow && !this._wasGuarding) {
                this.guardStartTime = performance.now() / 1000;
            }
            this._wasGuarding = guardingNow;
            if (this.flashBlindTimer > 0) this.flashBlindTimer = Math.max(0, this.flashBlindTimer - dt);
            if (this.cameraShake > 0) this.cameraShake = Math.max(0, this.cameraShake - dt * 0.14);

            if (this.platingTimer > 0) {
                this.platingTimer -= dt;
                if (this.platingTimer <= 0) {
                    this.armor = Math.min(this.maxArmor, this.armor + 50);
                }
            }

            if (this.isJuggernaut) {
                this.juggernautTimer -= dt;
                if (this.juggernautTimer <= 0) {
                    this.isJuggernaut = false;
                    this.maxHp = 100;
                    this.hp = Math.min(this.hp, 100);
                }
            }

            if (this.fieldActiveTimer > 0) {
                this.fieldActiveTimer -= dt;
                if (this.fieldActiveTimer <= 0) {
                    this.aetherActive = false;
                    this.frenziedActive = false;
                }
            } else {
                this.fieldCharge = Math.min(1.0, this.fieldCharge + dt / (BO.AttachmentsData.FIELD_UPGRADES[this.fieldUpgradeId]?.cooldown || 50));
            }

            if (this.ultimateActiveTimer > 0) {
                this.ultimateActiveTimer -= dt;
                if (this.ultimateActiveTimer <= 0) {
                    this.overdriveActive = false;
                }
            } else {
                // Passive trickle charge so players also steadily build Ultimate
                this.ultimateCharge = Math.min(1.0, this.ultimateCharge + dt * 0.008);
            }

            if (this.inLastStand) {
                if (this.coopNeedsRevive && BO.Net && BO.Net.active && !BO.Net.isAnySquadmateAlive()) {
                    this.inLastStand = false;
                    this.coopNeedsRevive = false;
                    this.hp = 0;
                    this.alive = false;
                    return;
                }
                this.lastStandTimer -= dt;
                if (this.lastStandTimer <= 0) {
                    this.inLastStand = false;
                    this.coopNeedsRevive = false;
                    this.reviveGraceTimer = 2.0;
                    this.hp = this.maxHp;
                    BO.Sound.playPerkBuy();
                    BO.Events.emit('player:revived', this.pos.clone());
                    BO.Events.emit('hud:toast', { text: 'REVIVED — BACK IN THE FIGHT!', color: '#38bdf8' });
                }
            }
            if (this.reviveGraceTimer > 0) this.reviveGraceTimer -= dt;

            // Damage arc decay
            for (let i = this.damageArcs.length - 1; i >= 0; i--) {
                this.damageArcs[i].timer -= dt;
                if (this.damageArcs[i].timer <= 0) this.damageArcs.splice(i, 1);
            }

            // Health & Aegis Armor auto-regeneration
            if (BO.Mods) BO.Mods.tickPlayer(dt);
            if (this._widowCd > 0) this._widowCd = Math.max(0, this._widowCd - dt);
            if (this.zombiePerks.has('golden_armor') && this.armor < this.maxArmor) {
                this.armor = Math.min(this.maxArmor, this.armor + 10 * dt);
            }
            if (this.regenDelayTimer > 0) {
                this.regenDelayTimer -= dt;
            } else if (this.hp < this.maxHp) {
                const activeMods = BO.Mods ? BO.Mods.active() : {};
                if (BO.State.activeMode !== 'survival' && !activeMods.noRegen && !this.matchRules.noHealthRegen) {
                    const regenRate = (this.zombiePerks.has('quick_revive') ? 45 : 28) * (BO.Mods ? BO.Mods.regenMult() : 1);
                    this.hp = Math.min(this.maxHp, this.hp + regenRate * dt);
                }
            }

            // Muzzle flash mesh hide
            if (this.muzzleFlashTimer > 0) {
                this.muzzleFlashTimer -= dt;
                if (this.muzzleFlashTimer <= 0 && this.muzzleFlashMesh) {
                    this.muzzleFlashMesh.visible = false;
                }
            }

            // Reload progression
            this._updateReload(dt);

            // Movement physics
            this._updateMovement(dt);

            // Recoil & sway springs
            this.recoilPitch = BO.Math.damp(this.recoilPitch, 0, 14, dt);
            this.recoilYaw = BO.Math.damp(this.recoilYaw, 0, 14, dt);
            this.recoilZ = BO.Math.damp(this.recoilZ, 0, 18, dt);
            this.flinchPitch = BO.Math.damp(this.flinchPitch, 0, 16, dt);
            this.swayX = BO.Math.damp(this.swayX, 0, 10, dt);
            this.swayY = BO.Math.damp(this.swayY, 0, 10, dt);

            // ADS & Camera FOV
            const w = this.activeWeapon;
            const canAds = !this.usingBareHands && !this.matchRules.noAds && this.adsHeld && !this.reloading && !this.tacSprinting && this.swapTimer <= 0 && !this.inLastStand;
            const adsRate = w ? (1 / Math.max(0.06, w.stats.adsTime)) : 6.0;
            this.adsAlpha = BO.Math.clamp(this.adsAlpha + (canAds ? 1 : -1) * adsRate * dt, 0, 1);
            this.holdBreath = canAds && (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && w && w.stats.useScopeOverlay;

            const baseFov = BO.Settings.get('fov') || 90;
            const sprintFovBonus = this.tacSprinting ? 7 : (this.sprinting ? 3.5 : 0);
            const effAdsFov = (w && w.stats.variableZoom)
                ? BO.Math.clamp(baseFov / Math.max(1.0, this.scopeZoom), 4.2, baseFov)
                : (w ? w.stats.adsFov : baseFov);
            const spyFov = (BO.State.activeMode === 'survival' && BO.ZoneWild?.spyglassZoom > 1)
                ? BO.Math.clamp(baseFov / BO.ZoneWild.spyglassZoom, 8, baseFov)
                : null;
            const targetFov = spyFov ?? (w
                ? BO.Math.lerp(baseFov + sprintFovBonus, effAdsFov, this.adsAlpha)
                : baseFov + sprintFovBonus);
            if (Math.abs(worldCamera.fov - targetFov) > 0.05) {
                worldCamera.fov = BO.Math.damp(worldCamera.fov, targetFov, 16, dt);
                worldCamera.updateProjectionMatrix();
            }

            // Sync world camera (respect screenShake setting)
            const shakeScale = BO.Settings.get('screenShake') ?? 1.0;
            const shakeX = (Math.random() - 0.5) * this.cameraShake * shakeScale;
            const shakeY = (Math.random() - 0.5) * this.cameraShake * shakeScale;
            worldCamera.position.set(this.pos.x + shakeX, this.pos.y + this.eyeHeight + shakeY, this.pos.z);

            // Subtle Sniper scope breathing sway when ADS unless holding breath
            let breathX = 0, breathY = 0;
            if (w && w.stats.useScopeOverlay && this.adsAlpha > 0.6 && !this.holdBreath) {
                const t = performance.now() * 0.0022;
                breathX = Math.sin(t) * 0.006;
                breathY = Math.cos(t * 1.4) * 0.005;
            }

            const finalEuler = new THREE.Euler(
                BO.Math.clamp(this.pitch + this.recoilPitch + this.flinchPitch + breathY, -1.5, 1.5),
                this.yaw + this.recoilYaw + breathX,
                this.dodgeRollTimer > 0 ? Math.sin(this.dodgeRollTimer / 0.30 * Math.PI) * 0.24 : (this.sliding ? -0.07 : 0),
                'YXZ'
            );
            worldCamera.quaternion.setFromEuler(finalEuler);

            // Update First-Person Viewmodel Pose
            this._updateViewmodel(dt);
        }

        _updateReload(dt) {
            if (!this.reloading) return;
            const w = this.activeWeapon;
            if (!w) { this.reloading = false; return; }
            this.reloadTimer -= dt;

            if (!w.stats.shellReload && this.reloadStage === 0 && this.reloadTimer < this.reloadDuration * 0.35) {
                this.reloadStage = 1;
                BO.Sound.playReload('in');
            }

            if (this.reloadTimer <= 0) {
                if (w.stats.shellReload) {
                    if (w.mag < w.stats.magSize && w.reserve > 0) {
                        w.mag++;
                        w.reserve--;
                    }
                    if (w.mag < w.stats.magSize && w.reserve > 0) {
                        const speedColaMult = (this.zombiePerks.has('speed_cola') ? 0.52 : 1) * (this.zombiePerks.has('rush_order') && BO.ZombiesMode.exfilActive ? 0.7 : 1);
                        this.reloadDuration = w.stats.reloadTime * speedColaMult;
                        this.reloadTimer = this.reloadDuration;
                        BO.Sound.playReload('shell');
                    } else {
                        this.reloading = false;
                        BO.Sound.playReload('bolt');
                    }
                } else {
                    const need = w.stats.magSize - w.mag;
                    const take = Math.min(need, w.reserve);
                    w.mag += take;
                    w.reserve -= take;
                    this.reloading = false;
                    BO.Sound.playReload('bolt');
                    if (BO.Mods && BO.Mods.onReload) BO.Mods.onReload(w);
                }
            }
        }

        _updateMovement(dt) {
            if (this.centrifugeCooldown > 0) this.centrifugeCooldown = Math.max(0, this.centrifugeCooldown - dt);

            if (this.rideState) {
                const rs = this.rideState;
                if (rs.kind === 'elevator') {
                    const el = rs.elevator;
                    this.pos.x = BO.Math.damp(this.pos.x, el.x, 8, dt);
                    this.pos.z = BO.Math.damp(this.pos.z, el.z, 8, dt);
                    this.pos.y = el.cabY;
                    this.vel.set(0, 0, 0);
                    this.onGround = true;
                    if (!el.moving) {
                        this.rideState = null;
                    }
                    return;
                } else if (rs.kind === 'arc') {
                    rs.t = Math.min(1, rs.t + dt / Math.max(0.1, rs.duration));
                    const t = rs.t;
                    this.pos.x = BO.Math.lerp(rs.sx, rs.dx, t);
                    this.pos.z = BO.Math.lerp(rs.sz, rs.dz, t);
                    this.pos.y = BO.Math.lerp(rs.sy, rs.dy, t) + Math.sin(t * Math.PI) * (rs.arcHeight || 0);
                    this.vel.set(0, 0, 0);
                    this.onGround = true;
                    if (t >= 1) {
                        this.pos.set(rs.dx, rs.dy, rs.dz);
                        if (rs.unlockZone) BO.World.unlockedZones.add(rs.unlockZone);
                        this.rideState = null;
                    }
                    return;
                }
            }

            const { forward, right } = this.getMoveDirectionVectors();
            const kb = BO.Settings.getKeybinds();
            let ix = 0, iz = 0;
            if (this.keys[kb.forward] || this.keys['KeyW']) iz += 1;
            if (this.keys[kb.back] || this.keys['KeyS']) iz -= 1;
            if (this.keys[kb.right] || this.keys['KeyD']) ix += 1;
            if (this.keys[kb.left] || this.keys['KeyA']) ix -= 1;

            const moveInput = new THREE.Vector3();
            if (iz !== 0) moveInput.addScaledVector(forward, iz);
            if (ix !== 0) moveInput.addScaledVector(right, ix);
            if (moveInput.lengthSq() > 0) moveInput.normalize();

            const w = this.activeWeapon;
            let gunMoveMult = w ? w.stats.moveMult : 1.0;
            if (this.mpPerks.includes('light_mount') && gunMoveMult < 1) gunMoveMult = (gunMoveMult + 1) / 2;
            const staminUp = this.zombiePerks.has('stamin_up') || (BO.Cheats && BO.Cheats.isActive('perks'));
            const doubleTime = this.mpPerks.includes('double_time');
            const deadSilence = this.mpPerks.includes('dead_silence');
            const stalker = this.mpPerks.includes('stalker');

            if (this.matchRules.lowProfile) this.crouching = true;
            const wantsSprint = !this.matchRules.noSprint && (this.keys[kb.sprint] || this.keys['ShiftLeft'] || this.keys['ShiftRight']) && iz > 0 && !this.adsHeld && !this.inLastStand;
            if (wantsSprint && !this.crouching && !this.sliding) {
                this.sprinting = true;
                if (this.tacStamina > 0.12 || BO.Mods?.fxActive?.().endlessStamina) {
                    this.tacSprinting = true;
                    const drain = (staminUp || BO.Mods?.fxActive?.().endlessStamina) ? 0.0 : (doubleTime ? 0.16 : 0.34);
                    this.tacStamina = Math.max(0, this.tacStamina - drain * dt);
                } else {
                    this.tacSprinting = false;
                }
            } else {
                this.sprinting = false;
                this.tacSprinting = false;
                if (!(this.usingBareHands && this.adsHeld)) {
                    const deep = BO.State.activeMode === 'survival' ? BO.SurvivalMode?.campaign?.deep : null;
                    const recMult = (deep?.hasTalisman('turtle_emblem') ? 1.40 : 1) * (deep?.comfortUntil > BO.SurvivalMode?.clock ? 1.18 : 1) * (deep?.activeTonics?.espresso > BO.SurvivalMode?.clock ? 1.35 : 1) * (deep?.modFx?.staminaRegenMult || 1);
                    this.tacStamina = Math.min(1.0, this.tacStamina + (this.mpPerks.includes('sprinter_recovery') ? 0.50 : 0.25) * recMult * dt);
                }
            }

            if (this.sliding) {
                this.slideTimer -= dt;
                if (this.slideTimer <= 0) {
                    this.sliding = false;
                    this.crouching = true;
                }
            }

            // Target speed calculation
            let speed = 5.4;
            if (this.inLastStand) speed = 2.0;
            else if (this.sliding) speed = 10.6 * (this.slideTimer / (this.mpPerks.includes('slider') ? 0.7425 : 0.55) + 0.35);
            else if (this.crouching) speed = doubleTime ? 3.9 : 3.1;
            else if (this.tacSprinting) speed = 8.4;
            else if (this.sprinting) speed = 7.1;

            if (this.adsAlpha > 0.3 && !this.sliding) {
                speed *= stalker ? 0.85 : 0.62;
            }
            if (this.guardingWithHands) speed *= 0.78;
            if (this.mpPerks.includes('stride') && !this.sprinting && !this.crouching && !this.sliding && this.adsAlpha <= 0.3) speed *= 1.12;
            if (this.mpPerks.includes('reverse_gear') && iz < 0) speed *= 1.2;
            if (staminUp) speed *= 1.16;
            if (deadSilence) speed *= 1.06;
            if (this.aetherActive) speed *= 1.20;
            if (BO.Cheats) {
                if (BO.Cheats.isActive('superfast')) speed *= 4.0;
                else if (BO.Cheats.isActive('fast')) speed *= 2.0;
            }
            if (BO.State.activeMode === 'mp' && BO.MPMode && BO.MPMode.customRules) {
                speed *= (BO.MPMode.customRules.speedScale || 1.0);
            }
            const activeModsSpd = BO.Mods ? BO.Mods.active() : {};
            if (activeModsSpd.hyperSpeedPlayer) speed *= 1.60;
            if (BO.Mods) speed *= BO.Mods.speedMult();
            this.inSwampMud = BO.World.isInSlowZone(this.pos.x, this.pos.y, this.pos.z) && !this.sliding && this.onGround;
            if (this.inSwampMud && !this.mpPerks.includes('mudskipper')) speed *= 0.62;
            if (BO.State.activeMode === 'survival') speed *= BO.SurvivalMode.campaign?.speed || 1;
            speed *= gunMoveMult;

            if (this.sliding) {
                this.vel.x = this.slideDir.x * speed;
                this.vel.z = this.slideDir.z * speed;
            } else {
                const accel = this.onGround ? (this.matchRules.stickyFloor ? 4.5 : 15)
                    : (this.mpPerks.includes('airfoil') ? 16.5 : 5.5);
                this.vel.x = BO.Math.damp(this.vel.x, moveInput.x * speed, accel, dt);
                this.vel.z = BO.Math.damp(this.vel.z, moveInput.z * speed, accel, dt);
            }

            // Gravity, Flight ('fly'), Noclip ('noclip') & Grounding
            const isNoclip = BO.Cheats && BO.Cheats.isActive('noclip');
            const isFly = isNoclip || (BO.Cheats && BO.Cheats.isActive('fly'));
            const lowGrav = BO.Cheats && BO.Cheats.isActive('choose') && BO.Save.data.chooseConfig && BO.Save.data.chooseConfig.advLowGravity;

            if (isFly) {
                const upHeld = this.keys[kb.jump] || this.keys['Space'];
                const downHeld = this.keys[kb.crouch] || this.keys['KeyC'] || this.keys['ControlLeft'];
                if (upHeld) {
                    this.vel.y = 8.5;
                } else if (downHeld) {
                    this.vel.y = -8.5;
                } else if (iz !== 0) {
                    this.vel.y = Math.sin(this.pitch) * iz * speed;
                } else {
                    this.vel.y = BO.Math.damp(this.vel.y, 0, 14, dt);
                }
            } else {
                const mpGravMult = (BO.State.activeMode === 'mp' && BO.MPMode && BO.MPMode.customRules) ? (BO.MPMode.customRules.gravityScale || 1.0) : 1.0;
                const tdGravMult = (BO.State.activeMode === 'td' && BO.TowerDefenseMode && BO.TowerDefenseMode.modifiers?.lowGravity) ? 0.48 : 1.0;
                const modGravMult = BO.Mods ? BO.Mods.gravityMult() : 1.0;
                const grav = (lowGrav ? 9.5 : 24.0) * mpGravMult * tdGravMult * modGravMult;
                this.vel.y -= grav * dt;
            }

            const prevY = this.pos.y;
            this.pos.x += this.vel.x * dt;
            this.pos.z += this.vel.z * dt;
            this.pos.y += this.vel.y * dt;

            const isTiny = BO.Cheats && BO.Cheats.isActive('tiny');
            const sizeScale = isTiny ? 0.25 : 1.0;
            const activeH = ((this.crouching || this.sliding) ? this.crouchHeight : this.standHeight) * sizeScale;
            if (!isNoclip) {
                if (BO.World.resolveCeiling(this.pos, prevY, this.radius * sizeScale, activeH) && this.vel.y > 0) {
                    this.vel.y = 0;
                }
                BO.World.resolveHorizontal(this.pos, this.radius * sizeScale, activeH, true);
            }

            const floorY = BO.World.getGroundHeight(this.pos.x, this.pos.z, this.pos.y);
            if (!isNoclip && this.pos.y <= floorY) {
                this.pos.y = floorY;
                if (!isFly || this.vel.y < 0) this.vel.y = 0;
                this.onGround = !isFly;
                this.jumpsUsed = 0;
                this.coyoteTimer = this.mpPerks.includes('high_step') ? 0.32 : 0.14;
            } else {
                this.onGround = false;
                this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
            }

            // Smooth Eye Height (25% height when tiny cheat is active!)
            const targetEye = (this.inLastStand ? 0.58 : (this.sliding ? 0.84 : (this.crouching ? 1.04 : 1.62))) * sizeScale;
            this.eyeHeight = BO.Math.damp(this.eyeHeight, targetEye, 14, dt);

            // Footsteps & Walk Bob
            const horizSpeed = Math.hypot(this.vel.x, this.vel.z);
            if (this.onGround && horizSpeed > 0.6 && !this.sliding) {
                this.bobPhase += dt * horizSpeed * 1.95;
                this.stepDist += horizSpeed * dt;
                const stride = this.sprinting ? 2.5 : 2.1;
                if (this.stepDist >= stride) {
                    this.stepDist = 0;
                    if (!deadSilence) BO.Sound.playFootstep(this.sprinting);
                }
            } else {
                this.bobPhase += dt * 1.2;
            }
        }

        tryJumpOrMantle() {
            if (!this.alive || this.inLastStand || this.matchRules.noJump) return;
            if (this.sliding) {
                this.sliding = false;
                this.crouching = false;
            }
            if (this.crouching) {
                this.crouching = false;
            }
            const mpJumpMult = (BO.State.activeMode === 'mp' && BO.MPMode && BO.MPMode.customRules) ? (BO.MPMode.customRules.jumpScale || 1.0) : 1.0;
            const eagleJump = this.zombiePerks.has('eagle_eye') ? 1.25 : 1.0;
            const modJump = BO.Mods ? BO.Mods.jumpMult() : 1.0;
            const jumpMult = ((BO.Cheats && BO.Cheats.isActive('jump')) ? 1.85 : 1.0) * mpJumpMult * eagleJump * (this.mpPerks.includes('rebound') ? 1.18 : 1) * modJump;
            const canDoubleJump = (BO.Cheats && BO.Cheats.isActive('2jump')) || !!BO.Mods?.fxActive?.().allowDoubleJump;
            if (this.onGround || this.coyoteTimer > 0) {
                this.vel.y = 7.6 * jumpMult;
                this.onGround = false;
                this.coyoteTimer = 0;
                this.jumpsUsed = 1;
                BO.Sound.playFootstep(true);
            } else if (canDoubleJump && this.jumpsUsed < 2) {
                this.vel.y = 7.6 * jumpMult;
                this.jumpsUsed = 2;
                BO.Sound.playFootstep(true);
            }
        }

        tryCrouchOrSlide() {
            if (!this.alive || this.inLastStand) return;
            if (!this.matchRules.noSlide && this.sprinting && this.onGround && !this.sliding && Math.hypot(this.vel.x, this.vel.z) > 5.0) {
                this.sliding = true;
                this.slideTimer = (this.mpPerks.includes('slider') ? 0.7425 : 0.55) * (BO.Mods?.fxActive?.().slideSpeedMult ? 1.25 : 1.0);
                this.slideDir.set(this.vel.x, 0, this.vel.z).normalize();
                BO.Sound.playSlide();
                if (BO.Mods && BO.Mods.onSlide) BO.Mods.onSlide();
                if (this.zombiePerks.has('phd_flopper') && BO.Combat && BO.Combat.onExplodeAt) {
                    BO.FX.spawnExplosion(this.pos.clone().add(new THREE.Vector3(0, 0.6, 0)), 4.6, 0xa855f7);
                    BO.Sound.playExplosion(0.55);
                    BO.Combat.onExplodeAt(this.pos.clone(), 5.0, 190, 'player', false, 0, 'phd_flopper');
                }
            } else if (!this.sliding) {
                this.crouching = !this.crouching;
            }
        }

        _buildFistRig() {
            const root = new THREE.Group();
            root.name = 'Survival bare hands';
            const sleeve = new THREE.MeshStandardMaterial({ color: 0x3b4432, roughness: 0.90 });
            const cuff = new THREE.MeshStandardMaterial({ color: 0x1c1e1a, roughness: 0.85 });
            const wrapMat = new THREE.MeshStandardMaterial({ color: 0xdfd8c5, roughness: 0.92 });
            const skin = new THREE.MeshStandardMaterial({ color: 0xac795a, roughness: 0.72 });
            const palmShape = new THREE.SphereGeometry(1, 14, 10);
            const armShape = new THREE.CylinderGeometry(0.044, 0.061, 0.29, 10);
            const cuffShape = new THREE.CylinderGeometry(0.051, 0.056, 0.065, 12);
            const hands = [-1, 1].map((side) => {
                const hand = new THREE.Group();
                const forearm = new THREE.Mesh(armShape, sleeve);
                forearm.rotation.x = -Math.PI / 2; forearm.position.z = 0.16;
                const wrist = new THREE.Mesh(cuffShape, cuff);
                wrist.rotation.x = -Math.PI / 2; wrist.position.z = 0.04;
                const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.048, 0.065, 10), wrapMat);
                wrap.rotation.x = -Math.PI / 2; wrap.position.z = -0.005;
                const palm = new THREE.Mesh(palmShape, wrapMat);
                palm.scale.set(0.063, 0.05, 0.064); palm.position.z = -0.027;
                hand.add(forearm, wrist, wrap, palm);
                for (let i = 0; i < 4; i++) {
                    const knuckle = new THREE.Mesh(palmShape, skin);
                    const width = 0.016 - i * 0.0005;
                    knuckle.scale.set(width, 0.021 - i * 0.001, 0.027);
                    knuckle.position.set((i - 1.5) * side * 0.024, 0.018 - i * 0.003, -0.068 + i * 0.004);
                    hand.add(knuckle);
                }
                const thumb = new THREE.Mesh(palmShape, skin);
                thumb.scale.set(0.026, 0.023, 0.036);
                thumb.position.set(-side * 0.045, -0.012, -0.054);
                hand.add(thumb);
                root.add(hand);
                return hand;
            });
            return { root, hands };
        }

        /** Builds (and caches) the tool or item mesh held in the right hand. */
        _buildSurvivalProp(prop) {
            const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.15, ...extra });
            const group = new THREE.Group();
            const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
                const m = new THREE.Mesh(geo, mat);
                m.position.set(x, y, z);
                m.rotation.set(rx, ry, rz);
                group.add(m);
                return m;
            };
            if (prop.kind === 'tool') {
                const t = BO.SurvivalFrontierData?.tools?.[prop.id] || {};
                const lvl = t.level || 1;
                const headColor = prop.broken ? 0x5a504a : lvl >= 4 ? 0x9b6bff : lvl >= 2 ? 0x9aa4ad : 0x8b8478;
                const headMat = std(headColor, lvl >= 4 ? { emissive: 0x5b21b6, emissiveIntensity: 0.55, metalness: 0.4 } : { metalness: lvl >= 2 ? 0.6 : 0.05 });
                const wood = std(0x7a5536, { roughness: 0.85 });
                const bind = std(0xcdbb92, { roughness: 0.95 });
                const handleLen = prop.id === 'miningDrill' ? 0.0 : 0.44;
                if (handleLen) add(new THREE.CylinderGeometry(0.012, 0.014, handleLen, 8), wood, 0, 0.13, 0);
                const top = 0.13 + handleLen / 2;
                if (t.family === 'axe' && prop.id !== 'saw') {
                    add(new THREE.BoxGeometry(0.035, 0.05, 0.03), bind, 0, top - 0.02, 0);
                    add(new THREE.BoxGeometry(0.02, 0.075, 0.12), headMat, 0, top - 0.02, -0.06);
                    add(new THREE.BoxGeometry(0.012, 0.11, 0.035), headMat, 0, top - 0.02, -0.125);
                } else if (prop.id === 'saw') {
                    add(new THREE.TorusGeometry(0.11, 0.008, 6, 18, Math.PI), std(0x8c949b, { metalness: 0.7 }), 0, top - 0.11, -0.01, 0, Math.PI / 2, 0);
                    add(new THREE.BoxGeometry(0.004, 0.012, 0.22), std(0xd6dadf, { metalness: 0.8 }), 0, top - 0.11, -0.01, Math.PI / 2, 0, 0);
                } else if (t.family === 'pick') {
                    if (prop.id === 'miningDrill') {
                        add(new THREE.BoxGeometry(0.07, 0.09, 0.16), std(0xb38a2e, { metalness: 0.35 }), 0, 0.05, -0.02);
                        add(new THREE.CylinderGeometry(0.016, 0.004, 0.16, 10), std(0x9aa4ad, { metalness: 0.8 }), 0, 0.05, -0.18, Math.PI / 2, 0, 0);
                        add(new THREE.BoxGeometry(0.03, 0.07, 0.03), std(0x2b2f33), 0, -0.02, 0.03);
                    } else {
                        add(new THREE.BoxGeometry(0.034, 0.04, 0.034), bind, 0, top - 0.01, 0);
                        // Double-ended pick head across the top of the haft, tips curving down.
                        add(new THREE.BoxGeometry(0.024, 0.03, 0.15), headMat, 0, top, 0);
                        add(new THREE.ConeGeometry(0.014, 0.075, 6), headMat, 0, top - 0.018, -0.1, -Math.PI / 2 - 0.45, 0, 0);
                        add(new THREE.ConeGeometry(0.014, 0.075, 6), headMat, 0, top - 0.018, 0.1, Math.PI / 2 + 0.45, 0, 0);
                    }
                } else if (t.family === 'shovel') {
                    add(new THREE.BoxGeometry(0.11, 0.13, 0.008), headMat, 0, top + 0.05, -0.005);
                    add(new THREE.BoxGeometry(0.07, 0.016, 0.016), wood, 0, -0.1, 0);
                } else {
                    add(new THREE.BoxGeometry(0.06, 0.06, 0.06), headMat, 0, top, 0);
                }
                group.rotation.set(-0.35, 0.15, 0.1);
                group.scale.setScalar(0.52);
            } else {
                const id = prop.id;
                const tint = {
                    medkits: 0xd94a4a, bandage: 0xeee4cc, rations: 0x6f7d52, freshWater: 0x5aa9d6, tea: 0x8a6a4a,
                    espresso: 0x4a3426, stew: 0x9a6a3a, broth: 0xb5733d, antibiotic: 0xbfe8da, aetherStim: 0xb08cff,
                    orbitalFlare: 0xff5a3a, jugBrew: 0xff7a7a, speedTonic: 0x7ab8ff, staminElixir: 0x8be07a,
                    deadshotTinc: 0xffc95a, filter: 0x5d6b62, repair: 0x8d939b, torch: 0x7a5536, lantern: 0xb38a2e
                }[id] || 0x9aa4ad;
                const mat = std(tint);
                if (id === 'torch') {
                    add(new THREE.CylinderGeometry(0.012, 0.016, 0.34, 8), mat, 0, 0.1, 0);
                    add(new THREE.ConeGeometry(0.035, 0.09, 8), std(0xffa12e, { emissive: 0xff7a18, emissiveIntensity: 1.2 }), 0, 0.31, 0);
                } else if (id === 'lantern') {
                    add(new THREE.BoxGeometry(0.08, 0.1, 0.08), std(0xffe08a, { emissive: 0xffc04a, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 }), 0, 0.09, -0.02);
                    add(new THREE.BoxGeometry(0.095, 0.015, 0.095), mat, 0, 0.15, -0.02);
                    add(new THREE.BoxGeometry(0.095, 0.015, 0.095), mat, 0, 0.035, -0.02);
                } else if (['freshWater', 'antibiotic', 'jugBrew', 'speedTonic', 'staminElixir', 'deadshotTinc', 'aetherStim'].includes(id)) {
                    add(new THREE.CylinderGeometry(0.03, 0.032, 0.12, 12), std(tint, { transparent: true, opacity: 0.88, emissive: tint, emissiveIntensity: 0.18 }), 0, 0.07, -0.02);
                    add(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), std(0x2b2f33), 0, 0.145, -0.02);
                } else if (['tea', 'espresso', 'stew', 'broth', 'rations'].includes(id)) {
                    add(new THREE.CylinderGeometry(0.04, 0.034, 0.07, 14), mat, 0, 0.05, -0.02);
                } else if (id === 'medkits') {
                    add(new THREE.BoxGeometry(0.11, 0.075, 0.05), mat, 0, 0.055, -0.02);
                    add(new THREE.BoxGeometry(0.045, 0.012, 0.052), std(0xffffff), 0, 0.055, -0.02);
                    add(new THREE.BoxGeometry(0.012, 0.045, 0.052), std(0xffffff), 0, 0.055, -0.02);
                } else if (id === 'candle') {
                    add(new THREE.CylinderGeometry(0.015, 0.017, 0.14, 10), std(0xf2e7c9, { roughness: 0.55 }), 0, 0.08, -0.02);
                    add(new THREE.ConeGeometry(0.018, 0.045, 8), std(0xffb43a, { emissive: 0xff8a18, emissiveIntensity: 1.5 }), 0, 0.17, -0.02);
                } else if (id === 'spyglass') {
                    add(new THREE.CylinderGeometry(0.018, 0.022, 0.13, 12), std(0xc89a45, { metalness: 0.75, roughness: 0.3 }), 0, 0.06, -0.04, Math.PI / 2, 0, 0);
                    add(new THREE.CylinderGeometry(0.024, 0.027, 0.11, 12), std(0x3b352e, { roughness: 0.6 }), 0, 0.06, -0.14, Math.PI / 2, 0, 0);
                    add(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 12), std(0x7ee8fa, { emissive: 0x38bdf8, emissiveIntensity: 0.35, metalness: 0.9 }), 0, 0.06, -0.198, Math.PI / 2, 0, 0);
                } else if (id === 'frag_grenade') {
                    add(new THREE.SphereGeometry(0.038, 10, 8), std(0x4b5b3e, { roughness: 0.6, metalness: 0.35 }), 0, 0.055, -0.02);
                    add(new THREE.CylinderGeometry(0.012, 0.014, 0.026, 8), std(0x8a9298, { metalness: 0.8 }), 0, 0.098, -0.02);
                } else if (id === 'molotov') {
                    add(new THREE.CylinderGeometry(0.026, 0.03, 0.12, 10), std(0x7a4220, { transparent: true, opacity: 0.86 }), 0, 0.065, -0.02);
                    add(new THREE.CylinderGeometry(0.01, 0.012, 0.04, 8), std(0x7a4220), 0, 0.14, -0.02);
                    add(new THREE.ConeGeometry(0.02, 0.055, 7), std(0xff7a1a, { emissive: 0xff5500, emissiveIntensity: 1.3 }), 0, 0.18, -0.02, 0.25, 0, 0);
                } else if (id === 'salvageLine') {
                    add(new THREE.TorusGeometry(0.04, 0.009, 7, 16), std(0xc9b486), 0, 0.06, -0.02, 0, Math.PI / 2, 0);
                    add(new THREE.SphereGeometry(0.018, 8, 6), std(0xee9136, { emissive: 0xd97706, emissiveIntensity: 0.4 }), 0, 0.02, -0.05);
                } else if (id === 'raw_fish' || id === 'cooked_fish') {
                    const fCol = id === 'cooked_fish' ? 0xb56b35 : 0x6ea4b8;
                    const body = add(new THREE.SphereGeometry(0.038, 10, 8), std(fCol, { roughness: 0.45 }), 0, 0.06, -0.03);
                    body.scale.set(0.55, 0.8, 1.9);
                    add(new THREE.ConeGeometry(0.026, 0.045, 4), std(fCol), 0, 0.06, 0.055, -Math.PI / 2, 0, 0);
                } else if (id.startsWith('raw_') || id.startsWith('cooked_') || id === 'jerky' || id === 'honey_ham') {
                    const mCol = id.startsWith('raw_') ? 0xb83b3b : 0x8d4c28;
                    add(new THREE.BoxGeometry(0.075, 0.032, 0.095), std(mCol, { roughness: 0.65 }), 0, 0.055, -0.025, 0.1, 0.2, 0);
                    add(new THREE.CylinderGeometry(0.009, 0.009, 0.11, 7), std(0xeae2cf), 0, 0.055, -0.02, Math.PI / 2, 0, 0);
                } else if (['hunter_stew', 'mushroom_soup', 'omelette', 'meat_pie', 'berry_pie', 'survivor_feast', 'golden_ration'].includes(id)) {
                    const bCol = id === 'golden_ration' ? 0xf2c94c : id === 'berry_pie' ? 0x9b3b6a : 0xa86434;
                    add(new THREE.CylinderGeometry(0.048, 0.034, 0.045, 14), std(0x5c4634), 0, 0.048, -0.025);
                    add(new THREE.CylinderGeometry(0.043, 0.043, 0.012, 14), std(bCol, id === 'golden_ration' ? { metalness: 0.7, emissive: 0xd97706, emissiveIntensity: 0.35 } : {}), 0, 0.071, -0.025);
                } else if (id === 'leather_armor' || id === 'hide_armor' || id === 'obsidian_armor') {
                    const aCol = id === 'obsidian_armor' ? 0x2d1f3d : id === 'hide_armor' ? 0x7c6a56 : 0x8f5b38;
                    add(new THREE.BoxGeometry(0.11, 0.12, 0.045), std(aCol, id === 'obsidian_armor' ? { metalness: 0.6, emissive: 0x6d28d9, emissiveIntensity: 0.3 } : {}), 0, 0.07, -0.025);
                } else if (id === 'bedroll') {
                    add(new THREE.CylinderGeometry(0.034, 0.034, 0.14, 12), std(0x8a6d4b, { roughness: 0.9 }), 0, 0.06, -0.025, 0, 0, Math.PI / 2);
                } else if (id === 'bandage' || id === 'splint') {
                    add(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 14), mat, 0, 0.05, -0.02, 0, 0, Math.PI / 2);
                } else {
                    add(new THREE.BoxGeometry(0.07, 0.07, 0.07), mat, 0, 0.05, -0.02);
                }
                group.rotation.set(-0.2, 0, 0);
                group.scale.setScalar(0.62);
            }
            return group;
        }

        _attachSurvivalProp() {
            const hand = this.fistRig?.hands?.[1];
            if (!hand) return;
            if (this.fistRig.prop) {
                hand.remove(this.fistRig.prop);
                this.fistRig.prop = null;
            }
            const prop = this.survivalProp;
            if (!prop || BO.State.activeMode !== 'survival') return;
            this._propCache ??= new Map();
            const key = this.survivalPropKey;
            if (!this._propCache.has(key)) this._propCache.set(key, this._buildSurvivalProp(prop));
            const mesh = this._propCache.get(key);
            mesh.position.set(0, 0.0, -0.035);
            hand.add(mesh);
            this.fistRig.prop = mesh;
        }

        _updateFistPose() {
            if (BO.State.activeMode === 'survival' && BO.ZoneWild?.spyglassZoom > 1) {
                this.vmAnchor.visible = false;
                return;
            }
            this.vmAnchor.visible = true;
            this.vmAnchor.position.set(this.swayX, this.swayY, 0);
            this.vmAnchor.rotation.set(0, 0, this.sliding ? 0.16 : 0);
            if (this.fistRig.prop && this.survivalProp) {
                this._updateHeldPropPose();
                return;
            }
            const movement = Math.min(1, Math.hypot(this.vel.x, this.vel.z) / 6.5);
            const guard = this.guardingWithHands ? 1 : 0;
            const charging = BO.Combat?.fistCharging ? Math.min(1, (BO.Combat.fistChargeTime || 0) / 0.45) : 0;
            const punch = this.meleeTimer > 0 ? Math.sin(Math.PI * BO.Math.clamp(1 - this.meleeTimer / 0.28, 0, 1)) : 0;
            this.fistRig.hands.forEach((hand, index) => {
                const side = index === 0 ? -1 : 1;
                const extension = this.punchSide === side ? punch : 0;
                const pullback = this.punchSide * -1 === side ? charging * 0.09 : 0;
                const bob = Math.sin(this.bobPhase + index * Math.PI) * 0.013 * movement;
                hand.position.set(side * (0.17 - guard * 0.038 - extension * 0.095),
                    -0.16 + guard * 0.095 + extension * (this.bareComboStep === 2 ? 0.11 : 0.065) + bob - Math.max(0, this.swapTimer) * 0.5,
                    -0.36 - guard * 0.04 - extension * 0.26 + pullback);
                hand.rotation.set(0.23 - guard * 0.24 - extension * (this.bareComboStep === 2 ? 0.45 : 0.27), side * (0.18 - extension * 0.18), side * (0.10 + guard * 0.15));
            });
        }

        /** Right hand grips the held tool/item; swings arc overhead and strike forward. */
        _updateHeldPropPose() {
            const movement = Math.min(1, Math.hypot(this.vel.x, this.vel.z) / 6.5);
            const dur = this.meleeDur || 0.32;
            const s = this.meleeTimer > 0 ? BO.Math.clamp(1 - this.meleeTimer / dur, 0, 1) : 0;
            const isTool = this.survivalProp?.kind === 'tool';
            const wind = s > 0 && s < 0.3 ? Math.sin((s / 0.3) * Math.PI * 0.5) : (s >= 0.3 ? Math.max(0, 1 - (s - 0.3) / 0.25) : 0);
            const strike = s >= 0.3 ? Math.sin(Math.PI * Math.min(1, (s - 0.3) / 0.7)) : 0;
            const swap = Math.max(0, this.swapTimer) * 0.5;
            const [left, right] = this.fistRig.hands;
            const bob = Math.sin(this.bobPhase) * 0.012 * movement;
            const bob2 = Math.sin(this.bobPhase + Math.PI) * 0.012 * movement;
            if (isTool) {
                right.position.set(0.19 - strike * 0.06, -0.2 + wind * 0.07 - strike * 0.02 + bob - swap, -0.36 - strike * 0.14);
                right.rotation.set(-0.1 - wind * 0.75 + strike * 1.25, 0.12 - strike * 0.12, 0.18 + strike * 0.25);
            } else {
                const use = s > 0 ? Math.sin(Math.PI * s) : 0;
                right.position.set(0.15 - use * 0.06, -0.19 + use * 0.08 + bob - swap, -0.33 + use * 0.06);
                right.rotation.set(0.15 - use * 0.9, -0.2 - use * 0.3, 0.1);
            }
            left.position.set(-0.21, -0.25 + bob2 - swap, -0.34);
            left.rotation.set(0.32, -0.2, -0.16);
        }

        _updateViewmodel(dt) {
            if (this.usingBareHands && this.fistRig) {
                this._updateFistPose();
                return;
            }
            const w = this.activeWeapon;
            if (!w || !this.vmBuild) return;

            // Hide 3D gun when full-screen Sniper Scope overlay is active
            if (w.stats.useScopeOverlay && this.adsAlpha > 0.80) {
                this.vmAnchor.visible = false;
            } else {
                this.vmAnchor.visible = true;
            }

            const horizSpeed = Math.hypot(this.vel.x, this.vel.z);
            const moveFactor = BO.Math.clamp(horizSpeed / 6.5, 0, 1) * (1 - this.adsAlpha * 0.85);
            const bobX = Math.cos(this.bobPhase) * 0.014 * moveFactor;
            const bobY = Math.abs(Math.sin(this.bobPhase)) * -0.016 * moveFactor;

            const hip = w.stats.hipPos;
            const adsX = 0;
            const adsY = -this.vmBuild.sightY;
            const adsZ = w.stats.adsPos[2];

            let px = BO.Math.lerp(hip[0], adsX, this.adsAlpha) + bobX + this.swayX * (1 - this.adsAlpha * 0.7);
            let py = BO.Math.lerp(hip[1], adsY, this.adsAlpha) + bobY + this.swayY * (1 - this.adsAlpha * 0.7);
            let pz = BO.Math.lerp(hip[2], adsZ, this.adsAlpha) + this.recoilZ;

            let rx = this.recoilPitch * 0.9;
            let ry = 0;
            let rz = this.sliding ? 0.35 : 0;

            // Tactical Sprint 45-degree weapon-up pose
            if (this.tacSprinting && this.adsAlpha < 0.05 && !this.reloading) {
                px -= 0.06;
                py += 0.02;
                rx += 0.38;
                ry += 0.55;
                rz += 0.25;
            }

            // Reload dip & mag animation
            if (this.reloading) {
                const p = 1 - (this.reloadTimer / Math.max(0.01, this.reloadDuration));
                const dip = Math.sin(p * Math.PI);
                py -= dip * 0.14;
                rx -= dip * 0.45;
                rz += dip * 0.30;
                if (this.vmBuild.magGroup) {
                    this.vmBuild.magGroup.position.y = -Math.sin(p * Math.PI) * 0.14;
                }
            } else if (this.vmBuild.magGroup) {
                this.vmBuild.magGroup.position.y = 0;
            }

            // Swap dip
            if (this.swapTimer > 0) {
                py -= this.swapTimer * 0.8;
                rx -= this.swapTimer * 1.4;
            }

            // Melee slash sweep
            if (this.meleeTimer > 0) {
                const mp = 1 - this.meleeTimer / 0.28;
                const sw = Math.sin(mp * Math.PI);
                px -= sw * 0.32;
                pz -= sw * 0.24;
                ry += sw * 1.1;
                rz += sw * 0.6;
            }

            // Weapon Inspect rotation
            if (this.inspectTimer > 0) {
                const ip = 1 - this.inspectTimer / 1.8;
                const wave = Math.sin(ip * Math.PI);
                ry -= wave * 0.85;
                rz -= wave * 0.45;
                px -= wave * 0.08;
            }

            this.vmAnchor.position.set(px, py, pz);
            this.vmAnchor.rotation.set(rx, ry, rz);

            // Bolt kick & Minigun rotary barrel spin
            if (this.vmBuild.isRotarySpin && this.vmBuild.boltGroup) {
                if (this.triggerHeld && !this.reloading && w.mag > 0) {
                    this.vmBuild.boltGroup.rotation.z += dt * 32;
                } else if (this.recoilZ > 0.004) {
                    this.vmBuild.boltGroup.rotation.z += dt * 16;
                }
            } else if (this.vmBuild.boltGroup) {
                this.vmBuild.boltGroup.position.z = BO.Math.clamp(this.recoilZ * 1.2, 0, 0.06);
            }

            // Mega Buster Hold-to-Charge Live Glowing Orb, Rings & Strip Glow!
            if (this.vmBuild.chargeOrbMesh) {
                const charging = !!(BO.Combat && BO.Combat.busterCharging && w.stats.magicType === 'megaman_plasma');
                const chargeFrac = charging ? BO.Math.clamp(BO.Combat.busterChargeTime / (w.stats.chargeMaxTime || 10.0), 0, 1) : 0;
                this.vmBuild.chargeOrbMesh.visible = charging;
                if (charging) {
                    const pulse = 1.0 + Math.sin(performance.now() * (0.018 + chargeFrac * 0.03)) * 0.14;
                    const orbScale = (0.55 + chargeFrac * 4.4) * pulse;
                    this.vmBuild.chargeOrbMesh.scale.setScalar(orbScale);
                    const cHex = chargeFrac >= 0.85 ? 0xfef08a : (chargeFrac >= 0.45 ? 0x60a5fa : 0x38bdf8);
                    this.vmBuild.chargeOrbMat.color.setHex(cHex);
                    this.vmBuild.chargeRingMat.color.setHex(cHex);
                    if (this.vmBuild.chargeStripMat) {
                        this.vmBuild.chargeStripMat.emissive.setHex(cHex);
                        this.vmBuild.chargeStripMat.emissiveIntensity = 0.9 + chargeFrac * 2.5;
                    }
                    if (this.vmBuild.boreGlow) this.vmBuild.boreGlow.material.color.setHex(cHex);
                    // Cannon charge tremble
                    this.vmAnchor.position.x += (Math.random() - 0.5) * 0.006 * chargeFrac;
                    this.vmAnchor.position.y += (Math.random() - 0.5) * 0.006 * chargeFrac;
                } else {
                    if (this.vmBuild.chargeStripMat) {
                        this.vmBuild.chargeStripMat.emissive.setHex(0x0284c7);
                        this.vmBuild.chargeStripMat.emissiveIntensity = 0.9;
                    }
                    if (this.vmBuild.boreGlow) this.vmBuild.boreGlow.material.color.setHex(0x38bdf8);
                }
                if (this.vmBuild.chargeRings) {
                    this.vmBuild.chargeRings.forEach((rg, idx) => {
                        rg.visible = charging;
                        if (charging) {
                            rg.scale.setScalar(0.65 + chargeFrac * 2.2);
                            rg.rotation.x += dt * (4 + idx * 3 + chargeFrac * 10);
                            rg.rotation.y += dt * (5 - idx * 2 + chargeFrac * 12);
                        }
                    });
                }
            }
        }

        /**
         * Replays the EXACT recorded 1st-person gun pose, ADS state, FOV, recoil, bob & muzzle flash
         * during the 15-second Multiplayer Winner Killcam (never stuck half-zoomed!).
         */
        applyKillcamViewmodelPose(pose, worldCamera, dt) {
            if (!pose) return;
            const ads = BO.Math.clamp(pose.adsAlpha || 0, 0, 1);
            this.adsAlpha = ads;

            // Update muzzle flash decay during Killcam playback
            if (this.muzzleFlashTimer > 0) {
                this.muzzleFlashTimer = Math.max(0, this.muzzleFlashTimer - (dt || 0.016));
                if (this.vmBuild && this.vmBuild.muzzleMesh) {
                    this.vmBuild.muzzleMesh.visible = this.muzzleFlashTimer > 0;
                    this.vmBuild.muzzleMesh.rotation.z += (dt || 0.016) * 40;
                }
                if (this.muzzleLight) this.muzzleLight.intensity = this.muzzleFlashTimer > 0 ? 4.5 : 0;
            }

            if (worldCamera && pose.fov) {
                worldCamera.fov = pose.fov;
                worldCamera.updateProjectionMatrix();
            }

            // Switch active slot if recorded weapon differs from currently displayed slot
            if (pose.weaponId && this.weapons && this.weapons.length > 1) {
                const curId = this.activeWeapon && this.activeWeapon.cfg ? this.activeWeapon.cfg.id : null;
                if (curId !== pose.weaponId) {
                    const foundIdx = this.weapons.findIndex((ww) => ww.cfg && ww.cfg.id === pose.weaponId);
                    if (foundIdx !== -1) {
                        this.activeSlot = foundIdx;
                        this.rebuildViewmodel();
                    }
                }
            }

            const w = this.activeWeapon;
            if (!w || !this.vmBuild) return;

            if (w.stats.useScopeOverlay && ads > 0.80) {
                this.vmAnchor.visible = false;
            } else {
                this.vmAnchor.visible = true;
            }

            const moveFactor = BO.Math.clamp((pose.horizSpeed || 0) / 6.5, 0, 1) * (1 - ads * 0.85);
            const bobX = Math.cos(pose.bobPhase || 0) * 0.014 * moveFactor;
            const bobY = Math.abs(Math.sin(pose.bobPhase || 0)) * -0.016 * moveFactor;

            const hip = w.stats.hipPos;
            const adsX = 0;
            const adsY = -this.vmBuild.sightY;
            const adsZ = w.stats.adsPos[2];

            let px = BO.Math.lerp(hip[0], adsX, ads) + bobX + (pose.swayX || 0) * (1 - ads * 0.7);
            let py = BO.Math.lerp(hip[1], adsY, ads) + bobY + (pose.swayY || 0) * (1 - ads * 0.7);
            let pz = BO.Math.lerp(hip[2], adsZ, ads) + (pose.recoilZ || 0);

            let rx = (pose.recoilPitch || 0) * 0.9;
            let ry = 0;
            let rz = pose.sliding ? 0.35 : 0;

            if (pose.tacSprinting && ads < 0.05 && !pose.reloading) {
                px -= 0.06;
                py += 0.02;
                rx += 0.38;
                ry += 0.55;
                rz += 0.25;
            }

            if (pose.reloading) {
                const dip = Math.sin(BO.Math.clamp(pose.reloadFrac || 0, 0, 1) * Math.PI);
                py -= dip * 0.14;
                rx -= dip * 0.45;
                rz += dip * 0.30;
            }
            if (this.vmBuild.magGroup) this.vmBuild.magGroup.position.y = 0;

            this.vmAnchor.position.set(px, py, pz);
            this.vmAnchor.rotation.set(rx, ry, rz);
        }
    }

    BO.Player = new PlayerController();
})(window);
