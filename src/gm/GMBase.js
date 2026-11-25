/* ============================================================================
   BLACKOUT OPS — Survival 1.0: Safe haven engineering
   · FIELD WORKBENCH anywhere for 3 timber + 2 stone (both bare-hand gatherable).
     Upgrade it in place: Tier 2 Machinist, Tier 3 Fabricator. Higher tiers
     unlock power, defences, concrete and bigger light claims.
   · BASES: every workbench or bed anchors a 30 m base. Storage inside a base
     secures Hot loot. Your home is your highest-tier bench.
   · POWER GRID: generators (fuel from base storage, loud), solar panels
     (daylight × weather), wind turbines, battery banks and pylons that link
     anything within 12 m. Consumers draw every tick; brownouts shed load by
     priority. Build mode overlay shows wires and supply/demand.
   · PERIMETER: auto-turrets (power + base ammo, overheat, no XP from turret
     kills), electric fence, tripwire alarm, searchlight, reinforced concrete.
   · HORDE INTEL: horde composition adapts to your base — Sappers for strong
     walls, Climbers for tall bases, Lightbreakers for lit bases, Shielded
     Brutes for turret nests. The radio warns you the evening before.
   · OUTPOSTS: bedroll + 6-slot stash. Respawn and travel node. Unlit outposts
     can be raided by PMC scavengers at night.
   · TRAVEL NETWORK: fast travel only between your own bases, outposts and
     secured safehouses. Never with Hot loot or while hunted.
============================================================================ */
(function (BO) {
    'use strict';
    const GM = BO.GM;
    const CD = () => BO.SurvivalCampaignData;
    const F = () => BO.SurvivalFrontierData;
    const BASE_R = 30;
    const LINK_R = 12;
    const TIER_NAMES = ['', 'Field workbench', 'Machinist bench', 'Fabricator'];
    const TIER_COST = [null, null, { planks: 4, scrap: 4, ingot: 2 }, { ingot: 6, wire: 4, scrap: 6, lens: 1 }];

    /* power: + produces, − consumes (units). prio: lower sheds first. */
    const POWER = {
        generator: { make: 6, fuelPerHour: 1 / 6, loud: true, name: 'Generator' },
        solarPanel: { make: 3, solar: true, name: 'Solar panel' },
        windTurbine: { make: 4, wind: true, name: 'Wind turbine' },
        batteryBank: { store: 40, name: 'Battery bank' },
        pylon: { link: true, name: 'Pylon' },
        floodlight: { use: 3, prio: 3, name: 'Floodlight' },
        searchlight: { use: 4, prio: 4, name: 'Searchlight' },
        turret: { use: 2, prio: 5, name: 'Auto-turret' },
        eFence: { use: 3, prio: 4, name: 'Electric fence' },
        alarm: { use: 0.5, prio: 6, name: 'Tripwire alarm' },
        purifier: { use: 2, prio: 2, name: 'Water purifier' },
        growLamp: { use: 1, prio: 1, name: 'Grow lamp' },
        smelter: { use: 2, prio: 1, name: 'Auto-smelter' },
        stashUplink: { use: 3, prio: 2, name: 'Stash uplink' }
    };

    const NEW_BUILDS = [
        { id: 'lanternPost', name: 'Lantern post', size: [0.35, 2.2, 0.35], cost: { lantern: 1, ingot: 1, timber: 2 }, color: 0x5b6b62, gmTier: 1, detail: 'Claims ground in a 10 m radius (no roaming spawns). Burns 1 fuel per two in-game days.' },
        { id: 'outpost', name: 'Outpost kit', size: [1.9, 0.45, 1.0], cost: { timber: 4, cloth: 3, fiber: 4 }, color: 0x6b7d58, gmTier: 0, detail: 'Bedroll + 6-slot stash. Respawn point and fast-travel node (max 3). Keep it lit and fenced or PMC scavengers may raid it at night.' },
        { id: 'pylon', name: 'Power pylon', size: [0.3, 3.0, 0.3], cost: { ingot: 1, wire: 2, timber: 2 }, color: 0x7c8a96, gmTier: 2, detail: 'Links every power device within 12 m into one grid.' },
        { id: 'solarPanel', name: 'Solar panel', size: [1.6, 0.9, 1.1], cost: { ingot: 2, lens: 2, wire: 2, quartz: 2 }, color: 0x1e3a5f, gmTier: 2, detail: 'Produces 3 power in full daylight. Clouds, rain and fog cut output; nothing at night or in a blizzard.' },
        { id: 'batteryBank', name: 'Battery bank', size: [0.9, 1.1, 0.6], cost: { battery: 4, ingot: 2, wire: 2 }, color: 0x3f4a3a, gmTier: 2, detail: 'Stores 40 power-hours for the night.' },
        { id: 'windTurbine', name: 'Wind turbine', size: [0.6, 4.2, 0.6], cost: { ingot: 4, wire: 3, planks: 4 }, color: 0xd1d5db, gmTier: 3, gmUnlock: 'thermalRig', detail: 'Produces up to 4 power, more in storms and at altitude. Blueprint from the Frostline Colossus.' },
        { id: 'floodlight', name: 'Floodlight', size: [0.5, 2.6, 0.5], cost: { ingot: 2, wire: 2, lens: 1 }, color: 0xe5e7eb, gmTier: 2, detail: 'Needs 3 power. Claims ground in an 18 m radius while powered.' },
        { id: 'searchlight', name: 'Searchlight', size: [0.7, 2.0, 0.7], cost: { ingot: 3, wire: 2, lens: 2 }, color: 0xfef3c7, gmTier: 3, detail: 'Needs 4 power. Sweeps 30 m: reveals and staggers anything it catches (the Pinebreak Stalker hates it). Claims 14 m.' },
        { id: 'eFence', name: 'Electric fence', size: [2.8, 1.6, 0.18], cost: { ingot: 2, wire: 4, scrap: 2 }, color: 0x9ca3af, gmTier: 3, detail: 'Needs 3 power. Blocks and shocks anything touching it (30 dmg/s). Unpowered it is just a fence.' },
        { id: 'alarm', name: 'Tripwire alarm', size: [0.3, 0.6, 0.3], cost: { scrap: 2, wire: 1, battery: 1 }, color: 0xb91c1c, gmTier: 2, detail: 'Needs 0.5 power. Sounds a siren and pings your map when a hostile crosses within 10 m.' },
        { id: 'purifier', name: 'Water purifier', size: [0.9, 1.3, 0.9], cost: { ingot: 2, wire: 1, cloth: 3, stone: 4 }, color: 0x60a5fa, gmTier: 2, detail: 'Needs 2 power. Makes filtered water every in-game hour; rain doubles it.' },
        { id: 'growLamp', name: 'Grow lamp', size: [0.5, 1.8, 0.5], cost: { ingot: 1, wire: 1, quartz: 1 }, color: 0xc4b5fd, gmTier: 2, detail: 'Needs 1 power. Planters within 6 m grow at night and through bad weather.' },
        { id: 'concreteWall', name: 'Reinforced concrete wall', size: [2.8, 2.6, 0.32], cost: { brick: 6, ingot: 2, stone: 4 }, color: 0x9a9a92, gmTier: 3, detail: '650 HP. Bullets barely scratch it; Sappers still can.' },
        { id: 'stashUplink', name: 'Stash uplink', size: [0.8, 1.5, 0.6], cost: { ingot: 6, wire: 6, lens: 2, battery: 4 }, color: 0x334155, gmTier: 3, detail: 'Needs 3 power. Links this base\'s storage with another base\'s uplink. Hot loot cannot be sent, and it is locked while you are hunted.' }
    ];

    const Base = {
        rate: 4,

        start(mode, saved) {
            this.mode = mode;
            this.tiers = new Map(saved?.tiers || []);
            this.battery = saved?.battery || 0;
            this.fuelBurn = saved?.fuelBurn || 0;
            this.alarmCd = 0;
            this.turretHeat = new Map();
            this.powered = new Set();
            this.gridDirty = true;
            this.raidNight = saved?.raidNight || 0;
            this.hordeWarned = saved?.hordeWarned || 0;
            this.raids = saved?.raids || [];
            this.lastSupply = 0; this.lastDemand = 0;
            this.install();
            this.patch();
            this.wires = null;
            for (const pc of mode.campaign.placed) if (pc.alive) this.decorate(pc);
        },

        stop() {
            this.unpatch();
            this.clearWires();
            this.mode = null;
        },

        snapshot() {
            return { tiers: [...this.tiers], battery: this.battery, fuelBurn: this.fuelBurn, raidNight: this.raidNight, hordeWarned: this.hordeWarned, raids: this.raids.slice(-6) };
        },

        /* ---------------------------------------------------------- data install */
        install() {
            if (this._installed) return;
            this._installed = true;
            const bench = CD().build.find((b) => b.id === 'bench');
            if (bench) {
                bench.cost = { timber: 3, stone: 2 };
                bench.name = 'Field workbench';
                bench.detail = 'Build anywhere from 3 timber and 2 stone. Unlocks bench recipes within 6 m and anchors a 30 m base. Upgrade it to a Machinist (T2) and Fabricator (T3) bench from the Base screen.';
            }
            for (const b of NEW_BUILDS) {
                const existing = CD().build.find((x) => x.id === b.id);
                if (existing) { Object.assign(existing, { gmTier: b.gmTier, detail: b.detail, gmUnlock: b.gmUnlock }); continue; }
                CD().build.push(b);
                if (F().buildings && !F().buildings.some((x) => x.id === b.id)) F().buildings.push(b);
            }
            // Existing machines join the grid at the right tier.
            for (const id of ['turret', 'generator', 'smelter']) {
                const b = CD().build.find((x) => x.id === id);
                if (b) { b.gmTier = Math.max(b.gmTier || 0, id === 'smelter' ? 2 : 3); b.detail = b.detail.split(' Needs ')[0] + (POWER[id]?.use ? ' Needs ' + POWER[id].use + ' power.' : ''); }
            }
            const gen = CD().build.find((x) => x.id === 'generator');
            if (gen) gen.detail = 'Produces 6 power while it has fuel. Burns 1 fuel from base storage every 6 in-game hours, and it is loud.';
            const tur = CD().build.find((x) => x.id === 'turret');
            if (tur) tur.detail = 'Needs 2 power and pulls rifle/pistol ammo from base storage. Overheats after sustained fire. Kills earn no XP or loot.';
            if (BO.SurvivalItemInfo) BO.SurvivalItemInfo.outpost = 'Bedroll and small stash: a forward respawn and travel point.';
        },

        /* ---------------------------------------------------------- patches */
        patch() {
            const m = this.mode;
            const c = m.campaign;
            const self = this;
            this._orig = { stationAvailable: c.stationAvailable, canCraft: c.pack.canCraft, build: c.build, zbPlace: BO.ZoneBuild.place, activate: c.activate };
            c.stationAvailable = function (type) {
                if (type === 'bench') {
                    const p = BO.Player.pos;
                    if (this.placed.some((pc) => pc.alive && pc.type === 'bench' && Math.hypot(pc.x - p.x, pc.y - p.y, pc.z - p.z) <= 6)) return true;
                }
                return self._orig.stationAvailable.call(this, type);
            };
            c.pack.canCraft = function (recipe) {
                if (recipe?.gmTier && self.nearTier() < recipe.gmTier) return false;
                return self._orig.canCraft.call(this, recipe);
            };
            c.build = function (type) {
                const why = self.buildBlock(type);
                if (why) return m.toast(why);
                return self._orig.build.call(this, type);
            };
            BO.ZoneBuild.place = function () {
                const why = this.type && self.buildBlock(this.type);
                if (why) { m.toast(why); return false; }
                return self._orig.zbPlace.call(this);
            };
            Object.defineProperty(c, 'travelPoints', { configurable: true, get: () => self.travelPoints() });
        },

        unpatch() {
            if (!this._orig || !this.mode?.campaign) return;
            const c = this.mode.campaign;
            c.stationAvailable = this._orig.stationAvailable;
            c.pack.canCraft = this._orig.canCraft;
            c.build = this._orig.build;
            BO.ZoneBuild.place = this._orig.zbPlace;
            delete c.travelPoints;
            this._orig = null;
        },

        /* ---------------------------------------------------------- tiers & bases */
        benches() { return this.mode.campaign.placed.filter((p) => p.alive && p.type === 'bench'); },
        tierOf(piece) { return this.tiers.get(piece.id) || 1; },
        benchTier() { return this.benches().reduce((t, b) => Math.max(t, this.tierOf(b)), 0); },
        nearTier() {
            const p = BO.Player.pos;
            let t = 0;
            for (const b of this.benches()) if (Math.hypot(b.x - p.x, b.z - p.z) <= 6) t = Math.max(t, this.tierOf(b));
            if (t === 0 && this.mode.campaign.objectives.safehouseNear?.(p, 8)) t = 1;
            return t;
        },
        homePoint() {
            const b = this.benches().sort((a, b2) => this.tierOf(b2) - this.tierOf(a))[0];
            if (b) return { x: b.x, y: b.y, z: b.z, name: TIER_NAMES[this.tierOf(b)] };
            const bed = this.mode.campaign.placed.find((p) => p.alive && p.type === 'bed');
            return bed ? { x: bed.x, y: bed.y, z: bed.z, name: 'Field bed' } : null;
        },
        anchors() { return this.mode.campaign.placed.filter((p) => p.alive && (p.type === 'bench' || p.type === 'bed')); },
        inBase(x, z) { return this.anchors().some((a) => Math.hypot(a.x - x, a.z - z) <= BASE_R); },

        buildBlock(type) {
            const spec = CD().build.find((b) => b.id === type);
            if (!spec) return null;
            if (spec.gmUnlock && !GM.get('bosses')?.hasReward?.(spec.gmUnlock)) return 'Blueprint needed: defeat the boss that guards it.';
            if (spec.gmTier && spec.gmTier > 1 && this.benchTier() < spec.gmTier) return 'Needs a ' + TIER_NAMES[spec.gmTier] + ' (upgrade a workbench from the Base screen).';
            if (type === 'outpost' && this.outposts().length >= 3) return 'You can run three outposts at most. Dismantle one first.';
            if (type === 'outpost' && this.inBase(BO.Player.pos.x, BO.Player.pos.z)) return 'Outposts go out in the field, away from your bases.';
            return null;
        },

        upgradeBench(id) {
            const m = this.mode;
            const b = this.benches().find((x) => x.id === id);
            if (!b) return false;
            const t = this.tierOf(b);
            if (t >= 3) return GM.toast('This bench is already a Fabricator.'), false;
            const cost = TIER_COST[t + 1];
            if (!m.spend(cost)) return GM.toast('Needs ' + GM.amounts(cost) + '.', '#f59e0b'), false;
            this.tiers.set(b.id, t + 1);
            this.decorate(b);
            GM.sting('power');
            GM.banner(TIER_NAMES[t + 1].toUpperCase(), t + 1 === 2 ? 'POWER, ATTACHMENT SWAPS, PYLONS AND ALARMS UNLOCKED' : 'TURRETS, CONCRETE, FENCES AND UPLINKS UNLOCKED', '#93c5fd');
            m.campaign.mark('benchTier', 1, 60);
            GM.get('threat').claimDirty = true;
            return true;
        },

        isSecureChest(chestId) {
            const c = this.mode.campaign;
            if (String(chestId).startsWith('gmveh:')) return false;
            const piece = c.placed.find((p) => p.id === chestId && p.alive);
            if (!piece) return true; // safehouse stash: secured ground
            if (piece.type === 'outpost') return this.outpostSafe(piece);
            return this.inBase(piece.x, piece.z);
        },

        /* ---------------------------------------------------------- decoration */
        decorate(pc) {
            const m = this.mode;
            if (pc.type === 'bench' && pc.mesh) {
                const t = this.tierOf(pc);
                pc.mesh.material.color.setHex([0, 0xa18257, 0x6b7c8a, 0x3f5d73][t]);
                if (t >= 2 && !pc.gmVise) { pc.gmVise = m.mesh(new THREE.BoxGeometry(0.3, 0.25, 0.22), 0x374151, pc.x + 0.35, pc.y + 0.98, pc.z); }
                if (t >= 3 && !pc.gmLamp) { pc.gmLamp = m.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), 0x9ca3af, pc.x - 0.4, pc.y + 1.15, pc.z, { emissive: 0x93c5fd, emissiveIntensity: 0.6 }); }
            }
        },

        onBuild(piece, spec) {
            const m = this.mode;
            if (!this.mode) return;
            if (piece.type === 'bench') {
                GM.first('bench', 'Workbench', 'Your first base: storage within 30 m now secures Hot loot');
                this.decorate(piece);
            }
            if (piece.type === 'bed') GM.first('bed', 'Bed', 'Respawn here, and sleep off Weakened');
            if (piece.type === 'campfire' || piece.type === 'firepit') GM.first('fire', 'Fire', 'Warmth, cooking, and light that holds ground');
            if (piece.type === 'wall' || piece.type === 'stoneWall') GM.first('wall', 'Wall', 'The base is taking shape');
            if (piece.type === 'concreteWall' || piece.type === 'eFence') {
                if (piece.mesh && !piece.part) {
                    const [w, h, d] = piece.size;
                    const part = m.addStructure(piece.mesh, w, h, d, 'brick');
                    part.hp = part.maxHp = piece.type === 'concreteWall' ? 650 : 220;
                    if (Number.isFinite(piece.hp)) part.hp = piece.hp;
                    part.buildPiece = piece;
                    piece.part = part;
                }
            }
            if (piece.type === 'outpost') {
                if (!m.campaign.pack.chests.has(piece.id)) m.campaign.pack.chests.set(piece.id, {});
                const idx = this.outposts().indexOf(piece) + 1;
                piece.gmName = piece.gmName || 'Outpost ' + ['Alpha', 'Bravo', 'Charlie', 'Delta'][Math.max(0, idx - 1)];
                if (!m.markers.some((k) => k.id === 'build:' + piece.id)) m.markers.push({ id: 'build:' + piece.id, x: piece.x, y: piece.y, z: piece.z, name: piece.gmName, label: 'Outpost stash · rest', alive: true, gmOutpost: piece.id });
                GM.first('outpost', 'Outpost', 'A forward respawn point. Keep it lit at night');
            }
            if (POWER[piece.type]) {
                this.gridDirty = true;
                if (piece.type === 'floodlight' || piece.type === 'searchlight') {
                    const light = new THREE.SpotLight(0xfff1c7, 0, 40, 0.75, 0.5, 1.2);
                    light.position.set(piece.x, piece.y + piece.size[1], piece.z);
                    light.target.position.set(piece.x + 4, piece.y, piece.z + 4);
                    m.scene.add(light, light.target);
                    piece.gmLight = light;
                }
            }
            GM.get('threat')?.onBuild?.();
        },

        onPieceLost(piece) { if (POWER[piece.type]) this.gridDirty = true; if (piece.gmLight) piece.gmLight.intensity = 0; },

        interact(marker) {
            const m = this.mode;
            const id = marker.id || '';
            if (marker.gmOutpost) {
                const pc = m.campaign.placed.find((p) => p.id === marker.gmOutpost && p.alive);
                if (!pc) return true;
                BO.SurvivalUI.show('chest', null, pc.id);
                return true;
            }
            if (id.startsWith('build:')) {
                const pc = m.campaign.placed.find((p) => 'build:' + p.id === id && p.alive);
                if (pc?.type === 'bench' && this.tierOf(pc) < 3 && BO.SurvivalUI) {
                    // Workbench opens crafting as before; the Base tab handles upgrades.
                    return false;
                }
            }
            return false;
        },

        /* ---------------------------------------------------------- outposts */
        outposts() { return this.mode.campaign.placed.filter((p) => p.alive && p.type === 'outpost').map((p) => Object.assign(p, { name: p.gmName || 'Outpost' })); },
        outpostLit(o) { return GM.get('threat')?.claims?.some((c) => Math.hypot(c.x - o.x, c.z - o.z) < 10); },
        outpostFenced(o) { return this.mode.campaign.placed.filter((p) => p.alive && p !== o && /wall|Wall|spikes|wire|eFence|sandbag|door|Gate/.test(p.type) && Math.hypot(p.x - o.x, p.z - o.z) < 8).length >= 2; },
        outpostSafe(o) { return this.outpostLit(o) && this.outpostFenced(o); },

        raidCheck() {
            const m = this.mode;
            const c = m.campaign;
            if (!c.isNight || !m.hostilesReleased || c.nightNumber === this.raidNight) return;
            this.raidNight = c.nightNumber;
            if (c.has('noPatrols') || c.day < 2) return;
            for (const o of this.outposts()) {
                if (this.outpostLit(o) || Math.random() > 0.4) continue;
                const stash = c.pack.chests.get(o.id) || {};
                const ids = Object.keys(stash).filter((k) => stash[k] > 0);
                if (!ids.length) continue;
                const lost = {};
                for (const k of ids) { if (Math.random() < 0.5) { lost[k] = Math.ceil(stash[k] / 2); stash[k] -= lost[k]; if (!stash[k]) delete stash[k]; } }
                if (!Object.keys(lost).length) continue;
                this.raids.push({ at: c.totalHours, name: o.name, x: o.x, z: o.z, lost });
                GM.sting('warning');
                GM.banner('OUTPOST RAIDED', String(o.name).toUpperCase() + ' WAS DARK · PMC SCAVENGERS TOOK ' + GM.amounts(lost).toUpperCase(), '#ef4444');
            }
        },

        /* ---------------------------------------------------------- travel */
        travelPoints() {
            const c = this.mode.campaign;
            const out = [];
            const base = c.objectives.travelPoints ? c.objectives.travelPoints() : [];
            for (const t of base) if (/safehouse/i.test(t.kind || '') || t.secured || /station|haven|camp/i.test(t.name || '')) out.push(t);
            for (const b of this.benches()) out.push({ id: 'gm:bench:' + b.id, name: 'Base · ' + TIER_NAMES[this.tierOf(b)], x: b.x + 1.2, y: b.y, z: b.z, kind: 'Your base' });
            for (const o of this.outposts()) out.push({ id: 'gm:out:' + o.id, name: o.name, x: o.x + 1.2, y: o.y, z: o.z, kind: 'Outpost' });
            return out;
        },

        /* ---------------------------------------------------------- power grid */
        powerPieces() { return this.mode.campaign.placed.filter((p) => p.alive && POWER[p.type]); },

        solveGrid() {
            const pieces = this.powerPieces();
            const parent = new Map(pieces.map((p) => [p, p]));
            const find = (p) => { while (parent.get(p) !== p) { parent.set(p, parent.get(parent.get(p))); p = parent.get(p); } return p; };
            const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
            this.links = [];
            for (let i = 0; i < pieces.length; i++) {
                for (let j = i + 1; j < pieces.length; j++) {
                    const a = pieces[i], b = pieces[j];
                    const d = Math.hypot(a.x - b.x, a.z - b.z);
                    const r = (POWER[a.type].link || POWER[b.type].link) ? LINK_R : 4;
                    if (d <= r) { union(a, b); this.links.push([a, b]); }
                }
            }
            const nets = new Map();
            for (const p of pieces) {
                const root = find(p);
                if (!nets.has(root)) nets.set(root, []);
                nets.get(root).push(p);
            }
            this.nets = [...nets.values()];
            this.gridDirty = false;
            if (this.wires) this.drawWires();
        },

        weatherSolar() { return GM.get('weather')?.solarFactor?.() ?? (this.mode.weather === 'Rad fog' ? 0.4 : this.mode.weather === 'Ash rain' ? 0.5 : 0.9); },
        weatherWind() { return GM.get('weather')?.windFactor?.() ?? 0.6; },

        storageFor(net) {
            const c = this.mode.campaign;
            const any = net[0];
            return c.placed.filter((p) => p.alive && (p.type === 'chest' || /Chest/.test(p.type)) && Math.hypot(p.x - any.x, p.z - any.z) <= BASE_R)
                .map((p) => c.pack.chests.get(p.id)).filter(Boolean);
        },

        takeFromStorage(net, ids, n = 1) {
            for (const st of this.storageFor(net)) {
                for (const id of ids) {
                    if ((st[id] || 0) >= n) { st[id] -= n; if (!st[id]) delete st[id]; return id; }
                }
            }
            return null;
        },

        updateGrid(dt) {
            if (this.gridDirty) this.solveGrid();
            const c = this.mode.campaign;
            const hours = dt / c.options.dayLength * 24;
            const daylight = Math.max(0, 1 - c.darkness * 1.15);
            this.powered.clear();
            let totalSupply = 0, totalDemand = 0, capacity = 0;
            for (const net of this.nets || []) {
                let supply = 0;
                const consumers = [];
                let store = 0;
                for (const p of net) {
                    const s = POWER[p.type];
                    if (s.make) {
                        if (s.solar) supply += s.make * daylight * this.weatherSolar();
                        else if (s.wind) supply += s.make * this.weatherWind();
                        else if (p.type === 'generator') {
                            p.gmFuel = p.gmFuel || 0;
                            if (p.gmFuel <= 0) {
                                const got = this.takeFromStorage(net, ['fuel']);
                                if (got) p.gmFuel = 6;
                            }
                            if (p.gmFuel > 0) {
                                p.gmFuel -= hours;
                                supply += s.make;
                                p.gmRunning = true;
                                if (c.isNight && Math.random() < dt * 0.15) BO.ZoneDirector.noise(p.x, p.z, 32, 'generator');
                            } else p.gmRunning = false;
                        }
                    }
                    if (s.store) store += s.store;
                    if (s.use) consumers.push(p);
                }
                supply *= c.deep?.modFx?.powerMakeMult || 1; // Grid Tech (Survivor Skills)
                capacity += store;
                consumers.sort((a, b) => POWER[b.type].prio - POWER[a.type].prio);
                const demand = consumers.reduce((t, p) => t + POWER[p.type].use, 0);
                totalSupply += supply; totalDemand += demand;
                let budget = supply;
                const deficit = demand - supply;
                if (deficit > 0 && store > 0 && this.battery > 0) {
                    const draw = Math.min(this.battery, deficit * hours);
                    this.battery -= draw;
                    budget += hours > 0 ? draw / hours : 0;
                } else if (deficit < 0 && store > 0) {
                    this.battery = Math.min(capacity, this.battery + (-deficit) * hours);
                }
                for (const p of consumers) {
                    const use = POWER[p.type].use;
                    if (budget + 1e-6 >= use) { budget -= use; this.powered.add(p); }
                }
            }
            this.battery = Math.min(this.battery, capacity);
            this.capacity = capacity;
            const wasBrown = this.brownout;
            this.brownout = totalDemand > totalSupply + 0.01 && (this.battery <= 0.01 || capacity === 0) && totalDemand > 0;
            if (this.brownout && !wasBrown) { GM.sting('brownout'); GM.toast('Brownout: not enough power. Low-priority devices shut down.', '#f59e0b'); }
            if (!this.brownout && wasBrown) GM.sting('power');
            this.lastSupply = totalSupply; this.lastDemand = totalDemand;
            if (totalSupply > 0) GM.first('power', 'Power online', 'Wire it up with pylons; watch the night load');
            for (const p of this.powerPieces()) {
                if (p.gmLight) p.gmLight.intensity = this.powered.has(p) ? (p.type === 'searchlight' ? 3.2 : 2.4) : 0;
            }
        },

        isPowered(piece) { return this.powered.has(piece); },

        /* ---------------------------------------------------------- devices */
        updateDevices(dt) {
            const m = this.mode;
            const c = m.campaign;
            const units = [...m.zombies, ...m.bots].filter((u) => u.alive && u.team !== 0);
            this.alarmCd -= dt;
            for (const p of this.powerPieces()) {
                const on = this.powered.has(p);
                switch (p.type) {
                    case 'turret': this.fireTurret(p, units, dt, on); break;
                    case 'eFence':
                        if (!on) break;
                        for (const u of units) if (Math.hypot(u.pos.x - p.x, u.pos.z - p.z) < 1.7) { m.hit(u, 30 * dt, 'torso', null, 'fire', { team: 0 }); u.slowTimer = Math.max(u.slowTimer || 0, 0.6); if (Math.random() < dt * 4) BO.FX?.spawnParticles?.(u.pos.clone().setY(u.pos.y + 1), 4, 0x93c5fd, 3, 2, 0.2); }
                        break;
                    case 'alarm':
                        if (!on || this.alarmCd > 0) break;
                        if (units.some((u) => Math.hypot(u.pos.x - p.x, u.pos.z - p.z) < 10)) {
                            this.alarmCd = 25;
                            GM.sting('alarm');
                            GM.banner('PERIMETER ALARM', 'HOSTILES AT YOUR BASE', '#ef4444');
                            this.alarmPing = { x: p.x, z: p.z, until: m.clock + 30 };
                        }
                        break;
                    case 'searchlight': {
                        if (!on) break;
                        const t = m.clock * 0.6 + p.x;
                        if (p.gmLight) p.gmLight.target.position.set(p.x + Math.cos(t) * 18, p.y, p.z + Math.sin(t) * 18);
                        for (const u of units) {
                            const dx = u.pos.x - p.x, dz = u.pos.z - p.z;
                            const d = Math.hypot(dx, dz);
                            if (d > 30) continue;
                            const ang = Math.atan2(dz, dx);
                            const diff = Math.abs(((ang - t + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
                            if (diff < 0.35) { u.stunTimer = Math.max(u.stunTimer || 0, 0.8); u.gmRevealed = m.clock + 3; }
                        }
                        break;
                    }
                    case 'purifier': {
                        if (!on) break;
                        p.gmAcc = (p.gmAcc || 0) + dt / c.options.dayLength * 24 * (GM.get('weather')?.raining?.() ? 2 : 1);
                        if (p.gmAcc >= 1) {
                            p.gmAcc -= 1;
                            const st = this.storageFor([p])[0];
                            if (st) st.freshWater = (st.freshWater || 0) + 1;
                        }
                        break;
                    }
                    default: break;
                }
            }
        },

        fireTurret(p, units, dt, on) {
            const m = this.mode;
            let heat = this.turretHeat.get(p) || { heat: 0, cd: 0, over: 0 };
            this.turretHeat.set(p, heat);
            heat.heat = Math.max(0, heat.heat - dt * 2);
            heat.cd -= dt;
            if (!on || !m.hostilesReleased) return;
            if (heat.over > m.clock) return;
            if (heat.cd > 0) return;
            let target = null, bd = 18;
            for (const u of units) {
                const d = Math.hypot(u.pos.x - p.x, u.pos.z - p.z);
                if (d < bd) { bd = d; target = u; }
            }
            if (!target) return;
            const origin = new THREE.Vector3(p.x, p.y + 1.15, p.z);
            const aim = target.pos.clone().add(new THREE.Vector3(0, 0.95, 0));
            if (!BO.World.hasLineOfSight(origin.x, origin.y, origin.z, aim.x, aim.y, aim.z)) return;
            p.gmAmmoAcc = (p.gmAmmoAcc || 0) + 1;
            if (p.gmAmmoAcc >= 3) {
                p.gmAmmoAcc = 0;
                if (!this.takeFromStorage([p], ['ammo556', 'ammo762', 'ammo9'])) {
                    if (!p.gmDryWarned || p.gmDryWarned < m.clock) { p.gmDryWarned = m.clock + 60; GM.toast('A turret is out of ammo. Stock rifle or pistol rounds in base storage.', '#f59e0b'); }
                    heat.cd = 2;
                    return;
                }
            }
            heat.cd = 0.55;
            heat.heat += 1;
            if (heat.heat > 25) { heat.over = m.clock + 6; heat.heat = 0; BO.FX?.spawnParticles?.(origin, 10, 0x9ca3af, 2, 3, 0.6); }
            const dmg = target.gmShield ? 9 : 22;
            BO.FX?.spawnTracer?.(origin, aim, 0x4ade80);
            BO.Sound?.playTurretFire?.();
            m.hit(target, dmg, 'torso', null, 'bullet', { team: 0, turret: true });
        },

        /* ---------------------------------------------------------- horde intel */
        hordeComposition() {
            const c = this.mode.campaign;
            const placed = c.placed.filter((p) => p.alive);
            const walls = placed.filter((p) => /wall|Wall/.test(p.type)).length;
            const upper = placed.filter((p) => (p.y || 0) > 2.2 && /wall|Wall|floor|Floor/.test(p.type)).length;
            const lights = GM.get('threat')?.claims?.length || 0;
            const turrets = placed.filter((p) => p.type === 'turret').length;
            const out = [];
            if (walls >= 6) out.push({ role: 'sapper', name: 'Sappers', why: walls + ' walls', share: Math.min(0.3, walls / 60) });
            if (upper >= 3) out.push({ role: 'climber', name: 'Climbers', why: 'tall base', share: 0.2 });
            if (lights >= 3) out.push({ role: 'lightbreaker', name: 'Lightbreakers', why: lights + ' claim lights', share: 0.2 });
            if (turrets >= 1) out.push({ role: 'shield', name: 'Shielded brutes', why: turrets + ' turret' + (turrets > 1 ? 's' : ''), share: Math.min(0.3, turrets * 0.1) });
            return out;
        },

        onSpawn(zb) {
            if (!zb?.horde) return;
            const comp = this.hordeComposition();
            for (const r of comp) {
                if (Math.random() > r.share) continue;
                if (r.role === 'shield') { zb.gmShield = true; zb.maxHp *= 1; zb.speed *= 0.85; }
                else if (r.role === 'climber') { zb.jumpChance = Math.max(zb.jumpChance || 0, 0.9); zb.gmClimber = true; }
                else zb.gmRole = r.role;
                zb.gmHordeRole = r.role;
                break;
            }
        },

        updateSappers() {
            const m = this.mode;
            for (const z of m.zombies) {
                if (!z.alive || z.gmHordeRole !== 'sapper') continue;
                const part = [...m.structures.values()].find((pt) => pt.hp > 0 && pt.mesh.position.distanceTo(z.pos) < 2.2);
                if (!part) continue;
                z.alive = false; z.hp = 0;
                BO.FX?.spawnExplosion?.(z.pos.clone().setY(z.pos.y + 1), 3, 0xf97316);
                BO.Sound?.playExplosion?.(1);
                for (const pt of m.structures.values()) {
                    const d = pt.mesh.position.distanceTo(z.pos);
                    if (pt.hp > 0 && d < 3.5) m.damagePart(pt, 170 * (1 - d / 4.5), 'explosive');
                }
                const pd = BO.Player.pos.distanceTo(z.pos);
                if (pd < 3.5) BO.Player.takeDamage(30 * (1 - pd / 4), z.pos, true);
            }
            // Climbers vault walls they are stuck against.
            for (const z of m.zombies) {
                if (!z.alive || !z.gmClimber || !z.breach) continue;
                if (Math.random() < 0.02) { z.pos.y += 3; z.vel.y = 2; z.breach = null; }
            }
        },

        hordeWarning() {
            const m = this.mode;
            const c = m.campaign;
            const H = BO.ZoneHorde;
            if (!H || !m.hostilesReleased || H.active) return;
            const f = H.forecast();
            if (!/tonight/i.test(f) || c.hour < 16 || c.isNight || this.hordeWarned === c.day) return;
            this.hordeWarned = c.day;
            const comp = this.hordeComposition();
            BO.Sound?.playRadioChirp?.('in');
            GM.banner('HAVEN RADIO: HORDE TONIGHT', comp.length ? 'EXPECT ' + comp.map((r) => r.name.toUpperCase() + ' (' + r.why + ')').join(' · ') : 'A STANDARD HORDE · FORTIFY YOUR WEAKEST WALL', '#f87171');
        },

        /* ---------------------------------------------------------- wires overlay */
        clearWires() { if (this.wires) { this.wires.removeFromParent(); this.wires.geometry.dispose(); this.wires = null; } },
        drawWires() {
            this.clearWires();
            if (!this.links?.length) return;
            const pts = [];
            for (const [a, b] of this.links) { pts.push(a.x, a.y + 2.2, a.z, b.x, b.y + 2.2, b.z); }
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            this.wires = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.8 }));
            this.mode.scene.add(this.wires);
        },

        /* ---------------------------------------------------------- update */
        update(dt) {
            const m = this.mode;
            this.updateGrid(dt);
            this.updateDevices(dt);
            this.updateSappers();
            this.raidCheck();
            this.hordeWarning();
            const wantWires = !!BO.ZoneBuild?.active;
            if (wantWires && !this.wires) { if (this.gridDirty) this.solveGrid(); this.drawWires(); }
            else if (!wantWires && this.wires) this.clearWires();
        },

        incomingDamageMult() { return 1; },

        hudChips() {
            const out = [];
            if (this.alarmPing && this.alarmPing.until > this.mode.clock) out.push({ text: 'ALARM at base', cls: 'danger' });
            if (this.brownout) out.push({ text: 'Brownout', cls: 'warn' });
            return out;
        },

        mapPins() {
            const out = [];
            for (const o of this.outposts()) out.push({ x: o.x, z: o.z, color: this.outpostSafe(o) ? '#4ade80' : '#f59e0b', label: o.name + (this.outpostSafe(o) ? ' (secure)' : ' (dark — raid risk)'), glyph: '⛺' });
            const home = this.homePoint();
            if (home) out.push({ x: home.x, z: home.z, color: '#93c5fd', label: 'Home · ' + home.name, glyph: '⌂' });
            if (this.alarmPing && this.alarmPing.until > this.mode.clock) out.push({ x: this.alarmPing.x, z: this.alarmPing.z, color: '#ef4444', label: 'Alarm!', glyph: '!' });
            return out;
        },

        /* ---------------------------------------------------------- Base tab */
        baseCards(ui) {
            const esc = GM.esc;
            const m = this.mode;
            const inv = m.points;
            const benches = this.benches();
            const cards = [];
            const benchRows = benches.length ? benches.map((b) => {
                const t = this.tierOf(b);
                const next = TIER_COST[t + 1];
                const afford = next && m.canAfford(next);
                return `<div class="gm-row"><b>${esc(TIER_NAMES[t])}</b><span>${Math.round(GM.dist2(b, BO.Player.pos))} m away</span>
                    ${next ? `<button class="sv-btn sm ${afford ? 'primary' : ''}" data-act="gm" data-arg="base.upgrade:${esc(b.id)}" ${afford ? '' : 'disabled'}>Upgrade to ${esc(TIER_NAMES[t + 1])} · ${esc(GM.amounts(next))}</button>` : '<span class="gm-ok">Max tier</span>'}</div>`;
            }).join('') : '<p class="gm-muted">Build a Field workbench (3 timber, 2 stone) anywhere to found a base.</p>';
            cards.push(ui.section('Workbenches', benchRows, 'Tier ' + this.benchTier() + ' unlocked'));
            const cap = this.capacity || 0;
            const grid = `<div class="gm-kv"><div><dt>Supply</dt><dd>${this.lastSupply.toFixed(1)}</dd></div><div><dt>Demand</dt><dd>${this.lastDemand.toFixed(1)}</dd></div><div><dt>Battery</dt><dd>${cap ? Math.round(this.battery) + ' / ' + cap : '—'}</dd></div></div>
                ${cap ? ui.bar(this.battery / cap, 'power') : ''}
                ${this.brownout ? '<p class="gm-bad">Brownout: low-priority devices are off.</p>' : ''}
                <ul class="gm-list">${this.powerPieces().map((p) => `<li><span>${esc(POWER[p.type].name)}</span><em class="${POWER[p.type].use ? (this.powered.has(p) ? 'gm-ok' : 'gm-bad') : ''}">${POWER[p.type].use ? (this.powered.has(p) ? 'powered' : 'off') : POWER[p.type].make ? (p.type === 'generator' ? (p.gmRunning ? 'running' : 'no fuel') : 'producing') : ''}</em></li>`).join('') || '<li class="gm-muted">No power devices yet. Needs a Machinist bench.</li>'}</ul>
                <p class="gm-muted sm">Pylons link devices within 12 m. Generators burn fuel from base storage. Open Build mode to see wires.</p>`;
            cards.push(ui.section('Power grid', grid));
            const comp = this.hordeComposition();
            const H = BO.ZoneHorde;
            cards.push(ui.section('Horde intel', `<p><b>${esc(H?.forecast?.() || '—')}</b></p>${comp.length ? '<ul class="gm-list">' + comp.map((r) => `<li><span>${esc(r.name)}</span><em>because of your ${esc(r.why)}</em></li>`).join('') + '</ul>' : '<p class="gm-muted">Standard horde: they mass at your weakest wall.</p>'}`));
            const outs = this.outposts();
            cards.push(ui.section('Outposts', outs.length ? '<ul class="gm-list">' + outs.map((o) => `<li><span>${esc(o.name)}</span><em class="${this.outpostSafe(o) ? 'gm-ok' : 'gm-bad'}">${this.outpostLit(o) ? 'lit' : 'dark'} · ${this.outpostFenced(o) ? 'fenced' : 'open'}</em></li>`).join('') + '</ul>' : '<p class="gm-muted">Place an Outpost kit in the field (max 3): respawn and travel point.</p>', outs.length + ' / 3') + (this.raids.length ? ui.section('Raid log', '<ul class="gm-list">' + this.raids.slice(-4).reverse().map((r) => `<li><span>${esc(r.name)}</span><em>lost ${esc(GM.amounts(r.lost))}</em></li>`).join('') + '</ul>') : ''));
            return cards;
        },

        uiAct(cmd, arg) {
            if (cmd === 'upgrade') { this.upgradeBench(arg); return true; }
            return false;
        },

        POWER, TIER_NAMES
    };

    GM.register('base', Base);
})(window.BO);
