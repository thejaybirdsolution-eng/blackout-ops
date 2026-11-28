/* ============================================================================
   BLACKOUT OPS — Combat, Hitscan Penetration, Projectiles, Melee & Killstreaks
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const _tmpEject = new THREE.Vector3();
    const _tmpShotDir = new THREE.Vector3();
    const _tmpCastDir = new THREE.Vector3();
    const _tmpHoming = new THREE.Vector3();
    const _tmpBestTo = new THREE.Vector3();
    const _tmpMuzzle = new THREE.Vector3();
    const _tmpEnd = new THREE.Vector3();
    const _tmpNorm = new THREE.Vector3();
    const _tmpRefl = new THREE.Vector3();
    const _tmpOrig = new THREE.Vector3();

    class CombatSystem {
        constructor() {
            this.raycaster = new THREE.Raycaster();
            this.projectiles = []; // grenades, semtex, c4, flashbang, monkey_bomb, raygun bolts, pokeball
            this.c4Charges = [];
            this.napalmPools = [];
            this.smokeClouds = [];
            this.activePokemonAllies = [];
            this.activeMonkeyBomb = null;
            this.targetPool = []; // Enemy meshes populated by active game mode
            this.onHitEnemy = null; // Callback (entity, dmg, hitbox, isCrit, weaponId, impactPos, rayDir)
            this.onExplodeAt = null; // Callback (pos, radius, damage, owner, isFlash, stunDur, weaponId)
            this.onActivateKillstreak = null;
            this.camera = null;
            this.busterCharging = false;
            this.busterChargeTime = 0;
            this.busterSoundAccum = 0;
            this.fistCharging = false;
            this.fistChargeTime = 0;
        }

        reset(camera) {
            BO.Superpowers.reset();
            this.lastTriggerTime = -Infinity;
            this.frozenTrigger = false;
            this.openingShot = false;
            this.camera = camera;
            this.busterCharging = false;
            this.busterChargeTime = 0;
            this.busterSoundAccum = 0;
            this.fistCharging = false;
            this.fistChargeTime = 0;
            for (const p of this.projectiles) {
                if (p.mesh && BO.World.scene) BO.World.scene.remove(p.mesh);
            }
            for (const np of this.napalmPools) {
                if (np.group && BO.World.scene) BO.World.scene.remove(np.group);
            }
            for (const pk of this.activePokemonAllies) {
                if (pk.group && BO.World.scene) BO.World.scene.remove(pk.group);
            }
            this.projectiles = [];
            this.c4Charges = [];
            this.napalmPools = [];
            this.smokeClouds = [];
            this.activePokemonAllies = [];
            this.activeMonkeyBomb = null;
            this.targetPool = [];
        }

        setTargetPool(meshes) {
            this.targetPool = meshes || [];
        }

        /**
         * Raycasts the current ray (this.raycaster) against the target pool with an
         * entity broad-phase: only enemies whose bounding sphere the ray passes through
         * get the per-triangle test. Pool meshes are grouped once per pool array.
         */
        _castTargets() {
            const pool = this.targetPool;
            const rc = this.raycaster;
            if (pool.length < 40 || !BO.Hitboxes) return rc.intersectObjects(pool, false);
            if (this._groupedPool !== pool) {
                this._groupedPool = pool;
                const byEnt = this._poolGroups || (this._poolGroups = new Map());
                byEnt.clear();
                const loose = this._poolLoose || (this._poolLoose = []);
                loose.length = 0;
                for (let i = 0; i < pool.length; i++) {
                    const m = pool[i];
                    const ent = m.userData.entity;
                    if (!ent || !ent.parts || !ent.parts.root || ent._hitR == null) { loose.push(m); continue; }
                    let g = byEnt.get(ent);
                    if (!g) { g = []; byEnt.set(ent, g); }
                    g.push(m);
                }
            }
            const cand = this._castCand || (this._castCand = []);
            cand.length = 0;
            for (let i = 0; i < this._poolLoose.length; i++) cand.push(this._poolLoose[i]);
            const sph = this._castSphere || (this._castSphere = new THREE.Sphere());
            const far = rc.far;
            for (const [ent, meshes] of this._poolGroups) {
                BO.Hitboxes.sphere(ent, sph);
                if (!rc.ray.intersectsSphere(sph)) continue;
                if (rc.ray.origin.distanceTo(sph.center) - sph.radius > far) continue;
                for (let i = 0; i < meshes.length; i++) cand.push(meshes[i]);
            }
            return cand.length ? rc.intersectObjects(cand, false) : [];
        }

        cancelCharge() {
            this.busterCharging = false;
            this.busterChargeTime = 0;
            this.busterSoundAccum = 0;
            this.fistCharging = false;
            this.fistChargeTime = 0;
        }

        handleFireInput(pressed, justPressed) {
            const P = BO.Player;
            if (!P.alive) return;
            P.triggerHeld = pressed;

            if (BO.State.activeMode === 'owrpg' && BO.OWRPGMode?.active && BO.OWRPGMode.holstered) {
                if (justPressed) BO.OWRPGMode.toast('Weapon holstered — press [B] to draw', '#f59e0b');
                return;
            }
            if (P.swapTimer > 0 || P.meleeTimer > 0) return;

            if (P.usingBareHands) {
                const held = P.survivalProp;
                if (held?.kind === 'tool') {
                    // Tools swing on hold, like an axe chopping in rhythm.
                    if (pressed) this._survivalToolSwing(held.id);
                    return;
                }
                if (held?.kind === 'item') {
                    if (pressed && justPressed) BO.SurvivalMode?.campaign?.hotbar?.useSelected();
                    return;
                }
                if (pressed && justPressed) {
                    this.fistCharging = true;
                    this.fistChargeTime = 0;
                    this._survivalPunch(false);
                }
                return;
            }

            const w = P.activeWeapon;
            if (!w) return;

            // Cancel shell-by-shell reload cleanly on trigger pull!
            if (P.reloading && w.stats.shellReload && w.mag > 0 && justPressed) {
                P.reloading = false;
            }
            if (P.reloading) return;

            // Mega Buster Hold-to-Charge Mechanic (MAX 10s / MAX 10x size)
            if (w.stats.magicType === 'megaman_plasma') {
                if (pressed && P.fireCooldown <= 0) {
                    const infAmmo = BO.Cheats && BO.Cheats.isActive('infammo');
                    if (w.mag <= 0 && !infAmmo) {
                        BO.Sound.playEmptyClick();
                        P.fireCooldown = 0.25;
                        P.startReload();
                        return;
                    }
                    if (!this.busterCharging) {
                        this.busterCharging = true;
                        this.busterChargeTime = 0;
                        this.busterSoundAccum = 0;
                        BO.Sound.playBusterChargeTick(0);
                    }
                }
                return;
            }

            const mode = w.fireMode;
            if (mode === 'auto') {
                if (pressed && P.fireCooldown <= 0) {
                    this._fireRound();
                }
            } else if (mode === 'burst') {
                if (justPressed && P.fireCooldown <= 0 && P.burstRemaining <= 0) {
                    P.burstRemaining = w.stats.burstCount || 3;
                    P.burstTimer = 0;
                }
            } else {
                // semi / pump / bolt
                if (justPressed && P.fireCooldown <= 0) {
                    this._fireRound();
                }
            }
        }

        releaseFireInput() {
            if (this.fistCharging) {
                const held = this.fistChargeTime;
                this.fistCharging = false;
                this.fistChargeTime = 0;
                if (held >= 0.45 && BO.Player.usingBareHands) {
                    BO.Player.fireCooldown = 0;
                    this._survivalPunch(true);
                }
                return;
            }
            if (!this.busterCharging) return;
            const chargeSec = this.busterChargeTime;
            this.busterCharging = false;
            this.busterChargeTime = 0;
            this.busterSoundAccum = 0;
            const P = BO.Player;
            const w = P.activeWeapon;
            if (!P.alive || !w || w.stats.magicType !== 'megaman_plasma' || P.reloading || P.swapTimer > 0) return;
            this._fireChargedMegaBuster(chargeSec);
        }

        updateBurstAndProjectiles(dt, worldCamera) {
            const P = BO.Player;
            if (this.fistCharging) {
                if (!P.alive || !P.usingBareHands || !P.triggerHeld) {
                    this.fistCharging = false;
                    this.fistChargeTime = 0;
                } else {
                    this.fistChargeTime = Math.min(1.5, this.fistChargeTime + dt);
                }
            }
            if (this.busterCharging) {
                const w = P.activeWeapon;
                if (!P.alive || !w || w.stats.magicType !== 'megaman_plasma' || P.reloading || P.swapTimer > 0) {
                    this.cancelCharge();
                } else if (!P.triggerHeld) {
                    this.releaseFireInput();
                } else {
                    const maxT = w.stats.chargeMaxTime || 10.0;
                    this.busterChargeTime = Math.min(maxT, this.busterChargeTime + dt);
                    this.busterSoundAccum += dt;
                    if (this.busterSoundAccum >= 0.18) {
                        this.busterSoundAccum = 0;
                        BO.Sound.playBusterChargeTick(this.busterChargeTime / maxT);
                    }
                }
            }

            if (P.burstRemaining > 0) {
                P.burstTimer -= dt;
                if (P.burstTimer <= 0) {
                    this._fireRound();
                    P.burstRemaining--;
                    P.burstTimer = P.activeWeapon ? P.activeWeapon.stats.burstDelay : 0.06;
                }
            }

            // Cooking Frag Grenade
            if (P.cookingFrag) {
                P.cookTimer -= dt;
                if (P.cookTimer <= 0) {
                    P.cookingFrag = false;
                    // Explode in hand if overcooked!
                    this._detonateExplosion(P.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 5.8, 220, 'player', false, 0, 'frag');
                    P.takeDamage(160, null, true);
                }
            }

            this._updateProjectiles(dt);
            this._updateNapalmPools(dt);
            this._updatePokemonAllies(dt);
        }

        _fireRound() {
            const P = BO.Player;
            const w = P.activeWeapon;
            if (!w || !this.camera) return;

            const tdInf = BO.State.activeMode === 'td' && BO.TowerDefenseMode && (BO.TowerDefenseMode.modifiers?.infiniteAmmo || BO.TowerDefenseMode.overdriveTimer > 0);
            const mgInf = BO.State.activeMode === 'minigame' && BO.Minigames && BO.Minigames.infiniteMag;
            const bountyAmmo = BO.State.activeMode === 'mp' && BO.MPMode.bountyHolder === P;
            const infAmmo = (BO.Cheats && BO.Cheats.isActive('infammo')) || tdInf || mgInf || bountyAmmo;
            const isMasterkey = w.fireMode === 'masterkey';
            const isUnderbarrelLauncher = w.fireMode === 'underbarrel_launcher';
            const isUnderbarrelFlame = w.fireMode === 'underbarrel_flame';
            if (w.stats.kind === 'melee') {
                this._executeMeleeWeaponSwing(w);
                return;
            }

            const mgRt = BO.State.activeMode === 'minigame' && BO.Minigames && BO.Minigames.active ? BO.Minigames : null;
            if (mgRt && mgRt.blockFire) { P.fireCooldown = 0.1; return; }
            if (w.mag <= 0 && !infAmmo) {
                BO.Sound.playEmptyClick();
                P.fireCooldown = 0.25;
                P.startReload();
                return;
            }

            if (BO.State.activeMode === 'survival' && !BO.SurvivalMode.beforeShot(w)) return;
            this.openingShot = w.mag === w.stats.magSize;
            const now = BO.ZombiesMode.elapsed;
            this.frozenTrigger = P.zombiePerks.has('trigger_freeze') && now - this.lastTriggerTime >= 3;
            this.lastTriggerTime = now;
            const infReserve = BO.Mods?.fxActive?.().infiniteReserve;
            if (!P.overdriveActive && !infAmmo) w.mag--;
            else if (infAmmo) w.mag = w.stats.magSize;
            if (infReserve && w.stats.reserveMax) w.reserve = w.stats.reserveMax;
            if (BO.Mods && BO.Mods.onWeaponShot) BO.Mods.onWeaponShot(w);
            BO.Progression.recordStat('shotsFired', 1);
            if (BO.State.activeMode === 'minigame' && BO.Minigames) BO.Minigames.onShotFired(w);

            const hasDoubleTap = P.zombiePerks.has('double_tap');
            const tdGongBoost = (BO.State.activeMode === 'td' && BO.TowerDefenseMode && BO.TowerDefenseMode.overdriveTimer > 0) ? 1.85 : 1.0;
            const modRof = BO.Mods ? BO.Mods.fireRateMult() : 1.0;
            const rpgMod = (BO.State.activeMode === 'rpg' && BO.RPGItems?.shotModifiers) ? BO.RPGItems.shotModifiers() : null;
            const rpgRof = rpgMod ? Math.max(0.25, rpgMod.fireRateMult || 1.0) : 1.0;
            const rpm = w.stats.rpm * (hasDoubleTap ? 1.25 : 1.0) * (P.overdriveActive ? 1.60 : 1.0) * tdGongBoost * modRof * rpgRof;
            P.fireCooldown = isUnderbarrelLauncher ? 1.55 : isUnderbarrelFlame ? 0.3 : isMasterkey ? 0.82 : 60 / Math.max(30, rpm);
            if (mgRt && mgRt.fireInterval) P.fireCooldown = Math.max(P.fireCooldown, mgRt.fireInterval);

            P.triggerMuzzleFlash();
            if (!(BO.State.activeMode === 'minigame' && BO.Minigames && BO.Minigames.customGunSound(w))) BO.Sound.playGunshot(w.stats.soundProfile, w.stats.suppressed, w.isPaP, 1.0, w.id);
            if (BO.Net && BO.Net.active) {
                BO.Net.sendPlayerFx({
                    kind: 'shot',
                    soundProfile: w.stats.soundProfile,
                    suppressed: !!w.stats.suppressed,
                    isPaP: !!w.isPaP
                });
            }
            if (BO.State.activeMode === 'mp' && BO.MPMode && BO.MPMode.recordKillcamFx) {
                BO.MPMode.recordKillcamFx({
                    kind: 'shot',
                    soundProfile: w.stats.soundProfile,
                    suppressed: !!w.stats.suppressed,
                    isPaP: !!w.isPaP
                });
            }

            // Eject brass casing
            if (BO.World.scene && w.stats.kind === 'gun') {
                const { right } = P.getMoveDirectionVectors();
                _tmpEject.copy(this.camera.position).addScaledVector(right, 0.24);
                _tmpEject.y -= 0.14;
                BO.FX.spawnShellCasing(_tmpEject, right);
            }

            // Recoil kick + torsional roll + crisp upward muzzle snap
            const adsMult = P.adsAlpha > 0.5 ? 0.80 : 1.0;
            const modRec = (BO.Mods ? BO.Mods.recoilMult() : 1.0) * (BO.State.activeMode === 'survival' ? (BO.SurvivalMode?.campaign?.deep?.modFx?.recoilMult || 1.0) : 1.0);
            P.recoilPitch += w.stats.recoilPitch * adsMult * modRec;
            P.recoilYaw += (Math.random() - 0.5) * 2 * w.stats.recoilYaw * adsMult * modRec;
            P.recoilRoll = (P.recoilRoll || 0) + (Math.random() - 0.5) * 0.046 * adsMult * modRec;
            P.recoilZ += w.stats.category === 'Shotgun' || w.stats.category === 'Sniper' ? 0.052 : 0.034;
            P.vmKickUp = Math.min(0.028, (P.vmKickUp || 0) + 0.012 * adsMult);
            P.cameraShake = Math.max(P.cameraShake, w.stats.category === 'Shotgun' || w.stats.category === 'Sniper' ? 0.018 : 0.011);

            const aim = P.getAimRay(this.camera);

            // Special Magic Weapon & Explosive Archetypes
            if (isUnderbarrelLauncher) {
                this._spawnEnergyOrb(aim.origin, aim.dir,
                    { ...w, stats: { ...w.stats, damage: 145, explosiveRadius: 3.1 } }, 0, 'underbarrel');
            } else if (isUnderbarrelFlame) {
                this._fireDragonBreath(aim.origin, aim.dir, { ...w, stats: { ...w.stats, range: 5.6, damage: 35 } });
            } else if (w.stats.magicType) {
                this._fireMagicWeapon(aim.origin, aim.dir, w, hasDoubleTap);
            } else if (w.stats.isConeBlast) {
                this._fireConeBlast(aim.origin, aim.dir, w);
            } else if (w.stats.explosiveRadius > 0 || w.stats.papEffect === 'explosive_rounds') {
                const count = hasDoubleTap ? 2 : 1;
                for (let c = 0; c < count; c++) {
                    this._spawnEnergyOrb(aim.origin, aim.dir, w, c * 0.015);
                }
            } else {
                const shot = isMasterkey ? { ...w, stats: { ...w.stats, category: 'Shotgun', damage: 20,
                    range: 16, pellets: 7, hipSpread: 0.085, adsSpread: 0.065, penetration: 0 } } : w;
                const basePellets = (shot.stats.pellets || 1) * (hasDoubleTap ? 2 : 1);
                const pellets = rpgMod ? Math.max(1, basePellets + (rpgMod.multishot ? rpgMod.multishot - 1 : 0)) : basePellets;
                let spread = BO.Math.lerp(shot.stats.hipSpread, shot.stats.adsSpread, P.adsAlpha);
                if (P.zombiePerks.has('deadshot')) spread *= 0.65;
                if (Math.hypot(P.vel.x, P.vel.z) > 1.5 && P.adsAlpha < 0.5) spread *= 1.35;
                if (BO.Mods) spread *= BO.Mods.spreadMult();
                if (rpgMod) spread += (rpgMod.spreadAdd || 0) + (pellets > 1 && basePellets === 1 ? 0.032 : 0);

                let anyHit = false;
                let anyKill = false;
                let anyHeadshot = false;
                let multiKills = 0;

                if (rpgMod && rpgMod.brimstone) {
                    const brRes = this._fireRpgBrimstone(aim.origin, aim.dir, shot, rpgMod);
                    if (brRes.hit) anyHit = true;
                    if (brRes.headshot) anyHeadshot = true;
                    if (brRes.kills > 0) { anyKill = true; multiKills += brRes.kills; }
                } else {
                    for (let i = 0; i < pellets; i++) {
                        _tmpShotDir.copy(aim.dir);
                        const fan = pellets > 1 && basePellets === 1 ? ((i - (pellets - 1) * 0.5) * 0.045) : 0;
                        const { right } = P.getMoveDirectionVectors();
                        if (fan) _tmpShotDir.addScaledVector(right, fan);
                        _tmpShotDir.x += (Math.random() - 0.5) * 2 * spread;
                        _tmpShotDir.y += (Math.random() - 0.5) * 2 * spread;
                        _tmpShotDir.z += (Math.random() - 0.5) * 2 * spread;
                        _tmpShotDir.normalize();

                        const res = this._castBulletRay(aim.origin, _tmpShotDir, shot, rpgMod);
                        if (res.hit) anyHit = true;
                        if (res.headshot) anyHeadshot = true;
                        if (res.kills > 0) {
                            anyKill = true;
                            multiKills += res.kills;
                        }
                    }
                }

                if (anyHit) {
                    BO.Progression.recordStat('shotsHit', 1);
                    if (BO.State.activeMode !== 'owrpg') BO.Sound.playHitmarker(anyHeadshot, anyKill);
                    BO.Events.emit('hud:hitmarker', { isHeadshot: anyHeadshot, isKill: anyKill });
                    if (BO.State.activeMode === 'mp' && BO.MPMode && BO.MPMode.recordKillcamFx) {
                        BO.MPMode.recordKillcamFx({ kind: 'hitmarker', isHeadshot: anyHeadshot, isKill: anyKill });
                    }
                }
                if (multiKills >= 2) {
                    BO.Progression.awardMedal('collateral');
                }
            }

            if (w.mag === 0 && w.reserve > 0 && w.fireMode !== 'auto') {
                // Auto reload convenience on last bullet for single-shot/bolt
                setTimeout(() => {
                    if (P.alive && P.activeWeapon === w && w.mag === 0) P.startReload();
                }, 180);
            }
        }

        _fireRpgBrimstone(origin, dir, w, rpgMod) {
            const range = 75 * (rpgMod.rangeMult || 1);
            const wh = BO.World.raycastWorld(origin, dir, range);
            const endPt = wh ? wh.point.clone() : origin.clone().addScaledVector(dir, range);
            const startPt = origin.clone().addScaledVector(dir, 0.55).add(new THREE.Vector3(0, -0.09, 0));
            BO.FX.spawnTracer(startPt, endPt, rpgMod.tracerColor || 0xef4444, Math.max(0.11, rpgMod.tracerWidth || 0.14), 0.24);
            BO.FX.spawnParticles(endPt, 14, rpgMod.tracerColor || 0xef4444, 5, 4, 0.45, 1.3);
            this.raycaster.set(origin, dir);
            this.raycaster.far = wh ? wh.distance : range;
            const hits = this._castTargets();
            const seen = new Set();
            let hit = false, headshot = false, kills = 0;
            for (const h of hits) {
                const ent = h.object.userData.entity;
                if (!ent || !ent.alive || ent.dead || (typeof ent.hp === 'number' && ent.hp <= 0) || seen.has(ent)) continue;
                seen.add(ent); hit = true;
                const hb = h.object.userData.hitbox || 'torso';
                if (hb === 'head') headshot = true;
                const dmg = w.stats.damage * (rpgMod.damageMult || 1) * (hb === 'head' ? (w.stats.headMult || 1.5) : 1) * 1.35;
                if (this.onHitEnemy && this.onHitEnemy(ent, dmg, hb, h.distance, w, h.point, dir)) kills++;
            }
            return { hit, headshot, kills };
        }

        _castBulletRay(origin, dir, w, rpgMod = null, segDepth = 0) {
            const minRange = BO.State.activeMode === 'td' ? 195 : 85;
            const maxDist = Math.max(minRange, w.stats.range * 2.4 * (rpgMod?.rangeMult || 1));
            const castDir = _tmpCastDir.copy(dir);
            // Homing assist (Spoon Bender / Sacred Heart) subtly bends shot toward nearest enemy in front cone!
            if (rpgMod && rpgMod.homing && segDepth === 0) {
                let bestDot = 0.72, hasBest = false;
                for (let i = 0; i < this.targetPool.length; i++) {
                    const ent = this.targetPool[i].userData.entity;
                    if (!ent || !ent.alive || !ent.pos) continue;
                    _tmpHoming.set(ent.pos.x, ent.pos.y + 1.15, ent.pos.z).sub(origin);
                    const d = _tmpHoming.length();
                    if (d > maxDist || d < 0.5) continue;
                    _tmpHoming.divideScalar(d);
                    const dot = _tmpHoming.dot(castDir);
                    if (dot > bestDot) { bestDot = dot; _tmpBestTo.copy(_tmpHoming); hasBest = true; }
                }
                if (hasBest) castDir.lerp(_tmpBestTo, 0.72).normalize();
            }
            const worldHit = BO.World.raycastWorld(origin, castDir, maxDist);
            const worldDist = worldHit ? worldHit.distance : maxDist;

            // Tracer start slightly offset right-down when hipfiring
            const P = BO.Player;
            const { right } = P.getMoveDirectionVectors();
            if (segDepth > 0) {
                _tmpMuzzle.copy(origin);
            } else {
                _tmpMuzzle.copy(origin).addScaledVector(castDir, 0.55).addScaledVector(right, (1 - P.adsAlpha) * 0.16);
                _tmpMuzzle.y += (1 - P.adsAlpha) * -0.10;
            }
            const muzzlePos = _tmpMuzzle;

            this.raycaster.set(origin, castDir);
            this.raycaster.far = worldDist;
            const hits = this._castTargets();

            if (BO.State.activeMode === 'survival') BO.SurvivalMode.impact(worldHit, w.stats.damage, 'bullet');
            if (worldHit) _tmpEnd.copy(worldHit.point);
            else _tmpEnd.copy(origin).addScaledVector(castDir, 60);
            const endPoint = _tmpEnd;
            let pierceLeft = (w.stats.penetration || 0) + 1 + (rpgMod?.pierceAdd || 0);
            if (BO.State.activeMode === 'minigame' && BO.Minigames && BO.Minigames.singleTargetShots) pierceLeft = 1;
            const hitEntities = new Set();
            let didHit = false;
            let didHead = false;
            let kills = 0;

            for (let i = 0; i < hits.length && pierceLeft > 0; i++) {
                const h = hits[i];
                const ent = h.object.userData.entity;
                if (!ent || !ent.alive || ent.dead || (typeof ent.hp === 'number' && ent.hp <= 0) || hitEntities.has(ent)) continue;
                hitEntities.add(ent);
                const hitbox = h.object.userData.hitbox || 'torso';
                if (hitbox === 'shield') {
                    // Shield blocks penetration and ricochets sparks/sound while preserving existing 0.25x chip math
                    pierceLeft = 0;
                    BO.FX.spawnParticles(h.point, 7, 0xfacc15, 4.4, 9, 0.28, 0.8);
                    BO.Sound?.playShieldRicochet?.(h.point);
                } else {
                    pierceLeft--;
                }
                didHit = true;
                endPoint.copy(h.point);

                const isHead = hitbox === 'head';
                if (isHead) didHead = true;

                // Damage falloff beyond effective range
                let falloff = 1.0;
                if (h.distance > w.stats.range) {
                    const over = (h.distance - w.stats.range) / Math.max(10, w.stats.range);
                    falloff = BO.Math.clamp(1 - over * 0.45, 0.45, 1.0);
                }

                let dmg = w.stats.damage * falloff * (rpgMod?.damageMult || 1);
                const perks = P.mpPerks;
                if (perks.includes('duelist') && h.distance <= 6) dmg *= 1.25;
                if (perks.includes('skyline') && !P.onGround) dmg *= 1.3;
                if (perks.includes('ambusher') && P.crouching && h.distance >= 12) dmg *= 1.2;
                if (perks.includes('finishing_school') && hitbox !== 'head' && ent.hp < ent.maxHp * 0.3) dmg *= 1.25;
                if (perks.includes('round_one') && this.openingShot) dmg *= 1.35;
                if (perks.includes('last_cartridge') && w.mag === 0) dmg *= 1.4;
                if (perks.includes('sidearm_specialist') && /pistol/i.test(w.stats.category)) dmg *= 1.22;
                if (this.frozenTrigger) ent.stunTimer = Math.max(ent.stunTimer || 0, 0.85);
                if (isHead) {
                    let hm = w.stats.headMult;
                    if (P.zombiePerks.has('deadshot')) hm *= 1.45;
                    dmg *= hm;
                } else if (hitbox === 'limb') {
                    dmg *= 0.85;
                }
                if (P.isJuggernaut) dmg *= 1.65;
                if (P.overdriveActive) dmg *= 2.0;
                if (P.zombiePerks.has('eagle_eye') && (h.distance >= 18 || w.stats.category === 'Sniper')) {
                    dmg *= 1.35;
                }

                // Elemental Pop perk: 22% chance to trigger Fire, Cryo Freeze, or Chain Lightning!
                if (P.zombiePerks.has('elemental_pop') && Math.random() < 0.22 && ent.pos) {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        ent.burnTimer = Math.max(ent.burnTimer || 0, 3.5);
                        BO.FX.spawnParticles(h.point, 6, 0xf97316, 3.2, 4, 0.4, 1.0);
                    } else if (roll < 0.67) {
                        ent.frozenTimer = Math.max(ent.frozenTimer || 0, 2.5);
                        BO.FX.spawnParticles(h.point, 6, 0x38bdf8, 3.2, 4, 0.4, 1.0);
                    } else {
                        dmg *= 1.45;
                        BO.FX.spawnParticles(h.point, 8, 0x22d3ee, 4.5, 2, 0.45, 1.2);
                    }
                }

                // Blood impact FX (respects bloodLevel setting!)
                const bloodLvl = BO.Settings.get('bloodLevel') || 'normal';
                if (ent.noBlood) {
                    BO.FX.spawnParticles(h.point, 5, 0xfde68a, 3.2, 10, 0.25, 0.7);
                } else if (bloodLvl !== 'off') {
                    const mult = bloodLvl === 'ultra' ? 2.2 : 1.0;
                    BO.FX.spawnParticles(h.point, Math.round((isHead ? 10 : 6) * mult), 0x991b1b, 3.8 * mult, 12, 0.38, mult);
                }

                if (this.onHitEnemy) {
                    const killed = this.onHitEnemy(ent, dmg, hitbox, h.distance, w, h.point, castDir);
                    if (killed) kills++;
                }
            }

            if (worldHit && (!didHit || pierceLeft > 0)) {
                if (worldHit.face) _tmpNorm.copy(worldHit.face.normal);
                else _tmpNorm.set(0, 1, 0);
                BO.FX.spawnDecal(worldHit.point, _tmpNorm, false);
                const surfTag = worldHit.terrain ? 'earth' : String(worldHit.object?.userData?.surfaceMaterial || '');
                let impactCol = 0xd4d4d8;
                if (/metal|steel|iron|armor|car|grate/i.test(surfTag)) impactCol = 0xfde68a;
                else if (/wood|timber|plank|crate/i.test(surfTag)) impactCol = 0xc2935c;
                else if (/earth|dirt|grass|mud|sand|soil/i.test(surfTag)) impactCol = 0x8b7355;
                else if (/glass|ice|window|mirror/i.test(surfTag)) impactCol = 0xbfefff;
                else if (/water|liquid/i.test(surfTag)) impactCol = 0x7dd3fc;
                BO.FX.spawnParticles(worldHit.point, 4, impactCol, 3.0, 11, 0.25, 0.7);
                BO.Sound.playBulletImpact(worldHit);
                if (rpgMod && rpgMod.explosive && !didHit && this.onExplodeAt) {
                    const rad = rpgMod.explosiveRadius || 3.4;
                    BO.FX.spawnExplosion(worldHit.point, rad, rpgMod.tracerColor || 0x84cc16);
                    this.onExplodeAt(worldHit.point.clone(), rad, w.stats.damage * (rpgMod.damageMult || 1) * 0.65);
                }
                // Rubber Cement Wall-Bounce Ricochet!
                if (rpgMod && rpgMod.bounceCount > segDepth) {
                    const rDir = _tmpRefl.copy(castDir).reflect(_tmpNorm).normalize().clone();
                    const rOrig = _tmpOrig.copy(worldHit.point).addScaledVector(_tmpNorm, 0.12).clone();
                    const br = this._castBulletRay(rOrig, rDir, w, rpgMod, segDepth + 1);
                    if (br.hit) didHit = true;
                    if (br.headshot) didHead = true;
                    kills += br.kills;
                }
            }

            const tracerCol = (rpgMod && rpgMod.tracerColor) || (BO.State.activeMode === 'minigame' && BO.Minigames && BO.Minigames.tracerColor) || (w.isPaP ? 0xc084fc : 0xffd166);
            const tracerW = (rpgMod && rpgMod.tracerWidth) || (w.isPaP ? 0.036 : 0.022);
            BO.FX.spawnTracer(muzzlePos, endPoint, tracerCol, tracerW, 0.08);
            if (BO.Net && BO.Net.active) {
                BO.Net.sendPlayerFx({
                    kind: 'tracer',
                    sx: Number(muzzlePos.x.toFixed(2)), sy: Number(muzzlePos.y.toFixed(2)), sz: Number(muzzlePos.z.toFixed(2)),
                    ex: Number(endPoint.x.toFixed(2)), ey: Number(endPoint.y.toFixed(2)), ez: Number(endPoint.z.toFixed(2)),
                    color: tracerCol,
                    isPaP: !!w.isPaP
                });
            }
            if (BO.State.activeMode === 'mp' && BO.MPMode && BO.MPMode.recordKillcamFx) {
                BO.MPMode.recordKillcamFx({ kind: 'tracer', sx: muzzlePos.x, sy: muzzlePos.y, sz: muzzlePos.z, ex: endPoint.x, ey: endPoint.y, ez: endPoint.z, color: tracerCol });
            }

            return { hit: didHit, headshot: didHead, kills };
        }

        _executeMeleeWeaponSwing(w) {
            if (BO.Player.matchRules.noMelee) return;
            const P = BO.Player;
            P.fireCooldown = 60 / Math.max(40, w.stats.rpm);
            P.meleeTimer = Math.min(0.28, P.fireCooldown * 0.85);
            BO.Sound.playMelee(1, w.id);

            const aim = P.getAimRay(this.camera);
            const reach = w.stats.range || 3.0;
            if (BO.State.activeMode === 'survival') {
                const wall = BO.World.raycastWorld(aim.origin, aim.dir, reach);
                BO.SurvivalMode.impact(wall, w.stats.damage * 0.46, 'melee');
            }
            const cleaveMax = w.stats.cleave || 1;
            const eff = w.stats.meleeEffect || 'slash';

            const unique = [];
            const seen = new Set();
            for (const m of this.targetPool) {
                const ent = m.userData.entity;
                if (ent && ent.alive && !seen.has(ent)) {
                    seen.add(ent);
                    const d = ent.pos.distanceTo(P.pos);
                    if (d <= reach + 0.6) {
                        const toEnt = ent.pos.clone().add(new THREE.Vector3(0, 1.0, 0)).sub(aim.origin).normalize();
                        if (aim.dir.dot(toEnt) > 0.38) unique.push({ ent, d });
                    }
                }
            }
            unique.sort((a, b) => a.d - b.d);

            let hitAny = false;
            let killAny = false;
            const bloodLvl = BO.Settings.get('bloodLevel') || 'normal';

            for (let i = 0; i < Math.min(cleaveMax, unique.length); i++) {
                const { ent, d } = unique[i];
                hitAny = true;
                if (bloodLvl !== 'off') {
                    BO.FX.spawnParticles(ent.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), bloodLvl === 'ultra' ? 16 : 8, 0x991b1b, 4.0, 10, 0.38, 1.1);
                }
                if (eff === 'bleed') ent.burnTimer = Math.max(ent.burnTimer || 0, 3.0);
                if (eff === 'stun') ent.stunTimer = Math.max(ent.stunTimer || 0, 2.2);
                if (eff === 'knockback' && ent.vel) {
                    const dir = ent.pos.clone().sub(P.pos).normalize();
                    ent.vel.x += dir.x * 14;
                    ent.vel.y = 4.5;
                    ent.vel.z += dir.z * 14;
                }
                if (eff === 'shockwave' && i === 0) {
                    BO.FX.spawnExplosion(ent.pos.clone(), 3.6, 0xf59e0b);
                }

                if (this.onHitEnemy) {
                    const killed = this.onHitEnemy(ent, w.stats.damage, 'torso', d, w, ent.pos.clone(), aim.dir);
                    if (killed) {
                        killAny = true;
                        if (eff === 'lifesteal') P.hp = Math.min(P.maxHp, P.hp + 25);
                    }
                }
            }

            if (hitAny) {
                BO.Sound.playHitmarker(false, killAny);
                BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: killAny });
            }
        }

        _fireMagicWeapon(origin, dir, w, hasDoubleTap) {
            const P = BO.Player;
            const mType = w.stats.magicType;
            const col = w.isPaP ? 0xf0abfc : (w.stats.magicColor || 0x22ff77);

            if (mType === 'plasma_splash') {
                const count = hasDoubleTap ? 2 : 1;
                for (let c = 0; c < count; c++) this._spawnEnergyOrb(origin, dir, w, c * 0.015);
            } else if (mType === 'cone_shockwave') {
                this._fireConeBlast(origin, dir, w);
            } else if (mType === 'black_hole') {
                this._spawnBlackHoleOrb(origin, dir, w, col);
            } else if (mType === 'chain_lightning') {
                this._fireChainLightning(origin, dir, w, col);
            } else if (mType === 'dragon_breath') {
                this._fireDragonBreath(origin, dir, w);
            } else if (mType === 'frost_cone') {
                this._fireFrostCone(origin, dir, w);
            } else if (mType === 'soul_drain') {
                this._fireSoulDrain(origin, dir, w, P);
            } else if (mType === 'solar_pillar') {
                this._spawnEnergyOrb(origin, dir, w, 0, 'solar_pillar');
            } else if (mType === 'acid_swarm') {
                for (let i = 0; i < 5; i++) this._spawnEnergyOrb(origin, dir, w, 0.065, 'acid_swarm');
            } else if (mType === 'chrono_rift') {
                this._spawnEnergyOrb(origin, dir, w, 0, 'chrono_rift');
            } else if (mType === 'shrink_ray') {
                this._fireShrinkRay(origin, dir, w);
            } else if (mType === 'microwave_pop') {
                this._fireMicrowavePop(origin, dir, w);
            } else if (mType === 'paralyzer_beam') {
                this._fireParalyzerBeam(origin, dir, w, P);
            } else if (mType === 'chaos_storm') {
                this._spawnEnergyOrb(origin, dir, w, 0, 'chaos_storm');
            } else if (mType === 'megaman_plasma') {
                this._fireChargedMegaBuster(0);
            }
        }

        _fireChargedMegaBuster(chargeSec = 0) {
            const P = BO.Player;
            const w = P.activeWeapon;
            if (!w || !this.camera || !BO.World.scene) return;

            const infAmmo = BO.Cheats && BO.Cheats.isActive('infammo');
            if (w.mag <= 0 && !infAmmo) {
                BO.Sound.playEmptyClick();
                P.fireCooldown = 0.25;
                P.startReload();
                return;
            }
            if (BO.State.activeMode === 'survival' && !BO.SurvivalMode.beforeShot(w)) return;
            this.openingShot = w.mag === w.stats.magSize;
            const now = BO.ZombiesMode.elapsed;
            this.frozenTrigger = P.zombiePerks.has('trigger_freeze') && now - this.lastTriggerTime >= 3;
            this.lastTriggerTime = now;
            if (!P.overdriveActive && !infAmmo) w.mag--;
            else if (infAmmo) w.mag = w.stats.magSize;
            BO.Progression.recordStat('shotsFired', 1);

            const maxT = w.stats.chargeMaxTime || 10.0;
            const maxS = w.stats.chargeMaxScale || 10.0;
            const t = BO.Math.clamp(chargeSec, 0, maxT);
            const frac = t / maxT;
            const sizeMult = 1.0 + frac * (maxS - 1.0); // 1x -> 10x at 10s!

            const hasDoubleTap = P.zombiePerks.has('double_tap');
            P.fireCooldown = (0.20 + frac * 0.26) / (hasDoubleTap ? 1.2 : 1.0);

            P.triggerMuzzleFlash();
            BO.Sound.playBusterRelease(frac);

            P.recoilPitch += w.stats.recoilPitch * (1 + frac * 2.2);
            P.recoilYaw += (Math.random() - 0.5) * 2 * w.stats.recoilYaw;
            P.recoilZ += 0.032 * (1 + frac * 1.4);
            P.cameraShake = Math.max(P.cameraShake, 0.012 + frac * 0.045);

            const aim = P.getAimRay(this.camera);
            const color = frac >= 0.85 ? 0xfef08a : (frac >= 0.45 ? 0x60a5fa : (w.isPaP ? 0xf0abfc : 0x38bdf8));
            const baseR = 0.13 * sizeMult;
            const dmg = Math.round(w.stats.damage * (1 + t * 1.4)); // Up to 15x damage at 10s!
            const blastRadius = (w.stats.explosiveRadius || 3.2) * (1 + frac * 3.0);

            const group = new THREE.Group();
            const outer = new THREE.Mesh(
                new THREE.SphereGeometry(baseR, 16, 14),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.86 })
            );
            const core = new THREE.Mesh(
                new THREE.SphereGeometry(baseR * 0.55, 12, 10),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            const halo = new THREE.Mesh(
                new THREE.TorusGeometry(baseR * 1.35, Math.max(0.02, baseR * 0.14), 8, 22),
                new THREE.MeshBasicMaterial({ color: frac >= 0.6 ? 0xfacc15 : 0x7dd3fc })
            );
            group.add(outer, core, halo);

            const launchOffset = Math.max(0.75, baseR + 0.45);
            group.position.copy(aim.origin).addScaledVector(aim.dir, launchOffset);
            BO.World.scene.add(group);

            BO.FX.spawnTracer(aim.origin.clone().addScaledVector(aim.dir, 0.6), aim.origin.clone().addScaledVector(aim.dir, 14 + frac * 30), color, 0.06 * Math.min(4, sizeMult), 0.16);

            this.projectiles.push({
                kind: 'energy_orb',
                subKind: 'megaman_plasma',
                mesh: group,
                haloMesh: halo,
                pos: group.position.clone(),
                vel: aim.dir.clone().multiplyScalar(38 + frac * 14),
                gravity: 0,
                life: 3.4,
                hitRadius: Math.max(0.25, baseR * 1.15),
                radius: blastRadius,
                damage: dmg,
                color,
                weaponId: w.cfg.id
            });
        }

        _fireShrinkRay(origin, dir, w) {
            BO.FX.spawnConeShockwave(origin.clone().addScaledVector(dir, 0.6), dir);
            const unique = new Set();
            for (const m of this.targetPool) {
                if (m.userData.entity && m.userData.entity.alive) unique.add(m.userData.entity);
            }
            let hitAny = false, kills = 0;
            for (const ent of unique) {
                const toEnt = ent.pos.clone().add(new THREE.Vector3(0, 1, 0)).sub(origin);
                const d = toEnt.length();
                if (d <= w.stats.range && dir.dot(toEnt.normalize()) > 0.65) {
                    hitAny = true;
                    if (ent.parts && ent.parts.root && !ent.isBoss) {
                        ent.parts.root.scale.setScalar(0.28);
                        ent.hp = 1;
                        ent.damage = 2;
                    }
                    BO.FX.spawnParticles(ent.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), 12, 0xfacc15, 4, 2, 0.5, 1.3);
                    if (this.onHitEnemy && this.onHitEnemy(ent, w.stats.damage, 'torso', d, w, ent.pos.clone(), dir)) kills++;
                }
            }
            if (hitAny) {
                BO.Sound.playHitmarker(false, kills > 0);
                BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: kills > 0 });
            }
        }

        _fireMicrowavePop(origin, dir, w) {
            const endPt = origin.clone().addScaledVector(dir, w.stats.range);
            BO.FX.spawnTracer(origin.clone().addScaledVector(dir, 0.6), endPt, 0xe879f9, 0.12, 0.22);
            const unique = new Set();
            for (const m of this.targetPool) {
                if (m.userData.entity && m.userData.entity.alive) unique.add(m.userData.entity);
            }
            let hitAny = false, kills = 0;
            for (const ent of unique) {
                const toEnt = ent.pos.clone().add(new THREE.Vector3(0, 1, 0)).sub(origin);
                const d = toEnt.length();
                if (d <= w.stats.range && dir.dot(toEnt.normalize()) > 0.78) {
                    hitAny = true;
                    if (ent.parts && ent.parts.root) ent.parts.root.scale.set(1.45, 1.35, 1.45);
                    if (ent.vel) ent.vel.y = 5.5;
                    BO.FX.spawnExplosion(ent.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 2.8, 0xe879f9);
                    if (this.onHitEnemy && this.onHitEnemy(ent, w.stats.damage, 'torso', d, w, ent.pos.clone(), dir)) kills++;
                }
            }
            if (hitAny) {
                BO.Sound.playHitmarker(false, kills > 0);
                BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: kills > 0 });
            }
        }

        _fireParalyzerBeam(origin, dir, w, P) {
            const endPt = origin.clone().addScaledVector(dir, w.stats.range);
            BO.FX.spawnTracer(origin.clone().addScaledVector(dir, 0.55), endPt, 0x38bdf8, 0.11, 0.09);
            // Paralyzer jetpack boost when aimed downward!
            if (P.pitch < -0.50) {
                P.vel.y = Math.max(P.vel.y, 7.8);
                P.onGround = false;
            }
            const unique = new Set();
            for (const m of this.targetPool) {
                if (m.userData.entity && m.userData.entity.alive) unique.add(m.userData.entity);
            }
            let hitAny = false, kills = 0;
            for (const ent of unique) {
                const toEnt = ent.pos.clone().add(new THREE.Vector3(0, 1, 0)).sub(origin);
                const d = toEnt.length();
                if (d <= w.stats.range && dir.dot(toEnt.normalize()) > 0.74) {
                    hitAny = true;
                    ent.stunTimer = Math.max(ent.stunTimer || 0, 0.45);
                    if (ent.vel) ent.vel.y = Math.max(ent.vel.y, 2.5);
                    if (this.onHitEnemy && this.onHitEnemy(ent, w.stats.damage, 'torso', d, w, ent.pos.clone(), dir)) kills++;
                }
            }
            if (hitAny) BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: kills > 0 });
        }

        _spawnBlackHoleOrb(origin, dir, w, color) {
            if (!BO.World.scene) return;
            const hit = BO.World.raycastWorld(origin, dir, 22);
            const vortexPos = hit ? hit.point.clone().add(new THREE.Vector3(0, 1.0, 0)) : origin.clone().addScaledVector(dir, 10);
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.55, 16, 12),
                new THREE.MeshBasicMaterial({ color: 0x1e093d })
            );
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.95, 0.08, 8, 24),
                new THREE.MeshBasicMaterial({ color })
            );
            sphere.add(ring);
            sphere.position.copy(vortexPos);
            BO.World.scene.add(sphere);

            this.projectiles.push({
                kind: 'black_hole_vortex',
                mesh: sphere,
                pos: vortexPos,
                life: 2.4,
                radius: 7.5,
                damage: w.stats.damage,
                color,
                weaponId: w.cfg.id
            });
        }

        _fireChainLightning(origin, dir, w, color) {
            const unique = new Set();
            for (const m of this.targetPool) {
                if (m.userData.entity && m.userData.entity.alive) unique.add(m.userData.entity);
            }
            const candidates = Array.from(unique).filter((e) => e.pos.distanceTo(origin) <= w.stats.range);
            candidates.sort((a, b) => a.pos.distanceTo(origin) - b.pos.distanceTo(origin));

            let prevPt = origin.clone().addScaledVector(dir, 0.6);
            let kills = 0;
            const maxJumps = w.isPaP ? 8 : 6;
            for (let i = 0; i < Math.min(maxJumps, candidates.length); i++) {
                const ent = candidates[i];
                const nextPt = ent.pos.clone().add(new THREE.Vector3(0, 1.1, 0));
                BO.FX.spawnTracer(prevPt, nextPt, color, 0.065, 0.25);
                BO.FX.spawnParticles(nextPt, 10, color, 4.5, 4, 0.4, 1.2);
                if (this.onHitEnemy && this.onHitEnemy(ent, w.stats.damage, 'torso', prevPt.distanceTo(nextPt), w, nextPt, dir)) {
                    kills++;
                }
                prevPt = nextPt;
            }
            if (candidates.length > 0) {
                BO.Sound.playHitmarker(false, kills > 0);
                BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: kills > 0 });
            } else {
                BO.FX.spawnTracer(prevPt, origin.clone().addScaledVector(dir, 30), color, 0.055, 0.18);
            }
        }

        _fireDragonBreath(origin, dir, w) {
            const flamePt = origin.clone().addScaledVector(dir, 3.2);
            BO.FX.spawnParticles(flamePt, 12, 0xf97316, 7.5, -1.5, 0.35, 2.2);
            BO.FX.spawnTracer(origin.clone().addScaledVector(dir, 0.6), origin.clone().addScaledVector(dir, 12), 0xf97316, 0.14, 0.12);

            const unique = new Set();
            for (const m of this.targetPool) {
                if (m.userData.entity && m.userData.entity.alive) unique.add(m.userData.entity);
            }
            let hitAny = false, kills = 0;
            for (const ent of unique) {
                const toEnt = ent.pos.clone().add(new THREE.Vector3(0, 1, 0)).sub(origin);
                const d = toEnt.length();
                if (d <= w.stats.range && dir.dot(toEnt.normalize()) > 0.72) {
                    hitAny = true;
                    ent.burnTimer = 4.0;
                    if (this.onHitEnemy && this.onHitEnemy(ent, w.stats.damage, 'torso', d, w, ent.pos.clone(), dir)) kills++;
                }
            }
            if (hitAny) BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: kills > 0 });
        }

        _fireFrostCone(origin, dir, w) {
            BO.FX.spawnConeShockwave(origin.clone().addScaledVector(dir, 0.6), dir);
            const unique = new Set();
            for (const m of this.targetPool) {
                if (m.userData.entity && m.userData.entity.alive) unique.add(m.userData.entity);
            }
            let hitAny = false, kills = 0;
            for (const ent of unique) {
                const toEnt = ent.pos.clone().add(new THREE.Vector3(0, 1, 0)).sub(origin);
                const d = toEnt.length();
                if (d <= w.stats.range && dir.dot(toEnt.normalize()) > 0.68) {
                    hitAny = true;
                    ent.frozenTimer = 5.5;
                    BO.FX.spawnParticles(ent.pos.clone().add(new THREE.Vector3(0, 1, 0)), 10, 0x7dd3fc, 3.5, 3, 0.5, 1.4);
                    if (this.onHitEnemy && this.onHitEnemy(ent, w.stats.damage, 'torso', d, w, ent.pos.clone(), dir)) kills++;
                }
            }
            if (hitAny) {
                BO.Sound.playHitmarker(false, kills > 0);
                BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: kills > 0 });
            }
        }

        _fireSoulDrain(origin, dir, w, P) {
            const endPt = origin.clone().addScaledVector(dir, w.stats.range);
            BO.FX.spawnTracer(origin.clone().addScaledVector(dir, 0.6), endPt, 0xef4444, 0.085, 0.12);
            const res = this._castBulletRay(origin, dir, w);
            if (res.hit) {
                P.hp = Math.min(P.maxHp, P.hp + 12);
                P.armor = Math.min(P.maxArmor, P.armor + 10);
                BO.Sound.playHitmarker(res.headshot, res.kills > 0);
                BO.Events.emit('hud:hitmarker', { isHeadshot: res.headshot, isKill: res.kills > 0 });
            }
        }

        _fireConeBlast(origin, dir, w) {
            BO.FX.spawnConeShockwave(origin.clone().addScaledVector(dir, 0.6), dir);
            BO.Player.cameraShake = 0.06;

            const unique = new Set();
            for (const m of this.targetPool) {
                const ent = m.userData.entity;
                if (ent && ent.alive) unique.add(ent);
            }

            let kills = 0;
            let hitAny = false;
            const toEnt = new THREE.Vector3();
            for (const ent of unique) {
                toEnt.set(ent.pos.x - origin.x, (ent.pos.y + 1.0) - origin.y, ent.pos.z - origin.z);
                const d = toEnt.length();
                if (d > w.stats.range) continue;
                toEnt.divideScalar(Math.max(0.01, d));
                const angle = Math.acos(BO.Math.clamp(dir.dot(toEnt), -1, 1));
                if (angle <= w.stats.coneHalfAngle) {
                    hitAny = true;
                    // Knockback impulse!
                    if (ent.vel) {
                        ent.vel.x += toEnt.x * 18;
                        ent.vel.y = 7.5;
                        ent.vel.z += toEnt.z * 18;
                    }
                    if (this.onHitEnemy) {
                        const killed = this.onHitEnemy(ent, w.stats.damage, 'torso', d, w, ent.pos.clone(), dir);
                        if (killed) kills++;
                    }
                }
            }
            if (hitAny) {
                BO.Sound.playHitmarker(false, kills > 0);
                BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: kills > 0 });
            }
        }

        _spawnEnergyOrb(origin, dir, w, spread = 0, subKind = 'energy_orb') {
            if (!BO.World.scene) return;
            const isX2 = w.isPaP && w.cfg.id === 'raygun';
            const color = w.stats.magicColor ? (w.isPaP ? 0xf0abfc : w.stats.magicColor) : (w.cfg.id === 'raygun' ? (isX2 ? 0xf43f5e : 0x22ff77) : 0xf59e0b);
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 10, 10),
                new THREE.MeshBasicMaterial({ color })
            );
            const launch = dir.clone();
            if (spread > 0) {
                launch.x += (Math.random() - 0.5) * spread;
                launch.y += (Math.random() - 0.5) * spread;
                launch.z += (Math.random() - 0.5) * spread;
                launch.normalize();
            }
            mesh.position.copy(origin).addScaledVector(launch, 0.7);
            BO.World.scene.add(mesh);

            this.projectiles.push({
                kind: 'energy_orb',
                subKind,
                mesh,
                pos: mesh.position.clone(),
                vel: launch.multiplyScalar(42),
                gravity: subKind === 'underbarrel' ? 16 : w.cfg.id === 'm1911' ? 8.5 : 0,
                life: 3.0,
                radius: w.stats.explosiveRadius || 3.0,
                damage: w.stats.damage,
                color,
                weaponId: w.cfg.id
            });
        }

        throwLethal(startCook = false, release = false) {
            if (BO.Player.matchRules.noLethals) return;
            const P = BO.Player;
            if (!P.alive || P.inLastStand) return;

            // C4 Remote Detonate on [G] if already placed or out of C4
            if (P.lethalId === 'c4' && startCook && this.c4Charges.length > 0 && (P.lethalCount <= 0 || P.keys['DoubleTapC4'])) {
                this.detonateC4();
                return;
            }

            const spec = BO.AttachmentsData.LETHALS[P.lethalId];
            if (!spec) return;

            const infAmmo = BO.Cheats && BO.Cheats.isActive('infammo');
            if (spec.cookable && startCook && !release) {
                if ((P.lethalCount <= 0 && !infAmmo) || P.cookingFrag) return;
                P.cookingFrag = true;
                P.cookTimer = spec.fuseTime;
                BO.Sound.playUIClick();
                return;
            }

            if (release && (!spec.cookable || !P.cookingFrag)) return;
            if (P.lethalCount <= 0 && !infAmmo) return;

            if (!infAmmo) P.lethalCount--;
            const fuse = P.cookingFrag ? Math.max(0.15, P.cookTimer) : (spec.fuseTime || 99);
            P.cookingFrag = false;

            this._spawnGrenade(P.lethalId, fuse, spec);
        }

        detonateC4() {
            if (BO.Player.matchRules.noLethals) return;
            if (this.c4Charges.length === 0) return;
            const list = this.c4Charges.splice(0, this.c4Charges.length);
            for (const c4 of list) {
                c4.life = 0;
                this._detonateExplosion(c4.pos, 6.5, 320, 'player', false, 0, 'c4');
                if (c4.mesh && BO.World.scene) BO.World.scene.remove(c4.mesh);
                const idx = this.projectiles.indexOf(c4);
                if (idx !== -1) this.projectiles.splice(idx, 1);
            }
        }

        throwTactical() {
            if (BO.Player.matchRules.noTacticals) return;
            const P = BO.Player;
            const infAmmo = BO.Cheats && BO.Cheats.isActive('infammo');
            if (!P.alive || P.inLastStand || (P.tacticalCount <= 0 && !infAmmo)) return;
            if (!infAmmo) P.tacticalCount--;
            BO.Mods?.triggerReaction('tactical');

            if (P.tacticalId === 'stim') {
                P.hp = P.maxHp;
                P.tacStamina = 1.0;
                P.regenDelayTimer = 0;
                BO.Sound.playPerkBuy();
                BO.Events.emit('hud:toast', { text: 'STIM INJECTED — VITALS RESTORED', color: '#22c55e' });
                return;
            }

            const spec = BO.AttachmentsData.TACTICALS[P.tacticalId];
            this._spawnGrenade(P.tacticalId, spec.fuseTime || 1.4, spec);
        }

        _spawnGrenade(kind, fuse, spec) {
            if (!BO.World.scene || !this.camera) return;
            const aim = BO.Player.getAimRay(this.camera);
            let mesh;
            if (kind === 'pokeball') {
                mesh = new THREE.Group();
                const top = new THREE.Mesh(
                    new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
                    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25, metalness: 0.3 })
                );
                const bot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
                    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.2 })
                );
                const band = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.113, 0.113, 0.022, 14),
                    new THREE.MeshBasicMaterial({ color: 0x111827 })
                );
                const btn = new THREE.Mesh(
                    new THREE.SphereGeometry(0.032, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xffffff })
                );
                btn.position.set(0, 0, -0.105);
                mesh.add(top, bot, band, btn);
            } else {
                const color = kind === 'semtex' ? 0xef4444 : (kind === 'napalm' ? 0xf97316 : (kind === 'c4' ? 0x3b82f6 : (kind === 'monkey_bomb' ? 0xfacc15 : (kind === 'flashbang' ? 0xe2e8f0 : 0x4d7c0f))));
                const geo = kind === 'c4' ? new THREE.BoxGeometry(0.18, 0.08, 0.24) : new THREE.SphereGeometry(0.09, 10, 10);
                mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.5 }));
            }
            mesh.position.copy(aim.origin).addScaledVector(aim.dir, 0.65);
            BO.World.scene.add(mesh);

            const throwVel = aim.dir.clone().multiplyScalar(kind === 'c4' ? 11.5 : 16.5);
            throwVel.y += 3.2;

            const proj = {
                kind,
                mesh,
                pos: mesh.position.clone(),
                vel: throwVel,
                gravity: 16.5,
                stuck: false,
                life: kind === 'pokeball' ? 0.95 : fuse,
                radius: spec.radius || 5.5,
                damage: spec.damage ?? 220,
                proximity: spec.proximity || 0,
                stunDuration: spec.stunDuration || 0
            };
            if (proj.proximity) {
                proj.pos.copy(BO.Player.pos).addScaledVector(aim.dir.clone().setY(0).normalize(), 0.85);
                proj.pos.y = BO.World.getGroundHeight(proj.pos.x, proj.pos.z, BO.Player.pos.y) + 0.08;
                proj.mesh.position.copy(proj.pos);
                proj.vel.set(0, 0, 0);
                proj.stuck = true;
                proj.armTime = 0.65;
            }
            this.projectiles.push(proj);
            if (kind === 'c4') this.c4Charges.push(proj);
            if (kind === 'monkey_bomb') this.activeMonkeyBomb = proj;
            BO.Sound.playMelee();
        }

        smokeBlocks(x1, y1, z1, x2, y2, z2) {
            if (!this.smokeClouds.length) return false;
            const a = new THREE.Vector3(x1, y1, z1);
            const v = new THREE.Vector3(x2, y2, z2).sub(a);
            const len = Math.max(0.01, v.lengthSq());
            return this.smokeClouds.some(({ pos, radius }) => {
                const t = BO.Math.clamp(pos.clone().sub(a).dot(v) / len, 0, 1);
                return a.clone().addScaledVector(v, t).distanceToSquared(pos) < radius * radius;
            });
        }

        _updateProjectiles(dt) {
            for (const cloud of this.smokeClouds) {
                cloud.life -= dt;
                cloud.pulse -= dt;
                if (cloud.pulse <= 0 && cloud.life > 0) {
                    cloud.pulse = 0.26;
                    BO.FX.spawnParticles(cloud.pos, 16, 0xadbcc4, 4, 0.7, 1.1, 2.3);
                }
            }
            this.smokeClouds = this.smokeClouds.filter((cloud) => cloud.life > 0);
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                p.life -= dt;

                if (p.kind === 'black_hole_vortex') {
                    p.mesh.rotation.y += dt * 6;
                    p.mesh.rotation.x += dt * 4;
                    // Pull nearby enemies inward toward singularity!
                    const unique = new Set();
                    for (const m of this.targetPool) {
                        if (m.userData.entity && m.userData.entity.alive) unique.add(m.userData.entity);
                    }
                    for (const ent of unique) {
                        const d = ent.pos.distanceTo(p.pos);
                        if (d < p.radius && d > 0.5) {
                            const pull = p.pos.clone().sub(ent.pos).normalize();
                            ent.pos.x += pull.x * 6.5 * dt;
                            ent.pos.z += pull.z * 6.5 * dt;
                        }
                    }
                    if (p.life <= 0) {
                        this._detonateExplosion(p.pos, p.radius, p.damage, 'player', false, 0, p.weaponId, p.color);
                        if (BO.World.scene) BO.World.scene.remove(p.mesh);
                        this.projectiles.splice(i, 1);
                    }
                    continue;
                }

                if (p.kind === 'energy_orb') {
                    p.vel.y -= p.gravity * dt;
                    const step = p.vel.clone().multiplyScalar(dt);
                    const dist = step.length();
                    const dir = step.clone().normalize();
                    const worldHit = BO.World.raycastWorld(p.pos, dir, dist + 0.15);
                    this.raycaster.set(p.pos, dir);
                    this.raycaster.far = dist + 0.2;
                    const entHits = this._castTargets();

                    let proximityHit = null;
                    if (p.hitRadius && p.hitRadius > 0.35) {
                        for (let t = 0; t < this.targetPool.length; t++) {
                            const ent = this.targetPool[t].userData.entity;
                            if (!ent || !ent.alive) continue;
                            const ey = ent.pos.y + (ent.height || 1.7) * 0.5;
                            if (BO.Math.dist3D(p.pos.x, p.pos.y, p.pos.z, ent.pos.x, ey, ent.pos.z) <= p.hitRadius + (ent.radius || 0.45)) {
                                proximityHit = p.pos.clone();
                                break;
                            }
                        }
                    }

                    if (worldHit || entHits.length > 0 || proximityHit || p.life <= 0) {
                        const hitPt = entHits[0]?.point || proximityHit || worldHit?.point || p.pos;
                        if (p.subKind === 'solar_pillar') {
                            BO.FX.spawnTracer(hitPt.clone().add(new THREE.Vector3(0, 32, 0)), hitPt, 0xfde047, 0.42, 0.55);
                        } else if (p.subKind === 'chrono_rift') {
                            if (this.onExplodeAt) this.onExplodeAt(hitPt, p.radius, 0, 'player', true, 4.0, 'chrono_rift');
                        } else if (p.subKind === 'chaos_storm') {
                            this._spawnNapalmPool(hitPt.clone(), 4.5, 5.0);
                            if (this.onExplodeAt) this.onExplodeAt(hitPt, p.radius, 0, 'player', false, 5.0, 'cryo_nova');
                        }
                        this._detonateExplosion(hitPt, p.radius, p.damage, 'player', false, 0, p.weaponId, p.color);
                        if (BO.World.scene) BO.World.scene.remove(p.mesh);
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                    p.pos.add(step);
                    p.mesh.position.copy(p.pos);
                    if (p.haloMesh) {
                        p.haloMesh.rotation.z += dt * 10;
                        p.haloMesh.rotation.x += dt * 7;
                    }
                    continue;
                }

                // Ballistic grenades
                if (!p.stuck) {
                    p.vel.y -= p.gravity * dt;
                    const nextPos = p.pos.clone().addScaledVector(p.vel, dt);
                    const stepVec = nextPos.clone().sub(p.pos);
                    const stepDist = stepVec.length();

                    if (stepDist > 0.001) {
                        const hit = BO.World.raycastWorld(p.pos, stepVec.normalize(), stepDist);
                        if (hit) {
                            if (p.kind === 'semtex' || p.kind === 'c4') {
                                p.stuck = true;
                                p.vel.set(0, 0, 0);
                                p.pos.copy(hit.point);
                                BO.Sound.playGrenadeBounce(hit.point, stepDist / dt, true);
                            } else {
                                const normal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);
                                p.vel.reflect(normal).multiplyScalar(0.45);
                                p.pos.copy(hit.point).addScaledVector(normal, 0.08);
                                if (p.vel.lengthSq() > 1.44) BO.Sound.playGrenadeBounce(hit.point, p.vel.length());
                            }
                        } else {
                            p.pos.copy(nextPos);
                        }
                    }

                    const floorY = BO.World.getGroundHeight(p.pos.x, p.pos.z, p.pos.y);
                    if (p.pos.y <= floorY + 0.08) {
                        p.pos.y = floorY + 0.08;
                        if (p.kind === 'semtex' || p.kind === 'c4') {
                            p.stuck = true;
                            p.vel.set(0, 0, 0);
                        } else {
                            p.vel.y = Math.abs(p.vel.y) * 0.42;
                            p.vel.x *= 0.68;
                            p.vel.z *= 0.68;
                        }
                    }
                    p.mesh.position.copy(p.pos);
                    if (!p.stuck) {
                        p.mesh.rotation.x += dt * 7;
                        p.mesh.rotation.z += dt * 5;
                    }
                }

                if (p.kind === 'monkey_bomb' && Math.floor(p.life * 3) !== Math.floor((p.life + dt) * 3)) {
                    BO.Sound.playMonkeyChime(p.pos);
                }

                if (p.kind === 'tomahawk') {
                    const target = this.targetPool.find((mesh) => {
                        const enemy = mesh.userData.entity;
                        if (!enemy?.alive || !enemy.pos) return false;
                        return Math.abs(p.pos.y - enemy.pos.y - 0.9) < 0.84 &&
                            BO.Math.dist2D(p.pos.x, p.pos.z, enemy.pos.x, enemy.pos.z) < 0.73;
                    });
                    if (target) {
                        const blade = { cfg: { id: 'tomahawk_axe' }, stats: { kind: 'melee', shortName: 'TOMAHAWK' } };
                        const killed = this.onHitEnemy?.(target.userData.entity, p.damage, 'torso',
                            p.pos.distanceTo(BO.Player.pos), blade, p.pos, p.vel.clone().normalize());
                        BO.Sound.playHitmarker(false, killed);
                        BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: !!killed });
                        p.mesh.parent?.remove(p.mesh);
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }
                if (p.proximity) {
                    p.armTime -= dt;
                    if (p.armTime <= 0 && this.targetPool.some((mesh) => {
                        const entity = mesh.userData.entity;
                        return entity?.alive && entity.pos?.distanceToSquared(p.pos) < p.proximity * p.proximity;
                    })) p.life = 0;
                }
                if (p.life <= 0 && p.kind !== 'c4') {
                    if (p === this.activeMonkeyBomb) this.activeMonkeyBomb = null;
                    if (p.kind === 'pokeball') {
                        this.summonRandomPokemon(p.pos.clone());
                        if (BO.World.scene) BO.World.scene.remove(p.mesh);
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                    if (p.kind === 'napalm') {
                        this._spawnNapalmPool(p.pos.clone(), p.radius || 6.2, 9.0);
                    }
                    if (p.kind === 'tomahawk') {
                        BO.Sound.playGrenadeBounce(p.pos, 4);
                    } else if (p.kind === 'smoke') {
                        this.smokeClouds.push({ pos: p.pos.clone().add(new THREE.Vector3(0, 1, 0)), life: 7, radius: p.radius, pulse: 0 });
                    } else if (p.kind === 'decoy') {
                        BO.Sound.playGunshot('smg', false, false, p.pos);
                        for (const bot of BO.MPMode.active ? BO.MPMode.bots : []) {
                            if (bot.alive && bot.pos.distanceToSquared(p.pos) < p.radius * p.radius) {
                                bot.roamGoal = p.pos.clone();
                                bot.path = BO.World.findPath(bot.pos.x, bot.pos.y, bot.pos.z, p.pos.x, p.pos.y, p.pos.z, false);
                                bot.pathTimer = 3.5;
                                bot.cachedTarget = null;
                            }
                        }
                    } else {
                        const isFlash = p.kind === 'flashbang' || p.kind === 'concussion';
                        this._detonateExplosion(p.pos, p.radius, p.damage, 'player', isFlash, p.stunDuration, p.kind, p.kind === 'napalm' ? 0xf97316 : 0xff7722);
                    }
                    if (BO.World.scene) BO.World.scene.remove(p.mesh);
                    this.projectiles.splice(i, 1);
                }
            }
        }

        _spawnNapalmPool(pos, radius = 6.0, duration = 9.0) {
            if (!BO.World.scene) return;
            const floorY = BO.World.getGroundHeight(pos.x, pos.z, pos.y);
            const group = new THREE.Group();
            group.position.set(pos.x, floorY + 0.05, pos.z);

            const disc = new THREE.Mesh(
                new THREE.CircleGeometry(radius, 24),
                new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
            );
            disc.rotation.x = -Math.PI * 0.5;
            group.add(disc);

            const flames = [];
            for (let i = 0; i < 14; i++) {
                const ang = (i / 14) * Math.PI * 2;
                const r = (0.25 + (i % 3) * 0.32) * radius;
                const cone = new THREE.Mesh(
                    new THREE.ConeGeometry(0.42, 1.25, 7),
                    new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xf97316 : 0xfacc15, transparent: true, opacity: 0.82 })
                );
                cone.position.set(Math.cos(ang) * r, 0.55, Math.sin(ang) * r);
                group.add(cone);
                flames.push(cone);
            }
            BO.World.scene.add(group);

            this.napalmPools.push({
                group,
                flames,
                pos: new THREE.Vector3(pos.x, floorY, pos.z),
                radius,
                life: duration,
                tickTimer: 0
            });
        }

        _updateNapalmPools(dt) {
            for (let i = this.napalmPools.length - 1; i >= 0; i--) {
                const np = this.napalmPools[i];
                np.life -= dt;
                np.tickTimer -= dt;
                for (let f = 0; f < np.flames.length; f++) {
                    np.flames[f].scale.y = 0.75 + Math.sin(performance.now() * 0.015 + f) * 0.35;
                }
                if (np.tickTimer <= 0) {
                    np.tickTimer = 0.35;
                    const unique = new Set();
                    for (const m of this.targetPool) {
                        if (m.userData.entity && m.userData.entity.alive) unique.add(m.userData.entity);
                    }
                    for (const ent of unique) {
                        if (BO.Math.dist2D(ent.pos.x, ent.pos.z, np.pos.x, np.pos.z) <= np.radius) {
                            ent.burnTimer = Math.max(ent.burnTimer || 0, 3.5);
                            if (this.onHitEnemy) {
                                this.onHitEnemy(ent, 55, 'torso', 1.0, { id: 'napalm', isPaP: false, stats: { papEffect: 'incendiary' }, cfg: { id: 'm4a1' } }, ent.pos.clone(), new THREE.Vector3(0, 1, 0));
                            }
                        }
                    }
                }
                if (np.life <= 0) {
                    if (BO.World.scene) BO.World.scene.remove(np.group);
                    this.napalmPools.splice(i, 1);
                }
            }
        }

        _buildPokemonMesh(spec) {
            const g = new THREE.Group();
            const sc = spec.scale || 1.0;
            const bodyMat = new THREE.MeshStandardMaterial({ color: spec.bodyColor, roughness: 0.35, metalness: 0.25 });
            const accMat = new THREE.MeshStandardMaterial({ color: spec.accentColor, roughness: 0.3, metalness: 0.4 });
            const glowMat = new THREE.MeshBasicMaterial({ color: spec.fxColor });

            const torso = new THREE.Mesh(new THREE.SphereGeometry(0.38 * sc, 14, 12), bodyMat);
            torso.position.y = 0.45 * sc;
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.28 * sc, 14, 12), bodyMat);
            head.position.set(0, 0.92 * sc, -0.06 * sc);

            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05 * sc, 8, 8), glowMat);
            eyeL.position.set(-0.11 * sc, 0.98 * sc, -0.28 * sc);
            const eyeR = eyeL.clone();
            eyeR.position.x = 0.11 * sc;

            const earL = new THREE.Mesh(new THREE.ConeGeometry(0.09 * sc, 0.32 * sc, 8), accMat);
            earL.position.set(-0.16 * sc, 1.24 * sc, 0);
            earL.rotation.z = 0.25;
            const earR = earL.clone();
            earR.position.x = 0.16 * sc;
            earR.rotation.z = -0.25;

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.62 * sc, 0.04, 8, 24),
                glowMat
            );
            ring.rotation.x = Math.PI * 0.5;
            ring.position.y = 0.08;

            g.add(torso, head, eyeL, eyeR, earL, earR, ring);

            if (spec.flying) {
                const wingGeo = new THREE.BoxGeometry(0.75 * sc, 0.04, 0.38 * sc);
                const wingL = new THREE.Mesh(wingGeo, accMat);
                wingL.position.set(-0.52 * sc, 0.72 * sc, 0.1);
                wingL.rotation.z = 0.28;
                const wingR = new THREE.Mesh(wingGeo, accMat);
                wingR.position.set(0.52 * sc, 0.72 * sc, 0.1);
                wingR.rotation.z = -0.28;
                g.add(wingL, wingR);
            }
            return g;
        }

        summonRandomPokemon(pos, forcedId = null) {
            if (!BO.World.scene) return null;
            const roster = BO.AttachmentsData.POKEMON_ROSTER || [];
            if (roster.length === 0) return null;
            const spec = forcedId ? (roster.find((r) => r.id === forcedId) || BO.Math.pick(roster)) : BO.Math.pick(roster);

            const floorY = BO.World.getGroundHeight(pos.x, pos.z, pos.y);
            const spawnPos = new THREE.Vector3(pos.x, floorY + (spec.flying ? 1.35 : 0), pos.z);
            const group = this._buildPokemonMesh(spec);
            group.position.copy(spawnPos);
            BO.World.scene.add(group);

            BO.FX.spawnParticles(spawnPos.clone().add(new THREE.Vector3(0, 0.8, 0)), 26, spec.fxColor, 6.5, 3, 0.8, 2.0);
            BO.Sound.playPowerUp();
            BO.Events.emit('hud:banner', {
                title: `GO! ${spec.name}! (POKÉBALL ALLY)`,
                sub: `${spec.title} — ${spec.desc.toUpperCase()}`,
                color: '#fde047'
            });

            const ally = {
                spec,
                group,
                pos: spawnPos,
                baseY: spawnPos.y,
                life: 18.0,
                attackTimer: 0.35
            };
            this.activePokemonAllies.push(ally);
            if (spec.id === 'snorlax') {
                this.activeMonkeyBomb = ally;
            }
            return ally;
        }

        _updatePokemonAllies(dt) {
            const P = BO.Player;
            for (let i = this.activePokemonAllies.length - 1; i >= 0; i--) {
                const ally = this.activePokemonAllies[i];
                ally.life -= dt;
                ally.attackTimer -= dt;

                // Bobbing & following near player if too far away
                const t = performance.now() * 0.004;
                ally.group.position.y = ally.baseY + Math.sin(t + i) * 0.16;

                const distToP = BO.Math.dist2D(ally.pos.x, ally.pos.z, P.pos.x, P.pos.z);
                if (distToP > 8.5 && ally.spec.id !== 'snorlax') {
                    const dx = P.pos.x - ally.pos.x;
                    const dz = P.pos.z - ally.pos.z;
                    const d = Math.max(0.1, Math.hypot(dx, dz));
                    ally.pos.x += (dx / d) * 5.5 * dt;
                    ally.pos.z += (dz / d) * 5.5 * dt;
                    ally.group.position.x = ally.pos.x;
                    ally.group.position.z = ally.pos.z;
                }

                // Collect living enemies
                const unique = new Set();
                for (const m of this.targetPool) {
                    if (m.userData.entity && m.userData.entity.alive) unique.add(m.userData.entity);
                }
                const enemies = Array.from(unique);
                enemies.sort((a, b) => a.pos.distanceTo(ally.pos) - b.pos.distanceTo(ally.pos));

                if (enemies.length > 0) {
                    const nearest = enemies[0];
                    ally.group.rotation.y = Math.atan2(nearest.pos.x - ally.pos.x, nearest.pos.z - ally.pos.z);

                    if (ally.attackTimer <= 0) {
                        ally.attackTimer = ally.spec.cooldown || 1.2;
                        this._executePokemonAttack(ally, enemies);
                    }
                }

                if (ally.life <= 0) {
                    if (ally === this.activeMonkeyBomb) this.activeMonkeyBomb = null;
                    BO.FX.spawnParticles(ally.pos.clone().add(new THREE.Vector3(0, 0.7, 0)), 16, 0xef4444, 5, 2, 0.5, 1.4);
                    if (BO.World.scene) BO.World.scene.remove(ally.group);
                    this.activePokemonAllies.splice(i, 1);
                }
            }
        }

        _executePokemonAttack(ally, enemies) {
            const P = BO.Player;
            const s = ally.spec;
            const origin = ally.group.position.clone().add(new THREE.Vector3(0, 0.85, 0));
            const dummyW = { id: 'pokeball_' + s.id, isPaP: true, stats: { papEffect: s.behavior === 'napalm_breath' ? 'incendiary' : null }, cfg: { id: 'm4a1' } };

            if (s.behavior === 'chain_thunder') {
                // Pikachu Thunderbolt chain across up to 5 enemies
                let prev = origin;
                for (let i = 0; i < Math.min(5, enemies.length); i++) {
                    const e = enemies[i];
                    const pt = e.pos.clone().add(new THREE.Vector3(0, 1.1, 0));
                    BO.FX.spawnTracer(prev, pt, s.fxColor, 0.08, 0.25);
                    e.stunTimer = Math.max(e.stunTimer || 0, 1.6);
                    if (this.onHitEnemy) this.onHitEnemy(e, s.damage, 'torso', prev.distanceTo(pt), dummyW, pt, new THREE.Vector3(0, 1, 0));
                    prev = pt;
                }
            } else if (s.behavior === 'napalm_breath') {
                // Charizard Flamethrower cone + mini napalm pool
                const target = enemies[0];
                const pt = target.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
                BO.FX.spawnTracer(origin, pt, 0xf97316, 0.16, 0.22);
                this._spawnNapalmPool(target.pos.clone(), 3.6, 4.0);
                for (let i = 0; i < Math.min(4, enemies.length); i++) {
                    enemies[i].burnTimer = 4.5;
                    if (this.onHitEnemy) this.onHitEnemy(enemies[i], s.damage, 'torso', 4.0, dummyW, enemies[i].pos.clone(), new THREE.Vector3(0, 1, 0));
                }
            } else if (s.behavior === 'hydro_knockback') {
                // Blastoise Hydro Cannon torrent
                for (let i = 0; i < Math.min(4, enemies.length); i++) {
                    const e = enemies[i];
                    const pt = e.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
                    BO.FX.spawnTracer(origin, pt, 0x38bdf8, 0.14, 0.22);
                    if (e.vel) {
                        const push = e.pos.clone().sub(ally.pos).normalize();
                        e.vel.x += push.x * 18;
                        e.vel.y = 6.0;
                        e.vel.z += push.z * 18;
                    }
                    if (this.onHitEnemy) this.onHitEnemy(e, s.damage, 'torso', 4.0, dummyW, pt, new THREE.Vector3(0, 1, 0));
                }
            } else if (s.behavior === 'poison_vines') {
                // Venusaur Razor Leaf & Poison Spores
                BO.FX.spawnParticles(origin, 16, 0x4ade80, 5.5, 1, 0.6, 1.5);
                for (let i = 0; i < Math.min(5, enemies.length); i++) {
                    const e = enemies[i];
                    e.stunTimer = Math.max(e.stunTimer || 0, 1.2);
                    e.burnTimer = Math.max(e.burnTimer || 0, 4.0);
                    BO.FX.spawnTracer(origin, e.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0x22c55e, 0.07, 0.2);
                    if (this.onHitEnemy) this.onHitEnemy(e, s.damage, 'torso', 4.0, dummyW, e.pos.clone(), new THREE.Vector3(0, 1, 0));
                }
            } else if (s.behavior === 'shadow_drain') {
                // Gengar Shadow Ball life drain
                for (let i = 0; i < Math.min(3, enemies.length); i++) {
                    const e = enemies[i];
                    const pt = e.pos.clone().add(new THREE.Vector3(0, 1.1, 0));
                    BO.FX.spawnTracer(origin, pt, 0xa855f7, 0.11, 0.22);
                    BO.FX.spawnExplosion(pt, 2.2, 0x9333ea);
                    if (this.onHitEnemy) this.onHitEnemy(e, s.damage, 'head', 4.0, dummyW, pt, new THREE.Vector3(0, 1, 0));
                }
                P.hp = Math.min(P.maxHp, P.hp + 20);
                P.armor = Math.min(P.maxArmor, P.armor + 15);
            } else if (s.behavior === 'psystrike_lift') {
                // Mewtwo Psystrike telekinetic lift & slam
                for (let i = 0; i < Math.min(6, enemies.length); i++) {
                    const e = enemies[i];
                    if (e.vel) e.vel.y = 8.5;
                    e.stunTimer = Math.max(e.stunTimer || 0, 1.8);
                    const pt = e.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
                    BO.FX.spawnParticles(pt, 10, 0xc084fc, 4, 2, 0.5, 1.4);
                    if (this.onHitEnemy) this.onHitEnemy(e, s.damage, 'head', 4.0, dummyW, pt, new THREE.Vector3(0, 1, 0));
                }
            } else if (s.behavior === 'aura_sphere') {
                // Lucario Aura Sphere boss slayer
                const e = enemies[0];
                const pt = e.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
                BO.FX.spawnTracer(origin, pt, 0x60a5fa, 0.12, 0.2);
                BO.FX.spawnExplosion(pt, 2.6, 0x3b82f6);
                const dmg = e.isBoss ? s.damage * 2.5 : s.damage;
                if (this.onHitEnemy) this.onHitEnemy(e, dmg, 'head', 4.0, dummyW, pt, new THREE.Vector3(0, 1, 0));
            } else if (s.behavior === 'snorlax_quake') {
                // Snorlax Body Slam Earthquake
                BO.FX.spawnExplosion(ally.pos.clone(), 6.5, 0xf59e0b);
                P.cameraShake = Math.max(P.cameraShake, 0.05);
                for (const e of enemies) {
                    if (e.pos.distanceTo(ally.pos) <= 7.5) {
                        if (e.vel) e.vel.y = 6.5;
                        e.stunTimer = Math.max(e.stunTimer || 0, 2.0);
                        if (this.onHitEnemy) this.onHitEnemy(e, s.damage, 'torso', 3.0, dummyW, e.pos.clone(), new THREE.Vector3(0, 1, 0));
                    }
                }
            } else if (s.behavior === 'hyper_beam') {
                // Gyarados Hyper Beam laser sweep
                for (let i = 0; i < Math.min(6, enemies.length); i++) {
                    const e = enemies[i];
                    const pt = e.pos.clone().add(new THREE.Vector3(0, 1.1, 0));
                    BO.FX.spawnTracer(origin, pt, 0x38bdf8, 0.18, 0.28);
                    if (this.onHitEnemy) this.onHitEnemy(e, s.damage, 'head', 5.0, dummyW, pt, new THREE.Vector3(0, 1, 0));
                }
            } else if (s.behavior === 'draco_meteor') {
                // Rayquaza Draco Meteor orbital barrage
                for (let i = 0; i < Math.min(4, enemies.length); i++) {
                    const e = enemies[i];
                    const pt = e.pos.clone();
                    const sky = pt.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, 28, (Math.random() - 0.5) * 6));
                    BO.FX.spawnTracer(sky, pt, 0x34d399, 0.26, 0.35);
                    BO.FX.spawnExplosion(pt, 3.8, 0x10b981);
                    if (this.onHitEnemy) this.onHitEnemy(e, s.damage, 'torso', 5.0, dummyW, pt, new THREE.Vector3(0, -1, 0));
                }
            }
        }

        _detonateExplosion(pos, radius, damage, owner, isFlash = false, stunDur = 0, weaponId = 'frag', color = 0xff7722) {
            if (!isFlash && owner === 'player' && BO.Player.matchRules.noExplosiveDamage) return;
            const distToPlayer = pos.distanceTo(BO.Player.pos);
            if (isFlash) {
                BO.Sound.playFlashbang(pos, BO.Math.clamp(1 - distToPlayer / Math.max(1, radius), 0, 1));
                BO.FX.spawnParticles(pos, 18, 0xffffff, 8, 2, 0.35, 1.8);
                if (distToPlayer < radius) {
                    BO.Player.flashBlindTimer = Math.max(BO.Player.flashBlindTimer, 1.8 * (1 - distToPlayer / radius) * (BO.Player.mpPerks.includes('tactical_mask') ? 0.35 : 1));
                }
            } else {
                BO.Sound.playExplosion(pos);
                BO.FX.spawnExplosion(pos, radius, color);
                if (distToPlayer < radius) {
                    const mine = weaponId === 'claymore' || weaponId === 'bouncing_betty';
                    const selfDmg = damage * (1 - distToPlayer / radius) * 0.45 * (mine && BO.Player.mpPerks.includes('recon_spotter') ? 0.4 : 1);
                    BO.Player.takeDamage(selfDmg, pos, true);
                    BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.08);
                }
            }

            if (this.onExplodeAt) {
                this.onExplodeAt(pos, radius, damage, owner, isFlash, stunDur, weaponId);
            }
        }

        _survivalPunch(isHeavy = false) {
            const P = BO.Player;
            if (!P.usingBareHands || !P.alive || P.swapTimer > 0 || P.meleeTimer > 0 ||
                P.fireCooldown > 0 || !this.camera) return;

            P.bareComboStep = isHeavy ? 2 : ((P.bareComboStep + 1) % 3);
            P.bareComboWindow = 1.05;
            const isFinisher = isHeavy || P.bareComboStep === 2;
            P.fireCooldown = isHeavy ? 0.56 : 0.36;
            P.meleeTimer = isHeavy ? 0.30 : 0.25;
            P.punchSide *= -1;
            BO.Sound.playMelee();

            const aim = P.getAimRay(this.camera);
            const reach = isFinisher ? 2.30 : 2.05;
            const wall = BO.World.raycastWorld(aim.origin, aim.dir, reach);
            this.raycaster.set(aim.origin, aim.dir);
            this.raycaster.far = Math.min(reach, wall?.distance ?? reach);
            const hits = this._castTargets();
            const hit = hits.find((result) => result.object.userData.entity?.alive);
            if (!hit || !this.onHitEnemy) {
                // No enemy in reach: bare hands still break deposits, trees and timber (slowly).
                const m = BO.SurvivalMode;
                if (m?.active) m.campaign?.pack?.swing(null, aim, wall, isFinisher ? 1.35 : 1);
                return;
            }

            const ent = hit.object.userData.entity;
            const deep = BO.SurvivalMode?.campaign?.deep;
            const mfx = deep?.modFx || {};
            let dmg = isHeavy ? 96 : (P.bareComboStep === 2 ? 72 : P.bareComboStep === 1 ? 52 : 44);
            if (deep) {
                dmg *= (1 + (deep.attributes.strength || 0) * 0.18) * (mfx.fistsDmgMult || 1);
                if (deep.hasTalisman('claw_talisman')) dmg *= 1.35;
                if (mfx.lowStamFury && (P.tacStamina < 0.35 || P.hp < P.maxHp * 0.4)) dmg *= 1.25;
            }
            let critHit = false;
            if (ent.parriedUntil && ent.parriedUntil > performance.now() / 1000) {
                dmg *= 2.8;
                ent.parriedUntil = 0;
                critHit = true;
                BO.Events.emit('hud:toast', { text: 'RIPOSTE!', color: '#facc15' });
            } else if (P.crouching && deep && deep.stealthFactor < 0.7 && ent.pos) {
                const toPlayer = new THREE.Vector3(P.pos.x - ent.pos.x, 0, P.pos.z - ent.pos.z).normalize();
                const entFwd = new THREE.Vector3(Math.sin(ent.yaw || 0), 0, Math.cos(ent.yaw || 0));
                if (toPlayer.dot(entFwd) < -0.25) {
                    const bsMult = mfx.backstabMult || 3.5;
                    dmg *= bsMult;
                    critHit = true;
                    BO.Events.emit('hud:toast', { text: `STEALTH TAKEDOWN (${bsMult.toFixed(1)}x)!`, color: '#38bdf8' });
                }
            }
            if (isHeavy && mfx.heavyIgnites && ent) {
                ent.burnTimer = Math.max(ent.burnTimer || 0, 3.0);
                dmg *= 1.25;
            }
            if (isFinisher && ent && !ent.isBoss) {
                ent.stunTimer = Math.max(ent.stunTimer || 0, (isHeavy ? 0.9 : 0.45) * (mfx.staggerBonus || 1));
            }

            if (BO.Settings.get('bloodLevel') !== 'off') {
                BO.FX.spawnParticles(hit.point, critHit ? 10 : 4, critHit ? 0xfacc15 : 0x991b1b, 2.8, 9, 0.25, 0.7);
            }
            const descriptor = { id: 'survival_fists', stats: { kind: 'melee' } };
            const killed = this.onHitEnemy(ent, Math.round(dmg), critHit ? 'head' : 'torso', hit.distance, descriptor, hit.point, aim.dir);
            BO.Sound.playHitmarker(critHit, killed);
            BO.Events.emit('hud:hitmarker', { isHeadshot: critHit, isKill: killed });
        }

        /** Survival: swing a held tool. Hits enemies first, otherwise gathers what is in front. */
        _survivalToolSwing(toolId) {
            const P = BO.Player;
            const m = BO.SurvivalMode;
            if (!P.alive || !m?.active || P.swapTimer > 0 || P.meleeTimer > 0 || P.fireCooldown > 0 || !this.camera) return;
            const pack = m.campaign?.pack;
            const tool = BO.SurvivalFrontierData.tools[toolId];
            if (!pack || !tool) return;
            const broken = !(pack.tools[toolId] > 0);
            const gSpd = m.campaign.deep?.modFx?.gatherSpeedMult || 1;
            const cadence = (tool.family === 'pick' && toolId === 'miningDrill' ? 0.34 : 0.5) / gSpd;
            P.fireCooldown = cadence;
            P.meleeTimer = Math.min(0.34, cadence * 0.9);
            P.meleeDur = P.meleeTimer;
            BO.Sound.playMelee();
            const aim = P.getAimRay(this.camera);
            const reach = 2.5;
            const wall = BO.World.raycastWorld(aim.origin, aim.dir, reach);
            this.raycaster.set(aim.origin, aim.dir);
            this.raycaster.far = Math.min(reach, wall?.distance ?? reach);
            const hit = this._castTargets().find((r) => r.object.userData.entity?.alive);
            if (hit && this.onHitEnemy) {
                const deep = m.campaign.deep;
                const base = { axe: 58, pick: 52, shovel: 40 }[tool.family] || 45;
                let dmg = (broken ? 30 : base + (tool.level - 1) * 14) * (1 + (deep?.attributes?.strength || 0) * 0.12);
                if (deep?.hasTalisman('claw_talisman')) dmg *= 1.2;
                if (!broken) pack.wearTool(toolId, 0.5);
                if (BO.Settings.get('bloodLevel') !== 'off') BO.FX.spawnParticles(hit.point, 5, 0x991b1b, 2.8, 9, 0.25, 0.7);
                const ent = hit.object.userData.entity;
                const killed = this.onHitEnemy(ent, Math.round(dmg), 'torso', hit.distance, { id: 'survival_tool', stats: { kind: 'melee' } }, hit.point, aim.dir);
                if (!ent.isBoss) ent.stunTimer = Math.max(ent.stunTimer || 0, 0.25);
                BO.Sound.playHitmarker(false, killed);
                BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: killed });
                return;
            }
            pack.swing(broken ? null : toolId, aim, wall, 1);
        }

        meleeAttack() {
            const P = BO.Player;
            if (!P.alive || P.meleeTimer > 0 || !this.camera) return;
            if (P.usingBareHands) {
                if (P.survivalProp?.kind === 'tool') {
                    P.fireCooldown = 0;
                    this._survivalToolSwing(P.survivalProp.id);
                    return;
                }
                this._survivalPunch();
                return;
            }
            if (BO.Superpowers.use(this.camera) || P.matchRules.noMelee) return;
            P.meleeTimer = P.zombiePerks.has('bare_knuckle') ? 0.19 : 0.28;
            P.reloading = false;
            BO.Sound.playMelee();

            const aim = P.getAimRay(this.camera);
            this.raycaster.set(aim.origin, aim.dir);
            this.raycaster.far = (P.mpPerks.includes('bayonet_drill') ? 3.55 : 2.55) + (P.activeWeapon?.stats.meleeReach || 0);
            const hits = this._castTargets();
            for (const h of hits) {
                const ent = h.object.userData.entity;
                if (ent && ent.alive && this.onHitEnemy) {
                    BO.FX.spawnParticles(h.point, 8, 0x991b1b, 3.2, 10, 0.35, 1.0);
                    const killed = this.onHitEnemy(ent, 150, 'torso', h.distance, { id: 'knife', stats: { id: 'knife', kind: 'melee' } }, h.point, aim.dir);
                    if (BO.State.activeMode !== 'owrpg') BO.Sound.playHitmarker(false, killed);
                    BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: killed });
                    break;
                }
            }
        }

        activateFieldUpgrade() {
            if (BO.Player.matchRules.noField) return;
            const P = BO.Player;
            if (!P.alive || P.fieldCharge < 1.0) return;
            P.fieldCharge = 0;
            const id = P.fieldUpgradeId;
            const spec = BO.AttachmentsData.FIELD_UPGRADES[id];
            BO.Sound.playPerkBuy();

            if (id === 'munitions_box') {
                P.refillAllAmmo();
                BO.Events.emit('hud:toast', { text: 'MUNITIONS BOX DEPLOYED — AMMO & GEAR REFILLED', color: '#f5a623' });
            } else if (id === 'aether_shroud') {
                P.aetherActive = true;
                P.fieldActiveTimer = spec.duration;
                BO.Events.emit('hud:toast', { text: 'AETHER SHROUD ACTIVE — INVISIBLE TO HOSTILES', color: '#a855f7' });
            } else if (id === 'frenzied_guard') {
                P.frenziedActive = true;
                P.armor = P.maxArmor;
                P.fieldActiveTimer = spec.duration;
                BO.Events.emit('hud:toast', { text: 'FRENZIED GUARD ACTIVE — FULL ARMOR RESTORED', color: '#38bdf8' });
            } else if (id === 'trophy_system') {
                P.fieldActiveTimer = spec.duration;
                BO.Events.emit('hud:toast', { text: 'TROPHY PULSE ACTIVE — BLAST DEFENSE ONLINE', color: '#22c55e' });
            }
        }

        activateUltimate() {
            if (BO.Player.matchRules.noUltimates) return;
            const P = BO.Player;
            if (!P.alive || P.ultimateCharge < 1.0 || !this.camera) return;
            P.ultimateCharge = 0;
            const id = P.ultimateId || 'gravity_spikes';
            const spec = BO.AttachmentsData.ULTIMATE_POWERS[id];
            BO.Sound.playUltimate(id);
            BO.Events.emit('hud:banner', {
                title: `ULTIMATE: ${(spec ? spec.name : id).toUpperCase()}`,
                sub: 'SUPER ABILITY UNLEASHED!',
                color: '#fde047'
            });

            const aim = P.getAimRay(this.camera);
            if (id === 'gravity_spikes') {
                const origin = P.pos.clone().add(new THREE.Vector3(0, 0.4, 0));
                BO.FX.spawnExplosion(origin, 9.5, 0x38bdf8);
                BO.Sound.playExplosion(1.0);
                P.cameraShake = 0.09;
                if (this.onExplodeAt) this.onExplodeAt(origin, 9.8, 1200, 'player', false, 0, 'gravity_spikes');
            } else if (id === 'annihilator') {
                const endPt = aim.origin.clone().addScaledVector(aim.dir, 75);
                BO.FX.spawnTracer(aim.origin.clone().addScaledVector(aim.dir, 0.8), endPt, 0xfde047, 0.14, 0.45);
                this.raycaster.set(aim.origin, aim.dir);
                this.raycaster.far = 75;
                const hits = this._castTargets();
                const seen = new Set();
                let count = 0;
                for (const h of hits) {
                    const ent = h.object.userData.entity;
                    if (!ent || !ent.alive || seen.has(ent) || count >= 8) continue;
                    seen.add(ent);
                    count++;
                    BO.FX.spawnParticles(h.point, 14, 0xfde047, 5, 8, 0.5, 1.5);
                    if (this.onHitEnemy) this.onHitEnemy(ent, 2200, 'head', h.distance, P.activeWeapon, h.point, aim.dir);
                }
                if (count > 0) {
                    BO.Sound.playHitmarker(true, true);
                    BO.Events.emit('hud:hitmarker', { isHeadshot: true, isKill: true });
                }
            } else if (id === 'death_machine') {
                P.overdriveActive = true;
                P.ultimateActiveTimer = spec.duration || 12.0;
                if (P.activeWeapon) P.activeWeapon.mag = P.activeWeapon.stats.magSize;
            } else if (id === 'cryo_nova') {
                const origin = P.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
                BO.FX.spawnExplosion(origin, 14, 0x38bdf8);
                if (this.onExplodeAt) this.onExplodeAt(origin, 16.0, 0, 'player', false, spec.duration || 7.0, 'cryo_nova');
            } else if (id === 'orbital_strike') {
                const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
                for (let b = 0; b < 4; b++) {
                    const target = P.pos.clone().addScaledVector(fwd, 7 + b * 4.5);
                    setTimeout(() => {
                        if (!BO.World.scene) return;
                        BO.FX.spawnTracer(target.clone().add(new THREE.Vector3(0, 38, 0)), target, 0xf59e0b, 0.38, 0.45);
                        BO.FX.spawnExplosion(target, 7.5, 0xff5500);
                        BO.Sound.playExplosion(0.95);
                        if (this.onExplodeAt) this.onExplodeAt(target, 8.2, 850, 'player', false, 0, 'orbital_strike');
                    }, b * 320);
                }
            }
        }

        callKillstreak(ksId) {
            if (!this.onActivateKillstreak) return false;
            return this.onActivateKillstreak(ksId);
        }
    }

    BO.Combat = new CombatSystem();
})(window);
