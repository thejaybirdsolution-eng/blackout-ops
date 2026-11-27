/* ============================================================================
   BLACKOUT OPS — Survival: The Exclusion Zone
   One expedition in a 500 × 450 m terrain world. This module owns the run:
   world build, day/night lighting, weather, vitals, injuries, ammunition and
   weapon condition, noise, death and recovery, fires and destructibles, and
   wires the loot field, threat director, story and campaign together.
============================================================================ */
(function (BO) {
    'use strict';
    const NIGHT_FOG = new THREE.Color(0x10151c), BLOOD_FOG = new THREE.Color(0x521418), SUN_DIR = new THREE.Vector3();
    const _tmpTracerA = new THREE.Vector3();
    const _tmpTracerB = new THREE.Vector3();

    const distance = (a, b) => BO.Math.dist3D(a.x, a.y, a.z, b.x, b.y, b.z);
    const MAP_ID = 'zone';

    class SurvivalMode {
        constructor() {
            this.active = false;
            this.owned = [];
            this.zombies = [];
            this.bots = [];
            this.markers = [];
            this.structures = new Map();
            this._targetPoolBuf = [];
            this._targetsDirty = true;
            this._lastUnitSig = '';
            this._markerGrid = null;
            this._markerIndexedCount = 0;
            this._nearQueryBuf = [];
            this._discoverMarkers = [];
            this._discClock = 0;
            this._sysClock = 0;
            this._aliveBots = [];
            this._aliveZombies = [];
            this._botTargetScratch = { x: 0, y: 0, z: 0, target: null, attackRange: 1.7, forceDirect: true };
        }

        /* ================================================================ lifecycle */
        start(camera, configuration = {}) {
            const options = typeof configuration === 'string' ? { difficulty: configuration } : configuration;
            const checkpoint = options.resume?.version === 2 ? options.resume : null;
            const campaignOptions = { ...(checkpoint?.options || options), resume: checkpoint };
            this.stop();
            BO.Zone.applyOverrides();
            this.scene = BO.World.build(MAP_ID);
            this.camera = camera;
            this.active = true;
            const normOpts = BO.SurvivalCampaignOptions(campaignOptions);
            this.difficulty = normOpts.difficulty;
            this.difficultyRules = BO.SurvivalRules.difficulties[this.difficulty];
            this.zoneTier = normOpts.zoneTier || 1;
            this.tierSpec = BO.SurvivalMeta?.tierSpec ? BO.SurvivalMeta.tierSpec(this.zoneTier) : { tier: 1, name: 'Quarantine Perimeter', hp: 1, dmg: 1, cap: 1, rad: 1, loot: 1, xp: 1, bonusComm: 0 };
            this.seed = checkpoint?.seed || normOpts.seed || (BO.ZoneSeed ? BO.ZoneSeed.randomSeed() : 'ZONE-001');
            campaignOptions.seed = this.seed;
            campaignOptions.zoneTier = this.zoneTier;
            Object.assign(this, {
                hostilesReleased: false, clock: 0, weather: 'Overcast', pressure: 0, composure: 100, radiation: 0, hunger: 100,
                mealUntil: 0, ember: 0, shotEmber: false, jammed: null, noise: 0, noiseRing: 0, kills: 0, salvaged: 0, breaches: 0,
                completed: new Set(), nextEnemy: 100, fireClock: 0, hazardClock: 0, exfil: null, core: false, flooded: false,
                fire: [], structures: new Map(), markers: [], rider: false, near: null, threat: null, lastDay: 1, lastNight: 0,
                patrolsDeployed: true, commanderDeployed: true, commander: null, commanderRetreated: false, commanderReturnAt: Infinity,
                fracture: false, fallPeak: 0, wasAirborne: false, deaths: 0, lodClock: 0,
                _targetsDirty: true, _lastUnitSig: '', _markerIndexedCount: 0, _discClock: 0, _sysClock: 0
            });
            this._markerGrid = BO.SpatialHash ? new BO.SpatialHash(12) : null;
            this._discoverMarkers.length = 0;
            this._nearQueryBuf.length = 0;
            this._targetPoolBuf.length = 0;
            this.wind = new THREE.Vector3(1, 0, 0.32).normalize();
            this.points = { scrap: 1, cloth: 1, rations: 1, medkits: 0, bandage: 1 };
            const openSec = BO.SurvivalRules.openingSecondsFor ? BO.SurvivalRules.openingSecondsFor(campaignOptions) : BO.SurvivalRules.openingSeconds;
            this.openingSeconds = openSec;
            this.weatherLight = this.scene.children.find((item) => item.isDirectionalLight);
            this.weatherHemi = this.scene.children.find((item) => item.isHemisphereLight);
            if (this.weatherLight && !this.weatherLight.target.parent) this.scene.add(this.weatherLight.target);
            this.sunOffset = this.weatherLight ? this.weatherLight.position.clone().normalize().multiplyScalar(110) : new THREE.Vector3(-60, 90, 40);

            const spawn = BO.Zone.map.playerSpawn;
            const loadout = {
                primary: { id: 'm1911', camo: 'default', attachments: {} },
                secondary: { id: 'combat_knife', camo: 'default', attachments: {} },
                lethal: 'frag', tactical: 'flashbang', perks: []
            };
            BO.Player.survivalProp = null;
            BO.Player.survivalPropKey = '';
            BO.Player.initForMatch('survival', { ...spawn, y: BO.World.terrainHeight(spawn.x, spawn.z) + 0.1 }, loadout, false);
            const p = BO.Player;
            p.lethalCount = 0;
            p.tacticalCount = 0;
            p.fieldCharge = 0;
            p.ultimateCharge = 0;
            p.armor = 0;
            p.armorReservePlates = 0;
            for (const w of p.weapons) { w.cond = 72; w.maxCond = 100; }
            p.weapons[0].mag = 6;
            p.weapons[0].reserve = 0;
            BO.Combat.reset(camera);
            BO.Combat.onHitEnemy = (entity, dmg, hitbox, dist, weapon, point, dir) =>
                this.hit(entity, dmg, hitbox, dir, weapon?.stats?.kind === 'melee' || weapon?.id === 'knife' ? 'melee' : weapon?.stats?.papEffect === 'incendiary' ? 'fire' : 'bullet');
            BO.Combat.onExplodeAt = (pos, radius, damage, owner, flash, stun, kind) => this.explode(pos, radius, damage, flash, stun, kind);
            BO.Combat.onActivateKillstreak = null;

            this.loot = new BO.ZoneLoot.ContainerField(this);
            this.createZone();
            this.loot.setup(checkpoint?.loot);
            BO.ZoneArchive.start(this);
            BO.ZoneEvents.start(this);
            BO.ZoneDirector.start(this);
            this.campaign = new BO.SurvivalCampaign(this, campaignOptions);
            const c = this.campaign;
            if (c.has('glass')) p.hp = p.maxHp = 70;
            if (c.has('armored')) { p.armor = 100; p.armorReservePlates = 3; }
            if (c.has('loaded')) this.points.ammo9 = 24;
            if (c.has('noFirearms')) {
                p.weapons[0] = p._createWeaponInstance({ id: 'combat_knife', camo: 'default', attachments: {} }, false);
                p.switchWeapon(-1);
            } else if (c.has('fists') || campaignOptions.gameType === 'scavenger') {
                p.weapons[0].mag = 0;
                p.switchWeapon(-1);
            }
            c.setup(checkpoint);
            BO.ZoneFrontier.start(this);
            BO.ZoneFrontier.restore(checkpoint?.frontier);
            BO.ZoneThrill?.start(this, checkpoint?.thrill);
            BO.ZoneInfest?.start(this, checkpoint?.infest);
            BO.ZoneContracts?.start(this, checkpoint?.contracts);
            BO.ZoneWild?.start(this, checkpoint?.wild);
            BO.ZoneCompanions?.start(this, checkpoint?.companions);
            BO.ZoneArmory?.start(this, checkpoint?.armory);
            BO.ZoneDungeons?.start(this, checkpoint?.dungeons);
            BO.ZoneLegends?.start(this, checkpoint?.legends);
            BO.ZoneQuests?.start(this, checkpoint?.quests);
            BO.ZoneWorldPlus?.start(this, checkpoint?.worldPlus);
            BO.ZoneSandbox?.start(this, !!checkpoint);
            BO.GM?.start(this, checkpoint?.gm || null);
            BO.ZoneFinale.stop();
            BO.ZoneFinale.applySaved(c.objectives);
            BO.ZoneBuild.falling.length = 0;
            BO.ZoneBuild.restored();
            if (!checkpoint) {
                // You come to in the wreck: hurt and bleeding, with six rounds in the pistol.
                p.hp = Math.round(p.maxHp * 0.7);
                if (c.deep) c.deep.bleeding = 6;
                if (campaignOptions.gameType === 'scavenger') this.grant({ timber: 3, stone: 3, fiber: 3, scrap: 2 });
            }
            this.updateThreat();
            this.refreshTargets();
            this.toast(checkpoint ? 'Expedition restored.' : 'You survived the crash. Stop the bleeding, search the wreck, and head for the ranger station.');
            return this.scene;
        }

        stop() {
            BO.GM?.stop();
            if (this.campaign) BO.ZoneBuild.end(true);
            BO.ZoneHorde?.stop();
            BO.ZoneFrontier?.stop();
            BO.ZoneFinale?.stop();
            BO.ZoneArchive?.stop();
            BO.ZoneEvents?.stop();
            BO.ZoneContracts?.stop();
            BO.ZoneQuests?.stop();
            BO.ZoneLegends?.stop();
            BO.ZoneDungeons?.stop();
            BO.ZoneArmory?.stop();
            BO.ZoneCompanions?.stop();
            BO.ZoneWild?.stop();
            BO.ZoneWorldPlus?.stop();
            BO.ZoneSandbox?.stop();
            BO.ZoneInfest?.stop();
            BO.ZoneThrill?.stop();
            if (this.camera && this.camera.far !== 1500) { this.camera.far = 1500; this.camera.updateProjectionMatrix(); }
            this.active = false;
            this.campaign?.stop();
            this.campaign = null;
            this.loot?.stop();
            this.loot = null;
            BO.ZoneDirector.stop();
            for (const enemy of [...this.zombies, ...this.bots]) enemy.destroy();
            this.zombies.length = 0;
            this.bots.length = 0;
            for (const mesh of this.owned) {
                mesh.removeFromParent();
                mesh.geometry?.dispose();
                mesh.material?.dispose?.();
            }
            this.owned.length = 0;
            this._markerGrid?.clear?.();
            this._discoverMarkers.length = 0;
            this._nearQueryBuf.length = 0;
            this._targetPoolBuf.length = 0;
            this._aliveBots.length = 0;
            this._aliveZombies.length = 0;
            this._targetsDirty = true;
            this.scene = null;
        }

        disposeOwned(mesh) {
            const index = this.owned.indexOf(mesh);
            if (index < 0) return;
            this.owned.splice(index, 1);
            mesh.removeFromParent();
            mesh.geometry?.dispose();
            mesh.material?.dispose?.();
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
            const collider = { minX: x - w / 2, maxX: x + w / 2, minY: y - h / 2, maxY: y + h / 2, minZ: z - d / 2, maxZ: z + d / 2, active: true };
            BO.World.colliders.push(collider);
            BO.World.worldMeshes.push(mesh);
            mesh.updateMatrixWorld();
            return collider;
        }

        /** World markers: story sites, safehouses, ladders, nests and landmarks. */
        createZone() {
            const Z = BO.Zone;
            for (const mk of Z.markers) {
                const y = mk.y ?? BO.World.terrainHeight(mk.x, mk.z);
                if (mk.kind === 'mast') {
                    this.marker({ id: 'ladder:mast:up', name: mk.name, x: mk.x + 2.3, y, z: mk.z, label: 'Climb the radio mast', color: 0xff8a6b, to: { x: mk.x, y: mk.top + 0.1, z: mk.z } }, false);
                    this.marker({ id: 'ladder:mast:down', name: mk.name, x: mk.x + 1.2, y: mk.top, z: mk.z + 1.0, label: 'Climb down', color: 0xff8a6b, to: { x: mk.x + 2.9, y, z: mk.z } }, false);
                    this.marker({ id: 'mast', name: mk.name, x: mk.x - 0.8, y: mk.top, z: mk.z - 0.8, label: 'Repair the mast transmitter', color: 0xff8a6b, kind: 'mast' });
                } else if (mk.kind === 'safehouse' || mk.kind === 'nest' || mk.kind === 'lantern' || mk.kind === 'gate') {
                    this.marker({ ...mk, y, label: { safehouse: 'Secure ' + mk.name, nest: 'Burn the nest', lantern: 'Approach the Lantern', gate: 'Campus gate' }[mk.kind], color: { safehouse: 0x8fe3c8, nest: 0xef6b6b, lantern: 0xb69cff, gate: 0xf2b45a }[mk.kind] }, mk.kind === 'safehouse');
                } else if (mk.kind === 'landmark' || mk.kind === 'settlement' || mk.kind === 'site') {
                    this.markers.push({ ...mk, y, label: mk.kind === 'site' ? 'Search the wreck' : '', alive: mk.kind === 'site' ? false : true, discover: mk.kind !== 'site' });
                }
            }
            Z.ladders.forEach((l, i) => {
                this.marker({ id: 'ladder:' + i + ':up', name: l.name, x: l.x, y: l.y, z: l.z, label: 'Climb the ' + l.name.toLowerCase(), to: { x: l.x - 1.4, y: l.top + 0.05, z: l.z } }, false);
                this.marker({ id: 'ladder:' + i + ':down', name: l.name, x: l.x - 0.2, y: l.top, z: l.z, label: 'Climb down', to: { x: l.x + 0.4, y: l.y, z: l.z } }, false);
            });
        }

        marker(site, visual = true) {
            const entry = { ...site, alive: site.alive ?? true };
            if (visual) {
                entry.light = this.mesh(new THREE.OctahedronGeometry(0.2), site.color || 0x8fe3c8, site.x, site.y + 1.6, site.z, { emissive: site.color || 0x8fe3c8, emissiveIntensity: 0.6 });
                entry.base = { material: { color: { setHex() {} } } };
            }
            this.markers.push(entry);
            return entry;
        }

        addStructure(mesh, w, h, d, material, kind = 'wall') {
            const part = { mesh, collider: this.solid(mesh, w, h, d), material, kind, hp: material === 'wood' ? 70 : 170, maxHp: material === 'wood' ? 70 : 170 };
            this.structures.set(mesh, part);
            return part;
        }

        removeSolid(mesh, collider) {
            collider.active = false;
            BO.World.notifyColliderChanged?.(collider);
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
            BO.FX.spawnParticles(part.mesh.position.clone(), 7, part.material === 'wood' ? 0xaa8254 : 0xbe9580, 4, 9, 0.5);
            part.mesh.visible = false;
            if (part.buildPiece) {
                part.buildPiece.alive = false;
                BO.ZoneBuild?.onPieceLost(part.buildPiece);
                BO.GM?.call('onPieceLost', part.buildPiece);
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
        }

        ignite(point) {
            if (this.fire.length >= 14 || this.fire.some((f) => f.pos.distanceTo(point) < 2.2)) return;
            const ground = BO.World.getGroundHeight(point.x, point.z, point.y + 0.5);
            const pos = new THREE.Vector3(point.x, ground + 0.12, point.z);
            const mesh = this.mesh(new THREE.CircleGeometry(1.5, 14), 0xaa5524, pos.x, pos.y, pos.z,
                { emissive: 0xc94309, emissiveIntensity: 0.52, transparent: true, opacity: 0.47, depthWrite: false });
            mesh.rotation.x = -Math.PI / 2;
            this.fire.push({ pos, mesh, life: 17, spread: false });
        }

        explode(pos, radius, damage, flash, stun, kind) {
            this.noise = Math.max(this.noise, 9);
            BO.ZoneDirector.noise(pos.x, pos.z, flash ? 60 : 140, 'explosion');
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
            const nest = this.markers.find((mk) => mk.kind === 'nest' && mk.alive !== false && Math.hypot(mk.x - pos.x, mk.z - pos.z) < radius + 3);
            if (nest && (fiery || damage > 60)) this.campaign.objectives.burnNest(nest);
        }

        /* ================================================================ weapons */
        beforeShot(weapon) {
            this.shotEmber = false;
            const p = BO.Player;
            if (this.campaign?.has('noFirearms')) {
                p.fireCooldown = 0.4;
                this.toast('Firearms are sealed for this expedition.');
                return false;
            }
            if (this.jammed === weapon) { p.fireCooldown = 0.4; return false; }
            weapon.cond = weapon.cond ?? 75;
            const ironclad = BO.ZoneThrill?.has(weapon, 'durable');
            if (ironclad) weapon.cond = Math.max(weapon.cond, 60);
            if (weapon.cond < 15 && Math.random() < 0.25) {
                p.fireCooldown = 0.3;
                BO.Sound.playEmptyClick?.();
                this.toast('Misfire. This weapon is falling apart — repair it.');
                return false;
            }
            const deadeyeMult = Math.max(0.4, 1 - (BO.SurvivalCareer?.masteryRank?.('deadeye') || 0) * 0.15) * (BO.GM?.active ? (BO.GM.get('rooms')?.gunWearMult?.() || 1) : 1); // Armory: Oiled
            const jamChance = weapon.cond < 45 ? (45 - weapon.cond) / 45 * 0.05 * (this.weather === 'Ash rain' ? 1.6 : 1) * deadeyeMult : 0;
            if (Math.random() < jamChance) {
                this.jammed = weapon;
                p.fireCooldown = 0.35;
                this.toast('Stoppage! Press reload to clear it.');
                return false;
            }
            const wearMult = ironclad ? 0 : (this.campaign?.deep?.hasInfusion?.('unbreaking') ? 0.4 : 1) * deadeyeMult;
            weapon.cond = Math.max(0, weapon.cond - 0.22 * wearMult);
            this.shotEmber = this.ember > 0;
            if (this.shotEmber) this.ember--;
            const radius = BO.ZoneLoot.shotNoise(weapon) * (BO.ZoneThrill?.shotNoiseMult() ?? 1);
            this.noise = Math.max(this.noise, radius / 35);
            BO.ZoneDirector.noise(p.pos.x, p.pos.z, radius, 'gunshot');
            if (BO.ZoneLoot.caliberOf(weapon) && Math.random() < 0.45) this.points.brass = (this.points.brass || 0) + 1;
            return true;
        }

        clearJam() {
            if (!this.jammed || this.jammed !== BO.Player.activeWeapon) return false;
            this.jammed = null;
            BO.Player.fireCooldown = 0.55;
            BO.Sound.playReload('in');
            this.toast('Stoppage cleared.');
            return true;
        }

        /** Loaded ammunition comes out of the backpack: reserves mirror the pack's calibre counts. */
        syncAmmo() {
            const inv = this.points;
            for (const w of BO.Player.weapons) {
                const cal = BO.ZoneLoot.caliberOf(w);
                if (!cal) continue;
                if (w._resSeen !== undefined && w.reserve < w._resSeen) inv[cal] = Math.max(0, (inv[cal] || 0) - (w._resSeen - w.reserve));
                w.reserve = inv[cal] || 0;
                w._resSeen = w.reserve;
            }
        }

        /* ================================================================ threat */
        releaseHostiles() {
            if (this.hostilesReleased || this.clock < this.openingSeconds) return;
            this.hostilesReleased = true;
            this.lastDay = this.campaign.day;
            this.lastNight = this.campaign.isNight ? this.campaign.nightNumber : 0;
            const t = this.updateThreat();
            BO.Events.emit('hud:banner', { title: 'DAY ' + t.day, sub: 'THE INFECTED ARE STIRRING · STAY QUIET, STAY OUT OF SIGHT', color: '#f2b45a' });
            this.refreshTargets();
        }

        updateThreat() {
            const c = this.campaign;
            this.threat = BO.SurvivalRules.threat(c.day, c.isNight, c.options, this.difficultyRules, c.roster.length);
            this.pressure = Math.min(11, (this.threat.day - 1) * 2 + (this.threat.night ? 1 : 0));
            c.selectedEnemies = c.getPool(c.area?.id || 'crash');
            return this.threat;
        }

        get roamingCount() { return BO.ZoneDirector.nearbyCount ? BO.ZoneDirector.nearbyCount() : 0; }

        spawnInfected(x, y, z, type = 'normal', savedSpec = null, required = false) {
            if (this.clock < this.openingSeconds && !required) return null;
            if (!required && type === 'normal' && this.campaign.has('noRoamers')) return null;
            const candidates = this.campaign?.selectedEnemies?.length ? this.campaign.selectedEnemies : BO.Zone.bestiary().slice(0, 4);
            const boss = BO.ZoneBosses?.isBoss(type);
            const disSet = new Set(this.campaign?.options?.disabledEnemies || []);
            const day = this.campaign?.day || 1;
            const ZC = BO.ZombieCustomizer;
            const spec = savedSpec
                ? BO.ZombiesData.get(savedSpec)
                : boss
                    ? BO.ZoneBosses.spec(type)
                    : (ZC ? ZC.pickFromSurvivalPool(candidates, day, disSet) : BO.Math.pick(candidates));
            if (!spec) return null;
            const mfx = this.campaign?.deep?.modFx || {};
            const groundY = y ?? BO.World.getGroundHeight(x, z, 80);
            const hasCustomHp = !!(ZC && ZC.hasStatOverride(spec.id, 'hp'));
            const hasCustomSpd = !!(ZC && ZC.hasStatOverride(spec.id, 'speed'));
            const hasCustomAtk = !!(ZC && ZC.hasStatOverride(spec.id, 'attack'));
            const baseHp = hasCustomHp ? spec.hp : (boss ? BO.ZoneBosses.hp(type) : Math.min(340, spec.hp * 0.75));
            const baseSpd = hasCustomSpd ? spec.speed : (boss ? 2.6 : Math.min(4.9, spec.speed));
            const baseAtk = hasCustomAtk ? spec.attack : (boss ? 32 : 13);
            const entity = new BO.ZombieEntity({ id: this.nextEnemy++, spec, x, y: groundY, z, round: day,
                // 1.0: no calendar or tier HP inflation. Escalation comes from the Behaviour Ladder (gm/GMThreat.js).
                hp: Math.max(1, Math.round(this.difficultyRules.hp * baseHp)),
                speed: baseSpd * (this.campaign?.isNight && mfx.nightEnemySpdMult ? mfx.nightEnemySpdMult : 1),
                damage: Math.max(0, Math.round(baseAtk * this.difficultyRules.damage)) });
            entity.survivalType = type;
            if (boss) entity.bossLabel = BO.ZoneBosses.label(type);
            else if (spec.isBoss) entity.bossLabel = spec.name;
            this.zombies.push(entity);
            BO.ZoneThrill?.onSpawn(entity, type, required);
            BO.GM?.call('onSpawn', entity, type, required);
            return entity;
        }

        spawnBot(x, y, z, weaponId, hp = 90, team = 1, required = false) {
            if (team !== 0 && (this.clock < this.openingSeconds || (!required && this.campaign.has('noPatrols')))) return null;
            const botHp = team !== 0 ? Math.round(hp * (this.campaign?.deep?.modFx?.botHpMult || 1)) : hp;
            const entity = new BO.BotAI({ id: this.nextEnemy++, team, x, y: y ?? BO.World.getGroundHeight(x, z, 80), z, weaponId, maxHp: botHp,
                difficulty: ({ hard: 'regular', veteran: 'hardened', nightmare: 'veteran', apocalypse: 'veteran' })[this.difficulty] || 'recruit', speedScale: 0.7, respawnDelay: 0 });
            this.bots.push(entity);
            return entity;
        }

        hit(entity, amount, hitbox, dir, damageKind, agent = null) {
            if (!entity.alive || entity.team === 0 && !agent) return false;
            if (entity.animal) return BO.ZoneWild.hitAnimal(entity, amount, hitbox, dir, damageKind, agent);
            const deep = this.campaign?.deep;
            if (!agent) {
                const mfx = deep?.modFx || {};
                if (this.campaign?.has('headshotsOnly') && damageKind === 'bullet') amount *= (hitbox === 'head' ? 2.2 : 0.35);
                if (mfx.weaponDmgMult && damageKind !== 'melee') amount *= mfx.weaponDmgMult;
                if (mfx.flatDmgMult) amount *= mfx.flatDmgMult;
                if (deep?.training) amount *= deep.trainingDamageMult(damageKind);
                amount *= (BO.ZoneWorldPlus?.damageMult?.() || 1);
                if (BO.GM?.active) amount *= BO.GM.product('outgoingDamageMult', entity, damageKind);
                if (!entity.survivalType && !entity.animal) entity.gmProvoked = true;
                // Run perks, weapon traits and champion armour (reads awareness before the hit reveals you).
                if (BO.ZoneThrill) amount = BO.ZoneThrill.modifyHit(entity, amount, hitbox, damageKind);
                // A hit always makes the target aware of you.
                if (entity.zs) { entity.zs.state = 'hunt'; entity.zs.seen = this.clock; }
            }
            const killed = entity.survivalType ? entity.takeDamage(amount, hitbox, hitbox === 'head', dir, damageKind) : entity.takeDamage(amount, agent || 'player');
            if (killed && entity.bossLabel) {
                this.campaign?.mark('bosses', 1, 200);
                this.campaign?.mark('boss_' + entity.survivalType, 1, 0);
                this.campaign?.objectives.onBossKilled?.(entity);
                BO.ZoneFrontier?.onBossKilled(entity);
            }
            if (killed && !agent) {
                if (entity.survivalType && this.campaign.isNight) this.campaign.mark('nightKills', 1, 0);
                this.kills++;
                this.campaign?.mark('kills', 1, 12);
                this.campaign?.mark(entity.survivalType ? 'infected' : 'pmc', 1, entity.survivalType ? 0 : 14);
                if (!entity.survivalType) this.dropBotLoot(entity);
                deep?.onKill?.(entity, damageKind);
                BO.ZoneThrill?.onKill(entity, hitbox, damageKind);
                BO.Mods.triggerReaction('kill');
                BO.ZoneWorldPlus?.onEnemyKilled?.(entity, hitbox, damageKind);
                BO.GM?.call('onKill', entity, hitbox, damageKind);
                BO.Progression?.registerCombatKill?.({
                    mode: 'survival',
                    isHeadshot: hitbox === 'head',
                    isMelee: damageKind === 'melee',
                    isBoss: !!(entity.isBoss || entity.bossLabel),
                    isSuperBoss: !!entity.isSuperBoss,
                    enemySwing: entity.attackSwing || 0
                });
            }
            return killed;
        }

        /** PMC soldiers drop their weapon and some ammunition. */
        dropBotLoot(bot) {
            const cal = BO.ZoneLoot.caliberOf(bot.weaponId);
            const items = { scrap: 1 + Math.floor(Math.random() * 2) };
            if (cal) items[cal] = 6 + Math.floor(Math.random() * 14);
            if (Math.random() < 0.3) items.bandage = 1;
            this.campaign.pack.dropBag(items, bot.pos);
            if (Math.random() < 0.35 && bot.weaponId) this.loot.dropPickup(bot.weaponId, 40 + Math.round(Math.random() * 30), bot.pos, BO.WeaponsData.get(bot.weaponId)?.name);
        }

        refreshTargets() {
            this._targetsDirty = false;
            const pool = this._targetPoolBuf;
            pool.length = 0;
            const pushMeshes = (list) => {
                if (!list) return;
                for (let i = 0; i < list.length; i++) {
                    const u = list[i];
                    if (!u || !u.alive || u.team === 0) continue;
                    const meshes = u.getHitboxMeshes();
                    for (let j = 0; j < meshes.length; j++) pool.push(meshes[j]);
                }
            };
            pushMeshes(this.zombies);
            pushMeshes(this.bots);
            pushMeshes(BO.ZoneWild?.animals);
            BO.Combat.setTargetPool(pool);
        }

        _distSqXZ(a, b) {
            const dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z;
            return dx * dx + dy * dy + dz * dz;
        }

        _closestInRange(list, pos, range) {
            let nearest = null;
            let bestSq = range * range;
            for (let i = 0; i < list.length; i++) {
                const u = list[i];
                const d2 = this._distSqXZ(u.pos, pos);
                if (d2 < bestSq) { bestSq = d2; nearest = u; }
            }
            return nearest;
        }

        updateFactions(dt) {
            const p = BO.Player;
            const D = BO.ZoneDirector;
            const bots = this._aliveBots;
            bots.length = 0;
            for (let i = 0; i < this.bots.length; i++) if (this.bots[i].alive) bots.push(this.bots[i]);
            const infected = this._aliveZombies;
            infected.length = 0;
            for (let i = 0; i < this.zombies.length; i++) if (this.zombies[i].alive) infected.push(this.zombies[i]);

            const animalsLen = BO.ZoneWild?.animals?.length || 0;
            const sig = `${this.zombies.length}:${infected.length}:${this.bots.length}:${bots.length}:${animalsLen}`;
            if (sig !== this._lastUnitSig) {
                this._lastUnitSig = sig;
                this._targetsDirty = true;
            }

            if (!this._factionCallbacks) {
                this._factionCallbacks = {
                    allowProjectiles: false,
                    getTarget: (z) => {
                        const H = BO.ZoneHorde;
                        if (z.breach) { const br = H.breachTarget(z); if (br) return br; }
                        if (z.horde) return H.targetFor(z);
                        const compTgt = BO.ZoneCompanions?.targetForZombie?.(z);
                        if (compTgt) return compTgt;
                        const fortTgt = BO.ZoneWorldPlus?.targetForZombie?.(z);
                        if (fortTgt) return fortTgt;
                        const bot = this._closestInRange(this._aliveBots, z.pos, 11);
                        if (bot && (!z.zs || z.zs.state !== 'hunt' || this._distSqXZ(bot.pos, z.pos) < this._distSqXZ(BO.Player.pos, z.pos))) {
                            const s = this._botTargetScratch;
                            s.x = bot.pos.x; s.y = bot.pos.y; s.z = bot.pos.z;
                            s.target = bot;
                            return s;
                        }
                        return BO.ZoneDirector.getTarget(z);
                    },
                    onAttackCustomTarget: (z, ct) => {
                        if (ct?.structure) BO.ZoneHorde.strike(z, ct.structure);
                        else if (ct?.companion) BO.ZoneCompanions?.damageCompanion(z.damage);
                        else if (ct?.fortDefender) BO.ZoneWorldPlus?.damageDefender(ct.fortDefender, z.damage);
                        else if (ct?.target) this.hit(ct.target, z.damage, 'torso', null, 'melee', z);
                    },
                    onMeleePlayer: (z) => {
                        const Pl = BO.Player;
                        Pl.takeDamage(z.damage, z.pos, false, z);
                        BO.ZoneThrill?.onEnemyMelee(z);
                        BO.ZoneDirector.onPlayerHurt();
                        const deep = this.campaign?.deep;
                        if (deep && Pl.alive && !Pl.guardingWithHands) {
                            if (Math.random() < (this.campaign.has('infectBite') ? 0.35 : 0.12)) deep.bleeding = Math.max(deep.bleeding, 8);
                            if (this.campaign.has('infectBite')) deep.infection = Math.min(100, deep.infection + 12);
                        }
                    }
                };
            }
            const callbacks = this._factionCallbacks;

            for (let i = this.zombies.length - 1; i >= 0; i--) {
                const z = this.zombies[i];
                const step = z.alive ? D.lodTick(z, dt) : dt;
                if (step === 0) continue;
                if (!z.update(step, this.zombies, callbacks)) {
                    z.destroy();
                    this.zombies.splice(i, 1);
                    this._targetsDirty = true;
                }
            }
            const context = this._botContext || (this._botContext = {
                playerAlive: true, playerPos: p.pos, playerTeam: 0, bots,
                modeType: 'survival', objectivePos: null,
                onBotShootPlayer: (bot, dmg) => {
                    if (bot.team === 1 && !bot.gmProvoked && BO.GM?.get('bosses')?.hasReward?.('codebook')) return;
                    BO.Player.takeDamage(dmg * 0.78, bot.pos, false); D.onPlayerHurt();
                }
            });
            context.playerAlive = p.alive;
            context.playerPos = p.pos;
            context.bots = bots;

            for (let bi = 0; bi < bots.length; bi++) {
                const bot = bots[bi];
                const step = D.lodTick(bot, dt);
                if (step === 0) continue;
                bot.update(step, context);
                const z = this._closestInRange(infected, bot.pos, 14);
                bot.infectedFire = (bot.infectedFire || 0) - step;
                if (z?.alive && bot.infectedFire <= 0 && BO.World.hasLineOfSight(bot.pos.x, bot.pos.y + 1.3, bot.pos.z, z.pos.x, z.pos.y + 0.9, z.pos.z)) {
                    bot.infectedFire = 0.66;
                    _tmpTracerA.set(bot.pos.x, bot.pos.y + 1.3, bot.pos.z);
                    _tmpTracerB.set(z.pos.x, z.pos.y + 0.9, z.pos.z);
                    BO.FX.spawnTracer(_tmpTracerA, _tmpTracerB, 0xfba76a);
                    this.hit(z, bot.team === 0 ? 45 : 29, 'torso', null, 'bullet', bot);
                    D.noise(bot.pos.x, bot.pos.z, 90, 'gunshot');
                }
            }
            if (this._targetsDirty) this.refreshTargets();
        }

        /* ================================================================ frame */
        update(dt) {
            if (BO.GM?.get('loot')?.pendingRespawn) { if (this.active && !BO.SurvivalUI.open) BO.SurvivalUI.show('gmRespawn'); return; }
            if (!this.active || this.campaign?.deep?.pendingRespawn) return;
            const p = BO.Player;
            this.clock += dt;
            this.releaseHostiles();
            this.updateEnvironment(dt);
            this.syncAmmo();
            this.noise = Math.max(0, this.noise - dt);
            this.updateCycle();
            this.updateFactions(dt);
            BO.ZoneDirector.update(dt);
            BO.ZoneHorde?.update(dt);
            BO.ZoneBuild.update(dt);
            BO.ZoneFinale.update(dt);
            BO.ZoneWild?.update(dt);
            BO.ZoneCompanions?.update(dt);
            BO.ZoneArmory?.update(dt);
            BO.ZoneDungeons?.update(dt);
            BO.ZoneLegends?.update(dt);
            BO.ZoneWorldPlus?.update(dt);
            BO.ZoneSandbox?.update(dt);
            BO.ZoneThrill?.update(dt);
            BO.GM?.update(dt);
            this.loot.update(dt);
            this.updateBody(dt);
            this.updateHazards(dt, this.campaign?.darkness ?? 0);

            // 10 Hz throttle for non-visual quest/contract/frontier/archive/infest tickers
            this._sysClock += dt;
            if (this._sysClock >= 0.1) {
                const sdt = this._sysClock;
                this._sysClock = 0;
                BO.ZoneFrontier.update(sdt);
                BO.ZoneArchive.update(sdt);
                BO.ZoneEvents.update(sdt);
                BO.ZoneInfest?.update(sdt);
                BO.ZoneContracts?.update(sdt);
                BO.ZoneQuests?.update(sdt);
            }

            this.updatePrompt(dt);
            this.campaign?.update(dt);
            BO.Zone.animate(BO.World, this.clock);
            if (!p.alive) this.handleDeath();
        }

        /** Sun, sky, fog and shadow framing follow the clock, weather and player. */
        updateEnvironment(dt) {
            const p = BO.Player;
            const c = this.campaign;
            const darkness = c?.darkness ?? 0;
            const phase = this.clock % 300;
            const gmWeather = BO.GM?.active ? BO.GM.get('weather')?.globalName?.() : null;
            this.weather = gmWeather ? gmWeather : !c?.options.weather || c?.has('sv_no_weather') ? 'Clear' : c?.has('sv_no_sun') ? 'Overcast' : phase < 90 ? 'Overcast' : phase < 150 ? 'Ash rain' : phase < 225 ? 'Rad fog' : 'Clearing';
            const FR = BO.ZoneFrontier;
            this.localWeather = FR?.active ? FR.localize(this.weather) : this.weather;
            if (c?.has('sv_no_rain') && /rain|blizzard|storm|snow/i.test(this.localWeather)) this.localWeather = 'Overcast';
            const fog = this.scene.fog;
            const nearbyFire = this.fire.some((f) => f.pos.distanceTo(p.pos) < 6);
            const regionFog = BO.Zone.regionAt(p.pos.x, p.pos.z).threat >= 5 ? 0.006 : 0;
            const radFog = this.weather === 'Rad fog' && this.localWeather === 'Rad fog' ? 0.012 : this.weather === 'Ash rain' && this.localWeather === 'Ash rain' ? 0.004 : 0;
            fog.density = 0.0052 + radFog + (FR?.active ? FR.fogExtra() : 0) + darkness * 0.006 + (nearbyFire ? 0.004 : 0) + regionFog;
            if (FR?.active) fog.color.copy(FR.fogTint(dt)).lerp(NIGHT_FOG, darkness);
            else fog.color.setHex(0x8f9a90).lerp(NIGHT_FOG, darkness);
            if (c?.deep?.bloodMoonActive) fog.color.lerp(BLOOD_FOG, 0.6);
            if (this.scene.background?.isColor) this.scene.background.copy(fog.color);
            if (this.weatherLight) {
                const hour = c?.hour ?? 12;
                const a = ((hour - 6) / 12) * Math.PI;
                const sunDir = SUN_DIR.set(Math.cos(a) * 0.8, Math.max(0.12, Math.sin(a)), 0.45).normalize();
                this.weatherLight.position.copy(p.pos).addScaledVector(sunDir, 110);
                this.weatherLight.target.position.copy(p.pos);
                this.weatherLight.intensity = Math.max(0.05, 1.45 - darkness * 1.35);
                this.weatherLight.color.setHex(c?.deep?.bloodMoonActive ? 0xf87171 : darkness > 0.5 ? 0x9fb4ff : 0xffe1b3);
            }
            if (this.weatherHemi) this.weatherHemi.intensity = 1.05 - darkness * 0.72;
            this.lodClock -= dt;
            if (this.lodClock <= 0 && BO.World.terrain) {
                this.lodClock = 0.5;
                BO.World.terrain.updateLOD(p.pos.x, p.pos.z, 140);
                // The fog hides everything past ~450 m; the Lantern beam ignores fog and stays visible across the Zone.
                if (this.camera && this.camera.far !== 480) { this.camera.far = 480; this.camera.updateProjectionMatrix(); }
                for (const mk of this.markers) {
                    if (!mk.light) continue;
                    const vis = mk.alive !== false && Math.abs(mk.x - p.pos.x) < 130 && Math.abs(mk.z - p.pos.z) < 130;
                    if (mk.light.visible !== vis && !(mk.kind === 'nest' && mk.alive === false)) mk.light.visible = vis;
                }
            }
        }

        /** Falls, fractures and the limp they cause. */
        updateBody(dt) {
            const p = BO.Player;
            if (!p.alive) return;
            // Swimming: deep reservoir water holds you at the surface and breaks any fall.
            const Z = BO.Zone;
            const surface = Z.WATER - 1.35;
            const deep = Z.inReservoir(p.pos.x, p.pos.z) && BO.World.terrainHeight(p.pos.x, p.pos.z) < surface;
            if (deep && p.pos.y < surface + 0.05) {
                if (!this.swimming) {
                    this.swimming = true;
                    if (this.wasAirborne && -this.fallPeak > 6) BO.FX.spawnParticles(new THREE.Vector3(p.pos.x, Z.WATER, p.pos.z), 18, 0xbfe3ef, 4, 6, 0.7);
                    this.toast('Swimming · slow and loud. Infected cannot follow you into deep water.');
                }
                p.pos.y = Math.min(surface, p.pos.y + dt * 6);
                if (p.vel.y < 0) p.vel.y = 0;
                p.onGround = true;
                this.wasAirborne = false;
                this.fallPeak = 0;
                if (Math.random() < dt * 2) BO.ZoneDirector.noise(p.pos.x, p.pos.z, 14, 'swim');
                return;
            }
            if (this.swimming && (!deep || p.pos.y > surface + 0.4)) this.swimming = false;
            if (!p.onGround) {
                this.wasAirborne = true;
                this.fallPeak = Math.min(this.fallPeak, p.vel.y);
            } else if (this.wasAirborne) {
                const v = -this.fallPeak;
                this.wasAirborne = false;
                this.fallPeak = 0;
                if (v > 14.5 && !BO.Player.isFlying && !this.campaign.has('sv_no_fall') && !BO.ZoneWorldPlus?.noFallDamage?.()) {
                    const dmg = Math.round((v - 14.5) * 7);
                    p.takeDamage(dmg);
                    BO.Player.cameraShake = Math.max(BO.Player.cameraShake || 0, 0.12);
                    if (v > 16.5 && !this.fracture) {
                        this.fracture = true;
                        this.campaign.mark('fractures', 1, 0);
                        this.toast('You broke your leg. Craft or use a splint to stop limping.');
                    }
                }
            }
        }

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
                    sub: (fresh.length ? 'NEW THREATS: ' + fresh.slice(0, 3).join(', ').toUpperCase() + (fresh.length > 3 ? ' +' + (fresh.length - 3) : '') + ' · ' : '') + 'THE ZONE GROWS MORE DANGEROUS',
                    color: '#f2b45a'
                });
                BO.Sound?.playRoundStart?.(day);
                c.objectives.onNewDay?.(day);
            } else if (nightNo && nightNo !== this.lastNight) {
                this.lastNight = nightNo;
                this.updateThreat();
                this.toast('Night falls. Light makes you visible from far away — use it carefully.');
            } else if (!nightNo && this.threat?.night) {
                this.updateThreat();
                this.toast('Dawn breaks.');
            }
        }

        updateHazards(dt, darkness) {
            const p = BO.Player;
            const c = this.campaign;
            const needs = c?.options.survivalNeeds !== false;
            const deep = c?.deep;
            const fx = deep?.modFx;
            if (needs) this.hunger = Math.max(0, this.hunger - dt * (c.has('hungry') ? 0.2 : 0.1) * (fx?.hungerDrainMult || 1));
            const region = BO.Zone.regionAt(p.pos.x, p.pos.z);
            const underground = BO.World.terrain && p.pos.y < BO.World.terrainHeight(p.pos.x, p.pos.z) - 2.5;
            const radSource = region.threat >= 5 ? 2.2 : region.threat >= 4 ? 0.7 : underground ? 1.2 : 0;
            const resMult = Math.max(0.4, 1 - (BO.SurvivalCareer?.masteryRank?.('resonance') || 0) * 0.15);
            const obsidianShield = (p.maxArmor || 150) >= 180 ? 0.75 : 1;
            const shielding = (c.pack.filtered ? 0.18 : 1) * obsidianShield * (needs && c.has('irradiated') ? 1.8 : 1) * (fx?.radGainMult || 1) * (this.weather === 'Rad fog' ? 1.4 : 1) * (this.tierSpec?.rad || 1) * resMult;
            this.radiation = BO.Math.clamp(this.radiation + dt * (radSource ? radSource * shielding : -0.9), 0, 100);
            this.composure = BO.Math.clamp(this.composure + dt * (this.mealUntil > this.clock ? 1.6 : -darkness * 0.42), 0, 100);
            if (this.composure < 30) p.swayX += Math.sin(this.clock * 7) * 0.00045;
            this.hazardClock -= dt;
            if (this.hazardClock <= 0) {
                this.hazardClock = 1;
                const damage = needs ? (this.radiation >= 75 ? 2 : 0) + (this.hunger <= 0 ? 1 : 0) : 0;
                if (damage) p.takeDamage(damage);
                // M6 ambient survival audio: Geiger ticks, low-HP heartbeat, subtle weather gusts
                if (this.radiation > 12 || radSource > 0) {
                    const intensity = Math.min(1, Math.max(this.radiation / 80, radSource / 2.2));
                    if (Math.random() < 0.35 + intensity * 0.55) BO.Sound?.playGeigerTick?.(intensity);
                }
                if (p.alive && p.hp > 0 && p.hp / p.maxHp < 0.3) {
                    BO.Sound?.playHeartbeat?.(1 - (p.hp / p.maxHp) / 0.3);
                }
                if ((this.weather === 'Ash rain' || this.weather === 'Rad fog' || BO.ZoneFrontier?.local === 'Blizzard') && Math.random() < 0.14) {
                    BO.Sound?.playWeatherGust?.(BO.ZoneFrontier?.local === 'Blizzard' ? 'blizzard' : this.weather === 'Ash rain' ? 'ash' : 'wind');
                }
            }
            this.fireClock -= dt;
            const pulse = this.fireClock <= 0;
            if (pulse) this.fireClock = 0.75;
            for (const f of this.fire) {
                f.life -= dt;
                if (!pulse || f.life <= 0) continue;
                BO.FX.spawnParticles(f.pos.clone().add(new THREE.Vector3(0.7, 0.3, 0)), 4, 0xcb6630, 1.2, -1.2, 0.8);
                if (p.pos.distanceTo(f.pos) < 1.7 && !BO.ZoneWorldPlus?.hasFireWard?.()) p.takeDamage(7, f.pos);
                for (const part of this.structures.values()) {
                    if (part.material !== 'wood' || part.hp <= 0 || part.mesh.position.distanceTo(f.pos) > 2.7) continue;
                    this.damagePart(part, 15, 'fire');
                }
                for (const unit of [...this.zombies, ...this.bots]) {
                    if (unit.alive && unit.pos.distanceTo(f.pos) < 1.7) this.hit(unit, 22, 'torso', null, 'fire');
                }
            }
            this.fire = this.fire.filter((f) => {
                if (f.life > 0) return true;
                this.disposeOwned(f.mesh);
                return false;
            });
        }

        _syncMarkerGrid() {
            if (!this._markerGrid) return;
            if (this._markerIndexedCount > this.markers.length) {
                this._markerGrid.clear();
                this._discoverMarkers.length = 0;
                this._markerIndexedCount = 0;
            }
            for (let i = this._markerIndexedCount; i < this.markers.length; i++) {
                const mk = this.markers[i];
                if (!mk) continue;
                if (mk.discover) this._discoverMarkers.push(mk);
                else this._markerGrid.insert(mk, mk.x, mk.z);
            }
            this._markerIndexedCount = this.markers.length;
        }

        updatePrompt(dt = 0.016) {
            const p = BO.Player.pos;
            const score = (mk) => distance(p, mk) + (mk.id.startsWith('node:') || mk.id.startsWith('tree:') ? 0.9 : 0) + (mk.to ? 0.6 : 0) - (mk.container?.story ? 0.8 : 0);
            this._syncMarkerGrid();
            const list = this._markerGrid ? this._markerGrid.queryNear(p.x, p.z, 4.5, this._nearQueryBuf) : this.markers;
            let best = null, bestS = Infinity;
            for (let i = 0; i < list.length; i++) {
                const mk = list[i];
                if (!mk || mk.alive === false || mk.discover) continue;
                const dx = Math.abs(mk.x - p.x);
                if (dx > 3.2) continue;
                const d = distance(p, mk);
                if (d > (mk.reach || 3.2)) continue;
                const s = score(mk);
                if (s < bestS) { bestS = s; best = mk; }
            }
            this.near = best;
            // Landmarks are discovered by getting close (2 Hz check instead of full scan every frame)
            this._discClock -= dt;
            if (this._discClock <= 0) {
                this._discClock = 0.5;
                for (let i = 0; i < this._discoverMarkers.length; i++) {
                    const mk = this._discoverMarkers[i];
                    if (mk.found) continue;
                    const dx = mk.x - p.x, dz = mk.z - p.z;
                    if (dx * dx + dz * dz < 484) {
                        mk.found = true;
                        this.campaign.mark('landmarks', 1, 25);
                        this.campaign.mark('found_' + mk.id, 1, 0);
                        this.toast('Discovered ' + mk.name + ' · +25 XP');
                    }
                }
            }
        }

        get objective() {
            return this.campaign?.objectives.objective || '';
        }

        get prompt() {
            const n = this.near;
            if (!n) return '';
            if (n.container) return n.label;
            return (this.campaign.pack.prompt(n.id)) || n.label || '';
        }

        interact() {
            if (!this.active || !BO.Player.alive) return;
            const veh = BO.GM?.active ? BO.GM.get('vehicles') : null;
            if (veh?.riding) { veh.exit(); return; } // Interact always gets you out of a vehicle
            const site = this.near;
            if (!site) return;
            if (site.to) {
                BO.Player.pos.set(site.to.x, site.to.y + 0.05, site.to.z);
                BO.Player.vel.set(0, 0, 0);
                BO.Sound?.playFootstep?.(true);
                return;
            }
            if (BO.GM?.interact(site)) return;
            if (BO.ZoneWorldPlus?.activateMarker?.(site)) return;
            if (BO.ZoneDungeons?.activate(site) || BO.ZoneLegends?.activate(site) || BO.ZoneCompanions?.activate(site) || BO.ZoneArmory?.activate(site) || BO.ZoneWild?.activate(site)) return;
            if (BO.ZoneFrontier.activate(site)) return;
            if (BO.ZoneEvents.activate(site)) return;
            if (BO.ZoneInfest?.activate(site)) return;
            if (BO.ZoneContracts?.activate(site)) return;
            if (this.loot.begin(site)) return;
            if (site.pickup) { this.loot.takePickup(site); return; }
            if (this.campaign?.activate(site)) return;
        }

        /* ================================================================ economy */
        grant(items) {
            const { accepted, remainder } = this.campaign.pack.receive(items);
            const count = Object.entries(items).reduce((total, [id, value]) => total + (BO.SurvivalFrontierData.items[id] ? value : 0), 0);
            this.salvaged += count;
            this.campaign.mark('salvaged', count, 2);
            const found = BO.SurvivalItemAmounts(accepted);
            const overflow = BO.SurvivalItemAmounts(remainder);
            if (found) BO.GM?.call('onGranted', accepted);
            if (overflow) this.toast((found ? 'Packed ' + found + '. ' : '') + 'Pack full — dropped ' + overflow);
            else if (found) {
                const feed = BO.GM?.active ? BO.GM.get('gather') : null;
                if (feed?.feed) feed.feed(accepted);
                else this.toast('Found ' + found);
            }
        }

        canAfford(cost) { return Object.entries(cost).every(([key, amount]) => (this.points[key] || 0) >= amount); }

        spend(cost) {
            if (!this.canAfford(cost)) return false;
            for (const [key, amount] of Object.entries(cost)) this.points[key] -= amount;
            return true;
        }

        craft(id) {
            const recipe = BO.SurvivalData.recipes.find((item) => item.id === id);
            const c = this.campaign;
            const ok = id === 'cook' ? (c?.stationAvailable('campfire') || c?.stationAvailable('bench')) : c?.stationAvailable('bench');
            if (!this.active || !ok || !recipe || !this.spend(recipe.cost)) return false;
            if (id === 'medkit') this.points.medkits = (this.points.medkits || 0) + 1;
            else if (id === 'cook') {
                this.hunger = Math.min(100, this.hunger + 55);
                this.composure = 100;
                this.mealUntil = this.clock + 120;
                c.mark('cooked', 1, 0);
            } else if (id === 'incendiary') this.ember += 12;
            c.mark('crafted', 1, 14);
            this.toast(recipe.name + ' ready.');
            return true;
        }

        configureCoil(w) { w.survivalCoil = true; }

        useItem(id) {
            if (!this.active || !BO.Player.alive) return false;
            const p = BO.Player;
            const deep = this.campaign.deep;
            if (id === 'medkits' && p.hp < p.maxHp && this.points.medkits > 0) {
                this.points.medkits--;
                const traumaBonus = 1 + (BO.SurvivalCareer?.masteryRank?.('trauma') || 0) * 0.15;
                const restored = Math.min(p.maxHp - p.hp, Math.round((this.campaign.has('fieldMedic') ? 75 : 55) * traumaBonus));
                p.hp += restored;
                if (deep) deep.bleeding = 0;
                this.campaign.mark('healed', Math.ceil(restored), 0);
                this.toast('Trauma kit applied (+' + Math.ceil(restored) + ' HP).');
                return true;
            }
            if ((id === 'rations' || id === 'canned') && this.hunger < 100 && this.points[id] > 0) {
                this.points[id]--;
                this.hunger = Math.min(100, this.hunger + (id === 'canned' ? 30 : 35));
                if (id === 'canned' && deep) deep.hydration = Math.min(100, deep.hydration + 8);
                this.toast(id === 'canned' ? 'Ate canned food (+30 food).' : 'Ate a field ration (+35 food).');
                return true;
            }
            if (id === 'splint' && this.points.splint > 0) {
                if (!this.fracture) { this.toast('You have no fracture to set.'); return false; }
                this.points.splint--;
                this.fracture = false;
                this.toast('Splint applied. You can walk normally again.');
                return true;
            }
            if (id === 'painkillers' && this.points.painkillers > 0) {
                this.points.painkillers--;
                p.hp = Math.min(p.maxHp, p.hp + 10);
                this.composure = Math.min(100, this.composure + 20);
                this.painUntil = this.clock + 90;
                this.toast('Painkillers taken: limping and shaky aim eased for 90 s.');
                return true;
            }
            if (id === 'gunkit' && this.points.gunkit > 0) {
                const w = p.activeWeapon;
                if (!w || w.stats.kind === 'melee') { this.toast('Hold the firearm you want to repair.'); return false; }
                if ((w.cond ?? 100) >= (w.maxCond ?? 100) - 1) { this.toast('This weapon is already in top condition.'); return false; }
                this.points.gunkit--;
                w.maxCond = Math.max(40, (w.maxCond ?? 100) - 5);
                w.cond = Math.min(w.maxCond, (w.cond ?? 50) + 35 * (this.campaign?.deep?.modFx?.repairMult || 1));
                if (this.jammed === w) this.jammed = null;
                this.toast((w.stats.shortName || 'Weapon') + ' repaired to ' + Math.round(w.cond) + '%.');
                return true;
            }
            const none = { medkits: p.hp >= p.maxHp ? 'Health is already full.' : 'No trauma kits left.', rations: this.hunger >= 100 ? 'You are not hungry.' : 'No rations left.' };
            if (none[id]) this.toast(none[id]);
            return false;
        }

        consume(id) {
            if (!this.active || !BO.Player.alive || !this.campaign) return false;
            const wp = BO.ZoneWorldPlus?.consume?.(id);
            if (wp !== undefined) return wp;
            const wild = BO.ZoneWild?.consume(id);
            if (wild !== undefined) return wild;
            if (['medkits', 'rations', 'canned', 'splint', 'painkillers', 'gunkit'].includes(id)) return this.useItem(id);
            const before = this.points[id] || 0;
            const ok = this.campaign.pack.use(id);
            if (!ok && before > 0) {
                const p = BO.Player;
                const why = id === 'bandage' && p.hp >= p.maxHp && !(this.campaign.deep?.bleeding > 0) ? 'Health is already full.' :
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
            this.toast(reading + ' · ' + w.reserve + ' in your pack · condition ' + Math.round(w.cond ?? 100) + '%');
        }

        /* ================================================================ death */
        handleDeath() {
            if (BO.GM?.active && BO.GM.get('loot')?.handleDeath()) return;
            const c = this.campaign;
            const p = BO.Player;
            if (c.has('ironRun')) return this.finish(false);
            this.deaths++;
            c.mark('deaths', 1, 0);
            // If you fell inside a sealed dungeon or arena space, exit cleanly and drop your pack at the threshold so it is never stranded off-map.
            let dropPos = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
            if (BO.ZoneDungeons?.inside) {
                const ret = BO.ZoneDungeons.inside.ret;
                dropPos = { x: ret.x, y: BO.World.getGroundHeight(ret.x, ret.z, (ret.y || 0) + 2), z: ret.z };
                BO.ZoneDungeons.leave(true);
            } else if (BO.ZoneLegends?.arena) {
                const ret = BO.ZoneLegends.arena.ret;
                dropPos = { x: ret.x, y: BO.World.getGroundHeight(ret.x, ret.z, (ret.y || 0) + 2), z: ret.z };
                BO.ZoneLegends.leaveArena(true);
            }
            // Everything you carried stays in a body bag where you fell (or right outside the doorway).
            const items = { ...this.points };
            for (const k of Object.keys(items)) if (!(items[k] > 0) || !BO.SurvivalFrontierData.items[k]) delete items[k];
            if (Object.keys(items).length) {
                c.pack.dropBag(items, dropPos, 'bag:body' + this.deaths);
                const bag = c.pack.bags.get('bag:body' + this.deaths);
                if (bag) { bag.marker.label = 'Recover your gear'; bag.body = true; bag.mesh.material.color.setHex(0xc84b3c); }
                for (const k of Object.keys(items)) this.points[k] = 0;
            }
            this.lastBody = { x: dropPos.x, y: dropPos.y, z: dropPos.z };
            const respawn = c.respawnPoint();
            c.restHours += 6;
            this.radiation = Math.min(this.radiation, 20);
            this.fracture = false;
            if (c.deep) { c.deep.bleeding = 0; c.deep.infection = 0; }
            p.pos.set(respawn.x, respawn.y + 0.1, respawn.z);
            p.vel.set(0, 0, 0);
            p.alive = true;
            p.hp = Math.round(p.maxHp * 0.6);
            p.reviveGraceTimer = 5;
            this.hunger = Math.max(this.hunger, 35);
            for (const zb of this.zombies) if (zb.zs) zb.zs.state = 'idle';
            BO.Events.emit('hud:banner', { title: 'YOU WOKE UP AT ' + respawn.name.toUpperCase(), sub: 'SIX HOURS HAVE PASSED · YOUR GEAR IS WHERE YOU FELL', color: '#ef6b6b' });
            c.save(true);
        }

        finish(victory, ending = null, awarded = false) {
            this.active = false;
            BO.SurvivalUI.close();
            const c = this.campaign;
            const tier = this.zoneTier || 1;
            const tierBonus = this.tierSpec?.bonusComm || 0;
            let earnedComm = 0;
            if (victory && awarded) {
                c?.mark('extracts', 1, 300);
                earnedComm = (BO.ZoneFinale?.endingCommendations?.(ending) || 5) + tierBonus;
            } else if (victory) {
                c?.mark('extracts', 1, 300);
                earnedComm = (ending ? 5 : 3) + tierBonus;
                BO.SurvivalCareer.awardCommendations?.(earnedComm);
                BO.SurvivalCareer.bankExtraction?.(this.points);
                if (ending) BO.SurvivalCareer.recordEnding?.(ending, tier);
            }
            BO.SurvivalCareer.tick(c.run, 'seconds', Math.floor(this.clock), 0);
            BO.SurvivalCareer.recordRun?.({
                id: c?.run,
                victory,
                ending,
                tier,
                seed: this.seed || '',
                daily: !!c?.options?.daily,
                difficulty: this.difficulty,
                gameType: c?.options?.gameType || 'expedition',
                kit: BO.SurvivalCareer?.profile?.kit || 'standard',
                days: c?.day || 1,
                kills: this.kills,
                regions: c?.visited?.size || 1,
                hordes: c?.metrics?.hordesSurvived || 0,
                bosses: c?.metrics?.bosses || 0,
                deaths: this.deaths || 0,
                time: this.clock,
                commendations: earnedComm
            });
            BO.SurvivalCareer.discard(c?.run);
            const titles = { extract: 'EXTRACTED WITH THE DATA', seal: 'THE LANTERN IS SEALED', seize: 'THE LANTERN IS YOURS' };
            const stats = { mode: 'survival', victory, title: victory ? (titles[ending] || 'EXPEDITION COMPLETE') : 'EXPEDITION LOST',
                mapName: BO.Zone.map.name + ' · Tier ' + tier + (this.seed ? ' (' + this.seed + ')' : ''), time: BO.Math.formatTime(this.clock), kills: this.kills, salvaged: this.salvaged,
                breaches: this.breaches, recoveredCore: !!ending };
            BO.Menus.showAAR(stats);
        }

        toast(text) {
            BO.Events.emit('hud:toast', { text, color: '#a6ddd0' });
        }
    }

    BO.SurvivalMode = new SurvivalMode();
})(window.BO);
