/* ============================================================================
   BLACKOUT OPS — MEGA TOWER DEFENSE (CASTLE SIEGE)
   - Modes & Difficulties (Easy, Medium, Hard, Hell, All Bosses, Boss Rush, etc.)
   - 16+ Modifiers (All Bosses, Fast Zombies, All Enemies Unlocked, 4x Cost,
     Zombies Heal Each Other, Gun-Toting Zombies %, Magical Zombies, Giant/Tiny,
     Explosive Death, Vampiric, Blood Moon, Low Gravity, Double Gold, etc.)
   - Custom Starting Zombies, Custom Map Size, Custom Wall Barrier HP
   - Two Multi-Height Sniping Towers w/ Jump Pads + Pack-a-Punch + Attachment Station
   - 14 Perk Machines (6 OG + 8 Brand-New, Max 8 Equipped) + Mystery Box + War Gong
   - 20 Unique Rotating Support Deployables (6 rolled each intermission cycle!)
   - Every 60s Quick Zombie Head Direction Radar Hints
   - Full Offline & Online Co-op Support
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const DEFAULT_TD_CONFIG = {
        tdMode: 'standard',        // 'standard' | 'all_bosses' | 'boss_rush' | 'gun_warfare' | 'magic_siege' | 'endless_swarm'
        difficulty: 'medium',      // 'easy' | 'medium' | 'hard' | 'hell'
        startingZombies: 10,       // 3..60
        mapSize: 1.0,              // 0.70 | 1.0 | 1.35 | 1.75
        wallHp: 250,               // 50..2000
        gunZombiePct: 0,           // 0..100
        modifiers: {
            allBosses: false,
            fastZombies: false,
            allEnemiesUnlocked: false,
            cost4x: false,
            zombiesHeal: false,
            magicalZombies: false,
            explosiveDeath: false,
            giantZombies: false,
            tinyZombies: false,
            vampiric: false,
            bloodMoon: false,
            lowGravity: false,
            doubleGold: false,
            headshotsOnly: false,
            infiniteAmmo: false,
            randomLoadoutWave: false,
            megaSplitters: false,
            superJumpZombies: false,
            armoredHorde: false,
            glassCannon: false,
            berserkerWave: false,
            shieldedBosses: false,
            chaosSwarm: false,
            sniperHeaven: false,
            meleeMayhem: false,
            vampirePlayer: false,
            noPerks: false,
            freePerks: false,
            fastReload: false,
            hyperSpeedPlayer: false,
            explosiveHeadshots: false,
            richStart: false,
            noRegen: false,
            nightmareDarkness: false,
            halfZombieHp: false,
            quarterZombieHp: false,
            oneHitMeleeZombies: false,
            noProjectiles: false,
            noProjectilesUntil20: false
        },
        customValues: {
            zombieHpMult: 1.0,
            zombieSpeedMult: 1.0,
            zombieDamageMult: 1.0,
            playerMaxHp: 100,
            startCurrency: 0,
            bossSpawnPct: 2.0,
            maxAliveZombies: 28,
            spawnDelaySec: 0,
            waveSizeMult: 1.0,
            intermissionSec: 30,
            priceMult: 1.0
        },
        disabledEnemies: []
    };

    const DIFFICULTY_SCALES = {
        easy:   { hp: 0.70, spd: 0.85, dmg: 0.70, gold: 1.35, label: 'EASY' },
        medium: { hp: 1.00, spd: 1.00, dmg: 1.00, gold: 1.00, label: 'MEDIUM' },
        hard:   { hp: 1.55, spd: 1.20, dmg: 1.40, gold: 1.15, label: 'HARD' },
        hell:   { hp: 2.65, spd: 1.45, dmg: 2.10, gold: 1.50, label: 'HELL' }
    };

    const CORE_SHOP_ITEMS = [
        { id: 'barrier', name: 'REPAIR / REBUILD BARRIERS', cost: 450, desc: 'Restores +50% HP to damaged Defense Wall Layers (or rebuilds a destroyed layer starting from Layer 3/2/1).' },
        { id: 'turret', name: 'DEPLOY SENTRY TURRET', cost: 850, desc: 'Builds an automated 3D twin-barrel sentry gun that locks onto and shreds approaching zombies!' },
        { id: 'ammo', name: 'MAX AMMO REFILL', cost: 300, desc: 'Completely refills magazine & reserve ammo for all equipped weapons.' },
        { id: 'grenades', name: 'GRENADES & TACTICALS', cost: 280, desc: 'Refills all Frag/C4/Napalm Grenades and Tactical items.' },
        { id: 'rpg', name: 'RPG-7 WARHEAD LAUNCHER', cost: 800, desc: 'Equips the RPG-7 Rocket Launcher (or refills rockets if already owned)!' },
        { id: 'teammate', name: 'TEMPORARY TEAMMATE', cost: 1000, desc: 'Deploys an Allied Marine soldier who fights alongside your castle for 2 full waves!' },
        { id: 'dog', name: 'ARMORED GUARD DOG', cost: 700, desc: 'Summons an armored K9 hound that chases, bites & stuns zombies until its 300 HP runs out!' },
        { id: 'minigun', name: 'M134 DEATH MACHINE (MINIGUN)', cost: 1450, desc: 'Equips the 6-barrel 1,400 RPM rotary Minigun with 200-round drum!' }
    ];

    // 20 BRAND-NEW UNIQUE SUPPORT DEPLOYABLES (6 appear each intermission cycle!)
    const ROTATING_DEPLOYABLES = [
        { id: 'tesla_coil', name: '⚡ TESLA ARC TOWER', cost: 1100, color: '#22d3ee', desc: 'Zaps up to 3 zombies at once with high-voltage chain lightning arcs!' },
        { id: 'flame_turret', name: '🔥 INFERNO FLAME TURRET', cost: 950, color: '#f97316', desc: 'Blasts searing fire cones that ignite and burn approaching hordes over time!' },
        { id: 'cryo_projector', name: '❄ CRYO FREEZE EMITTER', cost: 1050, color: '#38bdf8', desc: 'Fires freezing frost pulses that freeze zombies solid for 2.5x shatter damage!' },
        { id: 'mortar_battery', name: '💣 ARTILLERY MORTAR BATTERY', cost: 1350, color: '#f59e0b', desc: 'Lobs high-arc explosive artillery shells into zombie clusters every 3.2 seconds!' },
        { id: 'laser_beacon', name: '🛰 ORBITAL LASER RELAY', cost: 1650, color: '#e879f9', desc: 'Calls down a devastating orbital sky-beam directly onto the toughest zombie or Boss!' },
        { id: 'sniper_nest', name: '🎯 TOWER AI MARKSMAN', cost: 1200, color: '#60a5fa', desc: 'Stations an elite AI Sniper atop your Sniping Tower landing high-damage headshots across the map!' },
        { id: 'shield_gen', name: '🛡 AEGIS WALL REGENERATOR', cost: 1250, color: '#3b82f6', desc: 'Passively repairs all active Defense Wall Layers (+9 HP/sec) during combat!' },
        { id: 'healing_fountain', name: '✚ COMBAT MED-STATION', cost: 850, color: '#22c55e', desc: 'Glowing medic beacon on the Keep that heals players (+20 HP/sec) and repairs Armor!' },
        { id: 'ammo_fabricator', name: '📦 AUTO-AMMO DISPENSER', cost: 900, color: '#fde047', desc: 'Automatically tops off reserve ammo every 4s for players defending the Keep!' },
        { id: 'landmine_field', name: '💥 PROXIMITY MINE CLUSTER (x6)', cost: 650, color: '#ef4444', desc: 'Scatters 6 armed red proximity mines in front of your walls that blast zombies on contact!' },
        { id: 'barbed_wire', name: '⛓ ELECTRIFIED RAZOR WIRE', cost: 600, color: '#94a3b8', desc: 'Deploys razor-wire killstrips that slow zombies by 55% and shred them as they cross!' },
        { id: 'sawblade_spinner', name: '⚙ WHIRLING SAWBLADE GRINDER', cost: 980, color: '#cbd5e1', desc: 'Spinning steel buzzsaw pylon in the courtyard that slices nearby zombies to ribbons!' },
        { id: 'decoy_holo', name: '👤 HOLOGRAPHIC DECOY EMITTER', cost: 750, color: '#a855f7', desc: 'Projects a taunting hologram soldier (650 HP) that lures zombies away from your walls!' },
        { id: 'attack_drone', name: '🚁 AUTONOMOUS HUNTER DRONE', cost: 1400, color: '#38bdf8', desc: 'Flying quad-rotor drone that orbits overhead and machine-guns zombies from the sky!' },
        { id: 'gravity_well', name: '🌀 SINGULARITY GRAVITY TRAP', cost: 1300, color: '#c084fc', desc: 'Periodically yanks zombies inward into a purple singularity vortex and crushes them!' },
        { id: 'acid_sprayer', name: '☣ CORROSIVE ACID SPRAYER', cost: 1000, color: '#84cc16', desc: 'Coats zombies in corrosive acid (+45% damage taken from all sources) and melts HP!' },
        { id: 'gold_miner', name: '⛏ AETHER GOLD EXTRACTOR', cost: 950, color: '#facc15', desc: 'Extracts +160 passive Gold every 11 seconds during combat waves!' },
        { id: 'emp_tower', name: '📡 EMP DISRUPTOR PYLON', cost: 1150, color: '#06b6d4', desc: 'Unleashes periodic EMP shockwaves that stun zombies and jam gun/magic attacks!' },
        { id: 'combat_mech', name: '🤖 MINI-JUGGERNAUT MECH BOT', cost: 1850, color: '#f43f5e', desc: 'Heavy armored 3D walking mech with dual miniguns that patrols the courtyard!' },
        { id: 'airstrike_beacon', name: '✈ A-10 CARPET BOMB FLARE', cost: 1100, color: '#fb923c', desc: 'Immediate tactical airstrike dropping 6 massive explosive bombs across the zombie lanes!' }
    ];

    class TowerDefenseMode {
        constructor() {
            this.active = false;
            this.mapId = 'td_castle_1';
            this.config = BO.Math.deepClone(DEFAULT_TD_CONFIG);
            this.modifiers = BO.Math.deepClone(DEFAULT_TD_CONFIG.modifiers);

            this.wave = 1;
            this.gold = 650;
            this.kills = 0;
            this.headshots = 0;
            this.elapsed = 0;

            this.heartHp = 100;
            this.heartMaxHp = 100;
            this.heartObj = null;

            this.layers = [];
            this.zombies = [];
            this.nextZombieId = 1;

            this.turrets = [];
            this.dogs = [];
            this.allies = [];
            this.deployables = [];
            this.enemyProjectiles = [];
            this.supplyDrops = [];
            this.shopkeeperObj = null;

            this.shopWeapons = [];
            this.cycleDeployables = []; // 6 rotating unique deployables rolled each cycle!
            this.state = 'intermission';
            this.intermissionTimer = 30.0;
            this.waveTotal = 0;
            this.remainingToSpawn = 0;
            this.spawnCooldown = 0;
            this.firstWaveStarted = false;
            this.ended = false;

            // Every 60s Quick Zombie Head Direction Hint
            this.dirHintCooldown = 60.0;
            this.dirHintActiveTimer = 0;

            // Castle Overdrive War Gong
            this.overdriveTimer = 0;
            this.overdriveCooldown = 0;

            this.activePrompt = null;
            this.unlockedPoolCount = 2;
            this.unlockedBossCount = 0;
            this.disabledEnemySet = new Set();

            BO.Events.on('zombie:split', (ev) => {
                if (!this.active || !ev || !ev.parent) return;
                this._spawnSplitChildren(ev.parent, ev.count || 2);
            });
        }

        _spawnSplitChildren(parent, count) {
            if (!BO.World.scene) return;
            BO.FX.spawnParticles(parent.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 14, 0x22c55e, 5.0, 4, 0.5, 1.3);
            for (let i = 0; i < count; i++) {
                const ang = (i / count) * Math.PI * 2;
                const child = new BO.ZombieEntity({
                    id: this.nextZombieId++,
                    spec: parent.spec,
                    round: this.wave,
                    hp: Math.max(20, Math.round(parent.maxHp * 0.40)),
                    speed: Math.min(8.8, parent.speed * 1.24),
                    damage: Math.max(8, Math.round(parent.damage * 0.65)),
                    x: parent.pos.x + Math.cos(ang) * 0.9,
                    y: parent.pos.y,
                    z: parent.pos.z + Math.sin(ang) * 0.9,
                    sizeMult: Math.max(0.42, (parent.sizeMult || 1.0) * 0.64),
                    isSplitChild: true,
                    hasGun: parent.hasGun,
                    isMagical: parent.isMagical
                });
                this.zombies.push(child);
            }
        }

        getDefaultConfig() {
            return BO.Math.deepClone(DEFAULT_TD_CONFIG);
        }

        getCost(baseCost) {
            const pm = (this.config && this.config.customValues && Number(this.config.customValues.priceMult)) || 1.0;
            const m4 = (this.modifiers && this.modifiers.cost4x) ? 4 : 1;
            return Math.max(0, Math.round(baseCost * m4 * pm));
        }

        getShopItems() {
            return CORE_SHOP_ITEMS.map((it) => Object.assign({}, it, { cost: this.getCost(it.cost) }));
        }

        getCycleDeployables() {
            return this.cycleDeployables.map((it) => Object.assign({}, it, { cost: this.getCost(it.cost) }));
        }

        rollShopCycle() {
            this.rollFiveShopWeapons();
            // Pick 6 unique deployables from the 20-item pool for this intermission cycle!
            const pool = ROTATING_DEPLOYABLES.slice();
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
            }
            this.cycleDeployables = pool.slice(0, 6).map((d) => Object.assign({}, d, { boughtThisCycle: false }));
        }

        rollFiveShopWeapons() {
            const P = BO.WeaponsData.POOLS;
            const offers = [];
            for (let i = 0; i < 5; i++) {
                const r = Math.random() * 100;
                let wId, cost, badge, color;
                if (r < 60) {
                    wId = BO.Math.pick(P.commonGun); cost = 550; badge = 'COMMON (60%)'; color = '#cbd5e1';
                } else if (r < 70) {
                    wId = BO.Math.pick(P.commonMelee); cost = 400; badge = 'COMMON MELEE (10%)'; color = '#a3e635';
                } else if (r < 75) {
                    wId = BO.Math.pick(P.uncommonMelee); cost = 700; badge = 'UNCOMMON MELEE (5%)'; color = '#f59e0b';
                } else if (r < 90) {
                    wId = BO.Math.pick(P.uncommonGun); cost = 900; badge = 'UNCOMMON (15%)'; color = '#38bdf8';
                } else if (r < 95) {
                    const freePool = P.commonGun.concat(P.uncommonGun, P.commonMelee, P.uncommonMelee);
                    wId = BO.Math.pick(freePool); cost = 0; badge = 'FREE WEAPON (5%)'; color = '#22c55e';
                } else {
                    wId = BO.Math.pick(P.magic); cost = 1500; badge = 'MAGIC WEAPON (5%)'; color = '#c084fc';
                }
                const spec = BO.WeaponsData.get(wId);
                offers.push({ slotIndex: i, weaponId: wId, spec, cost: this.getCost(cost), badge, color, sold: false });
            }
            this.shopWeapons = offers;
            return offers;
        }

        start(opts) {
            this.active = true;
            this.mapId = opts.mapId || 'td_castle_1';
            const merged = Object.assign({}, DEFAULT_TD_CONFIG, opts.tdConfig || {});
            merged.modifiers = Object.assign({}, DEFAULT_TD_CONFIG.modifiers, (opts.tdConfig && opts.tdConfig.modifiers) || {});
            merged.customValues = Object.assign({}, DEFAULT_TD_CONFIG.customValues, (opts.tdConfig && opts.tdConfig.customValues) || {});
            // Apply mode presets automatically on top of modifiers
            if (merged.tdMode === 'all_bosses') merged.modifiers.allBosses = true;
            if (merged.tdMode === 'gun_warfare') merged.gunZombiePct = Math.max(merged.gunZombiePct || 0, 75);
            if (merged.tdMode === 'magic_siege') merged.modifiers.magicalZombies = true;
            if (merged.tdMode === 'endless_swarm') {
                merged.modifiers.allEnemiesUnlocked = true;
                merged.modifiers.fastZombies = true;
                merged.startingZombies = Math.max(merged.startingZombies || 10, 22);
            }

            this.config = merged;
            this.modifiers = merged.modifiers;

            this.wave = 1;
            const diffInfo = DIFFICULTY_SCALES[this.config.difficulty] || DIFFICULTY_SCALES.medium;
            const cv = this.config.customValues || DEFAULT_TD_CONFIG.customValues;
            const customStartGold = Number(cv.startCurrency) || 0;
            const baseGold = customStartGold > 0
                ? customStartGold
                : (this.modifiers.richStart ? 10000 : ((this.config.tdMode === 'all_bosses' || this.config.tdMode === 'boss_rush') ? 2400 : 850));
            this.gold = Math.round(baseGold * (this.modifiers.doubleGold ? 2 : 1));
            this.kills = 0;

            // Progressive Enemy Pool Initialization:
            // Easy/Normal starts with 2, Hard starts with 3, Hell starts with 5 (or ALL 70 + 10 Bosses if unlocked from start!)
            this.disabledEnemySet = new Set(Array.isArray(this.config.disabledEnemies) ? this.config.disabledEnemies : []);
            if (this.modifiers.allEnemiesUnlocked) {
                this.unlockedPoolCount = BO.ZombiesData.ORDERED_PROGRESSION.length;
                this.unlockedBossCount = BO.ZombiesData.ORDERED_BOSSES.length;
            } else {
                this.unlockedPoolCount = this.config.difficulty === 'hell' ? 5 : (this.config.difficulty === 'hard' ? 3 : 2);
                this.unlockedBossCount = (this.config.tdMode === 'all_bosses' || this.config.tdMode === 'boss_rush') ? 1 : 0;
            }
            this.headshots = 0;
            this.elapsed = 0;
            this.ended = false;
            this.firstWaveStarted = false;
            this.activeBallistas = [];
            this.towerTurretMap = {};

            this.heartMaxHp = 100;
            this.heartHp = 100;

            this.zombies = [];
            this.turrets = [];
            this.dogs = [];
            this.allies = [];
            this.deployables = [];
            this.enemyProjectiles = [];
            this.supplyDrops = [];
            this.layers = [];

            this.dirHintCooldown = 60.0;
            this.dirHintActiveTimer = 0;
            this.overdriveTimer = 0;
            this.overdriveCooldown = 0;
            this.activePrompt = null;

            const scene = BO.World.build(this.mapId, {
                mapSize: this.config.mapSize || 1.0,
                bloodMoon: !!this.modifiers.bloodMoon
            });
            if (this.modifiers.nightmareDarkness && scene) {
                scene.fog = new THREE.FogExp2(0x020308, 0.032);
                scene.background = new THREE.Color(0x020308);
            }
            const map = BO.World.mapData;
            const loadout = BO.Loadout.getActiveClass();

            BO.Player.initForMatch('td', map.playerSpawn, loadout, false);
            const pMaxHp = BO.Math.clamp(Number((this.config.customValues || {}).playerMaxHp) || 100, 1, 5000);
            if (pMaxHp !== 100) {
                BO.Player.maxHp = pMaxHp;
                BO.Player.hp = pMaxHp;
            }
            if (this.modifiers.glassCannon) {
                BO.Player.maxHp = Math.min(BO.Player.maxHp, 50);
                BO.Player.hp = Math.min(BO.Player.hp, 50);
            }
            BO.Combat.reset(opts.camera);
            BO.Combat.onHitEnemy = (ent, dmg, hitbox, dist, w, pt, dir) => this._onBulletHit(ent, dmg, hitbox, w, pt);
            BO.Combat.onExplodeAt = (pos, rad, dmg, owner, isFlash, stunDur, wid) => this._onExplode(pos, rad, dmg, isFlash, stunDur, wid);
            BO.Combat.onActivateKillstreak = null;

            this._buildCastleStructures(scene, map);
            this.rollShopCycle();

            this.state = 'intermission';
            this.intermissionTimer = 12.0;
            BO.Sound.startMusic('zombies');
            BO.Events.emit('hud:banner', {
                title: `${map.name} [${diffInfo.label}]`,
                sub: '2 SNIPER TOWERS • 14 PERKS (MAX 8) • PACK-A-PUNCH • ATTACHMENTS • [T] SHOP • [N] SKIP',
                color: '#38bdf8'
            });
            return scene;
        }

        stop() {
            this.active = false;
            for (const z of this.zombies) z.destroy();
            this.zombies = [];
            this.turrets = [];
            this.dogs = [];
            this.allies = [];
            this.deployables = [];
            for (const ep of this.enemyProjectiles) {
                if (ep.mesh && BO.World.scene) BO.World.scene.remove(ep.mesh);
            }
            this.enemyProjectiles = [];
            for (const sd of this.supplyDrops) {
                if (sd.mesh && BO.World.scene) BO.World.scene.remove(sd.mesh);
            }
            this.supplyDrops = [];
            this.layers = [];
        }

        _buildCastleStructures(scene, map) {
            // 1. Glowing 100 HP Castle Heart Crystal
            const ch = map.castleHeart || { x: 0, y: 5.4, z: 16 };
            const hg = new THREE.Group();
            hg.position.set(ch.x, ch.y, ch.z);
            const ped = new THREE.Mesh(
                new THREE.CylinderGeometry(1.1, 1.35, 0.7, 12),
                BO.Textures.getWorldMaterial('castle_battlement', 2, 1)
            );
            ped.position.y = 0.35;
            const crystal = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.75, 1),
                new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
            );
            crystal.position.y = 1.65;
            const halo = new THREE.Mesh(
                new THREE.TorusGeometry(1.05, 0.06, 8, 24),
                new THREE.MeshBasicMaterial({ color: 0xfde047 })
            );
            halo.rotation.x = Math.PI * 0.5;
            halo.position.y = 1.65;
            hg.add(ped, crystal, halo);
            scene.add(hg);
            this.heartObj = { group: hg, crystal, halo, x: ch.x, y: ch.y, z: ch.z };

            // 2. 3D Shopkeeper NPC & Stall on Castle Top
            const sk = map.shopkeeperPos || { x: 5.5, y: 5.4, z: 12.5, rotY: -Math.PI * 0.4 };
            const shopBuilt = BO.CharacterMesh.buildShopkeeper();
            shopBuilt.root.position.set(sk.x, sk.y, sk.z);
            shopBuilt.root.rotation.y = sk.rotY || 0;
            scene.add(shopBuilt.root);
            this.shopkeeperObj = { x: sk.x, y: sk.y, z: sk.z, mesh: shopBuilt.root };

            // 3. Three Sequential SEE-THROUGH & SHOOT-THROUGH Defense Wall Layers (Custom Wall HP!)
            const customWallHp = BO.Math.clamp(Number(this.config.wallHp) || 250, 50, 2000);
            const LAYER_COLORS = { 1: 0x22c55e, 2: 0x38bdf8, 3: 0xf59e0b };
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.72, roughness: 0.35 });
            const defs = map.defenseLayers || [];
            this.layers = defs.map((dl) => {
                const baseHex = LAYER_COLORS[dl.layer] || 0x38bdf8;
                const segObjs = [];
                for (const s of dl.segments) {
                    const segGroup = new THREE.Group();
                    const paneMat = new THREE.MeshStandardMaterial({
                        color: baseHex, emissive: baseHex, emissiveIntensity: 0.35,
                        transparent: true, opacity: 0.24, roughness: 0.12, metalness: 0.15,
                        depthWrite: false, side: THREE.DoubleSide
                    });
                    const pane = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h - 0.36, Math.min(s.d, 0.32)), paneMat);
                    pane.position.set(s.x, s.y + s.h * 0.5, s.z);
                    pane.renderOrder = 2;
                    segGroup.add(pane);

                    const botRail = new THREE.Mesh(new THREE.BoxGeometry(s.w, 0.24, Math.min(s.d, 0.65)), frameMat);
                    botRail.position.set(s.x, s.y + 0.12, s.z);
                    const topRail = new THREE.Mesh(new THREE.BoxGeometry(s.w, 0.20, Math.min(s.d, 0.65)), frameMat);
                    topRail.position.set(s.x, s.y + s.h - 0.10, s.z);
                    const glowStrip = new THREE.Mesh(
                        new THREE.BoxGeometry(s.w, 0.12, Math.min(s.d, 0.45)),
                        new THREE.MeshBasicMaterial({ color: baseHex })
                    );
                    glowStrip.position.set(s.x, s.y + s.h + 0.06, s.z);
                    segGroup.add(botRail, topRail, glowStrip);

                    const longX = s.w >= s.d;
                    const span = longX ? s.w : s.d;
                    const postCount = Math.max(2, Math.floor(span / 10) + 1);
                    const postGeo = new THREE.BoxGeometry(0.28, s.h, 0.28);
                    for (let p = 0; p < postCount; p++) {
                        const t = postCount === 1 ? 0.5 : (p / (postCount - 1)) - 0.5;
                        const post = new THREE.Mesh(postGeo, frameMat);
                        post.position.set(
                            s.x + (longX ? t * (span - 0.4) : 0),
                            s.y + s.h * 0.5,
                            s.z + (longX ? 0 : t * (span - 0.4))
                        );
                        segGroup.add(post);
                    }
                    scene.add(segGroup);

                    const col = {
                        minX: s.x - s.w * 0.5, maxX: s.x + s.w * 0.5,
                        minY: s.y, maxY: s.y + s.h,
                        minZ: s.z - s.d * 0.5, maxZ: s.z + s.d * 0.5,
                        enemiesOnly: true, active: true
                    };
                    BO.World.colliders.push(col);

                    segObjs.push({
                        x: s.x, y: s.y, z: s.z, w: s.w, h: s.h, d: s.d,
                        mesh: segGroup, glowStrip, mat: paneMat, baseHex, collider: col
                    });
                }
                return {
                    layer: dl.layer, name: dl.name,
                    hp: customWallHp, maxHp: customWallHp,
                    active: true, segments: segObjs
                };
            });
        }

        getActiveBlockingLayer() {
            for (let i = 0; i < this.layers.length; i++) {
                if (this.layers[i].active && this.layers[i].hp > 0) return this.layers[i];
            }
            return null;
        }

        _syncLayerVisual(layerObj) {
            const alive = layerObj.hp > 0;
            layerObj.active = alive;
            const hpRatio = BO.Math.clamp(layerObj.hp / Math.max(1, layerObj.maxHp), 0, 1);
            for (const s of layerObj.segments) {
                s.mesh.visible = alive;
                s.collider.active = alive;
                if (alive) {
                    const baseCol = new THREE.Color(s.baseHex || 0x38bdf8);
                    const dmgCol = new THREE.Color(0xef4444);
                    const blended = dmgCol.clone().lerp(baseCol, hpRatio);
                    s.mat.color.copy(blended);
                    s.mat.emissive.copy(blended);
                    s.mat.opacity = 0.18 + hpRatio * 0.10;
                    if (s.glowStrip && s.glowStrip.material) s.glowStrip.material.color.copy(blended);
                }
            }
        }

        damageDefenseLayer(layerObj, dmg) {
            if (!layerObj || !layerObj.active || layerObj.hp <= 0) return;
            layerObj.hp = Math.max(0, layerObj.hp - dmg);
            BO.Sound.playWallHit();
            if (layerObj.hp <= 0) {
                this._syncLayerVisual(layerObj);
                BO.Sound.playWallBreak();
                const first = layerObj.segments[0];
                if (first) BO.FX.spawnExplosion(new THREE.Vector3(first.x, first.y + 1.8, first.z), 4.5, 0xf97316);
                BO.Events.emit('hud:banner', {
                    title: `${layerObj.name} BREACHED!`,
                    sub: layerObj.layer < 3 ? `ENEMIES ADVANCING TO LAYER ${layerObj.layer + 1}!` : 'STAIRS EXPOSED! DEFEND THE 100 HP CASTLE HEART!',
                    color: '#ef4444'
                });
            } else {
                this._syncLayerVisual(layerObj);
            }
        }

        damageHeart(dmg) {
            if (this.ended) return;
            this.heartHp = Math.max(0, this.heartHp - dmg);
            BO.Sound.playWallHit();
            if (this.heartObj) {
                BO.FX.spawnParticles(new THREE.Vector3(this.heartObj.x, this.heartObj.y + 1.5, this.heartObj.z), 8, 0xef4444, 4, 2, 0.4, 1.2);
            }
            if (this.heartHp <= 0) {
                this._endMatch(false, 'CASTLE HEART DESTROYED');
            }
        }

        _addGold(baseAmt) {
            const diffInfo = DIFFICULTY_SCALES[this.config.difficulty] || DIFFICULTY_SCALES.medium;
            const vultureMult = (BO.Player && BO.Player.zombiePerks.has('vulture_aid')) ? 1.35 : 1.0;
            const dblMult = this.modifiers.doubleGold ? 2.0 : 1.0;
            this.gold += Math.round(baseAmt * diffInfo.gold * vultureMult * dblMult);
        }

        _pickBossForWave(wave) {
            const allBosses = Object.values(BO.ZombiesData.BOSSES_BY_ROUND).filter(Boolean);
            if (this.modifiers.allBosses || this.modifiers.allEnemiesUnlocked) {
                return BO.Math.pick(allBosses);
            }
            const pool = [BO.ZombiesData.BOSSES_BY_ROUND[5]];
            if (wave >= 14) pool.push(BO.ZombiesData.BOSSES_BY_ROUND[10]);
            if (wave >= 18) pool.push(BO.ZombiesData.BOSSES_BY_ROUND[20]);
            if (wave >= 24) pool.push(BO.ZombiesData.BOSSES_BY_ROUND[25]);
            if (wave >= 30) pool.push(BO.ZombiesData.BOSSES_BY_ROUND[50]);
            return BO.Math.pick(pool.filter(Boolean));
        }

        _beginNextWave() {
            if (this.firstWaveStarted) {
                this.wave++;
                // Each wave completed has a 50% chance to add 1 new enemy type to the pool!
                if (!this.modifiers.allEnemiesUnlocked && this.unlockedPoolCount < BO.ZombiesData.ORDERED_PROGRESSION.length) {
                    if (Math.random() < 0.50) {
                        const added = BO.ZombiesData.ORDERED_PROGRESSION[this.unlockedPoolCount];
                        this.unlockedPoolCount++;
                        if (added) {
                            BO.Events.emit('hud:toast', {
                                text: `🔓 50% ROLL HIT! NEW ENEMY ENTERED POOL: ${added.name.toUpperCase()} (${added.rarity.toUpperCase()})!`,
                                color: '#f5a623'
                            });
                        }
                    }
                }
                // 1 Boss enemy enters the enemy pool every 5 waves!
                if (!this.modifiers.allEnemiesUnlocked && this.wave % 5 === 0 && this.unlockedBossCount < BO.ZombiesData.ORDERED_BOSSES.length) {
                    const addedBoss = BO.ZombiesData.ORDERED_BOSSES[this.unlockedBossCount];
                    this.unlockedBossCount++;
                    if (addedBoss) {
                        BO.Events.emit('hud:toast', {
                            text: `⚠ BOSS ENTERED ENEMY POOL (WAVE ${this.wave}): ${addedBoss.name}!`,
                            color: '#ef4444'
                        });
                    }
                }
            }
            this.firstWaveStarted = true;

            const startBase = BO.Math.clamp(Number(this.config.startingZombies) || 10, 3, 200);
            const swarmMult = (this.modifiers.chaosSwarm ? 2.0 : 1.0) * (Number((this.config.customValues || {}).waveSizeMult) || 1.0);
            this.waveTotal = Math.max(1, Math.round((startBase + (this.wave - 1) * 4.2) * swarmMult));
            if (this.modifiers.allBosses) {
                this.waveTotal = Math.max(2, Math.round(startBase * 0.35 + (this.wave - 1) * 1.4));
            }
            this.remainingToSpawn = this.waveTotal;
            this.spawnCooldown = 0.55;
            this.state = 'spawning';

            // Random Loadout modifier: swap weapon every wave for chaos!
            if (this.modifiers.randomLoadoutWave && this.wave > 1) {
                const randW = BO.Math.pick(BO.WeaponsData.ORDER);
                BO.Player.giveWeapon(randW, false, false);
                BO.Events.emit('hud:toast', { text: `🎲 RANDOM LOADOUT WAVE: ${BO.WeaponsData.get(randW).name}!`, color: '#c084fc' });
            }

            // Parachute Supply Drop every 3 waves!
            if (this.wave > 1 && this.wave % 3 === 0) {
                this._spawnSupplyDrop();
            }

            // Decay Temporary Teammates
            for (let i = this.allies.length - 1; i >= 0; i--) {
                this.allies[i].wavesLeft--;
                if (this.allies[i].wavesLeft <= 0) {
                    if (BO.World.scene && this.allies[i].parts?.root) BO.World.scene.remove(this.allies[i].parts.root);
                    this.allies.splice(i, 1);
                }
            }

            // Guaranteed Boss Spawns only in Boss Rush mode (otherwise governed by 2% + 0.5%/round after Wave 10!)
            if (this.config.tdMode === 'boss_rush' && !this.modifiers.allBosses) {
                const count = this.wave >= 20 ? 2 : 1;
                for (let c = 0; c < count; c++) this._spawnBossZombie();
            }

            const newUnlock = !this.modifiers.allEnemiesUnlocked ? BO.ZombiesData.getNewlyUnlockedForRound(this.wave) : null;
            BO.Sound.playRoundStart(this.wave, false);
            BO.Events.emit('hud:banner', {
                title: `WAVE ${this.wave} INCOMING`,
                sub: newUnlock ? `NEW ENEMY UNLOCKED: ${newUnlock.name}!` : `${this.waveTotal} HOSTILES APPROACHING`,
                color: '#dc2626'
            });
        }

        _buildZombieOpts(spec, sp, isBoss) {
            const diff = DIFFICULTY_SCALES[this.config.difficulty] || DIFFICULTY_SCALES.medium;
            const fastMult = this.modifiers.fastZombies ? 1.65 : 1.0;
            const sizeMult = this.modifiers.giantZombies ? 1.65 : (this.modifiers.tinyZombies ? 0.62 : 1.0);
            const sizeHpMult = this.modifiers.giantZombies ? 1.75 : (this.modifiers.tinyZombies ? 0.72 : 1.0);
            const sizeSpdMult = this.modifiers.tinyZombies ? 1.40 : (this.modifiers.giantZombies ? 0.85 : 1.0);
            const gunChance = BO.Math.clamp(Number(this.config.gunZombiePct) || 0, 0, 100) / 100;

            const baseHp = isBoss
                ? Math.round(spec.hp * (0.55 + this.wave * 0.06))
                : Math.round(spec.hp * (0.85 + this.wave * 0.14));
            const cv = this.config.customValues || DEFAULT_TD_CONFIG.customValues;
            const glassHp = this.modifiers.glassCannon ? 0.5 : 1.0;
            const swarmHp = this.modifiers.chaosSwarm ? 0.55 : 1.0;
            const customHpMult = (this.modifiers.quarterZombieHp ? 0.25 : (this.modifiers.halfZombieHp ? 0.5 : 1.0)) * (Number(cv.zombieHpMult) || 1.0);
            const customSpdMult = Number(cv.zombieSpeedMult) || 1.0;
            const customDmgMult = Number(cv.zombieDamageMult) || 1.0;
            const glassDmg = this.modifiers.glassCannon ? 3.0 : 1.0;
            const projBlocked = !!(this.modifiers.noProjectiles || (this.modifiers.noProjectilesUntil20 && this.wave < 20));
            const finalDmg = this.modifiers.oneHitMeleeZombies ? 99999 : Math.max(1, Math.round(spec.attack * diff.dmg * glassDmg * customDmgMult));

            return {
                id: this.nextZombieId++,
                spec,
                round: this.wave,
                hp: Math.max(5, Math.round(baseHp * diff.hp * sizeHpMult * glassHp * swarmHp * customHpMult)),
                speed: Math.min(12.0, spec.speed * (1 + Math.min(0.35, this.wave * 0.015)) * diff.spd * fastMult * sizeSpdMult * customSpdMult),
                damage: finalDmg,
                x: sp.x + BO.Math.randRange(-1.4, 1.4),
                y: sp.y || 0,
                z: sp.z + BO.Math.randRange(-1.4, 1.4),
                hasGun: !projBlocked && (Math.random() < gunChance),
                isMagical: !projBlocked && !!(this.modifiers.magicalZombies || spec.isMagical),
                explosiveDeath: !!this.modifiers.explosiveDeath,
                splitCount: this.modifiers.megaSplitters ? Math.max(2, spec.splitCount || 0) : (spec.splitCount || 0),
                jumpChance: this.modifiers.superJumpZombies ? Math.max(0.55, spec.jumpChance || 0) : (spec.jumpChance || 0),
                sizeMult
            };
        }

        _spawnBossZombie() {
            const spawners = BO.World.mapData.spawners || [{ x: 0, y: 0, z: -26 }];
            const sp = BO.Math.pick(spawners);
            const unlockedB = BO.ZombiesData.ORDERED_BOSSES.slice(0, Math.max(1, this.unlockedBossCount));
            const enabledB = unlockedB.filter((b) => !this.disabledEnemySet.has(b.id));
            const bossSpec = BO.Math.pick(enabledB.length > 0 ? enabledB : unlockedB);
            if (!bossSpec) return;
            const ent = new BO.ZombieEntity(this._buildZombieOpts(bossSpec, sp, true));
            if (this.modifiers.armoredHorde) ent.defense = Math.min(0.70, (ent.defense || 0) + 0.35);
            this.zombies.push(ent);
            BO.Sound.playBossIntro();
            BO.Events.emit('hud:toast', { text: `⚠ BOSS DEPLOYED: ${bossSpec.name}!`, color: '#f87171' });
        }

        _spawnWaveZombie() {
            const spawners = BO.World.mapData.spawners || [{ x: 0, y: 0, z: -26 }];
            const sp = BO.Math.pick(spawners);
            if (this.modifiers.allBosses) {
                const unlockedB = BO.ZombiesData.ORDERED_BOSSES.slice(0, Math.max(1, this.unlockedBossCount || BO.ZombiesData.ORDERED_BOSSES.length));
                const enabledB = unlockedB.filter((b) => !this.disabledEnemySet.has(b.id));
                const bossSpec = BO.Math.pick(enabledB.length > 0 ? enabledB : unlockedB);
                if (bossSpec) {
                    const ent = new BO.ZombieEntity(this._buildZombieOpts(bossSpec, sp, true));
                    if (this.modifiers.armoredHorde) ent.defense = Math.min(0.70, (ent.defense || 0) + 0.35);
                    this.zombies.push(ent);
                    return;
                }
            }
            const unlockedEnemies = BO.ZombiesData.ORDERED_PROGRESSION.slice(0, Math.max(1, this.unlockedPoolCount));
            const unlockedBosses = BO.ZombiesData.ORDERED_BOSSES.slice(0, this.unlockedBossCount);
            const baseBossPct = Number((this.config.customValues || {}).bossSpawnPct ?? 2.0);
            const effBossPct = baseBossPct + (this.wave > 10 ? (this.wave - 10) * 0.5 : 0);
            const spec = BO.ZombiesData.pickFromTieredPool(unlockedEnemies, unlockedBosses, this.disabledEnemySet, effBossPct);
            const ent = new BO.ZombieEntity(this._buildZombieOpts(spec, sp, !!spec.isBoss));
            if (this.modifiers.armoredHorde) ent.defense = Math.min(0.70, (ent.defense || 0) + 0.35);
            this.zombies.push(ent);
        }

        _spawnSupplyDrop() {
            if (!BO.World.scene) return;
            const isAll360 = BO.World.mapData.castleSetup === 'all';
            const dx = isAll360 ? BO.Math.randRange(-4.5, 4.5) : BO.Math.randRange(-8, 8);
            const dz = isAll360 ? BO.Math.randRange(-4.5, 4.5) : BO.Math.randRange(10, 18);
            const crate = new THREE.Mesh(
                new THREE.BoxGeometry(1.1, 1.1, 1.1),
                new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.45, roughness: 0.4 })
            );
            crate.position.set(dx, 24, dz);
            BO.World.scene.add(crate);
            this.supplyDrops.push({ mesh: crate, x: dx, y: 24, targetY: 5.95, z: dz, life: 45 });
            BO.Events.emit('hud:toast', { text: '📦 GOLDEN SUPPLY CRATE DROPPING ON CASTLE KEEP!', color: '#fde047' });
        }

        skipIntermission() {
            if (!this.active || this.state !== 'intermission') return;
            BO.Sound.playUIClick();
            if (BO.Net && BO.Net.active && !BO.Net.isHost) {
                BO.Net.sendToHost({ type: 'td_action', action: 'skip_wait' });
                return;
            }
            this._beginNextWave();
        }

        canOpenShop() {
            return this.active && this.state === 'intermission';
        }

        buyShopWeapon(slotIndex) {
            if (this.state !== 'intermission') {
                BO.Events.emit('hud:toast', { text: 'SHOP IS ONLY OPEN BETWEEN WAVES!', color: '#ef4444' });
                return false;
            }
            const offer = this.shopWeapons[slotIndex];
            if (!offer || offer.sold) return false;
            if (this.gold < offer.cost) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: `NEED ${offer.cost} GOLD!`, color: '#ef4444' });
                return false;
            }
            this.gold -= offer.cost;
            offer.sold = true;
            BO.Player.giveWeapon(offer.weaponId, false, false);
            BO.Sound.playShopBuy();
            BO.Events.emit('hud:toast', { text: `EQUIPPED ${offer.spec.name}!`, color: offer.color });
            return true;
        }

        buyDeployable(depId) {
            if (this.state !== 'intermission') {
                BO.Events.emit('hud:toast', { text: 'SHOP IS ONLY OPEN BETWEEN WAVES!', color: '#ef4444' });
                return false;
            }
            const def = this.cycleDeployables.find((d) => d.id === depId) || ROTATING_DEPLOYABLES.find((d) => d.id === depId);
            if (!def) return false;
            const cost = this.getCost(def.cost);
            if (this.gold < cost) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: `NEED ${cost} GOLD FOR ${def.name}!`, color: '#ef4444' });
                return false;
            }
            this.gold -= cost;
            def.boughtThisCycle = true;
            this._spawnDeployableEntity(depId);
            BO.Sound.playShopBuy();
            BO.Events.emit('hud:toast', { text: `DEPLOYED: ${def.name}!`, color: def.color || '#38bdf8' });
            if (BO.Net && BO.Net.active && !BO.Net.isHost) {
                BO.Net.sendToHost({ type: 'td_action', action: 'deployable', depId });
            }
            return true;
        }

        _spawnDeployableEntity(depId) {
            if (!BO.World.scene) return;
            const isAll360 = BO.World.mapData.castleSetup === 'all';
            const keepY = 5.4;
            const idx = this.deployables.length;

            // Immediate Airstrike Flare!
            if (depId === 'airstrike_beacon') {
                BO.Sound.playNukeSiren();
                BO.Events.emit('hud:banner', { title: '✈ A-10 CARPET BOMB INBOUND!', sub: '6 TACTICAL WARHEADS STRIKING ZOMBIE LANES!', color: '#fb923c' });
                for (let b = 0; b < 6; b++) {
                    setTimeout(() => {
                        if (!this.active) return;
                        const bx = BO.Math.randRange(-28, 28);
                        const bz = isAll360 ? BO.Math.randRange(-55, 55) : BO.Math.randRange(-85, -18);
                        const pt = new THREE.Vector3(bx, 0.5, bz);
                        BO.FX.spawnExplosion(pt, 12.0, 0xf97316);
                        BO.Sound.playExplosion(0.95);
                        this._onExplode(pt, 14.0, 480, false, 0, 'airstrike');
                    }, b * 360);
                }
                return;
            }

            // Pick smart 3D placement based on deployable category
            let px = 0, py = 0, pz = -18;
            if (depId === 'healing_fountain' || depId === 'ammo_fabricator' || depId === 'shield_gen' || depId === 'gold_miner') {
                px = isAll360 ? ((idx % 2 === 0 ? -1 : 1) * 3.5) : (-8 + (idx % 5) * 4);
                py = keepY;
                pz = isAll360 ? 0 : 15.5;
            } else if (depId === 'sniper_nest') {
                const side = idx % 2 === 0 ? -1 : 1;
                px = isAll360 ? side * 14.5 : side * (BO.World.mapData.castleSetup === 'front' ? 19.5 : 14.2);
                py = 17.4;
                pz = isAll360 ? 0 : 14.0;
            } else if (depId === 'attack_drone') {
                px = 0; py = 12.0; pz = -10;
            } else {
                const angle = (idx * 1.15);
                const rad = 16 + (idx % 4) * 9;
                px = isAll360 ? Math.cos(angle) * rad : BO.Math.randRange(-14, 14);
                py = 0;
                pz = isAll360 ? Math.sin(angle) * rad : (-14 - (idx % 5) * 12);
            }

            const g = new THREE.Group();
            g.position.set(px, py, pz);
            const def = ROTATING_DEPLOYABLES.find((d) => d.id === depId) || { color: '#38bdf8' };
            const colHex = new THREE.Color(def.color || '#38bdf8').getHex();
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 });
            const glowMat = new THREE.MeshBasicMaterial({ color: colHex });

            if (depId === 'landmine_field') {
                for (let m = 0; m < 6; m++) {
                    const mx = px + BO.Math.randRange(-10, 10);
                    const mz = pz + BO.Math.randRange(-10, 10);
                    const mine = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.52, 0.16, 10), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
                    mine.position.set(mx, 0.08, mz);
                    BO.World.scene.add(mine);
                    this.deployables.push({ id: depId, mesh: mine, x: mx, y: 0, z: mz, timer: 0, hp: 100, alive: true });
                }
                return;
            } else if (depId === 'barbed_wire') {
                const strip = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.55, 2.2), new THREE.MeshStandardMaterial({ color: 0x64748b, wireframe: true }));
                strip.position.y = 0.28;
                g.add(strip);
            } else if (depId === 'sawblade_spinner') {
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.5, 10), baseMat);
                post.position.y = 0.75;
                const blade = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.09, 16), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 }));
                blade.position.y = 1.05;
                g.add(post, blade);
                g.userData.spinPart = blade;
            } else if (depId === 'decoy_holo') {
                const holoBody = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 10), new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.65 }));
                holoBody.position.y = 0.9;
                g.add(holoBody);
            } else if (depId === 'attack_drone') {
                const core = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 1.1), baseMat);
                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 6, 16), glowMat);
                ring.rotation.x = Math.PI * 0.5;
                g.add(core, ring);
            } else if (depId === 'combat_mech') {
                const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.1), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }));
                torso.position.y = 1.6;
                const visor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.2), glowMat);
                visor.position.set(0, 1.9, 0.55);
                const legL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.5), baseMat); legL.position.set(-0.45, 0.55, 0);
                const legR = legL.clone(); legR.position.x = 0.45;
                g.add(torso, visor, legL, legR);
            } else {
                // Tower / Emitter / Beacon / Mortar / Tesla / Cryo / Flame / Acid / EMP / Gravity / Medic / Shield / Gold / Sniper
                const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 1.5, 10), baseMat);
                ped.position.y = 0.75;
                const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), glowMat);
                head.position.y = 1.9;
                const halo = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.05, 6, 16), glowMat);
                halo.rotation.x = Math.PI * 0.5;
                halo.position.y = 1.9;
                g.add(ped, head, halo);
                g.userData.spinPart = head;
            }

            BO.World.scene.add(g);
            this.deployables.push({
                id: depId, mesh: g, x: px, y: py, z: pz,
                timer: 0.4, phase: Math.random() * 6.28,
                hp: depId === 'decoy_holo' ? 650 : 9999,
                alive: true
            });
        }

        buyShopItem(itemId) {
            if (this.state !== 'intermission') {
                BO.Events.emit('hud:toast', { text: 'SHOP IS ONLY OPEN BETWEEN WAVES!', color: '#ef4444' });
                return false;
            }
            const item = CORE_SHOP_ITEMS.find((x) => x.id === itemId);
            if (!item) return false;
            const cost = this.getCost(item.cost);
            if (this.gold < cost) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: `NEED ${cost} GOLD FOR ${item.name}!`, color: '#ef4444' });
                return false;
            }

            if (itemId === 'barrier') {
                let targetLayer = null;
                for (let i = this.layers.length - 1; i >= 0; i--) {
                    if (this.layers[i].hp < this.layers[i].maxHp) {
                        targetLayer = this.layers[i];
                        break;
                    }
                }
                if (!targetLayer) {
                    BO.Events.emit('hud:toast', { text: 'ALL 3 DEFENSE LAYERS ALREADY AT FULL HP!', color: '#facc15' });
                    return false;
                }
                this.gold -= cost;
                targetLayer.hp = Math.min(targetLayer.maxHp, targetLayer.hp + Math.round(targetLayer.maxHp * 0.5));
                this._syncLayerVisual(targetLayer);
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: `REPAIRED ${targetLayer.name} (${Math.ceil(targetLayer.hp)}/${targetLayer.maxHp} HP)!`, color: '#22c55e' });
                if (BO.Net && BO.Net.active && !BO.Net.isHost) BO.Net.sendToHost({ type: 'td_action', action: 'barrier' });
                return true;
            }

            if (itemId === 'turret') {
                const pads = BO.World.mapData.turretPads || [];
                if (this.turrets.length >= pads.length) {
                    this.gold -= cost;
                    for (const t of this.turrets) {
                        t.damage = Math.round(t.damage * 1.35);
                        t.interval = Math.max(0.10, t.interval * 0.8);
                    }
                    BO.Sound.playShopBuy();
                    BO.Events.emit('hud:toast', { text: 'ALL TURRETS UPGRADED (+35% DMG & FASTER FIRE)!', color: '#38bdf8' });
                    return true;
                }
                this.gold -= cost;
                const pad = pads[this.turrets.length];
                const tm = BO.CharacterMesh.buildSentryTurret();
                tm.root.position.set(pad.x, pad.y, pad.z);
                BO.World.scene.add(tm.root);
                this.turrets.push({ x: pad.x, y: pad.y, z: pad.z, mesh: tm.root, headGroup: tm.headGroup, damage: 45, interval: 0.24, cooldown: 0 });
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: `SENTRY TURRET #${this.turrets.length} DEPLOYED!`, color: '#38bdf8' });
                if (BO.Net && BO.Net.active && !BO.Net.isHost) BO.Net.sendToHost({ type: 'td_action', action: 'turret' });
                return true;
            }

            if (itemId === 'ammo') {
                this.gold -= cost;
                BO.Player.refillAllAmmo();
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: 'ALL AMMUNITION REFILLED!', color: '#22c55e' });
                return true;
            }

            if (itemId === 'grenades') {
                this.gold -= cost;
                BO.Player.lethalCount = BO.AttachmentsData.LETHALS[BO.Player.lethalId]?.count || 2;
                BO.Player.tacticalCount = BO.AttachmentsData.TACTICALS[BO.Player.tacticalId]?.count || 2;
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: 'GRENADES & TACTICALS REFILLED!', color: '#f97316' });
                return true;
            }

            if (itemId === 'rpg') {
                this.gold -= cost;
                BO.Player.giveWeapon('rpg7_warhead', false, false);
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: 'RPG-7 WARHEAD EQUIPPED!', color: '#f59e0b' });
                return true;
            }

            if (itemId === 'teammate') {
                this.gold -= cost;
                const sp = BO.World.mapData.stairBottomPoint || { x: 0, y: 0, z: -2 };
                const ally = {
                    parts: BO.CharacterMesh.buildSoldier(0, null),
                    pos: new THREE.Vector3(sp.x + BO.Math.randRange(-2, 2), sp.y, sp.z),
                    yaw: 0, animPhase: 0, cooldown: 0, wavesLeft: 2
                };
                ally.parts.root.position.copy(ally.pos);
                BO.World.scene.add(ally.parts.root);
                this.allies.push(ally);
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: 'TEMPORARY TEAMMATE HIRED (2 WAVES)!', color: '#38bdf8' });
                if (BO.Net && BO.Net.active && !BO.Net.isHost) BO.Net.sendToHost({ type: 'td_action', action: 'teammate' });
                return true;
            }

            if (itemId === 'dog') {
                this.gold -= cost;
                const sp = BO.World.mapData.stairBottomPoint || { x: 0, y: 0, z: -2 };
                const dog = {
                    parts: BO.CharacterMesh.buildGuardDog(null),
                    pos: new THREE.Vector3(sp.x + BO.Math.randRange(-2, 2), sp.y, sp.z),
                    yaw: 0, hp: 300, maxHp: 300, animPhase: 0, attackCd: 0
                };
                dog.parts.root.position.copy(dog.pos);
                BO.World.scene.add(dog.parts.root);
                this.dogs.push(dog);
                BO.Sound.playDogBark();
                BO.Events.emit('hud:toast', { text: 'GUARD DOG DEPLOYED (300 HP)!', color: '#facc15' });
                if (BO.Net && BO.Net.active && !BO.Net.isHost) BO.Net.sendToHost({ type: 'td_action', action: 'dog' });
                return true;
            }

            if (itemId === 'minigun') {
                this.gold -= cost;
                BO.Player.giveWeapon('minigun_death', false, false);
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: 'M134 DEATH MACHINE MINIGUN EQUIPPED!', color: '#fde047' });
                return true;
            }
            return false;
        }

        buyCustomClass(classIndex) {
            const cost = this.getCost(1000);
            if (this.gold < cost) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: `NEED ${cost} GOLD TO EQUIP CUSTOM CLASS!`, color: '#ef4444' });
                return false;
            }
            const cls = BO.Loadout.getClass(classIndex);
            if (!cls) return false;
            this.gold -= cost;
            BO.Loadout.setSelectedClassIndex(classIndex);
            BO.Player.applyCustomLoadoutLive(cls);
            BO.Sound.playShopBuy();
            BO.Events.emit('hud:banner', {
                title: `CUSTOM CLASS EQUIPPED!`,
                sub: `${cls.name.toUpperCase()} — ${BO.WeaponsData.get(cls.primary.id).shortName} + ${BO.WeaponsData.get(cls.secondary.id).shortName}`,
                color: '#38bdf8'
            });
            return true;
        }

        buyPerkByDef(pk) {
            const P = BO.Player;
            if (!pk || !P) return false;
            if (this.modifiers.noPerks) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: 'PERK MACHINES DISABLED BY NO-PERKS MODIFIER!', color: '#ef4444' });
                return false;
            }
            const cost = this.modifiers.freePerks ? 0 : this.getCost(pk.cost);
            if (P.zombiePerks.has(pk.id)) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: `${pk.name.toUpperCase()} ALREADY EQUIPPED!`, color: '#f59e0b' });
                return false;
            }
            if (P.zombiePerks.size >= 8) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: 'PERK LIMIT REACHED (MAX 8 PERKS AT A TIME)!', color: '#ef4444' });
                return false;
            }
            if (this.gold < cost) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: `NEED ${cost} GOLD FOR ${pk.name.toUpperCase()}!`, color: '#ef4444' });
                return false;
            }
            this.gold -= cost;
            P.zombiePerks.add(pk.id);
            P.applyPerkStats();
            BO.Sound.playPerkBuy();
            BO.Events.emit('hud:toast', { text: `${pk.name.toUpperCase()} EQUIPPED (${P.zombiePerks.size}/8)!`, color: pk.color });
            return true;
        }

        launchToTowerFloor(floorObj, towerLabel) {
            const P = BO.Player;
            if (!P || !floorObj) return;
            P.rideState = {
                kind: 'arc',
                sx: P.pos.x, sy: P.pos.y, sz: P.pos.z,
                dx: floorObj.destX, dy: floorObj.destY, dz: floorObj.destZ,
                arcHeight: Math.max(2.2, Math.abs(floorObj.destY - P.pos.y) * 0.25),
                duration: 0.68,
                t: 0
            };
            BO.Sound.playTrapZap();
            BO.Events.emit('hud:toast', { text: `🚀 LAUNCHED TO ${towerLabel} — ${floorObj.name}!`, color: '#38bdf8' });
        }

        _onBulletHit(zombie, dmg, hitbox, weaponInst) {
            if (!zombie || !zombie.alive) return false;
            if (this.modifiers.headshotsOnly && hitbox !== 'head' && !zombie.spec.bodySpec?.headless) {
                return false;
            }
            let finalDmg = dmg;
            const wCat = (weaponInst && weaponInst.stats && weaponInst.stats.category ? String(weaponInst.stats.category).toLowerCase() : '');
            if (this.modifiers.sniperHeaven && (wCat.includes('sniper') || wCat.includes('marksman'))) {
                finalDmg = Math.round(finalDmg * 2.5);
            }
            const isMelee = weaponInst && weaponInst.stats && weaponInst.stats.kind === 'melee';
            if (this.modifiers.meleeMayhem && isMelee) {
                finalDmg = Math.round(finalDmg * 4.0);
            }
            if (BO.Net && BO.Net.active && !BO.Net.isHost) {
                BO.Net.sendToHost({ type: 'td_hit', zid: zombie.id, dmg: finalDmg, hitbox, isHead: hitbox === 'head' });
            }
            const killed = zombie.takeDamage(finalDmg, hitbox, hitbox === 'head', null, isMelee ? 'melee' : 'bullet');
            this._addGold(killed ? (zombie.isBoss ? 250 : 45) : 10);
            if (killed) {
                this.kills++;
                if (hitbox === 'head') this.headshots++;
                BO.Progression.grantPlayerXP(zombie.isBoss ? 300 : 55);
                if (this.modifiers.vampirePlayer && BO.Player.alive) {
                    BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + 15);
                }
                if (this.modifiers.meleeMayhem && isMelee && BO.Player.alive) {
                    BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + 20);
                }
                if (this.modifiers.explosiveHeadshots && hitbox === 'head') {
                    const pt = zombie.pos.clone().add(new THREE.Vector3(0, 1.3, 0));
                    BO.FX.spawnExplosion(pt, 5.2, 0xf97316);
                    BO.Sound.playExplosion(0.55);
                    this._onExplode(pt, 5.8, 180, false, 0, 'explosive_hs');
                }
                if (BO.Player.zombiePerks.has('vulture_aid') && Math.random() < 0.22 && BO.Player.activeWeapon) {
                    const aw = BO.Player.activeWeapon;
                    aw.reserve = Math.min(aw.stats.reserveMax, aw.reserve + Math.ceil(aw.stats.magSize * 0.4));
                }
            }
            return killed;
        }

        _onExplode(pos, rad, dmg, isFlash, stunDur, wid) {
            let kills = 0;
            for (const z of this.zombies) {
                if (!z.alive) continue;
                const d = z.pos.distanceTo(pos);
                if (d <= rad) {
                    if (isFlash) {
                        z.stunTimer = Math.max(z.stunTimer, stunDur || 3.5);
                    } else if (wid === 'cryo_nova') {
                        z.frozenTimer = Math.max(z.frozenTimer, stunDur || 4.0);
                    } else {
                        const blastDmg = dmg * (1 - (d / rad) * 0.45);
                        if (BO.Net && BO.Net.active && !BO.Net.isHost) {
                            BO.Net.sendToHost({ type: 'td_hit', zid: z.id, dmg: blastDmg, hitbox: 'torso', isHead: false });
                        }
                        if (z.takeDamage(blastDmg, 'torso', false, null, 'explosive')) {
                            kills++;
                            this.kills++;
                            this._addGold(45);
                        }
                    }
                }
            }
            if (kills > 0) BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: true });
        }

        /* ====================================================================
           INTERACTIONS ON CASTLE KEEP:
           Perks (14 total, max 8), Pack-a-Punch, Attachment Station,
           Mystery Box, Sniper Tower Jump Pads, War Gong, Shopkeeper, Revive!
        ==================================================================== */
        tryInteract() {
            const P = BO.Player;
            if (!this.active || !P.alive) return;

            if (BO.Net && BO.Net.active) {
                const downed = BO.Net.getDownedTeammateNear(P.pos);
                if (downed) {
                    BO.Net.reviveTeammate(downed.peerId);
                    return;
                }
            }

            const inter = this.activePrompt;
            if (inter) {
                if (inter.type === 'td_tower_lift') {
                    if (BO.Menus && BO.Menus.openTdLiftModal) {
                        BO.Sound.playUIClick();
                        BO.Menus.openTdLiftModal(inter);
                    }
                    return;
                }
                if (inter.type === 'td_perk_kiosk') {
                    if (BO.Menus && BO.Menus.openTdPerkKioskModal) {
                        BO.Sound.playUIClick();
                        BO.Menus.openTdPerkKioskModal();
                    }
                    return;
                }
                if (inter.type === 'td_jump_pad') {
                    P.rideState = {
                        kind: 'arc',
                        sx: P.pos.x, sy: P.pos.y, sz: P.pos.z,
                        dx: inter.destX, dy: inter.destY, dz: inter.destZ,
                        arcHeight: 2.8, duration: 0.75, t: 0
                    };
                    BO.Sound.playTrapZap();
                    BO.Events.emit('hud:toast', { text: `LAUNCHED TO ${inter.label}!`, color: '#38bdf8' });
                    return;
                }
                if (inter.type === 'td_attachment_station') {
                    if (BO.Menus && BO.Menus.openTdAttachmentModal) {
                        BO.Sound.playUIClick();
                        BO.Menus.openTdAttachmentModal();
                    }
                    return;
                }
                if (inter.type === 'td_custom_class_station') {
                    if (BO.Menus && BO.Menus.openTdCustomClassModal) {
                        BO.Sound.playUIClick();
                        BO.Menus.openTdCustomClassModal();
                    }
                    return;
                }
                if (inter.type === 'td_tower_arrow_gun') {
                    const cost = this.getCost(400);
                    if (this.gold < cost) {
                        BO.Sound.playEmptyClick();
                        BO.Events.emit('hud:toast', { text: `NEED ${cost} GOLD TO FIRE TOWER ARROW BALLISTA!`, color: '#ef4444' });
                        return;
                    }
                    this.gold -= cost;
                    BO.Sound.playShopBuy();
                    // Fire immediate 15-arrow piercing barrage at living zombies + activate 30s auto-ballista!
                    const origin = new THREE.Vector3(inter.x, inter.y + 0.6, inter.z);
                    const living = this.zombies.filter((z) => z.alive);
                    for (let a = 0; a < 15; a++) {
                        if (living.length === 0) break;
                        const tgt = living[a % living.length];
                        if (!tgt.alive) continue;
                        BO.FX.spawnTracer(origin, tgt.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), 0xfacc15, 0.055, 0.24);
                        if (tgt.takeDamage(280, 'head', true, null, 'bullet')) {
                            this.kills++;
                            this.headshots++;
                            this._addGold(45);
                        }
                    }
                    this.activeBallistas.push({ x: inter.x, y: inter.y + 0.6, z: inter.z, timer: 30.0, fireCd: 0.4 });
                    BO.Events.emit('hud:toast', { text: `🏹 ${inter.label}: 15-ARROW BARRAGE + 30s AUTO-BALLISTA ACTIVATED!`, color: '#facc15' });
                    return;
                }
                if (inter.type === 'td_tower_turret') {
                    const cost = this.getCost(600);
                    if (this.gold < cost) {
                        BO.Sound.playEmptyClick();
                        BO.Events.emit('hud:toast', { text: `NEED ${cost} GOLD FOR TOWER SKY TURRET!`, color: '#ef4444' });
                        return;
                    }
                    this.gold -= cost;
                    const key = `${inter.x.toFixed(1)}_${inter.z.toFixed(1)}`;
                    const existing = this.towerTurretMap[key];
                    if (existing) {
                        existing.damage = Math.round(existing.damage * 1.40);
                        existing.interval = Math.max(0.08, existing.interval * 0.80);
                        existing.level = (existing.level || 1) + 1;
                        BO.Sound.playShopBuy();
                        BO.Events.emit('hud:toast', { text: `🔫 ${inter.label} UPGRADED TO LVL ${existing.level} (${existing.damage} DMG)!`, color: '#38bdf8' });
                    } else {
                        const tObj = inter.turretObj
                            ? Object.assign(inter.turretObj, { damage: 75, interval: 0.16, cooldown: 0, level: 1 })
                            : (() => {
                                const tm = BO.CharacterMesh.buildSentryTurret();
                                tm.root.position.set(inter.x, inter.y - 0.6, inter.z);
                                BO.World.scene.add(tm.root);
                                return { x: inter.x, y: inter.y - 0.6, z: inter.z, mesh: tm.root, headGroup: tm.headGroup, damage: 75, interval: 0.16, cooldown: 0, level: 1 };
                            })();
                        this.turrets.push(tObj);
                        this.towerTurretMap[key] = tObj;
                        BO.Sound.playShopBuy();
                        BO.Events.emit('hud:toast', { text: `🔫 ${inter.label} ACTIVATED! AUTO-FIRING AT ALL ZOMBIES!`, color: '#38bdf8' });
                    }
                    return;
                }
                if (inter.type === 'td_overdrive_gong') {
                    if (this.overdriveCooldown > 0) {
                        BO.Sound.playEmptyClick();
                        BO.Events.emit('hud:toast', { text: `WAR GONG RECHARGING (${Math.ceil(this.overdriveCooldown)}s)`, color: '#f59e0b' });
                        return;
                    }
                    this.overdriveTimer = 15.0;
                    this.overdriveCooldown = 90.0;
                    BO.Sound.playPaPChime();
                    BO.Events.emit('hud:banner', { title: '⚡ CASTLE OVERDRIVE ACTIVATED!', sub: '15s OF 2X FIRE RATE, INFINITE MAG & 2X TURRET SPEED!', color: '#fde047' });
                    return;
                }
                if (inter.type === 'perk') {
                    if (this.modifiers.noPerks) {
                        BO.Sound.playEmptyClick();
                        BO.Events.emit('hud:toast', { text: 'PERK MACHINES DISABLED BY NO-PERKS MODIFIER!', color: '#ef4444' });
                        return;
                    }
                    const pk = inter.data;
                    const cost = this.modifiers.freePerks ? 0 : this.getCost(pk.cost);
                    if (P.zombiePerks.has(pk.id)) {
                        BO.Sound.playEmptyClick();
                        BO.Events.emit('hud:toast', { text: `${pk.name.toUpperCase()} ALREADY EQUIPPED!`, color: '#f59e0b' });
                        return;
                    }
                    if (P.zombiePerks.size >= 8) {
                        BO.Sound.playEmptyClick();
                        BO.Events.emit('hud:toast', { text: 'PERK LIMIT REACHED (MAX 8 PERKS AT A TIME)!', color: '#ef4444' });
                        return;
                    }
                    if (this.gold < cost) {
                        BO.Sound.playEmptyClick();
                        BO.Events.emit('hud:toast', { text: `NEED ${cost} GOLD FOR ${pk.name.toUpperCase()}!`, color: '#ef4444' });
                        return;
                    }
                    this.gold -= cost;
                    P.zombiePerks.add(pk.id);
                    P.applyPerkStats();
                    BO.Sound.playPerkBuy();
                    BO.Events.emit('hud:toast', { text: `${pk.name.toUpperCase()} EQUIPPED (${P.zombiePerks.size}/8)!`, color: pk.color });
                    return;
                }
                if (inter.type === 'pack_a_punch') {
                    const w = P.activeWeapon;
                    const curTier = w ? (w.papTier || 0) : 3;
                    if (!w || curTier >= 3) {
                        BO.Sound.playEmptyClick();
                        return;
                    }
                    const basePap = curTier === 0 ? 3000 : (curTier === 1 ? 6000 : 10000);
                    const cost = this.getCost(basePap);
                    if (this.gold < cost) {
                        BO.Sound.playEmptyClick();
                        BO.Events.emit('hud:toast', { text: `NEED ${cost} GOLD FOR PACK-A-PUNCH TIER ${curTier + 1}!`, color: '#ef4444' });
                        return;
                    }
                    this.gold -= cost;
                    P.packAPunchActiveWeapon();
                    BO.Sound.playPaPChime();
                    BO.Events.emit('hud:banner', { title: `PACK-A-PUNCH TIER ${P.activeWeapon.papTier}!`, sub: P.activeWeapon.stats.name.toUpperCase(), color: '#c084fc' });
                    return;
                }
                if (inter.type === 'mystery_box') {
                    const cost = this.getCost(950);
                    if (inter.state === 'idle') {
                        if (this.gold < cost) { BO.Sound.playEmptyClick(); return; }
                        this.gold -= cost;
                        inter.state = 'rolling';
                        inter.rollTimer = 2.4;
                        inter.lidPivot.rotation.x = -1.15;
                        BO.Sound.playMysteryBoxJingle();
                    } else if (inter.state === 'ready' && inter.rolledWeaponId) {
                        P.giveWeapon(inter.rolledWeaponId, false, false);
                        if (inter.previewMesh) { inter.previewAnchor.remove(inter.previewMesh); inter.previewMesh = null; }
                        inter.state = 'idle';
                        inter.lidPivot.rotation.x = 0;
                        BO.Sound.playUIClick();
                    }
                    return;
                }
            }

            // Fallback: open Shopkeeper if near Stall or during intermission
            if (BO.Menus && BO.Menus.openTdShopModal) {
                BO.Menus.openTdShopModal();
            }
        }

        _updateNearestPrompt() {
            const P = BO.Player;
            let best = null, bestDist = Infinity;
            for (const inter of BO.World.interactives) {
                const d = BO.Math.dist3D(P.pos.x, P.pos.y + 1, P.pos.z, inter.x, inter.y, inter.z);
                if (d <= (inter.radius || 2.5) && d < bestDist) {
                    bestDist = d;
                    best = inter;
                }
            }
            this.activePrompt = best;
        }

        _updateMysteryBox(dt) {
            const box = BO.World.mysteryBoxObj;
            if (!box) return;
            box.beacon.rotation.y += dt * 1.4;
            if (box.state === 'rolling') {
                box.rollTimer -= dt;
                if (Math.floor(box.rollTimer * 6) !== Math.floor((box.rollTimer + dt) * 6)) {
                    const randW = BO.Math.pick(BO.WeaponsData.ORDER);
                    if (box.previewMesh) { box.previewAnchor.remove(box.previewMesh); box.previewMesh = null; }
                    const built = BO.WeaponMesh.buildWeapon(randW, {}, 'default', false, false);
                    built.root.scale.setScalar(1.3);
                    box.previewAnchor.add(built.root);
                    box.previewMesh = built.root;
                    box.rolledWeaponId = randW;
                }
                if (box.previewMesh) box.previewMesh.rotation.y += dt * 4;
                if (box.rollTimer <= 0) {
                    const roll = BO.WeaponsData.rollMysteryBox();
                    const finalW = (roll && roll.weaponId) ? roll.weaponId : BO.Math.pick(BO.WeaponsData.ORDER);
                    box.rolledWeaponId = finalW;
                    if (box.previewMesh) { box.previewAnchor.remove(box.previewMesh); box.previewMesh = null; }
                    const built = BO.WeaponMesh.buildWeapon(finalW, {}, 'default', false, false);
                    built.root.scale.setScalar(1.35);
                    box.previewAnchor.add(built.root);
                    box.previewMesh = built.root;
                    box.state = 'ready';
                    box.readyTimer = 10.0;
                }
            } else if (box.state === 'ready') {
                box.readyTimer -= dt;
                if (box.previewMesh) box.previewMesh.rotation.y += dt * 2;
                if (box.readyTimer <= 0) {
                    if (box.previewMesh) { box.previewAnchor.remove(box.previewMesh); box.previewMesh = null; }
                    box.state = 'idle';
                    box.lidPivot.rotation.x = 0;
                    box.rolledWeaponId = null;
                }
            }
        }

        _getZombieTarget(z) {
            // Engage Holographic Decoys first!
            for (const dep of this.deployables) {
                if (dep.id === 'decoy_holo' && dep.alive && dep.hp > 0 && BO.Math.dist2D(dep.x, dep.z, z.pos.x, z.pos.z) < 26) {
                    return { kind: 'decoy', dep, x: dep.x, y: dep.y, z: dep.z, attackRange: 1.6, forceDirect: true };
                }
            }
            for (const dog of this.dogs) {
                if (dog.hp > 0 && dog.pos.distanceTo(z.pos) < 3.8) {
                    return { kind: 'dog', dog, x: dog.pos.x, y: dog.pos.y, z: dog.pos.z, attackRange: 1.45, forceDirect: true };
                }
            }
            if (BO.Player.alive && BO.Player.pos.distanceTo(z.pos) < 3.6 && Math.abs(BO.Player.pos.y - z.pos.y) < 1.8) {
                return null;
            }

            const layer = this.getActiveBlockingLayer();
            if (layer) {
                let bestSeg = layer.segments[0], bestDist = Infinity, bestPtX = 0, bestPtZ = 0;
                for (const s of layer.segments) {
                    const cx = BO.Math.clamp(z.pos.x, s.x - s.w * 0.5, s.x + s.w * 0.5);
                    const cz = BO.Math.clamp(z.pos.z, s.z - s.d * 0.5, s.z + s.d * 0.5);
                    const d = BO.Math.dist2D(z.pos.x, z.pos.z, cx, cz);
                    if (d < bestDist) { bestDist = d; bestSeg = s; bestPtX = cx; bestPtZ = cz; }
                }
                return { kind: 'layer', layerObj: layer, x: bestPtX, y: bestSeg ? bestSeg.y : 0, z: bestPtZ, attackRange: 1.55, forceDirect: true };
            }

            for (const dog of this.dogs) {
                if (dog.hp > 0 && dog.pos.distanceTo(z.pos) < 5.5) {
                    return { kind: 'dog', dog, x: dog.pos.x, y: dog.pos.y, z: dog.pos.z, attackRange: 1.45, forceDirect: true };
                }
            }
            if (BO.Player.alive && BO.Player.pos.distanceTo(z.pos) < 6.5 && Math.abs(BO.Player.pos.y - z.pos.y) < 1.8) {
                return null;
            }

            const ch = this.heartObj || { x: 0, y: 5.4, z: 19.0 };
            if (z.pos.y < 4.9) {
                const map = BO.World.mapData;
                const stairsList = (map && map.stairs && map.stairs.length > 0)
                    ? map.stairs
                    : [{ bot: map.stairBottomPoint || { x: 0, y: 0, z: -5.0 }, top: map.stairTopPoint || { x: 0, y: 5.4, z: 8.6 }, halfWidth: 3.1 }];
                let bestStair = stairsList[0], bestD = Infinity;
                for (const st of stairsList) {
                    const d = BO.Math.dist2D(z.pos.x, z.pos.z, st.bot.x, st.bot.z);
                    if (d < bestD) { bestD = d; bestStair = st; }
                }
                const bot = bestStair.bot, top = bestStair.top, hw = bestStair.halfWidth || 2.8;
                const minZ = Math.min(bot.z, top.z) - 1.5, maxZ = Math.max(bot.z, top.z) + 1.5;
                if (Math.abs(z.pos.x - bot.x) <= hw && z.pos.z >= minZ && z.pos.z <= maxZ) {
                    return { kind: 'climb', x: top.x, y: top.y, z: top.z, attackRange: 0, forceDirect: true };
                }
                const hasClear = BO.World.hasLineOfSight(z.pos.x, z.pos.y + 1.0, z.pos.z, bot.x, bot.y + 1.0, bot.z);
                return { kind: 'stair_entry', x: bot.x, y: bot.y, z: bot.z, attackRange: 0, forceDirect: hasClear };
            }
            return { kind: 'heart', x: ch.x, y: ch.y, z: ch.z, attackRange: 2.2, forceDirect: true };
        }

        _updateDeployables(dt, livingZ) {
            const P = BO.Player;
            const speedBoost = this.overdriveTimer > 0 ? 1.85 : 1.0;

            for (let i = this.deployables.length - 1; i >= 0; i--) {
                const dep = this.deployables[i];
                if (!dep.alive) {
                    if (dep.mesh && BO.World.scene) BO.World.scene.remove(dep.mesh);
                    this.deployables.splice(i, 1);
                    continue;
                }
                if (dep.mesh && dep.mesh.userData && dep.mesh.userData.spinPart) {
                    dep.mesh.userData.spinPart.rotation.y += dt * (dep.id === 'sawblade_spinner' ? 14 : 2.8);
                }
                dep.timer -= dt * speedBoost;

                if (dep.id === 'shield_gen') {
                    for (const l of this.layers) {
                        if (l.active && l.hp > 0 && l.hp < l.maxHp) {
                            l.hp = Math.min(l.maxHp, l.hp + 9 * dt);
                            this._syncLayerVisual(l);
                        }
                    }
                } else if (dep.id === 'healing_fountain') {
                    if (P.alive && BO.Math.dist3D(P.pos.x, P.pos.y, P.pos.z, dep.x, dep.y, dep.z) < 9) {
                        P.hp = Math.min(P.maxHp, P.hp + 20 * dt);
                        P.armor = Math.min(P.maxArmor, P.armor + 12 * dt);
                    }
                } else if (dep.id === 'ammo_fabricator') {
                    if (dep.timer <= 0) {
                        dep.timer = 4.0;
                        if (P.alive && P.pos.y >= 4.5 && P.activeWeapon && P.activeWeapon.stats.kind === 'gun') {
                            P.activeWeapon.reserve = Math.min(P.activeWeapon.stats.reserveMax, P.activeWeapon.reserve + Math.ceil(P.activeWeapon.stats.magSize * 0.5));
                        }
                    }
                } else if (dep.id === 'gold_miner') {
                    if (this.state !== 'intermission' && dep.timer <= 0) {
                        dep.timer = 11.0;
                        this._addGold(160);
                        BO.FX.spawnParticles(new THREE.Vector3(dep.x, dep.y + 1.8, dep.z), 8, 0xfacc15, 3, 2, 0.5, 1.0);
                    }
                } else if (dep.id === 'landmine_field') {
                    for (const z of livingZ) {
                        if (BO.Math.dist2D(dep.x, dep.z, z.pos.x, z.pos.z) < 2.1) {
                            dep.alive = false;
                            const pt = new THREE.Vector3(dep.x, 0.4, dep.z);
                            BO.FX.spawnExplosion(pt, 5.5, 0xef4444);
                            BO.Sound.playExplosion(0.75);
                            this._onExplode(pt, 6.2, 320, false, 0, 'landmine');
                            break;
                        }
                    }
                } else if (dep.id === 'barbed_wire') {
                    for (const z of livingZ) {
                        if (Math.abs(z.pos.x - dep.x) < 5.2 && Math.abs(z.pos.z - dep.z) < 1.8) {
                            z.slowTimer = Math.max(z.slowTimer, 1.0);
                            if (dep.timer <= 0) {
                                if (z.takeDamage(22, 'torso', false, null, 'melee')) { this.kills++; this._addGold(35); }
                            }
                        }
                    }
                    if (dep.timer <= 0) dep.timer = 0.65;
                } else if (dep.id === 'sawblade_spinner') {
                    if (dep.timer <= 0) {
                        dep.timer = 0.35;
                        for (const z of livingZ) {
                            if (BO.Math.dist2D(dep.x, dep.z, z.pos.x, z.pos.z) < 3.4) {
                                BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 1, 0)), 4, 0x991b1b, 3, 5, 0.3, 0.9);
                                if (z.takeDamage(75, 'torso', false, null, 'melee')) { this.kills++; this._addGold(40); }
                            }
                        }
                    }
                } else if (dep.id === 'attack_drone') {
                    dep.phase += dt * 0.9;
                    dep.x = Math.cos(dep.phase) * 16;
                    dep.z = (BO.World.mapData.castleSetup === 'all' ? 0 : -24) + Math.sin(dep.phase) * 14;
                    dep.mesh.position.set(dep.x, dep.y + Math.sin(dep.phase * 2) * 0.7, dep.z);
                    if (dep.timer <= 0 && livingZ.length > 0) {
                        dep.timer = 0.25;
                        const tgt = BO.Math.pick(livingZ);
                        BO.FX.spawnTracer(new THREE.Vector3(dep.x, dep.y, dep.z), tgt.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x38bdf8, 0.03, 0.1);
                        if (tgt.takeDamage(42, 'torso', false, null, 'bullet')) { this.kills++; this._addGold(35); }
                    }
                } else if (dep.id === 'tesla_coil' && dep.timer <= 0) {
                    dep.timer = 1.1;
                    const targets = livingZ.filter((z) => BO.Math.dist2D(dep.x, dep.z, z.pos.x, z.pos.z) < 30).slice(0, 3);
                    for (const z of targets) {
                        BO.FX.spawnTracer(new THREE.Vector3(dep.x, dep.y + 1.9, dep.z), z.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x22d3ee, 0.06, 0.14);
                        z.stunTimer = Math.max(z.stunTimer, 0.55);
                        if (z.takeDamage(88, 'torso', false, null, 'bullet')) { this.kills++; this._addGold(40); }
                    }
                } else if (dep.id === 'flame_turret' && dep.timer <= 0) {
                    dep.timer = 0.55;
                    for (const z of livingZ) {
                        if (BO.Math.dist2D(dep.x, dep.z, z.pos.x, z.pos.z) < 16) {
                            z.burnTimer = Math.max(z.burnTimer, 3.5);
                            BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 1, 0)), 4, 0xf97316, 3, 2, 0.35, 1.0);
                            if (z.takeDamage(32, 'torso', false, null, 'fire')) { this.kills++; this._addGold(35); }
                        }
                    }
                } else if (dep.id === 'cryo_projector' && dep.timer <= 0) {
                    dep.timer = 2.6;
                    for (const z of livingZ) {
                        if (BO.Math.dist2D(dep.x, dep.z, z.pos.x, z.pos.z) < 22) {
                            z.frozenTimer = Math.max(z.frozenTimer, 2.4);
                            BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 1, 0)), 5, 0x38bdf8, 3, 2, 0.5, 1.1);
                        }
                    }
                } else if (dep.id === 'mortar_battery' && dep.timer <= 0 && livingZ.length > 0) {
                    dep.timer = 3.2;
                    const tgt = BO.Math.pick(livingZ);
                    BO.FX.spawnExplosion(tgt.pos.clone().add(new THREE.Vector3(0, 0.6, 0)), 6.5, 0xf59e0b);
                    BO.Sound.playExplosion(0.6);
                    this._onExplode(tgt.pos.clone(), 7.0, 220, false, 0, 'mortar');
                } else if (dep.id === 'laser_beacon' && dep.timer <= 0 && livingZ.length > 0) {
                    dep.timer = 4.2;
                    const toughest = livingZ.reduce((a, b) => (b.hp > a.hp ? b : a), livingZ[0]);
                    BO.FX.spawnTracer(new THREE.Vector3(toughest.pos.x, 48, toughest.pos.z), toughest.pos.clone(), 0xe879f9, 0.35, 0.35);
                    BO.FX.spawnExplosion(toughest.pos.clone(), 4.0, 0xe879f9);
                    if (toughest.takeDamage(420, 'head', true, null, 'explosive')) { this.kills++; this._addGold(60); }
                } else if (dep.id === 'sniper_nest' && dep.timer <= 0 && livingZ.length > 0) {
                    dep.timer = 1.45;
                    const tgt = livingZ[0];
                    BO.FX.spawnTracer(new THREE.Vector3(dep.x, dep.y + 1.5, dep.z), tgt.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0x60a5fa, 0.035, 0.14);
                    BO.Sound.playGunshot('sniper', false, false, 0.5);
                    if (tgt.takeDamage(210, 'head', true, null, 'bullet')) { this.kills++; this.headshots++; this._addGold(50); }
                } else if (dep.id === 'gravity_well' && dep.timer <= 0) {
                    dep.timer = 2.2;
                    for (const z of livingZ) {
                        const d = BO.Math.dist2D(dep.x, dep.z, z.pos.x, z.pos.z);
                        if (d < 16 && d > 0.8) {
                            z.pos.x += (dep.x - z.pos.x) * 0.35;
                            z.pos.z += (dep.z - z.pos.z) * 0.35;
                            if (z.takeDamage(45, 'torso', false, null, 'explosive')) { this.kills++; this._addGold(35); }
                        }
                    }
                    BO.FX.spawnParticles(new THREE.Vector3(dep.x, 1.0, dep.z), 10, 0xc084fc, 4, 0, 0.5, 1.3);
                } else if (dep.id === 'acid_sprayer' && dep.timer <= 0) {
                    dep.timer = 1.5;
                    for (const z of livingZ) {
                        if (BO.Math.dist2D(dep.x, dep.z, z.pos.x, z.pos.z) < 20) {
                            z.acidTimer = 6.0;
                            if (z.takeDamage(35, 'torso', false, null, 'bullet')) { this.kills++; this._addGold(35); }
                        }
                    }
                } else if (dep.id === 'emp_tower' && dep.timer <= 0) {
                    dep.timer = 5.0;
                    for (const z of livingZ) {
                        if (BO.Math.dist2D(dep.x, dep.z, z.pos.x, z.pos.z) < 28) {
                            z.stunTimer = Math.max(z.stunTimer, 2.2);
                            z.gunCooldown = Math.max(z.gunCooldown, 4.0);
                            z.magicCooldown = Math.max(z.magicCooldown, 4.0);
                        }
                    }
                    BO.FX.spawnParticles(new THREE.Vector3(dep.x, 2.0, dep.z), 14, 0x06b6d4, 8, 1, 0.5, 1.5);
                } else if (dep.id === 'combat_mech' && dep.timer <= 0 && livingZ.length > 0) {
                    dep.timer = 0.16;
                    let nearest = null, bestD = 42;
                    for (const z of livingZ) {
                        const d = BO.Math.dist2D(dep.x, dep.z, z.pos.x, z.pos.z);
                        if (d < bestD) { bestD = d; nearest = z; }
                    }
                    if (nearest) {
                        dep.mesh.rotation.y = Math.atan2(nearest.pos.x - dep.x, nearest.pos.z - dep.z);
                        BO.FX.spawnTracer(new THREE.Vector3(dep.x, 1.8, dep.z), nearest.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xf43f5e, 0.03, 0.08);
                        if (nearest.takeDamage(38, 'torso', false, null, 'bullet')) { this.kills++; this._addGold(35); }
                    }
                }
            }
        }

        _updateZombieSpecialModifiers(dt, livingZ) {
            const P = BO.Player;
            for (const z of livingZ) {
                // 0. Berserker Wave & Shielded Bosses
                if (this.modifiers.berserkerWave && !z._berserkApplied && z.hp < z.maxHp * 0.5) {
                    z._berserkApplied = true;
                    z.speed = Math.min(11.0, z.speed * 1.5);
                }
                if (this.modifiers.shieldedBosses && z.isBoss && z.hp < z.maxHp) {
                    z.hp = Math.min(z.maxHp, z.hp + z.maxHp * 0.03 * dt);
                }

                // 1. Zombies Heal Each Other modifier
                if (this.modifiers.zombiesHeal) {
                    z.healCooldown -= dt;
                    if (z.healCooldown <= 0) {
                        z.healCooldown = 4.5 + Math.random() * 2.0;
                        let healedAny = false;
                        for (const oz of livingZ) {
                            if (oz !== z && oz.hp < oz.maxHp && oz.pos.distanceTo(z.pos) < 8.5) {
                                oz.hp = Math.min(oz.maxHp, oz.hp + oz.maxHp * 0.14);
                                healedAny = true;
                            }
                        }
                        if (healedAny) {
                            BO.FX.spawnParticles(z.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), 6, 0x22c55e, 3, -1, 0.5, 1.2);
                        }
                    }
                }

                // 2. Gun-Toting Zombies firing bullets at Player or Active Barrier!
                const allowProj = !(this.modifiers.noProjectiles || (this.modifiers.noProjectilesUntil20 && this.wave < 20));
                if (allowProj && z.hasGun && z.stunTimer <= 0 && z.frozenTimer <= 0) {
                    z.gunCooldown -= dt;
                    if (z.gunCooldown <= 0) {
                        z.gunCooldown = 1.9 + Math.random() * 1.5;
                        const distToP = z.pos.distanceTo(P.pos);
                        if (P.alive && distToP < 54 && BO.World.hasLineOfSight(z.pos.x, z.pos.y + 1.4, z.pos.z, P.pos.x, P.pos.y + 1.2, P.pos.z)) {
                            const origin = z.pos.clone().add(new THREE.Vector3(0, 1.4, 0));
                            const target = P.pos.clone().add(new THREE.Vector3(BO.Math.randRange(-0.8, 0.8), 1.1, BO.Math.randRange(-0.8, 0.8)));
                            BO.FX.spawnTracer(origin, target, 0xf59e0b, 0.03, 0.12);
                            BO.Sound.playGunshot('ar_light', false, false, 0.35);
                            if (Math.random() < 0.42) {
                                P.takeDamage(Math.max(6, Math.round(z.damage * 0.32)), z.pos, false);
                            }
                        } else {
                            const layer = this.getActiveBlockingLayer();
                            if (layer && layer.segments[0]) {
                                const seg = layer.segments[0];
                                if (BO.Math.dist2D(z.pos.x, z.pos.z, seg.x, seg.z) < 42) {
                                    BO.FX.spawnTracer(z.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), new THREE.Vector3(z.pos.x, 1.6, seg.z), 0xf59e0b, 0.03, 0.12);
                                    this.damageDefenseLayer(layer, Math.max(4, Math.round(z.damage * 0.25)));
                                }
                            }
                        }
                    }
                }

                // 3. Magical Zombies firing arcane orbs & blinking!
                if (allowProj && z.isMagical && z.stunTimer <= 0 && z.frozenTimer <= 0) {
                    z.magicCooldown -= dt;
                    if (z.magicCooldown <= 0) {
                        z.magicCooldown = 3.2 + Math.random() * 2.0;
                        if (P.alive && z.pos.distanceTo(P.pos) < 48 && BO.World.scene) {
                            const origin = z.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
                            const dir = P.pos.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(origin).normalize();
                            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xc084fc }));
                            mesh.position.copy(origin);
                            BO.World.scene.add(mesh);
                            this.enemyProjectiles.push({ mesh, pos: origin, vel: dir.multiplyScalar(17), damage: Math.round(z.damage * 0.45), life: 3.5, owner: z });
                        }
                    }
                }
            }
        }

        update(dt) {
            if (!this.active || this.ended) return;
            this.elapsed += dt;

            if (this.overdriveTimer > 0) this.overdriveTimer = Math.max(0, this.overdriveTimer - dt);
            if (this.overdriveCooldown > 0) this.overdriveCooldown = Math.max(0, this.overdriveCooldown - dt);

            // Every 60 Seconds: Quick Zombie Head Direction Hint Pulse!
            if (this.dirHintActiveTimer > 0) {
                this.dirHintActiveTimer = Math.max(0, this.dirHintActiveTimer - dt);
            }
            if (this.state !== 'intermission') {
                this.dirHintCooldown -= dt;
                if (this.dirHintCooldown <= 0) {
                    this.dirHintCooldown = 60.0;
                    this.dirHintActiveTimer = 4.2;
                    BO.Sound.playDefconBeep(3);
                    BO.Events.emit('hud:toast', { text: '🧟 ZOMBIE HEAD RADAR: INCOMING DIRECTIONS REVEALED!', color: '#4ade80' });
                }
            }

            // Animate Castle Heart Crystal
            if (this.heartObj) {
                this.heartObj.crystal.rotation.y += dt * 1.8;
                this.heartObj.halo.rotation.z += dt * 1.4;
                const hpFrac = this.heartHp / Math.max(1, this.heartMaxHp);
                this.heartObj.crystal.material.color.setHex(hpFrac < 0.35 ? 0xef4444 : (hpFrac < 0.65 ? 0xf59e0b : 0x38bdf8));
            }

            // Parachute Supply Drops
            for (let i = this.supplyDrops.length - 1; i >= 0; i--) {
                const sd = this.supplyDrops[i];
                sd.life -= dt;
                if (sd.y > sd.targetY) sd.y = Math.max(sd.targetY, sd.y - 5.5 * dt);
                sd.mesh.position.set(sd.x, sd.y, sd.z);
                sd.mesh.rotation.y += dt * 1.5;
                if (BO.Player.alive && BO.Math.dist3D(BO.Player.pos.x, BO.Player.pos.y + 0.8, BO.Player.pos.z, sd.x, sd.y, sd.z) < 2.2) {
                    this._addGold(500);
                    BO.Player.refillAllAmmo();
                    BO.Sound.playPowerUp();
                    BO.Events.emit('hud:banner', { title: '📦 SUPPLY DROP CLAIMED!', sub: '+500 GOLD & FULL MAX AMMO REFILL!', color: '#fde047' });
                    BO.World.scene.remove(sd.mesh);
                    this.supplyDrops.splice(i, 1);
                    continue;
                }
                if (sd.life <= 0) {
                    BO.World.scene.remove(sd.mesh);
                    this.supplyDrops.splice(i, 1);
                }
            }

            this._updateMysteryBox(dt);
            this._updateNearestPrompt();

            if (!BO.Player.alive && (!BO.Net || !BO.Net.active || !BO.Net.isAnySquadmateAlive())) {
                this._endMatch(false, 'COMMANDER FALLEN');
                return;
            }

            const isOnlineClient = !!(BO.Net && BO.Net.active && !BO.Net.isHost);

            if (!isOnlineClient && this.state === 'intermission') {
                this.intermissionTimer -= dt;
                if (this.intermissionTimer <= 0) {
                    this._beginNextWave();
                }
            } else if (!isOnlineClient && this.state === 'spawning') {
                this.spawnCooldown -= dt;
                const cv = this.config.customValues || DEFAULT_TD_CONFIG.customValues;
                const maxAlive = BO.Math.clamp(Number(cv.maxAliveZombies) || 28, 5, 60);
                const aliveCount = this.zombies.filter((z) => z.alive).length;
                if (this.remainingToSpawn > 0 && this.spawnCooldown <= 0 && aliveCount < maxAlive) {
                    this._spawnWaveZombie();
                    this.remainingToSpawn--;
                    const customDelay = Number(cv.spawnDelaySec) || 0;
                    this.spawnCooldown = customDelay > 0 ? BO.Math.clamp(customDelay, 0.12, 4.0) : Math.max(0.28, 1.10 - this.wave * 0.03);
                }
                if (this.remainingToSpawn <= 0) this.state = 'fighting';
            } else if (!isOnlineClient && this.state === 'fighting') {
                if (!this.zombies.some((z) => z.alive)) {
                    const bonus = 250 + this.wave * 60;
                    this._addGold(bonus);
                    BO.Sound.playRoundEnd();
                    this.rollShopCycle();
                    this.state = 'intermission';
                    this.intermissionTimer = BO.Math.clamp(Number((this.config.customValues || {}).intermissionSec) || 30, 3, 120);
                    BO.Events.emit('hud:banner', {
                        title: `WAVE ${this.wave} CLEARED!`,
                        sub: '30s INTERMISSION — 6 NEW SUPPORT DEPLOYABLES & 5 WEAPONS ROLLED ([T] SHOP • [N] SKIP)',
                        color: '#22c55e'
                    });
                }
            }

            const livingZ = this.zombies.filter((z) => z.alive);

            // Update 20 Unique Support Deployables + Zombie Special Modifiers
            this._updateDeployables(dt, livingZ);
            this._updateZombieSpecialModifiers(dt, livingZ);

            // Update Enemy Magic Projectiles
            const P = BO.Player;
            for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
                const ep = this.enemyProjectiles[i];
                ep.life -= dt;
                const step = ep.vel.clone().multiplyScalar(dt);
                const hitWall = BO.World.raycastWorld(ep.pos, step.clone().normalize(), step.length() + 0.15);
                ep.pos.add(step);
                ep.mesh.position.copy(ep.pos);
                const hitP = P.alive && BO.Math.dist3D(ep.pos.x, ep.pos.y, ep.pos.z, P.pos.x, P.pos.y + 1.1, P.pos.z) < 0.85;
                if (hitP) {
                    P.takeDamage(ep.damage, ep.owner ? ep.owner.pos : ep.pos, false);
                    BO.FX.spawnParticles(ep.pos, 8, 0xc084fc, 3.5, 4, 0.4, 1.2);
                }
                if (hitP || hitWall || ep.life <= 0) {
                    if (BO.World.scene) BO.World.scene.remove(ep.mesh);
                    this.enemyProjectiles.splice(i, 1);
                }
            }

            // Update Sentry Turrets & Active Tower Arrow Ballistas
            const turretBoost = this.overdriveTimer > 0 ? 1.85 : 1.0;
            for (let i = this.activeBallistas.length - 1; i >= 0; i--) {
                const b = this.activeBallistas[i];
                b.timer -= dt;
                b.fireCd -= dt * turretBoost;
                if (b.fireCd <= 0 && livingZ.length > 0) {
                    b.fireCd = 0.42;
                    const tgt = BO.Math.pick(livingZ);
                    BO.FX.spawnTracer(new THREE.Vector3(b.x, b.y, b.z), tgt.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), 0xfacc15, 0.05, 0.18);
                    if (tgt.takeDamage(210, 'head', true, null, 'bullet')) {
                        this.kills++;
                        this.headshots++;
                        this._addGold(40);
                    }
                }
                if (b.timer <= 0) this.activeBallistas.splice(i, 1);
            }
            for (const t of this.turrets) {
                if (t.cooldown > 0) t.cooldown -= dt * turretBoost;
                let nearest = null, bestD = 92;
                for (const z of livingZ) {
                    const d = BO.Math.dist3D(t.x, t.y + 1, t.z, z.pos.x, z.pos.y + 1, z.pos.z);
                    if (d < bestD && BO.World.hasLineOfSight(t.x, t.y + 1.15, t.z, z.pos.x, z.pos.y + 1.0, z.pos.z)) {
                        bestD = d; nearest = z;
                    }
                }
                if (nearest) {
                    t.headGroup.rotation.y = Math.atan2(nearest.pos.x - t.x, nearest.pos.z - t.z);
                    if (t.cooldown <= 0) {
                        t.cooldown = t.interval;
                        BO.Sound.playTurretFire();
                        BO.FX.spawnTracer(new THREE.Vector3(t.x, t.y + 1.1, t.z), nearest.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 0x38bdf8, 0.03, 0.09);
                        if (nearest.takeDamage(t.damage, 'torso', false, null, 'bullet')) {
                            this.kills++;
                            this._addGold(35);
                        }
                    }
                }
            }

            // Update Armored Guard Dogs
            for (let i = this.dogs.length - 1; i >= 0; i--) {
                const d = this.dogs[i];
                if (d.attackCd > 0) d.attackCd -= dt;
                let target = null, bestDist = 115;
                for (const z of livingZ) {
                    const dist = z.pos.distanceTo(d.pos);
                    if (dist < bestDist) { bestDist = dist; target = z; }
                }
                let spd = 0;
                if (target) {
                    const dx = target.pos.x - d.pos.x, dz = target.pos.z - d.pos.z;
                    const len = Math.max(0.01, Math.hypot(dx, dz));
                    d.yaw = Math.atan2(dx, dz);
                    if (len > 1.35) {
                        spd = 6.2;
                        d.pos.x += (dx / len) * spd * dt;
                        d.pos.z += (dz / len) * spd * dt;
                    } else if (d.attackCd <= 0) {
                        d.attackCd = 0.72;
                        BO.Sound.playDogBark();
                        target.stunTimer = Math.max(target.stunTimer, 0.65);
                        if (target.takeDamage(85, 'torso', false, null, 'melee')) {
                            this.kills++;
                            this._addGold(40);
                        }
                    }
                }
                BO.World.resolveHorizontal(d.pos, 0.35, 0.9, true);
                d.pos.y = BO.World.getGroundHeight(d.pos.x, d.pos.z, d.pos.y);
                d.animPhase += dt * (spd * 2.5 + 1.5);
                d.parts.root.position.copy(d.pos);
                d.parts.root.rotation.y = d.yaw;
                BO.CharacterMesh.animateLimbs(d.parts, spd, d.animPhase, 0, 0);

                if (d.hp <= 0) {
                    BO.FX.spawnParticles(d.pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 14, 0xef4444, 4, 3, 0.5, 1.3);
                    BO.World.scene.remove(d.parts.root);
                    this.dogs.splice(i, 1);
                    BO.Events.emit('hud:toast', { text: 'YOUR GUARD DOG HAS FALLEN!', color: '#ef4444' });
                }
            }

            // Update Temporary Allied Soldiers
            for (const a of this.allies) {
                if (a.cooldown > 0) a.cooldown -= dt;
                let nearest = null, bestD = 68;
                for (const z of livingZ) {
                    const dist = z.pos.distanceTo(a.pos);
                    if (dist < bestD && BO.World.hasLineOfSight(a.pos.x, a.pos.y + 1.4, a.pos.z, z.pos.x, z.pos.y + 1.1, z.pos.z)) {
                        bestD = dist; nearest = z;
                    }
                }
                if (nearest) {
                    a.yaw = Math.atan2(nearest.pos.x - a.pos.x, nearest.pos.z - a.pos.z);
                    a.parts.root.rotation.y = a.yaw;
                    if (a.cooldown <= 0) {
                        a.cooldown = 0.22;
                        BO.Sound.playGunshot('ar_light', false, false, 0.45);
                        BO.FX.spawnTracer(a.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), nearest.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xfde047, 0.025, 0.08);
                        if (nearest.takeDamage(34, 'torso', false, null, 'bullet')) {
                            this.kills++;
                            this._addGold(35);
                        }
                    }
                }
            }

            // Update Zombies & Populate Hit Pool
            const anyWallAlive = !!this.getActiveBlockingLayer();
            const callbacks = {
                preventBlink: anyWallAlive,
                allowProjectiles: !(this.modifiers.noProjectiles || (this.modifiers.noProjectilesUntil20 && this.wave < 20)),
                getTarget: (z) => this._getZombieTarget(z),
                onAttackCustomTarget: (z, tgt) => {
                    if (tgt.kind === 'layer') {
                        this.damageDefenseLayer(tgt.layerObj, Math.round(z.damage * 0.65));
                        if (this.modifiers.vampiric) z.hp = Math.min(z.maxHp, z.hp + z.maxHp * 0.08);
                    } else if (tgt.kind === 'dog' && tgt.dog) {
                        tgt.dog.hp -= Math.round(z.damage * 0.45);
                    } else if (tgt.kind === 'decoy' && tgt.dep) {
                        tgt.dep.hp -= Math.round(z.damage * 0.55);
                        if (tgt.dep.hp <= 0) tgt.dep.alive = false;
                    } else if (tgt.kind === 'heart') {
                        this.damageHeart(Math.round(z.damage * 0.35));
                    }
                },
                onMeleePlayer: (z) => {
                    BO.Player.takeDamage(z.damage, z.pos, false);
                    if (this.modifiers.vampiric) z.hp = Math.min(z.maxHp, z.hp + z.maxHp * 0.12);
                }
            };

            const hitMeshes = [];
            for (let i = this.zombies.length - 1; i >= 0; i--) {
                const z = this.zombies[i];
                const keep = z.update(dt, this.zombies, callbacks);
                if (!keep) {
                    z.destroy();
                    this.zombies.splice(i, 1);
                    continue;
                }
                if (z.alive) {
                    const ms = z.getHitboxMeshes();
                    for (let m = 0; m < ms.length; m++) hitMeshes.push(ms[m]);
                }
            }
            BO.Combat.setTargetPool(hitMeshes);
        }

        getPromptText() {
            if (!this.active) return null;
            const P = BO.Player;
            if (BO.Net && BO.Net.active && P) {
                const downed = BO.Net.getDownedTeammateNear(P.pos);
                if (downed) return { text: `[E] REVIVE ${downed.callsign}`, affordable: true };
            }

            const inter = this.activePrompt;
            if (inter) {
                if (inter.type === 'td_tower_lift') {
                    return { text: `[E] ${inter.towerLabel} SKY-LIFT — SELECT ANY OF 6 HEIGHTS (5m TO 25m)!`, affordable: true };
                }
                if (inter.type === 'td_perk_kiosk') {
                    if (this.modifiers.noPerks) return { text: `PERK KIOSK DISABLED (NO PERKS MODIFIER)`, affordable: false };
                    return { text: `[E] OPEN WUNDERFIZZ MASTER PERK KIOSK (ALL 14 PERKS • ${P.zombiePerks.size}/8 EQUIPPED)`, affordable: true };
                }
                if (inter.type === 'td_jump_pad') {
                    return { text: `[E] ZIP LAUNCH → ${inter.label}`, affordable: true };
                }
                if (inter.type === 'td_attachment_station') {
                    return { text: `[E] OPEN GUNSMITH ATTACHMENT WORKBENCH`, affordable: true };
                }
                if (inter.type === 'td_custom_class_station') {
                    const cost = this.getCost(1000);
                    return { text: `[E] CUSTOM CLASS ARMORY — PAY ${cost} GOLD TO EQUIP ANY CUSTOM CLASS`, affordable: this.gold >= cost };
                }
                if (inter.type === 'td_tower_arrow_gun') {
                    const cost = this.getCost(400);
                    return { text: `[E] FIRE ${inter.label} (${cost} GOLD — 15-ARROW BARRAGE + 30s AUTO-BALLISTA)`, affordable: this.gold >= cost };
                }
                if (inter.type === 'td_tower_turret') {
                    const cost = this.getCost(600);
                    const key = `${inter.x.toFixed(1)}_${inter.z.toFixed(1)}`;
                    const ex = this.towerTurretMap && this.towerTurretMap[key];
                    return {
                        text: ex
                            ? `[E] UPGRADE ${inter.label} TO LVL ${(ex.level || 1) + 1} (${cost} GOLD)`
                            : `[E] ACTIVATE ${inter.label} (${cost} GOLD — AUTO-FIRE SKY TURRET)`,
                        affordable: this.gold >= cost
                    };
                }
                if (inter.type === 'td_overdrive_gong') {
                    return this.overdriveCooldown > 0
                        ? { text: `CASTLE WAR GONG RECHARGING (${Math.ceil(this.overdriveCooldown)}s)`, affordable: false }
                        : { text: `[E] RING CASTLE OVERDRIVE WAR GONG (15s 2X FIRE RATE + 2X TURRETS!)`, affordable: true };
                }
                if (inter.type === 'perk') {
                    if (this.modifiers.noPerks) return { text: `PERK MACHINES DISABLED (NO PERKS MODIFIER)`, affordable: false };
                    const pk = inter.data;
                    const cost = this.modifiers.freePerks ? 0 : this.getCost(pk.cost);
                    if (P.zombiePerks.has(pk.id)) return { text: `${pk.name.toUpperCase()} ALREADY EQUIPPED (${P.zombiePerks.size}/8)`, affordable: false };
                    if (P.zombiePerks.size >= 8) return { text: `MAX 8/8 PERKS EQUIPPED`, affordable: false };
                    return { text: `[E] DRINK ${pk.name.toUpperCase()} (${cost} GOLD) — ${pk.desc}`, affordable: this.gold >= cost };
                }
                if (inter.type === 'pack_a_punch') {
                    const w = P.activeWeapon;
                    const curTier = w ? (w.papTier || 0) : 3;
                    if (curTier >= 3) return { text: `${w.stats.name.toUpperCase()} MAXED (TIER III)`, affordable: false };
                    const basePap = curTier === 0 ? 3000 : (curTier === 1 ? 6000 : 10000);
                    const cost = this.getCost(basePap);
                    return { text: `[E] PACK-A-PUNCH TIER ${curTier + 1} (${cost} GOLD) — ${w.stats.shortName}`, affordable: this.gold >= cost };
                }
                if (inter.type === 'mystery_box') {
                    const cost = this.getCost(950);
                    if (inter.state === 'idle') return { text: `[E] MYSTERY BOX (${cost} GOLD)`, affordable: this.gold >= cost };
                    if (inter.state === 'ready' && inter.rolledWeaponId) return { text: `[E] TAKE ${BO.WeaponsData.get(inter.rolledWeaponId).shortName}`, affordable: true };
                    return { text: 'MYSTERY BOX ROLLING...', affordable: true };
                }
            }

            if (this.shopkeeperObj) {
                const sk = this.shopkeeperObj;
                if (BO.Math.dist3D(P.pos.x, P.pos.y, P.pos.z, sk.x, sk.y, sk.z) <= 3.6) {
                    return {
                        text: this.state === 'intermission'
                            ? `[E] or [T] OPEN SHOPKEEPER • [N] SKIP WAIT (${Math.ceil(this.intermissionTimer)}s)`
                            : 'SHOPKEEPER OPENS BETWEEN WAVES',
                        affordable: this.state === 'intermission'
                    };
                }
            }
            if (this.state === 'intermission') {
                return {
                    text: `INTERMISSION ${Math.ceil(this.intermissionTimer)}s • [T] SHOPKEEPER • [N] SKIP WAIT`,
                    affordable: true
                };
            }
            return null;
        }

        _endMatch(victory, title) {
            if (this.ended) return;
            this.ended = true;
            BO.Progression.grantPlayerXP(this.wave * 150 + this.kills * 15);
            BO.Progression.flushSave();
            BO.Events.emit('match:ended', {
                mode: 'td',
                victory,
                title: title || (victory ? 'CASTLE DEFENDED' : 'CASTLE FALLEN'),
                mapName: BO.World.mapData.name,
                wave: this.wave,
                kills: this.kills,
                headshots: this.headshots,
                score: this.gold,
                time: BO.Math.formatTime(this.elapsed)
            });
        }
    }

    BO.TowerDefenseMode = new TowerDefenseMode();
})(window);
