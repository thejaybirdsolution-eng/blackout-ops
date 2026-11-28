/* ============================================================================
   BLACKOUT OPS — RPG Mode ("Delve & Extract")
   First-person action RPG on the shared FPS engine:
   - Persistent class characters (BO.RPGProfile), run state per delve
   - One procedural arena per floor (BO.RPGArena), next-room choice gates
   - Role-based enemies with camps/aggro, elites with affixes, bosses w/ phases
   - Status/reaction combo engine (primers apply, detonators consume)
   - Unbanked gold & items until extraction; death loses the haul
   Abilities live in src/rpg/RPGAbilities.js, UI in src/ui/RPGUI.js.
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;
    const V3 = () => new THREE.Vector3();
    const AGGRO_RADIUS = 11;
    const AGGRO_RADIUS_CROUCH = 6.5;
    const PACK_RADIUS = 10;
    const CAMERA_LIGHT_UP = new THREE.Vector3(0, 1.0, 0);

    class RPGMode {
        constructor() {
            this.active = false;
            this.state = 'idle'; // idle | transition | fighting | cleared | ended
            this.run = null;
            this.stats = null;
            this.enemies = [];
            this.projectiles = [];
            this.pickups = [];
            this.pools = [];
            this.timers = [];
            this.props = [];
            this.gates = [];
            this.layout = null;
            this.camera = null;
            this.nextId = 1;
            this.elapsed = 0;
            this.ability = this._freshAbilityState();
            this.momentum = { stacks: 0, decay: 0 };
            this.prompt = null;
            this.waves = null;
            this.hazards = [];
            this.boss = null;
            this.bannerText = '';
        }

        get D() { return BO.RPGData; }
        get P() { return BO.Player; }
        get Profile() { return BO.RPGProfile; }

        _freshAbilityState() {
            return { cd: { primer: 0, detonator: 0 }, ult: 0, ultActive: 0, ultId: null, silenced: 0, potionCd: 0, storm: null, dash: null };
        }

        /* ======================================================================
           Lifecycle
        ====================================================================== */

        /**
         * opts: { mode:'rpg', resume:boolean, startFloor:number, camera }
         */
        start(opts) {
            this.camera = opts.camera;
            this.active = true;
            this.enemies = [];
            this.projectiles = [];
            this.pickups = [];
            this.pools = [];
            this.timers = [];
            this.props = [];
            this.gates = [];
            this.elapsed = 0;
            this.ability = this._freshAbilityState();
            this.momentum = { stacks: 0, decay: 0 };
            const profile = this.Profile;
            const p = profile.data;
            // A start without a chosen (or with a removed) class falls back to the first unlocked class
            // instead of crashing in computeStats.
            if (!profile.classId || !profile.cls || !profile.D.CLASSES[profile.classId]) {
                const first = Object.keys(profile.D.CLASSES).find((id) => profile.selectClass(id));
                if (!first) console.warn('[RPGMode] no selectable class');
            }

            if (opts.resume && p.run && p.run.classId === profile.classId) {
                this.run = this._runFromSnapshot(p.run);
            } else {
                const startFloor = Math.max(1, p.checkpoints.includes(opts.startFloor) ? opts.startFloor : 1);
                this.run = {
                    classId: profile.classId,
                    difficulty: p.difficulty,
                    floor: startFloor,
                    startFloor,
                    roomType: startFloor % 5 === 0 ? 'boss' : 'combat',
                    seed: Math.floor(Math.random() * 1e9),
                    boons: new Set(),
                    elixir: p.elixir || null,
                    shrineHpPenalty: 0,
                    gold: 0,
                    scrap: 0,
                    pack: [],
                    xpEarned: 0,
                    kills: 0,
                    reactions: 0,
                    potions: 0,
                    hpFrac: 1,
                    ult: 0,
                    secondWindUsed: false,
                    fieldMedicUsed: false,
                    lastBastionFloor: -1,
                    floorsCleared: 0,
                    elapsed: 0,
                    levelsGained: 0,
                    bossKills: 0,
                    contract: p.contract,
                    contractProgress: 0, curse: false, roomApplied: false, mystery: false,
                    door: 'standard', doorApplied: true
                };
                if (BO.RPGItems) BO.RPGItems.initRun(this.run);
                p.elixir = null;
                p.stats.delves++;
                this.stats = profile.computeStats(this.run);
                this.run.potions = this.stats.potionsMax;
            }
            if (BO.RPGItems) BO.RPGItems.initRun(this.run);
            this.stats = profile.computeStats(this.run);
            this.ability.ult = this.run.ult || 0;
            this._firstFloor = true;
            this._enterFloor();
            BO.Sound.startMusic('rpg');
            return BO.World.scene;
        }

        stop() {
            if (!this.active && this.state === 'idle') return;
            this._clearFloor();
            this.active = false;
            this.state = 'idle';
            this.run = null;
            this.prompt = null;
            if (BO.RPGUI) BO.RPGUI.closeModal(true);
            if (BO.Combat) {
                BO.Combat.onHitEnemy = null;
                BO.Combat.onExplodeAt = null;
                BO.Combat.setTargetPool([]);
            }
            BO.Sound.stopMusic();
        }

        _snapshot() {
            const r = this.run;
            return {
                classId: r.classId, difficulty: r.difficulty, floor: r.floor, startFloor: r.startFloor, roomType: r.roomType, seed: r.seed,
                boons: Array.from(r.boons), elixir: r.elixir, shrineHpPenalty: r.shrineHpPenalty,
                gold: r.gold, scrap: r.scrap, pack: r.pack.slice(), xpEarned: r.xpEarned, kills: r.kills, reactions: r.reactions,
                potions: r.potions, hpFrac: r.hpFrac, ult: r.ult, secondWindUsed: r.secondWindUsed, fieldMedicUsed: r.fieldMedicUsed,
                lastBastionFloor: r.lastBastionFloor, floorsCleared: r.floorsCleared, elapsed: r.elapsed, levelsGained: r.levelsGained, bossKills: r.bossKills,
                contract: r.contract, contractProgress: r.contractProgress, curse: !!r.curse, roomApplied: !!r.roomApplied, mystery: !!r.mystery,
                door: r.door || 'standard', doorApplied: r.doorApplied !== false,
                artifacts: Array.isArray(r.artifacts) ? r.artifacts.slice() : [],
                activeItem: r.activeItem || null,
                activeCharges: r.activeCharges || 0,
                pocket: r.pocket ? Object.assign({}, r.pocket) : null,
                pillMap: r.pillMap ? JSON.parse(JSON.stringify(r.pillMap)) : null,
                keys: Number.isFinite(r.keys) ? r.keys : 1,
                bombs: Number.isFinite(r.bombs) ? r.bombs : 2,
                soulShield: r.soulShield || 0,
                devilDeals: r.devilDeals || 0,
                angelChance: Number.isFinite(r.angelChance) ? r.angelChance : 0.5,
                transformations: Array.isArray(r.transformations) ? r.transformations.slice() : [],
                holyMantleReady: !!r.holyMantleReady,
                livesLeft: r.livesLeft || 0,
                devilHpPenalty: r.devilHpPenalty || 0,
                permPillBuffs: r.permPillBuffs ? Object.assign({}, r.permPillBuffs) : null,
                tookRedHpDamageOnFloor: !!r.tookRedHpDamageOnFloor
            };
        }

        _runFromSnapshot(s) {
            const r = Object.assign({}, s);
            r.boons = new Set(Array.isArray(s.boons) ? s.boons : []);
            r.pack = Array.isArray(s.pack) ? s.pack.slice() : [];
            r.hpFrac = BO.Math.clamp(Number(s.hpFrac) || 1, 0.05, 1);
            r.contract = Object.hasOwn(this.D.CONTRACTS, s.contract) ? s.contract : null;
            const contract = this.D.CONTRACTS[r.contract];
            r.contractProgress = contract ? BO.Math.clamp(Math.floor(Number(s.contractProgress) || 0), 0, contract.goal) : 0;
            r.artifacts = Array.isArray(s.artifacts) ? s.artifacts.slice() : [];
            r.activeItem = s.activeItem || null;
            r.activeCharges = Number.isFinite(s.activeCharges) ? s.activeCharges : 0;
            r.pocket = s.pocket && typeof s.pocket === 'object' ? Object.assign({}, s.pocket) : null;
            r.pillMap = s.pillMap && typeof s.pillMap === 'object' ? JSON.parse(JSON.stringify(s.pillMap)) : null;
            r.keys = Number.isFinite(s.keys) ? s.keys : 1;
            r.bombs = Number.isFinite(s.bombs) ? s.bombs : 2;
            r.soulShield = Number.isFinite(s.soulShield) ? s.soulShield : 0;
            r.devilDeals = Number.isFinite(s.devilDeals) ? s.devilDeals : 0;
            r.angelChance = Number.isFinite(s.angelChance) ? s.angelChance : 0.5;
            r.transformations = Array.isArray(s.transformations) ? s.transformations.slice() : [];
            r.holyMantleReady = !!s.holyMantleReady;
            r.livesLeft = Number.isFinite(s.livesLeft) ? s.livesLeft : 0;
            if (BO.RPGItems) BO.RPGItems.ensureRunState(r);
            return r;
        }

        /* ======================================================================
           Floors
        ====================================================================== */

        _clearFloor() {
            for (const z of this.enemies) z.destroy();
            this.enemies = [];
            const scene = BO.World.scene;
            for (const list of [this.projectiles, this.pickups, this.pools, this.props]) {
                for (const o of list) {
                    if (o.mesh && scene) scene.remove(o.mesh);
                    if (o.group && scene) scene.remove(o.group);
                }
            }
            for (const gate of this.gates) {
                gate.group.removeFromParent();
                gate.mat.map?.dispose();
                gate.group.traverse((obj) => {
                    if (!obj.isMesh) return;
                    if (obj.geometry && !(BO.Assets && BO.Assets.isSharedGeo(obj.geometry))) obj.geometry.dispose();
                    if (obj.material && !(BO.Assets && BO.Assets.hasSharedMatValue(obj.material))) obj.material.dispose();
                });
            }
            if (this.vaultGlbGroup) {
                this.vaultGlbGroup.removeFromParent();
                this.vaultGlbGroup.traverse((obj) => {
                    if (obj.isInstancedMesh && typeof obj.dispose === 'function') obj.dispose();
                    if (obj.geometry && !(BO.Assets && BO.Assets.isSharedGeo(obj.geometry))) obj.geometry.dispose();
                    if (obj.material && !(BO.Assets && BO.Assets.hasSharedMatValue(obj.material))) obj.material.dispose();
                });
                this.vaultGlbGroup = null;
            }
            this.roomEvent?.dispose();
            this.roomEvent = null;
            this.vaultArt?.dispose();
            this.vaultArt = null;
            this.floorResolved = false;
            this._clearHazards();
            this.projectiles = [];
            this.pickups = [];
            this.pools = [];
            this.props = [];
            this.gates = [];
            this.timers = [];
            this.waves = null;
            this.boss = null;
            this.beacon = null;
            this.altar = null;
            this.chest = null;
            this.cache = null;
            this.ability.storm = null;
            this.ability.dash = null;
            if (BO.RPGItems) BO.RPGItems.clearVisuals();
            if (BO.RPGUI) BO.RPGUI.clearWorldUi();
        }

        _enterFloor() {
            const r = this.run;
            const D = this.D;
            this.state = 'transition';
            this._clearFloor();
            if (BO.Combat) BO.Combat.reset(this.camera);

            if (r.roomType === 'mystery') {
                r.mystery = true;
                r.roomType = BO.RPGMysteryRoom(r.floor, r.seed);
            }
            const room = D.ROOMS[r.roomType];
            const quiet = room.quiet || r.roomType === 'rest' || r.roomType === 'shrine';
            const gateCount = (r.floor + 1) % 5 === 0 ? 1 : (quiet ? 2 : 2 + ((r.seed + r.floor) % 2));
            const gen = BO.RPGArena.generate({ floor: r.floor, roomType: r.roomType, seed: r.seed, gateCount });
            this.layout = gen.layout;
            BO.World.build(gen.mapId);
            if (r.roomType !== 'boss') BO.Sound.startMusic('rpg');
            this.vaultArt = BO.RPGVaultArt.build(this.layout, r.seed);
            if (BO.Assets && BO.Assets.placeGLBInstanced && BO.World.scene) {
                const vg = new THREE.Group();
                BO.World.scene.add(vg);
                this.vaultGlbGroup = vg;
                const { hw, hl, wallH } = this.layout;
                const cols = [];
                for (let z = -hl + 4; z <= hl - 4; z += 7.5) {
                    cols.push({ pos: [-hw + 0.9, 0, z], scale: [1.6, Math.min(wallH * 0.85, 6.2), 1.6] });
                    cols.push({ pos: [hw - 0.9, 0, z], scale: [1.6, Math.min(wallH * 0.85, 6.2), 1.6] });
                }
                BO.Assets.placeGLBInstanced(vg, 'mini_dungeon_kit/column.glb', cols, { fitSize: [1, 1, 1], guardScene: BO.World.scene });
                BO.Assets.placeGLBInstanced(vg, 'mini_dungeon_kit/barrel.glb', [
                    { pos: [-hw + 1.8, 0, hl - 2.2], rot: 0.4, scale: 1.5 },
                    { pos: [hw - 1.8, 0, hl - 2.2], rot: 1.9, scale: 1.5 },
                    { pos: [-hw + 1.9, 0, -hl + 2.4], rot: 0.9, scale: 1.45 },
                    { pos: [hw - 1.9, 0, -hl + 2.4], rot: 2.3, scale: 1.45 }
                ], { scale: 1, guardScene: BO.World.scene });
                BO.Assets.placeGLBInstanced(vg, 'mini_dungeon_kit/banner.glb', [
                    { pos: [-hw + 0.3, 3.2, 0], rot: Math.PI * 0.5, scale: 2.2 },
                    { pos: [hw - 0.3, 3.2, 0], rot: -Math.PI * 0.5, scale: 2.2 }
                ], { guardScene: BO.World.scene });
            }
            const sp = gen.layout.spawn;

            if (BO.RPGItems) BO.RPGItems.resetFloor();
            this.stats = this.Profile.computeStats(r);
            const P = this.P;
            if (this._firstFloor) {
                P.initForMatch('rpg', sp, this._loadoutConfig(), false);
                this._firstFloor = false;
            } else {
                P.pos.set(sp.x, sp.y, sp.z);
                P.vel.set(0, 0, 0);
                P.yaw = sp.yaw;
                P.pitch = 0;
                P.reloading = false;
            }
            P.maxHp = this.stats.maxHp;
            P.hp = Math.max(1, Math.round(P.maxHp * r.hpFrac));
            P.armor = 0;
            P.maxArmor = 0;
            P.armorReservePlates = 0;
            P.lethalCount = 0;
            P.tacticalCount = 0;
            P.selfRevives = 0;
            P.fieldCharge = 0;
            P.ultimateCharge = 0;
            for (const w of P.weapons) if (w && w.stats && w.stats.kind !== 'melee') w.reserve = w.stats.reserveMax;

            BO.Combat.onHitEnemy = (ent, dmg, hitbox, dist, w, pt, dir) => this._onGunHit(ent, dmg, hitbox, w, pt, dir);
            BO.Combat.onExplodeAt = (pos, rad, dmg) => this._onExplode(pos, rad, dmg);
            BO.Combat.onActivateKillstreak = null;

            this._buildGates();
            this.roomEvent = new BO.RPGRoomEvent(this, room);
            this.trail = BO.RPGUnlocks.equipped(this.Profile.data, 'trail');
            this.trailClock = 0;
            this._populateRoom();
            if (BO.RPGItems) BO.RPGItems.populateFloor(this);
            this._buildHazards();
            this._applyDoor();

            // Floor-start snapshot = the suspend/resume point.
            this.Profile.saveRun(this._snapshot());
            this.state = this._livingCount() === 0 && !this.waves && !this.roomEvent.blocks ? 'cleared' : 'fighting';
            if (this.state === 'cleared') this._onFloorCleared(true);

            const biome = this.layout.biome;
            BO.Events.emit('hud:banner', {
                title: `FLOOR ${r.floor} · ${r.mystery ? '? ' : ''}${room.name.toUpperCase()}`,
                sub: `${biome.name} · ${this.layout.style} · ${this.layout.W} × ${this.layout.L} m${this._door().id !== 'standard' ? ' · ' + this._door().name : ''}`,
                color: room.color
            });
            if (BO.RPGUI) BO.RPGUI.onFloorEntered();
            this.roomEvent.onEnter();
        }

        _loadoutConfig() {
            const it = this.Profile.cls.equip.weapon || this.Profile.makeStarterWeapon(this.run.classId);
            return {
                primary: this._weaponCfg(it),
                secondary: null,
                perks: [],
                lethal: 'frag',
                tactical: 'flashbang',
                fieldUpgrade: 'munitions_box',
                ultimatePower: 'gravity_spikes'
            };
        }

        _weaponCfg(item) {
            const spec = BO.WeaponsData.get(item.base);
            const camo = { common: 'default', rare: 'carbon', epic: 'dark_matter', legendary: 'gold' }[item.rarity] || 'default';
            return {
                id: item.base,
                camo,
                attachments: { optic: spec.modelSpec && spec.modelSpec.defaultScope ? 'sniper_scope' : 'iron', muzzle: 'none', underbarrel: 'none', magazine: 'std_mag', stock: 'std_stock' }
            };
        }

        /** Re-equips the active weapon item live (pack swaps during a delve). */
        refreshWeapon() {
            const P = this.P;
            const it = this.Profile.cls.equip.weapon;
            if (!it) return;
            P.weapons = [P._createWeaponInstance(this._weaponCfg(it), 0)];
            P.activeSlot = 0;
            P.reloading = false;
            P.reloadTimer = 0;
            P.rebuildViewmodel();
        }

        /** Recomputes derived stats after gear/boon changes, keeping the HP ratio. */
        recomputeStats() {
            const P = this.P;
            const frac = P.maxHp > 0 ? P.hp / P.maxHp : 1;
            this.stats = this.Profile.computeStats(this.run);
            P.maxHp = this.stats.maxHp;
            P.hp = Math.max(1, Math.min(P.maxHp, Math.round(P.maxHp * frac)));
            this.run.potions = Math.min(this.run.potions, this.stats.potionsMax);
        }

        _populateRoom() {
            const r = this.run;
            const L = this.layout;
            const f = r.floor;
            const tactic = L.encounter;
            const baseCount = BO.Math.clamp(Math.round((5 + f * 0.55) * tactic.factor), 4, 17);
            const camps = tactic.formation === 'flanks'
                ? L.camps.slice().sort((a, b) => Math.abs(b.x) - Math.abs(a.x))
                : L.camps.slice();
            const skirmisher = tactic.formation === 'ranged' ? 'ranged' : tactic.formation === 'tanks' ? 'armored' : null;
            const rush = tactic.formation === 'rush' || r.roomType === 'darkroom';
            const placeGroup = (count, campIdx, opts = {}) => {
                const c = camps[campIdx % Math.max(1, camps.length)] || { x: 0, z: -4 };
                for (let i = 0; i < count; i++) {
                    const a = (i / Math.max(1, count)) * Math.PI * 2 + Math.random() * 0.6;
                    const rad = count > 1 ? 1.6 + Math.random() * 0.8 : 0;
                    const special = i % 2 === 0 ? skirmisher : null;
                    this._spawnEnemy(opts.arch || this._pickArchetype(special), c.x + Math.cos(a) * rad, c.z + Math.sin(a) * rad, {
                        aggro: rush, hp: tactic.hp, damage: tactic.damage, speed: tactic.speed, ...opts
                    });
                }
            };
            const fillCamps = (total, startCamp = 0) => {
                let left = total;
                let ci = startCamp;
                while (left > 0) {
                    const g = Math.min(left, 2 + Math.floor(Math.random() * 3));
                    placeGroup(g, ci++);
                    left -= g;
                }
            };

            switch (r.roomType) {
                case 'puzzle':
                case 'bowling':
                case 'defend':
                case 'mimic':
                    break;
                case 'miniboss': {
                    const camp = camps[0] || L.center;
                    this.roomEvent.champion = this._spawnEnemy(this._pickArchetype('armored'), camp.x, camp.z, { elite: true, hp: 2.1, aggro: true });
                    fillCamps(Math.max(2, Math.floor(baseCount / 3)), 1);
                    break;
                }
                case 'hunt':
                    placeGroup(1, 0, { arch: this._pickArchetype('ranged'), elite: true, hp: 1.1 });
                    fillCamps(Math.round(baseCount * 0.75), 1);
                    break;
                case 'crossfire':
                    for (const side of [-1, 1]) {
                        const spots = L.camps.filter((c) => c.x * side > 2).slice(0, 3);
                        for (const spot of spots) this._spawnEnemy(this._pickArchetype('ranged'), spot.x, spot.z, { aggro: true });
                    }
                    fillCamps(Math.round(baseCount / 2));
                    break;
                case 'speedrun':
                    fillCamps(baseCount, 0);
                    for (const enemy of this.enemies) this.aggro(enemy);
                    break;
                case 'elite': {
                    const eliteArch = this._pickArchetype();
                    placeGroup(1, 0, { arch: eliteArch, elite: true });
                    fillCamps(Math.round(baseCount * 0.6), 1);
                    break;
                }
                case 'treasure':
                    this._spawnChest(L.center.x, L.center.z - 2);
                    fillCamps(Math.max(3, Math.round(baseCount * 0.6)));
                    break;
                case 'ambush': {
                    const per = BO.Math.clamp(Math.round(4 + f * 0.4), 4, 10);
                    this.waves = { total: 3, current: 0, perWave: per, delay: 1.2 };
                    BO.Events.emit('hud:toast', { text: 'AMBUSH — SURVIVE 3 WAVES', color: '#fb923c' });
                    break;
                }
                case 'boss':
                    this._spawnBoss();
                    break;
                case 'rest':
                    this._spawnBeacon(L.center.x + 4, L.center.z);
                    this._spawnCampfire(L.center.x - 3, L.center.z);
                    this._applyRest();
                    break;
                case 'shrine':
                    this._spawnAltar(L.center.x, L.center.z);
                    break;
                default:
                    if (this.D.ROOMS[r.roomType].quiet) break;
                    if (this.D.ROOMS[r.roomType].hazard) {
                        this._spawnChest(L.center.x, L.center.z);
                    }
                    fillCamps(baseCount);
            }
            if (L.cache) this._spawnCache(L.cache.x, L.cache.y, L.cache.z);
        }

        _pickArchetype(trait = null) {
            const biome = this.layout.biome;
            const eligible = Object.entries(biome.pool).filter(([id]) => (this.D.ENEMIES[id].minFloor || 1) <= this.run.floor);
            const preferred = trait ? eligible.filter(([id]) => this.D.ENEMIES[id][trait]) : [];
            const entries = preferred.length ? preferred : eligible;
            let total = 0;
            for (const [, w] of entries) total += w;
            let roll = Math.random() * total;
            for (const [id, w] of entries) { roll -= w; if (roll <= 0) return id; }
            return 'grunt';
        }

        _applyRest() {
            const P = this.P;
            P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.4);
            this.run.potions = this.stats.potionsMax;
            BO.Events.emit('hud:toast', { text: 'REST — HEALED 40% • POTIONS REFILLED • EXTRACTION AVAILABLE', color: '#4ade80' });
        }

        _nextRoomChoices(count) {
            const next = this.run.floor + 1;
            if (next % 5 === 0) return ['boss'];
            const rooms = Object.values(this.D.ROOMS).filter((rm) => rm.weight > 0 && (rm.minFloor || 1) <= next);
            const out = [];
            if (next % 5 === 4) out.push('rest'); // the floor before a boss always offers a breather
            const introductions = { 2: ['puzzle', 'mystery'], 3: ['speedrun', 'vents'], 6: ['shop', 'crossfire'], 8: ['surge'], 16: ['fracture'] };
            for (const id of introductions[next] || []) if (out.length < count) out.push(id);
            while (out.length < count) {
                const pool = rooms.filter((rm) => !out.includes(rm.id));
                if (!pool.length) break;
                let total = 0;
                for (const rm of pool) total += rm.weight;
                let roll = Math.random() * total;
                let picked = pool[0].id;
                for (const rm of pool) { roll -= rm.weight; if (roll <= 0) { picked = rm.id; break; } }
                out.push(picked);
            }
            return out;
        }

        _buildGates() {
            const choices = this._nextRoomChoices(this.layout.gates.length);
            const doors = BO.RPGDoors.roll(this.layout.gates.length, this.run.floor + 1, choices);
            this.layout.gates.forEach((g, i) => {
                const type = choices[i] || choices[0] || 'combat';
                const room = this.D.ROOMS[type];
                const door = BO.RPGDoors.get(doors[i]);
                const group = new THREE.Group();
                const tex = BO.RPGUI ? BO.RPGUI.makeGateTexture(room, this.run.floor + 1, door, BO.RPGDoors.cost(door, this.run, this.P)) : null;
                const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x555555, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
                const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 4.5), mat);
                plane.position.set(g.x, 2.3, g.z + 0.05);
                group.add(plane);
                const aura = BO.RPGUnlocks.equipped(this.Profile.data, 'gate');
                const light = new THREE.Color(door.id !== 'standard' ? door.color : (aura?.color || room.color));
                const trim = new THREE.MeshStandardMaterial({ color: door.id === 'standard' ? 0x907045 : new THREE.Color(door.color).multiplyScalar(0.55), metalness: 0.66, roughness: 0.36, emissive: light, emissiveIntensity: 0.15 });
                const arch = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.12, 8, 22, Math.PI), trim);
                arch.position.set(g.x, 3.32, g.z + 0.28);
                group.add(arch);
                const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.23, 0), new THREE.MeshBasicMaterial({ color: light }));
                lamp.position.set(g.x, 5.12, g.z + 0.25);
                group.add(lamp);
                const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.12), new THREE.MeshBasicMaterial({ color: light, transparent: true, opacity: 0.25 }));
                glow.rotation.x = -Math.PI / 2;
                glow.position.set(g.x, 0.03, g.z + 0.9);
                glow.scale.set(1, 14, 1);
                group.add(glow);
                BO.World.scene.add(group);
                if (door.id !== 'standard') {
                    // Door-type keystone above the arch so the door reads at a distance.
                    const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), new THREE.MeshStandardMaterial({ color: door.color, emissive: door.color, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 }));
                    stone.position.set(g.x, 4.25, g.z + 0.32);
                    stone.scale.set(1, 1.35, 0.5);
                    group.add(stone);
                }
                this.gates.push({ x: g.x, z: g.z, standZ: g.standZ, type, room, door, group, plane, mat, glow, arch, lamp, aura, open: false, timer: Infinity });
            });
        }

        _openGates() {
            for (const g of this.gates) {
                g.open = true;
                g.timer = g.door?.window || Infinity;
                g.mat.color.set(0xffffff);
                g.mat.opacity = 0.95;
                g.glow.material.opacity = 0.55;
                g.arch.material.emissiveIntensity = 0.55;
                if (g.aura) BO.FX.spawnParticles(g.lamp.position, g.aura.pattern, g.glow.material.color.getHex(), 2, -0.2, 1.2, 1.5);
            }
        }

        _livingCount() { return this.enemies.filter((z) => z.alive).length; }

        _onFloorCleared(silent = false) {
            if (this.floorResolved) return;
            this.floorResolved = true;
            const r = this.run;
            this.state = 'cleared';
            this._openGates();
            r.floorsCleared++;
            const fightRoom = !this.D.ROOMS[r.roomType].quiet && !['rest', 'shrine'].includes(r.roomType);
            if (fightRoom) {
                this._trackContract('clears');
                if (this.hazards.length) {
                    this._trackContract('hazards');
                    this._clearHazards();
                }
                const multiplier = this.roomEvent?.clearBonus() || 1;
                this._awardXP((25 + 8 * r.floor) * multiplier, null, 'FLOOR CLEARED');
                BO.Sound.playRoundEnd();
                if (!silent && BO.RPGItems) BO.RPGItems.onFloorCleared();
            }
            if (r.roomType === 'boss') {
                const p = this.Profile.data;
                const cp = r.floor + 1;
                if (!p.checkpoints.includes(cp)) {
                    p.checkpoints.push(cp);
                    p.checkpoints.sort((a, b) => a - b);
                    BO.Events.emit('hud:toast', { text: `CHECKPOINT UNLOCKED — FUTURE DELVES CAN START AT FLOOR ${cp}`, color: '#fbbf24' });
                }
                this._spawnBeacon(this.layout.center.x, this.layout.center.z + 6);
                this._offerBoons('Guardian slain — choose a Boon');
            } else if (r.roomType === 'elite') {
                this._offerBoons('Elite defeated — choose a Boon');
            } else if (r.roomType === 'hunt' || r.roomType === 'miniboss') {
                this._dropGold(new THREE.Vector3(this.layout.center.x, 0, this.layout.center.z), r.roomType === 'hunt' ? 70 : 100);
            }
            if (fightRoom && !silent) {
                BO.Events.emit('hud:banner', { title: 'FLOOR CLEARED', sub: this.beacon ? 'EXTRACT AT THE BEACON — OR CHOOSE A GATE TO GO DEEPER' : 'CHOOSE A GATE TO GO DEEPER', color: '#4ade80' });
            }
            this.Profile.save();
        }

        _buildHazards() {
            const room = this.D.ROOMS[this.run.roomType];
            const spec = room.hazard;
            if (!spec) return;

            for (const spot of this.layout.hazards) {
                const group = new THREE.Group();
                const material = new THREE.MeshBasicMaterial({
                    color: room.color, transparent: true, opacity: 0.3, depthWrite: false
                });
                const ring = new THREE.Mesh(new THREE.RingGeometry(spec.radius - 0.13, spec.radius, 40), material);
                const fill = new THREE.Mesh(new THREE.CircleGeometry(spec.radius - 0.16, 40), material.clone());
                fill.material.opacity = 0.06;
                ring.rotation.x = fill.rotation.x = -Math.PI / 2;
                group.position.set(spot.x, 0.035, spot.z);
                group.add(ring, fill);
                BO.World.scene.add(group);
                this.hazards.push({ group, ring, fill, clock: spot.phase * (spec.period - spec.warning) });
            }
        }

        _clearHazards() {
            for (const { group, ring, fill } of this.hazards) {
                group.removeFromParent();
                for (const mesh of [ring, fill]) {
                    mesh.material.dispose();
                    mesh.geometry.dispose();
                }
            }
            this.hazards = [];
        }

        _updateHazards(dt) {
            if (!this.hazards.length) return;
            const room = this.D.ROOMS[this.run.roomType];
            const spec = room.hazard;
            const player = this.P;
            for (const hazard of this.hazards) {
                hazard.clock += dt;
                const tell = (hazard.clock - spec.period + spec.warning) / spec.warning;
                hazard.ring.material.opacity = 0.32 + 0.67 * BO.Math.clamp(tell, 0, 1);
                hazard.fill.material.opacity = 0.06 + 0.45 * BO.Math.clamp(tell, 0, 1);
                if (hazard.clock < spec.period) continue;
                hazard.clock -= spec.period;
                const pos = hazard.group.position;
                BO.FX.spawnParticles(pos.clone().add(CAMERA_LIGHT_UP), 14, new THREE.Color(room.color).getHex(), 3, 1, 0.6, 1.2);
                if (!player.alive || player.pos.y > 0.9 || Math.hypot(player.pos.x - pos.x, player.pos.z - pos.z) >= spec.radius) continue;
                player.takeDamage(player.maxHp * spec.damage * this._difficulty().dmg, null, true);
                if (spec.silence) this.ability.silenced = Math.max(this.ability.silenced, spec.silence);
                if (spec.drain) this.ability.ult = Math.max(0, this.ability.ult - spec.drain);
                BO.Events.emit('hud:toast', { text: spec.name, color: room.color });
            }
        }

        _trackContract(event, amount = 1) {
            const r = this.run;
            const contract = this.D.CONTRACTS[r.contract];
            if (!contract || contract.event !== event || r.floor < contract.floor || r.contractProgress >= contract.goal) return;
            r.contractProgress = Math.min(contract.goal, r.contractProgress + amount);
            if (r.contractProgress === contract.goal) {
                BO.Events.emit('hud:toast', { text: `${contract.name} complete. Extract to collect your reward.`, color: '#fbbf24' });
            }
        }

        _offerBoons(title) {
            const owned = this.run.boons;
            const pool = this.D.BOONS.filter((b) => !owned.has(b.id));
            const picks = [];
            while (picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
            if (!picks.length || !BO.RPGUI) return;
            BO.RPGUI.openBoonPick(title, picks, (boon) => this.grantBoon(boon.id));
        }

        grantBoon(id) {
            const r = this.run;
            if (!this.D.boonById(id) || r.boons.has(id)) return;
            r.boons.add(id);
            if (id === 'potion_belt') {
                this.recomputeStats();
                r.potions = this.stats.potionsMax;
            } else {
                this.recomputeStats();
            }
            BO.Sound.playPerkBuy();
            BO.Events.emit('hud:toast', { text: `BOON GAINED — ${this.D.boonById(id).name.toUpperCase()}`, color: '#c084fc' });
        }

        enterGate(gate) {
            if (!gate || !gate.open || gate.sealed || this.state !== 'cleared') return;
            const r = this.run;
            const door = gate.door || BO.RPGDoors.get();
            const cost = BO.RPGDoors.cost(door, r, this.P);
            if (cost && !cost.ok) return;
            if (cost?.kind === 'gold') r.gold -= cost.amount;
            if (cost?.kind === 'scrap') r.scrap -= cost.amount;
            if (cost?.kind === 'hp') this.P.hp = Math.max(1, this.P.hp - cost.amount);
            if (cost) BO.Events.emit('hud:toast', { text: `${door.name.toUpperCase()} OPENED — PAID ${cost.label}`, color: door.color });
            this.state = 'transition'; // blocks double-entry during the fade
            r.hpFrac = BO.Math.clamp(this.P.hp / Math.max(1, this.P.maxHp), 0.05, 1);
            r.ult = this.ability.ult;
            r.floor += 1;
            r.roomType = gate.type;
            r.door = door.id;
            r.doorApplied = false;
            r.mystery = false;
            r.roomApplied = false;
            r.seed = (r.seed * 48271 + 12820163) % 2147483647;
            this.Profile.data.deepest = Math.max(this.Profile.data.deepest, r.floor);
            BO.Sound.playUIClick();
            const go = () => { if (this.active) this._enterFloor(); };
            if (BO.RPGUI) BO.RPGUI.fadeTransition(go); else go();
        }

        /* ======================================================================
           Spawning
        ====================================================================== */

        _difficulty() { return this.D.DIFFICULTIES[this.run.difficulty] || this.D.DIFFICULTIES.normal; }

        _spawnEnemy(archId, x, z, opts = {}) {
            const D = this.D;
            const A = D.ENEMIES[archId] || D.ENEMIES.grunt;
            const base = BO.ZombiesData.get(A.base);
            const diff = this._difficulty();
            const f = this.run.floor;
            const elite = !!opts.elite;
            const door = this._door();
            const hp = Math.round(A.hp * D.enemyHpMult(f) * diff.hp * (elite ? D.ELITE.hpMult : 1) * (opts.hp || 1) * (door.hp || 1));
            const dmg = Math.max(1, Math.round(A.attack * D.enemyDmgMult(f) * diff.dmg * (elite ? 1.3 : 1) * (opts.damage || 1) * (door.dmg || 1)));
            const speed = A.speed * (opts.speed || 1);
            const spec = Object.assign({}, base, {
                name: (elite ? 'Elite ' : '') + A.name,
                hp, speed, attack: dmg, defense: 0,
                resistances: { bullet: 1, explosive: 1, fire: 1, headshot: 1, melee: 1 },
                attackType: A.healer ? 'melee' : (A.attackType || base.attackType),
                movementHabit: A.habit || base.movementHabit,
                isBoss: false, isSuperBoss: false, isMagical: false, splitCount: 0, jumpChance: 0
            });
            const ent = new BO.ZombieEntity({
                id: this.nextId++, spec, round: f, hp, speed, damage: dmg,
                x, y: 0, z, sizeMult: elite ? D.ELITE.sizeMult : 1, windowInteractive: null
            });
            ent.rpg = {
                arch: A, camp: { x, z }, aggro: !!opts.aggro, elite, affixes: [], statuses: {},
                lastHitAt: -99, wardBroken: 0, armorBreak: 0, nthHits: 0, isBoss: false,
                healCd: 3 + Math.random() * 2, idleYaw: Math.random() * Math.PI * 2, idlePhase: Math.random() * 10, dead: false
            };
            ent.yaw = Math.atan2(this.layout.spawn.x - x, this.layout.spawn.z - z) + (Math.random() - 0.5) * 1.2;
            ent.rpg.idleYaw = ent.yaw;
            if (elite) {
                const keys = Object.keys(D.ELITE_AFFIXES);
                const n = f >= 10 ? 2 : 1;
                while (ent.rpg.affixes.length < n) {
                    const k = BO.Math.pick(keys);
                    if (!ent.rpg.affixes.includes(k)) ent.rpg.affixes.push(k);
                }
                if (ent.rpg.affixes.includes('hasted')) ent.speed *= 1.4;
                const col = D.ELITE_AFFIXES[ent.rpg.affixes[0]].hex;
                const aura = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 28), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 }));
                aura.rotation.x = Math.PI / 2;
                aura.position.y = 0.08;
                ent.parts.root.add(aura);
                ent.rpg.aura = aura;
            }
            if (opts.aggro) this._spawnFx(ent.pos, 0xa855f7);
            this.enemies.push(ent);
            return ent;
        }

        _spawnBoss() {
            const D = this.D;
            const f = this.run.floor;
            const idx = Math.floor((f / 5 - 1)) % D.BOSSES.length;
            const B = D.BOSSES[Math.max(0, idx)];
            const loops = Math.floor((f / 5 - 1) / D.BOSSES.length);
            const diff = this._difficulty();
            const base = BO.ZombiesData.get(B.id);
            const hp = Math.round(B.hp * (1 + 0.5 * loops) * diff.hp * (1 + 0.04 * (f - 5)));
            const dmg = Math.round(B.attack * D.enemyDmgMult(f) * diff.dmg);
            const spec = Object.assign({}, base, { name: B.name, title: B.title, hp, speed: B.speed, attack: dmg, defense: 0, isSuperBoss: false });
            const L = this.layout;
            const ent = new BO.ZombieEntity({ id: this.nextId++, spec, round: f, hp, speed: B.speed, damage: dmg, x: L.center.x, y: 0, z: L.center.z - 8, windowInteractive: null });
            ent.rpg = {
                arch: { id: 'boss', name: B.name, role: 'Boss', weak: null, xp: B.xp, gold: B.gold }, boss: B,
                camp: { x: L.center.x, z: L.center.z - 8 }, aggro: false, elite: false, affixes: [], statuses: {},
                lastHitAt: -99, wardBroken: 0, armorBreak: 0, nthHits: 0, isBoss: true, phase: 0,
                idleYaw: 0, idlePhase: 0, dead: false
            };
            ent.yaw = 0;
            this.enemies.push(ent);
            this.boss = ent;
            BO.Sound.startMusic('boss');
            BO.Sound.playBossIntro();
            BO.Juice?.shake?.(0.22);
            BO.Juice?.screenFlash?.('#dc2626', 0.24, 440);
        }

        _bossPhaseCheck(z) {
            const r = z.rpg;
            const frac = z.hp / z.maxHp;
            const thresholds = [0.66, 0.33];
            while (r.phase < thresholds.length && frac <= thresholds[r.phase]) {
                r.phase++;
                const adds = Math.min(8, 2 + Math.floor(this.run.floor / 5));
                for (let i = 0; i < adds; i++) {
                    const spot = this.layout.camps[i % Math.max(1, this.layout.camps.length)] || { x: 0, z: 0 };
                    const archetype = i === 0 && r.boss.escort ? r.boss.escort : this._pickArchetype();
                    this._spawnEnemy(archetype, spot.x, spot.z, { aggro: true });
                }
                z.stunTimer = Math.max(z.stunTimer, 0.6);
                BO.FX.spawnExplosion(z.pos.clone().add(CAMERA_LIGHT_UP), 5, 0xfbbf24);
                BO.Sound.playBossIntro();
                BO.Events.emit('hud:toast', { text: `${r.boss.name} — PHASE ${r.phase + 1}: IT CALLS FOR AID!`, color: '#fbbf24' });
            }
        }

        _spawnFx(pos, color) {
            BO.FX.spawnParticles(pos.clone().add(CAMERA_LIGHT_UP), 18, color, 4.5, 2, 0.6, 1.4);
        }

        _addProp(group) {
            BO.World.scene.add(group);
            const o = { group };
            this.props.push(o);
            return o;
        }

        _glowMat(hex, opacity = 0.9) { return new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity }); }

        _spawnBeacon(x, z) {
            const g = new THREE.Group();
            const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.25, 32), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.35 }));
            pad.position.y = 0.125;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.07, 8, 40), this._glowMat(0x4ade80));
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.3;
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 9, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
            beam.position.y = 4.6;
            g.add(pad, ring, beam);
            g.position.set(x, 0, z);
            this._addProp(g);
            this.beacon = { x, z, group: g, ring, beam };
        }

        _spawnCampfire(x, z) {
            const g = new THREE.Group();
            for (let i = 0; i < 6; i++) {
                const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 6), new THREE.MeshStandardMaterial({ color: 0x3f2a1a, roughness: 0.9 }));
                log.rotation.z = Math.PI / 2;
                log.rotation.y = (i / 6) * Math.PI;
                log.position.y = 0.12;
                g.add(log);
            }
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 10), this._glowMat(0xfb923c, 0.85));
            flame.position.y = 0.55;
            g.add(flame);
            const light = new THREE.PointLight(0xff8a3d, 1.6, 12);
            light.position.y = 1.2;
            g.add(light);
            g.position.set(x, 0, z);
            const o = this._addProp(g);
            o.flame = flame;
            o.light = light;
        }

        _spawnAltar(x, z) {
            const g = new THREE.Group();
            const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 1.0, 8), new THREE.MeshStandardMaterial({ color: 0x1e1b2e, metalness: 0.4, roughness: 0.5 }));
            base.position.y = 0.5;
            const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), this._glowMat(0xc084fc, 0.95));
            gem.position.y = 1.7;
            const light = new THREE.PointLight(0xc084fc, 1.4, 10);
            light.position.y = 1.8;
            g.add(base, gem, light);
            g.position.set(x, 0, z);
            this._addProp(g);
            this.altar = { x, z, group: g, gem, used: false };
        }

        _spawnChest(x, z) {
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.9), new THREE.MeshStandardMaterial({ color: 0x3b2a12, metalness: 0.5, roughness: 0.45 }));
            body.position.y = 0.4;
            const lid = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.25, 0.95), new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.85, roughness: 0.25 }));
            lid.position.y = 0.92;
            const glow = new THREE.PointLight(0xfde047, 1.2, 7);
            glow.position.y = 1.4;
            g.add(body, lid, glow);
            g.position.set(x, 0, z);
            this._addProp(g);
            this.chest = { x, z, group: g, lid, opened: false, kind: 'chest' };
        }

        _spawnCache(x, y, z) {
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.35 }));
            body.position.y = 0.3;
            const strip = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.62), this._glowMat(0x22d3ee));
            strip.position.y = 0.45;
            g.add(body, strip);
            g.position.set(x, y, z);
            this._addProp(g);
            this.cache = { x, y, z, group: g, opened: false, kind: 'cache' };
        }

        /* ======================================================================
           Damage, statuses & reactions
        ====================================================================== */

        isAlive(z) { return !!(z && z.alive && z.rpg && !z.rpg.dead); }

        hasStatus(z, id) { return !!(z.rpg && z.rpg.statuses[id] && z.rpg.statuses[id].t > 0); }

        enemiesInRadius(pos, radius, filter = null) {
            const out = [];
            for (const z of this.enemies) {
                if (!this.isAlive(z)) continue;
                if (BO.Math.dist2D(z.pos.x, z.pos.z, pos.x, pos.z) <= radius + z.radius && (!filter || filter(z))) out.push(z);
            }
            return out;
        }

        nearestEnemies(pos, radius, count, exclude = null) {
            return this.enemies
                .filter((z) => this.isAlive(z) && (!exclude || !exclude.has(z)) && BO.Math.dist2D(z.pos.x, z.pos.z, pos.x, pos.z) <= radius)
                .sort((a, b) => BO.Math.dist2D(a.pos.x, a.pos.z, pos.x, pos.z) - BO.Math.dist2D(b.pos.x, b.pos.z, pos.x, pos.z))
                .slice(0, count);
        }

        aggro(z) {
            if (!z || !z.rpg || z.rpg.aggro) return;
            z.rpg.aggro = true;
            // Pack aggro: nearby idle allies join in.
            for (const o of this.enemies) {
                if (o === z || !this.isAlive(o) || o.rpg.aggro) continue;
                if (BO.Math.dist2D(o.pos.x, o.pos.z, z.pos.x, z.pos.z) <= PACK_RADIUS) o.rpg.aggro = true;
            }
        }

        /**
         * Single entry point for every point of player damage dealt to an enemy.
         * ctx: { source:'gun'|'melee'|'ability'|'reaction'|'dot'|'conduct', hitbox, isHead, dir, weapon, weak }
         * Returns the HP actually removed (0 if none) and sets ctx.killed.
         */
        dealDamage(z, amount, ctx = {}) {
            if (!this.isAlive(z) || amount <= 0) return 0;
            const s = this.stats;
            const r = z.rpg;
            this.aggro(z);
            let mult = s.dmgMult * (1 + this.momentum.stacks * this.D.MOMENTUM.dmgPerStack);
            const src = ctx.source || 'gun';
            if (src === 'gun' || src === 'melee') {
                mult *= src === 'gun' ? s.weaponPower * (1 + s.gunDmg / 100) : s.abilityPower;
                if (ctx.isHead) mult *= 1 + s.headDmg / 100 + (s.talents.has('marksman') ? 0.35 : 0);
                else if (s.bodyDmg) mult *= Math.max(0.1, 1 + s.bodyDmg / 100);
                if (s.talents.has('shotgun_doctrine') && ctx.weapon && /shotgun/i.test(ctx.weapon.stats.category || '')) mult *= 1.3;
                if (s.kitId === 'pyrotech' && this.hasStatus(z, 'burn')) mult *= 1.2;
                if (this.ability.ultActive > 0 && this.ability.ultId === 'juggernaut') mult *= this.D.CLASSES.vanguard.abilities.ultimate.gunMult;
                if (r.affixes.includes('warded') && r.wardBroken <= 0 && r.armorBreak <= 0 && !this.hasStatus(z, 'expose')) mult *= 0.4;
            } else if (src === 'ability' || src === 'reaction') {
                mult *= s.abilityPower * (1 + s.abilityDmg / 100);
                if (src === 'reaction') mult *= 1 + s.reactionDmg / 100;
                if (ctx.weak) mult *= 1.5;
                if (r.affixes.includes('warded')) r.wardBroken = 5;
            } else if (src === 'dot') {
                mult *= s.abilityPower;
            }
            if (r.elite || r.isBoss) mult *= 1 + s.eliteDmg / 100;
            if (this.run.boons.has('executioner') && z.hp < z.maxHp * 0.3) mult *= 1.5;
            if (this.hasStatus(z, 'expose')) mult *= this.D.STATUSES.expose.dmgTakenMult;
            let hitbox = ctx.hitbox || 'torso';
            if (hitbox === 'shield' && (r.armorBreak > 0 || this.hasStatus(z, 'expose'))) hitbox = 'torso';
            const kind = src === 'melee' ? 'melee' : (src === 'gun' ? 'bullet' : (ctx.element === 'burn' ? 'fire' : 'explosive'));
            const before = z.hp;
            const killed = z.takeDamage(amount * mult, hitbox, !!ctx.isHead, ctx.dir || null, kind);
            const dealt = Math.max(0, before - Math.max(0, z.hp));
            r.lastHitAt = this.elapsed;
            ctx.killed = killed;
            if (dealt > 0) {
                const charge = BO.Math.clamp(1 + s.ultCharge / 100, 0.2, 3);
                if (this.ability.ultActive <= 0) this.ability.ult = Math.min(1, this.ability.ult + (dealt / 1100) * charge);
                if (BO.RPGUI) BO.RPGUI.damageNumber(z, dealt, ctx);
            }
            if (r.isBoss && !killed) this._bossPhaseCheck(z);
            if (killed) this._onEnemyKilled(z, ctx);
            return dealt;
        }

        applyStatus(z, id, ctx = {}) {
            if (!this.isAlive(z)) return;
            const st = this.D.STATUSES[id];
            if (!st) return;
            const dur = st.duration * (1 + this.stats.statusDur / 100) * (ctx.durMult || 1);
            const cur = z.rpg.statuses[id];
            z.rpg.statuses[id] = { t: Math.max(cur ? cur.t : 0, dur), tick: cur ? cur.tick : 1 };
            if (id === 'chill') z.slowTimer = Math.max(z.slowTimer || 0, dur);
            if (id === 'expose' && z.rpg.affixes.includes('warded')) z.rpg.wardBroken = Math.max(z.rpg.wardBroken, dur);
            this.aggro(z);
            BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 6, st.hex, 2.6, 1.5, 0.45, 1.0);
        }

        /** Primers can roll the Prism Core extra status. */
        applyPrimer(z, ids, ctx = {}) {
            for (const id of ids) this.applyStatus(z, id, ctx);
            if (this.stats.prismPrimer && this.isAlive(z)) {
                const extra = this.D.STATUS_ORDER.filter((s) => !ids.includes(s));
                if (extra.length) this.applyStatus(z, BO.Math.pick(extra), ctx);
            }
        }

        /**
         * Consumes every status on z and triggers its reaction.
         * detonatorDealt = damage the detonating hit dealt (Shatter scales with it).
         */
        detonate(z, detonatorDealt = 0) {
            if (!z || !z.rpg) return 0;
            const ids = this.D.STATUS_ORDER.filter((id) => this.hasStatus(z, id));
            if (!ids.length) return 0;
            for (const id of ids) {
                delete z.rpg.statuses[id];
                if (id === 'chill') z.slowTimer = 0;
            }
            const reps = this.stats.doubleReactions ? 2 : 1;
            let count = 0;
            for (const id of ids) {
                for (let k = 0; k < reps; k++) {
                    this._react(id, z, detonatorDealt);
                    count++;
                }
            }
            this.run.reactions += count;
            this._trackContract('reactions', count);
            this.Profile.data.stats.reactions += count;
            if (this.run.boons.has('reactive_mend')) this.heal(3 * count);
            return count;
        }

        _react(statusId, z, detonatorDealt) {
            const D = this.D;
            const s = this.stats;
            const reaction = D.REACTIONS[D.STATUSES[statusId].reaction];
            const weak = !!(z.rpg && z.rpg.arch && z.rpg.arch.weak === statusId);
            const pos = z.pos.clone();
            if (BO.RPGUI) BO.RPGUI.reactionText(z, reaction, weak);
            switch (reaction.id) {
                case 'combust': {
                    const radius = reaction.radius * (s.talents.has('combustion_engine') ? 1.6 : 1);
                    BO.FX.spawnExplosion(pos.clone().add(CAMERA_LIGHT_UP), radius, 0xfb923c);
                    BO.Sound.playExplosion(0.55);
                    for (const o of this.enemiesInRadius(pos, radius)) {
                        this.dealDamage(o, reaction.damage, { source: 'reaction', element: 'burn', weak: o === z ? weak : (o.rpg.arch.weak === 'burn') });
                        if (s.talents.has('wildfire') && this.isAlive(o)) this.applyStatus(o, 'burn');
                    }
                    break;
                }
                case 'shatter': {
                    const brittle = s.talents.has('brittle');
                    const bonus = Math.max(25, detonatorDealt) * (brittle ? 2 : 1) * reaction.bonusMult;
                    BO.FX.spawnParticles(pos.clone().add(CAMERA_LIGHT_UP), 26, 0x7dd3fc, 6, 8, 0.6, 1.4);
                    BO.Sound.playHitmarker(true, false);
                    if (this.isAlive(z)) {
                        z.frozenTimer = Math.max(z.frozenTimer || 0, brittle ? 3 : reaction.freeze);
                        this.dealDamage(z, bonus, { source: 'reaction', element: 'chill', weak });
                    } else {
                        // A frozen corpse bursts into shards that hit everything within 4 m.
                        for (const o of this.enemiesInRadius(pos, 4)) {
                            this.dealDamage(o, bonus * 0.6, { source: 'reaction', element: 'chill', weak: o.rpg.arch.weak === 'chill' });
                            if (this.isAlive(o)) o.frozenTimer = Math.max(o.frozenTimer || 0, 0.6);
                        }
                    }
                    break;
                }
                case 'overload': {
                    const supr = s.talents.has('superconductor');
                    const targets = this.nearestEnemies(pos, reaction.radius, supr ? 5 : reaction.arcs, new Set([z]));
                    const from = pos.clone().add(new THREE.Vector3(0, 1.3, 0));
                    for (const o of targets) {
                        BO.FX.spawnTracer(from, o.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfde047, 0.05, 0.16);
                        this.dealDamage(o, reaction.damage * (supr ? 1.4 : 1), { source: 'reaction', element: 'shock', weak: o.rpg.arch.weak === 'shock' || (o === z && weak) });
                    }
                    if (!targets.length && this.isAlive(z)) this.dealDamage(z, reaction.damage * 0.75, { source: 'reaction', element: 'shock', weak });
                    BO.Sound.playTrapZap();
                    break;
                }
                case 'rupture': {
                    const dmg = reaction.damage * (s.talents.has('rupture_specialist') ? 2 : 1);
                    BO.FX.spawnParticles(pos.clone().add(CAMERA_LIGHT_UP), 20, 0xf9a8d4, 5, 6, 0.5, 1.3);
                    if (this.isAlive(z)) {
                        z.rpg.armorBreak = reaction.armorBreak;
                        this.dealDamage(z, dmg, { source: 'reaction', element: 'expose', weak });
                    } else {
                        // The rupture shockwave hits the nearest enemy instead and breaks its armour.
                        const o = this.nearestEnemies(pos, 5, 1)[0];
                        if (o) {
                            o.rpg.armorBreak = reaction.armorBreak;
                            BO.FX.spawnTracer(pos.clone().add(new THREE.Vector3(0, 1.1, 0)), o.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xf9a8d4, 0.05, 0.18);
                            this.dealDamage(o, dmg * 0.7, { source: 'reaction', element: 'expose', weak: o.rpg.arch.weak === 'expose' });
                        }
                    }
                    break;
                }
                default:
                    break;
            }
            if (this.run.boons.has('chain_reaction') && this.isAlive(z) && Math.random() < 0.35) this.applyStatus(z, statusId);
        }

        _onGunHit(z, dmg, hitbox, weapon, impactPos, dir) {
            if (z && z.rpgProp) {
                BO.RPGItems?.damageProp(z.rpgProp, dmg);
                return !!z.rpgProp.dead;
            }
            if (!this.isAlive(z)) return false;
            const s = this.stats;
            const isMelee = !!(weapon && (weapon.id === 'knife' || (weapon.stats && weapon.stats.kind === 'melee')));
            const isHead = hitbox === 'head' && !(z.spec.bodySpec && z.spec.bodySpec.headless);
            const ctx = { source: isMelee ? 'melee' : 'gun', hitbox, isHead, dir, weapon };
            const dealt = this.dealDamage(z, dmg, ctx);
            if (dealt > 0 && this.run.boons.has('vampiric_rounds')) this.heal(dealt * 0.015);
            if (dealt > 0 && BO.RPGItems) BO.RPGItems.onGunHit(z, dealt, hitbox, weapon, impactPos, dir);
            if (ctx.killed || !this.isAlive(z)) return !!ctx.killed;

            // On-hit procs.
            const roll = (pct) => pct > 0 && Math.random() * 100 < pct;
            if (s.alwaysBurn || roll(s.burnChance)) this.applyStatus(z, 'burn');
            if (roll(s.chillChance)) this.applyStatus(z, 'chill');
            if (roll(s.shockChance)) this.applyStatus(z, 'shock');
            if (roll(s.exposeChance) || (isHead && this.run.boons.has('exposing_rounds'))) this.applyStatus(z, 'expose');
            if (this.ability.ultActive > 0 && this.ability.ultId === 'juggernaut') this.applyStatus(z, 'expose');
            if (s.headDetonate && isHead) {
                this.applyStatus(z, 'chill');
                this.detonate(z, dealt);
            }
            if (s.everyNthDetonate > 0 && this.isAlive(z)) {
                z.rpg.nthHits++;
                if (z.rpg.nthHits % s.everyNthDetonate === 0) {
                    this.applyStatus(z, 'shock');
                    this.detonate(z, dealt);
                }
            }
            // Tempest passive: Static conducts gun damage from Shocked targets.
            if (s.kitId === 'tempest' && dealt > 0 && this.isAlive(z) && this.hasStatus(z, 'shock')) {
                const pct = s.talents.has('static_field') ? 0.4 : 0.2;
                const t = this.nearestEnemies(z.pos, 8, 1, new Set([z]))[0];
                if (t) {
                    BO.FX.spawnTracer(z.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), t.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfde047, 0.025, 0.08);
                    this.dealDamage(t, dealt * pct, { source: 'conduct' });
                }
            }
            return false;
        }

        _onExplode(pos, radius, damage) {
            for (const z of this.enemiesInRadius(pos, radius)) {
                const d = BO.Math.dist2D(z.pos.x, z.pos.z, pos.x, pos.z);
                this.dealDamage(z, damage * (1 - (d / radius) * 0.5), { source: 'ability' });
            }
            if (BO.RPGItems) BO.RPGItems.onExplosionAt(pos, radius, damage);
        }

        _onEnemyKilled(z, ctx = {}) {
            const r = z.rpg;
            if (!r || r.dead) return;
            r.dead = true;
            const s = this.stats;
            const run = this.run;
            run.kills++;
            this.Profile.data.stats.kills++;
            if (r.aura) r.aura.visible = false;
            const selfDestruct = !!ctx.selfDestruct;

            if (!selfDestruct) {
                this._trackContract('kills');
                if (r.elite) this._trackContract('elites');
                const guide = this.Profile.data.fieldGuide;
                const key = r.isBoss ? r.boss.id : r.arch.id;
                guide[key] = (guide[key] || 0) + 1;
                // Momentum.
                const cap = run.boons.has('adrenal') ? 15 : this.D.MOMENTUM.max;
                this.momentum.stacks = Math.min(cap, this.momentum.stacks + 1);
                this.momentum.decay = 0;
                // Healing on kill.
                let heal = s.killHeal + (run.boons.has('vampiric_rounds') ? 3 : 0) + this.P.maxHp * (s.killHealPct / 100);
                if (heal > 0) this.heal(heal);
                // XP & gold.
                const xpBase = (r.arch.xp || 10) * (r.elite ? this.D.ELITE.xpMult : 1);
                this._awardXP(xpBase, z.pos, null);
                const midasMult = BO.RPGItems?.has('midas_crown') ? 1.45 : 1;
                const goldBase = (r.arch.gold || 3) * (r.elite ? this.D.ELITE.goldMult : 1) * midasMult;
                this._dropGold(z.pos, goldBase);
                this._maybeDropItem(z);
                if (BO.RPGItems) BO.RPGItems.onEnemyKilled(z, z.pos);
                BO.Sound.playHitmarker(!!ctx.isHead, true);
                BO.Events.emit('hud:hitmarker', { isHeadshot: !!ctx.isHead, isKill: true });
            }
            if (r.affixes.includes('volatile')) {
                const pos = z.pos.clone();
                BO.FX.spawnParticles(pos.clone().add(CAMERA_LIGHT_UP), 16, 0xf59e0b, 2.5, 0, 0.8, 1.6);
                this.timers.push({
                    t: 0.8,
                    fn: () => {
                        BO.FX.spawnExplosion(pos.clone().add(CAMERA_LIGHT_UP), 4.2, 0xf59e0b);
                        BO.Sound.playExplosion(0.7);
                        if (this.P.alive && BO.Math.dist2D(this.P.pos.x, this.P.pos.z, pos.x, pos.z) < 4.2) {
                            this.P.takeDamage(z.damage * 1.4, pos, true);
                        }
                    }
                });
            }
            if (r.isBoss) {
                this._trackContract('bosses');
                if (r.boss.id === 'boss_hydra_matron') this._trackContract('matron');
                run.bossKills++;
                this.Profile.data.stats.bossKills++;
                this.boss = null;
                BO.Events.emit('hud:banner', { title: `${r.boss.name} DEFEATED`, sub: 'THE WAY DEEPER IS OPEN • A BEACON HAS APPEARED', color: '#fbbf24' });
                BO.Sound.playPaPChime();
            }
        }

        heal(amount) {
            const P = this.P;
            if (!P.alive || amount <= 0) return;
            P.hp = Math.min(P.maxHp, P.hp + amount);
        }

        /* ======================================================================
           Player damage hooks (called from PlayerController.takeDamage)
        ====================================================================== */

        modifyIncomingDamage(amount, attackerPos, attackerEntity) {
            if (!this.active || !this.stats) return amount;
            const s = this.stats;
            const P = this.P;
            let a = amount * s.dmgTakenMult;
            if (s.kitId === 'vanguard' && attackerPos && BO.Math.dist2D(attackerPos.x, attackerPos.z, P.pos.x, P.pos.z) <= 4) a *= 0.8;
            if (this.ability.ultActive > 0 && this.ability.ultId === 'juggernaut') a *= 1 - this.D.CLASSES.vanguard.abilities.ultimate.dr;
            if (s.talents.has('heat_shield') && this.enemiesInRadius(P.pos, 10, (z) => this.hasStatus(z, 'burn')).length) a *= 0.8;
            if (BO.RPGItems) a = BO.RPGItems.onPlayerDamaged(a, attackerPos, attackerEntity);
            if (a > 0.5) {
                const loss = Math.round(this.D.MOMENTUM.hitLoss * (1 - BO.Math.clamp(s.momentumKeep / 100, 0, 0.9)));
                this.momentum.stacks = Math.max(0, this.momentum.stacks - Math.max(1, loss));
            }
            return a;
        }

        /** Returns true if death was prevented (Last Bastion, Second Wind, Field Medic, Dead Cat). */
        tryPreventDeath(P) {
            if (!this.active) return false;
            const r = this.run;
            const s = this.stats;
            if (s.talents.has('last_bastion') && r.lastBastionFloor !== r.floor) {
                r.lastBastionFloor = r.floor;
                P.hp = 1;
                BO.RPGAbilities.startUltimate(true);
                BO.Events.emit('hud:banner', { title: 'LAST BASTION', sub: 'JUGGERNAUT PROTOCOL ENGAGED', color: '#f472b6' });
                return true;
            }
            if (r.boons.has('second_wind') && !r.secondWindUsed) {
                r.secondWindUsed = true;
                P.hp = Math.round(P.maxHp * 0.3);
                P.reviveGraceTimer = 1.5;
                BO.Events.emit('hud:banner', { title: 'SECOND WIND', sub: 'BACK ON YOUR FEET AT 30% HP', color: '#4ade80' });
                return true;
            }
            if (s.fieldMedic && !r.fieldMedicUsed) {
                r.fieldMedicUsed = true;
                P.hp = Math.round(P.maxHp * 0.25);
                P.reviveGraceTimer = 1.5;
                BO.Events.emit('hud:banner', { title: 'FIELD MEDIC', sub: 'STABILISED AT 25% HP — ONCE PER DELVE', color: '#4ade80' });
                return true;
            }
            if ((r.livesLeft || 0) > 0) {
                r.livesLeft--;
                P.hp = Math.max(1, P.maxHp);
                P.reviveGraceTimer = 2.0;
                BO.FX.spawnParticles(P.pos.clone().add(CAMERA_LIGHT_UP), 28, 0x94a3b8, 5, -1, 0.9, 1.4);
                BO.Sound.playPerkBuy();
                BO.Events.emit('hud:banner', { title: 'DEAD CAT — NINE LIVES', sub: `${r.livesLeft} ${r.livesLeft === 1 ? 'LIFE' : 'LIVES'} REMAINING`, color: '#cbd5e1' });
                return true;
            }
            return false;
        }

        /* ======================================================================
           Rewards & loot
        ====================================================================== */

        _awardXP(base, pos, label) {
            if (base <= 0) return 0;
            const D = this.D;
            const rec = this.Profile.cls;
            const rec_lv = rec.level;
            const recommended = D.recommendedLevel(this.run.floor);
            const catchup = rec_lv < recommended ? 1 + 0.25 * Math.min(3, recommended - rec_lv) : 1;
            const amt = Math.round(base * D.depthRewardMult(this.run.floor) * (1 + this.momentum.stacks * D.MOMENTUM.xpPerStack)
                * (1 + this.stats.xpGain / 100) * this._difficulty().reward * catchup * (this._door().xp || 1));
            this.run.xpEarned += amt;
            const levels = this.Profile.addXP(amt);
            if (BO.RPGUI && pos) BO.RPGUI.floatText(pos, `+${amt} XP`, '#a78bfa', 13, 1.9);
            if (label && BO.RPGUI) BO.RPGUI.floatText(this.P.pos, `${label} +${amt} XP`, '#a78bfa', 16, 2.2);
            if (levels.length) this._onLevelUp(levels);
            return amt;
        }

        _onLevelUp(levels) {
            const lv = levels[levels.length - 1];
            this.run.levelsGained += levels.length;
            this.recomputeStats();
            this.P.hp = Math.min(this.P.maxHp, this.P.hp + this.P.maxHp * 0.3);
            const tierUnlocked = levels.some((l) => this.D.TALENT_TIER_LEVELS.includes(l));
            BO.Sound.playRankUp();
            BO.FX.spawnParticles(this.P.pos.clone().add(CAMERA_LIGHT_UP), 30, 0xa78bfa, 5, -2, 0.9, 1.4);
            BO.Events.emit('hud:toast', { text: tierUnlocked ? `LEVEL ${lv} — TALENT READY: PRESS [TAB]` : `LEVEL ${lv} REACHED`, color: '#a78bfa' });
            BO.Events.emit('hud:banner', {
                title: `LEVEL ${lv}`,
                sub: tierUnlocked ? 'TALENT TIER UNLOCKED — OPEN THE PACK [TAB] TO CHOOSE' : `+MAX HP • STRONGER POTIONS • ABILITY POWER ${Math.round(this.stats.abilityPower * 100)}%`,
                color: '#a78bfa'
            });
            this.Profile.save();
        }

        _goldMult() {
            return this.D.depthRewardMult(this.run.floor) * this._difficulty().reward * (1 + this.stats.goldFind / 100)
                * (1 + this.momentum.stacks * this.D.MOMENTUM.goldPerStack) * (this._door().gold || 1);
        }

        _door() { return BO.RPGDoors.get(this.run?.door); }

        _applyDoor() {
            const r = this.run;
            const door = this._door();
            const L = this.layout;
            // The chest is part of the room, so it is rebuilt when a suspended floor resumes.
            // Only one chest per floor is tracked, so a room that already has one pays out in gold instead.
            if (door.chest && r.roomType !== 'boss' && !this.chest) this._spawnChest(L.center.x + 3, L.center.z + 3);
            if (r.doorApplied) return;
            r.doorApplied = true;
            if (door.chest && (r.roomType === 'boss' || this.chest?.x !== L.center.x + 3)) {
                this._dropGold(new THREE.Vector3(L.center.x, 0, L.center.z + 3), 60);
            }
            if (door.potion) {
                r.potions = Math.min(this.stats.potionsMax, r.potions + door.potion);
                BO.Events.emit('hud:toast', { text: 'CLOVER DOOR — POTION REFILLED', color: door.color });
            }
        }

        _dropGold(pos, base) {
            const total = Math.max(1, Math.round(base * this._goldMult()));
            const coins = Math.min(4, 1 + Math.floor(total / 12));
            for (let i = 0; i < coins; i++) {
                const v = i === coins - 1 ? total - Math.floor(total / coins) * (coins - 1) : Math.floor(total / coins);
                const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), this._glowMat(0xfde047, 1));
                const p = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.9, (Math.random() - 0.5) * 1.2));
                mesh.position.copy(p);
                BO.World.scene.add(mesh);
                this.pickups.push({ kind: 'gold', value: v, mesh, pos: p, vel: new THREE.Vector3((Math.random() - 0.5) * 3, 3.5, (Math.random() - 0.5) * 3), life: 40 });
            }
        }

        _maybeDropItem(z) {
            const r = z.rpg;
            const s = this.stats;
            const f = this.run.floor;
            if (r.isBoss) {
                this._dropItem(z.pos, this.Profile.rollItem({ floor: f + 2, minRarity: 'epic', rarityBonus: 0.2 }));
                const extra = { floor: f + 1, minRarity: 'rare' };
                if (r.boss.set) {
                    extra.set = r.boss.set;
                    const p = this.Profile.data;
                    const equipped = Object.values(p.classes).flatMap((rec) => Object.values(rec.equip));
                    extra.excludeLegendaries = new Set([...equipped, ...p.stash, ...this.run.pack].map((item) => item?.legendary));
                }
                this._dropItem(z.pos.clone().add(new THREE.Vector3(1.5, 0, 0)), this.Profile.rollItem(extra));
                return;
            }
            if (r.elite) {
                this._dropItem(z.pos, this.Profile.rollItem({ floor: f + 1, minRarity: 'rare', rarityBonus: 0.1 }));
                return;
            }
            const chance = 0.075 * (1 + s.dropBonus) * (this.run.roomType === 'ambush' ? 1.3 : 1);
            if (Math.random() < chance) this._dropItem(z.pos, this.Profile.rollItem({ floor: f }));
        }

        _dropItem(pos, item) {
            const rar = this.Profile.rarity(item);
            const g = new THREE.Group();
            const core = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), this._glowMat(rar.hex, 0.95));
            core.position.y = 0.7;
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, item.rarity === 'common' ? 1.4 : 3.6, 8, 1, true),
                new THREE.MeshBasicMaterial({ color: rar.hex, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
            beam.position.y = item.rarity === 'common' ? 0.9 : 2.0;
            g.add(core, beam);
            const p = pos.clone();
            p.y = BO.World.getGroundHeight(p.x, p.z, p.y + 1.0);
            g.position.copy(p);
            BO.World.scene.add(g);
            this.pickups.push({ kind: 'item', item, group: g, core, pos: p, life: Infinity });
            if (item.rarity === 'legendary') {
                BO.Events.emit('hud:toast', { text: `★ LEGENDARY DROP — ${item.name.toUpperCase()}`, color: '#fbbf24' });
                BO.Sound.playPaPChime();
            } else if (item.rarity === 'epic') {
                BO.Sound.playPowerUp();
            }
        }

        _collectItem(pk) {
            const it = pk.item;
            const run = this.run;
            if (it.rarity === 'common' && this.Profile.data.autoSalvage) {
                const sc = this.Profile.scrapValue(it);
                run.scrap += sc;
                if (BO.RPGUI) BO.RPGUI.floatText(pk.pos, `+${sc} SCRAP (auto-salvaged ${it.name})`, '#94a3b8', 13, 2);
                this._removePickup(pk);
                return;
            }
            if (run.pack.length >= this.stats.packSlots) {
                if (BO.RPGUI) BO.RPGUI.openPackFull(it, (dropUid) => {
                    if (dropUid === it.uid) return; // leave the new item on the floor
                    const idx = run.pack.findIndex((x) => x.uid === dropUid);
                    if (idx < 0) return;
                    const dropped = run.pack.splice(idx, 1)[0];
                    run.scrap += this.Profile.scrapValue(dropped);
                    run.pack.push(it);
                    this._removePickup(pk);
                    BO.Events.emit('hud:toast', { text: `PICKED UP ${it.name.toUpperCase()} • SALVAGED ${dropped.name.toUpperCase()}`, color: this.Profile.rarity(it).color });
                });
                return;
            }
            run.pack.push(it);
            if (it.legendary) this.Profile.data.stats.legendaries++;
            this._removePickup(pk);
            BO.Sound.playPoints();
            BO.Events.emit('hud:toast', { text: `PICKED UP ${this.Profile.rarity(it).name.toUpperCase()} ${it.name.toUpperCase()} — UNBANKED UNTIL YOU EXTRACT`, color: this.Profile.rarity(it).color });
        }

        _removePickup(pk) {
            const idx = this.pickups.indexOf(pk);
            if (idx >= 0) this.pickups.splice(idx, 1);
            if (pk.mesh && BO.World.scene) BO.World.scene.remove(pk.mesh);
            if (pk.group && BO.World.scene) BO.World.scene.remove(pk.group);
        }

        _openContainer(c) {
            if (c.opened) return;
            c.opened = true;
            this._trackContract('containers');
            const f = this.run.floor;
            if (c.kind === 'chest') {
                c.lid.rotation.x = -1.1;
                c.lid.position.z -= 0.3;
                c.lid.position.y += 0.25;
                const fracture = ['fracture', 'storm'].includes(this.run.roomType);
                this._dropGold(new THREE.Vector3(c.x, 0, c.z), (fracture ? 55 : 30) + f * 6);
                this._dropItem(new THREE.Vector3(c.x + 1.2, 0, c.z + 0.6), this.Profile.rollItem({
                    floor: f + 1, minRarity: fracture ? 'epic' : 'rare', rarityBonus: 0.12
                }));
                BO.Sound.playMysteryBoxJingle();
            } else {
                c.group.children[1].material.color.set(0x334155);
                this._dropGold(new THREE.Vector3(c.x, c.y, c.z), 18 + f * 4);
                this._dropItem(new THREE.Vector3(c.x, c.y, c.z + 0.8), this.Profile.rollItem({ floor: f + 1, rarityBonus: 0.15 }));
                BO.Events.emit('hud:toast', { text: 'HIDDEN CACHE FOUND', color: '#22d3ee' });
                BO.Sound.playPowerUp();
                this._awardXP(20 + f * 3, new THREE.Vector3(c.x, c.y, c.z), null);
            }
        }

        useShrine(choice) {
            const a = this.altar;
            const r = this.run;
            if (!a || a.used) return false;
            if (choice === 'blood') {
                r.shrineHpPenalty = Math.min(0.6, r.shrineHpPenalty + this.D.SHRINE.hpCostPct / 100);
            } else if (choice === 'gold') {
                const cost = this.D.SHRINE.goldCost(r.floor);
                if (r.gold < cost) return false;
                r.gold -= cost;
            } else {
                return false;
            }
            a.used = true;
            a.gem.material.color.set(0x475569);
            this.recomputeStats();
            this._offerBoons('Shrine — choose a Boon');
            return true;
        }

        /* ======================================================================
           Extraction, death, suspend
        ====================================================================== */

        extract() {
            if (!this.active || this.state === 'ended') return;
            const r = this.run;
            const profile = this.Profile;
            const p = profile.data;
            const bonusXp = this._awardXP(50 + 10 * r.floor, null, 'EXTRACTION');
            p.gold += r.gold;
            p.scrap += r.scrap;
            p.stats.goldBanked += r.gold;
            p.stats.extractions++;
            const U = BO.RPGUnlocks;
            p.unlockRecords.extractedFloor = Math.max(p.unlockRecords.extractedFloor || 0, r.floor);
            if (r.curse) U.record(p, 'curseExtractions');
            const legendaries = r.pack.filter((item) => item.rarity === 'legendary').length;
            if (legendaries) U.record(p, 'legendariesBanked', legendaries);
            let soldOverflow = 0;
            const banked = [];
            for (const it of r.pack) {
                if (profile.stashFree() > 0) { p.stash.push(it); banked.push(it); } else {
                    const g = profile.sellValue(it);
                    p.gold += g;
                    soldOverflow += g;
                }
            }
            p.deepest = Math.max(p.deepest, r.floor);
            const contract = this.D.CONTRACTS[r.contract];
            const contractReward = contract && r.contractProgress >= contract.goal ? contract : null;
            if (contractReward) {
                p.gold += contractReward.gold;
                p.scrap += contractReward.scrap;
                p.contractCompletions[r.contract] = (p.contractCompletions[r.contract] || 0) + 1;
            }
            this._finish('extract', { bonusXp, banked, soldOverflow, goldKept: r.gold, scrapKept: r.scrap, contractReward });
        }

        _die() {
            const r = this.run;
            const p = this.Profile.data;
            const kept = Math.floor(r.gold * this.stats.insurance);
            p.gold += kept;
            p.stats.deaths++;
            p.deepest = Math.max(p.deepest, r.floor);
            this._finish('death', { goldKept: kept, goldLost: r.gold - kept, itemsLost: r.pack.slice(), scrapLost: r.scrap });
        }

        _finish(outcome, extra) {
            const r = this.run;
            this.state = 'ended';
            this.Profile.clearRun();
            this.Profile.save();
            const report = Object.assign({
                outcome, classId: r.classId, floor: r.floor, startFloor: r.startFloor, kills: r.kills, reactions: r.reactions,
                xpEarned: r.xpEarned, levelsGained: r.levelsGained, bossKills: r.bossKills, boons: Array.from(r.boons),
                time: BO.Math.formatTime(r.elapsed), gold: r.gold, scrap: r.scrap
            }, extra);
            if (document.pointerLockElement) document.exitPointerLock();
            if (BO.RPGUI) BO.RPGUI.showReport(report);
        }

        /** Pause-menu exit: the delve stays suspended at the start of this floor. */
        suspend() {
            if (!this.active || this.state === 'ended') return;
            // The floor-start snapshot saved in _enterFloor is the resume point.
            this.Profile.save();
        }

        /* ======================================================================
           Interaction
        ====================================================================== */

        _updatePrompt() {
            const P = this.P;
            const near = (x, z, d) => BO.Math.dist2D(P.pos.x, P.pos.z, x, z) <= d;
            const kbI = BO.Settings.keyLabel(BO.Settings.getKeybinds().interact);
            this.prompt = null;
            this._interactTarget = null;
            const itemTarget = BO.RPGItems?.getInteractTarget?.(P.pos);
            if (itemTarget) {
                this.prompt = { ...itemTarget.prompt, text: itemTarget.prompt.text.replace('[E]', `[${kbI}]`) };
                this._interactTarget = itemTarget;
                return;
            }
            for (const pk of this.pickups) {
                if (pk.kind !== 'item') continue;
                if (near(pk.pos.x, pk.pos.z, 2.0) && Math.abs(P.pos.y - pk.pos.y) < 1.6) {
                    const rar = this.Profile.rarity(pk.item);
                    this.prompt = { text: `[${kbI}] PICK UP ${rar.name.toUpperCase()} ${pk.item.name.toUpperCase()} (${this.D.ITEM_SLOTS[pk.item.slot].name.toUpperCase()} • ILVL ${pk.item.ilvl})`, affordable: true, color: rar.color };
                    this._interactTarget = { kind: 'item', ref: pk };
                    return;
                }
            }
            for (const c of [this.chest, this.cache]) {
                if (c && !c.opened && near(c.x, c.z, 2.1) && Math.abs(P.pos.y - (c.y || 0)) < 1.6) {
                    const locked = c.kind === 'chest' && this.state !== 'cleared';
                    this.prompt = { text: locked ? 'VAULT CHEST — CLEAR THE ROOM TO OPEN' : `[${kbI}] OPEN ${c.kind === 'chest' ? 'VAULT CHEST' : 'HIDDEN CACHE'}`, affordable: !locked };
                    this._interactTarget = locked ? null : { kind: 'container', ref: c };
                    return;
                }
            }
            const event = this.roomEvent;
            if (event?.canUse() && near(event.pos.x, event.pos.z, 2.8)) {
                this.prompt = { text: `[${kbI}] ${event.room.name.toUpperCase()}`, affordable: true, color: event.room.color };
                this._interactTarget = { kind: 'roomEvent' };
                return;
            }
            if (this.altar && !this.altar.used && near(this.altar.x, this.altar.z, 2.6)) {
                this.prompt = { text: `[${kbI}] COMMUNE WITH THE SHRINE`, affordable: true };
                this._interactTarget = { kind: 'altar' };
                return;
            }
            if (this.beacon && near(this.beacon.x, this.beacon.z, 2.2)) {
                const busy = this.state !== 'cleared';
                this.prompt = { text: busy ? 'EXTRACTION BEACON — CLEAR THE FLOOR FIRST' : `[${kbI}] EXTRACT — BANK ${this.run.gold} GOLD & ${this.run.pack.length} ITEMS`, affordable: !busy };
                this._interactTarget = busy ? null : { kind: 'beacon' };
                return;
            }
            for (const g of this.gates) {
                if (near(g.x, g.standZ, 2.6)) {
                    const door = g.door || BO.RPGDoors.get();
                    const roomName = door.hidden ? 'VEILED' : g.room.name.toUpperCase();
                    const cost = BO.RPGDoors.cost(door, this.run, this.P);
                    const doorNote = door.id === 'standard' ? '' : ` • ${door.name.toUpperCase()}: ${door.desc}`;
                    const timer = Number.isFinite(g.timer) && g.open ? ` • SEALS IN ${Math.ceil(g.timer)}s` : '';
                    if (g.sealed) this.prompt = { text: `${door.name.toUpperCase()} — THE SAND RAN OUT. THIS DOOR IS SEALED`, affordable: false };
                    else if (!g.open) this.prompt = { text: `${roomName} GATE — SEALED UNTIL THE FLOOR IS CLEAR${doorNote}`, affordable: false };
                    else if (cost && !cost.ok) this.prompt = { text: `${door.name.toUpperCase()} — NEEDS ${cost.label}${cost.kind === 'hp' ? ' (TOO WOUNDED)' : ''}${doorNote}`, affordable: false };
                    else this.prompt = { text: `[${kbI}] ENTER ${roomName} ROOM${cost ? ' — PAY ' + cost.label : ''} — ${door.hidden ? 'The room is hidden.' : g.room.desc}${doorNote}${timer}`, affordable: true };
                    const usable = g.open && !g.sealed && (!cost || cost.ok);
                    this._interactTarget = usable ? { kind: 'gate', ref: g } : null;
                    return;
                }
            }
        }

        getPromptText() { return this.prompt; }

        moveSpeedMult() { return BO.RPGItems ? BO.RPGItems.moveSpeedMult() : 1; }
        reloadSpeedMult() { return BO.RPGItems ? BO.RPGItems.reloadSpeedMult() : 1; }

        interact() {
            if (!this.active || this.state === 'transition' || this.state === 'ended') return;
            const t = this._interactTarget;
            if (!t) return;
            if (t.kind === 'rpg_pedestal' || t.kind === 'rpg_locked_chest') BO.RPGItems?.interactWith(t);
            else if (t.kind === 'item') this._collectItem(t.ref);
            else if (t.kind === 'roomEvent') this.roomEvent?.interact();
            else if (t.kind === 'container') this._openContainer(t.ref);
            else if (t.kind === 'gate') this.enterGate(t.ref);
            else if (t.kind === 'beacon' && BO.RPGUI) BO.RPGUI.openExtractConfirm(this.run, () => this.extract());
            else if (t.kind === 'altar' && BO.RPGUI) BO.RPGUI.openShrine(this.run, this.D.SHRINE.goldCost(this.run.floor), (choice) => this.useShrine(choice));
        }

        drinkPotion() {
            const P = this.P;
            const r = this.run;
            if (!this.active || !P.alive || this.ability.potionCd > 0) return;
            if (r.potions <= 0) { BO.Events.emit('hud:toast', { text: 'NO POTIONS LEFT — REST ROOMS REFILL THEM', color: '#ef4444' }); return; }
            if (P.hp >= P.maxHp) { BO.Events.emit('hud:toast', { text: 'ALREADY AT FULL HEALTH', color: '#94a3b8' }); return; }
            r.potions--;
            this.ability.potionCd = 0.8;
            this.heal(P.maxHp * this.stats.potionHealFrac);
            BO.FX.spawnParticles(P.pos.clone().add(CAMERA_LIGHT_UP), 18, 0x4ade80, 3, -3, 0.7, 1.2);
            BO.Sound.playPerkBuy();
        }

        /* ======================================================================
           Update
        ====================================================================== */

        update(dt) {
            if (!this.active || this.state === 'transition' || this.state === 'ended' || !this.run) return;
            this.elapsed += dt;
            this.run.elapsed += dt;
            const P = this.P;

            // Death.
            if (!P.alive) { this._die(); return; }

            // Timers & ability state.
            for (let i = this.timers.length - 1; i >= 0; i--) {
                const t = this.timers[i];
                t.t -= dt;
                if (t.t <= 0) { this.timers.splice(i, 1); t.fn(); }
            }
            BO.RPGAbilities.update(dt);

            // Momentum decay.
            const adrenal = this.run.boons.has('adrenal');
            if (this.momentum.stacks > 0) {
                this.momentum.decay += dt;
                const every = this.D.MOMENTUM.decayEvery * (adrenal ? 2 : 1);
                if (this.momentum.decay >= every) { this.momentum.decay = 0; this.momentum.stacks--; }
            }

            this._updateEnemies(dt);
            this._updateHazards(dt);
            this._updateProjectiles(dt);
            this._updatePickups(dt);
            this._updateProps(dt);
            this._updateWaves(dt);
            if (BO.RPGItems) BO.RPGItems.update(dt);
            this.roomEvent?.update(dt);
            this.vaultArt?.update(this.elapsed);
            if (this.trail) {
                this.trailClock -= dt;
                if (this.trailClock <= 0 && Math.hypot(P.vel.x, P.vel.z) > 1.2 && P.pos.y < 1.3) {
                    BO.FX.spawnParticles(P.pos.clone().addScaledVector(CAMERA_LIGHT_UP, 0.18), 1 + (this.trail.pattern - 2) / 4,
                        new THREE.Color(this.trail.color).getHex(), 0.7, -0.1, 0.35, 0.65);
                    this.trailClock = 0.3;
                }
            }
            if (this.state === 'fighting' && !this.waves && !this.roomEvent?.blocks && this._livingCount() === 0) this._onFloorCleared();
            this._updatePrompt();
        }

        _updateWaves(dt) {
            const w = this.waves;
            if (!w || this.state !== 'fighting') return;
            if (this._livingCount() > 0) return;
            if (w.current >= w.total) { this.waves = null; return; }
            w.delay -= dt;
            if (w.delay > 0) return;
            w.current++;
            w.delay = 2.2;
            const spots = this.layout.ambushSpots;
            for (let i = 0; i < w.perWave; i++) {
                const s = spots[(i + w.current) % spots.length];
                this._spawnEnemy(this._pickArchetype(), s.x + (Math.random() - 0.5) * 2, s.z + (Math.random() - 0.5) * 2, { aggro: true });
            }
            BO.Sound.playRoundStart(w.current);
            BO.Events.emit('hud:toast', { text: `AMBUSH — WAVE ${w.current} / ${w.total}`, color: '#fb923c' });
        }

        _updateEnemies(dt) {
            const P = this.P;
            const crouch = P.crouching;
            const aggroR = crouch ? AGGRO_RADIUS_CROUCH : AGGRO_RADIUS;
            const callbacks = {
                allowProjectiles: true,
                getTarget: (z) => this._aiTarget(z),
                onAttackCustomTarget: () => {},
                onMeleePlayer: (attacker) => {
                    P.takeDamage(attacker.damage, attacker.pos, false, attacker);
                    BO.Sound.playZombieGroan(attacker.soundProfile, 0.9);
                },
                onRangedAttack: (attacker, tx, ty, tz) => this._spawnProjectile(attacker, tx, ty, tz)
            };
            const targets = this._combatEntities || (this._combatEntities = []);
            targets.length = 0;
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const z = this.enemies[i];
                const r = z.rpg;
                // Deaths not caused by player damage (e.g. a bomber detonating itself).
                if (!z.alive && r && !r.dead) this._onEnemyKilled(z, { selfDestruct: true });

                if (z.alive && r) {
                    // Status ticking.
                    for (const id of Object.keys(r.statuses)) {
                        const st = r.statuses[id];
                        st.t -= dt;
                        if (id === 'burn' && st.t > 0) {
                            st.tick -= dt;
                            if (st.tick <= 0) {
                                st.tick = 1;
                                const dps = this.D.STATUSES.burn.dps * (this.stats.talents.has('accelerant') ? 2 : 1) * BO.RPGData.enemyHpMult(this.run.floor) * 0.6;
                                this.dealDamage(z, dps, { source: 'dot', element: 'burn' });
                                if (!this.isAlive(z)) break;
                            }
                        }
                        if (st.t <= 0) delete r.statuses[id];
                    }
                    if (!this.isAlive(z)) continue;
                    if (r.wardBroken > 0) r.wardBroken -= dt;
                    if (r.armorBreak > 0) r.armorBreak -= dt;
                    if (r.aura) r.aura.rotation.z += dt * 2.2;

                    // Aggro by proximity + sight.
                    if (!r.aggro) {
                        const d = BO.Math.dist2D(z.pos.x, z.pos.z, P.pos.x, P.pos.z);
                        if (d < (r.isBoss ? 14 : aggroR) && BO.World.hasLineOfSight(z.pos.x, z.pos.y + 1.4, z.pos.z, P.pos.x, P.pos.y + 1.4, P.pos.z)) this.aggro(z);
                    }

                    // Elite affix: Vampiric regen.
                    if (r.affixes.includes('vampiric') && this.elapsed - r.lastHitAt > 2.5) z.hp = Math.min(z.maxHp, z.hp + z.maxHp * 0.04 * dt);

                    // Healer behaviour.
                    if (r.arch.healer && r.aggro) {
                        r.healCd -= dt;
                        if (r.healCd <= 0) {
                            r.healCd = 4;
                            let healed = 0;
                            for (const o of this.enemiesInRadius(z.pos, 9)) {
                                if (o === z || o.hp >= o.maxHp) continue;
                                o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.14);
                                healed++;
                                BO.FX.spawnTracer(z.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), o.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xef4444, 0.04, 0.3);
                            }
                            if (healed) BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 1.6, 0)), 10, 0xef4444, 2.5, -1, 0.6, 1.2);
                        }
                    }
                }

                if (z.alive && r && !r.aggro) {
                    this._idleTick(z, dt);
                } else {
                    const keep = z.update(dt, this.enemies, callbacks);
                    if (!keep) {
                        z.destroy();
                        this.enemies.splice(i, 1);
                        continue;
                    }
                    // Keep everything inside the arena (blink habits can overshoot).
                    const L = this.layout;
                    z.pos.x = BO.Math.clamp(z.pos.x, -L.hw + 0.8, L.hw - 0.8);
                    z.pos.z = BO.Math.clamp(z.pos.z, -L.hl + 0.8, L.hl - 0.8);
                }
                if (this.isAlive(z)) {
                    targets.push(z);
                }
            }
            BO.Combat.setEntityTargets(targets, BO.RPGItems?.getPropHitMeshes());
        }

        _idleTick(z, dt) {
            const r = z.rpg;
            r.idlePhase += dt;
            z.yaw = r.idleYaw + Math.sin(r.idlePhase * 0.6) * 0.5;
            z.parts.root.position.copy(z.pos);
            z.parts.root.rotation.y = z.yaw;
            BO.CharacterMesh.animateLimbs(z.parts, 0, r.idlePhase * 1.5, 0, 0, 'torso', dt);
        }

        _aiTarget(z) {
            const r = z.rpg;
            if (!r) return null;
            if (r.arch.healer) {
                // Keep ~9 m from the player, drifting toward wounded allies.
                const P = this.P;
                const dx = z.pos.x - P.pos.x, dz = z.pos.z - P.pos.z;
                const d = Math.max(0.1, Math.hypot(dx, dz));
                let tx = z.pos.x, tz = z.pos.z;
                if (d < 9) { tx = z.pos.x + (dx / d) * 4; tz = z.pos.z + (dz / d) * 4; } else {
                    const hurt = this.enemies.find((o) => o !== z && this.isAlive(o) && o.hp < o.maxHp);
                    if (hurt) { tx = hurt.pos.x; tz = hurt.pos.z; }
                }
                const L = this.layout;
                tx = BO.Math.clamp(tx, -L.hw + 2, L.hw - 2);
                tz = BO.Math.clamp(tz, -L.hl + 2, L.hl - 2);
                return { x: tx, y: 0, z: tz, attackRange: 2.2 };
            }
            return null;
        }

        _spawnProjectile(attacker, tx, ty, tz) {
            if (!BO.World.scene) return;
            const hexer = !!(attacker.rpg && attacker.rpg.arch.hexer);
            const col = hexer ? 0xa855f7 : (attacker.attackType === 'acid_spit' ? 0x4ade80 : (attacker.attackType === 'fire_bolt' ? 0xf97316 : 0xc084fc));
            const count = attacker.isBoss ? 3 : 1;
            const origin = new THREE.Vector3(attacker.pos.x, attacker.pos.y + (attacker.isBoss ? 2.0 : 1.4), attacker.pos.z);
            for (let c = 0; c < count; c++) {
                const dir = new THREE.Vector3(tx - origin.x, ty - origin.y, tz - origin.z).normalize();
                if (count > 1) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), (c - 1) * 0.16);
                const mesh = new THREE.Mesh(new THREE.SphereGeometry(attacker.isBoss ? 0.22 : 0.15, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
                mesh.position.copy(origin);
                BO.World.scene.add(mesh);
                this.projectiles.push({ mesh, pos: origin.clone(), vel: dir.multiplyScalar(attacker.isBoss ? 18 : 14), damage: Math.round(attacker.damage * 0.85), life: 3.5, color: col, owner: attacker, hexer });
            }
            BO.Sound.playZombieGroan(attacker.soundProfile, 0.7);
        }

        _updateProjectiles(dt) {
            const P = this.P;
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const ep = this.projectiles[i];
                ep.life -= dt;
                const step = ep.vel.clone().multiplyScalar(dt);
                const len = step.length();
                const hitWall = len > 0 && BO.World.raycastWorld(ep.pos, step.clone().normalize(), len + 0.15);
                ep.pos.add(step);
                ep.mesh.position.copy(ep.pos);
                const blockedByOrbital = BO.RPGItems?.checkProjectileBlock?.(ep);
                const hitPlayer = !blockedByOrbital && P.alive && BO.Math.dist3D(ep.pos.x, ep.pos.y, ep.pos.z, P.pos.x, P.pos.y + 1.1, P.pos.z) < 0.8;
                if (hitPlayer) {
                    P.takeDamage(ep.damage, ep.owner ? ep.owner.pos : ep.pos, false, ep.owner);
                    if (ep.hexer) {
                        this.ability.silenced = 3;
                        BO.Events.emit('hud:toast', { text: 'HEXED — ABILITIES SILENCED FOR 3 S', color: '#a855f7' });
                    }
                    BO.FX.spawnParticles(ep.pos, 8, ep.color, 3.5, 6, 0.4, 1.2);
                }
                if (blockedByOrbital || hitPlayer || hitWall || ep.life <= 0) {
                    if (hitWall) BO.FX.spawnParticles(ep.pos, 6, ep.color, 3, 6, 0.35, 1.0);
                    BO.World.scene.remove(ep.mesh);
                    this.projectiles.splice(i, 1);
                }
            }
        }

        _updatePickups(dt) {
            const P = this.P;
            const target = P.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
            // Once the room is clear (or Magneto owned), every coin flies to the player (no busywork sweeping).
            const magnet = (this.state === 'cleared' || BO.RPGItems?.has?.('magneto')) ? 999 : 5.5;
            for (let i = this.pickups.length - 1; i >= 0; i--) {
                const pk = this.pickups[i];
                if (pk.kind === 'gold') {
                    pk.life -= dt;
                    const d = pk.pos.distanceTo(target);
                    if (d < magnet && P.alive) {
                        const pull = target.clone().sub(pk.pos).normalize().multiplyScalar(Math.max(6, 16 - d * 2));
                        pk.vel.lerp(pull, Math.min(1, dt * 8));
                    } else {
                        pk.vel.y -= 14 * dt;
                    }
                    pk.pos.addScaledVector(pk.vel, dt);
                    const floor = BO.World.getGroundHeight(pk.pos.x, pk.pos.z, pk.pos.y + 0.5) + 0.25;
                    if (pk.pos.y < floor) { pk.pos.y = floor; pk.vel.y = Math.abs(pk.vel.y) * 0.3; pk.vel.x *= 0.7; pk.vel.z *= 0.7; }
                    pk.mesh.position.copy(pk.pos);
                    pk.mesh.rotation.y += dt * 5;
                    if (d < 1.0) {
                        this.run.gold += pk.value;
                        if (BO.RPGUI) BO.RPGUI.floatText(pk.pos, `+${pk.value}g`, '#fde047', 13, 1.2);
                        BO.Sound.playPoints();
                        this._removePickup(pk);
                    } else if (pk.life <= 0 && this.state !== 'cleared') {
                        this._removePickup(pk);
                    }
                } else if (pk.kind === 'item') {
                    pk.core.rotation.y += dt * 1.8;
                    pk.core.position.y = 0.7 + Math.sin(this.elapsed * 3 + i) * 0.08;
                }
            }
        }

        _updateProps(dt) {
            const t = this.elapsed;
            if (this.beacon) {
                this.beacon.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
                this.beacon.beam.material.opacity = this.state === 'cleared' ? 0.22 + Math.sin(t * 4) * 0.06 : 0.06;
            }
            if (this.altar) {
                this.altar.gem.rotation.y += dt * 1.4;
                this.altar.gem.position.y = 1.7 + Math.sin(t * 2) * 0.1;
            }
            for (const o of this.props) {
                if (o.flame) {
                    o.flame.scale.set(1 + Math.sin(t * 13) * 0.08, 1 + Math.sin(t * 9) * 0.15, 1);
                    o.light.intensity = 1.4 + Math.sin(t * 11) * 0.25;
                }
            }
            for (const g of this.gates) {
                if (g.open) g.glow.material.opacity = 0.4 + Math.sin(t * 3 + g.x) * 0.15;
                if (g.open && Number.isFinite(g.timer) && this.state === 'cleared') {
                    g.timer -= dt;
                    if (g.timer <= 0) {
                        g.open = false;
                        g.sealed = true;
                        g.mat.color.set(0x333333);
                        g.mat.opacity = 0.4;
                        g.glow.material.opacity = 0;
                        g.arch.material.emissiveIntensity = 0.05;
                        BO.Events.emit('hud:toast', { text: 'THE HOURGLASS DOOR HAS SEALED', color: g.door.color });
                    } else if (g.timer < 6) {
                        g.glow.material.opacity = Math.sin(t * 18) > 0 ? 0.7 : 0.1; // flicker warning
                    }
                }
            }
            for (let i = this.pools.length - 1; i >= 0; i--) {
                const pool = this.pools[i];
                pool.t -= dt;
                pool.tick -= dt;
                pool.mesh.material.opacity = 0.35 + Math.sin(t * 10 + i) * 0.1;
                if (Math.random() < 0.35) BO.FX.spawnParticles(new THREE.Vector3(pool.x + (Math.random() - 0.5) * pool.r * 1.6, 0.15, pool.z + (Math.random() - 0.5) * pool.r * 1.6), 1, 0xf97316, 1.2, -2, 0.5, 1.0);
                if (pool.tick <= 0) {
                    pool.tick = 0.5;
                    for (const z of this.enemiesInRadius(new THREE.Vector3(pool.x, 0, pool.z), pool.r)) {
                        this.applyPrimer(z, ['burn']);
                        this.dealDamage(z, pool.damage, { source: 'ability', element: 'burn' });
                    }
                }
                if (pool.t <= 0) {
                    BO.World.scene.remove(pool.mesh);
                    this.pools.splice(i, 1);
                }
            }
        }
    }

    BO.RPGMode = new RPGMode();
})(window);
