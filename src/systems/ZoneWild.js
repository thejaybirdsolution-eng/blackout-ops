/* ============================================================================
   BLACKOUT OPS — The wild Zone
   · Animals: rabbits, pheasants, deer, boar, mountain goats, feral cattle,
     wolf packs and bears roam their biomes. Hunt them for raw meat, hide,
     feathers, bone, fat, wool and antlers. Prey flees from noise and from you;
     boar and cattle fight back; wolves hunt at night; bears guard their ground.
   · Food: raw meat fills a little (and may make you sick); cooked food
     restores three times as much. Cooking-station meals are bigger still.
   · Stations: fire camp, cooking station, tanning rack, smokehouse visuals.
   · Vehicles: models for all twenty, parked vehicles to claim around the Zone,
     build-only vehicles, and a ride key.
   · World weapons: region-themed weapon caches in fixed places.
   · Box of Wonders: the sandbox master box (every item, weapon and vehicle).
============================================================================ */
(function (BO) {
    'use strict';

    const SPECIES = {
        rabbit: { name: 'Rabbit', hp: 18, speed: 5.4, size: 0.34, color: 0xa89076, temper: 'flee', scare: 14, xp: 6, drops: { raw_rabbit: [1, 1], hide: [0, 1] }, biomes: { meadow: 4, forest: 2, town: 1, wetland: 1 } },
        fowl: { name: 'Pheasant', hp: 14, speed: 4.4, size: 0.3, color: 0x8a5a30, temper: 'flee', scare: 12, xp: 5, drops: { raw_fowl: [1, 1], feather: [2, 4], egg: [0, 1] }, biomes: { meadow: 3, forest: 2, wetland: 2, town: 2 } },
        deer: { name: 'Deer', hp: 70, speed: 6.2, size: 1.0, color: 0x9a6a40, temper: 'flee', scare: 24, xp: 14, drops: { raw_venison: [2, 3], hide: [1, 2], antler: [0, 1], bone: [1, 1] }, biomes: { forest: 4, meadow: 3, alpine: 1 } },
        boar: { name: 'Wild boar', hp: 110, speed: 5.0, size: 0.75, color: 0x4a3a30, temper: 'defend', scare: 10, dmg: 14, xp: 20, drops: { raw_pork: [2, 4], hide: [1, 1], fat: [1, 2] }, biomes: { forest: 4, meadow: 1, wetland: 2 } },
        goat: { name: 'Mountain goat', hp: 60, speed: 4.8, size: 0.7, color: 0xd8d2c4, temper: 'flee', scare: 16, xp: 12, drops: { raw_mutton: [2, 3], wool: [2, 3], bone: [1, 1] }, biomes: { alpine: 5, ash: 1 } },
        cow: { name: 'Feral cattle', hp: 140, speed: 3.4, size: 1.15, color: 0x6a4a3a, temper: 'defend', scare: 8, dmg: 12, xp: 16, drops: { raw_beef: [3, 5], hide: [2, 3], fat: [1, 1], bone: [2, 2] }, biomes: { meadow: 3, wetland: 1, town: 0.5 } },
        wolf: { name: 'Grey wolf', hp: 80, speed: 6.6, size: 0.75, color: 0x6c6c70, temper: 'hunt', scare: 0, dmg: 11, xp: 22, pack: [2, 4], night: 2.5, drops: { raw_wolf: [1, 2], hide: [1, 1], bone: [1, 2] }, biomes: { forest: 2, alpine: 3, meadow: 0.5 } },
        bear: { name: 'Brown bear', hp: 320, speed: 5.6, size: 1.5, color: 0x4a3222, temper: 'territorial', scare: 0, dmg: 26, xp: 60, drops: { raw_bear: [4, 6], hide: [3, 4], fat: [2, 3], bone: [3, 3] }, biomes: { forest: 1, alpine: 1.5 } }
    };

    // f food, h health, w water; raw: may cause food poisoning. Cooked = 3× raw.
    const FOOD = {
        raw_venison: { f: 10, h: 2, raw: 1 }, cooked_venison: { f: 30, h: 6 },
        raw_pork: { f: 10, h: 2, raw: 1 }, cooked_pork: { f: 30, h: 6 },
        raw_rabbit: { f: 7, h: 1, raw: 1 }, cooked_rabbit: { f: 21, h: 3 },
        raw_fowl: { f: 7, h: 1, raw: 1 }, cooked_fowl: { f: 21, h: 3 },
        raw_mutton: { f: 9, h: 2, raw: 1 }, cooked_mutton: { f: 27, h: 6 },
        raw_bear: { f: 13, h: 3, raw: 1 }, cooked_bear: { f: 39, h: 9 },
        raw_wolf: { f: 6, h: 1, raw: 1 }, cooked_wolf: { f: 18, h: 3 },
        raw_beef: { f: 12, h: 3, raw: 1 }, cooked_beef: { f: 36, h: 9 },
        raw_fish: { f: 8, h: 2, raw: 1 }, cooked_fish: { f: 24, h: 6 },
        egg: { f: 4, h: 1, raw: 1 }, fried_egg: { f: 12, h: 3 },
        mushroom: { f: 3, h: 1, raw: 1 }, roast_mushroom: { f: 9, h: 3 },
        berries: { f: 5, h: 1, w: 3 }, honey: { f: 8, h: 4 }, jerky: { f: 18, h: 2 },
        hunter_stew: { f: 70, h: 30, w: 35, warm: 1 }, meat_pie: { f: 45, h: 15 }, omelette: { f: 35, h: 20, stam: 1 },
        mushroom_soup: { f: 30, h: 10, w: 30, warm: 1 }, berry_pie: { f: 40, h: 10, comp: 30 }, honey_ham: { f: 55, h: 20, regen: 60 },
        survivor_feast: { f: 100, h: 50, w: 50, regen: 120, comp: 50 }, golden_ration: { f: 20, h: 60, regen: 30 }
    };

    const WORLD_WEAPONS = {
        crash: ['double_barrel', 'm1911', 'machete_jungle'], relay: ['kar98k_irons', 'r870', 'tomahawk_axe'],
        hollow: ['r870', 'glock18_auto', 'mp5', 'm1014_cod4', 'riot_baton', 'python_magnum'], pine: ['kar98k_irons', 'm40a3_cod4', 'model_1887_mw2', 'machete_jungle'],
        kessel: ['mp7_navy', 'ump45', 'aks74u', 'mac10_uzi', 'crowbar_heavy', 'm4a1'], spillway: ['famas_f1', 'galil_ar', 'spas12_tac', 'r700_cod4'],
        frost: ['dragunov_svd', 'intervention', 'mk14', 'sledge_hammer'], cinder: ['rpd', 'm249', 'aa12', 'saiga12_k', 'chainsaw_ripper'],
        campus: ['raygun', 'tesla_wunder', 'cryo_sceptre', 'vector_kriss', 'xm8_storm'], crater: ['raygun_mk2', 'void_singularity', 'solar_lance', 'barrett_50cal', 'reaper_scythe']
    };

    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    /* ================================================================ animals */
    class Animal {
        constructor(id, kind, x, y, z) {
            this.animal = true;
            this.id = id;
            this.kind = kind;
            this.spec = SPECIES[kind];
            this.maxHp = this.spec.hp;
            this.hp = this.maxHp;
            this.alive = true;
            this.team = 2;
            this.pos = new THREE.Vector3(x, y, z);
            this.yaw = Math.random() * Math.PI * 2;
            this.state = 'wander';
            this.goal = null;
            this.timer = 0;
            this.attackCd = 0;
            this.phase = Math.random() * 6;
            this.deathTimer = 0;
            this.build();
        }

        build() {
            const s = this.spec.size;
            const k = this.kind;
            const root = new THREE.Group();
            const mat = (c) => new THREE.MeshStandardMaterial({ color: new THREE.Color(c).convertSRGBToLinear(), roughness: 0.9 });
            const body = this.spec.color;
            const dark = new THREE.Color(body).multiplyScalar(0.6).getHex();
            const box = (w, h, d, c, x, y, z, hit) => {
                const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
                m.position.set(x, y, z);
                m.castShadow = true;
                if (hit) { m.userData.entity = this; m.userData.hitbox = hit; }
                root.add(m);
                return m;
            };
            const bird = k === 'fowl';
            const legH = bird ? 0.22 : k === 'rabbit' ? 0.12 : s * (k === 'deer' ? 0.75 : k === 'cow' ? 0.5 : 0.45);
            const bw = bird ? 0.22 : s * (k === 'cow' ? 0.65 : k === 'bear' ? 0.62 : 0.42), bh = bird ? 0.22 : s * (k === 'rabbit' ? 0.7 : k === 'bear' ? 0.58 : 0.45), bl = bird ? 0.34 : s * (k === 'rabbit' ? 0.9 : 1.1);
            const by = legH + bh / 2;
            this.body = box(bw, bh, bl, body, 0, by, 0, 'torso');
            const hs = bird ? 0.13 : s * (k === 'bear' ? 0.36 : k === 'rabbit' ? 0.45 : 0.3);
            const hy = by + bh * (k === 'deer' ? 0.9 : 0.35), hz = bl / 2 + hs * 0.4;
            this.head = box(hs, hs, hs * 1.3, k === 'goat' ? 0xeee8dc : body, 0, hy, hz, 'head');
            if (k === 'deer') { box(s * 0.16, s * 0.5, s * 0.16, body, 0, by + bh * 0.55, bl / 2 - 0.05); box(0.04, 0.35, 0.04, 0xd8c8a8, 0.1, hy + 0.3, hz - 0.05); box(0.04, 0.35, 0.04, 0xd8c8a8, -0.1, hy + 0.3, hz - 0.05); }
            if (k === 'goat') { box(0.05, 0.22, 0.05, 0x5a5048, 0.07, hy + 0.17, hz - 0.08); box(0.05, 0.22, 0.05, 0x5a5048, -0.07, hy + 0.17, hz - 0.08); }
            if (k === 'boar') { box(0.04, 0.04, 0.16, 0xeee8d0, 0.09, hy - 0.08, hz + 0.18); box(0.04, 0.04, 0.16, 0xeee8d0, -0.09, hy - 0.08, hz + 0.18); }
            if (k === 'cow') { box(0.05, 0.18, 0.05, 0xd8d0b8, 0.15, hy + 0.15, hz); box(0.05, 0.18, 0.05, 0xd8d0b8, -0.15, hy + 0.15, hz); }
            if (k === 'rabbit') { box(0.05, 0.2, 0.04, body, 0.05, hy + 0.17, hz - 0.03); box(0.05, 0.2, 0.04, body, -0.05, hy + 0.17, hz - 0.03); }
            if (bird) { box(0.05, 0.05, 0.08, 0xd8a03a, 0, hy - 0.02, hz + 0.1); box(0.08, 0.12, 0.24, 0x5a3a20, 0, by + 0.06, -bl / 2 - 0.1); }
            if (k === 'wolf') box(0.08, 0.08, s * 0.5, dark, 0, by + 0.05, -bl / 2 - s * 0.2);
            this.legs = [];
            if (!bird) {
                const lw = Math.max(0.05, s * 0.13);
                for (const [lx, lz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
                    const pivot = new THREE.Group();
                    pivot.position.set(lx * (bw / 2 - lw / 2), legH, lz * (bl / 2 - lw));
                    const leg = new THREE.Mesh(new THREE.BoxGeometry(lw, legH, lw), mat(dark));
                    leg.position.y = -legH / 2;
                    pivot.add(leg);
                    root.add(pivot);
                    this.legs.push(pivot);
                }
            } else {
                for (const lx of [0.06, -0.06]) box(0.03, legH, 0.03, 0xd8a03a, lx, legH / 2, 0);
            }
            this.height = by + bh;
            this.radius = Math.max(0.25, bw * 0.7);
            this.root = root;
            this.hitMeshes = [this.body, this.head];
            root.position.copy(this.pos);
            BO.SurvivalMode.scene.add(root);
        }

        getHitboxMeshes() { return this.alive ? this.hitMeshes : []; }

        destroy() {
            this.root.removeFromParent();
            this.root.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
        }
    }

    class ZoneWild {
        constructor() { this.animals = []; }
        get campaign() { return this.mode?.campaign; }

        start(mode, saved) {
            this.stop();
            this.mode = mode;
            this.animals = [];
            this.serial = 0;
            this.spawnClock = 2;
            this.regenUntil = 0;
            this.objects = [];
            this.claimed = new Set(saved?.claimed || []);
            this.weaponsTaken = new Set(saved?.weaponsTaken || []);
            this.boxOpen = false;
            this.placeVehicles();
            this.placeWeapons();
            if (mode.campaign.has('sv_master_box')) this.placeMasterBox();
            this.installOnce();
        }

        stop() {
            for (const a of this.animals) a.destroy();
            this.animals = [];
            for (const o of this.objects || []) o.removeFromParent?.();
            this.objects = [];
            this.closeBox();
            this.mode = null;
        }

        snapshot() { return { claimed: [...this.claimed], weaponsTaken: [...this.weaponsTaken] }; }

        installOnce() {
            if (this._installed) return;
            this._installed = true;
            const C = BO.SurvivalCampaign.prototype;
            const station = C.stationAvailable;
            const ALT = { campfire: ['firepit', 'cookstation', 'smoker'], bench: ['tanrack'] };
            C.stationAvailable = function (type) {
                if (station.call(this, type)) return true;
                return !!ALT[type] && ALT[type].some((t) => station.call(this, t));
            };
            const stations = Object.getOwnPropertyDescriptor(C, 'stations');
            if (stations?.get) Object.defineProperty(C, 'stations', { configurable: true, get() { return ['hand', 'bench', 'campfire', 'kiln', 'cookstation'].filter((t) => this.stationAvailable(t)); } });
            // Build-only vehicles come out of the crafting menu.
            const P = BO.SurvivalPack?.prototype || (BO.SurvivalMode.campaign && Object.getPrototypeOf(BO.SurvivalMode.campaign.pack));
            if (P?.craft) {
                const craft = P.craft;
                P.craft = function (id) {
                    const ok = craft.call(this, id);
                    const rec = ok && this.recipe(id);
                    if (rec?.vehicle) {
                        this.campaign.vehicles.add(rec.vehicle);
                        this.campaign.mark('vehiclesBuilt', 1, 60);
                        BO.Events.emit('hud:banner', { title: 'VEHICLE BUILT', sub: (BO.SurvivalCampaignData.vehicles.find((v) => v.id === rec.vehicle)?.name || '').toUpperCase() + ' · PRESS ' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survRide || 'KeyN') + ' TO RIDE', color: '#8fe3c8' });
                    }
                    if (ok && /^cook_|^batchRoast|^stew|^meatPie|^omelette|^soup|^berryPie|^honeyHam|^feast|^goldenRation|^jerky/.test(id)) this.campaign.mark('meals', 1, 6);
                    return ok;
                };
            }
            // Vehicle models for the new kinds.
            const build = C.buildVehicleModel;
            C.buildVehicleModel = function (id) {
                const spec = BO.SurvivalCampaignData.vehicles.find((v) => v.id === id);
                if (spec?.kind && !['bike', 'horse'].includes(spec.kind) && !(spec.kind === 'car' && id === 'rover')) return BO.ZoneWild.vehicleModel(this.mode, spec);
                return build.call(this, id === 'mule' ? 'mount' : id);
            };
        }

        /* ------------------------------------------------------------ population */
        cap() {
            const c = this.campaign;
            return c.has('sv_no_animals') ? 0 : 11 + (c.isNight ? 2 : 0);
        }

        pickSpecies(x, z) {
            const biome = BO.Zone.regionAt(x, z).biome;
            const night = this.campaign.isNight;
            const opts = Object.entries(SPECIES).map(([k, s]) => [k, (s.biomes[biome] || 0) * (k === 'wolf' && night ? s.night : 1)]).filter(([, w]) => w > 0);
            if (!opts.length) return null;
            const total = opts.reduce((a, [, w]) => a + w, 0);
            let r = Math.random() * total;
            for (const [k, w] of opts) { r -= w; if (r <= 0) return k; }
            return opts[0][0];
        }

        spawnAround() {
            const p = BO.Player.pos;
            const nav = BO.World.nav;
            for (let t = 0; t < 10; t++) {
                const a = Math.random() * Math.PI * 2, d = 55 + Math.random() * 70;
                const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
                const j = nav?.idx(x, z) ?? -1;
                if (j < 0 || !nav.walk[j] || BO.Zone.inReservoir(x, z)) continue;
                if (BO.Zone.regionAt(x, z).threat >= 5) continue;
                const kind = this.pickSpecies(x, z);
                if (!kind) continue;
                const n = SPECIES[kind].pack ? rnd(...SPECIES[kind].pack) : (kind === 'deer' || kind === 'goat' || kind === 'cow' ? rnd(1, 3) : 1);
                for (let i = 0; i < n; i++) {
                    const ax = x + (Math.random() - 0.5) * 6, az = z + (Math.random() - 0.5) * 6;
                    const y = BO.World.getGroundHeight(ax, az, BO.World.terrainHeight(ax, az) + 2);
                    this.animals.push(new Animal(++this.serial, kind, ax, y, az));
                }
                this.mode.refreshTargets();
                return;
            }
        }

        /* ------------------------------------------------------------ AI */
        update(dt) {
            const m = this.mode;
            if (!m || !m.active) return;
            const p = BO.Player;
            if (this.regenUntil > m.clock && p.alive && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 2 * dt);
            this.spawnClock -= dt;
            if (this.spawnClock <= 0) {
                this.spawnClock = 4;
                const near = this.animals.filter((a) => a.alive && a.pos.distanceTo(p.pos) < 140).length;
                if (near < this.cap()) this.spawnAround();
            }
            const noises = (BO.ZoneDirector.noises || []).filter((n) => m.clock - n.t < 0.6);
            for (let i = this.animals.length - 1; i >= 0; i--) {
                const a = this.animals[i];
                const d = a.pos.distanceTo(p.pos);
                if (!a.alive) {
                    a.deathTimer -= dt;
                    if (a.deathTimer <= 0) { a.destroy(); this.animals.splice(i, 1); }
                    continue;
                }
                if (d > 185) { a.destroy(); this.animals.splice(i, 1); continue; }
                a.root.visible = d < 160;
                if (d > 110 && (m.clock * 10 + a.id) % 3 > 1) continue; // far animals tick less often
                this.think(a, d, dt, noises);
            }
        }

        think(a, d, dt, noises) {
            const m = this.mode;
            const p = BO.Player;
            const s = a.spec;
            a.timer -= dt;
            a.attackCd -= dt;
            const hostileTemper = s.temper === 'hunt' ? (this.campaign.isNight || d < 26) : s.temper === 'territorial' ? d < 15 : false;
            if (a.state !== 'attack' && p.alive && hostileTemper && !this.campaign.has('sv_passive_enemies')) a.state = 'attack';
            if (s.scare && a.state === 'wander') {
                const crouch = p.crouching ? 0.45 : 1;
                if (d < s.scare * crouch) this.flee(a, p.pos);
                else for (const n of noises) if (Math.hypot(n.x - a.pos.x, n.z - a.pos.z) < n.radius * 0.8) { this.flee(a, n); break; }
            }
            let speed = 0, tx = null, tz = null;
            if (a.state === 'attack') {
                if (!p.alive || d > 60) { a.state = 'wander'; }
                else {
                    tx = p.pos.x; tz = p.pos.z; speed = s.speed;
                    if (d < 1.4 + a.radius && a.attackCd <= 0) {
                        a.attackCd = 1.3;
                        p.takeDamage(Math.round((s.dmg || 8) * (m.difficultyRules?.damage || 1)), a.pos, false);
                        BO.ZoneDirector.onPlayerHurt?.();
                        BO.Sound?.playZombieGroan?.(a.kind === 'bear' ? 'roar_heavy' : 'growl_beast', 0.4);
                        if (s.temper === 'defend' && Math.random() < 0.35) this.flee(a, p.pos);
                    }
                }
            } else if (a.state === 'flee') {
                if (a.timer <= 0) a.state = 'wander';
                else { tx = a.goal.x; tz = a.goal.z; speed = s.speed; }
            }
            if (a.state === 'wander') {
                if (!a.goal || a.timer <= 0) {
                    a.timer = 4 + Math.random() * 6;
                    const ang = Math.random() * Math.PI * 2, r = 3 + Math.random() * 10;
                    a.goal = Math.random() < 0.35 ? null : { x: a.pos.x + Math.cos(ang) * r, z: a.pos.z + Math.sin(ang) * r };
                }
                if (a.goal && Math.hypot(a.goal.x - a.pos.x, a.goal.z - a.pos.z) > 0.6) { tx = a.goal.x; tz = a.goal.z; speed = s.speed * 0.25; }
            }
            if (tx !== null && speed > 0) {
                const want = Math.atan2(tx - a.pos.x, tz - a.pos.z);
                let diff = ((want - a.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
                a.yaw += BO.Math.clamp(diff, -6 * dt, 6 * dt);
                const nx = a.pos.x + Math.sin(a.yaw) * speed * dt, nz = a.pos.z + Math.cos(a.yaw) * speed * dt;
                const nav = BO.World.nav;
                const j = nav?.idx(nx, nz) ?? -1;
                const B = BO.Zone.BOUNDS;
                if (j < 0 || !nav.walk[j] || BO.Zone.inReservoir(nx, nz) || nx < B.minX + 4 || nx > B.maxX - 4 || nz < B.minZ + 4 || nz > B.maxZ - 4) {
                    a.yaw += Math.PI * (0.5 + Math.random() * 0.5);
                    if (a.state === 'wander') a.goal = null;
                } else {
                    a.pos.x = nx; a.pos.z = nz;
                    a.pos.y = BO.World.getGroundHeight(nx, nz, a.pos.y + 1.2);
                }
                a.phase += dt * speed * 3;
            }
            const swing = speed > 0 ? Math.sin(a.phase) * Math.min(0.7, speed * 0.12) : 0;
            a.legs.forEach((l, i) => { l.rotation.x = (i % 2 === (i < 2 ? 0 : 1) ? swing : -swing); });
            a.root.position.copy(a.pos);
            a.root.rotation.y = a.yaw;
            if (a.head && speed === 0 && a.state === 'wander') a.head.rotation.x = 0.5 + Math.sin(m.clock + a.id) * 0.2; // grazing
            else if (a.head) a.head.rotation.x = 0;
        }

        flee(a, from) {
            a.state = 'flee';
            a.timer = 5 + Math.random() * 3;
            const ang = Math.atan2(a.pos.x - from.x, a.pos.z - from.z) + (Math.random() - 0.5) * 0.8;
            a.goal = { x: a.pos.x + Math.sin(ang) * 40, z: a.pos.z + Math.cos(ang) * 40 };
        }

        /** Called by SurvivalMode.hit for animals. */
        hitAnimal(a, amount, hitbox, dir, kind, agent) {
            if (!a.alive) return false;
            const m = this.mode;
            if (!agent && BO.ZoneThrill?.active) amount = BO.ZoneThrill.modifyHit(a, amount, hitbox, kind);
            a.hp -= amount;
            BO.FX.spawnParticles(a.pos.clone().setY(a.pos.y + a.height * 0.7), 6, 0x8a1a1a, 2.5, 4, 0.4);
            if (a.hp > 0) {
                const s = a.spec;
                if (s.temper === 'flee') this.flee(a, BO.Player.pos);
                else a.state = 'attack';
                return false;
            }
            a.alive = false;
            a.deathTimer = 25;
            a.root.rotation.z = Math.PI / 2;
            a.root.position.y += a.height * 0.2;
            const drops = {};
            for (const [id, [lo, hi]] of Object.entries(a.spec.drops)) { const n = rnd(lo, hi); if (n > 0) drops[id] = n; }
            const mult = (this.campaign.has('richLoot') ? 1.5 : 1) * (this.campaign.has('sv_double_loot') ? 2 : 1);
            for (const k of Object.keys(drops)) drops[k] = Math.max(1, Math.round(drops[k] * mult));
            if (!agent) {
                this.campaign.pack.dropBag(drops, { x: a.pos.x, y: a.pos.y, z: a.pos.z });
                this.campaign.mark('hunted', 1, 0);
                this.campaign.mark('hunt_' + a.kind, 1, 0);
                BO.ZoneThrill?.xp(a.spec.xp, a.spec.name);
                m.toast(a.spec.name + ' down — collect the drop: ' + BO.SurvivalItemAmounts(drops) + '.');
            }
            m.refreshTargets();
            return true;
        }

        /* ------------------------------------------------------------ eating & using */
        /** undefined = not ours; true/false = handled. */
        consume(id) {
            const m = this.mode;
            if (!m) return undefined;
            const pts = m.points;
            const p = BO.Player;
            const deep = this.campaign.deep;
            const fd = FOOD[id];
            if (fd) {
                if (!(pts[id] > 0)) return false;
                const needs = this.campaign.options.survivalNeeds !== false && !this.campaign.has('sv_no_hunger');
                if (needs && m.hunger >= 99.5 && p.hp >= p.maxHp && !fd.w) { m.toast('You are full.'); return false; }
                pts[id]--;
                const bonus = this.campaign.placed.some((x) => x.alive && x.type === 'smoker' && Math.hypot(x.x - p.pos.x, x.z - p.pos.z) < 8) ? 1.25 : 1;
                m.hunger = Math.min(100, m.hunger + fd.f * bonus);
                p.hp = Math.min(p.maxHp, p.hp + (fd.h || 0) * bonus);
                if (deep && fd.w) deep.hydration = Math.min(100, deep.hydration + fd.w);
                if (deep && fd.warm) { deep.temp = Math.max(deep.temp, 24); deep.comfortUntil = m.clock + 180; }
                if (fd.comp) m.composure = Math.min(100, m.composure + fd.comp);
                if (fd.stam) p.tacStamina = 1;
                if (fd.regen) this.regenUntil = Math.max(this.regenUntil, m.clock) + fd.regen;
                this.campaign.mark('eaten', 1, 0);
                let msg = 'Ate ' + BO.SurvivalItemName(id) + ' (+' + Math.round(fd.f * bonus) + ' food' + (fd.h ? ', +' + Math.round(fd.h * bonus) + ' HP' : '') + ')';
                if (fd.raw && !this.campaign.has('sv_iron_gut') && Math.random() < 0.3) {
                    if (deep) { deep.infection = Math.min(100, (deep.infection || 0) + 10); deep.hydration = Math.max(0, deep.hydration - 12); }
                    msg += '. Ugh — food poisoning. Cook your food next time (3× the value, no sickness)';
                }
                m.toast(msg + '.');
                return true;
            }
            const take = () => { if (!(pts[id] > 0)) return false; pts[id]--; return true; };
            switch (id) {
                case 'leather_armor': case 'hide_armor': {
                    if (p.armor >= p.maxArmor) { m.toast('Your armour is already full.'); return false; }
                    if (!take()) return false;
                    p.armor = Math.min(p.maxArmor || 150, (p.armor || 0) + (id === 'leather_armor' ? 60 : 100));
                    m.toast('Armour on (+' + (id === 'leather_armor' ? 60 : 100) + ').');
                    return true;
                }
                case 'frag_grenade': case 'molotov':
                    if (!take()) return false;
                    p.lethalId = p.lethalId || 'frag';
                    p.lethalCount = (p.lethalCount || 0) + 1;
                    m.toast('+1 ' + (id === 'molotov' ? 'fire grenade' : 'frag grenade') + ' (' + BO.Settings.keyLabel(BO.Settings.getKeybinds().lethal) + ' to throw).');
                    return true;
                case 'candle':
                    if (!take()) return false;
                    this.campaign.pack.lightUntil = Math.max(this.campaign.pack.lightUntil, m.clock) + 240;
                    m.toast('Candle lit for 4 minutes.');
                    return true;
                case 'spyglass': {
                    if (!(pts.spyglass > 0)) return false;
                    let n = 0;
                    for (const s of BO.ZoneInfest?.sites || []) if (!s.seen && Math.hypot(s.x - p.pos.x, s.z - p.pos.z) < 250) { s.seen = true; n++; }
                    m.toast('Through the spyglass: ' + n + ' new site' + (n === 1 ? '' : 's') + ' marked, ' + this.animals.filter((a) => a.alive).length + ' animals nearby.');
                    return true;
                }
                case 'bedroll': {
                    if (!(pts.bedroll > 0)) return false;
                    if (!this.campaign.canSave()) { m.toast('Too dangerous to sleep here.'); return false; }
                    const h = this.campaign.hour;
                    const until = h >= 6 && h < 19 ? 3 : ((30 - h) % 24);
                    this.campaign.restHours += until;
                    m.composure = 100;
                    m.toast('You slept rough for ' + Math.round(until) + ' hours.');
                    return true;
                }
                case 'fireworks':
                    if (!take()) return false;
                    BO.ZoneDirector.noise(p.pos.x, p.pos.z, 200, 'fireworks');
                    BO.ZoneEvents?.trigger?.('airdrop');
                    BO.FX.spawnExplosion(p.pos.clone().setY(p.pos.y + 30), 4, 0xff5ad8);
                    m.toast('Fireworks! A plane is on its way — and so is everything that heard it.');
                    return true;
            }
            return undefined;
        }

        /* ------------------------------------------------------------ station visuals */
        decorate(piece) {
            const m = this.mode;
            if (!m) return;
            const { x, y, z } = piece;
            if (piece.type === 'firepit') {
                for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; m.mesh(new THREE.DodecahedronGeometry(0.2), 0x7a7470, x + Math.cos(a) * 0.7, y + 0.15, z + Math.sin(a) * 0.7); }
                for (let i = 0; i < 3; i++) { const log = m.mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6), 0x5a3a20, x, y + 0.2, z); log.rotation.z = Math.PI / 2; log.rotation.y = i * 1.05; }
                m.mesh(new THREE.ConeGeometry(0.32, 0.8, 6), 0xff7a1a, x, y + 0.55, z, { emissive: 0xff6a00, emissiveIntensity: 1.2, transparent: true, opacity: 0.85 });
                this.campaign.pack.addLight?.(piece.id, { ...piece, y: piece.y + 0.6 });
            } else if (piece.type === 'cookstation') {
                m.mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.28, 10), 0x30302e, x - 0.25, y + 1.08, z, { metalness: 0.7 });
                m.mesh(new THREE.BoxGeometry(0.5, 0.04, 0.5), 0x222222, x + 0.3, y + 0.97, z, { metalness: 0.8 });
                m.mesh(new THREE.BoxGeometry(0.4, 0.2, 0.05), 0xff6a1a, x, y + 0.35, z + 0.41, { emissive: 0xff5a00, emissiveIntensity: 1 });
                m.mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), 0x3a3a3a, x + 0.45, y + 1.5, z - 0.25);
            } else if (piece.type === 'tanrack') {
                m.mesh(new THREE.BoxGeometry(1.1, 0.9, 0.04), 0xb48a5a, x, y + 0.95, z);
            } else if (piece.type === 'smoker') {
                m.mesh(new THREE.ConeGeometry(0.9, 0.7, 4), 0x4a3a30, x, y + 2.25, z).rotation.y = Math.PI / 4;
            }
        }

        /* ------------------------------------------------------------ vehicles */
        vehicleModel(m, spec) {
            const g = new THREE.Group();
            const c = spec.color;
            const box = (w, h, d, col, x, y, z) => { const mesh = m.mesh(new THREE.BoxGeometry(w, h, d), col, x, y, z); g.add(mesh); return mesh; };
            const wheel = (r, w, x, y, z) => { const mesh = m.mesh(new THREE.CylinderGeometry(r, r, w, 12), 0x23282a, x, y, z); mesh.rotation.z = Math.PI / 2; g.add(mesh); return mesh; };
            switch (spec.kind) {
                case 'moto': wheel(0.32, 0.12, 0, 0.32, -0.7); wheel(0.32, 0.12, 0, 0.32, 0.55); box(0.28, 0.3, 1.1, c, 0, 0.62, -0.05); box(0.6, 0.06, 0.06, 0x333333, 0, 0.98, -0.6); break;
                case 'quad': for (const sx of [-1, 1]) for (const z of [-0.6, 0.55]) wheel(0.3, 0.25, sx * 0.5, 0.3, z); box(0.8, 0.35, 1.4, c, 0, 0.62, 0); box(0.7, 0.06, 0.06, 0x333333, 0, 1.0, -0.6); break;
                case 'car': for (const sx of [-1, 1]) for (const z of [-0.95, 0.95]) wheel(0.36, 0.22, sx * 0.85, 0.36, z); box(1.7, 0.6, 3.2, c, 0, 0.75, 0); box(1.5, 0.5, 1.4, new THREE.Color(c).multiplyScalar(0.8).getHex(), 0, 1.3, 0.2); break;
                case 'truck': for (const sx of [-1, 1]) for (const z of [-1.3, 1.2]) wheel(0.42, 0.26, sx * 0.95, 0.42, z); box(1.9, 0.8, 3.9, c, 0, 0.95, 0); box(1.8, 0.7, 1.3, c, 0, 1.7, -0.95); break;
                case 'apc': for (const sx of [-1, 1]) for (const z of [-1.3, 0, 1.3]) wheel(0.45, 0.3, sx * 1.05, 0.45, z); box(2.0, 1.2, 4.2, c, 0, 1.2, 0); box(0.6, 0.35, 0.6, 0x2a2a2a, 0, 2.0, 0.2); box(0.1, 0.1, 1.2, 0x2a2a2a, 0, 2.05, -0.6); break;
                case 'sled': box(0.8, 0.4, 1.8, c, 0, 0.5, 0); box(0.12, 0.06, 2.0, 0x222222, 0.35, 0.12, 0); box(0.12, 0.06, 2.0, 0x222222, -0.35, 0.12, 0); box(0.6, 0.06, 0.06, 0x333333, 0, 0.98, -0.6); break;
                case 'tractor': wheel(0.6, 0.3, 0.7, 0.6, 0.5); wheel(0.6, 0.3, -0.7, 0.6, 0.5); wheel(0.32, 0.2, 0.55, 0.32, -0.9); wheel(0.32, 0.2, -0.55, 0.32, -0.9); box(0.8, 0.6, 1.8, c, 0, 0.9, -0.2); box(0.9, 0.9, 0.8, 0x222222, 0, 1.6, 0.4); break;
                case 'cart': for (const sx of [-1, 1]) for (const z of [-0.7, 0.7]) wheel(0.22, 0.14, sx * 0.55, 0.22, z); box(1.1, 0.3, 1.9, c, 0, 0.45, 0); box(1.1, 0.05, 1.1, c, 0, 1.6, 0.1); for (const sx of [-1, 1]) box(0.05, 1.1, 0.05, 0x888888, sx * 0.5, 1.05, -0.4); break;
                case 'kart': for (const sx of [-1, 1]) for (const z of [-0.6, 0.6]) wheel(0.2, 0.18, sx * 0.55, 0.2, z); box(0.9, 0.18, 1.6, c, 0, 0.28, 0); box(0.5, 0.3, 0.4, 0x333333, 0, 0.5, 0.45); break;
                case 'mono': { const w = wheel(0.95, 0.25, 0, 0.95, 0); w.rotation.z = Math.PI / 2; box(0.3, 0.3, 0.3, c, 0, 0.75, 0); break; }
                case 'board': box(0.5, 0.06, 1.3, c, 0, 0.35, 0).material.emissive = new THREE.Color(c); box(0.35, 0.03, 0.9, 0xffffff, 0, 0.3, 0).material.emissive = new THREE.Color(0x8fe3c8); break;
                case 'sledge': box(0.9, 0.2, 2.0, c, 0, 0.25, 0); box(0.08, 0.6, 0.08, 0x6a4a2a, 0.4, 0.6, -0.9); box(0.08, 0.6, 0.08, 0x6a4a2a, -0.4, 0.6, -0.9); break;
                default: box(0.8, 0.4, 1.4, c, 0, 0.5, 0);
            }
            m.scene.add(g);
            return g;
        }

        /** Parked vehicles waiting to be claimed near their landmark buildings. */
        placeVehicles() {
            const m = this.mode;
            for (const spec of BO.SurvivalCampaignData.vehicles) {
                if (!spec.found || this.claimed.has(spec.id) || m.campaign.vehicles.has(spec.id)) continue;
                const poi = BO.Zone.pois.find((p) => p.type === spec.found);
                if (!poi) continue;
                const x = poi.x + poi.w / 2 + 3.5, z = poi.z - poi.d / 2 - 1;
                const y = BO.World.getGroundHeight(x, z, (poi.y || 0) + 2);
                const model = this.vehicleModelFor(spec);
                model.position.set(x, y, z);
                model.rotation.y = 0.6;
                this.objects.push(model);
                const marker = { id: 'veh:' + spec.id, x, y, z, name: spec.name, label: 'Claim ' + spec.name, alive: true, vehicle: spec.id, model, reach: 3 };
                m.markers.push(marker);
            }
        }

        vehicleModelFor(spec) {
            if (['bike', 'horse'].includes(spec.kind) || spec.id === 'rover') return this.campaign.buildVehicleModel(spec.id === 'mule' ? 'mount' : spec.id);
            return this.vehicleModel(this.mode, spec);
        }

        claim(marker) {
            const c = this.campaign;
            c.vehicles.add(marker.vehicle);
            this.claimed.add(marker.vehicle);
            marker.alive = false;
            marker.model?.removeFromParent();
            c.mark('vehiclesClaimed', 1, 40);
            const spec = BO.SurvivalCampaignData.vehicles.find((v) => v.id === marker.vehicle);
            BO.Events.emit('hud:banner', { title: 'VEHICLE CLAIMED', sub: spec.name.toUpperCase() + ' · PRESS ' + BO.Settings.keyLabel(BO.Settings.getKeybinds().survRide || 'KeyN') + ' TO RIDE · MAP LISTS ALL YOUR VEHICLES', color: '#8fe3c8' });
            c.ride(marker.vehicle);
        }

        /** Ride key: dismount, or mount the fastest vehicle you own. */
        toggleRide() {
            const c = this.campaign;
            if (!c) return false;
            if (c.vehicle) { c.ride(null); this.mode.toast('Dismounted.'); return true; }
            if (c.has('footOnly') || c.has('sv_no_vehicles')) { this.mode.toast('Vehicles are disabled for this expedition.'); return true; }
            const owned = BO.SurvivalCampaignData.vehicles.filter((v) => c.hasVehicle(v.id));
            if (!owned.length) { this.mode.toast('You have no vehicle yet. Claim parked ones (map) or build them at a crafting table.'); return true; }
            const pref = owned.find((v) => v.id === this.lastRide) || owned.sort((a, b) => b.offroad + b.speed - a.offroad - a.speed)[0];
            if (c.ride(pref.id)) { this.lastRide = pref.id; this.mode.toast('Riding the ' + pref.name + '.'); }
            return true;
        }

        /* ------------------------------------------------------------ world weapons */
        placeWeapons() {
            const m = this.mode;
            if (m.campaign.options.resume) return; // restored with the other dropped pickups
            let i = 0;
            for (const poi of BO.Zone.pois) {
                const list = WORLD_WEAPONS[poi.region];
                if (!list || (i++ % 2)) continue;
                const id = list[Math.floor(Math.random() * list.length)];
                if (!BO.WeaponsData.get(id)) continue;
                const tier = Math.max(1, Math.min(4, poi.tier || 1));
                const roll = BO.ZoneThrill?.rollWeapon(id, tier, tier >= 3 ? 2 : 1) || null;
                m.loot.dropPickup(id, 70 + rnd(0, 25), { x: poi.x - poi.w / 2 - 1.5, y: poi.y || 0, z: poi.z + poi.d / 2 + 1 }, BO.WeaponsData.get(id).name, roll);
            }
            // A few showpieces in the wild: towers, the dam, the crater rim.
            for (const mk of m.markers.filter((x) => x.kind === 'tower' || x.kind === 'landmark').slice(0, 8)) {
                const reg = BO.Zone.regionAt(mk.x, mk.z).id;
                const list = WORLD_WEAPONS[reg] || WORLD_WEAPONS.relay;
                const id = list[Math.floor(Math.random() * list.length)];
                if (!BO.WeaponsData.get(id)) continue;
                m.loot.dropPickup(id, 85, { x: mk.x + 2, y: mk.y || 0, z: mk.z + 2 }, BO.WeaponsData.get(id).name, BO.ZoneThrill?.rollWeapon(id, 3, 2) || null);
            }
        }

        /* ------------------------------------------------------------ Box of Wonders */
        placeMasterBox() {
            const m = this.mode;
            const s = BO.Zone.map.playerSpawn;
            const x = s.x + 3, z = s.z + 2;
            const y = BO.World.getGroundHeight(x, z, BO.World.terrainHeight(x, z) + 2);
            const box = m.mesh(new THREE.BoxGeometry(1.4, 0.9, 0.9), 0x5a2a8a, x, y + 0.45, z, { emissive: 0xb46bff, emissiveIntensity: 0.6, metalness: 0.4 });
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.5, 30, 8, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xb46bff).convertSRGBToLinear(), transparent: true, opacity: 0.45, fog: false, depthWrite: false, side: THREE.DoubleSide }));
            beam.position.set(x, y + 15, z);
            m.scene.add(beam);
            this.objects.push(box, beam);
            m.markers.push({ id: 'masterbox', x, y, z, name: 'Box of Wonders', label: 'Open the Box of Wonders', alive: true, masterbox: true, reach: 2.6 });
        }

        activate(marker) {
            if (marker?.vehicle && marker.id.startsWith('veh:')) { this.claim(marker); return true; }
            if (marker?.masterbox) { this.openBox(); return true; }
            return false;
        }

        openBox(tab = 'items') {
            this.boxOpen = { tab, q: '' };
            if (document.pointerLockElement) document.exitPointerLock();
            this.renderBox();
        }

        closeBox() {
            if (!this.boxOpen) return;
            this.boxOpen = false;
            this.boxEl?.remove();
            this.boxEl = null;
            if (BO.State.screen === 'playing') BO.App?._safePointerLock?.();
        }

        renderBox() {
            const st = this.boxOpen;
            if (!st) return;
            if (!this.boxEl) {
                this.boxEl = document.createElement('div');
                this.boxEl.className = 'zt-box';
                document.body.appendChild(this.boxEl);
                this.boxEl.addEventListener('click', (e) => this.boxClick(e));
                this.boxEl.addEventListener('input', (e) => { if (e.target.matches('input')) { st.q = e.target.value.toLowerCase(); this.renderBox(); const i = this.boxEl.querySelector('input'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
            }
            const items = BO.SurvivalFrontierData.items;
            let body = '';
            if (st.tab === 'items') {
                const ids = Object.keys(items).filter((id) => !st.q || items[id][0].toLowerCase().includes(st.q));
                body = ids.map((id) => `<button data-box-item="${id}" title="Take 10 (shift: 100)"><b>${esc(items[id][0])}</b><small>${esc(items[id][1])}</small></button>`).join('');
            } else if (st.tab === 'weapons') {
                const all = [...BO.WeaponsData.listGuns?.() || [], ...BO.WeaponsData.listMelee?.() || [], ...BO.WeaponsData.listMagic?.() || []].map((w) => (typeof w === 'string' ? BO.WeaponsData.get(w) : w)).filter(Boolean);
                body = all.filter((w) => !st.q || w.name.toLowerCase().includes(st.q)).map((w) => `<button data-box-weapon="${w.id}" title="Equip a Legendary copy"><b>${esc(w.name)}</b><small>${esc(w.category || '')}</small></button>`).join('');
            } else if (st.tab === 'vehicles') {
                body = BO.SurvivalCampaignData.vehicles.map((v) => `<button data-box-vehicle="${v.id}"><b>${esc(v.name)}</b><small>${this.campaign.hasVehicle(v.id) ? 'owned · click to ride' : 'click to take'}</small></button>`).join('');
            } else {
                body = ['<button data-box-gear="armor"><b>Full armour</b><small>150 armour + 3 plates</small></button>', '<button data-box-gear="grenades"><b>Grenades</b><small>+5 frags, +5 flashbangs</small></button>',
                    '<button data-box-gear="heal"><b>Full restore</b><small>Health, food, water, radiation, bleeding</small></button>', '<button data-box-gear="ammo"><b>Ammunition</b><small>500 of every calibre</small></button>',
                    '<button data-box-gear="tools"><b>Every tool</b><small>All axes, picks, spades, the drill</small></button>', '<button data-box-gear="pack"><b>Biggest backpack</b><small>Hauler frame</small></button>'].join('');
            }
            this.boxEl.innerHTML = `<div class="zt-box-in"><header><b>BOX OF WONDERS</b><span>Everything, without limit. Click to take.</span><button data-box-close>Close · Esc</button></header>
                <nav>${['items', 'weapons', 'vehicles', 'gear'].map((t) => `<button data-box-tab="${t}" class="${st.tab === t ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}<input placeholder="Search…" value="${esc(st.q)}"></nav>
                <div class="zt-box-grid">${body}</div></div>`;
        }

        boxClick(e) {
            const m = this.mode;
            const t = e.target.closest('button');
            if (!t || !m) return;
            const d = t.dataset;
            const p = BO.Player;
            if (d.boxClose !== undefined) return this.closeBox();
            if (d.boxTab) { this.boxOpen.tab = d.boxTab; return this.renderBox(); }
            if (d.boxItem) { const n = e.shiftKey ? 100 : 10; m.points[d.boxItem] = (m.points[d.boxItem] || 0) + n; this.campaign.hotbar?.reconcile?.(); m.toast('+' + n + ' ' + BO.SurvivalItemName(d.boxItem)); return; }
            if (d.boxWeapon) {
                const slot = p.activeSlot >= 0 ? p.activeSlot : 0;
                const w = m.loot.give(d.boxWeapon, 100, p.weapons[slot] ? slot : -1, BO.ZoneThrill?.rollWeapon(d.boxWeapon, 4, 4) || null);
                if (w) { w.mag = w.stats.magSize; if (!BO.ZoneLoot.caliberOf(w)) w.reserve = w.stats.reserveMax; }
                m.toast('Equipped ' + (w?.stats.name || d.boxWeapon) + '.');
                return;
            }
            if (d.boxVehicle) { this.campaign.vehicles.add(d.boxVehicle); this.closeBox(); this.campaign.ride(d.boxVehicle); return; }
            if (d.boxGear === 'armor') { p.maxArmor = Math.max(p.maxArmor || 150, 150); p.armor = p.maxArmor; p.armorReservePlates = 3; }
            if (d.boxGear === 'grenades') { p.lethalCount = (p.lethalCount || 0) + 5; p.tacticalCount = (p.tacticalCount || 0) + 5; }
            if (d.boxGear === 'heal') { p.hp = p.maxHp; m.hunger = 100; m.radiation = 0; const dp = this.campaign.deep; if (dp) { dp.hydration = 100; dp.bleeding = 0; dp.infection = 0; } m.fracture = false; }
            if (d.boxGear === 'ammo') for (const k of ['ammo9', 'ammo556', 'ammo762', 'ammo12']) m.points[k] = (m.points[k] || 0) + 500;
            if (d.boxGear === 'tools') { const pk = this.campaign.pack; for (const [id, tl] of Object.entries(BO.SurvivalFrontierData.tools)) pk.tools[id] = tl.wear; this.campaign.hotbar?.reconcile?.(); }
            if (d.boxGear === 'pack') this.campaign.pack.level = BO.SurvivalFrontierData.packs.length - 1;
            if (d.boxGear) m.toast('Taken from the Box of Wonders.');
        }

        handleKey(e) {
            if (!this.boxOpen) return false;
            if (e.code === 'Escape') { e.preventDefault(); this.closeBox(); }
            return true;
        }
    }

    BO.ZoneWild = new ZoneWild();
    BO.ZoneWild.SPECIES = SPECIES;
    BO.ZoneWild.FOOD = FOOD;
    BO.ZoneWild.WORLD_WEAPONS = WORLD_WEAPONS;
})(window.BO);
