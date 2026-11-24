/* ============================================================================
   BLACKOUT OPS — Deep Survival Systems
   Sites of Grace, Aether Runes & Attributes, Talismans, Aether Flasks,
   Soul Echo Respawn, 4-Tier Tech Tree, Weapon Forging & Mk Upgrades,
   Minecraft Infusions, Base Automation (Turrets/Traps/Doors/Smelter/Hydro),
   Temperature/Hydration/Stealth/Tonics, Crimson Blood Moons & Aether Meteors.
   (Strictly ZERO pals / tamed creatures.)
============================================================================ */
(function (BO) {
    'use strict';

    const D = () => BO.SurvivalDeepData;
    const dist3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

    class SurvivalDeepSystems {
        constructor(campaign) {
            this.campaign = campaign;
            this.mode = campaign.mode;
            this.owned = new Set();
            this.ownMarkers = new Set();

            // Elden-inspired progression
            this.runes = 0;
            this.attributes = { vigor: 0, endurance: 0, strength: 0, dexterity: 0, arcane: 0 };
            this.kindledShrines = new Set();
            this.lastRestPoint = null;
            this.flaskCharges = 3;
            this.flaskMax = 3;
            this.seedsCollected = new Set();
            this.foundTalismans = new Set();
            this.equippedTalismans = [];
            this.lostEcho = null; // { x, y, z, runes, mesh, marker }

            // Tech Tree, Schematics & Infusions (Zero creatures)
            this.techPoints = campaign.has('abundantTech') ? 5 : 2;
            this.unlockedTech = new Set();
            this.unlockedSchematics = new Set(BO.SurvivalCareer.profile.blueprints || []);
            this.infusions = []; // up to 2 IDs from D().infusions

            // Survival depth statuses
            this.hydration = 100;
            this.temp = 20;
            this.comfortUntil = 0;
            this.bleeding = 0;
            this.infection = 0;
            this.activeTonics = {}; // id -> expiresAt
            this.pendingRespawn = false;

            // Automated base entities
            this.machines = []; // { piece, kind, readyAt, buffer, headGroup, fireAt, light, doorOpen }
            this.lootPouches = new Map();
            this.pouchIndex = 0;

            // World Events (strictly gated behind hostilesReleased)
            this.bloodMoonActive = false;
            this.bloodMoonUntil = 0;
            this.bloodMoonNextWave = 0;
            this.bloodMoonNightKey = -1;
            this.bloodMoonsSurvived = 0;
            this.meteor = null;
            this.nextMeteor = 185;
            this.stealthFactor = 1.0;
            this._lastAmbientTick = 0;
            this._trapTick = 0;
            this.modFx = {};
            this._computeModFx();
        }

        _computeModFx() {
            const mods = this.campaign?.options?.modifiers || [];
            const reg = BO.SurvivalRules?.modifiers || {};
            const out = {};
            const MULT_FX = new Set([
                'attrCostMult', 'bleedDecayMult', 'bleedTakenMult', 'bossHpMult', 'botHpMult',
                'comfortDurMult', 'dodgeCostMult', 'dropIntervalMult', 'enemyDmgMult', 'fistsDmgMult',
                'flatDmgMult', 'gatherMult', 'gatherSpeedMult', 'gatherYieldMult', 'headshotMult',
                'healItemMult', 'hungerDrainMult', 'hydDrainMult', 'hydroSpeedMult', 'longRangeDmgMult',
                'mealDurMult', 'meteorIntervalMult', 'mimicFreqMult', 'nightEnemySpdMult', 'noiseMult',
                'pumpSpeedMult', 'radGainMult', 'recoilMult', 'regenMult', 'runeMult',
                'schematicLuckMult', 'smelterSpeedMult', 'staminaRegenMult', 'stealthFactorMult',
                'structureHpMult', 'surveyXpMult', 'tonicDurMult', 'trapDmgMult', 'turretDmgMult',
                'upgradeCostMult', 'vehicleSpeedMult', 'weaponDmgMult', 'weatherRadMult', 'xpMult'
            ]);
            for (const id of mods) {
                const fx = reg[id]?.fx;
                if (!fx) continue;
                for (const [k, v] of Object.entries(fx)) {
                    if (typeof v === 'boolean') out[k] = out[k] || v;
                    else if (typeof v === 'number') {
                        if (MULT_FX.has(k)) out[k] = (out[k] !== undefined ? out[k] : 1) * v;
                        else out[k] = (out[k] || 0) + v;
                    }
                }
            }
            this.modFx = out;
            return out;
        }

        setup(snapshot) {
            const data = D();
            const m = this.mode;
            const mfx = this._computeModFx();
            if (!snapshot) {
                if (mfx.bonusFlasks) { this.flaskMax += mfx.bonusFlasks; this.flaskCharges = this.flaskMax; }
                if (mfx.bonusTechPts) this.techPoints += mfx.bonusTechPts;
                if (mfx.startRunes) this.runes += mfx.startRunes;
                if (mfx.startAttrArcane) this.attributes.arcane = (this.attributes.arcane || 0) + mfx.startAttrArcane;
                if (mfx.startKindledRelay) this.kindledShrines.add('relay_grace');
                if (mfx.startScarab) { this.foundTalismans.add('scavenger_scarab'); this.equippedTalismans.push('scavenger_scarab'); }
                if (mfx.startT1Fort) this.unlockedTech.add('t1_fortifications');
                if (mfx.startFortune) this.infusions.push('fortune');
                if (mfx.extraBuildKit) this.campaign.pack?.receive({ timber: 6, scrap: 8, ingot: 4, wire: 3 }, false);
                if (mfx.startFuelBonus) this.campaign.pack?.receive({ fuel: mfx.startFuelBonus }, false);
            }
            for (const shrine of data.shrines) {
                const pedestal = this._mesh(new THREE.CylinderGeometry(0.45, 0.62, 0.55, 8), 0x454e4b, shrine.x, shrine.y + 0.275, shrine.z);
                const flame = this._mesh(new THREE.OctahedronGeometry(0.22), 0x4b5563, shrine.x, shrine.y + 0.95, shrine.z,
                    { emissive: 0x334155, emissiveIntensity: 0.35 });
                const marker = this._marker('grace:' + shrine.id, shrine.name, shrine.x, shrine.y, shrine.z, 'Kindle Site of Grace', 0xfacc15);
                marker.shrineObj = { ...shrine, pedestal, flame, marker };
            }
            for (const pick of data.talismanPickups) {
                if (snapshot?.foundTalismans?.includes(pick.id)) continue;
                const tal = data.talismans[pick.id];
                const gem = this._mesh(new THREE.OctahedronGeometry(0.18), 0xfbbf24, pick.x, pick.y + 0.65, pick.z,
                    { emissive: 0xf59e0b, emissiveIntensity: 0.65 });
                const marker = this._marker('talisman:' + pick.id, tal.name, pick.x, pick.y, pick.z, 'Collect ' + tal.name, 0xfbbf24);
                marker.gem = gem;
            }
            for (const seed of data.goldenSeeds) {
                if (snapshot?.seedsCollected?.includes(seed.id)) continue;
                const tree = this._mesh(new THREE.ConeGeometry(0.26, 0.85, 6), 0xfde047, seed.x, seed.y + 0.43, seed.z,
                    { emissive: 0xeab308, emissiveIntensity: 0.55 });
                const marker = this._marker('seed:' + seed.id, seed.name, seed.x, seed.y, seed.z, 'Gather Golden Aether Seed', 0xfde047);
                marker.gem = tree;
            }
            if (snapshot) this.restore(snapshot);
            this.recomputePlayerStats();
        }

        _mesh(geo, color, x, y, z, opts = {}) {
            const mesh = this.mode.mesh(geo, color, x, y, z, opts);
            this.owned.add(mesh);
            return mesh;
        }

        _marker(id, name, x, y, z, label, color) {
            const marker = { id, name, x, y, z, label, color, alive: true };
            this.mode.markers.push(marker);
            this.ownMarkers.add(marker);
            return marker;
        }

        hasTech(id) {
            return !id || this.unlockedTech.has(id);
        }

        hasInfusion(id) {
            return this.infusions.includes(id);
        }

        hasTalisman(id) {
            return this.equippedTalismans.includes(id);
        }

        get baseLevel() {
            const types = new Set(this.campaign.placed.filter((p) => p.alive).map((p) => p.type)).size;
            return Math.min(5, 1 + Math.floor(types / 3));
        }

        get allShrines() {
            const list = [...D().shrines];
            for (const p of this.campaign.placed) {
                if (p.alive && p.type === 'beacon') {
                    list.push({ id: 'beacon_' + p.id, name: 'Homestead Grace Beacon', area: 'base', x: p.x, y: p.y, z: p.z });
                }
            }
            return list;
        }

        attributeCost() {
            const sum = Object.values(this.attributes).reduce((a, b) => a + b, 0);
            return Math.max(25, Math.round((80 + sum * 55) * (this.modFx?.attrCostMult || 1)));
        }

        upgradeAttribute(attrId) {
            if (!D().attributes[attrId]) return false;
            const cost = this.attributeCost();
            if (this.runes < cost) {
                this.mode.toast(`Need ${cost} Aether Runes.`);
                return false;
            }
            this.runes -= cost;
            this.attributes[attrId] = (this.attributes[attrId] || 0) + 1;
            this.campaign.mark('attrLevels', 1, 20);
            this.recomputePlayerStats();
            BO.Sound?.playPerkBuy?.();
            this.mode.toast(`${D().attributes[attrId].name} raised to Rank ${this.attributes[attrId]}!`);
            return true;
        }

        /** The Exclusion Zone is grounded: no runes, flask, shrines, talismans or Aether. */
        get grounded() { return !!BO.World.large; }

        awardRunes(baseAmount) {
            if (this.grounded) return;
            const mfx = this.modFx || {};
            const areaTier = this.campaign.area?.tier || 1;
            const tierMult = areaTier === 3 ? 1.75 : areaTier === 2 ? 1.35 : 1;
            const scavMult = 1 + BO.SurvivalCareer.masteryRank('scavenger') * 0.15;
            const mult = (1 + (this.attributes.arcane || 0) * 0.15) *
                (this.hasTalisman('scavenger_scarab') ? 1.35 : 1) *
                (this.campaign.has('abundantTech') ? 1.5 : 1) *
                (mfx.runeMult || 1) *
                tierMult * scavMult *
                (this.campaign.isNight && mfx.nightRuneBonus ? (1 + mfx.nightRuneBonus) : 1);
            const gained = Math.max(1, Math.round(baseAmount * mult));
            this.runes += gained;
            return gained;
        }

        grantTechPoints(n = 1) {
            const mult = this.campaign.has('abundantTech') ? 2 : 1;
            this.techPoints += n * mult;
        }

        unlockTech(techId) {
            const node = D().techTree.find((t) => t.id === techId);
            if (!node || this.unlockedTech.has(techId)) return false;
            if (this.modFx?.disableAutoTech && ['t2_automation', 't3_turrets', 't3_power'].includes(techId)) {
                this.mode.toast('Automated stations are disabled by Off-Grid Pioneer modifier.');
                return false;
            }
            if (node.req && !this.unlockedTech.has(node.req)) {
                this.mode.toast('Requires prerequisite technology first.');
                return false;
            }
            const cost = this.modFx?.maxTechCostOne ? 1 : node.cost;
            if (this.techPoints < cost) {
                this.mode.toast(`Need ${cost} Tech Point(s).`);
                return false;
            }
            this.techPoints -= cost;
            this.unlockedTech.add(techId);
            if (techId === 't2_armory') ['mp5', 'r870', 'kar98k_irons', 'deagle'].forEach((s) => this.unlockedSchematics.add(s));
            if (techId === 't3_heavy_arms') ['m4a1', 'ak47', 'spas12_tac', 'katana_carbon'].forEach((s) => this.unlockedSchematics.add(s));
            if (techId === 't4_elite_arms') ['scarh', 'intervention', 'm249', 'raygun'].forEach((s) => this.unlockedSchematics.add(s));
            this.recomputePlayerStats();
            this.campaign.mark('techUnlocked', 1, 35);
            BO.Sound?.playPerkBuy?.();
            this.mode.toast(`Researched: ${node.name}`);
            return true;
        }

        equipTalisman(id) {
            if (!this.foundTalismans.has(id)) return false;
            const idx = this.equippedTalismans.indexOf(id);
            if (idx >= 0) {
                this.equippedTalismans.splice(idx, 1);
                this.recomputePlayerStats();
                return true;
            }
            const maxTal = this.modFx?.maxTalismans || 3;
            if (this.equippedTalismans.length >= maxTal) {
                this.equippedTalismans.shift();
            }
            this.equippedTalismans.push(id);
            this.recomputePlayerStats();
            BO.Sound?.playUIClick?.();
            return true;
        }

        applyInfusion(id) {
            const spec = D().infusions[id];
            if (!spec) return false;
            if (this.infusions.includes(id)) {
                this.mode.toast(`${spec.name} is already active.`);
                return false;
            }
            const runeCost = this.modFx?.freeInfusionRunes ? 0 : 120;
            if (this.runes < runeCost || !this.mode.spend({ quartz: 2, aetherShard: 1 })) {
                this.mode.toast(`Requires 2 Luminous Quartz, 1 Aether Shard${runeCost ? `, and ${runeCost} Runes` : ''}.`);
                return false;
            }
            this.runes -= runeCost;
            const maxInf = this.modFx?.maxInfusions || 2;
            if (this.infusions.length >= maxInf) this.infusions.shift();
            this.infusions.push(id);
            this.campaign.mark('infused', 1, 45);
            this.recomputePlayerStats();
            BO.Sound?.playPaP?.();
            this.mode.toast(`Infused gear with ${spec.name}!`);
            return true;
        }

        forgeWeapon(weaponId) {
            const sch = D().weaponSchematics.find((s) => s.id === weaponId);
            if (!sch) return false;
            const isMelee = BO.WeaponsData.get(weaponId).kind === 'melee';
            if (this.campaign.has('noFirearms') && !isMelee) {
                this.mode.toast('Firearms are sealed by the Melee & Bare-Hands Honor modifier.');
                return false;
            }
            if (!this.hasTech(sch.tech) && !this.unlockedSchematics.has(sch.id)) {
                this.mode.toast('Unlock this schematic in the Tech Tree or find its blueprint first.');
                return false;
            }
            if (!this.mode.spend(sch.cost)) {
                this.mode.toast('Required: ' + BO.SurvivalItemAmounts(sch.cost));
                return false;
            }
            const p = BO.Player;
            p.giveWeapon(weaponId, false, false);
            if (p.activeWeapon && sch.ammo > 1) {
                p.activeWeapon.mag = p.activeWeapon.stats.magSize;
                p.activeWeapon.reserve = Math.min(p.activeWeapon.stats.reserveMax, sch.ammo);
            }
            this.unlockedSchematics.add(sch.id);
            BO.SurvivalCareer.unlockBlueprint(sch.id);
            this.campaign.mark('weaponsForged', 1, 60);
            BO.Sound?.playPaP?.();
            this.mode.toast(`Forged and equipped ${sch.name}!`);
            return true;
        }

        upgradeEquippedWeapon() {
            if (!this.hasTech('t2_gunsmith')) {
                this.mode.toast('Research Weapon Mk II/III Bench in Tech Tree first.');
                return false;
            }
            const w = BO.Player.activeWeapon;
            if (!w || w.stats.kind === 'melee') {
                this.mode.toast('Hold a firearm (slot 1 or 2) to upgrade.');
                return false;
            }
            const tier = w.survivalMk || 1;
            if (tier >= 3) {
                this.mode.toast(`${w.stats.shortName} is already Mk III!`);
                return false;
            }
            const baseCost = tier === 1 ? { ingot: 2, scrap: 3 } : { ingot: 3, aetherShard: 1, wire: 2 };
            const uMult = this.modFx?.upgradeCostMult || 1;
            const cost = uMult < 1 ? Object.fromEntries(Object.entries(baseCost).map(([k, v]) => [k, Math.max(1, Math.round(v * uMult))])) : baseCost;
            if (!this.mode.spend(cost)) {
                this.mode.toast('Required: ' + BO.SurvivalItemAmounts(cost));
                return false;
            }
            w.survivalMk = tier + 1;
            const dmgMult = w.survivalMk === 2 ? 1.24 : 1.48;
            const magMult = w.survivalMk === 2 ? 1.20 : 1.40;
            w.stats.damage = Math.round(w.stats.damage * (w.survivalMk === 2 ? 1.24 : 1.19));
            w.stats.magSize = Math.ceil(w.stats.magSize * (w.survivalMk === 2 ? 1.20 : 1.16));
            w.stats.reloadTime = Number((w.stats.reloadTime * 0.88).toFixed(2));
            w.mag = w.stats.magSize;
            this.campaign.mark('weaponsUpgraded', 1, 50);
            BO.Sound?.playPaP?.();
            this.mode.toast(`${w.stats.shortName} upgraded to Mk ${w.survivalMk}!`);
            return true;
        }

        useFlask() {
            const p = BO.Player;
            if (!this.mode.active || !p.alive) return false;
            if (this.grounded) {
                // Quick field medicine: the best item for the situation.
                const inv = this.mode.points;
                const pick = this.bleeding > 0 && (inv.bandage || 0) > 0 ? 'bandage'
                    : p.hp < p.maxHp * 0.6 && (inv.medkits || 0) > 0 ? 'medkits'
                    : (inv.bandage || 0) > 0 && p.hp < p.maxHp ? 'bandage'
                    : (inv.medkits || 0) > 0 && p.hp < p.maxHp ? 'medkits'
                    : this.mode.fracture && (inv.splint || 0) > 0 ? 'splint' : null;
                if (!pick) { this.mode.toast(p.hp >= p.maxHp && this.bleeding <= 0 ? 'You are not hurt.' : 'No bandages or medkits. Craft bandages from cloth.'); return false; }
                return this.mode.consume(pick);
            }
            if (this.modFx?.disableFlask) {
                this.mode.toast('Aether Flask is disabled by Hollow Chalice Vow.');
                return false;
            }
            if (this.flaskCharges <= 0) {
                this.mode.toast('Aether Flask empty! Rest at a Site of Grace to refill.');
                return false;
            }
            if (p.hp >= p.maxHp && this.bleeding <= 0 && this.infection <= 0) {
                this.mode.toast('Health is already full.');
                return false;
            }
            this.flaskCharges--;
            const healAmt = 50 + (this.attributes.arcane || 0) * 5 + (this.hasTalisman('crimson_medallion') ? 10 : 0) + (this.modFx?.flaskHealAdd || 0);
            const actual = Math.min(p.maxHp - p.hp, healAmt);
            p.hp += actual;
            this.bleeding = 0;
            this.infection = Math.max(0, this.infection - 35);
            this.campaign.mark('healed', Math.ceil(actual), 0);
            BO.Sound?.playPerkBuy?.();
            BO.FX?.spawnParticles?.(p.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 14, 0x4ade80, 2.5, -1, 0.5);
            this.mode.toast(`Aether Flask used (+${Math.ceil(actual)} HP · ${this.flaskCharges}/${this.flaskMax} left)`);
            return true;
        }

        recomputePlayerStats() {
            const p = BO.Player;
            if (!p) return;
            const mfx = this.modFx || {};
            const jugBonus = this.activeTonics.jugBrew > this.mode.clock ? 75 : 0;
            const condBonus = BO.SurvivalCareer.masteryRank('conditioning') * 15;
            const baseHp = (this.campaign.has('glass') ? 70 : 100) + condBonus + (mfx.maxHpDelta || 0);
            const targetMax = baseHp + (this.attributes.vigor || 0) * 15 +
                (this.hasTalisman('crimson_medallion') ? 25 : 0) + jugBonus;
            const diff = targetMax - p.maxHp;
            p.maxHp = Math.max(40, targetMax);
            p.hp = BO.Math.clamp(p.hp + Math.max(0, diff), 1, p.maxHp);
            p.maxArmor = mfx.disableArmor ? 0 : (150 + (this.hasTech('t4_mastery') ? 50 : 0));
            if (mfx.disableArmor) { p.armor = 0; p.armorReservePlates = 0; }
        }

        registerBuild(piece) {
            const m = this.mode;
            if (['turret', 'smelter', 'hydro', 'generator', 'door', 'spikes', 'wire'].includes(piece.type)) {
                const entry = { piece, kind: piece.type, readyAt: m.clock + (piece.type === 'smelter' ? 30 : 45), buffer: 0, fireAt: 0, doorOpen: false };
                if (piece.type === 'turret') {
                    // Mount articulated swiveling twin-barrel turret head on top of base mesh
                    const head = this._mesh(new THREE.BoxGeometry(0.42, 0.30, 0.52), 0x2f4338, piece.x, piece.y + 1.12, piece.z);
                    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.48, 7), new THREE.MeshStandardMaterial({ color: 0x161a1f, metalness: 0.85 }));
                    b1.rotation.x = Math.PI * 0.5; b1.position.set(-0.08, 0.02, 0.32);
                    const b2 = b1.clone(); b2.position.x = 0.08;
                    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.05), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
                    eye.position.set(0, 0.16, 0.18);
                    head.add(b1, b2, eye);
                    entry.head = head;
                }
                if (piece.type === 'generator') {
                    const light = new THREE.PointLight(0xffd280, 1.35, 16, 1.6);
                    light.position.set(piece.x, piece.y + 1.8, piece.z);
                    m.scene.add(light);
                    entry.light = light;
                }
                if (['smelter', 'hydro', 'door'].includes(piece.type)) {
                    const labels = { smelter: 'Collect Auto-Smelter output', hydro: 'Collect Hydro-Collector water', door: 'Open / Close door' };
                    m.markers.push({ ...piece, id: 'deepbuild:' + piece.id, name: piece.type, label: labels[piece.type], alive: true });
                }
                this.machines.push(entry);
            } else if (piece.type === 'beacon') {
                const flame = this._mesh(new THREE.OctahedronGeometry(0.22), 0xfacc15, piece.x, piece.y + 1.98, piece.z,
                    { emissive: 0xf59e0b, emissiveIntensity: 0.8 });
                const marker = this._marker('grace:beacon_' + piece.id, 'Homestead Grace Beacon', piece.x, piece.y, piece.z, 'Rest at Homestead Grace', 0xfacc15);
                marker.shrineObj = { id: 'beacon_' + piece.id, name: 'Homestead Grace Beacon', x: piece.x, y: piece.y, z: piece.z, flame, marker };
                this.kindledShrines.add('beacon_' + piece.id);
                this.lastRestPoint = { x: piece.x, y: piece.y, z: piece.z };
            } else if (piece.type === 'infuser') {
                m.markers.push({ ...piece, id: 'infuser:' + piece.id, name: 'Aether Infusion Altar', label: 'Use Aether Infusion Altar', alive: true });
            }
        }

        activate(marker) {
            if (!marker) return false;
            const m = this.mode;
            if (marker.id.startsWith('grace:')) {
                const shrine = marker.shrineObj;
                if (!shrine) return false;
                const firstTime = !this.kindledShrines.has(shrine.id);
                this.kindledShrines.add(shrine.id);
                this.lastRestPoint = { x: shrine.x, y: shrine.y, z: shrine.z };
                shrine.flame.material.color.setHex(0xfde047);
                shrine.flame.material.emissive.setHex(0xf59e0b);
                shrine.flame.material.emissiveIntensity = 0.85;
                marker.label = 'Rest at ' + shrine.name;
                if (firstTime) {
                    this.grantTechPoints(1);
                    this.campaign.mark('shrinesKindled', 1, 50);
                    m.toast(`${shrine.name} kindled! +1 Tech Point & +50 XP`);
                }
                // Rest refreshes vitals & flask
                BO.Player.hp = BO.Player.maxHp;
                this.flaskCharges = this.flaskMax;
                this.bleeding = 0;
                this.infection = 0;
                this.comfortUntil = m.clock + 180;
                BO.SurvivalUI.show('shrine', null, shrine.id);
                return true;
            }
            if (marker.id.startsWith('talisman:')) {
                const id = marker.id.slice(9);
                this.foundTalismans.add(id);
                if (this.equippedTalismans.length < 3 && !this.equippedTalismans.includes(id)) {
                    this.equippedTalismans.push(id);
                }
                marker.alive = false;
                if (marker.light) marker.light.visible = false;
                if (marker.gem) marker.gem.visible = false;
                this.recomputePlayerStats();
                this.campaign.mark('talismansFound', 1, 45);
                BO.Sound?.playPerkBuy?.();
                m.toast(`Collected Talisman: ${D().talismans[id].name}!`);
                return true;
            }
            if (marker.id.startsWith('seed:')) {
                const id = marker.id.slice(5);
                if (!this.seedsCollected.has(id)) {
                    this.seedsCollected.add(id);
                    this.flaskMax = Math.min(6, this.flaskMax + 1);
                    this.flaskCharges = this.flaskMax;
                    marker.alive = false;
                    if (marker.light) marker.light.visible = false;
                    if (marker.gem) marker.gem.visible = false;
                    this.campaign.mark('goldenSeeds', 1, 55);
                    BO.Sound?.playPerkBuy?.();
                    m.toast(`Golden Aether Seed! Flask capacity upgraded to ${this.flaskMax}.`);
                }
                return true;
            }
            if (marker.id === 'soul-echo' && this.lostEcho) {
                this.runes += this.lostEcho.runes;
                m.toast(`Recovered ${this.lostEcho.runes} Lost Aether Runes!`);
                this._clearLostEcho();
                return true;
            }
            if (marker.id.startsWith('infuser:')) {
                BO.SurvivalUI.show('infuser');
                return true;
            }
            if (marker.id.startsWith('deepbuild:')) {
                const id = marker.id.slice(10);
                const entry = this.machines.find((e) => e.piece.id === id && e.piece.alive);
                if (!entry) return false;
                if (entry.kind === 'door') {
                    entry.doorOpen = !entry.doorOpen;
                    const part = m.structures.get(entry.piece.mesh);
                    if (part) {
                        part.collider.active = !entry.doorOpen;
                        entry.piece.mesh.position.y = entry.doorOpen ? entry.piece.y + 3.2 : entry.piece.y + 1.25;
                    }
                    m.toast(entry.doorOpen ? 'Reinforced door opened.' : 'Reinforced door sealed.');
                    return true;
                }
                if (entry.kind === 'smelter' || entry.kind === 'hydro') {
                    if (entry.buffer <= 0) {
                        m.toast(entry.kind === 'smelter' ? 'Auto-Smelter is refining...' : 'Hydro-Collector is condensing water...');
                        return true;
                    }
                    const items = entry.kind === 'smelter' ? { ingot: entry.buffer, scrap: entry.buffer } : { freshWater: entry.buffer };
                    entry.buffer = 0;
                    m.grant(items);
                    return true;
                }
            }
            if (marker.id.startsWith('pouch:')) {
                const pouch = this.lootPouches.get(marker.id);
                if (!pouch) return true;
                m.grant(pouch.items);
                if (pouch.runes) this.awardRunes(pouch.runes);
                if (pouch.schematic) {
                    this.unlockedSchematics.add(pouch.schematic);
                    BO.SurvivalCareer.unlockBlueprint(pouch.schematic);
                    m.toast(`Unlocked permanent blueprint: ${pouch.schematic.toUpperCase()}!`);
                }
                pouch.marker.alive = false;
                this.lootPouches.delete(marker.id);
                m.disposeOwned(pouch.mesh);
                return true;
            }
            if (marker.id === 'aether-meteor' && this.meteor) {
                m.grant({ aetherShard: 3, quartz: 3, iron: 2 });
                this.awardRunes(160);
                const locked = D().weaponSchematics.filter((s) => !this.unlockedSchematics.has(s.id));
                if (locked.length) {
                    const pick = BO.Math.pick(locked);
                    this.unlockedSchematics.add(pick.id);
                    BO.SurvivalCareer.unlockBlueprint(pick.id);
                    m.toast(`Meteor mined! +3 Aether Shards & unlocked ${pick.name} blueprint!`);
                } else {
                    m.toast('Meteor mined! +3 Aether Shards & +160 Runes!');
                }
                this.campaign.mark('meteorsLooted', 1, 75);
                this._clearMeteor();
                this.nextMeteor = m.clock + 200;
                return true;
            }
            return false;
        }

        dismantleNearest() {
            const p = BO.Player.pos;
            let best = null, bestD = 4.2;
            for (const piece of this.campaign.placed) {
                if (!piece.alive) continue;
                const d = Math.hypot(piece.x - p.x, piece.z - p.z);
                if (d < bestD) { best = piece; bestD = d; }
            }
            if (!best) {
                this.mode.toast('Stand within 4m of one of your structures to dismantle it.');
                return false;
            }
            best.alive = false;
            const part = best.part || this.mode.structures.get(best.mesh);
            if (part) {
                this.mode.removeSolid(part.mesh, part.collider);
                part.mesh.visible = false;
            }
            const machine = this.machines.find((e) => e.piece === best);
            if (machine) {
                if (machine.head) this.mode.disposeOwned(machine.head);
                if (machine.light) machine.light.removeFromParent();
            }
            for (const mk of this.mode.markers) {
                if (mk.id === 'build:' + best.id || mk.id === 'deepbuild:' + best.id || mk.id === 'infuser:' + best.id || mk.id === 'grace:beacon_' + best.id) {
                    mk.alive = false;
                }
            }
            const fullRefund = (this.modFx?.dismantleRefundPct || 0) >= 1;
            const refund = fullRefund ? { scrap: 3, timber: 2, ingot: 1 } : { scrap: 2, timber: 1 };
            this.mode.grant(refund);
            this.mode.toast(fullRefund ? 'Zero-Waste Dismantle (+3 Salvage, +2 Timber, +1 Iron Ingot).' : 'Structure dismantled (+2 Salvage, +1 Timber).');
            return true;
        }

        repairBase() {
            let count = 0;
            for (const piece of this.campaign.placed) {
                if (!piece.alive || !piece.part) continue;
                const maxHp = piece.type.startsWith('stone') ? 265 : 170;
                if (piece.part.hp < maxHp) {
                    piece.part.hp = maxHp;
                    count++;
                }
            }
            if (!count) {
                this.mode.toast('All built structures are already at full integrity.');
                return false;
            }
            if (!this.mode.spend({ scrap: 1 })) {
                this.mode.toast('Requires 1 Salvage to repair nearby structures.');
                return false;
            }
            this.mode.toast(`Repaired ${count} structure(s).`);
            return true;
        }

        onKill(entity, damageKind) {
            const isBoss = !!entity.bossLabel || entity.isBoss;
            const isPmc = !entity.survivalType;
            const mfx = this.modFx || {};
            const baseRunes = isBoss ? 320 : isPmc ? 55 : 28;
            this.awardRunes(baseRunes);
            if (this.grounded) {
                if (isBoss) {
                    this.grantTechPoints(1);
                    BO.SurvivalCareer.awardCommendations(1);
                    this.campaign.pack.dropBag({ scrap: 4, medkits: 1, ammo556: 20, circuit: 1 }, entity.pos);
                }
                return;
            }
            if (damageKind === 'melee') {
                if (mfx.meleeKillHeal) BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + mfx.meleeKillHeal);
                if (mfx.meleeSiphonHyd) this.hydration = Math.min(100, this.hydration + mfx.meleeSiphonHyd);
            }
            if (isBoss) {
                this.grantTechPoints(1 + (mfx.bossBonusTech || 0));
                if (mfx.bossBonusRunes) this.awardRunes(mfx.bossBonusRunes);
                BO.SurvivalCareer.awardCommendations(1);
                this._spawnLootPouch(entity.pos, { aetherShard: 2 + (mfx.bossExtraShard || 0), scrap: 4, medkits: 1 }, 120, true);
                if (entity.survivalType === 'frostBoss') this.foundTalismans.add('scavenger_scarab');
                if (entity.survivalType === 'cinderBoss' || entity.survivalType === 'apex') this.foundTalismans.add('ironheart_crest');
            } else if (Math.random() < 0.24 * (mfx.schematicLuckMult || 1)) {
                this._spawnLootPouch(entity.pos, Math.random() < 0.5 ? { scrap: 1, cloth: 1 } : { herbs: 1, fiber: 1 }, 12, Math.random() < 0.15 * (mfx.schematicLuckMult || 1));
            }
            if (this.hasInfusion('vampiric')) {
                BO.Player.hp = Math.min(BO.Player.maxHp, BO.Player.hp + 8);
                const eq = this.campaign.pack.equipped;
                if (eq && this.campaign.pack.tools[eq] > 0) {
                    const maxW = BO.SurvivalFrontierData.tools[eq].wear;
                    this.campaign.pack.tools[eq] = Math.min(maxW, this.campaign.pack.tools[eq] + 1);
                }
            }
        }

        _spawnLootPouch(pos, items, runes = 0, pickSchematic = false) {
            const id = 'pouch:' + this.pouchIndex++;
            const mesh = this._mesh(new THREE.DodecahedronGeometry(0.22), pickSchematic ? 0xfacc15 : 0x7dd3fc,
                pos.x, pos.y + 0.22, pos.z, { emissive: pickSchematic ? 0xf59e0b : 0x38bdf8, emissiveIntensity: 0.48 });
            let schematic = null;
            if (pickSchematic) {
                const locked = D().weaponSchematics.filter((s) => !this.unlockedSchematics.has(s.id));
                if (locked.length) schematic = BO.Math.pick(locked).id;
            }
            const marker = this._marker(id, 'Enemy drop', pos.x, pos.y, pos.z, pickSchematic ? 'Collect boss spoils' : 'Collect enemy drop', 0xfacc15);
            this.lootPouches.set(id, { items, runes, schematic, mesh, marker });
        }

        tryRespawnIntercept() {
            if (this.campaign.has('ironRun')) return false;
            const hasBed = this.campaign.placed.some((p) => p.alive && p.type === 'bed');
            const hasGrace = this.kindledShrines.size > 0 || !!this.lastRestPoint;
            if (!hasBed && !hasGrace && !this.campaign.has('soulsDrop')) return false;

            const p = BO.Player;
            this._clearLostEcho();
            if (this.runes > 0 && !this.modFx?.safeRunes) {
                const echoMesh = this._mesh(new THREE.OctahedronGeometry(0.32), 0xfde047, p.pos.x, p.pos.y + 0.85, p.pos.z,
                    { emissive: 0xf59e0b, emissiveIntensity: 0.9 });
                const marker = this._marker('soul-echo', 'Lost Aether Echo', p.pos.x, p.pos.y, p.pos.z, `Reclaim ${this.runes} Aether Runes`, 0xfde047);
                this.lostEcho = { x: p.pos.x, y: p.pos.y, z: p.pos.z, runes: this.runes, mesh: echoMesh, marker };
                this.runes = 0;
            }
            this.pendingRespawn = true;
            BO.SurvivalUI.show('respawn');
            return true;
        }

        respawnAtGrace() {
            const p = BO.Player;
            const bed = this.campaign.placed.find((item) => item.alive && item.type === 'bed');
            const dest = this.lastRestPoint || (bed ? { x: bed.x, y: bed.y, z: bed.z } : { x: 1, y: 0, z: 26 });
            p.pos.set(dest.x, dest.y, dest.z);
            p.vel.set(0, 0, 0);
            p.alive = true;
            p.hp = p.maxHp;
            p.reviveGraceTimer = 5.0;
            this.flaskCharges = this.flaskMax;
            this.bleeding = 0;
            this.infection = 0;
            this.pendingRespawn = false;
            this.mode.toast('Returned to Sanctuary. Reclaim your Lost Aether Echo where you fell!');
            return true;
        }

        _clearLostEcho() {
            if (!this.lostEcho) return;
            this.lostEcho.marker.alive = false;
            this.mode.disposeOwned(this.lostEcho.mesh);
            this.lostEcho = null;
        }

        _clearMeteor() {
            if (!this.meteor) return;
            this.meteor.marker.alive = false;
            this.mode.disposeOwned(this.meteor.rock);
            this.mode.disposeOwned(this.meteor.beam);
            this.meteor = null;
        }

        update(dt) {
            const m = this.mode;
            const p = BO.Player;
            const clock = m.clock;
            const mfx = this.modFx || {};

            // Stealth rating (crouching & quiet cuts enemy detection range dramatically!)
            const movingFast = Math.hypot(p.vel.x, p.vel.z) > 4.2;
            const cloakTech = this.hasTech('t3_tactical') ? 0.78 : 1.0;
            this.stealthFactor = (p.crouching && m.noise < 1.2 ? 0.42 : movingFast ? 1.15 : 0.85) * cloakTech *
                (p.crouching && mfx.stealthFactorMult ? mfx.stealthFactorMult : 1) * (1 - (mfx.fogStealthBonus || 0));

            // Ambient Temperature, Warmth, Hydration & Status Effects
            const areaId = this.campaign.area?.id || 'relay';
            let targetTemp = (areaId === 'frost' ? -4 : areaId === 'cinder' ? 36 : (areaId === 'cavern' || areaId === 'trench') ? 10 : 21) + (mfx.tempOffset || 0);
            if (this.campaign.isNight) targetTemp -= this.campaign.has('freezingNights') ? 19 : 9;
            const nearFire = this.campaign.placed.some((item) => item.alive && ['campfire', 'kiln', 'wallTorch', 'beacon'].includes(item.type) && dist2(item, p.pos) < 5.5) ||
                D().shrines.some((s) => this.kindledShrines.has(s.id) && dist3(s, p.pos) < 5.5);
            if (nearFire) {
                targetTemp += 15;
                this.comfortUntil = Math.max(this.comfortUntil, clock + 12 * (mfx.comfortDurMult || 1));
            }
            this.temp = BO.Math.damp(this.temp, targetTemp, 0.35, dt);

            const needs = this.campaign.options.survivalNeeds !== false;
            if (needs) {
                const hydDrain = (this.campaign.has('hungry') ? 0.18 : 0.09) * (this.temp > 31 ? 1.5 : 1) * (mfx.hydDrainMult || 1);
                this.hydration = Math.max(0, this.hydration - dt * hydDrain);
            }
            if (this.bleeding > 0) this.bleeding = Math.max(0, this.bleeding - dt * (mfx.bleedDecayMult || 1));

            if (clock >= this._lastAmbientTick + 1.0) {
                this._lastAmbientTick = clock;
                if (needs && this.hydration <= 0) p.takeDamage(1);
                if (this.bleeding > 0) p.takeDamage(2);
                if (this.infection >= 70) p.takeDamage(2);
                if (needs && this.temp < 2 && !this.hasTalisman('rad_charm') && !mfx.coldImmune) {
                    p.tacStamina = Math.max(0, p.tacStamina - 0.08);
                    if (this.temp < -3) p.takeDamage(2);
                }
                if (((m.hunger >= 75 && this.hydration >= 75) || mfx.regenMult) && p.hp > 0 && p.hp < p.maxHp && this.bleeding <= 0) {
                    p.hp = Math.min(p.maxHp, p.hp + 1.2 * (mfx.regenMult || 1));
                }
            }

            // Update Automated Base Machines (Turrets, Smelters, Hydro, Spikes, Wire)
            const hasGenerator = this.machines.some((e) => e.piece.alive && e.kind === 'generator');
            const turretBoost = (hasGenerator ? 0.76 : 1) * (this.campaign.has('turretMaster') ? 0.65 : 1);
            const smelterSpeed = (hasGenerator ? 2 : 1) * (mfx.smelterSpeedMult || 1) * (hasGenerator && mfx.powerBoostMult ? mfx.powerBoostMult : 1);
            const hydroSpeed = mfx.hydroSpeedMult || 1;
            const turretDmg = Math.round((this.hasTech('t4_orbital') ? 32 : 22) * (mfx.turretDmgMult || 1));

            for (const entry of this.machines) {
                if (!entry.piece.alive) continue;
                if (entry.kind === 'smelter' && clock >= entry.readyAt) {
                    entry.readyAt = clock + 30 / smelterSpeed;
                    entry.buffer = Math.min(8, entry.buffer + 1);
                } else if (entry.kind === 'hydro' && clock >= entry.readyAt) {
                    entry.readyAt = clock + 45 / hydroSpeed;
                    entry.buffer = Math.min(6, entry.buffer + 1);
                } else if (entry.kind === 'turret' && m.hostilesReleased && clock >= entry.fireAt) {
                    const target = [...m.zombies, ...m.bots].find((u) => u.alive && u.team !== 0 && dist3(u.pos, entry.piece) <= 18);
                    if (target) {
                        entry.fireAt = clock + 0.58 * turretBoost;
                        const origin = new THREE.Vector3(entry.piece.x, entry.piece.y + 1.15, entry.piece.z);
                        const aimPt = target.pos.clone().add(new THREE.Vector3(0, 0.95, 0));
                        if (entry.head) entry.head.rotation.y = Math.atan2(aimPt.x - origin.x, aimPt.z - origin.z);
                        if (BO.World.hasLineOfSight(origin.x, origin.y, origin.z, aimPt.x, aimPt.y, aimPt.z)) {
                            BO.FX?.spawnTracer?.(origin, aimPt, 0x4ade80);
                            BO.Sound?.playShot?.('smg', true);
                            m.hit(target, turretDmg, 'torso', null, 'bullet');
                        }
                    }
                }
            }

            // Perimeter Spikes & Barbed Wire Damage/Slow
            if (clock >= this._trapTick + 0.5) {
                this._trapTick = clock;
                const trapMult = (this.campaign.has('turretMaster') ? 2 : 1) * (mfx.trapDmgMult || 1);
                for (const entry of this.machines) {
                    if (!entry.piece.alive || (entry.kind !== 'spikes' && entry.kind !== 'wire')) continue;
                    for (const u of [...m.zombies, ...m.bots]) {
                        if (!u.alive || u.team === 0 || dist3(u.pos, entry.piece) > 1.85) continue;
                        u.slowTimer = Math.max(u.slowTimer || 0, 1.4);
                        m.hit(u, (entry.kind === 'spikes' ? 12 : 5) * trapMult, 'torso', null, 'melee');
                    }
                }
            }

            // World Events — STRICTLY gated behind hostilesReleased (Never in first 60s!)
            if (!m.hostilesReleased) return;

            // Boss Enrage at <= 50% (or bossPhase2Pct) HP
            const phase2Pct = mfx.bossPhase2Pct || 0.5;
            for (const z of m.zombies) {
                if (z.alive && (z.bossLabel || z.isBoss) && !z.enragedPhase2 && z.hp <= z.maxHp * phase2Pct) {
                    z.enragedPhase2 = true;
                    z.speed *= 1.25;
                    z.damage = Math.round(z.damage * 1.25);
                    BO.FX?.spawnExplosion?.(z.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 3.2, 0xef4444);
                    m.toast(`${z.bossLabel || z.spec.name} enters Phase 2 Rage!`);
                }
            }

            // Crimson Blood Moon Nights
            // Blood Moons rise on every third night (3, 6, 9...), or every night when the mode/modifier asks for it.
            const nightNo = this.campaign.nightNumber;
            const everyNight = this.campaign.has('bloodMoonEveryNight') || this.campaign.options.gameType === 'bloodmoon';
            const triggerNight = nightNo >= 1 && (everyNight || nightNo % 3 === 0);
            if (!this.bloodMoonActive && this.campaign.isNight && triggerNight && this.bloodMoonNightKey !== nightNo) {
                this.bloodMoonActive = true;
                this.bloodMoonNightKey = nightNo;
                this.bloodMoonUntil = clock + 75;
                this.bloodMoonNextWave = clock + 3;
                BO.Sound?.playExplosion?.(0.5);
                m.toast('CRIMSON BLOOD MOON RISES! Survive the 75s night surge for bonus Aether Shards!');
            }
            if (this.bloodMoonActive) {
                if (m.scene?.fog) m.scene.fog.color.setHex(0x521418);
                if (m.weatherLight) m.weatherLight.color.setHex(0xf87171);
                if (clock >= this.bloodMoonNextWave && m.zombies.filter((z) => z.alive).length < m.difficultyRules.enemyCap) {
                    this.bloodMoonNextWave = clock + 11;
                    const angle = Math.random() * Math.PI * 2;
                    const sx = BO.Math.clamp(p.pos.x + Math.cos(angle) * 24, -50, 50);
                    const sz = BO.Math.clamp(p.pos.z + Math.sin(angle) * 24, -50, 38);
                    m.spawnInfected(sx, 0, sz, 'normal', null, true);
                }
                if (clock >= this.bloodMoonUntil) {
                    this.bloodMoonActive = false;
                    this.bloodMoonsSurvived++;
                    if (m.scene?.fog) m.scene.fog.color.setHex(0x8e978b);
                    if (m.weatherLight) m.weatherLight.color.setHex(0xffe2b6);
                    this.awardRunes(250);
                    m.grant({ aetherShard: mfx.bloodMoonDoubleRewards ? 4 : 2, scrap: 4, medkits: 1 });
                    if (mfx.bloodMoonDoubleRewards) this.grantTechPoints(2);
                    BO.SurvivalCareer.awardCommendations(1);
                    this.campaign.mark('bloodMoons', 1, 140);
                    m.toast('Blood Moon survived! +250 Runes, +Aether Shards & +1 Commendation.');
                }
            }

            // Aether Meteor Falls across the 20x Valley
            if (!this.meteor && clock >= this.nextMeteor) {
                const spots = [[-68, 0, 72], [74, 0, 68], [-82, 0, -58], [92, 0, -72], [-152, 0, 12], [154, 0, 118], [-168, 0, -152], [176, 0, 56]];
                const [x, y, z] = BO.Math.pick(spots);
                const rock = this._mesh(new THREE.DodecahedronGeometry(0.75), 0x7c3aed, x, y + 0.55, z, { emissive: 0xa855f7, emissiveIntensity: 0.65 });
                const beam = this._mesh(new THREE.CylinderGeometry(0.18, 0.42, 16, 8), 0xc084fc, x, y + 8.5, z, { transparent: true, opacity: 0.32, emissive: 0xa855f7, emissiveIntensity: 0.8 });
                const marker = this._marker('aether-meteor', 'Aether Meteor Crater', x, y, z, 'Mine Aether Meteor', 0xc084fc);
                this.meteor = { x, y, z, rock, beam, marker };
                m.toast('An Aether Meteor struck the Exclusion Zone! Follow the purple beacon.');
            }
        }

        snapshot() {
            return {
                runes: this.runes,
                attributes: { ...this.attributes },
                kindledShrines: [...this.kindledShrines],
                lastRestPoint: this.lastRestPoint,
                flaskCharges: this.flaskCharges,
                flaskMax: this.flaskMax,
                seedsCollected: [...this.seedsCollected],
                foundTalismans: [...this.foundTalismans],
                equippedTalismans: [...this.equippedTalismans],
                techPoints: this.techPoints,
                unlockedTech: [...this.unlockedTech],
                unlockedSchematics: [...this.unlockedSchematics],
                infusions: [...this.infusions],
                hydration: this.hydration,
                temp: this.temp,
                comfortUntil: this.comfortUntil,
                bleeding: this.bleeding,
                infection: this.infection,
                activeTonics: { ...this.activeTonics },
                bloodMoonsSurvived: this.bloodMoonsSurvived,
                bloodMoonNightKey: this.bloodMoonNightKey,
                nextMeteor: this.nextMeteor,
                lostEcho: this.lostEcho ? { x: this.lostEcho.x, y: this.lostEcho.y, z: this.lostEcho.z, runes: this.lostEcho.runes } : null
            };
        }

        restore(state) {
            if (!state) return;
            this._computeModFx();
            this.runes = Number(state.runes) || 0;
            this.attributes = { ...this.attributes, ...(state.attributes || {}) };
            this.kindledShrines = new Set(state.kindledShrines || []);
            this.lastRestPoint = state.lastRestPoint || null;
            this.flaskCharges = state.flaskCharges ?? 3;
            this.flaskMax = state.flaskMax ?? 3;
            this.seedsCollected = new Set(state.seedsCollected || []);
            this.foundTalismans = new Set(state.foundTalismans || []);
            this.equippedTalismans = Array.isArray(state.equippedTalismans) ? state.equippedTalismans.slice(0, 3) : [];
            this.techPoints = Number.isFinite(state.techPoints) ? state.techPoints : this.techPoints;
            this.unlockedTech = new Set(state.unlockedTech || []);
            this.unlockedSchematics = new Set(state.unlockedSchematics || []);
            this.infusions = Array.isArray(state.infusions) ? state.infusions.slice(0, 2) : [];
            this.hydration = state.hydration ?? 100;
            this.temp = state.temp ?? 20;
            this.comfortUntil = state.comfortUntil ?? 0;
            this.bleeding = state.bleeding ?? 0;
            this.infection = state.infection ?? 0;
            this.activeTonics = { ...(state.activeTonics || {}) };
            this.bloodMoonsSurvived = state.bloodMoonsSurvived || 0;
            this.bloodMoonNightKey = state.bloodMoonNightKey ?? -1;
            this.nextMeteor = state.nextMeteor ?? (this.mode.clock + 185);
            this._clearLostEcho();
            for (const mk of this.ownMarkers) {
                if (mk.shrineObj && this.kindledShrines.has(mk.shrineObj.id)) {
                    mk.shrineObj.flame.material.color.setHex(0xfde047);
                    mk.shrineObj.flame.material.emissive.setHex(0xf59e0b);
                    mk.label = 'Rest at ' + mk.shrineObj.name;
                }
            }
            if (state.lostEcho) {
                const echoMesh = this._mesh(new THREE.OctahedronGeometry(0.32), 0xfde047, state.lostEcho.x, state.lostEcho.y + 0.85, state.lostEcho.z,
                    { emissive: 0xf59e0b, emissiveIntensity: 0.9 });
                const marker = this._marker('soul-echo', 'Lost Aether Echo', state.lostEcho.x, state.lostEcho.y, state.lostEcho.z, `Reclaim ${state.lostEcho.runes} Aether Runes`, 0xfde047);
                this.lostEcho = { ...state.lostEcho, mesh: echoMesh, marker };
            }
            this.recomputePlayerStats();
        }

        stop() {
            for (const mesh of this.owned) this.mode.disposeOwned(mesh);
            this.owned.clear();
            for (const mk of this.ownMarkers) {
                const i = this.mode.markers.indexOf(mk);
                if (i >= 0) this.mode.markers.splice(i, 1);
            }
            this.ownMarkers.clear();
            for (const e of this.machines) if (e.light) e.light.removeFromParent();
            this.machines.length = 0;
            this.lootPouches.clear();
        }
    }

    function pOrZ(piece) { return piece.z; }

    BO.SurvivalDeepSystems = SurvivalDeepSystems;
})(window.BO);
