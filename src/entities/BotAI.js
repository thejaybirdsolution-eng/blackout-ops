/* ============================================================================
   BLACKOUT OPS — Tactical Multiplayer Bot AI
   Supports TDM, FFA, Domination, Hardpoint, Gun Game, Custom Games, Unarmed
   Bots, Big Heads, & Exact Per-Difficulty Sight-Delay Reaction Windows:
     - Recruit:  2.0 - 5.0 seconds
     - Regular:  2.0 - 4.0 seconds
     - Hardened: 2.0 - 3.0 seconds
     - Veteran:  1.0 - 2.0 seconds
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const DIFFICULTIES = {
        recruit: { sightDelayMin: 2.0, sightDelayMax: 5.0, accuracy: 0.11, speedMult: 0.85, dmgMult: 0.55 },
        regular: { sightDelayMin: 2.0, sightDelayMax: 4.0, accuracy: 0.065, speedMult: 0.95, dmgMult: 0.80 },
        hardened: { sightDelayMin: 2.0, sightDelayMax: 3.0, accuracy: 0.038, speedMult: 1.03, dmgMult: 1.00 },
        veteran: { sightDelayMin: 1.0, sightDelayMax: 2.0, accuracy: 0.020, speedMult: 1.10, dmgMult: 1.15 }
    };

    const BOT_NAMES = [
        'GHOST-ACTUAL', 'SOAP-07', 'PRICE-BRAVO', 'ROACH-04', 'GAZ-ALPHA',
        'VIPER-11', 'KESTREL-02', 'REAPER-09', 'WARDEN-06', 'FALCON-12',
        'SPECTER-03', 'NOMAD-08', 'JACKAL-05', 'COBALT-14', 'ANVIL-10',
        'FROST-16', 'SANDMAN-18', 'GRIGGS-19', 'FOLEY-21', 'RAMIREZ-22'
    ];

    class BotAI {
        constructor(opts) {
            this.id = opts.id;
            this.name = opts.name || BOT_NAMES[opts.id % BOT_NAMES.length];
            this.team = opts.team; // 0 = Allies, 1 = Enemies (or unique id in FFA)
            this.difficultyKey = opts.difficulty || 'regular';
            this.difficulty = DIFFICULTIES[this.difficultyKey] || DIFFICULTIES.regular;
            this.weaponId = opts.weaponId || 'm4a1';
            this.unarmed = !!opts.unarmed;
            this.gunGameTier = 0;

            this.maxHp = opts.maxHp || 100;
            this.hp = this.maxHp;
            this.speedScale = opts.speedScale || 1.0;
            this.bigHeads = !!opts.bigHeads;
            this.respawnDelay = opts.respawnDelay !== undefined ? opts.respawnDelay : 3.2;
            this.oneShotKills = !!opts.oneShotKills;

            this.alive = true;
            this.respawnTimer = 0;
            this.kills = 0;
            this.deaths = 0;
            this.score = 0;

            this.pos = new THREE.Vector3(opts.x, opts.y || 0, opts.z);
            this.yaw = opts.yaw || 0;
            this.radius = 0.42;
            this.height = 1.75;

            this.stunTimer = 0;
            this.mag = BO.WeaponsData.get(this.weaponId).magSize || 30;
            this.reloadTimer = 0;
            this.fireTimer = 0;
            this.reactionTimer = 0;
            this.spottedTargetKey = null;
            this.sightLostTimer = 1.0;
            this.strafeDir = Math.random() < 0.5 ? 1 : -1;
            this.strafeTimer = 1.2;
            this.animPhase = Math.random() * 6;
            this.path = [];
            this.pathTimer = 0;
            this.roamGoal = null;
            this.lastAttacker = null;

            this.parts = BO.CharacterMesh.buildSoldier(this.team === 0 ? 0 : 1, this);
            if (this.unarmed && this.parts.gunBody) {
                this.parts.gunBody.visible = false;
            }
            if (this.bigHeads && this.parts.headGroup) {
                this.parts.headGroup.scale.setScalar(3.0);
            }
            this.parts.root.position.copy(this.pos);
            if (this.parts.bodyPivot) {
                this.parts.bodyPivot.userData.baseY = this.parts.bodyPivot.position.y;
            }
            BO.World.scene.add(this.parts.root);
        }

        _rollSightDelay() {
            return BO.Math.randRange(this.difficulty.sightDelayMin, this.difficulty.sightDelayMax);
        }

        getHitboxMeshes() {
            const list = [];
            this.parts.root.traverse((obj) => {
                if (obj.isMesh && obj.userData.entity === this) list.push(obj);
            });
            return list;
        }

        spawnAt(sp) {
            this.pos.set(sp.x, sp.y || 0, sp.z);
            this.yaw = sp.yaw || 0;
            this.hp = this.maxHp;
            this.alive = true;
            this.stunTimer = 0;
            this.reloadTimer = 0;
            this.spottedTargetKey = null;
            this.sightLostTimer = 1.0;
            this.reactionTimer = 0;
            this.mag = BO.WeaponsData.get(this.weaponId).magSize;
            this.parts.root.visible = true;
            if (this.parts.gunBody) this.parts.gunBody.visible = !this.unarmed;
            if (this.parts.headGroup) this.parts.headGroup.scale.setScalar(this.bigHeads ? 3.0 : 1.0);
            this.parts.root.rotation.x = 0;
            this.parts.root.position.copy(this.pos);
            this.path = [];
        }

        takeDamage(dmg, attacker = null) {
            if (!this.alive) return false;
            this.hp -= dmg;
            this.lastAttacker = attacker;
            if (this.hp <= 0) {
                this.hp = 0;
                this.alive = false;
                this.deaths++;
                this.respawnTimer = this.respawnDelay;
                this.parts.root.visible = false;
                BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 12, 0x991b1b, 4.2, 11, 0.45, 1.2);
                return true;
            }
            return false;
        }

        update(dt, context) {
            // context: { playerAlive, playerPos, playerTeam, bots, modeType, objectivePos, onBotShootPlayer, onBotKillBot }
            if (!this.alive) {
                this.respawnTimer -= dt;
                return;
            }

            // Online Client Puppet Interpolation
            if (BO.Net && BO.Net.active && !BO.Net.isHost && this.netTargetPos) {
                const dist = this.pos.distanceTo(this.netTargetPos);
                const moveSpd = BO.Math.clamp(dist * 10, 0, 6.5);
                this.pos.lerp(this.netTargetPos, Math.min(1, dt * 15));
                if (typeof this.netTargetYaw === 'number') {
                    this.yaw += BO.Math.angleDiff(this.yaw, this.netTargetYaw) * Math.min(1, dt * 15);
                }
                this.animPhase += dt * (moveSpd * 2.2 + 1.0);
                this.parts.root.position.copy(this.pos);
                this.parts.root.rotation.y = this.yaw;
                BO.CharacterMesh.animateLimbs(this.parts, moveSpd, this.animPhase, 0, 0);
                return;
            }

            if (this.powerCarried) return;
            if (this.stunTimer > 0) {
                this.stunTimer -= dt;
                return;
            }

            if (this.reloadTimer > 0) {
                this.reloadTimer -= dt;
                if (this.reloadTimer <= 0) {
                    this.mag = BO.WeaponsData.get(this.weaponId).magSize;
                }
            }
            if (this.fireTimer > 0) this.fireTimer -= dt;

            // Find nearest visible hostile (Player or opposing Bot)
            const scanInterval = context.bots.length >= 40 ? 0.12 : 0;
            this.targetScan = (this.targetScan ?? (this.id % 12) * 0.01) - dt;
            if (!scanInterval || this.targetScan <= 0 || this.powerAlly !== this.scannedAsAlly) {
                this.targetScan = scanInterval;
                this.scannedAsAlly = this.powerAlly;
                const retained = scanInterval && this.cachedTarget && this.canKeepTarget(this.cachedTarget, context);
                if (!retained) this.cachedTarget = this._acquireTarget(context);
            }
            const target = this.cachedTarget;
            if (target?.kind === 'player') {
                if (!context.playerAlive || BO.Player.aetherActive || this.powerAlly) this.cachedTarget = null;
                else Object.assign(target, { x: context.playerPos.x, y: context.playerPos.y + 1.25, z: context.playerPos.z });
            } else if (target?.bot) {
                if (!target.bot.alive || !this.isHostile(target.bot, context.modeType)) this.cachedTarget = null;
                else Object.assign(target, { x: target.bot.pos.x, y: target.bot.pos.y + 1.25, z: target.bot.pos.z });
            }

            let moveSpeed = 0;
            if (target && this.cachedTarget) {
                const moveScale = this.powerMoveScale || 1;
                const tKey = target.kind === 'player' ? 'player' : ('bot_' + target.bot.id);
                if (tKey !== this.spottedTargetKey || this.sightLostTimer > 0.55) {
                    this.spottedTargetKey = tKey;
                    this.reactionTimer = this._rollSightDelay();
                }
                this.sightLostTimer = 0;

                const dx = target.x - this.pos.x;
                const dz = target.z - this.pos.z;
                const dist = Math.hypot(dx, dz);
                const targetYaw = Math.atan2(dx, dz);
                this.yaw += BO.Math.angleDiff(this.yaw, targetYaw) * Math.min(1, dt * 11);

                // Tactical strafe while engaging
                this.strafeTimer -= dt;
                if (this.strafeTimer <= 0) {
                    this.strafeTimer = 0.8 + Math.random() * 1.1;
                    this.strafeDir = -this.strafeDir;
                }
                const strafeSpeed = 2.5 * this.difficulty.speedMult * this.speedScale * moveScale;
                const rx = Math.cos(this.yaw) * this.strafeDir;
                const rz = -Math.sin(this.yaw) * this.strafeDir;
                this.pos.x += rx * strafeSpeed * dt;
                this.pos.z += rz * strafeSpeed * dt;
                if (dist > 14) {
                    this.pos.x += (dx / dist) * 2.6 * this.speedScale * moveScale * dt;
                    this.pos.z += (dz / dist) * 2.6 * this.speedScale * moveScale * dt;
                }
                moveSpeed = strafeSpeed;

                if (this.reactionTimer > 0) {
                    this.reactionTimer -= dt;
                } else if (!this.unarmed && this.reloadTimer <= 0 && this.fireTimer <= 0) {
                    this._fireAt(target, dist, context);
                }
            } else {
                this.sightLostTimer += dt;
                if (this.sightLostTimer > 0.65) {
                    this.spottedTargetKey = null;
                }

                // Navigate toward Objective or roam waypoint
                this.pathTimer -= dt;
                if (!this.roamGoal || this.pathTimer <= 0 || BO.Math.dist2D(this.pos.x, this.pos.z, this.roamGoal.x, this.roamGoal.z) < 2.2) {
                    this.pathTimer = 1.4 + Math.random() * 0.8;
                    if (context.objectivePos && Math.random() < 0.72) {
                        this.roamGoal = context.objectivePos;
                    } else if (BO.World.mapData.waypoints && BO.World.mapData.waypoints.length > 0) {
                        this.roamGoal = BO.Math.pick(BO.World.mapData.waypoints);
                    }
                    if (this.roamGoal) {
                        this.path = BO.World.findPath(this.pos.x, this.pos.y, this.pos.z, this.roamGoal.x, this.roamGoal.y || 0, this.roamGoal.z, false);
                    }
                }

                if (this.path.length > 0) {
                    while (this.path.length > 1 && BO.Math.dist2D(this.pos.x, this.pos.z, this.path[0].x, this.path[0].z) < 1.2) {
                        this.path.shift();
                    }
                    const wp = this.path[0];
                    const dx = wp.x - this.pos.x;
                    const dz = wp.z - this.pos.z;
                    const d = Math.hypot(dx, dz);
                    if (d > 0.25) {
                        const spd = 4.5 * this.difficulty.speedMult * this.speedScale * (this.powerMoveScale || 1);
                        this.pos.x += (dx / d) * spd * dt;
                        this.pos.z += (dz / d) * spd * dt;
                        this.yaw += BO.Math.angleDiff(this.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
                        moveSpeed = spd;
                    }
                }
            }

            BO.World.resolveHorizontal(this.pos, this.radius, this.height, false);
            this.pos.y = BO.World.getGroundHeight(this.pos.x, this.pos.z, this.pos.y);

            this.animPhase += dt * (moveSpeed * 2.2 + 1.0);
            this.parts.root.position.copy(this.pos);
            this.parts.root.rotation.y = this.yaw;
            BO.CharacterMesh.animateLimbs(this.parts, moveSpeed, this.animPhase, 0, 0);
        }

        isHostile(other, modeType) {
            const isFFA = modeType === 'ffa' || modeType === 'gun_game';
            const ownTeam = this.powerAlly ? 0 : this.team;
            const otherTeam = other.powerAlly ? 0 : other.team;
            return isFFA ? !(ownTeam === 0 && otherTeam === 0) : ownTeam !== otherTeam;
        }

        canKeepTarget(target, context) {
            const playerTarget = target.kind === 'player';
            if (playerTarget && (!context.playerAlive || BO.Player.aetherActive || this.powerAlly)) return false;
            if (!playerTarget && (!target.bot?.alive || !this.isHostile(target.bot, context.modeType))) return false;
            const pos = playerTarget ? context.playerPos : target.bot.pos;
            const range = playerTarget && BO.Player.mpPerks.includes('ghost') ? 26 : 42;
            return this.pos.distanceTo(pos) < range &&
                BO.World.hasLineOfSight(this.pos.x, this.pos.y + 1.5, this.pos.z, pos.x, pos.y + 1.35, pos.z);
        }

        _acquireTarget(context) {
            let best = null;
            let bestDist = 42;
            const myEyeY = this.pos.y + 1.5;

            const isFFA = context.modeType === 'ffa' || context.modeType === 'gun_game';

            // Check player
            if (context.playerAlive && !BO.Player.aetherActive) {
                const hostileToPlayer = !this.powerAlly && (isFFA || this.team !== context.playerTeam);
                if (hostileToPlayer) {
                    const p = context.playerPos;
                    const d = BO.Math.dist3D(this.pos.x, this.pos.y, this.pos.z, p.x, p.y, p.z);
                    const stealthRange = BO.Player.mpPerks.includes('ghost') ? 26 : 42;
                    if (d < Math.min(bestDist, stealthRange) &&
                        BO.World.hasLineOfSight(this.pos.x, myEyeY, this.pos.z, p.x, p.y + 1.35, p.z)) {
                        bestDist = d;
                        best = { kind: 'player', x: p.x, y: p.y + 1.25, z: p.z };
                    }
                }
            }

            // Check remote online human players
            if (BO.Net && BO.Net.active) {
                for (const [pid, st] of BO.Net.remoteStates.entries()) {
                    if (!st || !st.alive) continue;
                    const hostileToRemote = isFFA || (this.team !== (st.team ?? 0));
                    if (!hostileToRemote) continue;
                    const d = BO.Math.dist3D(this.pos.x, this.pos.y, this.pos.z, st.x, st.y, st.z);
                    if (d < bestDist && BO.World.hasLineOfSight(this.pos.x, myEyeY, this.pos.z, st.x, st.y + 1.35, st.z)) {
                        bestDist = d;
                        best = { kind: 'remote_player', peerId: pid, x: st.x, y: st.y + 1.25, z: st.z };
                    }
                }
            }

            // Check other bots
            for (let i = 0; i < context.bots.length; i++) {
                const o = context.bots[i];
                if (o === this || !o.alive) continue;
                const hostile = this.isHostile(o, context.modeType);
                if (!hostile) continue;
                const d = BO.Math.dist3D(this.pos.x, this.pos.y, this.pos.z, o.pos.x, o.pos.y, o.pos.z);
                if (d < bestDist && BO.World.hasLineOfSight(this.pos.x, myEyeY, this.pos.z, o.pos.x, o.pos.y + 1.35, o.pos.z)) {
                    bestDist = d;
                    best = { kind: 'bot', bot: o, x: o.pos.x, y: o.pos.y + 1.25, z: o.pos.z };
                }
            }

            return best;
        }

        _fireAt(target, dist, context) {
            if (this.unarmed) return;
            const spec = BO.WeaponsData.get(this.weaponId);
            if (spec.kind === 'melee') {
                if (dist > 2.4) return;
                this.fireTimer = 0.65;
                BO.Sound.playMelee();
                const dmg = this.oneShotKills ? 9999 : Math.round(spec.damage * 0.45 * this.difficulty.dmgMult);
                if (target.kind === 'player' && context.onBotShootPlayer) context.onBotShootPlayer(this, dmg);
                else if (target.bot && target.bot.alive && target.bot.takeDamage(dmg, this) && context.onBotKillBot) context.onBotKillBot(this, target.bot);
                return;
            }
            if (this.mag <= 0) {
                this.reloadTimer = 1.6;
                return;
            }
            this.mag--;
            this.fireTimer = Math.max(0.11, (60 / Math.max(40, spec.rpm)) * (1.45 - this.difficulty.speedMult * 0.25));

            const start = new THREE.Vector3(this.pos.x, this.pos.y + 1.45, this.pos.z);
            const end = new THREE.Vector3(
                target.x + (Math.random() - 0.5) * dist * this.difficulty.accuracy * 2,
                target.y + (Math.random() - 0.5) * dist * this.difficulty.accuracy * 1.5,
                target.z + (Math.random() - 0.5) * dist * this.difficulty.accuracy * 2
            );

            const dScale = BO.Math.clamp(1 - this.pos.distanceTo(BO.Player.pos) / 40, 0, 0.75);
            if (dScale > 0.05) BO.Sound.playGunshot(spec.soundProfile, false, false, dScale);
            BO.FX.spawnTracer(start, end, 0xfca5a5, 0.02, 0.07);
            if (context.onRecordFx) context.onRecordFx({ kind: 'tracer', sx: start.x, sy: start.y, sz: start.z, ex: end.x, ey: end.y, ez: end.z, color: 0xfca5a5 });

            // Accuracy roll
            const hitProb = BO.Math.clamp(0.45 - dist * 0.008 + (0.08 / (this.difficulty.accuracy * 18)), 0.10, 0.65);
            if (Math.random() < hitProb) {
                const dmg = this.oneShotKills ? 9999 : Math.round(spec.damage * 0.42 * this.difficulty.dmgMult);
                if (target.kind === 'player') {
                    if (context.onBotShootPlayer) context.onBotShootPlayer(this, dmg);
                } else if (target.kind === 'remote_player' && BO.Net && BO.Net.active) {
                    BO.Net.sendToPeer(target.peerId, {
                        type: 'mp_hit_player',
                        targetPeerId: target.peerId,
                        dmg,
                        attackerCallsign: this.name,
                        attackerTeam: this.team,
                        weaponLabel: BO.WeaponsData.get(this.weaponId).shortName,
                        weaponId: this.weaponId,
                        isHead: false
                    });
                } else if (target.bot && target.bot.alive) {
                    const killed = target.bot.takeDamage(dmg, this);
                    if (killed && context.onBotKillBot) {
                        context.onBotKillBot(this, target.bot);
                    }
                }
            }
        }

        destroy() {
            if (this.parts && this.parts.root && BO.World.scene) {
                BO.World.scene.remove(this.parts.root);
            }
        }
    }

    BO.BotAI = BotAI;
})(window);
