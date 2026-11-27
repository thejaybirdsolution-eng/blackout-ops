/* ============================================================================
   BLACKOUT OPS — Complete COD Zombies Mode
   - 20 Unique Zombies unlocked 1 every 3 completed rounds (easier first)
   - Weighted RNG spawn odds (tougher zombies have lower spawn chance)
   - 5 Unique Boss Rounds at Rounds 5, 10, 20, 25, and 50 w/ Live Boss Bar
   - Enemy Ranged Projectiles, 3-Tier Pack-a-Punch, 6 Perks, Mystery Box, Exfil
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class ZombiesMode {
        constructor() {
            this.active = false;
            this.mapId = 'der_bunker';
            this.useClassicStarter = true;
            this.round = 1;
            this.points = 500;
            this.kills = 0;
            this.headshots = 0;
            this.zombies = [];
            this.enemyProjectiles = [];
            this.activeBoss = null;
            this.nextZombieId = 1;

            this.state = 'intermission';
            this.stateTimer = 1.6;
            this.firstRoundStarted = false;
            this.remainingToSpawn = 0;
            this.spawnCooldown = 0;
            this.isBossRound = false;
            this.boxSpins = 0;

            this.instaKillTimer = 0;
            this.doublePointsTimer = 0;
            this.fireSaleTimer = 0;
            this.powerUps = [];
            this.supplies = 0;
            this.supplyDrops = [];
            this.fortifications = [];
            this.thrownTowerBalls = [];
            this.sniperTowerBalls = 0;

            this.exfilAvailable = false;
            this.exfilActive = false;
            this.exfilTimer = 0;

            this.mapQuest = this._makeEmptyMapQuest();
            this.activePrompt = null;
            this.elapsed = 0;
            this.modifiers = {};
            this.disabledEnemySet = new Set();
            this.unlockedPoolCount = 2;
            this.unlockedBossCount = 0;

            BO.Events.on('zombie:split', (info) => {
                if (!this.active || !info || !info.parent || !info.count) return;
                this._spawnSplitChildren(info.parent, info.count);
            });

            BO.Events.on('player:revived', (playerPos) => {
                if (!this.active) return;
                BO.FX.spawnParticles(playerPos.clone().add(new THREE.Vector3(0, 0.9, 0)), 22, 0x38bdf8, 6.5, 4, 0.7, 1.8);
                for (const z of this.zombies) {
                    if (!z.alive) continue;
                    if (z.pos.distanceTo(playerPos) <= 5.5) {
                        z.stunTimer = Math.max(z.stunTimer, 2.0);
                        const push = z.pos.clone().sub(playerPos);
                        push.y = 0;
                        if (push.lengthSq() > 0.001) push.normalize();
                        else push.set(0, 0, 1);
                        z.vel.x += push.x * 12;
                        z.vel.y = 4.0;
                        z.vel.z += push.z * 12;
                    }
                }
            });
        }

        start(opts) {
            this.active = true;
            this.mapId = opts.mapId || 'der_bunker';
            this.difficulty = opts.difficulty || 'normal'; // 'normal' | 'hard' | 'very_hard' | 'insanely_hard' | 'boss_rush'
            this.useClassicStarter = opts.useClassicStarter !== undefined ? opts.useClassicStarter : false;
            this.modifiers = Object.assign({}, opts.zModifiers || {});
            this.customValues = Object.assign({
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
            }, opts.zCustomValues || {});
            this.disabledEnemySet = new Set(Array.isArray(opts.disabledEnemies) ? opts.disabledEnemies : []);

            const scene = BO.World.build(this.mapId);
            const map = BO.World.mapData;
            this.roundDamageTaken = false;
            this.surgeUsedRound = -1;
            this.lastSodaTarget = null;
            this.lastSodaHit = -Infinity;
            this._addIndividualSodaMachines(map);
            if (this.modifiers.lowGravity) map.gravityScale = 0.45;
            if (this.modifiers.nightmareDarkness && scene.fog) {
                scene.fog.color.setHex(0x020308);
                scene.fog.near = 4;
                scene.fog.far = 36;
            }
            const loadout = BO.Loadout.getActiveClass();

            BO.Player.initForMatch('zombies', map.playerSpawn, loadout, this.useClassicStarter);
            const pMaxHp = BO.Math.clamp(Number(this.customValues.playerMaxHp) || 100, 1, 5000);
            if (pMaxHp !== 100) {
                BO.Player.maxHp = pMaxHp;
                BO.Player.hp = pMaxHp;
            }
            this.startProtocol = opts.startProtocol || (this.useClassicStarter ? 'classic' : 'custom');
            if (this.startProtocol !== 'custom' && this.startProtocol !== 'classic') {
                BO.Mods.applyStartProtocol(this.startProtocol, 'zombies');
            }
            BO.Mods.applyPlayerStart(this.modifiers, 'zombies');
            BO.Combat.reset(opts.camera);

            if (this.modifiers.allEnemiesUnlocked) {
                this.unlockedPoolCount = BO.ZombiesData.ORDERED_PROGRESSION.length;
                this.unlockedBossCount = BO.ZombiesData.ORDERED_BOSSES.length;
            } else {
                this.unlockedPoolCount = (this.difficulty === 'insanely_hard' || this.difficulty === 'very_hard') ? 5 : (this.difficulty === 'hard' ? 3 : 2);
                this.unlockedBossCount = this.difficulty === 'boss_rush' ? BO.ZombiesData.ORDERED_BOSSES.length : 0;
            }

            const cc = (BO.Cheats && BO.Cheats.isActive('choose', true)) ? BO.Save.data.chooseConfig : null;
            this.round = Math.max(1, parseInt(opts.startRound || (cc && cc.startRound), 10) || 1);
            const customPts = Number(this.customValues.startCurrency) || 0;
            const basePts = customPts > 0
                ? customPts
                : (this.modifiers.richStart ? 10000 : (this.difficulty === 'boss_rush' ? 10000 : ((cc && cc.startPoints) ? cc.startPoints : 500)));
            this.points = (BO.Cheats && BO.Cheats.isActive('infmoney')) ? 99999 : BO.Mods.startCurrency(this.modifiers, basePts);
            this.kills = 0;
            this.headshots = 0;
            this.zombies = [];
            this.enemyProjectiles = [];
            this.activeBoss = null;
            this.powerUps = [];
            const zFx = BO.Mods.fx(this.modifiers, 'zombies');
            this.supplies = (this.modifiers.richStart ? 30000 : 0) + (zFx.startSupplies || 0);
            this.supplyDrops = [];
            this.fortifications = [];
            this.thrownTowerBalls = [];
            this.sniperTowerBalls = 0;
            this.instaKillTimer = 0;
            this.doublePointsTimer = 0;
            this.fireSaleTimer = 0;
            this.danceIntervalTimer = 14.0;
            this.exfilAvailable = this.round >= (zFx.earlyExfil || 10);
            this.exfilActive = false;
            this.exfilTimer = 0;
            this.boxSpins = 0;
            this.elapsed = 0;
            this.mapQuest = this._makeEmptyMapQuest();
            this._initNuketownQueue();

            this.state = 'intermission';
            this.stateTimer = 1.6;
            this.firstRoundStarted = false;

            BO.Combat.onHitEnemy = (ent, dmg, hitbox, dist, w, pt, dir) => this._onBulletHit(ent, dmg, hitbox, w, pt, dir, dist);
            BO.Combat.onExplodeAt = (pos, rad, dmg, owner, isFlash, stunDur, wid) => this._onExplode(pos, rad, dmg, isFlash, stunDur, wid);
            BO.Combat.onActivateKillstreak = null;

            BO.Progression.recordStat('zombiesGames', 1);
            BO.Sound.startMusic('zombies');
            BO.Events.emit('zombies:started', { mapName: map.name, round: 1 });
            return scene;
        }

        _makeEmptyMapQuest() {
            return {
                derRieseLinked: new Set(),
                derRieseLinkActive: null,
                derRieseLinkTimer: 0,
                kinoLinked: false,
                kinoLinkPending: false,
                kinoBoothTimer: 0,
                kinoCooldown: 0,
                fiveDefcon: 1,
                fiveInPanicRoom: false,
                fivePanicTimer: 0,
                fiveBonfireTimer: 0,
                fiveNextThiefRound: 6,
                fiveThiefEntity: null,
                ascensionLandersRidden: new Set(),
                ascensionRocketLaunched: false,
                ascensionRocketExploded: false,
                nuketownPop: 99,
                nuketownDropQueue: [],
                nuketownDropPads: [],
                nuketownDroppedCount: 0,
                floorStrayTimers: new Map()
            };
        }

        _initNuketownQueue() {
            if (this.mapId !== 'nuketown_zombies') return;
            const queue = ['juggernog', 'speed_cola', 'double_tap', 'pack_a_punch'];
            for (let i = queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const t = queue[i]; queue[i] = queue[j]; queue[j] = t;
            }
            this.mapQuest.nuketownDropQueue = queue;
            const pads = (BO.World.mapData.skyDropPads || []).filter((p) => !p.isSpawn).slice();
            for (let i = pads.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const t = pads[i]; pads[i] = pads[j]; pads[j] = t;
            }
            this.mapQuest.nuketownDropPads = pads;
        }

        stop() {
            this.active = false;
            BO.World.clearVisualFilters();
            if (BO.Player) BO.Player.rideState = null;
            for (const z of this.zombies) z.destroy();
            this.zombies = [];
            this.activeBoss = null;
            for (const ep of this.enemyProjectiles) {
                if (ep.mesh && BO.World.scene) BO.World.scene.remove(ep.mesh);
            }
            this.enemyProjectiles = [];
            for (const pu of this.powerUps) {
                if (pu.mesh && BO.World.scene) BO.World.scene.remove(pu.mesh);
            }
            this.powerUps = [];
            for (const sd of this.supplyDrops) {
                if (sd.mesh && BO.World.scene) BO.World.scene.remove(sd.mesh);
            }
            this.supplyDrops = [];
            for (const ft of this.fortifications) {
                if (ft.mesh && BO.World.scene) BO.World.scene.remove(ft.mesh);
                if (ft.colliders) ft.colliders.forEach((c) => { c.active = false; });
            }
            this.fortifications = [];
            for (const tb of this.thrownTowerBalls) {
                if (tb.mesh && BO.World.scene) BO.World.scene.remove(tb.mesh);
            }
            this.thrownTowerBalls = [];
            BO.Sound.stopMusic();
        }

        addPoints(amount, reason = '') {
            if (amount <= 0) return;
            const choose2x = BO.Cheats && BO.Cheats.isActive('choose') && BO.Save.data.chooseConfig?.advDoublePoints;
            const mult = ((this.doublePointsTimer > 0 || choose2x) ? 2 : 1) * (this.modifiers.doubleGold ? 2 : 1) * BO.Mods.currencyMult(this.modifiers);
            const finalAmt = Math.round(amount * mult);
            this.points += finalAmt;
            if (BO.Cheats && BO.Cheats.isActive('infmoney')) this.points = Math.max(this.points, 99999);
            BO.Events.emit('hud:points_popup', { amount: finalAmt, reason });
        }

        _spawnSplitChildren(parent, count) {
            const total = Math.min(4, Math.max(2, count || 2));
            for (let i = 0; i < total; i++) {
                const ang = (i / total) * Math.PI * 2;
                const entry = this.round < 10 ? this._pickSpawnPoint() : null;
                const child = new BO.ZombieEntity({
                    id: this.nextZombieId++,
                    spec: parent.spec,
                    round: this.round,
                    hp: Math.max(20, Math.round(parent.maxHp * (total >= 4 ? 0.30 : 0.45))),
                    speed: Math.min(9.0, parent.speed * 1.15),
                    damage: Math.max(5, Math.round(parent.damage * 0.65)),
                    x: entry?.x ?? parent.pos.x + Math.cos(ang) * 0.9,
                    y: entry?.y ?? parent.pos.y,
                    z: entry?.z ?? parent.pos.z + Math.sin(ang) * 0.9,
                    sizeMult: (parent.sizeMult || 1) * 0.68,
                    isSplitChild: true,
                    splitCount: 0,
                    jumpChance: parent.jumpChance || 0,
                    windowInteractive: entry?.winInter
                });
                this.zombies.push(child);
            }
            BO.FX.spawnParticles(parent.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 12, 0x22c55e, 4.5, 4, 0.45, 1.3);
        }

        triggerZombieDance() {
            if (!this.active) return;
            for (const z of this.zombies) {
                if (z.alive) z.danceTimer = 2.0;
            }
            BO.Sound.playMysteryBoxJingle();
            BO.Events.emit('hud:toast', {
                text: '♪ ZOMBIE DANCE PARTY! ALL ZOMBIES DANCING FOR 2 SECONDS! ♪',
                color: '#e879f9'
            });
        }

        jumpToRound(targetRound) {
            if (!this.active) return;
            const r = Math.max(1, Math.min(999, parseInt(targetRound, 10) || 1));
            for (const z of this.zombies) z.destroy();
            this.zombies = [];
            this.activeBoss = null;
            for (const ep of this.enemyProjectiles) {
                if (ep.mesh && BO.World.scene) BO.World.scene.remove(ep.mesh);
            }
            this.enemyProjectiles = [];
            this.firstRoundStarted = true;
            this._beginRound(r);
        }

        _beginRound(r) {
            this.round = r;
            let bossSpec = BO.ZombiesData.getBossForRound(r);
            if (this.difficulty === 'boss_rush') {
                const allBosses = Object.values(BO.ZombiesData.BOSSES_BY_ROUND);
                bossSpec = allBosses[(r - 1) % allBosses.length];
            }
            this.roundDamageTaken = false;
            this.isBossRound = !!bossSpec;
            this.activeBoss = null;
            this.state = 'fighting';

            // Progressive Pool: 50% chance to add 1 new enemy per completed round, and +1 Boss every 5 rounds!
            if (r > 1 && !this.modifiers.allEnemiesUnlocked) {
                if (this.unlockedPoolCount < BO.ZombiesData.ORDERED_PROGRESSION.length && Math.random() < 0.50) {
                    const added = BO.ZombiesData.ORDERED_PROGRESSION[this.unlockedPoolCount++];
                    if (added) {
                        BO.Events.emit('hud:toast', {
                            text: `🔓 50% ROLL HIT! NEW ENEMY ENTERED POOL: ${added.name.toUpperCase()} (${added.rarity.toUpperCase()})!`,
                            color: '#f5a623'
                        });
                    }
                }
                if (r % 5 === 0 && this.unlockedBossCount < BO.ZombiesData.ORDERED_BOSSES.length) {
                    const addedBoss = BO.ZombiesData.ORDERED_BOSSES[this.unlockedBossCount++];
                    if (addedBoss) {
                        BO.Events.emit('hud:toast', {
                            text: `⚠ BOSS ENTERED POOL (ROUND ${r}): ${addedBoss.name}!`,
                            color: '#ef4444'
                        });
                    }
                }
            }
            if (this.modifiers.randomLoadoutWave && r > 1) {
                const randW = BO.Math.pick(BO.WeaponsData.ORDER);
                BO.Player.giveWeapon(randW, false, false);
                BO.Events.emit('hud:toast', { text: `🎲 RANDOM LOADOUT ROUND: ${BO.WeaponsData.get(randW).name}!`, color: '#c084fc' });
            }

            const wMult = Number(this.customValues.waveSizeMult) || 1.0;
            if (bossSpec) {
                // Boss & Colossal Super Boss Rounds
                this.remainingToSpawn = Math.max(1, Math.min(200, Math.round((4 + Math.floor(r * 0.35)) * (this.modifiers.chaosSwarm ? 2.0 : 1.0) * wMult)));
                BO.Sound.playBossIntro();
                if (bossSpec.isSuperBoss) {
                    if (BO.Player) BO.Player.cameraShake = Math.max(BO.Player.cameraShake || 0, 0.14);
                    BO.Sound.playAnnouncement?.('super_boss', 'Super Boss Inbound!');
                    BO.Events.emit('hud:banner', {
                        title: `👑 SUPER BOSS ROUND ${r}: ${bossSpec.name}`,
                        sub: `${bossSpec.title.toUpperCase()} — ${bossSpec.weaknessText}`,
                        color: '#fbbf24'
                    });
                } else {
                    BO.Events.emit('hud:banner', {
                        title: `BOSS ROUND ${r}: ${bossSpec.name}`,
                        sub: `${bossSpec.title.toUpperCase()} — ${bossSpec.weaknessText}`,
                        color: '#ef4444'
                    });
                }
                this._spawnBoss(bossSpec);
            } else {
                this.remainingToSpawn = Math.max(1, Math.min(300, Math.round((5 + r * 3.2 + (r > 10 ? (r - 10) * 1.4 : 0)) * (this.modifiers.chaosSwarm ? 2.0 : 1.0) * wMult)));
                BO.Events.emit('hud:banner', {
                    title: 'ROUND ' + BO.Math.toRoman(r),
                    sub: this.exfilAvailable
                        ? `POOL: ${this.unlockedPoolCount}/70 ENEMIES • PRESS [H] TO CALL EXFIL`
                        : `ACTIVE HORDE POOL: ${this.unlockedPoolCount}/70 ENEMIES (${this.unlockedBossCount} BOSSES)`,
                    color: '#dc2626'
                });
                BO.Sound.playRoundStart(r, false);
            }

            if (r >= 10) this.exfilAvailable = true;
            BO.Progression.recordHighestRound(this.mapId, r);
            this._onRoundBeginMapEvents(r, bossSpec);
            this.spawnCooldown = 1.1;
        }

        _onRoundBeginMapEvents(r, bossSpec) {
            if (this.mapId === 'nuketown_zombies') {
                this.mapQuest.nuketownPop = Math.max(0, 99 - (r - 1));
                BO.World.updateNuketownPopulation(this.mapQuest.nuketownPop);
                const pads = BO.World.mapData.skyDropPads || [];
                if (r === 1 && !this.mapQuest.nuketownSpawnDropped) {
                    this.mapQuest.nuketownSpawnDropped = true;
                    const spPad = pads.find((p) => p.isSpawn) || pads[0];
                    if (spPad) {
                        BO.World.launchSkyDrop('perk', {
                            id: 'quick_revive', name: 'Quick Revive', cost: 500,
                            color: '#38bdf8', desc: 'Solo Self-Revive (Sky-Drop)', requiresPower: false
                        }, spPad);
                        BO.Sound.playAirRaidSiren();
                    }
                }
                while (this.mapQuest.nuketownDroppedCount < this.mapQuest.nuketownDropQueue.length &&
                       r >= (this.mapQuest.nuketownDroppedCount + 1) * 3) {
                    const idx = this.mapQuest.nuketownDroppedCount++;
                    const kindId = this.mapQuest.nuketownDropQueue[idx];
                    const pad = this.mapQuest.nuketownDropPads[idx % Math.max(1, this.mapQuest.nuketownDropPads.length)];
                    if (!pad) break;
                    BO.Sound.playAirRaidSiren();
                    const perkDefs = {
                        juggernog: { id: 'juggernog', name: 'Juggernog', cost: 2500, color: '#ef4444', desc: '250 Max HP', requiresPower: false },
                        speed_cola: { id: 'speed_cola', name: 'Speed Cola', cost: 3000, color: '#22c55e', desc: '2x Reload Speed', requiresPower: false },
                        double_tap: { id: 'double_tap', name: 'Double Tap 2.0', cost: 2000, color: '#f59e0b', desc: 'Double Bullets', requiresPower: false }
                    };
                    if (kindId === 'pack_a_punch') {
                        BO.World.launchSkyDrop('pack_a_punch', {}, pad);
                        BO.Events.emit('hud:banner', { title: 'SKY-DROP INCOMING!', sub: 'PACK-A-PUNCH METEOR DESCENDING FROM ORBIT!', color: '#c084fc' });
                    } else if (perkDefs[kindId]) {
                        BO.World.launchSkyDrop('perk', perkDefs[kindId], pad);
                        BO.Events.emit('hud:banner', { title: 'PERK SKY-DROP INCOMING!', sub: `${perkDefs[kindId].name.toUpperCase()} DESCENDING TO ${pad.label || 'YARD'}!`, color: perkDefs[kindId].color });
                    }
                }
            }

            // "Five" Pentagon Thief Event
            if (this.mapId === 'five_pentagon' && BO.World.powerOn && r >= this.mapQuest.fiveNextThiefRound && !bossSpec && !this.mapQuest.fiveThiefEntity) {
                this.mapQuest.fiveNextThiefRound = r + 5;
                this._spawnPentagonThief(r);
            }
        }

        _spawnPentagonThief(r) {
            const sp = this._pickSpawnPoint(false);
            const thiefSpec = {
                id: 'pentagon_thief',
                name: 'THE PENTAGON THIEF',
                title: 'Classified Lab Intruder',
                weaknessText: 'KILL BEFORE HE ESCAPES FOR BONFIRE SALE (1,000 PTS PaP)!',
                isBoss: false,
                isPentagonThief: true,
                hp: Math.round(1350 + r * 140),
                speed: 5.1,
                attack: 34,
                defense: 0.14,
                resistances: { bullet: 1.0, explosive: 1.25, fire: 1.0, headshot: 1.8, melee: 1.1 },
                movementHabit: 'sprint',
                attackType: 'melee',
                soundProfile: 'shriek_fast',
                drops: { points: 2500, xp: 500 },
                bodySpec: {
                    scale: [0.96, 1.04, 0.96],
                    skinColor: 0x9ca3af, shirtColor: 0x111827, pantsColor: 0x0f172a,
                    eyeColor: 0xef4444, torsoShape: 'lean'
                }
            };
            const thief = new BO.ZombieEntity({
                id: this.nextZombieId++,
                spec: thiefSpec,
                round: r,
                hp: Math.max(5, Math.round(thiefSpec.hp * this._zombieHealthScale(false))),
                speed: thiefSpec.speed,
                damage: thiefSpec.attack,
                x: sp.x, y: sp.y, z: sp.z,
                windowInteractive: sp.winInter
            });
            this.zombies.push(thief);
            this.mapQuest.fiveThiefEntity = thief;
            BO.Sound.playDefconBeep(5);
            BO.Events.emit('hud:banner', {
                title: 'PENTAGON THIEF DETECTED!',
                sub: 'STOP HIM TO EARN BONFIRE SALE (1,000 PTS PaP) + MAX AMMO!',
                color: '#ef4444'
            });
        }

        _pickSpawnPoint(allowWindow = true) {
            const map = BO.World.mapData;
            const unlocked = BO.World.unlockedZones;
            const windows = BO.World.interactives.filter((i) => i.type === 'window');
            const earlyRound = this.round < 10 && windows.length > 0;
            if (earlyRound) allowWindow = true;
            const accessibleWindows = windows.filter((i) => unlocked.has(i.data.zone) && (!i.data.requiresPower || BO.World.powerOn));
            const allWindows = earlyRound && !accessibleWindows.length ? windows : accessibleWindows;
            const allGround = (map.groundSpawners || []).filter((g) => unlocked.has(g.zone));

            const P = BO.Player;
            const px = P ? P.pos.x : 0;
            const py = P ? P.pos.y : 0;
            const pz = P ? P.pos.z : 0;
            const sameFloorWin = allWindows.filter((w) => Math.abs((w.data.y || 0) - py) < 3.6);
            const sameFloorGnd = allGround.filter((g) => Math.abs((g.y || 0) - py) < 3.6);
            const validWindows = sameFloorWin.length > 0 ? sameFloorWin : allWindows;
            const validGround = sameFloorGnd.length > 0 ? sameFloorGnd : allGround;

            this._recentZSpawns ??= new Map();
            const now = this.elapsed || 0;

            const scorePoint = (sx, sy, sz, isWin) => {
                const dp = BO.Math.dist2D(sx, sz, px, pz);
                // Prefer 7m..26m pressure band; penalize right-on-player (<4.5m) or ultra-distant (>34m)
                let s = dp < 4.5 ? -55 : (dp <= 26 ? 26 - Math.abs(dp - 14.5) * 0.75 : Math.max(-18, 22 - (dp - 26) * 0.9));
                // Anti-clustering against active zombies
                let minZDist = 999;
                for (let i = 0; i < this.zombies.length; i++) {
                    const z = this.zombies[i];
                    if (!z || !z.alive) continue;
                    const dz = BO.Math.dist2D(sx, sz, z.pos.x, z.pos.z);
                    if (dz < minZDist) minZDist = dz;
                }
                if (minZDist < 1.8) s -= 45;
                else if (minZDist < 3.6) s -= 16;
                // Recent reuse cooldown
                const key = `${Math.round(sx)}_${Math.round(sz)}_${isWin ? 1 : 0}`;
                const lastT = this._recentZSpawns.get(key);
                if (lastT !== undefined && (now - lastT) < 3.2) s -= 28;
                return s + Math.random() * 6.5;
            };

            const useGround = !earlyRound && validGround.length > 0 && (!allowWindow || validWindows.length === 0 || Math.random() < 0.48);
            if (useGround) {
                let bestG = validGround[0], bestScore = -Infinity;
                for (let i = 0; i < validGround.length; i++) {
                    const gs = validGround[i];
                    const sc = scorePoint(gs.x, gs.y || 0, gs.z, false);
                    if (sc > bestScore) { bestScore = sc; bestG = gs; }
                }
                const gy = bestG.y || 0;
                this._recentZSpawns.set(`${Math.round(bestG.x)}_${Math.round(bestG.z)}_0`, now);
                for (let t = 0; t < 5; t++) {
                    const jx = bestG.x + (t === 4 ? 0 : BO.Math.randRange(-1.05, 1.05));
                    const jz = bestG.z + (t === 4 ? 0 : BO.Math.randRange(-1.05, 1.05));
                    if (!BO.World.hasHeadroom || BO.World.hasHeadroom(jx, gy + 0.05, jz, 0.42, 1.75)) {
                        return { x: jx, y: gy, z: jz, winInter: null };
                    }
                }
                return { x: bestG.x, y: gy, z: bestG.z, winInter: null };
            }
            if (allowWindow && validWindows.length > 0) {
                let bestW = validWindows[0], bestScore = -Infinity;
                for (let i = 0; i < validWindows.length; i++) {
                    const w = validWindows[i];
                    const sc = scorePoint(w.data.outside[0], w.data.outside[1] || w.data.y || 0, w.data.outside[2], true);
                    if (sc > bestScore) { bestScore = sc; bestW = w; }
                }
                this._recentZSpawns.set(`${Math.round(bestW.data.outside[0])}_${Math.round(bestW.data.outside[2])}_1`, now);
                return { x: bestW.data.outside[0], y: bestW.data.outside[1] || bestW.data.y || 0, z: bestW.data.outside[2], winInter: bestW };
            }
            return { x: BO.World.mapData.playerSpawn.x, y: BO.World.mapData.playerSpawn.y || 0, z: (BO.World.mapData.playerSpawn.z || 0) + 6, winInter: null };
        }

        get perksAllowed() {
            return !this.modifiers.noPerks && !(BO.Cheats?.isActive('choose') && BO.Save.data.chooseConfig?.disNoPerks);
        }

        _addIndividualSodaMachines(map) {
            const sodas = BO.ExpansionData.sodas;
            // Keep each machine's drink familiar when players return to this map.
            const offset = [...map.id].reduce((hash, c) => (hash * 31 + c.charCodeAt(0)) % sodas.length, 0);
            for (const [index, spot] of (map.sodaMachineSpots || []).entries()) {
                const soda = sodas[(offset + index * 7) % sodas.length];
                BO.World._spawnPerkMachine({ ...soda, ...spot });
            }
        }

        _zombieHealthScale(isBoss) {
            const custom = BO.Math.clamp(Number(this.customValues.zombieHpMult) || 1, 0.05, 20);
            const reduction = this.modifiers.quarterZombieHp ? 0.25 : (this.modifiers.halfZombieHp ? 0.5 : 1);
            return custom * reduction * (isBoss ? 0.85 : 0.78);
        }

        _enemyAttackDamage(enemy) {
            return enemy.damage * (enemy.sodaWeakenedUntil > this.elapsed ? 0.65 : 1);
        }

        _getDifficultyMultipliers() {
            if (this.difficulty === 'hard') return { hp: 1.5, spd: 1.18, atk: 1.35 };
            if (this.difficulty === 'very_hard') return { hp: 2.25, spd: 1.32, atk: 1.70 };
            if (this.difficulty === 'insanely_hard') return { hp: 3.5, spd: 1.48, atk: 2.20 };
            return { hp: 1.0, spd: 1.0, atk: 1.0 };
        }

        _spawnBoss(bossSpec) {
            const sp = this._pickSpawnPoint(false);
            const dm = this._getDifficultyMultipliers();
            const customHpMult = this._zombieHealthScale(true);
            const boss = new BO.ZombieEntity(BO.Mods.tweakSpawnOpts(this.modifiers, {
                id: this.nextZombieId++,
                spec: bossSpec,
                round: this.round,
                hp: Math.max(50, Math.round(bossSpec.hp * dm.hp * customHpMult)),
                speed: bossSpec.speed * dm.spd,
                damage: this.modifiers.oneHitMeleeZombies ? 99999 : Math.round(bossSpec.attack * dm.atk),
                x: sp.x,
                y: sp.y,
                z: sp.z,
                windowInteractive: sp.winInter
            }, { round: this.round, isBoss: true }));
            BO.Mods.afterSpawn(this.modifiers, boss);
            this.zombies.push(boss);
            this.activeBoss = boss;
        }

        _spawnZombie() {
            const unlockedEnemies = BO.ZombiesData.ORDERED_PROGRESSION.slice(0, Math.max(1, this.unlockedPoolCount));
            const unlockedBosses = BO.ZombiesData.ORDERED_BOSSES.slice(0, this.unlockedBossCount);
            const baseBossPct = Number(this.customValues.bossSpawnPct ?? 2.0);
            const effBossPct = baseBossPct + (this.round > 10 ? (this.round - 10) * 0.5 : 0);
            let spec;
            if (this.modifiers.allBosses) {
                const availBosses = BO.ZombiesData.ORDERED_BOSSES.filter((b) => {
                    if (this.disabledEnemySet.has(b.id)) return false;
                    const sr = BO.ZombieCustomizer ? BO.ZombieCustomizer.getStartRound(b.id) : null;
                    return sr == null || this.round >= sr;
                });
                spec = (BO.ZombieCustomizer && availBosses.length > 0)
                    ? BO.ZombieCustomizer._pickWeightedInList(availBosses)
                    : (BO.Math.pick(availBosses) || BO.ZombiesData.ORDERED_BOSSES[0]);
            } else if (BO.ZombieCustomizer) {
                spec = BO.ZombieCustomizer.pickEnemy({
                    round: this.round,
                    unlockedEnemies,
                    unlockedBosses,
                    disabledSet: this.disabledEnemySet,
                    bossChancePct: effBossPct,
                    allUnlocked: !!this.modifiers.allEnemiesUnlocked
                });
            } else {
                spec = BO.ZombiesData.pickFromTieredPool(unlockedEnemies, unlockedBosses, this.disabledEnemySet, effBossPct);
            }
            const cc = (BO.Cheats && BO.Cheats.isActive('choose')) ? BO.Save.data.chooseConfig : null;
            if (cc && Array.isArray(cc.customZombiePool) && cc.customZombiePool.length > 0) {
                const customSpecs = cc.customZombiePool.map((id) => BO.ZombiesData.get(id)).filter(Boolean);
                if (customSpecs.length > 0) {
                    spec = BO.Math.pick(customSpecs);
                }
            }
            const allowWindow = !spec.isBoss && !spec.bodySpec?.quadruped && !spec.bodySpec?.floating && (spec.bodySpec?.scale?.[0] || 1) < 1.3;
            const sp = this._pickSpawnPoint(allowWindow);

            // Round & Difficulty scaling layered onto each zombie's unique base stats
            const dm = this._getDifficultyMultipliers();
            const turboMult = ((cc && cc.disTurboZombies) ? 1.45 : 1.0) * (this.modifiers.fastZombies ? 1.55 : 1.0);
            const sizeMult = this.modifiers.giantZombies ? 1.65 : (this.modifiers.tinyZombies ? 0.62 : 1.0);
            const sizeHpMult = this.modifiers.giantZombies ? 1.65 : (this.modifiers.tinyZombies ? 0.72 : 1.0);
            const glassHp = this.modifiers.glassCannon ? 0.5 : 1.0;
            const swarmHp = this.modifiers.chaosSwarm ? 0.55 : 1.0;
            const customHpMult = this._zombieHealthScale(spec.isBoss);
            const customSpdMult = Number(this.customValues.zombieSpeedMult) || 1.0;
            const customDmgMult = Number(this.customValues.zombieDamageMult) || 1.0;
            const glassDmg = this.modifiers.glassCannon ? 3.0 : 1.0;
            const roundHpMult = 1 + (this.round - 1) * 0.16 + Math.max(0, this.round - 12) * 0.09;
            const hp = Math.max(5, Math.round(spec.hp * roundHpMult * dm.hp * sizeHpMult * glassHp * swarmHp * customHpMult));
            const speed = Math.min(12.0, spec.speed * (1 + Math.min(0.45, (this.round - 1) * 0.015)) * dm.spd * turboMult * customSpdMult);
            const dmg = this.modifiers.oneHitMeleeZombies ? 99999 : Math.max(1, Math.min(500, Math.round(spec.attack * (1 + (this.round - 1) * 0.025) * dm.atk * glassDmg * customDmgMult)));

            const zOpts = BO.Mods.tweakSpawnOpts(this.modifiers, {
                id: this.nextZombieId++,
                spec,
                round: this.round,
                hp,
                speed,
                damage: dmg,
                x: sp.x,
                y: sp.y,
                z: sp.z,
                isMagical: !!(this.modifiers.magicalZombies || spec.isMagical),
                explosiveDeath: !!this.modifiers.explosiveDeath,
                splitCount: this.modifiers.megaSplitters ? Math.max(2, spec.splitCount || 0) : (spec.splitCount || 0),
                jumpChance: this.modifiers.superJumpZombies ? Math.max(0.55, spec.jumpChance || 0) : (spec.jumpChance || 0),
                sizeMult,
                windowInteractive: sp.winInter
            }, { round: this.round, isBoss: !!spec.isBoss });
            const z = new BO.ZombieEntity(zOpts);
            if (this.modifiers.armoredHorde) z.defense = Math.min(0.70, (z.defense || 0) + 0.35);
            BO.Mods.afterSpawn(this.modifiers, z);
            this.zombies.push(z);
        }

        _spawnEnemyProjectile(zombie, tx, ty, tz, extraOpts = null) {
            if (!BO.World.scene) return;
            const kind = (extraOpts && extraOpts.kind) || zombie.attackType;
            const col = kind === 'acid_spit' ? 0x4ade80 : (kind === 'fire_bolt' ? 0xf97316 : (kind === 'frost_shard' ? 0x38bdf8 : (kind === 'life_drain' ? 0xef4444 : 0xc084fc)));
            const count = (extraOpts && extraOpts.count) || (zombie.isSuperBoss ? 4 : (zombie.isBoss ? 3 : 1));
            const spreadStep = (extraOpts && extraOpts.spread !== undefined) ? extraOpts.spread : 0.16;
            const originY = (extraOpts && extraOpts.originY) || (zombie.isSuperBoss ? 3.1 : 1.4);
            const speed = (extraOpts && extraOpts.speed) || (zombie.isSuperBoss ? 21 : (zombie.isBoss ? 19 : 15));
            const origin = new THREE.Vector3(zombie.pos.x, zombie.pos.y + originY, zombie.pos.z);

            for (let c = 0; c < count; c++) {
                const spreadAngle = (c - (count - 1) * 0.5) * spreadStep;
                const dir = new THREE.Vector3(tx - origin.x, ty - origin.y, tz - origin.z).normalize();
                if (spreadAngle !== 0) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);

                const mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(zombie.isSuperBoss ? 0.27 : (zombie.isBoss ? 0.22 : 0.14), 8, 8),
                    new THREE.MeshBasicMaterial({ color: col })
                );
                mesh.position.copy(origin);
                BO.World.scene.add(mesh);

                this.enemyProjectiles.push({
                    kind,
                    mesh,
                    pos: origin.clone(),
                    vel: dir.multiplyScalar(speed),
                    damage: Math.round(zombie.damage * (zombie.isSuperBoss ? 0.58 : 0.65)),
                    life: 3.5,
                    color: col,
                    owner: zombie
                });
            }
            BO.Sound.playZombieGroan(zombie.soundProfile, 0.75);
        }

        _onBulletHit(z, dmg, hitbox, weaponInst, impactPos, dir, dist) {
            if (!z || !z.alive) return false;
            const cc = (BO.Cheats && BO.Cheats.isActive('choose')) ? BO.Save.data.chooseConfig : null;
            if (((cc && cc.disHeadshotsOnly) || this.modifiers.headshotsOnly) && hitbox !== 'head' && !z.spec.bodySpec?.headless) {
                return false;
            }
            if (z.powerAlly) return false;
            let modDmg = dmg;
            const sodas = BO.Player.zombiePerks;
            if (sodas.has('opening_bell') && !z.isBoss && z.hp === z.maxHp) modDmg *= 1.45;
            if (sodas.has('giant_slayer') && z.isBoss && dist > 15) modDmg *= 1.2;
            if (sodas.has('crossfire') && z.lastSodaZone && z.lastSodaZone !== hitbox) modDmg *= 1.35;
            if (sodas.has('relay') && this.lastSodaTarget && this.lastSodaTarget !== z && this.elapsed - this.lastSodaHit <= 2) modDmg *= 1.25;
            if (sodas.has('ground_level') && Math.abs(z.vel.y) > 0.65) modDmg *= 1.3;
            if (sodas.has('vault_breaker') && z.state === 'vault_window') modDmg *= 1.75;
            z.lastSodaZone = hitbox;
            this.lastSodaTarget = z;
            this.lastSodaHit = this.elapsed;
            if (sodas.has('countdown')) {
                z.sodaHits = (z.sodaHits || 0) + 1;
                if (z.sodaHits % 5 === 0) z.sodaWeakenedUntil = this.elapsed + 5;
            }
            if (cc) {
                if (cc.advDoubleDamage) modDmg *= 2.0;
                if (cc.disHalfDamage) modDmg *= 0.5;
            }
            const isMelee = weaponInst && (weaponInst.id === 'knife' || weaponInst.stats?.kind === 'melee');
            const wCatZ = (weaponInst?.stats?.category ? String(weaponInst.stats.category).toLowerCase() : '');
            if (this.modifiers.sniperHeaven && (wCatZ.includes('sniper') || wCatZ.includes('marksman'))) {
                modDmg *= 2.5;
            }
            if (this.modifiers.meleeMayhem && isMelee) {
                modDmg *= 4.0;
            }
            modDmg = BO.Mods.outgoingDamage(this.modifiers, modDmg, { hitbox, weaponInst, target: z });
            if (modDmg <= 0) return false;
            const isPaP = !!(weaponInst && weaponInst.isPaP);
            const isInsta = this.instaKillTimer > 0 || (cc && cc.advInstaKill);
            // Insta-kill does not one-shot Bosses (deals big 4x chunk instead!)
            const finalDmg = isInsta ? (z.isBoss ? modDmg * 4 : 99999) : (isPaP && z.isBoss ? modDmg * 1.35 : modDmg);
            const dmgKind = isMelee ? 'melee' : (weaponInst?.stats?.papEffect === 'incendiary' ? 'fire' : 'bullet');

            if (BO.Net && BO.Net.active && !BO.Net.isHost) {
                BO.Net.sendToHost({
                    type: 'z_hit',
                    zid: z.id,
                    dmg: finalDmg,
                    hitbox,
                    isHead: hitbox === 'head',
                    dmgKind
                });
            }

            const killed = z.takeDamage(finalDmg, hitbox, hitbox === 'head', dir, dmgKind);

            if (weaponInst && weaponInst.stats && weaponInst.stats.papEffect === 'incendiary' && !killed) {
                z.burnTimer = 2.5;
            }

            // Charge player's Ultimate Power from hits!
            BO.Player.addUltimateCharge(killed ? (z.isBoss ? 50 : 8) : 1.5);

            if (!killed) {
                this.addPoints(10, 'HIT');
                return false;
            }

            this.kills++;
            const isHead = hitbox === 'head' && !z.spec.bodySpec?.headless;
            BO.Mods.onKill(this.modifiers, z, {
                list: this.zombies,
                explode: (pt, rad, d) => this._onExplode(pt, rad, d, false, 0, 'corpse_bomb'),
                addCurrency: (amt) => this.addPoints(amt, 'BOUNTY')
            });
            if (this.modifiers.vampirePlayer && BO.Player.alive) {
                BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + 15);
            }
            if (this.modifiers.meleeMayhem && isMelee && BO.Player.alive) {
                BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + 20);
            }
            if (this.modifiers.explosiveHeadshots && isHead) {
                const pt = z.pos.clone().add(new THREE.Vector3(0, 1.3, 0));
                BO.FX.spawnExplosion(pt, 5.2, 0xf97316);
                BO.Sound.playExplosion(0.55);
                this._onExplode(pt, 5.8, 180, false, 0, 'explosive_hs');
            }
            if (isHead) {
                this.headshots++;
                BO.Progression.recordStat('zombiesHeadshots', 1);
                BO.Progression.awardMedal('headshot');
                BO.Progression.checkSingleGameHeadshotUnlock(this.headshots);
            }
            BO.Progression.recordStat('zombiesKills', 1);
            BO.Progression.registerCombatKill({
                mode: 'zombies',
                isHeadshot: isHead,
                isMelee,
                isBoss: !!z.isBoss,
                isSuperBoss: !!z.isSuperBoss,
                enemySwing: z.attackSwing || 0
            });

            if (BO.Player.frenziedActive) {
                BO.Player.armor = Math.min(BO.Player.maxArmor, BO.Player.armor + 25);
            }
            if (BO.Player.mpPerks.includes('quick_fix')) {
                BO.Player.regenDelayTimer = 0;
            }

            const basePts = z.spec.drops?.points || 60;
            const topHatBonus = (isHead && BO.Save.data.unlockables?.topHatEquipped) ? 1.15 : 1.0;
            const pts = Math.round((isMelee ? basePts + 70 : (isHead ? basePts + 40 : basePts)) * topHatBonus);
            this.addPoints(pts, z.isBoss ? 'BOSS SLAIN' : (isHead ? 'HEADSHOT' : 'KILL'));

            if (sodas.has('hush_money') && weaponInst?.stats?.suppressed) this.addPoints(30, 'HUSH MONEY');
            if (sodas.has('audit') && this.kills % 10 === 0) this.addPoints(200, 'COMMISSION');
            const activeWeapon = BO.Player.activeWeapon;
            if (sodas.has('knife_change') && isMelee && activeWeapon?.stats.kind === 'gun') {
                const rounds = Math.max(0, Math.min(3, activeWeapon.reserve, activeWeapon.stats.magSize - activeWeapon.mag));
                activeWeapon.reserve -= rounds;
                activeWeapon.mag += rounds;
            }
            const wId = isMelee ? null : weaponInst?.cfg?.id;
            if (wId) BO.Progression.grantWeaponKill(wId, isHead, isHead ? 85 : 55);
            BO.Progression.grantPlayerXP(z.isBoss ? (z.spec.drops.xp || 800) : (isHead ? 90 : 60));

            // 50% chance to drop Supplies worth 10% of the enemy's Max HP!
            this._maybeDropSupplies(z);

            // Unique Zombie Drops & Boss Rewards
            if (z.isBoss) {
                this.activeBoss = null;
                BO.Player.armor = BO.Player.maxArmor;
                BO.Player.armorReservePlates = 3;
                this._spawnPowerUp(z.pos.x, z.pos.y, z.pos.z, z.spec.drops.guaranteedPowerUp || 'max_ammo');
                if (z.isSuperBoss) {
                    this._spawnPowerUp(z.pos.x + 1.4, z.pos.y, z.pos.z, 'double_points');
                    this.supplies += 3500;
                    BO.Sound.playAnnouncement?.('boss_slain', 'Colossus Slain!');
                    BO.Events.emit('hud:banner', {
                        title: `👑 ${z.spec.name} VANQUISHED!`,
                        sub: `+${z.spec.drops.points} PTS • +3,500 SUPPLIES • TWIN POWER-UPS & FULL ARMOR`,
                        color: '#fbbf24'
                    });
                } else {
                    BO.Events.emit('hud:banner', {
                        title: `${z.spec.name} DEFEATED!`,
                        sub: `+${z.spec.drops.points} PTS • FULL ARMOR & GUARANTEED POWER-UP`,
                        color: '#22c55e'
                    });
                }
            } else if (z.spec.isPentagonThief) {
                this._onPentagonThiefKilled(z.pos);
            } else {
                const dInfo = z.spec.drops || {};
                const dropMult = BO.Mods.fx(this.modifiers, 'zombies').dropRateMult || 1;
                if (dInfo.bonusDrop === 'armor_shard' && Math.random() < 0.45) {
                    BO.Player.armor = Math.min(BO.Player.maxArmor, BO.Player.armor + 25);
                } else if (dInfo.bonusDrop === 'ammo_small' && Math.random() < 0.4 && BO.Player.activeWeapon) {
                    const aw = BO.Player.activeWeapon;
                    aw.reserve = Math.min(aw.stats.reserveMax, aw.reserve + Math.ceil(aw.stats.magSize * 0.5));
                } else if (dInfo.bonusDrop === 'health_orb' && Math.random() < 0.5) {
                    BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + 30);
                }
                if (Math.random() < (dInfo.dropChance || 0.085) * dropMult) {
                    const forced = dInfo.bias && dInfo.bias !== 'any' && Math.random() < 0.55 ? dInfo.bias : null;
                    this._spawnPowerUp(z.pos.x, z.pos.y, z.pos.z, forced);
                }
            }

            return true;
        }

        _onExplode(pos, radius, damage, isFlash, stunDur, weaponId) {
            let multi = 0;
            for (const z of this.zombies) {
                if (!z.alive) continue;
                const d = z.pos.distanceTo(pos);
                if (d <= radius) {
                    if (isFlash) {
                        z.stunTimer = Math.max(z.stunTimer, stunDur);
                    } else if (weaponId === 'cryo_nova') {
                        z.frozenTimer = Math.max(z.frozenTimer, stunDur || 7.0);
                        BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 1, 0)), 8, 0x38bdf8, 3, 2, 0.7, 1.3);
                    } else {
                        const falloff = 1 - (d / radius) * 0.55;
                        const dmg = this.instaKillTimer > 0 && !z.isBoss ? 99999 : damage * falloff;
                        const dir = z.pos.clone().sub(pos).normalize();
                        if (BO.Net && BO.Net.active && !BO.Net.isHost) {
                            BO.Net.sendToHost({
                                type: 'z_hit',
                                zid: z.id,
                                dmg,
                                hitbox: 'torso',
                                isHead: false,
                                dmgKind: 'explosive'
                            });
                        }
                        const killed = z.takeDamage(dmg, 'torso', false, dir, 'explosive');
                        if (killed) {
                            multi++;
                            this.kills++;
                            BO.Progression.recordStat('zombiesKills', 1);
                            this.addPoints(z.spec.drops?.points || 60, 'EXPLOSION');
                            BO.Progression.grantPlayerXP(55);
                            BO.Player.addUltimateCharge(7);
                            if (z.isBoss) {
                                this.activeBoss = null;
                                this._spawnPowerUp(z.pos.x, z.pos.y, z.pos.z, 'max_ammo');
                            } else if (z.spec.isPentagonThief) {
                                this._onPentagonThiefKilled(z.pos);
                            }
                        }
                    }
                }
            }
            if (multi >= 2) BO.Progression.awardMedal(multi >= 3 ? 'triple_kill' : 'double_kill');
            if (multi > 0) {
                BO.Sound.playHitmarker(false, true);
                BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: true });
            }
        }

        _onPentagonThiefKilled(pos) {
            this.mapQuest.fiveThiefEntity = null;
            this.mapQuest.fiveBonfireTimer = 30.0;
            this._spawnPowerUp(pos.x, pos.y, pos.z, 'max_ammo');
            BO.Sound.playPaPChime();
            BO.Events.emit('hud:banner', {
                title: 'BONFIRE SALE ACTIVATED!',
                sub: 'PENTAGON THIEF SLAIN — PACK-A-PUNCH ONLY 1,000 PTS FOR 30 SECONDS!',
                color: '#facc15'
            });
        }

        _spawnPowerUp(x, y, z, forcedKind = null) {
            if (!BO.World.scene) return;
            const types = [
                { id: 'max_ammo', label: 'MAX AMMO', color: 0x22c55e },
                { id: 'insta_kill', label: 'INSTA-KILL', color: 0xfacc15 },
                { id: 'double_points', label: '2X POINTS', color: 0x38bdf8 },
                { id: 'nuke', label: 'KABOOM NUKE', color: 0xf97316 },
                { id: 'carpenter', label: 'CARPENTER', color: 0xa855f7 },
                { id: 'fire_sale', label: 'FIRE SALE', color: 0xec4899 }
            ];
            const spec = forcedKind ? (types.find((t) => t.id === forcedKind) || types[0]) : BO.Math.pick(types);

            const mesh = new THREE.Group();
            mesh.position.set(x, y + 0.92, z);
            const gMat = new THREE.MeshStandardMaterial({ color: spec.color, emissive: spec.color, emissiveIntensity: 0.85, roughness: 0.25, metalness: 0.65 });
            const trimMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
            const darkMat = new THREE.MeshBasicMaterial({ color: 0x090d14 });

            if (spec.id === 'max_ammo') {
                // Military Ammo Crate w/ Carry Handle & Golden Latch
                mesh.add(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.32), gMat));
                const lid = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.08, 0.36), trimMat); lid.position.y = 0.20;
                const handle = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 6, 12, Math.PI), trimMat); handle.position.y = 0.24;
                const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.38), trimMat); clasp.position.y = 0.08;
                mesh.add(lid, handle, clasp);
            } else if (spec.id === 'insta_kill') {
                // Sculpted Glowing Skull Emblem
                const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), gMat); cranium.position.y = 0.08; cranium.scale.set(1, 1.08, 0.95);
                const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.22), gMat); jaw.position.set(0, -0.14, 0.04);
                mesh.add(cranium, jaw);
                for (const ex of [-0.09, 0.09]) {
                    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), darkMat); eye.position.set(ex, 0.07, 0.21); mesh.add(eye);
                }
                const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), darkMat); nose.position.set(0, -0.02, 0.23); mesh.add(nose);
            } else if (spec.id === 'double_points') {
                // Bold Sculpted "2X" Emblem
                const barA = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.54, 0.10), gMat); barA.position.x = 0.14; barA.rotation.z = 0.65;
                const barB = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.54, 0.10), gMat); barB.position.x = 0.14; barB.rotation.z = -0.65;
                const twoTop = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.10), gMat); twoTop.position.set(-0.16, 0.19, 0);
                const twoDiag = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.34, 0.10), gMat); twoDiag.position.set(-0.16, 0.02, 0); twoDiag.rotation.z = -0.55;
                const twoBot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.10), gMat); twoBot.position.set(-0.16, -0.18, 0);
                mesh.add(barA, barB, twoTop, twoDiag, twoBot);
            } else if (spec.id === 'nuke') {
                // Sculpted Fat-Man Atomic Warhead
                const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), gMat); body.scale.set(1, 1.38, 1); body.rotation.z = 0.35;
                const shroud = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 6, 14), trimMat); shroud.position.set(-0.12, -0.30, 0); shroud.rotation.set(Math.PI * 0.5, -0.35, 0);
                mesh.add(body, shroud);
                for (let f = 0; f < 4; f++) {
                    const ang = (f / 4) * Math.PI * 2;
                    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.03), trimMat);
                    fin.position.set(-0.10 + Math.cos(ang) * 0.14, -0.26, Math.sin(ang) * 0.14); fin.rotation.y = -ang; mesh.add(fin);
                }
            } else if (spec.id === 'carpenter') {
                // Sculpted Glowing Claw Hammer
                const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.58, 8), trimMat); handle.rotation.z = -0.35;
                const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.13, 0.14), gMat); head.position.set(0.08, 0.24, 0); head.rotation.z = -0.35;
                mesh.add(handle, head);
            } else {
                // Fire Sale Price-Tag + Flame Emblem
                const tag = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.44, 0.10), gMat); tag.rotation.z = 0.25;
                const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), darkMat); hole.rotation.x = Math.PI * 0.5; hole.position.set(-0.04, 0.15, 0);
                const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), trimMat); flame.position.set(0.10, 0.26, 0);
                mesh.add(tag, hole, flame);
            }

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.48, 0.032, 6, 20),
                new THREE.MeshBasicMaterial({ color: spec.color })
            );
            ring.rotation.x = Math.PI * 0.5;
            ring.position.y = -0.25;
            const beam = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.28, 1.5, 10, 1, true),
                new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
            );
            beam.position.y = 0.25;
            mesh.add(ring, beam);
            BO.World.scene.add(mesh);

            this.powerUps.push({
                id: spec.id,
                label: spec.label,
                color: spec.color,
                mesh,
                ring,
                pos: new THREE.Vector3(x, y + 0.92, z),
                life: BO.Player.zombiePerks.has('long_life') ? 28.0 : 16.0
            });
        }

        _collectPowerUp(pu) {
            BO.Sound.playPowerUp();
            BO.Events.emit('hud:banner', { title: pu.label, sub: 'POWER-UP ACTIVATED', color: '#' + pu.color.toString(16).padStart(6, '0') });

            const durMult = BO.Mods.fx(this.modifiers, 'zombies').powerupDurMult || 1;
            if (pu.id === 'max_ammo') BO.Player.refillAllAmmo();
            else if (pu.id === 'insta_kill') this.instaKillTimer = 30.0 * durMult;
            else if (pu.id === 'double_points') this.doublePointsTimer = 30.0 * durMult;
            else if (pu.id === 'fire_sale') this.fireSaleTimer = 30.0 * durMult;
            else if (pu.id === 'carpenter') {
                for (const inter of BO.World.interactives) {
                    if (inter.type === 'window') {
                        inter.planksRemaining = inter.maxPlanks;
                        inter.plankMeshes.forEach((m) => (m.visible = true));
                    }
                }
                this.addPoints(200, 'CARPENTER');
            } else if (pu.id === 'nuke') {
                BO.FX.spawnExplosion(BO.Player.pos.clone(), 12, 0xfef08a);
                BO.Sound.playExplosion(1.0);
                for (const z of this.zombies) {
                    if (z.alive && !z.isBoss) {
                        z.takeDamage(99999, 'torso', false, null, 'explosive');
                        this.kills++;
                        BO.Progression.recordStat('zombiesKills', 1);
                    }
                }
                this.addPoints(400, 'NUKE');
            }
        }

        startExfil(fromNetwork = false) {
            if (!this.exfilAvailable || this.exfilActive) return;
            this.exfilActive = true;
            this.state = 'exfil';
            this.exfilTimer = 75.0;
            const ep = BO.World.mapData.exfilPoint || { x: 0, y: 0, z: 0 };
            BO.World.spawnExfilBeacon(ep.x, ep.z);
            BO.Events.emit('hud:banner', { title: 'EXFIL INITIATED', sub: 'CLEAR ALL ZOMBIES & REACH GREEN SMOKE LZ!', color: '#22c55e' });
            BO.Sound.playPowerOn();
            if (!fromNetwork && BO.Net && BO.Net.active) {
                BO.Net.broadcast({
                    type: 'z_world_event',
                    event: { kind: 'exfil_start', actor: BO.Save.data.callsign || 'SQUAD' }
                });
            }
        }

        tryInteract() {
            const P = BO.Player;
            if (!P.alive) return;

            // Check if a downed co-op teammate is nearby first!
            if (BO.Net && BO.Net.active) {
                const downed = BO.Net.getDownedTeammateNear(P.pos);
                if (downed) {
                    BO.Net.reviveTeammate(downed.peerId);
                    return;
                }
            }

            const inter = this.activePrompt;
            if (!inter) return;

            if (inter.type === 'z_sniper_tower_zip') {
                P.rideState = {
                    kind: 'arc',
                    sx: P.pos.x, sy: P.pos.y, sz: P.pos.z,
                    dx: inter.destX, dy: inter.destY, dz: inter.destZ,
                    arcHeight: 2.2, duration: 0.55, t: 0
                };
                BO.Sound.playTrapZap();
                BO.Events.emit('hud:toast', { text: '🗼 ZIPPED TO MINI SNIPER TOWER!', color: '#38bdf8' });
                return;
            }
            if (inter.type === 'door') {
                const d = inter.data;
                if (d.requiresPower && !BO.World.powerOn) {
                    BO.Sound.playEmptyClick();
                    BO.Events.emit('hud:toast', { text: 'POWER MUST BE RESTORED FIRST', color: '#ef4444' });
                    return;
                }
                if (this.points < d.cost) { BO.Sound.playEmptyClick(); return; }
                this.points -= d.cost;
                if (P.zombiePerks.has('gate_share')) this.points += Math.floor(d.cost * 0.2);
                BO.World.openDoor(inter);
                BO.Events.emit('hud:toast', { text: `${d.label} UNLOCKED`, color: '#f5a623' });
                if (BO.Net && BO.Net.active) {
                    BO.Net.broadcast({
                        type: 'z_world_event',
                        event: { kind: 'open_door', doorId: d.id, actor: BO.Save.data.callsign || 'SQUAD' }
                    });
                }
            } else if (inter.type === 'window') {
                const planks = P.zombiePerks.has('quick_board') ? 2 : 1;
                for (let i = 0; i < planks && inter.planksRemaining < inter.maxPlanks; i++) {
                    const pm = inter.plankMeshes[inter.planksRemaining];
                    if (pm) pm.visible = true;
                    inter.planksRemaining++;
                    this.addPoints(P.zombiePerks.has('repair_rate') ? 25 : 10, 'REPAIR');
                    BO.Sound.playReload('in');
                }
            } else if (inter.type === 'power_switch') {
                if (!inter.activated) {
                    BO.World.activatePower();
                    BO.Events.emit('hud:banner', { title: 'POWER RESTORED', sub: 'PERKS, TELEPORTER & PACK-A-PUNCH ONLINE', color: '#38bdf8' });
                    if (BO.Net && BO.Net.active) {
                        BO.Net.broadcast({
                            type: 'z_world_event',
                            event: { kind: 'power_on', actor: BO.Save.data.callsign || 'SQUAD' }
                        });
                    }
                }
            } else if (inter.type === 'wall_buy') {
                const wb = inter.data;
                const owned = P.weapons.find((w) => w.cfg.id === wb.weaponId);
                const cost = owned ? (owned.isPaP ? 4500 : wb.ammoCost) : wb.cost;
                if (this.points < cost) { BO.Sound.playEmptyClick(); return; }
                this.points -= cost;
                if (owned) {
                    owned.reserve = owned.stats.reserveMax;
                    owned.mag = owned.stats.magSize;
                    BO.Sound.playReload('in');
                } else {
                    P.giveWeapon(wb.weaponId, false, false);
                    BO.Sound.playUIClick();
                }
            } else if (inter.type === 'armor_wall') {
                const cost = inter.data.cost;
                if (this.points < cost || (P.armor >= P.maxArmor && P.armorReservePlates >= 3)) { BO.Sound.playEmptyClick(); return; }
                this.points -= cost;
                P.armor = P.maxArmor;
                P.armorReservePlates = 3;
                BO.Sound.playPerkBuy();
                BO.Events.emit('hud:toast', { text: 'FULL 3-PLATE ARMOR RESTORED', color: '#38bdf8' });
            } else if (inter.type === 'perk') {
                const pk = inter.data;
                if (!this.perksAllowed || P.zombiePerks.size >= 8) { BO.Sound.playEmptyClick(); return; }
                if (pk.requiresPower && !BO.World.powerOn) {
                    BO.Sound.playEmptyClick();
                    BO.Events.emit('hud:toast', { text: 'TURN ON POWER TO USE PERK MACHINE', color: '#ef4444' });
                    return;
                }
                const zFx = BO.Mods.fx(this.modifiers, 'zombies');
                const perkCost = this.modifiers.freePerks ? 0 : Math.round(pk.cost * BO.Mods.priceMult(this.modifiers, 'perk'));
                if (P.zombiePerks.has(pk.id) || this.points < perkCost) { BO.Sound.playEmptyClick(); return; }
                this.points -= perkCost;
                if (zFx.perkHpCost && P.hp > 15) P.hp = Math.max(15, P.hp * (1 - zFx.perkHpCost));
                P.zombiePerks.add(pk.id);
                P.applyPerkStats();
                BO.Progression.recordStat('zombiesPerksBought', 1);
                BO.Sound.playPerkBuy();
                BO.Events.emit('hud:toast', { text: `${pk.name.toUpperCase()} CONSUMED!`, color: pk.color });
            } else if (inter.type === 'mystery_box') {
                if (BO.Cheats && BO.Cheats.isActive('wondernomore') && BO.Menus && BO.Menus.openMysteryBoxPicker) {
                    BO.Sound.playUIClick();
                    BO.Menus.openMysteryBoxPicker();
                    return;
                }
                const zFx = BO.Mods.fx(this.modifiers, 'zombies');
                const cost = Math.round((this.fireSaleTimer > 0 ? 10 : 950) * BO.Mods.priceMult(this.modifiers, 'box'));
                if (inter.state === 'idle') {
                    if (this.points < cost) { BO.Sound.playEmptyClick(); return; }
                    this.points -= cost;
                    if (P.zombiePerks.has('box_credit')) this.points += Math.min(150, cost);
                    this.boxSpins++;
                    BO.Progression.recordStat('zombiesBoxSpins', 1);
                    inter.state = 'rolling';
                    inter.rollTimer = 2.6;
                    inter.lidPivot.rotation.x = -1.15;
                    BO.Sound.playMysteryBoxJingle();
                } else if (inter.state === 'ready' && inter.rolledWeaponId) {
                    P.giveWeapon(inter.rolledWeaponId, false, false);
                    if (zFx.boxRestoresArmor) { P.armor = P.maxArmor; P.armorReservePlates = Math.max(P.armorReservePlates || 0, 1); }
                    if (zFx.bonusDropReserve && P.activeWeapon) P.activeWeapon.reserve = Math.round(P.activeWeapon.reserve * (1 + zFx.bonusDropReserve));
                    this._clearBoxPreview(inter);
                    inter.state = 'idle';
                    inter.lidPivot.rotation.x = 0;
                    BO.Sound.playUIClick();
                }
            } else if (inter.type === 'grenade_wall') {
                if (this.points < inter.cost) { BO.Sound.playEmptyClick(); return; }
                this.points -= inter.cost;
                P.lethalCount = Math.max(P.lethalCount, 4);
                BO.Sound.playReload('in');
                BO.Events.emit('hud:toast', { text: 'FRAG GRENADES REFILLED (4)!', color: '#f59e0b' });
            } else if (inter.type === 'sniper_cabinet') {
                const owned = P.weapons.find((w) => w.cfg.id === inter.weaponId);
                const cost = owned ? 750 : inter.cost;
                if (this.points < cost) { BO.Sound.playEmptyClick(); return; }
                this.points -= cost;
                if (!inter.opened && inter.doorPivot) {
                    inter.opened = true;
                    inter.doorPivot.rotation.y = -1.65;
                }
                if (owned) {
                    owned.reserve = owned.stats.reserveMax;
                    owned.mag = owned.stats.magSize;
                    BO.Sound.playReload('in');
                } else {
                    P.giveWeapon(inter.weaponId, false, false);
                    BO.Sound.playPerkBuy();
                }
                BO.Events.emit('hud:toast', { text: 'SNIPER CABINET OPENED — SCOPED RIFLE ACQUIRED!', color: '#38bdf8' });
            } else if (inter.type === 'telephone') {
                BO.Sound.playTelephoneEasterEgg();
                if (!inter.triggered) {
                    inter.triggered = true;
                    this.addPoints(500, 'EASTER EGG');
                }
                BO.Events.emit('hud:banner', {
                    title: 'COMM ROOM TELEPHONE',
                    sub: '♪ "THE ONE" TRANSMISSION — +500 PTS ♪',
                    color: '#c084fc'
                });
            } else if (inter.type === 'trap') {
                const tr = inter.trap;
                if (tr.requiresPower && BO.World.mapData.powerSwitch && !BO.World.powerOn) {
                    BO.Sound.playEmptyClick();
                    BO.Events.emit('hud:toast', { text: 'TURN ON POWER TO USE TRAP', color: '#ef4444' });
                    return;
                }
                if (tr.activeTimer > 0 || tr.cooldownTimer > 0) { BO.Sound.playEmptyClick(); return; }
                if (this.points < tr.cost) { BO.Sound.playEmptyClick(); return; }
                this.points -= tr.cost;
                if (P.zombiePerks.has('trap_manager')) this.points += Math.floor(tr.cost * 0.2);
                if (tr.kind === 'zipline') {
                    tr.cooldownTimer = tr.cooldownDuration;
                    tr.lamp.material.color.setHex(0xef4444);
                    P.rideState = {
                        kind: 'arc',
                        sx: P.pos.x, sy: P.pos.y, sz: P.pos.z,
                        dx: tr.destX, dy: tr.destY, dz: tr.destZ,
                        arcHeight: 1.0, duration: 2.1, t: 0,
                        unlockZone: tr.destZone
                    };
                    BO.Sound.playTrapZap();
                    BO.Events.emit('hud:toast', { text: 'ZIPLINE ENGAGED → CENTRAL HUT!', color: '#38bdf8' });
                } else {
                    BO.World.activateTrap(tr);
                    BO.Events.emit('hud:toast', { text: `${tr.label} ACTIVATED!`, color: '#f97316' });
                }
            } else if (inter.type === 'elevator_ride') {
                const el = inter.elevator;
                if (el.moving || this.points < inter.cost) { BO.Sound.playEmptyClick(); return; }
                this.points -= inter.cost;
                if (P.zombiePerks.has('rail_pass')) this.points += Math.floor(inter.cost * 0.3);
                const atBottom = Math.abs(el.cabY - el.bottomY) < 1.2;
                el.targetY = atBottom ? el.topY : el.bottomY;
                el.moving = true;
                P.rideState = { kind: 'elevator', elevator: el };
                BO.Sound.playElevatorHum();
                BO.Events.emit('hud:toast', { text: `${el.label} MOVING...`, color: '#38bdf8' });
            } else if (inter.type === 'elevator_call') {
                const el = inter.elevator;
                if (el.moving || Math.abs(el.cabY - inter.callFloorY) < 0.8) return;
                el.targetY = inter.callFloorY;
                el.moving = true;
                BO.Sound.playElevatorHum();
                BO.Events.emit('hud:toast', { text: `${el.label} CALLED`, color: '#94a3b8' });
            } else if (inter.type === 'defcon_switch') {
                if (BO.World.mapData.powerSwitch && !BO.World.powerOn) {
                    BO.Sound.playEmptyClick();
                    BO.Events.emit('hud:toast', { text: 'TURN ON BASEMENT POWER FIRST', color: '#ef4444' });
                    return;
                }
                const sw = inter.defconObj;
                if (sw.activated) return;
                BO.World.setDefconSwitchState(sw, true);
                this.mapQuest.fiveDefcon = Math.min(5, this.mapQuest.fiveDefcon + 1);
                BO.Sound.playDefconBeep(this.mapQuest.fiveDefcon);
                if (this.mapQuest.fiveDefcon >= 5) {
                    BO.World.setFivePanicDoorOpen(true);
                    BO.Events.emit('hud:banner', {
                        title: 'DEFCON 5 ACTIVE!',
                        sub: 'PANIC ROOM UNLOCKED — ENTER WAR ROOM TELEPORTER FOR PACK-A-PUNCH!',
                        color: '#22c55e'
                    });
                } else {
                    BO.Events.emit('hud:toast', {
                        text: `DEFCON LEVEL ${this.mapQuest.fiveDefcon} ENGAGED (${this.mapQuest.fiveDefcon - 1}/4 SWITCHES)`,
                        color: '#f59e0b'
                    });
                }
            } else if (inter.type === 'mainframe_pad') {
                if (!this.mapQuest.derRieseLinkActive) { BO.Sound.playEmptyClick(); return; }
                const tpKey = this.mapQuest.derRieseLinkActive;
                const tpIdx = ['Z-A', 'Z-B', 'Z-C'].indexOf(tpKey);
                this.mapQuest.derRieseLinked.add(tpKey);
                this.mapQuest.derRieseLinkActive = null;
                this.mapQuest.derRieseLinkTimer = 0;
                if (tpIdx !== -1) BO.World.setDerRieseBulb(tpIdx, true);
                this._spawnPowerUp(inter.x, 0.2, inter.z - 2.0, null);
                BO.Sound.playPaPChime();
                if (this.mapQuest.derRieseLinked.size >= 3) {
                    BO.World.setDerRiesePapUnlocked(true);
                    BO.Events.emit('hud:banner', {
                        title: 'ALL 3 TELEPORTERS LINKED!',
                        sub: 'PACK-A-PUNCH STEEL SHUTTER IS NOW OPEN AT MAINFRAME!',
                        color: '#c084fc'
                    });
                } else {
                    BO.Events.emit('hud:banner', {
                        title: `TELEPORTER ${tpKey} LINKED!`,
                        sub: `${this.mapQuest.derRieseLinked.size}/3 LINKED TO MAINFRAME`,
                        color: '#22c55e'
                    });
                }
            } else if (inter.type === 'kino_link_pad') {
                if (!this.mapQuest.kinoLinkPending) { BO.Sound.playEmptyClick(); return; }
                this.mapQuest.kinoLinkPending = false;
                this.mapQuest.kinoLinked = true;
                BO.Sound.playPaPChime();
                BO.Events.emit('hud:banner', {
                    title: 'STAGE TELEPORTER LINKED!',
                    sub: 'RETURN TO STAGE TELEPORTER TO ENTER PROJECTION BOOTH PACK-A-PUNCH!',
                    color: '#22c55e'
                });
            } else if (inter.type === 'lunar_lander') {
                if (BO.World.mapData.powerSwitch && !BO.World.powerOn) {
                    BO.Sound.playEmptyClick();
                    BO.Events.emit('hud:toast', { text: 'TURN ON POWER TO USE LUNAR LANDER', color: '#ef4444' });
                    return;
                }
                if (this.points < inter.cost || P.rideState) { BO.Sound.playEmptyClick(); return; }
                this.points -= inter.cost;
                this.mapQuest.ascensionLandersRidden.add(inter.code);
                const codeIdx = ['Ф', 'Д', 'Ч'].indexOf(inter.code);
                if (codeIdx !== -1) BO.World.setAscensionLanderBulb(codeIdx, true);
                P.rideState = {
                    kind: 'arc',
                    sx: P.pos.x, sy: P.pos.y, sz: P.pos.z,
                    dx: inter.data.destX, dy: inter.data.destY || 2.2, dz: inter.data.destZ,
                    arcHeight: 4.5, duration: 2.6, t: 0, unlockZone: 'spawn'
                };
                BO.Sound.playRocketLaunch();
                const cnt = this.mapQuest.ascensionLandersRidden.size;
                BO.Events.emit('hud:banner', {
                    title: `LUNAR LANDER ${inter.code} LAUNCHED!`,
                    sub: cnt >= 3 ? '3/3 LANDERS COMPLETE! PRESS ROCKET LAUNCH BUTTON BY POWER!' : `${cnt}/3 LUNAR LANDERS FLOWN TO CENTRIFUGE`,
                    color: '#f59e0b'
                });
            } else if (inter.type === 'rocket_launch') {
                if (BO.World.mapData.powerSwitch && !BO.World.powerOn) {
                    BO.Sound.playEmptyClick();
                    BO.Events.emit('hud:toast', { text: 'TURN ON POWER FIRST', color: '#ef4444' });
                    return;
                }
                if (this.mapQuest.ascensionLandersRidden.size < 3) {
                    BO.Sound.playEmptyClick();
                    BO.Events.emit('hud:toast', { text: `RIDE ALL 3 LUNAR LANDERS FIRST (${this.mapQuest.ascensionLandersRidden.size}/3)`, color: '#ef4444' });
                    return;
                }
                if (!this.mapQuest.ascensionRocketLaunched) {
                    this.mapQuest.ascensionRocketLaunched = true;
                    BO.World.launchAscensionRocket();
                    BO.Events.emit('hud:banner', {
                        title: 'SOYUZ ROCKET LIFTOFF!',
                        sub: 'BLAST DOORS OPEN — PACK-A-PUNCH UNLOCKED BELOW LAUNCH PAD!',
                        color: '#c084fc'
                    });
                }
            } else if (inter.type === 'pack_a_punch') {
                if (inter.locked) {
                    BO.Sound.playEmptyClick();
                    BO.Events.emit('hud:toast', { text: inter.lockReason || 'COMPLETE MAP QUEST TO OPEN PACK-A-PUNCH', color: '#ef4444' });
                    return;
                }
                if (BO.World.mapData.powerSwitch && !BO.World.powerOn) {
                    BO.Sound.playEmptyClick();
                    BO.Events.emit('hud:toast', { text: 'POWER MUST BE ON TO PACK-A-PUNCH', color: '#ef4444' });
                    return;
                }
                const w = P.activeWeapon;
                const curTier = w ? (w.papTier || 0) : 3;
                const basePap = curTier === 0 ? 5000 : (curTier === 1 ? 10000 : 15000);
                const papCost = Math.round(((this.mapQuest.fiveBonfireTimer > 0 && curTier === 0) ? 1000 : basePap) * BO.Mods.priceMult(this.modifiers, 'pap'));
                if (!w || curTier >= 3 || this.points < papCost) { BO.Sound.playEmptyClick(); return; }
                this.points -= papCost;
                if (P.zombiePerks.has('forge_credit')) this.points += Math.floor(papCost * 0.1);
                P.packAPunchActiveWeapon();
                BO.Progression.recordStat('zombiesPaPUsed', 1);
                BO.Progression.awardMedal('pap_upgrade');
                BO.Sound.playPaPChime();
                BO.Events.emit('hud:banner', { title: `PACK-A-PUNCH TIER ${P.activeWeapon.papTier}!`, sub: P.activeWeapon.stats.name.toUpperCase(), color: '#c084fc' });
            } else if (inter.type === 'teleporter') {
                this._handleTeleporterInteract(inter, P);
            }
            if (BO.Cheats && BO.Cheats.isActive('infmoney')) {
                this.points = 99999;
            }
        }

        _handleTeleporterInteract(inter, P) {
            const d = inter.data;
            if (d.requiresPower !== false && BO.World.mapData.powerSwitch && !BO.World.powerOn) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: `${d.label || 'TELEPORTER'} REQUIRES POWER`, color: '#ef4444' });
                return;
            }
            if (d.mode === 'der_riese_link') {
                if (!this.mapQuest.derRieseLinked.has(d.tpCode)) {
                    this.mapQuest.derRieseLinkActive = d.tpCode;
                    this.mapQuest.derRieseLinkTimer = 30.0;
                    BO.Sound.playDefconBeep(4);
                    BO.Events.emit('hud:banner', {
                        title: `LINK ${d.tpCode} STARTED!`,
                        sub: 'SPRINT BACK TO MAINFRAME PAD IN 30 SECONDS TO COMPLETE LINK!',
                        color: '#38bdf8'
                    });
                    return;
                }
            } else if (d.mode === 'kino_stage') {
                if (this.mapQuest.kinoCooldown > 0) {
                    BO.Sound.playEmptyClick();
                    BO.Events.emit('hud:toast', { text: `TELEPORTER COOLING DOWN (${Math.ceil(this.mapQuest.kinoCooldown)}s)`, color: '#ef4444' });
                    return;
                }
                if (!this.mapQuest.kinoLinked) {
                    this.mapQuest.kinoLinkPending = true;
                    BO.Sound.playDefconBeep(3);
                    BO.Events.emit('hud:banner', {
                        title: 'LINK STAGE TELEPORTER!',
                        sub: 'RUN TO LOBBY LINK PAD & PRESS [E], THEN RETURN TO STAGE!',
                        color: '#38bdf8'
                    });
                    return;
                }
                this.mapQuest.kinoBoothTimer = 30.0;
                this.mapQuest.kinoLinked = false;
            } else if (d.mode === 'five_war_room') {
                if (this.mapQuest.fiveDefcon >= 5) {
                    this.mapQuest.fiveInPanicRoom = true;
                    this.mapQuest.fivePanicTimer = 30.0;
                    P.pos.set(d.panicDestX, d.panicDestY || 6.0, d.panicDestZ);
                    P.vel.set(0, 0, 0);
                    BO.Sound.playPaPChime();
                    BO.FX.spawnParticles(P.pos.clone().add(new THREE.Vector3(0, 1, 0)), 22, 0xc084fc, 5, 2, 0.7, 1.5);
                    BO.Events.emit('hud:banner', { title: 'PANIC ROOM REACHED!', sub: '30 SECONDS BEFORE TELEPORTER RETURN TO WAR ROOM!', color: '#c084fc' });
                    return;
                }
            }

            if (this.points < inter.cost) { BO.Sound.playEmptyClick(); return; }
            this.points -= inter.cost;
            if (P.zombiePerks.has('rail_pass')) this.points += Math.floor(inter.cost * 0.3);
            P.pos.set(d.destX, d.destY || 0, d.destZ);
            P.vel.set(0, 0, 0);
            if (d.zoneRequired) BO.World.unlockedZones.add(d.zoneRequired);
            if (d.mode === 'kino_booth_return') {
                this.mapQuest.kinoBoothTimer = 0;
                this.mapQuest.kinoCooldown = 18.0;
            }
            if (d.mode === 'five_exit_panic') {
                this.mapQuest.fiveInPanicRoom = false;
            }
            BO.Sound.playPaPChime();
            BO.FX.spawnParticles(P.pos.clone().add(new THREE.Vector3(0, 1, 0)), 20, 0x38bdf8, 5, 2, 0.7, 1.5);
        }

        _clearBoxPreview(box) {
            if (box.previewMesh) { box.previewAnchor.remove(box.previewMesh); box.previewMesh = null; }
        }

        _setBoxPreviewWeapon(box, weaponId) {
            this._clearBoxPreview(box);
            const built = BO.WeaponMesh.buildWeapon(weaponId, {}, 'default', false, false);
            built.root.scale.setScalar(1.35);
            box.previewAnchor.add(built.root);
            box.previewMesh = built.root;
        }

        _updateMysteryBox(dt) {
            const box = BO.World.mysteryBoxObj;
            if (!box) return;
            box.beacon.rotation.y += dt * 1.4;
            if (box.state === 'rolling') {
                box.rollTimer -= dt;
                if (Math.floor(box.rollTimer * 6) !== Math.floor((box.rollTimer + dt) * 6)) {
                    const randW = BO.Math.pick(BO.WeaponsData.ORDER);
                    this._setBoxPreviewWeapon(box, randW);
                    box.rolledWeaponId = randW;
                }
                if (box.previewMesh) box.previewMesh.rotation.y += dt * 4;
                if (box.rollTimer <= 0) {
                    const padCount = BO.World.mapData.mysteryBoxPads ? BO.World.mapData.mysteryBoxPads.length : 1;
                    if (padCount > 1 && this.boxSpins >= 6 && this.fireSaleTimer <= 0 && Math.random() < 0.18) {
                        this._clearBoxPreview(box);
                        box.state = 'idle';
                        box.lidPivot.rotation.x = 0;
                        this.points += 950;
                        BO.Sound.playTeddyLaugh();
                        BO.Events.emit('hud:banner', { title: 'BYE BYE!', sub: 'MYSTERY BOX RELOCATED', color: '#f43f5e' });
                        BO.World.moveMysteryBox(box.padIndex + 1);
                        return;
                    }
                    const roll = BO.WeaponsData.rollMysteryBox();
                    if (roll.outcome === 'pokeball') {
                        this._clearBoxPreview(box);
                        box.state = 'idle';
                        box.lidPivot.rotation.x = 0;
                        box.rolledWeaponId = null;
                        BO.Player.tacticalId = 'pokeball';
                        BO.Player.tacticalCount = Math.max(BO.Player.tacticalCount, 0) + 2;
                        BO.Combat.summonRandomPokemon(new THREE.Vector3(box.x, box.y, box.z));
                        return;
                    }
                    if (roll.outcome === 'nothing' || !roll.weaponId) {
                        this._clearBoxPreview(box);
                        box.state = 'idle';
                        box.lidPivot.rotation.x = 0;
                        box.rolledWeaponId = null;
                        BO.Sound.playTeddyLaugh();
                        BO.Events.emit('hud:banner', {
                            title: 'NOTHING! (5% ODDS)',
                            sub: 'THE MYSTERY BOX CAME UP EMPTY!',
                            color: '#ef4444'
                        });
                        return;
                    }
                    box.rolledWeaponId = roll.weaponId;
                    this._setBoxPreviewWeapon(box, roll.weaponId);
                    box.state = 'ready';
                    box.readyTimer = 9.0;
                    const wSpec = BO.WeaponsData.get(roll.weaponId);
                    const col = roll.outcome === 'magic' ? '#c084fc' : (roll.outcome.includes('uncommon') ? '#38bdf8' : '#f5a623');
                    BO.Events.emit('hud:toast', {
                        text: `MYSTERY BOX [${roll.tierLabel.toUpperCase()}]: ${wSpec.name.toUpperCase()}`,
                        color: col
                    });
                }
            } else if (box.state === 'ready') {
                box.readyTimer -= dt;
                if (box.previewMesh) box.previewMesh.rotation.y += dt * 2;
                if (box.readyTimer <= 0) {
                    this._clearBoxPreview(box);
                    box.state = 'idle';
                    box.lidPivot.rotation.x = 0;
                    box.rolledWeaponId = null;
                }
            }
        }

        _updateNearestPrompt() {
            const P = BO.Player;
            let best = null, bestDist = Infinity;
            for (const inter of BO.World.interactives) {
                if (inter.type === 'door' && inter.opened) continue;
                if (inter.type === 'window' && inter.planksRemaining >= inter.maxPlanks) continue;
                if (inter.type === 'power_switch' && inter.activated) continue;
                const d = BO.Math.dist3D(P.pos.x, P.pos.y + 1, P.pos.z, inter.x, inter.y, inter.z);
                if (d <= inter.radius && d < bestDist) { bestDist = d; best = inter; }
            }
            this.activePrompt = best;
        }

        getPromptText() {
            if (BO.Net && BO.Net.active && BO.Player) {
                const downed = BO.Net.getDownedTeammateNear(BO.Player.pos);
                if (downed) {
                    return { text: `[E] REVIVE ${downed.callsign} (+150 PTS)`, affordable: true };
                }
            }
            const inter = this.activePrompt;
            if (!inter) {
                if (this.exfilAvailable && !this.exfilActive && this.state !== 'ended') {
                    return { text: '[H] CALL HELICOPTER EXFIL (BONUS XP) • [B] BUILD FORTIFICATIONS', affordable: true };
                }
                return null;
            }
            if (inter.type === 'z_sniper_tower_zip') {
                return { text: '[E] ZIP UP TO DEPLOYED MINI SNIPER TOWER', affordable: true };
            }
            const P = BO.Player;
            const armoryKey = BO.Settings.getKeybinds().armory.replace(/^(Key|Digit)/, '');
            if (inter.type === 'door') {
                if (inter.data.requiresPower && !BO.World.powerOn) return { text: `${inter.data.label} — TURN ON POWER FIRST`, affordable: false };
                return { text: `[E] OPEN ${inter.data.label} (${inter.data.cost} PTS)`, affordable: this.points >= inter.data.cost };
            }
            if (inter.type === 'window') return { text: `[E] REBUILD BARRICADE (+10 PTS)`, affordable: true };
            if (inter.type === 'power_switch') return { text: `[E] FLIP MAIN POWER SWITCH`, affordable: true };
            if (inter.type === 'wall_buy') {
                const wb = inter.data;
                const spec = BO.WeaponsData.get(wb.weaponId);
                const owned = P.weapons.find((w) => w.cfg.id === wb.weaponId);
                const cost = owned ? (owned.isPaP ? 4500 : wb.ammoCost) : wb.cost;
                return { text: owned ? `[E] BUY ${spec.shortName} AMMO (${cost} PTS)` : `[E] BUY ${spec.shortName} (${cost} PTS)`, affordable: this.points >= cost };
            }
            if (inter.type === 'armor_wall') return { text: `[E] REFILL ARMOR PLATES (${inter.data.cost} PTS)`, affordable: this.points >= inter.data.cost };
            if (inter.type === 'perk') {
                const pk = inter.data;
                if (pk.requiresPower && !BO.World.powerOn) return { text: `${pk.name.toUpperCase()} — TURN ON POWER FIRST`, affordable: false };
                if (P.zombiePerks.has(pk.id)) return { text: `${pk.name.toUpperCase()} ALREADY ACTIVE`, affordable: false };
                if (!this.perksAllowed) return { text: 'PERKS DISABLED', affordable: false };
                if (P.zombiePerks.size >= 8) return { text: 'PERK LIMIT REACHED', affordable: false };
                const cost = this.modifiers.freePerks ? 0 : Math.round(pk.cost * BO.Mods.priceMult(this.modifiers, 'perk'));
                return { text: `[E] DRINK ${pk.name.toUpperCase()} (${cost} PTS) — ${pk.desc}` +
                    (BO.Superpowers.enabled ? ` • [${armoryKey}] SUPERPOWERS` : ''), affordable: this.points >= cost };
            }
            if (inter.type === 'mystery_box') {
                if (BO.Cheats && BO.Cheats.isActive('wondernomore')) {
                    return { text: '[E] MYSTERY BOX — PICK ANY OF 70 WEAPONS (WONDER NO MORE)', affordable: true };
                }
                const cost = this.fireSaleTimer > 0 ? 10 : 950;
                if (inter.state === 'idle') return { text: `[E] MYSTERY BOX (${cost} PTS) • 60% COMMON / 15% UNCOMMON / 15% MELEE / 5% MAGIC`, affordable: this.points >= cost };
                if (inter.state === 'ready' && inter.rolledWeaponId) return { text: `[E] TAKE ${BO.WeaponsData.get(inter.rolledWeaponId).shortName}`, affordable: true };
                return { text: 'MYSTERY BOX ROLLING...', affordable: true };
            }
            if (inter.type === 'grenade_wall') return { text: `[E] BUY FRAG GRENADES (${inter.cost} PTS)`, affordable: this.points >= inter.cost };
            if (inter.type === 'sniper_cabinet') {
                const owned = P.weapons.find((w) => w.cfg.id === inter.weaponId);
                const cost = owned ? 750 : inter.cost;
                return { text: owned ? `[E] SNIPER CABINET AMMO (${cost} PTS)` : `[E] OPEN SNIPER CABINET — SCOPED RIFLE (${cost} PTS)`, affordable: this.points >= cost };
            }
            if (inter.type === 'telephone') return { text: `[E] ANSWER COMM ROOM TELEPHONE`, affordable: true };
            if (inter.type === 'trap') {
                const tr = inter.trap;
                if (tr.requiresPower && BO.World.mapData.powerSwitch && !BO.World.powerOn) return { text: `${tr.label} — TURN ON POWER FIRST`, affordable: false };
                if (tr.activeTimer > 0) return { text: `${tr.label} ACTIVE (${tr.activeTimer.toFixed(0)}s)`, affordable: false };
                if (tr.cooldownTimer > 0) return { text: `${tr.label} COOLING DOWN (${tr.cooldownTimer.toFixed(0)}s)`, affordable: false };
                return { text: `[E] ACTIVATE ${tr.label} (${tr.cost} PTS)`, affordable: this.points >= tr.cost };
            }
            if (inter.type === 'elevator_ride') {
                const el = inter.elevator;
                if (el.moving) return { text: `${el.label} IN MOTION...`, affordable: false };
                return { text: `[E] RIDE ${el.label} (${inter.cost} PTS)`, affordable: this.points >= inter.cost };
            }
            if (inter.type === 'elevator_call') {
                const el = inter.elevator;
                if (el.moving) return { text: `${el.label} IN MOTION...`, affordable: false };
                if (Math.abs(el.cabY - inter.callFloorY) < 0.8) return { text: `${el.label} ALREADY HERE — STEP INSIDE`, affordable: true };
                return { text: `[E] CALL ${el.label} (FREE)`, affordable: true };
            }
            if (inter.type === 'defcon_switch') {
                if (BO.World.mapData.powerSwitch && !BO.World.powerOn) return { text: `DEFCON SWITCH — TURN ON POWER FIRST`, affordable: false };
                if (inter.defconObj.activated) return { text: `DEFCON SWITCH ACTIVE`, affordable: false };
                return { text: `[E] FLIP DEFCON SWITCH (LEVEL ${this.mapQuest.fiveDefcon} → ${this.mapQuest.fiveDefcon + 1})`, affordable: true };
            }
            if (inter.type === 'mainframe_pad') {
                if (!this.mapQuest.derRieseLinkActive) return { text: `MAINFRAME LINK PAD (${this.mapQuest.derRieseLinked.size}/3 TELEPORTERS LINKED)`, affordable: true };
                return { text: `[E] LINK TELEPORTER ${this.mapQuest.derRieseLinkActive} NOW (${this.mapQuest.derRieseLinkTimer.toFixed(1)}s)!`, affordable: true };
            }
            if (inter.type === 'kino_link_pad') {
                if (!this.mapQuest.kinoLinkPending) return { text: `LOBBY LINK PAD — INITIALIZE STAGE TELEPORTER FIRST`, affordable: true };
                return { text: `[E] LINK STAGE TELEPORTER TO MAINFRAME`, affordable: true };
            }
            if (inter.type === 'lunar_lander') {
                if (BO.World.mapData.powerSwitch && !BO.World.powerOn) return { text: `LUNAR LANDER ${inter.code} — TURN ON POWER FIRST`, affordable: false };
                return { text: `[E] LAUNCH ${inter.label} (${inter.cost} PTS)`, affordable: this.points >= inter.cost };
            }
            if (inter.type === 'rocket_launch') {
                if (BO.World.mapData.powerSwitch && !BO.World.powerOn) return { text: `ROCKET CONSOLE — TURN ON POWER FIRST`, affordable: false };
                if (this.mapQuest.ascensionRocketLaunched) return { text: `SOYUZ ROCKET LAUNCHED — PACK-A-PUNCH OPEN`, affordable: false };
                if (this.mapQuest.ascensionLandersRidden.size < 3) return { text: `ROCKET CONSOLE (${this.mapQuest.ascensionLandersRidden.size}/3 LANDERS FLOWN FIRST)`, affordable: false };
                return { text: `[E] LAUNCH SOYUZ ROCKET (OPEN PACK-A-PUNCH)!`, affordable: true };
            }
            if (inter.type === 'pack_a_punch') {
                if (inter.locked) return { text: inter.lockReason || `PACK-A-PUNCH LOCKED`, affordable: false };
                if (BO.World.mapData.powerSwitch && !BO.World.powerOn) return { text: `PACK-A-PUNCH — TURN ON POWER FIRST`, affordable: false };
                const w = P.activeWeapon;
                const curTier = w ? (w.papTier || 0) : 3;
                if (curTier >= 3) return { text: `${w.stats.name.toUpperCase()} MAXED (TIER III)`, affordable: false };
                const basePap = curTier === 0 ? 5000 : (curTier === 1 ? 10000 : 15000);
                const papCost = (this.mapQuest.fiveBonfireTimer > 0 && curTier === 0) ? 1000 : basePap;
                return { text: `[E] PACK-A-PUNCH TIER ${curTier + 1} (${papCost} PTS) — SUPERCHARGES ${w.stats.shortName}`, affordable: this.points >= papCost };
            }
            if (inter.type === 'teleporter') {
                const d = inter.data;
                const lbl = d.label || 'TELEPORT';
                if (d.requiresPower !== false && BO.World.mapData.powerSwitch && !BO.World.powerOn) return { text: `${lbl} — TURN ON POWER FIRST`, affordable: false };
                if (d.mode === 'der_riese_link' && !this.mapQuest.derRieseLinked.has(d.tpCode)) {
                    return { text: `[E] INITIATE LINK SEQUENCE — ${d.tpCode} (30s SPRINT TO MAINFRAME)`, affordable: true };
                }
                if (d.mode === 'kino_stage') {
                    if (this.mapQuest.kinoCooldown > 0) return { text: `STAGE TELEPORTER COOLING (${Math.ceil(this.mapQuest.kinoCooldown)}s)`, affordable: false };
                    if (!this.mapQuest.kinoLinked) return { text: `[E] INITIATE STAGE LINK → RUN TO LOBBY PAD`, affordable: true };
                    return { text: `[E] TELEPORT TO PROJECTION BOOTH (PACK-A-PUNCH 30s)`, affordable: true };
                }
                if (d.mode === 'five_war_room' && this.mapQuest.fiveDefcon >= 5) {
                    return { text: `[E] DEFCON 5 TELEPORT → PANIC ROOM PACK-A-PUNCH!`, affordable: true };
                }
                return { text: `[E] ${lbl} (${inter.cost} PTS)`, affordable: this.points >= inter.cost };
            }
            return null;
        }

        update(dt) {
            if (!this.active || this.state === 'ended') return;
            this.elapsed += dt;
            if (BO.Cheats && BO.Cheats.isActive('infmoney') && this.points < 99999) {
                this.points = 99999;
            }

            if (this.instaKillTimer > 0) this.instaKillTimer = Math.max(0, this.instaKillTimer - dt);
            if (this.doublePointsTimer > 0) this.doublePointsTimer = Math.max(0, this.doublePointsTimer - dt);
            if (this.fireSaleTimer > 0) this.fireSaleTimer = Math.max(0, this.fireSaleTimer - dt);

            // 'dance' cheat: once every minute, all zombies dance for 2 seconds!
            if (BO.Cheats && BO.Cheats.isActive('dance')) {
                this.danceIntervalTimer -= dt;
                if (this.danceIntervalTimer <= 0) {
                    this.danceIntervalTimer = 60.0;
                    if (this.zombies.some((z) => z.alive)) {
                        this.triggerZombieDance();
                    }
                }
            }

            this._updateMysteryBox(dt);
            this._updateMapSystems(dt);
            this._updateNearestPrompt();

            const isOnlineClient = !!(BO.Net && BO.Net.active && !BO.Net.isHost);

            if (!isOnlineClient && this.state === 'intermission') {
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    if (!this.firstRoundStarted) {
                        this.firstRoundStarted = true;
                        this._beginRound(this.round || 1);
                    } else {
                        this._beginRound(this.round + 1);
                    }
                }
            } else if (!isOnlineClient && (this.state === 'fighting' || this.state === 'exfil')) {
                const maxAlive = BO.Math.clamp(Number(this.customValues.maxAliveZombies) || 24, 5, 60);
                const aliveCount = this.zombies.filter((z) => z.alive).length;
                if (this.remainingToSpawn > 0 && aliveCount < maxAlive) {
                    this.spawnCooldown -= dt;
                    if (this.spawnCooldown <= 0) {
                        this._spawnZombie();
                        this.remainingToSpawn--;
                        const customDelay = Number(this.customValues.spawnDelaySec) || 0;
                        const delayMult = BO.Mods.fx(this.modifiers, 'zombies').spawnDelayMult || 1;
                        this.spawnCooldown = (customDelay > 0 ? BO.Math.clamp(customDelay, 0.12, 4.0) : Math.max(0.32, 1.35 - this.round * 0.05)) * delayMult;
                    }
                }
                if (this.state === 'fighting' && this.remainingToSpawn === 0 && aliveCount === 0) {
                    const zFxRnd = BO.Mods.fx(this.modifiers, 'zombies');
                    this.state = 'intermission';
                    this.stateTimer = zFxRnd.quickRoundBreak ? 1.5 : 4.2;
                    BO.Sound.playRoundEnd();
                    if (!this.roundDamageTaken && BO.Player.zombiePerks.has('clean_break')) this.addPoints(100, 'CLEAN ROUND');
                    BO.Progression.awardMedal('round_clear');
                    BO.Progression.checkRound50DifficultyUnlocks(this.round, this.difficulty);
                    const minExfilRound = zFxRnd.earlyExfil || 10;
                    if (this.round >= minExfilRound && !this.exfilAvailable) {
                        this.exfilAvailable = true;
                        BO.Events.emit('hud:toast', { text: 'EXFIL AVAILABLE — PRESS [H] ANYTIME TO CALL EVAC', color: '#22c55e' });
                    }
                }
            }

            if (this.exfilActive) {
                this.exfilTimer -= dt;
                const ep = BO.World.mapData.exfilPoint || { x: 0, z: 0 };
                const aliveCount = this.zombies.filter((z) => z.alive).length;
                if (BO.Math.dist2D(BO.Player.pos.x, BO.Player.pos.z, ep.x, ep.z) < 4.0 && aliveCount <= 0 && this.remainingToSpawn <= 0) {
                    this._finishMatch(true);
                    return;
                }
                if (this.exfilTimer <= 0) { this._finishMatch(false); return; }
            }

            // Update Zombies
            BO.Mods.tickZombies(this.modifiers, this.zombies, dt);
            BO.Mods.tickMode('zombies', dt, { zombies: this.zombies });
            const allowProj = !(this.modifiers.noProjectiles || (this.modifiers.noProjectilesUntil20 && this.round < 20));
            const hitMeshes = [];
            const zCallbacks = {
                allowProjectiles: allowProj,
                getTarget: (z) => {
                    const ally = this.zombies.find((entity) => entity.alive && entity.powerAlly && entity.pos.distanceTo(z.pos) < 7);
                    return ally ? { x: ally.pos.x, y: ally.pos.y, z: ally.pos.z, ally, attackRange: 1.65 } : this._getFortificationTarget(z);
                },
                onAttackCustomTarget: (z, tgt) => {
                    if (tgt?.ally?.alive) tgt.ally.takeDamage(z.damage, 'torso', false, null, 'melee');
                    if (tgt && tgt.fort && tgt.fort.alive) {
                        this._damageFortification(tgt.fort, Math.max(12, Math.min(180, z.damage * 0.55)));
                    }
                },
                onMeleePlayer: (attacker) => {
                    BO.Player.takeDamage(this._enemyAttackDamage(attacker), attacker.pos, false);
                    BO.Sound.playZombieGroan(attacker.soundProfile, 0.9);
                },
                onBonusAttack: (attacker, multiplier, effect) => {
                    const player = BO.Player;
                    player.takeDamage(this._enemyAttackDamage(attacker) * multiplier, attacker.pos, false);
                    if (player.alive && !player.aetherActive) effect(attacker, player);
                },
                onRangedAttack: (attacker, tx, ty, tz, extraOpts) => {
                    if (allowProj) this._spawnEnemyProjectile(attacker, tx, ty, tz, extraOpts);
                }
            };
            for (let i = this.zombies.length - 1; i >= 0; i--) {
                const z = this.zombies[i];
                const keep = z.update(dt, this.zombies, zCallbacks);
                if (!keep) {
                    if (z === this.activeBoss) this.activeBoss = null;
                    z.destroy();
                    this.zombies.splice(i, 1);
                } else if (z.alive && !z.powerAlly) {
                    const meshes = z.getHitboxMeshes();
                    for (let m = 0; m < meshes.length; m++) hitMeshes.push(meshes[m]);
                }
            }
            BO.Combat.setTargetPool(hitMeshes);

            // Update Enemy Ranged Projectiles
            const P = BO.Player;
            for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
                const ep = this.enemyProjectiles[i];
                ep.life -= dt;
                const step = ep.vel.clone().multiplyScalar(dt);
                const hitWall = BO.World.raycastWorld(ep.pos, step.clone().normalize(), step.length() + 0.15);
                ep.pos.add(step);
                ep.mesh.position.copy(ep.pos);

                const hitPlayer = P.alive && BO.Math.dist3D(ep.pos.x, ep.pos.y, ep.pos.z, P.pos.x, P.pos.y + 1.1, P.pos.z) < 0.78;
                if (hitPlayer) {
                    P.takeDamage(ep.damage, ep.owner ? ep.owner.pos : ep.pos, false);
                    if (ep.kind === 'life_drain' && ep.owner && ep.owner.alive) {
                        ep.owner.hp = Math.min(ep.owner.maxHp, ep.owner.hp + 55);
                    }
                    BO.FX.spawnParticles(ep.pos, 8, ep.color, 3.5, 6, 0.4, 1.2);
                }

                if (hitPlayer || hitWall || ep.life <= 0) {
                    if (hitWall) BO.FX.spawnParticles(ep.pos, 6, ep.color, 3, 6, 0.35, 1.0);
                    if (BO.World.scene) BO.World.scene.remove(ep.mesh);
                    this.enemyProjectiles.splice(i, 1);
                }
            }

            this._updateSuppliesAndFortifications(dt);

            // Power-Ups
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const pu = this.powerUps[i];
                pu.life -= dt;
                pu.mesh.rotation.y += dt * 2.2;
                if (pu.ring) pu.ring.rotation.z -= dt * 3.4;
                pu.mesh.position.y = pu.pos.y + Math.sin(this.elapsed * 4) * 0.14;
                if (Math.random() < dt * 7) BO.FX.spawnParticles(pu.mesh.position.clone(), 1, pu.color, 1.3, -1.6, 0.35, 0.6);
                if (pu.life < 4.0) pu.mesh.visible = Math.floor(pu.life * 8) % 2 === 0;
                const extendedPickup = P.zombiePerks.has('long_reach') && Math.abs(P.pos.y + 0.85 - pu.pos.y) < 1.15;
                if (BO.Math.dist2D(P.pos.x, P.pos.z, pu.pos.x, pu.pos.z) < (extendedPickup ? 3 : 1.55)) {
                    this._collectPowerUp(pu);
                    BO.World.scene.remove(pu.mesh);
                    this.powerUps.splice(i, 1);
                    continue;
                }
                if (pu.life <= 0) {
                    BO.World.scene.remove(pu.mesh);
                    this.powerUps.splice(i, 1);
                }
            }

            if (!P.alive && (!BO.Net || !BO.Net.active || !BO.Net.isAnySquadmateAlive())) {
                this._finishMatch(false);
            }
        }

        _updateMapSystems(dt) {
            const P = BO.Player;
            const mq = this.mapQuest;

            // 1. Traps tick, kill zombies inside radius, Flogger crouch-check, Auto-Turret targeting
            for (const tr of BO.World.traps) {
                if (tr.activeTimer > 0) {
                    tr.activeTimer -= dt;
                    if (tr.kind === 'electro_shock' || tr.kind === 'fire_trap' || tr.kind === 'flogger') {
                        for (const z of this.zombies) {
                            if (!z.alive || z.isBoss) continue;
                            if (BO.Math.dist3D(z.pos.x, z.pos.y, z.pos.z, tr.x, tr.y, tr.z) <= tr.radius + 0.6) {
                                const killed = z.takeDamage(99999, 'torso', false, null, tr.kind === 'fire_trap' ? 'fire' : 'explosive');
                                if (killed) { this.kills++; this.addPoints(40, 'TRAP KILL'); }
                            }
                        }
                        if (tr.kind === 'flogger' && P.alive && !P.crouching && !P.sliding &&
                            BO.Math.dist3D(P.pos.x, P.pos.y, P.pos.z, tr.x, tr.y, tr.z) <= 2.3) {
                            P.takeDamage(60 * dt, new THREE.Vector3(tr.x, tr.y, tr.z), false);
                        }
                    } else if (tr.kind === 'auto_turret') {
                        tr.fireAccum -= dt;
                        if (tr.fireAccum <= 0) {
                            let nearest = null, bestD = 18.0;
                            for (const z of this.zombies) {
                                if (!z.alive) continue;
                                const d = BO.Math.dist3D(tr.x, tr.y + 1.4, tr.z, z.pos.x, z.pos.y + 1.0, z.pos.z);
                                if (d < bestD) { bestD = d; nearest = z; }
                            }
                            if (nearest) {
                                tr.fireAccum = 0.24;
                                if (tr.fxGroup.userData.gunHead) tr.fxGroup.userData.gunHead.lookAt(nearest.pos.x, nearest.pos.y + 1.2, nearest.pos.z);
                                BO.FX.spawnTracer(new THREE.Vector3(tr.x, tr.y + 1.38, tr.z), nearest.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfde047);
                                BO.Sound.playGunshot('smg', false, false, 0.4);
                                const killed = nearest.takeDamage(185, 'torso', false, null, 'bullet');
                                if (killed) { this.kills++; this.addPoints(60, 'TURRET'); }
                            }
                        }
                    }
                    if (tr.activeTimer <= 0) {
                        tr.activeTimer = 0;
                        tr.cooldownTimer = tr.cooldownDuration;
                        tr.lamp.material.color.setHex(0xef4444);
                        tr.handle.rotation.x = -0.45;
                    }
                } else if (tr.cooldownTimer > 0) {
                    tr.cooldownTimer = Math.max(0, tr.cooldownTimer - dt);
                    if (tr.cooldownTimer === 0) {
                        tr.lamp.material.color.setHex(0x22c55e);
                    }
                }
            }

            // 2. Ascension Centrifuge Spinning Arm Hazard (Crouching ducks underneath safely!)
            for (const ch of BO.World.centrifugeHazards) {
                if (P.alive && P.pos.y < ch.y + 0.3 && !P.crouching && !P.sliding && P.centrifugeCooldown <= 0) {
                    const dx = P.pos.x - ch.x, dz = P.pos.z - ch.z;
                    const r = Math.hypot(dx, dz);
                    if (r > 1.1 && r < ch.radius) {
                        const armAng = ch.group.rotation.y % Math.PI;
                        const pAng = Math.atan2(-dz, dx);
                        const diff = Math.abs(Math.sin(pAng - armAng));
                        if (diff < 0.22) {
                            P.centrifugeCooldown = 0.9;
                            P.takeDamage(35, new THREE.Vector3(ch.x, ch.y, ch.z), false);
                            BO.Events.emit('hud:toast', { text: 'CROUCH [C] TO DUCK UNDER CENTRIFUGE ARM!', color: '#f59e0b' });
                        }
                    }
                }
            }

            // 3. Ascension Rising Soyuz Rocket Secret Shootable Double Points
            const rkt = BO.World.ascensionRocket;
            if (rkt && rkt.launched && !rkt.exploded && rkt.y > 2 && rkt.y < 110 && P.fireCooldown > 0) {
                const pos = P.pos;
                const d = BO.Math.dist3D(pos.x, pos.y + 1.5, pos.z, rkt.baseX, rkt.y + 8, rkt.baseZ);
                if (d < 55) {
                    const cam = BO.App ? BO.App.worldCamera : null;
                    if (cam) {
                        const dir = new THREE.Vector3();
                        cam.getWorldDirection(dir);
                        const toRkt = new THREE.Vector3(rkt.baseX - cam.position.x, (rkt.y + 9) - cam.position.y, rkt.baseZ - cam.position.z);
                        const proj = toRkt.dot(dir);
                        if (proj > 0 && toRkt.clone().addScaledVector(dir, -proj).length() < 3.6) {
                            rkt.exploded = true;
                            rkt.group.visible = false;
                            this.mapQuest.ascensionRocketExploded = true;
                            BO.FX.spawnExplosion(new THREE.Vector3(rkt.baseX, rkt.y + 8, rkt.baseZ), 12, 0xf97316);
                            BO.Sound.playExplosion(1.0);
                            this._spawnPowerUp(0, 0, -16, 'double_points');
                            BO.Events.emit('hud:banner', { title: 'SOYUZ ROCKET DESTROYED!', sub: 'BONUS DOUBLE POINTS SPAWNED IN COSMODROME!', color: '#f59e0b' });
                        }
                    }
                }
            }

            // 4. Der Riese 30s Teleporter Link Timer
            if (mq.derRieseLinkActive) {
                mq.derRieseLinkTimer -= dt;
                if (mq.derRieseLinkTimer <= 0) {
                    BO.Events.emit('hud:toast', { text: `TELEPORTER ${mq.derRieseLinkActive} LINK EXPIRED — RETRY!`, color: '#ef4444' });
                    mq.derRieseLinkActive = null;
                    mq.derRieseLinkTimer = 0;
                }
            }

            // 5. Kino 30s Projection Booth Countdown + Cooldown
            if (mq.kinoCooldown > 0) mq.kinoCooldown = Math.max(0, mq.kinoCooldown - dt);
            if (mq.kinoBoothTimer > 0) {
                mq.kinoBoothTimer -= dt;
                if (mq.kinoBoothTimer <= 0) {
                    mq.kinoBoothTimer = 0;
                    mq.kinoCooldown = 18.0;
                    P.pos.set(0, 0, 16.5);
                    P.vel.set(0, 0, 0);
                    BO.Sound.playPaPChime();
                    BO.FX.spawnParticles(P.pos.clone().add(new THREE.Vector3(0, 1, 0)), 18, 0x38bdf8, 5, 2, 0.7, 1.4);
                    BO.Events.emit('hud:toast', { text: 'RETURNED TO THEATER LOBBY FROM PROJECTION BOOTH', color: '#38bdf8' });
                }
            }

            // 6. "Five" Panic Room 30s Timer + Bonfire Sale Timer + Stranded Multi-Floor Reposition
            if (mq.fiveBonfireTimer > 0) mq.fiveBonfireTimer = Math.max(0, mq.fiveBonfireTimer - dt);
            if (mq.fivePanicTimer > 0) {
                mq.fivePanicTimer -= dt;
                if (mq.fivePanicTimer <= 0) {
                    mq.fivePanicTimer = 0;
                    if (mq.fiveInPanicRoom) {
                        mq.fiveInPanicRoom = false;
                        P.pos.set(0, 6.0, -2.0);
                        P.vel.set(0, 0, 0);
                        BO.Sound.playPaPChime();
                    }
                    mq.fiveDefcon = 1;
                    BO.World.defconSwitches.forEach((s) => BO.World.setDefconSwitchState(s, false));
                    BO.World.setFivePanicDoorOpen(false);
                    BO.Events.emit('hud:toast', { text: 'DEFCON RESET TO 1 — RE-FLIP 4 SWITCHES FOR PANIC ROOM', color: '#94a3b8' });
                }
            }

            if (this.mapId === 'five_pentagon') {
                for (const z of this.zombies) {
                    if (!z.alive || z.isBoss) continue;
                    if (Math.abs(z.pos.y - P.pos.y) > 4.2) {
                        const t = (mq.floorStrayTimers.get(z.id) || 0) + dt;
                        mq.floorStrayTimers.set(z.id, t);
                        if (t > 3.5) {
                            mq.floorStrayTimers.set(z.id, 0);
                            const sp = this._pickSpawnPoint(false);
                            if (Math.abs((sp.y || 0) - P.pos.y) < 3.8) {
                                z.pos.set(sp.x, sp.y || 0, sp.z);
                                z.vel.set(0, 0, 0);
                            }
                        }
                    } else {
                        mq.floorStrayTimers.set(z.id, 0);
                    }
                }
            }
        }

        /* ====================================================================
           ZOMBIES SUPPLIES (50% DROP, 10% OF ENEMY MAX HP) & FORTIFICATIONS:
           - 2,000 Supplies = Mini Barricade (450 HP)
           - 10,000 Supplies = Wide Barricade (1,600 HP)
           - 25,000 Supplies = Sniper Tower Ball (throw to deploy 4,500 HP Sniper Tower!)
        ==================================================================== */
        _maybeDropSupplies(z) {
            const dropRate = BO.Math.clamp(Number(this.customValues.supplyDropPct ?? 50), 0, 100) / 100;
            if (!z || !BO.World.scene || Math.random() >= dropRate) return;
            const supMult = BO.Mods.fx(this.modifiers, 'zombies').suppliesMult || 1;
            const amount = Math.max(1, Math.round((z.maxHp || 100) * (BO.Player.zombiePerks.has('scrap_stamp') ? 0.135 : 0.10) * supMult));
            const g = new THREE.Group();
            const crate = new THREE.Mesh(
                new THREE.BoxGeometry(0.46, 0.36, 0.46),
                new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.6 })
            );
            const band = new THREE.Mesh(
                new THREE.BoxGeometry(0.50, 0.08, 0.50),
                new THREE.MeshBasicMaterial({ color: 0xfde047 })
            );
            g.add(crate, band);
            g.position.set(z.pos.x, (z.pos.y || 0) + 0.45, z.pos.z);
            BO.World.scene.add(g);
            this.supplyDrops.push({ mesh: g, x: z.pos.x, y: (z.pos.y || 0) + 0.45, z: z.pos.z, amount, life: BO.Player.zombiePerks.has('crate_keeper') ? 65.0 : 40.0, phase: Math.random() * 6.28 });
        }

        buyFortification(kind) {
            const P = BO.Player;
            if (!this.active || !P || !P.alive || !BO.World.scene) return false;
            const costs = { mini_barricade: 2000, wide_barricade: 10000, sniper_tower_ball: 25000 };
            const baseCost = costs[kind];
            if (!baseCost) return false;
            const cost = Math.round(baseCost * BO.Mods.priceMult(this.modifiers, 'fort'));
            if (this.supplies < cost) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: `NEED ${cost.toLocaleString()} SUPPLIES (YOU HAVE ${this.supplies.toLocaleString()})!`, color: '#ef4444' });
                return false;
            }
            this.supplies -= cost;
            if (P.zombiePerks.has('builder_bond')) this.supplies += Math.floor(cost * 0.15);
            BO.Sound.playShopBuy();

            if (kind === 'sniper_tower_ball') {
                this.sniperTowerBalls++;
                this.throwSniperTowerBall();
                return true;
            }

            const { forward } = P.getMoveDirectionVectors();
            const dist = kind === 'wide_barricade' ? 3.2 : 2.5;
            const bx = P.pos.x + forward.x * dist;
            const bz = P.pos.z + forward.z * dist;
            const by = BO.World.getGroundHeight(bx, bz, P.pos.y);
            const width = kind === 'wide_barricade' ? 7.5 : 2.8;
            const wallMult = BO.Mods.fx(this.modifiers, 'zombies').wallHpMult || 1;
            const hp = Math.round((kind === 'wide_barricade' ? 1600 : 450) * wallMult);
            const alignX = Math.abs(forward.z) >= Math.abs(forward.x);
            const w = alignX ? width : 0.75;
            const d = alignX ? 0.75 : width;
            const h = kind === 'wide_barricade' ? 1.85 : 1.35;

            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                BO.Textures.getWorldMaterial(kind === 'wide_barricade' ? 'castle_battlement' : 'sandbag', Math.max(w, d), h)
            );
            mesh.position.set(bx, by + h * 0.5, bz);
            const strip = new THREE.Mesh(
                new THREE.BoxGeometry(w + 0.04, 0.10, d + 0.04),
                new THREE.MeshBasicMaterial({ color: kind === 'wide_barricade' ? 0x38bdf8 : 0x22c55e })
            );
            strip.position.y = h * 0.5 + 0.05;
            mesh.add(strip);
            BO.World.scene.add(mesh);

            const col = {
                minX: bx - w * 0.5, maxX: bx + w * 0.5,
                minY: by, maxY: by + h,
                minZ: bz - d * 0.5, maxZ: bz + d * 0.5,
                enemiesOnly: true,
                active: true
            };
            BO.World.colliders.push(col);
            this.fortifications.push({
                kind, x: bx, y: by, z: bz, hp, maxHp: hp, alive: true, mesh, colliders: [col], interactives: []
            });
            BO.Events.emit('hud:toast', {
                text: kind === 'wide_barricade' ? `🧱 WIDE BARRICADE DEPLOYED (${hp} HP)!` : `🧱 MINI BARRICADE DEPLOYED (${hp} HP)!`,
                color: '#4ade80'
            });
            return true;
        }

        throwSniperTowerBall() {
            const P = BO.Player;
            if (!this.active || !P || !P.alive || !BO.World.scene) return false;
            if (this.sniperTowerBalls <= 0) {
                if (this.supplies >= 25000) {
                    return this.buyFortification('sniper_tower_ball');
                }
                BO.Events.emit('hud:toast', { text: 'NO SNIPER TOWER BALLS! PRESS [B] TO BUY (25,000 SUPPLIES)', color: '#f59e0b' });
                return false;
            }
            this.sniperTowerBalls--;
            const cam = BO.App ? BO.App.worldCamera : null;
            const aim = cam ? P.getAimRay(cam) : { origin: P.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), dir: P.getMoveDirectionVectors().forward };
            const pos = aim.origin.clone().addScaledVector(aim.dir, 0.8);
            const vel = aim.dir.clone().multiplyScalar(16.5);
            vel.y += 4.2;

            const ball = new THREE.Group();
            const core = new THREE.Mesh(
                new THREE.SphereGeometry(0.24, 14, 12),
                new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.7, metalness: 0.8, roughness: 0.2 })
            );
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 8, 18), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
            ball.add(core, ring);
            ball.position.copy(pos);
            BO.World.scene.add(ball);
            this.thrownTowerBalls.push({ mesh: ball, pos, vel, life: 5.0 });
            BO.Sound.playUIClick();
            BO.Events.emit('hud:toast', { text: '🔵 SNIPER TOWER BALL THROWN!', color: '#38bdf8' });
            return true;
        }

        _deployMiniSniperTower(tx, ty, tz) {
            if (!BO.World.scene) return;
            const g = new THREE.Group();
            const cols = [];
            const inters = [];
            const addBox = (minX, minY, minZ, maxX, maxY, maxZ, matName) => {
                const w = Math.abs(maxX - minX), h = Math.abs(maxY - minY), d = Math.abs(maxZ - minZ);
                const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), BO.Textures.getWorldMaterial(matName, Math.max(w, d), h));
                m.position.set((minX + maxX) * 0.5, (minY + maxY) * 0.5, (minZ + maxZ) * 0.5);
                g.add(m);
                const c = { minX, maxX, minY, maxY, minZ, maxZ, active: true };
                BO.World.colliders.push(c);
                cols.push(c);
            };
            const hw = 2.1, deckY = ty + 5.2;
            // 4 corner legs + top sniper deck + low sandbag cover!
            for (const [cx, cz] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) {
                addBox(tx + cx - 0.25, ty, tz + cz - 0.25, tx + cx + 0.25, deckY, tz + cz + 0.25, 'castle_stone');
            }
            addBox(tx - hw, deckY - 0.3, tz - hw, tx + hw, deckY, tz + hw, 'diamond_plate');
            addBox(tx - hw, deckY, tz - hw, tx + hw, deckY + 0.85, tz - hw + 0.28, 'sandbag');
            addBox(tx - hw, deckY, tz + hw - 0.28, tx + hw, deckY + 0.85, tz + hw, 'sandbag');
            addBox(tx - hw, deckY, tz - hw, tx - hw + 0.28, deckY + 0.85, tz + hw, 'sandbag');
            addBox(tx + hw - 0.28, deckY, tz - hw, tx + hw, deckY + 0.85, tz + hw, 'sandbag');

            // Glowing Quick-Zip Pad at base -> top sniper deck!
            const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.14, 14), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
            pad.position.set(tx, ty + 0.08, tz + hw + 1.1);
            g.add(pad);
            const zipUp = {
                type: 'z_sniper_tower_zip',
                id: 'ztower_zip_' + Date.now(),
                x: tx, y: ty + 0.8, z: tz + hw + 1.1,
                destX: tx, destY: deckY + 0.1, destZ: tz,
                radius: 2.2
            };
            BO.World.interactives.push(zipUp);
            inters.push(zipUp);

            BO.World.scene.add(g);
            BO.FX.spawnExplosion(new THREE.Vector3(tx, ty + 1.2, tz), 4.5, 0x38bdf8);
            BO.Sound.playPaPChime();
            this.fortifications.push({
                kind: 'sniper_tower', x: tx, y: ty, z: tz, hp: 4500, maxHp: 4500, alive: true, mesh: g, colliders: cols, interactives: inters
            });
            BO.Events.emit('hud:banner', {
                title: '🗼 MINI SNIPER TOWER DEPLOYED!',
                sub: '4,500 HP FORTIFIED DECK — PRESS [E] ON THE CYAN PAD TO ZIP UP!',
                color: '#38bdf8'
            });
        }

        _getFortificationTarget(z) {
            if (!this.fortifications || this.fortifications.length === 0) return null;
            for (const f of this.fortifications) {
                if (!f.alive) continue;
                const d = BO.Math.dist2D(z.pos.x, z.pos.z, f.x, f.z);
                if (f.kind !== 'sniper_tower' && d < 4.5) {
                    return { fort: f, x: f.x, y: f.y, z: f.z, attackRange: 2.0, forceDirect: true };
                }
                // Enemies sometimes target & attack deployed Sniper Towers!
                if (f.kind === 'sniper_tower' && d < 9.5 && (z.id % 3 === 0)) {
                    return { fort: f, x: f.x, y: f.y, z: f.z, attackRange: 2.6, forceDirect: true };
                }
            }
            return null;
        }

        _damageFortification(f, dmg) {
            if (!f || !f.alive) return;
            f.hp = Math.max(0, f.hp - dmg);
            BO.Sound.playWallHit();
            if (f.hp <= 0) {
                f.alive = false;
                if (f.mesh && BO.World.scene) BO.World.scene.remove(f.mesh);
                if (f.colliders) f.colliders.forEach((c) => { c.active = false; });
                if (f.interactives) {
                    for (const it of f.interactives) {
                        const idx = BO.World.interactives.indexOf(it);
                        if (idx !== -1) BO.World.interactives.splice(idx, 1);
                    }
                }
                BO.FX.spawnExplosion(new THREE.Vector3(f.x, f.y + 1.2, f.z), 4.0, 0xf97316);
                BO.Sound.playWallBreak();
                BO.Events.emit('hud:toast', { text: `${f.kind.replace(/_/g, ' ').toUpperCase()} DESTROYED BY HORDE!`, color: '#ef4444' });
            }
        }

        _updateSuppliesAndFortifications(dt) {
            const P = BO.Player;
            // Collect Supply Crates
            for (let i = this.supplyDrops.length - 1; i >= 0; i--) {
                const sd = this.supplyDrops[i];
                sd.life -= dt;
                sd.phase += dt * 3.2;
                sd.mesh.rotation.y += dt * 2.2;
                sd.mesh.position.y = sd.y + Math.sin(sd.phase) * 0.12;
                const d = BO.Math.dist3D(P.pos.x, P.pos.y + 0.8, P.pos.z, sd.x, sd.y, sd.z);
                const extended = P.zombiePerks.has('cargo_net') && Math.abs(P.pos.y + 0.8 - sd.y) < 1.15;
                if (P.alive && d < (extended ? 4 : 3.2)) {
                    this.supplies += sd.amount;
                    BO.Sound.playPowerUp();
                    BO.Events.emit('hud:toast', { text: `📦 +${sd.amount.toLocaleString()} SUPPLIES (TOTAL: ${this.supplies.toLocaleString()})`, color: '#38bdf8' });
                    if (BO.World.scene) BO.World.scene.remove(sd.mesh);
                    this.supplyDrops.splice(i, 1);
                    continue;
                }
                if (sd.life <= 0) {
                    if (BO.World.scene) BO.World.scene.remove(sd.mesh);
                    this.supplyDrops.splice(i, 1);
                }
            }

            // Update Thrown Sniper Tower Balls
            for (let i = this.thrownTowerBalls.length - 1; i >= 0; i--) {
                const tb = this.thrownTowerBalls[i];
                tb.life -= dt;
                tb.vel.y -= 20.0 * dt;
                tb.pos.addScaledVector(tb.vel, dt);
                tb.mesh.position.copy(tb.pos);
                tb.mesh.rotation.x += dt * 8;
                tb.mesh.rotation.y += dt * 6;
                const gY = BO.World.getGroundHeight(tb.pos.x, tb.pos.z, tb.pos.y + 0.5);
                if (tb.pos.y <= gY + 0.25 || tb.life <= 0) {
                    if (BO.World.scene) BO.World.scene.remove(tb.mesh);
                    this._deployMiniSniperTower(tb.pos.x, gY, tb.pos.z);
                    this.thrownTowerBalls.splice(i, 1);
                }
            }
        }

        getMapStatusBadges() {
            const out = [];
            out.push({ text: `📦 SUPPLIES: ${this.supplies.toLocaleString()} • [B] BUILD`, color: '#38bdf8' });
            const mq = this.mapQuest;
            if (this.mapId === 'shi_no_numa' && BO.Player.inSwampMud) {
                out.push({ text: 'SWAMP MUD (-38% SPEED)', color: '#84cc16' });
            } else if (this.mapId === 'der_riese') {
                out.push({ text: `TELEPORTERS: ${mq.derRieseLinked.size}/3`, color: mq.derRieseLinked.size >= 3 ? '#22c55e' : '#38bdf8' });
                if (mq.derRieseLinkActive) out.push({ text: `LINK ${mq.derRieseLinkActive}: ${mq.derRieseLinkTimer.toFixed(1)}s`, color: '#f59e0b' });
            } else if (this.mapId === 'kino_der_toten') {
                if (mq.kinoBoothTimer > 0) out.push({ text: `PROJECTION BOOTH: ${mq.kinoBoothTimer.toFixed(1)}s`, color: '#c084fc' });
                else if (mq.kinoLinkPending) out.push({ text: 'RUN TO LOBBY PAD TO LINK', color: '#38bdf8' });
                else if (mq.kinoLinked) out.push({ text: 'STAGE TELEPORTER LINKED!', color: '#22c55e' });
            } else if (this.mapId === 'five_pentagon') {
                const fl = BO.Player.pos.y > 9 ? '1F BRIEFING' : (BO.Player.pos.y > 3 ? '2F WAR ROOM' : '3F LABS');
                out.push({ text: `${fl} • DEFCON ${mq.fiveDefcon}`, color: mq.fiveDefcon >= 5 ? '#22c55e' : '#f59e0b' });
                if (mq.fivePanicTimer > 0) out.push({ text: `PANIC ROOM: ${mq.fivePanicTimer.toFixed(1)}s`, color: '#c084fc' });
                if (mq.fiveBonfireTimer > 0) out.push({ text: `BONFIRE SALE: ${mq.fiveBonfireTimer.toFixed(0)}s (1K PaP)`, color: '#facc15' });
            } else if (this.mapId === 'ascension') {
                if (!BO.World.powerOn) out.push({ text: 'B&W FILM MODE (FLIP POWER)', color: '#94a3b8' });
                out.push({ text: `LANDERS: ${mq.ascensionLandersRidden.size}/3`, color: mq.ascensionLandersRidden.size >= 3 ? '#22c55e' : '#f59e0b' });
            } else if (this.mapId === 'nuketown_zombies') {
                out.push({ text: `NUKETOWN POP: ${mq.nuketownPop}`, color: '#fde047' });
            }
            return out;
        }

        _finishMatch(exfilSuccess) {
            this.state = 'ended';
            if (exfilSuccess) {
                BO.Progression.recordStat('zombiesExfils', 1);
                BO.Progression.awardMedal('exfil_success');
                BO.Progression.grantPlayerXP(1200);
            }
            BO.Progression.flushSave();

            BO.Events.emit('match:ended', {
                mode: 'zombies',
                victory: exfilSuccess,
                title: exfilSuccess ? 'EXFIL SUCCESSFUL' : 'GAME OVER — YOU SURVIVED ' + this.round + ' ROUNDS',
                mapName: BO.World.mapData.name,
                round: this.round,
                kills: this.kills,
                headshots: this.headshots,
                points: this.points,
                time: BO.Math.formatTime(this.elapsed)
            });
        }
    }

    BO.ZombiesMode = new ZombiesMode();
})(window);
