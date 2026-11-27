/* ============================================================================
   BLACKOUT OPS — RPG Isaac-Style Run Items, Orbitals, Familiars, Pickups,
   Pedestals, Devil/Angel Deals, Pills, Cards & Transformations.
   Loaded before RPGMode.js. Zero-build IIFE pattern.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const UP = new THREE.Vector3(0, 1, 0);

    function seededShuffle(arr, seed) {
        const out = arr.slice();
        let s = (seed >>> 0) || 1;
        for (let i = out.length - 1; i > 0; i--) {
            s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
            const j = s % (i + 1);
            const tmp = out[i];
            out[i] = out[j];
            out[j] = tmp;
        }
        return out;
    }

    function disposeObject3D(root) {
        if (!root) return;
        root.removeFromParent();
        const mats = new Set();
        root.traverse((obj) => {
            if (!obj.isMesh) return;
            if (obj.geometry) obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m && mats.add(m));
            else if (obj.material) mats.add(obj.material);
        });
        mats.forEach((m) => m.dispose());
    }

    class RPGItems {
        constructor() {
            this.pedestals = [];
            this.pickups = [];
            this.bombs = [];
            this.rocks = [];      // { type: 'urn'|'tinted', mesh, group, pos, hp, dead, entity }
            this.lockedChests = [];
            this.orbitals = [];   // 3D meshes orbiting player
            this.familiars = [];  // 3D buddy meshes following player
            this.turrets = [];    // deployed 3D turrets for the room
            this._orbitalAngle = 0;
            this._stormTimer = 0;
            this._chariotHitCd = new WeakMap();
            this._familiarSignature = '';
        }

        get D() { return BO.RPGData; }
        get ID() { return BO.RPGItemsData; }
        get M() { return BO.RPGMode; }
        get P() { return BO.Player; }
        get run() { return this.M?.run || null; }

        /* ======================================================================
           Run state initialization & serialization helpers
        ====================================================================== */

        ensureRunState(run) {
            if (!run) return run;
            const I = this.D.ISAAC || {};
            if (!Array.isArray(run.artifacts)) run.artifacts = [];
            if (run.activeItem === undefined) run.activeItem = null;
            if (!Number.isFinite(run.activeCharges)) run.activeCharges = 0;
            if (!run.pocket || typeof run.pocket !== 'object') run.pocket = null;
            if (!run.pillMap || typeof run.pillMap !== 'object' || Object.keys(run.pillMap).length < 10) {
                run.pillMap = this._buildPillMap(run.seed || 1);
            }
            if (!Number.isFinite(run.keys)) run.keys = I.startKeys ?? 1;
            if (!Number.isFinite(run.bombs)) run.bombs = I.startBombs ?? 2;
            if (!Number.isFinite(run.soulShield)) run.soulShield = 0;
            if (!Number.isFinite(run.devilDeals)) run.devilDeals = 0;
            if (!Number.isFinite(run.angelChance)) run.angelChance = 0.5;
            if (!Array.isArray(run.transformations)) run.transformations = [];
            if (typeof run.holyMantleReady !== 'boolean') run.holyMantleReady = run.artifacts.includes('holy_mantle');
            if (!Number.isFinite(run.livesLeft)) run.livesLeft = 0;
            if (!Number.isFinite(run.devilHpPenalty)) run.devilHpPenalty = 0;
            if (typeof run.tookRedHpDamageOnFloor !== 'boolean') run.tookRedHpDamageOnFloor = false;
            if (!run.permPillBuffs || typeof run.permPillBuffs !== 'object') {
                run.permPillBuffs = { dmgMult: 1, fireRateMult: 1, moveSpeedMult: 1, reloadSpeedMult: 1, maxHpAdd: 0 };
            }
            if (!run.tempFloorBuffs || typeof run.tempFloorBuffs !== 'object') {
                run.tempFloorBuffs = { dmgMult: 1, maxHpAdd: 0, emperorTimer: 0, devilCardTimer: 0, chariotTimer: 0, familiarMult: 1 };
            }
            if (!Number.isFinite(run.vampiricKills)) run.vampiricKills = 0;
            if (!Number.isFinite(run.deadEyeStreak)) run.deadEyeStreak = 0;
            return run;
        }

        initRun(run) {
            this.clearVisuals();
            this.ensureRunState(run);
            return run;
        }

        _buildPillMap(seed) {
            const shuffled = seededShuffle(this.ID.PILLS.map((p) => p.id), (seed || 1) + 9173);
            const map = {};
            for (let i = 0; i < this.ID.PILL_APPEARANCES.length; i++) {
                map[String(i)] = { id: shuffled[i % shuffled.length], identified: false };
            }
            return map;
        }

        has(id) {
            const r = this.run;
            return !!(r && Array.isArray(r.artifacts) && r.artifacts.includes(id));
        }

        hasTransformation(id) {
            const r = this.run;
            return !!(r && Array.isArray(r.transformations) && r.transformations.includes(id));
        }

        transformationCounts(run = this.run) {
            const counts = {};
            for (const t of this.ID.TRANSFORMATIONS) counts[t.id] = 0;
            if (!run) return counts;
            const ids = [...(run.artifacts || [])];
            if (run.activeItem) ids.push(run.activeItem);
            const seen = new Set();
            for (const id of ids) {
                if (seen.has(id)) continue;
                seen.add(id);
                const def = this.ID.itemById(id);
                if (!def || !def.tags) continue;
                for (const tag of def.tags) {
                    if (counts[tag] !== undefined) counts[tag]++;
                }
            }
            return counts;
        }

        _checkTransformations(run = this.run) {
            if (!run) return;
            const counts = this.transformationCounts(run);
            for (const t of this.ID.TRANSFORMATIONS) {
                if (counts[t.id] >= 3 && !run.transformations.includes(t.id)) {
                    run.transformations.push(t.id);
                    if (t.fx.grantSoulShield) {
                        this.addSoulShield(t.fx.grantSoulShield);
                    }
                    this.M?.recomputeStats?.();
                    BO.RPGUnlocks?.record?.(BO.RPGProfile.data, 'transformations', 1);
                    BO.Sound?.playQuestFanfare?.();
                    BO.FX?.spawnParticles?.(this.P.pos.clone().add(UP), 34, t.hex, 5.5, -1, 0.9, 1.5);
                    BO.Events.emit('hud:banner', {
                        title: `TRANSFORMATION: ${t.name.toUpperCase()}`,
                        sub: t.desc,
                        color: t.color
                    });
                    BO.Events.emit('hud:toast', { text: `${t.icon} ${t.name.toUpperCase()} AWAKENED!`, color: t.color });
                }
            }
        }

        /* ======================================================================
           Stat integration for RPGProfile & Shared Engine (Combat / Player)
        ====================================================================== */

        applyProfileStats(s, run) {
            this.ensureRunState(run);
            let maxHpAdd = (run.permPillBuffs?.maxHpAdd || 0) + (run.tempFloorBuffs?.maxHpAdd || 0);
            let maxHpMult = 1;
            let goldBonus = 0;
            for (const id of run.artifacts) {
                const def = this.ID.passiveById(id);
                if (!def || !def.fx) continue;
                if (def.fx.maxHpAdd) maxHpAdd += def.fx.maxHpAdd;
                if (def.fx.maxHpMult) maxHpMult *= def.fx.maxHpMult;
                if (def.fx.goldBonusMult) goldBonus += (def.fx.goldBonusMult - 1) * 100;
            }
            if (Array.isArray(run.transformations) && run.transformations.includes('goliath')) {
                maxHpAdd += 40;
            }
            s.maxHp = Math.max(30, Math.round((s.maxHp + maxHpAdd) * maxHpMult * (1 - (run.devilHpPenalty || 0))));
            s.goldFind += goldBonus;
        }

        shotModifiers() {
            const out = {
                damageMult: 1,
                fireRateMult: 1,
                multishot: 0,
                spreadAdd: 0,
                rangeMult: 1,
                homing: false,
                bounceCount: 0,
                pierceAdd: 0,
                explosive: false,
                explosiveRadius: 0,
                splitCount: 0,
                spectral: false,
                giantScale: 1,
                tracerColor: null,
                tracerWidth: 0.024,
                chainLightning: false,
                brimstone: false,
                techRing: false,
                vampiric: false,
                tinyPlanet: false
            };
            const r = this.run;
            if (!r || !this.M?.active) return out;
            this.ensureRunState(r);

            for (const id of r.artifacts) {
                const def = this.ID.passiveById(id);
                if (!def || !def.fx) continue;
                const fx = def.fx;
                if (fx.damageMult) out.damageMult *= fx.damageMult;
                if (fx.fullHpDmgMult && this.P && this.P.hp >= this.P.maxHp - 0.5) out.damageMult *= fx.fullHpDmgMult;
                if (fx.fireRateMult) out.fireRateMult *= fx.fireRateMult;
                if (fx.multishot) out.multishot += fx.multishot;
                if (fx.spreadAdd) out.spreadAdd += fx.spreadAdd;
                if (fx.rangeMult) out.rangeMult *= fx.rangeMult;
                if (fx.homing) out.homing = true;
                if (fx.bounceCount) out.bounceCount += fx.bounceCount;
                if (fx.pierceAdd) out.pierceAdd += fx.pierceAdd;
                if (fx.explosive) {
                    out.explosive = true;
                    out.explosiveRadius = Math.max(out.explosiveRadius, fx.explosiveRadius || 3.2);
                }
                if (fx.splitCount) out.splitCount += fx.splitCount;
                if (fx.spectral) out.spectral = true;
                if (fx.giantScale) out.giantScale = Math.max(out.giantScale, fx.giantScale);
                if (fx.tracerColor) out.tracerColor = fx.tracerColor;
                if (fx.tracerWidth) out.tracerWidth = Math.max(out.tracerWidth, fx.tracerWidth);
                if (fx.chainLightning) out.chainLightning = true;
                if (fx.brimstone) out.brimstone = true;
                if (fx.techRing) out.techRing = true;
                if (fx.vampiric) out.vampiric = true;
                if (fx.tinyPlanet) out.tinyPlanet = true;
            }

            if (this.has('dead_eye') && r.deadEyeStreak > 0) {
                out.damageMult *= 1 + Math.min(0.4, r.deadEyeStreak * 0.05);
            }

            // Transformations
            for (const tid of r.transformations) {
                const tf = this.ID.transformationById(tid);
                if (!tf || !tf.fx) continue;
                if (tf.fx.damageMult) out.damageMult *= tf.fx.damageMult;
                if (tf.fx.fireRateMult) out.fireRateMult *= tf.fx.fireRateMult;
                if (tf.fx.pierceAdd) out.pierceAdd += tf.fx.pierceAdd;
                if (tf.fx.spectral) out.spectral = true;
            }

            // Pills & active Tarot cards
            if (r.permPillBuffs) {
                out.damageMult *= r.permPillBuffs.dmgMult || 1;
                out.fireRateMult *= r.permPillBuffs.fireRateMult || 1;
            }
            if (r.tempFloorBuffs) {
                out.damageMult *= r.tempFloorBuffs.dmgMult || 1;
                if (r.tempFloorBuffs.emperorTimer > 0) {
                    out.damageMult *= 1.5;
                    out.fireRateMult *= 1.3;
                }
                if (r.tempFloorBuffs.devilCardTimer > 0) {
                    out.damageMult *= 1.75;
                }
            }

            out.fireRateMult = BO.Math.clamp(out.fireRateMult, 0.25, 8.0);
            out.damageMult = BO.Math.clamp(out.damageMult, 0.15, 25.0);
            out.rangeMult = BO.Math.clamp(out.rangeMult, 0.4, 3.0);
            return out;
        }

        moveSpeedMult() {
            const r = this.run;
            if (!r || !this.M?.active) return 1;
            let mult = r.permPillBuffs?.moveSpeedMult || 1;
            for (const id of r.artifacts) {
                const fx = this.ID.passiveById(id)?.fx;
                if (fx?.moveSpeedMult) mult *= fx.moveSpeedMult;
            }
            if (this.hasTransformation('void')) mult *= 1.2;
            if (r.tempFloorBuffs?.chariotTimer > 0) mult *= 1.5;
            return BO.Math.clamp(mult, 0.5, 2.5);
        }

        reloadSpeedMult() {
            const r = this.run;
            if (!r || !this.M?.active) return 1;
            let mult = r.permPillBuffs?.reloadSpeedMult || 1;
            for (const id of r.artifacts) {
                const fx = this.ID.passiveById(id)?.fx;
                if (fx?.reloadSpeedMult) mult *= fx.reloadSpeedMult;
            }
            return BO.Math.clamp(mult, 0.5, 3.0);
        }

        /* ======================================================================
           Granting Artifacts, Soul Shield, Active Items, Pockets
        ====================================================================== */

        addSoulShield(amount) {
            const r = this.run;
            if (!r || amount <= 0) return 0;
            const cap = this.D.ISAAC?.soulShieldCap || 150;
            const prev = r.soulShield || 0;
            r.soulShield = Math.min(cap, prev + Math.round(amount));
            return r.soulShield - prev;
        }

        grantArtifact(id, opts = {}) {
            const r = this.run;
            if (!r) return false;
            this.ensureRunState(r);
            const activeDef = this.ID.activeById(id);
            if (activeDef) {
                const oldId = r.activeItem;
                r.activeItem = id;
                r.activeCharges = activeDef.charges;
                if (oldId && opts.dropOldAt) {
                    this.spawnPedestal(opts.dropOldAt.clone().add(new THREE.Vector3(1.5, 0, 0)), oldId, 'free');
                }
                this._checkTransformations(r);
                BO.Sound?.playPowerUp?.();
                BO.Events.emit('hud:banner', {
                    title: `${activeDef.icon} ${activeDef.name.toUpperCase()}`,
                    sub: activeDef.desc,
                    color: activeDef.color
                });
                return true;
            }

            const def = this.ID.passiveById(id);
            if (!def) return false;
            if (!r.artifacts.includes(id)) r.artifacts.push(id);
            if (def.fx?.holyMantle) r.holyMantleReady = true;
            if (def.fx?.grantLives) r.livesLeft += def.fx.grantLives;
            if (def.fx?.soulShieldOnPickup) this.addSoulShield(def.fx.soulShieldOnPickup);
            if (def.fx?.dealChanceAdd) r.angelChance = BO.Math.clamp(r.angelChance + def.fx.dealChanceAdd * 0.5, 0, 1);

            this.M?.recomputeStats?.();
            if (def.fx?.fullHealOnPickup && this.P) this.P.hp = this.P.maxHp;

            this._rebuildOrbitalsAndFamiliars();
            this._checkTransformations(r);
            BO.RPGUnlocks?.record?.(BO.RPGProfile.data, 'artifactsCollected', 1);
            BO.Sound?.playPaPChime?.();
            BO.Events.emit('hud:banner', {
                title: `${def.icon} ${def.name.toUpperCase()}`,
                sub: def.desc,
                color: def.color
            });
            return true;
        }

        /* ======================================================================
           Active Items (BO.RPGItems.useActive() -> KeyG / KeyC)
        ====================================================================== */

        useActive() {
            const M = this.M;
            const r = this.run;
            const P = this.P;
            if (!M?.active || !r || !P?.alive || M.state === 'transition' || M.state === 'ended') return false;
            this.ensureRunState(r);
            if (!r.activeItem) {
                BO.Events.emit('hud:toast', { text: 'NO ACTIVE ARTIFACT EQUIPPED', color: '#94a3b8' });
                return false;
            }
            const def = this.ID.activeById(r.activeItem);
            if (!def) return false;
            if (r.activeCharges < def.charges) {
                BO.Sound?.playEmptyClick?.();
                BO.Events.emit('hud:toast', { text: `${def.name.toUpperCase()} NEEDS ${def.charges - r.activeCharges} MORE CHARGE`, color: '#94a3b8' });
                return false;
            }

            if (def.id === 'the_d6') {
                const unclaimed = this.pedestals.filter((p) => !p.claimed);
                if (!unclaimed.length) {
                    BO.Events.emit('hud:toast', { text: 'THE D6 — NO PEDESTALS IN THIS ROOM TO REROLL', color: '#94a3b8' });
                    return false;
                }
                r.activeCharges = 0;
                this.rerollPedestals();
                BO.Sound?.playMysteryBoxJingle?.();
                BO.Events.emit('hud:toast', { text: '🎲 THE D6 REROLLED ALL ROOM PEDESTALS!', color: def.color });
                return true;
            }

            r.activeCharges = 0;
            const pos = P.pos.clone();
            const f = r.floor || 1;
            const roomDmg = (220 + f * 26) * (M.stats?.abilityPower || 1);

            switch (def.id) {
                case 'necronomicon': {
                    BO.FX?.spawnExplosion?.(pos.clone().add(UP), 10, 0x7f1d1d);
                    BO.Sound?.playExplosion?.(1.0);
                    P.cameraShake = Math.max(P.cameraShake, 0.08);
                    for (const z of M.enemies) {
                        if (!M.isAlive(z)) continue;
                        M.dealDamage(z, roomDmg, { source: 'ability', element: 'burn' });
                    }
                    BO.Events.emit('hud:toast', { text: '📕 NECRONOMICON — DARKNESS DEVOURS THE ROOM!', color: def.color });
                    break;
                }
                case 'book_of_shadows': {
                    P.invulnTimer = Math.max(P.invulnTimer, 6.0);
                    BO.FX?.spawnParticles?.(pos.clone().add(UP), 24, 0x38bdf8, 4, -1, 0.8, 1.3);
                    BO.Sound?.playPerkBuy?.();
                    BO.Events.emit('hud:toast', { text: '🛡 BOOK OF SHADOWS — 6S INVULNERABILITY!', color: def.color });
                    break;
                }
                case 'box_of_friends': {
                    r.tempFloorBuffs.familiarMult = (r.tempFloorBuffs.familiarMult || 1) * 2;
                    this._rebuildOrbitalsAndFamiliars();
                    BO.FX?.spawnParticles?.(pos.clone().add(UP), 20, 0xf472b6, 3.5, 1, 0.6, 1.2);
                    BO.Sound?.playPowerUp?.();
                    BO.Events.emit('hud:toast', { text: '🎁 BOX OF FRIENDS — FAMILIARS & ORBITALS DOUBLED!', color: def.color });
                    break;
                }
                case 'stopwatch': {
                    for (const z of M.enemies) {
                        if (!M.isAlive(z)) continue;
                        z.slowTimer = Math.max(z.slowTimer || 0, 8.0);
                        M.applyStatus(z, 'chill', { durMult: 1.6 });
                    }
                    BO.Sound?.playFlashbang?.(1, 0.5);
                    BO.Events.emit('hud:toast', { text: '⏱ STOPWATCH — ENEMIES SLOWED 60% FOR 8S!', color: def.color });
                    break;
                }
                case 'soul_battery': {
                    const gained = this.addSoulShield(40);
                    BO.FX?.spawnParticles?.(pos.clone().add(UP), 18, 0x60a5fa, 3.2, -2, 0.7, 1.2);
                    BO.Sound?.playPowerUp?.();
                    BO.Events.emit('hud:toast', { text: `🔋 SOUL BATTERY — +${gained || 40} SOUL SHIELD`, color: def.color });
                    break;
                }
                case 'tammys_head': {
                    const mods = this.shotModifiers();
                    const origin = (M.camera || BO.App.worldCamera).position.clone();
                    const baseDmg = (P.activeWeapon?.stats?.damage || 45) * mods.damageMult * 1.4;
                    const col = mods.tracerColor || 0xcbd5e1;
                    for (let i = 0; i < 10; i++) {
                        const ang = (i / 10) * Math.PI * 2;
                        const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
                        const end = origin.clone().addScaledVector(dir, 28);
                        BO.FX?.spawnTracer?.(origin.clone().add(new THREE.Vector3(0, -0.15, 0)), end, col, Math.max(0.035, mods.tracerWidth), 0.18);
                        for (const z of M.enemies) {
                            if (!M.isAlive(z)) continue;
                            const to = z.pos.clone().sub(pos);
                            const t = to.x * dir.x + to.z * dir.z;
                            if (t > 0 && t < 28) {
                                const perp = Math.abs(to.x * (-dir.z) + to.z * dir.x);
                                if (perp <= z.radius + 0.75) {
                                    M.dealDamage(z, baseDmg, { source: 'ability', dir });
                                }
                            }
                        }
                    }
                    BO.Sound?.playGunshot?.('shotgun', false, true, 1.0);
                    BO.Events.emit('hud:toast', { text: "🐱 TAMMY'S HEAD — 10-WAY RADIAL BURST!", color: def.color });
                    break;
                }
                case 'teleport_scroll': {
                    this._blastAt(pos, 5.5, roomDmg * 0.7, 0xa855f7);
                    const safe = this._findSafestSpot();
                    P.pos.set(safe.x, safe.y, safe.z);
                    P.vel.set(0, 0, 0);
                    P.invulnTimer = Math.max(P.invulnTimer, 1.5);
                    this._blastAt(safe, 5.5, roomDmg * 0.7, 0xa855f7);
                    BO.Sound?.playParkour?.('vault');
                    BO.Events.emit('hud:toast', { text: '🌀 TELEPORT SCROLL — BLINK BLAST!', color: def.color });
                    break;
                }
                case 'midas_touch': {
                    for (const z of M.enemiesInRadius(pos, 22)) {
                        z.stunTimer = Math.max(z.stunTimer || 0, 2.5);
                        if (z.rpg) z.rpg.gilded = true;
                        BO.FX?.spawnParticles?.(z.pos.clone().add(UP), 10, 0xfbbf24, 3, 2, 0.6, 1.1);
                    }
                    BO.Sound?.playLootChime?.();
                    BO.Events.emit('hud:toast', { text: '✋ MIDAS TOUCH — ENEMIES GILDED!', color: def.color });
                    break;
                }
                case 'turret_deployer': {
                    this._spawnTurret(pos.clone().add(new THREE.Vector3(0, 0, 0)));
                    BO.Sound?.playTurretPlace?.();
                    BO.Events.emit('hud:toast', { text: '🔫 TURRET DEPLOYED FOR THIS FLOOR!', color: def.color });
                    break;
                }
                case 'blood_rights': {
                    const cost = Math.min(15, Math.max(0, P.hp - 1));
                    P.hp = Math.max(1, P.hp - cost);
                    this._blastAt(pos, 26, roomDmg * 1.25, 0xe11d48);
                    BO.Sound?.playExplosion?.(0.9);
                    BO.Events.emit('hud:toast', { text: '🗡 BLOOD RIGHTS — CRIMSON NOVA!', color: def.color });
                    break;
                }
                case 'chaos_orb': {
                    const pool = ['shield', 'lightning', 'freeze', 'coins', 'blast'];
                    const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
                    const b = pool[Math.floor(Math.random() * pool.length)];
                    for (const fxKind of [a, b]) {
                        if (fxKind === 'shield') this.addSoulShield(25);
                        else if (fxKind === 'lightning') {
                            for (const z of M.nearestEnemies(pos, 20, 4)) {
                                BO.FX?.spawnTracer?.(pos.clone().add(UP), z.pos.clone().add(UP), 0x38bdf8, 0.05, 0.2);
                                M.dealDamage(z, roomDmg * 0.65, { source: 'ability', element: 'shock' });
                            }
                        } else if (fxKind === 'freeze') {
                            for (const z of M.enemiesInRadius(pos, 18)) z.frozenTimer = Math.max(z.frozenTimer || 0, 3.0);
                        } else if (fxKind === 'coins') {
                            M._dropGold(pos, 20 + f * 3);
                        } else {
                            this._blastAt(pos, 10, roomDmg * 0.85, 0xd946ef);
                        }
                    }
                    BO.Sound?.playPaPChime?.();
                    BO.Events.emit('hud:toast', { text: '🔮 CHAOS ORB — SURGE UNLEASHED!', color: def.color });
                    break;
                }
                case 'prayer_card': {
                    r.permPillBuffs.maxHpAdd = (r.permPillBuffs.maxHpAdd || 0) + 15;
                    M.recomputeStats();
                    M.heal(25);
                    BO.FX?.spawnParticles?.(pos.clone().add(UP), 22, 0xfef08a, 3.5, -2, 0.8, 1.3);
                    BO.Sound?.playPerkBuy?.();
                    BO.Events.emit('hud:toast', { text: '🙏 PRAYER CARD — +15 MAX HP & +25 HP!', color: def.color });
                    break;
                }
            }
            return true;
        }

        /* ======================================================================
           Pocket Slot: Mystery Pills & Tarot Cards (BO.RPGItems.usePocket() -> KeyT)
        ====================================================================== */

        usePocket() {
            const M = this.M;
            const r = this.run;
            const P = this.P;
            if (!M?.active || !r || !P?.alive || M.state === 'transition' || M.state === 'ended') return false;
            this.ensureRunState(r);
            const pk = r.pocket;
            if (!pk) {
                BO.Events.emit('hud:toast', { text: 'POCKET SLOT EMPTY', color: '#94a3b8' });
                return false;
            }
            r.pocket = null;
            if (pk.kind === 'pill') return this._consumePill(pk);
            if (pk.kind === 'card') return this._consumeCard(pk);
            return false;
        }

        _consumePill(pk) {
            const r = this.run;
            const P = this.P;
            const M = this.M;
            const entry = r.pillMap[String(pk.appearanceIdx)];
            const pillId = entry ? entry.id : pk.id;
            if (entry) entry.identified = true;
            const def = this.ID.pillById(pillId);
            if (!def) return false;

            switch (pillId) {
                case 'health_up':
                    r.permPillBuffs.maxHpAdd += 20;
                    M.recomputeStats();
                    M.heal(20);
                    break;
                case 'health_down':
                    r.permPillBuffs.maxHpAdd = Math.max(-40, r.permPillBuffs.maxHpAdd - 12);
                    M.recomputeStats();
                    break;
                case 'tears_up':
                    r.permPillBuffs.fireRateMult *= 1.15;
                    break;
                case 'damage_up':
                    r.permPillBuffs.dmgMult *= 1.12;
                    break;
                case 'speed_up':
                    r.permPillBuffs.moveSpeedMult *= 1.12;
                    break;
                case 'full_health':
                    P.hp = P.maxHp;
                    break;
                case 'bad_trip':
                    if (P.hp <= 20) M.heal(25);
                    else P.hp = Math.max(1, P.hp - 15);
                    break;
                case 'balls_of_steel':
                    this.addSoulShield(35);
                    break;
                case 'bombs_are_key': {
                    const tmp = r.bombs;
                    r.bombs = r.keys;
                    r.keys = tmp;
                    break;
                }
                case 'telepills': {
                    const safe = this._findSafestSpot();
                    P.pos.set(safe.x, safe.y, safe.z);
                    P.vel.set(0, 0, 0);
                    r.permPillBuffs.reloadSpeedMult *= 1.1;
                    break;
                }
            }
            BO.Sound?.playPerkBuy?.();
            BO.Events.emit('hud:banner', { title: `PILL: ${def.name.toUpperCase()}`, sub: def.desc, color: def.positive ? '#4ade80' : '#f87171' });
            return true;
        }

        _consumeCard(pk) {
            const r = this.run;
            const P = this.P;
            const M = this.M;
            const def = this.ID.cardById(pk.id);
            if (!def) return false;
            const pos = P.pos.clone();
            const roomDmg = (240 + (r.floor || 1) * 28) * (M.stats?.abilityPower || 1);

            switch (def.id) {
                case 'the_fool': {
                    const sp = M.layout?.spawn || { x: 0, y: 0, z: 10 };
                    P.pos.set(sp.x, sp.y, sp.z);
                    P.vel.set(0, 0, 0);
                    P.invulnTimer = Math.max(P.invulnTimer, 2.5);
                    if (P.activeWeapon?.stats) P.activeWeapon.mag = P.activeWeapon.stats.magSize;
                    break;
                }
                case 'the_emperor':
                    r.tempFloorBuffs.emperorTimer = 20;
                    break;
                case 'the_sun':
                    P.hp = P.maxHp;
                    this._blastAt(pos, 30, roomDmg * 0.9, 0xfde047);
                    break;
                case 'the_devil':
                    r.tempFloorBuffs.devilCardTimer = 20;
                    break;
                case 'death':
                    this._blastAt(pos, 32, roomDmg * 1.25, 0x94a3b8);
                    break;
                case 'wheel_of_fortune':
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(-1, 0, -1.2)), 'heart_red');
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(1, 0, -1.2)), 'key');
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(0, 0, -1.8)), 'bomb_pickup');
                    M._dropGold(pos.clone().add(new THREE.Vector3(0, 0, -1)), 25);
                    break;
                case 'the_chariot':
                    r.tempFloorBuffs.chariotTimer = 8.0;
                    P.invulnTimer = Math.max(P.invulnTimer, 8.0);
                    break;
                case 'the_tower':
                    for (let i = 0; i < 4; i++) {
                        const a = (i / 4) * Math.PI * 2 + 0.4;
                        this._spawnLiveBomb(pos.clone().add(new THREE.Vector3(Math.cos(a) * 3.2, 0.3, Math.sin(a) * 3.2)), true);
                    }
                    break;
                case 'the_hermit':
                    r.gold += 45;
                    r.keys += 1;
                    r.bombs += 1;
                    break;
                case 'strength':
                    r.tempFloorBuffs.dmgMult *= 1.4;
                    r.tempFloorBuffs.maxHpAdd += 30;
                    M.recomputeStats();
                    M.heal(30);
                    break;
                case 'justice':
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(-1.2, 0, -1.4)), 'heart_red');
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(0, 0, -1.4)), 'key');
                    this.spawnPickup(pos.clone().add(new THREE.Vector3(1.2, 0, -1.4)), 'bomb_pickup');
                    M._dropGold(pos, 15);
                    break;
                case 'judgement': {
                    const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
                    const spot = pos.clone().addScaledVector(fwd, 2.5);
                    const roll = this.ID.rollArtifact({ pool: 'treasure', chaos: this.has('chaos_relic'), ownedPassives: new Set(r.artifacts), ownedActive: r.activeItem });
                    this.spawnPedestal(spot, roll.def.id, 'free');
                    break;
                }
            }
            BO.Sound?.playCardDraw?.();
            BO.Events.emit('hud:banner', { title: `${def.numeral} - ${def.name.toUpperCase()}`, sub: def.desc, color: def.color });
            return true;
        }

        /* ======================================================================
           Floor Bombs (BO.RPGItems.dropBomb() -> KeyB) & Destructibles
        ====================================================================== */

        dropBomb() {
            const M = this.M;
            const r = this.run;
            const P = this.P;
            if (!M?.active || !r || !P?.alive || M.state === 'transition' || M.state === 'ended') return false;
            this.ensureRunState(r);
            if (r.bombs <= 0) {
                BO.Sound?.playEmptyClick?.();
                BO.Events.emit('hud:toast', { text: 'NO BOMBS LEFT', color: '#94a3b8' });
                return false;
            }
            r.bombs--;
            const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
            const spawnPos = P.pos.clone().addScaledVector(fwd, 0.9);
            spawnPos.y = BO.World.getGroundHeight(spawnPos.x, spawnPos.z, P.pos.y + 0.5) + 0.28;
            this._spawnLiveBomb(spawnPos, false);
            BO.Sound?.playGrenadeBounce?.(1, 3);
            return true;
        }

        _spawnLiveBomb(pos, freeFromTower = false) {
            if (!BO.World?.scene) return;
            const g = new THREE.Group();
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.28, 12, 10),
                new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 })
            );
            const fuse = new THREE.Mesh(
                new THREE.SphereGeometry(0.11, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xef4444 })
            );
            fuse.position.y = 0.3;
            g.add(sphere, fuse);
            g.position.copy(pos);
            BO.World.scene.add(g);
            this.bombs.push({
                group: g,
                sphere,
                fuse,
                pos: pos.clone(),
                t: (this.D.ISAAC?.bombFuse || 1.55) * (freeFromTower ? 0.9 : 1),
                freeFromTower
            });
        }

        _detonateBomb(b) {
            const M = this.M;
            const I = this.D.ISAAC || {};
            const radius = I.bombRadius || 4.8;
            const dmg = (I.bombDamage || 185) * (1 + (this.run?.floor || 1) * 0.14);
            BO.FX?.spawnExplosion?.(b.pos.clone().add(new THREE.Vector3(0, 0.3, 0)), radius, 0xf97316);
            BO.Sound?.playExplosion?.(0.85);
            if (this.P) this.P.cameraShake = Math.max(this.P.cameraShake, 0.06);
            for (const z of M.enemiesInRadius(b.pos, radius)) {
                const d = BO.Math.dist2D(z.pos.x, z.pos.z, b.pos.x, b.pos.z);
                M.dealDamage(z, dmg * (1 - (d / radius) * 0.4), { source: 'ability', element: 'burn' });
            }
            this.onExplosionAt(b.pos, radius, dmg);
            disposeObject3D(b.group);
        }

        onExplosionAt(pos, radius, damage) {
            for (let i = this.rocks.length - 1; i >= 0; i--) {
                const rk = this.rocks[i];
                if (rk.dead) continue;
                if (BO.Math.dist2D(rk.pos.x, rk.pos.z, pos.x, pos.z) <= radius + 0.8) {
                    this._crackRock(rk);
                }
            }
        }

        damageProp(rk, dmg) {
            if (!rk || rk.dead) return;
            rk.hp -= dmg;
            if (rk.type === 'urn' && rk.hp <= 0) {
                this._crackRock(rk);
            } else if (rk.type === 'tinted' && (this.shotModifiers().explosive || rk.hp <= -999)) {
                this._crackRock(rk);
            }
        }

        _crackRock(rk) {
            if (!rk || rk.dead) return;
            rk.dead = true;
            if (rk.entity) rk.entity.alive = false;
            const pos = rk.pos.clone();
            if (rk.type === 'tinted') {
                BO.FX?.spawnParticles?.(pos.clone().add(UP), 24, 0x38bdf8, 5, 8, 0.7, 1.4);
                BO.Sound?.playWallBreak?.();
                BO.Events.emit('hud:toast', { text: '💎 TINTED ROCK CRACKED!', color: '#38bdf8' });
                this.spawnPickup(pos.clone().add(new THREE.Vector3(-0.6, 0, 0)), 'heart_soul');
                this.spawnPickup(pos.clone().add(new THREE.Vector3(0.6, 0, 0)), Math.random() < 0.5 ? 'key' : 'battery');
                if (Math.random() < 0.28) {
                    const roll = this.ID.rollArtifact({ pool: 'treasure', chaos: this.has('chaos_relic'), ownedPassives: new Set(this.run.artifacts), ownedActive: this.run.activeItem });
                    this.spawnPedestal(pos.clone().add(new THREE.Vector3(0, 0, 1.1)), roll.def.id, 'free');
                }
            } else {
                BO.FX?.spawnParticles?.(pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 14, 0xb45309, 4, 8, 0.5, 1.0);
                BO.Sound?.playWallHit?.();
                const roll = Math.random();
                if (roll < 0.35) this.M._dropGold(pos, 6 + (this.run?.floor || 1) * 2);
                else if (roll < 0.55) this.spawnPickup(pos, 'heart_red');
                else if (roll < 0.70) this.spawnPickup(pos, 'key');
                else if (roll < 0.85) this.spawnPickup(pos, 'bomb_pickup');
                else if (roll < 0.94) this.spawnPickup(pos, 'pill');
                else this.spawnPickup(pos, 'card');
            }
            disposeObject3D(rk.group);
            const idx = this.rocks.indexOf(rk);
            if (idx >= 0) this.rocks.splice(idx, 1);
        }

        getPropHitMeshes() {
            const out = [];
            for (const rk of this.rocks) {
                if (!rk.dead && rk.hitMesh) out.push(rk.hitMesh);
            }
            return out;
        }

        /* ======================================================================
           Combat & Floor Hooks (Killed, Hit, Damaged, Cleared, Reset)
        ====================================================================== */

        onPlayerDamaged(amt, attackerPos, attackerEntity) {
            const r = this.run;
            const P = this.P;
            if (!r || !P || amt <= 0) return amt;
            this.ensureRunState(r);
            if (P.invulnTimer > 0) return 0;

            // Holy Mantle negates 1st hit every floor
            if (r.holyMantleReady) {
                r.holyMantleReady = false;
                P.invulnTimer = Math.max(P.invulnTimer, 1.25);
                BO.FX?.spawnParticles?.(P.pos.clone().add(UP), 24, 0xbae6fd, 5, 0, 0.6, 1.3);
                BO.Sound?.playPowerUp?.();
                BO.Events.emit('hud:toast', { text: '🛡 HOLY MANTLE NEGATED THE HIT!', color: '#bae6fd' });
                return 0;
            }

            // The Wafer caps single hit to 25% of Max HP
            if (this.has('the_wafer')) {
                amt = Math.min(amt, P.maxHp * 0.25);
            }

            // Goliath Transformation DR
            if (this.hasTransformation('goliath')) {
                amt *= 0.85;
            }

            // Blue Soul Shield absorbs damage before Red HP
            if (r.soulShield > 0) {
                const absorbed = Math.min(r.soulShield, amt);
                r.soulShield -= absorbed;
                amt -= absorbed;
                if (absorbed >= 1 && BO.RPGUI) {
                    BO.RPGUI.floatText(P.pos, `-${Math.round(absorbed)} SHIELD`, '#60a5fa', 13, 1.0);
                }
            }

            if (amt > 0.5) {
                r.tookRedHpDamageOnFloor = true;
            }
            return amt;
        }

        onGunHit(z, dealt, hitbox, weapon, impactPos, dir, secondary = false) {
            const r = this.run;
            const M = this.M;
            if (!r || !M || secondary || !z || z.rpgProp) return;
            const mods = this.shotModifiers();

            // Dead Eye streak
            if (this.has('dead_eye')) {
                r.deadEyeStreak = Math.min(8, (r.deadEyeStreak || 0) + 1);
            }

            const hitPt = (impactPos ? impactPos.clone() : z.pos.clone().add(UP));

            // Pyromancer burn chance
            if (this.hasTransformation('pyro') && M.isAlive(z) && Math.random() < 0.25) {
                M.applyStatus(z, 'burn');
            }

            // Ipecac explosive acid round
            if (mods.explosive && dealt > 0) {
                const rad = mods.explosiveRadius || 3.4;
                const blastDmg = Math.max(20, dealt * 0.65) * (this.hasTransformation('pyro') ? 1.25 : 1);
                BO.FX?.spawnExplosion?.(hitPt, rad * 0.65, 0x84cc16);
                for (const o of M.enemiesInRadius(hitPt, rad)) {
                    if (o === z) continue;
                    M.dealDamage(o, blastDmg, { source: 'ability', element: 'burn' });
                    if (M.isAlive(o)) M.applyStatus(o, 'burn');
                }
                this.onExplosionAt(hitPt, rad, blastDmg);
            }

            // Jacob's Ladder chain lightning
            if (mods.chainLightning && dealt > 0) {
                const arcTargets = M.nearestEnemies(z.pos, 7.5, 2, new Set([z]));
                for (const t of arcTargets) {
                    BO.FX?.spawnTracer?.(hitPt, t.pos.clone().add(UP), 0x38bdf8, 0.032, 0.14);
                    M.dealDamage(t, Math.max(12, dealt * 0.45), { source: 'conduct', element: 'shock' });
                    if (M.isAlive(t)) M.applyStatus(t, 'shock');
                }
            }

            // Parasite / Cricket's Body split shrapnel
            if (mods.splitCount > 0 && dealt > 0) {
                const splitTargets = M.nearestEnemies(z.pos, 7.0, mods.splitCount, new Set([z]));
                for (const t of splitTargets) {
                    BO.FX?.spawnTracer?.(hitPt, t.pos.clone().add(UP), mods.tracerColor || 0xfb7185, 0.025, 0.12);
                    M.dealDamage(t, Math.max(10, dealt * 0.4), { source: 'conduct' });
                }
            }

            // Tech X plasma ring pulse
            if (mods.techRing && dealt > 0) {
                BO.FX?.spawnParticles?.(hitPt, 8, 0x22d3ee, 4.5, 0, 0.35, 1.1);
                for (const o of M.enemiesInRadius(hitPt, 2.8)) {
                    if (o !== z) M.dealDamage(o, Math.max(8, dealt * 0.3), { source: 'conduct', element: 'shock' });
                }
            }
        }

        onEnemyKilled(enemy, pos) {
            const r = this.run;
            const M = this.M;
            if (!r || !M || !pos) return;
            this.ensureRunState(r);

            // Vampiric Fang healing on kill + 5-kill streak
            if (this.has('vampiric_fang')) {
                r.vampiricKills = (r.vampiricKills || 0) + 1;
                let heal = 3;
                if (r.vampiricKills % 5 === 0) heal += 8;
                M.heal(heal);
            }

            // Midas Crown / Midas Touch bonus gold
            if (this.has('midas_crown') && Math.random() < 0.35) {
                M._dropGold(pos, 5 + Math.floor(r.floor * 0.8));
            }
            if (enemy?.rpg?.gilded) {
                M._dropGold(pos, (enemy.rpg.arch?.gold || 5) * 2);
            }

            // Dynamic 3D room pickup drops (Isaac room economy)
            const dropRoll = Math.random();
            if (dropRoll < 0.24) {
                const w = Math.random();
                if (w < 0.30) this.spawnPickup(pos, 'heart_red');
                else if (w < 0.46) this.spawnPickup(pos, 'key');
                else if (w < 0.62) this.spawnPickup(pos, 'bomb_pickup');
                else if (w < 0.74) this.spawnPickup(pos, 'heart_soul');
                else if (w < 0.84) this.spawnPickup(pos, 'battery');
                else if (w < 0.93) this.spawnPickup(pos, 'pill');
                else this.spawnPickup(pos, 'card');
            }
        }

        onFloorCleared() {
            const r = this.run;
            const M = this.M;
            if (!r || !M) return;
            this.ensureRunState(r);

            // Recharge active item by +1 pip
            if (r.activeItem) {
                const def = this.ID.activeById(r.activeItem);
                if (def && r.activeCharges < def.charges) {
                    r.activeCharges = Math.min(def.charges, r.activeCharges + 1);
                }
            }

            // Seraphim floor-clear Soul Shield
            if (this.hasTransformation('seraph')) {
                this.addSoulShield(15);
            }

            // Room clear pickup drop
            const center = M.layout?.center || { x: 0, z: 0 };
            const clearPos = new THREE.Vector3(center.x + (Math.random() - 0.5) * 3, 0, center.z + (Math.random() - 0.5) * 3);
            const dropTypes = ['heart_red', 'key', 'bomb_pickup', 'battery', 'pill', 'card', 'heart_soul'];
            if (Math.random() < 0.72) {
                this.spawnPickup(clearPos, dropTypes[Math.floor(Math.random() * dropTypes.length)]);
            }

            // Devil Deal vs Angel Sanctum Pedestal spawn!
            const isBoss = r.roomType === 'boss';
            const goatHead = this.has('goat_head');
            const dealRoll = isBoss || goatHead || (r.floor >= 2 && Math.random() < (0.28 + (this.has('pentagram') ? 0.25 : 0) + (!r.tookRedHpDamageOnFloor ? 0.25 : 0)));
            if (dealRoll) {
                const preferAngel = !r.tookRedHpDamageOnFloor && (r.devilDeals === 0 || Math.random() < r.angelChance);
                const spot = new THREE.Vector3(center.x - 3.6, 0, center.z - 1.5);
                const chaos = this.has('chaos_relic');
                if (preferAngel) {
                    const roll = this.ID.rollArtifact({ pool: 'angel', chaos, ownedPassives: new Set(r.artifacts), ownedActive: r.activeItem });
                    this.spawnPedestal(spot, roll.def.id, 'angel');
                    BO.Events.emit('hud:toast', { text: '👼 AN ANGEL SANCTUM PEDESTAL HAS APPEARED!', color: '#bae6fd' });
                } else {
                    const roll = this.ID.rollArtifact({ pool: 'devil', chaos, ownedPassives: new Set(r.artifacts), ownedActive: r.activeItem });
                    this.spawnPedestal(spot, roll.def.id, 'devil');
                    BO.Events.emit('hud:toast', { text: '😈 A DEVIL DEAL PEDESTAL HAS APPEARED!', color: '#ef4444' });
                }
            }
        }

        resetFloor() {
            this.clearVisuals();
            const r = this.run;
            if (!r) return;
            this.ensureRunState(r);
            r.tookRedHpDamageOnFloor = false;
            r.holyMantleReady = this.has('holy_mantle');
            r.tempFloorBuffs = { dmgMult: 1, maxHpAdd: 0, emperorTimer: 0, devilCardTimer: 0, chariotTimer: 0, familiarMult: 1 };
            r.deadEyeStreak = 0;
            this._rebuildOrbitalsAndFamiliars();
        }

        clearVisuals() {
            for (const p of this.pedestals) disposeObject3D(p.group);
            for (const pk of this.pickups) disposeObject3D(pk.group);
            for (const b of this.bombs) disposeObject3D(b.group);
            for (const rk of this.rocks) disposeObject3D(rk.group);
            for (const ch of this.lockedChests) disposeObject3D(ch.group);
            for (const orb of this.orbitals) disposeObject3D(orb.group);
            for (const fam of this.familiars) disposeObject3D(fam.group);
            for (const tur of this.turrets) disposeObject3D(tur.group);
            this.pedestals = [];
            this.pickups = [];
            this.bombs = [];
            this.rocks = [];
            this.lockedChests = [];
            this.orbitals = [];
            this.familiars = [];
            this.turrets = [];
            this._familiarSignature = '';
        }

        /* ======================================================================
           Room Population: Pedestals, Shop Items, Tinted Rocks, Urns, Chests
        ====================================================================== */

        populateFloor(mode) {
            const r = mode.run;
            const L = mode.layout;
            if (!r || !L) return;
            this.ensureRunState(r);
            const chaos = this.has('chaos_relic');
            const ownedPassives = new Set(r.artifacts);

            // Treasure room -> Artifact Pedestal + optional Locked Reliquary
            if (r.roomType === 'treasure') {
                const roll = this.ID.rollArtifact({ pool: 'treasure', chaos, ownedPassives, ownedActive: r.activeItem });
                this.spawnPedestal(new THREE.Vector3(L.center.x + 2.6, 0, L.center.z - 2.0), roll.def.id, 'treasure');
                this.spawnLockedChest(new THREE.Vector3(L.center.x - 2.6, 0, L.center.z - 2.0));
            }

            // Shop room -> 4 physical 3D Shop Pedestals in front of counter
            if (r.roomType === 'shop') {
                const prices = this.D.ISAAC?.shopPrices || {};
                const artRoll = this.ID.rollArtifact({ pool: 'shop', chaos, ownedPassives, ownedActive: r.activeItem });
                const shopOffers = [
                    { kind: 'pickup', pickupType: 'heart_soul', name: 'Soul Shield Heart', price: prices.heart_soul || 26, color: 0x60a5fa },
                    { kind: 'pickup', pickupType: 'key', name: 'Brass Key', price: prices.key || 16, color: 0xfde047 },
                    { kind: 'pickup', pickupType: 'battery', name: 'Energy Battery', price: prices.battery || 28, color: 0x4ade80 },
                    { kind: 'artifact', itemId: artRoll.def.id, price: prices.artifact || 65, color: artRoll.def.hex }
                ];
                shopOffers.forEach((offer, i) => {
                    const x = L.center.x + (i - 1.5) * 2.4;
                    const z = L.center.z + 2.5;
                    if (offer.kind === 'artifact') {
                        this.spawnPedestal(new THREE.Vector3(x, 0, z), offer.itemId, 'shop', offer.price);
                    } else {
                        this.spawnPedestal(new THREE.Vector3(x, 0, z), null, 'shop_pickup', offer.price, offer);
                    }
                });
            }

            // Combat / Elite / Hazard / Treasure / Ambush -> Breakable Urns, Tinted Rocks, Locked Chest
            const roomDef = this.D.ROOMS[r.roomType];
            if (!roomDef?.quiet) {
                const urnCount = 2 + Math.floor(Math.random() * 3);
                for (let i = 0; i < urnCount; i++) {
                    const p = this._pickRoomSpot(L, 3.2);
                    if (p) this._spawnUrn(p);
                }
                const tintedCount = Math.random() < 0.65 ? 1 : 0;
                for (let i = 0; i < tintedCount; i++) {
                    const p = this._pickRoomSpot(L, 3.8);
                    if (p) this._spawnTintedRock(p);
                }
                if (r.roomType !== 'treasure' && Math.random() < 0.35) {
                    const p = this._pickRoomSpot(L, 4.0);
                    if (p) this.spawnLockedChest(p);
                }
            }
            this._rebuildOrbitalsAndFamiliars();
        }

        _pickRoomSpot(L, minEdgePad = 3.2) {
            for (let t = 0; t < 20; t++) {
                const x = (Math.random() * 2 - 1) * (L.hw - minEdgePad);
                const z = (Math.random() * 2 - 1) * (L.hl - minEdgePad - 2);
                if (Math.hypot(x - L.spawn.x, z - L.spawn.z) < 5.0) continue;
                if (Math.hypot(x - L.center.x, z - L.center.z) < 3.5) continue;
                return new THREE.Vector3(x, 0, z);
            }
            return null;
        }

        _spawnUrn(pos) {
            if (!BO.World?.scene) return;
            const g = new THREE.Group();
            const mat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85, metalness: 0.1 });
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.8, 10), mat);
            body.position.y = 0.4;
            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 6, 12), mat);
            rim.rotation.x = Math.PI / 2;
            rim.position.y = 0.8;
            g.add(body, rim);
            pos.y = BO.World.getGroundHeight(pos.x, pos.z, 1);
            g.position.copy(pos);
            BO.World.scene.add(g);
            const rk = { type: 'urn', group: g, hitMesh: body, pos: pos.clone(), hp: 25, dead: false };
            const ent = { alive: true, hp: 25, maxHp: 25, pos: pos.clone(), noBlood: true, spec: {}, rpgProp: rk };
            rk.entity = ent;
            body.userData = { entity: ent, hitbox: 'torso' };
            this.rocks.push(rk);
        }

        _spawnTintedRock(pos) {
            if (!BO.World?.scene) return;
            const g = new THREE.Group();
            const stone = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.62, 0),
                new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, metalness: 0.15, emissive: 0x0ea5e9, emissiveIntensity: 0.18 })
            );
            stone.position.y = 0.42;
            const crack1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.06), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
            crack1.position.set(0, 0.78, 0.22);
            crack1.rotation.z = 0.55;
            const crack2 = crack1.clone();
            crack2.rotation.z = -0.55;
            g.add(stone, crack1, crack2);
            pos.y = BO.World.getGroundHeight(pos.x, pos.z, 1);
            g.position.copy(pos);
            BO.World.scene.add(g);
            const rk = { type: 'tinted', group: g, hitMesh: stone, pos: pos.clone(), hp: 9999, dead: false };
            const ent = { alive: true, hp: 9999, maxHp: 9999, pos: pos.clone(), noBlood: true, spec: {}, rpgProp: rk };
            rk.entity = ent;
            stone.userData = { entity: ent, hitbox: 'torso' };
            this.rocks.push(rk);
        }

        spawnLockedChest(pos) {
            if (!BO.World?.scene) return;
            const g = new THREE.Group();
            const base = new THREE.Mesh(
                new THREE.BoxGeometry(1.15, 0.65, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x854d0e, metalness: 0.7, roughness: 0.35 })
            );
            base.position.y = 0.33;
            const lock = new THREE.Mesh(
                new THREE.BoxGeometry(0.24, 0.26, 0.12),
                new THREE.MeshBasicMaterial({ color: 0xfde047 })
            );
            lock.position.set(0, 0.44, 0.43);
            g.add(base, lock);
            pos.y = BO.World.getGroundHeight(pos.x, pos.z, 1);
            g.position.copy(pos);
            BO.World.scene.add(g);
            this.lockedChests.push({ group: g, base, lock, pos: pos.clone(), opened: false });
        }

        /* ======================================================================
           3D Item Pedestals (Treasure, Shop, Devil, Angel)
        ====================================================================== */

        spawnPedestal(pos, itemId, kind = 'treasure', price = 0, shopOffer = null) {
            if (!BO.World?.scene) return null;
            const def = itemId ? this.ID.itemById(itemId) : null;
            const colorHex = shopOffer ? shopOffer.color : (kind === 'devil' ? 0xef4444 : kind === 'angel' ? 0xbae6fd : (def?.hex || 0xfde047));
            const g = new THREE.Group();

            const plinthColor = kind === 'devil' ? 0x1c0d11 : kind === 'angel' ? 0xe2e8f0 : 0x263142;
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.52, 0.68, 0.92, 10),
                new THREE.MeshStandardMaterial({ color: plinthColor, roughness: 0.45, metalness: 0.5 })
            );
            base.position.y = 0.46;

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.58, 0.045, 8, 24),
                new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.94;

            const orbGeo = def && this.ID.activeById(def.id)
                ? new THREE.BoxGeometry(0.42, 0.42, 0.42)
                : new THREE.OctahedronGeometry(0.36, 0);
            const orb = new THREE.Mesh(
                orbGeo,
                new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.85, roughness: 0.2, metalness: 0.3 })
            );
            orb.position.y = 1.48;

            const light = new THREE.PointLight(colorHex, 1.3, 8);
            light.position.y = 1.6;
            g.add(base, ring, orb, light);

            const p = pos.clone();
            p.y = BO.World.getGroundHeight(p.x, p.z, 1);
            g.position.copy(p);
            BO.World.scene.add(g);

            const ped = {
                group: g,
                orb,
                ring,
                pos: p,
                itemId,
                kind, // 'treasure' | 'free' | 'devil' | 'angel' | 'shop' | 'shop_pickup'
                price,
                shopOffer,
                claimed: false
            };
            this.pedestals.push(ped);
            return ped;
        }

        rerollPedestals() {
            const r = this.run;
            if (!r) return;
            const chaos = this.has('chaos_relic');
            const ownedPassives = new Set(r.artifacts);
            for (const ped of this.pedestals) {
                if (ped.claimed || ped.kind === 'shop_pickup') continue;
                const pool = ped.kind === 'devil' ? 'devil' : ped.kind === 'angel' ? 'angel' : ped.kind === 'shop' ? 'shop' : 'treasure';
                const roll = this.ID.rollArtifact({ pool, chaos, ownedPassives, ownedActive: r.activeItem });
                ped.itemId = roll.def.id;
                ped.orb.material.color.setHex(roll.def.hex);
                ped.orb.material.emissive.setHex(roll.def.hex);
                ped.ring.material.color.setHex(roll.def.hex);
                BO.FX?.spawnParticles?.(ped.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 14, roll.def.hex, 3, 2, 0.5, 1.0);
            }
        }

        /* ======================================================================
           3D Room Pickups (Hearts, Soul Hearts, Keys, Bombs, Batteries, Pills, Cards)
        ====================================================================== */

        spawnPickup(pos, type, extra = {}) {
            if (!BO.World?.scene || !pos) return null;
            const g = new THREE.Group();
            let color = 0xfde047;
            let mesh;

            if (type === 'heart_red') {
                color = 0xef4444;
                mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.25 }));
                mesh.scale.set(1.15, 0.9, 0.7);
            } else if (type === 'heart_soul') {
                color = 0x60a5fa;
                mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), new THREE.MeshStandardMaterial({ color, emissive: 0x38bdf8, emissiveIntensity: 0.75, roughness: 0.2 }));
                mesh.scale.set(1.15, 0.9, 0.7);
            } else if (type === 'key') {
                color = 0xfacc15;
                mesh = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.055, 8, 16), new THREE.MeshStandardMaterial({ color, emissive: 0xca8a04, emissiveIntensity: 0.4, metalness: 0.85, roughness: 0.25 }));
            } else if (type === 'bomb_pickup') {
                color = 0xf97316;
                mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0x7c2d12, emissiveIntensity: 0.35, metalness: 0.7, roughness: 0.3 }));
            } else if (type === 'battery') {
                color = 0x4ade80;
                mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.36, 10), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, metalness: 0.4, roughness: 0.3 }));
            } else if (type === 'pill') {
                const appIdx = extra.appearanceIdx ?? Math.floor(Math.random() * this.ID.PILL_APPEARANCES.length);
                const app = this.ID.PILL_APPEARANCES[appIdx];
                color = app.hex;
                extra.appearanceIdx = appIdx;
                mesh = new THREE.Group();
                const halfA = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 10), new THREE.MeshStandardMaterial({ color: app.hex, emissive: app.hex, emissiveIntensity: 0.35 }));
                halfA.position.y = 0.1;
                const halfB = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 10), new THREE.MeshStandardMaterial({ color: app.capHex }));
                halfB.position.y = -0.1;
                mesh.add(halfA, halfB);
                mesh.rotation.z = 0.5;
            } else if (type === 'card') {
                const cardDef = extra.cardId ? this.ID.cardById(extra.cardId) : this.ID.CARDS[Math.floor(Math.random() * this.ID.CARDS.length)];
                extra.cardId = cardDef.id;
                color = new THREE.Color(cardDef.color).getHex();
                mesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.04), new THREE.MeshStandardMaterial({ color: 0x1e1b4b, emissive: color, emissiveIntensity: 0.65, metalness: 0.3 }));
            }

            if (!mesh) return null;
            const halo = new THREE.Mesh(
                new THREE.RingGeometry(0.22, 0.3, 18),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
            );
            halo.rotation.x = -Math.PI / 2;
            halo.position.y = -0.35;
            g.add(mesh, halo);

            const p = pos.clone();
            p.x += (Math.random() - 0.5) * 0.9;
            p.z += (Math.random() - 0.5) * 0.9;
            p.y = BO.World.getGroundHeight(p.x, p.z, p.y + 0.8) + 0.42;
            g.position.copy(p);
            BO.World.scene.add(g);

            const pk = {
                type,
                group: g,
                mesh,
                pos: p,
                baseY: p.y,
                vel: new THREE.Vector3((Math.random() - 0.5) * 2.5, 2.2, (Math.random() - 0.5) * 2.5),
                extra,
                phase: Math.random() * 6.28
            };
            this.pickups.push(pk);
            return pk;
        }

        _collectPickup(pk) {
            const r = this.run;
            const P = this.P;
            const M = this.M;
            if (!r || !P || !M) return false;
            const I = this.D.ISAAC || {};

            if (pk.type === 'heart_red') {
                if (P.hp >= P.maxHp - 0.5) return false;
                M.heal(I.heartHeal || 25);
                BO.RPGUI?.floatText(pk.pos, `+${I.heartHeal || 25} HP`, '#ef4444', 13, 1.1);
                BO.Sound?.playPerkBuy?.();
            } else if (pk.type === 'heart_soul') {
                const cap = I.soulShieldCap || 150;
                if (r.soulShield >= cap) return false;
                const g = this.addSoulShield(I.soulHeartAmount || 25);
                BO.RPGUI?.floatText(pk.pos, `+${g} SOUL SHIELD`, '#60a5fa', 13, 1.2);
                BO.Sound?.playPowerUp?.();
            } else if (pk.type === 'key') {
                r.keys++;
                BO.RPGUI?.floatText(pk.pos, '+1 KEY', '#fde047', 13, 1.1);
                BO.Sound?.playLootChime?.();
            } else if (pk.type === 'bomb_pickup') {
                r.bombs++;
                BO.RPGUI?.floatText(pk.pos, '+1 BOMB', '#f97316', 13, 1.1);
                BO.Sound?.playPoints?.();
            } else if (pk.type === 'battery') {
                const def = r.activeItem ? this.ID.activeById(r.activeItem) : null;
                if (!def || r.activeCharges >= def.charges) return false;
                r.activeCharges = Math.min(def.charges, r.activeCharges + 2);
                BO.RPGUI?.floatText(pk.pos, '+2 CHARGE', '#4ade80', 13, 1.1);
                BO.Sound?.playPowerUp?.();
            } else if (pk.type === 'pill' || pk.type === 'card') {
                const prev = r.pocket;
                if (pk.type === 'pill') {
                    const entry = r.pillMap[String(pk.extra.appearanceIdx)];
                    r.pocket = { kind: 'pill', id: entry?.id || 'health_up', appearanceIdx: pk.extra.appearanceIdx };
                    const label = entry?.identified ? this.ID.pillById(entry.id)?.name : 'Mystery Pill ???';
                    BO.RPGUI?.floatText(pk.pos, label, '#a855f7', 13, 1.4);
                } else {
                    const card = this.ID.cardById(pk.extra.cardId);
                    r.pocket = { kind: 'card', id: pk.extra.cardId };
                    BO.RPGUI?.floatText(pk.pos, `${card?.numeral || ''} ${card?.name || 'Card'}`, card?.color || '#fde047', 13, 1.4);
                }
                if (prev) {
                    const dropPos = pk.pos.clone().add(new THREE.Vector3(1.1, 0, 0.8));
                    this.spawnPickup(dropPos, prev.kind, prev.kind === 'pill' ? { appearanceIdx: prev.appearanceIdx } : { cardId: prev.id });
                }
                BO.Sound?.playCardDraw?.();
            }

            disposeObject3D(pk.group);
            const idx = this.pickups.indexOf(pk);
            if (idx >= 0) this.pickups.splice(idx, 1);
            return true;
        }

        /* ======================================================================
           3D Orbitals, Buddy Familiars, Deployed Turrets
        ====================================================================== */

        _rebuildOrbitalsAndFamiliars() {
            for (const o of this.orbitals) disposeObject3D(o.group);
            for (const f of this.familiars) disposeObject3D(f.group);
            this.orbitals = [];
            this.familiars = [];
            const r = this.run;
            if (!r || !BO.World?.scene) return;
            const mult = r.tempFloorBuffs?.familiarMult || 1;

            const spawnOrbital = (type) => {
                const g = new THREE.Group();
                if (type === 'cube_of_steel') {
                    const box = new THREE.Mesh(
                        new THREE.BoxGeometry(0.55, 0.55, 0.55),
                        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25, emissive: 0x334155, emissiveIntensity: 0.4 })
                    );
                    g.add(box);
                    BO.World.scene.add(g);
                    this.orbitals.push({ type, group: g, radius: 1.85, speed: 2.6, dmg: 22, blocksProj: true, cd: new WeakMap() });
                } else if (type === 'sawblade_halo') {
                    const disc = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.48, 0.48, 0.07, 12),
                        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2, emissive: 0x64748b, emissiveIntensity: 0.3 })
                    );
                    g.add(disc);
                    BO.World.scene.add(g);
                    this.orbitals.push({ type, group: g, radius: 2.25, speed: 4.5, dmg: 28, blocksProj: false, cd: new WeakMap() });
                }
            };

            const spawnFamiliar = (type) => {
                const g = new THREE.Group();
                const col = type === 'seraph_wisp' ? 0xfef08a : type === 'demon_imp' ? 0xf97316 : 0x22d3ee;
                const core = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.24, 0),
                    new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9 })
                );
                const halo = new THREE.Mesh(
                    new THREE.TorusGeometry(0.32, 0.03, 6, 16),
                    new THREE.MeshBasicMaterial({ color: col })
                );
                halo.rotation.x = Math.PI / 2;
                g.add(core, halo);
                BO.World.scene.add(g);
                this.familiars.push({ type, group: g, core, color: col, cd: Math.random() * 0.4, offsetAngle: this.familiars.length * 1.9 });
            };

            for (const id of r.artifacts) {
                if (id === 'cube_of_steel') for (let i = 0; i < mult; i++) spawnOrbital('cube_of_steel');
                else if (id === 'sawblade_halo') for (let i = 0; i < 2 * mult; i++) spawnOrbital('sawblade_halo');
                else if (id === 'seraph_wisp' || id === 'demon_imp' || id === 'plasma_sentinel') {
                    for (let i = 0; i < mult; i++) spawnFamiliar(id);
                }
            }
        }

        _spawnTurret(pos) {
            if (!BO.World?.scene) return;
            const g = new THREE.Group();
            const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 0.75, 8), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 }));
            stand.position.y = 0.375;
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.6), new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x16a34a, emissiveIntensity: 0.6 }));
            head.position.y = 0.9;
            g.add(stand, head);
            pos.y = BO.World.getGroundHeight(pos.x, pos.z, pos.y + 0.8);
            g.position.copy(pos);
            BO.World.scene.add(g);
            this.turrets.push({ group: g, head, pos: pos.clone(), cd: 0.2 });
        }

        checkProjectileBlock(proj) {
            if (!proj || !this.orbitals.length) return false;
            for (const orb of this.orbitals) {
                if (!orb.blocksProj) continue;
                if (orb.group.position.distanceTo(proj.pos) <= 0.85) {
                    BO.FX?.spawnParticles?.(proj.pos, 6, 0x94a3b8, 3, 4, 0.35, 0.8);
                    return true;
                }
            }
            return false;
        }

        /* ======================================================================
           Interactions (Pedestals & Locked Golden Reliquary Chests)
        ====================================================================== */

        getInteractTarget(playerPos) {
            const r = this.run;
            if (!r) return null;
            for (const ped of this.pedestals) {
                if (ped.claimed) continue;
                if (BO.Math.dist2D(playerPos.x, playerPos.z, ped.pos.x, ped.pos.z) <= 2.3) {
                    if (ped.kind === 'shop_pickup') {
                        const ok = r.gold >= ped.price;
                        return {
                            kind: 'rpg_pedestal',
                            ref: ped,
                            prompt: {
                                text: ok ? `[E] BUY ${ped.shopOffer.name.toUpperCase()} — ${ped.price} GOLD` : `${ped.shopOffer.name.toUpperCase()} — NEEDS ${ped.price} GOLD`,
                                affordable: ok,
                                color: '#fde047'
                            }
                        };
                    }
                    const def = this.ID.itemById(ped.itemId);
                    if (!def) continue;
                    if (ped.kind === 'devil') {
                        const hpCost = Math.round(this.P.maxHp * (this.D.ISAAC?.devilHpCostPct || 0.15));
                        const ok = this.P.hp > hpCost + 2 && r.devilHpPenalty < 0.65;
                        return {
                            kind: 'rpg_pedestal',
                            ref: ped,
                            prompt: {
                                text: ok ? `[E] DEVIL DEAL: ${def.name.toUpperCase()} (PAY -15% MAX HP) — ${def.desc}` : `DEVIL DEAL: ${def.name.toUpperCase()} — NOT ENOUGH HP`,
                                affordable: ok,
                                color: '#ef4444'
                            }
                        };
                    }
                    if (ped.kind === 'shop') {
                        const ok = r.gold >= ped.price;
                        return {
                            kind: 'rpg_pedestal',
                            ref: ped,
                            prompt: {
                                text: ok ? `[E] BUY ${def.name.toUpperCase()} (${ped.price}g) — ${def.desc}` : `${def.name.toUpperCase()} — NEEDS ${ped.price} GOLD`,
                                affordable: ok,
                                color: def.color
                            }
                        };
                    }
                    return {
                        kind: 'rpg_pedestal',
                        ref: ped,
                        prompt: {
                            text: `[E] TAKE ${def.name.toUpperCase()} — ${def.desc}`,
                            affordable: true,
                            color: def.color
                        }
                    };
                }
            }

            for (const ch of this.lockedChests) {
                if (ch.opened) continue;
                if (BO.Math.dist2D(playerPos.x, playerPos.z, ch.pos.x, ch.pos.z) <= 2.3) {
                    const ok = r.keys > 0;
                    return {
                        kind: 'rpg_locked_chest',
                        ref: ch,
                        prompt: {
                            text: ok ? '[E] UNLOCK GOLDEN RELIQUARY (1 KEY)' : 'LOCKED GOLDEN RELIQUARY — NEEDS 1 BRASS KEY',
                            affordable: ok,
                            color: '#fde047'
                        }
                    };
                }
            }
            return null;
        }

        interactWith(target) {
            if (!target) return false;
            const r = this.run;
            if (!r) return false;
            if (target.kind === 'rpg_pedestal') {
                const ped = target.ref;
                if (ped.claimed) return false;
                if (ped.kind === 'shop' || ped.kind === 'shop_pickup') {
                    if (r.gold < ped.price) return false;
                    r.gold -= ped.price;
                    BO.Sound?.playShopBuy?.();
                } else if (ped.kind === 'devil') {
                    const pct = this.D.ISAAC?.devilHpCostPct || 0.15;
                    const hpCost = Math.round(this.P.maxHp * pct);
                    if (this.P.hp <= hpCost + 2 || r.devilHpPenalty >= 0.65) return false;
                    r.devilHpPenalty = Math.min(0.65, (r.devilHpPenalty || 0) + pct);
                    r.devilDeals++;
                    r.angelChance = Math.max(0.1, r.angelChance - 0.2);
                    BO.RPGUnlocks?.record?.(BO.RPGProfile.data, 'devilDeals', 1);
                    this.M?.recomputeStats?.();
                }

                ped.claimed = true;
                if (ped.kind === 'shop_pickup') {
                    this.spawnPickup(ped.pos.clone().add(new THREE.Vector3(0, 0.2, 0.6)), ped.shopOffer.pickupType);
                } else {
                    this.grantArtifact(ped.itemId, { dropOldAt: ped.pos });
                }
                ped.orb.visible = false;
                ped.ring.material.opacity = 0.15;
                return true;
            }

            if (target.kind === 'rpg_locked_chest') {
                const ch = target.ref;
                if (ch.opened || r.keys <= 0) return false;
                r.keys--;
                ch.opened = true;
                ch.lock.visible = false;
                BO.Sound?.playMysteryBoxJingle?.();
                BO.FX?.spawnParticles?.(ch.pos.clone().add(UP), 20, 0xfde047, 4, 4, 0.7, 1.3);
                const roll = this.ID.rollArtifact({ pool: 'treasure', chaos: this.has('chaos_relic'), ownedPassives: new Set(r.artifacts), ownedActive: r.activeItem });
                this.spawnPedestal(ch.pos.clone().add(new THREE.Vector3(0, 0, 1.4)), roll.def.id, 'free');
                this.M?._dropGold?.(ch.pos, 18 + r.floor * 3);
                BO.Events.emit('hud:toast', { text: '🔑 RELIQUARY UNLOCKED!', color: '#fde047' });
                return true;
            }
            return false;
        }

        /* ======================================================================
           Frame Update (Orbitals, Familiars, Turrets, Bombs, Pickups, Cards)
        ====================================================================== */

        update(dt) {
            const M = this.M;
            const r = this.run;
            const P = this.P;
            if (!M?.active || !r || !P) return;
            const t = M.elapsed;

            // Card timers
            if (r.tempFloorBuffs) {
                if (r.tempFloorBuffs.emperorTimer > 0) r.tempFloorBuffs.emperorTimer = Math.max(0, r.tempFloorBuffs.emperorTimer - dt);
                if (r.tempFloorBuffs.devilCardTimer > 0) r.tempFloorBuffs.devilCardTimer = Math.max(0, r.tempFloorBuffs.devilCardTimer - dt);
                if (r.tempFloorBuffs.chariotTimer > 0) {
                    r.tempFloorBuffs.chariotTimer = Math.max(0, r.tempFloorBuffs.chariotTimer - dt);
                    for (const z of M.enemiesInRadius(P.pos, 1.8)) {
                        const last = this._chariotHitCd.get(z) || -99;
                        if (t - last >= 0.4) {
                            this._chariotHitCd.set(z, t);
                            M.dealDamage(z, 65 + r.floor * 8, { source: 'ability' });
                        }
                    }
                }
            }

            // Stormlord periodic lightning
            if (this.hasTransformation('storm') && M.state === 'fighting') {
                this._stormTimer -= dt;
                if (this._stormTimer <= 0) {
                    this._stormTimer = 3.5;
                    const target = M.nearestEnemies(P.pos, 18, 1)[0];
                    if (target) {
                        BO.FX?.spawnTracer?.(target.pos.clone().add(new THREE.Vector3(0, 11, 0)), target.pos.clone().add(UP), 0x38bdf8, 0.06, 0.16);
                        M.dealDamage(target, 55 + r.floor * 8, { source: 'ability', element: 'shock' });
                        if (M.isAlive(target)) M.applyStatus(target, 'shock');
                        BO.Sound?.playTrapZap?.();
                    }
                }
            }

            // Orbitals
            if (this.orbitals.length) {
                this._orbitalAngle += dt;
                const count = this.orbitals.length;
                for (let i = 0; i < count; i++) {
                    const orb = this.orbitals[i];
                    const ang = this._orbitalAngle * orb.speed + (i / count) * Math.PI * 2;
                    const ox = P.pos.x + Math.cos(ang) * orb.radius;
                    const oz = P.pos.z + Math.sin(ang) * orb.radius;
                    orb.group.position.set(ox, P.pos.y + 1.05, oz);
                    orb.group.rotation.y += dt * 5;
                    for (const z of M.enemiesInRadius(orb.group.position, 1.05)) {
                        const last = orb.cd.get(z) || -99;
                        if (t - last >= 0.45) {
                            orb.cd.set(z, t);
                            M.dealDamage(z, orb.dmg + r.floor * 4, { source: 'ability' });
                            BO.FX?.spawnParticles?.(orb.group.position, 4, 0xe2e8f0, 2.5, 4, 0.3, 0.8);
                        }
                    }
                }
            }

            // Buddy Familiars
            for (const fam of this.familiars) {
                const targetAng = P.yaw + fam.offsetAngle + 0.9;
                const tx = P.pos.x + Math.cos(targetAng) * 1.35;
                const tz = P.pos.z + Math.sin(targetAng) * 1.35;
                const ty = P.pos.y + 1.55 + Math.sin(t * 3 + fam.offsetAngle) * 0.14;
                fam.group.position.lerp(new THREE.Vector3(tx, ty, tz), Math.min(1, dt * 6));
                fam.core.rotation.y += dt * 3;
                fam.cd -= dt;
                if (fam.cd <= 0 && M.state === 'fighting') {
                    const range = fam.type === 'demon_imp' ? 9 : 18;
                    const target = M.nearestEnemies(fam.group.position, range, 1)[0];
                    if (target) {
                        fam.cd = fam.type === 'plasma_sentinel' ? 0.8 : 0.95;
                        const aimPt = target.pos.clone().add(UP);
                        BO.FX?.spawnTracer?.(fam.group.position, aimPt, fam.color, 0.032, 0.14);
                        const dmg = (fam.type === 'seraph_wisp' ? 32 : fam.type === 'demon_imp' ? 28 : 26) + r.floor * 4;
                        M.dealDamage(target, dmg, { source: 'ability', element: fam.type === 'demon_imp' ? 'burn' : fam.type === 'plasma_sentinel' ? 'shock' : undefined });
                        if (M.isAlive(target)) {
                            if (fam.type === 'demon_imp') M.applyStatus(target, 'burn');
                            else if (fam.type === 'plasma_sentinel') M.applyStatus(target, 'shock');
                        }
                    }
                }
            }

            // Deployed Turrets
            for (const tur of this.turrets) {
                tur.cd -= dt;
                if (tur.cd <= 0 && M.state === 'fighting') {
                    const target = M.nearestEnemies(tur.pos, 22, 1)[0];
                    if (target) {
                        tur.cd = 0.42;
                        const from = tur.pos.clone().add(new THREE.Vector3(0, 0.95, 0));
                        const to = target.pos.clone().add(UP);
                        tur.head.lookAt(to);
                        BO.FX?.spawnTracer?.(from, to, 0x4ade80, 0.028, 0.1);
                        M.dealDamage(target, 24 + r.floor * 3.5, { source: 'ability' });
                        BO.Sound?.playTurretFire?.();
                    }
                }
            }

            // Live Bombs
            for (let i = this.bombs.length - 1; i >= 0; i--) {
                const b = this.bombs[i];
                b.t -= dt;
                const pulse = 1 + Math.sin(t * 24) * 0.2;
                b.fuse.scale.setScalar(pulse);
                if (b.t <= 0) {
                    this.bombs.splice(i, 1);
                    this._detonateBomb(b);
                }
            }

            // Pedestals animation
            for (const ped of this.pedestals) {
                if (ped.claimed) continue;
                ped.orb.rotation.y += dt * 1.9;
                ped.orb.position.y = 1.48 + Math.sin(t * 2.8 + ped.pos.x) * 0.1;
            }

            // Pickups bob, magnet, collect
            const magnet = M.state === 'cleared' || this.has('magneto') ? 999 : 4.5;
            const playerTarget = P.pos.clone().add(UP);
            for (let i = this.pickups.length - 1; i >= 0; i--) {
                const pk = this.pickups[i];
                pk.mesh.rotation.y += dt * 2.4;
                const d = pk.pos.distanceTo(playerTarget);
                const canAutoCollect = this._canCollect(pk);
                if (canAutoCollect && d < magnet && P.alive) {
                    const pull = playerTarget.clone().sub(pk.pos).normalize().multiplyScalar(Math.max(5.5, 14 - d * 1.5));
                    pk.vel.lerp(pull, Math.min(1, dt * 7));
                    pk.pos.addScaledVector(pk.vel, dt);
                    pk.group.position.copy(pk.pos);
                } else {
                    pk.group.position.set(pk.pos.x, pk.baseY + Math.sin(t * 3 + pk.phase) * 0.09, pk.pos.z);
                }
                if (d < 1.25 && canAutoCollect) {
                    this._collectPickup(pk);
                }
            }
        }

        _canCollect(pk) {
            const r = this.run;
            const P = this.P;
            if (!r || !P || !P.alive) return false;
            if (pk.type === 'heart_red') return P.hp < P.maxHp - 0.5;
            if (pk.type === 'heart_soul') return r.soulShield < (this.D.ISAAC?.soulShieldCap || 150);
            if (pk.type === 'battery') {
                const def = r.activeItem ? this.ID.activeById(r.activeItem) : null;
                return !!(def && r.activeCharges < def.charges);
            }
            return true;
        }

        _blastAt(pos, radius, dmg, colorHex) {
            const M = this.M;
            BO.FX?.spawnExplosion?.(pos.clone().add(UP), Math.min(8, radius), colorHex);
            for (const z of M.enemiesInRadius(pos, radius)) {
                M.dealDamage(z, dmg, { source: 'ability' });
            }
            this.onExplosionAt(pos, radius, dmg);
        }

        _findSafestSpot() {
            const L = this.M?.layout;
            if (!L) return this.P.pos.clone();
            const corners = [
                new THREE.Vector3(-L.hw + 3, 0, -L.hl + 4),
                new THREE.Vector3(L.hw - 3, 0, -L.hl + 4),
                new THREE.Vector3(-L.hw + 3, 0, L.hl - 4),
                new THREE.Vector3(L.hw - 3, 0, L.hl - 4)
            ];
            let best = corners[0];
            let bestScore = -1;
            for (const c of corners) {
                let minD = 999;
                for (const z of this.M.enemies) {
                    if (!this.M.isAlive(z)) continue;
                    minD = Math.min(minD, BO.Math.dist2D(c.x, c.z, z.pos.x, z.pos.z));
                }
                if (minD > bestScore) { bestScore = minD; best = c; }
            }
            best.y = BO.World.getGroundHeight(best.x, best.z, 1);
            return best;
        }
    }

    BO.RPGItems = new RPGItems();
})(window);
