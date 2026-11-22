/* ============================================================================
   BLACKOUT OPS — 20-Zombie & 5-Boss Entity AI
   Supports unique stats (HP, speed, attack, defense, resistances), movement
   habits (zig-zag, hop, leap, charge, flank, hover, teleport blink), ranged
   projectiles, shockwaves, suicide blasts, life drain, and freeze shatter.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    class ZombieEntity {
        constructor(opts) {
            this.id = opts.id;
            this.spec = opts.spec || BO.ZombiesData.get(opts.type || 'shambler');
            this.type = this.spec.id;
            this.isBoss = !!this.spec.isBoss;
            this.round = opts.round || 1;

            this.maxHp = opts.hp || this.spec.hp || 150;
            this.hp = this.maxHp;
            this.speed = opts.speed || this.spec.speed || 2.1;
            this.damage = opts.damage || this.spec.attack || 30;
            this.defense = this.spec.defense || 0;
            this.resistances = this.spec.resistances || { bullet: 1, explosive: 1, fire: 1, headshot: 1, melee: 1 };
            this.movementHabit = this.spec.movementHabit || 'lumber';
            this.attackType = this.spec.attackType || 'melee';
            this.soundProfile = this.spec.soundProfile || 'groan_mid';

            this.alive = true;
            this.stunTimer = 0;
            this.frozenTimer = 0;
            this.danceTimer = 0;
            this.burnTimer = 0;
            this.flinchTimer = 0;
            this.decapitated = false;
            this.deathTimer = 0;

            this.pos = new THREE.Vector3(opts.x, opts.y || 0, opts.z);
            this.vel = new THREE.Vector3(0, 0, 0);
            this.yaw = 0;
            const sc = (this.spec.bodySpec && this.spec.bodySpec.scale) || [1, 1, 1];
            this.radius = BO.Math.clamp(0.38 * sc[0], 0.30, 0.85);
            this.height = this.spec.bodySpec?.missingLegs && !this.spec.bodySpec?.floating ? 0.85 : (1.75 * sc[1]);

            this.windowInteractive = opts.windowInteractive || null;
            this.state = this.windowInteractive ? 'approach_window' : 'chase';
            this.tearTimer = 0.8;
            this.vaultTimer = 0;
            this.attackCooldown = 0;
            this.rangedCooldown = 2.0 + Math.random() * 2.0;
            this.habitTimer = 1.5 + Math.random() * 2.0;
            this.habitPhase = Math.random() * Math.PI * 2;
            this.attackSwing = 0;
            this.groanTimer = 2.0 + Math.random() * 5.0;
            this.animPhase = Math.random() * Math.PI * 2;

            this.path = [];
            this.pathTimer = 0;

            this.parts = BO.CharacterMesh.buildZombieFromSpec(this.spec, this);
            this.parts.root.position.copy(this.pos);
            if (this.parts.headGroup && BO.Cheats && BO.Cheats.isActive('bighead')) {
                this.parts.headGroup.scale.setScalar(3.0);
            }
            if (this.parts.bodyPivot) {
                this.parts.bodyPivot.userData.baseY = this.parts.bodyPivot.position.y;
                this.parts.bodyPivot.userData.baseRotX = this.parts.bodyPivot.rotation.x;
            }
            BO.World.scene.add(this.parts.root);
        }

        getHitboxMeshes() {
            const list = [];
            this.parts.root.traverse((obj) => {
                if (obj.isMesh && obj.userData.entity === this) list.push(obj);
            });
            return list;
        }

        takeDamage(amount, hitbox = 'torso', isCrit = false, dirVec = null, damageKind = 'bullet') {
            if (!this.alive) return false;

            let dmg = amount;
            // Apply defense stat (flat reduction percentage)
            dmg *= (1 - BO.Math.clamp(this.defense, 0, 0.70));

            // Apply specific damage resistance
            const res = this.resistances;
            if (damageKind === 'explosive') dmg *= (res.explosive ?? 1.0);
            else if (damageKind === 'fire') dmg *= (res.fire ?? 1.0);
            else if (damageKind === 'melee') dmg *= (res.melee ?? 1.0);
            else dmg *= (res.bullet ?? 1.0);

            if (hitbox === 'shield') {
                dmg *= 0.25;
                BO.Sound.playZombieGroan('metal_clang', 0.45);
            } else if (hitbox === 'head') {
                if (this.spec.bodySpec?.headless) {
                    dmg *= 0.7; // No head to crit!
                } else {
                    dmg *= (res.headshot ?? 1.0);
                }
            }

            // Frozen shatter bonus (Absolute Zero ultimate!)
            if (this.frozenTimer > 0) {
                dmg *= 2.5;
            }

            this.hp -= Math.max(1, dmg);
            this.flinchTimer = this.isBoss ? 0.06 : 0.16;

            if (dirVec && !this.isBoss) {
                const kb = this.defense > 0.25 ? 1.1 : 2.4;
                this.vel.x += dirVec.x * kb;
                this.vel.z += dirVec.z * kb;
            }

            if (this.hp <= 0) {
                this.hp = 0;
                this.alive = false;
                this.deathTimer = this.isBoss ? 2.6 : 1.5;
                if (hitbox === 'head' && !this.spec.bodySpec?.quadruped && !this.spec.bodySpec?.headless && this.parts.headGroup) {
                    this.decapitated = true;
                    this.parts.headGroup.visible = false;
                    const bloodLv = (BO.Settings && BO.Settings.get('bloodLevel')) || 'normal';
                    if (bloodLv !== 'off') {
                        const cnt = bloodLv === 'ultra' ? 28 : 14;
                        BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), cnt, 0x991b1b, 4.8, 12, 0.55, 1.3);
                    }
                }
                if (this.attackType === 'toxic_cloud' && !this.decapitated) {
                    BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 18, 0x4ade80, 3.8, 1.2, 1.0, 2.2);
                }
                if (this.attackType === 'suicide_blast') {
                    BO.FX.spawnExplosion(this.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 4.2, 0xa3e635);
                    BO.Sound.playExplosion(0.65);
                    if (this.pos.distanceTo(BO.Player.pos) < 4.2) {
                        BO.Player.takeDamage(this.damage * 0.85, this.pos, true);
                    }
                }
                return true;
            }
            return false;
        }

        update(dt, allZombies, callbacks) {
            // callbacks: { onMeleePlayer, onRangedAttack }
            if (!this.alive) {
                this.deathTimer -= dt;
                const fall = BO.Math.clamp(1 - this.deathTimer / (this.isBoss ? 2.6 : 1.5), 0, 1);
                this.parts.root.rotation.x = BO.Math.lerp(0, -Math.PI * 0.48, Math.min(1, fall * 4));
                this.parts.root.position.y = this.pos.y - Math.max(0, fall - 0.65) * 1.2;
                return this.deathTimer > 0;
            }

            if (this.stunTimer > 0) this.stunTimer -= dt;
            if (this.frozenTimer > 0) this.frozenTimer -= dt;
            if (this.danceTimer > 0) this.danceTimer -= dt;
            if (this.flinchTimer > 0) this.flinchTimer -= dt;
            if (this.attackCooldown > 0) this.attackCooldown -= dt;
            if (this.rangedCooldown > 0) this.rangedCooldown -= dt;
            if (this.attackSwing > 0) this.attackSwing = Math.max(0, this.attackSwing - dt * 2.5);
            this.habitPhase += dt * 4.5;

            if (this.burnTimer > 0) {
                this.burnTimer -= dt;
                const fireMult = this.resistances.fire ?? 1.0;
                this.hp -= 35 * fireMult * dt;
                if (Math.random() < 0.22) {
                    BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 1, 0xf97316, 1.4, -1.5, 0.3, 0.9);
                }
                if (this.hp <= 0) {
                    this.takeDamage(10, 'torso', false, null, 'fire');
                    return true;
                }
            }

            const P = BO.Player;
            this.groanTimer -= dt;
            if (this.groanTimer <= 0) {
                this.groanTimer = 3.5 + Math.random() * 6.0;
                const dScale = BO.Math.clamp(1 - this.pos.distanceTo(P.pos) / 30, 0, 0.9);
                if (dScale > 0.08) BO.Sound.playZombieGroan(this.soundProfile, dScale);
            }

            // Physics & Gravity
            this.vel.y -= 22.0 * dt;
            this.vel.x = BO.Math.damp(this.vel.x, 0, 6.5, dt);
            this.vel.z = BO.Math.damp(this.vel.z, 0, 6.5, dt);
            this.pos.x += this.vel.x * dt;
            this.pos.z += this.vel.z * dt;
            this.pos.y += this.vel.y * dt;

            const floorY = BO.World.getGroundHeight(this.pos.x, this.pos.z, this.pos.y);
            if (this.pos.y < floorY) {
                this.pos.y = floorY;
                this.vel.y = 0;
            }

            if (this.danceTimer > 0) {
                const t = performance.now() * 0.015;
                this.yaw += dt * 7.5;
                this.parts.root.rotation.y = this.yaw;
                this.parts.root.position.set(this.pos.x, this.pos.y + Math.abs(Math.sin(t)) * 0.35, this.pos.z);
                if (this.parts.leftArmPivot) this.parts.leftArmPivot.rotation.x = -2.3 + Math.sin(t * 1.4) * 0.65;
                if (this.parts.rightArmPivot) this.parts.rightArmPivot.rotation.x = -2.3 - Math.sin(t * 1.4) * 0.65;
                if (Math.random() < 0.18) {
                    BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 1.8, 0)), 1, 0xe879f9, 2.5, 1, 0.35, 1.1);
                }
                return true;
            }

            if (this.stunTimer > 0 || this.frozenTimer > 0) {
                this.parts.root.position.copy(this.pos);
                return true;
            }

            let moveSpeed = 0;
            if (this.state === 'approach_window' && this.windowInteractive) {
                const w = this.windowInteractive.data;
                const tx = w.outside[0], tz = w.outside[2];
                if (BO.Math.dist2D(this.pos.x, this.pos.z, tx, tz) > 0.55) {
                    this._steerToward(tx, tz, this.speed, dt, []);
                    moveSpeed = this.speed;
                } else {
                    this.state = this.windowInteractive.planksRemaining > 0 ? 'tearing_plank' : 'vault_window';
                    this.tearTimer = 0.75;
                    this.vaultTimer = 0.65;
                }
            } else if (this.state === 'tearing_plank' && this.windowInteractive) {
                const win = this.windowInteractive;
                const w = win.data;
                this.yaw = Math.atan2(w.inside[0] - this.pos.x, w.inside[2] - this.pos.z);
                if (win.planksRemaining > 0) {
                    this.tearTimer -= dt;
                    if (this.tearTimer <= 0) {
                        this.tearTimer = 0.9;
                        this.attackSwing = 1.0;
                        win.planksRemaining--;
                        const pm = win.plankMeshes[win.planksRemaining];
                        if (pm) pm.visible = false;
                        BO.Sound.playReload('out');
                        if (win.planksRemaining <= 0) {
                            this.state = 'vault_window';
                            this.vaultTimer = 0.65;
                        }
                    }
                } else {
                    this.state = 'vault_window';
                    this.vaultTimer = 0.65;
                }
            } else if (this.state === 'vault_window' && this.windowInteractive) {
                const w = this.windowInteractive.data;
                this.vaultTimer -= dt;
                const frac = BO.Math.clamp(1 - this.vaultTimer / 0.65, 0, 1);
                this.pos.x = BO.Math.lerp(w.outside[0], w.inside[0], frac);
                this.pos.z = BO.Math.lerp(w.outside[2], w.inside[2], frac);
                this.pos.y = (w.outside[1] || w.y || 0) + Math.sin(frac * Math.PI) * 0.85;
                this.yaw = Math.atan2(w.inside[0] - w.outside[0], w.inside[2] - w.outside[2]);
                moveSpeed = 2.0;
                if (this.vaultTimer <= 0) {
                    this.pos.set(w.inside[0], w.inside[1] || 0, w.inside[2]);
                    this.state = 'chase';
                }
            } else {
                const monkey = BO.Combat.activeMonkeyBomb;
                const customTarget = (!monkey && !P.aetherActive && callbacks && callbacks.getTarget) ? callbacks.getTarget(this) : null;
                let tx = P.pos.x, ty = P.pos.y, tz = P.pos.z;
                let chasingMonkey = false;

                if (monkey) {
                    tx = monkey.pos.x; ty = monkey.pos.y; tz = monkey.pos.z;
                    chasingMonkey = true;
                } else if (customTarget) {
                    tx = customTarget.x; ty = customTarget.y; tz = customTarget.z;
                } else if (P.aetherActive) {
                    tx = this.pos.x + Math.sin(this.id + performance.now() * 0.001) * 4;
                    tz = this.pos.z + Math.cos(this.id + performance.now() * 0.001) * 4;
                }

                const distToTarget = BO.Math.dist3D(this.pos.x, this.pos.y, this.pos.z, tx, ty, tz);
                const attackRange = (customTarget && customTarget.attackRange !== undefined)
                    ? customTarget.attackRange
                    : (this.isBoss ? 2.45 : (this.attackType === 'shockwave_slam' ? 2.2 : 1.58));

                // Special Ranged Attacks (Acid Spit, Fire Bolt, Frost Shard, Life Drain, Aether Bolt)
                const isRanged = ['acid_spit', 'fire_bolt', 'frost_shard', 'life_drain', 'aether_bolt'].includes(this.attackType);
                if (!chasingMonkey && !customTarget && !P.aetherActive && P.alive && isRanged && distToTarget > 3.5 && distToTarget < 22 && this.rangedCooldown <= 0) {
                    if (BO.World.hasLineOfSight(this.pos.x, this.pos.y + 1.3, this.pos.z, tx, ty + 1.2, tz)) {
                        this.rangedCooldown = this.isBoss ? 2.4 : 3.8;
                        this.attackSwing = 1.0;
                        if (callbacks && callbacks.onRangedAttack) callbacks.onRangedAttack(this, tx, ty + 1.15, tz);
                    }
                }

                // Special Movement Habits (Hop, Leap Pounce, Teleport Blink, Bull Charge)
                this.habitTimer -= dt;
                if (!chasingMonkey && !P.aetherActive && this.habitTimer <= 0 && distToTarget < 15) {
                    if (this.movementHabit === 'hop_erratic' || this.movementHabit === 'leap_pounce') {
                        this.habitTimer = 2.4 + Math.random() * 1.4;
                        if (this.pos.y <= floorY + 0.1) {
                            const dx = tx - this.pos.x, dz = tz - this.pos.z;
                            const d = Math.max(0.1, Math.hypot(dx, dz));
                            this.vel.y = this.movementHabit === 'leap_pounce' ? 6.8 : 5.2;
                            this.vel.x += (dx / d) * (this.movementHabit === 'leap_pounce' ? 7.5 : 3.5);
                            this.vel.z += (dz / d) * (this.movementHabit === 'leap_pounce' ? 7.5 : 3.5);
                        }
                    } else if (this.movementHabit === 'teleport_blink' && !(callbacks && callbacks.preventBlink) && distToTarget > 4.5) {
                        this.habitTimer = this.isBoss ? 3.8 : 4.8;
                        const dx = tx - this.pos.x, dz = tz - this.pos.z;
                        const d = Math.max(0.1, Math.hypot(dx, dz));
                        const step = Math.min(4.8, d - 2.4);
                        BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 10, 0xc084fc, 4, 2, 0.4, 1.4);
                        this.pos.x += (dx / d) * step;
                        this.pos.z += (dz / d) * step;
                        BO.World.resolveHorizontal(this.pos, this.radius, this.height, false);
                        BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 10, 0xc084fc, 4, 2, 0.4, 1.4);
                        BO.Sound.playZombieGroan('wail_void', 0.6);
                    }
                }

                if (!chasingMonkey && !P.aetherActive && distToTarget <= attackRange && (customTarget || P.alive)) {
                    this.yaw = Math.atan2(tx - this.pos.x, tz - this.pos.z);
                    if (this.attackCooldown <= 0) {
                        this.attackCooldown = this.attackType === 'double_claw' ? 0.65 : (this.isBoss ? 1.25 : 1.15);
                        this.attackSwing = 1.0;
                        if (this.attackType === 'suicide_blast' && !customTarget) {
                            this.takeDamage(99999, 'torso', false);
                            return true;
                        }
                        if (this.attackType === 'shockwave_slam') {
                            BO.FX.spawnExplosion(this.pos.clone(), 3.2, 0xf59e0b);
                            BO.Player.cameraShake = Math.max(BO.Player.cameraShake, 0.06);
                        }
                        if (this.attackType === 'life_drain') {
                            this.hp = Math.min(this.maxHp, this.hp + 45);
                        }
                        if (customTarget) {
                            if (callbacks && callbacks.onAttackCustomTarget) callbacks.onAttackCustomTarget(this, customTarget);
                        } else {
                            if (callbacks && callbacks.onMeleePlayer) callbacks.onMeleePlayer(this);
                        }
                    }
                } else if (chasingMonkey && distToTarget < 1.3) {
                    this.yaw = Math.atan2(tx - this.pos.x, tz - this.pos.z);
                } else {
                    this.pathTimer -= dt;
                    const forceDirect = !!(customTarget && customTarget.forceDirect);
                    const directLOS = forceDirect || (Math.abs(this.pos.y - ty) < 1.0 &&
                        BO.World.hasLineOfSight(this.pos.x, this.pos.y + 1.0, this.pos.z, tx, ty + 1.0, tz));

                    let goalX = tx, goalZ = tz;
                    if (!directLOS) {
                        if (this.pathTimer <= 0 || this.path.length === 0) {
                            this.pathTimer = 0.55 + Math.random() * 0.25;
                            this.path = BO.World.findPath(this.pos.x, this.pos.y, this.pos.z, tx, ty, tz, false);
                        }
                        while (this.path.length > 1 && BO.Math.dist2D(this.pos.x, this.pos.z, this.path[0].x, this.path[0].z) < 1.1) {
                            this.path.shift();
                        }
                        if (this.path.length > 0) {
                            goalX = this.path[0].x;
                            goalZ = this.path[0].z;
                        }
                    }

                    // Lateral sway for zig_zag / flank_circle habits
                    if (directLOS && !forceDirect && (this.movementHabit === 'zig_zag' || this.movementHabit === 'flank_circle') && distToTarget > 2.5) {
                        const dx = goalX - this.pos.x, dz = goalZ - this.pos.z;
                        const d = Math.max(0.1, Math.hypot(dx, dz));
                        const perpX = -dz / d, perpZ = dx / d;
                        const side = this.movementHabit === 'zig_zag' ? Math.sin(this.habitPhase) * 2.2 : 2.6;
                        goalX += perpX * side;
                        goalZ += perpZ * side;
                    }

                    const chargeBoost = (this.movementHabit === 'charge_bull' && directLOS && distToTarget < 12) ? 1.35 : 1.0;
                    const curSpeed = this.speed * chargeBoost * (this.flinchTimer > 0 ? 0.58 : 1.0);
                    this._steerToward(goalX, goalZ, curSpeed, dt, allZombies);
                    // Snap onto rising stairs/ramps BEFORE horizontal wall resolution so zombies climb cleanly!
                    const stepFloor = BO.World.getGroundHeight(this.pos.x, this.pos.z, this.pos.y);
                    if (stepFloor > this.pos.y) {
                        this.pos.y = stepFloor;
                        if (this.vel.y < 0) this.vel.y = 0;
                    }
                    BO.World.resolveHorizontal(this.pos, this.radius, this.height, false);
                    moveSpeed = curSpeed;
                }
            }

            if (this.parts.headGroup) {
                const bh = (BO.Cheats && BO.Cheats.isActive('bighead')) ? 3.0 : 1.0;
                if (this.parts.headGroup.scale.x !== bh) this.parts.headGroup.scale.setScalar(bh);
            }
            this.animPhase += dt * (moveSpeed * 2.4 + 1.5);
            const hoverOffset = this.movementHabit === 'hover_drift' ? Math.sin(this.habitPhase) * 0.16 : 0;
            this.parts.root.position.set(this.pos.x, this.pos.y + hoverOffset, this.pos.z);
            this.parts.root.rotation.y = this.yaw;
            BO.CharacterMesh.animateLimbs(this.parts, moveSpeed, this.animPhase, this.attackSwing, this.flinchTimer > 0 ? 1 : 0);

            return true;
        }

        _steerToward(gx, gz, speed, dt, allZombies) {
            let dx = gx - this.pos.x;
            let dz = gz - this.pos.z;
            const len = Math.hypot(dx, dz);
            if (len > 0.001) { dx /= len; dz /= len; }

            let sepX = 0, sepZ = 0;
            for (let i = 0; i < allZombies.length; i++) {
                const o = allZombies[i];
                if (o === this || !o.alive || o.state !== 'chase') continue;
                const ox = this.pos.x - o.pos.x;
                const oz = this.pos.z - o.pos.z;
                const dSq = ox * ox + oz * oz;
                if (dSq > 0.0001 && dSq < 0.85) {
                    const inv = (0.92 - Math.sqrt(dSq)) / Math.sqrt(dSq);
                    sepX += ox * inv;
                    sepZ += oz * inv;
                }
            }

            const mx = dx + sepX * 0.9;
            const mz = dz + sepZ * 0.9;
            const mLen = Math.hypot(mx, mz);
            if (mLen > 0.001) {
                this.pos.x += (mx / mLen) * speed * dt;
                this.pos.z += (mz / mLen) * speed * dt;
                const diff = BO.Math.angleDiff(this.yaw, Math.atan2(mx, mz));
                this.yaw += diff * Math.min(1, dt * 10);
            }
        }

        destroy() {
            if (this.parts && this.parts.root && BO.World.scene) {
                BO.World.scene.remove(this.parts.root);
            }
        }
    }

    BO.ZombieEntity = ZombieEntity;
})(window);
