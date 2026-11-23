
/* Solo Exclusion Zone expedition. State belongs to the current run. */
(function (BO) {
    'use strict';

    const data = BO.SurvivalData;
    const distance = (a, b) => BO.Math.dist3D(a.x, a.y, a.z, b.x, b.y, b.z);
    const vector = (p) => new THREE.Vector3(p.x, p.y, p.z);
    const cacheNames = { scrap: 'salvage', cloth: 'cloth', rations: 'rations', fuel: 'fuel', coil: 'MRI coil', medkits: 'trauma kit' };
    const trainRoute = [[19, -12], [43, -12], [43, -36], [-35, -36], [-35, 32], [19, 32]];
    const lootTable = [
        { scrap: 3, cloth: 2 }, { scrap: 2, fuel: 1, rations: 1 }, { scrap: 3, fuel: 1 },
        { cloth: 2, rations: 1 }, { scrap: 2, fuel: 2 }
    ];

    class SurvivalMode {
        constructor() {
            this.active = false;
            this.owned = [];
            this.zombies = [];
            this.bots = [];
        }

        start(camera, configuration = {}) {
            const options = typeof configuration === 'string' ? { difficulty: configuration } : configuration;
            const checkpoint = options.resume?.version === 1 ? options.resume : null;
            const campaignOptions = { ...(checkpoint?.options || options), resume: checkpoint };
            this.stop();
            this.scene = BO.World.build(data.map.id);
            this.camera = camera;
            this.active = true;
            this.difficulty = campaignOptions.difficulty === 'hard' ? 'hard' : 'standard';
            this.clock = 0;
            this.weather = 'Overcast';
            this.wind = new THREE.Vector3(1, 0, 0.32).normalize();
            this.pressure = 0;
            this.composure = 100;
            this.radiation = 0;
            this.hunger = 100;
            this.mealUntil = 0;
            this.ember = 0;
            this.shotEmber = false;
            this.shotCoil = false;
            this.coilHeat = 0;
            this.jammed = null;
            this.noise = 0;
            this.rescued = false;
            this.kills = 0;
            this.salvaged = 0;
            this.breaches = 0;
            this.points = { scrap: 1, cloth: 0, fuel: 0, rations: 1, medkits: 1, coil: 0 };
            this.completed = new Set();
            this.nextEnemy = 100;
            this.nextSpawn = 24;
            this.nextMimic = 75;
            this.fireClock = 0;
            this.hazardClock = 0;
            this.exfil = null;
            this.core = false;
            this.flooded = false;
            this.fire = [];
            this.structures = new Map();
            this.timber = [];
            this.markers = [];
            this.rider = false;
            this.near = null;
            this.train = { pos: new THREE.Vector3(19, 0, -12), next: 1, running: false };
            this.weatherLight = this.scene.children.find((item) => item.isDirectionalLight);
            this.weatherHemi = this.scene.children.find((item) => item.isHemisphereLight);

            const loadout = {
                primary: { id: 'm1911', camo: 'default', attachments: {} },
                secondary: { id: 'combat_knife', camo: 'default', attachments: {} },
                lethal: 'c4', tactical: 'monkey_bomb', perks: []
            };
            BO.Player.initForMatch('survival', data.map.playerSpawn, loadout, false);
            BO.Player.lethalCount = 2;
            BO.Player.tacticalCount = 1;
            BO.Player.fieldCharge = 0;
            BO.Player.ultimateCharge = 0;
            BO.Player.activeWeapon.reserve = 32;
            BO.Combat.reset(camera);
            BO.Combat.onHitEnemy = (entity, dmg, hitbox, dist, weapon, point, dir) =>
                this.hit(entity, dmg, hitbox, dir, weapon?.stats?.papEffect === 'incendiary' ? 'fire' : 'bullet');
            BO.Combat.onExplodeAt = (pos, radius, damage, owner, flash, stun, kind) => this.explode(pos, radius, damage, flash, stun, kind);
            BO.Combat.onActivateKillstreak = null;

            this.createZone();
            this.campaign = new BO.SurvivalCampaign(this, campaignOptions);
            this.campaign.staticParts = [...this.structures.values()];
            this.spawnBot(27, 0, 0, 'mp5');
            this.spawnBot(33, 0, -9, 'm1911');
            this.commander = this.spawnBot(37, 0, -20, 'ak47', 225);
            this.commander.name = 'Commander Sable';
            this.commanderRetreated = false;
            this.commanderReturnAt = Infinity;
            this.spawnInfected(-20, 0, 17);
            this.spawnInfected(-32, 0, -7);
            this.spawnInfected(11, 0, 11);
            this.spawnInfected(13, 0, -28);
            this.spawnInfected(-6, -5, -50, 'apex');
            this.spawnInfected(7, -5, -47);
            this.campaign.setup(checkpoint);
            this.refreshTargets();
            this.toast('Find salvage at the hospital and freight siding. The research core is below the central ramp.');
            return this.scene;
        }

        stop() {
            this.active = false;
            this.campaign?.stop();
            this.campaign = null;
            for (const enemy of [...this.zombies, ...this.bots]) enemy.destroy();
            this.zombies.length = 0;
            this.bots.length = 0;
            for (const mesh of this.owned) {
                mesh.removeFromParent();
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
            this.owned.length = 0;
            if (this.scene) this.scene = null;
        }

        mesh(geo, color, x, y, z, options = {}) {
            const node = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...options }));
            node.position.set(x, y, z);
            this.scene.add(node);
            this.owned.push(node);
            return node;
        }

        solid(mesh, w, h, d) {
            const { x, y, z } = mesh.position;
            const collider = { minX: x - w / 2, maxX: x + w / 2, minY: y - h / 2, maxY: y + h / 2,
                minZ: z - d / 2, maxZ: z + d / 2, active: true };
            BO.World.colliders.push(collider);
            BO.World.worldMeshes.push(mesh);
            mesh.updateMatrixWorld();
            return collider;
        }

        createZone() {
            for (const site of data.sites) this.marker(site);
            data.stashes.forEach(([x, y, z], i) => this.marker({
                id: 'stash' + i, x, y, z, name: 'Salvage cache', label: 'Search salvage cache', color: 0x9caa83
            }));
            for (const wall of data.structures) {
                const w = wall.w / wall.cols;
                const h = wall.h / wall.rows;
                for (let ix = 0; ix < wall.cols; ix++) {
                    for (let iy = 0; iy < wall.rows; iy++) {
                        const mesh = this.mesh(new THREE.BoxGeometry(w - 0.018, h - 0.018, wall.d),
                            wall.material === 'wood' ? (iy % 2 ? 0x775441 : 0x906d4f) : (ix % 2 ? 0x866f66 : 0x9a7b6c),
                            wall.x - wall.w / 2 + (ix + 0.5) * w, wall.y - wall.h / 2 + (iy + 0.5) * h, wall.z);
                        this.addStructure(mesh, w, h, wall.d, wall.material);
                    }
                }
            }
            // A small crown and crude timber deck become debris when either pair of supports gives way.
            const deck = this.mesh(new THREE.BoxGeometry(5, 0.35, 4), 0x866f52, 17, 3.5, 18);
            this.tower = { deck, collider: this.solid(deck, 5, 0.35, 4), supports: [], collapsed: false };
            for (const x of [15, 19]) for (const z of [16.5, 19.5]) {
                const mesh = this.mesh(new THREE.BoxGeometry(0.34, 3.5, 0.34), 0x6f513d, x, 1.75, z);
                this.tower.supports.push(this.addStructure(mesh, 0.34, 3.5, 0.34, 'wood', 'support'));
            }
            for (let i = 0; i < 36; i++) {
                const side = i % 2 ? 1 : -1;
                const x = side * (43 + (i % 5) * 2.1);
                const z = -45 + (i * 13 % 82);
                const h = 4.5 + i % 4;
                const trunk = this.mesh(new THREE.CylinderGeometry(0.18, 0.32, h, 6), 0x594333, x, h / 2, z);
                const crown = this.mesh(new THREE.ConeGeometry(1.6, h * 0.82, 7), 0x384d3e, x, h * 0.87, z);
                const tree = this.addStructure(trunk, 0.6, h, 0.6, 'wood', 'tree');
                tree.crown = crown;
                this.timber.push(tree);
            }
            this.water = this.mesh(new THREE.BoxGeometry(27, 0.09, 28), 0x305966, 38, 0.13, -15,
                { transparent: true, opacity: 0.63, metalness: 0.24, roughness: 0.27 });
            this.water.visible = false;

            this.train.cars = [
                this.mesh(new THREE.BoxGeometry(3, 2.0, 4.8), 0x5e6853, 19, 1.2, -12),
                this.mesh(new THREE.BoxGeometry(3.1, 0.60, 4.0), 0x574d43, 13, 0.44, -12),
                this.mesh(new THREE.BoxGeometry(3.1, 0.60, 4.0), 0x686150, 8, 0.44, -12)
            ];
            for (let i = 0; i < trainRoute.length; i++) {
                const [x, z] = trainRoute[i];
                const [u, v] = trainRoute[(i + 1) % trainRoute.length];
                const alongX = z === v;
                for (const offset of [-0.76, 0.76]) {
                    this.mesh(new THREE.BoxGeometry(alongX ? Math.abs(u - x) : 0.07, 0.045, alongX ? 0.07 : Math.abs(v - z)),
                        0x726d62, (x + u) / 2 + (alongX ? 0 : offset), 0.032, (z + v) / 2 + (alongX ? offset : 0));
                }
            }
        }

        marker(site) {
            const base = this.mesh(new THREE.BoxGeometry(0.82, 0.55, 0.68), 0x393f39, site.x, site.y + 0.27, site.z);
            const light = this.mesh(new THREE.OctahedronGeometry(0.18), site.color, site.x, site.y + 1.10, site.z,
                { emissive: site.color, emissiveIntensity: 0.42 });
            this.markers.push({ ...site, base, light });
        }

        addStructure(mesh, w, h, d, material, kind = 'wall') {
            const part = { mesh, collider: this.solid(mesh, w, h, d), material, kind, hp: kind === 'tree' ? 125 : material === 'wood' ? 70 : 170 };
            this.structures.set(mesh, part);
            return part;
        }

        removeSolid(mesh, collider) {
            collider.active = false;
            const i = BO.World.worldMeshes.indexOf(mesh);
            if (i >= 0) BO.World.worldMeshes.splice(i, 1);
        }

        damagePart(part, amount, kind) {
            if (part.hp <= 0) return;
            part.hp -= amount * (part.material === 'brick' && kind === 'bullet' ? 0.37 : 1);
            if (part.hp > 0) return;
            this.removeSolid(part.mesh, part.collider);
            this.breaches++;
            if (kind !== 'restore') this.campaign?.mark('breaches', 1, 6);
            if (part.buildPiece) part.buildPiece.alive = false;
            const p = part.mesh.position.clone();
            BO.FX.spawnParticles(p, 7, part.material === 'wood' ? 0xaa8254 : 0xbe9580, 4, 9, 0.5);
            if (part.kind === 'tree') {
                part.mesh.rotation.z = Math.PI / 2;
                part.mesh.position.set(p.x - Math.sign(p.x) * p.y, 0.35, p.z);
                part.crown.visible = false;
                this.crush(part.mesh.position, p.y);
            } else {
                part.mesh.visible = false;
                if (part.kind === 'support' && !this.tower.collapsed && this.tower.supports.filter((support) => support.hp <= 0).length >= 2) {
                    this.tower.collapsed = true;
                    this.removeSolid(this.tower.deck, this.tower.collider);
                    this.tower.deck.position.y = 0.4;
                    this.tower.deck.rotation.z = 0.16;
                    this.crush(this.tower.deck.position, 4.2);
                    this.toast('Watchtower collapsed.');
                }
            }
        }

        crush(pos, radius) {
            for (const unit of [...this.zombies, ...this.bots]) {
                if (unit.alive && unit.pos.distanceTo(pos) <= radius) this.hit(unit, 450, 'torso', null, 'explosive');
            }
        }

        impact(hit, amount, kind) {
            if (!hit) return;
            const part = this.structures.get(hit.object);
            if (part) this.damagePart(part, amount, kind);
            if (this.shotEmber && kind === 'bullet') this.ignite(hit.point);
            if (this.shotCoil && kind === 'bullet' && part?.hp <= 0) {
                BO.FX.spawnParticles(hit.point, 20, 0xcafaff, 5, -1, 1);
            }
        }

        ignite(point) {
            if (this.fire.length >= 14 || this.fire.some((fire) => fire.pos.distanceTo(point) < 2.2)) return;
            const ground = BO.World.getGroundHeight(point.x, point.z, point.y);
            const pos = new THREE.Vector3(point.x, ground + 0.12, point.z);
            const mesh = this.mesh(new THREE.CircleGeometry(1.5, 14), 0xaa5524, pos.x, pos.y, pos.z,
                { emissive: 0xc94309, emissiveIntensity: 0.52, transparent: true, opacity: 0.47, depthWrite: false });
            mesh.rotation.x = -Math.PI / 2;
            this.fire.push({ pos, mesh, life: 17, spread: false });
        }

        explode(pos, radius, damage, flash, stun, kind) {
            this.noise = Math.max(this.noise, 9);
            const fiery = /molotov|napalm|ember/.test(kind || '');
            if (fiery) this.ignite(pos);
            for (const part of this.structures.values()) {
                const d = part.mesh.position.distanceTo(pos);
                if (!flash && d < radius) this.damagePart(part, damage * (1 - d / radius) * 1.4, 'explosive');
            }
            for (const unit of [...this.zombies, ...this.bots]) {
                const d = unit.pos.distanceTo(pos);
                if (!unit.alive || d >= radius) continue;
                if (flash || stun > 0) unit.stunTimer = Math.max(unit.stunTimer, stun || 2.8);
                if (!flash && damage > 0) this.hit(unit, damage * (1 - d / radius), 'torso', null, fiery ? 'fire' : 'explosive');
            }
        }

        beforeShot(weapon) {
            this.shotEmber = false;
            this.shotCoil = false;
            if (this.jammed === weapon) {
                BO.Player.fireCooldown = 0.4;
                return false;
            }
            if (weapon.survivalCoil && this.coilHeat > 0) {
                BO.Player.fireCooldown = 0.3;
                this.toast('The coil is cooling.');
                return false;
            }
            // The condition score ticks only during real shots and is reset by clearing the action.
            weapon.wear = (weapon.wear || 0) + 1;
            if (weapon.wear >= 80 && this.weather === 'Ash rain' && Math.random() < 0.05) {
                this.jammed = weapon;
                BO.Player.fireCooldown = 0.35;
                this.toast('Stoppage. Press reload to clear it.');
                return false;
            }
            this.shotEmber = this.ember > 0;
            if (this.shotEmber) this.ember--;
            this.shotCoil = !!weapon.survivalCoil;
            if (this.shotCoil) this.coilHeat = 1.8;
            this.noise = Math.max(this.noise, weapon.stats.suppressed ? 0.9 : 3.2);
            return true;
        }

        clearJam() {
            if (!this.jammed || this.jammed !== BO.Player.activeWeapon) return false;
            this.jammed.wear = 0;
            this.jammed = null;
            BO.Player.fireCooldown = 0.55;
            BO.Sound.playReload('in');
            this.toast('Action cleared.');
            return true;
        }

        spawnInfected(x, y, z, type = 'normal', savedSpec = null) {
            const candidates = this.campaign?.selectedEnemies || BO.ZombiesData.ORDERED_PROGRESSION;
            const boss = ['apex', 'frostBoss', 'cinderBoss'].includes(type);
            const bosses = BO.ZombiesData.ORDERED_BOSSES;
            const spec = savedSpec ? BO.ZombiesData.get(savedSpec) :
                boss ? bosses[type === 'frostBoss' ? 1 : type === 'cinderBoss' ? 3 : 0] :
                type === 'mimic' ? candidates.find((item) => /wraith|phantom/.test(item.id)) || candidates[0] :
                candidates[(this.nextEnemy + this.pressure) % Math.min(6 + this.pressure * 2, candidates.length)];
            const entity = new BO.ZombieEntity({ id: this.nextEnemy++, spec, x, y, z, round: 1,
                hp: boss ? (type === 'frostBoss' ? 720 : type === 'cinderBoss' ? 980 : 580) : Math.min(230, spec.hp * 0.75 + this.pressure * 5),
                speed: type === 'mimic' ? 5.4 : boss ? 2.5 : Math.min(4.9, spec.speed),
                damage: boss ? 32 : this.difficulty === 'hard' ? 19 : 13 });
            entity.survivalType = type;
            if (type === 'apex') entity.bossLabel = 'Apex Guardian';
            if (type === 'frostBoss') entity.bossLabel = 'Pale Maul';
            if (type === 'cinderBoss') entity.bossLabel = 'Cinder Regent';
            if (type === 'mimic' && !savedSpec) {
                const voice = ['Extraction here.', 'This way. I found a cache.', 'Shelter is clear.'][this.nextEnemy % 3];
                this.toast('Unknown radio transmission: “' + voice + '”');
            }
            this.zombies.push(entity);
            return entity;
        }

        spawnBot(x, y, z, weaponId, hp = 90, team = 1) {
            const entity = new BO.BotAI({ id: this.nextEnemy++, team, x, y, z, weaponId, maxHp: hp,
                difficulty: this.difficulty === 'hard' ? 'hardened' : 'recruit', speedScale: 0.69, respawnDelay: 0 });
            this.bots.push(entity);
            return entity;
        }

        hit(entity, amount, hitbox, dir, damageKind, agent = null) {
            if (!entity.alive || entity.team === 0 && !agent) return false;
            const killed = entity.survivalType ? entity.takeDamage(amount, hitbox, hitbox === 'head', dir, damageKind)
                : entity.takeDamage(amount, agent || 'player');
            if (!killed && entity === this.commander && !this.commanderRetreated && entity.hp < 70) {
                this.commanderRetreated = true;
                this.commanderReturnAt = this.clock + 52;
                entity.alive = false;
                entity.parts.root.visible = false;
                this.toast('Sable retreated. Expect a reinforced patrol.');
            }
            if (killed && entity.survivalType && ['apex', 'frostBoss', 'cinderBoss'].includes(entity.survivalType)) {
                this.campaign?.mark(entity.survivalType, 1, entity.survivalType === 'apex' ? 130 : 200);
                this.campaign?.mark('bosses', 1, 0);
            }
            if (killed && !agent) {
                this.kills++;
                this.campaign?.mark('kills', 1, 16);
                this.campaign?.mark(entity.survivalType ? 'infected' : 'pmc', 1, entity.survivalType ? 0 : 12);
                if (entity.bossLabel) this.toast(entity.bossLabel + ' defeated. Claim your reward from the contact.');
                if (entity.survivalType === 'apex') this.toast('Apex down. The research core is accessible.');
                if (entity === this.commander) this.toast('Commander Sable eliminated.');
                if (this.kills % 3 === 0) this.points.scrap++;
            }
            return killed;
        }

        refreshTargets() {
            BO.Combat.setTargetPool([...this.zombies, ...this.bots].filter((unit) => unit.alive && unit.team !== 0)
                .flatMap((unit) => unit.getHitboxMeshes()));
        }

        updateFactions(dt) {
            const p = BO.Player;
            const candidates = this.bots.filter((unit) => unit.alive);
            const infected = this.zombies.filter((unit) => unit.alive);
            const closest = (list, pos, range) => list.reduce((nearest, unit) =>
                unit.pos.distanceTo(pos) < (nearest?.pos.distanceTo(pos) ?? range) ? unit : nearest, null);
            const callbacks = {
                allowProjectiles: false,
                getTarget: (z) => {
                    const bot = closest(candidates, z.pos, Math.min(11, p.pos.distanceTo(z.pos)));
                    return bot ? { ...bot.pos, target: bot, attackRange: 1.7, forceDirect: true } : null;
                },
                onAttackCustomTarget: (z, { target }) => this.hit(target, z.damage, 'torso', null, 'melee', z),
                onMeleePlayer: (z) => p.takeDamage(z.damage, z.pos, false)
            };
            for (let i = this.zombies.length - 1; i >= 0; i--) {
                const z = this.zombies[i];
                if (!z.update(dt, this.zombies, callbacks)) {
                    z.destroy();
                    this.zombies.splice(i, 1);
                }
            }
            const context = {
                playerAlive: p.alive, playerPos: p.pos, playerTeam: 0, bots: candidates,
                modeType: 'survival', objectivePos: this.exfil ? data.sites.find((site) => site.id === 'lookout') : null,
                onBotShootPlayer: (bot, dmg) => p.takeDamage(dmg * 0.78, bot.pos, false)
            };
            for (const bot of candidates) {
                bot.update(dt, context);
                const z = closest(infected, bot.pos, 13);
                bot.infectedFire = (bot.infectedFire || 0) - dt;
                if (z?.alive && bot.infectedFire <= 0 && BO.World.hasLineOfSight(bot.pos.x, bot.pos.y + 1.3, bot.pos.z, z.pos.x, z.pos.y + 0.9, z.pos.z)) {
                    bot.infectedFire = 0.66;
                    BO.FX.spawnTracer(bot.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), z.pos.clone().add(new THREE.Vector3(0, 0.9, 0)), 0xfba76a);
                    this.hit(z, bot.team === 0 ? 45 : 29, 'torso', null, 'bullet', bot);
                }
            }
            this.refreshTargets();
        }

        update(dt) {
            if (!this.active) return;
            const p = BO.Player;
            this.clock += dt;
            const phase = this.clock % 180;
            const darkness = this.campaign?.darkness ?? 0;
            this.weather = !this.campaign?.options.weather ? 'Clear' :
                phase < 45 ? 'Overcast' : phase < 87 ? 'Ash rain' : phase < 135 ? 'Rad fog' : 'Clearing';
            const fog = this.scene.fog;
            const nearbyFire = this.fire.some((fire) => fire.pos.clone().addScaledVector(this.wind, 2.4).distanceTo(p.pos) < 5);
            fog.density = 0.012 + (this.weather === 'Rad fog' ? 0.016 : 0) + darkness * 0.008 + (nearbyFire ? 0.008 : 0);
            if (this.weatherLight) this.weatherLight.intensity = 1.35 - darkness * 0.97;
            if (this.weatherHemi) this.weatherHemi.intensity = 1.12 - darkness * 0.50;
            this.noise = Math.max(0, this.noise - dt);
            this.coilHeat = Math.max(0, this.coilHeat - dt);
            this.updateFactions(dt);
            this.updateTrain(dt);
            this.updateHazards(dt, darkness);
            this.updateSpawns();
            this.updatePrompt();
            this.campaign?.update(dt);
            if (!p.alive) this.finish(false);
            else if (this.exfil && this.clock >= this.exfil.readyAt && distance(p.pos, this.exfil.site) < 4) this.finish(true);
        }

        updateHazards(dt, darkness) {
            const p = BO.Player;
            const deluge = this.flooded && p.pos.x > 24 && p.pos.z < -1 && p.pos.z > -29 && p.pos.y < 0.6;
            const survivalNeeds = this.campaign?.options.survivalNeeds !== false;
            if (survivalNeeds) this.hunger = Math.max(0, this.hunger - dt * 0.22);
            this.radiation = BO.Math.clamp(this.radiation + dt * (p.pos.y < -2 ? 2.4 : deluge ? 1.3 : -0.7), 0, 100);
            this.composure = BO.Math.clamp(this.composure + dt * (this.mealUntil > this.clock ? 1.6 : -darkness * 0.42), 0, 100);
            if (this.composure < 30) p.swayX += Math.sin(this.clock * 7) * 0.00045;
            this.hazardClock -= dt;
            if (this.hazardClock <= 0) {
                this.hazardClock = 1;
                const damage = survivalNeeds ? (this.radiation >= 75 ? 4 : 0) + (this.hunger <= 0 ? 3 : 0) : 0;
                if (damage) p.takeDamage(damage);
                if (deluge) p.tacStamina = Math.max(0, p.tacStamina - 0.14);
            }
            this.fireClock -= dt;
            const pulse = this.fireClock <= 0;
            if (pulse) this.fireClock = 0.75;
            for (const f of this.fire) {
                f.life -= dt;
                if (!pulse || f.life <= 0) continue;
                BO.FX.spawnParticles(f.pos.clone().add(new THREE.Vector3(0.7, 0.3, 0)), 4, 0xcb6630, 1.2, -1.2, 0.8);
                const smoke = f.pos.clone().addScaledVector(this.wind, 1.5);
                smoke.y += 1.1;
                BO.FX.spawnParticles(smoke, 3, 0x54514e, 0.8, -0.7, 1.9, 2.3);
                if (p.pos.distanceTo(f.pos) < 1.7) p.takeDamage(7, f.pos);
                for (const part of this.structures.values()) {
                    if (part.material !== 'wood' || part.hp <= 0 || part.mesh.position.distanceTo(f.pos) > 2.7) continue;
                    this.damagePart(part, 15, 'fire');
                    if (!f.spread && f.life < 13) {
                        f.spread = true;
                        this.ignite(part.mesh.position.clone().addScaledVector(this.wind, 1.9));
                    }
                }
                for (const unit of [...this.zombies, ...this.bots]) {
                    if (unit.alive && unit.pos.distanceTo(f.pos) < 1.7) this.hit(unit, 22, 'torso', null, 'fire');
                }
            }
            this.fire = this.fire.filter((fire) => {
                if (fire.life > 0) return true;
                fire.mesh.removeFromParent();
                fire.mesh.geometry.dispose();
                fire.mesh.material.dispose();
                const index = this.owned.indexOf(fire.mesh);
                if (index >= 0) this.owned.splice(index, 1);
                return false;
            });
        }

        updateSpawns() {
            const p = BO.Player;
            this.pressure = Math.min(11, Math.floor(this.clock / 35) + (this.exfil ? 3 : 0));
            if (this.clock >= this.nextSpawn) {
                const campaign = this.campaign;
                campaign.selectedEnemies = campaign.getPool(campaign.area?.id || 'relay');
                const frequency = campaign.options.encounterRate * (campaign.options.pool === 'horde' ? 1.3 : 1) *
                    (campaign.isNight ? 1.33 : 1);
                this.nextSpawn = this.clock + Math.max(4, (21 - this.pressure - this.noise) / frequency);
                const points = [[-45, 0, 18], [43, 0, 18], [-42, 0, -39], [43, 0, -38], [12, 0, -32]];
                const candidates = points.filter(([x, y, z]) => distance(p.pos, { x, y, z }) > 18);
                if (candidates.length && this.zombies.filter((z) => z.alive).length < 20) {
                    this.spawnInfected(...BO.Math.pick(candidates));
                    if (this.pressure >= 4 && this.noise > 0) this.spawnInfected(...BO.Math.pick(candidates));
                }
            }
            if (this.clock >= this.nextMimic && this.weather === 'Rad fog') {
                this.nextMimic = this.clock + 120;
                this.spawnInfected(12, 0, -32, 'mimic');
            }
            if (this.clock >= this.commanderReturnAt) {
                this.commanderReturnAt = Infinity;
                this.commander = this.spawnBot(-41, 0, -15, 'm249', 290);
                this.commander.name = 'Commander Sable • Reinforced';
                this.spawnBot(-45, 0, -13, 'mp5');
                this.toast('Sable is back with reinforcements.');
            }
        }

        updateTrain(dt) {
            const train = this.train;
            if (!train.running) return;
            const previous = train.pos.clone();
            const [x, z] = trainRoute[train.next];
            const next = new THREE.Vector3(x, 0, z);
            const direction = next.sub(train.pos);
            if (direction.length() <= 6.7 * dt) {
                train.pos.set(x, 0, z);
                train.next = (train.next + 1) % trainRoute.length;
            } else {
                train.pos.addScaledVector(direction.normalize(), dt * 6.7);
            }
            const delta = train.pos.clone().sub(previous);
            if (this.rider && BO.Player.alive) {
                const p = BO.Player;
                p.pos.copy(train.pos).y = 2.24;
                p.vel.set(0, 0, 0);
            }
            const tail = delta.normalize();
            train.cars.forEach((car, i) => {
                car.position.set(train.pos.x - tail.x * i * 5.2, i ? 0.45 : 1.2, train.pos.z - tail.z * i * 5.2);
                car.rotation.y = Math.atan2(tail.x, tail.z);
            });
            const marker = this.markers.find((item) => item.id === 'train');
            marker.x = train.pos.x;
            marker.z = train.pos.z;
            marker.base.position.set(marker.x, 0.27, marker.z);
            marker.light.position.set(marker.x, 2.4, marker.z);
        }

        updatePrompt() {
            const p = BO.Player.pos;
            this.near = this.markers.reduce((best, marker) => {
                if (this.completed.has(marker.id) && !['lookout', 'train', 'shelter'].includes(marker.id)) return best;
                const d = distance(p, marker);
                return d <= 3.05 && (!best || d < distance(p, best)) ? marker : best;
            }, null);
        }

        get objective() {
            if (this.exfil) return this.clock < this.exfil.readyAt
                ? 'Hold Evac Ridge for ' + Math.ceil(this.exfil.readyAt - this.clock) + 's'
                : 'Extraction ready. Return to Evac Ridge.';
            if (this.core) return 'Bring the research core to Evac Ridge.';
            return 'Recover the research core below the central ramp.';
        }

        get prompt() {
            if (this.rider) return 'Dismount the locomotive';
            if (this.near?.id === 'train' && this.train.running) return 'Board the locomotive';
            if (this.near?.id === 'lookout' && this.exfil) return this.clock >= this.exfil.readyAt ? 'Board extraction' : 'Hold this position';
            return this.near?.label || '';
        }

        interact() {
            if (!this.active || !BO.Player.alive) return;
            if (this.rider) {
                this.rider = false;
                BO.Player.pos.x = Math.max(-52, Math.min(52, this.train.pos.x + 2.4));
                return;
            }
            const site = this.near;
            if (!site) return;
            if (this.campaign?.activate(site)) return;
            if (site.id === 'shelter') {
                this.composure = Math.min(100, this.composure + 20);
                BO.SurvivalUI.show('workshop');
                return;
            }
            if (site.id === 'train') {
                if (!this.train.running) {
                    if (!this.spend({ scrap: 5, fuel: 2 })) {
                        this.toast('Locomotive needs 5 salvage and 2 fuel.');
                        return;
                    }
                    this.train.running = true;
                    this.campaign?.mark('rail', 1, 52);
                    this.toast('Locomotive restored. Use interact to dismount.');
                }
                this.rider = true;
                return;
            }
            if (site.id === 'lookout') {
                if (!this.core) return this.toast('Recover the research core first.');
                if (!this.exfil) {
                    this.exfil = { site, readyAt: this.clock + 38 };
                    this.spawnInfected(-37, 0, -17);
                    this.spawnInfected(-44, 0, -32);
                }
                this.nextSpawn = Math.min(this.nextSpawn, this.clock + 2);
                return this.toast(this.objective);
            }
            if (site.id === 'bunker') {
                if (this.zombies.some((z) => z.alive && z.survivalType === 'apex')) return this.toast('Defeat the Apex guardian first.');
                this.core = true;
                this.campaign?.mark('core', 1, 100);
                this.toast('Core secured. Travel to Evac Ridge.');
            } else if (site.id === 'hospital') {
                this.grant({ scrap: 3, coil: 1, cloth: 2, medkits: 1 });
            } else if (site.id === 'depot') {
                this.grant({ scrap: 4, fuel: 2, rations: 1 });
                const p = BO.Player;
                p.weapons[0] = p._createWeaponInstance({ id: 'mp5', camo: 'default', attachments: {} }, false);
                p.weapons[0].reserve = 60;
                p.reloading = false;
                if (p.activeSlot === 0) p.rebuildViewmodel();
                p.lethalCount++;
                this.toast('Recovered a carbine and ammunition.');
            } else if (site.id === 'dam') {
                this.flooded = true;
                this.campaign?.mark('flood', 1, 42);
                this.water.visible = true;
                this.crush(this.water.position, 11);
                this.toast('Spillway open. The freight basin is flooded.');
            } else if (site.id === 'squadmate') {
                this.rescued = true;
                this.campaign?.mark('rescued', 1, 48);
                const scout = this.spawnBot(site.x + 1.5, site.y, site.z, 'mp5', 150, 0);
                scout.name = 'Scout Vale';
                scout.powerAlly = true;
                this.toast('Scout Vale is covering the western sector.');
            } else {
                this.grant(lootTable[Number(site.id.slice(5)) % lootTable.length]);
            }
            this.completed.add(site.id);
            site.light.visible = false;
            site.base.material.color.setHex(0x242826);
            this.near = null;
        }

        grant(items) {
            const messages = [];
            for (const [key, count] of Object.entries(items)) {
                this.points[key] += count;
                this.salvaged += count;
                this.campaign?.mark('salvaged', count, 4);
                messages.push(count + ' ' + cacheNames[key]);
            }
            this.toast('Recovered ' + messages.join(' / '));
        }

        canAfford(cost) {
            return Object.entries(cost).every(([key, amount]) => this.points[key] >= amount);
        }

        spend(cost) {
            if (!this.canAfford(cost)) return false;
            for (const [key, amount] of Object.entries(cost)) this.points[key] -= amount;
            return true;
        }

        craft(id) {
            const recipe = data.recipes.find((item) => item.id === id);
            const station = this.campaign?.station;
            if (!this.active || !['bench', 'campfire'].includes(station) ||
                (station === 'campfire' && id !== 'cook') || !recipe || !this.spend(recipe.cost)) return false;
            const p = BO.Player;
            if (id === 'ammo') {
                for (const w of p.weapons) w.reserve = Math.min(w.stats.reserveMax, w.reserve + Math.ceil(w.stats.reserveMax * 0.5));
            } else if (id === 'medkit') {
                this.points.medkits++;
            } else if (id === 'cook') {
                this.hunger = Math.min(100, this.hunger + 55);
                this.composure = 100;
                this.mealUntil = this.clock + 120;
                this.campaign?.mark('cooked', 1, 0);
            } else if (id === 'incendiary') {
                this.ember += 12;
            } else if (id === 'coilgun') {
                const w = p._createWeaponInstance({ id: 'mk14', camo: 'gold', attachments: {} }, false);
                this.configureCoil(w);
                w.mag = 3;
                w.reserve = 9;
                p.weapons[1] = w;
                if (p.activeSlot === 1) p.rebuildViewmodel();
            }
            this.campaign?.mark('crafted', 1, 18);
            this.toast(recipe.name + ' ready.');
            return true;
        }

        configureCoil(w) {
            Object.assign(w.stats, { magSize: 3, reserveMax: 15, damage: 220, penetration: 4, shortName: 'COIL PROTOTYPE' });
            w.survivalCoil = true;
        }

        useItem(id) {
            if (!this.active || !BO.Player.alive) return;
            const p = BO.Player;
            if (id === 'medkits' && p.hp < p.maxHp && this.points.medkits > 0) {
                this.points.medkits--;
                const restored = Math.min(p.maxHp - p.hp, 55);
                p.hp += restored;
                this.campaign?.mark('healed', Math.ceil(restored), 0);
            } else if (id === 'rations' && this.hunger < 100 && this.points.rations > 0) {
                this.points.rations--;
                this.hunger = Math.min(100, this.hunger + 35);
            }
        }

        inspect() {
            const w = BO.Player.activeWeapon;
            if (!w || w.stats.kind === 'melee') return;
            const fraction = w.mag / w.stats.magSize;
            const reading = fraction === 0 ? 'Empty' : fraction === 1 ? 'Full' : fraction > 0.5 ? 'More than half' : fraction > 0.25 ? 'Around half' : 'Nearly empty';
            this.toast(reading + ' • ' + w.reserve + ' in reserve');
        }

        finish(victory) {
            this.active = false;
            BO.SurvivalUI.close();
            if (victory) this.campaign?.mark('extracts', 1, 160);
            BO.SurvivalCareer.tick(this.campaign.run, 'seconds', Math.floor(this.clock), 0);
            BO.SurvivalCareer.discard(this.campaign?.run);
            const stats = { mode: 'survival', victory, title: victory ? 'EXTRACTION COMPLETE' : 'EXPEDITION LOST',
                mapName: data.map.name, time: BO.Math.formatTime(this.clock), kills: this.kills, salvaged: this.salvaged,
                breaches: this.breaches, recoveredCore: this.core };
            if (victory) {
                try {
                    const old = Number(localStorage.getItem('boSurvivalFastest')) || Infinity;
                    if (this.clock < old) localStorage.setItem('boSurvivalFastest', String(this.clock));
                } catch (_) { /* Storage can be disabled for an offline file. */ }
            }
            BO.Menus.showAAR(stats);
        }

        toast(text) {
            BO.Events.emit('hud:toast', { text, color: '#a6ddd0' });
        }
    }

    BO.SurvivalMode = new SurvivalMode();
})(window.BO);
