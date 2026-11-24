/* ============================================================================
   BLACKOUT OPS — The frontier: climate, regional hazards, PMC garrisons, rail
   - Climate: every region has a base temperature; it drops with altitude, at
     night, in snow and when you are wet. Insulated thermals keep you warm.
   - Local weather: snow and blizzards on Frostline, ash fall at Cinder, rain over
     the wetlands — with falling particles and region-tinted fog.
   - Toxic ash: Cinder's air (and ash rain anywhere) fills your lungs without a
     filter. You cough (loud!) and then take damage.
   - Named guardians in four more regions, each with a unique reward.
   - PMC garrisons hold the industrial sites. They raise the alarm, sirens draw
     the infected, reinforcements arrive, and a cleared site is reoccupied after
     four days. Clearing one drops their supply cache.
   - Freight handcar: a fast, loud ride along the rail line across the north.
============================================================================ */
(function (BO) {
    'use strict';

    const BASE_TEMP = { meadow: 18, town: 18, forest: 15, industrial: 19, wetland: 14, alpine: 7, ash: 31, campus: 17, crater: 24 };
    const FOG_TINT = { meadow: 0x8f9a90, town: 0x919a92, forest: 0x7f9384, industrial: 0x8d9089, wetland: 0x89a39b, alpine: 0xd5dde4, ash: 0x9a7f6a, campus: 0x8e9496, crater: 0x8b7fa0 };
    const REGION_LOOT = {
        frost: [['thermals', 2, 1, 1], ['cloth', 3, 1, 3], ['fuel', 2, 1, 1], ['canned', 2, 1, 2]],
        cinder: [['filter', 4, 1, 2], ['fuel', 4, 1, 3], ['powder', 2, 1, 2], ['primers', 2, 10, 20]],
        kessel: [['ammo556', 3, 8, 20], ['ammo762', 2, 6, 14], ['scrap', 3, 2, 4], ['__weapon', 1, 1, 1]],
        spillway: [['freshWater', 3, 1, 2], ['cord', 2, 1, 3], ['wire', 2, 1, 2], ['battery', 2, 1, 1]],
        pine: [['timber', 3, 2, 4], ['resin', 2, 1, 2], ['cord', 2, 1, 2]],
        campus: [['circuit', 3, 1, 2], ['antibiotic', 2, 1, 1], ['filter', 2, 1, 1]]
    };
    const GUARDIAN_REWARD = {
        colossus: { label: 'Yard Colossus', items: { ammo762: 60, gunkit: 2, scrap: 6 }, weapon: 'm249' },
        plague: { label: 'Spillway Bloat', items: { antibiotic: 3, medkits: 2, filter: 2 } },
        frostBoss: { label: 'Pale Maul', items: { thermals: 1, fuel: 3, canned: 3 } },
        cinderBoss: { label: 'Cinder Regent', items: { filter: 4, powder: 4, primers: 30 } },
        butcher: { label: 'The Butcher', items: { medkits: 1, ammo12: 16 }, weapon: 'spas12_tac' },
        stalker: { label: 'Den Mother', items: { cloth: 6, painkillers: 3 }, weapon: 'm40a3_cod4' }
    };
    const GARRISON_TYPES = { warehouse: 4, office: 3, control: 4, turbine_hall: 3, minehead: 3 };
    const PMC_WEAPONS = { 2: ['mp5', 'r870', 'm1911'], 3: ['m4a1', 'mp5', 'r870', 'ak47'], 4: ['ak47', 'm4a1', 'scarh', 'm249'] };

    // New gear.
    const F = BO.SurvivalFrontierData;
    Object.assign(F.items, { thermals: ['Insulated thermals', 'Equipment', 1.1] });
    F.recipes.push({ id: 'makeThermals', name: 'Insulated thermals', station: 'bench', cost: { cloth: 5, fiber: 3, cord: 2 }, gain: { thermals: 1 }, desc: 'Layered clothing: +12°C against the cold while carried. Too warm in the refinery heat.' });

    class ZoneFrontier {
        constructor() {
            this.active = false;
        }

        get mode() { return BO.SurvivalMode; }
        get campaign() { return BO.SurvivalMode.campaign; }

        start(mode) {
            this.active = true;
            this.wet = 0;
            this.tox = 0;
            this.nextCough = 0;
            this.toxHinted = false;
            this.coldHinted = false;
            this.fogCol = new THREE.Color(FOG_TINT.meadow);
            this.tick = 0;
            this.local = 'Clear';
            this.garrisons = this.buildGarrisons();
            this.buildRail(mode);
            this.buildWeather(mode);
            this.extendGuardians();
        }

        stop() {
            this.active = false;
            this.riding = false;
            for (const g of this.garrisons || []) g.bots = [];
            this.precip?.removeFromParent();
            this.precip = null;
        }

        /* ------------------------------------------------------------ climate */
        biome() {
            const p = BO.Player.pos;
            return BO.Zone.regionAt(p.x, p.z).biome;
        }

        get hasThermals() { return (this.mode.points.thermals || 0) > 0; }

        /** Ambient temperature where you stand (°C), before fires. */
        ambient() {
            const p = BO.Player.pos;
            const c = this.campaign;
            const biome = this.biome();
            let t = BASE_TEMP[biome] ?? 18;
            t -= Math.max(0, p.y - 8) * 0.42;
            if (c.isNight) t -= c.has('freezingNights') ? 19 : 9;
            if (this.local === 'Snow') t -= 3;
            if (this.local === 'Blizzard') t -= 9;
            if (this.local === 'Rain') t -= 2;
            t -= Math.min(10, this.wet * 0.1);
            if (this.hasThermals) t += t < 16 ? 12 : t > 27 ? 3 : 0;
            return t + (c.deep?.modFx?.tempOffset || 0);
        }

        /** Region-flavoured weather derived from the global cycle. */
        localize(global) {
            const biome = this.biome();
            if (biome === 'alpine') return global === 'Rad fog' ? 'Blizzard' : global === 'Clearing' ? 'Clear' : 'Snow';
            if (biome === 'ash') return 'Ash fall';
            if (biome === 'wetland' && (global === 'Ash rain' || global === 'Overcast')) return 'Rain';
            return global;
        }

        fogTint(dt) {
            const target = FOG_TINT[this.biome()] ?? FOG_TINT.meadow;
            this.fogTarget = this.fogTarget || new THREE.Color();
            this.fogTarget.setHex(target);
            this.fogCol.lerp(this.fogTarget, Math.min(1, dt * 0.6));
            return this.fogCol;
        }

        fogExtra() {
            return this.local === 'Blizzard' ? 0.016 : this.local === 'Snow' ? 0.004 : this.local === 'Ash fall' ? 0.006 : this.local === 'Rain' ? 0.003 : 0;
        }

        updateClimate(dt) {
            const m = this.mode;
            const c = this.campaign;
            const p = BO.Player;
            const deep = c.deep;
            const nearFire = c.placed.some((it) => it.alive && ['campfire', 'kiln', 'wallTorch'].includes(it.type) && Math.hypot(it.x - p.pos.x, it.z - p.pos.z) < 5.5) ||
                m.fire.some((f) => f.pos.distanceTo(p.pos) < 4);
            // Wetness
            if (m.swimming) this.wet = 100;
            else if (this.local === 'Rain' && !this.sheltered()) this.wet = Math.min(70, this.wet + dt * 0.8);
            else this.wet = Math.max(0, this.wet - dt * (nearFire ? 6 : 0.7));
            // Toxic air
            const filtered = c.pack.filtered;
            const exposure = this.biome() === 'ash' ? 2.4 : (m.weather === 'Ash rain' && !this.sheltered()) ? 0.5 : 0;
            if (exposure && !filtered && c.options.survivalNeeds !== false) this.tox = Math.min(100, this.tox + dt * exposure);
            else this.tox = Math.max(0, this.tox - dt * (filtered ? 3 : 1.4));
            if (this.tox > 15 && !this.toxHinted) {
                this.toxHinted = true;
                m.toast('The ash burns your throat. Use a filter (respirator) or get out of the smoke.');
            }
            if (this.tox > 40 && m.clock >= this.nextCough) {
                this.nextCough = m.clock + 3 + Math.random() * 4;
                BO.ZoneDirector.noise(p.pos.x, p.pos.z, 32, 'cough');
                p.cameraShake = Math.max(p.cameraShake || 0, 0.05);
                m.noise = Math.max(m.noise, 4);
            }
            if (deep && deep.temp < 4 && !this.coldHinted && !this.hasThermals) {
                this.coldHinted = true;
                m.toast('You are freezing. Light a fire, get out of the wind, or craft insulated thermals at a bench.');
            }
            this.tick -= dt;
            if (this.tick <= 0) {
                this.tick = 1;
                if (this.tox > 70) p.takeDamage(2);
                if (deep && deep.temp < -10 && c.options.survivalNeeds !== false) p.takeDamage(2); // frostbite on top of the base cold damage
            }
        }

        /** Roughly: is there a roof or upper floor over your head? */
        sheltered() {
            const p = BO.Player.pos;
            const cam = BO.App.worldCamera.position;
            const up = new THREE.Vector3(0, 1, 0);
            const hit = BO.World.raycastWorld(new THREE.Vector3(cam.x, cam.y + 0.1, cam.z), up, 12);
            return !!(hit && !hit.terrain) || p.y < BO.World.terrainHeight(p.x, p.z) - 2;
        }

        /* ------------------------------------------------------------ weather particles */
        buildWeather(mode) {
            const N = 2600;
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(N * 3);
            for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 50; pos[i * 3 + 1] = Math.random() * 24; pos[i * 3 + 2] = (Math.random() - 0.5) * 50; }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.85, depthWrite: false, fog: true });
            this.precip = new THREE.Points(geo, mat);
            this.precip.frustumCulled = false;
            this.precip.visible = false;
            mode.scene.add(this.precip);
        }

        updateWeather(dt) {
            const pr = this.precip;
            if (!pr) return;
            const kind = this.local;
            const on = ['Snow', 'Blizzard', 'Ash fall', 'Rain', 'Ash rain'].includes(kind) && !this.sheltered();
            pr.visible = on;
            if (!on) return;
            const cam = BO.App.worldCamera.position;
            const spec = {
                Snow: { col: 0xffffff, size: 0.17, fall: 1.4, drift: 0.6, op: 0.9 }, Blizzard: { col: 0xf2f6fa, size: 0.19, fall: 2.2, drift: 5.5, op: 0.95 },
                'Ash fall': { col: 0x6d5c52, size: 0.09, fall: 0.6, drift: 0.8, op: 0.8 }, 'Ash rain': { col: 0x7a6a60, size: 0.08, fall: 1.2, drift: 0.6, op: 0.7 },
                Rain: { col: 0x9fb8c8, size: 0.05, fall: 14, drift: 0.4, op: 0.6 }
            }[kind];
            pr.material.color.setHex(spec.col);
            pr.material.size = spec.size;
            pr.material.opacity = spec.op;
            const a = pr.geometry.attributes.position.array;
            const t = performance.now() * 0.001;
            for (let i = 0; i < a.length; i += 3) {
                a[i + 1] -= spec.fall * dt * (0.7 + (i % 7) * 0.08);
                a[i] += (spec.drift + Math.sin(t + i) * 0.3) * dt;
                if (a[i + 1] < -2) { a[i + 1] = 22; a[i] = (Math.random() - 0.5) * 50; a[i + 2] = (Math.random() - 0.5) * 50; }
                if (a[i] > 25) a[i] -= 50;
            }
            pr.geometry.attributes.position.needsUpdate = true;
            pr.position.set(cam.x, cam.y - 6, cam.z);
        }

        /* ------------------------------------------------------------ loot & guardians */
        /** Extra regional finds rolled on top of a container's own table. */
        regionBonus(entry) {
            const table = REGION_LOOT[entry.region];
            if (!table || Math.random() > 0.4) return null;
            const total = table.reduce((s, r) => s + r[1], 0);
            let k = Math.random() * total;
            for (const [id, w, lo, hi] of table) {
                k -= w;
                if (k <= 0) return { id, n: lo + Math.floor(Math.random() * (hi - lo + 1)) };
            }
            return null;
        }

        extendGuardians() {
            const G = BO.ZoneBosses.GUARDIANS;
            const add = (g) => { if (!G.some((x) => x.type === g.type)) G.push(g); };
            add({ type: 'colossus', at: 'kessel_crane', minDay: 3 });
            add({ type: 'plague', at: 'dam', minDay: 3 });
            add({ type: 'frostBoss', at: 'frost_mine', minDay: 4 });
            add({ type: 'cinderBoss', at: 'cinder_flare', minDay: 4 });
        }

        onBossKilled(entity) {
            const r = GUARDIAN_REWARD[entity.survivalType];
            if (!r) return;
            const m = this.mode;
            this.campaign.pack.dropBag({ ...r.items }, entity.pos);
            if (r.weapon && BO.WeaponsData.get(r.weapon)) m.loot.dropPickup(r.weapon, 80, entity.pos, BO.WeaponsData.get(r.weapon).name);
            BO.Events.emit('hud:banner', { title: (r.label || entity.bossLabel).toUpperCase() + ' DOWN', sub: 'ITS SPOILS ARE ON THE GROUND · CAMPUS KEYCARD RECOVERED', color: '#d58bff' });
        }

        /* ------------------------------------------------------------ PMC garrisons */
        buildGarrisons() {
            return BO.Zone.pois.filter((p) => GARRISON_TYPES[p.type] && ['kessel', 'cinder', 'spillway', 'frost'].includes(p.region)).map((p, i) => ({
                id: p.region + '_' + p.type + '_' + i, name: p.name, region: p.region, x: p.x, z: p.z, y: p.y,
                size: GARRISON_TYPES[p.type], tier: BO.Zone.regionAt(p.x, p.z).threat, bots: [], left: null, alarm: false, reinforced: false
            }));
        }

        garrisonState(g) {
            const c = this.campaign;
            const cleared = c.metrics['garrison_' + g.id];
            if (cleared && c.day < cleared + 4) return 'cleared';
            return g.bots.some((b) => b.alive) ? 'engaged' : 'held';
        }

        updateGarrisons() {
            const m = this.mode;
            const c = this.campaign;
            if (!m.hostilesReleased || c.has('noPatrols') || c.day < 2) return;
            const p = BO.Player.pos;
            for (const g of this.garrisons) {
                const cleared = c.metrics['garrison_' + g.id];
                if (cleared && c.day < cleared + 4) continue;
                if (cleared && c.day >= cleared + 4 && !g.reoccupied) {
                    g.reoccupied = true; g.left = null;
                    c.metrics['garrison_' + g.id] = 0;
                }
                const d = Math.hypot(g.x - p.x, g.z - p.z);
                if (!g.bots.length && d < 115) this.spawnGarrison(g);
                else if (g.bots.length && d > 185) this.despawnGarrison(g);
                if (!g.bots.length) continue;
                const alive = g.bots.filter((b) => b.alive);
                if (!g.alarm && g.bots.some((b) => b.hp < b.maxHp || b.cachedTarget?.kind === 'player')) this.raiseAlarm(g);
                if (g.alarm && g.reinforceAt && m.clock >= g.reinforceAt) { g.reinforceAt = 0; this.reinforce(g); }
                if (!alive.length) this.clearGarrison(g);
            }
        }

        spawnGarrison(g) {
            const m = this.mode;
            const nav = BO.World.nav;
            const n = g.left ?? (g.size + Math.floor(this.campaign.day / 3));
            const weapons = PMC_WEAPONS[Math.min(4, Math.max(2, g.tier + (this.campaign.day >= 6 ? 1 : 0)))];
            for (let i = 0; i < n; i++) {
                let x = g.x, z = g.z;
                for (let t = 0; t < 8; t++) {
                    const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 9;
                    const j = nav.nearestWalkable(nav.idx(g.x + Math.cos(a) * r, g.z + Math.sin(a) * r), 3);
                    if (j >= 0) { x = nav.cx(j); z = nav.cz(j); break; }
                }
                const bot = m.spawnBot(x, BO.World.getGroundHeight(x, z, (g.y || 0) + 4), z, weapons[i % weapons.length], 95 + this.campaign.day * 6, 1, true);
                if (!bot) continue;
                bot.post = { x: g.x, y: g.y, z: g.z, r: 10 };
                bot.garrison = g.id;
                g.bots.push(bot);
            }
            g.alarm = false;
            g.reinforced = false;
            m.refreshTargets();
        }

        despawnGarrison(g) {
            const m = this.mode;
            g.left = g.bots.filter((b) => b.alive).length;
            for (const b of g.bots) {
                b.alive = false;
                if (b.parts?.root) b.parts.root.visible = false;
                const i = m.bots.indexOf(b);
                if (i >= 0) m.bots.splice(i, 1);
            }
            g.bots = [];
            if (g.left === 0) g.left = null;
        }

        raiseAlarm(g) {
            const m = this.mode;
            g.alarm = true;
            const p = BO.Player.pos;
            for (const b of g.bots) if (b.alive) b.post = { x: p.x, y: p.y, z: p.z, r: 14 };
            BO.ZoneDirector.noise(g.x, g.z, 170, 'siren');
            BO.Sound?.playZombieGroan?.('brute', 0.4);
            m.toast('PMC alarm at ' + g.name + '! Their siren will draw every infected nearby — and reinforcements are coming.');
            if (!g.reinforced) g.reinforceAt = m.clock + 30;
        }

        reinforce(g) {
            const m = this.mode;
            const nav = BO.World.nav;
            g.reinforced = true;
            const a = Math.random() * Math.PI * 2;
            const weapons = PMC_WEAPONS[Math.min(4, g.tier + 1)];
            let made = 0;
            for (let i = 0; i < 6 && made < 3; i++) {
                const j = nav.nearestWalkable(nav.idx(g.x + Math.cos(a) * 70 + i * 2, g.z + Math.sin(a) * 70), 6);
                if (j < 0) continue;
                const x = nav.cx(j), z = nav.cz(j);
                const bot = m.spawnBot(x, nav.y[j], z, weapons[made % weapons.length], 110 + this.campaign.day * 6, 1, true);
                if (!bot) continue;
                bot.post = { x: g.x, y: g.y, z: g.z, r: 20 };
                bot.garrison = g.id;
                g.bots.push(bot);
                made++;
            }
            if (made) BO.Events.emit('hud:banner', { title: 'PMC REINFORCEMENTS', sub: made + ' OPERATORS INBOUND FROM THE ' + BO.ZoneHorde.compassWord(a).toUpperCase(), color: '#f2b45a' });
            m.refreshTargets();
        }

        clearGarrison(g) {
            const m = this.mode;
            const c = this.campaign;
            c.metrics['garrison_' + g.id] = c.day;
            c.mark('garrisons', 1, 160);
            g.bots = [];
            g.left = null;
            g.reoccupied = false;
            const items = { scrap: 4, medkits: 1 };
            const cal = ['ammo9', 'ammo556', 'ammo762', 'ammo12'][Math.floor(Math.random() * 4)];
            items[cal] = 20 + Math.floor(Math.random() * 25);
            if (Math.random() < 0.6) items.gunkit = 1;
            if (Math.random() < 0.5) items.battery = 1;
            const bonus = this.regionBonus({ region: g.region });
            if (bonus && bonus.id !== '__weapon') items[bonus.id] = (items[bonus.id] || 0) + bonus.n;
            c.pack.dropBag(items, { x: g.x, y: BO.World.getGroundHeight(g.x, g.z, (g.y || 0) + 3), z: g.z });
            const w = BO.ZoneLoot.WEAPON_POOLS[Math.min(4, g.tier + 1)];
            if (w) m.loot.dropPickup(w[Math.floor(Math.random() * w.length)], 60 + Math.round(Math.random() * 25), { x: g.x + 1, y: BO.World.getGroundHeight(g.x + 1, g.z, (g.y || 0) + 3), z: g.z }, 'PMC weapon');
            BO.Events.emit('hud:banner', { title: 'GARRISON CLEARED', sub: g.name.toUpperCase() + ' · SUPPLY CACHE DROPPED · THEY WILL BE BACK IN 4 DAYS', color: '#8fe3c8' });
            c.save(true, true);
        }

        /* ------------------------------------------------------------ rail & handcar */
        railPoint(s) {
            const R = this.rail;
            s = BO.Math.clamp(s, 0, R.len);
            let i = 0;
            while (i < R.cum.length - 2 && R.cum[i + 1] < s) i++;
            const [ax, az] = BO.Zone.RAIL[i], [bx, bz] = BO.Zone.RAIL[i + 1];
            const t = (s - R.cum[i]) / (R.cum[i + 1] - R.cum[i]);
            const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
            return { x, z, y: BO.World.terrainHeight(x, z) + 0.32, dir: Math.atan2(bx - ax, bz - az), seg: i };
        }

        buildRail(mode) {
            const pts = BO.Zone.RAIL;
            const cum = [0];
            for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
            this.rail = { cum, len: cum[cum.length - 1] };
            const B = BO.Zone.BOUNDS;
            const step = 1.1;
            const n = Math.floor(this.rail.len / step);
            const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 0.14, 0.26), BO.Textures.getWorldMaterial('wood_crate', 2.4, 0.3), n);
            const rails = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.12, step + 0.02), BO.Textures.getWorldMaterial('rust_steel', 1, 1), n * 2);
            const d = new THREE.Object3D();
            let k = 0;
            for (let i = 0; i < n; i++) {
                const p = this.railPoint(i * step + step / 2);
                if (p.x < B.minX + 2 || p.x > B.maxX - 2) { d.scale.set(0, 0, 0); } else d.scale.set(1, 1, 1);
                d.position.set(p.x, p.y - 0.25, p.z); d.rotation.set(0, p.dir, 0); d.updateMatrix();
                sleepers.setMatrixAt(i, d.matrix);
                for (const side of [-0.72, 0.72]) {
                    d.position.set(p.x + Math.cos(p.dir) * side, p.y - 0.12, p.z - Math.sin(p.dir) * side);
                    d.updateMatrix();
                    rails.setMatrixAt(k++, d.matrix);
                }
            }
            sleepers.receiveShadow = rails.castShadow = true;
            mode.scene.add(sleepers, rails);
            mode.owned.push(sleepers, rails);
            // The handcar starts at the Kessel platform.
            this.carS = this.nearestS(-30, 152);
            const car = new THREE.Group();
            const deck = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 2.3), BO.Textures.getWorldMaterial('wood_plank', 2, 2));
            deck.position.y = 0.32;
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.32, 2.1), BO.Textures.getWorldMaterial('rusted_metal', 2, 1));
            frame.position.y = 0.08;
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.0, 0.16), BO.Textures.getWorldMaterial('rust_steel', 1, 1));
            post.position.y = 0.9;
            this.lever = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 0.07), new THREE.MeshStandardMaterial({ color: 0xb3473a, metalness: 0.4 }));
            this.lever.position.y = 1.42;
            car.add(deck, frame, post, this.lever);
            for (const [wx, wz] of [[-0.72, -0.8], [0.72, -0.8], [-0.72, 0.8], [0.72, 0.8]]) {
                const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0x25272a, metalness: 0.8 }));
                wheel.rotation.z = Math.PI / 2; wheel.position.set(wx, -0.02, wz);
                car.add(wheel);
            }
            car.traverse((o) => { if (o.isMesh) o.castShadow = true; });
            mode.scene.add(car);
            mode.owned.push(car);
            this.car = car;
            this.carV = 0;
            this.riding = false;
            this.carMarker = { id: 'handcar', name: 'Freight handcar', x: 0, y: 0, z: 0, label: 'Ride the handcar', alive: true, reach: 2.6 };
            mode.markers.push(this.carMarker);
            this.placeCar();
        }

        nearestS(x, z) {
            let best = 0, bd = Infinity;
            for (let s = 0; s <= this.rail.len; s += 2) {
                const p = this.railPoint(s);
                const d = Math.hypot(p.x - x, p.z - z);
                if (d < bd) { bd = d; best = s; }
            }
            return best;
        }

        placeCar() {
            const p = this.railPoint(this.carS);
            this.car.position.set(p.x, p.y - 0.3, p.z);
            this.car.rotation.y = p.dir;
            Object.assign(this.carMarker, { x: p.x, y: p.y - 0.2, z: p.z, label: this.riding ? 'Step off the handcar' : 'Ride the handcar (W/S to pump, interact to step off)' });
        }

        toggleRide() {
            const P = BO.Player;
            const m = this.mode;
            if (!this.riding && m.campaign.has('footOnly')) { m.toast('On foot only: the handcar is off limits this expedition.'); return true; }
            if (this.riding) {
                this.riding = false;
                const p = this.railPoint(this.carS);
                const sx = p.x + Math.cos(p.dir) * 1.8, sz = p.z - Math.sin(p.dir) * 1.8;
                P.pos.set(sx, BO.World.getGroundHeight(sx, sz, p.y + 2) + 0.05, sz);
                P.vel.set(0, 0, 0);
                this.carV = 0;
                m.toast('Stepped off the handcar.');
            } else {
                this.riding = true;
                m.campaign.mark('handcarRides', 1, 5);
                m.toast('On the handcar. Hold W / S to pump. It is loud — everything along the line will hear you.');
            }
            this.placeCar();
            return true;
        }

        updateRail(dt) {
            if (!this.car) return;
            const P = BO.Player;
            if (this.riding) {
                if (!P.alive) { this.riding = false; return; }
                const fwd = P.keys.KeyW || P.keys[BO.Settings.getKeybinds().forward];
                const back = P.keys.KeyS || P.keys[BO.Settings.getKeybinds().back];
                // Pumping direction follows where you face along the track.
                const p0 = this.railPoint(this.carS);
                const f = P.getMoveDirectionVectors().forward;
                const along = Math.sign(Math.sin(p0.dir) * f.x + Math.cos(p0.dir) * f.z) || 1;
                const input = (fwd ? 1 : 0) - (back ? 1 : 0);
                this.carV += input * along * 5.5 * dt;
                this.carV *= Math.pow(input ? 0.93 : 0.8, dt); // rolling friction
                this.carV = BO.Math.clamp(this.carV, -13, 13);
                const ns = BO.Math.clamp(this.carS + this.carV * dt, 4, this.rail.len - 4);
                if (ns === 4 || ns === this.rail.len - 4) this.carV = 0;
                this.carS = ns;
                const p = this.railPoint(this.carS);
                P.pos.set(p.x, p.y + 0.12, p.z);
                P.vel.set(0, 0, 0);
                P.onGround = true;
                if (this.lever) this.lever.rotation.x = Math.sin(this.carS * 0.9) * 0.5;
                if (Math.abs(this.carV) > 2 && Math.random() < dt * 1.5) BO.ZoneDirector.noise(p.x, p.z, 45 + Math.abs(this.carV) * 4, 'handcar');
                this.mode.noise = Math.max(this.mode.noise, Math.abs(this.carV) * 0.4);
                this.placeCar();
                // Infected standing on the line get run down.
                if (Math.abs(this.carV) > 6) {
                    for (const z of this.mode.zombies) {
                        if (z.alive && Math.hypot(z.pos.x - p.x, z.pos.z - p.z) < 1.4) {
                            this.mode.hit(z, 60 * Math.abs(this.carV) / 6, 'torso', null, 'melee');
                            this.carV *= 0.6;
                        }
                    }
                }
            }
        }

        /* ------------------------------------------------------------ frame */
        update(dt) {
            if (!this.active || !this.campaign) return;
            this.local = this.localize(this.mode.weather);
            this.updateClimate(dt);
            this.updateWeather(dt);
            this.updateRail(dt);
            this.garrisonClock = (this.garrisonClock || 0) - dt;
            if (this.garrisonClock <= 0) { this.garrisonClock = 1; this.updateGarrisons(); }
        }

        activate(marker) {
            if (marker?.id === 'handcar') return this.toggleRide();
            return false;
        }

        snapshot() { return { wet: this.wet, tox: this.tox, carS: this.carS, garrisons: this.garrisons.map((g) => [g.id, g.left]) }; }

        restore(s) {
            if (!s) return;
            this.wet = s.wet || 0;
            this.tox = s.tox || 0;
            if (Number.isFinite(s.carS)) { this.carS = s.carS; this.placeCar(); }
            for (const [id, left] of s.garrisons || []) { const g = this.garrisons.find((x) => x.id === id); if (g) g.left = left; }
        }
    }

    BO.ZoneFrontier = new ZoneFrontier();
    BO.ZoneFrontier.REGION_LOOT = REGION_LOOT;
})(window.BO);
