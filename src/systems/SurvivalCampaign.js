
(function (BO) {
    'use strict';

    const data = BO.SurvivalCampaignData;
    const career = BO.SurvivalCareer;
    const near = (a, b, max) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= max;

    class SurvivalCampaign {
        constructor(mode, options) {
            this.mode = mode;
            this.pack = new BO.SurvivalPack(this);
            this.options = BO.SurvivalCampaignOptions(options);
            this.hotbar = new BO.SurvivalHotbar(this);
            this.objectives = new BO.SurvivalObjectives(this);
            this.activities = BO.SurvivalActivities ? new BO.SurvivalActivities(this) : null;
            this.deep = BO.SurvivalDeepSystems ? new BO.SurvivalDeepSystems(this) : null;
            this.run = options.resume?.run || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
            this.metrics = {};
            this.claims = {};
            this.visited = new Set();
            this.vehicles = new Set();
            this.placed = [];
            this.gates = new Map();
            this.npcs = [];
            this.npcById = new Map();
            this.vehicle = null;
            this.area = null;
            this.restHours = 0;
            this.buildRotation = 0;
            this.nextSave = 40;
            this.nextPatrol = 50;
            this.vehicleModels = new Map();
            this.selectedEnemies = this.getPool('relay');
        }

        has(modifier) { return this.options.modifiers.includes(modifier); }

        /** Hours elapsed since midnight of day 1 (start hour included). */
        get totalHours() {
            return this.options.startHour + this.mode.clock / this.options.dayLength * 24 + this.restHours;
        }

        get hour() {
            return ((this.totalHours % 24) + 24) % 24;
        }

        /** Day 1 is the deployment day; a new day begins at midnight. */
        get day() { return Math.max(1, Math.floor(this.totalHours / 24) + 1); }

        /** Night 1 is the first evening (19:00) after deployment; a night spans 19:00-06:00. */
        get nightNumber() { return Math.floor((this.totalHours + 5) / 24); }

        get clockFace() {
            const whole = Math.floor(this.hour);
            const minutes = Math.floor((this.hour - whole) * 60);
            return String(whole).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
        }

        get isNight() { return this.hour >= 19 || this.hour < 6; }

        get darkness() {
            const sun = Math.cos((this.hour - 12) * Math.PI / 12);
            return this.has('blackout') ? 1 : 1 - BO.Math.clamp((sun + (this.has('longDusk') ? 0.05 : 0.32)) * 1.05, 0, 1);
        }

        /** Enabled infected, weakest first. */
        get roster() {
            const active = BO.Zone.bestiary().filter((enemy) => !this.options.disabledEnemies.includes(enemy.id));
            return active.length ? active : [BO.Zone.bestiary()[0]];
        }

        /** Enemy types allowed to spawn right now: the day's unlocked tier, flavoured by area and pool. */
        getPool(area) {
            const kind = this.options.pool;
            const list = this.roster;
            const areaSpec = data.areas.find((a) => a.id === area);
            const tierBoost = Math.max(0, (areaSpec?.tier || 1) - 1);
            const day = this.mode.threat?.day || this.day;
            const threat = BO.SurvivalRules.threat(day + tierBoost, this.isNight, this.options, this.mode.difficultyRules, list.length);
            const defaultAllowed = new Set(list.slice(0, Math.max(1, threat.poolSize)).map((z) => z.id));
            const ZC = BO.ZombieCustomizer;
            const allowed = list.filter((z) => {
                if (ZC) {
                    const customStart = ZC.getStartRound(z.id);
                    if (customStart != null) return day >= customStart;
                }
                return defaultAllowed.has(z.id);
            });
            const finalAllowed = allowed.length ? allowed : list.slice(0, 1);
            const keywordsByArea = {
                crash: 'shambler|ankle_biter', relay: 'shambler|ankle_biter|sprinter',
                hollow: 'shambler|ankle_biter|hunch_spitter|one_arm_ripper',
                kessel: 'shield_walker|iron_juggernaut|club_goliath|headless_charger',
                pine: 'shadow_stalker|sprinter|one_arm_ripper',
                spillway: 'mud_waddler|bloater|hunch_spitter',
                frost: 'club_goliath|shambler|headless_charger',
                cinder: 'bloater|headless_charger|iron_juggernaut',
                campus: 'shadow_stalker|shield_walker|iron_juggernaut',
                crater: 'iron_juggernaut|club_goliath|shadow_stalker'
            };
            const keywords = [keywordsByArea[area], data.pools[kind]?.keywords].filter(Boolean).join('|');
            const preferred = keywords ? finalAllowed.filter((z) => new RegExp(keywords, 'i').test(z.id)) : [];
            // Area flavour only takes over once it has real variety; the newest unlocks always stay in rotation.
            if (preferred.length >= 3) return [...new Set([...preferred, ...finalAllowed.slice(-2)])];
            return finalAllowed;
        }

        /** Is a crafting station within reach? The Relay shelter doubles as workbench and stove. */
        stationAvailable(type) {
            if (type === 'hand') return true;
            const p = BO.Player.pos;
            const reach = 4.2;
            if ((type === 'bench' || type === 'campfire') && this.objectives.safehouseNear?.(p, 8)) return true;
            if (BO.ZoneWorldPlus?.stationAvailable?.(type, p)) return true;
            if (type === 'bench' && this.placed.some((piece) => piece.alive && piece.type === 'tanrack' && near(p, piece, reach))) return true;
            if (type === 'campfire' && this.placed.some((piece) => piece.alive && ['firepit', 'cookstation', 'smoker'].includes(piece.type) && near(p, piece, reach))) return true;
            return this.placed.some((piece) => piece.alive && piece.type === type && near(p, piece, reach));
        }

        get stations() {
            return ['hand', 'bench', 'campfire', 'kiln', 'cookstation', 'alchemy', 'arcane'].filter((type) => this.stationAvailable(type));
        }

        setup(checkpoint) {
            for (const npc of data.contacts) this.addNPC(npc);
            this.pack.setup();
            if (!checkpoint && this.has('fullBags')) this.pack.level = 2;
            if (!checkpoint && this.has('loaded')) this.pack.receive({ scrap: 4, cloth: 2, rations: 2, freshWater: 2, torch: 1 });
            if (!checkpoint) {
                const kit = BO.SurvivalMeta?.KITS?.[career.profile.kit];
                if (kit) {
                    if (kit.items && Object.keys(kit.items).length) this.pack.receive(kit.items, false);
                    if (kit.vehicle) this.vehicles.add(kit.vehicle);
                    if (kit.ammo && BO.Player.activeWeapon) BO.Player.activeWeapon.reserve += kit.ammo;
                    if (kit.techPoints && this.deep) this.deep.grantTechPoints(kit.techPoints);
                }
                const bpRank = career.masteryRank('blueprint_cache');
                if (bpRank > 0 && this.deep) this.deep.grantTechPoints(bpRank);
                const packed = career.consumePackedStash?.(this.pack);
                if (packed && Object.keys(packed).length) {
                    this.mode.toast('Archive drop packed: ' + BO.SurvivalItemAmounts(packed));
                }
                const armRank = career.masteryRank('armorer');
                if (armRank > 0) {
                    BO.Player.armor = Math.min(BO.Player.maxArmor || 150, BO.Player.armor + armRank * 25);
                    BO.Player.armorReservePlates = Math.min(8, BO.Player.armorReservePlates + armRank);
                }
            }
            this.objectives.setup(checkpoint?.objectives);
            this.activities?.setup();
            this.deep?.setup();
            this.mark('runs', 1, 0);
            if (checkpoint) this.restore(checkpoint);
            this.hotbar.setup(checkpoint?.hotbar);
            this.updateLocation();
        }

        stop() {
            this.pack.stop();
            this.activities?.stop();
            this.deep?.stop();
            for (const npc of this.npcs) npc.avatar.root.removeFromParent();
            for (const vehicle of this.vehicleModels.values()) vehicle.removeFromParent();
            this.npcs.length = 0;
        }

        mark(key, delta, xp = 0) {
            this.metrics[key] = (this.metrics[key] || 0) + delta;
            BO.SurvivalCareer.tick(this.run, key, this.metrics[key], xp);
        }

        addNPC(npc) {
            const m = this.mode;
            const ground = BO.World.getGroundHeight(npc.x, npc.z, 80);
            const marker = { ...npc, y: ground };
            const avatar = BO.CharacterMesh.buildSoldier(0, null);
            avatar.root.position.set(marker.x, marker.y, marker.z);
            avatar.root.rotation.y = (npc.x > 0 ? -1 : 1) * 1.18;
            avatar.root.scale.set(0.87, 0.93, 0.87);
            const badge = m.mesh(new THREE.OctahedronGeometry(0.12), 0xc0e9c1, marker.x, marker.y + 1.97, marker.z,
                { emissive: 0x8eea9d, emissiveIntensity: 0.42 });
            m.scene.add(avatar.root);
            this.npcs.push({ avatar, badge, npc: marker });
            this.npcById.set(npc.id, marker);
            m.markers.push({ ...marker, id: 'npc:' + npc.id, label: 'Talk to ' + npc.name });
        }

        updateLocation() {
            const pos = BO.Player.pos;
            const region = BO.Zone.regionAt(pos.x, pos.z);
            const area = data.areas.find((a) => a.id === region.id) || region;
            if (!area || area.id === this.area?.id) return;
            this.area = area;
            this.selectedEnemies = this.getPool(area.id);
            if (!this.visited.has(area.id)) {
                this.visited.add(area.id);
                this.mark('visited', 1, 23);
                const danger = ['', 'Low danger', 'Moderate danger', 'High danger', 'Severe danger', 'Extreme danger'][region.threat] || '';
                BO.Events.emit('hud:banner', { title: area.name.toUpperCase(), sub: danger.toUpperCase() + ' · +23 XP', color: ['#8fe3c8', '#8fe3c8', '#f2d07a', '#f2b45a', '#ef8a6b', '#c58bff'][region.threat] || '#8fe3c8' });
            }
        }

        update(dt) {
            this.updateLocation();
            this.pack.update();
            this.hotbar.reconcile();
            this.activities?.update(dt);
            this.deep?.update(dt);
            const m = this.mode;
            if (this.options.autosave && m.clock >= this.nextSave && this.canSave()) {
                this.nextSave = m.clock + 45;
                this.save(true);
            }
            this.objectives.update();
            const p = BO.Player;
            for (const contact of this.npcs) {
                const visible = near(p.pos, contact.npc, 60);
                contact.avatar.root.visible = visible;
                contact.badge.visible = visible;
            }
            if (this.vehicle === 'rover' || this.vehicle === 'bike') {
                if (Math.hypot(p.vel.x, p.vel.z) > 4) m.noise = Math.max(m.noise, this.vehicle === 'rover' ? 5 : 1.8);
            }
            if (this.vehicle === 'glider' && !p.onGround && p.vel.y < 0) {
                p.vel.y = Math.max(-1.6, p.vel.y);
                if (!this.gliding) this.mark('glides', 1, 36);
                this.gliding = true;
            } else if (this.vehicle === 'glider' && this.gliding && p.onGround) {
                this.vehicle = null;
                this.gliding = false;
            }
            if (this.mode.rider) this.vehicle = null;
            this.updateVehicleModel();
            this.metrics.radiation = Math.max(this.metrics.radiation || 0, Math.floor(m.radiation));
        }

        activate(marker) {
            if (this.activities?.activate(marker) || this.deep?.activate(marker) || this.objectives.activate(marker) || this.pack.interact(marker)) return true;
            const prefix = marker.id.split(':')[0];
            const id = marker.id.split(':')[1];
            if (prefix === 'npc') {
                BO.SurvivalUI.show('npc', null, id);
                return true;
            }
            if (prefix === 'build') {
                const piece = this.placed.find((entry) => entry.id === id && entry.alive);
                if (!piece) return true;
                if (piece.type === 'chest') BO.SurvivalUI.show('chest', null, piece.id);
                else if (['bench', 'campfire', 'kiln', 'firepit', 'cookstation', 'tanrack', 'smoker'].includes(piece.type)) BO.SurvivalUI.show('workshop');
                else if (piece.type === 'bed') {
                    if (!this.canSave()) this.mode.toast('Clear nearby enemies before resting.');
                    else {
                        this.restHours += 3;
                        this.mark('fieldRests', 1, 5);
                        this.mode.composure = 100;
                        this.mode.hunger = Math.max(1, this.mode.hunger - 10);
                        this.save();
                    }
                } else if (piece.type === 'ladder') {
                    BO.Player.pos.set(piece.x + 0.35, BO.Player.pos.y > piece.y + 1 ? piece.y : piece.y + 2.88, piece.z);
                    BO.Player.vel.set(0, 0, 0);
                }
                return true;
            }
            return false;
        }

        get station() {
            const id = this.mode.near?.id || '';
            const placed = id.startsWith('build:') ? this.placed.find((entry) => entry.alive && id === 'build:' + entry.id)?.type : null;
            if (placed) return placed;
            return ['cookstation', 'bench', 'campfire', 'kiln'].find((type) => this.stationAvailable(type)) || null;
        }

        get canBuild() {
            return this.mode.active && BO.Player.alive && !this.mode.rider && BO.Player.onGround && !this.mode.exfil;
        }

        buildTarget(type) {
            const p = BO.Player;
            const spec = data.build.find((entry) => entry.id === type);
            if (!spec) return null;
            const forward = p.getMoveDirectionVectors().forward;
            const x = Math.round((p.pos.x + forward.x * 2.6) * 2) / 2;
            const z = Math.round((p.pos.z + forward.z * 2.6) * 2) / 2;
            const y = BO.World.getGroundHeight(x, z, p.pos.y + 0.2);
            const turn = (Math.round(p.yaw / (Math.PI / 2)) + this.buildRotation) % 2;
            const size = turn ? [spec.size[2], spec.size[1], spec.size[0]] : spec.size;
            return { x, y, z, size, type };
        }

        build(type) {
            const target = this.buildTarget(type);
            const spec = data.build.find((part) => part.id === type);
            const m = this.mode;
            if (spec && BO.SurvivalRetired?.isRetiredBuild(type)) return m.toast(spec.name + ' is retired and can no longer be built.');
            if (!target || !spec || !this.canBuild) return this.mode.toast('Stand on stable ground to build.');
            if (spec.tech && this.deep && !this.deep.hasTech(spec.tech)) {
                const techNode = BO.SurvivalDeepData?.techTree.find((t) => t.id === spec.tech);
                return m.toast(`Research “${techNode?.name || spec.tech}” in Skills first.`);
            }
            const { x, y, z, size } = target;
            if (this.placed.length >= 80) return m.toast('Structure limit reached for this expedition.');
            const B = BO.Zone.BOUNDS;
            if (x < B.minX + 16 || x > B.maxX - 16 || z < B.minZ + 16 || z > B.maxZ - 16 || BO.Zone.regionAt(x, z).threat >= 4 ||
                BO.World.terrain?.slope(x, z) > 0.55) {
                return m.toast(BO.Zone.regionAt(x, z).threat >= 4 ? 'The ground here is too unstable to build on.' : 'Find flatter ground to build on.');
            }
            if (type === 'roof' && !this.placed.some((part) => part.alive && ['wall', 'stoneWall'].includes(part.type) && near(part, target, 3.1))) {
                return m.toast('A roof needs a nearby wall.');
            }
            const bottom = y + (type === 'roof' ? 2.72 : 0);
            let blocked = false;
            BO.World.queryColliders(x - size[0] / 2, z - size[2] / 2, x + size[0] / 2, z + size[2] / 2, (c) => {
                if (c.active && !c.tree && c.maxY > bottom + 0.07 && c.minY < bottom + size[1] - 0.04 &&
                    c.maxX > x - size[0] / 2 + 0.07 && c.minX < x + size[0] / 2 - 0.07 &&
                    c.maxZ > z - size[2] / 2 + 0.07 && c.minZ < z + size[2] / 2 - 0.07) { blocked = true; return true; }
                return false;
            });
            if (blocked) {
                return m.toast('The placement area is blocked.');
            }
            const point = { x, y, z };
            const protectedSite = m.markers.some((site) => site.alive !== false && !site.id.startsWith('build:') && near(site, point, 1.2));
            if (protectedSite) return m.toast('Keep access to contacts and mission sites clear.');
            const cost = BO.buildCostOf ? BO.buildCostOf(spec) : (typeof spec.cost === 'number' ? { scrap: spec.cost } : spec.cost);
            if (!m.spend(cost)) return m.toast('Required: ' + BO.SurvivalItemAmounts(cost));
            this.place({ ...target, id: String(this.placed.length), alive: true });
            this.mark('built', 1, 19);
            return true;
        }

        place(piece) {
            if (!piece.alive) {
                this.placed.push(piece);
                return;
            }
            const m = this.mode;
            const spec = data.build.find((part) => part.id === piece.type);
            const [w, h, d] = piece.size;
            const midY = piece.y + h / 2 + (piece.type === 'roof' ? 2.72 : 0);
            let mesh;
            if (piece.type === 'ladder') {
                const alongX = w > d;
                for (const side of [-1, 1]) m.mesh(new THREE.BoxGeometry(0.085, h, 0.085), spec.color,
                    piece.x + (alongX ? side * 0.30 : 0), midY, piece.z + (alongX ? 0 : side * 0.30));
                for (let i = 1; i <= 6; i++) m.mesh(new THREE.BoxGeometry(alongX ? 0.68 : 0.08, 0.085, alongX ? 0.08 : 0.68),
                    spec.color, piece.x, piece.y + i * 0.39, piece.z);
            } else {
                mesh = m.mesh(new THREE.BoxGeometry(w, h, d), spec.color, piece.x, midY, piece.z,
                    piece.type === 'campfire' ? { emissive: 0xd76218, emissiveIntensity: 0.64 } : {});
                piece.mesh = mesh;
                BO.ZoneWild?.decorate(piece);
                if (BO.ZoneBuild?.isStruct(piece.type) || ['wall', 'floor', 'roof', 'stoneWall', 'stoneFloor', 'door', 'woodDoor', 'ironDoor', 'doubleGate', 'platform', 'sandbagWall'].includes(piece.type)) {
                    const stone = /stone|obsidian|iron|arch|catwalk|pillar|door|Gate/.test(piece.type);
                    const part = m.addStructure(mesh, w, h, d, stone ? 'brick' : 'wood');
                    if (stone) part.hp = piece.type === 'door' ? 320 : 265;
                    part.buildPiece = piece;
                    if (Number.isFinite(piece.hp)) part.hp = piece.hp;
                    else part.hp = Math.round((part.hp || 120) * (this.deep?.modFx?.structureHpMult || 1));
                    piece.part = part;
                }
            }
            if (piece.type === 'wallTorch') this.pack.addLight(piece.id, piece);
            if (piece.type === 'chest' && !this.pack.chests.has(piece.id)) this.pack.chests.set(piece.id, {});
            if (['bed', 'bench', 'ladder', 'campfire', 'chest', 'kiln', 'firepit', 'cookstation', 'tanrack', 'smoker'].includes(piece.type)) {
                m.markers.push({ ...piece, id: 'build:' + piece.id, name: spec.name,
                    label: { bed: 'Rest and save', bench: 'Use crafting table', ladder: 'Climb ladder', campfire: 'Cook at campfire', chest: 'Open storage chest', kiln: 'Use stone kiln', firepit: 'Cook at the fire camp', cookstation: 'Use the cooking station', tanrack: 'Use the tanning rack', smoker: 'Use the smokehouse' }[piece.type] });
                if (piece.type === 'ladder') m.markers.push({ ...piece, y: piece.y + 2.86, id: 'build:' + piece.id, name: spec.name, label: 'Climb down' });
            }
            BO.ZoneWorldPlus?.decoratePlacedPiece?.(piece, spec);
            this.deep?.registerBuild(piece);
            this.placed.push(piece);
            BO.GM?.call('onBuild', piece, spec);
        }

        sleepUntilDawn() {
            if (!this.canSave()) {
                this.mode.toast('Clear nearby enemies before sleeping.');
                return false;
            }
            const hrs = this.hour >= 18 ? (24 - this.hour + 6) : this.hour < 6 ? (6 - this.hour) : 4;
            this.restHours += hrs;
            this.mark('fieldRests', 1, 5);
            BO.Player.hp = BO.Player.maxHp;
            this.mode.composure = 100;
            this.mode.hunger = Math.max(1, this.mode.hunger - 12);
            if (this.deep) {
                this.deep.flaskCharges = this.deep.flaskMax;
                this.deep.comfortUntil = this.mode.clock + 240;
                this.deep.bloodMoonActive = false;
            }
            this.save();
            this.mode.toast('Slept until morning. Health and Rested Comfort restored.');
            return true;
        }

        contact(id) {
            return this.npcById.get(id);
        }

        reward(id) {
            const npc = this.contact(id);
            if (!npc || this.mode.near?.id !== 'npc:' + id) return;
            if (npc.gift && !this.claims[id + ':gift']) {
                this.claims[id + ':gift'] = true;
                this.mode.grant(npc.gift);
            }
            const quest = npc.quest;
            if (!quest || this.claims[id + ':quest'] || (this.metrics[quest[1]] || 0) < quest[2]) return;
            this.claims[id + ':quest'] = true;
            this.mark('quests', 1, 0);
            BO.SurvivalCareer.tick(this.run, 'quest_' + id, 1, quest[3]);
            this.mode.grant({ scrap: 2, medkits: 1 });
            this.mode.toast('Contract complete: ' + quest[0] + ' · +' + quest[3] + ' XP');
        }

        trade(id, item) {
            const npc = this.contact(id);
            const offer = data.stock[item];
            const m = this.mode;
            if (!npc?.shop.includes(item) || !offer || m.near?.id !== 'npc:' + id) return false;
            if (offer.vehicle && this.hasVehicle(offer.vehicle)) return false;
            if (!m.spend(offer.cost)) return false;
            if (offer.gain) m.grant(offer.gain);
            if (offer.vehicle) this.vehicles.add(offer.vehicle);
            if (offer.ammo) {
                for (const w of BO.Player.weapons) w.reserve = Math.min(w.stats.reserveMax, w.reserve + offer.ammo);
            }
            if (offer.plates) BO.Player.armorReservePlates = Math.min(8, BO.Player.armorReservePlates + offer.plates);
            this.mark('trades', 1, 9);
            return true;
        }

        special(id) {
            const npc = this.contact(id);
            const m = this.mode;
            if (!npc?.special || m.near?.id !== 'npc:' + id || this.claims[id + ':special']) return false;
            if (npc.special !== 'helper' && !m.hostilesReleased) {
                m.toast('Boss challenges open after the safe period.');
                return false;
            }
            this.claims[id + ':special'] = true;
            if (npc.special === 'helper') {
                const scout = m.spawnBot(npc.x - 2, npc.y, npc.z, 'mp5', 145, 0);
                scout.name = npc.name;
                this.mark('rescued', 1, 48);
            } else {
                const target = m.spawnInfected(npc.x + 4, npc.y, npc.z - 3, npc.special);
                target.bossLabel = npc.special === 'frostBoss' ? 'Pale Maul' : 'Cinder Regent';
                m.toast(target.bossLabel + ' has entered the area.');
            }
            return true;
        }

        hasVehicle(id) {
            return this.vehicles.has(id) || career.level >= (data.vehicles.find((item) => item.id === id)?.level ?? Infinity);
        }

        ride(id) {
            const p = BO.Player;
            if (!id || this.vehicle === id) {
                this.vehicle = null;
                this.gliding = false;
                return true;
            }
            if (this.has('footOnly') || !this.hasVehicle(id) || this.mode.rider || p.pos.y < -1 || this.mode.exfil) return false;
            if (id === 'glider' && p.pos.y < 2.25) {
                this.mode.toast('Climb to a roof or the Relay launch deck to unfold the glider.');
                return false;
            }
            this.vehicle = id;
            this.mark('rides', 1, 3);
            return true;
        }

        updateVehicleModel() {
            for (const [id, vehicle] of this.vehicleModels) vehicle.visible = this.vehicle === id;
            if (!this.vehicle) return;
            if (!this.vehicleModels.has(this.vehicle)) this.vehicleModels.set(this.vehicle, this.buildVehicleModel(this.vehicle));
            const model = this.vehicleModels.get(this.vehicle);
            model.position.copy(BO.Player.pos);
            model.rotation.y = BO.Player.yaw;
            model.visible = true;
        }

        buildVehicleModel(id) {
            const m = this.mode;
            const spec = data.vehicles.find((item) => item.id === id);
            const group = new THREE.Group();
            const add = (geometry, color, x, y, z, rz = 0) => {
                const mesh = m.mesh(geometry, color, x, y, z);
                mesh.rotation.z = rz;
                group.add(mesh);
                return mesh;
            };
            const box = (w, h, d, color, x, y, z) => add(new THREE.BoxGeometry(w, h, d), color, x, y, z);
            const wheel = (radius, width, x, y, z) => add(new THREE.CylinderGeometry(radius, radius, width, 12),
                0x272e2b, x, y, z, Math.PI / 2);
            if (id === 'glider') {
                for (const side of [-1, 1]) {
                    const wing = box(1.65, 0.045, 0.66, spec.color, side * 0.82, 1.94, -0.23);
                    wing.rotation.y = side * 0.32;
                }
                box(0.06, 0.57, 0.061, 0x484e43, 0, 1.69, -0.26);
                box(0.66, 0.045, 0.05, 0x4b5750, 0, 1.42, -0.42);
            } else if (id === 'rover') {
                box(0.91, 0.28, 1.76, spec.color, 0, 0.37, -0.25);
                box(0.80, 0.08, 0.52, 0x6b8c90, 0, 0.65, -0.75);
                for (const side of [-1, 1]) {
                    for (const z of [-0.85, 0.38]) wheel(0.29, 0.13, side * 0.49, 0.31, z);
                    box(0.11, 0.10, 0.05, 0xe8cf8b, side * 0.31, 0.42, -1.14);
                }
            } else if (id === 'mount') {
                add(new THREE.SphereGeometry(0.43, 10, 8), spec.color, 0, 0.87, -0.20).scale.set(0.67, 0.71, 1.45);
                box(0.25, 0.55, 0.22, spec.color, 0, 1.04, -0.72);
                box(0.27, 0.20, 0.39, 0x8d6450, 0, 1.28, -0.88);
                box(0.36, 0.11, 0.36, 0x3c352c, 0, 1.15, -0.03);
                for (const side of [-1, 1]) for (const z of [-0.53, 0.22]) box(0.115, 0.60, 0.105, 0x776052, side * 0.22, 0.35, z);
            } else if (id === 'bike') {
                for (const z of [-0.78, 0.54]) wheel(0.31, 0.055, 0, 0.32, z);
                box(0.078, 0.062, 1.24, spec.color, 0, 0.51, -0.11).rotation.x = -0.17;
                box(0.07, 0.49, 0.07, spec.color, 0, 0.61, -0.67).rotation.x = -0.15;
                box(0.60, 0.06, 0.06, 0x394a43, 0, 0.86, -0.68);
            } else {
                for (const side of [-1, 1]) {
                    box(0.14, 0.095, 0.33, spec.color, side * 0.19, 0.12, -0.09);
                    for (const z of [-0.18, 0.01]) wheel(0.056, 0.037, side * 0.19, 0.064, z);
                }
            }
            m.scene.add(group);
            return group;
        }

        get speed() {
            const vehicle = data.vehicles.find((item) => item.id === this.vehicle);
            const p = BO.Player;
            const deep = this.deep;
            const mfx = deep?.modFx || {};
            let mult = 1 + (mfx.speedBonus || 0);
            if (deep) {
                if (deep.hasInfusion('swiftness')) mult *= 1.14;
                if (deep.activeTonics.aetherStim > this.mode.clock) mult *= 1.30;
                if (deep.activeTonics.staminElixir > this.mode.clock) mult *= 1.22;
                if (this.mode.hunger >= 75 && deep.hydration >= 75) mult *= 1.08;
            }
            mult *= (BO.ZoneWorldPlus?.speedMult?.() || 1);
            mult *= (BO.GM?.speedMult?.() || 1);
            if (this.mode.fracture && !(this.mode.painUntil > this.mode.clock)) mult *= 0.68;
            const pack = this.pack;
            const load = pack.weight() / Math.max(1, pack.limits.weight);
            if (load > 1) mult *= 0.7; else if (load > 0.8) mult *= 0.9;
            const t = BO.World.terrain;
            if (t && BO.Zone.inReservoir(p.pos.x, p.pos.z) && p.pos.y < BO.Zone.WATER - 0.2) mult *= 0.55;
            if (!vehicle) return mult;
            const road = !!BO.Zone.roadInfo(p.pos.x, p.pos.z) && BO.Zone.roadInfo(p.pos.x, p.pos.z).d < BO.Zone.roadInfo(p.pos.x, p.pos.z).road.w * 0.5;
            const navMult = 1 + career.masteryRank('navigator') * 0.15;
            return (road ? vehicle.speed : vehicle.offroad) * mult * navMult * (mfx.vehicleSpeedMult || 1);
        }

        canSave() {
            const p = BO.Player;
            return this.mode.active && p.alive && !this.mode.rider && !this.mode.exfil && !this.has('ironRun') && !this.objectives.unsafeToSave && !BO.ZoneHorde?.active &&
                ![...this.mode.zombies, ...this.mode.bots].some((enemy) => enemy.alive && enemy.team !== 0 && near(enemy.pos, p.pos, 9));
        }

        /** Fast-travel destinations: secured safehouses, radio towers, signposts, forts and waystones. */
        get travelPoints() {
            const base = this.objectives.travelPoints ? this.objectives.travelPoints() : [];
            const extra = BO.ZoneWorldPlus?.travelPoints?.() || [];
            return [...base, ...extra];
        }

        travel(id) {
            const dest = this.travelPoints.find((t) => t.id === id);
            if (!dest || this.has('footOnly') || !this.canSave()) return false;
            const p = BO.Player;
            if (this.pack.weight() > this.pack.limits.weight) { this.mode.toast('You are carrying too much to travel.'); return false; }
            if ((this.deep?.bleeding || 0) > 0) { this.mode.toast('Stop the bleeding before you travel.'); return false; }
            const dist = Math.hypot(dest.x - p.pos.x, dest.z - p.pos.z);
            if (dist < 15) return false;
            const instant = dest.instant || dest.kind === 'Waystone' || BO.ZoneWorldPlus?.isNearSignpost?.(p.pos.x, p.pos.z);
            const hours = instant ? 0 : Math.max(0.5, dist / 100) * (career.masteryRank('navigator') >= 2 ? 0.5 : 1);
            p.pos.set(dest.x, BO.World.getGroundHeight(dest.x, dest.z, (dest.y || 0) > 0.5 ? dest.y + 1.5 : 80) + 0.1, dest.z);
            p.vel.set(0, 0, 0);
            this.restHours += hours;
            if (hours > 0) this.mode.hunger = Math.max(0, this.mode.hunger - hours * 3);
            this.vehicle = null;
            this.updateLocation();
            this.mark('fastTravel', 1, 0);
            this.mode.toast(instant ? 'Instant transit to ' + dest.name + '!' : 'Travelled to ' + dest.name + ' · ' + hours.toFixed(1) + ' hours passed.');
            return true;
        }

        /** Where you wake after falling: nearest secured safehouse or bed, else the crash site. */
        respawnPoint() {
            const opts = [];
            for (const t of this.objectives.safehouses ? this.objectives.safehouses() : []) opts.push(t);
            for (const piece of this.placed) if (piece.alive && piece.type === 'bed') opts.push({ x: piece.x + 1, y: piece.y, z: piece.z, name: 'your field bed' });
            const body = this.mode.lastBody || BO.Player.pos;
            if (!opts.length) {
                const sp = BO.Zone.map.playerSpawn;
                return { x: sp.x + 2, y: BO.World.terrainHeight(sp.x + 2, sp.z), z: sp.z, name: 'the crash site' };
            }
            opts.sort((a, b) => Math.hypot(a.x - body.x, a.z - body.z) - Math.hypot(b.x - body.x, b.z - body.z));
            return { ...opts[0], y: BO.World.getGroundHeight(opts[0].x, opts[0].z, 80) };
        }

        /** force: story-critical saves (endings, boss kills) that must persist even with hostiles nearby. */
        save(quiet = false, force = false) {
            if (!force && !this.canSave()) {
                if (!quiet) this.mode.toast('Find a safe position before saving.');
                return false;
            }
            const m = this.mode;
            const p = BO.Player;
            this.metrics.seconds = Math.max(this.metrics.seconds || 0, Math.floor(m.clock));
            career.tick(this.run, 'seconds', this.metrics.seconds, 0);
            const checkpoint = {
                version: 2, run: this.run, seed: m.seed || this.options.seed || '', zoneTier: m.zoneTier || this.options.zoneTier || 1,
                loot: m.loot.snapshot(), fracture: m.fracture, deaths: m.deaths, lastBody: m.lastBody || null,
                trees: BO.World.zone ? BO.World.zone.trees.filter((t) => !t.alive).map((t) => [t.idx, t.type, t.renewAt || 0]) : [], at: Date.now(), options: this.options, pack: this.pack.snapshot(),
                objectives: this.objectives.snapshot(), activities: this.activities?.snapshot(), deep: this.deep?.snapshot(), frontier: BO.ZoneFrontier?.snapshot(),
                thrill: BO.ZoneThrill?.snapshot(), infest: BO.ZoneInfest?.snapshot(), contracts: BO.ZoneContracts?.snapshot(),
                wild: BO.ZoneWild?.snapshot(), companions: BO.ZoneCompanions?.snapshot(), armory: BO.ZoneArmory?.snapshot(), dungeons: BO.ZoneDungeons?.snapshot(), legends: BO.ZoneLegends?.snapshot(), quests: BO.ZoneQuests?.snapshot(),
                worldPlus: BO.ZoneWorldPlus?.snapshot(),
                gm: BO.GM?.active ? BO.GM.snapshot() : null,
                hostilesReleased: m.hostilesReleased,
                metrics: this.metrics, claims: this.claims, visited: [...this.visited], vehicles: [...this.vehicles],
                restHours: this.restHours, transport: this.vehicle, clock: m.clock, position: p.pos.toArray(), yaw: p.yaw,
                points: m.points, hp: p.hp, armor: p.armor, plates: p.armorReservePlates, lethal: p.lethalCount,
                tactical: p.tacticalCount, slot: p.activeSlot, hotbar: this.hotbar.snapshot(),
                threat: { patrols: !!m.patrolsDeployed, commander: !!m.commanderDeployed, lastDay: m.lastDay || 1, lastNight: m.lastNight || 0 },
                weapons: p.weapons.map((w) => ({ cfg: w.cfg, mag: w.mag, reserve: w.reserve, cond: w.cond ?? 100, maxCond: w.maxCond ?? 100, mk: w.survivalMk || 1 })),
                kills: m.kills, salvaged: m.salvaged, breaches: m.breaches,
                hunger: m.hunger, radiation: m.radiation, composure: m.composure, mealUntil: m.mealUntil, ember: m.ember,
                completed: [...m.completed],
                placed: this.placed.map(({ id, x, y, z, type, size, alive, part, stairDir }) => ({ id, x, y, z, type, size, alive, hp: part?.hp, stairDir })),
                // Infested packs and bounty targets are stored by their own systems.
                enemies: m.zombies.filter((z) => z.alive && !z.infest && !z.contract && !z.dungeon && !z.legend && !z.arena).map((z) => ({
                    type: z.survivalType, pos: z.pos.toArray(), hp: z.hp, spec: z.spec.id
                })),
                patrols: m.bots.filter((b) => b.alive).map((b) => ({
                    pos: b.pos.toArray(), hp: b.hp, maxHp: b.maxHp, name: b.name, weapon: b.weaponId,
                    team: b.team, commander: b === m.commander
                }))
            };
            const ok = career.store(JSON.parse(JSON.stringify(checkpoint)));
            if (!quiet) m.toast(ok ? 'Expedition saved in this browser.' : 'Browser storage is unavailable.');
            return ok;
        }

        restore(save) {
            const m = this.mode;
            const p = BO.Player;
            this.metrics = { ...save.metrics };
            this.claims = { ...save.claims };
            this.visited = new Set(save.visited);
            this.vehicles = new Set((save.vehicles || []).filter((id) => data.vehicles.some((v) => v.id === id)));
            this.restHours = save.restHours;
            this.vehicle = save.transport || null;
            m.clock = save.clock;
            const openSec = BO.SurvivalRules.openingSecondsFor ? BO.SurvivalRules.openingSecondsFor(this.options) : BO.SurvivalRules.openingSeconds;
            m.hostilesReleased = m.clock >= openSec && (save.hostilesReleased ?? true);
            this.nextSave = m.clock + 35;
            this.nextPatrol = m.clock + 35;
            m.nextSpawn = m.clock + 15;
            m.nextMimic = m.clock + 25;
            p.pos.fromArray(save.position);
            p.yaw = save.yaw;
            for (const key of ['kills', 'salvaged', 'breaches', 'hunger', 'radiation', 'composure', 'mealUntil', 'ember', 'fracture', 'deaths']) {
                if (save[key] !== undefined) m[key] = save[key];
            }
            m.lastBody = save.lastBody || null;
            m.lastDay = save.threat?.lastDay || this.day;
            m.lastNight = save.threat?.lastNight || 0;
            m.points = { ...m.points, ...save.points };
            m.completed = new Set(save.completed);
            p.hp = save.hp;
            p.armor = save.armor;
            p.armorReservePlates = save.plates;
            p.lethalCount = save.lethal;
            p.tacticalCount = save.tactical;
            p.weapons = save.weapons.map((entry) => {
                const w = p._createWeaponInstance(entry.cfg);
                w.cond = entry.cond ?? 80;
                w.maxCond = entry.maxCond ?? 100;
                if (entry.mk && entry.mk > 1) {
                    w.survivalMk = entry.mk;
                    const mult = entry.mk === 2 ? 1.24 : 1.48;
                    const magM = entry.mk === 2 ? 1.20 : 1.40;
                    w.stats.damage = Math.round(w.stats.damage * mult);
                    w.stats.magSize = Math.ceil(w.stats.magSize * magM);
                }
                w.mag = entry.mag;
                w.reserve = entry.reserve;
                return w;
            });
            p.activeSlot = save.slot === -1 ? -1 : Math.min(save.slot, p.weapons.length - 1);
            p.rebuildViewmodel();
            for (const id of save.completed) {
                const marker = m.markers.find((item) => item.id === id);
                if (marker?.light) marker.light.visible = false;
            }
            for (const enemy of [...m.zombies, ...m.bots]) enemy.destroy();
            m.zombies = [];
            m.bots = [];
            m.commander = null;
            if (save.trees && this.pack.restoreTrees) this.pack.restoreTrees(save.trees);
            m.breaches = save.breaches;
            for (const piece of save.placed) this.place(piece);
            if (save.pack) this.pack.restore(save.pack);
            if (save.activities && this.activities?.restore) this.activities.restore(save.activities);
            if (save.deep && this.deep?.restore) this.deep.restore(save.deep);
            for (const z of save.enemies) {
                const enemy = m.spawnInfected(...z.pos, z.type, z.spec, true);
                if (enemy) enemy.hp = z.hp;
            }
            for (const info of save.patrols) {
                const bot = m.spawnBot(...info.pos, info.weapon, info.maxHp, info.team, true);
                if (!bot) continue;
                bot.hp = info.hp;
                bot.name = info.name;
                if (info.commander) m.commander = bot;
            }
            m.toast('Expedition restored.');
        }
    }

    BO.SurvivalCampaign = SurvivalCampaign;
})(window.BO);
