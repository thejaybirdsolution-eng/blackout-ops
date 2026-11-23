
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
            this.objectives = new BO.SurvivalObjectives(this);
            this.activities = BO.SurvivalActivities ? new BO.SurvivalActivities(this) : null;
            this.deep = BO.SurvivalDeepSystems ? new BO.SurvivalDeepSystems(this) : null;
            this.run = options.resume?.run || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
            this.metrics = {};
            this.claims = {};
            this.visited = new Set();
            this.vehicles = new Set(['skates']);
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

        get hour() {
            return ((this.options.startHour + this.mode.clock / this.options.dayLength * 24 + this.restHours) % 24 + 24) % 24;
        }

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

        getPool(area) {
            const kind = this.options.pool;
            const list = BO.ZombiesData.ORDERED_PROGRESSION.filter((enemy) => !this.options.disabledEnemies.includes(enemy.id));
            const keywords = data.pools[kind].keywords;
            const keywordsByArea = { pine: 'wolf|hound|crawler|runner', frost: 'frost|cry|ice|wraith|ghost',
                cinder: 'fire|hell|inferno|magma|burn', trench: 'mutant|slime|hydra|phantom|brute',
                basin: 'acid|water|ooze|swamp|poison' };
            const preferred = keywordsByArea[area] || keywords;
            let candidates = preferred ? list.filter((z) => new RegExp(preferred, 'i').test(z.id)) : list;
            if (!candidates.length) candidates = list;
            const variety = kind === 'mutants' ? 12 : 6;
            return candidates.slice(0, Math.min(candidates.length, variety + Math.floor(this.mode.pressure / 2)));
        }

        setup(checkpoint) {
            this.addBiomes();
            for (const npc of data.contacts) this.addNPC(npc);
            this.pack.setup();
            if (!checkpoint && this.has('fullBags')) this.pack.level = 2;
            if (!checkpoint && this.has('loaded')) this.pack.receive({ scrap: 4, cloth: 2, rations: 2, freshWater: 2, torch: 1 });
            this.objectives.setup(checkpoint?.objectives);
            this.activities?.setup();
            this.deep?.setup();
            this.mark('runs', 1, 0);
            if (checkpoint) this.restore(checkpoint);
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

        addBiomes() {
            const m = this.mode;
            for (const area of data.areas) {
                if (area.id === 'trench') continue;
                const [left, right, north, south] = area.bounds || [area.x - 11, area.x + 11, area.z - 8, area.z + 8];
                const w = right - left;
                const d = south - north;
                const tile = m.mesh(new THREE.PlaneGeometry(w, d), area.color, (left + right) / 2, 0.030, (north + south) / 2,
                    { transparent: true, opacity: 0.20, depthWrite: false });
                tile.rotation.x = -Math.PI / 2;
                if (area.bounds) {
                    const material = area.id === 'frost' ? 0x7a929d : 0x834b3c;
                    const fence = (x, z, w, d) => {
                        const mesh = m.mesh(new THREE.BoxGeometry(w, 2.85, d), material, x, 1.42, z);
                        m.solid(mesh, w, 2.85, d);
                    };
                    // Enclosures have one full-height access gate, so the level lock applies from either direction.
                    fence((left + right) / 2, north, w, 0.42);
                    fence((left + right) / 2, south, w, 0.42);
                    const gateX = area.id === 'frost' ? right : left;
                    const entry = area.entrance[1];
                    fence(area.id === 'frost' ? left : right, (north + south) / 2, 0.42, d);
                    fence(gateX, (north + entry - 2.1) / 2, 0.45, entry - north - 2.1);
                    fence(gateX, (entry + 2.1 + south) / 2, 0.45, south - entry - 2.1);
                    const gate = m.mesh(new THREE.BoxGeometry(0.55, 2.8, 4.2), 0xb5aa78, gateX, 1.4, entry);
                    this.gates.set(area.id, { mesh: gate, collider: m.solid(gate, 0.55, 2.8, 4.2) });
                    m.marker({ id: 'gate:' + area.id, x: gateX, y: 0, z: entry, name: area.name, label: 'Open ' + area.name, color: area.color });
                }
                for (let i = 0; i < 5; i++) {
                    const x = left + 2.2 + i * ((w - 4.4) / 5);
                    const z = north + 2.1 + (i * 3.7) % (d - 4.2);
                    const rock = m.mesh(new THREE.DodecahedronGeometry(0.64 + i % 2 * 0.38), area.color, x, 0.42, z);
                    rock.scale.set(1.6, 0.65, 1.1);
                }
            }
            // A launch platform gives players a predictable glider test site at any level.
            const deck = m.mesh(new THREE.BoxGeometry(4.5, 0.3, 4.5), 0x596b66, 1, 4.2, 37.5);
            m.solid(deck, 4.5, 0.3, 4.5);
            for (const x of [-0.9, 2.9]) {
                const post = m.mesh(new THREE.BoxGeometry(0.22, 4, 0.22), 0x58655d, x, 2, 37.5);
                m.solid(post, 0.22, 4, 0.22);
            }
            m.marker({ id: 'launch', x: 1, y: 0, z: 35.8, label: 'Climb to the glider launch deck', color: 0xbacbbb });
            m.marker({ id: 'launch-down', x: 1, y: 4.35, z: 37.5, label: 'Climb down', color: 0xbacbbb });
        }

        addNPC(npc) {
            const m = this.mode;
            const ground = BO.World.getGroundHeight(npc.x, npc.z, npc.y + 0.25);
            const marker = { ...npc, y: npc.y < 0 ? ground : npc.y };
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
            let area = pos.y < -1.7 ? data.areas.find((zone) => zone.id === (pos.x < -4.6 && pos.z < -43 ? 'cavern' : 'trench')) : null;
            if (!area && pos.y > 2.6 && pos.x < -37 && pos.z > 28) area = data.areas.find((zone) => zone.id === 'ridge');
            if (!area) {
                area = data.areas.find((zone) => zone.bounds &&
                    pos.x >= zone.bounds[0] && pos.x <= zone.bounds[1] && pos.z >= zone.bounds[2] && pos.z <= zone.bounds[3]);
            }
            if (!area) area = data.areas.filter((zone) => !zone.bounds && zone.y === 0)
                .reduce((best, zone) => Math.hypot(pos.x - zone.x, pos.z - zone.z) < Math.hypot(pos.x - best.x, pos.z - best.z) ? zone : best);
            if (area.id === this.area?.id) return;
            this.area = area;
            this.selectedEnemies = this.getPool(area.id);
            if (!this.visited.has(area.id)) {
                this.visited.add(area.id);
                this.mark('visited', 1, 23);
                this.mode.toast('Discovered ' + area.name + ' · +23 XP');
            }
        }

        update(dt) {
            this.updateLocation();
            this.pack.update();
            this.activities?.update(dt);
            this.deep?.update(dt);
            const m = this.mode;
            if (this.options.autosave && m.clock >= this.nextSave && this.canSave()) {
                this.nextSave = m.clock + 45;
                this.save(true);
            }
            this.objectives.update();
            if (this.options.pool === 'patrols' && m.hostilesReleased && !this.has('noPatrols') && m.clock >= this.nextPatrol) {
                this.nextPatrol = m.clock + 38;
                if (m.bots.filter((unit) => unit.alive && unit.team === 1).length < 8 && BO.Player.pos.y > -1) {
                    const pos = BO.Player.pos;
                    const x = pos.x > 0 ? -27 : 25;
                    m.spawnBot(x, 0, -15, 'mp5', 105);
                }
            }
            const p = BO.Player;
            for (const contact of this.npcs) {
                const visible = near(p.pos, contact.npc, 38);
                contact.avatar.root.visible = visible;
                contact.badge.visible = visible;
            }
            if (this.vehicle === 'rover' || this.vehicle === 'bike') {
                if (Math.hypot(p.vel.x, p.vel.z) > 4) m.noise = Math.max(m.noise, this.vehicle === 'rover' ? 5 : 1.8);
            }
            if (this.vehicle === 'glider' && !p.onGround && p.vel.y < 0) {
                p.vel.y = Math.max(-2.4, p.vel.y);
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
            if (prefix === 'gate') {
                const area = data.areas.find((zone) => zone.id === id);
                if (career.level < area.level) this.mode.toast(area.name + ' unlocks at level ' + area.level + '.');
                else this.openGate(id);
                return true;
            }
            if (prefix === 'build') {
                const piece = this.placed.find((entry) => entry.id === id && entry.alive);
                if (!piece) return true;
                if (piece.type === 'chest') BO.SurvivalUI.show('chest', null, piece.id);
                else if (['bench', 'campfire', 'kiln'].includes(piece.type)) BO.SurvivalUI.show('workshop');
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
            if (marker.id === 'launch' || marker.id === 'launch-down') {
                BO.Player.pos.set(1, marker.id === 'launch' ? 4.36 : 0, marker.id === 'launch' ? 37.5 : 35.6);
                BO.Player.vel.set(0, 0, 0);
                return true;
            }
            return false;
        }

        openGate(id, quiet = false) {
            const gate = this.gates.get(id);
            if (!gate?.collider.active) return;
            this.mode.removeSolid(gate.mesh, gate.collider);
            gate.mesh.visible = false;
            this.mode.completed.add('gate:' + id);
            const marker = this.mode.markers.find((entry) => entry.id === 'gate:' + id);
            marker.light.visible = false;
            if (!quiet) {
                this.mark('areasUnlocked', 1, 80);
                this.mode.toast('Unlocked ' + marker.name + '.');
            }
        }

        get station() {
            const id = this.mode.near?.id || '';
            if (id === 'shelter') return 'bench';
            return id.startsWith('build:') ? this.placed.find((entry) => entry.alive && id === 'build:' + entry.id)?.type : null;
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
            if (!target || !spec || !this.canBuild) return this.mode.toast('Stand on stable ground to build.');
            if (spec.tech && this.deep && !this.deep.hasTech(spec.tech)) {
                const techNode = BO.SurvivalDeepData?.techTree.find((t) => t.id === spec.tech);
                return m.toast(`Research “${techNode?.name || spec.tech}” in Tech Tree [K] first.`);
            }
            const { x, y, z, size } = target;
            if (this.placed.length >= 80) return m.toast('Structure limit reached for this expedition.');
            if (y < -1 || Math.abs(x) > 51 || z < -50 || z > 40 ||
                data.areas.some((zone) => zone.bounds && x >= zone.bounds[0] && x <= zone.bounds[1] && z >= zone.bounds[2] && z <= zone.bounds[3])) {
                return m.toast('Build on the open surface outside restricted biomes.');
            }
            if (type === 'roof' && !this.placed.some((part) => part.alive && ['wall', 'stoneWall'].includes(part.type) && near(part, target, 3.1))) {
                return m.toast('A roof needs a nearby wall.');
            }
            const bottom = y + (type === 'roof' ? 2.72 : 0);
            if (BO.World.colliders.some((c) => c.active && c.maxY > bottom + 0.07 && c.minY < bottom + size[1] - 0.04 &&
                c.maxX > x - size[0] / 2 + 0.07 && c.minX < x + size[0] / 2 - 0.07 &&
                c.maxZ > z - size[2] / 2 + 0.07 && c.minZ < z + size[2] / 2 - 0.07)) {
                return m.toast('The placement area is blocked.');
            }
            const point = { x, y, z };
            const protectedSite = m.markers.some((site) => site.alive !== false && !site.id.startsWith('build:') && near(site, point, 1.2));
            if (protectedSite) return m.toast('Keep access to contacts and mission sites clear.');
            const cost = typeof spec.cost === 'number' ? { scrap: spec.cost } : spec.cost;
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
                if (['wall', 'floor', 'roof', 'stoneWall', 'stoneFloor', 'door', 'platform'].includes(piece.type)) {
                    const stone = piece.type.startsWith('stone') || piece.type === 'door';
                    const part = m.addStructure(mesh, w, h, d, stone ? 'brick' : 'wood');
                    if (stone) part.hp = piece.type === 'door' ? 320 : 265;
                    part.buildPiece = piece;
                    if (Number.isFinite(piece.hp)) part.hp = piece.hp;
                    piece.part = part;
                }
            }
            if (piece.type === 'wallTorch') this.pack.addLight(piece.id, piece);
            if (piece.type === 'chest' && !this.pack.chests.has(piece.id)) this.pack.chests.set(piece.id, {});
            if (['bed', 'bench', 'ladder', 'campfire', 'chest', 'kiln'].includes(piece.type)) {
                m.markers.push({ ...piece, id: 'build:' + piece.id, name: spec.name,
                    label: { bed: 'Rest and save', bench: 'Use crafting table', ladder: 'Climb ladder', campfire: 'Cook at campfire', chest: 'Open storage chest', kiln: 'Use stone kiln' }[piece.type] });
                if (piece.type === 'ladder') m.markers.push({ ...piece, y: piece.y + 2.86, id: 'build:' + piece.id, name: spec.name, label: 'Climb down' });
            }
            this.deep?.registerBuild(piece);
            this.placed.push(piece);
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
            this.mode.toast('Slept until morning. Vitals, Flask, and Rested Comfort refreshed!');
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
                m.toast('Boss challenges open after the safe minute.');
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
            let mult = 1;
            if (deep) {
                if (deep.hasInfusion('swiftness')) mult *= 1.14;
                if (deep.activeTonics.aetherStim > this.mode.clock) mult *= 1.30;
                if (deep.activeTonics.staminElixir > this.mode.clock) mult *= 1.22;
                if (this.mode.hunger >= 75 && deep.hydration >= 75) mult *= 1.08;
            }
            if (!vehicle) {
                if (this.mode.flooded && p.pos.x > 24 && p.pos.z < -1 && p.pos.z > -29 && p.pos.y < 0.6) return 0.75 * mult;
                return mult;
            }
            const road = Math.abs(p.pos.x) < 4.1 && p.pos.z > -1;
            return (road ? vehicle.speed : vehicle.offroad) * mult;
        }

        canSave() {
            const p = BO.Player;
            return this.mode.active && p.alive && !this.mode.rider && !this.mode.exfil && !this.has('ironRun') && !this.objectives.unsafeToSave &&
                ![...this.mode.zombies, ...this.mode.bots].some((enemy) => enemy.alive && enemy.team !== 0 && near(enemy.pos, p.pos, 9));
        }

        travel(id) {
            if (this.has('footOnly') || !this.canSave() || !this.visited.has(id) || id === 'trench' || this.area?.id === id) return false;
            const area = data.areas.find((zone) => zone.id === id);
            if (!area || area.y < 0 || this.gates.get(id)?.collider.active || !this.mode.spend({ fuel: 1 })) return false;
            BO.Player.pos.set(area.x, area.y, area.z);
            BO.Player.vel.set(0, 0, 0);
            this.restHours += 1;
            this.vehicle = null;
            this.updateLocation();
            this.mark('fastTravel', 1, 0);
            return true;
        }

        save(quiet = false) {
            if (!this.canSave()) {
                if (!quiet) this.mode.toast('Find a safe position before saving.');
                return false;
            }
            const m = this.mode;
            const p = BO.Player;
            this.metrics.seconds = Math.max(this.metrics.seconds || 0, Math.floor(m.clock));
            career.tick(this.run, 'seconds', this.metrics.seconds, 0);
            const checkpoint = {
                version: 1, run: this.run, at: Date.now(), options: this.options, pack: this.pack.snapshot(),
                objectives: this.objectives.snapshot(), activities: this.activities?.snapshot(), deep: this.deep?.snapshot(),
                hostilesReleased: m.hostilesReleased,
                metrics: this.metrics, claims: this.claims, visited: [...this.visited], vehicles: [...this.vehicles],
                restHours: this.restHours, transport: this.vehicle, clock: m.clock, position: p.pos.toArray(), yaw: p.yaw,
                points: m.points, hp: p.hp, armor: p.armor, plates: p.armorReservePlates, lethal: p.lethalCount,
                tactical: p.tacticalCount, slot: p.activeSlot,
                weapons: p.weapons.map((w) => ({ cfg: w.cfg, mag: w.mag, reserve: w.reserve, coil: !!w.survivalCoil, wear: w.wear || 0, mk: w.survivalMk || 1 })),
                core: m.core, flooded: m.flooded, kills: m.kills, salvaged: m.salvaged, breaches: m.breaches,
                hunger: m.hunger, radiation: m.radiation, composure: m.composure, mealUntil: m.mealUntil, ember: m.ember,
                completed: [...m.completed], structures: this.staticParts.map((part) => part.hp),
                placed: this.placed.map(({ id, x, y, z, type, size, alive, part }) => ({ id, x, y, z, type, size, alive, hp: part?.hp })),
                train: m.train.running ? { pos: m.train.pos.toArray(), next: m.train.next } : null,
                commanderRetreated: m.commanderRetreated, commanderReturnAt: m.commanderReturnAt,
                enemies: m.zombies.filter((z) => z.alive).map((z) => ({
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
            this.vehicles = new Set(save.vehicles);
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
            for (const key of ['core', 'flooded', 'kills', 'salvaged', 'breaches', 'hunger', 'radiation', 'composure', 'mealUntil', 'ember', 'commanderRetreated']) {
                m[key] = save[key];
            }
            m.commanderReturnAt = save.commanderReturnAt ?? Infinity;
            m.points = { ...m.points, ...save.points };
            m.completed = new Set(save.completed);
            m.water.visible = m.flooded;
            p.hp = save.hp;
            p.armor = save.armor;
            p.armorReservePlates = save.plates;
            p.lethalCount = save.lethal;
            p.tacticalCount = save.tactical;
            p.weapons = save.weapons.map((entry) => {
                const w = p._createWeaponInstance(entry.cfg);
                if (entry.coil) m.configureCoil(w);
                if (entry.mk && entry.mk > 1) {
                    w.survivalMk = entry.mk;
                    const mult = entry.mk === 2 ? 1.24 : 1.48;
                    const magM = entry.mk === 2 ? 1.20 : 1.40;
                    w.stats.damage = Math.round(w.stats.damage * mult);
                    w.stats.magSize = Math.ceil(w.stats.magSize * magM);
                }
                w.mag = entry.mag;
                w.reserve = entry.reserve;
                w.wear = entry.wear;
                return w;
            });
            p.activeSlot = save.slot === -1 ? -1 : Math.min(save.slot, p.weapons.length - 1);
            p.rebuildViewmodel();
            for (const id of save.completed) {
                if (id.startsWith('gate:')) this.openGate(id.slice(5), true);
                const marker = m.markers.find((item) => item.id === id);
                if (marker?.light) marker.light.visible = false;
            }
            for (const enemy of [...m.zombies, ...m.bots]) enemy.destroy();
            m.zombies = [];
            m.bots = [];
            m.commander = null;
            save.structures.forEach((hp, index) => {
                const part = this.staticParts[index];
                if (part && hp <= 0) m.damagePart(part, Infinity, 'restore');
                else if (part) part.hp = hp;
            });
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
            if (save.train) {
                m.train.running = true;
                m.train.pos.fromArray(save.train.pos);
                m.train.next = save.train.next;
            }
            m.toast('Expedition restored.');
        }
    }

    BO.SurvivalCampaign = SurvivalCampaign;
})(window.BO);
