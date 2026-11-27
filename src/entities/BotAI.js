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

            this.parts = BO.CharacterMesh.buildSoldier(BO.MPMode?.modeType === 'four_teams' && BO.State.activeMode === 'mp' ? this.team : Number(this.team !== 0), this);
            this.animPose = { aim: 0, recoil: 0, flinch: 0 };
            this.corpse = null;
            if (BO.State.activeMode === 'mp') this._addSquadMark();
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

        _addSquadMark() {
            const gear = this.parts.bodyPivot;
            const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
            this.squadMark = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.065, 0.025), material);
            this.squadMark.position.set(0.11, 0.46, 0.17);
            gear.add(this.squadMark);
            this._syncSquadMark();
        }

        _syncSquadMark() {
            const colors = [0x38bdf8, 0xef4444, 0xfbbf24, 0xc084fc];
            this.squadMark?.material.color.setHex(colors[this.team % colors.length]);
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
            for (const limb of this.corpse?.limbs || []) {
                limb.part.rotation.x = limb.baseX;
                limb.part.rotation.z = limb.baseZ;
            }
            this.corpse = null;
            this.parts.root.rotation.set(0, this.yaw, 0);
            this._syncSquadMark();
            this.parts.root.position.copy(this.pos);
            this.path = [];
        }

        takeDamage(dmg, attacker = null, impulse = null) {
            if (!this.alive) return false;
            this.hp -= dmg;
            this.animPose.flinch = 1;
            this.lastAttacker = attacker;
            if (this.hp <= 0) {
                this.hp = 0;
                this.alive = false;
                this.deaths++;
                this.respawnTimer = this.respawnDelay;
                if (BO.State.activeMode === 'mp') this._startCorpse(attacker, impulse ?? dmg);
                else this.parts.root.visible = false;
                BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 12, 0x991b1b, 4.2, 11, 0.45, 1.2);
                return true;
            }
            return false;
        }

        _startCorpse(attacker, force, snapshot = null) {
            const source = attacker === 'player' ? BO.Player.pos : attacker?.pos;
            const push = source ? this.pos.clone().sub(source).setY(0) : new THREE.Vector3();
            if (push.lengthSq() < 0.01) push.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
            const launched = snapshot ? !!snapshot[3] : BO.Cheats.isActive('ragdoll') || Math.random() < 0.01;
            const strength = BO.Math.clamp(force / 35, 1.2, 9);
            const velocity = push.normalize().multiplyScalar(launched ? 11 : strength).setY(launched ? 24 : 0.8 + strength * 0.31);
            if (snapshot) velocity.set(snapshot[0], snapshot[1], snapshot[2]);

            // Integrate around the torso rather than rotating the whole body around its feet.
            const parts = this.parts;
            const body = this.corpse = {
                center: this.pos.clone().add(new THREE.Vector3(0, 0.83, 0)),
                orientation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yaw, 0)),
                velocity, angular: new THREE.Vector3(velocity.z, launched ? 2.7 : 0.75, -velocity.x)
                    .multiplyScalar(launched ? 0.51 : 0.68),
                launched, age: 0, whistleAt: 0, bounce: 0,
                impulse: [velocity.x, velocity.y, velocity.z, Number(launched)],
                axis: new THREE.Vector3(), probe: new THREE.Vector3(),
                normal: new THREE.Vector3(), spin: new THREE.Quaternion(),
                limbs: [parts.armL, parts.armR, parts.legL, parts.legR, parts.headGroup].filter(Boolean).map((part, i) => ({
                    part, baseX: part.rotation.x, baseZ: part.rotation.z,
                    pitch: 0, roll: 0, dp: BO.Math.randRange(-5, 5), dr: BO.Math.randRange(-3, 3),
                    limit: i === 4 ? 0.48 : i < 2 ? 1.35 : 0.95,
                    restPitch: i < 2 ? 0.45 : -0.12,
                    restRoll: (i % 2 ? 1 : -1) * (i < 2 ? 0.32 : 0.10)
                }))
            };
            if (launched) this.respawnTimer = Math.max(3.15, this.respawnTimer);
            this._poseCorpse(body);
        }

        _poseCorpse(body) {
            const root = this.parts.root;
            root.quaternion.copy(body.orientation);
            root.position.copy(body.center).addScaledVector(body.axis.set(0, 1, 0).applyQuaternion(body.orientation), -0.83);
        }

        _stepCorpse(body, step) {
            const { velocity, angular, axis, center, orientation, spin, normal, probe } = body;
            const prevFoot = center.y - (0.20 + Math.abs(axis.set(0, 1, 0).applyQuaternion(orientation).y) * 0.63);
            const spinSpeed = angular.length();
            if (spinSpeed > 0.001) {
                spin.setFromAxisAngle(normal.copy(angular).divideScalar(spinSpeed), spinSpeed * step);
                orientation.premultiply(spin).normalize();
            }
            axis.set(0, 1, 0).applyQuaternion(orientation);
            const vertical = 0.20 + Math.abs(axis.y) * 0.63;
            const horizontal = 0.22 + Math.sqrt(Math.max(0, 1 - axis.y * axis.y)) * 0.32;

            velocity.y -= 18 * step;
            center.addScaledVector(velocity, step);
            probe.set(center.x, center.y - vertical, center.z);
            BO.World.resolveHorizontal(probe, horizontal, vertical * 2, false);
            normal.set(probe.x - center.x, 0, probe.z - center.z);
            const wallImpact = normal.lengthSq() > 0.000001;
            let contactImpulse = 0;
            if (wallImpact) {
                normal.normalize();
                const toward = velocity.dot(normal);
                if (toward < 0) {
                    velocity.addScaledVector(normal, -toward * 1.32);
                    angular.x += normal.z * toward * 0.32;
                    angular.z -= normal.x * toward * 0.32;
                    contactImpulse = Math.min(3.5, -toward * 0.32);
                }
                center.x = probe.x;
                center.z = probe.z;
            }

            const floor = BO.World.getGroundHeight(center.x, center.z, prevFoot);
            const onFloor = center.y < floor + vertical && velocity.y <= 0;
            let settled = false;
            if (onFloor) {
                center.y = floor + vertical;
                const impact = -velocity.y;
                settled = impact < 1.65 || body.bounce >= 3;
                velocity.y = settled ? 0 : Math.min(6.2, impact * 0.29);
                if (!settled) {
                    body.bounce++;
                    contactImpulse += Math.min(4.5, impact * 0.26);
                    angular.x += velocity.z * 0.36;
                    angular.z -= velocity.x * 0.36;
                    velocity.x *= 0.77;
                    velocity.z *= 0.77;
                } else {
                    velocity.x *= Math.exp(-6.5 * step);
                    velocity.z *= Math.exp(-6.5 * step);
                    normal.set(axis.x, 0, axis.z);
                    if (normal.lengthSq() > 0.001) {
                        spin.setFromUnitVectors(axis, normal.normalize());
                        angular.multiplyScalar(Math.exp(-7.5 * step));
                        center.y = Math.max(floor + 0.20, center.y - Math.abs(axis.y) * 0.63 * Math.min(1, step * 6));
                        orientation.premultiply(spin.slerp(new THREE.Quaternion(), Math.exp(-6 * step))).normalize();
                    }
                }
            } else {
                velocity.x *= Math.exp(-0.12 * step);
                velocity.z *= Math.exp(-0.12 * step);
                angular.multiplyScalar(Math.exp(-0.34 * step));
            }

            for (const [i, limb] of body.limbs.entries()) {
                const side = i % 2 ? 1 : -1;
                const damping = Math.exp(-(settled ? 9 : 3.5) * step);
                limb.dp = (limb.dp + ((settled ? limb.restPitch : 0) - limb.pitch) * 16 * step + contactImpulse * side) * damping;
                limb.dr = (limb.dr + ((settled ? limb.restRoll : 0) - limb.roll) * 13 * step + contactImpulse * 0.60 * side) * damping;
                limb.pitch = BO.Math.clamp(limb.pitch + limb.dp * step, -limb.limit, limb.limit);
                limb.roll = BO.Math.clamp(limb.roll + limb.dr * step, -limb.limit * 0.55, limb.limit * 0.55);
                limb.part.rotation.x = limb.baseX + limb.pitch;
                limb.part.rotation.z = limb.baseZ + limb.roll;
            }
        }

        updateCorpse(dt) {
            const body = this.corpse;
            if (!body) return;
            body.age += dt;
            if (body.age >= 5) {
                this.parts.root.visible = false;
                body.impulse = null;
                return;
            }
            const elapsed = Math.min(dt, 0.10);
            const steps = Math.max(1, Math.ceil(elapsed * 120));
            for (let i = 0; i < steps; i++) this._stepCorpse(body, elapsed / steps);
            this._poseCorpse(body);
            if (body.launched && body.age < 1.55 && body.age >= body.whistleAt) {
                body.whistleAt += 0.16;
                const { pan, gain } = BO.Sound._spatialMetrics(body.center, 65);
                const pitch = 1750 - body.age * 680;
                if (gain > 0.01) BO.Sound.playSpatialTone(pitch, pitch - 112, 0.2, 'sine', gain * 0.17, pan);
            }
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
                if (context.playerConcealed || !context.playerAlive || BO.Player.aetherActive || this.powerAlly || this.team === context.playerTeam) this.cachedTarget = null;
                else Object.assign(target, { x: context.playerPos.x, y: context.playerPos.y + 1.25, z: context.playerPos.z });
            } else if (target?.bot) {
                if (!target.bot.alive || !this.isHostile(target.bot, context.modeType)) this.cachedTarget = null;
                else Object.assign(target, { x: target.bot.pos.x, y: target.bot.pos.y + 1.25, z: target.bot.pos.z });
            }

            let moveSpeed = 0;
            if (target && this.cachedTarget) {
                const moveScale = this.powerMoveScale || 1;
                const tKey = target.kind === 'player' ? 'player' : (target.peerId || 'bot_' + target.bot?.id);
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
                const melee = BO.WeaponsData.get(this.weaponId).kind === 'melee';
                if (dist > (melee ? 1.55 : 14)) {
                    const advance = (melee ? 5.5 : 2.6) * this.speedScale * moveScale * dt;
                    this.pos.x += dx / dist * advance;
                    this.pos.z += dz / dist * advance;
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
                    if (this.post) {
                        // Guards and patrols hold a post instead of roaming the whole map.
                        const a = Math.random() * Math.PI * 2, r = Math.random() * this.post.r;
                        this.roamGoal = { x: this.post.x + Math.cos(a) * r, y: this.post.y, z: this.post.z + Math.sin(a) * r };
                        this.pathTimer = 3 + Math.random() * 5;
                    } else if (context.objectivePos && Math.random() < 0.72) {
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
            const pose = this.animPose;
            pose.aim += ((this.cachedTarget ? 1 : 0) - pose.aim) * Math.min(1, 9 * dt);
            pose.recoil = Math.max(0, pose.recoil - dt * 7);
            pose.flinch = Math.max(0, pose.flinch - dt * 5);
            BO.CharacterMesh.animateLimbs(this.parts, moveSpeed, this.animPhase, pose.recoil * 0.34, pose.flinch * 0.48);
            if (BO.State.activeMode === 'mp') {
                const { bodyPivot, armL, armR, headGroup } = this.parts;
                const reloadPose = this.reloadTimer > 0 ? Math.sin(Math.min(1, this.reloadTimer / 1.6) * Math.PI) : 0;
                bodyPivot.rotation.z += (this.cachedTarget ? this.strafeDir : 0) * pose.aim * 0.085;
                bodyPivot.position.y -= reloadPose * 0.035;
                bodyPivot.rotation.x += Math.min(0.12, moveSpeed * 0.019) - pose.aim * 0.03;
                headGroup.rotation.y = Math.sin(this.animPhase * 0.45) * (1 - pose.aim) * 0.14;
                armL.rotation.x += pose.aim * -0.14 + reloadPose * 0.46;
                armR.rotation.x += pose.aim * -0.21 + reloadPose * 0.4 - pose.recoil * 0.17;
                armR.rotation.z = reloadPose * 0.34;
            }
        }

        isHostile(other, modeType) {
            const isFFA = modeType === 'ffa' || modeType === 'gun_game' || modeType === 'bounty';
            const ownTeam = this.powerAlly ? 0 : this.team;
            const otherTeam = other.powerAlly ? 0 : other.team;
            return isFFA ? !(ownTeam === 0 && otherTeam === 0) : ownTeam !== otherTeam;
        }

        canKeepTarget(target, context) {
            const playerTarget = target.kind === 'player';
            if (playerTarget && (context.playerConcealed || !context.playerAlive || BO.Player.aetherActive || this.powerAlly || this.team === context.playerTeam)) return false;
            if (!playerTarget && (!target.bot?.alive || !this.isHostile(target.bot, context.modeType))) return false;
            const pos = playerTarget ? context.playerPos : target.bot.pos;
            const range = playerTarget && BO.Player.mpPerks.includes('ghost') ? 26 : 42;
            if (BO.Combat.smokeBlocks(this.pos.x, this.pos.y + 1.5, this.pos.z, pos.x, pos.y + 1.35, pos.z)) return false;
            return this.pos.distanceTo(pos) < range &&
                BO.World.hasLineOfSight(this.pos.x, this.pos.y + 1.5, this.pos.z, pos.x, pos.y + 1.35, pos.z);
        }

        _acquireTarget(context) {
            let best = null;
            let bestDist = 42;
            const myEyeY = this.pos.y + 1.5;

            const isFFA = context.modeType === 'ffa' || context.modeType === 'gun_game' || context.modeType === 'bounty';

            // Check player
            if (context.playerAlive && !BO.Player.aetherActive) {
                const hostileToPlayer = !context.playerConcealed && !this.powerAlly && (isFFA || this.team !== context.playerTeam);
                if (hostileToPlayer) {
                    const p = context.playerPos;
                    const d = BO.Math.dist3D(this.pos.x, this.pos.y, this.pos.z, p.x, p.y, p.z);
                    const stealthRange = BO.Player.mpPerks.includes('ghost') ? 26 : 42;
                    if (d < Math.min(bestDist, stealthRange) &&
                        !BO.Combat.smokeBlocks(this.pos.x, myEyeY, this.pos.z, p.x, p.y + 1.35, p.z) &&
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
                if (d < bestDist && !BO.Combat.smokeBlocks(this.pos.x, myEyeY, this.pos.z, o.pos.x, o.pos.y + 1.35, o.pos.z) &&
                    BO.World.hasLineOfSight(this.pos.x, myEyeY, this.pos.z, o.pos.x, o.pos.y + 1.35, o.pos.z)) {
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
                this.animPose.recoil = 1;
                if (dist > 2.4) return;
                this.fireTimer = 0.65;
                BO.Sound.playMelee();
                const dmg = this.oneShotKills ? 9999 : Math.round(spec.damage * 0.45 * this.difficulty.dmgMult);
                if (target.kind === 'player' && context.onBotShootPlayer) context.onBotShootPlayer(this, dmg);
                else if (target.bot && target.bot.alive && target.bot.takeDamage(dmg, this) && context.onBotKillBot) context.onBotKillBot(this, target.bot);
                return;
            }
            if (this.mag <= 0 && !(BO.State.activeMode === 'mp' && BO.MPMode.bountyHolder === this)) {
                this.reloadTimer = 1.6;
                return;
            }
            const holdsBounty = BO.State.activeMode === 'mp' && BO.MPMode.bountyHolder === this;
            if (!holdsBounty) this.mag--;
            this.animPose.recoil = 1;
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
            this.squadMark?.material.dispose();
            this.squadMark?.geometry.dispose();
            if (this.parts && this.parts.root && BO.World.scene) {
                BO.World.scene.remove(this.parts.root);
            }
        }
    }

    BO.BotAI = BotAI;
})(window);
