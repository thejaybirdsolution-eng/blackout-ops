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
            this.isSuperBoss = !!this.spec.isSuperBoss;
            this.superMechanic = this.spec.superMechanic || null;
            this.superTimer = 4.2 + Math.random() * 1.4;
            this.superEnraged = false;
            this.wardTimer = 0;
            this._superBolts = [];
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
            this.height = this.isSuperBoss ? 2.15 : (this.spec.bodySpec?.missingLegs && !this.spec.bodySpec?.floating ? 0.85 : (1.75 * sc[1]));

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

            // TD Modifiers & Special Attributes
            this.hasGun = !!opts.hasGun;
            this.isMagical = !!(opts.isMagical || this.spec.isMagical);
            this.explosiveDeath = !!opts.explosiveDeath;
            this.sizeMult = opts.sizeMult || 1.0;
            this.splitCount = opts.isSplitChild ? 0 : (opts.splitCount ?? (this.spec.splitCount || 0));
            this.isSplitChild = !!opts.isSplitChild;
            this.jumpChance = opts.jumpChance ?? (this.spec.jumpChance || 0);
            this.jumpTimer = 1.5 + Math.random() * 2.5;
            this._stuckCheckTimer = 0.45;
            this._stuckAccum = 0;
            this._lastCheckX = this.pos.x;
            this._lastCheckZ = this.pos.z;
            this._sidestepTimer = 0;
            this._sidestepSign = Math.random() < 0.5 ? 1 : -1;
            this.gunCooldown = 1.6 + Math.random() * 2.2;
            this.magicCooldown = 2.5 + Math.random() * 2.5;
            this.healCooldown = 3.5 + Math.random() * 3.0;
            this.acidTimer = 0;
            this.slowTimer = 0;

            this.parts = BO.CharacterMesh.buildZombieFromSpec(this.spec, this);
            this.parts.root.position.copy(this.pos);
            if (this.sizeMult !== 1.0) {
                this.parts.root.scale.setScalar(this.sizeMult);
                this.radius = BO.Math.clamp(this.radius * this.sizeMult, 0.24, 1.35);
            }
            if (this.hasGun && this.parts.rightArmPivot && BO.WeaponMesh) {
                try {
                    const gunId = this.isBoss ? 'm249' : (Math.random() < 0.5 ? 'ak47' : 'mp5');
                    const wBuilt = BO.WeaponMesh.buildWeapon(gunId, {}, 'default', false, false);
                    wBuilt.root.scale.setScalar(0.95);
                    wBuilt.root.position.set(0, -0.42, 0.28);
                    wBuilt.root.rotation.set(0.15, Math.PI, 0);
                    this.parts.rightArmPivot.add(wBuilt.root);
                } catch (e) {}
            }
            if (this.isMagical) {
                const aura = new THREE.Mesh(
                    new THREE.TorusGeometry(0.62, 0.05, 6, 18),
                    new THREE.MeshBasicMaterial({ color: 0xc084fc })
                );
                aura.rotation.x = Math.PI * 0.5;
                aura.position.y = 1.1;
                this.parts.root.add(aura);
                this._magicAura = aura;
            }
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
            } else if (this.wardTimer > 0 && hitbox !== 'head') {
                dmg *= 0.45;
                BO.Sound.playZombieGroan('metal_clang', 0.35);
            } else if (hitbox === 'head') {
                if (this.spec.bodySpec?.headless) {
                    dmg *= 0.7; // No head to crit!
                } else {
                    dmg *= (res.headshot ?? 1.0);
                }
            }

            // Frozen shatter bonus (Absolute Zero ultimate!) & Corrosive Acid vulnerability
            if (this.frozenTimer > 0) {
                dmg *= 2.5;
            }
            if (this.acidTimer > 0) {
                dmg *= 1.45;
            }

            this.hp -= Math.max(1, dmg);
            this.flinchTimer = this.isSuperBoss ? 0.03 : (this.isBoss ? 0.06 : 0.16);

            if (this.isSuperBoss && !this.superEnraged && this.hp > 0 && this.hp <= this.maxHp * 0.50) {
                this.superEnraged = true;
                this.speed *= 1.24;
                this.superTimer = Math.min(this.superTimer, 0.85);
                if (this.superMechanic === 'seraph_nova') this.wardTimer = 4.5;
                const auraCol = this.spec.bodySpec?.eyeColor || 0xfbbf24;
                BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 2.5, 0)), 26, auraCol, 6.5, 3, 0.75, 1.6);
                BO.Sound.playZombieGroan(this.soundProfile, 1.0);
                BO.Events.emit('hud:toast', {
                    text: `👑 ${this.spec.name} ENRAGED — PHASE II UNLEASHED!`,
                    color: '#fbbf24'
                });
            }

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
                if (this.attackType === 'suicide_blast' || this.explosiveDeath) {
                    BO.FX.spawnExplosion(this.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 4.2, 0xa3e635);
                    BO.Sound.playExplosion(0.65);
                    if (this.pos.distanceTo(BO.Player.pos) < 4.2) {
                        BO.Player.takeDamage(this.damage * 0.75, this.pos, true);
                    }
                }
                if (this.splitCount > 0 && !this.isSplitChild && (!BO.Net || !BO.Net.active || BO.Net.isHost)) {
                    BO.Events.emit('zombie:split', { parent: this, count: this.splitCount });
                }
                return true;
            }
            return false;
        }

        update(dt, allZombies, callbacks) {
            if (this.alive && (this.powerAlly || this.powerCarried)) return true;
            // callbacks: { onMeleePlayer, onRangedAttack }
            if (!this.alive) {
                this.deathTimer -= dt;
                const fall = BO.Math.clamp(1 - this.deathTimer / (this.isBoss ? 2.6 : 1.5), 0, 1);
                this.parts.root.rotation.x = BO.Math.lerp(0, -Math.PI * 0.48, Math.min(1, fall * 4));
                this.parts.root.position.y = this.pos.y - Math.max(0, fall - 0.65) * 1.2;
                return this.deathTimer > 0;
            }

            // Online Client Puppet Interpolation (Host is authoritative over Zombie AI)
            if (BO.Net && BO.Net.active && !BO.Net.isHost && this.netTargetPos) {
                if (this.attackSwing > 0) this.attackSwing = Math.max(0, this.attackSwing - dt * 2.5);
                this.habitPhase += dt * 4.5;
                const dist = this.pos.distanceTo(this.netTargetPos);
                const moveSpd = BO.Math.clamp(dist * 10, 0, this.speed * 1.3);
                this.pos.lerp(this.netTargetPos, Math.min(1, dt * 14));
                if (typeof this.netTargetYaw === 'number') {
                    this.yaw += BO.Math.angleDiff(this.yaw, this.netTargetYaw) * Math.min(1, dt * 14);
                }
                this.animPhase += dt * (moveSpd * 2.4 + 1.5);
                const hoverOffset = this.movementHabit === 'hover_drift' ? Math.sin(this.habitPhase) * 0.16 : 0;
                this.parts.root.position.set(this.pos.x, this.pos.y + hoverOffset, this.pos.z);
                this.parts.root.rotation.y = this.yaw;
                BO.CharacterMesh.animateLimbs(this.parts, moveSpd, this.animPhase, this.attackSwing, 0);
                return true;
            }

            if (this.stunTimer > 0) this.stunTimer -= dt;
            if (this.frozenTimer > 0) this.frozenTimer -= dt;
            if (this.danceTimer > 0) this.danceTimer -= dt;
            if (this.flinchTimer > 0) this.flinchTimer -= dt;
            if (this.acidTimer > 0) this.acidTimer -= dt;
            if (this.slowTimer > 0) this.slowTimer -= dt;
            if (this.wardTimer > 0) this.wardTimer -= dt;
            if (this._magicAura) this._magicAura.rotation.z += dt * 3.5;
            if (this.attackCooldown > 0) this.attackCooldown -= dt;
            if (this.rangedCooldown > 0) this.rangedCooldown -= dt;
            if (this.attackSwing > 0) this.attackSwing = Math.max(0, this.attackSwing - dt * 2.5);
            this.habitPhase += dt * 4.5;

            if (this._superBolts && this._superBolts.length > 0) this._tickSuperBolts(dt);

            if (this.isSuperBoss && this.superMechanic === 'hydra_barrage' && this.burnTimer <= 0 && this.hp > 0 && this.hp < this.maxHp && (this.hp / this.maxHp) > 0.35) {
                this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.006 * dt);
            }

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

            // Periodic jumping for jumping enemy types (or superJumpZombies modifier!)
            if (this.jumpChance > 0 && this.pos.y <= floorY + 0.08 && this.stunTimer <= 0 && this.frozenTimer <= 0) {
                this.jumpTimer -= dt;
                if (this.jumpTimer <= 0) {
                    this.jumpTimer = 1.8 + Math.random() * 2.4;
                    if (Math.random() < this.jumpChance) {
                        this.vel.y = 8.2 + Math.random() * 2.6;
                    }
                }
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
                    this._steerToward(tx, tz, this.speed * (this.powerMoveScale || 1), dt, []);
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
                const closestP = (BO.Net && BO.Net.active) ? BO.Net.getClosestLivingPlayer(this.pos) : { isLocal: true, pos: P.pos, alive: P.alive && !P.aetherActive };
                let tx = closestP.pos.x, ty = closestP.pos.y, tz = closestP.pos.z;
                let chasingMonkey = false;

                if (monkey) {
                    tx = monkey.pos.x; ty = monkey.pos.y; tz = monkey.pos.z;
                    chasingMonkey = true;
                } else if (customTarget) {
                    tx = customTarget.x; ty = customTarget.y; tz = customTarget.z;
                } else if (!closestP.alive || (closestP.isLocal && P.aetherActive)) {
                    tx = this.pos.x + Math.sin(this.id + performance.now() * 0.001) * 4;
                    tz = this.pos.z + Math.cos(this.id + performance.now() * 0.001) * 4;
                }

                const distToTarget = BO.Math.dist3D(this.pos.x, this.pos.y, this.pos.z, tx, ty, tz);
                const attackRange = (customTarget && customTarget.attackRange !== undefined)
                    ? customTarget.attackRange
                    : (this.isSuperBoss ? 3.4 : (this.isBoss ? 2.45 : (this.attackType === 'shockwave_slam' ? 2.2 : 1.58)));

                // Bespoke Multi-Phase Colossal Super Boss Mechanics
                if (this.isSuperBoss && this.superMechanic && !chasingMonkey && closestP.alive) {
                    this.superTimer -= dt;
                    if (this.superTimer <= 0 && distToTarget < 30) {
                        this.superTimer = (this.superEnraged ? 4.3 : 5.8) + Math.random() * 1.4;
                        this._executeSuperMechanic(tx, ty, tz, distToTarget, floorY, callbacks, customTarget);
                    }
                }

                // Special Ranged Attacks (Acid Spit, Fire Bolt, Frost Shard, Life Drain, Aether Bolt)
                const isRanged = ['acid_spit', 'fire_bolt', 'frost_shard', 'life_drain', 'aether_bolt'].includes(this.attackType);
                const allowProj = !(callbacks && callbacks.allowProjectiles === false);
                const maxRangeDist = this.isSuperBoss ? 32 : 22;
                const eyeY = this.isSuperBoss ? 3.1 : 1.3;
                if (allowProj && !chasingMonkey && !customTarget && closestP.alive && isRanged && distToTarget > 3.5 && distToTarget < maxRangeDist && this.rangedCooldown <= 0) {
                    if (BO.World.hasLineOfSight(this.pos.x, this.pos.y + eyeY, this.pos.z, tx, ty + 1.2, tz)) {
                        this.rangedCooldown = this.isSuperBoss ? 2.1 : (this.isBoss ? 2.4 : 3.8);
                        this.attackSwing = 1.0;
                        if (callbacks && callbacks.onRangedAttack) {
                            callbacks.onRangedAttack(this, tx, ty + 1.15, tz, this.isSuperBoss ? { originY: 3.1 } : null);
                        } else if (this.isSuperBoss) {
                            this._fireSuperSalvo(tx, ty + 1.15, tz, { count: 3, spread: 0.16, kind: this.attackType, speed: 19, originY: 3.1 });
                        }
                    }
                }

                // Special Movement Habits (Hop, Leap Pounce, Teleport Blink, Bull Charge)
                this.habitTimer -= dt;
                if (!chasingMonkey && closestP.alive && this.habitTimer <= 0 && distToTarget < 15) {
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

                if (!chasingMonkey && distToTarget <= attackRange && (customTarget || closestP.alive)) {
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
                        } else if (!closestP.isLocal && BO.Net && BO.Net.active) {
                            BO.Net.sendToPeer(closestP.peerId, {
                                type: 'z_damage_player',
                                targetPeerId: closestP.peerId,
                                damage: this.damage,
                                ax: this.pos.x, ay: this.pos.y, az: this.pos.z
                            });
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

                    // Anti-stuck navigation: sidestep & vault around boxes/crates so NO enemy/boss ever gets trapped!
                    if (this._sidestepTimer > 0) {
                        this._sidestepTimer -= dt;
                        const sdx = goalX - this.pos.x, sdz = goalZ - this.pos.z;
                        const sd = Math.max(0.1, Math.hypot(sdx, sdz));
                        goalX += (-sdz / sd) * this._sidestepSign * 4.2;
                        goalZ += (sdx / sd) * this._sidestepSign * 4.2;
                    }

                    const chargeBoost = (this.movementHabit === 'charge_bull' && directLOS && distToTarget < 12) ? 1.35 : 1.0;
                    const slowMult = (this.slowTimer > 0 ? 0.45 : 1) * (this.powerMoveScale || 1);
                    const curSpeed = this.speed * chargeBoost * slowMult * (this.flinchTimer > 0 ? 0.58 : 1.0);
                    this._steerToward(goalX, goalZ, curSpeed, dt, allZombies);
                    // Snap onto rising stairs/ramps BEFORE horizontal wall resolution so zombies climb cleanly!
                    const stepFloor = BO.World.getGroundHeight(this.pos.x, this.pos.z, this.pos.y);
                    if (stepFloor > this.pos.y) {
                        this.pos.y = stepFloor;
                        if (this.vel.y < 0) this.vel.y = 0;
                    }
                    BO.World.resolveHorizontal(this.pos, this.radius, this.height, false);
                    moveSpeed = curSpeed;

                    this._stuckCheckTimer -= dt;
                    if (this._stuckCheckTimer <= 0) {
                        this._stuckCheckTimer = 0.45;
                        const moved = BO.Math.dist2D(this.pos.x, this.pos.z, this._lastCheckX, this._lastCheckZ);
                        this._lastCheckX = this.pos.x;
                        this._lastCheckZ = this.pos.z;
                        if (moved < 0.30 && curSpeed > 0.5) {
                            this._stuckAccum += 0.45;
                            this._sidestepTimer = 0.90;
                            if (this._stuckAccum >= 0.90) this._sidestepSign *= -1;
                            if (this.pos.y <= floorY + 0.16) this.vel.y = 7.4; // Vault low crates/sandbags!
                            if (this._stuckAccum >= 1.8) {
                                // Unstick nudge around obstacle & recalculate path
                                const ndx = tx - this.pos.x, ndz = tz - this.pos.z;
                                const nd = Math.max(0.1, Math.hypot(ndx, ndz));
                                this.pos.x += (-ndz / nd) * this._sidestepSign * 1.15 + (ndx / nd) * 0.45;
                                this.pos.z += (ndx / nd) * this._sidestepSign * 1.15 + (ndz / nd) * 0.45;
                                this.pathTimer = 0;
                                this.path = [];
                                this._stuckAccum = 0.45;
                            }
                        } else {
                            this._stuckAccum = 0;
                        }
                    }
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

        _fireSuperSalvo(tx, ty, tz, opts = {}, callbacks = null) {
            if (callbacks && callbacks.onRangedAttack && callbacks.allowProjectiles !== false) {
                callbacks.onRangedAttack(this, tx, ty, tz, opts);
                return;
            }
            if (!BO.World.scene) return;
            const kind = opts.kind || this.attackType || 'fire_bolt';
            const col = kind === 'acid_spit' ? 0x4ade80 : (kind === 'fire_bolt' ? 0xf97316 : (kind === 'frost_shard' ? 0x38bdf8 : 0xc084fc));
            const count = opts.count || 3;
            const spread = opts.spread ?? 0.20;
            const speed = opts.speed || 20;
            const origin = new THREE.Vector3(this.pos.x, this.pos.y + (opts.originY || 3.1), this.pos.z);
            for (let c = 0; c < count; c++) {
                const ang = (c - (count - 1) * 0.5) * spread;
                const dir = new THREE.Vector3(tx - origin.x, ty - origin.y, tz - origin.z).normalize();
                if (ang !== 0) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
                const mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.26, 8, 8),
                    new THREE.MeshBasicMaterial({ color: col })
                );
                mesh.position.copy(origin);
                BO.World.scene.add(mesh);
                this._superBolts.push({
                    kind,
                    mesh,
                    pos: origin.clone(),
                    vel: dir.multiplyScalar(speed),
                    damage: Math.max(12, Math.round(this.damage * 0.58)),
                    life: 3.6,
                    color: col
                });
            }
            BO.Sound.playZombieGroan(this.soundProfile, 0.85);
        }

        _tickSuperBolts(dt) {
            const P = BO.Player;
            for (let i = this._superBolts.length - 1; i >= 0; i--) {
                const ep = this._superBolts[i];
                ep.life -= dt;
                const step = ep.vel.clone().multiplyScalar(dt);
                const hitWall = BO.World.raycastWorld(ep.pos, step.clone().normalize(), step.length() + 0.16);
                ep.pos.add(step);
                ep.mesh.position.copy(ep.pos);
                const hitPlayer = P && P.alive && BO.Math.dist3D(ep.pos.x, ep.pos.y, ep.pos.z, P.pos.x, P.pos.y + 1.1, P.pos.z) < 0.85;
                if (hitPlayer) {
                    P.takeDamage(ep.damage, this.pos, false);
                    BO.FX.spawnParticles(ep.pos, 8, ep.color, 3.8, 5, 0.4, 1.2);
                }
                if (hitPlayer || hitWall || ep.life <= 0) {
                    if (hitWall) BO.FX.spawnParticles(ep.pos, 6, ep.color, 3, 5, 0.35, 1.0);
                    if (BO.World.scene) BO.World.scene.remove(ep.mesh);
                    this._superBolts.splice(i, 1);
                }
            }
        }

        _executeSuperMechanic(tx, ty, tz, distToTarget, floorY, callbacks, customTarget) {
            const P = BO.Player;
            const m = this.superMechanic;
            this.attackSwing = 1.0;

            if (m === 'titan_quake') {
                BO.FX.spawnExplosion(this.pos.clone().add(new THREE.Vector3(0, 0.35, 0)), 7.2, 0xf97316);
                BO.Sound.playExplosion(0.72);
                if (P) P.cameraShake = Math.max(P.cameraShake || 0, 0.14);
                if (P && P.alive && !customTarget && BO.Math.dist2D(P.pos.x, P.pos.z, this.pos.x, this.pos.z) < 8.6) {
                    if (P.pos.y - this.pos.y < 0.72) {
                        P.takeDamage(Math.max(18, Math.round(this.damage * 0.60)), this.pos, false);
                        P.vel.y = Math.max(P.vel.y, 4.8);
                    }
                }
                if (distToTarget > 6.0) {
                    this._fireSuperSalvo(tx, ty + 1.1, tz, { count: this.superEnraged ? 3 : 1, spread: 0.18, kind: 'fire_bolt', speed: 18, originY: 3.4 }, callbacks);
                }
            } else if (m === 'seraph_nova') {
                this.wardTimer = Math.max(this.wardTimer, 3.6);
                BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 2.8, 0)), 18, 0xfef08a, 5.2, 2, 0.65, 1.5);
                this._fireSuperSalvo(tx, ty + 1.15, tz, { count: this.superEnraged ? 7 : 5, spread: 0.22, kind: 'aether_bolt', speed: 21, originY: 3.3 }, callbacks);
            } else if (m === 'hydra_barrage') {
                BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 2.6, 0)), 16, 0x4ade80, 4.8, 2, 0.6, 1.4);
                this._fireSuperSalvo(tx, ty + 1.15, tz, { count: this.superEnraged ? 5 : 3, spread: 0.26, kind: 'acid_spit', speed: 18, originY: 3.1 }, callbacks);
            } else if (m === 'mech_salvo') {
                BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 3.4, 0)), 14, 0xf97316, 4.5, 4, 0.5, 1.2);
                this._fireSuperSalvo(tx, ty + 1.1, tz, { count: this.superEnraged ? 6 : 4, spread: 0.18, kind: 'fire_bolt', speed: 22, originY: 3.5 }, callbacks);
                if (distToTarget > 7.5 && distToTarget < 20.0 && this.pos.y <= floorY + 0.15) {
                    const dx = tx - this.pos.x, dz = tz - this.pos.z;
                    const d = Math.max(0.1, Math.hypot(dx, dz));
                    this.vel.y = 8.4;
                    this.vel.x += (dx / d) * 9.2;
                    this.vel.z += (dz / d) * 9.2;
                }
            } else if (m === 'void_singularity') {
                BO.FX.spawnParticles(this.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), 22, 0xa855f7, 6.0, -2.0, 0.6, 1.4);
                if (P && P.alive && !customTarget) {
                    const pd = BO.Math.dist2D(P.pos.x, P.pos.z, this.pos.x, this.pos.z);
                    if (pd > 2.2 && pd < 13.5) {
                        const pull = 6.2;
                        P.vel.x += ((this.pos.x - P.pos.x) / pd) * pull;
                        P.vel.z += ((this.pos.z - P.pos.z) / pd) * pull;
                    }
                }
                this._fireSuperSalvo(tx, ty + 1.15, tz, { count: this.superEnraged ? 6 : 4, spread: 0.20, kind: 'aether_bolt', speed: 20, originY: 3.4 }, callbacks);
                if (distToTarget > 8.0 && !(callbacks && callbacks.preventBlink)) {
                    const dx = tx - this.pos.x, dz = tz - this.pos.z;
                    const d = Math.max(0.1, Math.hypot(dx, dz));
                    this.pos.x += (dx / d) * 3.8;
                    this.pos.z += (dz / d) * 3.8;
                    BO.World.resolveHorizontal(this.pos, this.radius, this.height, false);
                }
            }
        }

        destroy() {
            if (this._superBolts && BO.World.scene) {
                for (const b of this._superBolts) {
                    if (b.mesh) BO.World.scene.remove(b.mesh);
                }
                this._superBolts.length = 0;
            }
            if (this.parts && this.parts.root && BO.World.scene) {
                BO.World.scene.remove(this.parts.root);
            }
        }
    }

    BO.ZombieEntity = ZombieEntity;
})(window);
