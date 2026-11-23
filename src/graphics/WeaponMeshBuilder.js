/* ============================================================================
   BLACKOUT OPS — Procedural Multi-Part 3D Weapon & Arms Builder
   Builds all 17 weapons with physical 3D attachments, live camos,
   Pack-a-Punch circuits, and exact optical sightY alignment.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class WeaponMeshBuilder {
        _darkMat(hex = 0x16191f, rough = 0.50, metal = 0.72) {
            const map = BO.Textures && BO.Textures.createGunmetalTexture ? BO.Textures.createGunmetalTexture(hex) : null;
            return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : hex, map, roughness: rough, metalness: metal });
        }

        _woodMat(hex = 0x6f4324) {
            const map = BO.Textures && BO.Textures.createWoodFurnitureTexture ? BO.Textures.createWoodFurnitureTexture() : null;
            return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : hex, map, roughness: 0.62, metalness: 0.08 });
        }

        _polymerMat() {
            const map = BO.Textures && BO.Textures.createPolymerGripTexture ? BO.Textures.createPolymerGripTexture() : null;
            return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : 0x141820, map, roughness: 0.78, metalness: 0.18 });
        }

        buildWeapon(weaponId, attachments = {}, camoId = 'default', isPaP = false, withArms = false, isDualWield = false) {
            const spec = BO.WeaponsData.get(weaponId);
            const ms = spec.modelSpec;
            const root = new THREE.Group();
            const gun = new THREE.Group();
            root.add(gun);

            const effectiveCamo = (spec.isGoldFinish && (!camoId || camoId === 'default')) ? 'gold' : camoId;
            const bodyMat = (!isPaP && (!effectiveCamo || effectiveCamo === 'default') && BO.Textures.createGunmetalTexture)
                ? new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: BO.Textures.createGunmetalTexture(ms.primaryColor || 0x262c36),
                    roughness: 0.42,
                    metalness: 0.76
                })
                : BO.Textures.getCamoMaterial(effectiveCamo, ms.primaryColor, isPaP);
            const darkMat = this._darkMat(0x14171c, 0.46, 0.78);
            const polyMat = this._polymerMat();
            const accentMat = ms.wood ? this._woodMat(ms.accentColor) : polyMat;
            const steelMat = this._darkMat(0x475262, 0.28, 0.90);

            // Melee weapons & Wonder/Magic weapons have bespoke 3D silhouettes
            if (ms.isMelee) {
                return BO.ArsenalDetails.specialDetails(this._buildMeleeWeapon(root, gun, spec, camoId, isPaP, withArms), spec, isPaP);
            }
            if (ms.isMinigun) {
                return BO.ArsenalDetails.specialDetails(this._buildMinigun(root, gun, spec, camoId, isPaP, withArms), spec, isPaP);
            }
            if (ms.wonderType === 'megabuster') {
                return BO.ArsenalDetails.specialDetails(this._buildMegaBuster(root, gun, spec, isPaP, withArms), spec, isPaP);
            }
            if (ms.wonderType === 'raygun') {
                return BO.ArsenalDetails.specialDetails(this._buildRayGun(root, gun, spec, isPaP, withArms), spec, isPaP);
            }
            if (ms.wonderType === 'thundergun') {
                return BO.ArsenalDetails.specialDetails(this._buildThundergun(root, gun, spec, isPaP, withArms), spec, isPaP);
            }
            if (ms.wonderType) {
                return BO.ArsenalDetails.specialDetails(this._buildMagicWeapon(root, gun, spec, isPaP, withArms), spec, isPaP);
            }

            const recH = ms.receiverH;
            const recW = ms.receiverW;
            const recL = ms.receiverLen;
            const topY = recH * 0.5;

            // Upper & lower receiver
            const receiver = new THREE.Mesh(new THREE.BoxGeometry(recW, recH, recL), bodyMat);
            gun.add(receiver);

            // Top Picatinny rail
            const rail = new THREE.Mesh(new THREE.BoxGeometry(recW * 0.52, 0.008, recL * 0.86), darkMat);
            rail.position.set(0, topY + 0.004, -recL * 0.02);
            gun.add(rail);

            // Pistol Grip
            const grip = new THREE.Mesh(new THREE.BoxGeometry(recW * 0.62, 0.092, 0.036), accentMat);
            grip.position.set(0, -recH * 0.5 - 0.036, ms.isPistol ? recL * 0.24 : recL * 0.28);
            grip.rotation.x = 0.28;
            gun.add(grip);

            // Trigger guard + trigger
            const trigGuard = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.024, 0.038), darkMat);
            trigGuard.position.set(0, -recH * 0.5 - 0.012, ms.isPistol ? recL * 0.05 : recL * 0.12);
            gun.add(trigGuard);

            // Bolt / Charging Handle (animates on fire & reload)
            const boltGroup = new THREE.Group();
            const boltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.048), steelMat);
            boltMesh.position.set(recW * 0.52, topY * 0.35, -0.02);
            boltGroup.add(boltMesh);
            gun.add(boltGroup);

            // Upgraded Tactical Weapon Details: Ejection Port & Curved Trigger Blade!
            const ejPort = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.018, 0.044), new THREE.MeshStandardMaterial({ color: 0x090c12, roughness: 0.7 }));
            ejPort.position.set(recW * 0.505, topY * 0.25, -0.02);
            const trigBlade = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.022, 0.008), steelMat);
            trigBlade.position.set(0, -ms.receiverH * 0.5 - 0.012, ms.isPistol ? recL * 0.05 : recL * 0.12);
            trigBlade.rotation.x = 0.28;
            gun.add(ejPort, trigBlade);

            // Handguard / Forend (for rifles, SMGs, shotguns, LMGs) + Tactical Vent Ribs!
            const hgLen = ms.handguardLen || 0;
            if (hgLen > 0) {
                const hgZ = -recL * 0.5 - hgLen * 0.5 + 0.01;
                const hg = new THREE.Mesh(
                    new THREE.BoxGeometry(ms.handguardW, ms.handguardH, hgLen),
                    ms.wood ? accentMat : bodyMat
                );
                hg.position.set(0, 0.004, hgZ);
                const hgRail = new THREE.Mesh(new THREE.BoxGeometry(ms.handguardW * 0.55, 0.007, hgLen * 0.92), darkMat);
                hgRail.position.set(0, ms.handguardH * 0.5 + 0.006, hgZ);
                const sideRailL = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.010, hgLen * 0.75), steelMat);
                sideRailL.position.set(-ms.handguardW * 0.51, 0.004, hgZ);
                const sideRailR = sideRailL.clone(); sideRailR.position.x = ms.handguardW * 0.51;
                gun.add(hg, hgRail, sideRailL, sideRailR);
            }

            // Barrel (affected by heavy_barrel / short_barrel attachment)
            const ub = attachments.underbarrel || 'none';
            let barrelLen = ms.barrelLen;
            if (ub === 'heavy_barrel') barrelLen *= 1.24;
            if (ub === 'short_barrel') barrelLen *= 0.72;

            const barrelStartZ = ms.isPistol ? -recL * 0.5 : (-recL * 0.5 - hgLen * 0.82);
            const barrelGeo = new THREE.CylinderGeometry(ms.barrelR, ms.barrelR * 1.08, barrelLen, 12);
            barrelGeo.rotateX(Math.PI * 0.5);
            const barrel = new THREE.Mesh(barrelGeo, steelMat);
            barrel.position.set(0, topY * 0.22, barrelStartZ - barrelLen * 0.5);
            gun.add(barrel);

            // Classic Military Silhouettes: Gas Tube & Front Sight Triangle (Rifles/SMGs), Folded Bipod (Snipers), Slide Serrations (Pistols)!
            const catLow = String(spec.category || '').toLowerCase();
            if (!ms.isPistol && hgLen > 0.05) {
                // Upper gas tube + gas block
                const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, barrelLen * 0.55, 8), darkMat);
                gasTube.rotation.x = Math.PI * 0.5;
                gasTube.position.set(0, topY * 0.72, barrelStartZ - barrelLen * 0.28);
                const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.028, 0.022), darkMat);
                gasBlock.position.set(0, topY * 0.62, barrelStartZ - barrelLen * 0.56);
                gun.add(gasTube, gasBlock);
            }
            if (catLow.includes('sniper') || catLow.includes('marksman') || catLow.includes('lmg')) {
                // Folded tactical twin bipod legs under the front handguard
                const bpL = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.14, 8), steelMat);
                bpL.rotation.x = Math.PI * 0.5;
                bpL.position.set(-0.024, -0.026, -recL * 0.5 - hgLen * 0.72);
                const bpR = bpL.clone(); bpR.position.x = 0.024;
                gun.add(bpL, bpR);
            }
            if (ms.isPistol) {
                // Pistol slide rear serrations
                for (let sr = 0; sr < 4; sr++) {
                    const rib = new THREE.Mesh(new THREE.BoxGeometry(recW + 0.004, recH * 0.55, 0.004), darkMat);
                    rib.position.set(0, topY * 0.15, recL * 0.22 + sr * 0.011);
                    gun.add(rib);
                }
                // Exposed hammer + beavertail
                const hammer = new THREE.Mesh(new THREE.BoxGeometry(recW * 0.38, 0.016, 0.010), steelMat);
                hammer.position.set(0, topY * 0.55, recL * 0.5 + 0.004);
                hammer.rotation.x = -0.35;
                const beaver = new THREE.Mesh(new THREE.BoxGeometry(recW * 0.70, 0.008, 0.020), accentMat);
                beaver.position.set(0, -recH * 0.5 - 0.004, recL * 0.40);
                gun.add(hammer, beaver);
            } else {
                // Magwell flare, forward assist, dust cover & receiver pins
                const magwell = new THREE.Mesh(new THREE.BoxGeometry(recW * 1.06, 0.020, (ms.magL || 0.04) * 1.35), bodyMat);
                magwell.position.set(0, -recH * 0.5 - 0.008, -0.02);
                const fwdAssist = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.012, 8), steelMat);
                fwdAssist.rotation.z = Math.PI * 0.5;
                fwdAssist.position.set(recW * 0.52 + 0.004, topY * 0.30, recL * 0.18);
                const dustCover = new THREE.Mesh(new THREE.BoxGeometry(0.003, recH * 0.36, recL * 0.30), darkMat);
                dustCover.position.set(recW * 0.505, topY * 0.05, -recL * 0.05);
                gun.add(magwell, fwdAssist, dustCover);
                for (const pz of [recL * 0.30, -recL * 0.32]) {
                    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, recW + 0.004, 6), steelMat);
                    pin.rotation.z = Math.PI * 0.5;
                    pin.position.set(0, -recH * 0.28, pz);
                    gun.add(pin);
                }
                // Handguard cooling vents (non-wood furniture only)
                if (hgLen > 0.06 && !ms.wood) {
                    const ventCount = Math.min(6, Math.max(2, Math.floor(hgLen / 0.035)));
                    const ventMat = new THREE.MeshStandardMaterial({ color: 0x07090d, roughness: 0.9 });
                    for (let v = 0; v < ventCount; v++) {
                        const vz = -recL * 0.5 - (v + 0.7) * (hgLen / (ventCount + 0.4));
                        for (const side of [-1, 1]) {
                            const vent = new THREE.Mesh(new THREE.BoxGeometry(0.002, ms.handguardH * 0.38, 0.012), ventMat);
                            vent.position.set(side * (ms.handguardW * 0.5 + 0.0012), 0.004, vz);
                            gun.add(vent);
                        }
                    }
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

            // Muzzle Attachments (including late-level Titanium Brake, Aether Suppressor & Overpressure Warhead Muzzle!)
            const muz = attachments.muzzle || 'none';
            if (muz === 'suppressor' || muz === 'aether_suppressor') {
                const isAether = muz === 'aether_suppressor';
                const supGeo = new THREE.CylinderGeometry(0.020, 0.020, isAether ? 0.165 : 0.145, 14);
                supGeo.rotateX(Math.PI * 0.5);
                const sup = new THREE.Mesh(supGeo, darkMat);
                sup.position.set(0, topY * 0.22, muzzleZ - (isAether ? 0.080 : 0.070));
                gun.add(sup);
                if (isAether) {
                    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.003, 6, 14), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
                    glowRing.position.set(0, topY * 0.22, muzzleZ - 0.12);
                    gun.add(glowRing);
                }
                muzzleZ -= isAether ? 0.162 : 0.142;
            } else if (muz === 'compensator' || muz === 'overpressure_comp') {
                const isOp = muz === 'overpressure_comp';
                const comp = new THREE.Mesh(new THREE.BoxGeometry(isOp ? 0.032 : 0.026, isOp ? 0.030 : 0.026, isOp ? 0.064 : 0.052), steelMat);
                comp.position.set(0, topY * 0.22, muzzleZ - 0.028);
                gun.add(comp);
                if (isOp) {
                    const opBand = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.008, 0.018), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
                    opBand.position.set(0, topY * 0.22, muzzleZ - 0.032);
                    gun.add(opBand);
                }
                muzzleZ -= isOp ? 0.062 : 0.05;
            } else if (muz === 'muzzle_brake' || muz === 'titanium_brake') {
                const mb = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.024, 0.052), steelMat);
                mb.position.set(0, topY * 0.22, muzzleZ - 0.024);
                gun.add(mb);
                muzzleZ -= 0.050;
            } else {
                const fh = new THREE.Mesh(new THREE.CylinderGeometry(ms.barrelR * 1.25, ms.barrelR * 1.15, 0.028, 10), darkMat);
                fh.rotation.x = Math.PI * 0.5;
                fh.position.set(0, topY * 0.22, muzzleZ - 0.014);
                gun.add(fh);
                muzzleZ -= 0.028;
            }

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, topY * 0.22, muzzleZ);
            gun.add(muzzleAnchor);

            // Stock (respecting no_stock / precision_stock)
            const stockType = attachments.stock || 'std_stock';
            if (ms.stockStyle !== 'none' && stockType !== 'no_stock') {
                const sLen = ms.stockLen * (stockType === 'precision_stock' ? 1.12 : 1.0);
                const stockMat = (ms.wood && stockType !== 'precision_stock') ? accentMat : darkMat;
                if (ms.stockStyle === 'wire' || ms.stockStyle === 'sniper_skeleton') {
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
                    // Cheek riser, rubber buttpad & sling swivel
                    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.014, sLen * 0.55), stockMat);
                    cheek.position.set(0, 0.028, recL * 0.5 + sLen * 0.62);
                    const buttPad = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.074, 0.012),
                        new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.95, metalness: 0.0 }));
                    buttPad.position.set(0, -0.012, recL * 0.5 + sLen + 0.006);
                    const swivel = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.002, 6, 10), steelMat);
                    swivel.rotation.y = Math.PI * 0.5;
                    swivel.position.set(0, -0.050, recL * 0.5 + sLen * 0.80);
                    gun.add(sBody, cheek, buttPad, swivel);
                }
            }

            // Magazine group (animates down on reload)
            const magGroup = new THREE.Group();
            const magChoice = attachments.magazine || 'std_mag';
            const magScaleH = magChoice === 'ext_mags' ? 1.32 : (magChoice === 'fast_mags' ? 1.08 : 1.0);

            if (ms.topMag) {
                const pMag = new THREE.Mesh(new THREE.BoxGeometry(ms.magW, ms.magH, ms.magL), darkMat);
                pMag.position.set(0, topY + ms.magH * 0.45, -0.04);
                magGroup.add(pMag);
            } else if (ms.drumMag || magChoice === 'drum_mag') {
                const drumGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.044, 16);
                drumGeo.rotateX(Math.PI * 0.5);
                const drum = new THREE.Mesh(drumGeo, darkMat);
                drum.position.set(0, -recH * 0.5 - 0.048, -0.03);
                magGroup.add(drum);
            } else if (ms.boxMag) {
                const boxM = new THREE.Mesh(new THREE.BoxGeometry(ms.magW, ms.magH, ms.magL), accentMat);
                boxM.position.set(0.018, -recH * 0.5 - ms.magH * 0.48, -0.03);
                magGroup.add(boxM);
            } else if (!ms.tubeMag) {
                const mGeo = new THREE.BoxGeometry(ms.magW, ms.magH * magScaleH, ms.magL);
                const mMesh = new THREE.Mesh(mGeo, darkMat);
                mMesh.position.set(0, -recH * 0.5 - (ms.magH * magScaleH) * 0.44, ms.isPistol ? recL * 0.24 : -0.02);
                mMesh.rotation.x = ms.isPistol ? 0.28 : -(ms.magCurve || 0.05) * 3.2;
                magGroup.add(mMesh);
                // Baseplate + stamped side ribs (children of the mag so they follow reload animation)
                const magHalf = (ms.magH * magScaleH) * 0.5;
                const basePlate = new THREE.Mesh(new THREE.BoxGeometry(ms.magW * 1.14, 0.008, ms.magL * 1.10), steelMat);
                basePlate.position.set(0, -magHalf - 0.003, 0);
                mMesh.add(basePlate);
                if (!ms.isPistol) {
                    for (const side of [-1, 1]) {
                        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.002, ms.magH * magScaleH * 0.70, ms.magL * 0.30), steelMat);
                        rib.position.set(side * (ms.magW * 0.5 + 0.001), -magHalf * 0.10, 0);
                        mMesh.add(rib);
                    }
                }

                if (magChoice === 'fast_mags') {
                    const pullTab = new THREE.Mesh(new THREE.BoxGeometry(ms.magW * 1.15, 0.016, ms.magL * 1.05),
                        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 }));
                    pullTab.position.set(0, -recH * 0.5 - (ms.magH * magScaleH) * 0.88, -0.02);
                    magGroup.add(pullTab);
                }
            }
            gun.add(magGroup);

            // Underbarrel Foregrip / Tactical Laser
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
                const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xef4444 }));
                emitter.position.set(lx, 0.002, lz - 0.034);
                gun.add(emitter);
                const beamGeo = new THREE.CylinderGeometry(0.0012, 0.0012, 6.0, 6);
                beamGeo.rotateX(Math.PI * 0.5);
                laserBeam = new THREE.Mesh(beamGeo,
                    new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.38 }));
                laserBeam.position.set(lx, 0.002, lz - 3.03);
                gun.add(laserBeam);
            }

            // Optics & Iron Sights — return exact sightY for dead-center ADS!
            const optic = attachments.optic || (ms.defaultScope ? 'sniper_scope' : 'iron');
            let sightY = topY + 0.022;

            if (optic === 'iron') {
                // Rear sight aperture
                const rearL = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.022, 0.018), darkMat);
                rearL.position.set(-0.010, topY + 0.015, recL * 0.34);
                const rearR = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.022, 0.018), darkMat);
                rearR.position.set(0.010, topY + 0.015, recL * 0.34);
                const frontPost = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.024, 0.010), darkMat);
                const frontZ = ms.isPistol ? (-recL * 0.44) : (-recL * 0.5 - Math.max(hgLen, 0.08) * 0.85);
                frontPost.position.set(0, topY + 0.016, frontZ);
                const tritium = new THREE.Mesh(new THREE.BoxGeometry(0.0035, 0.005, 0.004),
                    new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
                tritium.position.set(0, topY + 0.025, frontZ + 0.002);
                gun.add(rearL, rearR, frontPost, tritium);
                sightY = topY + 0.024;
            } else if (optic === 'reflex') {
                const base = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.012, 0.056), darkMat);
                base.position.set(0, topY + 0.010, -0.02);
                const hoodTop = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.005, 0.026), darkMat);
                hoodTop.position.set(0, topY + 0.044, -0.02);
                const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.032, 0.026), darkMat);
                sideL.position.set(-0.014, topY + 0.028, -0.02);
                const sideR = sideL.clone();
                sideR.position.x = 0.014;
                const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.026),
                    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.16, side: THREE.DoubleSide }));
                lens.position.set(0, topY + 0.028, -0.02);
                const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0020, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
                dot.position.set(0, topY + 0.028, -0.02);
                gun.add(base, hoodTop, sideL, sideR, lens, dot);
                sightY = topY + 0.028;
            } else if (optic === 'holo') {
                const base = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.014, 0.072), darkMat);
                base.position.set(0, topY + 0.011, -0.02);
                const hood = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.006, 0.044), darkMat);
                hood.position.set(0, topY + 0.048, -0.02);
                const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.036, 0.044), darkMat);
                sideL.position.set(-0.017, topY + 0.031, -0.02);
                const sideR = sideL.clone();
                sideR.position.x = 0.017;
                const ring = new THREE.Mesh(new THREE.RingGeometry(0.0055, 0.0068, 20),
                    new THREE.MeshBasicMaterial({ color: 0xff3b3b, side: THREE.DoubleSide }));
                ring.position.set(0, topY + 0.031, -0.02);
                const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0016, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xff3b3b }));
                dot.position.set(0, topY + 0.031, -0.02);
                gun.add(base, hood, sideL, sideR, ring, dot);
                sightY = topY + 0.031;
            } else if (optic === 'acog' || optic === 'sniper_scope' || optic === 'var_zoom_20x' || optic === 'thermal_holo' || optic === 'apex_hybrid') {
                const isSniper = (optic === 'sniper_scope' || optic === 'var_zoom_20x');
                const len = isSniper ? 0.22 : 0.115;
                const rad = isSniper ? 0.022 : 0.019;
                const scopeMat = new THREE.MeshStandardMaterial({
                    color: 0x14171c, roughness: 0.45, metalness: 0.78, side: THREE.DoubleSide
                });
                const tubeGeo = new THREE.CylinderGeometry(rad, rad * 0.90, len, 16, 1, !isSniper);
                tubeGeo.rotateX(Math.PI * 0.5);
                const scopeTube = new THREE.Mesh(tubeGeo, scopeMat);
                scopeTube.position.set(0, topY + 0.032, -0.02);
                const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.020, 0.018), steelMat);
                mount1.position.set(0, topY + 0.014, 0.02);
                const mount2 = mount1.clone();
                mount2.position.z = -0.06;
                const lensMat = new THREE.MeshBasicMaterial({ color: isSniper ? 0x0ea5e9 : 0x38bdf8, transparent: true, opacity: isSniper ? 0.26 : 0.14, side: THREE.DoubleSide });
                const glint = new THREE.Mesh(new THREE.CircleGeometry(rad * 0.86, 16), lensMat);
                glint.position.set(0, topY + 0.032, -0.02 - len * 0.48);
                const rearLens = new THREE.Mesh(new THREE.CircleGeometry(rad * 0.82, 16), lensMat);
                rearLens.position.set(0, topY + 0.032, -0.02 + len * 0.48);
                const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0018, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
                dot.position.set(0, topY + 0.032, -0.02);
                gun.add(scopeTube, mount1, mount2, glint, rearLens, dot);
                sightY = topY + 0.032;
            }

            if (withArms) {
                this._attachFirstPersonArms(root, ms.isPistol);
            }

            BO.ArsenalDetails.firearmDetails(gun, spec, attachments, isPaP || (effectiveCamo && effectiveCamo !== 'default'));

            if (isDualWield) {
                const leftGun = gun.clone();
                leftGun.position.set(withArms ? -0.36 : -0.16, 0, 0.02);
                if (!withArms) gun.position.x = 0.16;
                root.add(leftGun);
            }

            return {
                root,
                gun,
                magGroup,
                boltGroup,
                muzzleAnchor,
                laserBeam,
                sightY
            };
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
            const shellColor = isPaP ? 0x1e293b : 0xb91c1c;
            const energyColor = isPaP ? 0xf43f5e : 0x22ff77;
            const bodyMat = new THREE.MeshStandardMaterial({ color: shellColor, roughness: 0.28, metalness: 0.82 });
            const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.95 });
            const glowMat = new THREE.MeshBasicMaterial({ color: energyColor });

            const body = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.062, 0.22), bodyMat);
            gun.add(body);

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

            const magGroup = new THREE.Group();
            const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.055, 12), glowMat);
            cell.position.set(0, 0.042, 0.02);
            magGroup.add(cell);
            gun.add(magGroup);

            const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.095, 0.040), chromeMat);
            grip.position.set(0, -0.056, 0.06);
            grip.rotation.x = 0.30;
            gun.add(grip);

            const rearRing = new THREE.Mesh(new THREE.RingGeometry(0.008, 0.012, 14), glowMat);
            rearRing.position.set(0, 0.055, 0.09);
            gun.add(rearRing);

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0.006, -0.25);
            gun.add(muzzleAnchor);

            if (withArms) this._attachFirstPersonArms(root, true);

            return { root, gun, magGroup, boltGroup: new THREE.Group(), muzzleAnchor, laserBeam: null, sightY: 0.055 };
        }

        _buildThundergun(root, gun, spec, isPaP, withArms) {
            const drumColor = isPaP ? 0x6d28d9 : 0x3b424c;
            const glowColor = isPaP ? 0xf0abfc : 0x38bdf8;
            const hullMat = new THREE.MeshStandardMaterial({ color: drumColor, roughness: 0.36, metalness: 0.78 });
            const steelMat = new THREE.MeshStandardMaterial({ color: 0x1c2026, roughness: 0.45, metalness: 0.85 });
            const glowMat = new THREE.MeshBasicMaterial({ color: glowColor });

            const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.44, 16), hullMat);
            drum.rotation.x = Math.PI * 0.5;
            drum.position.set(0, 0, -0.06);
            gun.add(drum);

            const muzzleMouth = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.056, 0.14, 16), steelMat);
            muzzleMouth.rotation.x = Math.PI * 0.5;
            muzzleMouth.position.set(0, 0, -0.34);
            gun.add(muzzleMouth);

            for (let i = 0; i < 4; i++) {
                const coil = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.005, 8, 18), glowMat);
                coil.position.set(0, 0, -0.18 - i * 0.055);
                gun.add(coil);
            }

            const magGroup = new THREE.Group();
            const cell = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.085, 0.095), glowMat);
            cell.position.set(0, -0.055, 0.04);
            magGroup.add(cell);
            gun.add(magGroup);

            const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.095, 0.042), steelMat);
            grip.position.set(0, -0.065, 0.12);
            grip.rotation.x = 0.25;
            gun.add(grip);

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0, -0.43);
            gun.add(muzzleAnchor);

            if (withArms) this._attachFirstPersonArms(root, false);

            return { root, gun, magGroup, boltGroup: new THREE.Group(), muzzleAnchor, laserBeam: null, sightY: 0.072 };
        }

        _buildMegaBuster(root, gun, spec, isPaP, withArms) {
            // Iconic Mega Man Arm Cannon: Cobalt Blue + Sky Cyan + Tapered Muzzle Collar + Glowing Plasma Core
            const cobaltMat = new THREE.MeshStandardMaterial({
                color: isPaP ? 0x6d28d9 : 0x1d4ed8, roughness: 0.22, metalness: 0.68
            });
            const skyTrimMat = new THREE.MeshStandardMaterial({
                color: isPaP ? 0xc084fc : 0x0ea5e9, roughness: 0.25, metalness: 0.55
            });
            const darkCollarMat = new THREE.MeshStandardMaterial({
                color: 0x111827, roughness: 0.35, metalness: 0.85
            });
            const stripMat = new THREE.MeshStandardMaterial({
                color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9, roughness: 0.2
            });

            // 1. Wrist gauntlet connector cuff (rear)
            const cuffGeo = new THREE.CylinderGeometry(0.068, 0.060, 0.14, 20);
            cuffGeo.rotateX(Math.PI * 0.5);
            const cuff = new THREE.Mesh(cuffGeo, skyTrimMat);
            cuff.position.set(0, 0, 0.09);

            // 2. Iconic bulbous cylindrical forearm cannon body
            const mainCylGeo = new THREE.CylinderGeometry(0.088, 0.076, 0.28, 22);
            mainCylGeo.rotateX(Math.PI * 0.5);
            const mainCyl = new THREE.Mesh(mainCylGeo, cobaltMat);
            mainCyl.position.set(0, 0, -0.09);

            // Smooth domed shoulder bulb at cannon mid-back
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.089, 18, 14), cobaltMat);
            dome.scale.set(1, 1, 1.15);
            dome.position.set(0, 0, -0.02);

            // White/silver accent chevron fin along top curve + aim bead
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.026, 0.18), skyTrimMat);
            fin.position.set(0, 0.088, -0.10);
            const frontBead = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
            frontBead.position.set(0, 0.104, -0.20);

            // 3. Stepped dark gunmetal muzzle nozzle + glowing bore ring
            const frontConeGeo = new THREE.CylinderGeometry(0.056, 0.088, 0.11, 22);
            frontConeGeo.rotateX(Math.PI * 0.5);
            const frontCone = new THREE.Mesh(frontConeGeo, cobaltMat);
            frontCone.position.set(0, 0, -0.27);

            const collarGeo = new THREE.CylinderGeometry(0.052, 0.058, 0.065, 22);
            collarGeo.rotateX(Math.PI * 0.5);
            const collar = new THREE.Mesh(collarGeo, darkCollarMat);
            collar.position.set(0, 0, -0.34);

            const boreGlow = new THREE.Mesh(
                new THREE.CircleGeometry(0.044, 20),
                new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
            );
            boreGlow.position.set(0, 0, -0.373);

            // Side Plasma Charge Indicator Bars
            const barGeo = new THREE.BoxGeometry(0.012, 0.018, 0.19);
            const barL = new THREE.Mesh(barGeo, stripMat);
            barL.position.set(-0.086, 0.006, -0.11);
            const barR = new THREE.Mesh(barGeo, stripMat);
            barR.position.set(0.086, 0.006, -0.11);

            // Rear Cyan Wrist Band Torus
            const wristRing = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.009, 10, 22), skyTrimMat);
            wristRing.position.set(0, 0, 0.025);

            // Under-slung energy core capacitor cell (animates on reload)
            const magGroup = new THREE.Group();
            const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.09, 12), stripMat);
            cell.rotation.x = Math.PI * 0.5;
            cell.position.set(0, -0.072, -0.06);
            magGroup.add(cell);

            gun.add(cuff, mainCyl, dome, fin, frontBead, frontCone, collar, boreGlow, barL, barR, wristRing, magGroup);

            // Live Charging Orb & Concentric Rings mounted on Muzzle Anchor
            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0, -0.39);
            gun.add(muzzleAnchor);

            const chargeOrbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 });
            const chargeOrbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 14), chargeOrbMat);
            const chargeCoreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10),
                new THREE.MeshBasicMaterial({ color: 0xffffff }));
            chargeOrbMesh.add(chargeCoreMesh);
            chargeOrbMesh.visible = false;
            muzzleAnchor.add(chargeOrbMesh);

            const chargeRingMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.78 });
            const chargeRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.006, 8, 24), chargeRingMat);
            const chargeRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.005, 8, 24), chargeRingMat);
            chargeRing1.visible = false;
            chargeRing2.visible = false;
            muzzleAnchor.add(chargeRing1, chargeRing2);

            if (withArms) {
                // Mega Man armored blue sleeves/gauntlet
                const rSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.060, 0.30, 14), skyTrimMat);
                rSleeve.rotation.x = Math.PI * 0.5;
                rSleeve.position.set(0.02, -0.01, 0.24);
                const lArm = new THREE.Group();
                const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.34, 12), cobaltMat);
                lFore.rotation.set(Math.PI * 0.5 + 0.16, 0.38, 0);
                lFore.position.set(-0.12, -0.075, 0.06);
                const lGlove = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.048, 0.078), skyTrimMat);
                lGlove.position.set(-0.02, -0.048, -0.09);
                lArm.add(lFore, lGlove);
                root.add(rSleeve, lArm);
            }

            return {
                root, gun, magGroup, boltGroup: new THREE.Group(),
                muzzleAnchor, laserBeam: null, sightY: 0.098,
                chargeOrbMesh, chargeOrbMat, chargeRings: [chargeRing1, chargeRing2],
                chargeRingMat, chargeStripMat: stripMat, boreGlow
            };
        }

        _buildMinigun(root, gun, spec, camoId, isPaP, withArms) {
            const ms = spec.modelSpec;
            const bodyMat = BO.Textures.getCamoMaterial(camoId, ms.primaryColor || 0x262b33, isPaP);
            const steelMat = this._darkMat(0x475569, 0.28, 0.90);
            const darkMat = this._darkMat(0x14171c, 0.45, 0.78);

            // Main rotary motor housing
            const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.062, 0.28, 16), bodyMat);
            housing.rotation.x = Math.PI * 0.5;
            housing.position.set(0, -0.02, 0.04);

            // Top chainsaw carry handle
            const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.020, 0.24), darkMat);
            handleBar.position.set(0, 0.088, -0.02);
            const handlePostF = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.075, 0.024), darkMat);
            handlePostF.position.set(0, 0.048, -0.12);
            const handlePostR = handlePostF.clone();
            handlePostR.position.z = 0.09;

            // Rear vertical firing handle
            const rearGrip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.11, 0.040), darkMat);
            rearGrip.position.set(0, -0.06, 0.20);
            rearGrip.rotation.x = 0.22;

            // Underslung 200-round Drum Ammo Box
            const magGroup = new THREE.Group();
            const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.14), bodyMat);
            ammoBox.position.set(0.05, -0.10, -0.02);
            magGroup.add(ammoBox);

            // 6-Barrel Rotary Cluster inside boltGroup (spins around Z!)
            const boltGroup = new THREE.Group();
            boltGroup.position.set(0, -0.02, -0.32);
            const ringR = 0.032;
            const bGeo = new THREE.CylinderGeometry(0.0085, 0.0085, 0.44, 8);
            bGeo.rotateX(Math.PI * 0.5);
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const b = new THREE.Mesh(bGeo, steelMat);
                b.position.set(Math.cos(a) * ringR, Math.sin(a) * ringR, 0);
                boltGroup.add(b);
            }
            const clamp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.024, 16), darkMat);
            clamp1.rotation.x = Math.PI * 0.5;
            clamp1.position.z = -0.16;
            const clamp2 = clamp1.clone();
            clamp2.position.z = 0.06;
            boltGroup.add(clamp1, clamp2);

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, -0.02, -0.55);

            gun.add(housing, handleBar, handlePostF, handlePostR, rearGrip, magGroup, boltGroup, muzzleAnchor);
            if (withArms) this._attachFirstPersonArms(root, false);

            return {
                root, gun, magGroup, boltGroup, muzzleAnchor,
                laserBeam: null, sightY: 0.105, isRotarySpin: true
            };
        }

        _buildMeleeWeapon(root, gun, spec, camoId, isPaP, withArms) {
            const ms = spec.modelSpec;
            const bladeMat = BO.Textures.getCamoMaterial(camoId, ms.primaryColor || 0xcbd5e1, isPaP);
            const handleMat = this._darkMat(ms.accentColor || 0x1e293b, 0.65, 0.35);
            const glowHex = isPaP ? 0xc084fc : (ms.glowColor || 0);
            const glowMat = glowHex ? new THREE.MeshBasicMaterial({ color: glowHex }) : bladeMat;

            const shape = ms.meleeShape || 'knife';
            if (shape === 'knife') {
                const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.13, 10), handleMat);
                handle.position.set(0, -0.02, 0.05);
                handle.rotation.x = 1.15;
                const guard = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.012, 0.022), handleMat);
                guard.position.set(0, 0.03, -0.01);
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.036, 0.24), bladeMat);
                blade.position.set(0, 0.045, -0.13);
                gun.add(handle, guard, blade);
            } else if (shape === 'sword') {
                const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.18, 10), handleMat);
                handle.position.set(0, -0.04, 0.08);
                handle.rotation.x = 0.85;
                const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.012, 12), handleMat);
                guard.position.set(0, 0.02, 0.0);
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.034, 0.56), bladeMat);
                blade.position.set(0, 0.08, -0.26);
                blade.rotation.x = 0.18;
                gun.add(handle, guard, blade);
                if (glowHex) {
                    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.006, 0.55), glowMat);
                    edge.position.set(0, 0.096, -0.26);
                    edge.rotation.x = 0.18;
                    gun.add(edge);
                }
            } else if (shape === 'axe') {
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.46, 10), handleMat);
                shaft.position.set(0, 0.02, -0.08);
                shaft.rotation.x = 1.05;
                const head = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.14, 0.16), bladeMat);
                head.position.set(0, 0.11, -0.26);
                gun.add(shaft, head);
            } else if (shape === 'baton' || shape === 'crowbar') {
                const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 12), bladeMat);
                rod.position.set(0, 0.04, -0.12);
                rod.rotation.x = 1.15;
                gun.add(rod);
                if (shape === 'baton') {
                    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), glowMat);
                    tip.position.set(0, 0.13, -0.34);
                    gun.add(tip);
                } else {
                    const hook = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.075, 0.045), bladeMat);
                    hook.position.set(0, 0.14, -0.34);
                    gun.add(hook);
                }
            } else if (shape === 'hammer') {
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.56, 10), handleMat);
                shaft.position.set(0, 0.02, -0.12);
                shaft.rotation.x = 1.10;
                const block = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.22), bladeMat);
                block.position.set(0, 0.14, -0.36);
                gun.add(shaft, block);
            } else if (shape === 'chainsaw') {
                const motor = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.22), bladeMat);
                motor.position.set(0, -0.01, 0.02);
                const bar = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.068, 0.44), handleMat);
                bar.position.set(0, 0.01, -0.28);
                const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.076, 0.45), this._darkMat(0xe2e8f0, 0.25, 0.9));
                teeth.position.set(0, 0.01, -0.28);
                gun.add(motor, bar, teeth);
            } else if (shape === 'scythe') {
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.68, 10), handleMat);
                pole.position.set(0, 0.04, -0.15);
                pole.rotation.x = 1.12;
                const crescent = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.28, 0.12), glowMat);
                crescent.position.set(0, 0.19, -0.44);
                crescent.rotation.x = -0.45;
                gun.add(pole, crescent);
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

            if (ms.wonderType === 'staff') {
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.64, 12), hullMat);
                shaft.rotation.x = Math.PI * 0.5;
                shaft.position.set(0, 0, -0.14);
                const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 1), glowMat);
                orb.position.set(0, 0.01, -0.48);
                const halo = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.008, 8, 20), hullMat);
                halo.position.set(0, 0.01, -0.48);
                gun.add(shaft, orb, halo);
            } else if (ms.wonderType === 'tesla') {
                const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.075, 0.34), hullMat);
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.28, 12), hullMat);
                barrel.rotation.x = Math.PI * 0.5;
                barrel.position.set(0, 0.01, -0.28);
                for (let i = 0; i < 3; i++) {
                    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), glowMat);
                    bulb.position.set(0.038, 0.03, -0.08 * i);
                    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 8, 16), glowMat);
                    ring.position.set(0, 0.01, -0.18 - i * 0.08);
                    gun.add(bulb, ring);
                }
                gun.add(receiver, barrel);
            } else if (ms.wonderType === 'skull' || ms.wonderType === 'tome') {
                const core = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.16), hullMat);
                core.position.set(0, 0.02, -0.18);
                const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), glowMat);
                eyeL.position.set(-0.03, 0.04, -0.26);
                const eyeR = eyeL.clone();
                eyeR.position.x = 0.03;
                const crown = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.007, 8, 18), glowMat);
                crown.position.set(0, 0.08, -0.18);
                crown.rotation.x = Math.PI * 0.5;
                gun.add(core, eyeL, eyeR, crown);
            }

            const muzzleAnchor = new THREE.Object3D();
            muzzleAnchor.position.set(0, 0.02, -0.46);
            gun.add(muzzleAnchor);

            if (withArms) this._attachFirstPersonArms(root, false);
            return { root, gun, magGroup: new THREE.Group(), boltGroup: new THREE.Group(), muzzleAnchor, laserBeam: null, sightY: 0.068 };
        }

        _attachFirstPersonArms(root, isPistol) {
            const clothMap = BO.Textures && BO.Textures.createZombieClothTexture ? BO.Textures.createZombieClothTexture(0x283226) : null;
            const gloveMap = BO.Textures && BO.Textures.createPolymerGripTexture ? BO.Textures.createPolymerGripTexture() : null;
            const sleeveMat = new THREE.MeshStandardMaterial({ color: clothMap ? 0xffffff : 0x2c3429, map: clothMap, roughness: 0.88, metalness: 0.06 });
            const gloveMat = new THREE.MeshStandardMaterial({ color: gloveMap ? 0xffffff : 0x15181d, map: gloveMap, roughness: 0.65, metalness: 0.24 });
            const accentMat = new THREE.MeshStandardMaterial({ color: 0x3f4754, roughness: 0.45, metalness: 0.48 });
            const skinMat = new THREE.MeshStandardMaterial({ color: 0xb98b6c, roughness: 0.72, metalness: 0.04 });

            // Right firing hand & tactical forearm
            const rArm = new THREE.Group();
            const rForearm = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.066, 0.34), sleeveMat);
            rForearm.position.set(0.055, -0.085, 0.24);
            rForearm.rotation.set(0.18, -0.18, 0);
            const rGlove = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.058, 0.082), gloveMat);
            rGlove.position.set(0.01, -0.052, 0.085);
            const rGuard = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.018, 0.042), accentMat);
            rGuard.position.set(0.01, -0.025, 0.085);
            rArm.add(rForearm, rGlove, rGuard);
            root.add(rArm);

            // Left support hand & forearm gripping handguard + glowing tactical wristwatch!
            const lArm = new THREE.Group();
            const lForearm = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.064, 0.36), sleeveMat);
            const targetZ = isPistol ? 0.05 : -0.14;
            const targetX = isPistol ? -0.038 : -0.045;
            lForearm.position.set(targetX - 0.08, -0.075, targetZ + 0.19);
            lForearm.rotation.set(0.15, 0.42, 0);
            const lGlove = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.048, 0.080), gloveMat);
            lGlove.position.set(isPistol ? -0.014 : -0.008, isPistol ? -0.050 : -0.024, targetZ);
            const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.014, 0.042), skinMat);
            knuckle.position.set(isPistol ? -0.014 : -0.008, isPistol ? -0.032 : -0.006, targetZ);
            const lBrace = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.020, 0.034), accentMat);
            lBrace.position.set(isPistol ? -0.018 : -0.018, isPistol ? -0.048 : -0.022, targetZ + 0.038);
            const watchFace = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.006, 0.022), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
            watchFace.position.set(isPistol ? -0.018 : -0.018, isPistol ? -0.037 : -0.011, targetZ + 0.038);
            lArm.add(lForearm, lGlove, knuckle, lBrace, watchFace);
            root.add(lArm);
        }
    }

    BO.WeaponMesh = new WeaponMeshBuilder();
})(window);
