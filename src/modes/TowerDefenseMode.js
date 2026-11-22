/* ============================================================================
   BLACKOUT OPS — Brand New Mode: TOWER DEFENSE
   - Defend your 3D Castle Keep across 3 Setups:
       Castle 1: Zombies come ONLY from the Front
       Castle 2: Zombies come from the Sides & Front
       Castle 3: Zombies come from ALL Directions (360°)
   - 3 Defense Wall Layers (250 HP each) protecting the Stairs & Heart (100 HP)
   - Spawn on top of the Castle looking down, with walkable stairs down to battle
   - Wave scaling (+1 zombie type every 3 rounds, Bosses chance starting Round 10)
   - 30-second Intermission (Skippable [N] / UI button) + Interactive Shopkeeper
     selling 5 rolled Weapons (60%/10%/5%/15%/5% FREE/5% Magic) + Barriers,
     Turrets, Ammo, Grenades, RPGs, Temporary Teammate, Guard Dog, & Minigun!
============================================================================ */
(function (global) {
    'use strict';

    const BO = global.BO;

    const SHOP_ITEMS = [
        { id: 'barrier', name: 'REPAIR / REBUILD BARRIERS', cost: 450, desc: 'Restores +125 HP to damaged Defense Wall Layers (or rebuilds a destroyed layer starting from Layer 3/2/1).' },
        { id: 'turret', name: 'DEPLOY SENTRY TURRET', cost: 850, desc: 'Builds an automated 3D twin-barrel sentry gun that locks onto and shreds approaching zombies!' },
        { id: 'ammo', name: 'MAX AMMO REFILL', cost: 300, desc: 'Completely refills magazine & reserve ammo for all equipped weapons.' },
        { id: 'grenades', name: 'GRENADES & TACTICALS', cost: 280, desc: 'Refills all Frag/C4/Napalm Grenades and Tactical items.' },
        { id: 'rpg', name: 'RPG-7 WARHEAD LAUNCHER', cost: 800, desc: 'Equips the RPG-7 Rocket Launcher (or refills rockets if already owned)!' },
        { id: 'teammate', name: 'TEMPORARY TEAMMATE', cost: 1000, desc: 'Deploys an Allied Marine soldier who fights alongside your castle for 2 full waves!' },
        { id: 'dog', name: 'ARMORED GUARD DOG', cost: 700, desc: 'Summons an armored K9 hound that chases, bites & stuns zombies until its 300 HP runs out!' },
        { id: 'minigun', name: 'M134 DEATH MACHINE (MINIGUN)', cost: 1450, desc: 'Equips the 6-barrel 1,400 RPM rotary Minigun with 200-round drum!' }
    ];

    class TowerDefenseMode {
        constructor() {
            this.active = false;
            this.mapId = 'td_castle_1';
            this.wave = 1;
            this.gold = 650;
            this.kills = 0;
            this.headshots = 0;
            this.elapsed = 0;

            this.heartHp = 100;
            this.heartMaxHp = 100;
            this.heartObj = null;

            this.layers = []; // { layer, name, hp, maxHp, active, segments: [ { mesh, gateMesh, collider, x, y, z, w, h, d } ] }
            this.zombies = [];
            this.nextZombieId = 1;

            this.turrets = [];
            this.dogs = [];
            this.allies = [];
            this.shopkeeperObj = null;

            this.shopWeapons = []; // 5 rolled weapon offers
            this.state = 'intermission'; // 'intermission' | 'spawning' | 'fighting'
            this.intermissionTimer = 30.0;
            this.waveTotal = 0;
            this.remainingToSpawn = 0;
            this.spawnCooldown = 0;
            this.firstWaveStarted = false;
            this.ended = false;
        }

        getShopItems() {
            return SHOP_ITEMS;
        }

        rollFiveShopWeapons() {
            const P = BO.WeaponsData.POOLS;
            const offers = [];
            for (let i = 0; i < 5; i++) {
                const r = Math.random() * 100;
                let wId;
                let cost;
                let badge;
                let color;
                if (r < 60) {
                    wId = BO.Math.pick(P.commonGun);
                    cost = 550;
                    badge = 'COMMON (60%)';
                    color = '#cbd5e1';
                } else if (r < 70) {
                    wId = BO.Math.pick(P.commonMelee);
                    cost = 400;
                    badge = 'COMMON MELEE (10%)';
                    color = '#a3e635';
                } else if (r < 75) {
                    wId = BO.Math.pick(P.uncommonMelee);
                    cost = 700;
                    badge = 'UNCOMMON MELEE (5%)';
                    color = '#f59e0b';
                } else if (r < 90) {
                    wId = BO.Math.pick(P.uncommonGun);
                    cost = 900;
                    badge = 'UNCOMMON (15%)';
                    color = '#38bdf8';
                } else if (r < 95) {
                    const freePool = P.commonGun.concat(P.uncommonGun, P.commonMelee, P.uncommonMelee);
                    wId = BO.Math.pick(freePool);
                    cost = 0;
                    badge = 'FREE WEAPON (5%)';
                    color = '#22c55e';
                } else {
                    wId = BO.Math.pick(P.magic);
                    cost = 1500;
                    badge = 'MAGIC WEAPON (5%)';
                    color = '#c084fc';
                }
                const spec = BO.WeaponsData.get(wId);
                offers.push({ slotIndex: i, weaponId: wId, spec, cost, badge, color, sold: false });
            }
            this.shopWeapons = offers;
            return offers;
        }

        start(opts) {
            this.active = true;
            this.mapId = opts.mapId || 'td_castle_1';
            this.wave = 1;
            this.gold = 650;
            this.kills = 0;
            this.headshots = 0;
            this.elapsed = 0;
            this.ended = false;
            this.firstWaveStarted = false;

            this.heartMaxHp = 100;
            this.heartHp = 100;

            this.zombies = [];
            this.turrets = [];
            this.dogs = [];
            this.allies = [];
            this.layers = [];

            const scene = BO.World.build(this.mapId);
            const map = BO.World.mapData;
            const loadout = BO.Loadout.getActiveClass();

            BO.Player.initForMatch('td', map.playerSpawn, loadout, false);
            BO.Combat.reset(opts.camera);
            BO.Combat.onHitEnemy = (ent, dmg, hitbox, dist, w, pt, dir) => this._onBulletHit(ent, dmg, hitbox, w, pt);
            BO.Combat.onExplodeAt = (pos, rad, dmg, owner, isFlash, stunDur, wid) => this._onExplode(pos, rad, dmg, isFlash, stunDur, wid);
            BO.Combat.onActivateKillstreak = null;

            this._buildCastleStructures(scene, map);
            this.rollFiveShopWeapons();

            // Start Wave 1 after brief 8s warm-up countdown (or skip anytime with [N]!)
            this.state = 'intermission';
            this.intermissionTimer = 10.0;
            BO.Sound.startMusic('zombies');
            BO.Events.emit('hud:banner', {
                title: map.name,
                sub: 'DEFEND THE 3 WALL LAYERS & 100 HP CASTLE HEART! PRESS [E]/[T] FOR SHOPKEEPER • [N] SKIP WAIT',
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
            const sk = map.shopkeeperPos || { x: 3.5, y: 5.4, z: 11.5, rotY: -Math.PI * 0.4 };
            const shopBuilt = BO.CharacterMesh.buildShopkeeper();
            shopBuilt.root.position.set(sk.x, sk.y, sk.z);
            shopBuilt.root.rotation.y = sk.rotY || 0;
            scene.add(shopBuilt.root);
            this.shopkeeperObj = { x: sk.x, y: sk.y, z: sk.z, mesh: shopBuilt.root };

            // 3. Three Sequential SEE-THROUGH & SHOOT-THROUGH Defense Wall Layers (250 HP each)
            //    Translucent energy/glass barrier panes framed with steel rails & posts so you can
            //    see and shoot cleanly through every layer while zombies are physically blocked!
            const LAYER_COLORS = { 1: 0x22c55e, 2: 0x38bdf8, 3: 0xf59e0b };
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.72, roughness: 0.35 });
            const defs = map.defenseLayers || [];
            this.layers = defs.map((dl) => {
                const baseHex = LAYER_COLORS[dl.layer] || 0x38bdf8;
                const segObjs = [];
                for (const s of dl.segments) {
                    const segGroup = new THREE.Group();

                    // Crystal-clear translucent see-through barrier pane (NOT added to worldMeshes -> 100% shoot-through!)
                    const paneMat = new THREE.MeshStandardMaterial({
                        color: baseHex,
                        emissive: baseHex,
                        emissiveIntensity: 0.35,
                        transparent: true,
                        opacity: 0.24,
                        roughness: 0.12,
                        metalness: 0.15,
                        depthWrite: false,
                        side: THREE.DoubleSide
                    });
                    const pane = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h - 0.36, Math.min(s.d, 0.32)), paneMat);
                    pane.position.set(s.x, s.y + s.h * 0.5, s.z);
                    pane.renderOrder = 2;
                    segGroup.add(pane);

                    // Steel bottom curb & glowing top rail
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

                    // Spaced vertical steel posts along the barrier length for clear depth & fortification silhouette
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
                        enemiesOnly: true,
                        active: true
                    };
                    BO.World.colliders.push(col);

                    segObjs.push({
                        x: s.x, y: s.y, z: s.z, w: s.w, h: s.h, d: s.d,
                        mesh: segGroup, glowStrip, mat: paneMat, baseHex, collider: col
                    });
                }
                return {
                    layer: dl.layer,
                    name: dl.name,
                    hp: dl.maxHp || 250,
                    maxHp: dl.maxHp || 250,
                    active: true,
                    segments: segObjs
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

        _pickBossForWave(wave) {
            // Easier bosses unlocked at Round 10 first; harder bosses added at higher waves!
            const pool = [BO.ZombiesData.BOSSES_BY_ROUND[5]]; // Butcher (easiest boss)
            if (wave >= 14) pool.push(BO.ZombiesData.BOSSES_BY_ROUND[10]); // Cerberus
            if (wave >= 18) pool.push(BO.ZombiesData.BOSSES_BY_ROUND[20]); // Dr. Plague
            if (wave >= 24) pool.push(BO.ZombiesData.BOSSES_BY_ROUND[25]); // Iron Colossus
            if (wave >= 30) pool.push(BO.ZombiesData.BOSSES_BY_ROUND[50]); // Overlord Nyx
            return BO.Math.pick(pool.filter(Boolean));
        }

        _beginNextWave() {
            if (this.firstWaveStarted) this.wave++;
            this.firstWaveStarted = true;

            this.waveTotal = Math.round(7 + this.wave * 3.8);
            this.remainingToSpawn = this.waveTotal;
            this.spawnCooldown = 0.6;
            this.state = 'spawning';

            // Decay Temporary Teammates (each lasts 2 full waves)
            for (let i = this.allies.length - 1; i >= 0; i--) {
                this.allies[i].wavesLeft--;
                if (this.allies[i].wavesLeft <= 0) {
                    if (BO.World.scene && this.allies[i].parts?.root) BO.World.scene.remove(this.allies[i].parts.root);
                    this.allies.splice(i, 1);
                }
            }

            // Boss Zombies have a chance starting at Round 10!
            if (this.wave >= 10) {
                const bossChance = this.wave === 10 ? 1.0 : BO.Math.clamp(0.32 + (this.wave - 10) * 0.04, 0.32, 0.90);
                if (Math.random() < bossChance) {
                    const count = this.wave >= 28 ? 2 : 1;
                    for (let c = 0; c < count; c++) this._spawnBossZombie();
                }
            }

            const newUnlock = BO.ZombiesData.getNewlyUnlockedForRound(this.wave);
            BO.Sound.playRoundStart(this.wave, false);
            BO.Events.emit('hud:banner', {
                title: `WAVE ${this.wave} INCOMING`,
                sub: newUnlock ? `NEW ENEMY UNLOCKED: ${newUnlock.name}!` : `${this.waveTotal} HOSTILES APPROACHING`,
                color: '#dc2626'
            });
        }

        _spawnBossZombie() {
            const spawners = BO.World.mapData.spawners || [{ x: 0, y: 0, z: -26 }];
            const sp = BO.Math.pick(spawners);
            const bossSpec = this._pickBossForWave(this.wave);
            if (!bossSpec) return;
            const scaleHp = Math.round(bossSpec.hp * (0.65 + (this.wave - 10) * 0.05));
            const ent = new BO.ZombieEntity({
                id: this.nextZombieId++,
                spec: bossSpec,
                round: this.wave,
                hp: scaleHp,
                speed: bossSpec.speed,
                damage: bossSpec.attack,
                x: sp.x, y: sp.y || 0, z: sp.z
            });
            this.zombies.push(ent);
            BO.Sound.playBossIntro();
            BO.Events.emit('hud:toast', { text: `⚠ BOSS DEPLOYED: ${bossSpec.name}!`, color: '#f87171' });
        }

        _spawnWaveZombie() {
            const spawners = BO.World.mapData.spawners || [{ x: 0, y: 0, z: -26 }];
            const sp = BO.Math.pick(spawners);
            const spec = BO.ZombiesData.pickWeightedZombie(this.wave);
            const hpScale = Math.round(spec.hp * (0.85 + this.wave * 0.14));
            const ent = new BO.ZombieEntity({
                id: this.nextZombieId++,
                spec,
                round: this.wave,
                hp: hpScale,
                speed: Math.min(5.2, spec.speed * (1 + Math.min(0.35, this.wave * 0.015))),
                damage: spec.attack,
                x: sp.x + BO.Math.randRange(-1.2, 1.2),
                y: sp.y || 0,
                z: sp.z + BO.Math.randRange(-1.2, 1.2)
            });
            this.zombies.push(ent);
        }

        skipIntermission() {
            if (!this.active || this.state !== 'intermission') return;
            BO.Sound.playUIClick();
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

        buyShopItem(itemId) {
            if (this.state !== 'intermission') {
                BO.Events.emit('hud:toast', { text: 'SHOP IS ONLY OPEN BETWEEN WAVES!', color: '#ef4444' });
                return false;
            }
            const item = SHOP_ITEMS.find((x) => x.id === itemId);
            if (!item) return false;
            if (this.gold < item.cost) {
                BO.Sound.playEmptyClick();
                BO.Events.emit('hud:toast', { text: `NEED ${item.cost} GOLD FOR ${item.name}!`, color: '#ef4444' });
                return false;
            }

            if (itemId === 'barrier') {
                // Heal highest-priority damaged or destroyed layer (3 -> 2 -> 1)
                let targetLayer = null;
                for (let i = this.layers.length - 1; i >= 0; i--) {
                    if (this.layers[i].hp < this.layers[i].maxHp) {
                        targetLayer = this.layers[i];
                        break;
                    }
                }
                if (!targetLayer) {
                    BO.Events.emit('hud:toast', { text: 'ALL 3 DEFENSE LAYERS ALREADY AT 250 HP!', color: '#facc15' });
                    return false;
                }
                this.gold -= item.cost;
                targetLayer.hp = Math.min(targetLayer.maxHp, targetLayer.hp + 125);
                this._syncLayerVisual(targetLayer);
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: `REPAIRED ${targetLayer.name} (${targetLayer.hp}/${targetLayer.maxHp} HP)!`, color: '#22c55e' });
                return true;
            }

            if (itemId === 'turret') {
                const pads = BO.World.mapData.turretPads || [];
                if (this.turrets.length >= pads.length) {
                    // Upgrade existing turrets instead!
                    this.gold -= item.cost;
                    for (const t of this.turrets) {
                        t.damage = Math.round(t.damage * 1.35);
                        t.interval = Math.max(0.10, t.interval * 0.8);
                    }
                    BO.Sound.playShopBuy();
                    BO.Events.emit('hud:toast', { text: 'ALL TURRETS UPGRADED (+35% DMG & FASTER FIRE)!', color: '#38bdf8' });
                    return true;
                }
                this.gold -= item.cost;
                const pad = pads[this.turrets.length];
                const tm = BO.CharacterMesh.buildSentryTurret();
                tm.root.position.set(pad.x, pad.y, pad.z);
                BO.World.scene.add(tm.root);
                this.turrets.push({
                    x: pad.x, y: pad.y, z: pad.z,
                    mesh: tm.root, headGroup: tm.headGroup,
                    damage: 45, interval: 0.24, cooldown: 0
                });
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: `SENTRY TURRET #${this.turrets.length} DEPLOYED!`, color: '#38bdf8' });
                return true;
            }

            if (itemId === 'ammo') {
                this.gold -= item.cost;
                for (const w of BO.Player.weapons) {
                    w.mag = w.stats.magSize;
                    w.reserve = w.stats.reserveMax;
                }
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: 'ALL AMMUNITION REFILLED!', color: '#22c55e' });
                return true;
            }

            if (itemId === 'grenades') {
                this.gold -= item.cost;
                BO.Player.lethalCount = BO.AttachmentsData.LETHALS[BO.Player.lethalId]?.count || 2;
                BO.Player.tacticalCount = BO.AttachmentsData.TACTICALS[BO.Player.tacticalId]?.count || 2;
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: 'GRENADES & TACTICALS REFILLED!', color: '#f97316' });
                return true;
            }

            if (itemId === 'rpg') {
                this.gold -= item.cost;
                BO.Player.giveWeapon('rpg7_warhead', false, false);
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: 'RPG-7 WARHEAD EQUIPPED!', color: '#f59e0b' });
                return true;
            }

            if (itemId === 'teammate') {
                this.gold -= item.cost;
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
                return true;
            }

            if (itemId === 'dog') {
                this.gold -= item.cost;
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
                return true;
            }

            if (itemId === 'minigun') {
                this.gold -= item.cost;
                BO.Player.giveWeapon('minigun_death', false, false);
                BO.Sound.playShopBuy();
                BO.Events.emit('hud:toast', { text: 'M134 DEATH MACHINE MINIGUN EQUIPPED!', color: '#fde047' });
                return true;
            }
            return false;
        }

        _onBulletHit(zombie, dmg, hitbox, weaponInst) {
            if (!zombie || !zombie.alive) return false;
            const killed = zombie.takeDamage(dmg, hitbox, hitbox === 'head', null, 'bullet');
            this.gold += killed ? 45 : 10;
            if (killed) {
                this.kills++;
                if (hitbox === 'head') this.headshots++;
                BO.Progression.grantPlayerXP(zombie.isBoss ? 300 : 55);
            }
            return killed;
        }

        _onExplode(pos, rad, dmg, isFlash, stunDur, wid) {
            let kills = 0;
            for (const z of this.zombies) {
                if (!z.alive) continue;
                const d = z.pos.distanceTo(pos);
                if (d <= rad) {
                    if (isFlash || wid === 'cryo_nova') {
                        z.stunTimer = Math.max(z.stunTimer, stunDur || 4.0);
                    } else if (z.takeDamage(dmg * (1 - (d / rad) * 0.45), 'torso', false, null, 'explosive')) {
                        kills++;
                        this.kills++;
                        this.gold += 45;
                    }
                }
            }
            if (kills > 0) BO.Events.emit('hud:hitmarker', { isHeadshot: false, isKill: true });
        }

        _getZombieTarget(z) {
            // Engage nearby Guard Dogs or nearby Player first (even when walls are intact)
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
                // Find nearest segment & clamp to nearest point along that wall!
                let bestSeg = layer.segments[0];
                let bestDist = Infinity;
                let bestPtX = 0, bestPtZ = 0;
                for (const s of layer.segments) {
                    const cx = BO.Math.clamp(z.pos.x, s.x - s.w * 0.5, s.x + s.w * 0.5);
                    const cz = BO.Math.clamp(z.pos.z, s.z - s.d * 0.5, s.z + s.d * 0.5);
                    const d = BO.Math.dist2D(z.pos.x, z.pos.z, cx, cz);
                    if (d < bestDist) {
                        bestDist = d;
                        bestSeg = s;
                        bestPtX = cx;
                        bestPtZ = cz;
                    }
                }
                return {
                    kind: 'layer',
                    layerObj: layer,
                    x: bestPtX,
                    y: bestSeg ? bestSeg.y : 0,
                    z: bestPtZ,
                    attackRange: 1.55,
                    forceDirect: true
                };
            }

            // All 3 Layers Destroyed -> Target Guard Dog if close, else Castle Heart via stairs!
            for (const dog of this.dogs) {
                if (dog.hp > 0 && dog.pos.distanceTo(z.pos) < 5.5) {
                    return { kind: 'dog', dog, x: dog.pos.x, y: dog.pos.y, z: dog.pos.z, attackRange: 1.45, forceDirect: true };
                }
            }

            if (BO.Player.alive && BO.Player.pos.distanceTo(z.pos) < 6.5 && Math.abs(BO.Player.pos.y - z.pos.y) < 1.8) {
                return null; // Chase player directly on same elevation!
            }

            // Bulletproof Castle Stair-Climbing Guidance once all 3 Layers fall!
            const ch = this.heartObj || { x: 0, y: 5.4, z: 19.0 };
            if (z.pos.y < 4.9) {
                const map = BO.World.mapData;
                const stairsList = (map && map.stairs && map.stairs.length > 0)
                    ? map.stairs
                    : [{ bot: map.stairBottomPoint || { x: 0, y: 0, z: -5.0 }, top: map.stairTopPoint || { x: 0, y: 5.4, z: 8.6 }, halfWidth: 3.1 }];
                let bestStair = stairsList[0];
                let bestD = Infinity;
                for (const st of stairsList) {
                    const d = BO.Math.dist2D(z.pos.x, z.pos.z, st.bot.x, st.bot.z);
                    if (d < bestD) { bestD = d; bestStair = st; }
                }
                const bot = bestStair.bot;
                const top = bestStair.top;
                const hw = bestStair.halfWidth || 2.8;
                const minZ = Math.min(bot.z, top.z) - 1.5;
                const maxZ = Math.max(bot.z, top.z) + 1.5;
                const alignedOnStairs = Math.abs(z.pos.x - bot.x) <= hw && z.pos.z >= minZ && z.pos.z <= maxZ;

                if (alignedOnStairs) {
                    // Climb straight up the center of the Castle staircase onto the y=5.4 Keep Deck!
                    return { kind: 'climb', x: top.x, y: top.y, z: top.z, attackRange: 0, forceDirect: true };
                }
                // First route cleanly to the foot of the Castle staircase (uses waypoints if around the side of Keep)
                const hasClearLineToBot = BO.World.hasLineOfSight(z.pos.x, z.pos.y + 1.0, z.pos.z, bot.x, bot.y + 1.0, bot.z);
                return { kind: 'stair_entry', x: bot.x, y: bot.y, z: bot.z, attackRange: 0, forceDirect: hasClearLineToBot };
            }

            // On the Castle Keep top deck (y >= 4.9) -> march directly to attack the 100 HP Castle Heart!
            return { kind: 'heart', x: ch.x, y: ch.y, z: ch.z, attackRange: 2.2, forceDirect: true };
        }

        update(dt) {
            if (!this.active || this.ended) return;
            this.elapsed += dt;

            // Animate Castle Heart Crystal
            if (this.heartObj) {
                this.heartObj.crystal.rotation.y += dt * 1.8;
                this.heartObj.halo.rotation.z += dt * 1.4;
                const hpFrac = this.heartHp / Math.max(1, this.heartMaxHp);
                this.heartObj.crystal.material.color.setHex(hpFrac < 0.35 ? 0xef4444 : (hpFrac < 0.65 ? 0xf59e0b : 0x38bdf8));
            }

            if (!BO.Player.alive) {
                this._endMatch(false, 'COMMANDER FALLEN');
                return;
            }

            // Wave State Machine
            if (this.state === 'intermission') {
                this.intermissionTimer -= dt;
                if (this.intermissionTimer <= 0) {
                    this._beginNextWave();
                }
            } else if (this.state === 'spawning') {
                this.spawnCooldown -= dt;
                const aliveCount = this.zombies.filter((z) => z.alive).length;
                if (this.remainingToSpawn > 0 && this.spawnCooldown <= 0 && aliveCount < 24) {
                    this._spawnWaveZombie();
                    this.remainingToSpawn--;
                    this.spawnCooldown = Math.max(0.32, 1.15 - this.wave * 0.03);
                }
                if (this.remainingToSpawn <= 0) this.state = 'fighting';
            } else if (this.state === 'fighting') {
                if (!this.zombies.some((z) => z.alive)) {
                    const bonus = 250 + this.wave * 60;
                    this.gold += bonus;
                    BO.Sound.playRoundEnd();
                    this.rollFiveShopWeapons();
                    this.state = 'intermission';
                    this.intermissionTimer = 30.0;
                    BO.Events.emit('hud:banner', {
                        title: `WAVE ${this.wave} CLEARED! +${bonus} GOLD`,
                        sub: '30s INTERMISSION — SHOPKEEPER OPEN ([T] OR [E] NEAR STALL • [N] SKIP WAIT)',
                        color: '#22c55e'
                    });
                }
            }

            // Update Turrets
            const livingZ = this.zombies.filter((z) => z.alive);
            for (const t of this.turrets) {
                if (t.cooldown > 0) t.cooldown -= dt;
                let nearest = null, bestD = 78;
                for (const z of livingZ) {
                    const d = BO.Math.dist3D(t.x, t.y + 1, t.z, z.pos.x, z.pos.y + 1, z.pos.z);
                    if (d < bestD && BO.World.hasLineOfSight(t.x, t.y + 1.15, t.z, z.pos.x, z.pos.y + 1.0, z.pos.z)) {
                        bestD = d;
                        nearest = z;
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
                            this.gold += 35;
                        }
                    }
                }
            }

            // Update Armored Guard Dogs (Defends until HP runs out!)
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
                            this.gold += 40;
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
                            this.gold += 35;
                        }
                    }
                }
            }

            // Update Zombies & Populate Hit Pool
            const anyWallAlive = !!this.getActiveBlockingLayer();
            const callbacks = {
                preventBlink: anyWallAlive,
                getTarget: (z) => this._getZombieTarget(z),
                onAttackCustomTarget: (z, tgt) => {
                    if (tgt.kind === 'layer') {
                        this.damageDefenseLayer(tgt.layerObj, Math.round(z.damage * 0.65));
                    } else if (tgt.kind === 'dog' && tgt.dog) {
                        tgt.dog.hp -= Math.round(z.damage * 0.45);
                    } else if (tgt.kind === 'heart') {
                        this.damageHeart(Math.round(z.damage * 0.35));
                    }
                },
                onMeleePlayer: (z) => {
                    BO.Player.takeDamage(z.damage, z.pos, false);
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
            if (this.shopkeeperObj) {
                const sk = this.shopkeeperObj;
                if (BO.Math.dist3D(BO.Player.pos.x, BO.Player.pos.y, BO.Player.pos.z, sk.x, sk.y, sk.z) <= 3.6) {
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
                    text: `INTERMISSION ${Math.ceil(this.intermissionTimer)}s • [T] OPEN SHOPKEEPER • [N] SKIP WAIT`,
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
