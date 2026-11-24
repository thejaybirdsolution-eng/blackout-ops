
/* Solo Exclusion Zone expedition. State belongs to the current run. */
(function (BO) {
    'use strict';

    const data = BO.SurvivalData;
    const distance = (a, b) => BO.Math.dist3D(a.x, a.y, a.z, b.x, b.y, b.z);
    const vector = (p) => new THREE.Vector3(p.x, p.y, p.z);
    const trainRoute = BO.SurvivalWorld.trainRoute;
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
            this.difficulty = BO.SurvivalCampaignOptions(campaignOptions).difficulty;
            this.difficultyRules = BO.SurvivalRules.difficulties[this.difficulty];
            this.hostilesReleased = false;
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
            const openSec = BO.SurvivalRules.openingSecondsFor ? BO.SurvivalRules.openingSecondsFor(campaignOptions) : BO.SurvivalRules.openingSeconds;
            this.openingSeconds = openSec;
            this.nextSpawn = openSec + 10;
            this.nextMimic = Math.max(75, openSec + 15);
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
            this.zip = null;
            this.near = null;
            this.train = { pos: new THREE.Vector3(trainRoute[0][0], 0, trainRoute[0][1]), next: 1, running: false };
            this.threat = null;
            this.lastDay = 1;
            this.lastNight = 0;
            this.patrolsDeployed = false;
            this.commanderDeployed = false;
            this.weatherLight = this.scene.children.find((item) => item.isDirectionalLight);
            this.weatherHemi = this.scene.children.find((item) => item.isHemisphereLight);

            const loadout = {
                primary: { id: 'm1911', camo: 'default', attachments: {} },
                secondary: { id: 'combat_knife', camo: 'default', attachments: {} },
                lethal: 'c4', tactical: 'monkey_bomb', perks: []
            };
            BO.Player.survivalProp = null;
            BO.Player.survivalPropKey = '';
            BO.Player.initForMatch('survival', data.map.playerSpawn, loadout, false);
            BO.Player.lethalCount = 2;
            BO.Player.tacticalCount = 1;
            BO.Player.fieldCharge = 0;
            BO.Player.ultimateCharge = 0;
            BO.Player.activeWeapon.reserve = 32;
            BO.Combat.reset(camera);
            BO.Combat.onHitEnemy = (entity, dmg, hitbox, dist, weapon, point, dir) =>
                this.hit(entity, dmg, hitbox, dir, weapon?.stats?.kind === 'melee' || weapon?.id === 'knife' ? 'melee' : weapon?.stats?.papEffect === 'incendiary' ? 'fire' : 'bullet');
            BO.Combat.onExplodeAt = (pos, radius, damage, owner, flash, stun, kind) => this.explode(pos, radius, damage, flash, stun, kind);
            BO.Combat.onActivateKillstreak = null;

            this.createZone();
            this.campaign = new BO.SurvivalCampaign(this, campaignOptions);
            this.campaign.staticParts = [...this.structures.values()];
            this.commander = null;
            this.commanderRetreated = false;
            this.commanderReturnAt = Infinity;
            const p = BO.Player;
            if (this.campaign.has('glass')) p.hp = p.maxHp = 70;
            if (this.campaign.has('armored')) {
                p.armor = 100;
                p.armorReservePlates = 3;
            }
            if (this.campaign.has('loaded')) {
                p.activeWeapon.reserve += 16;
            }
            if (this.campaign.has('noFirearms')) {
                p.weapons[0] = p._createWeaponInstance({ id: 'combat_knife', camo: 'default', attachments: {} }, false);
                p.switchWeapon(-1);
            } else if (this.campaign.has('fists') || campaignOptions.gameType === 'scavenger') {
                p.activeWeapon.mag = p.activeWeapon.reserve = 0;
                p.switchWeapon(-1);
            }
            this.campaign.setup(checkpoint);
            if (!checkpoint && campaignOptions.gameType === 'scavenger') {
                this.grant({ timber: 3, stone: 3, fiber: 3, scrap: 2 });
            }
            this.threat = BO.SurvivalRules.threat(this.campaign.day, this.campaign.isNight, this.campaign.options, this.difficultyRules, this.campaign.roster.length);
            this.refreshTargets();
            const kb = BO.Settings.getKeybinds();
            const key = (a) => BO.Settings.keyLabel(kb[a]);
            const safeMsg = this.openingSeconds === 120 ? 'You have 2 minutes before anything hostile appears.' : 'You have 1 minute before anything hostile appears.';
            this.toast(this.hostilesReleased ? 'Expedition restored.' :
                `${safeMsg} Gather wood and stone by hand, then craft tools [${key('survCraft')}]. Hotbar: 1-0 or mouse wheel.`);
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

        disposeOwned(mesh) {
            const index = this.owned.indexOf(mesh);
            if (index < 0) return;
            this.owned.splice(index, 1);
            mesh.removeFromParent();
            mesh.geometry.dispose();
            mesh.material.dispose();
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
            // Collapsible Watchtower at Relay Crossroads
            const deck = this.mesh(new THREE.BoxGeometry(6, 0.35, 5), 0x866f52, 58, 5.5, 52);
            this.tower = { deck, collider: this.solid(deck, 6, 0.35, 5), supports: [], collapsed: false };
            for (const x of [56, 60]) for (const z of [50.5, 53.5]) {
                const mesh = this.mesh(new THREE.BoxGeometry(0.42, 5.5, 0.42), 0x6f513d, x, 2.75, z);
                this.tower.supports.push(this.addStructure(mesh, 0.42, 5.5, 0.42, 'wood', 'support'));
            }
            // Forest & outer perimeter timber (avoiding highways, trench cutout & runway)
            const treeSpots = [];
            for (let i = 0; i < 96; i++) {
                const band = i % 3;
                const x = band === 0 ? -125 - (i * 19 % 110) : (i % 2 ? 1 : -1) * (175 + (i % 6) * 11);
                const z = -220 + (i * 41 % 410);
                if (Math.abs(x) < 35 && z < -115) continue;
                if (Math.abs(x) < 12 || Math.abs(z - 26) < 12) continue;
                if (x > 120 && z > 130) continue;
                if (treeSpots.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 9)) continue;
                treeSpots.push([x, z]);
                const h = 5.5 + (i % 4) * 1.1;
                const trunk = this.mesh(new THREE.CylinderGeometry(0.22, 0.38, h, 6), 0x594333, x, h / 2, z);
                const crown = this.mesh(new THREE.ConeGeometry(1.9, h * 0.82, 7), 0x384d3e, x, h * 0.87, z);
                const tree = this.addStructure(trunk, 0.7, h, 0.7, 'wood', 'tree');
                tree.crown = crown;
                this.timber.push(tree);
            }
            const db = BO.SurvivalWorld.delugeBounds;
            this.water = this.mesh(new THREE.BoxGeometry(db.x1 - db.x0, 0.12, db.z1 - db.z0), 0x305966, (db.x0 + db.x1) / 2, 0.15, (db.z0 + db.z1) / 2,
                { transparent: true, opacity: 0.63, metalness: 0.24, roughness: 0.27 });
            this.water.visible = false;

            this.train.cars = [
                this.mesh(new THREE.BoxGeometry(3.2, 2.2, 5.2), 0x5e6853, trainRoute[0][0], 1.2, trainRoute[0][1]),
                this.mesh(new THREE.BoxGeometry(3.3, 0.65, 4.4), 0x574d43, trainRoute[0][0] - 6, 0.44, trainRoute[0][1]),
                this.mesh(new THREE.BoxGeometry(3.3, 0.65, 4.4), 0x686150, trainRoute[0][0] - 12, 0.44, trainRoute[0][1])
            ];
            for (let i = 0; i < trainRoute.length; i++) {
                const [x, z] = trainRoute[i];
                const [u, v] = trainRoute[(i + 1) % trainRoute.length];
                const alongX = z === v;
                for (const offset of [-0.78, 0.78]) {
                    this.mesh(new THREE.BoxGeometry(alongX ? Math.abs(u - x) : 0.08, 0.05, alongX ? 0.08 : Math.abs(v - z)),
                        0x726d62, (x + u) / 2 + (alongX ? 0 : offset), 0.032, (z + v) / 2 + (alongX ? offset : 0));
                }
            }
            // 6 Tactical Ziplines with pylons, tensioned cables & bidirectional markers
            (BO.SurvivalWorld.ziplines || []).forEach((zip, idx) => {
                const a = new THREE.Vector3(zip.from[0], zip.from[1] + 2.2, zip.from[2]);
                const b = new THREE.Vector3(zip.to[0], zip.to[1] + 2.2, zip.to[2]);
                const mid = a.clone().add(b).multiplyScalar(0.5);
                const len = a.distanceTo(b);
                const cable = this.mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 6), 0x94a3b8, mid.x, mid.y, mid.z);
                cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
                for (const [endIdx, pt] of [[0, zip.from], [1, zip.to]]) {
                    this.mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.5, 6), 0x475569, pt[0], pt[1] + 1.25, pt[2]);
                    this.marker({ id: `zipline:${idx}:${endIdx}`, x: pt[0], y: pt[1], z: pt[2], name: 'Zipline', label: 'Zip: ' + zip.label, color: 0x38bdf8 });
                }
            });
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
                if (kind !== 'restore') {
                    this.crush(part.mesh.position, p.y);
                    this.campaign.pack.dropBag({ timber: 3, resin: 1 }, part.mesh.position);
                }
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
            if (this.campaign?.has('noFirearms')) {
                BO.Player.fireCooldown = 0.4;
                this.toast('Firearms sealed by Melee & Bare-Hands Honor.');
                return false;
            }
            if (this.jammed === weapon) {
                BO.Player.fireCooldown = 0.4;
                return false;
            }
            if (weapon.survivalCoil && this.coilHeat > 0) {
                BO.Player.fireCooldown = 0.3;
                this.toast('The coil is cooling.');
                return false;
            }
            const unbreaking = this.campaign?.deep?.hasInfusion('unbreaking');
            weapon.wear = (weapon.wear || 0) + (unbreaking ? 0.4 : 1);
            if (weapon.wear >= 80 && this.weather === 'Ash rain' && Math.random() < (unbreaking ? 0.02 : 0.05)) {
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

        releaseHostiles() {
            const openSec = this.openingSeconds || BO.SurvivalRules.openingSeconds;
            if (this.hostilesReleased || this.clock < openSec) return;
            this.hostilesReleased = true;
            this.lastDay = this.campaign.day;
            this.lastNight = this.campaign.isNight ? this.campaign.nightNumber : 0;
            const t = this.updateThreat();
            const type = this.campaign.options.gameType;
            BO.Events.emit('hud:banner', {
                title: 'HOSTILES ACTIVE · DAY ' + t.day,
                sub: 'WEAK INFECTED ROAM THE ZONE · UP TO ' + t.cap + ' AT ONCE',
                color: '#f2b45a'
            });
            this.toast('The safe period is over. Each new day brings tougher infected and more of them.');
            // Rival Bounty needs Sable from the start; everywhere else he arrives on day 3.
            if (type === 'bounty') this.deployCommander(true);
            for (let i = 0; i < Math.min(2, t.cap); i++) this.spawnRoamer(true);
            if (type === 'expedition' && !this.core && !this.campaign.metrics.apex) this.spawnInfected(-14, -8, -214, 'apex');
            this.refreshTargets();
        }

        /** Recomputes the day/night threat profile and refreshes the spawn pool. */
        updateThreat() {
            const c = this.campaign;
            this.threat = BO.SurvivalRules.threat(c.day, c.isNight, c.options, this.difficultyRules, c.roster.length);
            this.pressure = Math.min(11, (this.threat.day - 1) * 2 + (this.threat.night ? 1 : 0) + (this.exfil ? 3 : 0));
            c.selectedEnemies = c.getPool(c.area?.id || 'relay');
            return this.threat;
        }

        /** Surface spawn point inside the active 34–115m encounter ring, never inside a locked biome. */
        spawnPoint(minDist = 34, maxDist = 115) {
            const p = BO.Player.pos;
            const locked = BO.SurvivalCampaignData.areas.filter((a) => a.bounds && this.campaign.gates.get(a.id)?.collider.active);
            const inLocked = (x, z) => locked.some((a) => x >= a.bounds[0] - 2 && x <= a.bounds[1] + 2 && z >= a.bounds[2] - 2 && z <= a.bounds[3] + 2);
            const basePts = data.map.waypoints.filter((w) => w.y >= 0)
                .map((w) => ({ x: w.x + (Math.random() - 0.5) * 8, y: w.y, z: w.z + (Math.random() - 0.5) * 8 }))
                .filter((w) => !inLocked(w.x, w.z) && Math.hypot(w.x - p.x, w.z - p.z) >= minDist);
            if (!basePts.length) return null;
            const ring = basePts.filter((w) => Math.hypot(w.x - p.x, w.z - p.z) <= maxDist);
            if (ring.length) return BO.Math.pick(ring);
            basePts.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
            return BO.Math.pick(basePts.slice(0, Math.min(4, basePts.length)));
        }

        get roamingCount() {
            return this.zombies.filter((z) => z.alive && !z.bossLabel && z.survivalType !== 'siege').length;
        }

        spawnRoamer(ignoreCap = false) {
            const t = this.threat || this.updateThreat();
            if (!ignoreCap && this.roamingCount >= t.cap) return null;
            const point = this.spawnPoint();
            return point ? this.spawnInfected(point.x, point.y, point.z) : null;
        }

        deployCommander(required = false) {
            if (this.commanderDeployed) return;
            this.commanderDeployed = true;
            if (!required && this.campaign.has('noPatrols')) return;
            this.commander = this.spawnBot(135, 0, -52, 'ak47', 225, 1, true);
            if (this.commander) this.commander.name = 'Commander Sable';
            if (!required) this.toast("Commander Sable's PMC unit has entered the zone.");
        }

        spawnInfected(x, y, z, type = 'normal', savedSpec = null, required = false) {
            const openSec = this.openingSeconds || BO.SurvivalRules.openingSeconds;
            if (this.clock < openSec) return null;
            if (!required && (type === 'normal' || type === 'mimic') && this.campaign.has('noRoamers')) return null;
            const candidates = this.campaign?.selectedEnemies || BO.ZombiesData.ORDERED_PROGRESSION;
            const boss = ['apex', 'frostBoss', 'cinderBoss', 'geodeBoss', 'siegeBoss'].includes(type);
            const bosses = BO.ZombiesData.ORDERED_BOSSES;
            const spec = savedSpec ? BO.ZombiesData.get(savedSpec) :
                boss ? bosses[({ frostBoss: 1, geodeBoss: 2, cinderBoss: 3, siegeBoss: 1 })[type] || 0] :
                type === 'mimic' ? candidates.find((item) => /wraith|phantom/.test(item.id)) || candidates[0] :
                BO.Math.pick(candidates);
            const mfx = this.campaign?.deep?.modFx || {};
            const entity = new BO.ZombieEntity({ id: this.nextEnemy++, spec, x, y, z, round: 1,
                hp: Math.round(this.difficultyRules.hp * (boss ? (({ frostBoss: 720, cinderBoss: 980, geodeBoss: 820, siegeBoss: 690 })[type] || 580) * (mfx.bossHpMult || 1) : Math.min(320, spec.hp * 0.75 * (this.threat?.hpScale || 1)))),
                speed: (type === 'mimic' ? 5.4 : boss ? 2.5 : Math.min(4.9, spec.speed)) * (this.campaign?.isNight && mfx.nightEnemySpdMult ? mfx.nightEnemySpdMult : 1),
                damage: Math.round((boss ? 32 : 13 * (this.threat?.dmgScale || 1)) * this.difficultyRules.damage * (mfx.enemyDmgMult || 1)) });
            entity.survivalType = type;
            if (type === 'apex') entity.bossLabel = 'Apex Guardian';
            if (type === 'frostBoss') entity.bossLabel = 'Pale Maul';
            if (type === 'cinderBoss') entity.bossLabel = 'Cinder Regent';
            if (type === 'geodeBoss') entity.bossLabel = 'Resonant Sentinel';
            if (type === 'siegeBoss') entity.bossLabel = 'Ridge Breaker';
            if (type === 'mimic' && !savedSpec) {
                const voice = ['Extraction here.', 'This way. I found a cache.', 'Shelter is clear.'][this.nextEnemy % 3];
                this.toast('Unknown radio transmission: “' + voice + '”');
            }
            this.zombies.push(entity);
            if (boss && !savedSpec && this.campaign?.has('doubleBosses')) {
                const lt = this.spawnInfected(x + 2.4, y, z + 1.8, 'mimic', null, true);
                if (lt) lt.bossLabel = (entity.bossLabel || 'Boss') + ' Guard';
            }
            return entity;
        }

        spawnBot(x, y, z, weaponId, hp = 90, team = 1, required = false) {
            const openSec = this.openingSeconds || BO.SurvivalRules.openingSeconds;
            if (team !== 0 && (this.clock < openSec || (!required && this.campaign.has('noPatrols')))) return null;
            const botHp = team !== 0 ? Math.round(hp * (this.campaign?.deep?.modFx?.botHpMult || 1)) : hp;
            const entity = new BO.BotAI({ id: this.nextEnemy++, team, x, y, z, weaponId, maxHp: botHp,
                difficulty: ({ hard: 'regular', veteran: 'hardened', nightmare: 'veteran' })[this.difficulty] || 'recruit', speedScale: 0.69, respawnDelay: 0 });
            this.bots.push(entity);
            return entity;
        }

        hit(entity, amount, hitbox, dir, damageKind, agent = null) {
            if (!entity.alive || entity.team === 0 && !agent) return false;
            const deep = this.campaign?.deep;
            if (!agent) {
                const mfx = deep?.modFx || {};
                if (this.campaign?.has('headshotsOnly') && damageKind === 'bullet') {
                    amount *= (hitbox === 'head' ? 2.2 : 0.35);
                }
                if (mfx.weaponDmgMult && damageKind !== 'melee') amount *= mfx.weaponDmgMult;
                if (mfx.flatDmgMult) amount *= mfx.flatDmgMult;
                if (mfx.longRangeDmgMult && entity.pos && BO.Player.pos.distanceTo(entity.pos) > 25) amount *= mfx.longRangeDmgMult;
                if (deep) {
                    if (damageKind === 'bullet') amount *= (1 + (deep.attributes.dexterity || 0) * 0.10);
                    if (deep.hasInfusion('overclock')) amount *= 1.25;
                    if (hitbox === 'head') {
                        if (deep.hasTalisman('marksman_lens')) amount *= 1.25;
                        if (deep.activeTonics.deadshotTinc > this.clock) amount *= 1.45;
                        if (mfx.headshotMult) amount *= mfx.headshotMult;
                    }
                    if (deep.hasInfusion('fire_aspect')) entity.burnTimer = Math.max(entity.burnTimer || 0, 3.0);
                }
            }
            const killed = entity.survivalType ? entity.takeDamage(amount, hitbox, hitbox === 'head', dir, damageKind)
                : entity.takeDamage(amount, agent || 'player');
            if (!killed && entity === this.commander && !this.commanderRetreated && entity.hp < 70) {
                this.commanderRetreated = true;
                this.commanderReturnAt = this.clock + 52;
                entity.alive = false;
                entity.parts.root.visible = false;
                this.toast('Sable retreated. Expect a reinforced patrol.');
            }
            if (killed && entity.survivalType && ['apex', 'frostBoss', 'cinderBoss', 'geodeBoss', 'siegeBoss'].includes(entity.survivalType)) {
                this.campaign?.mark(entity.survivalType, 1, entity.survivalType === 'apex' ? 130 : 200);
                this.campaign?.mark('bosses', 1, 0);
            }
            if (killed && entity === this.commander) this.campaign.mark('sable', 1, 150);
            if (killed && !agent) {
                if (entity.survivalType && this.campaign.isNight) this.campaign.mark('nightKills', 1, 0);
                this.kills++;
                this.campaign?.mark('kills', 1, 16);
                this.campaign?.mark(entity.survivalType ? 'infected' : 'pmc', 1, entity.survivalType ? 0 : 12);
                if (entity.bossLabel) this.toast(entity.bossLabel + ' defeated. Claim your reward from the contact.');
                if (entity.survivalType === 'apex') this.toast('Apex down. The research core is accessible.');
                if (entity === this.commander) this.toast('Commander Sable eliminated.');
                if (this.kills % 3 === 0) this.campaign.pack.receive({ scrap: 1 });
                if (deep?.modFx?.killAmmoChance && Math.random() < deep.modFx.killAmmoChance && BO.Player.activeWeapon?.stats?.kind === 'gun') {
                    const aw = BO.Player.activeWeapon;
                    aw.reserve = Math.min(aw.stats.reserveMax, aw.reserve + Math.ceil(aw.stats.magSize * 0.4));
                }
                this.campaign?.deep?.onKill(entity, damageKind);
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
                    if (bot) return { ...bot.pos, target: bot, attackRange: 1.7, forceDirect: true };
                    const stealth = this.campaign?.deep?.stealthFactor ?? 1;
                    if (stealth < 0.65 && z.pos.distanceTo(p.pos) > 10 && !z.bossLabel) {
                        return { x: z.pos.x + Math.sin(z.id + this.clock * 0.4) * 1.8, y: z.pos.y, z: z.pos.z + Math.cos(z.id + this.clock * 0.4) * 1.8, attackRange: -1, forceDirect: false };
                    }
                    return null;
                },
                onAttackCustomTarget: (z, ct) => ct?.target && this.hit(ct.target, z.damage, 'torso', null, 'melee', z),
                onMeleePlayer: (z) => {
                    p.takeDamage(z.damage, z.pos, false, z);
                    if (this.campaign?.has('infectBite') && this.campaign.deep && p.alive && !p.guardingWithHands) {
                        if (Math.random() < 0.35) this.campaign.deep.bleeding = Math.max(this.campaign.deep.bleeding, 8);
                        this.campaign.deep.infection = Math.min(100, this.campaign.deep.infection + 12);
                    }
                }
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
            if (!this.active || this.campaign?.deep?.pendingRespawn) return;
            const p = BO.Player;
            this.clock += dt;
            this.releaseHostiles();
            const phase = this.clock % 180;
            const darkness = this.campaign?.darkness ?? 0;
            this.weather = !this.campaign?.options.weather ? 'Clear' :
                phase < 45 ? 'Overcast' : phase < 87 ? 'Ash rain' : phase < 135 ? 'Rad fog' : 'Clearing';
            const fog = this.scene.fog;
            const nearbyFire = this.fire.some((fire) => fire.pos.clone().addScaledVector(this.wind, 2.4).distanceTo(p.pos) < 5);
            fog.density = 0.0038 + (this.weather === 'Rad fog' ? 0.011 : 0) + darkness * 0.0045 + (nearbyFire ? 0.006 : 0);
            if (this.weatherLight) this.weatherLight.intensity = 1.38 - darkness * 0.97;
            if (this.weatherHemi) this.weatherHemi.intensity = 1.12 - darkness * 0.50;
            this.noise = Math.max(0, this.noise - dt);
            this.coilHeat = Math.max(0, this.coilHeat - dt);
            this.updateCycle();
            this.updateFactions(dt);
            this.updateTrain(dt);
            if (this.zip) this.updateZip(dt);
            this.updateHazards(dt, darkness);
            this.updateSpawns();
            this.updatePrompt();
            this.campaign?.update(dt);
            if (!p.alive) {
                if (this.campaign?.deep?.tryRespawnIntercept()) return;
                this.finish(false);
            }
            else if (this.exfil && this.clock >= this.exfil.readyAt && distance(p.pos, this.exfil.site) < 4) this.finish(true);
        }

        /** Announces new days and nightfall, and escalates the threat profile. */
        updateCycle() {
            const c = this.campaign;
            if (!c || !this.hostilesReleased) return;
            const day = c.day;
            const nightNo = c.isNight ? c.nightNumber : 0;
            if (day !== this.lastDay) {
                const before = this.threat?.poolSize || 0;
                this.lastDay = day;
                const t = this.updateThreat();
                const fresh = c.roster.slice(before, t.poolSize).map((z) => z.name);
                BO.Events.emit('hud:banner', {
                    title: 'DAY ' + day,
                    sub: (fresh.length ? 'NEW THREATS: ' + fresh.slice(0, 3).join(', ').toUpperCase() + (fresh.length > 3 ? ' +' + (fresh.length - 3) : '') + ' · ' : '') + 'UP TO ' + t.cap + ' ROAMING',
                    color: '#f2b45a'
                });
                BO.Sound?.playRoundStart?.(day);
            } else if (nightNo && nightNo !== this.lastNight) {
                this.lastNight = nightNo;
                const t = this.updateThreat();
                this.toast('Night falls. The infected grow bolder: up to ' + t.cap + ' may roam until dawn. Stay near fire or shelter.');
            } else if (!nightNo && this.threat?.night) {
                const t = this.updateThreat();
                this.toast('Dawn breaks. Roaming limit back to ' + t.cap + '.');
            }
        }

        updateHazards(dt, darkness) {
            const p = BO.Player;
            const db = BO.SurvivalWorld.delugeBounds;
            const deluge = this.flooded && p.pos.x > db.x0 && p.pos.x < db.x1 && p.pos.z > db.z0 && p.pos.z < db.z1 && p.pos.y < 0.6;
            const survivalNeeds = this.campaign?.options.survivalNeeds !== false;
            const deep = this.campaign?.deep;
            const fx = deep?.modFx;
            if (survivalNeeds) this.hunger = Math.max(0, this.hunger - dt * (this.campaign.has('hungry') ? 0.22 : 0.11) * (fx?.hungerDrainMult || 1));
            const arcMit = Math.max(0.4, 1 - (deep?.attributes?.arcane || 0) * 0.08) * (deep?.hasTalisman('rad_charm') ? 0.6 : 1);
            const weatherRad = (this.weather && this.weather !== 'Clear') ? (fx?.weatherRadMult || 1) : 1;
            const shielding = (this.campaign.pack.filtered ? 0.18 : 1) * (survivalNeeds && this.campaign.has('irradiated') ? 1.8 : 1) * arcMit * (fx?.radGainMult || 1) * weatherRad;
            this.radiation = BO.Math.clamp(this.radiation + dt * (p.pos.y < -2 ? 1.5 * shielding : deluge ? 1.0 * shielding : -0.9), 0, 100);
            this.composure = BO.Math.clamp(this.composure + dt * (this.mealUntil > this.clock ? 1.6 : -darkness * 0.42), 0, 100);
            if (this.composure < 30) p.swayX += Math.sin(this.clock * 7) * 0.00045;
            this.hazardClock -= dt;
            if (this.hazardClock <= 0) {
                this.hazardClock = 1;
                const damage = survivalNeeds ? (this.radiation >= 75 ? 2 : 0) + (this.hunger <= 0 ? 1 : 0) : 0;
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
            if (!this.hostilesReleased) return;
            const campaign = this.campaign;
            const t = this.threat || this.updateThreat();
            if (this.clock >= this.nextSpawn) {
                campaign.selectedEnemies = campaign.getPool(campaign.area?.id || 'relay');
                const frequency = this.difficultyRules.rate * (campaign.options.pool === 'horde' ? 1.3 : 1) *
                    (campaign.isNight || campaign.has('blackout') ? (campaign.has('brutalNights') ? 2 : 1.25) : 1);
                this.nextSpawn = this.clock + Math.max(4, (t.interval - Math.min(6, this.noise)) / frequency);
                if (BO.Player.pos.y > -1.5) {
                    this.spawnRoamer();
                    // Loud players draw a second roamer once the zone has escalated a little.
                    if (t.day >= 2 && this.noise > 2) this.spawnRoamer();
                }
            }
            if (t.patrols && !this.patrolsDeployed) {
                this.patrolsDeployed = true;
                if (!campaign.has('noPatrols')) {
                    const p = BO.Player.pos;
                    for (const [x, y, z, weapon] of [[118, 0, -12, 'mp5'], [128, 0, -24, 'm1911']]) {
                        if (distance(p, { x, y, z }) > 18) this.spawnBot(x, y, z, weapon);
                    }
                    this.toast('PMC scavengers have moved into Freight Works.');
                }
            }
            if (t.commander && !this.commanderDeployed && campaign.options.gameType !== 'bounty') this.deployCommander(false);
            if (t.mimics && this.clock >= this.nextMimic && this.weather === 'Rad fog') {
                this.nextMimic = this.clock + 120;
                const p = BO.Player.pos;
                this.spawnInfected(BO.Math.clamp(p.x + 28, -235, 235), 0, BO.Math.clamp(p.z - 28, -225, 195), 'mimic');
            }
            if (this.clock >= this.commanderReturnAt) {
                this.commanderReturnAt = Infinity;
                this.commander = this.spawnBot(-142, 0, -58, 'm249', 290, 1, true);
                this.commander.name = 'Commander Sable • Reinforced';
                this.spawnBot(-146, 0, -54, 'mp5');
                this.toast('Sable is back with reinforcements.');
            }
        }

        startZip(index, reverse = false) {
            const spec = BO.SurvivalWorld.ziplines?.[index];
            if (!spec) return false;
            const a = reverse ? spec.to : spec.from;
            const b = reverse ? spec.from : spec.to;
            this.zip = {
                from: new THREE.Vector3(a[0], a[1] + 0.5, a[2]),
                to: new THREE.Vector3(b[0], b[1] + 0.5, b[2]),
                t: 0,
                speed: 28 / Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]))
            };
            this.campaign.mark('rides', 1, 5);
            this.toast('Riding zipline: ' + spec.label);
            return true;
        }

        updateZip(dt) {
            const z = this.zip;
            if (!z || !BO.Player.alive) { this.zip = null; return; }
            z.t = Math.min(1, z.t + dt * z.speed);
            BO.Player.pos.lerpVectors(z.from, z.to, z.t);
            BO.Player.vel.set(0, 0, 0);
            if (z.t >= 1) this.zip = null;
        }

        updateTrain(dt) {
            const train = this.train;
            if (!train.running) return;
            const previous = train.pos.clone();
            const [x, z] = trainRoute[train.next];
            const next = new THREE.Vector3(x, 0, z);
            const direction = next.sub(train.pos);
            const speed = 22;
            if (direction.length() <= speed * dt) {
                train.pos.set(x, 0, z);
                train.next = (train.next + 1) % trainRoute.length;
            } else {
                train.pos.addScaledVector(direction.normalize(), dt * speed);
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
                if (marker.alive === false) return best;
                if (this.completed.has(marker.id) && !['lookout', 'train', 'shelter'].includes(marker.id)) return best;
                const d = distance(p, marker);
                // People and mission sites win ties over resource nodes standing next to them.
                const score = (mk) => distance(p, mk) + (mk.id.startsWith('node:') ? 0.9 : 0);
                return d <= 3.05 && (!best || score(marker) < score(best)) ? marker : best;
            }, null);
        }

        get objective() {
            if (this.exfil) return this.clock < this.exfil.readyAt
                ? 'Hold Evac Ridge for ' + Math.ceil(this.exfil.readyAt - this.clock) + 's'
                : 'Extraction ready. Return to Evac Ridge.';
            return this.campaign.objectives.objective;
        }

        get prompt() {
            if (this.rider) return 'Dismount the locomotive';
            if (this.near?.id === 'train' && this.train.running) return 'Board the locomotive';
            if (this.near?.id === 'lookout' && this.exfil) return this.clock >= this.exfil.readyAt ? 'Board extraction' : 'Hold this position';
            return (this.near && this.campaign.pack.prompt(this.near.id)) || this.near?.label || '';
        }

        interact() {
            if (!this.active || !BO.Player.alive) return;
            if (this.rider) {
                this.rider = false;
                BO.Player.pos.x = Math.max(-244, Math.min(244, this.train.pos.x + 2.8));
                return;
            }
            const site = this.near;
            if (!site) return;
            if (site.id.startsWith('zipline:')) {
                const [, idx, rev] = site.id.split(':');
                this.startZip(Number(idx), Number(rev) === 1);
                return;
            }
            if (this.campaign?.activate(site)) return;
            if (site.id === 'shelter') {
                this.composure = Math.min(100, this.composure + 20);
                BO.SurvivalUI.show('workshop');
                return;
            }
            if (site.id === 'train') {
                if (this.campaign.has('footOnly')) return this.toast('Rail travel is disabled for this expedition.');
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
                if (!this.campaign.objectives.routeEvac()) return;
                if (!this.exfil) {
                    this.exfil = { site, readyAt: this.clock + (this.campaign.has('quickEvac') ? 19 : 38) };
                    this.spawnInfected(site.x - 18, 0, site.z + 18);
                    this.spawnInfected(site.x + 20, 0, site.z - 16);
                }
                this.nextSpawn = Math.min(this.nextSpawn, this.clock + 2);
                return this.toast(this.objective);
            }
            if (site.id === 'bunker') {
                if (!this.hostilesReleased) return this.toast('Core access stays sealed during the safe period.');
                if (this.zombies.some((z) => z.alive && z.survivalType === 'apex')) return this.toast('Defeat the Apex guardian first.');
                this.core = true;
                this.campaign?.mark('core', 1, 100);
                this.toast('Core secured. Travel to Evac Ridge.');
            } else if (site.id === 'hospital') {
                this.grant({ scrap: 3, coil: 1, cloth: 2, medkits: 1 });
            } else if (site.id === 'depot') {
                this.grant({ scrap: 4, fuel: 2, rations: 1 });
                const p = BO.Player;
                if (!this.campaign?.has('noFirearms')) {
                    p.weapons[0] = p._createWeaponInstance({ id: 'mp5', camo: 'default', attachments: {} }, false);
                    p.weapons[0].reserve = 60;
                    p.reloading = false;
                    if (p.activeSlot === 0) p.rebuildViewmodel();
                    this.toast('Recovered a carbine and ammunition.');
                } else {
                    this.grant({ ingot: 2, cloth: 2 });
                    this.toast('Recovered freight supplies (firearms sealed).');
                }
                p.lethalCount++;
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
            const { accepted, remainder } = this.campaign.pack.receive(items);
            const count = Object.entries(items).reduce((total, [id, value]) => total + (BO.SurvivalFrontierData.items[id] ? value : 0), 0);
            this.salvaged += count;
            this.campaign.mark('salvaged', count, 4);
            const found = BO.SurvivalItemAmounts(accepted);
            const overflow = BO.SurvivalItemAmounts(remainder);
            if (overflow) this.toast((found ? 'Packed ' + found + '. ' : '') + 'Pack full, dropped ' + overflow);
            else if (found) this.toast('Recovered ' + found);
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
            const c = this.campaign;
            const ok = id === 'cook' ? (c?.stationAvailable('campfire') || c?.stationAvailable('bench')) : c?.stationAvailable('bench');
            if (!this.active || !ok || !recipe || !this.spend(recipe.cost)) return false;
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
            if (!this.active || !BO.Player.alive) return false;
            const p = BO.Player;
            if (id === 'medkits' && p.hp < p.maxHp && this.points.medkits > 0) {
                this.points.medkits--;
                const restored = Math.min(p.maxHp - p.hp, this.campaign.has('fieldMedic') ? 75 : 55);
                p.hp += restored;
                this.campaign?.mark('healed', Math.ceil(restored), 0);
                this.toast('Trauma kit applied (+' + Math.ceil(restored) + ' HP).');
                return true;
            }
            if (id === 'rations' && this.hunger < 100 && this.points.rations > 0) {
                this.points.rations--;
                this.hunger = Math.min(100, this.hunger + 35);
                this.toast('Ate a field ration (+35 food).');
                return true;
            }
            if (id === 'medkits') this.toast(p.hp >= p.maxHp ? 'Health is already full.' : 'No trauma kits left.');
            if (id === 'rations') this.toast(this.hunger >= 100 ? 'You are not hungry.' : 'No rations left.');
            return false;
        }

        /** Use any consumable from the pack or hotbar. */
        consume(id) {
            if (!this.active || !BO.Player.alive || !this.campaign) return false;
            if (id === 'medkits' || id === 'rations') return this.useItem(id);
            const before = this.points[id] || 0;
            const ok = this.campaign.pack.use(id);
            if (!ok && before > 0) {
                const p = BO.Player;
                const why = id === 'bandage' && p.hp >= p.maxHp ? 'Health is already full.' :
                    id === 'repair' ? 'Hold or equip a worn tool to repair it.' : null;
                if (why) this.toast(why);
            }
            return !!ok;
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
            if (victory) {
                this.campaign?.mark('extracts', 1, 160);
                BO.SurvivalCareer.awardCommendations(3);
                BO.SurvivalCareer.bankExtraction(this.points);
            }
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
