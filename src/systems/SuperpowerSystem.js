
(function (BO) {
    'use strict';

    class SuperpowerSystem {
        constructor() {
            this.effects = [];
            this.marks = new Map();
            this.reset();
        }

        reset() {
            for (const effect of this.effects) this.removeEffect(effect);
            for (const [entity, state] of this.marks) this.clearMark(entity, state);
            this.effects.length = 0;
            this.marks.clear();
            this.unlocked = new Set();
            this.cooldowns = new Map();
            this.equipped = null;
            this.time = 0;
            this.shield = 0;
            this.shieldUntil = 0;
            this.lastShieldHit = 0;
        }

        get enabled() {
            return !BO.Net?.active && (BO.State.activeMode === 'zombies' ||
                (BO.State.activeMode === 'mp' && !BO.MPMode.customRules.noPowers));
        }

        get hostiles() {
            if (BO.State.activeMode === 'zombies') {
                return BO.ZombiesMode.zombies.filter((entity) => entity.alive && !entity.powerAlly);
            }
            const mp = BO.MPMode;
            const freeForAll = ['ffa', 'gun_game'].includes(mp.modeType);
            return mp.bots.filter((entity) => entity.alive && !entity.powerAlly && (freeForAll || entity.team !== 0));
        }

        remaining(id) {
            return Math.max(0, (this.cooldowns.get(id) || 0) - this.time);
        }

        use(camera) {
            if (!this.equipped || !this.enabled) return false;
            const power = this.equipped;
            const remaining = this.remaining(power.id);
            if (remaining > 0) {
                this.notify(power, Math.ceil(remaining) + 's until ready');
                return true;
            }

            const aim = BO.Player.getAimRay(camera);
            const wall = BO.World.raycastWorld(aim.origin, aim.dir, 70);
            const point = wall?.point || aim.origin.clone().addScaledVector(aim.dir, 60);
            if (power.id === 'mind_control') {
                const ray = new THREE.Raycaster(aim.origin, aim.dir, 0, Math.min(35, wall?.distance ?? 35));
                const hit = BO.Combat._castTargets(ray)
                    .find((result) => result.object.userData.entity?.alive && !result.object.userData.entity.powerAlly);
                if (!hit) {
                    this.notify(power, 'Aim at a hostile within 35 m');
                    return true;
                }
                const entity = hit.object.userData.entity;
                this.mark(entity).allyUntil = this.time + 20;
                entity.powerAlly = true;
                BO.FX.spawnParticles(entity.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), 26, power.color, 4, 1, 0.8);
            } else if (power.id === 'holy_shield') {
                this.shield = 120;
                this.shieldUntil = this.time + 30;
                this.lastShieldHit = this.time;
            } else if (power.id === 'spider_web') {
                const down = new THREE.Vector3(0, -1, 0);
                const floor = BO.World.raycastWorld(point.clone().addScaledVector(aim.dir, -0.15), down, 18);
                if (!floor || floor.face.normal.y < 0.5) {
                    this.notify(power, 'Aim at a reachable floor');
                    return true;
                }
                const web = new THREE.Group();
                const material = new THREE.MeshBasicMaterial({ color: power.color, transparent: true, opacity: 0.75 });
                for (let ring = 1; ring <= 4; ring++) {
                    const mesh = new THREE.Mesh(new THREE.TorusGeometry(ring * 1.12, 0.025, 4, 16), material);
                    mesh.rotation.x = -Math.PI / 2;
                    web.add(mesh);
                }
                for (let spoke = 0; spoke < 8; spoke++) {
                    const angle = spoke * Math.PI / 4;
                    const line = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.025, 0.035), material);
                    line.rotation.y = -angle;
                    line.position.set(Math.cos(angle) * 2.25, 0, Math.sin(angle) * 2.25);
                    web.add(line);
                }
                web.position.copy(floor.point).y += 0.05;
                BO.World.scene.add(web);
                this.effects.push({ type: 'web', mesh: web, scene: BO.World.scene, life: 14 });
            } else if (power.id === 'thunder_bolt') {
                const origin = point.clone().add(new THREE.Vector3(0, 22, 0));
                const previous = origin.clone();
                for (let i = 1; i <= 8; i++) {
                    const next = origin.clone().lerp(point, i / 8);
                    if (i < 8) next.x += Math.random() * 2 - 1;
                    BO.FX.spawnTracer(previous, next, 0xa5d8ff, 0.18, 0.35);
                    previous.copy(next);
                }
                BO.FX.spawnExplosion(point, 4, 0x93c5fd);
                for (const entity of this.hostiles) {
                    if (this.within(entity, point, 4.5)) this.damage(entity, 420, power);
                }
            } else if (power.id === 'earth_storm') {
                const floor = BO.Player.pos.clone();
                for (let i = 0; i < 30; i++) {
                    const angle = i * 2.39996;
                    const radius = 0.35 + Math.sqrt(i / 30) * 1.1;
                    const start = floor.clone().add(new THREE.Vector3(Math.cos(angle) * radius, 0.18, Math.sin(angle) * radius));
                    const dir = aim.dir.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.44,
                        (Math.random() - 0.5) * 0.34, (Math.random() - 0.5) * 0.44)).normalize();
                    this.launch(power, start, dir, new THREE.DodecahedronGeometry(0.13 + Math.random() * 0.10), 30, 0.34, 1.85, 34, 0.36 + i * 0.012);
                }
            } else if (power.id === 'fire_ball') {
                this.launch(power, aim.origin, aim.dir, new THREE.SphereGeometry(0.86, 16, 10), 6.5, 1.38, 6, 110);
            } else if (power.id === 'icicle') {
                const effect = this.launch(power, aim.origin, aim.dir, new THREE.ConeGeometry(0.48, 3.9, 7), 28, 0.9, 2.15, 260);
                effect.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), aim.dir);
                effect.carried = new Map();
            }

            this.cooldowns.set(power.id, this.time + power.cooldown);
            BO.Sound.playTrapZap();
            this.notify(power, 'Activated');
            return true;
        }

        launch(power, start, direction, geometry, speed, radius, life, damage, windup = 0) {
            const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: power.color }));
            mesh.position.copy(start);
            const scene = BO.World.scene;
            scene.add(mesh);
            const effect = { power, mesh, scene, direction, speed, radius, life, damage, windup, hit: new Set(), trail: 0 };
            this.effects.push(effect);
            return effect;
        }

        tick(dt) {
            if (!this.enabled) return;
            this.time += dt;
            if (!BO.Player.alive || this.shieldUntil <= this.time) this.shield = this.shieldUntil = 0;
            else if (this.time - this.lastShieldHit > 1.2) this.shield = Math.min(120, this.shield + 26 * dt);

            const hostiles = this.effects.length || this.marks.size ? this.hostiles : [];
            for (let i = this.effects.length - 1; i >= 0; i--) {
                const effect = this.effects[i];
                if (effect.windup > 0) {
                    effect.windup -= dt;
                    effect.mesh.position.y += dt * 3.3;
                    effect.mesh.rotation.x += dt * 9;
                    continue;
                }
                effect.life -= dt;
                if (effect.life <= 0) {
                    this.removeEffect(effect);
                    this.effects.splice(i, 1);
                    continue;
                }
                if (effect.type === 'web') {
                    for (const enemy of hostiles) {
                        if (this.within(enemy, effect.mesh.position, 4.5, 1.5)) {
                            const mark = this.mark(enemy);
                            mark.webUntil = this.time + 30;
                            mark.inWeb = true;
                        }
                    }
                    continue;
                }

                const { mesh, direction, power } = effect;
                const step = effect.speed * dt;
                const start = mesh.position.clone();
                const wall = BO.World.raycastWorld(start, direction, step);
                const end = wall ? wall.point : start.clone().addScaledVector(direction, step);
                const segment = new THREE.Line3(start, end);
                for (const enemy of hostiles) {
                    if (!enemy.alive || effect.hit.has(enemy)) continue;
                    const center = enemy.pos.clone();
                    center.y += 0.9;
                    const nearest = segment.closestPointToPoint(center, true, new THREE.Vector3());
                    if (center.distanceToSquared(nearest) > effect.radius ** 2) continue;
                    if (!BO.World.hasLineOfSight(nearest.x, nearest.y, nearest.z, center.x, center.y, center.z)) continue;
                    effect.hit.add(enemy);
                    const died = this.damage(enemy, effect.damage, power);
                    if (!died && power.id === 'fire_ball') {
                        const mark = this.mark(enemy);
                        mark.burnUntil = this.time + 3;
                        mark.burnAt = this.time + 0.5;
                    }
                    if (!died && effect.carried) {
                        effect.carried.set(enemy, enemy.pos.clone().sub(start));
                        enemy.powerCarried = true;
                    }
                    if (power.id === 'earth_storm') {
                        effect.life = 0;
                        break;
                    }
                }
                mesh.position.copy(end);
                if (effect.carried && !wall) {
                    for (const [enemy, offset] of effect.carried) {
                        if (!enemy.alive) continue;
                        const next = end.clone().add(offset);
                        const floor = this.floorAt(next, enemy.pos);
                        if (floor === null) {
                            enemy.powerCarried = false;
                            effect.carried.delete(enemy);
                            continue;
                        }
                        next.y = floor;
                        BO.World.resolveHorizontal(next, enemy.radius || 0.4, enemy.height || 1.8, false);
                        if (this.floorAt(next, enemy.pos) === null || !BO.World.hasLineOfSight(
                            enemy.pos.x, enemy.pos.y + 0.8, enemy.pos.z, next.x, next.y + 0.8, next.z)) {
                            enemy.powerCarried = false;
                            effect.carried.delete(enemy);
                            continue;
                        }
                        enemy.pos.copy(next);
                        (enemy.parts?.root || enemy.root)?.position.copy(next);
                    }
                }
                effect.trail -= dt;
                if (power.id === 'fire_ball' && effect.trail <= 0) {
                    effect.trail = 0.10;
                    BO.FX.spawnParticles(end, 3, 0xfb923c, 2.1, -1, 0.35);
                }
                if (wall) effect.life = 0;
            }

            for (const [entity, mark] of this.marks) {
                if (!entity.alive) {
                    this.clearMark(entity, mark);
                    this.marks.delete(entity);
                    continue;
                }
                entity.powerMoveScale = mark.inWeb ? 0.5 : (mark.webUntil > this.time ? 2 / 3 : 1);
                mark.inWeb = false;
                if (mark.burnUntil > this.time && mark.burnAt <= this.time && !entity.powerAlly) {
                    mark.burnAt += 0.5;
                    this.damage(entity, 30, BO.ExpansionData.powers[0]);
                }
                if (mark.allyUntil > this.time && BO.State.activeMode === 'zombies') this.updateZombieAlly(entity, hostiles, dt);
                else if (mark.allyUntil <= this.time) entity.powerAlly = false;
                if (Math.max(mark.burnUntil, mark.allyUntil, mark.webUntil) <= this.time) {
                    this.clearMark(entity, mark);
                    this.marks.delete(entity);
                }
            }
        }

        mark(entity) {
            if (!this.marks.has(entity)) this.marks.set(entity, { inWeb: false, webUntil: 0, allyUntil: 0, burnUntil: 0, burnAt: 0, attackAt: 0 });
            return this.marks.get(entity);
        }

        clearMark(entity) {
            entity.powerMoveScale = 1;
            entity.powerAlly = false;
        }

        updateZombieAlly(ally, hostiles, dt) {
            if (ally.powerCarried) return;
            let distance = 24;
            let target = null;
            for (const enemy of hostiles) {
                const range = ally.pos.distanceTo(enemy.pos);
                if (range < distance && Math.abs(enemy.pos.y - ally.pos.y) < 1.5) {
                    distance = range;
                    target = enemy;
                }
            }
            if (!target) return;
            const direction = target.pos.clone().sub(ally.pos);
            direction.y = 0;
            ally.yaw = Math.atan2(direction.x, direction.z);
            if (distance > 1.65) {
                const next = ally.pos.clone().addScaledVector(direction.normalize(), dt * ally.speed);
                const floor = this.floorAt(next, ally.pos);
                if (floor !== null) {
                    next.y = floor;
                    BO.World.resolveHorizontal(next, ally.radius || 0.4, 1.8, false);
                    if (this.floorAt(next, ally.pos) !== null) ally.pos.copy(next);
                }
            } else if (this.mark(ally).attackAt <= this.time && this.within(target, ally.pos.clone().add(new THREE.Vector3(0, 0.9, 0)), 2.0)) {
                this.mark(ally).attackAt = this.time + 0.8;
                this.damage(target, Math.max(65, ally.damage * 2.3), BO.ExpansionData.powers[5]);
            }
            const mesh = ally.parts?.root || ally.root;
            if (mesh) {
                mesh.position.copy(ally.pos);
                mesh.rotation.y = ally.yaw;
                BO.CharacterMesh.animateLimbs(ally.parts, distance > 1.65 ? ally.speed : 0, this.time * 7, 0, 0, 'torso', dt);
            }
        }

        floorAt(next, current) {
            const origin = new THREE.Vector3(next.x, current.y + 0.7, next.z);
            const hit = BO.World.raycastWorld(origin, new THREE.Vector3(0, -1, 0), 1.55);
            return hit && hit.face.normal.y > 0.5 ? hit.point.y : null;
        }

        within(entity, point, radius, vertical = radius) {
            const offsetY = entity.pos.y + 0.75 - point.y;
            if (Math.abs(offsetY) > vertical || Math.hypot(entity.pos.x - point.x, entity.pos.z - point.z) > radius) return false;
            return BO.World.hasLineOfSight(point.x, point.y + 0.1, point.z, entity.pos.x, entity.pos.y + 0.75, entity.pos.z);
        }

        damage(entity, amount, power) {
            const point = entity.pos.clone().add(new THREE.Vector3(0, 0.9, 0));
            const weapon = { id: power.id, stats: { kind: 'power', shortName: power.name, papEffect: power.id === 'fire_ball' ? 'incendiary' : null } };
            return BO.Combat.onHitEnemy(entity, amount, 'torso', BO.Player.pos.distanceTo(entity.pos), weapon, point, null);
        }

        removeEffect(effect) {
            effect.scene.remove(effect.mesh);
            const materials = new Set();
            effect.mesh.traverse((mesh) => {
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) materials.add(mesh.material);
            });
            materials.forEach((material) => material.dispose());
            if (effect.carried) for (const enemy of effect.carried.keys()) enemy.powerCarried = false;
        }

        absorb(amount) {
            if (!this.shield) return amount;
            const absorbed = Math.min(amount, this.shield);
            this.shield -= absorbed;
            this.lastShieldHit = this.time;
            return amount - absorbed;
        }

        notify(power, text) {
            BO.Events.emit('hud:toast', { text: power.name.toUpperCase() + ' • ' + text, color: power.color });
        }
    }

    BO.Superpowers = new SuperpowerSystem();
})(window.BO);
