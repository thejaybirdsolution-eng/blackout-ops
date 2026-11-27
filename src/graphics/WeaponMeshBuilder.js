/* ============================================================================
   BLACKOUT OPS — Procedural Multi-Part 3D Weapon & Arms Builder
   Builds all 88 weapons with unique silhouettes, classic military PBR materials,
   physical 3D attachments, live camos, Pack-a-Punch circuits, and exact sightY.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    // External 3D GLB weapon models (staged_assets/3d_models/weapons/)
    const GLB_WEAPONS = {
        barrett_50cal: {
            path: 'weapons/barrett-m82_optimized.glb',
            targetLen: 1.12,
            rot: [0, 0, 0],
            hidePatterns: ['Cartridge', 'NATO Bullet'],
            offset: [0, -0.015, -0.14],
            muzzleOffset: [0, 0.022, -0.70],
            sightY: 0.095,
            sightZ: -0.02,
            sightEyeRelief: 0.18
        },
        intervention: {
            path: 'weapons/cheytac_m200_intervention.glb',
            targetLen: 1.04,
            rot: [0, Math.PI * 0.5, 0],
            hidePatterns: [],
            paintMode: 'intervention_mw2',
            offset: [0, -0.010, -0.14],
            muzzleOffset: [0, 0.022, -0.66],
            sightY: 0.095,
            sightZ: -0.02,
            sightEyeRelief: 0.18
        },
        m9: {
            path: 'weapons/low-poly_beretta_m9.glb',
            targetLen: 0.25,
            rot: [0, 0, 0],
            hidePatterns: [],
            offset: [0, -0.056, 0.02],
            muzzleOffset: [0, 0.010, -0.11],
            sightY: 0.015,
            sightZ: 0.095,
            sightEyeRelief: 0.24,
            pistolTritium: true
        }
    };

    class WeaponMeshBuilder {
        _darkMat(hex = 0x16191f, rough = 0.48, metal = 0.76) {
            const T = BO.Textures;
            const map = T?.createGunmetalTexture ? T.createGunmetalTexture(hex) : null;
            const bumpMap = T?.createBumpTexture ? T.createBumpTexture('metal') : null;
            return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : hex, map, bumpMap, bumpScale: 0.008, roughness: rough, metalness: metal });
        }

        _materialFromProfile(style, hex, camoId, isPaP) {
            const T = BO.Textures;
            if (isPaP || (camoId && camoId !== 'default')) {
                return T.getCamoMaterial(camoId, hex, isPaP);
            }
            const bump = T?.createBumpTexture ? T.createBumpTexture(style === 'perforated' ? 'perforated' : 'metal') : null;
            let map = null;
            let rough = 0.42;
            let metal = 0.78;
            if (style === 'cerakote' && T?.createCerakoteTexture) {
                map = T.createCerakoteTexture(hex);
                rough = 0.62;
                metal = 0.34;
            } else if (style === 'brushed' && T?.createBrushedSteelTexture) {
                map = T.createBrushedSteelTexture(hex);
                rough = 0.24;
                metal = 0.90;
            } else if (style === 'perforated' && T?.createPerforatedMetalTexture) {
                map = T.createPerforatedMetalTexture(hex);
                rough = 0.44;
                metal = 0.78;
            } else if (style === 'gold') {
                return T.getCamoMaterial('gold', hex, false);
            } else if (T?.createGunmetalTexture) {
                map = T.createGunmetalTexture(hex);
            }
            return new THREE.MeshStandardMaterial({
                color: map ? 0xffffff : hex,
                map,
                bumpMap: bump,
                bumpScale: style === 'perforated' ? 0.014 : 0.007,
                roughness: rough,
                metalness: metal
            });
        }

        _accentMaterial(style, hex) {
            const T = BO.Textures;
            if (style === 'walnut') {
                const map = T?.createWalnutWoodTexture ? T.createWalnutWoodTexture(hex || 0x6e3f1d) : null;
                const bumpMap = T?.createBumpTexture ? T.createBumpTexture('wood') : null;
                return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : hex, map, bumpMap, bumpScale: 0.010, roughness: 0.60, metalness: 0.08 });
            }
            if (style === 'bakelite') {
                const map = T?.createBakeliteTexture ? T.createBakeliteTexture(hex || 0x9b3b1e) : null;
                const bumpMap = T?.createBumpTexture ? T.createBumpTexture('polymer') : null;
                return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : hex, map, bumpMap, bumpScale: 0.009, roughness: 0.48, metalness: 0.14 });
            }
            if (style === 'cerakote') {
                const map = T?.createCerakoteTexture ? T.createCerakoteTexture(hex || 0x5c5342) : null;
                return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : hex, map, roughness: 0.64, metalness: 0.28 });
            }
            const map = T?.createPolymerGripTexture ? T.createPolymerGripTexture() : null;
            const bumpMap = T?.createBumpTexture ? T.createBumpTexture('polymer') : null;
            return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : (hex || 0x141820), map, bumpMap, bumpScale: 0.010, roughness: 0.78, metalness: 0.18 });
        }

        _woodMat(hex = 0x6f4324) {
            return this._accentMaterial('walnut', hex);
        }

        _polymerMat() {
            return this._accentMaterial('polymer', 0x141820);
        }

        // Measure the finished receiver, rails, and decorative pieces in gun space.
        _mountSights(gun, ms, attachments, darkMat, steelMat, topY, recL, frontZ) {
            gun.updateWorldMatrix(true, true);
            const inverseGun = gun.matrixWorld.clone().invert();
            const transform = new THREE.Matrix4();
            const bounds = [];
            gun.traverseVisible((part) => {
                if (!part.isMesh || !part.geometry || part.userData.skipSightClearance) return;
                if (!part.geometry.boundingBox) part.geometry.computeBoundingBox();
                transform.multiplyMatrices(inverseGun, part.matrixWorld);
                bounds.push(part.geometry.boundingBox.clone().applyMatrix4(transform));
            });
            const surface = (z, depth) => {
                let y = -Infinity;
                for (const box of bounds) {
                    if (box.min.x > 0.006 || box.max.x < -0.006 || box.min.z > z + depth || box.max.z < z - depth) continue;
                    y = Math.max(y, box.max.y);
                }
                return y;
            };
            const iron = (attachments.optic || (ms.defaultScope ? 'sniper_scope' : 'iron')) === 'iron';
            const rearZ = iron ? recL * 0.34 : -0.02;
            const railY = Math.max(topY, surface(0, Infinity) + 0.004);
            const support = (z, width, depth) => {
                const base = Math.min(railY, Math.max(topY - 0.015, surface(z, depth * 0.5)));
                const rise = railY - base;
                if (rise < 0.003) return;
                const mount = new THREE.Mesh(new THREE.BoxGeometry(width, rise, depth), darkMat);
                mount.position.set(0, base + rise * 0.5, z);
                gun.add(mount);
            };
            if (iron) {
                support(rearZ, 0.024, 0.017);
                support(frontZ, 0.009, 0.013);
            } else {
                support(rearZ, 0.026, 0.047);
            }
            const sightY = this._attachOptic(gun, ms, attachments, darkMat, steelMat, railY, rearZ, frontZ);
            return { sightY, sightZ: rearZ, sightEyeRelief: ms.isPistol ? 0.23 : 0.18 };
        }

        buildWeapon(weaponId, attachments = {}, camoId = 'default', isPaP = false, withArms = false, isDualWield = false) {
            const spec = BO.WeaponsData.get(weaponId);
            const ms = spec.modelSpec;
            const profile = BO.ArsenalDetails?.getFirearmProfile ? BO.ArsenalDetails.getFirearmProfile(spec.id) : {};
            const root = new THREE.Group();
            const gun = new THREE.Group();
            root.add(gun);

            const effectiveCamo = (spec.isGoldFinish && (!camoId || camoId === 'default')) ? 'gold' : camoId;
            const bodyMat = this._materialFromProfile(profile.mat || 'gunmetal', profile.bodyHex || ms.primaryColor || 0x262c36, effectiveCamo, isPaP);
            const darkMat = this._darkMat(0x14171c, 0.46, 0.78);
            const accentMat = this._accentMaterial(profile.accMat || (ms.wood ? 'walnut' : 'polymer'), profile.accHex || ms.accentColor);
            const steelMat = this._darkMat(0x525e6e, 0.26, 0.92);

            const finishSpecial = (built, topY = 0.035, recL = 0.25) => {
                BO.ArsenalDetails.specialDetails(built, spec, isPaP);
                const frontZ = built.muzzleAnchor.position.z + 0.055;
                return Object.assign(built, this._mountSights(gun, ms, attachments, darkMat, steelMat, topY, recL, frontZ));
            };
            if (ms.isMelee) {
                return BO.ArsenalDetails.specialDetails(this._buildMeleeWeapon(root, gun, spec, camoId, isPaP, withArms), spec, isPaP);
            }
            if (ms.isMinigun) {
                return finishSpecial(this._buildMinigun(root, gun, spec, camoId, isPaP, withArms), 0.055, 0.34);
            }
            if (ms.wonderType === 'megabuster') {
                return BO.ArsenalDetails.specialDetails(this._buildMegaBuster(root, gun, spec, isPaP, withArms), spec, isPaP);
            }
            if (ms.wonderType === 'raygun') {
                return finishSpecial(this._buildRayGun(root, gun, spec, isPaP, withArms));
            }
            if (ms.wonderType === 'thundergun') {
                return finishSpecial(this._buildThundergun(root, gun, spec, isPaP, withArms));
            }
            if (ms.wonderType) {
                const built = this._buildMagicWeapon(root, gun, spec, isPaP, withArms);
                return ms.wonderType === 'tesla' ? finishSpecial(built) : BO.ArsenalDetails.specialDetails(built, spec, isPaP);
            }
            if (spec.id === 'rpg7_warhead') {
                return finishSpecial(this._buildLauncher(root, gun, accentMat, darkMat, steelMat, withArms), 0.02, 0.34);
            }
            if (spec.id === 'python_magnum') {
                return finishSpecial(this._buildRevolver(root, gun, bodyMat, darkMat, accentMat, steelMat, withArms), 0.04, 0.16);
            }
            if (spec.id === 'double_barrel') {
                return finishSpecial(this._buildDoubleBarrel(root, gun, bodyMat, darkMat, accentMat, steelMat, withArms), 0.027, 0.16);
            }

            const recH = ms.receiverH;
            const recW = ms.receiverW;
            const recL = ms.receiverLen;
            const topY = recH * 0.5;

            const receiver = new THREE.Mesh(new THREE.BoxGeometry(recW, recH, recL), bodyMat);
            gun.add(receiver);

            // Chamfered upper receiver spine & ejection-side contour
            const upperSpine = new THREE.Mesh(new THREE.BoxGeometry(recW * 0.82, recH * 0.22, recL * 0.94), bodyMat);
            upperSpine.position.set(0, topY - recH * 0.04, 0);
            gun.add(upperSpine);

            // Pistol / SMG slide machining serrations (tactile close-up viewmodel detail)
            if (ms.isPistol || recL <= 0.28) {
                const serCount = 5;
                for (let s = 0; s < serCount; s++) {
                    const sz = recL * 0.24 + s * 0.0085;
                    const sMesh = new THREE.Mesh(new THREE.BoxGeometry(recW * 1.04, recH * 0.56, 0.0032), darkMat);
                    sMesh.position.set(0, recH * 0.08, sz);
                    gun.add(sMesh);
                }
            }

            // Top Picatinny rail + milled cross-slots
            const railLen = recL * 0.86;
            const rail = new THREE.Mesh(new THREE.BoxGeometry(recW * 0.50, 0.007, railLen), darkMat);
            rail.position.set(0, topY + 0.0045, -recL * 0.02);
            gun.add(rail);
            const lugCount = Math.max(4, Math.min(10, Math.round(railLen / 0.022)));
            const lugGeo = new THREE.BoxGeometry(recW * 0.56, 0.0035, 0.0065);
            for (let i = 0; i < lugCount; i++) {
                const t = (i + 0.5) / lugCount - 0.5;
                const lug = new THREE.Mesh(lugGeo, steelMat);
                lug.position.set(0, topY + 0.009, -recL * 0.02 + t * railLen * 0.90);
                gun.add(lug);
            }

            // Ergonomic contoured pistol grip (curved palm-swell capsule + textured baseplate)
            const gripZ = profile.mag === 'stanag_rear' || profile.mag === 'waffle_rear' ? -recL * 0.04 : (ms.isPistol ? recL * 0.24 : recL * 0.28);
            const gripGroup = new THREE.Group();
            gripGroup.position.set(0, -recH * 0.5 - 0.038, gripZ);
            gripGroup.rotation.x = 0.28;
            const gripCoreGeo = new THREE.CapsuleGeometry(recW * 0.34, 0.064, 6, 12);
            gripCoreGeo.scale(0.86, 1.0, 1.24);
            const gripCore = new THREE.Mesh(gripCoreGeo, accentMat);
            const gripBackstrap = new THREE.Mesh(new THREE.CapsuleGeometry(recW * 0.26, 0.056, 5, 10), darkMat);
            gripBackstrap.position.set(0, 0.003, 0.009);
            const gripBase = new THREE.Mesh(new THREE.CylinderGeometry(recW * 0.36, recW * 0.39, 0.009, 12), steelMat);
            gripBase.scale.set(0.88, 1.0, 1.26);
            gripBase.position.set(0, -0.044, 0);
            gripGroup.add(gripCore, gripBackstrap, gripBase);
            gun.add(gripGroup);

            // Curved trigger guard loop + contoured trigger shoe
            const trigZ = gripZ - (ms.isPistol ? 0.04 : 0.14);
            const trigLoopGeo = new THREE.TorusGeometry(0.017, 0.0038, 6, 14, Math.PI * 1.15);
            trigLoopGeo.rotateY(Math.PI * 0.5);
            trigLoopGeo.rotateX(Math.PI * 0.92);
            const trigGuard = new THREE.Mesh(trigLoopGeo, darkMat);
            trigGuard.position.set(0, -recH * 0.5 - 0.006, trigZ);
            gun.add(trigGuard);

            // Bolt / Charging Handle
            const boltGroup = new THREE.Group();
            const boltCarrier = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.046, 10), steelMat);
            boltCarrier.rotation.x = Math.PI * 0.5;
            boltCarrier.position.set(recW * 0.50, topY * 0.34, -0.02);
            const boltKnob = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.010, 4, 8), darkMat);
            boltKnob.rotation.z = Math.PI * 0.5;
            boltKnob.position.set(recW * 0.55, topY * 0.34, -0.005);
            boltGroup.add(boltCarrier, boltKnob);
            gun.add(boltGroup);

            const ejPort = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.018, 0.044), new THREE.MeshStandardMaterial({ color: 0x090c12, roughness: 0.7 }));
            ejPort.position.set(recW * 0.505, topY * 0.25, -0.02);
            const trigBlade = new THREE.Mesh(new THREE.CapsuleGeometry(0.0026, 0.015, 4, 8), steelMat);
            trigBlade.position.set(0, -recH * 0.5 - 0.010, trigZ + 0.002);
            trigBlade.rotation.x = 0.32;
            gun.add(ejPort, trigBlade);

            // Handguard (unless replaced by bespoke sculptural forend in profile)
            const hgLen = ms.handguardLen || 0;
            if (hgLen > 0 && !profile.suppressHandguard) {
                const hgZ = -recL * 0.5 - hgLen * 0.5 + 0.01;
                const hgMat = (profile.accMat === 'walnut' || profile.accMat === 'bakelite' || ms.wood) ? accentMat : bodyMat;
                const hg = new THREE.Mesh(new THREE.BoxGeometry(ms.handguardW, ms.handguardH, hgLen), hgMat);
                hg.position.set(0, 0.004, hgZ);
                const hgRail = new THREE.Mesh(new THREE.BoxGeometry(ms.handguardW * 0.55, 0.007, hgLen * 0.92), darkMat);
                hgRail.position.set(0, ms.handguardH * 0.5 + 0.006, hgZ);
                const sideRailL = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.010, hgLen * 0.75), steelMat);
                sideRailL.position.set(-ms.handguardW * 0.51, 0.004, hgZ);
                const sideRailR = sideRailL.clone(); sideRailR.position.x = ms.handguardW * 0.51;
                gun.add(hg, hgRail, sideRailL, sideRailR);
            }

            // Barrel
            const ub = attachments.underbarrel || 'none';
            let barrelLen = ms.barrelLen;
            if (ub === 'heavy_barrel') barrelLen *= 1.24;
            if (ub === 'short_barrel') barrelLen *= 0.72;

            const barrelStartZ = ms.isPistol ? -recL * 0.5 : (-recL * 0.5 - hgLen * 0.82);
            const barrelGeo = new THREE.CylinderGeometry(ms.barrelR, ms.barrelR * 1.08, barrelLen, 12);
            barrelGeo.rotateX(Math.PI * 0.5);
            const barrel = new THREE.Mesh(barrelGeo, steelMat);
            const barrelY = profile.arch === 'vector_v' ? -topY * 0.15 : topY * 0.22;
            barrel.position.set(0, barrelY, barrelStartZ - barrelLen * 0.5);
            gun.add(barrel);

            if (!ms.isPistol && hgLen > 0.05 && !profile.suppressGas) {
                const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, barrelLen * 0.55, 8), darkMat);
                gasTube.rotation.x = Math.PI * 0.5;
                gasTube.position.set(0, topY * 0.72, barrelStartZ - barrelLen * 0.28);
                const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.028, 0.022), darkMat);
                gasBlock.position.set(0, topY * 0.62, barrelStartZ - barrelLen * 0.56);
                gun.add(gasTube, gasBlock);
            }
            if (ms.isPistol) {
                for (let sr = 0; sr < 4; sr++) {
                    const rib = new THREE.Mesh(new THREE.BoxGeometry(recW + 0.004, recH * 0.55, 0.004), darkMat);
                    rib.position.set(0, topY * 0.15, recL * 0.22 + sr * 0.011);
                    gun.add(rib);
                }
                const hammer = new THREE.Mesh(new THREE.BoxGeometry(recW * 0.38, 0.016, 0.010), steelMat);
                hammer.position.set(0, topY * 0.55, recL * 0.5 + 0.004);
                hammer.rotation.x = -0.35;
                const beaver = new THREE.Mesh(new THREE.BoxGeometry(recW * 0.70, 0.008, 0.020), accentMat);
                beaver.position.set(0, -recH * 0.5 - 0.004, recL * 0.40);
                gun.add(hammer, beaver);
            } else {
                if (!profile.suppressMagwell) {
                    const magwell = new THREE.Mesh(new THREE.BoxGeometry(recW * 1.06, 0.020, (ms.magL || 0.04) * 1.35), bodyMat);
                    magwell.position.set(0, -recH * 0.5 - 0.008, -0.02);
                    gun.add(magwell);
                }
                const dustCover = new THREE.Mesh(new THREE.BoxGeometry(0.003, recH * 0.36, recL * 0.30), darkMat);
                dustCover.position.set(recW * 0.505, topY * 0.05, -recL * 0.05);
                gun.add(dustCover);
                for (const pz of [recL * 0.30, -recL * 0.32]) {
                    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, recW + 0.004, 6), steelMat);
                    pin.rotation.z = Math.PI * 0.5;
                    pin.position.set(0, -recH * 0.28, pz);
                    gun.add(pin);
                }
            }

            let muzzleZ = barrelStartZ - barrelLen;
            if (ms.tubeMag) {
                const tubeGeo = new THREE.CylinderGeometry(ms.barrelR * 0.92, ms.barrelR * 0.92, barrelLen * 0.88, 10);
                tubeGeo.rotateX(Math.PI * 0.5);
                const tube = new THREE.Mesh(tubeGeo, darkMat);
                tube.position.set(0, -0.010, barrelStartZ - barrelLen * 0.44);
                gun.add(tube);
            }

            // Muzzle Attachments
            const muz = attachments.muzzle || 'none';
            if (muz === 'suppressor' || muz === 'aether_suppressor') {
                const isAether = muz === 'aether_suppressor';
                const supGeo = new THREE.CylinderGeometry(0.020, 0.020, isAether ? 0.165 : 0.145, 14);
                supGeo.rotateX(Math.PI * 0.5);
                const sup = new THREE.Mesh(supGeo, darkMat);
                sup.position.set(0, barrelY, muzzleZ - (isAether ? 0.080 : 0.070));
                gun.add(sup);
                if (isAether) {
                    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.003, 6, 14), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
                    glowRing.position.set(0, barrelY, muzzleZ - 0.12);
                    gun.add(glowRing);
                }
                muzzleZ -= isAether ? 0.162 : 0.142;
            } else if (muz === 'compensator' || muz === 'overpressure_comp') {
                const isOp = muz === 'overpressure_comp';
                const comp = new THREE.Mesh(new THREE.BoxGeometry(isOp ? 0.032 : 0.026, isOp ? 0.030 : 0.026, isOp ? 0.064 : 0.052), steelMat);
                comp.position.set(0, barrelY, muzzleZ - 0.028);
                gun.add(comp);
                if (isOp) {
                    const opBand = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.008, 0.018), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
                    opBand.position.set(0, barrelY, muzzleZ - 0.032);
                    gun.add(opBand);
                }
                muzzleZ -= isOp ? 0.062 : 0.05;
            } else if (muz === 'muzzle_brake' || muz === 'titanium_brake') {
                const mb = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.024, 0.052), steelMat);
                mb.position.set(0, barrelY, muzzleZ - 0.024);
                gun.add(mb);
                muzzleZ -= 0.050;
            } else {
                const fh = new THREE.Mesh(new THREE.CylinderGeometry(ms.barrelR * 1.25, ms.barrelR * 1.15, 0.028, 10), darkMat);
                fh.rotation.x = Math.PI * 0.5;
                fh.position.set(0, barrelY, muzzleZ - 0.014);
                gun.add(fh);
                muzzleZ -= 0.028;
            }

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, barrelY, muzzleZ);
            gun.add(muzzleAnchor);

            // Standard Stock (when not uniquely built in ArsenalDetails)
            const stockType = attachments.stock || 'std_stock';
            const customStocks = new Set(['scar_boot', 'acr_folder', 'l96_thumb', 'svd_thumb', 'ebr_rod', 'm200_skel', 'krink_tri', 'galil_folder', 'mg42_teardrop', 'thompson_wood', 'wood_ak', 'mcmillan', 'r700_sport']);
            if (ms.stockStyle !== 'none' && stockType !== 'no_stock' && !customStocks.has(profile.stock)) {
                const sLen = ms.stockLen * (stockType === 'precision_stock' ? 1.12 : 1.0);
                const stockMat = (ms.wood && stockType !== 'precision_stock') ? accentMat : darkMat;
                if (ms.stockStyle === 'wire' || ms.stockStyle === 'sniper_skeleton' || profile.stock === 'mp5_wire' || profile.stock === 'mac_wire' || profile.stock === 'g36_skel') {
                    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, sLen), steelMat);
                    topBar.position.set(0, 0.010, recL * 0.5 + sLen * 0.5);
                    const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.012, sLen), steelMat);
                    botBar.position.set(0, -0.032, recL * 0.5 + sLen * 0.5);
                    botBar.rotation.x = -0.16;
                    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.086, 0.020), darkMat);
                    pad.position.set(0, -0.012, recL * 0.5 + sLen);
                    gun.add(topBar, botBar, pad);
                } else {
                    const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.068, sLen), stockMat);
                    sBody.position.set(0, -0.012, recL * 0.5 + sLen * 0.5);
                    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.014, sLen * 0.55), stockMat);
                    cheek.position.set(0, 0.028, recL * 0.5 + sLen * 0.62);
                    const buttPad = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.074, 0.012), new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.95 }));
                    buttPad.position.set(0, -0.012, recL * 0.5 + sLen + 0.006);
                    gun.add(sBody, cheek, buttPad);
                }
            }

            // Magazine group (curved banana mags, canted AN-94, coupled G36, brass-belt LMG boxes, helical Bizon, etc.)
            const magGroup = this._buildMagazineGroup(spec, profile, attachments, darkMat, accentMat, steelMat, recH, recL);
            gun.add(magGroup);

            // Underbarrel Foregrip / Laser
            let laserBeam = null;
            if (ub === 'foregrip' && hgLen > 0) {
                const fg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.088, 10), darkMat);
                fg.position.set(0, -ms.handguardH * 0.5 - 0.042, -recL * 0.5 - hgLen * 0.45);
                gun.add(fg);
            } else if (ub === 'laser') {
                const lBox = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.020, 0.065), darkMat);
                const lz = hgLen > 0 ? (-recL * 0.5 - hgLen * 0.55) : (-recL * 0.28);
                const lx = recW * 0.5 + 0.012;
                lBox.position.set(lx, 0.002, lz);
                gun.add(lBox);
                const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
                emitter.position.set(lx, 0.002, lz - 0.034);
                gun.add(emitter);
                const beamGeo = new THREE.CylinderGeometry(0.0012, 0.0012, 6.0, 6);
                beamGeo.rotateX(Math.PI * 0.5);
                laserBeam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.38 }));
                laserBeam.position.set(lx, 0.002, lz - 3.03);
                gun.add(laserBeam);
            }

            if (laserBeam) laserBeam.userData.skipSightClearance = true;
            BO.ArsenalDetails.firearmDetails(gun, spec, attachments, isPaP || (effectiveCamo && effectiveCamo !== 'default'));
            const frontZ = ms.isPistol ? -recL * 0.44 : -recL * 0.5 - Math.max(hgLen, 0.08) * 0.85;
            const sight = this._mountSights(gun, ms, attachments, darkMat, steelMat, topY, recL, frontZ);
            if (withArms) this._attachFirstPersonArms(root, ms.isPistol);

            if (isDualWield) {
                const leftGun = gun.clone();
                leftGun.position.set(withArms ? -0.36 : -0.16, 0, 0.02);
                if (!withArms) gun.position.x = 0.16;
                root.add(leftGun);
            }

            const built = { root, gun, magGroup, boltGroup, muzzleAnchor, laserBeam, ...sight };
            if (GLB_WEAPONS[spec.id] && BO.Assets && typeof BO.Assets.loadGLB === 'function') {
                built.readyPromise = this._attachGLBWeapon(built, spec, GLB_WEAPONS[spec.id], effectiveCamo, isPaP);
            }
            return built;
        }

        _computeVisibleBounds(container) {
            container.updateMatrixWorld(true);
            const box = new THREE.Box3();
            const v = new THREE.Vector3();
            const partBox = new THREE.Box3();
            container.traverse((o) => {
                if (!o.visible || !o.isMesh || !o.geometry) return;
                // Skip if any ancestor inside container is hidden
                let cur = o.parent;
                while (cur && cur !== container) {
                    if (!cur.visible) return;
                    cur = cur.parent;
                }
                const pos = o.geometry.attributes && o.geometry.attributes.position;
                if (o.isSkinnedMesh && typeof o.boneTransform === 'function' && pos) {
                    if (o.skeleton) o.skeleton.update();
                    const step = Math.max(1, Math.floor(pos.count / 1000));
                    for (let i = 0; i < pos.count; i += step) {
                        v.fromBufferAttribute(pos, i);
                        o.boneTransform(i, v);
                        v.applyMatrix4(o.matrixWorld);
                        box.expandByPoint(v);
                    }
                } else {
                    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
                    if (o.geometry.boundingBox) {
                        partBox.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
                        box.union(partBox);
                    }
                }
            });
            return box;
        }

        _attachGLBWeapon(built, spec, cfg, camoId, isPaP) {
            return BO.Assets.loadGLB(cfg.path).then((sc) => {
                // Hide unwanted showcase extras (e.g. loose cartridges beside the Barrett M82)
                if (cfg.hidePatterns && cfg.hidePatterns.length) {
                    sc.traverse((o) => {
                        const nm = o.name || '';
                        for (const pat of cfg.hidePatterns) {
                            if (nm.includes(pat)) {
                                o.visible = false;
                                break;
                            }
                        }
                    });
                }

                // Update world matrices on the unrotated GLB so world-space vertex positions are accurate for UVs & part painting
                sc.updateMatrixWorld(true);
                const tmpV = new THREE.Vector3();
                const tmpN = new THREE.Vector3();
                const normMat = new THREE.Matrix3();
                const tmpCol = new THREE.Color();

                // Apply camo, Pack-a-Punch, or custom PBR paint on cloned materials (never mutate shared cache)
                const applyCamo = isPaP || (camoId && camoId !== 'default');
                const camoMat = applyCamo && BO.Textures?.getCamoMaterial
                    ? BO.Textures.getCamoMaterial(camoId, spec.modelSpec?.primaryColor || 0x262c36, isPaP)
                    : null;

                sc.traverse((o) => {
                    if (!o.isMesh) return;
                    o.castShadow = true;
                    o.receiveShadow = true;
                    if (o.isSkinnedMesh) o.frustumCulled = false;

                    // Ensure box-projected UVs in world meters so PBR textures and camos wrap cleanly without tiling artifacts
                    if (o.geometry && o.geometry.attributes && o.geometry.attributes.position && !o.geometry.attributes.uv) {
                        const posAttr = o.geometry.attributes.position;
                        const normAttr = o.geometry.attributes.normal;
                        const uvs = new Float32Array(posAttr.count * 2);
                        normMat.getNormalMatrix(o.matrixWorld);
                        for (let i = 0; i < posAttr.count; i++) {
                            tmpV.fromBufferAttribute(posAttr, i).applyMatrix4(o.matrixWorld);
                            if (normAttr) tmpN.fromBufferAttribute(normAttr, i).applyMatrix3(normMat).normalize();
                            else tmpN.set(0, 0, 1);
                            const ax = Math.abs(tmpN.x), ay = Math.abs(tmpN.y), az = Math.abs(tmpN.z);
                            if (ax >= ay && ax >= az) {
                                uvs[i * 2] = tmpV.z * 2.5; uvs[i * 2 + 1] = tmpV.y * 2.5;
                            } else if (ay >= ax && ay >= az) {
                                uvs[i * 2] = tmpV.x * 2.5; uvs[i * 2 + 1] = tmpV.z * 2.5;
                            } else {
                                uvs[i * 2] = tmpV.x * 2.5; uvs[i * 2 + 1] = tmpV.y * 2.5;
                            }
                        }
                        o.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                    }

                    if (camoMat && o.material) {
                        const mats = Array.isArray(o.material) ? o.material : [o.material];
                        const nextMats = mats.map((m) => {
                            if (!m || typeof m.clone !== 'function') return m;
                            const cm = m.clone();
                            cm.vertexColors = false;
                            if (isPaP) {
                                cm.emissive = new THREE.Color(0x9333ea);
                                cm.emissiveIntensity = 0.42;
                                if (camoMat.map) {
                                    cm.map = camoMat.map;
                                    cm.color = new THREE.Color(0xffffff);
                                }
                            } else if (camoMat.map) {
                                cm.map = camoMat.map;
                                cm.color = new THREE.Color(0xffffff);
                            } else if (camoMat.color) {
                                cm.color = camoMat.color.clone();
                            }
                            cm.needsUpdate = true;
                            return cm;
                        });
                        o.material = Array.isArray(o.material) ? nextMats : nextMats[0];
                    } else if (cfg.paintMode === 'intervention_mw2' && o.geometry && o.geometry.attributes && o.geometry.attributes.position) {
                        // Two-tone MW2 CheyTac M200 finish using true world-space coordinates (X = -0.54..+0.54, Y = -0.12..+0.174)
                        const posAttr = o.geometry.attributes.position;
                        const colors = new Float32Array(posAttr.count * 3);
                        const isGripMesh = (o.name || '').includes('001');
                        for (let i = 0; i < posAttr.count; i++) {
                            tmpV.fromBufferAttribute(posAttr, i).applyMatrix4(o.matrixWorld);
                            const wx = tmpV.x, wy = tmpV.y;
                            let hex = 0x9c8864; // Iconic MW2 Desert Tan / FDE chassis, handguard & skeleton stock
                            if (isGripMesh) {
                                hex = 0x1c2026; // Matte black polymer pistol grip
                            } else if (wy > 0.066 && wx > -0.34 && wx < 0.14) {
                                hex = 0x1a1e24; // Anodized matte black sniper scope & rings
                            } else if (wx > 0.08 && wy < 0.010) {
                                hex = 0x1d222a; // Black steel deployed bipod
                            } else if (wx > 0.215) {
                                hex = 0x2b313b; // Dark blued fluted barrel & muzzle brake
                            } else if (wx < -0.495) {
                                hex = 0x181b20; // Rubberized buttpad
                            } else if (wx > -0.265 && wx < -0.095 && wy < -0.015) {
                                hex = 0x222730; // Dark charcoal 5-round box magazine
                            }
                            tmpCol.setHex(hex);
                            if (typeof tmpCol.convertSRGBToLinear === 'function') tmpCol.convertSRGBToLinear();
                            colors[i * 3] = tmpCol.r;
                            colors[i * 3 + 1] = tmpCol.g;
                            colors[i * 3 + 2] = tmpCol.b;
                        }
                        o.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                        o.material = new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            vertexColors: true,
                            roughness: 0.44,
                            metalness: 0.42,
                            side: THREE.DoubleSide
                        });
                    }
                });

                const wrap = new THREE.Group();
                wrap.name = 'glb_weapon_' + spec.id;
                if (cfg.rot) sc.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
                wrap.add(sc);

                // Normalize scale & center using true (including skinned) bounds
                let box = this._computeVisibleBounds(wrap);
                if (!box.isEmpty()) {
                    const sz = new THREE.Vector3();
                    box.getSize(sz);
                    const curLen = Math.max(sz.z, 1e-4);
                    const scale = cfg.targetLen / curLen;
                    sc.scale.multiplyScalar(scale);
                    box = this._computeVisibleBounds(wrap);
                    const ctr = new THREE.Vector3();
                    box.getCenter(ctr);
                    sc.position.x -= ctr.x;
                    sc.position.y -= ctr.y;
                    sc.position.z -= ctr.z;
                    box = this._computeVisibleBounds(wrap);
                }

                if (cfg.offset) {
                    wrap.position.set(cfg.offset[0], cfg.offset[1], cfg.offset[2]);
                }

                // Hide procedural fallback geometry while keeping anchors & laser beam
                for (const child of built.gun.children) {
                    if (child === built.muzzleAnchor || child === built.laserBeam) continue;
                    child.visible = false;
                }
                built.gun.add(wrap);
                built.glbWrap = wrap;

                // Place muzzle anchor at the barrel tip
                if (cfg.muzzleOffset) {
                    built.muzzleAnchor.position.set(cfg.muzzleOffset[0], cfg.muzzleOffset[1], cfg.muzzleOffset[2]);
                } else if (!box.isEmpty()) {
                    built.muzzleAnchor.position.set(0, (cfg.offset ? cfg.offset[1] : 0) + 0.02, box.min.z + (cfg.offset ? cfg.offset[2] : 0));
                }

                if (cfg.pistolTritium) {
                    const tritMat = new THREE.MeshBasicMaterial({ color: 0x22ff66, toneMapped: false });
                    const dotGeo = new THREE.SphereGeometry(0.0014, 8, 8);
                    const rearL = new THREE.Mesh(dotGeo, tritMat);
                    rearL.position.set(-0.0046, 0.0205, cfg.sightZ + 0.003);
                    const rearR = rearL.clone();
                    rearR.position.x = 0.0046;
                    const frontDot = new THREE.Mesh(new THREE.SphereGeometry(0.0016, 8, 8), tritMat);
                    frontDot.position.set(0, 0.0212, -0.098);
                    built.gun.add(rearL, rearR, frontDot);

                    // Seat first-person hands cleanly around the upper pistol grip below the beavertail
                    const arms = built.root?.userData?.arms;
                    if (arms) {
                        if (arms.rArm) arms.rArm.position.set(0.0, 0.004, 0.004);
                        if (arms.lArm) arms.lArm.position.set(0.0, 0.004, 0.004);
                    }
                }

                if (cfg.sightY !== undefined) built.sightY = cfg.sightY;
                if (cfg.sightZ !== undefined) built.sightZ = cfg.sightZ;
                if (cfg.sightEyeRelief !== undefined) built.sightEyeRelief = cfg.sightEyeRelief;

                return built;
            }).catch((err) => {
                console.warn('[BO.WeaponMesh] Falling back to procedural mesh for', spec.id, err);
                return built;
            });
        }

        _buildMagazineGroup(spec, profile, attachments, darkMat, accentMat, steelMat, recH, recL) {
            const ms = spec.modelSpec;
            const magGroup = new THREE.Group();
            const magChoice = attachments.magazine || 'std_mag';
            const magScaleH = magChoice === 'ext_mags' ? 1.32 : (magChoice === 'fast_mags' ? 1.08 : 1.0);
            const mType = profile.mag || 'stanag';

            if (mType === 'p90_top' || ms.topMag) {
                const pMag = new THREE.Mesh(new THREE.BoxGeometry(ms.magW, ms.magH, ms.magL), darkMat);
                pMag.position.set(0, recH * 0.5 + ms.magH * 0.45, -0.04);
                magGroup.add(pMag);
            } else if (mType === 'drum_20' || mType === 'drum_belt' || ms.drumMag || magChoice === 'drum_mag') {
                const drumGeo = new THREE.CylinderGeometry(0.062, 0.062, 0.048, 16);
                drumGeo.rotateX(Math.PI * 0.5);
                const drum = new THREE.Mesh(drumGeo, mType === 'drum_belt' ? accentMat : darkMat);
                drum.position.set(mType === 'drum_belt' ? -0.022 : 0, -recH * 0.5 - 0.048, -0.03);
                magGroup.add(drum);
            } else if (mType === 'box_belt' || ms.boxMag) {
                const beltMap = BO.Textures?.createBrassBeltTexture ? BO.Textures.createBrassBeltTexture() : null;
                const boxM = new THREE.Mesh(new THREE.BoxGeometry(ms.magW * 1.15, ms.magH * 0.95, ms.magL * 1.15), accentMat);
                boxM.position.set(-0.024, -recH * 0.5 - ms.magH * 0.48, -0.03);
                magGroup.add(boxM);
                if (beltMap) {
                    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.034, 0.055), new THREE.MeshStandardMaterial({ map: beltMap, roughness: 0.35, metalness: 0.72 }));
                    belt.position.set(-0.035, -0.004, -0.03);
                    belt.rotation.z = 0.55;
                    magGroup.add(belt);
                }
            } else if (mType === 'banana_steel' || mType === 'bakelite_curved' || mType === 'canted_bakelite' || mType === 'mp5_curved' || mType === 'galil_35') {
                const isBake = mType === 'bakelite_curved' || mType === 'canted_bakelite';
                const bakeMat = isBake ? this._accentMaterial('bakelite', mType === 'canted_bakelite' ? 0x7c2d23 : 0xb0481e) : darkMat;
                const segH = (ms.magH * magScaleH) * 0.36;
                const magHolder = new THREE.Group();
                magHolder.position.set(mType === 'canted_bakelite' ? 0.018 : 0, -recH * 0.5, -0.02);
                if (mType === 'canted_bakelite') magHolder.rotation.z = 0.24; // Iconic AN-94 15-degree cant!
                for (let s = 0; s < 3; s++) {
                    const seg = new THREE.Mesh(new THREE.BoxGeometry(ms.magW, segH * 1.06, ms.magL * 0.94), bakeMat);
                    seg.position.set(0, -segH * (s + 0.45), -s * s * 0.011);
                    seg.rotation.x = -(0.12 + s * 0.16);
                    magHolder.add(seg);
                }
                magGroup.add(magHolder);
            } else if (mType === 'coupled_clear') {
                const m1 = new THREE.Mesh(new THREE.BoxGeometry(ms.magW, ms.magH * magScaleH, ms.magL), darkMat);
                m1.position.set(-0.015, -recH * 0.5 - (ms.magH * magScaleH) * 0.44, -0.02);
                const m2 = m1.clone();
                m2.position.x = 0.016;
                const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.024, ms.magL * 1.04), steelMat);
                clamp.position.set(0, -recH * 0.5 - 0.06, -0.02);
                magGroup.add(m1, m2, clamp);
            } else if (!ms.tubeMag && mType !== 'tube_shell' && mType !== 'flush_bolt' && mType !== 'bizon_cylinder' && mType !== 'striker_cyl' && mType !== 'grip_mag') {
                const isRear = mType === 'stanag_rear' || mType === 'waffle_rear';
                const mH = ms.magH * magScaleH;
                const mZ = ms.isPistol ? (recL * 0.24) : (isRear ? recL * 0.34 : -0.02);
                const magMat = mType === 'pmag_tan' ? this._accentMaterial('cerakote', 0x8b7b5d) : (mType === 'waffle_rear' ? this._accentMaterial('cerakote', 0x4b583f) : darkMat);
                const mMesh = new THREE.Mesh(new THREE.BoxGeometry(ms.magW, mH, ms.magL), magMat);
                mMesh.position.set(0, -recH * 0.5 - mH * 0.44, mZ);
                mMesh.rotation.x = ms.isPistol ? 0.28 : (mType === 'vector_canted' ? 0.24 : -(ms.magCurve || 0.04) * 2.8);
                const basePlate = new THREE.Mesh(new THREE.BoxGeometry(ms.magW * 1.14, 0.008, ms.magL * 1.10), steelMat);
                basePlate.position.set(0, -mH * 0.5 - 0.003, 0);
                mMesh.add(basePlate);
                magGroup.add(mMesh);
                if (magChoice === 'fast_mags') {
                    const pullTab = new THREE.Mesh(new THREE.BoxGeometry(ms.magW * 1.15, 0.016, ms.magL * 1.05), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 }));
                    pullTab.position.set(0, -recH * 0.5 - mH * 0.88, mZ);
                    magGroup.add(pullTab);
                }
            }
            return magGroup;
        }

        _attachOptic(gun, ms, attachments, darkMat, steelMat, topY, rearZ, frontZ) {
            const optic = attachments.optic || (ms.defaultScope ? 'sniper_scope' : 'iron');
            let sightY = topY + 0.022;
            const reticleMat = new THREE.MeshBasicMaterial({ color: 0xff3030, toneMapped: false, side: THREE.DoubleSide });
            const glassMat = (hex, op) => new THREE.MeshStandardMaterial({
                color: hex, roughness: 0.06, metalness: 0.28, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide
            });

            if (optic === 'iron') {
                const rearBase = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.008, 0.018), darkMat);
                rearBase.position.set(0, topY + 0.007, rearZ);
                const rearL = new THREE.Mesh(new THREE.BoxGeometry(0.0055, 0.019, 0.014), darkMat);
                rearL.position.set(-0.009, topY + 0.017, rearZ);
                const rearR = rearL.clone();
                rearR.position.x = 0.009;
                const tritiumMat = new THREE.MeshBasicMaterial({ color: 0x9aefad, toneMapped: false });
                const rearDotL = new THREE.Mesh(new THREE.SphereGeometry(0.0014, 8, 8), tritiumMat);
                rearDotL.position.set(-0.009, topY + 0.022, rearZ + 0.0075);
                const rearDotR = rearDotL.clone();
                rearDotR.position.x = 0.009;

                sightY = topY + 0.023;
                const frontPost = new THREE.Mesh(new THREE.BoxGeometry(0.0045, 0.018, 0.010), darkMat);
                frontPost.position.set(0, topY + 0.010, frontZ);
                if (!ms.isPistol) {
                    const hood = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0022, 6, 14, Math.PI * 1.08), darkMat);
                    hood.rotation.z = Math.PI * 0.95;
                    hood.position.set(0, sightY, frontZ);
                    gun.add(hood);
                }
                const bead = new THREE.Mesh(new THREE.SphereGeometry(0.0020, 8, 8), tritiumMat);
                bead.position.set(0, sightY, frontZ + 0.004);
                bead.userData.aimMarker = true;
                gun.add(rearBase, rearL, rearR, rearDotL, rearDotR, frontPost, bead);
            } else if (optic === 'reflex') {
                const base = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.011, 0.056), darkMat);
                base.position.set(0, topY + 0.010, -0.02);
                const lockNut = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.008, 10), steelMat);
                lockNut.rotation.z = Math.PI * 0.5;
                lockNut.position.set(-0.018, topY + 0.010, -0.02);
                const shroudGeo = new THREE.TorusGeometry(0.014, 0.0032, 8, 18, Math.PI * 1.15);
                const shroud = new THREE.Mesh(shroudGeo, darkMat);
                shroud.rotation.z = -Math.PI * 0.075;
                shroud.position.set(0, topY + 0.025, -0.02);
                const lens = new THREE.Mesh(new THREE.CircleGeometry(0.0125, 18), glassMat(0x38bdf8, 0.22));
                lens.position.set(0, topY + 0.026, -0.02);
                const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0019, 8, 8), reticleMat);
                dot.position.set(0, topY + 0.026, -0.02);
                dot.userData.aimMarker = true;
                gun.add(base, lockNut, shroud, lens, dot);
                sightY = topY + 0.026;
            } else if (optic === 'holo') {
                const base = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.013, 0.072), darkMat);
                base.position.set(0, topY + 0.0105, -0.02);
                const qdLever = new THREE.Mesh(new THREE.CapsuleGeometry(0.0035, 0.016, 4, 8), steelMat);
                qdLever.rotation.x = Math.PI * 0.5;
                qdLever.position.set(-0.021, topY + 0.0105, -0.015);
                const hood = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.0055, 0.046), darkMat);
                hood.position.set(0, topY + 0.048, -0.02);
                const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.036, 0.044), darkMat);
                sideL.position.set(-0.017, topY + 0.031, -0.02);
                const sideR = sideL.clone(); sideR.position.x = 0.017;
                const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.028, 0.028), glassMat(0x22d3ee, 0.16));
                lens.position.set(0, topY + 0.031, -0.02);
                const ring = new THREE.Mesh(new THREE.RingGeometry(0.0054, 0.0068, 22), reticleMat);
                ring.position.set(0, topY + 0.031, -0.019);
                const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0016, 8, 8), reticleMat);
                dot.position.set(0, topY + 0.031, -0.019);
                dot.userData.aimMarker = true;
                gun.add(base, qdLever, hood, sideL, sideR, lens, ring, dot);
                sightY = topY + 0.031;
            } else {
                const isSniper = (optic === 'sniper_scope' || optic === 'var_zoom_20x');
                const len = isSniper ? 0.22 : 0.115;
                const rad = isSniper ? 0.022 : 0.019;
                const scopeMat = new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.36, metalness: 0.82, side: THREE.DoubleSide });
                const tubeGeo = new THREE.CylinderGeometry(rad * 0.84, rad * 0.84, len * 0.64, 18, 1, true);
                tubeGeo.rotateX(Math.PI * 0.5);
                const scopeTube = new THREE.Mesh(tubeGeo, scopeMat);
                scopeTube.position.set(0, topY + 0.032, -0.02);

                // Stepped objective & ocular bells
                const objBellGeo = new THREE.CylinderGeometry(rad * 1.18, rad * 0.86, len * 0.24, 18, 1, true);
                objBellGeo.rotateX(Math.PI * 0.5);
                const objBell = new THREE.Mesh(objBellGeo, scopeMat);
                objBell.position.set(0, topY + 0.032, -0.02 - len * 0.38);

                const ocBellGeo = new THREE.CylinderGeometry(rad * 0.86, rad * 1.04, len * 0.20, 18, 1, true);
                ocBellGeo.rotateX(Math.PI * 0.5);
                const ocBell = new THREE.Mesh(ocBellGeo, scopeMat);
                ocBell.position.set(0, topY + 0.032, -0.02 + len * 0.38);

                // Elevation & windage adjustment turrets
                const topTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.009, 0.012, 12), steelMat);
                topTurret.position.set(0, topY + 0.032 + rad * 0.95, -0.02);
                const sideTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.008, 0.011, 12), steelMat);
                sideTurret.rotation.z = Math.PI * 0.5;
                sideTurret.position.set(rad * 0.95, topY + 0.032, -0.02);

                // Twin machined ring mounts
                const ringGeo = new THREE.TorusGeometry(rad * 0.90, 0.0042, 8, 18);
                const rMount1 = new THREE.Mesh(ringGeo, steelMat);
                rMount1.position.set(0, topY + 0.032, 0.018);
                const rMount2 = rMount1.clone(); rMount2.position.z = -0.056;
                const foot1 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.014, 0.018), darkMat);
                foot1.position.set(0, topY + 0.011, 0.018);
                const foot2 = foot1.clone(); foot2.position.z = -0.056;

                const lMat = glassMat(isSniper ? 0x0284c7 : 0x38bdf8, isSniper ? 0.30 : 0.18);
                const glint = new THREE.Mesh(new THREE.CircleGeometry(rad * 1.02, 18), lMat);
                glint.position.set(0, topY + 0.032, -0.02 - len * 0.49);
                const rearLens = new THREE.Mesh(new THREE.CircleGeometry(rad * 0.92, 18), lMat);
                rearLens.position.set(0, topY + 0.032, -0.02 + len * 0.48);
                const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0018, 8, 8), reticleMat);
                dot.position.set(0, topY + 0.032, -0.02);
                dot.userData.aimMarker = true;
                gun.add(scopeTube, objBell, ocBell, topTurret, sideTurret, rMount1, rMount2, foot1, foot2, glint, rearLens, dot);
                sightY = topY + 0.032;
            }
            return sightY;
        }

        _buildLauncher(root, gun, accentMat, darkMat, steelMat, withArms) {
            // Iconic RPG-7 shoulder-fired rocket launcher + conical PG-7V warhead!
            const tubeGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.82, 14);
            tubeGeo.rotateX(Math.PI * 0.5);
            const tube = new THREE.Mesh(tubeGeo, steelMat);
            tube.position.set(0, 0, -0.06);

            // Wooden mid-barrel heatshield grips
            const woodWrapGeo = new THREE.CylinderGeometry(0.033, 0.033, 0.28, 12);
            woodWrapGeo.rotateX(Math.PI * 0.5);
            const woodWrap = new THREE.Mesh(woodWrapGeo, accentMat);
            woodWrap.position.set(0, 0, 0.05);

            // Flared rear venturi exhaust cone
            const flareGeo = new THREE.CylinderGeometry(0.026, 0.044, 0.14, 14);
            flareGeo.rotateX(Math.PI * 0.5);
            const flare = new THREE.Mesh(flareGeo, darkMat);
            flare.position.set(0, 0, 0.41);

            // Dual forward + rear pistol grips
            const fGrip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.092, 0.034), accentMat);
            fGrip.position.set(0, -0.062, -0.22); fGrip.rotation.x = 0.22;
            const rGrip = fGrip.clone();
            rGrip.position.set(0, -0.062, -0.04);

            // Olive PG-7V Rocket Warhead seated at muzzle (animates via magGroup on reload!)
            const magGroup = new THREE.Group();
            const oliveMat = new THREE.MeshStandardMaterial({ color: 0x3b4d2e, roughness: 0.52, metalness: 0.25 });
            const booster = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.10, 12), steelMat);
            booster.rotation.x = Math.PI * 0.5; booster.position.set(0, 0, -0.49);
            const headCone = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.14, 14), oliveMat);
            headCone.rotation.x = -Math.PI * 0.5; headCone.position.set(0, 0, -0.64);
            const headBase = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.022, 0.07, 14), oliveMat);
            headBase.rotation.x = Math.PI * 0.5; headBase.position.set(0, 0, -0.54);
            const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.014, 0.045, 10), steelMat);
            fuse.rotation.x = Math.PI * 0.5; fuse.position.set(0, 0, -0.72);
            magGroup.add(booster, headBase, headCone, fuse);

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0, -0.75);
            gun.add(tube, woodWrap, flare, fGrip, rGrip, magGroup, muzzleAnchor);

            if (withArms) this._attachFirstPersonArms(root, false);
            return { root, gun, magGroup, boltGroup: new THREE.Group(), muzzleAnchor, laserBeam: null, sightY: 0.056 };
        }

        _buildRevolver(root, gun, bodyMat, darkMat, accentMat, steelMat, withArms) {
            // Iconic Colt Python .357 Revolver: sculpted frame, rotating 6-shot fluted cylinder, full underlug & vent rib!
            const frame = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.042, 0.14), bodyMat);
            const topStrap = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.012, 0.13), bodyMat);
            topStrap.position.set(0, 0.036, -0.01);

            // Revolving fluted cylinder inside boltGroup (rotates on fire!)
            const boltGroup = new THREE.Group();
            boltGroup.position.set(0, 0.008, -0.02);
            const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.052, 16), steelMat);
            cyl.rotation.x = Math.PI * 0.5;
            boltGroup.add(cyl);
            for (let f = 0; f < 6; f++) {
                const a = (f / 6) * Math.PI * 2;
                const flute = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.007, 0.046), darkMat);
                flute.position.set(Math.cos(a) * 0.022, Math.sin(a) * 0.022, 0);
                boltGroup.add(flute);
            }

            // Ventilated-rib barrel + full underlug
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.18, 12), bodyMat);
            barrel.rotation.x = Math.PI * 0.5; barrel.position.set(0, 0.020, -0.15);
            const underlug = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.022, 0.175), bodyMat);
            underlug.position.set(0, 0.002, -0.148);
            const ventRib = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.010, 0.175), bodyMat);
            ventRib.position.set(0, 0.035, -0.148);

            const grip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.098, 0.040), accentMat);
            grip.position.set(0, -0.052, 0.072); grip.rotation.x = 0.42;
            const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.022, 0.016), steelMat);
            hammer.position.set(0, 0.038, 0.068); hammer.rotation.x = -0.45;
            const trigGuard = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0035, 6, 12), bodyMat);
            trigGuard.rotation.y = Math.PI * 0.5; trigGuard.position.set(0, -0.026, 0.016);

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0.020, -0.245);
            gun.add(frame, topStrap, boltGroup, barrel, underlug, ventRib, grip, hammer, trigGuard, muzzleAnchor);

            if (withArms) this._attachFirstPersonArms(root, true);
            return { root, gun, magGroup: new THREE.Group(), boltGroup, muzzleAnchor, laserBeam: null };
        }

        _buildDoubleBarrel(root, gun, bodyMat, darkMat, accentMat, steelMat, withArms) {
            // Classic Olympia Coach Gun: twin side-by-side blued barrels, center rib, brass bead, twin hammers & walnut stock!
            const frame = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.056, 0.14), steelMat);
            for (const s of [-1, 1]) {
                const b = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.52, 12), darkMat);
                b.rotation.x = Math.PI * 0.5;
                b.position.set(s * 0.014, 0.012, -0.32);
                const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.022, 0.014), steelMat);
                hammer.position.set(s * 0.014, 0.036, 0.03); hammer.rotation.x = -0.35;
                gun.add(b, hammer);
            }
            const centerRib = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.010, 0.50), bodyMat);
            centerRib.position.set(0, 0.026, -0.31);

            const forend = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.028, 0.22), accentMat);
            forend.position.set(0, -0.012, -0.20);
            const wrist = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.048, 0.12), accentMat);
            wrist.position.set(0, -0.028, 0.11); wrist.rotation.x = 0.35;
            const stock = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.078, 0.24), accentMat);
            stock.position.set(0, -0.042, 0.26); stock.rotation.x = 0.10;
            const buttPlate = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.082, 0.012), darkMat);
            buttPlate.position.set(0, -0.054, 0.38);

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0.012, -0.59);
            gun.add(frame, centerRib, forend, wrist, stock, buttPlate, muzzleAnchor);
            if (withArms) this._attachFirstPersonArms(root, false);
            return { root, gun, magGroup: new THREE.Group(), boltGroup: new THREE.Group(), muzzleAnchor, laserBeam: null };
        }

        buildTopHat() {
            const hat = new THREE.Group();
            const silkMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.32, metalness: 0.35 });
            const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.90 });
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.022, 24), silkMat);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.145, 0.26, 24), silkMat);
            crown.position.y = 0.14;
            const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.150, 0.148, 0.042, 24), ribbonMat);
            ribbon.position.y = 0.032;
            hat.add(brim, crown, ribbon);
            return hat;
        }

        _buildRayGun(root, gun, spec, isPaP, withArms) {
            const shellColor = isPaP ? 0x1e293b : (spec.modelSpec.primaryColor || 0xb91c1c);
            const energyColor = isPaP ? 0xf43f5e : (spec.magicColor || 0x22ff77);
            const bodyMat = new THREE.MeshStandardMaterial({ color: shellColor, roughness: 0.28, metalness: 0.82 });
            const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.95 });
            const glowMat = new THREE.MeshBasicMaterial({ color: energyColor });

            const isMk2 = spec.id === 'raygun_mk2';
            const isWinter = spec.id === 'winters_howl_bo1';
            const isSliq = spec.id === 'sliquifier_bo2';
            const isFolly = spec.id === 'alistairs_folly_bo4';

            const body = new THREE.Mesh(new THREE.BoxGeometry(isMk2 ? 0.046 : 0.052, 0.064, isMk2 ? 0.30 : 0.22), bodyMat);
            gun.add(body);

            if (isMk2) {
                // Iconic tri-rail Ray Gun Mark II with dual parallel glow rails & front bayonet shroud
                for (const s of [-1, 1]) {
                    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.012, 0.28), glowMat);
                    rail.position.set(s * 0.028, 0.014, -0.14);
                    gun.add(rail);
                }
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.20, 12), chromeMat);
                barrel.rotation.x = Math.PI * 0.5; barrel.position.set(0, 0.008, -0.22);
                gun.add(barrel);
            } else if (isWinter) {
                // Winter's Howl cryo-revolver with frosted drum cylinder & hexagonal muzzle crystal
                const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.065, 8), glowMat);
                drum.rotation.x = Math.PI * 0.5; drum.position.set(0, 0.014, -0.02);
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.026, 0.16, 6), chromeMat);
                barrel.rotation.x = Math.PI * 0.5; barrel.position.set(0, 0.010, -0.17);
                gun.add(drum, barrel);
            } else if (isSliq) {
                // Sliquifier clear bio-sludge canisters + bent pipe nozzle
                const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.14, 12), glowMat);
                canister.rotation.x = Math.PI * 0.5; canister.position.set(0, 0.042, -0.04);
                const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.014, 0.18, 10), chromeMat);
                nozzle.rotation.x = Math.PI * 0.5; nozzle.position.set(0, 0.004, -0.18);
                gun.add(canister, nozzle);
            } else if (isFolly) {
                // Alistair's Annihilator steampunk brass-ring chaos revolver
                const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.88 });
                const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.06, 12), brassMat);
                drum.rotation.x = Math.PI * 0.5; drum.position.set(0, 0.01, -0.02);
                const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.048, 0.20), brassMat);
                shroud.position.set(0, 0.014, -0.18);
                gun.add(drum, shroud);
            } else {
                const barrelGeo = new THREE.CylinderGeometry(0.014, 0.028, 0.14, 14);
                barrelGeo.rotateX(Math.PI * 0.5);
                const barrel = new THREE.Mesh(barrelGeo, chromeMat);
                barrel.position.set(0, 0.006, -0.17);
                gun.add(barrel);
                for (let i = 0; i < 3; i++) {
                    const fin = new THREE.Mesh(new THREE.TorusGeometry(0.025 - i * 0.004, 0.004, 8, 16), glowMat);
                    fin.position.set(0, 0.006, -0.12 - i * 0.042);
                    gun.add(fin);
                }
            }

            const magGroup = new THREE.Group();
            const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.055, 12), glowMat);
            cell.position.set(0, 0.042, 0.02);
            magGroup.add(cell);
            gun.add(magGroup);

            const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.095, 0.040), chromeMat);
            grip.position.set(0, -0.056, 0.06); grip.rotation.x = 0.30;
            const rearRing = new THREE.Mesh(new THREE.RingGeometry(0.008, 0.012, 14), glowMat);
            rearRing.position.set(0, 0.055, 0.09);
            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0.006, isMk2 ? -0.33 : -0.26);
            gun.add(grip, rearRing, muzzleAnchor);

            if (withArms) this._attachFirstPersonArms(root, true);
            return { root, gun, magGroup, boltGroup: new THREE.Group(), muzzleAnchor, laserBeam: null, sightY: 0.055 };
        }

        _buildThundergun(root, gun, spec, isPaP, withArms) {
            const drumColor = isPaP ? 0x6d28d9 : (spec.modelSpec.primaryColor || 0x3b424c);
            const glowColor = isPaP ? 0xf0abfc : (spec.magicColor || 0x38bdf8);
            const hullMat = new THREE.MeshStandardMaterial({ color: drumColor, roughness: 0.36, metalness: 0.78 });
            const steelMat = new THREE.MeshStandardMaterial({ color: 0x1c2026, roughness: 0.45, metalness: 0.85 });
            const glowMat = new THREE.MeshBasicMaterial({ color: glowColor });
            const magGroup = new THREE.Group();
            const boltGroup = new THREE.Group();

            if (spec.id === 'blundergat_bo2') {
                // Iconic 4-Barrel Blundergat quad-shotgun silhouette!
                const rec = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.072, 0.24), hullMat);
                gun.add(rec);
                for (const sx of [-0.018, 0.018]) {
                    for (const sy of [-0.012, 0.022]) {
                        const qb = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 10), steelMat);
                        qb.rotation.x = Math.PI * 0.5; qb.position.set(sx, sy, -0.26);
                        gun.add(qb);
                    }
                }
                const vial = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 10), glowMat);
                vial.rotation.x = Math.PI * 0.5; vial.position.set(0.042, 0.014, -0.16);
                gun.add(vial);
            } else if (spec.id === 'paralyzer_bo2') {
                // Rotating fan-turbine Paralyzer!
                const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.38, 12), hullMat);
                housing.rotation.x = Math.PI * 0.5; housing.position.set(0, 0, -0.10);
                boltGroup.position.set(0, 0, -0.32);
                for (let b = 0; b < 4; b++) {
                    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.018, 0.008), glowMat);
                    blade.rotation.z = b * Math.PI / 4;
                    boltGroup.add(blade);
                }
                gun.add(housing, boltGroup);
            } else if (spec.id === 'baby_gun_bo1') {
                // Shangri-La Golden Fractalizer Shrink Ray with front spinning crystal dish!
                const goldMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.25, metalness: 0.85 });
                const body = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.38, 10), goldMat);
                body.rotation.x = Math.PI * 0.5; body.position.set(0, 0, -0.10);
                const dish = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.009, 8, 18), glowMat);
                dish.position.set(0, 0, -0.32);
                const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.032), glowMat);
                gem.position.set(0, 0.055, -0.10);
                gun.add(body, dish, gem);
            } else {
                const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.44, 16), hullMat);
                drum.rotation.x = Math.PI * 0.5; drum.position.set(0, 0, -0.06);
                const muzzleMouth = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.056, 0.14, 16), steelMat);
                muzzleMouth.rotation.x = Math.PI * 0.5; muzzleMouth.position.set(0, 0, -0.34);
                gun.add(drum, muzzleMouth);
                for (let i = 0; i < 4; i++) {
                    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.005, 8, 18), glowMat);
                    coil.position.set(0, 0, -0.18 - i * 0.055);
                    gun.add(coil);
                }
            }

            const cell = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.085, 0.095), glowMat);
            cell.position.set(0, -0.055, 0.04);
            magGroup.add(cell);
            const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.095, 0.042), steelMat);
            grip.position.set(0, -0.065, 0.12); grip.rotation.x = 0.25;
            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0, -0.43);
            gun.add(magGroup, grip, muzzleAnchor);

            if (withArms) this._attachFirstPersonArms(root, false);
            return { root, gun, magGroup, boltGroup, muzzleAnchor, laserBeam: null, sightY: 0.072, isRotarySpin: spec.id === 'paralyzer_bo2' };
        }

        _buildMegaBuster(root, gun, spec, isPaP, withArms) {
            const cobaltMat = new THREE.MeshStandardMaterial({ color: isPaP ? 0x6d28d9 : 0x1d4ed8, roughness: 0.22, metalness: 0.68 });
            const skyTrimMat = new THREE.MeshStandardMaterial({ color: isPaP ? 0xc084fc : 0x0ea5e9, roughness: 0.25, metalness: 0.55 });
            const darkCollarMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.85 });
            const stripMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9, roughness: 0.2 });

            const cuffGeo = new THREE.CylinderGeometry(0.068, 0.060, 0.14, 20);
            cuffGeo.rotateX(Math.PI * 0.5);
            const cuff = new THREE.Mesh(cuffGeo, skyTrimMat); cuff.position.set(0, 0, 0.09);
            const mainCylGeo = new THREE.CylinderGeometry(0.088, 0.076, 0.28, 22);
            mainCylGeo.rotateX(Math.PI * 0.5);
            const mainCyl = new THREE.Mesh(mainCylGeo, cobaltMat); mainCyl.position.set(0, 0, -0.09);
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.089, 18, 14), cobaltMat);
            dome.scale.set(1, 1, 1.15); dome.position.set(0, 0, -0.02);
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.026, 0.18), skyTrimMat);
            fin.position.set(0, 0.088, -0.10);
            const frontBead = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 8), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
            frontBead.position.set(0, 0.104, -0.20);
            const frontConeGeo = new THREE.CylinderGeometry(0.056, 0.088, 0.11, 22);
            frontConeGeo.rotateX(Math.PI * 0.5);
            const frontCone = new THREE.Mesh(frontConeGeo, cobaltMat); frontCone.position.set(0, 0, -0.27);
            const collarGeo = new THREE.CylinderGeometry(0.052, 0.058, 0.065, 22);
            collarGeo.rotateX(Math.PI * 0.5);
            const collar = new THREE.Mesh(collarGeo, darkCollarMat); collar.position.set(0, 0, -0.34);
            const boreGlow = new THREE.Mesh(new THREE.CircleGeometry(0.044, 20), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
            boreGlow.position.set(0, 0, -0.373);
            const barGeo = new THREE.BoxGeometry(0.012, 0.018, 0.19);
            const barL = new THREE.Mesh(barGeo, stripMat); barL.position.set(-0.086, 0.006, -0.11);
            const barR = new THREE.Mesh(barGeo, stripMat); barR.position.set(0.086, 0.006, -0.11);
            const wristRing = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.009, 10, 22), skyTrimMat);
            wristRing.position.set(0, 0, 0.025);
            const magGroup = new THREE.Group();
            const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.09, 12), stripMat);
            cell.rotation.x = Math.PI * 0.5; cell.position.set(0, -0.072, -0.06);
            magGroup.add(cell);
            gun.add(cuff, mainCyl, dome, fin, frontBead, frontCone, collar, boreGlow, barL, barR, wristRing, magGroup);

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0, -0.39);
            gun.add(muzzleAnchor);

            const chargeOrbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 });
            const chargeOrbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 14), chargeOrbMat);
            chargeOrbMesh.add(new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })));
            chargeOrbMesh.visible = false;
            muzzleAnchor.add(chargeOrbMesh);

            const chargeRingMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.78 });
            const chargeRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.006, 8, 24), chargeRingMat);
            const chargeRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.005, 8, 24), chargeRingMat);
            chargeRing1.visible = false; chargeRing2.visible = false;
            muzzleAnchor.add(chargeRing1, chargeRing2);

            if (withArms) {
                const rSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.060, 0.30, 14), skyTrimMat);
                rSleeve.rotation.x = Math.PI * 0.5; rSleeve.position.set(0.02, -0.01, 0.24);
                const lArm = new THREE.Group();
                const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.34, 12), cobaltMat);
                lFore.rotation.set(Math.PI * 0.5 + 0.16, 0.38, 0); lFore.position.set(-0.12, -0.075, 0.06);
                const lGlove = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.048, 0.078), skyTrimMat);
                lGlove.position.set(-0.02, -0.048, -0.09);
                lArm.add(lFore, lGlove);
                root.add(rSleeve, lArm);
            }

            return {
                root, gun, magGroup, boltGroup: new THREE.Group(), muzzleAnchor, laserBeam: null, sightY: 0.098,
                chargeOrbMesh, chargeOrbMat, chargeRings: [chargeRing1, chargeRing2],
                chargeRingMat, chargeStripMat: stripMat, boreGlow
            };
        }

        _buildMinigun(root, gun, spec, camoId, isPaP, withArms) {
            const ms = spec.modelSpec;
            const bodyMat = BO.Textures.getCamoMaterial(camoId, ms.primaryColor || 0x262b33, isPaP);
            const steelMat = this._darkMat(0x475569, 0.28, 0.90);
            const darkMat = this._darkMat(0x14171c, 0.45, 0.78);
            const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.062, 0.28, 16), bodyMat);
            housing.rotation.x = Math.PI * 0.5; housing.position.set(0, -0.02, 0.04);
            const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.020, 0.24), darkMat);
            handleBar.position.set(0, 0.088, -0.02);
            const handlePostF = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.075, 0.024), darkMat);
            handlePostF.position.set(0, 0.048, -0.12);
            const handlePostR = handlePostF.clone(); handlePostR.position.z = 0.09;
            const rearGrip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.11, 0.040), darkMat);
            rearGrip.position.set(0, -0.06, 0.20); rearGrip.rotation.x = 0.22;

            const magGroup = new THREE.Group();
            const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.14), bodyMat);
            ammoBox.position.set(0.05, -0.10, -0.02);
            const beltMap = BO.Textures?.createBrassBeltTexture ? BO.Textures.createBrassBeltTexture() : null;
            if (beltMap) {
                const chute = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.08, 0.05), new THREE.MeshStandardMaterial({ map: beltMap, metalness: 0.7, roughness: 0.35 }));
                chute.position.set(0.045, -0.04, -0.02);
                magGroup.add(chute);
            }
            magGroup.add(ammoBox);

            const boltGroup = new THREE.Group();
            boltGroup.position.set(0, -0.02, -0.32);
            const bGeo = new THREE.CylinderGeometry(0.0085, 0.0085, 0.44, 8);
            bGeo.rotateX(Math.PI * 0.5);
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const b = new THREE.Mesh(bGeo, steelMat);
                b.position.set(Math.cos(a) * 0.032, Math.sin(a) * 0.032, 0);
                boltGroup.add(b);
            }
            const clamp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.024, 16), darkMat);
            clamp1.rotation.x = Math.PI * 0.5; clamp1.position.z = -0.16;
            const clamp2 = clamp1.clone(); clamp2.position.z = 0.06;
            boltGroup.add(clamp1, clamp2);

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, -0.02, -0.55);
            gun.add(housing, handleBar, handlePostF, handlePostR, rearGrip, magGroup, boltGroup, muzzleAnchor);
            if (withArms) this._attachFirstPersonArms(root, false);
            return { root, gun, magGroup, boltGroup, muzzleAnchor, laserBeam: null, sightY: 0.105, isRotarySpin: true };
        }

        _buildMeleeWeapon(root, gun, spec, camoId, isPaP, withArms) {
            const ms = spec.modelSpec;
            const bladeMat = BO.Textures.getCamoMaterial(camoId, ms.primaryColor || 0xcbd5e1, isPaP);
            const handleMat = this._accentMaterial(spec.id === 'tomahawk_axe' || spec.id === 'trench_shovel' ? 'walnut' : 'polymer', ms.accentColor || 0x1e293b);
            const steelMat = this._darkMat(0x525e6e, 0.25, 0.90);
            const glowHex = isPaP ? 0xc084fc : (ms.glowColor || 0);
            const glowMat = glowHex ? new THREE.MeshBasicMaterial({ color: glowHex }) : bladeMat;

            if (spec.id === 'magnifying_glass' || ms.meleeShape === 'magnifying_glass') {
                const woodMat = this._accentMaterial('walnut', 0x5c3419);
                const brassMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.24, metalness: 0.92 });
                const lensMat = new THREE.MeshPhysicalMaterial({
                    color: 0xdbeafe, roughness: 0.04, metalness: 0.05,
                    transparent: true, opacity: 0.38, clearcoat: 1.0, clearcoatRoughness: 0.03,
                    side: THREE.DoubleSide, depthWrite: false
                });
                const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.145, 14), woodMat);
                handle.position.set(0, -0.045, 0.02); handle.rotation.x = 0.25;
                const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 10), brassMat);
                pommel.position.set(0, -0.115, 0.038);
                const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0145, 0.032, 14), brassMat);
                ferrule.position.set(0, 0.025, 0.002); ferrule.rotation.x = 0.25;
                const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.0095, 14, 32), brassMat);
                bezel.position.set(0, 0.102, -0.016);
                const innerLip = new THREE.Mesh(new THREE.TorusGeometry(0.060, 0.004, 8, 28), steelMat);
                innerLip.position.set(0, 0.102, -0.016);
                const lens = new THREE.Mesh(new THREE.SphereGeometry(0.061, 24, 16), lensMat);
                lens.scale.set(1, 1, 0.18);
                lens.position.set(0, 0.102, -0.016);
                const glintBar = new THREE.Mesh(
                    new THREE.BoxGeometry(0.034, 0.006, 0.002),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 })
                );
                glintBar.position.set(-0.018, 0.125, -0.008); glintBar.rotation.z = 0.65;
                gun.add(handle, pommel, ferrule, bezel, innerLip, lens, glintBar);
                const muzzleAnchor = new THREE.Object3D();
                muzzleAnchor.position.set(0, 0.102, -0.05);
                gun.add(muzzleAnchor);
                if (withArms) this._attachFirstPersonArms(root, true);
                return { root, gun, magGroup: new THREE.Group(), boltGroup: new THREE.Group(), muzzleAnchor, laserBeam: null, sightY: 0.102, sightZ: 0.0, sightEyeRelief: 0.16 };
            }

            if (spec.id === 'combat_knife') {
                const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.13, 10), handleMat);
                handle.position.set(0, -0.02, 0.05); handle.rotation.x = 1.15;
                const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.018, 10), steelMat);
                pommel.position.set(0, -0.045, 0.11); pommel.rotation.x = 1.15;
                const guard = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.012, 0.022), steelMat);
                guard.position.set(0, 0.03, -0.01);
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.038, 0.23), bladeMat);
                blade.position.set(0, 0.045, -0.13);
                const tip = new THREE.Mesh(new THREE.ConeGeometry(0.020, 0.06, 4), bladeMat);
                tip.rotation.x = -Math.PI * 0.5; tip.scale.set(0.35, 1, 1); tip.position.set(0, 0.046, -0.27);
                gun.add(handle, pommel, guard, blade, tip);
            } else if (spec.id === 'tomahawk_axe') {
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.48, 10), handleMat);
                shaft.position.set(0, 0.02, -0.08); shaft.rotation.x = 1.05;
                const head = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.15, 0.14), bladeMat);
                head.position.set(0, 0.11, -0.25);
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.095, 6), steelMat);
                spike.rotation.x = Math.PI * 0.5; spike.position.set(0, 0.12, -0.16);
                gun.add(shaft, head, spike);
            } else if (spec.id === 'trench_shovel') {
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 10), handleMat);
                shaft.position.set(0, 0.01, -0.06); shaft.rotation.x = 1.10;
                const dGrip = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.008, 6, 12), steelMat);
                dGrip.position.set(0, -0.06, 0.14);
                const spade = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.065, 0.16, 6), bladeMat);
                spade.scale.set(1.1, 1, 0.18); spade.rotation.x = -0.35; spade.position.set(0, 0.10, -0.30);
                gun.add(shaft, dGrip, spade);
            } else if (spec.id === 'machete_jungle') {
                const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.15, 10), handleMat);
                handle.position.set(0, -0.03, 0.06); handle.rotation.x = 1.05;
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.048, 0.44), bladeMat);
                blade.position.set(0, 0.07, -0.21); blade.rotation.x = 0.22;
                for (let t = 0; t < 6; t++) {
                    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.014, 0.018), steelMat);
                    tooth.position.set(0, 0.095 + t * 0.008, -0.10 - t * 0.045);
                    gun.add(tooth);
                }
                gun.add(handle, blade);
            } else if (spec.id === 'katana_carbon') {
                const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.20, 10), handleMat);
                handle.position.set(0, -0.04, 0.08); handle.rotation.x = 0.85;
                const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.012, 16), steelMat);
                tsuba.position.set(0, 0.02, 0.0); tsuba.rotation.x = -0.5;
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.032, 0.58), bladeMat);
                blade.position.set(0, 0.09, -0.27); blade.rotation.x = 0.18;
                const edge = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.007, 0.57), glowMat);
                edge.position.set(0, 0.106, -0.27); edge.rotation.x = 0.18;
                gun.add(handle, tsuba, blade, edge);
            } else if (spec.id === 'riot_baton') {
                const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.50, 12), bladeMat);
                rod.position.set(0, 0.04, -0.12); rod.rotation.x = 1.15;
                const sideHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), handleMat);
                sideHandle.position.set(0, 0.06, -0.02);
                const tip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), glowMat);
                tip.position.set(0, 0.13, -0.34);
                gun.add(rod, sideHandle, tip);
            } else if (spec.id === 'crowbar_heavy') {
                const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.50, 6), bladeMat);
                rod.position.set(0, 0.04, -0.12); rod.rotation.x = 1.15;
                const hook = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.088, 0.052), steelMat);
                hook.position.set(0, 0.14, -0.35); hook.rotation.x = -0.45;
                gun.add(rod, hook);
            } else if (spec.id === 'sledge_hammer') {
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.020, 0.58, 10), handleMat);
                shaft.position.set(0, 0.02, -0.12); shaft.rotation.x = 1.10;
                const block = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.24, 8), bladeMat);
                block.rotation.x = Math.PI * 0.5; block.position.set(0, 0.14, -0.36);
                const collar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.25), glowMat);
                collar.position.set(0, 0.14, -0.36);
                gun.add(shaft, block, collar);
            } else if (spec.id === 'chainsaw_ripper') {
                const motor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.24), bladeMat);
                motor.position.set(0, -0.01, 0.02);
                const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.012, 8, 16, Math.PI), steelMat);
                wrap.position.set(0, 0.03, -0.06);
                const bar = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.072, 0.46), handleMat);
                bar.position.set(0, 0.01, -0.29);
                const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.082, 0.47), steelMat);
                teeth.position.set(0, 0.01, -0.29);
                gun.add(motor, wrap, bar, teeth);
            } else {
                // Reaper Scythe
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.72, 10), handleMat);
                pole.position.set(0, 0.04, -0.16); pole.rotation.x = 1.12;
                const crescent = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.30, 0.13), glowMat);
                crescent.position.set(0, 0.19, -0.45); crescent.rotation.x = -0.45;
                const spine = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.008, 6, 14), steelMat);
                spine.position.set(0, 0.14, -0.36);
                gun.add(pole, crescent, spine);
            }

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0.06, -0.35);
            gun.add(muzzleAnchor);
            if (withArms) this._attachFirstPersonArms(root, true);
            return { root, gun, magGroup: new THREE.Group(), boltGroup: new THREE.Group(), muzzleAnchor, laserBeam: null, sightY: 0.08 };
        }

        _buildMagicWeapon(root, gun, spec, isPaP, withArms) {
            const ms = spec.modelSpec;
            const hullMat = new THREE.MeshStandardMaterial({ color: isPaP ? 0x3b0764 : (ms.primaryColor || 0x2e1065), roughness: 0.30, metalness: 0.80 });
            const glowCol = isPaP ? 0xf0abfc : (spec.magicColor || 0xc084fc);
            const glowMat = new THREE.MeshBasicMaterial({ color: glowCol });
            const steelMat = this._darkMat(0x525e6e, 0.28, 0.90);

            if (ms.wonderType === 'staff') {
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.66, 12), hullMat);
                shaft.rotation.x = Math.PI * 0.5; shaft.position.set(0, 0, -0.14);
                const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.056, 1), glowMat);
                orb.position.set(0, 0.01, -0.49);
                const halo = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.009, 8, 20), hullMat);
                halo.position.set(0, 0.01, -0.49);
                // Distinct elemental crown tines per Origins Staff
                for (let t = 0; t < (spec.id === 'cryo_sceptre' ? 6 : 4); t++) {
                    const a = t * Math.PI * 2 / (spec.id === 'cryo_sceptre' ? 6 : 4);
                    const tine = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.11, 5), glowMat);
                    tine.position.set(Math.cos(a) * 0.075, 0.01 + Math.sin(a) * 0.075, -0.52);
                    tine.rotation.x = -Math.PI * 0.5;
                    gun.add(tine);
                }
                gun.add(shaft, orb, halo);
            } else if (ms.wonderType === 'tesla') {
                const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.075, 0.34), hullMat);
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.28, 12), steelMat);
                barrel.rotation.x = Math.PI * 0.5; barrel.position.set(0, 0.01, -0.28);
                for (let i = 0; i < 3; i++) {
                    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), glowMat);
                    bulb.position.set(spec.id === 'wave_gun_bo1' ? (i % 2 ? -0.036 : 0.036) : 0.038, 0.03, -0.08 * i);
                    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 8, 16), glowMat);
                    ring.position.set(0, 0.01, -0.18 - i * 0.08);
                    gun.add(bulb, ring);
                }
                gun.add(receiver, barrel);
            } else {
                const core = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.16), hullMat);
                core.position.set(0, 0.02, -0.18);
                const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), glowMat);
                eyeL.position.set(-0.03, 0.04, -0.26);
                const eyeR = eyeL.clone(); eyeR.position.x = 0.03;
                const crown = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.007, 8, 18), glowMat);
                crown.position.set(0, 0.08, -0.18); crown.rotation.x = Math.PI * 0.5;
                gun.add(core, eyeL, eyeR, crown);
            }

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0.02, -0.46);
            gun.add(muzzleAnchor);
            if (withArms) this._attachFirstPersonArms(root, false);
            return { root, gun, magGroup: new THREE.Group(), boltGroup: new THREE.Group(), muzzleAnchor, laserBeam: null, sightY: 0.068 };
        }

        _attachFirstPersonArms(root, isPistol) {
            const T = BO.Textures;
            const clothMap = T?.createMilitaryFatigueTexture ? T.createMilitaryFatigueTexture('bdu', 0x262e24) : null;
            const clothBump = T?.createBumpTexture ? T.createBumpTexture('cloth') : null;
            const gloveMap = T?.createPolymerGripTexture ? T.createPolymerGripTexture() : null;
            const gloveBump = T?.createBumpTexture ? T.createBumpTexture('polymer') : null;

            const sleeveMat = new THREE.MeshStandardMaterial({
                color: clothMap ? 0xd8dfd5 : 0x283026,
                map: clothMap,
                bumpMap: clothBump,
                bumpScale: 0.010,
                roughness: 0.88,
                metalness: 0.04
            });
            const cuffMat = new THREE.MeshStandardMaterial({
                color: 0x101318,
                map: gloveMap,
                bumpMap: gloveBump,
                bumpScale: 0.010,
                roughness: 0.90,
                metalness: 0.04,
                envMapIntensity: 0.16
            });
            const gloveMat = new THREE.MeshStandardMaterial({
                color: 0x101318,
                map: gloveMap,
                bumpMap: gloveBump,
                bumpScale: 0.010,
                roughness: 0.88,
                metalness: 0.05,
                envMapIntensity: 0.20
            });
            const leatherMat = new THREE.MeshStandardMaterial({
                color: 0x14181f,
                map: gloveMap,
                bumpMap: gloveBump,
                bumpScale: 0.008,
                roughness: 0.84,
                metalness: 0.06,
                envMapIntensity: 0.20
            });
            const knuckleMat = new THREE.MeshStandardMaterial({
                color: 0x0a0c10,
                roughness: 0.72,
                metalness: 0.16,
                envMapIntensity: 0.24
            });

            const makeGloveHand = (isLeft, pistolMode) => {
                const g = new THREE.Group();
                // Smooth rounded anatomical gloved hand (zero flat cylinder caps facing camera)
                const palmGeo = new THREE.CapsuleGeometry(0.019, 0.044, 8, 14);
                palmGeo.rotateX(Math.PI * 0.5);
                palmGeo.scale(1.06, 0.82, 1.0);
                const palm = new THREE.Mesh(palmGeo, gloveMat);

                // Smooth rounded wrist transition blending into forearm
                const wristGeo = new THREE.CapsuleGeometry(0.017, 0.036, 6, 12);
                wristGeo.rotateX(Math.PI * 0.5);
                const wrist = new THREE.Mesh(wristGeo, cuffMat);
                wrist.position.set(isLeft ? -0.006 : 0.006, -0.008, 0.038);
                wrist.rotation.set(0.22, isLeft ? 0.24 : -0.24, 0);

                // Matte dark knuckle ridge
                const knuckGeo = new THREE.CapsuleGeometry(0.0052, 0.024, 5, 10);
                knuckGeo.rotateZ(Math.PI * 0.5);
                const knuck = new THREE.Mesh(knuckGeo, knuckleMat);
                knuck.position.set(0, 0.012, -0.012);

                // Sculpted gloved thumb wrapping cleanly forward along the side of the frame
                const thumbGeo = new THREE.CapsuleGeometry(0.0066, 0.030, 6, 10);
                thumbGeo.rotateX(Math.PI * 0.5);
                const thumb = new THREE.Mesh(thumbGeo, leatherMat);
                if (pistolMode) {
                    thumb.position.set(isLeft ? 0.015 : -0.015, 0.008, -0.016);
                    thumb.rotation.set(0.12, isLeft ? -0.14 : 0.14, 0);
                } else {
                    thumb.position.set(isLeft ? 0.018 : -0.018, 0.006, -0.014);
                    thumb.rotation.set(0.28, isLeft ? -0.32 : 0.32, 0);
                }

                g.add(palm, wrist, knuck, thumb);
                // Wrapped fingers curling naturally around grip / handguard
                for (let f = -1; f <= 1; f++) {
                    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0052, 0.022, 4, 8), gloveMat);
                    finger.rotation.x = pistolMode ? 1.35 : 1.15;
                    finger.position.set(f * 0.0105, -0.006, -0.028);
                    g.add(finger);
                }
                return g;
            };

            // Tapered tactical sleeve geometry with rounded wrist end
            const makeForearmMesh = (len) => {
                const geo = new THREE.CapsuleGeometry(0.024, len, 8, 14);
                geo.rotateX(Math.PI * 0.5);
                const m = new THREE.Mesh(geo, sleeveMat);
                return m;
            };

            const rArm = new THREE.Group();
            const lArm = new THREE.Group();
            let dial = null;

            if (isPistol) {
                // Authentic two-handed thumbs-forward tactical pistol grip with connected forearms
                const rHand = makeGloveHand(false, true);
                rHand.position.set(0.014, -0.056, 0.068);
                rHand.rotation.set(0.12, -0.14, -0.10);

                const rForearm = makeForearmMesh(0.26);
                rForearm.position.set(0.046, -0.098, 0.188);
                rForearm.rotation.set(0.32, -0.24, -0.08);
                rArm.add(rForearm, rHand);

                const lHand = makeGloveHand(true, true);
                lHand.position.set(-0.015, -0.060, 0.058);
                lHand.rotation.set(0.12, 0.16, 0.12);

                const lForearm = makeForearmMesh(0.26);
                lForearm.position.set(-0.048, -0.100, 0.180);
                lForearm.rotation.set(0.32, 0.26, 0.08);

                // Slim low-profile matte-black tactical watch tucked naturally on left wrist
                const watchBandGeo = new THREE.TorusGeometry(0.0245, 0.0032, 6, 16);
                const watchBand = new THREE.Mesh(watchBandGeo, knuckleMat);
                watchBand.position.set(0, 0, -0.108);
                dial = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.008, 0.008, 0.003, 12),
                    new THREE.MeshStandardMaterial({ color: 0x0b1218, emissive: 0x10b981, emissiveIntensity: 0.45, roughness: 0.35 })
                );
                dial.position.set(0, 0.025, -0.108);
                lForearm.add(watchBand, dial);

                lArm.add(lForearm, lHand);
            } else {
                // Rifle / SMG / Sniper two-handed grip
                const rHand = makeGloveHand(false, false);
                rHand.position.set(0.010, -0.050, 0.086);
                const rForearm = makeForearmMesh(0.27);
                rForearm.position.set(0.058, -0.088, 0.242);
                rForearm.rotation.set(0.18, -0.20, 0);
                rArm.add(rForearm, rHand);

                const targetZ = -0.14;
                const targetX = -0.045;
                const lHand = makeGloveHand(true, false);
                lHand.position.set(-0.008, -0.022, targetZ);
                const lForearm = makeForearmMesh(0.29);
                lForearm.position.set(targetX - 0.072, -0.076, targetZ + 0.185);
                lForearm.rotation.set(0.16, 0.40, 0);

                const watchBandGeo = new THREE.CylinderGeometry(0.0225, 0.0230, 0.014, 14);
                watchBandGeo.rotateX(Math.PI * 0.5);
                const watchBand = new THREE.Mesh(watchBandGeo, knuckleMat);
                watchBand.position.set(0, 0, -0.125);
                dial = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.009, 0.009, 0.003, 12),
                    new THREE.MeshStandardMaterial({ color: 0x0b1218, emissive: 0x0ea5e9, emissiveIntensity: 0.55, roughness: 0.3 })
                );
                dial.position.set(0, 0.022, -0.125);
                lForearm.add(watchBand, dial);

                lArm.add(lForearm, lHand);
            }

            root.add(rArm, lArm);
            root.userData.arms = { rArm, lArm, watchDial: dial };
            return root.userData.arms;
        }
    }

    BO.WeaponMesh = new WeaponMeshBuilder();
})(window);
