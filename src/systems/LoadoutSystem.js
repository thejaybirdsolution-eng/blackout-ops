/* ============================================================================
   BLACKOUT OPS — Create-a-Class & Stat Calculation System
   Manages 10 Custom Classes and merges weapon base stats + 5 attachments + Perks
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class LoadoutSystem {
        getClasses() {
            return BO.Save.data.classes;
        }

        getSelectedClassIndex() {
            return BO.Math.clamp(BO.Save.data.selectedClassIndex || 0, 0, 9);
        }

        setSelectedClassIndex(idx) {
            BO.Save.data.selectedClassIndex = BO.Math.clamp(idx, 0, 9);
            BO.Save.save();
        }

        getActiveClass() {
            return BO.Save.data.classes[this.getSelectedClassIndex()];
        }

        getClass(idx) {
            return BO.Save.data.classes[BO.Math.clamp(idx, 0, 9)];
        }

        renameClass(idx, name) {
            const cls = this.getClass(idx);
            cls.name = (String(name || '').trim() || ('CLASS ' + (idx + 1))).slice(0, 22).toUpperCase();
            BO.Save.save();
        }

        copyClass(fromIdx, toIdx) {
            const src = BO.Math.deepClone(this.getClass(fromIdx));
            src.id = toIdx;
            src.name = src.name.slice(0, 18) + ' CP';
            BO.Save.data.classes[toIdx] = src;
            BO.Save.save();
        }

        setWeapon(idx, slot, weaponId) {
            const cls = this.getClass(idx);
            const spec = BO.WeaponsData.get(weaponId);
            cls[slot] = {
                id: weaponId,
                camo: 'default',
                attachments: {
                    optic: spec.modelSpec.defaultScope ? 'sniper_scope' : 'iron',
                    muzzle: 'none',
                    underbarrel: 'none',
                    magazine: 'std_mag',
                    stock: 'std_stock'
                }
            };
            BO.Save.save();
        }

        setAttachment(idx, slot, attSlot, attId) {
            const cls = this.getClass(idx);
            if (!cls[slot].attachments) cls[slot].attachments = {};
            cls[slot].attachments[attSlot] = attId;
            BO.Save.save();
        }

        setCamo(idx, slot, camoId) {
            const cls = this.getClass(idx);
            cls[slot].camo = camoId;
            BO.Save.save();
        }

        setEquipment(idx, kind, id) {
            const cls = this.getClass(idx);
            cls[kind] = id;
            BO.Save.save();
        }

        setPerk(idx, tierIndex, perkId) {
            const cls = this.getClass(idx);
            cls.perks[tierIndex] = perkId;
            // If overkill removed from tier 1 and secondary is primary weapon, revert secondary to m1911
            if (tierIndex === 0 && perkId !== 'overkill') {
                const secSpec = BO.WeaponsData.get(cls.secondary.id);
                if (secSpec.slotType === 'primary') {
                    this.setWeapon(idx, 'secondary', 'm1911');
                }
            }
            BO.Save.save();
        }

        setKillstreak(idx, ksIndex, ksId) {
            const cls = this.getClass(idx);
            // Prevent duplicates: swap if already equipped in another slot
            const existing = cls.killstreaks.indexOf(ksId);
            if (existing !== -1 && existing !== ksIndex) {
                cls.killstreaks[existing] = cls.killstreaks[ksIndex];
            }
            cls.killstreaks[ksIndex] = ksId;
            BO.Save.save();
        }

        /**
         * Computes merged runtime weapon statistics from Base Weapon + 5 Attachments + PaP status + Perks
         */
        computeWeaponStats(weaponCfg, isPaPOrTier = false, perks = [], isDualWield = false) {
            const papTier = typeof isPaPOrTier === 'number' ? isPaPOrTier : (isPaPOrTier ? 1 : 0);
            const isPaP = papTier > 0;
            const base = BO.WeaponsData.get(weaponCfg.id);
            const dual = !!(isDualWield || (isPaP && base.canDualWield));
            const atts = weaponCfg.attachments || {};

            let damage = base.damage;
            let headMult = base.headMult;
            let range = base.range;
            let adsTime = base.adsTime;
            const opticId = (atts && atts.optic) ? atts.optic : (base.isSniperScope ? 'sniper_scope' : 'iron');
            let adsFov = base.adsFov;
            if (base.isSniperScope && opticId !== 'sniper_scope' && opticId !== 'var_zoom_20x') {
                // Non-sniper optics on sniper rifles replace the sniper zoom with standard optic FOV & snappy ADS!
                adsFov = 62;
                const snappyMap = { iron: 0.78, reflex: 0.82, holo: 0.86, acog: 0.92 };
                adsTime *= (snappyMap[opticId] || 0.85);
            }
            let recoilMult = 1.0;
            let attachmentRPM = 1.0;
            let attachmentPenetration = 0;
            let hipSpread = base.hipSpread;
            let adsSpread = base.adsSpread;
            let magMult = 1.0;
            let reloadMult = 1.0;
            let moveMult = base.moveMult;
            let suppressed = false;
            let showLaser = false;
            let useScopeOverlay = (opticId === 'sniper_scope' || opticId === 'var_zoom_20x');
            let variableZoom = (opticId === 'var_zoom_20x');
            let minZoom = 1.0;
            let maxZoom = 20.0;

            const resolvedAtts = Object.assign({}, atts, { optic: opticId });

            for (const slot of ['optic', 'muzzle', 'underbarrel', 'magazine', 'stock']) {
                const att = BO.AttachmentsData.getAttachment(slot, resolvedAtts[slot]);
                if (!att || !att.mods) continue;
                const m = att.mods;
                if (m.weaponCategory && m.weaponCategory !== base.category) continue;
                if (m.rpm) attachmentRPM *= m.rpm;
                if (m.penetration) attachmentPenetration += m.penetration;
                if (m.damage) damage *= m.damage;
                if (m.range) range *= m.range;
                if (m.adsTime) adsTime *= m.adsTime;
                if (m.adsFovOffset) adsFov = BO.Math.clamp(adsFov + m.adsFovOffset, 22, 74);
                if (m.recoil) recoilMult *= m.recoil;
                if (m.hipSpread) hipSpread *= m.hipSpread;
                if (m.adsSpread) adsSpread *= m.adsSpread;
                if (m.magMult) magMult *= m.magMult;
                if (m.reloadMult) reloadMult *= m.reloadMult;
                if (m.moveMult) moveMult *= m.moveMult;
                if (m.suppressed) suppressed = true;
                if (m.showLaser) showLaser = true;
                if (slot === 'optic') {
                    useScopeOverlay = !!m.useScopeOverlay;
                    variableZoom = !!m.variableZoom;
                    if (m.minZoom) minZoom = m.minZoom;
                    if (m.maxZoom) maxZoom = m.maxZoom;
                } else if (m.useScopeOverlay) {
                    useScopeOverlay = true;
                }
            }

            if (perks.includes('stopping_power') && base.kind === 'gun') damage *= 1.15;
            if (perks.includes('steady_aim')) hipSpread *= 0.70;
            if (perks.includes('sleight_of_hand')) reloadMult *= 0.72;
            const weaponPerks = perks.map((id) => BO.AttachmentsData.PERKS[id]?.weaponMods).filter(Boolean);
            for (const mod of weaponPerks) {
                damage *= mod.damage || 1;
                range *= mod.range || 1;
                recoilMult *= mod.recoil || 1;
                adsSpread *= mod.adsSpread || 1;
                adsTime *= mod.adsTime || 1;
                headMult *= mod.headMult || 1;
            }

            let fireMode = base.fireMode;
            let rpm = base.rpm * attachmentRPM;
            let explosiveRadius = base.explosiveRadius || 0;
            let penetration = (base.penetration || 0) + attachmentPenetration;
            let magSize = Math.round(base.magSize * magMult);
            let reserveMax = Math.round(base.reserveMax * magMult);

            if (isPaP) {
                const tierDmgBoost = papTier === 1 ? 1.0 : (papTier === 2 ? 1.75 : 2.85);
                const tierMagBoost = papTier === 1 ? 1.0 : (papTier === 2 ? 1.25 : 1.5);
                damage *= (base.papDamageMult || 2.3) * tierDmgBoost;
                magSize = Math.round(magSize * (base.papMagMult || 2.0) * tierMagBoost);
                reserveMax = Math.round(reserveMax * (1.6 + (papTier - 1) * 0.4));
                reloadMult *= Math.pow(0.88, papTier);
                if (base.papEffect === 'full_auto_convert') fireMode = 'auto';
                if (base.papEffect === 'overdrive') rpm = Math.round(rpm * (1.2 + papTier * 0.06));
                if (base.papEffect === 'pierce_5') penetration = 5 + papTier;
                if (base.papExplosiveRadius) explosiveRadius = base.papExplosiveRadius + (papTier - 1) * 0.5;
            }

            if (base.kind !== 'melee' && (base.kind || 'gun') === 'gun') {
                for (const mod of weaponPerks) {
                    rpm = Math.round(rpm * (mod.rpm || 1));
                    explosiveRadius *= mod.radius || 1;
                    penetration += mod.penetration || 0;
                    magSize = Math.round(magSize * (mod.mag || 1));
                    reserveMax = Math.round(reserveMax * (mod.reserve || 1));
                }
            }
            const matchRules = BO.State.activeMode === 'mp' ? BO.MPMode.customRules : {};
            if ((base.kind || 'gun') === 'gun') {
                if (matchRules.oneInChamber) magSize = 1;
                if (matchRules.slowFire) rpm *= 0.5;
                if (matchRules.fastFire) rpm *= 2;
                if (matchRules.slowReload) reloadMult *= 2;
            }
            const tierRoman = papTier === 1 ? ' I' : (papTier === 2 ? ' II' : (papTier >= 3 ? ' III' : ''));
            const finalMagSize = dual && !matchRules.oneInChamber ? magSize * 2 : magSize;
            const finalPellets = dual ? (base.pellets || 1) * 2 : (base.pellets || 1);
            const finalRpm = dual ? Math.round(rpm * 1.45) : rpm;
            const dispName = isPaP ? (base.papName + tierRoman) : (dual ? ('AKIMBO ' + base.name) : base.name);
            const dispShort = isPaP ? (base.papName + tierRoman) : (dual ? ('AKIMBO ' + base.shortName) : base.shortName);

            const fireModes = [fireMode];
            if (base.category === 'Assault Rifle' && ['masterkey', 'underbarrel_launcher', 'underbarrel_flame'].includes(atts.underbarrel)) {
                fireModes.push(atts.underbarrel);
            }
            if (base.altFireMode && !fireModes.includes(base.altFireMode)) fireModes.push(base.altFireMode);
            if (base.kind !== 'melee' && (fireMode === 'auto' || base.altFireMode === 'auto') && !fireModes.includes('semi')) {
                const autoIdx = fireModes.indexOf('auto');
                fireModes.splice(autoIdx + 1, 0, 'semi');
            }
            const altFireMode = fireModes.length > 1 ? fireModes[1] : null;

            return {
                id: base.id,
                name: dispName,
                shortName: dispShort,
                isDualWield: dual,
                canDualWield: !!base.canDualWield,
                papTier,
                category: base.category,
                kind: base.kind || 'gun',
                tier: base.tier || 'common',
                cleave: (base.cleave || 1) + (isPaP && base.kind === 'melee' ? 1 : 0),
                meleeEffect: base.meleeEffect || null,
                magicType: base.magicType || null,
                magicColor: base.magicColor || 0x22ff77,
                fireMode,
                altFireMode,
                fireModes,
                burstCount: base.burstCount || 1,
                burstDelay: base.burstDelay || 0.06,
                rpm: finalRpm,
                damage: Math.round(damage),
                headMult,
                range,
                pellets: finalPellets,
                magSize: finalMagSize,
                reserveMax: dual ? Math.round(reserveMax * 1.5) : reserveMax,
                reloadTime: base.reloadTime * reloadMult,
                shellReload: !!base.shellReload,
                adsTime,
                adsFov,
                useScopeOverlay,
                variableZoom,
                minZoom,
                maxZoom,
                opticId,
                chargeMaxTime: base.chargeMaxTime || 0,
                chargeMaxScale: base.chargeMaxScale || 1,
                hipSpread,
                adsSpread,
                recoilPitch: base.recoilPitch * recoilMult,
                recoilYaw: base.recoilYaw * recoilMult,
                moveMult,
                penetration,
                explosiveRadius,
                meleeReach: atts.underbarrel === 'bayonet' ? 0.75 : 0,
                isConeBlast: !!base.isConeBlast,
                coneHalfAngle: base.coneHalfAngle || 0.4,
                suppressed,
                showLaser,
                isPaP,
                papEffect: isPaP ? base.papEffect : null,
                soundProfile: base.soundProfile,
                hipPos: base.hipPos,
                adsPos: base.adsPos,
                muzzleOffset: base.muzzleOffset,
                ejectOffset: base.ejectOffset,
                camo: weaponCfg.camo || 'default',
                attachments: Object.assign({}, atts)
            };
        }

        /**
         * Returns normalized 0..100 stat bars for Gunsmith UI display
         */
        computeStatBars(weaponCfg) {
            const s = this.computeWeaponStats(weaponCfg, false, []);
            const base = BO.WeaponsData.get(weaponCfg.id);
            const dps = s.damage * s.pellets;
            const damageBar = BO.Math.clamp((dps / 135) * 100, 12, 100);
            const fireRateBar = BO.Math.clamp((s.rpm / 950) * 100, 10, 100);
            const rangeBar = BO.Math.clamp((s.range / 95) * 100, 12, 100);
            const accuracyBar = BO.Math.clamp(100 - (s.adsSpread * 1100), 18, 98);
            const controlBar = BO.Math.clamp(100 - ((s.recoilPitch + s.recoilYaw) * 850), 15, 96);
            const mobilityBar = BO.Math.clamp((s.moveMult - 0.72) * 260 + (0.35 - s.adsTime) * 120, 18, 98);
            return {
                damage: Math.round(damageBar),
                fireRate: Math.round(fireRateBar),
                range: Math.round(rangeBar),
                accuracy: Math.round(accuracyBar),
                control: Math.round(controlBar),
                mobility: Math.round(mobilityBar),
                magSize: s.magSize,
                adsMs: Math.round(s.adsTime * 1000),
                rpm: s.rpm,
                baseName: base.name
            };
        }
    }

    BO.Loadout = new LoadoutSystem();
})(window);
